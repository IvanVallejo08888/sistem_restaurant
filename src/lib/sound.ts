// Genera un tono corto con WebAudio (sin archivos externos).
export function playDing() {
  if (typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    const tones = [880, 1175];
    tones.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.18;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.3, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
      osc.start(t);
      osc.stop(t + 0.4);
    });
  } catch {
    /* navegador sin soporte de audio: silencioso */
  }
}

// Curva de distorsión para WaveShaperNode (simula el "drive" de guitarra).
function curvaDistorsion(amount: number): Float32Array {
  const n = 44100;
  const curve = new Float32Array(n);
  const deg = Math.PI / 180;
  for (let i = 0; i < n; i++) {
    const x = (i * 2) / n - 1;
    curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
  }
  return curve;
}

// Riff corto de ~2s con power-chords distorsionados (fundamental + quinta),
// para facturas con productos únicamente de la categoría Heladería.
export function playGuitarra() {
  if (typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    const shaper = ctx.createWaveShaper();
    shaper.curve = curvaDistorsion(60) as Float32Array<ArrayBuffer>;
    shaper.oversample = "4x";
    const master = ctx.createGain();
    master.gain.value = 0.35;
    shaper.connect(master);
    master.connect(ctx.destination);

    const notas = [196.0, 196.0, 246.94, 220.0]; // G3, G3, B3, A3
    const dur = 0.5;
    notas.forEach((freq, i) => {
      const t = ctx.currentTime + i * dur;
      [1, 1.5].forEach((mult) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.value = freq * mult;
        osc.connect(gain);
        gain.connect(shaper);
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(0.6, t + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.95);
        osc.start(t);
        osc.stop(t + dur);
      });
    });
  } catch {
    /* navegador sin soporte de audio: silencioso */
  }
}

// Melodía corta de ~2s, brillante y fuerte (fundamental + octava), para
// facturas con productos únicamente de la categoría Comidas Rápidas.
export function playPiano() {
  if (typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);

    const notas = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const dur = 0.5;
    notas.forEach((freq, i) => {
      const t = ctx.currentTime + i * dur;
      [1, 2].forEach((mult, j) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = j === 0 ? "triangle" : "sine";
        osc.frequency.value = freq * mult;
        osc.connect(gain);
        gain.connect(master);
        const peak = j === 0 ? 0.7 : 0.25;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.exponentialRampToValueAtTime(peak, t + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.9);
        osc.start(t);
        osc.stop(t + dur);
      });
    });
  } catch {
    /* navegador sin soporte de audio: silencioso */
  }
}

// Melodía corta de ~2s con vibrato (simula el soplido de un saxofón), para
// facturas que mezclan Heladería y Comidas Rápidas en el mismo pedido.
export function playSaxofon() {
  if (typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new Ctx();
    const master = ctx.createGain();
    master.gain.value = 0.45;
    master.connect(ctx.destination);

    const notas = [392.0, 440.0, 523.25, 466.16]; // G4, A4, C5, A#4
    const dur = 0.5;
    notas.forEach((freq, i) => {
      const t = ctx.currentTime + i * dur;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = freq;

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 6;
      lfoGain.gain.value = 6;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      osc.connect(gain);
      gain.connect(master);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.6, t + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.95);

      lfo.start(t);
      osc.start(t);
      lfo.stop(t + dur);
      osc.stop(t + dur);
    });
  } catch {
    /* navegador sin soporte de audio: silencioso */
  }
}
