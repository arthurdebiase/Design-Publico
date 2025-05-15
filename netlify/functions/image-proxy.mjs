import axios from 'axios';
import sharp from 'sharp';

/**
 * Serverless function to proxy and optimize images from Airtable
 * This handles image requests in the Netlify environment
 */
export async function handler(event, context) {
  try {
    // Get path parameters from the request
    const path = event.path.replace('/.netlify/functions/image-proxy', '');
    const { queryStringParameters } = event;
    
    // Parse query parameters for image optimization
    let width = parseInt(queryStringParameters?.width) || null;
    let height = parseInt(queryStringParameters?.height) || null;
    const format = queryStringParameters?.format || null;
    let quality = parseInt(queryStringParameters?.quality) || 80;
    
    console.log(`Netlify function proxying image: ${path}, width: ${width}, format: ${format}`);
    
    // Limit maximum size to avoid serving overly large images
    if (width && width > 1000) {
      const originalWidth = width;
      width = 1000;
      // Reduce quality for larger images to save bandwidth
      if (originalWidth > 1500 && quality > 75) {
        quality = 75;
      }
    }
    
    // Check if browser supports WebP
    const acceptHeader = event.headers.accept || '';
    const supportsWebP = acceptHeader.includes('image/webp');
    const supportsAvif = acceptHeader.includes('image/avif');
    
    // Use the most efficient format supported by the browser
    let outputFormat = format;
    if (!outputFormat || outputFormat === 'auto') {
      if (supportsAvif) {
        outputFormat = 'avif';
        if (quality > 70) quality = 70;
      } else if (supportsWebP) {
        outputFormat = 'webp';
        if (quality > 80) quality = 80;
      } else {
        outputFormat = 'jpeg';
      }
    }
    
    // Generate cache key for this resource
    const cacheKey = `${path}-${width || 'orig'}-${height || 'orig'}-${outputFormat}-${quality}`;
    const etag = `"${Buffer.from(cacheKey).toString('base64')}"`;
    
    // Check if the browser already has this version cached
    if (event.headers['if-none-match'] === etag) {
      return {
        statusCode: 304,
        body: ''
      };
    }
    
    // Construct the Airtable URL
    let airtableUrl = path.startsWith('https://') 
      ? path  // Use the full URL as provided
      : `https://v5.airtableusercontent.com${path}`; // Add the base domain
    
    console.log(`Fetching Airtable image from: ${airtableUrl}`);
    
    // Fetch the image from Airtable
    const response = await axios.get(airtableUrl, {
      responseType: 'arraybuffer',
      headers: {
        'Accept': 'image/*'
      }
    });
    
    // Apply optimization if width or height specified
    if (width || height || outputFormat) {
      const imageBuffer = Buffer.from(response.data);
      const originalContentType = response.headers['content-type'];
      
      // Start processing with Sharp
      let imageProcessor = sharp(imageBuffer);
      
      // Resize if needed
      if (width || height) {
        imageProcessor = imageProcessor.resize({
          width: width || undefined,
          height: height || undefined,
          fit: 'inside',
          withoutEnlargement: true
        });
      }
      
      // Convert to the target format
      let contentType;
      switch (outputFormat) {
        case 'webp':
          imageProcessor = imageProcessor.webp({ quality });
          contentType = 'image/webp';
          break;
        case 'avif':
          imageProcessor = imageProcessor.avif({ quality });
          contentType = 'image/avif';
          break;
        case 'jpeg':
        case 'jpg':
          imageProcessor = imageProcessor.jpeg({ quality });
          contentType = 'image/jpeg';
          break;
        case 'png':
          imageProcessor = imageProcessor.png({ 
            quality,
            compressionLevel: 9,
            palette: true
          });
          contentType = 'image/png';
          break;
        default:
          // Keep original format
          contentType = originalContentType;
      }
      
      // Process and get the optimized image
      const optimizedImageBuffer = await imageProcessor.toBuffer();
      
      // Return the optimized image
      return {
        statusCode: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable', // Cache for 1 year
          'ETag': etag,
          'Vary': 'Accept' // Vary response based on Accept header
        },
        body: optimizedImageBuffer.toString('base64'),
        isBase64Encoded: true
      };
    } else {
      // No optimization, return the original image
      return {
        statusCode: 200,
        headers: {
          'Content-Type': response.headers['content-type'],
          'Cache-Control': 'public, max-age=31536000, immutable',
          'ETag': etag,
          'Vary': 'Accept'
        },
        body: Buffer.from(response.data).toString('base64'),
        isBase64Encoded: true
      };
    }
  } catch (error) {
    console.error("Error in image-proxy function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to proxy image', 
        details: error.message,
        path: event.path
      })
    };
  }
}