import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CollaborationRequestItem {
  id: string;
  requesterCompany: string;
  targetTripId: string;
  amount: number;
  status: 'pending' | 'accepted' | 'rejected';
}

@Component({
  standalone: true,
  selector: 'app-collab-requests-page',
  templateUrl: './collab-requests-page.component.html',
  imports: [CommonModule],
})
export class CollaborationRequestsPageComponent {
  requests: CollaborationRequestItem[] = [
    { id: 'CR-001', requesterCompany: 'TransLog', targetTripId: 'T-001', amount: 350, status: 'pending' },
    { id: 'CR-002', requesterCompany: 'FastMove', targetTripId: 'T-003', amount: 420, status: 'accepted' },
    { id: 'CR-003', requesterCompany: 'ExpressCargo', targetTripId: 'T-002', amount: 300, status: 'rejected' },
  ];
}
