# Recife Fala — Assistente por Voz para Serviços Públicos

Projeto da equipe **Voz Ativa** (UNINASSAU Recife - Graças | Tópicos Integradores - Turma MB | 2026.2) desenvolvido para o desafio **Acessibilidade Digital por Comando de Voz nos Serviços Públicos** do Banco de Oportunidades da Prefeitura do Recife.

Protótipo navegável construído na AV1: [Visualizar no Canva](https://canva.link/pawa3zme6jzk0nu)

## Integrantes do Grupo
- **José Diogo Santos da Luz** (01725870) — Líder Técnico, Back-end e Banco de Dados (MySQL)
- **Ludmilla Kimberlie** (01864563) — Front-end e Acessibilidade
- **Rodrigo Santos** (01812779) — Back-end e Integração de Voz
- **Victor Guilherme** (01849176) — Testes e Documentação

## Sobre o Projeto
Muitos cidadãos — principalmente idosos, pessoas com deficiência visual ou motora e quem tem pouca familiaridade com tecnologia — enfrentam dificuldade para navegar em menus extensos e preencher formulários digitais. O **Recife Fala** permite que o cidadão peça o serviço falando naturalmente (como *"quero a segunda via do IPTU"*), confirme cada dado passo a passo e receba seu protocolo em texto ampliado e áudio.

## Tecnologias Utilizadas
- **Back-end:** Node.js com Express
- **Banco de Dados:** MySQL 8
- **Front-end (próxima etapa):** HTML, CSS (com modo alto contraste) e JavaScript usando a Web Speech API

## Status do Desenvolvimento
- [x] **Checkpoint 1:** Criação do repositório, modelagem lógica e scripts SQL (DDL e DML).
- [x] **Checkpoint 2:** Conexão com o MySQL e endpoints principais da API funcionando.
- [ ] **Checkpoint 3:** Tela web acessível consumindo a API e capturando voz pelo navegador.

## Organização das Pastas
- `database/` — Scripts `01_ddl_schema.sql` (criação das tabelas) e `02_dml_seed.sql` (dados iniciais para teste).
- `backend/` — API REST em Node.js (`config`, `controllers`, `routes` e `services`).
- `docs/` — Modelagem lógica do banco e dicionário de dados.

## Como Rodar Localmente

### 1. Banco de Dados (MySQL)
Execute primeiro o arquivo `database/01_ddl_schema.sql` para criar o banco `recife_fala_db` e as tabelas, e em seguida rode o `database/02_dml_seed.sql` para inserir os cidadãos, serviços e protocolos de exemplo.

### 2. Back-end (Node.js)
```bash
cd backend
cp .env.example .env
# Abra o arquivo .env criado e preencha a senha do seu MySQL local
npm install
npm run dev
```

### 3. Endpoints Disponíveis (Checkpoint 2)

* `GET /api/health` — Verifica se a API e o banco MySQL estão conectados.

* `GET /api/servicos` — Lista os serviços públicos cadastrados (2ª via do IPTU, Certidão Negativa, Agendamento de Saúde e Manutenção Urbana).

* `POST /api/atendimentos` — Inicia uma sessão de atendimento por voz e carrega as preferências de acessibilidade do cidadão.
  * Exemplo de JSON: `{ "cpf": "12345678901", "canal_origem": "WEB_VOZ" }`

* `POST /api/voz/interpretar` — Recebe a frase falada pelo cidadão e identifica o serviço desejado.
  * Exemplo de JSON: `{ "id_sessao": 1, "transcricao": "Quero tirar a segunda via do IPTU" }`

* `GET /api/cidadaos/:cpf` — Busca o cadastro e as configurações de acessibilidade pelo CPF (ex.: `/api/cidadaos/12345678901`).

* `POST /api/solicitacoes` — Grava a solicitação no banco e gera o protocolo no formato `REC-AAAAMMDD-XXXX`.
  * Exemplo de JSON: `{ "cpf": "12345678901", "codigo_servico": "IPTU_2VIA", "dados_coletados": { "endereco_imovel": "Rua Amélia, 240" } }`

* `GET /api/solicitacoes/protocolo/:numero` — Consulta o andamento de um protocolo (ex.: `/api/solicitacoes/protocolo/REC-20261116-0001`).

* `POST /api/atendimentos/:id/transbordo` — Registra a transferência da sessão para um atendente humano caso o cidadão peça ajuda.
