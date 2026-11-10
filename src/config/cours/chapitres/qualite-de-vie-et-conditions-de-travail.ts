import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import {
  COUT_D_UNE_HEURE_SUPPLEMENTAIRE,
  COUT_HORAIRE_DE_LA_TABLE,
  DROIT_DU_TEMPS,
  ENTREPRISES_DES_CONDITIONS_DE_TRAVAIL,
  SEMAINE_DE_SARAH,
  heuresOuTempsPartiel,
  repriseAuPlusTot,
  semaineDeSarah,
  seuilDuTempsPartiel,
} from "../monde/conditions-de-travail-de-la-table";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : QUALITÉ DE VIE ET CONDITIONS DE TRAVAIL, HORAIRES, DURÉE ET MOTIVATION (Bac STMG,
 * enseignement spécifique de ressources humaines et communication de terminale, thème 2, question 2.1 :
 * « Le mieux-vivre au travail est-il compatible avec la performance ? »).
 *
 * Les facteurs de motivation et de satisfaction (facteurs d'hygiène et facteurs moteurs), la qualité de vie
 * et des conditions de travail (QVCT, le nom que lui donnent l'accord national de 2020 et la loi du 2 août
 * 2021) et la responsabilité sociale, la performance sociale, l'ergonomie, la durée du travail et le repos
 * (la règle du Code du travail), chiffrés : la semaine en heures supplémentaires, et le seuil où un temps
 * partiel coûte moins (le curseur). « Fédérer les acteurs » (partie commune, 2.1) chiffre des actions de
 * qualité de vie chez NOVA.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez LA TABLE D'AUGUSTIN : monde/conditions-de-travail-de-la-table.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR")} %`;
const heure = (h: number) => `${Math.floor(h)} h ${String(Math.round((h % 1) * 60)).padStart(2, "0")}`;

export const QUALITE_DE_VIE_ET_CONDITIONS_DE_TRAVAIL: Chapitre = {
  code: "qualite-de-vie-et-conditions-de-travail",
  parcours: "stmg-rh",
  palier: 1,
  blocs: ["STMG Thème 2 · Des facteurs de motivation et de satisfaction : qualité de vie au travail et rémunération"],
  titre: "Qualité de vie et conditions de travail : horaires, durée, motivation",
  accroche:
    "Un bistrot perd ses serveurs, épuisés par le service coupé. Ce qui motive, ce qui use, ce que la loi fixe sur le temps de travail, et ce que coûtent les heures supplémentaires face à une embauche.",
  objectifs: [
    "Distinguer facteurs d'hygiène et facteurs de motivation",
    "Reconnaître les leviers de la qualité de vie et des conditions de travail",
    "Appliquer les règles de durée du travail et de repos",
    "Chiffrer les heures supplémentaires face à une embauche",
    "Relier qualité de vie au travail et performance",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_CONDITIONS_DE_TRAVAIL,
    pourquoi: "ce chapitre suit les horaires et les conditions de travail de l'équipe de LA TABLE D'AUGUSTIN.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le service coupé",
      texte: (c) => [
        `À ${c.entreprise}, les serveurs travaillent souvent en service coupé : le midi, puis le soir, avec une longue pause l'après-midi. Sarah fait ${qte(SEMAINE_DE_SARAH.heures)} heures par semaine, de 10 h à 15 h et de 18 h 30 à 23 h 30. Plusieurs serveurs sont partis cette année.`,
        "Le patron se demande si le mieux-vivre au travail est un luxe, ou une condition de la performance du bistrot.",
      ],
      repere: () => "Conditions de travail : horaires, durée, poste, ambiance. Elles agissent sur la satisfaction et sur la performance.",
    },
    {
      id: "hygiene-ou-motivation",
      objectifs: [0],
      type: "tri",
      titre: "Ce qui satisfait, ce qui motive",
      question: () => "Le psychologue Frederick Herzberg distingue les facteurs d'hygiène, qui créent l'insatisfaction quand ils manquent, et les facteurs de motivation, qui donnent envie de s'investir. Rangez chaque élément.",
      categories: [
        { code: "hygiene", libelle: "Facteur d'hygiène" },
        { code: "motivation", libelle: "Facteur de motivation" },
      ],
      elements: () => [
        { libelle: "Un salaire versé à l'heure, au bon montant", montant: 0, categorie: "hygiene", pourquoi: "Son absence fâche, sa présence ne suffit pas à motiver : un facteur d'hygiène." },
        { libelle: "Des horaires connus à l'avance", montant: 0, categorie: "hygiene", pourquoi: "Une condition de travail : elle évite l'insatisfaction." },
        { libelle: "Le chef qui félicite Sarah devant l'équipe après un banquet réussi", montant: 0, categorie: "motivation", pourquoi: "La reconnaissance : un facteur de motivation." },
        { libelle: "La responsabilité de la terrasse, confiée à Sarah cet été", montant: 0, categorie: "motivation", pourquoi: "Une responsabilité, un travail plus riche : un facteur de motivation." },
      ],
      relance: "S'il manque, crée-t-il surtout du mécontentement ? Ou donne-t-il envie d'en faire plus ?",
      explication: () => ["Bien payer et bien organiser évite le mécontentement ; reconnaître et confier des responsabilités fait s'investir. Il faut les deux."],
    },
    {
      id: "la-qvct",
      type: "lecture",
      titre: "Qualité de vie et des conditions de travail",
      texte: () => [
        "La qualité de vie au travail est devenue, par l'accord national de 2020 et la loi du 2 août 2021, la qualité de vie et des conditions de travail (QVCT). Elle tient à l'organisation du travail, au contenu des tâches, à l'ergonomie des postes, au temps de travail, aux relations dans l'équipe, à la possibilité de s'exprimer.",
        "Elle relève de la responsabilité sociale de l'organisation, et se lit dans sa performance sociale : la rotation du personnel, l'absentéisme, les accidents, la satisfaction des salariés.",
      ],
      repere: () => "QVCT : organisation, contenu du travail, ergonomie, temps, relations, expression · performance sociale.",
    },
    {
      id: "les-leviers",
      objectifs: [1],
      type: "tri",
      titre: "Les leviers du mieux-vivre",
      question: (c) => `Rangez chaque action que ${c.entreprise} pourrait mener.`,
      categories: [
        { code: "ergonomie", libelle: "Ergonomie du poste" },
        { code: "temps", libelle: "Temps et horaires" },
        { code: "expression", libelle: "Expression et relations" },
      ],
      elements: () => [
        { libelle: "Des plateaux plus légers et un chariot pour débarrasser", montant: 0, categorie: "ergonomie", pourquoi: "Adapter le matériel au corps : l'ergonomie." },
        { libelle: "Le planning affiché 3 semaines à l'avance", montant: 0, categorie: "temps", pourquoi: "Prévoir sa vie hors du travail : le temps et les horaires." },
        { libelle: "Deux serveurs en service continu, de 15 h à minuit", montant: 0, categorie: "temps", pourquoi: "Supprimer la coupure : une autre organisation du temps." },
        { libelle: "Une réunion d'équipe chaque mois, où chacun propose une amélioration", montant: 0, categorie: "expression", pourquoi: "Donner la parole aux salariés : l'expression et les relations." },
      ],
      relance: "L'action change-t-elle le matériel, l'organisation du temps, ou la place laissée à la parole de l'équipe ?",
      explication: () => ["Ergonomie, temps et expression se complètent : une seule action ne fait pas une politique de qualité de vie au travail."],
    },
    {
      id: "le-temps-de-travail",
      type: "lecture",
      titre: "Ce que la loi fixe sur le temps de travail",
      texte: () => {
        const d = DROIT_DU_TEMPS;
        return [
          `Le Code du travail fixe la durée légale à ${qte(d.dureeLegale)} heures par semaine. Au-delà, ce sont des heures supplémentaires, majorées de ${pct(d.majoration)} pour les 8 premières de la semaine et de 50 % ensuite, sauf accord qui fixe un autre taux, d'au moins 10 %. Dans la restauration, la convention de la branche a les siens ; le cours suit ici le taux du Code.`,
          `Le salarié a droit à ${qte(d.reposQuotidien)} heures de repos consécutives entre deux journées, et à une pause de 20 minutes dès 6 heures de travail. Il ne travaille pas plus de ${qte(d.maximumParJour)} heures par jour ni plus de ${qte(d.maximumParSemaine)} heures dans une semaine, sauf dérogation.`,
        ];
      },
      repere: () => "35 heures · heures supplémentaires majorées · 11 heures de repos entre deux journées · au plus 10 heures par jour, 48 par semaine.",
    },
    {
      id: "le-repos",
      objectifs: [2],
      type: "choix",
      titre: "Le repos entre deux journées",
      question: () => `Sarah finit son service à ${heure(SEMAINE_DE_SARAH.finDuSoir)}. À quelle heure peut-elle reprendre le lendemain, au plus tôt ?`,
      options: () => [
        { texte: heure(repriseAuPlusTot()), juste: true, retour: `Oui : ${heure(SEMAINE_DE_SARAH.finDuSoir)} plus ${qte(DROIT_DU_TEMPS.reposQuotidien)} heures de repos consécutives mènent à ${heure(repriseAuPlusTot())}. L'ouverture de 10 h ne lui est donc pas permise ce jour-là.` },
        { texte: "10 h 00, l'heure habituelle de l'ouverture", juste: false, retour: `Non : il ne lui resterait que ${qte(24 - SEMAINE_DE_SARAH.finDuSoir + 10)} heures de repos, sous le minimum légal.` },
        { texte: "8 h 00 : il suffit de 8 heures de sommeil", juste: false, retour: "Non : le repos quotidien n'est pas le sommeil. La loi fixe 11 heures consécutives entre deux journées de travail." },
      ],
    },
    {
      id: "la-journee-de-banquet",
      objectifs: [2],
      type: "choix",
      titre: "Un soir de banquet",
      question: () => "Un samedi de banquet, le patron voudrait que Sarah travaille 11 heures dans la journée. Le peut-il ?",
      options: () => [
        {
          texte: "Non, pas sans dérogation : la limite est de 10 heures",
          juste: true,
          retour: "Oui : la durée quotidienne est de 10 heures au plus. Un accord collectif, ou une autorisation de l'inspection du travail, peut la porter plus haut, jusqu'à 12 heures, pour un surcroît d'activité.",
        },
        {
          texte: "Oui, s'il paie les heures en plus comme des heures supplémentaires majorées",
          juste: false,
          retour: "Non : la majoration paie les heures supplémentaires, elle n'autorise pas à dépasser les durées maximales.",
        },
        {
          texte: "Oui, si Sarah est d'accord",
          juste: false,
          retour: "Non : les durées maximales protègent la santé ; l'accord de la salariée ne suffit pas à les écarter.",
        },
      ],
    },
    {
      id: "la-semaine-de-sarah",
      objectifs: [2],
      type: "montants",
      titre: "Une semaine de 39 heures",
      question: () => `Sarah a travaillé ${qte(SEMAINE_DE_SARAH.heures)} heures cette semaine. Une heure coûte au bistrot ${eur(COUT_HORAIRE_DE_LA_TABLE)}, charges comprises. Calculez ses heures supplémentaires, les heures payées (une heure supplémentaire compte ${(1 + DROIT_DU_TEMPS.majoration).toLocaleString("fr-FR")} heure), et le coût de la semaine.`,
      champs: () => {
        const k = semaineDeSarah();
        const d = DROIT_DU_TEMPS;
        return [
          { libelle: "Heures supplémentaires", attendu: k.supplementaires, calcul: `${qte(SEMAINE_DE_SARAH.heures)} − ${qte(d.dureeLegale)} = ${qte(k.supplementaires)}` },
          { libelle: "Heures payées", attendu: k.payees, calcul: `${qte(d.dureeLegale)} + ${qte(k.supplementaires)} × ${(1 + d.majoration).toLocaleString("fr-FR")} = ${qte(k.payees)}` },
          { libelle: "Coût de la semaine", attendu: k.cout, calcul: `${qte(k.payees)} × ${eur(COUT_HORAIRE_DE_LA_TABLE)} = ${eur(k.cout)}` },
        ];
      },
      explication: () => [`Les ${qte(semaineDeSarah().supplementaires)} heures supplémentaires coûtent comme ${qte(semaineDeSarah().payees - DROIT_DU_TEMPS.dureeLegale)} heures normales : faire durer les journées se paie, en argent et en fatigue.`],
    },
    {
      id: "le-curseur-du-temps-partiel",
      objectifs: [3],
      type: "curseur",
      titre: "Heures supplémentaires ou temps partiel",
      question: () => {
        const d = DROIT_DU_TEMPS;
        return `Une heure supplémentaire coûte ${eur(COUT_D_UNE_HEURE_SUPPLEMENTAIRE)}. Un serveur à temps partiel coûte ${eur(COUT_HORAIRE_DE_LA_TABLE)} l'heure, mais la loi fixe un temps partiel à ${qte(d.tempsPartielMinimal)} heures par semaine au moins, sauf exceptions. Faites varier les heures supplémentaires de l'équipe dans la semaine : une droite donne leur coût, l'autre celui du temps partiel. Placez le curseur sur le premier nombre d'heures où embaucher coûte moins, ou autant.`;
      },
      cible: () => ({ attendu: seuilDuTempsPartiel(), max: DROIT_DU_TEMPS.tempsPartielMinimal }),
      grandeur: () => ({ libelle: "Heures supplémentaires de l'équipe par semaine", unite: "heures" }),
      rates: () => ({ dessous: "Pas encore : les heures supplémentaires coûtent moins qu'un temps partiel.", dessus: "Le temps partiel coûte moins, mais une heure de moins suffisait-elle déjà ?" }),
      zones: ["Embaucher coûte moins", "Les heures supplémentaires coûtent moins"],
      montrer: "Montrer le seuil",
      lecture: (_c, n) => {
        const k = heuresOuTempsPartiel(n);
        return [
          { libelle: "Coût des heures supplémentaires", montant: k.supplementaires, fort: true },
          { libelle: "Coût du temps partiel", montant: k.tempsPartiel },
        ];
      },
      droites: () => ({ produit: (n) => n * COUT_D_UNE_HEURE_SUPPLEMENTAIRE, cout: () => DROIT_DU_TEMPS.tempsPartielMinimal * COUT_HORAIRE_DE_LA_TABLE, libelles: ["Heures supplémentaires", "Temps partiel"] }),
      explication: () => {
        const n = seuilDuTempsPartiel();
        return [`Dès ${qte(n)} heures supplémentaires par semaine, un serveur à temps partiel coûte moins : ${eur(heuresOuTempsPartiel(n).tempsPartiel)} contre ${eur(heuresOuTempsPartiel(n).supplementaires)}. Il soulage aussi l'équipe, et permet d'en finir avec certains services coupés.`];
      },
    },
    {
      id: "compatible",
      objectifs: [4],
      type: "choix",
      titre: "Mieux vivre au travail, et performer ?",
      question: () => "Le mieux-vivre au travail est-il compatible avec la performance du bistrot ?",
      options: () => [
        {
          texte: "Oui, s'il est pensé avec l'organisation du travail",
          juste: true,
          retour: "Oui : moins de départs, moins d'absences, un service plus attentif. Mais une action de qualité de vie coûte : elle se décide en mesurant ce qu'elle change, et avec l'équipe, sans promettre ce que l'activité ne peut pas payer.",
        },
        {
          texte: "Non : chaque euro dépensé pour l'équipe est un euro de résultat en moins, sans retour possible",
          juste: false,
          retour: "Non : un départ, une absence, un client mal servi coûtent aussi. La qualité de vie au travail est une source de performance sociale, et souvent économique.",
        },
        {
          texte: "Toujours, quelles que soient la dépense et l'activité",
          juste: false,
          retour: "Non : une action qui coûte plus qu'elle ne rapporte peut se justifier par la santé de l'équipe, mais elle ne se paie pas toute seule.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => [
        `${c.entreprise} use ses serveurs en service coupé. Les facteurs d'hygiène évitent l'insatisfaction, les facteurs de motivation font s'investir. La loi fixe la durée du travail et le repos : Sarah ne reprend pas avant ${heure(repriseAuPlusTot())} après un service fini à ${heure(SEMAINE_DE_SARAH.finDuSoir)}. Dès ${qte(seuilDuTempsPartiel())} heures supplémentaires par semaine, embaucher à temps partiel coûte moins.`,
        "Dans l'arène, les salaires et la formation se décident à chaque tour : une équipe mal traitée finit par partir, et son départ se paie.",
      ],
      repere: () => "Facteurs d'hygiène et de motivation · QVCT · ergonomie · durée légale, heures supplémentaires, repos, durées maximales · performance sociale.",
    },
  ],
};
