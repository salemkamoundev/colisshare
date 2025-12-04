export interface Car {
  id?: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  isOperational: boolean;
  assignedDriverId?: string;
  companyId: string;
  createdAt?: Date;
}
