import type { Bureau, EtapeDuBureau } from "../../config/cours/bureaux/types";
import type { Scenario } from "../../config/cours/scenarios/types";
import { envoiValide, type RetourDuBureau } from "./bureau-servi";
import { envoiDuScenario, type RetourDuScenario } from "./scenario-servi";
import { remarquesDuTableau } from "./tableau-a-completer";

/**
 * LE SUIVI DES ACTIVITÉS EN CLASSE : LE BUREAU, L'ENQUÊTE ET LE SCÉNARIO (décision du propriétaire,
 * novembre 2026 ; table cours_activites, migration 0057).
 *
 * Un chapitre garde sa progression dans le navigateur et l'envoie (services/cours.service.ts). Une
 * activité, non : elle est corrigée au serveur (bureau-servi.ts, scenario-servi.ts), et c'est la
 * correction calculée au serveur qui fait le suivi. `suivreLeBureau` et `suivreLeScenario` prennent le
 * suivi d'avant, l'envoi tel qu'il est arrivé (relu par le même lecteur que la correction) et le retour
 * calculé, et rendent le suivi d'après. Rien de ce que le navigateur dit de lui-même (une liste
 * d'écritures « faites », des questions « justes ») n'y entre : les écritures passées et les questions
 * réussies sont celles que le serveur a lui-même corrigées justes.
 *
 * Tout est borné : les étapes sont celles de l'activité, les remarques sont du texte court, en nombre
 * limité par étape. Ce module est serveur, comme les corrigés qu'il lit
 * (tests/architecture/corriges-hors-du-navigateur.test.ts).
 */

export type NatureDActivite = "bureau" | "enquete" | "scenario";
export const NATURES_D_ACTIVITE: readonly NatureDActivite[] = ["bureau", "enquete", "scenario"];

/**
 * L'état d'une activité. Sans ligne : non commencée. « reussi » : toutes les étapes réussies sans la
 * correction ; « termine » : toutes passées, au moins une avec la correction ; « fini » : un scénario
 * mené jusqu'à une fin.
 */
export type EtatDActivite = "en-cours" | "reussi" | "termine" | "fini";

export interface EtapeSuivie {
  /** Les gestes corrigés sur l'étape, justes ou non. */
  essais: number;
  /** Les gestes manqués. */
  manques: number;
  reussi: boolean;
  /** Réussie en demandant la correction. */
  aide: boolean;
  /** Les écritures passées ou rectifiées, les questions réussies : celles que le serveur a corrigées justes. */
  faites?: string[];
}

export interface SuiviDActivite {
  etat: EtatDActivite;
  /** Les gestes corrigés (bureau, enquête) ; les parties commencées (scénario). */
  essais: number;
  etapes: Record<string, EtapeSuivie>;
  /** Les remarques du correcteur sur les essais manqués, par étape. */
  erreurs: Record<string, string[]>;
  /** Le scénario : le titre de la fin retenue, et si c'est celle de la meilleure suite. */
  fin: string | null;
  meilleure: boolean | null;
}

export const REMARQUE_MAX = 300;
export const REMARQUES_GARDEES_PAR_ETAPE = 30;
const ESSAIS_MAX = 9_999;
const FIN_MAX = 200;

export const SUIVI_VIERGE: SuiviDActivite = { etat: "en-cours", essais: 0, etapes: {}, erreurs: {}, fin: null, meilleure: null };

const VIERGE: EtapeSuivie = { essais: 0, manques: 0, reussi: false, aide: false };

const borne = (n: number) => Math.min(Math.max(0, Math.trunc(n)), ESSAIS_MAX);

/** Ajoute les remarques d'un essai manqué à celles de l'étape : coupées, sans vide, les dernières gardées. */
export function ajouterLesRemarques(erreurs: Record<string, string[]>, etape: string, remarques: readonly string[]): Record<string, string[]> {
  const nouvelles = remarques.map((r) => r.replace(/\s+/g, " ").trim().slice(0, REMARQUE_MAX)).filter((r) => r !== "");
  if (nouvelles.length === 0) return erreurs;
  return { ...erreurs, [etape]: [...(erreurs[etape] ?? []), ...nouvelles].slice(-REMARQUES_GARDEES_PAR_ETAPE) };
}

/** Ce qu'un geste a donné, lu dans le retour du serveur. */
interface Geste {
  juste: boolean;
  /** La correction demandée. */
  aide?: boolean;
  /** Une écriture ou une question corrigée juste, à ajouter aux faites. */
  faite?: string;
  /** L'étape est passée en entier, d'après les faites du serveur ou le retour. */
  etapeFinie?: (faites: ReadonlySet<string>) => boolean;
  remarques: readonly string[];
}

function noterLeGeste(avant: SuiviDActivite, etapeId: string, g: Geste): SuiviDActivite {
  const e = avant.etapes[etapeId] ?? VIERGE;
  const faites = new Set(e.faites ?? []);
  if (g.faite) faites.add(g.faite);
  const finie = g.aide || (g.juste && (g.etapeFinie ? g.etapeFinie(faites) : true));
  const apres: EtapeSuivie = {
    essais: g.aide ? e.essais : borne(e.essais + 1),
    manques: g.juste || g.aide ? e.manques : borne(e.manques + 1),
    // Une étape réussie le reste ; la correction demandée après ne la change pas.
    reussi: e.reussi || Boolean(finie),
    aide: e.aide || (Boolean(g.aide) && !e.reussi),
    ...(faites.size > 0 ? { faites: [...faites] } : {}),
  };
  return {
    ...avant,
    essais: g.aide ? avant.essais : borne(avant.essais + 1),
    etapes: { ...avant.etapes, [etapeId]: apres },
    erreurs: g.juste || g.aide ? avant.erreurs : ajouterLesRemarques(avant.erreurs, etapeId, g.remarques),
  };
}

/** L'état d'un bureau d'après ses étapes : toutes passées, réussi ou terminé avec la correction. */
function etatDuBureau(b: Bureau, s: SuiviDActivite): EtatDActivite {
  const passees = b.etapes.every((e) => s.etapes[e.id]?.reussi);
  if (!passees) return s.etat === "reussi" || s.etat === "termine" ? s.etat : "en-cours";
  if (s.etat === "reussi") return "reussi";
  return b.etapes.some((e) => s.etapes[e.id]?.aide) ? "termine" : "reussi";
}

/** Les ids qu'une étape demande de passer un à un : ses écritures, ses questions. */
const aPasser = (e: EtapeDuBureau): readonly string[] | null =>
  e.type === "journal" || e.type === "rectification" ? e.ecritures.map((x) => x.id) : e.type === "reponse" ? e.questions.map((q) => q.id) : null;

/** Le geste, lu dans l'envoi relu et le retour calculé ; null s'il n'y a rien à suivre. */
function gesteDuBureau(e: EtapeDuBureau, envoi: NonNullable<ReturnType<typeof envoiValide>>, retour: RetourDuBureau): Geste | null {
  if ("refus" in retour) return null;
  const ids = aPasser(e);
  const toutes = ids ? (faites: ReadonlySet<string>) => ids.every((id) => faites.has(id)) : undefined;
  switch (retour.geste) {
    case "montrer":
      return { juste: false, aide: true, remarques: [] };
    case "classer": {
      if (e.type !== "classement") return null;
      const libelle = (code: string) => e.elements.find((x) => x.code === code)?.libelle ?? code;
      return { juste: retour.juste, remarques: retour.fausses.map((code) => `Mal classé : ${libelle(code)}.`) };
    }
    case "etat":
      if (e.type !== "etat") return null;
      return { juste: retour.juste, remarques: retour.juste ? [] : remarquesDuTableau(e.grille, retour.correction) };
    case "ecriture":
      // Une écriture déjà passée, repassée : ni essai, ni erreur.
      if (retour.deja) return null;
      return { juste: retour.juste, faite: retour.juste ? retour.passee?.id : undefined, etapeFinie: toutes, remarques: retour.correction.remarques };
    case "rectifier":
      if (retour.deja) return null;
      return {
        juste: retour.juste,
        faite: retour.juste ? retour.passee?.id : undefined,
        etapeFinie: toutes,
        remarques: [...(retour.raison ? [] : ["La raison choisie n'est pas celle de l'erreur."]), ...retour.correction.remarques],
      };
    case "repondre": {
      if (e.type !== "reponse" || envoi.geste !== "repondre") return null;
      const q = e.questions.find((x) => x.id === envoi.question);
      if (!q) return null;
      return { juste: retour.juste, faite: retour.juste ? q.id : undefined, etapeFinie: toutes, remarques: [`« ${q.question} » ${retour.retour}`] };
    }
  }
}

/**
 * Le suivi d'un bureau ou d'une enquête après un geste corrigé au serveur. Null : rien à noter (un
 * envoi refusé, une écriture déjà passée).
 */
export function suivreLeBureau(b: Bureau, avant: SuiviDActivite | null, brut: unknown, retour: RetourDuBureau): SuiviDActivite | null {
  const envoi = envoiValide(brut);
  if (!envoi) return null;
  const e = b.etapes.find((x) => x.id === envoi.etape);
  if (!e) return null;
  const g = gesteDuBureau(e, envoi, retour);
  if (!g) return null;
  const apres = noterLeGeste(avant ?? SUIVI_VIERGE, e.id, g);
  return { ...apres, etat: etatDuBureau(b, apres) };
}

/**
 * Le suivi d'un scénario après un choix ou une question corrigés au serveur. Un premier choix commence
 * une partie ; le bilan la finit, avec sa fin. La fin retenue est la dernière atteinte, sauf quand une
 * partie d'avant a atteint la meilleure suite : celle-là reste.
 */
export function suivreLeScenario(s: Scenario, avant: SuiviDActivite | null, brut: unknown, retour: RetourDuScenario): SuiviDActivite | null {
  const envoi = envoiDuScenario(brut);
  if (!envoi || "refus" in retour) return null;
  const base = avant ?? SUIVI_VIERGE;
  if (retour.geste === "choisir") {
    if (envoi.geste !== "choisir") return null;
    // Une partie commence au premier choix ; un élève qui rejoint sa classe en cours de partie en a une.
    const essais = envoi.suite.length === 1 || base.essais === 0 ? borne(base.essais + 1) : base.essais;
    if (!retour.bilan) return { ...base, essais };
    const garder = base.meilleure === true && !retour.bilan.meilleure;
    return {
      ...base,
      essais,
      etat: "fini",
      fin: garder ? base.fin : retour.bilan.fin.titre.slice(0, FIN_MAX),
      meilleure: garder ? true : retour.bilan.meilleure,
    };
  }
  if (envoi.geste === "choisir") return null;
  const q = s.questions;
  const ids = q.questions.map((x) => x.id);
  const g: Geste | null =
    retour.geste === "montrer"
      ? { juste: false, aide: true, remarques: [] }
      : envoi.geste === "repondre"
        ? (() => {
            const question = q.questions.find((x) => x.id === envoi.question);
            if (!question) return null;
            return {
              juste: retour.juste,
              faite: retour.juste ? question.id : undefined,
              etapeFinie: (faites: ReadonlySet<string>) => ids.every((id) => faites.has(id)),
              remarques: [`« ${question.question} » ${retour.retour}`],
            };
          })()
        : null;
  if (!g) return null;
  const apres = noterLeGeste(base, q.id, g);
  // Les questions ne comptent pas comme une partie : l'essai d'un scénario est une partie jouée.
  return { ...apres, essais: base.essais, etat: base.etat };
}

// ─────────────────────────────────────────────────────────────────────────────
// LA VUE DE L'ENSEIGNANT
// ─────────────────────────────────────────────────────────────────────────────

/** Ce qu'il faut savoir d'une activité pour la montrer à l'enseignant. */
export interface ActiviteDecrite {
  nature: NatureDActivite;
  code: string;
  titre: string;
  /** Les étapes suivies, dans l'ordre : celles du bureau, ou les questions du scénario. */
  etapes: readonly { id: string; titre: string }[];
}

export interface SuiviLu extends SuiviDActivite {
  userId: string;
  nature: string;
  code: string;
  majLe: Date;
}

export interface LigneDActivite {
  eleve: string;
  etat: EtatDActivite | "non-commence";
  essais: number;
  manques: number;
  /** Les étapes réussies, dont avec la correction, sur le nombre d'étapes. */
  reussies: number;
  aidees: number;
  fin: string | null;
  meilleure: boolean | null;
  /** Les remarques gardées, étape par étape, dans l'ordre des étapes. */
  erreurs: { etape: string; remarques: string[] }[];
  majLe: Date | null;
}

export interface VueDUneActivite extends ActiviteDecrite {
  eleves: LigneDActivite[];
  compte: Record<LigneDActivite["etat"], number>;
  /** Les remarques qui reviennent le plus, avec le nombre d'élèves qui les ont reçues. */
  frequentes: { texte: string; eleves: number }[];
}

/** Combien de remarques fréquentes l'enseignant voit par activité. */
export const REMARQUES_FREQUENTES = 5;

const ETATS_CONNUS = new Set<string>(["en-cours", "reussi", "termine", "fini"]);

/** Une ligne par élève de la classe et par activité : sans suivi, l'élève n'a pas commencé. */
export function vueDesActivites(
  activites: readonly ActiviteDecrite[],
  eleves: readonly { userId: string; nom: string }[],
  suivis: readonly SuiviLu[],
): VueDUneActivite[] {
  const cle = (nature: string, code: string, userId: string) => `${nature}:${code}:${userId}`;
  const parCle = new Map(suivis.map((s) => [cle(s.nature, s.code, s.userId), s]));
  return activites.map((a) => {
    const titreDe = new Map(a.etapes.map((e) => [e.id, e.titre]));
    const lignes: LigneDActivite[] = eleves.map((el) => {
      const s = parCle.get(cle(a.nature, a.code, el.userId));
      if (!s) return { eleve: el.nom, etat: "non-commence", essais: 0, manques: 0, reussies: 0, aidees: 0, fin: null, meilleure: null, erreurs: [], majLe: null };
      const etapes = a.etapes.map((e) => s.etapes[e.id]).filter((x): x is EtapeSuivie => Boolean(x));
      return {
        eleve: el.nom,
        etat: ETATS_CONNUS.has(s.etat) ? s.etat : "en-cours",
        essais: s.essais,
        manques: etapes.reduce((n, e) => n + (e.manques ?? 0), 0),
        reussies: etapes.filter((e) => e.reussi).length,
        aidees: etapes.filter((e) => e.reussi && e.aide).length,
        fin: s.fin,
        meilleure: s.meilleure,
        erreurs: a.etapes
          .filter((e) => (s.erreurs[e.id]?.length ?? 0) > 0)
          .map((e) => ({ etape: titreDe.get(e.id) ?? e.id, remarques: s.erreurs[e.id]! })),
        majLe: s.majLe,
      };
    });
    const compte: VueDUneActivite["compte"] = { "non-commence": 0, "en-cours": 0, reussi: 0, termine: 0, fini: 0 };
    for (const l of lignes) compte[l.etat] += 1;
    const parRemarque = new Map<string, Set<string>>();
    for (const l of lignes) for (const e of l.erreurs) for (const r of e.remarques) parRemarque.set(r, (parRemarque.get(r) ?? new Set()).add(l.eleve));
    const frequentes = [...parRemarque.entries()]
      .map(([texte, qui]) => ({ texte, eleves: qui.size }))
      .sort((x, y) => y.eleves - x.eleves || x.texte.localeCompare(y.texte, "fr"))
      .slice(0, REMARQUES_FREQUENTES);
    return { ...a, eleves: lignes, compte, frequentes };
  });
}
