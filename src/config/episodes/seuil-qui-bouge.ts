/**
 * LE SEUIL QUI BOUGE — le contenu de l'épisode.
 *
 * Rachid Brossard dirige le drive matériaux d'Arvel Distribution à
 * Bourgoin-Jallieu, ouvert depuis un mois. Le plan d'affaires l'a dimensionné
 * pour 300 retraits par semaine ; il en fait 254. Tout le monde lui demande de
 * « passer le seuil » : en figeant la structure du plan, qui est la moins
 * chère au volume du plan, ou en baissant les prix pour faire du volume. Six
 * décisions, chacune précédée de ce qu'un directeur de site reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Chaque chiffre qu'elles
 * donnent se recalcule depuis les constantes du modèle.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";

const GILDAS = { de: "Gildas Peyronnet", role: "Directeur régional" } as const;
const INAYA = { de: "Inaya Fofana", role: "Contrôleuse de gestion régionale" } as const;
const BOGDAN = { de: "Bogdan Ilić", role: "Chef d'équipe préparation" } as const;
const PERRINE = { de: "Perrine Gaudry", role: "Vendeuse au comptoir" } as const;
const LORRAINE = { de: "Lorraine Becquet", role: "Agence d'intérim Isère Emploi" } as const;
const OCTAVE = {
  de: "Octave Dumesnil",
  role: "Gestionnaire du bâtiment, foncière Alpes Logistique",
} as const;
const JONAS = { de: "Jonas Ruffier", role: "Loueur de matériel de manutention" } as const;
const ADAMA = { de: "Adama Sissoko", role: "Conducteur de travaux, Bâtir Nord-Isère" } as const;
const TABLEAU = { de: "Tableau de bord du drive", role: "Point hebdomadaire" } as const;

export const DIAGNOSTICS = [
  {
    id: "structure",
    t: "La marge de sécurité est mince et la demande incertaine : chaque charge fixe ajoutée rapproche le seuil du chiffre d'affaires",
  },
  {
    id: "volume",
    t: "Le volume n'est pas au rendez-vous : il manque une cinquantaine de retraits par semaine pour tenir le plan",
  },
  {
    id: "prix",
    t: "Les prix sont trop hauts pour un drive qui démarre : il faut les baisser pour faire du volume et s'éloigner du seuil",
  },
  {
    id: "variables",
    t: "L'intérim et la location à l'heure coûtent trop cher : il faut des moyens à soi pour baisser le coût d'un retrait",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Un mois après l'ouverture",
    jusqua: 2,
    messages: () => [
      {
        ...TABLEAU,
        heure: "07:30",
        alerte: true,
        texte:
          "Premier mois d'exploitation : 1 100 retraits, 275 k€ de chiffre d'affaires, 7 k€ de résultat. Plan d'affaires : 300 retraits par semaine en rythme de croisière.",
      },
      {
        ...GILDAS,
        heure: "08:15",
        texte:
          "Rachid, 7 k€ sur le premier mois, c'est maigre. Le plan prévoit trois préparateurs en CDI : un CDI coûte 3 000 € par mois charges comprises et prépare 100 retraits par semaine, soit 6,92 € le retrait, contre 10 € en intérim au coup par coup. Signe les embauches cette semaine : chaque retrait coûtera moins cher.",
      },
      {
        ...LORRAINE,
        heure: "10:40",
        texte:
          "Monsieur Brossard, si vous nous donnez un planning prévisionnel, nous pouvons passer en contrat-cadre : 8 € par retrait préparé au lieu de 10 €, sans engagement de volume.",
      },
      {
        ...INAYA,
        heure: "11:20",
        texte:
          "Le comité régional fait le point du drive vendredi. Il voudra ton seuil de rentabilité mensuel, et savoir ce que tu engages.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "compte",
        titre:
          "Reprendre le compte de résultat du premier mois, charges fixes et variables séparées",
        cout: 1,
        nature: "decisive",
        resultat:
          "Chiffre d'affaires : 275 000 € pour 1 100 retraits, 250 € de panier moyen. Charges variables : achats des marchandises vendues 203 500 € (74 % du tarif), préparation par l'intérim au coup par coup 11 000 €, chariot loué à l'heure 2 750 €, encaissement, film et palettes perdues 2 750 €. Charges fixes : convention d'occupation précaire 16 000 €, salaires de l'équipe permanente 21 000 €, énergie, informatique et assurances 4 500 €, amortissements des aménagements et du logiciel de commande 6 500 €. Résultat : 7 000 €.",
      },
      {
        id: "drives",
        titre: "Regarder la courbe des retraits, et ce qu'ont fait les autres drives du groupe",
        cout: 1,
        nature: "decisive",
        resultat:
          "Le drive fait 254 retraits par semaine en moyenne, sans tendance nette depuis la deuxième semaine. Le groupe a ouvert quatre drives en deux ans. Au quatrième mois, un a dépassé son plan ; deux plafonnent autour de 85 % du plan ; le dernier a perdu 40 % de ses retraits quand un grand chantier s'est arrêté et qu'un concurrent s'est installé à côté.",
      },
      {
        id: "plan",
        titre: "Relire le plan d'affaires du drive",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Le plan retient 300 retraits par semaine en rythme de croisière, trois préparateurs en CDI, un bail à loyer fixe et deux chariots en crédit-bail : « la structure la plus économique au volume cible ». Le budget du trimestre est bâti sur 270 retraits par semaine.",
      },
      {
        id: "secteur",
        titre: "Faire le tour des négoces et des chantiers du secteur",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Brenaz Matériaux aménage un drive à L'Isle-d'Abeau, à huit kilomètres ; ses vendeurs annoncent des prix « 5 % sous Arvel ». La deuxième tranche de la ZAC de la Maladière, qui fait un quart de vos retraits, attend toujours son financement.",
      },
      {
        id: "conseil",
        titre: "Appeler Clotilde Abeillon, qui a ouvert le drive de Villefranche",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Clotilde : « Avant de signer quoi que ce soit de fixe, refais ton compte avec un mois à 40 % sous le rythme d'aujourd'hui. C'est ce mois-là qui te dit ce que tu peux te permettre. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Comment organisez-vous la préparation des commandes ?",
    options: [
      {
        t: "Embaucher trois préparateurs en CDI, comme le prévoit le plan",
        d: "Arrivée en semaine 3. 9 000 € par mois, quel que soit le volume ; l'intérim au coup par coup au-delà de 300 retraits par semaine.",
      },
      {
        t: "Embaucher deux préparateurs en CDI, et passer en contrat-cadre d'intérim pour le reste",
        d: "Arrivée en semaine 3. 6 000 € par mois pour 200 retraits par semaine ; au-delà, l'intérim à 8 € le retrait.",
      },
      {
        t: "Garder toute la préparation en intérim, en contrat-cadre",
        d: "8 € par retrait dès la semaine 2, avec un planning prévisionnel. Rien de fixe.",
      },
      {
        t: "Garder l'intérim au coup par coup, le temps d'y voir clair",
        d: "10 € par retrait, comme aujourd'hui.",
      },
    ],
    reactions: [
      [
        {
          ...GILDAS,
          texte:
            "Bien. Trois CDI, c'est le plan : au volume cible, c'est la préparation la moins chère du groupe.",
        },
      ],
      [
        {
          ...BOGDAN,
          texte:
            "Deux CDI pour le socle, l'intérim pour les pointes : je peux faire un planning avec ça.",
        },
      ],
      [
        {
          ...LORRAINE,
          texte:
            "Le contrat-cadre est signé. Envoyez-nous le planning chaque jeudi, nous ajustons le nombre d'intérimaires à vos commandes.",
        },
      ],
      [
        {
          ...BOGDAN,
          texte:
            "Encore des intérimaires différents chaque matin. Ils sont bien, mais je passe une heure par jour à leur expliquer le parc.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Le bail définitif",
    jusqua: 4,
    messages: (ctx) => [
      {
        ...OCTAVE,
        heure: "09:10",
        alerte: true,
        texte:
          "Monsieur Brossard, la convention d'occupation précaire s'achève à la fin de la semaine 4. Pour la première année du bail commercial, la foncière vous laisse le choix : loyer fixe de 13 000 € par mois ; loyer binaire de 6 600 € par mois plus 2 % du chiffre d'affaires ; ou loyer variable de 4,8 % du chiffre d'affaires, sans minimum. Réponse lundi.",
      },
      {
        ...GILDAS,
        heure: "11:30",
        texte:
          "Au volume du plan, le fixe est le moins cher des trois. Ne laisse pas le bailleur toucher à notre chiffre d'affaires.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Retraits en semaine 2 : ${ctx.retraits}. Résultat du trimestre à date : ${ctx.cumul}.`,
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "loyers",
        titre: "Calculer les trois loyers à plusieurs volumes",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Au volume du plan, 1 300 retraits par mois (325 k€) : fixe 13 000 €, binaire 13 100 €, variable 15 600 €. Au rythme d'aujourd'hui, 1 100 retraits (275 k€) : fixe 13 000 €, binaire 12 100 €, variable 13 200 €. À 40 % de moins, 660 retraits (165 k€) : fixe 13 000 €, binaire 9 900 €, variable 7 920 €.",
      },
      {
        id: "seuils",
        titre: "Demander à Inaya ce que chaque loyer fait au seuil",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Inaya : « Un loyer indexé est une charge variable : il baisse les charges fixes, et aussi le taux de marge sur coût variable. Toutes choses égales par ailleurs, avec le loyer fixe, les charges fixes du mois tombent à 45 000 € pour un taux de 20 % ; avec le binaire, 38 600 € pour 18 % ; avec le variable, 32 000 € pour 15,2 %. Fais le calcul du seuil pour chacun. »",
      },
    ],
    question: "Quel loyer signez-vous ?",
    options: [
      {
        t: "Le loyer fixe : 13 000 € par mois",
        d: "Le moins cher au volume du plan. Le même montant, quel que soit le chiffre d'affaires.",
      },
      {
        t: "Le loyer binaire : 6 600 € par mois, plus 2 % du chiffre d'affaires",
        d: "Un minimum garanti au bailleur ; le reste suit l'activité.",
      },
      {
        t: "Le loyer variable : 4,8 % du chiffre d'affaires, sans minimum",
        d: "Le plus cher au volume du plan. Le bailleur partage le risque.",
      },
    ],
    reactions: [
      [
        {
          ...OCTAVE,
          texte:
            "C'est noté : 13 000 € par mois à compter de la semaine 5. Le bail part à la signature.",
        },
      ],
      [
        {
          ...OCTAVE,
          texte:
            "Formule binaire, c'est noté. Vous nous transmettrez le chiffre d'affaires du drive chaque mois.",
        },
      ],
      [
        {
          ...OCTAVE,
          texte:
            "Loyer variable, sans minimum. La foncière l'accepte pour la première année ; elle regardera vos chiffres de près.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Brenaz ouvre son drive",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...PERRINE,
        heure: "07:50",
        alerte: true,
        texte:
          "Trois artisans m'ont montré le prospectus de Brenaz ce matin : drive ouvert lundi en huit, à L'Isle-d'Abeau, « 5 % sous Arvel sur tout ». Ils me demandent si on s'aligne.",
      },
      {
        ...GILDAS,
        heure: "10:05",
        texte:
          "Aligne-toi sur tout, tout de suite. On fera du volume, et c'est le volume qui nous éloignera du seuil.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Retraits en semaine 4 : ${ctx.retraits}. Taux de marge sur coût variable : ${ctx.tauxMcv}. Seuil de rentabilité mensuel : ${ctx.seuil}.`,
      },
    ],
    sources: [
      {
        id: "chambery",
        titre: "Demander à Inaya ce qu'a vécu le drive de Chambéry face à un concurrent",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Inaya : « À Chambéry, sans réponse, le drive a perdu 10 % de ses retraits. S'aligner sur tous les prix a gardé ces 10 % et en a ajouté 2 %. Avant de choisir, compte ce que devient la marge sur coût variable d'un retrait à −5 %. »",
      },
      {
        id: "comparaison",
        titre: "Regarder ce que les artisans comparent vraiment",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Les artisans qui hésitent comparent une trentaine de références : ciment, plâtre, parpaings, plaques, laine de verre. Elles font 20 % du chiffre d'affaires du drive. À Chambéry, l'alignement sur ces seules références a limité les départs à 2 % des retraits ; une garantie de chargement en dix minutes, à 4 %.",
      },
      {
        id: "garantie",
        titre: "Demander à Bogdan s'il peut garantir le chargement en dix minutes",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          ctx.troisCdi
            ? "Bogdan : « Avec les trois CDI, j'ai du monde le matin même quand le volume est creux. Je tiens dix minutes sans renfort. »"
            : "Bogdan : « Aux heures de pointe, il me faut un intérimaire de plus, du lundi au samedi : 2 600 € par mois. Sans lui, je ne garantis rien. »",
      },
    ],
    question: "Comment répondez-vous à Brenaz ?",
    options: [
      {
        t: "Baisser tous les prix du drive de 5 %",
        d: "Alignement complet dès l'ouverture de Brenaz. Les artisans n'ont plus de raison de partir.",
      },
      {
        t: "S'aligner sur les trente références que les artisans comparent",
        d: "Ciment, plâtre, parpaings, plaques, isolant : 20 % du chiffre d'affaires à −5 %. Le reste au tarif.",
      },
      {
        t: "Garder les prix, et garantir le chargement en dix minutes",
        d: "Sinon, la livraison du lendemain est offerte. Un intérimaire de renfort aux heures de pointe : 2 600 € par mois.",
      },
      {
        t: "Ne pas répondre : nos artisans sont fidèles",
        d: "Rien ne change.",
      },
    ],
    reactions: [
      [
        {
          ...PERRINE,
          texte:
            "Les affiches « −5 % sur tout » sont posées. Les artisans sont contents ; deux m'ont dit qu'ils revenaient de chez Brenaz.",
        },
      ],
      [
        {
          ...PERRINE,
          texte:
            "Ciment, plâtre et plaques au prix de Brenaz : c'est ce qu'ils regardaient. Personne ne m'a parlé du reste.",
        },
      ],
      [
        {
          ...PERRINE,
          texte:
            "Le panneau « chargé en dix minutes ou livré demain » plaît. Les pressés restent ; quelques-uns partent pour 5 %.",
        },
      ],
      [
        {
          ...PERRINE,
          texte:
            "Ce matin, deux camionnettes de moins dans la file. Je crois savoir où elles sont.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Les matins de pointe",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...BOGDAN,
        heure: "07:40",
        alerte: true,
        texte: `Entre 6 h 30 et 8 h, jusqu'à douze camionnettes en file pour un seul chariot. Cette semaine, ${ctx.perdus} artisans sont repartis sans charger.`,
      },
      {
        ...JONAS,
        heure: "10:15",
        texte:
          "Monsieur Brossard, le chariot que vous louez à l'heure, je peux vous le céder en crédit-bail : 1 100 € par mois, entretien compris. Un second au même prix si vous voulez, et votre bailleur peut aménager un second quai pour 2 000 €.",
      },
      {
        ...GILDAS,
        heure: "14:00",
        texte:
          "Le plan prévoyait deux chariots en crédit-bail. Au volume cible, c'est bien moins cher que la location à l'heure.",
      },
    ],
    sources: [
      {
        id: "heures",
        titre: "Comparer la location à l'heure et le crédit-bail",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "La location à l'heure revient à 2,50 € par retrait. Un chariot en crédit-bail coûte 1 100 € par mois quel que soit le volume : il revient moins cher que l'heure dès 440 retraits par mois. Le second chariot ne sert qu'aux matins de pointe, au-delà d'environ 200 retraits par semaine.",
      },
      {
        id: "file",
        titre: "Chronométrer la file trois matins de suite",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Avec un seul chariot, le drive charge 290 retraits par semaine sans attente de plus d'un quart d'heure ; avec un second aux heures de pointe, 360 ; avec un second quai, 420. Au-delà, la moitié des artisans qui trouvent la file repartent.",
      },
    ],
    question: "Que faites-vous des chariots ?",
    options: [
      {
        t: "Prendre deux chariots en crédit-bail, et ouvrir le second quai",
        d: "2 200 € par mois et 2 000 € de travaux. Plus de location à l'heure ; 420 retraits par semaine sans file.",
      },
      {
        t: "Prendre le chariot actuel en crédit-bail, et louer le second à l'heure les matins de pointe",
        d: "1 100 € par mois, plus le second chariot quand il sert. 360 retraits par semaine sans file.",
      },
      {
        t: "Tout garder à l'heure, et louer un second chariot les matins de pointe",
        d: "2,50 € par retrait pour le premier, le second quand il sert. 360 retraits par semaine sans file.",
      },
      {
        t: "Ne rien changer",
        d: "Un chariot loué à l'heure ; 290 retraits par semaine sans file.",
      },
    ],
    reactions: [
      [
        {
          ...BOGDAN,
          texte:
            "Le second quai est ouvert, les deux chariots sont à nous. Le matin, ça tourne. L'après-midi, il y en a un qui dort.",
        },
      ],
      [
        {
          ...BOGDAN,
          texte:
            "Le chariot est à nous, et Jonas m'en amène un second les matins chargés. Plus de file au-delà de dix minutes.",
        },
      ],
      [
        {
          ...BOGDAN,
          texte: "Deux chariots les matins chargés, un seul le reste du temps. La file a fondu.",
        },
      ],
      [
        {
          ...PERRINE,
          texte:
            "Encore un plaquiste reparti ce matin sans charger. Il m'a dit qu'il passerait chez Brenaz.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "Bâtir Nord-Isère veut un prix",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...ADAMA,
        heure: "08:20",
        alerte: true,
        texte:
          "Bonjour Monsieur Brossard. Nous construisons 48 logements à Villefontaine. Je peux envoyer nos sous-traitants charger chez vous de la semaine 10 à Noël : une quarantaine de retraits par semaine, 300 € de panier. Mon prix : votre tarif moins 8 %.",
      },
      {
        ...GILDAS,
        heure: "12:30",
        texte:
          "À −8 %, ces retraits ne couvrent pas leur part des charges fixes : on vendrait sous notre prix de revient complet. Refuse poliment.",
      },
      {
        ...TABLEAU,
        heure: "18:00",
        texte: `Retraits en semaine 8 : ${ctx.retraits}. Résultat du trimestre à date : ${ctx.cumul}, pour un budget à date de ${ctx.budgetADate}.`,
      },
    ],
    sources: [
      {
        id: "marginal",
        titre: "Calculer ce que rapporte un retrait de Bâtir de plus",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          `Un retrait de Bâtir à −8 % : 276 € de chiffre d'affaires, 222 € d'achats (74 % de 300 €), 2,50 € d'encaissement ; ${ctx.detailBatir}. Il laisse ${ctx.margeBatir} de marge sur coût variable. Les charges fixes du drive sont payées, que Bâtir vienne ou non.`,
      },
      {
        id: "chantier",
        titre: "Se renseigner sur le chantier de Villefontaine",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Le gros œuvre a pris du retard au printemps. Un fournisseur de Bâtir : « Un chantier sur trois glisse en fin d'année ; ils ne commandent alors que la moitié de ce qu'ils annonçaient. »",
      },
    ],
    question: "Que répondez-vous à Bâtir Nord-Isère ?",
    options: [
      {
        t: "Accepter à −8 %",
        d: "Une quarantaine de retraits par semaine, de la semaine 10 à Noël, au tarif moins 8 %. Vos autres clients gardent leurs prix.",
      },
      {
        t: "Faire une contre-proposition à −4 %",
        d: "Adama doit en parler à sa direction. Elle dira oui, ou ira ailleurs.",
      },
      {
        t: "Refuser : à −8 %, ces retraits ne couvrent pas leur part des charges fixes",
        d: "Le drive garde un seul tarif pour tout le monde.",
      },
    ],
    reactions: [
      [
        {
          ...ADAMA,
          texte:
            "Marché conclu. Mes équipes passeront à partir de lundi en huit ; je vous envoie la liste des sous-traitants.",
        },
      ],
      null,
      [
        {
          ...ADAMA,
          texte:
            "Dommage. Nous verrons avec Brenaz, ils sont plus près du chantier de toute façon.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "La semaine de Noël",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...GILDAS,
        heure: "09:00",
        alerte: true,
        texte: `Rachid, ${ctx.cumul} de résultat à date, pour un budget à date de ${ctx.budgetADate}. Fais une opération de fin d'année : −8 % sur tout en semaines 12 et 13. Ça fera du volume.`,
      },
      {
        ...INAYA,
        heure: "11:45",
        texte:
          "Pour ton planning : l'an dernier, les drives du groupe ont fait 90 % d'une semaine normale la semaine du 15 décembre, et 45 % la semaine de Noël. À ce rythme, la semaine de Noël est sous le seuil ; deux drives ferment.",
      },
    ],
    sources: [
      {
        id: "evitables",
        titre: "Lister ce qu'une fermeture de la semaine de Noël éviterait vraiment",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Fermer la semaine 13 éviterait 2 000 € : chauffage et éclairage du hall, gardiennage, nettoyage. Le loyer, les salaires de l'équipe, les amortissements et les crédits-bails courent quand même ; l'intérim et le chariot à l'heure ne se paient qu'aux retraits faits. Ouvrir le matin seulement éviterait 1 500 € : cette semaine-là, neuf retraits sur dix se font avant midi. Prévenus, les artisans avanceraient une partie de leurs achats : 6 % de retraits de plus en semaine 12 si le drive ferme, 4 % s'il n'ouvre que le matin ; le reste irait chez Brenaz.",
      },
      {
        id: "operation",
        titre: "Relire le bilan de l'opération de fin d'année du drive de Villefranche",
        cout: 0.5,
        nature: "utile",
        resultat:
          "L'an dernier, −8 % sur tout pendant les deux dernières semaines de décembre : 10 % de retraits de plus. Sur un panier de 250 €, la remise retire 20 € à chaque retrait, client habituel compris.",
      },
    ],
    question: "Comment finissez-vous l'année ?",
    options: [
      {
        t: "Lancer l'opération de fin d'année : −8 % sur tout en semaines 12 et 13",
        d: "Affiches au comptoir et SMS aux artisans. Du volume tout de suite.",
      },
      {
        t: "Fermer la semaine de Noël : elle ne couvrirait pas ses charges fixes",
        d: "2 000 € de charges évitées. Les artisans sont prévenus et peuvent anticiper.",
      },
      {
        t: "Ouvrir la semaine de Noël le matin seulement, et inviter les artisans à commander avant",
        d: "De 6 h 30 à midi. 1 500 € de charges évitées, un SMS aux artisans en semaine 11.",
      },
      {
        t: "Ne rien changer",
        d: "Horaires habituels jusqu'au 31 décembre.",
      },
    ],
    reactions: [
      [
        {
          ...PERRINE,
          texte:
            "Les artisans font le plein, mais ce sont les mêmes que d'habitude. Ils auraient acheté sans la remise.",
        },
      ],
      [
        {
          ...PERRINE,
          texte:
            "Le panneau « fermé du 21 au 27 » est posé. Deux habitués m'ont demandé l'adresse de Brenaz, pour dépanner.",
        },
      ],
      [
        {
          ...BOGDAN,
          texte:
            "Le SMS est parti mardi. On a eu du monde en semaine 12, et le matin de la semaine 13 suffit largement.",
        },
      ],
      [
        {
          ...BOGDAN,
          texte:
            "Ouvert comme d'habitude. Les après-midis de la semaine de Noël, on regardera le parking.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Regarder le scénario bas", chemin: [1, 1, 1, 1, 0, 2] },
  { nom: "La structure du plan, et le prix", chemin: [0, 0, 0, 0, 2, 0] },
  { nom: "Attentiste", chemin: [3, 0, 3, 3, 2, 3] },
] as const;

/**
 * Les options réflexes, [décision, option] : figer la structure la moins chère
 * au volume du plan (trois CDI, loyer fixe, deux chariots), baisser les prix
 * pour atteindre le seuil (tout le tarif, l'opération de fin d'année), et
 * juger en coût complet ce qui se décide en coût marginal (refuser un volume
 * en plus, fermer une semaine sous le seuil).
 */
export const REFLEXES = [
  [0, 0],
  [1, 0],
  [2, 0],
  [3, 0],
  [4, 2],
  [5, 0],
  [5, 1],
] as const;

export const REPONSES = {
  contreAcceptee:
    "Ma direction accepte −4 %, à condition que mes équipes soient chargées en priorité le matin. On commence en semaine 10.",
  contreRefusee:
    "Ma direction ne descend pas sous −8 %. Nous irons chez Brenaz, c'est plus près du chantier de toute façon.",
  cdi: "Les nouveaux préparateurs ont commencé lundi. Ils connaissent déjà le parc par cœur.",
  brenaz:
    "Brenaz a ouvert ce matin à L'Isle-d'Abeau. Leur file de camionnettes faisait le tour du rond-point.",
  sansRenfort:
    "Avec les trois CDI, je tiens la garantie des dix minutes sans renfort : le planning couvre tous les matins.",
  guerre:
    "Brenaz vient de répondre à notre baisse : −8 % sous notre ancien tarif. Les artisans qui étaient revenus repartent.",
  glissement:
    "Le chantier de Villefontaine glisse : la charpente arrive avec trois semaines de retard. Mes équipes ne feront que la moitié des retraits prévus.",
  haut: "Bonne nouvelle : deux lotissements démarrent à Ruy et à Nivolas. Leurs artisans commencent à passer au drive.",
  bas: "La deuxième tranche de la ZAC de la Maladière est suspendue, faute de financement. Ses artisans ne passent plus.",
} as const;
