const TJS = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.1/+esm';
let phase = 'init';
const netLog = [];
const logReq = (url, via) => { netLog.push({ t: performance.now(), phase, url: String(url), via }); };
const _fetch = self.fetch.bind(self);
self.fetch = (input, init) => { logReq(typeof input === 'string' ? input : (input.url || input), 'fetch'); return _fetch(input, init); };
if (self.XMLHttpRequest) { const o = XMLHttpRequest.prototype.open; XMLHttpRequest.prototype.open = function (m, u, ...r) { logReq(u, 'xhr'); return o.call(this, m, u, ...r); }; }
const resEntries = [];
try { new PerformanceObserver(l => { for (const e of l.getEntries()) resEntries.push({ name: e.name, phase, transferSize: e.transferSize, encodedBodySize: e.encodedBodySize, decodedBodySize: e.decodedBodySize, duration: e.duration }); }).observe({ type: 'resource', buffered: true }); } catch (e) {}

let pipe = null, T = null;
const post = (type, data) => self.postMessage({ type, ...data });

self.onmessage = async ({ data }) => {
  try {
    if (data.cmd === 'load') {
      phase = 'carga';
      const t0 = performance.now();
      T = T || await import(TJS);
      T.env.allowLocalModels = false;
      const tImport = performance.now() - t0;
      const files = {};
      if (pipe) { await pipe.dispose?.(); pipe = null; }
      let cachedFiles = 0;
      try { const c = await caches.open('transformers-cache'); cachedFiles = (await c.keys()).filter(k => k.url.includes(data.model + '/')).length; } catch (e) {}
      const t1 = performance.now();
      pipe = await T.pipeline('automatic-speech-recognition', data.model, {
        device: data.device,
        dtype: { encoder_model: data.dtype, decoder_model_merged: data.dtype },
        progress_callback: p => {
          if (p.file) { const f = files[p.file] ||= { loaded: 0, total: 0 }; if (p.loaded != null) f.loaded = p.loaded; if (p.total) f.total = p.total; }
          post('progress', { p, files });
        },
      });
      const tLoad = performance.now() - t1;
      phase = 'inactivo';
      post('loaded', { tImport, tLoad, files, cachedFiles, version: T.env.version });
    } else if (data.cmd === 'transcribe') {
      const n0 = netLog.length, r0 = resEntries.length;
      phase = 'transcripcion';
      const t0 = performance.now();
      const out = await pipe(data.audio, { language: 'es', task: 'transcribe', chunk_length_s: 30, stride_length_s: 5, return_timestamps: false });
      const ms = performance.now() - t0;
      await new Promise(r => setTimeout(r, 300));
      phase = 'inactivo';
      post('result', { text: out.text, ms, netDuring: netLog.slice(n0).concat(resEntries.slice(r0).map(e => ({ url: e.name, via: 'resource' }))) });
    } else if (data.cmd === 'net') {
      post('net', { netLog, resEntries });
    }
  } catch (e) { phase = 'inactivo'; post('error', { message: String(e && e.stack || e) }); }
};
