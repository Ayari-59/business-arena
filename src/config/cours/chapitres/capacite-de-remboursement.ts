import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { CAPACITE_DE_REMBOURSEMENT_MAXIMALE, INDEPENDANCE_MINIMALE } from "../financement";
import { auCentime } from "../monde/amortissement";
import { ENTREPRISES_DES_COMPTES_DU_LYCEE, exerciceDe } from "../monde/comptes-du-lycee";
import { LOYER_DU_MOIS } from "../monde/exercice-de-nova";
import {
  LOYERS_D_UNE_ANNEE,
  dansLesRegles,
  empruntPermisParLaCapacite,
  empruntPermisParLIndependance,
  structureFinanciere,
  type StructureFinanciere,
} from "../monde/financement-du-lycee";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : LA CAPACITÉ DE REMBOURSEMENT ET LES LIMITES DE L'ANALYSE FONCTIONNELLE (Bac STMG,
 * gestion et finance, palier 1 ; programme de terminale, 2.2).
 *
 * Avant de prêter, la banque fait deux calculs : en combien d'années la capacité d'autofinancement
 * rembourserait les dettes financières (la capacité de remboursement, quatre ans au plus), et quelle
 * part des ressources durables les associés apportent (l'indépendance financière, la moitié au
 * moins). Le chapitre les calcule sur NOVA, les juge, puis fait l'expérience : un curseur sur un
 * emprunt nouveau (jusqu'où la capacité de remboursement le permet-elle ?) et un laboratoire de la
 * banque (un emprunt et une année moins bonne : le défi, emprunter 100 000 € en restant dans les
 * règles même si les ventes baissent de 15 %). Il finit sur ce que le bilan fonctionnel ne montre
 * pas : les loyers à venir, la photo d'un seul jour, des valeurs d'achat.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : le premier exercice de NOVA ; les ratios, l'année
 * suivante rejouée et les loyers à venir sont calculés dans monde/financement-du-lycee.ts, les
 * règles des banques posées dans config/cours/financement.ts.
 */

/** Les bornes du curseur de l'emprunt nouveau, en euros. */
export const EMPRUNT_DU_CURSEUR = { min: 0, max: 500_000 } as const;

/** Les leviers du laboratoire : l'emprunt nouveau, et la baisse des ventes de l'année suivante, en %. */
export const LEVIERS_DE_LA_BANQUE = {
  emprunt: { min: 0, max: 300_000, pas: 10_000 },
  baisse: { min: 0, max: 20, pas: 5 },
} as const;

/** Le défi du laboratoire : emprunter au moins 100 000 €, et rester dans les règles avec 15 % de ventes en moins. */
export const EMPRUNT_DU_DEFI = 100_000;
export const BAISSE_DU_DEFI = 15;

/** La solution que montre la correction. */
export const SOLUTION_DE_LA_BANQUE = { emprunt: EMPRUNT_DU_DEFI, baisse: BAISSE_DU_DEFI } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR");
const auCentieme = (x: number) => Math.round(x * 100) / 100;
const auDixieme = (x: number) => Math.round(x * 10) / 10;
const pct = (t: number) => `${t.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
/** « 0,65 an », « 3,85 ans » : le singulier sous deux. */
const ans = (x: number) => `${qte(x)} ${x < 2 ? "an" : "ans"}`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);
const MAX = CAPACITE_DE_REMBOURSEMENT_MAXIMALE;
const MIN_PCT = INDEPENDANCE_MINIMALE * 100;

/** Les chiffres du chapitre, au 31 décembre du premier exercice de NOVA. */
export function capaciteDeRemboursement(c: Pick<Cas, "code">) {
  const s = structureFinanciere(exerciceDe(c.code));
  const capacite = auCentieme(s.capaciteDeRemboursement);
  const independance = auDixieme(s.independance * 100);
  const loyers = LOYERS_D_UNE_ANNEE;
  return {
    ...s,
    capacite,
    independance,
    permisParLaCapacite: empruntPermisParLaCapacite(s),
    permisParLIndependance: empruntPermisParLIndependance(s),
    tresorerie: s.b.tresorerie,
    loyerDuMois: LOYER_DU_MOIS.montant,
    loyers,
    capaciteAvecLesLoyers: auCentieme((s.dettesFinancieres + loyers) / s.caf),
  };
}

export type CapaciteDeRemboursement = ReturnType<typeof capaciteDeRemboursement>;

/** Une position du laboratoire : l'emprunt nouveau, et l'année suivante avec la baisse des ventes. */
export const banqueDuLaboratoire = (k: CapaciteDeRemboursement, p: Readonly<Record<string, number>>): StructureFinanciere =>
  structureFinanciere(k.f, { emprunt: p.emprunt!, baisseDesVentes: p.baisse! / 100 });

export const CAPACITE_DE_REMBOURSEMENT: Chapitre = {
  code: "capacite-de-remboursement",
  parcours: "stmg-gf",
  palier: 1,
  blocs: ["STMG Thème 2 · Analyser la situation de l'entreprise"],
  titre: "La capacité de remboursement et les limites de l'analyse fonctionnelle",
  accroche:
    "Avant de prêter, la banque fait deux calculs : en combien d'années l'entreprise rembourserait ses dettes, et qui finance vraiment son long terme. Puis ce que le bilan ne lui dit pas.",
  objectifs: [
    "Calculer la capacité de remboursement et la comparer à la règle des banques",
    "Calculer l'indépendance financière et la comparer à la règle des banques",
    "Dire jusqu'où l'entreprise peut s'endetter, et ce qu'une moins bonne année y change",
    "Citer ce que le bilan fonctionnel ne montre pas",
  ],
  libre: false,
  prerequis: ["fonds-de-roulement-et-tresorerie", "financer-l-entreprise"],
  ensuite: ["financer-autrement"],
  entreprises: {
    codes: ENTREPRISES_DES_COMPTES_DU_LYCEE,
    pourquoi: "la capacité de remboursement se calcule ici sur le premier exercice de NOVA dans la simulation du cours, son compte de résultat et son bilan ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Ce que la banque calcule",
      notions: ["balance_sheet", "frng"],
      texte: (c) => {
        const k = capaciteDeRemboursement(c);
        return [
          `${k.entreprise} pense à emprunter de nouveau. Avant de répondre, la banque pose deux questions, et chacune a son calcul.`,
          `La première : si l'entreprise consacrait toute sa capacité d'autofinancement à ses dettes financières, en combien d'années les rembourserait-elle ? C'est la capacité de remboursement. Les banques veulent qu'elle reste sous ${qte(MAX)} ans.`,
          "La seconde : sur le long terme, qui finance l'entreprise ? Les associés, par les capitaux propres, ou les prêteurs ? C'est l'indépendance financière : la part des capitaux propres dans les ressources durables, celles du fonds de roulement. Les banques en veulent au moins la moitié.",
        ];
      },
      tableau: (c) => {
        const k = capaciteDeRemboursement(c);
        return {
          titre: `${k.entreprise} au 31 décembre`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Résultat net de l'année", valeurs: [eur(k.k.resultatNet)] },
            { libelle: "Dotations de l'année", valeurs: [eur(k.k.dotations)] },
            { libelle: "Emprunt (capital restant dû)", valeurs: [eur(k.dettesFinancieres)] },
            { libelle: "Capitaux propres", valeurs: [eur(k.capitauxPropres)] },
            { libelle: "Ressources durables", valeurs: [eur(k.ressourcesDurables)] },
          ],
        };
      },
      repere: () => "Capacité de remboursement = dettes financières ÷ capacité d'autofinancement (4 ans au plus). Indépendance financière = capitaux propres ÷ ressources durables (50 % au moins).",
    },
    {
      id: "capacite",
      objectifs: [0],
      type: "montants",
      titre: "La capacité de remboursement",
      notions: ["income_statement", "loan_schedule"],
      question: () =>
        "Calculez la capacité d'autofinancement de l'année (résultat net + dotations), puis la capacité de remboursement : les dettes financières divisées par la capacité d'autofinancement, en années, au centième.",
      champs: (c) => {
        const k = capaciteDeRemboursement(c);
        return [
          { libelle: "Capacité d'autofinancement", attendu: k.caf, calcul: `${eur(k.k.resultatNet)} + ${eur(k.k.dotations)} = ${eur(k.caf)}`, tolerance: 1 },
          { libelle: "Capacité de remboursement (années)", attendu: k.capacite, calcul: `${eur(k.dettesFinancieres)} ÷ ${eur(k.caf)} = ${qte(k.capacite)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const k = capaciteDeRemboursement(c);
        return [
          `En consacrant tout ce que son activité dégage à son emprunt, ${k.entreprise} le rembourserait en ${ans(k.capacite)}. ${k.capacite <= MAX ? `C'est bien sous les ${qte(MAX)} ans des banques.` : `C'est au-delà des ${qte(MAX)} ans des banques.`}`,
          "Ce n'est pas le calendrier réel du prêt : c'est une mesure de la dette, comptée en années de ce que l'activité rapporte.",
        ];
      },
    },
    {
      id: "independance",
      objectifs: [1],
      type: "montants",
      titre: "L'indépendance financière",
      notions: ["balance_sheet", "frng"],
      question: (c) => {
        const k = capaciteDeRemboursement(c);
        return `Les ressources durables ${dE(k.entreprise)} sont de ${eur(k.ressourcesDurables)}, dont ${eur(k.capitauxPropres)} de capitaux propres. Calculez l'indépendance financière, en pourcentage, au dixième.`;
      },
      champs: (c) => {
        const k = capaciteDeRemboursement(c);
        return [{ libelle: "Indépendance financière (%)", attendu: k.independance, calcul: `${eur(k.capitauxPropres)} ÷ ${eur(k.ressourcesDurables)} = ${pct(k.independance)}`, tolerance: 0.1 }];
      },
      explication: (c) => {
        const k = capaciteDeRemboursement(c);
        return [
          `Sur ${eur(100)} de ressources durables, les associés en apportent ${eur(auCentime(k.independance))}. ${k.independance >= MIN_PCT ? "L'entreprise doit moins à ses prêteurs qu'à ses associés : elle est indépendante." : "Les prêteurs financent plus que les associés : la banque demanderait d'abord un apport."}`,
        ];
      },
    },
    {
      id: "le-banquier",
      objectifs: [0, 1],
      type: "choix",
      titre: "Ce que dit la banque",
      notions: ["balance_sheet"],
      question: (c) => {
        const k = capaciteDeRemboursement(c);
        return `Capacité de remboursement : ${ans(k.capacite)}. Indépendance financière : ${pct(k.independance)}. Que répond la banque à ${k.entreprise} ?`;
      },
      options: (c) => {
        const k = capaciteDeRemboursement(c);
        const oui = k.capacite <= MAX && k.independance >= MIN_PCT;
        return [
          {
            texte: "Elle peut emprunter : les deux règles sont tenues",
            juste: oui,
            retour: oui
              ? `Oui : ${ans(k.capacite)}, bien sous ${qte(MAX)} ans, et ${pct(k.independance)} de capitaux propres, au-dessus de la moitié. ${k.entreprise} a de la marge pour s'endetter davantage : reste à savoir jusqu'où.`
              : "Non : l'une des deux règles n'est pas tenue.",
          },
          {
            texte: "Elle doit d'abord rembourser son emprunt",
            juste: !oui,
            retour: !oui
              ? "Oui : l'une des deux règles n'est pas tenue, la banque ne prêtera pas davantage."
              : `Non : sa dette pèse ${ans(k.capacite)} de capacité d'autofinancement. Rien n'oblige à la solder avant d'emprunter de nouveau.`,
          },
          {
            texte: "Elle peut emprunter, puisque sa trésorerie est positive",
            juste: false,
            retour: `Non : la trésorerie (${eur(k.tresorerie)}) dit ce qui reste au 31 décembre, pas ce que l'activité permet de rembourser chaque année. La banque regarde la capacité d'autofinancement.`,
          },
        ];
      },
    },
    {
      id: "jusqu-ou-emprunter",
      objectifs: [2],
      type: "curseur",
      titre: "Jusqu'où emprunter",
      notions: ["loan_schedule", "balance_sheet"],
      question: () => {
        return `Faites varier un emprunt nouveau. Une droite donne ce que ${qte(MAX)} années de capacité d'autofinancement remboursent, l'autre les dettes financières après l'emprunt. Placez le curseur sur l'emprunt le plus élevé que la capacité de remboursement accepte, puis validez.`;
      },
      grandeur: () => ({ libelle: "Emprunt nouveau", unite: "€" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: capaciteDeRemboursement(c).permisParLaCapacite, min: EMPRUNT_DU_CURSEUR.min, max: EMPRUNT_DU_CURSEUR.max }),
      zones: [`Sous les ${MAX} ans de la banque`, `Au-delà des ${MAX} ans`],
      rates: () => ({
        dessous: `À ce montant, la capacité de remboursement reste sous ${MAX} ans : l'emprunt pourrait être plus élevé.`,
        dessus: `À ce montant, il faudrait plus de ${MAX} années de capacité d'autofinancement : cherchez plus bas.`,
      }),
      montrer: "Montrer l'emprunt",
      lecture: (c, e) => {
        const k = capaciteDeRemboursement(c);
        const plafond = auCentime(MAX * k.caf);
        return [
          { libelle: "Dettes financières après l'emprunt", montant: auCentime(k.dettesFinancieres + e) },
          { libelle: `Ce que ${qte(MAX)} années de capacité d'autofinancement remboursent`, montant: plafond },
          { libelle: "Marge qui reste", montant: auCentime(plafond - k.dettesFinancieres - e), fort: true },
        ];
      },
      droites: (c) => {
        const k = capaciteDeRemboursement(c);
        return { produit: () => MAX * k.caf, cout: (e) => k.dettesFinancieres + e, libelles: [`${qte(MAX)} années de capacité d'autofinancement`, "Dettes financières"] };
      },
      explication: (c) => {
        const k = capaciteDeRemboursement(c);
        return [
          `Jusqu'à ${eur(k.permisParLaCapacite)} empruntés, ${k.entreprise} resterait sous ${qte(MAX)} ans : ${qte(MAX)} fois ${eur(k.caf)}, moins les ${eur(k.dettesFinancieres)} qu'elle doit déjà.`,
          `Mais l'autre règle arrive bien avant : un emprunt grossit les ressources durables sans rien ajouter aux capitaux propres. Au-delà de ${eur(k.permisParLIndependance)}, l'indépendance financière passerait sous ${pct(MIN_PCT)}. Le laboratoire suivant suit les deux à la fois.`,
        ];
      },
    },
    {
      id: "le-laboratoire-de-la-banque",
      objectifs: [2],
      type: "simulation",
      titre: "Le laboratoire de la banque",
      notions: ["loan_schedule", "income_statement", "balance_sheet"],
      question: () =>
        "La banque ne juge pas seulement la bonne année : elle regarde aussi l'année où l'emprunt se rembourse. Faites varier l'emprunt nouveau et la baisse des ventes de cette année-là. La capacité d'autofinancement se recalcule (moins d'enceintes vendues, des intérêts en plus, l'impôt), puis les deux ratios. Relevez le défi.",
      leviers: () => [
        { code: "emprunt", libelle: "Emprunt nouveau", unite: "€", ...LEVIERS_DE_LA_BANQUE.emprunt, depart: 0 },
        { code: "baisse", libelle: "Baisse des enceintes vendues l'année suivante", unite: "%", ...LEVIERS_DE_LA_BANQUE.baisse, depart: 0 },
      ],
      lecture: (c, p) => {
        const k = capaciteDeRemboursement(c);
        const x = banqueDuLaboratoire(k, p);
        return [
          { libelle: "Enceintes vendues", montant: x.quantite, unite: "enceintes", reference: k.quantite },
          { libelle: "Capacité d'autofinancement", montant: x.caf, reference: k.caf },
          { libelle: "Dettes financières", montant: x.dettesFinancieres, reference: k.dettesFinancieres },
          { libelle: "Capacité de remboursement", montant: auCentieme(x.capaciteDeRemboursement), unite: "années", reference: k.capacite, fort: true },
          { libelle: "Indépendance financière", montant: auDixieme(x.independance * 100), unite: "%", reference: k.independance, fort: true },
        ];
      },
      graphique: (c) => {
        const k = capaciteDeRemboursement(c);
        return {
          levier: "emprunt",
          unite: "années",
          courbes: [
            { libelle: "Capacité de remboursement", valeur: (p) => auCentieme(banqueDuLaboratoire(k, p).capaciteDeRemboursement) },
            { libelle: "La règle des banques", valeur: () => MAX },
          ],
        };
      },
      defi: (c) => {
        const k = capaciteDeRemboursement(c);
        return {
          consigne: `Empruntez au moins ${eur(EMPRUNT_DU_DEFI)}, et restez dans les deux règles des banques même si les ventes baissent de ${pct(BAISSE_DU_DEFI)}.`,
          atteint: (p) => p.emprunt! >= EMPRUNT_DU_DEFI && p.baisse! >= BAISSE_DU_DEFI && dansLesRegles(banqueDuLaboratoire(k, p)),
          indice: (p) => {
            const x = banqueDuLaboratoire(k, p);
            if (p.emprunt! < EMPRUNT_DU_DEFI) return `L'emprunt est de ${eur(p.emprunt!)} : le défi en demande au moins ${eur(EMPRUNT_DU_DEFI)}.`;
            if (p.baisse! < BAISSE_DU_DEFI) return `Les ventes baissent de ${pct(p.baisse!)} : le défi demande de tenir avec au moins ${pct(BAISSE_DU_DEFI)} de baisse.`;
            if (x.independance < INDEPENDANCE_MINIMALE) return `L'indépendance financière tombe à ${pct(auDixieme(x.independance * 100))} : l'emprunt est trop gros pour les capitaux propres.`;
            return `La capacité de remboursement passe à ${ans(auCentieme(x.capaciteDeRemboursement))} : avec moins de ventes et plus d'intérêts, l'emprunt est trop lourd.`;
          },
          solution: SOLUTION_DE_LA_BANQUE,
        };
      },
      explication: (c, p) => {
        const k = capaciteDeRemboursement(c);
        const x = banqueDuLaboratoire(k, p);
        return [
          `Défi relevé : avec ${eur(p.emprunt!)} empruntés et ${pct(p.baisse!)} de ventes en moins, la capacité d'autofinancement tombe de ${eur(k.caf)} à ${eur(x.caf)}. La capacité de remboursement passe à ${ans(auCentieme(x.capaciteDeRemboursement))}, l'indépendance à ${pct(auDixieme(x.independance * 100))}.`,
          `Une baisse des ventes ne touche pas l'indépendance, qui se lit au bilan ; elle frappe la capacité de remboursement, parce que chaque enceinte perdue emporte sa marge. Une dette raisonnable dans une bonne année peut devenir lourde dans une mauvaise : c'est l'année difficile que la banque teste.`,
        ];
      },
    },
    {
      id: "les-loyers-a-venir",
      objectifs: [3],
      type: "montants",
      titre: "Ce que le bilan ne montre pas",
      notions: ["balance_sheet"],
      question: (c) => {
        const k = capaciteDeRemboursement(c);
        return `${k.entreprise} loue son local ${eur(k.loyerDuMois)} par mois, et son bail court encore au moins un an. Ce loyer à venir n'est nulle part au bilan. Calculez les loyers d'une année, puis la capacité de remboursement si on les comptait avec les dettes financières, au centième.`;
      },
      champs: (c) => {
        const k = capaciteDeRemboursement(c);
        return [
          { libelle: "Loyers d'une année", attendu: k.loyers, calcul: `12 × ${eur(k.loyerDuMois)} = ${eur(k.loyers)}` },
          { libelle: "Capacité de remboursement, loyers compris (années)", attendu: k.capaciteAvecLesLoyers, calcul: `(${eur(k.dettesFinancieres)} + ${eur(k.loyers)}) ÷ ${eur(k.caf)} = ${qte(k.capaciteAvecLesLoyers)}`, tolerance: 0.01 },
        ];
      },
      explication: (c) => {
        const k = capaciteDeRemboursement(c);
        return [
          `Une seule année de loyer, ${eur(k.loyers)}, pèse plus que tout l'emprunt, ${eur(k.dettesFinancieres)}. C'est une obligation de payer, comme une échéance, mais le bilan ne la montre pas : la capacité de remboursement passerait de ${ans(k.capacite)} à ${ans(k.capaciteAvecLesLoyers)}.`,
          "Une entreprise qui loue ses locaux ou ses machines paraît moins endettée qu'une entreprise qui les achète à crédit. L'analyste lit donc aussi les engagements que l'annexe des comptes décrit.",
        ];
      },
    },
    {
      id: "la-photo-du-31-decembre",
      objectifs: [3],
      type: "choix",
      titre: "La photo d'un seul jour",
      notions: ["balance_sheet", "bfr"],
      question: (c) => {
        const k = capaciteDeRemboursement(c);
        return `Le bilan fonctionnel ${dE(k.entreprise)} est celui du 31 décembre, juste après Noël. Que faut-il en retenir avant de juger sa trésorerie ?`;
      },
      options: (c) => {
        const k = capaciteDeRemboursement(c);
        return [
          {
            texte: "Qu'un autre jour, les chiffres seraient différents",
            juste: true,
            retour: `Oui : le bilan est la photo d'un seul jour. Les clients, les stocks, les fournisseurs et donc la trésorerie (${eur(k.tresorerie)}) bougent d'un mois à l'autre. Il se lit avec le budget de trésorerie, et ses valeurs sont des prix d'achat, pas ce que les biens vaudraient aujourd'hui.`,
          },
          {
            texte: "Qu'il donne la trésorerie de toute l'année à venir",
            juste: false,
            retour: "Non : il dit ce que l'entreprise possède et doit à une date. Ce qui entrera et sortira ensuite est l'objet du budget de trésorerie.",
          },
          {
            texte: "Qu'il montre aussi si l'entreprise est rentable ou non",
            juste: false,
            retour: "Non : le bilan fonctionnel dit comment l'entreprise se finance, pas ce qu'elle gagne. La rentabilité se lit avec le compte de résultat.",
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["balance_sheet", "frng"],
      texte: (c) => {
        const k = capaciteDeRemboursement(c);
        return [
          `${k.entreprise} rembourserait son emprunt en ${ans(k.capacite)} de capacité d'autofinancement, et ses associés apportent ${pct(k.independance)} de ses ressources durables. Elle pourrait emprunter jusqu'à ${eur(k.permisParLIndependance)} sans sortir des deux règles des banques.`,
          "Ces deux ratios complètent le fonds de roulement, mais le bilan fonctionnel a ses limites. C'est la photo d'un seul jour, à des valeurs d'achat. Il ne dit ni la rentabilité, ni les engagements hors bilan comme les loyers à venir. Dans l'arène, les chiffres de votre entreprise seront différents : la méthode sera la même.",
        ];
      },
      repere: () => "Capacité de remboursement = dettes financières ÷ capacité d'autofinancement, 4 ans au plus. Indépendance financière = capitaux propres ÷ ressources durables, 50 % au moins.",
    },
  ],
};
