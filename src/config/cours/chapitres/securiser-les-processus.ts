import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { CelluleACompleter, TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import type { Cas } from "../cas";
import { EXERCICES_DU_COURS, type FicheDeLExercice } from "../monde/exercice-de-nova";
import {
  ACTEURS_DE_NOVA,
  CONTROLE_FISCAL,
  COURRIEL_FRAUDULEUX,
  DROITS_DU_PGI,
  DROIT_DE_REPRISE_EN_ANNEES,
  DUREES_DE_CONSERVATION,
  TACHES_DES_ACHATS,
  cadrageDeLaTva,
  controleDeLaPaie,
  fraudeEvitee,
} from "../monde/securite-des-processus";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : SÉCURISER LES PROCESSUS, CONTRÔLE INTERNE, ARCHIVAGE, CONTRÔLE EXTÉRIEUR (comptabilité
 * générale, palier 4 ; transversal, BTS CG P1 1.2.3, 1.2.4, 1.7 ; P2 2.6, 2.8 ; P3 3.2.5, 3.3.8 ;
 * P4 4.1.2, 4.4).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : NOVA en N + 1, qui relit son exercice N déjà clos
 * (monde/exercice-de-nova.ts) sans en changer un chiffre ; l'organisation comptable, les contrôles et
 * le contrôle fiscal sont dans monde/securite-des-processus.ts.
 *
 * L'objet : l'organisation d'un processus et la séparation des fonctions (autoriser, détenir,
 * enregistrer, contrôler), les droits du PGI, une fraude au changement de coordonnées bancaires que la
 * procédure arrête, les contrôles de cohérence (le cadrage de la TVA face aux ventes, la déclaration
 * sociale face aux comptes de la paie), l'archivage et ses durées, le contrôle fiscal et le fichier des
 * écritures comptables, l'intangibilité d'une période close, puis une proposition d'amélioration.
 *
 * LES TEMPS DU CHAPITRE :
 *   · guidé : intro, les-quatre-fonctions, le-cumul-de-la-presidente, les-droits-du-pgi (la règle est
 *     dans la question) ;
 *   · l'expérience avant la formule : predire-la-fraude avant la-procedure-qui-arrete ; predire-le-
 *     cadrage avant le cadrage ; puis le laboratoire de la facturation (deux leviers à choix, le
 *     défi : un écart réduit à l'escompte) ;
 *   · autonome : ce-que-la-fraude-aurait-coute, le-cadrage-de-la-tva, la-dsn-face-aux-comptes,
 *     conserver-les-documents ;
 *   · expert : le-fichier-des-ecritures, la-periode-close, le-compte-rendu ; et la synthèse.
 *
 * MATIÈRE : le cours du propriétaire sur les travaux d'inventaire (la procédure de clôture qui fige
 * la chronologie et garantit l'intangibilité des écritures, PCG art. 420-6), adapté à NOVA.
 */

/** Le chapitre se joue chez NOVA, dans la simulation du cours. */
export const ENTREPRISES_DE_LA_SECURITE: readonly string[] = ["nova"];

/** Les leviers à choix du laboratoire : comment se facture la commande urgente, et la livraison différée. */
export const COMMANDE_URGENTE = { enJanvier: 0, enDecembre: 1 } as const;
export const LIVRAISON_DIFFEREE = { enDecembre: 0, enJanvier: 1 } as const;

/** La solution du laboratoire : chaque vente facturée le jour de sa livraison. */
export const SOLUTION_DU_CADRAGE = { commande: COMMANDE_URGENTE.enDecembre, livraison: LIVRAISON_DIFFEREE.enJanvier } as const;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/i.test(nom) ? `d'${nom}` : `de ${nom}`);
const signe = (x: number) => (x < 0 ? `− ${eur(-x)}` : `+ ${eur(x)}`);

const donnee = (valeur: number | null): CelluleACompleter => ({ valeur });
const aSaisir = (valeur: number, calcul: string, indice?: string): CelluleACompleter => ({ valeur, saisir: true, calcul, ...(indice ? { indice } : {}) });

/** La fiche de l'exercice N. */
export const ficheDe = (c: Pick<Cas, "code">): FicheDeLExercice => EXERCICES_DU_COURS[c.code]!;

/** Tout ce que le chapitre lit. */
export function securiteDuChapitre(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  return { f, entreprise: f.entreprise, fournisseur: f.fournisseur.nom, fraude: fraudeEvitee(f), cadrage: cadrageDeLaTva(f), paie: controleDeLaPaie(f) };
}

export type SecuriteDuChapitre = ReturnType<typeof securiteDuChapitre>;

/** Le cadrage à une position du laboratoire. */
export const cadrageDuLaboratoire = (f: FicheDeLExercice, p: Readonly<Record<string, number>>) =>
  cadrageDeLaTva(f, { commandeUrgenteFactureeEnDecembre: p.commande === COMMANDE_URGENTE.enDecembre, livraisonDiffereeFactureeEnJanvier: p.livraison === LIVRAISON_DIFFEREE.enJanvier });

/** Le départ du laboratoire : la facturation de la fiche. */
export const departDuCadrage = () => ({ commande: COMMANDE_URGENTE.enJanvier, livraison: LIVRAISON_DIFFEREE.enDecembre });

const acteur = (code: string) => ACTEURS_DE_NOVA.find((a) => a.code === code)!.libelle;

// ─────────────────────────────────────────────────────────────────────────────
// LES TABLEAUX
// ─────────────────────────────────────────────────────────────────────────────

/** Qui fait quoi dans la comptabilité de NOVA. */
export function quiFaitQuoi(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = securiteDuChapitre(c);
  return {
    titre: `La comptabilité de ${x.entreprise}, acteur par acteur`,
    colonnes: ["Ce qu'il fait"],
    lignes: ACTEURS_DE_NOVA.map((a) => ({ libelle: a.libelle, valeurs: [a.role] })),
  };
}

/** Le courriel du 28 décembre et la facture qu'il vise. */
export function leCourriel(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = securiteDuChapitre(c);
  return {
    titre: `Le courriel reçu le ${COURRIEL_FRAUDULEUX.date.jour} décembre`,
    colonnes: ["Ce qu'il dit"],
    lignes: [
      { libelle: "Expéditeur affiché", valeurs: [`${x.fournisseur}, service comptable`] },
      { libelle: "Objet", valeurs: ["Changement de domiciliation bancaire"] },
      { libelle: "Facture visée", valeurs: [`facture du 10 décembre, ${eur(x.fraude.facture)} TTC`] },
      { libelle: "Échéance", valeurs: [COURRIEL_FRAUDULEUX.echeance] },
      { libelle: "Demande", valeurs: ["virer sur un nouvel IBAN, joint en pièce"] },
      { libelle: "Formulation", valeurs: ["urgent, la nouvelle banque attend le premier paiement"] },
    ],
  };
}

/** Les chiffres de l'exercice N que le cadrage lit. */
export function chiffresDuCadrage(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = securiteDuChapitre(c).cadrage;
  const f = ficheDe(c);
  return {
    titre: "Ventes de N et TVA déclarée",
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Ventes comptabilisées de N, après inventaire (701)", valeurs: [eur(x.ventesComptabilisees)] },
      { libelle: "Facture à établir : commande urgente, facturée le 4 janvier", valeurs: [eur(x.factureAEtablir)] },
      { libelle: `Produit constaté d'avance : ${f.livraisonDiffereeDeDecembre.enceintes} enceintes livrées en janvier`, valeurs: [eur(x.produitConstateDAvance)] },
      { libelle: "Escompte accordé à Sonora en septembre (665)", valeurs: [eur(x.escompte)] },
      { libelle: "Bases déclarées sur les douze déclarations de N", valeurs: [eur(x.base)] },
    ],
  };
}

/** LE CADRAGE, à compléter : des ventes comptabilisées à la base déclarée. */
export function grilleDuCadrage(c: Pick<Cas, "code">): TableauACompleter {
  const x = securiteDuChapitre(c).cadrage;
  const f = ficheDe(c);
  const avantEscompte = auCentime(x.ventesComptabilisees - x.factureAEtablir + x.produitConstateDAvance);
  return {
    titre: "Cadrage de la TVA collectée de N",
    colonnes: ["Montant"],
    lignes: [
      { libelle: "Ventes comptabilisées de N", cellules: [donnee(x.ventesComptabilisees)] },
      { libelle: "Moins : la facture à établir, déclarée en janvier", cellules: [aSaisir(x.factureAEtablir, `la commande urgente, facturée le 4 janvier : ${eur(x.factureAEtablir)}`, "une vente de N que la TVA de N ne connaît pas encore")] },
      { libelle: "Plus : le produit constaté d'avance, déclaré en décembre", cellules: [aSaisir(x.produitConstateDAvance, `les ${f.livraisonDiffereeDeDecembre.enceintes} enceintes facturées le ${f.campustech.jourDeFacturation} décembre : ${eur(x.produitConstateDAvance)}`, "facturé en N, vendu en N+1")] },
      { libelle: "Moins : l'escompte de Sonora", cellules: [aSaisir(x.escompte, `l'escompte du 665 : ${eur(x.escompte)}`, "il réduit la base, pas les ventes")] },
      {
        libelle: "Base qui aurait dû être déclarée",
        fort: true,
        totalDe: { plus: [0, 2], moins: [1, 3] },
        cellules: [aSaisir(x.base, `${eur(x.ventesComptabilisees)} − ${eur(x.factureAEtablir)} + ${eur(x.produitConstateDAvance)} − ${eur(x.escompte)} = ${eur(x.base)}, soit ${eur(avantEscompte)} moins l'escompte`)],
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LE CHAPITRE
// ─────────────────────────────────────────────────────────────────────────────

export const SECURISER_LES_PROCESSUS: Chapitre = {
  code: "securiser-les-processus",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [
    "BTS CG P1 · Contrôle et traitement comptable des opérations commerciales",
    "BTS CG P2 · Contrôle et production de l'information financière",
    "BTS CG P3 · Gestion des obligations fiscales",
    "BTS CG P4 · Gestion des relations sociales",
  ],
  titre: "Sécuriser les processus : contrôle interne, archivage, contrôle extérieur",
  accroche:
    "Un courriel qui imite le fournisseur demande de payer sur un nouvel IBAN ; la TVA de l'année ne retombe pas sur les ventes ; un vérificateur demande le fichier des écritures. Chez NOVA, une procédure, un contrôle et une archive bien tenue répondent à chacun.",
  objectifs: [
    "Décrire l'organisation d'un processus et séparer les fonctions incompatibles, droits du PGI compris",
    "Repérer un risque de fraude ou d'erreur, et la procédure qui l'arrête",
    "Réaliser un contrôle de cohérence : le cadrage de la TVA, la déclaration sociale face aux comptes",
    "Appliquer les durées de conservation, et répondre à un contrôle fiscal",
    "Proposer une amélioration argumentée des procédures",
  ],
  libre: false,
  prerequis: ["le-systeme-d-information-comptable", "la-paie", "la-cloture"],
  ensuite: ["le-dossier-de-revision"],
  entreprises: {
    codes: ENTREPRISES_DE_LA_SECURITE,
    pourquoi: "les contrôles portent sur l'exercice de NOVA tenu dans la simulation du cours, ses factures, sa TVA et sa paie.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une petite équipe, quatre acteurs",
      notions: ["payment_terms"],
      tableau: quiFaitQuoi,
      texte: (c) => {
        const x = securiteDuChapitre(c);
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${x.entreprise}, en N+1. L'exercice N est clos : on n'en change aucun chiffre, on contrôle comment il a été produit.`,
          `${x.entreprise} n'a pas de service comptable. Ses salariés travaillent à l'atelier. La comptabilité se partage entre le président, le chef d'équipe et le cabinet d'expertise comptable ; NOVA et le cabinet partagent un PGI en ligne.`,
          "Vous êtes le collaborateur du cabinet. Votre mission : décrire les processus, repérer leurs risques, faire les contrôles de cohérence, et rendre un compte rendu avec vos propositions.",
          "Le contrôle interne n'est pas une méfiance envers les personnes. Ce sont les règles qui font qu'une erreur ou une fraude se voit avant de coûter.",
        ];
      },
      repere: () =>
        "Contrôle interne : l'ensemble des procédures qui protègent les actifs, fiabilisent l'information comptable et font appliquer les décisions. Sa première règle : séparer les fonctions d'autorisation, de détention, d'enregistrement et de contrôle.",
    },
    {
      id: "les-quatre-fonctions",
      objectifs: [0],
      type: "tri",
      titre: "Le processus achats, fonction par fonction",
      notions: ["payment_terms"],
      question: () =>
        "Rangez chaque tâche du processus achats dans la fonction qu'elle remplit. Autoriser, c'est engager l'entreprise ; détenir, c'est avoir sous sa garde les biens ou les fonds ; enregistrer, c'est comptabiliser ; contrôler, c'est comparer des sources indépendantes.",
      relance: "Demandez-vous si la tâche engage NOVA, garde quelque chose, écrit en comptabilité, ou compare deux pièces.",
      categories: [
        { code: "autoriser", libelle: "Autoriser" },
        { code: "detenir", libelle: "Détenir" },
        { code: "enregistrer", libelle: "Enregistrer" },
        { code: "controler", libelle: "Contrôler" },
      ],
      elements: () => TACHES_DES_ACHATS.map((t) => ({ libelle: t.libelle, montant: 0, categorie: t.fonction, pourquoi: `${acteur(t.acteur)}. ${t.pourquoi}` })),
      explication: () => [
        "Une même personne ne devrait pas tenir deux de ces fonctions sur la même opération. Qui reçoit les jeux ne saisit pas la facture ; qui saisit ne paie pas. Chaque acteur contrôle alors l'autre sans le vouloir.",
      ],
    },
    {
      id: "le-cumul-de-la-presidente",
      objectifs: [0],
      type: "choix",
      titre: "Quand la séparation est impossible",
      notions: ["payment_terms"],
      question: () =>
        "Le président signe les commandes et signe aussi les virements : il autorise et il détient les fonds. Dans une entreprise de cette taille, impossible de faire autrement. Que fait le cabinet ?",
      options: () => [
        {
          texte: "Il compense : rapprochements faits par un autre que lui",
          juste: true,
          retour:
            "Oui. Quand la séparation est impossible, un contrôle compensatoire la remplace : le cabinet rapproche commande, réception et facture avant le bon à payer, puis le relevé bancaire après. Le président décide, un autre vérifie.",
        },
        {
          texte: "Il retire la signature bancaire au président et la confie au chef d'équipe de l'atelier",
          juste: false,
          retour: "Ce serait donner les fonds à celui qui reçoit les biens : un autre cumul, plus dangereux. Le président garde la signature ; on contrôle autour de lui.",
        },
        {
          texte: "Rien : le dirigeant d'une petite entreprise est par nature au-dessus de tout contrôle",
          juste: false,
          retour: "Le contrôle ne vise pas sa probité : il protège aussi le président contre ses propres erreurs, et contre ceux qui se font passer pour un fournisseur.",
        },
      ],
    },
    {
      id: "les-droits-du-pgi",
      objectifs: [0],
      type: "tri",
      titre: "Les droits dans le PGI",
      notions: ["payment_terms"],
      tableau: quiFaitQuoi,
      question: () =>
        "Le PGI partagé donne à chaque utilisateur des droits. Attribuez chaque droit à un seul titulaire, de sorte que personne ne puisse à la fois créer une dette, la payer et en effacer la trace.",
      relance: "Celui qui saisit ne paie pas ; celui qui paie valide ce qui touche aux coordonnées bancaires ; celui qui reçoit déclare ce qu'il a reçu ; le contrôle final revient à qui ne saisit pas.",
      categories: [
        { code: "presidente", libelle: "Le président" },
        { code: "chef-d-equipe", libelle: "Le chef d'équipe" },
        { code: "collaborateur", libelle: "Le collaborateur du cabinet" },
        { code: "expert-comptable", libelle: "L'expert-comptable" },
      ],
      elements: () => DROITS_DU_PGI.map((d) => ({ libelle: d.libelle, montant: 0, categorie: d.titulaire, pourquoi: d.pourquoi })),
      explication: () => [
        "Les droits du PGI sont la séparation des fonctions inscrite dans l'outil. Chaque utilisateur a son identifiant, jamais partagé, et le PGI garde la trace de qui a saisi, modifié ou validé quoi.",
      ],
    },
    {
      id: "predire-la-fraude",
      objectifs: [1],
      type: "choix",
      titre: "Pariez sur le courriel",
      notions: ["payment_terms"],
      tableau: leCourriel,
      question: (c) => {
        const x = securiteDuChapitre(c);
        return `Le ${COURRIEL_FRAUDULEUX.date.jour} décembre N, ce courriel arrive. Pariez : si le président vire la facture ${dE(x.fournisseur)} sur le nouvel IBAN et que le courriel est faux, que perd ${x.entreprise} ?`;
      },
      options: () => {
        const voir = "L'étape suivante dit ce que la procédure fait de ce courriel, puis on chiffrera.";
        return [
          { texte: "La facture, et la dette reste due", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Rien : la banque rembourse un virement détourné", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Rien : le fournisseur porte le risque de son courriel", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "la-procedure-qui-arrete",
      objectifs: [1],
      type: "choix",
      titre: "La procédure qui arrête la fraude",
      notions: ["payment_terms"],
      tableau: leCourriel,
      question: (c) => `La procédure de ${securiteDuChapitre(c).entreprise} prévoit un contrôle avant toute modification des coordonnées bancaires d'un fournisseur. Lequel arrête ce courriel ?`,
      options: (c) => {
        const x = securiteDuChapitre(c);
        return [
          {
            texte: "Un contre-appel au numéro déjà connu du fournisseur",
            juste: true,
            retour: `Oui. Le numéro du fichier des fournisseurs, pas celui du courriel. ${x.fournisseur}, rappelé, n'a jamais changé de banque. Le président ne valide la modification qu'après ce contre-appel, et le PGI garde la trace des deux.`,
          },
          {
            texte: "Une réponse au courriel, pour demander au fournisseur de confirmer le nouvel IBAN par écrit",
            juste: false,
            retour: "Le fraudeur tient cette adresse : il confirmera. Un contrôle ne vaut que par une source indépendante de la demande.",
          },
          {
            texte: "Un relevé d'identité bancaire signé et tamponné au nom du fournisseur, joint au courriel",
            juste: false,
            retour: "Un document se contrefait aussi bien qu'un logo. Seul un canal déjà connu, établi avant la demande, prouve quelque chose.",
          },
        ];
      },
    },
    {
      id: "ce-que-la-fraude-aurait-coute",
      objectifs: [1],
      type: "montants",
      titre: "Ce que la fraude aurait coûté",
      notions: ["net_treasury", "income_statement"],
      tableau: leCourriel,
      question: (c) => {
        const x = securiteDuChapitre(c);
        return `Chiffrez le risque. La facture visée, le résultat net de N (${eur(x.fraude.resultatNet)}), et le compte courant au 31 décembre (${eur(x.fraude.compteCourant)}) : que représenterait la perte, en pourcentage de chacun, au centième ?`;
      },
      champs: (c) => {
        const x = securiteDuChapitre(c).fraude;
        return [
          { libelle: "Montant détourné", attendu: x.facture, calcul: `la facture du 10 décembre, toutes taxes comprises : ${eur(x.facture)}` },
          { libelle: "Part du résultat net, en %", attendu: auCentime(x.partDuResultat * 100), calcul: `${eur(x.facture)} ÷ ${eur(x.resultatNet)} × 100 = ${pct(x.partDuResultat)}`, tolerance: 0.01 },
          { libelle: "Part du compte courant, en %", attendu: auCentime(x.partDuCompteCourant * 100), calcul: `${eur(x.facture)} ÷ ${eur(x.compteCourant)} × 100 = ${pct(x.partDuCompteCourant)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const x = securiteDuChapitre(c).fraude;
        return [
          `${pct(x.partDuResultat)} du bénéfice de l'année, ${pct(x.partDuCompteCourant)} du compte courant. Et la dette resterait due : le vrai fournisseur n'aurait rien reçu, NOVA paierait deux fois. Un contre-appel prend quelques minutes.`,
        ];
      },
    },
    {
      id: "predire-le-cadrage",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur le cadrage de la TVA",
      notions: ["vat_payable"],
      question: (c) => {
        const x = securiteDuChapitre(c).cadrage;
        return `Les ventes comptabilisées de N font ${eur(x.ventesComptabilisees)}. Les bases déclarées sur les douze déclarations de TVA de l'année font ${eur(x.base)}. Pariez : cet écart…`;
      },
      options: () => {
        const voir = "Le cadrage, à l'étape suivante, le dira ligne par ligne.";
        return [
          { texte: "S'explique entièrement", juste: true, retour: `Bon pari. ${voir}` },
          { texte: "Prouve une TVA non déclarée", juste: false, retour: `Pari à vérifier. ${voir}` },
          { texte: "Prouve une vente oubliée en comptabilité", juste: false, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "le-cadrage-de-la-tva",
      objectifs: [2],
      type: "a-completer",
      titre: "Le cadrage de la TVA",
      notions: ["vat_payable", "income_statement"],
      tableau: chiffresDuCadrage,
      question: () =>
        "Passez des ventes comptabilisées à la base que les déclarations auraient dû porter. La TVA d'une vente se déclare à sa facture ; la comptabilité rattache la vente à sa livraison ; l'escompte réduit la base sans réduire les ventes.",
      grille: grilleDuCadrage,
      explication: (c) => {
        const x = securiteDuChapitre(c).cadrage;
        return [
          `La base reconstituée tombe sur les ${eur(x.base)} déclarés : l'écart de ${eur(x.ecart)} est expliqué, au centime. La TVA collectée de l'année, ${eur(x.tvaCollectee)}, est donc juste.`,
          "Un écart expliqué n'est pas une anomalie. Un écart qui reste, après les décalages et l'escompte, en est une : une facture non déclarée, ou une vente non comptabilisée. On le signale avant la déclaration suivante.",
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-facturation",
      objectifs: [2],
      type: "simulation",
      titre: "Le laboratoire de la facturation",
      notions: ["vat_payable"],
      question: () =>
        "Et si NOVA facturait autrement ? Choisissez quand se facture la commande urgente, livrée le 30 décembre, et quand se facturent les enceintes de décembre livrées en janvier. Le tableau suit les ventes comptabilisées, la base déclarée et l'écart.",
      leviers: () => {
        const d = departDuCadrage();
        return [
          {
            code: "commande",
            libelle: "Commande urgente facturée",
            unite: "",
            min: 0,
            max: 1,
            pas: 1,
            depart: d.commande,
            choix: [
              { valeur: COMMANDE_URGENTE.enJanvier, libelle: "le 4 janvier" },
              { valeur: COMMANDE_URGENTE.enDecembre, libelle: "le 30 décembre" },
            ],
          },
          {
            code: "livraison",
            libelle: "Livraison différée facturée",
            unite: "",
            min: 0,
            max: 1,
            pas: 1,
            depart: d.livraison,
            choix: [
              { valeur: LIVRAISON_DIFFEREE.enDecembre, libelle: "le 20 décembre" },
              { valeur: LIVRAISON_DIFFEREE.enJanvier, libelle: "à la livraison" },
            ],
          },
        ];
      },
      lecture: (c, p) => {
        const f = ficheDe(c);
        const l = cadrageDuLaboratoire(f, p);
        const d = cadrageDuLaboratoire(f, departDuCadrage());
        return [
          { libelle: "Ventes comptabilisées de N", montant: l.ventesComptabilisees, reference: d.ventesComptabilisees },
          { libelle: "Base déclarée sur l'année", montant: l.base, reference: d.base },
          { libelle: "TVA collectée déclarée", montant: l.tvaCollectee, reference: d.tvaCollectee },
          { libelle: "Écart à expliquer", montant: l.ecart, reference: d.ecart, fort: true },
          { libelle: "Dont les décalages de facturation", montant: l.decalages, reference: d.decalages },
        ];
      },
      defi: (c) => {
        const f = ficheDe(c);
        const d = cadrageDuLaboratoire(f, departDuCadrage());
        return {
          consigne: `Trouvez la facturation où l'écart ne vient plus que de l'escompte de Sonora, ${eur(d.escompte)} : aucun décalage de facturation.`,
          atteint: (p) => cadrageDuLaboratoire(f, p).decalages === 0,
          indice: (p) => `Les décalages font encore ${signe(cadrageDuLaboratoire(f, p).decalages)}. Une vente sans décalage se facture le jour où elle se livre.`,
          solution: SOLUTION_DU_CADRAGE,
        };
      },
      explication: (c) => {
        const f = ficheDe(c);
        const d = cadrageDuLaboratoire(f, departDuCadrage());
        return [
          `Les ventes comptabilisées n'ont jamais bougé, ${eur(d.ventesComptabilisees)} : la comptabilité rattache une vente à sa livraison, quelle que soit la date de la facture. Seule la base déclarée a suivi les factures.`,
          "Facturer à la livraison simplifie le cadrage, mais NOVA n'avait rien fait de faux : le cadrage sert justement à expliquer ces décalages, chaque année, avant que quelqu'un d'autre ne les demande.",
        ];
      },
    },
    {
      id: "la-dsn-face-aux-comptes",
      objectifs: [2],
      type: "montants",
      titre: "La DSN face aux comptes de la paie",
      notions: ["payroll"],
      question: (c) => {
        const x = securiteDuChapitre(c).paie;
        return `La déclaration sociale nominative de décembre déclare un brut de ${eur(x.brutDuMois)}. Recalculez ce qu'elle doit à l'URSSAF et à la caisse de retraite, aux taux de « La paie », puis l'écart avec les comptes 431 et 437 de la balance. Enfin, le brut déclaré sur l'année.`;
      },
      champs: (c) => {
        const x = securiteDuChapitre(c).paie;
        const t = ficheDe(c).tauxDeLaPaie;
        return [
          { libelle: "Cotisations URSSAF de la DSN", attendu: x.dsn.urssaf, calcul: `${eur(x.brutDuMois)} × (${pct(t.salarialUrssaf)} + ${pct(t.patronalUrssaf)}) = ${eur(x.dsn.urssaf)}` },
          { libelle: "Écart avec le compte 431", attendu: x.ecarts.urssaf, calcul: `${eur(x.dsn.urssaf)} − ${eur(x.comptes.urssaf)} = ${eur(x.ecarts.urssaf)}` },
          { libelle: "Cotisations de retraite de la DSN", attendu: x.dsn.retraite, calcul: `${eur(x.brutDuMois)} × (${pct(t.salarialRetraite)} + ${pct(t.patronalRetraite)}) = ${eur(x.dsn.retraite)}` },
          { libelle: "Brut déclaré sur l'année", attendu: x.brutDeLAnnee, calcul: `${eur(x.brutDuMois)} × 12 = ${eur(x.brutDeLAnnee)}, le compte 641 : écart de ${eur(x.ecarts.brut)}` },
        ];
      },
      explication: (c) => {
        const x = securiteDuChapitre(c).paie;
        return [
          `Tout concorde : la DSN et les comptes 431, 437 et 442 disent la même chose, au centime. Le prélèvement à la source, ${eur(x.dsn.prelevement)}, retombe aussi sur le 442.`,
          "Ce contrôle se fait chaque mois, avant de payer les organismes : un écart signale une cotisation mal paramétrée dans le logiciel de paie, ou un bulletin saisi deux fois.",
        ];
      },
    },
    {
      id: "conserver-les-documents",
      objectifs: [3],
      type: "tri",
      titre: "Combien de temps garder",
      notions: ["balance_sheet"],
      question: () =>
        "Rangez chaque document de N selon la durée pendant laquelle NOVA doit le conserver, à compter de la clôture ou de sa date. Quand deux règles visent le même document, la plus longue l'emporte.",
      relance: "Le code de commerce vise les livres et les pièces comptables ; le droit fiscal, ce qui fonde l'impôt sans être une pièce comptable ; le droit du travail et le droit commercial, le reste.",
      categories: [
        { code: "comptable", libelle: `${DUREES_DE_CONSERVATION.comptable} ans` },
        { code: "fiscale", libelle: `${DUREES_DE_CONSERVATION.fiscale} ans` },
        { code: "cinq", libelle: `${DUREES_DE_CONSERVATION.sociale} ans` },
      ],
      elements: () => [
        { libelle: "Les factures d'achat et de vente", montant: 0, categorie: "comptable", pourquoi: "Des pièces justificatives : le code de commerce les veut aussi longtemps que les livres." },
        { libelle: "Le grand livre, la balance et le FEC", montant: 0, categorie: "comptable", pourquoi: "Les livres comptables : la plus longue des durées." },
        { libelle: "Les déclarations de TVA déposées", montant: 0, categorie: "fiscale", pourquoi: "Un document fiscal : le délai du droit fiscal, qui couvre le droit de reprise de l'administration." },
        { libelle: "Le double des bulletins de paie", montant: 0, categorie: "cinq", pourquoi: "Le code du travail impose à l'employeur ce délai ; le salarié, lui, garde les siens sans limite." },
        { libelle: "Le contrat de vente signé avec CampusTech", montant: 0, categorie: "cinq", pourquoi: "Le délai de prescription des actions entre commerçants." },
      ],
      explication: () => [
        `Les pièces de N peuvent être contrôlées jusqu'au 31 décembre N+${DROIT_DE_REPRISE_EN_ANNEES}, en règle générale. Les garder plus longtemps ne coûte presque rien : une archive électronique, en double, hors de l'entreprise.`,
        "Archiver, c'est aussi pouvoir retrouver : un plan de classement par exercice, par journal et par numéro de pièce, des copies numérisées fidèles, et les factures électroniques gardées sous leur forme d'origine.",
      ],
    },
    {
      id: "le-fichier-des-ecritures",
      objectifs: [3],
      type: "choix",
      titre: "Le vérificateur demande le FEC",
      notions: ["balance_sheet"],
      question: () =>
        `Le ${CONTROLE_FISCAL.avis}, NOVA reçoit un avis de vérification de comptabilité sur l'exercice N. Le vérificateur vient le ${CONTROLE_FISCAL.premiereIntervention}. Que lui remet le cabinet, dès sa première intervention ?`,
      options: () => [
        {
          texte: `Le FEC de N : toutes les écritures, ${CONTROLE_FISCAL.zonesDuFec} zones par ligne`,
          juste: true,
          retour: `Oui. Le fichier des écritures comptables, tiré du PGI, au format normé : journal, numéro et date de l'écriture, compte, pièce, libellé, débit, crédit, lettrage, date de validation. Ne pas le remettre coûte une amende de ${eur(CONTROLE_FISCAL.amendePourDefautDeFec)}.`,
        },
        {
          texte: "Une copie papier du grand livre et de la balance, imprimée et signée par le président",
          juste: false,
          retour: "Une comptabilité tenue sur un logiciel se remet sous forme de fichier, le FEC : le vérificateur le traite lui-même, avec ses propres outils.",
        },
        {
          texte: "Rien avant d'avoir lu la proposition de rectification du vérificateur, pour ne pas s'exposer",
          juste: false,
          retour: `La proposition vient à la fin du contrôle ; le FEC, au début. NOVA pourra y répondre ensuite, dans les ${CONTROLE_FISCAL.delaiDeReponseEnJours} jours, assistée de son conseil.`,
        },
      ],
    },
    {
      id: "la-periode-close",
      objectifs: [3],
      type: "choix",
      titre: "Une période close",
      notions: ["balance_sheet"],
      question: () =>
        "En février N+1, vous voulez saisir une écriture datée du 15 décembre N. Le PGI la refuse : la période de décembre est clôturée. Pourquoi, et que faites-vous ?",
      options: () => [
        {
          texte: "Je la date du premier jour ouvert, avec sa vraie date",
          juste: true,
          retour:
            "Oui. La procédure de clôture fige la chronologie : une écriture validée ne se modifie plus, une période close ne se rouvre pas. L'opération oubliée se passe au premier jour de la période ouverte, en mentionnant la date où elle est survenue.",
        },
        {
          texte: "Je demande à l'expert-comptable de rouvrir décembre, le temps de la saisir à sa date",
          juste: false,
          retour: "Rouvrir une période close détruirait ce qu'elle garantit : que les écritures déclarées sont celles qui ont été tenues. Le FEC le montrerait.",
        },
        {
          texte: "Je modifie une écriture de décembre déjà validée pour y ajouter le montant oublié",
          juste: false,
          retour: "Une écriture validée est intangible : on ne la corrige que par une nouvelle écriture, jamais en la réécrivant.",
        },
      ],
    },
    {
      id: "le-compte-rendu",
      objectifs: [4],
      type: "choix",
      titre: "Le compte rendu au président",
      notions: ["payment_terms"],
      question: (c) => {
        const x = securiteDuChapitre(c);
        return `Votre compte rendu doit proposer une seule amélioration, la plus utile cette année. La fraude a visé ${eur(x.fraude.facture)} ; les cadrages concordent ; une majoration de TVA a été contestée sans l'accusé de réception du portail. Laquelle proposez-vous ?`;
      },
      options: () => [
        {
          texte: "Archiver chaque accusé de dépôt avec sa déclaration",
          juste: true,
          retour:
            "Oui. Les deux contrôles ont fonctionné ; ce qui a manqué, c'est une preuve. Une procédure écrite, un dossier par déclaration (TVA, DSN, liasse) avec son accusé de dépôt, tenu par le cabinet : la prochaine contestation se gagne.",
        },
        {
          texte: "Ajouter une seconde signature sur chaque virement, quel qu'en soit le montant, même le loyer",
          juste: false,
          retour: "La procédure du contre-appel a déjà arrêté la fraude. Une double signature sur tout ralentirait chaque paiement sans combler le vrai manque de l'année.",
        },
        {
          texte: "Refaire chaque mois le cadrage de la TVA, déjà juste au centime cette année",
          juste: false,
          retour: "Le cadrage annuel concorde : le refaire chaque mois est une bonne pratique, mais ce n'est pas le point faible que l'année a montré.",
        },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Synthèse",
      texte: (c) => {
        const x = securiteDuChapitre(c);
        return [
          "Un processus se décrit par ses étapes, ses pièces et ses acteurs. Le contrôle interne y sépare autoriser, détenir, enregistrer et contrôler ; quand la taille l'interdit, un contrôle compensatoire fait par un autre la remplace. Les droits du PGI l'inscrivent dans l'outil.",
          `Une coordonnée bancaire ne change jamais sans un contre-appel par un canal déjà connu : ce jour-là, ${eur(x.fraude.facture)} étaient en jeu. Les contrôles de cohérence comparent deux sources indépendantes : la TVA et les ventes, la DSN et les comptes de la paie.`,
          `Les livres et les pièces se gardent ${DUREES_DE_CONSERVATION.comptable} ans. Au contrôle fiscal, le FEC se remet dès la première intervention. Une période close ne se rouvre pas. Le compte rendu propose ce que l'année a montré de plus fragile.`,
        ];
      },
      repere: () =>
        "À l'examen : un schéma du processus, les fonctions séparées ou compensées, un risque nommé avec sa procédure, un contrôle de cohérence chiffré, une durée de conservation justifiée, une proposition argumentée.",
    },
  ],
};
