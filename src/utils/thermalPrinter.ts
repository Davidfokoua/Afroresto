/**
 * Thermal Printer Utilities for RESTOCAM
 * Handles direct printing for 58mm and 80mm thermal receipt & sticker printers.
 */

export interface PrintableThermalItem {
  tableNumber: string | number;
  tableName: string;
  areaName?: string;
  restaurantName: string;
  restaurantCity: string;
  qrDataUrl: string;
  callToAction: string;
  tableUrl?: string;
  id?: string;
}

export interface ThermalPrintOptions {
  format: '58mm' | '80mm' | 'square50' | 'round50';
  showArea?: boolean;
  showInstructions?: boolean;
  customCta?: string;
}

/**
 * Generate full standalone HTML for thermal sticker printing
 */
export function generateThermalStickersHtml(
  items: PrintableThermalItem[],
  options: ThermalPrintOptions
): string {
  const is58 = options.format === '58mm';
  const widthMm = is58 ? '48mm' : '72mm';
  const qrSizePx = is58 ? '160px' : '220px';

  const itemsHtml = items.map((item) => {
    return `
      <div class="thermal-item">
        <div class="header">
          <div class="resto-name">${escapeHtml(item.restaurantName.toUpperCase())}</div>
          <div class="resto-city">${escapeHtml(item.restaurantCity.toUpperCase())}</div>
        </div>

        <div class="table-section">
          ${options.showArea !== false && item.areaName ? `<div class="area-name">ZONE : ${escapeHtml(item.areaName.toUpperCase())}</div>` : ''}
          <div class="table-name">${escapeHtml(item.tableName.toUpperCase())}</div>
        </div>

        <div class="qr-container">
          <img src="${item.qrDataUrl}" alt="QR ${escapeHtml(item.tableName)}" class="qr-code" />
        </div>

        ${options.showInstructions !== false ? `
          <div class="instructions">
            <div class="cta-text">${escapeHtml(item.callToAction || options.customCta || 'SCANNEZ POUR COMMANDER')}</div>
            <div class="sub-cta">MENU DIGITAL SANS CONTACT</div>
          </div>
        ` : ''}

        <div class="footer">
          <span>AFRORESTO</span>
          <span>table/${escapeHtml(String(item.id || item.tableNumber).slice(0, 8))}</span>
        </div>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8" />
      <title>Impression Autocollants Thermiques - AFRORESTO</title>
      <style>
        @page {
          margin: 0;
          size: ${is58 ? '58mm auto' : '80mm auto'};
        }
        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        html, body {
          background: #ffffff;
          color: #000000;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, monospace, sans-serif;
          width: 100%;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .thermal-item {
          width: ${widthMm};
          max-width: ${widthMm};
          margin: 0 auto;
          padding: 10px 4px;
          text-align: center;
          page-break-after: always;
          break-after: page;
          box-sizing: border-box;
        }
        .header {
          margin-bottom: 4px;
        }
        .resto-name {
          font-size: 13px;
          font-weight: 900;
          line-height: 1.1;
          letter-spacing: -0.3px;
          text-transform: uppercase;
        }
        .resto-city {
          font-size: 8.5px;
          font-weight: 700;
          margin-top: 1px;
          color: #111;
        }
        .table-section {
          margin: 6px 0;
        }
        .area-name {
          font-size: 8.5px;
          font-weight: 800;
          letter-spacing: 0.5px;
        }
        .table-name {
          font-size: 22px;
          font-weight: 900;
          line-height: 1.05;
          letter-spacing: -0.5px;
          margin-top: 1px;
        }
        .qr-container {
          margin: 6px auto;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .qr-code {
          width: ${qrSizePx};
          height: ${qrSizePx};
          display: block;
          margin: 0 auto;
          image-rendering: pixelated;
        }
        .instructions {
          margin-top: 5px;
        }
        .cta-text {
          font-size: 11px;
          font-weight: 900;
          letter-spacing: -0.2px;
          line-height: 1.1;
        }
        .sub-cta {
          font-size: 8.5px;
          font-weight: 600;
          margin-top: 2px;
        }
        .footer {
          margin-top: 8px;
          padding-top: 4px;
          border-top: 1px dashed #000000;
          font-size: 8px;
          font-family: monospace;
          display: flex;
          justify-content: space-between;
          color: #333;
        }
        @media screen {
          body {
            background: #f1f5f9;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
          }
          .thermal-item {
            background: #ffffff;
            border: 1px solid #cbd5e1;
            box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            border-radius: 8px;
          }
          .print-bar {
            position: sticky;
            top: 10px;
            background: #0f172a;
            color: #ffffff;
            padding: 12px 24px;
            border-radius: 12px;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 16px;
            z-index: 100;
          }
          .print-btn {
            background: #059669;
            color: white;
            border: none;
            padding: 8px 18px;
            font-weight: 800;
            border-radius: 8px;
            cursor: pointer;
            font-size: 14px;
          }
          .print-btn:hover {
            background: #10b981;
          }
        }
      </style>
    </head>
    <body>
      <div class="print-bar no-print" style="display: none;">
        <span>AFRORESTO — ${items.length} Étiquette(s)</span>
        <button class="print-btn" onclick="window.print()">Imprimer Maintenant</button>
      </div>
      ${itemsHtml}
      <script>
        window.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => {
            window.print();
          }, 350);
        });
      </script>
    </body>
    </html>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Robust print function:
 * 1. Tries hidden iframe printing (fastest, keeps user on page)
 * 2. If blocked or fails (iframe sandbox restriction), opens a standalone printable tab / Blob URL
 * 3. Falls back to window.print()
 */
export async function printThermalStickersDirectly(
  items: PrintableThermalItem[],
  options: ThermalPrintOptions
): Promise<{ success: boolean; method: 'iframe' | 'window' | 'native'; error?: string }> {
  if (!items || items.length === 0) {
    return { success: false, method: 'native', error: 'Aucune table à imprimer' };
  }

  const htmlContent = generateThermalStickersHtml(items, options);

  // Method 1: Try creating an invisible print iframe
  try {
    const existingFrame = document.getElementById('restocam-thermal-print-frame');
    if (existingFrame) {
      existingFrame.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'restocam-thermal-print-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '10px';
    iframe.style.height = '10px';
    iframe.style.opacity = '0.01';
    iframe.style.pointerEvents = 'none';
    iframe.style.border = 'none';
    iframe.style.zIndex = '-999';

    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      // Wait for images inside iframe to be ready before calling print
      await new Promise((resolve) => setTimeout(resolve, 300));

      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();

        // Clean up after 60s
        setTimeout(() => {
          try {
            iframe.remove();
          } catch {
            // Ignore
          }
        }, 60000);

        return { success: true, method: 'iframe' };
      }
    }
  } catch (err) {
    console.warn('Iframe print failed or was blocked by sandbox:', err);
  }

  // Method 2: Open standalone printable popup / blob if iframe failed
  try {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const printWindow = window.open(blobUrl, '_blank');
    if (printWindow) {
      return { success: true, method: 'window' };
    }
  } catch (err) {
    console.warn('Popup / Blob print failed:', err);
  }

  // Method 3: Direct window.print() fallback
  try {
    window.print();
    return { success: true, method: 'native' };
  } catch (err) {
    console.error('All print methods failed:', err);
    return { success: false, method: 'native', error: String(err) };
  }
}

import { Order, Restaurant, ThermalWidth, TicketType } from '../types';
import { formatFCFA, formatDateTime, formatTime } from './formatters';

export interface OrderThermalPrintOptions {
  ticketType: 'receipt' | 'kitchen' | 'both';
  format: '58mm' | '80mm';
  showLogo?: boolean;
  showQrCode?: boolean;
  qrDataUrl?: string;
  customFooter?: string;
  customHeader?: string;
  wifiCode?: string;
  taxMention?: string;
  serverName?: string;
}

/**
 * Open printable thermal stickers in a clean standalone browser tab
 */
export function openThermalStickersInNewTab(
  items: PrintableThermalItem[],
  options: ThermalPrintOptions
) {
  const htmlContent = generateThermalStickersHtml(items, options);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank');
}

/**
 * Generate HTML snippet for Customer Receipt (Addition / Ticket de caisse)
 */
export function generateCustomerReceiptThermalSnippet(
  order: Order,
  restaurant: Restaurant,
  options: OrderThermalPrintOptions
): string {
  const is58 = options.format === '58mm';
  const widthMm = is58 ? '48mm' : '72mm';
  const headerFontSize = is58 ? '13px' : '15px';
  const titleFontSize = is58 ? '15px' : '18px';
  const bodyFontSize = is58 ? '11px' : '12.5px';
  const subFontSize = is58 ? '9.5px' : '11px';

  const orderTypeLabel = order.orderType === 'delivery' 
    ? 'LIVRAISON A DOMICILE'
    : order.orderType === 'takeaway'
    ? 'A EMPORTER'
    : `SUR PLACE - ${order.tableName.toUpperCase()}`;

  const paymentMethodLabel = order.paymentMethod === 'orange_money'
    ? 'ORANGE MONEY'
    : order.paymentMethod === 'mtn_momo'
    ? 'MTN MOMO'
    : order.paymentMethod === 'card'
    ? 'CARTE BANCAIRE'
    : order.paymentMethod === 'cash'
    ? 'ESPECES'
    : 'EN ATTENTE';

  const isPaid = order.paymentStatus === 'paid';

  const itemsHtml = order.items.map(it => {
    const itemTotal = it.price * it.quantity;
    return `
      <div class="line-item">
        <div class="item-head">
          <span class="item-qty-name"><strong>${it.quantity}x</strong> ${escapeHtml(it.name)}</span>
          <span class="item-price">${formatFCFA(itemTotal)}</span>
        </div>
        ${it.notes ? `<div class="item-note">>> Note: ${escapeHtml(it.notes)}</div>` : ''}
        ${it.quantity > 1 ? `<div class="item-sub">${formatFCFA(it.price)} / unité</div>` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="thermal-receipt ${is58 ? 'w-58' : 'w-80'}">
      <!-- HEADER -->
      <div class="header-section">
        ${options.showLogo && restaurant.logo ? `<img src="${restaurant.logo}" alt="Logo" class="resto-logo" />` : ''}
        <div class="resto-title" style="font-size: ${titleFontSize};">${escapeHtml(restaurant.name.toUpperCase())}</div>
        ${restaurant.restaurantType ? `<div class="resto-type">${escapeHtml(restaurant.restaurantType)}</div>` : ''}
        ${options.customHeader ? `<div class="custom-header">${escapeHtml(options.customHeader)}</div>` : ''}
        <div class="resto-contact">
          ${restaurant.address ? `<div>${escapeHtml(restaurant.address)}, ${escapeHtml(restaurant.city)}</div>` : ''}
          ${restaurant.phone ? `<div>Tel: ${escapeHtml(restaurant.phone)}</div>` : ''}
        </div>
      </div>

      <div class="divider">================================</div>

      <!-- TICKET DETAILS -->
      <div class="meta-section" style="font-size: ${subFontSize};">
        <div class="row">
          <span>TICKET : <strong>#${escapeHtml(order.orderNumber)}</strong></span>
          <span>${formatTime(order.createdAt)}</span>
        </div>
        <div class="row">
          <span>DATE : ${formatDateTime(order.createdAt).slice(0, 10)}</span>
          <span>ESPACE : ${escapeHtml(order.areaName || 'Principal')}</span>
        </div>
        <div class="badge-type">
          <strong>${orderTypeLabel}</strong>
        </div>
        ${order.customerName ? `
          <div class="row customer-row">
            <span>CLIENT : <strong>${escapeHtml(order.customerName)}</strong></span>
            ${order.customerPhone ? `<span>${escapeHtml(order.customerPhone)}</span>` : ''}
          </div>
        ` : ''}
        ${order.deliveryInfo?.address ? `
          <div class="delivery-address">
            DESTINATION: ${escapeHtml(order.deliveryInfo.address)}
            ${order.deliveryInfo.neighborhood ? ` (${escapeHtml(order.deliveryInfo.neighborhood)})` : ''}
          </div>
        ` : ''}
        ${options.serverName || order.serverName ? `
          <div class="row">
            <span>SERVI PAR : ${escapeHtml(options.serverName || order.serverName || '')}</span>
          </div>
        ` : ''}
      </div>

      <div class="divider">--------------------------------</div>

      <!-- ARTICLES -->
      <div class="items-header">
        <span>ARTICLE</span>
        <span>TOTAL</span>
      </div>
      <div class="divider-dotted">- - - - - - - - - - - - - - - -</div>

      <div class="items-section">
        ${itemsHtml}
      </div>

      <div class="divider">--------------------------------</div>

      <!-- TOTALS -->
      <div class="totals-section">
        ${order.deliveryInfo?.deliveryFee ? `
          <div class="row">
            <span>Sous-total articles :</span>
            <span>${formatFCFA(order.totalAmount - order.deliveryInfo.deliveryFee)}</span>
          </div>
          <div class="row">
            <span>Frais de livraison :</span>
            <span>${formatFCFA(order.deliveryInfo.deliveryFee)}</span>
          </div>
        ` : ''}
        <div class="grand-total">
          <span>TOTAL A PAYER :</span>
          <span>${formatFCFA(order.totalAmount)}</span>
        </div>
      </div>

      <div class="divider-dotted">- - - - - - - - - - - - - - - -</div>

      <!-- PAYMENT STATUS -->
      <div class="payment-section">
        <div class="row">
          <span>MODE DE REGLEMENT :</span>
          <strong>${paymentMethodLabel}</strong>
        </div>
        <div class="row status-row">
          <span>STATUT DU PAIEMENT :</span>
          <span class="payment-badge ${isPaid ? 'paid' : 'unpaid'}">
            ${isPaid ? '[ PAYE - ENCAISSE ]' : '[ A REGLER ]'}
          </span>
        </div>
        ${options.taxMention ? `<div class="tax-mention">${escapeHtml(options.taxMention)}</div>` : ''}
      </div>

      <!-- QR CODE (OPTIONAL) -->
      ${options.showQrCode && options.qrDataUrl ? `
        <div class="qr-receipt-block">
          <img src="${options.qrDataUrl}" alt="QR" class="qr-code-img" />
          <div class="qr-caption">Scannez pour menu digital & fidélité</div>
        </div>
      ` : ''}

      <!-- FOOTER -->
      <div class="divider">================================</div>
      <div class="footer-section">
        <div class="greeting">${escapeHtml(options.customFooter || 'MERCI DE VOTRE VISITE ! A BIENTOT.')}</div>
        ${options.wifiCode ? `<div class="wifi-box">${escapeHtml(options.wifiCode)}</div>` : ''}
        <div class="software-sign">Logiciel de caisse AFRORESTO POS</div>
      </div>
      <div class="cut-line">✂ - - - - - - - - - - - - - - - -</div>
    </div>
  `;
}

/**
 * Generate HTML snippet for Kitchen Order Ticket (Bon de Cuisine / KOT)
 */
export function generateKitchenTicketThermalSnippet(
  order: Order,
  restaurant: Restaurant,
  options: OrderThermalPrintOptions
): string {
  const is58 = options.format === '58mm';
  const headerFontSize = is58 ? '14px' : '17px';
  const tableFontSize = is58 ? '20px' : '26px';
  const itemFontSize = is58 ? '13px' : '15px';

  const orderTypeLabel = order.orderType === 'delivery' 
    ? '🛵 LIVRAISON'
    : order.orderType === 'takeaway'
    ? '🛍️ A EMPORTER'
    : `🍽️ TABLE ${order.tableName.toUpperCase()}`;

  const itemsHtml = order.items.map(it => {
    return `
      <div class="kot-item">
        <div class="kot-item-main">
          <span class="kot-check">[ ]</span>
          <span class="kot-qty"><strong>${it.quantity}x</strong></span>
          <span class="kot-name"><strong>${escapeHtml(it.name.toUpperCase())}</strong></span>
        </div>
        ${it.notes ? `
          <div class="kot-note">
            >>> NOTE : <strong>${escapeHtml(it.notes)}</strong>
          </div>
        ` : ''}
      </div>
    `;
  }).join('');

  return `
    <div class="thermal-receipt kot-ticket ${is58 ? 'w-58' : 'w-80'}">
      <!-- KOT HEADER -->
      <div class="kot-header">
        <div class="kot-badge">*** BON DE CUISINE (KOT) ***</div>
        <div class="kot-order-num">CMD #${escapeHtml(order.orderNumber)}</div>
        <div class="kot-table" style="font-size: ${tableFontSize};">${orderTypeLabel}</div>
        <div class="kot-meta">
          <div>HEURE : <strong>${formatTime(order.createdAt)}</strong> (${formatDateTime(order.createdAt).slice(0, 10)})</div>
          <div>ESPACE : ${escapeHtml(order.areaName || 'Salle')}</div>
          ${order.customerName ? `<div>CLIENT : ${escapeHtml(order.customerName)}</div>` : ''}
          ${order.serverName ? `<div>SERVEUR : ${escapeHtml(order.serverName)}</div>` : ''}
        </div>
      </div>

      <div class="divider">================================</div>

      <!-- KOT ITEMS -->
      <div class="kot-title">ARTICLES A PREPARER :</div>
      <div class="divider-dotted">- - - - - - - - - - - - - - - -</div>

      <div class="kot-items-list" style="font-size: ${itemFontSize};">
        ${itemsHtml}
      </div>

      <div class="divider">================================</div>

      <!-- KOT FOOTER -->
      <div class="kot-footer">
        <div>TOTAL PLATS : <strong>${order.items.reduce((s, i) => s + i.quantity, 0)}</strong></div>
        <div class="kot-time-stamp">Impression KDS : ${new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
      </div>
      <div class="cut-line">✂ - - - - - - - - - - - - - - - -</div>
    </div>
  `;
}

/**
 * Generate full standalone HTML document for thermal receipt printing
 */
export function generateOrderThermalDocumentHtml(
  order: Order,
  restaurant: Restaurant,
  options: OrderThermalPrintOptions
): string {
  const is58 = options.format === '58mm';
  const widthMm = is58 ? '48mm' : '72mm';

  let contentHtml = '';
  if (options.ticketType === 'both') {
    contentHtml = `
      ${generateCustomerReceiptThermalSnippet(order, restaurant, options)}
      <div style="page-break-after: always; break-after: page; height: 16px;"></div>
      ${generateKitchenTicketThermalSnippet(order, restaurant, options)}
    `;
  } else if (options.ticketType === 'kitchen') {
    contentHtml = generateKitchenTicketThermalSnippet(order, restaurant, options);
  } else {
    contentHtml = generateCustomerReceiptThermalSnippet(order, restaurant, options);
  }

  return `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="utf-8" />
      <title>Ticket #${escapeHtml(order.orderNumber)} - ${escapeHtml(restaurant.name)}</title>
      <style>
        @page {
          margin: 0;
          size: ${is58 ? '58mm auto' : '80mm auto'};
        }
        *, *::before, *::after {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        html, body {
          background: #ffffff;
          color: #000000;
          font-family: 'Courier New', Courier, Lucida Console, Monaco, monospace, sans-serif;
          width: 100%;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .thermal-receipt {
          width: ${widthMm};
          max-width: ${widthMm};
          margin: 0 auto;
          padding: 8px 3px;
          color: #000000;
          line-height: 1.25;
          page-break-inside: avoid;
        }
        .header-section {
          text-align: center;
          margin-bottom: 4px;
        }
        .resto-logo {
          max-height: 48px;
          max-width: 120px;
          display: block;
          margin: 0 auto 4px auto;
          filter: grayscale(100%) contrast(150%);
        }
        .resto-title {
          font-weight: 900;
          letter-spacing: -0.3px;
        }
        .resto-type {
          font-size: 10px;
          font-weight: bold;
          text-transform: uppercase;
        }
        .custom-header {
          font-size: 9px;
          margin-top: 2px;
        }
        .resto-contact {
          font-size: 9.5px;
          margin-top: 2px;
        }
        .divider {
          font-weight: bold;
          letter-spacing: -1.5px;
          text-align: center;
          margin: 3px 0;
          overflow: hidden;
          white-space: nowrap;
          font-size: 11px;
        }
        .divider-dotted {
          font-weight: normal;
          letter-spacing: -1px;
          text-align: center;
          margin: 2px 0;
          overflow: hidden;
          white-space: nowrap;
          font-size: 10px;
        }
        .meta-section {
          margin: 4px 0;
        }
        .row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          gap: 4px;
        }
        .badge-type {
          background: #000000;
          color: #ffffff;
          padding: 2px 4px;
          margin: 3px 0;
          text-align: center;
          font-size: 11px;
          font-weight: 900;
          border-radius: 2px;
        }
        .customer-row {
          font-size: 10px;
          margin-top: 2px;
        }
        .delivery-address {
          font-size: 9.5px;
          font-weight: bold;
          background: #f0f0f0;
          padding: 2px;
          margin-top: 2px;
        }
        .items-header {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          font-weight: bold;
        }
        .items-section {
          margin: 3px 0;
        }
        .line-item {
          margin-bottom: 4px;
        }
        .item-head {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          font-size: 11px;
        }
        .item-qty-name {
          word-break: break-word;
          max-width: 72%;
        }
        .item-price {
          font-weight: bold;
          white-space: nowrap;
        }
        .item-note {
          font-size: 9.5px;
          font-weight: bold;
          padding-left: 8px;
          margin-top: 1px;
        }
        .item-sub {
          font-size: 8.5px;
          color: #333;
          padding-left: 8px;
        }
        .totals-section {
          margin: 4px 0;
          font-size: 11px;
        }
        .grand-total {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          font-weight: 900;
          margin-top: 3px;
          padding-top: 2px;
          border-top: 1px solid #000;
        }
        .payment-section {
          font-size: 10px;
          margin: 3px 0;
        }
        .payment-badge {
          font-weight: 900;
        }
        .tax-mention {
          font-size: 8.5px;
          text-align: center;
          margin-top: 3px;
        }
        .qr-receipt-block {
          text-align: center;
          margin: 6px auto;
        }
        .qr-code-img {
          width: 90px;
          height: 90px;
          display: block;
          margin: 0 auto;
        }
        .qr-caption {
          font-size: 8px;
          margin-top: 2px;
        }
        .footer-section {
          text-align: center;
          font-size: 9.5px;
          margin-top: 4px;
        }
        .greeting {
          font-weight: bold;
          font-size: 10px;
        }
        .wifi-box {
          border: 1px dashed #000;
          padding: 2px 4px;
          margin: 4px auto;
          display: inline-block;
          font-size: 9px;
          font-weight: bold;
        }
        .software-sign {
          font-size: 8px;
          margin-top: 3px;
          color: #444;
        }
        .cut-line {
          text-align: center;
          font-size: 9px;
          letter-spacing: 1px;
          margin-top: 8px;
          color: #666;
        }

        /* KOT Specifics */
        .kot-ticket {
          font-weight: bold;
        }
        .kot-badge {
          background: #000000;
          color: #ffffff;
          padding: 3px;
          text-align: center;
          font-size: 12px;
          font-weight: 900;
        }
        .kot-order-num {
          font-size: 14px;
          text-align: center;
          font-weight: 900;
          margin-top: 3px;
        }
        .kot-table {
          text-align: center;
          font-weight: 900;
          margin: 4px 0;
          letter-spacing: -0.5px;
        }
        .kot-meta {
          font-size: 10px;
          margin: 4px 0;
        }
        .kot-title {
          font-size: 11px;
          font-weight: 900;
          margin: 3px 0;
        }
        .kot-items-list {
          margin: 4px 0;
        }
        .kot-item {
          margin-bottom: 6px;
          padding-bottom: 4px;
          border-bottom: 1px dashed #bbb;
        }
        .kot-item-main {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }
        .kot-check {
          font-family: monospace;
          font-size: 13px;
        }
        .kot-qty {
          font-size: 15px;
          font-weight: 900;
          min-width: 24px;
        }
        .kot-name {
          word-break: break-word;
        }
        .kot-note {
          background: #000;
          color: #fff;
          padding: 2px 4px;
          margin-top: 2px;
          margin-left: 20px;
          font-size: 11px;
          border-radius: 2px;
        }
        .kot-footer {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          margin-top: 4px;
        }
        .kot-time-stamp {
          font-size: 8.5px;
        }

        @media screen {
          body {
            background: #f1f5f9;
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
          }
          .thermal-receipt {
            background: #ffffff;
            border: 1px solid #cbd5e1;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            padding: 16px 12px;
            border-radius: 6px;
          }
          .print-bar {
            position: sticky;
            top: 10px;
            background: #0f172a;
            color: #ffffff;
            padding: 10px 20px;
            border-radius: 12px;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3);
            display: flex;
            align-items: center;
            gap: 16px;
            z-index: 100;
          }
          .print-btn {
            background: #059669;
            color: white;
            border: none;
            padding: 8px 18px;
            font-weight: 800;
            border-radius: 8px;
            cursor: pointer;
            font-size: 13px;
          }
        }
      </style>
    </head>
    <body>
      <div class="print-bar no-print" style="display: none;">
        <span>Ticket #${escapeHtml(order.orderNumber)} (${options.format})</span>
        <button class="print-btn" onclick="window.print()">Imprimer Maintenant</button>
      </div>
      ${contentHtml}
      <script>
        window.addEventListener('DOMContentLoaded', () => {
          setTimeout(() => {
            window.print();
          }, 300);
        });
      </script>
    </body>
    </html>
  `;
}

/**
 * Print order thermal receipt directly using hidden iframe, blob or window
 */
export async function printOrderThermalDirectly(
  order: Order,
  restaurant: Restaurant,
  options: OrderThermalPrintOptions
): Promise<{ success: boolean; method: string; error?: string }> {
  const htmlContent = generateOrderThermalDocumentHtml(order, restaurant, options);

  // Method 1: Invisible iframe
  try {
    const existingFrame = document.getElementById('restocam-thermal-order-frame');
    if (existingFrame) {
      existingFrame.remove();
    }

    const iframe = document.createElement('iframe');
    iframe.id = 'restocam-thermal-order-frame';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '10px';
    iframe.style.height = '10px';
    iframe.style.opacity = '0.01';
    iframe.style.pointerEvents = 'none';
    iframe.style.border = 'none';
    iframe.style.zIndex = '-999';

    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(htmlContent);
      doc.close();

      await new Promise((resolve) => setTimeout(resolve, 300));

      if (iframe.contentWindow) {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();

        setTimeout(() => {
          try {
            iframe.remove();
          } catch {
            // Ignore
          }
        }, 60000);

        return { success: true, method: 'iframe' };
      }
    }
  } catch (err) {
    console.warn('Thermal iframe print error:', err);
  }

  // Method 2: Standalone Blob window
  try {
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const printWindow = window.open(blobUrl, '_blank');
    if (printWindow) {
      return { success: true, method: 'window' };
    }
  } catch (err) {
    console.warn('Popup / Blob print failed:', err);
  }

  // Method 3: Fallback
  try {
    window.print();
    return { success: true, method: 'native' };
  } catch (err) {
    return { success: false, method: 'native', error: String(err) };
  }
}

/**
 * Open thermal order in new browser tab
 */
export function openOrderThermalInNewTab(
  order: Order,
  restaurant: Restaurant,
  options: OrderThermalPrintOptions
) {
  const htmlContent = generateOrderThermalDocumentHtml(order, restaurant, options);
  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const blobUrl = URL.createObjectURL(blob);
  window.open(blobUrl, '_blank');
}

/**
 * Generate plain text receipt for WhatsApp, SMS or Bluetooth RawBT printers
 */
export function generateReceiptPlainText(
  order: Order,
  restaurant: Restaurant,
  options?: Partial<OrderThermalPrintOptions>
): string {
  const lineDivider = '================================';
  const dashDivider = '--------------------------------';
  const orderTypeStr = order.orderType === 'delivery'
    ? 'LIVRAISON A DOMICILE'
    : order.orderType === 'takeaway'
    ? 'A EMPORTER'
    : `SUR PLACE (${order.tableName})`;

  const itemsLines = order.items.map(it => {
    const total = formatFCFA(it.price * it.quantity);
    let l = `${it.quantity}x ${it.name} - ${total}`;
    if (it.notes) {
      l += `\n   Note: ${it.notes}`;
    }
    return l;
  }).join('\n');

  return [
    `🧾 ${restaurant.name.toUpperCase()}`,
    restaurant.address ? `${restaurant.address}, ${restaurant.city}` : '',
    restaurant.phone ? `Tél: ${restaurant.phone}` : '',
    lineDivider,
    `TICKET: #${order.orderNumber}`,
    `DATE: ${formatDateTime(order.createdAt)}`,
    `SERVICE: ${orderTypeStr}`,
    order.customerName ? `CLIENT: ${order.customerName}` : '',
    order.customerPhone ? `TEL: ${order.customerPhone}` : '',
    order.deliveryInfo?.address ? `ADRESSE: ${order.deliveryInfo.address}` : '',
    dashDivider,
    itemsLines,
    dashDivider,
    order.deliveryInfo?.deliveryFee ? `Frais livraison: ${formatFCFA(order.deliveryInfo.deliveryFee)}` : '',
    `TOTAL: ${formatFCFA(order.totalAmount)}`,
    `PAIEMENT: ${order.paymentMethod?.toUpperCase() || 'EN ATTENTE'} (${order.paymentStatus === 'paid' ? 'PAYE' : 'A REGLER'})`,
    lineDivider,
    options?.customFooter || 'Merci de votre visite et à très bientôt !',
    options?.wifiCode ? options.wifiCode : '',
    'Propulsé par AFRORESTO POS'
  ].filter(Boolean).join('\n');
}

/**
 * Generate plain text for Kitchen Ticket (KOT)
 */
export function generateKitchenPlainText(
  order: Order,
  restaurant: Restaurant
): string {
  const lineDivider = '================================';
  const dashDivider = '--------------------------------';
  const orderTypeStr = order.orderType === 'delivery'
    ? '🛵 LIVRAISON'
    : order.orderType === 'takeaway'
    ? '🛍️ A EMPORTER'
    : `🍽️ TABLE ${order.tableName.toUpperCase()}`;

  const itemsLines = order.items.map(it => {
    let l = `[ ] ${it.quantity}x ${it.name.toUpperCase()}`;
    if (it.notes) {
      l += `\n    >>> NOTE: ${it.notes}`;
    }
    return l;
  }).join('\n');

  return [
    '🔥 BON DE CUISINE (KOT)',
    lineDivider,
    `COMMANDE #${order.orderNumber}`,
    orderTypeStr,
    `HEURE: ${formatTime(order.createdAt)}`,
    `ESPACE: ${order.areaName || 'Principal'}`,
    order.serverName ? `SERVEUR: ${order.serverName}` : '',
    dashDivider,
    'ARTICLES A PREPARER :',
    itemsLines,
    lineDivider,
    `TOTAL PLATS: ${order.items.reduce((s, i) => s + i.quantity, 0)}`,
  ].filter(Boolean).join('\n');
}

/**
 * Share ticket via WhatsApp
 */
export function shareReceiptViaWhatsApp(
  order: Order,
  restaurant: Restaurant,
  phoneTarget?: string
) {
  const text = generateReceiptPlainText(order, restaurant);
  const target = phoneTarget || order.customerPhone || '';
  const cleanPhone = target.replace(/[^0-9]/g, '');
  const encoded = encodeURIComponent(text);
  
  const url = cleanPhone 
    ? `https://wa.me/${cleanPhone}?text=${encoded}`
    : `https://api.whatsapp.com/send?text=${encoded}`;

  window.open(url, '_blank');
}
