import { arrondi2, eur, nombreAuCentieme, pct } from "../../../pedagogy/cours/deux-decimales";
import type { Cas } from "../cas";
import { CAPACITE_DE_REMBOURSEMENT_MAXIMALE, INDEPENDANCE_MINIMALE } from "../financement";
import { auCentime } from "../monde/amortissement";
import { ENTREPRISES_DES_COMPTES_DU_LYCEE, exerciceDe } from "../monde/comptes-du-lycee";
import {
  COMPTE_COURANT,
  PREMIERE_ANNEE_MAXIMALE,
  PRET_BANCAIRE,
  PRET_PARTICIPATIF,
  DUREE_DE_L_ENGAGEMENT,
  SURCOUT_ACCEPTE,
  TAUX_DE_LA_SUBVENTION,
  coutDuFinancement,
  planDeFinancement,
  planTenable,
  type ConditionsDuFinancement,
  type PlanDeFinancementDeNova,
} from "../monde/financement-du-lycee";
import type { Chapitre } from "../types";

/**
 * CHAPITRE : FINANCER AUTREMENT (Bac STMG, gestion et finance, palier 1 ; programme de terminale,
 * 3.1).
 *
 * « Financer l'entreprise » a posé trois sources : l'autofinancement, l'emprunt, l'apport des
 * associés. Ce chapitre ajoute les trois que le programme nomme encore : la subvention, le compte
 * courant d'associé et le financement participatif, et il compare leurs remboursements. NOVA doit
 * payer la ligne semi-automatique de sa gamme de N+1 : une subvention en paie une part ; le reste
 * vient de la banque, des associés en compte courant, ou d'un prêt participatif. Le chapitre chiffre
 * la subvention, distingue les sources, compare ce que chacune coûte en intérêts et pèse la première
 * année, puis fait l'expérience : un curseur sur le compte courant (combien en faudrait-il pour
 * alléger la première année ?) et un laboratoire du plan de financement (trois sources, deux
 * contraintes des associés). Il finit sur ce que la banque dira du plan, avec les ratios du
 * chapitre « La capacité de remboursement ».
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS : la ligne est celle de monde/projets-et-financement.ts ;
 * les conditions des sources, les tableaux de remboursement et le plan sont calculés dans
 * monde/financement-du-lycee.ts.
 */

/** Le montant sur lequel les trois sources se comparent, en euros. */
export const MONTANT_COMPARE = 40_000;

/** Les bornes du curseur du compte courant, en euros. */
export const COMPTE_COURANT_DU_CURSEUR = { min: 0, max: 120_000 } as const;

/** Les leviers du laboratoire : le compte courant et le prêt participatif, en euros ; la banque prend le reste. */
export const LEVIERS_DU_PLAN = {
  compteCourant: { min: 0, max: COMPTE_COURANT.plafond!, pas: 10_000 },
  participatif: { min: 0, max: 120_000, pas: 10_000 },
} as const;

/** La solution que montre la correction : 40 000 € en compte courant, 30 000 € de prêt participatif, 50 000 € à la banque. */
export const SOLUTION_DU_PLAN = { compteCourant: 40_000, participatif: 30_000 } as const;

const qte = (n: number) => n.toLocaleString("fr-FR");
const ans = (x: number) => `${nombreAuCentieme(x)} ${x < 2 ? "an" : "ans"}`;
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** Les parts de capital dues chaque année d'un prêt en parts égales : « 5 + 4 + 3 + 2 + 1 ». */
const partsDues = (n: number) => Array.from({ length: n }, (_, i) => qte(n - i)).join(" + ");

/** Le remboursement d'une source, dit en mots. */
const commentSeRembourse = (s: ConditionsDuFinancement) =>
  s.mode === "in-fine" ? `les intérêts chaque année, le capital en une fois au bout de ${qte(s.dureeAns)} ans` : `le capital en parts égales sur ${qte(s.dureeAns)} ans, avec les intérêts sur ce qui reste dû`;

/** Les chiffres du chapitre : le plan tout à la banque, et ce que coûte chaque source pour un même montant. */
export function financerAutrement(c: Pick<Cas, "code">) {
  const f = exerciceDe(c.code);
  const plan = planDeFinancement(f);
  const banque = PRET_BANCAIRE(f);
  const compare = [banque, COMPTE_COURANT, PRET_PARTICIPATIF].map((s) => ({ s, ...coutDuFinancement(s, MONTANT_COMPARE) }));
  return { ...plan, conditions: { banque, compteCourant: COMPTE_COURANT, participatif: PRET_PARTICIPATIF }, compare };
}

export type FinancerAutrement = ReturnType<typeof financerAutrement>;

/** Une position du curseur ou du laboratoire : le plan de financement. */
export const planDuLaboratoire = (k: FinancerAutrement, p: Readonly<Record<string, number>>): PlanDeFinancementDeNova =>
  planDeFinancement(k.f, { compteCourant: p.compteCourant ?? 0, participatif: p.participatif ?? 0 });

/** Le plus petit compte courant, la banque prenant le reste, qui garde la première année sous le plafond des associés. */
export function compteCourantNecessaire(k: FinancerAutrement) {
  const tient = (x: number) => planDuLaboratoire(k, { compteCourant: x }).premiereAnnee <= PREMIERE_ANNEE_MAXIMALE;
  let bas = 0;
  let haut = Math.ceil(k.aFinancer);
  if (!tient(haut)) return haut;
  while (haut - bas > 1) {
    const m = Math.floor((bas + haut) / 2);
    if (tient(m)) haut = m;
    else bas = m;
  }
  return tient(bas) ? bas : haut;
}

export const FINANCER_AUTREMENT: Chapitre = {
  code: "financer-autrement",
  parcours: "stmg-gf",
  palier: 1,
  blocs: ["STMG Thème 3 · Accompagner la prise de décision"],
  titre: "Financer autrement : subvention, compte courant et financement participatif",
  accroche:
    "La banque et les associés ne sont pas les seules portes. Une subvention, un prêt des associés, un prêt des internautes : ce que chacun apporte, et ce que chacun coûte à rembourser.",
  objectifs: [
    "Calculer ce qu'une subvention laisse à financer",
    "Distinguer un compte courant d'associé, un financement participatif et un apport au capital",
    "Comparer les remboursements de plusieurs financements : intérêts et première année",
    "Composer un plan de financement qui tient les contraintes de l'entreprise et de sa banque",
  ],
  libre: false,
  prerequis: ["financer-l-entreprise", "capacite-de-remboursement"],
  entreprises: {
    codes: ENTREPRISES_DES_COMPTES_DU_LYCEE,
    pourquoi: "le financement se décide ici sur la ligne de la gamme de NOVA, après son premier exercice dans la simulation du cours ; la méthode vaut pour toute entreprise.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Trois portes de plus",
      notions: ["loan_schedule", "dilution_issuance"],
      texte: (c) => {
        const k = financerAutrement(c);
        return [
          `Pour lancer sa gamme, ${k.entreprise} veut ${k.equipement} : ${eur(k.prix)} hors taxes. Vous connaissez déjà l'autofinancement, l'emprunt et l'apport des associés. Trois autres sources existent.`,
          "La subvention : de l'argent public, donné à condition de tenir un engagement, et qui ne se rembourse pas. Le compte courant d'associé : les associés prêtent leur argent à l'entreprise, sans recevoir de part du capital. Le financement participatif : des particuliers, réunis par une plateforme, donnent, prêtent ou entrent au capital.",
          "Chaque source a son prix, et surtout son rythme de remboursement. Le tableau dit les conditions qu'on propose à NOVA.",
        ];
      },
      tableau: (c) => {
        const k = financerAutrement(c);
        const { banque, compteCourant, participatif } = k.conditions;
        return {
          titre: `Les sources proposées à ${k.entreprise}`,
          colonnes: ["Taux", "Remboursement"],
          lignes: [
            { libelle: `Subvention de la région (${pct(TAUX_DE_LA_SUBVENTION * 100)} du prix)`, valeurs: ["aucun", "aucun, si l'engagement est tenu"] },
            { libelle: "Prêt bancaire", valeurs: [pct(banque.taux * 100), commentSeRembourse(banque)] },
            { libelle: `Compte courant d'associé (${eur(compteCourant.plafond!)} au plus)`, valeurs: [pct(compteCourant.taux * 100), commentSeRembourse(compteCourant)] },
            { libelle: "Prêt participatif", valeurs: [pct(participatif.taux * 100), commentSeRembourse(participatif)] },
          ],
        };
      },
      repere: () => "Ce qu'un financement coûte : ses intérêts sur toute sa durée. Ce qu'il pèse : ce qu'il fait sortir de la trésorerie chaque année, intérêts et capital.",
    },
    {
      id: "subvention",
      objectifs: [0],
      type: "montants",
      titre: "La subvention",
      notions: ["balance_sheet"],
      question: (c) => {
        const k = financerAutrement(c);
        return `La région aide ${k.entreprise} à hauteur de ${pct(TAUX_DE_LA_SUBVENTION * 100)} du prix hors taxes de la ligne, si elle la garde ${qte(DUREE_DE_L_ENGAGEMENT)} ans et crée l'emploi annoncé. Calculez la subvention, puis ce qui reste à financer.`;
      },
      champs: (c) => {
        const k = financerAutrement(c);
        return [
          { libelle: "Subvention", attendu: k.subvention, calcul: `${eur(k.prix)} × ${pct(TAUX_DE_LA_SUBVENTION * 100)} = ${eur(k.subvention)}` },
          { libelle: "Reste à financer", attendu: k.aFinancer, calcul: `${eur(k.prix)} − ${eur(k.subvention)} = ${eur(k.aFinancer)}` },
        ];
      },
      explication: (c) => {
        const k = financerAutrement(c);
        return [
          `La subvention paie ${eur(k.subvention)} sans intérêt ni remboursement : c'est la source la moins chère, mais elle a ses conditions, et il faut la demander avant d'acheter. Elle se range avec les capitaux propres.`,
          `Restent ${eur(k.aFinancer)} à trouver.`,
        ];
      },
    },
    {
      id: "compte-courant",
      objectifs: [1],
      type: "choix",
      titre: "Le compte courant d'associé",
      notions: ["dilution_issuance", "balance_sheet"],
      question: (c) => {
        const k = financerAutrement(c);
        return `Les associés peuvent mettre ${eur(COMPTE_COURANT.plafond!)} dans ${k.entreprise}. Sur leur compte courant plutôt qu'au capital, qu'est-ce qui change pour eux ?`;
      },
      options: () => [
        {
          texte: "Ils seront remboursés, sans part de capital de plus",
          juste: true,
          retour: `Oui : un compte courant est un prêt des associés à leur société. Ils touchent des intérêts (${pct(COMPTE_COURANT.taux * 100)} ici) et récupèrent leur argent, mais leur part du capital ne bouge pas. Un apport au capital, lui, ne se rembourse pas : il donne des parts, et un droit aux bénéfices.`,
        },
        {
          texte: "Rien : un compte courant, c'est un apport au capital sous un autre nom",
          juste: false,
          retour: "Non : l'apport au capital reste dans l'entreprise et donne des parts ; le compte courant est une dette, que l'entreprise rembourse.",
        },
        {
          texte: "Ils deviennent des prêteurs que la banque doit rembourser",
          juste: false,
          retour: "Non : c'est l'entreprise qui doit le compte courant à ses associés, pas la banque. La banque, elle, le regarde d'un bon œil quand il est bloqué plusieurs années.",
        },
      ],
    },
    {
      id: "participatif",
      objectifs: [1],
      type: "choix",
      titre: "Le financement participatif",
      notions: ["dilution_issuance"],
      question: (c) => {
        const k = financerAutrement(c);
        return `Une plateforme propose à ${k.entreprise} une campagne de financement participatif. Elle choisit le prêt, plutôt que le don contre une récompense ou l'entrée des internautes au capital. Que doit-elle aux internautes ?`;
      },
      options: () => [
        {
          texte: "Leur argent, avec des intérêts",
          juste: true,
          retour: `Oui : en prêt participatif, les internautes sont des prêteurs. Ici, ${pct(PRET_PARTICIPATIF.taux * 100)} d'intérêts chaque année et le capital au bout de ${qte(PRET_PARTICIPATIF.dureeAns)} ans. En don, NOVA leur devrait une récompense, une enceinte par exemple. Au capital, ils deviendraient associés.`,
        },
        {
          texte: "Une part du capital de NOVA, à chacun",
          juste: false,
          retour: "Non : c'est le financement participatif en capital. En prêt, les internautes ne deviennent pas associés.",
        },
        {
          texte: "Rien du tout : ce qu'on reçoit d'une campagne est donné",
          juste: false,
          retour: "Non : même un don se fait contre une récompense promise. Et un prêt se rembourse, avec ses intérêts.",
        },
      ],
    },
    {
      id: "le-cout-total",
      objectifs: [2],
      type: "montants",
      titre: "Ce que chaque source coûte",
      notions: ["loan_schedule"],
      question: (c) => {
        const n = financerAutrement(c).conditions.banque.dureeAns;
        return `Comparez les trois sources sur un même montant, ${eur(MONTANT_COMPARE)}. Calculez les intérêts payés sur toute la durée de chacune. Pour le prêt bancaire, les intérêts portent sur ce qui reste dû : ${qte(n)} parts de capital la première année, puis une de moins chaque année.`;
      },
      champs: (c) => {
        const k = financerAutrement(c);
        return k.compare.map(({ s, interets }) => ({
          libelle: `Intérêts, ${s.nom}`,
          attendu: interets,
          calcul:
            s.mode === "in-fine"
              ? `${eur(MONTANT_COMPARE)} × ${pct(s.taux * 100)} × ${qte(s.dureeAns)} ans = ${eur(interets)}`
              : `${eur(MONTANT_COMPARE)} × ${pct(s.taux * 100)} × (${partsDues(s.dureeAns)}) ÷ ${qte(s.dureeAns)} = ${eur(interets)}`,
        }));
      },
      explication: (c) => {
        const k = financerAutrement(c);
        const [b, cc, p] = k.compare;
        return [
          `Le prêt participatif est le plus cher : ${eur(p!.interets)}, parce que son taux est le plus haut et que son capital reste dû jusqu'au bout. Le compte courant coûte autant que la banque, ${eur(cc!.interets)} contre ${eur(b!.interets)} : un taux plus bas, mais tout le capital dû pendant ${qte(COMPTE_COURANT.dureeAns)} ans.`,
        ];
      },
    },
    {
      id: "la-premiere-annee",
      objectifs: [2],
      type: "montants",
      titre: "Ce que chaque source pèse la première année",
      notions: ["loan_schedule", "net_treasury"],
      question: () => `Toujours pour ${eur(MONTANT_COMPARE)}, calculez ce que chaque source fait sortir de la trésorerie la première année : les intérêts, et le capital remboursé s'il y en a.`,
      champs: (c) => {
        const k = financerAutrement(c);
        return k.compare.map(({ s, premiereAnnee, tableau }) => ({
          libelle: `Première année, ${s.nom}`,
          attendu: premiereAnnee,
          calcul:
            s.mode === "in-fine"
              ? `${eur(MONTANT_COMPARE)} × ${pct(s.taux * 100)} = ${eur(premiereAnnee)}, sans capital`
              : `${eur(tableau[0]!.capital)} de capital + ${eur(tableau[0]!.interets)} d'intérêts = ${eur(premiereAnnee)}`,
        }));
      },
      explication: (c) => {
        const k = financerAutrement(c);
        const [b, cc, p] = k.compare;
        return [
          `La banque coûte le moins en intérêts, mais pèse le plus la première année : ${eur(b!.premiereAnnee)}, contre ${eur(p!.premiereAnnee)} pour le prêt participatif et ${eur(cc!.premiereAnnee)} pour le compte courant.`,
          "Comparer des financements, c'est comparer deux choses : ce qu'ils coûtent en tout, et le moment où ils se remboursent. Un remboursement en une fois à la fin soulage les premières années, mais il faudra trouver tout le capital le jour venu.",
        ];
      },
    },
    {
      id: "combien-en-compte-courant",
      objectifs: [2],
      type: "curseur",
      titre: "Combien en compte courant ?",
      notions: ["loan_schedule", "net_treasury"],
      question: (c) => {
        const k = financerAutrement(c);
        return `La première année de la gamme est celle du lancement : les associés ne veulent pas que les nouveaux financements prennent plus de ${eur(PREMIERE_ANNEE_MAXIMALE)} à la trésorerie. Tout à la banque, il en sortirait ${eur(k.premiereAnneeToutALaBanque)}. Faites varier le compte courant, la banque prenant le reste : placez le curseur sur le plus petit montant qui tient la limite, puis validez.`;
      },
      grandeur: () => ({ libelle: "Compte courant d'associé", unite: "€" }),
      sens: "plus-petite",
      cible: (c) => ({ attendu: compteCourantNecessaire(financerAutrement(c)), min: COMPTE_COURANT_DU_CURSEUR.min, max: COMPTE_COURANT_DU_CURSEUR.max }),
      zones: ["La première année tient la limite", "La première année la dépasse"],
      rates: () => ({
        dessous: "À ce montant, la première année dépasse encore la limite : il faut plus de compte courant.",
        dessus: "À ce montant, la première année tient, mais un compte courant plus petit suffirait.",
      }),
      montrer: "Montrer le montant",
      lecture: (c, x) => {
        const k = financerAutrement(c);
        const p = planDuLaboratoire(k, { compteCourant: x });
        return [
          { libelle: "Emprunté à la banque", montant: Math.max(0, p.banque) },
          { libelle: "Sorti la première année", montant: p.premiereAnnee },
          { libelle: "Marge sous la limite des associés", montant: auCentime(PREMIERE_ANNEE_MAXIMALE - p.premiereAnnee), fort: true },
        ];
      },
      droites: (c) => {
        const k = financerAutrement(c);
        return { produit: () => PREMIERE_ANNEE_MAXIMALE, cout: (x) => planDuLaboratoire(k, { compteCourant: x }).premiereAnnee, libelles: ["Limite des associés", "Sorti la première année"] };
      },
      explication: (c) => {
        const k = financerAutrement(c);
        const besoin = compteCourantNecessaire(k);
        return [
          `Il faudrait ${eur(besoin)} en compte courant : chaque euro qui quitte la banque pour le compte courant allège la première année, parce qu'il ne se rembourse qu'au bout de ${qte(COMPTE_COURANT.dureeAns)} ans.`,
          `Mais les associés n'ont que ${eur(COMPTE_COURANT.plafond!)} à prêter. Seuls, ils n'y arrivent pas : il faut une troisième source qui se rembourse tard. Le laboratoire suivant la cherche.`,
        ];
      },
    },
    {
      id: "le-laboratoire-du-plan-de-financement",
      objectifs: [3],
      type: "simulation",
      titre: "Le laboratoire du plan de financement",
      notions: ["loan_schedule", "net_treasury"],
      question: (c) => {
        const k = financerAutrement(c);
        return `Répartissez les ${eur(k.aFinancer)} à financer : faites varier le compte courant et le prêt participatif, la banque prend le reste. Le tableau dit les intérêts de toute la durée et ce qui sort la première année. Relevez le défi.`;
      },
      leviers: () => [
        { code: "compteCourant", libelle: "Compte courant d'associé", unite: "€", ...LEVIERS_DU_PLAN.compteCourant, depart: 0 },
        { code: "participatif", libelle: "Prêt participatif", unite: "€", ...LEVIERS_DU_PLAN.participatif, depart: 0 },
      ],
      lecture: (c, p) => {
        const k = financerAutrement(c);
        const x = planDuLaboratoire(k, p);
        return [
          { libelle: "Emprunté à la banque", montant: x.banque, reference: k.aFinancer },
          { libelle: "Intérêts sur toute la durée", montant: x.interets, reference: k.interetsToutALaBanque, fort: true },
          { libelle: "Sorti la première année", montant: x.premiereAnnee, reference: k.premiereAnneeToutALaBanque, fort: true },
        ];
      },
      defi: (c) => {
        const k = financerAutrement(c);
        const plafond = auCentime(k.interetsToutALaBanque + SURCOUT_ACCEPTE);
        return {
          consigne: `Financez la ligne sans sortir plus de ${eur(PREMIERE_ANNEE_MAXIMALE)} la première année, et sans payer plus de ${eur(SURCOUT_ACCEPTE)} d'intérêts de plus que tout à la banque, soit ${eur(plafond)} au plus.`,
          atteint: (p) => planTenable(planDuLaboratoire(k, p)),
          indice: (p) => {
            const x = planDuLaboratoire(k, p);
            if (x.banque < 0) return `Le compte courant et le prêt participatif dépassent ce qu'il faut financer, ${eur(k.aFinancer)} : baissez l'un des deux.`;
            if (x.premiereAnnee > PREMIERE_ANNEE_MAXIMALE) return `La première année fait sortir ${eur(x.premiereAnnee)} : déplacez plus d'argent vers les sources qui se remboursent à la fin.`;
            return `Les intérêts montent à ${eur(x.interets)}, au-delà de ${eur(plafond)} : le prêt participatif coûte cher, n'en prenez que ce qu'il faut.`;
          },
          solution: SOLUTION_DU_PLAN,
        };
      },
      explication: (c, p) => {
        const k = financerAutrement(c);
        const x = planDuLaboratoire(k, p);
        return [
          `Défi relevé : ${eur(x.compteCourant)} en compte courant, ${eur(x.participatif)} de prêt participatif et ${eur(x.banque)} à la banque. La première année fait sortir ${eur(x.premiereAnnee)}, et les intérêts de toute la durée font ${eur(x.interets)}.`,
          "Le compte courant, peu cher et remboursé à la fin, se prend en entier. Le prêt participatif, cher mais lui aussi remboursé à la fin, se dose : juste assez pour alléger la première année. La banque, la moins chère, prend le reste.",
        ];
      },
    },
    {
      id: "ce-que-dira-la-banque",
      objectifs: [3],
      type: "montants",
      titre: "Ce que dira la banque",
      notions: ["balance_sheet", "frng"],
      question: (c) => {
        const k = financerAutrement(c);
        return `Quel que soit le partage, ${k.entreprise} devra ${eur(k.aFinancer)} de plus : le compte courant, le prêt participatif et le prêt bancaire sont des dettes financières. La subvention, elle, rejoint les capitaux propres. Calculez les dettes financières après le plan, la capacité de remboursement au centième, puis l'indépendance financière en pourcentage, à deux décimales.`;
      },
      champs: (c) => {
        const k = financerAutrement(c);
        const capacite = arrondi2(k.capaciteDeRemboursement);
        const independance = arrondi2(k.independance * 100);
        return [
          { libelle: "Dettes financières après le plan", attendu: k.dettesFinancieres, calcul: `${eur(k.dettesAvant)} + ${eur(k.aFinancer)} = ${eur(k.dettesFinancieres)}` },
          { libelle: "Capacité de remboursement (années)", nature: "grandeur", attendu: capacite, calcul: `${eur(k.dettesFinancieres)} ÷ ${eur(k.caf)} = ${nombreAuCentieme(capacite)}` },
          { libelle: "Indépendance financière (%)", attendu: independance, calcul: `${eur(k.capitauxPropres)} ÷ ${eur(k.ressourcesDurables)} = ${pct(independance)}` },
        ];
      },
      explication: (c) => {
        const k = financerAutrement(c);
        const capacite = arrondi2(k.capaciteDeRemboursement);
        const tenu = capacite <= CAPACITE_DE_REMBOURSEMENT_MAXIMALE && k.independance >= INDEPENDANCE_MINIMALE;
        return [
          `${ans(capacite)} de capacité d'autofinancement et ${pct(arrondi2(k.independance * 100))} de capitaux propres : ${tenu ? "les deux règles des banques sont tenues" : "une règle des banques n'est pas tenue"}.`,
          `La subvention y est pour beaucoup. Sans elle, tout emprunté, l'indépendance tomberait à ${pct(arrondi2(k.independanceSansSubvention * 100))}, sous la moitié. Une source qui ne se rembourse pas allège aussi le bilan.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["loan_schedule", "balance_sheet"],
      texte: (c) => {
        const k = financerAutrement(c);
        return [
          `Pour ${k.equipement} ${dE(k.entreprise)}, la subvention paie ${eur(k.subvention)} ; les ${eur(k.aFinancer)} restants se partagent entre la banque, les associés et les internautes.`,
          "Chaque source se juge sur trois points : ce qu'elle coûte en intérêts, le moment où elle se rembourse, et ce qu'elle change au pouvoir des associés. La subvention ne se rembourse pas. Le compte courant et le prêt participatif sont des dettes, sans part de capital. L'apport et le financement participatif en capital font entrer de nouveaux associés. Dans l'arène, les chiffres de votre entreprise seront différents : la méthode sera la même.",
        ];
      },
      repere: () => "Comparer des financements : les intérêts sur toute la durée, et ce qui sort de la trésorerie chaque année.",
    },
  ],
};
