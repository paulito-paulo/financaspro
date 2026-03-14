/* ============================================================
   LAYOUT.CSS — Sidebar, Topbar, Main, Pages, Responsivo
   ============================================================ */

/* ── App wrapper ─────────────────────────────────────────────── */
.app { display: flex; min-height: 100vh; }

/* ── Sidebar ─────────────────────────────────────────────────── */
.sidebar {
  width:      220px;
  background: var(--bg2);
  border-right: 1px solid var(--border);
  display:    flex;
  flex-direction: column;
  position:   fixed;
  top:        0;
  left:       0;
  height:     100vh;
  z-index:    100;
  transition: transform .3s ease;
}

/* Logo */
.logo {
  padding:       20px 18px 16px;
  display:       flex;
  align-items:   center;
  gap:           10px;
  border-bottom: 1px solid var(--border);
}
.logo-icon {
  width:           30px;
  height:          30px;
  background:      var(--accent);
  border-radius:   8px;
  display:         flex;
  align-items:     center;
  justify-content: center;
  font-size:       14px;
}
.logo-text       { font-family: var(--sans); font-weight: 700; font-size: 14px; letter-spacing: .5px; }
.logo-text span  { color: var(--accent); }

/* Seletor de mês */
.month-selector { padding: 12px 18px; border-bottom: 1px solid var(--border); }
.month-label    { font-size: 9px; color: var(--text3); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
.month-nav {
  display:         flex;
  align-items:     center;
  justify-content: space-between;
  background:      var(--bg3);
  border-radius:   8px;
  padding:         6px 10px;
}
.month-nav button { background: none; border: none; color: var(--text2); cursor: pointer; font-size: 14px; line-height: 1; padding: 0; transition: color .2s; }
.month-nav button:hover { color: var(--accent); }
.month-nav span { font-family: var(--sans); font-size: 11px; font-weight: 600; color: var(--text); }

/* Navegação */
nav { flex: 1; overflow-y: auto; padding: 10px 0; }
.nav-section { padding: 6px 18px 4px; font-size: 9px; color: var(--text3); text-transform: uppercase; letter-spacing: 1px; }
.nav-item {
  display:      flex;
  align-items:  center;
  gap:          10px;
  padding:      9px 18px;
  cursor:       pointer;
  border-left:  2px solid transparent;
  transition:   all .2s;
  color:        var(--text2);
  font-size:    11px;
}
.nav-item:hover  { background: var(--bg3); color: var(--text); border-left-color: var(--border2); }
.nav-item.active { background: linear-gradient(90deg, rgba(124,111,255,.12), transparent); color: var(--text); border-left-color: var(--accent); }
.nav-item .icon  { width: 16px; text-align: center; font-size: 13px; }
.nav-badge       { margin-left: auto; background: var(--accent); color: #fff; border-radius: 10px; padding: 1px 6px; font-size: 9px; }

/* Rodapé sidebar */
.sidebar-footer { padding: 12px 18px; border-top: 1px solid var(--border); }
.year-display   { font-size: 9px; color: var(--text3); text-transform: uppercase; letter-spacing: 1px; }
.year-val       { font-family: var(--sans); font-size: 16px; font-weight: 700; color: var(--text); }

/* Overlay mobile */
.sidebar-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 99; }
.sidebar-overlay.open { display: block; }

/* ── Main ────────────────────────────────────────────────────── */
.main { margin-left: 220px; flex: 1; min-height: 100vh; display: flex; flex-direction: column; }

/* ── Topbar ──────────────────────────────────────────────────── */
.topbar {
  height:      56px;
  background:  var(--bg2);
  border-bottom: 1px solid var(--border);
  display:     flex;
  align-items: center;
  padding:     0 24px;
  gap:         16px;
  position:    sticky;
  top:         0;
  z-index:     90;
}
.page-title   { font-family: var(--sans); font-size: 15px; font-weight: 700; flex: 1; }
.topbar-right { display: flex; align-items: center; gap: 8px; }
.hamburger    { display: none; background: none; border: none; color: var(--text); cursor: pointer; font-size: 20px; }

/* ── Content ─────────────────────────────────────────────────── */
.content { padding: 24px; flex: 1; }

/* ── Pages ───────────────────────────────────────────────────── */
.page        { display: none; animation: fadeIn .3s ease; }
.page.active { display: block; }

/* ── Section headers ─────────────────────────────────────────── */
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.section-title  { font-family: var(--sans); font-size: 13px; font-weight: 600; }
.section-sub    { font-size: 10px; color: var(--text2); margin-top: 2px; }

/* ── Summary row ─────────────────────────────────────────────── */
.summary-row        { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.summary-item       { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--card-r); padding: 14px 18px; flex: 1; min-width: 140px; }
.summary-item-label { font-size: 9px; color: var(--text3); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
.summary-item-value { font-family: var(--sans); font-size: 16px; font-weight: 700; }
.summary-item-sub   { font-size: 9px; color: var(--text2); margin-top: 2px; }

/* ── Responsivo ──────────────────────────────────────────────── */
@media (max-width: 1200px) {
  .kpi-grid { grid-template-columns: repeat(3, 1fr); }
  .charts-grid { grid-template-columns: 1fr 1fr; }
  .charts-grid .chart-card:first-child { grid-column: 1 / -1; }
}

@media (max-width: 900px) {
  .sidebar           { transform: translateX(-100%); }
  .sidebar.open      { transform: translateX(0); }
  .main              { margin-left: 0; }
  .hamburger         { display: flex; }
  .charts-grid       { grid-template-columns: 1fr; }
  .charts-row2       { grid-template-columns: 1fr; }
  .budget-grid       { grid-template-columns: 1fr; }
  .kpi-grid          { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 600px) {
  .content    { padding: 14px; }
  .kpi-grid   { grid-template-columns: 1fr 1fr; }
  .kpi-value  { font-size: 16px; }
  .form-row   { grid-template-columns: 1fr; }
}
