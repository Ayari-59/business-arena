import { montantEcrit as eur } from "../../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../../pedagogy/cours/etats";
import type { Cas } from "../../cas";
import { dateDuCours as date } from "../../dates";
import { de, nomDuClient } from "../../provisions";
import { JOURS_D_ESCOMPTE, JOURS_PAR_AN, TAUX_D_ESCOMPTE, TAUX_DE_REMISE } from "../../remises";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « REMISES ET RÈGLEMENTS » : L'ESCOMPTE DEMANDÉ PAR LE CLIENT
 * (comptabilité générale, palier 3).
 *
 * Le client professionnel du cas demande un escompte plus fort que celui des conditions
 * du cours pour payer sous dix jours. Le gérant l'a accepté pour cette commande et
 * demande s'il faut l'accorder à l'avenir. L'élève établit la facture avec la remise et
 * ce nouvel escompte, la passe au journal, ramène l'escompte à un taux annuel, du côté de
 * l'entreprise qui l'accorde cette fois, et le compare au taux de son emprunt.
 *
 * Le cas est neuf par sa question : le chapitre ramène à l'année l'escompte qu'on obtient
 * d'un fournisseur ; ici, c'est celui qu'on accorde, à un taux que le client propose. Les
 * montants avant réduction sont ceux de la vente du cas (`cas.ts`), la remise et le délai
 * de l'escompte ceux du cours (`remises.ts`).
 */

/**
 * L'escompte que demande le client : 3 % au lieu des 2 % des conditions du cours. Un
 * point de plus, ce qu'un acheteur demande couramment quand il sait sa trésorerie
 * précieuse pour son fournisseur.
 */
export const ESCOMPTE_DEMANDE = 0.03;

const qte = (n: number) => n.toLocaleString("fr-FR");
const pct = (t: number, d = 2) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: d })} %`;

/** La facture avec la remise et l'escompte demandé, et ce que cet escompte coûte ramené à l'année. */
export function escompteDemande(c: Cas) {
  const v = c.venteCredit;
  const brut = v.ht;
  const remise = auCentime(brut * TAUX_DE_REMISE);
  const netCommercial = auCentime(brut - remise);
  const escompte = auCentime(netCommercial * ESCOMPTE_DEMANDE);
  const netFinancier = auCentime(netCommercial - escompte);
  const tva = auCentime(netFinancier * v.tauxTva);
  const joursAvances = v.delai - JOURS_D_ESCOMPTE;
  // Être payé plus tôt, c'est recevoir le net financier avant l'échéance, contre
  // l'escompte : ce qu'il coûte pour la période, puis rapporté à l'année.
  const tauxPeriode = ESCOMPTE_DEMANDE / (1 - ESCOMPTE_DEMANDE);
  const tauxAnnuel = tauxPeriode * (JOURS_PAR_AN / joursAvances);
  return {
    client: nomDuClient(v.client),
    brut,
    remise,
    netCommercial,
    escompte,
    netFinancier,
    tauxTva: v.tauxTva,
    tva,
    ttc: auCentime(netFinancier + tva),
    paiement: v.date + JOURS_D_ESCOMPTE,
    joursAvances,
    tauxPeriode,
    tauxAnnuel,
    // L'erreur classique : rapporter l'escompte au délai entier, et non aux jours avancés.
    tauxSurLeDelai: tauxPeriode * (JOURS_PAR_AN / v.delai),
  };
}

const majuscule = (s: string) => `${s.charAt(0).toUpperCase()}${s.slice(1)}`;
/** « à » devant un nom, contracté : au groupe, à la société, à l'agence. */
const a = (nom: string) => (nom.startsWith("le ") ? `au ${nom.slice(3)}` : nom.startsWith("les ") ? `aux ${nom.slice(4)}` : `à ${nom}`);

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
    "Ramener à un taux annuel l'escompte qu'on accorde à un client",
    "Comparer ce taux au coût de l'emprunt, et répondre au gérant",
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
          `« ${majuscule(k.client)} nous a demandé un escompte de ${pct(ESCOMPTE_DEMANDE)} au lieu de ${pct(TAUX_D_ESCOMPTE)} pour nous payer sous ${qte(JOURS_D_ESCOMPTE)} jours, au lieu de ${qte(c.venteCredit.delai)}. Je l'ai accepté pour cette commande, la remise de ${pct(TAUX_DE_REMISE)} en plus. Faut-il l'accepter à chaque fois ? Dites-moi ce que cet escompte nous coûte vraiment, comparé à notre emprunt. »`,
          "Pas de cours cette fois : vous avez la commande et les conditions, et la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const k = escompteDemande(c);
        return {
          titre: `La commande ${de(k.client)} · ${c.entreprise}`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: `${qte(c.venteCredit.quantite)} ${c.unites} à ${eur(c.venteCredit.prixUnitaire)}, hors taxes, avant réductions`, valeurs: [eur(k.brut)] },
            { libelle: "Remise", valeurs: [pct(TAUX_DE_REMISE)] },
            { libelle: `Escompte demandé, pour un paiement sous ${qte(JOURS_D_ESCOMPTE)} jours`, valeurs: [pct(ESCOMPTE_DEMANDE)] },
            { libelle: "Délai de paiement habituel du client", valeurs: [`${qte(c.venteCredit.delai)} jours`] },
            { libelle: "Taux de TVA", valeurs: [pct(k.tauxTva, 1)] },
            { libelle: "Taux annuel de l'emprunt de l'entreprise", valeurs: [pct(c.pret.tauxAnnuel)] },
            { libelle: "Année commerciale", valeurs: [`${qte(JOURS_PAR_AN)} jours`] },
          ],
        };
      },
      repere: () =>
        "À rendre : la facture, son écriture au journal, le coût de l'escompte pour la période et à l'année, et votre réponse.",
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
        return `Le ${date(c.venteCredit.date)}, ${c.entreprise} envoie la facture ${a(k.client)} : ${eur(k.ttc)} à payer, escompte déduit, avant le ${date(k.paiement)}.`;
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
        "Au débit, la créance sur le client pour le net à payer et l'escompte accordé, une charge financière (665). Au crédit, la vente au net commercial et la TVA collectée.",
      ],
      explication: (c) => {
        const k = escompteDemande(c);
        return [
          `La vente porte ${eur(k.netCommercial)} ; l'escompte, ${eur(k.escompte)}, est une charge financière pour l'entreprise, rangée à côté des intérêts de son emprunt. C'est ce qui permet de les comparer.`,
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
          { libelle: "Jours de paiement avancés", attendu: k.joursAvances, calcul: `${qte(c.venteCredit.delai)} − ${qte(JOURS_D_ESCOMPTE)} = ${qte(k.joursAvances)} jours` },
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
            retour: `Oui : ${pct(ESCOMPTE_DEMANDE)} pour ${qte(k.joursAvances)} jours d'avance, c'est ${pct(k.tauxAnnuel, 1)} par an. Se faire payer vite à ce prix coûte bien plus cher que l'argent de la banque ; à garder pour un vrai besoin de trésorerie.`,
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
