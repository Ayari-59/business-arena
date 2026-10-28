import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { dateDuCours as date } from "../../dates";
import { TAUX_DE_LA_PAIE } from "../../monde/exercice-de-nova";
import { brutPourUnNetAPayer, bulletinDePaie, coefficientDuBrutAuNet } from "../../monde/paie";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LA PAIE » : LA PRIME EXCEPTIONNELLE (comptabilité générale, palier 3).
 *
 * LE CAS JOUE DANS LE MONDE DU COURS : l'effectif est celui du cas figé de l'entreprise
 * (`c.personnel`), les taux ceux du cours (monde/exercice-de-nova.ts), et le bulletin se calcule par
 * le modèle du cours (monde/paie.ts).
 *
 * Le gérant a annoncé à l'équipe une prime de 400 € NETS par salarié, versée avec la paie de
 * février ; il avait mis de côté 740 € par salarié. L'élève remonte du net au brut et au coût
 * employeur (le calcul à rebours), passe les deux écritures de la prime, cherche au curseur le net
 * le plus haut que le budget aurait permis, puis répond : le budget n'est pas tenu, et la prochaine
 * prime devra s'annoncer plus bas. Le piège : oublier le prélèvement à la source en remontant au
 * brut (728,21 € par salarié) fait croire que le budget tient.
 *
 * Ce qui a disparu : la prime donnée en brut (500 €), qui faisait refaire le bulletin du chapitre.
 */

/** Le net promis à chaque salarié, prélèvement à la source retenu : ce que le gérant a annoncé. */
export const PRIME_NETTE_PROMISE = 400;

/**
 * Le budget que le gérant avait mis de côté, par salarié, en coût employeur (la prime brute et ses
 * cotisations patronales). Il est juste en dessous de ce que coûtent 400 € nets : c'est ce qui fait
 * la question.
 */
export const BUDGET_PAR_SALARIE = 740;

/** Les bornes du curseur du net promis, en euros par salarié. */
export const BORNES_DU_NET = { min: 300, max: 450 } as const;

/** La prime part avec la paie de février, arrêtée le dernier jour du mois. */
const JOUR_DE_LA_PAIE = 59;
/** Ses cotisations et son prélèvement se règlent avec ceux de février, le 15 mars. */
const JOUR_DES_ORGANISMES = 74;

const T = TAUX_DE_LA_PAIE;
const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (t: number) => `${(t * 100).toLocaleString("fr-FR", { maximumFractionDigits: 3 })} %`;
const auCentime = (x: number) => Math.round((x + Number.EPSILON * Math.sign(x)) * 100) / 100 + 0;
const tauxPropre = (t: number) => Math.round(t * 1e6) / 1e6;

/** La prime : du net promis au brut et au coût, par salarié puis pour l'équipe, et le net que le budget permet. */
export function primeExceptionnelle(c: Pick<Cas, "personnel">) {
  const effectif = c.personnel.effectif;
  const tauxSalarial = tauxPropre(T.salarialUrssaf + T.salarialRetraite);
  const tauxPatronal = tauxPropre(T.patronalUrssaf + T.patronalRetraite);
  const k = coefficientDuBrutAuNet(T);
  const netPour100 = auCentime(100 * k);
  // Le net pour 100 € bruts, pas à pas : ce que la correction montre.
  const pour100 = bulletinDePaie(100, T);
  // Par salarié : le plus petit brut dont le bulletin verse le net promis, et ce qu'il coûte.
  const brutParSalarie = brutPourUnNetAPayer(PRIME_NETTE_PROMISE, T);
  const parSalarie = bulletinDePaie(brutParSalarie, T);
  const coutParSalarie = parSalarie.coutEmployeur;
  const depassement = auCentime(coutParSalarie - BUDGET_PAR_SALARIE);
  // Pour l'équipe : le journal de paie des primes.
  const equipe = bulletinDePaie(auCentime(brutParSalarie * effectif), T);
  // Le curseur : le net le plus haut, à l'euro, dont le coût tient dans le budget.
  const netQueTientLeBudget = Math.floor((BUDGET_PAR_SALARIE * k) / (1 + tauxPatronal) + 1e-9);
  const brutDuNetTenu = brutPourUnNetAPayer(netQueTientLeBudget, T);
  // Les erreurs des étudiants : le prélèvement oublié, les taux appliqués au net, le coefficient appliqué au budget.
  const brutSansLePrelevement = auCentime(PRIME_NETTE_PROMISE / (1 - tauxSalarial));
  const coutSansLePrelevement = auCentime(brutSansLePrelevement * (1 + tauxPatronal));
  const coutAvecLesTauxSurLeNet = auCentime(PRIME_NETTE_PROMISE * (1 + tauxSalarial + tauxPatronal));
  const netDuBudgetSansLesPatronales = auCentime(BUDGET_PAR_SALARIE * (netPour100 / 100));
  return {
    effectif,
    tauxSalarial,
    tauxPatronal,
    k,
    netPour100,
    pour100: { cotisations: pour100.cotisationsSalariales.total, netAvantImpot: pour100.netAvantImpot, netImposable: pour100.netImposable },
    brutParSalarie,
    parSalarie,
    coutParSalarie,
    depassement,
    depassementDeLEquipe: auCentime(equipe.coutEmployeur - BUDGET_PAR_SALARIE * effectif),
    equipe,
    netQueTientLeBudget,
    brutDuNetTenu,
    coutDuNetTenu: bulletinDePaie(brutDuNetTenu, T).coutEmployeur,
    brutSansLePrelevement,
    coutSansLePrelevement,
    coutAvecLesTauxSurLeNet,
    netDuBudgetSansLesPatronales,
  };
}

export const LA_PRIME_EXCEPTIONNELLE: Situation = {
  code: "la-prime-exceptionnelle",
  parcours: "comptabilite-generale",
  palier: 3,
  blocs: [],
  reprend: ["la-paie"],
  commanditaire: "Le gérant",
  titre: "La prime exceptionnelle",
  accroche:
    "Le gérant a promis à l'équipe une prime en net, avec la paie de février, sur un budget mis de côté en coût. Passez-la au journal, et dites-lui si son budget tenait.",
  objectifs: [
    "Remonter d'un net promis au brut, puis au coût employeur",
    "Enregistrer la prime et ses cotisations patronales",
    "Retrouver le net le plus haut qu'un budget de coût employeur permet",
    "Juger une promesse faite en net face à un budget tenu en coût",
  ],
  libre: false,
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La demande du gérant",
      texte: (c) => {
        const k = primeExceptionnelle(c);
        return [
          `« J'ai annoncé à nos ${qte(k.effectif)} salariés une prime exceptionnelle de ${eur(PRIME_NETTE_PROMISE)} nets chacun, après leur prélèvement à la source, avec la paie de février. J'avais mis de côté ${eur(BUDGET_PAR_SALARIE)} par salarié, cotisations comprises. Préparez le journal de paie des primes, et dites-moi si mon budget tient ; sinon, ce que j'aurais pu promettre avec lui. »`,
          "Pas de cours cette fois : la méthode est celle du chapitre. À vous de l'enchaîner.",
        ];
      },
      tableau: (c) => {
        const k = primeExceptionnelle(c);
        return {
          titre: `La prime de février · ${c.entreprise}`,
          colonnes: ["Valeur"],
          lignes: [
            { libelle: "Salariés", valeurs: [qte(k.effectif)] },
            { libelle: "Prime nette promise par salarié", valeurs: [eur(PRIME_NETTE_PROMISE)] },
            { libelle: "Budget par salarié, en coût employeur", valeurs: [eur(BUDGET_PAR_SALARIE)] },
            { libelle: "Cotisations salariales URSSAF, en % du brut", valeurs: [pct(T.salarialUrssaf)] },
            { libelle: "Cotisations salariales de retraite complémentaire", valeurs: [pct(T.salarialRetraite)] },
            { libelle: "Cotisations patronales URSSAF", valeurs: [pct(T.patronalUrssaf)] },
            { libelle: "Cotisations patronales de retraite complémentaire", valeurs: [pct(T.patronalRetraite)] },
            { libelle: `CSG et CRDS non déductibles, sur ${pct(T.assietteDeLaCsg)} du brut`, valeurs: [pct(T.csgCrdsNonDeductible)] },
            { libelle: "Taux moyen de prélèvement à la source", valeurs: [pct(T.prelevementALaSource)] },
          ],
        };
      },
      repere: () => "À rendre : le brut et le coût de la prime, ses deux écritures au journal, le net que le budget permettait, et votre réponse.",
    },
    {
      id: "la-prime-a-rebours",
      type: "montants",
      titre: "Du net promis au coût",
      notions: ["payroll", "fixed_costs"],
      question: () =>
        `Pour un salarié : ce qu'il touche net pour ${eur(100)} bruts, la prime brute qui lui verse les ${eur(PRIME_NETTE_PROMISE)} promis, puis ce qu'elle coûte à l'entreprise.`,
      champs: (c) => {
        const k = primeExceptionnelle(c);
        return [
          {
            libelle: `Net touché pour ${eur(100)} bruts`,
            attendu: k.netPour100,
            calcul: `${eur(100)} − ${eur(k.pour100.cotisations)} de cotisations salariales = ${eur(k.pour100.netAvantImpot)} ; net imposable ${eur(k.pour100.netAvantImpot)} + ${eur(100)} × ${pct(T.assietteDeLaCsg)} × ${pct(T.csgCrdsNonDeductible)} = ${eur(k.pour100.netImposable)} ; ${eur(k.pour100.netAvantImpot)} − ${eur(k.pour100.netImposable)} × ${pct(T.prelevementALaSource)} = ${eur(k.netPour100)}`,
          },
          {
            libelle: "Prime brute par salarié",
            attendu: k.brutParSalarie,
            tolerance: 0.05,
            calcul: `${eur(PRIME_NETTE_PROMISE)} ÷ ${qte(k.netPour100)} % = ${eur(auCentime(PRIME_NETTE_PROMISE / (k.netPour100 / 100)))} ; au centime près, le bulletin de ${eur(k.brutParSalarie)} verse ${eur(k.parSalarie.netAPayer)}`,
          },
          {
            libelle: "Coût employeur par salarié",
            attendu: k.coutParSalarie,
            tolerance: 0.1,
            calcul: `${eur(k.brutParSalarie)} × (1 + ${pct(k.tauxPatronal)}) = ${eur(k.coutParSalarie)}`,
          },
        ];
      },
      explication: (c) => {
        const k = primeExceptionnelle(c);
        return [
          `Pour ${eur(PRIME_NETTE_PROMISE)} nets, il faut ${eur(k.brutParSalarie)} bruts, qui coûtent ${eur(k.coutParSalarie)} à ${c.entreprise}. Le prélèvement à la source se prend aussi sur le brut : diviser le net par ${pct(1 - k.tauxSalarial)} ne suffit pas.`,
        ];
      },
    },
    {
      id: "ecriture-prime",
      type: "ecriture",
      titre: "La prime, au journal",
      notions: ["payroll", "fixed_costs"],
      evenement: (c) => {
        const k = primeExceptionnelle(c);
        return `Le ${date(JOUR_DE_LA_PAIE)}, le journal de paie de février porte les primes de l'équipe, ${qte(k.effectif)} fois la prime brute. Passez l'écriture des primes seules ; le salaire de février s'écrit comme celui de janvier.`;
      },
      piece: (c) => {
        const k = primeExceptionnelle(c);
        const e = k.equipe;
        return {
          nature: "Journal de paie de février : les primes",
          de: c.entreprise,
          a: `Ses ${qte(k.effectif)} salariés`,
          date: date(JOUR_DE_LA_PAIE),
          lignes: [
            { libelle: "Primes exceptionnelles brutes", quantite: qte(k.effectif), prixUnitaire: k.brutParSalarie, montant: e.brut },
            { libelle: `Cotisations salariales URSSAF (${pct(T.salarialUrssaf)})`, montant: e.cotisationsSalariales.urssaf },
            { libelle: `Cotisations salariales de retraite complémentaire (${pct(T.salarialRetraite)})`, montant: e.cotisationsSalariales.retraite },
            { libelle: `Prélèvement à la source (${pct(T.prelevementALaSource)} du net imposable)`, montant: e.prelevementALaSource },
          ],
          totaux: [
            { libelle: "Net avant impôt", montant: e.netAvantImpot },
            { libelle: "Net à payer", montant: e.netAPayer, fort: true },
          ],
        };
      },
      ecriture: (c) => {
        const e = primeExceptionnelle(c).equipe;
        return {
          date: date(JOUR_DE_LA_PAIE),
          libelle: "Primes exceptionnelles de février",
          lignes: [
            { role: "les primes brutes", compte: "641", sens: "debit", montant: e.brut, indice: "le total des primes brutes" },
            { role: "les cotisations salariales dues à l'URSSAF", compte: "431", sens: "credit", montant: e.cotisationsSalariales.urssaf, indice: "la part URSSAF retenue sur les primes" },
            { role: "les cotisations salariales dues à la caisse de retraite", compte: "437", sens: "credit", montant: e.cotisationsSalariales.retraite, indice: "la part de retraite complémentaire retenue sur les primes" },
            { role: "l'impôt prélevé à la source, dû à l'État", compte: "442", sens: "credit", montant: e.prelevementALaSource, indice: "le prélèvement à la source sur les primes" },
            { role: "le net à verser aux salariés", compte: "421", sens: "credit", montant: e.netAPayer, indice: "le net à payer des primes" },
          ],
        };
      },
      indices: () => [
        "Une prime est une rémunération : la charge, au débit, est son montant brut, au même compte que les salaires.",
        "Au crédit, chacun de ceux à qui elle revient : l'URSSAF (431), la caisse de retraite (437), l'État pour l'impôt prélevé (442), les salariés pour le net (421).",
      ],
      explication: (c) => {
        const k = primeExceptionnelle(c);
        return [
          `La charge est le brut, ${eur(k.equipe.brut)}, au débit du 641. Les salariés recevront ${eur(k.equipe.netAPayer)} avec leur salaire de février, les ${eur(PRIME_NETTE_PROMISE)} promis à chacun ; le reste attendra le ${date(JOUR_DES_ORGANISMES)}, avec les cotisations de février.`,
        ];
      },
      vue: "paie",
    },
    {
      id: "ecriture-patronales",
      type: "ecriture",
      titre: "Les cotisations patronales de la prime",
      notions: ["payroll", "fixed_costs"],
      evenement: (c) => `Le même jour, ${c.entreprise} enregistre ses propres cotisations sur les primes, organisme par organisme. Calculez-les et passez l'écriture.`,
      ecriture: (c) => {
        const e = primeExceptionnelle(c).equipe;
        return {
          date: date(JOUR_DE_LA_PAIE),
          libelle: "Cotisations patronales sur les primes de février",
          lignes: [
            { role: "les cotisations patronales", compte: "645", sens: "debit", montant: e.cotisationsPatronales.total, indice: "les deux parts patronales réunies" },
            { role: "la part due à l'URSSAF", compte: "431", sens: "credit", montant: e.cotisationsPatronales.urssaf, indice: `les primes brutes × ${pct(T.patronalUrssaf)}` },
            { role: "la part due à la caisse de retraite", compte: "437", sens: "credit", montant: e.cotisationsPatronales.retraite, indice: `les primes brutes × ${pct(T.patronalRetraite)}` },
          ],
        };
      },
      indices: () => [
        "Ces cotisations s'ajoutent au brut : une charge de l'entreprise, en un seul montant au débit.",
        "Au crédit, deux dettes : l'URSSAF et la caisse de retraite, chacune pour sa part.",
      ],
      explication: (c) => {
        const k = primeExceptionnelle(c);
        const e = k.equipe;
        return [
          `${eur(e.cotisationsPatronales.total)} de charges en plus des primes, au débit du 645 : ${eur(e.cotisationsPatronales.urssaf)} pour l'URSSAF, ${eur(e.cotisationsPatronales.retraite)} pour la caisse de retraite. Les primes coûtent donc ${eur(e.coutEmployeur)} à ${c.entreprise}, pour ${eur(auCentime(BUDGET_PAR_SALARIE * k.effectif))} mis de côté.`,
        ];
      },
      vue: "paie",
    },
    {
      id: "le-net-que-tient-le-budget",
      type: "curseur",
      titre: "Le net que le budget tenait",
      notions: ["payroll", "fixed_costs"],
      question: () =>
        `Faites varier le net promis à un salarié, de ${eur(BORNES_DU_NET.min)} à ${eur(BORNES_DU_NET.max)}. Une droite donne le budget, ${eur(BUDGET_PAR_SALARIE)} ; l'autre, ce que coûte la prime qui verse ce net. Placez le curseur sur le net le plus haut que le budget permet, puis validez.`,
      grandeur: () => ({ libelle: "Net promis par salarié", unite: "€" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: primeExceptionnelle(c).netQueTientLeBudget, min: BORNES_DU_NET.min, max: BORNES_DU_NET.max }),
      zones: ["Dans le budget", "Au-delà du budget"],
      rates: () => ({
        dessous: "Le budget permet encore un net plus haut : cherchez le plus haut.",
        dessus: "À cette position, la prime coûte déjà plus que le budget.",
      }),
      montrer: "Montrer le net",
      lecture: (_c, n) => {
        const brut = brutPourUnNetAPayer(n, T);
        const cout = bulletinDePaie(brut, T).coutEmployeur;
        return [
          { libelle: "Prime brute nécessaire", montant: brut },
          { libelle: "Coût employeur par salarié", montant: cout, fort: true },
          { libelle: "Reste du budget par salarié", montant: auCentime(BUDGET_PAR_SALARIE - cout) },
        ];
      },
      droites: (c) => {
        const k = primeExceptionnelle(c);
        return {
          produit: () => BUDGET_PAR_SALARIE,
          cout: (n) => (n / k.k) * (1 + k.tauxPatronal),
          libelles: ["Budget par salarié", "Coût de la prime qui verse ce net"],
        };
      },
      explication: (c) => {
        const k = primeExceptionnelle(c);
        return [
          `Avec ${eur(BUDGET_PAR_SALARIE)} par salarié, le gérant pouvait promettre ${eur(k.netQueTientLeBudget)} nets : ${eur(k.brutDuNetTenu)} bruts, qui coûtent ${eur(k.coutDuNetTenu)}. Les ${eur(PRIME_NETTE_PROMISE)} promis coûtent ${eur(k.coutParSalarie)}, ${eur(k.depassement)} de plus par salarié.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse au gérant",
      notions: ["payroll", "fixed_costs", "income_statement"],
      question: () => "Quelle phrase envoyez-vous au gérant ?",
      options: (c) => {
        const k = primeExceptionnelle(c);
        return [
          {
            texte: `Non : ${eur(k.coutParSalarie)} par salarié ; votre budget tenait ${eur(k.netQueTientLeBudget)} nets au plus`,
            juste: true,
            retour: `Oui : ${eur(PRIME_NETTE_PROMISE)} nets demandent ${eur(k.brutParSalarie)} bruts, qui coûtent ${eur(k.coutParSalarie)} par salarié : l'équipe dépasse le budget de ${eur(k.depassementDeLEquipe)}. La promesse faite en net se tient tout de même ; la prochaine s'annoncera à ${eur(k.netQueTientLeBudget)} nets, ou en brut.`,
          },
          {
            texte: `Oui : ${eur(PRIME_NETTE_PROMISE)} ÷ ${pct(1 - k.tauxSalarial)} font ${eur(k.brutSansLePrelevement)} bruts, soit ${eur(k.coutSansLePrelevement)} avec les cotisations patronales`,
            juste: false,
            retour: `Non : c'est oublier le prélèvement à la source, qui se retient aussi sur le brut. Il faut ${eur(k.brutParSalarie)} bruts, et la prime coûte ${eur(k.coutParSalarie)}, au-delà des ${eur(BUDGET_PAR_SALARIE)}.`,
          },
          {
            texte: `Oui : ${eur(PRIME_NETTE_PROMISE)} plus ${pct(k.tauxSalarial + k.tauxPatronal)} de cotisations font ${eur(k.coutAvecLesTauxSurLeNet)}, sous les ${eur(BUDGET_PAR_SALARIE)}`,
            juste: false,
            retour: `Non : les taux de cotisations s'appliquent au brut, pas au net. En remontant au brut (${eur(k.brutParSalarie)}), la prime coûte ${eur(k.coutParSalarie)}.`,
          },
          {
            texte: `Non : ${eur(k.coutParSalarie)} par salarié ; votre budget tenait ${eur(k.netDuBudgetSansLesPatronales)} nets, ${pct(k.netPour100 / 100)} de ${eur(BUDGET_PAR_SALARIE)}`,
            juste: false,
            retour: `Le dépassement est juste, pas le net que le budget tenait : ${eur(BUDGET_PAR_SALARIE)} est un coût employeur, il faut d'abord en retirer les cotisations patronales (diviser par ${qte(auCentime(1 + k.tauxPatronal))}) avant d'appliquer ${qte(k.netPour100)} %. Le budget tenait ${eur(k.netQueTientLeBudget)} nets.`,
          },
        ];
      },
    },
  ],
};
