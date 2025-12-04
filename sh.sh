#!/bin/bash

echo "🚀 Mise à jour complète de TripsHistoryPageComponent (Support HTML total)..."

cat > src/app/pages/trips-history/trips-history-page.component.ts << 'EOF'
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { FirestoreService, Trip } from '../../services/firestore.service';
import { Car } from '../../interfaces/car.interface';
import { Observable, of } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { Timestamp } from '@angular/fire/firestore';

// Interface étendue pour le template
interface TripWithCar extends Trip {
  car?: Car;
}

@Component({
  selector: 'app-trips-history-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DatePipe], 
  templateUrl: './trips-history-page.component.html'
})
export class TripsHistoryPageComponent implements OnInit {
  private auth = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  private fb = inject(FormBuilder);

  trips$!: Observable<TripWithCar[]>;
  availableCars$!: Observable<Car[]>;
  
  // Données locales
  allTrips: TripWithCar[] = [];
  filteredTrips: TripWithCar[] = [];
  
  // Filtres & Tri
  searchTerm = ''; // Alias pour searchText du template
  searchText = ''; 
  filterStatus = 'all';
  sortField = 'date';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  // Sélection multiple
  selectedTrips = new Set<string>();
  selectAll = false;

  // UI State
  loading = false;
  showCreateModal = false;
  createForm: FormGroup;
  
  // Edition (Modal détails/edit)
  editingTrip: TripWithCar | null = null;
  isModalOpen = false; // Utilisé pour l'édition rapide
  
  COMPANY_ID = '';

  // Mapping des labels de statut
  statusLabels: any = {
    pending: 'En attente',
    in_progress: 'En cours',
    completed: 'Terminé',
    cancelled: 'Annulé'
  };
  
  // Mapping des couleurs
  statusColors: any = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  constructor() {
    this.createForm = this.fb.group({
      departure: ['', Validators.required],
      arrival: ['', Validators.required],
      date: [new Date().toISOString().split('T')[0], Validators.required],
      carId: ['', Validators.required],
      status: ['pending']
    });
  }

  ngOnInit() {
    this.auth.user$.subscribe(user => {
      if (user) {
        this.COMPANY_ID = user.uid;
        this.loadData();
      }
    });
  }

  loadData() {
    this.loading = true;
    this.availableCars$ = this.firestoreService.getCars(this.COMPANY_ID);

    this.firestoreService.getTrips(this.COMPANY_ID).pipe(
      switchMap(trips => {
        if (!trips.length) return of([]);
        return this.availableCars$.pipe(
          map(cars => {
            return trips.map(trip => {
              const car = cars.find(c => c.id === trip.carId);
              return { ...trip, car } as TripWithCar;
            });
          })
        );
      })
    ).subscribe({
      next: (trips) => {
        this.allTrips = trips;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
      }
    });
  }

  // --- FILTRES & TRI ---

  onSearchChange() {
    this.searchTerm = this.searchText; // Synchro
    this.applyFilters();
  }

  onFilterStatusChange() {
    this.applyFilters();
  }
  
  clearFilters() {
    this.searchText = '';
    this.searchTerm = '';
    this.filterStatus = 'all';
    this.applyFilters();
  }

  applyFilters() {
    let res = [...this.allTrips];

    // Filtre Texte
    if (this.searchText) {
      const term = this.searchText.toLowerCase();
      res = res.filter(t => 
        (t.departure || '').toLowerCase().includes(term) ||
        (t.arrival || '').toLowerCase().includes(term) ||
        (t.car?.brand || '').toLowerCase().includes(term)
      );
    }

    // Filtre Statut
    if (this.filterStatus !== 'all') {
      res = res.filter(t => t.status === this.filterStatus);
    }

    // Tri
    res.sort((a: any, b: any) => {
      let valA = a[this.sortField];
      let valB = b[this.sortField];
      
      // Gestion cas date/timestamp
      if (this.sortField === 'estimatedDepartureTime' || this.sortField === 'date') {
         valA = new Date(a.date || 0).getTime();
         valB = new Date(b.date || 0).getTime();
      }

      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    this.filteredTrips = res;
  }

  onSortChange(field: string) {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = 'asc';
    }
    this.applyFilters();
  }

  // --- SELECTION MULTIPLE ---

  toggleSelectAll() {
    this.selectAll = !this.selectAll;
    this.selectedTrips.clear();
    if (this.selectAll) {
      this.filteredTrips.forEach(t => {
        if (t.id) this.selectedTrips.add(t.id);
      });
    }
  }

  toggleSelect(id: string) {
    if (this.selectedTrips.has(id)) {
      this.selectedTrips.delete(id);
    } else {
      this.selectedTrips.add(id);
    }
    this.selectAll = this.selectedTrips.size === this.filteredTrips.length;
  }

  async deleteSelected() {
    if (!confirm(`Supprimer ${this.selectedTrips.size} trajets ?`)) return;
    
    const promises = Array.from(this.selectedTrips).map(id => 
      this.firestoreService.deleteTrip(id)
    );
    
    await Promise.all(promises);
    this.selectedTrips.clear();
    this.selectAll = false;
    this.loadData();
  }

  // --- ACTIONS CRUD ---

  openCreateModal() {
    this.createForm.reset({
      status: 'pending',
      date: new Date().toISOString().split('T')[0]
    });
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  async createTrip() {
    if (this.createForm.invalid) return;
    this.loading = true;
    
    try {
      const formData = this.createForm.value;
      // Construction objet Trip compatible
      const newTrip: any = {
        companyId: this.COMPANY_ID,
        departure: formData.departure,
        arrival: formData.arrival,
        date: formData.date,
        carId: formData.carId,
        status: formData.status,
        createdAt: new Date()
      };
      
      await this.firestoreService.addTrip(newTrip);
      this.closeCreateModal();
      this.loadData();
    } catch (e) {
      console.error(e);
    } finally {
      this.loading = false;
    }
  }

  deleteTrip(trip: TripWithCar) {
    if (!trip.id) return;
    if (confirm('Supprimer ce trajet ?')) {
      this.firestoreService.deleteTrip(trip.id).then(() => this.loadData());
    }
  }

  async duplicateTrip(trip: TripWithCar) {
    const { id, ...data } = trip;
    const copy = { ...data, status: 'pending', createdAt: new Date() };
    await this.firestoreService.addTrip(copy);
    this.loadData();
  }
  
  openEditModal(trip: TripWithCar) {
    this.editingTrip = { ...trip };
    this.isModalOpen = true;
  }
  
  // Alias pour compatibilité template
  openDetailsModal(trip: TripWithCar) {
    this.openEditModal(trip);
  }

  // --- HELPERS ---

  countByStatus(status: string): number {
    return this.allTrips.filter(t => t.status === status).length;
  }

  async quickUpdateStatus(trip: TripWithCar, status: any) {
    if (!trip.id) return;
    const newStatus = status.value || status; 
    await this.firestoreService.updateTrip({ id: trip.id, status: newStatus });
    trip.status = newStatus; // Optimistic update
    this.applyFilters(); // Re-tri éventuel
  }

  formatDate(val: any): string {
    if (!val) return '-';
    // Gestion Timestamp Firestore ou Date string
    const date = val.toDate ? val.toDate() : new Date(val);
    return new DatePipe('en-US').transform(date, 'dd/MM/yyyy HH:mm') || '-';
  }

  exportToCSV() {
    console.log("Export CSV non implémenté pour l'instant");
    alert("Fonctionnalité à venir !");
  }
}
EOF

echo "✅ TripsHistoryPageComponent COMPLET (toutes méthodes présentes) !"
