/**
 * LES SAISONNIERS DE JUILLET — le contenu de l'épisode.
 *
 * Léonie Combaz est cheffe de réception de L'Escale Évian, 4 étoiles de 66
 * chambres au bord du Léman : six réceptionnistes permanents, et huit
 * saisonniers qui arrivent le 29 juin, la semaine où l'hôtel passe à plus de
 * 90 % d'occupation. Juin, juillet, août : six décisions, chacune précédée de
 * ce qu'une cheffe de réception reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Chaque chiffre qu'elles
 * donnent vient des constantes du modèle ; le test de l'épisode le vérifie.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Contexte, Etape, Message } from "./types";

export const DIAGNOSTICS = [
  {
    id: "integration",
    t: "Des saisonniers lâchés au comptoir sans formation : leurs erreurs et leurs départs coûtent bien plus que leur intégration",
  },
  {
    id: "departs",
    t: "Les saisonniers partent en cours de saison : c'est d'abord une affaire de logement et de fidélisation",
  },
  {
    id: "effectif",
    t: "Il manque du monde au comptoir en juillet : huit saisonniers ne suffisent pas à tenir le rush",
  },
  {
    id: "profils",
    t: "Les saisonniers recrutés n'ont pas le niveau d'un 4 étoiles : il faut recruter plus expérimenté",
  },
] as const;

/** Les huit saisonniers, dans l'ordre des postes du modèle. */
export const SAISONNIERS_NOMS = [
  { nom: "Elif Demirci", f: true },
  { nom: "Loan Bochaton", f: false },
  { nom: "Melvil Gavard", f: false },
  { nom: "Thelma Grosset", f: true },
  { nom: "Aymen Kaci", f: false },
  { nom: "Ilario Folliet", f: false },
  { nom: "Enola Dagand", f: true },
  { nom: "Naïs Bertholet", f: true },
] as const;

const ALIENOR = { de: "Aliénor Duchosal", role: "Directrice de L'Escale Évian" } as const;
const BERTILIE = { de: "Bertilie Mermoud", role: "Première de réception" } as const;
const EZIO = { de: "Ezio Sanna", role: "Réceptionniste de nuit" } as const;
const MARWA = { de: "Marwa Selmi", role: "Ressources humaines, siège du groupe" } as const;
const LUCILE = { de: "Lucile Fabbri", role: "Revenue management, siège du groupe" } as const;
const TABLEAU = { de: "Hostéo", role: "Tableau de bord de la réception" } as const;

const texte = (ctx: Contexte, cle: string) => String(ctx[cle] ?? "");

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Huit saisonniers dans quatre semaines",
    jusqua: 3,
    messages: () => [
      {
        ...TABLEAU,
        heure: "07:30",
        alerte: true,
        texte:
          "Pick-up de ce matin : 93 % d'occupation prévue en juillet, 95 % en août. Note de l'hôtel sur Bookalia : 8,9 ; l'été dernier, elle était tombée à 8,5 fin juillet.",
      },
      {
        ...ALIENOR,
        heure: "08:10",
        texte:
          "Léonie, les huit contrats saisonniers sont signés : ils arrivent le lundi 29 juin, jusqu'au 30 août. Juin, juillet, août : c'est ton trimestre. Dis-moi vendredi comment tu les intègres. Je ne veux pas revivre l'été dernier.",
      },
      {
        ...BERTILIE,
        heure: "09:20",
        texte:
          "Si c'est comme l'an dernier, on les met au comptoir le 29 au soir et on rattrape derrière. J'ai passé juillet à refaire des factures après mon service.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "journal",
        titre: "Relire le journal des anomalies d'Hostéo de l'été dernier",
        cout: 1,
        nature: "decisive",
        resultat:
          "Sur leurs deux premières semaines, les 5 saisonniers mis au comptoir le jour de leur arrivée ont enregistré 60 erreurs de facturation (extras du bar et taxe de séjour oubliés, mauvais tarif appliqué), 20 erreurs de plan tarifaire (un non remboursable modifié comme un flexible, une demi-pension accordée sans avoir été vendue) et 5 délogements mal conduits les soirs de surréservation. Les 6 permanents, sur les mêmes deux semaines : 10 erreurs en tout. Deux des cinq saisonniers avaient déjà fait une saison dans un 4 étoiles : ils ont fait autant d'erreurs que les autres.",
      },
      {
        id: "chiffrage",
        titre: "Demander au contrôle de gestion ce que coûte chaque erreur",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Ilse Montmasson, contrôleuse de gestion du groupe : « En moyenne, 45 € par erreur de facturation, ce qu'on ne refacture plus une fois le client parti ; 110 € par erreur de plan tarifaire, l'écart de prix et le geste qui suit ; 380 € par délogement mal conduit, la nuit dans un autre hôtel, le taxi et le geste commercial. »",
      },
      {
        id: "ventes",
        titre: "Regarder les ventes additionnelles de l'été dernier, par réceptionniste",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Surclassements et petits-déjeuners proposés à l'accueil : 24 € de marge par arrivée quand un permanent fait l'accueil, 4,80 € quand c'est un saisonnier dans ses premières semaines, cinq fois moins. En août, les saisonniers vendaient encore moins de la moitié de ce que vendent les permanents.",
      },
      {
        id: "ormea",
        titre: "Comparer avec l'Orméa Hotels d'Évian",
        cout: 1,
        nature: "bruit",
        resultat:
          "L'Orméa (180 chambres) recrute ses saisonniers par une agence nationale, au même salaire que vous, et compte à peu près autant de réceptionnistes par chambre en juillet. Son directeur ne donne pas ses chiffres : « Juillet est dur pour tout le monde. »",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Aliénor Duchosal",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Aliénor : « Avant de compter ce que coûte une semaine de salaires, compte ce que t'a coûté un saisonnier non formé l'été dernier. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Comment accueillez-vous les huit saisonniers ?",
    options: [
      {
        t: "Les faire arriver le 29 juin et les mettre au comptoir dès le premier soir",
        d: "Aucun coût avant la saison, chaque poste est tenu dès le premier jour. Ils apprendront sur le tas.",
      },
      {
        t: "Leur envoyer avant l'arrivée le module Hostéo en ligne et le livret des standards",
        d: "880 € de licences. Ils arrivent le 29 juin en ayant vu le logiciel, et prennent le comptoir le soir même.",
      },
      {
        t: "Les faire venir le 22 juin : une journée d'accueil, deux jours de formation, trois jours à côté d'un permanent, puis deux semaines en binôme",
        d: "Une semaine de salaires en plus et le formateur Hostéo du siège : 6 000 €. Puis 6 heures de permanent par saisonnier et par semaine pendant deux semaines, 1 320 € par semaine.",
      },
      {
        t: "Les faire arriver le 29 juin et les mettre en binôme deux semaines avec un permanent, en plein rush",
        d: "Pas de semaine de plus à payer. 9 heures de permanent par saisonnier et par semaine pendant deux semaines, 1 980 € par semaine.",
      },
    ],
    reactions: [
      [
        {
          ...BERTILIE,
          texte:
            "Comme l'an dernier, alors. Je préviens les permanents qu'on reprendra les factures le soir.",
        },
      ],
      [
        {
          ...MARWA,
          texte:
            "Les accès au module en ligne sont partis. Trois saisonniers sur huit l'ont ouvert ce week-end.",
        },
      ],
      [
        {
          ...ALIENOR,
          texte:
            "D'accord pour la semaine du 22. Le formateur Hostéo du siège est réservé les 23 et 24 juin, et Bertilie prépare les binômes.",
        },
      ],
      [
        {
          ...BERTILIE,
          texte:
            "En binôme le 29, avec trente arrivées à l'heure ? On essaiera. Au comptoir, en plein coup de feu, on n'explique pas grand-chose.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 3 · vendredi",
    titre: "Trois saisonniers sans logement",
    jusqua: 5,
    messages: () => [
      {
        ...MARWA,
        heure: "10:15",
        alerte: true,
        texte:
          "Point logement : cinq saisonniers sur huit ont trouvé, dont trois à Thonon : une demi-heure de bus, et plus de bus après 20 h 40. Loan, Melvil et Thelma n'ont rien : les meublés d'Évian se louent à plus de 900 € en juillet.",
      },
      {
        de: "Thelma Grosset",
        role: "Saisonnière, arrivée prévue le 29 juin",
        heure: "12:40",
        texte:
          "Bonjour madame Combaz, je n'ai toujours rien trouvé à moins d'une heure de l'hôtel. Si je n'ai pas de solution la semaine prochaine, je crois que je vais devoir renoncer.",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "sorties",
        titre: "Relire les entretiens de sortie de l'été dernier",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Trois des sept saisonniers de l'été dernier sont partis avant le 15 août. Deux logeaient à Thonon : dernier bus à 20 h 40 pour une fermeture du comptoir à 23 heures, des taxis à leurs frais. Le troisième a connu ses horaires la veille pendant trois semaines. Tous les trois disaient avoir été mis au comptoir « sans savoir à qui demander ».",
      },
      {
        id: "residence",
        titre: "Appeler la résidence des saisonniers du Chablais",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Huit places possibles, à 200 € par mois et par place ; l'employeur qui le veut en prend la moitié, 100 €. La commission se réunit le 24 juin et accorde environ deux dossiers d'employeur sur trois. En cas de refus, il sera trop tard pour chercher ailleurs.",
      },
      {
        id: "studios",
        titre: "Demander à l'agence immobilière ses meublés de saison",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Quatre studios meublés pour deux à la résidence Les Mouettes, à huit minutes à pied : 850 € par mois chacun en juillet et en août, 200 € de plus pour la dernière semaine de juin. La retenue d'avantage en nature sur les salaires vous rendrait 70 € par mois et par saisonnier.",
      },
      {
        id: "cour",
        titre: "Demander au revenue management ce que valent les chambres côté cour",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Lucile Fabbri : « Les côté cour sont les moins demandées, mais cet été elles partent quand même : 165 € la nuit en moyenne, 112 € de marge par nuit une fois la commission et le coût variable déduits. Et l'hôtel sera plein à plus de 90 % de juillet à fin août. »",
      },
    ],
    question: "Que faites-vous pour le logement ?",
    options: [
      {
        t: "Leur transmettre la liste des annonces de location : ils sont majeurs, c'est l'usage",
        d: "Aucun coût. Chacun se loge comme il peut.",
      },
      {
        t: "Déposer un dossier pour les huit à la résidence des saisonniers, et prendre la moitié du loyer",
        d: "100 € par mois et par place si la commission les accorde, 1 600 € sur l'été. Réponse le 24 juin.",
      },
      {
        t: "Loger les trois sans solution dans deux chambres côté cour de l'hôtel",
        d: "Aucune dépense : ce sont les chambres les moins demandées. Ils seront à deux minutes du comptoir.",
      },
      {
        t: "Louer pour l'été quatre studios à la résidence Les Mouettes, à huit minutes à pied",
        d: "7 600 € de loyers, moins 1 120 € de retenue sur les salaires : 6 480 € sur l'été. Logement assuré pour les huit.",
      },
    ],
    reactions: [
      [
        {
          de: "Thelma Grosset",
          role: "Saisonnière",
          texte:
            "Merci pour la liste. J'ai appelé les six annonces : quatre sont déjà louées, les deux autres à 950 €.",
        },
      ],
      null,
      [
        {
          ...LUCILE,
          texte:
            "Je ferme les deux côté cour à la vente jusqu'au 30 août et je reporte les réservations sur d'autres catégories. Elles étaient vendues à plus de 80 % sur juillet.",
        },
      ],
      [
        {
          de: "Loan Bochaton",
          role: "Saisonnier",
          texte:
            "Un studio à huit minutes du lac ! Merci. Avec Melvil, on arrivera la veille pour s'installer.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "La première semaine de rush",
    jusqua: 7,
    messages: (ctx) => [
      {
        ...EZIO,
        heure: "06:50",
        alerte: true,
        texte: `Audit de nuit de la semaine : ${texte(ctx, "erreurs")} d'erreurs reprises, factures, tarifs et délogements. Sept sur dix entre 18 heures et 23 heures.`,
      },
      {
        ...TABLEAU,
        heure: "07:00",
        texte: `Note Bookalia : ${texte(ctx, "note")}. Saisonniers au comptoir : ${texte(ctx, "enPoste")} sur 8.`,
      },
      {
        ...BERTILIE,
        heure: "11:30",
        texte:
          "Le planning de juillet est publié depuis trois semaines : les six permanents du matin, par ancienneté, comme chaque été. Le soir, ce sont les saisonniers, presque seuls.",
      },
    ],
    sources: [
      {
        id: "audit",
        titre: "Lire le journal des anomalies de la semaine, service par service",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `${texte(ctx, "erreurs")} d'erreurs cette semaine. 70 % entre 18 heures et 23 heures : arrivées tardives, clients Bookalia qui contestent leur tarif, délogements du samedi soir. Sur ces soirées, le planning publié ne met aucun permanent au comptoir.`,
      },
      {
        id: "lac",
        titre: "Appeler la cheffe de réception de L'Escale Lac",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Aglaé Chamoux : « L'été dernier, j'ai mis un permanent sur chaque soirée et dix minutes de point à chaque relève : les erreurs du soir ont baissé de moitié. Les permanents ont râlé deux semaines pour leurs matinées, puis plus du tout. Le planning était publié : j'ai expliqué pourquoi, personne n'est parti. »",
      },
      {
        id: "groupe",
        titre: "Comparer la note de l'hôtel à celle des autres hôtels du groupe",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "L'Escale Lac est à 8,8, Megève à 9,0, Annecy-Centre à 8,6. Les notes du groupe baissent toutes un peu en juillet : plus de clients, plus d'avis.",
      },
    ],
    question: "Que faites-vous du planning ?",
    options: [
      {
        t: "Tenir le planning publié : le changer en plein rush désorganiserait tout",
        d: "Rien à refaire. Les permanents gardent leurs matinées, les saisonniers les soirées.",
      },
      {
        t: "Refaire le planning dès lundi : un permanent sur chaque soirée, et dix minutes de point à chaque relève",
        d: "Pas de coût direct. Trois permanents perdent leurs matinées ; il faut le leur expliquer.",
      },
      {
        t: "Recadrer par écrit les deux saisonniers qui ont fait le plus d'erreurs",
        d: "Un entretien et un courrier chacun. Le message passera à toute l'équipe.",
      },
      {
        t: "Faire reprendre chaque soir les dossiers des saisonniers par les permanents, en heures supplémentaires",
        d: "Les erreurs sont corrigées avant le départ des clients. Plusieurs heures par soir, à 27,50 € de l'heure.",
      },
    ],
    reactions: [
      [
        {
          ...EZIO,
          texte:
            "Encore un samedi soir à trois délogements. Je reprends les factures pendant l'audit de nuit.",
        },
      ],
      [
        {
          ...BERTILIE,
          texte:
            "J'ai pris le mardi et le vendredi soir. Les saisonniers me posent dix questions par heure ; au moins, ils les posent avant de se tromper.",
        },
      ],
      [
        {
          de: "Melvil Gavard",
          role: "Saisonnier",
          texte:
            "J'ai reçu le courrier. Au comptoir, plus personne n'ose demander quoi que ce soit aux permanents.",
        },
      ],
      [
        {
          de: "Lison Taberlet",
          role: "Réceptionniste",
          texte:
            "On reprend les dossiers des saisonniers après le service. Je finis à minuit deux soirs par semaine.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "Elif s'en va",
    jusqua: 9,
    messages: (ctx) => [
      {
        de: "Elif Demirci",
        role: "Saisonnière",
        heure: "22:40",
        alerte: true,
        texte:
          "Léonie, je préfère vous le dire en face : je pars à la fin de la semaine prochaine. Je suis désolée.",
      },
      {
        ...BERTILIE,
        heure: "22:55",
        texte:
          "Elif, c'est la meilleure vendeuse des saisonniers : anglais, allemand, turc. Les clients la demandent au comptoir.",
      },
      {
        ...TABLEAU,
        heure: "23:00",
        texte: `Saisonniers au comptoir cette semaine : ${texte(ctx, "enPoste")} sur 8, ${texte(ctx, "departs")} depuis le 29 juin. Heures supplémentaires des permanents : ${texte(ctx, "heuresSup")}.`,
      },
    ],
    sources: [
      {
        id: "raisons",
        titre: "Relire ce que disaient ceux qui sont partis l'été dernier",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Trois départs, trois raisons : le bus de Thonon, des horaires connus la veille, un client qui avait humilié une saisonnière au comptoir sans que personne intervienne. Deux sur trois ont dit, après coup, qu'ils seraient restés « si quelqu'un avait demandé ».",
      },
      {
        id: "agence",
        titre: "Demander à l'agence d'extras ce qu'elle peut faire",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Un extra dès lundi, à 840 € la semaine au lieu de 600 € pour un saisonnier, plus 400 € de frais. Il n'a jamais vu Hostéo. Pour un départ début août, l'agence ne garantit personne avant le 17.",
      },
      {
        id: "association",
        titre: "Appeler l'association des saisonniers du Chablais",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Un réceptionniste disponible le 27 juillet, deux saisons à Thonon : 250 € de frais, au salaire d'un saisonnier. Deux jours en binôme avant le comptoir : 14 heures de permanent, 385 €.",
      },
      {
        id: "vacance",
        titre: "Calculer ce que coûte un poste vide",
        cout: 0.5,
        nature: "utile",
        resultat:
          "35 heures supplémentaires d'un permanent à 27,50 € : 962,50 € la semaine au lieu des 600 € d'un saisonnier, soit 362,50 € de plus. Et un comptoir qui court : moins de ventes, plus d'erreurs, une file à l'accueil.",
      },
    ],
    question: "Que faites-vous ?",
    options: [
      {
        t: "La remplacer dès lundi par un extra d'agence, au comptoir dès son arrivée",
        d: "840 € la semaine et 400 € de frais. Le poste est tenu sans interruption.",
      },
      {
        t: "Prendre une heure avec elle, puis un point avec chaque saisonnier, avant de décider",
        d: "Une demi-journée de votre temps. Si elle part quand même, le remplaçant arrivera plus tard.",
      },
      {
        t: "Lui proposer 400 € de prime si elle reste jusqu'au 30 août",
        d: "Versés en fin de saison si elle reste. Elle dira oui, ou pas.",
      },
      {
        t: "Recruter par l'association un réceptionniste expérimenté, deux jours en binôme avant le comptoir",
        d: "250 € de frais et 385 € d'heures de binôme. Il arrive le lundi 27 juillet.",
      },
    ],
    reactions: [
      [
        {
          ...MARWA,
          texte:
            "L'agence envoie quelqu'un lundi 27 à 7 heures. Il n'a jamais travaillé dans un 4 étoiles.",
        },
      ],
      null,
      null,
      [
        {
          de: "Association des saisonniers du Chablais",
          role: "Thonon-les-Bains",
          texte:
            "Votre remplaçant sera là le lundi 27 juillet à 8 heures. Il a hâte de voir Hostéo, il ne connaît que l'ancienne version.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "Les ventes additionnelles",
    jusqua: 11,
    messages: (ctx) => [
      {
        ...ALIENOR,
        heure: "09:00",
        alerte: true,
        texte: `Léonie, surclassements et petits-déjeuners : ${texte(ctx, "ventesParArrivee")} de marge par arrivée cette semaine. Le siège veut pousser les ventes en août. Qu'est-ce que tu fais ?`,
      },
      {
        ...LUCILE,
        heure: "09:40",
        texte:
          "Le siège peut financer un challenge individuel : 5 € par surclassement vendu, classement affiché chaque semaine. L'Escale Lac l'a fait en juin.",
      },
    ],
    sources: [
      {
        id: "parVendeur",
        titre: "Regarder les ventes additionnelles de la semaine, par réceptionniste",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Cette semaine : ${texte(ctx, "ventesPermanent")} de marge par arrivée pour les permanents, ${texte(ctx, "ventesSaisonnier")} pour les saisonniers. ${
            ctx.saisonniersEnRetard
              ? "L'écart suit la maîtrise d'Hostéo : un saisonnier qui ne sait pas changer une chambre dans le planning n'ose pas proposer un surclassement."
              : "Les saisonniers vendent comme les permanents : ils savent changer une chambre dans Hostéo, ils osent proposer le surclassement."
          } À L'Escale Lac, les ventes se sont envolées en juin avec le challenge ; la marge, beaucoup moins.`,
      },
      {
        id: "challengeLac",
        titre: "Demander à L'Escale Lac ce qu'a donné son challenge de juin",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Aglaé Chamoux : « Les surclassements vendus ont augmenté de 40 %, mais à 25 % de remise en moyenne, pour gagner au classement : la marge n'a presque pas bougé. Les permanents et les saisonniers se disputaient les arrivées, et trois avis Bookalia ont parlé de vente forcée à l'accueil. »",
      },
      {
        id: "note",
        titre: "Demander au revenue management ce que vaut la note",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Lucile Fabbri : « Chaque dixième de point sous 8,8 sur Bookalia nous fait reculer dans le classement de la plateforme : environ 1 200 € de marge de chambres perdue par semaine en été. »",
      },
    ],
    question: "Que faites-vous pour les ventes d'août ?",
    options: [
      {
        t: "Lancer le challenge du siège pour tous : 5 € par surclassement vendu, classement affiché",
        d: "Financé à 6 % de la marge vendue. Tout le monde vend, saisonniers compris.",
      },
      {
        t: "Réserver les ventes additionnelles aux permanents : les saisonniers ne proposent rien",
        d: "Aucun coût. Les permanents proposent à toutes les arrivées qu'ils font.",
      },
      {
        t: "Un argumentaire écrit pour l'accueil, et une prime collective de 1 800 € si la note finit à 8,8 ou plus",
        d: "1 800 € versés le 30 août si la note tient. Le même argumentaire pour tous.",
      },
      {
        t: "Ne rien changer : l'équipe a assez à faire en août",
        d: "Aucun coût.",
      },
    ],
    reactions: [
      [
        {
          de: "Lison Taberlet",
          role: "Réceptionniste",
          texte:
            "Le classement est affiché. Hier, deux d'entre nous se sont disputé une arrivée devant le client.",
        },
      ],
      [
        {
          de: "Naïs Bertholet",
          role: "Saisonnière",
          texte:
            "On ne propose plus rien ? D'accord… Les clients demandent quand même le petit-déjeuner.",
        },
      ],
      [
        {
          ...BERTILIE,
          texte:
            "L'argumentaire tient sur une page, plastifiée au comptoir. Les saisonniers le savent par cœur en deux jours.",
        },
      ],
      [
        {
          ...ALIENOR,
          texte: "Bien reçu. Le siège demandera pourquoi.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Finir la saison",
    jusqua: 13,
    messages: (ctx) => [
      {
        de: "Aymen Kaci",
        role: "Saisonnier, étudiant",
        heure: "19:05",
        alerte: true,
        texte:
          "Léonie, mes rattrapages sont le 31 août à Lyon. Avec Ilario et Enola, on se demandait si on pouvait partir le 23.",
      },
      {
        ...ALIENOR,
        heure: "19:30",
        texte:
          "Deux mariages les 22 et 29 août, l'hôtel plein jusqu'au 30. Je compte sur toi pour finir la saison au complet.",
      },
      {
        ...TABLEAU,
        heure: "20:00",
        texte: `Saisonniers au comptoir : ${texte(ctx, "enPoste")} sur 8. Note Bookalia : ${texte(ctx, "note")}. Contribution de la réception à date : ${texte(ctx, "contribution")}.`,
      },
    ],
    sources: [
      {
        id: "finEteDernier",
        titre: "Regarder qui était encore là le 30 août l'an dernier",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Des quatre étudiants de l'été dernier, un seul a fini la saison ; les autres sont partis la dernière quinzaine, en prévenant trois jours avant. À L'Escale Lac, une prime de fin de saison de 250 € et la promesse d'être repris l'été suivant ont gardé trois étudiants sur quatre jusqu'au bout.",
      },
      {
        id: "permanents",
        titre: "Demander aux permanents ce qu'ils peuvent encore faire",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Passer à 44 heures jusqu'au 30 août : 9 heures de plus chacun, 54 heures par semaine à 27,50 €, 1 485 € la semaine. Bertilie : « On le fera. Mais on finira l'été rincés, et on le verra au comptoir. »",
      },
    ],
    question: "Comment finissez-vous la saison ?",
    options: [
      {
        t: "Passer les six permanents à 44 heures jusqu'au 30 août",
        d: "54 heures de plus par semaine, 1 485 €. Les départs seront couverts.",
      },
      {
        t: "Une prime de fin de saison de 250 € pour chaque saisonnier présent le 30 août, et la promesse d'être repris l'été prochain",
        d: "250 € par saisonnier qui finit la saison, versés le 30 août.",
      },
      {
        t: "Prendre deux extras d'agence du 17 au 30 août, au comptoir dès leur arrivée",
        d: "840 € la semaine chacun et 400 € de frais chacun : 4 160 €.",
      },
      {
        t: "Ne rien prévoir : ils finiront leur contrat",
        d: "Aucun coût.",
      },
    ],
    reactions: [
      [
        {
          ...BERTILIE,
          texte: "On passe à 44 heures. Je ne promets pas qu'on sourie encore le 29.",
        },
      ],
      [
        {
          de: "Aymen Kaci",
          role: "Saisonnier, étudiant",
          texte:
            "Repris l'été prochain, et 250 € ? Je vais voir si je peux réviser le soir. Les autres en parlent.",
        },
      ],
      [
        {
          ...MARWA,
          texte:
            "Les deux extras arrivent lundi 17 à 7 heures. Ni l'un ni l'autre ne connaît Hostéo.",
        },
      ],
      [
        {
          de: "Aymen Kaci",
          role: "Saisonnier, étudiant",
          texte: "D'accord. On verra avec les autres.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Intégrer avant le rush", chemin: [2, 1, 1, 1, 2, 1] },
  { nom: "Tenir le rush d'abord", chemin: [0, 0, 3, 0, 0, 0] },
  { nom: "Comme chaque été", chemin: [0, 0, 0, 0, 3, 3] },
] as const;

/**
 * Les réflexes d'une réception qui court derrière le rush : mettre au
 * comptoir sans former, tenir un planning qui ne marche pas, faire rattraper
 * les erreurs par les permanents, remplacer par un extra lâché au comptoir,
 * pousser la vente sans préparer, faire tenir la fin de saison par les
 * permanents ou par des extras non formés. [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [2, 0],
  [2, 3],
  [3, 0],
  [4, 0],
  [5, 0],
  [5, 2],
] as const;

const ELIF = { de: "Elif Demirci", role: "Saisonnière" } as const;

export const REPONSES = {
  foyerAccorde:
    "Résidence des saisonniers du Chablais : la commission du 24 juin vous accorde les huit places, du 22 juin au 30 août.",
  foyerRefuse:
    "Résidence des saisonniers du Chablais : la commission du 24 juin n'a pas pu retenir votre dossier, toutes les places sont attribuées. Il reste les annonces.",
  elif: {
    coupures: {
      reste:
        "On a parlé une heure. Ce sont les coupures : 7 heures-11 heures puis 18 heures-23 heures, cinq jours sur sept, je ne dors plus. Avec des journées continues, je reste jusqu'au 30 août.",
      part: "Merci de m'avoir écoutée. Ce sont les coupures, je ne dors plus. Mais j'ai déjà dit oui ailleurs : je pars à la fin de la semaine prochaine.",
    },
    client: {
      reste:
        "C'est le client de mardi, qui m'a traitée d'incapable devant tout le hall, et personne n'est venu. Si je sais que quelqu'un viendra la prochaine fois, je reste.",
      part: "C'est le client de mardi, et personne n'est venu. Merci de m'avoir écoutée, mais je n'ai plus envie de revenir au comptoir. Je pars.",
    },
    geneve: {
      reste:
        "Un hôtel de Genève me propose 3 400 francs par mois. Mais vous m'avez écoutée, et mon contrat finit le 30 août : je finis la saison ici, Genève attendra septembre.",
      part: "Un hôtel de Genève me propose 3 400 francs par mois, à partir du 1er août. Je ne peux pas refuser. Merci de m'avoir écoutée.",
    },
    point:
      "Le point avec les autres saisonniers fait remonter les mêmes choses : les coupures, et personne pour les soutenir face à un client difficile. Vous ajustez le planning et désignez un permanent référent par service.",
  },
  primeAcceptee: "400 € ? D'accord, je finis la saison. Merci.",
  primeRefusee:
    "C'est gentil, mais ce n'est pas une question d'argent. Je pars à la fin de la semaine prochaine.",
} as const;

/** La réponse d'Elif, selon ce qu'on lui a proposé et ce qui la fait partir. */
export function reponseDElif(
  choix: "entretien" | "prime",
  cause: "coupures" | "client" | "geneve",
  reste: boolean,
): Message[] {
  if (choix === "prime") {
    return [{ ...ELIF, texte: reste ? REPONSES.primeAcceptee : REPONSES.primeRefusee }];
  }
  return [
    { ...ELIF, texte: REPONSES.elif[cause][reste ? "reste" : "part"] },
    { ...BERTILIE, texte: REPONSES.elif.point },
  ];
}
