import { Timestamp } from '@angular/fire/firestore';
import { AppUser } from './user.interface';

export interface PackageDetails {
  description: string;
  clientName: string;
  clientAddress: string;
  weight?: number;
  date?: string;
}

export interface CollaborationResponse {
  price: number;
  note: string;
  respondedAt: Timestamp;
}

// Ajout de 'completed'
export type CollabStatus = 'pending' | 'price_proposed' | 'confirmed' | 'rejected' | 'completed';

export interface CollaborationRequest {
  id?: string;
  fromUserId: string;
  toUserId: string;
  
  packageDetails: PackageDetails;
  response?: CollaborationResponse;
  
  status: CollabStatus;
  createdAt: Timestamp | any;
  completedAt?: Timestamp | any; // Nouveau champ date de fin
  
  fromUser?: AppUser;
  toUser?: AppUser;
}
