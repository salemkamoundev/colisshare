#!/bin/bash

echo "📜 Configuration de l'historique complet et des notifications de refus..."

# ==============================================================================
# 1. MISE À JOUR DU TYPESCRIPT (Logique Historique + Filtres)
# ==============================================================================
cat << 'EOF' > ./src/app/pages/collab-requests/collab-requests-page.component.ts
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
EOF

# ==============================================================================
# 2. MISE À JOUR DU HTML (Affichage Historique Détaillé)
# ==============================================================================
cat << 'EOF' > ./src/app/pages/collab-requests/collab-requests-page.component.html
<div class="min-h-screen bg-gray-50 p-6">
  <div class="max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">Suivi des Collaborations</h1>

    <div class="flex border-b border-gray-200 mb-6 overflow-x-auto bg-white rounded-t-lg shadow-sm">
      
      <button (click)="setActiveTab('search')" 
              [class.text-indigo-600]="activeTab==='search'" [class.border-indigo-600]="activeTab==='search'" 
              class="whitespace-nowrap px-6 py-4 border-b-2 font-medium border-transparent hover:bg-gray-50 transition">
        🔍 Annuaire
      </button>

      <button (click)="setActiveTab('incoming')" 
              [class.text-blue-600]="activeTab==='incoming'" [class.border-blue-600]="activeTab==='incoming'" 
              class="whitespace-nowrap px-6 py-4 border-b-2 font-medium border-transparent hover:bg-gray-50 transition">
        📥 Reçues
        <ng-container *ngIf="incomingRequests$ | async as reqs">
           <span *ngIf="reqs.length > 0" class="ml-1 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">{{reqs.length}}</span>
        </ng-container>
      </button>

      <button (click)="setActiveTab('outgoing')" 
              [class.text-blue-600]="activeTab==='outgoing'" [class.border-blue-600]="activeTab==='outgoing'" 
              class="whitespace-nowrap px-6 py-4 border-b-2 font-medium border-transparent hover:bg-gray-50 transition">
        📤 Envoyées
      </button>

      <button (click)="setActiveTab('confirmed')" 
              [class.text-green-700]="activeTab==='confirmed'" [class.border-green-600]="activeTab==='confirmed'" 
              class="whitespace-nowrap px-6 py-4 border-b-2 font-medium border-transparent hover:bg-gray-50 transition">
        ✅ Actives
      </button>

      <button (click)="setActiveTab('history')" 
              [class.text-gray-900]="activeTab==='history'" [class.border-gray-600]="activeTab==='history'" 
              class="whitespace-nowrap px-6 py-4 border-b-2 font-medium border-transparent hover:bg-gray-50 transition relative">
        🏁 Historique
        <ng-container *ngIf="rejectedCount$ | async as count">
          <span *ngIf="count > 0" class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
        </ng-container>
      </button>
    </div>

    <div *ngIf="activeTab === 'search'" class="animate-fade-in">
      <ng-container *ngIf="allUsers$ | async as users">
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div *ngFor="let user of users" class="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">{{ user.displayName?.charAt(0) || '?' }}</div>
              <div><h3 class="font-bold text-gray-900 truncate">{{ user.displayName }}</h3><p class="text-xs text-gray-500 truncate">{{ user.email }}</p></div>
            </div>
            <ng-container *ngIf="currentUser$ | async as me">
              <button *ngIf="user.uid !== me.uid" (click)="openRequestModal(user)" class="w-full py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100">Collaborer</button>
            </ng-container>
          </div>
        </div>
      </ng-container>
    </div>

    <div *ngIf="activeTab === 'incoming'" class="space-y-4 animate-fade-in">
      <ng-container *ngIf="incomingRequests$ | async as requests">
        <div *ngIf="requests.length === 0" class="text-gray-500 text-center py-10">Rien à traiter.</div>
        <div *ngFor="let r of requests" class="bg-white p-5 rounded-lg shadow border-l-4" [class.border-yellow-400]="r.status==='pending'" [class.border-blue-400]="r.status==='price_proposed'">
          <div class="flex justify-between">
            <h3 class="font-bold">De : {{ r.fromUserId | slice:0:5 }}...</h3>
            <span class="text-xs px-2 py-1 rounded font-bold" [ngClass]="{'bg-yellow-100': r.status==='pending', 'bg-blue-100': r.status==='price_proposed'}">{{ r.status }}</span>
          </div>
          <p class="text-sm text-gray-600 mt-2">📦 {{ r.packageDetails.description }}</p>
          <div class="mt-4 flex gap-2" *ngIf="r.status === 'pending'">
            <button (click)="openPriceModal(r)" class="bg-green-600 text-white px-3 py-1.5 rounded text-sm">Accepter</button>
            <button (click)="decline(r)" class="bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-sm">Refuser</button>
          </div>
          <p *ngIf="r.status === 'price_proposed'" class="text-xs text-blue-600 mt-2">En attente validation client.</p>
        </div>
      </ng-container>
    </div>

    <div *ngIf="activeTab === 'outgoing'" class="space-y-4 animate-fade-in">
      <ng-container *ngIf="outgoingRequests$ | async as requests">
        <div *ngIf="requests.length === 0" class="text-gray-500 text-center py-10">Aucune demande en cours.</div>
        <div *ngFor="let r of requests" class="bg-white p-5 rounded-lg shadow border border-gray-200">
          <div class="flex justify-between">
            <h3 class="font-bold">Vers : {{ r.toUserId | slice:0:5 }}...</h3>
            <span class="text-xs px-2 py-1 rounded font-bold" [ngClass]="{'bg-yellow-100': r.status==='pending', 'bg-green-100': r.status==='price_proposed'}">{{ r.status === 'pending' ? 'Attente' : 'Offre Reçue' }}</span>
          </div>
          <p class="text-sm text-gray-600 mt-2">📦 {{ r.packageDetails.description }}</p>
          
          <div *ngIf="r.status === 'price_proposed'" class="mt-4 bg-green-50 p-3 rounded border border-green-200 animate-pulse">
            <p class="font-bold text-green-800">Offre : {{ r.response?.price }} TND</p>
            <p class="text-xs text-green-700 italic">"{{ r.response?.note }}"</p>
            <div class="mt-3 flex gap-2">
              <button (click)="confirmPrice(r)" class="bg-green-600 text-white px-3 py-1.5 rounded text-sm">Valider</button>
              <button (click)="decline(r)" class="bg-red-100 text-red-600 px-3 py-1.5 rounded text-sm">Refuser</button>
            </div>
          </div>
        </div>
      </ng-container>
    </div>

    <div *ngIf="activeTab === 'confirmed'" class="space-y-4 animate-fade-in">
      <ng-container *ngIf="confirmedRequests$ | async as requests">
        <div *ngIf="requests.length === 0" class="text-gray-500 text-center py-10">Aucune mission active.</div>
        <div *ngFor="let r of requests" class="bg-white p-5 rounded-lg shadow border-l-4 border-green-600 flex justify-between items-center">
          <div>
            <h3 class="font-bold text-green-800">Mission En Cours</h3>
            <p class="text-sm">📦 {{ r.packageDetails.description }}</p>
            <p class="text-sm font-bold">{{ r.response?.price }} TND</p>
          </div>
          <button (click)="completeMission(r)" class="bg-gray-800 text-white px-4 py-2 rounded text-sm hover:bg-black">🏁 Terminer</button>
        </div>
      </ng-container>
    </div>

    <div *ngIf="activeTab === 'history'" class="space-y-4 animate-fade-in">
      <ng-container *ngIf="historyRequests$ | async as requests">
        <div *ngIf="requests.length === 0" class="text-gray-500 text-center py-10">Historique vide.</div>
        
        <div *ngFor="let r of requests" class="bg-white p-5 rounded-lg shadow-sm border border-gray-200 opacity-90 hover:opacity-100 transition relative overflow-hidden">
          
          <div class="absolute top-0 left-0 w-1 h-full" 
               [ngClass]="{'bg-green-500': r.status === 'completed', 'bg-red-500': r.status === 'rejected'}"></div>

          <div class="flex justify-between items-start pl-3">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-bold text-gray-800">
                  {{ r.status === 'completed' ? '✅ Mission Terminée' : '🚫 Demande Refusée' }}
                </h3>
                <span class="text-xs text-gray-400">
                  {{ r.createdAt?.seconds * 1000 | date:'dd/MM/yyyy' }}
                </span>
              </div>
              
              <div class="mt-2 text-sm text-gray-600">
                <p><strong>Colis :</strong> {{ r.packageDetails.description }}</p>
                <p><strong>Lieu :</strong> {{ r.packageDetails.clientAddress }}</p>
                <p *ngIf="r.status === 'completed'"><strong>Prix Final :</strong> {{ r.response?.price }} TND</p>
              </div>

              <div *ngIf="r.status === 'rejected'" class="mt-2 bg-red-50 p-2 rounded text-xs text-red-700 italic border border-red-100">
                La demande a été rejetée ou annulée.
              </div>
            </div>

            <button (click)="deleteCollab(r)" class="text-gray-400 hover:text-red-500 text-lg" title="Supprimer de l'historique">
              🗑️
            </button>
          </div>
        </div>
      </ng-container>
    </div>

  </div>
</div>

<div *ngIf="showRequestModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
  <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
    <h3 class="text-lg font-bold mb-4">Nouvelle Demande</h3>
    <input type="text" [(ngModel)]="requestForm.description" class="w-full border p-2 mb-2 rounded" placeholder="Description Colis">
    <input type="text" [(ngModel)]="requestForm.clientAddress" class="w-full border p-2 mb-4 rounded" placeholder="Adresse">
    <div class="flex justify-end gap-2">
      <button (click)="closeRequestModal()" class="px-4 py-2 bg-gray-200 rounded">Annuler</button>
      <ng-container *ngIf="currentUser$ | async as me">
        <button (click)="submitRequest(me.uid)" class="px-4 py-2 bg-indigo-600 text-white rounded">Envoyer</button>
      </ng-container>
    </div>
  </div>
</div>

<div *ngIf="showPriceModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
  <div class="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full">
    <h3 class="text-lg font-bold mb-4">Tarification</h3>
    <input type="number" [(ngModel)]="priceForm.price" class="w-full border p-2 mb-2 rounded font-bold text-green-700" placeholder="Prix">
    <textarea [(ngModel)]="priceForm.note" class="w-full border p-2 mb-4 rounded" placeholder="Note..."></textarea>
    <div class="flex justify-end gap-2">
      <button (click)="closeAcceptModal()" class="px-4 py-2 bg-gray-200 rounded">Annuler</button>
      <button (click)="confirmAccept()" class="px-4 py-2 bg-green-600 text-white rounded">Envoyer</button>
    </div>
  </div>
</div>
EOF

echo "✅ Historique détaillé avec notifications de refus installé !"