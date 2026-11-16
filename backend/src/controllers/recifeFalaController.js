const { pool } = require('../config/db');
const { identificarIntencao } = require('../services/vozIntentService');

// GET /api/servicos
async function listarServicos(req, res) {
  try {
    const [rows] = await pool.query(
      'SELECT id_servico, codigo_servico, nome_servico, secretaria_responsavel, descricao_simples, campos_obrigatorios FROM servicos_publicos WHERE ativo = TRUE ORDER BY id_servico ASC'
    );
    return res.json({ total: rows.length, servicos: rows });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao listar serviços públicos', detalhe: error.message });
  }
}

// POST /api/atendimentos
async function iniciarSessaoAtendimento(req, res) {
  const { canal_origem = 'WEB_VOZ', cpf } = req.body || {};

  try {
    let id_cidadao = null;
    let preferencias = {
      alto_contraste: false,
      tamanho_fonte: 'GRANDE',
      modo_texto_ativo: true,
      velocidade_leitura_voz: 1.0
    };

    if (cpf) {
      const cpfLimpo = String(cpf).replace(/\D/g, '');
      const [cidadaos] = await pool.query('SELECT id_cidadao, nome_completo FROM cidadaos WHERE cpf = ?', [cpfLimpo]);
      if (cidadaos.length > 0) {
        id_cidadao = cidadaos[0].id_cidadao;
        const [prefs] = await pool.query('SELECT * FROM preferencias_acessibilidade WHERE id_cidadao = ?', [id_cidadao]);
        if (prefs.length > 0) preferencias = prefs[0];
      }
    }

    const mensagemBoasVindas =
      'Olá! Bem-vindo ao Recife Fala. Toque no botão grande de microfone e diga qual serviço da Prefeitura você precisa hoje.';

    const [result] = await pool.query(
      'INSERT INTO sessoes_atendimento (id_cidadao, canal_origem, status_sessao) VALUES (?, ?, ?)',
      [id_cidadao, canal_origem, 'INICIADA']
    );

    const id_sessao = result.insertId;

    await pool.query(
      'INSERT INTO historico_interacoes_voz (id_sessao, etapa_fluxo, resposta_assistente_tts) VALUES (?, ?, ?)',
      [id_sessao, 'BOAS_VINDAS', mensagemBoasVindas]
    );

    return res.status(201).json({
      id_sessao,
      status_sessao: 'INICIADA',
      preferencias_acessibilidade: preferencias,
      mensagem_tts: mensagemBoasVindas
    });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao iniciar sessão de atendimento', detalhe: error.message });
  }
}

// POST /api/voz/interpretar
async function interpretarComandoVoz(req, res) {
  const { id_sessao, transcricao } = req.body || {};

  if (!transcricao) {
    return res.status(400).json({ erro: 'O campo "transcricao" é obrigatório.' });
  }

  try {
    const [servicos] = await pool.query('SELECT * FROM servicos_publicos WHERE ativo = TRUE');
    const resultado = identificarIntencao(transcricao, servicos);

    if (id_sessao) {
      await pool.query(
        'UPDATE sessoes_atendimento SET status_sessao = ? WHERE id_sessao = ?',
        ['EM_ANDAMENTO', id_sessao]
      );

      await pool.query(
        'INSERT INTO historico_interacoes_voz (id_sessao, etapa_fluxo, fala_cidadao_transcrita, resposta_assistente_tts) VALUES (?, ?, ?, ?)',
        [id_sessao, 'ESCUTA', transcricao, resultado.mensagem_tts]
      );
    }

    return res.json(resultado);
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao interpretar comando de voz', detalhe: error.message });
  }
}

// GET /api/cidadaos/:cpf
async function buscarCidadaoPorCpf(req, res) {
  const cpfLimpo = String(req.params.cpf || '').replace(/\D/g, '');

  if (cpfLimpo.length !== 11) {
    return res.status(400).json({ erro: 'CPF inválido. Informe os 11 dígitos.' });
  }

  try {
    const [rows] = await pool.query(
      `SELECT c.id_cidadao, c.nome_completo, c.cpf, c.telefone, c.email, c.bairro, c.logradouro,
              p.alto_contraste, p.tamanho_fonte, p.modo_texto_ativo, p.velocidade_leitura_voz
       FROM cidadaos c
       LEFT JOIN preferencias_acessibilidade p ON c.id_cidadao = p.id_cidadao
       WHERE c.cpf = ?`,
      [cpfLimpo]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        encontrado: false,
        mensagem_tts: 'Não encontrei um cadastro com esse CPF. Vamos preencher seus dados rapidamente por voz.'
      });
    }

    const cidadao = rows[0];
    return res.json({
      encontrado: true,
      cidadao,
      mensagem_tts: `Olá, ${cidadao.nome_completo}. Localizei seu cadastro no bairro ${cidadao.bairro || 'Recife'}.`
    });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao consultar cidadão', detalhe: error.message });
  }
}

// POST /api/solicitacoes
async function criarSolicitacaoProtocolo(req, res) {
  const {
    id_sessao,
    cpf,
    nome_completo = 'Cidadão Recifense',
    bairro = 'Recife',
    logradouro = 'Não informado',
    telefone = null,
    email = null,
    codigo_servico,
    dados_coletados = {},
    canal_envio_comprovante = 'TELA_VOZ'
  } = req.body || {};

  if (!cpf || !codigo_servico) {
    return res.status(400).json({ erro: 'Os campos "cpf" e "codigo_servico" são obrigatórios.' });
  }

  const cpfLimpo = String(cpf).replace(/\D/g, '');
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Verifica ou cria o cidadão
    let [cidadaos] = await conn.query('SELECT id_cidadao, nome_completo FROM cidadaos WHERE cpf = ?', [cpfLimpo]);
    let id_cidadao;

    if (cidadaos.length === 0) {
      const [novoCidadao] = await conn.query(
        'INSERT INTO cidadaos (nome_completo, cpf, telefone, email, bairro, logradouro, consentimento_lgpd) VALUES (?, ?, ?, ?, ?, ?, TRUE)',
        [nome_completo, cpfLimpo, telefone, email, bairro, logradouro]
      );
      id_cidadao = novoCidadao.insertId;
      await conn.query('INSERT INTO preferencias_acessibilidade (id_cidadao) VALUES (?)', [id_cidadao]);
    } else {
      id_cidadao = cidadaos[0].id_cidadao;
    }

    // 2. Busca o serviço público
    const [servicos] = await conn.query(
      'SELECT id_servico, nome_servico FROM servicos_publicos WHERE codigo_servico = ? AND ativo = TRUE',
      [codigo_servico]
    );
    if (servicos.length === 0) {
      await conn.rollback();
      return res.status(404).json({ erro: `Serviço "${codigo_servico}" não encontrado.` });
    }
    const servico = servicos[0];

    // 3. Garante uma sessão de atendimento válida
    let sessaoIdFinal = id_sessao;
    if (!sessaoIdFinal) {
      const [novaSessao] = await conn.query(
        'INSERT INTO sessoes_atendimento (id_cidadao, canal_origem, status_sessao) VALUES (?, ?, ?)',
        [id_cidadao, 'WEB_VOZ', 'CONCLUIDA']
      );
      sessaoIdFinal = novaSessao.insertId;
    }

    // 4. Gera número de protocolo único: REC-AAAAMMDD-XXXX
    const hoje = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const aleatorio = Math.floor(1000 + Math.random() * 9000);
    const numero_protocolo = `REC-${hoje}-${aleatorio}`;

    const resumo_voz = `Sua solicitação de ${servico.nome_servico} foi concluída com sucesso! O número do seu protocolo é ${numero_protocolo}.`;

    // 5. Insere a solicitação
    const [solResult] = await conn.query(
      `INSERT INTO solicitacoes_protocolos
       (numero_protocolo, id_sessao, id_cidadao, id_servico, dados_coletados, resumo_voz, status_solicitacao, canal_envio_comprovante)
       VALUES (?, ?, ?, ?, ?, ?, 'CONCLUIDO', ?)`,
      [
        numero_protocolo,
        sessaoIdFinal,
        id_cidadao,
        servico.id_servico,
        JSON.stringify(dados_coletados),
        resumo_voz,
        canal_envio_comprovante
      ]
    );

    // 6. Atualiza sessão e grava log final
    await conn.query(
      'UPDATE sessoes_atendimento SET id_cidadao = ?, status_sessao = ?, finalizada_em = NOW() WHERE id_sessao = ?',
      [id_cidadao, 'CONCLUIDA', sessaoIdFinal]
    );

    await conn.query(
      'INSERT INTO historico_interacoes_voz (id_sessao, etapa_fluxo, resposta_assistente_tts, confirmado_pelo_usuario) VALUES (?, ?, ?, TRUE)',
      [sessaoIdFinal, 'PROTOCOLO', resumo_voz]
    );

    await conn.commit();

    return res.status(201).json({
      id_solicitacao: solResult.insertId,
      numero_protocolo,
      servico: servico.nome_servico,
      status: 'CONCLUIDO',
      resumo_voz
    });
  } catch (error) {
    await conn.rollback();
    return res.status(500).json({ erro: 'Erro ao registrar solicitação e gerar protocolo', detalhe: error.message });
  } finally {
    conn.release();
  }
}

// GET /api/solicitacoes/protocolo/:numero
async function consultarProtocolo(req, res) {
  const numero = String(req.params.numero || '').toUpperCase().trim();

  try {
    const [rows] = await pool.query(
      `SELECT sp.numero_protocolo, sp.status_solicitacao, sp.dados_coletados, sp.resumo_voz, sp.criado_em,
              s.nome_servico, s.secretaria_responsavel, c.nome_completo
       FROM solicitacoes_protocolos sp
       JOIN servicos_publicos s ON sp.id_servico = s.id_servico
       JOIN cidadaos c ON sp.id_cidadao = c.id_cidadao
       WHERE sp.numero_protocolo = ?`,
      [numero]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        erro: 'Protocolo não encontrado.',
        mensagem_tts: 'Não localizei nenhum atendimento com esse número de protocolo. Verifique e tente novamente.'
      });
    }

    const item = rows[0];
    return res.json({
      protocolo: item,
      mensagem_tts: `O protocolo ${item.numero_protocolo}, referente ao serviço ${item.nome_servico}, está com status ${item.status_solicitacao}.`
    });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao consultar protocolo', detalhe: error.message });
  }
}

// POST /api/atendimentos/:id/transbordo
async function solicitarTransbordoHumano(req, res) {
  const { id } = req.params;
  const { motivo = 'Solicitado pelo cidadão pelo botão de ajuda' } = req.body || {};

  try {
    const mensagem_tts =
      'Você acionou o suporte humano. Um atendente da Prefeitura do Recife já recebeu seu histórico e continuará o atendimento.';

    await pool.query(
      'UPDATE sessoes_atendimento SET status_sessao = ?, motivo_transbordo = ?, finalizada_em = NOW() WHERE id_sessao = ?',
      ['TRANSBORDO_HUMANO', motivo, id]
    );

    await pool.query(
      'INSERT INTO historico_interacoes_voz (id_sessao, etapa_fluxo, resposta_assistente_tts) VALUES (?, ?, ?)',
      [id, 'AJUDA', mensagem_tts]
    );

    return res.json({
      id_sessao: Number(id),
      status_sessao: 'TRANSBORDO_HUMANO',
      mensagem_tts
    });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao acionar transbordo humano', detalhe: error.message });
  }
}

// GET /api/atendimentos/:id/historico
async function obterHistoricoSessao(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      'SELECT etapa_fluxo, fala_cidadao_transcrita, resposta_assistente_tts, confirmado_pelo_usuario, registrado_em FROM historico_interacoes_voz WHERE id_sessao = ? ORDER BY id_interacao ASC',
      [id]
    );
    return res.json({ id_sessao: Number(id), interacoes: rows });
  } catch (error) {
    return res.status(500).json({ erro: 'Erro ao buscar histórico da sessão', detalhe: error.message });
  }
}

module.exports = {
  listarServicos,
  iniciarSessaoAtendimento,
  interpretarComandoVoz,
  buscarCidadaoPorCpf,
  criarSolicitacaoProtocolo,
  consultarProtocolo,
  solicitarTransbordoHumano,
  obterHistoricoSessao
};
