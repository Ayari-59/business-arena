/**
 * LES GUIDES DE PRISE EN MAIN : CE QU'UN GUIDE DÉCLARE.
 *
 * Un guide par public, une page par guide (/guides/<public>), et la même source pour
 * la page, la version imprimée et les captures. Le script des captures
 * (scripts/captures-des-guides.mts) lit les repères déclarés ici et les dessine sur
 * l'écran réel avant de le photographier : un repère qui change de place dans
 * l'interface suit tout seul à la prochaine génération.
 *
 * LA PROSE NE PORTE AUCUN CHIFFRE. Ce qui se compte (niveaux, épisodes, offres) entre
 * par un jeton `{{nom}}`, résolu au rendu depuis la configuration ou le catalogue
 * (config/guides/jetons.ts). Une garde refuse tout chiffre et tout prix dans le texte
 * brut, et tout jeton inconnu.
 *
 * LES GUILLEMETS SONT RÉSERVÉS AUX LIBELLÉS DE L'ÉCRAN. Ce qui s'écrit entre « » est
 * ce que l'utilisateur lit sur un bouton, un onglet ou un titre, au caractère près :
 * une garde le cherche dans src/ et échoue s'il n'y est plus.
 */

export type PublicDuGuide = "enseignant" | "etudiant" | "etablissement" | "formateur";

/** Un repère numéroté posé sur une capture : un cadre autour d'un élément réel. */
export interface Repere {
  /** Le sélecteur Playwright de l'élément à encadrer, sur l'écran capturé. */
  cible: string;
  /** Ce que le repère montre, en une phrase courte. */
  legende: string;
}

/** Une capture réelle d'écran, photographiée par le script sur une base neuve. */
export interface CaptureDEtape {
  /** Le nom du fichier, sans extension : public/guides/<public>/<fichier>.webp. */
  fichier: string;
  /** Les dimensions de l'image pleine (la version réduite garde le même rapport). */
  largeur: number;
  hauteur: number;
  /** Ce que montre l'image, pour qui ne la voit pas. */
  alt: string;
  reperes: Repere[];
}

export interface LienDuGuide {
  href: string;
  libelle: string;
}

/** Une étape, dans l'ordre réel du parcours. */
export interface EtapeDuGuide {
  /** L'ancre de l'étape (#<id>) et la clé de sa capture dans le script. */
  id: string;
  titre: string;
  /** Ce qu'on fait, geste par geste. */
  faire: string[];
  /** Ce qu'on voit quand c'est fait. */
  voir: string;
  /** L'erreur que l'on commet le plus souvent à cette étape, et sa parade. */
  erreur: string;
  capture: CaptureDEtape;
  /** Une page du site qui en dit plus, si elle existe. */
  lien?: LienDuGuide;
  /** Une étape longue commence une nouvelle page à l'impression. */
  sautDePage?: boolean;
}

export interface QuestionFrequente {
  question: string;
  reponse: string;
  lien?: LienDuGuide;
}

export interface PisteDuGuide {
  titre: string;
  texte: string;
  lien: LienDuGuide;
}

/**
 * LES FONCTIONS QUI NE SONT PAS ENCORE EN LIGNE, ET OÙ ELLES ENTRERONT.
 *
 * Un guide ne décrit jamais une fonction absente ; il garde la place où elle s'ajoutera,
 * et une garde vérifie que l'étape d'ancrage existe toujours. Le tour d'essai,
 * l'évaluation entre coéquipiers et le retour des notes dans Moodle sont en ligne et
 * décrits : la liste est vide aujourd'hui, et le mécanisme reste pour la prochaine.
 */
export type FonctionAVenir = never;

export interface EmplacementAVenir {
  fonction: FonctionAVenir;
  /** L'étape après laquelle la nouvelle étape s'insérera (ou dans laquelle, voir `forme`). */
  apres: string;
  forme: "etape" | "question" | "paragraphe";
  /** Ce que l'étape dira, en une phrase, pour qui la rédigera. */
  note: string;
}

export interface Guide {
  public: PublicDuGuide;
  /** Le nom court du public : « Enseignant », « Étudiant »… */
  nomDuPublic: string;
  /** Le titre de la page et de l'impression. */
  titre: string;
  /** Le surtitre de l'en-tête : « Guide de l'enseignant ». */
  surtitre: string;
  /** Le chapeau. */
  chapeau: string;
  /** La description des moteurs de recherche. */
  description: string;
  /** À qui c'est, pour la carte de /guides. */
  pourQui: string;
  /** Ce qu'on sait faire à la fin, pour la carte de /guides. */
  resultat: string;
  /** La date de la version (AAAA-MM-JJ), imprimée en pied de page. */
  version: string;
  /** « En 5 minutes » : le chemin le plus court jusqu'au premier résultat. */
  enCinqMinutes: string[];
  etapes: EtapeDuGuide[];
  plusLoin: PisteDuGuide[];
  faq: QuestionFrequente[];
  aVenir: EmplacementAVenir[];
}
