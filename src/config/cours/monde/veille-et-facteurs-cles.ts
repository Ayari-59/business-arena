import { auCentime } from "./amortissement";
import { AURIS, NOVA as NOVA_SUR_LE_MARCHE, SOUNDBOX } from "./marche-a-trois";
import { CLIENTELES, type ClienteleDuMarche } from "./mercatique-de-nova";

/**
 * LE MONDE DU COURS : LA VEILLE, LES FACTEURS CLÉS DE SUCCÈS ET LES COMPÉTENCES DISTINCTIVES DE NOVA
 * (management de première STMG, questions 2.1 et 2.2, lot B ; le complément du chapitre « Le
 * diagnostic stratégique »).
 *
 * Aucun chiffre nouveau : les clientèles et leurs sensibilités viennent de mercatique-de-nova.ts, les
 * trois enseignes de marche-a-trois.ts.
 *
 * LA RÈGLE DU FACTEUR CLÉ DE SUCCÈS D'UNE CLIENTÈLE : ce qui la fait le plus acheter. Le prix, si c'est
 * elle qui perd le plus de clients par euro de hausse ; sinon la qualité, si elle y est le plus
 * sensible ; sinon la publicité. Le facteur clé de succès du marché est celui de sa plus grande
 * clientèle, en enceintes achetées à tous les vendeurs.
 */

export type FacteurCle = "prix" | "qualite" | "notoriete";

export const LIBELLES_DES_FACTEURS: Readonly<Record<FacteurCle, string>> = {
  prix: "Un prix bas",
  qualite: "La qualité du son et de la fabrication",
  notoriete: "Une marque connue, vue en publicité",
};

/** Le facteur clé de succès d'une clientèle, par la règle ci-dessus. */
export function facteurCleDe(x: ClienteleDuMarche): FacteurCle {
  const plusSensibleAuPrix = Math.max(...CLIENTELES.map((k) => k.perdueParEuro));
  if (x.perdueParEuro === plusSensibleAuPrix) return "prix";
  if (x.qualite === "forte") return "qualite";
  return "notoriete";
}

/** Les clientèles du marché, leur taille, leur facteur clé ; et celui de la plus grande. */
export function facteursClesDuMarche() {
  const lignes = CLIENTELES.map((x) => ({ code: x.code, nom: x.nom, taille: x.tailleDuSegment, perdueParEuro: x.perdueParEuro, qualite: x.qualite, publicite: x.publicite, facteur: facteurCleDe(x) }));
  const plusGrande = lignes.reduce((m, x) => (x.taille > m.taille ? x : m));
  return { lignes, plusGrande };
}

/** NOVA face aux deux concurrents : le prix, le coût variable, la marge d'une enceinte, la qualité. */
export function faceAuxConcurrents() {
  const ligne = (e: typeof SOUNDBOX) => {
    const coutVariable = e.offre.composants + e.offre.autres;
    return { nom: e.nom, prix: e.offre.prix, coutVariable, marge: auCentime(e.offre.prix - coutVariable), qualite: e.offre.qualiteDeConception };
  };
  const nova = ligne(NOVA_SUR_LE_MARCHE);
  const soundbox = ligne(SOUNDBOX);
  const auris = ligne(AURIS);
  return { nova, soundbox, auris, ecartDeCout: auCentime(nova.coutVariable - soundbox.coutVariable) };
}

export type TypeDeVeille = "concurrentielle" | "technologique" | "commerciale" | "reglementaire";
