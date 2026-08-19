// tools/generation.js — 生成类工具：txt2img / img2img / control / process / detail / prompt enhance
import { z } from 'zod';
import { client, clean } from '../client.js';
import { saveImages } from '../image.js';
import { registerTool } from '../registry.js';
import { coreGen, hiresGen, refinerGen, detailerGen, loraGen, img2imgGen, controlGen, xyzGen } from './_common.js';

function withSave() {
  return {
    ...coreGen,
    ...hiresGen,
    ...refinerGen,
    ...detailerGen,
    ...loraGen,
    save_dir: z.string().optional().describe('Local directory to write returned images into (creates it).'),
  };
}

function shapeImages(data, args) {
  const images = Array.isArray(data?.images) ? data.images : [];
  const written = saveImages(images, { dir: args.save_dir });
  return {
    ...(data ?? {}),
    images,
    ...(written.length ? { saved_files: written } : {}),
    info: data?.info,
    parameters: data?.parameters,
  };
}

export function register(server) {
  // ── text2img ────────────────────────────────────────────────────────────
  registerTool(server, {
    name: 'sdnext_txt2img',
    title: 'Text to Image',
    method: 'POST',
    path: '/sdapi/v1/txt2img',
    description: 'Generate images from text prompts (SD.Next /sdapi/v1/txt2img). Supports samplers, modular guidance, hires fix, refiner, detailer, LoRA (prompt <lora:name:weight>), styles, scripts, control units, face modules, XYZ grid. Returns base64 images, info string, and echoed parameters.',
    inputSchema: { ...withSave(), ...controlGen, ...xyzGen },
    handler: async (args) => shapeImages(await client.post('/sdapi/v1/txt2img', { body: clean({ ...args }) }), args),
  });

  // ── img2img ─────────────────────────────────────────────────────────────
  registerTool(server, {
    name: 'sdnext_img2img',
    title: 'Image to Image',
    method: 'POST',
    path: '/sdapi/v1/img2img',
    description: 'Generate images from input images with denoising (SD.Next /sdapi/v1/img2img). Supports inpainting via mask (white = repaint), color correction, hires fix, control units, and all txt2img parameters. init_images are base64 (or "upload:<id>" refs).',
    inputSchema: { ...withSave(), ...img2imgGen, ...controlGen, ...xyzGen },
    handler: async (args) => shapeImages(await client.post('/sdapi/v1/img2img', { body: clean({ ...args }) }), args),
  });

  // ── control (dedicated control-guided endpoint) ────────────────────────
  registerTool(server, {
    name: 'sdnext_control',
    title: 'Control-guided Generation',
    method: 'POST',
    path: '/sdapi/v1/control',
    description: 'Run the control-guided pipeline (SD.Next /sdapi/v1/control) with one or more control units (controlnet / t2i adapter / xs / lite / reference / ip). Returns generated images plus preprocessor output maps.',
    inputSchema: { ...coreGen, ...hiresGen, control_units: z.array(z.any()).describe('Control units (see sdnext_txt2img control_units).'), unit_type: z.string().optional().describe('Request-level default unit type.'), face: z.record(z.any()).optional(), ip_adapter: z.array(z.any()).optional(), xyz: z.record(z.any()).optional(), save_dir: z.string().optional() },
    handler: async (args) => shapeImages(await client.post('/sdapi/v1/control', { body: clean({ ...args }) }), args),
  });

  // ── extras: process single image (upscaler / HiresFix) ─────────────────
  registerTool(server, {
    name: 'sdnext_process_image',
    title: 'Upscale / Process Image',
    method: 'POST',
    path: '/sdapi/v1/process',
    description: 'Process a single image with the Extras pipeline (upscalers, e.g. from sdnext_list_upscalers). SD.Next /sdapi/v1/process. resize_mode 0 = factor, 1 = target w/h.',
    inputSchema: {
      image: z.string().describe('Base64 input image (or "upload:<id>").'),
      resize_mode: z.number().optional().describe('0 = upscale by factor, 1 = target width/height.'),
      upscaling_resize: z.number().min(1).max(8).optional().describe('Upscale factor (resize_mode=0).'),
      upscaling_resize_w: z.number().int().optional().describe('Target width (resize_mode=1).'),
      upscaling_resize_h: z.number().int().optional().describe('Target height (resize_mode=1).'),
      upscaling_crop: z.boolean().optional().describe('Crop to fit target size.'),
      upscaler_1: z.string().optional().describe('Main upscaler name.'),
      upscaler_2: z.string().optional().describe('Refine upscaler name.'),
      extras_upscaler_2_visibility: z.number().min(0).max(1).optional().describe('Secondary upscaler visibility.'),
      show_extras_results: z.boolean().optional().describe('Return the processed image.'),
      script_args: z.record(z.any()).optional().describe('Per-script args keyed by script name.'),
      save_dir: z.string().optional(),
    },
    handler: async (args) => {
      const data = await client.post('/sdapi/v1/process', { body: clean({ ...args }) });
      const out = { ...data };
      if (data?.image) { out.image = data.image; if (args.save_dir) out.saved_files = saveImages([data.image], { dir: args.save_dir }); }
      return out;
    },
  });

  // ── process batch ───────────────────────────────────────────────────────
  registerTool(server, {
    name: 'sdnext_process_batch',
    title: 'Upscale / Process Batch',
    method: 'POST',
    path: '/sdapi/v1/process-batch',
    description: 'Process multiple images at once (SD.Next /sdapi/v1/process-batch). Same options as sdnext_process_image plus an images array.',
    inputSchema: {
      images: z.array(z.string()).describe('Base64 input images.'),
      resize_mode: z.number().optional(), upscaling_resize: z.number().optional(), upscaling_resize_w: z.number().int().optional(),
      upscaling_resize_h: z.number().int().optional(), upscaling_crop: z.boolean().optional(),
      upscaler_1: z.string().optional(), upscaler_2: z.string().optional(), extras_upscaler_2_visibility: z.number().optional(),
      show_extras_results: z.boolean().optional(), script_args: z.record(z.any()).optional(), save_dir: z.string().optional(),
    },
    handler: async (args) => {
      const data = await client.post('/sdapi/v1/process-batch', { body: clean({ ...args }) });
      const out = { ...data };
      if (args.save_dir && Array.isArray(data?.images)) out.saved_files = saveImages(data.images, { dir: args.save_dir });
      return out;
    },
  });

  // ── detailer standalone ─────────────────────────────────────────────────
  registerTool(server, {
    name: 'sdnext_detail',
    title: 'Detailer Pass',
    method: 'POST',
    path: '/sdapi/v1/detail',
    description: 'Run the YOLO detailer on a single image as a standalone operation (SD.Next /sdapi/v1/detail) — no base generation pass. All detailer_* fields fall back to global settings when omitted.',
    inputSchema: {
      image: z.string().describe('Base64 input image.'),
      seed: z.number().int().optional(),
      detailer_models: z.array(z.string()).optional().describe('Detailer model names (from sdnext_list_detailers).'),
      detailer_prompt: z.string().optional(), detailer_negative: z.string().optional(),
      detailer_steps: z.number().int().optional(), detailer_strength: z.number().optional(),
      detailer_resolution: z.number().int().optional(), detailer_sampler: z.string().optional(),
      detailer_prediction: z.string().optional(), detailer_shift: z.number().optional(),
      detailer_cfg_scale: z.number().optional(), detailer_loworder: z.boolean().optional(),
      detailer_thresholding: z.boolean().optional(), detailer_dynamic: z.boolean().optional(),
      detailer_rescale: z.boolean().optional(), detailer_classes: z.string().optional(),
      detailer_conf: z.number().optional(), detailer_iou: z.number().optional(),
      detailer_max: z.number().int().optional(), detailer_min_size: z.number().optional(),
      detailer_max_size: z.number().optional(), detailer_blur: z.number().int().optional(),
      detailer_padding: z.number().int().optional(), detailer_segmentation: z.boolean().optional(),
      detailer_merge: z.boolean().optional(), detailer_sort: z.boolean().optional(),
      detailer_sigma_adjust: z.number().optional(), detailer_sigma_adjust_max: z.number().optional(),
      detailer_include_detections: z.boolean().optional(), save_dir: z.string().optional(),
    },
    handler: async (args) => {
      const data = await client.post('/sdapi/v1/detail', { body: clean({ ...args }) });
      const out = { ...data };
      if (args.save_dir) { const imgs = [out.image, out.detections].filter(Boolean); out.saved_files = saveImages(imgs, { dir: args.save_dir }); }
      return out;
    },
  });

  // ── prompt enhance (LLM) ────────────────────────────────────────────────
  registerTool(server, {
    name: 'sdnext_prompt_enhance',
    title: 'Enhance Prompt',
    method: 'POST',
    path: '/sdapi/v1/prompt-enhance',
    description: 'Enhance/expand a prompt with an LLM (SD.Next /sdapi/v1/prompt-enhance). Type: text, image, or video.',
    inputSchema: {
      prompt: z.string().describe('Prompt to enhance.'),
      type: z.enum(['text', 'image', 'video']).default('text'),
      model: z.string().optional().describe('Enhancement model name.'),
      system_prompt: z.string().optional(),
      image: z.string().optional().describe('Base64 image (for type=image).'),
      seed: z.number().int().optional().describe('Seed for prompt generation (-1 = random).'),
      nsfw: z.boolean().optional().describe('Allow NSFW content (default true).'),
      prefix: z.string().optional(), suffix: z.string().optional(),
      do_sample: z.boolean().optional(), min_tokens: z.number().int().optional(), max_tokens: z.number().int().optional(),
      temperature: z.number().optional(), repetition_penalty: z.number().optional(),
      top_k: z.number().int().optional(), top_p: z.number().optional(),
      thinking: z.boolean().optional(), keep_thinking: z.boolean().optional(),
      use_vision: z.boolean().optional(), prefill: z.string().optional(), keep_prefill: z.boolean().optional(),
      custom_args: z.string().optional(), process_words: z.string().optional(),
      semantic_threshold: z.number().optional(), embedding_similarity: z.number().optional(),
      use_openai: z.boolean().optional(),
    },
    handler: async (args) => client.post('/sdapi/v1/prompt-enhance', { body: clean({ ...args }) }),
  });
}
