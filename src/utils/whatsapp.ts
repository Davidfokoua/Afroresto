/**
 * Utility functions for WhatsApp integrations with African phone numbers
 */

export function cleanAfricanPhone(phone: string): string {
  if (!phone) return '237653184307';
  // Strip all non-digit characters
  let digits = phone.replace(/\D/g, '');

  // If already prefixed with 00, remove leading zeros
  if (digits.startsWith('00')) {
    digits = digits.substring(2);
  }

  // If starts with common African country codes (+225, +221, +237, +234, +233, +243, +241, +229, +228, +254...)
  const knownPrefixes = ['225', '221', '237', '234', '233', '243', '241', '229', '228', '223', '224', '254', '250', '226'];
  for (const prefix of knownPrefixes) {
    if (digits.startsWith(prefix) && digits.length >= prefix.length + 7) {
      return digits;
    }
  }

  // If it's a 9-digit local number (e.g. 653184307 in Cameroon or Ivory Coast 07XXXXXXXX)
  if (digits.length === 9) {
    return `237${digits}`;
  }

  // If it's an 8-digit older local number
  if (digits.length === 8) {
    return `2376${digits}`;
  }

  return digits.length >= 8 ? digits : '237653184307';
}

// Backward compatible alias
export const cleanCameroonPhone = cleanAfricanPhone;

export function generateWhatsAppLink(phone: string, message: string): string {
  const cleanNumber = cleanAfricanPhone(phone);
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(message)}`;
}

export function getRestaurantManagerWhatsAppMessage(restaurantName: string, managerName?: string): string {
  const greeting = managerName ? `Bonjour M./Mme ${managerName}` : 'Bonjour cher partenaire';
  return `${greeting},\n\nJe vous contacte depuis l'administration de la plateforme AFRORESTO concernant votre restaurant *${restaurantName}*.\n\nComment pouvons-nous vous accompagner aujourd'hui ?`;
}

export function getStockAlertWhatsAppMessage(restaurantName: string, managerName: string, itemName: string, currentQty: number, minQty: number, unit: string): string {
  const greeting = managerName ? `Bonjour ${managerName}` : 'Bonjour';
  return `⚠️ *ALERTE STOCK AFRORESTO*\n\n${greeting}, nous constatons que l'article *${itemName}* de votre restaurant *${restaurantName}* est en stock critique :\n- Quantité actuelle : *${currentQty} ${unit}*\n- Seuil d'alerte : *${minQty} ${unit}*\n\nPensez à réapprovisionner auprès de votre fournisseur afin de garantir la disponibilité des plats sur votre menu QR Code.`;
}
