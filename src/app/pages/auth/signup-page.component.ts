import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './signup-page.component.html',
})
export class SignupPageComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);

  loading = false;
  errorMessage = '';

  form = this.fb.group({
    displayName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;
    this.loading = true;
    this.errorMessage = '';
    try {
      const { displayName, email, password } = this.form.value;
      await this.auth.signUp(email!, password!, displayName!);
    } catch (e: any) {
      this.errorMessage = e.message || 'Erreur inscription';
    } finally {
      this.loading = false;
    }
  }
}
