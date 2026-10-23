# stt-bench-1042

Benchmark en el navegador de voz a texto en español **en el dispositivo** (Transformers.js 4.3.1 + Whisper ONNX: `onnx-community/whisper-base`, `onnx-community/whisper-small`, q8/q4, WASM o WebGPU). Para el issue #1042.

Uso: abrir la página por HTTPS en Chrome Android → Cargar modelo → audio de prueba / archivo / micrófono → Transcribir → Copiar reporte.
El audio se procesa en un Web Worker y **nunca se sube**; solo se descargan el runtime (cdn.jsdelivr.net) y los modelos (huggingface.co y su CDN de redirección `*.cdn.hf.co`, que no aparece en el registro porque las redirecciones no son visibles para fetch/Resource Timing).

## Audio de prueba
`es-test.wav` (119,7 s, 16 kHz mono) = 7 segmentos consecutivos del locutor 11266 (test split, ids `11266_10604_000000`–`000006`) de **Multilingual LibriSpeech (MLS) Spanish**, `facebook/multilingual_librispeech`, licencia **CC BY 4.0** (Pratap et al., 2020). Fuente original: LibriVox *Poesías* de Miguel de Unamuno (dominio público), https://archive.org/details/poesias_1805_librivox. `reference.txt` = transcripciones MLS concatenadas (en minúsculas, sin puntuación).

## Notas
- Bytes de modelo: de `progress_callback` (huggingface.co no envía `Timing-Allow-Origin`, así que `transferSize` es 0). Caché detectada vía Cache API `transformers-cache`.
- Memoria: `measureUserAgentSpecificMemory` solo con crossOriginIsolated (opción coi-serviceworker); si no, `performance.memory` (solo heap JS de la página).
- `coi-serviceworker.js` v0.1.7 (MIT, Guido Zuidhof).
