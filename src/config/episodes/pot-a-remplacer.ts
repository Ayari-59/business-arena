/**
 * LE POT EN PLASTIQUE QU'IL FAUT REMPLACER — le contenu de l'épisode.
 *
 * Azilis Cozic est responsable emballages et développement de la Laiterie de
 * Kerbrélan. Celtis exige des pots recyclables chez tous ses fournisseurs d'ici
 * dix-huit mois ; les yaourts Kerbrélan sont en polystyrène, et le président
 * veut annoncer au salon professionnel de mars que toute la gamme passe au
 * carton. Janvier commence. Six décisions, chacune précédée de ce qu'une
 * responsable emballages reçoit vraiment.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit. Les chiffres qu'elles
 * donnent sont ceux du modèle ; un test les recalcule.
 *
 * Entreprise, personnes et chiffres sont fictifs.
 */
import type { Etape } from "./types";
import {
  ALIGNEMENT,
  ANNONCE,
  BOBINES,
  CADENCE_PS,
  CAPACITE_PS,
  CELTIS,
  CONFORMAGE,
  COUT_POINT_CADENCE,
  DEDIT,
  DELAI,
  ECO,
  ESSAI,
  HEURES,
  PART_CELTIS,
  POTS_SEMAINE,
  PRIX,
  REBUT_PS,
  SAISON,
  STOCK,
  TRS,
  VOLUME_AN,
  coutAnnuelAnnonce,
} from "@/engine/episodes/pot-a-remplacer";
import { euros, kE, nombre, taux } from "./format";

/** Un prix au pot, en centimes : « 1,52 centime ». */
export const centimes = (v: number) =>
  `${v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} centime${v >= 2 ? "s" : ""}`;
/** Quand des équipements arrivent : « sont là », « arrivent en semaine 10 ». */
const arrivee = (w: string | number | boolean) =>
  typeof w === "number" && w > 8 ? `arrivent en semaine ${w}` : "sont là";
/** Des millions de pots : « 40 millions ». */
const millions = (v: number) => `${nombre(v / 1e6, 1)} millions`;

export const DIAGNOSTICS = [
  {
    id: "qualifier",
    t: "Un changement d'emballage se joue sur la ligne : la cadence, les rebuts, la tenue de la DLC et le coût réel se mesurent sur une ligne et une référence avant de toucher à toute la gamme",
  },
  {
    id: "cout",
    t: "Le carton coûte bien plus cher au pot que le PP, éco-contribution comprise : c'est le prix du pot qui doit décider",
  },
  {
    id: "image",
    t: "L'enjeu est l'image de la marque : il faut annoncer le carton avant le Groupe Nordal",
  },
  {
    id: "echeance",
    t: "Rien ne presse : Celtis laisse dix-huit mois, et le polystyrène sera peut-être recyclable d'ici là",
  },
] as const;

export const LENAIC = { de: "Lénaïc Guivarc'h", role: "Président" } as const;
export const IWAN = { de: "Iwan Szymanski", role: "Directeur administratif et financier" } as const;
export const EFFLAM = { de: "Efflam Jézéquel", role: "Directeur industriel" } as const;
export const ERWANN = {
  de: "Erwann Tromeur",
  role: "Chef de l'atelier de conditionnement de Loudéac",
} as const;
export const KLERVI = { de: "Klervi Nédélec", role: "Responsable maintenance" } as const;
export const YSEE = { de: "Ysée Bescond", role: "Responsable supply chain" } as const;
export const ANNAIG = { de: "Annaïg Le Dantec", role: "Responsable qualité" } as const;
export const NAIM = {
  de: "Naïm Lefeuvre",
  role: "Directeur des grands comptes et des MDD",
} as const;
export const HERVELINE = {
  de: "Herveline Daniélou",
  role: "Directrice marketing et innovation",
} as const;
export const CYRIELLE = {
  de: "Cyrielle Mainguené",
  role: "Acheteuse produits laitiers frais, centrale d'achat de Celtis",
} as const;
export const PRZEMYSLAW = {
  de: "Przemysław Nowicki",
  role: "Ingénieur commercial, Maëlpack",
} as const;
export const ISMERIE = {
  de: "Ismérie Lannuzel",
  role: "Chargée d'affaires, Kervidal Cartonnages",
} as const;
export const TAIG = { de: "Taïg Paugam", role: "Responsable commercial, Styrel" } as const;
export const GONERI = { de: "Gonéri Cosquer", role: "Conducteur de la ligne 2" } as const;
export const PETROC = {
  de: "Pétroc Guézennec",
  role: "Chargé de compte, éco-organisme des emballages ménagers",
} as const;
export const EMERANCE = {
  de: "Emerance Delafosse",
  role: "Acheteuse produits frais, Opaline",
} as const;

/** La commande habituelle de bobines du deuxième trimestre : treize semaines sur les deux lignes. */
export const POTS_COMMANDE_HABITUELLE = 2 * BOBINES.semaines * BOBINES.potsSemaine;
export const PRIX_COMMANDE_HABITUELLE = (POTS_COMMANDE_HABITUELLE * PRIX.ps) / 100;
/** Une semaine de bobines d'une ligne au deuxième trimestre, en euros. */
export const PRIX_SEMAINE_DE_BOBINES = (BOBINES.potsSemaine * PRIX.ps) / 100;
/** La marge des lignes en janvier : ce que la capacité laisse au-dessus de la demande. */
export const MARGE_HIVER = 1 - (POTS_SEMAINE * SAISON[1]!) / CAPACITE_PS;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Le carton pour le salon",
    jusqua: 2,
    messages: () => [
      {
        ...LENAIC,
        heure: "08:10",
        alerte: true,
        texte:
          "Azilis, Celtis veut des pots recyclables chez tous ses fournisseurs d'ici dix-huit mois. Je veux annoncer au salon de mars que toute la gamme Kerbrélan passe au carton : Nordal n'y est pas encore, c'est le moment. Dites-moi ce qu'il faut lancer.",
      },
      {
        ...CYRIELLE,
        heure: "09:30",
        texte:
          "Je vous confirme notre exigence par écrit : d'ici dix-huit mois, tous les pots de produits frais référencés chez Celtis devront être recyclables au sens du barème de l'éco-organisme. Les références qui ne le seront pas seront revues, et un fournisseur qui n'aura pas de plan à la clôture des négociations, le 1er mars, n'aura pas de mises en avant au printemps.",
      },
      {
        ...ERWANN,
        heure: "10:15",
        texte:
          "On m'a parlé de carton. Les lignes 1 et 2 sont des thermoformeuses réglées pour le polystyrène depuis quinze ans. Avant de toucher à quoi que ce soit, j'aimerais qu'on en parle.",
      },
    ],
    budget: 5,
    sources: [
      {
        id: "offres",
        titre: "Comparer les deux offres d'emballage",
        cout: 1,
        nature: "decisive",
        resultat: `Maëlpack (Przemysław Nowicki) : bobines de polypropylène monomatériau, ${centimes(PRIX.pp)} par pot formé, contre ${centimes(PRIX.ps)} pour notre polystyrène ; perte de cadence annoncée : ${taux(ANNONCE.pp.cadence, 0)} ; rebut annoncé : ${taux(ANNONCE.pp.rebut)}, contre ${taux(REBUT_PS)} aujourd'hui ; kit de conversion de la thermoformeuse : ${euros(CONFORMAGE.pp)} par ligne, livré en ${DELAI.pp} semaines. Kervidal Cartonnages (Ismérie Lannuzel) : pot carton à film barrière, livré préformé, ${centimes(PRIX.carton)} ; perte de cadence : ${taux(ANNONCE.carton.cadence, 0)} ; rebut : ${taux(ANNONCE.carton.rebut)} ; module de dépilage et de scellage pour pots préformés : ${euros(CONFORMAGE.carton)} par ligne, livré en ${DELAI.carton} semaines. Les deux chiffres de cadence et de rebut sont mesurés sur leurs lignes pilotes. Les deux proposent un essai chez nous.`,
      },
      {
        id: "eco",
        titre: "Lire le barème de l'éco-organisme et notre dernière déclaration",
        cout: 0.5,
        nature: "decisive",
        resultat: `Pétroc Guézennec, de l'éco-organisme : « Vous avez déclaré l'an dernier ${millions(VOLUME_AN)} de pots de yaourts Kerbrélan. Au barème de l'an prochain, l'éco-contribution d'un pot de cette taille est de ${centimes(ECO.ps)} en polystyrène, malus des emballages non recyclables compris, de ${centimes(ECO.pp)} en polypropylène monomatériau et de ${centimes(ECO.carton)} en carton à film barrière. »`,
      },
      {
        id: "lignes",
        titre: "Passer une matinée sur les lignes 1 et 2 avec Erwann Tromeur",
        cout: 1,
        nature: "utile",
        resultat: `Chaque ligne fait ${nombre(CADENCE_PS, 0)} pots à l'heure, ${HEURES} heures par semaine en 2×8, avec un TRS de ${taux(TRS, 0)} : en janvier, il lui reste ${taux(MARGE_HIVER, 0)} de marge ; l'été, elle est saturée, et chaque point de cadence perdu sur les deux lignes se rattrape en samedis et en intérim, environ ${euros(COUT_POINT_CADENCE)} par an. Erwann : « Le dernier changement d'opercule, en 2019, a mis six semaines à se stabiliser. Et un yaourt ne se stocke pas : trente jours de DLC, les deux tiers exigés à la livraison. »`,
      },
      {
        id: "etude",
        titre: "Lire l'étude consommateurs du marketing",
        cout: 1,
        nature: "bruit",
        resultat:
          "Herveline Daniélou a fait interroger 1 000 consommateurs en ligne : 68 % préfèrent « un pot en carton » à « un pot en plastique », 74 % disent vouloir un emballage recyclable. L'étude ne mesure aucun achat, et ne dit rien du prix que les acheteurs paieraient.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Efflam Jézéquel",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Efflam : « Un emballage se qualifie sur une ligne et une référence avant de toucher aux autres. Les fiches des fournisseurs sont écrites sur leurs lignes pilotes, pas sur les nôtres. Et compte le coût sur une année, pas le prix du pot. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Que lancez-vous cette semaine ?",
    options: [
      {
        t: "Lancer la bascule de toute la gamme au carton, pour l'annoncer au salon",
        d: `Commander dès cette semaine les deux modules (${kE(2 * CONFORMAGE.carton)}) et les premiers pots carton, livrés en semaine ${1 + DELAI.carton}. Les deux lignes basculent avant le salon.`,
      },
      {
        t: "Passer toute la gamme au PP monomatériau, sur la foi des fiches de Maëlpack",
        d: `Commander dès cette semaine les deux kits de conversion (${kE(2 * CONFORMAGE.pp)}), livrés en semaine ${1 + DELAI.pp}. Les deux lignes basculent avant le salon.`,
      },
      {
        t: "Qualifier d'abord : un essai industriel du PP et du carton sur la ligne 2, sur une seule référence",
        d: `Trois jours par matière en semaines 3 et 4, sur le nature 4 × 125 g, avec les tests de conservation : ${euros(ESSAI)}. Le kit PP de l'essai reste sur la ligne 2.`,
      },
      {
        t: "Ne rien engager ce trimestre : l'échéance de Celtis est dans dix-huit mois",
        d: "Aucune dépense. Le dossier sera rouvert après le salon.",
      },
    ],
    reactions: [
      [
        {
          ...LENAIC,
          texte:
            "Parfait. Je préviens l'agence pour le stand : « Kerbrélan passe au carton ». Les modules arrivent en semaine 8, c'est bien ça ?",
        },
        {
          ...ERWANN,
          texte:
            "Deux lignes à la fois, sans essai, sur une matière qu'on n'a jamais vue... On fera au mieux.",
        },
      ],
      [
        {
          ...PRZEMYSLAW,
          texte:
            "Les deux kits sont commandés, livraison en semaine 6. Je vous envoie nos réglages standard : ils marchent sur la plupart des lignes.",
        },
      ],
      [
        {
          ...GONERI,
          texte:
            "L'essai est calé : le PP en semaine 3, le carton en semaine 4, sur le samedi et le lundi. Je garde des échantillons de chaque heure pour le labo.",
        },
        {
          ...LENAIC,
          texte: "Un essai, soit. Mais je veux pouvoir dire quelque chose au salon.",
        },
      ],
      [
        {
          ...LENAIC,
          texte: "Dix-huit mois, c'est vite passé. Et je n'aurai rien à dire au salon.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 2 · vendredi",
    titre: "Les bobines de polystyrène",
    jusqua: 4,
    messages: () => [
      {
        ...TAIG,
        heure: "11:20",
        alerte: true,
        texte: `Madame Cozic, il me faut avant lundi votre commande de bobines imprimées pour le deuxième trimestre. D'habitude : treize semaines sur les lignes 1 et 2, ${millions(POTS_COMMANDE_HABITUELLE)} de pots, ${kE(PRIX_COMMANDE_HABITUELLE)}. Je la confirme comme d'habitude ?`,
      },
      {
        ...YSEE,
        heure: "14:05",
        texte:
          "Si la bascule n'est pas faite et qu'il n'y a plus de bobines de PS, la ligne s'arrête. Si on en a trop, elles sont imprimées aux couleurs Kerbrélan : elles ne servent à rien d'autre.",
      },
    ],
    reevaluation: true,
    sources: [
      {
        id: "contrat",
        titre: "Relire le contrat de Styrel",
        cout: 0.5,
        nature: "decisive",
        resultat: `Les bobines sont imprimées à nos décors : une fois commandées, elles ne se reprennent pas, et l'on n'en récupère que la matière, ${taux(BOBINES.recuperation, 0)} de leur prix. Une semaine d'une ligne au deuxième trimestre, c'est ${nombre(BOBINES.potsSemaine, 0)} pots, ${euros(PRIX_SEMAINE_DE_BOBINES)} de bobines. Une impression en urgence se paie ${euros(BOBINES.urgenceFixe)} de frais (cylindres, transport, une demi-journée d'arrêt) et ${taux(BOBINES.urgencePrime, 0)} de plus sur le prix.`,
      },
      {
        id: "plan",
        titre: "Demander à Ysée Bescond le plan de bascule, ligne par ligne",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          ctx.plan === 2
            ? "Avec l'essai, le plan prévoit la ligne 2 avant la fin du trimestre et la ligne 1 en semaine 16 : la ligne 1 aura besoin de deux semaines de bobines au deuxième trimestre, la ligne 2 d'aucune. Si la bascule de la ligne 1 glisse, il en faudra plus."
            : ctx.plan === 3
              ? "Rien n'est prévu : les deux lignes tourneront en polystyrène tout le deuxième trimestre."
              : "Le plan prévoit les deux lignes basculées avant le salon : aucune bobine de PS au deuxième trimestre, si tout se passe comme prévu.",
      },
    ],
    question: "Que commandez-vous à Styrel ?",
    options: [
      {
        t: "Commander au plus juste, ligne par ligne, selon le plan de bascule, avec deux semaines de marge",
        d: "Deux semaines de plus pour chaque ligne qui tournera encore en PS au deuxième trimestre.",
      },
      {
        t: "Confirmer la commande habituelle : treize semaines sur les deux lignes",
        d: `Comme chaque trimestre : ${kE(PRIX_COMMANDE_HABITUELLE)} de bobines.`,
      },
      {
        t: "Annuler la commande du deuxième trimestre : la bascule arrive",
        d: "Aucune bobine de PS pour avril à juin.",
      },
    ],
    reactions: [
      [
        {
          ...TAIG,
          texte:
            "Entendu, je cale l'impression sur vos dates. Prévenez-nous vite si elles bougent : il nous faut trois semaines.",
        },
      ],
      [{ ...TAIG, texte: "Commande confirmée, comme d'habitude. Merci." }],
      [
        {
          ...TAIG,
          texte:
            "C'est noté. Si vous avez encore besoin de polystyrène en avril, ce sera une impression en urgence.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 4 · vendredi",
    titre: "Choisir la matière",
    jusqua: 6,
    messages: (ctx) => [
      {
        ...LENAIC,
        heure: "09:00",
        alerte: true,
        texte:
          "Azilis, le stand du salon se commande la semaine prochaine. Carton ou pas carton ? Il me faut une réponse ce soir.",
      },
      {
        ...IWAN,
        heure: "10:40",
        texte:
          "Avant de signer quoi que ce soit, je veux le coût sur une année, pas le prix du pot. Et je veux savoir ce que Celtis paiera.",
      },
      ...(ctx.plan === 0
        ? [
            {
              ...ISMERIE,
              heure: "15:10",
              texte: `Les modules sont en fabrication, livraison en semaine ${1 + DELAI.carton}. Je vous rappelle qu'une annulation coûterait ${taux(DEDIT.part, 0)} de leur prix et la première commande de pots : ${euros(2 * CONFORMAGE.carton * DEDIT.part + DEDIT.potsCarton)}.`,
            },
          ]
        : ctx.plan === 1
          ? [
              {
                ...PRZEMYSLAW,
                heure: "15:10",
                texte: `Les kits sont en fabrication, livraison en semaine ${1 + DELAI.pp}. Une annulation coûterait ${taux(DEDIT.part, 0)} de leur prix : ${euros(2 * CONFORMAGE.pp * DEDIT.part)}.`,
              },
            ]
          : ctx.essai
            ? [
                {
                  ...GONERI,
                  heure: "16:30",
                  texte:
                    "L'essai est fini. Les chiffres sont chez Annaïg ; le kit PP est resté monté sur la ligne 2.",
                },
              ]
            : []),
    ],
    sources: [
      {
        id: "essai",
        titre: "Lire les résultats de l'essai sur la ligne 2",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.essai
            ? `Sur le nature 4 × 125 g, réglages stabilisés : en PP, cadence ${ctx.cadencePP} par rapport au PS, rebut ${ctx.rebutPP} ; en carton, cadence ${ctx.cadenceCarton}, rebut ${ctx.rebutCarton}. Le carton fuit au scellage dès que l'humidité du bord monte. Le PP a trouvé ses réglages le deuxième jour : opercule, température et pression de scellage. Les tests de conservation rendront leur verdict en semaine 8 ; le PP est une barrière à l'oxygène au moins aussi bonne que le PS, le carton ne tient que par son film.`
            : `Aucun essai n'a été fait : on n'a que les fiches des fournisseurs, établies sur leurs lignes pilotes (PP : cadence −${taux(ANNONCE.pp.cadence, 0)}, rebut ${taux(ANNONCE.pp.rebut)} ; carton : cadence −${taux(ANNONCE.carton.cadence, 0)}, rebut ${taux(ANNONCE.carton.rebut)}). Ce que nos lignes en feront, personne ne le sait.`,
      },
      {
        id: "chiffrage",
        titre: "Faire chiffrer par Iwan Szymanski une année de chaque solution",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          ctx.essai
            ? `Avec les mesures de l'essai, une année coûte, par rapport au polystyrène (pot, éco-contribution, rebuts, cadence) : ${ctx.annuelPP} en PP, ${ctx.annuelCarton} en carton, sans compter la DLC. Il faudra ajouter les équipements : ${kE(2 * CONFORMAGE.pp)} de kits, ou ${kE(2 * CONFORMAGE.carton)} de modules.`
            : `Sur les fiches des fournisseurs, une année coûte, par rapport au polystyrène (pot, éco-contribution, rebuts, cadence) : ${kE(coutAnnuelAnnonce("pp"))} en PP, ${kE(coutAnnuelAnnonce("carton"))} en carton. Iwan : « Ce sont leurs chiffres. Les nôtres seront moins bons. » Il faudra ajouter les équipements : ${kE(2 * CONFORMAGE.pp)} de kits, ou ${kE(2 * CONFORMAGE.carton)} de modules.`,
      },
      {
        id: "filiere",
        titre: "Demander à Pétroc Guézennec où en est le recyclage du polystyrène",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Une filière de recyclage du polystyrène est à l'étude, mais elle ne sera pas en place avant trois ans. Celtis a écrit qu'elle ne comptera comme recyclable que ce que le barème reconnaît le jour de l'échéance.",
      },
    ],
    question: "Quelle matière retenez-vous pour la gamme ?",
    options: [
      {
        t: "Le PP monomatériau, pour toute la gamme",
        d: `${euros(CONFORMAGE.pp)} de kit par ligne, livré en ${DELAI.pp} semaines. Les lignes gardent leur thermoformeuse.`,
      },
      {
        t: "Le carton, pour toute la gamme, comme le souhaite le président",
        d: `${euros(CONFORMAGE.carton)} de module par ligne, livré en ${DELAI.carton} semaines. Le pot que le président veut montrer au salon.`,
      },
      {
        t: "Garder le polystyrène, et attendre la filière de recyclage",
        d: "Aucune dépense ce trimestre. Le dossier sera rouvert avant l'échéance de Celtis.",
      },
    ],
    reactions: [
      [
        {
          ...LENAIC,
          texte:
            "Du plastique, donc. J'espérais mieux pour le salon, mais si les chiffres le disent, je vous suis.",
        },
      ],
      [{ ...LENAIC, texte: "Bien. C'est ce pot-là que je veux montrer en mars." }],
      [
        {
          ...CYRIELLE,
          texte:
            "Je prends note. Je vous rappelle que notre échéance ne bougera pas, et que le barème est le seul juge de ce qui est recyclable.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 6 · vendredi",
    titre: "Le dossier pour Celtis",
    jusqua: 8,
    messages: (ctx) => [
      {
        ...NAIM,
        heure: "08:45",
        alerte: true,
        texte: `Dernier rendez-vous avec Celtis le 24 février : les négociations annuelles se ferment le 1er mars. Qu'est-ce que je demande pour les pots ? Cyrielle m'a glissé qu'elle pourrait prendre ${taux(CELTIS.forfait, 0)} du surcoût au forfait, contre une avant-première des nouveaux pots dans ses magasins.`,
      },
      {
        ...IWAN,
        heure: "12:00",
        texte: `Le surcoût de l'emballage n'est pas sanctuarisé comme la matière première agricole : il se négocie, ou on le garde. ${ctx.matiere === "ps" ? "Cela dit, en restant en polystyrène, nous n'avons pas grand-chose à négocier." : `Sur nos volumes, Celtis pèse ${taux(PART_CELTIS, 0)} de la gamme.`}`,
      },
    ],
    sources: [
      {
        id: "compteRendu",
        titre: "Relire le compte rendu du premier rendez-vous avec Celtis",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Cyrielle Mainguené : « Nous demandons du recyclable, pas du carton. Nous étudierons une hausse de tarif sur les pots concernés si vous nous montrez un coût mesuré, éco-contribution déduite, et un calendrier. Un choix marketing restera à votre charge. Après le 1er mars, nous ne rouvrirons rien, et un fournisseur sans plan de passage au recyclable perdra ses deux opérations de printemps. »",
      },
      {
        id: "historique",
        titre: "Demander à Naïm ce que Celtis a accordé l'an dernier",
        cout: 0.5,
        nature: "utile",
        resultat: `Pour le passage des crèmes dessert en pot allégé, Celtis a pris ${taux(CELTIS.mesure, 0)} du surcoût mesuré, dans le tarif ; elle refuse trois fois sur dix, quand le dossier arrive tard ou que son budget est bouclé. Sur des chiffres de fournisseur, elle en prend moitié moins. Un fabricant de desserts qui avait demandé toute la hausse sans justificatif s'est fait refuser, et a dû financer un prospectus : ${euros(CELTIS.contrepartie)}.`,
      },
    ],
    question: "Que demandez-vous à Celtis ?",
    options: [
      {
        t: "Demander une hausse de tarif couvrant tout le surcoût",
        d: "C'est leur exigence : à eux de la payer. Sans plus de détail.",
      },
      {
        t: `Accepter la prise en charge forfaitaire de ${taux(CELTIS.forfait, 0)}, contre une avant-première`,
        d: `Celtis prend ${taux(CELTIS.forfait, 0)} du surcoût dans son tarif, à coup sûr ; ses magasins reçoivent les nouveaux pots deux semaines avant les autres (${euros(CELTIS.avantPremiere)} de logistique).`,
      },
      {
        t: "Présenter un dossier chiffré et demander le partage du surcoût",
        d: "Coût par pot mesuré, éco-contribution déduite, rebuts, cadence, calendrier par étapes. Celtis décidera de sa part.",
      },
      {
        t: "Ne rien demander : garder le surcoût pour ne pas compliquer la négociation",
        d: "La négociation annuelle se ferme sans parler des pots.",
      },
    ],
    reactions: [
      null,
      [
        {
          ...CYRIELLE,
          texte: `Entendu : ${taux(CELTIS.forfait, 0)} au forfait, et l'avant-première dans nos magasins. Nous l'écrivons dans l'accord annuel.`,
        },
      ],
      null,
      [
        {
          ...NAIM,
          texte:
            "Rien demandé. La négociation se ferme sans les pots ; Celtis ne s'en plaindra pas.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 8 · vendredi",
    titre: "La bascule des lignes",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...LENAIC,
        heure: "08:30",
        alerte: true,
        texte:
          "Le salon est en semaine 12. Je veux pouvoir montrer des pots recyclables sortis de nos lignes, pas des maquettes.",
      },
      {
        ...ERWANN,
        heure: "10:20",
        texte:
          ctx.matiere === "ps"
            ? "Rien à basculer pour l'instant, si je comprends bien : on reste en polystyrène."
            : `Les équipements de la ligne 2 ${arrivee(ctx.arriveeL2!)} ; ceux de la ligne 1 ${arrivee(ctx.arriveeL1!)}. Comment on bascule ?`,
      },
    ],
    sources: [
      {
        id: "maintenance",
        titre: "Faire le point avec Klervi Nédélec et Erwann Tromeur",
        cout: 0.5,
        nature: "decisive",
        resultat: `Klervi : « Mes techniciens peuvent accompagner une ligne à la fois. Deux lignes qui démarrent ensemble, ce sont des régleurs partout et nulle part. » Erwann : « La ligne 1 fait les aromatisés et les fruits : des morceaux sur le bord du pot, c'est là que le scellage lâche. Basculer en hiver, quand les lignes ont ${taux(MARGE_HIVER, 0)} de marge, coûte moins qu'au printemps. Une ligne qui a tourné un mois apprend à l'autre ses réglages. »`,
      },
      {
        id: "conservation",
        titre: "Lire les résultats des tests de conservation",
        cout: 0.5,
        nature: "utile",
        resultat: (ctx) =>
          !ctx.essai
            ? "Aucun test de conservation n'a été lancé : il faut des pots sortis de nos lignes, et trente jours."
            : ctx.dlc === 1
              ? "Ngozi Oyelaran, au laboratoire : « À trente jours, le PP tient comme le PS. Le carton aussi : pas de post-acidification, pas de goût de carton. »"
              : "Ngozi Oyelaran, au laboratoire : « À trente jours, le PP tient comme le PS. Le carton, non : le film laisse passer assez d'oxygène pour que les aromatisés tournent vers le 24e jour. En carton, il faudrait ramener la DLC à 24 jours. »",
      },
      {
        id: "stock",
        titre: "Demander à Ysée Bescond si l'on peut produire d'avance",
        cout: 0.5,
        nature: "utile",
        resultat: `Ysée : « Un yaourt de trente jours de DLC doit arriver chez l'enseigne avec au moins vingt jours devant lui : il part dans les dix jours. Une demi-semaine de stock d'avance avant une bascule, c'est ${taux(1 - STOCK.accepte, 0)} des pots refusés par les plateformes, à déclasser : ${nombre(STOCK.perte, 2)} € perdus par pot. »`,
      },
    ],
    question: "Comment basculez-vous les lignes ?",
    options: [
      {
        t: "Basculer les deux lignes en semaines 10 et 11, pour le salon",
        d: "Toute la gamme en pot recyclable avant le salon, dès que les équipements sont là.",
      },
      {
        t: "Basculer les deux lignes en produisant d'avance une demi-semaine de stock",
        d: "Deux samedis de production avant chaque bascule, pour couvrir les ruptures du démarrage.",
      },
      {
        t: "Tout reporter au deuxième trimestre, après le salon",
        d: "La ligne 2 en semaine 15, la ligne 1 en semaine 17.",
      },
      {
        t: "Par étapes : la ligne 2 d'abord, référence par référence ; la ligne 1 au deuxième trimestre",
        d: "La ligne 2 dès que ses équipements sont là, la ligne 1 en semaine 16 au plus tôt, avec les réglages de la ligne 2.",
      },
    ],
    reactions: [
      [{ ...ERWANN, texte: "Deux lignes en deux semaines. On met tout le monde dessus." }],
      [
        {
          ...YSEE,
          texte:
            "Les samedis sont calés. J'espère que les plateformes prendront les pots : ils seront déjà vieux.",
        },
      ],
      [{ ...LENAIC, texte: "Rien de nos lignes au salon, donc. Je montrerai des maquettes." }],
      [
        {
          ...GONERI,
          texte:
            "On commence par le nature, puis une référence par jour. Si quelque chose cloche, on le voit sur un lot, pas sur toute la gamme.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 10 · vendredi",
    titre: "Le salon",
    jusqua: 13,
    messages: () => [
      {
        ...LENAIC,
        heure: "08:15",
        alerte: true,
        texte:
          "Le salon, c'est dans dix jours. J'ai écrit mon discours : « Toute la gamme Kerbrélan passe au carton cet été. » Vous validez ?",
      },
      {
        ...NAIM,
        heure: "11:30",
        texte:
          "Les acheteurs d'Opaline et de Proxival seront sur le stand. Ils veulent savoir s'ils doivent suivre ce que Celtis a accepté pour les pots.",
      },
    ],
    sources: [
      {
        id: "enseignes",
        titre: "Demander à Naïm ce qu'Opaline et Proxival attendent",
        cout: 0.5,
        nature: "decisive",
        resultat:
          "Leurs accords annuels prévoient une clause de revoyure en cas de changement d'emballage. Emerance Delafosse, chez Opaline : « Montrez-nous un calendrier qui tient et des coûts mesurés, et nous suivrons ce que Celtis a accepté. Si vous annoncez une chose et en faites une autre, non. »",
      },
      {
        id: "allegations",
        titre: "Relire avec Annaïg Le Dantec ce qu'on peut annoncer",
        cout: 0.5,
        nature: "utile",
        resultat: `Une allégation « recyclable » doit être vraie le jour où le produit est en rayon, et la DGCCRF les contrôle. Annoncer une matière qu'on ne mettra pas en ligne oblige à rectifier les supports et le communiqué : Herveline Daniélou l'estime à ${euros(ALIGNEMENT.retropedalage)}, sans compter ce qu'en penserait Celtis, qui comptait relayer l'annonce.`,
      },
      {
        id: "discours",
        titre: "Relire le discours du président",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Trois pages sur l'histoire de la laiterie et ses 310 éleveurs, une phrase sur le carton, aucun chiffre.",
      },
    ],
    question: "Que fait-on annoncer au président ?",
    options: [
      {
        t: "Toute la gamme en carton pour l'été, comme il le souhaite",
        d: "La phrase du discours, telle quelle.",
      },
      {
        t: "Rien, tant que la bascule n'est pas finie",
        d: "Le président parlera de la laiterie et de ses éleveurs, pas des pots.",
      },
      {
        t: "Ce qui est mesuré et daté : la matière retenue, ligne par ligne, avec les dates",
        d: "Le président donne la matière, le calendrier de chaque ligne et les premiers chiffres.",
      },
    ],
    reactions: [
      [{ ...LENAIC, texte: "Merci. La phrase reste telle quelle." }],
      [{ ...LENAIC, texte: "Je parlerai de nos éleveurs, alors. C'est moins neuf." }],
      [{ ...LENAIC, texte: "Moins spectaculaire que le carton. Mais je pourrai le tenir." }],
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Qualifier, mesurer, déployer par étapes", chemin: [2, 0, 0, 2, 3, 2] },
  { nom: "Tout le carton pour le salon", chemin: [0, 2, 1, 0, 0, 0] },
  { nom: "Attendre l'échéance", chemin: [3, 1, 2, 3, 2, 1] },
] as const;

/**
 * Les réflexes d'une responsable emballages sous la pression d'une annonce, [décision, option] :
 * basculer toute la gamme au carton pour le salon (la commande de la semaine 1, le choix de la
 * matière, la bascule des deux lignes d'un coup, l'annonce), ou attendre l'échéance sans rien
 * engager (la semaine 1, garder le polystyrène). Reporter la bascule au deuxième trimestre n'y
 * figure pas : la matière est alors choisie, et la bascule seulement retardée.
 */
export const REFLEXES = [
  [0, 0],
  [0, 3],
  [2, 1],
  [2, 2],
  [4, 0],
  [5, 0],
] as const;

export const REPONSES = {
  toutAccepte:
    "Nous acceptons la hausse demandée sur les pots recyclables. Ne prenez pas l'habitude de demander sans justificatif.",
  toutRefuse:
    "Nous ne prendrons pas une hausse que rien ne justifie. Et puisque nous parlons de l'accord annuel, nous attendons votre participation à notre prospectus de printemps : 8 000 €.",
  dossierAccepte:
    "Votre dossier est clair. Nous prendrons notre part du surcoût dans le tarif, à hauteur de ce qu'il justifie.",
  dossierRefuse:
    "Votre dossier est sérieux, mais notre budget de l'année est bouclé. Nous ne prendrons rien sur les pots cette année.",
} as const;
