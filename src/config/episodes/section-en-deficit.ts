/**
 * LA SECTION QUI PLONGE — le contenu de l'épisode.
 *
 * Eudoxie Rambourg est directrice administrative et financière de
 * l'Association Solvanne. L'EHPAD d'Auxonne (64 places, habilité à l'aide
 * sociale) affiche 310 k€ de déficit à l'ERRD, et le conseil d'administration
 * veut supprimer deux postes d'aides-soignants. De septembre à novembre, elle
 * prépare les propositions budgétaires de l'an prochain et le dialogue de
 * gestion avec l'ARS et le département. Six décisions, chacune précédée de ce
 * qu'une DAF du secteur reçoit vraiment.
 *
 * Tous les chiffres des sources sont tirés des constantes du modèle
 * (src/engine/episodes/section-en-deficit.ts) ; le test de l'épisode en
 * recalcule plusieurs.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Association, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

const MONGRENIER = {
  de: "Nestor Mongrenier",
  role: "Président du conseil d'administration",
} as const;
const MAUVERNAY = { de: "Ursule Mauvernay", role: "Directrice générale" } as const;
const GAGNEPAIN = { de: "Bakary Gagnepain", role: "Directeur de l'EHPAD d'Auxonne" } as const;
const VASILESCU = { de: "Mihaela Vasilescu", role: "Contrôleuse de gestion, siège" } as const;
const BENMANSOUR = { de: "Fadila Benmansour", role: "Responsable de la paie, siège" } as const;
const ADEYEMI = {
  de: "Dr Nnamdi Adeyemi",
  role: "Médecin coordonnateur, EHPAD d'Auxonne",
} as const;
const TRUCHOT = { de: "Tassadit Truchot", role: "Infirmière coordinatrice (IDEC)" } as const;
const BICHOT = { de: "Ermeline Bichot", role: "Aide-soignante de nuit, élue au CSE" } as const;
const GAUTHEY = {
  de: "Rosemonde Gauthey",
  role: "Assistante de direction, chargée des admissions",
} as const;
const TARIFICATION = {
  de: "Service de la tarification",
  role: "Conseil départemental de la Côte-d'Or",
} as const;
const ARS = { de: "Délégation départementale de l'ARS", role: "Côte-d'Or" } as const;
const TARIVIA = { de: "Cabinet Tarivia", role: "Conseil en tarification" } as const;
const MONTAGUT = { de: "Cabinet Montagut", role: "Expertise comptable" } as const;
const TABLEAU = { de: "Tableau de bord de l'EHPAD", role: "Point hebdomadaire" } as const;

export const DIAGNOSTICS = [
  {
    id: "hebergement",
    t: "Le déficit est dans la section hébergement : un taux d'occupation trop bas et un prix de journée des places habilitées sous le coût de revient. Les aides-soignants, financés par le soins et la dépendance, n'y sont pour rien",
  },
  {
    id: "repartition",
    t: "Des charges de soins sont imputées à l'hébergement : la répartition entre les sections est fausse",
  },
  {
    id: "soignants",
    t: "L'établissement emploie plus d'aides-soignants que ses financements ne le permettent",
  },
  {
    id: "siege",
    t: "Les frais de siège et les charges de structure imputés à l'EHPAD sont trop lourds",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Le conseil veut supprimer deux postes",
    jusqua: 2,
    messages: () => [
      {
        ...MONGRENIER,
        heure: "07:45",
        alerte: true,
        texte:
          "Madame Rambourg, l'ERRD d'Auxonne affiche 310 k€ de déficit. Le bureau propose de supprimer deux postes d'aides-soignants : 86 k€ de charges en moins par an. Le conseil votera à sa séance d'octobre ; j'attends votre proposition d'ici là.",
      },
      {
        ...MAUVERNAY,
        heure: "08:30",
        texte:
          "Eudoxie, l'automne est la saison des propositions budgétaires et du dialogue de gestion avec l'ARS et le département. Le conseil veut un plan pour Auxonne avant la fin novembre : il faut qu'il tienne devant les autorités de tarification. À structure inchangée, les propositions reconduiraient l'ERRD : le taux directeur couvre à peu près les hausses de salaires.",
      },
      {
        ...BICHOT,
        heure: "09:10",
        texte:
          "La rumeur court dans l'équipe : deux postes supprimés. La nuit, nous sommes trois pour 64 résidents. Deux collègues en CDD m'ont dit qu'elles chercheraient ailleurs si c'est vrai.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "errd",
        titre: "Reprendre avec Mihaela Vasilescu le compte de la section hébergement",
        cout: 1,
        nature: "decisive",
        resultat:
          "21 608 journées facturées l'an dernier (92,5 % d'occupation), au prix de journée de 66,40 € arrêté par le département pour les 64 places habilitées à l'aide sociale. Charges imputées à l'hébergement : direction et administration 262 k€ ; agents de service hospitalier (70 % de leur masse salariale) 277 k€ ; restauration 266 k€ ; linge et entretien 94 k€ ; bâtiment (loyers, amortissements, frais financiers) 468 k€ ; énergie 124 k€ ; frais de siège 98 k€ ; autres charges 55 k€ ; personnel de nuit 129 k€.",
      },
      {
        id: "sections",
        titre: "Lire les sections soins et dépendance de l'ERRD",
        cout: 1,
        nature: "decisive",
        resultat:
          "Soins : forfait de l'ARS 761 k€, calculé sur le GMP de 668 et le PMP de 186 validés il y a trois ans ; charges 711 k€ (70 % des aides-soignants de jour, les infirmiers, l'IDEC, le médecin coordonnateur, les fournitures médicales) : excédent de 50 k€, que l'ARS reprendra comme le prévoit le CPOM. Dépendance : forfait global du département 325 k€ ; charges 347 k€ (30 % des aides-soignants de jour et des agents de service, la psychologue, les protections) : déficit de 22 k€. Les trois sections ne se compensent pas : chacune a son financeur.",
      },
      {
        id: "effectifs",
        titre: "Consulter le tableau des effectifs et la règle de répartition",
        cout: 0.5,
        nature: "utile",
        resultat:
          "16 aides-soignants (13 de jour, 3 de nuit), 11 agents de service hospitalier, 4 infirmiers, une IDEC, un médecin coordonnateur à 0,4 ETP, une psychologue à mi-temps. La règle impute les aides-soignants à 70 % sur le soins et 30 % sur la dépendance ; les agents de service à 70 % sur l'hébergement et 30 % sur la dépendance. Un aide-soignant coûte 43 k€ chargé par an.",
      },
      {
        id: "barometre",
        titre: "Lire l'étude nationale sur la situation financière des EHPAD",
        cout: 1,
        nature: "bruit",
        resultat:
          "Près d'un EHPAD sur deux est en déficit ; l'étude cite l'inflation des denrées et de l'énergie, les revalorisations salariales et les difficultés de recrutement. Elle ne distingue pas les sections tarifaires.",
      },
      {
        id: "conseil",
        titre: "Appeler Dariusz Kowalczyk, DAF d'une association de Saône-et-Loire",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Dariusz : « Un résultat d'EHPAD se lit section par section. Avant de couper quoi que ce soit, demande-toi qui finance la charge que tu coupes, et à qui revient l'économie. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que proposez-vous au conseil d'administration ?",
    options: [
      {
        t: "Soutenir la suppression des deux postes d'aides-soignants",
        d: "Deux CDD non renouvelés fin septembre : 86 k€ de charges en moins par an, affichés dès les propositions budgétaires.",
      },
      {
        t: "Présenter au conseil le résultat section par section, avec un plan pour chacune",
        d: "Une note refaite avec Mihaela Vasilescu : chaque section, sa cause, son financeur. Les deux postes restent.",
      },
      {
        t: "Ne plus remplacer les absences d'aides-soignants jusqu'à la fin de l'année",
        d: "Ni CDD ni intérim sur les absences : quelques milliers d'euros économisés d'ici décembre, sans supprimer de poste.",
      },
      {
        t: "Demander au conseil d'attendre les propositions budgétaires",
        d: "Rien ne change d'ici là ; le conseil se prononcera à sa séance d'octobre.",
      },
    ],
    reactions: [
      [
        {
          ...BICHOT,
          texte:
            "Les deux CDD partent fin septembre. Le matin, nous serons deux de moins pour les toilettes et les petits-déjeuners.",
        },
      ],
      [
        {
          ...MONGRENIER,
          texte:
            "Votre note est claire : je n'avais jamais vu le résultat présenté par financeur. Le bureau suspend la suppression des postes. Montrez-nous en novembre ce que chaque section aura obtenu.",
        },
      ],
      [
        {
          ...TRUCHOT,
          texte:
            "Sans remplacement, je refais les plannings chaque matin. On tiendra quelques semaines ; au-delà, ce sont les toilettes et les transmissions qui raccourcissent.",
        },
      ],
      [
        {
          ...MONGRENIER,
          texte:
            "Le bureau veut bien attendre, mais la séance d'octobre votera sur pièces. Si rien n'a bougé, la suppression passera.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Le personnel de nuit",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...VASILESCU,
        heure: "10:15",
        alerte: true,
        texte:
          "Eudoxie, en préparant les propositions budgétaires, je tombe sur la ligne « personnel de nuit » : 129 k€ imputés en entier à l'hébergement. Ce sont les trois aides-soignants de nuit.",
      },
      {
        ...BENMANSOUR,
        heure: "11:30",
        texte:
          "À l'ouverture de l'unité protégée, il y a deux ans, les trois postes de nuit ont été créés dans la paie sous le code « veilleur de nuit », qui part à 100 % sur l'hébergement. Personne ne l'a repris depuis.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Taux d'occupation de la semaine : ${ctx.occupation}. Absentéisme des soignants : ${ctx.absenteisme}. Résultat prévu pour l'an prochain, que l'association garderait : ${ctx.prevu}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "repartition",
        titre: "Refaire avec Mihaela la répartition des charges de nuit",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Les trois aides-soignants de nuit sont diplômés : la règle les impute à 70 % sur le soins et à 30 % sur la dépendance, comme ceux de jour. Corrigée, la ligne déplace 129 k€ : l'hébergement passe de −338 k€ à −209 k€, la dépendance de −22 k€ à −61 k€, le soins de +50 k€ à −40 k€. L'excédent de soins que l'ARS s'apprête à reprendre n'existe pas : ces crédits ont payé des soins.",
      },
      {
        id: "cpom",
        titre: "Relire le CPOM",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Le CPOM prévoit la reprise par l'ARS des excédents de la section soins et des crédits des postes non pourvus ou supprimés ; les excédents des sections hébergement et dépendance restent affectés à l'établissement. Toute modification de la répartition des charges doit être justifiée dans les propositions budgétaires.",
      },
      {
        id: "commissaire",
        titre: "Interroger le commissaire aux comptes",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Les comptes de l'association sont certifiés sans réserve. Le commissaire rappelle que sa mission porte sur les comptes annuels, et qu'il ne se prononce pas sur la répartition entre sections tarifaires.",
      },
    ],
    question: "Que faites-vous de la ligne de nuit ?",
    options: [
      {
        t: "Corriger l'imputation dans les propositions budgétaires, et retraiter l'ERRD pour le dialogue de gestion",
        d: "Trois aides-soignants imputés à 70 % sur le soins et à 30 % sur la dépendance. Une note de retraitement jointe aux dossiers de l'ARS et du département.",
      },
      {
        t: "Laisser l'ERRD tel quel : il est déposé, et les comptes sont certifiés",
        d: "Rien ne change ; la paie sera corrigée l'an prochain.",
      },
      {
        t: "Puisque le soins est en excédent, y imputer aussi une partie des agents de service",
        d: "20 % des agents de service passés sur la section soins : 79 k€ de charges en moins à l'hébergement.",
      },
      {
        t: "Commander au cabinet d'expertise comptable un audit complet de la répartition",
        d: "12 k€ d'honoraires ; conclusions attendues en semaine 10.",
      },
    ],
    reactions: [
      [
        {
          ...VASILESCU,
          texte:
            "C'est fait. La note de retraitement part avec les propositions budgétaires : l'hébergement à −209 k€, le soins à −40 k€. On verra si l'ARS discute.",
        },
      ],
      [
        {
          ...BENMANSOUR,
          texte: "Entendu, je garde le code « veilleur de nuit » jusqu'en janvier.",
        },
      ],
      [
        {
          ...VASILESCU,
          texte:
            "Je le fais, mais je te préviens : les agents de service ne figurent pas dans la règle d'imputation au soins. Si l'ARS regarde le détail, elle le verra.",
        },
      ],
      [
        {
          ...MONTAGUT,
          texte: "Nous commençons lundi par la paie et le grand livre ; comptez six semaines.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Le GMP et le PMP",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...ADEYEMI,
        heure: "08:20",
        alerte: true,
        texte:
          "Madame Rambourg, notre GMP de 668 et notre PMP de 186 datent de la coupe d'il y a trois ans. Depuis, l'unité protégée a ouvert, et les entrées viennent plus souvent de l'hôpital : à mon estimation, nous sommes à 742 et 221. L'ARS et le département tiennent une session de validation en semaine 10.",
      },
      {
        ...TRUCHOT,
        heure: "10:00",
        texte:
          "Pour une coupe, chaque évaluation GIR et chaque profil PATHOS doit être justifié dans Carnéo. Aujourd'hui, un dossier sur trois a des transmissions incomplètes.",
      },
      {
        ...TARIVIA,
        heure: "14:30",
        texte:
          "Notre cabinet réalise des coupes clés en main : nous avons fait gagner jusqu'à 80 points de GMP à des établissements de votre taille. Honoraires : 15 k€.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Résultat prévu pour l'an prochain : ${ctx.prevu}. Section soins prévue : ${ctx.soins} ; section hébergement : ${ctx.hebergement}.`,
      },
    ],
    sources: [
      {
        id: "equation",
        titre: "Refaire le calcul des forfaits avec Mihaela",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Le forfait soins vaut (GMP + 2,59 × PMP) × 64 places × 10,34 € ; le forfait dépendance, GMP × 64 places × 7,60 €, la valeur du point GIR départemental. Avec les valeurs validées (668 et 186) : 761 k€ et 325 k€. Avec celles qu'estime le Dr Adeyemi (742 et 221) : 870 k€ et 361 k€, soit 109 k€ de plus au soins et 36 k€ de plus à la dépendance. ${
            ctx.cleCorrigee
              ? "La ligne de nuit corrigée, le soins prévu est en déficit : le gain de forfait viendra d'abord le combler ; au-delà, l'excédent sera repris."
              : "Tant que la ligne de nuit reste à l'hébergement, le soins est déjà en excédent : tout gain de forfait soins serait repris par l'ARS."
          }`,
      },
      {
        id: "validation",
        titre: "Demander au médecin de l'ARS comment se passe la validation",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Les médecins valideurs de l'ARS et du département tirent des dossiers au sort et vérifient que chaque cotation est justifiée par le dossier de soins. Les coupes préparées (évaluations refaites, dossiers à jour) passent huit à neuf fois sur dix ; sans préparation, moins d'une fois sur deux. Une cotation jugée forcée fait réexaminer toute la coupe.",
      },
      {
        id: "plaquette",
        titre: "Lire la plaquette d'Orchidia Résidences",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Orchidia Résidences annonce « une prise en charge des grandes dépendances » dans ses résidences de Dijon, une unité Alzheimer et un prix de journée de 89 €. La plaquette ne donne ni GMP ni taux d'encadrement.",
      },
    ],
    question: "Comment abordez-vous la validation de la coupe ?",
    options: [
      {
        t: "Préparer la coupe : réévaluer chaque résident avec le Dr Adeyemi et l'IDEC, et mettre les dossiers à jour",
        d: "Six semaines de travail, 7 k€ de temps médical et infirmier en renfort. Validation en semaine 10.",
      },
      {
        t: "Demander la validation en semaine 10 avec les évaluations actuelles",
        d: "Aucun coût ; les dossiers restent en l'état.",
      },
      {
        t: "Confier la coupe au cabinet Tarivia",
        d: "15 k€ d'honoraires ; le cabinet cote les résidents et prépare les dossiers.",
      },
      {
        t: "Attendre la coupe prévue au renouvellement du CPOM, dans deux ans",
        d: "Rien ne change : les forfaits restent calculés sur 668 et 186.",
      },
    ],
    reactions: [
      [
        {
          ...ADEYEMI,
          texte:
            "Bien. Tassadit et moi commençons lundi par l'unité protégée : ce sont les profils qui ont le plus changé.",
        },
      ],
      [
        {
          ...TRUCHOT,
          texte:
            "On enverra les dossiers tels qu'ils sont. Je ne vous promets pas que tout tiendra devant les médecins valideurs.",
        },
      ],
      [
        {
          ...TARIVIA,
          texte: "Nos codeurs seront chez vous mardi. Vous verrez, le GMP va monter.",
        },
      ],
      [
        {
          ...ADEYEMI,
          texte: "Entendu. Je continuerai de coter au fil des entrées.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Le prix de journée",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...TARIFICATION,
        heure: "09:00",
        alerte: true,
        texte:
          "Madame, nous recevons les propositions budgétaires des établissements habilités jusqu'au 31 octobre. Le taux directeur départemental est de 0,8 % ; toute mesure au-delà doit être justifiée par le budget de la section hébergement.",
      },
      {
        ...GAGNEPAIN,
        heure: "11:20",
        texte:
          "Notre prix de journée de 66,40 € est le plus bas des six EHPAD de l'association. Orchidia Résidences facture 89 € à Dijon. Les familles me demandent pourquoi nous ne sommes jamais augmentés.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Résultat prévu pour l'an prochain : ${ctx.prevu}. Section hébergement prévue : ${ctx.hebergement}. Taux d'occupation de la semaine : ${ctx.occupation}.`,
      },
    ],
    sources: [
      {
        id: "cout",
        titre: "Calculer le coût de revient de la journée d'hébergement",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.cleCorrigee
            ? "Charges d'hébergement retraitées : 1 644 k€, dont 153 k€ de charges variables (7,10 € par journée). À 97 % d'occupation, soit 22 659 journées, la journée revient à 72,54 € pour un prix de 66,40 € : 6,14 € par journée ne sont financés par personne. Le département a accordé ailleurs des mesures de rattrapage de 3 à 4 € à des établissements qui l'avaient démontré par section."
            : "Avec la ligne de nuit à 100 % sur l'hébergement, la journée ressort à 78,24 € à 97 % d'occupation. Le service de la tarification écartera les charges qui relèvent du soins, et avec elles la crédibilité du dossier. Le département a accordé ailleurs des mesures de rattrapage de 3 à 4 € à des établissements qui l'avaient démontré par section.",
      },
      {
        id: "habilitation",
        titre: "Relire les règles d'habilitation à l'aide sociale",
        cout: 0.5,
        nature: "utile",
        resultat:
          "14 des 59 résidents actuels sont bénéficiaires de l'aide sociale à l'hébergement. Un établissement qui en accueille moins de la moitié peut demander au département une convention d'habilitation partielle : le prix des non-bénéficiaires devient libre, pour les nouveaux contrats seulement. Avec une vingtaine d'entrées par an, le gain monte progressivement : une trentaine de milliers d'euros la première année.",
      },
      {
        id: "cnr",
        titre: "Lire la note de l'ARS sur les crédits non reconductibles",
        cout: 0.5,
        nature: "utile",
        resultat:
          "L'ARS ouvre une enveloppe de crédits non reconductibles pour le matériel de soins (rails de transfert, lits médicalisés) et la prévention des chutes. Ces crédits relèvent de l'assurance maladie : ils financent la section soins.",
      },
    ],
    question: "Que demandez-vous, et à qui ?",
    options: [
      {
        t: "Demander au département une mesure de rattrapage du prix de journée, budget de l'hébergement à l'appui",
        d: "3,20 € par journée au-delà du taux directeur, avec le coût de revient de la journée et le détail des charges de la section.",
      },
      {
        t: "Demander au département une convention d'habilitation partielle à l'aide sociale",
        d: "Un prix libre pour les nouveaux résidents non bénéficiaires de l'aide sociale ; le prix des places habilitées ne bouge pas.",
      },
      {
        t: "Demander à l'ARS des crédits non reconductibles pour couvrir le déficit",
        d: "Un courrier à la délégation départementale, ERRD à l'appui.",
      },
      {
        t: "Ne rien demander cette année : le CPOM sera renégocié dans deux ans",
        d: "Le prix de journée suivra le taux directeur de 0,8 %.",
      },
    ],
    reactions: [
      [
        {
          ...GAGNEPAIN,
          texte:
            "Le dossier est parti au service de la tarification. Ils nous répondent d'ici deux semaines.",
        },
      ],
      null,
      [
        {
          ...ARS,
          texte:
            "Les crédits de l'assurance maladie financent la section soins : nous ne pouvons pas couvrir un déficit d'hébergement. Nous notons en revanche l'excédent de votre section soins.",
        },
      ],
      [
        {
          ...GAGNEPAIN,
          texte: "Entendu. Nous resterons à 66,40 € plus le taux directeur.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Les chambres vides",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...GAGNEPAIN,
        heure: "08:40",
        alerte: true,
        texte: `Taux d'occupation de la semaine : ${ctx.occupation}. Quatre chambres sont libres depuis plus d'un mois, et la liste d'attente compte neuf dossiers complets.`,
      },
      {
        ...GAUTHEY,
        heure: "10:10",
        texte:
          "La commission d'admission se réunit le premier mardi du mois. Entre la libération d'une chambre, la remise en état et la visite de la famille, il se passe en moyenne 45 jours.",
      },
      {
        ...TRUCHOT,
        heure: "15:30",
        texte:
          "Le centre hospitalier universitaire nous appelle chaque semaine pour des sorties de gériatrie. Si on les prenait sur dossier, sans visite, les chambres seraient pleines en quinze jours.",
      },
    ],
    sources: [
      {
        id: "admissions",
        titre: "Analyser le registre des admissions",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "28 départs l'an dernier, autant d'entrées. Délai moyen entre la libération d'une chambre et l'entrée suivante : 45 jours, dont 20 d'attente de la commission mensuelle et 14 de remise en état ; soit 1 260 journées perdues, 5,4 points d'occupation. Les hospitalisations de plus de 72 heures font le reste. Un point d'occupation, c'est 234 journées par an : 14 k€ de marge pour la section hébergement une fois payées les charges variables (7,10 € par journée). Rien pour le soins ni pour la dépendance, dont les forfaits sont calculés sur la capacité.",
      },
      {
        id: "attente",
        titre: "Relire les dossiers de la liste d'attente",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Neuf dossiers complets, dont quatre de patients du centre hospitalier universitaire en attente de sortie. Deux relèvent de l'unité protégée, déjà pleine. L'an dernier, trois des cinq admissions faites sans visite de préadmission se sont soldées par une réorientation dans les deux mois.",
      },
      {
        id: "communication",
        titre: "Recevoir l'agence de communication",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Une plaquette, une journée portes ouvertes et une campagne dans la presse locale : 6 k€. L'agence cite le taux de notoriété des EHPAD de Côte-d'Or, sans rien dire des délais d'admission.",
      },
    ],
    question: "Comment remplissez-vous les chambres ?",
    options: [
      {
        t: "Raccourcir le circuit d'admission : commission chaque semaine, visite de préadmission par l'IDEC, chambre remise en état en trois jours",
        d: "Un agent d'entretien à mi-temps (8 k€ par an), 3 k€ de renfort d'ici décembre.",
      },
      {
        t: "Admettre sur dossier, sans visite, les premiers de la liste d'attente",
        d: "Les chambres se remplissent en deux semaines ; pas de coût.",
      },
      {
        t: "Lancer une campagne de communication auprès des familles",
        d: "Plaquette, portes ouvertes et presse locale : 6 k€.",
      },
      {
        t: "Garder le circuit actuel",
        d: "La commission reste mensuelle.",
      },
    ],
    reactions: [
      [
        {
          ...GAUTHEY,
          texte: "Première commission hebdomadaire mardi : deux visites de préadmission dès jeudi.",
        },
      ],
      [
        {
          ...TRUCHOT,
          texte:
            "Trois entrées la semaine prochaine. Nous découvrirons leurs besoins en même temps qu'eux.",
        },
      ],
      [
        {
          ...GAUTHEY,
          texte: "La journée portes ouvertes aura lieu le samedi de la semaine 10.",
        },
      ],
      [
        {
          ...GAGNEPAIN,
          texte: "Entendu, prochaine commission début décembre.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Boucler les propositions",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...MONGRENIER,
        heure: "09:00",
        alerte: true,
        texte: ctx.postesSupprimes
          ? `Madame Rambourg, le conseil arrête les propositions budgétaires fin novembre. Résultat prévu pour Auxonne l'an prochain : ${ctx.prevu}, avec les deux postes déjà supprimés. Que proposez-vous de plus ?`
          : `Madame Rambourg, le conseil arrête les propositions budgétaires fin novembre. Résultat prévu pour Auxonne l'an prochain : ${ctx.prevu}. Le bureau redemande la suppression des deux postes au 1er janvier : 86 k€ de charges en moins.`,
      },
      {
        ...VASILESCU,
        heure: "11:00",
        texte: `${
          ctx.coupeValidee
            ? "La coupe est validée : les forfaits montent, et le soins prévu passe en excédent."
            : "La coupe n'a pas changé les forfaits."
        } Section soins prévue : ${ctx.soins}. Le siège ne peut porter qu'un seul chantier d'ici janvier.`,
      },
    ],
    sources: [
      {
        id: "chantiers",
        titre: "Chiffrer les chantiers possibles avec Mihaela",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Le linge plat externalisé et l'énergie passée au contrat du groupement d'achat du siège : 20 k€ de charges en moins par an, toutes à l'hébergement, 2 k€ de mise en place. Un pool de remplacement de nuit partagé avec les EHPAD de Dijon : 40 k€ d'intérim en moins, 12 k€ de coordination, 3 k€ de mise en place ; l'économie nette, 28 k€, se répartit à 70 % sur le soins et à 30 % sur la dépendance, comme les aides-soignants qu'elle remplace. Supprimer les deux postes : 60 k€ au soins, que l'ARS reprendrait sur le forfait, et 26 k€ à la dépendance.",
      },
      {
        id: "soins",
        titre: "Relire la section soins prévue",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          ctx.soinsExcedent
            ? `Section soins prévue l'an prochain : ${ctx.soins}. Une économie de plus sur le soins irait grossir un excédent que l'ARS reprendra.`
            : `Section soins prévue l'an prochain : ${ctx.soins}. Une économie sur le soins réduirait un déficit que l'association porte.`,
      },
    ],
    question: "Quel chantier portez-vous dans les propositions budgétaires ?",
    options: [
      {
        t: "Supprimer les deux postes d'aides-soignants au 1er janvier",
        d: "86 k€ de charges en moins dans les propositions, comme le demande le bureau.",
      },
      {
        t: "Réduire les charges de l'hébergement : linge plat externalisé, énergie au groupement d'achat",
        d: "20 k€ de charges en moins par an à l'hébergement, 2 k€ de mise en place.",
      },
      {
        t: "Créer un pool de remplacement de nuit avec les EHPAD de Dijon",
        d: "40 k€ d'intérim en moins par an, 12 k€ de coordination, 3 k€ de mise en place.",
      },
      {
        t: "Présenter les propositions telles qu'elles sont",
        d: "Pas de chantier supplémentaire.",
      },
    ],
    reactions: [
      [
        {
          ...BICHOT,
          texte:
            "Le compte rendu du conseil est affiché en salle de pause. L'équipe a lu « suppression de postes » avant que quiconque vienne l'expliquer.",
        },
      ],
      [
        {
          ...VASILESCU,
          texte:
            "La consultation pour le linge part lundi ; le groupement d'achat nous intègre au contrat d'énergie de janvier.",
        },
      ],
      [
        {
          ...TRUCHOT,
          texte:
            "Les cadres de Dijon sont partants : un planning commun pour les nuits dès janvier.",
        },
      ],
      [
        {
          ...MONGRENIER,
          texte: "Entendu. Le conseil votera les propositions en l'état.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Lire le budget par section", chemin: [1, 0, 0, 0, 0, 1] },
  { nom: "Couper dans les postes", chemin: [0, 2, 2, 2, 1, 0] },
  { nom: "Attentiste", chemin: [3, 1, 3, 3, 3, 3] },
] as const;

/**
 * Les réflexes du déficit global : supprimer des postes d'aides-soignants,
 * ne plus remplacer les absences, faire absorber au soins des charges qui
 * n'en relèvent pas, demander à l'ARS de couvrir l'hébergement, supprimer les
 * postes en fin de trimestre. [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [0, 2],
  [1, 2],
  [3, 2],
  [5, 0],
] as const;

export const REPONSES = {
  conseilImpose:
    "Madame Rambourg, faute d'éléments nouveaux, le conseil a voté ce soir la suppression des deux postes d'aides-soignants. Les deux CDD ne seront pas renouvelés.",
  conseilAttend:
    "Le conseil a entendu le point d'étape sur les sections. Il attendra les propositions de novembre pour se prononcer sur les postes.",
  detectee:
    "Au dialogue de gestion, nous avons relevé l'imputation d'agents de service à la section soins, que la règle ne prévoit pas. Nous la rejetons, et nous examinerons avec attention les autres éléments de votre dossier.",
  nonDetectee: "Le dialogue de gestion s'est tenu sans remarque sur la répartition des charges.",
  rattrapageOui:
    "Au vu du coût de revient de la journée et du détail des charges de la section, le département accorde une mesure de rattrapage de 3,20 € par journée à compter du 1er janvier.",
  rattrapageNon:
    "Le département ne peut retenir la mesure demandée : les charges présentées à l'hébergement comprennent des dépenses qui ne relèvent pas de cette section. Le prix de journée évoluera au taux directeur.",
  habilitationOui:
    "Le département accepte d'instruire une convention d'habilitation partielle : le prix des nouveaux résidents non bénéficiaires de l'aide sociale sera libre à compter du 1er janvier.",
  habilitationNon:
    "Le département ne souhaite pas réduire l'offre habilitée à l'aide sociale dans le secteur d'Auxonne. La demande n'est pas retenue.",
  coupeOui:
    "Les médecins valideurs de l'ARS et du département ont validé la coupe. Les nouveaux GMP et PMP s'appliqueront aux forfaits de l'an prochain.",
  coupeNon:
    "Les médecins valideurs n'ont pas validé la coupe : trop de cotations sans justification dans le dossier de soins. Les forfaits restent calculés sur 668 et 186.",
  audit:
    "Nos conclusions : les trois aides-soignants de nuit doivent être imputés à 70 % sur le soins et à 30 % sur la dépendance. La correction est reprise dans les propositions budgétaires.",
  inspection:
    "À la suite d'un signalement de chute grave la nuit, l'ARS a conduit une inspection. Elle demande un plan d'action sous un mois et le rétablissement des effectifs soignants.",
  reorientations:
    "Deux des résidents admis sans visite ont dû être réorientés vers une unité plus adaptée. Leurs familles l'ont mal vécu, et une chambre est de nouveau libre.",
} as const;
