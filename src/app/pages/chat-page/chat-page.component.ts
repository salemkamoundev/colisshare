import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CollaborationService } from '../../services/collaboration.service';
import { ChatService } from '../../services/chat.service';
import { ChatComponent } from '../../components/chat/chat.component';
import { AppUser } from '../../interfaces/user.interface';
import { Observable, combineLatest, of } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

// Interface publique pour être accessible par le template HTML
export interface PartnerViewModel {
  details: AppUser;
  chatId: string;
  unread$: Observable<number>; // Nom exact utilisé dans le HTML
}

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [CommonModule, ChatComponent, FormsModule],
  templateUrl: './chat-page.component.html',
})
export class ChatPageComponent {
  private auth = inject(AuthService);
  private collabService = inject(CollaborationService);
  private chatService = inject(ChatService);

  currentUser$ = this.auth.user$;
  selectedPartner: AppUser | null = null;
  currentConversationId: string = '';

  collaborators$: Observable<PartnerViewModel[]> = combineLatest([
    this.currentUser$,
    this.collabService.getAllUsers()
  ]).pipe(
    switchMap(([currentUser, allUsers]) => {
      if (!currentUser) return of([]);

      return this.collabService.getAcceptedCollaborations(currentUser.uid).pipe(
        map(collabs => {
          const partnersMap = new Map<string, PartnerViewModel>();

          collabs.forEach((c: any) => {
            const partnerId = c.fromUserId === currentUser.uid ? c.toUserId : c.fromUserId;
            const partnerDetails = allUsers.find(u => u.uid === partnerId);
            
            if (partnerDetails && !partnersMap.has(partnerId)) {
              // Calcul ID Conversation (Tri alphabétique pour unicité A-B vs B-A)
              const participants = [currentUser.uid, partnerId].sort();
              const chatId = `chat_${participants[0]}_${participants[1]}`;

              partnersMap.set(partnerId, {
                details: partnerDetails,
                chatId: chatId,
                unread$: this.chatService.getUnreadCountForConversation(chatId, currentUser.uid)
              });
            }
          });

          return Array.from(partnersMap.values());
        })
      );
    })
  );

  selectPartner(vm: PartnerViewModel) {
    this.selectedPartner = vm.details;
    this.currentConversationId = vm.chatId;
  }
}
