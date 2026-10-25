import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import type { Cas } from "../cas";
import { dateDuCours as date } from "../dates";
import { JOURS_D_ESCOMPTE, JOURS_PAR_AN, TAUX_D_ESCOMPTE, TAUX_DE_REMISE } from "../remises";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : REMISES ET RÈGLEMENTS (comptabilité générale, palier 3).
 *
 * La vente à crédit et l'achat du chapitre pilote, avec ce que les professionnels
 * négocient : une remise sur la commande, un escompte pour un paiement rapide. L'élève
 * établit la facture de vente (net commercial, net financier, TVA sur le net financier),
 * la passe, voit pourquoi la remise ne s'enregistre pas et l'escompte si, encaisse le
 * client. Puis, côté fournisseur, il ramène l'escompte proposé à un taux annuel, le
 * compare au taux de l'emprunt de l'entreprise, décide, et passe la facture et le
 * paiement.
 *
 * Les montants avant réduction sont ceux de l'arène ; les conditions sont celles du cours
 * (`remises.ts`) : l'arène ne négocie ni remise ni escompte.
 */

const qte = (n: number) => n.toLocaleString("fr-FR");
const pct = (t: number, d = 2) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: d })} %`;

/** La facture de vente au client professionnel, avec remise et escompte. */
export function factureDeVente(c: Cas) {
  const v = c.venteCredit;
  const brut = v.ht;
  const remise = auCentime(brut * TAUX_DE_REMISE);
  const netCommercial = auCentime(brut - remise);
  const escompte = auCentime(netCommercial * TAUX_D_ESCOMPTE);
  const netFinancier = auCentime(netCommercial - escompte);
  const tva = auCentime(netFinancier * v.tauxTva);
  return { brut, remise, netCommercial, escompte, netFinancier, tauxTva: v.tauxTva, tva, ttc: auCentime(netFinancier + tva), date: v.date, paiement: v.date + JOURS_D_ESCOMPTE };
}

/** L'achat au fournisseur, et ce que vaut son escompte ramené à l'année. */
export function factureDAchat(c: Cas) {
  const a = c.achat;
  const netCommercial = a.ht;
  const escompte = auCentime(netCommercial * TAUX_D_ESCOMPTE);
  const netFinancier = auCentime(netCommercial - escompte);
  const tva = auCentime(netFinancier * a.tauxTva);
  const joursGagnes = a.delai - JOURS_D_ESCOMPTE;
  // Payer plus tôt, c'est prêter le net financier au fournisseur pendant les jours gagnés,
  // contre l'escompte : son taux, rapporté à l'année.
  const tauxAnnuel = (TAUX_D_ESCOMPTE / (1 - TAUX_D_ESCOMPTE)) * (JOURS_PAR_AN / joursGagnes);
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
    date: a.date,
    paiement: a.date + JOURS_D_ESCOMPTE,
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
  ],
  titre: "Remises et règlements",
  accroche:
    "Ce que les professionnels négocient sur une facture : la remise qui baisse le prix, l'escompte qui paie la rapidité, et le calcul qui dit s'il vaut la peine.",
  objectifs: [
    "Établir une facture avec remise et escompte : net commercial, net financier, TVA",
    "Distinguer une réduction commerciale, qui ne s'enregistre pas, d'une réduction financière, qui s'enregistre",
    "Passer la facture et le règlement, côté client et côté fournisseur",
    "Ramener un escompte à un taux annuel, et décider s'il vaut la peine",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce qui se négocie",
      notions: ["payment_terms"],
      texte: (c) => [
        `Dans le premier chapitre, ${c.venteCredit.client} achetait au prix affiché et payait à ${qte(c.venteCredit.delai)} jours. Entre professionnels, une facture se négocie souvent.`,
        `Deux sortes de réductions. Les réductions commerciales baissent le prix : la remise sur une grosse commande, le rabais pour un défaut, la ristourne de fin d'année. La réduction financière, l'escompte, paie la rapidité : le client qui règle dans les ${qte(JOURS_D_ESCOMPTE)} jours paie un peu moins.`,
        `Ici, ${c.entreprise} accorde à son client une remise de ${pct(TAUX_DE_REMISE)} et un escompte de ${pct(TAUX_D_ESCOMPTE)} s'il paie dans les ${qte(JOURS_D_ESCOMPTE)} jours. Les montants avant réduction sont ceux de l'arène ; ces conditions sont celles du cours.`,
      ],
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
        return `Le ${date(f.date)}, ${c.entreprise} envoie la facture à ${c.venteCredit.client} : ${eur(f.ttc)} à payer, escompte déduit, s'il règle avant le ${date(f.paiement)}.`;
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
          `Les ventes portent ${eur(f.netCommercial)}, le prix après remise. L'escompte, ${eur(f.escompte)}, est une charge financière : c'est le prix que ${c.entreprise} paie pour être réglée plus vite.`,
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
        {
          texte: "La remise est trop petite pour être enregistrée.",
          juste: false,
          retour: "La taille n'y fait rien : une remise, même grosse, réduit le prix et ne s'écrit pas à part.",
        },
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
        return `Le ${date(f.paiement)}, ${c.venteCredit.client} règle par virement, dans le délai de l'escompte : ${eur(f.ttc)}.`;
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
          `${c.entreprise} encaisse le ${date(f.paiement)} au lieu d'attendre ${qte(c.venteCredit.delai)} jours. L'escompte a été passé avec la facture : le règlement solde simplement la créance.`,
        ];
      },
      vue: "resultat",
    },
    {
      id: "escompte-du-fournisseur",
      type: "montants",
      titre: "L'escompte du fournisseur",
      notions: ["payment_terms"],
      question: (c) => {
        const f = factureDAchat(c);
        return `De son côté, ${c.achat.fournisseur} propose à ${c.entreprise} un escompte de ${pct(TAUX_D_ESCOMPTE)} si elle paie sous ${qte(JOURS_D_ESCOMPTE)} jours au lieu de ${qte(c.achat.delai)}, sur une facture de ${eur(f.netCommercial)} hors taxes. Ramenez cet escompte à un taux annuel.`;
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
            calcul: `${eur(f.escompte)} ÷ ${eur(f.netFinancier)} × ${qte(JOURS_PAR_AN)} ÷ ${qte(f.joursGagnes)} = ${pct(f.tauxAnnuel)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const f = factureDAchat(c);
        return [
          `Payer ${qte(f.joursGagnes)} jours plus tôt, c'est avancer ${eur(f.netFinancier)} à son fournisseur pendant ${qte(f.joursGagnes)} jours, contre ${eur(f.escompte)}. Rapporté à l'année, ce placement rapporte ${pct(f.tauxAnnuel)}.`,
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
              : `Non : l'argent coûte plus à l'entreprise que l'escompte ne rapporte.`,
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
        return `Le ${date(f.date)}, ${c.entreprise} reçoit la facture de ${c.achat.fournisseur}, escompte déduit : ${eur(f.netCommercial)} hors taxes, ${eur(f.escompte)} d'escompte, ${eur(f.tva)} de TVA, ${eur(f.ttc)} à payer avant le ${date(f.paiement)}.`;
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
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["payment_terms"],
      texte: (c) => {
        const v = factureDeVente(c);
        const a = factureDAchat(c);
        return [
          `Vous avez établi une facture avec remise et escompte, passé la vente et l'achat de ${c.entreprise} avec leurs escomptes, et décidé, chiffres à l'appui, de payer vite.`,
          `Sur ces deux factures, ${c.entreprise} a accordé ${eur(v.escompte)} d'escompte et en a obtenu ${eur(a.escompte)}. Dans l'arène, les délais de paiement des clients et des fournisseurs se lisent dans la trésorerie de chaque trimestre : c'est le besoin en fonds de roulement, au palier suivant.`,
        ];
      },
      repere: () =>
        "Réductions commerciales (remise, rabais, ristourne) : elles baissent le prix et ne s'enregistrent pas. Escompte : une charge financière pour qui l'accorde (665), un produit financier pour qui l'obtient (765).",
    },
  ],
};
