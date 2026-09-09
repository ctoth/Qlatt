# Qlatt as an NVDA voice

The cheapest way to put the synthesizer in front of a listener every day. No
Rust, no packaging: the NVDA driver spawns `scripts/speak-server.ts` in a Qlatt
checkout and streams 16-bit PCM back through nvwave.

## Layout

- `addon/manifest.ini`, `addon/synthDrivers/qlatt.py`: the NVDA add-on.
  While developing, copy `qlatt.py` and a `qlatt.json` into
  `%APPDATA%\nvda\scratchpad\synthDrivers` (Developer Scratchpad enabled in
  Advanced settings); NVDA picks the driver up without a restart.
- `test_protocol.py`: a Python harness that exercises the same protocol the
  driver uses, without NVDA, and writes a WAV. Run it first.
- The server itself is `scripts/speak-server.ts` in the repo root; its protocol
  is documented at the top of that file and pinned by `test/speak-server.test.ts`.

## Install

1. In the Qlatt checkout: `npm install`, then confirm
   `node --loader ts-node/esm/transpile-only --experimental-specifier-resolution=node scripts/speak-server.ts`
   starts and answers `{"op":"hello"}`.
2. `python hosts/nvda/test_protocol.py --repo <checkout> --out hello.wav` and
   listen to `hello.wav`.
3. Zip the contents of `addon/` as `qlatt.nvda-addon` and install it from
   NVDA's add-on store (Install from external source), or copy `addon/` to
   `%APPDATA%\nvda\addons\qlatt` and restart NVDA.
4. Put a `qlatt.json` next to the driver (in the add-on's `synthDrivers`
   folder, or in `scratchpad\synthDrivers` when developing); see
   `qlatt.example.json`:

   ```json
   {"repo": "C:\\Users\\Q\\code\\Qlatt", "node": "node", "frontend": "qlatt-english"}
   ```

   Do not rely on a `[qlatt]` section in `nvda.ini`: NVDA rewrites that file
   from memory on exit and drops sections no loaded module has declared, so
   a hand-added section disappears on the next restart. Values there override
   the sidecar only if present.

5. Select "Qlatt" in NVDA's synthesizer dialog. Voices are the bundled
   frontends (`qlatt-english`, `qlatt-beauty`, `dectalk-english`).

## Status and known limits

- Loaded and speaking inside NVDA 2025.3.2 on 2026-09-09 from the scratchpad.
  Written against the `synthDriverHandler` and `nvwave` sources at
  release-2025.3. Two things were wrong on the first try and are fixed: a
  hand-added `[qlatt]` section in `nvda.ini` is discarded by NVDA on exit
  (hence the sidecar), and `getSynthList` reports a failed `check()` only at
  debug level (hence `check()` logs at info).
- Each text chunk is rendered whole before playback starts, so latency is the
  full render time of the chunk. The server renders through the offline
  WebAudio graph, which is roughly real time. Streaming is the next step and is
  the reason the protocol already returns sample-accurate word markers.
- Rate maps the NVDA slider to 0.5x to 2x through the frontend's rate policy.
  Pitch maps the slider to one octave around 110 Hz by changing the base F0.
- `IndexCommand` is honoured at chunk boundaries: the index fires when the
  audio queued before it has played.
