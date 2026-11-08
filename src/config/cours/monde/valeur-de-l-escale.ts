import { anneeDeLHotel, trimestreDeLHotel } from "./hotel";
import { L_ESCALE } from "./l-escale";

/**
 * LE MONDE DU COURS : LES FORMES DE LA VALEUR À L'ESCALE (le chapitre « Les formes de la valeur :
 * financière, partenariale, perçue », SGN de première T3.1).
 *
 * CE QUI VIENT DE LA FICHE DE L'HÔTEL (l-escale.ts, et son modèle hotel.ts) : l'année à 88 € la nuitée,
 * trimestre par trimestre (17 700 nuitées vendues, l'été plein), le coût variable d'une nuitée, les
 * charges fixes du trimestre, l'équipe et ce qu'elle coûte, et le prix des deux hôtels concurrents.
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · les 400 avis publiés sur l'année par les clients de L'ESCALE, étoile par étoile ;
 *   · la note moyenne des deux concurrents sur les mêmes sites (3,6 et 4,6) ;
 *   · le prix que Le Comptoir affichera l'hiver prochain (72 €, le cas « Le Comptoir baisse son prix »).
 */

const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;

/** Les avis de l'année : le nombre d'avis à 5, 4, 3, 2 et 1 étoile. */
export const AVIS_DE_L_ESCALE: Readonly<Record<5 | 4 | 3 | 2 | 1, number>> = { 5: 180, 4: 140, 3: 40, 2: 24, 1: 16 };

/** Les notes moyennes des concurrents, dans l'ordre de la fiche (Le Comptoir, Le Grand Hôtel Terminus). */
export const NOTES_DES_CONCURRENTS: readonly number[] = [3.6, 4.6];

/** Le prix que Le Comptoir annonce pour l'hiver prochain (hypothèse du cas). */
export const PRIX_D_HIVER_DU_COMPTOIR = 72;

/** L'année de l'hôtel au prix de la fiche. */
export const anneeDeLEscale = () => anneeDeLHotel(L_ESCALE, [1, 2, 3, 4].map(() => L_ESCALE.prixDeLAnnee));

export function valeurDeLEscale() {
  const a = anneeDeLEscale();
  const personnel = L_ESCALE.equipe.effectif * L_ESCALE.equipe.coutParSalarieParTrimestre * 4;
  const avis = (Object.entries(AVIS_DE_L_ESCALE) as [string, number][]).map(([etoiles, n]) => ({ etoiles: Number(etoiles), n }));
  const nombreDAvis = avis.reduce((t, x) => t + x.n, 0);
  const points = avis.reduce((t, x) => t + x.etoiles * x.n, 0);
  const satisfaits = AVIS_DE_L_ESCALE[5] + AVIS_DE_L_ESCALE[4];
  return {
    vendues: a.vendues,
    chiffreDAffaires: a.chiffreDAffaires,
    resultat: a.resultat,
    personnel,
    /** La part du chiffre d'affaires qui revient aux salariés, et celle qui reste aux associés (le résultat), en %. */
    partDesSalariesPct: auDixieme((personnel / a.chiffreDAffaires) * 100),
    partDesAssociesPct: auDixieme((a.resultat / a.chiffreDAffaires) * 100),
    nombreDAvis,
    points,
    noteMoyenne: Math.round((points / nombreDAvis) * 100) / 100,
    satisfaits,
    tauxDeSatisfactionPct: auDixieme((satisfaits / nombreDAvis) * 100),
  };
}

/** Le coût complet d'une nuitée au trimestre donné, au prix de la fiche : coût variable + charges fixes ÷ nuitées vendues. */
export function coutCompletDUneNuitee(numero: number) {
  const t = trimestreDeLHotel(L_ESCALE, numero, L_ESCALE.prixDeLAnnee);
  return { vendues: t.vendues, coutComplet: auCentime(L_ESCALE.coutVariableParNuitee + L_ESCALE.chargesFixesParTrimestre / t.vendues) };
}

/** Le résultat du trimestre si l'hôtel vendait ses nuitées au prix donné, sans que la demande ne bouge (hypothèse du curseur). */
export function resultatADemandeEgale(numero: number, prix: number) {
  const { vendues } = coutCompletDUneNuitee(numero);
  return { vendues, chiffreDAffaires: auCentime(vendues * prix), couts: auCentime(vendues * L_ESCALE.coutVariableParNuitee + L_ESCALE.chargesFixesParTrimestre), resultat: auCentime(vendues * (prix - L_ESCALE.coutVariableParNuitee) - L_ESCALE.chargesFixesParTrimestre) };
}

/** Le plus bas prix, à l'euro, qui couvre le coût complet d'une nuitée au trimestre donné. */
export const prixPlancher = (numero: number) => Math.ceil(coutCompletDUneNuitee(numero).coutComplet - 1e-9);
