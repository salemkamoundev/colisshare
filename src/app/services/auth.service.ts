import { Injectable, inject, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import {
  Auth,
  authState,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  User,
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  serverTimestamp,
} from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { AppUser } from '../interfaces/user.interface';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);
  private ngZone = inject(NgZone);

  user$: Observable<User | null> = authState(this.auth);

  constructor() {}

  async signUp(email: string, password: string, displayName: string): Promise<void> {
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    await this.saveUserProfile(cred.user, displayName);
    this.ngZone.run(() => this.router.navigate(['/']));
  }

  async login(email: string, password: string): Promise<void> {
    await signInWithEmailAndPassword(this.auth, email, password);
    this.ngZone.run(() => this.router.navigate(['/']));
  }

  async loginWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(this.auth, provider);
    const user = cred.user;
    await this.saveUserProfile(user, user.displayName || user.email || 'Utilisateur');
    this.ngZone.run(() => this.router.navigate(['/']));
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.ngZone.run(() => this.router.navigate(['/login']));
  }

  private async saveUserProfile(user: User, displayName: string): Promise<void> {
    const ref = doc(this.firestore, 'users', user.uid);
    const data: AppUser = {
      uid: user.uid,
      email: user.email || '',
      displayName,
      photoURL: user.photoURL || undefined,
      createdAt: serverTimestamp(),
    };
    await setDoc(ref, data, { merge: true });
  }
}
