import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { MARQUE_DE_L_ARENE, MARQUE_DES_EPISODES, nomDOffre, OFFRES } from "@/config/tarifs";
import { VENDEUR } from "@/config/editeur";

/**
 * LES NOMS DES OFFRES ONT UNE SOURCE : config/tarifs.ts.
 *
 * Décision du propriétaire (octobre 2026) : l'offre « Enseignant » devient Classe,
 * l'offre « Établissement » devient Campus, les épisodes manager se vendent à part, sur
 * devis, et rien ne se commande en ligne. Les anciens noms vivaient dans une dizaine de
 * fichiers (murs de licence, messages du serveur, /admin, métadonnées) ; une offre qui
 * n'existait pas (« Offre Entreprise ») s'affichait cent fois. Cette garde refuse :
 *  · les anciens noms d'offre, partout dans src/ ;
 *  · « Commander » et « carte bancaire » hors des contenus de jeu (un épisode peut faire
 *    « commander un audit » ; un écran de vente, non) ;
 *  · les noms composés de la grille écrits à la main ailleurs que dans config/tarifs.ts :
 *    on les lit (`nomDOffre`, `MARQUE_DE_L_ARENE`, `MARQUE_DES_EPISODES`…) ;
 *  · le nom de l'entité qui facture écrit ailleurs que dans config/editeur.ts.
 */

const SRC = join(process.cwd(), "src");

function fichiers(racine: string): string[] {
  return readdirSync(racine).flatMap((e) => {
    const c = join(racine, e);
    return statSync(c).isDirectory() ? fichiers(c) : /\.tsx?$/.test(e) ? [c] : [];
  });
}

const TOUS = fichiers(SRC).map((f) => ({ chemin: f.slice(SRC.length + 1), texte: readFileSync(f, "utf8") }));

/** Les contenus de jeu : on y commande des audits et l'on y paie par carte, en fiction. */
const JEU = /^(?:config\/episodes\/(?!demos\.ts)|config\/scenarios\/|engine\/|pedagogy\/)/;

const ANCIENS_NOMS: { quoi: string; motif: RegExp }[] = [
  { quoi: "offre Enseignant", motif: /offres? Enseignant\b/i },
  { quoi: "offre Établissement", motif: /offres? (?:d'|de l')?[ÉEé]tablissement\b/i },
  { quoi: "licence établissement (comme une offre)", motif: /licence [ÉEé]tablissement\b/i },
  { quoi: "Offre Entreprise", motif: /offres? Entreprise\b/i },
  { quoi: "abonnement Enseignant", motif: /abonnement (?:Enseignant|[ÉE]tablissement)\b/i },
];

describe("les noms des offres", () => {
  it("aucun ancien nom d'offre dans src/", () => {
    const fautes = TOUS.flatMap(({ chemin, texte }) =>
      ANCIENS_NOMS.filter(({ motif }) => motif.test(texte)).map(({ quoi }) => `${chemin} : « ${quoi} »`),
    );
    expect(fautes, fautes.join("\n")).toEqual([]);
  });

  it("ni « Commander » ni « carte bancaire » hors des contenus de jeu", () => {
    const fautes = TOUS.filter(({ chemin }) => !JEU.test(chemin)).flatMap(({ chemin, texte }) => [
      ...(/\bCommander\b/.test(texte) ? [`${chemin} : « Commander »`] : []),
      ...(/carte bancaire/i.test(texte) ? [`${chemin} : « carte bancaire »`] : []),
    ]);
    expect(fautes, fautes.join("\n")).toEqual([]);
  });

  it("les noms composés de la grille ne s'écrivent qu'au même endroit", () => {
    const composes = [
      nomDOffre("classe"),
      nomDOffre("campus"),
      MARQUE_DE_L_ARENE,
      MARQUE_DES_EPISODES,
      `offres ${OFFRES.classe.nom} et ${OFFRES.campus.nom}`,
      `Offres ${OFFRES.classe.nom} et ${OFFRES.campus.nom}`,
    ];
    const fautes = TOUS.filter(({ chemin }) => chemin !== "config/tarifs.ts").flatMap(({ chemin, texte }) =>
      composes.filter((c) => texte.includes(c)).map((c) => `${chemin} : « ${c} » écrit à la main`),
    );
    expect(fautes, fautes.join("\n")).toEqual([]);
  });

  it("le nom de l'entité qui facture ne s'écrit que dans config/editeur.ts", () => {
    const fautes = TOUS.filter(({ chemin }) => chemin !== "config/editeur.ts")
      .filter(({ texte }) => texte.includes(VENDEUR.nom))
      .map(({ chemin }) => chemin);
    expect(fautes).toEqual([]);
  });
});
