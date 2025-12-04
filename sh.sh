#!/bin/bash

echo "🔍 DIAGNOSTIC: Page de saisie de trajet"
echo "======================================="
echo ""
echo "⚠️  PROBLÈME DÉTECTÉ :"
echo "   Tu es sur: http://localhost:4200/trajets/historique"
echo "   Tu dois aller sur: http://localhost:4200/trajets/saisie"
echo ""
echo "🔧 VÉRIFICATION du composant TripEntry"
echo ""

# Vérifier que le fichier existe
if [ ! -f "src/app/components/trip-entry/trip-entry.component.ts" ]; then
    echo "❌ Fichier trip-entry.component.ts introuvable !"
    echo ""
    echo "📝 Création du composant complet..."
    
    mkdir -p src/app/components/trip-entry
    
    cat > src/app/components/trip-entry/trip-entry.component.ts << 'EOF'
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormArray,
} from '@angular/forms';
import { Observable } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';
import { FirestoreService } from '../../services/firestore.service';
import { Car } from '../../interfaces/car.interface';
import { TripStep } from '../../interfaces/trip.interface';
import { CitySelectComponent } from '../city-select/city-select.component';

@Component({
  selector: 'app-trip-entry',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, CitySelectComponent],
  templateUrl: './trip-entry.component.html',
})
export class TripEntryComponent implements OnInit {
  private readonly COMPANY_ID = 'AbC1dE2fG3hI4jK5lM6n';
  private readonly DRIVER_ID = 'UIDCurrentDriver';

  tripForm!: FormGroup;
  availableCars$!: Observable<Car[]>;
  loading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private firestoreService: FirestoreService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('🚀 TripEntryComponent initialized');
    this.initForm();
    this.availableCars$ = this.firestoreService.getCars(this.COMPANY_ID);
  }

  initForm(): void {
    this.tripForm = this.fb.group({
      carId: ['', Validators.required],
      departureCity: ['', Validators.required],
      arrivalCity: ['', Validators.required],
      estimatedDepartureTime: ['', Validators.required],
      estimatedArrivalTime: ['', Validators.required],
      steps: this.fb.array([]),
    });
  }

  get steps(): FormArray {
    return this.tripForm.get('steps') as FormArray;
  }

  createStepGroup(step?: TripStep): FormGroup {
    return this.fb.group({
      city: [step?.city || '', Validators.required],
      estimatedTime: [step?.estimatedTime || '', Validators.required],
    });
  }

  addStep(): void {
    this.steps.push(this.createStepGroup());
  }

  removeStep(index: number): void {
    this.steps.removeAt(index);
  }

  cancelForm(): void {
    const hasData =
      this.tripForm.dirty ||
      this.tripForm.value.carId ||
      this.tripForm.value.departureCity;

    if (hasData) {
      if (
        confirm(
          '🚫 Voulez-vous vraiment annuler ? Les modifications seront perdues.'
        )
      ) {
        this.tripForm.reset();
        this.router.navigate(['/trajets/historique']);
      }
    } else {
      this.router.navigate(['/trajets/historique']);
    }
  }

  async onSubmit(): Promise<void> {
    console.log('📝 Formulaire soumis!');
    console.log('📋 Valeurs:', this.tripForm.value);
    console.log('✅ Valide?', this.tripForm.valid);

    // Réinitialiser les messages
    this.successMessage = '';
    this.errorMessage = '';

    if (this.tripForm.invalid) {
      this.errorMessage = '⚠️ Veuillez remplir tous les champs requis.';
      this.markFormGroupTouched(this.tripForm);
      alert(this.errorMessage);
      console.log('❌ Formulaire invalide');
      return;
    }

    this.loading = true;
    console.log('⏳ Enregistrement en cours...');

    const formValue = this.tripForm.value;
    const tripData = {
      carId: formValue.carId,
      companyId: this.COMPANY_ID,
      driverId: this.DRIVER_ID,
      departureCity: formValue.departureCity,
      arrivalCity: formValue.arrivalCity,
      estimatedDepartureTime: Timestamp.fromDate(
        new Date(formValue.estimatedDepartureTime)
      ),
      estimatedArrivalTime: Timestamp.fromDate(
        new Date(formValue.estimatedArrivalTime)
      ),
      status: 'pending' as const,
      steps: formValue.steps || [],
    };

    console.log('📦 Données à envoyer:', tripData);

    try {
      const tripId = await this.firestoreService.addTrip(tripData);
      
      this.successMessage = `✅ Trajet enregistré avec succès ! (ID: ${tripId})`;
      console.log('✅ Trajet créé avec ID:', tripId);

      alert(`✅ Trajet enregistré avec succès !\n\n📍 ${tripData.departureCity} → ${tripData.arrivalCity}\n🚗 Voiture: ${tripData.carId}\n📅 Départ: ${formValue.estimatedDepartureTime}`);

      this.tripForm.reset();

      setTimeout(() => {
        this.router.navigate(['/trajets/historique']);
      }, 2000);

    } catch (error: any) {
      console.error('❌ Erreur lors de l\'enregistrement:', error);
      this.errorMessage = `❌ Erreur: ${error.message || 'Impossible d\'enregistrer le trajet'}`;
      alert(this.errorMessage);
    } finally {
      this.loading = false;
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
EOF

    echo "✅ trip-entry.component.ts créé"
fi

echo ""
echo "=========================================="
echo "✅ SOLUTION COMPLÈTE"
echo "=========================================="
echo ""
echo "📍 ÉTAPES À SUIVRE :"
echo ""
echo "1️⃣  Ouvre ton navigateur"
echo "    URL: http://localhost:4200/trajets/saisie"
echo "    (PAS /trajets/historique !)"
echo ""
echo "2️⃣  Remplis le formulaire :"
echo "    - Sélectionne une voiture"
echo "    - Ville de départ"
echo "    - Ville d'arrivée"  
echo "    - Date/heure de départ"
echo "    - Date/heure d'arrivée"
echo ""
echo "3️⃣  Clique sur 'Enregistrer le Trajet'"
echo ""
echo "4️⃣  Vérifie dans la console (F12) :"
echo "    - 📝 Formulaire soumis!"
echo "    - ⏳ Enregistrement en cours..."
echo "    - ✅ Trajet créé avec ID: ..."
echo ""
echo "🔍 DEBUGGING :"
echo ""
echo "Si ça ne marche toujours pas, ouvre la console (F12) et cherche :"
echo "  ✅ '🚀 TripEntryComponent initialized' (au chargement)"
echo "  ✅ '📝 Formulaire soumis!' (après clic)"
echo "  ❌ Messages d'erreur en rouge"
echo ""
echo "📋 NAVIGATION :"
echo ""
echo "Depuis l'historique (/trajets/historique):"
echo "  → Clique sur le bouton vert '➕ Nouveau Trajet'"
echo "  → Ça t'amènera sur /trajets/saisie"
echo ""
echo "🚀 Si le problème persiste, envoie-moi :"
echo "  1. La console complète (F12) après avoir cliqué"
echo "  2. Confirme que tu es bien sur /trajets/saisie"
echo ""

exit 0
