import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // CommonModule contient DatePipe pour le template
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CollaborationService } from '../../services/collaboration.service';
import { FirestoreService, Trip } from '../../services/firestore.service';
import { CollaborationRequest, PackageDetails } from '../../interfaces/collaboration-request.interface';
import { AppUser } from '../../interfaces/user.interface';
// HeaderComponent retiré car géré globalement
import { Observable, switchMap, of, map, combineLatest } from 'rxjs';

@Component({
  selector: 'app-collab-requests-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './collab-requests-page.component.html',
})
export class CollaborationRequestsPageComponent {
  private auth = inject(AuthService);
  private collab = inject(CollaborationService);
  private firestoreService = inject(FirestoreService);

  currentUser$ = this.auth.user$;
  activeTab: 'search' | 'incoming' | 'outgoing' | 'confirmed' | 'history' = 'search';

  allUsers$ = this.collab.getAllUsers();
  
  incomingRequests$ = this.currentUser$.pipe(switchMap(u => u ? this.collab.getIncomingRequests(u.uid) : of([])), map(reqs => reqs.filter(r => r.status === 'pending' || r.status === 'price_proposed')));
  outgoingRequests$ = this.currentUser$.pipe(switchMap(u => u ? this.collab.getOutgoingRequests(u.uid) : of([])), map(reqs => reqs.filter(r => r.status === 'pending' || r.status === 'price_proposed')));
  confirmedRequests$ = this.currentUser$.pipe(switchMap(u => u ? combineLatest([this.collab.getIncomingRequests(u.uid), this.collab.getOutgoingRequests(u.uid)]).pipe(map(([i, o]) => [...i, ...o].filter(r => r.status === 'confirmed'))) : of([])));
  historyRequests$ = this.currentUser$.pipe(switchMap(u => u ? combineLatest([this.collab.getIncomingRequests(u.uid), this.collab.getOutgoingRequests(u.uid)]).pipe(map(([i, o]) => [...i, ...o].filter(r => r.status === 'completed' || r.status === 'rejected'))) : of([])));

  allUsersCount$ = this.allUsers$.pipe(map(u => u.length));
  incomingCount$ = this.incomingRequests$.pipe(map(r => r.length));
  outgoingCount$ = this.outgoingRequests$.pipe(map(r => r.length));
  confirmedCount$ = this.confirmedRequests$.pipe(map(r => r.length));
  historyCount$ = this.historyRequests$.pipe(map(r => r.length));

  showTripListModal = false; showTripDetailModal = false; showRequestModal = false; showPriceModal = false;
  selectedTargetUser: AppUser | null = null; targetUserTrips: Trip[] = []; selectedTrip: Trip | null = null;
  selectedReq: CollaborationRequest | null = null; requestToAccept: CollaborationRequest | null = null;
  priceForm = { price: 0, note: '' }; requestForm: PackageDetails = { description: '', clientName: '', clientAddress: '' };

  setActiveTab(tab: any) { this.activeTab = tab; }
  getStatusLabel(s: string) { const l:any={pending:'En attente',price_proposed:'Offre reçue',confirmed:'Validé',completed:'Terminé',rejected:'Refusé'}; return l[s]||s; }

  openTripListModal(u: AppUser) { this.selectedTargetUser = u; this.targetUserTrips = []; this.firestoreService.getTrips(u.uid).subscribe(t => { this.targetUserTrips = t.filter(x => x.status==='pending'||x.status==='in_progress'); this.showTripListModal = true; }); }
  closeTripListModal() { this.showTripListModal = false; this.selectedTargetUser = null; }
  viewTripDetails(t: Trip) { this.selectedTrip = t; this.showTripListModal = false; this.showTripDetailModal = true; }
  closeTripDetailModal() { this.showTripDetailModal = false; this.showTripListModal = true; this.selectedTrip = null; }
  selectTripAndOpenRequest() { if(!this.selectedTrip) return; this.showTripDetailModal = false; this.requestForm = { description: '', clientName: '', clientAddress: '' }; this.showRequestModal = true; }
  closeRequestModal() { this.showRequestModal = false; }
  
  async submitRequest(uid: string) {
    if (!this.selectedTargetUser || !this.selectedTrip?.id || !this.requestForm.description) { alert("Manque infos"); return; }
    try { await this.collab.sendRequest(uid, this.selectedTargetUser.uid, this.requestForm, this.selectedTrip.id); alert('Envoyé !'); this.closeRequestModal(); this.setActiveTab('outgoing'); } catch (e: any) { alert(e.message); }
  }

  openPriceModal(req: CollaborationRequest) { this.selectedReq = req; this.priceForm = { price: 0, note: '' }; this.showPriceModal = true; }
  async submitPrice() { if(!this.selectedReq?.id) return; await this.collab.proposePrice(this.selectedReq.id, this.priceForm.price, this.priceForm.note); this.showPriceModal = false; }
  async confirmPrice(req: CollaborationRequest) { if(req.id && confirm('Valider ?')) { await this.collab.confirmCollaboration(req.id); this.setActiveTab('confirmed'); } }
  async completeMission(req: CollaborationRequest) { if(req.id && confirm('Terminer ?')) { await this.collab.markAsCompleted(req.id); this.setActiveTab('history'); } }
  async decline(req: CollaborationRequest) { if(req.id && confirm('Refuser ?')) await this.collab.declineRequest(req.id); }

  accept(req: CollaborationRequest) { this.openPriceModal(req); }
  closeAcceptModal() { this.showPriceModal = false; }
  confirmAccept() { this.submitPrice(); }
  deleteCollab(req: CollaborationRequest) { if(req.id && confirm('Supprimer ?')) this.collab.deleteCollaboration(req.id); }
  get acceptFormModel() { return this.priceForm; }
  formatDate(val: any) { if(!val) return ''; try { return new Date(val.toDate?val.toDate():val).toLocaleString(); } catch { return ''; } }
}
