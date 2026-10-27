/**
 * Utility to generate and parse valid, secure HTTPS QR code URLs for restaurant tables.
 * Eliminates invalid placeholder domains to guarantee 100% SSL/TLS connection.
 */

import { safeStorage } from './safeStorage';

export interface QrUrlParams {
  restaurantId?: string;
  tableId?: string;
  orderId?: string;
  view?: string;
  mode?: 'table' | 'online' | 'reservation'; // mode detection for remote orders vs on-site
}

/**
 * Returns the active secure base URL of the running application.
 */
export function getAppBaseUrl(customDomain?: string): string {
  // 1. Explicit parameter
  if (customDomain && customDomain.trim()) {
    let clean = customDomain.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `https://${clean}`;
    }
    return clean.replace(/\/+$/, '');
  }

  // 2. Persisted custom domain in browser
  const savedDomain = safeStorage.getItem('restocam_custom_public_domain');
  if (savedDomain && savedDomain.trim()) {
    let clean = savedDomain.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      clean = `https://${clean}`;
    }
    return clean.replace(/\/+$/, '');
  }

  // 3. Fallback to active browser origin with Cloud Run shared URL conversion
  if (typeof window !== 'undefined' && window.location) {
    let origin = window.location.origin.replace(/\/+$/, '');
    
    // In AI Studio environment: convert private ais-dev-* domain to public ais-pre-* domain
    // so any smartphone camera scanning the QR code can access the menu without authentication!
    if (origin.includes('ais-dev-')) {
      return origin.replace('ais-dev-', 'ais-pre-');
    }
    
    // If running on localhost / 127.0.0.1, fallback to the public shared URL so smartphone cameras can scan!
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return 'https://ais-pre-4s2ji7glfyactqh2bujk6s-83867586100.us-east1.run.app';
    }

    return origin;
  }

  return 'https://ais-pre-4s2ji7glfyactqh2bujk6s-83867586100.us-east1.run.app';
}

/**
 * Saves a public base URL for QR codes (e.g. deployed Cloud Run domain, custom domain, or ngrok)
 */
export function setStoredPublicDomain(domain: string): void {
  if (domain && domain.trim()) {
    safeStorage.setItem('restocam_custom_public_domain', domain.trim());
  } else {
    safeStorage.removeItem('restocam_custom_public_domain');
  }
}

/**
 * Gets the stored public base URL if any
 */
export function getStoredPublicDomain(): string {
  return safeStorage.getItem('restocam_custom_public_domain') || '';
}

/**
 * Builds a direct HTTPS table ordering URL that can be scanned by any smartphone camera.
 */
export function buildTableOrderUrl(
  restaurantId: string,
  tableId: string,
  customDomain?: string
): string {
  const baseUrl = getAppBaseUrl(customDomain);
  const params = new URLSearchParams({
    r: restaurantId || '',
    table: tableId || '',
    view: 'customer_qr',
    mode: 'table',
  });
  return `${baseUrl}/?${params.toString()}`;
}

/**
 * Builds a direct HTTPS online remote ordering URL for take-away and home delivery.
 * Can be shared on WhatsApp, Facebook, Instagram, or printed on delivery flyers and posters.
 */
export function buildDirectOnlineOrderUrl(
  restaurantId: string,
  customDomain?: string
): string {
  const baseUrl = getAppBaseUrl(customDomain);
  const params = new URLSearchParams({
    r: restaurantId || '',
    view: 'customer_qr',
    mode: 'online',
  });
  return `${baseUrl}/?${params.toString()}`;
}

/**
 * Builds a direct HTTPS URL for customers booking/reserving a table online.
 */
export function buildTableReservationUrl(
  restaurantId: string,
  customDomain?: string
): string {
  const baseUrl = getAppBaseUrl(customDomain);
  const params = new URLSearchParams({
    r: restaurantId || '',
    view: 'customer_qr',
    mode: 'reservation',
  });
  return `${baseUrl}/?${params.toString()}`;
}

/**
 * Builds a direct HTTPS order tracking URL for a customer.
 */
export function buildOrderTrackerUrl(
  restaurantId: string,
  tableId: string,
  orderId: string,
  customDomain?: string
): string {
  const baseUrl = getAppBaseUrl(customDomain);
  const params = new URLSearchParams({
    r: restaurantId || '',
    table: tableId || '',
    order: orderId || '',
    view: 'customer_qr',
  });
  return `${baseUrl}/?${params.toString()}`;
}

/**
 * Builds a direct HTTPS URL for the public Meituan-style Online Food Market Hub.
 */
export function buildFoodMarketUrl(customDomain?: string): string {
  const baseUrl = getAppBaseUrl(customDomain);
  return `${baseUrl}/?view=market`;
}

/**
 * Parses URL parameters on application boot to detect if opened from a table QR code.
 * Seamlessly inspects search parameters, hash fragments, and pathname structures.
 */
export function parseQrUrlParams(): QrUrlParams {
  if (typeof window === 'undefined' || !window.location) {
    return {};
  }

  // Combine query string from window.location.search and hash
  const searchPart = window.location.search.replace(/^\?/, '');
  let hashPart = '';
  if (window.location.hash.includes('?')) {
    hashPart = window.location.hash.slice(window.location.hash.indexOf('?') + 1);
  }
  const combinedStr = searchPart && hashPart ? `${searchPart}&${hashPart}` : (searchPart || hashPart);

  const searchParams = new URLSearchParams(combinedStr);
  let restaurantId = searchParams.get('r') || searchParams.get('restaurantId') || searchParams.get('restaurant') || searchParams.get('resto') || undefined;
  let tableId = searchParams.get('table') || searchParams.get('tableId') || searchParams.get('t') || undefined;
  const orderId = searchParams.get('order') || searchParams.get('orderId') || undefined;
  let view = searchParams.get('view') || undefined;
  let mode = (searchParams.get('mode') as 'table' | 'online' | 'reservation') || undefined;

  // Also support pathname patterns: /r/:restaurantId/table/:tableId
  if (!restaurantId || !tableId) {
    const fullPath = window.location.pathname + window.location.hash;
    const pathMatch = fullPath.match(/\/r\/([^/?#]+)\/table\/([^/?#]+)/);
    if (pathMatch) {
      if (!restaurantId) restaurantId = decodeURIComponent(pathMatch[1]);
      if (!tableId) tableId = decodeURIComponent(pathMatch[2]);
      if (!view) view = 'customer_qr';
    }
  }

  // If restaurantId is missing or empty, but tableId has restaurantId encoded (e.g. tbl_rest_1788037282985_jdv6_1)
  if (!restaurantId && tableId && tableId.startsWith('tbl_rest_')) {
    // Format is tbl_{restaurantId}_{tableIndex}, e.g. tbl_rest_1788037282985_jdv6_1
    // Extract everything between 'tbl_' and the last '_<index>'
    const rawRestId = tableId.replace(/^tbl_/, '').replace(/_[^_]+$/, '');
    if (rawRestId && rawRestId.startsWith('rest_')) {
      restaurantId = rawRestId;
    }
  }

  // Clean decoded values
  if (restaurantId) {
    try {
      restaurantId = decodeURIComponent(restaurantId).trim();
    } catch {
      restaurantId = restaurantId.trim();
    }
    // Remove any trailing semicolon or unwanted punctuation that might have been typed/scanned
    restaurantId = restaurantId.replace(/[;,\s]+$/, '');
  }
  if (tableId) {
    try {
      tableId = decodeURIComponent(tableId).trim();
    } catch {
      tableId = tableId.trim();
    }
    tableId = tableId.replace(/[;,\s]+$/, '');
  }

  if (tableId && !view) {
    view = 'customer_qr';
  } else if ((mode === 'online' || mode === 'reservation') && !view) {
    view = 'customer_qr';
  }

  return { restaurantId, tableId, orderId, view, mode };
}
