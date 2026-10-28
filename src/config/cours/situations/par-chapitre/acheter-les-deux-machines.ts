import { montantEcrit } from "../../../../pedagogy/cours/correcteur";
import type { Cas } from "../../cas";
import { ENTREPRISES_DES_PROJETS, premierPositif, toleranceDActualisation } from "../../chapitres/la-valeur-actuelle-nette";
import { LE_TRI_ET_LE_CHOIX_ENTRE_DEUX_PROJETS, deuxLignes, nomDuProgramme, type Lettre } from "../../chapitres/le-tri-et-le-choix-entre-deux-projets";
import { auCentime } from "../../monde/amortissement";
import { coefficientDActualisation, fluxDuProjet, van } from "../../monde/finance";
import { COUT_D_UN_RETOUR, ETALONNAGE_DU_BANC, RETOURS_EVITES_PAR_AN, type ProjetDInvestissement } from "../../monde/projets-et-financement";
import type { Situation } from "../types";

/**
 * CAS PRATIQUE DU CHAPITRE « LE TAUX DE RENTABILITÉ INTERNE ET LE CHOIX ENTRE DEUX PROJETS » :
 * ACHETER LES DEUX MACHINES (DSCG, UE2 Finance, palier 4).
 *
 * REFONDÉ SUR LE RATIONNEMENT (l4-monde.md : les projets A et B s'excluent, le cas ne peut plus les
 * acheter ensemble). Le chapitre a retenu la ligne semi-automatique (B), puis, avec 240 000 € à
 * engager, la ligne semi-automatique et le banc de mesure (C). La directrice générale veut « les deux
 * machines », B et C. Mais la banque a ramené sa ligne de crédit : NOVA ne peut plus engager que
 * 210 000 € à la date 0 (`BUDGET_DU_CAS`). B et C n'y tiennent plus (236 230 €) ; restent B seul
 * (68 397,29 €) ou la ligne manuelle et le banc (72 605,82 €). Sous le budget, la règle des projets
 * qui s'excluent (la plus forte VAN) ne suffit plus : c'est la VAN du programme qui décide, et elle
 * renverse le choix du chapitre. Puis un calcul à rebours croise ce choix avec l'hypothèse la plus
 * fragile, les retours que le banc doit éviter : 324 par an au moins, pour 360 prévus. Un curseur
 * sur ces retours le montre avant le calcul. La réponse demande un jugement : le bon programme, et
 * la condition qui le tient.
 *
 * Comme son chapitre, le cas se joue dans la simulation du cours (src/config/cours/monde).
 */

/** LE BUDGET DU CAS (hypothèse du cas) : la banque a ramené sa ligne de crédit ; NOVA ne peut engager que 210 000 € à la date 0. */
export const BUDGET_DU_CAS = 210_000;

/** Les bornes du curseur des retours sous garantie que le banc évite chaque année. */
export const RETOURS_DU_CURSEUR = { min: 250, max: 400 } as const;

export type Verdict = "la-ligne-manuelle-et-le-banc" | "la-ligne-semi-automatique-seule" | "les-deux-machines";

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (x: number) => `${x.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−")} %`;
const auCentieme = (x: number) => Math.round(x * 100) / 100;
const majuscule = (s: string) => `${s.charAt(0).toUpperCase()}${s.slice(1)}`;

/** Le banc avec un autre nombre de retours évités chaque année (le levier du curseur). */
export function avecLesRetours(p: ProjetDInvestissement, retours: number): ProjetDInvestissement {
  return { ...p, charges: p.charges.map((ch) => (/retours/.test(ch.libelle) ? { ...ch, montants: ch.montants.map(() => -retours * COUT_D_UN_RETOUR) } : ch)) };
}

const calculs = new Map<string, ReturnType<typeof calculer>>();

/** Les programmes sous le budget du cas, et ce que le banc doit tenir pour que le meilleur le reste. */
export function acheterLesDeux(c: Pick<Cas, "code">) {
  const deja = calculs.get(c.code);
  if (deja) return deja;
  const r = calculer(c);
  calculs.set(c.code, r);
  return r;
}

function calculer(c: Pick<Cas, "code">) {
  const x = deuxLignes(c);
  const t = x.t;
  const prog = (nom: string) => x.programmes.find((p) => p.nom === nom)!;
  const bc = prog("BC");
  const ac = prog("AC");
  const b = prog("B");
  const possibles = x.programmes.filter((p) => p.mise <= BUDGET_DU_CAS);
  const meilleur = possibles.reduce((m, p) => (p.van > m.van ? p : m));
  const verdict: Verdict = meilleur.nom === "AC" ? "la-ligne-manuelle-et-le-banc" : meilleur.nom === "BC" ? "les-deux-machines" : "la-ligne-semi-automatique-seule";
  // Le banc : son flux annuel est (retours × coût d'un retour − étalonnage − dotation) × (1 − t) + dotation.
  const vanDuBanc = (retours: number) => van(fluxDuProjet(avecLesRetours(x.k.c, retours), { tauxDeLImpot: x.k.impot }).flux, t);
  const avance = (retours: number) => auCentime(x.vanA + vanDuBanc(retours) - x.vanB);
  const annuite = Array.from({ length: x.C.duree }, (_, i) => coefficientDActualisation(t, i + 1)).reduce((s, y) => s + y, 0);
  const dotation = x.k.c.actifs[0]!.montant / x.k.c.actifs[0]!.dureeDAmortissement;
  const vanVisee = auCentime(x.vanB - x.vanA);
  const fluxVise = auCentime((vanVisee - x.C.flux[0]!) / annuite);
  // flux = (retours × coût − étalonnage − dotation) × (1 − t) + dotation : on en tire les retours.
  const retoursMinimaux = auCentieme(((fluxVise - dotation) / (1 - x.k.impot) + dotation + ETALONNAGE_DU_BANC) / COUT_D_UN_RETOUR);
  return {
    x,
    bc,
    ac,
    b,
    meilleur,
    verdict,
    manque: auCentime(bc.mise - BUDGET_DU_CAS),
    avanceDuProgramme: auCentime(ac.van - b.van),
    vanDuBanc,
    avance,
    annuite,
    vanVisee,
    fluxVise,
    retoursMinimaux,
    retoursEntiers: premierPositif(avance, RETOURS_DU_CURSEUR.min, RETOURS_DU_CURSEUR.max, retoursMinimaux),
    margeDesRetours: auCentieme(((RETOURS_EVITES_PAR_AN - retoursMinimaux) / RETOURS_EVITES_PAR_AN) * 100),
  };
}

export const ACHETER_LES_DEUX_MACHINES: Situation = {
  code: "acheter-les-deux-machines",
  parcours: "dscg-finance",
  palier: 4,
  blocs: [],
  reprend: [LE_TRI_ET_LE_CHOIX_ENTRE_DEUX_PROJETS.code],
  commanditaire: "La directrice générale",
  titre: "Acheter les deux machines",
  accroche:
    "La directrice générale veut la ligne semi-automatique et le banc de mesure. Mais la banque a réduit son crédit, et les deux machines ne tiennent plus dans le budget. Quel programme retenir, et à quelle condition ?",
  objectifs: [
    "Recenser les programmes d'investissement qui tiennent dans un budget",
    "Comparer leurs VAN, quand la règle des projets qui s'excluent ne suffit plus",
    "Retrouver à rebours la performance minimale qui tient le choix",
    "Répondre à la directrice générale, chiffres à l'appui",
  ],
  libre: false,
  entreprises: {
    codes: ENTREPRISES_DES_PROJETS,
    pourquoi: "ce cas reprend le chapitre « Le taux de rentabilité interne et le choix entre deux projets », qui se calcule sur les projets de NOVA, dans la simulation du cours.",
  },
  etapes: [
    {
      id: "demande",
      type: "lecture",
      titre: "La question de la directrice générale",
      tableau: (c) => {
        const { x } = acheterLesDeux(c);
        const ligne = (l: Lettre, nom: string) => {
          const p = l === "A" ? x.A : l === "B" ? x.B : x.C;
          const v = l === "A" ? x.vanA : l === "B" ? x.vanB : x.vanC;
          return { libelle: `Projet ${l}, ${nom}`, valeurs: [eur(-p.flux[0]!), eur(v)] };
        };
        return {
          titre: `Les projets de ${x.entreprise}, et le budget de la date 0`,
          colonnes: ["Mise de la date 0", `VAN à ${pct(x.tauxPct)}`],
          lignes: [ligne("A", "ligne manuelle"), ligne("B", "ligne semi-automatique"), ligne("C", x.k.c.nom), { libelle: "Budget de la date 0", valeurs: [eur(BUDGET_DU_CAS), ""] }],
        };
      },
      texte: () => {
        return [
          `« Le chapitre nous a fait retenir la ligne semi-automatique, la plus forte VAN, et le banc de mesure, indépendant, s'y ajoute. Achetons les deux machines. Seulement, la banque a ramené sa ligne de crédit : nous ne pouvons plus engager que ${eur(BUDGET_DU_CAS)} au 1er janvier. Que faisons-nous ? »`,
          `Pas de cours cette fois : les calculs sont ceux du chapitre, à vous d'en trouver l'ordre. Les deux lignes s'excluent, chaque projet se fait en entier ou pas du tout, et le banc repose sur une hypothèse : il évite ${qte(RETOURS_EVITES_PAR_AN)} retours sous garantie par an, à ${eur(COUT_D_UN_RETOUR)} chacun, pour ${eur(ETALONNAGE_DU_BANC)} d'étalonnage.`,
        ];
      },
      repere: () => "À rendre : les programmes qui tiennent dans le budget et leur VAN, les retours que le banc doit éviter pour que le meilleur le reste, et votre réponse.",
    },
    {
      id: "les-programmes",
      type: "montants",
      titre: "Ce qui tient dans le budget",
      notions: ["discounting", "irr_payback"],
      question: () =>
        "Calculez la mise des deux machines que veut la directrice, la VAN de l'autre programme qui associe une ligne et le banc, puis ce que ce programme crée de plus que la ligne semi-automatique seule.",
      champs: (c) => {
        const k = acheterLesDeux(c);
        const x = k.x;
        return [
          { libelle: "Mise de la ligne semi-automatique et du banc", attendu: k.bc.mise, calcul: `${eur(-x.B.flux[0]!)} + ${eur(-x.C.flux[0]!)} = ${eur(k.bc.mise)}, ${eur(k.manque)} de plus que le budget` },
          { libelle: "VAN de la ligne manuelle et du banc", attendu: k.ac.van, calcul: `${eur(x.vanA)} + ${eur(x.vanC)} = ${eur(k.ac.van)}, pour ${eur(k.ac.mise)} engagés`, tolerance: 1 },
          { libelle: "Ce que ce programme crée de plus que la ligne semi-automatique seule", attendu: k.avanceDuProgramme, calcul: `${eur(k.ac.van)} − ${eur(k.b.van)} = ${eur(k.avanceDuProgramme)}`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const k = acheterLesDeux(c);
        return [
          `Les deux machines demandent ${eur(k.bc.mise)} : elles ne tiennent pas dans ${eur(BUDGET_DU_CAS)}. Il reste deux programmes sérieux : la ligne semi-automatique seule, ${eur(k.b.mise)} pour ${eur(k.b.van)}, et ${nomDuProgramme("AC")}, ${eur(k.ac.mise)} pour ${eur(k.ac.van)}.`,
          `Sous le budget, la règle du chapitre (entre deux lignes qui s'excluent, la plus forte VAN) ne suffit plus : ce n'est plus une ligne contre l'autre, c'est un programme contre l'autre. La ligne manuelle laisse la place au banc, et le programme crée ${eur(k.avanceDuProgramme)} de plus.`,
        ];
      },
    },
    {
      id: "le-banc-au-curseur",
      type: "curseur",
      titre: "Les retours que le banc doit éviter",
      notions: ["discounting"],
      question: () =>
        "Le choix repose sur le banc, et le banc sur une hypothèse : les retours sous garantie qu'il évite. Faites-les varier. Une droite donne la VAN de la ligne manuelle et du banc, l'autre celle de la ligne semi-automatique seule. Placez le curseur sur le plus petit nombre de retours évités où le programme vaut encore au moins autant, puis validez.",
      grandeur: () => ({ libelle: "Retours sous garantie évités par an", unite: "retours" }),
      cible: (c) => ({ attendu: acheterLesDeux(c).retoursEntiers, min: RETOURS_DU_CURSEUR.min, max: RETOURS_DU_CURSEUR.max }),
      zones: ["La ligne manuelle et le banc valent plus", "La ligne semi-automatique seule vaut plus"],
      rates: () => ({
        dessous: "Avec si peu de retours évités, la ligne semi-automatique seule vaut plus.",
        dessus: "Avec moins de retours évités, le programme vaut encore plus : cherchez le plus petit nombre.",
      }),
      montrer: "Montrer le seuil",
      lecture: (c, r) => {
        const k = acheterLesDeux(c);
        const vc = k.vanDuBanc(r);
        return [
          { libelle: "VAN du banc", montant: vc },
          { libelle: "VAN de la ligne manuelle et du banc", montant: auCentime(k.x.vanA + vc) },
          { libelle: "VAN de la ligne semi-automatique seule", montant: k.x.vanB },
          { libelle: "Avance du programme", montant: k.avance(r), fort: true },
        ];
      },
      droites: (c) => {
        const k = acheterLesDeux(c);
        return {
          produit: (r) => k.x.vanA + k.vanDuBanc(r),
          cout: () => k.x.vanB,
          libelles: ["VAN de la ligne manuelle et du banc", "VAN de la ligne semi-automatique seule"],
        };
      },
      explication: (c) => {
        const k = acheterLesDeux(c);
        return [
          `Les deux droites se croisent entre ${qte(k.retoursEntiers - 1)} et ${qte(k.retoursEntiers)} retours évités par an, pour ${qte(RETOURS_EVITES_PAR_AN)} prévus : l'hypothèse du banc a une marge d'environ ${pct(Math.round(k.margeDesRetours))}. En dessous, mieux vaudrait la ligne semi-automatique seule.`,
        ];
      },
    },
    {
      id: "a-rebours",
      type: "montants",
      titre: "Le seuil du banc, à rebours",
      notions: ["discounting"],
      question: (c) => {
        const k = acheterLesDeux(c);
        return `Retrouvez au centième le seuil du curseur. Calculez la VAN que le banc doit atteindre pour que le programme égale la ligne semi-automatique seule, le flux annuel du banc qui la donne sur ${qte(k.x.C.duree)} ans, puis les retours évités par an qu'il faut pour ce flux.`;
      },
      champs: (c) => {
        const k = acheterLesDeux(c);
        const x = k.x;
        const m = x.k.c.actifs[0]!;
        const dot = m.montant / m.dureeDAmortissement;
        const t = x.k.impot;
        return [
          { libelle: "VAN que le banc doit atteindre", attendu: k.vanVisee, calcul: `${eur(x.vanB)} − ${eur(x.vanA)} = ${eur(k.vanVisee)}`, tolerance: 1 },
          {
            libelle: "Flux annuel du banc nécessaire",
            attendu: k.fluxVise,
            calcul: `(${eur(k.vanVisee)} + ${eur(m.montant)}) ÷ ${k.annuite.toLocaleString("fr-FR", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}, l'annuité de ${qte(x.C.duree)} ans à ${pct(x.tauxPct)} = ${eur(k.fluxVise)}`,
            tolerance: Math.max(2, toleranceDActualisation([k.fluxVise])),
          },
          {
            libelle: "Retours évités par an, au minimum",
            attendu: k.retoursMinimaux,
            calcul: `flux = (retours × ${eur(COUT_D_UN_RETOUR)} − ${eur(ETALONNAGE_DU_BANC)} − ${eur(dot)} de dotation) × (1 − ${pct(t * 100)}) + ${eur(dot)} : ((${eur(k.fluxVise)} − ${eur(dot)}) ÷ ${qte(1 - t)} + ${eur(dot)} + ${eur(ETALONNAGE_DU_BANC)}) ÷ ${eur(COUT_D_UN_RETOUR)} = ${qte(k.retoursMinimaux)}`,
            tolerance: 0.1,
          },
        ];
      },
      explication: (c) => {
        const k = acheterLesDeux(c);
        return [
          `Le banc doit éviter au moins ${qte(k.retoursMinimaux)} retours par an, ${qte(Math.ceil(k.retoursMinimaux))} en pratique, pour que ${nomDuProgramme("AC")} vaillent la ligne semi-automatique seule. Le dossier en promet ${qte(RETOURS_EVITES_PAR_AN)} : une marge de ${pct(k.margeDesRetours)}, réelle mais mince. Si le taux de retour ne baisse pas autant qu'espéré, le choix se renverse.`,
        ];
      },
    },
    {
      id: "reponse",
      type: "choix",
      titre: "Votre réponse à la directrice générale",
      notions: ["discounting", "irr_payback"],
      question: () => "Quelle réponse envoyez-vous à la directrice générale ?",
      options: (c) => {
        const k = acheterLesDeux(c);
        const ok = k.verdict === "la-ligne-manuelle-et-le-banc";
        return [
          {
            texte: `${majuscule(nomDuProgramme("AC"))}, si le banc évite au moins ${qte(Math.ceil(k.retoursMinimaux))} retours par an`,
            juste: ok,
            retour: ok
              ? `Oui : dans ${eur(BUDGET_DU_CAS)}, ce programme crée ${eur(k.ac.van)}, ${eur(k.avanceDuProgramme)} de plus que la ligne semi-automatique seule. Mais son avance tient au banc : en dessous de ${qte(k.retoursMinimaux)} retours évités par an, sur ${qte(RETOURS_EVITES_PAR_AN)} prévus, la ligne semi-automatique seule redevient le meilleur choix. Un essai du banc avant l'achat vaudrait la peine.`
              : `Non : ce programme ne crée pas la plus forte VAN dans le budget.`,
          },
          {
            texte: "La ligne semi-automatique seule : le chapitre l'a retenue, c'est la plus forte VAN des deux lignes",
            juste: k.verdict === "la-ligne-semi-automatique-seule",
            retour:
              k.verdict === "la-ligne-semi-automatique-seule"
                ? `Oui : dans le budget, elle crée le plus de valeur, ${eur(k.b.van)}.`
                : `Non : c'est appliquer la règle des projets qui s'excluent hors de son cadre. Sous le budget, on compare des programmes : seule, la ligne semi-automatique crée ${eur(k.b.van)}, et laisse le banc de côté.`,
          },
          {
            texte: `Les deux machines quand même : il ne manque que ${eur(k.manque)}, la banque finira par les prêter`,
            juste: false,
            retour: `Non : c'est ignorer la contrainte. Avec ${eur(k.bc.mise)}, les deux machines créeraient ${eur(k.bc.van)}, mais la banque ne prête pas ce budget : le choix se fait dans ${eur(BUDGET_DU_CAS)}.`,
          },
          {
            texte: `${majuscule(nomDuProgramme("AC"))} : leurs indices de profitabilité sont les meilleurs, le reste ne compte pas`,
            juste: false,
            retour: `Non : le programme est le bon, la raison ne l'est pas. C'est sa VAN, ${eur(k.ac.van)}, qui le fait retenir, et elle repose sur le banc : en dessous de ${qte(k.retoursMinimaux)} retours évités par an, le choix se renverse. L'indice ne dit rien de ce risque.`,
          },
        ];
      },
    },
  ],
};
