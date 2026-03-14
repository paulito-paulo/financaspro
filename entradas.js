/* ============================================================
   COMPONENTS.CSS — KPIs, Gráficos, Metas, Regras, Lembretes
   ============================================================ */

/* ── KPI Grid ────────────────────────────────────────────────── */
.kpi-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 20px; }

.kpi {
  background:    var(--bg2);
  border:        1px solid var(--border);
  border-radius: var(--card-r);
  padding:       16px;
  position:      relative;
  overflow:      hidden;
  cursor:        default;
  transition:    all .2s;
}
.kpi::before         { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px; }
.kpi.income::before  { background: var(--green);  }
.kpi.expense::before { background: var(--red);    }
.kpi.balance::before { background: var(--accent); }
.kpi.saved::before   { background: var(--yellow); }
.kpi.health::before  { background: var(--blue);   }
.kpi:hover           { transform: translateY(-2px); border-color: var(--border2); }

.kpi-label { font-size: 9px; color: var(--text3); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
.kpi-value { font-family: var(--sans); font-size: 20px; font-weight: 700; margin-bottom: 4px; line-height: 1; }
.kpi-sub   { font-size: 10px; color: var(--text2); }
.kpi-icon  { position: absolute; bottom: 12px; right: 14px; font-size: 20px; opacity: .15; }

/* ── Charts ──────────────────────────────────────────────────── */
.charts-grid  { display: grid; grid-template-columns: 2fr 1fr 1fr; gap: 12px; margin-bottom: 20px; }
.charts-row2  { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }

.chart-card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--card-r); padding: 16px; }
.chart-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.chart-title  { font-family: var(--sans); font-size: 11px; font-weight: 600; color: var(--text); }
.chart-sub    { font-size: 9px; color: var(--text3); margin-top: 2px; }
.chart-wrap   { position: relative; }

.chart-filters { display: flex; gap: 6px; flex-wrap: wrap; }
.filter-btn {
  padding:       3px 8px;
  border-radius: 6px;
  border:        1px solid var(--border2);
  background:    none;
  color:         var(--text3);
  font-family:   var(--mono);
  font-size:     9px;
  cursor:        pointer;
  transition:    all .2s;
}
.filter-btn.active,
.filter-btn:hover { border-color: var(--accent); color: var(--accent); background: rgba(124,111,255,.1); }

/* ── Health bar ──────────────────────────────────────────────── */
.health-bar-wrap { margin-top: 8px; }
.health-bar      { height: 8px; background: var(--bg3); border-radius: 4px; overflow: hidden; margin-bottom: 6px; }
.health-fill     { height: 100%; border-radius: 4px; transition: width .8s cubic-bezier(.4,0,.2,1); }
.health-labels   { display: flex; justify-content: space-between; font-size: 9px; color: var(--text3); }

/* ── Installment preview ─────────────────────────────────────── */
.installment-preview {
  background:    var(--bg3);
  border-radius: 8px;
  padding:       12px;
  margin-top:    10px;
  font-size:     10px;
  color:         var(--text2);
  line-height:   1.8;
}
.installment-preview strong { color: var(--text); }

/* ── Metas ───────────────────────────────────────────────────── */
.goals-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 12px; }

.goal-card { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--card-r); padding: 18px; transition: all .2s; }
.goal-card:hover { border-color: var(--border2); transform: translateY(-2px); }

.goal-header   { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 12px; }
.goal-name     { font-family: var(--sans); font-size: 12px; font-weight: 600; }
.goal-deadline { font-size: 9px; color: var(--text3); margin-top: 2px; }
.goal-actions  { display: flex; gap: 6px; }

.goal-progress { margin-bottom: 10px; }
.goal-bar      { height: 6px; background: var(--bg3); border-radius: 3px; overflow: hidden; margin: 6px 0; }
.goal-fill     { height: 100%; border-radius: 3px; background: var(--accent); transition: width .8s cubic-bezier(.4,0,.2,1); }
.goal-amounts  { display: flex; justify-content: space-between; font-size: 10px; }
.goal-current  { color: var(--green); font-weight: 500; }
.goal-target   { color: var(--text3); }

.goal-history   { margin-top: 12px; border-top: 1px solid var(--border); padding-top: 10px; }
.goal-hist-title { font-size: 9px; color: var(--text3); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; }
.goal-hist-item  { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; font-size: 10px; color: var(--text2); }
.goal-hist-date  { color: var(--text3); }

/* ── Regras de Gasto ─────────────────────────────────────────── */
.budget-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.budget-rule { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--card-r); padding: 18px; }
.budget-rule-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.budget-rule-name   { font-family: var(--sans); font-size: 12px; font-weight: 600; }
.budget-pct         { font-family: var(--sans); font-size: 20px; font-weight: 700; }

.budget-bar   { height: 6px; background: var(--bg3); border-radius: 3px; overflow: hidden; margin: 10px 0; }
.budget-fill  { height: 100%; border-radius: 3px; transition: width .8s; }
.budget-stats { display: flex; justify-content: space-between; font-size: 10px; color: var(--text2); }

.budget-alert         { margin-top: 8px; padding: 6px 10px; border-radius: 6px; font-size: 10px; }
.budget-alert.warning { background: rgba(255,209,102,.1); color: var(--yellow); border: 1px solid rgba(255,209,102,.2); }
.budget-alert.danger  { background: rgba(255,95,95,.1);   color: var(--red);    border: 1px solid rgba(255,95,95,.2);   }
.budget-alert.ok      { background: rgba(45,212,160,.1);  color: var(--green);  border: 1px solid rgba(45,212,160,.2);  }

.budget-suggest { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--card-r); padding: 18px; margin-top: 12px; }
.suggest-item   { display: flex; align-items: center; gap: 10px; padding: 8px 0; border-bottom: 1px solid var(--border); font-size: 11px; }
.suggest-item:last-child { border-bottom: none; }
.suggest-dot    { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }

/* ── Lembretes / Notepad ─────────────────────────────────────── */
.notepad   { background: var(--bg2); border: 1px solid var(--border); border-radius: var(--card-r); padding: 20px; }
.note-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 16px; }
.note-item {
  background:    var(--bg3);
  border:        1px solid var(--border);
  border-radius: 8px;
  padding:       12px;
  display:       flex;
  align-items:   flex-start;
  gap:           10px;
  transition:    all .2s;
}
.note-item:hover { border-color: var(--border2); }
.note-text { flex: 1; font-size: 11px; color: var(--text2); line-height: 1.5; }
.note-date { font-size: 9px; color: var(--text3); margin-top: 4px; }
