import { SocialMediaService } from './SocialMediaService.js';
import { config } from '../config.js';
import { logger } from '../utils/logger.js';

export class SocialMediaRegistry {
  private static instances: Map<string, SocialMediaService> = new Map();

  /**
   * Retrieves or creates a service instance for a specific Platform and ID.
   * Key format: "platform:pageId" (e.g. "fb:12345", "x:98765")
   */
  static getInstance(platform: 'fb' | 'x', pageId: string, accessToken: string): SocialMediaService {
    // Include accessToken in key to ensure credential changes trigger new instance creation
    const key = `${platform}:${pageId}:${accessToken}`;
    
    if (!this.instances.has(key)) {
      logger.info('Creating new service instance', { platform, pageId });
      
      const instance = new SocialMediaService({
        platform,
        pageId,
        accessToken,
        concurrency: config.CONCURRENCY,
        publishRateLimit: config.PUBLISH_RATE_LIMIT
      });

      this.instances.set(key, instance);
    }
    
    return this.instances.get(key)!;
  }

  /**
   * Returns stats for all active instances.
   */
  static getGlobalStats() {
    return {
      dryRun: config.DRY_RUN,
      instances: Object.fromEntries(
        Array.from(this.instances.entries()).map(([id, service]) => [id, service.stats])
      )
    };
  }
}