import { planSousFacteurRare } from "./couts-et-budgets";
import { GAMME_DE_NOVA, NOVA_GESTION, type CodeDeReference, type ReferenceDeLaGamme } from "./nova-gestion";

/**
 * LE MONDE DU COURS : PROGRAMMER LA PRODUCTION DE NOVA (le chapitre « Programmer la production »
 * et son cas, DCG UE11 § 3.2, BUT GEA).
 *
 * DEUX OUTILS, SUR LA MÊME NOVA.
 *
 *   1. LA PROGRAMMATION LINÉAIRE, PAR LA MÉTHODE GRAPHIQUE. Le mois de pointe de la gamme est celui
 *      du facteur rare (nova-gestion.ts, GAMME_DE_NOVA : la demande de décembre, 600 Go, 1 500 One,
 *      400 Studio ; les 700 heures-machine des deux lignes). Le chapitre « Coût par produit » y sert
 *      d'abord la référence qui rapporte le plus par heure-machine (couts-et-budgets.ts,
 *      `planSousFacteurRare` : la Studio, puis la Go, puis la One, 1 306 One). CE FICHIER N'Y
 *      CHANGE RIEN : sans le banc de mesure, le programme linéaire retombe sur ce plan (la garde le
 *      vérifie). Il ajoute une seconde ressource que la One et la Studio se partagent, le banc de
 *      mesure (HYPOTHÈSE DU COURS, BANC_DE_MESURE) : deux contraintes communes, le facteur rare ne
 *      suffit plus, il faut le programme linéaire.
 *
 *      LA GO EST SERVIE LA PREMIÈRE, ET ENTIÈRE. Elle ne passe pas au banc et rapporte plus par
 *      heure-machine que la One : elle garde ses 600 unités (108 heures-machine), et le programme
 *      porte sur la One (x) et la Studio (y), avec les 592 heures qui restent. La garde le vérifie :
 *      au programme optimal, une heure-machine vaut moins que ce que la Go en tire.
 *
 *   2. L'ORDONNANCEMENT PAR LA MÉTHODE DES POTENTIELS (MPM) : le lancement de la NOVA Go, ses neuf
 *      tâches (HYPOTHÈSE DU COURS, TACHES_DU_LANCEMENT), les dates au plus tôt et au plus tard, le
 *      chemin critique, les marges totales et libres, et ce que coûte un lancement avancé
 *      (COMPRESSIONS_POSSIBLES).
 *
 * LES RÈGLES DE CALCUL, celles d'un énoncé :
 *   · une contrainte s'écrit a x + b y ≤ c ; le domaine des solutions acceptables est ce qui les
 *     respecte toutes, avec x ≥ 0 et y ≥ 0 ; ses sommets sont les intersections de deux droites qui
 *     les respectent toutes ;
 *   · la fonction économique est la marge sur coût variable du mois, 21 x + 59 y ; le programme
 *     optimal est le sommet où elle est la plus forte (méthode énumérative) ;
 *   · une date au plus tôt est la plus grande des fins au plus tôt des tâches qui précèdent ; une
 *     date au plus tard, la plus petite des dates au plus tard des tâches qui suivent, moins la
 *     durée ; marge totale = au plus tard − au plus tôt ; marge libre = la plus petite date au plus
 *     tôt des tâches qui suivent − la fin au plus tôt de la tâche.
 */

// ═════════════════════════════════════════════════════════════════════════════
// 1. LA PROGRAMMATION LINÉAIRE
// ═════════════════════════════════════════════════════════════════════════════

const parCode = (code: CodeDeReference): ReferenceDeLaGamme => GAMME_DE_NOVA.references.find((r) => r.code === code)!;

/** Les trois références de la gamme, celles de nova-gestion.ts. */
export const LA_GO = parCode("go");
export const LA_ONE = parCode("one");
export const LA_STUDIO = parCode("studio");

/**
 * LE BANC DE MESURE (hypothèse du cours) : le distributeur de la Studio exige une courbe de réponse
 * mesurée pour chaque enceinte de salon. Chaque One passe 3 minutes au banc de mesure acoustique,
 * chaque Studio 15 minutes (ses deux voies se mesurent à part) ; la Go, enceinte nomade, est
 * contrôlée par échantillon et n'y passe pas. Le banc tourne 152 heures dans le mois : 19 jours de
 * 8 heures, avec un opérateur.
 */
export const BANC_DE_MESURE = {
  libelle: "le banc de mesure",
  heuresParMois: 152,
  minutesParUnite: { go: 0, one: 3, studio: 15 } as Readonly<Record<CodeDeReference, number>>,
} as const;

/** Une contrainte du programme : a x + b y ≤ c, x les One, y les Studio. */
export interface ContrainteDuProgramme {
  code: "heures-machine" | "banc" | "demande-one" | "demande-studio";
  libelle: string;
  a: number;
  b: number;
  c: number;
}

/** Les leviers du programme : les heures du banc et les heures-machine du mois. */
export interface LeviersDuProgramme {
  heuresDuBanc: number;
  heuresMachine: number;
}

export const leviersDuProgrammeDeLaFiche = (): LeviersDuProgramme => ({ heuresDuBanc: BANC_DE_MESURE.heuresParMois, heuresMachine: GAMME_DE_NOVA.capaciteHeuresMachine });

const auMillionieme = (x: number) => Math.round(x * 1e6) / 1e6 + 0;
const auCentime = (x: number) => Math.round(x * 100) / 100 + 0;

/** La Go servie d'abord, entière : ses unités, ses heures-machine et sa marge. */
export function laGoServieDAbord() {
  const unites = LA_GO.demandeDuMoisDePointe;
  return { unites, heures: auMillionieme(unites * LA_GO.heuresMachineParUnite), marge: unites * (LA_GO.prix - LA_GO.coutVariableUnitaire) };
}

/**
 * LA FORME CANONIQUE : les variables, les contraintes, la fonction économique. Les heures du banc se
 * comptent en heures (3 minutes = 0,05 heure). `avecLeBanc` à faux : le programme du facteur rare.
 */
export function formeCanonique(leviers: Partial<LeviersDuProgramme> = {}, avecLeBanc = true) {
  const l = { ...leviersDuProgrammeDeLaFiche(), ...leviers };
  const go = laGoServieDAbord();
  const banc = (r: ReferenceDeLaGamme) => auMillionieme(BANC_DE_MESURE.minutesParUnite[r.code] / 60);
  const contraintes: ContrainteDuProgramme[] = [
    { code: "heures-machine", libelle: "Heures-machine", a: LA_ONE.heuresMachineParUnite, b: LA_STUDIO.heuresMachineParUnite, c: auMillionieme(l.heuresMachine - go.heures) },
    ...(avecLeBanc ? [{ code: "banc" as const, libelle: "Heures du banc de mesure", a: banc(LA_ONE), b: banc(LA_STUDIO), c: l.heuresDuBanc }] : []),
    { code: "demande-one", libelle: "Demande de la One", a: 1, b: 0, c: LA_ONE.demandeDuMoisDePointe },
    { code: "demande-studio", libelle: "Demande de la Studio", a: 0, b: 1, c: LA_STUDIO.demandeDuMoisDePointe },
  ];
  return {
    leviers: l,
    go,
    contraintes,
    marge: { x: LA_ONE.prix - LA_ONE.coutVariableUnitaire, y: LA_STUDIO.prix - LA_STUDIO.coutVariableUnitaire },
  };
}

export type FormeCanonique = ReturnType<typeof formeCanonique>;

/** La marge sur coût variable du mois de x One et y Studio (la Go à part). */
export const margeDuProgramme = (f: FormeCanonique, x: number, y: number) => auCentime(f.marge.x * x + f.marge.y * y);

/** Ce qu'une position consomme de chaque contrainte, et si elle les respecte toutes. */
export function lireLaPosition(f: FormeCanonique, x: number, y: number) {
  const usages = f.contraintes.map((k) => ({ ...k, utilise: auMillionieme(k.a * x + k.b * y), reste: auMillionieme(k.c - (k.a * x + k.b * y)) }));
  return { x, y, usages, admissible: x >= 0 && y >= 0 && usages.every((u) => u.reste >= -1e-6), marge: margeDuProgramme(f, x, y) };
}

/** Un sommet du domaine : ses coordonnées, les deux droites qui s'y croisent, la marge. */
export interface SommetDuDomaine {
  nom: string;
  x: number;
  y: number;
  /** Les deux droites qui s'y croisent : le code d'une contrainte, ou un axe. */
  droites: readonly [string, string];
  marge: number;
}

/**
 * LES SOMMETS DU DOMAINE DES SOLUTIONS ACCEPTABLES : chaque paire de droites (les contraintes et les
 * deux axes) qui se croisent en un point qui respecte toutes les contraintes. Ils sont nommés dans
 * l'ordre du tour du domaine : O l'origine, puis A, B, C… en partant sur l'axe des One.
 */
export function sommetsDuDomaine(f: FormeCanonique): SommetDuDomaine[] {
  const droites = [...f.contraintes.map((k) => ({ code: k.code as string, a: k.a, b: k.b, c: k.c })), { code: "axe-des-studio", a: 1, b: 0, c: 0 }, { code: "axe-des-one", a: 0, b: 1, c: 0 }];
  const trouves: { x: number; y: number; droites: [string, string] }[] = [];
  for (let i = 0; i < droites.length; i++) {
    for (let j = i + 1; j < droites.length; j++) {
      const d1 = droites[i]!;
      const d2 = droites[j]!;
      const det = d1.a * d2.b - d2.a * d1.b;
      if (Math.abs(det) < 1e-12) continue;
      const x = auMillionieme((d1.c * d2.b - d2.c * d1.b) / det);
      const y = auMillionieme((d1.a * d2.c - d2.a * d1.c) / det);
      if (!lireLaPosition(f, x, y).admissible) continue;
      if (trouves.some((p) => Math.abs(p.x - x) < 1e-6 && Math.abs(p.y - y) < 1e-6)) continue;
      trouves.push({ x, y, droites: [d1.code, d2.code] });
    }
  }
  const cx = trouves.reduce((t, p) => t + p.x, 0) / trouves.length;
  const cy = trouves.reduce((t, p) => t + p.y, 0) / trouves.length;
  const angle = (p: { x: number; y: number }) => Math.atan2((p.y - cy) / (LA_STUDIO.demandeDuMoisDePointe || 1), (p.x - cx) / (LA_ONE.demandeDuMoisDePointe || 1));
  const tries = [...trouves].sort((p, q) => angle(p) - angle(q));
  const depart = tries.findIndex((p) => p.x === 0 && p.y === 0);
  const ordre = [...tries.slice(depart), ...tries.slice(0, depart)];
  return ordre.map((p, k) => ({ nom: k === 0 ? "O" : String.fromCharCode(64 + k), ...p, marge: margeDuProgramme(f, p.x, p.y) }));
}

/** Le programme optimal : le sommet de plus forte marge, et la marge du mois avec la Go. */
export function programmeOptimal(leviers: Partial<LeviersDuProgramme> = {}, avecLeBanc = true) {
  const f = formeCanonique(leviers, avecLeBanc);
  const sommets = sommetsDuDomaine(f);
  const optimal = sommets.reduce((m, s) => (s.marge > m.marge ? s : m));
  const lu = lireLaPosition(f, optimal.x, optimal.y);
  return { forme: f, sommets, optimal, usages: lu.usages, margeAvecLaGo: auCentime(optimal.marge + f.go.marge) };
}

/** Les contraintes saturées d'une position : celles dont il ne reste rien. */
export const saturees = (usages: ReturnType<typeof lireLaPosition>["usages"]) => usages.filter((u) => Math.abs(u.reste) < 1e-6).map((u) => u.code);

/**
 * CE QUE VAUT UNE HEURE DE PLUS (la valeur marginale) : la marge du programme optimal avec une heure
 * de plus de la ressource, moins celle du programme de la fiche.
 */
export function valeurDUneHeureDePlus(ressource: "banc" | "heures-machine", leviers: Partial<LeviersDuProgramme> = {}) {
  const base = programmeOptimal(leviers);
  const l = base.forme.leviers;
  const plus = programmeOptimal(ressource === "banc" ? { ...l, heuresDuBanc: l.heuresDuBanc + 1 } : { ...l, heuresMachine: l.heuresMachine + 1 });
  return { base, plus, valeur: auCentime(plus.optimal.marge - base.optimal.marge) };
}

/**
 * LE PLAN DU FACTEUR RARE FACE AU BANC : celui du chapitre « Coût par produit » (à l'unité entière),
 * les heures du banc qu'il demanderait, et sa marge du mois, Go comprise.
 */
export function leFacteurRareFaceAuBanc() {
  const plan = planSousFacteurRare(NOVA_GESTION);
  const quantite = (code: CodeDeReference) => plan.plan.find((r) => r.code === code)!.quantite;
  const one = quantite("one");
  const studio = quantite("studio");
  const heuresDuBanc = auMillionieme((one * BANC_DE_MESURE.minutesParUnite.one + studio * BANC_DE_MESURE.minutesParUnite.studio + quantite("go") * BANC_DE_MESURE.minutesParUnite.go) / 60);
  return { plan, one, studio, go: quantite("go"), heuresDuBanc, manque: auMillionieme(heuresDuBanc - BANC_DE_MESURE.heuresParMois), marge: plan.marge };
}

/** La pente d'une droite a x + b y = c, dans le repère (One, Studio) : − a ÷ b. */
export const penteDe = (a: number, b: number) => auMillionieme(-a / b);

// ═════════════════════════════════════════════════════════════════════════════
// 2. L'ORDONNANCEMENT : LE LANCEMENT DE LA NOVA GO
// ═════════════════════════════════════════════════════════════════════════════

export type CodeDeTache = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I";

export interface TacheDuLancement {
  code: CodeDeTache;
  libelle: string;
  /** La durée, en semaines. */
  duree: number;
  /** Les tâches qui doivent être finies avant qu'elle commence. */
  avant: readonly CodeDeTache[];
}

/**
 * LES TÂCHES DU LANCEMENT DE LA GO (hypothèse du cours), en semaines : du cahier des charges à la
 * mise en vente. Le moule du boîtier est fabriqué par un mouliste ; les essais acoustiques et la
 * certification se font dans un laboratoire agréé ; le réglage porte sur la seconde ligne, celle
 * de la gamme (nova-gestion.ts : « l'usure des deux lignes »).
 */
export const TACHES_DU_LANCEMENT: readonly TacheDuLancement[] = [
  { code: "A", libelle: "Le cahier des charges de la Go", duree: 3, avant: [] },
  { code: "B", libelle: "La conception du boîtier et des prototypes", duree: 5, avant: ["A"] },
  { code: "C", libelle: "Le choix des composants avec Électro-Composants", duree: 2, avant: ["A"] },
  { code: "D", libelle: "Le moule du boîtier, chez le mouliste", duree: 6, avant: ["B"] },
  { code: "E", libelle: "Le réglage de la seconde ligne", duree: 3, avant: ["B", "C"] },
  { code: "F", libelle: "Les essais acoustiques et la certification", duree: 4, avant: ["B"] },
  { code: "G", libelle: "La présérie", duree: 2, avant: ["D", "E"] },
  { code: "H", libelle: "La campagne de lancement", duree: 3, avant: ["F"] },
  { code: "I", libelle: "La mise en vente", duree: 1, avant: ["G", "H"] },
];

/**
 * CE QU'UN LANCEMENT AVANCÉ COÛTE (hypothèses du cours) : le mouliste livre le moule plus vite en
 * travaillant le samedi, 1 500 € par semaine gagnée, 3 semaines au plus ; le laboratoire avance les
 * essais en heures de nuit, 2 500 € par semaine gagnée, 2 semaines au plus.
 */
export const COMPRESSIONS_POSSIBLES = {
  D: { coutParSemaine: 1_500, auPlus: 3 },
  F: { coutParSemaine: 2_500, auPlus: 2 },
} as const;

/** LA DATE QUE LA DIRECTION VISE (hypothèse du cours) : la Go en vente 15 semaines après le départ du projet. */
export const LANCEMENT_VISE = 15;

/** Une tâche ordonnancée : ses dates, ses marges, si elle est critique. */
export interface TacheOrdonnancee extends TacheDuLancement {
  tot: number;
  finAuPlusTot: number;
  tard: number;
  margeTotale: number;
  margeLibre: number;
  critique: boolean;
  apres: CodeDeTache[];
}

/** Les semaines gagnées sur une tâche : des durées qui remplacent celles de la fiche. */
export type DureesDuLancement = Partial<Record<CodeDeTache, number>>;

/**
 * LA MÉTHODE DES POTENTIELS : les dates au plus tôt (de la gauche vers la droite, le chemin le plus
 * long quand des tâches convergent), la fin du projet, les dates au plus tard (de la droite vers la
 * gauche, la plus petite), les marges, le chemin critique.
 */
export function ordonnancement(durees: DureesDuLancement = {}) {
  const taches = TACHES_DU_LANCEMENT.map((t) => ({ ...t, duree: durees[t.code] ?? t.duree }));
  const suivantes = (c: CodeDeTache) => taches.filter((t) => t.avant.includes(c)).map((t) => t.code);
  const tot: Partial<Record<CodeDeTache, number>> = {};
  for (const t of taches) tot[t.code] = Math.max(0, ...t.avant.map((p) => tot[p]! + taches.find((x) => x.code === p)!.duree));
  const fin = Math.max(...taches.map((t) => tot[t.code]! + t.duree));
  const tard: Partial<Record<CodeDeTache, number>> = {};
  for (const t of [...taches].reverse()) {
    const s = suivantes(t.code);
    tard[t.code] = (s.length ? Math.min(...s.map((x) => tard[x]!)) : fin) - t.duree;
  }
  const ordonnees: TacheOrdonnancee[] = taches.map((t) => {
    const s = suivantes(t.code);
    const finAuPlusTot = tot[t.code]! + t.duree;
    const margeTotale = tard[t.code]! - tot[t.code]!;
    return {
      ...t,
      tot: tot[t.code]!,
      finAuPlusTot,
      tard: tard[t.code]!,
      margeTotale,
      margeLibre: (s.length ? Math.min(...s.map((x) => tot[x]!)) : fin) - finAuPlusTot,
      critique: margeTotale === 0,
      apres: s,
    };
  });
  return { taches: ordonnees, fin, critiques: ordonnees.filter((t) => t.critique).map((t) => t.code) };
}

/** Tous les chemins du début à la fin, et leur longueur, du plus long au plus court. */
export function cheminsDuLancement(durees: DureesDuLancement = {}) {
  const o = ordonnancement(durees);
  const tache = (c: CodeDeTache) => o.taches.find((t) => t.code === c)!;
  const chemins: { taches: CodeDeTache[]; longueur: number }[] = [];
  const suivre = (c: CodeDeTache, chemin: CodeDeTache[]) => {
    const ici = [...chemin, c];
    const s = tache(c).apres;
    if (!s.length) chemins.push({ taches: ici, longueur: ici.reduce((t, x) => t + tache(x).duree, 0) });
    for (const x of s) suivre(x, ici);
  };
  for (const t of o.taches.filter((x) => x.avant.length === 0)) suivre(t.code, []);
  return chemins.sort((p, q) => q.longueur - p.longueur || p.taches.join().localeCompare(q.taches.join()));
}

/** Le lancement avancé : les semaines gagnées sur le moule et sur les essais, la durée du projet, ce qu'il coûte. */
export function lancementAvance(gagneesSurLeMoule: number, gagneesSurLesEssais: number) {
  const fiche = Object.fromEntries(TACHES_DU_LANCEMENT.map((t) => [t.code, t.duree])) as Record<CodeDeTache, number>;
  const durees: DureesDuLancement = { D: fiche.D - gagneesSurLeMoule, F: fiche.F - gagneesSurLesEssais };
  const o = ordonnancement(durees);
  const cout = gagneesSurLeMoule * COMPRESSIONS_POSSIBLES.D.coutParSemaine + gagneesSurLesEssais * COMPRESSIONS_POSSIBLES.F.coutParSemaine;
  return { gagneesSurLeMoule, gagneesSurLesEssais, durees, ordonnancement: o, chemins: cheminsDuLancement(durees), fin: o.fin, cout, tenu: o.fin <= LANCEMENT_VISE };
}

/** Le lancement avancé le moins cher qui tient la date visée, parmi toutes les compressions possibles. */
export function lancementAvanceLeMoinsCher() {
  let meilleur: ReturnType<typeof lancementAvance> | null = null;
  for (let d = 0; d <= COMPRESSIONS_POSSIBLES.D.auPlus; d++) {
    for (let f = 0; f <= COMPRESSIONS_POSSIBLES.F.auPlus; f++) {
      const l = lancementAvance(d, f);
      if (l.tenu && (meilleur === null || l.cout < meilleur.cout)) meilleur = l;
    }
  }
  return meilleur!;
}
