-- ============================================================================
-- PROJETO: RECIFE FALA - ACESSIBILIDADE DIGITAL POR COMANDO DE VOZ
-- CHECKPOINT 1: DDL INICIAL E MODELAGEM DO BANCO DE DADOS (MYSQL 8.0+)
-- EQUIPE: VOZ ATIVA (UNINASSAU RECIFE)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS recife_fala_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE recife_fala_db;

-- 1. Tabela de Cidadãos (Usuários do sistema)
CREATE TABLE IF NOT EXISTS cidadaos (
    id_cidadao INT AUTO_INCREMENT PRIMARY KEY,
    nome_completo VARCHAR(150) NOT NULL,
    cpf VARCHAR(11) NOT NULL UNIQUE COMMENT 'Armazenado apenas dígitos para validação',
    data_nascimento DATE NULL,
    telefone VARCHAR(20) NULL,
    email VARCHAR(120) NULL,
    bairro VARCHAR(100) NULL,
    logradouro VARCHAR(200) NULL,
    consentimento_lgpd BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_cidadao_cpf (cpf)
) ENGINE=InnoDB;

-- 2. Tabela de Preferências de Acessibilidade por Cidadão
CREATE TABLE IF NOT EXISTS preferencias_acessibilidade (
    id_preferencia INT AUTO_INCREMENT PRIMARY KEY,
    id_cidadao INT NOT NULL UNIQUE,
    alto_contraste BOOLEAN NOT NULL DEFAULT FALSE,
    tamanho_fonte ENUM('NORMAL', 'GRANDE', 'EXTRA_GRANDE') NOT NULL DEFAULT 'GRANDE',
    modo_texto_ativo BOOLEAN NOT NULL DEFAULT TRUE,
    velocidade_leitura_voz DECIMAL(2,1) NOT NULL DEFAULT 1.0 COMMENT 'Velocidade TTS (0.8 a 1.5)',
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_pref_cidadao FOREIGN KEY (id_cidadao)
        REFERENCES cidadaos(id_cidadao) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. Catálogo de Serviços Públicos Disponíveis por Voz
CREATE TABLE IF NOT EXISTS servicos_publicos (
    id_servico INT AUTO_INCREMENT PRIMARY KEY,
    codigo_servico VARCHAR(40) NOT NULL UNIQUE COMMENT 'Ex: IPTU_2VIA, CERTIDAO_NEGATIVA',
    nome_servico VARCHAR(120) NOT NULL,
    secretaria_responsavel VARCHAR(100) NOT NULL,
    descricao_simples TEXT NOT NULL COMMENT 'Descrição em linguagem cidadã para leitura em voz alta',
    palavras_chave_voz VARCHAR(255) NOT NULL COMMENT 'Termos reconhecidos pela engine de voz',
    campos_obrigatorios JSON NOT NULL COMMENT 'Lista de dados coletados passo a passo (ex: ["cpf", "endereco"])',
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 4. Sessões de Atendimento Conversacional por Voz
CREATE TABLE IF NOT EXISTS sessoes_atendimento (
    id_sessao INT AUTO_INCREMENT PRIMARY KEY,
    id_cidadao INT NULL COMMENT 'Pode iniciar anônimo antes de informar o CPF',
    canal_origem ENUM('WEB_VOZ', 'TOTEM_PUBLICO', 'MOBILE_WEB') NOT NULL DEFAULT 'WEB_VOZ',
    status_sessao ENUM('INICIADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'TRANSBORDO_HUMANO', 'ABANDONADA') NOT NULL DEFAULT 'INICIADA',
    motivo_transbordo VARCHAR(255) NULL,
    iniciada_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    finalizada_em TIMESTAMP NULL,
    CONSTRAINT fk_sessao_cidadao FOREIGN KEY (id_cidadao)
        REFERENCES cidadaos(id_cidadao) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 5. Solicitações de Serviços e Protocolos Gerados
CREATE TABLE IF NOT EXISTS solicitacoes_protocolos (
    id_solicitacao INT AUTO_INCREMENT PRIMARY KEY,
    numero_protocolo VARCHAR(25) NOT NULL UNIQUE COMMENT 'Formato: REC-AAAAMMDD-XXXX',
    id_sessao INT NOT NULL,
    id_cidadao INT NOT NULL,
    id_servico INT NOT NULL,
    dados_coletados JSON NOT NULL COMMENT 'Respostas confirmadas por voz pelo cidadão',
    resumo_voz TEXT NOT NULL COMMENT 'Texto final lido em voz alta na revisão e confirmação',
    status_solicitacao ENUM('ABERTO', 'EM_PROCESSAMENTO', 'CONCLUIDO', 'CANCELADO') NOT NULL DEFAULT 'CONCLUIDO',
    canal_envio_comprovante ENUM('TELA_VOZ', 'SMS', 'EMAIL') NOT NULL DEFAULT 'TELA_VOZ',
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_protocolo (numero_protocolo),
    CONSTRAINT fk_sol_sessao FOREIGN KEY (id_sessao)
        REFERENCES sessoes_atendimento(id_sessao) ON DELETE RESTRICT,
    CONSTRAINT fk_sol_cidadao FOREIGN KEY (id_cidadao)
        REFERENCES cidadaos(id_cidadao) ON DELETE RESTRICT,
    CONSTRAINT fk_sol_servico FOREIGN KEY (id_servico)
        REFERENCES servicos_publicos(id_servico) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- 6. Histórico de Interações (Logs de Transcrição STT e Respostas TTS)
CREATE TABLE IF NOT EXISTS historico_interacoes_voz (
    id_interacao INT AUTO_INCREMENT PRIMARY KEY,
    id_sessao INT NOT NULL,
    etapa_fluxo ENUM('BOAS_VINDAS', 'ESCUTA', 'CONFIRMACAO_SERVICO', 'COLETA_DADOS', 'REVISAO', 'PROTOCOLO', 'AJUDA') NOT NULL,
    fala_cidadao_transcrita TEXT NULL,
    resposta_assistente_tts TEXT NOT NULL,
    confirmado_pelo_usuario BOOLEAN NULL,
    registrado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_interacao_sessao FOREIGN KEY (id_sessao)
        REFERENCES sessoes_atendimento(id_sessao) ON DELETE CASCADE
) ENGINE=InnoDB;
