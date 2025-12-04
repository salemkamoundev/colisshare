import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CollaborationService } from '../../services/collaboration.service';
import { CollaborationRequest, PackageDetails } from '../../interfaces/collaboration-request.interface';
import { AppUser } from '../../interfaces/user.interface';
import { HeaderComponent } from '../../components/header/header.component';
import { Observable, switchMap, of, map, combineLatest } from 'rxjs';

@Component({
  selector: 'app-collab-requests-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, HeaderComponent],
  templateUrl: './collab-requests-page.component.html',
})
export class CollaborationRequestsPageComponent {
  private auth = inject(AuthService);
  private collab = inject(CollaborationService);

  currentUser$ = this.auth.user$;
  
  activeTab: 'search' | 'incoming' | 'outgoing' | 'confirmed' | 'history' = 'search';

  // --- DONNEES ---
  allUsers$ = this.collab.getAllUsers();

  // 1. Reçues (À traiter)
  incomingRequests$ = this.currentUser$.pipe(
    switchMap(u => u ? this.collab.getIncomingRequests(u.uid) : of([])),
    map(reqs => reqs.filter(r => r.status === 'pending' || r.status === 'price_proposed'))
  );

  // 2. Envoyées (En attente)
  outgoingRequests$ = this.currentUser$.pipe(
    switchMap(u => u ? this.collab.getOutgoingRequests(u.uid) : of([])),
    map(reqs => reqs.filter(r => r.status === 'pending' || r.status === 'price_proposed'))
  );

  // 3. Actives (Confirmées)
  confirmedRequests$ = this.currentUser$.pipe(
    switchMap(u => {
      if(!u) return of([]);
      return combineLatest([
        this.collab.getIncomingRequests(u.uid),
        this.collab.getOutgoingRequests(u.uid)
      ]).pipe(
        map(([inc, out]) => [...inc, ...out].filter(r => r.status === 'confirmed'))
      );
    })
  );

  // 4. HISTORIQUE COMPLET (Terminées + Rejetées)
  historyRequests$ = this.currentUser$.pipe(
    switchMap(u => {
      if(!u) return of([]);
      return combineLatest([
        this.collab.getIncomingRequests(u.uid),
        this.collab.getOutgoingRequests(u.uid)
      ]).pipe(
        map(([inc, out]) => {
          // On combine tout et on filtre
          const all = [...inc, ...out];
          // On garde Completed et Rejected
          return all.filter(r => r.status === 'completed' || r.status === 'rejected')
                    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)); // Tri par date récente
        })
      );
    })
  );

  // --- COMPTEURS POUR NOTIFICATIONS ---
  // On crée un observable pour savoir s'il y a des refus récents non lus (simulé ici par la présence dans l'historique)
  rejectedCount$ = this.historyRequests$.pipe(
    map(reqs => reqs.filter(r => r.status === 'rejected').length)
  );

  // --- MODALES ---
  showPriceModal = false;
  showRequestModal = false;
  
  selectedReq: CollaborationRequest | null = null;
  selectedTargetUser: AppUser | null = null;

  priceForm = { price: 0, note: '' };
  requestForm: PackageDetails = { description: '', clientName: '', clientAddress: '' };

  setActiveTab(tab: any) { this.activeTab = tab; }

  // --- ACTIONS ---

  openRequestModal(targetUser: AppUser) {
    this.selectedTargetUser = targetUser;
    this.requestForm = { description: '', clientName: '', clientAddress: '' };
    this.showRequestModal = true;
  }

  closeRequestModal() {
    this.showRequestModal = false;
    this.selectedTargetUser = null;
  }

  async submitRequest(currentUserId: string) {
    if (!this.selectedTargetUser || !this.requestForm.description) return;
    try {
      await this.collab.sendRequest(currentUserId, this.selectedTargetUser.uid, this.requestForm);
      alert(`✅ Demande envoyée !`);
      this.closeRequestModal();
      this.setActiveTab('outgoing');
    } catch (e: any) {
      alert("Erreur: " + e.message);
    }
  }

  openPriceModal(req: CollaborationRequest) {
    this.selectedReq = req;
    this.priceForm = { price: 0, note: '' };
    this.showPriceModal = true;
  }

  async submitPrice() {
    if (!this.selectedReq?.id || this.priceForm.price <= 0) return;
    await this.collab.proposePrice(this.selectedReq.id, this.priceForm.price, this.priceForm.note);
    this.showPriceModal = false;
    alert("✅ Offre envoyée.");
  }

  async confirmPrice(req: CollaborationRequest) {
    if (!req.id) return;
    if (confirm(`Accepter le devis de ${req.response?.price} TND ?`)) {
      await this.collab.confirmCollaboration(req.id);
      this.setActiveTab('confirmed');
    }
  }

  async completeMission(req: CollaborationRequest) {
    if (!req.id) return;
    if (confirm("Confirmer la fin de la mission ?")) {
      await this.collab.markAsCompleted(req.id);
      this.setActiveTab('history');
    }
  }

  async decline(req: CollaborationRequest) {
    if(req.id && confirm("Refuser cette collaboration ? Elle sera archivée dans l'historique.")) {
      await this.collab.declineRequest(req.id);
      this.setActiveTab('history'); // Redirection pour voir le refus archivé
    }
  }

  // Méthodes requises par le HTML (aliases)
  accept(req: CollaborationRequest) { this.openPriceModal(req); }
  closeAcceptModal() { this.showPriceModal = false; }
  confirmAccept() { this.submitPrice(); } // Le HTML appelle confirmAccept pour valider le prix
  deleteCollab(req: CollaborationRequest) { if(req.id && confirm('Supprimer définitivement ?')) this.collab.deleteCollaboration(req.id); }
  
  // Getter pour le formulaire html
  get acceptFormModel() { return this.priceForm; }
}
