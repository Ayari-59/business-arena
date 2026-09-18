import type { CourrierDef } from "../types";

/**
 * LA LIASSE DE MARTEL & FILS — entreprise de rénovation.
 *
 * Le bâtiment travaille sur devis, sur marchés et sous garantie décennale :
 * son courrier est celui d'un métier où tout s'écrit et tout engage. Négoce de
 * matériaux, syndics, collectivités, assureurs, bureau de contrôle — et les
 * intempéries, qui ne préviennent que par bulletin.
 */
export const BATIMENT_COURRIERS: CourrierDef[] = [
  {
    code: "batiment_aide_renovation",
    expediteur: "Agence nationale de l'habitat · Service des aides",
    objet: "Reconduction du dispositif d'aide à la rénovation énergétique",
    corps:
      "Le dispositif est reconduit pour l'année, avec un barème inchangé et des conditions d'éligibilité élargies. Les entreprises qualifiées, dont la vôtre, seront citées dans l'annuaire remis aux particuliers.",
    signataire: "La déléguée régionale",
    effet: "Demande des particuliers +32 % pendant 2 tours",
    enJeu: "Une demande qui gonfle d'un coup teste d'abord votre capacité, pas votre force commerciale.",
    nature: "macro",
    pli: "simple",
    emoji: "🏠",
    scope: "market",
  },
  {
    code: "batiment_penurie_materiaux",
    expediteur: "Négoce Dhondt Matériaux · Direction commerciale",
    objet: "Allongement des délais et révision des tarifs sur l'isolant",
    corps:
      "Nos fournisseurs annoncent huit semaines de délai sur l'ensemble des isolants et une hausse immédiate des prix. Vos commandes en cours sont facturées au tarif du jour de livraison, conformément à nos conditions générales.",
    signataire: "Le directeur commercial",
    effet: "Coût des matériaux +22 % pendant 2 tours",
    enJeu: "Les devis signés le sont à prix ferme : la hausse se prend entièrement sur votre marge.",
    nature: "macro",
    pli: "simple",
    emoji: "📦",
    scope: "market",
  },
  {
    code: "batiment_intemperies",
    expediteur: "Caisse des congés et intempéries du bâtiment",
    objet: "Déclaration d'arrêt pour intempéries",
    corps:
      "La période de pluie et de gel annoncée justifie l'arrêt des chantiers extérieurs. Les heures perdues doivent être déclarées dans les huit jours ; les salaires restent dus aux compagnons pendant l'arrêt.",
    signataire: "Le service des déclarations",
    effet: "Disponibilité des chantiers −18 % ce tour",
    enJeu: "Les compagnons sont payés pendant l'arrêt : une journée d'intempérie coûte le salaire sans la recette.",
    nature: "market",
    pli: "simple",
    emoji: "🌧️",
    scope: "market",
  },
  {
    code: "batiment_appel_offres",
    expediteur: "Centrale des marchés publics · Service des avis",
    objet: "Publication de trois programmes de rénovation",
    corps:
      "Trois collectivités du département publient la même semaine leurs programmes de rénovation de bâtiments scolaires. Les délais de remise sont courts et les paiements interviendront à soixante jours fin de mois.",
    signataire: "Le service des avis",
    effet: "Demande des marchés publics +40 % ce tour",
    enJeu: "Du volume à prix tiré, payé très tard : la question n'est pas de gagner, mais de savoir le financer.",
    nature: "market",
    pli: "simple",
    emoji: "📋",
    scope: "market",
  },
  {
    code: "batiment_credit_immobilier",
    expediteur: "Fédération du bâtiment · Note de conjoncture",
    objet: "Effondrement des mises en chantier chez les particuliers",
    corps:
      "La hausse des taux et le durcissement des conditions d'octroi conduisent les ménages à reporter leurs projets de travaux. Nos adhérents enregistrent une chute des demandes de devis sur l'ensemble du département.",
    signataire: "Le secrétaire général",
    effet: "Demande globale −22 % pendant 2 tours",
    enJeu:
      "Quand la demande recule, le seuil de rentabilité ne bouge pas : c'est la marge de sécurité qui s'évapore.",
    nature: "macro",
    pli: "simple",
    emoji: "🏦",
    scope: "market",
  },
  {
    code: "batiment_concurrent_liquide",
    expediteur: "Administrateur judiciaire Brunet",
    objet: "Liquidation d'une entreprise du secteur — chantiers en cours",
    corps:
      "L'entreprise du bourg voisin est en liquidation. Ses chantiers en cours cherchent un repreneur pour achèvement. Les dossiers techniques sont consultables à l'étude ; la reprise emporte la responsabilité de l'ouvrage.",
    signataire: "L'administrateur judiciaire",
    effet: "Demande globale +18 % pendant 2 tours",
    enJeu: "Reprendre le chantier d'un autre, c'est hériter de ses malfaçons : regardez avant de signer.",
    nature: "competition",
    pli: "simple",
    emoji: "🚪",
    scope: "market",
  },
  {
    code: "batiment_credit_resserre",
    expediteur: "Banque des Professions · Agence entreprises",
    objet: "Révision des conditions de l'ensemble de vos concours",
    corps:
      "Les délais de règlement constatés sur vos marchés publics allongent votre besoin de financement. Nous relevons en conséquence le taux de votre découvert et de votre ligne de mobilisation de créances, pour les deux prochains trimestres.",
    signataire: "Votre chargé d'affaires",
    effet: "Taux d'intérêt ×1,5 pendant 2 tours",
    enJeu: "Un métier qui finance trois mois de clients paie chaque point de taux beaucoup plus cher qu'un autre.",
    nature: "macro",
    pli: "recommande",
    emoji: "📉",
    scope: "market",
  },
  {
    code: "batiment_sinistre_chantier",
    expediteur: "Assurances du Littoral · Service sinistres",
    objet: "Déclaration de sinistre — dégât des eaux sur votre chantier",
    corps:
      "Une canalisation percée lors des travaux a inondé deux niveaux. L'expertise contradictoire est fixée à demain. Les travaux sont suspendus jusqu'à ses conclusions et la reprise des ouvrages détériorés vous incombera.",
    signataire: "Le gestionnaire de sinistres",
    effet: "Disponibilité −26 % et coût des matériaux +16 % pendant 2 tours (une entreprise)",
    enJeu: "C'est exactement ce que couvre une responsabilité civile professionnelle : la prime se juge ici.",
    nature: "internal",
    pli: "simple",
    emoji: "💧",
    scope: "team",
  },
  {
    code: "batiment_vol_materiel",
    expediteur: "Gendarmerie nationale · Brigade de proximité",
    objet: "Récépissé de dépôt de plainte — vol d'outillage",
    corps:
      "Votre plainte pour effraction du fourgon et vol de perforateurs, scies et niveaux laser a été enregistrée. Aucune piste n'est ouverte à ce stade. Ce récépissé vous est délivré pour votre déclaration d'assurance.",
    signataire: "Le chef de brigade",
    effet: "Disponibilité −30 % ce tour (une entreprise tirée au sort)",
    enJeu:
      "Sans outillage, les compagnons sont payés à attendre : la capacité est plus fragile qu'elle n'en a l'air.",
    nature: "internal",
    pli: "simple",
    emoji: "🔒",
    scope: "team",
  },
  {
    code: "batiment_malfacon",
    expediteur: "Syndic Berthier · Gestion de copropriété",
    objet: "Mise en demeure de reprise — décollement du carrelage",
    corps:
      "Le carrelage posé lors de votre intervention se décolle sur l'ensemble des parties communes. Nous vous mettons en demeure de procéder à la dépose et à la repose intégrales à vos frais, au titre de la garantie de parfait achèvement.",
    signataire: "Le gestionnaire d'immeuble",
    effet: "Coût des matériaux +20 % pendant 2 tours (une entreprise tirée au sort)",
    enJeu:
      "La non-qualité se paie deux fois : la reprise, puis les chantiers que la réputation ne rapporte plus.",
    nature: "internal",
    pli: "recommande",
    emoji: "🧱",
    scope: "team",
  },
  {
    code: "batiment_reference_prestige",
    expediteur: "Revue Architectures régionales · Rédaction",
    objet: "Publication de votre chantier dans notre prochain numéro",
    corps:
      "L'architecte de l'opération nous a proposé votre réalisation pour notre dossier sur la rénovation du bâti ancien. Six pages lui seront consacrées, avec la mention de votre entreprise en légende de chaque photographie.",
    signataire: "Le rédacteur en chef",
    effet: "Disponibilité commerciale +6 % pendant 2 tours (une entreprise)",
    enJeu: "Dans le bâtiment, la réputation se construit lentement et vaut plus qu'un budget de publicité.",
    nature: "market",
    pli: "simple",
    emoji: "🏅",
    scope: "team",
  },
  {
    code: "batiment_banque_conciliante",
    expediteur: "Banque des Professions · Agence entreprises",
    objet: "Renégociation de votre découvert au vu de vos derniers bilans",
    corps:
      "L'examen de vos comptes montre un endettement largement couvert par vos capitaux propres. Nous révisons à la baisse le coût de votre découvert pour les deux prochains trimestres.",
    signataire: "Votre chargé d'affaires",
    effet: "Taux d'intérêt ×0,7 pendant 2 tours (une entreprise)",
    enJeu:
      "Ce sont les capitaux propres qui portent la dette : tant qu'ils la couvrent, la banque suit. C'est exactement la limite qu'elle vous applique quand vous empruntez.",
    nature: "macro",
    pli: "simple",
    emoji: "🤝",
    scope: "team",
  },
  {
    code: "batiment_chantier_surprise",
    expediteur: "Syndic Berthier · Gestion de copropriété",
    objet: "Consultation en urgence — défaillance de l'entreprise retenue",
    corps:
      "L'entreprise retenue pour notre ravalement s'est désistée la veille du démarrage. L'échafaudage est monté et la copropriété a voté les fonds. Nous cherchons une reprise immédiate du marché, aux conditions initiales.",
    signataire: "Le gestionnaire d'immeuble",
    effet: "Commande ferme de 180 m² ce tour (une entreprise tirée au sort)",
    enJeu: "Une commande ferme se sert sur la capacité restante : acceptez-la si les équipes suivent, pas avant.",
    nature: "market",
    pli: "simple",
    emoji: "📞",
    scope: "team",
  },
  {
    code: "batiment_major_breakdown",
    expediteur: "Levage Carpentier · Service après-vente",
    objet: "Rapport d'intervention — avarie hydraulique de votre mini-grue",
    corps:
      "Le circuit hydraulique principal est hors d'usage et le vérin de flèche doit être remplacé. Les pièces sont à commander à l'étranger : deux trimestres avant remise en service. Le chantier est à l'arrêt.",
    signataire: "Le responsable technique",
    effet: "Disponibilité −30 % pendant 2 tours (une entreprise tirée au sort)",
    enJeu: "Risque opérationnel & maintenance préventive",
    nature: "internal",
    pli: "simple",
    emoji: "🛑",
    scope: "team",
  },
  {
    code: "batiment_tech_obsolescence",
    expediteur: "Contrôle technique des engins · Rapport de visite",
    objet: "Non-conformité antipollution de vos engins de chantier",
    corps:
      "Vos engins ne satisfont plus aux normes d'émission applicables aux chantiers urbains. Leur consommation dépasse d'un tiers celle des modèles actuels et les pièces détachées deviennent difficiles à obtenir.",
    signataire: "Le contrôleur",
    effet: "Disponibilité −10 % et coût matières +8 % pendant 2 tours (une entreprise tirée au sort)",
    enJeu: "Cycle de vie des actifs & veille technologique",
    nature: "internal",
    pli: "simple",
    emoji: "⏳",
    scope: "team",
  },
  {
    code: "batiment_used_equipment_deal",
    expediteur: "M. Ternois, artisan · Cessation d'activité",
    objet: "Cession de ma nacelle et de mon fourgon avant départ en retraite",
    corps:
      "Je cesse mon activité à la fin du trimestre et cède mon matériel, révisé et régulièrement entretenu, à un confrère plutôt qu'à un marchand. Le prix demandé est nettement inférieur à la cote.",
    signataire: "M. Ternois",
    effet: "Disponibilité +12 % ce tour (équipe ciblée)",
    enJeu: "Décision d'investissement & coût d'opportunité",
    nature: "internal",
    pli: "simple",
    emoji: "🏭",
    scope: "team",
  },
  {
    code: "batiment_artisan_low_cost",
    expediteur: "Fédération du bâtiment · Observatoire des devis",
    objet: "Devis anormalement bas constatés chez les particuliers",
    corps:
      "Un artisan récemment installé propose des devis inférieurs de vingt pour cent aux prix du marché, sans attestation d'assurance décennale valide. Les particuliers, qui ne vérifient pas ces attestations, comparent les seuls montants.",
    signataire: "Le secrétaire général",
    effet: "Demande des particuliers −18 % pendant 2 tours",
    enJeu:
      "Un devis moins cher cache souvent une charge en moins : la vôtre se paie, et c'est ce qu'il faut savoir expliquer.",
    nature: "competition",
    pli: "simple",
    emoji: "🔨",
    scope: "market",
  },
  {
    code: "batiment_major_petits_marches",
    expediteur: "Centrale des marchés publics · Service des avis",
    objet: "Résultats des derniers lots de rénovation",
    corps:
      "Faute de grands programmes, un groupe national soumissionne désormais sur les lots inférieurs à cent mille euros. Il a remporté les trois dernières consultations du département sur le critère des références.",
    signataire: "Le service des avis",
    effet: "Demande des marchés publics −25 % ce tour",
    enJeu:
      "Sur appel d'offres, la taille rassure l'acheteur : la réponse d'une PME est la réactivité et la proximité.",
    nature: "competition",
    pli: "simple",
    emoji: "🏢",
    scope: "market",
  },
  {
    code: "batiment_bouche_a_oreille",
    expediteur: "Chambre des syndics de copropriété",
    objet: "Inscription de votre entreprise sur notre liste de recommandation",
    corps:
      "La réception sans réserve de votre dernier ravalement a été signalée par le syndic concerné. Trois de nos adhérents souhaitent vous consulter pour leurs programmes de l'année à venir.",
    signataire: "Le président de la chambre",
    effet: "Demande des syndics de votre entreprise +25 % pendant 2 tours",
    enJeu: "Un chantier bien fini est un commercial gratuit : la qualité se rentabilise sur le suivant.",
    nature: "market",
    pli: "simple",
    emoji: "🗣️",
    scope: "team",
  },
  {
    code: "batiment_conducteur_absent",
    expediteur: "Médecine du travail du bâtiment",
    objet: "Avis d'inaptitude temporaire de votre conducteur de travaux",
    corps:
      "L'examen conclut à une inaptitude temporaire de six semaines, sans aménagement de poste possible. Aucune reprise anticipée ne peut être autorisée. Une visite de préreprise sera organisée avant son retour.",
    signataire: "Le médecin du travail",
    effet: "Capacité des équipes −15 % pendant 2 tours",
    enJeu:
      "La capacité d'une entreprise de bâtiment, c'est aussi celui qui organise : un goulot invisible sur le planning.",
    nature: "internal",
    pli: "recommande",
    emoji: "🩹",
    scope: "team",
  },
  {
    code: "batiment_norme_thermique",
    expediteur: "Direction départementale des territoires",
    objet: "Entrée en vigueur de la nouvelle réglementation thermique",
    corps:
      "Les épaisseurs minimales d'isolant et la certification des menuiseries sont relevées pour tous les chantiers de rénovation déposés à compter du trimestre prochain. Les matériaux conformes sont plus coûteux et leur emploi est obligatoire.",
    signataire: "Le chef du service habitat",
    effet: "Coût des matériaux +10 % pendant 2 tours",
    enJeu:
      "Une norme relève le coût variable de tous les concurrents à la fois : celui qui la répercute le premier perd des devis, le dernier perd de la marge.",
    nature: "macro",
    pli: "simple",
    emoji: "📐",
    scope: "market",
  },
];
