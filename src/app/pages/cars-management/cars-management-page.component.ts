import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Observable } from 'rxjs';
import { FirestoreService } from '../../services/firestore.service';
import { Car } from '../../interfaces/car.interface';

@Component({
  selector: 'app-cars-management-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './cars-management-page.component.html',
})
export class CarsManagementPageComponent implements OnInit {
  private readonly COMPANY_ID = 'AbC1dE2fG3hI4jK5lM6n';

  cars$!: Observable<Car[]>;
  carForm!: FormGroup;
  editingCar: Car | null = null;
  showModal = false;
  loading = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private firestoreService: FirestoreService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCars();
  }

  initForm(): void {
    // ✅ Valeurs par défaut ajoutées pour éviter le formulaire invalide dès le départ
    this.carForm = this.fb.group({
      make: ['', Validators.required],
      model: ['', Validators.required],
      year: [new Date().getFullYear(), [Validators.required, Validators.min(1900), Validators.max(2100)]],
      licensePlate: ['', Validators.required],
      capacity: [5, [Validators.required, Validators.min(1)]],
      active: [true],
    });
  }

  loadCars(): void {
    try {
      this.cars$ = this.firestoreService.getCars(this.COMPANY_ID);
    } catch (error: any) {
      this.errorMessage = 'Erreur de chargement des voitures.';
    }
  }

  openModal(car?: Car): void {
    this.editingCar = car || null;
    if (car) {
      this.carForm.patchValue(car);
    } else {
      // Reset avec des valeurs par défaut propres
      this.carForm.reset({ 
        year: new Date().getFullYear(),
        capacity: 5,
        active: true 
      });
    }
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingCar = null;
  }

  async onSubmit(): Promise<void> {
    // ✅ DEBUG : Si invalide, on liste les champs manquants
    if (this.carForm.invalid) {
      const controls = this.carForm.controls;
      const invalidFields = [];
      for (const name in controls) {
        if (controls[name].invalid) {
          invalidFields.push(name);
        }
      }
      alert(`⚠️ Impossible d'enregistrer.\nChamps invalides ou manquants :\n👉 ${invalidFields.join('\n👉 ')}`);
      return;
    }

    this.loading = true;

    try {
      if (this.editingCar?.id) {
        const carToUpdate = {
          id: this.editingCar.id,
          ...this.carForm.value,
        };
        await this.firestoreService.updateCar(carToUpdate);
        alert('✅ Voiture mise à jour !');
      } else {
        const carData = this.carForm.value;
        await this.firestoreService.addCar(carData);
        alert('✅ Voiture ajoutée !');
      }
      this.closeModal();
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      alert('❌ Erreur: ' + error.message);
    } finally {
      this.loading = false;
    }
  }

  async deleteCar(carId: string, carName: string): Promise<void> {
    if (!confirm(`🗑️ Supprimer ${carName} ?`)) return;
    this.loading = true;
    try {
      await this.firestoreService.deleteCar(carId);
      alert('✅ Voiture supprimée !');
    } catch (error: any) {
      alert('❌ Erreur: ' + error.message);
    } finally {
      this.loading = false;
    }
  }
}
