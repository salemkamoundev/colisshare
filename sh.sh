#!/bin/bash

echo "🛠️ Correction du flux : Le bouton 'Collaborer' ouvrira maintenant la liste des trajets..."

# ==============================================================================
# MISE À JOUR DU HTML (Page Collab Requests)
# ==============================================================================
# Changement majeur : Le bouton appelle openTripListModal au lieu de openRequestModal

cat << 'EOF' > ./src/app/pages/collab-requests/collab-requests-page.component.html
<div class="min-h-screen bg-gray-50 p-6">
  <div class="max-w-6xl mx-auto">
    <h1 class="text-3xl font-bold text-gray-900 mb-6">Suivi des Collaborations</h1>

    <div class="flex border-b border-gray-200 mb-6 overflow-x-auto bg-white rounded-t-lg shadow-sm">
      <button (click)="setActiveTab('search')" [class.text-indigo-600]="activeTab==='search'" [class.border-indigo-600]="activeTab==='search'" class="whitespace-nowrap px-6 py-4 border-b-2 font-bold border-transparent hover:bg-gray-50 transition flex items-center gap-2"><span>🔍</span> Annuaire <ng-container *ngIf="allUsersCount$ | async as c"><span class="ml-1 bg-indigo-100 text-indigo-600 text-xs px-2 py-0.5 rounded-full">{{c}}</span></ng-container></button>
      <button (click)="setActiveTab('incoming')" [class.text-blue-600]="activeTab==='incoming'" [class.border-blue-600]="activeTab==='incoming'" class="whitespace-nowrap px-6 py-4 border-b-2 font-medium border-transparent hover:bg-gray-50 transition flex items-center gap-2"><span>📥 Reçues</span> <ng-container *ngIf="incomingCount$ | async as c"><span *ngIf="c>0" class="ml-1 bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full font-bold">{{c}}</span></ng-container></button>
      <button (click)="setActiveTab('outgoing')" [class.text-blue-600]="activeTab==='outgoing'" [class.border-blue-600]="activeTab==='outgoing'" class="whitespace-nowrap px-6 py-4 border-b-2 font-medium border-transparent hover:bg-gray-50 transition flex items-center gap-2"><span>📤 Envoyées</span> <ng-container *ngIf="outgoingCount$ | async as c"><span *ngIf="c>0" class="ml-1 bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">{{c}}</span></ng-container></button>
      <button (click)="setActiveTab('confirmed')" [class.text-green-700]="activeTab==='confirmed'" [class.border-green-600]="activeTab==='confirmed'" class="whitespace-nowrap px-6 py-4 border-b-2 font-medium border-transparent hover:bg-gray-50 transition flex items-center gap-2"><span>✅ Actives</span> <ng-container *ngIf="confirmedCount$ | async as c"><span *ngIf="c>0" class="ml-1 bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">{{c}}</span></ng-container></button>
      <button (click)="setActiveTab('history')" [class.text-gray-900]="activeTab==='history'" [class.border-gray-600]="activeTab==='history'" class="whitespace-nowrap px-6 py-4 border-b-2 font-medium border-transparent hover:bg-gray-50 transition flex items-center gap-2"><span>🏁 Historique</span></button>
    </div>

    <div *ngIf="activeTab === 'search'" class="animate-fade-in">
      <ng-container *ngIf="allUsers$ | async as users">
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div *ngFor="let user of users" class="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center font-bold">{{ user.displayName?.charAt(0) || '?' }}</div>
              <div><h3 class="font-bold text-gray-900 truncate">{{ user.displayName }}</h3><p class="text-xs text-gray-500 truncate">{{ user.email }}</p></div>
            </div>
            <ng-container *ngIf="currentUser$ | async as me">
              <button *ngIf="user.uid !== me.uid" (click)="openTripListModal(user)" class="w-full py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 border border-indigo-200 flex items-center justify-center gap-2">
                <span>🛣️</span> Voir les trajets
              </button>
            </ng-container>
          </div>
        </div>
      </ng-container>
    </div>

    <div *ngIf="activeTab === 'incoming'" class="space-y-4 animate-fade-in">
      <ng-container *ngIf="incomingRequests$ | async as requests">
        <div *ngIf="requests.length === 0" class="text-center py-10 text-gray-500">Rien à traiter.</div>
        <div *ngFor="let r of requests" class="bg-white p-5 rounded-lg shadow border-l-4" [class.border-yellow-400]="r.status==='pending'" [class.border-blue-400]="r.status==='price_proposed'">
          <div class="flex justify-between"><h3 class="font-bold">De : {{ r.fromUserId | slice:0:5 }}...</h3><span class="text-xs px-2 py-1 rounded font-bold" [ngClass]="{'bg-yellow-100': r.status==='pending', 'bg-blue-100': r.status==='price_proposed'}">{{ getStatusLabel(r.status) }}</span></div>
          <p class="text-sm text-gray-600 mt-2">📦 {{ r.packageDetails.description }}</p>
          <div class="mt-4 flex gap-2" *ngIf="r.status === 'pending'">
            <button (click)="openPriceModal(r)" class="bg-green-600 text-white px-3 py-1.5 rounded text-sm">Accepter</button>
            <button (click)="decline(r)" class="bg-gray-200 text-gray-700 px-3 py-1.5 rounded text-sm">Refuser</button>
          </div>
          <p *ngIf="r.status === 'price_proposed'" class="text-xs text-blue-600 mt-2">Offre envoyée.</p>
        </div>
      </ng-container>
    </div>

    <div *ngIf="activeTab === 'outgoing'" class="space-y-4 animate-fade-in">
      <ng-container *ngIf="outgoingRequests$ | async as requests">
        <div *ngIf="requests.length === 0" class="text-center py-10 text-gray-500">Aucune demande.</div>
        <div *ngFor="let r of requests" class="bg-white p-5 rounded-lg shadow border border-gray-200">
          <div class="flex justify-between"><h3 class="font-bold">Vers : {{ r.toUserId | slice:0:5 }}...</h3><span class="text-xs px-2 py-1 rounded font-bold" [ngClass]="{'bg-yellow-100': r.status==='pending', 'bg-green-100': r.status==='price_proposed'}">{{ getStatusLabel(r.status) }}</span></div>
          <p class="text-sm text-gray-600 mt-2">📦 {{ r.packageDetails.description }}</p>
          <div *ngIf="r.status === 'price_proposed'" class="mt-4 bg-green-50 p-3 rounded border border-green-200"><p class="font-bold text-green-800">Offre : {{ r.response?.price }} TND</p><div class="mt-3 flex gap-2"><button (click)="confirmPrice(r)" class="bg-green-600 text-white px-3 py-1.5 rounded text-sm">Valider</button><button (click)="decline(r)" class="bg-red-100 text-red-600 px-3 py-1.5 rounded text-sm">Refuser</button></div></div>
        </div>
      </ng-container>
    </div>

    <div *ngIf="activeTab === 'confirmed'" class="space-y-4 animate-fade-in">
      <ng-container *ngIf="confirmedRequests$ | async as requests">
        <div *ngIf="requests.length === 0" class="text-center py-10 text-gray-500">Vide.</div>
        <div *ngFor="let r of requests" class="bg-white p-5 rounded-lg shadow border-l-4 border-green-600 flex justify-between items-center">
          <div><h3 class="font-bold text-green-800">Mission En Cours</h3><p class="text-sm">📦 {{ r.packageDetails.description }}</p><p class="text-sm font-bold">{{ r.response?.price }} TND</p></div>
          <button (click)="completeMission(r)" class="bg-gray-800 text-white px-4 py-2 rounded text-sm">🏁 Terminer</button>
        </div>
      </ng-container>
    </div>

    <div *ngIf="activeTab === 'history'" class="space-y-4 animate-fade-in">
      <ng-container *ngIf="historyRequests$ | async as requests">
        <div *ngIf="requests.length === 0" class="text-center py-10 text-gray-500">Vide.</div>
        <div *ngFor="let r of requests" class="bg-white p-5 rounded-lg shadow-sm border border-gray-200"><h3 class="font-bold text-gray-800">{{ getStatusLabel(r.status) }}</h3><p class="text-sm">📦 {{ r.packageDetails.description }}</p></div>
      </ng-container>
    </div>
  </div>
</div>

<div *ngIf="showTripListModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
  <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
    <div class="flex justify-between items-center mb-4 border-b pb-2">
      <h3 class="text-xl font-bold text-gray-800">Trajets de {{ selectedTargetUser?.displayName }}</h3>
      <button (click)="closeTripListModal()" class="text-gray-400 hover:text-gray-600">✕</button>
    </div>
    <div *ngIf="targetUserTrips.length === 0" class="text-center py-8 text-gray-500">Aucun trajet disponible.</div>
    <div class="space-y-3">
      <div *ngFor="let trip of targetUserTrips" (click)="viewTripDetails(trip)" class="bg-gray-50 p-4 rounded-lg border border-gray-200 cursor-pointer hover:bg-blue-50 transition">
        <div class="font-bold text-gray-900">🚀 {{ trip.departureCity }} → 🏁 {{ trip.arrivalCity }}</div>
        <div class="text-xs text-gray-500 mt-1">📅 {{ formatDate(trip.estimatedDepartureTime) }}</div>
      </div>
    </div>
  </div>
</div>

<div *ngIf="showTripDetailModal && selectedTrip" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
  <div class="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
    <button (click)="closeTripDetailModal()" class="mb-4 text-sm text-gray-500">← Retour</button>
    <div class="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
      <h3 class="text-lg font-bold text-blue-900 mb-2">Détails</h3>
      <p class="text-sm text-blue-800">Départ : {{ selectedTrip.departureCity }}</p>
      <p class="text-sm text-blue-800">Arrivée : {{ selectedTrip.arrivalCity }}</p>
      <p class="text-sm text-blue-800">Date : {{ formatDate(selectedTrip.estimatedDepartureTime) }}</p>
    </div>
    <button (click)="selectTripAndOpenRequest()" class="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold">Choisir ce trajet</button>
  </div>
</div>

<div *ngIf="showRequestModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
  <div class="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
    <h3 class="text-lg font-bold mb-2">📦 Détails du Colis</h3>
    <p class="text-xs text-gray-500 mb-4">Trajet : {{ selectedTrip?.departureCity }} -> {{ selectedTrip?.arrivalCity }}</p>
    
    <ng-container *ngIf="currentUser$ | async as me">
      <form (ngSubmit)="submitRequest(me.uid)" class="space-y-3">
        <input type="text" [(ngModel)]="requestForm.description" name="desc" class="w-full border p-2 rounded" placeholder="Description" required>
        <input type="text" [(ngModel)]="requestForm.clientAddress" name="addr" class="w-full border p-2 rounded" placeholder="Adresse" required>
        <input type="text" [(ngModel)]="requestForm.clientName" name="cli" class="w-full border p-2 rounded" placeholder="Nom Client">
        
        <div class="flex justify-end gap-2 mt-4">
          <button type="button" (click)="closeRequestModal()" class="px-4 py-2 bg-gray-200 rounded">Annuler</button>
          <button type="submit" class="px-4 py-2 bg-indigo-600 text-white rounded">Envoyer</button>
        </div>
      </form>
    </ng-container>
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

echo "✅ Le bouton 'Collaborer' ouvre maintenant la liste des trajets pour garantir que toutes les infos sont présentes."