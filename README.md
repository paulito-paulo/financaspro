# FinançasPro

Plataforma de controle financeiro pessoal com suporte a múltiplos usuários e sincronização na nuvem via Supabase.

---

## Estrutura de arquivos

```
financaspro/
├── index.html          ← HTML da aplicação (estrutura + modais)
├── README.md
│
├── css/
│   ├── base.css        ← Variáveis CSS, reset, botões, formulários, utilitários
│   ├── layout.css      ← Sidebar, topbar, main, responsivo
│   ├── components.css  ← KPIs, gráficos, metas, regras, lembretes
│   └── modals.css      ← Modais, login, user panel, toast
│
└── js/
    ├── data.js         ← Estrutura padrão de dados, helpers, formatadores
    ├── db.js           ← Supabase, autenticação, sessão, save/sync, export/import
    ├── charts.js       ← Todos os gráficos do dashboard (Chart.js)
    ├── entradas.js     ← CRUD e renderização de entradas
    ├── saidas.js       ← CRUD, parcelas, gastos fixos e renderização de saídas
    ├── pages.js        ← Metas, Regras de Gasto e Lembretes
    └── app.js          ← Navegação, modais, toast, mês, init
```

---

## Banco de dados — Supabase

### Configuração (db.js)
```js
const SUPA_URL = 'https://SEU_PROJETO.supabase.co';
const SUPA_KEY = 'sua_chave_anon_publica';
```

### Tabelas necessárias (SQL Editor do Supabase)
```sql
create table if not exists users (
  id         uuid primary key default gen_random_uuid(),
  username   text unique not null,
  name       text not null,
  pass_hash  text not null,
  color      text default '#7c6fff',
  created_at timestamptz default now()
);

create table if not exists user_data (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references users(id) on delete cascade,
  data       jsonb not null default '{}',
  updated_at timestamptz default now()
);

create unique index if not exists user_data_user_id_idx on user_data(user_id);

alter table users     enable row level security;
alter table user_data enable row level security;

create policy "allow all users"     on users     for all using (true) with check (true);
create policy "allow all user_data" on user_data for all using (true) with check (true);
```

---

## Como fazer atualizações

### Adicionar um novo campo de dado
1. Abra `js/data.js`
2. Adicione o campo em `getDefaultData()` com valor padrão
3. Abra `js/db.js` e adicione verificação em `loginAs()`:
   ```js
   DATA.novoCampo = DATA.novoCampo || valorPadrao;
   ```

### Adicionar uma nova página
1. Crie o HTML da página em `index.html` com id `page-nomepagina`
2. Adicione o link na sidebar (`index.html`)
3. Adicione o título em `PAGE_TITLES` em `js/app.js`
4. Adicione o case em `renderPage()` em `js/app.js`
5. Crie o arquivo `js/nomepagina.js` com as funções de render e CRUD
6. Importe o script no final de `index.html`

### Adicionar uma nova variável CSS
Abra `css/base.css` e adicione em `:root {}`.

### Modificar cores do tema
Todas as cores estão em `css/base.css` no bloco `:root`.

### Adicionar um novo gráfico
1. Abra `js/charts.js`
2. Crie uma função `renderNomeChart()` seguindo o padrão existente
3. Chame-a dentro de `renderDashboard()`
4. Adicione o `<canvas id="nomeChart">` no `index.html`

---

## Hospedagem no GitHub Pages

1. Faça upload de todos os arquivos para o repositório **mantendo a estrutura de pastas**
2. Vá em **Settings → Pages → Branch: main → Save**
3. Acesse: `https://seu-usuario.github.io/financaspro`

> ⚠️ O GitHub Pages serve arquivos estáticos — o Supabase funciona normalmente pois é chamado via fetch do lado do cliente.

---

## Tecnologias

| Tecnologia | Uso |
|---|---|
| HTML/CSS/JS puro | Interface e lógica |
| Chart.js 4.4 | Gráficos |
| Supabase REST API | Banco de dados na nuvem |
| DM Mono + Syne | Tipografia |
| Google Fonts | Fontes |
