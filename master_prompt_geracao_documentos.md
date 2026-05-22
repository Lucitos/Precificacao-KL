# Master Prompt: Geração de Documentação Estratégica (App de Precificação)

**Objetivo deste documento:** Este arquivo contém as instruções exatas que você deve fornecer à IA de desenvolvimento para que ela gere os três documentos finais (`missao.md`, `techstack.md`, `roadmap.md`) de forma extremamente técnica, profunda e destrinchada.

Ao enviar este texto para a IA, ela terá todo o contexto necessário para desenhar a arquitetura do projeto.

---

## Instrução de Sistema para a IA (Copie e cole junto com os prompts abaixo)
**Contexto de Atuação:** Aja como um Arquiteto de Software e Engenheiro de Produção Sênior. O sistema a ser documentado é um aplicativo corporativo para orçamentação e precificação de quadros elétricos. O fluxo deve iniciar com um projeto em branco, permitir a seleção de componentes de uma base de dados robusta e aplicar um motor de cálculo financeiro rigorosamente atrelado à DRE contábil de 2025. O design do sistema deve funcionar como um Procedimento Operacional Padrão (POP) imutável para a equipe comercial, garantindo altíssimo controle e precisão, com o nível de exigência de projetos reais do setor, como os elaborados para a KL Engenharia Elétrica.

---

### Prompt 1: Gerar o `missao.md`
**Comando:** Produza o documento `missao.md`. Não seja superficial. Quero uma análise profunda dos seguintes pontos:
1.  **A Dor Operacional:** Descreva os gargalos atuais na montagem de propostas de quadros elétricos (falhas humanas, perda de tempo procurando códigos de fabricantes, margens de erro na soma de componentes miúdos).
2.  **O Indicador de Viabilidade (VI) e DRE:** Explique detalhadamente como o sistema garantirá a saúde financeira da empresa ao amarrar o custo direto dos componentes aos percentuais de impostos, custos fixos e margem de lucro definidos na DRE de 2025. 
3.  **Padronização de Processos:** Defina como a ferramenta servirá não apenas como calculadora, mas como um mecanismo de governança que força o usuário a seguir um fluxo aprovado.

### Prompt 2: Gerar o `techstack.md`
**Comando:** Produza o documento `techstack.md`. Especifique as tecnologias de ponta a ponta e justifique o *porquê* de cada escolha pensando em escalabilidade e precisão.
1.  **Backend e Motor de Cálculo:** Especifique a linguagem e framework ideais para lidar com cálculos de Markup e regras da DRE sem erros de arredondamento.
2.  **Banco de Dados (Single Source of Truth):** Como modelar o catálogo de itens (fios, disjuntores, contatores) para que atualizações de preço reflitam em novos orçamentos, mas preservem o histórico de orçamentos antigos?
3.  **Frontend e UX:** Sugira a melhor tecnologia para criar uma interface de montagem de projetos que seja fluida (ex: drag and drop ou busca com autocomplete ultrarrápido).

### Prompt 3: Gerar o `roadmap.md`
**Comando:** Produza o documento `roadmap.md`. Estruture o cronograma de desenvolvimento utilizando uma lógica clara de mapeamento de processos (com etapas bem encadeadas, similar a um fluxo BPMN). Destrinche as seguintes fases operacionais:
1.  **Fase 1 - Estruturação de Dados:** Modelagem do banco, importação da carga inicial de itens elétricos e definição da tabela de parâmetros da DRE 2025.
2.  **Fase 2 - Engine Financeira:** Programação do motor matemático, testes de estresse das fórmulas de precificação e tratamento de exceções.
3.  **Fase 3 - Interface de Orçamentação:** Construção da tela de "Tela em Branco" até o resumo final do orçamento.
4.  **Fase 4 - Homologação e POP:** Testes de usabilidade com a equipe, elaboração do manual de uso da ferramenta e geração do output em PDF para o cliente final.
