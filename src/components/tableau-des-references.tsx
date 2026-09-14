import { formatEuro, formatUnits } from "@/lib/format";
import { NomReference } from "@/components/nom-reference";
import type { GameView } from "@/services/game-view.service";
import type { CompanyRoundResult } from "@/engine/types";

/**
 * CE QU'A FAIT CHAQUE RÉFÉRENCE SUR LE TOUR ÉCOULÉ.
 *
 * Deux défauts se cumulaient, et le second annulait toute correction du
 * premier.
 *
 *  1. DES COLONNES QUI NE DISENT RIEN. Le tableau en comptait onze, et deux
 *     d'entre elles répétaient la même chose sur chaque ligne : « 0 € · +0 % »
 *     en R&D quand personne n'avait investi, « Fournisseur standard » quand
 *     toute la gamme s'approvisionne au même endroit. Une colonne qui dit la
 *     même valeur partout prend la place des quatre chiffres qui décident —
 *     prix, vendu, manqué, CA.
 *     LA RÈGLE TENUE ICI : une colonne n'apparaît que si elle DISTINGUE les
 *     références de ce tour-là. Pas « si le scénario propose la R&D », mais
 *     « si la R&D a servi ce tour ».
 *  2. NEUF COLONNES NE TIENNENT PAS SUR UN TÉLÉPHONE. Même dégraissé, le
 *     tableau se coupait après « Manqué » : le reste s'atteignait par un
 *     défilement latéral à l'intérieur de la boîte, que personne ne devine.
 *     Un élève sur son téléphone ne voyait donc ni son CA, ni sa marge.
 *     Sous 640 px, la forme tableau est abandonnée : une carte par référence,
 *     le CA en tête de carte, le reste en couples étiquette/valeur. Les MÊMES
 *     cellules alimentent les deux formes — elles sont calculées une fois, plus
 *     bas, et rendues deux fois.
 *
 *  3. UNE RÉFÉRENCE À BÂTIR N'A PAS DE LIGNE. Tant qu'elle n'est pas lancée,
 *     le moteur force son plan à zéro : elle ne produit rien, ne vend rien,
 *     ne rapporte rien. Elle garde pourtant un prix — celui que le formulaire
 *     envoie en champ caché, faute d'en demander un — et une structure de
 *     coût, si bien que la colonne Marge/u annonçait « 59 € » sur une vente
 *     qui n'a pas eu lieu, à un prix que personne n'a choisi. Mettre des
 *     tirets à la place aurait gardé une ligne entière pour dire zéro
 *     partout : elle ne s'affiche plus du tout. Ce tableau rend compte du
 *     tour écoulé ; ce qui n'y a pas participé n'y figure pas. Le
 *     financement engagé se lit là où il est une charge — le compte de
 *     résultat et le récapitulatif des décisions.
 *
 * Ce qui ne disparaît jamais : une rupture d'approvisionnement reste signalée
 * sur le nom de la référence, même quand la colonne Fournisseur est masquée.
 * C'est elle qui explique le volume manqué de la ligne.
 */

type ProduitsDuTour = NonNullable<CompanyRoundResult["products"]>;
type Produit = ProduitsDuTour[string];

/** Une mesure de la ligne : son en-tête de colonne, sa valeur, sa couleur. */
type Cellule = { cle: string; entete: string; valeur: string; classe: string };

/** La R&D d'une référence, lue sans risque — le bloc est optionnel. */
const rdVide = (p: Produit | undefined) =>
  (p?.rd?.budget ?? 0) === 0 && (p?.rd?.techLevel ?? 0) === 0;

/**
 * Une référence encore à bâtir : son développement n'est pas lancé.
 *
 * Le moteur force son plan à zéro — elle ne produit rien, ne vend rien, ne
 * rapporte rien. Elle n'a donc rien à dire d'un tour écoulé, et sa ligne est
 * écartée avant tout le reste : les colonnes conditionnelles se décident sur
 * les références qui ONT joué, pas sur celle qui attend.
 */
const enDeveloppement = (p: Produit) => {
  const dev = p.rd?.development;
  return dev ? !dev.launched : false;
};

/**
 * Les mesures d'une référence, dans l'ordre de lecture. Le CA n'y figure pas :
 * c'est le résultat de la ligne, il est traité à part dans les deux rendus (à
 * droite dans le tableau, en tête de carte sur téléphone).
 */
function cellulesDe(
  p: Produit,
  leftoverLabel: string,
  avecRd: boolean,
  avecFournisseur: boolean,
): Cellule[] {
  const marge = p.price - p.unitVariableCost;
  const cellules: Cellule[] = [
    { cle: "prix", entete: "Prix", valeur: formatEuro(p.price), classe: "" },
    { cle: "rayon", entete: "En rayon", valeur: formatUnits(p.produced), classe: "" },
    { cle: "vendu", entete: "Vendu", valeur: formatUnits(p.sold), classe: "" },
    {
      cle: "manque",
      entete: "Manqué",
      valeur: formatUnits(p.lost),
      classe: p.lost > 1 ? "text-red-400" : "",
    },
    {
      cle: "marge",
      entete: "Marge/u",
      valeur: formatEuro(marge),
      classe: marge < 0 ? "text-red-400" : "",
    },
    {
      cle: "reste",
      entete: leftoverLabel,
      valeur: formatUnits(p.stock.quantity),
      classe: "",
    },
    {
      cle: "qualite",
      entete: "Qualité",
      valeur:
        p.perceivedQuality !== undefined ? `${Math.round(p.perceivedQuality * 100)} %` : "—",
      classe: "",
    },
  ];
  if (avecRd) {
    cellules.push({
      cle: "rd",
      entete: "R&D",
      valeur: p.rd
        ? `${formatEuro(p.rd.budget)} · +${Math.round(p.rd.techLevel * 100)} %`
        : "—",
      classe: "",
    });
  }
  if (avecFournisseur) {
    cellules.push({
      cle: "fournisseur",
      entete: "Fournisseur",
      valeur: p.supplier?.name ?? "—",
      classe: "",
    });
  }
  return cellules;
}

/** Le nom de la référence et ce qui lui est arrivé ce tour. */
function NomEtIncidents({
  reference,
  produit,
  tour,
}: {
  reference: NonNullable<GameView["gamme"]>[number];
  produit: Produit;
  tour: number;
}) {
  const dev = produit.rd?.development;
  return (
    <>
      <NomReference reference={reference} />
      {produit.supplier?.supplyDisruption ? (
        <span
          className="ml-1 whitespace-nowrap text-xs text-red-400"
          title="Rupture d'approvisionnement ce tour"
        >
          ⚠︎ rupture
        </span>
      ) : null}
      {dev && dev.launchRound === tour ? (
        <span className="ml-1 whitespace-nowrap text-xs text-emerald-300">🚀 lancée ce tour</span>
      ) : null}
    </>
  );
}

export function TableauDesReferences({
  gamme,
  produits,
  tour,
  leftoverLabel,
}: {
  gamme: NonNullable<GameView["gamme"]>;
  produits: ProduitsDuTour;
  /** Le tour affiché : sert à ne dire « lancée » que le tour du lancement. */
  tour: number;
  /** Le mot du secteur pour ce qui reste sur les bras : « Stock », « Invendus »… */
  leftoverLabel: string;
}) {
  // Les références qui ont joué le tour. Celle qui est encore à bâtir n'a pas
  // de ligne : elle n'afficherait que des zéros et un prix que personne n'a
  // choisi.
  const lignes = gamme
    .map((g) => ({ g, p: produits[g.code] }))
    .filter((x): x is { g: (typeof gamme)[number]; p: Produit } => Boolean(x.p))
    .filter(({ p }) => !enDeveloppement(p));

  // Aucune référence vendable : un titre au-dessus d'un tableau vide serait
  // une promesse non tenue.
  if (lignes.length === 0) return null;

  // La R&D n'a rien à montrer si personne n'a investi et qu'aucun niveau n'est
  // acquis : la colonne afficherait « 0 € · +0 % » autant de fois qu'il y a de
  // références.
  const avecRd = gamme.some((g) => g.rd) && lignes.some(({ p }) => !rdVide(p));

  // Le fournisseur n'apprend quelque chose que s'il DIFFÈRE d'une référence à
  // l'autre. Répété à l'identique, c'est un mot de plus par ligne.
  const fournisseurs = new Set(
    lignes.map(({ p }) => p.supplier?.name).filter((n): n is string => Boolean(n)),
  );
  const avecFournisseur = gamme.some((g) => g.suppliers) && fournisseurs.size > 1;

  const rendues = lignes.map(({ g, p }) => ({
    g,
    p,
    cellules: cellulesDe(p, leftoverLabel, avecRd, avecFournisseur),
  }));
  const entetes = rendues[0]?.cellules ?? [];

  // `whitespace-nowrap` sur les en-têtes : « En rayon » et « Fournisseur » se
  // coupaient en deux et donnaient une bande d'en-tête en dents de scie.
  const th = "whitespace-nowrap pb-2 pr-2 font-medium";

  return (
    <section aria-label="Vos références">
      <h3 className="mb-2 text-sm font-semibold text-slate-200">
        Vos références sur le tour écoulé
      </h3>

      {/* TÉLÉPHONE — une carte par référence. */}
      <ul className="space-y-2 sm:hidden">
        {rendues.map(({ g, p, cellules }) => (
          <li key={g.code} className="rounded-lg border border-white/5 bg-slate-950 px-3 py-2.5">
            <p className="flex items-baseline justify-between gap-2">
              <span className="min-w-0 text-slate-100">
                <NomEtIncidents reference={g} produit={p} tour={tour} />
              </span>
              <span className="shrink-0 whitespace-nowrap">
                <span className="mr-1 text-xs uppercase tracking-wide text-slate-400">CA</span>
                <span className="font-semibold tabular-nums text-slate-100">
                  {formatEuro(p.revenue)}
                </span>
              </span>
            </p>
            <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              {cellules.map((c) => (
                <div key={c.cle} className="flex items-baseline justify-between gap-2">
                  <dt className="min-w-0 truncate text-slate-400">{c.entete}</dt>
                  <dd
                    className={`shrink-0 whitespace-nowrap tabular-nums text-slate-200 ${c.classe}`}
                  >
                    {c.valeur}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>

      {/* ÉCRAN LARGE — le tableau, qui compare les références d'un coup d'œil. */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
              <th className={th}>Référence</th>
              {entetes.map((c) => (
                <th key={c.cle} className={`${th} text-right`}>
                  {c.entete}
                </th>
              ))}
              <th className="whitespace-nowrap pb-2 text-right font-medium">CA</th>
            </tr>
          </thead>
          <tbody className="text-slate-300">
            {rendues.map(({ g, p, cellules }) => (
              <tr key={g.code} className="border-t border-white/5">
                <td className="py-2 pr-2 text-slate-100">
                  <NomEtIncidents reference={g} produit={p} tour={tour} />
                </td>
                {cellules.map((c) => (
                  <td
                    key={c.cle}
                    className={`whitespace-nowrap py-2 pr-2 text-right tabular-nums ${c.classe}`}
                  >
                    {c.valeur}
                  </td>
                ))}
                {/* Le CA est le résultat de la ligne : c'est lui qu'on cherche
                    des yeux, il ferme donc la ligne et porte la couleur du
                    texte principal. */}
                <td className="whitespace-nowrap py-2 text-right font-medium tabular-nums text-slate-100">
                  {formatEuro(p.revenue)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-slate-400">
        Marge/u = prix − coût variable. Ce qu&apos;une référence rapporte = marge × volume
        vendu : le mix compte autant que le volume. Qualité 100 % = la référence du secteur.
      </p>
    </section>
  );
}
