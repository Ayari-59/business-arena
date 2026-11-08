import { auCentime } from "./amortissement";
import { ENTREPRISES_DE_LA_DIRECTION } from "./direction-de-nova";
import { AURIS, NOVA as NOVA_SUR_LE_MARCHE, SOUNDBOX } from "./marche-a-trois";
import { CLIENTELES } from "./mercatique-de-nova";
import { GAMME_DE_NOVA, type CodeDeReference } from "./nova-gestion";

/**
 * LE MONDE DU COURS : LES DOMAINES D'ACTIVITÉ DE NOVA (management de première STMG, question 3.1, lot B).
 *
 * En N + 1, NOVA vend une gamme de trois enceintes (nova-gestion.ts, le mois en gamme) : Go, la petite
 * enceinte nomade, One, l'enceinte du salon, et Studio, l'enceinte haut de gamme. Chacune vise sa
 * clientèle (mercatique-de-nova.ts : les étudiants comparent les prix, les familles suivent la
 * publicité, les mélomanes paient la qualité) et rencontre ses concurrents (marche-a-trois.ts :
 * SoundBox, bon marché, Auris, haut de gamme). Ce sont trois domaines d'activité stratégique : un
 * couple clients et concurrents, où NOVA mène une stratégie de domaine.
 *
 * Aucun chiffre nouveau. LA CONTRIBUTION d'une référence : sa marge sur coût variable du mois, moins
 * sa publicité, une charge fixe qui lui est propre. Le laboratoire fait varier les ventes de Studio,
 * de celles du mois en gamme à la demande du mois de pointe, sans dépasser les heures-machine des
 * deux lignes (il en reste assez).
 */

export const ENTREPRISES_DES_DOMAINES = ENTREPRISES_DE_LA_DIRECTION;

/** Le domaine que vise chaque référence de la gamme : la clientèle, et le concurrent qui y tient le marché. */
export const DOMAINES: Readonly<Record<CodeDeReference, { domaine: string; clientele: string }>> = {
  go: { domaine: "L'enceinte nomade, petite et bon marché", clientele: "etudiants" },
  one: { domaine: "L'enceinte du salon, au prix du milieu", clientele: "familles" },
  studio: { domaine: "L'enceinte haut de gamme", clientele: "melomanes" },
};

const reference = (code: CodeDeReference) => GAMME_DE_NOVA.references.find((r) => r.code === code)!;

/** La contribution d'une référence sur le mois, à une quantité donnée (par défaut, celle du mois en gamme). */
export function contribution(code: CodeDeReference, quantite: number = reference(code).quantite) {
  const r = reference(code);
  const margeUnitaire = auCentime(r.prix - r.coutVariableUnitaire);
  return { ...r, quantite, margeUnitaire, marge: auCentime(margeUnitaire * quantite), contribution: auCentime(margeUnitaire * quantite - r.publicite) };
}

/** La gamme du mois, à des ventes de Studio données : les contributions, la part de One, les heures-machine. */
export function gammeDuMois(ventesDeStudio: number = reference("studio").quantite) {
  const go = contribution("go");
  const one = contribution("one");
  const studio = contribution("studio", ventesDeStudio);
  const total = auCentime(go.contribution + one.contribution + studio.contribution);
  const heures = auCentime(go.heuresMachineParUnite * go.quantite + one.heuresMachineParUnite * one.quantite + studio.heuresMachineParUnite * ventesDeStudio);
  return {
    go,
    one,
    studio,
    total,
    /** La part de One dans les contributions du mois, en pour cent au dixième. */
    partDeOne: Math.round((one.contribution / total) * 1000) / 10,
    heures,
    capaciteHeures: GAMME_DE_NOVA.capaciteHeuresMachine,
  };
}

/** Les ventes de Studio que le laboratoire essaie : de celles du mois en gamme à la demande du mois de pointe. */
export const VENTES_DE_STUDIO_ESSAYEES = { min: reference("studio").quantite, max: reference("studio").demandeDuMoisDePointe, pas: 1 } as const;

/** La part de One sous laquelle NOVA ne dépend plus d'une seule enceinte pour la moitié de ses contributions. */
export const PART_DE_LA_DEPENDANCE = 50;

/** Les plus petites ventes de Studio qui font passer One sous la moitié des contributions. */
export function studioQuiReduitLaDependance() {
  for (let q = VENTES_DE_STUDIO_ESSAYEES.min; q <= VENTES_DE_STUDIO_ESSAYEES.max; q += VENTES_DE_STUDIO_ESSAYEES.pas) {
    const g = gammeDuMois(q);
    if ((g.one.contribution / g.total) * 100 < PART_DE_LA_DEPENDANCE) return q;
  }
  return VENTES_DE_STUDIO_ESSAYEES.max;
}

export type Avantage = "couts" | "differenciation" | "milieu";

/** Les trois enseignes du marché, leur offre et l'avantage concurrentiel qu'elles tiennent (marche-a-trois.ts). */
export function avantagesDuMarche() {
  const ligne = (e: typeof SOUNDBOX) => ({
    nom: e.nom,
    prix: e.offre.prix,
    coutVariable: e.offre.composants + e.offre.autres,
    qualite: e.offre.qualiteDeConception,
  });
  return [
    { ...ligne(SOUNDBOX), avantage: "couts" as Avantage },
    { ...ligne(AURIS), avantage: "differenciation" as Avantage },
    { ...ligne(NOVA_SUR_LE_MARCHE), avantage: "milieu" as Avantage },
  ];
}

/** La clientèle d'un domaine (mercatique-de-nova.ts). */
export const clienteleDe = (code: string) => CLIENTELES.find((x) => x.code === code)!;
