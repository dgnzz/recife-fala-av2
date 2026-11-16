-- ============================================================================
-- PROJETO: RECIFE FALA - CARGA INICIAL DE DADOS (DML SEED)
-- EQUIPE: VOZ ATIVA (UNINASSAU RECIFE)
-- ============================================================================

USE recife_fala_db;

-- Inserção de Cidadãos fictícios para testes do MVP
INSERT INTO cidadaos (nome_completo, cpf, data_nascimento, telefone, email, bairro, logradouro, consentimento_lgpd)
VALUES
('Maria das Graças Silva', '12345678901', '1954-04-18', '81998765432', 'maria.gracas@email.com', 'Graças', 'Rua Amélia, 240', TRUE),
('Antônio Carlos Bezerra', '98765432100', '1962-09-10', '81991234567', 'antonio.bezerra@email.com', 'Boa Viagem', 'Av. Conselheiro Aguiar, 1520', TRUE),
('Severina Ferreira dos Santos', '45678912309', '1949-12-03', '81987654321', NULL, 'Casa Amarela', 'Estrada do Arraial, 3100', TRUE);

-- Preferências de Acessibilidade
INSERT INTO preferencias_acessibilidade (id_cidadao, alto_contraste, tamanho_fonte, modo_texto_ativo, velocidade_leitura_voz)
VALUES
(1, TRUE, 'EXTRA_GRANDE', TRUE, 0.9),
(2, FALSE, 'GRANDE', TRUE, 1.0),
(3, TRUE, 'EXTRA_GRANDE', FALSE, 0.8);

-- Catálogo de Serviços Públicos da Prefeitura do Recife
INSERT INTO servicos_publicos (codigo_servico, nome_servico, secretaria_responsavel, descricao_simples, palavras_chave_voz, campos_obrigatorios)
VALUES
(
    'IPTU_2VIA',
    '2ª Via do IPTU',
    'Secretaria de Finanças (SEFIN)',
    'Emissão rápida do boleto atualizado do IPTU do seu imóvel no Recife.',
    'iptu, segunda via, 2 via, boleto iptu, imposto predial, pagar iptu',
    JSON_ARRAY('cpf', 'endereco_imovel')
),
(
    'CERTIDAO_NEGATIVA',
    'Certidão Negativa de Débitos Municipais',
    'Secretaria de Finanças (SEFIN)',
    'Documento oficial que comprova que você não possui pendências financeiras com a Prefeitura.',
    'certidao, negativa, debitos, nada consta, certidao municipal',
    JSON_ARRAY('cpf')
),
(
    'AGENDAMENTO_SAUDE',
    'Agendamento de Consulta na Rede Municipal',
    'Secretaria de Saúde (SESAU)',
    'Marcação de atendimento clínico na Unidade de Saúde da Família ou Policlínica do seu bairro.',
    'consulta, medico, posto de saude, agendamento, policlinica, exame',
    JSON_ARRAY('cpf', 'bairro', 'especialidade')
),
(
    'CHAMADO_URBANO',
    'Solicitação de Manutenção Urbana (Emlurb)',
    'Autarquia de Manutenção e Limpeza Urbana (EMLURB)',
    'Registro de pedido para tapa-buraco, troca de lâmpada de poste ou limpeza urbana na sua rua.',
    'buraco, poste, lampada queimada, lixo, entulho, poda, emlurb, rua',
    JSON_ARRAY('cpf', 'endereco_ocorrencia', 'descricao_problema')
);

-- Sessão de atendimento concluída de exemplo
INSERT INTO sessoes_atendimento (id_cidadao, canal_origem, status_sessao, iniciada_em, finalizada_em)
VALUES (1, 'WEB_VOZ', 'CONCLUIDA', NOW() - INTERVAL 10 MINUTE, NOW() - INTERVAL 7 MINUTE);

-- Protocolo gerado de exemplo
INSERT INTO solicitacoes_protocolos (
    numero_protocolo, id_sessao, id_cidadao, id_servico,
    dados_coletados, resumo_voz, status_solicitacao, canal_envio_comprovante
)
VALUES (
    'REC-20261116-0001',
    1,
    1,
    1,
    JSON_OBJECT('cpf', '12345678901', 'endereco_imovel', 'Rua Amélia, 240 - Graças', 'exercicio', '2026', 'valor', 'R$ 342,80', 'codigo_barras', '81690000003 42800010202 61130001234 5'),
    'Solicitação de 2ª via do IPTU 2026 para o imóvel na Rua Amélia, 240, Graças, concluída com sucesso. Seu protocolo é REC-20261116-0001.',
    'CONCLUIDO',
    'TELA_VOZ'
);

-- Histórico de interação por voz da sessão de exemplo
INSERT INTO historico_interacoes_voz (id_sessao, etapa_fluxo, fala_cidadao_transcrita, resposta_assistente_tts, confirmado_pelo_usuario)
VALUES
(1, 'BOAS_VINDAS', NULL, 'Olá! Bem-vindo ao Recife Fala. Toque no botão e diga qual serviço da Prefeitura você precisa hoje.', NULL),
(1, 'ESCUTA', 'Quero tirar a segunda via do meu IPTU', 'Entendi! Você quer emitir a 2ª via do IPTU, certo? Diga Sim ou Não.', TRUE),
(1, 'COLETA_DADOS', 'Meu CPF é 123 456 789 01', 'Obrigada, Dona Maria das Graças. Confirma o endereço Rua Amélia, 240, nas Graças?', TRUE),
(1, 'PROTOCOLO', 'Sim, confirmo', 'Tudo certo! Sua 2ª via do IPTU foi gerada. O número do seu protocolo é R E C 2026 11 16 0001.', TRUE);
