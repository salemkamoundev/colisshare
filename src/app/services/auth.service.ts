import { Injectable, inject } from '@angular/core';
import { 
  Auth, 
  authState, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  updateProfile, 
  User,
  setPersistence,
  browserLocalPersistence,
  GoogleAuthProvider,
  signInWithPopup
} from '@angular/fire/auth';
import { Firestore, doc, setDoc } from '@angular/fire/firestore';
import { Observable, from } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AppUser } from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);

  user$: Observable<User | null> = authState(this.auth);

  constructor() {
    setPersistence(this.auth, browserLocalPersistence)
      .then(() => console.log('🔐 Persistance active'))
      .catch((e) => console.error('Erreur persistance:', e));
  }

  // Connexion Email/Pass
  login(email: string, pass: string) {
    return from(signInWithEmailAndPassword(this.auth, email, pass));
  }

  // Connexion Google (Ajouté)
  loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return from(signInWithPopup(this.auth, provider)).pipe(
      switchMap(async (credential) => {
        // On crée aussi le document user si c'est la première connexion
        const user = credential.user;
        const userDoc = doc(this.firestore, `users/${user.uid}`);
        const userData: AppUser = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || 'Utilisateur Google',
          photoURL: user.photoURL || '',
          role: 'transporteur'
        };
        // setDoc avec merge:true pour ne pas écraser un user existant
        await setDoc(userDoc, userData, { merge: true });
        return user;
      })
    );
  }

  // Inscription (Renommé en signUp pour compatibilité)
  signUp(email: string, pass: string, name: string) {
    return from(createUserWithEmailAndPassword(this.auth, email, pass)).pipe(
      switchMap(async (credential) => {
        const user = credential.user;
        
        await updateProfile(user, { displayName: name });
        
        const userDoc = doc(this.firestore, `users/${user.uid}`);
        const userData: AppUser = {
          uid: user.uid,
          email: user.email || '',
          displayName: name,
          photoURL: user.photoURL || '',
          role: 'transporteur'
        };
        
        await setDoc(userDoc, userData);
        return user;
      })
    );
  }

  // Déconnexion
  logout() {
    return from(signOut(this.auth));
  }
}
