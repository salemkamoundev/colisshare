import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface HomeSlide {
  title: string;
  subtitle: string;
  description: string;
  tag: string;
}

@Component({
  standalone: true,
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  imports: [CommonModule, RouterLink, RouterLinkActive],
})
export class HomePageComponent {
  slides: HomeSlide[] = [
    {
      title: 'Bienvenue sur Transport Collab',
      subtitle: 'Optimisez vos trajets, partagez vos capacités.',
      description:
        'Cette application vous aide à gérer vos véhicules, planifier vos trajets et collaborer avec d\'autres transporteurs pour rentabiliser chaque kilomètre.',
      tag: 'Présentation',
    },
    {
      title: 'Gestion des voitures',
      subtitle: 'Centralisez votre flotte.',
      description:
        'Ajoutez, modifiez et désactivez vos véhicules. Visualisez rapidement leur capacité et leur disponibilité pour les prochains trajets.',
      tag: 'Flotte',
    },
    {
      title: 'Saisie & Historique des trajets',
      subtitle: 'Suivez vos opérations.',
      description:
        'Déclarez facilement un nouveau trajet et gardez un historique clair des trajets passés, en cours ou planifiés.',
      tag: 'Trajets',
    },
    {
      title: 'Demandes de collaboration',
      subtitle: 'Partagez vos capacités avec d\'autres.',
      description:
        'Recevez et gérez les demandes de collab sur vos trajets : acceptez, refusez et négociez pour optimiser vos tournées.',
      tag: 'Collaboration',
    },
    {
      title: 'Chat temps réel',
      subtitle: 'Communiquez sans friction.',
      description:
        'Discutez avec vos partenaires directement depuis l\'application pour régler les détails d\'un trajet ou d\'un colis en quelques messages.',
      tag: 'Communication',
    },
  ];

  activeIndex = 0;

  nextSlide(): void {
    this.activeIndex = (this.activeIndex + 1) % this.slides.length;
  }

  prevSlide(): void {
    this.activeIndex =
      (this.activeIndex - 1 + this.slides.length) % this.slides.length;
  }

  goToSlide(index: number): void {
    this.activeIndex = index;
  }
}
