/* ============================================================
   SAIDAS.JS — Saídas, Parcelas, Gastos Fixos
   ============================================================ */

let fixedVisible = false;

// ── Preview de parcelas ───────────────────────────────────────

/**
 * Atualiza o preview de divisão de parcelas no modal de saída.
 * Exibido apenas quando pagamento = Crédito e parcelas > 1.
 */
function updateInstallmentPreview() {
  const pay     = document.getElementById('saidaPagamento').value;
  const val     = parseFloat(document.getElementById('saidaValor').value) || 0;
  const parc    = parseInt(document.getElementById('saidaParcelas').value) || 1;
  const pg      = document.getElementById('parcelasGroup');
  const preview = document.getElementById('installmentPreview');

  if (pay === 'Crédito') {
    pg.style.opacity = '1';

    if (val && parc > 1) {
      const parcVal = val / parc;
      const m = DATA.currentMonth;
      const y = DATA.currentYear;
      let text = '<strong>Divisão das parcelas:</strong><br>';

      for (let i = 0; i < parc; i++) {
        let pm = m + i, py = y;
        while (pm > 11) { pm -= 12; py++; }
        text += `${MONTHS_SHORT[pm]}/${py}: ${fmt(parcVal)}<br>`;
      }

      preview.innerHTML    = text;
      preview.style.display = 'block';
    } else {
      preview.style.display = 'none';
    }
  } else {
    pg.style.opacity      = '.4';
    preview.style.display = 'none';
  }
}

// ── CRUD de saídas ────────────────────────────────────────────

/** Salva ou edita uma saída; distribui parcelas nos meses corretos */
async function saveSaida() {
  const dia        = parseInt(document.getElementById('saidaDia').value);
  const valor      = parseFloat(document.getElementById('saidaValor').value);
  const desc       = document.getElementById('saidaDesc').value.trim();
  const cat        = document.getElementById('saidaCat').value;
  const pay        = document.getElementById('saidaPagamento').value;
  const parcSelect = parseInt(document.getElementById('saidaParcelas').value) || 1;
  const parc       = pay === 'Crédito' ? parcSelect : 1;

  if (!dia || !valor || !desc) return toast('Preencha todos os campos', 'warning');

  const editId = document.getElementById('editSaidaId').value;

  if (editId) {
    // ── Edição ──────────────────────────────────────────────
    const original = DATA.expenses.find(i => i.id === editId);
    if (!original) return toast('Registro não encontrado', 'error');

    const hasGroup = original.installments > 1 && original.baseId;

    if (hasGroup) {
      // Atualiza TODAS as parcelas do grupo, mantendo o mês/ano de cada uma
      const group       = DATA.expenses
        .filter(i => i.baseId === original.baseId)
        .sort((a, b) => a.installmentNum - b.installmentNum);
      const totalParc   = group.length;
      const parcVal     = parseFloat((valor / totalParc).toFixed(2));
      const descBase    = desc.replace(/ \(\d+\/\d+\)$/, '');

      group.forEach((e, i) => {
        const idx = DATA.expenses.findIndex(x => x.id === e.id);
        if (idx > -1) {
          DATA.expenses[idx] = {
            ...DATA.expenses[idx],
            day:          dia,
            value:        parcVal,
            totalValue:   valor,
            desc:         `${descBase} (${i + 1}/${totalParc})`,
            cat,
            payment:      pay,
            installments: totalParc,
          };
        }
      });
      toast(`${totalParc} parcelas atualizadas!`);
    } else {
      // Saída simples — atualiza só este registro
      const idx = DATA.expenses.findIndex(i => i.id === editId);
      if (idx > -1) {
        DATA.expenses[idx] = {
          ...DATA.expenses[idx],
          day: dia, value: valor, totalValue: valor,
          desc, cat, payment: pay, installments: 1,
        };
      }
      toast('Saída atualizada!');
    }
  } else {
    // ── Novo lançamento ─────────────────────────────────────
    const baseId  = uid();
    const parcVal = parseFloat((valor / parc).toFixed(2));

    for (let i = 0; i < parc; i++) {
      let pm = DATA.currentMonth + i;
      let py = DATA.currentYear;
      while (pm > 11) { pm -= 12; py++; }

      DATA.expenses.push({
        id:             i === 0 ? baseId : uid(),
        baseId,
        month:          pm,
        year:           py,
        day:            dia,
        value:          parcVal,
        totalValue:     valor,
        desc:           parc > 1 ? `${desc} (${i + 1}/${parc})` : desc,
        cat,
        payment:        pay,
        installments:   parc,
        installmentNum: i + 1,
      });
    }

    if (parc > 1) {
      const meses = Array.from({ length: parc }, (_, i) => {
        let pm = DATA.currentMonth + i, py = DATA.currentYear;
        while (pm > 11) { pm -= 12; py++; }
        return `${MONTHS_SHORT[pm]}/${py}`;
      }).join(', ');
      toast(`${parc} parcelas lançadas → ${meses}`);
    } else {
      toast('Saída registrada!');
    }
  }

  saveData();
  closeModal('modalSaida');
  renderSaidas();
  renderDashboard();
}

/** Preenche o modal com os dados da saída para edição */
function editSaida(id) {
  const e = DATA.expenses.find(i => i.id === id);
  if (!e) return;

  document.getElementById('editSaidaId').value   = id;
  document.getElementById('saidaDia').value       = e.day;
  document.getElementById('saidaValor').value     = e.totalValue || e.value;
  document.getElementById('saidaDesc').value      = e.desc.replace(/ \(\d+\/\d+\)$/, '');
  document.getElementById('saidaCat').value       = e.cat;
  document.getElementById('saidaPagamento').value = e.payment;
  document.getElementById('saidaParcelas').value  = e.installments > 1 ? e.installments : 1;
  document.getElementById('saidaModalTitle').textContent = e.installments > 1
    ? `Editar Saída (${e.installments}x — todas as parcelas serão atualizadas)`
    : 'Editar Saída';

  openModal('modalSaida');
  updateInstallmentPreview();
}

/** Remove uma saída ou todas as parcelas do grupo */
function deleteSaida(id) {
  const e = DATA.expenses.find(i => i.id === id);
  if (!e) return;

  if (e.installments > 1 && e.baseId) {
    if (confirm(`Excluir todas as ${e.installments} parcelas?`)) {
      DATA.expenses = DATA.expenses.filter(i => i.baseId !== e.baseId);
      toast('Todas as parcelas excluídas', 'error');
    } else {
      DATA.expenses = DATA.expenses.filter(i => i.id !== id);
      toast('Parcela excluída', 'error');
    }
  } else {
    if (!confirm('Excluir esta saída?')) return;
    DATA.expenses = DATA.expenses.filter(i => i.id !== id);
    toast('Saída excluída', 'error');
  }

  saveData();
  renderSaidas();
  renderDashboard();
}

// ── Gastos fixos ──────────────────────────────────────────────

/** Alterna a visibilidade da seção de gastos fixos */
function toggleFixed() {
  fixedVisible = !fixedVisible;
  document.getElementById('fixedToggle').classList.toggle('on', fixedVisible);
  document.getElementById('fixedExpensesSection').style.display = fixedVisible ? 'block' : 'none';
  renderFixed();
}

/** Adiciona um gasto fixo que aparece em todos os meses */
function saveFixedExpense() {
  const desc  = document.getElementById('fixedDesc').value.trim();
  const valor = parseFloat(document.getElementById('fixedValor').value);
  const cat   = document.getElementById('fixedCat').value;
  const pay   = document.getElementById('fixedPagamento').value;

  if (!desc || !valor) return toast('Preencha todos os campos', 'warning');

  DATA.fixedExpenses.push({ id: uid(), desc, value: valor, cat, payment: pay });
  saveData();
  closeModal('modalFixedExpense');
  renderFixed();
  toast('Gasto fixo adicionado!');
}

/** Remove um gasto fixo */
function deleteFixed(id) {
  if (!confirm('Remover gasto fixo?')) return;
  DATA.fixedExpenses = DATA.fixedExpenses.filter(i => i.id !== id);
  saveData();
  renderFixed();
  renderSaidas();
  renderDashboard();
  toast('Gasto fixo removido', 'error');
}

/** Renderiza a tabela de gastos fixos */
function renderFixed() {
  const tbody = document.getElementById('fixed-tbody');

  if (!DATA.fixedExpenses.length) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;color:var(--text3);font-size:10px">
      Nenhum gasto fixo cadastrado</td></tr>`;
    return;
  }

  tbody.innerHTML = DATA.fixedExpenses.map(f => `
    <tr>
      <td>${f.desc}</td>
      <td><span class="badge" style="background:${catColor(f.cat)}22;color:${catColor(f.cat)}">${f.cat}</span></td>
      <td class="text-red">${fmt(f.value)}</td>
      <td>${f.payment}</td>
      <td><button class="icon-btn" onclick="deleteFixed('${f.id}')">✕</button></td>
    </tr>`).join('');
}

// ── Renderização ──────────────────────────────────────────────

/** Renderiza a lista de saídas do mês com filtros e resumo */
function renderSaidas() {
  const m         = DATA.currentMonth;
  const y         = DATA.currentYear;
  const allExp    = getMonthExpenses(m, y);
  const catFilter = document.getElementById('filterSaidaCat').value;
  const payFilter = document.getElementById('filterSaidaPay').value;

  // Atualiza select de categorias
  const cats = [...new Set(allExp.map(e => e.cat))];
  const sel  = document.getElementById('filterSaidaCat');
  const curCat = sel.value;
  sel.innerHTML = '<option value="">Todas categorias</option>';
  cats.forEach(c => {
    const o = document.createElement('option');
    o.value = c; o.textContent = c;
    if (c === curCat) o.selected = true;
    sel.appendChild(o);
  });

  let filtered = allExp;
  if (catFilter) filtered = filtered.filter(e => e.cat === catFilter);
  if (payFilter) filtered = filtered.filter(e => e.payment === payFilter);

  // Totais
  const total     = allExp.reduce((s, e) => s + Number(e.value), 0);
  const catTotals = {};
  allExp.forEach(e => { catTotals[e.cat] = (catTotals[e.cat] || 0) + Number(e.value); });
  const topCat    = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];
  const totalFixed = DATA.fixedExpenses.reduce((s, f) => s + Number(f.value), 0);
  const totalFiltered = filtered.reduce((s, e) => s + Number(e.value), 0);

  // Resumo
  document.getElementById('saidas-summary').innerHTML = `
    <div class="summary-item">
      <div class="summary-item-label">Total Despesas</div>
      <div class="summary-item-value text-red">${fmt(total)}</div>
      <div class="summary-item-sub">${allExp.length} registro(s)</div>
    </div>
    <div class="summary-item">
      <div class="summary-item-label">Categoria Mais Gasta</div>
      <div class="summary-item-value">${topCat ? topCat[0] : '—'}</div>
      <div class="summary-item-sub">${topCat ? fmt(topCat[1]) : ''}</div>
    </div>
    <div class="summary-item">
      <div class="summary-item-label">Gastos Fixos</div>
      <div class="summary-item-value text-yellow">${fmt(totalFixed)}</div>
      <div class="summary-item-sub">${DATA.fixedExpenses.length} item(s)</div>
    </div>
    <div class="summary-item">
      <div class="summary-item-label">Filtrado</div>
      <div class="summary-item-value text-accent">${fmt(totalFiltered)}</div>
      <div class="summary-item-sub">${filtered.length} registro(s)</div>
    </div>
  `;

  // Tabela
  const tbody = document.getElementById('saidas-tbody');

  if (!filtered.length) {
    tbody.innerHTML = `
      <tr><td colspan="7">
        <div class="empty">
          <div class="empty-icon">↓</div>
          <div class="empty-text">Nenhuma saída este mês</div>
        </div>
      </td></tr>`;
    return;
  }

  tbody.innerHTML = filtered
    .sort((a, b) => a.day - b.day)
    .map(e => `
      <tr>
        <td>${String(e.day).padStart(2, '0')}/${String(m + 1).padStart(2, '0')}</td>
        <td>${e.desc}${e.isFixed ? '<span class="badge badge-yellow" style="margin-left:4px">fixo</span>' : ''}</td>
        <td><span class="badge" style="background:${catColor(e.cat)}22;color:${catColor(e.cat)}">${e.cat}</span></td>
        <td>${e.payment}</td>
        <td>${e.installments > 1 ? `${e.installmentNum || 1}/${e.installments}` : '—'}</td>
        <td class="text-red">${fmt(e.value)}</td>
        <td style="display:flex;gap:6px;padding:9px 12px">
          ${!e.isFixed
            ? `<button class="icon-btn" onclick="editSaida('${e.id}')">✎</button>
               <button class="icon-btn" onclick="deleteSaida('${e.id}')">✕</button>`
            : '—'}
        </td>
      </tr>`)
    .join('');
}
