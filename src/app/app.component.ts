import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, HeaderComponent],
  template: `
    <!-- Le Header gère sa propre visibilité (il se cache si user$ est null) -->
    <app-header></app-header>
    
    <!-- Le contenu des pages s'affiche ici -->
    <router-outlet></router-outlet>
  `
})
export class AppComponent {}
