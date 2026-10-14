/**
 * L'ASSOCIATION QUI DEMANDE À ÊTRE REPRISE — le contenu de l'épisode.
 *
 * Ursule Mauvernay dirige l'Association Solvanne. L'association voisine des
 * Primevères, à Nuits-Saint-Georges (un IME de 45 enfants, un ESAT de 60
 * travailleurs), est au bord de la cessation de paiements ; l'ARS demande à
 * Solvanne de la reprendre par fusion-absorption avant l'été. Six décisions,
 * de janvier à mars, chacune précédée de ce qu'une directrice générale reçoit
 * vraiment : la réponse de principe, l'audit, le dossier pour l'ARS, le
 * budget commercial de l'ESAT, le vote, les équipes.
 *
 * Chaque chiffre qu'une source donne au joueur se recalcule depuis les
 * constantes du modèle : le passif social, le résultat des budgets repris,
 * ce que l'ARS peut financer, le compte des ateliers de l'ESAT, les chances
 * d'un accord selon le dossier.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Association, personnes et chiffres sont fictifs.
 */
import type { Contexte, Etape } from "./types";

const ARS = {
  de: "Vivienne Tressard",
  role: "Directrice de l'offre médico-sociale, ARS",
} as const;
const EUDOXIE = {
  de: "Eudoxie Rambourg",
  role: "Directrice administrative et financière, Solvanne",
} as const;
const ALCIDE = { de: "Alcide Mazodier", role: "Président des Primevères" } as const;
const NESTOR = {
  de: "Nestor Mongrenier",
  role: "Président du conseil d'administration, Solvanne",
} as const;
const IRMINE = { de: "Irmine Marsaudon", role: "Directrice de l'IME des Primevères" } as const;
const FODE = { de: "Fodé Pellerey", role: "Chef des ateliers de l'ESAT des Primevères" } as const;
const DAGMAR = { de: "Dagmar Brachet", role: "Associée, cabinet Collonges Audit" } as const;
const CASSIEN = {
  de: "Cassien Calvayrac",
  role: "Directeur des ressources humaines, Solvanne",
} as const;
const KEMI = { de: "Kémi Dufayel", role: "Secrétaire du CSE des Primevères" } as const;
const OSVALDO = {
  de: "Osvaldo Thiollier",
  role: "Directeur général de l'association Héliandre",
} as const;

/** La reprise est-elle encore en jeu au moment de la décision ? */
const enJeu = (ctx: Contexte) => ctx.enJeu === true;

export const DIAGNOSTICS = [
  {
    id: "conditions",
    t: "La reprise peut créer de la valeur, à condition de la négocier : un diagnostic complet des Primevères (comptes, passifs, bâtiments, qualité, équipes), un financement de l'ARS pour la transition et les passifs inscrit dans un avenant au CPOM, et des équipes préparées",
  },
  {
    id: "passifs",
    t: "Le danger, ce sont les passifs cachés des Primevères : il faut tout auditer avant de s'engager",
  },
  {
    id: "ars",
    t: "L'enjeu, c'est la relation avec l'ARS : un refus se paierait au prochain CPOM, il faut dire oui vite",
  },
  {
    id: "prudence",
    t: "Les Primevères sont en déficit chronique : les reprendre, c'est importer leurs pertes dans les comptes de Solvanne ; mieux vaut décliner",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "L'ARS demande une reprise",
    jusqua: 2,
    messages: () => [
      {
        ...ARS,
        heure: "08:40",
        alerte: true,
        texte:
          "Madame Mauvernay, les Primevères n'ont plus que dix-huit jours de trésorerie. Leur conseil d'administration demande à être repris, et l'ARS souhaite que ce soit par Solvanne, par fusion-absorption, avant l'été. J'ai besoin d'une réponse de principe rapidement. Je sais pouvoir compter sur vous.",
      },
      {
        ...NESTOR,
        heure: "10:15",
        texte:
          "Ursule, l'ARS ne nous a jamais demandé un service pareil. Notre CPOM se renégocie l'an prochain, l'extension du FAM en dépend. Je ne vois pas comment on pourrait dire non.",
      },
      {
        ...EUDOXIE,
        heure: "11:30",
        texte:
          "Avant de répondre quoi que ce soit, je voudrais voir leurs comptes. Une association qui n'a plus de trésorerie a rarement un seul problème.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "comptes",
        titre: "Lire les comptes 2025 des Primevères avec la directrice financière",
        cout: 1,
        nature: "decisive",
        resultat:
          "6,1 M€ de produits. Déficit de l'IME : 175 k€ ; du budget principal de l'ESAT, financé par l'ARS : 35 k€ ; du budget commercial de l'ESAT : 55 k€ (la blanchisserie perd 80 k€, les espaces verts en gagnent 15, le conditionnement 10). Fonds propres négatifs, dix-huit jours de trésorerie. Aucune provision pour indemnités de départ à la retraite ni pour comptes épargne-temps. Eudoxie Rambourg a chiffré les économies d'une fusion : le siège des Primevères (250 k€ par an : direction générale, comptabilité, paie, commissaire aux comptes) remplacé par celui de Solvanne, qui demande 60 k€ de renfort, et 90 k€ d'achats et de transports mutualisés, soit 280 k€ par an en régime, la moitié la première année. Les budgets sociaux repris passeraient de 210 k€ de déficit à 70 k€ d'excédent par an, après une première année à −70 k€. Le budget commercial de l'ESAT n'en profite pas.",
      },
      {
        id: "personnel",
        titre: "Éplucher le registre du personnel et les engagements sociaux des Primevères",
        cout: 1,
        nature: "decisive",
        resultat:
          "68 salariés, tous transférés au repreneur avec leur contrat. Douze partiront à la retraite dans les cinq ans, tous au-delà de vingt ans d'ancienneté : la convention collective leur doit six mois de salaire chacun ; leur salaire mensuel moyen, charges comprises, est de 3 900 €. Les comptes épargne-temps cumulent 440 jours, à 190 € la journée chargée en moyenne. Rien de tout cela n'est provisionné : c'est le passif social que le repreneur prendra.",
      },
      {
        id: "president",
        titre: "Recevoir le président des Primevères",
        cout: 1,
        nature: "bruit",
        resultat:
          "Alcide Mazodier : « Nos comptes sont sains, nos équipes sont formidables. Le déficit vient des revalorisations salariales que l'ARS n'a pas suivies ; avec un peu de temps, tout rentrera dans l'ordre. Ce qu'il nous faut, c'est un grand frère. » Il ne parle ni des retraites, ni des bâtiments, ni du budget commercial de l'ESAT.",
      },
      {
        id: "ailleurs",
        titre: "Appeler trois directeurs généraux qui ont traité avec cette ARS",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Ce qu'ils ont vu : un refus de reprise s'est payé six fois sur dix au CPOM suivant (une extension refusée, des crédits comptés, autour de 190 k€ sur cinq ans) ; un retrait après négociation, plus souvent encore. Une association qui a posé ses conditions dans l'Yonne, audit à l'appui, a obtenu l'essentiel : l'ARS n'a pas d'autre solution qu'un administrateur provisoire, qui lui coûte plus cher. Celle qui a dit oui d'emblée n'a eu que la transition. Sans réponse, l'ARS passe au suivant une fois sur deux : l'association Héliandre est sur les rangs. L'enveloppe régionale de crédits non reconductibles sera connue en semaine 7 : confortable une année sur quatre, normale à peu près une sur deux, serrée près d'une sur trois.",
      },
      {
        id: "conseil",
        titre:
          "Appeler Cléophée Gasquet, ancienne directrice générale d'une association de l'Yonne",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Cléophée Gasquet : « Ni oui pour faire plaisir, ni non par prudence. Une reprise se décide sur un diagnostic, se négocie avec l'autorité de tarification avant le vote, et se prépare avec les équipes. Commence par chiffrer ce que tu prendrais : les déficits, mais aussi les retraites et les comptes épargne-temps que personne n'a provisionnés. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que répondez-vous à l'ARS ?",
    options: [
      {
        t: "Répondre oui tout de suite : l'ARS attend un signal, et un refus se paierait au prochain CPOM",
        d: "Un courrier ce soir. La fusion est engagée ; les conditions se discuteront ensuite.",
      },
      {
        t: "Donner un accord de principe sous conditions : un audit, un plan de financement négocié avec l'ARS, le vote des deux conseils",
        d: "Un courrier cette semaine. L'ARS sait ce que vous demanderez, pas encore combien.",
      },
      {
        t: "Décliner : Solvanne n'a pas vocation à reprendre les déficits des autres",
        d: "Un courrier argumenté. Les Primevères iront à un autre gestionnaire.",
      },
      {
        t: "Différer la réponse au conseil d'administration de mars, le temps de tout étudier",
        d: "Rien d'écrit avant mars. L'ARS attendra, ou pas.",
      },
    ],
    reactions: [
      [
        {
          ...ARS,
          texte:
            "Merci, Madame Mauvernay. Je savais que Solvanne serait au rendez-vous. Nous verrons ensemble les modalités le moment venu.",
        },
      ],
      [
        {
          ...ARS,
          texte:
            "J'entends vos conditions. Envoyez-moi un dossier chiffré à la fin de la semaine 4 : la répartition des crédits non reconductibles se fait en semaine 7.",
        },
      ],
      null,
      [
        {
          ...ARS,
          texte:
            "Je comprends que vous vouliez étudier le dossier, mais les Primevères ne tiendront pas jusqu'en mars. Je ne peux pas vous garantir de vous attendre.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Auditer, et jusqu'où",
    jusqua: 4,
    messages: (ctx) =>
      enJeu(ctx)
        ? [
            {
              ...ALCIDE,
              heure: "09:00",
              alerte: true,
              texte:
                "Madame Mauvernay, nos comptes sont certifiés sans réserve depuis dix ans. Nous vous ouvrons tout, mais un audit de plus, c'est du temps, et nous n'en avons plus.",
            },
            {
              ...EUDOXIE,
              heure: "14:20",
              texte:
                "Le cabinet Collonges Audit peut commencer lundi. Un audit complet coûte 48 k€ ; on peut aussi se contenter des comptes certifiés, ou faire relire par mes équipes. Ton choix.",
            },
          ]
        : [
            {
              ...OSVALDO,
              heure: "09:00",
              texte:
                "Madame Mauvernay, l'ARS m'a demandé de reprendre les Primevères. Je voulais vous l'apprendre moi-même : nous voilà voisins dans le handicap en Côte-d'Or.",
            },
            {
              ...EUDOXIE,
              heure: "14:20",
              texte: "Plus rien à auditer de notre côté, je suppose. Le cabinet attend ta réponse.",
            },
          ],
    reevaluation: true,
    sources: [
      {
        id: "diligences",
        titre: "Demander au cabinet ce qu'une reprise de cette taille cache d'habitude",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Dagmar Brachet : « Sur les reprises d'associations que nous avons auditées, un contentieux prud'homal en cours une fois sur deux, autour de 85 k€ ; des travaux de mise en sécurité un peu plus d'une fois sur deux, 300 k€ en moyenne, de 200 à 420. Les comptes certifiés ne montrent ni l'un ni l'autre : un contentieux qu'on n'a pas provisionné, un bâtiment amorti. L'audit complet (comptes, passif social, contentieux, bâtiments, qualité de l'accompagnement) : 48 k€, conclusions en semaines 5 et 6. L'audit financier et social seul : 22 k€, en semaine 5, sans les bâtiments. Ce que l'audit trouve, vous pouvez le présenter à l'ARS ; ce qu'il ne trouve pas, vous le découvrirez après le vote. »",
      },
      {
        id: "commission",
        titre: "Relire le dernier procès-verbal de la commission de sécurité de l'internat",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Avis favorable en 2019, assorti de deux prescriptions : recoupement des circulations, désenfumage de l'escalier. Rien n'indique qu'elles ont été levées. La prochaine visite est prévue cette année.",
      },
    ],
    question: "Quel audit faites-vous ?",
    options: [
      {
        t: "S'en tenir aux comptes certifiés : le commissaire aux comptes a fait son travail",
        d: "Rien à payer ; le conseil de mars aura les comptes.",
      },
      {
        t: "Lancer un audit complet : comptes, passif social, contentieux, bâtiments, qualité de l'accompagnement",
        d: "48 k€ ; conclusions en semaines 5 et 6.",
      },
      {
        t: "Un audit financier et social seulement",
        d: "22 k€ ; conclusions en semaine 5, sans les bâtiments.",
      },
      {
        t: "Faire relire les comptes et les contrats par les équipes du siège",
        d: "6 k€ de temps de travail ; sans expert extérieur.",
      },
    ],
    reactions: [
      [{ ...ALCIDE, texte: "Merci de votre confiance. Nos comptes parlent pour nous." }],
      [
        {
          ...DAGMAR,
          texte:
            "Nous commençons lundi : deux auditeurs et un ingénieur du bâtiment. Premières conclusions en semaine 5.",
        },
      ],
      [
        {
          ...DAGMAR,
          texte: "Nous commençons lundi par les comptes et le social. Conclusions en semaine 5.",
        },
      ],
      [
        {
          ...EUDOXIE,
          texte: "Mes deux comptables s'y mettent entre deux clôtures. On relira ce qu'on peut.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Le dossier pour l'ARS",
    jusqua: 6,
    messages: (ctx) =>
      enJeu(ctx)
        ? [
            {
              ...ARS,
              heure: "09:30",
              alerte: true,
              texte:
                "J'attends votre dossier lundi. La campagne budgétaire répartit les crédits non reconductibles de la région en semaine 7 : ce qui n'est pas demandé d'ici là ne sera pas dans l'enveloppe.",
            },
            {
              ...NESTOR,
              heure: "12:00",
              texte:
                "Ne braquons pas l'ARS avec une liste de courses. Elle a besoin de nous ; elle saura nous aider.",
            },
          ]
        : [
            {
              ...EUDOXIE,
              heure: "09:30",
              texte:
                "Les Primevères sont parties chez Héliandre. Nous n'avons plus de dossier à déposer pour elles.",
            },
          ],
    sources: [
      {
        id: "financable",
        titre: "Faire le point avec l'avocate sur ce que l'ARS peut financer",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Ximena Larcher : « L'ARS peut financer la transition en crédits non reconductibles : les 70 k€ de déficit de la première année. Elle peut signer un avenant au CPOM qui laisse les économies de la fusion dans les dotations ; sans lui, elle reprendra l'excédent dès la troisième année, 210 k€ sur le CPOM. Elle peut reprendre le passif social en crédits non reconductibles exceptionnels, et inscrire des travaux au plan pluriannuel d'investissement, ce qui finance leurs amortissements. Elle ne peut pas financer le budget commercial d'un ESAT : il s'équilibre par ses ventes. Le lui demander, c'est lui montrer qu'on ne connaît pas les règles. »",
      },
      {
        id: "chances",
        titre: "Demander aux directeurs généraux ce que l'ARS accorde, selon le dossier",
        cout: 0.5,
        nature: "utile",
        resultat:
          "En année normale, un dossier chiffré, appuyé sur un audit complet, obtient l'essentiel (transition, avenant, passif) quatre fois sur cinq ; sans audit, trois fois sur cinq ; un dossier qui demande ce que l'ARS ne peut pas financer, un peu plus d'une fois sur trois ; rien de chiffré, presque jamais. Après un oui donné d'avance, l'ARS n'a plus de raison de payer : trois chances sur dix de moins. Une enveloppe confortable ajoute, une enveloppe serrée retranche, beaucoup.",
      },
    ],
    question: "Que demandez-vous à l'ARS ?",
    options: [
      {
        t: "Ne rien chiffrer : laisser l'ARS proposer, pour ne pas la braquer",
        d: "Un courrier qui rappelle votre engagement et votre confiance.",
      },
      {
        t: "Chiffrer tout ce qu'elle peut financer : la transition, un avenant au CPOM qui laisse les économies dans les dotations, la reprise du passif social",
        d: "Un dossier de vingt pages, un plan de retour à l'équilibre, les passifs ligne à ligne.",
      },
      {
        t: "Tout demander, y compris la couverture du déficit commercial de l'ESAT, pour se garder de la marge",
        d: "Le même dossier, plus le budget commercial de l'ESAT sur cinq ans.",
      },
      {
        t: "Ne demander que la couverture des déficits, sans parler des passifs",
        d: "Un dossier court : la transition et l'avenant au CPOM.",
      },
    ],
    reactions: [
      [{ ...ARS, texte: "Merci pour votre confiance. Nous ferons au mieux avec l'enveloppe." }],
      [
        {
          ...ARS,
          texte:
            "Dossier bien reçu, et bien construit. Je le présente au comité régional de la semaine 7.",
        },
      ],
      [
        {
          ...ARS,
          texte:
            "Dossier reçu. Vous savez que nous ne finançons pas les budgets commerciaux des ESAT ; je présente le reste au comité de la semaine 7.",
        },
      ],
      [{ ...ARS, texte: "Dossier reçu. Je le présente au comité régional de la semaine 7." }],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Le budget commercial de l'ESAT",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...FODE,
        heure: "08:50",
        alerte: true,
        texte:
          "Madame Mauvernay, la clinique qui nous confie son linge a encore baissé ses prix : la blanchisserie travaille à perte. Mes neuf travailleurs de l'atelier ont peur qu'on le ferme. Il faut décider quelque chose avant la fusion.",
      },
      {
        ...EUDOXIE,
        heure: "11:40",
        texte: enJeu(ctx)
          ? "Une idée : ce sont les mêmes moniteurs qui encadrent la blanchisserie et accompagnent les travailleurs. Passons une plus grande part de leur temps sur le budget social de l'ESAT, et le déficit commercial fond."
          : "Les Primevères ne sont plus notre affaire, mais Héliandre aura le même problème à résoudre.",
      },
    ],
    sources: [
      {
        id: "ateliers",
        titre: "Reprendre le compte de résultat de chaque atelier de l'ESAT",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Budget commercial : 55 k€ de déficit par an. La blanchisserie perd 80 k€ sur le contrat de la clinique, facturé sous son coût ; les espaces verts gagnent 15 k€, le conditionnement 10. Recentrer (sortir du contrat avec trois mois de préavis, redéployer les neuf travailleurs vers les espaces verts et le conditionnement selon leur projet personnalisé, réviser les tarifs) coûte 20 k€ de transition ; le déficit tombe à 30 k€ la première année, puis à 5 k€ par an. Le budget commercial s'équilibre par ses ventes : ni l'ARS ni le budget social ne peuvent le combler, et une clé de répartition des moniteurs modifiée sans justification est rejetée au premier contrôle.",
      },
      {
        id: "appel",
        titre: "Lire le dossier de l'appel d'offres de la communauté de communes",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Entretien des espaces verts de douze communes, quatre ans, résultat en semaine 12. Marge attendue : 38 k€ par an. Il faut 50 k€ de matériel avant de répondre, revendable 15 k€ si le marché est perdu. Face à deux entreprises adaptées et un paysagiste, l'ESAT a remporté à peu près un lot sur deux ces dernières années.",
      },
    ],
    question: "Que faites-vous du budget commercial de l'ESAT ?",
    options: [
      {
        t: "Garder toutes les activités en l'état et combler le déficit sur les réserves, le temps que la fusion se fasse",
        d: "Rien ne change pour les travailleurs ; 55 k€ de déficit par an.",
      },
      {
        t: "Recentrer : sortir du contrat de blanchisserie déficitaire, redéployer les travailleurs vers les espaces verts et le conditionnement, réviser les tarifs",
        d: "20 k€ de transition ; neuf projets personnalisés à revoir.",
      },
      {
        t: "Imputer au budget social une plus grande part de l'encadrement de la blanchisserie : ce sont les mêmes moniteurs",
        d: "Une nouvelle clé de répartition ; le déficit commercial affiché baisse aussitôt.",
      },
      {
        t: "Recentrer, et investir pour répondre à l'appel d'offres d'entretien des espaces verts",
        d: "20 k€ de transition et 50 k€ de matériel ; réponse en semaine 12.",
      },
    ],
    reactions: [
      [{ ...FODE, texte: "Merci. Les travailleurs seront soulagés, pour l'instant." }],
      [
        {
          ...FODE,
          texte:
            "J'annonce le préavis à la clinique. Je reçois chacun des neuf travailleurs avec sa monitrice pour revoir son projet.",
        },
      ],
      [{ ...EUDOXIE, texte: "La nouvelle clé est passée. Le budget commercial respire." }],
      [
        {
          ...FODE,
          texte:
            "J'annonce le préavis à la clinique, et je monte la réponse à l'appel d'offres. Le matériel arrive dans quinze jours.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Voter, rouvrir, ou se retirer",
    jusqua: 10,
    messages: (ctx) =>
      enJeu(ctx)
        ? [
            {
              ...NESTOR,
              heure: "09:00",
              alerte: true,
              texte: `Le conseil est convoqué en semaine 10 pour voter le projet de traité de fusion. L'ARS a répondu : ${ctx.reponseTexte}. Nous lui avons dit que nous irions au bout ; je ne veux pas revenir sur notre parole.`,
            },
            {
              ...EUDOXIE,
              heure: "15:30",
              texte: `Ce qui reste à notre charge si l'on vote aujourd'hui : ${ctx.nonCouverts} de passifs connus, sans compter ce qu'on ne sait pas encore.`,
            },
          ]
        : [
            {
              ...OSVALDO,
              heure: "09:00",
              texte:
                "Nous votons la fusion avec les Primevères le mois prochain. L'ARS nous accompagne pour la transition.",
            },
          ],
    sources: [
      {
        id: "conclusions",
        titre: "Lire les conclusions de l'audit",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) => String(ctx.conclusions),
      },
      {
        id: "regard",
        titre: "Mettre la réponse de l'ARS en regard des passifs",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          enJeu(ctx)
            ? `Acquis de l'ARS sur le CPOM : ${ctx.couverture} (${ctx.reponseTexte}). Restent à la charge de Solvanne : ${ctx.nonCouverts} de passifs connus. Une seconde demande, appuyée sur des chiffres d'audit, est un peu plus facile à accorder que la première ; réponse en semaine 11, le vote reporté d'autant (10 k€ de gestion transitoire de plus). Poser un ultimatum (« nous nous retirerons ») braque l'autorité de tarification : un peu plus d'une chance sur dix de moins.`
            : "Il n'y a plus de reprise à négocier.",
      },
      {
        id: "retrait",
        titre: "Demander aux directeurs généraux ce que coûte un retrait à ce stade",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Après des semaines de négociation, un retrait se paie au CPOM suivant trois fois sur quatre, et plus cher qu'un refus d'emblée : autour de 230 k€ sur cinq ans. Après un oui sans conditions, presque toujours.",
      },
    ],
    question: "Que proposez-vous au conseil ?",
    options: [
      {
        t: "Faire voter la fusion au conseil de mars, comme annoncé à l'ARS",
        d: "Le vote a lieu en semaine 10 ; la fusion prend effet au 1er juillet.",
      },
      {
        t: "Rouvrir la négociation : présenter à l'ARS ce que l'audit a révélé et ce qu'elle n'a pas accordé, et reporter le vote à sa réponse",
        d: "Le vote attend la réponse de la semaine 11 ; deux mois de gestion transitoire de plus.",
      },
      {
        t: "Se retirer du projet",
        d: "Un courrier à l'ARS et aux Primevères cette semaine.",
      },
      {
        t: "Rouvrir la négociation en prévenant l'ARS que Solvanne se retirera si elle refuse",
        d: "Le vote attend la réponse de la semaine 11 ; la fusion n'aura lieu que si l'ARS accepte.",
      },
    ],
    reactions: [
      [{ ...NESTOR, texte: "Merci. Nous tenons parole : le conseil votera en semaine 10." }],
      [
        {
          ...ARS,
          texte:
            "Je reçois vos nouveaux chiffres. Je les présente au comité de la semaine 11 ; je comprends que votre conseil attende.",
        },
      ],
      [
        {
          ...ARS,
          texte:
            "Je prends acte de votre retrait. Je le regrette, et je devrai trouver une autre solution en urgence.",
        },
      ],
      [
        {
          ...ARS,
          texte:
            "Je présenterai vos chiffres en semaine 11. Je n'aime pas qu'on me pose des conditions sous forme d'ultimatum.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Les équipes des Primevères",
    jusqua: 13,
    messages: (ctx) =>
      enJeu(ctx)
        ? [
            {
              ...KEMI,
              heure: "08:30",
              alerte: true,
              texte:
                "Madame Mauvernay, au CSE nous apprenons la fusion par la presse locale. Les collègues se demandent s'ils garderont leurs accords, leurs plannings, leurs postes. Deux éducateurs ont déjà postulé ailleurs.",
            },
            {
              ...IRMINE,
              heure: "12:10",
              texte:
                "Je vous le dis franchement : on me propose la direction d'un IME en Haute-Saône. Je préférerais rester, mais je ne sais pas ce que je deviens.",
            },
            {
              ...CASSIEN,
              heure: "16:45",
              texte:
                "Le plus simple serait de ne rien annoncer avant que tout soit signé. Moins on en dit, moins on prend d'engagements.",
            },
          ]
        : [
            {
              ...KEMI,
              heure: "08:30",
              texte:
                "Madame Mauvernay, nous avons appris que Solvanne ne reprendrait pas les Primevères. Les équipes attendent de savoir ce qu'Héliandre leur proposera.",
            },
          ],
    sources: [
      {
        id: "directrice",
        titre: "Recevoir la directrice de l'IME et le chef des ateliers",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Irmine Marsaudon restera si elle sait avant l'été ce qu'elle devient, et si le projet de l'IME s'écrit avec son équipe ; Fodé Pellerey, le chef des ateliers, attend la même chose. Ailleurs, quand rien n'a été dit avant le vote, les cadres sont partis plus d'une fois sur deux ; quand on a nommé un directeur venu du repreneur au-dessus d'eux, presque toujours. Un départ de directrice, c'est six mois d'intérim de direction et un plan de retour à l'équilibre qui prend du retard : autour de 90 k€.",
      },
      {
        id: "droit",
        titre: "Faire le point avec l'avocate en droit social",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Ximena Larcher : « Les contrats de travail sont transférés tels quels (article L. 1224-1 du code du travail). Les accords collectifs des Primevères continuent de s'appliquer quinze mois au plus, le temps de négocier un accord de substitution (article L. 2261-14). Rien n'oblige à aligner les salaires tout de suite : le faire coûterait 18 k€ par an. Le CSE des Primevères doit être informé et consulté sur la fusion. »",
      },
    ],
    question: "Comment préparez-vous les équipes ?",
    options: [
      {
        t: "Ne rien annoncer avant le vote, puis une note de service",
        d: "Rien à payer ; aucune parole engagée avant la signature.",
      },
      {
        t: "Associer les équipes : informer et consulter le CSE, écrire le projet de l'IME avec elles, garantir les accords le temps de négocier, confirmer la directrice",
        d: "15 k€ d'accompagnement et de temps de travail ; trois réunions avant l'été.",
      },
      {
        t: "Aligner tout de suite les salaires des Primevères sur les accords de Solvanne, plus favorables",
        d: "18 k€ par an, 90 k€ sur le CPOM.",
      },
      {
        t: "Nommer un directeur de transition venu de Solvanne à la tête de l'IME, la directrice devenant adjointe",
        d: "Aucun coût de plus ; le siège tient le plan de retour à l'équilibre.",
      },
    ],
    reactions: [
      [{ ...CASSIEN, texte: "La note de service est prête. Elle partira le lendemain du vote." }],
      [
        {
          ...KEMI,
          texte:
            "Merci d'être venue au CSE. Les collègues ont des questions, mais ils savent à quoi s'attendre.",
        },
      ],
      [
        {
          ...KEMI,
          texte: "L'annonce a fait du bien. Les collègues n'en reviennent pas.",
        },
      ],
      [
        {
          ...IRMINE,
          texte:
            "J'ai bien compris le message. Je vous donnerai ma réponse dans quelques semaines.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "La reprise négociée", chemin: [1, 1, 1, 3, 1, 1] },
  { nom: "Le oui pour plaire", chemin: [0, 0, 0, 2, 0, 0] },
  { nom: "Attentiste", chemin: [3, 0, 0, 0, 0, 0] },
] as const;

/**
 * Les réflexes d'une direction pressée par son autorité de tarification :
 * dire oui sans conditions pour ne pas la fâcher, ou non par principe ; se
 * contenter des comptes certifiés ; ne rien chiffrer ; faire glisser le
 * déficit commercial de l'ESAT sur le budget social ; voter comme annoncé
 * malgré ce que l'audit a révélé ; ne rien dire aux équipes. [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [0, 2],
  [1, 0],
  [2, 0],
  [3, 2],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  refusSec:
    "Je prends acte de votre refus. Je ne vous cache pas que je m'en souviendrai : l'ARS avait besoin de Solvanne, et Solvanne n'était pas là.",
  refusCompris:
    "Je prends acte de votre refus, et de vos raisons. Je chercherai une autre solution ; nous en reparlerons au moment de votre CPOM.",
  perdu:
    "Faute de réponse, j'ai sollicité l'association Héliandre, qui a accepté de reprendre les Primevères. Je vous remercie de l'intérêt que vous y aviez porté.",
  pasPerdu:
    "Je vous attends encore, mais pas au-delà de mars. Si vous avancez, envoyez-moi un dossier chiffré en semaine 4.",
  reponse: [
    "",
    "l'ARS n'accorde que les crédits de transition, 70 k€ ; ni avenant au CPOM, ni reprise du passif social",
    "l'ARS accorde les crédits de transition et un avenant au CPOM qui laisse les économies dans les dotations ; elle ne reprend pas le passif social",
    "l'ARS accorde les crédits de transition, l'avenant au CPOM et la reprise du passif social",
  ],
  secondeOui:
    "Le comité régional a accepté votre seconde demande : ce qui manquait est inscrit à l'avenant, les passifs révélés par l'audit compris (le contentieux en crédits non reconductibles, les travaux au plan pluriannuel d'investissement).",
  secondeNon:
    "Le comité régional n'a pas pu retenir votre seconde demande : l'enveloppe est engagée. Nous en restons à ma première réponse.",
  controle:
    "Notre contrôleur a relevé la nouvelle clé de répartition des moniteurs de l'ESAT : elle n'est pas justifiée par leur temps réel. Les charges glissées sur le budget social seront rejetées, et je le note pour la suite de nos échanges.",
  vote: "Le conseil de Solvanne a voté le projet de traité de fusion ; celui des Primevères aussi. La fusion prendra effet au 1er juillet.",
  credit:
    "Au dialogue de gestion préparatoire du CPOM, l'ARS soutient l'extension de douze places du FAM : elle n'oublie pas qui a repris les Primevères.",
  rancune:
    "Au dialogue de gestion préparatoire du CPOM, l'ARS refuse l'extension de douze places du FAM et annonce des crédits non reconductibles comptés.",
  pasDeRancune:
    "Au dialogue de gestion préparatoire du CPOM, l'ARS reste correcte : quelques crédits non reconductibles en moins, l'extension du FAM maintenue à l'étude.",
} as const;
