import { montantEcrit as eur } from "../../../pedagogy/cours/correcteur";
import { auCentime } from "../../../pedagogy/cours/etats";
import { anneeJouee, type Cas } from "../cas";
import type { Chapitre, TableauDeDonnees } from "../types";
import { cloture } from "./la-cloture";

/**
 * CHAPITRE : SOLDES INTERMÉDIAIRES DE GESTION ET CAF (comptabilité générale, palier 4).
 *
 * Le compte de résultat de l'année de l'arène, celui de « La clôture » (ses grandes masses
 * redonnent le résultat de l'arène à l'euro près), lu solde par solde : la marge
 * commerciale là où l'entreprise revend des marchandises, la production là où elle
 * fabrique ou sert, la valeur ajoutée, l'excédent brut d'exploitation, le résultat
 * d'exploitation, le résultat courant avant impôt, le résultat net. Puis la capacité
 * d'autofinancement, par ses deux chemins, et ce qui la sépare de la trésorerie de l'arène.
 *
 * Aucune hypothèse : tout est dans l'année jouée. L'arène ne connaît ni impôts et taxes, ni
 * subventions, ni opérations exceptionnelles : ces lignes valent zéro, et le chapitre le dit.
 */

/** Les soldes de l'année, du chiffre d'affaires au résultat net, et la CAF. */
export function soldesDeGestion(c: Cas) {
  const k = cloture(c);
  const marchandises = k.stock?.nature === "marchandises" || c.achat.compte.startsWith("607");
  // Le stock qui a baissé dans l'année s'ajoute aux achats (marchandises) ou se retranche de
  // la production (en-cours) : la variation de « La clôture » est le stock final moins l'initial.
  const coutDesVendues = marchandises ? auCentime(k.achats - k.variation) : 0;
  const margeCommerciale = marchandises ? auCentime(k.ventes - coutDesVendues) : 0;
  const production = marchandises ? 0 : auCentime(k.ventes + k.variation);
  const consommations = auCentime((marchandises ? 0 : k.achats) + k.autres + k.commissions + k.publicite + k.entretien + k.loyerEtFrais);
  const valeurAjoutee = auCentime(margeCommerciale + production - consommations);
  const ebe = auCentime(valeurAjoutee - k.personnel);
  const resultatExploitation = auCentime(ebe - k.dotation);
  const rcai = auCentime(resultatExploitation - k.interets);
  const resultatNet = auCentime(rcai - k.impot);
  const cafAdditive = auCentime(resultatNet + k.dotation);
  const cafSoustractive = auCentime(ebe - k.interets - k.impot);
  const { partie } = anneeJouee(c.code);
  const r = partie.rounds;
  const tresorerie = {
    debut: auCentime(r[0]!.results["joueur"]!.cashFlow.opening),
    fin: auCentime(r[r.length - 1]!.results["joueur"]!.cashFlow.closing),
  };
  return {
    ...k,
    marchandises,
    coutDesVendues,
    margeCommerciale,
    production,
    consommations,
    valeurAjoutee,
    ebe,
    resultatExploitation,
    rcai,
    resultatNet,
    cafAdditive,
    cafSoustractive,
    tresorerie: { ...tresorerie, variation: auCentime(tresorerie.fin - tresorerie.debut) },
    ebeDeLArene: auCentime(r.reduce((t, x) => t + x.results["joueur"]!.incomeStatement.ebitda, 0)),
  };
}

const ligne = (libelle: string, x: number) => ({ libelle, valeurs: [eur(x)] });

/** Le compte de résultat de l'année, en grandes masses : ce que l'élève a sous les yeux. */
function compteDeLAnnee(c: Cas): TableauDeDonnees {
  const s = soldesDeGestion(c);
  const lignes = [ligne(s.marchandises ? "Ventes de marchandises" : "Ventes (production vendue)", s.ventes)];
  if (s.stock && s.variation !== 0) {
    lignes.push(ligne(s.marchandises ? "Variation du stock de marchandises (final − initial)" : "Production stockée (en-cours final − initial)", s.variation));
  }
  lignes.push(
    ligne(s.marchandises ? "Achats de marchandises" : "Achats", s.achats),
    ligne(`Autres coûts variables et qualité`, s.autres),
  );
  if (s.commissions > 0) lignes.push(ligne("Commissions", s.commissions));
  lignes.push(
    ligne("Publicité", s.publicite),
    ligne("Entretien", s.entretien),
    ligne("Loyer et frais de structure", s.loyerEtFrais),
    ligne("Personnel", s.personnel),
    ligne("Dotation aux amortissements", s.dotation),
    ligne("Intérêts", s.interets),
    ligne("Impôt sur les sociétés", s.impot),
  );
  return { titre: `L'année de ${c.entreprise} dans l'arène`, colonnes: ["Montant"], lignes };
}

export const SOLDES_INTERMEDIAIRES: Chapitre = {
  code: "soldes-intermediaires-de-gestion",
  parcours: "comptabilite-generale",
  palier: 4,
  blocs: [
    "BTS CG P6 · Analyse de la situation financière",
    "DCG UE6 · Finance d'entreprise",
    "BUT GACO · Participer au pilotage interne de l'organisation",
    "BUT GEA · Évaluer l'activité de l'organisation",
  ],
  titre: "Soldes intermédiaires de gestion et CAF",
  accroche:
    "Le résultat dit combien l'année a laissé ; les soldes disent où elle l'a gagné ou perdu. Puis la capacité d'autofinancement : ce que l'activité a produit pour l'entreprise, et pourquoi ce n'est pas sa trésorerie.",
  objectifs: [
    "Calculer la marge commerciale ou la production de l'exercice",
    "Calculer la valeur ajoutée et l'excédent brut d'exploitation",
    "Descendre du résultat d'exploitation au résultat net",
    "Calculer la capacité d'autofinancement par ses deux méthodes",
    "Expliquer pourquoi la capacité d'autofinancement n'est pas la variation de trésorerie",
  ],
  libre: false,
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Où l'année a gagné, où elle a perdu",
      notions: ["income_statement"],
      tableau: compteDeLAnnee,
      texte: (c) => {
        const s = soldesDeGestion(c);
        return [
          `Voici l'année de ${c.entreprise} dans l'arène, en grandes masses : celle que vous avez clôturée au palier précédent. Elle se termine sur un résultat net de ${eur(s.resultatNet)}.`,
          "Un seul chiffre ne dit pas d'où il vient. Les soldes intermédiaires de gestion découpent le compte de résultat en étages : ce que l'activité a créé, ce qu'en ont pris le personnel, l'usure de l'équipement, les prêteurs, l'État. Chaque étage répond à une question.",
          "Tout vient de l'arène. Elle ne connaît ni impôts et taxes, ni subventions d'exploitation, ni opérations exceptionnelles : ces lignes valent zéro ici.",
        ];
      },
      repere: () =>
        "Marge commerciale et production, valeur ajoutée, excédent brut d'exploitation, résultat d'exploitation, résultat courant avant impôt, résultat net : chaque solde se calcule à partir du précédent.",
    },
    {
      id: "marge-commerciale",
      type: "montants",
      titre: "La marge commerciale",
      notions: ["markup_coefficient", "income_statement"],
      si: (c) => soldesDeGestion(c).marchandises,
      tableau: compteDeLAnnee,
      question: (c) =>
        `${c.entreprise} revend des marchandises. Calculez le coût d'achat des marchandises vendues (les achats, plus le stock qui a été consommé), puis la marge commerciale.`,
      champs: (c) => {
        const s = soldesDeGestion(c);
        return [
          {
            libelle: "Coût d'achat des marchandises vendues",
            attendu: s.coutDesVendues,
            calcul: `${eur(s.achats)} d'achats + ${eur(s.stock?.initial ?? 0)} de stock au 1er janvier − ${eur(s.stock?.final ?? 0)} de stock au 31 décembre = ${eur(s.coutDesVendues)}`,
          },
          { libelle: "Marge commerciale", attendu: s.margeCommerciale, calcul: `${eur(s.ventes)} − ${eur(s.coutDesVendues)} = ${eur(s.margeCommerciale)}` },
        ];
      },
      explication: (c) => {
        const s = soldesDeGestion(c);
        return [
          `Le stock du 1er janvier a été vendu dans l'année : il entre dans le coût des marchandises vendues comme s'il avait été acheté. La marge commerciale représente ${Math.round((s.margeCommerciale / s.ventes) * 100)} % des ventes.`,
        ];
      },
    },
    {
      id: "production",
      type: "montants",
      titre: "La production de l'exercice",
      notions: ["income_statement"],
      si: (c) => !soldesDeGestion(c).marchandises,
      tableau: compteDeLAnnee,
      question: (c) => {
        const s = soldesDeGestion(c);
        return s.variation !== 0
          ? `${c.entreprise} produit ce qu'elle vend. Sa production de l'année, c'est ce qu'elle a vendu, plus ce qu'elle a produit sans le vendre encore (ou moins ce qu'elle a vendu d'une production antérieure) : la variation des en-cours. Calculez-la.`
          : `${c.entreprise} produit ce qu'elle vend, et n'a rien en stock ni au début ni à la fin. Quelle est sa production de l'année ?`;
      },
      champs: (c) => {
        const s = soldesDeGestion(c);
        return [
          {
            libelle: "Production de l'exercice",
            attendu: s.production,
            calcul:
              s.variation !== 0
                ? `${eur(s.ventes)} vendus + ${eur(s.stock?.final ?? 0)} d'en-cours au 31 décembre − ${eur(s.stock?.initial ?? 0)} d'en-cours au 1er janvier = ${eur(s.production)}`
                : `la production vendue : ${eur(s.production)}`,
          },
        ];
      },
      explication: (c) => [
        `Une entreprise qui fabrique ou sert n'a pas de marge commerciale : ${c.entreprise} ne revend rien en l'état. La production prend sa place dans le calcul de la valeur ajoutée.`,
      ],
    },
    {
      id: "valeur-ajoutee",
      type: "montants",
      titre: "La valeur ajoutée",
      notions: ["income_statement"],
      tableau: compteDeLAnnee,
      question: (c) => {
        const s = soldesDeGestion(c);
        return `La valeur ajoutée, c'est ce que ${c.entreprise} a créé en plus de ce qu'elle a acheté à d'autres entreprises. Calculez d'abord les consommations en provenance des tiers (${s.marchandises ? "" : "les achats, "}les autres coûts variables et la qualité${s.commissions > 0 ? ", les commissions" : ""}, la publicité, l'entretien, le loyer et les frais de structure), puis la valeur ajoutée.`;
      },
      champs: (c) => {
        const s = soldesDeGestion(c);
        const depart = s.marchandises ? s.margeCommerciale : s.production;
        return [
          { libelle: "Consommations en provenance des tiers", attendu: s.consommations, calcul: `la somme de ces charges : ${eur(s.consommations)}` },
          {
            libelle: "Valeur ajoutée",
            attendu: s.valeurAjoutee,
            calcul: `${eur(depart)} de ${s.marchandises ? "marge commerciale" : "production"} − ${eur(s.consommations)} = ${eur(s.valeurAjoutee)}`,
          },
        ];
      },
      explication: (c) => {
        const s = soldesDeGestion(c);
        return [
          s.marchandises
            ? "Les achats de marchandises n'y figurent pas : ils sont déjà dans la marge commerciale."
            : "Les achats y figurent : une entreprise qui produit consomme ce qu'elle achète.",
          `La valeur ajoutée, ${eur(s.valeurAjoutee)}, est la richesse que ${c.entreprise} a créée dans l'année. Elle va se partager : le personnel, l'équipement qui s'use, les prêteurs, l'État, et ce qui reste aux associés.`,
        ];
      },
    },
    {
      id: "ebe",
      type: "montants",
      titre: "L'excédent brut d'exploitation",
      notions: ["ebitda_margin"],
      question: (c) => {
        const s = soldesDeGestion(c);
        return `Le personnel a coûté ${eur(s.personnel)} dans l'année. Quel est l'excédent brut d'exploitation ?`;
      },
      champs: (c) => {
        const s = soldesDeGestion(c);
        return [{ libelle: "Excédent brut d'exploitation", attendu: s.ebe, calcul: `${eur(s.valeurAjoutee)} − ${eur(s.personnel)} = ${eur(s.ebe)}` }];
      },
      explication: (c) => {
        const s = soldesDeGestion(c);
        return [
          s.ebe >= 0
            ? `L'activité de ${c.entreprise}, une fois payés ses fournisseurs et son personnel, dégage ${eur(s.ebe)}. C'est le solde que l'arène affiche sous le nom d'EBE : sur l'année, elle en compte ${eur(s.ebeDeLArene)}.`
            : `L'activité de ${c.entreprise} ne paie même pas ses fournisseurs et son personnel : ${eur(s.ebe)}. L'arène affiche le même solde, sous le nom d'EBE : ${eur(s.ebeDeLArene)} sur l'année.`,
        ];
      },
    },
    {
      id: "ce-que-dit-l-ebe",
      type: "choix",
      titre: "Ce que mesure l'EBE",
      notions: ["ebitda_margin"],
      question: () => "Pourquoi l'analyste regarde-t-il l'excédent brut d'exploitation avant le résultat, pour juger l'activité d'une entreprise ?",
      options: () => [
        {
          texte: "Parce qu'il ne dépend ni de la façon dont l'entreprise est financée, ni de sa politique d'amortissement : il mesure l'activité seule.",
          juste: true,
          retour:
            "C'est cela. Les intérêts dépendent de la dette choisie, les dotations du plan d'amortissement. L'EBE se calcule avant les deux : deux entreprises au même métier se comparent par leur EBE, quelle que soit leur dette.",
        },
        {
          texte: "Parce qu'il est toujours plus élevé que le résultat, et présente mieux.",
          juste: false,
          retour: "Il est souvent plus élevé, mais ce n'est pas sa raison d'être. Il isole l'activité de ses choix de financement et d'amortissement.",
        },
        {
          texte: "Parce que c'est la trésorerie que l'entreprise a gagnée dans l'année.",
          juste: false,
          retour: "Pas tout à fait : l'EBE compte les ventes facturées, pas encaissées. Les délais des clients et des fournisseurs l'éloignent de la trésorerie, on le verra avec la CAF.",
        },
      ],
    },
    {
      id: "jusqu-au-resultat",
      type: "montants",
      titre: "Du résultat d'exploitation au résultat net",
      notions: ["income_statement"],
      tableau: compteDeLAnnee,
      question: () =>
        "Descendez les derniers étages : le résultat d'exploitation (après l'usure de l'équipement), le résultat courant avant impôt (après les intérêts), le résultat net (après l'impôt sur les sociétés).",
      champs: (c) => {
        const s = soldesDeGestion(c);
        return [
          { libelle: "Résultat d'exploitation", attendu: s.resultatExploitation, calcul: `${eur(s.ebe)} − ${eur(s.dotation)} de dotation = ${eur(s.resultatExploitation)}` },
          { libelle: "Résultat courant avant impôt", attendu: s.rcai, calcul: `${eur(s.resultatExploitation)} − ${eur(s.interets)} d'intérêts = ${eur(s.rcai)}` },
          { libelle: "Résultat net", attendu: s.resultatNet, calcul: `${eur(s.rcai)} − ${eur(s.impot)} d'impôt = ${eur(s.resultatNet)}` },
        ];
      },
      explication: (c) => {
        const s = soldesDeGestion(c);
        return [
          `Sans opération exceptionnelle, le résultat courant avant impôt est le résultat avant impôt de « La clôture », ${eur(s.resultatAvantImpot)}. Le résultat net est celui de la clôture.`,
        ];
      },
    },
    {
      id: "caf",
      type: "montants",
      titre: "La capacité d'autofinancement",
      notions: ["income_statement", "net_treasury"],
      question: () =>
        "La capacité d'autofinancement est ce que l'activité de l'année laisse à l'entreprise pour investir, rembourser ou distribuer. Elle se calcule de deux façons : en partant du résultat net et en lui rajoutant les charges qui ne se paient pas (méthode additive), ou en partant de l'EBE et en retirant ce qui se paie (méthode soustractive). Calculez-la des deux façons.",
      champs: (c) => {
        const s = soldesDeGestion(c);
        return [
          { libelle: "CAF, méthode additive", attendu: s.cafAdditive, calcul: `${eur(s.resultatNet)} de résultat net + ${eur(s.dotation)} de dotation = ${eur(s.cafAdditive)}` },
          {
            libelle: "CAF, méthode soustractive",
            attendu: s.cafSoustractive,
            calcul: `${eur(s.ebe)} d'EBE − ${eur(s.interets)} d'intérêts − ${eur(s.impot)} d'impôt = ${eur(s.cafSoustractive)}`,
          },
        ];
      },
      explication: (c) => {
        const s = soldesDeGestion(c);
        return [
          "Les deux chemins arrivent au même chiffre : la dotation est la seule charge de l'année qui ne se paie pas, et c'est elle que la méthode additive rajoute.",
          s.resultatNet < 0 && s.cafAdditive > 0
            ? `${c.entreprise} perd de l'argent sur l'année, et pourtant sa CAF est positive : la perte vient de l'usure de l'équipement, payé avant l'année. L'activité, elle, laisse encore ${eur(s.cafAdditive)}.`
            : s.cafAdditive < 0
              ? `La CAF est négative : l'activité de l'année consomme de l'argent au lieu d'en produire. ${c.entreprise} devra puiser dans sa trésorerie ou emprunter pour tenir.`
              : `${c.entreprise} peut financer ${eur(s.cafAdditive)} d'investissements ou de remboursements avec ce que son activité a dégagé, sans emprunter.`,
        ];
      },
    },
    {
      id: "caf-et-tresorerie",
      type: "choix",
      titre: "La CAF et la trésorerie",
      notions: ["net_treasury", "bfr"],
      question: (c) => {
        const s = soldesDeGestion(c);
        return `Sur l'année, la CAF de ${c.entreprise} est de ${eur(s.cafAdditive)}. Dans l'arène, sa trésorerie est passée de ${eur(s.tresorerie.debut)} à ${eur(s.tresorerie.fin)} : ${s.tresorerie.variation >= 0 ? "+" : "−"} ${eur(Math.abs(s.tresorerie.variation))}. Pourquoi les deux chiffres diffèrent-ils ?`;
      },
      options: () => [
        {
          texte:
            "Parce que la CAF compte ce qui est facturé, pas ce qui est encaissé, et qu'elle ne compte ni les remboursements d'emprunt ni les investissements : le besoin en fonds de roulement, l'emprunt et les équipements font la différence.",
          juste: true,
          retour:
            "C'est cela. La CAF est une capacité : ce que l'activité permet de financer. La trésorerie, ce qui reste une fois payés les écarts de délais (clients, fournisseurs, stocks), les échéances d'emprunt et les investissements. Le bilan fonctionnel, au chapitre suivant, met ces flux en face.",
        },
        {
          texte: "Parce que l'arène calcule mal la trésorerie.",
          juste: false,
          retour: "L'arène suit chaque encaissement et chaque décaissement. Les deux chiffres ne mesurent simplement pas la même chose.",
        },
        {
          texte: "Parce que la CAF comprend la dotation aux amortissements, qui sort de la banque.",
          juste: false,
          retour: "C'est l'inverse : la dotation ne sort pas de la banque, c'est pour cela que la CAF la rajoute au résultat.",
        },
      ],
    },
    {
      id: "fin",
      type: "lecture",
      titre: "Ce que vous savez faire",
      notions: ["income_statement"],
      texte: (c) => {
        const s = soldesDeGestion(c);
        return [
          `Vous avez lu l'année de ${c.entreprise} étage par étage : ${eur(s.valeurAjoutee)} de valeur ajoutée, ${eur(s.ebe)} d'excédent brut d'exploitation, ${eur(s.resultatNet)} de résultat net, et ${eur(s.cafAdditive)} de capacité d'autofinancement.`,
          "Ces soldes se comparent d'une année à l'autre et d'une entreprise à l'autre : rapportés au chiffre d'affaires, ils disent où se fait l'écart. Rejouez l'arène avec d'autres décisions, et regardez quel étage bouge.",
        ];
      },
      repere: () =>
        "Valeur ajoutée = ce que l'entreprise crée ; EBE = ce que l'activité dégage ; résultat net = ce qui reste aux associés ; CAF = résultat net + dotations, ou EBE − intérêts − impôt.",
    },
  ],
};
