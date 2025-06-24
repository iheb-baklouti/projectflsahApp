export type InterventionStatus = 
  | 'NEW'
  | 'ACCEPTED'
  | 'EN_ROUTE'
  | 'ON_SITE'
  | 'DONE'
  | 'JE_DOIS_REPASSER'
  | 'ANNULÉE';

export interface Material {
  id: string;
  name: string;
  price: number;
  quantity: number;
}
export type InterventionsListResponse = {
  success: boolean;
  data: Intervention[];
  message?: string;
};
export interface Photo {
  id: string;
  uri: string;
  timestamp: string;
  type: 'before' | 'after' | 'material' | 'other';
}

export interface Intervention {
  id: string;
  clientName: string;
  clientPhone: string;
  address: string;
  shortAddress?: string; // Adresse courte pour l'affichage dans le popup
  coordinates: {
    latitude: number;
    longitude: number;
  };
  serviceType: string;
  description: string;
  status: InterventionStatus;
  isUrgent: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
  createdAt: string;
  updatedAt: string;
  acceptedAt?: string;
  completedAt?: string;
  technicianId?: string;
  materials?: Material[];
  photos?: Photo[];
  notes?: string;
  totalAmount?: number;
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED';
  paymentLink?: string;
}

export interface InterventionsState {
  interventions: Intervention[];
  scheduledInterventions: Intervention[];
  completedInterventions: Intervention[];
  isLoading: boolean;
  error: string | null;
}