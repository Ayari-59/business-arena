import { eur, nombreAuCentieme, pct, qte } from "../../../pedagogy/cours/deux-decimales";
import { LA_TABLE_D_AUGUSTIN } from "../monde/la-table-d-augustin";
import {
  MOMENTS_DE_LA_SOIREE,
  SOIREE_DU_CHEF,
  couvertsDeLaSalle,
  couvertsQuiPaient,
  margeDUnCouvert,
  margeDUnCouvertDeLaSoiree,
  margeDUnSoirOrdinaire,
  satisfactionDuBistrot,
  soireeDuChef,
} from "../monde/experience-du-bistrot";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : L'EXPÉRIENCE CLIENT ET LA VALEUR PERÇUE (Bac STMG, mercatique de terminale, thème 1,
 * question 1.2 : « Toute consommation crée-t-elle de l'expérience ? »).
 *
 * Un repas ne se juge pas qu'à l'assiette. Le chapitre part de la valeur perçue (ce que le client pense
 * recevoir, rapporté à ce qu'il donne), mesure la satisfaction comme l'écart entre ce qu'il attendait et
 * ce qu'il a perçu, puis passe au marketing expérientiel : faire vivre une expérience, par les sens,
 * l'émotion et le lien. Le curseur chiffre ce que doit rapporter une soirée expérientielle pour payer
 * son animation et le dîner ordinaire qu'elle remplace. La réponse à la question du programme est
 * nuancée : toute consommation crée une expérience, mais pas la même ; le client pressé du midi attend
 * d'abord d'être servi vite.
 *
 * LA VALEUR PERÇUE EST PARTAGÉE avec « Les formes de la valeur » (sciences de gestion et numérique de
 * première, thème 3), qui la mesure par les avis et la réputation à L'ESCALE : ce chapitre ne la refait
 * pas, il la prolonge vers la satisfaction et l'expérience, dans un autre lieu. Il ne cite pas le thème 3
 * de la SGN : la page range un chapitre sous la première entrée que le référentiel nomme, et la SGN de
 * première vient avant la mercatique ; le chapitre doit paraître sous la mercatique (par-diplome.ts).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (monde/experience-du-bistrot.ts), chez LA TABLE D'AUGUSTIN
 * seule : le ticket moyen, les coûts d'un couvert, la salle et les clientèles de la fiche ; l'enquête et
 * la soirée du chef sont des hypothèses nommées dans la fiche.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les écarts entre le perçu et l'attendu sont des grandeurs, au
 * centième (à 0,05 près, avant) ; le taux de clients satisfaits est à deux décimales
 * (monde/experience-du-bistrot.ts).
 */

export const ENTREPRISES_DE_L_EXPERIENCE = ["bistrot"] as const;


function leBistrot(): TableauDeDonnees {
  const f = LA_TABLE_D_AUGUSTIN;
  return {
    titre: "Le bistrot, de janvier à mars",
    colonnes: ["Couverts demandés"],
    lignes: f.clienteles.map((k) => ({ libelle: k.nom, valeurs: [qte(k.demande[0])] })),
  };
}

function lEnquete(): TableauDeDonnees {
  const s = satisfactionDuBistrot();
  return {
    titre: `L'enquête de satisfaction, ${qte(s.repondants)} clients (notes sur 10)`,
    colonnes: ["Attendu", "Perçu"],
    lignes: s.criteres.map((k) => ({ libelle: k.libelle, valeurs: [nombreAuCentieme(k.attendu), nombreAuCentieme(k.percu)] })),
  };
}

const rapidite = () => satisfactionDuBistrot().criteres.find((k) => k.code === "rapidite")!;
const cuisine = () => satisfactionDuBistrot().criteres.find((k) => k.code === "cuisine")!;

export const L_EXPERIENCE_CLIENT: Chapitre = {
  code: "l-experience-client",
  parcours: "stmg",
  palier: 1,
  blocs: ["STMG Thème 1 · La définition de l'offre"],
  titre: "L'expérience client et la valeur perçue",
  accroche:
    "Un client ne paie pas qu'une assiette : il paie un moment. Ce qu'il en attendait, ce qu'il en a perçu, et ce qu'une soirée à vivre doit rapporter pour valoir la peine.",
  objectifs: [
    "Définir la valeur perçue et la satisfaction",
    "Mesurer la satisfaction à partir d'une enquête",
    "Reconnaître les dimensions d'une expérience de consommation",
    "Chiffrer ce qu'une offre expérientielle doit rapporter",
    "Dire quand l'expérience compte, et laquelle",
  ],
  libre: false,
  ensuite: ["influence-communaute-et-e-reputation"],
  entreprises: {
    codes: ENTREPRISES_DE_L_EXPERIENCE,
    pourquoi: "ce chapitre lit les clientèles et les couverts de LA TABLE D'AUGUSTIN, et l'enquête menée auprès de ses clients.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Plus qu'une assiette",
      notions: ["average_basket"],
      tableau: leBistrot,
      texte: (c) => {
        const f = LA_TABLE_D_AUGUSTIN;
        return [
          `${c.entreprise} sert au plus ${qte(f.couvertsParJour)} couverts par jour, pour un ticket moyen de ${eur(f.prixDeLAnnee)} hors taxes. Ses clients ne viennent pas tous pour la même chose : un déjeuner d'affaires, un dîner entre voisins, un banquet d'entreprise.`,
          "Tous paient un repas ; chacun en garde une impression différente. C'est cette impression qui le fera revenir, ou non.",
        ];
      },
      repere: () => "La valeur perçue : ce que le client pense recevoir (le goût, l'accueil, le moment), rapporté à ce qu'il donne (le prix, mais aussi son temps et son effort).",
    },
    {
      id: "la-valeur-percue",
      objectifs: [0],
      type: "choix",
      titre: "Ce que le client pense recevoir",
      notions: ["brand_capital"],
      question: () => "Un client du midi trouve le plat excellent, mais attend longtemps entre deux plats et repart en retard. Que devient la valeur qu'il perçoit ?",
      options: () => [
        { texte: "Elle baisse : il a donné du temps", juste: true, retour: "Oui : la valeur perçue compare ce que le client reçoit à tout ce qu'il donne. Le prix n'a pas changé, mais il a perdu du temps : la valeur qu'il perçoit baisse, malgré un bon plat." },
        { texte: "Elle ne change pas : le prix est le même", juste: false, retour: "Non : le prix n'est qu'une part de ce que le client donne. Son temps et son effort comptent aussi." },
        { texte: "Elle monte : le plat était excellent", juste: false, retour: "Non : le plat compte, mais l'attente pèse de l'autre côté. Un bon plat servi trop lentement déçoit un client pressé." },
      ],
    },
    {
      id: "les-ecarts",
      objectifs: [0, 1],
      type: "montants",
      titre: "Ce qu'il attendait, ce qu'il a perçu",
      notions: ["brand_capital"],
      tableau: lEnquete,
      question: () => "La satisfaction se mesure comme l'écart entre ce que le client a perçu et ce qu'il attendait. Calculez l'écart (perçu moins attendu) pour la rapidité du service, puis pour la cuisine.",
      champs: () => {
        const r = rapidite();
        const k = cuisine();
        return [
          { libelle: "Écart sur la rapidité du service", nature: "grandeur", attendu: r.ecart, calcul: `${nombreAuCentieme(r.percu)} − ${nombreAuCentieme(r.attendu)} = ${nombreAuCentieme(r.ecart)}` },
          { libelle: "Écart sur la cuisine", nature: "grandeur", attendu: k.ecart, calcul: `${nombreAuCentieme(k.percu)} − ${nombreAuCentieme(k.attendu)} = ${nombreAuCentieme(k.ecart)}` },
        ];
      },
      explication: () => {
        const r = rapidite();
        const k = cuisine();
        return [`Un écart positif, c'est une attente dépassée : la cuisine fait mieux que prévu (${nombreAuCentieme(k.ecart)}). Un écart négatif, c'est une déception : la rapidité du service reste en retard de ${nombreAuCentieme(-r.ecart)} point${-r.ecart >= 2 ? "s" : ""}.`];
      },
    },
    {
      id: "ou-nait-l-insatisfaction",
      objectifs: [0],
      type: "choix",
      titre: "D'où vient la déception",
      notions: ["brand_capital"],
      tableau: lEnquete,
      question: () => "Sur quel critère le bistrot doit-il agir d'abord pour ses clients ?",
      options: () => {
        const s = satisfactionDuBistrot();
        return [
          { texte: s.pire.libelle, juste: true, retour: `Oui : c'est le plus grand écart négatif, ${nombreAuCentieme(s.pire.ecart)}. Les clients en attendaient beaucoup, et en ont perçu bien moins.` },
          { texte: "Le cadre, moins bien noté que la cuisine", juste: false, retour: "Non : le cadre est moins bien noté, mais les clients n'en attendaient pas plus : l'écart est positif. Une note basse n'est pas une déception si l'attente était basse." },
          { texte: s.meilleur.libelle, juste: false, retour: `Non : c'est le point fort du bistrot, ${nombreAuCentieme(s.meilleur.ecart)} au-dessus de l'attente. On le garde, on ne le corrige pas.` },
        ];
      },
    },
    {
      id: "le-taux-de-satisfaits",
      objectifs: [1],
      type: "montants",
      titre: "Combien de clients satisfaits",
      notions: ["brand_capital"],
      question: () => {
        const s = satisfactionDuBistrot();
        return `Sur les ${qte(s.repondants)} clients qui ont répondu, ${qte(s.satisfaits)} se disent satisfaits de leur repas. Calculez le taux de clients satisfaits, en pourcentage.`;
      },
      champs: () => {
        const s = satisfactionDuBistrot();
        return [{ libelle: "Taux de clients satisfaits (%)", attendu: s.tauxDeSatisfaits, calcul: `${qte(s.satisfaits)} ÷ ${qte(s.repondants)} × 100 = ${pct(s.tauxDeSatisfaits)}` }];
      },
      explication: () => {
        const s = satisfactionDuBistrot();
        return [`${pct(s.tauxDeSatisfaits)} des clients sont satisfaits : un bon score, mais ${qte(s.repondants - s.satisfaits)} clients sur ${qte(s.repondants)} ne le sont pas. Un client déçu revient rarement, et il le dit.`];
      },
    },
    {
      id: "le-marketing-experientiel",
      objectifs: [2],
      type: "choix",
      titre: "Faire vivre un moment",
      notions: ["brand_capital"],
      question: (c) => `Le chef de ${c.entreprise} propose « les jeudis du chef » : un dîner en cuisine ouverte, où il présente ses plats, avec un musicien. Qu'est-ce que le marketing expérientiel ?`,
      options: () => [
        { texte: "Faire vivre au client un moment dont il se souvient", juste: true, retour: "Oui : le marketing expérientiel ne vend pas seulement un produit, il fait vivre une expérience qui touche les sens et les émotions, et que le client a envie de raconter." },
        { texte: "Baisser le prix pour attirer de nouveaux clients", juste: false, retour: "Non : c'est une promotion. L'expérience, au contraire, permet souvent de vendre plus cher." },
        { texte: "Interroger les clients sur leur satisfaction après le repas", juste: false, retour: "Non : c'est mesurer la satisfaction. Le marketing expérientiel agit avant et pendant le repas, sur ce que le client vit." },
      ],
    },
    {
      id: "les-dimensions",
      objectifs: [2],
      type: "tri",
      titre: "Les dimensions d'une expérience",
      notions: ["brand_capital"],
      question: () => "Rangez chaque moment de la soirée du chef sous la dimension de l'expérience qu'il fait vivre.",
      categories: [
        { code: "sensorielle", libelle: "Sensorielle : les sens" },
        { code: "affective", libelle: "Affective : l'émotion" },
        { code: "sociale", libelle: "Sociale : le lien avec les autres" },
      ],
      elements: () => MOMENTS_DE_LA_SOIREE.map((x) => ({ libelle: x.libelle, montant: 0, categorie: x.dimension, pourquoi: x.pourquoi })),
      relance: "Ce moment passe-t-il par un sens, par une émotion, ou par les autres convives ?",
      explication: () => ["Une expérience réussie joue sur plusieurs dimensions à la fois : ce que l'on voit et entend, ce que l'on ressent, et ce que l'on partage. C'est elle que le client raconte ensuite."],
    },
    {
      id: "la-marge-de-la-soiree",
      objectifs: [3],
      type: "montants",
      titre: "Ce que laisse la soirée",
      notions: ["contribution_margin"],
      question: () => {
        const f = LA_TABLE_D_AUGUSTIN;
        const s = SOIREE_DU_CHEF;
        return `Le couvert de la soirée se vend ${eur(s.prix)} hors taxes ; ses denrées coûtent ${eur(s.denrees)}, plus ${eur(f.autresCoutsParCouvert)} d'autres coûts variables. Un jeudi soir ordinaire, la salle sert ${qte(s.dinersDUnJeudiOrdinaire)} dîners à ${eur(f.prixDeLAnnee)}, qui laissent chacun ${eur(margeDUnCouvert())}. Calculez la marge d'un couvert de la soirée, puis la marge d'un jeudi soir ordinaire, que la soirée remplace.`;
      },
      champs: () => {
        const f = LA_TABLE_D_AUGUSTIN;
        const s = SOIREE_DU_CHEF;
        return [
          { libelle: "Marge d'un couvert de la soirée", attendu: margeDUnCouvertDeLaSoiree(), calcul: `${eur(s.prix)} − ${eur(s.denrees)} − ${eur(f.autresCoutsParCouvert)} = ${eur(margeDUnCouvertDeLaSoiree())}` },
          { libelle: "Marge d'un jeudi soir ordinaire", attendu: margeDUnSoirOrdinaire(s.dinersDUnJeudiOrdinaire), calcul: `${qte(s.dinersDUnJeudiOrdinaire)} × ${eur(margeDUnCouvert())} = ${eur(margeDUnSoirOrdinaire(s.dinersDUnJeudiOrdinaire))}` },
        ];
      },
      explication: () => [
        `Un couvert de la soirée laisse ${eur(margeDUnCouvertDeLaSoiree())}, contre ${eur(margeDUnCouvert())} pour un couvert ordinaire : le client paie l'expérience. Mais la soirée remplace un jeudi qui rapportait déjà ${eur(margeDUnSoirOrdinaire(SOIREE_DU_CHEF.dinersDUnJeudiOrdinaire))}, et le musicien se paie en plus.`,
      ],
    },
    {
      id: "les-couverts-qui-paient",
      objectifs: [3],
      type: "curseur",
      titre: "Combien de couverts pour la soirée",
      notions: ["contribution_margin", "breakeven"],
      question: () =>
        `Faites varier le nombre de couverts de la soirée : une droite donne la marge qu'ils laissent, l'autre ce que la soirée doit couvrir, l'animation (${eur(SOIREE_DU_CHEF.animation)}) et la marge du jeudi ordinaire qu'elle remplace. Placez le curseur sur le plus petit nombre de couverts qui suffit, puis validez.`,
      grandeur: () => ({ libelle: "Couverts de la soirée", unite: "couverts" }),
      cible: () => ({ attendu: couvertsQuiPaient(), max: couvertsDeLaSalle() }),
      zones: ["La soirée rapporte plus qu'un jeudi ordinaire", "La soirée rapporte moins"],
      rates: () => ({
        dessous: "Avec si peu de couverts, la soirée rapporte moins qu'un jeudi ordinaire, animation payée.",
        dessus: "La soirée paie, mais avec moins de couverts aussi : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer le nombre",
      lecture: (_c, q) => {
        const k = soireeDuChef(q);
        return [
          { libelle: "Marge des couverts de la soirée", montant: k.marge },
          { libelle: "Animation et jeudi ordinaire à couvrir", montant: k.aCouvrir },
          { libelle: "Ce que la soirée rapporte de plus", montant: k.gain, fort: true },
        ];
      },
      droites: () => ({
        produit: (q) => soireeDuChef(q).marge,
        cout: (q) => soireeDuChef(q).aCouvrir,
        libelles: ["Marge des couverts de la soirée", "Ce que la soirée doit couvrir"],
      }),
      explication: () => {
        const n = couvertsQuiPaient();
        return [
          `À ${qte(n)} couverts, la soirée rapporte ${eur(soireeDuChef(n).gain)} de plus qu'un jeudi ordinaire. La salle en sert ${qte(couvertsDeLaSalle())} : il faut assez de clients prêts à payer ${eur(SOIREE_DU_CHEF.prix)}.`,
          "Une expérience se vend plus cher, mais elle se prépare et se paie : elle vaut la peine quand assez de clients la demandent.",
        ];
      },
    },
    {
      id: "toute-consommation",
      objectifs: [4],
      type: "choix",
      titre: "Toute consommation crée-t-elle de l'expérience ?",
      notions: ["segmentation"],
      question: (c) => `La question du programme : toute consommation crée-t-elle de l'expérience ? ${c.entreprise} doit-elle transformer aussi ses déjeuners d'affaires en spectacle ?`,
      options: () => {
        const r = rapidite();
        return [
          { texte: "Non : au midi, on attend la rapidité", juste: true, retour: `Oui : tout repas laisse une expérience, mais le client d'affaires veut d'abord être servi vite et bien. C'est justement là que le bistrot déçoit (${nombreAuCentieme(r.ecart)} sur la rapidité) : son expérience du midi passe par un service plus rapide, pas par un musicien.` },
          { texte: "Oui : chaque client veut vivre un moment à part", juste: false, retour: "Non : un spectacle au déjeuner retarderait un client qui a peu de temps. L'expérience dépend de ce que chaque clientèle attend." },
          { texte: "Non : l'expérience ne compte que pour les banquets", juste: false, retour: "Non : tout client vit une expérience, même pressé. Elle n'est simplement pas la même pour tous." },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["brand_capital", "segmentation"],
      texte: (c) => [
        `La satisfaction compare ce que le client attendait à ce qu'il a perçu : chez ${c.entreprise}, la cuisine dépasse l'attente, la rapidité la déçoit. Le marketing expérientiel ajoute un moment à vivre, qui se vend plus cher et se paie aussi.`,
        "Toute consommation laisse une expérience, mais chaque clientèle attend la sienne. Dans l'arène, regardez à chaque tour la demande que vous ne servez pas : un client refusé, c'est une expérience ratée.",
      ],
      repere: () => "Satisfaction = perçu − attendu. Une offre expérientielle vaut la peine quand ses couverts rapportent plus que l'animation et que ce qu'elle remplace.",
    },
  ],
};
