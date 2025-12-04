import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideFirebaseApp(() =>
      initializeApp({
apiKey: "AIzaSyD8C-_dQV26aCyoAaBrhyTfILhB3xup_KA",
        authDomain: "colishare.firebaseapp.com",
        databaseURL: "https://colishare-default-rtdb.firebaseio.com",
        projectId: "colishare",
        storageBucket: "colishare.firebasestorage.app",
        messagingSenderId: "842349898218",
        appId: "1:842349898218:web:86d4807652626e8c6b2a93",
        measurementId: "G-XR2SNZLHSS"
      })
    ),
    provideFirestore(() => getFirestore()),
  ],
};
