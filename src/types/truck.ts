export type TruckStatus = 'unsold' | 'pending' | 'closed' | 'archived';

export interface Truck {
  id: string;
  make: string;
  model: string;
  year: number;
  seller: string;
  status: TruckStatus;
  price: number;
  mileage: number;
  vin: string;
  location: string;
  dateAdded: string;
  lastUpdated: string;
}

export interface DashboardMetrics {
  unsold: number;
  pending: number;
  closed: number;
  totalRevenue: number;
}
