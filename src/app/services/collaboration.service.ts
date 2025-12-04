import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  query,
  where,
  addDoc,
  doc,
  updateDoc,
} from '@angular/fire/firestore';
import { Observable, combineLatest, map, switchMap, of } from 'rxjs';
import { AppUser } from '../interfaces/user.interface';
import { Collaboration, CollaborationStatus } from '../interfaces/collaboration.interface';
import { Trip } from '../interfaces/trip.interface';

@Injectable({ providedIn: 'root' })
export class CollaborationService {
  private firestore = inject(Firestore);

  // === USERS ===
  getAllUsers(): Observable<AppUser[]> {
    const colRef = collection(this.firestore, 'users');
    return collectionData(colRef, { idField: 'uid' }) as Observable<AppUser[]>;
  }

  // === COLLABORATIONS ===
  getUserCollaborations(userId: string): Observable<Collaboration[]> {
    const colRef = collection(this.firestore, 'collaborations');
    const q = query(
      colRef,
      where('participants', 'array-contains', userId)
    );
    return collectionData(q, { idField: 'id' }) as Observable<Collaboration[]>;
  }

  getPendingRequestsForUser(userId: string): Observable<Collaboration[]> {
    const colRef = collection(this.firestore, 'collaborations');
    const q = query(
      colRef,
      where('targetId', '==', userId),
      where('status', '==', 'pending')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Collaboration[]>;
  }

  async sendRequest(requesterId: string, targetId: string): Promise<void> {
    if (requesterId === targetId) {
      throw new Error('Impossible de se demander soi-même.');
    }
    const colRef = collection(this.firestore, 'collaborations');
    const data: Collaboration = {
      participants: [requesterId, targetId],
      requesterId,
      targetId,
      status: 'pending',
      createdAt: new Date(),
    };
    await addDoc(colRef, data);
  }

  async updateRequestStatus(collabId: string, status: CollaborationStatus): Promise<void> {
    const ref = doc(this.firestore, 'collaborations', collabId);
    await updateDoc(ref, { status });
  }

  // === TRAJETS PARTAGÉS ===
  private getTripsByDriver(userId: string): Observable<Trip[]> {
    const colRef = collection(this.firestore, 'trips');
    const q = query(colRef, where('driverId', '==', userId));
    return collectionData(q, { idField: 'id' }) as Observable<Trip[]>;
  }

  getSharedTripsForUser(currentUserId: string): Observable<Trip[]> {
    const colRef = collection(this.firestore, 'collaborations');
    const q = query(
      colRef,
      where('participants', 'array-contains', currentUserId),
      where('status', '==', 'accepted')
    );

    const accepted$ = collectionData(q, { idField: 'id' }) as Observable<Collaboration[]>;

    return accepted$.pipe(
      switchMap(collabs => {
        const otherIds = Array.from(
          new Set(
            collabs
              .map(c => c.participants.find(id => id !== currentUserId))
              .filter((id): id is string => !!id)
          )
        );

        if (otherIds.length === 0) {
          // ✅ Retourne un Observable<Trip[]> vide au lieu de juste []
          return of([] as Trip[]);
        }

        const streams = otherIds.map(id => this.getTripsByDriver(id));
        // Combine les résultats et aplatit le tableau
        return combineLatest(streams).pipe(
          map(arrays => arrays.flat())
        );
      })
    );
  }
}
