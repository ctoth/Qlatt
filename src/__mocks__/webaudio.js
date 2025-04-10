// Mock implementation of Web Audio API for testing
import { vi } from 'vitest';

class MockAudioParam {
  constructor(defaultValue = 0) {
    this.value = defaultValue;
    this._scheduledValues = [];
    // Add spies for easier assertion
    this.setValueAtTime = vi.fn(this.setValueAtTime.bind(this));
    this.linearRampToValueAtTime = vi.fn(this.linearRampToValueAtTime.bind(this));
    this.exponentialRampToValueAtTime = vi.fn(this.exponentialRampToValueAtTime.bind(this));
    this.cancelScheduledValues = vi.fn(this.cancelScheduledValues.bind(this));
  }

  setValueAtTime(value, time) {
    this._scheduledValues.push({ type: 'setValue', value, time });
    this.value = value;
    return this;
  }

  linearRampToValueAtTime(value, time) {
    this._scheduledValues.push({ type: 'linearRamp', value, time });
    this.value = value; // For testing, immediately set the value
    return this;
  }

  exponentialRampToValueAtTime(value, time) {
    this._scheduledValues.push({ type: 'exponentialRamp', value, time });
    this.value = value;
    return this;
  }

  cancelScheduledValues(time) {
    this._scheduledValues = this._scheduledValues.filter(v => v.time < time);
    return this;
  }

  getScheduledValues() {
    return [...this._scheduledValues];
  }
  
  mockClear() {
    this.setValueAtTime.mockClear();
    this.linearRampToValueAtTime.mockClear();
    this.exponentialRampToValueAtTime.mockClear();
    this.cancelScheduledValues.mockClear();
    this._scheduledValues = [];
  }
}

class MockAudioNode {
  constructor(context) {
    this.context = context;
    this._connections = [];
    this._inputs = [];
    // Add spies
    this.connect = vi.fn(this.connect.bind(this));
    this.disconnect = vi.fn(this.disconnect.bind(this));
  }

  connect(destination, outputIndex = 0, inputIndex = 0) {
    this._connections.push({ destination, outputIndex, inputIndex });
    if (destination._inputs) {
      destination._inputs.push(this);
    }
    return destination;
  }

  disconnect(destination) {
    if (destination) {
      this._connections = this._connections.filter(conn => conn.destination !== destination);
      if (destination._inputs) {
        destination._inputs = destination._inputs.filter(input => input !== this);
      }
    } else {
      // Disconnect all
      this._connections.forEach(conn => {
        if (conn.destination._inputs) {
          conn.destination._inputs = conn.destination._inputs.filter(input => input !== this);
        }
      });
      this._connections = [];
    }
  }

  getConnections() {
    return [...this._connections];
  }
  
  mockClear() {
    this.connect.mockClear();
    this.disconnect.mockClear();
    this._connections = [];
    this._inputs = [];
  }
}

class MockGainNode extends MockAudioNode {
  constructor(context, options = {}) {
    super(context);
    this.gain = new MockAudioParam(options.gain || 1.0);
  }
  
  mockClear() {
    super.mockClear();
    this.gain.mockClear();
  }
}

class MockBiquadFilterNode extends MockAudioNode {
  constructor(context, options = {}) {
    super(context);
    this.type = options.type || 'lowpass';
    this.frequency = new MockAudioParam(options.frequency || 350);
    this.Q = new MockAudioParam(options.Q || 1);
    this.gain = new MockAudioParam(options.gain || 0);
  }
  
  mockClear() {
    super.mockClear();
    this.frequency.mockClear();
    this.Q.mockClear();
    this.gain.mockClear();
  }
}

class MockAudioWorkletNode extends MockAudioNode {
  constructor(context, processorName, options = {}) {
    super(context);
    this.processorName = processorName;
    this.numberOfInputs = options.numberOfInputs || 1;
    this.numberOfOutputs = options.numberOfOutputs || 1;
    this.parameters = new Map();
    // Add port mock
    this.port = {
      postMessage: vi.fn(),
      onmessage: null
    };
    
    // Add default parameters based on processor name
    if (processorName === 'voicing-source-processor') {
      this.parameters.set('f0', new MockAudioParam(100));
      this.parameters.set('amp', new MockAudioParam(0));
    } else if (processorName === 'noise-source-processor') {
      this.parameters.set('fricationGain', new MockAudioParam(0));
      this.parameters.set('aspirationGain', new MockAudioParam(0));
    }
  }
  
  mockClear() {
    super.mockClear();
    this.parameters.forEach(param => param.mockClear());
    this.port.postMessage.mockClear();
  }
}

class MockAudioContext {
  constructor(options = {}) {
    this.sampleRate = options.sampleRate || 44100;
    this.currentTime = 0;
    this.state = 'running';
    this.destination = new MockAudioNode(this);
    this.listener = {};
    this._nodes = [];
    
    // Mock for AudioWorklet
    this.audioWorklet = {
      addModule: vi.fn().mockResolvedValue(undefined)
    };
    
    // Spy on creation methods
    this.createGain = vi.fn(this.createGain.bind(this));
    this.createBiquadFilter = vi.fn(this.createBiquadFilter.bind(this));
    this.createOscillator = vi.fn(this.createOscillator.bind(this));
  }

  createGain() {
    const node = new MockGainNode(this);
    this._nodes.push(node);
    return node;
  }

  createBiquadFilter() {
    const node = new MockBiquadFilterNode(this);
    this._nodes.push(node);
    return node;
  }

  createOscillator() {
    const node = {
      ...new MockAudioNode(this),
      frequency: new MockAudioParam(440),
      detune: new MockAudioParam(0),
      type: 'sine',
      start: (time = 0) => {},
      stop: (time = 0) => {},
    };
    this._nodes.push(node);
    return node;
  }

  resume() {
    this.state = 'running';
    return Promise.resolve();
  }

  suspend() {
    this.state = 'suspended';
    return Promise.resolve();
  }

  close() {
    this.state = 'closed';
    return Promise.resolve();
  }

  // Utility for tests to advance time
  advanceTime(seconds) {
    this.currentTime += seconds;
  }
  
  mockClear() {
    this.audioWorklet.addModule.mockClear();
    this.createGain.mockClear();
    this.createBiquadFilter.mockClear();
    this.createOscillator.mockClear();
    
    // Clear destination and all created nodes
    if (this.destination.mockClear) this.destination.mockClear();
    this._nodes.forEach(node => {
      if (node.mockClear) node.mockClear();
    });
  }
}

// Function to clear mocks for testing
export function clearWebAudioMocks(mockContextInstance) {
  if (mockContextInstance && typeof mockContextInstance.mockClear === 'function') {
    mockContextInstance.mockClear();
  }
}

// Replace global AudioContext and related classes
global.AudioContext = MockAudioContext;
global.AudioWorkletNode = MockAudioWorkletNode;
global.GainNode = MockGainNode;
global.BiquadFilterNode = MockBiquadFilterNode;

// Export the mock classes for direct use in tests if needed
export { MockAudioContext, MockAudioWorkletNode, MockGainNode, MockBiquadFilterNode, MockAudioParam };
