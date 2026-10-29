import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import {
  AUGMENTATIONS_ESSAYEES,
  ENTREPRISES_DES_RESSOURCES_HUMAINES,
  POURQUOI_LES_RESSOURCES_HUMAINES,
  PRIMES_ESSAYEES,
  remunerationAuMoindreCout,
  remunerationDeNPlus1,
  TAUX_PATRONAL,
} from "../monde/ressources-humaines-de-nova";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : RÉMUNÉRATION ET MOTIVATION (Bac STMG, ressources humaines, palier 1).
 *
 * Ne rien changer aux salaires fait une économie certaine, tout de suite. Ce qu'elle coûte vient
 * ensuite : quand le marché paie mieux, un salarié payé trop en dessous trouve mieux ailleurs et
 * part, et son départ coûte bien plus que l'augmentation qui l'aurait retenu. Le chapitre situe le
 * salaire de NOVA face au marché, chiffre l'augmentation qui garde l'équipe et le départ qu'elle
 * évite, cherche la plus forte augmentation qui coûte encore moins qu'un départ (le curseur), puis
 * fait choisir entre une augmentation et une prime de fin d'année (le laboratoire).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA seule, sur l'année N + 1 : le salaire des
 * opérateurs, celui du marché (1 950 € en N, 2 000 € en N + 1), le seuil de démission (95 % du
 * marché) et le coût du départ d'un opérateur (la marge perdue, le recrutement, moins les salaires
 * non versés) sont ceux de nova-capacite.ts et capacite.ts, le modèle du chapitre « Le départ d'un
 * salarié » du BTS GPME (monde/ressources-humaines-de-nova.ts). Que la prime ne retienne pas est une
 * hypothèse du cours, nommée là-bas.
 *
 * CE QUI A CHANGÉ. Le chapitre rejouait l'année de l'arène avec des salaires baissés de 10 %, dont le
 * moteur tirait la motivation et les démissions ; il suit maintenant les opérateurs de NOVA : 25 €
 * par mois les gardent, pour 1 704 € par an, quand un départ coûterait 24 975 €.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
/** Les mois d'une année. */
const MOIS = 12;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Le salaire de N + 1 face au marché, et ce que coûtent l'augmentation et le départ (le cas de la hausse demandée le reprend). */
export function remuneration(_c?: Cas, augmentation = 0, prime = 0) {
  const r = remunerationDeNPlus1(augmentation, prime);
  return { ...r, partEnNPct: auDixieme(r.partEnN * 100), partPct: auDixieme(r.part * 100), seuilPct: Math.round(r.seuil * 100) };
}

export const REMUNERATION_ET_MOTIVATION: Chapitre = {
  code: "remuneration-et-motivation",
  parcours: "stmg-rh",
  palier: 1,
  blocs: [
    "STMG Thème 1 · De l'individu à l'acteur",
    "STMG Thème 2 · Des facteurs de motivation et de satisfaction : qualité de vie au travail et rémunération",
  ],
  titre: "Rémunération et motivation",
  accroche:
    "Ne rien changer aux salaires fait une économie certaine et immédiate. Ce qu'elle coûte vient ensuite : quand le marché paie mieux, un salarié part, et son départ coûte bien plus que l'augmentation qui l'aurait retenu.",
  objectifs: [
    "Situer un salaire face à celui du marché",
    "Calculer le coût d'une augmentation sur l'année",
    "Comparer ce coût à celui d'un départ",
    "Distinguer ce qui retient un salarié de ce qui le remercie",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DES_RESSOURCES_HUMAINES, pourquoi: POURQUOI_LES_RESSOURCES_HUMAINES },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce qui retient un salarié",
      notions: ["pay_and_motivation"],
      texte: (c) => {
        const r = remuneration(c);
        return [
          `La rémunération d'un salarié a plusieurs parts : un salaire de base, fixe, versé chaque mois ; des parts variables, comme une prime ; des avantages (une mutuelle, des titres-restaurant). ${c.entreprise} paie ses ${r.operateurs} opérateurs ${eur(r.salaire)} bruts par mois, sans prime.`,
          `Un salarié compare ce qu'il gagne à ce que d'autres employeurs offrent pour le même travail : le salaire du marché, ${eur(r.marcheN)} bruts en N pour un opérateur de montage, ${eur(r.marcheNPlus1)} en N + 1. Le cours suppose qu'un opérateur payé sous ${pct(r.seuilPct)} du marché trouve mieux ailleurs et part.`,
          "Le salaire n'est pas le seul ressort de la motivation : la reconnaissance, l'intérêt du travail, les conditions de travail et la formation comptent aussi. Mais un salaire trop bas fait partir, quoi qu'on offre d'autre.",
        ];
      },
      tableau: (c) => {
        const r = remuneration(c);
        return {
          titre: `Les opérateurs ${dE(c.entreprise)} et le marché`,
          colonnes: ["N", "N + 1"],
          lignes: [
            { libelle: "Salaire brut d'un opérateur, par mois", valeurs: [eur(r.salaire), eur(r.salaire)] },
            { libelle: "Salaire du marché, par mois", valeurs: [eur(r.marcheN), eur(r.marcheNPlus1)] },
            { libelle: "Seuil de démission (part du marché)", valeurs: [pct(r.seuilPct), pct(r.seuilPct)] },
          ],
        };
      },
      repere: () => "Part du marché = salaire ÷ salaire du marché × 100. Sous le seuil de démission, le salarié part.",
    },
    {
      id: "le-marche",
      objectifs: [0],
      type: "montants",
      titre: "Le salaire face au marché",
      notions: ["pay_and_motivation"],
      question: () => "Calculez la part du marché que paie l'entreprise en N, puis en N + 1 (salaire ÷ salaire du marché × 100, au dixième), et le plus petit salaire, à l'euro, qui atteint le seuil de démission en N + 1.",
      champs: (c) => {
        const r = remuneration(c);
        return [
          { libelle: "Part du marché en N (%)", attendu: r.partEnNPct, calcul: `${eur(r.salaire)} ÷ ${eur(r.marcheN)} × 100 = ${pct(r.partEnNPct)}`, tolerance: 0.1 },
          { libelle: "Part du marché en N + 1 (%)", attendu: r.partPct, calcul: `${eur(r.salaire)} ÷ ${eur(r.marcheNPlus1)} × 100 = ${pct(r.partPct)}`, tolerance: 0.1 },
          { libelle: "Salaire au seuil en N + 1", attendu: r.salaireAuSeuil, calcul: `${eur(r.marcheNPlus1)} × ${pct(r.seuilPct)} = ${eur(r.salaireAuSeuil)}`, tolerance: 0 },
        ];
      },
      explication: (c) => {
        const r = remuneration(c);
        return [
          `En N, ${c.entreprise} payait ${pct(r.partEnNPct)} du marché, au-dessus du seuil. Sans rien changer, elle en paiera ${pct(r.partPct)} en N + 1 : le marché a monté, pas son salaire. Il faut ${eur(r.augmentationAuSeuil)} de plus par mois pour revenir au seuil.`,
        ];
      },
    },
    {
      id: "sans-rien-changer",
      objectifs: [0, 3],
      type: "choix",
      titre: "Si rien ne change",
      notions: ["pay_and_motivation"],
      question: (c) => `${c.entreprise} garde ses salaires en N + 1. Que risque-t-elle ?`,
      options: (c) => {
        const r = remuneration(c);
        return [
          {
            texte: "Le départ d'un opérateur, payé sous le seuil",
            juste: !r.garde,
            retour: !r.garde
              ? `Oui : à ${pct(r.partPct)} du marché, sous le seuil de ${pct(r.seuilPct)}, un opérateur trouvera mieux ailleurs. Le salaire n'a pas baissé, mais il a perdu du terrain sur celui des autres employeurs.`
              : `Non : à ${pct(r.partPct)} du marché, l'équipe est au-dessus du seuil.`,
          },
          {
            texte: "Rien : le salaire n'a pas baissé, l'équipe n'a pas de raison de partir",
            juste: r.garde,
            retour: r.garde
              ? `Oui : à ${pct(r.partPct)} du marché, l'équipe reste au-dessus du seuil.`
              : `Non : un salaire se compare à ceux du marché. À ${pct(r.partPct)} du marché, sous le seuil de ${pct(r.seuilPct)}, un opérateur partira.`,
          },
          {
            texte: "Une baisse de productivité, mais aucun départ tant que le salaire dépasse le SMIC",
            juste: false,
            retour: `Non : le SMIC est un minimum légal, pas ce qui retient un salarié. Ce qui compte pour lui, c'est ce que paient les autres employeurs : ${eur(r.marcheNPlus1)} en N + 1.`,
          },
        ];
      },
    },
    {
      id: "le-cout-de-chaque-choix",
      objectifs: [1, 2],
      type: "montants",
      titre: "L'augmentation ou le départ",
      notions: ["pay_and_motivation", "payroll"],
      tableau: (c) => {
        const r = remuneration(c);
        return {
          titre: `Le départ d'un opérateur ${dE(c.entreprise)} en N + 1`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Marge des enceintes que le poste vide fait perdre", valeurs: [eur(r.depart.margePerdue)] },
            { libelle: "Coût du recrutement du remplaçant", valeurs: [eur(r.depart.recrutement)] },
            { libelle: "Salaires et cotisations non versés pendant la vacance", valeurs: [eur(r.depart.salairesNonVerses)] },
          ],
        };
      },
      question: (c) => {
        const r = remuneration(c);
        return `Calculez ce que coûterait l'augmentation de ${eur(r.augmentationAuSeuil)} par mois pour les ${r.operateurs} opérateurs sur l'année, cotisations patronales comprises (${pct(TAUX_PATRONAL * 100)} du brut), puis le coût du départ (marge perdue plus recrutement, moins salaires non versés).`;
      },
      champs: (c) => {
        const r = remuneration(c, r0().augmentationAuSeuil);
        return [
          { libelle: "Coût de l'augmentation sur l'année", attendu: r.coutDeLAugmentation, calcul: `${eur(r.augmentation)} × ${MOIS} × ${r.operateurs} × ${(1 + TAUX_PATRONAL).toLocaleString("fr-FR")} = ${eur(r.coutDeLAugmentation)}`, tolerance: 1 },
          { libelle: "Coût du départ", attendu: r.coutDuDepart, calcul: `${eur(r.depart.margePerdue)} + ${eur(r.depart.recrutement)} − ${eur(r.depart.salairesNonVerses)} = ${eur(r.coutDuDepart)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const r = remuneration(c, r0().augmentationAuSeuil);
        return [
          `Garder l'équipe coûte ${eur(r.coutDeLAugmentation)} sur l'année ; la laisser partir en coûterait ${eur(r.coutDuDepart)}. L'économie de ne rien changer est certaine et immédiate, mais le départ qu'elle provoque coûte bien plus.`,
        ];
      },
    },
    {
      id: "jusqu-ou-augmenter",
      objectifs: [2],
      type: "curseur",
      titre: "Jusqu'où augmenter",
      notions: ["pay_and_motivation"],
      sens: "plus-grande",
      question: (c) => {
        const r = remuneration(c);
        return `Et si ${c.entreprise} augmentait davantage ? Faites varier l'augmentation mensuelle de chaque opérateur : une droite donne le coût d'un départ, l'autre ce que coûterait l'augmentation pour les ${r.operateurs} opérateurs sur l'année. Placez le curseur sur la plus forte augmentation, à l'euro, qui coûte encore moins qu'un départ.`;
      },
      grandeur: () => ({ libelle: "Augmentation par opérateur et par mois", unite: "€" }),
      cible: () => ({ attendu: r0().augmentationMaximale, max: 600 }),
      zones: ["L'augmentation coûte moins qu'un départ", "L'augmentation coûte plus qu'un départ"],
      rates: () => ({ dessous: "Cette augmentation coûte moins qu'un départ, une plus forte aussi : cherchez la plus forte.", dessus: "Cette augmentation coûterait plus qu'un départ." }),
      montrer: "Montrer l'augmentation",
      lecture: (_c, a) => [
        { libelle: "Coût de l'augmentation sur l'année", montant: remunerationDeNPlus1(a).coutDeLAugmentation, fort: true },
        { libelle: "Coût d'un départ", montant: r0().coutDuDepart },
      ],
      droites: () => ({ produit: () => r0().coutDuDepart, cout: (a) => remunerationDeNPlus1(a).coutDeLAugmentation, libelles: ["Coût d'un départ", "Coût de l'augmentation"] }),
      explication: (c) => {
        const r = remuneration(c);
        const a = r.augmentationMaximale;
        return [
          `Jusqu'à ${eur(a)} par mois et par opérateur, soit ${eur(remunerationDeNPlus1(a).coutDeLAugmentation)} sur l'année, l'augmentation coûte moins qu'un départ ; à ${eur(a + 1)}, elle coûterait ${eur(remunerationDeNPlus1(a + 1).coutDeLAugmentation)}.`,
          `L'augmentation au seuil, ${eur(r.augmentationAuSeuil)}, est donc loin de cette limite : retenir l'équipe est ici bien moins cher que la remplacer.`,
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-remuneration",
      objectifs: [3],
      type: "simulation",
      titre: "Augmenter ou verser une prime",
      notions: ["pay_and_motivation"],
      question: (c) =>
        `La gérante ${dE(c.entreprise)} hésite : une augmentation de chaque mois, ou une prime de fin d'année, versée une fois ? Une prime ne change pas le salaire que l'opérateur compare chaque mois aux offres du marché. Choisissez l'augmentation et la prime, et regardez ce que l'année coûte, départ compris si l'équipe n'est pas gardée.`,
      leviers: () => [
        { code: "augmentation", libelle: "Augmentation par opérateur et par mois", unite: "€", ...AUGMENTATIONS_ESSAYEES, depart: AUGMENTATIONS_ESSAYEES.min },
        {
          code: "prime",
          libelle: "Prime de fin d'année par opérateur",
          unite: "€",
          min: Math.min(...PRIMES_ESSAYEES),
          max: Math.max(...PRIMES_ESSAYEES),
          pas: 1,
          depart: PRIMES_ESSAYEES[2],
          choix: PRIMES_ESSAYEES.map((p) => ({ valeur: p, libelle: p === 0 ? "Sans prime" : eur(p) })),
        },
      ],
      lecture: (_c, p) => {
        const r = remunerationDeNPlus1(p.augmentation!, p.prime!);
        return [
          { libelle: "Part du marché payée chaque mois", montant: auDixieme(r.part * 100), unite: "%" },
          { libelle: "Opérateur qui part", montant: r.garde ? 0 : 1, unite: "opérateur" },
          { libelle: "Coût de l'augmentation et de la prime", montant: r.cout },
          { libelle: "Coût de l'année, départ compris", montant: r.coutDeLAnnee, fort: true },
        ];
      },
      defi: () => {
        const juste = remunerationAuMoindreCout();
        return {
          consigne: "Gardez toute l'équipe au moindre coût sur l'année.",
          atteint: (p) => p.augmentation === juste.augmentation && p.prime === juste.prime,
          indice: (p) => {
            const r = remunerationDeNPlus1(p.augmentation!, p.prime!);
            return !r.garde
              ? `À ${pct(auDixieme(r.part * 100))} du marché chaque mois, un opérateur part${p.prime! > 0 ? ", prime ou pas" : ""} : l'année coûte ${eur(r.coutDeLAnnee)}.`
              : `L'équipe est gardée, pour ${eur(r.coutDeLAnnee)} : pouvez-vous la garder pour moins cher ?`;
          },
          solution: { augmentation: juste.augmentation, prime: juste.prime },
        };
      },
      explication: (c, p) => {
        const r = remunerationDeNPlus1(p.augmentation!, p.prime!);
        const prime = remunerationDeNPlus1(0, Math.max(...PRIMES_ESSAYEES));
        return [
          `Défi relevé : ${eur(p.augmentation!)} de plus chaque mois, sans prime, gardent l'équipe pour ${eur(r.coutDeLAnnee)} sur l'année. Une prime de ${eur(Math.max(...PRIMES_ESSAYEES))} sans augmentation coûterait ${eur(prime.cout)}, et l'opérateur partirait quand même : l'année coûterait ${eur(prime.coutDeLAnnee)}.`,
          `Le salaire de base retient ; une prime remercie. ${c.entreprise} peut verser les deux, mais elle ne retient pas un salarié avec ce qu'il ne touche qu'une fois par an.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["pay_and_motivation"],
      texte: (c) => {
        const r = remuneration(c, r0().augmentationAuSeuil);
        return [
          `Chez ${c.entreprise}, ${eur(r.augmentation)} de plus par mois et par opérateur, ${eur(r.coutDeLAugmentation)} sur l'année, gardent l'équipe au niveau du marché ; un départ coûterait ${eur(r.coutDuDepart)}.`,
          "Une politique de rémunération se juge sur toute l'année, et face au marché : l'économie d'un salaire qui ne bouge pas se voit tout de suite, le départ qu'il provoque se paie ensuite, en ventes perdues et en recrutement.",
        ];
      },
      repere: () => "Coût d'une augmentation sur l'année = augmentation × 12 × effectif × (1 + taux patronal).",
    },
  ],
};

/** Le salaire de N + 1 sans rien changer. */
function r0() {
  return remunerationDeNPlus1();
}
