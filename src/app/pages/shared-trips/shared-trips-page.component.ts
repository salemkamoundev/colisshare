import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CollaborationService } from '../../services/collaboration.service';
import { Trip } from '../../interfaces/trip.interface';
import { Observable, of, switchMap } from 'rxjs';

@Component({
  selector: 'app-shared-trips-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './shared-trips-page.component.html',
})
export class SharedTripsPageComponent {
  sharedTrips$: Observable<Trip[]>;

  constructor(
    private auth: AuthService,
    private collab: CollaborationService,
  ) {
    this.sharedTrips$ = this.auth.user$.pipe(
      switchMap(user => {
        if (!user) return of([]);
        return this.collab.getSharedTripsForUser(user.uid);
      })
    );
  }

  formatDate(dateLike: any): string {
    try {
      const d = (dateLike?.toDate) ? dateLike.toDate() : new Date(dateLike);
      return d.toLocaleString('fr-FR');
    } catch {
      return '';
    }
  }
}
