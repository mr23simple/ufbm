import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../src/server.js';

describe('Refined Dry Run & Validation Tests', () => {

  describe('Zod Schema Refinements', () => {
    it('should fail if no caption and no altText are provided for a feed post', async () => {
      const res = await request(app)
        .post('/v1/post')
        .send({
          platform: 'fb',
          options: { publishToFeed: true, dryRun: true }
        });
      
      if (res.status !== 400 || !res.body.details) {
        console.log('DEBUG FULL RESPONSE:', JSON.stringify(res.body, null, 2));
      }

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation Error');
      const details = res.body.details;
      expect(details).toBeDefined();
      expect(details[0].message).toContain('caption or media alt-text is required');
    });

    it('should succeed if only media altText is provided (no global caption)', async () => {
      const res = await request(app)
        .post('/v1/post')
        .set('x-platform-id', '123')
        .set('x-platform-token', 'mock')
        .send({
          platform: 'fb',
          media: [{ source: 'https://example.com/img.png', type: 'image', altText: 'Specific Alt' }],
          options: { publishToFeed: true, dryRun: true }
        });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Facebook Token Validation (Dry Run)', () => {
    it('should pass dryRun with "mock" token', async () => {
      const res = await request(app)
        .post('/v1/post')
        .set('x-platform-id', '123')
        .set('x-platform-token', 'mock')
        .send({
          platform: 'fb',
          caption: 'Dry run test',
          options: { dryRun: true }
        });
      expect(res.status).toBe(200);
      expect(res.body.dryRunMetadata.accountName).toBe('Mock FB User');
    });

    it('should fail dryRun with an invalid/empty token (simulated failure)', async () => {
      // Any token that isn't 'mock' and isn't a real token will fail against FB API
      // We expect a 401/500 depending on how the error is caught
      const res = await request(app)
        .post('/v1/post')
        .set('x-platform-id', '123')
        .set('x-platform-token', 'invalid_token_123')
        .send({
          platform: 'fb',
          caption: 'Dry run test',
          options: { dryRun: true }
        });
      
      // Since it's a dryRun but with an 'invalid' real-looking token, 
      // the validateToken call to FB /me will actually fail.
      expect(res.status).toBe(401); 
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('AUTH_VALIDATION_FAILED');
    });
  });

  describe('Twitter Structural Validation (Dry Run)', () => {
    it('should fail if Twitter OAuth keys are missing one field', async () => {
      const partialCreds = JSON.stringify({
        appKey: 'mock', appSecret: 'mock', accessToken: 'mock'
        // missing accessSecret
      });
      const res = await request(app)
        .post('/v1/post')
        .set('x-platform-id', 'tw')
        .set('x-platform-token', Buffer.from(partialCreds).toString('base64'))
        .send({
          platform: 'x',
          caption: 'Twitter dry run',
          options: { dryRun: true }
        });
      
      // This fails in the SocialMediaService before execution due to parseCredentials check 
      // OR in validateToken. 
      expect(res.status).toBe(401); 
    });

    it('should fail if Twitter keys are too short (structural check)', async () => {
      const shortCreds = JSON.stringify({
        appKey: 'too-short', appSecret: 'valid-secret-length', 
        accessToken: 'short', accessSecret: 'valid-access-secret'
      });
      const res = await request(app)
        .post('/v1/post')
        .set('x-platform-id', 'tw')
        .set('x-platform-token', Buffer.from(shortCreds).toString('base64'))
        .send({
          platform: 'x',
          caption: 'Twitter dry run',
          options: { dryRun: true }
        });
      
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_VALIDATION_FAILED');
      expect(res.body.error.message).toContain('structurally invalid');
    });

    it('should pass if Twitter keys use "mock" keyword', async () => {
      const mockCreds = JSON.stringify({
        appKey: 'mock', appSecret: 'mock', accessToken: 'mock', accessSecret: 'mock'
      });
      const res = await request(app)
        .post('/v1/post')
        .set('x-platform-id', 'tw')
        .set('x-platform-token', Buffer.from(mockCreds).toString('base64'))
        .send({
          platform: 'x',
          caption: 'Twitter dry run',
          options: { dryRun: true }
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Slack Webhook Validation', () => {
    it('should fail if Slack Webhook URL is invalid', async () => {
      const res = await request(app)
        .post('/v1/slack/post')
        .set('x-platform-id', 'slack')
        .set('x-platform-token', 'https://invalid-domain.com/webhook')
        .send({
          caption: 'Slack test',
          options: { dryRun: true }
        });
      
      expect(res.status).toBe(500);
      expect(res.body.error).toContain('Invalid Slack Webhook URL');
    });

    it('should pass if Slack Webhook URL is structurally valid', async () => {
      const res = await request(app)
        .post('/v1/slack/post')
        .set('x-platform-id', 'slack')
        .set('x-platform-token', 'https://hooks.slack.com/services/T000/B000/XXXX')
        .send({
          caption: 'Slack test',
          options: { dryRun: true }
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Update Post Dry Run', () => {
    it('should validate token during update dryRun', async () => {
      const res = await request(app)
        .post('/v1/post/12345/update')
        .set('x-platform-id', '123')
        .set('x-platform-token', 'mock')
        .send({
          platform: 'fb',
          caption: 'Updated caption',
          dryRun: true
        });
      
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should fail update dryRun if token is invalid', async () => {
      const res = await request(app)
        .post('/v1/post/12345/update')
        .set('x-platform-id', '123')
        .set('x-platform-token', 'invalid-token')
        .send({
          platform: 'fb',
          caption: 'Updated caption',
          dryRun: true
        });
      
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('AUTH_VALIDATION_FAILED');
    });
  });

});
