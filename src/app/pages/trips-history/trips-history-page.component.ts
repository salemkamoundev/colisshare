import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { FirestoreService, Trip } from '../../services/firestore.service';
import { Car } from '../../interfaces/car.interface';
import { Observable, combineLatest, of } from 'rxjs';
import { map, catchError, startWith, shareReplay } from 'rxjs/operators';
import { Timestamp } from '@angular/fire/firestore';

// Correction de l'interface pour inclure 'destinations'
interface TripWithCar extends Trip {
  car?: Car;
  displayDeparture: string;
  displayArrival: string;
  destinations?: string[]; // Ajout explicite pour TypeScript
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

  // Observables
  trips$!: Observable<TripWithCar[]>;
  availableCars$!: Observable<Car[]>; // Correction: Variable rétablie pour le template
  
  // Données locales
  allTrips: TripWithCar[] = [];
  filteredTrips: TripWithCar[] = [];
  
  // Filtres & Tri
  searchText = ''; 
  filterStatus = 'all';
  sortField = 'estimatedDepartureTime';
  sortDirection: 'asc' | 'desc' = 'desc';
  
  // Sélection multiple
  selectedTrips = new Set<string>();
  selectAll = false;

  // UI State
  loading = false;
  showCreateModal = false;
  createForm: FormGroup;
  
  // Edition
  editingTrip: TripWithCar | null = null;
  isModalOpen = false;
  
  COMPANY_ID = '';

  statusLabels: any = {
    pending: 'En attente',
    in_progress: 'En cours',
    completed: 'Terminé',
    cancelled: 'Annulé'
  };

  statusColors: any = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  constructor() {
    this.createForm = this.fb.group({
      carId: ['', Validators.required],
      departureCity: ['', Validators.required],
      arrivalCity: ['', Validators.required],
      estimatedDepartureTime: ['', Validators.required],
      estimatedArrivalTime: ['', Validators.required],
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
    
    // 1. Initialiser availableCars$ pour le formulaire modal ET pour la combinaison
    this.availableCars$ = this.firestoreService.getCars(this.COMPANY_ID).pipe(
      startWith([]),
      shareReplay(1), // Optimisation: évite de recharger pour chaque souscription
      catchError(err => {
        console.error("Erreur chargement voitures", err);
        return of([] as Car[]);
      })
    );

    // 2. Récupérer les trajets
    const rawTrips$ = this.firestoreService.getTrips(this.COMPANY_ID).pipe(
      startWith([]),
      catchError(err => {
        console.error("Erreur chargement trajets", err);
        return of([] as Trip[]);
      })
    );

    // 3. Combiner les deux pour l'affichage du tableau
    combineLatest([rawTrips$, this.availableCars$]).pipe(
      map(([trips, cars]) => {
        return trips.map(trip => {
          // Associer la voiture
          const car = cars.find(c => c.id === trip.carId);
          
          // Normaliser les données
          const displayDeparture = trip.departureCity || trip.departure || 'N/A';
          const displayArrival = trip.arrivalCity || trip.arrival || 'N/A';
          // Sécuriser destinations si undefined dans la DB
          const destinations = trip.destinations || (trip.arrivalCity ? [trip.arrivalCity] : []);

          return { 
            ...trip, 
            car,
            displayDeparture,
            displayArrival,
            destinations
          } as TripWithCar;
        });
      })
    ).subscribe({
      next: (combinedTrips) => {
        this.allTrips = combinedTrips;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error("Erreur loadData:", err);
        this.loading = false;
      }
    });
  }

  // --- FILTRES & TRI ---

  onSearchChange() { this.applyFilters(); }
  onFilterStatusChange() { this.applyFilters(); }
  
  clearFilters() {
    this.searchText = '';
    this.filterStatus = 'all';
    this.applyFilters();
  }

  applyFilters() {
    let res = [...this.allTrips];

    // Filtre Texte
    if (this.searchText) {
      const term = this.searchText.toLowerCase();
      res = res.filter(t => 
        (t.displayDeparture || '').toLowerCase().includes(term) ||
        (t.displayArrival || '').toLowerCase().includes(term) ||
        (t.car?.brand || '').toLowerCase().includes(term) ||
        (t.car?.licensePlate || '').toLowerCase().includes(term)
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
      
      // Gestion Timestamp Firestore
      if (this.sortField === 'estimatedDepartureTime' || this.sortField === 'estimatedArrivalTime') {
         valA = valA?.toMillis ? valA.toMillis() : new Date(valA || 0).getTime();
         valB = valB?.toMillis ? valB.toMillis() : new Date(valB || 0).getTime();
      }

      // Fallback sur les chaînes affichées si tri par ville
      if (this.sortField === 'departureCity') {
        valA = a.displayDeparture;
        valB = b.displayDeparture;
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
      this.filteredTrips.forEach(t => { if (t.id) this.selectedTrips.add(t.id); });
    }
  }

  toggleSelect(id: string) {
    if (this.selectedTrips.has(id)) this.selectedTrips.delete(id);
    else this.selectedTrips.add(id);
    this.selectAll = this.filteredTrips.length > 0 && this.selectedTrips.size === this.filteredTrips.length;
  }

  async deleteSelected() {
    if (!confirm(`Supprimer ${this.selectedTrips.size} trajets ?`)) return;
    const promises = Array.from(this.selectedTrips).map(id => this.firestoreService.deleteTrip(id));
    await Promise.all(promises);
    this.selectedTrips.clear();
    this.selectAll = false;
  }

  // --- ACTIONS CRUD ---

  openCreateModal() {
    this.createForm.reset({ status: 'pending', carId: '' });
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
  }

  async createTrip() {
    if (this.createForm.invalid) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }
    this.loading = true;
    try {
      const formData = this.createForm.value;
      const newTrip: any = {
        companyId: this.COMPANY_ID,
        driverId: this.COMPANY_ID,
        carId: formData.carId,
        departureCity: formData.departureCity,
        arrivalCity: formData.arrivalCity,
        destinations: [formData.arrivalCity],
        steps: [],
        estimatedDepartureTime: Timestamp.fromDate(new Date(formData.estimatedDepartureTime)),
        estimatedArrivalTime: Timestamp.fromDate(new Date(formData.estimatedArrivalTime)),
        status: formData.status || 'pending',
        createdAt: Timestamp.now()
      };

      await this.firestoreService.addTrip(newTrip);
      this.closeCreateModal();
      alert('✅ Trajet ajouté !');
    } catch (e: any) {
      console.error(e);
      alert('Erreur: ' + e.message);
    } finally {
      this.loading = false;
    }
  }

  deleteTrip(trip: TripWithCar) {
    if (!trip.id) return;
    if (confirm('Supprimer ce trajet ?')) {
      this.firestoreService.deleteTrip(trip.id);
    }
  }

  async duplicateTrip(trip: TripWithCar) {
    const { id, car, displayDeparture, displayArrival, ...data } = trip; 
    const copy = { 
      ...data, 
      status: 'pending', 
      createdAt: Timestamp.now()
    };
    await this.firestoreService.addTrip(copy);
    alert('Trajet dupliqué !');
  }
  
  openEditModal(trip: TripWithCar) {
    alert("Utilisez la page 'Nouveau Trajet' pour créer des itinéraires complexes.");
  }
  
  openDetailsModal(trip: TripWithCar) {
    console.log(trip);
  }

  // --- HELPERS ---

  countByStatus(status: string): number {
    return this.allTrips.filter(t => t.status === status).length;
  }

  async quickUpdateStatus(trip: TripWithCar, status: any) {
    if (!trip.id) return;
    const newStatus = status.value || status;
    await this.firestoreService.updateTrip({ id: trip.id, status: newStatus });
  }

  formatDate(val: any): string {
    if (!val) return '-';
    try {
      const date = val.toDate ? val.toDate() : new Date(val);
      return new DatePipe('en-US').transform(date, 'dd/MM/yyyy HH:mm') || '-';
    } catch(e) { return '-'; }
  }

  exportToCSV() {
    alert("Bientôt disponible");
  }
}
