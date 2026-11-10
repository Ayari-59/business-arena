import { eur, pct, qte } from "../../../pedagogy/cours/deux-decimales";
import { ENTREPRISES_DES_MODES_DE_VIE, LOCATION, louerOuVendre, teletravail } from "../monde/modes-de-vie";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LES MODES DE VIE CHANGENT, TRAVAIL ET CONSOMMATION (Bac STMG, management, sciences de
 * gestion et numérique de terminale, enseignement commun, thème 3, question 3.2 : « Les changements de
 * modes de vie s'imposent-ils aux organisations ? »).
 *
 * Le rapport au travail (son temps, son lieu, son organisation : le télétravail chiffré, le travail
 * indépendant, le rapport à la hiérarchie, l'équilibre entre vie privée et vie professionnelle, le droit
 * à la déconnexion), puis les modes de consommation (plateformes d'intermédiation, consommation à la
 * demande, économie de la fonctionnalité, économie collaborative et du partage, consommation responsable,
 * mouvement locavore, anticonsumérisme), et au curseur : à partir de combien de locations louer la Studio
 * rapporte plus que la vendre.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA : monde/modes-de-vie.ts.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les jours de télétravail et les kilomètres évités sont des
 * quantités ; les montants au centime.
 */


export const LES_MODES_DE_VIE_CHANGENT: Chapitre = {
  code: "les-modes-de-vie-changent",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 3 · Les organisations et la société"],
  titre: "Les modes de vie changent : travail et consommation",
  accroche:
    "Travailler de chez soi une partie de la semaine, ne plus répondre aux messages le soir, louer une enceinte pour une fête au lieu de l'acheter : la société change, et l'organisation doit suivre.",
  objectifs: [
    "Repérer ce qui change dans le rapport au travail",
    "Chiffrer un effet du télétravail",
    "Reconnaître les nouveaux modes de consommation",
    "Comparer la vente et la location d'un produit",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_MODES_DE_VIE,
    pourquoi: "ce chapitre suit l'équipe de NOVA et la Studio de sa gamme.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "La société change, l'organisation aussi",
      texte: (c) => [
        `Les salariés de ${c.entreprise} ne travaillent plus tout à fait comme leurs parents : ils veulent du temps pour leur vie privée, travaillent parfois de chez eux, attendent un chef qui explique plutôt qu'un chef qui ordonne. Ses clients non plus ne consomment plus pareil : ils louent, revendent, achètent près de chez eux.`,
        "Ces tendances viennent des évolutions des rapports sociaux et du numérique. Elles transforment l'organisation et son management : elle doit les prendre en compte, ou les subir.",
      ],
      repere: () => "Modes de vie : le rapport au travail (temps, lieu, organisation) et les modes de consommation.",
    },
    {
      id: "le-rapport-au-travail",
      objectifs: [0],
      type: "tri",
      titre: "Ce qui change dans le travail",
      question: () => "Rangez chaque changement selon ce qu'il touche.",
      categories: [
        { code: "temps", libelle: "Le temps de travail" },
        { code: "lieu", libelle: "Le lieu de travail" },
        { code: "organisation", libelle: "L'organisation et la hiérarchie" },
      ],
      elements: () => [
        { libelle: "L'assistante demande à finir plus tôt le mercredi, quitte à commencer plus tôt", montant: 0, categorie: "temps", pourquoi: "Des horaires qui s'adaptent à la vie privée." },
        { libelle: "Le commercial travaille de chez lui 2 jours par semaine", montant: 0, categorie: "lieu", pourquoi: "Le télétravail change le lieu de travail." },
        { libelle: "La graphiste du pack travaille pour NOVA en indépendante, depuis une autre ville", montant: 0, categorie: "lieu", pourquoi: "Un travail à distance, et une autre forme de relation : le travail indépendant." },
        { libelle: "Les opérateurs attendent qu'on leur explique les décisions, pas seulement qu'on les leur annonce", montant: 0, categorie: "organisation", pourquoi: "Le rapport à la hiérarchie change." },
      ],
      relance: "Le changement touche-t-il les horaires, l'endroit où l'on travaille, ou la façon dont on est dirigé ?",
      explication: () => ["L'équilibre entre vie privée et vie professionnelle devient une attente forte : une organisation qui n'y répond pas a plus de mal à recruter et à garder ses salariés."],
    },
    {
      id: "le-teletravail",
      objectifs: [1],
      type: "montants",
      titre: "Le télétravail, chiffré",
      question: () => {
        const t = teletravail();
        return `L'assistante de gestion et le commercial (${qte(t.salaries)} salariés) travaillent chez eux ${qte(t.joursParSemaine)} jours par semaine, ${qte(t.semaines)} semaines par an. Chacun fait ${qte(t.kmAllerRetour)} km aller et retour quand il vient à l'atelier. Calculez les jours de télétravail de l'année pour les deux, puis les kilomètres évités.`;
      },
      champs: () => {
        const t = teletravail();
        return [
          { libelle: "Jours de télétravail dans l'année", nature: "quantite", attendu: t.jours, calcul: `${qte(t.salaries)} × ${qte(t.joursParSemaine)} × ${qte(t.semaines)} = ${qte(t.jours)}` },
          { libelle: "Kilomètres évités", nature: "quantite", attendu: t.km, calcul: `${qte(t.jours)} × ${qte(t.kmAllerRetour)} = ${qte(t.km)}` },
        ];
      },
      explication: () => {
        const t = teletravail();
        return [`${qte(t.km)} km de moins : du temps et de l'argent pour les salariés, moins de pollution pour le territoire. Pour NOVA, il faut organiser le travail à distance : des outils partagés, des objectifs clairs, des moments ensemble.`];
      },
    },
    {
      id: "la-deconnexion",
      objectifs: [0],
      type: "choix",
      titre: "Le droit à la déconnexion",
      question: () => "Le président envoie souvent des messages au commercial le soir et le week-end, et attend une réponse rapide. Qu'en dire ?",
      options: () => [
        {
          texte: "Il doit fixer des règles : chacun a droit à la déconnexion",
          juste: true,
          retour: "Oui : la loi reconnaît un droit à la déconnexion, que l'entreprise organise (des horaires où l'on n'écrit pas, des messages programmés). L'hyperconnectivité use les salariés, et finit par coûter en fatigue et en départs.",
        },
        {
          texte: "Rien : avec le télétravail, il n'y a plus d'horaires",
          juste: false,
          retour: "Non : travailler chez soi ne supprime ni la durée du travail ni le repos. C'est même un risque de plus de se laisser envahir.",
        },
        {
          texte: "Le commercial n'a qu'à éteindre son téléphone et ne plus répondre du tout",
          juste: false,
          retour: "Non : ce serait reporter le problème sur le salarié seul. C'est à l'entreprise d'organiser la déconnexion.",
        },
      ],
    },
    {
      id: "consommer-autrement",
      type: "lecture",
      titre: "Consommer autrement",
      texte: () => [
        "Les consommateurs changent aussi. Des plateformes d'intermédiation les mettent en relation pour louer, revendre ou partager ; ils consomment à la demande ; ils achètent l'usage d'un bien plutôt que le bien (l'économie de la fonctionnalité).",
        "D'autres choisissent une consommation responsable : réparer, acheter d'occasion ou près de chez eux (le mouvement locavore), voire consommer moins (l'anticonsumérisme). Les organisations y répondent par leurs offres.",
      ],
      repere: () => "Économie de la fonctionnalité : vendre l'usage plutôt que le produit. Économie collaborative : des particuliers qui partagent, louent ou revendent entre eux.",
    },
    {
      id: "les-modes-de-consommation",
      objectifs: [2],
      type: "tri",
      titre: "Les nouveaux modes de consommation",
      question: () => "Rangez chaque comportement de client.",
      categories: [
        { code: "fonctionnalite", libelle: "Acheter l'usage plutôt que le bien" },
        { code: "collaborative", libelle: "Économie collaborative et du partage" },
        { code: "responsable", libelle: "Consommation responsable" },
      ],
      elements: () => [
        { libelle: "Un club loue une sono pour un tournoi, au lieu de l'acheter", montant: 0, categorie: "fonctionnalite", pourquoi: "Il paie l'usage, le temps du tournoi." },
        { libelle: "Une école paie un abonnement qui comprend les enceintes, leur entretien et leur remplacement", montant: 0, categorie: "fonctionnalite", pourquoi: "Une offre produit et service : l'économie de la fonctionnalité." },
        { libelle: "Deux voisins se prêtent une enceinte par une application de quartier", montant: 0, categorie: "collaborative", pourquoi: "Des particuliers qui partagent un bien : l'économie du partage." },
        { libelle: "Un client revend son ancienne enceinte sur un site d'occasion", montant: 0, categorie: "collaborative", pourquoi: "Une plateforme entre particuliers : l'économie collaborative." },
        { libelle: "Une cliente fait réparer son enceinte plutôt que d'en racheter une", montant: 0, categorie: "responsable", pourquoi: "Faire durer le produit : la consommation responsable." },
      ],
      relance: "Le client paie-t-il un usage, partage-t-il avec d'autres particuliers, ou cherche-t-il à moins consommer ?",
      explication: () => ["Pour NOVA, ces modes sont une menace (moins de ventes neuves) et une chance : réparer, louer, reprendre sont autant d'offres nouvelles."],
    },
    {
      id: "le-curseur-de-la-location",
      objectifs: [3],
      type: "curseur",
      titre: "Louer plutôt que vendre",
      question: () => {
        const l = louerOuVendre();
        return `Vendue, une Studio laisse ${eur(l.margeDeLaVente)} de marge. Louée ${eur(LOCATION.prixDuWeekEnd)} le week-end sur une plateforme qui garde ${pct(LOCATION.commission * 100)}, avec ${eur(LOCATION.coutParLocation)} de frais par location, elle laisse ${eur(l.parLocation)} à chaque fois ; mais elle a coûté ${eur(l.coutVariable)} à fabriquer et ne se vend plus. Faites varier le nombre de locations : une droite donne ce qu'elles laissent, l'autre ce que la vente aurait rapporté, fabrication comprise (${eur(l.aBattre)}). Placez le curseur sur le plus petit nombre de locations qui fait mieux que la vente.`;
      },
      cible: () => ({ attendu: louerOuVendre().seuil, max: 30 }),
      grandeur: () => ({ libelle: "Locations de la Studio", unite: "locations" }),
      rates: () => ({ dessous: "Pas encore : la vente rapporterait plus.", dessus: "La location fait mieux, mais une location de moins suffirait-elle ?" }),
      zones: ["La location fait mieux", "La vente fait mieux"],
      montrer: "Montrer le nombre",
      lecture: (_c, n) => {
        const l = louerOuVendre(n);
        return [
          { libelle: "Ce que laissent les locations", montant: l.recettesNettes },
          { libelle: "Ce que la vente rapporterait, fabrication comprise", montant: l.aBattre },
          { libelle: "Ce que laissent les locations après la fabrication", montant: l.apresLaFabrication, fort: true },
        ];
      },
      droites: () => {
        const l = louerOuVendre();
        return { produit: (n) => n * l.parLocation, cout: () => l.aBattre, libelles: ["Locations", "Vente"] };
      },
      explication: () => {
        const l = louerOuVendre();
        return [`Il faut ${qte(l.seuil)} locations : ${qte(l.seuil - 1)} laisseraient ${eur((l.seuil - 1) * l.parLocation)}, moins que les ${eur(l.aBattre)} de la vente. Louer rapporte plus, mais plus tard, et seulement si la Studio est demandée assez souvent et dure assez longtemps.`];
      },
    },
    {
      id: "louer-ou-pas",
      objectifs: [3],
      type: "choix",
      titre: "Ce que dit le curseur",
      question: () => "NOVA doit-elle louer toute sa gamme, plutôt que la vendre ?",
      options: () => {
        const l = louerOuVendre();
        return [
          {
            texte: "Non : louer en plus de vendre, si la demande suit",
            juste: true,
            retour: `Oui : la location ne fait mieux qu'au-delà de ${qte(l.seuil)} locations par Studio, et l'argent rentre plus lentement. C'est une offre de plus pour les clients qui veulent l'usage, à côté de la vente.`,
          },
          {
            texte: "Oui : louer rapporte toujours plus que vendre, puisque l'enceinte sert plusieurs fois",
            juste: false,
            retour: `Non : en dessous de ${qte(l.seuil)} locations, la vente rapporte plus, et chaque location a ses frais.`,
          },
          {
            texte: "Non : la location ne concerne que les voitures et les logements",
            juste: false,
            retour: "Non : l'économie de la fonctionnalité touche aussi les objets du quotidien, enceintes comprises.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const t = teletravail();
        const l = louerOuVendre();
        return [
          `Les changements de modes de vie s'imposent à ${c.entreprise} : le télétravail de ${qte(t.jours)} jours par an épargne ${qte(t.km)} km, la déconnexion s'organise, et la location d'une Studio fait mieux que sa vente au-delà de ${qte(l.seuil)} locations.`,
          "Dans l'arène, la demande de chaque tour change avec la saison et le marché : les entreprises qui s'adaptent gardent leurs clients.",
        ];
      },
      repere: () => "Rapport au travail : temps, lieu, organisation, déconnexion. Consommation : plateformes, fonctionnalité, partage, responsable, locavore, anticonsumérisme.",
    },
  ],
};
