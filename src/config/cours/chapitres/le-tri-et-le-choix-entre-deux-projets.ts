import { montantEcrit } from "../../../pedagogy/cours/correcteur";
import type { Cas } from "../cas";
import { auCentime } from "../monde/amortissement";
import { coefficientDActualisation, delaiDeRecuperationActualise, fluxDifferentiels, fluxDuProjet, indiceDeProfitabilite, tauxDeFisher, tri, van } from "../monde/finance";
import type { ProjetDInvestissement } from "../monde/projets-et-financement";
import type { Chapitre, TableauDeDonnees } from "../types";
import { ENTREPRISES_DES_PROJETS, dernierPositif, nomDeLaDate, projetsDe, toleranceDActualisation } from "./la-valeur-actuelle-nette";

/**
 * CHAPITRE : LE TAUX DE RENTABILITÉ INTERNE ET LE CHOIX ENTRE DEUX PROJETS (DSCG, UE2 Finance,
 * palier 4).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (src/config/cours/monde), pas dans l'arène : les projets
 * de NOVA ont une fiche figée (monde/projets-et-financement.ts), leurs flux et leurs critères se
 * calculent par le modèle du cours (monde/finance.ts : `fluxDuProjet`, `van`, `tri`, `tauxDeFisher`,
 * `indiceDeProfitabilite`, `delaiDeRecuperationActualise`). Une évolution du moteur ne change rien
 * ici.
 *
 * L'objet : deux façons de lancer la gamme Go et Studio, qui s'excluent (l'atelier n'a la place que
 * d'une ligne). Le projet A, celui du chapitre précédent, sur une seconde ligne manuelle ; le projet
 * B, sur une ligne semi-automatique, plus chère (150 000 €), avec un seul opérateur, plus
 * d'entretien et une meilleure revente. À 9 %, la VAN préfère B et le TRI préfère A : le taux de
 * Fisher (12,73 %) dit pourquoi, et la VAN tranche. Puis un troisième projet, indépendant, le banc
 * de mesure (C), pour l'indice de profitabilité et le rationnement du capital, et une critique du
 * TRI : son hypothèse de réinvestissement, que le TRI global corrige sans corriger la taille.
 *
 * LES TROIS TEMPS (demande du propriétaire, octobre 2026 : le niveau d'arrivée est celui du DSCG) :
 *   · guidé : intro, les-deux-van, encadrer-le-tri (la formule est au repère ou dans la question,
 *     qui nomme les chiffres) ;
 *   · l'expérience avant la formule (prédire, manipuler, constater, formaliser) :
 *     predire-le-croisement puis le-laboratoire-des-deux-lignes (le taux au pas de 0,1 point, les
 *     deux VAN en graphique, le réinvestissement au TRI ou au taux d'actualisation ; égaler les deux
 *     VAN) avant encadrer-le-tri et le-taux-de-fisher ; predire-l-entretien puis
 *     l-entretien-au-curseur (l'entretien de B qui égale les deux VAN) avant l-entretien-qui-egalise ;
 *   · autonome : le-tri-de-b, le-classement, les-indices (ni formule ni chiffres à prendre ; le
 *     calcul de la correction montre le chemin) ;
 *   · expert : le-taux-de-fisher (le conflit de la VAN et du TRI), l-entretien-qui-egalise (un calcul
 *     à rebours), le-rationnement et le-programme (l'indice de profitabilité sous un budget, et
 *     pourquoi son classement trompe avec des projets indivisibles), la-critique-du-tri (le TRI
 *     global de chaque projet et du différentiel) ; puis le-choix et la synthèse.
 *
 * CE QUI A DISPARU, AVEC L'ARÈNE : les deux machines du catalogue rejouées douze trimestres, les
 * taux trimestriels et leurs TRI de plus de 100 % par an, les entreprises où le classement ne
 * décidait rien.
 */

/** LE BUDGET DU RATIONNEMENT (hypothèse du cours) : ce que NOVA peut engager à la date 0, sa réserve et ce que la banque accepte de prêter. */
export const BUDGET_DU_RATIONNEMENT = 240_000;

/** L'écart admis entre les deux VAN au défi du laboratoire : les égaler à 100 € près, au pas de 0,1 point de taux. */
export const ECART_ADMIS_AU_DEFI = 100;

/** Le levier du taux du laboratoire, en pour cent : de 0 % à 25 %, au pas de 0,1 point. */
export const TAUX_DU_LABORATOIRE = { min: 0, max: 25, pas: 0.1 } as const;

/** Le levier à choix du laboratoire : où se replacent les flux intermédiaires. */
export const AU_TRI = 1;
export const AU_TAUX_D_ACTUALISATION = 2;

/** Les bornes du curseur de l'entretien de B, en euros par an. */
export const ENTRETIEN_DU_CURSEUR = { min: 10_000, max: 20_000 } as const;

/**
 * LE TRI GLOBAL (ou TRI intégré, ou TRI modifié) : les flux positifs se replacent au taux donné
 * jusqu'à la fin du projet ; un flux négatif après la date 0 s'ajoute à la mise, actualisé au même
 * taux. TRI global = (valeur acquise ÷ mise)^(1 ÷ durée) − 1. Il corrige l'hypothèse du TRI, qui
 * replace chaque flux à son propre taux. À proposer à monde/finance.ts si un autre chapitre en a
 * besoin.
 */
export function triGlobal(flux: readonly number[], taux: number) {
  const n = flux.length - 1;
  let mise = -flux[0]!;
  let valeurAcquise = 0;
  flux.forEach((f, k) => {
    if (k === 0) return;
    if (f < 0) mise += -f * coefficientDActualisation(taux, k);
    else valeurAcquise += f * (1 + taux) ** (n - k);
  });
  return { mise: auCentime(mise), valeurAcquise: auCentime(valeurAcquise), taux: (valeurAcquise / mise) ** (1 / n) - 1 };
}

/** Le projet avec un autre entretien annuel de sa ligne (le levier du curseur). */
export function avecLEntretien(p: ProjetDInvestissement, entretien: number): ProjetDInvestissement {
  return { ...p, charges: p.charges.map((ch) => (/entretien/.test(ch.libelle) ? { ...ch, montants: ch.montants.map(() => entretien) } : ch)) };
}

/**
 * COMPATIBILITÉ avec la mission « jouez » (jouez.ts, qu'il ne faut pas modifier) : elle nomme
 * l'équipement du projet B à acheter dans l'arène. Le chapitre ne lit plus le catalogue de l'arène :
 * il rend l'équipement du projet B de la fiche, la ligne semi-automatique, qui porte le nom de la
 * machine du catalogue de NOVA dans l'arène (« Ligne semi-automatique »).
 */
export function machineSuivante(code: string): { code: string; name: string } {
  const ligne = projetsDe({ code }).b.actifs[0]!;
  const nom = ligne.libelle.replace(/^(la|le|l')\s?/, "");
  return { code: projetsDe({ code }).b.code, name: nom.charAt(0).toUpperCase() + nom.slice(1) };
}

const eur = (x: number) => montantEcrit(x).replace(/^-/, "−");
const entre = (x: number) => (x < 0 ? `(${eur(x)})` : eur(x));
const qte = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−");
const pct = (x: number, d = 2) => `${x.toLocaleString("fr-FR", { maximumFractionDigits: d }).replace(/^-/, "−")} %`;
const auCentieme = (x: number) => Math.round(x * 100) / 100;
/** « de NOVA », « d'Escale » : l'élision devant une voyelle. */
const dE = (nom: string) => (/^[aeiouyéèêAEIOUYÉÈ]/.test(nom) ? `d'${nom}` : `de ${nom}`);

/** L'encadrement d'un taux qui annule une VAN entre deux taux entiers, et son interpolation linéaire. */
function encadrement(flux: readonly number[], taux: number) {
  const lo = Math.floor(taux * 100);
  const hi = lo + 1;
  const vanLo = van(flux, lo / 100);
  const vanHi = van(flux, hi / 100);
  return { exact: taux, pct: auCentieme(taux * 100), lo, hi, vanLo, vanHi, interpolation: auCentieme(lo + vanLo / (vanLo - vanHi)), tolerance: toleranceDActualisation(flux) };
}

export type Lettre = "A" | "B" | "C";

const calculs = new Map<string, ReturnType<typeof calculer>>();

/** Les deux lignes, le banc, leurs critères, et ce qui les départage (calculés une fois par entreprise). */
export function deuxLignes(c: Pick<Cas, "code">) {
  const deja = calculs.get(c.code);
  if (deja) return deja;
  const r = calculer(c);
  calculs.set(c.code, r);
  return r;
}

function calculer(c: Pick<Cas, "code">) {
  const k = projetsDe(c);
  const t = k.taux;
  const tauxPct = auCentieme(t * 100);
  const fl = (p: ProjetDInvestissement) => fluxDuProjet(p, { tauxDeLImpot: k.impot });
  const A = fl(k.a);
  const B = fl(k.b);
  const C = fl(k.c);
  const vanA = van(A.flux, t);
  const vanB = van(B.flux, t);
  const vanC = van(C.flux, t);
  const ecart = auCentime(vanB - vanA);
  const triA = tri(A.flux)!;
  const triB = tri(B.flux)!;
  const encA = encadrement(A.flux, triA);
  const encB = encadrement(B.flux, triB);
  const diff = fluxDifferentiels(A.flux, B.flux);
  const fisher = tauxDeFisher(A.flux, B.flux)!;
  const encF = encadrement(diff, fisher);
  const fisherPct = encF.pct;
  const vanAAuFisher = van(A.flux, fisherPct / 100);
  const vanBAuFisher = van(B.flux, fisherPct / 100);
  const ip = { A: indiceDeProfitabilite(A.flux, t), B: indiceDeProfitabilite(B.flux, t), C: indiceDeProfitabilite(C.flux, t) };
  const delaiA = delaiDeRecuperationActualise(A.flux, t)!;
  const delaiB = delaiDeRecuperationActualise(B.flux, t)!;
  // L'entretien de B : la VAN de B est affine dans l'entretien, (1 − t) × l'annuité par euro et par an.
  const entretienDeB = k.b.charges.find((ch) => /entretien/.test(ch.libelle))!.montants[0]!;
  const entretienDeA = k.a.charges.find((ch) => /entretien/.test(ch.libelle))!.montants[0]!;
  const annuite = Array.from({ length: B.duree }, (_, i) => coefficientDActualisation(t, i + 1)).reduce((s, x) => s + x, 0);
  const vanParMille = auCentime(1_000 * (1 - k.impot) * annuite);
  const entretienMax = auCentime(entretienDeB + ecart / ((1 - k.impot) * annuite));
  const vanDeBAvec = (e: number) => van(fl(avecLEntretien(k.b, e)).flux, t);
  const entretienEntier = dernierPositif((e) => vanDeBAvec(e) - vanA, ENTRETIEN_DU_CURSEUR.min, ENTRETIEN_DU_CURSEUR.max, entretienMax);
  // Le rationnement : les programmes qui tiennent dans le budget, A et B ne pouvant aller ensemble.
  const projets = { A: { f: A, van: vanA, mise: -A.flux[0]! }, B: { f: B, van: vanB, mise: -B.flux[0]! }, C: { f: C, van: vanC, mise: -C.flux[0]! } };
  const programmes = (["A", "B", "C", "AC", "BC"] as const).map((nom) => {
    const lettres = nom.split("") as Lettre[];
    return { nom, lettres, mise: auCentime(lettres.reduce((s, l) => s + projets[l].mise, 0)), van: auCentime(lettres.reduce((s, l) => s + projets[l].van, 0)) };
  });
  const possibles = programmes.filter((p) => p.mise <= BUDGET_DU_RATIONNEMENT);
  const meilleur = possibles.reduce((m, p) => (p.van > m.van ? p : m));
  // Le classement par l'indice : on prend les projets dans l'ordre de leur indice, tant que le budget et l'exclusion le permettent.
  const parIndice = (["A", "B", "C"] as const).slice().sort((x, y) => ip[y] - ip[x]);
  const retenusParIndice: Lettre[] = [];
  let engage = 0;
  for (const l of parIndice) {
    const exclu = (l === "A" && retenusParIndice.includes("B")) || (l === "B" && retenusParIndice.includes("A"));
    if (!exclu && engage + projets[l].mise <= BUDGET_DU_RATIONNEMENT) {
      retenusParIndice.push(l);
      engage += projets[l].mise;
    }
  }
  const nomParIndice = (["A", "B", "C"] as const).filter((l) => retenusParIndice.includes(l)).join("");
  const programmeParIndice = programmes.find((p) => p.nom === nomParIndice)!;
  // La critique du TRI : le TRI global, les flux replacés au taux d'actualisation.
  const globalA = triGlobal(A.flux, t);
  const globalB = triGlobal(B.flux, t);
  const globalDiff = triGlobal(diff, t);
  // Le défi du laboratoire : la position du taux, sur le pas, où les deux VAN sont les plus proches.
  const pas = TAUX_DU_LABORATOIRE.pas;
  const positions = Array.from({ length: Math.round((TAUX_DU_LABORATOIRE.max - TAUX_DU_LABORATOIRE.min) / pas) + 1 }, (_, i) => auCentieme(TAUX_DU_LABORATOIRE.min + i * pas));
  const ecartAuTaux = (x: number) => auCentime(van(B.flux, x / 100) - van(A.flux, x / 100));
  const tauxDuDefi = positions.reduce((m, x) => (Math.abs(ecartAuTaux(x)) < Math.abs(ecartAuTaux(m)) ? x : m));
  const vanPrefere: Lettre = vanB > vanA ? "B" : "A";
  const triPrefere: Lettre = triB > triA ? "B" : "A";
  return {
    k,
    entreprise: k.entreprise,
    t,
    tauxPct,
    A,
    B,
    C,
    vanA,
    vanB,
    vanC,
    ecart,
    triA,
    triB,
    triAPct: encA.pct,
    triBPct: encB.pct,
    encA,
    encB,
    diff,
    fisher,
    encF,
    fisherPct,
    vanAAuFisher,
    vanBAuFisher,
    ip,
    ipPct: { A: auCentieme(ip.A), B: auCentieme(ip.B), C: auCentieme(ip.C) },
    delaiA: auCentieme(delaiA),
    delaiB: auCentieme(delaiB),
    entretienDeA,
    entretienDeB,
    annuite,
    vanParMille,
    entretienMax,
    vanDeBAvec,
    entretienEntier,
    programmes,
    possibles,
    meilleur,
    parIndice,
    programmeParIndice,
    laisseParIndice: auCentime(BUDGET_DU_RATIONNEMENT - programmeParIndice.mise),
    globalA,
    globalB,
    globalDiff,
    globalAPct: auCentieme(globalA.taux * 100),
    globalBPct: auCentieme(globalB.taux * 100),
    globalDiffPct: auCentieme(globalDiff.taux * 100),
    ecartAuTaux,
    tauxDuDefi,
    vanPrefere,
    triPrefere,
    conflit: vanPrefere !== triPrefere,
    retenu: (Math.max(vanA, vanB) > 0 ? vanPrefere : null) as Lettre | null,
  };
}

export type DeuxLignes = ReturnType<typeof deuxLignes>;

/** La lecture du laboratoire : les deux VAN au taux choisi, et le rendement de chaque projet selon le réinvestissement. */
export function laboratoireDesDeuxLignes(x: DeuxLignes, pos: Readonly<Record<string, number>>) {
  const t = pos.taux! / 100;
  const vanA = van(x.A.flux, t);
  const vanB = van(x.B.flux, t);
  const auTri = pos.reinvestissement === AU_TRI;
  return {
    vanA,
    vanB,
    ecart: auCentime(vanB - vanA),
    rendementA: auCentieme((auTri ? x.triA : triGlobal(x.A.flux, t).taux) * 100),
    rendementB: auCentieme((auTri ? x.triB : triGlobal(x.B.flux, t).taux) * 100),
  };
}

/** Les flux de trésorerie disponibles des deux lignes, date par date : le document de départ. */
export function tableauDesDeuxLignes(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = deuxLignes(c);
  return {
    titre: `Les flux de trésorerie disponibles des deux lignes ${dE(x.entreprise)}`,
    colonnes: ["Projet A, ligne manuelle", "Projet B, ligne semi-automatique"],
    lignes: x.A.flux.map((f, d) => ({ libelle: nomDeLaDate(d), valeurs: [eur(f), eur(x.B.flux[d]!)] })),
  };
}

/** Les trois projets de NOVA, leur mise et leur VAN : le document du rationnement. */
export function tableauDesTroisProjets(c: Pick<Cas, "code">): TableauDeDonnees {
  const x = deuxLignes(c);
  const ligne = (l: Lettre, nom: string) => {
    const p = l === "A" ? x.A : l === "B" ? x.B : x.C;
    const v = l === "A" ? x.vanA : l === "B" ? x.vanB : x.vanC;
    return { libelle: `Projet ${l}, ${nom}`, valeurs: [eur(-p.flux[0]!), eur(v)] };
  };
  return {
    titre: `Les trois projets de ${x.entreprise}`,
    colonnes: ["Mise de la date 0", `VAN à ${pct(x.tauxPct)}`],
    lignes: [ligne("A", "ligne manuelle"), ligne("B", "ligne semi-automatique"), ligne("C", x.k.c.nom)],
  };
}

const NOMS_DES_PROGRAMMES: Readonly<Record<string, string>> = {
  A: "la ligne manuelle seule",
  B: "la ligne semi-automatique seule",
  C: "le banc seul",
  AC: "la ligne manuelle et le banc",
  BC: "la ligne semi-automatique et le banc",
};
export const nomDuProgramme = (nom: string) => NOMS_DES_PROGRAMMES[nom] ?? nom;
const duProjet = (l: Lettre) => `du projet ${l}`;

export const LE_TRI_ET_LE_CHOIX_ENTRE_DEUX_PROJETS: Chapitre = {
  code: "le-tri-et-le-choix-entre-deux-projets",
  parcours: "dscg-finance",
  palier: 4,
  blocs: ["DSCG UE2 · Finance"],
  titre: "Le taux de rentabilité interne et le choix entre deux projets",
  accroche:
    "Deux lignes pour une seule place : la manuelle a le meilleur TRI, la semi-automatique la meilleure VAN. Le laboratoire fait monter le taux jusqu'à ce qu'elles s'égalent, le taux de Fisher dit pourquoi elles divergent, puis un budget limité et un troisième projet mettent l'indice de profitabilité et le TRI à l'épreuve.",
  objectifs: [
    "Encadrer le TRI d'un projet entre deux taux et l'interpoler",
    "Expliquer le conflit entre la VAN et le TRI par le taux d'intersection de Fisher",
    "Retrouver à rebours la charge qui égale les VAN de deux projets",
    "Calculer l'indice de profitabilité et le délai de récupération actualisé, et choisir un programme sous un budget",
    "Critiquer le TRI par le TRI global, et choisir entre deux projets qui s'excluent",
  ],
  libre: false,
  prerequis: ["la-valeur-actuelle-nette"],
  entreprises: {
    codes: ENTREPRISES_DES_PROJETS,
    pourquoi:
      "ce chapitre compare les deux lignes sur lesquelles NOVA, le fabricant d'enceintes du cours, peut lancer sa gamme Go et Studio : ses projets sont les seuls que la simulation du cours chiffre en entier, flux, impôt et BFR compris.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Deux lignes, une seule place",
      notions: ["irr_payback", "discounting"],
      tableau: tableauDesDeuxLignes,
      texte: (c) => {
        const x = deuxLignes(c);
        const la = x.k.a.actifs[0]!;
        const lb = x.k.b.actifs[0]!;
        return [
          `Ce chapitre se joue dans la simulation du cours, chez ${x.entreprise}, qui lance en N+1 sa gamme Go et Studio. Le projet A est celui du chapitre précédent : ${la.libelle}, ${eur(la.montant)}, 2 opérateurs de plus, ${eur(x.entretienDeA)} d'entretien par an, revendue ${pct(la.tauxDeReprise * 100)} de sa valeur nette comptable. Le projet B vend la même gamme sur ${lb.libelle} : ${eur(lb.montant)}, un seul opérateur, ${eur(x.entretienDeB)} d'entretien par an, revendue ${pct(lb.tauxDeReprise * 100)} de sa valeur nette comptable.`,
          `L'atelier n'a la place que d'une ligne : les deux projets s'excluent. Le tableau donne leurs flux de trésorerie disponibles, calculés comme au chapitre précédent : impôt de ${pct(x.k.impot * 100)} sur le résultat d'exploitation, BFR de ${pct(x.k.a.partDuBfr * 100)} du chiffre d'affaires, valeur résiduelle nette d'impôt à la fin. Le taux d'actualisation est de ${pct(x.tauxPct)}.`,
          "Deux critères vont les juger : la VAN, en euros d'aujourd'hui, et le taux de rentabilité interne, le taux qui annule la VAN. Quand ils ne désignent pas le même projet, il faut savoir pourquoi, et lequel croire.",
        ];
      },
      repere: () =>
        "Le TRI est le taux d'actualisation qui annule la VAN. Un projet seul est acceptable si sa VAN est positive, c'est-à-dire si son TRI dépasse le taux d'actualisation.",
    },
    {
      id: "les-deux-van",
      objectifs: [0, 1],
      type: "montants",
      titre: "La VAN de chaque ligne",
      notions: ["discounting"],
      question: (c) => {
        const x = deuxLignes(c);
        return `Actualisez à ${pct(x.tauxPct)} les flux de chaque projet : VAN = somme des flux de la date k × (1 + ${pct(x.tauxPct)})^(−k). Calculez la VAN du projet A, celle du projet B, puis ce que B crée de plus que le projet A.`;
      },
      champs: (c) => {
        const x = deuxLignes(c);
        const somme = (f: readonly number[]) => `${f.map((y, d) => `${entre(y)} × ${coefficientDActualisation(x.t, d).toLocaleString("fr-FR", { minimumFractionDigits: 4, maximumFractionDigits: 4 })}`).join(" + ")}`;
        return [
          { libelle: "VAN du projet A", attendu: x.vanA, calcul: `${somme(x.A.flux)} = ${eur(x.vanA)}`, tolerance: toleranceDActualisation(x.A.flux) },
          { libelle: "VAN du projet B", attendu: x.vanB, calcul: `${somme(x.B.flux)} = ${eur(x.vanB)}`, tolerance: toleranceDActualisation(x.B.flux) },
          {
            libelle: "Ce que B crée de plus que le projet A",
            attendu: x.ecart,
            calcul: `${eur(x.vanB)} − ${eur(x.vanA)} = ${eur(x.ecart)}`,
            tolerance: toleranceDActualisation(x.A.flux) + toleranceDActualisation(x.B.flux),
          },
        ];
      },
      explication: (c) => {
        const x = deuxLignes(c);
        return [
          `Les deux VAN sont positives : chaque ligne, seule, créerait de la valeur. B crée ${eur(x.ecart)} de plus : la ligne semi-automatique coûte ${eur(-x.diff[0]!)} de plus à la date 0, mais elle économise un opérateur chaque année et se revend mieux.`,
        ];
      },
    },
    {
      id: "predire-le-croisement",
      objectifs: [1],
      type: "choix",
      titre: "Pariez sur le taux",
      notions: ["discounting", "irr_payback"],
      question: (c) => {
        const x = deuxLignes(c);
        return `Avant de calculer, pariez. B coûte ${eur(-x.diff[0]!)} de plus à la date 0 et rend ${eur(x.diff[1]!)} de plus chaque année. À ${pct(x.tauxPct)}, il crée ${eur(x.ecart)} de plus. Si le taux d'actualisation monte, cette avance…`;
      },
      options: (c) => {
        const x = deuxLignes(c);
        const voir = "Le laboratoire de l'étape suivante fait monter le taux : regardez les deux courbes.";
        const croise = x.fisher > x.t && x.fisher * 100 <= TAUX_DU_LABORATOIRE.max;
        const pari = (texte: string, juste: boolean) => ({ texte, juste, retour: `${juste ? "Bon pari" : "Pari à vérifier"}. ${voir}` });
        return [
          pari("Fond, puis s'inverse : B attend plus longtemps le retour d'une mise plus lourde", croise),
          pari("Grandit : B a les plus gros flux, et ils pèsent plus quand le taux monte", false),
          pari("Ne bouge pas : les deux lignes vendent la même gamme", !croise),
        ];
      },
    },
    {
      id: "le-laboratoire-des-deux-lignes",
      objectifs: [1],
      type: "simulation",
      titre: "Le laboratoire des deux lignes",
      notions: ["irr_payback", "discounting"],
      question: () =>
        "Faites monter et descendre le taux d'actualisation, au dixième de point. Le tableau suit les deux VAN, et le rendement de chaque projet : son TRI, ou, si vous replacez ses flux au taux d'actualisation, son TRI global. Le graphique trace les deux VAN selon le taux. Relevez le défi.",
      leviers: (c) => {
        const x = deuxLignes(c);
        return [
          { code: "taux", libelle: "Taux d'actualisation", unite: "%", ...TAUX_DU_LABORATOIRE, depart: x.tauxPct },
          {
            code: "reinvestissement",
            libelle: "Les flux de chaque projet se replacent",
            unite: "",
            min: AU_TRI,
            max: AU_TAUX_D_ACTUALISATION,
            pas: 1,
            depart: AU_TRI,
            choix: [
              { valeur: AU_TRI, libelle: "au TRI du projet" },
              { valeur: AU_TAUX_D_ACTUALISATION, libelle: "au taux d'actualisation" },
            ],
          },
        ];
      },
      lecture: (c, pos) => {
        const x = deuxLignes(c);
        const l = laboratoireDesDeuxLignes(x, pos);
        const d = laboratoireDesDeuxLignes(x, { taux: x.tauxPct, reinvestissement: AU_TRI });
        return [
          { libelle: "VAN du projet A", montant: l.vanA, reference: d.vanA },
          { libelle: "VAN du projet B", montant: l.vanB, reference: d.vanB },
          { libelle: "Ce que B crée de plus que le projet A", montant: l.ecart, reference: d.ecart, effet: true, fort: true },
          { libelle: "Rendement du projet A", montant: l.rendementA, reference: d.rendementA, unite: "%" },
          { libelle: "Rendement du projet B", montant: l.rendementB, reference: d.rendementB, unite: "%" },
        ];
      },
      graphique: (c) => {
        const x = deuxLignes(c);
        return {
          levier: "taux",
          courbes: [
            { libelle: "VAN du projet A", valeur: (pos) => van(x.A.flux, pos.taux! / 100) },
            { libelle: "VAN du projet B", valeur: (pos) => van(x.B.flux, pos.taux! / 100) },
          ],
        };
      },
      defi: (c) => {
        const x = deuxLignes(c);
        return {
          consigne: `Trouvez le taux où les deux VAN s'égalent, à ${eur(ECART_ADMIS_AU_DEFI)} près.`,
          atteint: (pos) => Math.abs(x.ecartAuTaux(pos.taux!)) <= ECART_ADMIS_AU_DEFI,
          indice: (pos) => {
            const e = x.ecartAuTaux(pos.taux!);
            return e > 0
              ? `À ${pct(pos.taux!, 1)}, B crée encore ${eur(e)} de plus : montez le taux.`
              : `À ${pct(pos.taux!, 1)}, le projet A crée ${eur(-e)} de plus : vous êtes allé trop loin, baissez le taux.`;
          },
          solution: { taux: x.tauxDuDefi, reinvestissement: AU_TRI },
        };
      },
      explication: (c, pos) => {
        const x = deuxLignes(c);
        const l = laboratoireDesDeuxLignes(x, pos);
        const g = laboratoireDesDeuxLignes(x, { taux: pos.taux!, reinvestissement: AU_TAUX_D_ACTUALISATION });
        return [
          `À ${pct(pos.taux!, 1)}, les deux VAN se rejoignent : ${eur(l.vanA)} pour le projet A, ${eur(l.vanB)} pour B. C'est le taux d'intersection de Fisher. Sous lui, B crée le plus de valeur ; au-dessus, le projet A. Le taux d'actualisation de ${x.entreprise}, ${pct(x.tauxPct)}, est dessous : la VAN choisit B.`,
          `Le TRI, lui, ne bouge pas avec le taux : ${pct(x.triAPct)} pour le projet A, ${pct(x.triBPct)} pour B. Il préfère le projet A à tout taux, parce qu'il suppose chaque flux replacé au TRI du projet. Replacez-les au taux d'actualisation : à ${pct(pos.taux!, 1)}, le TRI global vaut ${pct(g.rendementA)} pour le projet A et ${pct(g.rendementB)} pour B. Le projet A garde l'avantage : un taux mesure un rendement par euro, pas les euros créés.`,
        ];
      },
    },
    {
      id: "encadrer-le-tri",
      objectifs: [0],
      type: "montants",
      titre: "Encadrer le TRI du projet A",
      notions: ["irr_payback"],
      question: (c) => {
        const x = deuxLignes(c);
        const e = x.encA;
        return `Le TRI du projet A est le taux qui annule sa VAN. Encadrez-le : calculez la VAN du projet A à ${pct(e.lo)} et à ${pct(e.hi)}, puis interpolez linéairement, TRI ≈ ${pct(e.lo)} + VAN à ${pct(e.lo)} ÷ (VAN à ${pct(e.lo)} − VAN à ${pct(e.hi)}).`;
      },
      champs: (c) => {
        const x = deuxLignes(c);
        const e = x.encA;
        return [
          { libelle: `VAN du projet A à ${pct(e.lo)}`, attendu: e.vanLo, calcul: `les flux du projet A actualisés à ${pct(e.lo)} : ${eur(e.vanLo)}`, tolerance: e.tolerance },
          { libelle: `VAN du projet A à ${pct(e.hi)}`, attendu: e.vanHi, calcul: `au même calcul, à ${pct(e.hi)} : ${eur(e.vanHi)}`, tolerance: e.tolerance },
          {
            libelle: "TRI du projet A, par interpolation (%)",
            attendu: e.interpolation,
            calcul: `${qte(e.lo)} + ${eur(e.vanLo)} ÷ (${eur(e.vanLo)} − ${entre(e.vanHi)}) = ${pct(e.interpolation)}`,
            tolerance: 0.02,
          },
        ];
      },
      explication: (c) => {
        const x = deuxLignes(c);
        const e = x.encA;
        return [
          `La VAN change de signe entre ${pct(e.lo)} et ${pct(e.hi)} : le TRI est entre les deux. La simulation le cherche par dichotomie, en coupant l'intervalle en deux et en gardant la moitié où la VAN change de signe : ${pct(e.pct)}. L'interpolation le donne à ${e.interpolation === e.pct ? "l'arrondi près" : `${pct(auCentieme(Math.abs(e.interpolation - e.pct)))} près`} : entre deux taux si proches, la VAN est presque une droite.`,
          `Le TRI du projet A, ${pct(e.pct)}, dépasse le taux d'actualisation, ${pct(x.tauxPct)} : la ligne manuelle, seule, est acceptable, comme sa VAN positive le disait.`,
        ];
      },
    },
    {
      id: "le-tri-de-b",
      objectifs: [0],
      type: "montants",
      titre: "Le TRI du projet B",
      notions: ["irr_payback"],
      question: () => "Sans formule cette fois. Encadrez le TRI de B entre deux taux entiers, puis interpolez.",
      champs: (c) => {
        const x = deuxLignes(c);
        const e = x.encB;
        return [
          { libelle: "Taux entier juste sous le TRI de B (%)", attendu: e.lo, calcul: `la VAN de B est positive à ${pct(e.lo)} (${eur(e.vanLo)}) et négative à ${pct(e.hi)} (${eur(e.vanHi)}) : ${pct(e.lo)}`, tolerance: 0.01 },
          { libelle: "VAN de B à ce taux", attendu: e.vanLo, calcul: `les flux de B actualisés à ${pct(e.lo)} : ${eur(e.vanLo)}`, tolerance: e.tolerance },
          {
            libelle: "TRI de B, par interpolation (%)",
            attendu: e.interpolation,
            calcul: `${qte(e.lo)} + ${eur(e.vanLo)} ÷ (${eur(e.vanLo)} − ${entre(e.vanHi)}) = ${pct(e.interpolation)}`,
            tolerance: 0.02,
          },
        ];
      },
      explication: (c) => {
        const x = deuxLignes(c);
        return [
          `Le TRI de B, ${pct(x.triBPct)}, dépasse lui aussi ${pct(x.tauxPct)} : B, seul, serait acceptable. Mais il est sous celui du projet A, ${pct(x.triAPct)}, alors que sa VAN est la plus forte.`,
        ];
      },
    },
    {
      id: "le-classement",
      objectifs: [1],
      type: "choix",
      titre: "Les deux critères classent-ils pareil ?",
      notions: ["irr_payback", "discounting"],
      question: (c) => {
        const x = deuxLignes(c);
        return `Projet A : VAN de ${eur(x.vanA)}, TRI de ${pct(x.triAPct)}. Projet B : VAN de ${eur(x.vanB)}, TRI de ${pct(x.triBPct)}. À ${pct(x.tauxPct)}, que disent les deux critères ?`;
      },
      options: (c) => {
        const x = deuxLignes(c);
        const v = x.vanPrefere;
        const t = x.triPrefere;
        const non = `Non : la VAN préfère le projet ${v}, le TRI le projet ${t}.`;
        const option = (texte: string, vv: Lettre, tt: Lettre, oui: string) => ({ texte, juste: v === vv && t === tt, retour: v === vv && t === tt ? oui : non });
        return [
          option("La VAN préfère B, le TRI préfère le projet A", "B", "A", `Oui : le projet A rend plus par euro investi, B rapporte plus d'euros. Il investit ${eur(-x.diff[0]!)} de plus, et ce supplément rapporte encore plus que ${pct(x.tauxPct)}.`),
          option("La VAN préfère le projet A, le TRI préfère B", "A", "B", "Oui : B rend plus par euro investi, mais le projet A crée plus de valeur."),
          option("Les deux critères préfèrent le projet A", "A", "A", "Oui : le projet A a la plus forte VAN et le plus fort TRI."),
          option("Les deux critères préfèrent B", "B", "B", "Oui : B a la plus forte VAN et le plus fort TRI."),
        ];
      },
    },
    {
      id: "le-taux-de-fisher",
      objectifs: [1],
      type: "montants",
      titre: "Le taux d'intersection de Fisher",
      notions: ["irr_payback", "discounting"],
      question: (c) => {
        const x = deuxLignes(c);
        return `Le laboratoire a situé le croisement vers ${pct(x.tauxDuDefi, 1)}. Calculez-le : c'est le TRI des flux différentiels, B moins le projet A. Donnez le flux différentiel des dates 1 à 4, celui de la date ${x.B.duree}, le taux de Fisher, puis la VAN du projet A à ce taux arrondi au centième de point.`;
      },
      champs: (c) => {
        const x = deuxLignes(c);
        const n = x.B.duree;
        const e = x.encF;
        return [
          { libelle: "Flux différentiel des dates 1 à 4", attendu: x.diff[1]!, calcul: `${eur(x.B.flux[1]!)} − ${entre(x.A.flux[1]!)} = ${eur(x.diff[1]!)}, le même chaque année : B économise un opérateur, paie plus d'entretien et amortit plus` },
          { libelle: `Flux différentiel de la date ${n}`, attendu: x.diff[n]!, calcul: `${eur(x.B.flux[n]!)} − ${eur(x.A.flux[n]!)} = ${eur(x.diff[n]!)}, la meilleure revente de B comprise` },
          {
            libelle: "Taux de Fisher (%)",
            attendu: x.fisherPct,
            calcul: `la VAN des flux différentiels vaut ${eur(e.vanLo)} à ${pct(e.lo)} et ${eur(e.vanHi)} à ${pct(e.hi)} : ${qte(e.lo)} + ${eur(e.vanLo)} ÷ (${eur(e.vanLo)} − ${entre(e.vanHi)}) = ${pct(e.interpolation)} ; la dichotomie donne ${pct(x.fisherPct)}`,
            tolerance: 0.02,
          },
          {
            libelle: `VAN du projet A à ${pct(x.fisherPct)}`,
            attendu: x.vanAAuFisher,
            calcul: `les flux du projet A actualisés à ${pct(x.fisherPct)} : ${eur(x.vanAAuFisher)} ; ceux de B y valent ${eur(x.vanBAuFisher)}`,
            tolerance: toleranceDActualisation(x.A.flux),
          },
        ];
      },
      explication: (c) => {
        const x = deuxLignes(c);
        return [
          `Au taux de Fisher, ${pct(x.fisherPct)}, les deux projets valent autant, à l'arrondi du taux près. Investir dans B plutôt que dans le projet A, c'est investir ${eur(-x.diff[0]!)} de plus pour ${eur(x.diff[1]!)} de plus par an : ce supplément rapporte ${pct(x.fisherPct)}. Tant que les capitaux coûtent moins, ici ${pct(x.tauxPct)}, il vaut la peine : la VAN choisit B.`,
          "Le conflit vient de deux différences : la taille (B immobilise plus) et le profil (ses flux en plus arrivent plus tard, avec la revente). Le TRI les ignore, la VAN au taux d'actualisation les pèse.",
        ];
      },
    },
    {
      id: "predire-l-entretien",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur l'entretien",
      notions: ["discounting"],
      question: (c) => {
        const x = deuxLignes(c);
        return `Le fournisseur de la ligne semi-automatique propose un contrat d'entretien plus complet, plus cher que les ${eur(x.entretienDeB)} par an de la fiche. Pariez : jusqu'où l'entretien de B peut-il monter avant que B ne vaille plus que le projet A ?`;
      },
      options: (c) => {
        const x = deuxLignes(c);
        const m = x.entretienMax;
        const voir = "Le curseur de l'étape suivante fait monter l'entretien : regardez où les deux VAN se croisent.";
        const pari = (texte: string, juste: boolean) => ({ texte, juste, retour: `${juste ? "Bon pari" : "Pari à vérifier"}. ${voir}` });
        return [
          pari("Jusqu'à 11 000 € environ : l'avance de B est mince", m < 12_000),
          pari("Jusqu'à 13 000 € ou 14 000 €", m >= 12_000 && m < 15_000),
          pari("Jusqu'à 20 000 € et plus : l'avance de B est large", m >= 15_000),
        ];
      },
    },
    {
      id: "l-entretien-au-curseur",
      objectifs: [2],
      type: "curseur",
      titre: "Faites monter l'entretien de B",
      notions: ["discounting"],
      question: (c) => {
        const x = deuxLignes(c);
        return `Faites monter l'entretien annuel de la ligne semi-automatique, de ${eur(ENTRETIEN_DU_CURSEUR.min)} à ${eur(ENTRETIEN_DU_CURSEUR.max)}. Une droite donne la VAN de B, l'autre celle du projet A, ${eur(x.vanA)}, qui ne bouge pas. Placez le curseur sur l'entretien le plus élevé où B vaut encore au moins autant, puis validez.`;
      },
      grandeur: () => ({ libelle: "Entretien annuel de la ligne semi-automatique", unite: "€ par an" }),
      sens: "plus-grande",
      cible: (c) => ({ attendu: deuxLignes(c).entretienEntier, min: ENTRETIEN_DU_CURSEUR.min, max: ENTRETIEN_DU_CURSEUR.max }),
      zones: ["B vaut plus que le projet A", "Le projet A vaut plus que B"],
      rates: () => ({
        dessous: "B vaut encore plus : l'entretien peut monter davantage.",
        dessus: "À cet entretien, B vaut déjà moins que le projet A.",
      }),
      montrer: "Montrer le croisement",
      lecture: (c, e) => {
        const x = deuxLignes(c);
        const v = x.vanDeBAvec(e);
        return [
          { libelle: "VAN du projet B", montant: v },
          { libelle: "VAN du projet A", montant: x.vanA },
          { libelle: "Ce que B crée de plus que le projet A", montant: auCentime(v - x.vanA), fort: true },
        ];
      },
      droites: (c) => {
        const x = deuxLignes(c);
        return { produit: (e) => x.vanDeBAvec(e), cout: () => x.vanA, libelles: ["VAN du projet B", "VAN du projet A"] };
      },
      explication: (c) => {
        const x = deuxLignes(c);
        return [
          `Les deux droites se croisent vers ${eur(x.entretienEntier)} par an : l'entretien de B peut monter d'environ ${pct(Math.round((x.entretienMax / x.entretienDeB - 1) * 100))} avant que son avance ne disparaisse. Chaque euro d'entretien annuel en plus coûte ${eur(auCentime(1 - x.k.impot))} après impôt, ${qte(x.B.duree)} ans de suite : la VAN de B est une droite de l'entretien.`,
          "C'est ce que l'étape suivante fait calculer à rebours, au centime.",
        ];
      },
    },
    {
      id: "l-entretien-qui-egalise",
      objectifs: [2],
      type: "montants",
      titre: "L'entretien qui égale les deux VAN",
      notions: ["discounting"],
      question: (c) => {
        const x = deuxLignes(c);
        return `Retrouvez à rebours le croisement du curseur. Un entretien en plus se déduit de l'impôt, et se paie chaque année pendant ${qte(x.B.duree)} ans. Calculez le flux après impôt que coûtent 1 000 € d'entretien de plus par an, la VAN qu'ils retirent à B, puis l'entretien annuel de B qui égale les deux VAN.`;
      },
      champs: (c) => {
        const x = deuxLignes(c);
        const coefs = Array.from({ length: x.B.duree }, (_, i) => coefficientDActualisation(x.t, i + 1));
        const annuite = coefs.reduce((s, y) => s + y, 0);
        return [
          { libelle: "Flux après impôt que coûtent 1 000 € d'entretien par an", attendu: auCentime(1_000 * (1 - x.k.impot)), calcul: `1 000 € × (1 − ${pct(x.k.impot * 100)}) = ${eur(auCentime(1_000 * (1 - x.k.impot)))}` },
          {
            libelle: "VAN retirée par 1 000 € d'entretien par an",
            attendu: x.vanParMille,
            calcul: `${eur(auCentime(1_000 * (1 - x.k.impot)))} × (1 − (1 + ${pct(x.tauxPct)})^(−${x.B.duree})) ÷ ${pct(x.tauxPct)} = ${eur(auCentime(1_000 * (1 - x.k.impot)))} × ${annuite.toLocaleString("fr-FR", { minimumFractionDigits: 4, maximumFractionDigits: 4 })} = ${eur(x.vanParMille)}`,
            tolerance: 1,
          },
          {
            libelle: "Entretien annuel de B qui égale les deux VAN",
            attendu: x.entretienMax,
            calcul: `${eur(x.entretienDeB)} + ${eur(x.ecart)} ÷ ${eur(x.vanParMille)} × 1 000 = ${eur(x.entretienMax)}`,
            tolerance: 1,
          },
        ];
      },
      explication: (c) => {
        const x = deuxLignes(c);
        return [
          `À ${eur(x.entretienMax)} d'entretien par an, B ne crée plus rien de plus que le projet A : les ${eur(x.ecart)} d'avance de sa VAN sont mangés par ${eur(auCentime(x.entretienMax - x.entretienDeB))} d'entretien en plus chaque année. C'est la marge de négociation de ${x.entreprise} face au fournisseur de B.`,
          "Une charge annuelle constante se compte par l'annuité : sa valeur actuelle est le flux après impôt × (1 − (1 + t)^(−n)) ÷ t.",
        ];
      },
    },
    {
      id: "les-indices",
      objectifs: [3],
      type: "montants",
      titre: "Indice de profitabilité et délai actualisé",
      notions: ["irr_payback", "discounting"],
      question: () =>
        "L'indice de profitabilité rapporte à la mise de la date 0, BFR de départ compris, ce que rendent les flux qui suivent, actualisés. Calculez-le pour chaque ligne, puis son délai de récupération actualisé, en années, en interpolant dans l'année où les flux actualisés cumulés repassent à zéro.",
      champs: (c) => {
        const x = deuxLignes(c);
        const ipCalc = (v: number, f: readonly number[], ipp: number) => `(${eur(v)} + ${eur(-f[0]!)}) ÷ ${eur(-f[0]!)} = ${qte(ipp)}`;
        return [
          { libelle: "Indice de profitabilité du projet A", attendu: x.ipPct.A, calcul: ipCalc(x.vanA, x.A.flux, x.ipPct.A), tolerance: 0.01 },
          { libelle: "Indice de profitabilité de B", attendu: x.ipPct.B, calcul: ipCalc(x.vanB, x.B.flux, x.ipPct.B), tolerance: 0.01 },
          { libelle: "Délai de récupération actualisé du projet A (années)", attendu: x.delaiA, calcul: `les flux actualisés cumulés repassent à zéro au cours de l'année ${Math.ceil(x.delaiA)} : ${qte(x.delaiA)} ans`, tolerance: 0.02 },
          { libelle: "Délai de récupération actualisé de B (années)", attendu: x.delaiB, calcul: `les flux actualisés cumulés repassent à zéro au cours de l'année ${Math.ceil(x.delaiB)} : ${qte(x.delaiB)} ans`, tolerance: 0.02 },
        ];
      },
      explication: (c) => {
        const x = deuxLignes(c);
        return [
          `Chaque euro engagé dans le projet A en rend ${qte(x.ipPct.A)} en valeur actuelle, contre ${qte(x.ipPct.B)} pour B ; le projet A récupère sa mise en ${qte(x.delaiA)} ans, B en ${qte(x.delaiB)}. Comme le TRI, l'indice et le délai mesurent un rendement ou une vitesse, pas les euros créés : ils préfèrent le projet A.`,
          "Le délai dit le risque d'attendre, il ignore tout ce qui vient après. L'indice, lui, a un vrai usage : quand le capital manque pour tout financer.",
        ];
      },
    },
    {
      id: "le-rationnement",
      objectifs: [3],
      type: "montants",
      titre: "Un budget limité, un troisième projet",
      notions: ["irr_payback", "discounting"],
      tableau: tableauDesTroisProjets,
      question: (c) => {
        const x = deuxLignes(c);
        return `${x.entreprise} reprend aussi le projet C, ${x.k.c.nom}, indépendant des deux lignes. Hypothèse du cours : elle ne peut engager que ${eur(BUDGET_DU_RATIONNEMENT)} à la date 0, et chaque projet se fait en entier ou pas du tout. Calculez l'indice de profitabilité du projet C, puis la VAN des deux programmes qui associent une ligne et le banc.`;
      },
      champs: (c) => {
        const x = deuxLignes(c);
        const ac = x.programmes.find((p) => p.nom === "AC")!;
        const bc = x.programmes.find((p) => p.nom === "BC")!;
        return [
          { libelle: "Indice de profitabilité du projet C", attendu: x.ipPct.C, calcul: `(${eur(x.vanC)} + ${eur(-x.C.flux[0]!)}) ÷ ${eur(-x.C.flux[0]!)} = ${qte(x.ipPct.C)}`, tolerance: 0.01 },
          { libelle: "VAN de la ligne manuelle et du banc", attendu: ac.van, calcul: `${eur(x.vanA)} + ${eur(x.vanC)} = ${eur(ac.van)}, pour ${eur(ac.mise)} engagés`, tolerance: 1 },
          { libelle: "VAN de la ligne semi-automatique et du banc", attendu: bc.van, calcul: `${eur(x.vanB)} + ${eur(x.vanC)} = ${eur(bc.van)}, pour ${eur(bc.mise)} engagés`, tolerance: 1 },
        ];
      },
      explication: (c) => {
        const x = deuxLignes(c);
        const ordre = x.parIndice.map((l) => `le projet ${l} (${qte(x.ipPct[l])})`).join(", puis ");
        return [
          `Les VAN de projets indépendants s'additionnent : le banc ajoute ${eur(x.vanC)} à la ligne qu'il accompagne. Classés par leur indice, on trouve ${ordre}.`,
          `Le banc et une ligne tiennent-ils dans ${eur(BUDGET_DU_RATIONNEMENT)} ? C'est la question de l'étape suivante.`,
        ];
      },
    },
    {
      id: "le-programme",
      objectifs: [3],
      type: "choix",
      titre: "Le programme sous le budget",
      notions: ["irr_payback", "discounting"],
      question: (c) => {
        const x = deuxLignes(c);
        return `Avec ${eur(BUDGET_DU_RATIONNEMENT)} à engager à la date 0, des projets indivisibles et les deux lignes qui s'excluent, quel programme ${x.entreprise} doit-elle retenir ?`;
      },
      options: (c) => {
        const x = deuxLignes(c);
        const m = x.meilleur;
        const pi = x.programmeParIndice;
        const b = x.programmes.find((p) => p.nom === "B")!;
        const opt = (nom: string, texte: string, retourFaux: string) => ({
          texte,
          juste: m.nom === nom,
          retour: m.nom === nom ? `Oui : ${eur(m.van)} de VAN pour ${eur(m.mise)} engagés, le programme qui crée le plus de valeur parmi ceux qui tiennent dans le budget.` : retourFaux,
        });
        return [
          opt("BC", "La ligne semi-automatique et le banc : la plus forte VAN qui tient dans le budget", `Non : ${nomDuProgramme("BC")} engagent ${eur(x.programmes.find((p) => p.nom === "BC")!.mise)}, et créent ${eur(x.programmes.find((p) => p.nom === "BC")!.van)}.`),
          opt(
            pi.nom,
            `${nomDuProgramme(pi.nom).charAt(0).toUpperCase()}${nomDuProgramme(pi.nom).slice(1)} : les meilleurs indices de profitabilité`,
            `Non : c'est suivre l'indice jusqu'au bout. ${nomDuProgramme(pi.nom).charAt(0).toUpperCase()}${nomDuProgramme(pi.nom).slice(1)} n'engagent que ${eur(pi.mise)} pour ${eur(pi.van)} de VAN, et laissent ${eur(x.laisseParIndice)} sans emploi. Avec des projets indivisibles, l'indice classe, mais c'est la VAN du programme qui décide.`,
          ),
          opt("B", "La ligne semi-automatique seule : la plus forte VAN des deux lignes", `Non : c'est oublier le banc, indépendant, dont la VAN est positive. Seule, la ligne semi-automatique crée ${eur(b.van)}.`),
          {
            texte: "Les trois projets, puisque leurs VAN sont toutes positives",
            juste: false,
            retour: `Non : les deux lignes s'excluent, et les trois projets demanderaient ${eur(auCentime(-x.A.flux[0]! - x.B.flux[0]! - x.C.flux[0]!))}, bien au-delà du budget.`,
          },
        ];
      },
    },
    {
      id: "la-critique-du-tri",
      objectifs: [4],
      type: "montants",
      titre: "Une critique du TRI",
      notions: ["irr_payback", "discounting"],
      question: (c) => {
        const x = deuxLignes(c);
        return `Le TRI suppose que chaque flux d'un projet se replace à son propre TRI, ${pct(x.triAPct)} pour le projet A : c'est peu réaliste. Le TRI global corrige cette hypothèse : les flux positifs se replacent à ${pct(x.tauxPct)} jusqu'à la date ${x.A.duree} ; un flux négatif après la date 0 s'ajoute à la mise, actualisé à ${pct(x.tauxPct)} ; TRI global = (valeur acquise ÷ mise)^(1/${x.A.duree}) − 1. Calculez le TRI global du projet A, celui de B, puis celui des flux différentiels.`;
      },
      champs: (c) => {
        const x = deuxLignes(c);
        const n = x.A.duree;
        const calc = (g: ReturnType<typeof triGlobal>, p: number) => `valeur acquise ${eur(g.valeurAcquise)}, mise ${eur(g.mise)} : (${eur(g.valeurAcquise)} ÷ ${eur(g.mise)})^(1/${n}) − 1 = ${pct(p)}`;
        return [
          { libelle: "TRI global du projet A (%)", attendu: x.globalAPct, calcul: `${calc(x.globalA, x.globalAPct)}, le flux négatif de la date 1 ajouté à la mise`, tolerance: 0.02 },
          { libelle: "TRI global de B (%)", attendu: x.globalBPct, calcul: calc(x.globalB, x.globalBPct), tolerance: 0.02 },
          { libelle: "TRI global des flux différentiels (%)", attendu: x.globalDiffPct, calcul: calc(x.globalDiff, x.globalDiffPct), tolerance: 0.02 },
        ];
      },
      explication: (c) => {
        const x = deuxLignes(c);
        return [
          `Replacés à ${pct(x.tauxPct)}, les flux rendent moins : ${pct(x.globalAPct)} pour le projet A au lieu de ${pct(x.triAPct)}, ${pct(x.globalBPct)} pour B au lieu de ${pct(x.triBPct)}. Mais le TRI global préfère encore le projet A : corriger le réinvestissement ne corrige pas la taille. Un taux reste un rendement par euro.`,
          `Le bon usage d'un taux entre deux projets qui s'excluent, c'est le projet différentiel : investir ${eur(-x.diff[0]!)} de plus dans B rend ${pct(x.globalDiffPct)} en TRI global, ${pct(x.fisherPct)} en TRI, plus que ${pct(x.tauxPct)}. Le supplément vaut la peine : la conclusion de la VAN.`,
        ];
      },
    },
    {
      id: "le-choix",
      objectifs: [4],
      type: "choix",
      titre: "Quelle ligne retenir ?",
      notions: ["discounting", "profitability_vs_return"],
      question: (c) => {
        const x = deuxLignes(c);
        return `Les deux lignes s'excluent, et le budget les permet toutes les deux. À ${pct(x.tauxPct)}, laquelle ${x.entreprise} doit-elle retenir ?`;
      },
      options: (c) => {
        const x = deuxLignes(c);
        const r = x.retenu;
        return [
          {
            texte: "La ligne semi-automatique : sa VAN est la plus forte",
            juste: r === "B",
            retour: r === "B" ? `Oui : ${eur(x.vanB)}, ${eur(x.ecart)} de plus que la ligne manuelle. Entre deux projets qui s'excluent, la plus forte VAN positive l'emporte.` : `Non : sa VAN, ${eur(x.vanB)}, n'est pas la plus forte.`,
          },
          {
            texte: "La ligne manuelle : son TRI est le plus fort",
            juste: false,
            retour: `Non : ${pct(x.triAPct)} contre ${pct(x.triBPct)}, mais le TRI mesure un rendement par euro. Le supplément investi dans B rend ${pct(x.fisherPct)}, plus que ${pct(x.tauxPct)} : il crée de la valeur.`,
          },
          {
            texte: "La ligne manuelle : même son TRI global est le plus fort",
            juste: false,
            retour: `Non : le TRI global corrige le réinvestissement, pas la taille. Celui ${duProjet("A")} (${pct(x.globalAPct)}) dépasse celui de B (${pct(x.globalBPct)}), mais B crée ${eur(x.ecart)} de plus.`,
          },
          {
            texte: "La ligne manuelle : elle récupère sa mise plus vite",
            juste: false,
            retour: `Non : ${qte(x.delaiA)} ans contre ${qte(x.delaiB)}, mais le délai ignore ce qui vient après. C'est la VAN qui tranche.`,
          },
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["irr_payback", "discounting"],
      tableau: (c) => {
        const x = deuxLignes(c);
        return {
          titre: `Les critères des deux lignes, à ${pct(x.tauxPct)}`,
          colonnes: ["Projet A, ligne manuelle", "Projet B, ligne semi-automatique"],
          lignes: [
            { libelle: "VAN", valeurs: [eur(x.vanA), eur(x.vanB)] },
            { libelle: "TRI", valeurs: [pct(x.triAPct), pct(x.triBPct)] },
            { libelle: "TRI global", valeurs: [pct(x.globalAPct), pct(x.globalBPct)] },
            { libelle: "Indice de profitabilité", valeurs: [qte(x.ipPct.A), qte(x.ipPct.B)] },
            { libelle: "Délai de récupération actualisé", valeurs: [`${qte(x.delaiA)} ans`, `${qte(x.delaiB)} ans`] },
          ],
        };
      },
      texte: (c) => {
        const x = deuxLignes(c);
        return [
          `Chez ${x.entreprise}, la ligne semi-automatique l'emporte : sa VAN, ${eur(x.vanB)}, dépasse celle de la ligne manuelle de ${eur(x.ecart)}. Le TRI, le TRI global, l'indice et le délai préfèrent la ligne manuelle : ils mesurent un rendement par euro ou une vitesse. Le taux de Fisher, ${pct(x.fisherPct)}, est le rendement du supplément investi dans B : au-dessus de ${pct(x.tauxPct)}, il vaut la peine.`,
          `Sous un budget, l'indice de profitabilité classe les projets, mais avec des projets indivisibles c'est la VAN du programme qui décide : avec ${eur(BUDGET_DU_RATIONNEMENT)}, ${nomDuProgramme(x.meilleur.nom)} créent ${eur(x.meilleur.van)}.`,
          "Au niveau de l'examen, vous savez encadrer et interpoler un TRI, expliquer le conflit entre la VAN et le TRI par le taux de Fisher, retrouver à rebours la charge qui égale deux VAN, choisir un programme sous un budget, et critiquer le TRI par son hypothèse de réinvestissement.",
          "Dans l'arène, les chiffres de votre entreprise seront différents : la notion, elle, est la même.",
        ];
      },
      repere: () =>
        "Entre deux projets qui s'excluent, on retient la plus forte VAN positive. Le taux de Fisher annule la VAN des flux différentiels : sous lui, le plus gros projet l'emporte. Sous un budget, on retient le programme de plus forte VAN qui tient dans le budget.",
    },
  ],
};
