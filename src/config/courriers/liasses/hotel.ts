import type { CourrierDef } from "../types";

/**
 * LA LIASSE DE L'ESCALE — hôtel indépendant.
 *
 * L'hôtellerie vit sous le regard des tiers : l'office de tourisme, la
 * plateforme de réservation, le classement, le contrôle sanitaire, les avis en
 * ligne. Ses courriers viennent donc surtout de gens qui la jugent ou qui lui
 * amènent — ou lui retirent — des clients.
 */
export const HOTEL_COURRIERS: CourrierDef[] = [
  {
    code: "hotel_evenement_local",
    expediteur: "Office de tourisme · Direction des congrès",
    objet: "Salon professionnel au parc des expositions",
    corps:
      "Le salon accueillera quatre cents exposants pendant cinq jours. Nous avons transmis vos disponibilités aux organisateurs : l'ensemble du parc hôtelier de l'agglomération sera sollicité.",
    signataire: "La directrice des congrès",
    effet: "Demande globale +22 % ce tour",
    enJeu:
      "Quand la demande dépasse la capacité, le prix devient le seul levier : c'est là que se gagne une saison.",
    nature: "market",
    pli: "simple",
    emoji: "🎪",
    scope: "market",
  },
  {
    code: "hotel_avis_negatif",
    expediteur: "Plateforme Réservatio · Qualité et relation client",
    objet: "Alerte sur la note de votre établissement",
    corps:
      "Trois commentaires portant sur la propreté des chambres ont fait passer votre note sous la barre des sept. En dessous de ce seuil, votre établissement sort des premières pages de résultats.",
    signataire: "Le service qualité",
    effet: "Capacité commerciale −10 % pendant 2 tours (un établissement tiré au sort)",
    enJeu: "En hôtellerie, la réputation est un actif : elle se dégrade vite et se reconstruit lentement.",
    nature: "internal",
    pli: "simple",
    emoji: "⭐",
    scope: "team",
  },
  {
    code: "hotel_commission_ota",
    expediteur: "Plateforme Réservatio · Direction des partenariats",
    objet: "Modification unilatérale de nos conditions de commission",
    corps:
      "À compter du prochain trimestre, la commission prélevée sur les réservations passe de quinze à dix-huit pour cent. Le maintien de votre référencement vaut acceptation. À défaut, votre fiche sera retirée.",
    signataire: "Le directeur des partenariats",
    effet: "Coût variable par nuitée +16 % pendant 2 tours",
    enJeu:
      "Chaque nuitée vendue par la plateforme rapporte moins : votre marge unitaire fond sans que le prix affiché bouge.",
    nature: "macro",
    pli: "recommande",
    emoji: "💳",
    scope: "market",
  },
  {
    code: "hotel_greve_transports",
    expediteur: "Syndicat hôtelier départemental",
    objet: "Mouvement social dans les transports — conséquences sur nos réservations",
    corps:
      "Le préavis couvre huit jours et concerne le rail comme l'aérien. Nos adhérents enregistrent déjà des annulations massives sur la clientèle affaires, qui ne peut plus rejoindre la ville.",
    signataire: "Le président du syndicat",
    effet: "Demande de la clientèle affaires −28 % ce tour",
    enJeu:
      "Un hôtel qui ne vit que d'une clientèle meurt avec elle : la diversification des segments est une assurance.",
    nature: "macro",
    pli: "simple",
    emoji: "🚫",
    scope: "market",
  },
  {
    code: "hotel_panne_chaudiere",
    expediteur: "Chauffage Delattre · Service d'urgence",
    objet: "Intervention sur votre chaudière — étage sans eau chaude",
    corps:
      "L'échangeur est percé et la pièce n'est pas en stock. L'étage desservi restera sans eau chaude trois jours au mieux. Nous vous confirmerons la date dès réception de la commande.",
    signataire: "Le responsable d'intervention",
    effet: "Capacité −20 % ce tour (un établissement tiré au sort)",
    enJeu: "La maintenance était-elle au niveau ? Les chambres condamnées ce soir ne se revendront jamais.",
    nature: "internal",
    pli: "simple",
    emoji: "🔥",
    scope: "team",
  },
  {
    code: "hotel_meteo_radieuse",
    expediteur: "Office de tourisme · Observatoire des flux",
    objet: "Été indien — hausse des réservations de dernière minute",
    corps:
      "Trois semaines de beau temps hors saison sont annoncées sur toute la côte. Nos relevés montrent une poussée des réservations à moins de quarante-huit heures, à des prix supérieurs à la moyenne de saison.",
    signataire: "Le chargé d'observation",
    effet: "Demande touristique +28 % ce tour",
    enJeu:
      "La demande de dernière minute se capte au prix fort, encore faut-il ne pas avoir tout bradé un mois plus tôt.",
    nature: "market",
    pli: "simple",
    emoji: "☀️",
    scope: "market",
  },
  {
    code: "hotel_energie",
    expediteur: "Fournisseur d'énergie Caloris · Service entreprises",
    objet: "Renouvellement de votre contrat de fourniture",
    corps:
      "Votre contrat arrive à échéance. Les prix du gaz et de l'électricité ayant progressé de quarante pour cent, le nouveau barème s'applique dès la première facture du trimestre. Chauffage, blanchisserie et cuisine sont concernés.",
    signataire: "Le conseiller entreprises",
    effet: "Coût variable par nuitée +22 % pendant 2 tours",
    enJeu: "Une charge variable qui grimpe déplace mécaniquement le taux d'occupation d'équilibre vers le haut.",
    nature: "macro",
    pli: "recommande",
    emoji: "⚡",
    scope: "market",
  },
  {
    code: "hotel_credit_resserre",
    expediteur: "Crédit Hôtelier · Direction des engagements",
    objet: "Durcissement de nos conditions sur le secteur hôtelier",
    corps:
      "Notre comité des risques classe désormais l'hôtellerie parmi les secteurs cycliques. Les taux applicables à nos encours du secteur sont relevés pour les deux prochains trimestres, sans exception.",
    signataire: "Le directeur des engagements",
    effet: "Taux d'intérêt ×1,45 pendant 2 tours",
    enJeu: "Un hôtel est financé par de la dette longue : une hausse des taux se paie sur des années.",
    nature: "macro",
    pli: "recommande",
    emoji: "🏦",
    scope: "market",
  },
  {
    code: "hotel_degat_des_eaux",
    expediteur: "Assurances du Littoral · Service sinistres",
    objet: "Déclaration de sinistre — rupture de canalisation",
    corps:
      "L'expert est passé : douze chambres sont hors service et les plafonds de l'étage inférieur sont à reprendre. La prise en charge de la perte d'exploitation dépend de la formule souscrite ; le détail figure à votre contrat.",
    signataire: "La gestionnaire de sinistres",
    effet: "Capacité −32 % et coût variable +12 % ce tour (un établissement ciblé)",
    enJeu:
      "C'est le sinistre type de la multirisque hôtelière : la perte d'exploitation coûte plus cher que les travaux.",
    nature: "internal",
    pli: "recommande",
    emoji: "💧",
    scope: "team",
  },
  {
    code: "hotel_cyber_reservation",
    expediteur: "Prestataire BookEngine · Direction technique",
    objet: "Interruption de service à la suite d'une attaque informatique",
    corps:
      "Nos serveurs ont subi une attaque par déni de service. Votre moteur de réservation en ligne est indisponible et le restera quatre jours, le temps de la remise en état. Seul le téléphone permet encore de réserver.",
    signataire: "Le directeur technique",
    effet: "Capacité commerciale −25 % ce tour (un établissement ciblé)",
    enJeu: "Dépendre d'un outil unique, c'est lui confier son chiffre d'affaires : la formule tous risques le couvre.",
    nature: "internal",
    pli: "recommande",
    emoji: "🔒",
    scope: "team",
  },
  {
    code: "hotel_etoile_supplementaire",
    expediteur: "Commission de classement des hébergements touristiques",
    objet: "Décision de classement — attribution d'une étoile supplémentaire",
    corps:
      "À l'issue de la visite d'inspection, la commission relève la qualité des rénovations conduites et vous attribue une étoile supplémentaire. Le nouveau classement prend effet immédiatement et vaut pour cinq ans.",
    signataire: "La présidente de la commission",
    effet: "Capacité commerciale +6 % pendant 2 tours (un établissement ciblé)",
    enJeu:
      "L'entretien et la rénovation ne sont pas des charges subies : ils achètent du pouvoir de fixer les prix.",
    nature: "market",
    pli: "recommande",
    emoji: "✨",
    scope: "team",
  },
  {
    code: "hotel_banque_conciliante",
    expediteur: "Crédit Hôtelier · Agence entreprises",
    objet: "Réaménagement de votre crédit immobilier",
    corps:
      "Vos taux d'occupation des quatre derniers trimestres nous conduisent à réaménager votre échéancier à des conditions plus favorables. La nouvelle grille est jointe et s'applique dès la prochaine échéance.",
    signataire: "Votre chargé d'affaires",
    effet: "Taux d'intérêt ×0,7 pendant 2 tours (un établissement ciblé)",
    enJeu: "Un actif hôtelier bien exploité rassure : la garantie, c'est la trajectoire, pas seulement les murs.",
    nature: "macro",
    pli: "recommande",
    emoji: "🤝",
    scope: "team",
  },
  {
    code: "hotel_groupe_impromptu",
    expediteur: "Autocars Vasseur · Direction",
    objet: "Demande d'hébergement en urgence pour quarante passagers",
    corps:
      "Notre autocar est immobilisé sur l'autoroute à la suite d'une avarie. Quarante passagers doivent être logés ce soir. Nous réglons comptant à l'arrivée, dans la limite des chambres que vous pourrez libérer.",
    signataire: "Le responsable d'exploitation",
    effet:
      "+400 nuitées (échelle trimestre) vendues d'office ce tour, réglées comptant, dans la limite des chambres libres",
    enJeu: "L'aubaine ne profite qu'à ceux qui ont gardé des chambres disponibles : tout brader tôt a un coût caché.",
    nature: "market",
    pli: "simple",
    emoji: "🚌",
    scope: "team",
  },
  {
    code: "hotel_festival",
    expediteur: "Office de tourisme · Direction des grands événements",
    objet: "Première édition du festival d'été",
    corps:
      "La ville accueillera un festival de musique sur quatre jours, avec quarante mille visiteurs attendus. La capacité hôtelière de l'agglomération représente le tiers de ce besoin.",
    signataire: "Le directeur des grands événements",
    effet: "Demande globale +30 % ce tour",
    enJeu: "Une nuit complète à prix fort vaut trois nuits bradées : le yield management se joue sur ces semaines-là.",
    nature: "market",
    pli: "simple",
    emoji: "🎸",
    scope: "market",
  },
  {
    code: "hotel_major_breakdown",
    expediteur: "Froid Industriel Marchal · Rapport d'expertise",
    objet: "Défaillance du groupe froid central",
    corps:
      "Le compresseur du groupe central est hors d'usage et la machine n'est plus fabriquée. Le remplacement complet demande deux trimestres, délai de commande inclus. Les étages exposés au sud sont inexploitables en attendant.",
    signataire: "L'expert frigoriste",
    effet: "Disponibilité −30 % pendant 2 tours (une entreprise tirée au sort)",
    enJeu: "Risque opérationnel & maintenance préventive",
    nature: "internal",
    pli: "recommande",
    emoji: "🛑",
    scope: "team",
  },
  {
    code: "hotel_tech_obsolescence",
    expediteur: "Domotique Hôtelière Sénéchal · Service maintenance",
    objet: "Fin de support de vos serrures connectées",
    corps:
      "La génération installée dans votre établissement n'est plus suivie par le fabricant. Les pannes de badges et les blocages de porte vont se multiplier, et chaque intervention sera facturée en tarif hors contrat.",
    signataire: "Le responsable maintenance",
    effet: "Disponibilité −10 % et coût matières +8 % pendant 2 tours (une entreprise tirée au sort)",
    enJeu: "Cycle de vie des actifs & veille technologique",
    nature: "internal",
    pli: "recommande",
    emoji: "⏳",
    scope: "team",
  },
  {
    code: "hotel_used_equipment_deal",
    expediteur: "Étude Marchand · Commissaire-priseur judiciaire",
    objet: "Vente du mobilier d'un hôtel de charme en liquidation",
    corps:
      "Literie, luminaires et équipements de salle de bains, tous de gamme supérieure et de moins de trois ans, sont mis en vente en un seul lot. L'enlèvement doit intervenir sous quinzaine.",
    signataire: "Le commissaire-priseur",
    effet: "Disponibilité +12 % ce tour (équipe ciblée)",
    enJeu: "Décision d'investissement & coût d'opportunité",
    nature: "internal",
    pli: "simple",
    emoji: "🏭",
    scope: "team",
  },
  {
    code: "hotel_nouvel_hotel",
    expediteur: "Syndicat hôtelier départemental",
    objet: "Ouverture d'un établissement de chaîne à deux rues",
    corps:
      "Cent vingt chambres neuves ouvriront le mois prochain, petit-déjeuner inclus et tarif de lancement affiché pour un trimestre. La capacité du quartier augmente d'un quart sans que la demande bouge.",
    signataire: "Le président du syndicat",
    effet: "Demande globale −15 % pendant 2 tours",
    enJeu:
      "Une capacité nouvelle sur un marché stable se prend sur les voisins : le taux d'occupation d'équilibre remonte.",
    nature: "competition",
    pli: "simple",
    emoji: "🏨",
    scope: "market",
  },
  {
    code: "hotel_locations_particuliers",
    expediteur: "Observatoire local de l'hébergement",
    objet: "Progression des meublés de tourisme dans votre quartier",
    corps:
      "Le recensement annuel dénombre désormais plus d'appartements en location de courte durée que de chambres d'hôtel sur votre secteur. La clientèle loisirs, la plus sensible au prix, est la première concernée.",
    signataire: "Le chargé d'études",
    effet: "Demande du tourisme loisirs −20 % pendant 2 tours",
    enJeu:
      "Le segment le plus sensible au prix est le premier à partir : la clientèle affaires, elle, achète autre chose qu'un lit.",
    nature: "competition",
    pli: "simple",
    emoji: "🔑",
    scope: "market",
  },
  {
    code: "hotel_congres",
    expediteur: "Société savante de cardiologie · Comité d'organisation",
    objet: "Congrès annuel — demande de contingent de chambres",
    corps:
      "Notre congrès réunira trois mille praticiens pendant quatre jours. Nous recherchons un contingent de chambres auprès de chaque établissement de la ville, la capacité disponible étant inférieure au besoin.",
    signataire: "La secrétaire générale",
    effet: "Demande de la clientèle affaires +35 % ce tour",
    enJeu: "Quand la demande dépasse la capacité, la question n'est plus de remplir mais à quel prix.",
    nature: "market",
    pli: "recommande",
    emoji: "🩺",
    scope: "market",
  },
  {
    code: "hotel_chef_reconnu",
    expediteur: "Guide gastronomique régional · Rédaction",
    objet: "Entrée de votre restaurant dans notre sélection",
    corps:
      "L'arrivée d'un chef reconnu à la tête de votre table nous conduit à l'inscrire dans notre sélection annuelle. Nos lecteurs réservent volontiers une chambre pour dîner sans avoir à reprendre la route.",
    signataire: "Le rédacteur en chef",
    effet: "Demande de votre hôtel +10 % pendant 2 tours",
    enJeu:
      "Une activité annexe peut tirer l'activité principale : la marge se lit sur l'ensemble, pas service par service.",
    nature: "internal",
    pli: "simple",
    emoji: "👨‍🍳",
    scope: "team",
  },
  {
    code: "hotel_legionelle",
    expediteur: "Agence régionale de santé · Service santé-environnement",
    objet: "Mise en demeure — présence de légionelles dans votre réseau d'eau",
    corps:
      "Les prélèvements effectués dépassent le seuil réglementaire. Nous vous mettons en demeure de fermer l'étage concerné et de procéder à la désinfection complète du réseau. Un contrôle de conformité sera diligenté avant toute réouverture.",
    signataire: "L'ingénieur sanitaire",
    effet: "Chambres disponibles −40 % ce tour",
    enJeu:
      "Une chambre fermée coûte ses charges fixes sans rien rapporter : la disponibilité est la première ressource d'un hôtel.",
    nature: "internal",
    pli: "recommande",
    emoji: "🧪",
    scope: "team",
  },
];
