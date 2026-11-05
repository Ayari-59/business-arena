import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_POINT_DE_VENTE, ficheDe } from "../../chapitres/taux-de-marque";
import { JOURS_DE_RETRACTATION, SAMEDI_APRES_LA_FORMATION, indicateursDuVendeur, samediDesVendeurs } from "../../monde/clientele-de-la-boutique";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LA VENTE CONSEIL » : LE SAMEDI APRÈS LA FORMATION (BTS MCO, palier 3).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : le samedi de janvier de MAILLE & CO et le samedi suivant, après la
 * formation de l'étudiante (monde/clientele-de-la-boutique.ts, `SAMEDI_APRES_LA_FORMATION`,
 * `indicateursDuVendeur`). La responsable veut savoir si la demi-journée a payé. L'élève refait seul les
 * indicateurs du chapitre avant et après, les taux des deux techniques et la marge gagnée ; puis il
 * traite un client qui rapporte un cardigan acheté en boutique en invoquant les 14 jours.
 *
 * Les pièges : juger la formation au chiffre d'affaires plutôt qu'à la marge ; accorder un droit de
 * rétractation qui n'existe pas en boutique.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number, chiffres = 1) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: chiffres }).replace(/^-/, "−")} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;

/** Les chiffres du cas, calculés une fois sur la fiche. */
export function leSamediApresLaFormation(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const s = samediDesVendeurs(f);
  const avant = s.vendeur("etudiante");
  const apres = indicateursDuVendeur(f, SAMEDI_APRES_LA_FORMATION);
  return { f, s, avant, apres, margeGagnee: auCentime(apres.marge - avant.marge), chiffreGagne: auCentime(apres.chiffre - avant.chiffre) };
}

const tableauDuCas = (c: Pick<Cas, "code">): TableauDeDonnees => {
  const x = leSamediApresLaFormation(c);
  const ligne = (libelle: string, v: typeof x.avant) => ({
    libelle,
    valeurs: [qte(v.prisEnCharge), qte(v.tickets), qte(v.articles), eur(v.chiffre), `${qte(v.echarpesAvecLeCardigan)} sur ${qte(v.cardigans)}`, `${qte(v.merinos)} sur ${qte(v.pulls)}`],
  });
  return {
    titre: "L'étudiante, le samedi d'avant et le samedi d'après la formation",
    colonnes: ["Accueillis", "Passages", "Articles", "Chiffre HT", "Écharpes au cardigan", "Mérinos sur les pulls"],
    lignes: [ligne("Avant la formation", x.avant), ligne("Après la formation", x.apres)],
  };
};

export const LE_SAMEDI_APRES_LA_FORMATION: Situation = {
  code: "le-samedi-apres-la-formation",
  parcours: "mco",
  palier: 3,
  blocs: [],
  reprend: ["la-vente-conseil"],
  commanditaire: "La responsable de la boutique",
  titre: "Le samedi après la formation",
  accroche:
    "L'étudiante a suivi une demi-journée de formation à la vente. Le samedi suivant, a-t-elle mieux vendu, et la formation a-t-elle payé ? Et que répondre au client qui rapporte un cardigan acheté en boutique ?",
  objectifs: [
    "Calculer la transformation, l'indice de vente et le panier d'un vendeur avant et après une formation",
    "Calculer les taux de vente additionnelle et de montée en gamme, et la marge gagnée",
    "Dire si un achat en boutique ouvre un droit de rétractation",
    "Rendre un avis sur la formation à la responsable",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_POINT_DE_VENTE,
    pourquoi: "ce cas reprend le samedi du chapitre, à la boutique MAILLE & CO, le seul point de vente que la simulation du cours suit d'un chapitre à l'autre.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la responsable",
      tableau: tableauDuCas,
      texte: (c) => {
        const x = leSamediApresLaFormation(c);
        return [
          `« J'ai fait former l'étudiante par le vendeur, une demi-journée, à la montée en gamme et à l'écharpe avec le cardigan. Voici ses deux samedis. Le chiffre a monté de ${eur(x.chiffreGagne)} : la formation a-t-elle vraiment payé ? Et un client me rapporte un cardigan acheté samedi en boutique : il dit avoir ${qte(JOURS_DE_RETRACTATION)} jours pour changer d'avis. »`,
          "Pas de cours cette fois : vous avez les deux samedis et la méthode du chapitre. Les marges d'un article sont celles de la gamme de la boutique.",
        ];
      },
      repere: () => "À rendre : la transformation, l'indice de vente et le panier après la formation, les taux des deux techniques, la marge gagnée, la réponse au client, et votre avis.",
    },
    {
      id: "les-indicateurs",
      type: "montants",
      titre: "Les indicateurs d'après",
      notions: ["conversion_rate", "average_basket"],
      tableau: tableauDuCas,
      question: () => "Calculez, pour le samedi d'après la formation, la transformation de l'étudiante (en %, au dixième), son indice de vente (au centième) et son panier moyen hors taxes (au centime).",
      champs: (c) => {
        const a = leSamediApresLaFormation(c).apres;
        return [
          { libelle: "Transformation (%)", attendu: auDixieme(a.transformation * 100), tolerance: 0.1, calcul: `${qte(a.tickets)} ÷ ${qte(a.prisEnCharge)} × 100 = ${pct(auDixieme(a.transformation * 100))}` },
          { libelle: "Indice de vente", attendu: auCentime(a.indice), tolerance: 0.01, calcul: `${qte(a.articles)} ÷ ${qte(a.tickets)} = ${qte(auCentime(a.indice))}` },
          { libelle: "Panier moyen", attendu: auCentime(a.panier), calcul: `${eur(a.chiffre)} ÷ ${qte(a.tickets)} = ${eur(auCentime(a.panier))}` },
        ];
      },
      explication: (c) => {
        const x = leSamediApresLaFormation(c);
        return [
          `La transformation passe de ${pct(auDixieme(x.avant.transformation * 100))} à ${pct(auDixieme(x.apres.transformation * 100))}, le panier de ${eur(auCentime(x.avant.panier))} à ${eur(auCentime(x.apres.panier))}. L'indice de vente baisse un peu (${qte(auCentime(x.avant.indice))} puis ${qte(auCentime(x.apres.indice))}) : elle vend plus cher, pas plus d'articles par client.`,
        ];
      },
    },
    {
      id: "les-techniques",
      type: "montants",
      titre: "Les deux techniques, et la marge",
      notions: ["average_basket", "contribution_margin"],
      tableau: tableauDuCas,
      question: () =>
        "Calculez le taux de vente additionnelle et le taux de montée en gamme de l'étudiante après la formation (en %, au dixième), sa marge sur coût variable des deux samedis, puis la marge gagnée.",
      champs: (c) => {
        const x = leSamediApresLaFormation(c);
        const a = x.apres;
        return [
          { libelle: "Vente additionnelle (%)", attendu: auDixieme(a.venteAdditionnelle * 100), tolerance: 0.1, calcul: `${qte(a.echarpesAvecLeCardigan)} ÷ ${qte(a.cardigans)} × 100 = ${pct(auDixieme(a.venteAdditionnelle * 100))}` },
          { libelle: "Montée en gamme (%)", attendu: auDixieme(a.monteeEnGamme * 100), tolerance: 0.1, calcul: `${qte(a.merinos)} ÷ ${qte(a.pulls)} × 100 = ${pct(auDixieme(a.monteeEnGamme * 100))}` },
          { libelle: "Marge du samedi d'avant", attendu: x.avant.marge, calcul: "La somme, référence par référence, des articles × leur marge" + ` = ${eur(x.avant.marge)}` },
          { libelle: "Marge du samedi d'après", attendu: a.marge, calcul: "La somme, référence par référence, des articles × leur marge" + ` = ${eur(a.marge)}` },
          { libelle: "Marge gagnée", attendu: x.margeGagnee, calcul: `${eur(a.marge)} − ${eur(x.avant.marge)} = ${eur(x.margeGagnee)}` },
        ];
      },
      explication: (c) => {
        const x = leSamediApresLaFormation(c);
        return [
          `Les ${qte(x.apres.merinos)} mérinos valent à eux seuls ${eur(auCentime(x.apres.merinos * x.s.margeDeLaMontee))} de marge de plus que des cols ronds : la montée en gamme fait l'essentiel des ${eur(x.margeGagnee)} gagnés. L'étudiante atteint le taux du vendeur (${pct(auDixieme(x.s.vendeur("vendeur").monteeEnGamme * 100))}).`,
        ];
      },
    },
    {
      id: "le-cardigan-rapporte",
      type: "choix",
      titre: "Le client au cardigan",
      notions: ["conversion_rate"],
      question: () => "Le client a essayé et payé son cardigan en boutique, samedi. Il le rapporte lundi, intact, et réclame son remboursement au nom du droit de rétractation. Que lui répondez-vous ?",
      options: () => [
        {
          texte: "Il n'a pas ce droit : la boutique peut faire un geste",
          juste: true,
          retour: `Oui : un achat conclu en boutique n'ouvre aucun droit de rétractation ; les ${qte(JOURS_DE_RETRACTATION)} jours valent pour une vente à distance ou hors établissement. La boutique peut proposer un échange ou un avoir, si sa politique de retour le prévoit et l'affiche.`,
        },
        {
          texte: `Le rembourser : tout client a ${qte(JOURS_DE_RETRACTATION)} jours pour changer d'avis, où qu'il ait acheté`,
          juste: false,
          retour: `Non : ce droit ne vaut que pour un contrat conclu à distance ou hors établissement. En boutique, le client a vu et essayé l'article.`,
        },
        {
          texte: "Le rembourser seulement s'il a gardé l'étiquette et le ticket de caisse",
          juste: false,
          retour: "Non : l'étiquette et le ticket servent une politique de retour, si la boutique en a une. Ils ne créent pas un droit que la loi ne donne pas en boutique.",
        },
      ],
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre avis à la responsable",
      question: () => "Quel avis rendez-vous à la responsable sur la formation ?",
      options: (c) => {
        const x = leSamediApresLaFormation(c);
        return [
          {
            texte: `Elle a payé : ${eur(x.margeGagnee)} de marge en plus par samedi`,
            juste: true,
            retour: `Oui : la marge passe de ${eur(x.avant.marge)} à ${eur(x.apres.marge)}, surtout par les mérinos. La transformation monte aussi, à ${pct(auDixieme(x.apres.transformation * 100))}. Un seul samedi ne fait pas une tendance : à suivre sur un mois.`,
          },
          {
            texte: `Elle a payé : le chiffre d'affaires a monté de ${eur(x.chiffreGagne)} par samedi`,
            juste: false,
            retour: `La conclusion est bonne, la mesure non : le chiffre d'affaires paie d'abord les coûts variables. Ce que la formation rapporte, c'est la marge gagnée, ${eur(x.margeGagnee)}.`,
          },
          {
            texte: `Elle n'a rien changé : l'indice de vente a baissé, à ${qte(auCentime(x.apres.indice))}`,
            juste: false,
            retour: `Non : l'indice baisse un peu parce qu'elle vend plus cher, pas moins. La marge par client accueilli passe de ${eur(auCentime(x.avant.margeParClient))} à ${eur(auCentime(x.apres.margeParClient))}.`,
          },
        ];
      },
    },
  ],
};
