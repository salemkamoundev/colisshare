import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import {
  Firestore,
  collection,
  collectionData,
  query,
  where,
  doc,
  updateDoc,
  writeBatch,
  Timestamp,
} from '@angular/fire/firestore';
import { CollaborationRequest } from '../../interfaces/collaboration-request.interface';

@Component({
  selector: 'app-collaboration-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './collaboration-list.component.html',
})
export class CollaborationListComponent implements OnInit {
  private firestore = inject(Firestore);
  private readonly CURRENT_COMPANY_ID = 'AbC1dE2fG3hI4jK5lM6n';

  collaborationRequests!: Observable<CollaborationRequest[]>;

  ngOnInit(): void {
    this.collaborationRequests = this.getCollaborationRequests();
  }

  getCollaborationRequests(): Observable<CollaborationRequest[]> {
    const requestsCollection = collection(this.firestore, 'collaborationRequests');
    const q = query(
      requestsCollection,
      where('targetCompanyId', '==', this.CURRENT_COMPANY_ID),
      where('status', '==', 'pending')
    );
    return collectionData(q, { idField: 'id' }) as Observable<CollaborationRequest[]>;
  }

  async acceptRequest(request: CollaborationRequest): Promise<void> {
    if (!confirm(`Accepter la collaboration pour le colis ${request.packageDetails.id} ?`)) {
      return;
    }

    const batch = writeBatch(this.firestore);

    // 1. Mise à jour du statut dans collaborationRequests
    const requestDocRef = doc(this.firestore, 'collaborationRequests', request.id);
    batch.update(requestDocRef, {
      status: 'accepted',
      acceptedAt: Timestamp.now(),
    });

    // 2. Création d'une référence croisée pour le suivi du colis
    const shipmentTrackingRef = doc(
      this.firestore,
      'shipmentTracking',
      request.packageDetails.id
    );
    batch.set(
      shipmentTrackingRef,
      {
        packageId: request.packageDetails.id,
        status: 'COLLABORATION_ACCEPTED',
        originalCompanyId: request.requesterCompanyId,
        deliveryCompanyId: this.CURRENT_COMPANY_ID,
        assignedTripId: request.targetTripId,
        acceptedAmount: request.proposedAmount,
        lastUpdated: Timestamp.now(),
      },
      { merge: true }
    );

    try {
      await batch.commit();
      alert('Demande acceptée et suivi du colis mis à jour !');
    } catch (error: any) {
      console.error('Erreur lors de l\'acceptation de la demande (Batch failed)', error);
      alert('Erreur lors de l\'acceptation.');
    }
  }

  async declineRequest(requestId: string): Promise<void> {
    if (!confirm('Décliner cette demande de collaboration ?')) {
      return;
    }

    const requestDocRef = doc(this.firestore, 'collaborationRequests', requestId);
    try {
      await updateDoc(requestDocRef, {
        status: 'rejected',
        rejectedAt: Timestamp.now(),
      });
      alert('Demande déclinée.');
    } catch (error: any) {
      console.error('Erreur lors du déclin de la demande', error);
    }
  }
}
