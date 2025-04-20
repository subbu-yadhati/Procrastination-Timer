// DOM Elements
const timerDisplay = document.querySelector('.timer-time');
const timerStatus = document.querySelector('.timer-status');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const sessionsCompletedEl = document.getElementById('sessions-completed');
const dailyStreakEl = document.getElementById('daily-streak');
const focusMinutesEl = document.getElementById('focus-minutes');
const todaysSessionsEl = document.getElementById('todays-sessions');
const modalSessionsCompleted = document.getElementById('modal-sessions-completed');
const modalStreak = document.getElementById('modal-streak');
const focusDurationInput = document.getElementById('focus-duration');
const shortBreakDurationInput = document.getElementById('short-break-duration');
const longBreakDurationInput = document.getElementById('long-break-duration');
const autoStartBreaksCheckbox = document.getElementById('auto-start-breaks');
const autoStartWorkCheckbox = document.getElementById('auto-start-work');
const saveSettingsBtn = document.getElementById('save-settings');
const motivationModal = document.getElementById('motivation-modal');
const motivationContent = document.getElementById('motivation-content');
const closeModalBtn = document.getElementById('close-modal');
const modeBtns = document.querySelectorAll('.mode-btn');
const progressCircle = document.querySelector('.timer-progress .progress');
const taskInput = document.getElementById('task-input');
const addTaskBtn = document.getElementById('add-task-btn');
const tasksList = document.getElementById('tasks-list');
const tasksEmptyState = document.getElementById('task-empty-state');
// DOM Elements (continued from existing code)
const notification = document.getElementById('notification');
const notificationTitle = document.getElementById('notification-title');
const notificationMessage = document.getElementById('notification-message');
const notificationClose = document.getElementById('notification-close');
const darkModeToggle = document.getElementById('dark-mode-toggle');
const timerEndSound = document.getElementById('timer-end-sound');
const soundBtn = document.getElementById('sound-btn');
const volumeSlider = document.getElementById('volume-slider');

// Timer variables
let timerInterval;
let timeLeft = 25 * 60; // Default: 25 minutes in seconds
let totalTime = 25 * 60;
let isRunning = false;
let currentMode = 'focus';
let completedSessions = 0;
let focusSessionsBeforeLongBreak = 4;
let sessionCounter = 0;

// Stats variables
let stats = {
sessionsCompleted: 0,
dailyStreak: 0,
focusMinutes: 0,
todaysSessions: 0,
lastSessionDate: null
};

// Settings
let settings = {
focusDuration: 25,
shortBreakDuration: 5,
longBreakDuration: 15,
autoStartBreaks: true,
autoStartWork: false,
soundEnabled: true,
volume: 50
};

// Tasks array
let tasks = [];

// Motivational quotes
const motivationalQuotes = [
{ quote: "The secret of getting ahead is getting started.", author: "Mark Twain" },
{ quote: "It always seems impossible until it's done.", author: "Nelson Mandela" },
{ quote: "Don't wait. The time will never be just right.", author: "Napoleon Hill" },
{ quote: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
{ quote: "The best way to predict the future is to create it.", author: "Peter Drucker" },
{ quote: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
{ quote: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
{ quote: "Your time is limited, don't waste it living someone else's life.", author: "Steve Jobs" },
{ quote: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
{ quote: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Anonymous" }
];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
// Load settings and stats from localStorage
loadSettings();
loadStats();
loadTasks();
updateTimerDisplay();
updateProgressCircle(1);
updateStatsDisplay();
checkDarkMode();

// Set up circle stroke properties
const circle = progressCircle;
const radius = circle.getAttribute('r');
const circumference = 2 * Math.PI * radius;

circle.style.strokeDasharray =` ${circumference} ${circumference}`;
circle.style.strokeDashoffset = circumference;

// Event listeners
startBtn.addEventListener('click', startTimer);
pauseBtn.addEventListener('click', pauseTimer);
resetBtn.addEventListener('click', resetTimer);
saveSettingsBtn.addEventListener('click', saveSettings);
closeModalBtn.addEventListener('click', closeMotivationModal);
notificationClose.addEventListener('click', closeNotification);
darkModeToggle.addEventListener('click', toggleDarkMode);
soundBtn.addEventListener('click', toggleSound);
volumeSlider.addEventListener('input', adjustVolume);

modeBtns.forEach(btn => {
btn.addEventListener('click', () => {
  modeBtns.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentMode = btn.getAttribute('data-mode');
  resetTimer();
});
});

// Tasks event listeners
addTaskBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
if (e.key === 'Enter') {
  addTask();
}
});

// Check and update streak
checkAndUpdateStreak();
});

// Timer Functions
function startTimer() {
if (isRunning) return;

isRunning = true;
startBtn.disabled = true;
pauseBtn.disabled = false;

timerInterval = setInterval(() => {
timeLeft--;

// Update timer display
updateTimerDisplay();

// Update progress circle
const progress = 1 - (timeLeft / totalTime);
updateProgressCircle(progress);

// Check if timer is complete
if (timeLeft <= 0) {
  clearInterval(timerInterval);
  isRunning = false;
  timerComplete();
}
}, 1000);

// Update status text
if (currentMode === 'focus') {
timerStatus.textContent = 'Focusing...';
} else if (currentMode === 'short-break') {
timerStatus.textContent = 'Taking a short break...';
} else {
timerStatus.textContent = 'Taking a long break...';
}
}

function pauseTimer() {
if (!isRunning) return;

clearInterval(timerInterval);
isRunning = false;
startBtn.disabled = false;
pauseBtn.disabled = true;
timerStatus.textContent = 'Paused';
}

function resetTimer() {
clearInterval(timerInterval);
isRunning = false;

startBtn.disabled = false;
pauseBtn.disabled = true;

// Set time based on current mode
if (currentMode === 'focus') {
timeLeft = settings.focusDuration * 60;
timerStatus.textContent = 'Ready to focus';
} else if (currentMode === 'short-break') {
timeLeft = settings.shortBreakDuration * 60;
timerStatus.textContent = 'Ready for a short break';
} else {
timeLeft = settings.longBreakDuration * 60;
timerStatus.textContent = 'Ready for a long break';
}

totalTime = timeLeft;
updateTimerDisplay();
updateProgressCircle(0);
}

function timerComplete() {
// Play sound if enabled
if (settings.soundEnabled) {
timerEndSound.volume = settings.volume / 100;
timerEndSound.play();
}

if (currentMode === 'focus') {
// Update stats
stats.sessionsCompleted++;
stats.todaysSessions++;
stats.focusMinutes += settings.focusDuration;
stats.lastSessionDate = new Date().toDateString();
saveStats();

// Show motivation modal
showMotivationModal();

// Increase session counter
sessionCounter++;

// Determine next break type
if (sessionCounter % focusSessionsBeforeLongBreak === 0) {
  switchMode('long-break');
} else {
  switchMode('short-break');
}

// Auto start break if enabled
if (settings.autoStartBreaks) {
  setTimeout(() => {
    if (!isRunning) startTimer();
  }, 500);
}
} else {
// Break is complete, switch back to focus mode
switchMode('focus');

// Auto start work if enabled
if (settings.autoStartWork) {
  setTimeout(() => {
    if (!isRunning) startTimer();
  }, 500);
}
}

updateStatsDisplay();
}

function switchMode(mode) {
currentMode = mode;

// Update UI
modeBtns.forEach(btn => {
if (btn.getAttribute('data-mode') === mode) {
  btn.classList.add('active');
} else {
  btn.classList.remove('active');
}
});

resetTimer();
}

function updateTimerDisplay() {
const minutes = Math.floor(timeLeft / 60);
const seconds = timeLeft % 60;

timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

// Update document title with timer
document.title = `${timerDisplay.textContent} - Procrastination Timer`;
}

function updateProgressCircle(progress) {
const circle = progressCircle;
const radius = circle.getAttribute('r');
const circumference = 2 * Math.PI * radius;

const offset = circumference * (1 - progress);
circle.style.strokeDashoffset = offset;
}

// Settings Functions
function loadSettings() {
const savedSettings = localStorage.getItem('procrastinationTimerSettings');

if (savedSettings) {
settings = JSON.parse(savedSettings);

// Apply settings to UI
focusDurationInput.value = settings.focusDuration;
shortBreakDurationInput.value = settings.shortBreakDuration;
longBreakDurationInput.value = settings.longBreakDuration;
autoStartBreaksCheckbox.checked = settings.autoStartBreaks;
autoStartWorkCheckbox.checked = settings.autoStartWork;

// Set initial timer based on settings
timeLeft = settings.focusDuration * 60;
totalTime = timeLeft;
}
}

function saveSettings() {
// Get values from inputs
settings.focusDuration = parseInt(focusDurationInput.value) || 25;
settings.shortBreakDuration = parseInt(shortBreakDurationInput.value) || 5;
settings.longBreakDuration = parseInt(longBreakDurationInput.value) || 15;
settings.autoStartBreaks = autoStartBreaksCheckbox.checked;
settings.autoStartWork = autoStartWorkCheckbox.checked;

// Save to localStorage
localStorage.setItem('procrastinationTimerSettings', JSON.stringify(settings));

// Reset timer with new settings
resetTimer();

// Show notification
showNotification('Settings Saved', 'Your timer settings have been updated!');
}

// Stats Functions
function loadStats() {
const savedStats = localStorage.getItem('procrastinationTimerStats');

if (savedStats) {
stats = JSON.parse(savedStats);
}
}

function saveStats() {
localStorage.setItem('procrastinationTimerStats', JSON.stringify(stats));
}

function updateStatsDisplay() {
sessionsCompletedEl.textContent = stats.sessionsCompleted;
dailyStreakEl.textContent = stats.dailyStreak;
focusMinutesEl.textContent = stats.focusMinutes;
todaysSessionsEl.textContent = stats.todaysSessions;

// Update modal stats too
modalSessionsCompleted.textContent = stats.sessionsCompleted;
modalStreak.textContent = stats.dailyStreak;
}

function checkAndUpdateStreak() {
const today = new Date().toDateString();
const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const yesterdayString = yesterday.toDateString();

if (!stats.lastSessionDate) {
// First time user
stats.lastSessionDate = today;
stats.dailyStreak = 0;
stats.todaysSessions = 0;
} else if (stats.lastSessionDate === today) {
// Already logged today, do nothing
} else if (stats.lastSessionDate === yesterdayString) {
// Logged yesterday, increment streak
stats.dailyStreak++;
stats.todaysSessions = 0;
stats.lastSessionDate = today;
} else {
// Missed a day, reset streak
stats.dailyStreak = 0;
stats.todaysSessions = 0;
stats.lastSessionDate = today;
}

saveStats();
updateStatsDisplay();
}

// Motivation modal functions
function showMotivationModal() {
// Get a random quote
const randomQuote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];

// Create content HTML
let contentHTML = `
<div class="motivation-text">"${randomQuote.quote}"</div>
<div class="quote-author">- ${randomQuote.author}</div>
`;

// Set content and show modal
motivationContent.innerHTML = contentHTML;
motivationModal.classList.add('active');
}

function closeMotivationModal() {
motivationModal.classList.remove('active');
}

// Notification functions
function showNotification(title, message) {
notificationTitle.textContent = title;
notificationMessage.textContent = message;
notification.classList.add('active');

// Auto hide after 5 seconds
setTimeout(() => {
closeNotification();
}, 5000);
}

function closeNotification() {
notification.classList.remove('active');
}

// Dark mode toggle
function toggleDarkMode() {
document.body.classList.toggle('dark-mode');

// Update icon
const icon = darkModeToggle.querySelector('i');
if (document.body.classList.contains('dark-mode')) {
icon.className = 'fas fa-sun';
localStorage.setItem('darkMode', 'enabled');
} else {
icon.className = 'fas fa-moon';
localStorage.setItem('darkMode', 'disabled');
}
}

function checkDarkMode() {
if (localStorage.getItem('darkMode') === 'enabled') {
document.body.classList.add('dark-mode');
darkModeToggle.querySelector('i').className = 'fas fa-sun';
}
}

// Sound controls
function toggleSound() {
settings.soundEnabled = !settings.soundEnabled;
soundBtn.querySelector('i').className = settings.soundEnabled ? 'fas fa-volume-up' : 'fas fa-volume-mute';

if (settings.soundEnabled) {
soundBtn.classList.add('active');
} else {
soundBtn.classList.remove('active');
}

// Save settings
localStorage.setItem('procrastinationTimerSettings', JSON.stringify(settings));
}

function adjustVolume() {
settings.volume = volumeSlider.value;
localStorage.setItem('procrastinationTimerSettings', JSON.stringify(settings));
}

// Task management functions
function loadTasks() {
const savedTasks = localStorage.getItem('procrastinationTimerTasks');

if (savedTasks) {
tasks = JSON.parse(savedTasks);
renderTasks();
}
}

function saveTasks() {
localStorage.setItem('procrastinationTimerTasks', JSON.stringify(tasks));
}

function addTask() {
const taskText = taskInput.value.trim();

if (taskText) {
const newTask = {
  id: Date.now(),
  text: taskText,
  completed: false
};

tasks.push(newTask);
taskInput.value = '';
saveTasks();
renderTasks();

// Show notification
showNotification('Task Added', 'New focus task has been added!');
}
}

function toggleTaskStatus(taskId) {
tasks = tasks.map(task => {
if (task.id === parseInt(taskId)) {
  return { ...task, completed: !task.completed };
}
return task;
});

saveTasks();
renderTasks();
}

function deleteTask(taskId) {
tasks = tasks.filter(task => task.id !== parseInt(taskId));
saveTasks();
renderTasks();

// Show notification
showNotification('Task Removed', 'Task has been deleted!');
}

function renderTasks() {
if (tasks.length === 0) {
tasksList.innerHTML = '';
tasksEmptyState.style.display = 'block';
return;
}

tasksEmptyState.style.display = 'none';

tasksList.innerHTML = '';
tasks.forEach(task => {
const taskItem = document.createElement('li');
taskItem.className = `task-item ${task.completed ? 'completed' : ''}`;
taskItem.innerHTML = `
  <input type="checkbox" class="task-checkbox" data-id="${task.id}" ${task.completed ? 'checked' : ''}>
  <span class="task-text">${task.text}</span>
  <button class="task-delete" data-id="${task.id}">
    <i class="fas fa-trash-alt"></i>
  </button>
`;

tasksList.appendChild(taskItem);
});

// Add event listeners to newly created elements
document.querySelectorAll('.task-checkbox').forEach(checkbox => {
checkbox.addEventListener('change', (e) => {
  toggleTaskStatus(e.target.getAttribute('data-id'));
});
});

document.querySelectorAll('.task-delete').forEach(button => {
button.addEventListener('click', (e) => {
  deleteTask(e.target.closest('.task-delete').getAttribute('data-id'));
});
});
}