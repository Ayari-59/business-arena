import type { Cas } from "../../config/cours/cas";
import { CHAPITRES, PALIERS, PARCOURS } from "../../config/cours/registre";
import { motsDuContenu } from "../../config/cours/situations";
import type {
  ChampDeMontant,
  Chapitre,
  EtapeCurseur,
  EtapeSimulation,
  LevierDeSimulation,
  LigneDeSimulation,
  OptionDeChoix,
  Piece,
  TableauDeDonnees,
  Vue,
} from "../../config/cours/types";
import { enEcriture, type EcritureAttendue } from "./correcteur";
import { chapitreDuCas, etatAvant, indexDeLEtape } from "./deroule";
import type { Ecriture } from "./etats";
import { cleDeLaQuestion, dansLOrdreAffiche } from "./ordre-des-options";

/**
 * LE CHAPITRE SERVI AU NAVIGATEUR : SES DONNÉES, PAS SON CODE (audit, P0).
 *
 * Un chapitre est écrit en fonctions du cas (config/cours/types.ts). Le guide, composant
 * client, les appelait lui-même : il importait le registre du cours entier, et les textes
 * de tous les chapitres, réservés compris, partaient dans les fichiers JavaScript publics.
 * La licence ne protégeait que l'affichage.
 *
 * La page, après le contrôle de la licence, appelle ici ces fonctions pour l'entreprise
 * choisie et n'envoie que leurs résultats : des textes, des montants, les écritures
 * attendues (le correcteur reste au navigateur, pour l'élève qui y a droit). Ce qui dépend
 * d'un geste continu (le curseur, les leviers du laboratoire) se lit au serveur position
 * par position (`lireLeCurseur`, `lireLeLaboratoire`, route /api/cours/lecture), sous le
 * même contrôle.
 *
 * Ce module est serveur : aucun composant « use client » ne doit l'importer
 * (tests/architecture/corriges-hors-du-navigateur.test.ts).
 */

interface BaseServie {
  id: string;
  titre: string;
  notions?: readonly string[];
  tableau?: TableauDeDonnees;
}

export interface LectureServie extends BaseServie {
  type: "lecture";
  texte: string[];
  repere?: string;
}

export interface EcritureServie extends BaseServie {
  type: "ecriture";
  evenement: string;
  piece?: Piece;
  attendue: EcritureAttendue;
  indices: string[];
  explication: string[];
  vue?: Vue;
}

export interface ChoixServi extends BaseServie {
  type: "choix";
  question: string;
  /** Dans l'ordre affiché, déjà mélangé (ordre-des-options.ts). */
  options: OptionDeChoix[];
  vue?: Vue;
}

export interface MontantsServis extends BaseServie {
  type: "montants";
  question: string;
  champs: ChampDeMontant[];
  explication: string[];
  vue?: Vue;
}

export interface ComparaisonServie extends BaseServie {
  type: "comparaison";
  question: string;
  /** L'index de l'étape qui sépare « avant » et « après ». */
  avantLEtape: number;
  libelles: { avant: string; apres: string };
  options: OptionDeChoix[];
  explication: string[];
}

export interface TriServi extends BaseServie {
  type: "tri";
  question: string;
  categories: readonly { code: string; libelle: string }[];
  elements: { libelle: string; montant: number; categorie: string; pourquoi: string }[];
  explication: string[];
}

/** Ce que montre le curseur à une position : le tableau, et les deux droites à cette position. */
export interface LectureDuCurseur {
  lignes: { libelle: string; montant: number; fort?: boolean }[];
  produit: number;
  cout: number;
}

export interface CurseurServi extends BaseServie {
  type: "curseur";
  question: string;
  cible: { attendu: number; max: number; min: number };
  grandeur: { libelle: string; unite: string };
  /** La grandeur par défaut : les ventes du mois (les boutons disent « une vente »). */
  parDefaut: boolean;
  rates: { dessous: string; dessus: string };
  zones: readonly [string, string];
  montrer?: string;
  /** Les deux droites à leurs extrémités : le graphique les trace d'un trait. */
  droites: { libelles: [string, string]; produit: [number, number]; cout: [number, number] };
  /** La position de départ, et sa lecture ; la lecture à la position attendue. */
  depart: number;
  lectureDeDepart: LectureDuCurseur;
  lectureAttendue: LectureDuCurseur;
  explication: string[];
}

/** Ce que montre le laboratoire pour une position des leviers. */
export interface LectureDuLaboratoire {
  lignes: LigneDeSimulation[];
  atteint: boolean;
  /** Ce que l'élève lit quand sa position ne réussit pas encore le défi ; vide sinon. */
  indice: string;
  /** L'explication à cette position, quand elle réussit le défi. */
  explication: string[] | null;
  /** Le plus grand effet de la lecture, pour l'échelle des barres. */
  plusGrandEffet: number;
  graphique: { xs: number[]; series: number[][]; ici: number[] } | null;
}

export interface SimulationServie extends BaseServie {
  type: "simulation";
  question: string;
  leviers: LevierDeSimulation[];
  consigne: string;
  solution: Record<string, number>;
  montrer?: string;
  graphique: { levier: string; libelles: string[]; unite?: string } | null;
  lectureDeDepart: LectureDuLaboratoire;
  lectureDeLaSolution: LectureDuLaboratoire;
}

export type EtapeServie =
  | LectureServie
  | EcritureServie
  | ChoixServi
  | MontantsServis
  | ComparaisonServie
  | TriServi
  | CurseurServi
  | SimulationServie;

export interface ChapitreServi {
  code: string;
  titre: string;
  objectifs: readonly string[];
  /** Les chapitres à avoir vus avant, annoncés à la première étape (audit pédagogique, P1-2). */
  prerequis: { code: string; titre: string }[];
  parcours: string;
  palier: number;
  mots: ReturnType<typeof motsDuContenu>;
  /** Le journal complet : la balance d'ouverture, puis les écritures attendues, dans l'ordre. */
  journal: Ecriture[];
  /** Pour chaque étape (et la fin), le nombre d'écritures du journal passées avant elle. */
  ecrituresAvant: number[];
  etapes: EtapeServie[];
}

const VENTES_DU_MOIS = (cas: Cas) => ({ libelle: "Ventes du mois", unite: cas.unites });
const RATES_DU_SEUIL = {
  dessous: "À cette position, l'entreprise perd encore de l'argent.",
  dessus: "Plus bas, l'entreprise ne perd toujours pas d'argent : cherchez la plus petite quantité.",
};

export function lireLeCurseur(etape: EtapeCurseur, cas: Cas, quantite: number): LectureDuCurseur {
  const d = etape.droites(cas);
  return { lignes: etape.lecture(cas, quantite), produit: d.produit(quantite), cout: d.cout(quantite) };
}

/** La position de départ du curseur : au quart de sa course. */
const departDuCurseur = (c: { min: number; max: number }) => Math.round(c.min + (c.max - c.min) / 4);

export function lireLeLaboratoire(etape: EtapeSimulation, cas: Cas, position: Readonly<Record<string, number>>): LectureDuLaboratoire {
  const lignes = [...etape.lecture(cas, position)];
  const defi = etape.defi(cas);
  const atteint = defi.atteint(position);
  const g = etape.graphique?.(cas);
  let graphique: LectureDuLaboratoire["graphique"] = null;
  if (g) {
    const levier = etape.leviers(cas).find((l) => l.code === g.levier)!;
    // Un point par pas du levier, entre 60 et 200 : des dents de scie sur 90 jours restent nettes.
    const n = Math.min(200, Math.max(60, Math.round((levier.max - levier.min) / levier.pas)));
    const xs = Array.from({ length: n + 1 }, (_, i) => levier.min + ((levier.max - levier.min) * i) / n);
    graphique = {
      xs,
      series: g.courbes.map((c) => xs.map((v) => c.valeur({ ...position, [levier.code]: v }))),
      ici: g.courbes.map((c) => c.valeur(position)),
    };
  }
  return {
    lignes,
    atteint,
    indice: atteint ? "" : defi.indice(position),
    explication: atteint ? etape.explication(cas, position) : null,
    plusGrandEffet: Math.max(0, ...lignes.filter((x) => x.effet).map((x) => Math.abs(x.montant))),
    graphique,
  };
}

/** Une position reçue du navigateur, ramenée aux leviers de l'étape : null si elle n'en est pas une. */
export function positionValide(leviers: readonly LevierDeSimulation[], brute: unknown): Record<string, number> | null {
  if (!brute || typeof brute !== "object") return null;
  const p: Record<string, number> = {};
  for (const l of leviers) {
    const v = (brute as Record<string, unknown>)[l.code];
    if (typeof v !== "number" || !Number.isFinite(v) || v < l.min - 1e-9 || v > l.max + 1e-9) return null;
    p[l.code] = v;
  }
  return p;
}

/** Le chapitre, dans l'ordre de cette entreprise, réduit à ses données pour le navigateur. */
export function servirLeChapitre(source: Chapitre, cas: Cas): ChapitreServi {
  const chapitre = chapitreDuCas(source, cas);
  const journal: Ecriture[] = chapitre.ouverture ? [chapitre.ouverture(cas)] : [];
  const ecrituresAvant: number[] = [];
  chapitre.etapes.forEach((e) => {
    ecrituresAvant.push(journal.length);
    if (e.type === "ecriture") journal.push(enEcriture(e.ecriture(cas)));
  });
  ecrituresAvant.push(journal.length);

  const etapes = chapitre.etapes.map((e, index): EtapeServie => {
    const base: BaseServie = {
      id: e.id,
      titre: e.titre,
      ...(e.notions ? { notions: e.notions } : {}),
      ...(e.tableau ? { tableau: e.tableau(cas) } : {}),
    };
    const avant = etatAvant(chapitre, cas, index);
    const ordre = (options: OptionDeChoix[]) => dansLOrdreAffiche(options, cleDeLaQuestion(chapitre.code, e.id, cas.code));
    switch (e.type) {
      case "lecture":
        return { ...base, type: "lecture", texte: e.texte(cas), ...(e.repere ? { repere: e.repere(cas) } : {}) };
      case "ecriture":
        return {
          ...base,
          type: "ecriture",
          evenement: e.evenement(cas),
          ...(e.piece ? { piece: e.piece(cas) } : {}),
          attendue: e.ecriture(cas),
          indices: e.indices(cas),
          explication: e.explication(cas, etatAvant(chapitre, cas, index + 1)),
          ...(e.vue ? { vue: e.vue } : {}),
        };
      case "choix":
        return { ...base, type: "choix", question: e.question(cas, avant), options: ordre(e.options(cas, avant)), ...(e.vue ? { vue: e.vue } : {}) };
      case "montants":
        return {
          ...base,
          type: "montants",
          question: e.question(cas, avant),
          champs: e.champs(cas, avant),
          explication: e.explication(cas, avant),
          ...(e.vue ? { vue: e.vue } : {}),
        };
      case "comparaison": {
        const k = indexDeLEtape(chapitre, e.avantLEtape);
        const debut = etatAvant(chapitre, cas, k);
        return {
          ...base,
          type: "comparaison",
          question: e.question(cas),
          avantLEtape: k,
          libelles: e.libelles,
          options: ordre(e.options(cas, debut, avant)),
          explication: e.explication(cas, debut, avant),
        };
      }
      case "tri":
        return { ...base, type: "tri", question: e.question(cas), categories: e.categories, elements: e.elements(cas), explication: e.explication(cas) };
      case "curseur": {
        const { attendu, max, min = 0 } = e.cible(cas);
        const d = e.droites(cas);
        const depart = departDuCurseur({ min, max });
        return {
          ...base,
          type: "curseur",
          question: e.question(cas),
          cible: { attendu, max, min },
          grandeur: (e.grandeur ?? VENTES_DU_MOIS)(cas),
          parDefaut: !e.grandeur,
          rates: e.rates?.(cas) ?? RATES_DU_SEUIL,
          zones: e.zones ?? ["Zone de bénéfice", "Zone de perte"],
          ...(e.montrer ? { montrer: e.montrer } : {}),
          droites: { libelles: d.libelles, produit: [d.produit(min), d.produit(max)], cout: [d.cout(min), d.cout(max)] },
          depart,
          lectureDeDepart: lireLeCurseur(e, cas, depart),
          lectureAttendue: lireLeCurseur(e, cas, attendu),
          explication: e.explication(cas),
        };
      }
      case "simulation": {
        const leviers = [...e.leviers(cas)];
        const defi = e.defi(cas);
        const g = e.graphique?.(cas);
        const depart = Object.fromEntries(leviers.map((l) => [l.code, l.depart]));
        return {
          ...base,
          type: "simulation",
          question: e.question(cas),
          leviers,
          consigne: defi.consigne,
          solution: { ...defi.solution },
          ...(e.montrer ? { montrer: e.montrer } : {}),
          graphique: g ? { levier: g.levier, libelles: g.courbes.map((c) => c.libelle), ...(g.unite ? { unite: g.unite } : {}) } : null,
          lectureDeDepart: lireLeLaboratoire(e, cas, depart),
          lectureDeLaSolution: lireLeLaboratoire(e, cas, defi.solution),
        };
      }
    }
  });

  return {
    code: chapitre.code,
    titre: chapitre.titre,
    objectifs: chapitre.objectifs,
    prerequis: (chapitre.prerequis ?? []).map((code) => ({ code, titre: CHAPITRES.find((c) => c.code === code)!.titre })),
    parcours: PARCOURS.find((p) => p.code === chapitre.parcours)!.titre,
    palier: PALIERS.find((p) => p.palier === chapitre.palier)!.palier,
    mots: motsDuContenu(chapitre.code),
    journal,
    ecrituresAvant,
    etapes,
  };
}
