// tools/server.js — 服务器状态/队列/日志/历史/存储/GPU（"Server" tag）
import { z } from 'zod';
import { client } from '../client.js';
import { registerTool } from '../registry.js';

let srv;
function get(name, title, description, path, schema) {
  registerTool(srv, {
    name, title, description, method: 'GET', path,
    inputSchema: schema ?? {},
    handler: (args) => client.get(path, { query: args && Object.keys(args).length ? args : undefined }),
  });
}
function post(name, title, description, path, schema, destructive = false) {
  registerTool(srv, {
    name, title, description, method: 'POST', path,
    inputSchema: schema ?? {},
    ...(destructive ? { destructive: true, annotations: { readOnlyHint: false, destructiveHint: true } } : {}),
    handler: (args) => client.post(path, { body: args && Object.keys(args).length ? args : undefined }),
  });
}

export function register(server) {
  srv = server;
  get('sdnext_status', 'Server Status',
    'Get server/queue status: current job, step/steps, queue, uptime (GET /sdapi/v1/status).', '/sdapi/v1/status');
  get('sdnext_progress', 'Queue Progress',
    'Poll generation progress: progress 0-1, ETA, state, current image (GET /sdapi/v1/progress).',
    '/sdapi/v1/progress',
    z.object({ skip_current_image: z.boolean().optional().describe('Skip current image serialization to save bandwidth.') }));
  post('sdnext_interrupt', 'Interrupt Generation',
    'Interrupt the current generation job (POST /sdapi/v1/interrupt).', '/sdapi/v1/interrupt');
  post('sdnext_skip', 'Skip Image',
    'Skip the current image in the queue (POST /sdapi/v1/skip).', '/sdapi/v1/skip');
  post('sdnext_restart', 'Restart Server',
    'Restart the SD.Next server (POST /sdapi/v1/restart). DESTRUCTIVE.', '/sdapi/v1/restart', undefined, true);
  post('sdnext_shutdown', 'Shutdown Server',
    'Shut down the SD.Next server (POST /sdapi/v1/shutdown). DESTRUCTIVE.', '/sdapi/v1/shutdown', undefined, true);
  get('sdnext_motd', 'Message of the Day',
    'Get the server MOTD text (GET /sdapi/v1/motd).', '/sdapi/v1/motd');
  get('sdnext_version', 'Server Version',
    'Get SD.Next version info (GET /sdapi/v1/version).', '/sdapi/v1/version');
  get('sdnext_torch', 'Torch Info',
    'Get torch/GPU build info (GET /sdapi/v1/torch).', '/sdapi/v1/torch');
  get('sdnext_platform', 'Platform Info',
    'Get platform/hardware info (GET /sdapi/v1/platform).', '/sdapi/v1/platform');
  get('sdnext_memory', 'Memory Info',
    'Get CPU/GPU memory usage (GET /sdapi/v1/memory).', '/sdapi/v1/memory');
  get('sdnext_cmd_flags', 'Command Flags',
    'Get all command-line flags the server was started with (GET /sdapi/v1/cmd-flags).', '/sdapi/v1/cmd-flags');
  get('sdnext_gpu', 'GPU Info',
    'Get GPU device info (GET /sdapi/v1/gpu).', '/sdapi/v1/gpu');
  get('sdnext_gpu_smi', 'GPU SMI Metrics',
    'Get detailed GPU metrics: name, utilization, temperature, memory, clocks (GET /sdapi/v1/gpu-smi).', '/sdapi/v1/gpu-smi');
  get('sdnext_loaded_models', 'Loaded Models',
    'List all loaded models by category (pipeline, lora, upscaler, ...) with device and size (GET /sdapi/v1/loaded-models).', '/sdapi/v1/loaded-models');
  get('sdnext_modules', 'Loaded Modules',
    'List loaded model modules (GET /sdapi/v1/modules).', '/sdapi/v1/modules');

  get('sdnext_history', 'Generation History',
    'Get generation history entries (GET /sdapi/v1/history).',
    '/sdapi/v1/history',
    z.object({ id: z.union([z.string(), z.number()]).optional().describe('Filter by task/job id.') }));

  get('sdnext_storage', 'Storage Usage',
    'Get storage folder usage stats (GET /sdapi/v1/storage).',
    '/sdapi/v1/storage',
    z.object({
      folder: z.string().optional().describe('Filter by folder(s), comma-separated.'),
      types: z.string().optional().describe('Filter by storage types.'),
    }));

  get('sdnext_log', 'Server Log',
    'Get recent server log lines (GET /sdapi/v1/log).',
    '/sdapi/v1/log',
    z.object({
      lines: z.number().int().optional().describe('Number of lines to return.'),
      clear: z.boolean().optional().describe('Clear log after returning.'),
    }));
  post('sdnext_log_write', 'Write to Log',
    'Append a message to the server log (POST /sdapi/v1/log).',
    '/sdapi/v1/log',
    z.object({
      message: z.string().optional(), debug: z.string().optional(),
      error: z.string().optional(), json: z.record(z.any()).optional(),
    }));
}
