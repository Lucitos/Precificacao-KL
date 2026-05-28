import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
dotenv.config()

import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import bcrypt from "bcryptjs"

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const componentes = [
  { codigo: "F202AC-40-0.03", descricao: "DR 2P 40A 30MA ABB", fabricante: "ABB", categoria: "DR / DPS", preco: "0.00" },
  { codigo: "10289152", descricao: "BORNE BTWP 16-AZ 750V", fabricante: "WEG", categoria: "Borne", preco: "6.43" },
  { codigo: "11898941", descricao: "CHAVE SECCIONADORA ROTATIVA MSW 80A 3 POLOS COM MANOPLA VERMELHA/AMARELA", fabricante: "WEG", categoria: "Outros", preco: "221.75" },
  { codigo: "12486844", descricao: "MINICONTATOR AZ CWCA0-31-00V26 190V 50HZ/220V 60HZ AZUL", fabricante: "WEG", categoria: "Minicontator", preco: "32.55" },
  { codigo: "12486847", descricao: "MINICONTATOR AZ CWCA0-40-00V26 190V 50HZ/220V 60HZ AZUL", fabricante: "WEG", categoria: "Minicontator", preco: "32.55" },
  { codigo: "12499384", descricao: "BLOCO CONTATO AUXILIAR FRONTAL BFCA 3NA+1NF COM PARAFUSO UI MAX 660/690V AZUL MINICONTATOR CWCA", fabricante: "WEG", categoria: "Bloco de Contato", preco: "24.59" },
  { codigo: "12499385", descricao: "BLOCO CONTATO AUXILIAR FRONTAL BFCA 4NA COM PARAFUSO UI MAX 660/690V AZUL MINICONTATOR CWCA0", fabricante: "WEG", categoria: "Bloco de Contato", preco: "24.59" },
  { codigo: "12775000", descricao: "BLOCO DE CONTATO BC-1R PARA DISJUNTOR CAIXA MOLDADA AGW50-250", fabricante: "WEG", categoria: "Bloco de Contato", preco: "53.40" },
  { codigo: "12775002", descricao: "BLOCO DE ALARME AL-1R PARA DISJUNTOR CAIXA MOLDADA AGW50-250", fabricante: "WEG", categoria: "Bloco de Contato", preco: "59.05" },
  { codigo: "12775054", descricao: "BOBINA DE DISPARO BD 110-220 VCA/VCC PARA DISJUNTOR CAIXA MOLDADA AGW400-800", fabricante: "WEG", categoria: "Bobina", preco: "174.65" },
  { codigo: "12775103", descricao: "DISJUNTOR EM CAIXA MOLDADA AGW250 30KA 380VCA MAGNETICO TERMICO FIXO 125A 3 POLOS", fabricante: "WEG", categoria: "Disjuntor", preco: "220.19" },
  { codigo: "12775150", descricao: "DISJUNTOR EM CAIXA MOLDADA AGW400 42KA 380VCA MAGNETICO TERMICO FIXO 350A 3 POLOS", fabricante: "WEG", categoria: "Disjuntor", preco: "699.22" },
  { codigo: "12778357", descricao: "MANOPLA ROTATIVA MR 469MM CINZA PARA DISJUNTOR CAIXA MOLDADA AGW250", fabricante: "WEG", categoria: "Outros", preco: "205.75" },
  { codigo: "12866612", descricao: "BARRAMENTO DE DISTRIBUICAO 3/4X1/8 C/14 FUROS", fabricante: "WEG", categoria: "Barramento", preco: "152.51" },
  { codigo: "14159045", descricao: "DISJUNTOR-MOTOR MWL18-3-C063 0.4-0.63A", fabricante: "WEG", categoria: "Disjuntor-Motor", preco: "116.26" },
  { codigo: "14159085", descricao: "DISJUNTOR-MOTOR MWL18-3-U001 0.63-1A", fabricante: "WEG", categoria: "Disjuntor-Motor", preco: "116.27" },
  { codigo: "14159087", descricao: "DISJUNTOR-MOTOR MWL18-3-D025 1.6-2.5A", fabricante: "WEG", categoria: "Disjuntor-Motor", preco: "116.26" },
  { codigo: "14159180", descricao: "DISJUNTOR-MOTOR MWL18-3-U004 2.5-4A", fabricante: "WEG", categoria: "Disjuntor-Motor", preco: "116.27" },
  { codigo: "14159182", descricao: "DISJUNTOR-MOTOR MWL18-3-D063 4-6.3A", fabricante: "WEG", categoria: "Disjuntor-Motor", preco: "116.27" },
  { codigo: "14159188", descricao: "DISJUNTOR-MOTOR MWL18-3-U010 6.3-10A", fabricante: "WEG", categoria: "Disjuntor-Motor", preco: "116.27" },
  { codigo: "14159194", descricao: "DISJUNTOR-MOTOR MWL18-3-U018 12-18A", fabricante: "WEG", categoria: "Disjuntor-Motor", preco: "116.26" },
  { codigo: "14247665", descricao: "BLOCO DE CONTATOS AUXILIARES LATERAL BCLL 2NA COM PARAFUSO UI MAX 660/690V PARA CONTATOR CWL9", fabricante: "WEG", categoria: "Bloco de Contato", preco: "17.78" },
  { codigo: "14256723", descricao: "DISJUNTOR EM CAIXA MOLDADA DWP63 15KA 400VCA MAGNETICO TERMICO FIXO 25A 3 POLOS", fabricante: "WEG", categoria: "Disjuntor", preco: "110.49" },
  { codigo: "14256724", descricao: "DISJUNTOR EM CAIXA MOLDADA DWP63 15KA 400VCA MAGNETICO TERMICO FIXO 32A 3 POLOS", fabricante: "WEG", categoria: "Disjuntor", preco: "110.48" },
  { codigo: "14256868", descricao: "DISJUNTOR EM CAIXA MOLDADA DWP800 35KA 400VCA MAGNETICO TERMICO FIXO 800A 3 POLOS", fabricante: "WEG", categoria: "Disjuntor", preco: "1589.11" },
  { codigo: "14516081", descricao: "BOBINA SUBTENSAO BS 220-240V 50/60HZ 250VCC PARA DISJUNTOR CAIXA MOLDADA AGW-DWB", fabricante: "WEG", categoria: "Bobina", preco: "229.18" },
  { codigo: "14569119", descricao: "DISJUNTOR EM CAIXA MOLDADA DWP630 35KA 400VCA MAGNETICO TERMICO FIXO 450A 3 POLOS", fabricante: "WEG", categoria: "Disjuntor", preco: "1141.81" },
  { codigo: "15265739", descricao: "MINIDISJUNTOR MDWP-C50-2 400VCA", fabricante: "WEG", categoria: "Disjuntor", preco: "16.99" },
  { codigo: "15322004", descricao: "DISJUNTOR DWB650S500-3DA 500A", fabricante: "WEG", categoria: "Disjuntor", preco: "1446.66" },
  { codigo: "17354033", descricao: "DISJUNTOR EM CAIXA MOLDADA AGW650 35KA 415VCA MAGNETICO TERMICO FIXO 630A 3 POLOS", fabricante: "WEG", categoria: "Disjuntor", preco: "1179.62" },
  { codigo: "17354640", descricao: "DISJUNTOR DWB650H630-3DA 630A", fabricante: "WEG", categoria: "Disjuntor", preco: "2124.59" },
  { codigo: "12775107", descricao: "DISJ. 3P C 200A 30KA AGW WEG", fabricante: "WEG", categoria: "Disjuntor", preco: "369.17" },
  { codigo: "280791", descricao: "DR 4P 40A 30MA CHNT", fabricante: "CHNT", categoria: "DR / DPS", preco: "0.00" },
  { codigo: "7311", descricao: "DPS S700 722.B.010.050 (PROTETOR CONTATO TELEFONICO/ENERGIA)", fabricante: null, categoria: "DR / DPS", preco: "67.90" },
  { codigo: "6987", descricao: "FONTE DE ALIMENTACAO CHAVEADA PS-EE-2G/1AC/24DC/75W/SC", fabricante: null, categoria: "Fonte de Alimentação", preco: "199.50" },
  { codigo: "36724", descricao: "QUADRO COMANDO 40X40X20 C/FLANGE", fabricante: null, categoria: "Quadro / Caixa", preco: "237.95" },
  { codigo: "54", descricao: "QUADRO SOBREPOR 500X400X200 MM", fabricante: null, categoria: "Quadro / Caixa", preco: "0.00" },
  { codigo: "3", descricao: "QG CONVENCIONAL", fabricante: null, categoria: "Quadro / Caixa", preco: "24.00" },
  { codigo: "18", descricao: "QD CARREGADOR VEICULAR", fabricante: null, categoria: "Quadro / Caixa", preco: "24.00" },
  { codigo: "23", descricao: "Q-MDP-CT/PET", fabricante: null, categoria: "Quadro / Caixa", preco: "24.00" },
  { codigo: "27", descricao: "PM-1 AO PM-7", fabricante: null, categoria: "Quadro / Caixa", preco: "24.00" },
  { codigo: "21", descricao: "BARRAMENTO 3/4X3/16", fabricante: null, categoria: "Barramento", preco: "0.00" },
  { codigo: "1024", descricao: "EMENDA DE CABO DE REDE RJ45 8P CAT5 M101S FORTREK", fabricante: null, categoria: "Material Auxiliar", preco: "2.99" },
  { codigo: "2679", descricao: "CABO DE REDE CAT.6 U/UTP 24AWGX4P CMX AZ SOHOPLUS", fabricante: null, categoria: "Material Auxiliar", preco: "4.60" },
  { codigo: "2824", descricao: "CONECTOR MACHO RJ45 CAT.6", fabricante: null, categoria: "Material Auxiliar", preco: "0.70" },
  { codigo: "116079", descricao: "PARAFUSO ROSCA SOBERBA C/SEXT ZINC 1/4 X 60MM CISER", fabricante: "CISER", categoria: "Material Auxiliar", preco: "0.90" },
  { codigo: "115523", descricao: "PARAFUSO MITOFIX 4.5 X 40 BELENUS/CISER", fabricante: "CISER", categoria: "Material Auxiliar", preco: "0.30" },
  { codigo: "16837", descricao: "ABRACADEIRA DE NYLON BRANCA 4.8MMX300MM PARAMAX", fabricante: "PARAMAX", categoria: "Material Auxiliar", preco: "15.00" },
  { codigo: "120568", descricao: "BUCHA DE NYLON CINZA C/ABA S-10 SFORPLAST", fabricante: "SFORPLAST", categoria: "Material Auxiliar", preco: "0.65" },
  { codigo: "17908", descricao: "BUCHA DE NYLON CINZA S-6 C/ABA 500PC SFORPLAST", fabricante: "SFORPLAST", categoria: "Material Auxiliar", preco: "0.20" },
  { codigo: "116292", descricao: "DISCO CORTE C/DEPRESSAO 9 X 1/8 X 7/8 CARBORUNDUM", fabricante: "CARBORUNDUM", categoria: "Ferramenta", preco: "22.00" },
  { codigo: "119853", descricao: "DISCO CORTE FERRO 7 X 1/8 X 7/8 PREMIER CARBORUNDUM", fabricante: "CARBORUNDUM", categoria: "Ferramenta", preco: "17.00" },
  { codigo: "14120", descricao: "DISCO CORTE ACO INOX 4-1/2X1/25X7/8 STANLEY", fabricante: "STANLEY", categoria: "Ferramenta", preco: "2.65" },
  { codigo: "120461", descricao: "BROCA ACO RAPIDO PARAL 11MM BA321 PARAMAX", fabricante: "PARAMAX", categoria: "Ferramenta", preco: "18.00" },
  { codigo: "121580", descricao: "BROCA ACO RAPIDO PARAL 12MM BA323 PARAMAX", fabricante: "PARAMAX", categoria: "Ferramenta", preco: "23.00" },
  { codigo: "14286", descricao: "BROCA ACO RAPIDO PARAL 7/32 IRWIN", fabricante: "IRWIN", categoria: "Ferramenta", preco: "8.50" },
  { codigo: "12619", descricao: "ESCOVA DE CARVAO CB-101", fabricante: null, categoria: "Ferramenta", preco: "20.00" },
  { codigo: "10036", descricao: "SERRA COPO STARRETT 35MM", fabricante: "STARRETT", categoria: "Ferramenta", preco: "110.00" },
  { codigo: "12792", descricao: "LAMINA TICO TICO BU36 MADEIRA C/5PCS STARRET", fabricante: "STARRET", categoria: "Ferramenta", preco: "60.00" },
  { codigo: "121543", descricao: "OCULOS INCOLOR STX STF-VS101110 STEELFLEX", fabricante: "STEELFLEX", categoria: "EPI", preco: "4.00" },
  { codigo: "110083", descricao: "CADEADO LATAO 50MM PADO", fabricante: "PADO", categoria: "Outros", preco: "48.00" },
  { codigo: "120965", descricao: "RODIZIO CHAPA GIRATORIO C/FREIO 3 CINZA AJAX", fabricante: "AJAX", categoria: "Outros", preco: "38.00" },
  { codigo: "120967", descricao: "RODIZIO CHAPA GIRATORIO 3 CINZA AJAX", fabricante: "AJAX", categoria: "Outros", preco: "33.00" },
  { codigo: "29102", descricao: "ANILHA (1) 2.5 A 4.0MM", fabricante: null, categoria: "Material Auxiliar", preco: "0.00" },
  { codigo: "29103", descricao: "ANILHA (2) 2.5 A 4.0MM", fabricante: null, categoria: "Material Auxiliar", preco: "0.00" },
  { codigo: "29104", descricao: "ANILHA (3) 2.5 A 4.0MM", fabricante: null, categoria: "Material Auxiliar", preco: "0.00" },
  { codigo: "29105", descricao: "ANILHA (4) 2.5 A 4.0MM", fabricante: null, categoria: "Material Auxiliar", preco: "0.00" },
  { codigo: "29106", descricao: "ANILHA (5) 2.5 A 4.0MM", fabricante: null, categoria: "Material Auxiliar", preco: "0.00" },
  { codigo: "29107", descricao: "ANILHA (6) 2.5 A 4.0MM", fabricante: null, categoria: "Material Auxiliar", preco: "0.00" },
  { codigo: "29108", descricao: "ANILHA (7) 2.5 A 4.0MM", fabricante: null, categoria: "Material Auxiliar", preco: "0.00" },
  { codigo: "29109", descricao: "ANILHA (8) 2.5 A 4.0MM", fabricante: null, categoria: "Material Auxiliar", preco: "0.00" },
  { codigo: "29110", descricao: "ANILHA (9) 2.5 A 4.0MM", fabricante: null, categoria: "Material Auxiliar", preco: "0.00" },
  { codigo: "29170", descricao: "ANILHA (H) 2.5 A 4.0MM", fabricante: null, categoria: "Material Auxiliar", preco: "0.00" },
  { codigo: "29178", descricao: "ANILHA (R) 2.5 A 4.0MM", fabricante: null, categoria: "Material Auxiliar", preco: "0.00" },
  { codigo: "29179", descricao: "ANILHA (S) 2.5 A 4.0MM", fabricante: null, categoria: "Material Auxiliar", preco: "0.01" },
  { codigo: "29180", descricao: "ANILHA (T) 2.5 A 4.0MM", fabricante: null, categoria: "Material Auxiliar", preco: "0.01" },
  { codigo: "18596", descricao: "ELETRODO 6013 2.5MM AZUL GERDAU", fabricante: "GERDAU", categoria: "Material Auxiliar", preco: "30.00" },
  { codigo: "117314", descricao: "ARAME GALVANIZADO RL 1KG NR-16 1.65MM MORLAN/GERDAU", fabricante: "GERDAU", categoria: "Material Auxiliar", preco: "32.50" },
  { codigo: "12545", descricao: "ARAME GALVANIZADO RL 1KG NR-20 MORLAN/GERDAU", fabricante: "GERDAU", categoria: "Material Auxiliar", preco: "45.00" },
  { codigo: "116322", descricao: "FITA CREPE 48MMX50M R-427 ADERE", fabricante: "ADERE", categoria: "Material Auxiliar", preco: "14.00" },
  { codigo: "2641", descricao: "FITA CREPE 48X50MT REF.423 TAPERFIX ADERE", fabricante: "ADERE", categoria: "Material Auxiliar", preco: "12.90" },
  { codigo: "112490", descricao: "FITA DUPLA FACE TRANSP 19MMX2M ADERMAX ADERE", fabricante: "ADERE", categoria: "Material Auxiliar", preco: "15.00" },
  { codigo: "121393", descricao: "FITA DUPLA FACE 12X2MT EXTREMA 3M", fabricante: "3M", categoria: "Material Auxiliar", preco: "35.00" },
  { codigo: "17798", descricao: "FITA MULTIUSO ALUMINIZADA 15CMX10MT SIKA", fabricante: "SIKA", categoria: "Material Auxiliar", preco: "40.00" },
  { codigo: "12882", descricao: "COLA CONTATO 2.80KG/3.6LT KISAFIX", fabricante: "KISAFIX", categoria: "Material Auxiliar", preco: "125.00" },
  { codigo: "636", descricao: "COLA TEK BOND MULTIUSO 20GRS N793", fabricante: "TEK BOND", categoria: "Material Auxiliar", preco: "10.98" },
  { codigo: "121872", descricao: "SELANTE PU 40 CINZA 400G 280ML PROF UNIPEGA", fabricante: "UNIPEGA", categoria: "Material Auxiliar", preco: "13.00" },
  { codigo: "121873", descricao: "SELANTE PU 40 PRETO 400G 280ML PROF UNIPEGA", fabricante: "UNIPEGA", categoria: "Material Auxiliar", preco: "13.00" },
  { codigo: "113549", descricao: "PRIMER MANTA BASE DAGUA 1LT PRODESIVO/WADIMEX", fabricante: "WADIMEX", categoria: "Material Auxiliar", preco: "15.00" },
  { codigo: "115458", descricao: "MASSA PLASTICA BRANCA 400G IBERE", fabricante: "IBERE", categoria: "Material Auxiliar", preco: "19.50" },
  { codigo: "111764", descricao: "SPRAY PINTURA 400ML AZUL MOTOR RADCOLOR", fabricante: "RADCOLOR", categoria: "Material Auxiliar", preco: "17.00" },
  { codigo: "14429", descricao: "SPRAY PINTURA 400ML AZUL CLARO UG RADCOLOR", fabricante: "RADCOLOR", categoria: "Material Auxiliar", preco: "17.00" },
  { codigo: "6440", descricao: "TINTA SPRAY VERDE", fabricante: null, categoria: "Material Auxiliar", preco: "0.00" },
  { codigo: "119423", descricao: "TRINCHA CERDA 2 PARAMAX", fabricante: "PARAMAX", categoria: "Ferramenta", preco: "7.50" },
  { codigo: "119426", descricao: "TRINCHA CERDA 4 PARAMAX", fabricante: "PARAMAX", categoria: "Ferramenta", preco: "15.00" },
  { codigo: "409", descricao: "CARGA DE MISTURA 10MT", fabricante: null, categoria: "Material Auxiliar", preco: "295.00" },
  { codigo: "368", descricao: "CONJUNTO DE BICO COMPLETO MB15", fabricante: null, categoria: "Ferramenta", preco: "85.00" },
  { codigo: "72", descricao: "BICO DE CONTATO M8 0.8MM", fabricante: null, categoria: "Ferramenta", preco: "10.00" },
  { codigo: "56", descricao: "CANTONEIRA 78CM X 10MM", fabricante: null, categoria: "Material Auxiliar", preco: "35.00" },
  { codigo: "118322", descricao: "CORDA POLIPROPILENO BRANCA 2.5MM GRILON", fabricante: "GRILON", categoria: "Material Auxiliar", preco: "0.90" },
  { codigo: "18408", descricao: "LAMPADA BULBO LED ALTA POT 50W OUROLUX/FOXLUX", fabricante: null, categoria: "Outros", preco: "30.00" },
  { codigo: "113780", descricao: "PINO JUNCAO MACHO 2P+T 10AMP PRETO/BRANCO TRAMONTI", fabricante: "TRAMONTI", categoria: "Outros", preco: "8.50" },
  { codigo: "122179", descricao: "PINO ADAPTADOR DESLOCADO 3T 10A/20A", fabricante: null, categoria: "Outros", preco: "3.50" },
  { codigo: "17340", descricao: "ADAPTADOR S/ABA 10A DESLOCADO BRANCO", fabricante: null, categoria: "Outros", preco: "5.00" },
  { codigo: "926", descricao: "FILTRO DE LINHA C/06 TOMADAS 10A CABO 1METRO FIOLUX", fabricante: "FIOLUX", categoria: "Outros", preco: "26.90" },
  { codigo: "1876", descricao: "FILTRO DE LINHA C/06 TOMADAS 10A CABO 1.5MT ELGIN", fabricante: "ELGIN", categoria: "Outros", preco: "46.50" },
  { codigo: "19617", descricao: "CONTROLE PARA PORTAO ROSSI PRETO", fabricante: "ROSSI", categoria: "Outros", preco: "55.00" },
  { codigo: "7570", descricao: "MEMORIA DDR-4 P/NOTEBOOK 08GB 3200MHZ 1.2V PC4 KINGSTON", fabricante: "KINGSTON", categoria: "Outros", preco: "198.00" },
  { codigo: "195", descricao: "TECLADO S/FIO KIT + MOUSE S/FIO USB NANO REF. MK-345 LOGITECH", fabricante: "LOGITECH", categoria: "Outros", preco: "259.90" },
  { codigo: "7595", descricao: "TECLADO S/FIO KIT + MOUSE S/FIO USB NANO REF. MK-295 LOGITECH", fabricante: "LOGITECH", categoria: "Outros", preco: "269.90" },
  { codigo: "2521", descricao: "REFIL EPSON BULK-INK 504/544 CIANO 70ML MASTERPRINT", fabricante: "MASTERPRINT", categoria: "Outros", preco: "14.90" },
  { codigo: "1374", descricao: "NOTEFIX 76X76MM AMARELO 100FLS", fabricante: null, categoria: "Outros", preco: "4.99" },
  { codigo: "2325", descricao: "LAPIS N2 PRETO C/BORRACHA REF. 1205 MAX FABER", fabricante: "FABER", categoria: "Outros", preco: "1.20" },
  { codigo: "167", descricao: "CANETA BIC CRISTAL ESCRITA FINA 0.8 AZUL CX C/50 UND", fabricante: "BIC", categoria: "Outros", preco: "49.90" },
  { codigo: "2333", descricao: "TESOURA ESCOLAR S/PONTA MP-502 MASTERPRINT", fabricante: "MASTERPRINT", categoria: "Outros", preco: "2.90" },
  { codigo: "2209", descricao: "PAPEL A4 210X297 75GRS CX C/10X500 OFFICE CHAMEX", fabricante: "CHAMEX", categoria: "Outros", preco: "298.00" },
  { codigo: "12554", descricao: "PARAFUSO MAQUINA C/R ZINC 3/16 X 1.1/2 CISER", fabricante: "CISER", categoria: "Material Auxiliar", preco: "0.40" },
  { codigo: "13227", descricao: "CH ALLEN 2.5MM BELZER", fabricante: "BELZER", categoria: "Ferramenta", preco: "4.00" },
  { codigo: "15245", descricao: "CH ALLEN 6MM SATA", fabricante: "SATA", categoria: "Ferramenta", preco: "6.00" },
  { codigo: "01051010023", descricao: "CH ALLEN T 6MM SATA", fabricante: "SATA", categoria: "Ferramenta", preco: "25.98" },
  { codigo: "01051010024", descricao: "CH ALLEN T 5MM SATA", fabricante: "SATA", categoria: "Ferramenta", preco: "20.83" },
  { codigo: "10413668", descricao: "CMS2-15 LUVA CRISTAL", fabricante: null, categoria: "EPI", preco: "164.30" },
  { codigo: "10415378", descricao: "CMS2/3-18 LUVA CRISTAL", fabricante: null, categoria: "EPI", preco: "0.77" },
]

async function main() {
  console.log("🌱 Iniciando seed...")

  // Admin user
  const hash = await bcrypt.hash("KL@2025", 12)
  await prisma.user.upsert({
    where: { email: "admin@klengenharia.com.br" },
    update: {},
    create: {
      name: "Administrador KL",
      email: "admin@klengenharia.com.br",
      password: hash,
      role: "ADMIN",
    },
  })
  console.log("✅ Usuário admin criado")

  // DRE 2025
  const dreExistente = await prisma.dREParametros.findFirst({ where: { exercicio: "2025" } })
  if (!dreExistente) {
    await prisma.dREParametros.create({
      data: {
        exercicio: "2025",
        pctCustoFixo: "0.2008255537",
        pctCustoVariavel: "0.0094",
        pctSalarios: "0.008443397671",
        faturamentoEstimado: "10100427.97",
        ativo: true,
      },
    })
    console.log("✅ DRE 2025 criada e ativada")
  }

  // Componentes
  let criados = 0
  for (const comp of componentes) {
    const existe = await prisma.componente.findUnique({ where: { codigoFabricante: comp.codigo } })
    if (!existe) {
      await prisma.componente.create({
        data: {
          codigoFabricante: comp.codigo,
          descricao: comp.descricao,
          fabricante: comp.fabricante,
          categoria: comp.categoria,
          unidadeMedida: "Unidade",
          precos: { create: { precoCusto: comp.preco } },
        },
      })
      criados++
    }
  }
  console.log(`✅ ${criados} componentes criados (${componentes.length - criados} já existiam)`)
  console.log("🎉 Seed concluído!")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
