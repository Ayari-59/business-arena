import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { budgetDuTrimestre } from "../budget";
import type { Cas } from "../cas";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LE BUDGET DE TRÉSORERIE (contrôle de gestion, palier 4).
 *
 * Le premier trimestre de l'arène est joué ; l'élève bâtit le budget de trésorerie du
 * deuxième en le reconduisant, avec les règles de paiement de l'arène (`budget.ts`) : ce
 * que les clients paieront, ce que le fournisseur recevra, les autres sorties, et la
 * trésorerie de fin de trimestre. Puis l'arène joue le deuxième trimestre : l'écart entre
 * le prévu et le réalisé ouvre le chapitre suivant, l'analyse des écarts.
 *
 * Le trimestre est l'unité de l'arène : le budget se tient au trimestre, comme elle.
 */

const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const ttc = (c: Cas) => (budgetDuTrimestre(c.code).tauxTva > 0 ? " TTC" : "");

/** Les écarts du deuxième trimestre, réalisé moins prévu. */
export function ecartsDuBudget(c: Cas) {
  const b = budgetDuTrimestre(c.code);
  const encaissements = b.realise.encaissements - b.prevu.encaissements;
  const decaissements = b.realise.decaissements - b.prevu.decaissements;
  return {
    encaissements,
    decaissements,
    tresorerie: b.realise.tresorerieFin - b.prevu.tresorerieFin,
    /** Ce qui pèse le plus sur l'écart de trésorerie. */
    principal: Math.abs(encaissements) >= Math.abs(decaissements) ? ("encaissements" as const) : ("decaissements" as const),
  };
}

export const BUDGET_DE_TRESORERIE: Chapitre = {
  code: "budget-de-tresorerie",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: [
    "BTS CG P5 · Analyse et prévision de l'activité",
    "DCG UE11 · Contrôle de gestion",
  ],
  titre: "Le budget de trésorerie",
  accroche:
    "Prévoir l'argent du trimestre qui vient, avec les délais des clients et du fournisseur, puis laisser l'arène le jouer : le prévu face au réalisé.",
  objectifs: [
    "Prévoir les encaissements à partir des ventes et des créances clients",
    "Prévoir les décaissements : fournisseur, charges, emprunt, impôt",
    "Calculer la trésorerie de fin de période et ce qu'elle annonce",
    "Comparer le budget au réalisé et chercher d'où vient l'écart",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Prévoir l'argent, pas le résultat",
      notions: ["cash_budget"],
      texte: (c) => {
        const b = budgetDuTrimestre(c.code);
        return [
          `Le premier trimestre de ${c.entreprise} est joué dans l'arène : ${eur(b.t1.ventes)} de ventes hors taxes, et ${eur(b.t1.tresorerieFin)} en banque au 31 mars.`,
          "Le dirigeant veut savoir s'il manquera d'argent au deuxième trimestre. Le compte de résultat ne le dit pas : une vente n'est pas un encaissement, un achat n'est pas un paiement. Le budget de trésorerie suit l'argent lui-même, ce qui entre et ce qui sort, à la date où il entre et où il sort.",
          "Faute de mieux, le budget reconduit le premier trimestre : mêmes ventes, mêmes achats, mêmes charges, aux mêmes délais. Puis l'arène jouera le deuxième, et l'on verra ce que la reconduction n'a pas vu venir.",
        ];
      },
      repere: () =>
        "Trésorerie de fin = trésorerie de début + encaissements − décaissements. Les encaissements clients = créances du début + ventes TTC de la période − créances de la fin.",
    },
    {
      id: "encaissements",
      type: "montants",
      titre: "Ce que les clients paieront",
      notions: ["cash_budget", "bfr"],
      question: (c) => {
        const b = budgetDuTrimestre(c.code);
        return `Au 31 mars, les clients doivent encore ${eur(b.t1.creancesFin)}. Le budget prévoit ${eur(b.prevu.ventesTtc)} de ventes${ttc(c)} au deuxième trimestre, payées aux mêmes délais qu'au premier. Combien les clients devront-ils au 30 juin, et combien paieront-ils pendant le trimestre ?`;
      },
      champs: (c) => {
        const b = budgetDuTrimestre(c.code);
        return [
          {
            libelle: "Créances clients au 30 juin",
            attendu: b.t1.creancesFin,
            calcul: `les mêmes ventes aux mêmes délais laissent les mêmes créances : ${eur(b.t1.creancesFin)}`,
            tolerance: 1,
          },
          {
            libelle: "Encaissements clients du trimestre",
            attendu: b.prevu.encaissements,
            calcul: `${eur(b.t1.creancesFin)} + ${eur(b.prevu.ventesTtc)} − ${eur(b.t1.creancesFin)} = ${eur(b.prevu.encaissements)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const b = budgetDuTrimestre(c.code);
        return [
          b.t1.creancesFin > 0
            ? `Les clients paient avec retard : ${eur(b.t1.creancesFin)} de ventes de mars rentrent en avril, autant de ventes de juin rentreront en juillet. Tant que l'activité est stable, l'un compense l'autre.`
            : `Les clients de ${c.entreprise} paient comptant : tout ce qui se vend dans le trimestre s'encaisse dans le trimestre.`,
        ];
      },
    },
    {
      id: "fournisseur",
      type: "montants",
      titre: "Ce que le fournisseur recevra",
      notions: ["cash_budget", "bfr"],
      question: (c) => {
        const b = budgetDuTrimestre(c.code);
        return `Au 31 mars, ${c.entreprise} doit ${eur(b.t1.dettesFournisseursFin)} à son fournisseur. Le budget reconduit les achats du premier trimestre : ${eur(b.prevu.achatsTtc)}${ttc(c)}, payés au même délai. Que devra l'entreprise au 30 juin, et combien paiera-t-elle pendant le trimestre ?`;
      },
      champs: (c) => {
        const b = budgetDuTrimestre(c.code);
        return [
          {
            libelle: "Dettes fournisseurs au 30 juin",
            attendu: b.t1.dettesFournisseursFin,
            calcul: `les mêmes achats au même délai laissent la même dette : ${eur(b.t1.dettesFournisseursFin)}`,
            tolerance: 1,
          },
          {
            libelle: "Paiements au fournisseur du trimestre",
            attendu: b.prevu.paiementsFournisseurs,
            calcul: `${eur(b.t1.dettesFournisseursFin)} + ${eur(b.prevu.achatsTtc)} − ${eur(b.t1.dettesFournisseursFin)} = ${eur(b.prevu.paiementsFournisseurs)}`,
            tolerance: 1,
          },
        ];
      },
      explication: () => [
        "Le délai du fournisseur joue dans l'autre sens que celui des clients : il laisse l'argent dans l'entreprise un peu plus longtemps. C'est le même mécanisme que le besoin en fonds de roulement, vu trimestre par trimestre.",
      ],
    },
    {
      id: "autres-sorties",
      type: "montants",
      titre: "Les autres sorties",
      notions: ["cash_budget"],
      question: (c) => {
        const b = budgetDuTrimestre(c.code);
        const p = b.prevu;
        const lignes = [
          ...p.reconduits.map((l) => `${l.libelle} ${eur(l.montant)}`),
          `remboursement d'emprunt ${eur(p.emprunt)}`,
          ...(p.tva > 0 ? [`TVA du premier trimestre, reversée en avril, ${eur(p.tva)}`] : []),
          `acompte d'impôt sur les bénéfices ${eur(p.impot)}`,
        ];
        return `Les autres sorties reconduites : ${lignes.join(" ; ")}. Il reste les intérêts : l'emprunt restant dû au 31 mars est de ${eur(b.t1.detteFinanciereFin)}, au taux annuel de ${pct(p.tauxAnnuel)}, sur un trimestre de 90 jours (année de 360 jours). Calculez les intérêts, puis le total de ces autres sorties.`;
      },
      champs: (c) => {
        const b = budgetDuTrimestre(c.code);
        const p = b.prevu;
        const autres = p.decaissements - p.paiementsFournisseurs;
        return [
          {
            libelle: "Intérêts du trimestre",
            attendu: p.interets,
            calcul: `${eur(b.t1.detteFinanciereFin)} × ${pct(p.tauxAnnuel)} × 90 ÷ 360 = ${eur(p.interets)}`,
            tolerance: 1,
          },
          {
            libelle: "Total des autres sorties",
            attendu: autres,
            calcul: `${[...p.reconduits.map((l) => l.montant), p.interets, p.emprunt, ...(p.tva > 0 ? [p.tva] : []), p.impot].map(eur).join(" + ")} = ${eur(autres)}`,
            tolerance: 2,
          },
        ];
      },
      explication: (c) => {
        const b = budgetDuTrimestre(c.code);
        return [
          `L'acompte d'impôt (${eur(b.prevu.impot)}) est celui de l'arène : l'impôt du résultat cumulé de l'exercice, moins ce qui a déjà été versé. Le remboursement de l'emprunt sort de la trésorerie sans être une charge : il ne paraît pas au compte de résultat, mais il manque bien en banque.`,
        ];
      },
    },
    {
      id: "tresorerie",
      type: "montants",
      titre: "La trésorerie prévue",
      notions: ["cash_budget"],
      question: (c) => {
        const b = budgetDuTrimestre(c.code);
        return `La trésorerie du 31 mars est de ${eur(b.t1.tresorerieFin)}. Calculez les décaissements du trimestre (le fournisseur et les autres sorties), puis la trésorerie prévue au 30 juin (négative pour un découvert).`;
      },
      champs: (c) => {
        const b = budgetDuTrimestre(c.code);
        const p = b.prevu;
        return [
          {
            libelle: "Décaissements du trimestre",
            attendu: p.decaissements,
            calcul: `${eur(p.paiementsFournisseurs)} + ${eur(p.decaissements - p.paiementsFournisseurs)} = ${eur(p.decaissements)}`,
            tolerance: 2,
          },
          {
            libelle: "Trésorerie prévue au 30 juin",
            attendu: p.tresorerieFin,
            calcul: `${eur(b.t1.tresorerieFin)} + ${eur(p.encaissements)} − ${eur(p.decaissements)} = ${eur(p.tresorerieFin)}`,
            tolerance: 2,
          },
        ];
      },
      explication: (c) => {
        const p = budgetDuTrimestre(c.code).prevu;
        return [
          p.tresorerieFin < 0
            ? `Le budget annonce un découvert de ${eur(-p.tresorerieFin)} au 30 juin.`
            : `Le budget annonce ${eur(p.tresorerieFin)} en banque au 30 juin.`,
        ];
      },
    },
    {
      id: "a-quoi-sert",
      type: "choix",
      titre: "À quoi sert ce budget",
      notions: ["cash_budget"],
      question: (c) => {
        const p = budgetDuTrimestre(c.code).prevu;
        return p.tresorerieFin < 0
          ? `Le budget annonce un découvert de ${eur(-p.tresorerieFin)} au 30 juin. Que fait le dirigeant, dès avril ?`
          : `Le budget annonce ${eur(p.tresorerieFin)} en banque au 30 juin. Qu'est-ce que le dirigeant y a gagné ?`;
      },
      options: (c) => {
        const p = budgetDuTrimestre(c.code).prevu;
        return p.tresorerieFin < 0
          ? [
              {
                texte: "Il négocie dès maintenant le financement qui manquera : un découvert autorisé, l'escompte de créances, ou il décale une dépense.",
                juste: true,
                retour:
                  "C'est cela. Un besoin de trésorerie annoncé trois mois à l'avance se négocie ; découvert le jour même, il se subit, au taux le plus cher, quand la banque accepte.",
              },
              {
                texte: "Il attend le relevé de juin : un budget n'est qu'une prévision.",
                juste: false,
                retour: "En juin, il sera trop tard pour négocier : le budget sert justement à voir le trou avant d'y tomber.",
              },
              {
                texte: "Il réduit ses ventes pour moins acheter.",
                juste: false,
                retour: "Les ventes font rentrer l'argent : les réduire creuserait le trou. C'est le financement du décalage qu'il faut trouver.",
              },
            ]
          : [
              {
                texte: "Il sait à l'avance qu'aucun financement n'est à chercher, et de combien il dispose pour investir ou placer.",
                juste: true,
                retour:
                  "C'est cela. Un budget sans découvert n'est pas inutile : il dit ce que l'entreprise peut engager sans risque, et il servira de référence pour lire le réalisé.",
              },
              {
                texte: "Rien : le budget ne sert que quand la trésorerie devient négative.",
                juste: false,
                retour: "Il sert aussi à décider ce qu'on peut engager, et à comparer ensuite le réalisé au prévu.",
              },
              {
                texte: "Il a la garantie de finir le trimestre avec cette somme.",
                juste: false,
                retour: "Un budget n'est pas une garantie : c'est une prévision, sur des hypothèses. L'arène va le montrer.",
              },
            ];
      },
    },
    {
      id: "realise",
      type: "lecture",
      titre: "L'arène joue le deuxième trimestre",
      notions: ["cash_budget"],
      texte: (c) => {
        const b = budgetDuTrimestre(c.code);
        const e = ecartsDuBudget(c);
        return [
          `L'arène a joué le deuxième trimestre de ${c.entreprise}. Ventes hors taxes : ${eur(b.realise.ventes)} pour ${eur(b.t1.ventes)} prévus. Encaissements : ${eur(b.realise.encaissements)} pour ${eur(b.prevu.encaissements)} prévus. Décaissements : ${eur(b.realise.decaissements)} pour ${eur(b.prevu.decaissements)} prévus.`,
          `Trésorerie au 30 juin : ${eur(b.realise.tresorerieFin)}, pour ${eur(b.prevu.tresorerieFin)} prévus. ${e.tresorerie >= 0 ? `${eur(e.tresorerie)} de mieux` : `${eur(-e.tresorerie)} de moins`} que le budget.`,
        ];
      },
    },
    {
      id: "d-ou-vient-l-ecart",
      type: "choix",
      titre: "D'où vient l'écart",
      notions: ["cash_budget", "volume_price_variance"],
      question: () => "Qu'est-ce qui pèse le plus dans l'écart de trésorerie ?",
      options: (c) => {
        const e = ecartsDuBudget(c);
        const sens = (x: number) => (x >= 0 ? `${eur(x)} de plus` : `${eur(-x)} de moins`);
        return [
          {
            texte: "Les encaissements : les ventes du deuxième trimestre n'ont pas été celles du premier.",
            juste: e.principal === "encaissements",
            retour: `Les encaissements font ${sens(e.encaissements)} que prévu, les décaissements ${sens(e.decaissements)}. ${e.principal === "encaissements" ? "C'est bien le côté des ventes qui pèse le plus : la reconduction a supposé un marché immobile." : "C'est pourtant le côté des sorties qui pèse le plus."}`,
          },
          {
            texte: "Les décaissements : l'entreprise n'a pas acheté ni dépensé ce que la reconduction supposait.",
            juste: e.principal === "decaissements",
            retour: `Les décaissements font ${sens(e.decaissements)} que prévu, les encaissements ${sens(e.encaissements)}. ${e.principal === "decaissements" ? "C'est bien le côté des sorties qui pèse le plus : les achats, l'impôt ou le stock n'ont pas suivi la reconduction." : "C'est pourtant le côté des ventes qui pèse le plus."}`,
          },
          {
            texte: "Les intérêts de l'emprunt.",
            juste: false,
            retour: "Les intérêts se prévoient presque au centime : ils dépendent de la dette restante et du taux, connus à l'avance.",
          },
        ];
      },
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["cash_budget"],
      texte: (c) => {
        const e = ecartsDuBudget(c);
        return [
          `Vous avez bâti le budget de trésorerie de ${c.entreprise} pour un trimestre, puis vous l'avez confronté à l'arène : ${eur(Math.abs(e.tresorerie))} d'écart sur la trésorerie de fin.`,
          "Un budget se juge moins à sa justesse qu'à ce qu'on en fait : il annonce les besoins avant qu'ils arrivent, et il donne une référence pour lire le réalisé. Reste à décomposer l'écart, ce qui vient des quantités et ce qui vient des prix : c'est l'analyse des écarts.",
        ];
      },
      repere: () =>
        "Encaissements = créances du début + ventes TTC − créances de fin ; paiements au fournisseur = dettes du début + achats TTC − dettes de fin ; trésorerie de fin = début + encaissements − décaissements.",
    },
  ],
};
