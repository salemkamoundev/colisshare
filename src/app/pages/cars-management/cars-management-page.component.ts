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

  // Modèle pour le formulaire
  newCar: Partial<Car> = {
    brand: '',
    model: '',
    licensePlate: '',
    capacity: 0,
    status: 'available'
  };

  ngOnInit() {
    // On récupère l'utilisateur connecté pour charger SES voitures
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

  toggleForm() {
    this.showForm = !this.showForm;
  }

  async onSubmit() {
    if (!this.currentUser) return;

    try {
      const carToAdd: Car = {
        ownerId: this.currentUser.uid,
        brand: this.newCar.brand || '',
        model: this.newCar.model || '',
        licensePlate: this.newCar.licensePlate || '',
        capacity: this.newCar.capacity || 0,
        status: 'available'
      };

      await this.firestoreService.addCar(carToAdd);
      
      // Reset du formulaire et rechargement
      this.newCar = { brand: '', model: '', licensePlate: '', capacity: 0, status: 'available' };
      this.showForm = false;
      await this.loadCars();
    } catch (error) {
      console.error("Erreur lors de l'ajout:", error);
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
