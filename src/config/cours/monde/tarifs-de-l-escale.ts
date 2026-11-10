import { arrondi2 } from "../../../pedagogy/cours/deux-decimales";
import { trimestreDeLHotel, nuiteesOffertes } from "./hotel";
import { L_ESCALE } from "./l-escale";
import { LA_TABLE_D_AUGUSTIN } from "./la-table-d-augustin";

/**
 * LE MONDE DU COURS : LES POLITIQUES TARIFAIRES DE L'ESCALE (le chapitre « Les politiques tarifaires :
 * prix différencié, yield management, forfait, gratuité, prix cible », mercatique de terminale,
 * question 1.3 : « Le prix, entre raison et illusion ? »).
 *
 * CE QUI VIENT DE LA FICHE DE L'HÔTEL (l-escale.ts, et son modèle hotel.ts) : les chambres, les jours du
 * trimestre, le prix de l'année (88 €), le coût variable d'une nuitée, la sensibilité de la demande au
 * prix (−1,5), la demande de chaque clientèle trimestre par trimestre. Le modèle calcule la demande à
 * un prix donné, les nuitées vendues, refusées et vides. Le ticket moyen du bistrot vient de
 * la-table-d-augustin.ts.
 *
 * LES HYPOTHÈSES DU CHAPITRE, dites ici :
 *   · LE FORFAIT WEEK-END, pour remplir l'hiver : deux nuitées et deux dîners à LA TABLE D'AUGUSTIN,
 *     vendus 199 € hors taxes ; l'hôtel achète chaque dîner 30 € au bistrot, prix négocié ;
 *   · LA CHAMBRE AFFAIRES : une chambre avec un bureau et un départ tardif, pour la clientèle d'affaires,
 *     dont les entreprises remboursent au plus 99 € la nuitée (le prix cible). L'hôtel veut y garder
 *     70 € de marge ; le bureau et le départ tardif ajoutent 6 € au coût variable d'une nuitée ;
 *   · LE CAS « LE CONGRÈS DE JUILLET » : un organisateur demande 1 000 nuitées au troisième trimestre, à
 *     75 € la nuitée.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : le taux de marge et la baisse de la demande se donnaient au
 * dixième, ils sont à deux décimales.
 */

const auCentime = arrondi2;

export const HIVER = 1;
export const ETE = 3;

/** Le forfait week-end (hypothèse du chapitre). */
export const FORFAIT_WEEK_END = { nuitees: 2, diners: 2, prixDuDinerAchete: 30, prix: 199 } as const;

/** La chambre affaires (hypothèse du chapitre). */
export const CHAMBRE_AFFAIRES = { prixCible: 99, margeVisee: 70, coutDesServices: 6 } as const;

/** Le congrès de juillet (hypothèse du cas). */
export const CONGRES_DE_JUILLET = { nuitees: 1_000, prix: 75 } as const;

/** Le prix unique de l'année : ce qu'il laisse sur une nuitée, et le taux de marge sur le coût variable. */
export function margeDUneNuitee() {
  const marge = auCentime(L_ESCALE.prixDeLAnnee - L_ESCALE.coutVariableParNuitee);
  return { prix: L_ESCALE.prixDeLAnnee, cout: L_ESCALE.coutVariableParNuitee, marge, tauxDeMarge: arrondi2((marge / L_ESCALE.coutVariableParNuitee) * 100) };
}

/** Un trimestre de l'hôtel au prix donné (au prix de l'année par défaut). */
export const trimestreAuPrix = (numero: number, prix: number = L_ESCALE.prixDeLAnnee) => trimestreDeLHotel(L_ESCALE, numero, prix);

/** L'année au prix unique, trimestre par trimestre. */
export const anneeAuPrixUnique = () => [1, 2, 3, 4].map((n) => trimestreAuPrix(n));

/** Les nuitées que l'hôtel offre en un trimestre. */
export const nuiteesDuTrimestre = () => nuiteesOffertes(L_ESCALE);

/** La baisse de la demande, en %, pour une hausse du prix de `hausse` (0,10 pour 10 %), toutes clientèles réunies. */
export const baisseDeLaDemande = (hausse: number) => arrondi2((1 - (1 + hausse) ** L_ESCALE.elasticite) * 100);

/** Le prix d'été le plus haut, à l'euro, auquel la demande remplit encore l'hôtel. */
export function prixDEteQuiRemplit() {
  let p = L_ESCALE.prixDeLAnnee;
  while (trimestreAuPrix(ETE, p + 1).demande >= nuiteesDuTrimestre()) p++;
  return p;
}

/** Les bornes du laboratoire du prix d'été. */
export const PRIX_D_ETE_DU_LABORATOIRE = { min: L_ESCALE.prixDeLAnnee, max: 130, pas: 1 } as const;

/** Le forfait week-end : ce que paierait le client sans forfait, ce qu'il coûte à l'hôtel, et la marge qu'il laisse. */
export function forfaitWeekEnd() {
  const f = FORFAIT_WEEK_END;
  const sansForfait = auCentime(f.nuitees * L_ESCALE.prixDeLAnnee + f.diners * LA_TABLE_D_AUGUSTIN.prixDeLAnnee);
  const cout = auCentime(f.nuitees * L_ESCALE.coutVariableParNuitee + f.diners * f.prixDuDinerAchete);
  return {
    ...f,
    sansForfait,
    economie: auCentime(sansForfait - f.prix),
    cout,
    marge: auCentime(f.prix - cout),
    margeDesNuiteesSeules: auCentime(f.nuitees * margeDUneNuitee().marge),
  };
}

/** La chambre affaires : le coût cible qui découle du prix cible, face au coût prévu. */
export function chambreAffaires() {
  const k = CHAMBRE_AFFAIRES;
  const coutCible = auCentime(k.prixCible - k.margeVisee);
  const coutPrevu = auCentime(L_ESCALE.coutVariableParNuitee + k.coutDesServices);
  return { ...k, coutCible, coutPrevu, tient: coutPrevu <= coutCible, margeAuPrixCible: auCentime(k.prixCible - coutPrevu) };
}

/** Le prix des deux hôtels concurrents au trimestre donné. */
export const prixDesConcurrents = (numero: number) => L_ESCALE.concurrents.map((x) => ({ nom: x.nom, prix: x.prix[numero - 1]! }));

/** Le congrès de juillet : les nuitées qu'il prend aux clients qui paient le prix de l'année, et ce que l'hôtel y gagne ou y perd. */
export function congresDeJuillet(prixDEte: number = L_ESCALE.prixDeLAnnee) {
  const k = CONGRES_DE_JUILLET;
  const t = trimestreAuPrix(ETE, prixDEte);
  // L'été est plein : chaque nuitée du congrès prend la place d'une nuitée vendue au prix de l'été.
  const remplacees = Math.min(k.nuitees, t.vendues);
  const margeDuCongres = auCentime(k.nuitees * (k.prix - L_ESCALE.coutVariableParNuitee));
  const margePerdue = auCentime(remplacees * (prixDEte - L_ESCALE.coutVariableParNuitee));
  return { ...k, refusees: t.refusees, vides: t.vides, remplacees, margeDuCongres, margePerdue, ecart: auCentime(margeDuCongres - margePerdue) };
}
