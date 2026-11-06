import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { CelluleACompleter, TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { EtapeDeClassement } from "../bureaux/types";

/**
 * UNE ENQUÊTE SUR UN DOCUMENT DE SYNTHÈSE (un bilan fonctionnel, des comptes annuels, un tableau des
 * flux), ajout générique au format « enquête » (novembre 2026).
 *
 * Le prototype (la-cloture-du-stagiaire.ts) contrôle des écritures : l'élève les trie, puis passe
 * l'écriture juste de chaque fausse. Un document de synthèse ne se rectifie pas par une écriture : il se
 * rectifie ligne par ligne, par un montant. Le moteur du bureau suffit, sans rien y changer :
 *   1. LE CONTRÔLE, une étape de classement : chaque ligne du dossier se range « Juste », ou dans la
 *      raison de son erreur (les vraies raisons et des leurres). Le verdict et la raison se donnent d'un
 *      seul geste : une étape de raisons à part trahirait au navigateur les lignes fausses, puisque la
 *      page sert toutes les étapes d'un coup ;
 *   2. LES MONTANTS JUSTES, une étape d'état : chaque ligne, avec le montant du dossier en regard, et le
 *      montant juste à saisir pour TOUTES les lignes (les justes comprises : une case à saisir ne dit rien
 *      de la ligne), puis l'effet des erreurs ;
 *   3. la réponse au commanditaire, comme au bureau.
 * Ce module ne sert que de fabrique : les chiffres viennent du monde du cours, ligne par ligne.
 */

/** Un montant écrit à la française, le signe moins typographique. */
export const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
/** Un nombre écrit à la française, au centième au plus. */
export const nombre = (x: number, chiffres = 2) => (x + 0).toLocaleString("fr-FR", { maximumFractionDigits: chiffres }).replace(/^-/, "−");
/** Une fraction écrite en pour cent : « 27,1 % ». */
export const pct = (t: number, chiffres = 2) => `${nombre(Math.round(t * 10_000) / 100, chiffres)} %`;
/** Un terme d'une somme : « + 4 500 € » ou « − 34 500 € ». */
export const terme = (x: number) => (x < 0 ? `− ${eur(-x)}` : `+ ${eur(x)}`);

/** Une ligne d'un dossier à contrôler : ce que le dossier porte, ce qui est juste, et pourquoi. */
export interface LigneDuDossier {
  code: string;
  /** Ce que l'élève lit : « Bilan, immobilisations corporelles, en net ». */
  libelle: string;
  /** La pièce du dossier où la ligne se lit, quand elle en a une. */
  piece?: string;
  /** Le montant du dossier. */
  dossier: number;
  /** Le montant juste. */
  juste: number;
  /** La raison de l'erreur, parmi celles de l'étape ; null : la ligne est juste. */
  raison: string | null;
  /** Ce que l'élève lit, le contrôle réussi. */
  pourquoi: string;
  /** Comment le montant juste se calcule, et une piste sans la réponse (pour la grille des montants justes). */
  calcul?: string;
  indice?: string;
  /** L'unité d'un montant qui n'est pas en euros (« fois », « jours », « % »). */
  unite?: string;
  /** L'écart admis à la saisie (le centime par défaut). */
  tolerance?: number;
}

/** La catégorie des lignes justes. */
export const JUSTE = { code: "juste", libelle: "Juste" } as const;

/** Le contrôle : chaque ligne, juste ou rangée dans la raison de son erreur. */
export function etapeDuControle(e: {
  id: string;
  titre: string;
  consigne: string;
  pieces: readonly string[];
  raisons: readonly { code: string; libelle: string }[];
  lignes: readonly LigneDuDossier[];
  explication: readonly string[];
  /** Montrer le montant du dossier à côté de la ligne (des euros seulement). */
  montants?: boolean;
}): EtapeDeClassement {
  return {
    id: e.id,
    type: "classement",
    titre: e.titre,
    consigne: e.consigne,
    pieces: e.pieces,
    categories: [JUSTE, ...e.raisons],
    elements: e.lignes.map((l) => ({
      code: l.code,
      libelle: l.libelle,
      ...(e.montants !== false && !l.unite ? { montant: l.dossier } : {}),
      ...(l.piece ? { piece: l.piece } : {}),
      categorie: l.raison ?? JUSTE.code,
      pourquoi: l.pourquoi,
    })),
    explication: e.explication,
  };
}

const donnee = (valeur: number, unite?: string): CelluleACompleter => ({ valeur, ...(unite ? { unite } : {}) });
const aSaisir = (l: LigneDuDossier): CelluleACompleter => ({
  valeur: l.juste,
  saisir: true,
  ...(l.calcul ? { calcul: l.calcul } : {}),
  ...(l.indice ? { indice: l.indice } : {}),
  ...(l.unite ? { unite: l.unite } : {}),
  ...(l.tolerance !== undefined ? { tolerance: l.tolerance } : {}),
});

/** Les montants justes : le dossier en regard, le montant juste à saisir, ligne par ligne. */
export function grilleDesMontantsJustes(titre: string, lignes: readonly LigneDuDossier[], colonnes: readonly [string, string] = ["Le dossier", "Le montant juste"]): TableauACompleter {
  return {
    titre,
    colonnes,
    lignes: lignes.map((l) => ({ libelle: l.libelle, cellules: [donnee(l.dossier, l.unite), aSaisir(l)] })),
  };
}

/** Une ligne juste ou fausse, une fois les erreurs nommées : les lignes fausses du dossier. */
export const lignesFausses = (lignes: readonly LigneDuDossier[]) => lignes.filter((l) => l.raison !== null);
