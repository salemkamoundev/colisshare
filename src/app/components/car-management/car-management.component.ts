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
  selector: 'app-car-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './car-management.component.html',
})
export class CarManagementComponent implements OnInit {
  private readonly COMPANY_ID = 'AbC1dE2fG3hI4jK5lM6n';

  cars$!: Observable<Car[]>;
  carForm!: FormGroup;
  editingCar: Car | null = null;
  selectedCarId: string | null = null;
  loading = false;

  get isEditing(): boolean {
    return !!this.editingCar;
  }

  constructor(
    private fb: FormBuilder,
    private firestoreService: FirestoreService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCars();
  }

  initForm(): void {
    this.carForm = this.fb.group({
      make: ['', Validators.required],
      model: ['', Validators.required],
      year: ['', [Validators.required, Validators.min(1900)]],
      licensePlate: ['', Validators.required],
      capacity: ['', [Validators.required, Validators.min(1)]],
      active: [true],
    });
    this.editingCar = null;
    this.selectedCarId = null;
  }

  loadCars(): void {
    this.cars$ = this.firestoreService.getCars(this.COMPANY_ID);
  }

  onSelectCar(car: Car): void {
    this.selectedCarId = car.id || null;
    this.editCar(car);
  }

  editCar(car: Car): void {
    this.editingCar = car;
    this.selectedCarId = car.id || null;
    this.carForm.patchValue(car);
  }

  async onDeleteCar(carId: string): Promise<void> {
    if (!confirm('🗑️ Supprimer cette voiture ?')) return;

    this.loading = true;
    try {
      await this.firestoreService.deleteCar(carId);
      alert('✅ Voiture supprimée !');
      this.selectedCarId = null;
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      alert('❌ Erreur: ' + error.message);
    } finally {
      this.loading = false;
    }
  }

  async deleteCar(carId: string): Promise<void> {
    await this.onDeleteCar(carId);
  }

  async onSubmit(): Promise<void> {
    if (this.carForm.invalid) {
      alert('⚠️ Veuillez remplir tous les champs requis.');
      return;
    }

    this.loading = true;

    try {
      if (this.editingCar?.id) {
        // UPDATE
        const carToUpdate = {
          id: this.editingCar.id,
          ...this.carForm.value,
        };
        await this.firestoreService.updateCar(carToUpdate);
        alert('✅ Voiture mise à jour !');
      } else {
        // CREATE
        const carData = this.carForm.value;
        await this.firestoreService.addCar(carData);
        alert('✅ Voiture ajoutée !');
      }

      this.initForm();
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      alert('❌ Erreur: ' + error.message);
    } finally {
      this.loading = false;
    }
  }

  cancelEdit(): void {
    this.initForm();
  }
}
