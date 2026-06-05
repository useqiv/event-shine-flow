/**
 * Compresses an image file to a target size while maintaining visual quality
 */

export interface CompressImageOptions {
  targetSizeKB?: number;
  /** Skip compression when file is already under this size (KB) */
  skipIfUnderKB?: number;
  initialQuality?: number;
  maxDimension?: number;
  minDimension?: number;
}

export const BLOG_IMAGE_COMPRESS_OPTIONS: CompressImageOptions = {
  targetSizeKB: 2048,
  skipIfUnderKB: 4096,
  initialQuality: 0.92,
  maxDimension: 3840,
  minDimension: 800,
};

const DEFAULT_OPTIONS: Required<CompressImageOptions> = {
  targetSizeKB: 50,
  skipIfUnderKB: 50,
  initialQuality: 0.85,
  maxDimension: 1920,
  minDimension: 200,
};

function resolveOptions(options?: number | CompressImageOptions): Required<CompressImageOptions> {
  if (typeof options === 'number') {
    return { ...DEFAULT_OPTIONS, targetSizeKB: options, skipIfUnderKB: options };
  }
  return { ...DEFAULT_OPTIONS, ...options };
}

export async function compressImage(
  file: File,
  options?: number | CompressImageOptions
): Promise<Blob> {
  const opts = resolveOptions(options);

  if (file.size <= opts.skipIfUnderKB * 1024) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = async () => {
      try {
        const result = await compressToTargetSize(img, file, opts);
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
  opts: Required<CompressImageOptions>
): Promise<Blob> {
  const targetBytes = opts.targetSizeKB * 1024;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  const originalWidth = img.width;
  const originalHeight = img.height;

  let width = originalWidth;
  let height = originalHeight;

  const maxDim = opts.maxDimension;
  if (width > maxDim || height > maxDim) {
    if (width >= height) {
      height = Math.round((maxDim / width) * height);
      width = maxDim;
    } else {
      width = Math.round((maxDim / height) * width);
      height = maxDim;
    }
  }

  const sizeRatio = targetBytes / originalFile.size;
  let scaleFactor = Math.sqrt(sizeRatio) * 1.2;
  scaleFactor = Math.min(1, scaleFactor);

  if (scaleFactor < 1) {
    width = Math.round(width * scaleFactor);
    height = Math.round(height * scaleFactor);
  }

  const minDimension = opts.minDimension;
  if (width < minDimension && height < minDimension) {
    if (originalWidth > originalHeight) {
      width = Math.min(minDimension, originalWidth);
      height = Math.round((width / originalWidth) * originalHeight);
    } else {
      height = Math.min(minDimension, originalHeight);
      width = Math.round((height / originalHeight) * originalWidth);
    }
  }

  let quality = opts.initialQuality;
  let blob: Blob | null = null;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    canvas.width = width;
    canvas.height = height;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    blob = await canvasToBlob(canvas, 'image/webp', quality);

    if (!blob) {
      throw new Error('Failed to compress image');
    }

    if (blob.size <= targetBytes) {
      break;
    }

    if (width > minDimension && height > minDimension) {
      width = Math.round(width * 0.9);
      height = Math.round(height * 0.9);
    } else if (quality > 0.65) {
      quality -= 0.05;
    } else {
      width = Math.round(width * 0.85);
      height = Math.round(height * 0.85);
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

export function getCompressedExtension(originalFile: File, compressedBlob: Blob): string {
  if (compressedBlob === originalFile) {
    return originalFile.name.split('.').pop()?.toLowerCase() || 'jpg';
  }
  if (compressedBlob.type === 'image/webp') return 'webp';
  if (compressedBlob.type === 'image/png') return 'png';
  if (compressedBlob.type === 'image/jpeg') return 'jpg';

  return originalFile.name.split('.').pop() || 'jpg';
}
