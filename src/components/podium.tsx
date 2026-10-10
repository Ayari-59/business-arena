import { formatDecimal, ordinal } from "@/lib/format";
import { PastilleDeRang } from "@/components/rang";

/**
 * LE PODIUM, UNE SEULE FOIS DANS LE PRODUIT.
 *
 * Trois marches, l'or au centre et plus haut, l'argent à gauche, le bronze à
 * droite ; le métal est le haut de la marche (`marche-de-podium`, globals.css)
 * et le chiffre du rang y reste écrit — la couleur n'est jamais seule.
 *
 * Il a été dessiné pour la clôture d'une partie solo, dans une carte. La
 * projection de classe demandait le même podium, à l'échelle d'un mur : il est
 * sorti de `bilan-de-partie.tsx` pour être posé aux deux endroits, avec la
 * seule chose qui change entre un écran à cinquante centimètres et un
 * vidéoprojecteur à huit mètres — l'échelle. Rien n'est calculé ici.
 */

/** Une équipe du classement, pour le podium. */
export interface MarcheDuPodium {
  nom: string;
  rang: number;
  /** L'équipe du joueur : « vous », et le repère de la ligne du joueur (jamais l'orange). */
  moi: boolean;
  ipg: number | null;
}

/**
 * Les deux échelles. `carte` est celle du bilan de partie, à lire de près ;
 * `projection` suit la largeur de l'écran (`clamp()`), comme le reste du mur :
 * le même podium sert un vidéoprojecteur de salle et un portable en table
 * ronde.
 */
const ECHELLE = {
  carte: {
    grille: "gap-2 sm:gap-3",
    marche: "rounded-b-lg px-2 pb-3 pt-2",
    hauteur: ["min-h-40", "min-h-32", "min-h-28"],
    pastille: "text-xl",
    nom: "mt-1.5 text-sm",
    mention: "text-xs",
  },
  projection: {
    grille: "gap-[clamp(0.4rem,1.2vw,1.5rem)]",
    marche:
      "rounded-b-xl px-[clamp(0.4rem,1.2vw,1.5rem)] pb-[clamp(0.4rem,1.2vh,1.1rem)] pt-[clamp(0.3rem,0.9vh,0.9rem)]",
    // L'ESCALIER SE VOIT DE LOIN : le contenu d'une marche fait déjà dix
    // centimètres de haut sur un mur, et trois hauteurs minimales trop
    // proches donnaient trois marches égales, que seul le métal distinguait.
    hauteur: [
      "min-h-[clamp(7rem,16vh,15rem)]",
      "min-h-[clamp(5.5rem,12.5vh,11.5rem)]",
      "min-h-[clamp(4.5rem,10vh,9rem)]",
    ],
    pastille: "text-[clamp(1.1rem,min(2.4vw,3.3vh),2.1rem)]",
    nom: "mt-[clamp(0.2rem,0.8vh,0.6rem)] text-[clamp(1rem,min(2.2vw,3.1vh),1.9rem)]",
    mention: "text-[clamp(0.85rem,1.4vw,1.2rem)]",
  },
} as const;

/**
 * Les trois marches, dans l'ordre où on les regarde : l'argent, l'or, le
 * bronze. `marches` arrive du classement tel quel ; ce composant garde les
 * trois premières places et les ordonne.
 */
export function PodiumDesEquipes({
  marches,
  taille = "carte",
  etiquette,
}: {
  marches: readonly MarcheDuPodium[];
  taille?: keyof typeof ECHELLE;
  /** Ce que le lecteur d'écran annonce : « Podium du classement final ». */
  etiquette: string;
}) {
  const e = ECHELLE[taille];
  const trois = marches.filter((m) => m.rang <= 3).sort((a, b) => a.rang - b.rang);
  if (trois.length === 0) return null;
  if (taille === "carte") return <PodiumAMarches trois={trois} etiquette={etiquette} />;
  return (
    <ol
      aria-label={etiquette}
      data-podium={taille}
      className={`grid grid-cols-3 items-end ${e.grille}`}
    >
      {[trois[1], trois[0], trois[2]].map((m, i) =>
        m ? (
          <li
            key={m.rang}
            className={`min-w-0 ${i === 1 ? "order-2" : i === 0 ? "order-1" : "order-3"}`}
          >
            <div
              className={`marche-de-podium marche-de-podium-${m.rang} bg-slate-900 text-center ${e.marche} ${
                e.hauteur[m.rang - 1]
              } ${m.moi ? "ligne-moi" : ""}`}
            >
              <PastilleDeRang rang={m.rang} doublon className={e.pastille} />
              <p className={`truncate font-semibold text-slate-50 ${e.nom}`} title={m.nom}>
                {m.nom}
              </p>
              <p className={`tabular-nums text-slate-400 ${e.mention}`}>
                {ordinal(m.rang)}
                {m.ipg !== null ? ` · IPG ${formatDecimal(m.ipg, 0)}` : ""}
                {m.moi ? <span className="font-semibold text-slate-200"> · vous</span> : null}
              </p>
            </div>
          </li>
        ) : (
          <li key={`vide-${i}`} aria-hidden className="order-3" />
        ),
      )}
    </ol>
  );
}

/**
 * LE PODIUM DE LA CLÔTURE, À VRAIES MARCHES (lot P2).
 *
 * L'audit le voyait comme « trois blocs plats » : trois cartes de même allure,
 * dont la hauteur ne venait que de leur contenu. C'est désormais un podium :
 * le nom de l'équipe et son IPG posés AU-DESSUS de sa marche, et trois marches
 * de hauteurs franchement différentes (la 1re la plus haute, au centre ; la
 * 2e à gauche ; la 3e à droite), le métal en tête de marche et le chiffre de
 * la place dessus. L'équipe du joueur est dite « vous », en toutes lettres,
 * et sa marche porte le repère de la ligne du joueur. Le rang n'y est pas
 * réécrit en toutes lettres (« 2e ») : la clôture le dit une fois, en grand.
 *
 * La projection garde sa forme (le mur de la classe a sa propre garde de
 * hauteur) ; seule l'échelle « carte » prend ces marches.
 */
const MARCHES_EN_LETTRES = ["Première", "Deuxième", "Troisième"] as const;

export const HAUTEURS_DES_MARCHES = ["h-32 sm:h-36", "h-24 sm:h-[6.5rem]", "h-16 sm:h-[4.5rem]"] as const;

function PodiumAMarches({
  trois,
  etiquette,
}: {
  trois: readonly MarcheDuPodium[];
  etiquette: string;
}) {
  return (
    <ol aria-label={etiquette} data-podium="carte" className="grid grid-cols-3 items-end gap-2 sm:gap-3">
      {[trois[1], trois[0], trois[2]].map((m, i) =>
        m ? (
          <li
            key={m.rang}
            data-marche={m.rang}
            className={`min-w-0 text-center ${i === 1 ? "order-2" : i === 0 ? "order-1" : "order-3"}`}
          >
            <p className="truncate text-sm font-semibold text-slate-50 sm:text-base" title={m.nom}>
              <span className="sr-only">{MARCHES_EN_LETTRES[m.rang - 1]} marche : </span>
              {m.nom}
            </p>
            <p className="text-xs tabular-nums text-slate-300 sm:text-sm">
              {m.ipg !== null ? `IPG ${formatDecimal(m.ipg, 0)}` : " "}
              {m.moi ? <span className="font-semibold text-slate-50"> · vous</span> : null}
            </p>
            <div
              className={`marche-de-podium marche-de-podium-${m.rang} mt-2 flex items-start justify-center rounded-t-md bg-slate-900 pt-3 ${
                HAUTEURS_DES_MARCHES[m.rang - 1]
              } ${m.moi ? "ligne-moi" : ""}`}
            >
              <PastilleDeRang rang={m.rang} doublon className="text-xl" />
            </div>
          </li>
        ) : (
          <li key={`vide-${i}`} aria-hidden className="order-3" />
        ),
      )}
    </ol>
  );
}
