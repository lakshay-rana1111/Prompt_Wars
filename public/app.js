const form = document.getElementById('upload-form');
const status = document.getElementById('status');
const resultRaw = document.getElementById('result-raw');
const resultStructured = document.getElementById('result-structured');
const loadDemoBtn = document.getElementById('load-demo');

function renderEvidence(evidence){
  if(!evidence || !evidence.length) return '';
  return evidence.map(e=>`<div class="evidence">• [${e.source}] "${e.quote.replace(/\n/g,' ')}" — ${e.rationale}</div>`).join('');
}

function renderOpinion(op){
  return `<div class="agent">
    <div class="strong">${op.agent.toUpperCase()} — ${op.recommendation} (confidence ${Math.round(op.confidence*100)}%)</div>
    <div><strong>Summary:</strong> ${op.summary}</div>
    <div><strong>Strengths:</strong> ${op.strengths.join(', ') || 'N/A'}</div>
    <div><strong>Concerns:</strong> ${op.concerns.join(', ') || 'N/A'}</div>
    ${renderEvidence(op.evidence)}
  </div>`;
}

function renderResult(data){
  resultStructured.innerHTML = '';
  resultRaw.style.display = 'none';
  const jd = data.jobDescription || '';
  data.results.forEach(r => {
    const div = document.createElement('div');
    div.className = 'panel';
    const final = r.finalDecision || {};
    div.innerHTML = `<h3>Candidate ${r.candidateId} — ${r.profile.candidateName || 'Unnamed'}</h3>
      <div><strong>Final recommendation:</strong> ${final.recommendation || 'N/A'} <em>(${final.confidence ? Math.round(final.confidence*100)+'%':''})</em></div>
      <div><strong>Rationale:</strong> ${final.decisionRationale || ''}</div>
      <div style="margin-top:8px"><strong>Key strengths:</strong> ${(final.keyStrengths || []).join(', ')}</div>
      <div><strong>Key concerns:</strong> ${(final.keyConcerns || []).join(', ')}</div>
      <h4>Agent Opinions</h4>
      <div class="flex">${(r.initialOpinions || []).map(renderOpinion).join('')}</div>
      <h4>Debate turns</h4>
      ${(r.debate && r.debate.turns && r.debate.turns.length) ? r.debate.turns.map(t=>`<div class="agent"><div class="strong">${t.speaker} → ${t.targetAgent} — ${t.responseType}</div><div>${t.message}</div>${renderEvidence(t.evidence)}</div>`).join('') : '<div>No debate recorded</div>'}
    `;
    resultStructured.appendChild(div);
  });
}

async function postAnalyze(fd){
  status.textContent = 'Uploading...';
  try{
    const resp = await fetch('/api/analyze',{method:'POST', body: fd});
    if(!resp.ok){
      const txt = await resp.text();
      status.textContent = 'Server error';
      resultRaw.style.display = 'block';
      resultRaw.textContent = txt;
      return;
    }
    status.textContent = 'Processing (may take 30-90s)';
    const json = await resp.json();
    status.textContent = 'Done';
    renderResult(json);
  }catch(err){
    status.textContent = 'Network error';
    resultRaw.style.display = 'block';
    resultRaw.textContent = String(err);
  }
}

form.addEventListener('submit', async (e)=>{
  e.preventDefault();
  const fd = new FormData(form);
  await postAnalyze(fd);
});

loadDemoBtn.addEventListener('click', async ()=>{
  status.textContent = 'Loading demo result...';
  try{
    const resp = await fetch('/demo-result.json');
    if(!resp.ok){
      status.textContent = 'No demo result available on server';
      return;
    }
    const json = await resp.json();
    status.textContent = 'Loaded demo result';
    renderResult(json);
  }catch(err){
    status.textContent = 'Error loading demo result';
  }
});

// If demo-result.json exists, load it silently after 1s
setTimeout(async ()=>{
  try{
    const resp = await fetch('/demo-result.json');
    if(resp.ok){
      const json = await resp.json();
      renderResult(json);
      status.textContent = 'Demo result loaded';
    }
  }catch(e){/* ignore */}
},1000);
