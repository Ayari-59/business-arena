import { aLUnite, eur, nombreAuCentieme } from "../../../pedagogy/cours/deux-decimales";
import {
  ANNEE_DE_LA_SANTE,
  COUT_D_UN_JOUR_D_ABSENCE,
  ENTREPRISES_DE_LA_SANTE,
  HEURES_TRAVAILLEES,
  VISSEUSE,
  indicateursDeSecurite,
  joursQuiPaientUneVisseuse,
  valeurDesJoursEvites,
} from "../monde/sante-et-securite-de-nova";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : SANTÉ ET SÉCURITÉ AU TRAVAIL, ACCIDENTS, TMS ET RISQUES PSYCHOSOCIAUX (Bac STMG, enseignement
 * spécifique de ressources humaines et communication de terminale, thème 2, question 2.2 : « La santé et
 * la sécurité au travail sont-elles des atouts pour l'organisation ? »).
 *
 * L'accident du travail, l'accident de trajet et la maladie professionnelle ; le cadre juridique
 * (l'obligation de sécurité de l'employeur, les principes de prévention, le document unique, le droit de
 * retrait) ; les troubles musculosquelettiques et les risques psychosociaux, dont le harcèlement ; les
 * indicateurs sociaux de la sécurité (taux de fréquence et de gravité), chiffrés et lus ; la prévention
 * primaire, secondaire et tertiaire, chiffrée au curseur ; la protection sociale et la complémentaire
 * santé. « Les indicateurs sociaux » chiffre l'absentéisme de NOVA.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA : monde/sante-et-securite-de-nova.ts.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les taux de fréquence et de gravité sont des grandeurs, au
 * centième (le taux de fréquence au dixième, avant ; monde/sante-et-securite-de-nova.ts).
 */


const qte = nombreAuCentieme;
export const SANTE_ET_SECURITE_AU_TRAVAIL: Chapitre = {
  code: "sante-et-securite-au-travail",
  parcours: "stmg-rh",
  palier: 1,
  blocs: ["STMG Thème 2 · Des facteurs de motivation et de satisfaction : qualité de vie au travail et rémunération"],
  titre: "Santé et sécurité au travail : accidents, TMS, risques psychosociaux",
  accroche:
    "Une coupure à la main, une tendinite au poste de vissage : une année de la ligne de montage, ce que la loi impose à l'employeur, ce que disent les indicateurs, et ce que la prévention rapporte.",
  objectifs: [
    "Distinguer accident du travail, accident de trajet et maladie professionnelle",
    "Reconnaître les risques professionnels, dont les risques psychosociaux",
    "Calculer et lire le taux de fréquence et le taux de gravité",
    "Choisir et chiffrer une action de prévention",
    "Situer la protection sociale du salarié",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_SANTE,
    pourquoi: "ce chapitre suit la santé et la sécurité des opérateurs de la ligne de NOVA.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une année sur la ligne",
      texte: (c) => {
        const a = ANNEE_DE_LA_SANTE;
        return [
          `En N + 1, sur la ligne de ${c.entreprise}, un opérateur s'est coupé la main en ouvrant un carton de composants : ${qte(a.joursDArretDesAccidents)} jours d'arrêt. Un autre a eu une tendinite du poignet au poste de vissage, reconnue comme maladie professionnelle : ${qte(a.joursDArretDeLaMaladie)} jours d'arrêt.`,
          "La santé au travail est d'abord une obligation : protéger les personnes. Elle est aussi un enjeu de performance : chaque arrêt désorganise l'équipe et coûte.",
        ];
      },
      repere: () => "Santé et sécurité : une obligation de l'employeur, et une condition de la performance.",
    },
    {
      id: "at-trajet-ou-mp",
      objectifs: [0],
      type: "tri",
      titre: "Accident ou maladie ?",
      question: () => "Rangez chaque événement.",
      categories: [
        { code: "at", libelle: "Accident du travail" },
        { code: "trajet", libelle: "Accident de trajet" },
        { code: "mp", libelle: "Maladie professionnelle" },
      ],
      elements: () => [
        { libelle: "Une coupure en ouvrant un carton, au poste", montant: 0, categorie: "at", pourquoi: "Un événement soudain, par le fait du travail : un accident du travail." },
        { libelle: "Une chute dans l'escalier de l'atelier, pendant la pause", montant: 0, categorie: "at", pourquoi: "Il survient à l'occasion du travail, sur le lieu et le temps de travail : un accident du travail." },
        { libelle: "Une glissade sur le verglas, en venant à l'atelier le matin", montant: 0, categorie: "trajet", pourquoi: "Entre le domicile et le lieu de travail : un accident de trajet." },
        { libelle: "Une tendinite après des mois de vissage, inscrite à un tableau de maladies", montant: 0, categorie: "mp", pourquoi: "Une atteinte lente, due à une exposition répétée : une maladie professionnelle." },
      ],
      relance: "Est-ce soudain ou lent ? Au travail, ou sur le chemin du travail ?",
      explication: () => ["Tous les trois sont pris en charge par la branche « accidents du travail et maladies professionnelles » de la Sécurité sociale, que les employeurs financent par leurs cotisations. L'employeur déclare l'accident du travail dans les 48 heures."],
    },
    {
      id: "le-cadre",
      type: "lecture",
      titre: "Ce que la loi impose",
      texte: () => [
        "Le Code du travail fait peser sur l'employeur une obligation de sécurité : il prend les mesures pour protéger la santé physique et mentale des salariés. Il suit des principes de prévention : éviter les risques, évaluer ceux qui ne peuvent pas l'être, les combattre à la source, adapter le travail à l'homme, préférer la protection collective à la protection individuelle.",
        "Il transcrit l'évaluation des risques dans un document unique, dès le premier salarié, et le tient à jour. Le salarié veille aussi à sa sécurité et à celle des autres ; face à un danger grave et imminent, il peut se retirer de son poste (le droit de retrait).",
      ],
      repere: () => "Obligation de sécurité · principes de prévention · document unique d'évaluation des risques · droit de retrait.",
    },
    {
      id: "les-risques",
      objectifs: [1],
      type: "tri",
      titre: "Les risques professionnels",
      question: () => "Rangez chaque situation de la ligne.",
      categories: [
        { code: "tms", libelle: "Troubles musculosquelettiques" },
        { code: "rps", libelle: "Risques psychosociaux" },
        { code: "accident", libelle: "Risque d'accident" },
      ],
      elements: () => [
        { libelle: "Visser la même vis des centaines de fois par jour, le poignet tordu", montant: 0, categorie: "tms", pourquoi: "Un geste répété dans une mauvaise posture : le risque de TMS." },
        { libelle: "Des cadences qui montent sans explication, et la peur de ne pas suivre", montant: 0, categorie: "rps", pourquoi: "Le stress d'une charge de travail subie : un risque psychosocial." },
        { libelle: "Les remarques humiliantes, répétées, d'un collègue", montant: 0, categorie: "rps", pourquoi: "Des agissements répétés qui dégradent les conditions de travail : un risque psychosocial, peut-être du harcèlement." },
        { libelle: "Un cutter sans protection pour ouvrir les cartons", montant: 0, categorie: "accident", pourquoi: "Un outil dangereux : le risque d'un accident soudain." },
      ],
      relance: "Le risque abîme-t-il le corps lentement, le moral et la santé mentale, ou peut-il blesser d'un coup ?",
      explication: () => ["Les troubles musculosquelettiques sont les premières maladies professionnelles reconnues en France. Les risques psychosociaux (stress, violences, harcèlement, épuisement) relèvent de la même obligation de sécurité que les machines."],
    },
    {
      id: "le-harcelement",
      objectifs: [1],
      type: "choix",
      titre: "Le harcèlement",
      question: (c) => `Un opérateur de ${c.entreprise} se plaint des remarques humiliantes et répétées d'un collègue. Que doit faire le président ?`,
      options: () => [
        {
          texte: "Faire cesser les agissements, et sanctionner leur auteur si les faits sont établis",
          juste: true,
          retour: "Oui : des agissements répétés qui dégradent les conditions de travail, portent atteinte à la dignité ou à la santé, c'est le harcèlement moral, interdit. L'employeur doit le prévenir et le faire cesser ; il peut sanctionner son auteur.",
        },
        {
          texte: "Rien : c'est une affaire entre deux collègues, qui ne regarde pas l'entreprise ni son président",
          juste: false,
          retour: "Non : l'obligation de sécurité couvre la santé mentale. Laisser faire engage la responsabilité de l'employeur.",
        },
        {
          texte: "Changer de poste celui qui se plaint, pour éviter les histoires",
          juste: false,
          retour: "Non : on ne sanctionne pas la victime. Un salarié qui dénonce un harcèlement est protégé par la loi.",
        },
      ],
    },
    {
      id: "les-taux",
      objectifs: [2],
      type: "montants",
      titre: "Le taux de fréquence et le taux de gravité",
      question: () => {
        const a = ANNEE_DE_LA_SANTE;
        return `Les opérateurs ont travaillé ${qte(HEURES_TRAVAILLEES)} heures dans l'année. L'année compte ${qte(a.accidentsAvecArret)} accident du travail avec arrêt, et ${qte(a.joursDArretDesAccidents)} journées perdues par cet accident. Calculez le taux de fréquence (accidents × 1 000 000 ÷ heures, au dixième) et le taux de gravité (journées perdues × 1 000 ÷ heures, au centième).`;
      },
      champs: () => {
        const k = indicateursDeSecurite();
        const a = ANNEE_DE_LA_SANTE;
        return [
          { libelle: "Taux de fréquence", nature: "grandeur", attendu: k.frequence, calcul: `${qte(a.accidentsAvecArret)} × 1 000 000 ÷ ${qte(k.heures)} = ${nombreAuCentieme(k.frequence)}` },
          { libelle: "Taux de gravité", nature: "grandeur", attendu: k.gravite, calcul: `${qte(a.joursDArretDesAccidents)} × 1 000 ÷ ${qte(k.heures)} = ${nombreAuCentieme(k.gravite)}` },
        ];
      },
      explication: () => {
        const k = indicateursDeSecurite();
        return [`Le taux de fréquence vaut ${qte(k.frequence)} : à ce rythme, ${qte(aLUnite(k.frequence))} accidents pour un million d'heures. Le taux de gravité dit ${qte(k.gravite)} journée perdue pour mille heures. La maladie professionnelle se suit à part.`];
      },
    },
    {
      id: "lire-les-taux",
      objectifs: [2],
      type: "choix",
      titre: "Un taux à lire avec prudence",
      question: () => `Le taux de fréquence de NOVA, ${qte(indicateursDeSecurite().frequence)}, est bien plus haut que celui de son secteur. Qu'en conclure ?`,
      options: () => [
        {
          texte: "Sur si peu d'heures, un seul accident pèse lourd",
          juste: true,
          retour: "Oui : une petite équipe travaille peu d'heures, et chaque accident fait bondir le taux. Il faut suivre le taux sur plusieurs années, et surtout analyser chaque accident pour en supprimer la cause.",
        },
        {
          texte: "NOVA est l'atelier le plus dangereux de son secteur, il faut arrêter la ligne",
          juste: false,
          retour: "Non : un indicateur calculé sur un seul accident ne permet pas de comparer. Il alerte, il ne juge pas.",
        },
        {
          texte: "Rien : un taux de fréquence ne sert qu'aux grandes entreprises, il ne veut rien dire chez NOVA",
          juste: false,
          retour: "Non : il se suit partout, mais se lit avec le nombre d'heures qui le fonde.",
        },
      ],
    },
    {
      id: "prevenir",
      objectifs: [3],
      type: "tri",
      titre: "Trois niveaux de prévention",
      question: () => "Rangez chaque action contre la tendinite du poste de vissage.",
      categories: [
        { code: "primaire", libelle: "Prévention primaire" },
        { code: "secondaire", libelle: "Prévention secondaire" },
        { code: "tertiaire", libelle: "Prévention tertiaire" },
      ],
      elements: () => [
        { libelle: "Une visseuse suspendue, qui supprime l'effort du poignet", montant: 0, categorie: "primaire", pourquoi: "Le risque est supprimé à la source : la prévention primaire." },
        { libelle: "La rotation des postes chaque heure", montant: 0, categorie: "primaire", pourquoi: "Le geste répété disparaît de l'organisation : primaire aussi." },
        { libelle: "Une formation aux gestes et des visites au médecin du travail pour repérer les douleurs tôt", montant: 0, categorie: "secondaire", pourquoi: "On limite les effets d'un risque qui demeure : la prévention secondaire." },
        { libelle: "Un poste aménagé pour le retour de l'opérateur soigné", montant: 0, categorie: "tertiaire", pourquoi: "On répare et on évite la rechute : la prévention tertiaire." },
      ],
      relance: "Supprime-t-on le risque, en limite-t-on les effets, ou répare-t-on après l'atteinte ?",
      explication: () => ["La loi demande de combattre le risque à la source : la prévention primaire vient d'abord, et la protection collective avant la protection individuelle."],
    },
    {
      id: "le-curseur-de-la-visseuse",
      objectifs: [3],
      type: "curseur",
      titre: "Ce qu'une visseuse doit éviter",
      question: () => `Une visseuse ergonomique coûte ${eur(VISSEUSE.prix)} par poste. Un jour d'arrêt coûte ${eur(COUT_D_UN_JOUR_D_ABSENCE)} à l'équipe : heures supplémentaires de ceux qui remplacent, production ralentie. Faites varier les jours d'arrêt évités dans l'année : une droite donne ce qu'ils valent, l'autre le prix de la visseuse. Placez le curseur sur le premier nombre de jours qui la paie.`,
      cible: () => ({ attendu: joursQuiPaientUneVisseuse(), max: 24 }),
      grandeur: () => ({ libelle: "Jours d'arrêt évités dans l'année", unite: "jours" }),
      rates: () => ({ dessous: "Pas encore : la visseuse coûte plus que les arrêts évités.", dessus: "La visseuse est payée, mais un jour de moins suffisait-il déjà ?" }),
      zones: ["Prévention payée", "Prévention non payée"],
      montrer: "Montrer le nombre de jours",
      lecture: (_c, n) => [
        { libelle: "Ce que valent les jours évités", montant: valeurDesJoursEvites(n), fort: true },
        { libelle: "Prix de la visseuse", montant: VISSEUSE.prix },
      ],
      droites: () => ({ produit: (n) => n * COUT_D_UN_JOUR_D_ABSENCE, cout: () => VISSEUSE.prix, libelles: ["Jours évités", "Prix de la visseuse"] }),
      explication: () => {
        const n = joursQuiPaientUneVisseuse();
        return [`Il suffit d'éviter ${qte(n)} jours d'arrêt dans l'année pour payer la visseuse ; la tendinite en a coûté ${qte(ANNEE_DE_LA_SANTE.joursDArretDeLaMaladie)}. Et la douleur d'un salarié ne se chiffre pas : la prévention se justifie même quand elle ne se paie pas.`];
      },
    },
    {
      id: "la-protection-sociale",
      type: "lecture",
      titre: "La protection sociale",
      texte: () => [
        "Pendant un arrêt, le salarié reçoit des indemnités journalières de la Sécurité sociale, que l'employeur complète souvent. La branche des accidents du travail et des maladies professionnelles prend en charge les soins et les indemnités de ces arrêts.",
        "Depuis 2016, tout employeur du secteur privé doit proposer à ses salariés une complémentaire santé collective, qui rembourse ce que la Sécurité sociale ne prend pas en charge, et en payer au moins la moitié. La prévoyance couvre, elle, l'invalidité et le décès.",
      ],
      repere: () => "Sécurité sociale, indemnités journalières · branche AT et MP · complémentaire santé, la moitié au moins payée par l'employeur · prévoyance.",
    },
    {
      id: "la-mutuelle",
      objectifs: [4],
      type: "choix",
      titre: "La complémentaire santé",
      question: (c) => `Un nouvel opérateur demande si ${c.entreprise} doit lui proposer une complémentaire santé. Que lui répondez-vous ?`,
      options: () => [
        {
          texte: "Oui, et NOVA en paie au moins la moitié",
          juste: true,
          retour: "Oui : la complémentaire santé collective est obligatoire dans toutes les entreprises du secteur privé, quelle que soit leur taille, et l'employeur en finance la moitié au moins.",
        },
        {
          texte: "Non : seules les entreprises de 50 salariés ou plus y sont tenues",
          juste: false,
          retour: "Non : l'obligation vaut dès le premier salarié.",
        },
        {
          texte: "Oui, mais il la paie entièrement, l'employeur ne fait que la choisir pour l'équipe",
          juste: false,
          retour: "Non : l'employeur doit en payer au moins la moitié.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const k = indicateursDeSecurite();
        return [
          `${c.entreprise} a eu un accident du travail et une maladie professionnelle en N + 1 : un taux de fréquence de ${qte(k.frequence)} et un taux de gravité de ${qte(k.gravite)}, à lire avec le petit nombre d'heures. L'employeur doit évaluer et combattre les risques, physiques et psychosociaux, à la source. Une visseuse se paie dès ${qte(joursQuiPaientUneVisseuse())} jours d'arrêt évités : la santé et la sécurité sont des atouts, pas seulement des obligations.`,
          "Dans l'arène, une équipe absente produit moins : la santé de l'équipe se lit aussi dans la capacité de chaque tour.",
        ];
      },
      repere: () => "Accident du travail, de trajet, maladie professionnelle · obligation de sécurité · document unique · TMS et risques psychosociaux · taux de fréquence et de gravité · prévention · complémentaire santé.",
    },
  ],
};
