import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CollaborationService } from '../../services/collaboration.service';

@Component({
  selector: 'app-users-page',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './users-page.component.html',
})
export class UsersPageComponent {
  private auth = inject(AuthService);
  private collab = inject(CollaborationService);
  currentUser$ = this.auth.user$;
  users$ = this.collab.getAllUsers();
}
