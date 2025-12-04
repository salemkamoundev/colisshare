import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; // Import essentiel pour ngModel
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule], // Ajout de FormsModule ici
  templateUrl: './home-page.component.html',
})
export class HomePageComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  // Propriétés liées au formulaire (ngModel)
  email = '';
  password = '';
  displayName = '';
  
  // État de l'interface
  isLoginMode = true;
  isLoading = false;
  errorMessage = '';

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
  }

  async onSubmit() {
    if (this.isLoading) return;
    this.isLoading = true;
    this.errorMessage = '';

    try {
      if (this.isLoginMode) {
        await this.auth.login(this.email, this.password).toPromise();
      } else {
        await this.auth.signUp(this.email, this.password, this.displayName).toPromise();
      }
      // Redirection après succès
      this.router.navigate(['/collaborations/demandes']);
    } catch (err: any) {
      console.error(err);
      this.errorMessage = this.getErrorMessage(err);
    } finally {
      this.isLoading = false;
    }
  }

  async loginGoogle() {
    try {
      await this.auth.loginWithGoogle().toPromise();
      this.router.navigate(['/collaborations/demandes']);
    } catch (err: any) {
      console.error(err);
      this.errorMessage = "Erreur avec Google : " + err.message;
    }
  }

  private getErrorMessage(err: any): string {
    // Traduction basique des erreurs Firebase
    const msg = err.message || '';
    if (msg.includes('auth/invalid-email')) return 'Email invalide.';
    if (msg.includes('auth/user-not-found')) return 'Utilisateur inconnu.';
    if (msg.includes('auth/wrong-password')) return 'Mot de passe incorrect.';
    if (msg.includes('auth/email-already-in-use')) return 'Cet email est déjà utilisé.';
    return 'Une erreur est survenue. Vérifiez vos identifiants.';
  }
}
