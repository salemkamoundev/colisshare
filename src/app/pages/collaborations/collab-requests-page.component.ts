import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CollaborationService, CollaborationRequest } from '../../services/collaboration.service';
import { HeaderComponent } from '../../components/header/header.component';
import { switchMap, of } from 'rxjs';

@Component({
  selector: 'app-collab-requests-page',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent],
  templateUrl: './collab-requests-page.component.html',
})
export class CollaborationRequestsPageComponent {
  private auth = inject(AuthService);
  private collab = inject(CollaborationService);

  currentUser$ = this.auth.user$;
  activeTab: 'search' | 'pending' | 'accepted' = 'search';

  // Variables utilisées dans le HTML
  allUsers$ = this.collab.getAllUsers();
  
  pendingRequests$ = this.currentUser$.pipe(
    switchMap(user => user ? this.collab.getPendingRequestsForUser(user.uid) : of([]))
  );

  acceptedCollaborations$ = this.currentUser$.pipe(
    switchMap(user => user ? this.collab.getAcceptedCollaborations(user.uid) : of([]))
  );

  // Actions
  async sendRequest(targetId: string, currentUserId: string) {
    try {
      await this.collab.sendRequest(currentUserId, targetId);
      alert('✅ Demande envoyée !');
    } catch (err: any) {
      alert('❌ ' + err.message);
    }
  }

  async accept(c: CollaborationRequest) {
    if (!c.id) return;
    try {
      await this.collab.updateRequestStatus(c.id, 'accepted');
    } catch(e) { console.error(e); }
  }

  // Nommé 'decline' ici, il faut utiliser 'decline' dans le HTML (pas reject)
  async decline(c: CollaborationRequest) {
    if (!c.id) return;
    if (confirm('Refuser cette demande ?')) {
      await this.collab.updateRequestStatus(c.id, 'rejected');
    }
  }

  async deleteCollab(c: CollaborationRequest) {
    if (!c.id) return;
    if (confirm('Supprimer cette collaboration ?')) {
      await this.collab.deleteCollaboration(c.id);
    }
  }

  setActiveTab(tab: 'search' | 'pending' | 'accepted') {
    this.activeTab = tab;
  }
}
