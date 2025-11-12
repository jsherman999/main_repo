import { promises as fs } from 'fs';
import path from 'path';

/**
 * Utility functions for handling image files
 */

/**
 * Load an image file and return metadata
 */
export async function loadImage(imagePath) {
  const buffer = await fs.readFile(imagePath);
  const stats = await fs.stat(imagePath);

  // Detect actual MIME type from file content (magic bytes)
  const actualMimeType = detectMimeTypeFromBuffer(buffer);

  return {
    buffer: buffer,
    path: imagePath,
    filename: path.basename(imagePath),
    size: stats.size,
    mimetype: actualMimeType,
    base64: buffer.toString('base64')
  };
}

/**
 * Convert image to base64
 */
export async function imageToBase64(imagePathOrBuffer) {
  if (typeof imagePathOrBuffer === 'string') {
    const buffer = await fs.readFile(imagePathOrBuffer);
    return buffer.toString('base64');
  }

  if (Buffer.isBuffer(imagePathOrBuffer)) {
    return imagePathOrBuffer.toString('base64');
  }

  throw new Error('Invalid image input');
}

/**
 * Detect MIME type from file buffer by checking magic bytes (file signature)
 */
export function detectMimeTypeFromBuffer(buffer) {
  // PNG: 89 50 4E 47 (‰PNG)
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'image/png';
  }

  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }

  // WebP: RIFF....WEBP
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50) {
    return 'image/webp';
  }

  // GIF: GIF87a or GIF89a
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return 'image/gif';
  }

  // Default to PNG if can't detect (conservative choice)
  console.warn('Could not detect image type from buffer, defaulting to image/png');
  return 'image/png';
}

/**
 * Get MIME type from file extension (fallback method)
 */
export function getMimeType(filename) {
  const ext = path.extname(filename).toLowerCase();
  const mimeTypes = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
  };
  return mimeTypes[ext] || 'image/png';
}

/**
 * Validate image file
 */
export async function validateImage(imagePath) {
  try {
    const stats = await fs.stat(imagePath);

    // Check if file exists
    if (!stats.isFile()) {
      return { valid: false, error: 'Not a file' };
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (stats.size > maxSize) {
      return { valid: false, error: 'File too large (max 10MB)' };
    }

    // Check file extension
    const validExtensions = ['.png', '.jpg', '.jpeg', '.webp', '.gif'];
    const ext = path.extname(imagePath).toLowerCase();
    if (!validExtensions.includes(ext)) {
      return { valid: false, error: 'Invalid file type. Use PNG, JPG, or WEBP' };
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Get image dimensions (basic check based on file headers)
 */
export async function getImageInfo(imagePath) {
  const buffer = await fs.readFile(imagePath);
  const stats = await fs.stat(imagePath);

  let width = 0;
  let height = 0;

  // PNG detection
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    width = buffer.readUInt32BE(16);
    height = buffer.readUInt32BE(20);
  }
  // JPEG detection
  else if (buffer[0] === 0xFF && buffer[1] === 0xD8) {
    // JPEG dimensions require more complex parsing
    // For now, we'll leave them as 0
    width = 0;
    height = 0;
  }

  return {
    filename: path.basename(imagePath),
    size: stats.size,
    width,
    height,
    mimetype: detectMimeTypeFromBuffer(buffer)
  };
}
