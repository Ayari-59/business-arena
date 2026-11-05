import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_POINT_DE_VENTE, ficheDe } from "../../chapitres/equipe-et-planning";
import { coutVariable, referenceDe } from "../../monde/boutique";
import { CHALLENGE_DU_MERINOS, challenge } from "../../monde/equipe-de-la-boutique";
import type { TableauDeDonnees } from "../../types";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « RÉMUNÉRER ET STIMULER LES VENDEURS » : LE CHALLENGE DU MÉRINOS (BTS MCO,
 * palier 4).
 *
 * La direction de MAILLE & CO veut un challenge de montée en gamme : le pull mérinos plutôt que le
 * pull col rond. Elle a calculé son seuil sur la marge entière d'un mérinos. L'élève voit que la
 * plupart des mérinos en plus remplaceront un col rond : une vente reportée ne rapporte que l'écart de
 * marge entre les deux pulls. Il refait le gain avec les reports, le seuil si tous les mérinos étaient
 * des reports, et répond : le challenge se paie encore, mais deux fois moins que la direction ne le
 * croit, et ses règles doivent compter les heures de chacun.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours : ses chiffres sont ceux de
 * `challenge` (monde/equipe-de-la-boutique.ts), sur la fiche de la boutique.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

/** Les chiffres de la réponse, calculés une fois du cas. */
export function challengeDuMerinos(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const k = CHALLENGE_DU_MERINOS;
  const merinos = referenceDe(f, k.reference);
  const col = referenceDe(f, k.remplace);
  const margeDuMerinos = auCentime(merinos.prixHt - coutVariable(merinos));
  const margeDuCol = auCentime(col.prixHt - coutVariable(col));
  const margeDUnReport = auCentime(margeDuMerinos - margeDuCol);
  const nouveaux = k.enPlus - k.reportes;
  const margeEnPlus = auCentime(nouveaux * margeDuMerinos + k.reportes * margeDUnReport);
  const naif = challenge(f, k, k.enPlus);
  const toutReporte = challenge(f, k, k.enPlus, margeDUnReport);
  return {
    f,
    k,
    merinos,
    col,
    margeDuMerinos,
    margeDuCol,
    margeDUnReport,
    nouveaux,
    margeEnPlus,
    cout: naif.cout,
    gain: auCentime(margeEnPlus - naif.cout),
    gainCroit: naif.gain,
    seuilCroit: naif.seuil,
    seuilToutReporte: toutReporte.seuil,
  };
}

function tableauDesDeuxPulls(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = challengeDuMerinos(c);
  return {
    titre: `${x.f.entreprise} · les pulls du challenge`,
    colonnes: ["Prix HT", "Coût variable"],
    lignes: [x.merinos, x.col].map((r) => ({ libelle: r.nom, valeurs: [eur(r.prixHt), eur(coutVariable(r))] })),
  };
}

export const LE_CHALLENGE_DU_MERINOS: Situation = {
  code: "le-challenge-du-merinos",
  parcours: "mco",
  palier: 4,
  blocs: [],
  reprend: ["remunerer-et-stimuler-les-vendeurs"],
  commanditaire: "La direction",
  titre: "Le challenge du mérinos",
  accroche:
    "La direction veut un challenge pour vendre le pull mérinos plutôt que le col rond. Son calcul compte la marge entière de chaque mérinos. Mais un client qui monte en gamme n'achète plus son col rond.",
  objectifs: [
    "Calculer la marge d'une vente reportée d'une référence vers une autre",
    "Chiffrer le gain d'un challenge avec ses reports",
    "Répondre à la direction sur le challenge et ses règles",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_POINT_DE_VENTE,
    pourquoi: "ce cas reprend le chapitre « Rémunérer et stimuler les vendeurs », qui se joue à la boutique du cours, MAILLE & CO, et à ses vendeurs.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      tableau: tableauDesDeuxPulls,
      texte: (c) => {
        const x = challengeDuMerinos(c);
        return [
          `« En mars, je veux vendre du mérinos. Le meilleur vendeur gagnera ${eur(x.k.dotation)} bruts, et l'équipe ${eur(x.k.parArticle)} par mérinos vendu en plus de janvier. J'en attends ${qte(x.k.enPlus)} de plus. D'après mon calcul, le challenge se paie dès ${qte(x.seuilCroit)} mérinos et rapporte ${eur(x.gainCroit)}. »`,
          `« L'adjointe me dit que ${qte(x.k.reportes)} de ces mérinos seront vendus à des clients venus pour un col rond. Cela change-t-il quelque chose ? »`,
          "Pas de cours cette fois : les calculs sont ceux du chapitre, à vous d'en trouver l'ordre.",
        ];
      },
      repere: () => "À rendre : la marge d'une vente reportée, le gain du challenge avec les reports, son seuil si tout était reporté, et votre réponse.",
    },
    {
      id: "la-marge-d-un-report",
      type: "montants",
      titre: "Ce que rapporte une vente reportée",
      notions: ["contribution_margin", "cannibalization"],
      question: () => "Calculez la marge sur coût variable d'un pull mérinos, celle d'un pull col rond, puis ce que rapporte un mérinos vendu à un client qui aurait pris un col rond.",
      champs: (c) => {
        const x = challengeDuMerinos(c);
        return [
          { libelle: "Marge d'un mérinos", attendu: x.margeDuMerinos, calcul: `${eur(x.merinos.prixHt)} − ${eur(coutVariable(x.merinos))} = ${eur(x.margeDuMerinos)}` },
          { libelle: "Marge d'un col rond", attendu: x.margeDuCol, calcul: `${eur(x.col.prixHt)} − ${eur(coutVariable(x.col))} = ${eur(x.margeDuCol)}` },
          { libelle: "Marge d'une vente reportée", attendu: x.margeDUnReport, calcul: `${eur(x.margeDuMerinos)} − ${eur(x.margeDuCol)} = ${eur(x.margeDUnReport)}` },
        ];
      },
      explication: (c) => {
        const x = challengeDuMerinos(c);
        return [`Un client qui monte en gamme rapporte ${eur(x.margeDUnReport)} de plus, pas ${eur(x.margeDuMerinos)} : la marge du col rond qu'il n'achète plus part avec lui.`];
      },
    },
    {
      id: "le-gain-avec-les-reports",
      type: "montants",
      titre: "Le gain, reports compris",
      notions: ["contribution_margin", "pay_and_motivation"],
      question: (c) => {
        const x = challengeDuMerinos(c);
        return `Sur les ${qte(x.k.enPlus)} mérinos en plus, ${qte(x.k.reportes)} sont des reports. Calculez la marge qu'ils apportent vraiment, le coût chargé du challenge, ce qu'il rapporte, puis le nombre de mérinos qui le paierait si tous étaient des reports (arrondi au-dessus).`;
      },
      champs: (c) => {
        const x = challengeDuMerinos(c);
        const t = 1 + x.f.tauxPatronal;
        return [
          { libelle: "Marge apportée", attendu: x.margeEnPlus, calcul: `${qte(x.nouveaux)} × ${eur(x.margeDuMerinos)} + ${qte(x.k.reportes)} × ${eur(x.margeDUnReport)} = ${eur(x.margeEnPlus)}` },
          { libelle: "Coût chargé du challenge", attendu: x.cout, calcul: `(${eur(x.k.dotation)} + ${qte(x.k.enPlus)} × ${eur(x.k.parArticle)}) × ${qte(t)} = ${eur(x.cout)}` },
          { libelle: "Ce que le challenge rapporte", attendu: x.gain, calcul: `${eur(x.margeEnPlus)} − ${eur(x.cout)} = ${eur(x.gain)}` },
          {
            libelle: "Seuil si tout était reporté",
            attendu: x.seuilToutReporte,
            calcul: `${eur(x.k.dotation)} × ${qte(t)} ÷ (${eur(x.margeDUnReport)} − ${eur(x.k.parArticle)} × ${qte(t)}) = ${qte(Math.round(((x.k.dotation * t) / (x.margeDUnReport - x.k.parArticle * t)) * 100) / 100)}, arrondi à ${qte(x.seuilToutReporte)}`,
          },
        ];
      },
      explication: (c) => {
        const x = challengeDuMerinos(c);
        return [`Le challenge rapporte ${eur(x.gain)}, pas ${eur(x.gainCroit)} : les reports en retirent ${eur(auCentime(x.gainCroit - x.gain))}. Il reste rentable, et son seuil monte à ${qte(x.seuilToutReporte)} mérinos si chaque vente n'était qu'un report.`];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      notions: ["pay_and_motivation", "contribution_margin"],
      question: () => "Quelle réponse envoyez-vous à la direction ?",
      options: (c) => {
        const x = challengeDuMerinos(c);
        const lancer = x.gain > 0;
        return [
          {
            texte: `Le lancer : ${eur(x.gain)}, reports déduits`,
            juste: lancer,
            retour: lancer
              ? `Oui : même avec ${qte(x.k.reportes)} reports, le challenge rapporte ${eur(x.gain)}. Ses règles se comptent en mérinos par heure de vente, écrites avant mars, et la dotation passe sur le bulletin.`
              : "Non : avec les reports, le challenge coûte plus qu'il ne rapporte.",
          },
          {
            texte: `Le lancer : il rapporte ${eur(x.gainCroit)}`,
            juste: false,
            retour: `Non : c'est compter la marge entière des ${qte(x.k.reportes)} reports. Ils ne rapportent que ${eur(x.margeDUnReport)} chacun : le gain est de ${eur(x.gain)}.`,
          },
          {
            texte: "Y renoncer : chaque mérinos vendu fait perdre un col rond",
            juste: !lancer,
            retour: lancer
              ? `Non : un report rapporte encore ${eur(x.margeDUnReport)}, et le mérinos laisse plus de marge que le col rond. Le challenge se paie.`
              : "Oui : avec les reports, il ne se paie pas.",
          },
        ];
      },
    },
  ],
};
