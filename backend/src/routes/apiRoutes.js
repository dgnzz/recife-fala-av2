const express = require('express');
const router = express.Router();
const controller = require('../controllers/recifeFalaController');

// Catálogo de serviços públicos
router.get('/servicos', controller.listarServicos);

// Fluxo de sessão e acessibilidade
router.post('/atendimentos', controller.iniciarSessaoAtendimento);
router.get('/atendimentos/:id/historico', controller.obterHistoricoSessao);
router.post('/atendimentos/:id/transbordo', controller.solicitarTransbordoHumano);

// Engine de interpretação de voz (NLU)
router.post('/voz/interpretar', controller.interpretarComandoVoz);

// Consulta de cidadão (CPF)
router.get('/cidadaos/:cpf', controller.buscarCidadaoPorCpf);

// Solicitações e geração/consulta de protocolos
router.post('/solicitacoes', controller.criarSolicitacaoProtocolo);
router.get('/solicitacoes/protocolo/:numero', controller.consultarProtocolo);

module.exports = router;
