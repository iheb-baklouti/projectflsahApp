import { Platform } from 'react-native';

// Configuration de l'API
const API_CONFIG = {
  baseUrl: process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:8000' || 'https://api.flash-app.com',
  timeout: 10000,
};

// Types pour l'API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface TechnicianRegistrationData {
  name: string;
  email: string;
  password: string;
  phone: string;
  sectors: string[];
  zones: string[];
  address: string;
  zone_manager_email?: string;
  license_number?: string;
  insurance_number?: string;
  insurance_expiry?: string;
}

export interface TechnicianUpdateData {
  phone?: string;
  skills?: string[];
  zones?: string[];
  status?: string;
  address_id?: number;
  zone_manager_email?: string;
  license_number?: string;
  insurance_number?: string;
  insurance_expiry?: string;
}

export interface TechnicianRegistrationResponse {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
  };
  status: string;
  is_approved: boolean;
  license_number?: string;
  insurance_number?: string;
  insurance_expiry?: string;
  zones: Array<{ id: number; name: string }>;
  sectors: Array<{ id: number; name: string }>;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    phone?: string;
    role: string;
    is_approved?: boolean;
  };
}

export interface UserProfile {
  id: number;
  name: string;
  email: string;
  phone: string;
  role: string;
  technician?: {
    id: number;
    status: string;
    is_approved: boolean;
    license_number?: string;
    insurance_number?: string;
    insurance_expiry?: string;
    zones: Array<{ id: number; name: string }>;
    sectors: Array<{ id: number; name: string }>;
  };
}

export interface InterventionData {
  id: number;
  number: string;
  type: string;
  description: string;
  status: string;
  urgent: boolean;
  scheduled_at?: string;
  client: {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
  };
  technician?: {
    id: number;
    name: string;
    email: string;
    phone: string;
  } | null;
  address: {
    id: number;
    street: string;
    city: string;
    postcode: string;
  };
  completion_notes?: string;
  duration_minutes?: number;
  parts_used?: Array<{ name: string; quantity: number }>;
  signature_url?: string;
  cancellation_reason?: string;
  cancellation_notes?: string;
  cancelled_at?: string;
  completed_at?: string;
}

export interface InterventionsListResponse {
  message: string;
  data: InterventionData[];
  meta: {
    current_page: number;
    total: number;
    per_page: number;
  };
}

// Classe pour gérer les erreurs API
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public errors?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Fonction utilitaire pour faire des requêtes HTTP avec token Bearer
async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  token?: string
): Promise<ApiResponse<T>> {
  const url = `http://127.0.0.1:8000/${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': '',
  };

  // Ajouter le token Bearer si fourni
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  // Timeout pour les requêtes
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);

  try {
    const response = await fetch(url, {
      ...config,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json();

    if (!response.ok) {
      throw new ApiError(
        data.message || 'Une erreur est survenue',
        response.status,
        data.errors
      );
    }

    return {
      success: true,
      data: data.data || data,
      message: data.message,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error instanceof ApiError) {
      throw error;
    }

    // Erreur de réseau ou timeout
    throw new ApiError(
      'Erreur de connexion. Vérifiez votre connexion internet.',
      0
    );
  }
}

// Service API principal
export class ApiService {
  // ==================== AUTHENTIFICATION ====================
  
  static async login(data: LoginData): Promise<ApiResponse<LoginResponse>> {
    return makeRequest<LoginResponse>('api/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async logout(token: string): Promise<ApiResponse> {
    return makeRequest('api/logout', {
      method: 'POST',
    }, token);
  }

  static async getCurrentUser(token: string): Promise<ApiResponse<UserProfile>> {
    return makeRequest<UserProfile>('api/me', {
      method: 'GET',
    }, token);
  }

  // ==================== TECHNICIENS ====================
  
  static async registerTechnician(
    data: TechnicianRegistrationData
  ): Promise<ApiResponse<TechnicianRegistrationResponse>> {
    return makeRequest<TechnicianRegistrationResponse>('api/technicians/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  static async updateTechnician(
    token: string,
    technicianId: string,
    data: TechnicianUpdateData
  ): Promise<ApiResponse<TechnicianRegistrationResponse>> {
    return makeRequest<TechnicianRegistrationResponse>(`api/technicians/${technicianId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token);
  }

  // ==================== INTERVENTIONS ====================
  
  static async getInterventions(
    token: string,
    params?: {
      page?: number;
      per_page?: number;
      status?: string;
      date_from?: string;
      date_to?: string;
    }
  ): Promise<ApiResponse<InterventionsListResponse>> {
    const queryParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }

    const endpoint = `api/interventions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    
    return makeRequest<InterventionsListResponse>(endpoint, {
      method: 'GET',
    }, token);
  }

  static async getInterventionById(
    token: string,
    interventionId: string
  ): Promise<ApiResponse<{ message: string; data: InterventionData }>> {
    return makeRequest<{ message: string; data: InterventionData }>(`api/interventions/${interventionId}`, {
      method: 'GET',
    }, token);
  }

  static async updateIntervention(
    token: string,
    interventionId: string,
    data: {
      type?: string;
      description?: string;
      urgent?: boolean;
      scheduled_at?: string;
      status?: string;
    }
  ): Promise<ApiResponse<{ message: string; data: InterventionData }>> {
    return makeRequest<{ message: string; data: InterventionData }>(`api/interventions/${interventionId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, token);
  }

  static async acceptIntervention(
    token: string,
    interventionId: string
  ): Promise<ApiResponse<{ message: string; data: InterventionData }>> {
    // Accepter une intervention en changeant son statut
    return this.updateIntervention(token, interventionId, { status: 'ASSIGNED' });
  }

  static async cancelIntervention(
    token: string,
    interventionId: string,
    data: {
      reason: string;
      notes?: string;
    }
  ): Promise<ApiResponse<{ message: string; data: InterventionData }>> {
    return makeRequest<{ message: string; data: InterventionData }>(`api/interventions/${interventionId}/cancel`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  }

  static async completeIntervention(
    token: string,
    interventionId: string,
    data: {
      completion_notes: string;
      duration_minutes: number;
      parts_used?: string[];
      signature_data?: string;
    }
  ): Promise<ApiResponse<{ message: string; data: InterventionData }>> {
    return makeRequest<{ message: string; data: InterventionData }>(`api/interventions/${interventionId}/complete`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  }

  // ==================== UTILITAIRES ====================
  
  // Vérification de code (pour l'inscription)
  static async verifyCode(
    email: string,
    code: string
  ): Promise<ApiResponse> {
    return makeRequest('api/auth/verify-code', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  }

  // Récupération des zones disponibles
  static async getZones(token?: string): Promise<ApiResponse<Array<{ id: number; name: string }>>> {
    return makeRequest('api/zones', {
      method: 'GET',
    }, token);
  }

  // Récupération des secteurs/compétences disponibles
  static async getSectors(token?: string): Promise<ApiResponse<Array<{ id: number; name: string }>>> {
    return makeRequest('api/sectors', {
      method: 'GET',
    }, token);
  }

  // Mot de passe oublié
  static async forgotPassword(email: string): Promise<ApiResponse> {
    return makeRequest('api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  static async resetPassword(
    token: string,
    password: string,
    confirmPassword: string
  ): Promise<ApiResponse> {
    return makeRequest('api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        token,
        password,
        password_confirmation: confirmPassword,
      }),
    });
  }

  // Notifications
  static async registerPushToken(
    token: string,
    pushToken: string
  ): Promise<ApiResponse> {
    return makeRequest('api/user/push-token', {
      method: 'POST',
      body: JSON.stringify({ push_token: pushToken }),
    }, token);
  }

  // Test de connectivité
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await makeRequest('api/health');
      return response.success;
    } catch {
      return false;
    }
  }
}

// Fonction utilitaire pour vérifier si l'API est disponible
export async function isApiAvailable(): Promise<boolean> {
  if (Platform.OS === 'web' && window.location.hostname === 'localhost') {
    // En développement local, on peut vouloir forcer le mode mock
    return false;
  }
  
  return await ApiService.healthCheck();
}

// Export par défaut
export default ApiService;