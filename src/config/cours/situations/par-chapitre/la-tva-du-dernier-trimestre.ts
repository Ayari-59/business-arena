import type { Cas } from "../../cas";
import { ENTREPRISES_DE_LA_TVA, POURQUOI_LA_TVA, calculDeLEncaisse, eur, ficheDe, jours, pct } from "../../chapitres/la-declaration-de-tva";
import { declarationDuTrimestre, versementSuivant } from "../../monde/delais";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LA DÉCLARATION DE TVA » : LA TVA DU DERNIER TRIMESTRE (fiscalité,
 * palier 3).
 *
 * L'expert-comptable de MARTEL & FILS prépare la déclaration du quatrième trimestre. La gérante veut
 * savoir si le prochain versement à l'État, au premier trimestre de N + 1, sera plus lourd ou plus
 * léger que celui qu'elle vient de faire au quatrième (la TVA de l'été, crédit du printemps imputé) ;
 * et elle ne comprend pas pourquoi ce dernier versement était si faible. L'élève calcule les
 * encaissements du trimestre (la TVA de travaux se collecte à l'encaissement), sa déclaration,
 * remonte à rebours du versement de l'automne au crédit qui l'a allégé et à l'investissement qui l'a
 * fait naître, puis croise les deux régimes : avec l'option pour les débits, le verdict s'inverse.
 * Un curseur sur les encaissements du trimestre montre avant la comparaison où le verdict bascule.
 *
 * Le jugement : la réponse juste se lit au régime réel de l'entreprise (les encaissements), alors que
 * le distracteur le plus solide (« plus lourd ») est juste avec l'option. Les deux autres sont les
 * erreurs classiques : collecter sur le facturé, ou croire le crédit encore disponible.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours (src/config/cours/monde) : ses
 * chiffres sont ceux de `versementSuivant` et `declarationDuTrimestre` sur la fiche de MARTEL & FILS.
 *
 * CE QUI A DISPARU, AVEC L'ARÈNE : le quatrième trimestre de l'année jouée, sa « TVA décaissée » du
 * budget de trésorerie, et le verdict « plus lourd » que l'arène donnait partout (calculé sur les
 * ventes facturées) ; le transport.
 */

/** Les bornes du curseur des encaissements du quatrième trimestre, en milliers d'euros hors taxes. */
export const ENCAISSEMENTS_DU_CURSEUR = { min: 300, max: 500 } as const;

/** Le trimestre déclaré : le quatrième, dont la TVA reste due au bilan du 31 décembre. */
export const TRIMESTRE_DU_CAS = 4;

const auCentime = (x: number) => Math.round(x * 100) / 100;

export type Verdict = "plus-lourd" | "plus-leger" | "egal";

/** Le quatrième trimestre déclaré, et ce qu'il change au versement suivant, aux deux régimes. */
export function tvaDuDernierTrimestre(c: Pick<Cas, "code">) {
  const f = ficheDe(c);
  const t = f.tauxDeTva;
  const enc = versementSuivant(f, TRIMESTRE_DU_CAS);
  const deb = versementSuivant(f, TRIMESTRE_DU_CAS, { regime: "debits" });
  const printemps = declarationDuTrimestre(f, TRIMESTRE_DU_CAS - 2);
  const ete = enc.avant;
  // Le curseur : à partir de quels encaissements (en milliers d'euros) le prochain versement égale le dernier.
  const versementAuxEncaissements = (milliers: number) => auCentime(milliers * 1_000 * t - enc.ici.deductible);
  const encaissementsQuiEgalent = Math.ceil((enc.avant.aPayer + enc.ici.deductible) / t / 1_000 - 1e-9);
  // Le rebours : du versement de l'automne au crédit, puis à l'investissement qui l'a fait naître.
  const creditImpute = auCentime(ete.nette - ete.aPayer);
  const deductibleDuPrintemps = auCentime(printemps.collectee + creditImpute);
  const investissementARebours = auCentime(deductibleDuPrintemps / t - printemps.achatsHT);
  return {
    f,
    t,
    enc,
    deb,
    verdict: enc.verdict as Verdict,
    verdictAuxDebits: deb.verdict as Verdict,
    encaisse: calculDeLEncaisse(f, TRIMESTRE_DU_CAS),
    printemps,
    ete,
    creditImpute,
    deductibleDuPrintemps,
    investissementARebours,
    versementAuxEncaissements,
    encaissementsQuiEgalent,
  };
}

export type TvaDuDernierTrimestre = ReturnType<typeof tvaDuDernierTrimestre>;

export const LA_TVA_DU_DERNIER_TRIMESTRE: Situation = {
  code: "la-tva-du-dernier-trimestre",
  parcours: "fiscalite",
  palier: 3,
  blocs: [],
  reprend: ["la-declaration-de-tva"],
  commanditaire: "L'expert-comptable",
  titre: "La TVA du dernier trimestre",
  accroche:
    "La déclaration du quatrième trimestre de MARTEL & FILS, à préparer pour l'expert-comptable : ce qui restera dû à l'État au 31 décembre, si ce sera plus ou moins que le dernier versement, et ce que l'option pour les débits y changerait.",
  objectifs: [
    "Calculer les encaissements, la TVA collectée, déductible et à payer d'un trimestre de travaux",
    "Remonter d'un versement de TVA au crédit imputé et à l'investissement qui l'a fait naître",
    "Comparer deux versements successifs aux deux régimes d'exigibilité",
    "Répondre à l'expert-comptable au régime réel de l'entreprise, chiffres à l'appui",
  ],
  libre: false,
  entreprises: { codes: ENTREPRISES_DE_LA_TVA, pourquoi: POURQUOI_LA_TVA },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La déclaration de fin d'année",
      tableau: (c) => {
        const k = tvaDuDernierTrimestre(c);
        const v = (rang: number) => k.f.clienteles.map((g) => g.ventesHT[rang + 1]!);
        const [p, e, a] = [v(2), v(3), v(4)];
        return {
          titre: `Les trois derniers trimestres de ${k.f.entreprise}`,
          colonnes: ["Délai de paiement", "2e trimestre", "3e trimestre", "4e trimestre"],
          lignes: [
            ...k.f.clienteles.map((g, i) => ({ libelle: `${g.nom} : travaux facturés (HT)`, valeurs: [jours(g.delai), eur(p[i]!), eur(e[i]!), eur(a[i]!)] })),
            { libelle: "Matériaux livrés par le négoce (HT)", valeurs: [jours(k.f.fournisseur.delai), eur(k.printemps.achatsHT), eur(k.ete.achatsHT), eur(k.enc.ici.achatsHT)] },
            { libelle: "TVA collectée", valeurs: ["", eur(k.printemps.collectee), eur(k.ete.collectee), "à calculer"] },
            { libelle: "TVA déductible", valeurs: ["", "à retrouver", eur(k.ete.deductible), "à calculer"] },
            { libelle: "TVA versée à l'État pendant le trimestre", valeurs: ["", eur(declarationDuTrimestre(k.f, 1).aPayer), eur(k.printemps.aPayer), eur(k.ete.aPayer)] },
          ],
        };
      },
      texte: (c) => {
        const k = tvaDuDernierTrimestre(c);
        return [
          `« Je prépare la déclaration de TVA du quatrième trimestre de ${k.f.entreprise}. La gérante a versé ${eur(k.ete.aPayer)} à l'État ce trimestre, pour l'été ; elle veut savoir si le versement suivant, au premier trimestre de N + 1, sera plus lourd ou plus léger. Elle ne comprend pas non plus pourquoi l'été lui a coûté si peu, avec ${eur(k.ete.collectee)} de TVA collectée. Et le gérant parle d'opter pour les débits l'an prochain : que deviendrait la comparaison ? »`,
          `Pas de cours cette fois : les calculs sont ceux du chapitre, à vous d'en trouver l'ordre. ${k.f.entreprise} fait des travaux, au régime des encaissements, et déclare chaque trimestre, au taux de ${pct(k.t)} ; un crédit de TVA s'impute sur la déclaration suivante.`,
        ];
      },
      repere: () =>
        "À rendre : les encaissements et la déclaration du quatrième trimestre, le crédit qui a allégé le versement de l'automne et l'investissement qui l'a fait naître, la comparaison des deux versements aux deux régimes, et votre réponse.",
    },
    {
      id: "les-encaissements",
      type: "montants",
      titre: "Les encaissements de l'automne",
      notions: ["payment_terms", "vat_payable"],
      question: () => "Combien les clients ont-ils payé au quatrième trimestre, hors taxes ? Calculez l'encaissé des collectivités, celui des entreprises, puis le total du trimestre.",
      champs: (c) => {
        const k = tvaDuDernierTrimestre(c);
        const [commerces, collectivites, entreprises] = k.encaisse;
        return [
          { libelle: "Encaissé des collectivités (HT)", attendu: collectivites!.encaisseHT, calcul: collectivites!.calcul },
          { libelle: "Encaissé des entreprises (HT)", attendu: entreprises!.encaisseHT, calcul: entreprises!.calcul },
          {
            libelle: "Encaissements du quatrième trimestre (HT)",
            attendu: k.enc.ici.encaissementsHT!,
            calcul: `${eur(commerces!.encaisseHT)} + ${eur(collectivites!.encaisseHT)} + ${eur(entreprises!.encaisseHT)} = ${eur(k.enc.ici.encaissementsHT!)}`,
          },
        ];
      },
      explication: (c) => {
        const k = tvaDuDernierTrimestre(c);
        return [
          `${k.f.entreprise} a facturé ${eur(k.enc.ici.ventesHT)} HT à l'automne, mais n'en a encaissé que ${eur(k.enc.ici.encaissementsHT!)} : les gros chantiers des entreprises, facturés en fin d'année, ne seront payés qu'en N + 1. C'est sur l'encaissé que se collecte la TVA de travaux.`,
        ];
      },
    },
    {
      id: "declaration",
      type: "montants",
      titre: "La déclaration du quatrième trimestre",
      notions: ["vat_payable"],
      question: () => "Calculez la TVA collectée et la TVA déductible du quatrième trimestre, puis la TVA à payer, que la gérante versera au premier trimestre de N + 1.",
      champs: (c) => {
        const k = tvaDuDernierTrimestre(c);
        const x = k.enc.ici;
        return [
          { libelle: "TVA collectée", attendu: x.collectee, calcul: `${eur(x.encaissementsHT!)} × ${pct(k.t)} = ${eur(x.collectee)}` },
          { libelle: "TVA déductible", attendu: x.deductible, calcul: `${eur(x.achatsHT)} × ${pct(k.t)} = ${eur(x.deductible)}` },
          { libelle: "TVA à payer", attendu: x.aPayer, calcul: `${eur(x.collectee)} − ${eur(x.deductible)} = ${eur(x.aPayer)}` },
        ];
      },
      explication: (c) => {
        const k = tvaDuDernierTrimestre(c);
        return [`${eur(k.enc.ici.aPayer)} restent dus à l'État au 31 décembre : une dette de l'exercice, au passif du bilan, versée dans l'exercice suivant.`];
      },
    },
    {
      id: "le-versement-au-curseur",
      type: "curseur",
      titre: "Où le verdict bascule",
      notions: ["vat_payable", "payment_terms"],
      question: (c) => {
        const k = tvaDuDernierTrimestre(c);
        return `Les matériaux du quatrième trimestre restent ceux de la déclaration. Faites varier les encaissements du trimestre, de ${ENCAISSEMENTS_DU_CURSEUR.min} à ${ENCAISSEMENTS_DU_CURSEUR.max} milliers d'euros HT : une droite donne la TVA à payer du trimestre, l'autre le versement de l'automne, ${eur(k.ete.aPayer)}. Placez le curseur sur les plus petits encaissements où le prochain versement serait au moins aussi lourd que le dernier, puis validez.`;
      },
      grandeur: () => ({ libelle: "Encaissements du quatrième trimestre", unite: "milliers d'euros (HT)" }),
      cible: (c) => ({ attendu: tvaDuDernierTrimestre(c).encaissementsQuiEgalent, min: ENCAISSEMENTS_DU_CURSEUR.min, max: ENCAISSEMENTS_DU_CURSEUR.max }),
      zones: ["Plus lourd", "Plus léger"],
      rates: () => ({
        dessous: "À cette position, le prochain versement reste plus léger que le dernier.",
        dessus: "Plus bas, le prochain versement est encore au moins aussi lourd : cherchez les plus petits encaissements.",
      }),
      montrer: "Montrer la bascule",
      lecture: (c, e) => {
        const k = tvaDuDernierTrimestre(c);
        const aPayer = k.versementAuxEncaissements(e);
        return [
          { libelle: "TVA collectée du trimestre", montant: auCentime(e * 1_000 * k.t) },
          { libelle: "TVA déductible du trimestre", montant: k.enc.ici.deductible },
          { libelle: "TVA à payer, versée en N + 1", montant: aPayer },
          { libelle: "Écart avec le versement de l'automne", montant: auCentime(aPayer - k.ete.aPayer), fort: true },
        ];
      },
      droites: (c) => {
        const k = tvaDuDernierTrimestre(c);
        return { produit: (e) => k.versementAuxEncaissements(e), cout: () => k.ete.aPayer, libelles: ["TVA à payer du quatrième trimestre", "Versement de l'automne"] };
      },
      explication: (c) => {
        const k = tvaDuDernierTrimestre(c);
        return [
          `Il faudrait encaisser ${eur(k.encaissementsQuiEgalent * 1_000)} HT au quatrième trimestre pour que le prochain versement égale le dernier ; ${k.f.entreprise} n'en a encaissé que ${eur(k.enc.ici.encaissementsHT!)}. Avec l'option pour les débits, la TVA se collecterait sur les ${eur(k.enc.ici.ventesHT)} facturés, et le dernier versement ne serait plus le même : la comparaison va le chiffrer.`,
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "Pourquoi l'été a coûté si peu",
      notions: ["vat_payable", "balance_sheet"],
      question: () =>
        "À rebours. La gérante a versé à l'automne bien moins que la TVA nette de l'été : un crédit du printemps s'y est imputé. Retrouvez la TVA nette de l'été, le crédit imputé, la TVA déductible du printemps qui a fait ce crédit, puis le matériel neuf livré au printemps, hors taxes.",
      champs: (c) => {
        const k = tvaDuDernierTrimestre(c);
        return [
          { libelle: "TVA nette de l'été", attendu: k.ete.nette, calcul: `${eur(k.ete.collectee)} − ${eur(k.ete.deductible)} = ${eur(k.ete.nette)}` },
          { libelle: "Crédit imputé sur l'été", attendu: k.creditImpute, calcul: `${eur(k.ete.nette)} − ${eur(k.ete.aPayer)} versés = ${eur(k.creditImpute)}` },
          { libelle: "TVA déductible du printemps", attendu: k.deductibleDuPrintemps, calcul: `${eur(k.printemps.collectee)} collectés + ${eur(k.creditImpute)} de crédit = ${eur(k.deductibleDuPrintemps)}` },
          {
            libelle: "Matériel neuf livré au printemps (HT)",
            attendu: k.investissementARebours,
            calcul: `${eur(k.deductibleDuPrintemps)} ÷ ${pct(k.t)} − ${eur(k.printemps.achatsHT)} de matériaux = ${eur(k.investissementARebours)}`,
          },
        ];
      },
      explication: (c) => {
        const k = tvaDuDernierTrimestre(c);
        return [
          `Le versement de l'automne, ${eur(k.ete.aPayer)}, n'est pas la TVA de l'été : c'est elle moins le crédit du printemps, né du matériel neuf (${eur(k.investissementARebours)} HT). Ce crédit est maintenant épuisé : il n'allégera pas la déclaration de l'automne.`,
        ];
      },
    },
    {
      id: "comparer",
      type: "montants",
      titre: "Le prochain versement, aux deux régimes",
      notions: ["vat_payable", "cash_budget"],
      question: () =>
        "Calculez l'écart entre la TVA à payer du quatrième trimestre et le versement de l'automne (négatif si le prochain versement est plus léger). Puis refaites la comparaison avec l'option pour les débits : la TVA à payer du quatrième trimestre, celle de l'été, qui aurait été versée à l'automne, et leur écart.",
      champs: (c) => {
        const k = tvaDuDernierTrimestre(c);
        const d = k.deb;
        return [
          { libelle: "Écart, au régime des encaissements", attendu: k.enc.ecart, calcul: `${eur(k.enc.ici.aPayer)} − ${eur(k.enc.avant.aPayer)} = ${eur(k.enc.ecart)}` },
          { libelle: "TVA à payer du quatrième trimestre, aux débits", attendu: d.ici.aPayer, calcul: `${eur(d.ici.ventesHT)} facturés × ${pct(k.t)} − ${eur(d.ici.deductible)} = ${eur(d.ici.aPayer)}` },
          { libelle: "TVA versée à l'automne, aux débits", attendu: d.avant.aPayer, calcul: `${eur(d.avant.ventesHT)} facturés × ${pct(k.t)} − ${eur(d.avant.deductible)} = ${eur(d.avant.aPayer)}, sans crédit à imputer` },
          { libelle: "Écart, aux débits", attendu: d.ecart, calcul: `${eur(d.ici.aPayer)} − ${eur(d.avant.aPayer)} = ${eur(d.ecart)}` },
        ];
      },
      explication: (c) => {
        const k = tvaDuDernierTrimestre(c);
        return [
          `Au régime réel, l'automne encaisse moins que l'été (${eur(k.enc.ici.encaissementsHT!)} contre ${eur(k.ete.encaissementsHT!)}) et achète plus : le versement s'allège de ${eur(-k.enc.ecart)}, malgré le crédit qui avait allégé le précédent. Aux débits, l'automne facture beaucoup plus que l'été (${eur(k.deb.ici.ventesHT)} contre ${eur(k.deb.avant.ventesHT)}) : le versement s'alourdirait de ${eur(k.deb.ecart)}. Le même trimestre, deux verdicts : tout tient à l'exigibilité.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à l'expert-comptable",
      notions: ["vat_payable"],
      question: () => "Quelle phrase envoyez-vous à l'expert-comptable ?",
      options: (c) => {
        const k = tvaDuDernierTrimestre(c);
        const e = k.enc;
        const d = k.deb;
        return [
          {
            texte: `Plus léger : ${eur(e.ici.aPayer)} à verser, contre ${eur(e.avant.aPayer)} cet automne`,
            juste: k.verdict === "plus-leger",
            retour: `Oui : au régime des encaissements, celui de ${k.f.entreprise}, la TVA de l'automne se collecte sur ${eur(e.ici.encaissementsHT!)} encaissés. ${eur(e.ici.aPayer)} restent dus au 31 décembre, ${eur(-e.ecart)} de moins que le dernier versement. Avec l'option pour les débits, ce serait l'inverse : le gérant doit le savoir avant d'opter.`,
          },
          {
            texte: `Plus lourd : ${eur(d.ici.aPayer)} à verser, contre ${eur(d.avant.aPayer)} cet automne`,
            juste: false,
            retour: `Non : ce sont les chiffres du régime des débits, que ${k.f.entreprise} n'a pas choisi. Au régime réel, la TVA de travaux se collecte à l'encaissement : ${eur(e.ici.aPayer)} contre ${eur(e.avant.aPayer)}.`,
          },
          {
            texte: `Plus lourd : la TVA se collecte sur les ${eur(e.ici.ventesHT)} facturés à l'automne`,
            juste: false,
            retour: `Non : pour des travaux, sans option, la TVA se collecte sur ce que les clients ont payé, ${eur(e.ici.encaissementsHT!)}, et non sur le facturé.`,
          },
          {
            texte: "Rien à verser en N + 1 : le crédit du printemps couvre encore la TVA de l'automne",
            juste: false,
            retour: `Non : le crédit du printemps, ${eur(k.creditImpute)}, s'est imputé tout entier sur l'été. Il ne reste rien pour l'automne : ${eur(e.ici.aPayer)} sont dus.`,
          },
        ];
      },
    },
  ],
};
