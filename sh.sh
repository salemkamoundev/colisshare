#!/bin/bash

echo "🚑 Mise à jour de l'interface Trip dans FirestoreService..."

# ==============================================================================
# MISE À JOUR DE firestore.service.ts
# ==============================================================================
# Ajout du champ 'destinations' optionnel dans l'interface Trip
# Conservation de toutes les méthodes existantes

cat << 'EOF' > ./src/app/services/firestore.service.ts
import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  doc, 
  deleteDoc, 
  updateDoc,
  collectionData,
  Timestamp
} from '@angular/fire/firestore';
import { Car } from '../interfaces/car.interface';
import { Observable } from 'rxjs';

// Interface Trip mise à jour avec 'destinations'
export interface Trip {
  id?: string;
  userId?: string;
  companyId?: string;
  driverId?: string;
  
  // Localisation
  departure: string;
  arrival: string;
  departureCity?: string;
  arrivalCity?: string;
  destinations?: string[]; // <--- AJOUTÉ ICI POUR CORRIGER L'ERREUR TS2339
  
  // Dates
  date: string;
  estimatedDepartureTime?: Timestamp | Date | string;
  estimatedArrivalTime?: Timestamp | Date | string;
  actualDepartureTime?: Timestamp | Date | string;
  actualArrivalTime?: Timestamp | Date | string;
  
  // Relation
  carId: string;
  car?: Car;
  
  // Statut
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  
  // Etapes & Meta
  steps?: any[];
  createdAt?: any;
  updatedAt?: any;
}

@Injectable({ providedIn: 'root' })
export class FirestoreService {
  private firestore = inject(Firestore);

  // --- VOITURES (CARS) ---

  async getUserCars(userId: string): Promise<Car[]> {
    const carsRef = collection(this.firestore, 'cars');
    const q = query(carsRef, where('ownerId', '==', userId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Car));
  }

  getCars(userId: string): Observable<Car[]> {
    const carsRef = collection(this.firestore, 'cars');
    const q = query(carsRef, where('ownerId', '==', userId));
    return collectionData(q, { idField: 'id' }) as Observable<Car[]>;
  }

  async addCar(car: Car): Promise<void> {
    const carsRef = collection(this.firestore, 'cars');
    await addDoc(carsRef, car);
  }

  async updateCar(car: Car): Promise<void> {
    if (!car.id) return;
    const carDoc = doc(this.firestore, 'cars', car.id);
    const { id, ...data } = car;
    await updateDoc(carDoc, data as any);
  }

  async deleteCar(carId: string): Promise<void> {
    const carDoc = doc(this.firestore, 'cars', carId);
    await deleteDoc(carDoc);
  }

  // --- TRAJETS (TRIPS) ---

  getTrips(userId: string): Observable<Trip[]> {
    const tripsRef = collection(this.firestore, 'trips');
    // Recherche par companyId (ou driverId selon votre logique)
    const q = query(tripsRef, where('companyId', '==', userId)); 
    return collectionData(q, { idField: 'id' }) as Observable<Trip[]>;
  }

  async addTrip(trip: any): Promise<string> {
    // Enrichissement et sécurisation des données avant envoi
    const enrichedTrip = {
      ...trip,
      userId: trip.userId || trip.driverId || trip.companyId,
      departure: trip.departure || trip.departureCity || '',
      arrival: trip.arrival || trip.arrivalCity || '',
      date: trip.date || new Date().toISOString(),
      status: trip.status || 'pending',
      createdAt: new Date()
    };

    const tripsRef = collection(this.firestore, 'trips');
    const docRef = await addDoc(tripsRef, enrichedTrip);
    return docRef.id;
  }

  async updateTrip(trip: Partial<Trip> | any): Promise<void> {
    if (!trip.id) return;
    const tripDoc = doc(this.firestore, 'trips', trip.id);
    const { id, ...data } = trip;
    await updateDoc(tripDoc, data);
  }

  async deleteTrip(tripId: string): Promise<void> {
    const tripDoc = doc(this.firestore, 'trips', tripId);
    await deleteDoc(tripDoc);
  }
}
EOF

echo "✅ Interface Trip mise à jour ! L'erreur TS2339 devrait disparaître."