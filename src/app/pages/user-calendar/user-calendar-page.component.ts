import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

import { FirestoreService, Trip } from '../../services/firestore.service';
import { CollaborationService } from '../../services/collaboration.service';
import { AuthService } from '../../services/auth.service';
import { HeaderComponent } from '../../components/header/header.component';
import { PackageDetails } from '../../interfaces/collaboration-request.interface';

@Component({
  selector: 'app-user-calendar-page',
  standalone: true,
  imports: [CommonModule, FullCalendarModule, FormsModule, HeaderComponent, RouterModule],
  templateUrl: './user-calendar-page.component.html'
})
export class UserCalendarPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private firestoreService = inject(FirestoreService);
  private collabService = inject(CollaborationService);
  private auth = inject(AuthService);

  targetUserId = '';
  currentUser: any = null;
  trips: Trip[] = [];

  calendarOptions: CalendarOptions = {
    initialView: 'dayGridMonth',
    plugins: [dayGridPlugin, interactionPlugin],
    events: [],
    dateClick: (arg) => this.handleDateClick(arg),
    eventClick: (arg) => this.handleEventClick(arg),
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: 'dayGridMonth'
    }
  };

  showModal = false;
  selectedDate = '';
  selectedTripId: string | null = null;
  
  packageForm: PackageDetails = {
    description: '',
    clientName: '',
    clientAddress: ''
  };

  ngOnInit() {
    this.auth.user$.subscribe(u => this.currentUser = u);
    
    this.targetUserId = this.route.snapshot.paramMap.get('uid') || '';
    if (this.targetUserId) {
      this.loadTargetTrips();
    }
  }

  loadTargetTrips() {
    this.firestoreService.getTrips(this.targetUserId).subscribe(trips => {
      this.trips = trips;
      // Syntaxe corrigée pour le mapping
      this.calendarOptions.events = trips.map(t => {
        return {
          title: `${t.departureCity} -> ${t.arrivalCity}`,
          start: this.parseDate(t.estimatedDepartureTime),
          color: '#2563eb',
          extendedProps: { tripId: t.id }
        };
      });
    });
  }

  handleDateClick(arg: any) {
    this.selectedDate = arg.dateStr;
    this.selectedTripId = null;
    this.openModal();
  }

  handleEventClick(arg: any) {
    this.selectedDate = arg.event.startStr;
    this.selectedTripId = arg.event.extendedProps.tripId;
    this.openModal();
  }

  openModal() {
    this.packageForm = { description: '', clientName: '', clientAddress: '', date: this.selectedDate };
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  async sendRequest() {
    if (!this.currentUser) {
      alert("Connectez-vous d'abord");
      return;
    }
    try {
      if (this.selectedTripId) {
        this.packageForm.description = `[Sur Trajet Spécifique] ${this.packageForm.description}`;
      }
      await this.collabService.sendRequest(
        this.currentUser.uid,
        this.targetUserId,
        this.packageForm
      );
      alert('✅ Demande envoyée au chauffeur !');
      this.closeModal();
    } catch (e: any) {
      alert('Erreur : ' + e.message);
    }
  }

  private parseDate(val: any): string {
    if (!val) return '';
    try {
      const d = val.toDate ? val.toDate() : new Date(val);
      return d.toISOString().split('T')[0];
    } catch { return ''; }
  }
}
