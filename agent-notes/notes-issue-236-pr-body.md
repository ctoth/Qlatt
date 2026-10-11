The speech server now retains experiment configuration and a worklet asset loader per `(experimentId, frontendId, sampleRate)` within its repository. Transformed worklet sources and WASM bytes stay warm; each request still creates its own audio context, runtime graph, and interpreter. Failed initialization can be retried, and shutdown disposes retained loaders after queued speech finishes. Other node-render callers keep their existing per-render lifetime.

Closes #236

The 150 ms / 400 ms latency targets remain unmet. This delivers the caching change and measurement tooling; it does not establish an end-to-end speedup. A diagnostic run measured warm asset/config lookup at 0.02 ms, but graph creation at 381 ms, frontend/context at 74 ms, scheduling at 73 ms, and audio rendering at 218 ms for “OK.”. Further latency reduction requires work beyond asset caching, including the runtime-reuse direction described in the issue.

`scripts/measure-speak-latency.ts` measures startup through the hello response, the first and second speak requests, and three warm rounds of all phrases. Its fixed/per-audio-second figures are a descriptive least-squares fit, including frontend, graph, rendering, PCM serialization, and protocol transport costs.

Back-to-back Windows measurements on the same machine, baseline `ad9c73d5` then candidate `7aedd4e8`, using the same script and tracked worklets. The issue did not specify the sentence text; the 44-character sentence used here is “The quick brown fox jumps over the lazy dog.”. Short-run timing varies; these results do not support a meaningful overall speedup.

| Measurement | Before | After |
| --- | ---: | ---: |
| Startup | 2886 ms | 2921 ms |
| First “OK.” | 1273 ms | 1293 ms |
| Second “OK.” | 865 ms | 840 ms |
| Warm “OK.” mean | 811 ms | 811 ms |
| Warm “Hello world.” mean | 911 ms | 895 ms |
| Warm 44-character sentence mean | 1947 ms | 2003 ms |
| Fitted fixed cost | 425 ms | 392 ms |
| Fitted cost per audio second | 385 ms | 407 ms |

Validation:

- TDD: cache reuse/cleanup regressions failed against uncached loading, then passed; the WASM cache test failed when a second load reread a removed file, then passed while preserving independent buffers.
- `pwsh -NoProfile -File build.ps1`
- `npm test`: 223 files, 1883 tests passed.
- Final focused run: `npx vitest run test/node-render-resources.test.ts test/node-loader-cache.test.ts test/speak-server.test.ts test/speak-server-latency.test.ts`: 7 tests passed. `test/speak-server.test.ts` is unchanged; the separate latency test asserts the second request is no slower than the first.
- `npm run typecheck`, `npm run check` (one existing warning), `git diff --check`.
- Measurement: `node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node scripts/measure-speak-latency.ts`.

<details>
<summary>Measurement script output before</summary>

```json
{
  "startupMs": 2885.9608,
  "firstRequestMs": 1272.8720000000003,
  "secondRequestMs": 865.3608000000004,
  "rounds": 3,
  "means": [
    {
      "phrase": "OK.",
      "audioSeconds": 1.02,
      "ms": 811.0507666666672
    },
    {
      "phrase": "Hello world.",
      "audioSeconds": 1.246031746031746,
      "ms": 911.2251999999993
    },
    {
      "phrase": "The quick brown fox jumps over the lazy dog.",
      "audioSeconds": 3.9550113378684806,
      "ms": 1946.5032333333338
    }
  ],
  "fixedMs": 424.78804560975345,
  "perAudioSecondMs": 384.88964485190206
}
```

</details>

<details>
<summary>Measurement script output after</summary>

```json
{
  "startupMs": 2920.7948,
  "firstRequestMs": 1292.7940999999996,
  "secondRequestMs": 839.7158,
  "rounds": 3,
  "means": [
    {
      "phrase": "OK.",
      "audioSeconds": 1.02,
      "ms": 811.3265666666672
    },
    {
      "phrase": "Hello world.",
      "audioSeconds": 1.246031746031746,
      "ms": 894.5819666666666
    },
    {
      "phrase": "The quick brown fox jumps over the lazy dog.",
      "audioSeconds": 3.9550113378684806,
      "ms": 2002.7011666666667
    }
  ],
  "fixedMs": 391.7252660971749,
  "perAudioSecondMs": 407.2361929569152
}
```

</details>
