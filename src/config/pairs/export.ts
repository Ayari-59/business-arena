import { cellule } from "@/config/examen/export";
import { IDENTIFICATIONS_DES_MEMBRES, NOMS_DES_MOMENTS, type Bareme, type CritereDesPairs, type IdentificationDuMembre, type MomentDesPairs } from "./criteres";
import { PHRASES_DES_REGLES, phraseDuSignal, type ResultatDuMembre } from "./calcul";

/**
 * L'EXPORT DE L'ÉVALUATION ENTRE COÉQUIPIERS, EN TABLEUR.
 *
 * Comme le relevé d'une partie et l'export d'un examen : point-virgule, virgule décimale,
 * signature d'octets en tête (les accents dans Excel), cellules protégées contre
 * l'injection de formule, nom de fichier en ASCII, daté au jour de Paris. Une ligne par
 * étudiant et par moment. Ni adresse électronique ni commentaire : les commentaires se
 * lisent sur la page de l'enseignant, avec leur auteur, et ne quittent pas l'application.
 */

export interface LigneExportee {
  equipe: string;
  nom: string;
  identification: IdentificationDuMembre;
  moment: MomentDesPairs;
  resultat: ResultatDuMembre;
  noteDEquipe: number | null;
  noteIndividuelle: number | null;
}

const sansAccents = (texte: string) =>
  texte
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

/** « coequipiers-nova-seconde-3-2026-10-12.csv » : ASCII seul, daté au jour de Paris. */
export function nomDuFichierDesPairs(partie: string, le: Date): string {
  const jour = le.toLocaleDateString("fr-CA", { timeZone: "Europe/Paris" });
  const nom = sansAccents(partie).slice(0, 40) || "partie";
  return `coequipiers-${nom}-${jour}.csv`;
}

export function csvDesPairs(args: {
  partie: string;
  criteres: readonly CritereDesPairs[];
  bareme: Bareme;
  lignes: readonly LigneExportee[];
  le: Date;
}): { nom: string; contenu: string } {
  const entete = [
    "Équipe",
    "Étudiant",
    "Identification",
    "Moment",
    "A répondu",
    "Évaluateurs",
    ...args.criteres.map((c) => `${c.libelle} (moyenne des pairs, sur 5)`),
    "Moyenne des pairs (sur 5)",
    "Auto-évaluation (sur 5)",
    "Facteur brut",
    "Facteur retenu",
    `Note d'équipe (sur ${args.bareme})`,
    `Note individuelle (sur ${args.bareme})`,
    "Signaux",
  ];
  const lignes = [entete.map(cellule).join(";")];
  for (const l of args.lignes) {
    const r = l.resultat;
    const remarques = [PHRASES_DES_REGLES[r.regle], ...r.signaux.map(phraseDuSignal)].filter(Boolean).join(" · ");
    lignes.push(
      [
        cellule(l.equipe),
        cellule(l.nom),
        cellule(IDENTIFICATIONS_DES_MEMBRES[l.identification]),
        cellule(NOMS_DES_MOMENTS[l.moment]),
        cellule(r.aRepondu ? "oui" : "non"),
        cellule(r.evaluateurs),
        ...args.criteres.map((c) => cellule(r.moyennes[c.code] ?? null)),
        cellule(r.moyenne),
        cellule(r.autoMoyenne),
        cellule(r.facteurBrut),
        cellule(r.facteur),
        cellule(l.noteDEquipe),
        cellule(l.noteIndividuelle),
        cellule(remarques || null),
      ].join(";"),
    );
  }
  return { nom: nomDuFichierDesPairs(args.partie, args.le), contenu: `﻿${lignes.join("\r\n")}\r\n` };
}
