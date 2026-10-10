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
  /**
   * TOUS LES TOURS SONT EN PERTE : le « meilleur » tour est alors le moins
   * mauvais. Le bilan ne le célèbre pas (l'or est le verdict, pas la
   * consolation) : il parle du « tour le plus maîtrisé », sans filet d'or.
   */
  toutEnPerte: boolean;
  /** Les tours, dans l'ordre : la courbe du résultat, tour par tour. */
  parTour: TourDuBilan[];
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
    toutEnPerte: meilleurTour.resultat < 0,
    parTour: ordre,
  };
}

/**
 * LE TITRE DE LA CLÔTURE : HONNÊTE SUR LE RÉSULTAT (lot P5).
 *
 * Il disait « Victoire ! NOVA domine le marché. » dès que l'équipe finissait
 * 1re, quel que soit l'argent : on a vu le titre célébrer une partie qui
 * finissait à −103 193 €. La 1re place est vraie (c'est le classement à
 * l'IPG, qui pèse aussi la part de marché, la trésorerie, la qualité…), mais
 * une partie en perte n'est pas une victoire, et c'est justement ce qu'un
 * jeu d'apprentissage doit dire. Le rang, lui, reste dit une fois, en or,
 * sous le titre (« 1re sur 3 ») : le titre ne le réécrit pas.
 *
 *   rang \ résultat cumulé   > 0                          = 0 ou < 0
 *   1re                      « Victoire ! X domine… »     « En tête du classement, mais
 *                            (la coupe d'or)               en perte. » / « …, sans
 *                                                          bénéfice. » (pas de coupe)
 *   2e et au-delà            « Partie terminée. »         « Partie terminée. »
 *   classement non révélé    « Partie terminée. »         « Partie terminée. »
 *
 * Un classement que l'enseignant n'a pas encore révélé ne se devine pas dans
 * le titre : sans rang, c'est « Partie terminée. », même pour la 1re équipe.
 */
export function titreDuBilan({
  rang,
  resultatCumule,
  equipe,
}: {
  /** La place finale, ou null quand le classement n'est pas (encore) ouvert. */
  rang: number | null;
  resultatCumule: number;
  /** Le nom de l'équipe, tel que la partie l'affiche. */
  equipe: string;
}): { titre: string; victoire: boolean } {
  if (rang !== 1) return { titre: "Partie terminée.", victoire: false };
  if (resultatCumule > 0) return { titre: `Victoire ! ${equipe} domine le marché.`, victoire: true };
  if (resultatCumule < 0) return { titre: "En tête du classement, mais en perte.", victoire: false };
  return { titre: "En tête du classement, sans bénéfice.", victoire: false };
}
