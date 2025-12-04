import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { CarsManagementPageComponent } from './pages/cars-management/cars-management-page.component';
import { TripFormPageComponent } from './pages/trip-form/trip-form-page.component';
import { TripsHistoryPageComponent } from './pages/trips-history/trips-history-page.component';
import { CollaborationRequestsPageComponent } from './pages/collab-requests/collab-requests-page.component';
import { ChatPageComponent } from './pages/chat-page/chat-page.component';

const routes: Routes = [
  { path: '', redirectTo: 'trajets/saisie', pathMatch: 'full' },
  { path: 'voitures', component: CarsManagementPageComponent },
  { path: 'trajets/saisie', component: TripFormPageComponent },
  { path: 'trajets/historique', component: TripsHistoryPageComponent },
  { path: 'collaborations/demandes', component: CollaborationRequestsPageComponent },
  { path: 'chat', component: ChatPageComponent },
  { path: '**', redirectTo: 'trajets/saisie' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
