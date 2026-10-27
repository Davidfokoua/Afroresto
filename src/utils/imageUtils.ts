/**
 * Helper to compress and convert image files to optimized Base64 Data URLs
 * for lightning-fast performance, offline storage, and Firestore compatibility.
 */
export async function fileToOptimizedDataUrl(
  file: File,
  maxWidth = 800,
  maxHeight = 800,
  quality = 0.82
): Promise<{ dataUrl: string; sizeKb: number; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Le fichier sélectionné doit être une image (JPEG, PNG, WebP, etc.).'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Maintain aspect ratio
        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Impossible de traiter l\'image sur ce navigateur.'));
          return;
        }

        // Draw with smoothing for high fidelity
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const sizeKb = Math.round((dataUrl.length * 3) / 4 / 1024);

        resolve({
          dataUrl,
          sizeKb,
          width,
          height,
        });
      };

      img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'));
      img.src = event.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Erreur de lecture du fichier'));
    reader.readAsDataURL(file);
  });
}

export const DISH_PRESET_IMAGES = [
  {
    name: 'Poulet DG / Grillé',
    url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=600&auto=format&fit=crop&q=80',
    category: 'Plats Authentiques',
  },
  {
    name: 'Poisson Bar Braisé',
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
    category: 'Poissons & Grillades',
  },
  {
    name: 'Brochettes Suya / Soja',
    url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80',
    category: 'Grillades',
  },
  {
    name: 'Burger Gourmand & Frites',
    url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    category: 'Fast-Food & Snacks',
  },
  {
    name: 'Salade Fraîcheur / Entrée',
    url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80',
    category: 'Entrées',
  },
  {
    name: 'Jus de Foléré / Cocktail',
    url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
    category: 'Boissons',
  },
  {
    name: 'Dessert / Pâtisserie',
    url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=600&auto=format&fit=crop&q=80',
    category: 'Desserts',
  },
];
