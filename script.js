// PARODY quiz: answers don't matter. final result is random.
// Small, dependency-free client-side script.
// Updated: randomized question order per-start, randomized choices per-question, Back support.
// NOTE: comments are intentionally preserved and should not be removed unless absolutely necessary.

// ---------- QUESTIONS ----------
// Each entry: { q: "question text", choices: [ ... ] }
// You may optionally add an `image` property to any question:
//   { q: "Example", choices: [...], image: "assets/q1-1800x640.png" }
// If no `image` property is present, no space will be shown.
const QUESTIONS = [
  { q: "Pick a food before your set", choices: ["Chips", "Fruit", "Granola or Protein", "None/Other"] },
  { q: "Preferred warm-up", choices: ["Stretch", "Blink training", "Meditate", "Comboing a CPU"] },
  { q: "Your mantra", choices: ["Do whatever it takes to win", "Turn my brain off and schmove", "I love spending quality time with my friend"] },
  { q: "Your pop-off of choice", choices: ["Fist pump", "Calm nod", "Yell"] },
  { q: "Best mid-set drink", choices: ["Nothing", "Water", "Energy drink", "Other"] },
  { q: "Favorite current top 3 Melee player", choices: ["Zain", "Cody Schwab", "Hungrybox"] },
  { q: "You play Rock, Paper, Scissors for ports and tie the first two rounds throwing Rock. Which do you throw next?", choices: ["Rock, again.", "Paper, of course.", "Scissors, mindgames."] },
  { q: "Does your gamer tag have an Acronym, Initialism, or your Name in it?", choices: ["Yes", "No"] }
];

// ---------- RESULTS ----------
const RESULTS = {
  Heart: {
    title: "Heart",
    desc: "You win with passion. You typically rely on looking into the soul of your opponent and hard reading their options.",
    image: "assets/heart.png",
    notables: ["N0ne", "Mang0", "Hungrybox", "Vintage"]
  },
  Body: {
    title: "Body",
    desc: "You brute force your way to glory. You insist and focus on perfecting your techskill and punish game.",
    image: "assets/body.png",
    notables: ["Zain", "Cody Schwab", "Jmook", "Wizzrobe"]
  },
  Mind: {
    title: "Mind",
    desc: "You overthink things and it works. You map out the matchups, and have flowcharts for situations that others probably don't even consider.",
    image: "assets/mind.png",
    notables: ["Junebug", "Ginger", "Bob-omb"]
  }
};

// ---------- UI COLORS ----------
const COLORS = {
  Heart: '#e02424',
  Body:  '#16a34a',
  Mind:  '#2563eb'
};

// ---------- DOM REFS ----------
const app = document.getElementById('app');
const landing = document.getElementById('landing');
const startBtn = document.getElementById('start-btn');
const backBtn = document.getElementById('back-btn');
const questionTitle = document.getElementById('question-title');
const choicesBox = document.getElementById('choices');
const progressBar = document.getElementById('progress-bar');
const quizSection = document.getElementById('quiz');
const resultSection = document.getElementById('result');
const resultLabel = document.getElementById('result-label');
const resultDesc = document.getElementById('result-desc');
const resultImg = document.getElementById('result-img');
const percentagesWrap = document.getElementById('percentages');
const notablesWrap = document.getElementById('notables'); // NEW: area for notable players
const questionImageWrap = document.getElementById('question-image-wrap'); // NEW
const questionImg = document.getElementById('question-img'); // NEW
const retakeBtn = document.getElementById('retake');
const copyBtn = document.getElementById('copy-link');

// ---------- State ----------
let index = 0;
let activeQuestions = [];
let answers = [];

// ---------- Utilities ----------
function getParam(name){
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}
function shuffleArray(a){
  const arr = a.slice();
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function encodeToken(obj){
  try {
    const str = JSON.stringify(obj);
    return btoa(unescape(encodeURIComponent(str)));
  } catch(e){
    return null;
  }
}
function decodeToken(token){
  try {
    const json = decodeURIComponent(escape(atob(token)));
    return JSON.parse(json);
  } catch(e){
    return null;
  }
}

// ---------- Run preparation ----------
function prepareRun(){
  const shuffledQs = shuffleArray(QUESTIONS);
  activeQuestions = shuffledQs.map(orig => ({
    q: orig.q,
    choices: shuffleArray(orig.choices.slice()),
    image: orig.image // optional; may be undefined
  }));
  index = 0;
  answers = new Array(activeQuestions.length).fill(null);
}

// ---------- Rendering ----------
function renderQuestion(i){
  const total = activeQuestions.length;
  const q = activeQuestions[i];

  // QUESTION IMAGE: show only if q.image exists (no empty space otherwise)
  if(questionImg && questionImageWrap){
    if(q.image){
      questionImg.src = q.image;
      questionImg.alt = `Image for question ${i+1}`;
      questionImg.classList.remove('hidden');
      questionImageWrap.classList.remove('hidden');
      questionImageWrap.setAttribute('aria-hidden', 'false');
    } else {
      questionImg.src = '';
      questionImg.alt = '';
      questionImg.classList.add('hidden');
      questionImageWrap.classList.add('hidden');
      questionImageWrap.setAttribute('aria-hidden', 'true');
    }
  }

  questionTitle.textContent = `Q${i+1}. ${q.q}`;
  choicesBox.innerHTML = '';

  q.choices.forEach((choiceValue, j) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'choice';
    b.setAttribute('role','listitem');
    b.textContent = choiceValue;
    if(answers[i] !== null && answers[i] === choiceValue) b.classList.add('selected');
    b.addEventListener('click', () => onChoose(i, choiceValue));
    choicesBox.appendChild(b);
  });

  progressBar.style.width = `${Math.round((i/total)*100)}%`;
  if(backBtn){
    if(i > 0){
      backBtn.classList.remove('hidden');
      backBtn.setAttribute('aria-hidden','false');
    } else {
      backBtn.classList.add('hidden');
      backBtn.setAttribute('aria-hidden','true');
    }
  }
  if(window.innerWidth < 700){
    questionTitle.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// ---------- Interaction handlers ----------
function onChoose(qi, choiceValue){
  answers[qi] = choiceValue;
  index++;
  if(index < activeQuestions.length){
    renderQuestion(index);
  } else {
    const key = randomResultKey();
    const pct = randomPercentagesWithWinner(key);
    showResultWithPercent(key, pct);
  }
}
if(backBtn){
  backBtn.addEventListener('click', () => {
    if(index > 0){
      index--;
      renderQuestion(index);
    }
  });
}

// ---------- Result generation ----------
function randomResultKey(){
  const keys = Object.keys(RESULTS);
  return keys[Math.floor(Math.random() * keys.length)];
}
function randomPercentagesWithWinner(winnerKey){
  const winner = getRandomInt(45, 75);
  let remainder = 100 - winner;
  const other1 = getRandomInt(0, remainder);
  const other2 = remainder - other1;
  const keys = Object.keys(RESULTS).filter(k => k !== winnerKey);
  const out = {};
  out[winnerKey] = winner;
  out[keys[0]] = other1;
  out[keys[1]] = other2;
  return out;
}
function getRandomInt(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min; }

// Render percentages UI from object like {Heart:60, Body:25, Mind:15}
function renderPercentages(pctObj){
  percentagesWrap.innerHTML = '';
  const order = Object.keys(RESULTS);
  order.forEach(key => {
    const val = pctObj[key] ?? 0;
    const row = document.createElement('div');
    row.className = 'percent-row';
    const label = document.createElement('div');
    label.className = 'percent-label';
    label.textContent = key;
    const barWrap = document.createElement('div');
    barWrap.className = 'percent-bar-wrap';
    const bar = document.createElement('div');
    bar.className = 'percent-bar';
    const color = COLORS[key] || '#6c5ce7';
    bar.style.background = color;
    bar.style.width = '0%';
    const value = document.createElement('div');
    value.className = 'percent-value';
    value.textContent = `${val}%`;
    barWrap.appendChild(bar);
    row.appendChild(label);
    row.appendChild(barWrap);
    row.appendChild(value);
    percentagesWrap.appendChild(row);
    setTimeout(() => { bar.style.width = `${val}%`; }, 50);
  });
  percentagesWrap.setAttribute('aria-hidden','false');
}

// ---------- Notables rendering (NEW) ----------
function renderNotables(typeKey, list){
  if(!notablesWrap) return;
  if(!Array.isArray(list) || list.length === 0){
    notablesWrap.innerHTML = '';
    notablesWrap.classList.add('hidden');
    notablesWrap.setAttribute('aria-hidden','true');
    return;
  }
  const names = list.join(', ');
  notablesWrap.innerHTML = `
    <div class="notables-heading">Other notable players with your Type:</div>
    <div class="notables-list">${names}</div>
  `;
  notablesWrap.classList.remove('hidden');
  notablesWrap.setAttribute('aria-hidden','false');
}

// Show result and set encoded share token in URL
function showResultWithPercent(key, pctObj){
  if(app) app.classList.remove('quiz-active');
  quizSection.classList.add('hidden');
  quizSection.setAttribute('aria-hidden','true');
  const r = RESULTS[key];
  resultLabel.textContent = r.title;
  resultDesc.textContent = r.desc;
  const mainColor = COLORS[key] || '#6c5ce7';
  resultLabel.style.color = mainColor;
  if(r && r.image){
    resultImg.src = r.image;
    resultImg.alt = `${r.title} image`;
    resultImg.classList.remove('hidden');
  } else {
    resultImg.classList.add('hidden');
  }
  renderPercentages(pctObj);
  renderNotables(key, (r && r.notables) ? r.notables : []);
  resultSection.classList.remove('hidden');
  resultSection.setAttribute('aria-hidden','false');
  progressBar.style.width = '100%';
  const token = encodeToken({ r: key, p: pctObj });
  if(token){
    const url = new URL(window.location.href);
    url.searchParams.set('t', token);
    url.searchParams.delete('result');
    window.history.replaceState({}, '', url.toString());
  }
}

// ---------- Buttons: retake & copy ----------
retakeBtn.addEventListener('click', () => {
  if(app) app.classList.add('quiz-active');
  prepareRun();
  index = 0;
  quizSection.classList.remove('hidden');
  quizSection.setAttribute('aria-hidden','false');
  resultSection.classList.add('hidden');
  resultSection.setAttribute('aria-hidden','true');
  resultImg.classList.add('hidden');
  percentagesWrap.innerHTML = '';
  if(notablesWrap){
    notablesWrap.innerHTML = '';
    notablesWrap.classList.add('hidden');
    notablesWrap.setAttribute('aria-hidden','true');
  }
  resultLabel.style.color = '';
  renderQuestion(0);
  progressBar.style.width = '0%';
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    copyBtn.textContent = 'Link copied!';
    setTimeout(()=> copyBtn.textContent = 'Copy share link', 1400);
  } catch(e) {
    alert('Copy failed — manually copy the URL bar.');
  }
});

// ---------- URL token handling for shared results ----------
function checkUrlToken(){
  const token = getParam('t');
  if(token){
    const data = decodeToken(token);
    if(data && data.r && data.p){
      if(app) app.classList.remove('quiz-active');
      if(landing){
        landing.classList.add('hidden');
        landing.setAttribute('aria-hidden','true');
      }
      quizSection.classList.add('hidden');
      quizSection.setAttribute('aria-hidden','true');
      const r = RESULTS[data.r];
      if(r && r.image){
        resultImg.src = r.image;
        resultImg.alt = `${r.title} image`;
        resultImg.classList.remove('hidden');
      } else {
        resultImg.classList.add('hidden');
      }
      const rr = RESULTS[data.r] || { title: data.r, desc: '' };
      resultLabel.textContent = rr.title || data.r;
      resultDesc.textContent = rr.desc || '';
      resultLabel.style.color = COLORS[data.r] || '';
      renderPercentages(data.p);
      renderNotables(data.r, (rr && rr.notables) ? rr.notables : []);
      resultSection.classList.remove('hidden');
      resultSection.setAttribute('aria-hidden','false');
      progressBar.style.width = '100%';
      return true;
    }
  }
  const old = getParam('result');
  if(old && RESULTS[old]){
    const pct = randomPercentagesWithWinner(old);
    showResultWithPercent(old, pct);
    return true;
  }
  return false;
}

// ---------- Initial boot ----------
if(startBtn){
  startBtn.addEventListener('click', () => {
    prepareRun();
    if(app) app.classList.add('quiz-active');
    if(landing){
      landing.classList.add('hidden');
      landing.setAttribute('aria-hidden','true');
    }
    quizSection.classList.remove('hidden');
    quizSection.setAttribute('aria-hidden','false');
    setTimeout(()=> renderQuestion(0), 80);
    progressBar.style.width = '0%';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

document.addEventListener('keydown', (e) => {
  if(e.key === 'Enter' && landing && !landing.classList.contains('hidden')){
    startBtn.click();
  }
});

document.addEventListener('DOMContentLoaded', () => {
  if(!checkUrlToken()){
    if(landing){
      landing.classList.remove('hidden');
      landing.setAttribute('aria-hidden','false');
      quizSection.classList.add('hidden');
      quizSection.setAttribute('aria-hidden','true');
    } else {
      prepareRun();
      renderQuestion(0);
      quizSection.classList.remove('hidden');
      quizSection.setAttribute('aria-hidden','false');
    }
  }
});