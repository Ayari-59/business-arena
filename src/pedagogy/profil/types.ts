import type { PartieJouee } from "@/config/episodes/types";

/** Une partie telle qu'elle a été enregistrée : les faits bruts, sa date et la version du modèle. */
export interface PartieEnregistree {
  id: string;
  code: string;
  versionModele: number;
  /** ISO 8601. */
  date: string;
  /** La première partie de cet épisode pour cette personne, au moment de l'enregistrer. */
  premiere: boolean;
  partie: PartieJouee;
}
