import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { FirestoreService, Trip } from '../../services/firestore.service';
import { Car } from '../../interfaces/car.interface';
import { Observable, combineLatest, of } from 'rxjs';
import { map, catchError, startWith, shareReplay } from 'rxjs/operators';
import { Timestamp } from '@angular/fire/firestore';

interface TripWithCar extends Trip {
  car?: Car;
  displayDeparture: string;
  displayArrival: string;
  destinations?: string[];
}

@Component({
  selector: 'app-trips-history-page',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule], 
  providers: [DatePipe], // On le met ici pour l'injecter proprement
  templateUrl: './trips-history-page.component.html'
})
export class TripsHistoryPageComponent implements OnInit {
  private auth = inject(AuthService);
  private firestoreService = inject(FirestoreService);
  private fb = inject(FormBuilder);
  private datePipe = inject(DatePipe);

  // Observables
  trips$!: Observable<TripWithCar[]>;
  availableCars$!: Observable<Car[]>;
  
  // Données locales
  allTrips: TripWithCar[] = [];
  filteredTrips: TripWithCar[] = [];
  
  // Filtres
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
  showEditModal = false;
  
  createForm: FormGroup;
  editForm: FormGroup;
  
  editingTrip: TripWithCar | null = null;
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
    // Formulaire Création
    this.createForm = this.fb.group({
      carId: ['', Validators.required],
      departureCity: ['', Validators.required],
      arrivalCity: ['', Validators.required],
      estimatedDepartureTime: ['', Validators.required],
      estimatedArrivalTime: ['', Validators.required],
      status: ['pending']
    });

    // Formulaire Édition
    this.editForm = this.fb.group({
      id: [''],
      carId: ['', Validators.required],
      departureCity: ['', Validators.required],
      arrivalCity: ['', Validators.required],
      estimatedDepartureTime: ['', Validators.required],
      estimatedArrivalTime: ['', Validators.required],
      status: ['', Validators.required]
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
    
    this.availableCars$ = this.firestoreService.getCars(this.COMPANY_ID).pipe(
      startWith([]),
      shareReplay(1),
      catchError(err => of([] as Car[]))
    );

    const rawTrips$ = this.firestoreService.getTrips(this.COMPANY_ID).pipe(
      startWith([]),
      catchError(err => of([] as Trip[]))
    );

    combineLatest([rawTrips$, this.availableCars$]).pipe(
      map(([trips, cars]) => {
        return trips.map(trip => {
          const car = cars.find(c => c.id === trip.carId);
          const displayDeparture = trip.departureCity || trip.departure || 'N/A';
          const displayArrival = trip.arrivalCity || trip.arrival || 'N/A';
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
      error: (err) => this.loading = false
    });
  }

  // --- ACTIONS MODALES ---

  openCreateModal() {
    this.createForm.reset({ status: 'pending', carId: '' });
    this.showCreateModal = true;
  }

  closeCreateModal() { this.showCreateModal = false; }

  openEditModal(trip: TripWithCar) {
    this.editingTrip = trip;
    const dep = this.toDateTimeLocal(trip.estimatedDepartureTime);
    const arr = this.toDateTimeLocal(trip.estimatedArrivalTime);

    this.editForm.patchValue({
      id: trip.id,
      carId: trip.carId,
      departureCity: trip.displayDeparture,
      arrivalCity: trip.displayArrival,
      estimatedDepartureTime: dep,
      estimatedArrivalTime: arr,
      status: trip.status
    });
    
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingTrip = null;
  }

  async updateTrip() {
    if (this.editForm.invalid) return;
    this.loading = true;
    try {
      const val = this.editForm.value;
      const updatedData: any = {
        id: val.id,
        carId: val.carId,
        departureCity: val.departureCity,
        arrivalCity: val.arrivalCity,
        departure: val.departureCity, // Legacy
        arrival: val.arrivalCity,     // Legacy
        status: val.status,
        estimatedDepartureTime: Timestamp.fromDate(new Date(val.estimatedDepartureTime)),
        estimatedArrivalTime: Timestamp.fromDate(new Date(val.estimatedArrivalTime)),
        updatedAt: Timestamp.now()
      };

      await this.firestoreService.updateTrip(updatedData);
      this.closeEditModal();
      alert('✅ Trajet modifié avec succès !');
    } catch (e: any) {
      alert('Erreur: ' + e.message);
    } finally {
      this.loading = false;
    }
  }

  private toDateTimeLocal(val: any): string {
    if (!val) return '';
    try {
      const date = val.toDate ? val.toDate() : new Date(val);
      const pad = (n: number) => n < 10 ? '0' + n : n;
      return date.getFullYear() + '-' +
        pad(date.getMonth() + 1) + '-' +
        pad(date.getDate()) + 'T' +
        pad(date.getHours()) + ':' +
        pad(date.getMinutes());
    } catch(e) { return ''; }
  }

  // --- ACTIONS CRUD BASIQUES ---
  
  async createTrip() {
    if (this.createForm.invalid) { alert("Champs manquants"); return; }
    this.loading = true;
    try {
      const formData = this.createForm.value;
      const newTrip: any = {
        companyId: this.COMPANY_ID,
        carId: formData.carId,
        departureCity: formData.departureCity,
        arrivalCity: formData.arrivalCity,
        departure: formData.departureCity,
        arrival: formData.arrivalCity,
        estimatedDepartureTime: Timestamp.fromDate(new Date(formData.estimatedDepartureTime)),
        estimatedArrivalTime: Timestamp.fromDate(new Date(formData.estimatedArrivalTime)),
        status: formData.status || 'pending',
        createdAt: Timestamp.now()
      };
      await this.firestoreService.addTrip(newTrip);
      this.closeCreateModal();
      alert('✅ Trajet ajouté !');
    } catch (e: any) { alert('Erreur: ' + e.message); } finally { this.loading = false; }
  }

  deleteTrip(trip: TripWithCar) {
    if (!trip.id) return;
    if (confirm('Supprimer ce trajet ?')) this.firestoreService.deleteTrip(trip.id);
  }

  async duplicateTrip(trip: TripWithCar) {
    const { id, car, displayDeparture, displayArrival, ...data } = trip; 
    const copy = { ...data, status: 'pending', createdAt: Timestamp.now() };
    await this.firestoreService.addTrip(copy);
    alert('Trajet dupliqué !');
  }

  openDetailsModal(trip: TripWithCar) { console.log(trip); }

  // --- FILTRES & TRI ---
  
  applyFilters() {
    let res = [...this.allTrips];
    if (this.searchText) {
      const term = this.searchText.toLowerCase();
      res = res.filter(t => t.displayDeparture.toLowerCase().includes(term) || t.displayArrival.toLowerCase().includes(term));
    }
    if (this.filterStatus !== 'all') res = res.filter(t => t.status === this.filterStatus);
    
    res.sort((a: any, b: any) => {
      let valA = a[this.sortField];
      let valB = b[this.sortField];
      if (this.sortField.includes('Time')) {
         valA = valA?.toMillis ? valA.toMillis() : new Date(valA || 0).getTime();
         valB = valB?.toMillis ? valB.toMillis() : new Date(valB || 0).getTime();
      }
      if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    this.filteredTrips = res;
  }

  onSearchChange() { this.applyFilters(); }
  onFilterStatusChange() { this.applyFilters(); }
  clearFilters() { this.searchText = ''; this.filterStatus = 'all'; this.applyFilters(); }
  onSortChange(field: string) {
    this.sortField = field;
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.applyFilters();
  }

  // --- SELECTION MULTIPLE ---

  toggleSelectAll() {
    this.selectAll = !this.selectAll;
    this.selectedTrips.clear();
    if (this.selectAll) this.filteredTrips.forEach(t => { if (t.id) this.selectedTrips.add(t.id); });
  }

  toggleSelect(id: string) {
    if (this.selectedTrips.has(id)) this.selectedTrips.delete(id);
    else this.selectedTrips.add(id);
    this.selectAll = this.filteredTrips.length > 0 && this.selectedTrips.size === this.filteredTrips.length;
  }

  async deleteSelected() {
    if (!confirm(`Supprimer ${this.selectedTrips.size} trajets ?`)) return;
    await Promise.all(Array.from(this.selectedTrips).map(id => this.firestoreService.deleteTrip(id)));
    this.selectedTrips.clear(); 
    this.selectAll = false;
  }

  // --- MÉTHODES MANQUANTES AJOUTÉES ---

  countByStatus(status: string): number {
    return this.allTrips.filter(t => t.status === status).length;
  }

  async quickUpdateStatus(trip: TripWithCar, status: any) {
    if (!trip.id) return;
    const newVal = status.value || status;
    await this.firestoreService.updateTrip({ id: trip.id, status: newVal });
  }

  formatDate(val: any): string {
    if (!val) return '-';
    try { 
      const date = val.toDate ? val.toDate() : new Date(val);
      // Utilisation du DatePipe injecté
      return this.datePipe.transform(date, 'dd/MM/yyyy HH:mm') || '-'; 
    } catch(e) { return '-'; }
  }

  exportToCSV() {
    alert("Export CSV bientôt disponible !");
  }
}
