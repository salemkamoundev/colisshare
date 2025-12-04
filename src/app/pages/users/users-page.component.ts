import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CollaborationService } from '../../services/collaboration.service';
import { AppUser } from '../../interfaces/user.interface';
import { Observable } from 'rxjs';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './users-page.component.html',
})
export class UsersPageComponent {
  private authService = inject(AuthService);
  private collab = inject(CollaborationService);

  currentUser$ = this.authService.user$;
  users$: Observable<AppUser[]>;

  loadingRequest = false;
  message = '';

  constructor() {
    this.users$ = this.collab.getAllUsers();
  }

  async sendRequest(target: AppUser, currentUser: User | null): Promise<void> {
    if (!currentUser) {
      this.message = 'Vous devez être connecté.';
      return;
    }
    this.loadingRequest = true;
    this.message = '';
    try {
      await this.collab.sendRequest(currentUser.uid, target.uid);
      this.message = `Demande envoyée à ${target.displayName}`;
    } catch (e: any) {
      this.message = e.message || 'Erreur lors de la demande.';
    } finally {
      this.loadingRequest = false;
    }
  }
}
