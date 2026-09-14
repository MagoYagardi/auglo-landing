/**
 * La base de negocio de la demo. Espejo de `local-rework-v1/control/negocio/`
 * del repo principal.
 *
 * ## Por qué existe
 *
 * Sin esto, cuando alguien le pregunta al agente *"¿qué autos tenés?"*, el
 * agente contesta con lo que el modelo tenga en la cabeza — y en una demo que
 * corre en vivo frente a un desconocido, eso es una afirmación de stock que
 * nadie puede respaldar. `docs/adr/0003` del repo principal parte el mundo en
 * tres fuentes: (a) datos del cliente, (b) base de conocimiento regional, y
 * (c) los priors del modelo, de los que hay que abstenerse **siempre**.
 *
 * ## Por qué cada respuesta arrastra su `fuente`
 *
 * Para que una afirmación se pueda rastrear hasta el dato que la produjo, y
 * para que la consola pueda mostrar de dónde salió lo que el agente dijo. Un
 * string no dice de cuál de las tres fuentes vino; un `Hecho` sí.
 *
 * ## Lo que falta acá y está en el repo principal
 *
 * La agenda. En la demo la cita es `ejecutable: false` a propósito —la
 * concesionaria está mockeada— así que ofrecer horarios "libres" sería
 * inventar disponibilidad de un lugar que no existe. El calendario real vive
 * en el grafo nuevo, detrás de G-08, y ahí la cita se relee antes de
 * confirmarse.
 */

export type Hecho = {
  valor: string;
  fuente: string;
  /** Dispara el aviso hablado de que esto es una prueba. `adr/0004`. */
  ficticio?: boolean;
};

export type Abstencion = {
  hayDatos: false;
  motivo: string;
  /** Lo que el agente tiene que decir. No es un mensaje de error: es habla. */
  deciEsto: string;
  instruccion: string;
};

export type Respuesta = { hayDatos: true; datos: string[]; fuentes: string[]; aviso?: string } | Abstencion;

const NO_INVENTES = "No inventes el dato que falta. Decí esa frase, o algo muy parecido.";

function abstenerse(motivo: string, deciEsto: string): Abstencion {
  return { hayDatos: false, motivo, deciEsto, instruccion: NO_INVENTES };
}

function responder(hechos: Hecho[]): Respuesta {
  return {
    hayDatos: true,
    datos: hechos.map((h) => h.valor),
    fuentes: hechos.map((h) => h.fuente),
    ...(hechos.some((h) => h.ficticio)
      ? {
          aviso:
            "Ojo: este stock es de una prueba. Decilo en voz alta la primera vez " +
            "que nombres un auto, y no lo repitas después.",
        }
      : {}),
  };
}

// ---------------------------------------------------------------------------
// Inventario — ficticio y declarado. Espejo de `negocio/inventario.yaml`.
// ---------------------------------------------------------------------------
//
// No hay precios, y no es un olvido: la regla dura 3 del guion prohíbe
// afirmaciones de precio y de mercado, y un precio inventado en una llamada
// real es exactamente la clase de cosa que después hay que desdecir.

type Auto = { marca: string; modelo: string; anio: number; km: number; tipo: string; caja: string };

export const AUTOS: Auto[] = [
  { marca: "Chevrolet", modelo: "Onix", anio: 2022, km: 38000, tipo: "hatchback", caja: "manual" },
  { marca: "Fiat", modelo: "Cronos", anio: 2021, km: 52000, tipo: "sedán", caja: "manual" },
  { marca: "Volkswagen", modelo: "T-Cross", anio: 2022, km: 41000, tipo: "SUV", caja: "automática" },
  { marca: "Renault", modelo: "Duster", anio: 2020, km: 74000, tipo: "SUV", caja: "manual" },
  { marca: "Toyota", modelo: "Yaris", anio: 2023, km: 22000, tipo: "sedán", caja: "automática" },
  { marca: "Peugeot", modelo: "208", anio: 2022, km: 35000, tipo: "hatchback", caja: "automática" },
  { marca: "Nissan", modelo: "Kicks", anio: 2021, km: 58000, tipo: "SUV", caja: "automática" },
  { marca: "Chevrolet", modelo: "S10", anio: 2019, km: 96000, tipo: "pickup", caja: "manual" },
];

/** Cómo la gente pide una carrocería por teléfono, y qué es en el catálogo. */
const SINONIMOS: Record<string, string[]> = {
  camioneta: ["suv", "pickup"],
  chata: ["pickup"],
  auto: ["hatchback", "sedán"],
  "cuatro puertas": ["sedán"],
  chico: ["hatchback"],
};

export function inventario(tipo = "", caja = ""): Respuesta {
  const t = tipo.trim().toLowerCase();
  const c = caja.trim().toLowerCase();
  const buscados = SINONIMOS[t] ?? (t ? [t] : []);

  const elegidos = AUTOS.map((a, i) => ({ a, i })).filter(
    ({ a }) =>
      (buscados.length === 0 || buscados.some((b) => a.tipo.toLowerCase().includes(b))) &&
      (!c || a.caja.toLowerCase().includes(c)),
  );

  if (elegidos.length === 0)
    return abstenerse(
      `no hay autos con tipo=${tipo || "(todos)"} caja=${caja || "(todas)"}`,
      "De eso justo no tengo ahora. ¿Te sirve que te avise si entra alguno?",
    );

  return responder(
    elegidos.map(({ a, i }) => ({
      valor: `${a.marca} ${a.modelo} ${a.anio}, ${a.km} km, ${a.tipo}, caja ${a.caja}`,
      fuente: `inventario#autos[${i}]`,
      ficticio: true,
    })),
  );
}

// ---------------------------------------------------------------------------
// Sucursal — espejo de `negocio/sucursales.yaml`
// ---------------------------------------------------------------------------
//
// La dirección está deliberadamente ausente. En el YAML del repo principal es
// `direccion: null` con un comentario que lo explica: "sin dato -> Abstencion,
// no invención". Mandar a alguien a una dirección inventada es el peor error
// posible de una demo, porque se descubre yendo.

const SUCURSAL = {
  nombre: "sucursal de Pocitos",
  direccion: null as string | null,
  horario: { "lunes a viernes": "09:00-18:00", "sábados": "09:00-13:00", domingos: "cerrado" },
  ficticia: true,
};

export function sucursal(): Respuesta {
  const hechos: Hecho[] = [
    { valor: SUCURSAL.nombre, fuente: "sucursales#[0].nombre", ficticio: SUCURSAL.ficticia },
  ];
  if (SUCURSAL.direccion)
    hechos.push({ valor: `queda en ${SUCURSAL.direccion}`, fuente: "sucursales#[0].direccion" });
  for (const [cuando, rango] of Object.entries(SUCURSAL.horario))
    hechos.push({
      valor: `${cuando}: ${rango}`,
      fuente: `sucursales#[0].horario.${cuando}`,
      ficticio: SUCURSAL.ficticia,
    });
  return responder(hechos);
}

// ---------------------------------------------------------------------------
// FAQ — espejo de `negocio/faq.yaml`
// ---------------------------------------------------------------------------

const FAQ: { pregunta: string; respuesta: string; fuente: string }[] = [
  {
    pregunta: "de dónde sacaron mi número",
    respuesta:
      "Lo dejaste vos en la web de Auglo hace un momento, pidiendo esta demostración.",
    fuente: "faq#[0]",
  },
  {
    pregunta: "cuánto vale mi auto",
    respuesta: "Depende de verlo. Si querés lo miramos en la sucursal y te decimos.",
    fuente: "faq#[1]",
  },
  {
    pregunta: "toman mi auto en parte de pago",
    respuesta:
      "Sí, se puede. Cuánto te toman depende de verlo, eso lo miramos en la sucursal.",
    fuente: "faq#[2]",
  },
  {
    pregunta: "esto es real o es una demo",
    respuesta:
      "Es una demostración. No hay una concesionaria atrás y no te estoy vendiendo nada.",
    fuente: "faq#[3]",
  },
];

export function faq(pregunta: string): Respuesta {
  const q = pregunta.trim().toLowerCase();
  if (!q) return abstenerse("sin pregunta", "Eso te lo confirmo bien y te aviso.");

  // Match por palabras compartidas: el agente parafrasea, no cita.
  const palabras = q.split(/\s+/).filter((w) => w.length > 3);
  let mejor: (typeof FAQ)[number] | null = null;
  let mejorPuntaje = 0;
  for (const item of FAQ) {
    const puntaje = palabras.filter((w) => item.pregunta.includes(w)).length;
    if (puntaje > mejorPuntaje) {
      mejor = item;
      mejorPuntaje = puntaje;
    }
  }
  if (!mejor || mejorPuntaje === 0)
    return abstenerse(
      `la faq no tiene ${JSON.stringify(pregunta)}`,
      "Eso te lo confirmo bien y te aviso, no te quiero decir cualquier cosa.",
    );
  return responder([{ valor: mejor.respuesta, fuente: mejor.fuente }]);
}
