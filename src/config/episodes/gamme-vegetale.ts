/**
 * LA GAMME VÉGÉTALE — le contenu de l'épisode.
 *
 * Herveline Daniélou dirige le marketing et l'innovation de la Laiterie de
 * Kerbrélan. Le rayon des desserts végétaux croît de 15 % par an, le Groupe
 * Nordal vient d'y lancer douze références, et le conseil d'administration
 * attend sa recommandation : investir 3,2 M€ dans une ligne dédiée, faire
 * fabriquer une gamme d'essai par un façonnier, ou laisser passer. Six
 * décisions, de janvier à mars, chacune précédée de ce qu'une directrice du
 * marketing reçoit vraiment.
 *
 * Chaque chiffre qu'une source donne au joueur se recalcule depuis les
 * constantes du modèle : la taille du rayon et ses scénarios, la part visée,
 * le passage du prix consommateur au prix net, la cannibalisation, l'érosion
 * des crèmes desserts, la capacité du façonnier, les seuils de réachat, les
 * conditions du contrat de façon, la fréquence des ripostes de Nordal.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import {
  CANNIBALISATION,
  CAPACITE_FACONNIER_EUROS,
  ELARGISSEMENT,
  EMPREINTES,
  FACONNIER,
  LANCEMENT,
  LIGNE,
  MAGASINS_OPALINE,
  MARCHE,
  MESURE,
  MONTEE,
  NORDAL,
  PART_VISEE,
  PARTAGEE,
  PASSAGE,
  REMPLISSAGE,
  SCENARIOS,
  SEUILS,
  SIGNAL,
  TAUX_CANNIBALISATION,
} from "@/engine/episodes/gamme-vegetale";
import { kE, nombre, taux } from "./format";
import type { Etape } from "./types";

const LENAIC = { de: "Lénaïc Guivarc'h", role: "Président" } as const;
const YANNIG = { de: "Yannig Le Goaziou", role: "Directeur général" } as const;
const IWAN = { de: "Iwan Szymanski", role: "Directeur administratif et financier" } as const;
const EFFLAM = { de: "Efflam Jézéquel", role: "Directeur industriel" } as const;
const BAPTISTIN = { de: "Baptistin Haddadi", role: "Directeur commercial" } as const;
const MORWENNA = { de: "Morwenna Pellen", role: "Cheffe de marque" } as const;
const NAIM = { de: "Naïm Lefeuvre", role: "Directeur des grands comptes et des MDD" } as const;
const FANCHON = { de: "Fanchon Lozac'h", role: "Directrice de l'usine de Pontivy" } as const;
const ENVEL = { de: "Envel Danzé", role: "Directeur commercial, Fabrique Ardaven" } as const;
const TIEMOKO = {
  de: "Tiémoko Larvor",
  role: "Chef de groupe ultra-frais, Opaline",
} as const;

/** Un pourcentage entier : « 4 % », « 62 % ». */
const pc = (v: number) => taux(v, 0);
/** La pénalité par pack non enlevé, au centime : « 0,30 ». */
const PENALITE = FACONNIER.engagement.penalite.toLocaleString("fr-FR", {
  minimumFractionDigits: 2,
});
/** Des millions d'euros au dixième : « 3,2 M€ ». */
export const ME = (v: number) =>
  `${(v / 1_000_000).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} M€`;

export const DIAGNOSTICS = [
  {
    id: "test",
    t: "Personne ne sait si le rayon continuera de croître : un test réversible, chez un façonnier et dans une enseigne, achète l'information, et la ligne se décide sur le réachat mesuré, pas sur l'enthousiasme des premières commandes",
  },
  {
    id: "allergenes",
    t: "Une gamme sans lait ne tiendra qu'avec une ligne dédiée, à cause des allergènes : toute la question est de savoir si les volumes la justifieront",
  },
  {
    id: "premier",
    t: "Le rayon ira au premier qui aura une ligne : il faut investir avant que le Groupe Nordal ne prenne les linéaires",
  },
  {
    id: "cannibalisation",
    t: "Chaque dessert végétal vendu sera une crème dessert Kerbrélan en moins : la gamme détruirait plus de marge qu'elle n'en crée",
  },
] as const;

/** Les quatre références d'essai, le rayon Opaline, et ce que le test coûte. */
const ESSAI = `quatre références (avoine vanille, avoine chocolat, soja caramel, coco)`;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Le rayon qui monte",
    jusqua: 2,
    messages: () => [
      {
        ...LENAIC,
        heure: "08:10",
        alerte: true,
        texte: `Herveline, le conseil d'administration se réunit vendredi. Le Groupe Nordal vient de lancer douze références de desserts végétaux, et le rayon prend 15 % par an. Trois voies sont sur la table : la ligne dédiée d'Efflam, ${ME(LIGNE.investissement)} ; une gamme d'essai chez un façonnier ; ou rien. J'attends votre recommandation, et le chiffre d'affaires que vous en attendez.`,
      },
      {
        ...EFFLAM,
        heure: "09:05",
        texte: `La ligne végétale, c'est six mois entre la commande et la mise en service. Commandée cette semaine, nous sommes en rayon en juillet dans les trois enseignes. Chaque mois perdu, c'est Nordal qui s'installe dans les linéaires.`,
      },
      {
        ...IWAN,
        heure: "10:30",
        texte: `${ME(LIGNE.investissement)}, c'est presque une année d'investissements de la laiterie. Je veux bien les défendre devant la Banque Armorienne, mais pas sur un marché que personne ne sait chiffrer.`,
      },
      {
        ...BAPTISTIN,
        heure: "11:45",
        texte:
          "Celtis me demande si nous aurons du végétal cette année. Leur négociation annuelle se boucle au 1er mars : après, il faudra attendre la réimplantation de septembre.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "etude",
        titre: "Lire l'étude de l'institut de panel sur le rayon",
        cout: 1,
        nature: "decisive",
        resultat: `Valérien Tréguer, chargé d'études : le rayon des desserts végétaux frais a fait ${ME(MARCHE)} de ventes consommateurs l'an dernier, ${pc(SCENARIOS.essor.croissance)} de plus que l'année d'avant. Trois scénarios pour les années qui viennent : la croissance se maintient à ${pc(SCENARIOS.essor.croissance)} par an (l'essor, environ trois chances sur dix) ; elle retombe à ${pc(SCENARIOS.central.croissance)} par an dès cette année (le scénario central, un peu moins d'une chance sur deux) ; le rayon recule de ${pc(-SCENARIOS.repli.croissance)} par an, comme les boissons végétales il y a quatre ans (le repli, une chance sur quatre). Sur les lancements de desserts frais des cinq dernières années, les gammes qui ont tenu montraient, après six semaines de vente, un taux de réachat de ${SEUILS.elargir} % ou plus ; celles qui ont été déréférencées dans l'année, moins de ${SEUILS.garder} %.`,
      },
      {
        id: "plan",
        titre: "Reprendre le plan de la gamme avec Morwenna Pellen",
        cout: 0.5,
        nature: "decisive",
        resultat: `Le plan vise ${pc(PART_VISEE)} du rayon en valeur la troisième année (${taux(PART_VISEE * MONTEE[0], 0)} la première, ${taux(PART_VISEE * MONTEE[1], 1)} la deuxième), avec dix références dans les trois enseignes. Le prix net de cession vaut ${pc(PASSAGE)} du prix consommateur, une fois déduites la TVA à 5,5 % et la marge de l'enseigne. Sur les gammes végétales lancées par des marques régionales, ${pc(CANNIBALISATION.part)} des ventes venaient d'acheteurs des crèmes desserts de la même marque ; les nôtres dégagent ${pc(CANNIBALISATION.marge)} de marge sur coût variable : la cannibalisation coûte ${taux(TAUX_CANNIBALISATION, 1)} du chiffre d'affaires de la gamme. Sans gamme à nous, l'institut estime que la gamme Nordal prendra à nos crèmes desserts ${kE(SCENARIOS.central.erosion)} de marge par an dans le scénario central, ${kE(SCENARIOS.essor.erosion)} dans l'essor, ${kE(SCENARIOS.repli.erosion)} dans le repli. Une gamme à nous dans les trois enseignes en éviterait ${pc(1 - EMPREINTES.large.erosion)} ; deux références chez Opaline, ${pc(1 - EMPREINTES.pivot.erosion)}.`,
      },
      {
        id: "ligne",
        titre: "Relire le dossier de la ligne avec Efflam Jézéquel",
        cout: 0.5,
        nature: "utile",
        resultat: `La ligne dédiée coûte ${ME(LIGNE.investissement)}, en service six mois après la commande ; ${pc(LIGNE.marge)} de marge sur coût variable, ${kE(LIGNE.fixes)} de frais fixes par an (huit postes en 2×8, maintenance, analyses) ; elle vaudrait ${ME(LIGNE.residuelle)} dans cinq ans. Le façonnier, la Fabrique Ardaven à Ploërmel, est une usine sans lait : ${pc(FACONNIER.marge)} de marge sur coût variable, aucun investissement, ${nombre(FACONNIER.capacite / 1_000_000, 1)} million de packs par an au plus, soit ${ME(CAPACITE_FACONNIER_EUROS)} de chiffre d'affaires. Sur nos lignes lactées, impossible de garantir des desserts « sans lait » sans valider chaque nettoyage par analyse.`,
      },
      {
        id: "salon",
        titre: "Écouter un consultant en innovation alimentaire",
        cout: 1,
        nature: "bruit",
        resultat:
          "Caetano Baudic : « Le végétal fera 30 % des desserts frais en 2030. Nordal a mis 25 M€ sur la table ; ceux qui auront une ligne prendront tout. » Ses projections prolongent jusqu'en 2030 la croissance de l'an dernier, sans scénario, et ne disent rien de vos clients.",
      },
      {
        id: "conseil",
        titre: "Appeler Zénaïde Boscher, ancienne directrice de l'innovation d'une fromagerie",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Zénaïde Boscher : « Sur un marché qu'on ne sait pas chiffrer, on n'achète pas une usine, on achète de l'information : un façonnier, une enseigne, quelques références. Et on écrit avant le test ce qui fera accélérer, pivoter ou arrêter. Les commandes du distributeur ne disent rien les premières semaines : regarde si les gens reviennent. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que recommandez-vous au conseil ?",
    options: [
      {
        t: "Commander tout de suite la ligne dédiée et lancer la gamme dans les trois enseignes en juillet : ne pas laisser le rayon au Groupe Nordal",
        d: `${ME(LIGNE.investissement)} engagés, l'acompte non remboursable. Dix références en rayon en juillet.`,
      },
      {
        t: `Tester d'abord : ${ESSAI} fabriquées par la Fabrique Ardaven, dix semaines dans les magasins Opaline de l'Ouest, puis décider au conseil de fin mars sur des critères écrits d'avance`,
        d: `${kE(FACONNIER.serie)} de série courte et de mise en place. En rayon en semaine 4, dans ${MAGASINS_OPALINE} magasins.`,
      },
      {
        t: "Lancer tout de suite dix références fabriquées par le façonnier dans les trois enseignes : aller vite sans investir",
        d: `${kE(FACONNIER.serie)} de série et ${kE(ELARGISSEMENT)} de mise en place chez Celtis et Proxival. En rayon partout en semaine 4.`,
      },
      {
        t: "Laisser passer : le végétal n'est pas notre métier, concentrons-nous sur nos crèmes desserts",
        d: "Rien n'est engagé.",
      },
    ],
    reactions: [
      [
        {
          ...LENAIC,
          texte: `Le conseil vote la ligne : ${ME(LIGNE.investissement)}. La presse professionnelle l'annoncera lundi : « Kerbrélan entre dans le végétal ». Efflam signe la commande et l'acompte.`,
        },
      ],
      [
        {
          ...LENAIC,
          texte:
            "Le conseil approuve le test et vous demande vos critères par écrit. Rendez-vous fin mars, les chiffres en main.",
        },
      ],
      [
        {
          ...BAPTISTIN,
          texte: `Celtis et Proxival prennent les dix références dans leur négociation annuelle, avec ${kE(ELARGISSEMENT)} de mise en place. Nous serons partout en semaine 4.`,
        },
      ],
      [
        {
          ...LENAIC,
          texte:
            "Le conseil vous suit : pas de végétal cette année. Nous en reparlerons si le rayon le justifie.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Ce que le test mesurera",
    jusqua: 3,
    messages: (ctx) =>
      ctx.enRayon
        ? [
            {
              ...TIEMOKO,
              heure: "09:20",
              alerte: true,
              texte: `Madame Daniélou, je vous transmettrai nos commandes chaque lundi, comme pour vos crèmes. Si vous voulez les ventes en sortie de caisse et le réachat de nos porteurs de carte, notre service des données les vend : ${kE(MESURE.carte)} pour dix semaines, magasin par magasin.`,
            },
            {
              ...BAPTISTIN,
              heure: "11:00",
              texte:
                "Les commandes suffiront. Si Opaline recommande, c'est que ça se vend : pas la peine de payer pour le savoir.",
            },
          ]
        : [
            {
              ...MORWENNA,
              heure: "09:20",
              texte: ctx.ligne
                ? "La ligne est commandée : rien ne sera en rayon avant juillet. Opaline propose quand même ses données de carte, si un jour nous avons quelque chose à mesurer."
                : "Pas de gamme, pas de test. Opaline propose quand même ses données de carte, si un jour nous avons quelque chose à mesurer.",
            },
          ],
    reevaluation: true,
    sources: [
      {
        id: "mesure",
        titre: "Comparer ce que mesurent les commandes, la carte de fidélité et la dégustation",
        cout: 0.5,
        nature: "decisive",
        resultat: `Les commandes d'Opaline comptent ce qui entre en magasin, pas ce qui en sort : à la mise en place, l'enseigne commande ${REMPLISSAGE} semaines de stock pour remplir ses rayons, et les trois premières semaines de ventes portent l'effet de nouveauté. Sur les tests passés, le réachat qu'on en déduisait était surestimé d'environ ${SIGNAL.commandes.biais} points. La carte de fidélité suit les acheteurs un par un : le taux de réachat à six semaines, à ${SIGNAL.carte} points près. La dégustation en salle mesure le goût : elle n'annonçait le réachat qu'à ${SIGNAL.degustation} points près, dans un sens ou dans l'autre.`,
      },
      {
        id: "commerciaux",
        titre: "Écouter les commerciaux de Baptistin Haddadi",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "« Une gamme qui marche, ça se voit dans les commandes. » Ils citent les crèmes au caramel beurre salé de l'an dernier, recommandées trois fois en un mois et toujours en rayon. Un cas, pas une méthode.",
      },
    ],
    question: "Sur quels chiffres jugerez-vous le test ?",
    options: [
      {
        t: "Les commandes d'Opaline et les remontées de nos commerciaux, chaque semaine",
        d: "Rien à payer : Opaline transmet ses commandes chaque lundi.",
      },
      {
        t: "Acheter les données de la carte de fidélité d'Opaline : ventes en sortie de caisse et taux de réachat des acheteurs",
        d: `${kE(MESURE.carte)} pour les dix semaines ; le réachat se lit à partir de la semaine 9.`,
      },
      {
        t: "Un test consommateurs en salle : deux cents personnes goûtent nos recettes et celles du Groupe Nordal",
        d: `${kE(MESURE.degustation)} ; la note tombe en semaine 5.`,
      },
    ],
    reactions: [
      [
        {
          ...NAIM,
          texte:
            "Entendu : je vous transmettrai les commandes d'Opaline chaque lundi, avec les remontées des commerciaux.",
        },
      ],
      [
        {
          ...TIEMOKO,
          texte:
            "C'est signé : tant qu'une gamme Kerbrélan est en rayon chez nous, vous aurez les données de nos porteurs de carte chaque lundi, magasin par magasin.",
        },
      ],
      [
        {
          ...MORWENNA,
          texte:
            "La salle est réservée pour la semaine 5 : deux cents consommateurs recrutés dans l'Ouest, s'il y a quelque chose à goûter.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 3 · lundi",
    titre: "Le lancement",
    jusqua: 6,
    messages: (ctx) =>
      ctx.enRayon
        ? [
            {
              ...MORWENNA,
              heure: "08:40",
              alerte: true,
              texte: `La gamme arrive en rayon en semaine 4. L'agence propose une campagne radio et affichage dans l'Ouest et un communiqué à la presse professionnelle : ${kE(LANCEMENT.campagne)}. Il faut que ça se voie, sinon Nordal occupera le terrain.`,
            },
            {
              ...NAIM,
              heure: "10:15",
              texte: `Opaline accepterait aussi une promotion de lancement à −${pc(LANCEMENT.promo.remise)}, le maximum que la loi autorise, pendant ${LANCEMENT.promo.semaines} semaines. Ça ferait essayer, et les commandes s'en ressentiraient.`,
            },
          ]
        : [
            {
              ...MORWENNA,
              heure: "08:40",
              texte: ctx.ligne
                ? "Rien en rayon avant juillet : l'agence garde son projet de campagne pour l'été."
                : "Sans gamme, rien à lancer : l'agence propose de revoir le printemps de nos crèmes desserts.",
            },
          ],
    sources: [
      {
        id: "nordal",
        titre: "Étudier ce que le Groupe Nordal a fait face aux lancements récents",
        cout: 0.5,
        nature: "decisive",
        resultat: `Sur les trois dernières années, face à un lancement annoncé à grand bruit — une campagne, un communiqué, une usine —, Nordal a riposté environ une fois sur deux, et presque à coup sûr quand le bruit s'ajoutait à une présence dans toutes les enseignes, par des promotions à −${pc(NORDAL.remise)} sur sa gamme, pendant ${NORDAL.semaines} semaines ; face à une promotion de lancement, deux fois sur cinq ; face à un test discret dans une seule enseigne, une fois sur sept. Pendant ses promotions, les ventes du concurrent baissent de ${pc(1 - NORDAL.rotation)} ; sa première année y perd ${pc(NORDAL.baisse)} de chiffre d'affaires. Nordal défend ses linéaires, pas les marchés qu'il ne voit pas.`,
      },
      {
        id: "promo",
        titre: "Demander à Morwenna Pellen ce qu'une promotion de lancement fait au test",
        cout: 0.5,
        nature: "utile",
        resultat: `Une promotion de lancement recrute des acheteurs de promotion : sur nos lancements passés, le réachat mesuré au prix normal était inférieur d'environ ${-SIGNAL.promo.carte} points, et les commandes gonflées d'autant. La remise de ${pc(LANCEMENT.promo.remise)} du prix consommateur est à notre charge, sur des ventes qui doublent presque pendant ${LANCEMENT.promo.semaines} semaines.`,
      },
    ],
    question: "Comment lancez-vous la gamme ?",
    options: [
      {
        t: "Un lancement qui se voit : campagne radio et affichage dans l'Ouest, communiqué à la presse professionnelle",
        d: `${kE(LANCEMENT.campagne)}. Toute la région saura que Kerbrélan fait du végétal.`,
      },
      {
        t: "Un lancement en magasin : têtes de gondole et animations chez Opaline, sans annonce",
        d: `${kE(LANCEMENT.magasin)} d'animation.`,
      },
      {
        t: `Une promotion de lancement à −${pc(LANCEMENT.promo.remise)} pendant ${LANCEMENT.promo.semaines} semaines, pour faire essayer`,
        d: `${kE(LANCEMENT.magasin)} d'animation, et la remise à notre charge ; les ventes devraient presque doubler.`,
      },
    ],
    reactions: [
      [
        {
          ...MORWENNA,
          texte: "La campagne démarre en semaine 4. Le communiqué part ce soir à la presse.",
        },
      ],
      [
        {
          ...NAIM,
          texte:
            "Opaline nous donne une tête de gondole dans chaque magasin pendant trois semaines, si la gamme est en rayon.",
        },
      ],
      [
        {
          ...TIEMOKO,
          texte: `Promotion validée : −${pc(LANCEMENT.promo.remise)} sur vos références pendant ${LANCEMENT.promo.semaines} semaines, en tête du prospectus.`,
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Les créneaux du façonnier",
    jusqua: 9,
    messages: (ctx) => [
      ctx.faconnier
        ? {
            ...ENVEL,
            heure: "09:30",
            alerte: true,
            texte: `Madame Daniélou, un autre client me demande mes créneaux d'avril à septembre. Je peux vous les garder de deux façons : un contrat d'un an, ${nombre(FACONNIER.engagement.packs, 0)} packs, avec ${FACONNIER.engagement.remise * 100} points de marge en plus pour vous ; ou une réservation à ${kE(FACONNIER.reservation)}, déduite de vos commandes si vous les utilisez. Sinon, ils partent.`,
          }
        : {
            ...ENVEL,
            heure: "09:30",
            texte:
              "Madame Daniélou, nos créneaux d'avril à septembre partent à un autre client. Si vous changez d'avis sur le végétal, nous en reparlerons à l'automne.",
          },
      ...(ctx.faconnier
        ? [
            {
              ...BAPTISTIN,
              heure: "11:10",
              texte: `Les commandes d'Opaline depuis la semaine 4 : ${ctx.commandesCumul}, ${ctx.pctObjectif} de l'objectif du test ! On signe pour l'année et on n'en parle plus.`,
            },
          ]
        : []),
    ],
    sources: [
      {
        id: "contrat",
        titre: "Lire les conditions de la Fabrique Ardaven",
        cout: 0.5,
        nature: "decisive",
        resultat: `Le contrat d'un an engage à enlever ${nombre(FACONNIER.engagement.packs, 0)} packs d'avril à mars, avec ${FACONNIER.engagement.remise * 100} points de marge en plus ; chaque pack non enlevé se paie ${PENALITE} €, soit ${kE(FACONNIER.engagement.packs * FACONNIER.engagement.penalite)} si la gamme s'arrête. Deux références chez Opaline seules en vendraient quatre fois moins. La réservation des créneaux d'avril à septembre coûte ${kE(FACONNIER.reservation)}, déduits des commandes si on les utilise, perdus sinon. Sans rien, les créneaux partent jusqu'à fin juin : la gamme quitte les rayons au printemps, et Celtis et Proxival ne référencent pas en septembre une gamme absente ; l'élargissement, s'il se décide, glisserait à mars.`,
      },
      {
        id: "premiers",
        titre: "Décomposer les premières commandes d'Opaline",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          !ctx.faconnier
            ? "Aucune gamme en rayon : il n'y a pas de commandes à décomposer."
            : `${ctx.commandesCumul} de commandes depuis la semaine 4, dont ${ctx.remplissage} la première semaine : trois semaines de stock pour remplir les rayons et l'entrepôt. ${
                ctx.carte
                  ? `En sortie de caisse, ${ctx.rotation} packs par magasin et par semaine cette semaine, en baisse depuis le lancement : l'effet de nouveauté s'estompe.`
                  : "Sans les données de la carte, on ne sait pas ce qui sort des magasins : seulement ce qui y entre."
              }`,
      },
    ],
    question: "Que répondez-vous au façonnier ?",
    options: [
      {
        t: `Signer le contrat d'un an, ${nombre(FACONNIER.engagement.packs, 0)} packs, au meilleur prix : les commandes sont excellentes`,
        d: `${FACONNIER.engagement.remise * 100} points de marge en plus la première année ; ${PENALITE} € par pack non enlevé.`,
      },
      {
        t: "Réserver les créneaux d'avril à septembre, sans engagement de volume",
        d: `${kE(FACONNIER.reservation)}, déduits des commandes si la gamme continue, perdus sinon.`,
      },
      {
        t: "Ne rien réserver : on verra après le conseil de mars",
        d: "Rien à payer ; les créneaux partent à un autre client jusqu'à fin juin.",
      },
    ],
    reactions: [
      [
        {
          ...ENVEL,
          texte: `Contrat signé : ${nombre(FACONNIER.engagement.packs, 0)} packs d'avril à mars. Merci de votre confiance.`,
        },
      ],
      null,
      [
        {
          ...ENVEL,
          texte: "Entendu. Je donne vos créneaux à notre autre client jusqu'à fin juin.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 9 · vendredi",
    titre: "Ce que dit le test",
    jusqua: 11,
    messages: (ctx) =>
      ctx.faconnier
        ? [
            {
              ...BAPTISTIN,
              heure: "08:50",
              alerte: true,
              texte: `Les commandes d'Opaline : ${ctx.commandesCumul} depuis la semaine 4, ${ctx.pctObjectif} de l'objectif du test. Celtis attend notre réponse pour la réimplantation de septembre. On élargit, comme on l'a dit au conseil !`,
            },
            {
              ...LENAIC,
              heure: "12:30",
              texte:
                "En janvier, nous avons dit au conseil que nous irions vite si le test marchait. Il a l'air de marcher, non ? Le comité de direction arrête lundi ce que vous proposerez au conseil de fin mars.",
            },
          ]
        : [
            {
              ...YANNIG,
              heure: "08:50",
              alerte: true,
              texte: ctx.ligne
                ? "La ligne sera prête en juin. Le comité de direction arrête lundi ce que nous dirons au conseil de fin mars : on maintient le lancement de juillet ?"
                : "Le comité de direction arrête lundi ce que nous dirons au conseil de fin mars sur le végétal. Le rayon continue de bouger.",
            },
          ],
    sources: [
      {
        id: "resultats",
        titre: "Lire les chiffres du test",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          !ctx.faconnier
            ? "Aucune gamme en rayon : il n'y a rien à lire."
            : ctx.carte
              ? `Les données de la carte d'Opaline, semaines 4 à 9 : ${ctx.rotationMoyenne} packs par magasin et par semaine en moyenne en sortie de caisse${ctx.riposte ? ", malgré les promotions de Nordal" : ""} ; taux de réachat des acheteurs à six semaines : ${ctx.signal}, à ${SIGNAL.carte} points près.${ctx.promo ? " La promotion de lancement a recruté des acheteurs de promotion : le réachat mesuré en est un peu plus bas." : ""}`
              : ctx.degustation
                ? `La dégustation de la semaine 5 annonçait un réachat d'environ ${ctx.signal}, à ${SIGNAL.degustation} points près. Pas d'autre mesure : les commandes d'Opaline font ${ctx.commandesCumul}.`
                : `Les commandes d'Opaline font ${ctx.commandesCumul} depuis la semaine 4. Le réachat que les commerciaux en déduisent : environ ${ctx.signal}. Mais les commandes comptent le remplissage des rayons et l'effet de nouveauté : sur les tests passés, cette estimation dépassait le vrai réachat d'environ ${SIGNAL.commandes.biais} points.`,
      },
      {
        id: "criteres",
        titre: "Relire les critères écrits pour le conseil",
        cout: 0.5,
        nature: "utile",
        resultat: `D'après les lancements passés : élargir aux trois enseignes en septembre si le réachat atteint ${SEUILS.elargir} % ; entre ${SEUILS.garder} et ${SEUILS.elargir} %, garder les deux références à l'avoine chez Opaline, sans publicité ; sous ${SEUILS.garder} %, arrêter et déréférencer proprement. Iwan Szymanski a chiffré l'élargissement : il crée de la valeur dans l'essor, il en détruit dans le scénario central et dans le repli, où même les deux références à l'avoine ne couvrent pas leurs frais.`,
      },
      {
        id: "presse",
        titre: "Lire ce que la presse professionnelle dit du Groupe Nordal",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Nordal annonce une deuxième usine de produits végétaux en Allemagne et « une ambition de leader européen ». Ses résultats ne sont pas détaillés par rayon, ni par pays.",
      },
    ],
    question: "Que proposez-vous au conseil de fin mars ?",
    options: [
      {
        t: "Élargir aux trois enseignes en septembre, comme annoncé en janvier : les commandes dépassent l'objectif",
        d: `${kE(ELARGISSEMENT)} de mise en place chez Celtis et Proxival ; dix références.`,
      },
      {
        t: `Appliquer les critères écrits : élargir si le réachat atteint ${SEUILS.elargir} %, garder les deux références à l'avoine entre ${SEUILS.garder} et ${SEUILS.elargir} %, arrêter en dessous`,
        d: "La proposition suit le réachat mesuré, quel qu'il soit.",
      },
      {
        t: "Prolonger le test six mois chez Opaline avant de rien décider",
        d: "Les frais du test continuent ; Celtis attendra la réimplantation de mars.",
      },
      {
        t: "Arrêter la gamme : trop de risques sur un marché qui n'est pas le nôtre",
        d: "Déréférencement à la fin du test. Une ligne déjà commandée s'annule en perdant l'acompte.",
      },
    ],
    reactions: [
      [
        {
          ...BAPTISTIN,
          texte:
            "Je confirme à Celtis et à Proxival : dix références à la réimplantation de septembre.",
        },
      ],
      [
        {
          ...YANNIG,
          texte:
            "Le comité de direction retient vos critères : la proposition au conseil suivra le réachat mesuré.",
        },
      ],
      [
        {
          ...NAIM,
          texte:
            "Opaline accepte de garder la gamme jusqu'en septembre. Celtis, lui, ne nous attendra pas à la rentrée.",
        },
      ],
      [
        {
          ...NAIM,
          texte: "J'annoncerai à Opaline l'arrêt de la gamme à la fin du test.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · vendredi",
    titre: "Produire après le test",
    jusqua: 13,
    messages: (ctx) =>
      ctx.suite
        ? [
            {
              ...EFFLAM,
              heure: "09:10",
              alerte: true,
              texte: `Le contrat d'essai d'Ardaven s'arrête fin mars. Commandée maintenant, la ligne dédiée est prête en septembre ; après, ce sera six mois de plus. ${ctx.suiteTexte}`,
            },
            {
              ...FANCHON,
              heure: "11:30",
              texte:
                "À Pontivy, la ligne 3 a de la place entre deux séries de crèmes. Avec un nettoyage en place renforcé, je peux produire votre gamme sans un euro de façon.",
            },
          ]
        : [
            {
              ...EFFLAM,
              heure: "09:10",
              texte: ctx.ligne
                ? "La ligne dédiée est commandée depuis janvier : elle sera prête en juin, quoi que nous décidions maintenant."
                : "La gamme s'arrête : il n'y a rien à produire après mars. Je garde le dossier de la ligne au chaud.",
            },
          ],
    sources: [
      {
        id: "allergenes",
        titre: "Demander à Annaïg Le Dantec ce que coûte une gamme sans lait sur une ligne lactée",
        cout: 0.5,
        nature: "decisive",
        resultat: `Une gamme vendue sans lait ne tolère aucune trace de protéines de lait : pour un enfant allergique, c'est un risque grave. Sur une ligne lactée, même avec un nettoyage renforcé, chaque changement de série se valide par analyse, et une trace bloque le lot. Sur les sites qui le font, les essais de validation trouvent des traces environ une fois sur trois ; lots bloqués, analyses et retraits coûtent ${kE(PARTAGEE.allergenes)} par an, et nos crèmes perdent ${kE(PARTAGEE.lactes)} de capacité. Le façonnier travaille sans lait ; une ligne dédiée, dans une salle séparée, aussi.`,
      },
      {
        id: "volumes",
        titre: "Chiffrer avec Efflam Jézéquel la ligne et le façonnier pour les volumes décidés",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          !ctx.suite
            ? "La gamme s'arrête, ou la ligne est déjà commandée : il n'y a rien à chiffrer."
            : `${ctx.suiteTexte} La ligne dédiée gagne ${Math.round((LIGNE.marge - FACONNIER.marge) * 100)} points de marge sur le façonnier mais coûte ${kE(LIGNE.fixes)} de frais fixes par an : il lui faut plus de ${ME(LIGNE.fixes / (LIGNE.marge - FACONNIER.marge))} de chiffre d'affaires pour seulement les couvrir, et des volumes au-delà de la capacité du façonnier, ${ME(CAPACITE_FACONNIER_EUROS)} par an, pour rembourser ses ${ME(LIGNE.investissement)}. Restée chez le façonnier, une gamme qui s'élargit peut faire commander la ligne en décembre, sur trois mois de ventes dans les trois enseignes.`,
      },
    ],
    question: "Comment produirez-vous la gamme après le test ?",
    options: [
      {
        t: `Commander maintenant la ligne dédiée de ${ME(LIGNE.investissement)} : elle sera prête en septembre`,
        d: `L'acompte de ${pc(LIGNE.dedit)} n'est pas remboursable. Huit postes à pourvoir à Loudéac.`,
      },
      {
        t: "Rester chez le façonnier, et décider de la ligne sur les premiers mois de ventes",
        d: `${pc(FACONNIER.marge)} de marge sur coût variable ; ${nombre(FACONNIER.capacite / 1_000_000, 1)} million de packs par an au plus.`,
      },
      {
        t: "Rapatrier la production sur la ligne 3 de Pontivy, entre deux séries de crèmes, avec un nettoyage renforcé",
        d: `${kE(PARTAGEE.adaptation)} d'aménagements ; plus de façon à payer. Les nettoyages seront validés par analyse.`,
      },
    ],
    reactions: [
      [
        {
          ...IWAN,
          texte: `J'inscris la ligne au conseil de fin mars : ${ME(LIGNE.investissement)}, acompte de ${pc(LIGNE.dedit)} à la commande.`,
        },
      ],
      [
        {
          ...ENVEL,
          texte: "Nous reconduisons la façon pour ce que votre conseil décidera, au prix de série.",
        },
      ],
      [
        {
          ...FANCHON,
          texte:
            "Les aménagements de la ligne 3 commenceront en avril. Annaïg prépare le plan de validation des nettoyages.",
        },
      ],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Tester, mesurer, réviser", chemin: [1, 1, 1, 1, 1, 1] as readonly number[] },
  { nom: "Occuper le terrain tout de suite", chemin: [0, 0, 0, 0, 0, 0] as readonly number[] },
  { nom: "Attentiste", chemin: [3, 0, 1, 2, 2, 1] as readonly number[] },
] as const;

/**
 * Les réflexes d'un comité de direction devant un marché qui monte : investir
 * tout de suite pour ne pas laisser la place, ou laisser passer ; croire les
 * commandes ; faire du bruit ; s'engager sur l'enthousiasme des premières
 * semaines ; tenir ce qu'on a annoncé ; figer la ligne. [décision, option]
 */
export const REFLEXES = [
  [0, 0],
  [0, 3],
  [1, 0],
  [2, 0],
  [3, 0],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  reservationComplete: `Créneaux réservés d'avril à septembre : ${kE(FACONNIER.reservation)}, déduits de vos commandes si vous les utilisez.`,
  reservationPartielle: `Je ne peux vous garder que la moitié des créneaux d'avril à septembre : notre autre client a signé un engagement ferme. ${kE(FACONNIER.reservation)}, déduits de vos commandes.`,
  elargir:
    "Le comité de direction applique vos critères : le réachat dépasse le seuil, la proposition au conseil sera d'élargir aux trois enseignes en septembre.",
  garder:
    "Le comité de direction applique vos critères : le réachat est entre les deux seuils. La proposition au conseil sera de garder les deux références à l'avoine chez Opaline, sans publicité.",
  arreter:
    "Le comité de direction applique vos critères : le réachat est sous le seuil bas. La proposition au conseil sera d'arrêter la gamme à la fin du test.",
  sansTest:
    "Le comité de direction n'a aucun chiffre de test à lire : la ligne commandée suit son plan.",
  incident: `Les essais de validation du nettoyage de la ligne 3 ont trouvé des traces de protéines de lait sur deux lots d'essai : lots détruits, plan de nettoyage à reprendre, ${kE(PARTAGEE.incident)} de perdus. Je ne libérerai aucun lot « sans lait » de cette ligne sans analyse.`,
  pasDIncident:
    "Les essais de validation du nettoyage de la ligne 3 sont conformes. Chaque changement de série restera validé par analyse.",
  ligneInutile:
    "Le conseil ne commandera pas de ligne pour une gamme qui s'arrête : le dossier est retiré.",
  panel: {
    essor: `Le panel annuel est publié : le rayon a encore pris ${pc(SCENARIOS.essor.croissance)} sur les douze derniers mois, et ne ralentit pas. L'essor se confirme.`,
    central: `Le panel annuel est publié : la croissance du rayon est retombée autour de ${pc(SCENARIOS.central.croissance)} sur les derniers mois. C'est le scénario central.`,
    repli: `Le panel annuel est publié : le rayon recule depuis l'automne, d'environ ${pc(-SCENARIOS.repli.croissance)} sur un an. C'est le repli.`,
  },
} as const;
