import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import {
  ENTREPRISES_DE_LA_FONCTION_SI,
  INFOGERANCE,
  MARS,
  MATERIEL,
  TECHNICIEN_A_MI_TEMPS,
  budgetDuSi,
  infogeranceDe,
  postesOuLInfogeranceCouteMoins,
  tableauDeBordDeMars,
} from "../monde/fonction-si-de-nova";
import { PGI_EN_NUAGE } from "../monde/processus-de-commande";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LA FONCTION SYSTÈME D'INFORMATION, MÉTIERS, INFOGÉRANCE, VEILLE ET BUDGET (Bac STMG,
 * enseignement spécifique de systèmes d'information de gestion de terminale, thème 2, question 2.1 :
 * « Comment la fonction SI accompagne-t-elle les choix de l'organisation ? »).
 *
 * Les métiers et les nouveaux métiers du système d'information, la gestion des compétences ;
 * l'externalisation et l'infogérance, leurs raisons et leurs limites, chiffrées au curseur face à un
 * technicien salarié ; la veille technologique ; le budget du système d'information, à compléter ; le
 * tableau de bord opérationnel, ses indicateurs et ses critères ; l'alignement des choix technologiques
 * sur la stratégie. « Ce que coûte et rapporte un outil numérique » chiffre un outil, et « Une donnée
 * fausse » la qualité des données.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA : monde/fonction-si-de-nova.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR").replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const heures = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} heures`;

function budgetACompleter(): TableauACompleter {
  const b = budgetDuSi();
  return {
    titre: "Le budget du système d'information de NOVA, pour l'année",
    colonnes: ["Montant de l'année"],
    lignes: [
      { libelle: "Ordinateurs (la part de l'année)", cellules: [{ valeur: b.materiel, saisir: true, calcul: `${qte(b.postes)} × ${eur(MATERIEL.prixDUnPoste)} ÷ ${qte(MATERIEL.duree)} ans = ${eur(b.materiel)}`, indice: "Le prix des postes, réparti sur les années où ils servent." }] },
      { libelle: "PGI en nuage", cellules: [{ valeur: b.pgi, saisir: true, calcul: `${eur(PGI_EN_NUAGE.parPosteEtParMois)} × ${qte(PGI_EN_NUAGE.postes)} postes × 12 mois = ${eur(b.pgi)}`, indice: "Le prix par poste et par mois, pour les postes abonnés, sur 12 mois." }] },
      { libelle: "Infogérance", cellules: [{ valeur: b.infogerance, saisir: true, calcul: `${eur(INFOGERANCE.parPosteEtParMois)} × ${qte(b.postes)} postes × 12 mois = ${eur(b.infogerance)}`, indice: "Le prix par poste et par mois, pour tous les postes, sur 12 mois." }] },
      { libelle: "Hébergement, sauvegarde et reprise du site", cellules: [{ valeur: b.hebergement }] },
      { libelle: "Formation", cellules: [{ valeur: b.formation }] },
      { libelle: "Total du budget", fort: true, totalDe: { plus: [0, 1, 2, 3, 4] }, cellules: [{ valeur: b.total, saisir: true, calcul: `La somme des lignes : ${eur(b.total)}` }] },
    ],
  };
}

export const LA_FONCTION_SYSTEME_D_INFORMATION: Chapitre = {
  code: "la-fonction-systeme-d-information",
  parcours: "stmg-sig",
  palier: 1,
  blocs: ["STMG Thème 2 · Management du système d'information et performance"],
  titre: "La fonction système d'information : métiers, infogérance, veille et budget",
  accroche:
    "Chez NOVA, le président s'occupe de l'informatique le soir. Faut-il un technicien, ou un prestataire ? Les métiers du système d'information, l'infogérance, la veille, le budget et le tableau de bord qui juge le service.",
  objectifs: [
    "Identifier les métiers et les compétences du système d'information",
    "Comparer une prestation internalisée et une prestation externalisée",
    "Construire le budget du système d'information",
    "Organiser une veille technologique",
    "Calculer et interpréter les indicateurs d'un tableau de bord opérationnel",
    "Aligner un choix technologique sur la stratégie",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_FONCTION_SI, pourquoi: "ce chapitre organise la gestion du système d'information de NOVA." },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Qui s'occupe de l'informatique ?",
      texte: (c) => [
        `${c.entreprise} a ${qte(budgetDuSi().postes)} postes, un site, un PGI en nuage. Aujourd'hui, le président installe lui-même les mises à jour, le soir, et répare quand un poste tombe en panne. Le jour où il manque, plus personne ne sait faire.`,
        "Dans une organisation, le système d'information est une fonction qui se gère : des activités, des métiers, des choix de faire soi-même ou de confier à d'autres, un budget, et des indicateurs pour juger le service rendu.",
      ],
      repere: () => "La fonction système d'information : des métiers, des choix d'organisation, un budget, un tableau de bord.",
    },
    {
      id: "les-metiers",
      objectifs: [0],
      type: "tri",
      titre: "Les métiers du système d'information",
      question: () => "Rangez chaque activité selon le métier qui l'exerce.",
      categories: [
        { code: "technicien", libelle: "Technicien d'assistance" },
        { code: "developpeur", libelle: "Développeur" },
        { code: "securite", libelle: "Responsable de la sécurité" },
        { code: "donnees", libelle: "Scientifique des données" },
        { code: "dpo", libelle: "Délégué à la protection des données" },
      ],
      elements: () => [
        { libelle: "Installer un poste et répondre aux appels des utilisateurs", montant: 0, categorie: "technicien", pourquoi: "L'assistance au quotidien : le technicien." },
        { libelle: "Écrire le code d'une application de suivi des colis", montant: 0, categorie: "developpeur", pourquoi: "Concevoir et programmer : le développeur." },
        { libelle: "Définir les règles d'accès et suivre les alertes d'intrusion", montant: 0, categorie: "securite", pourquoi: "Protéger le système : le responsable de la sécurité." },
        { libelle: "Exploiter l'historique des ventes pour prévoir Noël", montant: 0, categorie: "donnees", pourquoi: "Tirer de la valeur des données : le scientifique des données, un métier nouveau." },
        { libelle: "Veiller au respect du règlement sur les données personnelles", montant: 0, categorie: "dpo", pourquoi: "Le délégué à la protection des données conseille et contrôle." },
      ],
      relance: "L'activité aide-t-elle les utilisateurs, crée-t-elle une application, protège-t-elle le système, exploite-t-elle les données, ou veille-t-elle à la loi ?",
      explication: () => ["De nouveaux métiers naissent avec les données : le directeur des données, le scientifique des données. Les compétences qu'une organisation réunit disent ce qu'elle peut faire de ses données."],
    },
    {
      id: "les-competences",
      objectifs: [0],
      type: "choix",
      titre: "Les compétences de NOVA",
      question: (c) => `Le président voudrait exploiter l'historique des ventes pour mieux prévoir. ${c.entreprise} doit-elle embaucher un scientifique des données ?`,
      options: () => [
        { texte: "Non, pas à plein temps : une mission ponctuelle suffit", juste: true, retour: "Oui : une petite entreprise n'a pas de quoi occuper ce métier toute l'année. Elle achète la compétence le temps d'une mission, et forme un salarié à lire les résultats." },
        { texte: "Oui, à plein temps : toute entreprise doit avoir chaque métier du système d'information", juste: false, retour: "Non : chaque organisation choisit les compétences qu'elle garde et celles qu'elle achète, selon sa taille et ses besoins." },
        { texte: "Non, car les données ne servent à rien", juste: false, retour: "Non : l'historique des ventes a de la valeur, encore faut-il savoir l'exploiter." },
      ],
    },
    {
      id: "externaliser",
      type: "lecture",
      titre: "Faire soi-même, ou confier à d'autres",
      texte: () => [
        "Une organisation peut garder une activité du système d'information en interne, avec ses salariés, ou la confier à un prestataire : c'est l'externalisation. L'infogérance confie à un prestataire la gestion de tout ou partie du système : les postes, le réseau, les serveurs.",
        "Ses raisons : un service rendu plus vite, par des spécialistes, à un coût connu. Ses limites : la qualité à garantir, des coûts qui dérivent hors contrat, un savoir-faire qui se perd, et un contrôle plus difficile. Le contrat fixe donc des engagements de service, mesurés.",
      ],
      repere: () => "Externaliser : la rapidité, des spécialistes, un coût connu · mais la qualité, la dérive des coûts, la perte de savoir-faire, le contrôle.",
    },
    {
      id: "raisons-et-limites",
      objectifs: [1],
      type: "tri",
      titre: "Ses raisons, ses limites",
      question: () => "Rangez chaque effet de l'infogérance.",
      categories: [
        { code: "raison", libelle: "Une raison d'externaliser" },
        { code: "limite", libelle: "Une limite de l'externalisation" },
      ],
      elements: () => [
        { libelle: "Un spécialiste répond dans l'heure, même en août", montant: 0, categorie: "raison", pourquoi: "Un service rapide, par des spécialistes." },
        { libelle: "Un prix par poste connu d'avance", montant: 0, categorie: "raison", pourquoi: "Un coût prévisible." },
        { libelle: "Plus personne chez NOVA ne sait remettre un poste en marche", montant: 0, categorie: "limite", pourquoi: "La perte de savoir-faire." },
        { libelle: "Chaque intervention hors contrat est facturée en plus", montant: 0, categorie: "limite", pourquoi: "La dérive des coûts." },
        { libelle: "NOVA dépend d'un seul prestataire pour ses mots de passe", montant: 0, categorie: "limite", pourquoi: "La perte de contrôle." },
      ],
      relance: "L'effet aide-t-il NOVA, ou la rend-il dépendante ?",
      explication: () => ["Une organisation garde en interne ce qui fait sa différence et le contrôle de son système ; elle peut confier le reste."],
    },
    {
      id: "le-curseur-de-l-infogerance",
      objectifs: [1],
      type: "curseur",
      titre: "Jusqu'à combien de postes ?",
      question: () =>
        `L'infogérance coûte ${eur(INFOGERANCE.parPosteEtParMois)} par poste et par mois ; un technicien à mi-temps, salarié de NOVA, coûterait ${eur(TECHNICIEN_A_MI_TEMPS.parMois)} par mois, charges comprises. Faites varier le nombre de postes. Placez le curseur sur le plus grand nombre de postes où l'infogérance ne coûte pas plus que le technicien.`,
      cible: () => ({ attendu: postesOuLInfogeranceCouteMoins(), max: 40, min: 1 }),
      sens: "plus-grande",
      grandeur: () => ({ libelle: "Postes informatiques", unite: "postes" }),
      rates: () => ({ dessous: "L'infogérance coûte encore moins : peut-on aller plus loin ?", dessus: "Trop loin : l'infogérance coûte plus que le technicien." }),
      zones: ["L'infogérance coûte moins", "Le technicien coûte moins"],
      montrer: "Montrer le nombre de postes",
      lecture: (_c, n) => [
        { libelle: "Infogérance du mois", montant: infogeranceDe(n), fort: true },
        { libelle: "Technicien à mi-temps", montant: TECHNICIEN_A_MI_TEMPS.parMois },
      ],
      droites: () => ({ produit: () => TECHNICIEN_A_MI_TEMPS.parMois, cout: (n) => infogeranceDe(n), libelles: ["Technicien", "Infogérance"] }),
      explication: () => [`Jusqu'à ${qte(postesOuLInfogeranceCouteMoins())} postes, l'infogérance coûte moins qu'un technicien à mi-temps. NOVA en a ${qte(budgetDuSi().postes)} : le prestataire lui coûte ${eur(infogeranceDe(budgetDuSi().postes))} par mois.`],
    },
    {
      id: "decider-l-externalisation",
      objectifs: [1],
      type: "choix",
      titre: "Ce que NOVA décide",
      question: (c) => `${c.entreprise} confie ses postes au prestataire. Que doit-elle garder pour elle ?`,
      options: () => [
        { texte: "Les mots de passe d'administration, et la mesure du service", juste: true, retour: "Oui : NOVA garde la maîtrise de son système. Elle mesure chaque mois ce que le contrat promet, et peut changer de prestataire." },
        { texte: "Rien : le prestataire s'occupe de tout, il n'y a plus rien à suivre", juste: false, retour: "Non : sans contrôle, ni la qualité ni les coûts ne sont tenus." },
        { texte: "Un technicien à plein temps, en plus du prestataire", juste: false, retour: "Non : ce serait payer 2 fois le même service." },
      ],
    },
    {
      id: "le-budget",
      objectifs: [2],
      type: "a-completer",
      titre: "Le budget du système d'information",
      question: () => "Complétez le budget de l'année : la part des ordinateurs (leur prix réparti sur leurs années de service), l'abonnement au PGI, l'infogérance de tous les postes, puis le total.",
      grille: () => budgetACompleter(),
      explication: () => {
        const b = budgetDuSi();
        return [`Le système d'information coûte ${eur(b.total)} par an à NOVA. L'infogérance en est la plus grosse ligne : un budget se lit d'abord par ses postes les plus lourds.`];
      },
    },
    {
      id: "par-poste",
      objectifs: [2],
      type: "montants",
      titre: "Le coût d'un poste",
      question: () => "Rapportez le budget au nombre de postes : combien coûte un poste de travail par an, tout compris ?",
      champs: () => {
        const b = budgetDuSi();
        return [{ libelle: "Coût d'un poste par an", attendu: b.parPoste, calcul: `${eur(b.total)} ÷ ${qte(b.postes)} = ${eur(b.parPoste)}` }];
      },
      explication: () => [`Un poste coûte ${eur(budgetDuSi().parPoste)} par an. Le chiffre se compare d'une année à l'autre, ou à d'autres entreprises : c'est un indicateur du budget.`],
    },
    {
      id: "la-veille",
      type: "lecture",
      titre: "La veille technologique",
      texte: () => [
        "La veille technologique surveille les évolutions des outils, des usages et des menaces, pour saisir à temps ce qui peut servir l'organisation, et éviter ce qui la mettrait en danger.",
        "Elle s'organise : des sources choisies (sites spécialisés, alertes de sécurité, salons, éditeurs), un temps réservé, une personne qui trie, et un partage de ce qui compte avec ceux qui décident.",
      ],
      repere: () => "Veille : surveiller, trier, partager · des sources fiables · un temps et une personne.",
    },
    {
      id: "organiser-la-veille",
      objectifs: [3],
      type: "choix",
      titre: "Une veille qui sert",
      question: (c) => `Comment ${c.entreprise} peut-elle organiser sa veille technologique ?`,
      options: () => [
        { texte: "Choisir quelques sources sûres et en faire le point chaque mois", juste: true, retour: "Oui : des sources fiables, un rythme, et une décision au bout. Les alertes de sécurité en font partie : une faille connue se corrige vite." },
        { texte: "Lire tout ce qui paraît sur le numérique, chacun de son côté, sans en parler", juste: false, retour: "Non : sans tri ni partage, la veille ne mène à aucune décision." },
        { texte: "Acheter chaque nouvel outil dès sa sortie", juste: false, retour: "Non : la veille éclaire le choix, elle ne remplace pas la décision." },
      ],
    },
    {
      id: "le-tableau-de-bord",
      objectifs: [4],
      type: "montants",
      titre: "Le tableau de bord du service",
      question: () =>
        `En mars (${qte(MARS.jours)} jours de 24 heures), le site a été arrêté ${heures(MARS.heuresDArret)}. Le prestataire a traité ${qte(MARS.incidents)} incidents, en ${qte(MARS.heuresDeResolution)} heures au total, dont ${qte(MARS.resolusEnMoinsDe4Heures)} en moins de 4 heures. Calculez le taux de disponibilité du site (en %, au dixième), le délai moyen de résolution (en heures, au dixième), et la part des incidents résolus en moins de 4 heures (en %, au dixième).`,
      champs: () => {
        const k = tableauDeBordDeMars();
        return [
          { libelle: "Taux de disponibilité (%)", attendu: k.disponibilitePct, tolerance: 0.1, calcul: `(${qte(k.heures)} − ${qte(MARS.heuresDArret)}) ÷ ${qte(k.heures)} × 100 = ${pct(k.disponibilitePct)}` },
          { libelle: "Délai moyen de résolution (heures)", attendu: k.delaiMoyen, tolerance: 0.1, calcul: `${qte(MARS.heuresDeResolution)} ÷ ${qte(MARS.incidents)} = ${heures(k.delaiMoyen)}` },
          { libelle: "Incidents résolus en moins de 4 heures (%)", attendu: k.partEn4HeuresPct, tolerance: 0.1, calcul: `${qte(MARS.resolusEnMoinsDe4Heures)} ÷ ${qte(MARS.incidents)} × 100 = ${pct(k.partEn4HeuresPct)}` },
        ];
      },
      explication: () => ["Chaque indicateur mesure un critère de performance : la disponibilité, la rapidité, la régularité du service. Un tableau de bord opérationnel en garde peu, suivis chaque mois."],
    },
    {
      id: "lire-le-tableau-de-bord",
      objectifs: [4],
      type: "choix",
      titre: "Le contrat est-il tenu ?",
      question: () => `Le contrat promet un site disponible ${pct(INFOGERANCE.disponibilitePromisePct)} du temps, et ${pct(INFOGERANCE.partResolueEn4HeuresPct)} des incidents résolus en moins de 4 heures. Qu'en conclure pour mars ?`,
      options: () => {
        const k = tableauDeBordDeMars();
        return [
          { texte: "La disponibilité est tenue, pas la rapidité", juste: true, retour: `Oui : ${pct(k.disponibilitePct)} de disponibilité atteint la promesse, mais ${pct(k.partEn4HeuresPct)} des incidents seulement ont été résolus à temps. NOVA le signale au prestataire, chiffres à l'appui.` },
          { texte: "Tout est tenu, puisque le délai moyen est sous 4 heures", juste: false, retour: `Non : une moyenne de ${heures(k.delaiMoyen)} cache des incidents longs. Le contrat porte sur la part résolue à temps.` },
          { texte: "Rien n'est tenu : il faut changer de prestataire dès demain, sans discuter", juste: false, retour: "Non : la disponibilité est tenue. Un écart se discute d'abord, avec les chiffres." },
        ];
      },
    },
    {
      id: "aligner",
      objectifs: [5],
      type: "choix",
      titre: "Aligner sur la stratégie",
      question: (c) => `La stratégie de ${c.entreprise} est de vendre davantage en ligne aux particuliers. Quel choix technologique s'y aligne le mieux ?`,
      options: () => [
        { texte: "Renforcer la disponibilité et la sécurité du site", juste: true, retour: "Oui : le site porte la stratégie ; chaque heure d'arrêt coûte des ventes. Les choix technologiques suivent les choix stratégiques." },
        { texte: "Des ordinateurs plus puissants pour l'atelier, qui en a déjà assez", juste: false, retour: "Non : la dépense ne sert pas le but que NOVA s'est fixé." },
        { texte: "Un logiciel de gestion d'entrepôt pour un stock que NOVA n'a pas encore", juste: false, retour: "Non : un outil sans besoin ne sert pas la stratégie, il pèse sur le budget." },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const b = budgetDuSi();
        return [
          `La fonction système d'information réunit des métiers, anciens et nouveaux. ${c.entreprise} confie ses postes à un prestataire, ce qui coûte moins qu'un technicien jusqu'à ${qte(postesOuLInfogeranceCouteMoins())} postes, mais garde la maîtrise et mesure le service. Son budget est de ${eur(b.total)} par an ; son tableau de bord dit que le contrat est tenu sur la disponibilité, pas sur la rapidité.`,
          "Dans l'arène, quels indicateurs suivez-vous chaque tour, et lesquels vous font changer de décision ?",
        ];
      },
      repere: () => "Métiers et compétences · interne ou externe, infogérance · veille · budget · tableau de bord opérationnel : indicateurs, critères, seuils · alignement sur la stratégie.",
    },
  ],
};
