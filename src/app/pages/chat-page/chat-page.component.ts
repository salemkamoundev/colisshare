import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CollaborationService } from '../../services/collaboration.service';
import { ChatComponent } from '../../components/chat/chat.component';
import { AppUser } from '../../interfaces/user.interface';
import { Observable, combineLatest, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [CommonModule, ChatComponent, FormsModule],
  templateUrl: './chat-page.component.html',
})
export class ChatPageComponent {
  private auth = inject(AuthService);
  private collabService = inject(CollaborationService);

  currentUser$ = this.auth.user$;
  selectedPartner: AppUser | null = null;
  currentConversationId: string = '';

  collaborators$: Observable<AppUser[]> = combineLatest([
    this.currentUser$,
    this.collabService.getAllUsers()
  ]).pipe(
    switchMap(([currentUser, allUsers]) => {
      if (!currentUser) return of([]);
      // On utilise getAcceptedCollaborations qui est maintenant bien défini dans le service
      return this.collabService.getAcceptedCollaborations(currentUser.uid).pipe(
        map(collabs => {
          const partnersMap = new Map<string, AppUser>();
          collabs.forEach((c: any) => { // Type any pour éviter erreur compilation stricte temporaire
            const partnerId = c.fromUserId === currentUser.uid ? c.toUserId : c.fromUserId;
            const partnerDetails = allUsers.find(u => u.uid === partnerId);
            if (partnerDetails) partnersMap.set(partnerId, partnerDetails);
          });
          return Array.from(partnersMap.values());
        })
      );
    })
  );

  selectPartner(partner: AppUser, currentUserId: string) {
    this.selectedPartner = partner;
    const participants = [currentUserId, partner.uid].sort();
    this.currentConversationId = `chat_${participants[0]}_${participants[1]}`;
  }
}
