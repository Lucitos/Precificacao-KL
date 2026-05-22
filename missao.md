# missao.md — Missão Estratégica do Sistema de Precificação KL Engenharia

**Versão:** 1.0  
**Data de Referência:** DRE 2025  
**Empresa:** KL Engenharia Elétrica

---

## 1. A Dor Operacional: Por que a Planilha Atual Não Escala

### 1.1 Diagnóstico do Processo Manual

A montagem de uma proposta de quadro elétrico na KL Engenharia envolve hoje, em média, as seguintes etapas executadas de forma manual e fragmentada:

| Etapa | Risco Atual | Impacto |
|---|---|---|
| Busca de código do fabricante (ex: WEG, Schneider) | O orçamentista pesquisa manualmente em catálogos PDF ou memória | Código errado → componente incompatível → retrabalho pós-entrega |
| Inserção de preço unitário | Cópia manual da cotação mais recente | Preço desatualizado → margem negativa |
| Soma de componentes miúdos | Anilhas, bornes, abraçadeiras entram "na estimativa" | Perdas de 3-8% do custo direto por subestimação de materiais auxiliares |
| Aplicação do markup | Cada orçamentista aplica percentual diferente ou não aplica os parâmetros corretos da DRE | Preços inconsistentes entre propostas; risco de vender abaixo do custo |
| Histórico de versões | Nenhum controle formal de revisão | Cliente recebe versão antiga; litígios contratuais |

### 1.2 Gargalos Quantificados

Com base na DRE 2025 (Faturamento Estimado: **R$ 10.100.427,97**), os impactos financeiros dos gargalos atuais são mensuráveis:

- **Subestimação de materiais auxiliares (3%):** perda potencial de ~R$ 303.000/ano
- **Markup aplicado abaixo do mínimo:** a cada 1% de margem subprecificada em projetos, o impacto anual supera R$ 101.000
- **Retrabalho por erro de componente:** cada revisão técnica pós-entrega consome entre 4-12h do eletricista sênior (custo de R$ 20,45/h a R$ 27,52/h segundo a Base de Salários)
- **Tempo médio de elaboração de proposta:** estimado em 4-8 horas para quadros de médio porte; com sistema adequado, redução possível para 30-60 minutos

### 1.3 Falhas Sistêmicas Identificadas

A planilha atual (Precificação _ KL Engenharia.xlsx) já possui a lógica de markup correta, mas sofre de:

1. **Fragilidade estrutural:** dados de insumos, salários e DRE em abas separadas sem integridade referencial — uma alteração em preço pode não propagar para orçamentos em aberto
2. **Ausência de controle de acesso:** qualquer usuário pode alterar parâmetros da DRE, rompendo a governança financeira
3. **Sem versionamento:** orçamentos não ficam "congelados" — o preço final de um projeto pode mudar retroativamente se alguém alterar a base de insumos
4. **Catálogo sem padronização:** o campo de código usa formatos heterogêneos (ex: `F202AC-40/0,03`, `1.2486844E7`, `01.05.10.0023`), dificultando busca e deduplicação
5. **Sem output padronizado para o cliente:** a proposta final precisa ser gerada manualmente em outro documento

---

## 2. O Indicador de Viabilidade (VI) e a DRE: A Espinha Dorsal Financeira

### 2.1 Parâmetros da DRE 2025 (Base Real Extraída)

O sistema deve incorporar os seguintes parâmetros como configuração imutável da DRE 2025:

| Componente | Valor Absoluto | % do Faturamento |
|---|---|---|
| **Faturamento Estimado** | R$ 10.100.427,97 | 100,00% |
| **Gastos Fixos Totais** | R$ 2.028.424,04 | **20,08%** |
| — Despesas Administrativas | R$ 1.461.373,77 | 14,47% |
| — Despesas Financeiras | R$ 4.468,34 | 0,04% |
| — Outras Despesas Operacionais | R$ 562.581,93 | 5,57% |
| **Folha de Salários** | R$ 85.281,93 | **0,84%** |
| **Impostos / Gastos Variáveis** | — | **0,94%** |

### 2.2 A Fórmula do Markup — Derivação Completa

O motor de cálculo já implementado na planilha atual segue a lógica correta de markup sobre custo, derivada da DRE:

```
Soma = %CustoFixo + %CustoVariável + %Salários + %MargemDesejada
Markup = 1 / (1 - Soma)
Preço de Venda = Custo Direto × Markup
```

**Exemplos calibrados pela DRE 2025:**

| Margem Desejada | Soma Total | Markup | Aplicação |
|---|---|---|---|
| 10% (mínimo operacional) | 31,87% | **1,4677×** | Projetos competitivos |
| 40% (margem estratégica) | 61,87% | **2,6224×** | Projetos com alto valor agregado |

**Exemplo real extraído da planilha:**  
Custo Direto = R$ 1.627,17 → com Markup 2,6224 → **Preço de Venda: R$ 4.267,08**

### 2.3 O Indicador de Viabilidade (VI)

O VI é o gatilho de aprovação ou bloqueio automático de uma proposta. Ele deve ser calculado em tempo real à medida que o orçamentista monta o projeto:

```
VI = Preço de Venda Calculado / Preço de Venda Mínimo (Markup Mínimo × Custo Direto)

VI ≥ 1,00 → VIÁVEL (aprovado para emissão)
VI < 1,00 → INVIÁVEL (bloqueado; requer autorização do gestor)
```

O sistema deve exibir o VI como um semáforo visual em tempo real durante a composição do orçamento. O orçamentista não deve ser capaz de gerar o PDF final com VI < 1,00 sem autorização explícita de nível gerencial.

### 2.4 Proteção Contra Erosão de Margem

O sistema deve implementar uma camada de alertas progressivos:

- **Amarelo (VI entre 0,95 e 1,00):** margem dentro da faixa de risco — exige confirmação explícita
- **Vermelho (VI < 0,95):** proposta abaixo do custo — bloqueio automático com notificação ao gestor
- **Verde (VI ≥ 1,10):** margem saudável — liberação automática para emissão

---

## 3. Padronização de Processos: O Sistema como POP Imutável

### 3.1 Fluxo Operacional Obrigatório (POP)

O sistema deve forçar o seguinte fluxo sequencial — nenhuma etapa pode ser pulada:

```
[1] CRIAÇÃO DO PROJETO]
    ↓ (campos obrigatórios: cliente, número de referência, data, responsável)
    
[2] SELEÇÃO DE COMPONENTES]
    ↓ (busca por código, nome ou fabricante na base de insumos)
    ↓ (quantidade obrigatória; preço puxado automaticamente do catálogo)
    
[3] PARAMETRIZAÇÃO]
    ↓ (seleção da margem desejada dentro dos limites autorizados)
    ↓ (DRE 2025 é aplicada automaticamente — não editável pelo orçamentista)
    
[4] CÁLCULO AUTOMÁTICO]
    ↓ (motor de markup aplica a fórmula da DRE)
    ↓ (VI é calculado e exibido)
    
[5] VALIDAÇÃO DO VI]
    ↓ VI ≥ 1,00 → prossegue para emissão
    ↓ VI < 1,00 → bloqueio + fluxo de aprovação gerencial
    
[6] EMISSÃO DO ORÇAMENTO]
    ↓ (PDF gerado com layout padronizado da KL Engenharia)
    ↓ (orçamento "congelado" — preços não retrocedem com mudanças futuras na base)
    
[7] ARQUIVAMENTO]
    ↓ (histórico completo vinculado ao projeto; rastreável por auditor)
```

### 3.2 Controle de Acesso e Segregação de Funções

| Perfil | Permissões |
|---|---|
| **Orçamentista** | Cria projetos, seleciona componentes, define margem (dentro dos limites), emite propostas com VI ≥ 1,00 |
| **Gestor Comercial** | Aprova propostas com VI < 1,00; define margens mínimas e máximas por categoria de projeto |
| **Administrador do Sistema** | Atualiza parâmetros da DRE; gerencia catálogo de insumos; acesso total ao histórico |
| **Engenheiro** | Consulta somente; gera relatórios técnicos |

### 3.3 Garantias de Integridade do Histórico

- **Imutabilidade do orçamento aprovado:** após emissão do PDF, o registro é "congelado" com snapshot dos preços utilizados. Alterações posteriores no catálogo não afetam propostas já emitidas.
- **Rastreabilidade total:** cada alteração no catálogo de insumos é logada com usuário, timestamp e valor anterior/posterior.
- **Trilha de auditoria financeira:** toda proposta contém referência ao conjunto de parâmetros da DRE vigente no momento da geração.

### 3.4 Impacto Estratégico Esperado

| Indicador | Antes | Após Implantação |
|---|---|---|
| Tempo médio de elaboração de proposta | 4-8 horas | 20-45 minutos |
| Risco de margem negativa | Alto (margem manual) | Eliminado (markup automático) |
| Consistência de preços entre equipe | Baixa | 100% padronizada |
| Rastreabilidade de propostas | Inexistente | Completa (trilha auditável) |
| Controle de versões de orçamento | Manual/informal | Automático e versionado |
