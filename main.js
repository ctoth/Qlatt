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
const synthStateDisplay = document.getElementById("synthStateDisplay"); // Get the new display element

// --- Debug Logger ---
let animationFrameId = null; // ID for cancelling the animation frame loop

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

      // --- ADDED: Log the full track and key amplitudes ---
      console.log("[Main UI] Generated Klatt Track (Full):", JSON.stringify(klattTrack, null, 2));
      console.log("[Main UI] Generated Klatt Track (Amplitudes):");
      klattTrack.forEach((event, index) => {
          if (event.params) {
              console.log(`  [${index}] t=${event.time.toFixed(3)}s, Ph=${event.phoneme}, Word=${event.word}: AV=${event.params.AV?.toFixed(1)}, AF=${event.params.AF?.toFixed(1)}, AH=${event.params.AH?.toFixed(1)}, AVS=${event.params.AVS?.toFixed(1)}, AN=${event.params.AN?.toFixed(1)}, A1=${event.params.A1?.toFixed(1)}, A2=${event.params.A2?.toFixed(1)}, A3=${event.params.A3?.toFixed(1)}, A4=${event.params.A4?.toFixed(1)}, A5=${event.params.A5?.toFixed(1)}, A6=${event.params.A6?.toFixed(1)}, AB=${event.params.AB?.toFixed(1)}, GO=${event.params.GO?.toFixed(1)}`);
          } else {
              console.log(`  [${index}] t=${event.time.toFixed(3)}s, Ph=${event.phoneme}, Word=${event.word}: No params object`);
          }
      });
      // --- END ADDED LOGGING ---

      // *** ADDED: Store track globally for inspection ***
      window.lastKlattTrack = klattTrack;
      console.log("[Main UI] Full Klatt track stored in 'window.lastKlattTrack'. Inspect it in the console after execution.");
      // *** END ADDED ***

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
          stopStatusUpdates(); // Stop display updates
          statusDiv.textContent = "Status: Finished speaking.";
          speakTextButton.disabled = false;
          debugLog("Synth stopped, UI updated.");
        } else {
           debugLog("Auto-stop condition not met (synth not running or status changed), not stopping.");
           stopStatusUpdates(); // Stop updates anyway if condition not met
           if (!speakTextButton.disabled) speakTextButton.disabled = false; // Ensure button is re-enabled if stop didn't happen
        }
      }, stopDelay);
    } catch (error) {
      stopStatusUpdates(); // Stop updates on error
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

// --- NEW: Synth State Display Update ---
function updateSynthStatusDisplay() {
  if (!klattSynth || !klattSynth.isRunning) {
    synthStateDisplay.textContent = `Synth State: ${klattSynth?.isRunning ? 'Running (No Track)' : (klattSynth?.isInitialized ? 'Idle' : 'Uninitialized')}`;
    animationFrameId = null; // Stop the loop
    return;
  }

  const state = klattSynth.getCurrentState();
  const paramsText = Object.entries(state.currentParams)
    .map(([key, value]) => `${key}:${value.toFixed(1)}`)
    .join(' ');

  synthStateDisplay.textContent =
`Synth State: Speaking
Time: ${state.currentTime.toFixed(3)}s (Track: ${state.elapsedTrackTime.toFixed(3)}s)
Word: ${state.currentWord}
Phoneme: ${state.currentPhoneme}
Params: ${paramsText}`;

  // Continue the loop
  animationFrameId = requestAnimationFrame(updateSynthStatusDisplay);
}

// Function to start the display loop
function startStatusUpdates() {
    if (animationFrameId === null) { // Prevent multiple loops
        debugLog("Starting synth status updates.");
        updateSynthStatusDisplay(); // Start the loop
    }
}

// Function to stop the display loop
function stopStatusUpdates() {
    if (animationFrameId !== null) {
        debugLog("Stopping synth status updates.");
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
        // Optionally clear the display or set to Idle
        if (synthStateDisplay) synthStateDisplay.textContent = `Synth State: ${klattSynth?.isInitialized ? 'Idle' : 'Uninitialized'}`;
    }
}


// --- Event Listeners ---
initButton.addEventListener("click", initAudio);
speakTextButton.addEventListener("click", () => {
    // Ensure updates are stopped before starting a new speech synthesis
    stopStatusUpdates();
    speakText(); // Call the original function
    startStatusUpdates(); // Start updating the display
});
// Add listeners for manual buttons if keeping them

// --- Initial State ---
speakTextButton.disabled = true;
if (synthStateDisplay) synthStateDisplay.textContent = "Synth State: Uninitialized"; // Initial display text
// Disable manual buttons initially if keeping them
