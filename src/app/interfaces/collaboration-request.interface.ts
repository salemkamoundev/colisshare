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

export type CollabStatus = 'pending' | 'price_proposed' | 'confirmed' | 'rejected' | 'completed';

export interface CollaborationRequest {
  id?: string;
  fromUserId: string;
  toUserId: string;
  targetTripId?: string; // NOUVEAU CHAMP : Lien vers le trajet spécifique
  
  packageDetails: PackageDetails;
  response?: CollaborationResponse;
  
  status: CollabStatus;
  createdAt: Timestamp | any;
  completedAt?: Timestamp | any;
  
  fromUser?: AppUser;
  toUser?: AppUser;
  tripData?: any; // Pour affichage (jointure manuelle)
}
