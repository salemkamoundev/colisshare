import { Timestamp } from '@angular/fire/firestore';

export interface TripStep {
  city: string;
  estimatedTime?: string; // Rendons l'heure optionnelle pour simplifier la saisie rapide
}

export type TripStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Trip {
  id?: string;
  carId: string;
  companyId: string;
  driverId: string;
  
  departureCity: string;
  arrivalCity: string; // Gardé pour compatibilité (sera la dernière destination)
  destinations: string[]; // Nouveau tableau de villes
  
  estimatedDepartureTime: Timestamp;
  estimatedArrivalTime: Timestamp;
  
  actualDepartureTime?: Timestamp;
  actualArrivalTime?: Timestamp;
  
  status: TripStatus;
  steps: TripStep[]; // Gardé pour compatibilité backend existant
  
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
