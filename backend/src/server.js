const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { testarConexao } = require('./config/db');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Rota de Health Check (valida API + Banco de Dados MySQL)
app.get('/api/health', async (req, res) => {
  const dbOk = await testarConexao();
  res.status(dbOk ? 200 : 503).json({
    projeto: 'Recife Fala API',
    status_api: 'ONLINE',
    banco_dados: dbOk ? 'CONECTADO' : 'ERRO_CONEXAO',
    timestamp: new Date().toISOString()
  });
});

app.use('/api', apiRoutes);

app.listen(PORT, async () => {
  console.log(`====================================================`);
  console.log(` Recife Fala API rodando em http://localhost:${PORT}`);
  console.log(`====================================================`);
  await testarConexao();
});
