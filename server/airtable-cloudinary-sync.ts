import axios from 'axios';
import { uploadImageFromUrl, isCloudinaryConfigured } from './cloudinary';

// Define Airtable API types
interface AirtableImage {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
}

interface AirtableRecord {
  id: string;
  fields: {
    [key: string]: any;
    image?: AirtableImage[];
    importing?: string;  // This is the column we'll update with Cloudinary URLs
    appname?: string;
    imagetitle?: string;
  };
}

interface AirtableResponse {
  records: AirtableRecord[];
  offset?: string;
}

// Airtable API constants
const AIRTABLE_API_URL = 'https://api.airtable.com/v0';
const AIRTABLE_API_KEY = process.env.AIRTABLE_API_KEY;
const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const SCREENS_TABLE = 'screens'; // Update this to match your Airtable table name

/**
 * Fetches records from Airtable screens table that have images but no Cloudinary URL
 */
async function fetchRecordsNeedingMigration(limit = 100, offset?: string): Promise<AirtableResponse> {
  const url = `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${SCREENS_TABLE}`;
  
  // Build the query parameters - get all records that have images
  // We'll filter out records with importing field in our processing code
  const params: any = {
    view: 'Grid view',
    // Simplified formula - just get records with images
    filterByFormula: 'AND(NOT(ISERROR({image})), NOT(image = ""))',
    pageSize: limit,
  };
  
  if (offset) {
    params.offset = offset;
  }
  
  try {
    const response = await axios.get(url, {
      params,
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
      },
    });
    
    return response.data;
  } catch (error: any) {
    console.error('Error fetching records from Airtable:', error.message);
    throw error;
  }
}

/**
 * Updates a record in Airtable with the Cloudinary URL
 */
async function updateRecordWithCloudinaryUrl(recordId: string, cloudinaryUrl: string): Promise<boolean> {
  const url = `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${SCREENS_TABLE}/${recordId}`;
  
  try {
    await axios.patch(url, {
      fields: {
        importing: cloudinaryUrl,
      },
    }, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    return true;
  } catch (error: any) {
    console.error(`Error updating record ${recordId} in Airtable:`, error.message);
    return false;
  }
}

/**
 * Process a batch of records, uploading their images to Cloudinary and updating Airtable
 */
async function processBatch(records: AirtableRecord[]): Promise<{success: number, failed: number}> {
  let success = 0;
  let failed = 0;
  
  console.log(`Processing batch of ${records.length} records...`);
  
  for (const record of records) {
    try {
      console.log(`Processing record ${record.id}...`);
      console.log(`Available fields: ${Object.keys(record.fields).join(', ')}`);
      
      // Skip records without images
      if (!record.fields.image || !Array.isArray(record.fields.image) || record.fields.image.length === 0) {
        console.log(`Record ${record.id} has no images, skipping.`);
        continue;
      }
      
      // If already has a Cloudinary URL in the "importing" field, skip
      // Safely check for importing field (might be string or array or undefined)
      const hasImportingField = record.fields.importing && 
        (typeof record.fields.importing === 'string' || 
         (Array.isArray(record.fields.importing) && record.fields.importing.length > 0));
         
      if (hasImportingField) {
        console.log(`Record ${record.id} already has a Cloudinary URL, skipping.`);
        continue;
      }
      
      // Get app name using different possible field patterns
      // App name might be a direct field, a linked record field, or in various formats
      let appName = 'Unknown App';
      if (record.fields.appname) {
        if (Array.isArray(record.fields.appname)) {
          appName = record.fields.appname[0] || appName;
        } else if (typeof record.fields.appname === 'string') {
          appName = record.fields.appname;
        }
      } else if (record.fields['appname (from appname)']) {
        if (Array.isArray(record.fields['appname (from appname)'])) {
          appName = record.fields['appname (from appname)'][0] || appName;
        } else if (typeof record.fields['appname (from appname)'] === 'string') {
          appName = record.fields['appname (from appname)'];
        }
      } else if (record.fields['App']) {
        if (Array.isArray(record.fields['App'])) {
          appName = record.fields['App'][0] || appName;
        } else if (typeof record.fields['App'] === 'string') {
          appName = record.fields['App'];
        }
      }
      
      console.log(`Using app name: ${appName}`);
      
      // Get screen name from various possible field names
      let screenName = 'Unnamed Screen';
      if (record.fields.imagetitle && typeof record.fields.imagetitle === 'string') {
        screenName = record.fields.imagetitle;
      } else if (record.fields.imagename && typeof record.fields.imagename === 'string') {
        screenName = record.fields.imagename;
      } else if (record.fields.name && typeof record.fields.name === 'string') {
        screenName = record.fields.name;
      } else if (record.fields.title && typeof record.fields.title === 'string') {
        screenName = record.fields.title;
      }
      
      console.log(`Using screen name: ${screenName}`);
      
      // Get the first image from the record
      const image = record.fields.image[0];
      console.log(`Processing image ${image.filename} from record ${record.id}`);
      
      // Upload the image to Cloudinary
      const cloudinaryResult = await uploadImageFromUrl(
        image.url,
        appName,
        screenName,
        { 
          folder: 'designpublico/screens',
          transformation: { quality: 'auto:good', format: 'auto' } 
        }
      );
      
      if (cloudinaryResult) {
        // Update the record in Airtable with the secure Cloudinary URL
        const updated = await updateRecordWithCloudinaryUrl(record.id, cloudinaryResult.secure_url);
        
        if (updated) {
          console.log(`Successfully updated record ${record.id} with Cloudinary URL: ${cloudinaryResult.secure_url}`);
          success++;
        } else {
          console.error(`Failed to update record ${record.id} in Airtable`);
          failed++;
        }
      } else {
        console.error(`Failed to upload image from record ${record.id} to Cloudinary`);
        failed++;
      }
    } catch (error: any) {
      console.error(`Error processing record ${record.id}:`, error.message);
      failed++;
    }
  }
  
  return { success, failed };
}

/**
 * Main function to run the migration
 */
export async function migrateAirtableImagesToCloudinary(
  maxRecords = 100,
  options = { batchSize: 10, delayBetweenBatches: 1000 }
): Promise<{ total: number, success: number, failed: number }> {
  console.log('Starting migration of Airtable images to Cloudinary...');
  
  // Check if Cloudinary and Airtable are properly configured
  if (!isCloudinaryConfigured()) {
    throw new Error('Cloudinary is not properly configured. Please check your environment variables.');
  }
  
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID) {
    throw new Error('Airtable credentials are not properly configured. Please check your environment variables.');
  }
  
  let offset: string | undefined;
  let totalProcessed = 0;
  let totalSuccess = 0;
  let totalFailed = 0;
  
  try {
    // Process records in batches
    while (totalProcessed < maxRecords) {
      // Fetch a batch of records from Airtable
      const response = await fetchRecordsNeedingMigration(
        Math.min(options.batchSize, maxRecords - totalProcessed),
        offset
      );
      
      if (!response.records || response.records.length === 0) {
        console.log('No more records to process.');
        break;
      }
      
      const { success, failed } = await processBatch(response.records);
      
      totalSuccess += success;
      totalFailed += failed;
      totalProcessed += response.records.length;
      
      // Set offset for next batch
      offset = response.offset;
      
      // If no more records or reached max, break
      if (!offset || totalProcessed >= maxRecords) {
        break;
      }
      
      // Delay between batches to avoid rate limiting
      if (options.delayBetweenBatches > 0) {
        console.log(`Waiting ${options.delayBetweenBatches}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, options.delayBetweenBatches));
      }
    }
    
    console.log('Migration completed:', {
      total: totalProcessed,
      success: totalSuccess,
      failed: totalFailed
    });
    
    return {
      total: totalProcessed,
      success: totalSuccess,
      failed: totalFailed
    };
  } catch (error: any) {
    console.error('Error during migration:', error.message);
    return {
      total: totalProcessed,
      success: totalSuccess,
      failed: totalFailed
    };
  }
}