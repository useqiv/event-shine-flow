/**
 * Compresses an image file using canvas API
 * @param file - The image file to compress
 * @param maxWidth - Maximum width (default 1920px)
 * @param maxHeight - Maximum height (default 1920px)
 * @param quality - JPEG quality 0-1 (default 0.8)
 * @returns Compressed file as Blob
 */
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.8
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw image on canvas
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob with compression
      // Use webp for better compression if supported, fallback to jpeg
      const outputType = file.type === 'image/png' && hasTransparency(ctx, canvas) 
        ? 'image/png' 
        : 'image/webp';
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            // If compressed is larger than original (rare), use original
            if (blob.size >= file.size) {
              resolve(file);
            } else {
              resolve(blob);
            }
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        outputType,
        outputType === 'image/png' ? undefined : quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Create object URL from file
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Check if image has transparency (for PNG preservation)
 */
function hasTransparency(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement): boolean {
  try {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Check alpha channel (every 4th value starting at index 3)
    for (let i = 3; i < data.length; i += 4) {
      if (data[i] < 255) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
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
