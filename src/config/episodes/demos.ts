import { NIVEAUX, type CodeNiveau } from "./niveaux";

/**
 * LES ÉPISODES DE DÉMONSTRATION : CE QUI SE JOUE SANS LICENCE.
 *
 * Décision du propriétaire (octobre 2026), avec la grille tarifaire : la Découverte
 * gratuite comprend un épisode de démonstration PAR MÉTIER ; tous les autres se vendent à
 * part, sur devis (l'offre Épisodes manager, config/tarifs.ts), et ne sont PAS inclus dans
 * les offres de l'arène. Sans licence qui inclut les épisodes, seuls ceux-ci se lancent,
 * et au niveau Découverte. Les autres restent visibles au catalogue (titre, accroche,
 * métier), marqués du nom de l'offre, avec le lien vers les tarifs.
 *
 * LA VALEUR PAR DÉFAUT de la Découverte, désormais réglable dans /admin/offres
 * (config/decouverte.ts, migration 0041) : la règle serveur lit le réglage
 * (services/acces.service.ts, `accesAuxEpisodes` le porte jusqu'aux pages). Un test garde
 * la règle « un par métier, tous connus, tous jouables en Découverte » pour ce défaut.
 *
 * Le choix, validé par le propriétaire, métier par métier : une situation que tout
 * manager reconnaît sans connaître le métier, et qui montre ce que le bilan apporte
 * (une décision qui soulage tout de suite et coûte plus tard) :
 *  · négoce (Arvel Distribution) : le client qui s'en va, la fidélisation ; c'est aussi
 *    l'un des deux épisodes du bilan d'entrée du profil ;
 *  · hôtellerie (Groupe Escale) : la brigade à bout, une équipe sous tension ;
 *  · conseil (Atlas Conseil) : le client qui en demande toujours plus, tenir le
 *    périmètre d'une mission ;
 *  · santé (Association Solvanne) : les lits qui restent vides, piloter les admissions ;
 *  · agroalimentaire (Laiterie de Kerbrélan) : la promotion qui remplit les caddies,
 *    le volume contre la marge.
 */
export const EPISODES_DE_DEMO = [
  "client-qui-s-en-va",
  "brigade-a-bout",
  "client-qui-en-demande-plus",
  "lits-vides",
  "promotion-qui-coute",
] as const;

/** Le seul niveau d'une démonstration sans licence. */
export const NIVEAU_DES_DEMOS: CodeNiveau = "decouverte";

export const estUneDemo = (code: string): boolean =>
  (EPISODES_DE_DEMO as readonly string[]).includes(code);

/** La marque d'une démonstration au catalogue. */
export const MARQUE_DEMO = "Démo gratuite";

/*
 * Le nom de l'offre qui ouvre les autres épisodes, et les phrases qui la nomment, vivent
 * dans config/tarifs.ts (`MARQUE_DES_EPISODES`, `POURQUOI_LA_DECOUVERTE`) : une seule
 * source de noms. Ce module-ci est lu par des composants clients et n'importe rien de lourd.
 */

/* ---------------------------------------------------------------------------
 * CE QUI SE LANCE. La licence est établie côté serveur (services/acces.service.ts) ;
 * ce qu'elle ouvre se décide ici, sans base, pour l'écran comme pour le serveur.
 * ------------------------------------------------------------------------- */

export interface AccesAuxEpisodes {
  /** Une licence en cours qui inclut les épisodes couvre-t-elle cette personne ? */
  licence: boolean;
  /**
   * Les démonstrations de la Découverte, telles que /admin/offres les règle (catalogue,
   * clé « decouverte ») ; absentes : `EPISODES_DE_DEMO`. Et le niveau où elles se jouent.
   */
  demos?: readonly string[];
  niveauDesDemos?: CodeNiveau;
  /** D'où elle vient : la cohorte (l'organisation de son animateur) ou le compte. */
  source: "cohorte" | "compte" | null;
  /**
   * La cohorte d'un enseignant ne prête sa licence qu'aux épisodes qu'il y a mis
   * (colonne `episode_cohortes.episodes`). Absent : la licence vaut pour tous, celle d'un
   * compte ou d'une cohorte de l'administration. Hors de cette liste, la règle sans
   * licence s'applique : les démonstrations, en Découverte.
   */
  episodes?: readonly string[];
}

/** La licence couvre-t-elle cet épisode-ci ? */
export const licencePourLEpisode = (acces: AccesAuxEpisodes, code: string): boolean =>
  acces.licence && (!acces.episodes || acces.episodes.includes(code));

/** Cet épisode est-il une démonstration de la Découverte (réglée, ou par défaut) ? */
export const estUneDemoPour = (acces: Pick<AccesAuxEpisodes, "demos">, code: string): boolean =>
  acces.demos ? acces.demos.includes(code) : estUneDemo(code);

/** Les niveaux auxquels cet épisode se lance ; vide : il ne se lance pas. */
export function niveauxDeLEpisode(acces: AccesAuxEpisodes, code: string): readonly CodeNiveau[] {
  if (licencePourLEpisode(acces, code)) return NIVEAUX.map((n) => n.code);
  return estUneDemoPour(acces, code) ? [acces.niveauDesDemos ?? NIVEAU_DES_DEMOS] : [];
}

/** Cet épisode se lance-t-il, à ce niveau s'il est donné ? */
export function episodeOuvert(acces: AccesAuxEpisodes, code: string, niveau?: CodeNiveau): boolean {
  const niveaux = niveauxDeLEpisode(acces, code);
  return niveau === undefined ? niveaux.length > 0 : niveaux.includes(niveau);
}
