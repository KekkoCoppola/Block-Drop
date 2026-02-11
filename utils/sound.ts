import { SoundManager } from '../types';

class WebAudioSoundManager implements SoundManager {
  private ctx: AudioContext | null = null;
  private masterVolume: number = 0.4;
  private musicVolume: number = 0.25; // Slightly louder for rhythm
  private noiseBuffer: AudioBuffer | null = null;
  
  // Music Scheduler State
  private isMusicPlaying: boolean = false;
  private timerID: number | null = null;
  private nextNoteTime: number = 0;
  private current16thNote: number = 0;
  private tempo: number = 135; // BPM - Frenetic
  private lookahead: number = 25.0; // ms
  private scheduleAheadTime: number = 0.1; // s

  // Scale (C Minor)
  private scale = [
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

  private advanceNote() {
    const secondsPerBeat = 60.0 / this.tempo;
    // We are scheduling 16th notes (4 notes per beat)
    this.nextNoteTime += 0.25 * secondsPerBeat; 
    this.current16thNote++;
    if (this.current16thNote === 16) {
      this.current16thNote = 0;
    }
  }

  private scheduleNote(beatNumber: number, time: number) {
    const ctx = this.ctx!;
    
    // 1. KICK (Four on the floor: 0, 4, 8, 12)
    if (beatNumber % 4 === 0) {
      this.playKickMusic(time);
    }

    // 2. HI-HAT (Off-beats and 16ths for drive)
    // Open hat on the "&" of the beat (2, 6, 10, 14)
    if (beatNumber % 4 === 2) {
       this.playHiHatMusic(time, 0.4); // Accent
    } else if (beatNumber % 2 !== 0) {
       this.playHiHatMusic(time, 0.1); // Ghost note
    }

    // 3. BASS (Driving 8th notes: 0, 2, 4...)
    if (beatNumber % 2 === 0) {
       // Root note (C2 = 65.41Hz)
       this.playBassMusic(time, 65.41);
    }

    // 4. ARPEGGIO (Random/Procedural pattern on 16ths)
    // Simple pattern logic based on beat
    const noteIdx = (beatNumber * 7) % this.scale.length; // Pseudo-random walk
    const freq = this.scale[noteIdx];
    // Don't play every single 16th to create groove space
    if (beatNumber !== 0 && beatNumber !== 8) {
        this.playArpMusic(time, freq);
    }
  }

  // --- MUSIC INSTRUMENTS ---

  private playKickMusic(time: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.setValueAtTime(150, time);
    osc.frequency.exponentialRampToValueAtTime(0.01, time + 0.5);
    
    gain.gain.setValueAtTime(1.0 * this.musicVolume * this.masterVolume, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.5);

    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(time);
    osc.stop(time + 0.5);
  }

  private playHiHatMusic(time: number, vol: number) {
    if (!this.noiseBuffer) return;
    const ctx = this.ctx!;
    
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 8000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol * this.musicVolume * this.masterVolume, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.05);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    src.start(time);
    src.stop(time + 0.05);
  }

  private playBassMusic(time: number, freq: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, time);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(100, time);
    filter.frequency.exponentialRampToValueAtTime(800, time + 0.1); // "Womp" attack
    filter.frequency.exponentialRampToValueAtTime(100, time + 0.2);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6 * this.musicVolume * this.masterVolume, time);
    gain.gain.linearRampToValueAtTime(0, time + 0.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(time);
    osc.stop(time + 0.25);
  }

  private playArpMusic(time: number, freq: number) {
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(freq, time);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.15 * this.musicVolume * this.masterVolume, time);
    gain.gain.exponentialRampToValueAtTime(0.01, time + 0.1);

    // Pan the arp slightly
    const panner = ctx.createStereoPanner();
    panner.pan.value = Math.sin(time * 2); // Auto-pan

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(ctx.destination);
    
    osc.start(time);
    osc.stop(time + 0.15);
  }

  // --- SFX (Existing) ---

  playDrop() {
    const ctx = this.getCtx();
    if (!ctx || !this.noiseBuffer) return;
    const t = ctx.currentTime;

    // Hard Plastic Impact
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = this.noiseBuffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'lowpass';
    noiseFilter.frequency.setValueAtTime(800, t); 
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8 * this.masterVolume, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1); 

    noiseSrc.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noiseSrc.start(t);
    noiseSrc.stop(t + 0.1);

    // Body Thud
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, t);
    osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.6 * this.masterVolume, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.15);
  }

  playMerge(comboLevel: number) {
    const ctx = this.getCtx();
    if (!ctx || !this.noiseBuffer) return;
    const t = ctx.currentTime;
    const pitchMod = Math.min(comboLevel, 10) * 100; 

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
    slideGain.connect(ctx.destination);
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
    noiseGain.connect(ctx.destination);
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
    thudGain.connect(ctx.destination);
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
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 1);
  }
}

export const soundManager = new WebAudioSoundManager();
