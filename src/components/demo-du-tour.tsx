/**
 * UN TOUR, EN DOUZE SECONDES.
 *
 * Les pages publiques expliquaient la boucle du jeu en prose : « l'équipe
 * reçoit une situation, pose un diagnostic, prend ses décisions, la simulation
 * répond ». C'est exact, et cela ne montre rien. Trois panneaux qui se
 * relaient dans le même cadre le font voir : on lit, on tranche, on subit le
 * chiffre — et on recommence avec ce qu'on vient d'apprendre.
 *
 * SANS VIDÉO NI JAVASCRIPT. La politique de sécurité du site n'autorise les
 * images que depuis lui-même, et un hébergeur vidéo serait bloqué ; une boucle
 * en CSS ne pèse rien, reste nette à toutes les tailles et suit les deux
 * thèmes. Le composant se rend sur le serveur : il n'y a rien à charger.
 *
 * QUI A DEMANDÉ MOINS D'ANIMATION N'EN REÇOIT AUCUNE. Sous
 * `prefers-reduced-motion`, la boucle s'arrête et les trois panneaux
 * s'affichent à la file : le même contenu, dans le même ordre, sans un
 * mouvement. C'est aussi ce que voit un lecteur d'écran, qui les lit tous les
 * trois.
 *
 * Les chiffres sont ceux d'un tour de NOVA, et ils ne sont donnés que pour
 * montrer la mécanique : rien ici n'est présenté comme une mesure.
 */

const PANNEAUX = [
  {
    cle: "situation",
    etape: "1 · La situation",
    titre: "Des clients repartis sans acheter",
    corps: "L'atelier plafonne à 7 000 enceintes. La demande a dépassé ce qu'il sait produire.",
    lignes: [
      ["Demande adressée", "8 400 unités"],
      ["Capacité de l'atelier", "7 000 unités"],
      ["Ventes perdues", "1 400 unités"],
    ] as const,
    accent: "text-sky-300",
  },
  {
    cle: "decision",
    etape: "2 · La décision",
    titre: "Produire plus, ou vendre plus cher ?",
    corps:
      "Produire plus immobilise de la trésorerie ; vendre plus cher fait retomber la demande. L'équipe tranche.",
    lignes: [
      ["Prix de vente", "59 € → 62 €"],
      ["Plan de production", "7 000 → 8 000"],
      ["Budget communication", "3 000 €"],
    ] as const,
    accent: "text-amber-300",
  },
  {
    cle: "resultat",
    etape: "3 · Le résultat",
    titre: "La simulation répond",
    corps:
      "Le marché a suivi le prix, l'atelier a tenu — et le stock a coûté sa trésorerie. Le tour suivant part de là.",
    lignes: [
      ["Chiffre d'affaires", "+ 31 %"],
      ["Résultat net", "+ 32 729 €"],
      ["Trésorerie", "− 27 198 €"],
    ] as const,
    accent: "text-emerald-300",
  },
] as const;

/*
 * DOUZE SECONDES, TROIS PANNEAUX, QUATRE SECONDES CHACUN. La durée et le
 * renoncement aux clics vivent dans `globals.css` (`.tour-panneau`) : une
 * animation posée en ligne échappe aux gardes de la feuille de style, et
 * celle-ci a une règle à tenir — deux panneaux sur trois sont transparents,
 * donc ne doivent pas rester cliquables. Ne reste ici que ce qui est propre à
 * chaque panneau : son rang dans la file.
 */
const RELAIS = 4;

export function DemoDuTour({ className = "" }: { className?: string }) {
  return (
    <figure className={`m-0 ${className}`}>
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900 p-5 shadow-2xl shadow-slate-950/40 motion-safe:h-[24rem] sm:motion-safe:h-[18rem] sm:p-6">
        {/*
          EN MOUVEMENT : les trois panneaux occupent le même cadre et se
          relaient. À L'ARRÊT : ils se suivent, et le cadre prend la hauteur
          qu'il faut. Les classes `motion-safe` / `motion-reduce` font la
          bascule sans qu'aucun script n'ait à la décider.
        */}
        <ol className="m-0 list-none space-y-5 p-0 motion-safe:space-y-0">
          {PANNEAUX.map((p, i) => (
            <li
              key={p.cle}
              className="tour-panneau motion-safe:absolute motion-safe:inset-5 motion-safe:opacity-0 sm:motion-safe:inset-6"
              style={{ animationDelay: `${i * RELAIS}s` }}
            >
              <p className={`text-xs uppercase tracking-[0.2em] ${p.accent}`}>{p.etape}</p>
              <p className="mt-2 font-display text-xl leading-tight text-slate-50">{p.titre}</p>
              <p className="mt-2 max-w-prose text-sm leading-relaxed text-slate-400">{p.corps}</p>
              <dl className="mt-4 grid gap-px overflow-hidden rounded-lg border border-white/5 bg-white/5 sm:grid-cols-3">
                {p.lignes.map(([libelle, valeur]) => (
                  <div key={libelle} className="bg-slate-950 px-3 py-2">
                    <dt className="text-xs uppercase tracking-[0.1em] text-slate-400">{libelle}</dt>
                    <dd className="m-0 font-mono text-sm tabular-nums text-slate-100">{valeur}</dd>
                  </div>
                ))}
              </dl>
            </li>
          ))}
        </ol>

        {/* Où l'on en est dans la boucle. Trois pastilles, pas une barre : il
            y a trois moments, et c'est le nombre qui compte. */}
        <p
          aria-hidden
          className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 gap-1.5 motion-safe:flex"
        >
          {PANNEAUX.map((p, i) => (
            <span
              key={p.cle}
              className="tour-pastille block h-1.5 w-6 rounded-full bg-amber-400 opacity-25"
              style={{ animationDelay: `${i * RELAIS}s` }}
            />
          ))}
        </p>
      </div>
      <figcaption className="mt-2 text-center text-xs text-slate-400">
        Un tour, du constat au résultat. Puis on recommence, avec ce qu&apos;on vient d&apos;apprendre.
      </figcaption>
    </figure>
  );
}
