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
  showForm = false;
  loading = false;
  loadError = false;
  errorMessage = '';

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
  }

  loadCars(): void {
    try {
      this.cars$ = this.firestoreService.getCars(this.COMPANY_ID);
      this.loadError = false;
      this.errorMessage = '';
    } catch (error: any) {
      this.loadError = true;
      this.errorMessage = error.message || 'Erreur de chargement';
    }
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.initForm();
    }
  }

  onSelectCar(car: Car): void {
    this.editingCar = car;
    this.carForm.patchValue(car);
    this.showForm = true;
  }

  openModal(car?: Car): void {
    this.editingCar = car || null;
    if (car) {
      this.carForm.patchValue(car);
    } else {
      this.carForm.reset({ active: true });
    }
    this.showModal = true;
    this.showForm = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.showForm = false;
    this.editingCar = null;
    this.carForm.reset({ active: true });
  }

  cancelEdit(): void {
    this.showForm = false;
    this.editingCar = null;
    this.carForm.reset({ active: true });
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

      this.closeModal();
      this.showForm = false;
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      alert('❌ Erreur: ' + error.message);
    } finally {
      this.loading = false;
    }
  }

  async onDeleteCar(carId: string, carName: string): Promise<void> {
    if (!confirm(`🗑️ Supprimer ${carName} ?`)) return;

    this.loading = true;
    try {
      await this.firestoreService.deleteCar(carId);
      alert('✅ Voiture supprimée !');
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      alert('❌ Erreur: ' + error.message);
    } finally {
      this.loading = false;
    }
  }

  async deleteCar(carId: string): Promise<void> {
    await this.onDeleteCar(carId, 'cette voiture');
  }
}
