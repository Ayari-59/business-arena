import { Tiroir } from "@/components/tiroir";

const pct = (v: number) => `${(v * 100).toFixed(1).replace(".", ",")} %`;
/** Un ratio signé : le moins est un vrai moins, pas un trait d'union. */
const signe = (v: number) => `${v < 0 ? "−" : ""}${pct(Math.abs(v))}`;

interface RatioDef {
  label: string;
  value: number;
  hint: string;
  /** Le niveau qu'un dirigeant vise, écrit en clair : c'est le REPÈRE, pas un verdict. */
  repere: string;
}

/**
 * LES RATIOS SONT UN TABLEAU, PLUS SIX JAUGES.
 *
 * Chacun portait une barre pleine — verte, orange ou rouge selon des seuils — au
 * milieu de la page Finance. Trois défauts, et le dernier est le plus grave :
 *   1. l'orange des jauges est la couleur de l'ACTION, posée ici sur une donnée ;
 *   2. une barre remplie à 30 % d'une échelle de −100 % à +100 % ne veut rien
 *      dire pour une rentabilité nette, qui se lit entre 0 et 10 % ;
 *   3. elle TRANCHAIT à la place du lecteur. « Bon / vigilance / mauvais » est
 *      le jugement qu'un élève de gestion doit apprendre à porter, pas celui
 *      qu'on lui livre avec une couleur.
 *
 * Reste le chiffre, aligné en tabulaires, et le repère chiffré à côté : on
 * compare soi-même. Le vert et le rouge ne reviennent ici que pour un ratio
 * NÉGATIF, qui est un résultat et non un niveau à apprécier.
 */
function TableauDesRatios({ ratios }: { ratios: RatioDef[] }) {
  return (
    <div className="tableau-financier">
      <table className="text-sm">
        <caption className="sr-only">
          Ratios financiers du tour, avec le repère usuel de chacun.
        </caption>
        <thead>
          <tr className="border-b border-white/10 text-xs uppercase tracking-wide text-slate-400">
            <th scope="col" className="py-1 pr-3 text-left font-medium">
              Ratio
            </th>
            <th scope="col" className="py-1 pl-3 text-right font-medium">
              Ce tour
            </th>
            <th scope="col" className="py-1 pl-3 text-right font-medium">
              Repère
            </th>
          </tr>
        </thead>
        <tbody>
          {ratios.map((r) => (
            <tr key={r.label} className="border-t border-white/5 align-baseline">
              <th scope="row" className="py-1.5 pr-3 text-left font-normal text-slate-300">
                {r.label}
                <span className="mt-0.5 block text-sm leading-snug text-slate-400">{r.hint}</span>
              </th>
              <td
                className={`whitespace-nowrap py-1.5 pl-3 text-right font-semibold tabular-nums ${
                  r.value < 0 ? "text-red-400" : "text-slate-100"
                }`}
              >
                {signe(r.value)}
              </td>
              <td className="whitespace-nowrap py-1.5 pl-3 text-right tabular-nums text-slate-400">
                {r.repere}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RatioGauges({
  profitability,
  roce,
  roe,
  leverage,
  debtToEquity,
  assetTurnover,
}: {
  profitability: number;
  roce: number;
  roe: number;
  leverage: number;
  debtToEquity: number;
  assetTurnover: number;
}) {
  const ratios: RatioDef[] = [
    {
      label: "Rentabilité nette (RN / CA)",
      value: profitability,
      hint: "Ce qu'il reste sur chaque euro de CA après toutes les charges.",
      repere: "≥ 5 %",
    },
    {
      label: "Re — Rentabilité économique (ROCE)",
      value: roce,
      hint: "Ce que l'outil de production rapporte, indépendamment de son financement.",
      repere: "≥ 8 %",
    },
    {
      label: "Rf — Rentabilité financière (ROE)",
      value: roe,
      hint: "Ce que les capitaux propres rapportent aux associés.",
      repere: "≥ 10 %",
    },
    {
      label: "Effet de levier (Rf − Re)",
      value: leverage,
      hint:
        leverage >= 0
          ? "La dette amplifie la rentabilité des associés."
          : "La dette pèse : elle coûte plus qu'elle ne rapporte.",
      repere: "> 0",
    },
    {
      label: "Endettement (Dettes / CP)",
      value: debtToEquity,
      hint:
        debtToEquity > 1
          ? "L'entreprise doit plus à ses prêteurs qu'à ses associés."
          : "L'endettement reste contenu.",
      repere: "≤ 50 %",
    },
    {
      label: "Rotation de l'actif (CA / Actif)",
      value: assetTurnover,
      hint: "Le nombre de fois que l'actif « tourne » sur la période.",
      repere: "≥ 50 %",
    },
  ];

  return (
    // À LA DEMANDE : six ratios avec leur explication faisaient 800 px sous les états, que l'on
    // lit d'abord. Le tiroir s'ouvre comme les états (un seul à la fois) et annonce son contenu.
    <Tiroir
      titre="Ratios financiers"
      quoi={`${ratios.length} ratios`}
      ferme
      groupe="comptes-du-tour"
    >
      <TableauDesRatios ratios={ratios} />
      <p className="mt-3 text-sm leading-relaxed text-slate-400">
        Un ratio seul ne dit rien : c&apos;est l&apos;ensemble qui raconte la stratégie financière.
        L&apos;effet de levier montre si la dette sert la rentabilité ou la fragilise. Les repères
        sont des ordres de grandeur, pas des notes : un secteur d&apos;équipement et un service ne
        tournent pas au même rythme.
      </p>
    </Tiroir>
  );
}
