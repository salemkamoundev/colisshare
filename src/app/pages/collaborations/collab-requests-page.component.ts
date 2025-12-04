import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CollaborationService } from '../../services/collaboration.service';
import { CollaborationRequest } from '../../interfaces/collaboration-request.interface';
import { HeaderComponent } from '../../components/header/header.component';
import { Observable, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-collab-requests-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HeaderComponent],
  templateUrl: './collab-requests-page.component.html',
})
export class CollaborationRequestsPageComponent {
  private auth = inject(AuthService);
  private collab = inject(CollaborationService);
  private router = inject(Router);

  currentUser$ = this.auth.user$;
  
  // Utilisation d'un type union strict pour satisfaire le template
  activeTab: 'pending' | 'accepted' | 'search' = 'pending';

  // Propriété requise par le template pour l'onglet 'search'
  allUsers$ = this.collab.getAllUsers();
  
  pendingRequests$ = this.currentUser$.pipe(
    switchMap(user => user ? this.collab.getPendingRequests(user.uid) : of([]))
  );

  acceptedCollaborations$ = this.currentUser$.pipe(
    switchMap(user => user ? this.collab.getAcceptedCollaborations(user.uid) : of([]))
  );

  showAcceptModal = false;
  requestToAccept: CollaborationRequest | null = null;
  acceptForm = { price: 0, note: '' };

  // Méthode avec type strict pour correspondre à la variable
  setActiveTab(tab: 'pending' | 'accepted' | 'search') {
    this.activeTab = tab;
  }

  // --- ACTIONS ---

  // Méthode appelée par le HTML (bouton 'Contacter')
  sendRequest(targetId: string, currentUserId: string) {
    if(confirm("Pour détailler votre colis, passez par la page 'Trouver un transporteur'. Voulez-vous y aller ?")) {
       // On redirige vers la page /utilisateurs (ou la page actuelle si c'est la même)
       // Pour l'instant, on reste ici et on pourrait ouvrir une modale, 
       // mais la demande simple a été désactivée dans le service.
       // Idéalement : this.router.navigate(['/utilisateurs']);
       alert("Fonctionnalité déplacée dans le menu 'Trouver un transporteur'.");
    }
  }

  // --- LOGIQUE ACCEPTATION ---

  // Alias pour le template (bouton 'Accepter')
  accept(req: CollaborationRequest) {
    this.initiateAccept(req);
  }

  initiateAccept(req: CollaborationRequest) {
    this.requestToAccept = req;
    this.acceptForm = { price: 0, note: '' };
    this.showAcceptModal = true;
  }

  closeAcceptModal() {
    this.showAcceptModal = false;
    this.requestToAccept = null;
  }

  async confirmAccept() {
    if (!this.requestToAccept?.id) return;
    if (this.acceptForm.price <= 0) {
      alert("Montant invalide");
      return;
    }
    try {
      await this.collab.acceptRequest(
        this.requestToAccept.id, 
        this.acceptForm.price, 
        this.acceptForm.note
      );
      this.closeAcceptModal();
      this.setActiveTab('accepted');
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
  }

  async decline(req: CollaborationRequest) {
    if (!req.id) return;
    if (confirm('Refuser ?')) await this.collab.declineRequest(req.id);
  }

  async deleteCollab(req: CollaborationRequest) {
    if (!req.id) return;
    if (confirm('Supprimer ?')) await this.collab.deleteCollaboration(req.id);
  }
}
