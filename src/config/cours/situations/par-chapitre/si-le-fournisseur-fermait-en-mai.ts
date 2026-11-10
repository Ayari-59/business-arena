import { arrondi2, eur, nombreAuCentieme } from "../../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../../cas";
import { ENTREPRISES_DES_BUDGETS, ficheDe } from "../../chapitres/des-ventes-aux-achats";
import { SANS_STOCK, budgetsDeProduction } from "../../monde/budgets-operationnels";
import { budgetDeTresorerie } from "../../monde/couts-et-budgets";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « DES VENTES AUX ACHATS » : SI LE FOURNISSEUR FERMAIT EN MAI (contrôle de
 * gestion, palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : le semestre de NOVA, sans stock
 * (monde/nova-gestion.ts), les budgets opérationnels de monde/budgets-operationnels.ts et le budget de
 * trésorerie du modèle (monde/couts-et-budgets.ts, levier `jeuxAchetes`).
 *
 * HYPOTHÈSE DU CAS (une question du dirigeant, pas un fait de l'exercice : Électro-Composants n'a pas
 * fermé en mai) : le fournisseur annonce en janvier qu'il fermera tout le mois de MOIS_DE_FERMETURE.
 * NOVA doit acheter en avril les jeux que la ligne consommera en mai : le stock final de jeux d'avril
 * vaut la consommation de mai, et mai n'achète rien. L'élève refait seul le budget des
 * approvisionnements d'avril et de mai, ce qu'il paie et quand, la TVA (un crédit en avril), puis la
 * trésorerie de mai face au matelas. La réponse demande un jugement : pas de découvert, mais un mois
 * sous le matelas, à financer.
 */

/** Le mois où le fournisseur fermerait : mai (0 pour janvier). */
export const MOIS_DE_FERMETURE = 4;

const qte = nombreAuCentieme;
const auCentime = arrondi2;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/i.test(nom) ? `d'${nom}` : `de ${nom}`);
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Les chiffres du cas, calculés une fois de la fiche. */
export function fermetureDeMai(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const s = f.semestre;
  const m = f.moisDeReference;
  const tva = s.tauxDeTva;
  const k = MOIS_DE_FERMETURE;
  const avant = k - 1;
  const fiche = budgetsDeProduction(f, SANS_STOCK);
  // Sans stock, la consommation de chaque mois est la production, donc les ventes.
  const consommation = fiche.mois.map((x) => x.consommation);
  const jeuxAchetes = consommation.map((q, i) => (i === avant ? q + consommation[k]! : i === k ? 0 : q));
  const sans = budgetDeTresorerie(f);
  const avec = budgetDeTresorerie(f, { jeuxAchetes });
  const matelas = f.seuilsDAlerte.tresorerie;
  const achatsDAvant = jeuxAchetes[avant]!;
  const tvaDAvant = avec.mois[avant]!.tva;
  return {
    f,
    s,
    m,
    tva,
    k,
    avant,
    consommation,
    jeuxAchetes,
    sans,
    avec,
    matelas,
    stockFinal: consommation[k]!,
    achatsDAvant,
    paiement: avec.mois[k]!.decaissements.fournisseur,
    tvaDAvant,
    tvaDeductibleEnPlus: auCentime(consommation[k]! * m.coutVariable.composants * tva),
    nom: (i: number) => s.mois[i]!.nom,
  };
}

export const SI_LE_FOURNISSEUR_FERMAIT_EN_MAI: Situation = {
  code: "si-le-fournisseur-fermait-en-mai",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [],
  reprend: ["des-ventes-aux-achats"],
  commanditaire: "Le dirigeant",
  titre: "Si le fournisseur fermait en mai",
  accroche: "Le fournisseur de composants fermerait tout un mois. Il faudrait acheter d'avance les jeux de ce mois-là : la trésorerie le supporterait-elle ?",
  objectifs: [
    "Refaire le budget des approvisionnements avec un stock final imposé",
    "En tirer les paiements au fournisseur et la TVA à décaisser, crédit de TVA compris",
    "Rendre au dirigeant une réponse chiffrée sur la trésorerie du mois",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_BUDGETS,
    pourquoi: "ce cas reprend le chapitre « Des ventes aux achats », qui se bâtit sur le semestre de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du dirigeant",
      texte: (c) => {
        const n = fermetureDeMai(c);
        const mois = n.nom(n.k);
        return [
          `« ${n.s.fournisseur.nom} nous annonce qu'il fermera tout le mois de ${mois}. Il faudra acheter en ${n.nom(n.avant)} les jeux ${dE(mois)}. Nous n'avons jamais tenu de stock : est-ce que la trésorerie le supportera, et faut-il prévenir la banque ? »`,
          `Pas de cours cette fois : vous avez le semestre ${dE(n.f.entreprise)}, sans stock, et la méthode du chapitre. Le fournisseur facture le ${n.s.fournisseur.jourDeFacturation} et se paie à ${n.s.fournisseur.delai} jours, la TVA du mois se paie le mois suivant, et le dirigeant veut garder ${eur(n.matelas)} en banque.`,
        ];
      },
      tableau: (c) => {
        const n = fermetureDeMai(c);
        return {
          titre: `Le semestre ${dE(n.f.entreprise)}, sans stock`,
          colonnes: n.s.mois.map((m) => majuscule(m.nom)),
          lignes: [
            { libelle: "Jeux consommés, un par enceinte vendue", valeurs: n.consommation.map(qte) },
            { libelle: "Paiements au fournisseur prévus", valeurs: n.sans.mois.map((m) => eur(m.decaissements.fournisseur)) },
            { libelle: "TVA à décaisser prévue", valeurs: n.sans.mois.map((m) => eur(m.decaissements.tva)) },
            { libelle: "Trésorerie de fin de mois prévue", valeurs: n.sans.mois.map((m) => eur(m.tresorerieFin)) },
          ],
        };
      },
      repere: (c) => {
        const n = fermetureDeMai(c);
        return `À rendre : les jeux achetés en ${n.nom(n.avant)} et en ${n.nom(n.k)}, ce que le fournisseur et l'État reçoivent en ${n.nom(n.k)} et en ${n.nom(n.k + 1)}, la trésorerie de fin de ${n.nom(n.k)}, et votre réponse.`;
      },
    },
    {
      id: "les-approvisionnements",
      type: "montants",
      titre: "Les approvisionnements d'avant la fermeture",
      notions: ["stock", "cash_budget"],
      question: (c) => {
        const n = fermetureDeMai(c);
        return `Le stock final de jeux ${dE(n.nom(n.avant))} doit couvrir toute la consommation ${dE(n.nom(n.k))}. Calculez ce stock final, les jeux achetés en ${n.nom(n.avant)}, ceux achetés en ${n.nom(n.k)}, puis ce que ${n.f.entreprise} paiera au fournisseur en ${n.nom(n.k)}.`;
      },
      champs: (c) => {
        const n = fermetureDeMai(c);
        return [
          { libelle: `Stock final de jeux ${dE(n.nom(n.avant))}`, nature: "quantite", attendu: n.stockFinal, calcul: `la consommation ${dE(n.nom(n.k))} : ${qte(n.stockFinal)} jeux` },
          { libelle: `Jeux achetés en ${n.nom(n.avant)}`, nature: "quantite", attendu: n.achatsDAvant, calcul: `${qte(n.consommation[n.avant]!)} + ${qte(n.stockFinal)} − 0 = ${qte(n.achatsDAvant)}` },
          { libelle: `Jeux achetés en ${n.nom(n.k)}`, nature: "quantite", attendu: n.jeuxAchetes[n.k]!, calcul: `${qte(n.consommation[n.k]!)} + 0 − ${qte(n.stockFinal)} = ${qte(n.jeuxAchetes[n.k]!)}` },
          { libelle: `Paiement au fournisseur en ${n.nom(n.k)}`, attendu: n.paiement, calcul: `${qte(n.achatsDAvant)} × ${eur(n.m.coutVariable.composants)} × ${qte(1 + n.tva)} = ${eur(n.paiement)}` },
        ];
      },
      explication: (c) => {
        const n = fermetureDeMai(c);
        return [`Le fournisseur reçoit en ${n.nom(n.k)} les jeux ${dE(n.nom(n.avant))} et ceux ${dE(n.nom(n.k))} d'un coup, et rien en ${n.nom(n.k + 1)} : la fermeture déplace un paiement, elle n'en ajoute pas.`];
      },
    },
    {
      id: "la-tva",
      type: "montants",
      titre: "La TVA, à contretemps",
      notions: ["vat_payable", "cash_budget"],
      question: (c) => {
        const n = fermetureDeMai(c);
        const a = n.nom(n.avant);
        return `La déclaration ${dE(a)} déduit la TVA de tous les jeux achetés en ${a}. Calculez la TVA déductible en plus sur la déclaration ${dE(a)}, le solde de cette déclaration (collectée moins déductible), la TVA payée en ${n.nom(n.k)}, puis celle payée en ${n.nom(n.k + 1)}.`;
      },
      champs: (c) => {
        const n = fermetureDeMai(c);
        const t = n.tvaDAvant;
        const prevue = n.sans.mois[n.avant]!.tva;
        const mai = n.avec.mois[n.k]!;
        const juin = n.avec.mois[n.k + 1]!;
        return [
          { libelle: `TVA déductible en plus ${dE(n.nom(n.avant))}`, attendu: n.tvaDeductibleEnPlus, calcul: `${qte(n.stockFinal)} × ${eur(n.m.coutVariable.composants)} × ${qte(n.tva * 100)} % = ${eur(n.tvaDeductibleEnPlus)}` },
          { libelle: `Solde de la déclaration ${dE(n.nom(n.avant))}`, attendu: t.solde, calcul: `${eur(prevue.solde)} prévus − ${eur(n.tvaDeductibleEnPlus)} = ${eur(t.solde)}, un crédit de TVA` },
          { libelle: `TVA payée en ${n.nom(n.k)}`, attendu: mai.decaissements.tva, calcul: `un crédit ne se paie pas : ${eur(mai.decaissements.tva)}, et il se reporte sur la déclaration suivante` },
          {
            libelle: `TVA payée en ${n.nom(n.k + 1)}`,
            attendu: juin.decaissements.tva,
            calcul: `la déclaration ${dE(n.nom(n.k))} : ${eur(mai.tva.solde)} − ${eur(t.creditReporte)} de crédit reporté = ${eur(juin.decaissements.tva)}`,
          },
        ];
      },
      explication: (c) => {
        const n = fermetureDeMai(c);
        return [`La TVA suit les achats : déduite en ${n.nom(n.avant)}, elle allège ${n.nom(n.k)} ; ${n.nom(n.k)} n'achète rien, sa déclaration est lourde, et ${n.nom(n.k + 1)} la paie.`];
      },
    },
    {
      id: "la-tresorerie",
      type: "montants",
      titre: "La trésorerie de mai et de juin",
      notions: ["cash_budget"],
      question: (c) => {
        const n = fermetureDeMai(c);
        return `Les autres flux ne bougent pas. Calculez la trésorerie de fin de ${n.nom(n.k)}, puis celle de fin de ${n.nom(n.k + 1)}, avec la fermeture.`;
      },
      champs: (c) => {
        const n = fermetureDeMai(c);
        const k = n.k;
        const d = (i: number) => auCentime(n.avec.mois[i]!.decaissements.fournisseur + n.avec.mois[i]!.decaissements.tva - n.sans.mois[i]!.decaissements.fournisseur - n.sans.mois[i]!.decaissements.tva);
        return [
          {
            libelle: `Trésorerie de fin de ${n.nom(k)}`,
            attendu: n.avec.mois[k]!.tresorerieFin,
            calcul: `${eur(n.sans.mois[k]!.tresorerieFin)} prévus − ${eur(d(k))} de fournisseur et de TVA en plus = ${eur(n.avec.mois[k]!.tresorerieFin)}`,
          },
          {
            libelle: `Trésorerie de fin de ${n.nom(k + 1)}`,
            attendu: n.avec.mois[k + 1]!.tresorerieFin,
            calcul: `${eur(n.avec.mois[k]!.tresorerieFin)} + (${eur(n.sans.mois[k + 1]!.tresorerieFin)} − ${eur(n.sans.mois[k]!.tresorerieFin)}) + ${eur(-d(k + 1))} de fournisseur et de TVA en moins = ${eur(n.avec.mois[k + 1]!.tresorerieFin)}`,
          },
        ];
      },
      explication: (c) => {
        const n = fermetureDeMai(c);
        return [`${majuscule(n.nom(n.k + 1))} retrouve exactement la trésorerie prévue : la fermeture n'a rien coûté au semestre, elle a creusé un seul mois.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au dirigeant",
      notions: ["cash_budget", "stock"],
      question: (c) => {
        const n = fermetureDeMai(c);
        return `La trésorerie supporte-t-elle la fermeture de ${n.nom(n.k)}, et faut-il prévenir la banque ?`;
      },
      options: (c) => {
        const n = fermetureDeMai(c);
        const mai = n.avec.mois[n.k]!.tresorerieFin;
        return [
          {
            texte: "Pas de découvert, mais un mois sous le matelas",
            juste: true,
            retour: `Oui. ${majuscule(n.nom(n.k))} finit à ${eur(mai)}, au-dessus de zéro mais sous les ${eur(n.matelas)} du matelas. Il suffit de prévoir un crédit d'un mois, ou de négocier avec le fournisseur le paiement des jeux d'avance en deux fois.`,
          },
          {
            texte: `Oui, sans rien faire : ${n.nom(n.k + 1)} retrouve la trésorerie prévue`,
            juste: false,
            retour: "Le semestre finit bien au même point, mais un mois passe sous le matelas : le dirigeant l'avait fixé pour ne pas s'en approcher. Un budget se lit mois par mois.",
          },
          {
            texte: "Non : un découvert certain, il faut renoncer à produire en mai",
            juste: false,
            retour: `Non : ${n.nom(n.k)} reste au-dessus de zéro. Et arrêter la ligne ferait perdre les ventes, qui font rentrer l'argent.`,
          },
          {
            texte: "Oui : un stock ne coûte rien, la TVA le rembourse",
            juste: false,
            retour: "Non : la TVA déductible revient, mais pas le hors taxes des jeux, payé un mois plus tôt. C'est lui qui creuse le mois.",
          },
        ];
      },
    },
  ],
};
