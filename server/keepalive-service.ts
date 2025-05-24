/**
 * Keepalive Service for Airtable Connections
 * 
 * This service maintains active connections to Airtable by periodically
 * refreshing data and performing small requests to prevent connection timeouts.
 * It ensures the application remains responsive even after periods of inactivity.
 */

import axios from 'axios';
import { storage } from './storage';

// Airtable API constants
const AIRTABLE_API_URL = 'https://api.airtable.com/v0';

// Connection state tracking
let lastActivityTimestamp = Date.now();
let isInitialized = false;
let keepaliveInterval: NodeJS.Timeout | null = null;
let refreshInterval: NodeJS.Timeout | null = null;

// Configuration
const KEEPALIVE_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes
const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes
const MAX_INACTIVITY_MS = 10 * 60 * 1000; // 10 minutes

/**
 * Initialize the keepalive service
 */
export function initKeepAliveService(apiKey: string, baseId: string) {
  if (isInitialized) return;
  
  console.log('Initializing Airtable keepalive service...');
  
  // Track activity on API endpoints
  trackActivity();
  
  // Set up keepalive ping
  keepaliveInterval = setInterval(() => {
    performKeepalive(apiKey, baseId);
  }, KEEPALIVE_INTERVAL_MS);
  
  // Set up data refresh
  refreshInterval = setInterval(() => {
    performDataRefresh(apiKey, baseId);
  }, REFRESH_INTERVAL_MS);
  
  isInitialized = true;
}

/**
 * Track API activity to avoid unnecessary pings
 */
function trackActivity() {
  // Update timestamp when any API route is accessed
  lastActivityTimestamp = Date.now();
}

/**
 * Perform a minimal Airtable request to keep the connection alive
 */
async function performKeepalive(apiKey: string, baseId: string) {
  // Skip if there was recent activity
  const timeSinceLastActivity = Date.now() - lastActivityTimestamp;
  
  if (timeSinceLastActivity < MAX_INACTIVITY_MS) {
    console.log(`Skipping keepalive, last activity was ${Math.round(timeSinceLastActivity / 1000)} seconds ago`);
    return;
  }
  
  try {
    console.log('Performing Airtable keepalive ping...');
    
    // Minimal Airtable request - just fetch one record from apps table
    // This keeps the connection alive without doing a full sync
    const response = await axios.get(`${AIRTABLE_API_URL}/${baseId}/apps`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      params: {
        maxRecords: 1, // Only fetch one record to minimize bandwidth
        view: 'apps-list',
      }
    });
    
    console.log(`Airtable keepalive successful, received ${response.data?.records?.length || 0} records`);
    lastActivityTimestamp = Date.now();
  } catch (error) {
    console.error('Airtable keepalive failed:', error);
  }
}

/**
 * Perform a complete data refresh
 */
async function performDataRefresh(apiKey: string, baseId: string) {
  try {
    console.log('Performing full Airtable data refresh...');
    await storage.syncFromAirtable(apiKey, baseId);
    console.log('Airtable data refresh completed successfully');
    lastActivityTimestamp = Date.now();
  } catch (error) {
    console.error('Airtable data refresh failed:', error);
  }
}

/**
 * Manually trigger a data refresh
 */
export async function triggerDataRefresh(apiKey: string, baseId: string) {
  try {
    console.log('Manually triggering Airtable data refresh...');
    await storage.syncFromAirtable(apiKey, baseId);
    console.log('Manual Airtable data refresh completed successfully');
    lastActivityTimestamp = Date.now();
    return true;
  } catch (error) {
    console.error('Manual Airtable data refresh failed:', error);
    return false;
  }
}

/**
 * Stop the keepalive service
 */
export function stopKeepAliveService() {
  if (keepaliveInterval) {
    clearInterval(keepaliveInterval);
    keepaliveInterval = null;
  }
  
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
  
  isInitialized = false;
  console.log('Airtable keepalive service stopped');
}