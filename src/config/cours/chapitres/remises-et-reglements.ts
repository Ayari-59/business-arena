import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import type { Cas } from "../cas";
import { dateDuCours as date } from "../dates";
import { coutDeLAvance, escompteMaximal, facture, tauxAnnuelDeLEscompte } from "../monde/facture";
import { JOURS_D_ESCOMPTE, JOURS_PAR_AN, TAUX_D_ESCOMPTE, TAUX_DE_REMISE } from "../remises";
import type { Chapitre, TableauDeDonnees } from "../types";
import { accordPluriel } from "../accords";
import { aNom, dE, deNom, delaiDuClient, nomDuClient, paiementDuClient } from "./creation-premier-bilan";

/**
 * CHAPITRE : REMISES ET RÈGLEMENTS (comptabilité générale, palier 3 ; BTS CG, DCG UE9, BUT GEA).
 *
 * La vente à crédit et l'achat du chapitre pilote, avec ce que les professionnels négocient : une
 * remise sur la commande, un escompte pour un paiement rapide. L'élève établit la facture de vente
 * (net commercial, net financier, TVA sur le net financier), la passe, voit pourquoi la remise ne
 * s'enregistre pas et l'escompte si, encaisse le client. Puis, côté fournisseur, il ramène
 * l'escompte proposé à un taux annuel, le compare au taux de l'emprunt de l'entreprise, décide, et
 * passe la facture et le paiement. Enfin, côté client, il cherche l'escompte le plus fort qu'on peut
 * accorder sans payer l'argent plus cher qu'un découvert.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : les montants avant réduction sont ceux du cas figé de
 * l'entreprise (monde/cas-des-entreprises.ts), dans les neuf entreprises du cours ; les conditions
 * sont celles du cours (remises.ts) ; la facture, le taux annuel de l'escompte et l'escompte
 * maximal se calculent par le modèle du monde (monde/facture.ts).
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui de l'examen) :
 *   · guidé : intro, facture-de-vente (l'ordre de la facture est au repère, la question nomme les
 *     taux), ecriture-de-vente, encaissement, facture-d-achat, paiement-fournisseur ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) :
 *     predire-l-escompte puis jours-d-avance (un curseur sur les jours de paiement avancés :
 *     l'escompte obtenu face aux intérêts de l'argent avancé, au taux de l'emprunt) avant
 *     escompte-du-fournisseur ; predire-l-escompte-accorde puis le-laboratoire-de-l-escompte (la
 *     remise, l'escompte, les jours d'avance et le taux du découvert ; un graphique du coût annuel
 *     de l'escompte selon les jours) avant l-escompte-maximal ;
 *   · autonome : remise-ou-escompte, escompte-du-fournisseur, decision (ni formule ni chiffres à
 *     prendre ; le calcul de la correction montre le chemin) ;
 *   · expert : l-escompte-maximal (le taux de la période, l'escompte maximal et son montant),
 *     a-rebours (retrouver le prix brut et la quantité à partir du seul net à payer), en-cascade
 *     (une variante chiffrée : une remise et un rabais en cascade), critique (une remise à la place
 *     de l'escompte ?) ; puis la synthèse.
 *
 * Ce qui a disparu : « les montants avant réduction sont ceux de l'arène » et la lecture des délais
 * dans la trésorerie de l'arène (la synthèse finit sur la phrase commune du monde du cours).
 */

// ─────────────────────────────────────────────────────────────────────────────
// LES HYPOTHÈSES DU CHAPITRE
// ─────────────────────────────────────────────────────────────────────────────

/** La borne haute du curseur des jours d'avance : au-delà de tout délai du cours. */
export const JOURS_MAX_DU_CURSEUR = 240;

/** Le taux du découvert du laboratoire, hypothèse du cours : 8 % l'an, plus cher que tous les emprunts du cours. */
export const TAUX_DU_DECOUVERT = 0.08;

/** Les bornes et les pas des leviers du laboratoire, en points de pourcentage et en jours. */
export const LEVIERS_DU_LABORATOIRE = {
  remise: { min: 0, max: 10, pas: 0.5 },
  escompte: { min: 0, max: 4, pas: 0.1 },
  jours: { min: 10, max: 90, pas: 1 },
  taux: { min: 0, max: 12, pas: 0.1 },
} as const;

/** La deuxième commande du calcul à rebours, hypothèse du cours : la moitié de la première, aux mêmes conditions. */
export const PART_DE_LA_DEUXIEME_COMMANDE = 0.5;

/** Le rabais de la variante en cascade, hypothèse du cours : 3 % pour un retard, après la remise. */
export const RABAIS_DE_LA_VARIANTE = 0.03;

// ─────────────────────────────────────────────────────────────────────────────
// LES OUTILS
// ─────────────────────────────────────────────────────────────────────────────

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
const pct = (t: number, d = 2) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: d })} %`;
/** Un pourcentage du laboratoire, en points (5 pour 5 %), arrondi au dixième pour éviter les restes de virgule. */
const aDixieme = (x: number) => Math.round(x * 10) / 10;

/** La facture de vente au client professionnel, avec remise et escompte. */
export function factureDeVente(c: Cas) {
  const v = c.venteCredit;
  const f = facture({ quantite: v.quantite, prixUnitaire: v.prixUnitaire, reductions: [{ nature: "remise", taux: TAUX_DE_REMISE }], escompte: TAUX_D_ESCOMPTE, tauxDeTva: v.tauxTva });
  return {
    brut: f.brut,
    remise: f.reductions[0]!.montant,
    netCommercial: f.netCommercial,
    escompte: f.escompte,
    netFinancier: f.netFinancier,
    tauxTva: v.tauxTva,
    tva: f.tva,
    ttc: f.netAPayer,
    date: v.date,
    paiement: v.date + JOURS_D_ESCOMPTE,
    /** Les jours dont le règlement est avancé : du délai réel du client au délai de l'escompte. */
    joursAvances: v.delai - JOURS_D_ESCOMPTE,
  };
}

/** L'achat au fournisseur, et ce que vaut son escompte ramené à l'année. */
export function factureDAchat(c: Cas) {
  const a = c.achat;
  const netCommercial = a.ht;
  const escompte = auCentime(netCommercial * TAUX_D_ESCOMPTE);
  const netFinancier = auCentime(netCommercial - escompte);
  const tva = auCentime(netFinancier * a.tauxTva);
  const joursGagnes = a.delai - JOURS_D_ESCOMPTE;
  // Payer plus tôt, c'est prêter le net financier au fournisseur pendant les jours gagnés, contre
  // l'escompte : son taux, rapporté à l'année.
  const tauxAnnuel = tauxAnnuelDeLEscompte(TAUX_D_ESCOMPTE, joursGagnes);
  // Le curseur : le plus de jours d'avance que l'escompte paie encore, au taux de l'emprunt.
  const joursQuePaieLEscompte = Math.floor((escompte * JOURS_PAR_AN) / (netFinancier * c.pret.tauxAnnuel) + 1e-9);
  return {
    netCommercial,
    escompte,
    netFinancier,
    tauxTva: a.tauxTva,
    tva,
    ttc: auCentime(netFinancier + tva),
    joursGagnes,
    tauxAnnuel,
    vautLaPeine: tauxAnnuel > c.pret.tauxAnnuel,
    interetsDesJoursGagnes: coutDeLAvance(netFinancier, c.pret.tauxAnnuel, joursGagnes),
    joursQuePaieLEscompte,
    date: a.date,
    paiement: a.date + JOURS_D_ESCOMPTE,
  };
}

/** Une position du laboratoire de l'escompte : remise, escompte et taux en points (5 pour 5 %), jours d'avance. */
export interface PositionDeLEscompte {
  remise: number;
  escompte: number;
  jours: number;
  taux: number;
}

/** La position du cas : celle d'où part le laboratoire. */
export function departDeLEscompte(c: Cas): PositionDeLEscompte {
  return { remise: TAUX_DE_REMISE * 100, escompte: TAUX_D_ESCOMPTE * 100, jours: factureDeVente(c).joursAvances, taux: aDixieme(c.pret.tauxAnnuel * 100) };
}

/** L'escompte le plus fort, au dixième de point inférieur, qui ne coûte pas plus que le découvert du défi. */
export function escompteDuDefi(c: Cas) {
  const t = escompteMaximal(TAUX_DU_DECOUVERT, factureDeVente(c).joursAvances);
  return Math.floor(t * 1000 + 1e-9) / 10;
}

/** LE LABORATOIRE DE L'ESCOMPTE : la facture du client et ce que coûte l'escompte face au découvert. */
export function laboratoireDeLEscompte(c: Cas, p: PositionDeLEscompte) {
  const v = c.venteCredit;
  const f = facture({ quantite: v.quantite, prixUnitaire: v.prixUnitaire, reductions: [{ nature: "remise", taux: p.remise / 100 }], escompte: p.escompte / 100, tauxDeTva: v.tauxTva });
  const coutAnnuel = p.escompte >= 100 ? Infinity : tauxAnnuelDeLEscompte(p.escompte / 100, p.jours);
  const interetsEvites = coutDeLAvance(f.netFinancier, p.taux / 100, p.jours);
  return {
    netCommercial: f.netCommercial,
    escompte: f.escompte,
    netFinancier: f.netFinancier,
    netAPayer: f.netAPayer,
    /** En points de pourcentage, au centième. */
    coutAnnuel: auCentime(coutAnnuel * 100),
    interetsEvites,
    gain: auCentime(interetsEvites - f.escompte),
    coutAnnuelExact: coutAnnuel,
  };
}

/** L'escompte le plus fort qu'on peut accorder face à un découvert, en formule, pour la formalisation. */
export function escompteMaximalDuClient(c: Cas) {
  const v = factureDeVente(c);
  const periode = (TAUX_DU_DECOUVERT * v.joursAvances) / JOURS_PAR_AN;
  const maximal = escompteMaximal(TAUX_DU_DECOUVERT, v.joursAvances);
  const auCentieme = Math.round(maximal * 10_000) / 10_000;
  return { periode, maximal, auCentieme, montant: auCentime(v.netCommercial * auCentieme) };
}

/** La deuxième commande, aux mêmes conditions : ce que le client a payé, et tout ce qu'on en remonte. */
export function deuxiemeCommande(c: Cas) {
  const v = c.venteCredit;
  const quantite = Math.round(v.quantite * PART_DE_LA_DEUXIEME_COMMANDE);
  const f = facture({ quantite, prixUnitaire: v.prixUnitaire, reductions: [{ nature: "remise", taux: TAUX_DE_REMISE }], escompte: TAUX_D_ESCOMPTE, tauxDeTva: v.tauxTva });
  return { quantite, brut: f.brut, netCommercial: f.netCommercial, netFinancier: f.netFinancier, tva: f.tva, netAPayer: f.netAPayer };
}

/** La variante : la remise, puis un rabais en cascade, puis l'escompte. */
export function factureEnCascade(c: Cas) {
  const v = c.venteCredit;
  const f = facture({
    quantite: v.quantite,
    prixUnitaire: v.prixUnitaire,
    reductions: [
      { nature: "remise", taux: TAUX_DE_REMISE },
      { nature: "rabais", taux: RABAIS_DE_LA_VARIANTE },
    ],
    escompte: TAUX_D_ESCOMPTE,
    tauxDeTva: v.tauxTva,
  });
  // L'erreur classique : additionner les deux taux et les prendre sur le brut.
  const enAdditionnant = auCentime(f.brut * (1 - TAUX_DE_REMISE - RABAIS_DE_LA_VARIANTE));
  return { ...f, remise: f.reductions[0]!, rabais: f.reductions[1]!, enAdditionnant };
}

/** La facture du client, au départ : le document des étapes de vente. */
function tableauDeLaVente(c: Cas): TableauDeDonnees {
  const d = delaiDuClient(c);
  return {
    titre: `La commande ${deNom(nomDuClient(c.venteCredit.client))} · ${c.entreprise}`,
    colonnes: ["Conditions"],
    lignes: [
      { libelle: `${qte(c.venteCredit.quantite)} ${c.unites} à ${eur(c.venteCredit.prixUnitaire)} hors taxes`, valeurs: [eur(c.venteCredit.ht)] },
      { libelle: "Remise sur la commande", valeurs: [pct(TAUX_DE_REMISE)] },
      { libelle: `Escompte pour un paiement sous ${qte(JOURS_D_ESCOMPTE)} jours`, valeurs: [pct(TAUX_D_ESCOMPTE)] },
      { libelle: "Taux de TVA", valeurs: [pct(c.venteCredit.tauxTva, 1)] },
      { libelle: "Délai de paiement convenu", valeurs: [`${qte(d.convenu)} jours`] },
      { libelle: "Délai de paiement constaté", valeurs: [`${qte(d.reel)} jours`] },
    ],
  };
}

export const REMISES_ET_REGLEMENTS: Chapitre = {
  code: "remises-et-reglements",
  parcours: "comptabilite-generale",
  palier: 3,
  blocs: [
    "BTS CG P1 · Contrôle et traitement comptable des opérations commerciales",
    "DCG UE9 · Comptabilité",
    "Bac pro AGORA Bloc 2 · Organiser et suivre l'activité de production (de biens ou de services)",
    "BUT GEA · Produire l'information comptable, fiscale et sociale de l'organisation",
  ],
  titre: "Remises et règlements",
  accroche:
    "Ce que les professionnels négocient sur une facture : la remise qui baisse le prix, l'escompte qui paie la rapidité, et le calcul qui dit s'il vaut la peine, à prendre comme à accorder.",
  objectifs: [
    "Établir une facture avec remise et escompte : net commercial, net financier, TVA",
    "Distinguer une réduction commerciale, qui ne s'enregistre pas, d'une réduction financière, qui s'enregistre",
    "Passer la facture et le règlement, côté client et côté fournisseur",
    "Ramener un escompte à un taux annuel, et décider s'il vaut la peine",
    "Chiffrer l'escompte le plus fort qu'on peut accorder face au coût d'un découvert, et remonter une facture à rebours",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce qui se négocie",
      notions: ["payment_terms"],
      tableau: tableauDeLaVente,
      texte: (c) => {
        const client = nomDuClient(c.venteCredit.client);
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${c.entreprise}, sur la vente et l'achat du premier chapitre. Dans le premier chapitre, ${client} achète au prix affiché et ${paiementDuClient(c)}. Entre professionnels, une facture se négocie souvent.`,
          `Deux sortes de réductions. Les réductions commerciales baissent le prix : la remise sur une grosse commande, le rabais pour un défaut ou un retard, la ristourne de fin d'année. La réduction financière, l'escompte, paie la rapidité : le client qui règle dans les ${qte(JOURS_D_ESCOMPTE)} jours paie un peu moins.`,
          `Ce que la simulation suppose : les montants avant réduction sont ceux du cas ; les conditions sont celles du cours, une remise de ${pct(TAUX_DE_REMISE)} et un escompte de ${pct(TAUX_D_ESCOMPTE)} pour un paiement sous ${qte(JOURS_D_ESCOMPTE)} jours ; l'année commerciale compte ${qte(JOURS_PAR_AN)} jours ; l'argent avancé se finance au taux de l'emprunt de l'entreprise, ${pct(c.pret.tauxAnnuel)}, ou par un découvert à ${pct(TAUX_DU_DECOUVERT)}.`,
        ];
      },
      repere: () =>
        "Une facture se calcule toujours dans le même ordre : prix brut, moins les réductions commerciales (net commercial), moins l'escompte (net financier), plus la TVA sur ce net financier.",
    },
    {
      id: "facture-de-vente",
      type: "montants",
      titre: "La facture du client",
      notions: ["payment_terms", "vat_payable"],
      question: (c) => {
        const f = factureDeVente(c);
        return `${qte(c.venteCredit.quantite)} ${c.unites} à ${eur(c.venteCredit.prixUnitaire)} : ${eur(f.brut)} hors taxes, avant réductions. Remise de ${pct(TAUX_DE_REMISE)}, escompte de ${pct(TAUX_D_ESCOMPTE)}, TVA à ${pct(f.tauxTva, 1)}. Établissez la facture.`;
      },
      champs: (c) => {
        const f = factureDeVente(c);
        return [
          { libelle: "Remise", attendu: f.remise, calcul: `${eur(f.brut)} × ${pct(TAUX_DE_REMISE)} = ${eur(f.remise)}` },
          { libelle: "Net commercial", attendu: f.netCommercial, calcul: `${eur(f.brut)} − ${eur(f.remise)} = ${eur(f.netCommercial)}` },
          { libelle: "Escompte", attendu: f.escompte, calcul: `${eur(f.netCommercial)} × ${pct(TAUX_D_ESCOMPTE)} = ${eur(f.escompte)}` },
          { libelle: "Net financier", attendu: f.netFinancier, calcul: `${eur(f.netCommercial)} − ${eur(f.escompte)} = ${eur(f.netFinancier)}` },
          { libelle: "TVA", attendu: f.tva, calcul: `${eur(f.netFinancier)} × ${pct(f.tauxTva, 1)} = ${eur(f.tva)}` },
          { libelle: "Net à payer", attendu: f.ttc, calcul: `${eur(f.netFinancier)} + ${eur(f.tva)} = ${eur(f.ttc)}` },
        ];
      },
      explication: (c) => {
        const f = factureDeVente(c);
        return [
          "Chaque réduction se calcule sur le montant qui la précède : l'escompte sur le net commercial, pas sur le brut.",
          `La TVA porte sur le net financier, ${eur(f.netFinancier)} : quand l'escompte figure sur la facture, l'État ne taxe que ce que le client paie vraiment.`,
        ];
      },
    },
    {
      id: "ecriture-de-vente",
      type: "ecriture",
      titre: "La vente, au journal",
      notions: ["payment_terms", "vat_payable"],
      evenement: (c) => {
        const f = factureDeVente(c);
        return `Le ${date(f.date)}, ${c.entreprise} envoie la facture ${aNom(nomDuClient(c.venteCredit.client))} : ${eur(f.ttc)} à payer, escompte déduit, si le règlement arrive avant le ${date(f.paiement)}.`;
      },
      ecriture: (c) => {
        const f = factureDeVente(c);
        return {
          date: date(f.date),
          libelle: `Facture ${c.venteCredit.client}`,
          lignes: [
            { role: "la créance sur le client", compte: "411", sens: "debit", montant: f.ttc, indice: "le net à payer de la facture" },
            { role: "l'escompte accordé", compte: "665", sens: "debit", montant: f.escompte, indice: "l'escompte de la facture" },
            { role: "la vente, au net commercial", compte: c.venteCredit.compte, acceptes: c.venteCredit.acceptes, sens: "credit", montant: f.netCommercial, indice: "le net commercial : le prix après remise" },
            { role: "la TVA collectée", compte: "44571", sens: "credit", montant: f.tva, indice: "la TVA de la facture" },
          ],
        };
      },
      indices: () => [
        "La remise ne s'écrit nulle part : la vente s'enregistre directement au net commercial, le vrai prix.",
        "L'escompte, lui, est une charge financière de l'entreprise qui l'accorde : les escomptes accordés, classe 6. Le client doit le net à payer.",
      ],
      explication: (c) => {
        const f = factureDeVente(c);
        return [
          `Les ventes portent ${eur(f.netCommercial)}, le prix après remise. L'escompte, ${eur(f.escompte)}, est une charge financière : c'est le prix d'un règlement plus rapide pour ${c.entreprise}.`,
        ];
      },
      vue: "resultat",
    },
    {
      id: "remise-ou-escompte",
      type: "choix",
      titre: "Remise et escompte",
      notions: ["payment_terms"],
      question: () => "Pourquoi la remise ne s'enregistre-t-elle pas, alors que l'escompte s'enregistre ?",
      options: () => [
        {
          texte: "La remise baisse le prix de vente ; l'escompte est le coût d'un service financier, payer plus tôt.",
          juste: true,
          retour:
            "C'est cela. Le chiffre d'affaires est le prix réellement consenti : la remise en fait partie. L'escompte rémunère l'argent reçu plus tôt : il se lit avec les charges financières, à côté des intérêts.",
        },
        { texte: "La remise est trop petite pour être enregistrée.", juste: false, retour: "La taille n'y fait rien : une remise, même grosse, réduit le prix et ne s'écrit pas à part." },
        {
          texte: "L'escompte est soumis à la TVA, pas la remise.",
          juste: false,
          retour: "C'est l'inverse qui se passe : les deux réduisent la base de la TVA. La différence est ailleurs : l'une change le prix, l'autre paie la rapidité.",
        },
      ],
    },
    {
      id: "encaissement",
      type: "ecriture",
      titre: "Le client paie à temps",
      notions: ["payment_terms"],
      evenement: (c) => {
        const f = factureDeVente(c);
        return `Le ${date(f.paiement)}, ${nomDuClient(c.venteCredit.client)} règle par virement, dans le délai de l'escompte : ${eur(f.ttc)}.`;
      },
      ecriture: (c) => {
        const f = factureDeVente(c);
        return {
          date: date(f.paiement),
          libelle: `Règlement ${c.venteCredit.client}`,
          lignes: [
            { role: "l'argent reçu en banque", compte: "512", sens: "debit", montant: f.ttc, indice: "le net à payer de la facture" },
            { role: "la créance qui s'éteint", compte: "411", sens: "credit", montant: f.ttc, indice: "le net à payer de la facture" },
          ],
        };
      },
      indices: () => ["La banque reçoit.", "La créance sur le client disparaît."],
      explication: (c) => {
        const f = factureDeVente(c);
        return [
          `${c.entreprise} encaisse le ${date(f.paiement)} au lieu d'attendre ${qte(c.venteCredit.delai)} jours : ${qte(f.joursAvances)} jours plus tôt. L'escompte a été passé avec la facture : le règlement solde simplement la créance.`,
        ];
      },
      vue: "resultat",
    },
    {
      id: "predire-l-escompte",
      type: "choix",
      titre: "Pariez sur l'escompte du fournisseur",
      notions: ["payment_terms"],
      question: (c) => {
        const a = factureDAchat(c);
        return `De son côté, ${c.achat.fournisseur} offre à ${c.entreprise} un escompte de ${pct(TAUX_D_ESCOMPTE)} pour payer sous ${qte(JOURS_D_ESCOMPTE)} jours au lieu de ${qte(c.achat.delai)}, soit ${qte(a.joursGagnes)} jours plus tôt. ${c.entreprise} emprunte à ${pct(c.pret.tauxAnnuel)} par an. Avant de calculer, pariez : ramené à une année, cet escompte vaut…`;
      },
      options: (c) => {
        const a = factureDAchat(c);
        const voir = "Faites varier les jours d'avance à l'étape suivante : le curseur montre jusqu'où l'escompte paie l'argent avancé.";
        return [
          { texte: `Bien plus que les ${pct(c.pret.tauxAnnuel)} de l'emprunt`, juste: a.vautLaPeine, retour: `Bon pari. ${voir}` },
          { texte: `${pct(TAUX_D_ESCOMPTE)}, le taux affiché sur la facture`, juste: false, retour: `Pari à vérifier : ${pct(TAUX_D_ESCOMPTE)} paie ${qte(a.joursGagnes)} jours, pas une année. ${voir}` },
          { texte: `Moins que les ${pct(c.pret.tauxAnnuel)} de l'emprunt`, juste: !a.vautLaPeine, retour: `Pari à vérifier. ${voir}` },
        ];
      },
    },
    {
      id: "jours-d-avance",
      type: "curseur",
      titre: "Jusqu'où l'escompte paie l'argent avancé",
      notions: ["payment_terms", "net_treasury"],
      question: (c) => {
        const a = factureDAchat(c);
        return `Payer sous ${qte(JOURS_D_ESCOMPTE)} jours rapporte ${eur(a.escompte)} d'escompte, mais avance ${eur(a.netFinancier)} au fournisseur : au taux de l'emprunt, ${pct(c.pret.tauxAnnuel)}, cet argent coûte des intérêts qui grandissent avec les jours d'avance. Faites varier les jours d'avance de 0 à ${qte(JOURS_MAX_DU_CURSEUR)}. Jusqu'à combien de jours l'escompte paie-t-il encore les intérêts de l'argent avancé ? Placez le curseur sur le plus grand nombre de jours, puis validez.`;
      },
      grandeur: () => ({ libelle: "Jours de paiement avancés", unite: "jours" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: factureDAchat(c).joursQuePaieLEscompte, max: JOURS_MAX_DU_CURSEUR }),
      zones: ["L'escompte paie l'argent avancé", "L'argent avancé coûte plus que l'escompte"],
      rates: () => ({
        dessous: "À ces jours, l'escompte paie encore largement les intérêts : cherchez le plus grand nombre de jours.",
        dessus: "À ces jours, les intérêts de l'argent avancé dépassent déjà l'escompte.",
      }),
      montrer: "Montrer la limite",
      lecture: (c, j) => {
        const a = factureDAchat(c);
        const interets = coutDeLAvance(a.netFinancier, c.pret.tauxAnnuel, j);
        return [
          { libelle: "Escompte obtenu", montant: a.escompte },
          { libelle: "Intérêts de l'argent avancé, au taux de l'emprunt", montant: interets },
          { libelle: "Gain du paiement rapide", montant: auCentime(a.escompte - interets), fort: true },
        ];
      },
      droites: (c) => {
        const a = factureDAchat(c);
        return {
          produit: () => a.escompte,
          cout: (j) => (a.netFinancier * c.pret.tauxAnnuel * j) / JOURS_PAR_AN,
          libelles: ["Escompte obtenu", "Intérêts de l'argent avancé"],
        };
      },
      explication: (c) => {
        const a = factureDAchat(c);
        return [
          `L'escompte de ${eur(a.escompte)} paie jusqu'à ${qte(a.joursQuePaieLEscompte)} jours d'intérêts au taux de l'emprunt. Le paiement n'est avancé que de ${qte(a.joursGagnes)} jours : ces jours ne coûtent que ${eur(a.interetsDesJoursGagnes)} d'intérêts, et l'escompte rapporte bien plus.`,
          `Dire « ${qte(a.joursQuePaieLEscompte)} jours paient ${pct(c.pret.tauxAnnuel)} l'an », ou dire que ${qte(a.joursGagnes)} jours d'escompte valent un taux annuel bien plus haut, c'est la même comparaison. L'étape suivante calcule ce taux.`,
        ];
      },
    },
    {
      id: "escompte-du-fournisseur",
      type: "montants",
      titre: "L'escompte du fournisseur",
      notions: ["payment_terms"],
      question: (c) => {
        const f = factureDAchat(c);
        return `Sans formule cette fois. Sur la facture ${dE(c.achat.fournisseur)}, ${eur(f.netCommercial)} hors taxes, calculez l'escompte obtenu, le net financier à payer, les jours de paiement avancés, puis le taux annuel de l'escompte.`;
      },
      champs: (c) => {
        const f = factureDAchat(c);
        return [
          { libelle: "Escompte obtenu", attendu: f.escompte, calcul: `${eur(f.netCommercial)} × ${pct(TAUX_D_ESCOMPTE)} = ${eur(f.escompte)}` },
          { libelle: "Net financier à payer, hors taxes", attendu: f.netFinancier, calcul: `${eur(f.netCommercial)} − ${eur(f.escompte)} = ${eur(f.netFinancier)}` },
          { libelle: "Jours de paiement avancés", attendu: f.joursGagnes, calcul: `${qte(c.achat.delai)} − ${qte(JOURS_D_ESCOMPTE)} = ${qte(f.joursGagnes)} jours` },
          {
            libelle: "Taux annuel de l'escompte, en %",
            attendu: auCentime(f.tauxAnnuel * 100),
            calcul: `${eur(f.escompte)} ÷ ${eur(f.netFinancier)} × ${qte(JOURS_PAR_AN)} ÷ ${qte(f.joursGagnes)} = ${pct(f.tauxAnnuel)} : l'escompte rapporté à l'argent avancé, puis à l'année`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const f = factureDAchat(c);
        return [
          `Payer ${qte(f.joursGagnes)} jours plus tôt, c'est avancer ${eur(f.netFinancier)} à son fournisseur pendant ${qte(f.joursGagnes)} jours, contre ${eur(f.escompte)}. Rapporté à l'année, ce placement rapporte ${pct(f.tauxAnnuel)}. L'escompte se rapporte au net financier, l'argent vraiment avancé, et non au net commercial.`,
        ];
      },
    },
    {
      id: "decision",
      type: "choix",
      titre: "Le prendre ou non",
      notions: ["payment_terms", "net_treasury"],
      question: (c) => {
        const f = factureDAchat(c);
        return `L'escompte vaut ${pct(f.tauxAnnuel)} par an. ${c.entreprise} emprunte à ${pct(c.pret.tauxAnnuel)}. Que faire ?`;
      },
      options: (c) => {
        const f = factureDAchat(c);
        return [
          {
            texte: `Payer sous ${qte(JOURS_D_ESCOMPTE)} jours et prendre l'escompte, si la trésorerie le permet.`,
            juste: f.vautLaPeine,
            retour: f.vautLaPeine
              ? `Oui : l'escompte rapporte bien plus que ce que coûte l'argent à l'entreprise. Même en finançant l'avance par un découvert, elle y gagne, tant que le découvert coûte moins de ${pct(f.tauxAnnuel)} par an.`
              : "Non : l'argent coûte plus à l'entreprise que l'escompte ne rapporte.",
          },
          {
            texte: "Payer à l'échéance : garder sa trésorerie le plus longtemps possible.",
            juste: !f.vautLaPeine,
            retour: !f.vautLaPeine
              ? "Oui : l'escompte rapporte moins que ce que coûte l'argent."
              : `Garder sa trésorerie a un prix : ici, renoncer à ${pct(f.tauxAnnuel)} par an, quand l'argent ne coûte que ${pct(c.pret.tauxAnnuel)}.`,
          },
          {
            texte: `Peu importe : ${pct(TAUX_D_ESCOMPTE)}, c'est négligeable.`,
            juste: false,
            retour: `${pct(TAUX_D_ESCOMPTE)} pour ${qte(f.joursGagnes)} jours, c'est ${pct(f.tauxAnnuel)} par an : c'est tout sauf négligeable.`,
          },
        ];
      },
    },
    {
      id: "facture-d-achat",
      type: "ecriture",
      titre: "La facture du fournisseur",
      notions: ["payment_terms", "vat_payable"],
      evenement: (c) => {
        const f = factureDAchat(c);
        return `Le ${date(f.date)}, ${c.entreprise} reçoit la facture ${dE(c.achat.fournisseur)}, escompte déduit : ${eur(f.netCommercial)} hors taxes, ${eur(f.escompte)} d'escompte, ${eur(f.tva)} de TVA, ${eur(f.ttc)} à payer avant le ${date(f.paiement)}.`;
      },
      ecriture: (c) => {
        const f = factureDAchat(c);
        return {
          date: date(f.date),
          libelle: `Facture ${c.achat.fournisseur}`,
          lignes: [
            { role: "l'achat, au net commercial", compte: c.achat.compte, acceptes: c.achat.acceptes, sens: "debit", montant: f.netCommercial, indice: "le montant hors taxes, avant escompte" },
            { role: "la TVA déductible", compte: "44566", sens: "debit", montant: f.tva, indice: "la TVA de la facture, sur le net financier" },
            { role: "la dette fournisseur", compte: "401", sens: "credit", montant: f.ttc, indice: "le net à payer de la facture" },
            { role: "l'escompte obtenu", compte: "765", sens: "credit", montant: f.escompte, indice: "l'escompte de la facture" },
          ],
        };
      },
      indices: () => [
        "L'achat au net commercial, la TVA déductible : au débit, comme toujours.",
        "Au crédit, la dette fournisseur pour le net à payer, et l'escompte obtenu : un produit financier, classe 7.",
      ],
      explication: (c) => {
        const f = factureDAchat(c);
        return [`C'est l'écriture miroir de la vente : ici, l'escompte de ${eur(f.escompte)} est un produit financier, gagné en payant vite.`];
      },
      vue: "resultat",
    },
    {
      id: "paiement-fournisseur",
      type: "ecriture",
      titre: "Le fournisseur est payé",
      notions: ["payment_terms"],
      evenement: (c) => {
        const f = factureDAchat(c);
        return `Le ${date(f.paiement)}, ${c.entreprise} vire ${eur(f.ttc)} à ${c.achat.fournisseur}.`;
      },
      ecriture: (c) => {
        const f = factureDAchat(c);
        return {
          date: date(f.paiement),
          libelle: `Règlement ${c.achat.fournisseur}`,
          lignes: [
            { role: "la dette fournisseur qui s'éteint", compte: "401", sens: "debit", montant: f.ttc, indice: "le net à payer de la facture" },
            { role: "le paiement par la banque", compte: "512", sens: "credit", montant: f.ttc, indice: "le net à payer de la facture" },
          ],
        };
      },
      indices: () => ["La dette fournisseur disparaît.", "La banque paie."],
      explication: (c) => {
        const f = factureDAchat(c);
        return [`La dette est soldée ${qte(f.joursGagnes)} jours avant l'échéance, et l'entreprise a gagné ${eur(f.escompte)}.`];
      },
      vue: "resultat",
    },
    {
      id: "predire-l-escompte-accorde",
      type: "choix",
      titre: "Pariez sur l'escompte à accorder",
      notions: ["payment_terms", "net_treasury"],
      question: (c) => {
        const v = factureDeVente(c);
        return `Revenez au client. Payé sous ${qte(JOURS_D_ESCOMPTE)} jours, ${c.entreprise} reçoit son argent ${qte(v.joursAvances)} jours plus tôt. Supposez qu'elle finance cette attente par un découvert à ${pct(TAUX_DU_DECOUVERT)} l'an. Avant de manipuler, pariez : l'escompte le plus fort qu'elle peut accorder sans payer l'argent plus cher que le découvert est…`;
      },
      options: (c) => {
        const t = escompteMaximalDuClient(c).maximal;
        const voir = "Faites jouer l'escompte, les jours et le taux au laboratoire, à l'étape suivante.";
        return [
          { texte: `Moins que les ${pct(TAUX_D_ESCOMPTE)} des conditions du cours`, juste: t < TAUX_D_ESCOMPTE, retour: `Bon pari. ${voir}` },
          { texte: `Plus que les ${pct(TAUX_D_ESCOMPTE)} des conditions du cours`, juste: t > TAUX_D_ESCOMPTE, retour: `Pari à vérifier. ${voir}` },
          { texte: `${pct(TAUX_DU_DECOUVERT)}, le taux du découvert lui-même`, juste: false, retour: `Non : ${pct(TAUX_DU_DECOUVERT)} est un taux pour une année, l'escompte un taux pour ${qte(factureDeVente(c).joursAvances)} jours. ${voir}` },
        ];
      },
    },
    {
      id: "le-laboratoire-de-l-escompte",
      type: "simulation",
      titre: "Le laboratoire de l'escompte",
      notions: ["payment_terms", "net_treasury"],
      question: (c) =>
        `La commande du client reste la même. Faites varier la remise, l'escompte accordé, les jours dont le paiement est avancé et le taux du découvert qui finance l'attente. Le tableau suit la facture, le coût de l'escompte ramené à l'année et les intérêts que le paiement rapide évite ; le graphique, le coût annuel de l'escompte selon les jours d'avance. Relevez le défi pour ${c.entreprise}.`,
      leviers: (c) => {
        const d = departDeLEscompte(c);
        const l = LEVIERS_DU_LABORATOIRE;
        return [
          { code: "remise", libelle: "Remise", unite: "%", ...l.remise, depart: d.remise },
          { code: "escompte", libelle: "Escompte accordé", unite: "%", ...l.escompte, depart: d.escompte },
          { code: "jours", libelle: "Jours de paiement avancés", unite: "jours", ...l.jours, depart: d.jours },
          { code: "taux", libelle: "Taux annuel du découvert", unite: "%", ...l.taux, depart: d.taux },
        ];
      },
      lecture: (c, p) => {
        const l = laboratoireDeLEscompte(c, p as unknown as PositionDeLEscompte);
        const d = laboratoireDeLEscompte(c, departDeLEscompte(c));
        return [
          { libelle: "Net commercial", montant: l.netCommercial, reference: d.netCommercial },
          { libelle: "Escompte accordé, en euros", montant: l.escompte, reference: d.escompte },
          { libelle: "Net financier", montant: l.netFinancier, reference: d.netFinancier },
          { libelle: "Coût de l'escompte ramené à l'année", montant: l.coutAnnuel, unite: "%", reference: d.coutAnnuel },
          { libelle: "Taux annuel du découvert", montant: aDixieme(p.taux!), unite: "%", reference: departDeLEscompte(c).taux },
          { libelle: "Intérêts du découvert évités", montant: l.interetsEvites, reference: d.interetsEvites },
          { libelle: "Gain du paiement rapide, face au découvert", montant: l.gain, reference: d.gain, effet: true, fort: true },
        ];
      },
      // Le coût annuel de l'escompte selon les jours d'avance : une hyperbole, qui descend vite puis
      // lentement ; le taux du découvert, une droite plate. Elles se croisent aux jours où l'escompte
      // ne coûte plus que le découvert.
      graphique: (c) => ({
        levier: "jours",
        unite: "%",
        courbes: [
          { libelle: "Coût annuel de l'escompte", valeur: (p) => laboratoireDeLEscompte(c, p as unknown as PositionDeLEscompte).coutAnnuel },
          { libelle: "Taux annuel du découvert", valeur: (p) => aDixieme(p.taux!) },
        ],
      }),
      defi: (c) => {
        const v = factureDeVente(c);
        const solution: PositionDeLEscompte = { remise: TAUX_DE_REMISE * 100, escompte: escompteDuDefi(c), jours: v.joursAvances, taux: TAUX_DU_DECOUVERT * 100 };
        const tient = (escompte: number, jours: number) => tauxAnnuelDeLEscompte(escompte / 100, jours) <= TAUX_DU_DECOUVERT + 1e-12;
        return {
          consigne: `Avec un découvert à ${pct(TAUX_DU_DECOUVERT)} et ${qte(v.joursAvances)} jours de paiement avancés, accordez l'escompte le plus fort, au dixième de point, qui ne coûte pas plus que le découvert.`,
          atteint: (p) => {
            const e = aDixieme(p.escompte!);
            return aDixieme(p.taux!) === TAUX_DU_DECOUVERT * 100 && p.jours === v.joursAvances && tient(e, p.jours!) && !tient(aDixieme(e + LEVIERS_DU_LABORATOIRE.escompte.pas), p.jours!);
          },
          indice: (p) => {
            if (aDixieme(p.taux!) !== TAUX_DU_DECOUVERT * 100) return `Placez d'abord le découvert à ${pct(TAUX_DU_DECOUVERT)}.`;
            if (p.jours !== v.joursAvances) return `Placez les jours d'avance sur ceux du client : ${qte(v.joursAvances)}.`;
            const l = laboratoireDeLEscompte(c, p as unknown as PositionDeLEscompte);
            return l.coutAnnuelExact > TAUX_DU_DECOUVERT
              ? `À ${qte(aDixieme(p.escompte!))} %, l'escompte coûte ${qte(l.coutAnnuel)} % l'an : plus que le découvert. Baissez-le.`
              : `À ${qte(aDixieme(p.escompte!))} %, l'escompte coûte ${qte(l.coutAnnuel)} % l'an : vous pouvez encore l'augmenter sans dépasser le découvert.`;
          },
          solution: { ...solution },
        };
      },
      explication: (c, p) => {
        const l = laboratoireDeLEscompte(c, p as unknown as PositionDeLEscompte);
        return [
          `À ${qte(aDixieme(p.escompte!))} %, l'escompte coûte ${qte(l.coutAnnuel)} % l'an : juste sous le découvert. Un dixième de plus, et se faire payer vite coûterait plus cher que d'attendre en découvert. Les ${pct(TAUX_D_ESCOMPTE)} des conditions du cours coûtent ${qte(laboratoireDeLEscompte(c, departDeLEscompte(c)).coutAnnuel)} % l'an : une rapidité payée cher.`,
          "La remise n'y change rien : elle baisse le montant de l'escompte, pas son coût annuel, qui ne dépend que du taux et des jours. Le graphique le montre : plus le paiement est avancé de jours, moins un même escompte coûte à l'année.",
        ];
      },
    },
    {
      id: "l-escompte-maximal",
      type: "montants",
      titre: "L'escompte le plus fort, en formule",
      notions: ["payment_terms", "net_treasury"],
      question: (c) => {
        const v = factureDeVente(c);
        return `Formalisez ce que le laboratoire a montré. Accorder un escompte t ne coûte pas plus que le découvert tant que l'escompte, pris sur le net commercial, ne dépasse pas les intérêts du découvert sur le net financier, pour ${qte(v.joursAvances)} jours à ${pct(TAUX_DU_DECOUVERT)}. Calculez le coût du découvert sur la période, l'escompte le plus fort (au centième de point), puis son montant sur la facture du client à ce taux arrondi.`;
      },
      champs: (c) => {
        const v = factureDeVente(c);
        const m = escompteMaximalDuClient(c);
        return [
          {
            libelle: "Coût du découvert sur la période, en %",
            attendu: auCentime(m.periode * 100),
            tolerance: 0.01,
            calcul: `${pct(TAUX_DU_DECOUVERT)} × ${qte(v.joursAvances)} ÷ ${qte(JOURS_PAR_AN)} = ${pct(m.periode, 4)}`,
          },
          {
            libelle: "Escompte le plus fort, en %",
            attendu: auCentime(m.maximal * 100),
            tolerance: 0.01,
            calcul: `t ≤ (1 − t) × ${pct(m.periode, 4)}, soit t = ${pct(m.periode, 4)} ÷ (1 + ${pct(m.periode, 4)}) = ${pct(m.maximal, 4)}`,
          },
          { libelle: "Escompte sur la facture, à ce taux arrondi", attendu: m.montant, calcul: `${eur(v.netCommercial)} × ${pct(m.auCentieme)} = ${eur(m.montant)}` },
        ];
      },
      explication: (c) => {
        const m = escompteMaximalDuClient(c);
        return [
          `Le piège est dans la base : l'escompte se prend sur le net commercial, mais l'argent reçu plus tôt n'est que le net financier, déjà diminué de l'escompte. D'où t = taux de la période ÷ (1 + taux de la période) : ${pct(m.maximal, 2)}, un peu moins que les ${pct(m.periode, 2)} du découvert sur la période.`,
          `Au-delà, ${c.entreprise} paierait sa trésorerie plus cher qu'à la banque : un escompte ne se décide pas au jugé, il se compare à ce que coûte l'argent.`,
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "Remonter une facture à rebours",
      notions: ["payment_terms", "vat_payable"],
      question: (c) => {
        const k = deuxiemeCommande(c);
        return `Une deuxième commande du client, aux mêmes conditions (remise de ${pct(TAUX_DE_REMISE)}, escompte de ${pct(TAUX_D_ESCOMPTE)}, TVA à ${pct(c.venteCredit.tauxTva, 1)}, ${eur(c.venteCredit.prixUnitaire)} l'unité hors taxes) : le relevé ne montre que son règlement, ${eur(k.netAPayer)}, escompte déduit. Retrouvez le net financier, le net commercial, le prix brut, puis le nombre ${dE(c.unites)} ${accordPluriel(c, "commandé")}.`;
      },
      champs: (c) => {
        const k = deuxiemeCommande(c);
        const t = c.venteCredit.tauxTva;
        return [
          { libelle: "Net financier", attendu: k.netFinancier, tolerance: 0.05, calcul: `${eur(k.netAPayer)} ÷ ${(1 + t).toLocaleString("fr-FR")} = ${eur(k.netFinancier)}` },
          { libelle: "Net commercial", attendu: k.netCommercial, tolerance: 0.05, calcul: `${eur(k.netFinancier)} ÷ ${(1 - TAUX_D_ESCOMPTE).toLocaleString("fr-FR")} = ${eur(k.netCommercial)}` },
          { libelle: "Prix brut, hors taxes", attendu: k.brut, tolerance: 0.05, calcul: `${eur(k.netCommercial)} ÷ ${(1 - TAUX_DE_REMISE).toLocaleString("fr-FR")} = ${eur(k.brut)}` },
          { libelle: `Nombre ${dE(c.unites)}`, attendu: k.quantite, calcul: `${eur(k.brut)} ÷ ${eur(c.venteCredit.prixUnitaire)} = ${qte(k.quantite)}` },
        ];
      },
      explication: (c) => {
        const k = deuxiemeCommande(c);
        const t = c.venteCredit.tauxTva;
        return [
          `À rebours, chaque étape de la facture se défait dans l'ordre inverse, et chaque taux se défait en divisant : par 1 + ${pct(t, 1)} pour la TVA, par 1 − ${pct(TAUX_D_ESCOMPTE)} pour l'escompte, par 1 − ${pct(TAUX_DE_REMISE)} pour la remise.`,
          `L'erreur classique est d'ajouter les taux qu'on retire : ${eur(k.netAPayer)} × (1 − ${pct(t, 1)} + ${pct(TAUX_D_ESCOMPTE)} + ${pct(TAUX_DE_REMISE)}) ne donne pas le brut, parce que chaque taux porte sur un montant différent.`,
        ];
      },
    },
    {
      id: "en-cascade",
      type: "montants",
      titre: "Variante : une remise et un rabais en cascade",
      notions: ["payment_terms", "vat_payable"],
      question: (c) =>
        `Variante. La même commande arrive avec du retard, et ${c.entreprise} accorde, après la remise de ${pct(TAUX_DE_REMISE)}, un rabais de ${pct(RABAIS_DE_LA_VARIANTE)}. L'escompte reste de ${pct(TAUX_D_ESCOMPTE)}. Refaites la facture : le net commercial, l'escompte, le net financier, la TVA et le net à payer.`,
      champs: (c) => {
        const f = factureEnCascade(c);
        const t = c.venteCredit.tauxTva;
        return [
          {
            libelle: "Net commercial",
            attendu: f.netCommercial,
            calcul: `${eur(f.brut)} − ${eur(f.remise.montant)} de remise = ${eur(f.remise.netApres)}, puis − ${eur(f.rabais.montant)} de rabais (${pct(RABAIS_DE_LA_VARIANTE)} de ${eur(f.remise.netApres)}) = ${eur(f.netCommercial)}`,
          },
          { libelle: "Escompte", attendu: f.escompte, calcul: `${eur(f.netCommercial)} × ${pct(TAUX_D_ESCOMPTE)} = ${eur(f.escompte)}` },
          { libelle: "Net financier", attendu: f.netFinancier, calcul: `${eur(f.netCommercial)} − ${eur(f.escompte)} = ${eur(f.netFinancier)}` },
          { libelle: "TVA", attendu: f.tva, calcul: `${eur(f.netFinancier)} × ${pct(t, 1)} = ${eur(f.tva)}` },
          { libelle: "Net à payer", attendu: f.netAPayer, calcul: `${eur(f.netFinancier)} + ${eur(f.tva)} = ${eur(f.netAPayer)}` },
        ];
      },
      explication: (c) => {
        const f = factureEnCascade(c);
        return [
          `Le rabais se calcule sur le net après remise, pas sur le brut : ${pct(TAUX_DE_REMISE)} puis ${pct(RABAIS_DE_LA_VARIANTE)} ne font pas ${pct(TAUX_DE_REMISE + RABAIS_DE_LA_VARIANTE)}. Additionnés sur le brut, ils donneraient un net commercial de ${eur(f.enAdditionnant)}, au lieu de ${eur(f.netCommercial)}.`,
          "Comme la remise, le rabais ne s'écrit pas : la vente s'enregistre au net commercial. Seul l'escompte, réduction financière, a son compte.",
        ];
      },
    },
    {
      id: "critique",
      type: "choix",
      titre: "Une remise à la place de l'escompte ?",
      notions: ["payment_terms", "net_treasury"],
      question: (c) => {
        const v = factureDeVente(c);
        return `Le commercial ${dE(c.entreprise)} propose de supprimer l'escompte et d'accorder à la place ${pct(TAUX_D_ESCOMPTE)} de remise en plus, à tous les clients : « c'est la même somme, ${eur(v.escompte)} sur cette commande, et c'est plus simple ». Qu'en dites-vous ?`;
      },
      options: (c) => {
        const v = factureDeVente(c);
        return [
          {
            texte: `Pas la même chose : l'escompte achète ${qte(v.joursAvances)} jours de trésorerie, la remise n'achète rien`,
            juste: true,
            retour: `Oui. L'escompte n'est payé qu'au client qui règle vite, et il rapporte ${qte(v.joursAvances)} jours d'argent en banque ; la remise est donnée à tous, qu'ils paient tôt ou tard. Et elle baisse le chiffre d'affaires, quand l'escompte est une charge financière, qui se compare au coût du découvert.`,
          },
          {
            texte: "C'est la même chose : les deux baissent la TVA du même montant",
            juste: false,
            retour: "Les deux réduisent bien la base de la TVA, mais ce n'est pas la question : la remise est acquise à tous, l'escompte seulement à qui paie vite. L'une baisse le prix, l'autre paie la rapidité.",
          },
          {
            texte: "C'est mieux : la remise ne coûte rien, puisqu'elle ne s'enregistre pas",
            juste: false,
            retour: "Ne pas s'écrire à part ne veut pas dire ne rien coûter : la remise baisse le chiffre d'affaires, donc le résultat, du même montant, sans rien rapporter en échange.",
          },
        ];
      },
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["payment_terms"],
      texte: (c) => {
        const v = factureDeVente(c);
        const a = factureDAchat(c);
        const m = escompteMaximalDuClient(c);
        return [
          `Vous avez établi une facture avec remise et escompte, passé la vente et l'achat ${dE(c.entreprise)} avec leurs escomptes, et décidé, chiffres à l'appui, de payer vite. Sur ces deux factures, ${c.entreprise} a accordé ${eur(v.escompte)} d'escompte et en a obtenu ${eur(a.escompte)}.`,
          `Deux expériences l'ont montré avant la formule : un escompte de ${pct(TAUX_D_ESCOMPTE)} pour ${qte(a.joursGagnes)} jours vaut ${pct(a.tauxAnnuel, 1)} l'an ; et face à un découvert à ${pct(TAUX_DU_DECOUVERT)}, on ne peut accorder à ce client que ${pct(m.maximal, 2)} d'escompte sans payer l'argent plus cher.`,
          "Au niveau de l'examen, vous savez ramener un escompte à un taux annuel sur la bonne base, chiffrer l'escompte le plus fort qu'on peut accorder, remonter une facture à rebours du net à payer au prix brut, calculer des réductions en cascade, et dire pourquoi une remise ne remplace pas un escompte.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Réductions commerciales (remise, rabais, ristourne) : elles baissent le prix et ne s'enregistrent pas. Escompte : une charge financière pour qui l'accorde (665), un produit financier pour qui l'obtient (765). Taux annuel de l'escompte = t ÷ (1 − t) × 360 ÷ jours avancés.",
    },
  ],
};

