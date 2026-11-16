# Modelagem Lógica e Dicionário de Dados — Recife Fala (Checkpoint 1)

## Diagrama Entidade-Relacionamento (MER / Lógico)

```text
+--------------------+       1:1       +------------------------------+
|     cidadaos       |---------------->| preferencias_acessibilidade  |
+--------------------+                 +------------------------------+
| PK id_cidadao      |                 | PK id_preferencia            |
|    nome_completo   |                 | FK id_cidadao (UNIQUE)       |
|    cpf (UNIQUE)    |                 |    alto_contraste            |
|    data_nascimento |                 |    tamanho_fonte             |
|    telefone        |                 |    modo_texto_ativo          |
|    email           |                 |    velocidade_leitura_voz      |
|    bairro          |                 +------------------------------+
|    logradouro      |
|    consentimento_lgpd|
+--------------------+
         | 1
         |
         | N
+--------------------+       1:N       +------------------------------+
| sessoes_atendimento|---------------->|  historico_interacoes_voz    |
+--------------------+                 +------------------------------+
| PK id_sessao       |                 | PK id_interacao              |
| FK id_cidadao      |                 | FK id_sessao                 |
|    canal_origem    |                 |    etapa_fluxo               |
|    status_sessao   |                 |    fala_cidadao_transcrita   |
|    motivo_transbordo|                |    resposta_assistente_tts   |
+--------------------+                 |    confirmado_pelo_usuario   |
         | 1                           +------------------------------+
         |
         | N
+-------------------------+       N:1       +-------------------------+
| solicitacoes_protocolos |---------------->|   servicos_publicos     |
+-------------------------+                 +-------------------------+
| PK id_solicitacao       |                 | PK id_servico           |
|    numero_protocolo (UQ)|                 |    codigo_servico (UQ)  |
| FK id_sessao            |                 |    nome_servico         |
| FK id_cidadao           |                 |    secretaria_responsavel|
| FK id_servico           |                 |    descricao_simples    |
|    dados_coletados(JSON)|                 |    palavras_chave_voz   |
|    resumo_voz           |                 |    campos_obrigatorios  |
|    status_solicitacao   |                 |    ativo                |
+-------------------------+                 +-------------------------+
```

## Justificativa de Arquitetura de Dados
* **Rastreabilidade da Conversa (`historico_interacoes_voz`):** Permite auditar cada etapa do fluxo definido na AV1 (`Boas-vindas > Escuta > Confirmação > Coleta > Revisão > Protocolo`), facilitando a melhoria do reconhecimento de voz e a repetição da última fala caso o cidadão clique em "Repetir instrução".
* **Acessibilidade Persistente (`preferencias_acessibilidade`):** Salva o perfil visual e auditivo do cidadão (alto contraste, fonte extra grande, velocidade da voz TTS) para atendimentos futuros.
* **Flexibilidade de Serviços (`campos_obrigatorios` e `dados_coletados` em `JSON`):** Permite adicionar novos serviços da Prefeitura do Recife (IPTU, Saúde, Certidões, Emlurb) sem alterar a estrutura física das tabelas.
