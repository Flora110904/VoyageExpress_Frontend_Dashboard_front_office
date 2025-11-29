/**
 * Configuration centralisée de l'API
 * Permet de gérer facilement les URLs selon l'environnement
 */

export const API_CONFIG = {
  // URL de base de l'API backend
  BASE_URL: 'http://localhost:3001/api',
  
  // Endpoints principaux
  ENDPOINTS: {
    AUTH: '/auth',
    USERS: '/users',
    ETABLISSEMENTS: '/etablissements',
    LOCAUX: '/locaux',
    RESERVATIONS: '/reservations',
    COMPAGNIES: '/compagnies',
    VEHICULES: '/vehicules',
    ITINERAIRES: '/itineraires',
    BILLETS: '/billets',
    VEHICULE_ITINERAIRES: '/vehicule-itineraires'
  },
  
  // Configuration des requêtes HTTP
  HTTP_CONFIG: {
    TIMEOUT: 30000, // 30 secondes
    RETRY_ATTEMPTS: 3
  }
};

/**
 * Helper pour construire les URLs complètes
 */
export class ApiUrlBuilder {
  static build(endpoint: string): string {
    return `${API_CONFIG.BASE_URL}${endpoint}`;
  }
  
  static users(): string {
    return this.build(API_CONFIG.ENDPOINTS.USERS);
  }
  
  static auth(): string {
    return this.build(API_CONFIG.ENDPOINTS.AUTH);
  }
  
  static etablissements(): string {
    return this.build(API_CONFIG.ENDPOINTS.ETABLISSEMENTS);
  }
  
  static locaux(): string {
    return this.build(API_CONFIG.ENDPOINTS.LOCAUX);
  }
  
  static reservations(): string {
    return this.build(API_CONFIG.ENDPOINTS.RESERVATIONS);
  }
  
  static compagnies(): string {
    return this.build(API_CONFIG.ENDPOINTS.COMPAGNIES);
  }
  
  static vehicules(): string {
    return this.build(API_CONFIG.ENDPOINTS.VEHICULES);
  }
  
  static itineraires(): string {
    return this.build(API_CONFIG.ENDPOINTS.ITINERAIRES);
  }
  
  static billets(): string {
    return this.build(API_CONFIG.ENDPOINTS.BILLETS);
  }
}
