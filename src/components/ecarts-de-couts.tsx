import { formatEuro } from "@/lib/format";
import type { CompanyRoundResult } from "@/engine/types";
import type { GameView } from "@/services/game.service";

/**
 * LA DÉCOMPOSITION DES ÉCARTS DE COÛTS, RÉFÉRENCE PAR RÉFÉRENCE.
 *
 * Le tableau prévu/réalisé, juste au-dessus, donne l'écart GLOBAL : on a
 * dépensé plus que prévu. Il ne dit pas pourquoi. Or « pourquoi » se
 * décompose, et c'est ce qui s'enseigne en contrôle de gestion :
 *
 *  · l'ÉCART DE PRIX vient d'un achat plus cher que le standard — autrement
 *    dit, du façonnier choisi. C'est la décision « fournisseur » chiffrée ;
 *  · l'ÉCART D'EFFICACITÉ vient de ce qui a été produit puis rebuté : la
 *    matière est payée, le travail est payé, et rien ne se vend.
 *
 * Le moteur calculait ces écarts à chaque tour depuis des mois sans que
 * personne ne les voie : le composant qui les affichait n'était importé nulle
 * part. Celui-ci le remplace.
 *
 * CE QU'IL N'AFFICHE PAS, ET POURQUOI. Le moteur produit aussi un bloc
 * « revenus par segment » dont les deux champs ne sont pas des écarts :
 * `priceVariance` vaut le chiffre d'affaires (prix × quantité vendue) et
 * `volumeVariance` vaut les unités perdues, comptées en unités. Les afficher
 * dans un tableau en euros, sous le nom d'écart, apprendrait une fausseté.
 * Ils restent donc dehors tant que le calcul n'est pas écrit.
 */
export function EcartsDeCouts({
  gamme,
  produits,
}: {
  gamme: GameView["gamme"];
  produits: CompanyRoundResult["products"];
}) {
  if (!gamme || !produits) return null;

  const lignes = gamme
    .map((p) => ({ nom: p.name, e: produits[p.code]?.variances }))
    .filter((l): l is { nom: string; e: NonNullable<typeof l.e> } => Boolean(l.e));
  if (lignes.length === 0) return null;

  const somme = (lire: (e: (typeof lignes)[number]["e"]) => number) =>
    lignes.reduce((t, l) => t + lire(l.e), 0);
  const totalPrix = somme((e) => e.materialPriceVariance);
  const totalMatiere = somme((e) => e.materialEfficiencyVariance);
  const totalMo = somme((e) => e.laborEfficiencyVariance);
  const total = somme((e) => e.totalCostVariance);
  // Sous l'euro, l'écart n'est que de l'arrondi : ne pas ouvrir un tableau
  // pour trois centimes, l'élève y chercherait un sens qui n'y est pas.
  if (Math.abs(total) < 1) return null;

  /** Un écart POSITIF coûte : il est défavorable. Le signe le dit, la couleur appuie. */
  const teinte = (v: number) =>
    v > 0.5 ? "text-rose-300" : v < -0.5 ? "text-emerald-300" : "text-slate-400";
  const montant = (v: number) => `${v >= 0 ? "+" : ""}${formatEuro(v)}`;

  return (
    <div className="mt-3 rounded-lg border border-white/5 bg-slate-950 p-3 sm:p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        🔎 D&apos;où vient l&apos;écart de coûts
      </p>
      <div className="mt-2 overflow-x-auto">
        <table className="w-full text-sm">
          <caption className="sr-only">
            Décomposition des écarts de coûts par référence : écart de prix d&apos;achat et écarts
            d&apos;efficacité.
          </caption>
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="pb-1 pr-2 font-medium">Référence</th>
              <th className="pb-1 pr-2 text-right font-medium">Prix d&apos;achat</th>
              <th className="pb-1 pr-2 text-right font-medium">Rebuts · matière</th>
              <th className="pb-1 pr-2 text-right font-medium">Rebuts · main-d&apos;œuvre</th>
              <th className="pb-1 text-right font-medium">Total</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            {lignes.map((l) => (
              <tr key={l.nom} className="border-t border-white/5">
                <td className="py-1.5 pr-2">{l.nom}</td>
                <td className={`py-1.5 pr-2 text-right tabular-nums ${teinte(l.e.materialPriceVariance)}`}>
                  {montant(l.e.materialPriceVariance)}
                </td>
                <td className={`py-1.5 pr-2 text-right tabular-nums ${teinte(l.e.materialEfficiencyVariance)}`}>
                  {montant(l.e.materialEfficiencyVariance)}
                </td>
                <td className={`py-1.5 pr-2 text-right tabular-nums ${teinte(l.e.laborEfficiencyVariance)}`}>
                  {montant(l.e.laborEfficiencyVariance)}
                </td>
                <td className={`py-1.5 text-right tabular-nums ${teinte(l.e.totalCostVariance)}`}>
                  {montant(l.e.totalCostVariance)}
                </td>
              </tr>
            ))}
            <tr className="border-t border-white/20 font-semibold text-slate-100">
              <td className="py-1.5 pr-2">Ensemble</td>
              <td className={`py-1.5 pr-2 text-right tabular-nums ${teinte(totalPrix)}`}>
                {montant(totalPrix)}
              </td>
              <td className={`py-1.5 pr-2 text-right tabular-nums ${teinte(totalMatiere)}`}>
                {montant(totalMatiere)}
              </td>
              <td className={`py-1.5 pr-2 text-right tabular-nums ${teinte(totalMo)}`}>
                {montant(totalMo)}
              </td>
              <td className={`py-1.5 text-right tabular-nums ${teinte(total)}`}>{montant(total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-slate-400">
        Un écart positif a coûté. Celui de <strong className="text-slate-300">prix d&apos;achat</strong>{" "}
        mesure votre choix de fournisseur, au standard du scénario ; ceux de{" "}
        <strong className="text-slate-300">rebuts</strong> mesurent ce qui a été produit puis mis au
        rebut, matière et travail déjà payés. Le premier se décide, le second se pilote.
      </p>
    </div>
  );
}
