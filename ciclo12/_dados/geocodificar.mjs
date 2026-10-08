// Geocodificação dos PEVs de Guarulhos com o Nominatim (OpenStreetMap).
// Uso (dentro da pasta ciclo12):  node _dados/geocodificar.mjs
// - Lê _dados/pevs_guarulhos.md (lista dos 33 PEVs) + o endereço da escola.
// - Faz 1 busca por segundo (regra de uso do Nominatim) e identifica o app no User-Agent.
// - Grava o resultado BRUTO em _dados/geocodificacao.json, com o grau de confiança.
// - Endereços já buscados ficam no arquivo e não são buscados de novo (apague o arquivo para refazer).
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const MD = "_dados/pevs_guarulhos.md";
const SAIDA = "_dados/geocodificacao.json";
const UA = "Ciclo12-TrabalhoEscolar/1.0 (Colegio Progresso, Guarulhos/SP; projeto escolar ODS 12)";

const norm = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
  .replace(/\b(rua|r\.|avenida|av\.|av|alameda|estrada|travessa)\b/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

// ---------- 1. Ler os PEVs do markdown ----------
function lerPevs() {
  // Só a seção B2 (lista de PEVs); o resto do arquivo tem outras listas numeradas.
  const md = readFileSync(MD, "utf8");
  const linhas = md.slice(md.indexOf("### B2"), md.indexOf("### B3")).split(/\r?\n/);
  const pevs = [];
  for (const l of linhas) {
    const m = l.match(/^(\d+)\.\s+(.*)$/);
    if (!m) continue;
    const num = Number(m[1]);
    let resto = m[2].replace(/\*\*/g, "").replace(/\s*⟵.*$/, "").replace(/\s*\(\s*conflito de endereço.*$/i, "").trim();
    const [nome, endereco] = resto.split(/\s+—\s+/);
    pevs.push({ num, nome: nome.trim(), endereco: endereco.trim() });
  }
  return pevs;
}

// Separa "Rua X, 91, Bairro" em rua / número / bairro. Casos especiais ficam com número null.
function separar(endereco) {
  const partes = endereco.split(",").map((s) => s.trim());
  let rua = partes[0], numero = null, bairro = null;
  if (partes[1] && /^\d+$/.test(partes[1])) { numero = partes[1]; bairro = partes[2] || null; }
  else if (partes[1]) { bairro = partes.slice(1).filter((p) => !/^s\/n/i.test(p)).join(", ") || null; }
  const alt = rua.match(/^(.*?)\s*\(altura do nº\s*(\d+)\)/i);
  if (alt) { rua = alt[1]; numero = alt[2]; }
  const esq = rua.match(/^(.*?)\s+esquina com\s+(.*)$/i);
  if (esq) { rua = esq[1]; }
  rua = rua.replace(/^Av\.\s*/i, "Avenida ");
  return { rua, numero, bairro };
}

// ---------- 2. Busca no Nominatim ----------
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
async function nominatim(params) {
  const url = "https://nominatim.openstreetmap.org/search?" + new URLSearchParams({
    format: "jsonv2", addressdetails: "1", limit: "5", countrycodes: "br", ...params,
  });
  const r = await fetch(url, { headers: { "User-Agent": UA, "Accept-Language": "pt-BR" } });
  if (!r.ok) throw new Error("HTTP " + r.status);
  await espera(1100); // 1 chamada por segundo
  return { url, resultados: await r.json() };
}

function cidadeDe(a) { return a.city || a.town || a.municipality || a.village || ""; }

// Classifica cada resultado:
//  alta  = achou a rua E o número exato, em Guarulhos
//  media = achou a rua em Guarulhos, mas não o número (posição aproximada: pode errar centenas de metros)
//  baixa = achou algo, mas não dá para garantir que é a rua certa
// Compara nomes de rua palavra por palavra. Aceita só: título a mais no OSM ("Doutor", "Professor"...)
// e inicial abreviada ("L." = "Leme"). "Rua Araci" NÃO casa com "Rua Araci Ubirajara e Silva".
const TITULOS = new Set(["doutor", "dr", "professor", "prof", "engenheiro", "eng", "padre", "dom", "de", "da", "do", "das", "dos", "e"]);
const palavras = (s) => norm(s).split(" ").filter((w) => w && !TITULOS.has(w));
function mesmaRua(a, b) {
  const x = palavras(a), y = palavras(b);
  if (!x.length || x.length !== y.length) return false;
  return x.every((w, i) => w === y[i] || (w.length === 1 && y[i][0] === w) || (y[i].length === 1 && w[0] === y[i]));
}
function classificar(res, alvo) {
  const a = res.address || {};
  if (norm(cidadeDe(a)) !== "guarulhos") return "baixa";
  if (!a.road || !mesmaRua(a.road, alvo.rua)) return "baixa";
  if (alvo.numero && a.house_number && a.house_number.split(/[;,\s]/)[0] === alvo.numero) return "alta";
  return "media";
}
const ORDEM = { alta: 3, media: 2, baixa: 1 };

function escolher(brutos, alvo) {
  let melhor = null;
  for (const b of brutos) for (const res of b.resultados) {
    const conf = classificar(res, alvo);
    if (!melhor || ORDEM[conf] > ORDEM[melhor.confianca]) {
      melhor = { confianca: conf, lat: Number(res.lat), lng: Number(res.lon), exibido: res.display_name, tipo: res.type, rua: res.address?.road || null, numeroOSM: res.address?.house_number || null, bairroOSM: res.address?.suburb || res.address?.neighbourhood || null };
    }
  }
  return melhor || { confianca: "nada" };
}

async function geocodificar(alvo, brutos = []) {
  const feitas = new Set(brutos.map((b) => b.url));
  const tentativas = [];
  tentativas.push({ street: (alvo.numero ? alvo.numero + " " : "") + alvo.rua, city: "Guarulhos", state: "São Paulo" });
  if (alvo.numero) tentativas.push({ street: alvo.rua, city: "Guarulhos", state: "São Paulo" });
  // busca livre (texto corrido), usada só se as estruturadas não acharem com confiança
  tentativas.push({ q: alvo.rua + (alvo.bairro ? ", " + alvo.bairro : "") + ", Guarulhos, São Paulo" });
  tentativas.push({ q: alvo.rua + ", Guarulhos" });
  for (const t of tentativas) {
    const atual = escolher(brutos, alvo);
    if (atual.confianca === "alta" || (atual.confianca === "media" && t.q)) break;
    const url = "https://nominatim.openstreetmap.org/search?" + new URLSearchParams({ format: "jsonv2", addressdetails: "1", limit: "5", countrycodes: "br", ...t });
    if (feitas.has(url)) continue;
    brutos.push(await nominatim(t));
  }
  return { melhor: escolher(brutos, alvo), brutos };
}

// ---------- 3. Rodar ----------
const pevs = lerPevs();
if (pevs.length !== 33) { console.error("Esperava 33 PEVs no markdown, achei", pevs.length); process.exit(1); }
const alvos = [
  { id: "escola", nome: "Colégio Progresso", endereco: "Av. Timóteo Penteado, 4405, Vila Galvão" },
  ...pevs.map((p) => ({ id: "pev-" + String(p.num).padStart(2, "0"), nome: p.nome, endereco: p.endereco })),
];

const cache = existsSync(SAIDA) ? JSON.parse(readFileSync(SAIDA, "utf8")) : { itens: {} };
for (const a of alvos) {
  const sep = separar(a.endereco);
  const antigo = cache.itens[a.id] && cache.itens[a.id].endereco === a.endereco ? cache.itens[a.id] : null;
  process.stdout.write(`${a.id} ${a.endereco} ... `);
  try {
    const { melhor, brutos } = await geocodificar(sep, antigo && antigo.brutos ? antigo.brutos : []);
    cache.itens[a.id] = { nome: a.nome, endereco: a.endereco, separado: sep, ...melhor, brutos };
    console.log(melhor.confianca);
  } catch (e) {
    cache.itens[a.id] = { nome: a.nome, endereco: a.endereco, separado: sep, confianca: "erro", erro: String(e) };
    console.log("ERRO", e.message);
  }
  cache.geradoEm = new Date().toISOString();
  cache.fonte = "Nominatim / OpenStreetMap (dados © colaboradores do OpenStreetMap, ODbL)";
  writeFileSync(SAIDA, JSON.stringify(cache, null, 2));
}
const resumo = {};
for (const v of Object.values(cache.itens)) resumo[v.confianca] = (resumo[v.confianca] || 0) + 1;
console.log("Resumo:", resumo);
