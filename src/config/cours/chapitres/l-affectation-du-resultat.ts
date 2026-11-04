import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import {
  DIVIDENDE_DEMANDE_PAR_ACTION,
  PLAFOND_DE_LA_RESERVE_LEGALE,
  RESERVES_FACULTATIVES_PROPOSEES,
  affecter,
  beneficeAAffecter,
  dividendeQuiGardeLaLigne,
} from "../monde/affectation-du-resultat";
import { auCentime } from "../monde/amortissement";
import { RESERVE_LEGALE } from "../monde/comptabilite-approfondie";
import { ENTREPRISES_DES_COMPTES_DU_LYCEE, exerciceDe } from "../monde/comptes-du-lycee";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : L'AFFECTATION DU RÉSULTAT (Bac STMG, gestion et finance, palier 1 ; programme 3.3,
 * « L'affectation du résultat, un choix qui engage l'avenir ? »).
 *
 * Le bénéfice du premier exercice de NOVA appartient à ses associés ; leur assemblée décide, dans
 * les six mois, ce qu'il devient. La loi prend d'abord sa part, la réserve légale ; le reste, le
 * bénéfice distribuable, se partage entre les dividendes (l'argent qui sort vers les associés), les
 * réserves facultatives (ce qui reste durablement dans l'entreprise) et le report à nouveau (ce que
 * l'on décidera l'an prochain). Le chapitre calcule la réserve légale et le bénéfice distribuable,
 * chiffre la demande d'un associé, prédit puis mesure ce qu'un dividende change (capitaux propres,
 * trésorerie, autofinancement), cherche au curseur le dividende le plus haut qui laisse de quoi
 * autofinancer la deuxième ligne, puis un laboratoire à deux leviers (le dividende par action et les
 * réserves facultatives) fait voir que seul le dividende fait sortir de l'argent.
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : le bénéfice, la capacité d'autofinancement et le bilan
 * du 31 décembre du premier exercice de NOVA (monde/comptes-du-lycee.ts), lus par
 * monde/affectation-du-resultat.ts, qui pose les règles et les hypothèses.
 */

/** Les bornes du curseur du dividende total, en euros. */
export const DIVIDENDE_DU_CURSEUR = { min: 0, max: 80_000 } as const;

/** Les leviers du laboratoire : le dividende par action (en euros) et les réserves facultatives. */
export const LEVIERS_DE_L_AFFECTATION = {
  dividende: { min: 0, max: 5, pas: 0.5 },
  reserves: { min: 0, max: 80_000, pas: 5_000 },
} as const;

/** Le défi du laboratoire : au moins ce dividende par action, et presque rien laissé en suspens. */
export const DIVIDENDE_MINIMAL_DU_DEFI = 2;
export const REPORT_MAXIMAL_DU_DEFI = 1_000;

/** La solution que montre la correction : la demande de l'associé, et les réserves que propose le gérant. */
export const SOLUTION_DE_L_AFFECTATION = { dividende: DIVIDENDE_DEMANDE_PAR_ACTION, reserves: RESERVES_FACULTATIVES_PROPOSEES } as const;

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 1 })} %`;
const qte = (n: number) => n.toLocaleString("fr-FR");
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Le bénéfice de l'entreprise du cas, et ce que la loi en fait d'abord. */
export function affectation(c: Pick<Cas, "code">) {
  return beneficeAAffecter(exerciceDe(c.code));
}

/** La demande de l'associé, chiffrée. */
export const demandeDeLAssocie = (c: Pick<Cas, "code">) =>
  affecter(affectation(c), { dividendeParAction: DIVIDENDE_DEMANDE_PAR_ACTION, reservesFacultatives: RESERVES_FACULTATIVES_PROPOSEES });

/** Une position du laboratoire : le dividende par action et les réserves facultatives. */
export const affectationDuLaboratoire = (c: Pick<Cas, "code">, p: Readonly<Record<string, number>>) =>
  affecter(affectation(c), { dividendeParAction: p.dividende!, reservesFacultatives: p.reserves! });

export const L_AFFECTATION_DU_RESULTAT: Chapitre = {
  code: "l-affectation-du-resultat",
  parcours: "stmg-gf",
  palier: 1,
  blocs: ["STMG Thème 3 · Accompagner la prise de décision"],
  titre: "L'affectation du résultat : réserves, dividendes, report à nouveau",
  accroche:
    "Le bénéfice appartient aux associés : le garder dans l'entreprise ou se le verser ? Ce que la loi impose, ce que l'assemblée décide, et ce que le choix engage pour l'avenir.",
  objectifs: [
    "Calculer la dotation à la réserve légale et le bénéfice distribuable",
    "Répartir le bénéfice entre dividendes, réserves facultatives et report à nouveau",
    "Mesurer ce qu'un dividende change aux capitaux propres, à la trésorerie et à l'autofinancement",
    "Choisir une affectation qui ménage l'avenir de l'entreprise",
  ],
  libre: false,
  prerequis: ["lire-le-bilan", "financer-l-entreprise"],
  entreprises: {
    codes: ENTREPRISES_DES_COMPTES_DU_LYCEE,
    pourquoi: "le bénéfice s'affecte ici sur le premier exercice de NOVA dans la simulation du cours, celui des chapitres « Le compte de résultat » et « Le bilan » ; la méthode vaut pour toute société.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "À qui est le bénéfice ?",
      notions: ["income_statement", "balance_sheet"],
      texte: (c) => {
        const k = affectation(c);
        return [
          `${k.entreprise} a gagné ${eur(k.benefice)} pendant son premier exercice. Au bilan du 31 décembre, ce bénéfice est encore dans les capitaux propres, à côté des ${eur(k.capital)} de capital apportés par les associés, en ${qte(k.actions)} actions : il leur appartient.`,
          "Dans les six mois qui suivent la clôture, l'assemblée des associés décide de son affectation. La loi prend d'abord sa part : la réserve légale, une épargne obligatoire qui protège les créanciers. Le reste, le bénéfice distribuable, peut aller en dividendes (versés aux associés), en réserves facultatives (gardées durablement dans l'entreprise) ou en report à nouveau (laissé en attente jusqu'à l'assemblée suivante).",
          "Le bénéfice n'est pas une somme d'argent posée à part : c'est ce que l'année a ajouté aux capitaux propres. Seul le dividende fait sortir de l'argent de l'entreprise.",
        ];
      },
      tableau: (c) => {
        const k = affectation(c);
        return {
          titre: `Les capitaux propres ${dE(k.entreprise)} au 31 décembre`,
          colonnes: ["Montant"],
          lignes: [
            { libelle: "Capital", valeurs: [eur(k.capital)] },
            { libelle: "Réserves des années passées", valeurs: [eur(0)] },
            { libelle: "Report à nouveau des années passées", valeurs: [eur(k.reportAnterieur)] },
            { libelle: "Résultat de l'exercice (bénéfice)", valeurs: [eur(k.benefice)] },
            { libelle: "Capitaux propres", valeurs: [eur(k.capitauxPropres)] },
          ],
        };
      },
      repere: () => "Bénéfice = réserve légale + dividendes + réserves facultatives + report à nouveau.",
    },
    {
      id: "la-reserve-legale",
      objectifs: [0],
      type: "montants",
      titre: "La réserve légale",
      notions: ["income_statement"],
      question: (c) => {
        const k = affectation(c);
        return `La loi impose de mettre ${pct(RESERVE_LEGALE)} du bénéfice en réserve légale, jusqu'à ce qu'elle atteigne ${pct(PLAFOND_DE_LA_RESERVE_LEGALE)} du capital. ${k.entreprise} n'a encore aucune réserve. Calculez le plafond de la réserve légale, la dotation de cette année, puis le bénéfice distribuable (le bénéfice moins la réserve légale, plus un éventuel report à nouveau des années passées, ici nul).`;
      },
      champs: (c) => {
        const k = affectation(c);
        return [
          { libelle: "Plafond de la réserve légale", attendu: k.plafond, calcul: `${eur(k.capital)} × ${pct(PLAFOND_DE_LA_RESERVE_LEGALE)} = ${eur(k.plafond)}` },
          { libelle: "Dotation à la réserve légale", attendu: k.reserveLegale, calcul: `${eur(k.benefice)} × ${pct(RESERVE_LEGALE)} = ${eur(k.reserveLegale)}` },
          { libelle: "Bénéfice distribuable", attendu: k.distribuable, calcul: `${eur(k.benefice)} − ${eur(k.reserveLegale)} + ${eur(k.reportAnterieur)} = ${eur(k.distribuable)}` },
        ];
      },
      explication: (c) => {
        const k = affectation(c);
        return [
          `La dotation, ${eur(k.reserveLegale)}, reste sous le plafond de ${eur(k.plafond)} : ${k.entreprise} continuera d'en doter une part chaque année bénéficiaire, jusqu'à l'atteindre. Les associés peuvent se partager au plus ${eur(k.distribuable)}.`,
        ];
      },
    },
    {
      id: "pourquoi-une-reserve-legale",
      objectifs: [0],
      type: "choix",
      titre: "Pourquoi une réserve obligatoire ?",
      notions: ["balance_sheet"],
      question: () => "Pourquoi la loi oblige-t-elle une société à garder une part de son bénéfice en réserve légale ?",
      options: () => [
        {
          texte: "Pour protéger ceux à qui elle doit de l'argent",
          juste: true,
          retour:
            "Oui : la réserve légale renforce les capitaux propres, que les associés ne peuvent pas se partager. Elle reste dans l'entreprise pour faire face à des pertes, ce qui rassure les fournisseurs, la banque et le personnel.",
        },
        {
          texte: "Pour payer l'impôt sur les bénéfices de l'année suivante",
          juste: false,
          retour: "Non : l'impôt de l'année est déjà payé ou dû, et il a été retranché avant le bénéfice net. La réserve légale n'est pas mise de côté pour l'État.",
        },
        {
          texte: "Pour garder de l'argent sur le compte en banque, sans y toucher",
          juste: false,
          retour: "Non : une réserve n'est pas un compte en banque. C'est une part des capitaux propres que les associés s'interdisent de se verser ; l'argent qui lui correspond peut très bien financer une machine ou un stock.",
        },
      ],
    },
    {
      id: "la-demande-de-l-associe",
      objectifs: [1],
      type: "montants",
      titre: "La demande d'un associé",
      notions: ["income_statement", "balance_sheet"],
      question: (c) => {
        const k = affectation(c);
        return `Un associé demande un dividende de ${eur(DIVIDENDE_DEMANDE_PAR_ACTION)} par action, pour les ${qte(k.actions)} actions. Le gérant propose de mettre ${eur(RESERVES_FACULTATIVES_PROPOSEES)} en réserves facultatives et de laisser le reste en report à nouveau. Calculez les dividendes, le report à nouveau, puis ce qui reste dans l'entreprise (tout le bénéfice, sauf les dividendes).`;
      },
      champs: (c) => {
        const k = affectation(c);
        const x = demandeDeLAssocie(c);
        return [
          { libelle: "Dividendes", attendu: x.dividendes, calcul: `${eur(DIVIDENDE_DEMANDE_PAR_ACTION)} × ${qte(k.actions)} = ${eur(x.dividendes)}` },
          { libelle: "Report à nouveau", attendu: x.reportANouveau, calcul: `${eur(k.distribuable)} − ${eur(x.dividendes)} − ${eur(RESERVES_FACULTATIVES_PROPOSEES)} = ${eur(x.reportANouveau)}` },
          { libelle: "Reste dans l'entreprise", attendu: x.garde, calcul: `${eur(k.reserveLegale)} + ${eur(RESERVES_FACULTATIVES_PROPOSEES)} + ${eur(x.reportANouveau)} = ${eur(x.garde)}` },
        ];
      },
      explication: (c) => {
        const k = affectation(c);
        const x = demandeDeLAssocie(c);
        return [
          `Sur ${eur(k.benefice)} de bénéfice, ${eur(x.dividendes)} iraient aux associés et ${eur(x.garde)} resteraient dans l'entreprise : la réserve légale, les réserves facultatives et un petit report à nouveau de ${eur(x.reportANouveau)}. La prochaine assemblée affectera ce report avec le bénéfice suivant.`,
        ];
      },
    },
    {
      id: "predire-le-dividende",
      objectifs: [2],
      type: "choix",
      titre: "Ce que le dividende fait bouger",
      notions: ["balance_sheet", "net_treasury"],
      question: (c) => {
        const x = demandeDeLAssocie(c);
        return `Si l'assemblée accepte, ${eur(x.dividendes)} seront versés aux associés. Au bilan, que se passe-t-il ?`;
      },
      options: (c) => {
        const x = demandeDeLAssocie(c);
        return [
          {
            texte: "Capitaux propres et trésorerie baissent d'autant",
            juste: true,
            retour: `Oui : l'argent sort de la banque vers les associés, et la part du bénéfice qui leur est versée quitte les capitaux propres. Les deux baissent de ${eur(x.dividendes)} ; le bilan reste équilibré.`,
          },
          {
            texte: "Le résultat de l'année baisse de ce montant, comme pour une charge",
            juste: false,
            retour: "Non : un dividende n'est pas une charge. Le résultat est déjà calculé ; le dividende en est une utilisation, décidée après la clôture.",
          },
          {
            texte: "Rien ne bouge : les réserves facultatives paient le dividende à leur place",
            juste: false,
            retour: "Non : une réserve n'est pas de l'argent mis de côté qui paierait quelque chose. Le dividende fait sortir de l'argent de la banque, quelle que soit la façon dont on range le reste du bénéfice.",
          },
        ];
      },
    },
    {
      id: "ce-que-le-dividende-engage",
      objectifs: [2],
      type: "montants",
      titre: "Ce que le dividende engage",
      notions: ["balance_sheet", "net_treasury", "frng"],
      question: (c) => {
        const k = affectation(c);
        return `Les capitaux propres sont de ${eur(k.capitauxPropres)}, la trésorerie de ${eur(k.tresorerie)}, et la capacité d'autofinancement de l'année de ${eur(k.caf)}. Calculez, après le dividende demandé : les capitaux propres, la trésorerie, puis l'autofinancement (la capacité d'autofinancement, moins les dividendes).`;
      },
      champs: (c) => {
        const k = affectation(c);
        const x = demandeDeLAssocie(c);
        return [
          { libelle: "Capitaux propres après", attendu: x.capitauxPropres, calcul: `${eur(k.capitauxPropres)} − ${eur(x.dividendes)} = ${eur(x.capitauxPropres)}` },
          { libelle: "Trésorerie après", attendu: x.tresorerie, calcul: `${eur(k.tresorerie)} − ${eur(x.dividendes)} = ${eur(x.tresorerie)}` },
          { libelle: "Autofinancement", attendu: x.autofinancement, calcul: `${eur(k.caf)} − ${eur(x.dividendes)} = ${eur(x.autofinancement)}` },
        ];
      },
      explication: (c) => {
        const k = affectation(c);
        const x = demandeDeLAssocie(c);
        return [
          `Il resterait ${eur(x.autofinancement)} pour investir, rembourser ou renforcer la trésorerie : ${x.manquePourLaLigne === 0 ? `assez pour la deuxième ligne de ${eur(k.deuxiemeLigne)}` : `pas assez pour la deuxième ligne de ${eur(k.deuxiemeLigne)}`}. Avec moins de capitaux propres, la banque prêterait aussi moins : ${eur(x.empruntPossible)} au plus, dans la règle des emprunts au plus égaux aux capitaux propres.`,
          "Chaque euro versé aujourd'hui est un euro que l'entreprise ne pourra pas investir demain. Mais des associés jamais payés peuvent refuser d'apporter de l'argent la prochaine fois : le choix se fait entre les deux.",
        ];
      },
    },
    {
      id: "jusqu-ou-distribuer",
      objectifs: [2, 3],
      type: "curseur",
      titre: "Jusqu'où distribuer",
      notions: ["frng"],
      question: (c) => {
        const k = affectation(c);
        return `${k.entreprise} veut autofinancer sa deuxième ligne, ${eur(k.deuxiemeLigne)}. Faites varier le dividende total : une droite donne l'autofinancement qui reste, l'autre le prix de la ligne. Placez le curseur sur le dividende le plus haut qui laisse de quoi payer la ligne, puis validez.`;
      },
      grandeur: () => ({ libelle: "Dividende total", unite: "€" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: dividendeQuiGardeLaLigne(affectation(c)), min: DIVIDENDE_DU_CURSEUR.min, max: DIVIDENDE_DU_CURSEUR.max }),
      zones: ["La ligne reste autofinancée", "Il faudrait emprunter"],
      rates: () => ({
        dessous: "À ce dividende, il reste plus que la ligne : les associés pourraient recevoir davantage.",
        dessus: "À ce dividende, l'autofinancement ne paie plus la ligne : cherchez plus bas.",
      }),
      montrer: "Montrer le dividende",
      lecture: (c, d) => {
        const k = affectation(c);
        return [
          { libelle: "Capacité d'autofinancement", montant: k.caf },
          { libelle: "Dividende total", montant: d },
          { libelle: "Autofinancement qui reste", montant: auCentime(k.caf - d), fort: true },
          { libelle: "Prix de la deuxième ligne", montant: k.deuxiemeLigne },
        ];
      },
      droites: (c) => {
        const k = affectation(c);
        return { produit: (d) => k.caf - d, cout: () => k.deuxiemeLigne, libelles: ["Autofinancement qui reste", "Prix de la deuxième ligne"] };
      },
      explication: (c) => {
        const k = affectation(c);
        const d = dividendeQuiGardeLaLigne(k);
        return [
          `Jusqu'à ${eur(d)} de dividendes, la ligne reste autofinancée ; la loi, elle, permettrait d'aller jusqu'à ${eur(k.distribuable)}. Ce que la loi autorise n'est pas ce que l'avenir de l'entreprise supporte.`,
          "Au-delà, il faudrait emprunter pour la ligne : des intérêts en plus, et une entreprise plus dépendante de sa banque.",
        ];
      },
    },
    {
      id: "le-laboratoire-de-l-affectation",
      objectifs: [1, 3],
      type: "simulation",
      titre: "Le laboratoire de l'affectation",
      notions: ["balance_sheet", "net_treasury", "frng"],
      question: (c) => {
        const k = affectation(c);
        return `Faites varier le dividende par action et les réserves facultatives ; la réserve légale, ${eur(k.reserveLegale)}, est prise d'abord, et le report à nouveau reçoit ce qui reste du bénéfice distribuable. Regardez ce qui bouge quand vous changez les réserves, et ce qui bouge quand vous changez le dividende. Relevez le défi.`;
      },
      leviers: () => [
        { code: "dividende", libelle: "Dividende par action", unite: "€", ...LEVIERS_DE_L_AFFECTATION.dividende, depart: 0 },
        { code: "reserves", libelle: "Réserves facultatives", unite: "€", ...LEVIERS_DE_L_AFFECTATION.reserves, depart: 0 },
      ],
      lecture: (c, p) => {
        const k = affectation(c);
        const x = affectationDuLaboratoire(c, p);
        return [
          { libelle: "Dividendes", montant: x.dividendes },
          { libelle: "Réserve légale", montant: x.reserveLegale },
          { libelle: "Réserves facultatives", montant: x.reservesFacultatives },
          { libelle: "Report à nouveau", montant: x.reportANouveau, fort: true },
          { libelle: "Capitaux propres après", montant: x.capitauxPropres, reference: k.capitauxPropres },
          { libelle: "Trésorerie après", montant: x.tresorerie, reference: k.tresorerie },
          { libelle: "Autofinancement", montant: x.autofinancement, reference: k.caf },
          { libelle: "Ce que la banque prêterait encore", montant: x.empruntPossible },
        ];
      },
      defi: (c) => {
        const reussi = (p: Readonly<Record<string, number>>) => {
          const x = affectationDuLaboratoire(c, p);
          return x.possible && x.dividendeParAction >= DIVIDENDE_MINIMAL_DU_DEFI && x.manquePourLaLigne === 0 && x.reportANouveau <= REPORT_MAXIMAL_DU_DEFI;
        };
        return {
          consigne: `Versez au moins ${eur(DIVIDENDE_MINIMAL_DU_DEFI)} par action, gardez de quoi autofinancer la deuxième ligne, et ne laissez pas plus de ${eur(REPORT_MAXIMAL_DU_DEFI)} en report à nouveau.`,
          atteint: reussi,
          indice: (p) => {
            const k = affectation(c);
            const x = affectationDuLaboratoire(c, p);
            if (!x.possible) return `Dividendes et réserves facultatives dépassent le bénéfice distribuable, ${eur(k.distribuable)} : l'assemblée ne peut pas répartir plus que ce qu'elle a.`;
            if (x.dividendeParAction < DIVIDENDE_MINIMAL_DU_DEFI) return `Le dividende est de ${eur(x.dividendeParAction)} par action : le défi en demande au moins ${eur(DIVIDENDE_MINIMAL_DU_DEFI)}.`;
            if (x.manquePourLaLigne > 0) return `Il manquerait ${eur(x.manquePourLaLigne)} d'autofinancement pour la deuxième ligne : le dividende est trop haut.`;
            return `Le report à nouveau garde ${eur(x.reportANouveau)} en attente : décidez de leur sort, en réserves facultatives.`;
          },
          solution: SOLUTION_DE_L_AFFECTATION,
        };
      },
      explication: (c, p) => {
        const x = affectationDuLaboratoire(c, p);
        return [
          `Défi relevé : ${eur(x.dividendes)} versés aux associés, ${eur(x.reservesFacultatives)} en réserves facultatives et ${eur(x.reportANouveau)} en report à nouveau. Il reste ${eur(x.autofinancement)} d'autofinancement pour la ligne.`,
          "Changer les réserves facultatives ne déplace que des noms à l'intérieur des capitaux propres : ni eux, ni la trésorerie ne bougent. Seul le dividende fait sortir de l'argent, et c'est lui qui engage l'avenir : moins d'autofinancement, moins de capitaux propres, moins de crédit possible.",
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["balance_sheet"],
      texte: (c) => {
        const k = affectation(c);
        return [
          `Sur les ${eur(k.benefice)} de bénéfice ${dE(k.entreprise)}, la loi met ${eur(k.reserveLegale)} en réserve légale. Les associés peuvent se partager au plus ${eur(k.distribuable)}, mais au-delà de ${eur(dividendeQuiGardeLaLigne(k))} de dividendes, la deuxième ligne ne serait plus autofinancée.`,
          "Affecter le résultat, c'est choisir entre récompenser les associés aujourd'hui et donner à l'entreprise les moyens de grandir demain. Les réserves et le report à nouveau restent dans les capitaux propres ; le dividende en sort, avec l'argent. Dans l'arène, les chiffres de votre entreprise seront différents : la méthode sera la même.",
        ];
      },
      repere: () => "Bénéfice distribuable = bénéfice − réserve légale + report à nouveau antérieur. Autofinancement = capacité d'autofinancement − dividendes.",
    },
  ],
};
