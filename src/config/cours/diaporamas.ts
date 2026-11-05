/**
 * LES CHAPITRES QUI ONT LEUR DIAPORAMA (décision du propriétaire, novembre 2026) : un PowerPoint
 * fabriqué à la demande à partir des données du chapitre, que l'enseignant projette en classe
 * (pedagogy/cours/diaporama.ts). Le générateur vaut pour tout chapitre ; le bouton ne paraît, et la
 * route ne répond, que pour les chapitres de cette liste. Un prototype pour l'instant.
 *
 * Ce fichier ne porte que des codes : il peut être lu partout, le générateur reste au serveur.
 */
export const CHAPITRES_AU_DIAPORAMA: readonly string[] = ["fournisseurs-et-banque"];

/** Le chapitre a-t-il son diaporama ? */
export const aSonDiaporama = (chapitre: string) => CHAPITRES_AU_DIAPORAMA.includes(chapitre);

/** L'adresse du diaporama d'un chapitre (app/cours/[chapitre]/diaporama/route.ts). */
export const lienDuDiaporama = (chapitre: string) => `/cours/${chapitre}/diaporama`;

/** Le nom du fichier téléchargé : le code du chapitre, qui n'a que des lettres, des chiffres et des tirets. */
export const fichierDuDiaporama = (chapitre: string) => `diaporama-${chapitre.replace(/[^a-z0-9-]/g, "")}.pptx`;

/** Le type d'un fichier PowerPoint. */
export const TYPE_PPTX = "application/vnd.openxmlformats-officedocument.presentationml.presentation";
