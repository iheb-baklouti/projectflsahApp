import React,{ useState, useCallback, useRef } from 'react';
import { useAuth } from './useAuth';
import { Alert, Linking, Platform } from 'react-native';
import { Invoice } from '@/types/intervention';
import ApiService, { isApiAvailable, ApiError } from '@/services/apiService';

// Mock data for invoices
const mockInvoices: Invoice[] = [
  {
    id: 'inv_001',
    intervention_id: 'int_004',
    number: 'INV-2024-001',
    amount_ht: 100.00,
    vat_rate: 20.00,
    amount_ttc: 120.00,
    commission_amount: 36.00,
    commission_paid: false, // ✅ Commission non payée
    status: 'paid',
    issue_date: new Date(Date.now() - 86400000 * 7).toISOString(),
    due_date: new Date(Date.now() + 86400000 * 23).toISOString(),
    payment_date: new Date(Date.now() - 86400000 * 3).toISOString(),
    url: 'https://example.com/invoices/INV-2024-001.pdf',
    description: ['Main d\'oeuvre: 2 heures', 'Pièces: Cylindre de serrure'],
    payment_terms: 'Net 30',
    intervention: {
      id: 'int_004',
      number: 'INT-2024-0001',
      client: {
        id: 'client_001',
        name: 'Thomas Petit',
        company_name: 'Petit SARL'
      },
      technician: {
        id: 'tech_001',
        name: 'Jean Technicien'
      }
    }
  },
  {
    id: 'inv_002',
    intervention_id: 'int_005',
    number: 'INV-2024-002',
    amount_ht: 75.00,
    vat_rate: 20.00,
    amount_ttc: 90.00,
    commission_amount: 27.00,
    commission_paid: true, // ✅ Commission payée
    status: 'pending',
    issue_date: new Date(Date.now() - 86400000 * 2).toISOString(),
    due_date: new Date(Date.now() + 86400000 * 28).toISOString(),
    url: 'https://example.com/invoices/INV-2024-002.pdf',
    description: ['Remplacement robinet cuisine', 'Déplacement'],
    payment_terms: 'Net 30',
    intervention: {
      id: 'int_005',
      number: 'INT-2024-0002',
      client: {
        id: 'client_002',
        name: 'Claire Dubois'
      },
      technician: {
        id: 'tech_001',
        name: 'Jean Technicien'
      }
    }
  }
];

export interface InvoiceListOptions {
  page?: number;
  perPage?: number;
  status?: string;
  fromDate?: string;
  toDate?: string;
  technicianId?: string;
  clientId?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface InvoiceCreateData {
  intervention_id: string;
  amount_ht: string;
  vat_rate: string;
  description: string;
  payment_terms: string;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  perPage: number;
  from: number;
  to: number;
}

export function useInvoices() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta | null>(null);
  const [apiAvailable, setApiAvailable] = useState(false);
  const { user, token } = useAuth();
  
  // Verrous pour éviter les appels multiples
  const isLoadingRef = useRef(false);
  
  // Référence pour suivre si on attend une réponse API
  const waitingForApiRef = useRef(false);
  
  // Timeout pour l'attente API
  const apiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const MAX_API_WAIT_TIME = 10000; // 10 secondes maximum d'attente

  // Vérifier la disponibilité de l'API
  React.useEffect(() => {
    const checkApiAvailability = async () => {
      const available = await isApiAvailable();
      setApiAvailable(available);
      console.log('🌐 API disponible (invoices):', available);
    };
    checkApiAvailability();
  }, []);

  // Transformer les données d'invoice de l'API vers le format local
  const transformApiInvoiceToLocal = (apiInvoice: any): Invoice => {
    return {
      id: apiInvoice.id.toString(),
      intervention_id: apiInvoice.intervention_id.toString(),
      number: apiInvoice.number,
      amount_ht: parseFloat(apiInvoice.amount_ht),
      vat_rate: parseFloat(apiInvoice.vat_rate),
      amount_ttc: parseFloat(apiInvoice.amount_ttc),
      commission_amount: apiInvoice.commission_amount ? parseFloat(apiInvoice.commission_amount) : undefined,
      commission_paid: apiInvoice.commission_paid || false,
      status: apiInvoice.status,
      issue_date: apiInvoice.issue_date,
      due_date: apiInvoice.due_date,
      payment_date: apiInvoice.payment_date,
      url: apiInvoice.url,
      description: apiInvoice.description ? JSON.parse(apiInvoice.description) : [],
      payment_terms: apiInvoice.payment_terms,
      intervention: apiInvoice.intervention ? {
        id: apiInvoice.intervention.id.toString(),
        number: apiInvoice.intervention.number,
        client: {
          id: apiInvoice.intervention.client.id.toString(),
          name: apiInvoice.intervention.client.name,
          company_name: apiInvoice.intervention.client.company_name
        },
        technician: {
          id: apiInvoice.intervention.technician.id.toString(),
          name: apiInvoice.intervention.technician.name
        }
      } : undefined
    };
  };

  // Charger les factures
  const loadInvoices = useCallback(async (options: InvoiceListOptions = {}) => {
    // Éviter les appels multiples
    if (isLoadingRef.current) {
      console.log('⏳ Chargement des factures déjà en cours, ignorer...');
      return;
    }
    
    // Nettoyer tout timeout précédent
    if (apiTimeoutRef.current) {
      clearTimeout(apiTimeoutRef.current);
      apiTimeoutRef.current = null;
    }
    
    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      console.log('🚀 Début chargement factures...');
      
      if (token) {
        // ✅ Attendre indéfiniment la réponse API
        try {
          const queryParams = new URLSearchParams();
          
          if (options.page) queryParams.append('page', options.page.toString());
          if (options.perPage) queryParams.append('per_page', options.perPage.toString());
          if (options.status) queryParams.append('status', options.status);
          if (options.fromDate) queryParams.append('from_date', options.fromDate);
          if (options.toDate) queryParams.append('to_date', options.toDate);
          if (options.technicianId) queryParams.append('technician_id', options.technicianId);
          if (options.clientId) queryParams.append('client_id', options.clientId);
          if (options.minAmount) queryParams.append('min_amount', options.minAmount.toString());
          if (options.maxAmount) queryParams.append('max_amount', options.maxAmount.toString());

          const endpoint = `api/invoices${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
          
          console.log('📡 Appel API factures:', endpoint);
          const response = await fetch(`http://127.0.0.1:8000/${endpoint}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Réponse API factures reçue:', data);
            
            let invoicesData = [];
            let metaData = null;
            
            if (Array.isArray(data.data)) {
              invoicesData = data.data;
              metaData = data.meta;
            }
            
            // ✅ Utiliser les données de l'API même si le tableau est vide
            const transformedInvoices = invoicesData.map(transformApiInvoiceToLocal);
            console.log('🔄 Factures transformées:', transformedInvoices.length);
            setInvoices(transformedInvoices);
            
            if (metaData) {
              setPaginationMeta({
                currentPage: metaData.current_page || 1,
                totalPages: metaData.last_page || 1,
                totalItems: metaData.total || invoicesData.length,
                perPage: metaData.per_page || 20,
                from: metaData.from || 1,
                to: metaData.to || invoicesData.length,
              });
            } else {
              // Pagination par défaut
              const currentPage = options.page || 1;
              const perPage = options.perPage || 20;
              setPaginationMeta({
                currentPage,
                totalPages: Math.ceil(Math.max(1, invoicesData.length) / perPage),
                totalItems: invoicesData.length,
                perPage,
                from: invoicesData.length > 0 ? (currentPage - 1) * perPage + 1 : 0,
                to: Math.min(currentPage * perPage, invoicesData.length),
              });
            }
            
            setIsLoading(false);
            isLoadingRef.current = false;
            return;
          } else {
            throw new Error(`Erreur API: ${response.status}`);
          }
        } catch (apiError) {
          console.error('❌ Erreur API factures:', apiError);
          throw apiError; // Propager l'erreur pour continuer d'afficher le spinner
        }
      }

      // ❌ SEULEMENT si l'API n'est pas disponible → Utiliser les mocks
      console.log('🔄 API non disponible, utilisation des mocks pour les factures');
      await loadMockInvoices(options);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invoices');
      console.error('❌ Erreur générale factures:', err);
      // En cas d'erreur, continuer d'afficher le spinner
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [apiAvailable, token]);

  // Fonction pour charger les factures mock
  const loadMockInvoices = async (options: InvoiceListOptions = {}) => {
    console.log('🎭 Chargement des factures mock...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    let filteredInvoices = [...mockInvoices];
    
    // Appliquer les filtres pour le système mock
    if (options.status && options.status !== 'all') {
      filteredInvoices = filteredInvoices.filter(inv => inv.status === options.status);
    }
    
    if (options.fromDate) {
      filteredInvoices = filteredInvoices.filter(inv => 
        new Date(inv.issue_date) >= new Date(options.fromDate!)
      );
    }
    
    if (options.toDate) {
      filteredInvoices = filteredInvoices.filter(inv => 
        new Date(inv.issue_date) <= new Date(options.toDate!)
      );
    }
    
    if (options.minAmount) {
      filteredInvoices = filteredInvoices.filter(inv => inv.amount_ttc >= options.minAmount!);
    }
    
    if (options.maxAmount) {
      filteredInvoices = filteredInvoices.filter(inv => inv.amount_ttc <= options.maxAmount!);
    }
    
    // Pagination pour le système mock
    const page = options.page || 1;
    const perPage = options.perPage || 20;
    const startIndex = (page - 1) * perPage;
    const endIndex = startIndex + perPage;
    const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);
    
    console.log('🎭 Factures mock chargées:', paginatedInvoices.length);
    setInvoices(paginatedInvoices);
    setPaginationMeta({
      currentPage: page,
      totalPages: Math.ceil(filteredInvoices.length / perPage),
      totalItems: filteredInvoices.length,
      perPage,
      from: filteredInvoices.length > 0 ? startIndex + 1 : 0,
      to: Math.min(endIndex, filteredInvoices.length),
    });
  };

  // Créer une facture
  const createInvoice = useCallback(async (invoiceData: InvoiceCreateData): Promise<Invoice | null> => {
    setIsLoading(true);
    setError(null);

    try {
      if (token) {
        // Créer via API
        try {
          const response = await fetch(`http://127.0.0.1:8000/api/invoices`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            body: JSON.stringify(invoiceData),
          });

          if (response.ok) {
            const data = await response.json();
            const newInvoice = transformApiInvoiceToLocal(data.data);
            
            // Ajouter la nouvelle facture à la liste locale
            setInvoices(prev => [newInvoice, ...prev]);
            
            return newInvoice;
          } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erreur lors de la création de la facture');
          }
        } catch (apiError) {
          console.error('API create invoice error:', apiError);
          if (apiError instanceof Error) {
            throw apiError;
          }
          // Fallback vers le système mock
        }
      }

      // Système mock (fallback)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const newInvoice: Invoice = {
        id: `inv_${Date.now()}`,
        intervention_id: invoiceData.intervention_id,
        number: `INV-2024-${String(mockInvoices.length + 1).padStart(3, '0')}`,
        amount_ht: parseFloat(invoiceData.amount_ht),
        vat_rate: parseFloat(invoiceData.vat_rate),
        amount_ttc: parseFloat(invoiceData.amount_ht) * (1 + parseFloat(invoiceData.vat_rate) / 100),
        commission_amount: parseFloat(invoiceData.amount_ht) * 0.3, // 30% commission
        commission_paid: false,
        status: 'pending',
        issue_date: new Date().toISOString(),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 jours
        url: `https://example.com/invoices/INV-2024-${String(mockInvoices.length + 1).padStart(3, '0')}.pdf`,
        description: JSON.parse(invoiceData.description),
        payment_terms: invoiceData.payment_terms,
      };
      
      mockInvoices.unshift(newInvoice);
      setInvoices(prev => [newInvoice, ...prev]);
      
      return newInvoice;
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create invoice');
      console.error('Error creating invoice:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiAvailable, token]);

  // ✅ Payer la commission d'une facture
  const payCommission = useCallback(async (invoiceId: string): Promise<boolean> => {
    try {
      if (token) {
        // Payer via API
        try {
          const response = await fetch(`http://127.0.0.1:8000/api/invoices/${invoiceId}/pay-commission`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          });

          if (response.ok) {
            // Mettre à jour la facture localement
            setInvoices(prev => prev.map(invoice => 
              invoice.id === invoiceId 
                ? { ...invoice, commission_paid: true }
                : invoice
            ));
            return true;
          } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Erreur lors du paiement de la commission');
          }
        } catch (apiError) {
          console.error('API pay commission error:', apiError);
          throw apiError;
        }
      }

      // Système mock (fallback)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setInvoices(prev => prev.map(invoice => 
        invoice.id === invoiceId 
          ? { ...invoice, commission_paid: true }
          : invoice
      ));
      
      return true;
      
    } catch (err) {
      console.error('Error paying commission:', err);
      Alert.alert('Erreur', 'Impossible de payer la commission');
      return false;
    }
  }, [apiAvailable, token]);

  // Télécharger une facture
  const downloadInvoice = useCallback(async (invoiceId: string) => {
    try {
      if (token) {
        // Télécharger via API
        try {
          const response = await fetch(`http://127.0.0.1:8000/api/invoices/${invoiceId}/download`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Accept': 'application/pdf',
            },
          });

          if (response.ok) {
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            // Ouvrir le PDF dans le navigateur ou télécharger
            if (Platform.OS === 'web') {
              const link = document.createElement('a');
              link.href = url;
              link.download = `invoice-${invoiceId}.pdf`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
            } else {
              Linking.openURL(url);
            }
            return;
          }
        } catch (apiError) {
          console.error('API download invoice error:', apiError);
          // Fallback vers le système mock
        }
      }

      // Système mock (fallback)
      const invoice = invoices.find(inv => inv.id === invoiceId) || mockInvoices.find(inv => inv.id === invoiceId);
      if (invoice?.url) {
        Linking.openURL(invoice.url);
      } else {
        Alert.alert('Erreur', 'Facture non trouvée');
      }
      
    } catch (err) {
      console.error('Error downloading invoice:', err);
      Alert.alert('Erreur', 'Impossible de télécharger la facture');
    }
  }, [apiAvailable, token, invoices]);

  // Obtenir une facture par ID
  const getInvoiceById = useCallback(async (invoiceId: string): Promise<Invoice | null> => {
    try {
      if (token) {
        // Récupérer via API
        try {
          const response = await fetch(`http://127.0.0.1:8000/api/invoices/${invoiceId}`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            return transformApiInvoiceToLocal(data.data);
          }
        } catch (apiError) {
          console.error('API get invoice error:', apiError);
          // Fallback vers le système mock
        }
      }

      // Système mock (fallback)
      return invoices.find(inv => inv.id === invoiceId) || mockInvoices.find(inv => inv.id === invoiceId) || null;
      
    } catch (err) {
      console.error('Error getting invoice by ID:', err);
      return null;
    }
  }, [apiAvailable, token, invoices]);

  // Rafraîchir les factures
  const refreshInvoices = useCallback(async (options?: InvoiceListOptions) => {
    // Réinitialiser le verrou avant refresh
    isLoadingRef.current = false;
    waitingForApiRef.current = false;
    
    // Nettoyer tout timeout en cours
    if (apiTimeoutRef.current) {
      clearTimeout(apiTimeoutRef.current);
      apiTimeoutRef.current = null;
    }
    
    await loadInvoices(options);
  }, [loadInvoices]);

  return {
    // Data
    invoices,
    paginationMeta,
    
    // State
    isLoading,
    error,
    apiAvailable,
    
    // Actions
    loadInvoices,
    createInvoice,
    downloadInvoice,
    getInvoiceById,
    refreshInvoices,
    payCommission, // ✅ Nouvelle fonction
  };
}