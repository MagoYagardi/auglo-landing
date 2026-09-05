import { Demo } from "@/components/Demo";
import { Cierre } from "@/components/Cierre";
import { Filetes } from "@/components/Filetes";
import { MapaUruguay } from "@/components/MapaUruguay";
import { Reveal } from "@/components/Reveal";

const COMPUERTAS = [
  {
    titulo: "Decreto 132/022",
    texto:
      "Un agente que puede llamar a cualquier hora no es una ventaja: es un problema legal. El horario permitido en Uruguay está en el código, y la compuerta corre antes de discar.",
  },
  {
    titulo: "Registro No Llame",
    texto:
      "URSEC sanciona por separado dos cosas distintas: no consultar el registro, y llamar a quien pidió que no lo llamen. El motor las trata como dos obligaciones, porque lo son.",
  },
  {
    titulo: "Se declara en el primer turno",
    texto:
      "El agente dice que es un asistente virtual en la primera oración, pegado al nombre. Postergarlo a un segundo turno es no hacerlo: la mayoría de las llamadas se mueren en el turno uno.",
  },
];

const HORIZONTES = [
  {
    n: "H1",
    titulo: "Operar de verdad",
    texto:
      "Una concesionaria uruguaya, llamadas reales, y el corpus que sale de ellas.",
  },
  {
    n: "H2",
    titulo: "Otros idiomas",
    texto:
      "El mismo arnés en es-AR, es-CL y pt-BR. Lo local vive en datos, nunca en el motor.",
  },
  {
    n: "H3",
    titulo: "Vender el método",
    texto:
      "Lo que se vende no son los prompts: es el gobierno por evaluaciones que los mantiene calibrados.",
  },
];

export default function Home() {
  return (
    <>
      <header className="border-b border-rule">
        <Reveal
          className="mx-auto flex max-w-[1280px] items-center justify-between px-6 py-5 lg:px-10"
          y={10}
          start="top 100%"
        >
          <span className="expandido text-[1.15rem] font-bold tracking-tight">
            Auglo
          </span>
          <nav className="flex items-center gap-6 text-[0.85rem] text-dim">
            <a href="#tesis" className="transition-colors hover:text-text">
              Tesis
            </a>
            <a href="#lista" className="transition-colors hover:text-text">
              Lista de espera
            </a>
          </nav>
        </Reveal>
      </header>

      <main>
        <section className="relative border-b border-rule">
          <Filetes cols={4} />
          <div className="relative mx-auto max-w-[1280px] px-6 py-16 sm:py-20 lg:px-10 lg:py-24">
            <Demo />
          </div>
        </section>

        <section className="border-b border-rule">
          <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-10 lg:py-20">
            <Reveal>
              <h2 className="expandido max-w-[24ch] text-[length:var(--text-seccion)] font-bold leading-tight">
                Lo que frena una llamada antes de discar
              </h2>
              <p className="mt-4 max-w-[52ch] leading-relaxed text-dim">
                No son advertencias en un documento. Son condiciones en el
                código que impiden la llamada, y no tienen forma de saltearse
                desde el panel.
              </p>
            </Reveal>
            <Reveal
              as="ul"
              stagger={0.12}
              className="mt-12 grid gap-px bg-rule sm:grid-cols-3"
            >
              {COMPUERTAS.map((c) => (
                <li key={c.titulo} className="bg-ground py-6 sm:px-6 sm:py-2 sm:first:pl-0">
                  <h3 className="text-[1.05rem] font-semibold text-text">
                    {c.titulo}
                  </h3>
                  <p className="mt-3 text-[0.92rem] leading-relaxed text-dim">
                    {c.texto}
                  </p>
                </li>
              ))}
            </Reveal>
          </div>
        </section>

        <section id="tesis" className="border-b border-rule">
          <div className="mx-auto grid max-w-[1280px] gap-14 px-6 py-16 lg:grid-cols-[1.15fr_1fr] lg:gap-20 lg:px-10 lg:py-24">
            <div>
              <Reveal>
                <h2 className="expandido max-w-[20ch] text-[length:var(--text-seccion)] font-bold leading-tight">
                  Concesionarias primero. No concesionarias solamente.
                </h2>
                <div className="mt-6 flex max-w-[54ch] flex-col gap-4 leading-relaxed text-dim">
                  <p>
                    Lo que se construye es un motor conversacional gobernado por
                    evaluaciones: cada llamada deja telemetría, cada error se
                    vuelve un caso de prueba, y cada agente tiene un objetivo
                    declarado contra el que se lo mide. El recambio de vehículos es
                    su primer test, no su límite.
                  </p>
                  <p>
                    Ese motor no sabe de autos. Sabe de conversaciones con un
                    objetivo, un límite y un dato que hay que traer. Por eso el
                    mismo arnés atiende después a la cadena logística —dónde está
                    el camión, si el chofer confirma, cuándo se libera el
                    depósito— sin reescribirse.
                  </p>
                </div>
              </Reveal>

              <Reveal as="ol" stagger={0.1} className="mt-12 flex flex-col gap-px bg-rule">
                {HORIZONTES.map((h) => (
                  <li
                    key={h.n}
                    className="grid grid-cols-[3rem_1fr] items-baseline gap-4 bg-ground py-5"
                  >
                    <span className="tabular angosto text-[0.85rem] text-guinda-hi">
                      {h.n}
                    </span>
                    <div>
                      <h3 className="text-[1.02rem] font-semibold text-text">
                        {h.titulo}
                      </h3>
                      <p className="mt-1.5 max-w-[44ch] text-[0.92rem] leading-relaxed text-dim">
                        {h.texto}
                      </p>
                    </div>
                  </li>
                ))}
              </Reveal>
            </div>

            <Reveal className="flex flex-col justify-center" y={24}>
              <MapaUruguay className="w-full max-w-[420px] text-rule-hi" />
              <p className="mt-8 max-w-[42ch] text-[0.92rem] leading-relaxed text-dim">
                Uruguay es el mercado y es el laboratorio. El corpus de llamadas
                en español rioplatense —el activo que ningún competidor puede
                copiar— se produce acá. El camino para que además se procese acá
                está escrito y tiene tres pasos; hoy vamos por el primero.
              </p>
            </Reveal>
          </div>
        </section>

        <section id="lista">
          <div className="mx-auto max-w-[1280px] px-6 py-16 lg:px-10 lg:py-24">
            <Cierre />
          </div>
        </section>
      </main>

      <footer className="border-t border-rule">
        <div className="mx-auto flex max-w-[1280px] flex-wrap items-baseline justify-between gap-4 px-6 py-8 text-[0.82rem] text-dim lg:px-10">
          <span className="expandido font-bold text-text">Auglo</span>
          <span>Montevideo, Uruguay</span>
          <a href="mailto:info@auglo.uy" className="transition-colors hover:text-text">
            info@auglo.uy
          </a>
        </div>
      </footer>
    </>
  );
}
