import { SoundManager } from '../types';

class WebAudioSoundManager implements SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private masterVolume: number = 0.4;
  private musicVolume: number = 0.25; // Slightly louder for rhythm
  private vibrationEnabled: boolean = true;
  private noiseBuffer: AudioBuffer | null = null;
  
  // Music Scheduler State
  private isMusicPlaying: boolean = false;
  private timerID: number | null = null;
  private nextNoteTime: number = 0;
  private current16thNote: number = 0;
  private tempo: number = 140; // BPM - Fast
  private lookahead: number = 25.0; // ms
  private scheduleAheadTime: number = 0.1; // s
  private progression: number = 0; // Increases over time
  private onBeatCallback: ((beat: number, phase: number) => void) | null = null;

  // Scale (C Minor Pentatonic)
  private scale = [
    130.81, // C3
    155.56, // Eb3
    174.61, // F3
    196.00, // G3
    233.08, // Bb3
    261.63, // C4
    311.13, // Eb4
    349.23, // F4
    392.00, // G4
    466.16, // Bb4
    523.25  // C5
  ];

  constructor() {
    // Context is initialized lazily
  }

  init() {
    if (!this.ctx) {
      try {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        if (Ctx) {
          this.ctx = new Ctx();
          
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.value = this.masterVolume;
          this.masterGain.connect(this.ctx.destination);

          this.musicGain = this.ctx.createGain();
          this.musicGain.gain.value = 1.0; // We control music volume via this.musicVolume and this gain node
          this.musicGain.connect(this.masterGain);

          this.createNoiseBuffer();
        }
      } catch (e) {
        console.error("Web Audio API not supported");
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMusic(shouldPlay: boolean) {
    this.isMusicPlaying = shouldPlay;
    if (shouldPlay) {
      const ctx = this.getCtx();
      if (ctx) {
        if (ctx.state === 'suspended') ctx.resume();
        if (this.musicGain) {
            this.musicGain.gain.cancelScheduledValues(ctx.currentTime);
            this.musicGain.gain.setValueAtTime(1.0, ctx.currentTime);
        }
        this.nextNoteTime = ctx.currentTime + 0.1;
        this.current16thNote = 0;
        this.scheduler();
      }
    } else {
      if (this.timerID) {
        window.clearTimeout(this.timerID);
        this.timerID = null;
      }
    }
  }

  fadeOutMusic(duration: number) {
    const ctx = this.getCtx();
    if (!ctx || !this.musicGain) return;
    
    const t = ctx.currentTime;
    this.musicGain.gain.cancelScheduledValues(t);
    this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, t);
    this.musicGain.gain.linearRampToValueAtTime(0, t + duration);
    
    // Stop the scheduler after the fade
    setTimeout(() => {
        if (!this.musicGain || this.musicGain.gain.value <= 0.01) {
            this.toggleMusic(false);
        }
    }, duration * 1000 + 100);
  }

  private createNoiseBuffer() {
    if (!this.ctx) return;
    const bufferSize = this.ctx.sampleRate; 
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.noiseBuffer = buffer;
  }

  setVolume(val: number) {
    this.masterVolume = Math.max(0, Math.min(1, val));
  }

  private getCtx() {
    if (!this.ctx) this.init();
    return this.ctx;
  }

  // --- MUSIC SEQUENCER ---

  private scheduler() {
    if (!this.isMusicPlaying || !this.ctx) return;

    // Schedule notes that fall within the lookahead window
    while (this.nextNoteTime < this.ctx.currentTime + this.scheduleAheadTime) {
      this.scheduleNote(this.current16thNote, this.nextNoteTime);
      this.advanceNote();
    }

    this.timerID = window.setTimeout(() => this.scheduler(), this.lookahead);
  }

  setOnBeatCallback(cb: ((beat: number, phase: number) => void) | null) {
    this.onBeatCallback = cb;
  }

  private advanceNote() {
    // Increase tempo slightly over time
    if (this.tempo < 180) {
      this.tempo += 0.01;
    }

    const secondsPerBeat = 60.0 / this.tempo;
    this.nextNoteTime += 0.25 * secondsPerBeat; 
    this.current16thNote++;
    
    // Pattern progression
    if (this.current16thNote === 16) {
      this.current16thNote = 0;
      this.progression++;
    }
  }

  private scheduleNote(beatNumber: number, time: number) {
    const ctx = this.ctx!;
    const bar = Math.floor(this.progression / 4);
    const phase = bar % 4; // 0, 1, 2, 3

    // Notify UI of the beat
    if (this.onBeatCallback && beatNumber % 4 === 0) {
        // We use setTimeout to bring the callback back to the main thread 
        // and approximate the timing (since Web Audio time is ahead)
        const delay = (time - ctx.currentTime) * 1000;
        setTimeout(() => {
            if (this.onBeatCallback) this.onBeatCallback(beatNumber, phase);
        }, Math.max(0, delay));
    }
    
    // 1. KICK (Four on the floor)
    if (beatNumber % 4 === 0) {
      this.playKickMusic(time);
    }

    // 2. SNARE (on 4 and 12)
    if (beatNumber === 4 || beatNumber === 12) {
      if (phase >= 1) this.playSnareMusic(time);
    }

    // 3. HI-HAT
    if (beatNumber % 2 === 0) {
       this.playHiHatMusic(time, beatNumber % 4 === 2 ? 0.3 : 0.1);
    }
    // Extra hats in later phases
    if (phase >= 2 && beatNumber % 2 !== 0) {
       this.playHiHatMusic(time, 0.05);
    }

    // 4. BASS
    const bassFreqs = [65.41, 77.78, 87.31, 98.00]; // C2, Eb2, F2, G2
    const bassIdx = Math.floor(this.progression / 2) % bassFreqs.length;
    if (beatNumber % 4 === 0 || (phase >= 2 && beatNumber % 4 === 2)) {
       this.playBassMusic(time, bassFreqs[bassIdx]);
    }

    // 5. LEAD / ARPEGGIO
    // Complexity increases with phase
    let shouldPlayArp = false;
    if (phase === 0) shouldPlayArp = beatNumber % 4 === 0;
    if (phase === 1) shouldPlayArp = beatNumber % 2 === 0;
    if (phase >= 2) shouldPlayArp = [0, 3, 6, 8, 11, 14].includes(beatNumber);
    
    if (shouldPlayArp) {
        const scaleLen = this.scale.length;
        // Evolving melody
        const melodyBase = (this.progression * 3) % scaleLen;
        const noteIdx = (melodyBase + (beatNumber % 5)) % scaleLen;
        const freq = this.scale[noteIdx];
        this.playArpMusic(time, freq, phase >= 3);
    }
  }

  // --- MUSIC INSTRUMENTS ---

  private playSnareMusic(time: number) {
    if (!this.noiseBuffer) return;
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 1500;
    filter.Q.value = 0.5;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3 * this.musicVolume * this.masterVolume, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain || ctx.destination);
    
    src.start(time);
    src.stop(time + 0.1);
  }

  private playKickMusic(time: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle'; // Softer 8-bit kick
    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(40, time + 0.15);
    
    gain.gain.setValueAtTime(0.8 * this.musicVolume * this.masterVolume, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.2);

    osc.connect(gain);
    gain.connect(this.musicGain || ctx.destination);
    
    osc.start(time);
    osc.stop(time + 0.2);
  }

  private playHiHatMusic(time: number, vol: number) {
    if (!this.noiseBuffer) return;
    const ctx = this.ctx!;
    
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 10000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol * this.musicVolume * this.masterVolume, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.03);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain || ctx.destination);
    
    src.start(time);
    src.stop(time + 0.03);
  }

  private playBassMusic(time: number, freq: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'square'; // Classic NES bass
    osc.frequency.setValueAtTime(freq, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.25 * this.musicVolume * this.masterVolume, time);
    gain.gain.linearRampToValueAtTime(0, time + 0.15);

    osc.connect(gain);
    gain.connect(this.musicGain || ctx.destination);
    
    osc.start(time);
    osc.stop(time + 0.15);
  }

  private playArpMusic(time: number, freq: number, isDouble: boolean = false) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = isDouble ? 'sawtooth' : 'square';
    osc.frequency.setValueAtTime(freq, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime((isDouble ? 0.1 : 0.15) * this.musicVolume * this.masterVolume, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + (isDouble ? 0.08 : 0.12));

    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.sin(time * 3) * 0.5;

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(this.musicGain || ctx.destination);
    
    osc.start(time);
    osc.stop(time + 0.15);
  }

  // --- SFX (Existing) ---

  playDrop() {
    const ctx = this.getCtx();
    if (!ctx || !this.noiseBuffer) return;
    const t = ctx.currentTime;
    
    // Variation: Random pitch shift
    const pitchShift = Math.random() * 50 - 25;

    // Hard Plastic Impact
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = this.noiseBuffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(800 + pitchShift, t); 
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8 * this.masterVolume, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1); 

    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain || ctx.destination);
    noiseSrc.start(t);
    noiseSrc.stop(t + 0.1);

    // Body Thud
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200 + pitchShift, t);
    osc.frequency.exponentialRampToValueAtTime(50 + pitchShift/2, t + 0.1);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.6 * this.masterVolume, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    osc.connect(oscGain);
    oscGain.connect(this.masterGain || ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  playMerge(comboLevel: number) {
    const ctx = this.getCtx();
    if (!ctx || !this.noiseBuffer) return;
    const t = ctx.currentTime;
    const pitchMod = Math.min(comboLevel, 10) * 100; 
    
    // Add a harmonic layer for higher combos
    if (comboLevel > 2) {
      const harmOsc = ctx.createOscillator();
      harmOsc.type = 'triangle';
      harmOsc.frequency.setValueAtTime(400 + pitchMod * 1.5, t);
      harmOsc.frequency.exponentialRampToValueAtTime(1200 + pitchMod * 1.5, t + 0.1);
      const harmGain = ctx.createGain();
      harmGain.gain.setValueAtTime(0.2 * this.masterVolume, t);
      harmGain.gain.linearRampToValueAtTime(0, t + 0.1);
      harmOsc.connect(harmGain);
      harmGain.connect(this.masterGain || ctx.destination);
      harmOsc.start(t);
      harmOsc.stop(t + 0.1);
    }

    // Slide
    const slideOsc = ctx.createOscillator();
    slideOsc.type = 'sawtooth';
    slideOsc.frequency.setValueAtTime(200 + pitchMod, t);
    slideOsc.frequency.exponentialRampToValueAtTime(800 + pitchMod, t + 0.05); 
    const slideGain = ctx.createGain();
    slideGain.gain.setValueAtTime(0.4 * this.masterVolume, t);
    slideGain.gain.linearRampToValueAtTime(0, t + 0.05);
    const slideFilter = ctx.createBiquadFilter();
    slideFilter.type = 'highpass';
    slideFilter.frequency.value = 1000;
    slideOsc.connect(slideFilter);
    slideFilter.connect(slideGain);
    slideGain.connect(this.masterGain || ctx.destination);
    slideOsc.start(t);
    slideOsc.stop(t + 0.06);

    // Lock Click
    const lockTime = t + 0.03;
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = this.noiseBuffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.Q.value = 1;
    noiseFilter.frequency.setValueAtTime(2500, lockTime);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(1.0 * this.masterVolume, lockTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, lockTime + 0.05);
    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.masterGain || ctx.destination);
    noiseSrc.start(lockTime);
    noiseSrc.stop(lockTime + 0.06);

    // Lock Thud
    const thudOsc = ctx.createOscillator();
    thudOsc.type = 'square';
    thudOsc.frequency.setValueAtTime(150, lockTime);
    thudOsc.frequency.exponentialRampToValueAtTime(40, lockTime + 0.1);
    const thudGain = ctx.createGain();
    thudGain.gain.setValueAtTime(0.3 * this.masterVolume, lockTime);
    thudGain.gain.exponentialRampToValueAtTime(0.01, lockTime + 0.1);
    const thudFilter = ctx.createBiquadFilter();
    thudFilter.type = 'lowpass';
    thudFilter.frequency.value = 300;
    thudOsc.connect(thudFilter);
    thudFilter.connect(thudGain);
    thudGain.connect(this.masterGain || ctx.destination);
    thudOsc.start(lockTime);
    thudOsc.stop(lockTime + 0.15);
  }

  playGameOver() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(100, t);
    osc.frequency.linearRampToValueAtTime(30, t + 1);
    
    gain.gain.setValueAtTime(0.5 * this.masterVolume, t);
    gain.gain.linearRampToValueAtTime(0, t + 1);
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(500, t);
    filter.frequency.linearRampToValueAtTime(50, t + 1);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain || ctx.destination);
    osc.start(t);
    osc.stop(t + 1);
  }

  playClick() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.05);
    
    gain.gain.setValueAtTime(0.2 * this.masterVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.05);
    
    osc.connect(gain);
    gain.connect(this.masterGain || ctx.destination);
    osc.start(t);
    osc.stop(t + 0.05);
  }

  playPop() {
    const ctx = this.getCtx();
    if (!ctx) return;
    const t = ctx.currentTime;
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.08);
    
    gain.gain.setValueAtTime(0.3 * this.masterVolume, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);
    
    osc.connect(gain);
    gain.connect(this.masterGain || ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
  }

  vibrate(pattern: number | number[] = 10) {
    if (this.vibrationEnabled && typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  }

  toggleVibration(enabled: boolean) {
    this.vibrationEnabled = enabled;
  }

  isVibrationEnabled() {
    return this.vibrationEnabled;
  }
}

export const soundManager = new WebAudioSoundManager();
