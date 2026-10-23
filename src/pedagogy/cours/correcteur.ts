import { compteDuPlan, intituleDe, memeFamille } from "./plan-comptable";
import { auCentime, type Ecriture } from "./etats";

/**
 * LE CORRECTEUR D'ÉCRITURES.
 *
 * L'élève passe lui-même l'écriture. Le correcteur ne compare pas deux textes : il
 * vérifie ce qu'un professeur vérifie, dans l'ordre où il le fait. Chaque ligne a
 * un montant au débit OU au crédit ; l'écriture est équilibrée ; chaque rôle
 * attendu (« l'achat », « la TVA déductible », « la dette fournisseur ») est là,
 * du bon côté et pour le bon montant ; rien d'autre ne s'y est glissé.
 *
 * TOUTE FORME JUSTE EST ACCEPTÉE. Les lignes se saisissent dans n'importe quel
 * ordre, une ligne peut être coupée en deux sur le même compte, et un compte
 * voisin admis par le cours (215 pour 2154) passe, avec une note qui dit lequel
 * est le plus précis. Un compte de la bonne famille mais qui ne convient pas est
 * signalé comme tel : c'est la moitié du chemin, et l'élève doit le savoir.
 *
 * Le correcteur ne donne pas la réponse : il nomme ce qui ne va pas. La
 * correction se montre à part, quand l'élève la demande.
 */

export type Sens = "debit" | "credit";

export interface LigneAttendue {
  /** Ce que la ligne représente, en mots d'élève : « l'achat de matières », « la dette envers le fournisseur ». */
  role: string;
  compte: string;
  /** D'autres comptes que le cours admet pour ce rôle (une forme moins précise, mais juste). */
  acceptes?: readonly string[];
  sens: Sens;
  montant: number;
  /** Une piste pour le montant, sans le donner : « le montant hors taxes de la facture ». */
  indice: string;
}

export interface EcritureAttendue {
  date: string;
  libelle: string;
  lignes: readonly LigneAttendue[];
}

export interface LigneSaisie {
  compte: string;
  debit: string;
  credit: string;
}

export interface Correction {
  juste: boolean;
  /** Ce qui ne va pas, une phrase par point. */
  remarques: string[];
  /** Ce qui est accepté mais mérite d'être su (un compte moins précis). */
  notes: string[];
}

/** Un montant écrit à la française ou non : « 1 234,50 », « 1234.5 », « 1 234 € ». Vide : null. */
export function lireMontant(texte: string): number | null {
  const net = texte.replace(/[\s  €]/g, "").replace(",", ".");
  if (net === "") return null;
  if (!/^-?\d+(\.\d+)?$/.test(net)) return Number.NaN;
  return auCentime(Number(net));
}

const LE_SENS: Record<Sens, string> = { debit: "au débit", credit: "au crédit" };

/** L'écriture attendue sous la forme d'une écriture du journal. */
export function enEcriture(a: EcritureAttendue): Ecriture {
  return {
    date: a.date,
    libelle: a.libelle,
    lignes: a.lignes.map((l) => ({
      compte: l.compte,
      debit: l.sens === "debit" ? l.montant : 0,
      credit: l.sens === "credit" ? l.montant : 0,
    })),
  };
}

/** La correction, ligne à ligne, pour remplir le formulaire quand l'élève la demande. */
export function enSaisie(a: EcritureAttendue): LigneSaisie[] {
  const texte = (x: number) => x.toFixed(2).replace(".", ",").replace(/,00$/, "");
  return a.lignes.map((l) => ({
    compte: l.compte,
    debit: l.sens === "debit" ? texte(l.montant) : "",
    credit: l.sens === "credit" ? texte(l.montant) : "",
  }));
}

const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** « à » devant l'indice, contracté comme en français : au montant, aux cotisations, à la TVA. */
const aDevant = (indice: string) =>
  indice.startsWith("le ") ? `au ${indice.slice(3)}` : indice.startsWith("les ") ? `aux ${indice.slice(4)}` : `à ${indice}`;

export function corriger(saisie: readonly LigneSaisie[], attendue: EcritureAttendue): Correction {
  const remarques: string[] = [];
  const notes: string[] = [];
  const lignes = saisie
    .map((l, i) => ({ n: i + 1, compte: l.compte.trim(), debit: lireMontant(l.debit), credit: lireMontant(l.credit) }))
    .filter((l) => l.compte !== "" || l.debit !== null || l.credit !== null);

  if (lignes.length < 2) {
    return { juste: false, remarques: ["Une écriture compte au moins deux lignes : un débit et un crédit."], notes };
  }

  const admis = new Set(attendue.lignes.flatMap((a) => [a.compte, ...(a.acceptes ?? [])]));
  let formeValide = true;
  for (const l of lignes) {
    if (l.compte === "") {
      remarques.push(`Ligne ${l.n} : il manque le numéro de compte.`);
      formeValide = false;
    } else if (!compteDuPlan(l.compte) && !admis.has(l.compte)) {
      remarques.push(`Ligne ${l.n} : le compte ${l.compte} n'est pas au plan de comptes du cours.`);
      formeValide = false;
    }
    if (Number.isNaN(l.debit) || Number.isNaN(l.credit)) {
      remarques.push(`Ligne ${l.n} : un montant ne se lit pas comme un nombre.`);
      formeValide = false;
    } else if ((l.debit ?? 0) !== 0 && (l.credit ?? 0) !== 0) {
      remarques.push(`Ligne ${l.n} : un montant au débit OU au crédit, pas les deux.`);
      formeValide = false;
    } else if (!l.debit && !l.credit) {
      remarques.push(`Ligne ${l.n} : il manque le montant.`);
      formeValide = false;
    } else if ((l.debit ?? 0) < 0 || (l.credit ?? 0) < 0) {
      remarques.push(`Ligne ${l.n} : un montant ne s'écrit pas en négatif ; on change de côté.`);
      formeValide = false;
    }
  }
  if (!formeValide) return { juste: false, remarques, notes };

  const debit = auCentime(lignes.reduce((s, l) => s + (l.debit ?? 0), 0));
  const credit = auCentime(lignes.reduce((s, l) => s + (l.credit ?? 0), 0));
  if (debit !== credit) {
    remarques.push(
      `L'écriture n'est pas équilibrée : ${montantEcrit(debit)} au débit, ${montantEcrit(credit)} au crédit. En partie double, les deux totaux sont égaux.`,
    );
  }

  const utilisees = new Set<number>();
  for (const a of attendue.lignes) {
    const comptes = new Set([a.compte, ...(a.acceptes ?? [])]);
    const siennes = lignes.filter((l) => comptes.has(l.compte) && !utilisees.has(l.n));
    if (siennes.length === 0) {
      const voisine = lignes.find((l) => !utilisees.has(l.n) && memeFamille(l.compte, a.compte) && !admis.has(l.compte));
      if (voisine) {
        utilisees.add(voisine.n);
        remarques.push(
          `${majuscule(a.role)} : le compte ${voisine.compte} (${intituleDe(voisine.compte)}) est de la bonne famille, mais ce n'est pas celui qui convient ici.`,
        );
      } else {
        remarques.push(`Il manque ${a.role}.`);
      }
      continue;
    }
    for (const l of siennes) utilisees.add(l.n);
    const auDebit = auCentime(siennes.reduce((s, l) => s + (l.debit ?? 0), 0));
    const auCredit = auCentime(siennes.reduce((s, l) => s + (l.credit ?? 0), 0));
    const duBonCote = a.sens === "debit" ? auDebit : auCredit;
    const duMauvais = a.sens === "debit" ? auCredit : auDebit;
    if (duMauvais !== 0) {
      remarques.push(`${majuscule(a.role)} se passe ${LE_SENS[a.sens]}.`);
    } else if (Math.abs(duBonCote - a.montant) > 0.005) {
      remarques.push(`${majuscule(a.role)} : le montant ne convient pas. Pensez ${aDevant(a.indice)}.`);
    }
    const autre = siennes.find((l) => l.compte !== a.compte);
    if (autre) {
      notes.push(
        `Le compte ${autre.compte} est accepté pour ${a.role}. Le compte ${a.compte} (${intituleDe(a.compte)}) est plus précis.`,
      );
    }
  }
  for (const l of lignes) {
    if (!utilisees.has(l.n)) {
      remarques.push(`La ligne du compte ${l.compte} (${intituleDe(l.compte)}) n'a pas sa place dans cette écriture.`);
    }
  }
  return { juste: remarques.length === 0, remarques, notes: remarques.length === 0 ? notes : [] };
}

/** Un montant dans une phrase de correction. */
export function montantEcrit(x: number): string {
  return `${x.toLocaleString("fr-FR", { minimumFractionDigits: Number.isInteger(x) ? 0 : 2, maximumFractionDigits: 2 })} €`;
}
