import { v2 as cloudinary } from 'cloudinary';
import axios from 'axios';
import * as crypto from 'crypto';

// Initialize Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Check if Cloudinary is properly configured
export function isCloudinaryConfigured(): boolean {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

// Generate a unique identifier for the image
function generateImageId(url: string, appName: string, screenName: string): string {
  const hash = crypto.createHash('md5').update(`${url}-${appName}-${screenName}`).digest('hex');
  // Create a sanitized name for better readability in Cloudinary dashboard
  const sanitizedAppName = appName.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20);
  const sanitizedScreenName = screenName ? screenName.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 20) : 'screen';
  return `designpublico/${sanitizedAppName}/${sanitizedScreenName}_${hash.substring(0, 10)}`;
}

// Upload image to Cloudinary from an URL
export async function uploadImageFromUrl(
  imageUrl: string, 
  appName: string, 
  screenName: string = '',
  options: { folder?: string, transformation?: any } = {}
): Promise<{ url: string; secure_url: string; public_id: string } | null> {
  try {
    // Build the image ID
    const publicId = generateImageId(imageUrl, appName, screenName);
    
    // Check if image already exists in Cloudinary
    try {
      // Check if the image with this public ID already exists
      const existingImage = await cloudinary.api.resource(publicId);
      console.log(`Image already exists in Cloudinary: ${publicId}`);
      return {
        url: existingImage.url,
        secure_url: existingImage.secure_url,
        public_id: existingImage.public_id
      };
    } catch (error) {
      // Image doesn't exist, continue with upload
      console.log(`Uploading new image to Cloudinary: ${publicId}`);
    }

    // If the URL is an Airtable URL, we need to fetch the image first
    if (imageUrl.includes('airtable')) {
      console.log(`Uploading Airtable image to Cloudinary: ${imageUrl.substring(0, 50)}...`);
      
      // Upload to Cloudinary with specified public ID and folder
      const uploadResult = await cloudinary.uploader.upload(imageUrl, {
        public_id: publicId,
        folder: options.folder || 'designpublico',
        overwrite: true,
        resource_type: 'image',
        transformation: options.transformation || { quality: 'auto:good' },
        use_filename: false,
        unique_filename: false,
        type: 'upload'
      });

      console.log(`Successfully uploaded to Cloudinary: ${publicId}`);
      return {
        url: uploadResult.url,
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id
      };
    } else {
      // For non-Airtable URLs, download and then upload
      console.log(`Downloading and uploading image: ${imageUrl.substring(0, 50)}...`);
      
      // Get the image file
      const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
      const buffer = Buffer.from(response.data, 'binary');
      
      // Upload to Cloudinary with specified public ID
      const uploadResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            public_id: publicId,
            folder: options.folder || 'designpublico',
            overwrite: true,
            resource_type: 'image',
            transformation: options.transformation || { quality: 'auto:good' },
            use_filename: false,
            unique_filename: false,
            type: 'upload'
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        ).end(buffer);
      });

      console.log(`Successfully uploaded to Cloudinary: ${publicId}`);
      return {
        url: uploadResult.url,
        secure_url: uploadResult.secure_url,
        public_id: uploadResult.public_id
      };
    }
  } catch (error: any) {
    console.error('Error uploading image to Cloudinary:', error.message);
    return null;
  }
}

// Delete an image from Cloudinary
export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error);
    return false;
  }
}

// Get an optimized URL for a Cloudinary image
export function getOptimizedUrl(
  publicId: string, 
  options: { width?: number; height?: number; format?: string; quality?: number } = {}
): string {
  const transformations: string[] = [];
  
  if (options.width || options.height) {
    transformations.push(`c_limit${options.width ? `,w_${options.width}` : ''}${options.height ? `,h_${options.height}` : ''}`);
  }
  
  if (options.format) {
    transformations.push(`f_${options.format}`);
  } else {
    transformations.push('f_auto');
  }
  
  transformations.push(options.quality ? `q_${options.quality}` : 'q_auto:good');
  
  return cloudinary.url(publicId, { 
    transformation: transformations.join('/'),
    secure: true 
  });
}