// Gera shared/pontos.js a partir de:
//   _dados/pevs_guarulhos.md          (lista dos 33 PEVs, fonte: Agência Mural 10/10/2025)
//   _dados/geocodificacao.json        (resultado do geocodificar.mjs)
//   _dados/coordenadas_manuais.json   (OPCIONAL: coordenadas conferidas pelo grupo no Google Maps)
// Uso (dentro da pasta ciclo12):  node _dados/gerar_pontos.mjs
//
// Regra das coordenadas (decidida com o Enzo em 07/10/2026):
//   "numero"     → o OpenStreetMap achou a rua E o número
//   "aproximada" → achou só a rua; usamos o centro dos trechos dela, com incerteza de até 1 km
//   "manual"     → conferida pelo grupo no Google Maps
//   "sem"        → não achou com confiança: lat/lng = null, o ponto aparece só na lista
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const LIMITE_INCERTEZA_KM = 1;
// Casos em que o nome difere só na grafia (conferido no resultado bruto, mesmo bairro):
const GRAFIA_ACEITA = {
  "pev-16": "No OpenStreetMap a avenida aparece como 'Benjamim Harris Hunnicutt', no mesmo bairro (Vila Rio).",
};

const ACEITA = ["entulho", "gesso", "solo", "moveis", "madeira", "poda", "eletrodomesticos", "oleo", "pneus", "papel", "plastico", "metal", "vidro"];
// Conferido na matéria em 07/10/2026: a fonte diz que os PEVs NÃO recebem pilhas/baterias,
// lâmpadas fluorescentes, restos de comida, óleo lubrificante e telhas/caixas com amianto.
const NAO_ACEITA = ["pilha", "lampada", "comida"];
// A matéria não cita celular nem roupa: mostrar como "confirmar".
const NAO_CONFIRMADO = ["celular", "roupa"];
const HORARIO_AMPLO = "amplo 7h-19h";
const HORARIO_REGULAR = "regular seg-sex 8h15-16h, sáb 8h15-15h30";
// Lista de horário ampliado CONFORME A FONTE (10 PEVs). A Parte B do plano tinha 9: faltava o Jurema.
const AMPLO = new Set(["Paraventi", "Gopoúva", "Continental", "Torres Tibagy", "Timóteo Penteado", "Iporanga", "Cabrália", "Santos Dumont", "Presidente Dutra", "Jurema"]);
// Pontos de referência que a matéria dá junto do endereço (ajudam a conferir no Google Maps).
const REFERENCIA = {
  "Paraventi": "próximo ao CIESP", "Continental": "atrás do CEU Continental",
  "Presidente Dutra": "esquina com Rua Maria Paula Mota", "Jurema": "esquina com Rua Guarapiranga",
  "Bom Clima": "ao lado do Thomeuzão", "Macedo": "atrás do Corpo de Bombeiros",
  "Vila Galvão": "altura do número 615 da Avenida Pedro de Souza Lopes",
  "Cabuçu": "em frente ao número 7800, Escola Maria Helena Faria Lima e Cunha",
  "Fortaleza": "ao lado do reservatório do SAAE", "Haroldo Veloso": "esquina com Rua Dalva de Oliveira",
  "Cidade Soimco": "altura do número 119",
};
const FONTE_PEV = "Agência Mural, 10/10/2025 — https://agenciamural.org.br/confira-onde-estao-os-ecopontos-de-guarulhos/";

const geo = JSON.parse(readFileSync("_dados/geocodificacao.json", "utf8")).itens;
const manuais = existsSync("_dados/coordenadas_manuais.json")
  ? JSON.parse(readFileSync("_dados/coordenadas_manuais.json", "utf8")) : {};

const hv = (a, b, c, d) => { const R = 6371, r = Math.PI / 180, x = Math.sin((c - a) * r / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin((d - b) * r / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(x)); };
const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const r5 = (n) => Math.round(n * 1e5) / 1e5;

// Decide lat/lng de um item geocodificado.
function coordenadas(id) {
  const m = manuais[id];
  if (m && typeof m.lat === "number" && typeof m.lng === "number") {
    return { lat: r5(m.lat), lng: r5(m.lng), coordPrecisao: "manual", coordIncertezaKm: 0, coordNota: m.nota || "Conferida pelo grupo no Google Maps." };
  }
  const g = geo[id];
  if (!g) return { lat: null, lng: null, coordPrecisao: "sem", coordIncertezaKm: null, coordNota: "Não geocodificado." };
  if (g.confianca === "alta") {
    return { lat: r5(g.lat), lng: r5(g.lng), coordPrecisao: "numero", coordIncertezaKm: 0, coordNota: "Número encontrado no OpenStreetMap." };
  }
  const aceitaGrafia = g.confianca === "baixa" && GRAFIA_ACEITA[id];
  if (g.confianca === "media" || aceitaGrafia) {
    // trechos da mesma rua devolvidos pelo OSM (sem repetir)
    const vistos = new Set(), trechos = [];
    for (const b of g.brutos) for (const res of b.resultados) {
      if (norm(res.address?.road) !== norm(g.rua) || vistos.has(res.place_id)) continue;
      vistos.add(res.place_id); trechos.push([Number(res.lat), Number(res.lon)]);
    }
    const lat = trechos.reduce((s, t) => s + t[0], 0) / trechos.length;
    const lng = trechos.reduce((s, t) => s + t[1], 0) / trechos.length;
    const inc = Math.max(0.1, ...trechos.map((t) => hv(lat, lng, t[0], t[1])));
    const incR = Math.ceil(inc * 10) / 10;
    // Régua para ENTRAR no mapa: a maior distância entre dois trechos da rua (o "espalhamento").
    // Rua com trechos espalhados por mais de 1 km = não sabemos em que parte fica o PEV.
    let espalhamento = 0;
    for (const a of trechos) for (const b of trechos) espalhamento = Math.max(espalhamento, hv(a[0], a[1], b[0], b[1]));
    if (espalhamento <= LIMITE_INCERTEZA_KM) {
      return { lat: r5(lat), lng: r5(lng), coordPrecisao: "aproximada", coordIncertezaKm: incR,
        coordNota: "Só a rua foi encontrada (sem o número). Posição no centro da rua, incerteza de até " + String(incR).replace(".", ",") + " km." + (aceitaGrafia ? " " + GRAFIA_ACEITA[id] : "") };
    }
    return { lat: null, lng: null, coordPrecisao: "sem", coordIncertezaKm: null,
      coordNota: "Rua encontrada, mas os trechos dela se espalham por " + String(Math.ceil(espalhamento * 10) / 10).replace(".", ",") + " km. Conferir no Google Maps." };
  }
  if (g.confianca === "baixa") return { lat: null, lng: null, coordPrecisao: "sem", coordIncertezaKm: null, coordNota: "O OpenStreetMap só achou ruas com nome parecido (ex.: " + (g.rua || "?") + "). Conferir no Google Maps." };
  return { lat: null, lng: null, coordPrecisao: "sem", coordIncertezaKm: null, coordNota: "Endereço não encontrado no OpenStreetMap. Conferir no Google Maps." };
}

// ---------- PEVs ----------
// Só a seção B2 (lista de PEVs); o resto do arquivo tem outras listas numeradas.
const md = readFileSync("_dados/pevs_guarulhos.md", "utf8");
const linhas = md.slice(md.indexOf("### B2"), md.indexOf("### B3")).split(/\r?\n/);
const pontos = [];
for (const l of linhas) {
  const m = l.match(/^(\d+)\.\s+(.*)$/);
  if (!m) continue;
  const num = Number(m[1]);
  const id = "pev-" + String(num).padStart(2, "0");
  const limpo = m[2].replace(/\*\*/g, "").replace(/\s*⟵.*$/, "").replace(/\s*\(\s*conflito de endereço.*$/i, "").trim();
  const [nome, endereco] = limpo.split(/\s+—\s+/).map((s) => s.trim());
  const sep = geo[id]?.separado || {};
  const p = {
    id, nome, tipo: "pev",
    endereco: endereco + ", Guarulhos/SP",
    bairro: sep.bairro || null,
    horario: AMPLO.has(nome) ? HORARIO_AMPLO : HORARIO_REGULAR,
    horarioTexto: nome === "Gopoúva" ? "Seg a sáb, 7h às 19h"
      : AMPLO.has(nome) ? "Todos os dias, 7h às 19h" : "Seg a sex, 8h15 às 16h; sáb, 8h15 às 15h30",
    aceita: ACEITA.slice(),
    naoAceita: NAO_ACEITA.slice(),
    naoConfirmado: NAO_CONFIRMADO.slice(),
    ...coordenadas(id),
    status: "confirmado-fonte",
    fonte: FONTE_PEV,
    atualizadoEm: "2025-10-10",
  };
  if (REFERENCIA[nome]) p.referencia = REFERENCIA[nome];
  if (!sep.bairro) p.bairroNota = "A fonte não informa o bairro.";
  if (nome === "Gopoúva") {
    p.status = "conflito";
    p.nota = "Duas fontes divergem: a Agência Mural diz 'Rua Guarulhos, 34' e outra fonte diz 'Rua Nadir, 34 (esquina com a Rua Guarulhos)'. Confirme com a Prefeitura antes de ir.";
  }
  pontos.push(p);
}
if (pontos.length !== 33) { console.error("Esperava 33 PEVs, achei", pontos.length); process.exit(1); }

// ---------- Escola ----------
const escola = {
  id: "escola", nome: "Colégio Progresso", tipo: "escola",
  endereco: "Av. Timóteo Penteado, 4405, Vila Galvão, Guarulhos/SP, CEP 07061-003",
  bairro: "Vila Galvão",
  ...coordenadas("escola"),
  status: "a-confirmar",
  nota: "Endereço tirado de um diretório de escolas (escol.as), não de fonte oficial. Confirmar na secretaria.",
  fonte: "https://www.escol.as/287199-progresso-colegio",
};

// ---------- Distância de cada PEV até a escola (Haversine) ----------
for (const p of pontos) {
  p.distEscolaKm = (p.lat != null && escola.lat != null) ? Math.round(hv(escola.lat, escola.lng, p.lat, p.lng) * 100) / 100 : null;
}

const saida = `/* =========================================================
   Ciclo 12 — pontos de coleta (arquivo GERADO, não edite à mão)
   Gerado por _dados/gerar_pontos.mjs em ${new Date().toISOString().slice(0, 10)}.
   Para corrigir uma coordenada: preencha _dados/coordenadas_manuais.json e rode
   "node _dados/gerar_pontos.mjs" de novo.

   Como usar:
   - Em <script src="shared/pontos.js"></script>: os dados ficam em window.CICLO_PONTOS
   - Em módulo: import "./shared/pontos.js";  depois use window.CICLO_PONTOS
   - No Node (testes): const dados = require("./shared/pontos.js")

   Campos de cada ponto:
   id, nome, tipo ("pev" | "doacao" | "escola"), endereco, bairro, horario,
   horarioTexto (para mostrar na tela), referencia (ponto de referência dado pela fonte),
   aceita (materiais que a fonte diz que a rede de PEVs recebe),
   naoAceita (materiais que a fonte diz que os PEVs NÃO recebem),
   naoConfirmado (itens que a fonte NÃO cita: mostrar como "confirmar"),
   lat, lng (null = sem posição confiável), coordPrecisao ("numero" | "aproximada" | "manual" | "sem"),
   coordIncertezaKm, coordNota, status ("confirmado-fonte" | "conflito" | "exemplo" | "a-confirmar"),
   fonte, atualizadoEm, distEscolaKm (Haversine até a escola; null se sem posição).
   "confirmado-fonte" = está na lista publicada pela fonte; NÃO quer dizer que alguém ligou e confirmou.
   ========================================================= */
(function (raiz) {
  "use strict";

  var CATEGORIAS = {
    entulho: "Entulho", gesso: "Gesso", solo: "Terra (solo)", moveis: "Móveis", madeira: "Madeira",
    poda: "Folhas e poda", eletrodomesticos: "Eletrodomésticos", oleo: "Óleo de cozinha", pneus: "Pneus",
    papel: "Papel", plastico: "Plástico", metal: "Metal", vidro: "Vidro",
    celular: "Celular", pilha: "Pilhas e baterias", lampada: "Lâmpada fluorescente", roupa: "Roupa", comida: "Restos de comida"
  };

  var ESCOLA = ${JSON.stringify(escola, null, 2).replace(/\n/g, "\n  ")};

  var PONTOS = ${JSON.stringify(pontos, null, 2).replace(/\n/g, "\n  ")};

  /* Locais de DOAÇÃO de roupas e alimentos.
     Ainda NÃO temos nenhum confirmado. Os 3 itens abaixo são MODELOS (status "exemplo"):
     nome fictício, sem endereço e sem coordenada. Substitua por locais confirmados por
     telefone/mensagem, no mesmo formato, trocando status para "confirmado-contato" e
     preenchendo "confirmadoEm" (data do contato) e "fonte" (com quem falaram). */
  var DOACAO = [
    { id: "doacao-exemplo-1", nome: "EXEMPLO: ponto de doação de roupas", tipo: "doacao", endereco: null, bairro: null, horario: null,
      aceita: ["roupa"], naoAceita: [], naoConfirmado: [], lat: null, lng: null, coordPrecisao: "sem", status: "exemplo",
      fonte: null, confirmadoEm: null, nota: "Modelo fictício. Não é um local real." },
    { id: "doacao-exemplo-2", nome: "EXEMPLO: banco de alimentos", tipo: "doacao", endereco: null, bairro: null, horario: null,
      aceita: ["comida"], naoAceita: [], naoConfirmado: [], lat: null, lng: null, coordPrecisao: "sem", status: "exemplo",
      fonte: null, confirmadoEm: null, nota: "Modelo fictício. Não é um local real." },
    { id: "doacao-exemplo-3", nome: "EXEMPLO: bazar beneficente", tipo: "doacao", endereco: null, bairro: null, horario: null,
      aceita: ["roupa"], naoAceita: [], naoConfirmado: [], lat: null, lng: null, coordPrecisao: "sem", status: "exemplo",
      fonte: null, confirmadoEm: null, nota: "Modelo fictício. Não é um local real." }
  ];

  var dados = {
    ESCOLA: ESCOLA,
    PONTOS: PONTOS,
    DOACAO: DOACAO,
    CATEGORIAS: CATEGORIAS,
    FONTE_PEV: ${JSON.stringify(FONTE_PEV)},
    AVISO: "Dados de PEV: Agência Mural, 10/10/2025; confirme horários e materiais com a Prefeitura de Guarulhos."
  };

  if (typeof module !== "undefined" && module.exports) { module.exports = dados; }
  if (raiz) { raiz.CICLO_PONTOS = dados; }
})(typeof window !== "undefined" ? window : null);
`;
writeFileSync("shared/pontos.js", saida);

const cont = {};
for (const p of pontos) cont[p.coordPrecisao] = (cont[p.coordPrecisao] || 0) + 1;
console.log("shared/pontos.js gerado:", pontos.length, "PEVs |", JSON.stringify(cont), "| escola:", escola.coordPrecisao);
