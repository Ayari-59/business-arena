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
  footer,
}: {
  title: string;
  question: string;
  routes: readonly Route[];
  footer?: string;
}) {
  return (
    <div className="rounded-lg border border-amber-400/25 bg-amber-950/10 p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-amber-400">{title}</h3>
      <p className="mt-2 text-sm font-medium text-slate-100">{question}</p>
      <div className={`mt-3 grid gap-3 ${routes.length > 2 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {routes.map((route) => (
          <div key={route.label} className="rounded-lg border border-white/10 bg-slate-950 p-3">
            <p className="text-sm font-medium text-slate-200">{route.label}</p>
            <p className="mt-1.5 text-xs leading-relaxed text-emerald-300/90">
              <span className="font-semibold">Ce que cela rapporte. </span>
              {route.gain}
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-red-300/80">
              <span className="font-semibold">Ce que cela coûte. </span>
              {route.risque}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs leading-relaxed text-slate-400">
        {footer ??
          "Aucune de ces routes n'est la bonne réponse : elles se défendent toutes, et c'est vous qui tranchez. Le marché vous dira au tour suivant ce que votre choix valait."}
      </p>
    </div>
  );
}

/** Les paramètres : ce que vaut l'entreprise, et le marché en face d'elle. */
export function ParametersPanels({
  intro,
  vocabulary,
  capacityFacts,
}: {
  intro: GameView["intro"];
  vocabulary: GameView["vocabulary"];
  capacityFacts: GameView["capacityFacts"];
}) {
  const showShare = intro.segments.some((s) => s.yourShare !== null);
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border border-white/5 bg-slate-950 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Votre entreprise
        </h3>
        <ul className="mt-2 space-y-1 text-sm text-slate-400">
          <li>
            <span className="text-slate-400">{vocabulary.capacityLabel} : </span>
            <span className="text-slate-200">
              {formatUnits(intro.capacity)} {vocabulary.perRoundLabel}
            </span>
          </li>
          {/*
            Le plafond physique n'est pas toujours celui qui vous arrête : un
            cabinet a des bureaux pour bien plus de consultants qu'il n'en
            emploie. Annoncer les locaux sans dire que l'effectif plafonne bien
            plus bas induirait l'élève en erreur dès le volume qu'il saisit.
          */}
          {capacityFacts && capacityFacts.bottleneck === "labor" ? (
            <li>
              <span className="text-slate-400">{vocabulary.laborLabel} : </span>
              <span className="text-amber-300">
                {formatUnits(capacityFacts.laborCapacity)} {vocabulary.perRoundLabel}
              </span>
              , la vraie limite
            </li>
          ) : null}
          <li>
            <span className="text-slate-400">Charges de structure : </span>
            <span className="text-slate-200">{formatEuro(intro.fixedCostsPerRound)} par tour</span>
            , que vous vendiez ou non
          </li>
          <li>
            <span className="text-slate-400">Coût variable : </span>
            <span className="text-slate-200">{formatEuro(intro.variableCostPerUnit)}</span> par{" "}
            {vocabulary.unit} vendu
          </li>
          <li>
            <span className="text-slate-400">Trésorerie d&apos;ouverture : </span>
            <span className="text-slate-200">{formatEuro(intro.cash)}</span>
          </li>
          {intro.competitors.length > 0 ? (
            <li>
              <span className="text-slate-400">Face à vous : </span>
              <span className="text-slate-200">{intro.competitors.join(", ")}</span>
            </li>
          ) : null}
        </ul>
      </div>

      <div className="rounded-lg border border-white/5 bg-slate-950 p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Le marché en face de vous
        </h3>

        {/*
          En portrait, un tableau à cinq colonnes force soit un défilement
          horizontal, soit des noms de clientèle repliés sur trois lignes. Sur
          petit écran on montre donc UNE CARTE PAR CLIENTÈLE (nom en tête, ses
          chiffres en grille) ; le tableau reprend dès `sm`.
        */}
        <ul className="mt-3 space-y-2 sm:hidden">
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
              <li key={seg.name} className="rounded-lg border border-white/5 bg-slate-900/60 p-3">
                <p className="text-sm font-semibold text-slate-100">{nom}</p>
                {qualif ? <p className="mt-0.5 text-xs text-slate-400">{qualif}</p> : null}
                <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2">
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">Taille</dt>
                  <dd className="tabular-nums text-slate-300">{formatUnits(seg.size)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">Prix usuel</dt>
                  <dd className="tabular-nums text-slate-300">{formatEuro(seg.refPrice)}</dd>
                </div>
                {showShare ? (
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-400">Votre part</dt>
                    <dd className="tabular-nums text-amber-300">
                      {seg.yourShare === null ? "—" : formatPercent(seg.yourShare)}
                    </dd>
                  </div>
                ) : null}
                <div>
                  <dt className="text-xs uppercase tracking-wide text-slate-400">Règlement</dt>
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
                  <td className="py-1.5 pr-3 text-right tabular-nums">{formatUnits(seg.size)}</td>
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
        <p className="mt-2 text-xs leading-relaxed text-slate-600">
          Le prix usuel est celui auquel cette clientèle a l&apos;habitude d&apos;acheter, pas une
          consigne. Vous fixez UN prix pour tout le monde.
        </p>
      </div>
    </div>
  );
}
