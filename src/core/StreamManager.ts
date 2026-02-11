import { Server as SocketIOServer } from 'socket.io';
import { logger } from '../utils/logger.js';

export class StreamManager {
  private static io: SocketIOServer | null = null;

  static init(io: SocketIOServer) {
    this.io = io;
    this.io.on('connection', (socket) => {
      logger.info('UI Client Connected', { id: socket.id });
    });
  }

  static emit(event: string, data: any) {
    if (this.io) {
      try {
        this.io.emit(event, data);
      } catch (err: any) {
        logger.warn('Socket emit failed', { error: err.message, event });
      }
    }
  }

  static emitQueueUpdate(platform: string, pageId: string, status: 'queued' | 'processing' | 'completed' | 'failed', details: any) {
    // Sanitized payload for public display
    const payload = {
      pageId,
      status,
      platform,
      timestamp: Date.now(),
      // Use local logo cache proxy with platform
      profilePic: `/logo/${platform}/${pageId}`, 
      ...details
    };
    
    this.emit('queue_update', payload);
  }
}
