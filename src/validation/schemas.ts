import { z } from 'zod';
import { WorkloadPriority } from '../types/index.js';

export const MediaSchema = z.object({
  source: z.union([z.instanceof(Buffer), z.string()]),
  type: z.enum(['image', 'video']),
  mimeType: z.string().optional(),
  altText: z.string().optional(),
  alt_text: z.string().optional(),
}).transform(data => ({
  ...data,
  altText: data.altText || data.alt_text,
}));

export const PostRequestSchema = z.object({
  platform: z.enum(['fb', 'x']),
  caption: z.string().optional(),
  media: z.array(MediaSchema).optional(),
  priority: z.nativeEnum(WorkloadPriority).default(WorkloadPriority.NORMAL),
  options: z.object({
    publishToFeed: z.boolean().default(true),
    publishToStory: z.boolean().default(false),
    dryRun: z.boolean().default(false),
    validateToken: z.boolean().default(false),
    retryConfig: z.object({
      maxRetries: z.number().default(3),
      backoffMs: z.number().default(1000),
    }).optional(),
  }).optional(),
}).refine(data => {
  // X (Twitter) allows media-only posts without text
  if (data.platform === 'x') return true;

  const needsText = data.options?.publishToFeed !== false || data.options?.publishToStory === true;
  if (!needsText) return true;

  // Has global caption OR at least one media has altText (which FB uses as a fallback message)
  const hasGlobalCaption = !!data.caption && data.caption.trim().length > 0;
  const hasMediaAlt = data.media && data.media.length > 0 && data.media.some(m => {
    const text = m.altText || (m as any).alt_text;
    return !!text && text.trim().length > 0;
  });
  
  return hasGlobalCaption || hasMediaAlt;
}, {
  message: "A caption or media alt-text is required for Facebook posts and stories.",
  path: ["caption"]
});

export type PostRequest = z.infer<typeof PostRequestSchema>;