import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_L_EQUILIBRE, ficheDe } from "../../chapitres/equilibrer-la-tresorerie";
import { CONDITIONS_DE_LA_BANQUE, JOURS_DE_LA_BANQUE, JOURS_DU_MOIS_BANCAIRE, budgetReequilibre, matelasDe } from "../../monde/equilibre-de-tresorerie";
import type { LeviersDuSemestre } from "../../monde/couts-et-budgets";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « ÉQUILIBRER LA TRÉSORERIE » : UN BANC PLUS CHER (contrôle de gestion,
 * palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : le semestre de NOVA, le budget de
 * trésorerie du modèle (monde/couts-et-budgets.ts) et le rééquilibrage de
 * monde/equilibre-de-tresorerie.ts, aux conditions de la banque du chapitre.
 *
 * HYPOTHÈSE DU CAS : le fabricant du banc propose en janvier un modèle plus complet, BANC_PLUS_CHER
 * hors taxes, livré et payé en avril comme l'autre. Le besoin d'avril dépasse alors de loin
 * l'autorisation de découvert ; un crédit d'un mois ne suffit plus, parce que son remboursement
 * replonge mai sous le matelas. L'élève refait seul le chemin du chapitre : le besoin, le crédit
 * d'avril, celui de mai, puis il compare le coût des deux crédits à celui de l'escompte. La réponse
 * demande un jugement : le crédit, renouvelé une fois, reste le moins cher ; mais un besoin qui dure
 * appelle un financement stable.
 */

/** Le prix hors taxes du modèle plus complet : hypothèse du cas. */
export const BANC_PLUS_CHER = 45_000;

const eur = (x: number) => montantEcrit(x + 0).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/i.test(nom) ? `d'${nom}` : `de ${nom}`);
const majuscule = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Les chiffres du cas, calculés une fois de la fiche. */
export function bancPlusCher(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const s = f.semestre;
  const B = CONDITIONS_DE_LA_BANQUE;
  const k = s.investissement.mois;
  const leviers: Partial<LeviersDuSemestre> = { investissement: { mois: k, montantHt: BANC_PLUS_CHER } };
  const credit = budgetReequilibre(f, "credit", leviers);
  const escompte = budgetReequilibre(f, "escompte", leviers);
  const decouvert = budgetReequilibre(f, "decouvert", leviers);
  const matelas = matelasDe(f);
  const avril = credit.mois[k]!;
  const mai = credit.mois[k + 1]!;
  const [premier, second] = credit.credits;
  return {
    f,
    s,
    B,
    k,
    credit,
    escompte,
    decouvert,
    matelas,
    avril,
    mai,
    premier: premier!,
    second: second!,
    besoin: auCentime(matelas - avril.avant),
    ttc: auCentime(BANC_PLUS_CHER * (1 + s.tauxDeTva)),
    nom: (i: number) => s.mois[i]!.nom,
  };
}

export const UN_BANC_PLUS_CHER: Situation = {
  code: "un-banc-plus-cher",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [],
  reprend: ["equilibrer-la-tresorerie"],
  commanditaire: "Le dirigeant",
  titre: "Un banc plus cher",
  accroche: "Le fabricant propose un banc plus complet, plus cher. Le crédit d'un mois suffira-t-il encore, et quel financement coûtera le moins ?",
  objectifs: [
    "Calculer un besoin de financement et le crédit de trésorerie qui le couvre",
    "Voir qu'un remboursement peut appeler un second crédit",
    "Comparer le coût des financements à court terme et rendre une réponse chiffrée",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_L_EQUILIBRE,
    pourquoi: "ce cas reprend le chapitre « Équilibrer la trésorerie », qui se joue sur le semestre de NOVA dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question du dirigeant",
      texte: (c) => {
        const n = bancPlusCher(c);
        return [
          `« Le fabricant me propose un banc plus complet, à ${eur(BANC_PLUS_CHER)} HT au lieu de ${eur(n.s.investissement.montantHt)}, livré et payé en ${n.nom(n.k)} comme l'autre. Le crédit d'un mois suffira-t-il encore à garder ${eur(n.matelas)} en banque, et combien cela coûtera-t-il ? »`,
          "Pas de cours cette fois : vous avez le budget de trésorerie avec ce banc et les conditions de la banque du chapitre.",
        ];
      },
      tableau: (c) => {
        const n = bancPlusCher(c);
        const B = n.B;
        return {
          titre: `Le budget avec le banc à ${eur(BANC_PLUS_CHER)} HT, et la banque`,
          colonnes: ["Donnée"],
          lignes: [
            { libelle: `Trésorerie de fin ${dE(n.nom(n.k))}, avant tout financement`, valeurs: [eur(n.avril.avant)] },
            { libelle: `Trésorerie de fin de ${n.nom(n.k + 1)}, avant tout financement`, valeurs: [eur(n.decouvert.budget.mois[n.k + 1]!.tresorerieFin)] },
            { libelle: "Découvert autorisé", valeurs: [`jusqu'à ${eur(B.decouvert.autorise)}, à ${pct(B.decouvert.tauxAnnuel)} l'an`] },
            { libelle: "Crédit de trésorerie d'un mois", valeurs: [`par tranches de ${eur(B.credit.tranche)}, à ${pct(B.credit.tauxAnnuel)} l'an, ${eur(B.credit.frais)} de frais`] },
            { libelle: "Escompte", valeurs: [`${pct(B.escompte.tauxAnnuel)} l'an, ${eur(B.escompte.commission)} par effet`] },
          ],
        };
      },
      repere: () => "À rendre : le besoin et le crédit d'avril, le crédit de mai et leur coût, la comparaison avec l'escompte, et votre réponse.",
    },
    {
      id: "le-credit-d-avril",
      type: "montants",
      titre: "Le crédit d'avril",
      notions: ["cash_budget", "receivables_financing"],
      question: (c) => {
        const n = bancPlusCher(c);
        return `Calculez le besoin pour finir ${n.nom(n.k)} au matelas, le crédit à emprunter le 1er ${n.nom(n.k)} (tranches, frais compris), ses intérêts sur un mois, puis la trésorerie de fin ${dE(n.nom(n.k))}.`;
      },
      champs: (c) => {
        const n = bancPlusCher(c);
        const p = n.premier;
        return [
          { libelle: `Besoin pour finir ${n.nom(n.k)} au matelas`, attendu: n.besoin, calcul: `${eur(n.matelas)} − (${eur(n.avril.avant)}) = ${eur(n.besoin)}` },
          { libelle: `Crédit ${dE(n.nom(n.k))}`, attendu: p.montant, calcul: `${eur(n.besoin)} + ${eur(p.frais)} de frais = ${eur(n.besoin + p.frais)}, soit ${eur(p.montant)} à la tranche supérieure` },
          { libelle: `Intérêts du crédit ${dE(n.nom(n.k))}`, attendu: p.interets, calcul: `${eur(p.montant)} × ${pct(n.B.credit.tauxAnnuel)} × ${JOURS_DU_MOIS_BANCAIRE} ÷ ${JOURS_DE_LA_BANQUE} = ${eur(p.interets)}` },
          { libelle: `Trésorerie de fin ${dE(n.nom(n.k))}`, attendu: n.avril.apres, calcul: `${eur(n.avril.avant)} + ${eur(p.montant)} − ${eur(p.frais)} = ${eur(n.avril.apres)}` },
        ];
      },
      explication: (c) => {
        const n = bancPlusCher(c);
        return [`Le découvert ne pourrait pas suffire : ${eur(-n.avril.avant)}, bien au-delà des ${eur(n.B.decouvert.autorise)} autorisés. La banque rejetterait les paiements.`];
      },
    },
    {
      id: "le-credit-de-mai",
      type: "montants",
      titre: "Le remboursement de mai",
      notions: ["cash_budget", "loan_schedule"],
      question: (c) => {
        const n = bancPlusCher(c);
        const m = n.nom(n.k + 1);
        return `Le 1er ${m}, ${n.f.entreprise} rembourse le crédit et ses intérêts. Calculez la trésorerie de fin de ${m} avant un nouveau crédit, le crédit de ${m} qui la ramène au matelas, puis le coût total des crédits, frais compris.`;
      },
      champs: (c) => {
        const n = bancPlusCher(c);
        const p = n.premier;
        const q = n.second;
        const flux = auCentime(n.decouvert.budget.mois[n.k + 1]!.tresorerieFin - n.avril.avant);
        return [
          { libelle: `Trésorerie de fin de ${n.nom(n.k + 1)}, avant un nouveau crédit`, attendu: n.mai.avant, calcul: `${eur(n.avril.apres)} + ${eur(flux)} de flux du mois − ${eur(p.montant)} − ${eur(p.interets)} = ${eur(n.mai.avant)}` },
          { libelle: `Crédit de ${n.nom(n.k + 1)}`, attendu: q.montant, calcul: `${eur(n.matelas)} − ${eur(n.mai.avant)} + ${eur(q.frais)} = ${eur(auCentime(n.matelas - n.mai.avant + q.frais))}, soit ${eur(q.montant)} à la tranche supérieure` },
          {
            libelle: "Coût total des crédits",
            attendu: n.credit.cout,
            calcul: `${eur(p.interets)} + ${eur(p.frais)} + ${eur(q.interets)} + ${eur(q.frais)} = ${eur(n.credit.cout)}`,
          },
        ];
      },
      explication: (c) => {
        const n = bancPlusCher(c);
        return [`Rembourser d'un coup ${eur(n.premier.montant)} replonge ${n.nom(n.k + 1)} sous le matelas : le besoin dure plus d'un mois. ${majuscule(n.nom(n.k + 2))}, lui, finit à ${eur(n.credit.mois[n.k + 2]!.apres)} une fois tout remboursé.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au dirigeant",
      notions: ["receivables_financing", "cash_budget"],
      question: (c) => {
        const n = bancPlusCher(c);
        return `L'escompte des factures de CampusTech couvrirait le même besoin pour ${eur(n.escompte.cout)}. Quelle réponse rendez-vous au dirigeant ?`;
      },
      options: (c) => {
        const n = bancPlusCher(c);
        return [
          {
            texte: `Un crédit renouvelé en ${n.nom(n.k + 1)}, ${eur(n.credit.cout)}`,
            juste: true,
            retour: `Oui. Le crédit, renouvelé une fois en ${n.nom(n.k + 1)}, couvre le besoin au plus juste pour ${eur(n.credit.cout)}, contre ${eur(n.escompte.cout)} pour l'escompte, qui avance des factures entières. Mais un besoin qui dure appelle un financement stable : un emprunt sur la durée du banc.`,
          },
          {
            texte: `Un seul crédit ${dE(n.nom(n.k))}, ${eur(n.premier.montant)}, comme pour l'autre banc`,
            juste: false,
            retour: `Non : son remboursement le 1er ${n.nom(n.k + 1)} laisse ${eur(n.mai.avant)}, sous le matelas. Il faut un second crédit.`,
          },
          {
            texte: `L'escompte, qui ne demande aucun remboursement, ${eur(n.escompte.cout)}`,
            juste: false,
            retour: "Non : l'escompte se rembourse aussi, par CampusTech qui paie la banque au lieu de NOVA. Il coûte ici plus cher que le crédit renouvelé.",
          },
          {
            texte: `Le découvert, ${eur(n.decouvert.cout)} d'agios seulement`,
            juste: false,
            retour: `Non : le découvert ${dE(n.nom(n.k))}, ${eur(-n.avril.avant)}, dépasse l'autorisation de ${eur(n.B.decouvert.autorise)}. Et il ne garderait pas le matelas.`,
          },
        ];
      },
    },
  ],
};
