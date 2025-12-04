import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CollaborationService } from '../../services/collaboration.service';
import { CollaborationRequest } from '../../interfaces/collaboration-request.interface';
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

  // --- DONNEES BRUTES ---
  allUsers$ = this.collab.getAllUsers();

  incomingRequests$ = this.currentUser$.pipe(
    switchMap(u => u ? this.collab.getIncomingRequests(u.uid) : of([])),
    map(reqs => reqs.filter(r => r.status === 'pending' || r.status === 'price_proposed'))
  );

  outgoingRequests$ = this.currentUser$.pipe(
    switchMap(u => u ? this.collab.getOutgoingRequests(u.uid) : of([])),
    map(reqs => reqs.filter(r => r.status === 'pending' || r.status === 'price_proposed'))
  );

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

  historyRequests$ = this.currentUser$.pipe(
    switchMap(u => {
      if(!u) return of([]);
      return combineLatest([
        this.collab.getIncomingRequests(u.uid),
        this.collab.getOutgoingRequests(u.uid)
      ]).pipe(
        map(([inc, out]) => {
          const all = [...inc, ...out];
          return all.filter(r => r.status === 'completed' || r.status === 'rejected')
                    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        })
      );
    })
  );

  // --- COMPTEURS (POUR LES BADGES) ---
  allUsersCount$ = this.allUsers$.pipe(map(users => users.length));
  incomingCount$ = this.incomingRequests$.pipe(map(reqs => reqs.length));
  outgoingCount$ = this.outgoingRequests$.pipe(map(reqs => reqs.length));
  confirmedCount$ = this.confirmedRequests$.pipe(map(reqs => reqs.length));
  historyCount$ = this.historyRequests$.pipe(map(reqs => reqs.length));

  // --- MODALES ---
  showPriceModal = false;
  showRequestModal = false;
  selectedReq: CollaborationRequest | null = null;
  selectedTargetUser: AppUser | null = null;
  priceForm = { price: 0, note: '' };
  requestForm = { description: '', clientName: '', clientAddress: '' };

  setActiveTab(tab: any) { this.activeTab = tab; }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'En attente';
      case 'price_proposed': return 'Prix Proposé';
      case 'confirmed': return 'Validé / En cours';
      case 'completed': return 'Terminé';
      case 'rejected': return 'Refusé';
      default: return status;
    }
  }

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
    if(req.id && confirm("Refuser cette collaboration ?")) {
      await this.collab.declineRequest(req.id);
      this.setActiveTab('history');
    }
  }

  accept(req: CollaborationRequest) { this.openPriceModal(req); }
  closeAcceptModal() { this.showPriceModal = false; }
  confirmAccept() { this.submitPrice(); }
  deleteCollab(req: CollaborationRequest) { if(req.id && confirm('Supprimer ?')) this.collab.deleteCollaboration(req.id); }
  get acceptFormModel() { return this.priceForm; }
}
