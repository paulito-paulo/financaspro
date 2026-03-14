/* ============================================================
   METAS.JS — Metas financeiras
   ============================================================ */

// ── CRUD ──────────────────────────────────────────────────────

/** Salva ou edita uma meta */
function saveMeta() {
  const nome  = document.getElementById('metaNome').value.trim();
  const valor = parseFloat(document.getElementById('metaValor').value);
  const prazo = document.getElementById('metaPrazo').value;

  if (!nome || !valor || !prazo) return toast('Preencha todos os campos', 'warning');

  const editId = document.getElementById('editMetaId').value;

  if (editId) {
    const idx = DATA.goals.findIndex(g => g.id === editId);
    if (idx > -1) DATA.goals[idx] = { ...DATA.goals[idx], name: nome, target: valor, deadline: prazo };
    toast('Meta atualizada!');
  } else {
    DATA.goals.push({ id: uid(), name: nome, target: valor, deadline: prazo, current: 0, history: [] });
    toast('Meta criada!');
  }

  saveData();
  closeModal('modalMeta');
  renderMetas();
}

/** Preenche o modal com os dados da meta para edição */
function editMeta(id) {
  const g = DATA.goals.find(g => g.id === id);
  if (!g) return;

  document.getElementById('editMetaId').value           = id;
  document.getElementById('metaNome').value             = g.name;
  document.getElementById('metaValor').value            = g.target;
  document.getElementById('metaPrazo').value            = g.deadline;
  document.getElementById('metaModalTitle').textContent = 'Editar Meta';

  openModal('modalMeta');
}

/** Remove uma meta após confirmação */
function deleteMeta(id) {
  if (!confirm('Excluir esta meta?')) return;
  DATA.goals = DATA.goals.filter(g => g.id !== id);
  saveData();
  renderMetas();
  toast('Meta excluída', 'error');
}

/** Abre modal para adicionar valor a uma meta */
function openAddToGoal(id) {
  const g = DATA.goals.find(g => g.id === id);
  if (!g) return;
  document.getElementById('addGoalMetaId').value      = id;
  document.getElementById('addGoalMetaName').textContent = g.name;
  openModal('modalAddGoal');
}

/** Registra aporte em uma meta */
function saveAddToGoal() {
  const id    = document.getElementById('addGoalMetaId').value;
  const valor = parseFloat(document.getElementById('addGoalValor').value);
  const data  = document.getElementById('addGoalData').value;

  if (!valor || !data) return toast('Preencha todos os campos', 'warning');

  const idx = DATA.goals.findIndex(g => g.id === id);
  if (idx < 0) return;

  DATA.goals[idx].current  = (DATA.goals[idx].current || 0) + valor;
  DATA.goals[idx].history  = DATA.goals[idx].history || [];
  DATA.goals[idx].history.push({ value: valor, date: data });

  saveData();
  closeModal('modalAddGoal');
  renderMetas();
  renderDashboard();
  toast('Valor adicionado à meta!');
}

// ── Renderização ──────────────────────────────────────────────

/** Renderiza os cards de metas */
function renderMetas() {
  const grid = document.getElementById('goals-grid');

  if (!DATA.goals.length) {
    grid.innerHTML = `
      <div class="empty" style="grid-column:1/-1">
        <div class="empty-icon">◎</div>
        <div class="empty-text">Nenhuma meta cadastrada</div>
        <div class="empty-sub">Crie sua primeira meta financeira</div>
      </div>`;
    return;
  }

  grid.innerHTML = DATA.goals.map(g => {
    const pct      = Math.min(100, g.target > 0 ? (g.current / g.target) * 100 : 0);
    const deadline = g.deadline ? new Date(g.deadline) : null;
    const today    = new Date();
    const daysLeft = deadline ? Math.ceil((deadline - today) / (1000 * 60 * 60 * 24)) : null;
    const hist     = (g.history || []).slice(-3).reverse();

    return `
      <div class="goal-card">
        <div class="goal-header">
          <div>
            <div class="goal-name">${g.name}</div>
            <div class="goal-deadline">${
              deadline
                ? `Prazo: ${deadline.toLocaleDateString('pt-BR')} ${
                    daysLeft !== null
                      ? `(${daysLeft > 0 ? daysLeft + ' dias' : 'vencido'})`
                      : ''
                  }`
                : ''
            }</div>
          </div>
          <div class="goal-actions">
            <button class="icon-btn" onclick="openAddToGoal('${g.id}')" title="Adicionar valor">+</button>
            <button class="icon-btn" onclick="editMeta('${g.id}')" title="Editar">✎</button>
            <button class="icon-btn" onclick="deleteMeta('${g.id}')" title="Excluir">✕</button>
          </div>
        </div>
        <div class="goal-progress">
          <div class="goal-amounts">
            <span class="goal-current">${fmt(g.current || 0)}</span>
            <span class="goal-target">de ${fmt(g.target)}</span>
          </div>
          <div class="goal-bar"><div class="goal-fill" style="width:${pct}%"></div></div>
          <div style="font-size:9px;color:var(--text3)">${pct.toFixed(1)}% concluído</div>
        </div>
        ${hist.length ? `
          <div class="goal-history">
            <div class="goal-hist-title">Histórico recente</div>
            ${hist.map(h => `
              <div class="goal-hist-item">
                <span class="text-green">+${fmt(h.value)}</span>
                <span class="goal-hist-date">${new Date(h.date).toLocaleDateString('pt-BR')}</span>
              </div>`).join('')}
          </div>` : ''}
      </div>`;
  }).join('');
}


/* ============================================================
   REGRAS.JS — Regras de gasto (50/30/20)
   ============================================================ */

/** Atualiza o percentual de uma regra ao editar o input */
function updateRulePct(idx, val) {
  DATA.rules[idx].pct = parseInt(val) || 0;
}

/** Valida e salva as regras no Supabase */
function saveRules() {
  const total = DATA.rules.reduce((s, r) => s + (parseInt(r.pct) || 0), 0);
  if (total !== 100) return toast(`Soma das % deve ser 100% (atual: ${total}%)`, 'warning');
  saveData();
  renderRules();
  toast('Regras salvas!');
}

/** Renderiza os cards de regras de gasto com barras de uso e sugestões */
function renderRules() {
  const m       = DATA.currentMonth;
  const y       = DATA.currentYear;
  const income  = totalIncome(m, y);
  const expense = totalExpense(m, y);
  const saved   = income - expense;

  // Cards de regras
  document.getElementById('rules-grid').innerHTML = DATA.rules.map((r, i) => {
    const alloc    = income * (r.pct / 100);
    const spent    = r.id === 'vida' ? expense : r.id === 'reserva' ? Math.max(0, saved) : 0;
    const spentPct = alloc > 0 ? Math.min(100, (spent / alloc) * 100) : 0;
    const status   = spentPct >= 100 ? 'danger' : spentPct >= 80 ? 'warning' : 'ok';
    const statusMsg = spentPct >= 100 ? '⚠ Limite estourado!' : spentPct >= 80 ? '⚠ Próximo do limite' : '✓ Dentro do limite';

    return `
      <div class="budget-rule">
        <div class="budget-rule-header">
          <div>
            <div class="budget-rule-name">${r.emoji} ${r.name}</div>
            <div style="font-size:9px;color:var(--text3)">${r.desc}</div>
          </div>
          <div style="display:flex;align-items:center;gap:6px">
            <input type="number" value="${r.pct}" min="0" max="100"
              onchange="updateRulePct(${i}, this.value)"
              style="width:50px;text-align:center;padding:4px">
            <span style="font-size:10px;color:var(--text3)">%</span>
          </div>
        </div>
        <div style="font-size:10px;color:var(--text2);margin-bottom:6px">
          Alocação: <strong style="color:var(--text)">${fmt(alloc)}</strong>
        </div>
        <div class="budget-bar">
          <div class="budget-fill" style="width:${spentPct}%;background:${r.color}"></div>
        </div>
        <div class="budget-stats">
          <span>Usado: ${fmt(spent)}</span>
          <span>${spentPct.toFixed(0)}%</span>
        </div>
        <div class="budget-alert ${status}">${statusMsg}</div>
      </div>`;
  }).join('');

  // Sugestões
  const suggest = document.getElementById('suggest-list');
  if (!income) {
    suggest.innerHTML = '<div style="font-size:11px;color:var(--text3)">Adicione entradas para ver sugestões personalizadas.</div>';
    return;
  }
  suggest.innerHTML = DATA.rules.map(r => `
    <div class="suggest-item">
      <div class="suggest-dot" style="background:${r.color}"></div>
      <div style="flex:1">
        <div style="font-size:11px;color:var(--text)">${r.emoji} ${r.name} — ${r.pct}%</div>
        <div style="font-size:10px;color:var(--text2)">
          Você pode gastar até <strong style="color:var(--text)">${fmt(income * (r.pct / 100))}</strong> nesta categoria
        </div>
      </div>
    </div>`).join('');
}


/* ============================================================
   LEMBRETES.JS — Bloco de notas/lembretes
   ============================================================ */

/** Salva um novo lembrete */
function saveNote() {
  const text = document.getElementById('noteText').value.trim();
  if (!text) return toast('Escreva algo primeiro', 'warning');

  DATA.notes.push({ id: uid(), text, date: new Date().toISOString() });
  saveData();
  closeModal('modalNote');
  renderNotes();
  toast('Lembrete salvo!');
}

/** Remove um lembrete */
function deleteNote(id) {
  DATA.notes = DATA.notes.filter(n => n.id !== id);
  saveData();
  renderNotes();
  toast('Lembrete removido', 'error');
}

/** Renderiza a lista de lembretes */
function renderNotes() {
  const list  = document.getElementById('notes-list');
  const empty = document.getElementById('notes-empty');

  if (!DATA.notes.length) {
    list.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  list.innerHTML = DATA.notes
    .slice()
    .reverse()
    .map(n => `
      <div class="note-item">
        <div style="flex:1">
          <div class="note-text">${n.text}</div>
          <div class="note-date">${new Date(n.date).toLocaleDateString('pt-BR', {
            day: '2-digit', month: 'short', year: 'numeric',
          })}</div>
        </div>
        <button class="icon-btn" onclick="deleteNote('${n.id}')">✕</button>
      </div>`)
    .join('');
}
