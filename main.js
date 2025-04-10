import { KlattSynth } from "./klatt-synth.js";
import { textToKlattTrack } from "./tts-frontend.js";

let audioContext;
let klattSynth;
let currentTrackDuration = 0;

// --- Get UI Elements ---
const initButton = document.getElementById("initButton");
// const startManualButton = document.getElementById('startManualButton'); // Optional
// const stopManualButton = document.getElementById('stopManualButton');   // Optional
const statusDiv = document.getElementById("status");
const textInput = document.getElementById("textInput");
const speakTextButton = document.getElementById("speakTextButton");

// --- Debug Logger ---
function debugLog(...args) {
    console.log("[Main UI DEBUG]", ...args);
}

// --- Initialization ---
async function initAudio() {
  debugLog("initAudio() called.");
  if (audioContext) {
     debugLog("AudioContext already exists.");
     return;
  }
  try {
    statusDiv.textContent = "Status: Initializing Audio Context...";
    debugLog("Creating AudioContext...");
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
     debugLog(`AudioContext created. State: ${audioContext.state}, Sample Rate: ${audioContext.sampleRate}`);
    if (audioContext.state === "suspended") {
       debugLog("AudioContext is suspended, attempting to resume...");
      await audioContext.resume();
       debugLog(`AudioContext resumed. State: ${audioContext.state}`);
    }

    statusDiv.textContent = "Status: Loading Synth & Worklets...";
    debugLog("Creating KlattSynth instance...");
    klattSynth = new KlattSynth(audioContext);
    debugLog("Initializing KlattSynth (loading worklets)...");
    await klattSynth.initialize(); // This logs internally now
    debugLog("KlattSynth initialization complete.");

    statusDiv.textContent = `Status: Ready (Sample Rate: ${audioContext.sampleRate} Hz)`;
    initButton.disabled = true;
    speakTextButton.disabled = false;
    debugLog("UI enabled.");
    // Enable manual buttons here if keeping them
  } catch (error) {
    console.error("[Main UI] Error initializing audio:", error);
    statusDiv.textContent = `Error initializing audio: ${error.message}`;
    debugLog("Initialization failed.");
  }
}

// --- Manual Mode Functions (Optional) ---
// function setupManualControls() { /* ... */ }
// function startManualSynth() { /* ... */ }
// function stopManualSynth() { /* ... */ }

// --- Text Mode Function ---
function speakText() {
  debugLog("speakText() called.");
  if (!klattSynth || !textInput || !klattSynth.isInitialized) {
    console.warn("[Main UI] Synth not ready or input missing for speakText.");
    debugLog("Aborting speakText: Synth not ready or input missing.");
    statusDiv.textContent = "Status: Error - Synth not initialized.";
    return;
  }
  const text = textInput.value.trim();
  if (!text) {
    statusDiv.textContent = "Status: Please enter text to speak.";
    debugLog("Aborting speakText: No text entered.");
    return;
  }

  speakTextButton.disabled = true;
  statusDiv.textContent = `Status: Processing text: "${text}"...`;
  debugLog(`Processing text: "${text}"`);

  // Use setTimeout to allow UI update before potentially blocking text processing
  setTimeout(() => {
    debugLog("Inside setTimeout for processing/speaking.");
    try {
      debugLog("Stopping synth (if running) and resetting params...");
      klattSynth.stop(); // Logs internally
      klattSynth._applyAllParams(audioContext.currentTime); // Reset synth state/params, logs internally

      debugLog("Generating Klatt track...");
      const klattTrack = textToKlattTrack(text); // Logs internally
      if (!klattTrack || klattTrack.length <= 1) {
         debugLog("Generated track is empty or invalid.");
         throw new Error("Generated track is empty or invalid.");
      }
      debugLog(`Generated track with ${klattTrack.length} events.`);

      currentTrackDuration = klattTrack[klattTrack.length - 1]?.time || 0; // Get estimated duration
      debugLog(`Estimated track duration: ${currentTrackDuration.toFixed(3)}s`);

      debugLog("Setting track on synth...");
      klattSynth.setTrack(klattTrack); // Logs internally
      debugLog("Starting synth...");
      klattSynth.start(); // Logs internally
      statusDiv.textContent = `Status: Speaking (~${currentTrackDuration.toFixed(
        2
      )}s)...`;
      debugLog("Synth started, speaking.");

      // Auto-stop
      const stopDelay = (currentTrackDuration + 0.15) * 1000; // Stop buffer
      debugLog(`Scheduling auto-stop in ${stopDelay.toFixed(0)}ms.`);
      setTimeout(() => {
        debugLog("Auto-stop timer fired.");
        if (
          klattSynth &&
          klattSynth.isRunning &&
          statusDiv.textContent.startsWith("Status: Speaking") // Check if still supposed to be speaking
        ) {
          debugLog("Synth is running and status is 'Speaking', stopping now.");
          klattSynth.stop(); // Logs internally
          statusDiv.textContent = "Status: Finished speaking.";
          speakTextButton.disabled = false;
          debugLog("Synth stopped, UI updated.");
        } else {
           debugLog("Auto-stop condition not met (synth not running or status changed), not stopping.");
           if (!speakTextButton.disabled) speakTextButton.disabled = false; // Ensure button is re-enabled if stop didn't happen
        }
      }, stopDelay);
    } catch (error) {
      console.error("[Main UI] Error speaking text:", error);
      statusDiv.textContent = `Error: ${error.message}`;
      debugLog(`Error during speakText: ${error.message}`);
      if (klattSynth) {
         debugLog("Ensuring synth is stopped due to error.");
         klattSynth.stop(); // Ensure stopped on error
      }
      speakTextButton.disabled = false; // Re-enable button on error
    }
  }, 10); // Small delay
}

// --- Event Listeners ---
initButton.addEventListener("click", initAudio);
speakTextButton.addEventListener("click", speakText);
// Add listeners for manual buttons if keeping them

// --- Initial State ---
speakTextButton.disabled = true;
// Disable manual buttons initially if keeping them
