import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CollaborationService } from '../../services/collaboration.service';
import { Collaboration } from '../../interfaces/collaboration.interface';
import { Observable, switchMap, of } from 'rxjs';
import { AppUser } from '../../interfaces/user.interface';
import { collection, doc, getDoc, Firestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-collab-requests-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './collab-requests-page.component.html',
})
export class CollabRequestsPageComponent {
  pending$: Observable<Collaboration[]>;
  message = '';

  constructor(
    private auth: AuthService,
    private collab: CollaborationService,
  ) {
    this.pending$ = this.auth.user$.pipe(
      switchMap(user => {
        if (!user) return of([]);
        return this.collab.getPendingRequestsForUser(user.uid);
      })
    );
  }

  async accept(c: Collaboration): Promise<void> {
    if (!c.id) return;
    await this.collab.updateRequestStatus(c.id, 'accepted');
    this.message = 'Collaboration acceptée.';
  }

  async reject(c: Collaboration): Promise<void> {
    if (!c.id) return;
    await this.collab.updateRequestStatus(c.id, 'rejected');
    this.message = 'Demande refusée.';
  }
}
