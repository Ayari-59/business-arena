/**
 * LE VIRAGE VERS LE DOMICILE — le contenu de l'épisode.
 *
 * Gratienne Dumoulinet est directrice générale adjointe de l'Association
 * Solvanne, chargée de la stratégie. Ce trimestre, d'avril à juin, le projet
 * de schéma départemental de l'autonomie gèle les places d'EHPAD et promet de
 * financer des solutions à domicile ; Orchidia Résidences ouvre une résidence
 * services seniors à Dijon ; le dispositif renforcé de soutien à domicile
 * expérimenté depuis janvier livre ses chiffres ; et le conseil
 * d'administration doit voter en juin le mandat de négociation du prochain
 * CPOM. Six décisions, chacune précédée de ce qu'une directrice de la
 * stratégie reçoit vraiment.
 *
 * Chaque chiffre qu'une source donne au joueur se recalcule depuis les
 * constantes du modèle : les recettes d'une place de Beaune et ce qu'une place
 * transformée perd ou gagne selon le financement, le compte d'une résidence
 * services et son seuil d'occupation, la marge d'une convention avec
 * Orchidia, ce que coûte le centre de ressources, le coût par personne du
 * dispositif renforcé, le compte d'un accueil de jour.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Association, personnes, entreprises et chiffres sont fictifs.
 */
import type { Etape } from "./types";

const NESTOR = {
  de: "Nestor Mongrenier",
  role: "Président du conseil d'administration",
} as const;
const URSULE = { de: "Ursule Mauvernay", role: "Directrice générale" } as const;
const EUDOXIE = {
  de: "Eudoxie Rambourg",
  role: "Directrice administrative et financière",
} as const;
const ADELPHE = {
  de: "Adelphe Mazerolle",
  role: "Trésorier du conseil d'administration",
} as const;
const DELPHIN = {
  de: "Delphin Diakhaby",
  role: "Responsable du pôle domicile (SSIAD et SAAD)",
} as const;
const YSOLDE = {
  de: "Ysolde Rouzeau",
  role: "Infirmière coordinatrice du dispositif renforcé",
} as const;
const CORENTINE = { de: "Corentine Baradat", role: "Directrice de l'EHPAD de Beaune" } as const;
const GRETA = {
  de: "Greta Quenardel",
  role: "Cadre de santé, EHPAD de Beaune",
} as const;
const IGNACE = {
  de: "Ignace Andrianjafy",
  role: "Médecin coordonnateur, EHPAD de Dijon-Montchapet",
} as const;
const MARIN = {
  de: "Marin Peyrebrune",
  role: "Directeur régional, Orchidia Résidences",
} as const;
const JEANNINE = {
  de: "Jeannine Mugneret",
  role: "Présidente du conseil de la vie sociale, EHPAD de Beaune",
} as const;
const DEPARTEMENT = {
  de: "Direction de l'autonomie",
  role: "Conseil départemental de la Côte-d'Or",
} as const;
const ARS = { de: "Délégation départementale", role: "Agence régionale de santé" } as const;

export const DIAGNOSTICS = [
  {
    id: "virage",
    t: "Les besoins et les financements se déplacent vers le domicile et le répit : il faut y développer notre offre par étapes testées, en nous appuyant sur le SSIAD et nos EHPAD, au rythme de ce que le département financera vraiment",
  },
  {
    id: "transformer",
    t: "Le schéma va vider nos EHPAD hors de Dijon : il faut transformer dès maintenant les places qui seront vides demain",
  },
  {
    id: "concurrent",
    t: "Orchidia va capter les seniors de Dijon : il nous faut une offre de résidence services pour garder notre public",
  },
  {
    id: "places",
    t: "Une liste d'attente de 210 personnes prouve que le besoin reste en places d'EHPAD : il faut défendre nos lits et obtenir ceux que le schéma gèle",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Le schéma gèle les places",
    jusqua: 2,
    messages: () => [
      {
        ...NESTOR,
        heure: "07:45",
        alerte: true,
        texte:
          "Gratienne, le projet de schéma de l'autonomie est sorti : aucune place d'EHPAD nouvelle jusqu'en 2031, des crédits pour des solutions renforcées à domicile. Le conseil arrête en juin l'orientation de notre prochain CPOM. Je veux votre proposition au bureau de vendredi.",
      },
      {
        ...ADELPHE,
        heure: "08:30",
        texte:
          "Et pendant ce temps, Orchidia construit une résidence services à 900 mètres de Montchapet. Nous avons 210 personnes en liste d'attente à Dijon : c'est des places qu'il faut demander, pas moins.",
      },
      {
        ...CORENTINE,
        heure: "09:10",
        texte:
          "À Beaune, nous sommes à 92 % d'occupation. Les familles gardent leurs parents plus longtemps à la maison ; ils arrivent chez nous plus âgés, plus dépendants. Si l'on m'enlève des places, je perds des recettes, et une partie de l'équipe.",
      },
      {
        ...DELPHIN,
        heure: "10:20",
        texte:
          "Le dispositif renforcé que nous testons avec Montchapet depuis janvier plaît beaucoup aux familles. Les chiffres complets arrivent début mai.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "tarifs",
        titre: "Décomposer, section par section, ce que rapporte une place de Beaune",
        cout: 1,
        nature: "decisive",
        resultat:
          "Une journée à Beaune se facture 72 € d'hébergement (payés par le résident ou l'aide sociale), 22 € de dépendance (le forfait du département et le talon du résident) et 38 € de soins (le forfait de l'ARS). Occupation : 92 %. Dans le CPOM, les crédits de soins d'une place transformée restent à l'association pour le nouveau service ; ce sont les recettes d'hébergement et de dépendance qui disparaissent : 31,6 k€ par place et par an. En face, une place transformée économise 17 k€ de charges qui suivent la place (restauration, blanchisserie, hôtellerie, part des agents de service) et rapporte 9,6 k€ de participations des personnes aux nouveaux services. Sans financement du département, chaque place transformée coûte donc 5,0 k€ par an.",
      },
      {
        id: "schema",
        titre: "Interroger la direction de l'autonomie sur le financement du schéma",
        cout: 1,
        nature: "decisive",
        resultat:
          "Le financement se vote le 22 juin, avec le budget supplémentaire. « Honnêtement : une chance sur deux que le schéma soit appliqué tel quel, trois sur dix qu'il soit différé faute de budget — rien de nouveau avant 2029 —, deux sur dix qu'il soit renforcé par des crédits de l'ARS. » S'il est appliqué, le département financera les plans d'aide renforcés à hauteur de 11 k€ par place transformée et par an, pour une vingtaine de places chez Solvanne ; renforcé, 13 k€ pour 28 places. Au-delà de ces places, rien. Si rien ne change chez nous, la direction prévoit dans nos EHPAD hors Dijon 3 places vides en moyenne par an si le schéma est appliqué, 1 s'il est différé, 5 s'il est renforcé ; une place vide coûte 20 k€ par an, charges ajustées. Les EHPAD qui offrent hébergement temporaire et accueil de jour en perdent moins : quatre admissions sur dix y passent d'abord.",
      },
      {
        id: "transformations",
        titre: "Demander à la fédération ce qu'ont vécu les gestionnaires qui ont transformé",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Dans le département voisin, deux associations ont transformé des places l'an dernier. L'une a vidé quarante places en neuf mois : admissions gelées, résidents accueillis ailleurs, un quart d'une année de recettes perdu sur ces places, et une équipe qui s'en va une fois sur deux quand on annonce une transformation de cette taille (130 k€ d'intérim et de recrutements). L'autre a transformé ses places au fil des départs naturels, sans déplacer personne : des places d'hébergement temporaire restent des places de l'EHPAD, et elle a pu en rouvrir quand le financement a tardé.",
      },
      {
        id: "brochure",
        titre: "Visiter le chantier d'Orchidia et lire sa brochure",
        cout: 1,
        nature: "bruit",
        resultat:
          "Cent dix logements du studio au trois-pièces, un restaurant, une salle de sport adaptée, une conciergerie. « Vivez libre, entouré. » Le chantier est soigné et la brochure aussi ; elle ne dit rien de ce qu'il advient quand un résident devient dépendant.",
      },
      {
        id: "conseil",
        titre:
          "Appeler Anneliese Teyssandier, ancienne directrice générale d'une association de l'Yonne",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Anneliese Teyssandier : « Ne demandez jamais ce que l'autorité de tarification vient d'écrire qu'elle ne donnera pas. Allez là où va l'argent, mais à son pas, pas au vôtre : une place transformée sans financement, c'est une place qui coûte. Et testez d'abord ce que vous savez faire, le soin et l'EHPAD ; laissez l'immobilier aux promoteurs. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Quelle orientation proposez-vous au bureau pour le prochain CPOM ?",
    options: [
      {
        t: "Défendre nos 480 places et demander 24 places de plus pour Dijon, où la liste d'attente déborde",
        d: "Un dossier d'extension de 15 k€ (programmiste, architecte), déposé au département en juin.",
      },
      {
        t: "Prendre le virage par étapes : 12 places de Beaune en hébergement temporaire au fil des départs, le pilote à domicile comme base, une candidature au centre de ressources",
        d: "30 k€ d'aménagements ; les places se transforment quand des chambres se libèrent, sans déplacer personne.",
      },
      {
        t: "Prendre le grand virage : transformer 40 places de Beaune en plateforme de services à domicile d'ici janvier",
        d: "Admissions gelées à Beaune dès le mois prochain ; une quinzaine de résidents accueillis dans nos autres EHPAD.",
      },
      {
        t: "Attendre que le département vote le financement du schéma, en juin, avant de proposer quoi que ce soit",
        d: "Rien n'est engagé ce trimestre ; le conseil tranchera à l'automne.",
      },
    ],
    reactions: [
      [
        {
          ...ADELPHE,
          texte: "Enfin une position claire. Le département verra que nous tenons à nos lits.",
        },
      ],
      [
        {
          ...CORENTINE,
          texte:
            "Douze places au fil des départs, je peux le faire sans déplacer personne. L'équipe d'hébergement temporaire, je la monte avec des volontaires.",
        },
      ],
      [
        {
          ...CORENTINE,
          texte:
            "J'annonce la nouvelle à l'équipe et aux familles jeudi. Je vous préviens : quand on dit « transformation », les soignants entendent « fermeture ».",
        },
        {
          ...JEANNINE,
          texte:
            "Les familles me demandent où iront leurs parents. Je souhaite que le conseil de la vie sociale soit réuni avant toute décision.",
        },
      ],
      [
        {
          ...NESTOR,
          texte: "Soit. Mais le département ne nous attendra pas pour répartir ses crédits.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Orchidia s'installe à Dijon",
    jusqua: 4,
    messages: () => [
      {
        ...ADELPHE,
        heure: "08:15",
        alerte: true,
        texte:
          "Le bureau veut une réponse sur Orchidia. Je propose notre propre résidence services : 80 logements à côté de Montchapet. La Banque Saônelle est prête à nous suivre.",
      },
      {
        ...MARIN,
        heure: "10:00",
        texte:
          "Madame Dumoulinet, notre résidence de Dijon ouvrira en septembre. Nos résidents entrent autonomes ; quand ils ne le sont plus, nous cherchons des partenaires. Je serais heureux d'en parler avec vous.",
      },
      {
        ...EUDOXIE,
        heure: "14:30",
        texte:
          "Une résidence services, c'est 11 M€ d'emprunt : près de quatre fois ce que notre plan pluriannuel d'investissement laisse disponible sur cinq ans.",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "compte",
        titre: "Établir le compte prévisionnel d'une résidence services de 80 logements",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "80 logements à 1 550 € par mois, loyer et services compris : 1 488 k€ de recettes par an s'ils sont tous loués. Charges d'exploitation : 600 k€. Emprunt de 11 M€ sur vingt-cinq ans : 704 k€ d'annuité à 4 %, 749 k€ à 4,6 % si la banque exige une caution. La résidence ne couvre ses charges qu'au-delà de 88 % d'occupation (91 % avec la caution). Orchidia a baissé ses prix d'environ 8 % six fois sur dix là où une résidence concurrente s'est installée ; les résidences voisines y sont restées à 85 % d'occupation, contre 93 % ailleurs. Il faudrait engager 100 k€ d'études tout de suite, et l'association n'a jamais commercialisé de logements.",
      },
      {
        id: "orchidia",
        titre: "Chercher ce qu'Orchidia a fait avec les gestionnaires médico-sociaux, ailleurs",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Orchidia n'a ni infirmiers ni aides à domicile : dans ses quatre autres résidences, elle a signé une convention avec un gestionnaire local sept fois sur dix quand il avait une offre à domicile et de l'hébergement temporaire à proposer, trois fois sur dix sinon. Vu notre orientation (${ctx.orientation}), le contrôle de gestion estime à ${ctx.chanceOrchidia} la chance qu'elle accepte. Une convention de parcours apporterait au SAAD environ 9 000 heures par an hors APA, au tarif libre de 31 €, pour 27,30 € de coût : 33 k€ par an ; et ses résidents viendraient à Montchapet quand la dépendance monte. Sans convention, Orchidia captera une partie de nos entrées à Montchapet : une place et demie par an, 30 k€. Face à une résidence concurrente, davantage.`,
      },
    ],
    question: "Que proposez-vous au bureau face à la résidence d'Orchidia ?",
    options: [
      {
        t: "Construire notre propre résidence services seniors à côté de Montchapet",
        d: "80 logements, 11 M€ empruntés sur vingt-cinq ans ; 100 k€ d'études engagés tout de suite.",
      },
      {
        t: "Proposer à Orchidia une convention de parcours : notre SSIAD et notre SAAD chez ses résidents, l'hébergement temporaire, puis Montchapet quand la dépendance monte",
        d: "Aucun investissement ; la réponse d'Orchidia est attendue dans trois semaines.",
      },
      {
        t: "Laisser Orchidia à son marché : une résidence services ne vise pas notre public",
        d: "Rien ne change.",
      },
      {
        t: "Baisser de 5 € le prix de journée des 30 places non habilitées à l'aide sociale de Montchapet",
        d: "53 k€ de recettes en moins par an ; un tarif plus proche de celui d'Orchidia.",
      },
    ],
    reactions: [
      null,
      [
        {
          ...MARIN,
          texte:
            "Votre proposition m'intéresse. Je dois la présenter à notre direction générale à Lyon ; vous aurez une réponse sous trois semaines.",
        },
      ],
      [
        {
          ...ADELPHE,
          texte: "Nous verrons en septembre qui avait raison.",
        },
      ],
      [
        {
          ...EUDOXIE,
          texte:
            "Le nouveau tarif s'appliquera aux entrées de mai. Je l'inscris à l'EPRD rectificatif.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Un centre de ressources territorial",
    jusqua: 6,
    messages: () => [
      {
        ...ARS,
        heure: "09:00",
        alerte: true,
        texte:
          "Appel à candidatures : un EHPAD centre de ressources territorial pour Dijon et la plaine de Saône. Dotation de 400 k€ par an : un volet d'appui aux professionnels du territoire, un volet d'accompagnement renforcé à domicile pour une trentaine de personnes. Dossiers attendus en semaine 6.",
      },
      {
        ...IGNACE,
        heure: "10:30",
        texte:
          "Montchapet peut le porter : l'astreinte gériatrique, la téléconsultation avec le centre hospitalier universitaire, le pilote à domicile, tout y est. Mais l'équipe ne se dédouble pas.",
      },
      {
        ...URSULE,
        heure: "12:00",
        texte:
          "Un consultant me dit qu'il faut promettre soixante personnes accompagnées à domicile pour être sûrs de gagner. Votre avis ?",
      },
      {
        ...DELPHIN,
        heure: "15:40",
        texte:
          "Mes infirmières sont déjà à flux tendu avec le pilote. Je ne sais pas où je trouverais de quoi tenir une mission de plus.",
      },
    ],
    sources: [
      {
        id: "cahier",
        titre: "Lire le cahier des charges et chiffrer la mission",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `La mission coûterait 355 k€ par an à Montchapet avec nos équipes et trente personnes accompagnées : 45 k€ d'excédent sur la dotation. Promettre soixante personnes la porterait à 430 k€ : 30 k€ de déficit chaque année. L'ARS note la crédibilité de l'offre à domicile existante et les partenariats du territoire ; avec ce que nous avons décidé (${ctx.orientation} ; ${ctx.orchidiaChoix}), le contrôle de gestion estime notre chance d'être retenus à ${ctx.chanceCRT} avec un dossier à trente personnes, ${ctx.chanceCRTPromesse} en en promettant soixante. Le volet domicile cofinancerait aussi le dispositif renforcé : 800 € par personne et par an.`,
      },
      {
        id: "voisin",
        titre: "Savoir qui d'autre candidate, et ce que cela change pour nos EHPAD",
        cout: 0.5,
        nature: "utile",
        resultat:
          "L'EHPAD public de la plaine de Saône candidate. Là où un EHPAD voisin a obtenu un centre de ressources, les gestionnaires alentour ont vu leurs places vides augmenter de 15 % : les familles accompagnées à domicile entrent chez celui qui les a suivies. Là où l'association l'a obtenu, ses EHPAD en ont perdu 30 % de moins.",
      },
    ],
    question: "Que faites-vous de l'appel à candidatures de l'ARS ?",
    options: [
      {
        t: "Candidater avec ce que nous savons faire : Montchapet porteur, le SSIAD et le pilote pour le volet domicile, les partenaires du territoire",
        d: "20 k€ de dossier ; trente personnes accompagnées, comme le prévoit le cahier des charges.",
      },
      {
        t: "Candidater en promettant soixante personnes accompagnées à domicile dès janvier, pour être sûrs de gagner",
        d: "25 k€ de dossier ; une offre deux fois plus large que le cahier des charges.",
      },
      {
        t: "Ne pas candidater : nos équipes sont prises, gardons nos forces pour nos EHPAD",
        d: "Rien à payer.",
      },
    ],
    reactions: [
      [
        {
          ...IGNACE,
          texte: "On s'y met. J'écris le volet médical ce week-end.",
        },
      ],
      [
        {
          ...DELPHIN,
          texte:
            "Soixante personnes ? Il me faudra huit infirmières et aides-soignantes de plus. Vous savez combien de temps je mets à en recruter une.",
        },
      ],
      [
        {
          ...IGNACE,
          texte: "Dommage. L'EHPAD public de la plaine candidate, lui.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Les chiffres du dispositif renforcé",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...YSOLDE,
        heure: "08:00",
        texte: `Cinq mois de dispositif renforcé : les vingt personnes accompagnées vivent toujours chez elles, aucune hospitalisation évitable. Parmi les familles de la liste d'attente à qui nous l'avons proposé, ${ctx.adhesion} l'ont choisi plutôt qu'une entrée en EHPAD. Le plan en supposait 80 %. Et les nuits nous coûtent plus que prévu.`,
      },
      {
        ...DELPHIN,
        heure: "09:30",
        alerte: true,
        texte:
          "Le plan voté en décembre prévoit de passer à 50 personnes au 1er septembre. Pour tenir la date, je dois lancer les recrutements lundi. On y va ?",
      },
      {
        ...DEPARTEMENT,
        heure: "14:00",
        texte: ctx.signal
          ? "Le département accepte de financer les plans d'aide renforcés des personnes du pilote jusqu'au vote du schéma."
          : "Le département ne prendra en charge aucun plan d'aide renforcé avant le vote du budget supplémentaire, et ne s'engage sur rien au-delà.",
      },
    ],
    sources: [
      {
        id: "couts",
        titre: "Décomposer le coût par personne et le financement du dispositif",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Le plan comptait 14 000 € par personne et par an ; le pilote en coûte 16 300 €, parce qu'une équipe de nuit propre passe chez chacun. Confier les passages de nuit à l'équipe de nuit de Montchapet ramènerait le coût à 15 300 €. Le financement : 12 500 € de forfait de l'ARS, plus le plan d'aide renforcé du département, 4 500 € si le schéma est appliqué, 6 000 € s'il est renforcé, 1 500 € s'il est différé. Sur les 80 familles éligibles, au taux d'adhésion constaté (${ctx.adhesion}), ${ctx.candidats} choisiraient le dispositif : pour 50 places, ${ctx.videsPlan} resteraient vides, et une place recrutée mais vide coûte le cinquième d'une place pleine.`,
      },
      {
        id: "familles",
        titre: "Rencontrer les familles du pilote avec Ysolde Rouzeau",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Les familles parlent d'abord des nuits : savoir que quelqu'un passe à 2 heures les fait tenir. Le dispositif marche pour les personnes très dépendantes qui ont un aidant à demeure ; pour celles qui vivent seules, beaucoup moins. Plusieurs demandent quelques semaines d'hébergement temporaire dans l'année pour souffler.",
      },
    ],
    question: "Que décidez-vous pour l'extension du dispositif renforcé ?",
    options: [
      {
        t: "Étendre à 50 personnes au 1er septembre, comme le plan le prévoit : les familles sont conquises",
        d: "Recrutements lancés lundi ; une équipe de nuit propre au dispositif.",
      },
      {
        t: "Réviser l'extension : 30 personnes choisies avec les familles, les nuits confiées à l'équipe de nuit de Montchapet",
        d: "Moins de recrutements ; un avenant à l'organisation de nuit de Montchapet.",
      },
      {
        t: "Arrêter le dispositif à la fin des crédits de l'ARS, en juin",
        d: "Les vingt personnes reviennent vers le SSIAD ou la liste d'attente.",
      },
    ],
    reactions: [
      [
        {
          ...DELPHIN,
          texte:
            "Les annonces partent lundi : six aides-soignantes et deux infirmières à trouver d'ici fin août.",
        },
      ],
      [
        {
          ...YSOLDE,
          texte:
            "Je revois la liste avec les familles. L'équipe de nuit de Montchapet passera chez nos personnes du quartier ; je prépare l'avenant avec la cadre de santé.",
        },
      ],
      [
        {
          ...YSOLDE,
          texte: "Je préviens les familles. Plusieurs vont redemander une place en EHPAD.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "L'accueil de jour de Beaune",
    jusqua: 10,
    messages: () => [
      {
        ...CORENTINE,
        heure: "08:45",
        alerte: true,
        texte:
          "L'aile de l'accueil de jour est prête à aménager : 12 places, ouverture en septembre, comme l'inscrit le projet de CPOM. J'ai besoin du feu vert pour commander les travaux, 60 k€.",
      },
      {
        ...GRETA,
        heure: "10:00",
        texte:
          "Les familles me disent qu'elles viendraient… s'il y avait un moyen de venir. Beaucoup d'aidants ne conduisent plus.",
      },
      {
        ...EUDOXIE,
        heure: "11:30",
        texte:
          "Un accueil de jour de 12 places ne couvre ses charges qu'au-delà de 63 % de remplissage, sans compter le transport. Je préférerais savoir avant d'ouvrir s'il se remplira.",
      },
    ],
    sources: [
      {
        id: "accueils",
        titre: "Comparer avec les accueils de jour du département",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Une journée de présence rapporte 80 € (forfait soins de l'ARS, participation de la personne, APA) ; 12 places ouvertes 250 jours portent 150 k€ de charges fixes. Sans transport organisé, les accueils de jour du département tournent à 65 % de leurs places là où la demande des aidants est forte, à 40 % là où elle est faible ; avec un minibus et un chauffeur (30 k€ par an, forfait transport déduit), à 90 % et à 60 %. Personne ne sait aujourd'hui si la demande est forte à Beaune : une chance sur deux. Une enquête auprès des aidants suivis par le SSIAD et le SAAD le dirait pour 12 k€ en quatre semaines, avant de commander l'aménagement.",
      },
      {
        id: "tournees",
        titre: "Demander à Delphin Diakhaby ce que les tournées du SSIAD peuvent transporter",
        cout: 0.5,
        nature: "utile",
        resultat:
          "« Pour six places, nos tournées du matin et du soir peuvent prendre les personnes : 15 k€ par an. » Un accueil de six places porterait 85 k€ de charges fixes et se remplirait à 85 % si la demande est faible, 95 % si elle est forte.",
      },
    ],
    question: "Que faites-vous de l'accueil de jour de Beaune ?",
    options: [
      {
        t: "Ouvrir les 12 places en septembre, comme prévu : les familles viendront",
        d: "60 k€ d'aménagement commandés lundi.",
      },
      {
        t: "Interroger d'abord les aidants, puis dimensionner l'accueil et son transport au vu de l'enquête",
        d: "12 k€, quatre semaines ; l'aménagement se commande en semaine 11.",
      },
      {
        t: "Ouvrir les 12 places avec un minibus et un chauffeur dès le départ",
        d: "60 k€ d'aménagement, 30 k€ par an de transport.",
      },
      {
        t: "Renoncer à l'accueil de jour",
        d: "L'aile reste fermée ; rien n'est dépensé.",
      },
    ],
    reactions: [
      [{ ...CORENTINE, texte: "Je commande les travaux lundi." }],
      [
        {
          ...GRETA,
          texte:
            "Je prépare le questionnaire avec le SSIAD et le SAAD : cent cinquante aidants à appeler.",
        },
      ],
      [{ ...CORENTINE, texte: "Le minibus sera livré fin août." }],
      [
        {
          ...GRETA,
          texte: "Je le dirai aux familles qui l'avaient demandé.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Le mandat de négociation du CPOM",
    jusqua: 13,
    messages: () => [
      {
        ...NESTOR,
        heure: "09:00",
        alerte: true,
        texte:
          "Le conseil vote jeudi le mandat de négociation du CPOM. La direction de l'autonomie nous propose un cadre ; je veux votre recommandation.",
      },
      {
        ...DEPARTEMENT,
        heure: "10:30",
        texte:
          "Deux cadres possibles : un engagement ferme de transformation de 40 places d'ici 2029, avec une aide de 150 k€ à la signature ; ou des objectifs par paliers. La dotation complémentaire du SAAD sera réservée aux gestionnaires engagés dans le schéma.",
      },
      {
        ...ADELPHE,
        heure: "11:15",
        texte:
          "Signons à l'identique : 480 places, rien de plus, rien de moins. Les schémas passent, les murs restent.",
      },
      {
        ...EUDOXIE,
        heure: "14:00",
        texte: "Les 150 k€ d'aide, c'est tout de suite, et c'est sûr.",
      },
    ],
    sources: [
      {
        id: "mandat",
        titre: "Chiffrer chaque cadre avec ce que nous avons déjà engagé",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `La dotation complémentaire du SAAD : 0,50 € par heure sur 95 000 heures, 47,5 k€ par an, versée si le schéma est appliqué ou renforcé, et seulement aux gestionnaires engagés ; s'il est différé, à personne. Nous avons déjà ${ctx.placesDeja} places de Beaune en transformation. L'engagement ferme en imposerait ${ctx.placesFerme} de plus, financées ou non : chaque place transformée rapporte 6,0 k€ par an (8,0 si le schéma est renforcé) dans la limite des places financées (une vingtaine si le schéma est appliqué, 28 s'il est renforcé), et en coûte 5,0 hors de cette limite, comme toutes si le schéma est différé. Les paliers ne transforment que les places que le vote finance, et la clause de revoyure permet de rouvrir jusqu'à 20 places transformées que personne ne finance. Un report d'un an fait perdre la première année de dotation.`,
      },
      {
        id: "vote",
        titre: "Faire le point sur le vote du 22 juin",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `${ctx.signal ? "Le département finance déjà les plans d'aide du pilote : bon signe." : "Le département a refusé de financer les plans d'aide du pilote avant le vote : mauvais signe."} Le contrôle de gestion estime désormais à ${ctx.differe} la probabilité que le financement du schéma soit différé.`,
      },
    ],
    question: "Quel mandat de négociation recommandez-vous au conseil ?",
    options: [
      {
        t: "Négocier un CPOM à l'identique : nos 480 places, sans objectif de transformation",
        d: "Aucun engagement ; le département garde la dotation complémentaire du SAAD.",
      },
      {
        t: "Négocier des objectifs par paliers : chaque étape conditionnée au financement voté, une clause de revoyure chaque année",
        d: "La dotation complémentaire du SAAD ; pas d'aide à la transformation.",
      },
      {
        t: "Signer l'engagement ferme : 40 places transformées d'ici 2029, contre 150 k€ d'aide",
        d: "150 k€ versés à la signature ; la dotation complémentaire du SAAD.",
      },
      {
        t: "Demander un an de report de la négociation, le temps que le schéma se précise",
        d: "Un avenant de prolongation du CPOM actuel ; rien ne change d'ici là.",
      },
    ],
    reactions: [
      [
        {
          ...DEPARTEMENT,
          texte:
            "Nous en prenons acte. La dotation complémentaire ira aux gestionnaires qui s'engagent.",
        },
      ],
      [
        {
          ...DEPARTEMENT,
          texte:
            "Les paliers nous conviennent, avec des indicateurs suivis chaque année en dialogue de gestion.",
        },
      ],
      [
        {
          ...EUDOXIE,
          texte: "J'inscris les 150 k€ à l'EPRD, et les 40 places au plan de transformation.",
        },
      ],
      [
        {
          ...DEPARTEMENT,
          texte: "Nous signerons un avenant d'un an. La dotation complémentaire attendra.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Le virage par étapes", chemin: [1, 1, 0, 1, 1, 1] },
  { nom: "Défendre nos lits", chemin: [0, 0, 2, 0, 0, 0] },
  { nom: "Attentiste", chemin: [3, 2, 2, 0, 3, 3] },
] as const;

/**
 * Les réflexes d'un conseil d'administration devant le virage domiciliaire :
 * défendre ses places et en demander d'autres, imiter le concurrent commercial,
 * ne pas candidater pour garder ses forces aux EHPAD, étendre un pilote comme
 * le plan le disait, ouvrir un service sans savoir qui viendra, signer un CPOM
 * à l'identique. [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [1, 0],
  [2, 2],
  [3, 0],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  banqueBase:
    "La Banque Saônelle accepte de financer la résidence à 4 % sur vingt-cinq ans, sans caution.",
  banqueCaution:
    "La Banque Saônelle exige la caution d'une collectivité, ou un taux de 4,6 % : la résidence n'est pas notre métier, nous dit-elle.",
  orchidiaAccepte:
    "Orchidia accepte la convention : notre SSIAD et notre SAAD interviendront dans sa résidence dès l'ouverture, et ses résidents seront orientés vers Montchapet quand ils ne pourront plus rester chez eux.",
  orchidiaRefuse:
    "Orchidia décline : elle a signé avec un service d'aide à domicile commercial de Dijon. « Votre offre est surtout une offre d'EHPAD », nous dit-on.",
  riposte:
    "Orchidia annonce ses prix d'ouverture : 8 % sous ceux de ses autres résidences, pour remplir vite. Notre résidence se remplira moins bien.",
  paix: "Orchidia ouvre à ses prix habituels : elle ne cherche pas la guerre des prix.",
  departs:
    "Trois aides-soignantes et une infirmière de Beaune ont donné leur démission ; deux autres demandent une mutation. Soralis Intérim Santé assurera les remplacements, au double du coût.",
  equipeTient:
    "L'équipe de Beaune tient : les soignants ont obtenu d'être reçus un par un sur leur nouveau poste.",
  crtGagne:
    "L'ARS retient le dossier de Solvanne : Montchapet sera le centre de ressources territorial de Dijon et de la plaine de Saône dès janvier.",
  crtPerdu:
    "L'ARS retient le dossier de l'EHPAD public de la plaine de Saône. Les familles accompagnées à domicile s'adresseront d'abord à lui.",
  demandeForte:
    "Enquête terminée : beaucoup d'aidants viendraient si l'on vient les chercher. La demande est forte : on ouvre 12 places, avec un minibus.",
  demandeFaible:
    "Enquête terminée : peu d'aidants sont prêts à confier leur proche plusieurs jours par semaine. La demande est faible : on ouvre 6 places, transportées par les tournées du SSIAD.",
  applique:
    "Le conseil départemental vote le financement du schéma tel qu'il était prévu : une vingtaine de places financées chez Solvanne, à 11 k€ par place et par an.",
  differe:
    "Le conseil départemental diffère le financement du schéma : rien de nouveau avant 2029. Le gel des places, lui, est maintenu.",
  renforce:
    "Le conseil départemental vote le schéma, et l'ARS ajoute des crédits : 28 places financées chez Solvanne, à 13 k€ par place et par an.",
} as const;
