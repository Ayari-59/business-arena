import { ATELIERS } from "./ateliers";
import { ENTREPRISES, entrepriseDuScenario, NIVEAUX_DE_L_ARENE } from "./tarifs";

/**
 * LES ATELIERS QU'OUVRE UNE OFFRE CLASSE, POUR UNE ENTREPRISE ET UN NIVEAU (audit produit du
 * 28 octobre 2026, P1-4).
 *
 * L'offre Classe se paramètre à l'achat : une entreprise, un niveau. Sa carte promet « les
 * ateliers clés en main qui se jouent avec cette entreprise et ce niveau », et pour près d'une
 * combinaison sur deux il n'y en a aucun, même en adaptant un atelier d'un niveau (chaque fiche
 * a sa section « Adapter le niveau »). Le formulaire de devis le dit au moment du choix : les
 * ateliers écrits pour ce niveau, ceux qu'on adapte d'un niveau, ou aucun, et alors ce que la
 * classe a quand même (le cours, les parties de l'arène).
 *
 * Les ateliers de concours n'en sont pas : ils se jouent en concours, pas en partie de classe.
 */
export interface AtelierDeLaClasse {
  code: string;
  titre: string;
  /** Le niveau pour lequel la fiche est écrite. */
  niveau: number;
}

export interface AteliersDeLaClasse {
  /** Écrits pour ce niveau. */
  exacts: AtelierDeLaClasse[];
  /** Écrits un niveau au-dessus ou au-dessous : à adapter (section « Adapter le niveau »). */
  adaptables: AtelierDeLaClasse[];
}

export function ateliersDeLaClasse(entreprise: string, niveau: number): AteliersDeLaClasse {
  const r: AteliersDeLaClasse = { exacts: [], adaptables: [] };
  for (const a of ATELIERS) {
    if (a.reglages.concours || entrepriseDuScenario(a.reglages.scenarioCode) !== entreprise) continue;
    const ecart = Math.abs(a.reglages.niveau - niveau);
    const ligne = { code: a.code, titre: a.titre, niveau: a.reglages.niveau };
    if (ecart === 0) r.exacts.push(ligne);
    else if (ecart === 1) r.adaptables.push(ligne);
  }
  return r;
}

/** Toutes les combinaisons de l'offre Classe, « entreprise:niveau » → ses ateliers : la page du devis les passe au formulaire. */
export function ateliersParCombinaison(): Record<string, AteliersDeLaClasse> {
  const t: Record<string, AteliersDeLaClasse> = {};
  for (const e of ENTREPRISES)
    for (const { niveau } of NIVEAUX_DE_L_ARENE) t[`${e.code}:${niveau}`] = ateliersDeLaClasse(e.code, niveau);
  return t;
}
