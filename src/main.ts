import './style.css'
import { safeCompile } from './ui/app'
import type { SafeCompilationResult } from './ui/app'
import { generateSummary, formatEventsAsJson } from './dsl/compiler'
import type { CompilationResult } from './dsl/compiler'
import {
  initScheduler,
  play,
  stop,
  restart,
  setLoopEnabled,
  isSchedulerPlaying,
  setTrackMuted,
  setTrackSoloed,
  isTrackMuted,
  isTrackSoloed,
  getTrackNames,
  getTransportState,
} from './audio/scheduler'
import type { TransportState } from './audio/scheduler'
import { initVisualizer, startVisualizer, stopVisualizer } from './ui/visualizer'

// Example DSL program to prefill the editor
const exampleProgram = `// Web DSL Music Sequencer - Example Program
// This is a simple melody demonstration

bpm 120
loop 2

inst lead sine

seq:
  C4 1/4, D4 1/4, E4 1/4, F4 1/4,
  G4 1/2, E4 1/4, C4 1/4,
  D4 1/4, D4 1/4, E4 1/4, D4 1/4,
  C4 1/1
`

// DOM Elements
const editorElement = document.getElementById('dsl-editor') as HTMLTextAreaElement
const outputElement = document.getElementById('output') as HTMLDivElement
const compileButton = document.getElementById('compile-btn') as HTMLButtonElement
const playButton = document.getElementById('play-btn') as HTMLButtonElement
const stopButton = document.getElementById('stop-btn') as HTMLButtonElement
const restartButton = document.getElementById('restart-btn') as HTMLButtonElement
const loopCheckbox = document.getElementById('loop-checkbox') as HTMLInputElement
const bpmDisplay = document.getElementById('bpm-display') as HTMLSpanElement
const loopLengthDisplay = document.getElementById('loop-length-display') as HTMLSpanElement
const playheadDisplay = document.getElementById('playhead-display') as HTMLSpanElement
const trackControlsContainer = document.getElementById('track-controls') as HTMLDivElement
const debugToggleBtn = document.getElementById('debug-toggle-btn') as HTMLButtonElement
const debugPanel = document.getElementById('debug-panel') as HTMLDivElement
const debugAstContent = document.getElementById('debug-ast-content') as HTMLPreElement
const debugEventsContent = document.getElementById('debug-events-content') as HTMLPreElement
const waveformCanvas = document.getElementById('waveform-canvas') as HTMLCanvasElement

// Current compilation result
let currentCompilationResult: CompilationResult | null = null

// Prefill editor with example program
if (editorElement) {
  editorElement.value = exampleProgram
}

/**
 * Display compilation result in the output panel.
 * Shows summary and JSON representation of events.
 */
function displayCompilationResult(result: CompilationResult): void {
  if (!outputElement) return

  const summary = generateSummary(result)
  const eventsJson = formatEventsAsJson(result.events)

  outputElement.innerHTML = `
    <div class="output-success">
      <h3>Compilation Successful</h3>
      <pre>${summary}</pre>
      <details>
        <summary>Events JSON (${result.eventCount} events)</summary>
        <pre>${eventsJson}</pre>
      </details>
    </div>
  `
}

/**
 * Display error in the output panel.
 */
function displayError(errorMessage: string): void {
  if (!outputElement) return

  outputElement.innerHTML = `
    <div class="output-error">
      <h3>Compilation Error</h3>
      <pre>${errorMessage}</pre>
    </div>
  `
}

/**
 * Display status message in the output panel.
 */
function displayStatus(message: string, isSuccess: boolean = true): void {
  if (!outputElement) return

  const className = isSuccess ? 'output-success' : 'output-placeholder'
  outputElement.innerHTML = `<p class="${className}">${message}</p>`
}

/**
 * Compile the DSL source from the editor.
 * Returns the compilation result or null on error.
 */
function compileSource(): SafeCompilationResult {
  const source = editorElement?.value ?? ''
  return safeCompile(source)
}

/**
 * Update BPM display (9.3.5)
 */
function updateBpmDisplay(bpm: number): void {
  if (bpmDisplay) {
    bpmDisplay.textContent = `BPM: ${bpm}`
  }
}

/**
 * Update loop length display (10.1.3)
 */
function updateLoopLengthDisplay(loopBars: number, bpm: number): void {
  if (loopLengthDisplay) {
    if (loopBars > 0) {
      // Calculate loop duration in seconds (4 beats per bar)
      const loopDurationSec = (loopBars * 4 * 60) / bpm
      loopLengthDisplay.textContent = `Loop: ${loopBars} bar${loopBars > 1 ? 's' : ''} (${formatTime(loopDurationSec)})`
    } else {
      loopLengthDisplay.textContent = 'Loop: --'
    }
  }
}

/**
 * Format time as M:SS.s
 */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toFixed(1).padStart(4, '0')}`
}

/**
 * Update playhead display
 */
function updatePlayheadDisplay(position: number): void {
  if (playheadDisplay) {
    playheadDisplay.textContent = formatTime(position)
  }
}

/**
 * Update transport UI to reflect current state (9.3.6)
 */
function updateTransportUI(state: TransportState): void {
  // Update play/stop button states
  if (playButton) {
    playButton.disabled = state.playing
  }
  if (stopButton) {
    stopButton.disabled = !state.playing
  }
  if (restartButton) {
    restartButton.disabled = !state.playing
  }
  
  // Update loop checkbox
  if (loopCheckbox) {
    loopCheckbox.checked = state.loopEnabled
  }
  
  // Update BPM display
  updateBpmDisplay(state.bpm)
}

/**
 * Handle transport state changes
 */
function onTransportStateChange(state: TransportState): void {
  updateTransportUI(state)
  
  // Start/stop visualizer based on playback state
  if (state.playing) {
    startVisualizer()
  } else {
    stopVisualizer()
  }
}

/**
 * Handle playhead position updates
 */
function onPlayheadUpdate(position: number): void {
  updatePlayheadDisplay(position)
}

/**
 * Calculate event counts per track (10.1.4)
 */
function getEventCountsPerTrack(events: CompilationResult['events']): Map<string, number> {
  const counts = new Map<string, number>()
  for (const event of events) {
    if (event.kind === 'note') {
      const track = event.track ?? 'default'
      counts.set(track, (counts.get(track) ?? 0) + 1)
    }
  }
  return counts
}

/**
 * Build track controls UI (9.4.1, 9.4.2, 10.1.4)
 */
function buildTrackControls(trackNames: string[], events: CompilationResult['events']): void {
  if (!trackControlsContainer) return
  
  if (trackNames.length === 0) {
    trackControlsContainer.innerHTML = ''
    return
  }
  
  // Get event counts per track (10.1.4)
  const eventCounts = getEventCountsPerTrack(events)
  
  const html = trackNames.map(trackName => {
    const eventCount = eventCounts.get(trackName) ?? 0
    return `
    <div class="track-control" data-track="${trackName}">
      <span class="track-name">${trackName}</span>
      <span class="track-event-count">(${eventCount} events)</span>
      <button class="btn-mute ${isTrackMuted(trackName) ? 'active' : ''}" data-track="${trackName}">M</button>
      <button class="btn-solo ${isTrackSoloed(trackName) ? 'active' : ''}" data-track="${trackName}">S</button>
    </div>
  `}).join('')
  
  trackControlsContainer.innerHTML = html
  
  // Attach event listeners
  trackControlsContainer.querySelectorAll('.btn-mute').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.target as HTMLButtonElement
      const track = target.dataset.track!
      const newState = !isTrackMuted(track)
      setTrackMuted(track, newState)
      target.classList.toggle('active', newState)
    })
  })
  
  trackControlsContainer.querySelectorAll('.btn-solo').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const target = e.target as HTMLButtonElement
      const track = target.dataset.track!
      const newState = !isTrackSoloed(track)
      setTrackSoloed(track, newState)
      target.classList.toggle('active', newState)
    })
  })
}

/**
 * Toggle debug panel visibility (10.2.1, 10.2.2)
 */
function toggleDebugPanel(): void {
  if (debugPanel) {
    const isVisible = debugPanel.style.display !== 'none'
    debugPanel.style.display = isVisible ? 'none' : 'block'
    if (debugToggleBtn) {
      debugToggleBtn.textContent = isVisible ? 'Show Debug' : 'Hide Debug'
    }
  }
}

/**
 * Update debug panel with compilation result (10.2.3, 10.2.4, 10.2.5)
 */
function updateDebugPanel(result: CompilationResult): void {
  // Display compiled AST (10.2.3)
  if (debugAstContent) {
    // Create a simplified AST representation for display
    const astDisplay = {
      bpm: result.bpm,
      globalSettings: result.globalSettings,
      totalDuration: result.totalDuration,
      eventCount: result.eventCount,
    }
    debugAstContent.textContent = JSON.stringify(astDisplay, null, 2)
  }
  
  // Display all compiled events with track metadata (10.2.4, 10.2.5)
  // Chord notes appear as multiple events at the same time
  if (debugEventsContent) {
    const eventsDisplay = result.events.map(event => ({
      t: event.t.toFixed(3),
      dur: event.dur.toFixed(3),
      kind: event.kind,
      track: event.track ?? 'default',
      midi: event.midi,
      freq: event.freq?.toFixed(2),
      vel: event.vel,
      inst: event.inst,
    }))
    debugEventsContent.textContent = JSON.stringify(eventsDisplay, null, 2)
  }
}

/**
 * Initialize scheduler with compilation result
 */
function initializeScheduler(result: CompilationResult): void {
  const loopBars = result.globalSettings.loop ?? 0
  
  initScheduler({
    events: result.events,
    bpm: result.bpm,
    loopBars: loopBars,
    loopEnabled: loopCheckbox?.checked ?? (loopBars > 0),
    onTransportStateChange,
    onPlayheadUpdate,
  })
  
  // Update BPM display
  updateBpmDisplay(result.bpm)
  
  // Update loop length display (10.1.3)
  updateLoopLengthDisplay(loopBars, result.bpm)
  
  // Set loop checkbox default based on program (9.3.4)
  if (loopCheckbox && loopBars > 0) {
    loopCheckbox.checked = true
  }
  
  // Build track controls with event counts (10.1.4)
  const trackNames = getTrackNames(result.events)
  buildTrackControls(trackNames, result.events)
  
  // Update debug panel (10.2.3, 10.2.4, 10.2.5)
  updateDebugPanel(result)
}

// Compile button handler
compileButton?.addEventListener('click', () => {
  const result = compileSource()

  if (result.success && result.result) {
    currentCompilationResult = result.result
    displayCompilationResult(result.result)
    initializeScheduler(result.result)
  } else {
    currentCompilationResult = null
    displayError(result.error?.formattedMessage ?? 'Unknown compilation error')
  }
})

// Play button handler
playButton?.addEventListener('click', async () => {
  // Stop any existing playback first
  if (isSchedulerPlaying()) {
    stop()
  }

  // Compile if needed (or recompile to get fresh events)
  const result = compileSource()

  if (result.success && result.result) {
    currentCompilationResult = result.result
    displayCompilationResult(result.result)
    
    // Initialize scheduler with new events
    initializeScheduler(result.result)
    
    // Start playback
    await play()
    displayStatus(`Playing: ${result.result.eventCount} events over ${result.result.totalDuration.toFixed(2)}s`)
  } else {
    displayError(result.error?.formattedMessage ?? 'Unknown compilation error')
  }
})

// Stop button handler
stopButton?.addEventListener('click', () => {
  stop()
  updatePlayheadDisplay(0)
  displayStatus('Playback stopped.', false)
})

// Restart button handler (9.3.1, 9.3.2)
restartButton?.addEventListener('click', async () => {
  await restart()
  if (currentCompilationResult) {
    displayStatus(`Playing: ${currentCompilationResult.eventCount} events over ${currentCompilationResult.totalDuration.toFixed(2)}s`)
  }
})

// Loop toggle handler (9.3.3)
loopCheckbox?.addEventListener('change', () => {
  setLoopEnabled(loopCheckbox.checked)
})

// Debug toggle handler (10.2.1)
debugToggleBtn?.addEventListener('click', () => {
  toggleDebugPanel()
})

// Initialize waveform visualizer
if (waveformCanvas) {
  initVisualizer(waveformCanvas)
}

// Initial UI state
updateTransportUI(getTransportState())
