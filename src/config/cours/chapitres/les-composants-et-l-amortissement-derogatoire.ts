import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { DUREE_SANS_COMPOSANTS, SECONDE_LIGNE, composantsDeLaSecondeLigne, derogatoireDeLaStructure } from "../monde/comptabilite-approfondie";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : L'APPROCHE PAR COMPOSANTS ET L'AMORTISSEMENT DÉROGATOIRE
 * (DCG UE10 · Comptabilité approfondie, palier 4 ; BUT GEA).
 *
 * En janvier N + 1, NOVA met en service sa seconde ligne de montage. Ses moteurs ne durent pas
 * autant que son bâti : l'élève décompose la ligne, amortit chaque composant sur sa propre durée,
 * puis sépare le plan comptable (linéaire, l'usure) du plan fiscal (dégressif, la déduction) et
 * passe l'écart en amortissement dérogatoire, une provision réglementée. Le curseur cherche
 * l'année où l'écart commence à se reprendre ; le laboratoire montre qu'un composant qui dure
 * autant que la structure ne change rien.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA seule (monde/comptabilite-approfondie.ts) :
 * la seconde ligne coûte 60 000 € comme la première (exercice-de-nova.ts, nova-gestion.ts).
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const ans = (n: number) => `${n} an${n > 1 ? "s" : ""}`;
const pct = (t: number) => `${(Math.round(t * 10_000) / 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;

/** Les durées du composant que le laboratoire propose, en années. */
export const DUREES_DU_COMPOSANT = { min: 2, max: 6, pas: 1 } as const;

export const LES_COMPOSANTS_ET_L_AMORTISSEMENT_DEROGATOIRE: Chapitre = {
  code: "les-composants-et-l-amortissement-derogatoire",
  parcours: "dcg-comptabilite-approfondie",
  palier: 4,
  blocs: ["DCG UE10 · Comptabilité approfondie", "BUT GEA · Produire l'information comptable, fiscale et sociale de l'organisation"],
  titre: "L'approche par composants et l'amortissement dérogatoire",
  accroche:
    "Une ligne de montage dont les moteurs s'usent deux fois plus vite que le bâti : chaque composant s'amortit sur sa durée, et l'écart entre le plan comptable et le plan fiscal devient une provision réglementée.",
  objectifs: [
    "Identifier un composant et justifier son amortissement séparé",
    "Calculer les dotations d'une immobilisation décomposée, au prorata du temps",
    "Calculer et comptabiliser l'amortissement dérogatoire",
    "Situer la dotation et la reprise de l'amortissement dérogatoire dans le plan",
  ],
  libre: false,
  prerequis: ["immobilisations"],
  entreprises: {
    codes: ["nova"],
    pourquoi: "ce chapitre amortit la seconde ligne de montage de NOVA, achetée pour fabriquer sa gamme.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une ligne, deux durées",
      notions: ["depreciation"],
      texte: (c) => {
        const k = composantsDeLaSecondeLigne();
        return [
          `Le 2 janvier N + 1, ${c.entreprise} met en service sa seconde ligne de montage : ${eur(SECONDE_LIGNE.ht)} hors taxes, comme la première. Le fabricant prévient : la structure, le bâti et le convoyeur, tiendra ${ans(SECONDE_LIGNE.structure.dureeAns)} ; les moteurs et l'électronique de commande, ${eur(SECONDE_LIGNE.composant.valeur)} du prix, seront à remplacer au bout de ${ans(SECONDE_LIGNE.composant.dureeAns)}.`,
          `Amortie d'un bloc sur ${ans(DUREE_SANS_COMPOSANTS)}, la ligne coûterait ${eur(k.sansComposants)} à l'exercice N + 1. Le plan comptable général demande mieux : quand un élément a une durée d'utilisation différente de celle de l'ensemble, c'est un composant, et il s'amortit sur sa propre durée.`,
        ];
      },
      repere: () => "Un composant : un élément important d'une immobilisation, à durée d'utilisation différente, remplacé à part. Il s'inscrit et s'amortit séparément.",
    },
    {
      id: "pourquoi-un-composant",
      objectifs: [0],
      type: "choix",
      titre: "Pourquoi décomposer ?",
      notions: ["depreciation"],
      question: () => "Pourquoi les moteurs et l'électronique de commande s'amortissent-ils à part ?",
      options: () => [
        {
          texte: "Leur durée d'utilisation diffère de celle de la ligne",
          juste: true,
          retour: "Oui : ils seront remplacés avant la structure. Les amortir sur la durée de la ligne laisserait au bilan, au bout de 3 ans, des moteurs hors d'usage encore à moitié amortis.",
        },
        {
          texte: "Parce qu'ils coûtent plus de la moitié du prix de la ligne entière",
          juste: false,
          retour: "Non : ils en coûtent le quart. Ce qui fait un composant, c'est une durée d'utilisation différente, sur un élément significatif.",
        },
        {
          texte: "Parce que le plan fiscal l'impose, pour déduire plus vite",
          juste: false,
          retour: "Non : la décomposition est une règle comptable, qui suit l'usure. L'avantage fiscal, c'est le dégressif, et il se traite par l'amortissement dérogatoire.",
        },
      ],
    },
    {
      id: "dotations",
      objectifs: [1],
      type: "montants",
      titre: "Les dotations de N + 1",
      notions: ["depreciation"],
      tableau: () => ({
        titre: "La seconde ligne, décomposée",
        colonnes: ["Valeur", "Durée"],
        lignes: [
          { libelle: SECONDE_LIGNE.structure.libelle, valeurs: [eur(SECONDE_LIGNE.structure.valeur), ans(SECONDE_LIGNE.structure.dureeAns)] },
          { libelle: SECONDE_LIGNE.composant.libelle, valeurs: [eur(SECONDE_LIGNE.composant.valeur), ans(SECONDE_LIGNE.composant.dureeAns)] },
        ],
      }),
      question: () => "En linéaire, du 2 janvier au 31 décembre N + 1 (359 jours sur 360, en mois de 30 jours), calculez la dotation de la structure, celle du composant et la dotation totale de la ligne.",
      champs: () => {
        const k = composantsDeLaSecondeLigne();
        const s = SECONDE_LIGNE;
        return [
          { libelle: "Dotation de la structure", attendu: k.structure, calcul: `${eur(s.structure.valeur)} ÷ ${s.structure.dureeAns} × 359 ÷ 360 = ${eur(k.structure)}` },
          { libelle: "Dotation du composant", attendu: k.composant, calcul: `${eur(s.composant.valeur)} ÷ ${s.composant.dureeAns} × 359 ÷ 360 = ${eur(k.composant)}` },
          { libelle: "Dotation totale", attendu: k.total, calcul: `${eur(k.structure)} + ${eur(k.composant)} = ${eur(k.total)}` },
        ];
      },
      explication: () => {
        const k = composantsDeLaSecondeLigne();
        return [
          `Décomposée, la ligne coûte ${eur(k.total)} à l'exercice, ${eur(k.ecart)} de plus que d'un bloc (${eur(k.sansComposants)}) : les moteurs s'usent vite, l'exercice qui les use en porte la charge.`,
        ];
      },
    },
    {
      id: "dotation-au-journal",
      objectifs: [1],
      type: "ecriture",
      titre: "La dotation, au journal",
      notions: ["depreciation"],
      evenement: () => "Passez la dotation aux amortissements de la seconde ligne au 31 décembre N + 1, ses deux composants ensemble.",
      ecriture: () => {
        const k = composantsDeLaSecondeLigne();
        return {
          date: "31 décembre N + 1",
          libelle: "Dotation aux amortissements de la seconde ligne",
          lignes: [
            { role: "la charge de l'exercice, la dotation aux amortissements", compte: "6811", acceptes: ["681"], sens: "debit", montant: k.total, indice: "la dotation totale des deux composants" },
            { role: "l'amortissement de la ligne", compte: "28154", acceptes: ["2815"], sens: "credit", montant: k.total, indice: "la dotation totale des deux composants" },
          ],
        };
      },
      indices: () => [
        "Au débit, la charge : les dotations aux amortissements des immobilisations corporelles (6811).",
        "Au crédit, le compte qui se soustrait du matériel industriel au bilan (28154). Chaque composant a sa fiche d'immobilisation ; au journal, les deux dotations peuvent se réunir.",
      ],
      explication: () => [
        "Au bilan, la structure et le composant restent inscrits chacun à sa valeur d'origine ; leurs amortissements s'en soustraient. Dans 3 ans, les moteurs remplacés sortiront de l'actif, entièrement amortis, et les nouveaux y entreront.",
      ],
      vue: "resultat",
    },
    {
      id: "le-derogatoire",
      objectifs: [2],
      type: "montants",
      titre: "Le plan fiscal de la structure",
      notions: ["depreciation"],
      question: () => {
        const d = derogatoireDeLaStructure();
        return `Sur le plan fiscal, NOVA amortit la structure en dégressif : coefficient ${d.coefficient.toLocaleString("fr-FR")} pour ${ans(SECONDE_LIGNE.structure.dureeAns)}, soit un taux de ${pct(d.tauxDegressif)}, et 12 mois comptés la première année (le dégressif part du premier jour du mois). Calculez la dotation dégressive de N + 1, puis l'amortissement dérogatoire, l'écart avec la dotation linéaire.`;
      },
      champs: () => {
        const d = derogatoireDeLaStructure();
        const a = d.annees[0]!;
        return [
          { libelle: "Dotation dégressive de N + 1", attendu: a.degressif, calcul: `${eur(SECONDE_LIGNE.structure.valeur)} × ${pct(d.tauxDegressif)} = ${eur(a.degressif)}` },
          { libelle: "Amortissement dérogatoire", attendu: a.ecart, calcul: `${eur(a.degressif)} − ${eur(a.lineaire)} = ${eur(a.ecart)}` },
        ];
      },
      explication: () => {
        const d = derogatoireDeLaStructure();
        return [
          `Le résultat comptable garde l'usure, ${eur(d.annees[0]!.lineaire)} ; le résultat fiscal déduit ${eur(d.annees[0]!.degressif)}. Pour que la comptabilité porte la déduction fiscale sans fausser l'usure, l'écart, ${eur(d.dotationN1)}, se dote en charge exceptionnelle et se range au passif, parmi les provisions réglementées.`,
        ];
      },
    },
    {
      id: "derogatoire-au-journal",
      objectifs: [2],
      type: "ecriture",
      titre: "L'amortissement dérogatoire, au journal",
      notions: ["depreciation"],
      evenement: () => "Passez l'amortissement dérogatoire de la structure au 31 décembre N + 1.",
      ecriture: () => {
        const d = derogatoireDeLaStructure();
        return {
          date: "31 décembre N + 1",
          libelle: "Amortissement dérogatoire de la structure",
          lignes: [
            { role: "la dotation aux provisions réglementées, une charge exceptionnelle", compte: "6872", acceptes: ["687"], sens: "debit", montant: d.dotationN1, indice: "l'écart entre le dégressif et le linéaire" },
            { role: "l'amortissement dérogatoire, au passif", compte: "145", sens: "credit", montant: d.dotationN1, indice: "l'écart entre le dégressif et le linéaire" },
          ],
        };
      },
      indices: () => [
        "Au débit, une charge exceptionnelle : les dotations aux provisions réglementées (6872).",
        "Au crédit, pas un amortissement de l'actif : l'usure est déjà au 28154. L'écart est une provision réglementée, au passif (145).",
      ],
      explication: () => [
        "L'actif ne bouge pas : la valeur nette de la structure reste celle du linéaire. Le passif porte une provision réglementée, que le dégressif fera reprendre quand sa dotation passera sous le linéaire.",
      ],
      vue: "resultat",
    },
    {
      id: "la-premiere-reprise",
      objectifs: [3],
      type: "curseur",
      titre: "L'année de la première reprise",
      notions: ["depreciation"],
      question: () =>
        "Le dégressif déduit beaucoup au début, puis moins que le linéaire. Faites varier l'année du plan de la structure : une droite donne la dotation linéaire, l'autre la dotation dégressive. Placez le curseur sur la première année où le linéaire dépasse le dégressif, celle où l'amortissement dérogatoire commence à se reprendre.",
      grandeur: () => ({ libelle: "Année du plan de la structure", unite: "année" }),
      cible: () => ({ attendu: derogatoireDeLaStructure().premiereReprise, min: 1, max: 6 }),
      zones: ["Le dérogatoire se reprend", "Le dérogatoire se dote encore"],
      rates: () => ({
        dessous: "Cette année-là, le dégressif dépasse encore le linéaire : l'écart se dote encore. Avancez.",
        dessus: "Cette année-là, le dérogatoire se reprend déjà, mais il a commencé plus tôt : cherchez la première.",
      }),
      montrer: "Montrer l'année",
      lecture: (_c, q) => {
        const a = derogatoireDeLaStructure().annees[Math.min(5, Math.max(0, Math.round(q) - 1))]!;
        return [
          { libelle: "Dotation linéaire", montant: a.lineaire },
          { libelle: "Dotation dégressive", montant: a.degressif },
          { libelle: a.ecart >= 0 ? "Amortissement dérogatoire doté" : "Amortissement dérogatoire repris", montant: Math.abs(a.ecart), fort: true },
        ];
      },
      droites: () => {
        const d = derogatoireDeLaStructure();
        const annee = (q: number) => d.annees[Math.min(5, Math.max(0, Math.round(q) - 1))]!;
        return { produit: (q) => annee(q).lineaire, cout: (q) => annee(q).degressif, libelles: ["Dotation linéaire", "Dotation dégressive"] };
      },
      explication: () => {
        const d = derogatoireDeLaStructure();
        const dotes = d.annees.filter((a) => a.ecart > 0).reduce((t, a) => t + a.ecart, 0);
        return [
          `Dès l'année ${d.premiereReprise}, le linéaire dépasse le dégressif : le dérogatoire se reprend (compte 7872), et le résultat fiscal rend ce qu'il avait déduit. Sur la durée du plan, les dotations, ${eur(dotes)}, se reprennent en entier : le dégressif avance la déduction, il ne l'augmente pas.`,
        ];
      },
    },
    {
      id: "le-laboratoire-des-composants",
      objectifs: [1],
      type: "simulation",
      titre: "Et si les moteurs duraient plus longtemps ?",
      notions: ["depreciation"],
      question: () => "Faites varier la durée d'utilisation des moteurs et de l'électronique : regardez la dotation totale de N + 1 face à celle de la ligne amortie d'un bloc.",
      leviers: () => [{ code: "duree", libelle: "Durée du composant", unite: "ans", ...DUREES_DU_COMPOSANT, depart: SECONDE_LIGNE.composant.dureeAns }],
      lecture: (_c, p) => {
        const k = composantsDeLaSecondeLigne(p.duree!);
        const ref = composantsDeLaSecondeLigne();
        return [
          { libelle: "Dotation du composant", montant: k.composant, reference: ref.composant },
          { libelle: "Dotation totale par composants", montant: k.total, reference: ref.total, fort: true },
          { libelle: "Dotation de la ligne d'un bloc", montant: k.sansComposants },
          { libelle: "Écart avec la ligne d'un bloc", montant: k.ecart, effet: true },
        ];
      },
      defi: () => ({
        consigne: "Trouvez la durée du composant pour laquelle la décomposition ne change pas la dotation de N + 1, à un centime d'arrondi près.",
        atteint: (p) => Math.abs(composantsDeLaSecondeLigne(p.duree!).ecart) < 0.05,
        indice: (p) => {
          const k = composantsDeLaSecondeLigne(p.duree!);
          return `Sur ${ans(p.duree!)}, la ligne décomposée coûte ${eur(k.ecart)} de plus que d'un bloc : le composant s'use encore plus vite que l'ensemble.`;
        },
        solution: { duree: DUREE_SANS_COMPOSANTS },
      }),
      explication: (_c, p) => [
        `Défi relevé : à ${ans(p.duree!)}, la durée de la ligne entière, le composant s'amortit au même rythme que la structure, et la décomposition ne change rien. Elle n'a d'effet que lorsque les durées diffèrent : c'est pour cela qu'on la demande.`,
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["depreciation"],
      texte: () => {
        const k = composantsDeLaSecondeLigne();
        const d = derogatoireDeLaStructure();
        return [
          `La seconde ligne coûte ${eur(k.total)} d'amortissements à N + 1 : chaque composant sur sa durée. Le plan fiscal en dégressif ajoute ${eur(d.dotationN1)} d'amortissement dérogatoire, une provision réglementée qui se reprendra dès l'année ${d.premiereReprise}.`,
          "Dans l'arène, l'équipement s'amortit d'un bloc : comparez sa dotation à celle d'une ligne décomposée.",
        ];
      },
      repere: () => "Comptabilité : chaque composant sur sa durée d'utilisation, en linéaire. Fiscalité : le dégressif. L'écart : l'amortissement dérogatoire, doté au 6872, au passif au 145, repris au 7872.",
    },
  ],
};
