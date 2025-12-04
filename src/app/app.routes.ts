import { Routes } from '@angular/router';
import { HomePageComponent } from './pages/home/home-page.component';
import { CollaborationRequestsPageComponent } from './pages/collab-requests/collab-requests-page.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  // Page Publique (Login/Signup)
  { path: '', component: HomePageComponent },
  
  // Pages Privées (Protégées par authGuard)
  { 
    path: 'collaborations/demandes', 
    component: CollaborationRequestsPageComponent,
    canActivate: [authGuard] 
  },
  
  // Redirection par défaut
  { path: '**', redirectTo: '' }
];
