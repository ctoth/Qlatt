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

// --- Initialization ---
async function initAudio() {
  if (audioContext) return;
  try {
    statusDiv.textContent = "Status: Initializing Audio Context...";
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }

    statusDiv.textContent = "Status: Loading Synth & Worklets...";
    klattSynth = new KlattSynth(audioContext);
    await klattSynth.initialize();

    statusDiv.textContent = `Status: Ready (Sample Rate: ${audioContext.sampleRate} Hz)`;
    initButton.disabled = true;
    speakTextButton.disabled = false;
    // Enable manual buttons here if keeping them
  } catch (error) {
    console.error("Error initializing audio:", error);
    statusDiv.textContent = `Error initializing audio: ${error.message}`;
  }
}

// --- Manual Mode Functions (Optional) ---
// function setupManualControls() { /* ... */ }
// function startManualSynth() { /* ... */ }
// function stopManualSynth() { /* ... */ }

// --- Text Mode Function ---
function speakText() {
  if (!klattSynth || !textInput || !klattSynth.isInitialized) {
    console.warn("Synth not ready or input missing.");
    return;
  }
  const text = textInput.value.trim();
  if (!text) {
    statusDiv.textContent = "Status: Please enter text to speak.";
    return;
  }

  speakTextButton.disabled = true;
  statusDiv.textContent = `Status: Processing text: "${text}"...`;

  setTimeout(() => {
    try {
      klattSynth.stop();
      klattSynth._applyAllParams(audioContext.currentTime); // Reset synth state/params

      const klattTrack = textToKlattTrack(text); // Generate track
      if (!klattTrack || klattTrack.length <= 1)
        throw new Error("Generated track is empty or invalid.");

      currentTrackDuration = klattTrack[klattTrack.length - 1]?.time || 0; // Get estimated duration

      klattSynth.setTrack(klattTrack); // Schedule the parameter changes
      klattSynth.start(); // Start audio output
      statusDiv.textContent = `Status: Speaking (~${currentTrackDuration.toFixed(
        2
      )}s)...`;

      // Auto-stop
      setTimeout(() => {
        if (
          klattSynth &&
          klattSynth.isRunning &&
          statusDiv.textContent.startsWith("Status: Speaking")
        ) {
          klattSynth.stop();
          statusDiv.textContent = "Status: Finished speaking.";
          speakTextButton.disabled = false;
        }
      }, (currentTrackDuration + 0.15) * 1000); // Stop buffer
    } catch (error) {
      console.error("Error speaking text:", error);
      statusDiv.textContent = `Error: ${error.message}`;
      if (klattSynth) klattSynth.stop(); // Ensure stopped on error
      speakTextButton.disabled = false;
    }
  }, 10);
}

// --- Event Listeners ---
initButton.addEventListener("click", initAudio);
speakTextButton.addEventListener("click", speakText);
// Add listeners for manual buttons if keeping them

// --- Initial State ---
speakTextButton.disabled = true;
// Disable manual buttons initially if keeping them
