import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DU_STOCK, stockDeLaBoutique, tableauDuStock } from "../../chapitres/stock-du-point-de-vente";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE STOCK DU POINT DE VENTE » : ALLÉGER LE STOCK (BTS MCO, palier 3).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS, comme son chapitre : le stock de janvier de la boutique
 * MAILLE & CO, référence par référence (monde/maille-et-co.ts et monde/boutique.ts, lus par
 * `stockDeLaBoutique`). Il se jouait sur le trimestre de l'arène, chez MAILLE & CO et PIXEL & CO ; il
 * se joue maintenant sur le mois de janvier de la boutique seule.
 *
 * Le banquier trouve que trop d'argent dort en réserve, et demande un stock moyen plus léger d'un
 * cinquième, à ventes égales. L'élève refait seul les calculs du chapitre (stock moyen, coût des
 * vendues, rotation, durée), puis pour le stock visé ; puis il remonte À REBOURS au stock du 31 janvier
 * que cette réduction suppose, le stock du 1er janvier étant déjà là, et le CROISE avec les stocks de
 * sécurité de la boutique (7 jours de ventes par référence). Le curseur cherche la plus forte réduction
 * qui les respecte. La réponse demande un jugement : la trésorerie libérée est réelle, mais une
 * réduction de 20 % en un mois ferait passer le stock sous la sécurité ; elle se gagne en plusieurs
 * mois, par des commandes plus petites.
 *
 * Les pièges : croire qu'un stock 20 % plus léger fait tourner le stock 20 % plus vite (il le fait
 * tourner 25 % plus vite), et croire que le fournisseur, qui finance le stock, rend toute baisse sans
 * risque.
 */

/**
 * La réduction du stock moyen demandée par le banquier : un cinquième. C'est l'ordre de grandeur d'un
 * plan de réduction des stocks qu'un commerce tient en un an sans manquer de ventes.
 */
export const REDUCTION_DU_STOCK_MOYEN = 0.2;

/** Les bornes du curseur de la réduction, en pour cent du stock moyen. */
export const REDUCTION_DU_CURSEUR = { min: 0, max: 40 } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const deux = (x: number) => x.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

/** Les chiffres de la réponse, calculés une fois sur la boutique du cours. */
export function allegerLeStock(c: Pick<Cas, "code">) {
  const x = stockDeLaBoutique(c);
  const s = x.s;
  const stockVise = auCentime(s.stockMoyen * (1 - REDUCTION_DU_STOCK_MOYEN));
  const rotationVisee = auCentime(s.coutDAchatDesVendues / stockVise);
  // Le stock du 1er janvier est là : seul le stock du 31 janvier peut porter la baisse du stock moyen.
  const stockFinalPour = (reduction: number) => auCentime(2 * s.stockMoyen * (1 - reduction) - s.valeurInitiale);
  const securite = auCentime(s.references.reduce((t, r) => t + r.stockDeSecurite * x.coutDe(r.code), 0));
  const stockFinalVise = stockFinalPour(REDUCTION_DU_STOCK_MOYEN);
  // La plus forte réduction, au pour cent, qui garde le stock du 31 janvier au-dessus des stocks de sécurité.
  const reductionPossible = Math.floor((1 - (securite + s.valeurInitiale) / (2 * s.stockMoyen)) * 100 + 1e-9);
  return {
    ...x,
    stockVise,
    tresorerieLiberee: auCentime(s.stockMoyen - stockVise),
    rotationVisee,
    dureeVisee: Math.round(x.f.joursDuMois / rotationVisee),
    stockFinalPour,
    stockFinalVise,
    securite,
    ecartALaSecurite: auCentime(stockFinalVise - securite),
    reductionPossible,
    tresorerieAuPossible: auCentime((s.stockMoyen * reductionPossible) / 100),
    // Les erreurs classiques : la rotation qui monterait de 20 %, comme le stock baisse, ou qui baisserait avec lui.
    rotationPlusVingt: auCentime(x.rotation * (1 + REDUCTION_DU_STOCK_MOYEN)),
    rotationMoinsVingt: auCentime(x.rotation * (1 - REDUCTION_DU_STOCK_MOYEN)),
  };
}

export const ALLEGER_LE_STOCK: Situation = {
  code: "alleger-le-stock",
  parcours: "mco",
  palier: 3,
  blocs: [],
  reprend: ["stock-du-point-de-vente"],
  commanditaire: "Le banquier",
  titre: "Alléger le stock",
  accroche:
    "Le banquier trouve que trop d'argent dort en réserve. Il veut savoir ce que libérerait un stock plus léger, et la boutique, si elle peut l'alléger sans risquer la rupture.",
  objectifs: [
    "Calculer le stock moyen, le coût d'achat des marchandises vendues et la rotation",
    "Calculer la trésorerie libérée par un stock moyen plus léger, et la nouvelle rotation",
    "Retrouver à rebours le stock final qu'une réduction suppose, et le croiser avec les stocks de sécurité",
    "Répondre au banquier avec la réduction que la boutique peut tenir",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DU_STOCK,
    pourquoi:
      "ce cas se joue dans la boutique du cours, MAILLE & CO, dont la simulation suit le stock référence par référence : le même point de vente que son chapitre.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du banquier",
      tableau: tableauDuStock,
      texte: (c) => {
        const r = allegerLeStock(c);
        return [
          `« Votre stock immobilise beaucoup d'argent. Si ${r.f.entreprise} réduisait son stock moyen de ${pct(REDUCTION_DU_STOCK_MOYEN * 100)} en vendant autant, combien de trésorerie libéreriez-vous ? Combien de temps un article resterait-il alors en réserve ? »`,
          `Le manager répond qu'il garde, pour chaque référence, un stock de sécurité de ${qte(r.f.delaiDeSecurite)} jours de ventes. Le stock du 1er janvier est déjà en réserve : la réduction se jouerait sur le stock du 31 janvier.`,
          `Pas de cours cette fois : vous avez le stock de ${r.f.moisDeReference}, valorisé au coût d'achat du façonnier, sur un mois de ${qte(r.f.joursDuMois)} jours aux ventes régulières. La méthode est celle du chapitre ; à vous de l'enchaîner.`,
        ];
      },
      repere: () =>
        "À rendre : la rotation et la durée de stockage d'aujourd'hui, la trésorerie libérée, la rotation et la durée avec le stock visé, le stock du 31 janvier que la réduction suppose face aux stocks de sécurité, et votre réponse.",
    },
    {
      id: "aujourd-hui",
      type: "montants",
      titre: "Le stock aujourd'hui",
      notions: ["stock", "stock_rotation"],
      question: () =>
        "Calculez le stock moyen de janvier, le coût d'achat des marchandises vendues, la rotation du stock (au centième), puis la durée moyenne de stockage (au jour).",
      champs: (c) => {
        const r = allegerLeStock(c);
        const s = r.s;
        return [
          { libelle: "Stock moyen", attendu: s.stockMoyen, calcul: `(${eur(s.valeurInitiale)} + ${eur(s.valeurFinale)}) ÷ 2 = ${eur(s.stockMoyen)}` },
          { libelle: "Coût d'achat des marchandises vendues", attendu: s.coutDAchatDesVendues, calcul: `${eur(s.valeurInitiale)} + ${eur(s.achats)} − ${eur(s.valeurFinale)} = ${eur(s.coutDAchatDesVendues)}` },
          { libelle: "Rotation du stock", attendu: r.rotation, tolerance: 0.01, calcul: `${eur(s.coutDAchatDesVendues)} ÷ ${eur(s.stockMoyen)} = ${deux(r.rotation)}` },
          { libelle: "Durée moyenne de stockage (jours)", attendu: r.duree, tolerance: 1, calcul: `${qte(r.f.joursDuMois)} ÷ ${deux(r.rotation)} = ${qte(r.duree)}` },
        ];
      },
      explication: (c) => {
        const r = allegerLeStock(c);
        return [`Aujourd'hui, ${eur(r.s.stockMoyen)} dorment en moyenne en réserve, et un article y reste ${qte(r.duree)} jours avant d'être vendu par ${r.f.entreprise}.`];
      },
    },
    {
      id: "le-stock-vise",
      type: "montants",
      titre: "Le stock visé",
      notions: ["stock_rotation", "bfr"],
      question: () =>
        `Avec un stock moyen réduit de ${pct(REDUCTION_DU_STOCK_MOYEN * 100)} et les mêmes ventes, calculez le stock moyen visé, la trésorerie libérée, la nouvelle rotation (au centième) et la nouvelle durée de stockage (au jour).`,
      champs: (c) => {
        const r = allegerLeStock(c);
        return [
          { libelle: "Stock moyen visé", attendu: r.stockVise, calcul: `${eur(r.s.stockMoyen)} × (1 − ${pct(REDUCTION_DU_STOCK_MOYEN * 100)}) = ${eur(r.stockVise)}` },
          { libelle: "Trésorerie libérée", attendu: r.tresorerieLiberee, calcul: `${eur(r.s.stockMoyen)} − ${eur(r.stockVise)} = ${eur(r.tresorerieLiberee)}` },
          { libelle: "Nouvelle rotation", attendu: r.rotationVisee, tolerance: 0.01, calcul: `${eur(r.s.coutDAchatDesVendues)} ÷ ${eur(r.stockVise)} = ${deux(r.rotationVisee)}` },
          { libelle: "Nouvelle durée de stockage (jours)", attendu: r.dureeVisee, tolerance: 1, calcul: `${qte(r.f.joursDuMois)} ÷ ${deux(r.rotationVisee)} = ${qte(r.dureeVisee)}` },
        ];
      },
      explication: (c) => {
        const r = allegerLeStock(c);
        return [
          `Le coût des marchandises vendues ne bouge pas : seul le stock qui le porte maigrit. La rotation passe de ${deux(r.rotation)} à ${deux(r.rotationVisee)}, ${pct(Math.round((1 / (1 - REDUCTION_DU_STOCK_MOYEN) - 1) * 100))} de plus et non ${pct(REDUCTION_DU_STOCK_MOYEN * 100)}, puisqu'elle est multipliée par 1 ÷ ${qte(1 - REDUCTION_DU_STOCK_MOYEN)}. ${eur(r.tresorerieLiberee)} reviendraient dans la caisse.`,
        ];
      },
    },
    {
      id: "la-securite",
      type: "montants",
      titre: "Le stock du 31 janvier face à la sécurité",
      notions: ["stock", "stock_rotation"],
      question: (c) =>
        `Le stock du 1er janvier ne change pas. Quel stock du 31 janvier, en valeur, ferait tomber le stock moyen au niveau visé ? Que valent, au coût d'achat, les stocks de sécurité des ${qte(allegerLeStock(c).f.gamme.length)} références ? Puis la différence entre les deux (négative si le stock visé passe sous la sécurité).`,
      champs: (c) => {
        const r = allegerLeStock(c);
        return [
          { libelle: "Stock du 31 janvier visé", attendu: r.stockFinalVise, calcul: `2 × ${eur(r.stockVise)} − ${eur(r.s.valeurInitiale)} = ${eur(r.stockFinalVise)}` },
          {
            libelle: "Stocks de sécurité, au coût d'achat",
            attendu: r.securite,
            calcul: `${r.s.references.map((x) => `${qte(x.ventesParJour)} × ${qte(r.f.delaiDeSecurite)} × ${eur(r.coutDe(x.code))}`).join(" + ")} = ${eur(r.securite)}`,
          },
          { libelle: "Stock visé moins stocks de sécurité", attendu: r.ecartALaSecurite, calcul: `${eur(r.stockFinalVise)} − ${eur(r.securite)} = ${eur(r.ecartALaSecurite)}` },
        ];
      },
      explication: (c) => {
        const r = allegerLeStock(c);
        return [
          r.ecartALaSecurite < 0
            ? `Pour tenir la réduction ce mois-ci, la boutique devrait finir janvier avec ${eur(r.stockFinalVise)} de stock, ${eur(-r.ecartALaSecurite)} de moins que ses stocks de sécurité : au premier retard du façonnier, le rayon se viderait.`
            : `Le stock visé reste au-dessus des stocks de sécurité, de ${eur(r.ecartALaSecurite)} : la réduction ne fait pas courir de rupture.`,
        ];
      },
    },
    {
      id: "la-reduction-au-curseur",
      type: "curseur",
      titre: "La réduction que la boutique peut tenir",
      notions: ["stock", "bfr"],
      question: () =>
        "Faites varier la réduction du stock moyen demandée, en pour cent. Une droite donne le stock du 31 janvier qu'elle suppose, l'autre les stocks de sécurité. Placez le curseur sur la plus forte réduction, au pour cent, qui garde le stock au-dessus de la sécurité.",
      grandeur: () => ({ libelle: "Réduction du stock moyen", unite: "%" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: allegerLeStock(c).reductionPossible, min: REDUCTION_DU_CURSEUR.min, max: REDUCTION_DU_CURSEUR.max }),
      zones: ["Au-dessus de la sécurité", "Sous la sécurité"],
      rates: () => ({
        dessous: "La réserve tient encore à une réduction plus forte : cherchez la plus forte.",
        dessus: "À cette réduction, le stock du 31 janvier passe sous les stocks de sécurité.",
      }),
      montrer: "Montrer la réduction possible",
      lecture: (c, p) => {
        const r = allegerLeStock(c);
        return [
          { libelle: "Stock moyen visé", montant: auCentime(r.s.stockMoyen * (1 - p / 100)) },
          { libelle: "Trésorerie libérée", montant: auCentime((r.s.stockMoyen * p) / 100) },
          { libelle: "Stock du 31 janvier visé", montant: r.stockFinalPour(p / 100) },
          { libelle: "Stocks de sécurité", montant: r.securite, fort: true },
        ];
      },
      droites: (c) => {
        const r = allegerLeStock(c);
        return { produit: (p) => 2 * r.s.stockMoyen * (1 - p / 100) - r.s.valeurInitiale, cout: () => r.securite, libelles: ["Stock du 31 janvier visé", "Stocks de sécurité"] };
      },
      explication: (c) => {
        const r = allegerLeStock(c);
        return [
          `Ce mois-ci, la boutique peut réduire son stock moyen de ${pct(r.reductionPossible)} au plus, soit ${eur(r.tresorerieAuPossible)} libérés : au-delà, le stock du 31 janvier passerait sous ses ${eur(r.securite)} de stocks de sécurité. Le reste de la réduction se gagne sur les mois suivants, en commandant plus petit et plus souvent.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au banquier",
      question: () => "Quelle phrase envoyez-vous au banquier ?",
      options: (c) => {
        const r = allegerLeStock(c);
        return [
          {
            texte: `Pas en un mois : au-delà de ${pct(r.reductionPossible)}, le stock passerait sous la sécurité`,
            juste: true,
            retour: `Oui : ${pct(REDUCTION_DU_STOCK_MOYEN * 100)} libéreraient ${eur(r.tresorerieLiberee)} et porteraient la rotation à ${deux(r.rotationVisee)}, mais le stock du 31 janvier tomberait à ${eur(r.stockFinalVise)}, sous ${eur(r.securite)} de stocks de sécurité. ${pct(r.reductionPossible)} tout de suite (${eur(r.tresorerieAuPossible)}), le reste par des commandes plus petites.`,
          },
          {
            texte: `Oui : ${eur(r.tresorerieLiberee)} libérés, et le façonnier, à ${qte(r.faconnier.delaiDePaiement)} jours, financerait toujours le stock`,
            juste: false,
            retour: `Le calcul est juste, pas la réponse : le stock du 31 janvier tomberait à ${eur(r.stockFinalVise)}, sous les ${eur(r.securite)} de stocks de sécurité. Le crédit du façonnier ne protège pas de la rupture.`,
          },
          {
            texte: `La rotation monterait de ${pct(REDUCTION_DU_STOCK_MOYEN * 100)}, à ${deux(r.rotationPlusVingt)} : le banquier sera satisfait`,
            juste: false,
            retour: `Non : la rotation divise les ventes par le stock moyen. Un stock ${pct(REDUCTION_DU_STOCK_MOYEN * 100)} plus petit la multiplie par 1 ÷ ${qte(1 - REDUCTION_DU_STOCK_MOYEN)} : ${deux(r.rotationVisee)}, pas ${deux(r.rotationPlusVingt)}. Et la sécurité n'y serait plus.`,
          },
          {
            texte: `Non : avec moins de stock, la rotation tomberait à ${deux(r.rotationMoinsVingt)}`,
            juste: false,
            retour: `Non : à ventes égales, un stock plus petit tourne plus vite. La rotation monterait à ${deux(r.rotationVisee)}, et chaque article resterait ${qte(r.dureeVisee)} jours en réserve au lieu de ${qte(r.duree)}.`,
          },
        ];
      },
    },
  ],
};
