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
 * sous le plafond de découvert. Deux leviers comptent, et deux seulement —
 * ceux qui apportent de la trésorerie SÛRE et CHIFFRÉE au moment où l'on
 * valide :
 *
 *  · l'emprunt, dans la limite de la capacité d'endettement ;
 *  · l'apport des associés, dans la limite de leur enveloppe.
 *
 * La cession d'un actif en apporte aussi, mais son produit dépend de la valeur
 * comptable des machines vendues et ne se calcule pas au moment de la saisie :
 * la compter ici obligerait à promettre un montant qu'on ne connaît pas encore.
 * Elle reste un levier de jeu, elle n'ouvre simplement pas la porte.
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
};

/** Ce que l'équipe a réuni dans sa décision. */
export type ApportsSauvetage = { emprunt: number; apport: number };

export type VerdictSauvetage =
  | { suffisant: true }
  | {
      suffisant: false;
      /** Ce qu'il reste à trouver, une fois emprunt et apport déduits. */
      reste: number;
      /**
       * Les deux leviers sont épuisés : la capacité d'endettement et
       * l'enveloppe d'apport ne suffisent pas, même utilisées en entier. Il
       * n'y a plus rien à demander à l'équipe — c'est le cas qui ouvrira la
       * subvention exceptionnelle.
       */
      leviersEpuises: boolean;
    };

/** Un euro près : les montants viennent de calculs flottants. */
const TOLERANCE = 1;

export function verdictSauvetage(
  exigence: ExigenceSauvetage,
  apports: ApportsSauvetage,
): VerdictSauvetage {
  const reuni = Math.max(0, apports.emprunt) + Math.max(0, apports.apport);
  const reste = exigence.manque - reuni;
  if (reste <= TOLERANCE) return { suffisant: true };

  const maximum =
    (exigence.capaciteEmprunt ?? Number.POSITIVE_INFINITY) +
    (exigence.enveloppeApport ?? Number.POSITIVE_INFINITY);
  return {
    suffisant: false,
    reste: Math.max(0, reste),
    leviersEpuises: maximum + TOLERANCE < exigence.manque,
  };
}

/** Le message adressé à l'équipe, en euros et en français. */
export function messageSauvetage(
  verdict: VerdictSauvetage,
  formatEuro: (v: number) => string,
): string | null {
  if (verdict.suffisant) return null;
  if (verdict.leviersEpuises) {
    return (
      `Emprunt et apport des associés réunis ne couvrent pas les ${formatEuro(verdict.reste)} ` +
      `qui manquent : vos deux leviers sont épuisés.`
    );
  }
  return (
    `Il manque encore ${formatEuro(verdict.reste)} pour repasser sous votre découvert ` +
    `autorisé. Empruntez ou faites appel aux associés avant de valider.`
  );
}
