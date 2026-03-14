/* ============================================================
   DB.JS — Supabase, Autenticação, Sessão, Sincronização
   ============================================================ */

// ── Configuração Supabase ─────────────────────────────────────
const SUPA_URL   = 'https://zwpjcvfrpraicgeakkak.supabase.co';
const SUPA_KEY   = 'sb_publishable_Bb8_M9ULTkXOmt3mTtuRKQ_n05u6DbM';
const SESSION_KEY = 'financaspro_session_v3';

/**
 * Requisição genérica para a API REST do Supabase.
 * @param {string} path   - Caminho da tabela/filtro (ex: "users?id=eq.123")
 * @param {string} method - GET | POST | PATCH | DELETE
 * @param {object} body   - Dados a enviar (para POST/PATCH)
 */
async function sbFetch(path, method = 'GET', body = null) {
  const opts = {
    method,
    headers: {
      'apikey':       SUPA_KEY,
      'Authorization': 'Bearer ' + SUPA_KEY,
      'Content-Type': 'application/json',
      'Prefer':       method === 'POST' ? 'return=representation' : '',
    },
  };
  if (body) opts.body = JSON.stringify(body);

  const res  = await fetch(SUPA_URL + '/rest/v1/' + path, opts);
  if (!res.ok) throw new Error(await res.text());

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

// ── Globais ───────────────────────────────────────────────────
let CURRENT_USER = null;  // { id, username, name, color }
let DATA         = null;  // dados financeiros do usuário logado
let _saveTimer   = null;  // debounce do saveData

/** Retorna a inicial maiúscula de um nome */
function getInitial(name) {
  return (name || 'U').charAt(0).toUpperCase();
}

/** Hash simples para senha (local — senhas nunca são enviadas em plain text) */
function hashPass(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = (Math.imul(h, 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

// ── Login / Registro ──────────────────────────────────────────

/** Alterna entre as abas "Entrar" e "Criar Conta" */
function switchLoginTab(tab) {
  document.getElementById('tabLogin').classList.toggle('active', tab === 'login');
  document.getElementById('tabRegister').classList.toggle('active', tab === 'register');
  document.getElementById('loginPanel').style.display    = tab === 'login'    ? 'block' : 'none';
  document.getElementById('registerPanel').style.display = tab === 'register' ? 'block' : 'none';
}

/** Indicador visual de força de senha */
function updatePwStrength(val) {
  const fill = document.getElementById('pwStrengthFill');
  const len  = val.length;
  let pct = 0, color = 'var(--red)';
  if (len >= 4)  { pct = 33; color = 'var(--red)';    }
  if (len >= 7)  { pct = 66; color = 'var(--yellow)'; }
  if (len >= 10) { pct = 100; color = 'var(--green)'; }
  fill.style.width      = pct + '%';
  fill.style.background = color;
}

/** Renderiza os chips de usuários conhecidos (cache local) */
async function renderUsersList() {
  const list    = document.getElementById('usersList');
  const divider = document.getElementById('loginDivider');
  const cached  = JSON.parse(localStorage.getItem('fp_known_users') || '[]');

  if (!cached.length) {
    list.innerHTML = '';
    divider.style.display = 'none';
    return;
  }

  divider.style.display = 'block';
  list.innerHTML = cached.map(u => `
    <div class="user-chip" onclick="quickLogin('${u.username}')">
      <div class="user-avatar" style="background:${u.color};color:#fff">${getInitial(u.name)}</div>
      <div class="user-info">
        <div class="user-name">${u.name}</div>
        <div class="user-sub">@${u.username}</div>
      </div>
    </div>`).join('');
}

/** Preenche o campo de usuário para login rápido por chip */
function quickLogin(uname) {
  document.getElementById('loginUser').value = uname;
  document.getElementById('loginPass').focus();
}

/** Executa o login verificando usuário e senha no Supabase */
async function doLogin() {
  const uname = document.getElementById('loginUser').value.trim().toLowerCase();
  const pass  = document.getElementById('loginPass').value;
  if (!uname || !pass) return toast('Preencha usuário e senha', 'warning');

  setLoginLoading(true);
  try {
    const rows = await sbFetch(`users?username=eq.${encodeURIComponent(uname)}&select=*`);
    if (!rows || !rows.length) return toast('Usuário não encontrado', 'error');

    const u = rows[0];
    if (u.pass_hash !== hashPass(pass)) return toast('Senha incorreta', 'error');

    await loginAs(u);
  } catch (e) {
    toast('Erro de conexão com o banco de dados', 'error');
    console.error(e);
  } finally {
    setLoginLoading(false);
  }
}

/** Cria nova conta no Supabase e faz login automaticamente */
async function doRegister() {
  const name  = document.getElementById('regName').value.trim();
  const uname = document.getElementById('regUser').value.trim().toLowerCase();
  const pass  = document.getElementById('regPass').value;
  const color = document.getElementById('regColor').value;

  if (!name || !uname || !pass) return toast('Preencha todos os campos', 'warning');
  if (pass.length < 4)          return toast('Senha muito curta (mín. 4 caracteres)', 'warning');
  if (!/^[a-z0-9_]+$/.test(uname)) return toast('Usuário: apenas letras, números e _', 'warning');

  setLoginLoading(true);
  try {
    const existing = await sbFetch(`users?username=eq.${encodeURIComponent(uname)}&select=id`);
    if (existing && existing.length) return toast('Usuário já existe', 'error');

    const [newUser] = await sbFetch('users', 'POST', {
      username:  uname,
      name,
      pass_hash: hashPass(pass),
      color,
    });
    await sbFetch('user_data', 'POST', { user_id: newUser.id, data: getDefaultData() });

    toast('Conta criada! Entrando...', 'success');
    await loginAs(newUser);
  } catch (e) {
    toast('Erro ao criar conta. Verifique a conexão.', 'error');
    console.error(e);
  } finally {
    setLoginLoading(false);
  }
}

/** Carrega dados do usuário do Supabase e entra na plataforma */
async function loginAs(u) {
  CURRENT_USER = u;

  try {
    const rows = await sbFetch(`user_data?user_id=eq.${u.id}&select=data`);
    DATA = (rows && rows.length && rows[0].data) ? rows[0].data : getDefaultData();
  } catch (e) {
    DATA = getDefaultData();
  }

  // Garante que todos os campos existem (migração de versões antigas)
  DATA.incomes       = DATA.incomes       || [];
  DATA.expenses      = DATA.expenses      || [];
  DATA.fixedExpenses = DATA.fixedExpenses || [];
  DATA.goals         = DATA.goals         || [];
  DATA.notes         = DATA.notes         || [];
  DATA.rules         = DATA.rules         || getDefaultData().rules;
  if (DATA.currentMonth === undefined) DATA.currentMonth = new Date().getMonth();
  if (DATA.currentYear  === undefined) DATA.currentYear  = new Date().getFullYear();

  // Salva sessão e lista de usuários conhecidos localmente
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    id: u.id, username: u.username, name: u.name, color: u.color,
  }));
  const known = JSON.parse(localStorage.getItem('fp_known_users') || '[]');
  if (!known.find(k => k.username === u.username)) {
    known.push({ username: u.username, name: u.name, color: u.color });
    localStorage.setItem('fp_known_users', JSON.stringify(known));
  }

  document.getElementById('loginScreen').classList.add('hidden');
  updateUserUI();
  updateMonthUI();
  renderDashboard();
  toast(`Bem-vindo, ${u.name.split(' ')[0]}! ☁ Dados sincronizados`, 'success');
}

/** Desloga o usuário e volta para a tela de login */
async function doLogout() {
  CURRENT_USER = null;
  DATA         = null;
  localStorage.removeItem(SESSION_KEY);
  closeUserPanel();
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('loginUser').value = '';
  document.getElementById('loginPass').value = '';
  await renderUsersList();
  toast('Até logo!', 'success');
}

/** Ativa/desativa estado de carregamento nos botões de login */
function setLoginLoading(on) {
  document.querySelectorAll('.btn-login').forEach(b => {
    b.disabled     = on;
    b.textContent  = on ? 'Aguarde...' : (b.dataset.label || b.textContent);
  });
}

// ── UI do usuário logado ──────────────────────────────────────

/** Atualiza avatar, nome e usuário na topbar e no painel */
function updateUserUI() {
  if (!CURRENT_USER) return;
  const initial = getInitial(CURRENT_USER.name);

  document.getElementById('topbarAvatar').textContent     = initial;
  document.getElementById('topbarAvatar').style.background = CURRENT_USER.color;
  document.getElementById('topbarUsername').textContent   = CURRENT_USER.name.split(' ')[0];

  document.getElementById('upAvatar').textContent     = initial;
  document.getElementById('upAvatar').style.background = CURRENT_USER.color;
  document.getElementById('upAvatar').style.color     = '#fff';
  document.getElementById('upName').textContent       = CURRENT_USER.name;
  document.getElementById('upUser').textContent       = '@' + CURRENT_USER.username;
}

function toggleUserPanel() { document.getElementById('userPanel').classList.toggle('open'); }
function closeUserPanel()   { document.getElementById('userPanel').classList.remove('open'); }

// Fecha o painel ao clicar fora dele
document.addEventListener('click', e => {
  const panel = document.getElementById('userPanel');
  const btn   = document.getElementById('topbarUserBtn');
  if (panel && !panel.contains(e.target) && btn && !btn.contains(e.target)) closeUserPanel();
});

// ── Salvar dados (debounced) ──────────────────────────────────

/**
 * Salva DATA no Supabase com debounce de 800ms.
 * Exibe indicador de sincronização na topbar.
 */
function saveData() {
  if (!CURRENT_USER || !DATA) return;
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(async () => {
    setSyncStatus('syncing');
    try {
      await sbFetch(
        `user_data?user_id=eq.${CURRENT_USER.id}`,
        'PATCH',
        { data: DATA, updated_at: new Date().toISOString() }
      );
      setSyncStatus('ok');
    } catch (e) {
      setSyncStatus('error');
      console.error('Supabase save error:', e);
    }
  }, 800);
}

/** Atualiza o indicador de status de sincronização */
function setSyncStatus(status) {
  const el  = document.getElementById('syncStatus');
  if (!el) return;
  const map = {
    syncing: ['↻ Salvando...', 'var(--text3)'],
    ok:      ['☁ Salvo',       'var(--green)'],
    error:   ['⚠ Erro ao salvar', 'var(--red)'],
  };
  const [txt, color] = map[status] || ['', ''];
  el.textContent  = txt;
  el.style.color  = color;
}

// ── Export / Import ───────────────────────────────────────────

/** Exporta todos os dados do usuário como JSON */
function exportJSON() {
  if (!DATA) return;
  const payload = {
    user:       CURRENT_USER.username,
    name:       CURRENT_USER.name,
    exportedAt: new Date().toISOString(),
    data:       DATA,
  };
  downloadFile(
    new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }),
    `financaspro_${CURRENT_USER.username}_${new Date().toISOString().slice(0, 10)}.json`
  );
  toast('JSON exportado com sucesso!');
}

/** Exporta entradas e saídas como CSV (compatível com Excel) */
function exportCSV() {
  if (!DATA) return;
  const rows = [['Tipo', 'Dia', 'Mês', 'Ano', 'Descrição', 'Categoria', 'Valor', 'Pagamento', 'Parcelas']];
  DATA.incomes.forEach(i  => rows.push(['Entrada', i.day, i.month + 1, i.year, i.desc, i.cat, i.value, '',         1]));
  DATA.expenses.forEach(e => rows.push(['Saída',   e.day, e.month + 1, e.year, e.desc, e.cat, e.value, e.payment, e.installments || 1]));

  const csv  = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  downloadFile(
    new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' }),
    `financaspro_${CURRENT_USER.username}_${new Date().toISOString().slice(0, 10)}.csv`
  );
  toast('CSV exportado com sucesso!');
}

/** Cria link de download e dispara o clique */
function downloadFile(blob, filename) {
  const a   = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

// Importação
let _importData = null;

function handleFileDrop(e) {
  e.preventDefault();
  document.getElementById('importDrop').classList.remove('over');
  if (e.dataTransfer.files[0]) readImportFile(e.dataTransfer.files[0]);
}

function handleFileImport(input) {
  if (input.files[0]) readImportFile(input.files[0]);
}

function readImportFile(file) {
  if (!file.name.endsWith('.json')) return toast('Use um arquivo .json', 'error');
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const parsed  = JSON.parse(e.target.result);
      _importData   = parsed.data || parsed;
      const inc     = (_importData.incomes  || []).length;
      const exp     = (_importData.expenses || []).length;
      const goals   = (_importData.goals    || []).length;

      document.getElementById('importPreview').style.display = 'block';
      document.getElementById('importPreview').innerHTML =
        `<strong>Prévia:</strong><br>
         Entradas: ${inc} registro(s)<br>
         Saídas: ${exp} registro(s)<br>
         Metas: ${goals} meta(s)<br>
         <span style="color:var(--yellow)">⚠ Substituirá dados atuais na nuvem</span>`;
      document.getElementById('importConfirmBtn').style.display = 'block';
    } catch (err) {
      toast('Arquivo inválido ou corrompido', 'error');
    }
  };
  reader.readAsText(file);
}

async function confirmImport() {
  if (!_importData) return;
  DATA        = { ...getDefaultData(), ..._importData };
  _importData = null;
  saveData();
  document.getElementById('importPreview').style.display    = 'none';
  document.getElementById('importConfirmBtn').style.display = 'none';
  document.getElementById('importFile').value               = '';
  closeModal('modalExportImport');
  updateMonthUI();
  renderDashboard();
  toast('Dados importados e salvos na nuvem!');
}
