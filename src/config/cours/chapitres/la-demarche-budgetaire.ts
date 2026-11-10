import { arrondi2, eur, nombreAuCentieme, pct as pourcent } from "../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../cas";
import {
  DEMANDES_DES_CENTRES,
  MOIS_DU_BUDGET_D_ACTIVITE,
  MOIS_POSSIBLES_DU_BANC,
  PUBLICITES_ESSAYEES,
  budgetDActivite,
  budgetsParCentre,
  navette,
  programmeEtBudget,
  publiciteMaximale,
  reseauDesBudgets,
  slackDeLaPublicite,
} from "../monde/demarche-budgetaire";
import { GESTION_DU_COURS, type FicheDeGestion } from "../monde/nova-gestion";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LA DÉMARCHE BUDGÉTAIRE (contrôle de gestion, palier 4 ; DCG UE11 2025, § 3.1 ; DSCG UE3 ;
 * BUT GEA).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : en décembre, NOVA prépare le budget de son semestre. Les
 * budgets eux-mêmes sont ceux du chapitre « Des ventes aux achats » (monde/budgets-operationnels.ts) :
 * ce chapitre en relit les totaux sans refaire leurs calculs, et suit la démarche qui les produit
 * (monde/demarche-budgetaire.ts). Le programme du DCG le demande ainsi : comprendre la démarche, son
 * utilité et ses limites, sans approfondir la construction fine des budgets, et sans les comptes
 * prévisionnels.
 *
 * L'objet, celui du § 3.1 : de la stratégie au plan, aux programmes puis aux budgets ; les budgets par
 * centre, par activité et par processus (sans oublier les services) ; le cycle budgétaire et ses
 * acteurs ; la navette et l'arbitrage sous la contrainte de la trésorerie ; la négociation des
 * objectifs et le slack ; la communication par les budgets ; les enjeux et les limites. La matière vient
 * du cours du propriétaire (chapitre 7 : la bougette, l'articulation plan, programmes, budgets, le
 * cycle de septembre à décembre, la navette, le budget de trésorerie qui dit si « ça passe ou ça
 * casse », le slack, le budget base zéro, les effets d'une pression trop forte).
 *
 * LES TROIS TEMPS :
 *   · guidé : l-ordre-de-la-demarche, programme-et-budget, qui-tranche (la formule est dans la question) ;
 *   · autonome : les-budgets-par-centre, le-budget-d-une-activite, le-slack (les chiffres sont à prendre
 *     dans l'énoncé, sans formule) ;
 *   · l'expérience avant la formule : predire-la-navette, la-publicite-au-curseur (le banc en mai, la plus
 *     forte publicité qui garde le matelas), puis le laboratoire de la navette (le mois du banc et la
 *     publicité), avec le graphique de la trésorerie la plus basse ;
 *   · expert : le budget d'un processus, la négociation d'un objectif, la communication, les limites ;
 *     puis la synthèse.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : le taux d'occupation se donne à deux décimales (au dixième,
 * avant) ; les heures du programme et disponibles sont des grandeurs au centième, les commandes une
 * quantité.
 */

/** Le chapitre se calcule sur la fiche de gestion de NOVA. */
export const ENTREPRISES_DE_LA_DEMARCHE: readonly string[] = ["nova"];

/** Le mois où le contrôleur propose de livrer le banc, au curseur : mai. */
export const MOIS_DU_BANC_DU_CURSEUR = 4;

const qte = nombreAuCentieme;
const pct = (t: number) => pourcent(t * 100);
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/i.test(nom) ? `d'${nom}` : `de ${nom}`);

/** La fiche de gestion du cours. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeGestion => GESTION_DU_COURS[c.code]!;

const navettes = new Map<string, ReturnType<typeof navette>>();

/** Le semestre consolidé pour un mois du banc et une publicité, gardé une fois calculé (la fiche est figée). */
export function navetteDe(f: FicheDeGestion, moisDuBanc: number, publicite: number) {
  const cle = `${f.code}|${moisDuBanc}|${publicite}`;
  const deja = navettes.get(cle);
  if (deja) return deja;
  const n = navette(f, { moisDuBanc, publicite });
  navettes.set(cle, n);
  return n;
}

const calcules = new Map<string, ReturnType<typeof calculerLeChapitre>>();

/** Tout ce que le chapitre demande, calculé une fois par entreprise. */
export function demarcheDuChapitre(c: Pick<Cas, "code">) {
  const deja = calcules.get(c.code);
  if (deja) return deja;
  const x = calculerLeChapitre(c);
  calcules.set(c.code, x);
  return x;
}

function calculerLeChapitre(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const D = DEMANDES_DES_CENTRES;
  const mai = MOIS_DU_BANC_DU_CURSEUR;
  const maxEnMai = publiciteMaximale(f, mai)!;
  const juin = MOIS_POSSIBLES_DU_BANC.at(-1)!;
  return {
    f,
    s: f.semestre,
    matelas: f.seuilsDAlerte.tresorerie,
    reseau: reseauDesBudgets(f),
    programme: programmeEtBudget(f),
    centres: budgetsParCentre(f),
    activite: budgetDActivite(f),
    D,
    fiche: reseauDesBudgets(f),
    demandes: navetteDe(f, D.banc.mois, D.publicite),
    enMai: navetteDe(f, mai, D.publicite),
    mai,
    maxEnMai,
    auMax: navetteDe(f, mai, maxEnMai),
    parEuro: arrondi2(navetteDe(f, mai, 0).plusBas.tresorerie - navetteDe(f, mai, 1).plusBas.tresorerie),
    juin,
    enJuin: navetteDe(f, juin, D.publicite),
    slack: slackDeLaPublicite(),
    depart: { banc: D.banc.mois, publicite: D.publicite },
    nom: (i: number) => f.semestre.mois[i]!.nom,
  };
}

export type DemarcheDuChapitre = ReturnType<typeof demarcheDuChapitre>;

/** Le réseau des budgets du semestre, en totaux, tel que « Des ventes aux achats » l'a bâti. */
export function tableauDuReseau(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = demarcheDuChapitre(c);
  const r = x.reseau;
  return {
    titre: `Le réseau des budgets ${dE(x.f.entreprise)}, sur le semestre`,
    colonnes: ["Total du semestre"],
    lignes: [
      { libelle: "Budget des ventes, en enceintes", valeurs: [qte(r.ventes.quantite)] },
      { libelle: "Budget des ventes, hors taxes", valeurs: [eur(r.ventes.valeur)] },
      { libelle: "Programme de production, en enceintes", valeurs: [qte(r.production)] },
      { libelle: "Budget des approvisionnements, hors taxes", valeurs: [eur(r.achatsHt)] },
      { libelle: "Paiements au fournisseur, TTC", valeurs: [eur(r.paiementsAuFournisseur)] },
      { libelle: "Trésorerie au 30 juin", valeurs: [eur(r.tresorerieFin)] },
    ],
  };
}

/** Le semestre consolidé avant et après les demandes des centres. */
export function tableauDesDemandes(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = demarcheDuChapitre(c);
  const ligne = (libelle: string, n: { plusBas: { nom: string; tresorerie: number }; resultat: number }) => ({ libelle, valeurs: [eur(n.plusBas.tresorerie), n.plusBas.nom, eur(n.resultat)] });
  return {
    titre: "Le semestre consolidé par le contrôleur",
    colonnes: ["Trésorerie la plus basse", "Mois", "Résultat du semestre"],
    lignes: [
      ligne("Le budget sans les demandes", { plusBas: x.fiche.plusBas, resultat: x.fiche.resultat }),
      ligne("Avec le banc en avril et la publicité", x.demandes),
    ],
  };
}

export const LA_DEMARCHE_BUDGETAIRE: Chapitre = {
  code: "la-demarche-budgetaire",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: ["DCG UE11 · Contrôle de gestion", "DSCG UE3 · Contrôle de gestion et stratégie", "BUT GEA · Concevoir des outils de contrôle de gestion"],
  titre: "La démarche budgétaire",
  accroche:
    "De la stratégie aux programmes, puis aux budgets : suivez la préparation du budget de NOVA, de la lettre de cadrage à l'arbitrage. Bâtissez un budget par centre et par activité, arbitrez les demandes des centres dans la navette, et repérez le slack d'une négociation.",
  objectifs: [
    "Décliner la stratégie en plan, en programmes puis en budgets, et distinguer un programme d'un budget",
    "Bâtir un budget par centre et par activité, et dire ce qu'apporte un budget par processus",
    "Situer le rôle de chaque acteur de la procédure, et repérer le slack d'une négociation",
    "Arbitrer les demandes des centres sous la contrainte de la trésorerie, par la navette budgétaire",
    "Apprécier les enjeux et les limites de la démarche budgétaire, et son rôle de communication",
  ],
  libre: false,
  prerequis: ["des-ventes-aux-achats"],
  ensuite: ["equilibrer-la-tresorerie", "le-cout-preetabli-et-les-budgets"],
  entreprises: {
    codes: ENTREPRISES_DE_LA_DEMARCHE,
    pourquoi: "la démarche budgétaire se suit ici sur le semestre de NOVA dans la simulation du cours, avec ses centres et son budget de trésorerie ; elle vaut pour toute organisation, services compris.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Préparer le budget",
      notions: ["cash_budget"],
      tableau: tableauDuReseau,
      texte: (c) => {
        const x = demarcheDuChapitre(c);
        return [
          "Le mot budget vient de la bougette, la bourse où le voyageur du Moyen Âge serrait de quoi payer ses étapes. Un budget est un ensemble cohérent de prévisions chiffrées en euros : les ventes, la production, les achats, le personnel, la trésorerie.",
          `Ceux de ${x.f.entreprise}, vous les avez bâtis dans « Des ventes aux achats » : le tableau en rappelle les totaux, et ce chapitre ne refait pas leurs calculs. Il suit la démarche qui les produit. Qui les prépare, et dans quel ordre ? Comment se négocient-ils ? Que disent-ils à chacun ?`,
          "La gestion budgétaire a deux temps : la budgétisation, avant l'exercice, puis le contrôle budgétaire, chaque mois, qui compare le réalisé au budget. Ce chapitre traite le premier.",
        ];
      },
      repere: () => "Stratégie, puis plan (sur 3 à 5 ans), puis programmes (en quantités), puis budgets (en euros), puis contrôle budgétaire, chaque mois.",
    },
    {
      id: "l-ordre-de-la-demarche",
      objectifs: [0],
      type: "choix",
      titre: "De la stratégie au budget",
      question: (c) =>
        `Le dirigeant de ${demarcheDuChapitre(c).f.entreprise} a une stratégie : devenir la marque d'enceintes des étudiants, avec une gamme de 3 références. Comment cette stratégie devient-elle le budget de décembre ?`,
      options: () => [
        {
          texte: "Par un plan, puis des programmes, puis des budgets",
          juste: true,
          retour:
            "Oui. Le plan chiffre la stratégie sur plusieurs années : les ventes visées, les investissements. Chaque année, il se traduit en programmes, en quantités (les enceintes à vendre, à monter, les heures), puis en budgets, en euros. Le budget décline la stratégie à court terme.",
        },
        {
          texte: "Le budget d'abord : la stratégie se déduit de ce qu'il permet",
          juste: false,
          retour: "Non : c'est la stratégie qui commande. Le budget dit ce que la stratégie coûte et rapporte cette année ; il peut la faire réviser, mais il ne la remplace pas.",
        },
        {
          texte: "Directement : chaque service chiffre ce qu'il veut dépenser",
          juste: false,
          retour: "Non : sans cadrage, chaque service tirerait de son côté, et la somme des demandes ne ferait pas une stratégie.",
        },
      ],
    },
    {
      id: "programme-et-budget",
      objectifs: [0],
      type: "montants",
      titre: "Un programme, un budget",
      notions: ["productivity", "payroll"],
      question: (c) => {
        const p = demarcheDuChapitre(c).programme;
        return `Le programme de production du semestre est de ${qte(p.production)} enceintes, sans stock. Une enceinte demande ${qte(p.heuresParEnceinte)} heure de montage ; les ${qte(p.operateurs)} opérateurs en donnent chacun ${qte(p.heuresParMois)} par mois. Calculez le programme de main-d'œuvre en heures, les heures disponibles du semestre, le taux d'occupation en %, à deux décimales, puis le budget du personnel du semestre, à ${eur(p.personnelDuMois)} par mois.`;
      },
      champs: (c) => {
        const p = demarcheDuChapitre(c).programme;
        return [
          { libelle: "Programme de main-d'œuvre, en heures", nature: "grandeur", attendu: p.heuresDeMontage, calcul: `${qte(p.production)} × ${qte(p.heuresParEnceinte)} = ${qte(p.heuresDeMontage)} heures` },
          { libelle: "Heures disponibles du semestre", nature: "grandeur", attendu: p.heuresDisponibles, calcul: `${qte(p.operateurs)} × ${qte(p.heuresParMois)} × ${qte(p.mois)} = ${qte(p.heuresDisponibles)} heures` },
          { libelle: "Taux d'occupation, en %", attendu: arrondi2(p.occupation * 100), calcul: `${qte(p.heuresDeMontage)} ÷ ${qte(p.heuresDisponibles)} × 100 = ${pct(p.occupation)}` },
          { libelle: "Budget du personnel du semestre", attendu: p.budgetDuPersonnel, calcul: `${eur(p.personnelDuMois)} × ${qte(p.mois)} = ${eur(p.budgetDuPersonnel)}` },
        ];
      },
      explication: (c) => {
        const p = demarcheDuChapitre(c).programme;
        return [
          `Le programme se dit en heures, le budget en euros. Pour passer de l'un à l'autre, il faut une hypothèse sur les prix et les coûts : ici, la paie est fixe. Les opérateurs sont occupés à ${pct(p.occupation)}, et le budget du personnel ne baisserait pas si l'on montait moins.`,
        ];
      },
    },
    {
      id: "le-cycle-et-les-acteurs",
      type: "lecture",
      titre: "Le cycle et ses acteurs",
      texte: (c) => {
        const x = demarcheDuChapitre(c);
        return [
          `En septembre, la direction envoie la lettre de cadrage : les objectifs de l'année, tirés du plan, et ce que l'environnement oblige à corriger. En octobre, chaque responsable de centre bâtit son projet de budget : c'est lui qui connaît le mieux ses contraintes.`,
          `En novembre, le contrôleur de gestion rassemble les projets et les harmonise. Ils font la navette entre les centres et lui jusqu'à ce qu'ils tiennent ensemble. Le budget de trésorerie, bâti au centre, dit alors si le tout passe ou casse : ${x.f.entreprise} veut garder ${eur(x.matelas)} en banque.`,
          "En décembre, la direction arbitre et arrête le budget, mois par mois. Pendant l'exercice, chaque mois, le réalisé se compare au budget : c'est le contrôle budgétaire.",
          "Les acteurs : la direction fixe le cadre et tranche ; le contrôleur organise la procédure, propose et fait la synthèse, sans décider ; les responsables prévoient et s'engagent. Dans une grande entreprise, un comité budgétaire les réunit.",
        ];
      },
      repere: () => "Septembre : cadrage. Octobre : projets des centres. Novembre : navette. Décembre : arbitrage. Chaque mois : contrôle budgétaire.",
    },
    {
      id: "qui-tranche",
      objectifs: [2],
      type: "choix",
      titre: "Qui tranche",
      question: () => "En novembre, le projet du service commercial et celui de l'atelier ne tiennent pas ensemble dans la trésorerie. Qui tranche ?",
      options: () => [
        {
          texte: "La direction, après la navette",
          juste: true,
          retour:
            "Oui. Le contrôleur montre l'incohérence et propose des solutions ; les responsables défendent leurs projets ; la direction arbitre, parce que l'arbitrage engage la stratégie. Le budget est un compromis négocié, pas une prévision imposée.",
        },
        {
          texte: "Le contrôleur, qui connaît le mieux les chiffres",
          juste: false,
          retour: "Non : le contrôleur est un fonctionnel. Il éclaire l'arbitrage et en chiffre les options ; il ne le rend pas.",
        },
        {
          texte: "Le responsable qui a déposé son projet le premier",
          juste: false,
          retour: "Non : l'ordre d'arrivée ne dit rien de ce que vaut un projet. Il faut comparer ce que chacun apporte à la stratégie.",
        },
      ],
    },
    {
      id: "les-budgets-par-centre",
      objectifs: [1],
      type: "montants",
      titre: "Un budget par centre",
      notions: ["fixed_costs"],
      question: (c) => {
        const k = demarcheDuChapitre(c).centres;
        return `Chaque responsable reçoit son budget. Les charges fixes d'un mois sont de ${eur(k.parMois.atelier)} pour l'atelier et de ${eur(k.parMois.commercial)} pour le service commercial, selon la répartition du coût complet. Calculez le budget de structure du semestre de chaque centre, puis leur total.`;
      },
      champs: (c) => {
        const k = demarcheDuChapitre(c).centres;
        return [
          { libelle: "Budget de structure de l'atelier", attendu: k.atelier, calcul: `${eur(k.parMois.atelier)} × ${qte(k.mois)} = ${eur(k.atelier)}` },
          { libelle: "Budget de structure du service commercial", attendu: k.commercial, calcul: `${eur(k.parMois.commercial)} × ${qte(k.mois)} = ${eur(k.commercial)}` },
          { libelle: "Total des deux centres", attendu: k.total, calcul: `${eur(k.atelier)} + ${eur(k.commercial)} = ${eur(k.total)}` },
        ];
      },
      explication: (c) => {
        const x = demarcheDuChapitre(c);
        const fixes = arrondi2(x.centres.total / x.centres.mois);
        return [
          `Le total est celui des charges fixes de ${x.f.entreprise}, ${eur(fixes)} par mois : le budget par centre ne crée aucune charge, il confie chacune à quelqu'un. Chaque responsable s'engage sur la sienne, et c'est sur elle qu'il rendra compte.`,
        ];
      },
    },
    {
      id: "le-budget-d-une-activite",
      objectifs: [1],
      type: "montants",
      titre: "Un budget par activité",
      notions: ["full_unit_cost"],
      question: (c) => {
        const x = demarcheDuChapitre(c);
        const a = x.activite;
        return `Le budget peut aussi se bâtir par activité. L'activité « ${a.libelle} » a coûté ${eur(a.coutDeJanvier)} en janvier pour ${qte(a.volumeDeJanvier)} commandes, soit ${eur(a.coutDeLInducteur)} par commande, son inducteur. En ${x.nom(MOIS_DU_BUDGET_D_ACTIVITE)}, ${qte(a.commandes.enLigne)} enceintes se vendent en ligne, une commande chacune, et CampusTech passe sa commande groupée. Calculez les commandes du mois, le budget de l'activité, puis ce qui manquerait à un budget reconduit au coût de janvier.`;
      },
      champs: (c) => {
        const x = demarcheDuChapitre(c);
        const a = x.activite;
        const manque = arrondi2(a.budget - a.coutDeJanvier);
        return [
          { libelle: `Commandes de ${x.nom(MOIS_DU_BUDGET_D_ACTIVITE)}`, nature: "quantite", attendu: a.commandes.total, calcul: `${qte(a.commandes.enLigne)} + ${qte(a.commandes.campustech)} = ${qte(a.commandes.total)}` },
          { libelle: "Budget de l'activité", attendu: a.budget, calcul: `${qte(a.commandes.total)} × ${eur(a.coutDeLInducteur)} = ${eur(a.budget)}` },
          { libelle: "Ce qui manquerait au budget reconduit", attendu: manque, calcul: `${eur(a.budget)} − ${eur(a.coutDeJanvier)} = ${eur(manque)}` },
        ];
      },
      explication: (c) => {
        const a = demarcheDuChapitre(c).activite;
        return [
          `Un budget reconduit d'un mois sur l'autre ignore le volume : il laisserait le service client sans les moyens de ${qte(a.commandes.total - a.volumeDeJanvier)} commandes de plus. Le budget par activité part de ce qui fait travailler l'activité, son inducteur. C'est ainsi qu'on budgète un service, qui n'a ni stock ni production à compter.`,
        ];
      },
    },
    {
      id: "le-budget-d-un-processus",
      objectifs: [1],
      type: "choix",
      titre: "Un budget par processus",
      question: () =>
        "CampusTech commande ; NOVA monte et expédie ; CampusTech paie, en retard, après une relance. Le service commercial, l'atelier et l'administration y travaillent tour à tour. Qu'apporte un budget par processus, de la commande à l'encaissement ?",
      options: () => [
        {
          texte: "Il chiffre ce que coûte servir CampusTech, d'un bout à l'autre",
          juste: true,
          retour:
            "Oui. Un processus traverse les centres : aucun responsable n'en voit le coût entier. Le budget du processus rassemble ses activités et rend visible ce qu'un retard coûte en relances et en trésorerie. Il fait aussi parler les centres entre eux.",
        },
        {
          texte: "Rien : la somme des budgets des 3 centres dit déjà tout cela, sans calcul de plus",
          juste: false,
          retour: "Non : chaque budget de centre mêle tous les clients. On n'y lit pas ce que coûte le processus d'un client, ni où il se perd du temps.",
        },
        {
          texte: "Il remplace le budget de trésorerie, puisqu'il va jusqu'à l'encaissement",
          juste: false,
          retour: "Non : le budget de trésorerie reste la synthèse de tous les flux. Le budget par processus éclaire un enchaînement d'activités.",
        },
      ],
    },
    {
      id: "les-demandes-des-centres",
      type: "lecture",
      titre: "Les demandes des centres",
      notions: ["cash_budget"],
      tableau: tableauDesDemandes,
      texte: (c) => {
        const x = demarcheDuChapitre(c);
        return [
          `En novembre, deux projets arrivent au contrôleur. Le chef d'atelier demande ${x.s.investissement.libelle}, ${eur(x.D.banc.montantHt)} hors taxes, livré et payé en ${x.nom(x.D.banc.mois)} : il en a besoin pour la gamme. La responsable commerciale demande ${eur(x.D.publicite)} de publicité hors taxes chaque mois.`,
          `Le contrôleur les fait entrer dans le budget de trésorerie. ${majuscule(x.demandes.plusBas.nom)} finit à ${eur(x.demandes.plusBas.tresorerie)} : sous zéro, et loin du matelas de ${eur(x.matelas)}. Les projets ne tiennent pas ensemble. La navette commence.`,
        ];
      },
    },
    {
      id: "predire-la-navette",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur la navette",
      notions: ["cash_budget"],
      question: (c) => {
        const x = demarcheDuChapitre(c);
        return `Le contrôleur propose de livrer le banc en ${x.nom(x.mai)} plutôt qu'en ${x.nom(x.D.banc.mois)}, sans toucher à la publicité. Avant de manipuler, pariez : la trésorerie tiendra-t-elle le matelas ?`;
      },
      options: () => {
        const voir = "Faites varier la publicité à l'étape suivante : le tableau montre la trésorerie la plus basse face au matelas.";
        return [
          { texte: "Pas de découvert, mais sous le matelas", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Oui, au-dessus du matelas", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Non : un découvert, comme en avril, un mois plus tard", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "la-publicite-au-curseur",
      objectifs: [3],
      type: "curseur",
      titre: "La publicité, au curseur",
      notions: ["cash_budget"],
      question: (c) => {
        const x = demarcheDuChapitre(c);
        return `Le banc est livré en ${x.nom(x.mai)}. Faites varier la publicité mensuelle, de ${eur(PUBLICITES_ESSAYEES.min)} à ${eur(PUBLICITES_ESSAYEES.max)} : une courbe donne la trésorerie la plus basse du semestre, une droite le matelas de ${eur(x.matelas)}. Placez le curseur sur la plus forte publicité qui garde le matelas, puis validez.`;
      },
      grandeur: () => ({ libelle: "Publicité par mois, hors taxes", unite: "€" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: demarcheDuChapitre(c).maxEnMai, min: PUBLICITES_ESSAYEES.min, max: PUBLICITES_ESSAYEES.max }),
      zones: ["Au-dessus du matelas", "Sous le matelas"],
      rates: () => ({
        dessous: "La trésorerie tient encore au-dessus du matelas : une publicité plus forte passerait.",
        dessus: "À cette publicité, la trésorerie passe sous le matelas.",
      }),
      montrer: "Montrer la limite",
      lecture: (c, p) => {
        const x = demarcheDuChapitre(c);
        const n = navetteDe(x.f, x.mai, p);
        return [
          { libelle: "Publicité du semestre, hors taxes", montant: arrondi2(p * x.s.mois.length) },
          { libelle: "Résultat du semestre", montant: n.resultat },
          { libelle: "Trésorerie au 30 juin", montant: n.tresorerieFin },
          { libelle: "Trésorerie la plus basse du semestre", montant: n.plusBas.tresorerie, fort: true },
        ];
      },
      droites: (c) => {
        const x = demarcheDuChapitre(c);
        return { produit: (p) => navetteDe(x.f, x.mai, p).plusBas.tresorerie, cout: () => x.matelas, libelles: ["Trésorerie la plus basse du semestre", "Le matelas"] };
      },
      explication: (c) => {
        const x = demarcheDuChapitre(c);
        return [
          `Avec le banc en ${x.nom(x.mai)}, la publicité tient jusqu'à ${eur(x.maxEnMai)} par mois : ${x.auMax.plusBas.nom} finit à ${eur(x.auMax.plusBas.tresorerie)}. À ${eur(x.D.publicite)}, la demande entière, ${x.enMai.plusBas.nom} tombe à ${eur(x.enMai.plusBas.tresorerie)}.`,
          `Chaque euro de publicité mensuelle retire ${eur(x.parEuro)} à la fin de ${x.nom(x.mai)} : 5 mois payés toutes taxes comprises, moins la TVA récupérée sur les déclarations déjà payées.`,
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-navette",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire de la navette",
      notions: ["cash_budget", "fixed_costs"],
      question: () =>
        "Choisissez le mois où le banc est livré, et la publicité de chaque mois : le tableau suit la trésorerie la plus basse, la trésorerie au 30 juin et le résultat du semestre. Relevez le défi, puis cherchez ce que chaque levier change.",
      leviers: (c) => {
        const x = demarcheDuChapitre(c);
        return [
          { code: "banc", libelle: "Le banc est livré en", unite: "", min: MOIS_POSSIBLES_DU_BANC[0]!, max: MOIS_POSSIBLES_DU_BANC.at(-1)!, pas: 1, depart: x.depart.banc, choix: MOIS_POSSIBLES_DU_BANC.map((m) => ({ valeur: m, libelle: majuscule(x.nom(m)) })) },
          { code: "publicite", libelle: "Publicité par mois, hors taxes", unite: "€", min: PUBLICITES_ESSAYEES.min, max: PUBLICITES_ESSAYEES.max, pas: PUBLICITES_ESSAYEES.pasDuLaboratoire, depart: x.depart.publicite },
        ];
      },
      lecture: (c, p) => {
        const x = demarcheDuChapitre(c);
        const n = navetteDe(x.f, p.banc!, p.publicite!);
        const d = navetteDe(x.f, x.depart.banc, x.depart.publicite);
        return [
          { libelle: "Publicité du semestre, hors taxes", montant: arrondi2(p.publicite! * x.s.mois.length), reference: arrondi2(x.depart.publicite * x.s.mois.length) },
          { libelle: "Résultat du semestre", montant: n.resultat, reference: d.resultat },
          { libelle: "Trésorerie au 30 juin", montant: n.tresorerieFin, reference: d.tresorerieFin },
          { libelle: "Trésorerie la plus basse du semestre", montant: n.plusBas.tresorerie, reference: d.plusBas.tresorerie, fort: true },
        ];
      },
      graphique: (c) => {
        const x = demarcheDuChapitre(c);
        return {
          levier: "publicite",
          courbes: [
            { libelle: "Trésorerie la plus basse du semestre", valeur: (p) => navetteDe(x.f, p.banc!, p.publicite!).plusBas.tresorerie },
            { libelle: "Le matelas", valeur: () => x.matelas },
          ],
        };
      },
      defi: (c) => {
        const x = demarcheDuChapitre(c);
        return {
          consigne: `Accordez au service commercial ses ${eur(x.D.publicite)} par mois, gardez le banc dans le semestre, et restez au-dessus du matelas de ${eur(x.matelas)}.`,
          atteint: (p) => p.publicite! >= x.D.publicite && navetteDe(x.f, p.banc!, p.publicite!).tient,
          indice: (p) => {
            const n = navetteDe(x.f, p.banc!, p.publicite!);
            if (p.publicite! < x.D.publicite) return `Le service commercial demande ${eur(x.D.publicite)} par mois : remontez la publicité, et cherchez un autre levier.`;
            return `${majuscule(n.plusBas.nom)} finit à ${eur(n.plusBas.tresorerie)}. Le banc pèse sur le mois où il se paie : déplacez-le.`;
          },
          solution: { banc: x.juin, publicite: x.D.publicite },
        };
      },
      explication: (c) => {
        const x = demarcheDuChapitre(c);
        return [
          `Défi relevé : avec le banc en ${x.nom(x.juin)}, la trésorerie la plus basse est celle de ${x.enJuin.plusBas.nom}, ${eur(x.enJuin.plusBas.tresorerie)}. Différé, le banc laisse au service commercial tout son budget.`,
          `C'est la navette : les projets vont et viennent entre les centres et le contrôleur jusqu'à un budget qui tienne. Avec le banc en ${x.nom(x.mai)}, il aurait fallu limiter la publicité à ${eur(x.maxEnMai)}. Différer une tranche d'investissement ou réduire une dépense : l'arbitrage revient à la direction.`,
          "Dans la fiche, le dirigeant a tranché autrement : ni banc ni publicité au semestre. C'est le budget que bâtissent les chapitres de trésorerie.",
        ];
      },
    },
    {
      id: "le-slack",
      objectifs: [2],
      type: "montants",
      titre: "Le matelas de la demande",
      notions: ["cost_variance"],
      question: (c) => {
        const s = demarcheDuChapitre(c).slack;
        return `La responsable commerciale a demandé ${eur(s.demande)} par mois, en majorant de ${pct(s.majoration)} ce qui lui suffirait. La direction abat toutes les demandes de ${pct(s.abattement)}. Calculez ce qui lui suffirait, le budget qui lui est alloué, puis, si elle dépense ${eur(s.depense)} par mois, son écart au budget et ce qu'elle dépense au-delà du besoin.`;
      },
      champs: (c) => {
        const s = demarcheDuChapitre(c).slack;
        return [
          { libelle: "Ce qui lui suffirait, par mois", attendu: s.besoin, calcul: `${eur(s.demande)} ÷ ${qte(1 + s.majoration)} = ${eur(s.besoin)}` },
          { libelle: "Budget alloué, par mois", attendu: s.alloue, calcul: `${eur(s.demande)} × ${qte(1 - s.abattement)} = ${eur(s.alloue)}` },
          { libelle: "Écart au budget, favorable", attendu: s.ecartFavorable, calcul: `${eur(s.alloue)} − ${eur(s.depense)} = ${eur(s.ecartFavorable)}` },
          { libelle: "Dépense au-delà du besoin", attendu: s.auDelaDuBesoin, calcul: `${eur(s.depense)} − ${eur(s.besoin)} = ${eur(s.auDelaDuBesoin)}` },
        ];
      },
      explication: (c) => {
        const s = demarcheDuChapitre(c).slack;
        return [
          `Son budget finit avec un écart favorable de ${eur(s.ecartFavorable)}, alors qu'elle a dépensé ${eur(s.auDelaDuBesoin)} de trop chaque mois. C'est le slack budgétaire : le matelas que chacun se ménage dans la négociation. L'abattement uniforme ne le retire pas : il pousse chacun à majorer davantage.`,
          "Le remède : faire justifier chaque dépense, comme le budget base zéro, et juger chacun sur des objectifs plutôt que sur le seul respect d'une enveloppe.",
        ];
      },
    },
    {
      id: "negocier-un-objectif",
      objectifs: [2],
      type: "choix",
      titre: "Négocier un objectif",
      question: (c) => {
        const x = demarcheDuChapitre(c);
        const t2 = x.s.clienteles.reduce((t, k) => t + k.quantites.slice(3).reduce((a, q) => a + q, 0), 0);
        return `Le dirigeant négocie avec la responsable commerciale son objectif de ventes du deuxième trimestre. La prévision est de ${qte(t2)} enceintes. Quel objectif retenir ?`;
      },
      options: () => [
        {
          texte: "Un peu au-dessus, discuté avec elle",
          juste: true,
          retour:
            "Oui. Un objectif négocié engage celui qui l'accepte : c'est la direction par objectifs. Un peu au-dessus de la prévision, il met l'équipe sous tension sans la décourager. Trop haut, il démobilise ; trop bas, il endort.",
        },
        {
          texte: "Le double, pour la pousser au maximum",
          juste: false,
          retour: "Non : un objectif hors d'atteinte démobilise, puisque l'effort ne sert à rien. Poussée trop loin, la pression budgétaire use les personnes.",
        },
        {
          texte: "La prévision exacte, imposée sans discussion",
          juste: false,
          retour: "Non : imposé, l'objectif n'engage pas ; égal à la prévision, il ne demande aucun effort. La négociation fait l'adhésion.",
        },
      ],
    },
    {
      id: "communiquer-par-le-budget",
      objectifs: [4],
      type: "choix",
      titre: "Ce que le budget communique",
      question: () => "En décembre, le budget arrêté part chez chaque responsable, mois par mois. Que leur communique-t-il ?",
      options: () => [
        {
          texte: "Les objectifs et les moyens de chacun",
          juste: true,
          retour:
            "Oui. Le budget dit à chacun ce que l'entreprise attend de lui et ce qu'elle lui donne. Il coordonne : l'atelier sait ce que le service commercial prévoit de vendre. En remontant, il sert à rendre compte : chaque mois, l'écart se discute avec le responsable.",
        },
        {
          texte: "Les comptes de l'exercice écoulé, certifiés",
          juste: false,
          retour: "Non : ce sont les comptes annuels. Le budget regarde l'année qui vient.",
        },
        {
          texte: "Un plafond de dépenses à atteindre coûte que coûte",
          juste: false,
          retour: "Non : un budget n'est pas un droit à dépenser. Tout dépenser pour ne pas perdre son budget l'an prochain est un effet pervers bien connu.",
        },
      ],
    },
    {
      id: "les-limites",
      objectifs: [4],
      type: "choix",
      titre: "Les limites du budget",
      question: () => "Le dirigeant se demande si le budget vaut l'effort qu'il demande. Laquelle de ces critiques est juste ?",
      options: () => [
        {
          texte: "Il peut figer l'action quand tout change",
          juste: true,
          retour:
            "Oui. Bâti en décembre, il peut faire exécuter en juin ce qui n'a plus de sens : on dépense parce que c'est prévu. S'y ajoutent le slack, la lourdeur de la procédure et la tentation du court terme. D'où les budgets révisés en cours d'année, ou les entreprises qui pilotent sans budget annuel.",
        },
        {
          texte: "Il ne sert à rien : la trésorerie se constate à la banque",
          juste: false,
          retour: "Non : constater le découvert à la banque, c'est trop tard. Le budget de trésorerie l'a montré dès novembre.",
        },
        {
          texte: "Il garantit le résultat prévu, donc il n'a pas de limite",
          juste: false,
          retour: "Non : un budget prévoit, il ne garantit rien. Le marché, les clients et les fournisseurs n'ont pas signé le budget de NOVA.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["cash_budget"],
      tableau: tableauDesDemandes,
      texte: (c) => {
        const x = demarcheDuChapitre(c);
        return [
          `Vous avez suivi la démarche budgétaire de ${x.f.entreprise} : de la stratégie au plan, aux programmes en quantités, puis aux budgets en euros, ceux que « Des ventes aux achats » a bâtis. Vous avez bâti un budget par centre, ${eur(x.centres.total)} de structure sur le semestre, et un budget d'activité, ${eur(x.activite.budget)} pour les commandes de ${x.nom(MOIS_DU_BUDGET_D_ACTIVITE)}.`,
          `Dans la navette, vous avez fait tenir les demandes des centres dans la trésorerie : le banc en ${x.nom(x.mai)} avec ${eur(x.maxEnMai)} de publicité au plus, ou en ${x.nom(x.juin)} avec toute la demande. Vous avez repéré le slack d'une demande, et le rôle de chacun.`,
          "Au niveau de l'examen, vous savez délimiter la démarche budgétaire, en dire les rôles, les intérêts et les limites, et conseiller un décideur sur une procédure. Dans l'arène, préparez votre tour comme un budget : ventes, moyens, trésorerie, avant de valider.",
        ];
      },
      repere: () => "Un budget : des prévisions chiffrées, négociées, qui engagent chaque responsable. La navette les rend cohérentes ; la direction arbitre ; le contrôle budgétaire les suit chaque mois.",
    },
  ],
};
