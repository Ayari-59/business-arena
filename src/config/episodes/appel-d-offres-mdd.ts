/**
 * LA MARQUE DU DISTRIBUTEUR — le contenu de l'épisode.
 *
 * Naïm Lefeuvre est le directeur des grands comptes et des MDD de la Laiterie
 * de Kerbrélan. Opaline, deuxième client de la laiterie, lance l'appel
 * d'offres de son fromage blanc à marque propre : 4 200 tonnes par an pendant
 * deux ans, à un prix cible 22 % sous le prix de cession du fromage blanc
 * Kerbrélan. Le directeur général veut remplir Pontivy, le directeur
 * financier voit une vente sous le coût de revient, la cheffe de marque une
 * attaque contre Kerbrélan. Six décisions, de septembre à novembre, chacune
 * précédée de ce qu'un directeur des MDD reçoit vraiment.
 *
 * Les chiffres que les sources donnent sont tirés des constantes du modèle :
 * ce que le joueur lit est ce que la simulation calcule.
 *
 * Les sources portent leur NATURE — décisive, utile, bruit, aide — que le
 * joueur ne voit pas : c'est le bilan qui la lit.
 *
 * Entreprises, personnes et chiffres sont fictifs.
 */
import {
  ANNEES,
  AVANCE,
  BESOIN_DECEMBRE,
  BESOIN_MOIS,
  CELTIS,
  CLAUSE_TYPE,
  CONTRAT,
  COUT_COMPLET,
  COUT_COMPLET_REMPLI,
  COUT_LAIT_KG,
  CV,
  CV_LIVRE,
  DEFENSES,
  EMBALLAGES,
  LAIT,
  LIBRE_AFFICHE,
  LIBRE_DECEMBRE,
  LIBRE_MOYEN,
  LIGNE,
  MARQUE,
  MCV_CIBLE,
  MCV_MARQUE,
  MESURES,
  NORDAL,
  PART_FIXE,
  PERTE_DECLASSE,
  PERTE_EN_COUT_COMPLET,
  PIC_MDD,
  PONTIVY,
  PRIX_CIBLE,
  PRIX_MARQUE,
  REMISE_CIBLE,
  REPORT,
  RUPTURE,
  SCENARIOS_LAIT,
  economieEmballage,
  exposition,
  perteMarque,
  stockPerdu,
} from "@/engine/episodes/appel-d-offres-mdd";
import { euros, kE, nombre, taux } from "./format";
import type { Etape } from "./types";

/** Un prix au centime : « 1,56 € ». */
export const prixKg = (v: number) =>
  `${v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
/** Des centimes d'euro : « 10 centimes », « 3,1 centimes ». */
export const centimes = (v: number) => `${nombre(v)} centime${Math.abs(v) >= 2 ? "s" : ""}`;
const tonnes = (v: number) => `${nombre(v, 0)} tonnes`;

const ZINEB = {
  de: "Zineb Hascoët",
  role: "Acheteuse MDD produits laitiers frais, centrale d'achat d'Opaline",
} as const;
const YANNIG = { de: "Yannig Le Goaziou", role: "Directeur général" } as const;
const IWAN = { de: "Iwan Szymanski", role: "Directeur administratif et financier" } as const;
const FANCHON = { de: "Fanchon Lozac'h", role: "Directrice de l'usine de Pontivy" } as const;
const MORWENNA = { de: "Morwenna Pellen", role: "Cheffe de marque Kerbrélan" } as const;
const BAPTISTIN = { de: "Baptistin Haddadi", role: "Directeur commercial" } as const;
const AZILIS = { de: "Azilis Cozic", role: "Responsable emballages et développement" } as const;
const MAEWENN = { de: "Maëwenn Postec", role: "Directrice des ressources humaines" } as const;
const SEZNI = {
  de: "Sezni Le Bras",
  role: "Chef d'équipe de la ligne de fromage frais, Pontivy",
} as const;
const IFEOMA = { de: "Ifeoma Bozec", role: "Chargée d'études, panéliste Rayon Témoin" } as const;
const AODREN = { de: "Aodren Kerbiriou", role: "Acheteur MDD crèmerie, Celtis" } as const;

/** La capacité libre que le planning affiche, sur un an. */
export const LIBRE_AFFICHE_AN = LIBRE_AFFICHE * 12;
/** Ce que la laiterie garderait d'une hausse de 10 % du lait avec le contrat type, en euros par kilo. */
export const HAUSSE_GARDEE = exposition(SCENARIOS_LAIT[2].variation, false) * COUT_LAIT_KG;
/** Ce qu'un point de baisse coûte sur les deux ans du contrat. */
export const POINT_DE_BAISSE = PRIX_CIBLE * 0.01 * CONTRAT.volume * 1000 * ANNEES;
/** Le prix de Celtis qui couvre l'équipe de nuit. */
export const PRIX_EQUIPE_NUIT = CV_LIVRE + CELTIS.equipeNuit / (CELTIS.volume * 1000);
/** Le report de Kerbrélan, pour chaque profil d'acheteurs, au prix cible. */
export const REPORT_AU_PRIX_CIBLE = REPORT.sensibilites.map(
  (s) => s * (1 - PRIX_CIBLE / PRIX_MARQUE),
);

export const DIAGNOSTICS = [
  {
    id: "marge",
    t: "Le prix cible laisse une marge sur coût variable mince mais réelle : tout se joue sur ce qui peut la détruire — le lait, la capacité réelle de décembre, les frais que le contrat ajoute — et la MDD sortira, que nous la fabriquions ou non",
  },
  {
    id: "capacite",
    t: "Pontivy n'a pas la capacité que le planning affiche : le vrai risque est de manquer de capacité en décembre",
  },
  {
    id: "perte",
    t: `Le contrat serait vendu à perte : ${prixKg(PRIX_CIBLE)} ne couvrent pas les ${prixKg(COUT_COMPLET)} de notre coût de revient complet`,
  },
  {
    id: "marque",
    t: "Le danger est pour Kerbrélan : fabriquer une MDD 22 % sous notre prix, c'est cannibaliser notre propre marque",
  },
] as const;

export const ETAPES: readonly Etape[] = [
  {
    moment: "Semaine 1 · lundi",
    titre: "Opaline lance son appel d'offres",
    jusqua: 2,
    messages: () => [
      {
        ...ZINEB,
        heure: "08:10",
        alerte: true,
        texte: `Monsieur Lefeuvre, Opaline lance l'appel d'offres de son fromage blanc à marque propre : ${nombre(CONTRAT.volume)} tonnes par an, lissé 3,2 % et 0 %, en seaux de 1 kg et en pots de 500 g, pour deux ans à partir de la mise en rayon de la semaine 12. Prix cible : ${prixKg(PRIX_CIBLE)} le kilo livré entrepôt. Le contrat type est joint. Offres le vendredi de la semaine 2 ; un second tour suivra, l'attribution après l'audit des sites, en semaine 6.`,
      },
      {
        ...YANNIG,
        heure: "09:00",
        texte: `Naïm, Pontivy a près de ${nombre(Math.round(LIBRE_AFFICHE_AN / 100) * 100)} tonnes de capacité libre par an. ${nombre(CONTRAT.volume)} tonnes, c'est l'usine pleine, et nos frais fixes répartis sur ${nombre(PONTIVY.volume + CONTRAT.volume)} tonnes au lieu de ${nombre(PONTIVY.volume)} : le coût de revient du fromage blanc tombe à ${prixKg(COUT_COMPLET_REMPLI)}. Il faut remplir l'usine.`,
      },
      {
        ...IWAN,
        heure: "09:40",
        texte: `Le coût de revient complet de notre fromage blanc livré est de ${prixKg(COUT_COMPLET)}. À ${prixKg(PRIX_CIBLE)}, on vendrait ${centimes(Math.round((COUT_COMPLET - PRIX_CIBLE) * 100))} sous notre coût : ${kE(PERTE_EN_COUT_COMPLET)} de perte par an. Je ne vois pas comment on signe.`,
      },
      {
        ...MORWENNA,
        heure: "10:30",
        texte: `Une MDD ${taux(REMISE_CIBLE, 0)} sous Kerbrélan, dans les mêmes rayons d'Opaline : c'est notre marque qu'on attaque. Je ne veux pas qu'on la fabrique.`,
      },
    ],
    budget: 5,
    sources: [
      {
        id: "fiche",
        titre: "Décomposer avec Iwan Szymanski le coût d'un kilo de fromage blanc",
        cout: 1,
        nature: "decisive",
        resultat: `Lait : ${nombre(LAIT.litresParKg)} litres par kilo, crème et lactosérum valorisés déduits, à ${LAIT.prix1000} € les 1 000 litres, soit ${prixKg(CV.lait)}. Ferments et ingrédients ${prixKg(CV.ferments)} ; seau ou pot, opercule et carton aux couleurs d'Opaline ${prixKg(CV.emballage)} ; énergie (froid, vapeur, nettoyage en place) ${prixKg(CV.energie)} ; transport Kerfroid jusqu'aux entrepôts d'Opaline ${prixKg(CV.transport)}. Coût variable livré : ${prixKg(CV_LIVRE)}. Les frais fixes de Pontivy — salaires mensualisés, amortissements, maintenance, structure : ${nombre(PONTIVY.fraisFixes / 1e6)} M€ par an — répartis sur ${nombre(PONTIVY.volume)} tonnes font ${prixKg(PART_FIXE)} par kilo : coût de revient complet ${prixKg(COUT_COMPLET)}. Iwan : « Ces frais fixes sont payés avec ou sans le contrat. Il n'en ajouterait qu'un : une cellule MDD — une technicienne qualité, un planificateur, les analyses du plan de contrôle d'Opaline —, ${kE(CONTRAT.cellule)} par an. »`,
      },
      {
        id: "capacite",
        titre: "Reprendre avec Fanchon Lozac'h la capacité réelle de la ligne de fromage frais",
        cout: 1,
        nature: "decisive",
        resultat: `À pleine cadence, en 2×8, la ligne de fromage frais conditionne ${tonnes(LIGNE.theorique)} par mois. Le planning compte ${taux(LIGNE.trsAffiche, 0)} de TRS : ${tonnes(LIGNE.theorique * LIGNE.trsAffiche)}, dont ${nombre(LIGNE.marqueMoyenne)} pour Kerbrélan, soit ${nombre(LIBRE_AFFICHE)} de libres par mois — les ${nombre(LIBRE_AFFICHE_AN)} tonnes par an du directeur général. Le TRS réel des douze derniers mois est de ${taux(LIGNE.trsMoyen, 0)} : ${nombre(LIBRE_MOYEN)} tonnes libres par mois, et le contrat en demande ${nombre(BESOIN_MOIS)}. En décembre, les formats de fêtes multiplient les changements de format et les nettoyages : ${taux(LIGNE.trsDecembre, 0)} de TRS, quand Kerbrélan est à son pic (${tonnes(LIGNE.marqueDecembre)}) et la MDD aussi (+${taux(PIC_MDD - 1, 0)}, ${tonnes(BESOIN_DECEMBRE)}). Il resterait ${nombre(LIBRE_DECEMBRE)} tonnes de libres pour ${nombre(BESOIN_DECEMBRE)} demandées. Au-delà, Pontivy sert le contrat et Kerbrélan manque en rayon : environ ${euros(RUPTURE)} par tonne manquante, marge perdue et pénalités logistiques comprises.`,
      },
      {
        id: "lait",
        titre: "Demander à Hoel Quiniou où va le prix du lait, et lire la clause du contrat type",
        cout: 0.5,
        nature: "decisive",
        resultat: `Le lait fait ${prixKg(CV.lait)} des ${prixKg(CV_LIVRE)} du coût variable. L'OP Lait du Méné voit trois tendances pour les deux ans à venir : ${SCENARIOS_LAIT.map((s) => `${s.nom.toLowerCase()} (${s.variation > 0 ? "+" : "−"}${taux(Math.abs(s.variation), 0)}) ${["zéro", "une", "deux", "trois", "quatre", "cinq"][Math.round(s.chance * 10)]} fois sur dix`).join(", ")}. La loi impose aux contrats MDD une clause de révision automatique liée au prix de la matière première agricole, mais elle en laisse la formule aux parties. Celle du contrat type d'Opaline ne révise le prix qu'au 1er janvier, et seulement pour la part de variation au-delà de ${taux(CLAUSE_TYPE.tunnel, 0)} : d'une hausse de ${taux(SCENARIOS_LAIT[2].variation, 0)}, la laiterie garderait ${centimes(Math.round(HAUSSE_GARDEE * 1000) / 10)} par kilo, plus que la marge. Une clause trimestrielle indexée sur l'indicateur de prix du lait de l'OP répercute la part matière laitière, avec un trimestre de retard.`,
      },
      {
        id: "image",
        titre: "Lire l'étude d'image de Kerbrélan avec Morwenna Pellen",
        cout: 0.5,
        nature: "bruit",
        resultat:
          "Notoriété de 74 % en Bretagne, image de « fromage blanc du pays » : les acheteurs citent le goût et l'origine. Morwenna : « Fabriquer la MDD de nos propres clients, c'est banaliser Kerbrélan. » L'étude date de deux ans ; elle ne dit rien de ce que les acheteurs feront face à une MDD moins chère, ni de qui la fabriquera.",
      },
      {
        id: "conseil",
        titre: "Demander conseil à Gwenvred Dagorn",
        cout: 0.5,
        nature: "aide",
        resultat:
          "Gwenvred, qui a dirigé les MDD d'une coopérative laitière : « Une MDD ne se juge ni au coût complet ni au remplissage de l'usine. Regarde la marge sur coût variable de ce qu'elle ajoute, les frais fixes qu'elle ajoute vraiment, la capacité de décembre, et écris la clause du lait comme s'il allait monter. Et souviens-toi que la MDD sortira, que tu la fabriques ou non. »",
      },
    ],
    diagnostic: true,
    prevision: true,
    question: "Quelle réponse proposez-vous au comité de direction ?",
    options: [
      {
        t: "Répondre au prix cible, sur le contrat type d'Opaline : remplir Pontivy",
        d: `${prixKg(PRIX_CIBLE)} le kilo, révision au-delà de ${taux(CLAUSE_TYPE.tunnel, 0)} une fois par an, toutes les quantités commandées, décembre compris. La réponse que le directeur général attend ; dossier : ${kE(CONTRAT.dossier)}.`,
      },
      {
        t: `Ne pas répondre : une MDD ${taux(REMISE_CIBLE, 0)} sous Kerbrélan, c'est notre marque qu'on attaque`,
        d: "Aucun dossier à monter. Opaline traitera avec le Groupe Nordal.",
      },
      {
        t: "Répondre au prix cible, avec une clause de révision indexée sur le lait et des volumes de décembre plafonnés",
        d: `${prixKg(PRIX_CIBLE)} le kilo, révision trimestrielle sur l'indicateur de l'OP, décembre limité au volume d'un mois moyen. Une offre moins simple à comparer pour l'acheteuse ; dossier : ${kE(CONTRAT.dossier)}.`,
      },
      {
        t: `Répondre au coût de revient complet : ${prixKg(COUT_COMPLET)} le kilo, pas un kilo sous notre coût`,
        d: `Le prix qui couvre tous nos frais, sur le contrat type. Dossier : ${kE(CONTRAT.dossier)}.`,
      },
    ],
    reactions: [
      [
        { ...YANNIG, texte: "Parfait. Pontivy sera pleine à Noël." },
        { ...FANCHON, texte: "Je préviens les équipes : on remplit la ligne de fromage frais." },
      ],
      [
        { ...MORWENNA, texte: "Merci. Kerbrélan n'a pas à se battre contre ses propres pots." },
        {
          ...BAPTISTIN,
          texte: "Opaline va traiter avec Nordal. Je le regrette, mais c'est ta décision.",
        },
      ],
      [
        {
          ...ZINEB,
          texte:
            "Bien reçu. Une clause trimestrielle et un plafond de décembre, je dois les comparer à des offres plus simples. Je vous dirai au second tour.",
        },
      ],
      [
        {
          ...ZINEB,
          texte: "Bien reçu. Votre prix est loin de notre cible ; je vous dirai au second tour.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 3 · lundi",
    titre: "Le second tour",
    jusqua: 4,
    messages: (ctx) =>
      ctx.repondu
        ? [
            {
              ...ZINEB,
              heure: "09:30",
              alerte: true,
              texte: `Monsieur Lefeuvre, à ${ctx.prix} le kilo, vous n'êtes pas le mieux-disant : le Groupe Nordal a fait mieux. Faites un effort${ctx.variante ? ", ou retirez vos conditions" : ""}. Dernière offre vendredi.`,
            },
            {
              ...YANNIG,
              heure: "10:15",
              texte: `On ne va pas perdre ${nombre(CONTRAT.volume)} tonnes pour quelques centimes. Fais le geste.`,
            },
            {
              ...IWAN,
              heure: "11:00",
              texte: `Pour mémoire : chaque point de baisse, c'est ${centimes(PRIX_CIBLE)} de moins par kilo, ${kE(POINT_DE_BAISSE)} sur les deux ans.`,
            },
          ]
        : [
            {
              ...BAPTISTIN,
              heure: "09:30",
              alerte: true,
              texte:
                "Opaline mène son second tour sans nous : le Groupe Nordal est seul en lice. Zineb Hascoët m'a demandé si nous étions sûrs de nous ; je lui ai dit que oui.",
            },
            {
              ...MORWENNA,
              heure: "10:15",
              texte:
                "La MDD sortira donc chez Opaline en semaine 12, fabriquée par Nordal. Il faudra défendre Kerbrélan.",
            },
          ],
    reevaluation: true,
    sources: [
      {
        id: "nordal",
        titre: "Estimer le prix du Groupe Nordal avec Baptistin Haddadi",
        cout: 0.5,
        nature: "decisive",
        resultat: `Nordal fait son fromage blanc dans son usine normande, à trois cents kilomètres des entrepôts d'Opaline de l'Ouest : son transport lui coûte 4 à 5 centimes de plus par kilo que le nôtre. Ses offres MDD connues chez Celtis, l'an dernier, allaient de 1,58 à 1,63 €. Sur ce fromage blanc, on peut l'attendre entre ${prixKg(NORDAL.min)} et ${prixKg(NORDAL.max)}, n'importe où dans la fourchette : il descend rarement sous le prix cible, et ne le peut guère plus que nous. Opaline retient le moins-disant, et compte une offre en variante — clause trimestrielle, plafond de décembre — un point plus cher qu'une offre au contrat type.`,
      },
      {
        id: "acheteuse",
        titre: "Demander comment Zineb Hascoët négocie",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Baptistin : « Elle dit à chaque candidat, à chaque tour, qu'il n'est pas le mieux-disant. L'an dernier, sur la crème fraîche, elle a dit la même chose à Nordal et à nous, la même semaine. Elle n'a pas le droit de nous donner le prix de Nordal, et elle ne le fera pas. »",
      },
      {
        id: "baisse",
        titre: "Chiffrer avec Iwan Szymanski ce que coûte une baisse",
        cout: 0.5,
        nature: "utile",
        resultat: `Une baisse de 2 % retire ${centimes(PRIX_CIBLE * 2)} par kilo à une marge sur coût variable de ${centimes(MCV_CIBLE * 100)} : ${kE(POINT_DE_BAISSE * 2)} sur les deux ans, près d'un tiers de la marge. Une baisse de 4 %, ${kE(POINT_DE_BAISSE * 4)} : il ne reste presque rien. Retirer la clause du lait garde le prix, mais laisse à la laiterie ${nombre(exposition(SCENARIOS_LAIT[2].variation, false) * 100)} points d'une hausse de ${taux(SCENARIOS_LAIT[2].variation, 0)}.`,
      },
    ],
    question: "Que répondez-vous à Opaline au second tour ?",
    options: [
      {
        t: "Baisser de 4 % : ce dossier ne doit pas nous échapper",
        d: `Depuis le prix cible, le kilo à ${prixKg(PRIX_CIBLE * 0.96)}. L'acheteuse n'aura plus d'argument.`,
      },
      {
        t: "Baisser de 2 %",
        d: `Depuis le prix cible, le kilo à ${prixKg(PRIX_CIBLE * 0.98)}, conditions inchangées.`,
      },
      {
        t: "Tenir notre offre",
        d: "Le prix et les conditions de la première offre. Opaline tranchera.",
      },
      {
        t: "Garder le prix, et lâcher la clause du lait et le plafond de décembre",
        d: "Une offre au contrat type, plus simple à comparer.",
      },
    ],
    reactions: [
      [
        {
          ...ZINEB,
          texte:
            "C'est noté. La direction des achats tranchera en semaine 6, après l'audit des sites.",
        },
      ],
      [
        {
          ...ZINEB,
          texte:
            "C'est noté. La direction des achats tranchera en semaine 6, après l'audit des sites.",
        },
      ],
      [
        {
          ...ZINEB,
          texte:
            "C'est noté. La direction des achats tranchera en semaine 6, après l'audit des sites.",
        },
      ],
      [
        {
          ...ZINEB,
          texte:
            "C'est plus simple pour tout le monde. La direction des achats tranchera en semaine 6, après l'audit des sites.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 5 · lundi",
    titre: "L'audit de Pontivy et le plan de décembre",
    jusqua: 6,
    messages: (ctx) =>
      ctx.repondu
        ? [
            {
              ...FANCHON,
              heure: "08:30",
              alerte: true,
              texte: `Naïm, l'auditrice d'Opaline est passée, et nous avons fait les essais industriels de la MDD : ${ctx.trs} de TRS au rythme de décembre. Opaline veut notre plan de décembre avant d'attribuer. Avec ${ctx.besoin} tonnes de MDD en décembre, je ne les ai pas.`,
            },
            {
              ...YANNIG,
              heure: "09:20",
              texte:
                "Pontivy a toujours passé ses pics. On ne va pas engager des frais avant d'avoir le contrat.",
            },
          ]
        : [
            {
              ...FANCHON,
              heure: "08:30",
              alerte: true,
              texte:
                "Naïm, pas de MDD chez nous : décembre se passera comme d'habitude, avec Kerbrélan à son pic. Je te laisse me dire s'il faut prévoir quelque chose.",
            },
          ],
    sources: [
      {
        id: "essais",
        titre: "Refaire décembre avec Fanchon Lozac'h, au TRS des essais",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.repondu
            ? `Au TRS mesuré de ${ctx.trs}, la ligne conditionnerait ${ctx.capacite} tonnes en décembre, dont ${nombre(LIGNE.marqueDecembre)} pour Kerbrélan : ${ctx.libre} de libres. La MDD en demandera ${ctx.besoin}${ctx.variante ? ", plafonnées au mois moyen" : ", pic de décembre compris"} : il manquerait ${ctx.manque} tonnes, environ ${ctx.ruptures} de ruptures et de pénalités par décembre, deux décembres sur la durée du contrat. Une équipe de suppléance le week-end ajoute environ ${nombre(MESURES[2].capacite)} tonnes ; une équipe de nuit de mi-novembre à mi-janvier, ${nombre(MESURES[3].capacite)}.`
            : `Sans MDD, Kerbrélan prendra ${nombre(LIGNE.marqueDecembre)} tonnes en décembre, sur une ligne qui en conditionne ${ctx.capacite} au TRS des essais : rien à prévoir.`,
      },
      {
        id: "dlc",
        titre: "Demander à Ysée Bescond si l'on peut produire d'avance",
        cout: 0.5,
        nature: "utile",
        resultat: `La DLC du fromage blanc est de 30 jours, et Opaline refuse un produit qui arrive avec moins des deux tiers de sa DLC : il doit partir dans les dix jours qui suivent sa fabrication. Sur ${tonnes(AVANCE.produit)} faites dans la deuxième quinzaine de novembre, une soixantaine seulement partiraient à temps ; le reste se déclasse — déstockage à ${prixKg(AVANCE.recuperation)} le kilo, ou dons aux associations —, une perte de ${prixKg(PERTE_DECLASSE)} par kilo, plus ${euros(AVANCE.stockage)} la tonne de chambre froide.`,
      },
      {
        id: "rh",
        titre: "Demander à Maëwenn Postec ce que coûtent les renforts",
        cout: 0.5,
        nature: "utile",
        resultat: `Suppléance du samedi et du dimanche matin en décembre, avec des volontaires et des intérimaires déjà formés à la ligne : ${kE(MESURES[2].cout)} par décembre, majorations comprises, pour environ ${tonnes(MESURES[2].capacite)}. Une équipe de nuit de mi-novembre à mi-janvier : ${kE(MESURES[3].cout)} par hiver pour ${tonnes(MESURES[3].capacite)}, après avis du CSE. Rien n'est engagé si le contrat n'est pas signé.`,
      },
    ],
    question: "Quel plan de décembre présentez-vous à Opaline ?",
    options: [
      {
        t: "Tenir le plan de charge : Pontivy a toujours passé ses pics",
        d: "Aucun coût engagé. Les équipes s'organiseront le moment venu.",
      },
      {
        t: "Produire d'avance en novembre, et stocker en chambre froide",
        d: `${tonnes(AVANCE.produit)} faites dans la deuxième quinzaine de novembre, gardées au froid jusqu'aux livraisons de décembre. Pas d'heures en plus.`,
      },
      {
        t: "Prévoir des équipes de suppléance le week-end en décembre",
        d: `${kE(MESURES[2].cout)} par décembre si le contrat est signé ; environ ${tonnes(MESURES[2].capacite)} de plus.`,
      },
      {
        t: "Passer la ligne en 3×8 de mi-novembre à mi-janvier",
        d: `${kE(MESURES[3].cout)} par hiver si le contrat est signé ; ${tonnes(MESURES[3].capacite)} de plus.`,
      },
    ],
    reactions: [
      [{ ...FANCHON, texte: "Bien. On verra en décembre." }],
      [
        {
          ...SEZNI,
          texte:
            "On lancera les fabrications d'avance le 15 novembre. La chambre froide numéro 3 sera libre.",
        },
      ],
      [
        {
          ...MAEWENN,
          texte:
            "Je lance l'appel aux volontaires et je réserve des intérimaires formés pour les week-ends de décembre.",
        },
      ],
      [
        {
          ...MAEWENN,
          texte: "Je mets l'équipe de nuit d'hiver à l'ordre du jour du prochain CSE.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 7 · lundi",
    titre: "Les emballages aux couleurs d'Opaline",
    jusqua: 8,
    messages: (ctx) =>
      ctx.gagne
        ? [
            {
              ...AZILIS,
              heure: "09:00",
              alerte: true,
              texte: `Naïm, il faut commander les seaux, les pots et les opercules imprimés aux couleurs d'Opaline pour les premières livraisons. Le fournisseur fait ${centimes(EMBALLAGES.economie[0] * 100)} de moins par kilo sur des séries de six mois, ${centimes(EMBALLAGES.economie[3] * 100)} sur douze mois.`,
            },
            {
              ...ZINEB,
              heure: "11:00",
              texte:
                "Pour information, notre direction marketing travaille à une nouvelle charte pour nos marques propres. Rien n'est décidé ; nous saurons d'ici la fin de l'année.",
            },
          ]
        : [
            {
              ...AZILIS,
              heure: "09:00",
              texte:
                "Naïm, pas de contrat Opaline : rien à commander. Le fournisseur garde nos maquettes au cas où.",
            },
          ],
    sources: [
      {
        id: "charte",
        titre: "Mesurer avec Azilis Cozic le risque d'un changement de charte",
        cout: 0.5,
        nature: "decisive",
        resultat: `Opaline refond ses chartes tous les trois ou quatre ans ; la dernière a quatre ans, et sa direction marketing en parle depuis le printemps : une chance sur deux qu'elle change d'ici l'été. Un changement de charte rend inutilisable le stock imprimé, en moyenne la moitié de ce qui a été commandé : ${kE(stockPerdu(EMBALLAGES.mois[0]))} pour six mois, ${kE(stockPerdu(EMBALLAGES.mois[3]))} pour douze, ${kE(stockPerdu(EMBALLAGES.mois[1]))} pour deux. L'économie de série rapporte ${kE(economieEmballage(EMBALLAGES.economie[0]))} sur les deux ans avec des séries de six mois, ${kE(economieEmballage(EMBALLAGES.economie[3]))} avec des séries de douze.`,
      },
      {
        id: "reprise",
        titre: "Demander à Azilis ce que les enseignes acceptent",
        cout: 0.5,
        nature: "utile",
        resultat:
          "Beaucoup de contrats MDD prévoient que l'enseigne reprenne au prix coûtant les emballages devenus inutilisables par son fait. D'après les industriels qui travaillent pour elle, Opaline a accepté cette clause trois fois sur quatre. Si elle refuse, on commandera deux mois à la fois.",
      },
    ],
    question: "Comment commandez-vous les emballages ?",
    options: [
      {
        t: "Commander six mois d'emballages imprimés",
        d: `${centimes(EMBALLAGES.economie[0] * 100)} de moins par kilo. Le stock suit les livraisons.`,
      },
      {
        t: "Commander au fil de l'eau, deux mois à la fois",
        d: "Le prix actuel, et le moins de stock possible.",
      },
      {
        t: "Commander six mois, en demandant à Opaline une clause de reprise si sa charte change",
        d: `${centimes(EMBALLAGES.economie[0] * 100)} de moins par kilo ; si Opaline refuse la clause, on commandera deux mois à la fois.`,
      },
      {
        t: "Commander douze mois d'un coup : le prix le plus bas",
        d: `${centimes(EMBALLAGES.economie[3] * 100)} de moins par kilo, et douze mois de stock à Pontivy.`,
      },
    ],
    reactions: [
      [
        {
          ...AZILIS,
          texte: "Commande passée : six mois de seaux et de pots, livrés en semaine 10.",
        },
      ],
      [
        {
          ...AZILIS,
          texte: "Deux mois commandés. Je relancerai le fournisseur tous les deux mois.",
        },
      ],
      [{ ...AZILIS, texte: "J'envoie la clause à Opaline ; la commande attend sa réponse." }],
      [{ ...AZILIS, texte: "Commande passée : douze mois d'emballages, à stocker à Pontivy." }],
    ],
  },
  {
    moment: "Semaine 9 · lundi",
    titre: "Kerbrélan face à la MDD",
    jusqua: 10,
    messages: (ctx) => [
      {
        ...MORWENNA,
        heure: "09:00",
        alerte: true,
        texte: `Naïm, la MDD arrive en rayon chez Opaline en semaine 12, ${ctx.gagne ? `fabriquée par nous, à ${ctx.prix} le kilo` : "fabriquée par Nordal"} : environ ${ctx.ecart} sous Kerbrélan. Mon plan de lancement est prêt : deux opérations promotionnelles et de la mise en avant chez Opaline, ${kE(DEFENSES[1].cout)} par an. Je voudrais le doubler.`,
      },
      {
        ...BAPTISTIN,
        heure: "10:00",
        texte: `Le panéliste Rayon Témoin propose de mesurer le report avant la mise en rayon : ${kE(REPORT.etude)}, résultats en semaine 12.`,
      },
      {
        ...YANNIG,
        heure: "11:30",
        texte: "Nos clients achètent Kerbrélan, pas un prix. Ne dépensons rien de plus.",
      },
    ],
    sources: [
      {
        id: "etude",
        titre: "Demander à Ifeoma Bozec ce que l'étude mesure",
        cout: 0.5,
        nature: "decisive",
        resultat: `L'étude suit trois mille foyers acheteurs de fromage blanc chez Opaline et mesure la sensibilité de ceux de Kerbrélan à l'écart de prix : la part qui passe à la MDD, pour chaque point d'écart. Sur les marques régionales, trois profils reviennent à peu près aussi souvent : fidèle (${nombre(REPORT.sensibilites[0])}), moyen (${nombre(REPORT.sensibilites[1])}), sensible (${nombre(REPORT.sensibilites[2])}). À ${taux(REMISE_CIBLE, 0)} d'écart, Kerbrélan perdrait ${REPORT_AU_PRIX_CIBLE.map((r) => taux(r, 0)).join(", ")} de ses ventes chez Opaline : ${REPORT.sensibilites.map((s) => kE(perteMarque(s, PRIX_CIBLE))).join(", ")} de marge sur les deux ans (${nombre(MARQUE.volume)} tonnes par an à ${centimes(MCV_MARQUE * 100)} de marge sur coût variable). L'étude dit aussi où le report se fait, magasin par magasin : une défense ciblée retient ${nombre(REPORT.ciblage * 100)} points de plus.`,
      },
      {
        id: "promos",
        titre: "Revoir avec Morwenna Pellen ce que les promotions ont rendu",
        cout: 0.5,
        nature: "utile",
        resultat: `Face à une clientèle fidèle, une promotion vend surtout à ceux qui auraient acheté de toute façon : le plan prévu retient ${taux(DEFENSES[1].efficacite[0], 0)} du report, le plan doublé ${taux(DEFENSES[0].efficacite[0], 0)}. Face à une clientèle moyenne, ${taux(DEFENSES[1].efficacite[1], 0)} et ${taux(DEFENSES[0].efficacite[1], 0)} ; face à une clientèle sensible au prix, ${taux(DEFENSES[1].efficacite[2], 0)} et ${taux(DEFENSES[0].efficacite[2], 0)}. Le plan prévu coûte ${kE(DEFENSES[1].cout)} par an, le plan doublé ${kE(DEFENSES[0].cout)}. Les opérations restent sous les plafonds légaux : 34 % de remise en valeur, 25 % du volume annuel.`,
      },
    ],
    question: "Comment défendez-vous Kerbrélan chez Opaline ?",
    options: [
      {
        t: "Doubler tout de suite le plan de Morwenna : on ne laisse rien à la MDD",
        d: `${kE(DEFENSES[0].cout)} par an de promotions et de mise en avant, dès la mise en rayon.`,
      },
      {
        t: "S'en tenir au plan prévu",
        d: `${kE(DEFENSES[1].cout)} par an. Rien de plus à décider.`,
      },
      {
        t: "Commander l'étude de report, et ajuster le plan au vu de ses résultats",
        d: `${kE(REPORT.etude)}, résultats en semaine 12 : doubler le plan, le garder ou le supprimer.`,
      },
      {
        t: "Supprimer le plan : nos acheteurs achètent une marque, pas un prix",
        d: `${kE(DEFENSES[1].cout)} par an d'économie.`,
      },
    ],
    reactions: [
      [{ ...MORWENNA, texte: "Merci. Je réserve les têtes de gondole pour la semaine 12." }],
      [{ ...MORWENNA, texte: "Le plan part tel qu'il est." }],
      [
        {
          ...IFEOMA,
          texte: "Nous lançons le terrain lundi. Résultats en semaine 12, magasin par magasin.",
        },
      ],
      [
        {
          ...MORWENNA,
          texte: "C'est un pari. J'espère que nos acheteurs vous donneront raison.",
        },
      ],
    ],
  },
  {
    moment: "Semaine 11 · lundi",
    titre: "Celtis veut sa MDD",
    jusqua: 13,
    messages: (ctx) => [
      {
        ...AODREN,
        heure: "08:45",
        alerte: true,
        texte: `Monsieur Lefeuvre, Celtis lance à son tour un fromage blanc à sa marque pour ses magasins de l'Ouest : ${nombre(CELTIS.volume)} tonnes par an, deux ans à partir d'avril, à ${prixKg(CELTIS.prix)} le kilo livré. ${ctx.gagne ? "Vous fabriquez déjà celui d'Opaline : vous savez faire." : "On me dit que vous avez de la place à Pontivy."} Réponse dans quinze jours.`,
      },
      {
        ...YANNIG,
        heure: "09:30",
        texte: ctx.gagne
          ? "Opaline et Celtis : Pontivy tournera jour et nuit, et le coût de revient fondra. On prend."
          : "Après Opaline, on ne laisse pas passer Celtis. On prend.",
      },
      {
        ...MORWENNA,
        heure: "10:10",
        texte:
          "Celtis est le premier client de Kerbrélan. Si nous fabriquons aussi sa MDD, son acheteur saura tout de nos coûts à la prochaine négociation annuelle.",
      },
    ],
    sources: [
      {
        id: "pontivy",
        titre: "Calculer avec Fanchon Lozac'h ce que Celtis demande à Pontivy",
        cout: 0.5,
        nature: "decisive",
        resultat: (ctx) =>
          ctx.gagne
            ? `Avec Opaline, la ligne de fromage frais est pleine : ${nombre(BESOIN_MOIS)} tonnes par mois pour ${nombre(LIBRE_MOYEN)} de libres au TRS réel. Les ${nombre(CELTIS.volume / 12, 0)} tonnes par mois de Celtis demanderaient une équipe de nuit toute l'année : neuf conducteurs et opérateurs, primes de nuit comprises, ${kE(CELTIS.equipeNuit)} par an. À ${prixKg(CELTIS.prix)}, Celtis rapporte ${centimes(Math.round((CELTIS.prix - CV_LIVRE) * 100))} par kilo de marge sur coût variable, ${kE((CELTIS.prix - CV_LIVRE) * CELTIS.volume * 1000)} par an : moins que l'équipe de nuit. Il faudrait ${prixKg(PRIX_EQUIPE_NUIT)} le kilo pour la couvrir.`
            : `Sans Opaline, la ligne a ${nombre(LIBRE_MOYEN)} tonnes libres par mois au TRS réel : les ${nombre(CELTIS.volume / 12, 0)} de Celtis passent sans équipe de plus ; Celtis ne demande pas de pic en décembre. À ${prixKg(CELTIS.prix)}, elles rapportent ${centimes(Math.round((CELTIS.prix - CV_LIVRE) * 100))} par kilo, ${kE((CELTIS.prix - CV_LIVRE) * CELTIS.volume * 1000)} par an, moins la cellule MDD qu'il faudrait monter (${kE(CONTRAT.cellule)}).`,
      },
      {
        id: "celtis",
        titre: "Demander à Baptistin Haddadi comment Celtis achète ses MDD",
        cout: 0.5,
        nature: "utile",
        resultat: `Celtis veut un second fournisseur et l'origine Bretagne sur ses pots ; Nordal ne peut pas la lui donner. Ses acheteurs acceptent une contre-proposition argumentée environ une fois sur deux. À ${prixKg(CELTIS.contre)}, Celtis paierait encore son fromage blanc ${taux(1 - CELTIS.contre / PRIX_MARQUE, 0)} sous Kerbrélan.`,
      },
    ],
    question: "Que répondez-vous à Celtis ?",
    options: [
      {
        t: `Accepter à ${prixKg(CELTIS.prix)} : remplir Pontivy, et mieux absorber nos frais fixes`,
        d: `${nombre(CELTIS.volume)} tonnes par an à partir d'avril, une équipe de nuit s'il le faut.`,
      },
      {
        t: "Refuser : une deuxième MDD, c'est trop de dépendance aux enseignes",
        d: "Celtis ira chez un autre fabricant.",
      },
      {
        t: `Répondre à ${prixKg(CELTIS.contre)} : le prix qui couvre ce que sa MDD ajoute à Pontivy`,
        d: "L'origine Bretagne et la capacité ont un prix. Celtis dira oui, ou non.",
      },
    ],
    reactions: [
      [{ ...AODREN, texte: "Parfait. Nous signons pour avril." }],
      [{ ...AODREN, texte: "Dommage. Nous trouverons un autre fabricant." }],
      null,
    ],
  },
];

/** Les trois manières de décider auxquelles le bilan compare le joueur, sous son hasard. */
export const REFERENCES = [
  { nom: "Chiffrer avant de remplir", chemin: [2, 2, 2, 2, 2, 2] },
  { nom: "Remplir l'usine", chemin: [0, 0, 0, 3, 1, 0] },
  { nom: "Protéger la marque par principe", chemin: [1, 2, 0, 1, 0, 1] },
] as const;

/**
 * Les options que l'erreur de l'épisode fait choisir : [décision, option].
 * Remplir l'usine — le prix cible au contrat type, une baisse pour gagner à
 * tout prix, les conditions lâchées, décembre laissé au hasard, les emballages
 * au plus bas prix, Celtis au prix demandé — ou protéger la marque par
 * principe — ne pas répondre, répondre au coût complet, refuser Celtis — et,
 * pour la marque, décider sans mesurer le report.
 */
export const REFLEXES = [
  [0, 0],
  [0, 1],
  [0, 3],
  [1, 0],
  [1, 3],
  [2, 0],
  [3, 3],
  [4, 0],
  [4, 1],
  [5, 0],
  [5, 1],
] as const;

export const REPONSES = {
  gagne: (prix: string, conditions: boolean) =>
    `Monsieur Lefeuvre, Opaline vous attribue son fromage blanc à marque propre, à ${prix} le kilo${conditions ? ", avec votre clause trimestrielle et le plafond de décembre" : ", au contrat type"}. Premières livraisons en semaine 11, mise en rayon en semaine 12.`,
  perdu:
    "Monsieur Lefeuvre, Opaline retient le Groupe Nordal, moins-disant. Merci de votre offre ; nous serons heureux de vous consulter à nouveau.",
  sansNous:
    "Opaline a attribué sa MDD de fromage blanc au Groupe Nordal. Mise en rayon en semaine 12.",
  repriseOui:
    "Va pour la clause de reprise : si nous changeons de charte, nous vous rachetons au prix coûtant les emballages imprimés devenus inutilisables.",
  repriseNon:
    "Nous ne reprenons pas d'emballages : c'est au fabricant de gérer son stock. Commandez au plus juste.",
  charteChange:
    "Notre direction marketing a tranché : nouvelle charte pour nos marques propres au printemps. Les emballages actuels serviront jusqu'à fin mars.",
  charteGardee:
    "Notre direction marketing a tranché : pas de nouvelle charte avant deux ans au moins.",
  lait: [
    "L'OP publie ses indicateurs : le beurre et la poudre reculent, et la tendance des deux ans est à la détente, autour de 4 % de baisse du prix du lait.",
    "L'OP publie ses indicateurs : marchés calmes, la tendance des deux ans est à la stabilité, autour de 2 % de hausse du prix du lait.",
    "L'OP publie ses indicateurs : le beurre et la poudre flambent, et la tendance des deux ans est à la hausse, autour de 10 % sur le prix du lait.",
  ],
  profils: ["fidèle", "de sensibilité moyenne", "sensible au prix"],
  defenses: [
    "Nous doublons le plan de Morwenna, ciblé sur les magasins où le report se fait.",
    "Nous gardons le plan de Morwenna, ciblé sur les magasins où le report se fait.",
    "Le plan de Morwenna ne retiendrait presque rien : nous le supprimons.",
  ],
  celtisOui: `${prixKg(CELTIS.contre)}, c'est plus que prévu, mais l'origine Bretagne vaut quelque chose pour nos clients. D'accord, à partir d'avril.`,
  celtisNon: `${prixKg(CELTIS.contre)}, c'est hors de notre budget. Nous signons avec un autre fabricant.`,
} as const;
