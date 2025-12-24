/**
 * Audio Waveform Visualizer Module
 * Renders real-time audio waveform visualization using Web Audio API's AnalyserNode.
 */

import { getAnalyser } from '../audio/engine';

/**
 * Visualizer state and configuration.
 */
interface VisualizerState {
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  animationId: number | null;
  isRunning: boolean;
  dataArray: Uint8Array | null;
}

/**
 * Visualizer color configuration.
 */
const COLORS = {
  background: '#1a1a2e',
  waveform: '#00d4ff',
  waveformGlow: 'rgba(0, 212, 255, 0.3)',
  centerLine: 'rgba(255, 255, 255, 0.1)',
};

/**
 * Internal visualizer state.
 */
const state: VisualizerState = {
  canvas: null,
  ctx: null,
  animationId: null,
  isRunning: false,
  dataArray: null,
};

/**
 * Initialize the visualizer with a canvas element.
 * @param canvas - The canvas element to draw on
 */
export function initVisualizer(canvas: HTMLCanvasElement): void {
  state.canvas = canvas;
  state.ctx = canvas.getContext('2d');
  
  // Set canvas size to match display size
  resizeCanvas();
  
  // Handle window resize
  window.addEventListener('resize', resizeCanvas);
}

/**
 * Resize canvas to match its display size.
 * This ensures crisp rendering on high-DPI displays.
 */
function resizeCanvas(): void {
  if (!state.canvas) return;
  
  const rect = state.canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  
  state.canvas.width = rect.width * dpr;
  state.canvas.height = rect.height * dpr;
  
  if (state.ctx) {
    state.ctx.scale(dpr, dpr);
  }
}

/**
 * Start the visualization animation loop.
 */
export function startVisualizer(): void {
  if (state.isRunning) return;
  
  const analyser = getAnalyser();
  if (!analyser) {
    console.warn('Analyser not available, visualizer cannot start');
    return;
  }
  
  // Create data array for frequency data
  state.dataArray = new Uint8Array(analyser.frequencyBinCount);
  state.isRunning = true;
  
  // Start animation loop
  draw();
}

/**
 * Stop the visualization animation loop.
 */
export function stopVisualizer(): void {
  state.isRunning = false;
  
  if (state.animationId !== null) {
    cancelAnimationFrame(state.animationId);
    state.animationId = null;
  }
  
  // Draw flat line when stopped
  drawFlatLine();
}

/**
 * Main draw function called on each animation frame.
 */
function draw(): void {
  if (!state.isRunning) return;
  
  state.animationId = requestAnimationFrame(draw);
  
  const analyser = getAnalyser();
  if (!analyser || !state.ctx || !state.canvas || !state.dataArray) return;
  
  // Get time domain data (waveform)
  // Type assertion needed for compatibility with different TypeScript versions
  analyser.getByteTimeDomainData(state.dataArray as Uint8Array<ArrayBuffer>);
  
  const ctx = state.ctx;
  const canvas = state.canvas;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  
  // Clear canvas with background color
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, width, height);
  
  // Draw center line
  ctx.strokeStyle = COLORS.centerLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();
  
  // Draw waveform glow (thicker, semi-transparent)
  ctx.strokeStyle = COLORS.waveformGlow;
  ctx.lineWidth = 4;
  drawWaveform(ctx, state.dataArray, width, height);
  
  // Draw main waveform
  ctx.strokeStyle = COLORS.waveform;
  ctx.lineWidth = 2;
  drawWaveform(ctx, state.dataArray, width, height);
}

/**
 * Draw the waveform path.
 * @param ctx - Canvas rendering context
 * @param dataArray - Audio data array
 * @param width - Canvas width
 * @param height - Canvas height
 */
function drawWaveform(
  ctx: CanvasRenderingContext2D,
  dataArray: Uint8Array,
  width: number,
  height: number
): void {
  const bufferLength = dataArray.length;
  const sliceWidth = width / bufferLength;
  
  ctx.beginPath();
  
  let x = 0;
  for (let i = 0; i < bufferLength; i++) {
    // Convert byte value (0-255) to normalized value (0-1)
    const v = dataArray[i] / 128.0;
    // Scale to canvas height (centered)
    const y = (v * height) / 2;
    
    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
    
    x += sliceWidth;
  }
  
  ctx.stroke();
}

/**
 * Draw a flat line (when audio is stopped).
 */
function drawFlatLine(): void {
  if (!state.ctx || !state.canvas) return;
  
  const ctx = state.ctx;
  const rect = state.canvas.getBoundingClientRect();
  const width = rect.width;
  const height = rect.height;
  
  // Clear canvas with background color
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, width, height);
  
  // Draw center line
  ctx.strokeStyle = COLORS.centerLine;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();
  
  // Draw flat waveform line
  ctx.strokeStyle = COLORS.waveform;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, height / 2);
  ctx.lineTo(width, height / 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/**
 * Check if the visualizer is currently running.
 * @returns True if the visualizer is running
 */
export function isVisualizerRunning(): boolean {
  return state.isRunning;
}

/**
 * Clean up visualizer resources.
 */
export function destroyVisualizer(): void {
  stopVisualizer();
  window.removeEventListener('resize', resizeCanvas);
  state.canvas = null;
  state.ctx = null;
  state.dataArray = null;
}
