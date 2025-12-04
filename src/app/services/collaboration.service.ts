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

  // --- ENVOI ---
  async sendRequest(currentUserId: string, targetUserId: string, details: PackageDetails) {
    const requestsRef = collection(this.firestore, 'collaboration_requests');
    const q = query(requestsRef, where('fromUserId', '==', currentUserId), where('toUserId', '==', targetUserId), where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    if (!snapshot.empty) throw new Error('Demande déjà en attente.');

    return addDoc(requestsRef, {
      fromUserId: currentUserId,
      toUserId: targetUserId,
      packageDetails: details,
      status: 'pending',
      createdAt: Timestamp.now()
    });
  }

  // --- CHANGEMENTS D'ETAT ---

  async proposePrice(requestId: string, price: number, note: string) {
    const docRef = doc(this.firestore, 'collaboration_requests', requestId);
    return updateDoc(docRef, { status: 'price_proposed', response: { price, note, respondedAt: Timestamp.now() } });
  }

  async confirmCollaboration(requestId: string) {
    const docRef = doc(this.firestore, 'collaboration_requests', requestId);
    return updateDoc(docRef, { status: 'confirmed' });
  }

  // NOUVELLE METHODE : TERMINER LA MISSION
  async markAsCompleted(requestId: string) {
    const docRef = doc(this.firestore, 'collaboration_requests', requestId);
    return updateDoc(docRef, { 
      status: 'completed',
      completedAt: Timestamp.now()
    });
  }

  async acceptRequest(requestId: string, price: number, note: string) {
    return this.proposePrice(requestId, price, note);
  }

  async declineRequest(requestId: string) {
    const docRef = doc(this.firestore, 'collaboration_requests', requestId);
    return updateDoc(docRef, { status: 'rejected' });
  }

  async deleteCollaboration(requestId: string) {
    const docRef = doc(this.firestore, 'collaboration_requests', requestId);
    return deleteDoc(docRef);
  }

  // --- LECTURE ---

  getIncomingRequests(userId: string): Observable<CollaborationRequest[]> {
    const requestsRef = collection(this.firestore, 'collaboration_requests');
    const q = query(requestsRef, where('toUserId', '==', userId));
    return collectionData(q, { idField: 'id' }) as Observable<CollaborationRequest[]>;
  }

  getOutgoingRequests(userId: string): Observable<CollaborationRequest[]> {
    const requestsRef = collection(this.firestore, 'collaboration_requests');
    const q = query(requestsRef, where('fromUserId', '==', userId));
    return collectionData(q, { idField: 'id' }) as Observable<CollaborationRequest[]>;
  }

  getPendingRequests(userId: string) { return this.getIncomingRequests(userId); }

  // Modifié pour inclure 'confirmed' ET 'completed' pour le chat
  getAcceptedCollaborations(userId: string): Observable<CollaborationRequest[]> {
    const requestsRef = collection(this.firestore, 'collaboration_requests');
    const q1 = query(requestsRef, where('toUserId', '==', userId));
    const q2 = query(requestsRef, where('fromUserId', '==', userId));
    
    const r$ = collectionData(q1, { idField: 'id' }) as Observable<CollaborationRequest[]>;
    const s$ = collectionData(q2, { idField: 'id' }) as Observable<CollaborationRequest[]>;
    
    return combineLatest([r$, s$]).pipe(
      map(([a, b]) => {
        // On retourne tout ce qui est actif ou fini (pour l'historique global si besoin)
        const all = [...a, ...b];
        return all.filter(r => r.status === 'confirmed' || r.status === 'completed' || r.status === 'price_proposed');
      })
    );
  }

  getAllUsers(): Observable<AppUser[]> {
    const usersRef = collection(this.firestore, 'users');
    return collectionData(usersRef, { idField: 'uid' }) as Observable<AppUser[]>;
  }

  getSharedTripsForUser(uid: string) { return of([]); }
}
