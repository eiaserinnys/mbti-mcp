/**
 * MBTI 테스트 클라이언트
 */

// 상태
const state = {
  sessionId: null,
  currentQuestion: 1,
  totalQuestions: 32,
  answers: {}, // { questionNumber: answer }
};

// DOM 요소
const screens = {
  start: document.getElementById('start-screen'),
  question: document.getElementById('question-screen'),
  result: document.getElementById('result-screen'),
};

const elements = {
  startForm: document.getElementById('start-form'),
  nameInput: document.getElementById('name'),
  progressFill: document.getElementById('progress-fill'),
  progressText: document.getElementById('progress-text'),
  questionNumber: document.getElementById('question-number'),
  optionAText: document.getElementById('option-a-text'),
  optionBText: document.getElementById('option-b-text'),
  scaleButtons: document.getElementById('scale-buttons'),
  prevBtn: document.getElementById('prev-btn'),
  nextBtn: document.getElementById('next-btn'),
  resultName: document.getElementById('result-name'),
  resultType: document.getElementById('result-type'),
  resultDescription: document.getElementById('result-description'),
  resultScores: document.getElementById('result-scores'),
  restartBtn: document.getElementById('restart-btn'),
  loading: document.getElementById('loading'),
  errorToast: document.getElementById('error-toast'),
  errorMessage: document.getElementById('error-message'),
};

// 유틸리티
function showScreen(screenName) {
  Object.values(screens).forEach((s) => s.classList.remove('active'));
  screens[screenName].classList.add('active');
}

function showLoading() {
  elements.loading.classList.remove('hidden');
}

function hideLoading() {
  elements.loading.classList.add('hidden');
}

function showError(message) {
  elements.errorMessage.textContent = message;
  elements.errorToast.classList.remove('hidden');
  setTimeout(() => {
    elements.errorToast.classList.add('hidden');
  }, 3000);
}

async function apiCall(endpoint, options = {}) {
  try {
    showLoading();
    const response = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || '오류가 발생했습니다.');
    }
    return data;
  } catch (error) {
    showError(error.message);
    throw error;
  } finally {
    hideLoading();
  }
}

// 테스트 시작
async function startTest(name) {
  const data = await apiCall('/start', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });

  state.sessionId = data.session_id;
  state.currentQuestion = 1;
  state.answers = {};

  await loadQuestion();
  showScreen('question');
}

// 문항 로드
async function loadQuestion() {
  const data = await apiCall(`/question/${state.sessionId}?number=${state.currentQuestion}`);

  elements.questionNumber.textContent = `문항 ${data.question_number}`;
  elements.optionAText.textContent = data.option_a;
  elements.optionBText.textContent = data.option_b;

  updateProgress();
  updateScaleButtons();
  updateNavButtons();
}

// 진행률 업데이트
function updateProgress() {
  const progress = (state.currentQuestion / state.totalQuestions) * 100;
  elements.progressFill.style.width = `${progress}%`;
  elements.progressText.textContent = `${state.currentQuestion} / ${state.totalQuestions}`;
}

// 척도 버튼 업데이트
function updateScaleButtons() {
  const buttons = elements.scaleButtons.querySelectorAll('.scale-btn');
  const currentAnswer = state.answers[state.currentQuestion];

  buttons.forEach((btn) => {
    const value = parseInt(btn.dataset.value, 10);
    btn.classList.toggle('selected', value === currentAnswer);
  });
}

// 네비게이션 버튼 업데이트
function updateNavButtons() {
  elements.prevBtn.disabled = state.currentQuestion === 1;

  const hasAnswer = state.answers[state.currentQuestion] !== undefined;

  if (state.currentQuestion === state.totalQuestions) {
    elements.nextBtn.textContent = '결과 보기';
    elements.nextBtn.disabled = !hasAnswer;
  } else {
    elements.nextBtn.textContent = '다음';
    elements.nextBtn.disabled = !hasAnswer;
  }
}

// 답변 제출
async function submitAnswer(answer) {
  state.answers[state.currentQuestion] = answer;
  updateScaleButtons();
  updateNavButtons();

  try {
    await apiCall('/answer', {
      method: 'POST',
      body: JSON.stringify({
        session_id: state.sessionId,
        question_number: state.currentQuestion,
        answer,
      }),
    });
  } catch {
    // 에러는 이미 표시됨
  }
}

// 이전 문항
async function goToPrevQuestion() {
  if (state.currentQuestion > 1) {
    state.currentQuestion--;
    await loadQuestion();
  }
}

// 다음 문항 또는 결과
async function goToNextQuestion() {
  if (state.currentQuestion < state.totalQuestions) {
    state.currentQuestion++;
    await loadQuestion();
  } else {
    await showResult();
  }
}

// 결과 표시
async function showResult() {
  const data = await apiCall(`/result/${state.sessionId}`);

  elements.resultName.textContent = `${data.name}님의 성격 유형`;
  elements.resultType.textContent = data.mbti_type;
  elements.resultDescription.textContent = data.description;

  // 점수 표시
  const scores = data.scores;
  const dimensions = [
    { left: 'E', right: 'I', label: '외향 / 내향' },
    { left: 'S', right: 'N', label: '감각 / 직관' },
    { left: 'T', right: 'F', label: '사고 / 감정' },
    { left: 'J', right: 'P', label: '판단 / 인식' },
  ];

  elements.resultScores.innerHTML = dimensions
    .map(({ left, right, label }) => {
      const leftScore = scores[left];
      const rightScore = scores[right];
      return `
        <div class="score-item">
          <span class="score-label">${label}</span>
          <div class="score-bar-container">
            <span class="score-value">${left} ${leftScore}%</span>
            <div class="score-bar">
              <div class="score-bar-fill" style="width: ${leftScore}%"></div>
            </div>
            <span class="score-value">${rightScore}% ${right}</span>
          </div>
        </div>
      `;
    })
    .join('');

  showScreen('result');
}

// 다시 시작
function restart() {
  state.sessionId = null;
  state.currentQuestion = 1;
  state.answers = {};
  elements.nameInput.value = '';
  showScreen('start');
}

// 이벤트 리스너
elements.startForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const name = elements.nameInput.value.trim();
  if (name) {
    await startTest(name);
  }
});

elements.scaleButtons.addEventListener('click', async (e) => {
  const btn = e.target.closest('.scale-btn');
  if (btn) {
    const value = parseInt(btn.dataset.value, 10);
    await submitAnswer(value);
  }
});

elements.prevBtn.addEventListener('click', goToPrevQuestion);
elements.nextBtn.addEventListener('click', goToNextQuestion);
elements.restartBtn.addEventListener('click', restart);

// 키보드 단축키
document.addEventListener('keydown', (e) => {
  if (screens.question.classList.contains('active')) {
    if (e.key >= '1' && e.key <= '5') {
      submitAnswer(parseInt(e.key, 10));
    } else if (e.key === 'ArrowLeft' && !elements.prevBtn.disabled) {
      goToPrevQuestion();
    } else if (e.key === 'ArrowRight' && !elements.nextBtn.disabled) {
      goToNextQuestion();
    } else if (e.key === 'Enter' && !elements.nextBtn.disabled) {
      goToNextQuestion();
    }
  }
});
