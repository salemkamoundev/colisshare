import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CollaborationService } from '../../services/collaboration.service';
import { ChatService } from '../../services/chat.service';
import { Observable, of } from 'rxjs';
import { switchMap, map, tap } from 'rxjs/operators';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
})
export class HeaderComponent implements OnInit {
  private auth = inject(AuthService);
  private collabService = inject(CollaborationService);
  private chatService = inject(ChatService);
  private router = inject(Router);

  user$: Observable<User | null> = this.auth.user$;

  // Notification Collab (Badge réel basé sur 'pending')
  collabCount$: Observable<number> = this.user$.pipe(
    switchMap(user => {
      if (!user) return of(0);
      return this.collabService.getIncomingRequests(user.uid).pipe(
        map(reqs => reqs.filter(r => r.status === 'pending').length)
      );
    })
  );

  // Notification Chat
  chatCount$: Observable<number> = this.chatService.unreadCount$;

  ngOnInit() {
    // Lancer l'écoute des conversations pour les notifications Chat
    this.user$.subscribe(user => {
      if (user) {
        this.collabService.getAcceptedCollaborations(user.uid).subscribe(collabs => {
          // Calculer les IDs de conversation : chat_userA_userB (triés)
          const chatIds = collabs.map(c => {
            const p1 = c.fromUserId;
            const p2 = c.toUserId;
            const sorted = [p1, p2].sort();
            return `chat_${sorted[0]}_${sorted[1]}`;
          });
          
          // Dire au ChatService d'écouter ces IDs
          if (chatIds.length > 0) {
            this.chatService.watchConversations(chatIds, user.uid);
          }
        });
      }
    });
  }

  async logout() {
    try {
      await this.auth.logout();
      this.router.navigate(['/']);
    } catch (error) {
      console.error(error);
    }
  }
}
