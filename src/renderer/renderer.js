'use strict';

// 렌더러 스크립트. 브라우저 환경이며 Node API(require, fs 등)는 쓸 수 없다.
// 메인 프로세스 기능은 preload 가 노출한 window.api 로만 호출한다.

async function renderAppInfo() {
  const info = await window.api.getAppInfo();
  const dl = document.getElementById('app-info');
  dl.replaceChildren();
  for (const [key, value] of Object.entries(info)) {
    const dt = document.createElement('dt');
    dt.textContent = key;
    const dd = document.createElement('dd');
    dd.textContent = value;
    dl.append(dt, dd);
  }
}

async function renderNote() {
  const note = await window.api.getSetting('note');
  document.getElementById('note-saved').textContent = note ?? '(없음)';
}

function bindNoteForm() {
  const form = document.getElementById('note-form');
  const input = document.getElementById('note-input');
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    await window.api.setSetting('note', input.value);
    input.value = '';
    await renderNote();
  });
}

window.addEventListener('DOMContentLoaded', () => {
  bindNoteForm();
  renderAppInfo().catch((err) => console.error(err));
  renderNote().catch((err) => console.error(err));
});
