import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { DELAI_DU_CURSEUR, ENTREPRISES_DES_FOURNISSEURS, choixDuFournisseur } from "../../chapitres/choisir-son-fournisseur";
import { auCentime } from "../../monde/amortissement";
import { DELAI_MAXIMAL_CONVENU, JOURS_DU_TRIMESTRE } from "../../monde/delais-et-tva";
import { comparerAvecLHabituelle, delaiFournisseurAllonge } from "../../monde/delais";
import { CAPACITES_DU_COURS } from "../../monde/nova-capacite";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « CHOISIR SON FOURNISSEUR » : LE FOURNISSEUR ALLONGE SON DÉLAI (BTS GPME,
 * palier 2).
 *
 * NOVA a dit à Électro-Composants Lyon, son fournisseur habituel, qu'elle pensait passer chez
 * AsiaComponents, 10 % moins cher. Pour la garder, il ne baisse pas ses prix : il lui laisse 30 jours
 * de plus pour payer, 60 au lieu de 30, le maximum que la loi permet. La dirigeante veut savoir ce que
 * vaut cette contre-offre face à AsiaComponents, et laquelle signer.
 *
 * L'élève chiffre le crédit en plus (HT et TTC, et le découvert qu'il évite), croise résultat et
 * trésorerie face à AsiaComponents, voit au curseur qu'aucun délai permis ne ferait rattraper à
 * AsiaComponents la contre-offre en trésorerie, puis finance le besoin et le confronte à ce que NOVA
 * peut porter. La réponse demande un jugement : chacune a son avantage, et c'est la capacité de
 * financement qui tranche.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours (src/config/cours/monde) : ses
 * chiffres sont ceux de monde/delais.ts (`delaiFournisseurAllonge`, `comparerAvecLHabituelle`) et de
 * la fiche de capacité de NOVA (monde/nova-capacite.ts, ce qu'elle peut encaisser d'un seul coup).
 */

/** Les jours de délai que le fournisseur habituel accorde en plus : 30, jusqu'au délai maximal convenu. */
export const JOURS_DE_DELAI_EN_PLUS = 30;

/** La borne haute du curseur du cas : au-delà du délai permis, pour voir où il faudrait aller. */
export const DELAI_MAXIMAL_DU_CURSEUR = 90;

const eur = (x: number) => montantEcrit(auCentime(x)).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const queDe = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `qu'${nom}` : `que ${nom}`);

/** Qui l'emporte : AsiaComponents (le prix), ou la contre-offre (le délai). */
export type Verdict = "le-prix" | "le-delai";

/** La contre-offre, face à l'offre habituelle d'aujourd'hui et face à AsiaComponents. */
export function delaiAllonge(c: Pick<Cas, "code">) {
  const k = choixDuFournisseur(c);
  const f = k.f;
  const a = k.asia;
  const allonge = delaiFournisseurAllonge(f, JOURS_DE_DELAI_EN_PLUS);
  const nouveauDelai = allonge.nouveauDelai;
  // AsiaComponents face à la contre-offre : l'habituelle, payée au nouveau délai.
  const face = comparerAvecLHabituelle(f, a.o.code, {}, { delaiDePaiement: nouveauDelai });
  const aRattraper = auCentime(-face.ecartDeTresorerie);
  const delaiExact = (aRattraper * JOURS_DU_TRIMESTRE) / k.achatsT4Asia;
  const delaiQuiRattraperait = Math.ceil(delaiExact - 1e-9);
  const auDelaiMaximal = comparerAvecLHabituelle(f, a.o.code, { delaiDePaiement: DELAI_MAXIMAL_CONVENU.joursDeLaFacture }, { delaiDePaiement: nouveauDelai });
  // Ce que NOVA peut engager d'un seul coup : son compte courant, moins le matelas qu'elle garde.
  const absorption = CAPACITES_DU_COURS[f.code]!.absorption;
  const capacite = auCentime(absorption.compteCourant - absorption.matelas);
  const auDelaDeLaCapacite = auCentime(face.besoinEnPlus - capacite);
  const verdict: Verdict =
    face.ecartDeResultat <= 0 ? "le-delai" : face.ecartDeTresorerie >= 0 ? "le-prix" : face.resultatApresFinancement > 0 && face.besoinEnPlus <= capacite ? "le-prix" : "le-delai";
  return {
    k,
    f,
    a,
    allonge,
    nouveauDelai,
    face,
    aRattraper,
    delaiExact: auCentime(delaiExact),
    delaiQuiRattraperait,
    auDelaiMaximal,
    absorption,
    capacite,
    auDelaDeLaCapacite,
    verdict,
  };
}

export const LE_FOURNISSEUR_ALLONGE_SON_DELAI: Situation = {
  code: "le-fournisseur-allonge-son-delai",
  parcours: "gpme",
  palier: 2,
  blocs: [],
  reprend: ["choisir-son-fournisseur"],
  commanditaire: "La dirigeante",
  titre: "Le fournisseur allonge son délai",
  accroche:
    "Pour garder son client, le fournisseur habituel ne baisse pas ses prix : il laisse 30 jours de plus pour payer. Ce que vaut la contre-offre face à l'offre la moins chère, en résultat et en trésorerie, et ce que l'entreprise peut porter.",
  objectifs: [
    "Calculer le crédit qu'un délai allongé laisse au bilan, hors taxes et toutes taxes comprises",
    "Croiser l'écart de résultat et l'écart de trésorerie de deux offres",
    "Financer un besoin de trésorerie et le confronter à ce que l'entreprise peut porter",
    "Répondre à la dirigeante, chiffres à l'appui",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_FOURNISSEURS,
    pourquoi: "ce cas reprend le chapitre « Choisir son fournisseur », qui se joue chez NOVA, dans la simulation du cours, sur ses offres de composants de l'année N + 1.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La contre-offre du fournisseur",
      texte: (c) => {
        const d = delaiAllonge(c);
        return [
          `« Nous avons dit à ${d.k.habituelle.nom} que nous pensions passer chez ${d.a.o.nom}. Il ne baisse pas ses prix, mais il nous laisse ${JOURS_DE_DELAI_EN_PLUS} jours de plus pour le payer : ${d.nouveauDelai} jours au lieu de ${d.k.habituelle.delaiDePaiement}. Dites-moi ce que chaque solution ferait au résultat de l'année et à la trésorerie du 31 décembre, et laquelle signer. Je vous rappelle qu'au 1er janvier, notre compte courant porte ${eur(d.absorption.compteCourant)}, que je garde ${eur(d.absorption.matelas)} de matelas, et que le placement de ${eur(d.absorption.reserve)} est la réserve de la gamme à venir : on n'y touche pas. »`,
          `Pas de cours cette fois : les calculs sont ceux du chapitre, à vous d'en trouver l'ordre. La simulation compare les offres hors taxes, sur l'année N + 1, et finance un besoin de trésorerie au découvert, à ${pct(d.f.banque.tauxDuDecouvert)} l'an.`,
        ];
      },
      tableau: (c) => {
        const d = delaiAllonge(c);
        const h = d.k.t4(d.k.habituelle.code);
        const asia = d.k.t4(d.a.o.code);
        return {
          titre: "Les deux solutions, et l'offre d'aujourd'hui",
          colonnes: [`${d.k.habituelle.nom} aujourd'hui`, `${d.k.habituelle.nom}, délai allongé`, d.a.o.nom],
          lignes: [
            { libelle: "Prix d'un jeu de composants (HT)", valeurs: [eur(d.k.habituelle.prixHT), eur(d.k.habituelle.prixHT), eur(d.a.o.prixHT)] },
            { libelle: "Délai de paiement (jours)", valeurs: [qte(d.k.habituelle.delaiDePaiement), qte(d.nouveauDelai), qte(d.a.o.delaiDePaiement)] },
            { libelle: "Stock gardé à la clôture (jours de consommation)", valeurs: [qte(d.k.habituelle.joursDeStock), qte(d.k.habituelle.joursDeStock), qte(d.a.o.joursDeStock)] },
            { libelle: "Achats du dernier trimestre (HT)", valeurs: [eur(h.achatsHT), eur(h.achatsHT), eur(asia.achatsHT)] },
            { libelle: "Achats de l'année (HT)", valeurs: [eur(d.allonge.avant.achatsHT), eur(d.allonge.apres.achatsHT), eur(d.a.x.offre.achatsHT)] },
            { libelle: "Écart de résultat face à l'offre d'aujourd'hui", valeurs: [eur(0), eur(d.allonge.apres.coutDesComposantsHT - d.allonge.avant.coutDesComposantsHT), eur(d.a.x.ecartDeResultat)] },
            { libelle: "Stock au 31 décembre (HT)", valeurs: [eur(0), eur(0), eur(d.a.x.offre.stockHT)] },
          ],
        };
      },
      repere: () =>
        "À rendre : le crédit que le délai allongé laisse au 31 décembre, ce que chaque solution fait au résultat et à la trésorerie, le besoin qu'il faudrait porter, et votre réponse. Un écart se compte face à la solution d'en face ; positif, il est favorable à l'entreprise.",
    },
    {
      id: "le-credit-en-plus",
      type: "montants",
      titre: "Ce que le délai allongé laisse en caisse",
      notions: ["payment_terms", "bfr"],
      question: (c) => {
        const d = delaiAllonge(c);
        return `Avec le délai allongé, combien ${d.k.habituelle.nom} fait-il de crédit en plus au 31 décembre, hors taxes puis tel que le bilan le porte (toutes taxes comprises), et combien de découvert ce crédit évite-t-il sur un an ?`;
      },
      champs: (c) => {
        const d = delaiAllonge(c);
        const h = d.k.t4(d.k.habituelle.code);
        return [
          {
            libelle: "Crédit fournisseur en plus (HT)",
            attendu: d.allonge.creditEnPlusHT,
            calcul: `${eur(h.achatsHT)} × ${JOURS_DE_DELAI_EN_PLUS} ÷ ${JOURS_DU_TRIMESTRE} = ${eur(d.allonge.creditEnPlusHT)}, soit ${eur(d.allonge.apres.dettesHT)} − ${eur(d.allonge.avant.dettesHT)}`,
          },
          {
            libelle: "Crédit fournisseur en plus au bilan (TTC)",
            attendu: d.allonge.creditEnPlusTTC,
            calcul: `${eur(h.achatsHT)} × ${qte(1 + d.f.tauxDeTva)} × ${JOURS_DE_DELAI_EN_PLUS} ÷ ${JOURS_DU_TRIMESTRE} = ${eur(d.allonge.creditEnPlusTTC)}`,
          },
          {
            libelle: "Découvert évité sur un an",
            attendu: d.allonge.coutEviteParAn,
            calcul: `${eur(d.allonge.avant.achatsHT)} × ${JOURS_DE_DELAI_EN_PLUS} ÷ 360 × ${pct(d.f.banque.tauxDuDecouvert)} = ${eur(d.allonge.coutEviteParAn)}`,
          },
        ];
      },
      explication: (c) => {
        const d = delaiAllonge(c);
        return [
          `Le fournisseur laisse ${eur(d.allonge.creditEnPlusHT)} hors taxes de plus en caisse au 31 décembre (${eur(d.allonge.creditEnPlusTTC)} au bilan, TVA comprise), sans rien changer à ses prix : le résultat ne bouge pas, sauf les ${eur(d.allonge.coutEviteParAn)} de découvert que ce crédit évite sur un an. ${d.nouveauDelai} jours, c'est le maximum que la loi permet : il ne peut pas aller plus loin.`,
        ];
      },
    },
    {
      id: "face-a-l-offre-la-moins-chere",
      type: "montants",
      titre: "Face à l'offre la moins chère",
      notions: ["income_statement", "net_treasury", "bfr"],
      question: (c) => {
        const d = delaiAllonge(c);
        return `Comparez ${d.a.o.nom} à la contre-offre, et non plus à l'offre d'aujourd'hui : l'écart de résultat, l'écart de trésorerie au 31 décembre, puis le besoin de financement ${queDe(d.a.o.nom)} créerait en plus. Négatif pour un écart défavorable à ${d.f.entreprise}.`;
      },
      champs: (c) => {
        const d = delaiAllonge(c);
        const x = d.face;
        return [
          { libelle: `Écart de résultat ${dE(d.a.o.nom)}`, attendu: x.ecartDeResultat, calcul: `${eur(x.economie)} d'économie − ${eur(x.ecartDeMargePerdue)} de marge perdue = ${eur(x.ecartDeResultat)} : le délai ne change pas le résultat de la contre-offre` },
          {
            libelle: `Écart de trésorerie ${dE(d.a.o.nom)}`,
            attendu: x.ecartDeTresorerie,
            calcul: `${eur(x.ecartDeResultat)} − ${eur(x.offre.stockHT)} de stock + ${eur(x.offre.dettesHT)} − ${eur(x.habituelle.dettesHT)} de dettes = ${eur(x.ecartDeTresorerie)}`,
          },
          { libelle: "Besoin de financement en plus", attendu: x.besoinEnPlus, calcul: `${eur(x.ecartDeStock)} de stock + ${eur(x.habituelle.dettesHT - x.offre.dettesHT)} de crédit perdu = ${eur(x.besoinEnPlus)}` },
        ];
      },
      explication: (c) => {
        const d = delaiAllonge(c);
        return [
          `Chacun son avantage : ${d.a.o.nom} gagne ${eur(d.face.ecartDeResultat)} de résultat, la contre-offre garde ${eur(-d.face.ecartDeTresorerie)} de plus en trésorerie. Le délai allongé a creusé l'écart de trésorerie de ${eur(d.allonge.creditEnPlusHT)}, sans toucher à l'écart de résultat.`,
        ];
      },
    },
    {
      id: "le-delai-qu-il-faudrait",
      type: "curseur",
      titre: "Le délai qu'il faudrait à l'offre la moins chère",
      notions: ["payment_terms", "net_treasury"],
      question: (c) => {
        const d = delaiAllonge(c);
        return `Et si ${d.a.o.nom} accordait lui aussi un délai ? Faites-le varier de ${DELAI_DU_CURSEUR.min} à ${DELAI_MAXIMAL_DU_CURSEUR} jours. Une droite donne le crédit qu'il ferait au 31 décembre (${eur(d.k.achatsT4Asia)} d'achats HT au dernier trimestre × délai ÷ ${JOURS_DU_TRIMESTRE}) ; l'autre, la trésorerie qu'il fait perdre comptant face à la contre-offre. Placez le curseur sur le plus petit délai où ce crédit la rattrape, puis validez.`;
      },
      grandeur: (c) => ({ libelle: `Délai de paiement ${dE(delaiAllonge(c).a.o.nom)}`, unite: "jours" }),
      cible: (c) => ({ attendu: delaiAllonge(c).delaiQuiRattraperait, min: DELAI_DU_CURSEUR.min, max: DELAI_MAXIMAL_DU_CURSEUR }),
      zones: ["L'offre la moins chère rattrape la contre-offre", "La contre-offre garde plus de trésorerie"],
      rates: () => ({
        dessous: "À ce délai, le crédit ne rattrape pas encore la trésorerie de la contre-offre.",
        dessus: "Plus court, le crédit rattrape encore la contre-offre : cherchez le plus petit délai.",
      }),
      montrer: "Montrer le délai",
      lecture: (c, j) => {
        const d = delaiAllonge(c);
        const x = comparerAvecLHabituelle(d.f, d.a.o.code, { delaiDePaiement: j }, { delaiDePaiement: d.nouveauDelai });
        return [
          { libelle: `Crédit ${dE(d.a.o.nom)} au 31 décembre (HT)`, montant: x.offre.dettesHT },
          { libelle: "Écart de trésorerie face à la contre-offre", montant: x.ecartDeTresorerie, fort: true },
          { libelle: "Écart de résultat face à la contre-offre", montant: x.ecartDeResultat },
        ];
      },
      droites: (c) => {
        const d = delaiAllonge(c);
        return {
          produit: (j) => (d.k.achatsT4Asia * j) / JOURS_DU_TRIMESTRE,
          cout: () => d.aRattraper,
          libelles: [`Crédit ${dE(d.a.o.nom)} au 31 décembre (HT)`, "Trésorerie perdue comptant, face à la contre-offre"],
        };
      },
      explication: (c) => {
        const d = delaiAllonge(c);
        return [
          `Il faudrait ${d.delaiQuiRattraperait} jours à ${d.a.o.nom} pour rattraper la contre-offre en trésorerie, et la loi n'en permet que ${DELAI_MAXIMAL_CONVENU.joursDeLaFacture}. Même à ce maximum, il resterait ${eur(-d.auDelaiMaximal.ecartDeTresorerie)} derrière : aucune négociation permise ne lui fait rattraper la contre-offre. Reste à savoir si ${d.f.entreprise} peut porter la différence.`,
        ];
      },
    },
    {
      id: "ce-que-nova-peut-porter",
      type: "montants",
      titre: "Ce que l'entreprise peut porter",
      notions: ["bfr", "net_treasury", "income_statement"],
      question: (c) => {
        const d = delaiAllonge(c);
        return `Financez au découvert le besoin ${queDe(d.a.o.nom)} créerait face à la contre-offre : son coût sur un an, l'écart de résultat qui reste une fois ce coût payé, puis la part du besoin qui dépasse ce que ${d.f.entreprise} peut engager d'un seul coup (son compte courant, matelas gardé). Négatif pour un écart défavorable à ${d.f.entreprise}.`;
      },
      champs: (c) => {
        const d = delaiAllonge(c);
        const x = d.face;
        return [
          { libelle: "Coût du besoin sur un an", attendu: x.coutDuBesoin, calcul: `${eur(x.besoinEnPlus)} × ${pct(d.f.banque.tauxDuDecouvert)} = ${eur(x.coutDuBesoin)}` },
          { libelle: "Écart de résultat après financement", attendu: x.resultatApresFinancement, calcul: `${eur(x.ecartDeResultat)} − ${eur(x.coutDuBesoin)} = ${eur(x.resultatApresFinancement)}` },
          {
            libelle: "Besoin au-delà de ce que l'entreprise peut engager",
            attendu: d.auDelaDeLaCapacite,
            calcul: `${eur(x.besoinEnPlus)} − (${eur(d.absorption.compteCourant)} − ${eur(d.absorption.matelas)}) = ${eur(x.besoinEnPlus)} − ${eur(d.capacite)} = ${eur(d.auDelaDeLaCapacite)}`,
          },
        ];
      },
      explication: (c) => {
        const d = delaiAllonge(c);
        const x = d.face;
        return [
          `Sur le papier, ${d.a.o.nom} reste devant de ${eur(x.resultatApresFinancement)}, découvert payé. Mais ce calcul suppose qu'on puisse financer ${eur(x.besoinEnPlus)} ; ${d.f.entreprise} ne peut en engager que ${eur(d.capacite)}, et il en manquerait ${eur(d.auDelaDeLaCapacite)}, à trouver sur la réserve ou auprès de la banque. Un résultat qui suppose un financement qu'on n'a pas n'est pas un résultat acquis.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la dirigeante",
      notions: ["payment_terms", "net_treasury"],
      question: () => "Quelle offre recommandez-vous de signer pour l'année ?",
      options: (c) => {
        const d = delaiAllonge(c);
        const x = d.face;
        const delai = d.verdict === "le-delai";
        return [
          {
            texte: "La contre-offre : le besoin de l'autre dépasse ce que l'entreprise peut porter",
            juste: delai,
            retour: delai
              ? `Oui. ${d.a.o.nom} gagne ${eur(x.ecartDeResultat)} de résultat, ${eur(x.resultatApresFinancement)} découvert payé ; mais il creuse la trésorerie de ${eur(-x.ecartDeTresorerie)} face à la contre-offre, et ${d.f.entreprise} ne peut en engager que ${eur(d.capacite)}. Aucun délai permis ne lui fait rattraper l'écart. Si la banque ouvrait un crédit pour ce besoin, la question se rouvrirait.`
              : `Non : ${d.f.entreprise} peut porter le besoin de ${eur(x.besoinEnPlus)}, et ${d.a.o.nom} reste devant de ${eur(x.resultatApresFinancement)}.`,
          },
          {
            texte: `L'offre la moins chère : ${eur(x.resultatApresFinancement)} de résultat en plus, même découvert payé`,
            juste: !delai,
            retour: !delai
              ? `Oui : ${d.f.entreprise} peut porter le besoin de ${eur(x.besoinEnPlus)}, et ${d.a.o.nom} reste devant de ${eur(x.resultatApresFinancement)}.`
              : `Non : le calcul est juste, mais il suppose un financement de ${eur(x.besoinEnPlus)} quand ${d.f.entreprise} ne peut en engager que ${eur(d.capacite)}.`,
          },
          {
            texte: `L'offre la moins chère : ${eur(x.ecartDeResultat)} de résultat en plus, et un délai ne change jamais le résultat`,
            juste: false,
            retour: `Non : c'est ne regarder que le résultat. Face à la contre-offre, ${d.a.o.nom} creuse la trésorerie du 31 décembre de ${eur(-x.ecartDeTresorerie)}.`,
          },
          {
            texte: `La contre-offre : ${eur(d.allonge.creditEnPlusTTC)} de crédit en plus valent mieux que le prix`,
            juste: false,
            retour: `Non : c'est comparer un crédit toutes taxes comprises, un stock d'argent, à un résultat, un flux de l'année. Le crédit en plus ne vaut en résultat que le découvert qu'il évite, ${eur(d.allonge.coutEviteParAn)} par an ; c'est la trésorerie qu'il faut porter qui tranche.`,
          },
        ];
      },
    },
  ],
};
