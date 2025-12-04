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
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

// Interface Trip enrichie pour correspondre à vos composants existants
export interface Trip {
  id?: string;
  userId?: string; // Optionnel car parfois c'est companyId/driverId
  companyId?: string;
  driverId?: string;
  
  // Champs de localisation
  departure: string; // Utilisé pour l'affichage simple (ville départ)
  arrival: string;   // Utilisé pour l'affichage simple (ville arrivée)
  departureCity?: string; // Alias pour compatibilité
  arrivalCity?: string;   // Alias pour compatibilité
  
  // Champs de date
  date: string; // Format string simple pour l'affichage
  estimatedDepartureTime?: Timestamp | Date | string;
  estimatedArrivalTime?: Timestamp | Date | string;
  actualDepartureTime?: Timestamp | Date | string;
  actualArrivalTime?: Timestamp | Date | string;
  
  // Relation Voiture
  carId: string;
  car?: Car; 
  
  // Statut (incluant 'in_progress')
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  
  // Etapes du trajet
  steps?: any[];
  
  // Métadonnées
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

  // Alias observable
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
    // On cherche par userId OU companyId (selon votre logique métier)
    // Pour simplifier ici, on suppose que userId stocke l'ID du propriétaire
    const tripsRef = collection(this.firestore, 'trips');
    const q = query(tripsRef, where('companyId', '==', userId)); 
    // Si ça ne marche pas, essayez 'driverId' ou 'userId' selon votre base
    return collectionData(q, { idField: 'id' }) as Observable<Trip[]>;
  }

  async addTrip(trip: any): Promise<string> {
    // 'any' ici permet d'accepter les objets complexes de vos composants
    // sans se battre avec le typage strict pour l'instant.
    // On s'assure juste d'avoir les champs minimaux pour l'affichage.
    
    const enrichedTrip = {
      ...trip,
      // Fallbacks pour garantir la compatibilité
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
