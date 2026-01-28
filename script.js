// PARODY quiz: answers don't matter. final result is random.
// Small, dependency-free client-side script.
// Updated: randomized question order per-start, randomized choices per-question, Back support.
// NOTE: comments are intentionally preserved and should not be removed unless absolutely necessary.

// ---------- QUESTIONS ----------
// Each entry: { q: "question text", choices: [ ... ] }
// We shuffle questions and shuffle choices per-run so order is unpredictable.
const QUESTIONS = [
  { q: "Pick a food before your set", choices: ["Chips", "Fruit", "Granola or Protein", "None/Other"] },
  { q: "Preferred warm-up", choices: ["Stretch", "Blink training", "Meditate", "Comboing a CPU"] },
  { q: "Your mantra", choices: ["Do whatever it takes to win", "Turn my brain off and schmove", "I love hanging spending quality time with my friend"] },
  { q: "Your pop-off of choice", choices: ["Fist pump", "Calm nod", "Chair throw"] },
  { q: "Best post-match drink", choices: ["Soda", "Water", "Energy drink"] },
  { q: "Favorite current top 3 player", choices: ["Zain", "Cody Schwab", "Hungrybox"] }
];

// ---------- RESULTS ----------
// You can add an image filename (place the files in assets/ by convention).
// Keep image filenames consistent with the assets/ directory (assets/heart.png etc).
const RESULTS = {
  Heart: {
    title: "Heart",
    desc: "You win with passion. You rely on looking into the soul of your opponent and hard reading their options.",
    image: "assets/heart.png"
  },
  Body: {
    title: "Body",
    desc: "You brute force your way to glory. You insist and focus on perfecting your punish game.",
    image: "assets/body.png"
  },
  Mind: {
    title: "Mind",
    desc: "You overthink things and it works. You map out the matchups, and have flowcharts for situations that others probably don't even consider.",
    image: "assets/mind.png"
  }
};

// ---------- UI COLORS ----------
// Keep these in sync with CSS variables in style.css if you change them.
const COLORS = {
  Heart: '#e02424', // red
  Body:  '#16a34a', // green
  Mind:  '#2563eb'  // blue
};

// ---------- DOM REFS ----------
// Cache DOM nodes used by the script so code is easier to read.
const app = document.getElementById('app');           // root app node - used to toggle subtitle visibility
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
const retakeBtn = document.getElementById('retake');
const copyBtn = document.getElementById('copy-link');

// ---------- State ----------
// index: pointer into activeQuestions
// activeQuestions: the shuffled questions used for this run (each contains shuffled choices)
// answers: store chosen choice *values* per question (use values so shuffling choices doesn't break recall)
let index = 0;
let activeQuestions = [];
let answers = [];

// ---------- Utilities ----------

// Utility: read a URL param value
function getParam(name){
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

// Fisher-Yates shuffle helper: returns a new shuffled copy
function shuffleArray(a){
  const arr = a.slice();
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Compact token encode/decode used to share a specific result via ?t=<token>
// encodeToken: JSON -> base64 (URL safe enough for our purposes)
// decodeToken: base64 -> JSON
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
// prepareRun: shuffle questions and shuffle choices per question, reset state
function prepareRun(){
  // shuffle the questions order so each run is different
  const shuffledQs = shuffleArray(QUESTIONS);

  // For each question create a shallow copy and shuffle its choice list
  activeQuestions = shuffledQs.map(orig => {
    return {
      q: orig.q,
      choices: shuffleArray(orig.choices.slice()) // shuffled copy
    };
  });

  // Reset runtime state
  index = 0;
  answers = new Array(activeQuestions.length).fill(null); // store choice *strings*
}

// ---------- Rendering ----------

// renderQuestion: display the question at index i (from activeQuestions)
// - renders choices as large touch-friendly buttons
// - highlights previously selected choice (by value)
function renderQuestion(i){
  const total = activeQuestions.length;
  const q = activeQuestions[i];

  // question title (Q1. ... style)
  questionTitle.textContent = `Q${i+1}. ${q.q}`;

  // clear old choices then append new
  choicesBox.innerHTML = '';
  q.choices.forEach((choiceValue, j) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'choice';
    b.setAttribute('role','listitem');
    b.textContent = choiceValue;

    // if user previously answered this question, mark selection
    if(answers[i] !== null && answers[i] === choiceValue){
      b.classList.add('selected');
    }

    // clicking stores the *value* and advances
    b.addEventListener('click', () => onChoose(i, choiceValue));
    choicesBox.appendChild(b);
  });

  // update progress bar (0..100)
  progressBar.style.width = `${Math.round((i / total) * 100)}%`;

  // back button visibility (only show when not at first question)
  if(backBtn){
    if(i > 0){
      backBtn.classList.remove('hidden');
      backBtn.setAttribute('aria-hidden', 'false');
    } else {
      backBtn.classList.add('hidden');
      backBtn.setAttribute('aria-hidden', 'true');
    }
  }

  // jump question into view on small screens for UX
  if(window.innerWidth < 700){
    questionTitle.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// ---------- Interaction handlers ----------

// Handle a choice: store answer (choiceValue) and move forward
function onChoose(qi, choiceValue){
  // store user's answer as the choice *value* (safe when we shuffle choices)
  answers[qi] = choiceValue;

  // advance pointer
  index++;
  if(index < activeQuestions.length){
    renderQuestion(index);
  } else {
    // run finished: we pick a random result (parody) and generate mock percentages
    const key = randomResultKey();
    const pct = randomPercentagesWithWinner(key);
    showResultWithPercent(key, pct);
  }
}

// Back button: go back one question (if available)
if(backBtn){
  backBtn.addEventListener('click', () => {
    if(index > 0){
      index--;
      renderQuestion(index);
    }
  });
}

// ---------- Result generation ----------

// Random result key (Heart / Body / Mind)
function randomResultKey(){
  const keys = Object.keys(RESULTS);
  return keys[Math.floor(Math.random() * keys.length)];
}

// Generate mock percentages that sum to 100 and ensure the 'winner' is highest.
// winner gets between 45 and 75, the remainder is split randomly.
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
// Bars are colored according to the COLORS mapping. Width animates from 0.
function renderPercentages(pctObj){
  percentagesWrap.innerHTML = '';
  const order = Object.keys(RESULTS); // keep consistent display order
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

    // apply per-key color (Heart/Body/Mind)
    const color = COLORS[key] || '#6c5ce7';
    bar.style.background = color;

    // start at 0 for animation, set final width after append
    bar.style.width = '0%';

    const value = document.createElement('div');
    value.className = 'percent-value';
    value.textContent = `${val}%`;

    barWrap.appendChild(bar);
    row.appendChild(label);
    row.appendChild(barWrap);
    row.appendChild(value);
    percentagesWrap.appendChild(row);

    // animate width shortly after insertion
    setTimeout(() => { bar.style.width = `${val}%`; }, 50);
  });

  percentagesWrap.setAttribute('aria-hidden', 'false');
}

// Show result with percentages and update URL with compact token (?t=...)
function showResultWithPercent(key, pctObj){
  // remove quiz-active so subtitle is visible on the result page
  if(app) app.classList.remove('quiz-active');

  // hide quiz
  quizSection.classList.add('hidden');
  quizSection.setAttribute('aria-hidden', 'true');

  // populate result text
  const r = RESULTS[key];
  resultLabel.textContent = r.title;
  resultDesc.textContent = r.desc;

  // color the label to match the result
  const mainColor = COLORS[key] || '#6c5ce7';
  resultLabel.style.color = mainColor;

  // result image: show if provided (images should be in assets/)
  if(r.image){
    resultImg.src = r.image;
    resultImg.alt = `${r.title} image`;
    resultImg.classList.remove('hidden');
  } else {
    resultImg.classList.add('hidden');
  }

  // percentages UI
  renderPercentages(pctObj);

  // reveal result section
  resultSection.classList.remove('hidden');
  resultSection.setAttribute('aria-hidden', 'false');

  // set progress bar to full
  progressBar.style.width = '100%';

  // encode share token and update URL to allow direct opens
  const token = encodeToken({ r: key, p: pctObj });
  if(token){
    const url = new URL(window.location.href);
    url.searchParams.set('t', token);
    url.searchParams.delete('result'); // remove legacy param if present
    window.history.replaceState({}, '', url.toString());
  }
}

// ---------- Buttons: retake & copy ----------

// Reset for a fresh randomized run (prepares new shuffled questions)
retakeBtn.addEventListener('click', () => {
  // ensure subtitle hides while retaking
  if(app) app.classList.add('quiz-active');

  prepareRun();
  index = 0;
  quizSection.classList.remove('hidden');
  quizSection.setAttribute('aria-hidden', 'false');
  resultSection.classList.add('hidden');
  resultSection.setAttribute('aria-hidden', 'true');
  resultImg.classList.add('hidden');
  percentagesWrap.innerHTML = '';
  resultLabel.style.color = ''; // reset color style
  renderQuestion(0);
  progressBar.style.width = '0%';
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Copy share link to clipboard (fallback alert if not available)
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
// if ?t=<token> present, decode and render exact result (used for share links)
function checkUrlToken(){
  const token = getParam('t');
  if(token){
    const data = decodeToken(token);
    if(data && data.r && data.p){
      // ensure subtitle is visible for direct result links
      if(app) app.classList.remove('quiz-active');

      // hide landing + quiz and show decoded result
      if(landing){
        landing.classList.add('hidden');
        landing.setAttribute('aria-hidden', 'true');
      }
      quizSection.classList.add('hidden');
      quizSection.setAttribute('aria-hidden', 'true');

      // set image if present
      const r = RESULTS[data.r];
      if(r && r.image){
        resultImg.src = r.image;
        resultImg.alt = `${r.title} image`;
        resultImg.classList.remove('hidden');
      } else {
        resultImg.classList.add('hidden');
      }

      // label + desc (fall back to token values if not in RESULTS)
      const rr = RESULTS[data.r] || { title: data.r, desc: '' };
      resultLabel.textContent = rr.title || data.r;
      resultDesc.textContent = rr.desc || '';

      // color label
      resultLabel.style.color = COLORS[data.r] || '';

      // percentages from token
      renderPercentages(data.p);

      resultSection.classList.remove('hidden');
      resultSection.setAttribute('aria-hidden', 'false');
      progressBar.style.width = '100%';
      return true;
    }
  }

  // backward compatibility: old ?result=Key param
  const old = getParam('result');
  if(old && RESULTS[old]){
    const pct = randomPercentagesWithWinner(old);
    showResultWithPercent(old, pct);
    return true;
  }
  return false;
}

// ---------- Initial boot ----------
// Start button will prepare a randomized run. Also support pressing Enter to start.
if(startBtn){
  startBtn.addEventListener('click', () => {
    prepareRun();

    // mark the app as quiz-active so subtitle hides on question pages
    if(app) app.classList.add('quiz-active');

    if(landing){
      landing.classList.add('hidden');
      landing.setAttribute('aria-hidden', 'true');
    }
    quizSection.classList.remove('hidden');
    quizSection.setAttribute('aria-hidden', 'false');

    // small delay to allow CSS animations; then render first question
    setTimeout(()=> renderQuestion(0), 80);

    // reset progress
    progressBar.style.width = '0%';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// keyboard accessibility: Enter starts quiz from landing
document.addEventListener('keydown', (e) => {
  if(e.key === 'Enter' && landing && !landing.classList.contains('hidden')){
    startBtn.click();
  }
});

// On DOM ready: check token, otherwise show landing and wait for user to start
document.addEventListener('DOMContentLoaded', () => {
  if(!checkUrlToken()){
    if(landing){
      landing.classList.remove('hidden');
      landing.setAttribute('aria-hidden', 'false');
      quizSection.classList.add('hidden');
      quizSection.setAttribute('aria-hidden', 'true');
    } else {
      // If no landing, auto-start a run
      prepareRun();
      renderQuestion(0);
      quizSection.classList.remove('hidden');
      quizSection.setAttribute('aria-hidden', 'false');
    }
  }
});