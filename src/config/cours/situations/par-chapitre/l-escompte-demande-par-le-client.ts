import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { aNom, deNom, nomDuClient, paiementDuClient } from "../../chapitres/creation-premier-bilan";
import { dateDuCours as date } from "../../dates";
import { coutDeLAvance, escompteMaximal, facture, tauxAnnuelDeLEscompte } from "../../monde/facture";
import { JOURS_D_ESCOMPTE, JOURS_PAR_AN, TAUX_D_ESCOMPTE, TAUX_DE_REMISE } from "../../remises";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « REMISES ET RÈGLEMENTS » : L'ESCOMPTE DEMANDÉ PAR LE CLIENT
 * (comptabilité générale, palier 3).
 *
 * Le client professionnel du cas demande un escompte plus fort que celui des conditions du cours
 * pour payer sous dix jours. Le gérant l'a accepté pour cette commande et demande s'il faut
 * l'accorder à l'avenir. L'élève établit la facture avec la remise et ce nouvel escompte, la passe
 * au journal, ramène l'escompte à un taux annuel, du côté de l'entreprise qui l'accorde cette fois,
 * cherche au curseur l'escompte le plus fort que paierait le taux de l'emprunt, puis croise : combien
 * de jours d'avance faudrait-il pour que l'escompte demandé ne coûte pas plus que l'emprunt, et que
 * coûte-t-il de plus sur cette facture ? La réponse demande un jugement.
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : les montants avant réduction sont ceux de la vente du cas figé
 * (monde/cas-des-entreprises.ts), la remise et le délai de l'escompte ceux du cours (remises.ts) ; la
 * facture, le taux annuel et l'escompte maximal se calculent par le modèle du monde
 * (monde/facture.ts). Les jours d'avance se comptent du délai où le client paie vraiment.
 */

/**
 * L'escompte que demande le client : 3 % au lieu des 2 % des conditions du cours. Un point de plus,
 * ce qu'un acheteur demande couramment quand il sait sa trésorerie précieuse pour son fournisseur.
 */
export const ESCOMPTE_DEMANDE = 0.03;

/** Le curseur de l'escompte compte en centièmes de point : 100 font 1 %. */
export const CENTIEMES_DE_POINT = 10_000;
/** La borne haute du curseur : 4 %, au-dessus de l'escompte demandé. */
export const ESCOMPTE_MAXIMAL_DU_CURSEUR = 400;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR");
const pct = (t: number, d = 2) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: d })} %`;
const majuscule = (s: string) => `${s.charAt(0).toUpperCase()}${s.slice(1)}`;
/** L'escompte demandé, rapporté au plafond que paie l'emprunt, en mots. */
const combienDePlus = (rapport: number) => (rapport >= 3 ? "plus du triple" : rapport >= 2 ? "plus du double" : rapport > 1 ? "davantage" : "moins que ce plafond");

/** La facture avec la remise et l'escompte demandé, et ce que cet escompte coûte ramené à l'année. */
export function escompteDemande(c: Cas) {
  const v = c.venteCredit;
  const f = facture({ quantite: v.quantite, prixUnitaire: v.prixUnitaire, reductions: [{ nature: "remise", taux: TAUX_DE_REMISE }], escompte: ESCOMPTE_DEMANDE, tauxDeTva: v.tauxTva });
  const joursAvances = v.delai - JOURS_D_ESCOMPTE;
  // Être payé plus tôt, c'est recevoir le net financier avant l'échéance, contre l'escompte : ce
  // qu'il coûte pour la période, puis rapporté à l'année.
  const tauxPeriode = ESCOMPTE_DEMANDE / (1 - ESCOMPTE_DEMANDE);
  const tauxAnnuel = tauxAnnuelDeLEscompte(ESCOMPTE_DEMANDE, joursAvances);
  // Le curseur : l'escompte le plus fort que paierait le taux de l'emprunt, en centièmes de point.
  const plafond = escompteMaximal(c.pret.tauxAnnuel, joursAvances);
  const plafondEnCentiemes = Math.floor(plafond * CENTIEMES_DE_POINT + 1e-9);
  // Le croisement : les jours d'avance qu'il faudrait pour que 3 % ne coûte pas plus que l'emprunt,
  // et ce que l'escompte demandé coûte de plus que les intérêts de l'emprunt sur cette facture.
  const joursNecessaires = Math.ceil((tauxPeriode * JOURS_PAR_AN) / c.pret.tauxAnnuel - 1e-9);
  const interetsDeLEmprunt = coutDeLAvance(f.netFinancier, c.pret.tauxAnnuel, joursAvances);
  return {
    client: nomDuClient(v.client),
    brut: f.brut,
    remise: f.reductions[0]!.montant,
    netCommercial: f.netCommercial,
    escompte: f.escompte,
    netFinancier: f.netFinancier,
    tauxTva: v.tauxTva,
    tva: f.tva,
    ttc: f.netAPayer,
    paiement: v.date + JOURS_D_ESCOMPTE,
    joursAvances,
    tauxPeriode,
    tauxAnnuel,
    plafond,
    plafondEnCentiemes,
    joursNecessaires,
    interetsDeLEmprunt,
    surcout: auCentime(f.escompte - interetsDeLEmprunt),
    // L'erreur classique : rapporter l'escompte au délai entier, et non aux jours avancés.
    tauxSurLeDelai: tauxPeriode * (JOURS_PAR_AN / v.delai),
  };
}

export const L_ESCOMPTE_DEMANDE_PAR_LE_CLIENT: Situation = {
  code: "l-escompte-demande-par-le-client",
  parcours: "comptabilite-generale",
  palier: 3,
  blocs: [],
  reprend: ["remises-et-reglements"],
  commanditaire: "Le gérant",
  titre: "L'escompte demandé par le client",
  accroche:
    "Le client professionnel veut un escompte plus fort pour payer vite. Le gérant l'a accepté une fois ; il veut savoir ce que cela coûte vraiment avant de le refaire.",
  objectifs: [
    "Établir une facture avec remise et escompte : net commercial, net financier, TVA",
    "Passer la facture d'une vente avec escompte accordé",
    "Ramener à un taux annuel l'escompte qu'on accorde à un client, et trouver le plus fort que paie l'emprunt",
    "Croiser l'escompte, les jours d'avance et le coût de l'emprunt, et répondre au gérant",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du gérant",
      texte: (c) => {
        const k = escompteDemande(c);
        return [
          `« ${majuscule(k.client)} nous a demandé un escompte de ${pct(ESCOMPTE_DEMANDE)} au lieu de ${pct(TAUX_D_ESCOMPTE)} pour nous payer sous ${qte(JOURS_D_ESCOMPTE)} jours ; aujourd'hui, ${k.client} ${paiementDuClient(c)}. Je l'ai accepté pour cette commande, la remise de ${pct(TAUX_DE_REMISE)} en plus. Faut-il l'accepter à chaque fois ? Dites-moi ce que cet escompte nous coûte vraiment, comparé à notre emprunt, et jusqu'où nous pourrions aller. »`,
          "Pas de cours cette fois : vous avez la commande et les conditions, et la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const k = escompteDemande(c);
        return {
          titre: `La commande ${deNom(k.client)} · ${c.entreprise}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: `${qte(c.venteCredit.quantite)} ${c.unites} à ${eur(c.venteCredit.prixUnitaire)}, hors taxes, avant réductions`, valeurs: [eur(k.brut)] },
            { libelle: "Remise", valeurs: [pct(TAUX_DE_REMISE)] },
            { libelle: `Escompte demandé, pour un paiement sous ${qte(JOURS_D_ESCOMPTE)} jours`, valeurs: [pct(ESCOMPTE_DEMANDE)] },
            { libelle: "Délai où le client paie aujourd'hui", valeurs: [`${qte(c.venteCredit.delai)} jours`] },
            { libelle: "Taux de TVA", valeurs: [pct(k.tauxTva, 1)] },
            { libelle: "Taux annuel de l'emprunt de l'entreprise", valeurs: [pct(c.pret.tauxAnnuel)] },
            { libelle: "Année commerciale", valeurs: [`${qte(JOURS_PAR_AN)} jours`] },
          ],
        };
      },
      repere: () =>
        "À rendre : la facture, son écriture au journal, le coût de l'escompte pour la période et à l'année, l'escompte le plus fort que paie l'emprunt, ce que coûte de plus l'escompte demandé, et votre réponse.",
    },
    {
      id: "facture",
      type: "montants",
      titre: "La facture",
      notions: ["payment_terms", "vat_payable"],
      question: () => "Établissez la facture avec la remise et l'escompte demandé : la remise, le net commercial, l'escompte, le net financier, la TVA et le net à payer.",
      champs: (c) => {
        const k = escompteDemande(c);
        return [
          { libelle: "Remise", attendu: k.remise, calcul: `${eur(k.brut)} × ${pct(TAUX_DE_REMISE)} = ${eur(k.remise)}` },
          { libelle: "Net commercial", attendu: k.netCommercial, calcul: `${eur(k.brut)} − ${eur(k.remise)} = ${eur(k.netCommercial)}` },
          { libelle: "Escompte", attendu: k.escompte, calcul: `${eur(k.netCommercial)} × ${pct(ESCOMPTE_DEMANDE)} = ${eur(k.escompte)}` },
          { libelle: "Net financier", attendu: k.netFinancier, calcul: `${eur(k.netCommercial)} − ${eur(k.escompte)} = ${eur(k.netFinancier)}` },
          { libelle: "TVA", attendu: k.tva, calcul: `${eur(k.netFinancier)} × ${pct(k.tauxTva, 1)} = ${eur(k.tva)}` },
          { libelle: "Net à payer", attendu: k.ttc, calcul: `${eur(k.netFinancier)} + ${eur(k.tva)} = ${eur(k.ttc)}` },
        ];
      },
      explication: (c) => {
        const k = escompteDemande(c);
        return [
          `L'escompte se calcule sur le net commercial, ${eur(k.netCommercial)}, et la TVA sur le net financier : ${k.client} paiera ${eur(k.ttc)} le ${date(k.paiement)}. ${c.entreprise} renonce à ${eur(k.escompte)} pour être payée ${qte(k.joursAvances)} jours plus tôt.`,
        ];
      },
    },
    {
      id: "ecriture",
      type: "ecriture",
      titre: "La facture, au journal",
      notions: ["payment_terms", "vat_payable"],
      evenement: (c) => {
        const k = escompteDemande(c);
        return `Le ${date(c.venteCredit.date)}, ${c.entreprise} envoie la facture ${aNom(k.client)} : ${eur(k.ttc)} à payer, escompte déduit, avant le ${date(k.paiement)}.`;
      },
      ecriture: (c) => {
        const k = escompteDemande(c);
        return {
          date: date(c.venteCredit.date),
          libelle: `Facture ${k.client}`,
          lignes: [
            { role: "la créance sur le client", compte: "411", sens: "debit", montant: k.ttc, indice: "le net à payer de la facture" },
            { role: "l'escompte accordé", compte: "665", sens: "debit", montant: k.escompte, indice: "l'escompte de la facture" },
            { role: "la vente, au net commercial", compte: c.venteCredit.compte, acceptes: c.venteCredit.acceptes, sens: "credit", montant: k.netCommercial, indice: "le net commercial : le prix après remise" },
            { role: "la TVA collectée", compte: "44571", sens: "credit", montant: k.tva, indice: "la TVA de la facture, sur le net financier" },
          ],
        };
      },
      indices: () => [
        "La remise ne s'écrit pas : la vente s'enregistre au prix après remise. L'escompte, lui, s'écrit.",
        "Au débit, ce que le client doit et ce que l'entreprise lui abandonne pour être payée vite ; au crédit, la vente et la TVA.",
      ],
      explication: (c) => {
        const k = escompteDemande(c);
        return [
          `La vente porte ${eur(k.netCommercial)} ; l'escompte, ${eur(k.escompte)}, est une charge financière pour l'entreprise, rangée à côté des intérêts de son emprunt. C'est ce qui rend la comparaison possible.`,
        ];
      },
      vue: "resultat",
    },
    {
      id: "cout",
      type: "montants",
      titre: "Ce que coûte l'escompte",
      notions: ["payment_terms", "net_treasury"],
      question: (c) =>
        `De combien de jours le paiement est-il avancé ? Que coûte l'escompte pour cette période, en % du net financier, au centième ? Et ramené à une année de ${qte(JOURS_PAR_AN)} jours, au dixième ? Comparez au taux de l'emprunt, ${pct(c.pret.tauxAnnuel)}.`,
      champs: (c) => {
        const k = escompteDemande(c);
        return [
          { libelle: "Jours de paiement avancés", attendu: k.joursAvances, calcul: `${qte(c.venteCredit.delai)} − ${qte(JOURS_D_ESCOMPTE)} = ${qte(k.joursAvances)} jours, du jour où le client paie vraiment au délai de l'escompte` },
          {
            libelle: "Coût de l'escompte pour la période (%)",
            attendu: auCentime(k.tauxPeriode * 100),
            tolerance: 0.01,
            calcul: `${eur(k.escompte)} ÷ ${eur(k.netFinancier)} × 100 = ${pct(k.tauxPeriode)}`,
          },
          {
            libelle: "Coût de l'escompte ramené à l'année (%)",
            attendu: auCentime(k.tauxAnnuel * 100),
            tolerance: 0.1,
            calcul: `${pct(k.tauxPeriode)} × ${qte(JOURS_PAR_AN)} ÷ ${qte(k.joursAvances)} = ${pct(k.tauxAnnuel)}`,
          },
        ];
      },
      explication: (c) => {
        const k = escompteDemande(c);
        return [
          `Recevoir ${eur(k.netFinancier)} ${qte(k.joursAvances)} jours plus tôt coûte ${eur(k.escompte)} à ${c.entreprise} : c'est comme emprunter cet argent à ${pct(k.tauxAnnuel)} par an, quand sa banque lui prête à ${pct(c.pret.tauxAnnuel)}.`,
        ];
      },
    },
    {
      id: "le-plafond",
      type: "curseur",
      titre: "L'escompte que paie l'emprunt",
      notions: ["payment_terms", "net_treasury"],
      question: (c) => {
        const k = escompteDemande(c);
        return `Faites varier l'escompte accordé, de 0 à ${qte(ESCOMPTE_MAXIMAL_DU_CURSEUR)} centièmes de point (4 %). Une droite donne ce qu'il en coûterait d'emprunter le net financier pendant les ${qte(k.joursAvances)} jours d'avance, au taux de l'emprunt ; l'autre, l'escompte abandonné au client. Placez le curseur sur l'escompte le plus fort qui ne coûte pas plus que l'emprunt, puis validez.`;
      },
      grandeur: () => ({ libelle: "Escompte accordé", unite: "centièmes de point" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: escompteDemande(c).plafondEnCentiemes, max: ESCOMPTE_MAXIMAL_DU_CURSEUR }),
      zones: ["L'escompte coûte moins que l'emprunt", "L'escompte coûte plus que l'emprunt"],
      rates: () => ({
        dessous: "À cet escompte, l'emprunt coûterait encore plus : vous pouvez accorder davantage.",
        dessus: "À cet escompte, se faire payer vite coûte déjà plus que d'emprunter.",
      }),
      montrer: "Montrer le plafond",
      lecture: (c, q) => {
        const k = escompteDemande(c);
        const t = q / CENTIEMES_DE_POINT;
        const escompte = auCentime(k.netCommercial * t);
        const interets = coutDeLAvance(auCentime(k.netCommercial - escompte), c.pret.tauxAnnuel, k.joursAvances);
        return [
          { libelle: "Escompte abandonné au client", montant: escompte },
          { libelle: "Intérêts de l'emprunt sur le net financier", montant: interets },
          { libelle: "Gain du paiement rapide, face à l'emprunt", montant: auCentime(interets - escompte), fort: true },
        ];
      },
      droites: (c) => {
        const k = escompteDemande(c);
        const x = (c.pret.tauxAnnuel * k.joursAvances) / JOURS_PAR_AN;
        return {
          produit: (q) => k.netCommercial * (1 - q / CENTIEMES_DE_POINT) * x,
          cout: (q) => (k.netCommercial * q) / CENTIEMES_DE_POINT,
          libelles: ["Intérêts de l'emprunt sur le net financier", "Escompte abandonné au client"],
        };
      },
      explication: (c) => {
        const k = escompteDemande(c);
        return [
          `Au taux de l'emprunt, ${c.entreprise} ne peut accorder que ${pct(k.plafondEnCentiemes / CENTIEMES_DE_POINT)} d'escompte pour ${qte(k.joursAvances)} jours d'avance : au-delà, l'argent reçu plus tôt lui coûte plus cher qu'à la banque. Le client demande ${pct(ESCOMPTE_DEMANDE)}, ${combienDePlus(ESCOMPTE_DEMANDE / k.plafond)}.`,
        ];
      },
    },
    {
      id: "le-croisement",
      type: "montants",
      titre: "Ce que coûte la différence",
      notions: ["payment_terms", "net_treasury"],
      question: (c) =>
        `Croisez l'escompte, les jours et le coût de l'emprunt. Donnez l'escompte le plus fort que paie l'emprunt (en %, au centième), le nombre de jours d'avance qu'il faudrait, au moins, pour que ${pct(ESCOMPTE_DEMANDE)} ne coûte pas plus que l'emprunt à ${pct(c.pret.tauxAnnuel)}, puis ce que l'escompte demandé coûte de plus que les intérêts de l'emprunt, sur cette facture.`,
      champs: (c) => {
        const k = escompteDemande(c);
        const x = (c.pret.tauxAnnuel * k.joursAvances) / JOURS_PAR_AN;
        return [
          {
            libelle: "Escompte le plus fort que paie l'emprunt (%)",
            attendu: auCentime(k.plafond * 100),
            tolerance: 0.01,
            calcul: `${pct(c.pret.tauxAnnuel)} × ${qte(k.joursAvances)} ÷ ${qte(JOURS_PAR_AN)} = ${pct(x, 4)} pour la période, puis ${pct(x, 4)} ÷ (1 + ${pct(x, 4)}) = ${pct(k.plafond, 4)}`,
          },
          {
            libelle: "Jours d'avance qu'il faudrait",
            attendu: k.joursNecessaires,
            calcul: `${pct(k.tauxPeriode)} × ${qte(JOURS_PAR_AN)} ÷ ${pct(c.pret.tauxAnnuel)} = ${(Math.round(((k.tauxPeriode * JOURS_PAR_AN) / c.pret.tauxAnnuel) * 100) / 100).toLocaleString("fr-FR")}, soit ${qte(k.joursNecessaires)} jours au moins`,
          },
          {
            libelle: "Surcoût de l'escompte demandé, sur cette facture",
            attendu: k.surcout,
            calcul: `${eur(k.escompte)} − ${eur(k.netFinancier)} × ${pct(c.pret.tauxAnnuel)} × ${qte(k.joursAvances)} ÷ ${qte(JOURS_PAR_AN)} = ${eur(k.escompte)} − ${eur(k.interetsDeLEmprunt)} = ${eur(k.surcout)}`,
          },
        ];
      },
      explication: (c) => {
        const k = escompteDemande(c);
        return [
          `Pour que ${pct(ESCOMPTE_DEMANDE)} ne coûte pas plus que l'emprunt, il faudrait que le client paie ${qte(k.joursNecessaires)} jours plus tôt ; il ne les avance que de ${qte(k.joursAvances)}. Sur cette seule facture, l'escompte demandé coûte ${eur(k.surcout)} de plus que l'argent de la banque.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      notions: ["payment_terms", "net_treasury"],
      question: () => "Quelle phrase envoyez-vous au gérant ?",
      options: (c) => {
        const k = escompteDemande(c);
        return [
          {
            texte: `Ne le généralisons pas : ${pct(k.tauxAnnuel, 1)} par an, contre ${pct(c.pret.tauxAnnuel)} pour l'emprunt`,
            juste: true,
            retour: `Oui : ${pct(ESCOMPTE_DEMANDE)} pour ${qte(k.joursAvances)} jours d'avance, c'est ${pct(k.tauxAnnuel, 1)} par an, et ${eur(k.surcout)} de plus que l'emprunt sur cette facture. L'emprunt ne paie que ${pct(k.plafond, 2)} d'escompte : se faire payer vite à ${pct(ESCOMPTE_DEMANDE)} est à garder pour un vrai besoin de trésorerie.`,
          },
          {
            texte: `Accordons-le : ${pct(ESCOMPTE_DEMANDE)}, c'est moins cher que les ${pct(c.pret.tauxAnnuel)} de notre emprunt à la banque`,
            juste: false,
            retour: `Non : ${pct(ESCOMPTE_DEMANDE)} paie ${qte(k.joursAvances)} jours, ${pct(c.pret.tauxAnnuel)} paie une année entière. Ramené à l'année, l'escompte coûte ${pct(k.tauxAnnuel, 1)}.`,
          },
          {
            texte: `Ne le généralisons pas : ${pct(k.tauxSurLeDelai, 1)} par an, ce qui reste plus cher que les ${pct(c.pret.tauxAnnuel)} de l'emprunt`,
            juste: false,
            retour: `Non : ce taux rapporte l'escompte aux ${qte(c.venteCredit.delai)} jours du délai entier. Le client ne paie que ${qte(k.joursAvances)} jours plus tôt : l'escompte coûte ${pct(k.tauxAnnuel, 1)} par an.`,
          },
          {
            texte: "Accordons-le : comme la remise, l'escompte ne coûte rien, il baisse seulement la TVA du client",
            juste: false,
            retour: `Non : l'escompte est une charge financière, au compte 665 : ${c.entreprise} renonce à ${eur(k.escompte)} sur cette facture pour être payée plus tôt.`,
          },
        ];
      },
    },
  ],
};
