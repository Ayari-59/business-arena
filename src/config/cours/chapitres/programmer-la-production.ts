import { eur, nombreAuCentieme } from "../../../pedagogy/cours/deux-decimales";
import type { CelluleACompleter, TableauACompleter } from "../../../pedagogy/cours/tableau-a-completer";
import {
  BANC_DE_MESURE,
  COMPRESSIONS_POSSIBLES,
  LANCEMENT_VISE,
  LA_GO,
  LA_ONE,
  LA_STUDIO,
  TACHES_DU_LANCEMENT,
  cheminsDuLancement,
  formeCanonique,
  lancementAvance,
  lancementAvanceLeMoinsCher,
  leFacteurRareFaceAuBanc,
  lireLaPosition,
  ordonnancement,
  penteDe,
  programmeOptimal,
  valeurDUneHeureDePlus,
  type CodeDeTache,
} from "../monde/programmation-de-nova";
import type { Chapitre, TableauDeDonnees } from "../types";

/**
 * CHAPITRE : PROGRAMMER LA PRODUCTION (contrôle de gestion, palier 4 ; DCG UE11 § 3.2, BUT GEA).
 *
 * LE CHAPITRE JOUE DANS LE MONDE DU COURS (monde/programmation-de-nova.ts), sur la gamme de NOVA et
 * son mois de pointe, celui du facteur rare du chapitre « Coût par produit ». Deux outils :
 *   · LA PROGRAMMATION LINÉAIRE, PAR LA MÉTHODE GRAPHIQUE. Une seconde ressource, le banc de mesure,
 *     est commune à la One et à la Studio : le classement par marge par heure-machine ne suffit plus.
 *     Forme canonique, domaine des solutions acceptables, sommets, programme optimal (1 440 One et
 *     320 Studio), et ce que vaut une heure de banc de plus.
 *   · L'ORDONNANCEMENT MPM : le lancement de la NOVA Go, ses neuf tâches, les dates au plus tôt et
 *     au plus tard, le chemin critique, les marges totales et libres, et un lancement avancé.
 *
 * LES TROIS TEMPS (le niveau d'arrivée est celui du DCG) :
 *   · guidé : le-banc-du-facteur-rare, le-sommet-des-deux-droites (la méthode de résolution est
 *     dans la question), les-dates-au-plus-tot (les deux premières lignes sont données) ;
 *   · l'expérience avant la formule : predire-le-banc puis le-laboratoire-du-programme (l'élève
 *     cherche le meilleur programme sur le graphique des contraintes) avant le-sommet-des-deux-droites
 *     et les-sommets ; predire-le-retard avant les dates ; le-laboratoire-du-lancement ;
 *   · autonome : les-sommets, la-marge-du-mois, les-dates-au-plus-tard, les-marges-libres ;
 *   · expert : une-heure-de-banc-de-plus (la valeur marginale d'une ressource), le-laboratoire-du-
 *     lancement (deux chemins critiques au moindre coût) ; puis la synthèse.
 *
 * LES CALCULS SE FONT À DEUX CHIFFRES APRÈS LA VIRGULE (décision du propriétaire, 10 novembre 2026,
 * pedagogy/cours/deux-decimales.ts) : les heures de banc sont des grandeurs au centième (à 0,05
 * près, avant) ; les quantités du programme sont des quantités.
 */

/** Le chapitre se joue chez NOVA : sa gamme, son banc et le lancement de sa Go sont ceux du monde du cours. */
export const ENTREPRISES_DE_LA_PROGRAMMATION: readonly string[] = ["nova"];

/** Les leviers du laboratoire du programme : les One et les Studio du mois, par 20. */
export const LEVIERS_DU_PROGRAMME = {
  one: { min: 0, max: LA_ONE.demandeDuMoisDePointe, pas: 20, depart: 1_300 },
  studio: { min: 0, max: LA_STUDIO.demandeDuMoisDePointe, pas: 20, depart: LA_STUDIO.demandeDuMoisDePointe },
} as const;

const qte = nombreAuCentieme;
const semaines = (n: number) => `${qte(n)} ${Math.abs(n) >= 2 ? "semaines" : "semaine"}`;
const heures = (n: number) => `${qte(n)} ${Math.abs(n) >= 2 ? "heures" : "heure"}`;
const liste = (xs: readonly string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} et ${xs.at(-1)}`);
/** « de la tâche E », « des tâches D et E » : jamais « de E ». */
const desTaches = (xs: readonly string[]) => (xs.length === 1 ? `de la tâche ${xs[0]}` : `des tâches ${liste(xs)}`);

const donnee = (valeur: number, unite?: string): CelluleACompleter => ({ valeur, ...(unite ? { unite } : {}) });
const VIDE: CelluleACompleter = { valeur: null };
const aSaisir = (valeur: number, calcul: string, autres: Partial<CelluleACompleter> = {}): CelluleACompleter => ({ valeur, saisir: true, calcul, ...autres });

let memoire: ReturnType<typeof calculerLaProgrammation> | null = null;

/** Tout ce que le chapitre lit, calculé une fois (les données sont figées : le résultat se garde). */
export function programmation() {
  memoire ??= calculerLaProgrammation();
  return memoire;
}

function calculerLaProgrammation() {
  const f = formeCanonique();
  const o = programmeOptimal();
  const fr = leFacteurRareFaceAuBanc();
  const banc = valeurDUneHeureDePlus("banc");
  const hm = valeurDUneHeureDePlus("heures-machine");
  const mpm = ordonnancement();
  const k = (code: string) => f.contraintes.find((x) => x.code === code)!;
  return { f, o, fr, banc, hm, mpm, hmK: k("heures-machine"), bancK: k("banc") };
}

const tache = (c: CodeDeTache) => programmation().mpm.taches.find((t) => t.code === c)!;

/** Le laboratoire du programme, à une position : ce qu'elle consomme et ce qu'elle rapporte. */
export function laboratoireDuProgramme(one: number, studio: number) {
  return lireLaPosition(programmation().f, one, studio);
}

/** La gamme au mois de pointe : le document du chapitre. */
function tableauDeLaGamme(): TableauDeDonnees {
  const refs = [LA_GO, LA_ONE, LA_STUDIO];
  return {
    titre: "La gamme au mois de pointe",
    colonnes: refs.map((r) => r.nom),
    lignes: [
      { libelle: "Marge sur coût variable d'une unité", valeurs: refs.map((r) => eur(r.prix - r.coutVariableUnitaire)) },
      { libelle: "Heures-machine d'une unité", valeurs: refs.map((r) => qte(r.heuresMachineParUnite)) },
      { libelle: "Minutes au banc de mesure d'une unité", valeurs: refs.map((r) => qte(BANC_DE_MESURE.minutesParUnite[r.code])) },
      { libelle: "Demande du mois de pointe", valeurs: refs.map((r) => qte(r.demandeDuMoisDePointe)) },
    ],
  };
}

/** Les tâches du lancement de la Go. */
function tableauDesTaches(): TableauDeDonnees {
  return {
    titre: "Le lancement de la NOVA Go",
    colonnes: ["Durée", "Après"],
    lignes: TACHES_DU_LANCEMENT.map((t) => ({ libelle: `${t.code}. ${t.libelle}`, valeurs: [semaines(t.duree), t.avant.length ? liste(t.avant) : "aucune"] })),
  };
}

/** Les sommets du domaine : coordonnées et marge, à compléter (l'optimum, déjà trouvé, est donné). */
function grilleDesSommets(): TableauACompleter {
  const { o, f } = programmation();
  const contrainte = (code: string) => f.contraintes.find((k) => k.code === code)!;
  const marge = (x: number, y: number) => `${qte(f.marge.x)} × ${qte(x)} + ${qte(f.marge.y)} × ${qte(y)} = ${eur(f.marge.x * x + f.marge.y * y)}`;
  return {
    titre: "Les sommets du domaine des solutions acceptables",
    colonnes: ["One (x)", "Studio (y)", "Marge sur coût variable"],
    lignes: o.sommets.map((s) => {
      const autre = s.droites.find((d) => d !== "demande-one" && d !== "demande-studio" && !d.startsWith("axe"));
      let cx = donnee(s.x, "One");
      let cy = donnee(s.y, "Studio");
      if (s.nom !== o.optimal.nom && autre) {
        const k = contrainte(autre);
        if (s.droites.includes("demande-one")) {
          cy = aSaisir(s.y, `${k.libelle.toLowerCase()} saturées à x = ${qte(s.x)} : (${qte(k.c)} − ${qte(k.a)} × ${qte(s.x)}) ÷ ${qte(k.b)} = ${qte(s.y)}`, { unite: "Studio", indice: "la contrainte saturée avec la demande de la One, à x = 1 500" });
        } else if (s.droites.includes("demande-studio")) {
          cx = aSaisir(s.x, `${k.libelle.toLowerCase()} saturées à y = ${qte(s.y)} : (${qte(k.c)} − ${qte(k.b)} × ${qte(s.y)}) ÷ ${qte(k.a)} = ${qte(s.x)}`, { unite: "One", indice: "la contrainte saturée avec la demande de la Studio, à y = 400" });
        }
      }
      const cm = s.nom === "O" ? donnee(0) : aSaisir(s.marge, marge(s.x, s.y), { indice: "21 € par One, 59 € par Studio" });
      return { libelle: `Sommet ${s.nom}`, cellules: [cx, cy, cm] };
    }),
  };
}

/** Les dates au plus tôt, à compléter (les deux premières lignes sont données). */
function grilleDesDatesAuPlusTot(): TableauACompleter {
  const { mpm } = programmation();
  return {
    titre: "Les dates de début au plus tôt, en semaines",
    colonnes: ["Durée", "Début au plus tôt"],
    lignes: [
      ...mpm.taches.map((t) => {
        const calcul = t.avant.length === 0 ? "aucune tâche avant elle : 0" : t.avant.length === 1 ? `${t.avant[0]} commence en ${qte(tache(t.avant[0]!).tot)} et dure ${semaines(tache(t.avant[0]!).duree)} : ${qte(t.tot)}` : `la plus grande des fins au plus tôt ${desTaches(t.avant)} (${liste(t.avant.map((p) => qte(tache(p).finAuPlusTot)))}) : ${qte(t.tot)}`;
        const donne = t.code === "A" || t.code === "B";
        return {
          libelle: `${t.code}. ${t.libelle}`,
          cellules: [donnee(t.duree, "sem."), donne ? { ...donnee(t.tot, "sem."), calcul } : aSaisir(t.tot, calcul, { unite: "sem.", indice: "la plus grande des fins au plus tôt des tâches qui la précèdent" })],
        };
      }),
      {
        libelle: "Fin du projet",
        fort: true,
        cellules: [VIDE, aSaisir(mpm.fin, `la plus grande des fins au plus tôt des tâches sans suivante : ${qte(mpm.fin)}`, { unite: "sem.", indice: "la mise en vente : son début au plus tôt plus sa durée" })],
      },
    ],
  };
}

/** Les dates au plus tard et les marges totales, à compléter. */
function grilleDesDatesAuPlusTard(): TableauACompleter {
  const { mpm } = programmation();
  return {
    titre: `Les dates de début au plus tard, la fin du projet reportée en semaine ${qte(mpm.fin)}`,
    colonnes: ["Durée", "Début au plus tôt", "Début au plus tard", "Marge totale"],
    lignes: mpm.taches.map((t) => {
      const calcul = t.apres.length === 0 ? `${qte(mpm.fin)} − ${qte(t.duree)} = ${qte(t.tard)}` : `la plus petite des dates au plus tard ${desTaches(t.apres)} (${liste(t.apres.map((s) => qte(tache(s).tard)))}), moins ${qte(t.duree)} : ${qte(t.tard)}`;
      return {
        libelle: `${t.code}. ${t.libelle}`,
        cellules: [
          donnee(t.duree, "sem."),
          donnee(t.tot, "sem."),
          aSaisir(t.tard, calcul, { unite: "sem.", indice: "la plus petite des dates au plus tard des tâches qui la suivent, moins sa durée" }),
          aSaisir(t.margeTotale, `${qte(t.tard)} − ${qte(t.tot)} = ${qte(t.margeTotale)}`, { unite: "sem.", indice: "le début au plus tard moins le début au plus tôt" }),
        ],
      };
    }),
  };
}

/** Les marges libres des tâches qui ne sont pas critiques. */
function grilleDesMargesLibres(): TableauACompleter {
  const { mpm } = programmation();
  return {
    titre: "Les marges libres, en semaines",
    colonnes: ["Fin au plus tôt", "Marge totale", "Marge libre"],
    lignes: mpm.taches.map((t) => {
      const plusTot = t.apres.length ? Math.min(...t.apres.map((s) => tache(s).tot)) : mpm.fin;
      const calcul = `${t.apres.length ? `le plus petit début au plus tôt ${desTaches(t.apres)}, ${qte(plusTot)}` : `la fin du projet, ${qte(mpm.fin)}`}, moins la fin au plus tôt, ${qte(t.finAuPlusTot)} : ${qte(t.margeLibre)}`;
      return {
        libelle: `${t.code}. ${t.libelle}`,
        cellules: [donnee(t.finAuPlusTot, "sem."), donnee(t.margeTotale, "sem."), t.critique ? { ...donnee(t.margeLibre, "sem."), calcul } : aSaisir(t.margeLibre, calcul, { unite: "sem.", indice: "le plus petit début au plus tôt des tâches qui suivent, moins la fin au plus tôt" })],
      };
    }),
  };
}

export const PROGRAMMER_LA_PRODUCTION: Chapitre = {
  code: "programmer-la-production",
  parcours: "controle-de-gestion",
  palier: 4,
  blocs: ["DCG UE11 · Contrôle de gestion", "BUT GEA · Concevoir des outils de contrôle de gestion"],
  titre: "Programmer la production",
  accroche:
    "Au mois de pointe, la One et la Studio se disputent les heures-machine et le banc de mesure : le facteur rare ne suffit plus, le programme linéaire tranche. Puis la NOVA Go se lance, tâche par tâche : son chemin critique, et les marges qui laissent du jeu.",
  objectifs: [
    "Écrire la forme canonique d'un programme linéaire à deux variables",
    "Résoudre graphiquement un programme linéaire et en lire le programme optimal",
    "Distinguer le cas du facteur rare d'un programme à deux contraintes communes",
    "Calculer les dates au plus tôt et au plus tard d'un graphe MPM et en déduire le chemin critique",
    "Calculer et interpréter les marges totales et libres d'une tâche",
  ],
  libre: false,
  prerequis: ["cout-par-produit"],
  ensuite: ["approvisionner-au-moindre-cout"],
  entreprises: {
    codes: ENTREPRISES_DE_LA_PROGRAMMATION,
    pourquoi: "le programme se calcule ici sur la gamme de NOVA et le lancement de sa Go, que la simulation du cours tient ; la méthode vaut pour toute entreprise qui partage des ressources entre ses produits.",
  },
  etapes: [
    {
      id: "intro",
      type: "lecture",
      titre: "Le mois de pointe, et une seconde ressource",
      notions: ["capacity", "contribution_margin"],
      tableau: () => tableauDeLaGamme(),
      texte: () => {
        const { fr, f } = programmation();
        return [
          `Au mois de pointe, les clients demandent plus d'heures-machine que les lignes n'en donnent. Le chapitre « Coût par produit » a tranché par le facteur rare : servir d'abord ce qui rapporte le plus par heure-machine, soit ${qte(fr.studio)} Studio, ${qte(fr.go)} Go et ${qte(fr.one)} One.`,
          `Le distributeur de la Studio exige désormais une courbe de réponse mesurée pour chaque enceinte de salon. La One et la Studio passent au banc de mesure, qui tourne ${heures(BANC_DE_MESURE.heuresParMois)} dans le mois ; la Go, nomade, n'y passe pas.`,
          `La Go garde sa place : elle ne passe pas au banc et rapporte plus par heure-machine que la One. Ses ${qte(f.go.unites)} unités prennent ${heures(f.go.heures)}-machine. Reste à partager la One et la Studio entre deux ressources : c'est un programme linéaire.`,
        ];
      },
      repere: () => "Un facteur rare : une seule ressource commune, on classe par marge par unité de ressource. Deux ressources communes : un programme linéaire, résolu par la méthode graphique.",
    },
    {
      id: "predire-le-banc",
      objectifs: [2],
      type: "choix",
      titre: "Pariez sur le plan du facteur rare",
      notions: ["capacity"],
      question: () => {
        const { fr } = programmation();
        return `Le plan du facteur rare sert ${qte(fr.studio)} Studio et ${qte(fr.one)} One. Une Studio prend 15 minutes au banc, une One 3 minutes. Avant de calculer, pariez : ce plan tient-il au banc ?`;
      },
      options: () => [
        { texte: "Non : il demande plus d'heures que le banc", juste: true, retour: "Bon pari. Le facteur rare a classé les références sur les seules heures-machine ; le banc, qu'il ignore, est dépassé. L'étape suivante le chiffre." },
        { texte: "Oui : le facteur rare classe déjà les références au mieux", juste: false, retour: "Non : il classe au mieux sur une seule ressource. Une seconde ressource commune peut rendre son plan impossible." },
        { texte: "Oui : la Go, qui ne passe pas au banc, lui laisse assez d'heures", juste: false, retour: "Non : la Go ne prend rien au banc, mais elle ne lui en donne pas non plus. Les Studio et les One, seules, le dépassent." },
      ],
    },
    {
      id: "le-banc-du-facteur-rare",
      objectifs: [2],
      type: "montants",
      titre: "Ce que le facteur rare demande au banc",
      notions: ["capacity"],
      question: () => {
        const { fr } = programmation();
        return `Calculez les heures de banc que demande le plan du facteur rare : (${qte(fr.one)} One × 3 minutes + ${qte(fr.studio)} Studio × 15 minutes) ÷ 60. Puis les heures qui manquent au banc, qui en a ${qte(BANC_DE_MESURE.heuresParMois)}.`;
      },
      champs: () => {
        const { fr } = programmation();
        return [
          { libelle: "Heures de banc demandées", nature: "grandeur", attendu: fr.heuresDuBanc, calcul: `(${qte(fr.one * 3)} + ${qte(fr.studio * 15)}) minutes ÷ 60 = ${qte(fr.heuresDuBanc)} heures` },
          { libelle: "Heures qui manquent au banc", nature: "grandeur", attendu: fr.manque, calcul: `${qte(fr.heuresDuBanc)} − ${qte(BANC_DE_MESURE.heuresParMois)} = ${qte(fr.manque)} heures` },
        ];
      },
      explication: () => {
        const { fr } = programmation();
        return [
          `Il manque ${heures(fr.manque)} au banc. Classer par marge par heure de banc ne marche pas mieux : la One passerait devant, et les heures-machine seraient dépassées à leur tour. Deux ressources communes, deux classements contraires : il faut les traiter ensemble.`,
        ];
      },
    },
    {
      id: "la-forme-canonique",
      objectifs: [0],
      type: "choix",
      titre: "La forme canonique",
      question: () =>
        "Posons x les One du mois et y les Studio du mois. La Go a pris ses heures-machine ; chaque contrainte s'écrit en heures. Quelle est la forme canonique du programme ?",
      options: () => {
        const { hmK, bancK, f } = programmation();
        const c = (a: number, b: number, k: number) => `${qte(a)} x + ${qte(b)} y ≤ ${qte(k)}`;
        const fin = `x ≤ ${qte(LA_ONE.demandeDuMoisDePointe)} ; y ≤ ${qte(LA_STUDIO.demandeDuMoisDePointe)}`;
        return [
          { texte: `${c(hmK.a, hmK.b, hmK.c)} ; ${c(bancK.a, bancK.b, bancK.c)} ; ${fin} ; max ${qte(f.marge.x)} x + ${qte(f.marge.y)} y`, juste: true, retour: `Oui. Les heures-machine sont celles que la Go laisse ; 3 minutes font ${qte(bancK.a)} heure et 15 minutes ${qte(bancK.b)} heure ; on maximise la marge sur coût variable, x et y positifs.` },
          { texte: `${c(hmK.a, hmK.b, hmK.c + f.go.heures)} ; ${c(bancK.a, bancK.b, bancK.c)} ; ${fin} ; max ${qte(f.marge.x)} x + ${qte(f.marge.y)} y`, juste: false, retour: `Non : la Go a déjà pris ${heures(f.go.heures)}-machine. La One et la Studio n'en ont que ${qte(hmK.c)}.` },
          { texte: `${c(hmK.a, hmK.b, hmK.c)} ; ${c(bancK.a, bancK.b, bancK.c)} ; ${fin} ; max ${qte(LA_ONE.prix)} x + ${qte(LA_STUDIO.prix)} y`, juste: false, retour: "Non : maximiser le chiffre d'affaires est l'erreur classique. Les charges fixes ne bougent pas ; c'est la marge sur coût variable qui fait le résultat." },
        ];
      },
    },
    {
      id: "le-laboratoire-du-programme",
      objectifs: [1],
      type: "simulation",
      titre: "Le laboratoire du programme",
      notions: ["capacity", "contribution_margin"],
      question: () =>
        "Choisissez les One et les Studio du mois. Le tableau suit les heures-machine, les heures du banc et la marge ; le graphique trace, selon les One, le plus de Studio que chaque ressource permet, et vos Studio. Relevez le défi.",
      leviers: () => [
        { code: "one", libelle: "One du mois (x)", unite: "One", ...LEVIERS_DU_PROGRAMME.one },
        { code: "studio", libelle: "Studio du mois (y)", unite: "Studio", ...LEVIERS_DU_PROGRAMME.studio },
      ],
      lecture: (_, p) => {
        const { hmK, bancK } = programmation();
        const l = laboratoireDuProgramme(p.one!, p.studio!);
        const u = (code: string) => l.usages.find((x) => x.code === code)!.utilise;
        return [
          { libelle: `Heures-machine prises, sur ${qte(hmK.c)}`, montant: u("heures-machine"), unite: "heures" },
          { libelle: `Heures du banc prises, sur ${qte(bancK.c)}`, montant: u("banc"), unite: "heures" },
          { libelle: l.admissible ? "Marge sur coût variable de la One et de la Studio" : "Marge, si le programme était possible", montant: l.marge, fort: true },
        ];
      },
      graphique: () => {
        const { hmK, bancK } = programmation();
        return {
          levier: "one",
          unite: "Studio",
          courbes: [
            { libelle: "Studio au plus, par les heures-machine", valeur: (p) => Math.round(((hmK.c - hmK.a * p.one!) / hmK.b) * 100) / 100 },
            { libelle: "Studio au plus, par le banc", valeur: (p) => Math.round(((bancK.c - bancK.a * p.one!) / bancK.b) * 100) / 100 },
            { libelle: "Vos Studio", valeur: (p) => p.studio! },
          ],
        };
      },
      montrer: "Montrer le programme",
      defi: () => {
        const { o } = programmation();
        return {
          consigne: "Trouvez le programme qui respecte toutes les contraintes et donne la plus forte marge.",
          atteint: (p) => {
            const l = laboratoireDuProgramme(p.one!, p.studio!);
            return l.admissible && Math.abs(l.marge - o.optimal.marge) < 1e-6;
          },
          indice: (p) => {
            const l = laboratoireDuProgramme(p.one!, p.studio!);
            const depassee = l.usages.find((u) => u.reste < -1e-6);
            if (depassee) return `${depassee.libelle} : ${qte(-depassee.reste)} de trop. Baissez les One ou les Studio.`;
            const libre = (code: string) => l.usages.find((u) => u.code === code)!.reste > 1e-6;
            if (libre("heures-machine") && libre("banc")) return "Tout tient, et les deux ressources ont encore du jeu : ajoutez des enceintes.";
            if (libre("banc")) return "Tout tient, mais le banc a encore du jeu : échangez des One contre des Studio, le long des heures-machine.";
            return "Tout tient, mais les heures-machine ont encore du jeu : échangez des Studio contre des One, le long du banc.";
          },
          solution: { one: o.optimal.x, studio: o.optimal.y },
        };
      },
      explication: (_, p) => {
        const { o } = programmation();
        return [
          `À ${qte(p.one!)} One et ${qte(p.studio!)} Studio, les heures-machine et le banc sont pris jusqu'à la dernière minute : la marge atteint ${eur(o.optimal.marge)}. Une Studio de plus, il faudrait rendre des One, et l'échange coûterait.`,
          "Sur le graphique, c'est le point où les deux plafonds se croisent : un sommet du domaine. Les étapes suivantes le trouvent par le calcul.",
        ];
      },
    },
    {
      id: "le-sommet-des-deux-droites",
      objectifs: [1],
      type: "montants",
      titre: "Le sommet des deux droites",
      notions: ["capacity"],
      question: () => {
        const { hmK, bancK } = programmation();
        return `Au sommet, les deux ressources sont saturées : ${qte(hmK.a)} x + ${qte(hmK.b)} y = ${qte(hmK.c)} et ${qte(bancK.a)} x + ${qte(bancK.b)} y = ${qte(bancK.c)}. Multipliez la seconde équation par 6 et retranchez la première : vous trouvez y, puis x.`;
      },
      champs: () => {
        const { o, hmK, bancK } = programmation();
        return [
          { libelle: "Studio (y)", nature: "quantite", attendu: o.optimal.y, calcul: `(${qte(6 * bancK.b)} − ${qte(hmK.b)}) y = ${qte(6 * bancK.c)} − ${qte(hmK.c)}, soit y = ${qte(6 * bancK.c - hmK.c)} ÷ ${qte(6 * bancK.b - hmK.b)} = ${qte(o.optimal.y)}` },
          { libelle: "One (x)", nature: "quantite", attendu: o.optimal.x, calcul: `x = (${qte(hmK.c)} − ${qte(hmK.b)} × ${qte(o.optimal.y)}) ÷ ${qte(hmK.a)} = ${qte(o.optimal.x)}` },
        ];
      },
      explication: () => {
        const { o } = programmation();
        return [`Le sommet ${o.optimal.nom} est (${qte(o.optimal.x)} ; ${qte(o.optimal.y)}) : c'est le programme que le laboratoire a trouvé. Il respecte aussi la demande, ${qte(LA_ONE.demandeDuMoisDePointe)} One et ${qte(LA_STUDIO.demandeDuMoisDePointe)} Studio au plus.`];
      },
    },
    {
      id: "les-sommets",
      objectifs: [1],
      type: "a-completer",
      titre: "Les sommets du domaine",
      notions: ["contribution_margin"],
      question: () => {
        const { o } = programmation();
        return `Le domaine des solutions acceptables a ${o.sommets.length} sommets, nommés en tournant depuis l'origine. Complétez les coordonnées qui manquent, puis la marge de chaque sommet : la méthode énumérative retient le plus fort.`;
      },
      grille: () => grilleDesSommets(),
      explication: () => {
        const { o } = programmation();
        const deuxieme = [...o.sommets].sort((p, q) => q.marge - p.marge)[1]!;
        return [
          `La marge la plus forte est au sommet ${o.optimal.nom}, ${eur(o.optimal.marge)}. Le suivant, ${deuxieme.nom}, donne ${eur(deuxieme.marge)} : servir toute la demande de la One n'est pas le meilleur choix.`,
        ];
      },
    },
    {
      id: "la-droite-d-isomarge",
      objectifs: [1],
      type: "choix",
      titre: "Pourquoi ce sommet",
      notions: ["contribution_margin"],
      question: () => {
        const { f, hmK, bancK } = programmation();
        return `Les droites ${qte(f.marge.x)} x + ${qte(f.marge.y)} y = k, une par niveau de marge, sont parallèles, de pente ${qte(penteDe(f.marge.x, f.marge.y))}. La droite des heures-machine a une pente de ${qte(penteDe(hmK.a, hmK.b))}, celle du banc de ${qte(penteDe(bancK.a, bancK.b))}. Pourquoi l'optimum est-il au croisement des deux ?`;
      },
      options: () => [
        { texte: "La pente de la marge est entre les deux", juste: true, retour: "Oui. En poussant la droite de marge loin de l'origine, elle quitte le domaine par le sommet où ses deux voisines l'encadrent. Une marge de la Studio plus forte la rendrait plus plate que le banc : l'optimum glisserait vers plus de Studio." },
        { texte: "C'est le sommet le plus éloigné de l'origine, sur le graphique", juste: false, retour: "Non : le sommet voisin, à 1 500 One, est plus loin de l'origine. Ce qui compte, c'est la marge, donc la pente de sa droite." },
        { texte: "C'est le seul sommet où deux contraintes sont saturées", juste: false, retour: "Non : chaque sommet est le croisement de deux droites. Celui-ci gagne parce que la droite de marge le touche en dernier." },
      ],
    },
    {
      id: "la-marge-du-mois",
      objectifs: [2],
      type: "montants",
      titre: "La marge du mois",
      notions: ["contribution_margin"],
      question: () => {
        const { fr } = programmation();
        return `Calculez la marge sur coût variable du mois au programme optimal, Go comprise. Puis ce que la contrainte du banc coûte, face aux ${eur(fr.marge)} que donnerait le plan du facteur rare si le banc n'existait pas.`;
      },
      champs: () => {
        const { o, fr } = programmation();
        return [
          { libelle: "Marge sur coût variable du mois, Go comprise", attendu: o.margeAvecLaGo, calcul: `${eur(o.optimal.marge)} + ${qte(o.forme.go.unites)} Go × ${eur(LA_GO.prix - LA_GO.coutVariableUnitaire)} = ${eur(o.margeAvecLaGo)}` },
          { libelle: "Ce que la contrainte du banc coûte", attendu: fr.marge - o.margeAvecLaGo, calcul: `${eur(fr.marge)} − ${eur(o.margeAvecLaGo)} = ${eur(fr.marge - o.margeAvecLaGo)}` },
        ];
      },
      explication: () => {
        const { o, fr } = programmation();
        return [
          `Le banc coûte ${eur(fr.marge - o.margeAvecLaGo)} de marge dans le mois : ${qte(fr.studio - o.optimal.y)} Studio de moins, ${qte(o.optimal.x - fr.one)} One de plus. Le programme linéaire ne crée pas de marge, il choisit le moins mauvais partage.`,
        ];
      },
    },
    {
      id: "une-heure-de-banc-de-plus",
      objectifs: [1, 2],
      type: "montants",
      titre: "Une heure de banc de plus",
      notions: ["capacity", "contribution_margin"],
      question: () => {
        const { bancK } = programmation();
        return `L'opérateur du banc propose une heure de plus dans le mois, ${heures(bancK.c + 1)}. Recalculez le sommet des deux droites (à l'enceinte), puis ce que cette heure rapporte de marge.`;
      },
      champs: () => {
        const { banc, hmK } = programmation();
        const p = banc.plus.optimal;
        return [
          { libelle: "Studio (y)", nature: "quantite", attendu: p.y, calcul: `y = (6 × ${qte(banc.plus.forme.leviers.heuresDuBanc)} − ${qte(hmK.c)}) ÷ (6 × 0,25 − 0,5) = ${qte(p.y)}` },
          { libelle: "One (x)", nature: "quantite", attendu: p.x, calcul: `x = (${qte(hmK.c)} − 0,5 × ${qte(p.y)}) ÷ 0,3 = ${qte(p.x)}` },
          { libelle: "Marge gagnée", attendu: banc.valeur, calcul: `${eur(p.marge)} − ${eur(banc.base.optimal.marge)} = ${eur(banc.valeur)}` },
        ];
      },
      explication: () => {
        const { banc, hm } = programmation();
        return [
          `Une heure de banc vaut ${eur(banc.valeur)} de marge : c'est sa valeur marginale, le plus que NOVA devrait payer pour l'obtenir. Une heure-machine de plus, elle, vaudrait ${eur(hm.valeur)}.`,
          `La Go tire ${eur((LA_GO.prix - LA_GO.coutVariableUnitaire) / LA_GO.heuresMachineParUnite)} d'une heure-machine, plus que ces ${eur(hm.valeur)} : lui reprendre des heures ferait perdre. C'est pourquoi elle est servie entière.`,
        ];
      },
    },
    {
      id: "le-lancement-de-la-go",
      type: "lecture",
      titre: "Lancer la Go, tâche par tâche",
      tableau: () => tableauDesTaches(),
      texte: () => {
        const { mpm } = programmation();
        return [
          `Avant de vendre la Go, il faut la concevoir, faire fabriquer son moule, régler une ligne, la certifier et préparer sa campagne. Le tableau donne les ${qte(mpm.taches.length)} tâches, leur durée et celles qui doivent être finies avant.`,
          "La méthode des potentiels (MPM) dessine chaque tâche par un carré et chaque contrainte de succession par une flèche, valuée par la durée de la tâche d'où elle part. Elle répond à deux questions : quand la Go sera-t-elle en vente, et quelles tâches ne souffrent aucun retard ?",
        ];
      },
      repere: () => "Début au plus tôt : la plus grande des fins au plus tôt des tâches d'avant. Début au plus tard : la plus petite des dates au plus tard des tâches d'après, moins la durée.",
    },
    {
      id: "predire-le-retard",
      objectifs: [3],
      type: "choix",
      titre: "Pariez sur un retard du mouliste",
      question: () => "Le mouliste annonce une semaine de retard sur le moule du boîtier (tâche D). Avant de calculer les dates, pariez : que devient la mise en vente de la Go ?",
      options: () => [
        { texte: "Elle recule d'une semaine", juste: true, retour: "Bon pari. Le moule est sur le chemin le plus long du projet : tout retard s'y répercute sur la fin. Les étapes suivantes le montrent par les dates." },
        { texte: "Rien ne bouge : d'autres tâches avancent en même temps", juste: false, retour: "Non : les essais et la campagne avancent en parallèle, mais la présérie attend le moule. Sur le chemin le plus long, rien ne compense un retard." },
        { texte: `Elle recule de ${semaines(tache("D").duree)}, la durée du moule`, juste: false, retour: "Non : seul le retard s'ajoute, pas la durée de la tâche, déjà comptée dans le projet." },
      ],
    },
    {
      id: "les-dates-au-plus-tot",
      objectifs: [3],
      type: "a-completer",
      titre: "Les dates au plus tôt",
      question: () =>
        "Calculez le début au plus tôt de chaque tâche, de la gauche vers la droite : quand plusieurs tâches précèdent, on retient la plus grande de leurs fins au plus tôt. Puis la fin du projet.",
      grille: () => grilleDesDatesAuPlusTot(),
      explication: () => {
        const { mpm } = programmation();
        return [
          `La Go peut être en vente au mieux ${semaines(mpm.fin)} après le départ du projet. La présérie (tâche G) attend le moule, qui finit en semaine ${qte(tache("D").finAuPlusTot)}, et non le réglage, fini en semaine ${qte(tache("E").finAuPlusTot)} : quand des flèches convergent, le chemin le plus long commande.`,
        ];
      },
    },
    {
      id: "les-dates-au-plus-tard",
      objectifs: [3, 4],
      type: "a-completer",
      titre: "Les dates au plus tard",
      question: () => {
        const { mpm } = programmation();
        return `Reportez la fin du projet, semaine ${qte(mpm.fin)}, et remontez de la droite vers la gauche : le début au plus tard d'une tâche est la plus petite des dates au plus tard des tâches qui la suivent, moins sa durée. Puis la marge totale de chacune.`;
      },
      grille: () => grilleDesDatesAuPlusTard(),
      explication: () => {
        const { mpm } = programmation();
        const libres = mpm.taches.filter((t) => !t.critique);
        return [
          `${qte(mpm.critiques.length)} tâches ont une marge totale nulle : ${liste(mpm.critiques)}. Les autres peuvent glisser : ${liste(libres.map((t) => `${t.code} de ${semaines(t.margeTotale)}`))}, sans retarder la mise en vente.`,
        ];
      },
    },
    {
      id: "le-chemin-critique",
      objectifs: [3],
      type: "choix",
      titre: "Le chemin critique",
      question: () => "Quel est le chemin critique du lancement de la Go ?",
      options: () => {
        const { mpm } = programmation();
        const sansMargeLibre = mpm.taches.filter((t) => t.margeLibre === 0).map((t) => t.code);
        const essais = cheminsDuLancement().find((c) => c.taches.join("") === "ABFHI")!;
        return [
          { texte: `${mpm.critiques.join(", ")} : ${semaines(mpm.fin)}`, juste: true, retour: `Oui : ce sont les tâches de marge totale nulle, et la somme de leurs durées fait la durée du projet, ${mpm.critiques.map((c) => qte(tache(c).duree)).join(" + ")} = ${qte(mpm.fin)}.` },
          { texte: `A, B, F, H, I : ${semaines(essais.longueur)}`, juste: false, retour: `Non : ce chemin dure ${semaines(essais.longueur)}, moins que le projet. Ses tâches F et H ont ${semaines(tache("F").margeTotale)} de marge totale.` },
          { texte: `Les tâches sans marge libre : ${sansMargeLibre.join(", ")}`, juste: false, retour: "Non : une marge libre nulle ne fait pas une tâche critique. La tâche F n'a pas de marge libre, mais une semaine de marge totale ; c'est la marge totale qui dit critique." },
        ];
      },
    },
    {
      id: "les-marges-libres",
      objectifs: [4],
      type: "a-completer",
      titre: "Les marges libres",
      question: () =>
        "La marge libre d'une tâche est le retard qu'elle peut prendre sans décaler le début au plus tôt d'aucune tâche qui la suit. Complétez celle des tâches qui ne sont pas critiques.",
      grille: () => grilleDesMargesLibres(),
      explication: () => {
        const c = tache("C");
        const f = tache("F");
        return [
          `Le choix des composants (tâche C) a ${semaines(c.margeTotale)} de marge totale, mais ${semaines(c.margeLibre)} de marge libre : au-delà, il retarde le réglage de la ligne, sans retarder la mise en vente. Les essais (tâche F) n'ont aucune marge libre.`,
          `La marge libre est toujours au plus égale à la marge totale : ${qte(f.margeLibre)} contre ${qte(f.margeTotale)} pour les essais.`,
        ];
      },
    },
    {
      id: "interpreter-les-marges",
      objectifs: [4],
      type: "choix",
      titre: "Un retard sur les essais",
      question: () => "Le laboratoire annonce une semaine de retard sur les essais acoustiques (tâche F). Que se passe-t-il ?",
      options: () => [
        { texte: "La campagne part plus tard, pas la mise en vente", juste: true, retour: `Oui. Les essais ont ${semaines(tache("F").margeTotale)} de marge totale : la Go sort à la même date. Mais leur marge libre est nulle : la campagne (tâche H) commence une semaine plus tard, et perd sa propre marge.` },
        { texte: "La mise en vente recule d'une semaine, comme pour le moule", juste: false, retour: "Non : les essais ne sont pas sur le chemin critique. Leur semaine de marge totale absorbe ce retard." },
        { texte: "Rien ne bouge du tout : la tâche F a une semaine de marge totale", juste: false, retour: "Non : la mise en vente ne bouge pas, mais la campagne, qui suit les essais, doit partir plus tard. C'est ce que dit une marge libre nulle." },
      ],
    },
    {
      id: "le-laboratoire-du-lancement",
      objectifs: [3, 4],
      type: "simulation",
      titre: "Le laboratoire du lancement",
      question: () => {
        const { mpm } = programmation();
        return `La direction veut la Go en vente en ${semaines(LANCEMENT_VISE)}, au lieu de ${qte(mpm.fin)}. Le mouliste peut gagner des semaines sur le moule (${eur(COMPRESSIONS_POSSIBLES.D.coutParSemaine)} chacune), le laboratoire sur les essais (${eur(COMPRESSIONS_POSSIBLES.F.coutParSemaine)}). Le graphique suit les chemins selon le moule. Relevez le défi.`;
      },
      leviers: () => [
        { code: "moule", libelle: "Semaines gagnées sur le moule", unite: "sem.", min: 0, max: COMPRESSIONS_POSSIBLES.D.auPlus, pas: 1, depart: 0 },
        { code: "essais", libelle: "Semaines gagnées sur les essais", unite: "sem.", min: 0, max: COMPRESSIONS_POSSIBLES.F.auPlus, pas: 1, depart: 0 },
      ],
      lecture: (_, p) => {
        const l = lancementAvance(p.moule!, p.essais!);
        const depart = lancementAvance(0, 0);
        const chemin = (x: typeof l, code: string) => x.chemins.find((c) => c.taches.join("") === code)!.longueur;
        return [
          { libelle: "Chemin du moule (A, B, D, G, I)", montant: chemin(l, "ABDGI"), unite: "semaines", reference: chemin(depart, "ABDGI") },
          { libelle: "Chemin des essais (A, B, F, H, I)", montant: chemin(l, "ABFHI"), unite: "semaines", reference: chemin(depart, "ABFHI") },
          { libelle: "Mise en vente de la Go", montant: l.fin, unite: "semaines", reference: depart.fin, fort: true },
          { libelle: "Ce que coûte l'avance", montant: l.cout },
        ];
      },
      graphique: () => ({
        levier: "moule",
        unite: "semaines",
        courbes: [
          { libelle: "Chemin du moule", valeur: (p) => lancementAvance(p.moule!, p.essais!).chemins.find((c) => c.taches.join("") === "ABDGI")!.longueur },
          { libelle: "Chemin des essais", valeur: (p) => lancementAvance(p.moule!, p.essais!).chemins.find((c) => c.taches.join("") === "ABFHI")!.longueur },
          { libelle: "Mise en vente de la Go", valeur: (p) => lancementAvance(p.moule!, p.essais!).fin },
        ],
      }),
      montrer: "Montrer l'avance",
      defi: () => {
        const m = lancementAvanceLeMoinsCher();
        return {
          consigne: `Mettez la Go en vente en ${semaines(LANCEMENT_VISE)} au plus, au moindre coût.`,
          atteint: (p) => {
            const l = lancementAvance(p.moule!, p.essais!);
            return l.tenu && l.cout === m.cout;
          },
          indice: (p) => {
            const l = lancementAvance(p.moule!, p.essais!);
            if (!l.tenu) {
              const long = l.chemins[0]!;
              return `La Go sort en semaine ${qte(l.fin)} : le chemin ${long.taches.join(", ")} est encore trop long. Gagnez sur une de ses tâches.`;
            }
            return `La date est tenue, mais à ${eur(l.cout)} : une semaine gagnée ne sert que sur un chemin trop long. Retirez celle qui ne raccourcit rien.`;
          },
          solution: { moule: m.gagneesSurLeMoule, essais: m.gagneesSurLesEssais },
        };
      },
      explication: (_, p) => {
        const l = lancementAvance(p.moule!, p.essais!);
        return [
          `${semaines(l.gagneesSurLeMoule)} gagnées sur le moule, ${semaines(l.gagneesSurLesEssais)} sur les essais : la Go sort en semaine ${qte(l.fin)}, pour ${eur(l.cout)}. Gagner sur le moule seul ne suffisait pas : au-delà d'une semaine, le chemin des essais devenait le plus long.`,
          `Les deux chemins font maintenant ${semaines(l.fin)} : ils sont critiques tous les deux, et leurs tâches, ${liste(l.ordonnancement.critiques)}, n'ont plus de marge. Raccourcir un projet, c'est raccourcir son chemin critique, puis surveiller celui qui le devient.`,
        ];
      },
    },
    {
      id: "synthese",
      type: "lecture",
      titre: "Ce qu'il faut retenir",
      notions: ["capacity", "contribution_margin"],
      texte: () => {
        const { o, banc, mpm } = programmation();
        return [
          `Une seule ressource commune : le facteur rare classe les produits par marge par unité de ressource. Deux ressources communes : le programme linéaire. On écrit sa forme canonique, on trace les contraintes, et le programme optimal est un sommet du domaine, ici ${qte(o.optimal.x)} One et ${qte(o.optimal.y)} Studio.`,
          `La valeur marginale d'une ressource saturée dit ce qu'une unité de plus rapporte : ${eur(banc.valeur)} pour une heure de banc.`,
          `Le graphe MPM date chaque tâche au plus tôt et au plus tard. Le chemin critique, ${mpm.critiques.join(", ")}, fait la durée du projet ; la marge totale est le retard qui ne décale pas la fin, la marge libre celui qui ne décale aucune tâche suivante.`,
          "Dans l'arène, votre capacité est aussi partagée entre vos décisions : la méthode, elle, est la même.",
        ];
      },
      repere: () => "Programme linéaire : variables, contraintes, fonction économique, sommets. MPM : marge totale = au plus tard − au plus tôt ; marge libre = plus petit début au plus tôt des suivantes − fin au plus tôt.",
    },
  ],
};
