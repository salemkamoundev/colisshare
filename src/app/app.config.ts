import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    // Initialisation de Firebase
    provideFirebaseApp(() => initializeApp(environment.firebaseConfig)),
    // Auth Provider (Corrige l'erreur NG0201)
    provideAuth(() => getAuth()),
    // Firestore Provider
    provideFirestore(() => getFirestore())
  ]
};
