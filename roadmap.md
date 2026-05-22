# roadmap.md — Roadmap de Desenvolvimento do Sistema de Precificação KL Engenharia

**Versão:** 1.0  
**Metodologia:** Desenvolvimento Iterativo com Entregas por Fase  
**Duração Total Estimada:** 16 semanas (4 meses)  
**Equipe Mínima:** 1 desenvolvedor full-stack sênior + 1 gestor de projeto (parcial)

---

## Visão Geral do Fluxo (BPMN Simplificado)

```
[FASE 1: DADOS]──►[FASE 2: ENGINE]──►[FASE 3: INTERFACE]──►[FASE 4: HOMOLOGAÇÃO]
  Semanas 1-4       Semanas 5-8        Semanas 9-13           Semanas 14-16

  ┌───────────┐    ┌───────────┐      ┌───────────┐          ┌───────────┐
  │ Modelagem │    │  Fórmulas │      │  Tela de  │          │  Testes   │
  │    BD     │───►│  Markup   │─────►│ Orçamento │─────────►│  com      │
  │ Catálogo  │    │  DRE      │      │  + PDF    │          │  Equipe   │
  │  Insumos  │    │  + VI     │      │           │          │  + POP    │
  └───────────┘    └───────────┘      └───────────┘          └───────────┘
       ▲                ▲                  ▲                       ▲
  Entregável:      Entregável:        Entregável:           Entregável:
  BD migrado +     API funcional +    App completo +        Manual + POP +
  API de catálogo  testes de stress   geração de PDF        Sistema em Produção
```

---

## Fase 1 — Estruturação de Dados (Semanas 1–4)

**Objetivo:** Criar a fundação de dados do sistema — banco modelado, catálogo de insumos importado e parâmetros da DRE 2025 configurados como single source of truth.

**Critério de conclusão:** A API de catálogo retorna componentes com preços corretos; os parâmetros da DRE estão armazenados e bloqueados para edição não autorizada.

---

### Semana 1 — Setup de Ambiente e Modelagem

| Tarefa | Descrição | Responsável | Critério de Aceite |
|---|---|---|---|
| 1.1 | Setup do repositório Git com estrutura de pastas (`backend/`, `frontend/`, `infra/`) | Dev | Repositório acessível, `.gitignore` configurado |
| 1.2 | Docker Compose com PostgreSQL 16 + FastAPI + pgAdmin | Dev | `docker compose up` sobe todos os serviços sem erro |
| 1.3 | Criação do schema inicial via Alembic (migration `0001_initial`) | Dev | Tabelas `componentes`, `precos_componentes`, `dre_parametros`, `orcamentos`, `itens_orcamento`, `usuarios` criadas |
| 1.4 | Implementação dos constraints de integridade referencial | Dev | FK violations rejeitadas pelo banco; `NUMERIC` em todos os campos monetários |
| 1.5 | Configuração do `pgaudit` para log de `INSERT/UPDATE/DELETE` em tabelas críticas | Dev | Alterações em `dre_parametros` e `precos_componentes` aparecem no log |

**Decisão de arquitetura (Semana 1):**  
Definir com o gestor KL a estratégia de codificação de `codigo_fabricante`. A planilha atual tem formatos heterogêneos (`F202AC-40/0,03`, `1.2486844E7`, `01.05.10.0023`). A normalização deve acontecer nesta etapa — não depois.

---

### Semana 2 — Importação do Catálogo de Insumos

| Tarefa | Descrição | Responsável | Critério de Aceite |
|---|---|---|---|
| 2.1 | Script de ETL para ler `Registro de Insumos` da planilha Excel | Dev | Script Python parseia todas as linhas sem erro; duplicatas detectadas |
| 2.2 | Normalização de `codigo_fabricante` (remover notação científica `1.2486844E7` → `12486844`) | Dev | Todos os códigos em formato string normalizado; zero duplicatas por variação de formato |
| 2.3 | Carga inicial: inserção de todos os componentes em `componentes` + preços em `precos_componentes` | Dev | Contagem de registros importados vs. contagem na planilha bate; zero registros com `preco_custo = NULL` |
| 2.4 | Inserção dos parâmetros da DRE 2025 em `dre_parametros` com `ativo = TRUE` | Dev | `SELECT * FROM dre_parametros WHERE ativo = TRUE` retorna exatamente 1 linha com os valores corretos |
| 2.5 | Trigger que impede dois registros com `ativo = TRUE` simultaneamente em `dre_parametros` | Dev | Tentativa de ativar segundo registro lança exceção |

**Valores da DRE 2025 a cadastrar (referência):**

```sql
INSERT INTO dre_parametros (exercicio, pct_custo_fixo, pct_custo_variavel, pct_salarios, faturamento_estimado, ativo)
VALUES ('2025', 0.2008255537, 0.0094, 0.008443397671, 10100427.97, TRUE);
```

---

### Semana 3 — API de Catálogo (CRUD de Componentes)

| Tarefa | Descrição | Responsável | Critério de Aceite |
|---|---|---|---|
| 3.1 | Endpoint `GET /componentes?q={termo}` com busca full-text e por código | Dev | Busca por "DISJUNTOR WEG 125A" retorna resultados relevantes em < 200ms |
| 3.2 | Endpoint `POST /componentes/{id}/preco` para atualizar preço (cria novo registro, fecha o anterior) | Dev | Preço anterior fecha com `vigente_ate = CURRENT_DATE`; novo preço ativo; atomicidade garantida por transação |
| 3.3 | Endpoint `GET /componentes/{id}/historico-precos` | Dev | Retorna série histórica completa de preços do componente |
| 3.4 | Sistema de autenticação JWT (login, refresh, logout) | Dev | Tokens gerados corretamente; endpoints protegidos retornam 401 sem token |
| 3.5 | Middleware de autorização por perfil (orçamentista, gestor, admin) | Dev | Orçamentista não consegue acessar `POST /dre-parametros` |

---

### Semana 4 — Salários e Validação da Base

| Tarefa | Descrição | Responsável | Critério de Aceite |
|---|---|---|---|
| 4.1 | Importação da Base de Salários (19 profissionais) para tabela `funcionarios` | Dev | Todos os 19 profissionais importados com cargo, área, remuneração e horas/mês |
| 4.2 | Validação cruzada: `pct_salarios` calculado pelo sistema deve bater com o da planilha | Dev | `Soma(salários) / Faturamento Estimado = 0.008443397671` com tolerância de ±0,000001 |
| 4.3 | Testes de integração do banco: inserção, consulta, atualização e histórico de preços | Dev | 100% dos testes passando; nenhum erro de constraint |
| 4.4 | Revisão com gestor KL: validação dos dados importados | Gestor + Dev | Gestor assina termo de aceite da carga de dados |
| 4.5 | Documentação da API (Swagger) para Fase 1 completa | Dev | Todos os endpoints documentados com exemplos de request/response |

**Marco da Fase 1:** Sistema com base de dados completa, catálogo importado e API de busca operacional. A partir daqui a Fase 2 pode iniciar em paralelo com eventuais complementações do catálogo.

---

## Fase 2 — Engine Financeira (Semanas 5–8)

**Objetivo:** Implementar o motor de cálculo de markup com precisão decimal absoluta, validar todas as fórmulas contra a planilha original e executar testes de estresse.

**Critério de conclusão:** O motor calcula preço de venda e VI com diferença máxima de R$ 0,01 em relação à planilha Excel para qualquer conjunto de insumos testado.

---

### Semana 5 — Implementação do Motor de Markup

| Tarefa | Descrição | Responsável | Critério de Aceite |
|---|---|---|---|
| 5.1 | Módulo `engine/markup.py` com classe `MotorMarkup` usando `decimal.Decimal` | Dev | Classe instanciada com parâmetros da DRE; método `calcular(custo_direto, margem)` retorna `Decimal` |
| 5.2 | Implementação da fórmula: `Soma = %CF + %CV + %Sal + %Margem; Markup = 1/(1-Soma)` | Dev | Resultado para margem 40% = `2.622393334` (igual à planilha) |
| 5.3 | Validação caso real #1: Custo R$ 1.627,17 + Margem 40% → Preço R$ 4.267,08 | Dev | Diferença ≤ R$ 0,01 em relação à planilha |
| 5.4 | Validação caso real #2: Margem 10% → Markup 1.4677 | Dev | Diferença ≤ 0,000001 |
| 5.5 | Módulo `engine/viabilidade.py`: cálculo do VI e classificação (verde/amarelo/vermelho) | Dev | VI correto para os dois casos de teste; semáforo retorna enum correto |

---

### Semana 6 — Endpoint de Cálculo em Tempo Real

| Tarefa | Descrição | Responsável | Critério de Aceite |
|---|---|---|---|
| 6.1 | Endpoint `POST /calcular` que recebe lista de itens + margem e retorna breakdown completo | Dev | Response inclui: custo_direto, custo_fixo_valor, custo_variavel_valor, salarios_valor, margem_valor, preco_venda, markup, vi |
| 6.2 | Endpoint `GET /dre-parametros/vigente` — retorna parâmetros ativos sem expor campos sensíveis | Dev | Orçamentista vê percentuais; não vê faturamento estimado |
| 6.3 | Validação de limites de margem: mínimo configurável por categoria de projeto | Dev | Requisição com margem < mínimo retorna erro 422 com mensagem explicativa |
| 6.4 | Módulo `engine/snapshot.py`: serializa parâmetros da DRE + preços dos componentes no momento do cálculo | Dev | Snapshot em JSON contém todos os parâmetros necessários para recalcular o orçamento offline |
| 6.5 | Testes unitários de todos os módulos da engine com cobertura ≥ 90% | Dev | `pytest --cov` reporta ≥ 90% de cobertura nos módulos de engine |

---

### Semana 7 — Testes de Estresse das Fórmulas

| Tarefa | Descrição | Responsável | Critério de Aceite |
|---|---|---|---|
| 7.1 | Testes com valores extremos: custo = R$ 0,01; custo = R$ 9.999.999,99 | Dev | Zero erros de divisão por zero ou overflow; resultado coerente |
| 7.2 | Testes com margem nos limites: margem = 0% (custo); margem = 99% | Dev | Margem 0% → Markup ≥ 1 (nunca abaixo do custo); margem 99% → alerta de valor extremo |
| 7.3 | Teste de concorrência: 50 requisições simultâneas ao endpoint `/calcular` | Dev | P99 de latência < 500ms; zero erros; zero race conditions no banco |
| 7.4 | Teste de integridade: atualização de preço de componente não afeta orçamento emitido | Dev | Orçamento emitido consultado após atualização de preço retorna os valores originais do snapshot |
| 7.5 | Validação de arredondamento: comparar 1.000 cálculos aleatórios engine vs. planilha Excel | Dev | Diferença máxima de R$ 0,01 em todos os 1.000 casos |

---

### Semana 8 — Tratamento de Exceções e Fluxo de Aprovação

| Tarefa | Descrição | Responsável | Critério de Aceite |
|---|---|---|---|
| 8.1 | Fluxo de aprovação gerencial para VI < 1,00: criação de `solicitacoes_aprovacao` | Dev | Orçamento com VI < 1,00 gera solicitação; gestor recebe notificação (e-mail ou flag no sistema) |
| 8.2 | Endpoint `PATCH /orcamentos/{id}/aprovar` — somente perfil gestor | Dev | Orçamentista recebe 403; gestor aprova com registro de `aprovador_id` e `aprovado_em` |
| 8.3 | Tratamento de componente sem preço cadastrado: bloqueio com mensagem clara | Dev | Tentativa de adicionar componente com `preco_custo = 0` retorna erro 422 com lista dos itens bloqueados |
| 8.4 | Log estruturado de todos os cálculos: `orcamento_id`, `usuario_id`, `timestamp`, `vi_calculado` | Dev | Logs acessíveis via `GET /admin/logs` para o perfil admin |
| 8.5 | Revisão técnica com gestor KL: demonstração da engine ao vivo | Gestor + Dev | Gestor valida 3 orçamentos reais calculados pelo sistema vs. planilha |

**Marco da Fase 2:** Motor de cálculo auditado, testado e aprovado pelo gestor. A partir daqui, qualquer cálculo feito pelo sistema substitui definitivamente a planilha Excel.

---

## Fase 3 — Interface de Orçamentação (Semanas 9–13)

**Objetivo:** Construir a interface de usuário completa, da tela em branco ao PDF final, com experiência fluida e zero fricção para o orçamentista.

**Critério de conclusão:** Um orçamentista sem treinamento prévio consegue criar, calcular e emitir uma proposta completa em ≤ 45 minutos, com VI exibido em tempo real.

---

### Semana 9 — Setup do Frontend e Autenticação

| Tarefa | Descrição | Responsável | Critério de Aceite |
|---|---|---|---|
| 9.1 | Setup do projeto React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui | Dev | `npm run dev` sobe a aplicação; componentes básicos renderizando |
| 9.2 | Tela de login com autenticação JWT | Dev | Login funcional; token armazenado em `HttpOnly` cookie; redirecionamento por perfil |
| 9.3 | Layout base: sidebar de navegação + área de conteúdo + header com usuário logado | Dev | Navegação entre seções sem recarregar a página |
| 9.4 | Configuração do TanStack Query para comunicação com a API | Dev | Queries e mutations tipadas; loading states e error handling globais |
| 9.5 | Configuração do Zustand store para estado do orçamento em construção | Dev | Store inicializado; estado persiste durante navegação entre abas |

---

### Semana 10 — Tela de Busca e Seleção de Componentes

| Tarefa | Descrição | Responsável | Critério de Aceite |
|---|---|---|---|
| 10.1 | Componente de busca com autocomplete: debounce 200ms, mínimo 2 caracteres | Dev | Resultados aparecem em < 300ms para termos comuns; sem flickering |
| 10.2 | Card de resultado de busca: código, descrição, fabricante, preço unitário | Dev | Visual claro; preço sempre formatado como `R$ X.XXX,XX` |
| 10.3 | Ação "Adicionar ao Orçamento": campo de quantidade com validação | Dev | Quantidade negativa ou zero é rejeitada; campo aceita decimais (ex: 0,5 para meia unidade) |
| 10.4 | Lista de itens do orçamento: tabela editável com opção de remover item | Dev | Remoção de item atualiza totais em tempo real; confirmação antes de remover |
| 10.5 | Indicador de VI em tempo real: barra de progresso colorida (verde/amarelo/vermelho) | Dev | VI atualiza a cada adição/remoção de item sem recarregar a página |

---

### Semana 11 — Tela de Resumo e Configuração do Orçamento

| Tarefa | Descrição | Responsável | Critério de Aceite |
|---|---|---|---|
| 11.1 | Formulário de cabeçalho: cliente, número de referência, descrição do projeto | Dev | Campos obrigatórios bloqueiam o avanço se vazios; número de referência gerado automaticamente |
| 11.2 | Seletor de margem desejada: dropdown ou slider com limites configuráveis pelo gestor | Dev | Margem fora dos limites é rejeitada com mensagem explicativa |
| 11.3 | Painel de breakdown financeiro: breakdown completo de custo fixo, variável, salários, margem | Dev | Cada linha do breakdown exibe valor absoluto E percentual; DRE identificada como "DRE 2025" |
| 11.4 | Fluxo de aprovação visual: orçamentos com VI < 1,00 exibem banner e botão "Solicitar Aprovação" | Dev | Botão "Emitir PDF" fica desabilitado até aprovação do gestor para VI < 1,00 |
| 11.5 | Tela de gestão de aprovações (perfil gestor): lista de orçamentos aguardando aprovação | Dev | Gestor aprova ou rejeita com campo de justificativa; orçamentista é notificado |

---

### Semana 12 — Geração de PDF e Histórico

| Tarefa | Descrição | Responsável | Critério de Aceite |
|---|---|---|---|
| 12.1 | Template HTML/CSS do PDF de proposta comercial (layout KL Engenharia) | Dev | PDF com logo, dados da empresa, tabela de itens, totais e assinatura |
| 12.2 | Integração WeasyPrint: endpoint `GET /orcamentos/{id}/pdf` | Dev | PDF gerado em < 3s para orçamentos com até 100 itens; sem erros de renderização |
| 12.3 | Congelamento do orçamento na emissão: status `emitido`, snapshot gravado, campos bloqueados | Dev | Orçamento emitido não pode ser editado; nova versão exige duplicar o orçamento |
| 12.4 | Tela de histórico de orçamentos: listagem com filtros por cliente, data, status e responsável | Dev | Paginação funcional; busca por número de referência retorna resultado correto |
| 12.5 | Visualização de orçamento arquivado: exibe valores do snapshot (não preços atuais) | Dev | Orçamento de 6 meses atrás exibe o preço do componente vigente na época da emissão |

---

### Semana 13 — Administração e Ajustes

| Tarefa | Descrição | Responsável | Critério de Aceite |
|---|---|---|---|
| 13.1 | Tela de administração: atualização de preços do catálogo de insumos | Dev | Admin atualiza preço; histórico do componente exibe a mudança com data e usuário |
| 13.2 | Tela de administração: atualização de parâmetros da DRE (novo exercício) | Dev | Ativação da DRE 2026 desativa automaticamente a DRE 2025; confirmação obrigatória |
| 13.3 | Gestão de usuários: criação, edição de perfil, desativação | Dev | Usuário desativado não consegue logar; tokens existentes invalidados |
| 13.4 | Relatório de orçamentos por período: exportação CSV | Dev | CSV gerado com todos os campos relevantes; sem caracteres corrompidos em acentuação |
| 13.5 | Testes de usabilidade internos: desenvolvedor simula o fluxo completo como orçamentista | Dev | Fluxo completo (criar → calcular → emitir PDF) em ≤ 20 minutos para um orçamentista experiente |

**Marco da Fase 3:** Aplicação completa funcional em ambiente de staging. Pronto para testes com a equipe real.

---

## Fase 4 — Homologação e POP (Semanas 14–16)

**Objetivo:** Validar o sistema com usuários reais da KL Engenharia, corrigir pontos de atrito, elaborar o manual de uso e o POP, e colocar o sistema em produção.

**Critério de conclusão:** Equipe comercial da KL Engenharia utilizando o sistema em produção para 100% dos novos orçamentos; planilha Excel aposentada.

---

### Semana 14 — Testes de Usabilidade com a Equipe

| Tarefa | Descrição | Responsável | Critério de Aceite |
|---|---|---|---|
| 14.1 | Sessão de teste com 2-3 orçamentistas: cada um cria um orçamento real do zero | Equipe KL + Dev | Orçamentistas completam o fluxo sem ajuda após explicação inicial de 15 minutos |
| 14.2 | Comparação dos resultados do sistema vs. planilha Excel para os mesmos projetos | Gestor + Dev | Diferença de preço final ≤ R$ 0,01 em todos os casos testados |
| 14.3 | Coleta de feedback: lista de pontos de fricção, dúvidas e sugestões | Equipe KL | Lista priorizada de ajustes com classificação: crítico / importante / cosmético |
| 14.4 | Correção de bugs críticos identificados nos testes | Dev | Zero bugs críticos em aberto antes de prosseguir |
| 14.5 | Teste de carga: 10 usuários simultâneos criando orçamentos durante 1 hora | Dev | Zero erros de servidor; P99 latência < 1s |

---

### Semana 15 — Manual de Uso e POP

| Tarefa | Descrição | Responsável | Critério de Aceite |
|---|---|---|---|
| 15.1 | Elaboração do Manual de Uso: guia passo-a-passo com capturas de tela | Dev + Gestor | Manual cobre todos os fluxos principais em linguagem acessível; revisado pela equipe KL |
| 15.2 | Elaboração do POP (Procedimento Operacional Padrão): fluxo mandatório de criação de orçamentos | Gestor KL | POP define: quem pode criar, quem aprova VI < 1,00, prazo de emissão, política de revisão |
| 15.3 | Treinamento formal da equipe: 2h com todos os usuários | Dev + Gestor | 100% dos usuários conseguem criar e emitir um orçamento sem suporte ao final |
| 15.4 | Configuração do ambiente de produção: VPS, SSL, backup automatizado | Dev | HTTPS ativo; backup executado com sucesso; sistema acessível pela equipe KL |
| 15.5 | Migração de dados finais: quaisquer componentes adicionados na planilha após a carga inicial | Dev | Catálogo de produção sincronizado com a planilha Excel até a data de go-live |

---

### Semana 16 — Go-Live e Encerramento

| Tarefa | Descrição | Responsável | Critério de Aceite |
|---|---|---|---|
| 16.1 | Go-live: sistema em produção com URL definitiva, acesso liberado para toda a equipe | Dev | Todos os usuários logam com sucesso; nenhum erro em tela |
| 16.2 | Período de suporte intensivo (5 dias úteis): canal direto para dúvidas e bugs | Dev | Tempo de resposta ≤ 2h para bugs; ≤ 4h para dúvidas |
| 16.3 | Definição da política de manutenção: SLA, frequência de atualizações, responsável pelo catálogo | Gestor KL | Documento assinado definindo responsável por atualizações de preço e parâmetros da DRE |
| 16.4 | Aposentadoria da planilha Excel: arquivamento como referência histórica | Gestor KL | Planilha Excel movida para arquivo; nenhum novo orçamento gerado fora do sistema |
| 16.5 | Retrospectiva do projeto: lições aprendidas, próximas funcionalidades para v2.0 | Gestor + Dev | Documento com backlog priorizado para a próxima versão |

**Marco da Fase 4:** Sistema em produção, equipe treinada, planilha Excel aposentada. O POP garante que 100% dos orçamentos futuros passem pelo motor de cálculo, com rastreabilidade total e margem garantida pela DRE 2025.

---

## Cronograma Consolidado

```
Semana  │ 1  2  3  4  5  6  7  8  9  10 11 12 13 14 15 16
────────┼────────────────────────────────────────────────────
FASE 1  │ ████████████████
  BD    │ ████
  ETL   │    ████
  API   │       ████
  Val.  │          ████
────────┼────────────────────────────────────────────────────
FASE 2  │                 ████████████████
  Motor │                 ████
  API   │                    ████
  Stress│                       ████
  Excep.│                          ████
────────┼────────────────────────────────────────────────────
FASE 3  │                                 ████████████████████
  Setup │                                 ████
  Busca │                                    ████
  Resumo│                                       ████
  PDF   │                                          ████
  Admin │                                             ████
────────┼────────────────────────────────────────────────────
FASE 4  │                                                 ████████████
  Testes│                                                 ████
  POP   │                                                    ████
  Live  │                                                       ████
```

---

## Backlog v2.0 (Pós Go-Live)

Funcionalidades identificadas como valiosas mas fora do escopo da v1.0:

| Prioridade | Funcionalidade |
|---|---|
| Alta | Integração com sistema de NF-e: vincular orçamento aprovado à nota fiscal emitida |
| Alta | App mobile (React Native) para consulta de orçamentos em campo |
| Média | Módulo de acompanhamento de projeto: do orçamento à entrega do quadro |
| Média | Alertas automáticos de reajuste: notificação quando preço de componente sobe > X% |
| Baixa | Portal do cliente: cliente acessa e aprova orçamento online com assinatura digital |
| Baixa | Integração com fornecedores: cotação automática via API dos distribuidores WEG/Schneider |
