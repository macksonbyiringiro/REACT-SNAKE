let audioContext: AudioContext | null = null;

// This function should be called after a user interaction to initialize the AudioContext.
export const initAudio = () => {
  if (audioContext) return;
  try {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  } catch (e) {
    console.error('Web Audio API is not supported in this browser.');
  }
};

const playSound = (
  frequency: number,
  duration: number,
  volume: number,
  type: OscillatorType
) => {
  if (!audioContext || audioContext.state === 'closed') {
    return;
  }
  
  // Resume context if it's suspended (e.g., due to browser policies)
  if (audioContext.state === 'suspended') {
      audioContext.resume();
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
  oscillator.type = type;

  oscillator.start(audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration / 1000);
  oscillator.stop(audioContext.currentTime + duration / 1000);
};

// A short, high-pitched sound for eating food.
export const playEatSound = () => {
  playSound(800, 50, 0.1, 'triangle');
};

// A lower, more distinct sound for game over.
export const playGameOverSound = () => {
  playSound(200, 150, 0.2, 'sawtooth');
  setTimeout(() => playSound(100, 200, 0.2, 'sawtooth'), 80);
};
