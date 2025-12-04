import { Timestamp } from '@angular/fire/firestore';

export interface TripStep {
  city: string;
  estimatedTime: string;
}

export type TripStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Trip {
  id?: string;
  carId: string;
  companyId: string;
  driverId: string;
  departureCity: string;
  arrivalCity: string;
  estimatedDepartureTime: Timestamp;
  estimatedArrivalTime: Timestamp;
  actualDepartureTime?: Timestamp;
  actualArrivalTime?: Timestamp;
  status: TripStatus;
  steps: TripStep[];
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}
