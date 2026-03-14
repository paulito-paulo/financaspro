/* ============================================================
   ENTRADAS.JS — Registro e exibição de entradas de dinheiro
   ============================================================ */

// ── CRUD ──────────────────────────────────────────────────────

/** Salva ou edita uma entrada a partir dos campos do modal */
function saveEntrada() {
  const dia   = parseInt(document.getElementById('entradaDia').value);
  const valor = parseFloat(document.getElementById('entradaValor').value);
  const desc  = document.getElementById('entradaDesc').value.trim();
  const cat   = document.getElementById('entradaCat').value;

  if (!dia || !valor || !desc) return toast('Preencha todos os campos', 'warning');

  const editId = document.getElementById('editEntradaId').value;

  if (editId) {
    const idx = DATA.incomes.findIndex(i => i.id === editId);
    if (idx > -1) DATA.incomes[idx] = { ...DATA.incomes[idx], day: dia, value: valor, desc, cat };
    toast('Entrada atualizada!');
  } else {
    DATA.incomes.push({
      id:    uid(),
      month: DATA.currentMonth,
      year:  DATA.currentYear,
      day:   dia,
      value: valor,
      desc,
      cat,
    });
    toast('Entrada registrada!');
  }

  saveData();
  closeModal('modalEntrada');
  renderEntradas();
  renderDashboard();
}

/** Preenche o modal com os dados da entrada para edição */
function editEntrada(id) {
  const e = DATA.incomes.find(i => i.id === id);
  if (!e) return;

  document.getElementById('editEntradaId').value        = id;
  document.getElementById('entradaDia').value           = e.day;
  document.getElementById('entradaValor').value         = e.value;
  document.getElementById('entradaDesc').value          = e.desc;
  document.getElementById('entradaCat').value           = e.cat;
  document.getElementById('entradaModalTitle').textContent = 'Editar Entrada';

  openModal('modalEntrada');
}

/** Remove uma entrada após confirmação */
function deleteEntrada(id) {
  if (!confirm('Excluir esta entrada?')) return;
  DATA.incomes = DATA.incomes.filter(i => i.id !== id);
  saveData();
  renderEntradas();
  renderDashboard();
  toast('Entrada excluída', 'error');
}

// ── Renderização ──────────────────────────────────────────────

/** Renderiza a tabela de entradas do mês atual com filtros e resumo */
function renderEntradas() {
  const m         = DATA.currentMonth;
  const y         = DATA.currentYear;
  const incomes   = getMonthIncomes(m, y);
  const catFilter = document.getElementById('filterEntradaCat').value;

  // Atualiza select de categorias preservando seleção atual
  const cats = [...new Set(incomes.map(i => i.cat))];
  const sel  = document.getElementById('filterEntradaCat');
  const cur  = sel.value;
  sel.innerHTML = '<option value="">Todas categorias</option>';
  cats.forEach(c => {
    const o   = document.createElement('option');
    o.value   = c;
    o.textContent = c;
    if (c === cur) o.selected = true;
    sel.appendChild(o);
  });

  const filtered = catFilter ? incomes.filter(i => i.cat === catFilter) : incomes;
  const total    = filtered.reduce((s, i) => s + Number(i.value), 0);
  const totalAll = incomes.reduce((s, i) => s + Number(i.value), 0);

  // Categoria com maior valor
  const cats2  = {};
  incomes.forEach(i => { cats2[i.cat] = (cats2[i.cat] || 0) + Number(i.value); });
  const topCat = Object.entries(cats2).sort((a, b) => b[1] - a[1])[0];

  // Resumo
  document.getElementById('entradas-summary').innerHTML = `
    <div class="summary-item">
      <div class="summary-item-label">Total do Mês</div>
      <div class="summary-item-value text-green">${fmt(totalAll)}</div>
      <div class="summary-item-sub">${incomes.length} registro(s)</div>
    </div>
    <div class="summary-item">
      <div class="summary-item-label">Principal Fonte</div>
      <div class="summary-item-value">${topCat ? topCat[0] : '—'}</div>
      <div class="summary-item-sub">${topCat ? fmt(topCat[1]) : ''}</div>
    </div>
    <div class="summary-item">
      <div class="summary-item-label">Filtrado</div>
      <div class="summary-item-value text-accent">${fmt(total)}</div>
      <div class="summary-item-sub">${filtered.length} registro(s)</div>
    </div>
  `;

  // Tabela
  const tbody = document.getElementById('entradas-tbody');

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr><td colspan="5">
        <div class="empty">
          <div class="empty-icon">↑</div>
          <div class="empty-text">Nenhuma entrada este mês</div>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .sort((a, b) => a.day - b.day)
    .map(i => `
      <tr>
        <td>${String(i.day).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}</td>
        <td>${i.desc}</td>
        <td><span class="badge badge-green">${i.cat}</span></td>
        <td class="text-green">${fmt(i.value)}</td>
        <td style="display:flex;gap:6px;padding:9px 12px">
          <button class="icon-btn" onclick="editEntrada('${i.id}')">✎</button>
          <button class="icon-btn" onclick="deleteEntrada('${i.id}')">✕</button>
        </td>
      </tr>`)
    .join('');
}
