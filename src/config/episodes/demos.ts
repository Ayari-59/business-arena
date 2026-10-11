import { NIVEAUX, type CodeNiveau } from "./niveaux";

/**
 * LES ÉPISODES DE DÉMONSTRATION : CE QUI SE JOUE SANS LICENCE.
 *
 * Décision du propriétaire (octobre 2026), avec la grille tarifaire : la Découverte
 * gratuite comprend un épisode de démonstration PAR MÉTIER ; tous les autres sont
 * inclus dans l'offre Entreprise. Sans licence, seuls ceux-ci se lancent, et au niveau
 * Découverte. Les autres restent visibles au catalogue (titre, accroche, métier),
 * marqués « Offre Entreprise », avec le lien vers les tarifs.
 *
 * UNE SEULE SOURCE, facile à changer : la page des épisodes, la page de jeu, le profil
 * et la recommandation la lisent. Un test garde la règle « un par métier, tous connus,
 * tous jouables en Découverte ».
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

/** La marque d'un épisode fermé sans licence, et l'offre qui l'ouvre. */
export const OFFRE_DES_EPISODES = "Offre Entreprise";

/**
 * Le niveau conseillé sans licence : la démonstration ne se joue qu'en Découverte, et
 * le profil ne compte pas la Découverte. Le conseil le dit plutôt que de proposer un
 * niveau qui ne se lance pas.
 */
export const CONSEIL_SANS_LICENCE: { niveau: CodeNiveau; pourquoi: string } = {
  niveau: NIVEAU_DES_DEMOS,
  pourquoi:
    "Sans licence, les démonstrations se jouent en Découverte, qui ne compte pas dans le profil. Les niveaux Standard et Expert, qui le construisent, sont inclus dans l'offre Entreprise.",
};

/** Ce qu'apporte l'offre Entreprise, pour qui joue sans licence. `total` : les épisodes du registre. */
export const ceQuApporteLOffre = (total: number): string =>
  `L'offre Entreprise ouvre les ${total} épisodes, aux niveaux Standard et Expert, et le profil décisionnel qu'ils construisent.`;

/* ---------------------------------------------------------------------------
 * CE QUI SE LANCE. La licence est établie côté serveur (services/acces.service.ts) ;
 * ce qu'elle ouvre se décide ici, sans base, pour l'écran comme pour le serveur.
 * ------------------------------------------------------------------------- */

export interface AccesAuxEpisodes {
  /** Une licence en cours couvre-t-elle cette personne ? */
  licence: boolean;
  /** D'où elle vient : la cohorte (l'organisation de son animateur) ou le compte. */
  source: "cohorte" | "compte" | null;
}

/** Les niveaux auxquels cet épisode se lance ; vide : il ne se lance pas. */
export function niveauxDeLEpisode(acces: AccesAuxEpisodes, code: string): readonly CodeNiveau[] {
  if (acces.licence) return NIVEAUX.map((n) => n.code);
  return estUneDemo(code) ? [NIVEAU_DES_DEMOS] : [];
}

/** Cet épisode se lance-t-il, à ce niveau s'il est donné ? */
export function episodeOuvert(acces: AccesAuxEpisodes, code: string, niveau?: CodeNiveau): boolean {
  const niveaux = niveauxDeLEpisode(acces, code);
  return niveau === undefined ? niveaux.length > 0 : niveaux.includes(niveau);
}
