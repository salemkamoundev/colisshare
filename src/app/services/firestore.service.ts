import { Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { Car } from '../interfaces/car.interface';
import { Trip } from '../interfaces/trip.interface';

@Injectable({
  providedIn: 'root',
})
export class FirestoreService {
  private readonly COMPANY_ID = 'AbC1dE2fG3hI4jK5lM6n';

  constructor(private firestore: Firestore) {}

  // ============================================
  // CARS (Voitures)
  // ============================================

  getCars(companyId: string): Observable<Car[]> {
    const carsRef = collection(this.firestore, `companies/${companyId}/cars`);
    const q = query(carsRef, where('active', '==', true));
    return collectionData(q, { idField: 'id' }) as Observable<Car[]>;
  }

  async addCar(car: Omit<Car, 'id'>): Promise<void> {
    const carsRef = collection(this.firestore, `companies/${this.COMPANY_ID}/cars`);
    await addDoc(carsRef, {
      ...car,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }

  async updateCar(car: Partial<Car> & { id: string }): Promise<void> {
    const { id, ...carData } = car;
    const carRef = doc(this.firestore, `companies/${this.COMPANY_ID}/cars/${id}`);
    await updateDoc(carRef, {
      ...carData,
      updatedAt: Timestamp.now(),
    });
  }

  async deleteCar(carId: string): Promise<void> {
    const carRef = doc(this.firestore, `companies/${this.COMPANY_ID}/cars/${carId}`);
    await deleteDoc(carRef);
  }

  // ============================================
  // TRIPS (Trajets)
  // ============================================

  getTrips(companyId: string): Observable<Trip[]> {
    const tripsRef = collection(this.firestore, `companies/${companyId}/trips`);
    return collectionData(tripsRef, { idField: 'id' }) as Observable<Trip[]>;
  }

  async addTrip(trip: Omit<Trip, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const tripsRef = collection(
        this.firestore,
        `companies/${trip.companyId}/trips`
      );
      
      const docRef = await addDoc(tripsRef, {
        ...trip,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      console.log('✅ Trajet enregistré avec ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Erreur addTrip:', error);
      throw error;
    }
  }

  async updateTrip(trip: Trip): Promise<void> {
    if (!trip.id) {
      throw new Error('Trip ID is required for update');
    }

    const tripRef = doc(
      this.firestore,
      `companies/${trip.companyId}/trips/${trip.id}`
    );

    const { id, ...tripData } = trip;

    await updateDoc(tripRef, {
      ...tripData,
      updatedAt: Timestamp.now(),
    });
  }

  async deleteTrip(tripId: string): Promise<void> {
    const tripRef = doc(this.firestore, `companies/${this.COMPANY_ID}/trips/${tripId}`);
    await deleteDoc(tripRef);
  }
}
