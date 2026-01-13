/**
 * Compresses an image file to a target size using canvas API
 * @param file - The image file to compress
 * @param targetSizeKB - Target file size in KB (default 200KB)
 * @param maxWidth - Maximum width (default 1920px)
 * @param maxHeight - Maximum height (default 1920px)
 * @returns Compressed file as Blob
 */
export async function compressImage(
  file: File,
  targetSizeKB: number = 200,
  maxWidth: number = 1920,
  maxHeight: number = 1920
): Promise<Blob> {
  // If file is already small enough, return as-is
  if (file.size <= targetSizeKB * 1024) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = async () => {
      try {
        const result = await compressToTargetSize(img, file, targetSizeKB, maxWidth, maxHeight);
        resolve(result);
      } catch (error) {
        reject(error);
      } finally {
        URL.revokeObjectURL(img.src);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };

    img.src = URL.createObjectURL(file);
  });
}

async function compressToTargetSize(
  img: HTMLImageElement,
  originalFile: File,
  targetSizeKB: number,
  maxWidth: number,
  maxHeight: number
): Promise<Blob> {
  const targetBytes = targetSizeKB * 1024;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Calculate initial dimensions
  let { width, height } = img;
  
  // First pass: resize to max dimensions
  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }
  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  // Determine if we need to preserve transparency
  const isPng = originalFile.type === 'image/png';
  
  // For very large files, start with more aggressive resize
  const fileSizeMB = originalFile.size / (1024 * 1024);
  if (fileSizeMB > 5) {
    const scaleFactor = Math.min(1, Math.sqrt(targetBytes / originalFile.size) * 2);
    width = Math.round(width * scaleFactor);
    height = Math.round(height * scaleFactor);
  }

  // Iteratively compress until we hit target size
  let quality = 0.9;
  let blob: Blob | null = null;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    canvas.width = width;
    canvas.height = height;

    // Clear canvas and draw image
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    // Try WebP first (best compression), fallback to JPEG
    const mimeType = isPng ? 'image/png' : 'image/webp';
    
    blob = await canvasToBlob(canvas, mimeType, quality);
    
    if (!blob) {
      throw new Error('Failed to compress image');
    }

    // If we hit the target, we're done
    if (blob.size <= targetBytes) {
      break;
    }

    // Reduce quality or dimensions for next attempt
    if (quality > 0.3) {
      quality -= 0.1;
    } else {
      // If quality is already low, reduce dimensions
      width = Math.round(width * 0.8);
      height = Math.round(height * 0.8);
      quality = 0.7; // Reset quality for new size
    }

    attempts++;
  }

  // If still too large after all attempts, do one final aggressive compression
  if (blob && blob.size > targetBytes) {
    const scale = Math.sqrt(targetBytes / blob.size);
    width = Math.max(100, Math.round(width * scale));
    height = Math.max(100, Math.round(height * scale));
    
    canvas.width = width;
    canvas.height = height;
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    
    blob = await canvasToBlob(canvas, 'image/webp', 0.6);
  }

  return blob || originalFile;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });
}

/**
 * Gets the file extension for the compressed image
 */
export function getCompressedExtension(originalFile: File, compressedBlob: Blob): string {
  if (compressedBlob.type === 'image/webp') return 'webp';
  if (compressedBlob.type === 'image/png') return 'png';
  if (compressedBlob.type === 'image/jpeg') return 'jpg';
  
  // Fallback to original extension
  return originalFile.name.split('.').pop() || 'jpg';
}
