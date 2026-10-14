/**
 * LA CROISSANCE À FINANCER — le contenu de l'épisode.
 *
 * Benoît Ollivier est directeur administratif et financier d'Arvel
 * Rénovation, la filiale du groupe Arvel qui vend et pose des menuiseries et
 * des isolations pour les particuliers et les bailleurs. Elle vient de gagner
 * le plus gros marché de son histoire. Six décisions, chacune précédée de ce
 * qu'un directeur financier reçoit vraiment : un marché signé, une holding
 * qui attend son dividende, un salon à préparer, un second marché qui se
 * présente, un fabricant dont l'assureur-crédit plafonne l'encours, et la
 * semaine des primes.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Leurs chiffres sont ceux du
 * modèle (src/engine/episodes/croissance-a-financer.ts), et un test le vérifie.
 *
 * Entreprise, personnes et chiffres sont fictifs. Montants hors taxes.
 */
import type { Etape } from "./types";

export const DIAGNOSTICS = [
  {
    id: "structurel",
    t: "Le marché crée un besoin en fonds de roulement durable, que la filiale n'a pas les ressources stables pour financer",
  },
  {
    id: "decalage",
    t: "Le marché va creuser la trésorerie quelques mois, le temps qu'Altaïr commence à payer",
  },
  { id: "rentabilite", t: "Le marché Altaïr n'est pas assez rentable pour la filiale" },
  {
    id: "decouvert",
    t: "L'autorisation de découvert est trop basse pour une filiale qui grandit",
  },
] as const;

const GAEL = { de: "Gaël Montbrun", role: "Directeur général" } as const;
export const BANQUE = { de: "Maud Ferrière", role: "Chargée d'affaires entreprises, la banque" };
const MAEVA = { de: "Maëva Quintard", role: "Contrôleuse de gestion" } as const;
const RAYAN = { de: "Rayan Belhadj", role: "Directeur commercial" } as const;
export const ODILON = { de: "Odilon Ebrard", role: "Directeur des travaux" };
export const SILVERE = { de: "Silvère Darmont", role: "Chef de chantier, Altaïr" };
const PAOLA = { de: "Paola Ricci", role: "Cheffe comptable" } as const;
export const SIGRID = { de: "Sigrid Aumont", role: "Directrice financière du groupe" };
export const VALCOURT = {
  de: "Dorian Lefort",
  role: "Responsable grands comptes, Menuiseries Valcourt",
};
const ALTAIR = { de: "Ulysse Garnache", role: "Directeur du patrimoine, Foncière Altaïr" } as const;
export const CLAIRVAL = { de: "Ilan Marchesseau", role: "Responsable travaux, Foncière Clairval" };
const TABLEAU = { de: "Tableau de trésorerie", role: "Point hebdomadaire" } as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Le marché Altaïr démarre",
    jusqua: 3,
    messages: (ctx) => [
      {
        de: "Relevé bancaire",
        role: "Alerte automatique",
        heure: "07:30",
        texte: `Solde du compte courant : −${ctx.decouvert}, pour une autorisation de découvert de ${ctx.autorisation}.`,
      },
      {
        ...GAEL,
        heure: "08:10",
        texte:
          "Benoît, Altaïr, c'est signé : 3,65 M€ par an pour changer les fenêtres et isoler leurs résidences, les poses commencent la semaine prochaine. Le plus gros marché de notre histoire. Je ne veux pas que l'argent soit un problème : qu'est-ce que tu mets en place ?",
      },
      {
        ...ODILON,
        heure: "09:20",
        texte:
          "Valcourt a livré vendredi la première tranche de menuiseries, 35 k€. Ensuite, 35 k€ chaque semaine, toujours deux semaines avant la pose.",
      },
      {
        ...MAEVA,
        heure: "09:45",
        texte:
          "J'ai les ratios de BFR de nos chantiers de bailleurs, si tu veux chiffrer Altaïr avant le comité de crédit de la semaine prochaine.",
      },
      {
        ...RAYAN,
        heure: "11:05",
        texte:
          "N'oubliez pas le salon de l'habitat en semaine 6 : c'est le meilleur mois de l'année chez les particuliers.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "marche",
        titre: "Relire les conditions financières du marché Altaïr",
        cout: 1,
        nature: "decisive",
        resultat:
          "3,65 M€ hors taxes par an : 70 k€ de travaux par semaine, 10 k€ par jour. Une situation par mois, payée à 60 jours après le visa du maître d'œuvre. Entre les travaux et l'encaissement : 15 jours en moyenne avant la situation, 2 jours de visa, 60 jours de délai, soit 77 jours. Altaïr ne paiera sa première situation qu'en semaine 13.",
      },
      {
        id: "bfr",
        titre: "Demander à Maëva le BFR normatif d'un chantier de bailleur",
        cout: 1,
        nature: "decisive",
        resultat:
          "Sur nos chantiers, les menuiseries font la moitié du prix de vente. Valcourt les livre deux semaines avant la pose : 14 jours de menuiseries en stock, soit 7 jours de chiffre d'affaires. Il est payé par LCR 56 jours après la livraison : 28 jours de chiffre d'affaires de crédit fournisseur. Les poseurs intérimaires sont payés chaque semaine. Pour comparaison, l'activité des particuliers, qui versent 30 % d'acompte, tourne avec 15 jours de chiffre d'affaires de BFR.",
      },
      {
        id: "prevision",
        titre: "Construire la prévision de trésorerie à treize semaines",
        cout: 1.5,
        nature: "utile",
        resultat: (ctx) =>
          `Sans financement nouveau, et avec le dividende de 250 k€ que le groupe attend en semaine 5, le besoin de financement dépasse l'autorisation dès la semaine ${ctx.premierDepassement} et atteint ${ctx.besoinPic} en semaine ${ctx.semainePic}. La semaine 12 concentre la paie de mars et les primes de résultat de l'an dernier : 160 k€ de plus qu'une semaine ordinaire.`,
      },
      {
        id: "rentabilite",
        titre: "Relire le compte de résultat prévisionnel du marché",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Taux de marge sur coût variable de 20 % : 14 k€ par semaine de travaux, 11,5 k€ après le conducteur de travaux. Le marché est rentable dès sa première semaine de pose et ajoute environ 135 k€ au résultat du trimestre.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à la directrice financière du groupe",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Sigrid Aumont : « Un besoin qui dure se finance avec de l'argent qui dure. Le découvert, c'est pour les à-coups de quelques semaines. Et une banque prête sur des chiffres, pas sur un enthousiasme. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Comment financez-vous le démarrage du marché ?",
    options: [
      {
        t: "Démarrer à plein et laisser le découvert absorber le besoin",
        d: "Le marché est rentable : la trésorerie suivra. Ne coûte rien.",
      },
      {
        t: "Chiffrer le BFR du marché et demander un prêt à moyen terme",
        d: "Prévision et plan de financement pour le comité de la semaine 2. La banque finance d'ordinaire 70 % d'un besoin chiffré : 400 k€ sur cinq ans à 4,5 %, 2 000 € de frais de dossier.",
      },
      {
        t: "Demander à la banque de porter le découvert autorisé à 700 k€",
        d: "Une demande par courriel au comité de la semaine 2. 2 000 € de commission d'engagement si elle est acceptée.",
      },
      {
        t: "Obtenir d'Altaïr qu'il décale le démarrage de deux semaines",
        d: "Le temps de voir venir. Deux semaines de travaux en moins ce trimestre.",
      },
    ],
    reactions: [
      [
        {
          ...SILVERE,
          texte:
            "Les équipes sont prêtes, les menuiseries sont là : on démarre lundi au 12, rue des Tanneurs. Le premier bâtiment sera fini en semaine 4.",
        },
      ],
      null,
      null,
      [
        {
          ...ALTAIR,
          texte:
            "C'est inhabituel, mais soit : vous démarrez en semaine 4. Je compte sur vous pour tenir le planning ensuite, les locataires sont prévenus.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 3 · vendredi",
    titre: "Le groupe attend son dividende",
    jusqua: 5,
    messages: (ctx) => [
      {
        ...SIGRID,
        heure: "09:00",
        alerte: true,
        texte:
          "Benoît, comme chaque année, la holding remonte le dividende de ses filiales en semaine 5 : 250 k€ pour Arvel Rénovation, c'est au budget. Dis-moi si tu vois un problème.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `${ctx.pret ? "Le prêt de 400 k€ est arrivé mardi. " : ""}Découvert : ${ctx.decouvert}, pour une autorisation de ${ctx.autorisation}. Fonds de roulement : ${ctx.frng}. Besoin en fonds de roulement : ${ctx.bfr}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "dividende",
        titre: "Refaire la prévision avec et sans le dividende",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Dividende versé en semaine 5 : le besoin de financement atteint ${ctx.picDividende} au plus haut d'ici la fin du trimestre. Dividende laissé dans la filiale : ${ctx.picCompteCourant}. Maud Ferrière le rappelle : au-delà de l'autorisation de ${ctx.autorisation}, la banque laisse passer 100 k€ au plus, à 14 % l'an, et rejette les LCR au-delà.`,
      },
      {
        id: "convention",
        titre: "Relire la convention de trésorerie du groupe",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Un dividende décidé peut rester dans la filiale en compte courant d'associé, bloqué deux ans : rémunéré 5,5 % l'an, il compte alors parmi les ressources stables. Une augmentation de capital demande une assemblée : les fonds arrivent en semaine 9 au plus tôt, avec 4 000 € de frais d'acte.",
      },
    ],
    question: "Que répondez-vous au groupe ?",
    options: [
      {
        t: "Verser le dividende comme prévu au budget",
        d: "250 k€ remontent à la holding en semaine 5.",
      },
      {
        t: "Proposer de laisser le dividende en compte courant bloqué",
        d: "La holding garde sa créance, la filiale garde l'argent deux ans, rémunéré 5,5 % l'an.",
      },
      {
        t: "Verser le dividende et demander une augmentation de capital du même montant",
        d: "Les fonds reviennent en semaine 9, après l'assemblée ; 4 000 € de frais d'acte.",
      },
      {
        t: "Verser la moitié, laisser l'autre en compte courant",
        d: "125 k€ remontent en semaine 5 ; le reste à 5,5 % l'an.",
      },
    ],
    reactions: [
      [{ ...SIGRID, texte: "Merci, Benoît. Le virement est programmé pour la semaine 5." }],
      [
        {
          ...SIGRID,
          texte:
            "Ton tableau est clair : le marché Altaïr immobilise de l'argent pour des années. Le comité de direction accepte de laisser les 250 k€ en compte courant bloqué. C'est de l'argent du groupe : traite-le comme tel.",
        },
      ],
      [
        {
          ...SIGRID,
          texte:
            "D'accord pour l'augmentation de capital : je convoque l'assemblée, les fonds arriveront en semaine 9. Le dividende part en semaine 5 comme prévu.",
        },
      ],
      [
        {
          ...SIGRID,
          texte:
            "Va pour la moitié : 125 k€ en semaine 5, le reste en compte courant. Le président aurait préféré tout.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · vendredi",
    titre: "Le salon de l'habitat",
    jusqua: 7,
    messages: (ctx) => [
      {
        ...RAYAN,
        heure: "10:00",
        texte:
          "Le stand est réservé : 8 000 €. Quatre semaines de commandes à prendre à partir de lundi, posées quatre semaines après. Les concurrents affichent des acomptes à 10 % : si on fait pareil, je signe 34 k€ par semaine au lieu de 30.",
      },
      {
        ...PAOLA,
        heure: "15:30",
        texte: `Point du vendredi : découvert ${ctx.decouvert}, fonds de roulement ${ctx.frng}, BFR ${ctx.bfr}. Les acomptes des particuliers sont encaissés à la commande, un mois avant que l'on paie quoi que ce soit.`,
      },
    ],
    sources: [
      {
        id: "salons",
        titre: "Comparer les salons des années passées",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Avec 30 % d'acompte, 2 % des clients se désistent une fois leurs menuiseries fabriquées. Au salon d'automne, à 10 % d'acompte : 19 % de désistements, et 4 % des soldes jamais payés. Une menuiserie sur mesure ne se revend pas : un désistement coûte les menuiseries, la moitié du prix, moins l'acompte que l'on garde. Le taux de marge sur coût variable des particuliers est de 36 %.",
      },
      {
        id: "credit",
        titre: "Demander l'offre de l'organisme de crédit partenaire",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Paiement en quatre fois sans frais pour le client, qui verse 10 % d'acompte : l'organisme règle les 90 % restants une semaine après la pose, moins une commission de 5 % du montant financé, à notre charge. Désistements constatés chez nos confrères : 6 %. Rayan compte sur 34 k€ de commandes par semaine.",
      },
    ],
    question: "Comment vendez-vous au salon ?",
    options: [
      {
        t: "Ramener l'acompte à 10 % pour signer plus",
        d: "Rayan prévoit 34 k€ de commandes par semaine au lieu de 30.",
      },
      {
        t: "Faire le salon en gardant l'acompte à 30 %",
        d: "Environ 30 k€ de commandes par semaine pendant quatre semaines.",
      },
      {
        t: "Proposer le paiement en quatre fois avec l'organisme de crédit",
        d: "34 k€ de commandes par semaine ; 5 % du montant financé à notre charge.",
      },
      {
        t: "Renoncer au salon : la trésorerie est déjà assez tendue",
        d: "8 000 € de stand économisés, pas de commandes nouvelles.",
      },
    ],
    reactions: [
      [
        {
          ...RAYAN,
          texte:
            "Affiche « acompte 10 % » sur tout le stand : les visiteurs signent plus vite. On verra combien confirment quand les menuiseries arriveront.",
        },
      ],
      [
        {
          ...RAYAN,
          texte:
            "On garde 30 %. Les clients qui signent savent ce qu'ils veulent : on a déjà un carnet bien rempli pour la première semaine.",
        },
      ],
      [
        {
          ...RAYAN,
          texte:
            "Le « quatre fois sans frais » attire du monde au stand. L'organisme valide les dossiers en vingt-quatre heures.",
        },
      ],
      [
        {
          ...RAYAN,
          texte:
            "Dommage. Nos deux concurrents y seront, et les particuliers qui rénovent ce printemps signeront chez eux.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · vendredi",
    titre: "Un second marché se présente",
    jusqua: 9,
    messages: (ctx) => [
      {
        ...CLAIRVAL,
        heure: "09:30",
        alerte: true,
        texte:
          "Monsieur Ollivier, vos équipes ont une belle réputation chez Altaïr. Nous avons quatre bâtiments à rénover à Vénissieux : 4,16 M€ par an, mêmes conditions de paiement qu'Altaïr, poses à partir de la semaine 10. Nous demandons une caution de bonne exécution de 5 % du montant annuel. Réponse lundi.",
      },
      {
        ...ODILON,
        heure: "11:15",
        texte:
          "Deux bâtiments, je les fais tout de suite avec l'équipe d'Altaïr renforcée. Les quatre, il faut deux équipes d'intérimaires à recruter et à former, et elles tourneront à 60 % les deux premières semaines.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Découvert : ${ctx.decouvert}. Fonds de roulement : ${ctx.frng}. BFR : ${ctx.bfr}, et il monte chaque semaine.`,
      },
    ],
    sources: [
      {
        id: "simulation",
        titre: "Simuler le besoin de financement avec le lot complet, la moitié ou rien",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Au plus haut d'ici la fin du trimestre : ${ctx.picComplet} de besoin avec les quatre bâtiments, ${ctx.picMoitie} avec deux, ${ctx.picSansLot} sans le lot, pour une autorisation de ${ctx.autorisation}. Sans ligne de cautions, la banque ne délivre la caution que contre un gage-espèces de la moitié, bloqué jusqu'à la réception : 104 k€ pour le lot complet, 52 k€ pour la moitié.`,
      },
      {
        id: "marge",
        titre: "Calculer la marge du lot Clairval",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Taux de marge sur coût variable de 18 % : 14,4 k€ par semaine pour les quatre bâtiments, 7,2 k€ pour deux. Les équipes : 3 000 € par semaine et 8 000 € de recrutement et de formation pour les quatre ; 1 500 € par semaine et 3 000 € pour deux.",
      },
    ],
    question: "Que répondez-vous à la Foncière Clairval ?",
    options: [
      {
        t: "Prendre les quatre bâtiments dès la semaine 10",
        d: "8 000 € de recrutement et de formation, puis 3 000 € par semaine. Gage-espèces de 104 k€ pour la caution.",
      },
      {
        t: "Prendre deux bâtiments maintenant, les deux autres au trimestre prochain",
        d: "L'équipe d'Altaïr renforcée : 3 000 € de démarrage, 1 500 € par semaine. Gage-espèces de 52 k€.",
      },
      {
        t: "Décliner : Altaïr suffit pour cette année",
        d: "Rien ne change.",
      },
      {
        t: "Prendre les quatre bâtiments contre un acompte de démarrage de 90 k€",
        d: "L'acompte couvrirait une partie du besoin. Clairval peut aussi confier le lot à un concurrent.",
      },
    ],
    reactions: [
      [
        {
          ...CLAIRVAL,
          texte:
            "Parfait : les quatre bâtiments sont à vous. L'ordre de service part lundi, avec le modèle de caution.",
        },
      ],
      [
        {
          ...CLAIRVAL,
          texte:
            "Deux bâtiments maintenant, deux au trimestre prochain : c'est raisonnable. Je préfère une entreprise qui tient ses délais.",
        },
      ],
      [
        {
          ...CLAIRVAL,
          texte: "Je le regrette. Pensez à nous pour la prochaine consultation.",
        },
      ],
      null,
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "Valcourt atteint son plafond",
    jusqua: 11,
    messages: (ctx) => [
      {
        ...VALCOURT,
        heure: "10:15",
        alerte: true,
        texte: `Monsieur Ollivier, votre encours chez nous atteint ${ctx.encours}. À partir de lundi, notre assureur-crédit ne couvre plus que 250 k€ sur Arvel Rénovation : au-delà, il nous faudra un paiement à la livraison, ou une garantie.`,
      },
      {
        ...ODILON,
        heure: "11:40",
        texte:
          "Attention : les conditions de Valcourt ont une clause de réserve de propriété. S'il se sent en risque, il reprend les menuiseries non payées qui attendent sur le chantier, et on s'arrête. Altaïr applique 6 000 € de pénalités par semaine de retard.",
      },
    ],
    sources: [
      {
        id: "encours",
        titre: "Projeter l'encours Valcourt des quatre prochaines semaines",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `L'encours montera à ${ctx.encoursMax} d'ici la semaine 13 : payer à la livraison ce qui dépasse 250 k€, c'est sortir jusqu'à ${ctx.excesValcourt} de plus avant la fin du trimestre. La holding peut garantir l'encours auprès de Valcourt : 900 € de commission, et les 56 jours sont conservés.`,
      },
      {
        id: "orsel",
        titre: "Consulter un second fabricant",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Menuiseries Orsel peut reprendre le lot Clairval et un tiers des menuiseries d'Altaïr à partir de la semaine 10, aux mêmes délais de paiement, mais 4 % plus cher.",
      },
    ],
    question: "Que faites-vous avec Valcourt ?",
    options: [
      {
        t: "Continuer à commander : Valcourt ne lâchera pas un client comme nous",
        d: "Rien ne change pour l'instant.",
      },
      {
        t: "Faire garantir l'encours par la holding",
        d: "900 € de commission ; Valcourt garde ses 56 jours.",
      },
      {
        t: "Payer à la livraison tout ce qui dépasse le plafond",
        d: "Pas de frais ; l'excédent sort de la trésorerie dès la semaine 10.",
      },
      {
        t: "Confier une partie des commandes à un second fabricant",
        d: "Orsel prend le lot Clairval et un tiers d'Altaïr, 4 % plus cher.",
      },
    ],
    reactions: [
      null,
      [
        {
          ...VALCOURT,
          texte:
            "La garantie de la holding nous est parvenue : notre assureur relève votre plafond. Rien ne change pour vos livraisons.",
        },
      ],
      [
        {
          ...PAOLA,
          texte:
            "Entendu : à partir de lundi, je paie Valcourt à la livraison pour tout ce qui dépasse 250 k€ d'encours.",
        },
      ],
      [
        {
          ...ODILON,
          texte:
            "Orsel livre à partir de la semaine 10. Il faudra vérifier les cotes : ce ne sont pas tout à fait les mêmes profilés.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "La semaine des primes",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...PAOLA,
        heure: "08:30",
        alerte: true,
        texte:
          "Rappel : la paie de mars part la semaine prochaine avec les primes de résultat de l'an dernier, 160 k€ de plus qu'une paie ordinaire.",
      },
      {
        ...GAEL,
        heure: "09:15",
        texte: `Le découvert est à ${ctx.decouvert}. Est-ce qu'on passe la semaine prochaine sans casse ?`,
      },
    ],
    sources: [
      {
        id: "pic",
        titre: "Mettre à jour la prévision des semaines 12 et 13",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Avec les primes, le besoin de financement atteindrait ${ctx.besoinPic} en semaine ${ctx.semainePic}, pour une autorisation de ${ctx.autorisation} ; il redescendra dès les semaines suivantes, avec les premiers paiements d'Altaïr et les soldes du salon. ${
            ctx.arrieres
              ? `Et ${ctx.arrieres} de factures fournisseurs attendent déjà d'être payées.`
              : "Aucune facture fournisseur n'est en retard."
          }`,
      },
      {
        id: "dailly",
        titre: "Demander à Maud les conditions d'une cession Dailly",
        cout: 0.5,
        nature: "utile",
        resultat:
          "La banque avance 250 k€ sur les situations visées d'Altaïr : convention-cadre et notification au maître d'ouvrage, 2 400 € ; commission de 0,4 % ; intérêts à 5,5 % l'an jusqu'au paiement. Un prêt complémentaire à moyen terme ? « Le comité ne se réunit pas avant trois semaines, et c'est 1 500 € de frais de dossier. »",
      },
    ],
    question: "Comment passez-vous la semaine des primes ?",
    options: [
      {
        t: "Demander à Valcourt de reporter de deux semaines les LCR de fin mars",
        d: "Libère environ 70 k€ au moment du pic ; 600 € de frais de report.",
      },
      {
        t: "Passer les primes sur le découvert autorisé",
        d: "Quelques jours d'agios à 7 % l'an.",
      },
      {
        t: "Céder en Dailly 250 k€ de situations d'Altaïr",
        d: "L'argent arrive en semaine 12 ; 2 400 € de mise en place, 0,4 % de commission, 5,5 % l'an.",
      },
      {
        t: "Demander un prêt complémentaire à moyen terme",
        d: "150 k€ sur cinq ans ; 1 500 € de frais de dossier.",
      },
    ],
    reactions: [
      [
        {
          ...VALCOURT,
          texte:
            "Je transmets votre demande de report à notre service crédit. Vous comprendrez que notre assureur en sera informé.",
        },
      ],
      [{ ...PAOLA, texte: "Entendu : la paie et les primes partiront sur le découvert." }],
      [
        {
          ...BANQUE,
          texte:
            "La convention Dailly est signée et Altaïr a reçu la notification : 250 k€ seront sur votre compte mardi.",
        },
      ],
      [
        {
          ...BANQUE,
          texte:
            "Je monte le dossier pour le comité du mois prochain. D'ici là, votre autorisation de découvert reste ce qu'elle est.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Chiffrer, financer selon la nature du besoin, doser", chemin: [1, 1, 1, 1, 1, 1] },
  { nom: "Tout prendre, tout au découvert", chemin: [0, 0, 0, 0, 0, 0] },
  { nom: "Attentiste", chemin: [0, 0, 3, 2, 0, 1] },
] as const;

/**
 * Les réflexes du métier devant la croissance : la prendre toute et la
 * financer au découvert, ou la refuser par peur de la trésorerie ; et, quand
 * l'argent manque, le prendre aux fournisseurs. [décision, option].
 */
export const REFLEXES = [
  [0, 0],
  [0, 3],
  [1, 0],
  [2, 0],
  [2, 3],
  [3, 0],
  [3, 2],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  pretAccorde:
    "Votre dossier est solide : le besoin est chiffré, il est durable, et vous le financez à sa mesure. Le comité accorde 400 k€ sur cinq ans à 4,5 %, avec six mois de différé. Les fonds seront sur votre compte en semaine 3.",
  pretRefuse:
    "Le comité a examiné votre dossier et le refuse : il trouve la filiale trop jeune sur ce type de marché. Votre autorisation reste de 300 k€. Revenez vers nous dans six mois.",
  relevementAccorde:
    "Le comité accepte, du bout des lèvres, de porter votre autorisation à 700 k€ jusqu'à la fin juin. Il vous rappelle qu'un découvert se révise à tout moment.",
  relevementRefuse:
    "Le comité refuse : on ne finance pas un besoin permanent par du découvert. Votre autorisation reste de 300 k€. S'il s'agit du marché Altaïr, venez avec un dossier de prêt.",
  clairvalAccepte:
    "Nous ne versons d'acompte qu'exceptionnellement, mais votre dossier nous rassure : 90 k€ en semaine 9, déduits des premières situations. Les quatre bâtiments sont à vous.",
  clairvalRefuse:
    "Nous ne versons pas d'acompte de démarrage. Nous confions le lot à l'entreprise classée deuxième. Je le regrette.",
  valcourtTolere:
    "Notre direction accepte de laisser filer votre encours au-delà du plafond, pour cette fois. Ne tardez pas à régulariser.",
  valcourtExige:
    "Notre assureur ne couvre plus votre encours au-delà de 250 k€ et vous n'avez rien proposé : nous faisons jouer notre réserve de propriété sur les menuiseries non payées, et désormais nous livrons contre paiement de tout ce qui dépasse le plafond.",
  reportAccepte: "Report accordé à titre exceptionnel. Nos pénalités de retard s'appliqueront.",
  reportRefuse:
    "Notre assureur-crédit a dégradé votre note après votre demande de report : nous suspendons nos livraisons et reprenons les menuiseries non payées jusqu'au règlement de vos échéances.",
} as const;
