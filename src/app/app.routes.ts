import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home/home-page.component';
import { CollaborationRequestsPageComponent } from './pages/collab-requests/collab-requests-page.component';
import { TripFormPageComponent } from './pages/trip-form/trip-form-page.component';
import { TripsHistoryPageComponent } from './pages/trips-history/trips-history-page.component';
import { CarsManagementPageComponent } from './pages/cars-management/cars-management-page.component';
import { ChatPageComponent } from './pages/chat-page/chat-page.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  // Page publique (Login/Signup)
  { 
    path: '', 
    component: HomePageComponent 
  },
  
  // Pages protégées (nécessitent AuthGuard)
  { 
    path: 'collaborations/demandes', 
    component: CollaborationRequestsPageComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'trajets/saisie', 
    component: TripFormPageComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'trajets/historique', 
    component: TripsHistoryPageComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'voitures', 
    component: CarsManagementPageComponent, 
    canActivate: [authGuard] 
  },
  { 
    path: 'chat', 
    component: ChatPageComponent, 
    canActivate: [authGuard] 
  },

  // Redirection par défaut (si URL inconnue)
  { 
    path: '**', 
    redirectTo: '' 
  }
];
