export type CollaborationStatus = 'pending' | 'accepted' | 'rejected';

export interface Collaboration {
  id?: string;
  participants: string[]; // [userA, userB]
  requesterId: string;
  targetId: string;
  status: CollaborationStatus;
  createdAt?: any; // Timestamp
}
