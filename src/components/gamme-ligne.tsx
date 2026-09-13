import type { GameView } from "@/services/game-view.service";

type Gamme = NonNullable<GameView["gamme"]>;

/**
 * La gamme en une ligne par référence : son nom, et ce qui la distingue des
 * autres — volume du marché, marge unitaire, et le cas de la référence encore
 * à développer.
 *
 * Ces qualificatifs sont DÉDUITS du scénario joué, jamais rédigés. Un libellé
 * écrit dans la config mentirait le jour où l'enseignant change un prix ou une
 * taille de marché ; ici « forte marge » veut dire « la plus forte de CETTE
 * gamme », ce qui reste vrai après n'importe quel réglage.
 */

/** Couleurs de repère, dans l'ordre de la gamme. Au-delà, on boucle. */
const REPERES = [
  "bg-emerald-400",
  "bg-sky-400",
  "bg-amber-400",
  "bg-fuchsia-400",
  "bg-rose-400",
  "bg-teal-400",
] as const;

/** Situe une valeur dans sa gamme : haut, milieu, bas. */
function rang(valeur: number, toutes: number[]): "haut" | "milieu" | "bas" {
  const triees = [...new Set(toutes)].sort((a, b) => a - b);
  // Une gamme dont toutes les références se valent sur cet axe n'a pas de haut
  // ni de bas : le dire serait faux.
  if (triees.length < 2) return "milieu";
  if (valeur === triees[triees.length - 1]) return "haut";
  if (valeur === triees[0]) return "bas";
  return "milieu";
}

const MOTS_VOLUME = { haut: "fort volume", milieu: "volume moyen", bas: "faible volume" } as const;
const MOTS_MARGE = { haut: "forte marge", milieu: "marge moyenne", bas: "faible marge" } as const;

export function GammeLigne({ gamme }: { gamme: Gamme }) {
  // Le taux de marge, pas la marge en euros : comparer 2 € sur 12 € à 40 € sur
  // 300 € en valeur absolue classerait la gamme à l'envers.
  const taux = (p: Gamme[number]) =>
    p.refPrice > 0
      ? (p.refPrice - p.materialCostPerUnit - p.otherVariableCostPerUnit) / p.refPrice
      : 0;

  const tousVolumes = gamme.map((p) => p.marketSize);
  const tousTaux = gamme.map(taux);

  return (
    <ul className="space-y-1.5">
      {gamme.map((p, i) => {
        const aDevelopper = p.rd?.development ? !p.rd.development.available : false;
        const qualificatifs = aDevelopper
          ? [MOTS_MARGE[rang(taux(p), tousTaux)], "prototype à financer"]
          : [
              MOTS_VOLUME[rang(p.marketSize, tousVolumes)],
              MOTS_MARGE[rang(taux(p), tousTaux)],
            ];
        return (
          <li key={p.code} className="flex items-baseline gap-2 text-sm">
            <span
              aria-hidden
              className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${REPERES[i % REPERES.length]}`}
            />
            <span className="font-medium text-slate-100">{p.name}</span>
            <span className="text-slate-400">{`— ${qualificatifs.join(" · ")}`}</span>
          </li>
        );
      })}
    </ul>
  );
}
