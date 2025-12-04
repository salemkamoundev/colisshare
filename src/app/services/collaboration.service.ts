import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc, collectionData, Timestamp } from '@angular/fire/firestore';
import { Observable, combineLatest, map, of } from 'rxjs';
import { AppUser } from '../interfaces/user.interface';
import { CollaborationRequest, PackageDetails } from '../interfaces/collaboration-request.interface';

@Injectable({
  providedIn: 'root'
})
export class CollaborationService {
  private firestore = inject(Firestore);

  async sendRequest(currentUserId: string, targetUserId: string, details: PackageDetails, tripId?: string) {
    const requestsRef = collection(this.firestore, 'collaboration_requests');
    let q;
    if (tripId) {
       q = query(requestsRef, where('fromUserId', '==', currentUserId), where('targetTripId', '==', tripId), where('status', '==', 'pending'));
    } else {
       q = query(requestsRef, where('fromUserId', '==', currentUserId), where('toUserId', '==', targetUserId), where('status', '==', 'pending'));
    }
    const snapshot = await getDocs(q);
    if (!snapshot.empty) throw new Error('Une demande est déjà en cours.');

    return addDoc(requestsRef, {
      fromUserId: currentUserId,
      toUserId: targetUserId,
      targetTripId: tripId || null,
      packageDetails: details,
      status: 'pending',
      createdAt: Timestamp.now()
    });
  }

  async proposePrice(requestId: string, price: number, note: string) {
    const docRef = doc(this.firestore, 'collaboration_requests', requestId);
    return updateDoc(docRef, { status: 'price_proposed', response: { price, note, respondedAt: Timestamp.now() } });
  }

  async confirmCollaboration(requestId: string) {
    const docRef = doc(this.firestore, 'collaboration_requests', requestId);
    return updateDoc(docRef, { status: 'confirmed' });
  }

  async markAsCompleted(requestId: string) {
    const docRef = doc(this.firestore, 'collaboration_requests', requestId);
    return updateDoc(docRef, { status: 'completed', completedAt: Timestamp.now() });
  }

  async acceptRequest(requestId: string, price: number, note: string) { return this.proposePrice(requestId, price, note); }
  async declineRequest(requestId: string) { const docRef = doc(this.firestore, 'collaboration_requests', requestId); return updateDoc(docRef, { status: 'rejected' }); }
  async deleteCollaboration(requestId: string) { const docRef = doc(this.firestore, 'collaboration_requests', requestId); return deleteDoc(docRef); }

  getIncomingRequests(userId: string): Observable<CollaborationRequest[]> {
    const q = query(collection(this.firestore, 'collaboration_requests'), where('toUserId', '==', userId));
    return collectionData(q, { idField: 'id' }) as Observable<CollaborationRequest[]>;
  }

  getOutgoingRequests(userId: string): Observable<CollaborationRequest[]> {
    const q = query(collection(this.firestore, 'collaboration_requests'), where('fromUserId', '==', userId));
    return collectionData(q, { idField: 'id' }) as Observable<CollaborationRequest[]>;
  }

  getPendingRequests(userId: string) { return this.getIncomingRequests(userId); }

  getAcceptedCollaborations(userId: string): Observable<CollaborationRequest[]> {
    const q1 = query(collection(this.firestore, 'collaboration_requests'), where('toUserId', '==', userId));
    const q2 = query(collection(this.firestore, 'collaboration_requests'), where('fromUserId', '==', userId));
    
    // Typage explicite pour éviter l'erreur TS2322 et TS4111
    const r1$ = collectionData(q1, { idField: 'id' }) as Observable<CollaborationRequest[]>;
    const r2$ = collectionData(q2, { idField: 'id' }) as Observable<CollaborationRequest[]>;

    return combineLatest([r1$, r2$]).pipe(
      map(([a, b]) => [...a, ...b].filter(r => ['confirmed', 'completed', 'price_proposed'].includes(r.status)))
    );
  }

  getAllUsers(): Observable<AppUser[]> {
    return collectionData(collection(this.firestore, 'users'), { idField: 'uid' }) as Observable<AppUser[]>;
  }
  
  getSharedTripsForUser(uid: string) { return of([]); }
}
