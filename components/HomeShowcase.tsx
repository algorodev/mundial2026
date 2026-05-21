// Sección "Así se ve" del home. Hoy son mockups CSS para no depender de
// capturas. Para sustituir uno por una captura real:
//   - Coloca el PNG en /public/screenshots/<nombre>.png
//   - Reemplaza el <MockX> correspondiente por <Image src="/screenshots/..." />
export default function HomeShowcase() {
  return (
    <section className="mt-24 sm:mt-32 max-w-6xl mx-auto">
      <div className="text-center mb-10">
        <span className="inline-block bg-flame-500 text-pitch-950 font-display text-3xl sm:text-4xl px-5 py-2 border-2 border-pitch-950 shadow-brutal rotate-1">
          📸 ASÍ SE VE
        </span>
        <p className="mt-5 text-chalk-200 text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          Pronostica, comparte, gana. Sin instalar nada, en el móvil o en el
          ordenador.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MockupCard title="PRONOSTICAS" tilt="-rotate-1">
          <MockPredictions />
        </MockupCard>
        <MockupCard title="VES EL RANKING" tilt="rotate-1">
          <MockLeaderboard />
        </MockupCard>
        <MockupCard title="EN DIRECTO" tilt="-rotate-1">
          <MockLive />
        </MockupCard>
      </div>
    </section>
  );
}

function MockupCard({
  title,
  tilt,
  children,
}: {
  title: string;
  tilt: string;
  children: React.ReactNode;
}) {
  return (
    <article
      className={`cromo bg-paper-50 text-pitch-950 ${tilt} p-4 sm:p-5 hover:rotate-0 hover:-translate-y-1 transition-all`}
    >
      <div className="font-display text-xl sm:text-2xl uppercase tracking-tight leading-tight mb-3">
        {title}
      </div>
      <div className="bg-pitch-950 border-2 border-pitch-950 p-3 sm:p-4 min-h-[240px] flex flex-col gap-2">
        {children}
      </div>
    </article>
  );
}

/* ─────────────  Mockup: predicciones  ───────────── */

function MockPredictions() {
  const rows = [
    { home: "ESP", away: "ARG", hs: "2", as: "1", saved: true },
    { home: "POR", away: "FRA", hs: "1", as: "1", saved: true },
    { home: "BRA", away: "ALE", hs: "3", as: "0", saved: false },
  ];
  return (
    <>
      <div className="font-mono text-[9px] text-flame-400 uppercase tracking-widest mb-1">
        Grupo A · jornada 1
      </div>
      {rows.map((r, i) => (
        <div
          key={i}
          className="flex items-center justify-between gap-2 bg-pitch-900 border border-pitch-700 px-2 py-1.5"
        >
          <span className="font-display text-sm text-chalk-50 w-10">
            {r.home}
          </span>
          <div className="flex items-center gap-1">
            <span className="font-mono text-base text-flame-400 w-6 text-center bg-pitch-950 border border-pitch-700 py-0.5">
              {r.hs}
            </span>
            <span className="font-mono text-xs text-chalk-500">-</span>
            <span className="font-mono text-base text-flame-400 w-6 text-center bg-pitch-950 border border-pitch-700 py-0.5">
              {r.as}
            </span>
          </div>
          <span className="font-display text-sm text-chalk-50 w-10 text-right">
            {r.away}
          </span>
        </div>
      ))}
      <div className="font-mono text-[9px] text-grass-400 uppercase tracking-widest mt-auto pt-2">
        ✓ guardado · debounce 600 ms
      </div>
    </>
  );
}

/* ─────────────  Mockup: leaderboard  ───────────── */

function MockLeaderboard() {
  const rows = [
    { pos: 1, name: "Alex", pts: 25, exact: 3 },
    { pos: 2, name: "María", pts: 23, exact: 2 },
    { pos: 3, name: "Pablo", pts: 20, exact: 1 },
    { pos: 4, name: "Lucía", pts: 18, exact: 1 },
    { pos: 5, name: "Iván", pts: 14, exact: 0 },
  ];
  return (
    <>
      <div className="font-mono text-[9px] text-flame-400 uppercase tracking-widest mb-1">
        La porra de la oficina
      </div>
      {rows.map((r) => (
        <div
          key={r.pos}
          className="flex items-center justify-between bg-pitch-900 border border-pitch-700 px-2 py-1.5"
        >
          <div className="flex items-center gap-2">
            <span className="font-display text-base text-flame-400 w-5">
              {r.pos}
            </span>
            <span className="font-display text-sm text-chalk-50">{r.name}</span>
          </div>
          <div className="text-right">
            <div className="font-display text-base text-chalk-50 leading-none">
              {r.pts}
            </div>
            <div className="font-mono text-[8px] text-chalk-500 uppercase">
              {r.exact} exactos
            </div>
          </div>
        </div>
      ))}
      <div className="font-mono text-[9px] text-grass-400 uppercase tracking-widest mt-auto pt-1">
        ⟳ actualizado hace 2 s
      </div>
    </>
  );
}

/* ─────────────  Mockup: live  ───────────── */

function MockLive() {
  return (
    <>
      <div className="flex items-center gap-2 mb-1">
        <span className="inline-block w-2 h-2 rounded-full bg-brick-500 animate-pulse" />
        <span className="font-mono text-[9px] text-brick-400 uppercase tracking-widest">
          En directo · min 72
        </span>
      </div>
      <div className="bg-pitch-900 border border-pitch-700 p-3 flex items-center justify-between">
        <div className="text-center flex-1">
          <div className="font-display text-base text-chalk-50">ESPAÑA</div>
          <div className="font-mono text-[9px] text-chalk-500 uppercase">
            tu pronóstico 1-0
          </div>
        </div>
        <div className="px-3">
          <div className="font-display text-4xl text-flame-400 leading-none">
            1 - 0
          </div>
        </div>
        <div className="text-center flex-1">
          <div className="font-display text-base text-chalk-50">ARG</div>
          <div className="font-mono text-[9px] text-chalk-500 uppercase">
            van 3 exactos
          </div>
        </div>
      </div>
      <div className="bg-pitch-900 border border-pitch-700 p-2 flex items-center justify-between mt-1">
        <span className="font-display text-sm text-chalk-50">POR vs FRA</span>
        <span className="font-mono text-xs text-grass-400">2 - 1 · FT</span>
      </div>
      <div className="font-mono text-[9px] text-flame-400 uppercase tracking-widest mt-auto pt-1">
        +3 puntos en este partido
      </div>
    </>
  );
}
