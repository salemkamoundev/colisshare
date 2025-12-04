import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CollaborationService, CollaborationRequest } from '../../services/collaboration.service';
import { HeaderComponent } from '../../components/header/header.component';
import { Observable, switchMap, of, combineLatest, map } from 'rxjs';

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

  // Données
  allUsers$ = this.collab.getAllUsers();
  
  pendingRequests$ = this.currentUser$.pipe(
    switchMap(user => user ? this.collab.getPendingRequests(user.uid) : of([]))
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

  async accept(req: CollaborationRequest) {
    if(!req.id) return;
    try {
      await this.collab.acceptRequest(req.id);
    } catch (e) { console.error(e); }
  }

  async decline(req: CollaborationRequest) {
    if(!req.id) return;
    if(confirm('Refuser cette demande ?')) {
      await this.collab.declineRequest(req.id);
    }
  }

  async deleteCollab(req: CollaborationRequest) {
    if(!req.id) return;
    if(confirm('Êtes-vous sûr de vouloir supprimer cette collaboration ?')) {
      await this.collab.deleteCollaboration(req.id);
    }
  }

  setActiveTab(tab: 'search' | 'pending' | 'accepted') {
    this.activeTab = tab;
  }
}
