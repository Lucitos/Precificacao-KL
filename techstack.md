# techstack.md — Stack Tecnológica do Sistema de Precificação KL Engenharia

**Versão:** 1.0  
**Arquitetura:** Monolito Modular com potencial de evolução para microserviços  
**Premissa central:** Precisão financeira absoluta, rastreabilidade total, zero arredondamento incorreto

---

## 1. Backend e Motor de Cálculo

### 1.1 Linguagem e Framework: Python 3.12+ com FastAPI

**Por que Python:**

A escolha determinante é a biblioteca nativa `decimal.Decimal`, que implementa o padrão IEEE 754 de aritmética decimal de precisão arbitrária — eliminando por completo os erros de ponto flutuante que afetariam qualquer cálculo de markup com `float`.

```python
from decimal import Decimal, ROUND_HALF_UP, getcontext

# Contexto global de precisão: 28 casas decimais
getcontext().prec = 28

# Exemplo com dados reais da DRE 2025
custo_fixo     = Decimal("0.2008255537")
custo_variavel = Decimal("0.0094")
salarios       = Decimal("0.008443397671")
margem         = Decimal("0.40")

soma   = custo_fixo + custo_variavel + salarios + margem
markup = Decimal("1") / (Decimal("1") - soma)

custo_direto = Decimal("1627.17")
preco_venda  = (custo_direto * markup).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
# Resultado: R$ 4.267,08 — idêntico ao calculado na planilha
```

**Por que FastAPI:**
- Tipagem forte via `Pydantic v2` — todos os campos financeiros são declarados como `Decimal`, impossibilitando a entrada de `float` pelo frontend
- Geração automática de documentação OpenAPI (Swagger), essencial para auditoria da API
- Performance assíncrona com `async/await` nativo — suporta múltiplos orçamentistas simultâneos sem degradação
- Validação de dados na borda da API antes de qualquer processamento financeiro

**Por que não Go:** Apesar da performance superior, a biblioteca `decimal` do ecossistema Go é de terceiros e menos madura. Python oferece `Decimal` nativo com 30 anos de battle-testing em sistemas financeiros.

**Por que não Node.js:** JavaScript não possui tipo nativo de precisão decimal. O erro `0.1 + 0.2 = 0.30000000000000004` seria catastrófico em um motor de markup.

### 1.2 Estrutura do Motor de Cálculo (Engine Financeira)

```
app/
├── engine/
│   ├── markup.py          # Fórmula central: Markup = 1 / (1 - Soma)
│   ├── dre.py             # Parâmetros da DRE 2025 (imutáveis por configuração)
│   ├── viabilidade.py     # Cálculo do VI e semáforo de aprovação
│   └── snapshot.py        # Congelamento de parâmetros no momento da emissão
├── models/
│   ├── orcamento.py       # Entidade central do orçamento
│   ├── componente.py      # Modelo de item do catálogo
│   └── dre_params.py      # Parâmetros da DRE com versionamento
└── api/
    ├── orcamentos.py      # CRUD de orçamentos
    ├── componentes.py     # Busca no catálogo
    └── precificacao.py    # Endpoint de cálculo em tempo real
```

### 1.3 Regras Críticas do Motor

| Regra | Implementação |
|---|---|
| Nenhum `float` entra no motor | Pydantic valida e converte para `Decimal` na entrada |
| Arredondamento sempre `ROUND_HALF_UP` | Padrão contábil brasileiro |
| Parâmetros da DRE são somente-leitura para o motor | Lidos de tabela `dre_parametros` com flag `ativo=True` |
| Snapshot de parâmetros na emissão | Serializado em JSON e armazenado junto ao orçamento |
| VI calculado em tempo real | Endpoint `POST /calcular` retorna VI a cada alteração |

---

## 2. Banco de Dados — Single Source of Truth

### 2.1 SGBD: PostgreSQL 16

**Por que PostgreSQL:**
- Tipo nativo `NUMERIC(precision, scale)` — mapeia diretamente para `Decimal` do Python sem conversão
- Extensão `pgaudit` para trilha de auditoria de todas as alterações em tabelas críticas
- `Row-Level Security (RLS)` para segregação de acesso por perfil de usuário
- Suporte nativo a `JSONB` para armazenar snapshots de parâmetros da DRE junto ao orçamento
- Capacidade de `SELECT FOR UPDATE` para evitar race conditions em atualizações de preço simultâneas

**Por que não MySQL/MariaDB:** Tipo `DECIMAL` menos robusto e sem suporte nativo a RLS.  
**Por que não SQLite:** Sem concorrência adequada para múltiplos usuários simultâneos.

### 2.2 Modelagem do Banco de Dados

#### Tabela: `componentes` (Catálogo de Insumos)

```sql
CREATE TABLE componentes (
    id              BIGSERIAL PRIMARY KEY,
    codigo_fabricante VARCHAR(50) UNIQUE NOT NULL,  -- ex: "12775103", "F202AC-40/0,03"
    codigo_interno  VARCHAR(30),                    -- código interno KL
    descricao       TEXT NOT NULL,
    fabricante      VARCHAR(100),                   -- WEG, Schneider, ABB, CHNT...
    unidade_medida  VARCHAR(20) NOT NULL DEFAULT 'Unidade',
    categoria       VARCHAR(50),                    -- Disjuntor, Contator, Borne...
    ativo           BOOLEAN DEFAULT TRUE,
    criado_em       TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_componentes_descricao ON componentes USING GIN(to_tsvector('portuguese', descricao));
CREATE INDEX idx_componentes_fabricante ON componentes (fabricante);
```

#### Tabela: `precos_componentes` (Histórico de Preços — NUNCA delete, só insere)

```sql
CREATE TABLE precos_componentes (
    id              BIGSERIAL PRIMARY KEY,
    componente_id   BIGINT REFERENCES componentes(id) NOT NULL,
    preco_custo     NUMERIC(14, 4) NOT NULL,        -- 4 casas: precisão para cálculos intermediários
    vigente_de      DATE NOT NULL,
    vigente_ate     DATE,                           -- NULL = preço atual vigente
    fonte_cotacao   VARCHAR(200),                   -- ex: "NF 12345 - Fornecedor X"
    registrado_por  BIGINT REFERENCES usuarios(id),
    registrado_em   TIMESTAMPTZ DEFAULT NOW()
);
```

**Invariante crítica:** O preço vigente de um componente é sempre aquele com `vigente_ate IS NULL`. Quando um novo preço é cadastrado, o sistema executa em transação atômica:
```sql
-- Passo 1: Fechar o preço anterior
UPDATE precos_componentes SET vigente_ate = CURRENT_DATE WHERE componente_id = $1 AND vigente_ate IS NULL;
-- Passo 2: Inserir o novo preço
INSERT INTO precos_componentes (componente_id, preco_custo, vigente_de, fonte_cotacao) VALUES (...);
```

**Por que isso resolve o problema de histórico:** Orçamentos antigos referenciam o `precos_componentes.id` (chave imutável), não o componente diretamente. Assim, um reajuste de preço nunca altera retrospectivamente o custo de um projeto já orçado.

#### Tabela: `dre_parametros` (Parâmetros da DRE — Versionada)

```sql
CREATE TABLE dre_parametros (
    id                  SERIAL PRIMARY KEY,
    exercicio           VARCHAR(10) NOT NULL,       -- "2025", "2026"...
    pct_custo_fixo      NUMERIC(10, 10) NOT NULL,   -- 0.2008255537
    pct_custo_variavel  NUMERIC(10, 10) NOT NULL,   -- 0.0094
    pct_salarios        NUMERIC(10, 10) NOT NULL,   -- 0.008443397671
    faturamento_estimado NUMERIC(16, 2),            -- 10100427.97
    ativo               BOOLEAN DEFAULT FALSE,
    aprovado_por        BIGINT REFERENCES usuarios(id),
    aprovado_em         TIMESTAMPTZ,
    criado_em           TIMESTAMPTZ DEFAULT NOW()
);
-- Apenas um registro pode ter ativo=TRUE por vez (enforced via trigger)
```

#### Tabela: `orcamentos` (Entidade Central)

```sql
CREATE TABLE orcamentos (
    id                  BIGSERIAL PRIMARY KEY,
    numero_referencia   VARCHAR(30) UNIQUE NOT NULL, -- ex: "KL-2025-0047"
    cliente             VARCHAR(200) NOT NULL,
    descricao_projeto   TEXT,
    status              VARCHAR(20) DEFAULT 'rascunho', -- rascunho|emitido|aprovado|cancelado
    margem_aplicada     NUMERIC(6, 4) NOT NULL,
    markup_aplicado     NUMERIC(10, 8) NOT NULL,
    custo_direto_total  NUMERIC(16, 2),
    preco_venda_total   NUMERIC(16, 2),
    vi                  NUMERIC(8, 4),              -- Indicador de Viabilidade
    dre_params_snapshot JSONB NOT NULL,             -- SNAPSHOT dos parâmetros da DRE no momento da emissão
    responsavel_id      BIGINT REFERENCES usuarios(id),
    aprovador_id        BIGINT REFERENCES usuarios(id),
    emitido_em          TIMESTAMPTZ,
    criado_em           TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em       TIMESTAMPTZ DEFAULT NOW()
);
```

#### Tabela: `itens_orcamento` (Componentes de Cada Orçamento)

```sql
CREATE TABLE itens_orcamento (
    id                  BIGSERIAL PRIMARY KEY,
    orcamento_id        BIGINT REFERENCES orcamentos(id) NOT NULL,
    componente_id       BIGINT REFERENCES componentes(id) NOT NULL,
    preco_snapshot_id   BIGINT REFERENCES precos_componentes(id) NOT NULL, -- preço no momento da inclusão
    quantidade          NUMERIC(12, 4) NOT NULL,
    preco_custo_unitario NUMERIC(14, 4) NOT NULL,   -- copiado do snapshot, imutável
    preco_custo_total   NUMERIC(16, 2) NOT NULL,
    observacao          TEXT
);
```

### 2.3 Estratégia de Busca no Catálogo

O catálogo de insumos possui centenas de componentes. A busca deve ser ultrarrápida:

```sql
-- Busca full-text com ranking por relevância
SELECT c.*, p.preco_custo
FROM componentes c
JOIN precos_componentes p ON p.componente_id = c.id AND p.vigente_ate IS NULL
WHERE to_tsvector('portuguese', c.descricao) @@ plainto_tsquery('portuguese', $1)
   OR c.codigo_fabricante ILIKE $2
ORDER BY ts_rank(to_tsvector('portuguese', c.descricao), plainto_tsquery('portuguese', $1)) DESC
LIMIT 20;
```

---

## 3. Frontend e UX

### 3.1 Framework: React 18 + TypeScript

**Por que React:**
- Ecossistema maduro com componentes de busca com autocomplete de alta performance (ex: `react-select` com carregamento assíncrono)
- `React Query (TanStack Query)` para sincronização de estado servidor-cliente — atualiza o VI em tempo real sem recarregar a página
- TypeScript elimina erros de tipagem no frontend — todos os campos de preço são `string` (não `number`) e convertidos para `Decimal` no backend

**Por que não Vue/Angular:** React possui o maior ecossistema de componentes prontos para interfaces de entrada de dados complexas, especialmente para montagem item-a-item de listas longas.

### 3.2 Componente Central: Tela de Montagem do Orçamento

A interface de montagem de orçamento é o coração do produto. Deve funcionar como um editor de código — rápido, responsivo e sem fricção:

```
┌─────────────────────────────────────────────────────────────────────┐
│  KL Engenharia — Novo Orçamento #KL-2025-0048                       │
│  Cliente: ________________  Margem: [10%▼]  Responsável: João       │
├─────────────────────────────────────────────────────────────────────┤
│  🔍 Buscar componente: [DISJUNTOR WEG 125A_______________]          │
│                                                                     │
│  → DISJ. CAIXA MOLDADA AGW250 125A 3P  | R$ 220,19  [+Adicionar]   │
│  → DISJ. CAIXA MOLDADA AGW400 350A 3P  | R$ 699,22  [+Adicionar]   │
│  → DISJ. MOTOR MWL18 0.63-1A           | R$ 116,27  [+Adicionar]   │
├─────────────────────────────────────────────────────────────────────┤
│  ITENS DO ORÇAMENTO                                                 │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ # │ Código      │ Descrição          │ Qtd │ Unit   │ Total  │  │
│  │ 1 │ 12775103    │ DISJ AGW250 125A   │  2  │220,19  │440,38  │  │
│  │ 2 │ 12775054    │ BOBINA BD 110-220V │  2  │174,65  │349,30  │  │
│  │ 3 │ 1247665     │ BLOCO CONTATO BCLL │  4  │ 17,78  │ 71,12  │  │
│  └──────────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────────┤
│  RESUMO FINANCEIRO                      VI: ████████░░ 1.23 ✅      │
│  Custo Direto:        R$   860,80                                   │
│  Custo Fixo (20,08%): R$   172,85                                   │
│  Impostos (0,94%):    R$     8,09                                   │
│  Salários (0,84%):    R$     7,23                                   │
│  Margem (10%):        R$    86,08                                   │
│  ─────────────────────────────────────                              │
│  Preço de Venda:      R$ 1.262,66                                   │
│                                                                     │
│  [Salvar Rascunho]  [Emitir Proposta PDF]                          │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.3 Biblioteca de Componentes: shadcn/ui + Tailwind CSS

**Por que shadcn/ui:** Componentes acessíveis, sem dependência pesada, estilizáveis. Ideal para construir uma interface corporativa profissional sem overhead de frameworks UI como Material UI.

**Por que Tailwind CSS:** Consistência visual rigorosa com classes utilitárias; sem conflitos de CSS em um projeto de longa vida.

### 3.4 Autocomplete de Componentes

A busca deve ser responsiva ao digitarmos ≥ 2 caracteres, consultando o backend com debounce de 200ms:

```typescript
// Busca debounced com React Query
const { data: resultados } = useQuery({
  queryKey: ['componentes', termoBusca],
  queryFn: () => api.get(`/componentes?q=${termoBusca}`),
  enabled: termoBusca.length >= 2,
  staleTime: 30_000, // cache local de 30s para termos repetidos
})
```

### 3.5 Geração de PDF

**Biblioteca:** `WeasyPrint` (Python, servidor) — renderiza HTML/CSS para PDF com qualidade tipográfica profissional.  
**Por que servidor e não cliente:** O PDF deve ser gerado pelo backend (onde o snapshot está registrado), não pelo navegador — garantindo que o documento emitido é idêntico ao orçamento auditado.

### 3.6 Estado Global: Zustand

Para gerenciar o estado do orçamento em construção (itens, totais, VI) sem prop-drilling em uma tela com muitos componentes:

```typescript
const useOrcamentoStore = create<OrcamentoStore>((set, get) => ({
  itens: [],
  margemDesejada: new Decimal('0.10'),
  vi: null,
  adicionarItem: (componente, quantidade) => { /* atualiza itens e recalcula VI */ },
  removerItem: (itemId) => { /* ... */ },
  calcularTotais: async () => {
    const response = await api.post('/calcular', { itens: get().itens, margem: get().margemDesejada })
    set({ vi: response.data.vi })
  }
}))
```

---

## 4. Infraestrutura e Implantação

### 4.1 Containerização: Docker + Docker Compose

```yaml
services:
  api:
    build: ./backend
    env_file: .env
    depends_on: [db]
    ports: ["8000:8000"]

  frontend:
    build: ./frontend
    ports: ["3000:3000"]

  db:
    image: postgres:16-alpine
    volumes: ["pgdata:/var/lib/postgresql/data"]
    environment:
      POSTGRES_DB: kl_precificacao
      POSTGRES_PASSWORD: ${DB_PASSWORD}

  nginx:
    image: nginx:alpine
    # Proxy reverso: /api → api:8000, /* → frontend:3000
```

**Implantação inicial recomendada:** VPS com 2 vCPUs e 4GB RAM (ex: DigitalOcean Droplet ou Contabo) — suficiente para 10-20 usuários simultâneos com custo mensal de R$ 60-150.

### 4.2 Autenticação: JWT + Refresh Token

- Login com usuário/senha (sem OAuth externo na v1 — simplicidade operacional)
- Tokens JWT com expiração de 8h (jornada de trabalho)
- Refresh token com expiração de 30 dias, armazenado em cookie `HttpOnly`

### 4.3 Backup

- `pg_dump` automatizado diariamente via cron, retido por 30 dias
- Backup incremental a cada 6h para projetos críticos

---

## 5. Resumo da Stack

| Camada | Tecnologia | Justificativa |
|---|---|---|
| Backend | Python 3.12 + FastAPI | `Decimal` nativo, tipagem forte, async |
| Motor de Cálculo | `decimal.Decimal` (stdlib) | Zero arredondamento, padrão contábil |
| Banco de Dados | PostgreSQL 16 | `NUMERIC`, auditoria, RLS |
| ORM | SQLAlchemy 2.0 + Alembic | Tipagem, migrações versionadas |
| Frontend | React 18 + TypeScript | Ecossistema, componentes, tipagem |
| Estado | Zustand + TanStack Query | Leve, reativo, sem boilerplate |
| UI | shadcn/ui + Tailwind CSS | Corporativo, acessível, consistente |
| PDF | WeasyPrint (servidor) | Fidelidade, auditabilidade |
| Infra | Docker + Docker Compose | Reprodutibilidade, simplicidade |
| Auth | JWT + HttpOnly Cookie | Segurança sem complexidade desnecessária |
