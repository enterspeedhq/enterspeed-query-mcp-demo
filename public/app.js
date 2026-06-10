const chatWindow = document.getElementById('chatWindow');
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const clearBtn = document.getElementById('clearBtn');
const toolTrace = document.getElementById('toolTrace');
const toolTraceSummary = document.getElementById('toolTraceSummary');
const toolTraceContent = document.getElementById('toolTraceContent');

const conversationHistory = [];

const SUGGESTIONS = [
  'How many orders do I have? Please break them down by status.',
  'Which customer segment generated the most revenue from completed orders? Break it down by product category.',
  'Which countries have the highest refund or cancellation rate? Is any product category driving the problem?',
  'Who are the top 3 customers by gross margin generated from completed orders? Show their segment and country.',
  'Which two products appear together in the same completed order most often?',
];

function removeEmptyState() {
  const el = document.getElementById('emptyState');
  if (el) el.remove();
}

function buildEmptyState() {
  const el = document.getElementById('emptyState');
  if (!el) return;

  const heading = document.createElement('p');
  heading.className = 'empty-heading';
  heading.textContent = 'Ask a question about your Enterspeed data, or pick one below';

  const grid = document.createElement('div');
  grid.className = 'suggestion-grid';

  SUGGESTIONS.forEach((prompt) => {
    const btn = document.createElement('button');
    btn.className = 'suggestion';
    btn.innerHTML = `<span class="suggestion-text">${prompt}</span><span class="suggestion-arrow">→</span>`;
    btn.addEventListener('click', () => sendMessage(prompt));
    grid.appendChild(btn);
  });

  el.appendChild(heading);
  el.appendChild(grid);
}

buildEmptyState();

function makeAvatar(role) {
  const el = document.createElement('div');
  el.className = `avatar ${role}-avatar`;
  el.textContent = role === 'user' ? 'J' : 'ES';
  return el;
}

function appendMessage(role, text) {
  removeEmptyState();
  const div = document.createElement('div');
  div.className = `message ${role}`;
  div.appendChild(makeAvatar(role));
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.textContent = text;
  div.appendChild(bubble);
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return div;
}

function appendLoadingMessage() {
  removeEmptyState();
  const div = document.createElement('div');
  div.className = 'message assistant loading';
  div.appendChild(makeAvatar('assistant'));
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = '<span class="loading-dots"><span>●</span><span>●</span><span>●</span></span>';
  div.appendChild(bubble);
  chatWindow.appendChild(div);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return div;
}

function renderToolSteps(steps) {
  if (!steps || steps.length === 0) {
    toolTrace.hidden = true;
    return;
  }

  toolTrace.hidden = false;
  const count = steps.length;
  toolTraceSummary.textContent = `Tool calls (${count})`;
  toolTraceContent.innerHTML = '';

  steps.forEach((step) => {
    const el = document.createElement('div');
    el.className = `tool-step${step.isError ? ' error' : ''}`;

    const nameEl = document.createElement('div');
    nameEl.className = 'tool-step-name';
    nameEl.textContent = step.toolName;
    el.appendChild(nameEl);

    const inputLabel = document.createElement('div');
    inputLabel.className = 'tool-step-label';
    inputLabel.textContent = 'Input';
    el.appendChild(inputLabel);

    const inputPre = document.createElement('pre');
    inputPre.textContent = JSON.stringify(step.input, null, 2);
    el.appendChild(inputPre);

    const resultLabel = document.createElement('div');
    resultLabel.className = 'tool-step-label';
    resultLabel.textContent = step.isError ? 'Error' : 'Result';
    el.appendChild(resultLabel);

    const resultPre = document.createElement('pre');
    const maxLen = 600;
    resultPre.textContent = step.result.length > maxLen
      ? step.result.slice(0, maxLen) + '\n…(truncated)'
      : step.result;
    el.appendChild(resultPre);

    toolTraceContent.appendChild(el);
  });
}

async function sendMessage(message) {
  sendBtn.disabled = true;
  messageInput.value = '';

  appendMessage('user', message);
  const loadingEl = appendLoadingMessage();

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, conversationHistory }),
    });

    const data = await res.json();

    loadingEl.classList.remove('loading');
    const bubble = loadingEl.querySelector('.bubble');

    if (data.error && !data.answer) {
      bubble.textContent = `Error: ${data.error}`;
      loadingEl.classList.add('error');
    } else {
      const raw = data.answer || '(no response)';
      bubble.innerHTML = DOMPurify.sanitize(marked.parse(raw));
      bubble.classList.add('markdown');
      conversationHistory.push({ role: 'user', content: message });
      conversationHistory.push({ role: 'assistant', content: data.answer });
    }

    renderToolSteps(data.toolSteps);
  } catch (err) {
    loadingEl.classList.remove('loading');
    loadingEl.querySelector('.bubble').textContent = `Network error: ${err.message}`;
  } finally {
    sendBtn.disabled = false;
    messageInput.focus();
    chatWindow.scrollTop = chatWindow.scrollHeight;
  }
}

clearBtn.addEventListener('click', () => {
  conversationHistory.length = 0;
  chatWindow.innerHTML = '<div class="empty-state" id="emptyState"></div>';
  toolTrace.hidden = true;
  buildEmptyState();
  messageInput.focus();
});

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const message = messageInput.value.trim();
  if (message) sendMessage(message);
});

messageInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    chatForm.requestSubmit();
  }
});
