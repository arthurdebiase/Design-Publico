import { Request, Response } from 'express';
import { migrateAirtableImagesToCloudinary } from './airtable-cloudinary-sync';
import { getOptimizedUrl, isCloudinaryConfigured, uploadImageFromUrl } from './cloudinary';

/**
 * Start the migration of Airtable images to Cloudinary
 */
export async function startMigration(req: Request, res: Response) {
  try {
    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'Cloudinary is not properly configured. Please check your environment variables.'
      });
    }

    // Get parameters from request
    const maxRecords = parseInt(req.query.maxRecords as string) || 100;
    const batchSize = parseInt(req.query.batchSize as string) || 10;
    const delayBetweenBatches = parseInt(req.query.delayBetweenBatches as string) || 1000;
    const migrationType = (req.query.type as string) || 'screens'; // Can be 'screens', 'logos', or 'categories'

    // Start migration process
    console.log(`Starting migration of ${migrationType} with: maxRecords=${maxRecords}, batchSize=${batchSize}, delay=${delayBetweenBatches}ms`);
    
    // For API response, we'll return immediately and run the migration in background
    res.status(202).json({
      success: true,
      message: `Migration of ${migrationType} started in the background`,
      params: { type: migrationType, maxRecords, batchSize, delayBetweenBatches }
    });

    // Start the migration process in the background
    migrateAirtableImagesToCloudinary(maxRecords, {
      batchSize, 
      delayBetweenBatches,
      migrationType
    }).then(result => {
      console.log(`Migration of ${migrationType} completed:`, result);
    }).catch(error => {
      console.error(`Migration of ${migrationType} failed:`, error);
    });
  } catch (error: any) {
    console.error('Error starting migration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start migration',
      error: error.message
    });
  }
}

/**
 * Get the status of the Cloudinary integration
 */
export async function getCloudinaryStatus(req: Request, res: Response) {
  try {
    const isConfigured = isCloudinaryConfigured();
    
    res.json({
      success: true,
      configured: isConfigured,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME || null
    });
  } catch (error: any) {
    console.error('Error checking Cloudinary status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check Cloudinary status',
      error: error.message
    });
  }
}

/**
 * Test uploading a single image to Cloudinary
 */
export async function testCloudinaryUpload(req: Request, res: Response) {
  try {
    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured()) {
      return res.status(400).json({
        success: false,
        message: 'Cloudinary is not properly configured. Please check your environment variables.'
      });
    }
    
    const { imageUrl, appName, screenName } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'Image URL is required'
      });
    }
    
    // Try to upload the image to Cloudinary
    const result = await uploadImageFromUrl(
      imageUrl,
      appName || 'Test App',
      screenName || 'Test Screen',
      { folder: 'designpublico/tests' }
    );
    
    if (!result) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload image to Cloudinary'
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error: any) {
    console.error('Error testing Cloudinary upload:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to test Cloudinary upload',
      error: error.message
    });
  }
}