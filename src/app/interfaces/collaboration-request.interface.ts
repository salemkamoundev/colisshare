import { Timestamp } from '@angular/fire/firestore';

export interface PackageDetails {
  id: string;
  weight: number;
  description: string;
}

export interface CollaborationRequest {
  id: string;
  requesterCompanyId: string;
  targetCompanyId: string;
  targetTripId: string;
  packageDetails: PackageDetails;
  proposedAmount: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Timestamp;
  acceptedAt?: Timestamp;
  rejectedAt?: Timestamp;
}
