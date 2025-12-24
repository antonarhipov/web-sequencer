/**
 * Audio Waveform Visualizer Module
 * Renders real-time audio waveform visualization using Web Audio API's AnalyserNode.
 * Supports per-track color visualization.
 */

import { getAnalyser } from '../audio/engine';
import type { SynthEvent } from '../dsl/compiler';

/**
 * Visualizer state and configuration.
 */
interface VisualizerState {
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  animationId: number | null;
  isRunning: boolean;
  dataArray: Uint8Array | null;
  trackColors: Map<string, string>;
  events: SynthEvent[];
  playheadPosition: number;
}

/**
 * Color palette for tracks - vibrant, distinct colors
 */
const TRACK_COLOR_PALETTE = [
  '#00d4ff', // Cyan (default)
  '#ff6b6b', // Coral red
  '#4ecca3', // Mint green
  '#ffd93d', // Yellow
  '#c77dff', // Purple
  '#ff9f43', // Orange
  '#74b9ff', // Light blue
  '#fd79a8', // Pink
  '#a29bfe', // Lavender
  '#55efc4', // Teal
];

/**
 * Base visualizer color configuration.
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
  trackColors: new Map(),
  events: [],
  playheadPosition: 0,
};

/**
 * Set up track colors and events for visualization.
 * Call this when a new composition is compiled.
 * @param trackNames - Array of track names
 * @param events - Array of synth events for timing calculations
 */
export function setVisualizerTracks(trackNames: string[], events: SynthEvent[]): void {
  state.trackColors.clear();
  
  // Assign colors to tracks
  trackNames.forEach((trackName, index) => {
    const color = TRACK_COLOR_PALETTE[index % TRACK_COLOR_PALETTE.length];
    state.trackColors.set(trackName, color);
  });
  
  state.events = events;
}

/**
 * Update the current playhead position for active track calculation.
 * @param position - Current playhead position in seconds
 */
export function updateVisualizerPlayhead(position: number): void {
  state.playheadPosition = position;
}

/**
 * Get the tracks that have notes playing at the given time.
 * @param time - Time in seconds
 * @returns Array of track names that are active
 */
function getActiveTracksAtTime(time: number): string[] {
  const activeTracks = new Set<string>();
  
  // Small window around current time to catch notes
  const windowSize = 0.1; // 100ms window
  
  for (const event of state.events) {
    if (event.kind !== 'note') continue;
    
    const noteStart = event.t;
    const noteEnd = event.t + event.dur;
    
    // Check if note overlaps with current time window
    if (noteStart <= time + windowSize && noteEnd >= time - windowSize) {
      activeTracks.add(event.track ?? 'default');
    }
  }
  
  return Array.from(activeTracks);
}

/**
 * Parse hex color to RGB components.
 * @param hex - Hex color string (e.g., '#ff6b6b')
 * @returns RGB object or null if invalid
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  } : null;
}

/**
 * Blend multiple colors together (average).
 * @param colors - Array of hex color strings
 * @returns Blended hex color string
 */
function blendColors(colors: string[]): string {
  if (colors.length === 0) return COLORS.waveform;
  if (colors.length === 1) return colors[0];
  
  let totalR = 0, totalG = 0, totalB = 0;
  let validColors = 0;
  
  for (const color of colors) {
    const rgb = hexToRgb(color);
    if (rgb) {
      totalR += rgb.r;
      totalG += rgb.g;
      totalB += rgb.b;
      validColors++;
    }
  }
  
  if (validColors === 0) return COLORS.waveform;
  
  const avgR = Math.round(totalR / validColors);
  const avgG = Math.round(totalG / validColors);
  const avgB = Math.round(totalB / validColors);
  
  return `#${avgR.toString(16).padStart(2, '0')}${avgG.toString(16).padStart(2, '0')}${avgB.toString(16).padStart(2, '0')}`;
}

/**
 * Get the current waveform color based on active tracks.
 * @returns Object with main color and glow color
 */
function getCurrentWaveformColors(): { main: string; glow: string } {
  const activeTracks = getActiveTracksAtTime(state.playheadPosition);
  
  if (activeTracks.length === 0) {
    return { main: COLORS.waveform, glow: COLORS.waveformGlow };
  }
  
  // Get colors for active tracks
  const activeColors = activeTracks
    .map(track => state.trackColors.get(track))
    .filter((color): color is string => color !== undefined);
  
  if (activeColors.length === 0) {
    return { main: COLORS.waveform, glow: COLORS.waveformGlow };
  }
  
  const mainColor = blendColors(activeColors);
  const rgb = hexToRgb(mainColor);
  const glowColor = rgb 
    ? `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.3)` 
    : COLORS.waveformGlow;
  
  return { main: mainColor, glow: glowColor };
}

/**
 * Get the assigned color for a track.
 * @param trackName - Name of the track
 * @returns Hex color string for the track
 */
export function getTrackColor(trackName: string): string {
  return state.trackColors.get(trackName) ?? COLORS.waveform;
}

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
  
  // Get dynamic colors based on active tracks
  const waveformColors = getCurrentWaveformColors();
  
  // Draw waveform glow (thicker, semi-transparent)
  ctx.strokeStyle = waveformColors.glow;
  ctx.lineWidth = 4;
  drawWaveform(ctx, state.dataArray, width, height);
  
  // Draw main waveform
  ctx.strokeStyle = waveformColors.main;
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
