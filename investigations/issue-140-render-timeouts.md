# Issue 140 render timeout investigation

Facts: PR 151 at 878c53d3 passed 1286 tests on Windows/Node22. CI Node24.20
failed three 30s render timeouts. Two-CPU local run reproduces four timeouts.
The existing frication suite took 65.7s for its first test and 3.5s for its second.
Timeout increases were reverted at the user's request; no repair pushed yet.

Hypotheses: added config validation cost; changed DSP cost; native worklet startup
or execution contention. Compare the same phrase on base 8ed5627b and head with
identical dependencies, WASM, Node24.20 and CPU affinity. Profile import, frontend,
runtime initialization, scheduling, native render, cleanup, plus V8 CPU samples.

Profile evidence (Node24.20, affinity mask3, identical dependencies/WASM):
- Base cold/warm render excluding import: ~1.27/0.59s; head ~1.55/0.63s.
- Standalone Vite import phase ~24s was mostly FSWatcher setup; this is separate
  from timed test execution and not the CI timeout cause.
- Actual concurrent Vitest profile: native-render phase58.922s, process CPU20.734s
  user +22.312s system. Runtime init0.78-2.2s and schedule0.2-1s do not explain it.
- Completed worklet profile: process(program)26.3s, idle24.3s, runLoop4.06s,
  GC3.25s, immediate dispatch1.43s; DSP process samples only~81ms.
- Dependency native loop polls try_recv at highest thread priority and returns
  to a setImmediate loop. Multiple offline renders oversubscribe that host loop.
- Same three suites serially: all7 tests pass with original timeouts in18.73s;
  frication first test4.1s instead of63.2s.

Serial scheduling was a diagnostic only and was reverted. Thread priority
normalization also failed to resolve contention.

Root-cause regression in node-web-audio-api: a constructed offline worklet,
before rendering begins, used 1015ms CPU over 1005ms wall time. The regression
also checks message-port responsiveness and exact constant rendered samples.

Repair: let offline workers receive a command with a bounded 1ms idle wait,
then drain queued commands. This avoids the busy setImmediate loop, wakes as
soon as rendering work arrives, and regularly yields to JS messages/shutdown.
Realtime contexts retain nonblocking polling. The JS generator template and
generated context both propagate the offline flag to the native entry point.

The regression passes with this repair. Same Node24.20, two-CPU concurrent
Qlatt workload: all7 tests pass in16.57s with original timeouts (11 renders,
including long phrases). Hello-world native render:0.40s. The initial broader
wait experiment also passed in16.16s. No test scheduling or timeout changes.

Dependency repair: https://github.com/ctoth/node-web-audio-api/pull/1,
pinned at ce3ed1d487a9c2ad4d3090119c208f386a3123f0. Qlatt CI rebuilds
the addon from this source; Windows installs use its rebuilt tracked addon.
