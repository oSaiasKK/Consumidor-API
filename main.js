const BASE = 'https://api.rodrigoribeiro.net';

function setDebug(txt){document.getElementById('debug').textContent = typeof txt === 'string'? txt : JSON.stringify(txt, null, 2)}
function setConsole(txt){document.getElementById('console').textContent = typeof txt === 'string'? txt : JSON.stringify(txt, null, 2)}

function saveToken(token){localStorage.setItem('rb_token', token); renderToken();}
function getToken(){return localStorage.getItem('rb_token')}
function removeToken(){localStorage.removeItem('rb_token'); renderToken();}

function renderToken(){const t=getToken(); document.getElementById('token').textContent = t? t : 'nenhum'}

async function apiFetch(path, opts={}){
  const headers = opts.headers || {};
  if(opts.auth !== false){
    const tk = getToken();
    if(tk) headers['Authorization'] = 'Bearer '+tk;
  }
  if(opts.body && !(opts.body instanceof FormData)){
    headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(opts.body);
  }
  const res = await fetch(BASE + path, {...opts, headers});
  const text = await res.text();
  let data;
  try{ data = JSON.parse(text) }catch(e){ data = {status_code: res.status, success:false, message:'Resposta não JSON', raw:text} }
  setDebug(data);
  setConsole(data);
  if(!res.ok){ throw data }
  return data;
}

// Auth handlers
document.getElementById('btn-registrar').addEventListener('click', async ()=>{
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  try{
    const r = await apiFetch('/registrar',{method:'POST', body:{email, senha}, auth:false});
    alert(r.message || 'Registrado');
  }catch(err){console.error(err); alert('Erro: '+(err.message||JSON.stringify(err)))}
});

document.getElementById('btn-login').addEventListener('click', async ()=>{
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;
  try{
    const r = await apiFetch('/login',{method:'POST', body:{email, senha}, auth:false});
    const token = r.response && r.response.token;
    if(token){ saveToken(token); alert('Login efetuado'); }
  }catch(err){console.error(err); alert('Erro login: '+(err.message||JSON.stringify(err)))}
});

document.getElementById('btn-logout').addEventListener('click', ()=>{ removeToken(); alert('Token removido')});
document.getElementById('btn-copy').addEventListener('click', ()=>{ const t=getToken(); if(!t) return alert('Sem token'); navigator.clipboard.writeText(t).then(()=>alert('Copiado'))});

// Produtos
async function listarProdutos(){
  try{
    const r = await apiFetch('/produtos',{method:'GET', auth:false});
    const container = document.getElementById('produtos-list');
    if(r.response && Array.isArray(r.response)){
      const html = r.response.map(p=>`<div class=card style="margin:6px 0;padding:10px"><strong>${p.descricao}</strong> <span class=badge>R$ ${p.valor}</span><div class=small>ID: ${p.id}</div><div style="margin-top:6px"><button onclick="buscarProduto(${p.id})">Abrir</button></div></div>`).join('\n');
      container.innerHTML = html;
    } else {
      container.textContent = JSON.stringify(r.response);
    }
  }catch(e){console.error(e); alert('Erro ao listar')}
}

window.buscarProduto = async function(id){
  try{
    const r = await apiFetch(`/produto?id=${encodeURIComponent(id)}`,{method:'GET', auth:false});
    alert('Produto: '+JSON.stringify(r.response));
  }catch(e){console.error(e); alert('Erro buscar produto')}
}

document.getElementById('btn-list-produtos').addEventListener('click', listarProdutos);
document.getElementById('btn-get-produto').addEventListener('click', ()=>{
  const id = document.getElementById('produto-id').value; if(!id) return alert('Informe id'); buscarProduto(id);
});

document.getElementById('btn-cadastrar-produto').addEventListener('click', async ()=>{
  const desc = document.getElementById('produto-desc').value; const valor = parseFloat(document.getElementById('produto-valor').value);
  if(!desc || isNaN(valor)) return alert('Preencha descrição e valor');
  try{
    const r = await apiFetch('/produto/cadastrar',{method:'POST', body:{descricao:desc, valor}, auth:true});
    alert(r.message || 'Produto cadastrado');
    listarProdutos();
  }catch(e){console.error(e); alert('Erro cadastrar produto: '+(e.message||JSON.stringify(e)))}
});

// Livros
async function listarLivros(){
  try{
    const r = await apiFetch('/livros',{method:'GET', auth:false});
    const el = document.getElementById('livros-list');
    if(r.response && Array.isArray(r.response)){
      el.innerHTML = r.response.map(l=>`<div style="margin:6px 0;padding:8px;background:#f8fafc;border-radius:8px"><strong>${l.titulo}</strong><div class=small>R$ ${l.valor} • ID ${l.id}</div></div>`).join('');
    } else el.textContent = JSON.stringify(r.response);
  }catch(e){console.error(e); alert('Erro livros')}
}

document.getElementById('btn-list-livros').addEventListener('click', listarLivros);
document.getElementById('btn-get-livro').addEventListener('click', async ()=>{
  const id = document.getElementById('livro-id').value; if(!id) return alert('Informe id');
  try{
    const r = await apiFetch(`/livro?id=${encodeURIComponent(id)}`,{method:'GET', auth:false});
    alert('Livro: '+JSON.stringify(r.response));
  }catch(e){console.error(e); alert('Erro buscar livro')}
});

document.getElementById('btn-cadastrar-livro').addEventListener('click', async ()=>{
  const titulo = document.getElementById('livro-titulo').value;
  const resumo = document.getElementById('livro-resumo').value;
  const capa = document.getElementById('livro-capa').value;
  const valor = parseFloat(document.getElementById('livro-valor').value);
  if(!titulo || !resumo || !capa || isNaN(valor)) return alert('Preencha todos');
  try{
    const r = await apiFetch('/livro/cadastrar',{method:'POST', body:{titulo,resumo,capa,valor}, auth:true});
    alert(r.message || 'Livro cadastrado');
    listarLivros();
  }catch(e){console.error(e); alert('Erro cadastrar livro')}
});

// Visao computacional
const fileInput = document.getElementById('file-image');
fileInput.addEventListener('change', ()=>{
  const f = fileInput.files[0]; if(!f) return; const fr = new FileReader();
  fr.onload = ()=>{
    const data = fr.result; document.getElementById('local-preview').innerHTML = `<img class=preview src="${data}" />`;
    // store base64 without prefix
    window._lastImageB64 = data.split(',')[1];
  };
  fr.readAsDataURL(f);
});

async function classificar(){
  if(!window._lastImageB64) return alert('Escolha uma imagem');
  try{
    const r = await apiFetch('/classificar',{method:'POST', body:{image: window._lastImageB64}, auth:true});
    const out = r.response || r;
    document.getElementById('cv-result').innerHTML = `<div class=small>Classe: <strong>${out.class||out.response?.class||'-'}</strong> — score: ${out.score ?? out.response?.score ?? '-'} </div>`;
  }catch(e){console.error(e); alert('Erro classificar: '+(e.message||JSON.stringify(e)))}
}

async function detectar(){
  if(!window._lastImageB64) return alert('Escolha uma imagem');
  try{
    const r = await apiFetch('/detectar',{method:'POST', body:{image: window._lastImageB64, preview:true}, auth:true});
    // r.response may contain objects and preview_img
    const resp = r.response || r;
    if(resp.objects) {
      const list = resp.objects.map(o=>`<div class="small">${o.class} — ${Math.round((o.score||0)*100)}% • box: ${JSON.stringify(o.boundingbox)}</div>`).join('');
      document.getElementById('cv-result').innerHTML = list;
    }
    if(resp.preview_img){
      document.getElementById('cv-preview-img').innerHTML = `<img class=preview src="data:image/png;base64,${resp.preview_img}" />`;
    }
  }catch(e){console.error(e); alert('Erro detectar: '+(e.message||JSON.stringify(e)))}
}

document.getElementById('btn-classificar').addEventListener('click', classificar);
document.getElementById('btn-detectar').addEventListener('click', detectar);

// Init
renderToken();
setConsole('Pronto — carregue a página e use os controles.');