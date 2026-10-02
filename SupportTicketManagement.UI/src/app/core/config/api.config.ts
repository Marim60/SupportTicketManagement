import { InjectionToken } from '@angular/core';

// Public configuration. Never put passwords or client secrets in frontend code.
export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL');
export const apiConfig = {
  baseUrl: 'http://localhost:5259'
} as const;
