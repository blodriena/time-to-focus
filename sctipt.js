const THEMES = [
  { bg: '#ba4949', name: 'Red'       },
  { bg: '#397097', name: 'Blue'      },
  { bg: '#38858a', name: 'Teal'      },
  { bg: '#4c7a61', name: 'Green'     },
  { bg: '#5e4a8a', name: 'Purple'    },
  { bg: '#8a4a6b', name: 'Pink'      },
  { bg: '#b07d46', name: 'Orange'    },
  { bg: '#555555', name: 'Dark Grey' },
];
 
const MODES = {
  pomo:  { msg: 'Time to focus!',    color: '#ba4949' }, 
  short: { msg: 'Time for a break!', color: '#397097' }, 
  long:  { msg: 'Time for a break!', color: '#397a5e' }, 
};
let state = {
  mode:      'pomo',
  remaining: 25 * 60, 
  running:   false,
  interval:  null,
  round:     1,
  pomoCount: 0,         
  themeIdx:  0,       
  pomoDurations: { pomo: 25, short: 5, long: 15 }, 
};
 
let tasks = [
  { id: 1, name: 'Design new landing page', est: 4, done: false, pomos: 0, selected: true  },
  { id: 2, name: 'Write unit tests',        est: 2, done: false, pomos: 0, selected: false },
  { id: 3, name: 'Team standup notes',      est: 1, done: true,  pomos: 1, selected: false },
];




const timerEl    = document.getElementById('timerDisplay');
const btnStart   = document.getElementById('btnStart');
const btnSkip    = document.getElementById('btnSkip');
const roundLabel = document.getElementById('roundLabel');
const msgLabel   = document.getElementById('msgLabel');
const taskListEl = document.getElementById('taskList');
const colorRow   = document.getElementById('colorRow');
 
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
 
function playClick(isStart) {
 
  if (audioCtx.state === 'suspended') audioCtx.resume();
 
  [0, 0.07].forEach(offset => {
 
    const buffer = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.04, audioCtx.sampleRate);
    const data   = buffer.getChannelData(0);
 
    for (let i = 0; i < data.length; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 8);
    }
     const source = audioCtx.createBufferSource();
    const filter = audioCtx.createBiquadFilter();
    const gain   = audioCtx.createGain();
 
    source.buffer          = buffer;
    filter.type            = 'bandpass';
    filter.frequency.value = isStart ? 2200 : 1400; 
    filter.Q.value         = 1.2;
    gain.gain.value        = isStart ? 0.55 : 0.45;
 
    source.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    source.start(audioCtx.currentTime + offset);
  });
}

function fmt(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return m + ':' + s;
}
 
function setMode(m) {
  if (state.running) stopTimer();
  state.mode      = m;
  state.remaining = state.pomoDurations[m] * 60;
  updateTimerDisplay();
  updateTabs();
  updateSubtitle();
  applyBackground();
}
 
function startTimer() {
  playClick(true);
  state.running = true;
  btnStart.textContent = 'PAUSE';
  btnSkip.classList.add('show');
 
  document.body.style.background = '#1a1a1a';
  document.documentElement.style.setProperty('--bg',      '#1a1a1a');
  document.documentElement.style.setProperty('--btn-col', '#1a1a1a');
 
  state.interval = setInterval(() => {
    state.remaining--;
    updateTimerDisplay();
    if (state.remaining <= 0) timerDone();
  }, 1000);
}
 function stopTimer() {
  playClick(false);
  clearInterval(state.interval);
  state.running = false;
  btnStart.textContent = 'START';
  btnSkip.classList.remove('show');
  applyBackground(); 
}
 function timerDone() {
  clearInterval(state.interval);
  state.running = false;
  btnStart.textContent = 'START';
  btnSkip.classList.remove('show');
 
  if (state.mode === 'pomo') {
    state.pomoCount++;
    state.round++;
 
    const activeTask = tasks.find(t => t.selected && !t.done);
    if (activeTask) {
      activeTask.pomos++;
      renderTasks();
    }
 
    setMode(state.round % 4 === 0 ? 'long' : 'short');
 
  } else {
    setMode('pomo');
  }
}
 function updateTimerDisplay() {
  timerEl.textContent = fmt(state.remaining);
  document.title      = fmt(state.remaining) + ' — Pomofocus';
}
 
function updateTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === state.mode);
  });
}
 function updateSubtitle() {
  roundLabel.textContent = '#' + state.round;
  msgLabel.textContent   = MODES[state.mode].msg;
}

function applyBackground() {
  if (state.running) return;
 
  const color = MODES[state.mode].color;
 
  document.body.style.background = color;
  document.documentElement.style.setProperty('--bg',      color);
  document.documentElement.style.setProperty('--btn-col', color);
 
  document.querySelectorAll('.task-item.selected').forEach(el => {
    el.style.borderLeftColor = color;
  });
}
function renderTasks() {
  taskListEl.innerHTML = '';
 
  tasks.forEach(task => {
 
    const row = document.createElement('div');
    row.className = 'task-item'
      + (task.done     ? ' done'     : '')
      + (task.selected ? ' selected' : '');
 
    if (task.selected) {
      row.style.borderLeftColor = MODES[state.mode].color;
    }
     const circle = document.createElement('div');
    circle.className = 'task-circle';
    circle.addEventListener('click', e => {
      e.stopPropagation();   
      task.done = !task.done;
      renderTasks();
    });
     const name = document.createElement('div');
    name.className   = 'task-name';
    name.textContent = task.name;
     const count = document.createElement('div');
    count.className = 'task-count';
    count.innerHTML = `<b>${task.pomos}</b>/${task.est}`;
 
    row.addEventListener('click', () => {
      tasks.forEach(t => t.selected = false);
      task.selected = true;
      renderTasks();
    });
 
    row.append(circle, name, count);
    taskListEl.appendChild(row);
  });
}
 
function buildColorChips() {
  colorRow.innerHTML = '';
 
  THEMES.forEach((theme, index) => {
    const chip = document.createElement('div');
    chip.className        = 'color-chip' + (index === state.themeIdx ? ' selected' : '');
    chip.style.background = theme.bg;
    chip.title            = theme.name;
 
    chip.addEventListener('click', () => {
      state.themeIdx = index;
      buildColorChips(); 
    });
 
    colorRow.appendChild(chip);
  });
}

 
function buildReport() {
   document.getElementById('rPomos').textContent = state.pomoCount;
  document.getElementById('rTasks').textContent = tasks.filter(t => t.done).length;
 
  const totalMins = state.pomoCount * state.pomoDurations.pomo;
  document.getElementById('rFocus').textContent =
    Math.floor(totalMins / 60) + 'h ' + (totalMins % 60) + 'm';
   const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const values = [0, 0, 0, 0, 0, 0, 0];
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;
  values[todayIndex] = state.pomoCount;
 
  const maxVal = Math.max(...values, 1); 
  const barsEl = document.getElementById('reportBars');
  barsEl.innerHTML = '';
 
  days.forEach((day, i) => {
    const barRow = document.createElement('div');
    barRow.className = 'report-bar-row';
    barRow.innerHTML = `
      <div class="report-bar-label">${day}</div>
      <div class="report-bar-track">
        <div class="report-bar-fill" style="width: ${(values[i] / maxVal) * 100}%"></div>
      </div>
      <div class="report-bar-val">${values[i]}</div>`;
    barsEl.appendChild(barRow);
  });
}
 
function openModal(id)  { document.getElementById(id).classList.add('open');    }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
 
document.querySelectorAll('.overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});
 
document.querySelectorAll('[data-close]').forEach(btn => {
  btn.addEventListener('click', () => closeModal(btn.dataset.close));
});
 
document.querySelectorAll('.report-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.report-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
  });
});
 
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => setMode(btn.dataset.mode));
});
 btnStart.addEventListener('click', () => {
  state.running ? stopTimer() : startTimer();
});
 
btnSkip.addEventListener('click', () => {
  stopTimer();
  if (state.mode === 'pomo') {
    state.round++;
    setMode(state.round % 4 === 0 ? 'long' : 'short');
  } else {
    setMode('pomo');
  }
});
 
document.getElementById('btnReport') .addEventListener('click', () => { buildReport();      openModal('reportOverlay');  });
document.getElementById('btnSetting').addEventListener('click', () => { buildColorChips();  openModal('settingOverlay'); });
document.getElementById('btnSignIn') .addEventListener('click', () => {                     openModal('signOverlay');    });
 
document.getElementById('btnSettingOk').addEventListener('click', () => {
  state.pomoDurations.pomo  = parseInt(document.getElementById('setPomo').value)  || 25;
  state.pomoDurations.short = parseInt(document.getElementById('setShort').value) || 5;
  state.pomoDurations.long  = parseInt(document.getElementById('setLong').value)  || 15;
 
  applyBackground();
   if (!state.running) {
    state.remaining = state.pomoDurations[state.mode] * 60;
    updateTimerDisplay();
  }
 
  closeModal('settingOverlay');
});
 
const dotsBtn  = document.getElementById('btnDots');
const dotsMenu = document.getElementById('dotsMenu');
dotsBtn.addEventListener('click', e => {
  e.stopPropagation();
  dotsMenu.classList.toggle('open');
});
document.addEventListener('click', ()   => dotsMenu.classList.remove('open'));
dotsMenu.addEventListener('click', e    => e.stopPropagation());
 
const tasksMenuBtn  = document.getElementById('tasksMenuBtn');
const tasksDropdown = document.getElementById('tasksDropdown');
tasksMenuBtn.addEventListener('click', e => {
  e.stopPropagation();
  tasksDropdown.classList.toggle('open');
});
document.addEventListener('click', ()  => tasksDropdown.classList.remove('open'));
tasksDropdown.addEventListener('click', e => e.stopPropagation());
 
document.getElementById('btnAddTask').addEventListener('click', () => {});
 
 
updateTimerDisplay();
updateTabs();
updateSubtitle();
applyBackground();
renderTasks();
buildColorChips();



