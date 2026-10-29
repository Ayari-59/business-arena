import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import { DEPRECIATION_A_DEPASSER, TAUX_DU_LABORATOIRE, TEST_DE_LA_PREMIERE_LIGNE, fluxSansDepreciation, tauxQuiDepasse, testDeDepreciation } from "../monde/comptabilite-approfondie";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LE TEST DE DÉPRÉCIATION D'UNE IMMOBILISATION (DCG UE10 · Comptabilité approfondie,
 * palier 4 ; BUT GEA).
 *
 * Au 31 décembre N + 1, une ligne automatique vendue au prix d'une ligne manuelle fait chuter la
 * valeur de la première ligne de NOVA : un indice de perte de valeur. L'élève fait le test : la
 * valeur nette comptable face à la valeur actuelle, la plus haute de la valeur vénale et de la
 * valeur d'usage (les flux actualisés), passe la dépréciation et refait le plan. Le curseur cherche
 * le flux qui épargne la dépréciation ; le laboratoire montre ce que le taux d'actualisation y fait.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA seule : la ligne de N, 60 000 € sur 6 ans en
 * linéaire (exercice-de-nova.ts), et le test de monde/comptabilite-approfondie.ts.
 */

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${(Math.round(t * 10_000) / 100).toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
const facteur = (x: number) => x.toLocaleString("fr-FR", { maximumFractionDigits: 4 });

export const LE_TEST_DE_DEPRECIATION: Chapitre = {
  code: "le-test-de-depreciation",
  parcours: "dcg-comptabilite-approfondie",
  palier: 4,
  blocs: ["DCG UE10 · Comptabilité approfondie", "BUT GEA · Produire l'information comptable, fiscale et sociale de l'organisation"],
  titre: "Le test de dépréciation d'une immobilisation",
  accroche:
    "Un concurrent technique fait chuter le prix des lignes d'occasion : ce que vaut encore la ligne de montage, à la revente et à l'usage, et ce que la comptabilité en retient.",
  objectifs: [
    "Reconnaître un indice de perte de valeur",
    "Calculer la valeur d'usage par l'actualisation des flux, et la valeur actuelle",
    "Calculer et comptabiliser la dépréciation d'une immobilisation",
    "Refaire le plan d'amortissement après une dépréciation",
  ],
  libre: false,
  prerequis: ["immobilisations", "la-valeur-actuelle-nette"],
  entreprises: {
    codes: ["nova"],
    pourquoi: "ce chapitre teste la valeur de la première ligne de montage de NOVA, celle de son premier exercice.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce que vaut encore la ligne",
      notions: ["depreciation", "goodwill_impairment"],
      texte: (c) => {
        const t = testDeDepreciation();
        return [
          `La première ligne de ${c.entreprise} a coûté ${eur(t.brut)} ; amortie en linéaire, elle vaudra ${eur(t.valeurNette)} au 31 décembre N + 1. Mais en N + 1, les fabricants vendent une ligne automatique au prix d'une ligne manuelle, et le marché de l'occasion s'effondre.`,
          "À chaque clôture, l'entreprise cherche un indice de perte de valeur. S'il y en a un, elle compare la valeur nette comptable à la valeur actuelle, la plus haute de deux : la valeur vénale (ce qu'elle tirerait de la vente, net des frais) et la valeur d'usage (ce que l'actif lui rapportera encore, actualisé). Si la valeur actuelle est plus basse, l'écart est une dépréciation.",
        ];
      },
      repere: () => "Valeur actuelle = la plus haute de la valeur vénale et de la valeur d'usage. Dépréciation = valeur nette comptable − valeur actuelle, si elle est positive.",
    },
    {
      id: "l-indice",
      objectifs: [0],
      type: "choix",
      titre: "Un indice de perte de valeur ?",
      notions: ["goodwill_impairment"],
      question: () => "Lequel de ces faits oblige NOVA à tester la valeur de sa première ligne au 31 décembre N + 1 ?",
      options: () => [
        {
          texte: "Une technique nouvelle fait chuter le prix des lignes",
          juste: true,
          retour: "Oui : un changement de technique ou de marché qui fait baisser la valeur d'un actif est un indice externe de perte de valeur. Le test devient obligatoire.",
        },
        {
          texte: "La dotation de N + 1 est plus forte que celle de N, l'exercice étant complet",
          juste: false,
          retour: "Non : la dotation de N ne portait pas sur une année entière, la ligne étant entrée le 6 janvier ; celle de N + 1 si. C'est le plan qui se déroule, pas une perte de valeur.",
        },
        {
          texte: "La ligne a déjà perdu un tiers de sa valeur brute en amortissements",
          juste: false,
          retour: "Non : l'amortissement constate l'usure prévue. Un indice, c'est ce que le plan ne prévoyait pas.",
        },
      ],
    },
    {
      id: "la-valeur-d-usage",
      objectifs: [1],
      type: "montants",
      titre: "La valeur d'usage",
      notions: ["discounting", "depreciation"],
      tableau: () => {
        const t = testDeDepreciation();
        return {
          titre: "Le test de la première ligne, au 31 décembre N + 1",
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Valeur brute", valeurs: [eur(t.brut)] },
            { libelle: "Amortissements de N et de N + 1", valeurs: [eur(t.dotationN + t.dotationN1)] },
            { libelle: "Valeur vénale, nette des frais de sortie", valeurs: [eur(t.valeurVenale)] },
            { libelle: "Flux net de trésorerie, chaque année, en fin d'année", valeurs: [eur(t.fluxAnnuel)] },
            { libelle: "Années d'utilisation restantes", valeurs: [`${t.anneesRestantes}`] },
            { libelle: "Taux d'actualisation", valeurs: [pct(t.taux)] },
          ],
        };
      },
      question: () => "Calculez la valeur nette comptable, le facteur d'actualisation des flux (au dix-millième), la valeur d'usage, puis la valeur actuelle.",
      champs: () => {
        const t = testDeDepreciation();
        return [
          { libelle: "Valeur nette comptable", attendu: t.valeurNette, calcul: `${eur(t.brut)} − ${eur(t.dotationN)} − ${eur(t.dotationN1)} = ${eur(t.valeurNette)}` },
          { libelle: "Facteur d'actualisation", attendu: Math.round(t.facteur * 10_000) / 10_000, calcul: `(1 − (1 + ${facteur(t.taux)}) puissance −${t.anneesRestantes}) ÷ ${facteur(t.taux)} = ${facteur(t.facteur)}`, tolerance: 0.0001 },
          { libelle: "Valeur d'usage", attendu: t.valeurDUsage, calcul: `${eur(t.fluxAnnuel)} × ${facteur(t.facteur)} = ${eur(t.valeurDUsage)}`, tolerance: 1 },
          { libelle: "Valeur actuelle", attendu: t.valeurActuelle, calcul: `la plus haute de ${eur(t.valeurVenale)} et ${eur(t.valeurDUsage)} : ${eur(t.valeurActuelle)}`, tolerance: 1 },
        ];
      },
      explication: () => {
        const t = testDeDepreciation();
        return [
          `Vendue, la ligne rapporterait ${eur(t.valeurVenale)} ; gardée, elle rapportera l'équivalent de ${eur(t.valeurDUsage)} aujourd'hui. NOVA la garde : sa valeur actuelle est sa valeur d'usage, ${eur(t.valeurActuelle)}, sous sa valeur nette de ${eur(t.valeurNette)}.`,
        ];
      },
    },
    {
      id: "la-depreciation",
      objectifs: [2],
      type: "montants",
      titre: "La dépréciation",
      notions: ["depreciation"],
      question: () => "Calculez la dépréciation de la ligne au 31 décembre N + 1.",
      champs: () => {
        const t = testDeDepreciation();
        return [{ libelle: "Dépréciation", attendu: t.depreciation, calcul: `${eur(t.valeurNette)} − ${eur(t.valeurActuelle)} = ${eur(t.depreciation)}` }];
      },
      explication: () => [
        `La ligne ne vaut plus que ${eur(testDeDepreciation().valeurActuelle)} : la prudence demande de constater la perte dès qu'on la connaît, sans attendre la revente.`,
      ],
    },
    {
      id: "la-depreciation-au-journal",
      objectifs: [2],
      type: "ecriture",
      titre: "La dépréciation, au journal",
      notions: ["depreciation"],
      evenement: () => "Passez la dépréciation de la première ligne au 31 décembre N + 1.",
      ecriture: () => {
        const t = testDeDepreciation();
        return {
          date: "31 décembre N + 1",
          libelle: "Dépréciation de la première ligne de montage",
          lignes: [
            { role: "la charge, la dotation aux dépréciations des immobilisations", compte: "6816", acceptes: ["681"], sens: "debit", montant: t.depreciation, indice: "la dépréciation calculée" },
            { role: "la dépréciation de la ligne", compte: "2915", acceptes: ["291"], sens: "credit", montant: t.depreciation, indice: "la dépréciation calculée" },
          ],
        };
      },
      indices: () => [
        "Au débit, une dotation d'exploitation : aux dépréciations des immobilisations corporelles (6816), pas aux amortissements.",
        "Au crédit, un compte qui se soustrait de la ligne au bilan, à côté de ses amortissements : les dépréciations du matériel (2915).",
      ],
      explication: () => [
        "L'amortissement constate l'usure prévue ; la dépréciation, une perte que le plan ne prévoyait pas, et qui peut se reprendre si la valeur remonte. Les deux se soustraient de la valeur brute au bilan.",
      ],
      vue: "resultat",
    },
    {
      id: "le-nouveau-plan",
      objectifs: [3],
      type: "montants",
      titre: "Le plan, après la dépréciation",
      notions: ["depreciation"],
      question: () => {
        const t = testDeDepreciation();
        return `La ligne servira encore ${t.anneesRestantes} ans. Calculez la dotation annuelle de N + 2, sur la valeur après dépréciation.`;
      },
      champs: () => {
        const t = testDeDepreciation();
        return [{ libelle: "Dotation de N + 2", attendu: t.dotationSuivante, calcul: `${eur(t.valeurApres)} ÷ ${t.anneesRestantes} = ${eur(t.dotationSuivante)}` }];
      },
      explication: () => {
        const t = testDeDepreciation();
        return [
          `La base amortissable devient ${eur(t.valeurApres)} : la dotation descend de ${eur(t.dotationN1)} à ${eur(t.dotationSuivante)}. Sans ce nouveau plan, la ligne serait amortie deux fois de sa perte : une fois par la dépréciation, une fois par l'ancien plan.`,
        ];
      },
    },
    {
      id: "le-flux-qui-suffit",
      objectifs: [1, 2],
      type: "curseur",
      titre: "Le flux qui épargne la dépréciation",
      notions: ["discounting"],
      question: () =>
        "Faites varier le flux net annuel que la ligne rapporte : une droite donne sa valeur actuelle, l'autre sa valeur nette comptable. Placez le curseur sur le plus petit flux, à l'euro, pour lequel aucune dépréciation n'est à constater.",
      grandeur: () => ({ libelle: "Flux net annuel de la ligne", unite: "€" }),
      cible: () => ({ attendu: fluxSansDepreciation(), min: 9_000, max: 13_000 }),
      zones: ["Aucune dépréciation", "La ligne se déprécie"],
      rates: () => ({
        dessous: "À ce flux, la valeur d'usage reste sous la valeur nette : la ligne se déprécie encore. Montez.",
        dessus: "À ce flux, la ligne ne se déprécie pas, mais un flux plus bas suffirait : cherchez le plus petit.",
      }),
      montrer: "Montrer le flux",
      lecture: (_c, q) => {
        const t = testDeDepreciation(q);
        return [
          { libelle: "Valeur d'usage", montant: t.valeurDUsage },
          { libelle: "Valeur nette comptable", montant: t.valeurNette },
          { libelle: "Dépréciation", montant: t.depreciation, fort: true },
        ];
      },
      droites: () => ({ produit: (q) => testDeDepreciation(q).valeurActuelle, cout: () => testDeDepreciation().valeurNette, libelles: ["Valeur actuelle", "Valeur nette comptable"] }),
      explication: () => {
        const t = testDeDepreciation();
        return [
          `Il faudrait ${eur(fluxSansDepreciation())} par an pour que la valeur d'usage rejoigne ${eur(t.valeurNette)}. Avec ${eur(t.fluxAnnuel)}, la ligne ne rapporte plus ce que dit son plan d'amortissement : la dépréciation le corrige.`,
        ];
      },
    },
    {
      id: "le-laboratoire-du-taux",
      objectifs: [1],
      type: "simulation",
      titre: "Le taux d'actualisation",
      notions: ["discounting"],
      question: () => "Faites varier le taux d'actualisation des flux de la ligne : regardez la valeur d'usage et la dépréciation réagir.",
      leviers: () => [{ code: "taux", libelle: "Taux d'actualisation", unite: "%", ...TAUX_DU_LABORATOIRE, depart: Math.round(TEST_DE_LA_PREMIERE_LIGNE.taux * 100) }],
      lecture: (_c, p) => {
        const t = testDeDepreciation(undefined, p.taux! / 100);
        const ref = testDeDepreciation();
        return [
          { libelle: "Valeur d'usage", montant: t.valeurDUsage, reference: ref.valeurDUsage },
          { libelle: "Valeur actuelle", montant: t.valeurActuelle, reference: ref.valeurActuelle },
          { libelle: "Dépréciation", montant: t.depreciation, reference: ref.depreciation, fort: true },
        ];
      },
      graphique: () => ({ levier: "taux", courbes: [{ libelle: "Dépréciation", valeur: (p) => testDeDepreciation(undefined, p.taux! / 100).depreciation }] }),
      defi: () => {
        const cherche = tauxQuiDepasse();
        return {
          consigne: `Trouvez le plus petit taux, de point en point, pour lequel la dépréciation dépasse ${eur(DEPRECIATION_A_DEPASSER)}.`,
          atteint: (p) => p.taux === cherche,
          indice: (p) => {
            const d = testDeDepreciation(undefined, p.taux! / 100).depreciation;
            return d > DEPRECIATION_A_DEPASSER ? `À ${p.taux} %, la dépréciation vaut ${eur(d)} : un taux plus bas la dépasse-t-il aussi ?` : `À ${p.taux} %, la dépréciation ne vaut que ${eur(d)}.`;
          },
          solution: { taux: cherche },
        };
      },
      explication: (_c, p) => {
        const t = testDeDepreciation(undefined, p.taux! / 100);
        return [
          `Défi relevé : à ${p.taux} %, la valeur d'usage tombe à ${eur(t.valeurDUsage)} et la dépréciation à ${eur(t.depreciation)}. Plus le taux est haut, moins valent les flux lointains : le choix du taux pèse sur le résultat, et l'annexe doit le dire.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["depreciation"],
      texte: () => {
        const t = testDeDepreciation();
        return [
          `Au 31 décembre N + 1, la première ligne vaut ${eur(t.valeurActuelle)}, sa valeur d'usage, pour une valeur nette de ${eur(t.valeurNette)} : ${eur(t.depreciation)} de dépréciation, et un plan refait à ${eur(t.dotationSuivante)} par an.`,
          "Dans l'arène, la revente d'un équipement se fait à une fraction de sa valeur nette : comparez ce prix à la valeur que dirait un test de dépréciation.",
        ];
      },
      repere: () => "Indice, test, dépréciation (6816 / 2915), nouveau plan : la dépréciation se reprend (7816) si la valeur actuelle remonte, sans jamais dépasser la valeur nette qu'aurait donnée le plan d'origine.",
    },
  ],
};
