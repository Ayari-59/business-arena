import { auCentime } from "./amortissement";
import { coutsDeLaGamme, resultatSansLaReference } from "./couts-et-budgets";
import { ENTREPRISES_DE_LA_DIRECTION } from "./direction-de-nova";
import { NOVA_GESTION, type CodeDeReference } from "./nova-gestion";

/**
 * LE MONDE DU COURS : COÛT COMPLET OU COÛT SPÉCIFIQUE, LA GAMME DE NOVA AU NIVEAU DU LYCÉE (gestion et
 * finance de terminale STMG, question 3.4, et enseignement commun, question 1.3 ; lot C).
 *
 * CE QUI VIENT DES FICHES : le mois en gamme de NOVA (nova-gestion.ts, GAMME_DE_NOVA : la Go, la One et
 * la Studio, leurs prix, leurs coûts variables, leur publicité, leurs heures-machine, et les charges
 * communes du mois), et le modèle qui en tire le coût complet, la marge sur coût variable et la marge
 * sur coûts spécifiques de chaque référence (couts-et-budgets.ts, `coutsDeLaGamme`, les charges communes
 * réparties aux heures-machine). Le chapitre du contrôle de gestion (« Coût par produit », palier 3) lit
 * les mêmes chiffres avec les outils du BTS ; celui-ci tient en quelques gestes, au niveau du lycée.
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · LA COMMANDE SUPPLÉMENTAIRE : une chaîne d'hôtels demande 300 enceintes One, livrées par un
 *     transport dédié qui coûte 450 € ; elle propose 42 € l'enceinte. Les deux lignes ont les heures
 *     libres pour les monter (0,3 heure chacune), et la commande ne change rien aux autres ventes ;
 *   · LE CAS : un concurrent baisse son prix, et la Go ne se vend plus qu'à 31 € (les mêmes quantités).
 */

export const ENTREPRISES_DES_COUTS_DE_LA_GAMME = ENTREPRISES_DE_LA_DIRECTION;

export const COMMANDE_DES_HOTELS = { enceintes: 300, transport: 450, prixPropose: 42, reference: "one" as CodeDeReference } as const;
export const PRIX_DE_LA_GO_APRES_LA_BAISSE = 31;

/** Les charges communes du mois : le loyer, le personnel, l'entretien et l'usure des deux lignes. */
export const CHARGES_COMMUNES = NOVA_GESTION.gamme.communes;

/** Les coûts de la gamme du mois, au prix de la fiche ou à un autre prix de la Go. */
export const gammeDuMois = (prixDeLaGo?: number) => coutsDeLaGamme(NOVA_GESTION, prixDeLaGo === undefined ? {} : { prix: { go: prixDeLaGo } });

/** Une référence de la gamme du mois. */
export const referenceDuMois = (code: CodeDeReference, prixDeLaGo?: number) => gammeDuMois(prixDeLaGo).parReference.find((r) => r.code === code)!;

/** Le résultat du mois sans une référence : ses charges propres partent, les charges communes restent. */
export const resultatSans = (code: CodeDeReference, prixDeLaGo?: number) => resultatSansLaReference(gammeDuMois(prixDeLaGo), code);

/** Les heures-machine libres du mois : la capacité des deux lignes moins les heures de la gamme. */
export const heuresLibres = () => auCentime(NOVA_GESTION.gamme.capaciteHeuresMachine - gammeDuMois().heures);

/** La commande supplémentaire à un prix : ce qu'elle rapporte, son coût marginal, et ce qu'elle laisse. */
export function commandeDesHotels(prix: number = COMMANDE_DES_HOTELS.prixPropose) {
  const k = COMMANDE_DES_HOTELS;
  const r = referenceDuMois(k.reference);
  const recette = k.enceintes * prix;
  const coutMarginal = auCentime(k.enceintes * r.coutVariableUnitaire + k.transport);
  return {
    ...k,
    prix,
    coutVariable: r.coutVariableUnitaire,
    heures: auCentime(k.enceintes * r.heuresMachineParUnite),
    recette,
    coutMarginal,
    coutMarginalUnitaire: auCentime(coutMarginal / k.enceintes),
    gain: auCentime(recette - coutMarginal),
    prixPlancher: Math.ceil(coutMarginal / k.enceintes - 1e-9),
  };
}
