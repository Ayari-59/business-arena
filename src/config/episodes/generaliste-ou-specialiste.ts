/**
 * RESTER GÉNÉRALISTE OU SE SPÉCIALISER — le contenu de l'épisode.
 *
 * Victoire Lanoë préside Atlas Conseil : 240 collaborateurs, siège à Nantes.
 * Halden Partners, cabinet national, ouvre un bureau à Nantes en semaine 3
 * et vend ses missions généralistes 15 % sous les prix d'Atlas. L'associé des
 * missions généralistes veut s'aligner ; la responsable de la petite équipe
 * santé refuse des missions faute de monde. Le comité de direction attend la
 * recommandation de positionnement de la présidente pour les trois ans qui
 * viennent. Six décisions, de septembre à novembre, chacune précédée de ce
 * qu'une présidente de cabinet reçoit vraiment.
 *
 * Chaque chiffre qu'une source donne au joueur se recalcule depuis les
 * constantes du modèle : les jours et les TJM par type de mission, la perte
 * de transformation que Halden a causée à Lille, ce que coûte une remise aux
 * clients historiques, la part des cas où chaque test se trompe, ce que vaut
 * l'étape suivante dans chaque scénario, ce que coûte chaque réponse au GHT.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprises, établissements, personnes et chiffres sont fictifs.
 */
import type { Contexte, Etape } from "./types";

const MAHDI = { de: "Mahdi Ouertani", role: "Associé, missions généralistes" } as const;
const LEOPOLDINE = { de: "Léopoldine Quéffelec", role: "Responsable de l'équipe santé" } as const;
const GUSTAVE = {
  de: "Gustave Herbelin",
  role: "Directeur administratif et financier",
} as const;
const LOEIZ = { de: "Loeiz Penfrat", role: "Directeur du bureau de Rennes" } as const;
const PRUNE = { de: "Prune Lecoeur", role: "Contrôleuse de gestion" } as const;
const SOUMAYA = {
  de: "Soumaya Rahmouni",
  role: "Directrice générale des Laiteries Quénéhervé",
} as const;
const SIXTE = { de: "Sixte Dauvergne", role: "Associé, Kéroual Consulting" } as const;
const GLENN = {
  de: "Glenn Tanguel",
  role: "Directeur des achats du GHT Loire-Océan",
} as const;
const ADAEZE = { de: "Adaeze Eze", role: "Ancienne directrice générale de CHU" } as const;

const s = (ctx: Contexte, cle: string) => String(ctx[cle] ?? "");

export const DIAGNOSTICS = [
  {
    id: "specialisation",
    t: "Sur les missions généralistes, Halden gagne au prix et peut toujours baisser plus que nous ; notre avantage défendable est là où nos références et notre expertise sont rares, la transformation des hôpitaux et du médico-social : il faut s'y spécialiser, par étapes et en testant, sans brader le généraliste",
  },
  {
    id: "differenciation",
    t: "Il ne faut pas suivre Halden sur le prix : il faut se différencier par la qualité et la proximité, sur toutes nos missions, et laisser le bas du marché à Halden",
  },
  {
    id: "prix",
    t: "Halden va nous prendre nos clients par le prix : il faut s'aligner sur les missions généralistes pour garder les volumes et l'occupation des consultants",
  },
  {
    id: "data",
    t: "Le marché qui croît le plus, c'est la data : il faut y repositionner le cabinet vite, avant que Halden ne s'y installe",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Halden ouvre à Nantes",
    jusqua: 2,
    messages: () => [
      {
        ...MAHDI,
        heure: "08:10",
        alerte: true,
        texte:
          "Victoire, c'est officiel : Halden Partners ouvre son bureau de Nantes dans quinze jours. Leur plaquette annonce 765 € par jour pour un consultant confirmé sur les missions d'organisation, 15 % sous nos prix. Je propose au comité de baisser nos TJM généralistes de 10 % tout de suite : si on les laisse s'installer, on ne les délogera plus.",
      },
      {
        ...GUSTAVE,
        heure: "09:30",
        texte:
          "Le comité de direction se réunit vendredi : il attend ta recommandation de positionnement pour les trois ans qui viennent. Le trimestre qui s'ouvre, de septembre à novembre, est celui où se prépare le budget de l'an prochain. Pour mémoire, notre résultat d'exploitation fait 8 % du chiffre d'affaires.",
      },
      {
        ...LEOPOLDINE,
        heure: "11:45",
        texte:
          "Pendant qu'on parle de Halden : j'ai refusé deux missions d'EHPAD ce mois-ci, faute de monde. Les acheteurs hospitaliers ne nous demandent jamais de baisser nos prix ; ils nous demandent qui a déjà fait le travail.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "chiffres",
        titre: "Faire extraire les jours facturés et les TJM par type de mission",
        cout: 1,
        nature: "decisive",
        resultat: (ctx) =>
          `Bureaux de Nantes et de Rennes, sur les douze derniers mois. Missions généralistes (organisation, conduite du changement, performance des services) : ${s(ctx, "joursG")} jours facturés à ${s(ctx, "tjmG")} de TJM moyen, soit ${s(ctx, "caG")} ; ${s(ctx, "consultantsG")} consultants, occupés à ${s(ctx, "occG")} pour une cible de ${s(ctx, "cible")}. Équipe hôpitaux et médico-social : ${s(ctx, "joursH")} jours à ${s(ctx, "tjmH")}, soit ${s(ctx, "caH")} ; ${s(ctx, "consultantsH")} consultants occupés à ${s(ctx, "occH")}. Taux de transformation des propositions : ${s(ctx, "transfoG")} en généraliste, ${s(ctx, "transfoH")} en santé. Les salaires font 62 % du chiffre d'affaires du cabinet et ne bougent pas avec les prix : un euro de TJM perdu est un euro de résultat perdu.`,
      },
      {
        id: "halden",
        titre: "Étudier ce que Halden a fait à Lille",
        cout: 1,
        nature: "decisive",
        resultat: (ctx) =>
          `Halden vend ${s(ctx, "tjmHalden")} par jour sur les missions généralistes : sa pyramide compte un associé pour huit consultants, presque tous juniors (chez nous, un pour cinq). À Lille, ${s(ctx, "enConcurrence")} des jours généralistes du cabinet régional en place se rejouaient chaque année en mise en concurrence ; son taux de transformation est passé de ${s(ctx, "transfoG")} à ${s(ctx, "transfoHalden")} dès la première année. Quand un cabinet lillois a baissé tous ses prix de 10 %, Halden a recassé les siens en moins de deux mois ; ses anciens associés disent qu'il le fait six fois sur dix. Quand un autre s'est concentré sur l'agroalimentaire, où il avait ses références, Halden ne l'a pas suivi : il ne répond pas aux consultations où la note technique pèse plus que le prix.`,
      },
      {
        id: "sante",
        titre: "Interroger l'équipe santé et la fédération hospitalière régionale",
        cout: 1,
        nature: "utile",
        resultat: (ctx) =>
          `Une trentaine d'établissements accompagnés en cinq ans, dont deux CHU. Les acheteurs hospitaliers notent la technique à 60 % et le prix à 40 %. Le plan régional de transformation des établissements sera renforcé (un peu plus d'une chance sur trois), reconduit (quatre sur dix) ou gelé (une sur quatre) : l'agence régionale de santé l'annoncera à la mi-novembre, et les établissements signent surtout en fin d'année, une fois leurs budgets connus. Avec un positionnement pleinement lisible, la fédération estime que nous pourrions attirer de l'ordre de ${s(ctx, "marchePorteur")} jours de plus par semaine si le plan est renforcé, ${s(ctx, "marcheMoyen")} s'il est reconduit, presque rien s'il est gelé ; dans ce dernier cas, nos clients actuels réduiraient aussi leurs commandes.`,
      },
      {
        id: "associes",
        titre: "Réunir les associés pour un tour de table",
        cout: 1,
        nature: "bruit",
        resultat:
          "Trois heures de discussion. Pour les uns, « Halden ne tiendra pas ses prix plus d'un an » ; pour d'autres, « il faut faire de la data, c'est là que va le marché ». Un associé veut une grande campagne de communication, un autre propose de racheter un cabinet bordelais. Personne n'apporte de chiffre.",
      },
      {
        id: "conseil",
        titre: "Appeler Florestan Mabire, qui a vu Halden arriver à Lille",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Florestan Mabire a fondé un cabinet lillois de soixante consultants : « Ne te bats pas sur son terrain. Avec sa pyramide de juniors, il gagnera toujours sur le prix d'une mission que n'importe qui sait faire. Va là où tes références font la différence, et vas-y par étapes : nous avons d'abord monté une équipe de huit, mesuré, puis recruté. Et garde un associé chez chacun de tes vieux clients : ceux-là partent quand ils se sentent abandonnés, pas pour cinquante euros. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Quel positionnement recommandez-vous au comité ?",
    options: [
      {
        t: "Baisser de 10 % nos TJM sur les missions généralistes, dès l'ouverture de Halden",
        d: "Sur toutes les propositions et tous les renouvellements à partir de la semaine 3, à Nantes et à Rennes. Les prix santé ne bougent pas.",
      },
      {
        t: "Se spécialiser par étapes là où sont nos références : un pôle hôpitaux et médico-social renforcé de 10 généralistes ce trimestre, nos prix généralistes inchangés",
        d: "Le pôle passe de 14 à 24 consultants à mesure que leurs missions se terminent. Deuxième étape prévue en janvier : six seniors santé recrutés.",
      },
      {
        t: "Tout réorienter vers la santé : la practice Organisation devient Atlas Santé, 26 généralistes rejoignent le pôle ce trimestre",
        d: "Le pôle passe à 40 consultants d'ici novembre ; les 54 généralistes restants gardent les clients généralistes. Les prix ne bougent pas.",
      },
      {
        t: "Ne rien changer : nos clients nous connaissent, Halden doit encore faire ses preuves",
        d: "Ni baisse de prix, ni pôle. On fera le point en fin d'année.",
      },
    ],
    reactions: [
      [
        {
          ...MAHDI,
          texte:
            "Merci, Victoire. Les nouvelles grilles partent aux directeurs de mission ce soir : 810 € au lieu de 900 €. Halden n'aura plus d'argument.",
        },
      ],
      [
        {
          ...LEOPOLDINE,
          texte:
            "Dix consultants de plus d'ici fin octobre : je prends d'abord ceux qui ont travaillé pour des collectivités sur le médico-social. Mahdi fait la tête, mais il garde ses prix.",
        },
      ],
      [
        {
          ...MAHDI,
          texte:
            "Vingt-six de mes consultants partent chez Léopoldine ? Je ferai avec ceux qui restent, mais je ne pourrai pas couvrir tous nos clients.",
        },
      ],
      [
        {
          ...GUSTAVE,
          texte:
            "Noté. Le comité reconduit le budget tel qu'il est ; on regardera les chiffres en décembre.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Le premier pas",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...LEOPOLDINE,
        heure: "09:00",
        texte:
          "Si l'on veut que les établissements nous voient comme le cabinet de leur transformation, il faut le montrer. Trois idées : publier une étude sur les EHPAD et les hôpitaux de l'Ouest avec nos données, en la portant d'abord depuis le bureau de Rennes ; recruter Adaeze Eze, qui a dirigé un CHU pendant huit ans et cherche un nouveau projet ; ou changer tout de suite l'image des quatre bureaux.",
      },
      {
        ...MAHDI,
        heure: "11:20",
        texte: ctx.aligne
          ? "Les nouvelles grilles sont parties. Si on fait aussi de la santé, une campagne « Atlas, le conseil des établissements de santé » dans la presse spécialisée et sur les salons, ça se voit tout de suite. Une étude, ça met deux mois."
          : "Une campagne « Atlas, le conseil des établissements de santé » dans la presse spécialisée et sur les salons, ça se voit tout de suite. Une étude, ça met deux mois.",
      },
      {
        ...GUSTAVE,
        heure: "16:00",
        texte:
          "Adaeze Eze demande 280 k€ par an, charges comprises, et un statut d'associée. Avant de signer quoi que ce soit, je veux savoir ce que chaque option nous apprendra, et quand.",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "test",
        titre: "Demander à la fédération ce que chaque premier pas dirait du marché, et quand",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `L'étude et le bureau de Rennes : ${s(ctx, "etude")} (rédaction, édition, deux matinées chez les directeurs bretons) ; on compte les demandes entrantes santé pendant six semaines, avec une règle fixée d'avance : au-delà de ${s(ctx, "seuilDemandes")}, le marché répond. Sur les cabinets que la fédération a vus faire, ce compte se trompe dans ${s(ctx, "erreurEtude")} des cas. Une campagne dans les quatre bureaux coûte ${s(ctx, "repositionnement")} : elle fait venir des demandes de toute sorte, et le compte se trompe dans ${s(ctx, "erreurCampagne")} des cas. L'experte coûte ${s(ctx, "salaireExperte")} par an et facturerait une soixantaine de jours à 1 400 € ; son réseau dirait en deux mois ce que préparent les établissements, avec ${s(ctx, "erreurExperte")} d'erreur. Sans rien de tout cela, nos propres demandes se trompent dans ${s(ctx, "erreurRien")} des cas, et l'on ne saura vraiment qu'en novembre, quand l'agence régionale annoncera son plan.`,
      },
      {
        id: "experte",
        titre: "Rencontrer Adaeze Eze",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Adaeze Eze a dirigé pendant huit ans le CHU d'une ville moyenne, puis un groupement de six établissements ; elle connaît la moitié des directeurs de la région. « Je viendrai si vous construisez vraiment quelque chose : je ne veux pas être une vitrine. » Elle ne veut pas d'objectif de chiffre d'affaires la première année.",
      },
    ],
    question: "Quel premier pas faites-vous vers la santé ?",
    options: [
      {
        t: "Repositionner tout de suite les quatre bureaux : campagne « Atlas, le conseil des établissements de santé », site, salons",
        d: "90 k€ en septembre et en octobre. Tout le monde le saura dans un mois.",
      },
      {
        t: "Tester : publier une étude sur les établissements de l'Ouest, la porter d'abord depuis Rennes, et compter les demandes entrantes",
        d: "35 k€. Le compte des demandes, avec une règle fixée d'avance, en semaine 8.",
      },
      {
        t: "Recruter Adaeze Eze, ancienne directrice générale de CHU, comme associée",
        d: "280 k€ par an, charges comprises ; elle arrive en semaine 6 et facturera une soixantaine de jours par an.",
      },
      {
        t: "Rien de plus pour l'instant : les missions feront connaître l'équipe",
        d: "Aucune dépense.",
      },
    ],
    reactions: [
      [
        {
          ...MAHDI,
          texte:
            "Les maquettes de la campagne sont prêtes lundi. Mes clients vont se demander si l'on fait encore autre chose.",
        },
      ],
      [
        {
          ...LOEIZ,
          texte:
            "Le bureau de Rennes présentera l'étude aux directeurs bretons début octobre. La règle est écrite : au-delà de 18 demandes entrantes en six semaines, le marché répond.",
        },
      ],
      [
        {
          ...ADAEZE,
          texte:
            "J'accepte. J'arrive en semaine 6 ; je commence par appeler les directeurs que je connais.",
        },
      ],
      [
        {
          ...LEOPOLDINE,
          texte: "D'accord. On continue comme ça, et on verra ce que disent les établissements.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Les clients historiques s'inquiètent",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...SOUMAYA,
        heure: "10:15",
        texte: ctx.pole
          ? "On entend dire qu'Atlas ne fait plus que de l'hôpital. Vous nous accompagnez depuis neuf ans : dois-je chercher quelqu'un d'autre pour la réorganisation de nos usines l'an prochain ?"
          : "Halden est venu nous voir avec des prix 15 % sous les vôtres. Je ne change pas de cabinet pour cinquante euros par jour, mais je veux savoir ce que vous comptez faire.",
      },
      {
        ...MAHDI,
        heure: "11:00",
        texte:
          "Les clients historiques, c'est 30 % de nos jours généralistes. Je propose de leur accorder 10 % sur les renouvellements : c'est le prix de la paix.",
      },
      {
        ...PRUNE,
        heure: "15:30",
        texte: `Pour mémoire : ${s(ctx, "partHistoriques")} des jours généralistes viennent d'une vingtaine de clients fidèles depuis plus de cinq ans, soit ${s(ctx, "joursHistoriques")} jours par an.`,
      },
    ],
    sources: [
      {
        id: "historiques",
        titre: "Interroger les directeurs de mission des comptes historiques",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Ce qu'ils redoutent, ce n'est pas le prix : c'est de perdre leurs interlocuteurs. Chez ceux qu'on a vus partir ces dernières années, ${s(ctx, "perteHistoriques")} des volumes s'en allaient d'un coup. Avec le positionnement retenu, la contrôleuse de gestion estime à ${s(ctx, "chanceHistoriques")} la probabilité qu'ils retirent ainsi ${s(ctx, "joursPerdus")} jours par an. Une remise de 10 % sur leurs renouvellements réduirait ce risque de 40 % et coûterait ${s(ctx, "coutRemise")} par an. Un associé référent par compte, qui les voit chaque mois, le réduirait de 70 % ; il coûte une vingtaine de jours d'associés ce trimestre, puis ${s(ctx, "coutReferent")} par an de temps non facturé.`,
      },
      {
        id: "visites",
        titre: "Savoir qui Halden est allé voir",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Halden a rencontré six de nos clients historiques. Deux lui ont demandé une proposition pour comparer ; aucun n'a signé. Les Laiteries Quénéhervé ont surtout demandé si leur directeur de mission resterait le même.",
      },
    ],
    question: "Que faites-vous pour les clients historiques ?",
    options: [
      {
        t: "Leur accorder 10 % de remise sur les renouvellements",
        d: "Dès la semaine 5, sur les missions de la vingtaine de clients fidèles.",
      },
      {
        t: "Nommer un associé référent par compte historique, qui les voit chaque mois, et garder leurs équipes",
        d: "Une vingtaine de jours d'associés ce trimestre, non facturés, puis une soixantaine par an.",
      },
      {
        t: "Rien de particulier : nos clients nous connaissent",
        d: "Les directeurs de mission continuent comme avant.",
      },
    ],
    reactions: [
      [
        {
          ...SOUMAYA,
          texte: "C'est un geste apprécié. J'en informe notre direction des achats.",
        },
      ],
      [
        {
          ...SOUMAYA,
          texte:
            "Merci d'être venue en personne. Si l'associé que vous me présentez reste notre interlocuteur, je n'ai pas de raison de chercher ailleurs.",
        },
      ],
      [{ ...MAHDI, texte: "Je dis aux directeurs de mission de rester attentifs." }],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Des consultants sans mission",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...MAHDI,
        heure: "08:45",
        alerte: true,
        texte: `${s(ctx, "intercontrat")} généralistes sont sans mission cette semaine, et Halden vient de gagner deux renouvellements chez nos clients de Saint-Nazaire. Je propose de remplir avec des missions courtes à 675 € : un jour vendu, même moins cher, vaut mieux qu'un jour perdu.`,
      },
      {
        ...SIXTE,
        heure: "10:30",
        texte:
          "Victoire, Kéroual manque de bras sur deux missions jusqu'à fin janvier. Je peux prendre quelques-uns de vos consultants en régie, à prix coûtant : 520 € par jour.",
      },
      {
        ...LEOPOLDINE,
        heure: "14:00",
        texte:
          "Les établissements qui hésitent veulent voir avant d'acheter. Des généralistes sans mission pourraient faire avec mon équipe des pré-diagnostics gratuits de deux jours : ils apprennent le métier, et nous, on se fait connaître.",
      },
    ],
    sources: [
      {
        id: "intercontrat",
        titre: "Chiffrer chaque façon d'occuper les consultants sans mission",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `${s(ctx, "intercontrat")} consultants sans mission, payés de toute façon : chaque jour non vendu est perdu pour de bon. Les missions courtes à 675 € rempliraient à peu près la moitié des jours libres ; mais les clients qui les achètent garderont ce prix en tête aux renouvellements, et Halden les verra : à Lille, il a recassé ses prix une fois sur quatre de plus quand le cabinet en place s'est mis à brader. Kéroual prendrait deux ou trois consultants, selon ses besoins : ${s(ctx, "regie")} au plus jusqu'à fin janvier, sans risque. Les pré-diagnostics coûtent ${s(ctx, "coutPre")} de déplacements ; l'équipe santé estime qu'ils rendraient le pôle visible dans un établissement sur cinq de plus. Ce qu'ils rapportent dépend du marché : beaucoup si le plan régional est renforcé ou reconduit et que le pôle a des consultants pour suivre, presque rien s'il est gelé.`,
      },
      {
        id: "tempora",
        titre: "Lire les relevés de Tempora, consultant par consultant",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Les relevés disent qui a saisi quoi. Trois consultants n'ont rien saisi depuis quinze jours ; une manager demande qu'on revoie les codes d'activité. Rien sur ce qui remplirait le carnet.",
      },
    ],
    question: "Que faites-vous des généralistes sans mission ?",
    options: [
      {
        t: "Remplir avec des missions courtes à 675 € par jour, 25 % sous nos prix",
        d: "Proposées aux clients généralistes dès la semaine 7. La moitié des jours libres devrait se remplir.",
      },
      {
        t: "Les mettre sur des pré-diagnostics gratuits dans les établissements de santé, avec l'équipe santé",
        d: "Dès la semaine 7 ; 15 k€ de déplacements. Aucun chiffre d'affaires ce trimestre.",
      },
      {
        t: "En placer en régie chez Kéroual Consulting, à prix coûtant, jusqu'à fin janvier",
        d: "520 € par jour pour les consultants que Kéroual prendra ; il dira combien lundi.",
      },
      {
        t: "Attendre que le carnet se remplisse",
        d: "Les consultants préparent des propositions et se forment.",
      },
    ],
    reactions: [
      [
        {
          ...MAHDI,
          texte:
            "Je lance l'offre « missions flash » à 675 € auprès de nos clients généralistes dès lundi.",
        },
      ],
      [
        {
          ...LEOPOLDINE,
          texte:
            "Six établissements ont déjà accepté un pré-diagnostic. Je mets un consultant de mon équipe avec chaque binôme.",
        },
      ],
      null,
      [{ ...GUSTAVE, texte: "Noté. L'occupation baissera encore un peu ce mois-ci." }],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Les premiers chiffres",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...LEOPOLDINE,
        heure: "09:00",
        texte: ctx.testRegle
          ? `Six semaines de compte : ${s(ctx, "demandes")} demandes entrantes santé. Notre règle disait : au-delà de 18, le marché répond.`
          : `Sur les six dernières semaines, ${s(ctx, "demandes")} demandes entrantes santé. Sans règle fixée d'avance, difficile de dire ce que ça vaut.`,
      },
      {
        ...GUSTAVE,
        heure: "11:00",
        texte:
          ctx.d1 === 1
            ? "Le plan de septembre prévoit six recrutements seniors santé en janvier : 720 k€ de salaires par an. Les cabinets de recrutement attendent notre feu vert lundi."
            : ctx.d1 === 2
              ? "Le pôle compte quarante consultants. Mahdi dit qu'il ne peut plus couvrir ses clients généralistes ; il voudrait en récupérer treize en janvier."
              : "Nous n'avons pas de pôle santé. Léopoldine demande si l'on en crée un en janvier, avec douze généralistes.",
      },
      {
        ...MAHDI,
        heure: "15:10",
        texte: ctx.recasse
          ? "Halden vient de passer à 700 € par jour sur les missions généralistes. L'écart est revenu."
          : "Halden n'a pas bougé ses prix ce mois-ci.",
      },
    ],
    sources: [
      {
        id: "lecture",
        titre: "Lire les chiffres du test, et ce qu'ils disent de l'étape suivante",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `${s(ctx, "demandes")} demandes entrantes en six semaines. Au vu de ce compte et de la fiabilité du premier pas choisi, la probabilité que le plan régional soit renforcé est désormais de ${s(ctx, "porteur")} (${s(ctx, "porteurAvant")} en septembre). Ce que vaudrait sur un an l'étape suivante (${s(ctx, "etapeSuivante")}), selon ce que l'agence régionale annoncera en semaine 11 : ${s(ctx, "etapePorteur")} si le plan est renforcé, ${s(ctx, "etapeMoyen")} s'il est reconduit, ${s(ctx, "etapeGel")} s'il est gelé.`,
      },
      {
        id: "loi",
        titre: "Lire le projet de loi de financement de la sécurité sociale",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Le projet présenté en octobre maintient l'enveloppe nationale d'investissement des établissements, mais laisse chaque agence régionale libre de la répartir. Pour la région, rien n'est joué avant la mi-novembre.",
      },
    ],
    question: "Que décidez-vous pour janvier ?",
    options: [
      {
        t: "Tenir le plan annoncé en septembre",
        d: "Ce qui était prévu se fait en janvier, quels que soient les chiffres du test : les six recrutements pour le pôle de 24, le pôle de 40 tel quel, rien de nouveau pour qui n'a pas de pôle.",
      },
      {
        t: "Réviser sur les chiffres : l'étape suivante si le test a franchi la règle fixée d'avance, sinon s'en tenir à ce qui existe",
        d: "Au-delà de 18 demandes : six recrutements, ou un pôle de 12 créé en janvier. En deçà : rien de plus, et 13 consultants rendus au généraliste si le pôle compte 40 personnes.",
      },
      {
        t: "Accélérer : douze recrutements seniors santé en janvier, quoi que dise le test",
        d: "1,44 M€ de salaires par an ; un pôle de 12 créé en janvier pour qui n'en a pas.",
      },
      {
        t: "Reporter toute nouvelle étape au printemps, quoi que dise le test",
        d: "Rien de plus en janvier ; on en reparlera après l'annonce de l'agence régionale.",
      },
    ],
    reactions: [
      [{ ...GUSTAVE, texte: "Je confirme le plan de septembre au comité, sans changement." }],
      [
        {
          ...LEOPOLDINE,
          texte:
            "Je prépare l'étape qui correspond au compte, et je présente au comité la règle que nous avions écrite.",
        },
      ],
      [
        {
          ...GUSTAVE,
          texte:
            "Douze recrutements en janvier : je lance les cabinets de recrutement et je l'inscris au budget.",
        },
      ],
      [{ ...GUSTAVE, texte: "Noté : rien de nouveau au budget de janvier." }],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Le GHT veut 15 %",
    jusqua: 13,
    messages: () => [
      {
        ...GLENN,
        heure: "09:30",
        texte:
          "Madame Lanoë, votre proposition pour le programme de transformation de nos six établissements nous convient sur le fond : 520 jours sur l'an prochain. Mais un TJM de 1 050 € dépasse notre budget : nous attendons un effort de 15 %.",
      },
      {
        ...MAHDI,
        heure: "10:40",
        texte:
          "Accorde-lui ses 15 % : une référence de cette taille dans un GHT, ça n'a pas de prix.",
      },
      {
        ...LEOPOLDINE,
        heure: "12:00",
        texte:
          "Les directeurs des achats des GHT se parlent. Le prix que nous ferons ici, nous le retrouverons dans chaque consultation de l'an prochain.",
      },
    ],
    sources: [
      {
        id: "reponses",
        titre: "Chiffrer chaque réponse possible au GHT",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Le programme : 520 jours à 1 050 €, soit ${s(ctx, "caGht")}. À 15 % de remise : ${s(ctx, "caGht15")}, et les acheteurs hospitaliers demanderont à peu près ${s(ctx, "ancrage15Taux")} sur nos autres missions santé, soit ${s(ctx, "ancrage15")} par an au volume actuel de l'équipe. À 7 % : ${s(ctx, "caGht7")}, et environ ${s(ctx, "ancrage7Taux")} sur les autres (${s(ctx, "ancrage7")} par an). Une remise de 7 % passe presque toujours, 15 % toujours. Tenir 1 050 € en scindant le programme en une tranche ferme de 260 jours et une tranche optionnelle que le GHT confirme quatre fois sur cinq : selon Glenn Tanguel, ses chances de signer tiennent à nos références, et avec ce que nous avons montré cette année, à peu près ${s(ctx, "chanceJalons")}. Tenir 1 050 € sans rien changer : ${s(ctx, "chanceTel")}.`,
      },
      {
        id: "marches",
        titre: "Relire nos derniers marchés hospitaliers",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Sur nos cinq derniers marchés hospitaliers, nous en avons gagné quatre sans être le moins cher : la note technique pesait 60 %. Le seul perdu l'a été faute de références sur ce type d'établissement.",
      },
    ],
    question: "Que répondez-vous au GHT ?",
    options: [
      {
        t: "Accorder les 15 % pour décrocher la référence",
        d: "893 € par jour. Le GHT signera.",
      },
      {
        t: "Tenir 1 050 €, et scinder le programme en une tranche ferme et une tranche optionnelle",
        d: "260 jours fermes, 260 que le GHT confirmera ou non en cours d'année. Réponse en semaine 12.",
      },
      {
        t: "Concéder 7 % : couper la poire en deux",
        d: "977 € par jour. Réponse en semaine 12.",
      },
      {
        t: "Tenir 1 050 € sans rien changer",
        d: "Notre proposition telle quelle. Réponse en semaine 12.",
      },
    ],
    reactions: [
      [{ ...GLENN, texte: "Merci de votre compréhension. Je prépare la notification." }],
      [
        {
          ...GLENN,
          texte:
            "La tranche optionnelle m'intéresse : je dois en parler à mes directeurs. Réponse sous quinze jours.",
        },
      ],
      [
        {
          ...GLENN,
          texte: "C'est un pas. Je le soumets à mes directeurs ; réponse sous quinze jours.",
        },
      ],
      [{ ...GLENN, texte: "J'en prends note. Réponse sous quinze jours." }],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "La spécialisation par étapes", chemin: [1, 1, 1, 1, 1, 1] },
  { nom: "Le prix", chemin: [0, 0, 0, 0, 0, 0] },
  { nom: "Attentiste", chemin: [3, 3, 2, 3, 0, 3] },
] as const;

/**
 * Les réflexes d'une direction de cabinet devant un concurrent moins cher :
 * s'aligner sur son prix, ou tout réorienter d'un coup ; s'afficher avant
 * d'avoir testé ; acheter la paix des clients par une remise ; remplir les
 * jours libres à prix cassé ; tenir le plan annoncé quoi que disent les
 * chiffres ; payer une référence par une remise. [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [0, 2],
  [1, 0],
  [2, 0],
  [3, 0],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  keroualOui:
    "Je prends trois de vos consultants, dès lundi et jusqu'à fin janvier. Envoyez-moi leurs CV.",
  keroualNon:
    "Une de mes deux missions vient de glisser : je ne peux en prendre que deux. Dès lundi, jusqu'à fin janvier.",
  ouverture:
    "Halden a ouvert lundi. Ils ont invité nos clients industriels à un petit-déjeuner, et ils répondent déjà à deux consultations de collectivités.",
  recasse:
    "Halden passe à 700 € par jour sur les missions généralistes. Nos clients nous l'ont dit avant même que nous le voyions.",
  pasDeRecasse: "Halden n'a pas bougé ses prix depuis son ouverture.",
  historiquesPartent:
    "Deux clients historiques ne renouvellent pas leurs missions de l'an prochain, et un troisième réduit de moitié. Ils disent ne plus savoir à qui parler chez nous.",
  historiquesRestent: "Les clients historiques ont tous renouvelé leurs missions de l'an prochain.",
  ghtOui: "Le GHT signe. Les premières missions démarrent en janvier dans deux établissements.",
  ghtNon:
    "Le GHT a choisi un autre cabinet, moins cher. Glenn Tanguel nous remercie pour la qualité de la proposition.",
  budget: {
    porteur:
      "L'agence régionale de santé annonce un plan de transformation renforcé : l'enveloppe des établissements augmente d'un tiers sur trois ans, et elle finance l'accompagnement des projets.",
    moyen:
      "L'agence régionale de santé reconduit son plan de transformation tel qu'il était : mêmes enveloppes, mêmes priorités.",
    gel: "L'agence régionale de santé gèle les crédits de son plan de transformation en attendant la loi de financement : les établissements reportent leurs projets.",
  },
} as const;
