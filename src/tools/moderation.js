// tools/moderation.js — 内容审核/防护（nudenet / prompt 检查 / image-guard）
import { z } from 'zod';
import { client } from '../client.js';
import { registerTool } from '../registry.js';

const img = z.string().describe('Base64-encoded image (raw base64, data: URL, or "upload:<id>" ref).');

export function register(server) {
  registerTool(server, {
    name: 'sdnext_nudenet',
    title: 'NudeNet Censor',
    method: 'POST',
    path: '/sdapi/v1/nudenet',
    description: 'Censor explicit regions in an image with NudeNet (SD.Next /sdapi/v1/nudenet). Methods: pixelate, blur, mosaic, overlay.',
    inputSchema: z.object({
      image: img,
      score: z.number().min(0).max(1).optional().default(0.2).describe('Detection threshold score.'),
      blocks: z.number().int().optional().default(3).describe('Pixelation block size.'),
      censor: z.array(z.string()).optional().describe('NudeNet class items to censor (empty = all).'),
      method: z.enum(['pixelate', 'blur', 'mosaic', 'overlay']).optional().default('pixelate'),
      overlay: z.string().optional().describe('Overlay image path (for method=overlay).'),
    }),
    handler: (args) => client.post('/sdapi/v1/nudenet', { body: args }),
  });

  registerTool(server, {
    name: 'sdnext_prompt_lang',
    title: 'Check Prompt Language',
    method: 'POST',
    path: '/sdapi/v1/prompt-lang',
    description: 'Check whether a prompt uses an allowed language/alphabet (SD.Next /sdapi/v1/prompt-lang).',
    inputSchema: z.object({
      prompt: z.string().describe('Prompt text to check.'),
      lang: z.string().optional().default('eng').describe('Allowed language code(s).'),
      alphabet: z.string().optional().default('latn').describe('Allowed alphabet(s).'),
    }),
    handler: (args) => client.post('/sdapi/v1/prompt-lang', { body: args }),
  });

  registerTool(server, {
    name: 'sdnext_image_guard',
    title: 'Image Guard Policy',
    method: 'POST',
    path: '/sdapi/v1/image-guard',
    description: 'Run an image through a content-safety policy/guard model (SD.Next /sdapi/v1/image-guard).',
    inputSchema: z.object({
      image: img,
      policy: z.string().optional().describe('Policy definition.'),
      model: z.string().optional().describe('Guard model name.'),
    }),
    handler: (args) => client.post('/sdapi/v1/image-guard', { body: args }),
  });

  registerTool(server, {
    name: 'sdnext_prompt_banned',
    title: 'Check Banned Words',
    method: 'POST',
    path: '/sdapi/v1/prompt-banned',
    description: 'Check a prompt against a banned-words list and return matched words (SD.Next /sdapi/v1/prompt-banned).',
    inputSchema: z.object({
      words: z.string().optional().describe('Comma-separated banned words (default: server banned list).'),
      prompt: z.string().describe('Prompt text to check.'),
    }),
    handler: (args) => client.post('/sdapi/v1/prompt-banned', { body: args }),
  });
}
