export interface Car {
  id?: string;
  ownerId: string;
  brand: string; // On utilise 'brand' officiellement
  make?: string; // Alias pour compatibilité
  model: string;
  licensePlate: string;
  capacity: number;
  status: 'available' | 'maintenance' | 'busy';
  active?: boolean; // Pour l'affichage UI
}
