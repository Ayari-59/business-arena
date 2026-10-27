/**
 * LE MONDE DU COURS : L'ESCALE, L'HÔTEL DU COURS.
 *
 * Le cours a sa propre simulation, inspirée des neuf entreprises de l'arène, mais calculée par le
 * cours et figée : elle ne lit jamais le moteur, et une évolution de l'arène ne la change pas.
 * Décision du propriétaire (octobre 2026) : le contenu du cours fait l'objet de la simulation ;
 * elle reprend le contexte de l'entreprise (son nom, son métier, ses ordres de grandeur), sans être
 * le reflet exact de ce qui se passe dans l'arène.
 *
 * Cette fiche a été relevée une fois sur le scénario de l'hôtel de l'arène (60 chambres,
 * 90 jours par trimestre, 88 € la nuitée, 21 € de coût variable par nuitée occupée),
 * puis écrite ici. La demande de chaque clientèle reprend la saison de l'arène (les affaires en
 * semaine, hors été ; les loisirs l'été ; les groupes au printemps et à l'automne), forcée pour que
 * l'été remplisse l'hôtel : c'est la situation que le cours veut montrer.
 */

/** Une clientèle de l'hôtel, et les nuitées qu'elle lui demande chaque trimestre au prix de l'année. */
export interface ClienteleDeLHotel {
  code: string;
  nom: string;
  demande: readonly [number, number, number, number];
}

export interface FicheDeLHotel {
  code: string;
  entreprise: string;
  chambres: number;
  joursParTrimestre: number;
  /** Le prix de la nuitée que l'hôtel affiche toute l'année. */
  prixDeLAnnee: number;
  /** Ce que coûte une nuitée occupée : ménage, linge, petit-déjeuner. Une chambre vide ne le coûte pas. */
  coutVariableParNuitee: number;
  /** Tout ce qui ne dépend pas des nuitées vendues : personnel, loyer, entretien, amortissements. */
  chargesFixesParTrimestre: number;
  /**
   * LA SENSIBILITÉ DE LA DEMANDE AU PRIX, toutes clientèles réunies (hypothèse du cours) : la
   * demande au prix p vaut la demande au prix de l'année × (p ÷ prix de l'année) ^ élasticité.
   * À −1,5, un prix plus haut de 1 % fait perdre environ 1,5 % de la demande.
   */
  elasticite: number;
  clienteles: readonly ClienteleDeLHotel[];
  /** L'équipe : le même effectif toute l'année, payé pareil chaque trimestre (sa paie est dans les charges fixes). */
  equipe: { effectif: number; coutParSalarieParTrimestre: number };
  /**
   * Les hôtels de la ville qui servent de comparaison. Leur année est posée telle quelle (prix et
   * nuitées vendues par trimestre), relevée une fois sur les concurrents de l'arène : le cours ne
   * les fait pas réagir.
   */
  concurrents: readonly { nom: string; chambres: number; prix: readonly [number, number, number, number]; vendues: readonly [number, number, number, number] }[];
}

export const L_ESCALE: FicheDeLHotel = {
  code: "hotel",
  entreprise: "L'ESCALE",
  chambres: 60,
  joursParTrimestre: 90,
  prixDeLAnnee: 88,
  coutVariableParNuitee: 21,
  chargesFixesParTrimestre: 210_000,
  elasticite: -1.5,
  clienteles: [
    { code: "affaires", nom: "Clientèle d'affaires", demande: [1300, 1400, 700, 1350] },
    { code: "loisirs", nom: "Tourisme de loisirs", demande: [1000, 2200, 5300, 1300] },
    { code: "groupes", nom: "Groupes et séminaires", demande: [1100, 1400, 400, 1250] },
  ],
  equipe: { effectif: 14, coutParSalarieParTrimestre: 8600 },
  concurrents: [
    { nom: "Le Comptoir", chambres: 60, prix: [77.44, 77.44, 77.44, 77.44], vendues: [4716, 5400, 5400, 5400] },
    { nom: "Grand Hôtel Terminus", chambres: 60, prix: [114.26, 114.4, 114.4, 114.4], vendues: [1925, 2300, 2069, 2175] },
  ],
};

/** Les hôtels du monde du cours, par code d'entreprise. */
export const HOTELS_DU_COURS: Readonly<Record<string, FicheDeLHotel>> = { [L_ESCALE.code]: L_ESCALE };
