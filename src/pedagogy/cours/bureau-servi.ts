import type { Bureau, EtapeDeClassement, EtapeDeRectification, EtapeDeReponse, EtapeDEtat, EtapeDuBureau, EtapeDuJournal, PieceDuBureau } from "../../config/cours/bureaux/types";
import { CHAPITRES, PALIERS, PARCOURS } from "../../config/cours/registre";
import { typographier } from "../../lib/typographie";
import { corriger, enSaisie, lireMontant, type Correction, type EcritureAttendue, type LigneSaisie } from "./correcteur";
import { cleDeLaQuestion, dansLOrdreAffiche } from "./ordre-des-options";
import { corrigerLeTableau, solutionsDuTableau, type CorrectionDuTableau, type TableauACompleter } from "./tableau-a-completer";

/**
 * LE BUREAU SERVI ET CORRIGÉ AU SERVEUR (décision du propriétaire, novembre 2026).
 *
 * Un chapitre part au navigateur avec ses réponses, pour l'élève qui y a droit : le correcteur y tourne
 * (chapitre-servi.ts). Un bureau, non. La page sert la pile et les consignes, réduites à ce que l'élève
 * doit lire (`servirLeBureau`) : ni la catégorie d'une pièce, ni la valeur d'une case à saisir, ni une
 * écriture attendue, ni la bonne option d'une question. Chaque geste de l'élève remonte à l'action
 * serveur (app/cours/bureau/actions.ts), qui contrôle l'accès puis appelle `corrigerAuBureau` : la
 * réponse ne porte que la correction de ce geste. Les explications et les calculs ne partent qu'une
 * fois l'étape réussie, ou quand l'élève demande la correction.
 *
 * LE MÊME MOTEUR SERT L'ENQUÊTE (config/cours/enquetes, app/cours/enquete/actions.ts) : un dossier dont
 * l'élève trie les écritures, justes ou fausses, puis rectifie les fausses (l'étape « rectification ») ;
 * la raison de chaque erreur et l'écriture juste restent ici, comme le reste des corrigés.
 *
 * Ce module est serveur : aucun composant « use client » ne doit l'importer
 * (tests/architecture/corriges-hors-du-navigateur.test.ts).
 */

// ─────────────────────────────────────────────────────────────────────────────
// CE QUI EST SERVI
// ─────────────────────────────────────────────────────────────────────────────

interface BaseServie {
  id: string;
  titre: string;
  consigne: string;
  pieces: readonly string[];
}

export interface ClassementServi extends BaseServie {
  type: "classement";
  categories: readonly { code: string; libelle: string }[];
  elements: { code: string; libelle: string; montant?: number; piece?: string }[];
}

export interface EtatServi extends BaseServie {
  type: "etat";
  /** La grille, ses cases à saisir vidées : ni valeur, ni calcul, ni indice. */
  grille: TableauACompleter;
}

export type JournalServi = BaseServie & { type: "journal" };

export interface ReponseServie extends BaseServie {
  type: "reponse";
  /** Les options dans l'ordre affiché, leur seul texte. */
  questions: { id: string; question: string; options: { texte: string }[] }[];
}

/** Rectifier : l'étape de classement qui donne les écritures à rectifier, et les raisons à choisir. */
export interface RectificationServie extends BaseServie {
  type: "rectification";
  depuis: { etape: string; dans: string };
  raisons: readonly { code: string; libelle: string }[];
}

export type EtapeDuBureauServie = ClassementServi | EtatServi | JournalServi | ReponseServie | RectificationServie;

export interface BureauServi {
  code: string;
  /** Le format : un bureau ou une enquête, pour les mots de la page et l'action qui corrige. */
  format: "bureau" | "enquete";
  titre: string;
  accroche: string;
  objectifs: readonly string[];
  commanditaire: string;
  entreprise: string;
  parcours: string;
  palier: number;
  accueil: readonly string[];
  /** Les chapitres que le bureau reprend, pour y revenir. */
  chapitres: { code: string; titre: string }[];
  pile: readonly PieceDuBureau[];
  etapes: EtapeDuBureauServie[];
}

/** La grille sans ses réponses : une case à saisir n'a plus que sa place et son unité. */
export function grilleSansReponses(g: TableauACompleter): TableauACompleter {
  return {
    titre: g.titre,
    colonnes: g.colonnes,
    lignes: g.lignes.map((l) => ({
      libelle: l.libelle,
      ...(l.fort ? { fort: true } : {}),
      cellules: l.cellules.map((c) => (c.saisir ? { valeur: null, saisir: true, ...(c.unite ? { unite: c.unite } : {}) } : c)),
    })),
  };
}

const ordreDesOptions = (b: Bureau, etape: string, question: { id: string; options: readonly { texte: string }[] }) =>
  dansLOrdreAffiche(question.options, cleDeLaQuestion(b.code, `${etape}/${question.id}`, b.entreprise.code));

function servirLEtape(b: Bureau, e: EtapeDuBureau): EtapeDuBureauServie {
  const base: BaseServie = { id: e.id, titre: e.titre, consigne: e.consigne, pieces: e.pieces };
  switch (e.type) {
    case "classement":
      return {
        ...base,
        type: "classement",
        categories: e.categories,
        elements: e.elements.map((x) => ({ code: x.code, libelle: x.libelle, ...(x.montant !== undefined ? { montant: x.montant } : {}), ...(x.piece ? { piece: x.piece } : {}) })),
      };
    case "etat":
      return { ...base, type: "etat", grille: grilleSansReponses(e.grille) };
    case "journal":
      return { ...base, type: "journal" };
    case "reponse":
      return { ...base, type: "reponse", questions: e.questions.map((q) => ({ id: q.id, question: q.question, options: ordreDesOptions(b, e.id, q).map((o) => ({ texte: o.texte })) })) };
    case "rectification":
      return { ...base, type: "rectification", depuis: e.depuis, raisons: e.raisons };
  }
}

/** Le bureau, réduit à ce que l'élève lit : la pile, les consignes, rien de ce qu'on attend de lui. */
export function servirLeBureau(b: Bureau): BureauServi {
  return typographier({
    code: b.code,
    format: b.format ?? "bureau",
    titre: b.titre,
    accroche: b.accroche,
    objectifs: b.objectifs,
    commanditaire: b.commanditaire,
    entreprise: b.entreprise.nom,
    parcours: PARCOURS.find((p) => p.code === b.parcours)!.titre,
    palier: PALIERS.find((p) => p.palier === b.palier)!.palier,
    accueil: b.accueil,
    chapitres: b.reprend.map((code) => ({ code, titre: CHAPITRES.find((c) => c.code === code)!.titre })),
    pile: b.pile,
    etapes: b.etapes.map((e) => servirLEtape(b, e)),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// CE QUI EST CORRIGÉ
// ─────────────────────────────────────────────────────────────────────────────

/** Ce que le navigateur envoie : l'étape, le geste, et la réponse de l'élève. */
export type EnvoiAuBureau =
  | { etape: string; geste: "classer"; choix: Record<string, string> }
  | { etape: string; geste: "etat"; saisies: Record<string, string> }
  | { etape: string; geste: "ecriture"; saisie: LigneSaisie[]; faites: string[] }
  | { etape: string; geste: "repondre"; question: string; option: string; justes: string[] }
  | { etape: string; geste: "rectifier"; ecriture: string; raison: string; saisie: LigneSaisie[]; faites: string[]; essais: number }
  | { etape: string; geste: "montrer" };

/** Une écriture, pour l'afficher une fois passée : sa date, son libellé, ses lignes au débit ou au crédit. */
export interface EcritureMontree {
  id: string;
  date: string;
  libelle: string;
  lignes: LigneSaisie[];
}

export type RetourDuBureau =
  | { refus: "bureau" | "licence" | "envoi" | "etape" }
  | { geste: "classer"; juste: boolean; fausses: string[]; pourquoi?: Record<string, string>; explication?: readonly string[] }
  | { geste: "etat"; juste: boolean; correction: CorrectionDuTableau; grille?: TableauACompleter; explication?: readonly string[] }
  | { geste: "ecriture"; juste: boolean; correction: Correction; passee?: EcritureMontree; deja?: boolean; fini: boolean; explication?: readonly string[] }
  | { geste: "repondre"; juste: boolean; retour: string; fini: boolean; explication?: readonly string[] }
  | {
      geste: "rectifier";
      juste: boolean;
      /** La raison choisie est-elle celle de l'erreur ? */
      raison: boolean;
      correction: Correction;
      /** Une piste, après un essai manqué. */
      indice?: string;
      passee?: EcritureMontree;
      pourquoi?: string;
      deja?: boolean;
      fini: boolean;
      explication?: readonly string[];
    }
  | {
      geste: "montrer";
      choix?: Record<string, string>;
      pourquoi?: Record<string, string>;
      grille?: TableauACompleter;
      saisies?: Record<string, string>;
      ecritures?: EcritureMontree[];
      reponses?: { question: string; texte: string; retour: string }[];
      /** La rectification : la raison de chaque erreur, par écriture. */
      raisons?: Record<string, string>;
      explication: readonly string[];
    };

const montree = (id: string, a: EcritureAttendue): EcritureMontree => ({ id, date: a.date, libelle: a.libelle, lignes: enSaisie(a) });

/** Les bornes d'un envoi : un navigateur n'envoie jamais plus que ce que l'étape compte. */
const PLAFONDS = { texte: 64, lignes: 12, cles: 200 } as const;

const estTexte = (x: unknown): x is string => typeof x === "string" && x.length <= PLAFONDS.texte;
const estDictionnaire = (x: unknown): x is Record<string, string> =>
  !!x && typeof x === "object" && !Array.isArray(x) && Object.keys(x).length <= PLAFONDS.cles && Object.entries(x).every(([k, v]) => estTexte(k) && estTexte(v));
const estListeDeTextes = (x: unknown): x is string[] => Array.isArray(x) && x.length <= PLAFONDS.cles && x.every(estTexte);
const estSaisie = (x: unknown): x is LigneSaisie[] =>
  Array.isArray(x) && x.length <= PLAFONDS.lignes && x.every((l) => !!l && typeof l === "object" && estTexte(l.compte) && estTexte(l.debit) && estTexte(l.credit));

/** L'envoi lu tel qu'il arrive, inconnu : null s'il n'a pas la forme d'un geste. */
export function envoiValide(x: unknown): EnvoiAuBureau | null {
  if (!x || typeof x !== "object") return null;
  const e = x as Record<string, unknown>;
  if (!estTexte(e.etape)) return null;
  switch (e.geste) {
    case "classer":
      return estDictionnaire(e.choix) ? { etape: e.etape, geste: "classer", choix: e.choix } : null;
    case "etat":
      return estDictionnaire(e.saisies) ? { etape: e.etape, geste: "etat", saisies: e.saisies } : null;
    case "ecriture":
      return estSaisie(e.saisie) && estListeDeTextes(e.faites)
        ? { etape: e.etape, geste: "ecriture", saisie: e.saisie.map((l) => ({ compte: l.compte, debit: l.debit, credit: l.credit })), faites: e.faites }
        : null;
    case "rectifier":
      return estTexte(e.ecriture) && estTexte(e.raison) && estSaisie(e.saisie) && estListeDeTextes(e.faites) && typeof e.essais === "number" && Number.isInteger(e.essais) && e.essais >= 0 && e.essais <= 1_000
        ? {
            etape: e.etape,
            geste: "rectifier",
            ecriture: e.ecriture,
            raison: e.raison,
            saisie: e.saisie.map((l) => ({ compte: l.compte, debit: l.debit, credit: l.credit })),
            faites: e.faites,
            essais: e.essais,
          }
        : null;
    case "repondre":
      return estTexte(e.question) && typeof e.option === "string" && e.option.length <= 400 && estListeDeTextes(e.justes)
        ? { etape: e.etape, geste: "repondre", question: e.question, option: e.option, justes: e.justes }
        : null;
    case "montrer":
      return { etape: e.etape, geste: "montrer" };
    default:
      return null;
  }
}

/** Deux textes égaux aux espaces près : les options servies portent des insécables. */
const memeTexte = (a: string, b: string) => a.replace(/[\s  ]+/g, " ").trim() === b.replace(/[\s  ]+/g, " ").trim();

function classer(e: EtapeDeClassement, choix: Record<string, string>): RetourDuBureau {
  const fausses = e.elements.filter((x) => choix[x.code] !== x.categorie).map((x) => x.code);
  if (fausses.length > 0) return { geste: "classer", juste: false, fausses };
  return { geste: "classer", juste: true, fausses: [], pourquoi: Object.fromEntries(e.elements.map((x) => [x.code, x.pourquoi])), explication: e.explication };
}

function remplirLEtat(e: EtapeDEtat, saisies: Record<string, string>): RetourDuBureau {
  const correction = corrigerLeTableau(e.grille, saisies);
  return correction.juste ? { geste: "etat", juste: true, correction, grille: e.grille, explication: e.explication } : { geste: "etat", juste: false, correction };
}

/**
 * Combien de comptes de la saisie l'écriture attendue emploie, hors ceux que toutes les écritures de
 * l'étape partagent (la banque, au rapprochement) : pour savoir à laquelle l'élève pensait.
 */
function proximite(saisie: readonly LigneSaisie[], a: EcritureAttendue, communs: ReadonlySet<string>) {
  const comptes = new Set(a.lignes.flatMap((l) => [l.compte, ...(l.acceptes ?? [])]).filter((x) => !communs.has(x)));
  return saisie.filter((l) => comptes.has(l.compte.trim()) && (lireMontant(l.debit) || lireMontant(l.credit))).length;
}

/** Les comptes de toutes les écritures de l'étape. */
function comptesCommuns(e: EtapeDuJournal): Set<string> {
  const [premiere, ...autres] = e.ecritures.map((x) => new Set(x.ecriture.lignes.map((l) => l.compte)));
  return new Set([...(premiere ?? [])].filter((c) => autres.every((s) => s.has(c))));
}

function passerLEcriture(e: EtapeDuJournal, saisie: LigneSaisie[], faites: readonly string[]): RetourDuBureau {
  const connues = new Set(faites.filter((id) => e.ecritures.some((x) => x.id === id)));
  const restantes = e.ecritures.filter((x) => !connues.has(x.id));
  const fini = (ids: Set<string>) => e.ecritures.every((x) => ids.has(x.id));
  // Une écriture déjà passée, repassée : on le dit, sans la compter deux fois.
  const deja = e.ecritures.find((x) => connues.has(x.id) && corriger(saisie, x.ecriture).juste);
  if (deja) return { geste: "ecriture", juste: false, deja: true, fini: fini(connues), correction: { juste: false, remarques: ["Cette écriture est déjà passée : cherchez celles qui manquent encore."], notes: [] } };
  for (const x of restantes) {
    const c = corriger(saisie, x.ecriture);
    if (c.juste) {
      const apres = new Set([...connues, x.id]);
      const termine = fini(apres);
      return { geste: "ecriture", juste: true, correction: c, passee: montree(x.id, x.ecriture), fini: termine, ...(termine ? { explication: e.explication } : {}) };
    }
  }
  const communs = comptesCommuns(e);
  const proche = [...restantes].sort((a, b) => proximite(saisie, b.ecriture, communs) - proximite(saisie, a.ecriture, communs))[0];
  if (!proche || proximite(saisie, proche.ecriture, communs) === 0) {
    const forme = corriger(saisie, { date: "", libelle: "", lignes: [] });
    const remarques = forme.remarques.filter((x) => !/n'a pas sa place/.test(x));
    return {
      geste: "ecriture",
      juste: false,
      fini: fini(connues),
      correction: { juste: false, remarques: [...remarques, "Cette écriture ne correspond à aucune régularisation qui reste à passer : relisez l'état de rapprochement."], notes: [] },
    };
  }
  return { geste: "ecriture", juste: false, fini: fini(connues), correction: corriger(saisie, proche.ecriture) };
}

function repondre(e: EtapeDeReponse, question: string, option: string, justes: readonly string[]): RetourDuBureau | null {
  const q = e.questions.find((x) => x.id === question);
  const o = q?.options.find((x) => memeTexte(x.texte, option));
  if (!q || !o) return null;
  const apres = new Set([...justes.filter((id) => e.questions.some((x) => x.id === id)), ...(o.juste ? [q.id] : [])]);
  const fini = e.questions.every((x) => apres.has(x.id));
  return { geste: "repondre", juste: o.juste, retour: o.retour, fini, ...(fini ? { explication: e.explication } : {}) };
}

/**
 * Rectifier une écriture : la raison de l'erreur ET l'écriture juste. Une écriture qui n'est pas à
 * rectifier (une écriture juste du dossier) le dit, sans rien d'autre ; une piste vient après un essai
 * manqué, la suivante après le second.
 */
function rectifier(b: Bureau, e: EtapeDeRectification, id: string, raison: string, saisie: LigneSaisie[], faites: readonly string[], essais: number): RetourDuBureau | null {
  const connues = new Set(faites.filter((x) => e.ecritures.some((y) => y.id === x)));
  const fini = (ids: ReadonlySet<string>) => e.ecritures.every((x) => ids.has(x.id));
  const x = e.ecritures.find((y) => y.id === id);
  if (!x) {
    const tri = b.etapes.find((y) => y.id === e.depuis.etape);
    if (tri?.type !== "classement" || !tri.elements.some((y) => y.code === id)) return null;
    return { geste: "rectifier", juste: false, raison: false, fini: fini(connues), correction: { juste: false, remarques: ["Cette écriture est juste : elle n'a rien à rectifier."], notes: [] } };
  }
  if (connues.has(x.id)) return { geste: "rectifier", juste: false, raison: true, deja: true, fini: fini(connues), correction: { juste: false, remarques: ["Cette écriture est déjà rectifiée."], notes: [] } };
  const raisonJuste = raison === x.raison;
  const correction = corriger(saisie, x.ecriture);
  if (raisonJuste && correction.juste) {
    const apres = new Set([...connues, x.id]);
    const termine = fini(apres);
    return { geste: "rectifier", juste: true, raison: true, correction, passee: montree(x.id, x.ecriture), pourquoi: x.pourquoi, fini: termine, ...(termine ? { explication: e.explication } : {}) };
  }
  const indice = x.indices.length > 0 ? x.indices[Math.min(essais, x.indices.length - 1)] : undefined;
  return { geste: "rectifier", juste: false, raison: raisonJuste, correction, ...(indice ? { indice } : {}), fini: fini(connues) };
}

/** La correction de l'étape, quand l'élève la demande : tout ce qu'elle attendait. */
function montrer(e: EtapeDuBureau): RetourDuBureau {
  switch (e.type) {
    case "classement":
      return {
        geste: "montrer",
        choix: Object.fromEntries(e.elements.map((x) => [x.code, x.categorie])),
        pourquoi: Object.fromEntries(e.elements.map((x) => [x.code, x.pourquoi])),
        explication: e.explication,
      };
    case "etat":
      return { geste: "montrer", grille: e.grille, saisies: solutionsDuTableau(e.grille), explication: e.explication };
    case "journal":
      return { geste: "montrer", ecritures: e.ecritures.map((x) => montree(x.id, x.ecriture)), explication: e.explication };
    case "reponse":
      return {
        geste: "montrer",
        reponses: e.questions.map((q) => {
          const o = q.options.find((x) => x.juste)!;
          return { question: q.id, texte: o.texte, retour: o.retour };
        }),
        explication: e.explication,
      };
    case "rectification":
      return {
        geste: "montrer",
        ecritures: e.ecritures.map((x) => montree(x.id, x.ecriture)),
        raisons: Object.fromEntries(e.ecritures.map((x) => [x.id, x.raison])),
        pourquoi: Object.fromEntries(e.ecritures.map((x) => [x.id, x.pourquoi])),
        explication: e.explication,
      };
  }
}

/** Corrige un geste de l'élève, après le contrôle de l'accès : la seule correction de ce geste. */
export function corrigerAuBureau(b: Bureau, brut: unknown): RetourDuBureau {
  const envoi = envoiValide(brut);
  if (!envoi) return { refus: "envoi" };
  const e = b.etapes.find((x) => x.id === envoi.etape);
  if (!e) return { refus: "etape" };
  let retour: RetourDuBureau | null = null;
  if (envoi.geste === "montrer") retour = montrer(e);
  else if (envoi.geste === "classer" && e.type === "classement") retour = classer(e, envoi.choix);
  else if (envoi.geste === "etat" && e.type === "etat") retour = remplirLEtat(e, envoi.saisies);
  else if (envoi.geste === "ecriture" && e.type === "journal") retour = passerLEcriture(e, envoi.saisie, envoi.faites);
  else if (envoi.geste === "repondre" && e.type === "reponse") retour = repondre(e, envoi.question, envoi.option, envoi.justes);
  else if (envoi.geste === "rectifier" && e.type === "rectification") retour = rectifier(b, e, envoi.ecriture, envoi.raison, envoi.saisie, envoi.faites, envoi.essais);
  return typographier(retour ?? { refus: "envoi" });
}
