import { Request, Response } from 'express';
import axios from 'axios';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// Get current file directory equivalent to __dirname in CommonJS
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create cache directory if it doesn't exist
const CACHE_DIR = path.join(__dirname, '../.cache');
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

// LRU Cache for recently accessed images (in-memory)
const MEMORY_CACHE_SIZE = 100; // Maximum number of images to keep in memory
const memoryCache = new Map<string, { data: Buffer, timestamp: number }>();

// Helper function to generate a cache key
function generateCacheKey(url: string, width: number, quality: number): string {
  return crypto.createHash('md5').update(`${url}_w${width}_q${quality}`).digest('hex');
}

// Helper function to clean old items from memory cache when it grows too large
function cleanMemoryCache() {
  if (memoryCache.size <= MEMORY_CACHE_SIZE) return;
  
  // Get all entries sorted by timestamp (oldest first)
  const entries = Array.from(memoryCache.entries())
    .sort((a, b) => a[1].timestamp - b[1].timestamp);
  
  // Remove oldest entries until we're back to the limit
  while (entries.length > MEMORY_CACHE_SIZE) {
    const [key] = entries.shift()!;
    memoryCache.delete(key);
  }
}

// Express middleware for optimized image serving
export async function optimizeAndServeImage(req: Request, res: Response) {
  try {
    // Extract request parameters
    const urlPath = req.path.replace('/v5.airtableusercontent.com/', '');
    const url = `https://v5.airtableusercontent.com/${urlPath}`;
    
    // Parse query parameters
    const width = parseInt(req.query.width as string) || 0;
    const quality = parseInt(req.query.quality as string) || 80;
    
    // Generate a cache key based on the URL and resize parameters
    const cacheKey = generateCacheKey(url, width, quality);
    const cachePath = `${CACHE_DIR}/${cacheKey}`;
    
    // Check memory cache first (fastest)
    if (memoryCache.has(cacheKey)) {
      console.log(`Serving from memory cache: ${url}`);
      const cachedData = memoryCache.get(cacheKey)!;
      
      // Update the timestamp to indicate recent use
      cachedData.timestamp = Date.now();
      
      // Get image format from URL
      const format = url.split('.').pop()?.toLowerCase() || 'jpeg';
      res.set('Content-Type', `image/${format === 'jpg' ? 'jpeg' : format}`);
      res.set('Cache-Control', 'public, max-age=86400'); // 1 day
      return res.send(cachedData.data);
    }
    
    // Check disk cache next
    if (fs.existsSync(cachePath)) {
      console.log(`Serving from disk cache: ${url}`);
      const imageData = fs.readFileSync(cachePath);
      
      // Add to memory cache for faster access next time
      memoryCache.set(cacheKey, { data: imageData, timestamp: Date.now() });
      cleanMemoryCache();
      
      // Get image format from URL
      const format = url.split('.').pop()?.toLowerCase() || 'jpeg';
      res.set('Content-Type', `image/${format === 'jpg' ? 'jpeg' : format}`);
      res.set('Cache-Control', 'public, max-age=86400'); // 1 day
      return res.send(imageData);
    }
    
    // If not in cache, fetch from source
    console.log(`Fetching and optimizing image: ${url}`);
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'Referer': 'https://airtable.com/',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    // Get the content type
    const contentType = response.headers['content-type'] || 'image/jpeg';
    const format = contentType.split('/')[1] || 'jpeg';
    
    // Process with sharp for optimization
    let imageProcessor = sharp(response.data);
    
    // Resize if width is specified and greater than 0
    if (width > 0) {
      imageProcessor = imageProcessor.resize({ 
        width,
        withoutEnlargement: true // Don't enlarge images smaller than the specified dimensions
      });
    }
    
    // Define quality based on format
    let outputOptions: any = {};
    
    if (format === 'jpeg' || format === 'jpg') {
      outputOptions = { quality };
      imageProcessor = imageProcessor.jpeg(outputOptions);
    } else if (format === 'png') {
      // For PNG, quality is 0-100 integer in Sharp
      const pngQuality = Math.min(Math.max(Math.round(quality), 1), 100);
      outputOptions = { quality: pngQuality };
      imageProcessor = imageProcessor.png({ 
        quality: pngQuality,
        compressionLevel: 9, // Maximum compression (0-9) 
        adaptiveFiltering: true // Better compression
      });
    } else if (format === 'webp') {
      outputOptions = { quality };
      imageProcessor = imageProcessor.webp(outputOptions);
    } else {
      // For other formats, just pass through
      imageProcessor = imageProcessor.toFormat(format as any);
    }
    
    // Process the image
    const optimizedImageBuffer = await imageProcessor.toBuffer();
    
    // Save to disk cache
    fs.writeFileSync(cachePath, optimizedImageBuffer);
    
    // Add to memory cache
    memoryCache.set(cacheKey, { data: optimizedImageBuffer, timestamp: Date.now() });
    cleanMemoryCache();
    
    // Set appropriate headers
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400'); // 1 day
    
    // Send the optimized image
    res.send(optimizedImageBuffer);
    
  } catch (error) {
    console.error('Error optimizing image:', error);
    res.status(500).send('Failed to load image');
  }
}