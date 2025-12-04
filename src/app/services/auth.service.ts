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
  updateProfile
} from '@angular/fire/auth';
import {
  Firestore,
  doc,
  setDoc,
  serverTimestamp,
  getDoc
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

  async signUp(email: string, password: string, displayName: string): Promise<void> {
    // 1. Créer le compte Auth
    const cred = await createUserWithEmailAndPassword(this.auth, email, password);
    
    // 2. Mettre à jour le profil Auth (displayName)
    if (cred.user) {
        await updateProfile(cred.user, { displayName });
        // 3. Créer le document User dans Firestore
        await this.saveUserProfile(cred.user, displayName);
    }
    
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
    // Sauvegarder/Mettre à jour le profil Firestore
    await this.saveUserProfile(user, user.displayName || user.email || 'Utilisateur');
    this.ngZone.run(() => this.router.navigate(['/']));
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
    this.ngZone.run(() => this.router.navigate(['/login']));
  }

  private async saveUserProfile(user: User, displayName: string): Promise<void> {
    const userRef = doc(this.firestore, 'users', user.uid);
    // On vérifie si le user existe déjà pour ne pas écraser createdAt
    const userSnap = await getDoc(userRef);
    
    const data: AppUser = {
      uid: user.uid,
      email: user.email || '',
      displayName: displayName,
      photoURL: user.photoURL || undefined,
      // Si existe déjà, on garde l'ancien, sinon on met maintenant
      createdAt: userSnap.exists() ? userSnap.data()['createdAt'] : serverTimestamp(),
    };

    // setDoc avec merge: true met à jour ou crée
    await setDoc(userRef, data, { merge: true });
  }
}
