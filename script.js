// Troque para a URL do Render quando o backend estiver publicado
const API_BASE_URL = 'https://projeto-quiz-backend-88ne.onrender.com';

async function carregarCategorias() {
  const res = await fetch(`${API_BASE_URL}/api/categories`);
  const categorias = await res.json();
  const select = document.getElementById('filtroCategoria');
  
  categorias.forEach((cat) => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

async function carregarPerguntas(categoria = '') {
  const lista = document.getElementById('lista');
  lista.textContent = 'Carregando perguntas...';

  const url = categoria
    ? `${API_BASE_URL}/api/questions?categoria=${encodeURIComponent(categoria)}`
    : `${API_BASE_URL}/api/questions`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error('Falha ao buscar perguntas');
    const perguntas = await res.json();
    renderizar(perguntas);
  } catch (err) {
    lista.textContent = 'Não foi possível carregar as perguntas agora.';
    console.error(err);
  }
}

function renderizar(perguntas) {
  const lista = document.getElementById('lista');
  lista.innerHTML = '';

  perguntas.forEach((p) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${p.titulo}</h3>
      <div class="meta">${p.categoria} · dificuldade ${p.dificuldade}</div>
      <p>${p.descricao}</p>
      <button type="button">Ver resposta</button>
      <div class="resposta">
        <strong>${p.resposta_correta ? 'Verdadeiro' : 'Falso'}</strong>
        <p>${p.explicacao ?? ''}</p>
        <p class="meta">Fonte: ${p.fonte ?? 'não informada'}</p>
      </div>
    `;
    const botao = card.querySelector('button');
    const resposta = card.querySelector('.resposta');
    botao.addEventListener('click', () => resposta.classList.toggle('show'));
    lista.appendChild(card);
  });
}

document.getElementById('filtroCategoria').addEventListener('change', (e) => {
  carregarPerguntas(e.target.value);
});

carregarCategorias();
carregarPerguntas();