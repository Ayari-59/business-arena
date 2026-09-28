/**
 * LE BILAN : six tours de travail méritent mieux qu'une ligne.
 *
 * L'écran de fin disait « Partie terminée », un montant cumulé et deux boutons
 * pour rejouer. Tout ce qui s'était joué pendant la séance — la trajectoire, le
 * tour où tout a basculé, ce que l'équipe a réussi, où elle finit — restait
 * dispersé dans un accordéon qu'il fallait rouvrir tour par tour. La partie ne
 * se terminait pas : elle s'arrêtait.
 *
 * Ce module ne calcule RIEN de neuf : il relit les tours clos, comme le reste
 * de l'arène, et en tire les quelques phrases qu'on a envie d'entendre à la
 * fin. Aucune table, aucun score, aucun effet sur la partie.
 */

/** Un tour clos, tel que l'arène le tient déjà pour ses tuiles. */
export interface TourDuBilan {
  round: number;
  /** « Trimestre 3 », dans la langue du scénario. */
  libelle: string;
  ca: number;
  resultat: number;
  tresorerie: number;
}

export interface Bilan {
  tours: number;
  caCumule: number;
  resultatCumule: number;
  tresorerieFinale: number;
  /** Le tour qui a le plus rapporté. */
  meilleurTour: TourDuBilan | null;
  /**
   * LE TOUR DÉCISIF : celui où le résultat a le plus progressé d'un tour à
   * l'autre. C'est la question que les équipes se posent en sortant (« c'est
   * quand qu'on a redressé ? »), et elle n'a pas la même réponse que « quel
   * tour a le plus rapporté » : on peut gagner le plus au dernier tour après
   * avoir tout joué au troisième. Null quand un seul tour a été joué, ou quand
   * rien n'a jamais progressé.
   */
  tourDecisif: { tour: TourDuBilan; gain: number } | null;
  /** La partie s'est-elle terminée au-dessus de zéro, cumul fait ? */
  beneficiaire: boolean;
}

export function bilanDeLaPartie(tours: readonly TourDuBilan[]): Bilan | null {
  if (tours.length === 0) return null;
  const ordre = [...tours].sort((a, b) => a.round - b.round);
  const resultatCumule = ordre.reduce((s, t) => s + t.resultat, 0);

  let meilleurTour = ordre[0]!;
  for (const t of ordre) if (t.resultat > meilleurTour.resultat) meilleurTour = t;

  let tourDecisif: Bilan["tourDecisif"] = null;
  for (let i = 1; i < ordre.length; i += 1) {
    const gain = ordre[i]!.resultat - ordre[i - 1]!.resultat;
    if (gain > 0 && (!tourDecisif || gain > tourDecisif.gain)) {
      tourDecisif = { tour: ordre[i]!, gain };
    }
  }

  return {
    tours: ordre.length,
    caCumule: ordre.reduce((s, t) => s + t.ca, 0),
    resultatCumule,
    tresorerieFinale: ordre.at(-1)!.tresorerie,
    meilleurTour,
    tourDecisif,
    beneficiaire: resultatCumule > 0,
  };
}
