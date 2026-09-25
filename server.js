require('dotenv').config();
const http = require('http');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const PORT = process.env.PORT || 3000;
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || '*';

function enviarJSON(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN
  });
  res.end(JSON.stringify(payload));
}

const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

// Serve os arquivos da pasta public (o frontend). "/" cai em index.html.
function servirArquivoEstatico(res, pathname) {
  const caminhoRelativo = pathname === '/' ? '/index.html' : pathname;
  const caminhoArquivo = path.join(PUBLIC_DIR, caminhoRelativo);

  // Impede sair da pasta public (ex.: "/../server.js")
  if (!caminhoArquivo.startsWith(PUBLIC_DIR)) {
    return enviarJSON(res, 403, { erro: 'Acesso negado.' });
  }

  fs.readFile(caminhoArquivo, (err, conteudo) => {
    if (err) {
      return enviarJSON(res, 404, { erro: 'Rota não encontrada.' });
    }
    const ext = path.extname(caminhoArquivo);
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(conteudo);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const { pathname } = url;

  if (req.method !== 'GET') {
    return enviarJSON(res, 405, { erro: 'Método não permitido. Esta API só aceita GET.' });
  }

  try {
    // GET /api/questions       -> todas as perguntas
    // GET /api/questions?categoria=Backend -> filtradas por categoria
    if (pathname === '/api/questions') {
      const categoria = url.searchParams.get('categoria');
      let query = supabase.from('quiz').select('*');
      if (categoria) query = query.eq('categoria', categoria);

      const { data, error } = await query;
      if (error) throw error;
      return enviarJSON(res, 200, data);
    }

    // GET /api/questions/:id   -> uma pergunta específica
    const matchId = pathname.match(/^\/api\/questions\/([0-9a-fA-F-]+)$/);
    if (matchId) {
      const { data, error } = await supabase
        .from('quiz')
        .select('*')
        .eq('id', matchId[1])
        .single();

      if (error) throw error;
      if (!data) return enviarJSON(res, 404, { erro: 'Pergunta não encontrada.' });
      return enviarJSON(res, 200, data);
    }

    // GET /api/categories      -> lista de categorias existentes
    if (pathname === '/api/categories') {
      const { data, error } = await supabase.from('quiz').select('categoria');
      if (error) throw error;
      const categorias = [...new Set(data.map((q) => q.categoria))];
      return enviarJSON(res, 200, categorias);
    }

    // Qualquer rota que não seja da API tenta servir um arquivo da pasta public
    if (!pathname.startsWith('/api/')) {
      return servirArquivoEstatico(res, pathname);
    }

    return enviarJSON(res, 404, { erro: 'Rota não encontrada.' });

  } catch (err) {
    console.error('Erro ao consultar o Supabase:', err.message);
    return enviarJSON(res, 500, { erro: 'Erro interno ao consultar o banco de dados.' });
  }
});

server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));