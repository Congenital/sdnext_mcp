// tools/_common.js — 共享 zod 字段（生成类请求的公共参数）
import { z } from 'zod';

// StableDiffusionProcessing 核心参数（SD.Next 特有参数名，见 framework/01-sdnext-api/request-models.md）
export const coreGen = {
  prompt: z.string().describe('Positive prompt. Supports <wildcards> and [style:name] syntax.'),
  negative_prompt: z.string().optional().describe('Negative prompt.'),
  sd_model_checkpoint: z.string().optional().describe('Checkpoint model name or filename to use (from sdnext_list_checkpoints).'),
  seed: z.number().int().optional().describe('Random seed (-1 = random).'),
  subseed: z.number().int().optional().describe('Secondary seed (-1 = random).'),
  subseed_strength: z.number().optional().describe('How much to use the subseed (0-1).'),
  seed_resize_from_h: z.number().int().optional().describe('Resize from height for seed adjustment (-1 = disabled).'),
  seed_resize_from_w: z.number().int().optional().describe('Resize from width for seed adjustment (-1 = disabled).'),
  width: z.number().int().optional().describe('Image width in pixels.'),
  height: z.number().int().optional().describe('Image height in pixels.'),
  batch_size: z.number().int().positive().optional().describe('Number of images per iteration.'),
  n_iter: z.number().int().positive().optional().describe('Number of iterations (batches).'),
  steps: z.number().int().optional().describe('Sampling steps.'),
  clip_skip: z.number().int().optional().describe('CLIP skip value.'),
  sampler_name: z.string().optional().describe('Sampler name (from sdnext_list_samplers), e.g. "euler_a", "dpmpp_2m_sde".'),
  hr_sampler_name: z.string().optional().describe('Sampler for high-res fix ("Same as primary" by default).'),
  guidance_name: z.string().optional().describe('Modular guidance type (e.g. "Default", "CFGZero", "APG").'),
  guidance_scale: z.number().optional().describe('Modular guidance scale (new SD.Next guidance system).'),
  guidance_rescale: z.number().optional().describe('Guidance rescale (0-1).'),
  guidance_start: z.number().optional().describe('Guidance start step fraction (0-1).'),
  guidance_stop: z.number().optional().describe('Guidance stop step fraction (0-1).'),
  cfg_scale: z.number().optional().describe('Legacy CFG scale (guidance_scale when guidance_name=CFG).'),
  cfg_end: z.number().optional().describe('Legacy CFG end step fraction.'),
  cfg_rescale: z.number().optional().describe('Legacy CFG rescale.'),
  cfg_true: z.number().optional().describe('True CFG scale (SD3/Flux style).'),
  cfg_adaptive: z.number().optional().describe('Adaptive CFG (0-1).'),
  styles: z.array(z.string()).optional().describe('Style names to apply (from sdnext_list_styles).'),
  tiling: z.boolean().optional().describe('Use VAE tiling (saves VRAM, may degrade quality).'),
  vae_type: z.string().optional().describe('VAE type: "Full" or "Tiled".'),
  do_not_save_samples: z.boolean().optional().describe('Do not save samples to disk.'),
  do_not_save_grid: z.boolean().optional().describe('Do not save grid image.'),
  send_images: z.boolean().optional().describe('Return base64 images in response (default true).'),
  save_images: z.boolean().optional().describe('Save images to disk.'),
  script_name: z.string().optional().describe('Script to run (from sdnext_list_scripts).'),
  script_args: z.array(z.any()).optional().describe('Script arguments, positional order matching script args.'),
  alwayson_scripts: z.record(z.array(z.any())).optional().describe('Always-on script args keyed by script name.'),
};

// 高分辨率修复（SD.Next 将 hires 参数平铺到主请求体）
export const hiresGen = {
  enable_hr: z.boolean().optional().describe('Enable high-res fix (two-pass generation).'),
  hr_scale: z.number().optional().describe('High-res fix scale factor.'),
  hr_resize_x: z.number().int().optional().describe('High-res fix target width.'),
  hr_resize_y: z.number().int().optional().describe('High-res fix target height.'),
  hr_second_pass_steps: z.number().int().optional().describe('Steps for second pass (0 = full steps).'),
  hr_denoising_strength: z.number().optional().describe('High-res fix denoising strength (0-1).'),
  hr_upscaler: z.string().optional().describe('Upscaler for high-res fix.'),
};

// refiner
export const refinerGen = {
  refiner_steps: z.number().int().optional().describe('Refiner steps (0 = disabled).'),
  refiner_start: z.number().optional().describe('Refiner start step fraction (0-1).'),
  refiner_prompt: z.string().optional().describe('Refiner prompt override.'),
  refiner_negative: z.string().optional().describe('Refiner negative prompt override.'),
};

// detailer (SD.Next built-in YOLO detailer)
export const detailerGen = {
  detailer_enabled: z.boolean().optional().describe('Enable built-in YOLO detailer.'),
  detailer_prompt: z.string().optional().describe('Detailer prompt.'),
  detailer_negative: z.string().optional().describe('Detailer negative prompt.'),
  detailer_steps: z.number().int().optional().describe('Detailer steps.'),
  detailer_strength: z.number().optional().describe('Detailer denoising strength.'),
  detailer_resolution: z.number().int().optional().describe('Detailer resolution.'),
  detailer_models: z.array(z.string()).optional().describe('Detailer model names (from sdnext_list_detailers).'),
  detailer_classes: z.string().optional().describe('Comma-separated YOLO classes to detail (default: person).'),
};

// LoRA / extra networks — SD.Next 用 prompt 中的 <lora:name:weight> 语法；也支持 extra 字段
export const loraGen = {
  lora_fuse_native: z.boolean().optional().describe('Fuse LoRA via native weights (fast, no TE recompile).'),
  lora_fuse_diffusers: z.boolean().optional().describe('Fuse LoRA via diffusers (slower, most compatible).'),
  lora_force_reload: z.boolean().optional().describe('Force LoRA reload.'),
  extra_networks_default_multiplier: z.number().optional().describe('Default multiplier for extra networks mentioned in prompt.'),
};

// image input — 接受三种形态，统一转成 SD.Next 期望的裸 base64
import { z as zz } from 'zod';
const img = zz.string().describe('Base64-encoded image (raw base64, data: URL, or "upload:<id>" ref from sdnext_upload).');
export const img2imgGen = {
  init_images: z.array(img).optional().describe('Input images for img2img (base64).'),
  denoising_strength: z.number().optional().describe('Denoising strength (0-1).'),
  mask: img.optional().describe('Mask image (white = repaint area) for inpainting.'),
  mask_blur: z.number().int().optional().describe('Mask blur radius in pixels.'),
  inpainting_mask_invert: z.boolean().optional().describe('Invert inpainting mask.'),
  inpaint_full_res: z.boolean().optional().describe('Inpaint at full resolution.'),
  inpaint_full_res_padding: z.number().int().optional().describe('Padding for full-res inpaint.'),
  inpainting_fill: z.number().int().optional().describe('Inpaint fill mode: 0=latent, 1=image, 2=blur, 3=latent_noise.'),
  inpainting_mask_weight: z.number().optional().describe('Inpainting mask weight (0-1).'),
  img2img_color_correction: z.boolean().optional().describe('Enable color correction.'),
  img2img_fix_steps: z.boolean().optional().describe('Fix steps for img2img.'),
  paste_to: z.string().optional().describe('Paste result to: "None", "Mask", "Picture".'),
  include_init_images: z.boolean().optional().describe('Include init images in response.'),
};

// control units — 对应 modules/api/models.py ItemControlUnit
const controlUnit = z.object({
  process: z.string().optional().describe('Preprocessor name, e.g. "Canny", "OpenPose", "Depth Anything" (from sdnext_list_preprocessors).'),
  model: z.string().optional().describe('Control model name (from sdnext_list_controlnets).'),
  strength: z.number().optional().describe('Control strength (0-2, default 1.0).'),
  start: z.number().optional().describe('Start step fraction (0-1, default 0).'),
  end: z.number().optional().describe('End step fraction (0-1, default 1).'),
  image: z.string().optional().describe('Base64 control input image.'),
  override: z.string().optional().describe('Base64 pre-processed control image (bypasses preprocessor).'),
  unit_type: z.string().optional().describe("Unit type: 'controlnet', 't2i adapter', 'xs', 'lite', 'reference', 'ip'."),
  mode: z.string().optional().describe('Control mode for Union/ProMax models (from sdnext_list_control_modes).'),
  guess: z.boolean().optional().describe('Guess mode (ControlNet only).'),
  factor: z.number().optional().describe('Adapter factor (T2I adapter only).'),
  process_params: z.record(z.any()).optional().describe('Preprocessor parameter overrides.'),
});

export const controlGen = {
  control_units: z.array(controlUnit).optional().describe('ControlNet/control units to apply.'),
  init_control: z.array(z.any()).optional().describe('Legacy init_control format.'),
  face: z.object({
    mode: z.string().optional().describe("Mode: 'FaceID', 'FaceSwap', 'PhotoMaker', 'InstantID'."),
    source_images: z.array(z.string()).optional().describe('Base64 source face images.'),
    ip_model: z.string().optional().describe('IPAdapter model (from sdnext_list_ip_adapters).'),
    ip_strength: z.number().optional().describe('IPAdapter strength (0-2).'),
    ip_structure: z.number().optional().describe('IPAdapter structure (0-1).'),
    ip_override_sampler: z.boolean().optional(),
    ip_cache_model: z.boolean().optional(),
    id_strength: z.number().optional().describe('InstantID strength.'),
    id_conditioning: z.number().optional().describe('InstantID conditioning.'),
    id_cache: z.boolean().optional(),
    pm_trigger: z.string().optional().describe('PhotoMaker trigger word.'),
    pm_strength: z.number().optional().describe('PhotoMaker strength.'),
    pm_start: z.number().optional().describe('PhotoMaker start (0-1).'),
    fs_cache: z.boolean().optional(),
  }).optional().describe('Face-driven generation module (FaceID/FaceSwap/PhotoMaker/InstantID).'),
  ip_adapter: z.array(z.object({
    adapter: z.string().optional().describe('IP adapter name.'),
    images: z.array(z.string()).optional().describe('Base64 input images.'),
    masks: z.array(z.string()).optional().describe('Base64 mask images.'),
    scale: z.number().optional().describe('Scale (0-1, default 0.5).'),
    start: z.number().optional().describe('Start step fraction.'),
    end: z.number().optional().describe('End step fraction.'),
    crop: z.boolean().optional().describe('Crop face from input.'),
  })).optional().describe('IP adapter conditioning units.'),
};

// XYZ grid
export const xyzGen = {
  xyz: z.object({
    x_type: z.string().optional().describe('X axis parameter (from sdnext_list_xyz_options).'),
    x_values: z.string().optional().describe('Comma-separated X values.'),
    y_type: z.string().optional(),
    y_values: z.string().optional(),
    z_type: z.string().optional(),
    z_values: z.string().optional(),
    draw_legend: z.boolean().optional(),
    include_grid: z.boolean().optional(),
    include_subgrids: z.boolean().optional(),
    include_images: z.boolean().optional(),
    include_time: z.boolean().optional(),
    include_text: z.boolean().optional(),
  }).optional().describe('XYZ grid parameter sweep configuration.'),
};
