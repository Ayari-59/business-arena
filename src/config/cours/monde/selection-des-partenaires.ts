/**
 * LE MONDE DU COURS : LA SÉLECTION DES PARTENAIRES D'ATLAS CONSEIL (BTS NDRC, bloc 3, complément K5 du
 * chapitre « Les commissions des canaux partenaires »).
 *
 * Le cabinet a deux partenaires dans sa fiche (atlas-conseil.ts) : l'apporteur d'affaires et la
 * plateforme de mise en relation. Hypothèse du complément : il cherche un prescripteur de plus, qui
 * lui présente des PME, et en compare trois sur une grille multicritère pondérée. Les critères, leurs
 * poids et les notes sur 20 sont des hypothèses du cours ; la note « coût sur la vie du compte » dit
 * ce que le chapitre enseigne : une commission payée une fois coûte moins qu'une commission qui revient.
 * La garde tests/cours/atlas-conseil.test.ts refait la grille à la main.
 */

export type CodeDeCritere = "acces" | "cout" | "image" | "animation";

/** Les critères de la grille et leur poids, sur 100. */
export const CRITERES_DES_PARTENAIRES: readonly { code: CodeDeCritere; nom: string; poids: number }[] = [
  { code: "acces", nom: "Accès aux PME de la cible", poids: 35 },
  { code: "cout", nom: "Coût sur la vie du compte", poids: 25 },
  { code: "image", nom: "Image et éthique", poids: 20 },
  { code: "animation", nom: "Capacité d'animation", poids: 20 },
];

export type CodeDeCandidat = "experts-comptables" | "editeur" | "club";

/**
 * LES TROIS CANDIDATS (hypothèse du cours) et leurs notes sur 20, critère par critère :
 *   · un réseau d'experts-comptables, qui conseille déjà les PME de la cible, payé une fois par compte
 *     présenté (comme l'apporteur), mais peu disponible pour des actions communes ;
 *   · un éditeur de logiciel de gestion des ressources humaines, aux clients voisins, payé sur chaque
 *     mission, chaque année (comme la plateforme) ;
 *   · un club d'entreprises local, contre une cotisation modeste, actif, mais dont les membres sont
 *     surtout des commerces, loin de la cible.
 */
export const CANDIDATS: readonly { code: CodeDeCandidat; nom: string; court: string; notes: Readonly<Record<CodeDeCritere, number>> }[] = [
  { code: "experts-comptables", nom: "Réseau d'experts-comptables", court: "Experts-comptables", notes: { acces: 16, cout: 14, image: 18, animation: 10 } },
  { code: "editeur", nom: "Éditeur de logiciel RH", court: "Éditeur RH", notes: { acces: 13, cout: 10, image: 12, animation: 14 } },
  { code: "club", nom: "Club d'entreprises local", court: "Club local", notes: { acces: 10, cout: 18, image: 14, animation: 12 } },
];

const auCentieme = (x: number) => Math.round(x * 100) / 100 + 0;

/** La note pondérée d'un candidat, sur 20 : la somme des notes × poids ÷ 100. */
export const noteDuCandidat = (code: CodeDeCandidat) => {
  const k = CANDIDATS.find((x) => x.code === code)!;
  return auCentieme(CRITERES_DES_PARTENAIRES.reduce((t, c) => t + (k.notes[c.code] * c.poids) / 100, 0));
};

/** La grille entière : chaque candidat et sa note, du mieux noté au moins bien noté. */
export function grilleDesPartenaires() {
  const notes = CANDIDATS.map((k) => ({ ...k, note: noteDuCandidat(k.code) }));
  return { notes, retenu: [...notes].sort((a, b) => b.note - a.note)[0]!, poidsTotal: CRITERES_DES_PARTENAIRES.reduce((t, c) => t + c.poids, 0) };
}
