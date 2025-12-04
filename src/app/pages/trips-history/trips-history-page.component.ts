import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Observable, map } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';
import { FirestoreService } from '../../services/firestore.service';
import { Trip, TripStatus } from '../../interfaces/trip.interface';
import { Car } from '../../interfaces/car.interface';

interface TripWithCar extends Trip {
  car?: Car;
}

@Component({
  selector: 'app-trips-history-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './trips-history-page.component.html',
})
export class TripsHistoryPageComponent implements OnInit {
  private readonly COMPANY_ID = 'AbC1dE2fG3hI4jK5lM6n';

  trips$!: Observable<TripWithCar[]>;
  filteredTrips: TripWithCar[] = [];
  availableCars$!: Observable<Car[]>;
  availableCars: Car[] = [];
  
  searchText = '';
  filterStatus: TripStatus | 'all' = 'all';
  sortField: 'departureCity' | 'estimatedDepartureTime' | 'status' = 'estimatedDepartureTime';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  showEditModal = false;
  editForm!: FormGroup;
  selectedTrip: Trip | null = null;
  
  showDetailsModal = false;
  detailsTrip: TripWithCar | null = null;
  
  loading = false;
  selectedTrips = new Set<string>();
  selectAll = false;

  statusLabels: Record<TripStatus, string> = {
    pending: 'En attente',
    in_progress: 'En cours',
    completed: 'Terminé',
    cancelled: 'Annulé',
  };

  statusColors: Record<TripStatus, string> = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-300',
    completed: 'bg-green-100 text-green-800 border-green-300',
    cancelled: 'bg-red-100 text-red-800 border-red-300',
  };

  constructor(
    private fb: FormBuilder,
    private firestoreService: FirestoreService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCars();
    this.loadTrips();
    this.initEditForm();
  }

  loadCars(): void {
    this.availableCars$ = this.firestoreService.getCars(this.COMPANY_ID);
    this.availableCars$.subscribe(cars => {
      this.availableCars = cars;
    });
  }

  loadTrips(): void {
    this.trips$ = this.firestoreService.getTrips(this.COMPANY_ID).pipe(
      map(trips => {
        const tripsWithCar = trips.map(trip => ({
          ...trip,
          car: this.availableCars.find(car => car.id === trip.carId)
        }));
        this.filteredTrips = this.applyFilters(tripsWithCar);
        return this.filteredTrips;
      })
    );
  }

  applyFilters(trips: TripWithCar[]): TripWithCar[] {
    return trips.filter(trip => {
      if (this.searchText) {
        const search = this.searchText.toLowerCase();
        const matchCity = trip.departureCity.toLowerCase().includes(search) ||
                         trip.arrivalCity.toLowerCase().includes(search);
        const matchCar = trip.car?.licensePlate?.toLowerCase().includes(search) ||
                        trip.car?.make?.toLowerCase().includes(search);
        if (!matchCity && !matchCar) return false;
      }
      if (this.filterStatus !== 'all' && trip.status !== this.filterStatus) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      let compareA: any;
      let compareB: any;
      if (this.sortField === 'estimatedDepartureTime') {
        compareA = a.estimatedDepartureTime.toMillis();
        compareB = b.estimatedDepartureTime.toMillis();
      } else if (this.sortField === 'departureCity') {
        compareA = a.departureCity.toLowerCase();
        compareB = b.departureCity.toLowerCase();
      } else {
        compareA = a.status;
        compareB = b.status;
      }
      const comparison = compareA < compareB ? -1 : compareA > compareB ? 1 : 0;
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  initEditForm(): void {
    this.editForm = this.fb.group({
      carId: ['', Validators.required],
      departureCity: ['', Validators.required],
      arrivalCity: ['', Validators.required],
      estimatedDepartureTime: ['', Validators.required],
      estimatedArrivalTime: ['', Validators.required],
      status: ['pending', Validators.required],
    });
  }

  onSearchChange(): void { this.loadTrips(); }
  onFilterStatusChange(): void { this.loadTrips(); }
  
  onSortChange(field: typeof this.sortField): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.loadTrips();
  }

  clearFilters(): void {
    this.searchText = '';
    this.filterStatus = 'all';
    this.sortField = 'estimatedDepartureTime';
    this.sortDirection = 'desc';
    this.loadTrips();
  }

  countByStatus(status: TripStatus): number {
    return this.filteredTrips.filter(t => t.status === status).length;
  }

  toggleSelectAll(): void {
    this.selectAll = !this.selectAll;
    if (this.selectAll) {
      this.filteredTrips.forEach(trip => {
        if (trip.id) this.selectedTrips.add(trip.id);
      });
    } else {
      this.selectedTrips.clear();
    }
  }

  toggleSelect(tripId: string): void {
    if (this.selectedTrips.has(tripId)) {
      this.selectedTrips.delete(tripId);
    } else {
      this.selectedTrips.add(tripId);
    }
  }

  async deleteSelected(): Promise<void> {
    if (this.selectedTrips.size === 0) return;
    const count = this.selectedTrips.size;
    if (!confirm(`🗑️ Supprimer ${count} trajet(s) ?`)) return;
    this.loading = true;
    try {
      await Promise.all(Array.from(this.selectedTrips).map(id =>
        this.firestoreService.deleteTrip(id)
      ));
      alert(`✅ ${count} trajet(s) supprimé(s) !`);
      this.selectedTrips.clear();
      this.selectAll = false;
    } catch (error: any) {
      alert('❌ Erreur: ' + error.message);
    } finally {
      this.loading = false;
    }
  }

  openDetailsModal(trip: TripWithCar): void {
    this.detailsTrip = trip;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.detailsTrip = null;
  }

  openEditModal(trip: Trip): void {
    this.selectedTrip = trip;
    const depTime = trip.estimatedDepartureTime.toDate();
    const arrTime = trip.estimatedArrivalTime.toDate();
    this.editForm.patchValue({
      carId: trip.carId,
      departureCity: trip.departureCity,
      arrivalCity: trip.arrivalCity,
      estimatedDepartureTime: this.toDatetimeLocal(depTime),
      estimatedArrivalTime: this.toDatetimeLocal(arrTime),
      status: trip.status,
    });
    this.showEditModal = true;
  }

  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedTrip = null;
    this.editForm.reset();
  }

  async updateTrip(): Promise<void> {
    if (this.editForm.invalid || !this.selectedTrip?.id) {
      alert('⚠️ Formulaire invalide');
      return;
    }
    this.loading = true;
    try {
      const formValue = this.editForm.value;
      const updatedTrip: Trip = {
        ...this.selectedTrip,
        carId: formValue.carId,
        departureCity: formValue.departureCity,
        arrivalCity: formValue.arrivalCity,
        estimatedDepartureTime: Timestamp.fromDate(new Date(formValue.estimatedDepartureTime)),
        estimatedArrivalTime: Timestamp.fromDate(new Date(formValue.estimatedArrivalTime)),
        status: formValue.status,
        updatedAt: Timestamp.now(),
      };
      await this.firestoreService.updateTrip(updatedTrip);
      alert('✅ Trajet mis à jour !');
      this.closeEditModal();
    } catch (error: any) {
      alert('❌ Erreur: ' + error.message);
    } finally {
      this.loading = false;
    }
  }

  async deleteTrip(trip: Trip): Promise<void> {
    if (!trip.id) return;
    if (!confirm(`🗑️ Supprimer ${trip.departureCity} → ${trip.arrivalCity} ?`)) return;
    this.loading = true;
    try {
      await this.firestoreService.deleteTrip(trip.id);
      alert('✅ Trajet supprimé !');
    } catch (error: any) {
      alert('❌ Erreur: ' + error.message);
    } finally {
      this.loading = false;
    }
  }

  async duplicateTrip(trip: Trip): Promise<void> {
    this.loading = true;
    try {
      const { id, createdAt, updatedAt, ...tripData } = trip;
      await this.firestoreService.addTrip({
        ...tripData,
        status: 'pending' as TripStatus,
      });
      alert('✅ Trajet dupliqué !');
    } catch (error: any) {
      alert('❌ Erreur: ' + error.message);
    } finally {
      this.loading = false;
    }
  }
  async quickUpdateStatus(trip: Trip, newStatus: TripStatus): Promise<void> {
    if (!trip.id) return;
    this.loading = true;
    try {
      await this.firestoreService.updateTrip({
        ...trip,
        status: newStatus,
        updatedAt: Timestamp.now(),
      });
    } catch (error: any) {
      alert('❌ Erreur: ' + error.message);
    } finally {
      this.loading = false;
    }
  }

  goToCreateTrip(): void {
    this.router.navigate(['/trajets/saisie']);
  }

  exportToCSV(): void {
    const headers = ['Départ', 'Arrivée', 'Date Départ', 'Date Arrivée', 'Statut', 'Voiture'];
    const rows = this.filteredTrips.map(trip => [
      trip.departureCity,
      trip.arrivalCity,
      this.formatDate(trip.estimatedDepartureTime),
      this.formatDate(trip.estimatedArrivalTime),
      this.statusLabels[trip.status],
      trip.car ? `${trip.car.make} ${trip.car.model} (${trip.car.licensePlate})` : 'N/A'
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trajets-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private toDatetimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  formatDate(timestamp: Timestamp): string {
    const date = timestamp.toDate();
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getCarInfo(car?: Car): string {
    if (!car) return 'N/A';
    return `${car.make} ${car.model} (${car.licensePlate})`;
  }
}
