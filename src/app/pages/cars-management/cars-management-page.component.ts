import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { FirestoreService } from '../../services/firestore.service';
import { Car } from '../../interfaces/car.interface';

@Component({
  selector: 'app-cars-management-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cars-management-page.component.html'
})
export class CarsManagementPageComponent implements OnInit {
  private auth = inject(AuthService);
  private firestoreService = inject(FirestoreService);

  cars: Car[] = [];
  loading = true;
  showForm = false;
  currentUser: any = null;
  
  // ID de la voiture en cours d'édition (null si c'est une création)
  editingCarId: string | null = null;

  // Modèle pour le formulaire
  newCar: Partial<Car> = {
    brand: '',
    model: '',
    licensePlate: '',
    capacity: 0,
    status: 'available'
  };

  ngOnInit() {
    this.auth.user$.subscribe(async (user) => {
      this.currentUser = user;
      if (user) {
        await this.loadCars();
      }
    });
  }

  async loadCars() {
    if (!this.currentUser) return;
    this.loading = true;
    try {
      this.cars = await this.firestoreService.getUserCars(this.currentUser.uid);
    } catch (error) {
      console.error("Erreur chargement voitures:", error);
    } finally {
      this.loading = false;
    }
  }

  // Ouvre le formulaire pour une NOUVELLE voiture
  openNewCarForm() {
    this.resetForm();
    this.showForm = true;
  }

  // Ouvre le formulaire pour MODIFIER une voiture existante
  editCar(car: Car) {
    this.editingCarId = car.id || null;
    // On copie les données de la voiture dans le formulaire
    this.newCar = { ...car };
    this.showForm = true;
    
    // Scroll vers le formulaire pour l'UX
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleForm() {
    if (this.showForm) {
      this.showForm = false;
      this.resetForm();
    } else {
      this.openNewCarForm();
    }
  }

  resetForm() {
    this.editingCarId = null;
    this.newCar = { brand: '', model: '', licensePlate: '', capacity: 0, status: 'available' };
  }

  async onSubmit() {
    if (!this.currentUser) return;

    try {
      if (this.editingCarId) {
        // --- MODE MODIFICATION ---
        const carToUpdate: Car = {
          id: this.editingCarId,
          ownerId: this.currentUser.uid, // Sécurité : on garde le owner
          brand: this.newCar.brand || '',
          model: this.newCar.model || '',
          licensePlate: this.newCar.licensePlate || '',
          capacity: this.newCar.capacity || 0,
          status: this.newCar.status || 'available',
          active: true
        };
        
        await this.firestoreService.updateCar(carToUpdate);
        // alert('✅ Voiture modifiée avec succès !');

      } else {
        // --- MODE CRÉATION ---
        const carToAdd: Car = {
          ownerId: this.currentUser.uid,
          brand: this.newCar.brand || '',
          model: this.newCar.model || '',
          licensePlate: this.newCar.licensePlate || '',
          capacity: this.newCar.capacity || 0,
          status: 'available',
          active: true
        };

        await this.firestoreService.addCar(carToAdd);
        // alert('✅ Voiture ajoutée avec succès !');
      }

      // Reset et rechargement
      this.showForm = false;
      this.resetForm();
      await this.loadCars();

    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error);
      alert("Erreur lors de l'enregistrement.");
    }
  }

  async deleteCar(carId: string | undefined) {
    if (!carId) return;
    if (confirm('Voulez-vous vraiment supprimer ce véhicule ?')) {
      await this.firestoreService.deleteCar(carId);
      await this.loadCars();
    }
  }
}
