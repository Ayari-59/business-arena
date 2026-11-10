import { auCentime } from "./amortissement";
import { ENTREPRISES_DE_LA_DIRECTION } from "./direction-de-nova";
import { GAMME_DE_NOVA } from "./nova-gestion";

/**
 * LE MONDE DU COURS : LES MODES DE VIE CHANGENT, CHEZ NOVA (enseignement commun de terminale STMG,
 * question 3.2, lot C).
 *
 * CE QUI VIENT DES FICHES : la Studio de la gamme (nova-gestion.ts : 129 € hors taxes, 70 € de coût
 * variable, soit 59 € de marge sur coût variable par vente).
 *
 * LES HYPOTHÈSES DU COURS, dites ici :
 *   · LE TÉLÉTRAVAIL : l'assistante de gestion et le commercial travaillent chez eux 2 jours par semaine,
 *     46 semaines par an ; chacun habite à 25 km de l'atelier (50 km aller et retour) ;
 *   · LA LOCATION : une plateforme de location entre particuliers et professionnels propose de louer la
 *     Studio 15 € le week-end ; elle prend 20 % de commission. Chaque location coûte 2,50 € à NOVA
 *     (contrôle, nettoyage, emballage). Une Studio louée est une Studio fabriquée, mais pas vendue ;
 *   · LE CAS : NOVA mettrait 20 Studio en location ; la plateforme en attend 6 locations par an chacune,
 *     pendant les 3 ans que dure une Studio louée.
 */

export const ENTREPRISES_DES_MODES_DE_VIE = ENTREPRISES_DE_LA_DIRECTION;

export const TELETRAVAIL = { salaries: 2, joursParSemaine: 2, semaines: 46, kmAllerRetour: 50 } as const;
export const LOCATION = { prixDuWeekEnd: 15, commission: 0.2, coutParLocation: 2.5 } as const;
export const PARC_EN_LOCATION = { studios: 20, locationsParAn: 6, ans: 3 } as const;

const studio = () => GAMME_DE_NOVA.references.find((r) => r.code === "studio")!;

/** Le télétravail de l'année : jours à la maison et kilomètres évités, pour les salariés concernés. */
export function teletravail() {
  const t = TELETRAVAIL;
  const jours = t.salaries * t.joursParSemaine * t.semaines;
  return { ...t, jours, km: jours * t.kmAllerRetour };
}

/** Vendre une Studio, ou la louer n fois : la marge d'une vente, ce que laisse une location, et le nombre de locations qui font mieux. */
export function louerOuVendre(locations?: number) {
  const s = studio();
  const margeDeLaVente = s.prix - s.coutVariableUnitaire;
  const parLocation = auCentime(LOCATION.prixDuWeekEnd * (1 - LOCATION.commission) - LOCATION.coutParLocation);
  const aBattre = s.coutVariableUnitaire + margeDeLaVente;
  const seuil = Math.ceil(aBattre / parLocation - 1e-9);
  const n = locations ?? seuil;
  return { prix: s.prix, coutVariable: s.coutVariableUnitaire, margeDeLaVente, parLocation, aBattre, seuil, n, recettesNettes: auCentime(n * parLocation), apresLaFabrication: auCentime(n * parLocation - s.coutVariableUnitaire) };
}

/** Le cas : le parc de Studio en location, sur la durée d'une Studio, face à leur vente. */
export function parcEnLocation() {
  const p = PARC_EN_LOCATION;
  const l = louerOuVendre(p.locationsParAn * p.ans);
  return { ...p, locations: l.n, parStudio: l.apresLaFabrication, location: auCentime(p.studios * l.apresLaFabrication), vente: p.studios * l.margeDeLaVente };
}
