import { Request, Response, NextFunction } from 'express';

// Queue implementation for managing concurrent image processing
interface QueueItem {
  resolve: () => void;
}

class ImageProcessingQueue {
  private queue: QueueItem[] = [];
  private active = 0;
  private maxConcurrent: number;
  private delay: number;

  constructor(maxConcurrent = 5, delay = 50) {
    this.maxConcurrent = maxConcurrent;
    this.delay = delay;
  }

  /**
   * Adds a request to the processing queue
   */
  async enqueue(): Promise<void> {
    if (this.active < this.maxConcurrent) {
      this.active++;
      return Promise.resolve();
    }

    return new Promise<void>(resolve => {
      this.queue.push({ resolve });
    });
  }

  /**
   * Releases a slot and processes the next item in the queue
   */
  dequeue(): void {
    if (this.queue.length > 0) {
      // Get next item
      const item = this.queue.shift()!;
      
      // Introduce a small delay to prevent overwhelming the server
      setTimeout(() => {
        item.resolve();
      }, this.delay);
    } else {
      this.active--;
    }
  }
}

// Create a global queue instance
const imageQueue = new ImageProcessingQueue();

/**
 * Middleware that enforces a maximum number of concurrent image processing requests
 * to prevent overwhelming the server
 */
export function imageRateLimit(req: Request, res: Response, next: NextFunction) {
  // Only apply to image requests
  if (!req.path.includes('/v5.airtableusercontent.com/')) {
    return next();
  }

  // Try to get a processing slot
  imageQueue.enqueue()
    .then(() => {
      // Add a listener to release the slot when the response is finished
      res.on('finish', () => {
        imageQueue.dequeue();
      });
      
      // Continue with request
      next();
    })
    .catch(err => {
      console.error('Error in image queue:', err);
      next(err);
    });
}