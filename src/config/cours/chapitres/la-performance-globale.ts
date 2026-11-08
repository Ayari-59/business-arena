import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { HYPOTHESES_DE_LA_PERFORMANCE, partageDuBenefice, performanceDeNova } from "../monde/performance-de-nova";
import { KG_CO2_PAR_KWH } from "../monde/tableau-de-bord-durable";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : LA PERFORMANCE GLOBALE AU TABLEAU DE BORD (Bac STMG, sciences de gestion et numérique de
 * première, thème 3, question 2 : « La création de valeur conduit-elle toujours à une performance
 * globale ? »).
 *
 * Les chapitres de gestion du cours mesurent la part de marché, la rentabilité, la capacité
 * d'autofinancement, des indicateurs sociaux. Celui-ci les réunit dans un tableau de bord de NOVA à
 * quatre faces (commerciale, financière, sociale, environnementale), et apporte ce que l'audit y
 * trouvait absent : l'efficacité et l'efficience, la fidélité, la profitabilité, le bilan social,
 * l'indicateur environnemental, les comparaisons dans le temps et l'espace, et les contradictions entre
 * performances. Le laboratoire en fait vivre une : le dividende que veulent les associés, contre
 * l'autofinancement que veut garder le président.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS, chez NOVA : l'année N, le premier semestre, l'énergie et
 * l'absentéisme viennent des fiches (monde/performance-de-nova.ts les rassemble) ; l'objectif de ventes,
 * les clients qui rachètent et les vœux des associés et du président sont des hypothèses du cours,
 * nommées là-bas.
 */

export const ENTREPRISES_DE_LA_PERFORMANCE = ["nova"] as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 }).replace(/^-/, "−")} %`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

function leTableauDeBord(c: Cas): TableauDeDonnees {
  const p = performanceDeNova();
  return {
    titre: `Le tableau de bord ${dE(c.entreprise)}, année N`,
    colonnes: ["Valeur"],
    lignes: [
      { libelle: "Enceintes vendues", valeurs: [qte(p.enceintes)] },
      { libelle: "Chiffre d'affaires", valeurs: [eur(p.chiffreDAffaires)] },
      { libelle: "Part de marché du premier semestre", valeurs: [pct(p.partDeMarchePct)] },
      { libelle: "Résultat net", valeurs: [eur(p.resultatNet)] },
      { libelle: "Capitaux propres au 31 décembre", valeurs: [eur(p.capitauxPropres)] },
      { libelle: "Capacité d'autofinancement", valeurs: [eur(p.caf)] },
      { libelle: "Dividendes versés", valeurs: [eur(p.dividendes)] },
      { libelle: "Absentéisme du premier semestre", valeurs: [pct(p.absenteismePct)] },
      { libelle: "Électricité consommée", valeurs: [`${qte(p.kwh)} kWh`] },
    ],
  };
}

export const LA_PERFORMANCE_GLOBALE: Chapitre = {
  code: "la-performance-globale",
  parcours: "stmg-management",
  palier: 1,
  blocs: ["STMG Thème 3 · Création de valeur et performance"],
  titre: "La performance globale au tableau de bord",
  accroche:
    "Vendre plus, gagner plus, garder une équipe en bonne santé, émettre moins : quatre performances, qui ne vont pas toujours ensemble. Le tableau de bord d'une année, ses indicateurs, et ce qu'il faut arbitrer.",
  objectifs: [
    "Distinguer l'efficacité de l'efficience",
    "Ranger les indicateurs d'un tableau de bord par performance : commerciale, financière, sociale, environnementale",
    "Calculer la rentabilité, la profitabilité et un indicateur environnemental",
    "Repérer les contradictions entre performances et les arbitrer",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DE_LA_PERFORMANCE,
    pourquoi: "ce chapitre lit l'année N de NOVA, dont le cours tient les comptes, le semestre, l'énergie et l'absentéisme.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Une année, un tableau de bord",
      notions: ["dashboard", "csr_index"],
      tableau: leTableauDeBord,
      texte: (c) => [
        `${c.entreprise} a créé de la valeur en N : un bénéfice, des salaires, des clients servis. Mais a-t-elle été performante ? La réponse dépend de qui regarde : le client, l'associé, le salarié, le voisin de l'usine.`,
        "La performance globale réunit quatre faces : commerciale, financière, sociale et environnementale. Un tableau de bord les suit, avec quelques indicateurs choisis, comparés dans le temps (à l'année d'avant, à l'objectif) et dans l'espace (aux concurrents).",
      ],
      repere: () => "Performance globale = performance commerciale + financière + sociale + environnementale, suivies ensemble au tableau de bord.",
    },
    {
      id: "efficacite-et-efficience",
      objectifs: [0],
      type: "montants",
      titre: "Efficace, efficiente ?",
      notions: ["productivity"],
      question: (c) => {
        const p = performanceDeNova();
        return `Le président s'était fixé ${qte(HYPOTHESES_DE_LA_PERFORMANCE.objectifDeVentes)} enceintes à vendre en N ; ${c.entreprise} en a vendu ${qte(p.enceintes)}. Calculez le taux de réalisation de l'objectif (au dixième de point), puis le chiffre d'affaires par enceinte vendue.`;
      },
      champs: () => {
        const p = performanceDeNova();
        return [
          { libelle: "Réalisation de l'objectif (%)", attendu: p.efficacitePct, calcul: `${qte(p.enceintes)} ÷ ${qte(HYPOTHESES_DE_LA_PERFORMANCE.objectifDeVentes)} × 100 = ${pct(p.efficacitePct)}`, tolerance: 0.1 },
          { libelle: "Chiffre d'affaires par enceinte", attendu: Math.round((p.chiffreDAffaires / p.enceintes) * 100) / 100, calcul: `${eur(p.chiffreDAffaires)} ÷ ${qte(p.enceintes)} = ${eur(Math.round((p.chiffreDAffaires / p.enceintes) * 100) / 100)}` },
        ];
      },
      explication: () => {
        const p = performanceDeNova();
        return [
          `L'efficacité compare le résultat à l'objectif : ${pct(p.efficacitePct)}, l'objectif n'est pas tout à fait atteint. L'efficience compare le résultat aux moyens qu'il a demandés : vendre au même prix sans brader, avec la même équipe et la même ligne, c'est être efficient. Une entreprise peut être efficace sans être efficiente : atteindre l'objectif en dépensant trop.`,
        ];
      },
    },
    {
      id: "efficace-ou-efficiente",
      objectifs: [0],
      type: "choix",
      titre: "Le mot juste",
      question: () => "Pour atteindre l'objectif, le commercial propose une remise de 10 % sur toutes les ventes de décembre. L'objectif serait atteint, mais chaque enceinte rapporterait moins. Que dire de cette décision ?",
      options: () => [
        { texte: "Efficace, mais moins efficiente", juste: true, retour: "Oui : l'objectif serait atteint (efficacité), au prix d'une marge plus faible sur chaque vente, donc de plus de moyens pour le même résultat (efficience)." },
        { texte: "Efficiente, puisque les ventes montent", juste: false, retour: "Non : l'efficience rapporte le résultat aux moyens. Une remise fait monter les ventes, mais chaque vente rapporte moins." },
        { texte: "Ni l'une ni l'autre : une remise ne change rien à l'objectif de ventes", juste: false, retour: "Non : la remise fait vendre davantage, l'objectif peut être atteint ; c'est la marge qui en souffre." },
      ],
    },
    {
      id: "quatre-performances",
      objectifs: [1],
      type: "tri",
      titre: "Quatre performances",
      tableau: leTableauDeBord,
      question: () => "Rangez chaque indicateur sous la performance qu'il mesure.",
      categories: [
        { code: "commerciale", libelle: "Commerciale" },
        { code: "financiere", libelle: "Financière" },
        { code: "sociale", libelle: "Sociale" },
        { code: "environnementale", libelle: "Environnementale" },
      ],
      elements: () => [
        { libelle: "La part de marché", montant: 0, categorie: "commerciale", pourquoi: "La place de l'entreprise face à ses concurrents : la performance commerciale." },
        { libelle: "La part des clients du site qui ont racheté dans l'année", montant: 0, categorie: "commerciale", pourquoi: "La fidélité des clients : la performance commerciale." },
        { libelle: "Le résultat net rapporté aux capitaux propres", montant: 0, categorie: "financiere", pourquoi: "La rentabilité, ce que l'argent des associés rapporte : la performance financière." },
        { libelle: "La capacité d'autofinancement", montant: 0, categorie: "financiere", pourquoi: "Ce que l'activité laisse pour investir sans emprunter : la performance financière." },
        { libelle: "Le taux d'absentéisme", montant: 0, categorie: "sociale", pourquoi: "Un signe de la santé et du climat de l'équipe : la performance sociale." },
        { libelle: "Les accidents du travail", montant: 0, categorie: "sociale", pourquoi: "La sécurité des salariés : la performance sociale." },
        { libelle: "Les grammes de CO2 émis par enceinte", montant: 0, categorie: "environnementale", pourquoi: "L'empreinte de la production : la performance environnementale." },
      ],
      relance: "Demandez-vous : qui cet indicateur intéresse-t-il d'abord, le client, l'associé, le salarié, ou la planète ?",
      explication: () => [
        "Une entreprise de 300 salariés ou plus publie chaque année un bilan social, qui réunit ses indicateurs sociaux (effectif, absentéisme, accidents, formation, salaires) ; ses données entrent dans la base de données économiques, sociales et environnementales (BDESE). NOVA, plus petite, suit les siens à son tableau de bord.",
      ],
    },
    {
      id: "rentabilite-et-profitabilite",
      objectifs: [2],
      type: "montants",
      titre: "Rentabilité et profitabilité",
      notions: ["profitability_vs_return"],
      tableau: leTableauDeBord,
      question: () => "Calculez, au dixième de point, la rentabilité (le résultat net rapporté aux capitaux propres) et la profitabilité (le résultat net rapporté au chiffre d'affaires).",
      champs: () => {
        const p = performanceDeNova();
        return [
          { libelle: "Rentabilité (%)", attendu: p.rentabilitePct, calcul: `${eur(p.resultatNet)} ÷ ${eur(p.capitauxPropres)} × 100 = ${pct(p.rentabilitePct)}`, tolerance: 0.1 },
          { libelle: "Profitabilité (%)", attendu: p.profitabilitePct, calcul: `${eur(p.resultatNet)} ÷ ${eur(p.chiffreDAffaires)} × 100 = ${pct(p.profitabilitePct)}`, tolerance: 0.1 },
        ];
      },
      explication: () => {
        const p = performanceDeNova();
        return [
          `Chaque euro placé par les associés a rapporté ${pct(p.rentabilitePct)} ; chaque euro vendu a laissé ${pct(p.profitabilitePct)} de bénéfice. Les deux ne disent pas la même chose : la rentabilité intéresse celui qui apporte l'argent, la profitabilité celui qui fixe les prix.`,
        ];
      },
    },
    {
      id: "l-indicateur-environnemental",
      objectifs: [2],
      type: "montants",
      titre: "Un indicateur environnemental",
      notions: ["csr_index"],
      question: () => {
        const p = performanceDeNova();
        return `En N, la chaîne et le bâtiment ont consommé ${qte(p.kwh)} kWh d'électricité ; chaque kWh émet ${KG_CO2_PAR_KWH.toLocaleString("fr-FR")} kg de CO2. Calculez les émissions de l'année (en kg) et les grammes de CO2 émis par enceinte vendue, à l'unité.`;
      },
      champs: () => {
        const p = performanceDeNova();
        return [
          { libelle: "Émissions de l'année (kg de CO2)", attendu: p.co2, calcul: `${qte(p.kwh)} × ${KG_CO2_PAR_KWH.toLocaleString("fr-FR")} = ${qte(p.co2)} kg`, tolerance: 0.5 },
          { libelle: "Émissions par enceinte (g de CO2)", attendu: p.co2ParEnceinteGrammes, calcul: `${qte(p.co2)} kg ÷ ${qte(p.enceintes)} × 1 000 = ${qte(p.co2ParEnceinteGrammes)} g`, tolerance: 1 },
        ];
      },
      explication: () => {
        const p = performanceDeNova();
        return [
          `${qte(p.co2ParEnceinteGrammes)} grammes par enceinte : rapporté à ce qui est produit, l'indicateur se compare d'une année à l'autre même quand les ventes changent. Il ne compte que l'électricité : les composants achetés et leur transport en émettent bien plus, et un bilan complet les suivrait aussi.`,
        ];
      },
    },
    {
      id: "comparer",
      objectifs: [1],
      type: "choix",
      titre: "Comparer dans le temps et l'espace",
      question: () => {
        const p = performanceDeNova();
        return `La part de marché de NOVA est de ${pct(p.partDeMarchePct)} au premier semestre. Qu'est-ce qui permet de dire si c'est une bonne performance ?`;
      },
      options: () => [
        { texte: "La comparer à l'objectif, au passé et aux concurrents", juste: true, retour: "Oui : un indicateur seul ne dit rien. Il se lit face à un objectif, à sa valeur passée (dans le temps) et à celle des concurrents (dans l'espace, le parangonnage)." },
        { texte: "Rien : au-dessus de 20 %, une part de marché est toujours bonne", juste: false, retour: "Non : aucun seuil ne vaut pour tous les marchés. Sur un marché à trois, un quart des ventes peut être peu ; sur un marché de 100 vendeurs, c'est beaucoup." },
        { texte: "La seule valeur du chiffre suffit : plus il est haut, mieux c'est", juste: false, retour: "Non : sans repère, on ne sait pas si le chiffre progresse, recule, ou reste loin des concurrents." },
      ],
    },
    {
      id: "partager-le-benefice",
      objectifs: [3],
      type: "simulation",
      titre: "Le dividende ou l'autofinancement",
      notions: ["profitability_vs_return"],
      question: (c) => {
        const p = performanceDeNova();
        const h = HYPOTHESES_DE_LA_PERFORMANCE;
        return `Le bénéfice de N est de ${eur(p.resultatNet)}, la capacité d'autofinancement de ${eur(p.caf)}. Les associés veulent au moins ${eur(h.dividendeVoulu)} de dividendes ; le président veut garder au moins ${eur(h.autofinancementVoulu)} pour investir dans une seconde ligne. Ce qui est versé aux associés ne reste pas chez ${c.entreprise}. Choisissez le dividende.`;
      },
      leviers: () => [{ code: "dividendes", libelle: "Dividendes versés", unite: "€", min: 0, max: 50_000, pas: 5_000, depart: performanceDeNova().dividendes }],
      lecture: (_c, p) => {
        const k = partageDuBenefice(p.dividendes!);
        const h = HYPOTHESES_DE_LA_PERFORMANCE;
        return [
          { libelle: "Dividendes versés aux associés", montant: k.dividendes, reference: h.dividendeVoulu },
          { libelle: "Autofinancement qui reste", montant: k.autofinancement, reference: h.autofinancementVoulu, fort: true },
          { libelle: "Part du bénéfice distribuée", montant: k.partDistribueePct, unite: "%" },
        ];
      },
      graphique: () => ({
        levier: "dividendes",
        courbes: [
          { libelle: "Dividendes versés", valeur: (p) => partageDuBenefice(p.dividendes!).dividendes },
          { libelle: "Autofinancement qui reste", valeur: (p) => partageDuBenefice(p.dividendes!).autofinancement },
        ],
      }),
      defi: () => {
        const h = HYPOTHESES_DE_LA_PERFORMANCE;
        return {
          consigne: "Trouvez le dividende qui satisfait les associés et le président à la fois.",
          atteint: (p) => {
            const k = partageDuBenefice(p.dividendes!);
            return k.dividendes >= h.dividendeVoulu && k.autofinancement >= h.autofinancementVoulu;
          },
          indice: (p) => {
            const k = partageDuBenefice(p.dividendes!);
            return k.dividendes < h.dividendeVoulu
              ? `Les associés reçoivent ${eur(k.dividendes)} : moins que ce qu'ils attendent.`
              : `Il ne reste que ${eur(k.autofinancement)} pour investir : moins que ce que veut le président.`;
          },
          solution: { dividendes: h.dividendeVoulu },
        };
      },
      explication: (_c, p) => {
        const k = partageDuBenefice(p.dividendes!);
        const r = partageDuBenefice(performanceDeNova().dividendes);
        return [
          `Défi relevé : ${eur(k.dividendes)} aux associés laissent ${eur(k.autofinancement)} pour investir. Le dividende retenu par l'assemblée, ${eur(r.dividendes)}, n'en laissait que ${eur(r.autofinancement)}.`,
          "La performance financière pour les associés (le dividende) et la capacité de l'entreprise à grandir (l'autofinancement) se disputent le même bénéfice. D'autres contradictions guettent : une hausse des salaires sert la performance sociale et pèse sur la financière ; une ligne moins gourmande en énergie sert l'environnement et coûte à l'achat.",
        ];
      },
    },
    {
      id: "une-contradiction",
      objectifs: [3],
      type: "choix",
      titre: "Une contradiction",
      question: () => "Pour baisser ses émissions, NOVA envisage un contrat d'électricité d'origine renouvelable, plus cher de 8 %. Quelles performances s'opposent ?",
      options: () => [
        { texte: "L'environnementale gagne, la financière perd un peu", juste: true, retour: "Oui : les émissions baissent, le résultat aussi, un peu. Arbitrer, c'est décider ce que l'entreprise accepte de payer pour une performance, et l'expliquer à ses parties prenantes. Une meilleure image peut, ensuite, servir la performance commerciale." },
        { texte: "Aucune : toutes les performances montent ensemble", juste: false, retour: "Non : le contrat coûte plus cher. La performance financière recule pendant que l'environnementale progresse." },
        { texte: "La sociale et la commerciale, puisque les salariés et les clients paient l'électricité", juste: false, retour: "Non : c'est NOVA qui paie l'électricité. Le surcoût pèse sur son résultat, donc sur la performance financière." },
      ],
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      texte: (c) => {
        const p = performanceDeNova();
        return [
          `En N, ${c.entreprise} a atteint ${pct(p.efficacitePct)} de son objectif de ventes, tenu ${pct(p.partDeMarchePct)} du marché au premier semestre, rapporté ${pct(p.rentabilitePct)} à ses associés pour ${pct(p.profitabilitePct)} de profitabilité, gardé un absentéisme de ${pct(p.absenteismePct)} et émis ${qte(p.co2ParEnceinteGrammes)} grammes de CO2 par enceinte.`,
          "Créer de la valeur ne suffit pas à être performant partout : la performance globale se lit sur quatre faces, comparées dans le temps et l'espace, et ses faces se contredisent parfois. Le tableau de bord sert à arbitrer. Dans l'arène, l'écran des indicateurs suit les mêmes faces, tour après tour.",
        ];
      },
      repere: () => "Efficacité : le résultat face à l'objectif. Efficience : le résultat face aux moyens. Rentabilité : le résultat face aux capitaux propres. Profitabilité : le résultat face au chiffre d'affaires.",
    },
  ],
};
