-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'ORCAMENTISTA');

-- CreateEnum
CREATE TYPE "StatusProjeto" AS ENUM ('RASCUNHO', 'EMITIDO', 'CANCELADO');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'ORCAMENTISTA',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DREParametros" (
    "id" TEXT NOT NULL,
    "exercicio" TEXT NOT NULL,
    "pctCustoFixo" DECIMAL(12,10) NOT NULL,
    "pctCustoVariavel" DECIMAL(12,10) NOT NULL,
    "pctSalarios" DECIMAL(12,10) NOT NULL,
    "faturamentoEstimado" DECIMAL(16,2),
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DREParametros_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Componente" (
    "id" TEXT NOT NULL,
    "codigoFabricante" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "fabricante" TEXT,
    "categoria" TEXT,
    "unidadeMedida" TEXT NOT NULL DEFAULT 'Unidade',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Componente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrecoComponente" (
    "id" TEXT NOT NULL,
    "componenteId" TEXT NOT NULL,
    "precoCusto" DECIMAL(14,4) NOT NULL,
    "vigenteDe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vigenteAte" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PrecoComponente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Projeto" (
    "id" TEXT NOT NULL,
    "numeroReferencia" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cliente" TEXT NOT NULL,
    "descricao" TEXT,
    "status" "StatusProjeto" NOT NULL DEFAULT 'RASCUNHO',
    "margemAplicada" DECIMAL(6,4) NOT NULL,
    "markupAplicado" DECIMAL(12,8) NOT NULL,
    "custoDiretoTotal" DECIMAL(16,2) NOT NULL,
    "precoVendaTotal" DECIMAL(16,2) NOT NULL,
    "vi" DECIMAL(8,4) NOT NULL,
    "dreSnapshot" JSONB NOT NULL,
    "responsavelId" TEXT NOT NULL,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "emitidoEm" TIMESTAMP(3),

    CONSTRAINT "Projeto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItemOrcamento" (
    "id" TEXT NOT NULL,
    "projetoId" TEXT NOT NULL,
    "componenteId" TEXT NOT NULL,
    "quantidade" DECIMAL(12,4) NOT NULL,
    "precoCustoUnitario" DECIMAL(14,4) NOT NULL,
    "precoCustoTotal" DECIMAL(16,2) NOT NULL,
    "observacao" TEXT,

    CONSTRAINT "ItemOrcamento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Componente_codigoFabricante_key" ON "Componente"("codigoFabricante");

-- CreateIndex
CREATE UNIQUE INDEX "Projeto_numeroReferencia_key" ON "Projeto"("numeroReferencia");

-- AddForeignKey
ALTER TABLE "PrecoComponente" ADD CONSTRAINT "PrecoComponente_componenteId_fkey" FOREIGN KEY ("componenteId") REFERENCES "Componente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Projeto" ADD CONSTRAINT "Projeto_responsavelId_fkey" FOREIGN KEY ("responsavelId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemOrcamento" ADD CONSTRAINT "ItemOrcamento_projetoId_fkey" FOREIGN KEY ("projetoId") REFERENCES "Projeto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemOrcamento" ADD CONSTRAINT "ItemOrcamento_componenteId_fkey" FOREIGN KEY ("componenteId") REFERENCES "Componente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
