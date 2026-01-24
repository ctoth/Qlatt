# 16-bit Issue 11: Missing ndbScale Offsets - Coder Report

## Date: 2026-01-23

## Fixes Applied

All 4 fixes for missing ndbScale offsets have been applied to `src/klatt-synth.js`.

### Fix 1: setParam() AN case (line 862-863)

Added ndbScale.AN offset (-58):

```javascript
case "parallelNasalGain":
case "AN":
  // Apply ndbScale.AN (-58) to convert Klatt parameter to safe linear
  this.nodes.parallelNasalGain.gain.setValueAtTime(this._dbToLinear(value + (-58)), atTime);
  break;
```

### Fix 2: setParam() AB case (line 877-880)

Added ndbScale.AB offset (-84):

```javascript
case "AB":
  // Apply ndbScale.AB (-84) to convert Klatt parameter to safe linear
  this.nodes.parallelBypassGain.gain.setValueAtTime(this._dbToLinear(value + (-84)), atTime);
  break;
```

Note: Also fixed duplicate `break;` statement that was present in original code.

### Fix 3: _applyAllParams() bypass gain (line 296-299)

Added ndbScale.AB offset (-84):

```javascript
const bypassGain = Number.isFinite(p.AB)
  // Apply ndbScale.AB (-84) for safe Klatt parameter conversion
  ? this._dbToLinear(p.AB + (-84)) * parallelScale
  : p.parallelBypassGain;
```

### Fix 4: _applyAllParams() nasal gain (line 301-306)

Added ndbScale.AN offset (-58):

```javascript
const nasalDb = Number.isFinite(p.parallelNasalGain) ? p.parallelNasalGain : p.AN;
this.nodes.parallelNasalGain.gain.setValueAtTime(
  // Apply ndbScale.AN (-58) for safe Klatt parameter conversion
  this._dbToLinear(nasalDb + (-58)) * parallelScale,
  atTime
);
```

## Consistency Note

Used literal values (-58, -84) with comments explaining they're ndbScale offsets, matching the approach in `_applyKlattParams()` where `ndbScale` is defined locally. This is simpler than extracting ndbScale to a class property since these are the only call sites outside `_applyKlattParams()`.

## Not Fixed (Out of Scope)

- Priority 3: Proximity correction issue
- Issue 3: AVS *10 multiplier

## Status

Complete. Changes not staged or committed per instructions.
