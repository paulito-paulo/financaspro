/* ============================================================
   CHARTS.JS — Gráficos do Dashboard (Chart.js)
   ============================================================ */

// ── Estado e configurações ────────────────────────────────────
const charts = {};

let currentTrendFilter = 'all';
let currentDailyFilter = 'expense';

/** Configuração padrão de aparência para todos os gráficos */
const chartDefaults = {
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: '#1e1e30',
      titleColor:      '#e8e8f0',
      bodyColor:       '#8888a8',
      borderColor:     'rgba(255,255,255,0.1)',
      borderWidth:     1,
      padding:         10,
      titleFont:       { family: 'DM Mono', size: 11 },
      bodyFont:        { family: 'DM Mono', size: 11 },
    },
  },
  animation: { duration: 600, easing: 'easeOutQuart' },
};

// ── Helpers ───────────────────────────────────────────────────

/** Destrói um gráfico existente para recriá-lo sem conflito */
function destroyChart(id) {
  if (charts[id]) { charts[id].destroy(); delete charts[id]; }
}

/** Exibe mensagem "Sem dados" dentro do canvas */
function drawEmptyChart(ctx, msg = 'Sem dados') {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle  = '#555570';
  ctx.font       = '11px DM Mono';
  ctx.textAlign  = 'center';
  ctx.fillText(msg, ctx.canvas.width / 2, ctx.canvas.height / 2);
}

// ── Filtros ───────────────────────────────────────────────────

/** Alterna filtro do gráfico de tendência anual */
function filterTrend(f, btn) {
  currentTrendFilter = f;
  document.querySelectorAll('#page-dashboard .charts-grid .chart-card:first-child .filter-btn')
    .forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTrendChart();
}

/** Alterna filtro do gráfico de barras diário */
function filterDailyChart(f, btn) {
  currentDailyFilter = f;
  document.querySelectorAll('#page-dashboard .charts-row2 .chart-card:first-child .filter-btn')
    .forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderDailyChart(f);
}

// ── Gráficos ──────────────────────────────────────────────────

/**
 * Gráfico de linha: tendência de entradas e saídas ao longo do ano.
 * Respeita o filtro currentTrendFilter ('all' | 'income' | 'expense').
 */
function renderTrendChart() {
  destroyChart('trend');
  const y        = DATA.currentYear;
  const incomes  = MONTHS_SHORT.map((_, i) => totalIncome(i, y));
  const expenses = MONTHS_SHORT.map((_, i) => totalExpense(i, y));

  const datasets = [];
  if (currentTrendFilter !== 'expense') {
    datasets.push({
      label:           'Entradas',
      data:            incomes,
      borderColor:     '#2dd4a0',
      backgroundColor: 'rgba(45,212,160,.08)',
      fill:            true,
      tension:         .4,
      pointRadius:     3,
      pointBackgroundColor: '#2dd4a0',
    });
  }
  if (currentTrendFilter !== 'income') {
    datasets.push({
      label:           'Saídas',
      data:            expenses,
      borderColor:     '#ff5f5f',
      backgroundColor: 'rgba(255,95,95,.08)',
      fill:            true,
      tension:         .4,
      pointRadius:     3,
      pointBackgroundColor: '#ff5f5f',
    });
  }

  const ctx = document.getElementById('trendChart').getContext('2d');
  charts['trend'] = new Chart(ctx, {
    type: 'line',
    data: { labels: MONTHS_SHORT, datasets },
    options: {
      ...chartDefaults,
      responsive: true,
      scales: {
        x: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#555570', font: { family: 'DM Mono', size: 9 } } },
        y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#555570', font: { family: 'DM Mono', size: 9 }, callback: v => 'R$' + v.toLocaleString('pt-BR') } },
      },
      plugins: {
        ...chartDefaults.plugins,
        legend: {
          display: datasets.length > 1,
          labels:  { color: '#8888a8', font: { family: 'DM Mono', size: 9 }, boxWidth: 10 },
        },
      },
    },
  });
}

/**
 * Gráfico de rosca: distribuição por forma de pagamento no mês atual.
 */
function renderPaymentChart() {
  destroyChart('payment');
  const m    = DATA.currentMonth;
  const y    = DATA.currentYear;
  const exps = getMonthExpenses(m, y);
  const pays = {};
  exps.forEach(e => { pays[e.payment] = (pays[e.payment] || 0) + Number(e.value); });

  const labels = Object.keys(pays);
  const vals   = Object.values(pays);
  const colors = ['#7c6fff', '#2dd4a0', '#ffd166', '#ff5f5f', '#4fc3f7'];
  const ctx    = document.getElementById('paymentChart').getContext('2d');

  if (!labels.length) { drawEmptyChart(ctx); return; }

  charts['payment'] = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data: vals, backgroundColor: colors.slice(0, labels.length), borderWidth: 0, hoverOffset: 4 }] },
    options: {
      ...chartDefaults,
      responsive: true,
      cutout: '65%',
      plugins: {
        ...chartDefaults.plugins,
        legend: { display: true, position: 'bottom', labels: { color: '#8888a8', font: { family: 'DM Mono', size: 9 }, boxWidth: 10, padding: 8 } },
      },
    },
  });
}

/**
 * Gráfico de rosca: distribuição por categoria de gasto no mês atual.
 */
function renderCategoryChart() {
  destroyChart('category');
  const m    = DATA.currentMonth;
  const y    = DATA.currentYear;
  const exps = getMonthExpenses(m, y);
  const cats = {};
  exps.forEach(e => { cats[e.cat] = (cats[e.cat] || 0) + Number(e.value); });

  const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const labels = sorted.map(s => s[0]);
  const vals   = sorted.map(s => s[1]);
  const colors = labels.map(l => catColor(l));
  const ctx    = document.getElementById('categoryChart').getContext('2d');

  if (!labels.length) { drawEmptyChart(ctx); return; }

  charts['category'] = new Chart(ctx, {
    type: 'doughnut',
    data: { labels, datasets: [{ data: vals, backgroundColor: colors, borderWidth: 0, hoverOffset: 4 }] },
    options: {
      ...chartDefaults,
      responsive: true,
      cutout: '65%',
      plugins: {
        ...chartDefaults.plugins,
        legend: { display: true, position: 'bottom', labels: { color: '#8888a8', font: { family: 'DM Mono', size: 9 }, boxWidth: 10, padding: 8 } },
      },
    },
  });
}

/**
 * Gráfico de barras: valores por dia do mês atual.
 * @param {string} type - 'expense' | 'income'
 */
function renderDailyChart(type) {
  destroyChart('daily');
  const m           = DATA.currentMonth;
  const y           = DATA.currentYear;
  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const labels      = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const data = labels.map(d => {
    const list = type === 'expense' ? getMonthExpenses(m, y) : getMonthIncomes(m, y);
    return list.filter(e => e.day === d).reduce((s, e) => s + Number(e.value), 0);
  });

  const color = type === 'expense' ? '#ff5f5f' : '#2dd4a0';
  const ctx   = document.getElementById('dailyChart').getContext('2d');

  charts['daily'] = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{ data, backgroundColor: color + '44', borderColor: color, borderWidth: 1, borderRadius: 3 }],
    },
    options: {
      ...chartDefaults,
      responsive: true,
      scales: {
        x: { grid: { display: false }, ticks: { color: '#555570', font: { family: 'DM Mono', size: 8 }, maxTicksLimit: 15 } },
        y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#555570', font: { family: 'DM Mono', size: 9 }, callback: v => v > 0 ? 'R$' + v.toLocaleString('pt-BR') : v } },
      },
    },
  });
}

// ── Dashboard completo ────────────────────────────────────────

/** Atualiza KPIs e re-renderiza todos os gráficos do dashboard */
function renderDashboard() {
  const m   = DATA.currentMonth;
  const y   = DATA.currentYear;
  const inc = totalIncome(m, y);
  const exp = totalExpense(m, y);
  const bal = inc - exp;

  // KPIs
  const saldoEl = document.getElementById('kpi-saldo-val');
  saldoEl.textContent  = fmt(bal);
  saldoEl.style.color  = bal >= 0 ? 'var(--green)' : 'var(--red)';
  document.getElementById('kpi-income-val').textContent  = fmt(inc);
  document.getElementById('kpi-expense-val').textContent = fmt(exp);
  document.getElementById('kpi-saved-val').textContent   = fmt(bal > 0 ? bal : 0);

  // Saúde financeira
  if (inc > 0) {
    const ratio = (exp / inc) * 100;
    const healthMap = [
      { limit: 50, label: 'Excelente', color: 'var(--green)'  },
      { limit: 70, label: 'Boa',       color: 'var(--blue)'   },
      { limit: 90, label: 'Atenção',   color: 'var(--yellow)' },
      { limit: Infinity, label: 'Crítica', color: 'var(--red)' },
    ];
    const { label, color } = healthMap.find(h => ratio <= h.limit);
    document.getElementById('kpi-health-val').textContent  = label;
    document.getElementById('kpi-health-val').style.color  = color;
    document.getElementById('kpi-health-sub').textContent  = `${ratio.toFixed(0)}% da renda gasto`;
  } else {
    document.getElementById('kpi-health-val').textContent  = '—';
    document.getElementById('kpi-health-sub').textContent  = 'sem dados';
  }

  // Gráficos
  renderTrendChart();
  renderPaymentChart();
  renderCategoryChart();
  renderDailyChart(currentDailyFilter);
  renderDashGoals();
}

/** Renderiza o mini-painel de metas no dashboard */
function renderDashGoals() {
  const list = document.getElementById('dashGoalsList');

  if (!DATA.goals.length) {
    list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--text3);font-size:10px">Nenhuma meta criada</div>';
    return;
  }

  list.innerHTML = DATA.goals.slice(0, 4).map(g => {
    const pct = Math.min(100, g.target > 0 ? (g.current / g.target) * 100 : 0);
    return `
      <div style="padding:8px 0;border-bottom:1px solid var(--border)">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span style="font-size:10px;color:var(--text)">${g.name}</span>
          <span style="font-size:9px;color:var(--text3)">${pct.toFixed(0)}%</span>
        </div>
        <div style="height:4px;background:var(--bg3);border-radius:2px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:var(--accent);border-radius:2px;transition:width .8s"></div>
        </div>
      </div>`;
  }).join('');
}
