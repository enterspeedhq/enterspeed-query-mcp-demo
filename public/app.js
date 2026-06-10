const chatWindow = document.getElementById('chatWindow');
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const toolTrace = document.getElementById('toolTrace');
const toolTraceSummary = document.getElementById('toolTraceSummary');
const toolTraceContent = document.getElementById('toolTraceContent');

const conversationHistory = [];

function removeEmptyState() {
  const el = document.getElementById('emptyState');
  if (el) el.remove();
}

function appendMessage(role, text) {
  removeEmptyState();
  const div = document.createElement('div');
  div.className = `message ${role}`;
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
      bubble.textContent = data.answer || '(no response)';
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
