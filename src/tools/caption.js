// tools/caption.js — 图像理解/打标类工具（SD.Next "Caption" tag）
import { z } from 'zod';
import { client } from '../client.js';
import { registerTool } from '../registry.js';

const img = z.string().describe('Base64-encoded image (raw base64, data: URL, or "upload:<id>" ref).');

export function register(server) {
  registerTool(server, {
    name: 'sdnext_caption',
    title: 'Caption Image (OpenCLIP)',
    method: 'POST',
    path: '/sdapi/v1/openclip',
    description: 'Generate a text caption/prompt from an image using OpenCLIP+BLIP (SD.Next /sdapi/v1/openclip POST). mode: best|fast|classic|caption|negative. Set analyze=true for medium/artist/movement/trending/flavor breakdown.',
    inputSchema: {
      image: img,
      model: z.string().optional().describe('OpenCLIP model (from sdnext_list_openclip), default "ViT-L-14/openai".'),
      clip_model: z.string().optional().describe('CLIP model for similarity matching.'),
      blip_model: z.string().optional().describe('BLIP caption model, default "blip-large".'),
      mode: z.enum(['best', 'fast', 'classic', 'caption', 'negative']).optional().describe('Caption mode (default "best").'),
      analyze: z.boolean().optional().describe('Return detailed analysis breakdown.'),
      max_length: z.number().int().optional(), chunk_size: z.number().int().optional(),
      min_flavors: z.number().int().optional(), max_flavors: z.number().int().optional(),
      flavor_count: z.number().int().optional(), num_beams: z.number().int().optional(),
    },
    handler: (args) => client.post('/sdapi/v1/openclip', { body: args }),
  });

  registerTool(server, {
    name: 'sdnext_caption_dispatch',
    title: 'Caption (any backend)',
    method: 'POST',
    path: '/sdapi/v1/caption',
    description: 'Unified caption dispatch (SD.Next /sdapi/v1/caption) — pick backend: "openclip" | "tagger" | "vlm" | "analyze". Returns a unified response (caption/tags/answer depending on backend).',
    inputSchema: {
      backend: z.enum(['openclip', 'tagger', 'vlm', 'analyze']).describe('Caption backend to use.'),
      image: img,
      // openclip fields
      model: z.string().optional(), clip_model: z.string().optional(), blip_model: z.string().optional(),
      mode: z.enum(['best', 'fast', 'classic', 'caption', 'negative']).optional(), analyze: z.boolean().optional(),
      // tagger fields
      threshold: z.number().optional(), character_threshold: z.number().optional(),
      max_tags: z.number().int().optional(), include_rating: z.boolean().optional(),
      sort_alpha: z.boolean().optional(), use_spaces: z.boolean().optional(),
      escape_brackets: z.boolean().optional(), exclude_tags: z.string().optional(), show_scores: z.boolean().optional(),
      // vlm fields
      question: z.string().optional().describe('VLM task, e.g. "Short Caption", "Normal Caption", "Long Caption", "Use Prompt".'),
      prompt: z.string().optional(), system: z.string().optional(), include_annotated: z.boolean().optional(),
      max_tokens: z.number().int().optional(), temperature: z.number().optional(),
      top_k: z.number().int().optional(), top_p: z.number().optional(),
      num_beams: z.number().int().optional(), do_sample: z.boolean().optional(),
      thinking_mode: z.boolean().optional(), prefill: z.string().optional(),
      keep_thinking: z.boolean().optional(), keep_prefill: z.boolean().optional(),
    },
    handler: (args) => client.post('/sdapi/v1/caption', { body: args }),
  });

  registerTool(server, {
    name: 'sdnext_tagger',
    title: 'Anime Tagger',
    method: 'POST',
    path: '/sdapi/v1/tagger',
    description: 'Tag an image with anime tags (Danbooru-style) using wd-tagger / DeepDanbooru (SD.Next /sdapi/v1/tagger). Model names from sdnext_list_tagger_models.',
    inputSchema: {
      image: img,
      model: z.string().optional().describe('Tagger model, default "wd-eva02-large-tagger-v3".'),
      threshold: z.number().optional().describe('Overall tag threshold (default 0.5).'),
      character_threshold: z.number().optional().describe('Character tag threshold (default 0.85).'),
      max_tags: z.number().int().optional().describe('Max tags (default 74).'),
      include_rating: z.boolean().optional(), sort_alpha: z.boolean().optional(),
      use_spaces: z.boolean().optional(), escape_brackets: z.boolean().optional(),
      exclude_tags: z.string().optional().describe('Comma-separated tags to exclude.'),
      show_scores: z.boolean().optional().describe('Return per-tag scores.'),
    },
    handler: (args) => client.post('/sdapi/v1/tagger', { body: args }),
  });

  registerTool(server, {
    name: 'sdnext_vqa',
    title: 'VQA / VLM Analysis',
    method: 'POST',
    path: '/sdapi/v1/vqa',
    description: 'Ask a vision-language model about an image (SD.Next /sdapi/v1/vqa). Question is a task name (e.g. "Short Caption", "Object Detection", "Use Prompt"). Models from sdnext_list_vqa_models, tasks from sdnext_list_vqa_prompts.',
    inputSchema: {
      image: img,
      model: z.string().optional().describe('VLM name, default "Alibaba Qwen 2.5 VL 3B".'),
      question: z.string().optional().describe('Task/question (default "describe the image").'),
      prompt: z.string().optional().describe('Custom prompt when question="Use Prompt".'),
      system: z.string().optional().describe('System prompt.'),
      include_annotated: z.boolean().optional().describe('Return annotated image for detection tasks.'),
      max_tokens: z.number().int().optional(), temperature: z.number().optional(),
      top_k: z.number().int().optional(), top_p: z.number().optional(),
      num_beams: z.number().int().optional(), do_sample: z.boolean().optional(),
      thinking_mode: z.boolean().optional(), prefill: z.string().optional(),
      keep_thinking: z.boolean().optional(), keep_prefill: z.boolean().optional(),
    },
    handler: (args) => client.post('/sdapi/v1/vqa', { body: args }),
  });

  registerTool(server, {
    name: 'sdnext_analyze',
    title: 'Analyze Image (VLM)',
    method: 'POST',
    path: '/sdapi/v1/analyze',
    description: 'Analyze an image with the VLM "analyze" task (SD.Next /sdapi/v1/analyze). Same request shape as sdnext_vqa.',
    inputSchema: {
      image: img,
      model: z.string().optional(), question: z.string().optional(), prompt: z.string().optional(),
      system: z.string().optional(), include_annotated: z.boolean().optional(),
      max_tokens: z.number().int().optional(), temperature: z.number().optional(),
      top_k: z.number().int().optional(), top_p: z.number().optional(),
      num_beams: z.number().int().optional(), do_sample: z.boolean().optional(),
      thinking_mode: z.boolean().optional(), prefill: z.string().optional(),
      keep_thinking: z.boolean().optional(), keep_prefill: z.boolean().optional(),
    },
    handler: (args) => client.post('/sdapi/v1/analyze', { body: args }),
  });
}
