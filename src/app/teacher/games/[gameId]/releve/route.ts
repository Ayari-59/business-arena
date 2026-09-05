import { getSession } from "@/lib/session";
import { getGameGradeSheet } from "@/services/pedagogy.service";

/**
 * Le relevé de notes en tableur, une ligne par élève.
 *
 * Une ligne par ÉQUIPE serait plus proche de la façon dont le travail se fait,
 * mais l'enseignant saisit ses notes élève par élève. Le fichier est donc
 * écrit pour être collé dans un logiciel de notes sans retouche : chaque élève
 * porte la note de son équipe, et les colonnes qui expliquent cette note
 * suivent. Une équipe restée sans joueur apparaît quand même, avec une cellule
 * élève vide : rien ne doit disparaître d'un relevé.
 *
 * Point-virgule et virgule décimale : c'est ce qu'attend un tableur configuré
 * en français, et une note « 14.5 » y deviendrait du texte. La signature
 * d'octets en tête est ce qui fait lire les accents correctement à Excel.
 */

const COLONNES = [
  "Élève",
  "Équipe",
  "Situations rendues",
  "Non rendues",
  "Note sur 20",
  "Diagnostic %",
  "Questions %",
  "Indices ouverts",
  "Points perdus en indices",
  "Rang",
  "Score composite",
  "Résultat cumulé €",
  "Source des décisions (dernier tour)",
] as const;

/** Une cellule de tableur : décimale à la française, guillemets échappés. */
function cellule(valeur: string | number | null): string {
  if (valeur === null) return "";
  let texte =
    typeof valeur === "number"
      ? (Math.round(valeur * 100) / 100).toString().replace(".", ",")
      : valeur;
  // Anti-injection de formule : une cellule TEXTE commençant par = + - @ (ou
  // tabulation/retour chariot) est exécutée comme une formule par Excel /
  // LibreOffice à l'ouverture. Le pseudo élève et le nom d'équipe sont libres —
  // on neutralise en préfixant d'une apostrophe. On ne touche PAS aux nombres :
  // un résultat négatif garde son « - » et reste un nombre.
  if (typeof valeur === "string" && /^[=+\-@\t\r]/.test(texte)) {
    texte = `'${texte}`;
  }
  return /[";\n]/.test(texte) ? `"${texte.replace(/"/g, '""')}"` : texte;
}

const pourcent = (part: number | null) => (part === null ? null : Math.round(part * 100));

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ gameId: string }> },
) {
  const session = await getSession();
  if (!session) return new Response("Connexion requise.", { status: 401 });

  const { gameId } = await params;
  const releve = await getGameGradeSheet(gameId, session.userId);
  // Une partie qui n'est pas la sienne se lit comme une partie qui n'existe
  // pas : le service ne dit pas non plus laquelle des deux.
  if (!releve) return new Response("Partie introuvable.", { status: 404 });

  const lignes = [COLONNES.join(";")];
  for (const equipe of releve.teams) {
    const eleves = equipe.students.length > 0 ? equipe.students : [""];
    for (const eleve of eleves) {
      lignes.push(
        [
          cellule(eleve),
          cellule(equipe.name),
          cellule(equipe.answered),
          cellule(equipe.unanswered),
          cellule(equipe.note),
          cellule(pourcent(equipe.diagnosisAverage)),
          cellule(pourcent(equipe.quizAverage)),
          cellule(equipe.hintsUsed),
          cellule(equipe.hintPenalty),
          cellule(equipe.rank),
          cellule(equipe.bpi),
          cellule(equipe.cumulativeNetIncome === null ? null : Math.round(equipe.cumulativeNetIncome)),
          cellule(equipe.lastDecisionSourceLabel),
        ].join(";"),
      );
    }
  }

  /**
   * Le nom du fichier, en ASCII et rien d'autre.
   *
   * Deux fautes se suivent ici, et la seconde n'était pas celle qu'on croit.
   * Un accent posé tel quel dans l'en-tête est invalide : le navigateur
   * abandonne alors le nom ENTIER et enregistre « download », sans extension.
   * La correction évidente, ajouter la forme encodée `filename*` prévue pour
   * cela, produit exactement le même résultat : ce Chromium n'accepte cette
   * forme que si sa valeur décodée est déjà de l'ASCII, et retombe sinon sur
   * « download » en ignorant aussi le repli. Vérifié cas par cas.
   *
   * On s'en tient donc à un seul nom, sans accents, que tous les navigateurs
   * savent lire. Le code d'invitation le termine : sans lui, trois classes du
   * même secteur donneraient trois fichiers de même nom.
   */
  const sansAccents = (texte: string) =>
    texte
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^A-Za-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();
  const nom = `releve-${sansAccents(releve.scenarioTitle)}${
    releve.joinCode ? `-${sansAccents(releve.joinCode)}` : ""
  }.csv`;

  return new Response(`﻿${lignes.join("\r\n")}\r\n`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${nom}"`,
      "cache-control": "no-store",
    },
  });
}
