/**
 * Simple ID obfuscation utility to hide internal Airtable record IDs
 * This creates a consistent mapping between internal IDs and public IDs
 */

import crypto from 'crypto';

class IdObfuscator {
  private readonly salt = 'designpublico_2024'; // Static salt for consistency
  private internalToPublic: Map<string, string> = new Map();
  private publicToInternal: Map<string, string> = new Map();

  /**
   * Generate a consistent public ID from an internal ID
   */
  obfuscate(internalId: string): string {
    if (this.internalToPublic.has(internalId)) {
      return this.internalToPublic.get(internalId)!;
    }

    // Create a consistent hash-based public ID
    const hash = crypto.createHash('sha256');
    hash.update(internalId + this.salt);
    const publicId = hash.digest('hex').substring(0, 12); // Use first 12 chars

    // Store the mapping
    this.internalToPublic.set(internalId, publicId);
    this.publicToInternal.set(publicId, internalId);

    return publicId;
  }

  /**
   * Convert a public ID back to internal ID
   */
  deobfuscate(publicId: string): string | null {
    return this.publicToInternal.get(publicId) || null;
  }

  /**
   * Clear all mappings (useful for testing)
   */
  clear(): void {
    this.internalToPublic.clear();
    this.publicToInternal.clear();
  }
}

// Export a singleton instance
export const idObfuscator = new IdObfuscator();