import { competencesEvaluees, nomDuNiveau, type NiveauDeCompetence } from "./competences";
import { IDENTIFICATIONS, ETATS_DE_LA_COPIE, type EtatDeLaCopie, type Identification } from "./textes";

/**
 * L'EXPORT DES RÉSULTATS D'UN EXAMEN, EN TABLEUR.
 *
 * Comme le relevé de notes d'une partie de classe (teacher/games/[gameId]/releve) :
 * point-virgule, virgule décimale, signature d'octets en tête (les accents dans Excel),
 * cellules texte protégées contre l'injection de formule, nom de fichier en ASCII, daté.
 * Une ligne par copie, la retenue marquée ; une colonne par ligne de la grille et par
 * compétence évaluée. Rien d'autre que les copies de CET examen : la fonction ne reçoit
 * que lui.
 */

export interface CopieExportee {
  nom: string;
  numeroEtudiant: string | null;
  identification: Identification;
  tentative: number;
  retenue: boolean;
  etat: EtatDeLaCopie;
  commenceLe: Date;
  remisLe: Date | null;
  dureeMinutes: number;
  note: number | null;
  rang: number | null;
  lignes: { code: string; points: number }[];
  competences: { code: string; part: number; niveau: NiveauDeCompetence }[];
}

/** Une cellule de tableur : décimale à la française, guillemets échappés, formules neutralisées. */
export function cellule(valeur: string | number | null): string {
  if (valeur === null) return "";
  let texte = typeof valeur === "number" ? (Math.round(valeur * 100) / 100).toString().replace(".", ",") : valeur;
  if (typeof valeur === "string" && /^[=+\-@\t\r]/.test(texte)) texte = `'${texte}`;
  return /[";\n\r]/.test(texte) ? `"${texte.replace(/"/g, '""')}"` : texte;
}

const horodatage = (d: Date | null) =>
  d
    ? d.toLocaleString("fr-FR", {
        timeZone: "Europe/Paris",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

const sansAccents = (texte: string) =>
  texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

/** « examen-gestion-l2-ex-k7m2pr-2026-10-12.csv » : ASCII seul, daté au jour de Paris. */
export function nomDuFichier(examen: { nom: string; code: string }, le: Date): string {
  const jour = le.toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
  return `examen-${sansAccents(examen.nom).slice(0, 40)}-${sansAccents(examen.code)}-${jour}.csv`;
}

export function csvDeLExamen(args: {
  examen: { nom: string; code: string; questions: boolean };
  lignesDeLaGrille: readonly { code: string; libelle: string }[];
  copies: readonly CopieExportee[];
  le: Date;
}): { nom: string; contenu: string } {
  const competences = competencesEvaluees(args.examen.questions);
  const entete = [
    "Candidat",
    "Numéro d'étudiant",
    "Identification",
    "Tentative",
    "Copie retenue",
    "État",
    "Commencée le",
    "Remise le",
    "Durée (min)",
    "Note sur 100",
    "Rang",
    ...args.lignesDeLaGrille.map((l) => `${l.libelle} (points)`),
    ...competences.flatMap((c) => [`${c.nom} %`, `${c.nom} niveau`]),
  ];
  const lignes = [entete.map(cellule).join(";")];
  for (const c of args.copies) {
    lignes.push(
      [
        cellule(c.nom),
        cellule(c.numeroEtudiant),
        cellule(IDENTIFICATIONS[c.identification]),
        cellule(c.tentative),
        cellule(c.retenue ? "oui" : "non"),
        cellule(ETATS_DE_LA_COPIE[c.etat]),
        cellule(horodatage(c.commenceLe)),
        cellule(horodatage(c.remisLe)),
        cellule(c.dureeMinutes),
        cellule(c.note),
        cellule(c.rang),
        ...args.lignesDeLaGrille.map((l) => cellule(c.lignes.find((x) => x.code === l.code)?.points ?? null)),
        ...competences.flatMap((comp) => {
          const x = c.competences.find((y) => y.code === comp.code);
          return [cellule(x ? Math.round(x.part * 100) : null), cellule(x ? nomDuNiveau(x.niveau) : null)];
        }),
      ].join(";"),
    );
  }
  return { nom: nomDuFichier(args.examen, args.le), contenu: `﻿${lignes.join("\r\n")}\r\n` };
}
