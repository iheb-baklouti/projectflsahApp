import { useState, useEffect, useCallback } from 'react';
import { Intervention } from '@/types/intervention';
import { useAuth } from './useAuth';
import { Alert } from 'react-native';
import { useLanguage } from './useLanguage';
import { translations } from '@/constants/Translations';
import ApiService, { isApiAvailable, ApiError, InterventionData, InterventionFilters } from '@/services/apiService';

// Demo data for interventions with short addresses
const demoInterventions: Intervention[] = [
  {
    id: 'int_001',
    number: 'INT-2025-0001',
    clientName: 'Jean Dupont',
    clientPhone: '+33123456789',
    clientEmail: 'jean.dupont@email.com',
    clientId: '1',
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
    specialtyId: '1',
    specialtyLabel: 'Serrurerie',
    specialtyValue: 'locksmith',
    addressId: '1',
    addressDetails: {
      housenumber: '15',
      street: 'Rue de Rivoli',
      city: 'Paris',
      postcode: '75001',
      citycode: '75101',
      label: '15 Rue de Rivoli 75001 Paris',
      name: '15 Rue de Rivoli',
      country: 'France'
    },
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString()
  }
];

// Interface pour les options de pagination et filtrage
export interface InterventionListOptions {
  page?: number;
  perPage?: number;
  status?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: 'created_at' | 'scheduled_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
  urgent?: boolean;
}

// Interface pour les métadonnées de pagination
export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  from: number;
  to: number;
}

export function useInterventions() {
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiAvailable, setApiAvailable] = useState(false);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null);
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

  // ✅ Transformer les données d'intervention de l'API vers le format local
  const transformApiInterventionToLocal = (apiIntervention: any): Intervention => {
    console.log('Transforming intervention:', apiIntervention);
    
    // Mapping des statuts selon votre backend
    const statusMapping: Record<string, Intervention['status']> = {
      'NEW': 'NEW',
      'ACCEPTED': 'ACCEPTED',
      'ASSIGNED': 'ASSIGNED',
      'EN_ROUTE': 'EN_ROUTE',
      'ON_SITE': 'ON_SITE',
      'DONE': 'DONE',
      'COMPLETED': 'COMPLETED',
      'CANCELLED': 'CANCELLED',
    };

    // ✅ Extraction des données selon la nouvelle structure
    const clientName = apiIntervention.client?.name || 'Client inconnu';
    const clientPhone = apiIntervention.client?.phone || 'Non renseigné';
    const clientEmail = apiIntervention.client?.email || 'Non renseigné';
    
    // ✅ Construction de l'adresse complète
    const addressLabel = apiIntervention.address?.label || 'Adresse non renseignée';
    const shortAddress = `${apiIntervention.address?.city || ''}, ${apiIntervention.address?.postcode || ''}`.trim();
    
    // ✅ Coordonnées GPS
    const latitude = parseFloat(apiIntervention.address?.latitude) || 48.8566;
    const longitude = parseFloat(apiIntervention.address?.longitude) || 2.3522;
    
    // ✅ Spécialité
    const specialtyLabel = apiIntervention.specialty?.label || 'Service';
    const specialtyValue = apiIntervention.specialty?.value || 'general';
    
    // ✅ Technicien
    const technicianName = apiIntervention.technician?.user?.name || undefined;

    return {
      id: apiIntervention.id.toString(),
      number: apiIntervention.number || `INT-${apiIntervention.id}`,
      clientName,
      clientPhone,
      clientEmail,
      clientId: apiIntervention.client_id?.toString() || '',
      address: addressLabel,
      shortAddress,
      coordinates: { latitude, longitude },
      serviceType: specialtyLabel,
      description: apiIntervention.description || 'Aucune description',
      status: statusMapping[apiIntervention.status] || 'NEW',
      isUrgent: Boolean(apiIntervention.urgent),
      specialtyId: apiIntervention.specialty_id?.toString() || '',
      specialtyLabel,
      specialtyValue,
      addressId: apiIntervention.address_id?.toString() || '',
      addressDetails: {
        housenumber: apiIntervention.address?.housenumber,
        street: apiIntervention.address?.street,
        city: apiIntervention.address?.city || '',
        postcode: apiIntervention.address?.postcode || '',
        citycode: apiIntervention.address?.citycode || '',
        context: apiIntervention.address?.context,
        country: apiIntervention.address?.country,
        state: apiIntervention.address?.state,
        type: apiIntervention.address?.type,
        label: apiIntervention.address?.label || '',
        name: apiIntervention.address?.name,
        additional_info: apiIntervention.address?.additional_info,
      },
      scheduledDate: apiIntervention.scheduled_at,
      scheduledTime: apiIntervention.scheduled_at ? 
        new Date(apiIntervention.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 
        undefined,
      createdAt: apiIntervention.created_at || new Date().toISOString(),
      updatedAt: apiIntervention.updated_at || new Date().toISOString(),
      acceptedAt: apiIntervention.technician ? apiIntervention.created_at : undefined,
      completedAt: apiIntervention.completed_at,
      technicianId: apiIntervention.technician_id?.toString(),
      technicianName,
      cancellationReason: apiIntervention.cancellation_reason,
      notes: apiIntervention.notes,
      totalAmount: apiIntervention.total_amount || 0,
      paymentStatus: apiIntervention.payment_status || 'PENDING',
    };
  };

  // Load interventions based on authentication state
  useEffect(() => {
    if (isAuthenticated) {
      loadInterventions();
    } else {
      setInterventions([]);
    }
  }, [isAuthenticated, apiAvailable]);

  // ✅ Fonction principale pour charger les interventions ACTIVES (non terminées)
  const loadInterventions = useCallback(async (options: InterventionListOptions = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (token) {
        // ✅ Charger depuis l'API et attendre indéfiniment
        try {
          const filters: InterventionFilters = {
            page: options.page || 1,
            per_page: options.perPage || 20,
            status: options.status,
            search: options.search,
            date_from: options.dateFrom,
            date_to: options.dateTo,
            sort_by: options.sortBy || 'created_at',
            sort_order: options.sortOrder || 'desc',
            urgent: options.urgent,
          };

          console.log('🚀 Chargement des interventions actives depuis l\'API...');
          const response = await ApiService.getInterventions(token, filters);
          
          if (response.success && response.data) {
            console.log('✅ Réponse API reçue:', response.data);
            
            // Gérer différentes structures de réponse
            let interventionsData = [];
            let metaData = null;
            
            if (Array.isArray(response.data)) {
              interventionsData = response.data;
            } else if (response.data.data && Array.isArray(response.data.data)) {
              interventionsData = response.data.data;
              metaData = response.data.meta;
            } else if (response.data.interventions && Array.isArray(response.data.interventions)) {
              interventionsData = response.data.interventions;
              metaData = response.data.pagination || response.data.meta;
            }
            
            // ✅ FILTRER LES INTERVENTIONS TERMINÉES POUR LE FEED
            const activeInterventions = interventionsData.filter(
              (intervention: any) => intervention.status !== 'COMPLETED' && intervention.status !== 'CANCELLED'
            );
            
            console.log('🔄 Transformation de', activeInterventions.length, 'interventions actives');
            
            const transformedInterventions = activeInterventions.map(transformApiInterventionToLocal);
            setInterventions(transformedInterventions);
            
            // Mettre à jour les métadonnées de pagination si disponibles
            if (metaData) {
              setPaginationMeta({
                currentPage: metaData.current_page || metaData.page || 1,
                totalPages: metaData.last_page || metaData.total_pages || 1,
                totalItems: metaData.total || activeInterventions.length,
                perPage: metaData.per_page || metaData.limit || 20,
                from: metaData.from || 1,
                to: metaData.to || activeInterventions.length,
              });
            } else {
              const currentPage = options.page || 1;
              const perPage = options.perPage || 20;
              setPaginationMeta({
                currentPage,
                totalPages: Math.ceil(Math.max(1, activeInterventions.length) / perPage),
                totalItems: activeInterventions.length,
                perPage,
                from: activeInterventions.length > 0 ? (currentPage - 1) * perPage + 1 : 0,
                to: Math.min(currentPage * perPage, activeInterventions.length),
              });
            }
            
            console.log('✅ Interventions actives chargées avec succès:', transformedInterventions.length);
            return;
          }
        } catch (apiError) {
          console.error('❌ Erreur API interventions:', apiError);
          throw apiError; // Propager l'erreur pour afficher le spinner
        }
      }

      // ❌ Fallback vers les mocks seulement si API non disponible
      console.log('🎭 API non disponible, utilisation des mocks');
      await loadMockInterventions(options);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load interventions');
      console.error('❌ Erreur générale:', err);
      // En cas d'erreur, continuer d'afficher le spinner
    } finally {
      setIsLoading(false);
    }
  }, [user, apiAvailable, token]);

  // ✅ Fonction pour charger les interventions TERMINÉES (pour l'historique)
  const loadCompletedInterventions = useCallback(async (options: InterventionListOptions = {}) => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (token) {
        try {
          const filters: InterventionFilters = {
            page: options.page || 1,
            per_page: options.perPage || 20,
            search: options.search,
            date_from: options.dateFrom,
            date_to: options.dateTo,
            sort_by: options.sortBy || 'updated_at',
            sort_order: options.sortOrder || 'desc',
          };

          console.log('🚀 Chargement des interventions terminées depuis l\'API...');
          const response = await ApiService.getInterventions(token, filters);
          
          if (response.success && response.data) {
            let interventionsData = [];
            let metaData = null;
            
            if (Array.isArray(response.data)) {
              interventionsData = response.data;
            } else if (response.data.data && Array.isArray(response.data.data)) {
              interventionsData = response.data.data;
              metaData = response.data.meta;
            }
            
            // ✅ FILTRER SEULEMENT LES INTERVENTIONS TERMINÉES POUR L'HISTORIQUE
            const completedInterventions = interventionsData.filter(
              (intervention: any) => intervention.status === 'COMPLETED' || intervention.status === 'CANCELLED'
            );
            
            console.log('🔄 Transformation de', completedInterventions.length, 'interventions terminées');
            
            const transformedInterventions = completedInterventions.map(transformApiInterventionToLocal);
            setInterventions(transformedInterventions);
            
            if (metaData) {
              setPaginationMeta({
                currentPage: metaData.current_page || 1,
                totalPages: metaData.last_page || 1,
                totalItems: metaData.total || completedInterventions.length,
                perPage: metaData.per_page || 20,
                from: metaData.from || 1,
                to: metaData.to || completedInterventions.length,
              });
            }
            return;
          }
        } catch (apiError) {
          console.error('API completed interventions error:', apiError);
          throw apiError;
        }
      }
      
      // Fallback vers le système mock
      const completedOptions = {
        ...options,
        status: 'COMPLETED,CANCELLED'
      };
      await loadMockInterventions(completedOptions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load completed interventions');
      console.error('❌ Erreur interventions terminées:', err);
    } finally {
      setIsLoading(false);
    }
  }, [apiAvailable, token]);

  // Fonction pour charger les données mock séparément
  const loadMockInterventions = async (options: InterventionListOptions = {}) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (user) {
      let filteredInterventions = [...demoInterventions];
      
      // Appliquer les filtres pour le système mock
      if (options.status && options.status !== 'all') {
        filteredInterventions = filteredInterventions.filter(int => int.status === options.status);
      }
      
      if (options.search) {
        const searchLower = options.search.toLowerCase();
        filteredInterventions = filteredInterventions.filter(int =>
          int.clientName.toLowerCase().includes(searchLower) ||
          int.address.toLowerCase().includes(searchLower) ||
          int.description.toLowerCase().includes(searchLower) ||
          int.serviceType.toLowerCase().includes(searchLower)
        );
      }
      
      if (options.urgent !== undefined) {
        filteredInterventions = filteredInterventions.filter(int => int.isUrgent === options.urgent);
      }
      
      // Tri
      if (options.sortBy) {
        filteredInterventions.sort((a, b) => {
          let aValue: string | number = '';
          let bValue: string | number = '';
          
          switch (options.sortBy) {
            case 'created_at':
              aValue = new Date(a.createdAt).getTime();
              bValue = new Date(b.createdAt).getTime();
              break;
            case 'scheduled_at':
              aValue = a.scheduledDate ? new Date(a.scheduledDate).getTime() : 0;
              bValue = b.scheduledDate ? new Date(b.scheduledDate).getTime() : 0;
              break;
            case 'updated_at':
              aValue = new Date(a.updatedAt).getTime();
              bValue = new Date(b.updatedAt).getTime();
              break;
          }
          
          if (options.sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
      }
      
      // Pagination pour le système mock
      const page = options.page || 1;
      const perPage = options.perPage || 20;
      const startIndex = (page - 1) * perPage;
      const endIndex = startIndex + perPage;
      const paginatedInterventions = filteredInterventions.slice(startIndex, endIndex);
      
      setInterventions(paginatedInterventions);
      setPaginationMeta({
        currentPage: page,
        totalPages: Math.ceil(filteredInterventions.length / perPage),
        totalItems: filteredInterventions.length,
        perPage,
        from: filteredInterventions.length > 0 ? startIndex + 1 : 0,
        to: Math.min(endIndex, filteredInterventions.length),
      });
    } else {
      setInterventions([]);
      setPaginationMeta(null);
    }
  };

  // Fonction pour charger les interventions planifiées
  const loadScheduledInterventions = useCallback(async (options: InterventionListOptions = {}) => {
    if (token) {
      try {
        const filters: InterventionFilters = {
          page: options.page || 1,
          per_page: options.perPage || 20,
          date_from: new Date().toISOString().split('T')[0],
          search: options.search,
          sort_by: 'scheduled_at',
          sort_order: 'asc',
        };

        const response = await ApiService.getScheduledInterventions(token, filters);
        
        if (response.success && response.data) {
          let interventionsData = [];
          let metaData = null;
          
          if (Array.isArray(response.data)) {
            interventionsData = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            interventionsData = response.data.data;
            metaData = response.data.meta;
          }
          
          const transformedInterventions = interventionsData.map(transformApiInterventionToLocal);
          setInterventions(transformedInterventions);
          
          if (metaData) {
            setPaginationMeta({
              currentPage: metaData.current_page || 1,
              totalPages: metaData.last_page || 1,
              totalItems: metaData.total || interventionsData.length,
              perPage: metaData.per_page || 20,
              from: metaData.from || 1,
              to: metaData.to || interventionsData.length,
            });
          }
          return;
        }
      } catch (apiError) {
        console.error('API scheduled interventions error:', apiError);
      }
    }
    
    // Fallback vers le système mock
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const scheduledOptions = {
      ...options,
      dateFrom: today.toISOString().split('T')[0],
      sortBy: 'scheduled_at' as const,
      sortOrder: 'asc' as const,
    };
    await loadMockInterventions(scheduledOptions);
  }, [apiAvailable, token]);

  // Refresh interventions
  const refreshInterventions = useCallback(async (options?: InterventionListOptions) => {
    await loadInterventions(options);
  }, [loadInterventions]);

  // Refresh completed interventions
  const refreshCompletedInterventions = useCallback(async (options?: InterventionListOptions) => {
    await loadCompletedInterventions(options);
  }, [loadCompletedInterventions]);

  // Refresh scheduled interventions
  const refreshScheduledInterventions = useCallback(async (options?: InterventionListOptions) => {
    await loadScheduledInterventions(options);
  }, [loadScheduledInterventions]);

  // Take an intervention
  const takeIntervention = useCallback(async (id: string) => {
    try {
      if (token) {
        try {
          const response = await ApiService.acceptIntervention(token, id);
          
          if (response.success) {
            await loadInterventions();
            return true;
          }
        } catch (apiError) {
          console.error('API take intervention error:', apiError);
          if (apiError instanceof ApiError) {
            throw apiError;
          }
        } finally {
          // Toujours recharger les interventions, même en cas d’erreur
          await loadInterventions();
        }
      }

      // Système mock (fallback)
      await new Promise(resolve => setTimeout(resolve, 500));

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

  // ✅ NOUVELLE FONCTION: Mettre à jour le statut d'une intervention
  const updateInterventionStatus = useCallback(async (id: string, status: Intervention['status']) => {
    try {
      if (token) {
        try {
          // ✅ Utiliser la nouvelle API pour mettre à jour le statut
          const response = await fetch(`http://127.0.0.1:8000/api/interventions/${id}/status`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ status }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Statut mis à jour:', data);
            
            // Recharger les interventions pour refléter le changement
            await loadInterventions();
            return true;
          } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erreur lors de la mise à jour du statut');
          }
        } catch (apiError) {
          console.error('API update status error:', apiError);
          if (apiError instanceof Error) {
            throw apiError;
          }
        } finally {
          // Toujours recharger les interventions, même en cas d’erreur
          await loadInterventions();
        }
        
      }

      // Système mock (fallback)
      await new Promise(resolve => setTimeout(resolve, 500));

      const intervention = interventions.find(int => int.id === id);
      if (!intervention) {
        throw new Error('Intervention not found');
      }

      if (intervention.technicianId && intervention.technicianId !== user?.id) {
        throw new Error('You are not assigned to this intervention');
      }

      setInterventions(prevInterventions => 
        prevInterventions.map(intervention => 
          intervention.id === id 
            ? {
                ...intervention,
                status,
                updatedAt: new Date().toISOString(),
                ...(status === 'COMPLETED' ? { completedAt: new Date().toISOString() } : {})
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
      if (token) {
        try {
          const response = await ApiService.getInterventionById(token, id);
          
          if (response.success && response.data?.data) {
            return transformApiInterventionToLocal(response.data.data);
          }
        } catch (apiError) {
          console.error('API get intervention error:', apiError);
        } finally {
          // Toujours recharger les interventions, même en cas d’erreur
          await loadInterventions();
        }
      }

      return interventions.find(int => int.id === id) || demoInterventions.find(int => int.id === id) || null;
    } catch (err) {
      console.error('Error getting intervention by ID:', err);
      return null;
    }
  }, [interventions, apiAvailable, token]);

  // Search interventions
  const searchInterventions = useCallback(async (searchQuery: string, options: InterventionListOptions = {}) => {
    const searchOptions = {
      ...options,
      search: searchQuery,
    };
    await loadInterventions(searchOptions);
  }, [loadInterventions]);

  // Vérifier si l'utilisateur peut accéder aux détails d'une intervention
  const canAccessInterventionDetails = useCallback((intervention: Intervention): boolean => {
    if (!user) return false;
    
    // Si l'intervention est assignée à ce technicien
    if (intervention.technicianId) {
      return true;
    }
    
    // Si l'intervention n'est pas encore prise par personne et que le statut est NEW
    if (intervention.status === 'NEW' && !intervention.technicianId) {
      return false;
    }
    
    // Pour les interventions terminées/annulées, permettre l'accès en lecture seule
    if (['DONE', 'COMPLETED', 'CANCELLED'].includes(intervention.status)) {
      return true;
    }
    
    return false;
  }, [user]);

  // Get interventions scheduled for future dates (computed from current interventions)
  const scheduledInterventions = interventions.filter(
    int => int.scheduledDate && new Date(int.scheduledDate) >= new Date(new Date().setHours(0, 0, 0, 0))
  );

  // Get completed interventions (computed from current interventions)
  const completedInterventions = interventions.filter(
    int => int.status === 'COMPLETED' || int.status === 'CANCELLED'
  );

  return {
    // Data
    interventions,
    scheduledInterventions,
    completedInterventions,
    paginationMeta,
    
    // State
    isLoading,
    error,
    apiAvailable,
    
    // Actions
    loadInterventions,
    loadCompletedInterventions,
    loadScheduledInterventions,
    refreshInterventions,
    refreshCompletedInterventions,
    refreshScheduledInterventions,
    searchInterventions,
    takeIntervention,
    updateInterventionStatus, // ✅ Nouvelle fonction
    getInterventionById,
    canAccessInterventionDetails,
  };
}