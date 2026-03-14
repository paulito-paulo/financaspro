/* ============================================================
   DATA.JS — Estrutura de dados, helpers e formatadores
   ============================================================ */

// ── Constantes de tempo ───────────────────────────────────────
const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];
const MONTHS_SHORT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

// ── Estrutura padrão de dados ─────────────────────────────────

/**
 * Retorna um objeto de dados zerado para um novo usuário.
 * Sempre que adicionar um campo novo, inclua aqui também.
 */
function getDefaultData() {
  return {
    currentMonth:  new Date().getMonth(),
    currentYear:   new Date().getFullYear(),
    incomes:       [],
    expenses:      [],
    fixedExpenses: [],
    goals:         [],
    notes:         [],
    rules: [
      { id: 'vida',      name: 'Vida',      desc: 'Moradia, alimentação, transporte', pct: 50, color: '#4fc3f7', emoji: '🏠' },
      { id: 'objetivos', name: 'Objetivos', desc: 'Lazer, cultura, compras',          pct: 30, color: '#ffd166', emoji: '🎯' },
      { id: 'reserva',   name: 'Reserva',   desc: 'Poupança e investimentos',         pct: 20, color: '#2dd4a0', emoji: '💰' },
    ],
  };
}

// ── Formatadores ──────────────────────────────────────────────

/** Formata número como moeda brasileira — ex: R$ 1.234,56 */
function fmt(n) {
  return 'R$ ' + Number(n || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Gera ID único baseado em timestamp + random */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ── Queries de dados ──────────────────────────────────────────

/** Retorna as entradas de um mês/ano */
function getMonthIncomes(m, y) {
  return DATA.incomes.filter(i => i.month === m && i.year === y);
}

/**
 * Retorna as saídas de um mês/ano.
 * Inclui os gastos fixos (que se repetem em todos os meses).
 */
function getMonthExpenses(m, y) {
  const regular = DATA.expenses.filter(i => i.month === m && i.year === y);
  const fixed   = DATA.fixedExpenses.map(f => ({ ...f, isFixed: true, month: m, year: y }));
  return [...regular, ...fixed];
}

/** Soma todas as entradas de um mês/ano */
function totalIncome(m, y) {
  return getMonthIncomes(m, y).reduce((sum, i) => sum + Number(i.value), 0);
}

/** Soma todas as saídas de um mês/ano */
function totalExpense(m, y) {
  return getMonthExpenses(m, y).reduce((sum, e) => sum + Number(e.value), 0);
}

// ── Cores de categoria ────────────────────────────────────────

/** Mapeia nome de categoria para sua cor definida no design */
function catColor(cat) {
  const map = {
    'Alimentação': '#ff9a5c',
    'Transporte':  '#4fc3f7',
    'Moradia':     '#7c6fff',
    'Saúde':       '#2dd4a0',
    'Educação':    '#ffd166',
    'Lazer':       '#ff5f5f',
    'Vestuário':   '#e879f9',
    'Tecnologia':  '#38bdf8',
    'Serviços':    '#fb923c',
    'Outro':       '#888888',
  };
  return map[cat] || '#888888';
}
