// tools/meta.js — 元工具：工具目录 + 通用 API passthrough + autocomplete 文件管理
import { z } from 'zod';
import { client, clean } from '../client.js';
import { listTools, callApiSchema } from '../registry.js';
import { registerTool } from '../registry.js';

export function register(server) {
  registerTool(server, {
    name: 'sdnext_list_tools',
    title: 'List MCP Tools',
    description: 'List every tool exposed by this MCP server with its name, HTTP method, API path, and description. Use this to discover what is available before calling sdnext_call_api.',
    inputSchema: {},
    handler: async () => ({ tools: listTools() }),
  });

  registerTool(server, {
    name: 'sdnext_call_api',
    title: 'Generic API Passthrough',
    description: 'Call any SD.Next REST endpoint directly (v1 or v2, any method). Path may be absolute ("/sdapi/v1/samplers") or relative to /sdapi/v1 ("samplers"). Use only when no dedicated tool fits; prefer dedicated sdnext_* tools.',
    inputSchema: callApiSchema,
    handler: async (args) => {
      const { method, path, body, query } = args;
      const p = path.startsWith('/') ? path : `${'/sdapi/v1'}/${path.replace(/^\/+/, '')}`;
      if (method === 'GET') return client.get(p, { query });
      if (method === 'DELETE') return client.del(p, { query, body });
      return client.post(p, { body, query });
    },
  });

  registerTool(server, {
    name: 'sdnext_autocomplete_content',
    title: 'Read Autocomplete File',
    method: 'GET',
    path: '/sdapi/v1/autocomplete/{name}',
    description: 'Get the content of a local autocomplete/tag-list file (GET /sdapi/v1/autocomplete/{name}).',
    inputSchema: z.object({ name: z.string().describe('Autocomplete file name (from sdnext_autocomplete).') }),
    handler: (args) => client.get(`/sdapi/v1/autocomplete/${encodeURIComponent(args.name)}`),
  });

  registerTool(server, {
    name: 'sdnext_autocomplete_download',
    title: 'Download Autocomplete File',
    method: 'POST',
    path: '/sdapi/v1/autocomplete/{name}/download',
    description: 'Download an autocomplete/tag-list file from a remote source (POST /sdapi/v1/autocomplete/{name}/download).',
    inputSchema: z.object({ name: z.string().describe('Autocomplete file name (from sdnext_autocomplete_remote).') }),
    handler: (args) => client.post(`/sdapi/v1/autocomplete/${encodeURIComponent(args.name)}/download`),
  });

  registerTool(server, {
    name: 'sdnext_autocomplete_delete',
    title: 'Delete Autocomplete File',
    method: 'DELETE',
    path: '/sdapi/v1/autocomplete/{name}',
    description: 'Delete a local autocomplete/tag-list file (DELETE /sdapi/v1/autocomplete/{name}). DESTRUCTIVE.',
    inputSchema: z.object({ name: z.string().describe('Autocomplete file name to delete.') }),
    destructive: true,
    annotations: { readOnlyHint: false, destructiveHint: true },
    handler: (args) => client.del(`/sdapi/v1/autocomplete/${encodeURIComponent(args.name)}`),
  });

  registerTool(server, {
    name: 'sdnext_session_start',
    title: 'Session Start',
    method: 'GET',
    path: '/sdapi/v1/start',
    description: 'Get session start info (GET /sdapi/v1/start). Optionally pass the agent name.',
    inputSchema: z.object({ agent: z.string().optional().describe('Agent identifier.') }),
    handler: (args) => client.get('/sdapi/v1/start', { query: clean({ agent: args.agent }) }),
  });
}
