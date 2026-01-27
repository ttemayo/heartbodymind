// PARODY quiz: answers don't matter. final result is random.
// Small, dependency-free client-side script.
// Updated: randomized question order per-start, randomized choices per-question, Back support.

const QUESTIONS = [
  { q: "Pick a food before ", choices: ["Chips", "Pickles", "Protein bar", "Nothing"] },
  { q: "Preferred warm-up", choices: ["Stretch", "Blink training", "Meditate", "Comboing a CPU"] },
  { q: "Your grinder mantra", choices: ["One more", "Relax and win", "Just mash"] },
  { q: "Your pop off of choice", choices: ["Fist pump", "Calm nod", "Chair throw"] },
  { q: "Best post-match drink", choices: ["Soda", "Water", "Energy drink"] }
];

// You can add an image filename (place the files in the repo root)
const RESULTS = {
  Heart: { title: "Heart"
    , desc: "You win with passion. You rely on looking into the soul of your opponent and hard reading their options.", image: "heart.png" },
  Body:  { title: "Body"
    , desc: "You brute force your way to glory. You insist and focus on perfecting your punish game.", image: "body.png" },
  Mind:  { title: "Mind"
    , desc: "You overthink things and it works. You map out the matchups, and have flowcharts for situations that others probably don't even consider.", image: "mind.png" }
};

// color mapping — keep these in sync with CSS :root variables
const COLORS = {
  Heart: '#e02424',
  Body:  '#16a34a',
  Mind:  '#2563eb'
};

// DOM refs
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

let index = 0;                 // pointer into activeQuestions
let activeQuestions = [];      // shuffled questions used for this run; each has its own shuffled choices
let answers = [];              // store chosen choice *values* per question (strings)


// utility: get URL param
function getParam(name){
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

// Shuffle helper (Fisher-Yates)
function shuffleArray(a){
  const arr = a.slice();
  for(let i = arr.length -1; i>0; i--){
    const j = Math.floor(Math.random()*(i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// encode/decode compact token (JSON -> base64)
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

// Prepare a new run: shuffle questions, and for each question shuffle its choices
function prepareRun(){
  // shuffle the questions order
  const shuffledQs = shuffleArray(QUESTIONS);
  // for each question make a copy with shuffled choices
  activeQuestions = shuffledQs.map(orig => {
    return {
      q: orig.q,
      choices: shuffleArray(orig.choices.slice()) // shuffled copy
    };
  });
  index = 0;
  answers = new Array(activeQuestions.length).fill(null); // store choice *strings*
}

// Render a question by index (from activeQuestions)
function renderQuestion(i){
  const total = activeQuestions.length;
  const q = activeQuestions[i];
  questionTitle.textContent = `Q${i+1}. ${q.q}`;
  choicesBox.innerHTML = '';

  q.choices.forEach((choiceValue, j) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'choice';
    b.setAttribute('role','listitem');
    b.textContent = choiceValue;

    // highlight if previously selected (compare by value)
    if(answers[i] !== null && answers[i] === choiceValue) {
      b.classList.add('selected');
    }

    b.addEventListener('click', () => onChoose(i, choiceValue));
    choicesBox.appendChild(b);
  });

  // progress
  progressBar.style.width = `${Math.round((i/total)*100)}%`;

  // back button visibility
  if(backBtn){
    if(i > 0){
      backBtn.classList.remove('hidden');
      backBtn.setAttribute('aria-hidden','false');
    } else {
      backBtn.classList.add('hidden');
      backBtn.setAttribute('aria-hidden','true');
    }
  }

  // scroll into view for mobile
  if(window.innerWidth < 700){
    questionTitle.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

// Handle a choice: store answer (choice *value*), then move forward
function onChoose(qi, choiceValue){
  answers[qi] = choiceValue; // store the answer value so shuffling doesn't break highlighting
  // advance
  index++;
  if(index < activeQuestions.length){
    renderQuestion(index);
  } else {
    // finished => pick random result + mock percentages
    const key = randomResultKey();
    const pct = randomPercentagesWithWinner(key);
    showResultWithPercent(key, pct);
  }
}

// Back button handler: go back one question
if(backBtn){
  backBtn.addEventListener('click', () => {
    if(index > 0){
      index--;
      renderQuestion(index);
    }
  });
}

// Pick random result key
function randomResultKey(){
  const keys = Object.keys(RESULTS);
  return keys[Math.floor(Math.random()*keys.length)];
}

// Generate percentages so "winner" is highest; integers sum to 100
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
function getRandomInt(min, max){ return Math.floor(Math.random()*(max-min+1)) + min; }

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

    // color the bar according to the key
    const color = COLORS[key] || '#6c5ce7';
    bar.style.background = color;
    bar.style.width = '0%'; // animate from 0
    const value = document.createElement('div');
    value.className = 'percent-value';
    value.textContent = `${val}%`;

    barWrap.appendChild(bar);
    row.appendChild(label);
    row.appendChild(barWrap);
    row.appendChild(value);
    percentagesWrap.appendChild(row);

    // animate width shortly after adding to DOM
    setTimeout(() => { bar.style.width = `${val}%`; }, 50);
  });
  percentagesWrap.setAttribute('aria-hidden','false');
}

// Show result and set encoded share token in URL
function showResultWithPercent(key, pctObj){
  quizSection.classList.add('hidden');
  quizSection.setAttribute('aria-hidden','true');
  const r = RESULTS[key];
  resultLabel.textContent = r.title;
  resultDesc.textContent = r.desc;

  // set label color to match this result
  const mainColor = COLORS[key] || '#6c5ce7';
  resultLabel.style.color = mainColor;

  // result image if available
  if(r.image){
    resultImg.src = r.image;
    resultImg.alt = `${r.title} image`;
    resultImg.classList.remove('hidden');
  } else {
    resultImg.classList.add('hidden');
  }

  // render percentages
  renderPercentages(pctObj);

  resultSection.classList.remove('hidden');
  resultSection.setAttribute('aria-hidden','false');

  // update progress to full
  progressBar.style.width = '100%';

  // encode token and set short param `t`
  const token = encodeToken({ r: key, p: pctObj });
  if(token){
    const url = new URL(window.location.href);
    url.searchParams.set('t', token);
    url.searchParams.delete('result');
    window.history.replaceState({}, '', url.toString());
  }
}

// Reset and retake (prepare a fresh randomized run)
retakeBtn.addEventListener('click', () => {
  prepareRun();
  index = 0;
  quizSection.classList.remove('hidden');
  quizSection.setAttribute('aria-hidden','false');
  resultSection.classList.add('hidden');
  resultSection.setAttribute('aria-hidden','true');
  resultImg.classList.add('hidden');
  percentagesWrap.innerHTML = '';
  resultLabel.style.color = ''; // reset color
  renderQuestion(0);
  progressBar.style.width = '0%';
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Copy share link
copyBtn.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(window.location.href);
    copyBtn.textContent = 'Link copied!';
    setTimeout(()=> copyBtn.textContent = 'Copy share link', 1400);
  } catch(e) {
    alert('Copy failed — manually copy the URL bar.');
  }
});

// If user loads with token ?t=... decode and show exact result
function checkUrlToken(){
  const token = getParam('t');
  if(token){
    const data = decodeToken(token);
    if(data && data.r && data.p){
      // hide landing + quiz, show result with decoded percentages
      if(landing){
        landing.classList.add('hidden');
        landing.setAttribute('aria-hidden','true');
      }
      quizSection.classList.add('hidden');
      quizSection.setAttribute('aria-hidden','true');

      // set image if any
      const r = RESULTS[data.r];
      if(r && r.image){
        resultImg.src = r.image;
        resultImg.alt = `${r.title} image`;
        resultImg.classList.remove('hidden');
      } else {
        resultImg.classList.add('hidden');
      }

      // show label/desc
      const rr = RESULTS[data.r] || { title: data.r, desc: '' };
      resultLabel.textContent = rr.title || data.r;
      resultDesc.textContent = rr.desc || '';

      // set label color
      resultLabel.style.color = COLORS[data.r] || '';

      renderPercentages(data.p);
      resultSection.classList.remove('hidden');
      resultSection.setAttribute('aria-hidden','false');
      progressBar.style.width = '100%';
      return true;
    }
  }
  // fallback for old ?result param (generate random percentages)
  const old = getParam('result');
  if(old && RESULTS[old]){
    const pct = randomPercentagesWithWinner(old);
    showResultWithPercent(old, pct);
    return true;
  }
  return false;
}

// Start button handler — prepare a shuffled run
if(startBtn){
  startBtn.addEventListener('click', () => {
    prepareRun();
    if(landing){
      landing.classList.add('hidden');
      landing.setAttribute('aria-hidden','true');
    }
    quizSection.classList.remove('hidden');
    quizSection.setAttribute('aria-hidden','false');
    // small delay so CSS can animate if needed then render
    setTimeout(()=> renderQuestion(0), 80);
    // ensure progress reset
    progressBar.style.width = '0%';
    // scroll to quiz for mobile
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// allow keyboard start (Enter) on landing for accessibility
document.addEventListener('keydown', (e) => {
  if(e.key === 'Enter' && landing && !landing.classList.contains('hidden')){
    startBtn.click();
  }
});

// initial boot
document.addEventListener('DOMContentLoaded', () => {
  if(!checkUrlToken()){
    // show landing if available, otherwise start quiz directly (start randomized run)
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