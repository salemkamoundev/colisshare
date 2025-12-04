import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import * as L from 'leaflet';
import { latLng, tileLayer, Map, Polyline, Layer } from 'leaflet';

// Interface pour les points de données de trajectoire
export interface GeoPoint {
  lat: number;
  lng: number;
  timestamp: number; // UNIX timestamp
}

@Component({
  selector: 'app-trip-map',
  standalone: true,
  imports: [CommonModule, LeafletModule],
  templateUrl: './trip-map.component.html',
  styleUrls: []
})
export class TripMapComponent implements OnChanges {
  // Entrée des coordonnées du trajet depuis le composant parent
  @Input() coordinates: GeoPoint[] = [];

  // Options Leaflet
  options = {
    layers: [
      // Couche de tuiles OpenStreetMap
      tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { 
        maxZoom: 18, 
        attribution: 'OpenStreetMap' 
      })
    ],
    zoom: 13,
    // Coordonnées initiales (Paris comme centre par défaut)
    center: latLng(48.8566, 2.3522)
  };

  layers: Layer[] = [];
  map!: Map;

  // Lorsque la carte est initialisée
  onMapReady(map: Map) {
    this.map = map;
    this.drawPath();
  }

  // Appelé lorsque l'Input 'coordinates' change
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['coordinates'] && this.map) {
      this.drawPath();
    }
  }

  private drawPath(): void {
    if (!this.coordinates || this.coordinates.length === 0) {
      this.layers = [];
      return;
    }

    // 1. Convertir les GeoPoints en objets LatLng pour Leaflet
    const latLngs = this.coordinates
      .map(p => L.latLng(p.lat, p.lng));

    // 2. Créer la polyline (le tracé)
    const polyline = new Polyline(latLngs as any, { 
      color: '#007bff', // Couleur du tracé (bleu Bootstrap)
      weight: 5,
      opacity: 0.7 
    });

    // 3. Marqueur de départ
    const startMarker = L.marker(latLngs[0], {
      icon: L.icon({
        iconUrl: 'assets/marker-icon-start.png', // Chemin à ajuster
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      })
    }).bindPopup('Départ du trajet');

    // 4. Marqueur d'arrivée
    const endMarker = L.marker(latLngs[latLngs.length - 1], {
      icon: L.icon({
        iconUrl: 'assets/marker-icon-end.png', // Chemin à ajuster
        iconSize: [25, 41],
        iconAnchor: [12, 41]
      })
    }).bindPopup('Arrivée du trajet');


    // Mettre à jour les calques de la carte
    this.layers = [polyline, startMarker, endMarker];

    // Ajuster le centre de la carte pour afficher l'ensemble du tracé
    this.map.fitBounds(polyline.getBounds());
  }
}
