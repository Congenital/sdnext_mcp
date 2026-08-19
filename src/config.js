// sdnext_mcp/config.js — 全局配置（环境变量驱动）
// 见 framework/02-mcp-design/config.md

import { z } from 'zod';

const env = process.env;

function bool(v, dflt) {
  if (v === undefined || v === '') return dflt;
  return ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase());
}

export const config = {
  baseUrl: (env.SDNEXT_BASE_URL || 'http://127.0.0.1:7860').replace(/\/+$/, ''),
  apiPath: env.SDNEXT_API_PATH || '/sdapi/v1',
  apiKey: env.SDNEXT_API_KEY || '',
  username: env.SDNEXT_USERNAME || '',
  password: env.SDNEXT_PASSWORD || '',
  timeoutMs: Number(env.SDNEXT_TIMEOUT_MS || 300000),
  insecure: bool(env.SDNEXT_INSECURE, false),
  dryRun: bool(env.SDNEXT_MCP_DRY_RUN, false),
  maxImagesInResponse: Number(env.SDNEXT_MAX_IMAGES || 4),
  defaultSaveDir: env.SDNEXT_SAVE_DIR || '',
  transport: env.SDNEXT_MCP_TRANSPORT || 'stdio',
  httpPort: Number(env.SDNEXT_MCP_PORT || 8787),
  httpHost: env.SDNEXT_MCP_HOST || '127.0.0.1',
};

export function authHeader() {
  if (config.apiKey) return { Authorization: `Bearer ${config.apiKey}` };
  if (config.username || config.password) {
    return { Authorization: `Basic ${Buffer.from(`${config.username}:${config.password}`).toString('base64')}` };
  }
  return {};
}

export const ToolConfig = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  path: z.string().min(1),
  method: z.enum(['GET', 'POST', 'PUT']),
  body: z.boolean().optional(),
  query: z.record(z.any()).optional(),
  destructive: z.boolean().optional(),
});

export function assertConfig() {
  const p = config.baseUrl;
  try { new URL(p); } catch { throw new Error(`SDNEXT_BASE_URL invalid: ${p}`); }
  if (config.timeoutMs < 1000) throw new Error('SDNEXT_TIMEOUT_MS too small');
}
