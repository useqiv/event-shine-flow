/**
 * Compresses an image file to a target size while maintaining visual quality
 * Uses smart resizing first, then quality adjustment as last resort
 * @param file - The image file to compress
 * @param targetSizeKB - Target file size in KB (default 50KB)
 * @returns Compressed file as Blob
 */
export async function compressImage(
  file: File,
  targetSizeKB: number = 50
): Promise<Blob> {
  // If file is already small enough, return as-is
  if (file.size <= targetSizeKB * 1024) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = async () => {
      try {
        const result = await compressToTargetSize(img, file, targetSizeKB);
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
  targetSizeKB: number
): Promise<Blob> {
  const targetBytes = targetSizeKB * 1024;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  const originalWidth = img.width;
  const originalHeight = img.height;
  
  // Calculate optimal dimensions based on file size ratio
  // This estimates how much we need to scale down
  const sizeRatio = targetBytes / originalFile.size;
  
  // For images, file size roughly scales with pixel count
  // So we scale dimensions by sqrt of the size ratio
  let scaleFactor = Math.sqrt(sizeRatio) * 1.5; // 1.5x buffer for quality
  scaleFactor = Math.min(1, scaleFactor); // Never upscale
  
  let width = Math.round(originalWidth * scaleFactor);
  let height = Math.round(originalHeight * scaleFactor);
  
  // Ensure minimum dimensions for quality
  const minDimension = 200;
  if (width < minDimension && height < minDimension) {
    if (originalWidth > originalHeight) {
      width = minDimension;
      height = Math.round((minDimension / originalWidth) * originalHeight);
    } else {
      height = minDimension;
      width = Math.round((minDimension / originalHeight) * originalWidth);
    }
  }

  // Keep quality high - WebP handles compression well
  let quality = 0.85;
  let blob: Blob | null = null;
  let attempts = 0;
  const maxAttempts = 8;

  while (attempts < maxAttempts) {
    canvas.width = width;
    canvas.height = height;

    // Use high-quality image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    // Use WebP for best quality-to-size ratio
    blob = await canvasToBlob(canvas, 'image/webp', quality);
    
    if (!blob) {
      throw new Error('Failed to compress image');
    }

    // If we hit the target, we're done
    if (blob.size <= targetBytes) {
      break;
    }

    // Strategy: Reduce dimensions first (maintains visual quality better)
    // Only reduce quality as last resort
    if (width > minDimension && height > minDimension) {
      // Scale down by 15% each iteration
      width = Math.round(width * 0.85);
      height = Math.round(height * 0.85);
    } else if (quality > 0.5) {
      // Only reduce quality when dimensions are at minimum
      quality -= 0.1;
    } else {
      // Final resort: more aggressive dimension reduction
      width = Math.round(width * 0.8);
      height = Math.round(height * 0.8);
    }

    attempts++;
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
