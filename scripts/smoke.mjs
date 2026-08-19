// scripts/smoke.mjs — stdio MCP 冒烟测试（DRY_RUN 模式）
// 用法: SDNEXT_MCP_DRY_RUN=1 node scripts/smoke.mjs
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const t = new StdioClientTransport({
  command: process.execPath,
  args: ['src/index.js'],
  env: { ...process.env, SDNEXT_MCP_DRY_RUN: '1' },
});
const c = new Client({ name: 'smoke', version: '0.0.1' });
await c.connect(t);
const tools = await c.listTools();
const names = tools.tools.map(x => x.name);
console.log('TOOL_COUNT', names.length);
const dup = names.filter((n, i) => names.indexOf(n) !== i);
console.log('DUPLICATES', JSON.stringify(dup));
console.log('SAMPLE', JSON.stringify(names.slice(0, 10)));
const badSchema = names.filter(n => {
  const t0 = tools.tools.find(x => x.name === n);
  return t0.inputSchema && (!t0.inputSchema.type || t0.inputSchema.type !== 'object');
});
console.log('BAD_SCHEMA', JSON.stringify(badSchema));

const call = (name, args) => c.callTool({ name, arguments: args });
const show = async (label, p) => {
  try {
    const r = await p;
    const txt = (r.content?.[0]?.text || '').slice(0, 200).replace(/\n/g, ' ');
    console.log(`CALL ${label} isError=${r.isError ?? false} :: ${txt}`);
  } catch (e) { console.log(`CALL ${label} THREW ${e.message}`); }
};
await show('list_tools', call('sdnext_list_tools', {}));
await show('txt2img', call('sdnext_txt2img', { prompt: 'a cat', width: 1024, height: 1024, steps: 20 }));
await show('img2img', call('sdnext_img2img', { prompt: 'a dog', init_images: ['AAAA'], denoising_strength: 0.6 }));
await show('samplers', call('sdnext_list_samplers', {}));
await show('call_api', call('sdnext_call_api', { method: 'GET', path: 'version' }));
await show('civitai_search', call('sdnext_civitai_search', { query: 'pony', limit: 3 }));
await show('upload', call('sdnext_upload', { filename: 'x.png', content_base64: 'AAAA' }));
await show('bad_tool', call('sdnext_does_not_exist', {}));
await c.close();
process.exit(0);
