"use client";

import { avecTypographie } from "@/components/typographie";
import Link from "next/link";
import { useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import type { CodeNiveau, TempsDeDecision } from "@/config/episodes/niveaux";
import type { Message, PartieJouee } from "@/config/episodes/types";
import type {
  DemandeDePartie,
  EtapeServie,
  IntroServie,
  NiveauAffiche,
  PlumeServie,
  ReglagesDesNiveaux,
  SourceServie,
  TableauServi,
  VueDeLaPartie,
} from "@/pedagogy/episodes/partie-servie";
import { bouton } from "@/components/bouton";
import { sansMolette } from "@/components/sans-molette";
import { LigneDuTableau, TableauDeBord } from "./tableau-de-bord";
import { hautDesBarres } from "@/components/ardoise-repliee";
import { VerdictDuMarche } from "@/components/verdict-du-marche";
import { BilanDeLEpisode } from "./bilan-de-l-episode";
import type { CoursDeLEpisode } from "@/pedagogy/cours/suites";
import { CourbeDesSemaines } from "./courbe-des-semaines";
import { cleDeLaPartie, gesteDeReprise, lireLesFaits, type FaitsDeLaPartie } from "./faits-de-la-partie";

/**
 * UN ÉPISODE MANAGER, JOUÉ DE BOUT EN BOUT.
 *
 * Une démonstration de la version pour les entreprises. Chaque décision passe par les
 * mêmes temps qu'au bureau (le signal qui arrive, l'enquête qui coûte du temps, le
 * diagnostic, la décision, puis ses conséquences sur le tableau de bord), et le bilan
 * rejoue le trimestre pour séparer le choix du hasard. Seuls les faits de la partie
 * terminée sont gardés, pour le profil décisionnel (aucun texte saisi).
 *
 * LE JEU SE CALCULE AU SERVEUR (audit du 10 novembre 2026, P1-1). L'écran ne connaît aucun
 * épisode : il reçoit de la page son introduction, puis, à chaque geste qui apprend quelque
 * chose (commencer, vérifier, valider une décision), envoie les faits de la partie à
 * /api/episodes/partie, qui refait le contrôle d'accès, rejoue la partie et renvoie ce qu'il
 * faut montrer (pedagogy/episodes/partie-servie.ts). Le résultat d'un choix n'arrive qu'après
 * ce choix, le bilan qu'à la fin ; passer d'une décision à la suivante n'attend rien, la
 * réponse à la décision porte déjà l'étape suivante.
 *
 * Le hasard se choisit dans l'adresse (`?hasard=12`) : deux personnes qui
 * jouent le même trimestre peuvent comparer leurs décisions, et les tests
 * jouent un trimestre connu. Le niveau aussi (`?niveau=expert`) : il change ce
 * que le manager sait et voit, jamais le trimestre ni le jugement du bilan.
 *
 * LA PARTIE REPREND AU MÊME ÉCRAN APRÈS UN RECHARGEMENT (audit UX du 11 novembre 2026, P1-6) : ses
 * faits se gardent dans le stockage de session de l'onglet (./faits-de-la-partie.ts), et le serveur la
 * rejoue à partir d'eux. PENDANT L'ATTENTE (P2-3), la scène garde sa hauteur sous la phrase qui dit
 * qu'on attend, et l'en-tête n'avance qu'avec la réponse.
 */

type Ecran = "intro" | "jeu" | "bilan";
type Phase = "signal" | "enquete" | "diagnostic" | "reevaluation" | "decision" | "consequence";
type Geste = DemandeDePartie["geste"];
/** Ce qu'une réponse du serveur change à l'écran, une fois arrivée. */
type Apres = (vue: VueDeLaPartie) => Partial<EtatDeLEpisode>;

export interface EtatDeLEpisode {
  graine: number | null;
  /** Tirée au début de la partie : le serveur ne la garde qu'une fois, même si le bilan se recharge. */
  cle: string | null;
  /** Le niveau choisi ; `null` tant que la personne n'a rien choisi. */
  niveau: CodeNiveau | null;
  ecran: Ecran;
  etape: number;
  phase: Phase;
  decisions: number[];
  consultes: string[][];
  /** Les jours d'enquête pris en semaine 1. */
  jours: number;
  diagnostic: { principal: string | null; second: string | null };
  reevaluation: { choix: "maintient" | "corrige" | null; principal: string | null };
  prevision: { valeur: string; confiance: number };
  justifications: string[];
  choix: number | null;
  /** Ce que le serveur a renvoyé au dernier geste ; `null` avant le premier. */
  vue: VueDeLaPartie | null;
  /** Le geste dont on attend la réponse. */
  attente: Geste | null;
  /** Le dernier geste n'a pas abouti : ce qu'on en dit. */
  erreur: string | null;
}

export const nouvelEtat = (
  nombreDeDecisions: number,
  graine: number | null = null,
  niveau: CodeNiveau | null = null,
  cle: string | null = null,
): EtatDeLEpisode => ({
  graine,
  cle,
  niveau,
  ecran: "intro",
  etape: 0,
  phase: "signal",
  decisions: [],
  consultes: Array.from({ length: nombreDeDecisions }, () => []),
  jours: 0,
  diagnostic: { principal: null, second: null },
  reevaluation: { choix: null, principal: null },
  prevision: { valeur: "", confiance: 60 },
  justifications: [],
  choix: null,
  vue: null,
  attente: null,
  erreur: null,
});

/** Le hasard de l'adresse s'il y en a un, sinon un hasard neuf. */
function tirerUnHasard(): number {
  const demande = Number(new URLSearchParams(window.location.search).get("hasard"));
  if (Number.isInteger(demande) && demande > 0) return demande;
  return 1 + Math.floor(Math.random() * 9000);
}

/** Une clé de partie : un identifiant aléatoire, même hors d'un contexte sécurisé. */
function nouvelleCle(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const o = crypto.getRandomValues(new Uint8Array(16));
  o[6] = (o[6]! & 0x0f) | 0x40;
  o[8] = (o[8]! & 0x3f) | 0x80;
  const h = [...o].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

/** L'adresse ne change pas pendant la partie : rien à écouter. */
const sansAbonnement = () => () => {};

const phasesDe = (etape: number): Phase[] =>
  etape === 0
    ? ["signal", "enquete", "diagnostic", "decision"]
    : etape === 1
      ? ["signal", "reevaluation", "enquete", "decision"]
      : ["signal", "decision"];

const NOMS_DES_PHASES: Record<Phase, string> = {
  signal: "Signal",
  enquete: "Enquête",
  diagnostic: "Diagnostic",
  reevaluation: "Réévaluation",
  decision: "Décision",
  consequence: "Conséquence",
};

/** « Remise de 5 % » devient « remise de 5 % » ; « Karim », plus loin dans la phrase, reste Karim. */
const enMinuscule = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

/** Des jours, au dixième, en français : « 3,5 ». */
const enJours = (v: number) => v.toLocaleString("fr-FR", { maximumFractionDigits: 1 });

const previsionValide = (p: NonNullable<EtapeServie["prevision"]>, v: string) => {
  const n = Number(v.replace(",", "."));
  return v.trim() !== "" && Number.isFinite(n) && n >= p.min && n <= p.max;
};

/** Un nombre de la plage, à la française, le signe moins typographique : « 1 000 », « −500 ». */
const nombreDeLaPlage = (x: number) => (x < 0 ? `−${(-x).toLocaleString("fr-FR")}` : x.toLocaleString("fr-FR"));

/** La plage d'une prévision, dite sous le champ quand la valeur en sort : « Entre 0 et 100 % ». */
export const plageDeLaPrevision = (p: Pick<NonNullable<EtapeServie["prevision"]>, "min" | "max" | "unite">) =>
  `Entre ${nombreDeLaPlage(p.min)} et ${nombreDeLaPlage(p.max)}${p.unite.trim() ? ` ${p.unite.trim()}` : ""}`;

/** Le niveau d'un code, Standard s'il est inconnu, comme au serveur. */
const niveauDe = (reglages: ReglagesDesNiveaux, code: string | null | undefined): NiveauAffiche =>
  reglages.niveaux.find((n) => n.code === code) ??
  reglages.niveaux.find((n) => n.code === NIVEAU_PAR_DEFAUT)!;

const NIVEAU_PAR_DEFAUT: CodeNiveau = "standard";

/**
 * Peut-on encore vérifier quelque chose à cette décision ? La première se règle par le
 * temps d'enquête ; les suivantes, par le nombre de vérifications (la même règle qu'au
 * serveur, config/episodes/niveaux.ts, qui la vérifie à chaque geste).
 */
const verificationPossible = (niveau: NiveauAffiche, decision: number, dejaVues: number) =>
  decision === 0 || niveau.verificationsParDecision == null || dejaVues < niveau.verificationsParDecision;

/** L'écriture d'un chiffre qui monte : pour chaque image, la valeur écrite la plus proche. */
function ecrireAvec(plume: PlumeServie): (n: number) => string {
  const points = plume.points;
  return (n: number) => {
    let bas = 0;
    let haut = points.length - 1;
    while (haut - bas > 1) {
      const milieu = (bas + haut) >> 1;
      if (points[milieu]![0] <= n) bas = milieu;
      else haut = milieu;
    }
    const [a, b] = [points[bas]!, points[haut]!];
    return Math.abs(n - a[0]) <= Math.abs(b[0] - n) ? a[1] : b[1];
  };
}

/* ------------------------------------------------------------------------- */

function Boite({ messages }: { messages: readonly Message[] }) {
  return (
    <ul className="carte divide-y divide-white/10 overflow-hidden p-0">
      {messages.map((m) => (
        <li
          key={m.de + m.texte}
          className={`grid gap-1 border-l-2 px-4 py-3.5 ${
            // Un message d'alerte : le filet rouge franc sur le voile neutre
            // (il était orange, la couleur de l'action).
            m.alerte ? "voile-neutre border-l-red-400" : "border-l-transparent"
          }`}
        >
          <p className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 text-sm">
            <strong className="font-semibold text-slate-50">{m.de}</strong>
            <span className="text-slate-400">{m.role}</span>
            {m.heure && <time className="ml-auto tabular-nums text-slate-400">{m.heure}</time>}
          </p>
          <p className="max-w-2xl text-base leading-relaxed text-slate-200">{m.texte}</p>
        </li>
      ))}
    </ul>
  );
}

/** Un repère de méthode, au niveau Découverte. */
function Repere({ texte }: { texte: string }) {
  return (
    <p className="encadre-neutre max-w-2xl rounded-lg px-4 py-3 text-sm leading-relaxed text-slate-200">
      <strong className="font-semibold text-slate-100">Repère · </strong>
      {texte}
    </p>
  );
}

function CarteSource({
  source,
  vue,
  impossible,
  pourquoi = "plus le temps",
  onConsulter,
}: {
  source: SourceServie;
  vue: boolean;
  impossible: boolean;
  /** Ce qu'on affiche quand la vérification n'est plus possible. */
  pourquoi?: string;
  onConsulter: () => void;
}) {
  return (
    <li className="carte overflow-hidden p-0">
      <button
        type="button"
        onClick={onConsulter}
        disabled={vue || impossible}
        aria-expanded={vue}
        className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left transition enabled:hover:bg-white/5 disabled:cursor-default"
      >
        <span
          className={`font-semibold ${impossible && !vue ? "text-slate-400" : "text-slate-100"}`}
        >
          {source.titre}
        </span>
        <span
          className={`whitespace-nowrap text-sm tabular-nums ${vue ? "font-semibold text-slate-200" : "text-slate-400"}`}
        >
          {vue
            ? "consulté"
            : impossible
              ? pourquoi
              : `${enJours(source.cout)} jour${source.cout > 1 ? "s" : ""}`}
        </span>
      </button>
      {/* Ce que la vérification apprend arrive du serveur une fois qu'elle est faite. */}
      {vue && source.resultat != null && (
        <p className="max-w-2xl px-4 pb-4 text-base leading-relaxed text-slate-300">
          {source.resultat}
        </p>
      )}
    </li>
  );
}

function Choix({
  nom,
  valeur,
  options,
  onChoisir,
  grande = false,
}: {
  nom: string;
  valeur: string | null;
  options: readonly { id: string; t: string; d?: string }[];
  onChoisir: (id: string) => void;
  grande?: boolean;
}) {
  return (
    <div className="grid gap-2">
      {options.map((o) => (
        <label
          key={o.id}
          className="flex min-h-12 cursor-pointer items-start gap-3 rounded-lg border border-white/5 bg-slate-950 px-4 py-3 transition hover:border-white/25 has-[:checked]:border-amber-400 has-[:checked]:bg-amber-400/10 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-amber-400"
        >
          <input
            type="radio"
            name={nom}
            value={o.id}
            checked={valeur === o.id}
            onChange={() => onChoisir(o.id)}
            className="mt-1 shrink-0 accent-amber-400"
          />
          <span className="grid gap-0.5">
            <span className={grande ? "font-semibold text-slate-50" : "text-slate-100"}>{o.t}</span>
            {o.d && <span className="text-sm text-slate-400">{o.d}</span>}
          </span>
        </label>
      ))}
    </div>
  );
}

function Suite({
  children,
  onClick,
  disabled = false,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={bouton({ taille: "l" })}
      >
        {children}
      </button>
    </div>
  );
}

/** La réponse du serveur est en route : l'écran a changé, son contenu arrive. */
function Attente({ texte, enTete = false }: { texte: string; enTete?: boolean }) {
  // EN TÊTE DE LA SCÈNE (le trimestre ou le bilan qui se prépare), la phrase descend sous la ligne du tableau
  // de bord, collée en haut de l'écran du téléphone : la scène remonte à son haut au geste, et la phrase
  // passait dessous (audit UX du 11 novembre 2026, P2-3).
  return (
    <p role="status" className={`text-base text-slate-400 ${enTete ? "max-lg:pt-8" : ""}`}>
      {texte}
    </p>
  );
}

/** Le dernier geste n'a pas abouti : on le dit, et on propose de le refaire. */
function Erreur({ texte, onReessayer }: { texte: string; onReessayer: () => void }) {
  return (
    <div role="alert" className="encadre-perte grid max-w-2xl gap-2 rounded-lg px-4 py-3 text-sm text-slate-200">
      <p>{texte}</p>
      <p>
        <button
          type="button"
          onClick={onReessayer}
          className="font-semibold text-amber-300 underline underline-offset-4"
        >
          Réessayer
        </button>
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------------- */

/**
 * Ce qui ouvre les niveaux fermés d'une démonstration, lu dans config/tarifs.ts par la
 * page serveur. Nul : on ne vend rien (une licence couvre déjà, ou c'est un élève).
 */
export interface OffreDesEpisodes {
  marque: string;
  nom: string;
  devis: string;
  libelle: string;
}

interface ProprietesDeLEpisode {
  /** L'introduction de l'épisode, préparée par la page serveur (pedagogy/episodes/partie-servie.ts). */
  intro: IntroServie;
  /** Les noms et les règles des niveaux, génériques, lus par la page serveur. */
  reglages: ReglagesDesNiveaux;
  /**
   * Une licence qui inclut les épisodes couvre-t-elle celui-ci (la page serveur le lit,
   * `licencePourLEpisode`) ? Sans elle, une partie en Découverte ne compte pas dans le
   * profil : l'introduction le dit, et le bilan en montre un aperçu.
   */
  licence?: boolean;
  /** Le cours du thème de l'épisode, montré sous le bilan (pedagogy/cours/suites.ts). */
  cours?: CoursDeLEpisode | null;
  offre?: OffreDesEpisodes | null;
  /**
   * Les niveaux auxquels l'épisode se lance, établis par le serveur
   * (services/acces.service.ts) : sans licence, une démonstration ne se joue qu'en
   * Découverte. Un niveau demandé dans l'adresse hors de cette liste est ignoré.
   * Le serveur le revérifie à chaque geste.
   */
  niveaux: readonly CodeNiveau[];
}

/** Ce que l'écran sait faire ; le conteneur le relie au serveur. */
interface Gestes {
  maj: (f: (e: EtatDeLEpisode) => Partial<EtatDeLEpisode>) => void;
  onNiveau: (n: CodeNiveau) => void;
  commencer: (graine: number | null) => void;
  recommencer: () => void;
  suivante: () => void;
  consulter: (src: SourceServie) => void;
  valider: () => void;
  etapeSuivante: () => void;
  reessayer: () => void;
  autreHasard: () => void;
  memeHasard: () => void;
}

/** Le niveau effectif : celui qu'on a choisi s'il est permis, sinon le premier permis. */
function niveauChoisi(
  s: EtatDeLEpisode,
  demande: CodeNiveau | null,
  niveaux: readonly CodeNiveau[],
): CodeNiveau {
  const permis = (n: CodeNiveau | null): n is CodeNiveau => n !== null && niveaux.includes(n);
  const souhaite = s.niveau ?? demande ?? NIVEAU_PAR_DEFAUT;
  return permis(souhaite) ? souhaite : (niveaux[0] ?? NIVEAU_PAR_DEFAUT);
}

/** La partie terminée, telle que le bilan la garde et la compare : des faits, rien d'autre. */
function partieJoueeDe(s: EtatDeLEpisode, choisi: CodeNiveau): PartieJouee | null {
  if (s.ecran !== "bilan" || !s.diagnostic.principal || s.reevaluation.choix == null) return null;
  return {
    graine: s.graine ?? 1,
    chemin: s.decisions,
    consultes: s.consultes,
    jours: s.jours,
    diagnostic: s.diagnostic.principal,
    reevaluation: { choix: s.reevaluation.choix, principal: s.reevaluation.principal },
    prevision: Number(s.prevision.valeur.replace(",", ".")),
    confiance: s.prevision.confiance,
    niveau: choisi,
  };
}

/** Ce que le bilan suivant lit de la partie terminée : ses seuls faits, gardés aussi dans l'onglet. */
const faitsDeLaPrecedente = (p: PartieJouee | null): FaitsDeLaPartie["precedente"] =>
  p ? { graine: p.graine, chemin: [...p.chemin], jours: p.jours, ...(p.niveau ? { niveau: p.niveau } : {}) } : null;

const ERREUR_RESEAU =
  "La partie n'a pas pu continuer : la connexion au serveur a échoué. Vos choix sont gardés sur cette page.";
const ERREUR_ACCES =
  "Cet épisode ne s'ouvre plus à ce niveau sur cet appareil : la licence a pu changer. Rechargez la page.";

function EpisodeJoueBrut(props: ProprietesDeLEpisode) {
  const { intro, reglages, niveaux } = props;
  const n = intro.nombreDeDecisions;
  const [s, setS] = useState<EtatDeLEpisode>(() => nouvelEtat(n));
  // Le niveau de l'adresse ne se lit que dans le navigateur ; au rendu serveur,
  // c'est le niveau par défaut.
  const demande = useSyncExternalStore(
    sansAbonnement,
    () => {
      const d = new URLSearchParams(window.location.search).get("niveau");
      return reglages.niveaux.some((x) => x.code === d) ? (d as CodeNiveau) : null;
    },
    () => null,
  );
  const choisi = niveauChoisi(s, demande, niveaux);
  // La partie terminée juste avant : le bilan suivant la met en regard. Ses seuls faits.
  const [precedente, setPrecedente] = useState<FaitsDeLaPartie["precedente"]>(null);
  const scene = useRef<HTMLDivElement>(null);
  const maj = (f: (e: EtatDeLEpisode) => Partial<EtatDeLEpisode>) => setS((e) => ({ ...e, ...f(e) }));
  // Le numéro du dernier geste envoyé : une réponse plus ancienne arrive trop tard, on l'ignore.
  const dernier = useRef(0);
  // LA HAUTEUR DE LA SCÈNE AU MOMENT DU GESTE (audit UX du 11 novembre 2026, P2-3) : pendant l'attente,
  // la scène la garde sous la phrase qui dit qu'on attend, et le pied de page ne remonte plus au milieu
  // de l'écran du téléphone.
  const [hauteurReservee, setHauteurReservee] = useState<number | null>(null);
  const reserverLaHauteur = () => setHauteurReservee(scene.current?.offsetHeight ?? null);

  // Chaque nouvel écran se lit depuis son haut : sur téléphone, le bouton
  // qu'on vient de toucher est en bas de l'écran précédent. Le seuil est la
  // marge de défilement de la scène, pas le bord de la fenêtre : l'en-tête
  // collant couvre le haut de page, et un titre posé juste dessous en
  // dépassait de quelques pixels sans que rien ne remonte — c'est ce qui
  // arrivait après « Commencer l'épisode ».
  const repere = `${s.ecran}-${s.etape}-${s.phase}`;
  useEffect(() => {
    const el = scene.current;
    if (!el) return;
    const marge = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    if (el.getBoundingClientRect().top >= marge) return;
    const doux = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "start", behavior: doux ? "smooth" : "auto" });
  }, [repere]);

  // Où coller la ligne du tableau de bord sur téléphone : sous l'en-tête du
  // site, dont la hauteur se mesure (elle change avec la largeur).
  const [haut, setHaut] = useState(0);
  useEffect(() => {
    const mesurer = () => setHaut(hautDesBarres());
    mesurer();
    window.addEventListener("resize", mesurer);
    window.addEventListener("scroll", mesurer, { passive: true });
    return () => {
      window.removeEventListener("resize", mesurer);
      window.removeEventListener("scroll", mesurer);
    };
  }, []);

  /**
   * UN GESTE AU SERVEUR. La demande porte toute la partie : le serveur ne garde rien, il la
   * rejoue. `apres` dit ce que la réponse change à l'écran, une fois arrivée. Le dernier geste
   * envoyé est gardé : « Réessayer » le renvoie tel quel.
   */
  const aRefaire = useRef<{ demande: DemandeDePartie; apres: Apres } | null>(null);
  const envoyer = (demandeDePartie: DemandeDePartie, apres: Apres, { reprise = false }: { reprise?: boolean } = {}) => {
    const numero = ++dernier.current;
    aRefaire.current = { demande: demandeDePartie, apres };
    maj(() => ({ attente: demandeDePartie.geste, erreur: null }));
    fetch("/api/episodes/partie", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(demandeDePartie),
    })
      .then(async (r) => {
        if (numero !== dernier.current) return;
        // Une partie gardée que le serveur ne rejoue plus (un niveau que l'accès n'ouvre plus, une
        // partie qui ne tient plus dans l'épisode) repart de l'introduction, sans rien en dire.
        if (reprise && (r.status === 400 || r.status === 403)) {
          setS((e) => nouvelEtat(n, null, e.niveau));
          setPrecedente(null);
          return;
        }
        if (!r.ok) {
          maj(() => ({ attente: null, erreur: r.status === 403 ? ERREUR_ACCES : ERREUR_RESEAU }));
          return;
        }
        const vue = (await r.json()) as VueDeLaPartie;
        if (numero !== dernier.current) return;
        setS((e) => ({ ...e, ...apres(vue), vue, attente: null, erreur: null }));
      })
      .catch(() => {
        if (numero !== dernier.current) return;
        maj(() => ({ attente: null, erreur: ERREUR_RESEAU }));
      });
  };

  /** La demande d'un geste : les faits de la partie, et, à la dernière décision, ce que le bilan lit. */
  const demandeDe = (
    e: EtatDeLEpisode,
    geste: Geste,
    faits: Partial<Pick<DemandeDePartie, "decisions" | "consultes">> = {},
    avant: FaitsDeLaPartie["precedente"] = precedente,
  ): DemandeDePartie => {
    const decisions = faits.decisions ?? e.decisions;
    const fin =
      geste === "valider" && decisions.length === n && e.diagnostic.principal && e.reevaluation.choix
        ? {
            diagnostic: e.diagnostic.principal,
            reevaluation: { choix: e.reevaluation.choix, principal: e.reevaluation.principal },
            prevision: Number(e.prevision.valeur.replace(",", ".")),
            confiance: e.prevision.confiance,
          }
        : null;
    return {
      code: intro.code,
      geste,
      niveau: e.niveau ?? choisi,
      graine: e.graine ?? 1,
      decisions,
      consultes: faits.consultes ?? e.consultes,
      fin,
      precedente:
        fin && avant
          ? {
              graine: avant.graine,
              chemin: [...avant.chemin],
              jours: avant.jours,
              ...(avant.niveau ? { niveau: avant.niveau } : {}),
            }
          : null,
    };
  };

  /**
   * LA PARTIE GARDÉE DANS L'ONGLET, REPRISE AU RECHARGEMENT (audit UX du 11 novembre 2026, P1-6). Avant
   * que la page se peigne : la scène prend l'état gardé, garde la hauteur de l'introduction, et le
   * serveur rejoue la partie pour rendre l'écran où l'on était. Puis chaque geste garde les faits.
   */
  const cleDeSession = cleDeLaPartie(intro.code);
  const repriseLue = useRef(false);
  useLayoutEffect(() => {
    if (repriseLue.current) return;
    repriseLue.current = true;
    let faits: FaitsDeLaPartie | null = null;
    try {
      const brut = window.sessionStorage.getItem(cleDeSession);
      faits = brut ? lireLesFaits(JSON.parse(brut), intro.code, n, niveaux) : null;
    } catch {
      faits = null;
    }
    if (!faits) return;
    const reprise: EtatDeLEpisode = {
      ...nouvelEtat(n, faits.graine, faits.niveau, faits.cle),
      ecran: faits.ecran,
      etape: faits.etape,
      phase: faits.phase,
      decisions: faits.decisions,
      consultes: faits.consultes,
      jours: faits.jours,
      diagnostic: faits.diagnostic,
      reevaluation: faits.reevaluation,
      prevision: faits.prevision,
      choix: faits.choix,
    };
    reserverLaHauteur();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setS(reprise);
    setPrecedente(faits.precedente);
    envoyer(demandeDe(reprise, gesteDeReprise(faits), {}, faits.precedente), () => ({}), { reprise: true });
    // Une fois, au montage : la reprise lit l'onglet tel que la page l'a trouvé.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!repriseLue.current) return;
    try {
      if (s.ecran === "intro" || s.graine === null || s.niveau === null) {
        window.sessionStorage.removeItem(cleDeSession);
        return;
      }
      const faits: FaitsDeLaPartie = {
        v: 1,
        code: intro.code,
        graine: s.graine,
        cle: s.cle,
        niveau: s.niveau,
        ecran: s.ecran,
        etape: s.etape,
        phase: s.phase,
        decisions: s.decisions,
        consultes: s.consultes,
        jours: s.jours,
        diagnostic: s.diagnostic,
        reevaluation: s.reevaluation,
        prevision: s.prevision,
        choix: s.choix,
        precedente,
      };
      window.sessionStorage.setItem(cleDeSession, JSON.stringify(faits));
    } catch {
      // Stockage refusé (navigation privée stricte) : la partie vit le temps de la page, comme avant.
    }
  }, [s, precedente, cleDeSession, intro.code]);

  const commencer = (g: number | null) => {
    const graine = g ?? tirerUnHasard();
    const cle = nouvelleCle();
    const d: DemandeDePartie = {
      code: intro.code,
      geste: "commencer",
      niveau: choisi,
      graine,
      decisions: [],
      consultes: [],
      fin: null,
      precedente: null,
    };
    // L'écran passe au jeu tout de suite, comme avant ; la première étape arrive avec la réponse.
    reserverLaHauteur();
    setS(() => ({ ...nouvelEtat(n, graine, choisi, cle), ecran: "jeu" }));
    envoyer(d, () => ({}));
  };

  const gestes: Gestes = {
    maj,
    onNiveau: (niveau) => maj(() => ({ niveau })),
    commencer,
    recommencer: () => {
      // Une réponse encore en route ne ramène pas la partie abandonnée.
      dernier.current += 1;
      setS((e) => nouvelEtat(n, null, e.niveau));
    },
    suivante: () =>
      maj((e) => {
        const ps = phasesDe(e.etape);
        return { phase: ps[ps.indexOf(e.phase) + 1]! };
      }),
    consulter: (src) => {
      const e = s;
      if (e.attente === "valider" || e.attente === "commencer") return;
      if (e.consultes[e.etape]!.includes(src.id)) return;
      if (!verificationPossible(niveauDe(reglages, e.niveau), e.etape, e.consultes[e.etape]!.length)) return;
      // La vérification compte tout de suite (le temps, le nombre) ; ce qu'elle apprend
      // arrive avec la réponse.
      const consultes = e.consultes.map((c, i) => (i === e.etape ? [...c, src.id] : c));
      const jours = e.etape === 0 ? e.jours + src.cout : e.jours;
      maj(() => ({ consultes, jours }));
      envoyer(demandeDe(e, "verifier", { consultes }), () => ({}));
    },
    valider: () => {
      const e = s;
      if (e.choix == null || e.attente === "valider") return;
      const decisions = [...e.decisions.slice(0, e.etape), e.choix];
      // La décision est prise tout de suite, comme avant ; sa conséquence arrive avec la réponse.
      reserverLaHauteur();
      maj(() => ({ decisions, phase: "consequence" }));
      envoyer(demandeDe(e, "valider", { decisions }), (vue) => ({ decisions: [...vue.decisions] }));
    },
    etapeSuivante: () =>
      maj((e) =>
        e.etape === n - 1
          ? { ecran: "bilan" }
          : { etape: e.etape + 1, phase: "signal", choix: null },
      ),
    reessayer: () => {
      const r = aRefaire.current;
      if (r) envoyer(r.demande, r.apres);
    },
    autreHasard: () => {
      setPrecedente(faitsDeLaPrecedente(partieJoueeDe(s, choisi)));
      commencer(1 + Math.floor(Math.random() * 9000));
    },
    memeHasard: () => {
      setPrecedente(faitsDeLaPrecedente(partieJoueeDe(s, choisi)));
      commencer(s.graine ?? 1);
    },
  };

  return (
    <EcranDeLEpisode
      {...props}
      s={s}
      choisi={choisi}
      haut={haut}
      scene={scene}
      hauteurReservee={s.attente !== null ? hauteurReservee : null}
      gestes={gestes}
    />
  );
}

/**
 * L'ÉCRAN, POUR UN ÉTAT DONNÉ : rien que de l'affichage. Le test d'or le rend à chaque écran
 * d'une partie (tests/episodes/partie-servie.test.ts).
 */
function EcranDeLEpisodeBrut({
  intro,
  reglages,
  niveaux,
  offre = null,
  cours = null,
  licence = true,
  s,
  choisi,
  haut = 0,
  scene,
  hauteurReservee = null,
  gestes,
}: ProprietesDeLEpisode & {
  s: EtatDeLEpisode;
  choisi: CodeNiveau;
  haut?: number;
  scene?: RefObject<HTMLDivElement | null>;
  /** Pendant l'attente d'une réponse, la hauteur que la scène garde (audit UX du 11 novembre 2026, P2-3). */
  hauteurReservee?: number | null;
  gestes: Gestes;
}) {
  const niveau = niveauDe(reglages, choisi);
  const n = intro.nombreDeDecisions;
  const vue = s.vue;
  const partieJouee = partieJoueeDe(s, choisi);
  // Le tableau de bord : celui de la dernière réponse, ou celui d'avant la partie.
  const tableau: TableauServi = s.ecran === "intro" || !vue ? intro.tableau : vue.tableau;
  // L'écran change dès le geste, comme quand tout se calculait ici ; ce qu'il montre arrive
  // avec la réponse. Tant qu'elle n'est pas là, la vue reçue est celle du geste d'avant : on
  // ne montre que ce qui correspond à l'étape affichée.
  const etape = vue?.etape && vue.etape.indice === s.etape ? vue.etape : null;
  const enConsequence = s.ecran === "jeu" && s.phase === "consequence";
  const consequence = enConsequence && vue?.consequence?.indice === s.etape ? vue.consequence : null;
  const affichee = consequence ?? etape;
  // L'EN-TÊTE N'AVANCE QU'AVEC LA RÉPONSE (audit UX du 11 novembre 2026, P2-3). Il disait « Fin de
  // semaine 4 » pendant que le tableau de bord montrait encore les chiffres d'avant : en attendant la
  // conséquence, il reste à la décision (son moment, son étape au fil, la décision pas encore comptée),
  // et avant la première étape, à « Avant de commencer ».
  const consequenceAttendue = enConsequence && !consequence;
  const avantLaPartie = s.ecran === "intro" || (s.ecran === "jeu" && !affichee && s.decisions.length === 0);
  const prises = consequenceAttendue ? s.decisions.length - 1 : s.decisions.length;
  const phaseAffichee: Phase = consequenceAttendue ? "decision" : s.phase;
  // L'EN-TÊTE SUIT L'ÉTAPE AFFICHÉE. À la conséquence, le tableau de bord dit
  // « fin de semaine 2 » : l'en-tête disait encore « Semaine 1 · lundi », le
  // moment de la décision qu'on vient de prendre.
  const moment = avantLaPartie
    ? "Avant de commencer"
    : s.ecran === "bilan"
      ? "Fin du trimestre"
      : consequence
        ? `Fin de semaine ${consequence.jusqua}`
        : (affichee?.moment ?? "");
  const titre = affichee?.titre ?? "";

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <div className="mb-6 flex flex-wrap items-center gap-x-5 gap-y-3">
        <p className="text-xs uppercase tracking-annonce text-slate-400">
          <Link href="/entreprises/episode" className="hover:text-slate-300">
            Épisodes manager
          </Link>{" "}
          / {intro.numero}
        </p>
        {/* « DÉMONSTRATION » SEULEMENT POUR UNE DÉMONSTRATION (audit UX du 11 novembre 2026, P2-4) : une
            partie sous licence, celle d'une cohorte qui compte au profil, ne l'est pas. */}
        <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs text-slate-400" data-badge-de-l-episode="">
          {licence ? "Données fictives" : "Démonstration · données fictives"}
        </span>
        {s.ecran !== "intro" && (
          <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs font-semibold text-slate-300">
            Niveau {niveau.nom}
          </span>
        )}
        <div className="ml-auto flex items-center gap-4">
          <span className="text-sm tabular-nums text-slate-400" data-moment-de-l-episode="">
            {moment}
          </span>
          <ol className="flex gap-1.5" aria-label={`Avancement : ${n} décisions`} data-avancement="">
            {Array.from({ length: n }, (_, i) => {
              const fait = i < prises;
              const enCours = !fait && i === s.etape && s.ecran === "jeu" && !avantLaPartie;
              return (
                <li
                  key={i}
                  aria-label={`Décision ${i + 1}${fait ? ", prise" : enCours ? ", en cours" : ""}`}
                  className={`h-1.5 w-5 rounded-full ${
                    // L'avancement est un état : l'encre, pas l'orange de l'action.
                    fait ? "bg-slate-200" : enCours ? "bg-slate-500" : "bg-slate-700"
                  }`}
                />
              );
            })}
          </ol>
          {s.ecran !== "intro" && (
            <button
              type="button"
              onClick={gestes.recommencer}
              className="min-h-11 text-sm text-slate-400 underline underline-offset-4 hover:text-slate-200"
            >
              Recommencer
            </button>
          )}
        </div>
      </div>

      {/* Sur téléphone, le tableau de bord tient en une ligne collée sous
          l'en-tête, et le récit passe en premier. */}
      <LigneDuTableau tableau={tableau} ecarts={consequence !== null} haut={haut} />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <aside
          className="max-lg:hidden lg:sticky lg:top-24 lg:order-last"
          aria-label={`Tableau de bord : ${intro.nomDuTableau.toLowerCase()}`}
        >
          <TableauDeBord tableau={tableau} ecarts={consequence !== null} />
        </aside>

        <div
          ref={scene}
          className="grid min-w-0 scroll-mt-24 content-start gap-5"
          aria-live="polite"
          aria-busy={s.attente !== null || undefined}
          // Pendant l'attente, la scène garde la hauteur qu'elle avait au geste : la page ne se vide pas.
          style={hauteurReservee ? { minHeight: hauteurReservee } : undefined}
          data-scene-de-l-episode=""
        >
          {s.ecran === "intro" && (
            <Intro
              intro={intro}
              reglages={reglages}
              niveau={choisi}
              niveaux={niveaux}
              offre={offre}
              licence={licence}
              onNiveau={gestes.onNiveau}
              onCommencer={() => gestes.commencer(null)}
            />
          )}

          {s.ecran === "jeu" && !affichee && !s.erreur && <Attente texte="Le trimestre se prépare…" enTete />}

          {s.ecran === "jeu" && affichee && (
            <>
              <header>
                <p className="text-sm font-semibold uppercase tracking-etiquette text-amber-300">
                  Décision {s.etape + 1} sur {n} · {moment}
                </p>
                <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-slate-50 sm:text-4xl">
                  {titre}
                </h1>
                <Fil etape={s.etape} phase={phaseAffichee} />
              </header>
              {consequence ? (
                <Consequence reglages={reglages} s={s} consequence={consequence} gestes={gestes} />
              ) : enConsequence ? (
                !s.erreur && <Attente texte="Les semaines passent…" />
              ) : (
                <Scene reglages={reglages} s={s} etape={etape!} gestes={gestes} />
              )}
            </>
          )}

          {s.erreur && <Erreur texte={s.erreur} onReessayer={gestes.reessayer} />}

          {/* Un bilan repris après un rechargement se redemande au serveur. */}
          {s.ecran === "bilan" && !vue?.bilan && !s.erreur && <Attente texte="Le bilan se prépare…" enTete />}

          {s.ecran === "bilan" && partieJouee && vue?.bilan && (
            <BilanDeLEpisode
              bilan={vue.bilan}
              code={intro.code}
              partie={partieJouee}
              cle={s.cle}
              niveaux={reglages.niveaux}
              cours={cours}
              onAutreHasard={gestes.autreHasard}
              onMemeHasard={gestes.memeHasard}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function Fil({ etape, phase }: { etape: number; phase: Phase }) {
  const ps = [...phasesDe(etape), "consequence" as const];
  const k = ps.indexOf(phase);
  return (
    <ol className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-sm text-slate-400">
      {ps.map((p, j) => (
        <li
          key={p}
          aria-current={j === k ? "step" : undefined}
          className={`flex items-center gap-1.5 ${j === k ? "font-semibold text-slate-50" : ""}`}
        >
          <span
            aria-hidden="true"
            className={`inline-grid size-5 place-items-center rounded-full border text-xs ${
              j === k
                ? "border-slate-200 bg-slate-200 text-slate-900"
                : j < k
                  ? "border-white/15 bg-slate-800"
                  : "border-white/15"
            }`}
          >
            {j < k ? "✓" : j + 1}
          </span>
          {NOMS_DES_PHASES[p]}
        </li>
      ))}
    </ol>
  );
}

function Intro({
  intro,
  reglages,
  niveau,
  niveaux,
  offre,
  licence,
  onNiveau,
  onCommencer,
}: {
  intro: IntroServie;
  reglages: ReglagesDesNiveaux;
  niveau: CodeNiveau;
  niveaux: readonly CodeNiveau[];
  offre: OffreDesEpisodes | null;
  licence: boolean;
  onNiveau: (n: CodeNiveau) => void;
  onCommencer: () => void;
}) {
  const NIVEAUX = reglages.niveaux;
  // Sans licence, une démonstration ne se joue qu'en Découverte : les autres niveaux
  // restent visibles, marqués, avec ce qui les ouvre (jamais un choix grisé muet).
  const fermes = NIVEAUX.filter((n) => !niveaux.includes(n.code));
  return (
    <section className="carte grid gap-5 p-5 sm:p-7">
      <div>
        <p className="text-sm font-semibold uppercase tracking-etiquette text-amber-300">
          Épisode {intro.numero} · {intro.domaine}
        </p>
        <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-slate-50 sm:text-5xl">
          {intro.titre}
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-300">{intro.persona}</p>
      </div>
      <div className="grid gap-3 border-y border-white/10 py-4">
        <h2 className="text-xs font-semibold uppercase tracking-etiquette text-slate-400">
          Votre mandat pour le trimestre
        </h2>
        <ul className="grid gap-x-6 gap-y-2 text-slate-200 sm:grid-cols-2">
          {intro.mandat.map((m) => (
            <li key={m.texte}>
              <strong className="font-display text-lg text-slate-50">{m.fort}</strong> {m.texte}
            </li>
          ))}
        </ul>
        <p className="max-w-2xl text-slate-300">{intro.jugement}</p>
      </div>
      <p className="max-w-2xl text-sm leading-relaxed text-slate-400">
        {intro.nombreDeDecisions} décisions, {intro.duree}. Les chiffres bougent avec vos choix ; à la fin, le
        bilan rejoue chacune de vos décisions sous les mêmes {intro.tirages} tirages au hasard.{" "}
        {!licence && niveaux.every((n) => n === "decouverte") ? (
          <>
            Une démonstration se joue au niveau Démonstration, qui ne compte pas dans le profil
            décisionnel : à la fin, le bilan en montre un aperçu, calculé sur cet épisode seul.
            Avec une licence, chaque épisode enrichit votre profil. Une démonstration n&apos;est
            pas enregistrée : le serveur calcule chaque étape de la partie et n&apos;en garde
            rien.
          </>
        ) : (
          <>
            À la fin, vos choix sont gardés sur cet appareil pour votre profil décisionnel, sans
            votre nom ni aucun texte saisi ; vous pouvez les effacer depuis le profil. Une partie
            au niveau Démonstration n&apos;y compte pas.
          </>
        )}
      </p>
      <fieldset className="grid gap-2">
        <legend className="mb-1 font-semibold text-slate-50">Niveau</legend>
        <p className="mb-2 max-w-2xl text-sm leading-relaxed text-slate-400">
          Le niveau change ce que vous savez et voyez, pas le trimestre : le bilan juge vos
          décisions de la même façon à tous les niveaux.
        </p>
        <Choix
          nom="niveau"
          valeur={niveau}
          options={NIVEAUX.filter((n) => niveaux.includes(n.code)).map((n) => ({
            id: n.code,
            t: n.nom,
            d: n.resume,
          }))}
          onChoisir={(id) => onNiveau(id as CodeNiveau)}
        />
        {fermes.length > 0 && (
          <>
            <ul className="mt-2 grid gap-2" data-niveaux-fermes="">
              {fermes.map((n) => (
                <li
                  key={n.code}
                  className="grid gap-0.5 rounded-lg border border-white/5 px-4 py-3"
                >
                  <span className="text-slate-300">
                    {n.nom}
                    {offre ? (
                      <>
                        {" "}
                        · <span className="font-semibold">{offre.marque}</span>
                      </>
                    ) : null}
                  </span>
                  <span className="text-sm text-slate-400">{n.resume}</span>
                </li>
              ))}
            </ul>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-400">
              Démonstration gratuite : elle se joue au niveau {NIVEAUX.find((n) => n.code === niveaux[0])?.nom ?? "Démonstration"}.{" "}
              {offre ? (
                <>
                  Les autres niveaux, et tous les épisodes, sont inclus dans l&apos;offre{" "}
                  {offre.nom}, sur devis.{" "}
                  <Link
                    href={offre.devis}
                    prefetch={false}
                    className="font-semibold text-amber-300 underline decoration-1 underline-offset-4 hover:decoration-2"
                  >
                    {offre.libelle}
                  </Link>
                </>
              ) : (
                "Les autres niveaux ne sont pas ouverts sur cet appareil."
              )}
            </p>
          </>
        )}
      </fieldset>
      <Suite onClick={onCommencer}>Commencer l&apos;épisode</Suite>
    </section>
  );
}

/* ------------------------------------------------------------------------- */

function Scene({
  reglages,
  s,
  etape,
  gestes,
}: {
  reglages: ReglagesDesNiveaux;
  s: EtatDeLEpisode;
  etape: EtapeServie;
  gestes: Gestes;
}) {
  const idDeLaPlage = useId();
  const i = s.etape;
  const niveau = niveauDe(reglages, s.niveau);
  const sources = etape.sources;
  const vues = s.consultes[i]!;
  const encore = verificationPossible(niveau, i, vues.length);
  const repere = (temps: TempsDeDecision) => niveau.reperes && <Repere texte={reglages.reperes[temps]} />;
  const { suivante, consulter, valider, maj } = gestes;

  if (s.phase === "signal") {
    const ensuite = phasesDe(i)[1];
    return (
      <>
        {repere("signal")}
        <Boite messages={etape.messages} />
        <Suite onClick={suivante}>
          {ensuite === "decision" ? "Décider" : ensuite === "enquete" ? "Enquêter" : "Continuer"}
        </Suite>
      </>
    );
  }

  if (s.phase === "enquete") {
    const budget = etape.budget;
    const compte = i === 0 && budget != null;
    const reste = compte ? budget! - s.jours : 0;
    const perte = etape.perte;
    const echeance = etape.echeance;
    return (
      <>
        {repere("enquete")}
        {compte ? (
          <div className="grid gap-2.5">
            <p className="max-w-2xl text-base leading-relaxed text-slate-200">
              <strong className="text-slate-50">
                Il vous reste {enJours(reste)} jour{reste > 1 ? "s" : ""} avant {echeance}.
              </strong>{" "}
              {etape.consigne}
            </p>
            <div
              className="grid max-w-md gap-1"
              style={{ gridTemplateColumns: `repeat(${Math.round(budget! * 2)}, minmax(0, 1fr))` }}
              aria-hidden="true"
            >
              {Array.from({ length: Math.round(budget! * 2) }, (_, k) => (
                <span
                  key={k}
                  className={`h-2 rounded-md border ${
                    k < s.jours * 2
                      ? k >= etape.joursSansPerte * 2
                        ? "border-red-400 bg-red-400"
                        : "border-[var(--donnee)] bg-[var(--donnee)]"
                      : "border-white/10 bg-slate-800"
                  }`}
                />
              ))}
            </div>
          </div>
        ) : (
          <p className="text-base text-slate-200">
            Que vérifiez-vous avant de décider ? Rien n&apos;est obligatoire.
            {niveau.verificationsParDecision === 1 &&
              " Vous n'avez le temps que d'une vérification."}
          </p>
        )}
        <ul className="grid gap-2">
          {sources.map((src) => {
            const vue = vues.includes(src.id);
            return (
              <CarteSource
                key={src.id}
                source={src}
                vue={vue}
                impossible={!vue && ((compte && src.cout > reste + 1e-9) || !encore)}
                pourquoi={compte ? "plus le temps" : "une seule vérification"}
                onConsulter={() => consulter(src)}
              />
            );
          })}
        </ul>
        {perte && <Boite messages={[perte]} />}
        <Suite onClick={suivante}>{i === 0 ? "Poser mon diagnostic" : "Décider"}</Suite>
      </>
    );
  }

  if (s.phase === "diagnostic") {
    const d = s.diagnostic;
    return (
      <>
        {repere("diagnostic")}
        <fieldset className="grid gap-2">
          <legend className="mb-2 font-semibold text-slate-50">
            Quel est le problème principal ?
          </legend>
          <Choix
            nom="principal"
            valeur={d.principal}
            options={etape.diagnostics}
            onChoisir={(id) =>
              maj((e) => ({
                diagnostic: {
                  principal: id,
                  second: e.diagnostic.second === id ? null : e.diagnostic.second,
                },
              }))
            }
          />
        </fieldset>
        <fieldset className="grid gap-2">
          <legend className="mb-2 font-semibold text-slate-50">
            Un second problème ?{" "}
            <span className="ml-1 text-sm font-normal text-slate-400">facultatif</span>
          </legend>
          <Choix
            nom="second"
            valeur={d.second}
            options={[
              { id: "aucun", t: "Aucun autre" },
              ...etape.diagnostics.filter((x) => x.id !== d.principal),
            ]}
            onChoisir={(id) =>
              maj((e) => ({
                diagnostic: { ...e.diagnostic, second: id },
              }))
            }
          />
        </fieldset>
        <Suite onClick={suivante} disabled={!d.principal}>
          Décider
        </Suite>
      </>
    );
  }

  if (s.phase === "reevaluation") {
    const avant = etape.diagnostics.find((x) => x.id === s.diagnostic.principal);
    const r = s.reevaluation;
    return (
      <>
        {repere("reevaluation")}
        <p className="max-w-2xl text-base leading-relaxed text-slate-200">
          En semaine 1, vous avez retenu comme problème principal :{" "}
          <strong className="text-slate-50">« {avant?.t} »</strong>. Avec ce que vous savez
          maintenant, le maintenez-vous ?
        </p>
        <fieldset>
          <legend className="sr-only">Votre diagnostic de la semaine 1</legend>
          <Choix
            nom="reevaluation"
            valeur={r.choix}
            options={[
              { id: "maintient", t: "Je le maintiens" },
              { id: "corrige", t: "Je le corrige" },
            ]}
            onChoisir={(id) =>
              maj((e) => ({
                reevaluation: { ...e.reevaluation, choix: id as "maintient" | "corrige" },
              }))
            }
          />
        </fieldset>
        {r.choix === "corrige" && (
          <fieldset className="grid gap-2">
            <legend className="mb-2 font-semibold text-slate-50">
              Le problème principal, selon vous maintenant
            </legend>
            <Choix
              nom="reprincipal"
              valeur={r.principal}
              options={etape.diagnostics.filter((x) => x.id !== s.diagnostic.principal)}
              onChoisir={(id) =>
                maj((e) => ({ reevaluation: { ...e.reevaluation, principal: id } }))
              }
            />
          </fieldset>
        )}
        <Suite
          onClick={suivante}
          disabled={!(r.choix === "maintient" || (r.choix === "corrige" && r.principal))}
        >
          Continuer
        </Suite>
      </>
    );
  }

  // La décision.
  const avecSources = i >= 2 && sources.length > 0;
  const prevision = etape.prevision;
  const previsionOk = !prevision || previsionValide(prevision, s.prevision.valeur);
  const horsPlage = Boolean(prevision) && s.prevision.valeur.trim() !== "" && !previsionOk;
  return (
    <>
      {repere("decision")}
      {avecSources && (
        <>
          <p className="text-base text-slate-200">
            Avant de décider, vous pouvez vérifier
            {niveau.verificationsParDecision === 1 ? " une chose :" : " :"}
          </p>
          <ul className="grid gap-2">
            {sources.map((src) => {
              const vue = vues.includes(src.id);
              return (
                <CarteSource
                  key={src.id}
                  source={src}
                  vue={vue}
                  impossible={!vue && !encore}
                  pourquoi="une seule vérification"
                  onConsulter={() => consulter(src)}
                />
              );
            })}
          </ul>
        </>
      )}
      <fieldset className="grid gap-2">
        <legend className="mb-2 text-lg font-semibold text-slate-50">{etape.question}</legend>
        <Choix
          nom="option"
          grande
          valeur={s.choix == null ? null : String(s.choix)}
          options={etape.options.map((o, k) => ({ id: String(k), t: o.t, d: o.d }))}
          onChoisir={(id) => maj(() => ({ choix: Number(id) }))}
        />
      </fieldset>
      <label className="grid gap-1.5">
        <span className="font-semibold text-slate-50">
          Pourquoi ce choix ?{" "}
          <span className="ml-1 text-sm font-normal text-slate-400">une phrase, facultatif</span>
        </span>
        <textarea
          rows={2}
          value={s.justifications[i] ?? ""}
          onChange={(ev) => {
            const v = ev.target.value;
            maj((e) => {
              const j = [...e.justifications];
              j[i] = v;
              return { justifications: j };
            });
          }}
          placeholder="Ce que vous attendez de cette décision"
          className="champ champ-facultatif w-full px-3 py-2.5 text-base text-slate-100 placeholder:text-slate-400"
        />
      </label>
      {prevision && (
        <div className="carte grid gap-4 p-4 sm:grid-cols-2 sm:items-end">
          <div className="grid gap-1.5">
            <label className="grid gap-1.5">
              <span className="font-semibold text-slate-50">
                Votre prévision : {prevision.libelle}
              </span>
              <span className="flex max-w-40 items-center gap-2">
                <input
                  type="number"
                  onWheel={sansMolette}
                  inputMode="decimal"
                  min={prevision.min}
                  max={prevision.max}
                  step={prevision.step}
                  value={s.prevision.valeur}
                  placeholder={prevision.placeholder}
                  aria-invalid={horsPlage || undefined}
                  aria-describedby={horsPlage ? idDeLaPlage : undefined}
                  onChange={(ev) => {
                    const v = ev.target.value;
                    maj((e) => ({ prevision: { ...e.prevision, valeur: v } }));
                  }}
                  className="champ w-full px-3 py-2 text-base tabular-nums text-slate-100"
                />
                <span className="text-slate-300">{prevision.unite}</span>
              </span>
            </label>
            {/* Une prévision hors de sa plage grisait « Valider la décision » sans rien dire (audit UX du
                11 novembre 2026, P2-5) : la plage se dit sous le champ. */}
            {horsPlage && (
              <span id={idDeLaPlage} role="alert" className="text-sm text-red-300" data-prevision-hors-plage="">
                {plageDeLaPrevision(prevision)}
              </span>
            )}
          </div>
          <label className="grid gap-1.5">
            <span className="font-semibold text-slate-50">
              Votre confiance :{" "}
              <output className="tabular-nums">{s.prevision.confiance} %</output>
            </span>
            <input
              type="range"
              onWheel={sansMolette}
              min={10}
              max={100}
              step={10}
              value={s.prevision.confiance}
              aria-valuetext={`${s.prevision.confiance} %`}
              onChange={(ev) => {
                const v = Number(ev.target.value);
                maj((e) => ({ prevision: { ...e.prevision, confiance: v } }));
              }}
              className="w-full accent-amber-400"
            />
          </label>
        </div>
      )}
      <Suite onClick={valider} disabled={s.choix == null || !previsionOk}>
        Valider la décision
      </Suite>
    </>
  );
}

/**
 * LA CONSÉQUENCE, DANS LA GRAMMAIRE DU « MARCHÉ RÉPOND ». Une bande marine
 * en tête de l'écran : le chiffre clé des semaines jouées (celui de la
 * courbe du trimestre), son écart à la cible que l'épisode déclare (le
 * budget, l'objectif), et ce qu'on a choisi. Les cartes de l'indicateur,
 * juste dessous, ne disaient pas qu'on était sous le budget. Tout arrive du
 * serveur après la décision (pedagogy/episodes/partie-servie.ts).
 */
function Consequence({
  reglages,
  s,
  consequence,
  gestes,
}: {
  reglages: ReglagesDesNiveaux;
  s: EtatDeLEpisode;
  consequence: NonNullable<VueDeLaPartie["consequence"]>;
  gestes: Gestes;
}) {
  const niveau = niveauDe(reglages, s.niveau);
  const c = consequence;
  const verdict = c.verdict;
  const effet = c.effet;
  return (
    <>
      <section
        aria-label="Conséquence de votre décision"
        className="ardoise rounded-xl bg-slate-950 px-4 py-4 text-slate-100 sm:px-6 sm:py-5"
      >
        <VerdictDuMarche
          forme="bande"
          surtitre={c.surtitre}
          titre={`Semaines ${c.de} à ${c.jusqua} · le verdict`}
          chiffre={{
            libelle: verdict.libelle,
            valeur: verdict.valeur,
            sens: null,
            ...(verdict.nombre === null || !verdict.plume
              ? {}
              : { nombre: verdict.nombre, ecrire: ecrireAvec(verdict.plume) }),
          }}
          ecart={
            verdict.ecart
              ? {
                  valeur: verdict.ecart.valeur,
                  mention: verdict.ecart.mention,
                  sens: verdict.ecart.sens,
                  nombre: verdict.ecart.nombre,
                  ecrire: ecrireAvec(verdict.ecart.plume),
                }
              : null
          }
          phrase={`Vous avez choisi : ${enMinuscule(c.option)}.`}
        />
      </section>
      {niveau.retourImmediat && (
        <p className="encadre-neutre max-w-2xl rounded-lg px-4 py-3 text-sm leading-relaxed text-slate-200">
          <strong className="font-semibold text-slate-100">Retour immédiat · </strong>
          {effet
            ? `Sur ce trimestre-ci, ce choix ${effet.rapporte ? "rapporte" : "coûte"} ${effet.montant} par rapport à « ${effet.reference} ». C'est un seul tirage au hasard : le bilan dira ce que ce choix vaut en moyenne.`
            : "Vous avez choisi de ne rien changer : le trimestre suit son cours. Le bilan dira si c'était le bon choix."}
        </p>
      )}
      <dl className="grid grid-cols-3 gap-2 sm:gap-3">
        {c.recap.map(([nom, valeur]) => (
          <div key={nom} className="carte min-w-0 px-3 py-2.5 sm:px-4 sm:py-3">
            <dt className="text-sm text-slate-400">{nom}</dt>
            <dd className="font-display text-lg font-semibold tabular-nums text-slate-50 sm:text-xl">
              {valeur}
            </dd>
          </div>
        ))}
      </dl>
      <CourbeDesSemaines courbe={c.courbe} />
      <Boite messages={c.reactions} />
      {niveau.imprevusSignales && c.imprevus.length > 0 && (
        <section aria-labelledby="imprevus-titre" className="grid gap-2">
          <h2
            id="imprevus-titre"
            className="text-xs font-semibold uppercase tracking-etiquette text-slate-400"
          >
            Pendant ce temps, sans rapport avec vos décisions
          </h2>
          <Boite messages={c.imprevus} />
        </section>
      )}
      <Suite onClick={gestes.etapeSuivante}>{c.derniere ? "Voir le bilan" : "Continuer"}</Suite>
    </>
  );
}

export const EcranDeLEpisode = avecTypographie(EcranDeLEpisodeBrut);
export const EpisodeJoue = avecTypographie(EpisodeJoueBrut);
