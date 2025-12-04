import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './home-page.component.html',
})
export class HomePageComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  isLoginMode = true;
  loading = false;
  errorMessage = '';

  authForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    displayName: [''] 
  });

  get isSignup() { return !this.isLoginMode; }

  toggleMode() {
    this.isLoginMode = !this.isLoginMode;
    this.errorMessage = '';
    this.authForm.reset();
    if (this.isSignup) {
      this.authForm.get('displayName')?.setValidators([Validators.required]);
    } else {
      this.authForm.get('displayName')?.clearValidators();
    }
    this.authForm.get('displayName')?.updateValueAndValidity();
  }

  async onSubmit() {
    if (this.authForm.invalid) return;
    this.loading = true;
    this.errorMessage = '';
    const { email, password, displayName } = this.authForm.value;

    try {
      if (this.isLoginMode) {
        await this.auth.login(email, password);
      } else {
        await this.auth.signUp(email, password, displayName);
      }
      this.router.navigate(['/collaborations/demandes']);
    } catch (error: any) {
      this.errorMessage = this.translateError(error.code) || error.message;
    } finally {
      this.loading = false;
    }
  }

  async loginGoogle() {
    this.loading = true;
    try {
      await this.auth.loginWithGoogle();
      this.router.navigate(['/collaborations/demandes']);
    } catch (error: any) {
      this.errorMessage = this.translateError(error.code) || error.message;
    } finally {
      this.loading = false;
    }
  }

  private translateError(code: string): string {
    switch (code) {
      case 'auth/email-already-in-use': return 'Email déjà utilisé.';
      case 'auth/invalid-credential': return 'Identifiants incorrects.';
      case 'auth/user-not-found': return 'Compte introuvable.';
      case 'auth/wrong-password': return 'Mot de passe incorrect.';
      default: return 'Une erreur est survenue.';
    }
  }
}
