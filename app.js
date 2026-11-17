'use strict';

const VERSAO = 3;
const DEMO = new URLSearchParams(location.search).has('demo');
const DB_NOME = DEMO ? 'litoteca-demo' : 'litoteca';
const TIPOS = { minerais: 'mineral', rochas: 'rocha' };
const ROTULO = { mineral: ['Mineral', 'Minerais'], rocha: ['Rocha', 'Rochas'] };
const PREFIXO = { mineral: 'M', rocha: 'R' };

/* ---------- utilidades ---------- */

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function formula(f) {
  return esc(f).replace(/([A-Za-z)\]])(\d+(?:[.,]\d+)?)/g, '$1<sub>$2</sub>');
}

function avisar(msg) {
  const el = $('#aviso');
  el.textContent = msg;
  el.classList.add('visivel');
  clearTimeout(avisar.t);
  avisar.t = setTimeout(() => el.classList.remove('visivel'), 3200);
}

function lsGet(k, padrao) { try { const v = localStorage.getItem(k); return v === null ? padrao : JSON.parse(v); } catch { return padrao; } }
function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sem armazenamento local */ } }

/* ---------- IndexedDB ---------- */

let conexao;
function abrir() {
  if (!conexao) conexao = new Promise((ok, erro) => {
    const r = indexedDB.open(DB_NOME, 1);
    r.onupgradeneeded = () => {
      const d = r.result;
      d.createObjectStore('amostras', { keyPath: 'id' });
      d.createObjectStore('fotos', { keyPath: 'id' });
      d.createObjectStore('config');
    };
    r.onsuccess = () => ok(r.result);
    r.onerror = () => erro(r.error);
  });
  return conexao;
}
async function op(loja, modo, fn) {
  const d = await abrir();
  return new Promise((ok, erro) => {
    const t = d.transaction(loja, modo);
    let saida;
    const r = fn(t.objectStore(loja));
    if (r) r.onsuccess = () => { saida = r.result; };
    t.oncomplete = () => ok(saida);
    t.onerror = () => erro(t.error);
    t.onabort = () => erro(t.error);
  });
}
const db = {
  get: (l, k) => op(l, 'readonly', s => s.get(k)),
  todos: l => op(l, 'readonly', s => s.getAll()),
  put: (l, v, k) => op(l, 'readwrite', s => (k === undefined ? s.put(v) : s.put(v, k))),
  del: (l, k) => op(l, 'readwrite', s => s.delete(k))
};

/* ---------- estado ---------- */

const estado = { classes: null, contadores: null, amostras: [] };
const REF = { mineral: referencia('mineral'), rocha: referencia('rocha') };
const urlsMiniatura = new Map();

async function carregar() {
  estado.classes = (await db.get('config', 'classes')) || structuredClone(CLASSES_PADRAO);
  estado.contadores = (await db.get('config', 'contadores')) || { mineral: 0, rocha: 0 };
  estado.amostras = await db.todos('amostras');
  if (DEMO && !estado.amostras.length) await semearDemo();
}
const salvarClasses = () => db.put('config', estado.classes, 'classes');
const salvarContadores = () => db.put('config', estado.contadores, 'contadores');

function classePorId(tipo, id) { return estado.classes[tipo].find(c => c.id === id); }
function amostrasDaClasse(tipo, id) {
  return estado.amostras.filter(a => a.tipo === tipo && a.classe === id).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
}
function acharRef(tipo, nome) {
  const n = norm(nome);
  if (!n) return null;
  return REF[tipo].find(r => norm(r.nome) === n || norm(r.nome.replace(/\s*\(.*\)/, '')) === n) || null;
}

/* ---------- fotos ---------- */

function carregarImagem(arquivo) {
  return new Promise((ok, erro) => {
    const url = URL.createObjectURL(arquivo);
    const img = new Image();
    img.onload = () => { ok(img); URL.revokeObjectURL(url); };
    img.onerror = () => { erro(new Error('imagem ilegível')); URL.revokeObjectURL(url); };
    img.src = url;
  });
}
function reduzir(img, max, q) {
  const r = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * r);
  c.height = Math.round(img.naturalHeight * r);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return new Promise(ok => c.toBlob(b => b.arrayBuffer().then(ok), 'image/jpeg', q));
}
async function processarFoto(arquivo) {
  const img = await carregarImagem(arquivo);
  return { id: uid(), grande: await reduzir(img, 1800, 0.86), mini: await reduzir(img, 520, 0.8) };
}
async function urlFoto(id, campo = 'mini') {
  const chave = id + ':' + campo;
  if (urlsMiniatura.has(chave)) return urlsMiniatura.get(chave);
  const f = await db.get('fotos', id);
  if (!f) return null;
  const url = URL.createObjectURL(new Blob([f[campo]], { type: 'image/jpeg' }));
  urlsMiniatura.set(chave, url);
  return url;
}
function hidratarFotos(raiz) {
  $$('img[data-foto]', raiz).forEach(async img => {
    const url = await urlFoto(img.dataset.foto, img.dataset.campo || 'mini');
    if (url) img.src = url;
  });
}

/* Amostra sem foto ganha um cristal desenhado, com tom derivado do nome */
function cristal(nome, tipo = 'mineral', matizFixo) {
  let h = 0;
  for (const c of norm(nome)) h = (h * 31 + c.charCodeAt(0)) % 360;
  if (matizFixo !== undefined) h = matizFixo;
  if (tipo === 'rocha') return `<svg class="cristal" viewBox="0 0 100 100" aria-hidden="true" style="--h:${h}">
    <path class="f1" d="M14 66 26 40 48 30 54 56 34 78z"/><path class="f2" d="M48 30 74 34 86 58 54 56z"/>
    <path class="f3" d="M54 56 86 58 76 76 34 78z"/>
    <path d="M14 66 26 40 48 30 74 34 86 58 76 76 34 78zM48 30l6 26-20 22M54 56l32 2" class="aresta"/></svg>`;
  return `<svg class="cristal" viewBox="0 0 100 100" aria-hidden="true" style="--h:${h}">
    <path class="f1" d="M50 12 34 30v40l16 18 4-36z"/><path class="f2" d="M50 12l4 40 12-22z"/>
    <path class="f3" d="M54 52 50 88l16-18V30z"/>
    <path d="M50 12 34 30v40l16 18 16-18V30zM34 30l20 22 12-22M54 52l-4 36" class="aresta"/></svg>`;
}

/* ---------- roteamento ---------- */

const app = $('#app');
let rotaAtual = '';

function marcarAba() {
  $$('.abas a').forEach(el => {
    if (el.dataset.aba === abaDeContexto) el.setAttribute('aria-current', 'page');
    else el.removeAttribute('aria-current');
  });
}

function rota() {
  const h = location.hash.replace(/^#\/?/, '') || 'minerais';
  const [a, b, c] = h.split('/').map(decodeURIComponent);
  rotaAtual = a;
  window.scrollTo(0, 0);
  if (a === 'minerais' || a === 'rochas') { abaDeContexto = a; marcarAba(); return telaLista(TIPOS[a]); }
  if (a === 'ajustes') { abaDeContexto = 'ajustes'; marcarAba(); return telaAjustes(); }
  if (a === 'amostra') return telaAmostra(b);
  if (a === 'nova') return telaFormulario(b, c, null);
  if (a === 'editar') return telaFormulario(null, null, b);
  location.hash = '#/minerais';
}
let abaDeContexto = 'minerais';

/* ---------- vitrine ---------- */

const MATIZ = {
  nativos: 45, sulfetos: 210, haloides: 315, oxidos: 8, carbonatos: 155, sulfatos: 195, fosfatos: 95,
  neso: 345, soro: 70, ciclo: 170, ino: 25, filo: 35, tecto: 262,
  plutonicas: 15, vulcanicas: 355, clasticas: 32, quimicas: 190, organicas: 80, foliadas: 228, naofoliadas: 300
};
function matiz(id) {
  if (id in MATIZ) return MATIZ[id];
  let h = 0;
  for (const c of String(id)) h = (h * 31 + c.charCodeAt(0)) % 360;
  return h;
}
function numero(a) {
  const d = String(a.registro || '').match(/\d+/);
  return d ? 'Nº ' + String(Number(d[0])).padStart(3, '0') : 'Nº ?';
}
function ordenar(lista) {
  const n = a => { const d = String(a.registro || '').match(/\d+/); return d ? Number(d[0]) : 1e9; };
  return [...lista].sort((x, y) => n(x) - n(y) || x.nome.localeCompare(y.nome, 'pt-BR'));
}
function selo(tipo, id, curto) {
  const c = classePorId(tipo, id);
  const nome = c ? c.nome : 'sem classe';
  return `<span class="selo" style="--h:${matiz(id)}">${esc(curto ? nome.replace(/^(Ígneas|Sedimentares|Metamórficas) /, '') : nome)}</span>`;
}
function bateBusca(a, q) {
  const alvo = norm([a.nome, a.registro, a.campos.variedade, a.campos.formula, a.campos.cor, a.campos.procedencia, a.campos.composicao, a.campos.ocorrencia].join(' '));
  return q.split(/\s+/).every(p => alvo.includes(p));
}
let listaVisivel = [];

function telaLista(tipo) {
  const total = estado.amostras.filter(a => a.tipo === tipo).length;
  const filtro = lsGet('filtro:' + tipo, 'todas');
  const busca = lsGet('busca:' + tipo, '');
  const contagem = id => estado.amostras.filter(a => a.tipo === tipo && a.classe === id).length;
  app.innerHTML = `
    <header class="topo">
      <p class="marca">Litoteca${DEMO ? ' · demonstração' : ''}</p>
      <div class="titulo-linha"><h1>${ROTULO[tipo][1]}</h1>
        ${total ? `<button type="button" class="botao-expo" id="abrir-expo"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5v14l11-7z"/></svg>Exposição</button>` : ''}</div>
      <p class="resumo">${total} ${total === 1 ? 'peça' : 'peças'} em exibição</p>
    </header>
    <div class="fixo">
      <input type="search" id="busca" placeholder="Buscar por nome, fórmula, cor, local" value="${esc(busca)}" autocomplete="off" enterkeyhint="search">
      <div class="filtros" role="group" aria-label="Filtrar por classe">
        <button type="button" data-filtro="todas" aria-pressed="${filtro === 'todas'}">Todas<span>${total}</span></button>
        ${estado.classes[tipo].map(c => `<button type="button" data-filtro="${esc(c.id)}" aria-pressed="${filtro === c.id}" style="--h:${matiz(c.id)}"><i></i>${esc(c.nome)}<span>${contagem(c.id)}</span></button>`).join('')}
      </div>
    </div>
    <div id="vitrine"></div>`;
  const campo = $('#busca');
  campo.addEventListener('input', () => { lsSet('busca:' + tipo, campo.value); desenharVitrine(tipo); });
  $$('.filtros button').forEach(b => b.addEventListener('click', () => {
    lsSet('filtro:' + tipo, b.dataset.filtro);
    $$('.filtros button').forEach(x => x.setAttribute('aria-pressed', x === b));
    b.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
    desenharVitrine(tipo);
  }));
  $('.filtros [aria-pressed="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  $('#abrir-expo')?.addEventListener('click', () => exposicao(listaVisivel, 0));
  desenharVitrine(tipo);
}

function desenharVitrine(tipo) {
  const filtro = lsGet('filtro:' + tipo, 'todas');
  const q = norm($('#busca').value);
  const alvo = $('#vitrine');
  let pecas = estado.amostras.filter(a => a.tipo === tipo);
  if (q) pecas = pecas.filter(a => bateBusca(a, q));
  let html = '';
  if (filtro !== 'todas' && classePorId(tipo, filtro)) {
    const c = classePorId(tipo, filtro);
    pecas = ordenar(pecas.filter(a => a.classe === filtro));
    html += `
      <section class="painel" style="--h:${matiz(c.id)}">
        <p class="marca">${esc(c.grupo || ROTULO[tipo][1])}</p>
        <h2>${esc(c.nome)}</h2>
        <div class="desc" data-desc data-id="${esc(c.id)}">
          <p>${c.desc ? esc(c.desc) : '<span class="vazio">Sem descrição ainda.</span>'}</p>
          <button type="button" class="link" data-editar-desc>Editar descrição</button>
        </div>
      </section>
      ${pecas.length ? `<ul class="grade">${pecas.map(peca).join('')}</ul>` : `<p class="nada">${q ? 'Nada encontrado nesta classe.' : 'Nenhuma peça nesta classe ainda.'}</p>`}
      <a class="botao secundario largo" href="#/nova/${tipo}/${encodeURIComponent(c.id)}">Adicionar peça em ${esc(c.nome)}</a>`;
  } else {
    pecas = ordenar(pecas);
    if (!pecas.length) {
      html = q ? `<p class="nada">Nada encontrado para "${esc($('#busca').value)}".</p>`
        : `<div class="vazio-vitrine">${cristal('litoteca', tipo)}<h2>A vitrine está vazia</h2><p>Cadastre a primeira peça. Digitando o nome, a ficha se preenche com os dados de referência.</p></div>`;
    } else {
      html += `<ul class="grade">${pecas.map(peca).join('')}</ul>`;
    }
    html += `<a class="botao largo" href="#/nova/${tipo}/${encodeURIComponent(estado.classes[tipo][0].id)}">Adicionar peça</a>`;
  }
  listaVisivel = pecas;
  alvo.innerHTML = html;
  hidratarFotos(alvo);
  $$('[data-ir]', alvo).forEach(b => b.addEventListener('click', () => { $(`.filtros [data-filtro="${CSS.escape(b.dataset.ir)}"]`).click(); window.scrollTo({ top: 0 }); }));
  $$('[data-editar-desc]', alvo).forEach(b => b.addEventListener('click', () => editarDescricao(tipo, b.closest('[data-desc]').dataset.id, b.closest('[data-desc]'))));
}

function peca(a) {
  const capa = a.fotos?.length ? `<img data-foto="${esc(a.fotos[0])}" alt="" loading="lazy">` : cristal(a.nome, a.tipo, matiz(a.classe));
  return `<li><a class="peca" href="#/amostra/${encodeURIComponent(a.id)}" style="--h:${matiz(a.classe)}">
    <div class="vitrine-luz${a.fotos?.length ? ' com-foto' : ''}">${capa}</div>
    <div class="etiqueta"><span class="num">${numero(a)}</span><strong>${esc(a.nome)}</strong>${selo(a.tipo, a.classe, true)}</div>
  </a></li>`;
}

function editarDescricao(tipo, id, caixa) {
  const c = classePorId(tipo, id);
  caixa.innerHTML = `
    <label class="rotulo" for="d-${esc(id)}">Descrição da classe</label>
    <textarea id="d-${esc(id)}" rows="5">${esc(c.desc || '')}</textarea>
    <div class="acoes-linha"><button type="button" class="botao" data-ok>Salvar</button><button type="button" class="link" data-cancelar>Cancelar</button></div>`;
  const ta = $('textarea', caixa);
  ta.focus();
  $('[data-ok]', caixa).addEventListener('click', async () => {
    c.desc = ta.value.trim();
    await salvarClasses();
    desenharVitrine(tipo);
    avisar('Descrição salva');
  });
  $('[data-cancelar]', caixa).addEventListener('click', () => desenharVitrine(tipo));
}

/* ---------- ficha ---------- */

function primeiroNumero(v) {
  const n = String(v || '').replace(/,/g, '.').match(/\d+(\.\d+)?/g);
  return n ? n.map(Number) : null;
}
function atributos(a) {
  const barras = [];
  const d = primeiroNumero(a.campos.dureza);
  if (d) {
    const v = d.filter(n => n >= 1 && n <= 10);
    if (v.length) {
      const min = Math.min(...v), max = Math.max(...v);
      const ref = ['talco', 'gipsita', 'calcita', 'fluorita', 'apatita', 'ortoclásio', 'quartzo', 'topázio', 'coríndon', 'diamante'];
      const nota = [Math.ceil(min) >= 2 ? 'risca ' + ref[Math.ceil(min) - 2] : '', Math.floor(max) <= 9 ? 'riscado por ' + ref[Math.floor(max)] : ''].filter(Boolean).join(', ');
      barras.push(`<div class="atributo"><div class="atr-topo"><span>Dureza</span><b>${esc(a.campos.dureza)}</b></div>
        <div class="trilho-a"><span style="left:${(min / 10) * 100}%;width:0"></span><i style="width:${(max / 10) * 100}%"></i></div>
        <small>escala de Mohs, 1 a 10${nota ? ' · ' + nota : ''}</small></div>`);
    }
  }
  const g = primeiroNumero(a.campos.densidade);
  if (g) {
    const max = Math.max(...g);
    barras.push(`<div class="atributo"><div class="atr-topo"><span>Densidade</span><b>${esc(a.campos.densidade)} g/cm³</b></div>
      <div class="trilho-a"><i style="width:${Math.min(max / 10, 1) * 100}%"></i></div>
      <small>${max < 2.9 ? 'leve' : max < 4 ? 'média' : max < 6 ? 'pesada' : 'muito pesada'} para o tamanho${max > 10 ? ' · fora da escala de 10' : ''}</small></div>`);
  }
  return barras.length ? `<section class="atributos">${barras.join('')}</section>` : '';
}

async function telaAmostra(id) {
  const a = estado.amostras.find(x => x.id === id);
  if (!a) { app.innerHTML = `<p class="nada">Peça não encontrada. <a href="#/minerais">Voltar</a></p>`; return; }
  abaDeContexto = a.tipo === 'mineral' ? 'minerais' : 'rochas';
  marcarAba();
  const irmas = ordenar(estado.amostras.filter(x => x.tipo === a.tipo));
  const i = irmas.findIndex(x => x.id === a.id);
  const ant = irmas[i - 1], prox = irmas[i + 1];
  const linhas = [];
  for (const sec of CAMPOS[a.tipo]) for (const [k, rot] of sec.campos) {
    if (['formula', 'curiosidades', 'composicao', 'variedade', 'dureza', 'densidade'].includes(k)) continue;
    const v = a.campos[k];
    if (v) linhas.push(`<tr><th scope="row">${esc(rot)}</th><td>${esc(v)}</td></tr>`);
  }
  const comp = a.tipo === 'rocha' && a.campos.composicao
    ? `<section class="bloco"><h2>Composição mineralógica</h2><ul class="chips">${a.campos.composicao.split(/[,;]/).map(s => s.trim()).filter(Boolean).map(m => {
        const meu = estado.amostras.find(x => x.tipo === 'mineral' && norm(x.nome) === norm(m));
        return meu ? `<li><a href="#/amostra/${encodeURIComponent(meu.id)}">${esc(m)}</a></li>` : `<li>${esc(m)}</li>`;
      }).join('')}</ul></section>` : '';
  const rochasCom = a.tipo === 'mineral'
    ? estado.amostras.filter(r => r.tipo === 'rocha' && (r.campos.composicao || '').split(/[,;]/).some(m => norm(m) === norm(a.nome)))
    : [];
  app.innerHTML = `
    <div class="barra"><a class="voltar" href="#/${abaDeContexto}">${ROTULO[a.tipo][1]}</a>
      <span class="navega">${ant ? `<a href="#/amostra/${encodeURIComponent(ant.id)}" aria-label="Peça anterior, ${esc(ant.nome)}">‹</a>` : '<span>‹</span>'}<em>${i + 1} de ${irmas.length}</em>${prox ? `<a href="#/amostra/${encodeURIComponent(prox.id)}" aria-label="Próxima peça, ${esc(prox.nome)}">›</a>` : '<span>›</span>'}</span>
      <a class="link" href="#/editar/${encodeURIComponent(a.id)}">Editar</a></div>
    <div class="palco" style="--h:${matiz(a.classe)}">
      ${a.fotos?.length ? `<div class="galeria">${a.fotos.map(f => `<button type="button" class="foto" data-ampliar="${esc(f)}"><img data-foto="${esc(f)}" data-campo="grande" alt="Foto da peça ${esc(a.nome)}"></button>`).join('')}</div>`
        : `<div class="sem-foto">${cristal(a.nome, a.tipo, matiz(a.classe))}</div>`}
      <span class="num-palco">${numero(a)}</span>
      ${a.fotos?.length > 1 ? `<span class="qtd-fotos">${a.fotos.length} fotos</span>` : ''}
    </div>
    <header class="ficha">
      <div class="selos">${selo(a.tipo, a.classe)}${a.campos.sistema ? `<span class="selo neutro">${esc(a.campos.sistema)}</span>` : ''}</div>
      <h1>${esc(a.nome)}</h1>
      ${a.campos.variedade ? `<p class="variedade">${esc(a.campos.variedade)}</p>` : ''}
      ${a.campos.formula ? `<p class="formula grande">${formula(a.campos.formula)}</p>` : ''}
    </header>
    ${atributos(a)}
    ${a.campos.curiosidades ? `<section class="bloco destaque"><h2>Curiosidades</h2><p class="texto">${esc(a.campos.curiosidades).replace(/\n/g, '<br>')}</p></section>` : ''}
    ${linhas.length ? `<section class="bloco"><h2>Etiqueta</h2><table class="props"><tbody>${linhas.join('')}</tbody></table></section>` : ''}
    ${comp}
    ${rochasCom.length ? `<section class="bloco"><h2>Presente nas rochas</h2><ul class="chips">${rochasCom.map(r => `<li><a href="#/amostra/${encodeURIComponent(r.id)}">${esc(r.nome)}</a></li>`).join('')}</ul></section>` : ''}
    <div class="acoes-linha"><button type="button" class="botao secundario" id="expo-daqui">Ver em exposição</button></div>
    <p class="rodape-ficha">${esc(a.registro)} · cadastrada em ${new Date(a.criado).toLocaleDateString('pt-BR')}${a.atualizado !== a.criado ? ' · editada em ' + new Date(a.atualizado).toLocaleDateString('pt-BR') : ''}</p>`;
  hidratarFotos(app);
  $$('[data-ampliar]', app).forEach(b => b.addEventListener('click', () => ampliar(b.dataset.ampliar, a.nome)));
  $('#expo-daqui').addEventListener('click', () => exposicao(irmas, i));
}

/* ---------- modo exposição ---------- */

function exposicao(lista, inicio) {
  if (!lista.length) return;
  let i = inicio;
  let tocando = true;
  let relogio;
  const v = document.createElement('div');
  v.className = 'expo';
  v.setAttribute('role', 'dialog');
  v.setAttribute('aria-label', 'Exposição');
  v.innerHTML = `
    <div class="expo-palco"></div>
    <div class="expo-legenda" aria-live="polite"></div>
    <div class="expo-topo"><span class="expo-conta"></span>
      <button type="button" class="expo-btn" data-pausa>Pausar</button>
      <button type="button" class="expo-btn" data-fechar>Fechar</button></div>
    <button type="button" class="expo-lado esq" data-ant aria-label="Anterior"></button>
    <button type="button" class="expo-lado dir" data-prox aria-label="Próxima"></button>
    <div class="expo-barra"><i></i></div>`;
  const palco = $('.expo-palco', v), leg = $('.expo-legenda', v), barra = $('.expo-barra i', v);
  async function mostrar() {
    const a = lista[i];
    const cl = classePorId(a.tipo, a.classe);
    const url = a.fotos?.length ? await urlFoto(a.fotos[0], 'grande') : null;
    const quadro = document.createElement('div');
    quadro.className = 'expo-quadro';
    quadro.style.setProperty('--h', matiz(a.classe));
    quadro.innerHTML = url ? `<img src="${url}" alt="${esc(a.nome)}">` : cristal(a.nome, a.tipo, matiz(a.classe));
    palco.append(quadro);
    requestAnimationFrame(() => quadro.classList.add('entra'));
    [...palco.children].slice(0, -1).forEach(q => { q.classList.remove('entra'); setTimeout(() => q.remove(), 900); });
    leg.innerHTML = `<p class="expo-num">${numero(a)} · ${esc(cl ? cl.nome : '')}</p><h2>${esc(a.nome)}</h2>
      ${a.campos.formula ? `<p class="expo-formula">${formula(a.campos.formula)}</p>` : ''}
      ${a.campos.procedencia ? `<p class="expo-proc">${esc(a.campos.procedencia)}</p>` : ''}`;
    $('.expo-conta', v).textContent = `${i + 1} / ${lista.length}`;
    agendar();
  }
  function agendar() {
    clearTimeout(relogio);
    barra.style.transition = 'none';
    barra.style.width = '0';
    if (!tocando || lista.length < 2) return;
    requestAnimationFrame(() => requestAnimationFrame(() => { barra.style.transition = 'width 7s linear'; barra.style.width = '100%'; }));
    relogio = setTimeout(() => ir(1), 7000);
  }
  function ir(d) { i = (i + d + lista.length) % lista.length; mostrar(); }
  function fechar() { clearTimeout(relogio); v.remove(); document.removeEventListener('keydown', tecla); }
  function tecla(e) {
    if (e.key === 'Escape') fechar();
    if (e.key === 'ArrowRight') ir(1);
    if (e.key === 'ArrowLeft') ir(-1);
  }
  $('[data-fechar]', v).addEventListener('click', fechar);
  $('[data-ant]', v).addEventListener('click', () => ir(-1));
  $('[data-prox]', v).addEventListener('click', () => ir(1));
  $('[data-pausa]', v).addEventListener('click', e => { tocando = !tocando; e.target.textContent = tocando ? 'Pausar' : 'Continuar'; agendar(); });
  let x0 = null;
  v.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
  v.addEventListener('touchend', e => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 50) ir(dx < 0 ? 1 : -1);
  });
  document.addEventListener('keydown', tecla);
  document.body.append(v);
  $('[data-fechar]', v).focus();
  mostrar();
}

async function ampliar(id, nome) {
  const url = await urlFoto(id, 'grande');
  const v = document.createElement('div');
  v.className = 'visor';
  v.setAttribute('role', 'dialog');
  v.setAttribute('aria-label', 'Foto ampliada');
  v.innerHTML = `<img src="${url}" alt="Foto da amostra ${esc(nome)}"><button type="button" class="fechar">Fechar</button>`;
  const fechar = () => { v.remove(); document.removeEventListener('keydown', tecla); };
  const tecla = e => { if (e.key === 'Escape') fechar(); };
  v.addEventListener('click', fechar);
  document.addEventListener('keydown', tecla);
  document.body.append(v);
  $('.fechar', v).focus();
}

/* ---------- tela: formulário ---------- */

async function telaFormulario(tipo, classeId, idEdicao) {
  const edicao = idEdicao ? estado.amostras.find(x => x.id === idEdicao) : null;
  if (idEdicao && !edicao) { location.hash = '#/minerais'; return; }
  tipo = edicao ? edicao.tipo : tipo;
  if (!ROTULO[tipo]) { location.hash = '#/minerais'; return; }
  classeId = edicao ? edicao.classe : (classePorId(tipo, classeId) ? classeId : estado.classes[tipo][0].id);
  abaDeContexto = tipo === 'mineral' ? 'minerais' : 'rochas';
  marcarAba();

  const v = edicao ? { ...edicao.campos } : {};
  const registro = edicao ? edicao.registro : `${PREFIXO[tipo]}-${String(estado.contadores[tipo] + 1).padStart(4, '0')}`;
  let fotos = edicao ? edicao.fotos.map(id => ({ id, existente: true })) : [];
  let preenchidoPelaRef = [];

  let opcoesClasse = '';
  let grupoAtual = null;
  for (const c of estado.classes[tipo]) {
    if ((c.grupo || null) !== grupoAtual) {
      if (grupoAtual) opcoesClasse += '</optgroup>';
      grupoAtual = c.grupo || null;
      if (grupoAtual) opcoesClasse += `<optgroup label="${esc(grupoAtual)}">`;
    }
    opcoesClasse += `<option value="${esc(c.id)}" ${c.id === classeId ? 'selected' : ''}>${esc(c.nome)}</option>`;
  }
  if (grupoAtual) opcoesClasse += '</optgroup>';
  const listas = Object.entries(SUGESTOES).map(([k, l]) => `<datalist id="l-${k}">${l.map(x => `<option value="${esc(x)}">`).join('')}</datalist>`).join('');
  const nomes = `<datalist id="l-nomes">${REF[tipo].map(r => `<option value="${esc(r.nome)}">`).join('')}</datalist>`;
  const nomesMinerais = `<datalist id="l-minerais">${[...new Set([...REF.mineral.map(r => r.nome), ...estado.amostras.filter(a => a.tipo === 'mineral').map(a => a.nome)])].map(n => `<option value="${esc(n)}">`).join('')}</datalist>`;

  const secoes = CAMPOS[tipo].map(sec => `
    <fieldset><legend>${esc(sec.secao)}</legend>
    ${sec.campos.map(([k, rot, dica, lista, longo]) => `
      <label class="campo"><span class="rotulo">${esc(rot)}</span>
      ${longo ? `<textarea name="${k}" rows="${k === 'curiosidades' ? 5 : 3}" placeholder="${esc(dica || '')}">${esc(v[k] || '')}</textarea>`
        : `<input name="${k}" value="${esc(v[k] || '')}" placeholder="${esc(dica || '')}" ${lista ? `list="l-${lista}"` : ''} autocomplete="off" ${k === 'dureza' || k === 'densidade' ? 'inputmode="decimal"' : ''}>`}
      </label>`).join('')}
    </fieldset>`).join('');

  app.innerHTML = `
    <div class="barra"><a class="voltar" href="${edicao ? '#/amostra/' + encodeURIComponent(edicao.id) : '#/' + abaDeContexto}">${edicao ? 'Ficha' : ROTULO[tipo][1]}</a></div>
    <header class="topo compacto"><p class="marca">${edicao ? 'Editar amostra' : 'Nova amostra'}</p><h1>${esc(edicao ? edicao.nome : ROTULO[tipo][0])}</h1></header>
    <form id="ficha" novalidate>
      ${listas}${nomes}${nomesMinerais}
      <fieldset class="principal">
        <label class="campo"><span class="rotulo">Nome</span>
          <input name="nome" value="${esc(edicao ? edicao.nome : '')}" list="l-nomes" required autocomplete="off" autocapitalize="words" placeholder="${tipo === 'mineral' ? 'ex.: Quartzo' : 'ex.: Granito'}">
        </label>
        <p class="ref-aviso" id="ref-aviso" hidden></p>
        <div class="duas">
          <label class="campo"><span class="rotulo">Classe</span><select name="classe">${opcoesClasse}</select></label>
          <label class="campo"><span class="rotulo">Nº de registro</span><input name="registro" value="${esc(registro)}" autocomplete="off"></label>
        </div>
      </fieldset>
      <fieldset class="fotos"><legend>Fotos</legend>
        <ul class="miniaturas" id="miniaturas"></ul>
        <label class="botao secundario arquivo">Adicionar fotos
          <input type="file" accept="image/*" multiple class="oculto" id="entrada-fotos">
        </label>
        <p class="dica">Câmera ou galeria. As fotos são reduzidas e guardadas só neste aparelho.</p>
      </fieldset>
      ${secoes}
      <div class="acoes">
        <button type="submit" class="botao">Salvar amostra</button>
        ${edicao ? '<button type="button" class="botao perigo" id="excluir">Excluir amostra</button>' : ''}
      </div>
    </form>`;

  const form = $('#ficha');
  const composicao = form.elements.composicao;
  if (composicao) composicao.setAttribute('placeholder', 'ex.: quartzo, feldspato potássico, biotita');

  /* preenchimento automático a partir da referência */
  const aviso = $('#ref-aviso');
  function aplicarRef() {
    const r = acharRef(tipo, form.elements.nome.value);
    if (!r) return;
    const preenchidos = [];
    for (const [k, val] of Object.entries(r)) {
      if (k === 'nome') continue;
      if (k === 'classe') {
        if (form.elements.classe.value !== val && classePorId(tipo, val)) {
          form.elements.classe.value = val;
          preenchidos.push('classe');
        }
        continue;
      }
      const el = form.elements[k];
      if (el && (!el.value.trim() || el.classList.contains('da-ref'))) { el.value = val; preenchidos.push(k); el.classList.add('da-ref'); }
    }
    if (!preenchidos.length) return;
    preenchidoPelaRef = preenchidos;
    {
      const cl = classePorId(tipo, form.elements.classe.value);
      aviso.innerHTML = `Ficha de referência de <strong>${esc(r.nome)}</strong> aplicada em ${preenchidos.length} campos${preenchidos.includes('classe') ? ` (classe ajustada para ${esc(cl.nome)})` : ''}. Os valores são típicos: ajuste para a sua amostra. <button type="button" class="link" id="desfazer-ref">Desfazer</button>`;
      aviso.hidden = false;
      $('#desfazer-ref').addEventListener('click', () => {
        for (const k of preenchidoPelaRef) {
          if (k === 'classe') form.elements.classe.value = classeId;
          else { form.elements[k].value = ''; form.elements[k].classList.remove('da-ref'); }
        }
        preenchidoPelaRef = [];
        aviso.hidden = true;
      });
    }
  }
  form.elements.nome.addEventListener('change', aplicarRef);
  form.elements.nome.addEventListener('input', () => { if (acharRef(tipo, form.elements.nome.value) && REF[tipo].some(r => r.nome === form.elements.nome.value)) aplicarRef(); });
  form.addEventListener('input', e => { if (e.target.classList.contains('da-ref')) e.target.classList.remove('da-ref'); });
  if (composicao) {
    composicao.closest('label').insertAdjacentHTML('afterend', '<label class="campo"><span class="rotulo">Acrescentar mineral</span><input id="mais-mineral" list="l-minerais" placeholder="escolha da lista ou digite" autocomplete="off"></label>');
    const mais = $('#mais-mineral');
    const acrescentar = () => {
      const m = mais.value.trim();
      if (!m) return;
      composicao.value = composicao.value.trim() ? composicao.value.trim().replace(/[,;]\s*$/, '') + ', ' + m.toLowerCase() : m.toLowerCase();
      composicao.classList.remove('da-ref');
      mais.value = '';
    };
    mais.addEventListener('change', acrescentar);
    mais.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); acrescentar(); } });
  }

  /* fotos */
  const ul = $('#miniaturas');
  function desenharFotos() {
    ul.innerHTML = fotos.map((f, i) => `<li><img ${f.existente ? `data-foto="${esc(f.id)}"` : `src="${f.url}"`} alt="Foto ${i + 1}">
      <button type="button" class="tirar" data-i="${i}" aria-label="Remover foto ${i + 1}">×</button>
      ${i > 0 ? `<button type="button" class="capa-btn" data-capa="${i}">Capa</button>` : '<span class="capa-tag">Capa</span>'}</li>`).join('');
    hidratarFotos(ul);
  }
  ul.addEventListener('click', e => {
    const t = e.target.closest('[data-i]');
    const c = e.target.closest('[data-capa]');
    if (t) { fotos.splice(+t.dataset.i, 1); desenharFotos(); }
    if (c) { const [f] = fotos.splice(+c.dataset.capa, 1); fotos.unshift(f); desenharFotos(); }
  });
  $('#entrada-fotos').addEventListener('change', async e => {
    const arquivos = [...e.target.files];
    e.target.value = '';
    if (!arquivos.length) return;
    avisar(arquivos.length > 1 ? `Preparando ${arquivos.length} fotos...` : 'Preparando foto...');
    for (const arq of arquivos) {
      try {
        const p = await processarFoto(arq);
        fotos.push({ ...p, url: URL.createObjectURL(new Blob([p.mini], { type: 'image/jpeg' })) });
        desenharFotos();
      } catch { avisar('Uma das fotos não pôde ser lida'); }
    }
  });
  desenharFotos();

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const nome = form.elements.nome.value.trim();
    if (!nome) { form.elements.nome.focus(); avisar('Dê um nome à amostra'); return; }
    const campos = {};
    for (const sec of CAMPOS[tipo]) for (const [k] of sec.campos) {
      const val = form.elements[k].value.trim();
      if (val) campos[k] = val;
    }
    const agora = Date.now();
    for (const f of fotos) if (!f.existente) await db.put('fotos', { id: f.id, grande: f.grande, mini: f.mini });
    if (edicao) for (const id of edicao.fotos) if (!fotos.some(f => f.id === id)) await db.del('fotos', id);
    const amostra = {
      id: edicao ? edicao.id : uid(),
      tipo,
      classe: form.elements.classe.value,
      nome,
      registro: form.elements.registro.value.trim() || registro,
      campos,
      fotos: fotos.map(f => f.id),
      criado: edicao ? edicao.criado : agora,
      atualizado: agora
    };
    await db.put('amostras', amostra);
    if (!edicao) { estado.contadores[tipo] += 1; await salvarContadores(); }
    const i = estado.amostras.findIndex(x => x.id === amostra.id);
    if (i >= 0) estado.amostras[i] = amostra; else estado.amostras.push(amostra);
    pedirPersistencia();
    avisar(edicao ? 'Alterações salvas' : `${nome} entrou no acervo`);
    location.hash = '#/amostra/' + encodeURIComponent(amostra.id);
  });

  if (edicao) $('#excluir').addEventListener('click', async () => {
    if (!confirm(`Excluir ${edicao.nome} e suas fotos? Isso não pode ser desfeito.`)) return;
    for (const id of edicao.fotos) await db.del('fotos', id);
    await db.del('amostras', edicao.id);
    estado.amostras = estado.amostras.filter(x => x.id !== edicao.id);
    avisar('Amostra excluída');
    location.hash = '#/' + abaDeContexto;
  });
}

/* ---------- tela: acervo e ajustes ---------- */

async function telaAjustes() {
  const nM = estado.amostras.filter(a => a.tipo === 'mineral').length;
  const nR = estado.amostras.filter(a => a.tipo === 'rocha').length;
  const nF = estado.amostras.reduce((s, a) => s + (a.fotos?.length || 0), 0);
  let espaco = '';
  try {
    const e = await navigator.storage?.estimate?.();
    if (e?.usage) espaco = ` · ${(e.usage / 1048576).toFixed(1).replace('.', ',')} MB ocupados`;
  } catch { /* sem estimativa */ }
  const instalado = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const ultimo = lsGet('ultimoBackup', null);

  app.innerHTML = `
    <header class="topo"><p class="marca">Litoteca</p><h1>Acervo</h1>
      <p class="resumo">${nM} minerais · ${nR} rochas · ${nF} fotos${espaco}</p></header>

    ${instalado ? '' : `<section class="bloco cartao-info"><h2>Instalar no iPhone</h2>
      <ol class="passos"><li>Abra este endereço no <strong>Safari</strong>.</li><li>Toque em Compartilhar (quadrado com a seta para cima).</li><li>Escolha <strong>Adicionar à Tela de Início</strong>.</li></ol>
      <p class="dica">O app passa a abrir em tela cheia e funciona sem internet.</p></section>`}

    <section class="bloco"><h2>Cópia de segurança</h2>
      <p class="texto">Tudo fica guardado só neste aparelho. Apagar o app da tela de início ou limpar os dados do Safari apaga o acervo. Faça uma cópia de vez em quando e guarde no iCloud Drive ou mande para você mesmo.</p>
      <p class="dica">${ultimo ? 'Última cópia: ' + new Date(ultimo).toLocaleString('pt-BR') : 'Nenhuma cópia feita ainda.'}</p>
      <div class="acoes-linha">
        <button type="button" class="botao" id="preparar">Gerar cópia</button>
        <label class="botao secundario arquivo">Restaurar cópia<input type="file" accept="application/json,.json" class="oculto" id="restaurar"></label>
      </div>
      <div id="saida-backup"></div>
    </section>

    ${['mineral', 'rocha'].map(t => `
    <section class="bloco"><h2>Classes de ${ROTULO[t][1].toLowerCase()}</h2>
      <ul class="lista-classes">${estado.classes[t].map(c => {
        const n = amostrasDaClasse(t, c.id).length;
        return `<li data-tipo="${t}" data-id="${esc(c.id)}"><span>${esc(c.nome)}${c.grupo ? ` <small>${esc(c.grupo)}</small>` : ''}</span><span class="qtd">${n}</span>
          <span class="acoes-classe"><button type="button" class="link" data-renomear>Renomear</button>${n ? '' : '<button type="button" class="link perigo" data-remover>Remover</button>'}</span></li>`;
      }).join('')}</ul>
      <form class="nova-classe" data-tipo="${t}"><input name="nome" placeholder="Nova classe" autocomplete="off" required><button class="botao secundario">Criar</button></form>
    </section>`).join('')}

    <section class="bloco"><h2>Sobre</h2>
      <p class="texto">As fichas de referência trazem ${REF.mineral.length} minerais e ${REF.rocha.length} rochas com valores típicos de manuais de mineralogia. Ao digitar um nome conhecido, os campos vazios se preenchem sozinhos. Versão ${VERSAO}.</p>
    </section>`;

  $('#preparar').addEventListener('click', gerarBackup);
  $('#restaurar').addEventListener('change', restaurarBackup);
  $$('[data-renomear]').forEach(b => b.addEventListener('click', async () => {
    const li = b.closest('li');
    const c = classePorId(li.dataset.tipo, li.dataset.id);
    const novo = prompt('Novo nome da classe', c.nome);
    if (!novo || !novo.trim()) return;
    c.nome = novo.trim();
    await salvarClasses();
    telaAjustes();
  }));
  $$('[data-remover]').forEach(b => b.addEventListener('click', async () => {
    const li = b.closest('li');
    estado.classes[li.dataset.tipo] = estado.classes[li.dataset.tipo].filter(c => c.id !== li.dataset.id);
    await salvarClasses();
    avisar('Classe removida');
    telaAjustes();
  }));
  $$('.nova-classe').forEach(f => f.addEventListener('submit', async e => {
    e.preventDefault();
    const nome = f.elements.nome.value.trim();
    if (!nome) return;
    estado.classes[f.dataset.tipo].push({ id: 'c-' + uid(), nome, desc: '' });
    await salvarClasses();
    avisar('Classe criada');
    telaAjustes();
  }));
}

const paraBase64 = buf => new Promise(ok => {
  const r = new FileReader();
  r.onload = () => ok(r.result.split(',')[1]);
  r.readAsDataURL(new Blob([buf]));
});
async function deBase64(b64) { return (await fetch('data:application/octet-stream;base64,' + b64)).arrayBuffer(); }

async function gerarBackup() {
  const saida = $('#saida-backup');
  saida.innerHTML = '<p class="dica">Montando a cópia...</p>';
  const fotos = await db.todos('fotos');
  const pacote = {
    app: 'litoteca', formato: 1, gerado: new Date().toISOString(),
    classes: estado.classes, contadores: estado.contadores, amostras: estado.amostras,
    fotos: await Promise.all(fotos.map(async f => ({ id: f.id, grande: await paraBase64(f.grande), mini: await paraBase64(f.mini) })))
  };
  const d = new Date();
  const nome = `litoteca-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}.json`;
  const arquivo = new File([JSON.stringify(pacote)], nome, { type: 'application/json' });
  const tam = (arquivo.size / 1048576).toFixed(1).replace('.', ',');
  const podeCompartilhar = navigator.canShare?.({ files: [arquivo] });
  const url = URL.createObjectURL(arquivo);
  saida.innerHTML = `<p class="dica">Cópia pronta: ${esc(nome)}, ${tam} MB.</p>
    ${podeCompartilhar ? '<button type="button" class="botao" id="compartilhar">Salvar ou enviar</button>' : ''}
    <a class="botao ${podeCompartilhar ? 'secundario' : ''}" href="${url}" download="${esc(nome)}" id="baixar">Baixar arquivo</a>`;
  const marcar = () => { lsSet('ultimoBackup', Date.now()); };
  $('#baixar').addEventListener('click', marcar);
  if (podeCompartilhar) $('#compartilhar').addEventListener('click', async () => {
    try { await navigator.share({ files: [arquivo], title: 'Cópia da Litoteca' }); marcar(); avisar('Cópia salva'); }
    catch (err) { if (err.name !== 'AbortError') avisar('Não deu para compartilhar; use Baixar arquivo'); }
  });
}

async function restaurarBackup(e) {
  const arq = e.target.files[0];
  e.target.value = '';
  if (!arq) return;
  let p;
  try { p = JSON.parse(await arq.text()); } catch { avisar('Arquivo inválido'); return; }
  if (p.app !== 'litoteca' || !Array.isArray(p.amostras)) { avisar('Esse arquivo não é uma cópia da Litoteca'); return; }
  avisar('Restaurando...');
  for (const f of p.fotos || []) await db.put('fotos', { id: f.id, grande: await deBase64(f.grande), mini: await deBase64(f.mini) });
  for (const a of p.amostras) await db.put('amostras', a);
  for (const t of ['mineral', 'rocha']) {
    const atuais = estado.classes[t];
    for (const c of p.classes?.[t] || []) {
      const i = atuais.findIndex(x => x.id === c.id);
      if (i >= 0) atuais[i] = c; else atuais.push(c);
    }
    estado.contadores[t] = Math.max(estado.contadores[t], p.contadores?.[t] || 0);
  }
  await salvarClasses();
  await salvarContadores();
  estado.amostras = await db.todos('amostras');
  avisar(`${p.amostras.length} amostras restauradas`);
  telaAjustes();
}

function pedirPersistencia() {
  if (pedirPersistencia.feito) return;
  pedirPersistencia.feito = true;
  navigator.storage?.persist?.().catch(() => {});
}

/* ---------- demonstração (banco separado, dados fictícios) ---------- */

async function semearDemo() {
  const itens = [
    ['mineral', 'Quartzo', { variedade: 'ametista', procedencia: 'Ametista do Sul, RS', aquisicao: 'feira de minerais, 2025', dimensoes: '6 x 4 x 4 cm, 92 g', curiosidades: 'Geodo partido ao meio. A cor violeta vem de ferro na estrutura e radiação natural.' }],
    ['mineral', 'Pirita', { procedencia: 'Navajún, Espanha', aquisicao: 'troca com colega' }],
    ['mineral', 'Fluorita', { procedencia: 'Santa Catarina' }],
    ['mineral', 'Hematita', { variedade: 'especularita', procedencia: 'Itabira, MG' }],
    ['mineral', 'Calcita', { procedencia: 'Bom Jesus da Lapa, BA', curiosidades: 'Romboedro de clivagem transparente: mostra dupla refração sobre texto impresso.' }],
    ['mineral', 'Turmalina', { variedade: 'schorl', procedencia: 'Governador Valadares, MG' }],
    ['mineral', 'Biotita', { procedencia: 'pegmatito em MG' }],
    ['mineral', 'Ortoclásio', {}],
    ['mineral', 'Malaquita', { procedencia: 'Congo (comprada)' }],
    ['rocha', 'Granito', { procedencia: 'pedreira em Contagem, MG', composicao: 'quartzo, ortoclásio, plagioclásio, biotita' }],
    ['rocha', 'Basalto', { estrutura: 'amigdaloidal', procedencia: 'Serra Gaúcha, RS' }],
    ['rocha', 'Itabirito', { procedencia: 'Quadrilátero Ferrífero, MG' }],
    ['rocha', 'Arenito', { procedencia: 'Formação Botucatu, SP' }]
  ];
  let t = Date.now() - itens.length * 86400000;
  for (const [tipo, nome, extra] of itens) {
    const r = acharRef(tipo, nome);
    const campos = { ...r, ...extra };
    const classe = campos.classe;
    delete campos.nome; delete campos.classe;
    estado.contadores[tipo] += 1;
    const a = { id: uid(), tipo, classe, nome, registro: `${PREFIXO[tipo]}-${String(estado.contadores[tipo]).padStart(4, '0')}`, campos, fotos: [], criado: t, atualizado: t };
    t += 86400000;
    await db.put('amostras', a);
    estado.amostras.push(a);
  }
  await salvarContadores();
}

/* ---------- service worker ---------- */

function registrarSW() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  const tinhaControle = !!navigator.serviceWorker.controller;
  let recarregou = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!tinhaControle || recarregou) return;
    if (rotaAtual === 'nova' || rotaAtual === 'editar') return; /* não perder o que está sendo digitado */
    recarregou = true;
    location.reload();
  });
  navigator.serviceWorker.register('sw.js').then(reg => {
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
  }).catch(() => {});
}

/* ---------- início ---------- */

(async function iniciar() {
  try {
    await carregar();
  } catch (err) {
    app.innerHTML = `<p class="nada">Não foi possível abrir o armazenamento deste navegador. Em aba privada o Safari bloqueia o banco local; abra numa aba normal.</p>`;
    return;
  }
  window.addEventListener('hashchange', rota);
  rota();
  registrarSW();
})();
