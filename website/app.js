import { removeWatermarkFromImage } from '../src/sdk/browser.js';

const $ = (id) => document.getElementById(id);
const input = $('fileInput');
const dropzone = $('dropzone');
const queueWrap = $('queueWrap');
const queueEl = $('queue');
const resultsEl = $('results');
const statusEl = $('status');
let files = [];
let outputs = [];

$('themeToggle').addEventListener('click', () => {
  document.documentElement.classList.toggle('light');
  localStorage.setItem('aiwr-theme', document.documentElement.classList.contains('light') ? 'light' : 'dark');
});
if (localStorage.getItem('aiwr-theme') === 'light') document.documentElement.classList.add('light');

function formatSize(bytes) {
  return bytes < 1024 * 1024 ? (bytes / 1024).toFixed(0) + ' KB' : (bytes / 1024 / 1024).toFixed(1) + ' MB';
}
function renderQueue() {
  queueWrap.hidden = files.length === 0;
  $('queueCount').textContent = files.length + (files.length === 1 ? ' image selected' : ' images selected');
  queueEl.innerHTML = files.map((file, i) => `<div class="queue-item"><span>${escapeHtml(file.name)}</span><small>${formatSize(file.size)}</small><span class="state" id="state-${i}">Ready</span></div>`).join('');
  $('processBtn').disabled = files.length === 0;
  $('zipBtn').disabled = outputs.length === 0;
}
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function addFiles(list) {
  const accepted = [...list].filter(file => /^image\/(png|jpeg|webp)$/.test(file.type));
  const rejected = list.length - accepted.length;
  files = [...files, ...accepted];
  outputs = [];
  resultsEl.replaceChildren();
  renderQueue();
  statusEl.textContent = rejected ? `${rejected} unsupported file(s) ignored. Use PNG, JPEG or WebP.` : '';
}
input.addEventListener('change', e => addFiles(e.target.files));
for (const eventName of ['dragenter','dragover']) dropzone.addEventListener(eventName, e => { e.preventDefault(); dropzone.classList.add('drag'); });
for (const eventName of ['dragleave','drop']) dropzone.addEventListener(eventName, e => { e.preventDefault(); dropzone.classList.remove('drag'); });
dropzone.addEventListener('drop', e => addFiles(e.dataTransfer.files));
$('clearBtn').addEventListener('click', () => { files=[]; outputs=[]; input.value=''; resultsEl.replaceChildren(); statusEl.textContent=''; renderQueue(); });

$('processBtn').addEventListener('click', async () => {
  const button = $('processBtn');
  button.disabled = true;
  $('zipBtn').disabled = true;
  outputs = [];
  resultsEl.replaceChildren();
  for (let i=0; i<files.length; i++) {
    const file = files[i];
    const state = $('state-'+i);
    state.textContent = 'Processing…';
    statusEl.textContent = `Processing ${i+1} of ${files.length}: ${file.name}`;
    try {
      const bitmap = await createImageBitmap(file);
      const { canvas, meta } = await removeWatermarkFromImage(bitmap);
      bitmap.close?.();
      const blob = typeof canvas.convertToBlob === 'function'
        ? await canvas.convertToBlob({ type: 'image/png' })
        : await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Could not export the processed image.');
      const url = URL.createObjectURL(blob);
      const outputName = file.name.replace(/\.[^.]+$/, '') + '-cleaned.png';
      outputs.push({ blob, url, name: outputName, original: file.name, applied: meta?.applied });
      state.textContent = meta?.applied ? 'Cleaned' : 'No watermark detected';
      const card = document.createElement('article');
      card.className = 'result-card';
      const img = document.createElement('img'); img.src=url; img.alt='Processed result for '+file.name;
      const metaRow = document.createElement('div'); metaRow.className='result-meta';
      const label = document.createElement('span'); label.textContent = file.name;
      const link = document.createElement('a'); link.href=url; link.download=outputName; link.textContent='Download ↓';
      metaRow.append(label,link); card.append(img,metaRow); resultsEl.append(card);
    } catch (error) {
      state.textContent = 'Failed';
      statusEl.textContent = `Could not process ${file.name}: ${error.message || error}`;
    }
    renderQueue();
  }
  statusEl.textContent = `Finished. ${outputs.length} of ${files.length} file(s) processed. Review each result before using it.`;
  button.disabled = false;
  $('zipBtn').disabled = outputs.length === 0;
});

$('zipBtn').addEventListener('click', async () => {
  const button = $('zipBtn');
  button.disabled = true;
  button.textContent = 'Preparing ZIP…';
  try {
    const { zipSync, strToU8 } = await import('https://cdn.jsdelivr.net/npm/fflate@0.8.2/esm/browser.js');
    const archive = {};
    for (const item of outputs) archive[item.name] = new Uint8Array(await item.blob.arrayBuffer());
    const zipped = zipSync(archive, { level: 6 });
    const blob = new Blob([zipped], {type:'application/zip'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href=url; link.download='ai-watermark-remover-results.zip'; link.click();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
    statusEl.textContent = 'ZIP archive downloaded.';
  } catch (error) {
    statusEl.textContent = 'ZIP creation failed: ' + (error.message || error);
  } finally {
    button.disabled = false;
    button.textContent = 'Download all as ZIP';
  }
});
renderQueue();