import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { getDatabase, provideDatabase } from '@angular/fire/database'; // Import ajouté
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // Initialisation de Firebase
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    // Auth Provider
    provideAuth(() => getAuth()),
    // Firestore Provider
    provideFirestore(() => getFirestore()),
    // Realtime Database Provider (C'était le manquant pour le Chat)
    provideDatabase(() => getDatabase())
  ]
};
