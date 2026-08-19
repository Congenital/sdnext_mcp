// tools/control.js — Control 预处理/分割/检测（process.py 的 preprocess/mask/detect）
import { z } from 'zod';
import { client } from '../client.js';
import { registerTool } from '../registry.js';

const img = z.string().describe('Base64-encoded image (raw base64, data: URL, or "upload:<id>" ref).');

export function register(server) {
  registerTool(server, {
    name: 'sdnext_preprocess',
    title: 'Run Control Preprocessor',
    method: 'POST',
    path: '/sdapi/v1/preprocess',
    description: 'Run a control preprocessor (canny, depth, pose, lineart, ...) on an image and return the processed map (SD.Next /sdapi/v1/preprocess). Preprocessor names from sdnext_list_preprocessors.',
    inputSchema: z.object({
      image: img,
      model: z.string().describe('Preprocessor name (e.g. "canny", "depth_midas", "pose_dwpose", "lineart_realistic").'),
      params: z.record(z.any()).optional().describe('Preprocessor settings (see sdnext_list_preprocessors params).'),
    }),
    handler: (args) => client.post('/sdapi/v1/preprocess', { body: args }),
  });

  registerTool(server, {
    name: 'sdnext_mask',
    title: 'Generate Segmentation Mask',
    method: 'POST',
    path: '/sdapi/v1/mask',
    description: 'Generate a segmentation mask for an image (SD.Next /sdapi/v1/mask). Auto-masks when no mask is given. Mask models/types from sdnext_list_masking.',
    inputSchema: z.object({
      image: img,
      type: z.string().describe('Mask type to return (e.g. "original", "mask", "colormap").'),
      mask: z.string().optional().describe('Optional existing mask image (base64); omitted = auto-masking.'),
      model: z.string().optional().describe('Segmentation model name (from sdnext_list_masking).'),
      params: z.record(z.any()).optional().describe('Masking settings (colormap, thresholds, ...).'),
    }),
    handler: (args) => client.post('/sdapi/v1/mask', { body: args }),
  });

  registerTool(server, {
    name: 'sdnext_detect',
    title: 'Detect Faces/Objects (YOLO)',
    method: 'POST',
    path: '/sdapi/v1/detect',
    description: 'Detect faces/objects in an image with YOLO (SD.Next /sdapi/v1/detect). Returns classes, labels, boxes, crops, scores.',
    inputSchema: z.object({
      image: img,
      model: z.string().optional().describe('Detection model name (from sdnext_list_detailers).'),
    }),
    handler: (args) => client.post('/sdapi/v1/detect', { body: args }),
  });
}
