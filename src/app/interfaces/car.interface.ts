export interface Car {
  id?: string;
  companyId?: string; // Rendu optionnel car souvent ajouté par le backend ou contexte
  make: string;
  model: string;
  year: number;
  licensePlate: string;
  
  // ✅ Nouveaux champs requis par le template
  capacity: number;
  active: boolean;
}
