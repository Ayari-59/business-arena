/**
 * RECONSTRUIRE OU REGROUPER — le contenu de l'épisode.
 *
 * Noëlle Grandperrin est directrice du patrimoine et des investissements de
 * l'Association Solvanne, à Dijon. Les EHPAD d'Auxonne (64 places) et de
 * Montbard (70 places) sont vétustes : chambres doubles, pas de pièce
 * rafraîchie, une mise aux normes incendie exigée par la commission de
 * sécurité. Le conseil d'administration attend sa recommandation dans deux
 * semaines : rénover les deux sur place, regrouper les deux dans un EHPAD
 * neuf de 134 places à Is-sur-Tille, ou reconstruire Montbard et transformer
 * Auxonne. Six décisions, de septembre à novembre, chacune précédée de ce
 * qu'une directrice du patrimoine reçoit vraiment.
 *
 * Chaque chiffre qu'une source donne au joueur se recalcule depuis les
 * constantes du modèle : les coûts, les hausses de prix de journée, le
 * plafond du département, les occupations attendues, les scénarios du
 * territoire, ce que coûterait chaque terrain.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Association, personnes et chiffres sont fictifs.
 */
import type { Contexte, Etape } from "./types";

const URSULE = { de: "Ursule Mauvernay", role: "Directrice générale" } as const;
const EUDOXIE = {
  de: "Eudoxie Rambourg",
  role: "Directrice administrative et financière",
} as const;
const NESTOR = {
  de: "Nestor Mongrenier",
  role: "Président du conseil d'administration",
} as const;
const VALERE = { de: "Valère Bellefontaine", role: "Directeur de l'EHPAD de Montbard" } as const;
const BAKARY = { de: "Bakary Gagnepain", role: "Directeur de l'EHPAD d'Auxonne" } as const;
const ROSALINDE = { de: "Rosalinde Charvolin", role: "Responsable des travaux du siège" } as const;
const LIESEL = { de: "Liesel Pradalié", role: "Consultante, étude de besoins" } as const;
const RADEGONDE = { de: "Radegonde Pichonnat", role: "Maire de Montbard" } as const;
const CORISANDE = {
  de: "Corisande Baudrimont",
  role: "Présidente du conseil de la vie sociale d'Auxonne",
} as const;
const TARIFICATION = {
  de: "Service de la tarification",
  role: "Conseil départemental de la Côte-d'Or",
} as const;
const ARS = { de: "Délégation départementale", role: "ARS" } as const;

const reconstruit = (ctx: Contexte) => ctx.voie === 2;
const sansProjet = (ctx: Contexte) => ctx.voie === 3;

export const DIAGNOSTICS = [
  {
    id: "differentiel",
    t: "Les trois voies se comparent sur leurs flux différentiels et sur la hausse de prix de journée qu'elles imposent aux résidents, au regard du plafond du département, de l'aide probable et des besoins du territoire",
  },
  {
    id: "plafond",
    t: "La contrainte, c'est le plafond du département : il faut la voie qui fait le moins monter le prix de journée",
  },
  {
    id: "cout",
    t: "Les réserves de l'association sont limitées : il faut la voie la moins chère à construire",
  },
  {
    id: "echelle",
    t: "Deux petits EHPAD coûtent trop cher à faire tourner : il faut regrouper pour faire des économies d'échelle",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Deux EHPAD à reprendre",
    jusqua: 2,
    messages: () => [
      {
        ...URSULE,
        heure: "08:20",
        alerte: true,
        texte:
          "Noëlle, le conseil d'administration se réunit jeudi prochain sur Auxonne et Montbard. La commission de sécurité nous a laissé trois ans pour les normes incendie, et nos chambres doubles ne trouvent plus preneur. J'attends ta recommandation : rénover, regrouper, ou reconstruire Montbard et transformer Auxonne. Nous sommes en septembre ; le dossier d'aide de l'ARS se dépose fin octobre.",
      },
      {
        ...EUDOXIE,
        heure: "09:05",
        texte:
          "Je le dis avant le conseil : la rénovation des deux, c'est 7,2 M€, la moitié du reste, et c'est la seule voie qui tient sous le plafond de 10 € par jour du département. Le reste, c'est se faire plaisir avec l'argent des résidents.",
      },
      {
        ...NESTOR,
        heure: "11:40",
        texte:
          "Les groupes privés font des établissements de 120 places et plus. Deux petits EHPAD à cent kilomètres l'un de l'autre, c'est deux cuisines, deux équipes de nuit, deux directions. Pensez-y.",
      },
      {
        ...VALERE,
        heure: "14:10",
        texte:
          "Trois familles ont refusé une chambre double ce mois-ci. On est à 92 % d'occupation, et cet été, sans pièce rafraîchie, on a passé les après-midi à déplacer les résidents d'un couloir à l'autre.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "voies",
        titre: "Mettre les trois voies au même format",
        cout: 1,
        nature: "decisive",
        resultat:
          "Aujourd'hui : Auxonne à 93 % d'occupation, Montbard à 92 % ; une journée gagnée ou perdue vaut 52 € à l'association (le prix de journée moins les repas, le linge, les produits). Le conseil juge les opérations sur vingt ans, au taux de 4 %. Rénover les deux sur place : 7,2 M€ (Auxonne 3,4, Montbard 3,8), hausse de 9,74 € par jour à Auxonne et de 9,97 € à Montbard, hors aide ; 48 places restent en chambres doubles ; occupation attendue 95,5 % si le besoin de places monte, 93,5 % s'il est stable, 89,5 % si le domicile se développe ; trente mois de travaux en site occupé, 540 k€ de places gelées ; sur nos rénovations lourdes, 9 % de dépassement en moyenne au-delà des aléas, jusqu'à 22 %, que le plan validé ne couvre pas. Regrouper à Is-sur-Tille : 17,6 M€, hausse de 15,00 € par jour ; 150 k€ par an d'économies hors hébergement (une équipe de nuit, un encadrement) ; occupation 98,5 %, 96 % ou 90,5 % ; 820 k€ de transition (quatre salariés sur dix ne feront pas 45 minutes de route, des familles ne suivront pas) ; le transfert des autorisations doit être accepté par l'ARS et le département. Reconstruire Montbard et transformer Auxonne : à Auxonne, 3,3 M€ pour 56 chambres individuelles, 8 places d'hébergement temporaire et 10 places d'accueil de jour, hausse de 8,78 €, occupation 97,5 %, 96,5 % ou 94,5 %, 220 k€ de places gelées, et l'accueil de jour rapporte 5, 15 ou 35 k€ par an ; à Montbard, 70 chambres individuelles de plain-pied, occupation 98,5 %, 97,5 % ou 95 %, 40 k€ par an d'organisation des soins en moins ; la hausse n'est pas calculée. Ne faire que les normes incendie : 1,15 M€, hausse de 2,35 €, occupation 93 %, 89,5 % ou 84 % dès l'an prochain, et le même problème au prochain CPOM, 350 k€ plus cher.",
      },
      {
        id: "financement",
        titre: "Relire le plan de financement de Montbard et la règle du département",
        cout: 1,
        nature: "decisive",
        resultat:
          "Reconstruction de Montbard : 8,75 M€ toutes dépenses comprises (125 k€ par place), terrain mis à disposition par la commune. Fonds propres : 0,75 M€ ; emprunt à la Banque Saônelle : 8,0 M€ sur vingt-cinq ans à 3,5 %. Amortissement par composants : trente-cinq ans en moyenne. Avec l'ancien bâtiment disparaissent 62 k€ de charges par an (amortissements qui s'achèvent, gros entretien) ; le neuf économise 28 k€ d'énergie et d'entretien. Règle du département pour les places habilitées à l'aide sociale (toutes les nôtres) : la hausse du prix de journée hébergement vaut les amortissements et les intérêts de la première année, moins les charges qui disparaissent et les économies, divisés par les journées à 97 % d'occupation. Elle est plafonnée à 10 € par jour à la mise en service, puis à 1,50 € de rattrapage par an, si le rattrapage est prévu au plan et l'écart couvert par la réserve de compensation des charges d'amortissement (1,2 M€). Au-delà, l'écart reste au déficit de la section hébergement, ou il faut sortir des places de l'habilitation. Une aide de l'ARS et du département se déduit de l'emprunt et se reprend au rythme des amortissements. Au-delà de 6 € de hausse, chaque euro nous a coûté environ 0,3 point d'occupation après l'extension de Beaune : 0,15 quand les listes d'attente s'allongent, 0,45 quand l'aide à domicile se développe.",
      },
      {
        id: "territoire",
        titre: "Lire les projections démographiques du territoire",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Trois scénarios circulent pour l'Auxois et le Val de Saône à dix ans. Le besoin de places en EHPAD monte avec l'arrivée des grands âges : à peu près trois chances sur dix. Il reste stable, la hausse des grands âges compensée par le maintien à domicile : un peu moins d'une sur deux. Il baisse, parce que les services à domicile se développent et que les entrées se font plus tard : une sur quatre. Le projet de schéma départemental de l'autonomie tranchera en novembre. En attendant, les demandes d'admission des deux EHPAD en disent un peu : autour de 6,5 par semaine si le besoin monte, 5,5 s'il est stable, 4,3 si le domicile se développe, à 1,4 près d'une semaine à l'autre.",
      },
      {
        id: "constructeur",
        titre: "Recevoir le constructeur qui propose une conception-réalisation",
        cout: 1,
        nature: "bruit",
        resultat:
          "Le directeur commercial de Corbelin Construction : « 134 places à 115 k€ la place, livrées en vingt-quatre mois, clés en main. Les économies d'échelle paient tout. » Son chiffre ne compte ni le terrain, ni la voirie, ni les équipements, ni le transfert des résidents, et il n'a jamais vu un prix de journée.",
      },
      {
        id: "conseil",
        titre: "Appeler Mihaela Vasilescu, contrôleuse de gestion du siège",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Mihaela Vasilescu : « Ne compare pas des coûts de construction : les résidents paient l'immobilier par le prix de journée. Compare ce que chaque voie change pour l'association, année après année, et regarde ce qu'elle fait au prix de journée au regard du plafond. Et refais la hausse de Montbard toi-même, avec les charges qui disparaissent. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que recommandez-vous au conseil d'administration ?",
    options: [
      {
        t: "Rénover les deux EHPAD sur place : la voie la moins chère, et la seule sous le plafond",
        d: "7,2 M€. Trente mois de travaux en site occupé ; des chambres doubles restent.",
      },
      {
        t: "Regrouper les deux dans un EHPAD neuf de 134 places à Is-sur-Tille",
        d: "17,6 M€. Un seul établissement, une équipe de nuit, une cuisine ; Auxonne et Montbard ferment.",
      },
      {
        t: "Reconstruire Montbard et transformer Auxonne en pôle de proximité",
        d: "12,05 M€. Des chambres individuelles partout, un accueil de jour à Auxonne.",
      },
      {
        t: "Ne faire que la mise aux normes incendie, et reprendre la question au prochain CPOM",
        d: "1,15 M€. Rien d'autre ne change.",
      },
    ],
    reactions: [
      [
        {
          ...EUDOXIE,
          texte:
            "Le conseil vote la rénovation des deux EHPAD : 7,2 M€, sous le plafond. La raison l'a emporté.",
        },
      ],
      [
        {
          ...NESTOR,
          texte:
            "Le conseil vote le regroupement à Is-sur-Tille. Les maires d'Auxonne et de Montbard ont demandé à être reçus dès la semaine prochaine.",
        },
      ],
      [
        {
          ...URSULE,
          texte:
            "Le conseil vote la reconstruction de Montbard et la transformation d'Auxonne. La hausse de Montbard a fait débat ; tu as un trimestre pour la rendre supportable.",
        },
      ],
      [
        {
          ...URSULE,
          texte:
            "Le conseil vote la seule mise aux normes. Les directeurs d'Auxonne et de Montbard m'ont demandé ce qu'ils devaient dire aux familles.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Le dossier d'aide",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...ARS,
        heure: "10:00",
        alerte: true,
        texte:
          "L'appel à candidatures pour l'aide à l'investissement des établissements pour personnes âgées est ouvert. Dossiers complets avant le 31 octobre ; le comité régional et la commission permanente du département se prononceront fin novembre.",
      },
      sansProjet(ctx)
        ? {
            ...EUDOXIE,
            heure: "11:30",
            texte:
              "Pour la seule mise aux normes, l'ARS ne finance rien. Mais un dossier bien fait aujourd'hui servira au prochain CPOM.",
          }
        : {
            ...EUDOXIE,
            heure: "11:30",
            texte:
              "Déposons tout de suite le dossier technique de l'architecte. L'enveloppe est limitée : les premiers servis sont les mieux servis.",
          },
      {
        ...LIESEL,
        heure: "16:20",
        texte:
          "Madame Grandperrin, nous pouvons mesurer les besoins de vos deux territoires : projections par canton, dépendance des personnes à domicile, offre des services. 32 000 €, conclusions dans quatre semaines.",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "comite",
        titre: "Demander à l'ARS ce que le comité a financé l'an dernier",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Dix-neuf dossiers, sept retenus, pour des aides de 20 à 25 % du coût. Six des sept avaient une étude de besoins récente et l'avis des élus et du conseil de la vie sociale. Les rénovations à l'identique : une sur six. Aucun regroupement qui éloignait l'offre d'un canton rural : le schéma régional fait de la proximité une priorité, et le département, qui cofinance, ne paie pas pour fermer des établissements. La date de dépôt ne compte pas : tous les dossiers complets au 31 octobre sont examinés ensemble.",
      },
      {
        id: "etude",
        titre: "Lire la proposition d'étude de besoins",
        cout: 0.5,
        nature: "utile",
        resultat:
          "L'étude dira lequel des trois scénarios se dessine sur vos deux territoires, en semaine 6, avant que le programme ne soit arrêté pour le dossier. Sans elle, il faudra lire le scénario dans les demandes d'admission, qui varient beaucoup d'une semaine à l'autre, ou attendre le schéma départemental, en novembre : après le dépôt.",
      },
    ],
    question: "Comment préparez-vous le dossier d'aide ?",
    options: [
      {
        t: "Déposer dès maintenant le dossier technique, sur le programme voté",
        d: "Rien à payer. Le dossier part la semaine prochaine.",
      },
      {
        t: "Commander l'étude de besoins, et bâtir le programme et le dossier avec les élus et le conseil de la vie sociale",
        d: "32 k€. Conclusions en semaine 6 ; le dossier part fin octobre.",
      },
      {
        t: "Associer les élus et le conseil de la vie sociale au programme, sans étude",
        d: "Rien à payer. Deux réunions en octobre ; le dossier part fin octobre.",
      },
    ],
    reactions: [
      [{ ...ROSALINDE, texte: "Le dossier technique part lundi à l'ARS." }],
      [
        {
          ...LIESEL,
          texte:
            "Étude lancée. Nous rencontrons les maires, les services à domicile et vos deux directeurs dès la semaine prochaine.",
        },
      ],
      [
        {
          ...BAKARY,
          texte:
            "Les maires et le conseil de la vie sociale sont invités pour le 14 octobre. Ils ont des questions, et des idées.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Le plafond du département",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...TARIFICATION,
        heure: "09:30",
        alerte: true,
        texte: sansProjet(ctx)
          ? "Nous avons pris note de la mise aux normes. La hausse correspondante entrera dans le prix de journée de l'an prochain."
          : "Nous instruirons la hausse du prix de journée liée à votre opération avec le plan de financement. Nous rappelons le plafond de 10 € par jour à la mise en service pour les places habilitées à l'aide sociale.",
      },
      {
        ...EUDOXIE,
        heure: "11:00",
        texte: `La hausse nécessaire de l'opération la plus lourde : ${ctx.hausseHorsAide} par jour hors aide. Nos charges d'investissement sont opposables : présentons-les en entier, le département suivra.`,
      },
      {
        ...NESTOR,
        heure: "15:45",
        texte:
          "Et si on sortait une partie des places de l'habilitation à l'aide sociale ? Orchidia fixe ses prix comme elle veut.",
      },
    ],
    sources: [
      {
        id: "plafond",
        titre: "Chiffrer l'écart au plafond, avec et sans aide",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.depasse
            ? `${ctx.detailHausses} Présentée en une fois, la hausse est ramenée à 10 € : ${ctx.deficitSansAide} par an de déficit d'hébergement pendant dix-huit ans sans aide, ${ctx.deficitAvecAide} avec. Avec un rattrapage de 1,50 € par an sur cinq ans prévu au plan, l'écart des premières années est de ${ctx.lissageSansAide} au total sans aide, ${ctx.lissageAvecAide} avec, couvert par la réserve de compensation (1,2 M€)${ctx.resteSansAide ? `, et il reste ${ctx.resteSansAide} par an au-delà sans aide` : ""}. Le département n'a pas encore dit s'il accepterait cinq ans ou trois.`
            : `${ctx.detailHausses} La voie retenue reste sous le plafond : le prix de journée suivra, sans déficit d'hébergement.`,
      },
      {
        id: "habilitation",
        titre: "Appeler l'association de Saône-et-Loire qui a sorti des places de l'habilitation",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Il y a quatre ans, elle a sorti 30 % de ses places de l'habilitation à l'aide sociale pour les facturer 25 € de plus. Ces places-là sont occupées à 84 % : seules les familles aisées les prennent. Le département a refusé de cofinancer son extension suivante. Et les résidents bénéficiaires de l'aide sociale attendent plus longtemps une place.",
      },
    ],
    question: "Comment présentez-vous la hausse au département ?",
    options: [
      {
        t: "Présenter la hausse entière : nos charges d'investissement sont opposables",
        d: "Le plan de financement tel quel. Le département arrêtera le prix.",
      },
      {
        t: "Prévoir au plan un rattrapage par étapes, l'écart couvert par la réserve de compensation",
        d: "La hausse monte de 10 € à l'ouverture, puis de 1,50 € par an ; la réserve paie l'écart d'ici là.",
      },
      {
        t: "Sortir 30 % des places de l'habilitation à l'aide sociale pour y fixer un prix libre",
        d: "Ces places paient l'écart ; les autres restent à 10 € de hausse.",
      },
    ],
    reactions: [
      [
        {
          ...TARIFICATION,
          texte:
            "Nous avons reçu votre plan de financement. Il sera instruit selon les règles en vigueur.",
        },
      ],
      null,
      [
        {
          ...TARIFICATION,
          texte:
            "Nous prenons acte de votre demande de réviser l'habilitation à l'aide sociale. Nous en tirerons les conséquences pour notre participation à vos investissements.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Ce que dit le territoire",
    jusqua: 8,
    messages: (ctx) => [
      ctx.etude
        ? {
            ...LIESEL,
            heure: "10:00",
            alerte: true,
            texte: `Nos conclusions sont prêtes : sur vos deux territoires, c'est le scénario « ${ctx.scenarioEtude} » qui se dessine. Le programme voté en septembre n'y répond qu'en partie.`,
          }
        : {
            ...BAKARY,
            heure: "10:00",
            alerte: true,
            texte: `Depuis la rentrée, nous recevons ${ctx.demandesMoyennes} demandes d'admission par semaine en moyenne, pour les deux EHPAD. Difficile d'en tirer une tendance.`,
          },
      {
        ...ROSALINDE,
        heure: "14:00",
        texte:
          "L'architecte doit figer le programme la semaine prochaine pour que le dossier d'aide parte fin octobre. Après, on ne le touchera plus avant les marchés.",
      },
      {
        ...EUDOXIE,
        heure: "16:30",
        texte:
          "Le conseil a voté un programme. On ne le rouvre pas tous les mois, sinon on ne construira jamais.",
      },
    ],
    sources: [
      {
        id: "conclusions",
        titre: "Relire ce que l'on sait du besoin sur les deux territoires",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.etude
            ? `L'étude conclut au scénario « ${ctx.scenarioEtude} ». ${ctx.ajustementEtude} Le schéma départemental, en novembre, ne fera que le confirmer.`
            : `Sans étude, il reste les demandes d'admission : ${ctx.demandesMoyennes} par semaine en moyenne depuis la rentrée, ce qui ressemble au scénario « ${ctx.scenarioSignal} ». Mais à 1,4 près d'une semaine à l'autre, six semaines trompent environ une fois sur trois. Le schéma départemental tranchera en novembre, après le dépôt du dossier.`,
      },
      {
        id: "ajustements",
        titre: "Demander à l'architecte ce qu'un ajustement changerait",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Si le besoin de places monte : garder 64 places permanentes à Auxonne, sans hébergement temporaire, 30 k€ par an de mieux. S'il est stable : une unité protégée de 14 places au lieu de 12 à Montbard, 10 k€ par an. Si le domicile se développe : 8 places permanentes de plus en hébergement temporaire et en accueil de jour, avec une plateforme de répit pour les aidants, 40 k€ par an. Ajuster sur le mauvais scénario coûte 55 k€ par an. Dix places de plus, enfin, ne servent que si le besoin monte ; sinon elles restent vides, et le comité de l'ARS ne finance pas des places qu'il n'a pas autorisées.",
      },
    ],
    question: "Que faites-vous du programme avant le dépôt du dossier ?",
    options: [
      {
        t: "Maintenir le programme voté par le conseil en septembre",
        d: "Rien ne change ; l'architecte fige les plans lundi.",
      },
      {
        t: "Ajuster le programme à ce que montre le territoire, et le dire au conseil",
        d: "Une semaine de reprise des plans ; le conseil est informé par écrit.",
      },
      {
        t: "Ajouter dix places au programme, tant qu'on construit",
        d: "Dix chambres de plus, à financer ; une demande d'autorisation à joindre.",
      },
    ],
    reactions: [
      [{ ...ROSALINDE, texte: "Programme figé. Les plans partent au bureau de contrôle." }],
      [
        {
          ...URSULE,
          texte:
            "Bien. Le conseil préfère un programme ajusté maintenant qu'un établissement qui ne répond plus aux besoins dans cinq ans.",
        },
      ],
      [
        {
          ...ROSALINDE,
          texte: "Dix chambres de plus : l'architecte reprend les plans, et le chiffrage.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Le terrain de Montbard",
    jusqua: 10,
    messages: (ctx) =>
      reconstruit(ctx)
        ? [
            {
              ...RADEGONDE,
              heure: "09:15",
              alerte: true,
              texte:
                "Madame Grandperrin, la commune vous propose l'ancienne friche de la gendarmerie, en plein bourg, à côté du marché et de la médiathèque, par bail emphytéotique à l'euro symbolique. Je tiens à ce que nos anciens restent en ville.",
            },
            {
              ...ROSALINDE,
              heure: "11:20",
              texte:
                "Trois possibilités : la friche du bourg, un terrain plat en zone d'activités, à trois kilomètres, 250 k€ moins cher à construire, ou rebâtir sur notre site, en tiroir, à côté de l'ancien bâtiment occupé.",
            },
            {
              ...EUDOXIE,
              heure: "15:00",
              texte:
                "La zone d'activités, c'est 250 k€ de moins et pas de surprise. Le moins cher, pour une fois, ne se discute pas.",
            },
          ]
        : [
            {
              ...ROSALINDE,
              heure: "09:15",
              texte:
                "Montbard n'est pas reconstruit dans la voie votée : la question du terrain ne se pose pas. La maire de Montbard nous a tout de même écrit pour proposer l'ancienne friche de la gendarmerie, si nous changions d'avis.",
            },
          ],
    sources: [
      {
        id: "terrains",
        titre: "Comparer les trois terrains",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "La friche du bourg : rien à payer pour le terrain, mais des sondages de 1990 ont trouvé des argiles gonflantes sur trois des dix parcelles voisines ; s'il y en a, fondations sur pieux et un an de décalage, environ 1,5 M€ que le plan validé ne couvrira pas. Les sondages rendront leurs résultats en semaine 10. La zone d'activités : 250 k€ de moins à construire, mais à trois kilomètres du bourg, sans commerce ni transport ; nos admissions y perdraient environ 5 points d'occupation, et le comité de l'ARS regarde l'insertion dans la ville. Le site actuel, en tiroir : dix places gelées pendant deux ans, la démolition et les nuisances, 520 k€, sans surprise.",
      },
      {
        id: "familles",
        titre: "Interroger les familles des résidents de Montbard",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Sur 41 familles qui ont répondu, 33 viennent à pied ou en passant, au moins une fois par semaine. Plusieurs résidents vont encore seuls au marché du samedi. « En zone d'activités, on viendrait le dimanche, en voiture. »",
      },
    ],
    question: "Où reconstruisez-vous Montbard ?",
    options: [
      {
        t: "Sur le terrain de la zone d'activités, le moins cher",
        d: "250 k€ de moins à construire ; terrain plat, sondé.",
      },
      {
        t: "Sur la friche du centre-bourg proposée par la commune",
        d: "Terrain à l'euro symbolique ; sondages en cours.",
      },
      {
        t: "Sur le site actuel, en tiroir, à côté de l'ancien bâtiment",
        d: "Pas de terrain à trouver ; deux ans de chantier à côté des résidents.",
      },
    ],
    reactions: [
      [{ ...ROSALINDE, texte: "C'est noté : la zone d'activités, si Montbard se reconstruit." }],
      [
        {
          ...RADEGONDE,
          texte:
            "Merci. La commune lance les sondages dès lundi ; vous aurez les résultats dans quinze jours.",
        },
      ],
      [{ ...ROSALINDE, texte: "C'est noté : on rebâtit sur notre site, en tiroir." }],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Ce qu'on dit aux familles",
    jusqua: 13,
    messages: () => [
      {
        ...CORISANDE,
        heure: "10:10",
        alerte: true,
        texte:
          "Madame Grandperrin, au marché, on dit que l'EHPAD va fermer, ou que les prix vont doubler. Les familles m'interrogent et je ne sais rien. Le conseil de la vie sociale se réunit le 28 novembre.",
      },
      {
        ...BAKARY,
        heure: "12:30",
        texte:
          "Deux aides-soignantes m'ont demandé si elles devaient chercher ailleurs. L'équipe attend un mot de la direction.",
      },
      {
        ...EUDOXIE,
        heure: "14:15",
        texte:
          "Ne disons rien avant que tout soit arrêté au printemps : l'aide n'est pas votée, le prix non plus. Annoncer une hausse aujourd'hui, c'est inquiéter pour rien.",
      },
    ],
    sources: [
      {
        id: "rumeurs",
        titre: "Demander à Beaune comment s'était passée l'annonce de son extension",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "À Beaune, rien n'avait été dit pendant six mois : un article de la presse locale a annoncé une « hausse de 30 % », trois familles ont retiré leur demande, deux résidents sont partis, et deux soignantes avec eux. Quand le projet a été présenté au conseil de la vie sociale avec la hausse réelle, le calendrier et ce qui ne change pas pour les bénéficiaires de l'aide sociale, les questions se sont arrêtées.",
      },
      {
        id: "cvs",
        titre: "Relire ce que le conseil de la vie sociale doit connaître",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Le conseil de la vie sociale est consulté sur les projets de travaux et d'équipement et sur l'évolution des prix. Les résidents bénéficiaires de l'aide sociale à l'hébergement ne paient pas la hausse : le département la prend en charge, au-delà de ce qu'ils versent de leurs revenus. Les autres peuvent déduire une partie des frais d'hébergement de leurs impôts.",
      },
    ],
    question: "Que dites-vous aux résidents, aux familles et aux équipes ?",
    options: [
      {
        t: "Rien avant que tout soit arrêté au printemps, pour ne pas inquiéter",
        d: "Aucune annonce ; les directeurs répondent qu'il n'y a rien de décidé.",
      },
      {
        t: "Présenter au conseil de la vie sociale et aux familles le projet, le calendrier, la hausse prévue et ce qui protège les résidents",
        d: "Une réunion par établissement, une lettre aux familles et aux équipes.",
      },
      {
        t: "Annoncer le projet et son calendrier, sans parler encore de la hausse",
        d: "Une lettre aux familles et aux équipes.",
      },
    ],
    reactions: [
      [
        {
          ...BAKARY,
          texte: "Je dirai qu'il n'y a rien de décidé. Je ne suis pas sûr qu'on me croie.",
        },
      ],
      [
        {
          ...CORISANDE,
          texte:
            "Merci d'être venue. La hausse inquiète, mais au moins nous savons, et nous savons ce qui ne change pas.",
        },
      ],
      [
        {
          ...CORISANDE,
          texte: "Le projet est beau. Et le prix ? Les familles vont le demander à chaque réunion.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Les flux différentiels et le prix de journée", chemin: [2, 1, 1, 1, 1, 1] },
  { nom: "Le moins cher à construire", chemin: [0, 0, 0, 0, 0, 0] },
  { nom: "Attentiste", chemin: [3, 0, 0, 0, 2, 0] },
] as const;

/**
 * Les réflexes d'une direction pressée devant un investissement immobilier :
 * la voie la moins chère à construire, ou la plus grande ; déposer vite sans
 * savoir ; présenter ses charges sans regarder le plafond ; ne pas rouvrir un
 * programme voté ; le terrain le moins cher ; se taire tant que rien n'est
 * arrêté. [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [0, 1],
  [1, 0],
  [2, 0],
  [3, 0],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  lissageLong:
    "Le département accepte un rattrapage sur cinq ans, inscrit au plan de financement, l'écart des premières années couvert par la réserve de compensation.",
  lissageCourt:
    "Le département accepte un rattrapage, mais sur trois ans seulement : au-delà de 14,50 € de hausse, l'écart restera à votre charge.",
  aideOui:
    "Le comité régional et la commission permanente retiennent votre dossier : l'aide à l'investissement vous est accordée.",
  aideNon:
    "Votre dossier n'est pas retenu cette année : l'enveloppe est allée à des projets jugés plus prioritaires pour le territoire.",
  refus:
    "Les maires d'Auxonne et de Montbard ont obtenu le soutien du département : le transfert des autorisations à Is-sur-Tille est refusé. Le regroupement ne se fera pas ; il ne reste que la mise aux normes.",
  accord:
    "L'ARS et le département acceptent, non sans réserve, le transfert des autorisations à Is-sur-Tille.",
  argiles:
    "Les sondages ont trouvé des argiles gonflantes sous la friche : fondations sur pieux, et un an de plus.",
  pasDArgiles: "Les sondages sont bons : sol porteur, fondations superficielles.",
  rumeur:
    "La presse locale titre sur « la fin de l'EHPAD » et une « hausse de 30 % ». Deux familles retirent leur demande d'admission, une résidente part pour un autre établissement.",
} as const;
