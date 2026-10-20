/**
 * LE FINANCEMENT DE SAUVETAGE.
 *
 * Quand un tour s'achève en cessation de paiements — découvert au-delà du
 * plafond et plus une créance à céder —, le tour suivant ne peut pas se jouer
 * comme si de rien n'était. Jusqu'ici il le pouvait : le formulaire était
 * identique, la décision partait, et l'entreprise coulait au tour d'après sans
 * que personne n'ait eu à trancher.
 *
 * La règle tenue ici : pour valider le tour, il faut réunir de quoi repasser
 * sous le plafond de découvert. Trois leviers y répondent, et trois seulement —
 * ceux qui apportent de la trésorerie SÛRE et CHIFFRÉE au moment où l'on
 * valide :
 *
 *  · l'emprunt, dans la limite de la capacité d'endettement ;
 *  · l'apport des associés, dans la limite de leur enveloppe ;
 *  · la subvention exceptionnelle DÉJÀ ACCORDÉE par l'animateur.
 *
 * La cession d'un actif en apporte aussi, mais son produit dépend de la valeur
 * comptable des machines vendues et ne se calcule pas au moment de la saisie :
 * la compter ici obligerait à promettre un montant qu'on ne connaît pas encore.
 * Elle reste un levier de jeu, elle n'ouvre simplement pas la porte.
 *
 * ET LE MUR. Quand les trois leviers réunis ne suffisent pas — la banque ne
 * prête plus, l'enveloppe des associés est vide, aucune aide n'est venue —
 * l'équipe n'a plus RIEN à décider. Continuer à lui refuser la validation
 * serait une impasse : elle ne peut ni jouer, ni renoncer. Il lui reste un
 * geste, un seul : déposer une demande de subvention exceptionnelle, que
 * l'animateur accordera ou non. Ce dossier déposé lève le verrou — non parce
 * que le compte y est, mais parce que l'équipe a fait tout ce qui était en son
 * pouvoir, et que la suite appartient à quelqu'un d'autre.
 *
 * Ce module est pur et partagé : l'écran s'en sert pour dire ce qui manque et
 * bloquer le bouton, l'action serveur pour refuser une décision qui n'y
 * répond pas. Une seule règle, deux usages — c'est ce qui évite qu'un écran
 * autorise ce que le serveur refusera.
 */

export type ExigenceSauvetage = {
  /** Ce qu'il faut réunir pour repasser sous le plafond de découvert. */
  manque: number;
  /** Ce que la banque peut encore prêter ; `null` sans plafond déclaré. */
  capaciteEmprunt: number | null;
  /** Ce que les associés peuvent encore apporter ; `null` sans enveloppe. */
  enveloppeApport: number | null;
  /** Subvention exceptionnelle accordée par l'animateur pour ce tour. */
  subventionAccordee?: number;
  /**
   * Une demande de subvention a été déposée pour ce tour — quelle que soit sa
   * suite. Accordée, refusée ou encore à l'étude, l'équipe a joué son dernier
   * recours : on ne la laisse pas bloquée devant un formulaire qu'elle ne peut
   * plus satisfaire.
   */
  demandeDeposee?: boolean;
  /**
   * Y a-t-il quelqu'un pour instruire une demande ? En classe et en concours,
   * oui : l'animateur. En solo, personne — et proposer un formulaire qui
   * n'aboutira jamais serait une cruauté inutile. Le verrou se lève alors de
   * lui-même : l'équipe n'a plus de recours, elle joue son tour et en assume
   * la suite. Absent = il y a un animateur (le cas de la classe).
   */
  avecAnimateur?: boolean;
};

/** Ce que l'équipe a réuni dans sa décision. */
export type ApportsSauvetage = { emprunt: number; apport: number };

export type VerdictSauvetage =
  /** Le compte y est : le tour peut être validé. */
  | { issue: "suffisant" }
  /** Il reste des leviers à actionner : emprunter davantage, ou apporter. */
  | { issue: "manque"; reste: number }
  /** Plus aucun levier : il faut déposer une demande de subvention. */
  | { issue: "leviers_epuises"; reste: number }
  /** La demande est déposée : l'équipe a fait sa part, le tour se joue. */
  | { issue: "demande_deposee"; reste: number }
  /** Aucun animateur à solliciter (solo) : le tour se joue sans filet. */
  | { issue: "sans_recours"; reste: number };

/** Un euro près : les montants viennent de calculs flottants. */
const TOLERANCE = 1;

export function verdictSauvetage(
  exigence: ExigenceSauvetage,
  apports: ApportsSauvetage,
): VerdictSauvetage {
  const accordee = Math.max(0, exigence.subventionAccordee ?? 0);
  const reuni = Math.max(0, apports.emprunt) + Math.max(0, apports.apport) + accordee;
  const reste = Math.max(0, exigence.manque - reuni);
  if (exigence.manque - reuni <= TOLERANCE) return { issue: "suffisant" };

  const maximum =
    (exigence.capaciteEmprunt ?? Number.POSITIVE_INFINITY) +
    (exigence.enveloppeApport ?? Number.POSITIVE_INFINITY) +
    accordee;
  if (maximum + TOLERANCE >= exigence.manque) return { issue: "manque", reste };
  if (exigence.demandeDeposee) return { issue: "demande_deposee", reste };
  if (exigence.avecAnimateur === false) return { issue: "sans_recours", reste };
  return { issue: "leviers_epuises", reste };
}

/** Le tour peut-il partir ? Une demande déposée suffit à lever le verrou. */
export function bloqueLaValidation(verdict: VerdictSauvetage): boolean {
  return verdict.issue === "manque" || verdict.issue === "leviers_epuises";
}

/**
 * Le message adressé à l'équipe, en euros et en français. `null` quand rien ne
 * bloque — y compris quand la demande est déposée : ce cas-là n'est pas un
 * reproche, et c'est le bandeau de crise qui en dit l'état.
 */
export function messageSauvetage(
  verdict: VerdictSauvetage,
  formatEuro: (v: number) => string,
): string | null {
  if (verdict.issue === "leviers_epuises") {
    return (
      `Emprunt et apport des associés réunis ne couvrent pas les ${formatEuro(verdict.reste)} ` +
      `qui manquent : vos deux leviers sont épuisés. Déposez une demande de subvention ` +
      `exceptionnelle auprès de votre animateur pour pouvoir valider ce tour.`
    );
  }
  if (verdict.issue === "manque") {
    return (
      `Il manque encore ${formatEuro(verdict.reste)} pour repasser sous votre découvert ` +
      `autorisé. Empruntez ou faites appel aux associés avant de valider.`
    );
  }
  // « demande_deposee » et « sans_recours » ne bloquent pas : il n'y a rien à
  // reprocher à une équipe qui a épuisé ce qu'elle pouvait décider.
  return null;
}

/**
 * Le verdict SI L'ÉQUIPE ALLAIT AU BOUT de ses deux leviers : emprunt maximal
 * et apport maximal. C'est lui qui dit si le mur est réel — et non la saisie du
 * moment, qui peut être vide simplement parce que l'élève n'a encore rien tapé.
 */
export function verdictAuMaximum(exigence: ExigenceSauvetage): VerdictSauvetage {
  return verdictSauvetage(exigence, {
    emprunt: exigence.capaciteEmprunt ?? Number.POSITIVE_INFINITY,
    apport: exigence.enveloppeApport ?? Number.POSITIVE_INFINITY,
  });
}

/**
 * Ce qu'une subvention aurait à couvrir : ce qui manquerait encore une fois
 * tous les leviers utilisés à fond. Zéro quand l'équipe peut s'en sortir seule.
 * C'est le plancher du montant proposé dans le formulaire de demande
 * (`montantDemandable`), qui le relève à ce qui dégèle une entreprise
 * défaillante.
 */
export function resteApresLeviers(exigence: ExigenceSauvetage): number {
  const verdict = verdictAuMaximum(exigence);
  return verdict.issue === "suffisant" ? 0 : verdict.reste;
}


/**
 * LE MONTANT QU'UNE ÉQUIPE PEUT DEMANDER EN SUBVENTION, et donc si elle peut
 * en demander une. `null` : pas de formulaire.
 *
 * Deux portes, une seule règle, tenue ici pour l'écran comme pour l'action
 * serveur :
 *
 *  · NIVEAUX QUI OUVRENT LE FINANCEMENT : la porte s'ouvre au pied du mur,
 *    emprunt et apport des associés épuisés (`verdictAuMaximum`).
 *  · NIVEAUX 1 À 3 : aucun financement ne s'y décide. Une équipe en crise y a
 *    encore son exploitation pour se redresser ; une équipe DÉFAILLANTE n'a
 *    plus rien, ses décisions ne sont même plus simulées. C'est à elle, et à
 *    elle seule, que la porte s'ouvre, faute de quoi elle restait à l'arrêt
 *    jusqu'à la fin de la partie sans que personne, ni elle ni l'enseignant,
 *    ait un geste à faire.
 *
 * LE MONTANT couvre ce qui remet réellement l'entreprise en marche quand elle
 * est défaillante (`subventionQuiDegele`, mesuré par le moteur : le
 * premier tour d'arrêt creuse encore le découvert, et la subvention est
 * imposée), avec le coussin qui l'empêche de retomber aussitôt
 * (`subventionProposeeAuDegel`). Le « manque » de la dernière
 * clôture n'y suffisait jamais : accordé en entier, il laissait l'équipe
 * gelée. Il reste le plancher quand l'entreprise n'est pas gelée.
 *
 * C'est aussi LE PLAFOND de la demande : le champ du formulaire et l'action
 * serveur refusent au-delà. Le coussin relève donc le plafond avec lui, sans
 * quoi le montant proposé serait refusé tel quel ; il ne le dépasse jamais,
 * puisqu'il l'est. La seule borne au-dessus est la colonne qui garde le
 * montant (`aid_requests.amount`, 12 chiffres avant la virgule) : la
 * recherche du minimum s'arrête bien avant (`subventionQuiDegele` rend `null`
 * au-delà de son plafond de recherche), et le coussin appliqué au plus grand
 * minimum qu'elle puisse rendre y tient encore.
 *
 * Pas d'animateur (partie solo) : personne n'instruira la demande, la porte
 * reste fermée.
 */
export function montantDemandable(args: {
  alerte: {
    defaillante: boolean;
    financementOuvert: boolean;
    subventionQuiDegele?: number | null;
    avecAnimateur?: boolean;
  } | null;
  exigence: ExigenceSauvetage | null;
}): number | null {
  const { alerte, exigence } = args;
  if (!alerte) return null;
  const minimum = alerte.defaillante ? Math.max(0, alerte.subventionQuiDegele ?? 0) : 0;
  const degel = subventionProposeeAuDegel(minimum);
  if (exigence) {
    if (verdictAuMaximum(exigence).issue !== "leviers_epuises") return null;
    return Math.max(Math.ceil(resteApresLeviers(exigence)), degel);
  }
  if (alerte.financementOuvert || !alerte.defaillante) return null;
  if (alerte.avecAnimateur === false) return null;
  return degel > 0 ? degel : null;
}

/**
 * LE COUSSIN DU DÉGEL : ce que la subvention proposée ajoute au minimum qui
 * dégèle, en multiple de ce minimum.
 *
 * Le minimum (`subventionQuiDegele`) amène la clôture du tour gelé juste sous
 * le plafond de découvert ; la moindre perte du tour suivant refait une crise,
 * et deux crises de suite refont une défaillance. Mesuré sur 24 graines, six
 * tours, en partie fidèle (l'équipe valide la proposition après une erreur de
 * prix au tour 1, puis reçoit la subvention dès qu'elle ouvre un tour
 * défaillante), la proposition relisant le dernier tour joué et non le tour
 * gelé : au minimum, NOVA niveau 2 retombe dans 12 cas sur 12 (prix × 0,85) et
 * 22 sur 22 (× 0,80), le bistrot dans 2 sur 16 ; à × 1,25 rien ne change ; à
 * × 1,5, 1 sur 12, 2 sur 22 et 0 sur 16, soit environ un demi-tour de charges
 * fixes de plus chez NOVA. À × 2, plus aucune rechute, mais un demi-minimum
 * de plus accordé à chaque équipe pour les quelques cas qui restaient.
 * La garde : `tests/engine/rechute-apres-degel.test.ts`.
 */
export const COUSSIN_DU_DEGEL = 1.5;

/**
 * La subvention que le formulaire PROPOSE à une entreprise défaillante : le
 * minimum qui la dégèle, multiplié par le coussin, arrondi comme lui à la
 * centaine d'euros supérieure. Zéro sans minimum.
 */
export function subventionProposeeAuDegel(minimum: number): number {
  if (!(minimum > 0)) return 0;
  return Math.ceil((minimum * COUSSIN_DU_DEGEL) / 100) * 100;
}
