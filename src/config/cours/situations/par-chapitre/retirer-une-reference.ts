import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DE_L_ASSORTIMENT, PART_REPORTEE, assortimentDuPointDeVente, retrait } from "../../chapitres/assortiment";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « L'ASSORTIMENT : MARGE ET VOLUME » : RETIRER UNE RÉFÉRENCE ? (BTS MCO,
 * palier 4).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : la gamme de janvier de la boutique MAILLE & CO
 * (monde/maille-et-co.ts), et le retrait d'une référence du modèle (monde/boutique.ts,
 * `retirerUneReference`), par le chapitre (`assortimentDuPointDeVente`, `retrait`).
 *
 * La direction veut alléger l'offre en retirant la référence qui laisse le moins de marge. D'après ses
 * études, 30 % de ses ventes se reporteraient sur les autres références. Elle demande ce que le retrait
 * ferait gagner ou perdre à la marge du mois. L'élève refait seul les calculs du chapitre : la marge de
 * la référence et celle des autres, le report et son effet net ; puis il remonte, au curseur, à la part
 * reportée qui rendrait le retrait gratuit (un calcul à rebours), et croise ce retrait avec celui de
 * l'autre candidate, l'écharpe. La réponse demande un jugement : comparer l'hypothèse des études à la
 * part qui compense, et ne pas se tromper de référence.
 *
 * Les pièges : compter le chiffre d'affaires de la référence, ou toute sa marge, comme perdus ; croire
 * qu'une référence qui marge peu par article se retire forcément avec profit.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number, chiffres = 1) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: chiffres }).replace(/^-/, "−")} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;
const auDixieme = (x: number) => Math.round(x * 10) / 10 + 0;

/** Les chiffres de la réponse, calculés une fois sur la fiche. */
export function retirerUneReference(c: Pick<Cas, "code">) {
  const x = assortimentDuPointDeVente(c);
  const r = x.leRetrait;
  const autre = x.variante;
  return { ...x, r, autre, margeUnitaireDesAutres: auCentime(r.margeUnitaireDesAutres) };
}

const tableauDeLaGamme = (c: Pick<Cas, "code">) => {
  const x = assortimentDuPointDeVente(c);
  return {
    titre: `La gamme de ${x.f.entreprise}, en ${x.f.moisDeReference}`,
    colonnes: ["Articles vendus", "Prix hors taxes", "Coût variable"],
    lignes: x.lignes.map((r) => ({ libelle: r.nom, valeurs: [qte(r.ventes), eur(r.prixHt), eur(r.coutVariable)] })),
  };
};

export const RETIRER_UNE_REFERENCE: Situation = {
  code: "retirer-une-reference",
  parcours: "mco",
  palier: 4,
  blocs: [],
  reprend: ["assortiment"],
  commanditaire: "La direction",
  titre: "Retirer une référence ?",
  accroche:
    "La direction veut retirer la référence qui laisse le moins de marge. Une partie de ses clients achèteraient autre chose : que gagnerait, ou que perdrait, la marge du mois ?",
  objectifs: [
    "Calculer la marge d'une référence et la marge moyenne d'un article des autres",
    "Chiffrer la marge récupérée par le report des ventes, et l'effet net du retrait",
    "Retrouver à rebours la part reportée qui rendrait le retrait gratuit",
    "Comparer deux retraits, et répondre à la direction",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_L_ASSORTIMENT,
    pourquoi: "ce cas reprend la gamme du chapitre, à la boutique MAILLE & CO, le seul point de vente que la simulation du cours suit d'un chapitre à l'autre.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande de la direction",
      texte: (c) => {
        const x = retirerUneReference(c);
        return [
          `« Je veux alléger l'offre de ${x.f.entreprise} en retirant la référence qui nous laisse le moins de marge. Ses clients ne sont pas tous perdus : d'après nos études, ${pct(PART_REPORTEE * 100)} de ses ventes se reporteraient sur nos autres références, à leur marge moyenne. Que gagnerait, ou que perdrait, notre marge du mois ? Et à partir de quel report le retrait serait-il gratuit ? »`,
          "Pas de cours cette fois : vous avez la gamme du mois, référence par référence, et la méthode est celle du chapitre. À vous de trouver la référence et de chiffrer le retrait.",
        ];
      },
      tableau: tableauDeLaGamme,
      repere: () =>
        "À rendre : la marge de la référence visée et celle des autres, la marge moyenne d'un article des autres références, la marge récupérée par le report, l'effet net du retrait, la part qui le compense, la comparaison avec l'autre candidate, et votre réponse.",
    },
    {
      id: "les-marges",
      type: "montants",
      titre: "Ce que la référence laisse",
      notions: ["contribution_margin", "assortment"],
      tableau: tableauDeLaGamme,
      question: () =>
        "Trouvez la référence qui laisse le moins de marge. Calculez sa marge du mois, la marge du mois des autres références, puis la marge moyenne d'un article de ces autres références (au centime).",
      champs: (c) => {
        const x = retirerUneReference(c);
        return [
          { libelle: `Marge du mois · ${x.derniere.nom}`, attendu: x.derniere.marge, calcul: `${qte(x.derniere.ventes)} × (${eur(x.derniere.prixHt)} − ${eur(x.derniere.coutVariable)}) = ${eur(x.derniere.marge)}` },
          {
            libelle: "Marge du mois des autres références",
            attendu: x.r.margeDesAutres,
            calcul: `${x.lignes
              .filter((l) => l.code !== x.derniere.code)
              .map((l) => eur(l.marge))
              .join(" + ")} = ${eur(x.r.margeDesAutres)}`,
          },
          {
            libelle: "Marge moyenne d'un article des autres références",
            attendu: x.margeUnitaireDesAutres,
            tolerance: 0.01,
            calcul: `${eur(x.r.margeDesAutres)} ÷ ${qte(x.r.ventesDesAutres)} articles = ${eur(x.margeUnitaireDesAutres)}`,
          },
        ];
      },
      explication: (c) => {
        const x = retirerUneReference(c);
        return [
          `La plus petite marge est celle du ${x.r.nom} : ${eur(x.derniere.marge)} par mois, ${pct(x.derniere.partDeLaMarge)} de la marge de la gamme. Un article des autres références laisse en moyenne ${eur(x.margeUnitaireDesAutres)}, plus que les ${eur(x.derniere.margeUnitaire)} d'un ${x.r.nom} : un client reporté rapporte plus qu'avant.`,
        ];
      },
    },
    {
      id: "le-report",
      type: "montants",
      titre: "Ce que le report rattrape",
      notions: ["assortment", "cannibalization"],
      question: (c) => {
        const x = retirerUneReference(c);
        return `Sans le ${x.r.nom}, ${pct(PART_REPORTEE * 100)} de ses ventes se reportent sur les autres références. Calculez les articles reportés, la marge qu'ils rapportent, puis l'effet net du retrait sur la marge du mois (négatif s'il en fait perdre).`;
      },
      champs: (c) => {
        const x = retirerUneReference(c);
        const r = x.r;
        return [
          { libelle: "Articles reportés", attendu: r.unitesReportees, calcul: `${qte(r.visee.ventes)} × ${pct(PART_REPORTEE * 100)} = ${qte(r.unitesReportees)}` },
          { libelle: "Marge récupérée par le report", attendu: r.margeRecuperee, tolerance: 0.5, calcul: `${qte(r.unitesReportees)} × (${eur(r.margeDesAutres)} ÷ ${qte(r.ventesDesAutres)}) = ${eur(r.margeRecuperee)}` },
          { libelle: "Effet net sur la marge du mois", attendu: r.effetNet, tolerance: 0.5, calcul: `${eur(r.margeRecuperee)} − ${eur(r.visee.marge)} = ${eur(r.effetNet)}` },
        ];
      },
      explication: (c) => {
        const x = retirerUneReference(c);
        const r = x.r;
        return [
          `Le report rattrape ${eur(r.margeRecuperee)} sur les ${eur(r.visee.marge)} que laissait le ${r.nom} : la marge du mois y perd ${eur(-r.effetNet)}, alors que le loyer et l'équipe restent les mêmes.`,
        ];
      },
    },
    {
      id: "le-report-qui-compense",
      type: "curseur",
      titre: "Le report qui rendrait le retrait gratuit",
      notions: ["assortment", "cannibalization"],
      question: (c) => {
        const x = retirerUneReference(c);
        return `La direction demande à partir de quel report le retrait serait gratuit. Faites varier la part des ventes du ${x.r.nom} qui se reporte, de 0 à 100 % : une droite donne la marge que le report rattrape, l'autre la marge que le ${x.r.nom} laissait. Placez le curseur sur la plus petite part où le retrait ne coûte rien, puis validez.`;
      },
      grandeur: (c) => ({ libelle: `Part des ventes du ${retirerUneReference(c).r.nom} reportée`, unite: "%" }),
      cible: (c) => ({ attendu: retirerUneReference(c).partEntiereQuiCompense, min: 0, max: 100 }),
      zones: ["Le retrait ne coûte rien", "Le retrait coûte de la marge"],
      rates: () => ({
        dessous: "À cette part, le report rattrape moins que ce que la référence laissait.",
        dessus: "Le retrait ne coûte déjà rien avec moins de report : cherchez la plus petite part.",
      }),
      montrer: "Montrer la part qui compense",
      lecture: (c, part) => {
        const x = retirerUneReference(c);
        const r = retrait(x.f, x.derniere.code, part / 100);
        return [
          { libelle: "Marge récupérée par le report", montant: r.margeRecuperee },
          { libelle: "Marge perdue avec la référence", montant: r.visee.marge },
          { libelle: "Effet net sur la marge du mois", montant: r.effetNet, fort: true },
        ];
      },
      droites: (c) => {
        const r = retirerUneReference(c).r;
        return {
          produit: (part) => (r.visee.ventes * part * r.margeUnitaireDesAutres) / 100,
          cout: () => r.visee.marge,
          libelles: ["Marge récupérée par le report", "Marge perdue avec la référence"],
        };
      },
      explication: (c) => {
        const x = retirerUneReference(c);
        return [
          `Il faudrait ${pct(x.partEntiereQuiCompense)} de report (${pct(auDixieme(x.r.partQuiCompense))} au dixième) : la marge d'un ${x.r.nom}, ${eur(x.derniere.margeUnitaire)}, divisée par celle d'un article des autres, ${eur(x.margeUnitaireDesAutres)}. Les études en annoncent ${pct(PART_REPORTEE * 100)}.`,
        ];
      },
    },
    {
      id: "l-autre-candidate",
      type: "montants",
      titre: "L'autre candidate",
      notions: ["assortment", "cannibalization"],
      question: (c) => {
        const x = retirerUneReference(c);
        const a = x.autre;
        return `Un membre de la direction propose de retirer plutôt l'${a.nom}, qui ne laisse que ${eur(a.visee.margeUnitaire)} par article. Avec le même report, ${pct(PART_REPORTEE * 100)}, calculez la marge moyenne d'un article des autres références (au centime), l'effet net de ce retrait sur la marge du mois (négatif s'il en fait perdre), puis la part reportée qui le compenserait, en pourcentage, au dixième.`;
      },
      champs: (c) => {
        const x = retirerUneReference(c);
        const a = x.autre;
        return [
          {
            libelle: "Marge moyenne d'un article des autres références",
            attendu: auCentime(a.margeUnitaireDesAutres),
            tolerance: 0.01,
            calcul: `(${eur(x.margeDuMois)} − ${eur(a.visee.marge)}) ÷ (${qte(x.ventes)} − ${qte(a.visee.ventes)}) = ${eur(auCentime(a.margeUnitaireDesAutres))}`,
          },
          {
            libelle: "Effet net du retrait sur la marge du mois",
            attendu: a.effetNet,
            tolerance: 0.5,
            calcul: `${qte(a.visee.ventes)} × ${pct(PART_REPORTEE * 100)} = ${qte(a.unitesReportees)} articles ; ${qte(a.unitesReportees)} × ${eur(auCentime(a.margeUnitaireDesAutres))} − ${eur(a.visee.marge)} = ${eur(a.effetNet)}`,
          },
          {
            libelle: "Part reportée qui compense le retrait (%)",
            attendu: auDixieme(a.partQuiCompense),
            tolerance: 0.1,
            calcul: `${eur(a.visee.margeUnitaire)} ÷ ${eur(auCentime(a.margeUnitaireDesAutres))} × 100 = ${pct(auDixieme(a.partQuiCompense))}`,
          },
        ];
      },
      explication: (c) => {
        const x = retirerUneReference(c);
        const a = x.autre;
        return [
          `Retirer l'${a.nom} coûterait ${eur(-a.effetNet)} par mois, ${qte(auDixieme(a.effetNet / x.r.effetNet))} fois le retrait du ${x.r.nom}, et il faudrait ${pct(auDixieme(a.partQuiCompense))} de report. Elle vend ${qte(a.visee.ventes)} articles et laisse ${eur(a.visee.marge)} : plus de clients à perdre, et plus de marge avec eux.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la direction",
      question: () => "Quelle phrase envoyez-vous à la direction ?",
      options: (c) => {
        const x = retirerUneReference(c);
        const r = x.r;
        const a = x.autre;
        return [
          {
            texte: `Garder le ${r.nom} : retiré, il coûterait ${eur(-r.effetNet)} par mois`,
            juste: true,
            retour: `Oui : le ${r.nom} laisse ${eur(r.visee.marge)} de marge par mois, et le report en rattrape ${eur(r.margeRecuperee)} (${qte(r.unitesReportees)} articles à ${eur(x.margeUnitaireDesAutres)}). Il faudrait ${pct(x.partEntiereQuiCompense)} de report, et non ${pct(PART_REPORTEE * 100)}, pour qu'il ne coûte rien. Reste à peser ce que le chiffre ne dit pas : la place libérée, le stock, l'image de la gamme.`,
          },
          {
            texte: `Le retirer : sa marge, ${eur(r.visee.marge)}, est la plus petite du rayon`,
            juste: false,
            retour: `Non : la plus petite, mais une marge quand même. Retiré, le ${r.nom} emporte ${eur(r.visee.marge)} et le report n'en rattrape que ${eur(r.margeRecuperee)} : ${eur(-r.effetNet)} de perte par mois.`,
          },
          {
            texte: `Garder le ${r.nom} : retiré, il ferait perdre ${eur(r.visee.chiffreDAffaires)} de chiffre d'affaires par mois`,
            juste: false,
            retour: `La conclusion est bonne, la raison non : le chiffre d'affaires d'une référence paie d'abord ses coûts variables. Ce que le retrait met en jeu, c'est sa marge, ${eur(r.visee.marge)}, dont le report rattrape ${eur(r.margeRecuperee)}.`,
          },
          {
            texte: `Retirer plutôt l'${a.nom}, qui ne laisse que ${eur(a.visee.margeUnitaire)} par article`,
            juste: false,
            retour: `Non : l'${a.nom} laisse ${eur(a.visee.marge)} par mois, et son retrait coûterait ${eur(-a.effetNet)} avec le même report. Une petite marge par article ne fait pas une petite marge du mois.`,
          },
        ];
      },
    },
  ],
};
