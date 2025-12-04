import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Observable } from 'rxjs';
import { User } from '@angular/fire/auth';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
})
export class HeaderComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  // Observable qui vaut 'null' si pas connecté
  user$: Observable<User | null> = this.auth.user$;

  async logout() {
    try {
      await this.auth.logout();
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Erreur déconnexion:', error);
    }
  }
}
