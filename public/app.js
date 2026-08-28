const form = document.getElementById('upload-form');
const status = document.getElementById('status');
const result = document.getElementById('result');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  status.textContent = 'Uploading...';
  result.textContent = '';

  const fd = new FormData(form);

  try {
    const resp = await fetch('/api/analyze', { method: 'POST', body: fd });
    if (!resp.ok) {
      const text = await resp.text();
      status.textContent = 'Server error';
      result.textContent = text;
      return;
    }
    status.textContent = 'Processing (this may take 30-90s)';
    const json = await resp.json();
    status.textContent = 'Done';
    result.textContent = JSON.stringify(json, null, 2);
  } catch (err) {
    status.textContent = 'Network error';
    result.textContent = String(err);
  }
});
