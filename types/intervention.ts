export type InterventionStatus = 
  | 'NEW'
  | 'ACCEPTED'
  | 'ASSIGNED'
  | 'EN_ROUTE'
  | 'ON_SITE'
  | 'DONE'
  | 'COMPLETED'
  | 'CANCELLED';

export interface Material {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Photo {
  id: string;
  uri: string;
  timestamp: string;
  type: 'before' | 'after' | 'material' | 'other';
}

export interface Invoice {
  id: string;
  intervention_id: string;
  number: string;
  amount_ht: number;
  vat_rate: number;
  amount_ttc: number;
  commission_amount?: number;
  commission_paid?: boolean;
  status: 'pending' | 'paid' | 'late' | 'cancelled';
  issue_date: string;
  due_date: string;
  payment_date?: string;
  url?: string;
  description: string[];
  payment_terms: string;
  intervention?: {
    id: string;
    number: string;
    client: {
      id: string;
      name: string;
      company_name?: string;
    };
    technician: {
      id: string;
      name: string;
    };
  };
}

// ✅ Interface mise à jour selon la nouvelle structure API
export interface Intervention {
  id: string;
  number: string; // "INT-2025-0006"
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  clientId: string;
  address: string;
  shortAddress?: string;
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
  technicianName?: string;
  specialtyId: string;
  specialtyLabel: string; // "Électricité"
  specialtyValue: string; // "electricity"
  addressId: string;
  addressDetails: {
    housenumber?: string;
    street?: string;
    city: string;
    postcode: string;
    citycode: string;
    context?: string;
    country?: string;
    state?: string;
    type?: string;
    label: string; // "123 Rue Sully 69006 Lyon"
    name?: string; // "123 Rue Sully"
    additional_info?: string;
  };
  cancellationReason?: string;
  materials?: Material[];
  photos?: Photo[];
  notes?: string;
  totalAmount?: number;
  paymentStatus?: 'PENDING' | 'PAID' | 'FAILED';
  paymentLink?: string;
  invoice?: Invoice;
}

export interface InterventionsState {
  interventions: Intervention[];
  scheduledInterventions: Intervention[];
  completedInterventions: Intervention[];
  isLoading: boolean;
  error: string | null;
}

export interface InvoiceFormData {
  amount_ht: string;
  vat_rate: string;
  description: string[];
  payment_terms: string;
}