// PARODY quiz: answers don't matter. final result is random.
// Small, dependency-free client-side script.

const QUESTIONS = [
  { q: "Pick a snack during a tense match", choices: ["Chips", "Pickles", "Protein bar"] },
  { q: "Preferred warm-up", choices: ["Stretch", "Blink training", "Meditate"] },
  { q: "Your grinder-friendly mantra", choices: ["One more", "Relax and win", "Just mash"] },
  { q: "Favorite victory pose", choices: ["Fist pump", "Calm nod", "Chest flex"] },
  { q: "Best post-match drink", choices: ["Soda", "Water", "Energy drink"] }
];

const RESULTS = {
  Heart: { title: "Heart", desc: "You win with passion. Or at least you think you do." },
  Body: { title: "Body", desc: "You brute force your way to glory. Respect." },
  Mind: { title: "Mind", desc: "You overthink the combo but sometimes it works." }
};

const questionTitle = document.getElementById('question-title');
const choicesBox = document.getElementById('choices');
const progressBar = document.getElementById('progress-bar');
const quizSection = document.getElementById('quiz');
const resultSection = document.getElementById('result');
const resultLabel = document.getElementById('result-label');
const resultDesc = document.getElementById('result-desc');
const retakeBtn = document.getElementById('retake');
const copyBtn = document.getElementById('copy-link');

let index = 0;

// utility: get URL param
function getParam(name){
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

function renderQuestion(i){
  const q = QUESTIONS[i];
  questionTitle.textContent = `Q${i+1}. ${q.q}`;
  choicesBox.innerHTML = '';
  q.choices.forEach((c, j) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'choice';
    b.setAttribute('role','listitem');
    b.textContent = c;
    b.addEventListener('click', () => onChoose(i, j));
    choicesBox.appendChild(b);
  });
  // progress
  progressBar.style.width = `${Math.round((i/QUESTIONS.length)*100)}%`;
}

function onChoose(qi, choiceIndex){
  // For a parody quiz we simply proceed. We ignore the actual choice values.
  index++;
  if(index < QUESTIONS.length){
    renderQuestion(index);
  } else {
    // finished => random result
    showResult(randomResult());
  }
}

function randomResult(){
  const keys = Object.keys(RESULTS);
  const pick = keys[Math.floor(Math.random()*keys.length)];
  return pick;
}

function showResult(key){
  quizSection.classList.add('hidden');
  const r = RESULTS[key];
  resultLabel.textContent = r.title;
  resultDesc.textContent = r.desc;
  resultSection.classList.remove('hidden');
  // update progress to full
  progressBar.style.width = '100%';
  // update share URL (so others can open directly)
  const url = new URL(window.location.href);
  url.searchParams.set('result', key);
  window.history.replaceState({}, '', url.toString());
}

retakeBtn.addEventListener('click', () => {
  index = 0;
  quizSection.classList.remove('hidden');
  resultSection.classList.add('hidden');
  renderQuestion(0);
  progressBar.style.width = '0%';
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

// If user loads with ?result=Key show directly
function checkUrlResult(){
  const param = getParam('result');
  if(param && RESULTS[param]){
    quizSection.classList.add('hidden');
    showResult(param);
    return true;
  }
  return false;
}

document.addEventListener('DOMContentLoaded', () => {
  // initial
  if(!checkUrlResult()){
    renderQuestion(0);
  }
});