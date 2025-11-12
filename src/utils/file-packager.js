import { promises as fs } from 'fs';
import path from 'path';
import JSZip from 'jszip';

/**
 * Utility functions for packaging files into ZIP archives
 */

/**
 * Create a ZIP file from a collection of files
 */
export async function createZipPackage(files, outputPath) {
  const zip = new JSZip();

  // Add all files to ZIP
  for (const [filename, content] of Object.entries(files)) {
    if (Buffer.isBuffer(content)) {
      zip.file(filename, content);
    } else if (typeof content === 'string') {
      zip.file(filename, content);
    } else {
      console.warn(`Skipping file ${filename}: unsupported content type`);
    }
  }

  // Generate ZIP
  const zipBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 9 }
  });

  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  await fs.mkdir(outputDir, { recursive: true });

  // Write ZIP file
  await fs.writeFile(outputPath, zipBuffer);

  return outputPath;
}

/**
 * Generate output filename for documentation package
 */
export function generateOutputFilename(appName, format = 'zip') {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
  const sanitizedName = appName.replace(/[^a-z0-9]/gi, '-').toLowerCase();
  return `${sanitizedName}-guide-${timestamp}.${format}`;
}

/**
 * Get file structure summary
 */
export function getFileStructure(files) {
  const structure = {
    totalFiles: 0,
    totalSize: 0,
    fileTypes: {},
    files: []
  };

  for (const [filename, content] of Object.entries(files)) {
    const size = Buffer.isBuffer(content) ? content.length : content.length;
    const ext = path.extname(filename) || 'no-extension';

    structure.totalFiles++;
    structure.totalSize += size;
    structure.fileTypes[ext] = (structure.fileTypes[ext] || 0) + 1;
    structure.files.push({
      name: filename,
      size: size,
      type: ext
    });
  }

  return structure;
}

/**
 * Validate package contents
 */
export function validatePackageContents(files) {
  const requiredFiles = [
    'guide.html',
    'README.md',
    'screenshot.png'
  ];

  const missingFiles = requiredFiles.filter(file => !files[file]);

  if (missingFiles.length > 0) {
    return {
      valid: false,
      errors: [`Missing required files: ${missingFiles.join(', ')}`]
    };
  }

  // Check for empty files
  const emptyFiles = [];
  for (const [filename, content] of Object.entries(files)) {
    if (!content || (typeof content === 'string' && content.trim().length === 0)) {
      emptyFiles.push(filename);
    }
  }

  if (emptyFiles.length > 0) {
    return {
      valid: false,
      errors: [`Empty files found: ${emptyFiles.join(', ')}`]
    };
  }

  return { valid: true, errors: [] };
}

/**
 * Create file structure documentation
 */
export function createFileStructureDoc(files) {
  let doc = 'FILE STRUCTURE\n';
  doc += '=============\n\n';

  const structure = getFileStructure(files);

  doc += `Total Files: ${structure.totalFiles}\n`;
  doc += `Total Size: ${formatBytes(structure.totalSize)}\n\n`;

  doc += 'Files:\n';
  doc += '------\n';

  structure.files.sort((a, b) => a.name.localeCompare(b.name));

  for (const file of structure.files) {
    doc += `${file.name.padEnd(30)} ${formatBytes(file.size).padStart(10)}\n`;
  }

  return doc;
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
