#!/usr/bin/env node
/**
 * Ensayo de una llamada: hace lo que hará el agente, pero sin telefonía.
 *
 * Pide una sesión a /api/demo/call y después dispara los webhooks en el mismo
 * orden y con los mismos cuerpos que las tools de ElevenLabs. Sirve para dos
 * cosas: ver la ficha llenarse antes del evento, y probar que el contrato de
 * DEMO/03 está bien de los dos lados.
 *
 *   DEMO_ENSAYO=1 AUGLO_DEMO_SECRET=xxx npm run start
 *   node scripts/ensayo.mjs http://localhost:3000 xxx
 */

const base = process.argv[2] ?? "http://localhost:3000";
const secreto = process.argv[3] ?? process.env.AUGLO_DEMO_SECRET;
if (!secreto) {
  console.error("falta el secreto: node scripts/ensayo.mjs <url> <AUGLO_DEMO_SECRET>");
  process.exit(1);
}

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

async function agente(ruta, cuerpo) {
  const res = await fetch(`${base}/api/demo/${ruta}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secreto}`,
    },
    body: JSON.stringify(cuerpo),
  });
  const texto = await res.text();
  console.log(`  ${ruta.padEnd(8)} ${res.status}  ${texto.slice(0, 90)}`);
  return res.status;
}

// El guion de DEMO/02 §3, con la corrección adentro: la persona dice un modelo
// y después lo pisa con otro. Es el momento que hay que ver funcionar.
const GUION = [
  [600,  "estado",  { estado: "sonando" }],
  [1400, "estado",  { estado: "atendida" }],
  [200,  "turn",    { rol: "agente", texto: "Hola Gonzalo, te hablo de Automotora Rambla, soy Tomás, un asistente virtual. Te llamo por el recambio de tu auto — ¿tenés un minuto?", ts: 1.1 }],
  [2600, "turn",    { rol: "persona", texto: "Sí, dale.", ts: 9.4 }],
  [900,  "turn",    { rol: "agente", texto: "¿Qué auto tenés hoy?", ts: 11.0 }],
  [2200, "turn",    { rol: "persona", texto: "Un Hyundai.", ts: 14.8 }],
  [300,  "capture", { campo: "vehiculo", estado: "conocido", valor: "Hyundai" }],
  [2400, "turn",    { rol: "persona", texto: "Perdón, no — es un Fiat Uno.", ts: 18.2 }],
  [300,  "capture", { campo: "vehiculo", estado: "conocido", valor: "Fiat Uno" }],
  [1600, "turn",    { rol: "agente", texto: "Perfecto. ¿De qué año es?", ts: 21.0 }],
  [2000, "capture", { campo: "anio", estado: "conocido", valor: 2005 }],
  [400,  "turn",    { rol: "persona", texto: "Del 2005.", ts: 24.1 }],
  [1800, "turn",    { rol: "agente", texto: "¿Y cuántos kilómetros tiene?", ts: 26.5 }],
  [2400, "turn",    { rol: "persona", texto: "Uh, ni idea la verdad.", ts: 30.2 }],
  // Se preguntó y no lo sabía. No es lo mismo que no haber preguntado.
  [300,  "capture", { campo: "km", estado: "sin_respuesta", valor: null }],
  [1600, "turn",    { rol: "agente", texto: "No hay problema. Listo Gonzalo, ya lo tengo anotado. Gracias.", ts: 33.0 }],
  [2000, "close",   { outcome: "interesado", terminacion: "normal", duracion_s: 37 }],
];

const RECHAZOS = [
  ["año imposible", { campo: "anio", estado: "conocido", valor: 1890 }],
  ["km imposible",  { campo: "km", estado: "conocido", valor: 4_000_000 }],
];

const res = await fetch(`${base}/api/demo/call`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ nombre: "Gonzalo", telefono: "099123456", consent: true }),
});
const datos = await res.json();
if (!res.ok) {
  console.error("no se pudo crear la sesión:", res.status, datos);
  process.exit(1);
}
const session_id = datos.sessionId;
console.log(`\nsesión ${session_id}${datos.ensayo ? " (ensayo, no disca)" : ""}`);
console.log(`abrí ${base} y mirá la ficha\n`);

console.log("valores implausibles — se esperan 422, el agente repregunta:");
for (const [nombre, cuerpo] of RECHAZOS) {
  const codigo = await agente("capture", { session_id, ...cuerpo });
  if (codigo !== 422) console.error(`  ✗ ${nombre} devolvió ${codigo}, se esperaba 422`);
}

console.log("\nla llamada:");
for (const [pausa, ruta, cuerpo] of GUION) {
  await esperar(pausa);
  await agente(ruta, { session_id, ...cuerpo });
}

const final = await (await fetch(`${base}/api/demo/session/${session_id}`)).json();
console.log("\nficha final:");
for (const [campo, dato] of Object.entries(final.captura)) {
  const hist = dato.historial.length > 1 ? `  (corregido desde ${dato.historial[0]})` : "";
  console.log(`  ${campo.padEnd(20)} ${String(dato.estado).padEnd(14)} ${dato.valor ?? "—"}${hist}`);
}
console.log(`  estado               ${final.estado}`);
