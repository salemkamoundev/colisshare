import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { CollaborationService } from '../../services/collaboration.service';
// Header supprimé des imports car géré globalement
import { switchMap, of } from 'rxjs';

@Component({
  selector: 'app-shared-trips-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4">Trajets Partagés</h1>
      <ng-container *ngIf="sharedTrips$ | async as trips">
        <div *ngIf="trips.length === 0" class="text-gray-500">
          Aucun trajet partagé pour le moment.
        </div>
        <div *ngFor="let trip of trips" class="bg-white p-4 rounded-lg shadow mb-3">
           {{ trip | json }}
        </div>
      </ng-container>
    </div>
  `
})
export class SharedTripsPageComponent {
  private auth = inject(AuthService);
  private collab = inject(CollaborationService);

  sharedTrips$ = this.auth.user$.pipe(
    switchMap(user => user ? this.collab.getSharedTripsForUser(user.uid) : of([]))
  );
}
