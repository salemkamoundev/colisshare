import { Routes } from '@angular/router';

import { HomePageComponent } from './pages/home/home-page.component';
import { CarsManagementPageComponent } from './pages/cars-management/cars-management-page.component';
import { TripFormPageComponent } from './pages/trip-form/trip-form-page.component';
import { TripsHistoryPageComponent } from './pages/trips-history/trips-history-page.component';
import { CollaborationRequestsPageComponent } from './pages/collab-requests/collab-requests-page.component';
import { ChatPageComponent } from './pages/chat-page/chat-page.component';

export const routes: Routes = [
  { path: '', component: HomePageComponent },
  { path: 'voitures', component: CarsManagementPageComponent },
  { path: 'trajets/saisie', component: TripFormPageComponent },
  { path: 'trajets/historique', component: TripsHistoryPageComponent },
  { path: 'collaborations/demandes', component: CollaborationRequestsPageComponent },
  { path: 'chat', component: ChatPageComponent },
  { path: '**', redirectTo: '' },
];
