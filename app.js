// Timer State Management
let timerState = {
  isRunning: false,
  isPaused: false,
  startTime: null,
  pausedTime: 0,
  elapsedTime: 0,
  intervalId: null
};

let timerHistory = [];
let lastSpacebarPress = 0;
const DOUBLE_TAP_THRESHOLD = 300; // milliseconds

// DOM Elements
const timerWidget = document.getElementById('timerWidget');
const widgetHeader = document.getElementById('widgetHeader');
const timerDisplay = document.getElementById('timerDisplay');
const miniTimer = document.getElementById('miniTimer');
const statusIndicator = document.getElementById('statusIndicator');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const minimizeBtn = document.getElementById('minimizeBtn');
const noteInput = document.getElementById('noteInput');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const miniPlayPause = document.getElementById('miniPlayPause');
const miniStop = document.getElementById('miniStop');

// Initialize
function init() {
  loadHistory();
  updateDisplay();
  setupEventListeners();
  makeDraggable();
}

// Event Listeners
function setupEventListeners() {
  // Button controls
  startBtn.addEventListener('click', startTimer);
  pauseBtn.addEventListener('click', pauseTimer);
  stopBtn.addEventListener('click', stopTimer);
  minimizeBtn.addEventListener('click', toggleMinimize);
  clearHistoryBtn.addEventListener('click', clearHistory);
  
  // Mini controls
  miniPlayPause.addEventListener('click', togglePlayPause);
  miniStop.addEventListener('click', stopTimer);
  
  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeyboard);
  
  // Prevent spacebar from scrolling page
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target === document.body) {
      e.preventDefault();
    }
  });
}

function handleKeyboard(e) {
  // Ignore if user is typing in input field
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    return;
  }
  
  // Spacebar - Play/Pause or Double tap for new timer
  if (e.code === 'Space') {
    e.preventDefault();
    const now = Date.now();
    
    if (now - lastSpacebarPress < DOUBLE_TAP_THRESHOLD) {
      // Double tap detected - start new timer
      if (timerState.isRunning || timerState.isPaused) {
        stopTimer();
      }
      setTimeout(() => startTimer(), 100);
      lastSpacebarPress = 0; // Reset to prevent triple tap
    } else {
      // Single tap - toggle play/pause
      togglePlayPause();
      lastSpacebarPress = now;
    }
  }
  
  // Delete or F11 - Stop timer
  if (e.code === 'Delete' || e.code === 'F11') {
    e.preventDefault();
    stopTimer();
  }
}

function togglePlayPause() {
  if (!timerState.isRunning && !timerState.isPaused) {
    startTimer();
  } else if (timerState.isRunning) {
    pauseTimer();
  } else if (timerState.isPaused) {
    resumeTimer();
  }
}

// Timer Functions
function startTimer() {
  if (timerState.isRunning) return;
  
  timerState.isRunning = true;
  timerState.isPaused = false;
  timerState.startTime = Date.now() - timerState.pausedTime;
  
  timerState.intervalId = setInterval(updateTimer, 10);
  
  updateButtonStates();
  updateStatusIndicator('running');
  timerDisplay.classList.add('running');
  timerDisplay.classList.remove('paused');
}

function pauseTimer() {
  if (!timerState.isRunning) return;
  
  timerState.isRunning = false;
  timerState.isPaused = true;
  timerState.pausedTime = Date.now() - timerState.startTime;
  
  clearInterval(timerState.intervalId);
  
  updateButtonStates();
  updateStatusIndicator('paused');
  timerDisplay.classList.remove('running');
  timerDisplay.classList.add('paused');
}

function resumeTimer() {
  if (timerState.isRunning) return;
  
  timerState.isRunning = true;
  timerState.isPaused = false;
  timerState.startTime = Date.now() - timerState.pausedTime;
  
  timerState.intervalId = setInterval(updateTimer, 10);
  
  updateButtonStates();
  updateStatusIndicator('running');
  timerDisplay.classList.add('running');
  timerDisplay.classList.remove('paused');
}

function stopTimer() {
  if (!timerState.isRunning && !timerState.isPaused) return;
  
  clearInterval(timerState.intervalId);
  
  // Save to history
  const duration = timerState.pausedTime || (Date.now() - timerState.startTime);
  const note = noteInput.value.trim() || 'Untitled Timer';
  
  saveToHistory(duration, note);
  
  // Reset timer
  timerState.isRunning = false;
  timerState.isPaused = false;
  timerState.startTime = null;
  timerState.pausedTime = 0;
  timerState.elapsedTime = 0;
  
  // Clear note input
  noteInput.value = '';
  
  updateDisplay();
  updateButtonStates();
  updateStatusIndicator('stopped');
  timerDisplay.classList.remove('running', 'paused');
}

function updateTimer() {
  timerState.elapsedTime = Date.now() - timerState.startTime;
  updateDisplay();
}

function updateDisplay() {
  const time = timerState.isRunning ? timerState.elapsedTime : timerState.pausedTime;
  const formatted = formatTime(time);
  const formattedShort = formatTimeShort(time);
  
  timerDisplay.textContent = formatted;
  miniTimer.textContent = formattedShort;
}

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const milliseconds = ms % 1000;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(milliseconds, 3)}`;
}

function formatTimeShort(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

function pad(num, size = 2) {
  let s = num.toString();
  while (s.length < size) s = '0' + s;
  return s;
}

function updateButtonStates() {
  if (!timerState.isRunning && !timerState.isPaused) {
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = true;
  } else if (timerState.isRunning) {
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    stopBtn.disabled = false;
  } else if (timerState.isPaused) {
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    stopBtn.disabled = false;
  }
  
  // Update mini play/pause icon
  if (timerState.isRunning) {
    miniPlayPause.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/></svg>';
    miniPlayPause.title = 'Pause';
  } else {
    miniPlayPause.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';
    miniPlayPause.title = 'Play';
  }
}

function updateStatusIndicator(state) {
  statusIndicator.className = 'status-indicator';
  if (state === 'running' || state === 'paused') {
    statusIndicator.classList.add(state);
  }
}

// History Management
function saveToHistory(duration, note) {
  const record = {
    id: Date.now(),
    duration: duration,
    note: note,
    timestamp: new Date().toISOString()
  };
  
  timerHistory.unshift(record);
  
  // Keep only last 10 records (but store more in memory)
  if (timerHistory.length > 50) {
    timerHistory = timerHistory.slice(0, 50);
  }
  
  saveHistoryToStorage();
  renderHistory();
}

function loadHistory() {
  // Note: localStorage is blocked in sandboxed environment
  // History will only persist during current session
  timerHistory = [];
  renderHistory();
}

function saveHistoryToStorage() {
  // Note: localStorage is blocked in sandboxed environment
  // This is a placeholder for when deployed to a normal web server
  // In production, this would save to localStorage
}

function clearHistory() {
  if (confirm('Are you sure you want to clear all timer history?')) {
    timerHistory = [];
    saveHistoryToStorage();
    renderHistory();
  }
}

function deleteHistoryItem(id) {
  timerHistory = timerHistory.filter(item => item.id !== id);
  saveHistoryToStorage();
  renderHistory();
}

function renderHistory() {
  if (timerHistory.length === 0) {
    historyList.innerHTML = '<div class="empty-history">No timer records yet</div>';
    return;
  }
  
  const displayHistory = timerHistory.slice(0, 10);
  
  historyList.innerHTML = displayHistory.map(record => {
    const formatted = formatTimeShort(record.duration);
    const date = new Date(record.timestamp);
    const timeString = date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
    const dateString = date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    return `
      <div class="history-item">
        <div class="history-item-content">
          <div class="history-duration">${formatted}</div>
          <div class="history-note">${escapeHtml(record.note)}</div>
          <div class="history-timestamp">${dateString} at ${timeString}</div>
        </div>
        <button class="history-delete" onclick="deleteHistoryItem(${record.id})" title="Delete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      </div>
    `;
  }).join('');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Widget Controls
function toggleMinimize() {
  timerWidget.classList.toggle('minimized');
  
  // Update minimize button icon
  if (timerWidget.classList.contains('minimized')) {
    minimizeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="12" height="12"></rect></svg>';
    minimizeBtn.title = 'Maximize';
  } else {
    minimizeBtn.innerHTML = '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="8" x2="12" y2="8"></line></svg>';
    minimizeBtn.title = 'Minimize';
  }
}

// Draggable Widget
function makeDraggable() {
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;
  
  widgetHeader.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);
  
  function dragStart(e) {
    // Don't drag if clicking on buttons
    if (e.target.closest('.icon-btn') || e.target.closest('button')) {
      return;
    }
    
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    
    if (e.target === widgetHeader || widgetHeader.contains(e.target)) {
      isDragging = true;
      timerWidget.style.cursor = 'grabbing';
    }
  }
  
  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      
      xOffset = currentX;
      yOffset = currentY;
      
      // Remove fixed positioning values
      timerWidget.style.bottom = 'auto';
      timerWidget.style.right = 'auto';
      timerWidget.style.left = '0';
      timerWidget.style.top = '0';
      
      setTranslate(currentX, currentY, timerWidget);
    }
  }
  
  function dragEnd(e) {
    if (isDragging) {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
      timerWidget.style.cursor = 'move';
    }
  }
  
  function setTranslate(xPos, yPos, el) {
    el.style.transform = `translate(${xPos}px, ${yPos}px)`;
  }
}

// Initialize app
init();