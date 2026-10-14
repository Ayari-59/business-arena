/**
 * L'ABSENTÉISME QUI S'INSTALLE — le contenu de l'épisode.
 *
 * Valère Bellefontaine dirige l'EHPAD de Montbard, l'un des six EHPAD de
 * l'Association Solvanne : 70 places, dont une unité protégée, et 24 ETP
 * d'aides-soignants. L'absentéisme des aides-soignants atteint 16 %, les rappels
 * sur repos sont devenus hebdomadaires, et deux accidents du travail au dos ont
 * eu lieu ce mois-ci. Le conseil d'administration parle de prime d'assiduité et
 * de contre-visites. Six décisions, d'avril à juin, chacune précédée de ce
 * qu'un directeur d'EHPAD reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Les chiffres qu'elles donnent
 * sont ceux du modèle ; un test les recalcule.
 *
 * On parle de soignants qui se blessent en soignant, et de résidents qu'on
 * soulève : les messages restent sobres, et aucune option ne gagne en dégradant
 * la sécurité ou la dignité des résidents (faire faire des transferts à des ASH
 * non formées se paie).
 *
 * Association, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "causes",
    t: "L'absentéisme a deux moteurs qu'on peut traiter : les manutentions sans matériel, qui font les accidents et les arrêts pour le dos, et les rappels sur repos, qui fabriquent les arrêts courts",
  },
  {
    id: "dos",
    t: "Les manutentions sans matériel abîment les dos : les accidents du travail et les TMS font l'essentiel du problème",
  },
  {
    id: "assiduite",
    t: "Une partie de l'équipe abuse des arrêts courts : il manque une raison de venir travailler",
  },
  {
    id: "effectif",
    t: "L'établissement manque d'aides-soignants : 24 ETP pour 70 résidents, c'est trop juste",
  },
] as const;

const URSULE = {
  de: "Ursule Mauvernay",
  role: "Directrice générale, Association Solvanne",
} as const;
const ZOUBIDA = { de: "Zoubida Mérigot", role: "Infirmière coordinatrice (IDEC)" } as const;
const PERVENCHE = {
  de: "Pervenche Jacquemard",
  role: "Responsable administrative et RH",
} as const;
const KAHINA = {
  de: "Kahina Vuillemot",
  role: "Aide-soignante de nuit, élue au CSE",
} as const;
const FANTA = { de: "Fanta Bathily", role: "Aide-soignante" } as const;
const CONCEICAO = { de: "Conceição Figueira", role: "Aide-soignante" } as const;
const OUARDA = { de: "Ouarda Belorgey", role: "Aide-soignante" } as const;
const NARCISSE = { de: "Narcisse Lamblot", role: "Aide-soignant" } as const;
const TABLEAU = "Tableau de bord de l'établissement";

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Seize pour cent",
    jusqua: 2,
    messages: () => [
      {
        de: TABLEAU,
        role: "Alerte automatique",
        heure: "07:45",
        alerte: true,
        texte:
          "Absentéisme des aides-soignants sur douze mois : 16 %, le plus haut des six EHPAD de l'association (secteur : 10 à 14 %). 33 rappels sur repos en mars. Deux accidents du travail au dos ce mois-ci.",
      },
      {
        ...URSULE,
        heure: "08:40",
        texte:
          "Valère, l'intérim de Montbard a dépassé son budget au premier trimestre, et le CPOM vise 12 % d'absentéisme. Deux administrateurs proposent une prime d'assiduité, un autre des contre-visites médicales. J'attends ton plan pour le comité de direction de vendredi : le trimestre d'avril à juin doit montrer que ça baisse.",
      },
      {
        ...ZOUBIDA,
        heure: "09:15",
        texte:
          "Fanta Bathily s'est bloqué le dos jeudi en redressant un résident dans son lit : accident du travail, arrêt jusqu'à la fin de la semaine 6. C'est le deuxième ce mois-ci. Et j'ai encore rappelé Conceição sur son repos dimanche ; elle a dit oui, comme toujours.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "motifs",
        titre: "Décomposer les absences des douze derniers mois par motif",
        cout: 1,
        nature: "decisive",
        resultat:
          "Par motif, les journées d'absence des aides-soignants se répartissent ainsi : accidents du travail et arrêts pour le dos (lombalgies, épaules), 40 % ; arrêts courts de moins de huit jours, 30 % ; longues maladies et autres absences longues, 30 %. Les deux tiers des arrêts pour le dos suivent un transfert ou un redressement de résident très dépendant fait sans matériel : un seul lève-personne mobile pour deux étages, aucun rail au plafond. Quatre arrêts courts sur dix commencent dans les dix jours qui suivent un rappel de la même personne sur son repos.",
      },
      {
        id: "remplacements",
        titre: "Reprendre le coût des remplacements avec Pervenche Jacquemard",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Pervenche : « Au planning, 24 ETP d'aides-soignants, soit 120 journées de travail par semaine. Sur douze mois, les absences ont été couvertes à 40 % par des rappels sur repos (heures supplémentaires majorées et prime de rappel : 260 € la journée), à 35 % par des CDD de remplacement (210 € la journée) et à 25 % par Soralis Intérim Santé (380 € la journée, deux fois une journée salariée à 190 €). L'EPRD prévoit 204 000 € de remplacements pour les aides-soignants, calculés sur 12 % d'absentéisme. »",
      },
      {
        id: "lundis",
        titre: "Regarder quels jours commencent les arrêts courts",
        cout: 1,
        nature: "bruit",
        resultat:
          "Un arrêt court sur quatre commence un lundi (24 %), contre 17 à 21 % les autres jours de la semaine. Les arrêts ont tous un certificat médical ; aucun n'a été contesté.",
      },
      {
        id: "medecin",
        titre: "Appeler le médecin du travail",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Le docteur Lakhdar Zerdoumi : « Sur les quatorze visites de reprise de l'an dernier, neuf pour des lombalgies ou des épaules. Le matin, vos soignants font les transferts seuls, faute de collègue disponible. Là où des rails au plafond et des verticalisateurs sont posés, l'exposition du dos est divisée par deux. L'assurance maladie aide à les financer au titre des risques professionnels, sur dossier, sans garantie. »",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Corentine Baradat, directrice de l'EHPAD de Beaune",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Corentine : « Un taux ne se soigne pas. Découpe-le par motif, et pour chaque motif, cherche ce qui le déclenche. Et chiffre ce que te coûte une journée d'absence : c'est ça que le comité de direction écoutera. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que lancez-vous avant le comité de direction de vendredi ?",
    options: [
      {
        t: "Instaurer une prime d'assiduité : 80 € par mois pour chaque aide-soignant sans absence",
        d: "Dès avril. Environ 385 € par semaine, charges comprises. Deux administrateurs y sont favorables.",
      },
      {
        t: "Équiper les chambres des résidents les plus dépendants et former l'équipe à la manutention",
        d: "Rails au plafond dans 12 chambres et deux verticalisateurs : 26 800 €, posés en semaine 7. Une journée de formation par aide-soignant : 8 040 €, remplacements compris. Un dossier d'aide déposé auprès de l'assurance maladie.",
      },
      {
        t: "Faire contrôler chaque arrêt court par une contre-visite médicale",
        d: "Un médecin mandaté par l'établissement, 120 € la visite. Le message est clair.",
      },
      {
        t: "Couvrir les absences comme aujourd'hui",
        d: "Rappels, CDD et intérim au fil de l'eau. Rien à engager.",
      },
    ],
    reactions: [
      [
        {
          ...KAHINA,
          texte:
            "La prime est affichée en salle de pause. Fanta m'a demandé si elle la perdait, alors qu'elle s'est blessée en soignant. Je n'ai pas su quoi lui répondre.",
        },
      ],
      [
        {
          de: "Hayat Renevey",
          role: "Ergonome, service de prévention et de santé au travail",
          texte:
            "J'ai fait le tour des chambres avec Zoubida : les douze chambres sont choisies, la pose est prévue en semaine 7. La formation commence la semaine prochaine, par groupes de six.",
        },
      ],
      [
        {
          ...KAHINA,
          texte:
            "La première contre-visite a eu lieu vendredi : l'arrêt était justifié. Dans les vestiaires, on ne parle que de ça.",
        },
      ],
      [
        {
          ...URSULE,
          texte: "Je ne vois pas ce qui change, Valère. Le comité de direction attendait un plan.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Le planning de mai",
    jusqua: 4,
    messages: (ctx) => [
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "17:30",
        alerte: true,
        texte: `Absentéisme des aides-soignants en semaine 2 : ${ctx.taux}. Rappels sur repos : ${ctx.rappels} cette semaine. Intérim : ${ctx.interim} journées.`,
      },
      {
        ...PERVENCHE,
        heure: "14:10",
        texte:
          "Le planning de mai doit partir lundi. Comme d'habitude, je le publie quinze jours avant et on le rebouche au fil des absences ?",
      },
      {
        ...OUARDA,
        heure: "15:40",
        texte:
          "J'ai été rappelée trois fois sur mes repos en mars. Mes enfants ne savent plus quand je suis à la maison.",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "plannings",
        titre: "Relire les plannings de mars",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Le planning de mars, publié quinze jours avant, a été modifié 41 fois après publication. Sept rappels sur dix comblent une absence de la veille ou du jour même. À Beaune, depuis que les plannings sont publiés six semaines à l'avance et qu'un pool de deux aides-soignants remplace en priorité, les rappels sur repos ont été divisés par trois et les arrêts courts ont baissé d'un tiers.",
      },
      {
        id: "pool",
        titre: "Demander à Pervenche ce que coûterait un pool de remplacement",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Pervenche : « Deux aides-soignantes à temps partiel ont demandé un temps plein. Un pool de deux ETP coûterait 1 900 € par semaine (190 € la journée) et couvrirait environ 9 journées d'absence par semaine, congés déduits. Il pourrait démarrer en semaine 5. »",
      },
    ],
    question: "Comment bâtissez-vous les plannings ?",
    options: [
      {
        t: "Publier les plannings six semaines à l'avance et créer un pool de deux aides-soignants, à l'essai jusqu'à fin juin",
        d: "Le pool remplace en priorité, sur les deux étages. 1 900 € par semaine à partir de la semaine 5.",
      },
      {
        t: "Publier les plannings six semaines à l'avance, sans pool",
        d: "Plus de modification sans l'accord de la personne. Les absences restent couvertes par les rappels, les CDD et l'intérim.",
      },
      {
        t: "Porter la prime de rappel sur repos de 25 € à 60 €",
        d: "35 € de plus par rappel accepté : plus de volontaires, moins d'intérim.",
      },
      {
        t: "Garder les plannings à quinze jours, rebouchés au fil des absences",
        d: "Rien ne change.",
      },
    ],
    reactions: [
      null,
      [
        {
          ...OUARDA,
          texte:
            "Le planning est affiché jusqu'à mi-juin. C'est la première fois que je peux prendre un rendez-vous pour mes enfants. Mais on me rappelle toujours autant.",
        },
      ],
      [
        {
          ...PERVENCHE,
          texte:
            "Les volontaires sont plus nombreux, l'intérim baisse. Ce sont toujours les mêmes qui répondent.",
        },
      ],
      [
        {
          ...OUARDA,
          texte: "Encore un planning qui bougera trois fois d'ici la fin du mois.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Toujours les mêmes",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...PERVENCHE,
        heure: "11:20",
        alerte: true,
        texte:
          "Trois noms reviennent sans cesse dans les arrêts courts : Conceição Figueira, Ouarda Belorgey et Narcisse Lamblot. Un administrateur suggère des contre-visites pour eux. Je prépare les courriers ?",
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "17:30",
        texte: `Arrêts courts en semaine 4 : ${ctx.courts}. Rappels sur repos : ${ctx.rappels}. Absentéisme : ${ctx.taux}.`,
      },
    ],
    sources: [
      {
        id: "rappelsParPersonne",
        titre: "Compter les rappels sur repos, personne par personne",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Sur les douze dernières semaines : 92 rappels sur repos. Conceição, Ouarda et Narcisse en ont accepté 48 à eux trois : ils habitent Montbard, et disent rarement non. Ce sont aussi eux qui cumulent 11 des 22 arrêts courts de l'équipe, presque toujours dans la semaine qui suit un rappel.",
      },
      {
        id: "chalon",
        titre: "Demander à l'EHPAD de Chalon-sur-Saône ce qu'ont donné leurs contre-visites",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Chalon l'a fait l'an dernier : 22 contre-visites, un seul arrêt jugé injustifié. Dans les trois mois suivants, les refus de rappel ont doublé, et l'intérim a pris le relais.",
      },
    ],
    question: "Que faites-vous pour ces trois-là ?",
    options: [
      {
        t: "Mandater une contre-visite médicale à leur prochain arrêt",
        d: "120 € la visite. Le médecin dira si l'arrêt est justifié.",
      },
      {
        t: "Ne plus les rappeler au-delà de deux fois par mois : répartir les rappels par roulement sur toute l'équipe",
        d: "Une liste de rappel tenue par Zoubida. Quand personne d'autre n'est disponible, l'intérim.",
      },
      {
        t: "Les recevoir chacun en entretien de retour d'absence",
        d: "Une demi-heure avec chacun, sans enjeu disciplinaire, pour comprendre.",
      },
      {
        t: "Ne rien faire de particulier",
        d: "Leurs arrêts sont prescrits par un médecin.",
      },
    ],
    reactions: [
      [
        {
          ...CONCEICAO,
          texte:
            "Une contre-visite, pour moi ? Vingt-deux ans que je reviens sur mes repos dès qu'on m'appelle. J'ai compris.",
        },
      ],
      [
        {
          ...NARCISSE,
          texte:
            "La liste de rappel est affichée. Pour la première fois depuis Noël, j'ai eu deux week-ends de repos de suite.",
        },
      ],
      [
        {
          ...OUARDA,
          texte:
            "J'ai dit à Zoubida que je ne savais pas dire non quand on m'appelle. Elle a noté. On verra si ça change.",
        },
      ],
      [
        {
          ...PERVENCHE,
          texte:
            "Les courriers ne partent pas. Les trois continuent d'être rappelés : ce sont eux qui répondent.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Le retour de Fanta",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...FANTA,
        heure: "10:05",
        alerte: true,
        texte:
          "Mon arrêt se termine ce soir. Je veux revenir lundi, l'équipe a besoin de moi. Mais j'ai peur des toilettes du matin et des transferts du premier étage.",
      },
      {
        ...ZOUBIDA,
        heure: "11:30",
        texte: `Lundi, je la remets sur son secteur ? Il y a quatre résidents en GIR 1 au premier étage. ${
          ctx.equipe
            ? "Les rails sont posés dans les douze chambres la semaine prochaine, et les verticalisateurs sont arrivés."
            : "Toujours un seul lève-personne pour les deux étages."
        }`,
      },
    ],
    sources: [
      {
        id: "preReprise",
        titre: "Lire l'avis du médecin du travail après la visite de pré-reprise",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Le docteur Zerdoumi : « Après une lombalgie et six semaines d'arrêt, dans une équipe qui tient, ${
            ctx.equipe ? "et avec le matériel que vous posez, " : "et sans matériel, "
          }une reprise à plein poste rechute dans les deux mois dans ${ctx.rechutePlein} des cas ; une reprise aménagée, sans transferts lourds pendant quatre semaines et en binôme, dans ${ctx.rechuteAmenagee} ; un temps partiel thérapeutique à 60 % pendant cinq semaines, dans ${ctx.rechuteTpt}. Quand d'autres arrêts pour le dos tombent avant sa reprise, l'équipe est à court et on lui redonne vite les transferts lourds : ces risques sont multipliés par deux et demi, ou par quatre, sauf à temps partiel. Une rechute après une reprise à plein poste, c'est douze semaines d'arrêt ; huit après une reprise aménagée ; quatre à temps partiel. »`,
      },
      {
        id: "equipeAuDos",
        titre: "Faire le point sur les arrêts pour le dos depuis avril",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `Depuis avril : ${ctx.arretsDos}. Journées d'absence pour le dos cette semaine : ${ctx.dos}. Absentéisme : ${ctx.taux}.`,
      },
    ],
    question: "Comment organisez-vous la reprise de Fanta ?",
    options: [
      {
        t: "La reprendre à plein poste, sur son secteur habituel",
        d: "C'est ce qu'elle demande, et rien à payer.",
      },
      {
        t: "Reprise aménagée : pas de transferts lourds pendant quatre semaines, en binôme",
        d: "Après la visite de pré-reprise. Une journée et demie de renfort par semaine pendant quatre semaines, moins si le matériel est posé.",
      },
      {
        t: "Accepter le temps partiel thérapeutique à 60 % que propose son médecin",
        d: "Cinq semaines, deux journées par semaine à remplacer. Elle reprend à plein temps en juin.",
      },
    ],
    reactions: [
      [
        {
          ...FANTA,
          texte:
            "Je suis revenue sur mon secteur. Le premier matin, j'ai fait les quatre transferts du couloir. Je serre les dents.",
        },
      ],
      [
        {
          ...ZOUBIDA,
          texte:
            "Fanta est en binôme avec Narcisse : les transferts lourds, c'est lui. Elle reprend confiance, et elle forme les nouvelles aux toilettes.",
        },
      ],
      [
        {
          ...FANTA,
          texte:
            "Trois jours par semaine, sur les soins les plus légers. Le docteur Zerdoumi me revoit dans un mois.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Les matins du premier étage",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...ZOUBIDA,
        heure: "09:20",
        alerte: true,
        texte:
          "Entre 7 h et 10 h 30, on fait toutes les toilettes et presque tous les transferts. Les soignants courent, et des résidents attendent leur tour au bord du lit.",
      },
      {
        ...KAHINA,
        heure: "13:45",
        texte:
          "Deux ASH proposent d'aider aux transferts le matin pour soulager les aides-soignants. Elles sont volontaires.",
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "17:30",
        texte: `Absentéisme en semaine 8 : ${ctx.taux}. Arrêts pour le dos : ${ctx.dos} cette semaine.`,
      },
    ],
    sources: [
      {
        id: "matin",
        titre: "Chronométrer trois matins avec Zoubida",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "23 des 26 transferts lourds de la journée ont lieu entre 7 h et 10 h 30, à huit aides-soignants pour 70 résidents. Onze résidents sont réveillés avant 7 h 30 alors que leur projet personnalisé dit qu'ils préfèrent se lever plus tard ; plusieurs aimeraient leur toilette après le petit-déjeuner. Le reste de la matinée, l'équipe est moins chargée.",
      },
      {
        id: "ash",
        titre: "Relire la fiche de poste des ASH et les événements indésirables de l'association",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Les ASH ne sont pas formées aux transferts, et leur fiche de poste ne le prévoit pas : ce serait un glissement de tâches. L'an dernier, à l'EHPAD d'Auxonne, une chute pendant un transfert fait par une ASH a donné lieu à une déclaration d'événement indésirable et à une réclamation de la famille.",
      },
    ],
    question: "Que changez-vous aux matins ?",
    options: [
      {
        t: "Revoir l'organisation du matin avec l'équipe : les toilettes selon les habitudes de chaque résident, les transferts lourds répartis sur la matinée",
        d: "Plans de soins et fiches de tâches à refaire avec Zoubida : 1 500 €. En place en semaine 10.",
      },
      {
        t: "Ajouter une aide-soignante d'intérim de 7 h à 11 h jusqu'à fin juin",
        d: "950 € par semaine, de la semaine 9 à la semaine 13.",
      },
      {
        t: "Accepter que les ASH aident aux transferts du matin",
        d: "Elles sont volontaires. Rien à payer.",
      },
      {
        t: "Garder l'organisation actuelle",
        d: "Les matins resteront ce qu'ils sont.",
      },
    ],
    reactions: [
      [
        {
          ...ZOUBIDA,
          texte:
            "Les plans de soins sont refaits. Mme R. prend son petit-déjeuner avant sa toilette, comme elle l'a toujours voulu, et les transferts s'étalent jusqu'à 11 h 30.",
        },
      ],
      [
        {
          de: "Yvelise Pontarlier",
          role: "Chargée de clientèle, Soralis Intérim Santé",
          texte: "Une aide-soignante sera là chaque matin de 7 h à 11 h jusqu'à fin juin.",
        },
      ],
      [
        {
          de: "Thilelli Bidaut",
          role: "Agente de service hospitalier",
          texte:
            "On aide aux transferts le matin. On n'a jamais appris, alors on fait comme on voit faire.",
        },
      ],
      [
        {
          ...ZOUBIDA,
          texte: "Rien ne change le matin. Les soignants courent toujours.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Ce qu'on garde",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...URSULE,
        heure: "08:50",
        alerte: true,
        texte: `Valère, le comité de direction prépare l'EPRD de l'an prochain. Des administrateurs veulent une prime d'assiduité dans tous nos établissements, et proposent Montbard comme pilote. ${
          ctx.pool
            ? "Ton pool de remplacement est à l'essai jusqu'à fin juin : on le garde ?"
            : "Tu n'as pas de pool : d'autres directeurs en demandent un."
        } Il me faut ta position lundi.`,
      },
      {
        de: TABLEAU,
        role: "Point hebdomadaire",
        heure: "17:30",
        texte: `Absentéisme en semaine 10 : ${ctx.taux}. Coût des remplacements et des mesures depuis avril : ${ctx.cout}.`,
      },
    ],
    sources: [
      {
        id: "fam",
        titre: "Demander au foyer d'accueil médicalisé ce qu'a donné sa prime d'assiduité",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Le FAM de l'association a instauré une prime d'assiduité il y a deux ans : les arrêts courts ont baissé de 7 %, les accidents du travail pas du tout. Deux salariées privées de prime après un accident du travail ont saisi le CSE ; l'une est partie.",
      },
      {
        id: "semaine",
        titre: "Relire la semaine avec Pervenche",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          `Cette semaine : ${ctx.rappels} rappels sur repos, ${ctx.interim} journées d'intérim, ${ctx.courts} d'arrêts courts. En mars, l'établissement en était à 33 rappels par mois. ${
            ctx.pool
              ? "Sans le pool, ses 9 journées par semaine repasseraient en rappels et en intérim."
              : "Les absences restent couvertes en rappels, en CDD et en intérim."
          }`,
      },
    ],
    question: "Que proposez-vous au comité de direction ?",
    options: [
      {
        t: "Accepter que Montbard soit pilote de la prime d'assiduité, financée sur l'enveloppe des remplacements",
        d: "80 € par mois et par aide-soignant sans absence, dès juin. L'essai du pool, s'il existe, s'arrête fin juin.",
      },
      {
        t: "Pérenniser un pool de deux aides-soignants et les plannings à six semaines, et les inscrire à l'EPRD",
        d: "Deux postes de plus au tableau des effectifs : 1 900 € par semaine. Le pool est créé en juillet s'il n'existe pas.",
      },
      {
        t: "Laisser l'essai s'arrêter fin juin et revenir aux remplacements au fil de l'eau",
        d: "L'absentéisme baisse : deux postes de plus ne se justifient plus.",
      },
    ],
    reactions: [
      [
        {
          ...KAHINA,
          texte:
            "La prime est annoncée pour juin. Celles qui se sont blessées en soignant demandent si elles en seront privées.",
        },
      ],
      [
        {
          ...URSULE,
          texte:
            "Les deux postes sont inscrits à l'EPRD. Je présenterai Montbard au conseil d'administration comme exemple.",
        },
      ],
      [
        {
          ...PERVENCHE,
          texte:
            "Entendu. Pour l'été et la rentrée, je repars sur les rappels et Soralis Intérim Santé.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Traiter les causes, motif par motif", chemin: [1, 0, 1, 1, 0, 1] },
  { nom: "Prime, contrôle et bras en plus", chemin: [0, 2, 0, 0, 2, 0] },
  { nom: "Attentiste", chemin: [3, 3, 3, 0, 3, 2] },
] as const;

/**
 * Les réflexes du métier sous pression, [décision, option] : traiter l'absentéisme
 * comme un défaut d'assiduité, par une prime ou par des contre-visites. Majorer la
 * prime de rappel ou faire aider les ASH n'y figurent pas : ce sont de mauvaises
 * réponses, mais pas celles qui soupçonnent l'équipe.
 */
export const REFLEXES = [
  [0, 0],
  [0, 2],
  [2, 0],
  [5, 0],
] as const;

export const REPONSES = {
  poolComplet:
    "Deux aides-soignantes à temps partiel, Kiné Doucouré et Rosário Mesquita, passent à temps plein dans le pool en semaine 5.",
  poolUne:
    "Une seule candidate en interne, Kiné Doucouré : le pool démarre avec elle en semaine 5. La seconde, recrutée à l'extérieur, arrive en semaine 9.",
  aideAccordee:
    "L'assurance maladie retient notre dossier au titre de la prévention des risques professionnels : elle prend en charge 40 % du matériel, soit 10 720 €.",
  aideRefusee:
    "Notre dossier d'aide n'est pas retenu cette année : l'enveloppe régionale est épuisée. Nous pourrons le redéposer l'an prochain.",
  departAnnonceControle:
    "Valère, je pars à la fin de la semaine 10. J'ai trouvé une place au centre hospitalier. Vingt-deux ans à revenir sur mes repos, et on m'envoie un médecin pour vérifier mes arrêts : c'est fini.",
  departAnnonce:
    "Valère, je pars à la fin de la semaine 10. J'ai trouvé une place au centre hospitalier, avec des repos qu'on ne touche pas. Je suis fatiguée.",
} as const;
