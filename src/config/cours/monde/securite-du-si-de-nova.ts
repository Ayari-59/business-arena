import { auCentime } from "./amortissement";
import { ENTREPRISES_DE_LA_DIRECTION } from "./direction-de-nova";
import { AUTRES_COUTS_PAR_ENCEINTE, COMPOSANTS_PAR_ENCEINTE, JOURS_DU_MOIS_COMMERCIAL, PRIX_DE_L_ENCEINTE, VENTES_DES_PARTICULIERS } from "./nova-gestion";

/**
 * LE MONDE DU COURS : SÉCURISER LE SYSTÈME D'INFORMATION DE NOVA (enseignement spécifique de systèmes
 * d'information de gestion de terminale STMG, thème 1, question 1.2, lot F).
 *
 * CE QUI VIENT DES FICHES : les enceintes vendues en ligne aux particuliers en mai, 1 710, sur un mois
 * commercial de 30 jours ; le prix de 59 €, les composants à 22 € et les autres coûts variables à 16 €,
 * soit une marge de 21 € par enceinte (nova-gestion.ts).
 *
 * CE QUI VIENT DES TEXTES, VÉRIFIÉ SUR CNIL.FR ET CYBERMALVEILLANCE.GOUV.FR (novembre 2026) : une violation
 * de données qui présente un risque se notifie à la CNIL dans les meilleurs délais, si possible dans les
 * 72 heures ; les personnes sont informées si le risque est élevé ; l'amende peut atteindre 20 millions
 * d'euros ou 4 % du chiffre d'affaires annuel mondial. Face à un rançongiciel, le dispositif national
 * d'assistance conseille de ne pas payer et de porter plainte.
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · UN JOUR D'ARRÊT DU SITE fait perdre les ventes d'un jour de mai, et leur marge : les clients vont
 *     ailleurs, ils ne reviennent pas le lendemain ;
 *   · LE PLAN DE SAUVEGARDE ET DE REPRISE : une sauvegarde chaque nuit, chiffrée, gardée hors des locaux
 *     et hors ligne, et un contrat qui remet le site en ligne en un jour ; 3 000 € par an ;
 *   · LA GRILLE DES RISQUES : la probabilité et la gravité se notent de 1 à 4, et la criticité est leur
 *     produit ; les notes de la grille sont celles du président et de son prestataire ;
 *   · LE CAS : un rançongiciel chiffre le serveur du site. Les pirates demandent 8 000 €. La sauvegarde de
 *     la nuit permet de restaurer le site en 1 jour, avec 1 500 € de prestataire.
 */

export const ENTREPRISES_DE_LA_SECURITE = ENTREPRISES_DE_LA_DIRECTION;

export const PLAN_DE_SAUVEGARDE = { parAn: 3_000 } as const;
export const RANCONGICIEL = { rancon: 8_000, joursDeRestauration: 1, prestataire: 1_500 } as const;

/** La grille des risques du système d'information de NOVA : probabilité et gravité, de 1 à 4. */
export const GRILLE_DES_RISQUES = [
  { code: "hameconnage", libelle: "Un salarié donne son mot de passe à un faux courriel", probabilite: 4, gravite: 2 },
  { code: "rancongiciel", libelle: "Un rançongiciel chiffre le serveur du site", probabilite: 2, gravite: 4 },
  { code: "disque", libelle: "Le disque de l'ordinateur de facturation tombe en panne", probabilite: 3, gravite: 3 },
  { code: "vol", libelle: "Un ordinateur portable est volé", probabilite: 1, gravite: 3 },
] as const;

export const criticite = (r: { probabilite: number; gravite: number }) => r.probabilite * r.gravite;

/** Le risque le plus critique de la grille. */
export const risqueLePlusCritique = () => [...GRILLE_DES_RISQUES].sort((a, b) => criticite(b) - criticite(a))[0]!;

const MARGE_D_UNE_ENCEINTE = PRIX_DE_L_ENCEINTE - COMPOSANTS_PAR_ENCEINTE - AUTRES_COUTS_PAR_ENCEINTE;
const VENTES_DE_MAI = VENTES_DES_PARTICULIERS[4];

/** Ce que coûte un jour d'arrêt du site : la marge des ventes d'un jour de mai. */
export function unJourDArret() {
  const ventesParJour = VENTES_DE_MAI / JOURS_DU_MOIS_COMMERCIAL;
  return { ventesDuMois: VENTES_DE_MAI, jours: JOURS_DU_MOIS_COMMERCIAL, ventesParJour, marge: MARGE_D_UNE_ENCEINTE, cout: auCentime(ventesParJour * MARGE_D_UNE_ENCEINTE) };
}

/** Ce que valent des jours d'arrêt évités. */
export const valeurDesJoursDArretEvites = (jours: number) => auCentime(jours * unJourDArret().cout);

/** Le plus petit nombre de jours d'arrêt évités qui paie le plan de l'année. */
export const joursQuiPaientLePlan = () => Math.ceil(PLAN_DE_SAUVEGARDE.parAn / unJourDArret().cout - 1e-9);

/** Le cas : restaurer depuis la sauvegarde, ou payer la rançon. */
export function restaurerOuPayer() {
  const r = RANCONGICIEL;
  const restauration = auCentime(r.joursDeRestauration * unJourDArret().cout + r.prestataire);
  return { ...r, coutDUnJour: unJourDArret().cout, restauration, ecart: auCentime(r.rancon - restauration) };
}
