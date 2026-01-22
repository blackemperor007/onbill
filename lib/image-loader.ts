// lib/image-loader.ts
/**
 * Charge une image depuis le système de fichiers local (public/uploads/)
 * Pour jsPDF, on doit convertir l'image en base64 ou Data URL
 */

export async function loadImage(url: string): Promise<string> {
  try {
    // Si c'est déjà une Data URL (base64), on la retourne directement
    if (url.startsWith('data:image/')) {
      return url;
    }

    // Si c'est une URL absolue (commençant par http:// ou https://)
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return await loadImageFromUrl(url);
    }

    // Si c'est une URL relative (commençant par /uploads/)
    if (url.startsWith('/uploads/') || url.startsWith('/public/uploads/')) {
      return await loadImageFromPublicFolder(url);
    }

    // Si c'est juste un nom de fichier ou un chemin relatif
    return await loadImageFromPublicFolder(`/uploads/${url}`);
    
  } catch (error) {
    console.error('Erreur lors du chargement de l\'image:', error);
    // Retourne une image placeholder en cas d'erreur
    return getPlaceholderImage();
  }
}

/**
 * Charge une image depuis une URL distante
 */
async function loadImageFromUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    return await convertBlobToDataURL(blob);
  } catch (error) {
    console.error('Erreur chargement URL:', error);
    return getPlaceholderImage();
  }
}

/**
 * Charge une image depuis le dossier public/uploads/
 * NOTE: Cette fonction fonctionne côté serveur dans Next.js API routes
 */
async function loadImageFromPublicFolder(imagePath: string): Promise<string> {
  try {
    // Nettoyer le chemin (enlever /public/ s'il est présent)
    let cleanPath = imagePath.startsWith('/public/') 
      ? imagePath.substring('/public'.length)
      : imagePath;
    
    // S'assurer que le chemin commence par /
    if (!cleanPath.startsWith('/')) {
      cleanPath = '/' + cleanPath;
    }

    // Chemin absolu vers le fichier
    // Note: En développement Next.js, public/ est à la racine
    // En production, ajustez selon votre déploiement
    const fs = await import('fs/promises');
    const path = await import('path');
    
    // Déterminer le chemin selon l'environnement
    const projectRoot = process.cwd();
    const publicDir = path.join(projectRoot, 'public');
    const fullPath = path.join(publicDir, cleanPath);
    
    // Vérifier si le fichier existe
    try {
      await fs.access(fullPath);
    } catch {
      console.warn(`Fichier non trouvé: ${fullPath}`);
      return getPlaceholderImage();
    }
    
    // Lire le fichier
    const imageBuffer = await fs.readFile(fullPath);
    
    // Déterminer le type MIME à partir de l'extension
    const extension = path.extname(cleanPath).toLowerCase();
    const mimeType = getMimeTypeFromExtension(extension);
    
    // Convertir en base64
    const base64 = imageBuffer.toString('base64');
    return `data:${mimeType};base64,${base64}`;
    
  } catch (error) {
    console.error('Erreur chargement fichier local:', error);
    return getPlaceholderImage();
  }
}

/**
 * Convertit un Blob en Data URL
 */
async function convertBlobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Échec de la conversion en Data URL'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Retourne le type MIME selon l'extension du fichier
 */
function getMimeTypeFromExtension(extension: string): string {
  const mimeTypes: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.bmp': 'image/bmp',
    '.ico': 'image/x-icon',
  };
  
  return mimeTypes[extension] || 'image/jpeg';
}

/**
 * Retourne une image placeholder en base64 (logo par défaut)
 */
function getPlaceholderImage(): string {
  // Une image SVG simple de logo d'entreprise (format base64)
  return 'data:image/svg+xml;base64,' + btoa(`
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 40">
      <rect width="100" height="40" fill="#3b82f6" rx="5"/>
      <text x="50" y="24" font-family="Arial, sans-serif" font-size="14" 
            font-weight="bold" fill="white" text-anchor="middle">
        ${process.env.NEXT_PUBLIC_APP_NAME || 'FACTURATION'}
      </text>
    </svg>
  `);
}

/**
 * Version alternative pour les environnements où fs n'est pas disponible
 * (comme les Edge Functions)
 */
export async function loadImageSafe(url: string): Promise<string> {
  try {
    // Pour les Edge Functions ou environnements sans fs
    if (typeof window !== 'undefined' || 
        process.env.NEXT_RUNTIME === 'edge' ||
        process.env.VERCEL) {
      
      // Si on est côté client ou dans une Edge Function
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return await loadImageFromUrl(url);
      }
      
      // Pour les URLs relatives, on les transforme en URLs absolues
      if (url.startsWith('/uploads/')) {
        const baseUrl = process.env.NEXTAUTH_URL || 
                       process.env.VERCEL_URL || 
                       'http://localhost:3000';
        const absoluteUrl = `${baseUrl}${url}`;
        return await loadImageFromUrl(absoluteUrl);
      }
      
      return getPlaceholderImage();
    }
    
    // Sinon, utiliser la méthode normale
    return await loadImage(url);
    
  } catch (error) {
    console.error('Erreur loadImageSafe:', error);
    return getPlaceholderImage();
  }
}

/**
 * Fonction utilitaire pour valider si une URL pointe vers un fichier image valide
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    if (!url) return false;
    
    // Si c'est une Data URL
    if (url.startsWith('data:image/')) {
      return true;
    }
    
    // Pour les URLs web
    if (url.startsWith('http')) {
      const response = await fetch(url, { method: 'HEAD' });
      const contentType = response.headers.get('content-type');
      return contentType?.startsWith('image/') || false;
    }
    
    // Pour les fichiers locaux (côté serveur seulement)
    if (typeof window === 'undefined') {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      const projectRoot = process.cwd();
      const publicDir = path.join(projectRoot, 'public');
      
      // Nettoyer le chemin
      let cleanPath = url.startsWith('/public/') 
        ? url.substring('/public'.length)
        : url;
      
      if (!cleanPath.startsWith('/')) {
        cleanPath = '/' + cleanPath;
      }
      
      const fullPath = path.join(publicDir, cleanPath);
      
      try {
        await fs.access(fullPath);
        const stats = await fs.stat(fullPath);
        return stats.isFile();
      } catch {
        return false;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Erreur validation image:', error);
    return false;
  }
}