/**
 * Utility functions for robust Firebase Firestore operations in RESTOCAM.
 * Automatically strips unsupported undefined values and ensures resilient persistence.
 */

/**
 * Recursively strips undefined keys and handles arrays/objects safely for Firestore.
 */
export function cleanFirestoreData<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => cleanFirestoreData(item)) as unknown as T;
  }

  if (typeof obj === 'object' && !(obj instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = cleanFirestoreData(value);
      }
    }
    return cleaned as T;
  }

  return obj;
}
