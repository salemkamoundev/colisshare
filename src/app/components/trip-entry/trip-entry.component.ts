import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormArray,
  FormControl
} from '@angular/forms';
import { Observable, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';
import { Timestamp } from '@angular/fire/firestore';
import { FirestoreService } from '../../services/firestore.service';
import { AuthService } from '../../services/auth.service';
import { Car } from '../../interfaces/car.interface';
import { CitySelectComponent } from '../city-select/city-select.component';

@Component({
  selector: 'app-trip-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CitySelectComponent],
  templateUrl: './trip-entry.component.html',
})
export class TripEntryComponent implements OnInit {
  private fb = inject(FormBuilder);
  private firestoreService = inject(FirestoreService);
  private router = inject(Router);
  private auth = inject(AuthService);

  tripForm!: FormGroup;
  availableCars$!: Observable<Car[]>;
  loading = false;
  currentUserId: string | null = null;

  ngOnInit(): void {
    // 1. Initialisation du formulaire
    this.initForm();

    // 2. Chargement des données utilisateur et voitures
    this.availableCars$ = this.auth.user$.pipe(
      tap(user => {
        this.currentUserId = user ? user.uid : null;
      }),
      switchMap(user => {
        if (user) {
          return this.firestoreService.getCars(user.uid);
        } else {
          return of([]);
        }
      })
    );
  }

  initForm(): void {
    // Définition explicite des contrôles pour éviter l'erreur "Cannot find control"
    this.tripForm = this.fb.group({
      carId: ['', Validators.required],
      departureCity: ['', Validators.required],
      destinations: this.fb.array([
        this.createDestinationControl()
      ]),
      // CES DEUX CHAMPS DOIVENT CORRESPONDRE AU HTML
      estimatedDepartureTime: ['', Validators.required],
      estimatedArrivalTime: ['', Validators.required],
    });
  }

  createDestinationControl(value: string = ''): FormControl {
    return this.fb.control(value, Validators.required);
  }

  get destinations(): FormArray {
    return this.tripForm.get('destinations') as FormArray;
  }

  addDestination(): void {
    this.destinations.push(this.createDestinationControl());
  }

  removeDestination(index: number): void {
    if (this.destinations.length > 1) {
      this.destinations.removeAt(index);
    } else {
      alert("Il faut au moins une destination !");
    }
  }

  cancelForm(): void {
    if (confirm('🚫 Annuler la saisie ?')) {
      this.router.navigate(['/trajets/historique']);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.tripForm.invalid || !this.currentUserId) {
      // Astuce: Log pour voir quel champ est invalide
      console.log('Form invalid:', this.tripForm.value);
      alert('⚠️ Veuillez remplir tous les champs obligatoires.');
      return;
    }

    this.loading = true;
    const formValue = this.tripForm.value;
    
    // Logique de transformation
    const rawDestinations = formValue.destinations as string[];
    const arrivalCity = rawDestinations[rawDestinations.length - 1]; 
    const steps = rawDestinations.slice(0, -1).map(city => ({
      city: city,
      estimatedTime: ''
    }));

    const tripData = {
      carId: formValue.carId,
      companyId: this.currentUserId,
      driverId: this.currentUserId,
      departureCity: formValue.departureCity,
      arrivalCity: arrivalCity, 
      destinations: rawDestinations,
      steps: steps,
      
      // Conversion des dates string -> Timestamp Firestore
      estimatedDepartureTime: Timestamp.fromDate(new Date(formValue.estimatedDepartureTime)),
      estimatedArrivalTime: Timestamp.fromDate(new Date(formValue.estimatedArrivalTime)),
      
      status: 'pending' as const,
      createdAt: Timestamp.now()
    };

    try {
      await this.firestoreService.addTrip(tripData);
      setTimeout(() => {
          alert(`✅ Trajet enregistré !`);
          this.router.navigate(['/trajets/historique']);
      }, 100);
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      alert('❌ Erreur: ' + error.message);
    } finally {
      this.loading = false;
    }
  }
}
