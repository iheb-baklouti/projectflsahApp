import { useState, useEffect, useCallback } from 'react';
import { Intervention } from '@/types/intervention';
import { useAuth } from './useAuth';
import { Alert } from 'react-native';
import { useLanguage } from './useLanguage';
import { translations } from '@/constants/Translations';
import ApiService, { isApiAvailable, ApiError, InterventionData } from '@/services/apiService';

// Demo data for interventions with short addresses
const demoInterventions: Intervention[] = [
  {
    id: 'int_001',
    clientName: 'Jean Dupont',
    clientPhone: '+33123456789',
    address: '15 Rue de Rivoli, 75001 Paris',
    shortAddress: 'Châtelet, Paris',
    coordinates: {
      latitude: 48.856614,
      longitude: 2.352222
    },
    serviceType: 'Serrurerie',
    description: 'Porte d\'entrée bloquée, client ne peut pas rentrer chez lui',
    status: 'NEW',
    isUrgent: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 'int_002',
    clientName: 'Marie Martin',
    clientPhone: '+33123456790',
    address: '8 Avenue Montaigne, 75008 Paris',
    shortAddress: 'Champs-Élysées, Paris',
    coordinates: {
      latitude: 48.866167,
      longitude: 2.306981
    },
    serviceType: 'Plomberie',
    description: 'Fuite d\'eau sous l\'évier de la cuisine',
    status: 'ACCEPTED',
    isUrgent: false,
    scheduledDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    scheduledTime: '14:30',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    acceptedAt: new Date(Date.now() - 3600000).toISOString(),
    technicianId: '1'
  },
  {
    id: 'int_003',
    clientName: 'Sophie Bernard',
    clientPhone: '+33123456791',
    address: '25 Rue du Faubourg Saint-Honoré, 75008 Paris',
    shortAddress: 'Faubourg Saint-Honoré, Paris',
    coordinates: {
      latitude: 48.871598,
      longitude: 2.316229
    },
    serviceType: 'Serrurerie',
    description: 'Changement de serrure après cambriolage',
    status: 'EN_ROUTE',
    isUrgent: true,
    createdAt: new Date(Date.now() - 10800000).toISOString(),
    updatedAt: new Date(Date.now() - 1800000).toISOString(),
    acceptedAt: new Date(Date.now() - 7200000).toISOString(),
    technicianId: '1'
  },
  {
    id: 'int_004',
    clientName: 'Thomas Petit',
    clientPhone: '+33123456792',
    address: '5 Boulevard Haussmann, 75009 Paris',
    shortAddress: 'Opéra, Paris',
    coordinates: {
      latitude: 48.873792,
      longitude: 2.332613
    },
    serviceType: 'Rideaux métalliques',
    description: 'Rideau métallique bloqué, magasin ne peut pas ouvrir',
    status: 'DONE',
    isUrgent: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    updatedAt: new Date(Date.now() - 43200000).toISOString(),
    acceptedAt: new Date(Date.now() - 82800000).toISOString(),
    completedAt: new Date(Date.now() - 43200000).toISOString(),
    technicianId: '2',
    materials: [
      {
        id: 'mat_001',
        name: 'Cylindre de serrure',
        price: 45.90,
        quantity: 1
      },
      {
        id: 'mat_002',
        name: 'Main d\'oeuvre',
        price: 80.00,
        quantity: 1
      }
    ],
    totalAmount: 125.90,
    paymentStatus: 'PAID'
  },
  {
    id: 'int_005',
    clientName: 'Claire Dubois',
    clientPhone: '+33123456793',
    address: '12 Rue de la Paix, 75002 Paris',
    shortAddress: 'Opéra, Paris',
    coordinates: {
      latitude: 48.869809,
      longitude: 2.330335
    },
    serviceType: 'Plomberie',
    description: 'Remplacement d\'un robinet de cuisine',
    status: 'JE_DOIS_REPASSER',
    isUrgent: false,
    scheduledDate: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
    scheduledTime: '10:00',
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    acceptedAt: new Date(Date.now() - 172800000).toISOString(),
    technicianId: '1',
    notes: 'Pièce manquante, besoin de revenir avec un robinet spécifique'
  },
  {
    id: 'int_006',
    clientName: 'Philippe Laurent',
    clientPhone: '+33123456794',
    address: '3 Avenue des Champs-Élysées, 75008 Paris',
    shortAddress: 'Champs-Élysées, Paris',
    coordinates: {
      latitude: 48.872210,
      longitude: 2.299617
    },
    serviceType: 'Serrurerie',
    description: 'Installation d\'une nouvelle serrure 3 points',
    status: 'ANNULÉE',
    isUrgent: false,
    scheduledDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    scheduledTime: '16:00',
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 43200000).toISOString(),
    acceptedAt: new Date(Date.now() - 129600000).toISOString(),
    technicianId: '1'
  }
];

export function useInterventions() {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiAvailable, setApiAvailable] = useState(false);
  const { user, isAuthenticated, token } = useAuth();
  const { language } = useLanguage();
  const t = translations[language];

  // Vérifier la disponibilité de l'API
  useEffect(() => {
    const checkApiAvailability = async () => {
      const available = await isApiAvailable();
      setApiAvailable(available);
    };
    checkApiAvailability();
  }, []);

  // Transformer les données d'intervention de l'API vers le format local
  const transformApiInterventionToLocal = (apiIntervention: InterventionData): Intervention => {
    const statusMapping: Record<string, Intervention['status']> = {
      'new': 'NEW',
      'accepted': 'ACCEPTED',
      'in_progress': 'EN_ROUTE',
      'on_site': 'ON_SITE',
      'completed': 'DONE',
      'cancelled': 'ANNULÉE',
      'needs_return': 'JE_DOIS_REPASSER',
    };

    return {
      id: apiIntervention.id.toString(),
      clientName: `${apiIntervention.client.first_name} ${apiIntervention.client.last_name}`,
      clientPhone: apiIntervention.client.phone,
      address: `${apiIntervention.address.street}, ${apiIntervention.address.city} ${apiIntervention.address.postcode}`,
      shortAddress: `${apiIntervention.address.city}`,
      coordinates: {
        latitude: 48.8566, // Coordonnées par défaut (Paris)
        longitude: 2.3522
      },
      serviceType: apiIntervention.type,
      description: apiIntervention.description,
      status: statusMapping[apiIntervention.status] || 'NEW',
      isUrgent: apiIntervention.urgent,
      scheduledDate: apiIntervention.scheduled_at,
      scheduledTime: apiIntervention.scheduled_at ? new Date(apiIntervention.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : undefined,
      createdAt: new Date().toISOString(), // L'API ne fournit pas cette info
      updatedAt: new Date().toISOString(),
      acceptedAt: apiIntervention.technician ? new Date().toISOString() : undefined,
      completedAt: apiIntervention.completed_at,
      technicianId: apiIntervention.technician?.id.toString(),
      notes: apiIntervention.completion_notes,
      totalAmount: 0, // L'API ne fournit pas cette info dans la liste
      paymentStatus: 'PENDING',
    };
  };

  // Load interventions based on authentication state
  useEffect(() => {
    console.log('isAuthenticated', isAuthenticated);
    if (isAuthenticated) {
      loadInterventions();
    } else {
      setInterventions([]);
    }
  }, [isAuthenticated, apiAvailable]); // Depend on apiAvailable too

  // Memoize loadInterventions function
  const loadInterventions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('token', token);
      if (!apiAvailable && token) {
        // Charger depuis l'API
        try {
          const response = await ApiService.getInterventions(token);
          console.log('response', response);
          console.log(response.success ,'&&', response.data);
          if (response.success && response.data) {
            const transformedInterventions = response.data.map(transformApiInterventionToLocal);
            console.log(transformedInterventions);
            setInterventions(transformedInterventions);
            return;
          }
        } catch (apiError) {
          console.error('API interventions error:', apiError);
          // Fallback vers le système mock
        }
      }

      // Système mock (fallback ou si API non disponible)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (user) {
        if (user.id === '1') {
          setInterventions(demoInterventions.filter(
            int => int.technicianId !== '2' || int.technicianId === undefined
          ));
        } else if (user.id === '2') {
          setInterventions(demoInterventions.filter(
            int => int.serviceType === 'Rideaux métalliques' || int.technicianId === '2'
          ));
        } else {
          setInterventions(demoInterventions);
        }
      } else {
        setInterventions([]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load interventions');
      console.error('Error loading interventions:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user, apiAvailable, token]);

  // Refresh interventions
  const refreshInterventions = useCallback(async () => {
    await loadInterventions();
  }, [loadInterventions]);

  // Take an intervention
  const takeIntervention = useCallback(async (id: string) => {
    try {
      if (token) {
        // Accepter via API
        try {
          const response = await ApiService.acceptIntervention(token, id);
          
          if (response.success) {
            // Recharger les interventions pour avoir les données à jour
            await loadInterventions();
            return true;
          }
        } catch (apiError) {
          console.error('API take intervention error:', apiError);
          if (apiError instanceof ApiError) {
            throw apiError;
          }
          // Fallback vers le système mock
        }
      }

      // Système mock (fallback)
      await new Promise(resolve => setTimeout(resolve, 500));

      // Update local intervention status
      setInterventions(prevInterventions => 
        prevInterventions.map(intervention => 
          intervention.id === id 
            ? {
                ...intervention,
                status: 'ACCEPTED' as const,
                technicianId: user?.id,
                acceptedAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }
            : intervention
        )
      );

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to take intervention');
      console.error('Error taking intervention:', err);
      throw err;
    }
  }, [user, apiAvailable, token, loadInterventions]);

  // Update intervention status
  const updateInterventionStatus = useCallback(async (id: string, status: Intervention['status']) => {
    try {
      if (apiAvailable && token) {
        // Mettre à jour via API
        try {
          const statusMapping: Record<Intervention['status'], string> = {
            'NEW': 'new',
            'ACCEPTED': 'accepted',
            'EN_ROUTE': 'in_progress',
            'ON_SITE': 'on_site',
            'DONE': 'completed',
            'ANNULÉE': 'cancelled',
            'JE_DOIS_REPASSER': 'needs_return',
          };

          const response = await ApiService.updateIntervention(token, id, {
            status: statusMapping[status]
          });

          if (response.success) {
            // Recharger les interventions pour avoir les données à jour
            await loadInterventions();
            return true;
          }
        } catch (apiError) {
          console.error('API update intervention error:', apiError);
          if (apiError instanceof ApiError) {
            throw apiError;
          }
          // Fallback vers le système mock
        }
      }

      // Système mock (fallback)
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if user owns this intervention
      const intervention = interventions.find(int => int.id === id);
      if (!intervention) {
        throw new Error('Intervention not found');
      }

      if (intervention.technicianId && intervention.technicianId !== user?.id) {
        throw new Error('You are not assigned to this intervention');
      }

      // Update local intervention status
      setInterventions(prevInterventions => 
        prevInterventions.map(intervention => 
          intervention.id === id 
            ? {
                ...intervention,
                status,
                updatedAt: new Date().toISOString(),
                ...(status === 'DONE' ? { completedAt: new Date().toISOString() } : {})
              }
            : intervention
        )
      );

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update intervention status');
      console.error('Error updating intervention status:', err);
      throw err;
    }
  }, [interventions, user, apiAvailable, token, loadInterventions]);

  // Get intervention by ID
  const getInterventionById = useCallback(async (id: string): Promise<Intervention | null> => {
    try {
      if (apiAvailable && token) {
        // Récupérer depuis l'API
        try {
          const response = await ApiService.getInterventionById(token, id);
          
          if (response.success && response.data?.data) {
            return transformApiInterventionToLocal(response.data.data);
          }
        } catch (apiError) {
          console.error('API get intervention error:', apiError);
          // Fallback vers le système mock
        }
      }

      // Système mock (fallback)
      return interventions.find(int => int.id === id) || null;
    } catch (err) {
      console.error('Error getting intervention by ID:', err);
      return null;
    }
  }, [interventions, apiAvailable, token]);

  // Refresh completed interventions
  const refreshCompletedInterventions = useCallback(async () => {
    await loadInterventions();
  }, [loadInterventions]);

  // Get interventions scheduled for future dates
  const scheduledInterventions = interventions.filter(
    int => int.scheduledDate && new Date(int.scheduledDate) >= new Date(new Date().setHours(0, 0, 0, 0))
  );

  // Get completed interventions (DONE or CANCELLED)
  const completedInterventions = interventions.filter(
    int => int.status === 'DONE' || int.status === 'ANNULÉE'
  );

  return {
    interventions,
    scheduledInterventions,
    completedInterventions,
    isLoading,
    error,
    refreshInterventions,
    refreshCompletedInterventions,
    takeIntervention,
    updateInterventionStatus,
    getInterventionById
  };
}

export { useInterventions }