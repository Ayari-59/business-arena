import { formatEuro, formatPercent, formatUnits } from "@/lib/format";
import type { GameView } from "@/services/game.service";

/**
 * Ce qu'il faut avoir sous les yeux pour décider, à TOUS les tours.
 *
 * Le tour 1 et les suivants montrent les mêmes panneaux, pour deux raisons :
 * les paramètres ne cessent pas d'être utiles une fois lus, et un élève qui
 * change de tour ne doit pas avoir à se souvenir de la taille des segments.
 * Seule la source de l'arbitrage change : écrit d'avance au tour 1, calculé
 * sur le tour écoulé ensuite.
 */

export interface Route {
  label: string;
  gain: string;
  risque: string;
}

/** L'arbitrage du tour : la question, et deux routes qui se défendent. */
export function DilemmaCard({
  title,
  question,
  routes,
}: {
  title: string;
  question: string;
  routes: readonly Route[];
}) {
  return (
    /*
      Un liseré ambre à gauche suffit à désigner la zone de décision. La carte
      entière teintée en ambre criait plus fort que la question qu'elle porte, et
      passait devant les panneaux qui servent à y répondre.
    */
    <div className="rounded-lg border border-white/10 border-l-2 border-l-amber-400/70 bg-slate-900 p-1.5 sm:p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-400/90">{title}</h3>
      {/* La question est le point d'arrivée de l'écran : elle se lit avant tout
          le reste de la carte. */}
      <p className="mt-1.5 text-base font-semibold leading-snug text-slate-50">{question}</p>
      <div className={`mt-3 grid gap-2 ${routes.length > 2 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {routes.map((route) => (
          <div key={route.label} className="rounded-lg border border-white/10 bg-slate-950 p-1.5 sm:p-3">
            <p className="text-sm font-medium text-slate-100">{route.label}</p>
            {/*
              La COULEUR EST DANS LA FLÈCHE, pas dans la phrase. Deux blocs de
              texte, l'un vert l'autre rouge, se lisaient comme une alarme ; la
              flèche dit le sens d'un coup d'œil et laisse la phrase lisible.
              Elle ne dit pas seule : chaque ligne garde son intitulé pour les
              lecteurs d'écran et pour qui ne distingue pas les deux teintes.
            */}
            <p className="mt-2 flex gap-1.5 text-xs leading-snug text-slate-400">
              <span aria-hidden className="text-emerald-400">
                ↗
              </span>
              <span>
                <span className="sr-only">Ce que cela rapporte : </span>
                {route.gain}
              </span>
            </p>
            <p className="mt-1 flex gap-1.5 text-xs leading-snug text-slate-400">
              <span aria-hidden className="text-rose-400/80">
                ↘
              </span>
              <span>
                <span className="sr-only">Ce que cela coûte : </span>
                {route.risque}
              </span>
            </p>
          </div>
        ))}
      </div>
      {/* Le message essentiel tient en une ligne : il n'y a pas de bonne
          réponse à cocher. Le paragraphe qu'il remplace disait la même chose en
          trois fois plus de mots. */}
      <p className="mt-2.5 text-xs text-slate-500">
        Aucune n&apos;est la bonne réponse — le marché tranchera au tour suivant.
      </p>
    </div>
  );
}

/** Une valeur chiffrée de la fiche : son intitulé, son chiffre, et ce qu'il implique. */
function Chiffre({
  label,
  valeur,
  note,
  accent = false,
}: {
  label: string;
  valeur: string;
  note?: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p
        className={`tabular-nums text-base font-semibold ${accent ? "text-amber-300" : "text-slate-100"}`}
      >
        {valeur}
      </p>
      {note ? <p className="text-xs leading-snug text-slate-500">{note}</p> : null}
    </div>
  );
}

/** Les paramètres : ce que vaut l'entreprise, et le marché en face d'elle. */
export function ParametersPanels({
  intro,
  vocabulary,
  capacityFacts,
  gamme = null,
}: {
  intro: GameView["intro"];
  vocabulary: GameView["vocabulary"];
  capacityFacts: GameView["capacityFacts"];
  /** Gamme du scénario joué : les coûts se lisent alors référence par référence. */
  gamme?: GameView["gamme"];
}) {
  const showShare = intro.segments.some((s) => s.yourShare !== null);
  // Le marché en un chiffre : ce qui s'achète en tout, et dans quelle fourchette
  // de prix. C'est ce qu'il faut pour dimensionner un volume ; le détail par
  // clientèle vient juste après, à la demande.
  const marcheTotal = intro.segments.reduce((t, s) => t + s.size, 0);
  const prixUsuels = intro.segments.map((s) => s.refPrice);
  const prixMin = Math.min(...prixUsuels);
  const prixMax = Math.max(...prixUsuels);
  // Le plafond physique n'est pas toujours celui qui vous arrête : un cabinet a
  // des bureaux pour bien plus de consultants qu'il n'en emploie. Annoncer les
  // locaux sans dire que l'effectif plafonne bien plus bas induirait l'élève en
  // erreur dès le volume qu'il saisit.
  const mainDoeuvreLimite = capacityFacts?.bottleneck === "labor";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-white/5 bg-slate-950 p-1.5 sm:p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Votre entreprise
        </h3>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
          <Chiffre
            label={vocabulary.capacityLabel}
            valeur={`${formatUnits(mainDoeuvreLimite && capacityFacts ? capacityFacts.laborCapacity : intro.capacity)}`}
            note={
              mainDoeuvreLimite
                ? `${vocabulary.laborLabel} : la vraie limite`
                : vocabulary.perRoundLabel
            }
            accent={mainDoeuvreLimite}
          />
          <Chiffre
            label="Charges de structure"
            valeur={formatEuro(intro.fixedCostsPerRound)}
            note="par tour, que vous vendiez ou non"
          />
          {gamme ? null : (
            <Chiffre
              label="Coût variable"
              valeur={formatEuro(intro.variableCostPerUnit)}
              note={`par ${vocabulary.unit} vendu`}
            />
          )}
          <Chiffre label="Trésorerie d'ouverture" valeur={formatEuro(intro.cash)} />
        </div>
        {/* Une gamme a un coût variable par référence : un seul chiffre mentirait. */}
        {gamme ? (
          <p className="mt-3 text-xs leading-relaxed text-slate-400">
            <span className="text-slate-500">Coût variable : </span>
            {gamme.map((p, i) => (
              <span key={p.code}>
                {i > 0 ? " · " : ""}
                {p.name}{" "}
                <span className="tabular-nums text-slate-200">
                  {formatEuro(p.materialCostPerUnit + p.otherVariableCostPerUnit)}
                </span>
              </span>
            ))}
          </p>
        ) : null}
        {intro.competitors.length > 0 ? (
          <p className="mt-2 text-xs text-slate-400">
            <span className="text-slate-500">Face à vous : </span>
            <span className="text-slate-300">{intro.competitors.join(", ")}</span>
          </p>
        ) : null}
      </div>

      <div className="rounded-lg border border-white/5 bg-slate-950 p-1.5 sm:p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Le marché en face de vous
        </h3>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
          <Chiffre
            label="Marché total"
            valeur={formatUnits(marcheTotal)}
            note={`${intro.segments.length} clientèle${intro.segments.length > 1 ? "s" : ""}`}
          />
          <Chiffre
            label="Prix usuels"
            valeur={
              prixMin === prixMax
                ? formatEuro(prixMin)
                : `${formatEuro(prixMin)} – ${formatEuro(prixMax)}`
            }
            note="ce qu'elles ont l'habitude de payer"
          />
          {showShare ? (
            <Chiffre
              label="Votre part"
              valeur={(() => {
                const vendu = intro.segments.reduce(
                  (t, s) => t + (s.yourShare ?? 0) * s.size,
                  0,
                );
                return marcheTotal > 0 ? formatPercent(vendu / marcheTotal) : "—";
              })()}
              note="du marché total"
              accent
            />
          ) : null}
        </div>

        {/*
          Le détail par clientèle est une donnée de travail, pas un élément de
          cadrage : replié, il n'encombre pas l'écran de décision, et reste à un
          clic pour qui ajuste son prix segment par segment.
        */}
        <details className="mt-3 rounded-lg border border-white/5 bg-slate-900/40">
          <summary className="cursor-pointer px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400 hover:text-slate-200">
            Détail par clientèle
          </summary>
          <div className="px-3 pb-3">
            {/*
              En portrait, un tableau à cinq colonnes force soit un défilement
              horizontal, soit des noms de clientèle repliés sur trois lignes. Sur
              petit écran on montre donc UNE CARTE PAR CLIENTÈLE (nom en tête, ses
              chiffres en grille) ; le tableau reprend dès `sm`.
            */}
            <ul className="mt-2 space-y-2 sm:hidden">
              {intro.segments.map((seg) => {
                // Les noms portent souvent un qualificatif entre parenthèses
                // (« Étudiants (sensibles au prix) »). Laissé d'un bloc, il s'enroule
                // sur le petit écran, parenthèse ouverte en haut, fermée en bas. On
                // le détache : nom en tête, qualificatif en sous-titre, sans
                // parenthèses.
                const m = seg.name.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
                const nom = m ? m[1] : seg.name;
                const qualif = m ? m[2] : null;
                return (
                  <li
                    key={seg.name}
                    className="rounded-lg border border-white/5 bg-slate-900/60 p-1.5 sm:p-3"
                  >
                    <p className="text-sm font-semibold text-slate-100">{nom}</p>
                    {qualif ? <p className="mt-0.5 text-xs text-slate-400">{qualif}</p> : null}
                    <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate-400">Taille</dt>
                        <dd className="tabular-nums text-slate-300">{formatUnits(seg.size)}</dd>
                      </div>
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate-400">
                          Prix usuel
                        </dt>
                        <dd className="tabular-nums text-slate-300">{formatEuro(seg.refPrice)}</dd>
                      </div>
                      {showShare ? (
                        <div>
                          <dt className="text-xs uppercase tracking-wide text-slate-400">
                            Votre part
                          </dt>
                          <dd className="tabular-nums text-amber-300">
                            {seg.yourShare === null ? "—" : formatPercent(seg.yourShare)}
                          </dd>
                        </div>
                      ) : null}
                      <div>
                        <dt className="text-xs uppercase tracking-wide text-slate-400">
                          Règlement
                        </dt>
                        <dd className="text-slate-400">
                          {seg.paymentDelayDays > 0 ? `à ${seg.paymentDelayDays} j` : "comptant"}
                        </dd>
                      </div>
                    </dl>
                  </li>
                );
              })}
            </ul>

            <div className="mt-2 hidden overflow-x-auto sm:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="pb-1 pr-3 font-medium">Clientèle</th>
                    <th className="pb-1 pr-3 text-right font-medium">Taille</th>
                    <th className="pb-1 pr-3 text-right font-medium">Prix usuel</th>
                    {showShare ? (
                      <th className="pb-1 pr-3 text-right font-medium">Votre part</th>
                    ) : null}
                    <th className="pb-1 font-medium">Règlement</th>
                  </tr>
                </thead>
                <tbody className="text-slate-300">
                  {intro.segments.map((seg) => (
                    <tr key={seg.name} className="border-t border-white/5">
                      <td className="py-1.5 pr-3">{seg.name}</td>
                      <td className="py-1.5 pr-3 text-right tabular-nums">
                        {formatUnits(seg.size)}
                      </td>
                      <td className="py-1.5 pr-3 text-right tabular-nums">
                        {formatEuro(seg.refPrice)}
                      </td>
                      {showShare ? (
                        <td className="py-1.5 pr-3 text-right tabular-nums text-amber-300">
                          {seg.yourShare === null ? "—" : formatPercent(seg.yourShare)}
                        </td>
                      ) : null}
                      <td className="py-1.5 text-slate-400">
                        {seg.paymentDelayDays > 0 ? `à ${seg.paymentDelayDays} j` : "comptant"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-500">
              Le prix usuel est celui auquel cette clientèle a l&apos;habitude d&apos;acheter, pas
              une consigne.{" "}
              {gamme
                ? "Vous fixez UN prix par référence, pour toutes ses clientèles."
                : "Vous fixez UN prix pour tout le monde."}
            </p>
          </div>
        </details>
      </div>
    </div>
  );
}
