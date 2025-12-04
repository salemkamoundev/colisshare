import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login-page.component.html',
})
export class LoginPageComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  loading = false;
  errorMessage = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMessage = '';
    try {
      const { email, password } = this.form.value;
      await this.auth.login(email!, password!);
    } catch (e: any) {
      this.errorMessage = e.message || 'Erreur de connexion';
    } finally {
      this.loading = false;
    }
  }

  async loginWithGoogle(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    try {
      await this.auth.loginWithGoogle();
    } catch (e: any) {
      this.errorMessage = e.message || 'Erreur Google';
    } finally {
      this.loading = false;
    }
  }
}
