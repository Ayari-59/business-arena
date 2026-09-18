import type { CourrierDef } from "../types";

/**
 * LA LIASSE D'ATLAS CONSEIL — cabinet de conseil régional.
 *
 * Un cabinet n'a ni murs ni machines : son courrier parle de gens et
 * d'engagements. Notifications de marchés, démissions, litiges, lettres
 * d'intention. C'est le secteur où l'expéditeur compte le plus, parce que la
 * capacité de production y porte un nom et un préavis.
 */
export const CONSEIL_COURRIERS: CourrierDef[] = [
  {
    code: "conseil_appel_offres_gagne",
    expediteur: "Centrale des marchés publics · Service des avis",
    objet: "Publication groupée d'avis de marchés d'études",
    corps:
      "La clôture budgétaire des collectivités approche : quarante et un avis de marchés d'assistance et d'études sont publiés cette semaine sur le département. Les délais de remise sont courts.",
    signataire: "Le service des avis",
    effet: "Demande du secteur public +40 % ce tour",
    enJeu:
      "Répondre suppose des consultants disponibles : un carnet plein est une bonne nouvelle qu'on ne peut pas toujours saisir.",
    nature: "market",
    pli: "simple",
    emoji: "📑",
    scope: "market",
  },
  {
    code: "conseil_depart_consultant",
    expediteur: "Lettre de démission · M. Aubert, consultant senior",
    objet: "Démission et demande de dispense de préavis",
    corps:
      "Je vous présente ma démission et vous demande d'être dispensé de préavis. Deux missions me sont confiées à ce jour, chez des clients avec lesquels je travaille depuis trois ans. Je reste disponible pour organiser leur reprise.",
    signataire: "M. Aubert",
    effet: "Capacité de production −14 % pendant 2 tours (un cabinet tiré au sort)",
    enJeu:
      "Dans les services, la capacité part le soir avec les salariés : la politique salariale est une décision industrielle.",
    nature: "internal",
    pli: "recommande",
    emoji: "🚪",
    scope: "team",
  },
  {
    code: "conseil_gel_budgets",
    expediteur: "Fédération du conseil · Note aux adhérents",
    objet: "Gel des budgets de conseil annoncé par les donneurs d'ordres",
    corps:
      "Notre enquête trimestrielle indique que sept directions générales sur dix suspendent les dépenses non engagées jusqu'à nouvel ordre. Les missions signées sont honorées ; les consultations en cours sont interrompues.",
    signataire: "Le délégué général",
    effet: "Demande globale −15 % pendant 2 tours",
    enJeu: "Les salaires tombent même quand le carnet est vide : c'est tout le risque d'une structure de coûts rigide.",
    nature: "macro",
    pli: "simple",
    emoji: "🧊",
    scope: "market",
  },
  {
    code: "conseil_recommandation",
    expediteur: "Groupe Vallois · Direction générale",
    objet: "Recommandation de votre cabinet auprès de nos partenaires",
    corps:
      "La mission que vous avez conduite chez nous a été citée en exemple lors de notre dernier comité de direction. Nous avons transmis vos coordonnées à deux groupes de notre secteur, qui vous contacteront dans les jours qui viennent.",
    signataire: "Le directeur général",
    effet: "Demande des grands comptes +35 % ce tour",
    enJeu:
      "La qualité livrée est le premier canal commercial du conseil : elle rapporte au tour suivant, pas au tour même.",
    nature: "market",
    pli: "simple",
    emoji: "🗣️",
    scope: "market",
  },
  {
    code: "conseil_frais_mission",
    expediteur: "Agence de voyages d'affaires Novaris",
    objet: "Revalorisation des tarifs négociés pour votre compte",
    corps:
      "Les tarifs professionnels du rail, de l'hôtellerie et de la restauration progressent de dix-huit pour cent sur l'ensemble de nos destinations. Vos accords-cadres sont révisés en conséquence pour les deux prochains trimestres.",
    signataire: "Votre chargée de compte",
    effet: "Frais variables par jour-conseil +18 % pendant 2 tours",
    enJeu:
      "Des frais refacturés au forfait qui dérapent, ce sont des points de marge perdus sur chaque journée vendue.",
    nature: "macro",
    pli: "simple",
    emoji: "🚄",
    scope: "market",
  },
  {
    code: "conseil_reglementation",
    expediteur: "Fédération du conseil · Veille réglementaire",
    objet: "Nouveau décret imposant un audit aux entreprises de plus de 250 salariés",
    corps:
      "Le décret paru au Journal officiel impose un audit de conformité dans les douze mois à toutes les entreprises de plus de deux cent cinquante salariés. Le marché s'ouvre pour l'ensemble de la profession, au même moment.",
    signataire: "Le responsable de la veille",
    effet: "Demande globale +20 % pendant 2 tours",
    enJeu:
      "Le marché s'ouvre pour tout le monde en même temps : le gagnant est celui qui a les consultants disponibles.",
    nature: "macro",
    pli: "simple",
    emoji: "⚖️",
    scope: "market",
  },
  {
    code: "conseil_credit_resserre",
    expediteur: "Banque des Professions · Direction des engagements",
    objet: "Révision des conditions de votre ligne de trésorerie",
    corps:
      "Votre activité ne présente aucun actif nantissable et votre poste clients constitue l'essentiel de votre bilan. Nous relevons le taux de votre ligne de trésorerie pour les deux prochains trimestres.",
    signataire: "Le directeur des engagements",
    effet: "Taux d'intérêt ×1,5 pendant 2 tours",
    enJeu: "Un métier sans immobilisations finance son BFR par le découvert : le poste clients devient le vrai sujet.",
    nature: "macro",
    pli: "recommande",
    emoji: "🏦",
    scope: "market",
  },
  {
    code: "conseil_cabinet_parisien",
    expediteur: "Fédération du conseil · Note aux adhérents",
    objet: "Implantation d'un cabinet national sur notre territoire",
    corps:
      "Un cabinet parisien ouvre un bureau en ville avec quinze consultants et une grille tarifaire agressive sur le segment des PME. Ses références nationales figurent déjà dans les consultations en cours.",
    signataire: "Le délégué général",
    effet: "Demande des PME −18 % pendant 2 tours",
    enJeu:
      "Face à un concurrent mieux armé, s'aligner sur les prix ou se différencier : les deux stratégies ne coûtent pas au même endroit.",
    nature: "competition",
    pli: "simple",
    emoji: "🏙️",
    scope: "market",
  },
  {
    code: "conseil_litige_client",
    expediteur: "Cabinet Lermite · Avocats, pour le compte de son client",
    objet: "Contestation du livrable et suspension du solde de la mission",
    corps:
      "Notre cliente conteste la conformité du livrable remis et suspend le règlement du solde. Une déclaration a été adressée à votre assureur de responsabilité civile professionnelle. Nous restons ouverts à une solution amiable.",
    signataire: "Maître Lermite",
    effet: "Capacité −20 % et frais variables +15 % pendant 2 tours (un cabinet ciblé)",
    enJeu:
      "C'est exactement le risque que couvre la responsabilité civile professionnelle : la prime valait-elle son prix ?",
    nature: "internal",
    pli: "recommande",
    emoji: "⚠️",
    scope: "team",
  },
  {
    code: "conseil_cyberattaque",
    expediteur: "Prestataire informatique Axone · Cellule de sécurité",
    objet: "Incident majeur — chiffrement de vos livrables et bases clients",
    corps:
      "Un rançongiciel a chiffré l'ensemble de vos dossiers. La dernière sauvegarde exploitable remonte à trois semaines : les travaux postérieurs sont perdus et devront être refaits.",
    signataire: "Le responsable de la sécurité",
    effet: "Capacité −28 % ce tour (un cabinet ciblé)",
    enJeu: "Dans un métier dont tout l'actif est immatériel, la donnée EST l'outil de production.",
    nature: "internal",
    pli: "recommande",
    emoji: "🔒",
    scope: "team",
  },
  {
    code: "conseil_prix_de_la_profession",
    expediteur: "Fédération du conseil · Jury du prix annuel",
    objet: "Attribution du prix de la profession à votre méthodologie",
    corps:
      "Le jury distingue votre démarche d'accompagnement, jugée reproductible et rigoureuse. La remise du prix sera relayée par la presse spécialisée et figurera dans notre annuaire pendant un an.",
    signataire: "La présidente du jury",
    effet: "Capacité commerciale +7 % pendant 2 tours (un cabinet ciblé)",
    enJeu: "L'investissement méthodologique n'apparaît nulle part au bilan : il se lit dans le taux d'occupation.",
    nature: "market",
    pli: "simple",
    emoji: "🏆",
    scope: "team",
  },
  {
    code: "conseil_banque_conciliante",
    expediteur: "Banque des Professions · Agence entreprises",
    objet: "Mise en place d'un financement de votre poste clients",
    corps:
      "La production de votre carnet de commandes signé nous permet de vous proposer une mobilisation de créances à des conditions préférentielles, pour les deux prochains trimestres.",
    signataire: "Votre chargé d'affaires",
    effet: "Taux d'intérêt ×0,7 pendant 2 tours (un cabinet ciblé)",
    enJeu: "Un carnet de commandes est une garantie : dans les services, on finance la confiance, pas les murs.",
    nature: "macro",
    pli: "recommande",
    emoji: "🤝",
    scope: "team",
  },
  {
    code: "conseil_mission_urgente",
    expediteur: "Groupe Sarrazin · Présidence",
    objet: "Demande de mission en urgence — direction financière par intérim",
    corps:
      "Notre directeur financier a quitté ses fonctions à trois semaines de la clôture. Nous cherchons une équipe capable d'intervenir immédiatement et réglons comptant. Votre réponse nous est nécessaire sous quarante-huit heures.",
    signataire: "Le président",
    effet:
      "+70 jours-conseil (échelle trimestre) vendus d'office ce tour, réglés comptant, dans la limite des jours disponibles",
    enJeu: "Un cabinet à 100 % d'occupation ne peut pas dire oui : garder de la marge de manœuvre a une valeur.",
    nature: "market",
    pli: "recommande",
    emoji: "🚨",
    scope: "team",
  },
  {
    code: "conseil_salon_professionnel",
    expediteur: "Salon régional des décideurs · Commissariat",
    objet: "Ouverture des inscriptions exposants",
    corps:
      "Deux jours de stands et de conférences réuniront les dirigeants et directeurs financiers de la région. L'édition précédente a rassemblé mille deux cents visiteurs qualifiés. Le plan de stand est joint.",
    signataire: "Le commissaire du salon",
    effet: "Demande globale +18 % ce tour",
    enJeu: "La prospection est une charge immédiate pour un chiffre d'affaires différé : c'est un pari, pas une dépense.",
    nature: "market",
    pli: "simple",
    emoji: "🤝",
    scope: "market",
  },
  {
    code: "conseil_major_breakdown",
    expediteur: "Prestataire informatique Axone · Direction technique",
    objet: "Défaillance matérielle de votre serveur de fichiers",
    corps:
      "La grappe de disques a lâché en totalité. Livrables, modèles de proposition et base clients sont inaccessibles. La restauration depuis les sauvegardes hors site demandera deux trimestres pour être complète.",
    signataire: "Le directeur technique",
    effet: "Disponibilité −30 % pendant 2 tours (une entreprise tirée au sort)",
    enJeu: "Risque opérationnel & plan de continuité d'activité",
    nature: "internal",
    pli: "recommande",
    emoji: "🛑",
    scope: "team",
  },
  {
    code: "conseil_tech_obsolescence",
    expediteur: "Prestataire informatique Axone · Service abonnés",
    objet: "Fin de maintenance de votre parc et de vos licences",
    corps:
      "Les postes installés il y a sept ans ne sont plus couverts, et l'éditeur cesse le support des licences correspondantes. Le temps perdu par consultant et le coût du support hors contrat vont augmenter sensiblement.",
    signataire: "Le responsable du support",
    effet: "Disponibilité −10 % et coût matières +8 % pendant 2 tours (une entreprise tirée au sort)",
    enJeu: "Cycle de vie des actifs & veille technologique",
    nature: "internal",
    pli: "recommande",
    emoji: "⏳",
    scope: "team",
  },
  {
    code: "conseil_used_equipment_deal",
    expediteur: "Cabinet Ferrand · Restructuration",
    objet: "Cession de nos stations de travail et licences transférables",
    corps:
      "Nous réduisons nos effectifs et cédons vingt stations de travail de gamme professionnelle, avec les licences transférables attachées. Le prix demandé représente le tiers de la valeur à neuf.",
    signataire: "L'associé gérant",
    effet: "Disponibilité +12 % ce tour (équipe ciblée)",
    enJeu: "Décision d'investissement & coût d'opportunité",
    nature: "internal",
    pli: "simple",
    emoji: "🏭",
    scope: "team",
  },
  {
    code: "conseil_plateforme_freelance",
    expediteur: "Fédération du conseil · Observatoire des pratiques",
    objet: "Progression des plateformes de consultants indépendants",
    corps:
      "Les plateformes de mise en relation affichent des tarifs journaliers inférieurs de moitié aux nôtres, sans structure ni garantie. Nos adhérents constatent que les PME comparent désormais le prix avant la méthode.",
    signataire: "Le responsable de l'observatoire",
    effet: "Demande des PME régionales −20 % pendant 2 tours",
    enJeu: "Face à un prix plus bas, on vend autre chose que du temps : la garantie, la continuité, l'équipe.",
    nature: "competition",
    pli: "simple",
    emoji: "💻",
    scope: "market",
  },
  {
    code: "conseil_grand_cabinet_public",
    expediteur: "Centrale des marchés publics · Service des avis",
    objet: "Résultats des dernières consultations du département",
    corps:
      "Les trois derniers marchés d'assistance ont été attribués à une équipe nationale, sur des critères de références antérieures. Les avis à venir reprennent les mêmes exigences de références.",
    signataire: "Le service des avis",
    effet: "Demande des marchés publics −25 % ce tour",
    enJeu:
      "Sur un marché à appel d'offres, la référence pèse plus que le prix : c'est un actif qui se construit mission après mission.",
    nature: "competition",
    pli: "simple",
    emoji: "🏛️",
    scope: "market",
  },
  {
    code: "conseil_partenariat_editeur",
    expediteur: "Éditeur Solveris · Direction des partenariats",
    objet: "Proposition d'accord de prescription",
    corps:
      "Nous recherchons un intégrateur régional à recommander à chacun de nos nouveaux clients pour la phase de déploiement. Votre cabinet est notre premier choix ; l'accord prévoit une exclusivité départementale.",
    signataire: "La directrice des partenariats",
    effet: "Demande de votre cabinet +12 % pendant 2 tours",
    enJeu: "Un canal d'apport d'affaires vaut un commercial : il coûte une commission ou une exclusivité, jamais rien.",
    nature: "market",
    pli: "recommande",
    emoji: "🤝",
    scope: "team",
  },
  {
    code: "conseil_debauchage",
    expediteur: "Note interne · Direction des ressources humaines",
    objet: "Départs simultanés de deux consultants seniors",
    corps:
      "Deux de nos seniors ont été approchés par un confrère et démissionnent le même jour. Leurs missions en cours vont ralentir et le délai moyen de recrutement sur ces profils dépasse quatre mois.",
    signataire: "La responsable des ressources humaines",
    effet: "Capacité de production −15 % pendant 2 tours",
    enJeu: "Dans les services, la capacité est humaine : elle part le vendredi soir, et la concurrence le sait.",
    nature: "competition",
    pli: "interne",
    emoji: "🎣",
    scope: "team",
  },
  {
    code: "conseil_plan_relance",
    expediteur: "Région · Direction du développement économique",
    objet: "Dispositif de cofinancement des missions de conseil aux PME",
    corps:
      "La Région prend en charge la moitié du coût des missions de conseil aux PME pour les six prochains mois. Les cabinets référencés, dont le vôtre, recevront les demandes des entreprises éligibles.",
    signataire: "La directrice du développement économique",
    effet: "Demande des PME régionales +30 % pendant 2 tours",
    enJeu:
      "Une subvention crée de la demande ; elle ne crée pas de consultants : la contrainte se déplace vers la capacité.",
    nature: "macro",
    pli: "recommande",
    emoji: "🏗️",
    scope: "market",
  },
];
