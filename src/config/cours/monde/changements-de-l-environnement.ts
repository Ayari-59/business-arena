import { auCentime } from "./amortissement";
import { aleaDe } from "./capacite";
import { ENTREPRISES_DE_LA_DIRECTION, FICHE_DE_DIRECTION } from "./direction-de-nova";
import { AUTRES_COUTS_PAR_ENCEINTE, COMPOSANTS_PAR_ENCEINTE, DEMANDE_A_PRIX_NUL, DEMANDE_PERDUE_PAR_EURO, PRIX_DE_L_ENCEINTE } from "./nova-gestion";
import { KG_CO2_PAR_KWH, KG_D_EMBALLAGE_PAR_ENCEINTE, KWH_PAR_ENCEINTE, PART_VALORISEE } from "./tableau-de-bord-durable";

/**
 * LE MONDE DU COURS : NOVA FACE AUX CHANGEMENTS DE SON ENVIRONNEMENT (management de première STMG,
 * question 1.4, lot B).
 *
 * L'organisation est un système complexe, au milieu de ses parties prenantes : un changement venu de
 * l'une se propage aux autres, et le management régule, il ajuste ses décisions pour retrouver un
 * équilibre. Ce fichier relit les fiches de NOVA :
 *   · nova-gestion.ts : le prix, les composants, les autres coûts et la droite de demande du premier
 *     trimestre (16 755 − 203 × prix) ;
 *   · nova-capacite.ts : les enceintes vendues en N et l'aléa de la cyberattaque du site de vente ;
 *   · tableau-de-bord-durable.ts : l'électricité et l'emballage d'une enceinte, le CO2 du kWh, la part
 *     de l'emballage valorisée.
 *
 * UNE SEULE HYPOTHÈSE DU COURS : Électro-Composants Lyon annonce une hausse de 10 % du prix de ses
 * composants (les métaux et l'énergie qui montent). Le prix nouveau se cherche de 50 centimes en
 * 50 centimes, sur la droite de demande du premier trimestre, à l'enceinte entière.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : l'emballage non valorisé et le CO2 du montage se donnaient au
 * kilo, ils sont au centième de kilo, comme l'emballage de l'année.
 */

export const ENTREPRISES_DU_CHANGEMENT = ENTREPRISES_DE_LA_DIRECTION;

export const HAUSSE_DES_COMPOSANTS = 0.1;

/** Les prix que le laboratoire essaie : de 59 € à 64 €, de 50 centimes en 50 centimes. */
export const PRIX_ESSAYES = { min: PRIX_DE_L_ENCEINTE, max: PRIX_DE_L_ENCEINTE + 5, pas: 0.5 } as const;

export type PartiePrenante = "interne" | "externe";

/** Les parties prenantes de NOVA, internes ou externes. */
export const PARTIES_PRENANTES: readonly { libelle: string; cote: PartiePrenante; pourquoi: string }[] = [
  { libelle: "Les opérateurs de montage", cote: "interne", pourquoi: "Ils travaillent dans l'entreprise : une partie prenante interne." },
  { libelle: "Les associés", cote: "interne", pourquoi: "Ils en sont les propriétaires et votent à l'assemblée : internes." },
  { libelle: "Le président", cote: "interne", pourquoi: "Il la dirige, de l'intérieur." },
  { libelle: "CampusTech, la chaîne de magasins qui revend ses enceintes", cote: "externe", pourquoi: "Un client professionnel : une partie prenante externe." },
  { libelle: "Électro-Composants Lyon, son fournisseur", cote: "externe", pourquoi: "Il la livre de l'extérieur : externe." },
  { libelle: "La banque qui lui a prêté", cote: "externe", pourquoi: "Un prêteur, hors de l'entreprise : externe." },
  { libelle: "L'État, qui prélève l'impôt et fixe les règles", cote: "externe", pourquoi: "Il agit sur l'entreprise de l'extérieur : externe." },
];

/** La demande du premier trimestre au prix p, à l'enceinte entière (nova-gestion.ts). */
export const demandeDuTrimestre = (prix: number) => Math.floor(DEMANDE_A_PRIX_NUL - DEMANDE_PERDUE_PAR_EURO * prix + 1e-9);

/** Le coût variable d'une enceinte, et la marge du premier trimestre, à un prix donné, avec ou sans la hausse. */
export function margeDuTrimestre(prix: number, hausse = HAUSSE_DES_COMPOSANTS) {
  const composants = auCentime(COMPOSANTS_PAR_ENCEINTE * (1 + hausse));
  const coutVariable = auCentime(composants + AUTRES_COUTS_PAR_ENCEINTE);
  const demande = demandeDuTrimestre(prix);
  const margeUnitaire = auCentime(prix - coutVariable);
  return { prix, composants, coutVariable, demande, margeUnitaire, marge: auCentime(margeUnitaire * demande) };
}

/** La hausse des composants, propagée : avant, après, au prix d'aujourd'hui. */
export function hausseDesComposants() {
  const avant = margeDuTrimestre(PRIX_DE_L_ENCEINTE, 0);
  const apres = margeDuTrimestre(PRIX_DE_L_ENCEINTE);
  return { avant, apres, margePerdue: auCentime(avant.marge - apres.marge), hausse: HAUSSE_DES_COMPOSANTS };
}

/** Les prix que le laboratoire essaie. */
export const prixEssayes = () =>
  Array.from({ length: Math.round((PRIX_ESSAYES.max - PRIX_ESSAYES.min) / PRIX_ESSAYES.pas) + 1 }, (_, i) => Math.round((PRIX_ESSAYES.min + i * PRIX_ESSAYES.pas) * 100) / 100);

/** Le prix, parmi ceux qu'on essaie, qui rend la plus grande marge du trimestre après la hausse. */
export function prixQuiRegule() {
  return prixEssayes().reduce((m, p) => (margeDuTrimestre(p).marge > margeDuTrimestre(m).marge ? p : m));
}

/** La cyberattaque du site de vente : son coût si elle tombe, et son coût moyen sur l'année. */
export function cyberattaque() {
  const f = FICHE_DE_DIRECTION;
  const a = aleaDe(f, "cyberattaque");
  const marge = auCentime(f.enceinte.prix - f.enceinte.coutVariable.composants - f.enceinte.coutVariable.autres);
  const cout = auCentime(a.dommages + a.ventesPerdues * marge);
  return { dommages: a.dommages, ventesPerdues: a.ventesPerdues, marge, cout, probabilite: a.probabilite, coutMoyen: auCentime(cout * a.probabilite) };
}

/** L'empreinte de l'année N : l'électricité et le CO2 du montage, l'emballage et sa part non valorisée. */
export function empreinteDeLAnnee() {
  const enceintes = FICHE_DE_DIRECTION.anneeN.demande.reduce((t, x) => t + x, 0);
  const kwh = auCentime(enceintes * KWH_PAR_ENCEINTE);
  const emballage = auCentime(enceintes * KG_D_EMBALLAGE_PAR_ENCEINTE);
  return {
    enceintes,
    kwhParEnceinte: KWH_PAR_ENCEINTE,
    kwh,
    kgCo2: auCentime(kwh * KG_CO2_PAR_KWH),
    kgParEnceinte: KG_D_EMBALLAGE_PAR_ENCEINTE,
    emballage,
    partValorisee: PART_VALORISEE.avant,
    nonValorise: auCentime(emballage * (1 - PART_VALORISEE.avant)),
  };
}

export type CoteDuNumerique = "opportunite" | "risque";
export type PilierDeLaRse = "economique" | "social" | "environnemental";

/**
 * LE CAS DU CHAPITRE (hypothèse du cours) : un prestataire propose de protéger le site de vente
 * (sauvegardes, pare-feu, mises à jour) pour 800 € par an. La cyberattaque n'aurait plus que 1 %
 * de chances de tomber dans l'année.
 */
export const PROTECTION_DU_SITE = { prixParAn: 800, probabilite: 0.01 } as const;

/** Le site protégé ou non : le coût moyen de l'année dans chaque cas. */
export function protegerLeSite() {
  const k = cyberattaque();
  const avec = auCentime(PROTECTION_DU_SITE.prixParAn + k.cout * PROTECTION_DU_SITE.probabilite);
  return { ...k, sans: k.coutMoyen, avec, gain: auCentime(k.coutMoyen - avec), protection: PROTECTION_DU_SITE };
}
