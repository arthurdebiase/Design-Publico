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

// These field names need to match exactly what's in your Airtable
// Screens table configuration
const SCREENS_TABLE = 'screens'; // Table containing screen images
const SCREENS_ATTACHMENT_FIELD = 'images'; // Field containing screen images
const SCREEN_APP_NAME_FIELD = 'appname'; // Field linking screens to apps
const SCREEN_NAME_FIELD = 'imagetitle'; // Field containing screen names
const SCREENS_IMPORTING_FIELD = 'importing'; // Field to store Cloudinary URLs for screens

// Apps table configuration 
const APPS_TABLE = 'apps'; // Table containing app information
const APPS_LOGO_FIELD = 'logo'; // Field containing app logos
const APPS_NAME_FIELD = 'appname'; // Field containing app names
const APPS_IMPORTING_FIELD = 'importing'; // Field to store Cloudinary URLs for logos

// Categories table configuration
const CATEGORY_TABLE = 'category'; // Table containing category information
const CATEGORY_ICON_FIELD = 'Attachments'; // Field containing category icons
const CATEGORY_NAME_FIELD = 'Name'; // Field containing category names
const CATEGORY_IMPORTING_FIELD = 'importing'; // Field to store Cloudinary URLs for category icons

/**
 * Fetches records from Airtable that have images/logos but no Cloudinary URL
 * @param migrationType - 'screens' for screen images, 'logos' for app logos, or 'categories' for category icons
 */
async function fetchRecordsNeedingMigration(limit = 100, offset?: string, migrationType = 'screens'): Promise<AirtableResponse> {
  // Determine which table and fields to use based on migration type
  let tableName, attachmentField, importingField, viewName;
  
  if (migrationType === 'screens') {
    tableName = SCREENS_TABLE;
    attachmentField = SCREENS_ATTACHMENT_FIELD;
    importingField = SCREENS_IMPORTING_FIELD;
    viewName = 'screens-list';
  } else if (migrationType === 'categories') {
    tableName = CATEGORY_TABLE;
    attachmentField = CATEGORY_ICON_FIELD;
    importingField = CATEGORY_IMPORTING_FIELD;
    viewName = 'Grid view';
  } else { // logos
    tableName = APPS_TABLE;
    attachmentField = APPS_LOGO_FIELD;
    importingField = APPS_IMPORTING_FIELD;
    viewName = 'apps-list';
  }
  
  const url = `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${tableName}`;
  
  // Build the query parameters - get all records that have images/logos but no importing field
  const params: any = {
    view: viewName,
    // Query for records that don't have importing field filled yet
    filterByFormula: `AND(NOT(ISERROR({${attachmentField}})), {${importingField}} = "")`,
    pageSize: limit,
  };
  
  if (offset) {
    params.offset = offset;
  }
  
  try {
    console.log(`Sending request to Airtable: ${url} with params:`, JSON.stringify(params));
    
    const response = await axios.get(url, {
      params,
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log(`Successfully fetched ${response.data.records?.length || 0} records from Airtable`);
    return response.data;
  } catch (error: any) {
    console.error('Error fetching records from Airtable:', error.message);
    // Add more detailed error information
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data));
      console.error('Response headers:', JSON.stringify(error.response.headers));
    } else if (error.request) {
      console.error('No response received from Airtable');
    } else {
      console.error('Error setting up request:', error.message);
    }
    
    throw error;
  }
}

/**
 * Updates a record in Airtable with the Cloudinary URL
 * @param recordId - The ID of the record to update
 * @param cloudinaryUrl - The Cloudinary URL to store
 * @param migrationType - The type of migration being performed ('screens' or 'logos')
 */
async function updateRecordWithCloudinaryUrl(
  recordId: string, 
  cloudinaryUrl: string,
  migrationType = 'screens'
): Promise<boolean> {
  // Determine which table and field to update based on migration type
  let tableName, importingField, itemType;
  
  if (migrationType === 'screens') {
    tableName = SCREENS_TABLE;
    importingField = SCREENS_IMPORTING_FIELD;
    itemType = 'screen';
  } else if (migrationType === 'categories') {
    tableName = CATEGORY_TABLE;
    importingField = CATEGORY_IMPORTING_FIELD;
    itemType = 'category icon';
  } else { // logos
    tableName = APPS_TABLE;
    importingField = APPS_IMPORTING_FIELD;
    itemType = 'app logo';
  }
  
  const url = `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${tableName}/${recordId}`;
  
  try {
    console.log(`Updating ${itemType} record ${recordId} with Cloudinary URL: ${cloudinaryUrl}`);
    
    // Update the importing field with the Cloudinary URL
    await axios.patch(url, {
      fields: {
        [importingField]: cloudinaryUrl,
      },
    }, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });
    
    return true;
  } catch (error: any) {
    console.error(`Error updating ${itemType} record ${recordId} in Airtable:`, error.message);
    return false;
  }
}

/**
 * Process a batch of records, uploading their images to Cloudinary and updating Airtable
 * @param records - The records to process
 * @param migrationType - The type of migration to perform ('screens' or 'logos')
 */
async function processBatch(records: AirtableRecord[], migrationType = 'screens'): Promise<{success: number, failed: number}> {
  let success = 0;
  let failed = 0;
  
  // Determine which fields to use based on migration type
  let attachmentField, importingField, folderPath, itemType;
  
  if (migrationType === 'screens') {
    attachmentField = SCREENS_ATTACHMENT_FIELD;
    importingField = SCREENS_IMPORTING_FIELD;
    folderPath = 'designpublico/screens';
    itemType = 'screen';
  } else if (migrationType === 'categories') {
    attachmentField = CATEGORY_ICON_FIELD;
    importingField = CATEGORY_IMPORTING_FIELD;
    folderPath = 'designpublico/categories';
    itemType = 'category icon';
  } else { // logos
    attachmentField = APPS_LOGO_FIELD;
    importingField = APPS_IMPORTING_FIELD;
    folderPath = 'designpublico/logos';
    itemType = 'app logo';
  }
  
  console.log(`Processing batch of ${records.length} ${itemType} records...`);
  
  for (const record of records) {
    try {
      console.log(`Processing ${itemType} record ${record.id}...`);
      console.log(`Available fields: ${Object.keys(record.fields).join(', ')}`);
      
      // Skip records without images/logos - using the appropriate attachment field
      if (!record.fields[attachmentField] || !Array.isArray(record.fields[attachmentField]) || record.fields[attachmentField].length === 0) {
        console.log(`Record ${record.id} has no ${itemType} attachments, skipping.`);
        continue;
      }
      
      // If already has a Cloudinary URL in the importing field, skip
      // Safely check for importing field (might be string or array or undefined)
      const hasImportingField = record.fields[importingField] && 
        (typeof record.fields[importingField] === 'string' || 
         (Array.isArray(record.fields[importingField]) && 
          record.fields[importingField].length > 0 && 
          record.fields[importingField][0] !== '') ||
         (typeof record.fields[importingField] === 'object' && 
          record.fields[importingField] !== null));
         
      if (hasImportingField) {
        console.log(`Record ${record.id} already has a Cloudinary URL, skipping.`);
        continue;
      }
      
      // Get app/item name using different possible field patterns
      let itemName = 'Unknown Item';
      
      if (migrationType === 'screens') {
        // For screens, try to get the app name from various field formats
        itemName = 'Unknown App';
        if (record.fields.appname) {
          if (Array.isArray(record.fields.appname)) {
            itemName = record.fields.appname[0] || itemName;
          } else if (typeof record.fields.appname === 'string') {
            itemName = record.fields.appname;
          }
        } else if (record.fields['appname (from appname)']) {
          if (Array.isArray(record.fields['appname (from appname)'])) {
            itemName = record.fields['appname (from appname)'][0] || itemName;
          } else if (typeof record.fields['appname (from appname)'] === 'string') {
            itemName = record.fields['appname (from appname)'];
          }
        } else if (record.fields['App']) {
          if (Array.isArray(record.fields['App'])) {
            itemName = record.fields['App'][0] || itemName;
          } else if (typeof record.fields['App'] === 'string') {
            itemName = record.fields['App'];
          }
        }
      } else if (migrationType === 'categories') {
        // For category icons, get the category name from the CATEGORY_NAME_FIELD
        itemName = 'Unknown Category';
        if (record.fields[CATEGORY_NAME_FIELD]) {
          if (Array.isArray(record.fields[CATEGORY_NAME_FIELD])) {
            itemName = record.fields[CATEGORY_NAME_FIELD][0] || itemName;
          } else if (typeof record.fields[CATEGORY_NAME_FIELD] === 'string') {
            itemName = record.fields[CATEGORY_NAME_FIELD];
          }
        }
      } else {
        // For app logos, get the app name from the APPS_NAME_FIELD
        itemName = 'Unknown App';
        if (record.fields[APPS_NAME_FIELD]) {
          if (Array.isArray(record.fields[APPS_NAME_FIELD])) {
            itemName = record.fields[APPS_NAME_FIELD][0] || itemName;
          } else if (typeof record.fields[APPS_NAME_FIELD] === 'string') {
            itemName = record.fields[APPS_NAME_FIELD];
          }
        }
      }
      
      console.log(`Using ${migrationType === 'screens' ? 'app' : 'item'} name: ${itemName}`);
      
      // Get title from various possible field names
      let itemTitle = 'Unnamed Item';
      
      if (migrationType === 'screens') {
        // For screens, try to get screen name from various fields
        itemTitle = 'Unnamed Screen';
        if (record.fields.imagetitle && typeof record.fields.imagetitle === 'string') {
          itemTitle = record.fields.imagetitle;
        } else if (record.fields.imagename && typeof record.fields.imagename === 'string') {
          itemTitle = record.fields.imagename;
        } else if (record.fields.name && typeof record.fields.name === 'string') {
          itemTitle = record.fields.name;
        } else if (record.fields.title && typeof record.fields.title === 'string') {
          itemTitle = record.fields.title;
        }
      } else if (migrationType === 'categories') {
        // For category icons, use the category name as the icon title
        itemTitle = itemName;
      } else {
        // For app logos, use the app name as the logo title
        itemTitle = 'Unnamed Logo';
        itemTitle = itemName;
      }
      
      // Use appropriate item type in log messages
      let typeLabel = 'item';
      if (migrationType === 'screens') typeLabel = 'screen';
      else if (migrationType === 'categories') typeLabel = 'category icon';
      else typeLabel = 'logo';
      
      console.log(`Using ${typeLabel} title: ${itemTitle}`);
      
      // Get the first attachment from the record using the appropriate field
      const attachment = record.fields[attachmentField][0];
      console.log(`Processing ${itemType} ${attachment.filename} from record ${record.id}`);
      
      // Upload the image to Cloudinary
      const cloudinaryResult = await uploadImageFromUrl(
        attachment.url,
        itemName,
        itemTitle,
        { 
          folder: folderPath,
          transformation: { quality: 'auto:good', format: 'auto' } 
        }
      );
      
      if (cloudinaryResult) {
        // Update the record in Airtable with the secure Cloudinary URL
        const updated = await updateRecordWithCloudinaryUrl(record.id, cloudinaryResult.secure_url, migrationType);
        
        if (updated) {
          console.log(`Successfully updated ${itemType} record ${record.id} with Cloudinary URL: ${cloudinaryResult.secure_url}`);
          success++;
        } else {
          console.error(`Failed to update ${itemType} record ${record.id} in Airtable`);
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
 * @param maxRecords - Maximum number of records to process
 * @param options - Options for the migration (batchSize, delayBetweenBatches, migrationType)
 */
export async function migrateAirtableImagesToCloudinary(
  maxRecords = 100,
  options = { batchSize: 10, delayBetweenBatches: 1000, migrationType: 'screens' }
): Promise<{ total: number, success: number, failed: number }> {
  // Get the migration type from options (defaulting to screens if not specified)
  const migrationType = options.migrationType || 'screens';
  let itemType;
  
  if (migrationType === 'screens') {
    itemType = 'screen images';
  } else if (migrationType === 'categories') {
    itemType = 'category icons';
  } else { // logos
    itemType = 'app logos';
  }
  
  console.log(`Starting migration of Airtable ${itemType} to Cloudinary...`);
  
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
        offset,
        migrationType
      );
      
      if (!response.records || response.records.length === 0) {
        console.log('No more records to process.');
        break;
      }
      
      const { success, failed } = await processBatch(response.records, migrationType);
      
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