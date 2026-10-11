Retain experiment configuration, transformed worklet sources, and WASM bytes across speech requests. Freeze the cached configuration template and give each runtime a private copy: formant-bank expansion mutates graph nodes and realize rules. Contexts, interpreters, diagnostics, parameters, and seeded processor state remain isolated per request. Failed initialization can be retried; shutdown disposes resources after queued work completes. Restarting the owner invalidates the configuration snapshot.

Closes #236

This completes safe asset reuse and measurement. It does not meet the 150/400 ms responsiveness targets or establish a substantial end-to-end speedup. Persistent offline sessions and the remaining latency work are tracked in #260. Backend relocation and prepared-data/macro ownership remain with #79, #251, and #252.

Replace the timing-order CI assertion with deterministic coverage: concurrent A/B and A replay produce the same audio hashes and tracks as fresh renders, changed options and failed requests do not contaminate protocol replay, and tests cover immutable templates, key separation, initialization sharing, failure recovery, owner replacement, and disposal.

The benchmark reports startup and first-request distributions across 3 independent server processes and 5 warm trials per phrase per process (15 observations per phrase). It preserves raw elapsed observations and adds opt-in runtime stage timing on stderr without changing the speech protocol. The small-sample percentiles describe this run, not a latency guarantee.

Back-to-back measurements on the same Windows machine: baseline ad9c73d5 and candidate 44b0ff2e, with the same benchmark script and tracked worklets. Values below are p50 / p95 in milliseconds.

| Measurement | Before | After |
| --- | ---: | ---: |
| Startup to hello | 2953.6 / 3231.0 | 2985.2 / 2991.9 |
| First OK. request | 1237.6 / 1682.1 | 1218.8 / 1245.7 |
| OK. | 742.8 / 802.5 | 736.6 / 775.4 |
| Hello world. | 838.9 / 938.3 | 826.1 / 867.8 |
| The quick brown fox jumps over the lazy dog. | 1776.7 / 1966.3 | 1763.7 / 2027.5 |

Warm runtime breakdown, p50 milliseconds. The runtime.* rows are components of runtimeTotal, not additional costs. Worklet registration includes worker startup; the current host does not expose separate startup timing.

| Stage | OK. | Hello world. | 44-character sentence |
| --- | ---: | ---: | ---: |
| assetsConfig | 1.3 | 1.3 | 1.3 |
| frontendAndContext | 51.1 | 64.6 | 223.5 |
| runtime.validation | 0.9 | 0.8 | 0.9 |
| runtime.wasmAssets | 0.3 | 0.2 | 0.2 |
| runtime.workletRegistration | 323.7 | 319.3 | 323.8 |
| runtime.evaluatorAndBindings | 0.4 | 0.4 | 0.4 |
| runtime.initialSemantics | 4.8 | 5.3 | 4.7 |
| runtime.nodeCreation | 12.1 | 11.9 | 12.5 |
| runtime.connections | 0.4 | 0.4 | 0.4 |
| runtime.processorReady | 34.3 | 34.0 | 34.0 |
| runtime.applyValues | 0.7 | 0.7 | 0.8 |
| runtimeTotal | 384.7 | 376.1 | 380.3 |
| scheduling | 70.6 | 96.8 | 410.7 |
| rendering | 222.7 | 268.5 | 748.0 |
| payload | 0.3 | 0.3 | 0.7 |

The fitted fixed cost changed from 403.4 to 374.9 ms. This is a descriptive regression across three phrases, not a direct measurement of fixed work; measured stage values are reported separately.

Validation:

- TDD: nested mutation and shared-template assertions failed before isolation; freezing exposed mutating formant-bank expansion; private per-request copies pass the real-render regressions. Distribution summaries have deterministic numeric fixtures.
- Focused suite: 6 files / 12 tests passed, including the protocol, resource lifetime, real render isolation, WASM buffer independence, timing summaries, and existing node schedule test.
- npm run typecheck; npm run check (one pre-existing warning); git diff --check.
- Exact-head CI passed on 44b0ff2e: native workspace tests, dependency audit, lint, typecheck, WASM build, full Vitest suite, and production build. https://github.com/ctoth/Qlatt/actions/runs/34717801242
- Benchmark: node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node scripts/measure-speak-latency.ts --rounds=5 --processes=3. Run from each checkout, using the candidate script for both. The old server has no stage instrumentation, so its stages are empty.

<details>
<summary>Before: benchmark distributions and raw elapsed observations</summary>

```json
{
  "rounds": 5,
  "processes": 3,
  "startup": {
    "count": 3,
    "minMs": 2945.9951999999976,
    "maxMs": 3261.8207,
    "meanMs": 3053.7908666666663,
    "p50Ms": 2953.556700000001,
    "p95Ms": 3230.9943000000003
  },
  "coldOK": {
    "count": 3,
    "minMs": 1236.2749000000003,
    "maxMs": 1731.5374999999995,
    "meanMs": 1401.802533333332,
    "p50Ms": 1237.595199999996,
    "p95Ms": 1682.1432699999991
  },
  "warm": [
    {
      "phrase": "OK.",
      "audioSeconds": 1.02,
      "elapsed": {
        "count": 15,
        "minMs": 717.9338999999964,
        "maxMs": 805.1240999999973,
        "meanMs": 751.8353599999997,
        "p50Ms": 742.8221000000012,
        "p95Ms": 802.5489399999994
      },
      "stages": {}
    },
    {
      "phrase": "Hello world.",
      "audioSeconds": 1.246031746031746,
      "elapsed": {
        "count": 15,
        "minMs": 782.372000000003,
        "maxMs": 1042.1483000000007,
        "meanMs": 851.79146,
        "p50Ms": 838.937800000007,
        "p95Ms": 938.3482400000008
      },
      "stages": {}
    },
    {
      "phrase": "The quick brown fox jumps over the lazy dog.",
      "audioSeconds": 3.9550113378684806,
      "elapsed": {
        "count": 15,
        "minMs": 1656.2854999999981,
        "maxMs": 1987.5118999999977,
        "meanMs": 1791.8775333333333,
        "p50Ms": 1776.7389999999996,
        "p95Ms": 1966.3051199999995
      },
      "stages": {}
    }
  ],
  "fittedEstimate": {
    "fixedMs": 403.4006084972949,
    "perAudioSecondMs": 351.2759031515005,
    "note": "Descriptive fit across phrases, not a causal DSP/fixed-cost decomposition. runtime.* stages are included in runtimeTotal. Worklet registration includes worker startup."
  },
  "trials": [
    {
      "startupMs": 3261.8207,
      "cold": {
        "phrase": "OK.",
        "ms": 1731.5374999999995,
        "audioSeconds": 1.02
      },
      "warm": [
        {
          "phrase": "OK.",
          "ms": 801.4453000000003,
          "audioSeconds": 1.02
        },
        {
          "phrase": "Hello world.",
          "ms": 868.4042,
          "audioSeconds": 1.246031746031746
        },
        {
          "phrase": "The quick brown fox jumps over the lazy dog.",
          "ms": 1776.7389999999996,
          "audioSeconds": 3.9550113378684806
        },
        {
          "phrase": "OK.",
          "ms": 756.8562999999995,
          "audioSeconds": 1.02
        },
        {
          "phrase": "Hello world.",
          "ms": 893.8625000000011,
          "audioSeconds": 1.246031746031746
        },
        {
          "phrase": "The quick brown fox jumps over the lazy dog.",
          "ms": 1957.2165000000005,
          "audioSeconds": 3.9550113378684806
        },
        {
          "phrase": "OK.",
          "ms": 761.305699999999,
          "audioSeconds": 1.02
        },
        {
          "phrase": "Hello world.",
          "ms": 856.1749,
          "audioSeconds": 1.246031746031746
        },
        {
          "phrase": "The quick brown fox jumps over the lazy dog.",
          "ms": 1821.4367999999995,
          "audioSeconds": 3.9550113378684806
        },
        {
          "phrase": "OK.",
          "ms": 740.5300000000007,
          "audioSeconds": 1.02
        },
        {
          "phrase": "Hello world.",
          "ms": 796.8099999999977,
          "audioSeconds": 1.246031746031746
        },
        {
          "phrase": "The quick brown fox jumps over the lazy dog.",
          "ms": 1656.2854999999981,
          "audioSeconds": 3.9550113378684806
        },
        {
          "phrase": "OK.",
          "ms": 726.005000000001,
          "audioSeconds": 1.02
        },
        {
          "phrase": "Hello world.",
          "ms": 850.9972999999991,
          "audioSeconds": 1.246031746031746
        },
        {
          "phrase": "The quick brown fox jumps over the lazy dog.",
          "ms": 1799.4652999999998,
          "audioSeconds": 3.9550113378684806
        }
      ]
    },
    {
      "startupMs": 2953.556700000001,
      "cold": {
        "phrase": "OK.",
        "ms": 1236.2749000000003,
        "audioSeconds": 1.02
      },
      "warm": [
        {
          "phrase": "OK.",
          "ms": 805.1240999999973,
          "audioSeconds": 1.02
        },
        {
          "phrase": "Hello world.",
          "ms": 884.765800000001,
          "audioSeconds": 1.246031746031746
        },
        {
          "phrase": "The quick brown fox jumps over the lazy dog.",
          "ms": 1946.464899999999,
          "audioSeconds": 3.9550113378684806
        },
        {
          "phrase": "OK.",
          "ms": 742.8221000000012,
          "audioSeconds": 1.02
        },
        {
          "phrase": "Hello world.",
          "ms": 817.7031999999999,
          "audioSeconds": 1.246031746031746
        },
        {
          "phrase": "The quick brown fox jumps over the lazy dog.",
          "ms": 1717.8031000000046,
          "audioSeconds": 3.9550113378684806
        },
        {
          "phrase": "OK.",
          "ms": 717.9338999999964,
          "audioSeconds": 1.02
        },
        {
          "phrase": "Hello world.",
          "ms": 827.4460000000036,
          "audioSeconds": 1.246031746031746
        },
        {
          "phrase": "The quick brown fox jumps over the lazy dog.",
          "ms": 1720.5122999999949,
          "audioSeconds": 3.9550113378684806
        },
        {
          "phrase": "OK.",
          "ms": 725.1103000000003,
          "audioSeconds": 1.02
        },
        {
          "phrase": "Hello world.",
          "ms": 782.372000000003,
          "audioSeconds": 1.246031746031746
        },
        {
          "phrase": "The quick brown fox jumps over the lazy dog.",
          "ms": 1695.3528000000006,
          "audioSeconds": 3.9550113378684806
        },
        {
          "phrase": "OK.",
          "ms": 737.015800000001,
          "audioSeconds": 1.02
        },
        {
          "phrase": "Hello world.",
          "ms": 838.937800000007,
          "audioSeconds": 1.246031746031746
        },
        {
          "phrase": "The quick brown fox jumps over the lazy dog.",
          "ms": 1751.6232000000018,
          "audioSeconds": 3.9550113378684806
        }
      ]
    },
    {
      "startupMs": 2945.9951999999976,
      "cold": {
        "phrase": "OK.",
        "ms": 1237.595199999996,
        "audioSeconds": 1.02
      },
      "warm": [
        {
          "phrase": "OK.",
          "ms": 783.0356000000029,
          "audioSeconds": 1.02
        },
        {
          "phrase": "Hello world.",
          "ms": 1042.1483000000007,
          "audioSeconds": 1.246031746031746
        },
        {
          "phrase": "The quick brown fox jumps over the lazy dog.",
          "ms": 1794.6178,
          "audioSeconds": 3.9550113378684806
        },
        {
          "phrase": "OK.",
          "ms": 740.9956999999995,
          "audioSeconds": 1.02
        },
        {
          "phrase": "Hello world.",
          "ms": 796.4876000000004,
          "audioSeconds": 1.246031746031746
        },
        {
          "phrase": "The quick brown fox jumps over the lazy dog.",
          "ms": 1669.5339999999997,
          "audioSeconds": 3.9550113378684806
        },
        {
          "phrase": "OK.",
          "ms": 719.3868000000002,
          "audioSeconds": 1.02
        },
        {
          "phrase": "Hello world.",
          "ms": 819.4928999999975,
          "audioSeconds": 1.246031746031746
        },
        {
          "phrase": "The quick brown fox jumps over the lazy dog.",
          "ms": 1987.5118999999977,
          "audioSeconds": 3.9550113378684806
        },
        {
          "phrase": "OK.",
          "ms": 763.9542999999976,
          "audioSeconds": 1.02
        },
        {
          "phrase": "Hello world.",
          "ms": 808.3431999999957,
          "audioSeconds": 1.246031746031746
        },
        {
          "phrase": "The quick brown fox jumps over the lazy dog.",
          "ms": 1719.9462000000058,
          "audioSeconds": 3.9550113378684806
        },
        {
          "phrase": "OK.",
          "ms": 756.0095000000001,
          "audioSeconds": 1.02
        },
        {
          "phrase": "Hello world.",
          "ms": 892.9261999999944,
          "audioSeconds": 1.246031746031746
        },
        {
          "phrase": "The quick brown fox jumps over the lazy dog.",
          "ms": 1863.6537000000026,
          "audioSeconds": 3.9550113378684806
        }
      ]
    }
  ]
}
```

</details>

<details>
<summary>After: benchmark distributions and raw elapsed observations</summary>

```json
{
  "rounds": 5,
  "processes": 3,
  "startup": {
    "count": 3,
    "minMs": 2907.2760000000003,
    "maxMs": 2992.694300000003,
    "meanMs": 2961.718000000001,
    "p50Ms": 2985.1837000000014,
    "p95Ms": 2991.943240000003
  },
  "coldOK": {
    "count": 3,
    "minMs": 1176.7584999999963,
    "maxMs": 1248.7106999999996,
    "meanMs": 1214.7716333333317,
    "p50Ms": 1218.8456999999994,
    "p95Ms": 1245.7241999999997
  },
  "warm": [
    {
      "phrase": "OK.",
      "audioSeconds": 1.02,
      "elapsed": {
        "count": 15,
        "minMs": 695.0485999999946,
        "maxMs": 783.0285000000003,
        "meanMs": 733.8146533333334,
        "p50Ms": 736.5794000000024,
        "p95Ms": 775.4259400000001
      },
      "stages": {
        "assetsConfig": {
          "count": 15,
          "minMs": 1.2305999999998676,
          "maxMs": 1.8131000000003041,
          "meanMs": 1.4052266666667492,
          "p50Ms": 1.340199999998731,
          "p95Ms": 1.7551399999995736
        },
        "frontendAndContext": {
          "count": 15,
          "minMs": 47.15769999999975,
          "maxMs": 76.77379999999994,
          "meanMs": 55.520953333333395,
          "p50Ms": 51.105900000000474,
          "p95Ms": 74.19506999999994
        },
        "runtime.validation": {
          "count": 15,
          "minMs": 0.7875999999996566,
          "maxMs": 1.3403000000016618,
          "meanMs": 0.9291266666667071,
          "p50Ms": 0.8941999999988184,
          "p95Ms": 1.194070000000647
        },
        "runtime.wasmAssets": {
          "count": 15,
          "minMs": 0.22839999999996508,
          "maxMs": 1.960399999999936,
          "meanMs": 0.399086666666517,
          "p50Ms": 0.2872000000006665,
          "p95Ms": 0.8975900000001258
        },
        "runtime.workletRegistration": {
          "count": 15,
          "minMs": 311.1404000000002,
          "maxMs": 352.3762000000006,
          "meanMs": 326.1594333333334,
          "p50Ms": 323.70650000000023,
          "p95Ms": 345.1384799999998
        },
        "runtime.evaluatorAndBindings": {
          "count": 15,
          "minMs": 0.3793000000005122,
          "maxMs": 0.5488000000004831,
          "meanMs": 0.4310600000000098,
          "p50Ms": 0.4143999999996595,
          "p95Ms": 0.5393500000004678
        },
        "runtime.initialSemantics": {
          "count": 15,
          "minMs": 4.18920000000071,
          "maxMs": 17.261199999999917,
          "meanMs": 7.560500000000017,
          "p50Ms": 4.763800000000629,
          "p95Ms": 17.164320000000043
        },
        "runtime.nodeCreation": {
          "count": 15,
          "minMs": 11.467999999999847,
          "maxMs": 14.327499999999418,
          "meanMs": 12.328300000000066,
          "p50Ms": 12.128700000000208,
          "p95Ms": 13.534120000000256
        },
        "runtime.connections": {
          "count": 15,
          "minMs": 0.3510999999998603,
          "maxMs": 0.4933000000000902,
          "meanMs": 0.3929533333332074,
          "p50Ms": 0.3786000000000058,
          "p95Ms": 0.4768499999999221
        },
        "runtime.processorReady": {
          "count": 15,
          "minMs": 32.658400000000256,
          "maxMs": 37.293900000000576,
          "meanMs": 34.73213999999995,
          "p50Ms": 34.26970000000074,
          "p95Ms": 36.589070000000355
        },
        "runtime.applyValues": {
          "count": 15,
          "minMs": 0.6679999999996653,
          "maxMs": 0.8930000000000291,
          "meanMs": 0.7227600000000772,
          "p50Ms": 0.7181000000000495,
          "p95Ms": 0.8060600000011617
        },
        "runtimeTotal": {
          "count": 15,
          "minMs": 364.14980000000014,
          "maxMs": 406.1316000000006,
          "meanMs": 383.8876266666665,
          "p50Ms": 384.71859999999833,
          "p95Ms": 400.8207000000003
        },
        "scheduling": {
          "count": 15,
          "minMs": 58.926799999999275,
          "maxMs": 78.70049999999992,
          "meanMs": 69.13940666666659,
          "p50Ms": 70.60570000000007,
          "p95Ms": 76.48416000000016
        },
        "rendering": {
          "count": 15,
          "minMs": 211.15729999999985,
          "maxMs": 240.09799999999996,
          "meanMs": 222.0442333333336,
          "p50Ms": 222.66300000000047,
          "p95Ms": 234.75252000000037
        },
        "payload": {
          "count": 15,
          "minMs": 0.20249999999941792,
          "maxMs": 2.2135000000007494,
          "meanMs": 0.6220000000001165,
          "p50Ms": 0.2628999999997177,
          "p95Ms": 2.1528100000002266
        }
      }
    },
    {
      "phrase": "Hello world.",
      "audioSeconds": 1.246031746031746,
      "elapsed": {
        "count": 15,
        "minMs": 769.7282999999952,
        "maxMs": 879.9600999999966,
        "meanMs": 823.4000799999994,
        "p50Ms": 826.0756999999994,
        "p95Ms": 867.8492599999979
      },
      "stages": {
        "assetsConfig": {
          "count": 15,
          "minMs": 1.2092999999986205,
          "maxMs": 1.3774999999995998,
          "meanMs": 1.2897466666666635,
          "p50Ms": 1.3110999999989872,
          "p95Ms": 1.367279999999937
        },
        "frontendAndContext": {
          "count": 15,
          "minMs": 61.146199999999226,
          "maxMs": 103.66030000000046,
          "meanMs": 71.80047333333326,
          "p50Ms": 64.5565000000006,
          "p95Ms": 102.72195000000029
        },
        "runtime.validation": {
          "count": 15,
          "minMs": 0.7768999999971129,
          "maxMs": 0.9340999999994892,
          "meanMs": 0.8357199999998557,
          "p50Ms": 0.8176999999996042,
          "p95Ms": 0.9221300000007432
        },
        "runtime.wasmAssets": {
          "count": 15,
          "minMs": 0.17439999999987776,
          "maxMs": 0.29290000000037253,
          "meanMs": 0.22929999999990588,
          "p50Ms": 0.20679999999993015,
          "p95Ms": 0.29220000000022994
        },
        "runtime.workletRegistration": {
          "count": 15,
          "minMs": 307.70939999999973,
          "maxMs": 336.23089999999866,
          "meanMs": 321.2609200000001,
          "p50Ms": 319.2998000000007,
          "p95Ms": 333.18324000000064
        },
        "runtime.evaluatorAndBindings": {
          "count": 15,
          "minMs": 0.37229999999908614,
          "maxMs": 0.4312000000008993,
          "meanMs": 0.3973866666664738,
          "p50Ms": 0.3973999999998341,
          "p95Ms": 0.43057000000026163
        },
        "runtime.initialSemantics": {
          "count": 15,
          "minMs": 4.1468000000022585,
          "maxMs": 7.619499999999789,
          "meanMs": 5.516240000000228,
          "p50Ms": 5.280400000000554,
          "p95Ms": 6.9661200000005
        },
        "runtime.nodeCreation": {
          "count": 15,
          "minMs": 11.365399999998772,
          "maxMs": 13.27219999999943,
          "meanMs": 12.168566666666266,
          "p50Ms": 11.87289999999848,
          "p95Ms": 12.96083999999928
        },
        "runtime.connections": {
          "count": 15,
          "minMs": 0.3397000000004482,
          "maxMs": 0.44900000000052387,
          "meanMs": 0.38202666666699464,
          "p50Ms": 0.3879000000006272,
          "p95Ms": 0.4383600000006481
        },
        "runtime.processorReady": {
          "count": 15,
          "minMs": 32.15689999999995,
          "maxMs": 72.0747999999985,
          "meanMs": 37.34671999999979,
          "p50Ms": 33.95389999999952,
          "p95Ms": 50.64072999999968
        },
        "runtime.applyValues": {
          "count": 15,
          "minMs": 0.6210000000010041,
          "maxMs": 0.8525000000008731,
          "meanMs": 0.7171466666667887,
          "p50Ms": 0.7223999999996522,
          "p95Ms": 0.828000000000975
        },
        "runtimeTotal": {
          "count": 15,
          "minMs": 359.47810000000027,
          "maxMs": 410.1417000000001,
          "meanMs": 379.07951999999983,
          "p50Ms": 376.1412999999993,
          "p95Ms": 402.26347999999996
        },
        "scheduling": {
          "count": 15,
          "minMs": 86.05559999999969,
          "maxMs": 126.863400000002,
          "meanMs": 101.10992666666685,
          "p50Ms": 96.83959999999934,
          "p95Ms": 122.14183000000193
        },
        "rendering": {
          "count": 15,
          "minMs": 248.87360000000263,
          "maxMs": 290.1256999999987,
          "meanMs": 267.85063999999994,
          "p50Ms": 268.54279999999926,
          "p95Ms": 287.66519999999974
        },
        "payload": {
          "count": 15,
          "minMs": 0.24290000000110012,
          "maxMs": 2.3320999999996275,
          "meanMs": 0.7067933333333712,
          "p50Ms": 0.30609999999978754,
          "p95Ms": 2.3127800000000205
        }
      }
    },
    {
      "phrase": "The quick brown fox jumps over the lazy dog.",
      "audioSeconds": 3.9550113378684806,
      "elapsed": {
        "count": 15,
        "minMs": 1625.3443000000043,
        "maxMs": 2106.3852000000043,
        "meanMs": 1783.110960000001,
        "p50Ms": 1763.6561000000002,
        "p95Ms": 2027.5119300000013
      },
      "stages": {
        "assetsConfig": {
          "count": 15,
          "minMs": 1.2544999999990978,
          "maxMs": 1.604299999999057,
          "meanMs": 1.3260533333330387,
          "p50Ms": 1.3007999999990716,
          "p95Ms": 1.4819399999998493
        },
        "frontendAndContext": {
          "count": 15,
          "minMs": 206.8494000000028,
          "maxMs": 273.02829999999994,
          "meanMs": 229.22236000000035,
          "p50Ms": 223.45640000000276,
          "p95Ms": 268.32716999999985
        },
        "runtime.validation": {
          "count": 15,
          "minMs": 0.7938000000012835,
          "maxMs": 1.2075000000004366,
          "meanMs": 0.9579600000004576,
          "p50Ms": 0.9115000000001601,
          "p95Ms": 1.1442900000005465
        },
        "runtime.wasmAssets": {
          "count": 15,
          "minMs": 0.1683999999986554,
          "maxMs": 0.3447999999989406,
          "meanMs": 0.23364666666633033,
          "p50Ms": 0.22899999999935972,
          "p95Ms": 0.29762000000027905
        },
        "runtime.workletRegistration": {
          "count": 15,
          "minMs": 308.5483000000004,
          "maxMs": 401.9395999999997,
          "meanMs": 327.68764666666664,
          "p50Ms": 323.8271000000004,
          "p95Ms": 357.9272399999999
        },
        "runtime.evaluatorAndBindings": {
          "count": 15,
          "minMs": 0.3878999999978987,
          "maxMs": 0.49680000000080327,
          "meanMs": 0.41723333333344875,
          "p50Ms": 0.4136999999991531,
          "p95Ms": 0.4757299999995666
        },
        "runtime.initialSemantics": {
          "count": 15,
          "minMs": 4.004899999999907,
          "maxMs": 18.97820000000138,
          "meanMs": 6.848293333333519,
          "p50Ms": 4.708999999998923,
          "p95Ms": 16.298460000000155
        },
        "runtime.nodeCreation": {
          "count": 15,
          "minMs": 11.449899999999616,
          "maxMs": 16.67199999999866,
          "meanMs": 12.685733333333095,
          "p50Ms": 12.451099999998405,
          "p95Ms": 14.531960000000433
        },
        "runtime.connections": {
          "count": 15,
          "minMs": 0.3400000000001455,
          "maxMs": 0.6429000000007363,
          "meanMs": 0.4045866666665461,
          "p50Ms": 0.3932999999997264,
          "p95Ms": 0.511440000000948
        },
        "runtime.processorReady": {
          "count": 15,
          "minMs": 29.825700000001234,
          "maxMs": 41.781300000000556,
          "meanMs": 34.80516000000025,
          "p50Ms": 34.006900000000314,
          "p95Ms": 38.37846000000226
        },
        "runtime.applyValues": {
          "count": 15,
          "minMs": 0.6313000000009197,
          "maxMs": 0.916799999999057,
          "meanMs": 0.7475799999995919,
          "p50Ms": 0.7551000000003114,
          "p95Ms": 0.8514199999992342
        },
        "runtimeTotal": {
          "count": 15,
          "minMs": 359.69620000000214,
          "maxMs": 482.9520999999986,
          "meanMs": 385.01403999999997,
          "p50Ms": 380.3022000000001,
          "p95Ms": 421.55341999999956
        },
        "scheduling": {
          "count": 15,
          "minMs": 298.0452000000005,
          "maxMs": 495.6115000000009,
          "meanMs": 398.27500000000015,
          "p50Ms": 410.72730000000047,
          "p95Ms": 463.1886199999995
        },
        "rendering": {
          "count": 15,
          "minMs": 706.9293999999973,
          "maxMs": 1044.9738000000016,
          "meanMs": 765.1631866666665,
          "p50Ms": 747.9514999999992,
          "p95Ms": 869.2929800000019
        },
        "payload": {
          "count": 15,
          "minMs": 0.6188000000001921,
          "maxMs": 0.8924000000006345,
          "meanMs": 0.7133866666667624,
          "p50Ms": 0.6856000000007043,
          "p95Ms": 0.8671300000010888
        }
      }
    }
  ],
  "fittedEstimate": {
    "fixedMs": 374.9036037525399,
    "perAudioSecondMs": 356.14845488044017,
    "note": "Descriptive fit across phrases, not a causal DSP/fixed-cost decomposition. runtime.* stages are included in runtimeTotal. Worklet registration includes worker startup."
  },
  "trials": [
    {
      "startupMs": 2907.2760000000003,
      "cold": {
        "phrase": "OK.",
        "ms": 1218.8456999999994,
        "audioSeconds": 1.02
      },
      "warm": [
        {
          "phrase": "OK.",
          "ms": 772.1677,
          "audioSeconds": 1.02
        },
        {
          "phrase": "Hello world.",
          "ms": 847.9386999999997,
          "audioSeconds": 1.246031746031746
        },
        {
          "phrase": "The quick brown fox jumps over the lazy dog.",
          "ms": 1786.7920999999997,
          "audioSeconds": 3.9550113378684806
        },
        {
          "phrase": "OK.",
          "ms": 754.6230999999998,
          "audioSeconds": 1.02
        },
        {
          "phrase": "Hello world.",
          "ms": 838.5373999999993,
          "audioSeconds": 1.246031746031746
        },
        {
          "phrase": "The quick brown fox jumps over the lazy dog.",
          "ms": 1993.7091,
          "audioSeconds": 3.9550113378684806
        },
        {
          "phrase": "OK.",
          "ms": 740.9250000000011,
          "audioSeconds": 1.02
        },
        {
          "phrase": "Hello world.",
          "ms": 826.0756999999994,
          "audioSeconds": 1.246031746031746
        },
        {
          "phrase": "The quick brown fox jumps over the lazy dog.",
          "ms": 1754.4981000000007,
          "audioSeconds": 3.9550113378684806
        },
        {
          "phrase": "OK.",
          "ms": 730.5845000000008,
          "audioSeconds": 1.02
        },
        {
          "phrase": "Hello world.",
          "ms": 777.5617999999995,
          "audioSeconds": 1.246031746031746
        },
        {
          "phrase": "The quick brown fox jumps over the lazy dog.",
          "ms": 1636.5938000000024,
          "audioSeconds": 3.9550113378684806
        },
        {
          "phrase": "OK.",
          "ms": 706.076100000002,
          "audioSeconds": 1.02
        },
        {
          "phrase": "Hello world.",
          "ms": 842.233400000001,
          "audioSeconds": 1.246031746031746
        },
        {
          "phrase": "The quick brown fox jumps over the lazy dog.",
          "ms": 1834.9703000000009,
          "audioSeconds": 3.9550113378684806
        }
      ]
    },
    {
      "startupMs": 2985.1837000000014,
      "cold": {
        "phrase": "OK.",
        "ms": 1248.7106999999996,
        "audioSeconds": 1.02
      },
      "warm": [
        {
          "phrase": "OK.",
          "ms": 783.0285000000003,
          "audioSeconds": 1.02
        },
        {
          "phrase": "Hello world.",
          "ms": 862.6588999999985,
          "audioSeconds": 1.246031746031746
        },
        {
          "phrase": "The quick brown fox jumps over the lazy dog.",
          "ms": 1769.084600000002,
          "audioSeconds": 3.9550113378684806
        },
        {
          "phrase": "OK.",
          "ms": 736.5794000000024,
          "audioSeconds": 1.02
        },
        {
          "phrase": "Hello world.",
          "ms": 835.0748999999996,
          "audioSeconds": 1.246031746031746
        },
        {
          "phrase": "The quick brown fox jumps over the lazy dog.",
          "ms": 2106.3852000000043,
          "audioSeconds": 3.9550113378684806
        },
        {
          "phrase": "OK.",
          "ms": 709.7766000000047,
          "audioSeconds": 1.02
        },
        {
          "phrase": "Hello world.",
          "ms": 811.8694000000032,
          "audioSeconds": 1.246031746031746
        },
        {
          "phrase": "The quick brown fox jumps over the lazy dog.",
          "ms": 1756.0336000000025,
          "audioSeconds": 3.9550113378684806
        },
        {
          "phrase": "OK.",
          "ms": 725.9632999999958,
          "audioSeconds": 1.02
        },
        {
          "phrase": "Hello world.",
          "ms": 769.7282999999952,
          "audioSeconds": 1.246031746031746
        },
        {
          "phrase": "The quick brown fox jumps over the lazy dog.",
          "ms": 1709.5573999999979,
          "audioSeconds": 3.9550113378684806
        },
        {
          "phrase": "OK.",
          "ms": 721.9035999999978,
          "audioSeconds": 1.02
        },
        {
          "phrase": "Hello world.",
          "ms": 879.9600999999966,
          "audioSeconds": 1.246031746031746
        },
        {
          "phrase": "The quick brown fox jumps over the lazy dog.",
          "ms": 1775.8694000000032,
          "audioSeconds": 3.9550113378684806
        }
      ]
    },
    {
      "startupMs": 2992.694300000003,
      "cold": {
        "phrase": "OK.",
        "ms": 1176.7584999999963,
        "audioSeconds": 1.02
      },
      "warm": [
        {
          "phrase": "OK.",
          "ms": 753.7053000000014,
          "audioSeconds": 1.02
        },
        {
          "phrase": "Hello world.",
          "ms": 818.5699999999997,
          "audioSeconds": 1.246031746031746
        },
        {
          "phrase": "The quick brown fox jumps over the lazy dog.",
          "ms": 1763.6561000000002,
          "audioSeconds": 3.9550113378684806
        },
        {
          "phrase": "OK.",
          "ms": 696.5300999999963,
          "audioSeconds": 1.02
        },
        {
          "phrase": "Hello world.",
          "ms": 780.8962000000029,
          "audioSeconds": 1.246031746031746
        },
        {
          "phrase": "The quick brown fox jumps over the lazy dog.",
          "ms": 1783.294200000004,
          "audioSeconds": 3.9550113378684806
        },
        {
          "phrase": "OK.",
          "ms": 739.6929999999993,
          "audioSeconds": 1.02
        },
        {
          "phrase": "Hello world.",
          "ms": 846.2887000000046,
          "audioSeconds": 1.246031746031746
        },
        {
          "phrase": "The quick brown fox jumps over the lazy dog.",
          "ms": 1756.352199999994,
          "audioSeconds": 3.9550113378684806
        },
        {
          "phrase": "OK.",
          "ms": 740.6150000000052,
          "audioSeconds": 1.02
        },
        {
          "phrase": "Hello world.",
          "ms": 817.2514999999985,
          "audioSeconds": 1.246031746031746
        },
        {
          "phrase": "The quick brown fox jumps over the lazy dog.",
          "ms": 1625.3443000000043,
          "audioSeconds": 3.9550113378684806
        },
        {
          "phrase": "OK.",
          "ms": 695.0485999999946,
          "audioSeconds": 1.02
        },
        {
          "phrase": "Hello world.",
          "ms": 796.3561999999947,
          "audioSeconds": 1.246031746031746
        },
        {
          "phrase": "The quick brown fox jumps over the lazy dog.",
          "ms": 1694.5239999999976,
          "audioSeconds": 3.9550113378684806
        }
      ]
    }
  ]
}
```

</details>

Individual per-render stage records are omitted from these excerpts; their distributions are included. The script also emits those individual records for reproduction.
