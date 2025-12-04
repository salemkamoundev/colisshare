import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormArray,
} from '@angular/forms';
import { Observable } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';
import { FirestoreService } from '../../services/firestore.service';
import { Car } from '../../interfaces/car.interface';
import { TripStep } from '../../interfaces/trip.interface';
import { CitySelectComponent } from '../city-select/city-select.component';

@Component({
  selector: 'app-trip-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CitySelectComponent],
  templateUrl: './trip-entry.component.html',
})
export class TripEntryComponent implements OnInit {
  private readonly COMPANY_ID = 'AbC1dE2fG3hI4jK5lM6n';
  private readonly DRIVER_ID = 'UIDCurrentDriver';

  tripForm!: FormGroup;
  availableCars$!: Observable<Car[]>;
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private firestoreService: FirestoreService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.availableCars$ = this.firestoreService.getCars(this.COMPANY_ID);
  }

  initForm(): void {
    this.tripForm = this.fb.group({
      carId: ['', Validators.required],
      departureCity: ['', Validators.required],
      arrivalCity: ['', Validators.required],
      estimatedDepartureTime: ['', Validators.required],
      estimatedArrivalTime: ['', Validators.required],
      steps: this.fb.array([]),
    });
  }

  get steps(): FormArray {
    return this.tripForm.get('steps') as FormArray;
  }

  createStepGroup(step?: TripStep): FormGroup {
    return this.fb.group({
      city: [step?.city || '', Validators.required],
      estimatedTime: [step?.estimatedTime || '', Validators.required],
    });
  }

  addStep(): void {
    this.steps.push(this.createStepGroup());
  }

  removeStep(index: number): void {
    this.steps.removeAt(index);
  }

  cancelForm(): void {
    const hasData =
      this.tripForm.dirty ||
      this.tripForm.value.carId ||
      this.tripForm.value.departureCity;

    if (hasData) {
      if (
        confirm(
          '🚫 Voulez-vous vraiment annuler ? Les modifications seront perdues.'
        )
      ) {
        this.tripForm.reset();
        this.router.navigate(['/trajets/historique']);
      }
    } else {
      this.router.navigate(['/trajets/historique']);
    }
  }

  async onSubmit(): Promise<void> {
    // Réinitialiser les messages
    this.successMessage = '';
    this.errorMessage = '';

    if (this.tripForm.invalid) {
      this.errorMessage = '⚠️ Veuillez remplir tous les champs requis.';
      this.markFormGroupTouched(this.tripForm);
      
      // Afficher aussi une alerte
      alert(this.errorMessage);
      return;
    }

    this.loading = true;

    const formValue = this.tripForm.value;
    const tripData = {
      carId: formValue.carId,
      companyId: this.COMPANY_ID,
      driverId: this.DRIVER_ID,
      departureCity: formValue.departureCity,
      arrivalCity: formValue.arrivalCity,
      estimatedDepartureTime: Timestamp.fromDate(
        new Date(formValue.estimatedDepartureTime)
      ),
      estimatedArrivalTime: Timestamp.fromDate(
        new Date(formValue.estimatedArrivalTime)
      ),
      status: 'pending' as const,
      steps: formValue.steps || [],
    };

    try {
      const tripId = await this.firestoreService.addTrip(tripData);
      
      // Message de succès
      this.successMessage = `✅ Trajet enregistré avec succès ! (ID: ${tripId})`;
      console.log('✅ Trajet créé:', tripId, tripData);

      // Afficher une alerte de confirmation
      alert(`✅ Trajet enregistré avec succès !\n\n📍 ${tripData.departureCity} → ${tripData.arrivalCity}\n🚗 Voiture: ${tripData.carId}\n📅 Départ: ${formValue.estimatedDepartureTime}`);

      // Reset le formulaire
      this.tripForm.reset();

      // Rediriger après 2 secondes
      setTimeout(() => {
        this.router.navigate(['/trajets/historique']);
      }, 2000);

    } catch (error: any) {
      console.error('❌ Erreur lors de l\'enregistrement:', error);
      this.errorMessage = `❌ Erreur: ${error.message || 'Impossible d\'enregistrer le trajet'}`;
      
      // Afficher une alerte d'erreur
      alert(this.errorMessage);
    } finally {
      this.loading = false;
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
