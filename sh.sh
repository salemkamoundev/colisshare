#!/bin/bash

echo "🔧 Correction des erreurs d'initialisation et de typage..."
echo "========================================================"

# 1) Correction Login Page
cat > src/app/pages/auth/login-page.component.ts << 'EOF'
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
EOF

# 2) Correction Signup Page
cat > src/app/pages/auth/signup-page.component.ts << 'EOF'
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
EOF

# 3) Correction Users Page
cat > src/app/pages/users/users-page.component.ts << 'EOF'
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
EOF

# 4) Correction CollaborationService (Typage)
cat > src/app/services/collaboration.service.ts << 'EOF'
import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  collection,
  collectionData,
  query,
  where,
  addDoc,
  doc,
  updateDoc,
} from '@angular/fire/firestore';
import { Observable, combineLatest, map, switchMap, of } from 'rxjs';
import { AppUser } from '../interfaces/user.interface';
import { Collaboration, CollaborationStatus } from '../interfaces/collaboration.interface';
import { Trip } from '../interfaces/trip.interface';

@Injectable({ providedIn: 'root' })
export class CollaborationService {
  private firestore = inject(Firestore);

  // === USERS ===
  getAllUsers(): Observable<AppUser[]> {
    const colRef = collection(this.firestore, 'users');
    return collectionData(colRef, { idField: 'uid' }) as Observable<AppUser[]>;
  }

  // === COLLABORATIONS ===
  getUserCollaborations(userId: string): Observable<Collaboration[]> {
    const colRef = collection(this.firestore, 'collaborations');
    const q = query(
      colRef,
      where('participants', 'array-contains', userId)
    );
    return collectionData(q, { idField: 'id' }) as Observable<Collaboration[]>;
  }

  getPendingRequestsForUser(userId: string): Observable<Collaboration[]> {
    const colRef = collection(this.firestore, 'collaborations');
    const q = query(
      colRef,
      where('targetId', '==', userId),
      where('status', '==', 'pending')
    );
    return collectionData(q, { idField: 'id' }) as Observable<Collaboration[]>;
  }

  async sendRequest(requesterId: string, targetId: string): Promise<void> {
    if (requesterId === targetId) {
      throw new Error('Impossible de se demander soi-même.');
    }
    const colRef = collection(this.firestore, 'collaborations');
    const data: Collaboration = {
      participants: [requesterId, targetId],
      requesterId,
      targetId,
      status: 'pending',
      createdAt: new Date(),
    };
    await addDoc(colRef, data);
  }

  async updateRequestStatus(collabId: string, status: CollaborationStatus): Promise<void> {
    const ref = doc(this.firestore, 'collaborations', collabId);
    await updateDoc(ref, { status });
  }

  // === TRAJETS PARTAGÉS ===
  private getTripsByDriver(userId: string): Observable<Trip[]> {
    const colRef = collection(this.firestore, 'trips');
    const q = query(colRef, where('driverId', '==', userId));
    return collectionData(q, { idField: 'id' }) as Observable<Trip[]>;
  }

  getSharedTripsForUser(currentUserId: string): Observable<Trip[]> {
    const colRef = collection(this.firestore, 'collaborations');
    const q = query(
      colRef,
      where('participants', 'array-contains', currentUserId),
      where('status', '==', 'accepted')
    );

    const accepted$ = collectionData(q, { idField: 'id' }) as Observable<Collaboration[]>;

    return accepted$.pipe(
      switchMap(collabs => {
        const otherIds = Array.from(
          new Set(
            collabs
              .map(c => c.participants.find(id => id !== currentUserId))
              .filter((id): id is string => !!id)
          )
        );

        if (otherIds.length === 0) {
          // ✅ Retourne un Observable<Trip[]> vide au lieu de juste []
          return of([] as Trip[]);
        }

        const streams = otherIds.map(id => this.getTripsByDriver(id));
        // Combine les résultats et aplatit le tableau
        return combineLatest(streams).pipe(
          map(arrays => arrays.flat())
        );
      })
    );
  }
}
EOF

echo "✅ Corrections appliquées !"
echo "🚀 Relance : ng serve"
