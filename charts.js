/* ============================================================
   APP.JS — Navegação, Modais, Toast, Mês, Init
   ============================================================ */

// ── Toast ─────────────────────────────────────────────────────

/**
 * Exibe uma notificação temporária.
 * @param {string} msg  - Mensagem a exibir
 * @param {string} type - 'success' | 'error' | 'warning'
 */
function toast(msg, type = 'success') {
  const tc   = document.getElementById('toastContainer');
  const t    = document.createElement('div');
  const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : '!';

  t.className = `toast ${type}`;
  t.innerHTML = `<span>${icon}</span>${msg}`;
  tc.appendChild(t);

  setTimeout(() => t.classList.add('show'), 10);
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 400);
  }, 3000);
}

// ── Navegação entre páginas ───────────────────────────────────
const PAGE_TITLES = {
  dashboard: 'Dashboard',
  entradas:  'Entradas',
  saidas:    'Saídas',
  metas:     'Metas',
  regras:    'Regras de Gasto',
  lembretes: 'Lembretes',
};

/**
 * Ativa a página indicada e renderiza seu conteúdo.
 * @param {string}  page - ID da página (sem prefixo 'page-')
 * @param {Element} el   - Elemento nav-item clicado
 */
function showPage(page, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');
  if (el) el.classList.add('active');

  document.getElementById('pageTitle').textContent = PAGE_TITLES[page] || page;
  closeSidebar();
  renderPage(page);
}

/** Despacha renderização para o módulo correto */
function renderPage(page) {
  const m  = DATA.currentMonth;
  const y  = DATA.currentYear;
  const ml = `${MONTHS[m]} ${y}`;

  if (page === 'dashboard') {
    renderDashboard();
  } else if (page === 'entradas') {
    document.getElementById('entradas-month-label').textContent = ml;
    renderEntradas();
  } else if (page === 'saidas') {
    document.getElementById('saidas-month-label').textContent = ml;
    renderSaidas();
  } else if (page === 'metas') {
    renderMetas();
  } else if (page === 'regras') {
    renderRules();
  } else if (page === 'lembretes') {
    renderNotes();
  }
}

// ── Sidebar mobile ────────────────────────────────────────────
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('open');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('open');
}

// ── Navegação de mês ──────────────────────────────────────────

/** Avança (+1) ou recua (-1) um mês e re-renderiza a página atual */
function changeMonth(delta) {
  DATA.currentMonth += delta;
  if (DATA.currentMonth > 11) { DATA.currentMonth = 0;  DATA.currentYear++; }
  if (DATA.currentMonth < 0)  { DATA.currentMonth = 11; DATA.currentYear--; }

  saveData();
  updateMonthUI();

  const activeNav = document.querySelector('.nav-item.active');
  const page = activeNav?.getAttribute('onclick')?.match(/'(\w+)'/)?.[1];
  if (page) renderPage(page);
}

/** Atualiza todos os textos de mês/ano visíveis na interface */
function updateMonthUI() {
  const m = DATA.currentMonth;
  const y = DATA.currentYear;

  document.getElementById('currentMonthLabel').textContent = `${MONTHS_SHORT[m]} ${y}`;
  document.getElementById('topbarMonth').textContent       = `${MONTHS[m]} ${y}`;
  document.getElementById('sidebarYear').textContent       = y;

  const dashLabel = document.getElementById('dash-month-label');
  if (dashLabel) dashLabel.textContent = `${MONTHS[m]} ${y}`;
}

// ── Modais ────────────────────────────────────────────────────

/** Abre o modal indicado e preenche valores padrão */
function openModal(id) {
  document.getElementById(id).classList.add('open');

  const today = new Date();
  const d = today.getDate();

  if (id === 'modalEntrada') {
    if (!document.getElementById('editEntradaId').value) {
      document.getElementById('entradaDia').value = d;
    }
  }

  if (id === 'modalSaida') {
    if (!document.getElementById('editSaidaId').value) {
      document.getElementById('saidaDia').value = d;
    }
    updateInstallmentPreview();
  }

  if (id === 'modalAddGoal') {
    document.getElementById('addGoalData').value = today.toISOString().slice(0, 10);
  }
}

/** Fecha o modal e limpa os campos do formulário */
function closeModal(id) {
  const modal = document.getElementById(id);
  modal.classList.remove('open');
  modal.querySelectorAll('input[type=text], input[type=number], textarea').forEach(i => (i.value = ''));
  modal.querySelectorAll('input[type=hidden]').forEach(i => (i.value = ''));

  const pp = document.getElementById('installmentPreview');
  if (pp) pp.style.display = 'none';
}

// Fecha o modal ao clicar no overlay
document.querySelectorAll('.modal-overlay').forEach(overlay => {
  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeModal(overlay.id);
  });
});

// Fecha modais e painel ao pressionar Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => closeModal(m.id));
    closeUserPanel();
  }
});

// ── Init ──────────────────────────────────────────────────────

/** Ponto de entrada da aplicação */
async function init() {
  await renderUsersList();

  // Tenta restaurar sessão anterior
  const saved = localStorage.getItem(SESSION_KEY);
  if (saved) {
    try {
      const u    = JSON.parse(saved);
      const rows = await sbFetch(`users?id=eq.${u.id}&select=*`);
      if (rows && rows.length) {
        await loginAs(rows[0]);
        return;
      }
    } catch (e) {
      console.warn('Falha ao restaurar sessão:', e);
    }
    localStorage.removeItem(SESSION_KEY);
  }
}

init();
