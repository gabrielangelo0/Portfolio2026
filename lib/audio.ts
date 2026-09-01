"use client";

/**
 * Áudio inteiramente sintetizado em Web Audio — nenhum arquivo para baixar, no
 * mesmo espírito do resto do projeto. O motor é procedural: a frequência
 * acompanha a velocidade em vez de tocar um loop gravado.
 */

const MASTER_VOLUME = 0.55;
const STEP_SECONDS = 0.5; // 120 BPM
const SCHEDULE_AHEAD = 1; // segundos de antecedência do agendador

/** Am — F — C — G, um acorde a cada 16 passos. */
const PROGRESSION = [
  [220.0, 261.63, 329.63],
  [174.61, 220.0, 261.63],
  [196.0, 261.63, 329.63],
  [196.0, 246.94, 293.66],
];

/** Pentatônica de lá menor, para a melodia nunca destoar do acorde. */
const SCALE = [220.0, 261.63, 293.66, 329.63, 392.0, 440.0, 523.25];
const MELODY_STEPS = [0, 3, 6, 7, 10, 13];

type Buses = { music: GainNode; engine: GainNode; sfx: GainNode };

class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private buses: Buses | null = null;
  private engineOscillators: OscillatorNode[] = [];
  private engineFilter: BiquadFilterNode | null = null;
  private engineGain: GainNode | null = null;
  private skidGain: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private scheduler: number | null = null;
  private nextStepTime = 0;
  private step = 0;
  private lastImpact = 0;
  private muted = false;

  get started() {
    return this.ctx !== null;
  }

  /** Precisa ser chamado dentro de um gesto do usuário (política de autoplay). */
  start() {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }

    const Constructor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Constructor) return;

    let ctx: AudioContext;
    try {
      ctx = new Constructor();
    } catch {
      return; // navegador recusou criar o contexto
    }
    this.ctx = ctx;

    const master = ctx.createGain();
    master.gain.value = this.muted ? 0 : MASTER_VOLUME;
    master.connect(ctx.destination);
    this.master = master;

    const music = ctx.createGain();
    music.gain.value = 0.32;
    music.connect(master);

    const engine = ctx.createGain();
    engine.gain.value = 0.5;
    engine.connect(master);

    const sfx = ctx.createGain();
    sfx.gain.value = 0.9;
    sfx.connect(master);

    this.buses = { music, engine, sfx };
    this.noise = this.createNoiseBuffer(ctx);
    this.buildEngine(ctx, engine);
    this.buildSkid(ctx, engine);
    this.startMusic(ctx);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (!this.ctx || !this.master) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setTargetAtTime(muted ? 0 : MASTER_VOLUME, now, 0.05);
  }

  /** Suspende o contexto quando a aba sai de vista. */
  setActive(active: boolean) {
    if (!this.ctx) return;
    if (active) void this.ctx.resume();
    else void this.ctx.suspend();
  }

  /** Chamado a cada frame: velocidade em m/s, acelerador em -1..1, derrapagem em m/s. */
  updateEngine(speed: number, throttle: number, slip: number) {
    const ctx = this.ctx;
    if (!ctx || !this.engineFilter || !this.engineGain || !this.skidGain) return;

    const now = ctx.currentTime;
    const magnitude = Math.abs(speed);
    const load = Math.min(Math.abs(throttle), 1);

    // rotação: sobe com a velocidade e ganha um empurrão quando há acelerador
    const rpm = 42 + magnitude * 11 + load * 16;
    for (let i = 0; i < this.engineOscillators.length; i++) {
      const ratio = [1, 2.01, 3.02][i] ?? 1;
      this.engineOscillators[i].frequency.setTargetAtTime(rpm * ratio, now, 0.08);
    }

    this.engineFilter.frequency.setTargetAtTime(
      320 + magnitude * 150 + load * 520,
      now,
      0.09,
    );
    this.engineGain.gain.setTargetAtTime(
      0.05 + Math.min(magnitude / 18, 1) * 0.1 + load * 0.05,
      now,
      0.12,
    );

    // derrapagem: só aparece quando o carro escorrega de lado com velocidade
    const skid = Math.min(Math.max(Math.abs(slip) - 1.2, 0) / 5, 1) * Math.min(magnitude / 6, 1);
    this.skidGain.gain.setTargetAtTime(skid * 0.16, now, 0.06);
  }

  /** Batida: `intensity` de 0 a 1. */
  impact(intensity: number) {
    const ctx = this.ctx;
    if (!ctx || !this.buses || !this.noise) return;

    const now = ctx.currentTime;
    if (now - this.lastImpact < 0.12) return; // evita metralhar em colisões contínuas
    this.lastImpact = now;

    const strength = Math.min(Math.max(intensity, 0), 1);

    const source = ctx.createBufferSource();
    source.buffer = this.noise;
    source.playbackRate.value = 0.7 + strength * 0.5;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420 + strength * 1400;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.12 + strength * 0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16 + strength * 0.2);

    source.connect(filter).connect(gain).connect(this.buses.sfx);
    source.start(now);
    source.stop(now + 0.5);

    // um "toc" grave dá corpo à pancada
    const thump = ctx.createOscillator();
    thump.type = "sine";
    thump.frequency.setValueAtTime(120 + strength * 40, now);
    thump.frequency.exponentialRampToValueAtTime(45, now + 0.18);

    const thumpGain = ctx.createGain();
    thumpGain.gain.setValueAtTime(0.16 + strength * 0.28, now);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

    thump.connect(thumpGain).connect(this.buses.sfx);
    thump.start(now);
    thump.stop(now + 0.3);
  }

  /** Chegada a uma zona de conteúdo. */
  zoneReached() {
    const ctx = this.ctx;
    if (!ctx || !this.buses) return;

    const now = ctx.currentTime;
    [523.25, 783.99].forEach((frequency, index) => {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = frequency;

      const gain = ctx.createGain();
      const at = now + index * 0.09;
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(0.22, at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, at + 1.1);

      osc.connect(gain).connect(this.buses!.sfx);
      osc.start(at);
      osc.stop(at + 1.2);
    });
  }

  // ---------- construção ----------

  private createNoiseBuffer(ctx: AudioContext) {
    const buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  private buildEngine(ctx: AudioContext, output: GainNode) {
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400;
    filter.Q.value = 6;

    const gain = ctx.createGain();
    gain.gain.value = 0.05;

    filter.connect(gain).connect(output);

    // três parciais dão um ronco mais encorpado que um oscilador sozinho
    for (const [ratio, type] of [
      [1, "sawtooth"],
      [2.01, "square"],
      [3.02, "sawtooth"],
    ] as const) {
      const osc = ctx.createOscillator();
      osc.type = type;
      osc.frequency.value = 42 * ratio;

      const partial = ctx.createGain();
      partial.gain.value = ratio === 1 ? 0.6 : 0.22;

      osc.connect(partial).connect(filter);
      osc.start();
      this.engineOscillators.push(osc);
    }

    this.engineFilter = filter;
    this.engineGain = gain;
  }

  private buildSkid(ctx: AudioContext, output: GainNode) {
    if (!this.noise) return;

    const source = ctx.createBufferSource();
    source.buffer = this.noise;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1800;
    filter.Q.value = 1.4;

    const gain = ctx.createGain();
    gain.gain.value = 0;

    source.connect(filter).connect(gain).connect(output);
    source.start();
    this.skidGain = gain;
  }

  // ---------- trilha ----------

  private startMusic(ctx: AudioContext) {
    this.nextStepTime = ctx.currentTime + 0.2;
    this.step = 0;

    // agendador com lookahead: setInterval sozinho não é preciso o bastante
    this.scheduler = window.setInterval(() => {
      if (!this.ctx) return;
      while (this.nextStepTime < this.ctx.currentTime + SCHEDULE_AHEAD) {
        this.playStep(this.nextStepTime, this.step);
        this.step += 1;
        this.nextStepTime += STEP_SECONDS;
      }
    }, 200);
  }

  private playStep(time: number, step: number) {
    const ctx = this.ctx;
    if (!ctx || !this.buses) return;

    if (step % 16 === 0) {
      const chord = PROGRESSION[(step / 16) % PROGRESSION.length];
      this.playPad(ctx, chord, time);
    }

    if (MELODY_STEPS.includes(step % 16) && Math.random() > 0.35) {
      const note = SCALE[Math.floor(Math.random() * SCALE.length)];
      this.playPluck(ctx, note, time);
    }
  }

  private playPad(ctx: AudioContext, chord: number[], time: number) {
    if (!this.buses) return;
    const duration = STEP_SECONDS * 16;

    for (const frequency of chord) {
      for (const detune of [-6, 6]) {
        const osc = ctx.createOscillator();
        osc.type = "triangle";
        osc.frequency.value = frequency;
        osc.detune.value = detune;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(0.06, time + 2);
        gain.gain.setValueAtTime(0.06, time + duration - 2.5);
        gain.gain.linearRampToValueAtTime(0, time + duration);

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(600, time);
        filter.frequency.linearRampToValueAtTime(1300, time + duration / 2);
        filter.frequency.linearRampToValueAtTime(700, time + duration);

        osc.connect(filter).connect(gain).connect(this.buses.music);
        osc.start(time);
        osc.stop(time + duration + 0.1);
      }
    }
  }

  private playPluck(ctx: AudioContext, frequency: number, time: number) {
    if (!this.buses) return;

    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = frequency;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(0.12, time + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 1.4);

    osc.connect(gain).connect(this.buses.music);
    osc.start(time);
    osc.stop(time + 1.5);
  }
}

export const audio = new GameAudio();
