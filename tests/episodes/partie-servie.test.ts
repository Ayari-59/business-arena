import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Le retour du bilan garde la partie par une action serveur, dans un effet : au rendu statique, rien ne part.
vi.mock("@/app/entreprises/episode/actions", () => ({ enregistrerPartieAction: vi.fn() }));

import { EpisodeJoue as AncienEpisode, nouvelEtat as ancienEtat, type Etat } from "./ancien/episode-joue";
import { EcranDeLEpisode, nouvelEtat, type EtatDeLEpisode } from "@/components/episode/episode-joue";
import { EPISODES } from "@/pedagogy/episodes/registre";
import {
  introServie,
  reglagesDesNiveaux,
  servirLaPartie,
  type DemandeDePartie,
  type VueDeLaPartie,
} from "@/pedagogy/episodes/partie-servie";
import { coursDeLEpisode } from "@/pedagogy/cours/suites";
import {
  budgetDEnquete,
  niveauParCode,
  sourcesProposees,
  verificationPossible,
  type CodeNiveau,
} from "@/config/episodes/niveaux";
import { mulberry32 } from "@/engine/episodes/commun";
import type { Episode, PartieJouee } from "@/config/episodes/types";

/**
 * L'ANCIEN CALCUL CONTRE LE NOUVEAU, ÉCRAN PAR ÉCRAN (audit du 10 novembre 2026, P1-1).
 *
 * Avant de retirer le calcul du navigateur, chaque épisode du registre est joué sous trois suites de
 * décisions (la première option partout, la dernière partout, une suite tirée), à trois niveaux, et
 * chaque écran est rendu deux fois : par l'ancien composant (copié dans ./ancien), qui calculait
 * tout lui-même, et par le nouveau, qui n'affiche que la vue servie. Les deux pages doivent être
 * identiques. Les empreintes des pages de l'ancien calcul deviennent celles du test d'or
 * (tests/fixtures/episodes-servis-or.json) : METTRE_A_JOUR_L_OR=1 les écrit.
 *
 * Une seule phrase change, et c'est voulu : l'introduction d'une démonstration ne dit plus que la
 * partie « se joue et se juge dans votre navigateur », ce qui n'est plus vrai.
 */

const PHRASE_ANCIENNE = "la partie se joue et se juge dans votre navigateur, rien n&#x27;est gardé sur nos serveurs.";
const PHRASE_NOUVELLE = "le serveur calcule chaque étape de la partie et n&#x27;en garde rien.";

const OR = join(process.cwd(), "tests/fixtures/episodes-servis-or.json");

const phasesDe = (etape: number) =>
  etape === 0
    ? (["signal", "enquete", "diagnostic", "decision"] as const)
    : etape === 1
      ? (["signal", "reevaluation", "enquete", "decision"] as const)
      : (["signal", "decision"] as const);

interface Script {
  nom: "premiere" | "derniere" | "tiree";
  niveau: CodeNiveau;
  licence: boolean;
  graine: (ep: Episode) => number;
  option: (i: number, nombre: number, r: () => number) => number;
  /** L'ordre dans lequel on essaie les vérifications proposées ; on s'arrête à ce que la règle permet. */
  verifier: (ids: string[], r: () => number) => string[];
  combien: (i: number, r: () => number) => number;
  diagnostic: (ids: string[], r: () => number) => string;
  corrige: (r: () => number) => boolean;
  prevision: (p: Episode["prevision"], r: () => number) => string;
  confiance: number;
  /** La partie précédente, pour la comparaison du bilan. */
  precedente: boolean;
}

const SCRIPTS: Script[] = [
  {
    nom: "premiere",
    niveau: "standard",
    licence: true,
    graine: () => 7,
    option: () => 0,
    verifier: (ids) => ids,
    combien: (i) => (i === 0 ? 2 : 1),
    diagnostic: (ids) => ids[0]!,
    corrige: () => false,
    prevision: (p) => String(p.min),
    confiance: 60,
    precedente: false,
  },
  {
    nom: "derniere",
    niveau: "expert",
    licence: true,
    graine: () => 4242,
    option: (_, nombre) => nombre - 1,
    verifier: (ids) => [...ids].reverse(),
    combien: () => 3,
    diagnostic: (ids) => ids.at(-1)!,
    corrige: () => true,
    prevision: (p) => String(p.max),
    confiance: 30,
    precedente: true,
  },
  {
    nom: "tiree",
    niveau: "decouverte",
    licence: false,
    graine: (ep) => 1 + ((ep.numero * 7919) % 9000),
    option: (_, nombre, r) => Math.floor(r() * nombre),
    verifier: (ids, r) => [...ids].sort(() => r() - 0.5),
    combien: (_, r) => Math.floor(r() * 3),
    diagnostic: (ids, r) => ids[Math.floor(r() * ids.length)]!,
    corrige: (r) => r() < 0.5,
    prevision: (p, r) => {
      const pas = Math.max(1, Math.floor((p.max - p.min) / p.step));
      return String(Number((p.min + Math.floor(r() * (pas + 1)) * p.step).toFixed(6)));
    },
    confiance: 80,
    precedente: true,
  },
];

const CLE = "00000000-0000-4000-8000-000000000000";
const OFFRE = { marque: "Épisodes manager", nom: "Épisodes manager", devis: "/devis?offre=episodes", libelle: "Demander un devis" };
const sansGeste = () => {};
const GESTES = {
  maj: sansGeste,
  onNiveau: sansGeste,
  commencer: sansGeste,
  recommencer: sansGeste,
  suivante: sansGeste,
  consulter: sansGeste,
  valider: sansGeste,
  etapeSuivante: sansGeste,
  reessayer: sansGeste,
  autreHasard: sansGeste,
  memeHasard: sansGeste,
};

/** Une partie jouée de bout en bout : les écrans de l'ancien calcul, ceux du nouveau. */
function jouer(ep: Episode, script: Script, precedente: PartieJouee | null) {
  const r = mulberry32(ep.numero * 31 + script.nom.length);
  const n = ep.etapes.length;
  const niveaux: CodeNiveau[] = script.licence ? ["decouverte", "standard", "expert"] : ["decouverte"];
  const offre = script.licence ? null : OFFRE;
  const cours = coursDeLEpisode(ep.code);
  const intro = introServie(ep);
  const reglages = reglagesDesNiveaux();
  const niv = niveauParCode(script.niveau);
  const graine = script.graine(ep);
  const ecrans: { nom: string; ancien: string; nouveau: string }[] = [];

  const rendre = (nom: string, a: Etat, b: EtatDeLEpisode) => {
    const ancien = renderToStaticMarkup(
      createElement(AncienEpisode, { code: ep.code, niveaux, offre, licence: script.licence, cours, depart: a, precedenteDeDepart: precedente }),
    ).replace(PHRASE_ANCIENNE, PHRASE_NOUVELLE);
    const choisi = b.niveau && niveaux.includes(b.niveau) ? b.niveau : niveaux[0]!;
    const nouveau = renderToStaticMarkup(
      createElement(EcranDeLEpisode, { intro, reglages, niveaux, offre, licence: script.licence, cours, s: b, choisi, gestes: GESTES }),
    );
    ecrans.push({ nom, ancien, nouveau });
  };

  const servir = (b: EtatDeLEpisode, geste: DemandeDePartie["geste"], fin: DemandeDePartie["fin"] = null): VueDeLaPartie =>
    servirLaPartie(
      ep,
      {
        code: ep.code,
        geste,
        niveau: script.niveau,
        graine,
        decisions: b.decisions,
        consultes: b.consultes,
        fin,
        precedente: fin && precedente ? { graine: precedente.graine, chemin: [...precedente.chemin], jours: precedente.jours, niveau: precedente.niveau } : null,
      },
      { sansLicence: !script.licence },
    );

  // L'introduction, le niveau choisi.
  let a: Etat = { ...ancienEtat(ep), niveau: script.niveau };
  let b: EtatDeLEpisode = { ...nouvelEtat(n), niveau: script.niveau };
  rendre("introduction", a, b);

  // Commencer.
  a = { ...ancienEtat(ep, graine, script.niveau, CLE), ecran: "jeu" };
  b = { ...nouvelEtat(n, graine, script.niveau, CLE), ecran: "jeu" };
  b = { ...b, vue: servir(b, "commencer") };

  const lecture = (x: Etat) => ep.lire(x.decisions, x.graine ?? 1, x.jours, x.semaine);

  const verifierCe = (i: number, phase: string) => {
    const proposees = sourcesProposees(niv, ep.etapes[i]!).map((s) => s.id);
    const budget = i === 0 ? budgetDEnquete(niv, ep, ep.etapes[i]!) : undefined;
    let voulues = script.combien(i, r);
    for (const id of script.verifier(proposees, r)) {
      if (voulues <= 0) break;
      const source = ep.etapes[i]!.sources.find((s) => s.id === id)!;
      const vues = a.consultes[i]!;
      if (vues.includes(id) || !verificationPossible(niv, i, vues.length)) continue;
      if (i === 0 && budget != null && source.cout > budget - a.jours + 1e-9) continue;
      voulues -= 1;
      const consultes = a.consultes.map((c, k) => (k === i ? [...c, id] : c));
      const jours = i === 0 ? a.jours + source.cout : a.jours;
      a = { ...a, consultes, jours };
      b = { ...b, consultes, jours };
      b = { ...b, vue: servir(b, "verifier") };
      rendre(`décision ${i + 1} · ${phase} · ${id}`, a, b);
    }
  };

  for (let i = 0; i < n; i += 1) {
    const etape = ep.etapes[i]!;
    for (const phase of phasesDe(i)) {
      a = { ...a, phase };
      b = { ...b, phase };
      rendre(`décision ${i + 1} · ${phase}`, a, b);
      if (phase === "enquete") verifierCe(i, phase);
      if (phase === "diagnostic") {
        const ids = ep.diagnostics.map((x) => x.id);
        const principal = script.diagnostic(ids, r);
        const second = r() < 0.5 ? "aucun" : (ids.find((x) => x !== principal) ?? "aucun");
        a = { ...a, diagnostic: { principal, second } };
        b = { ...b, diagnostic: { principal, second } };
        rendre(`décision ${i + 1} · diagnostic posé`, a, b);
      }
      if (phase === "reevaluation") {
        const corrige = script.corrige(r);
        const autre = ep.diagnostics.find((x) => x.id !== a.diagnostic.principal)!.id;
        const reevaluation = corrige
          ? { choix: "corrige" as const, principal: autre }
          : { choix: "maintient" as const, principal: null };
        a = { ...a, reevaluation };
        b = { ...b, reevaluation };
        rendre(`décision ${i + 1} · réévaluation faite`, a, b);
      }
      if (phase === "decision") {
        if (i >= 2) verifierCe(i, phase);
        const choix = script.option(i, etape.options.length, r);
        const prevision = etape.prevision ? { valeur: script.prevision(ep.prevision, r), confiance: script.confiance } : a.prevision;
        a = { ...a, choix, prevision };
        b = { ...b, choix, prevision };
        rendre(`décision ${i + 1} · choix fait`, a, b);
      }
    }
    // Valider : l'ancien calcul garde la lecture d'avant ; le nouveau demande la conséquence au serveur.
    const decisions = [...a.decisions.slice(0, i), a.choix!];
    a = { ...a, avant: lecture(a), decisions, semaine: etape.jusqua, phase: "consequence" };
    const fin =
      i === n - 1
        ? {
            diagnostic: b.diagnostic.principal!,
            reevaluation: { choix: b.reevaluation.choix!, principal: b.reevaluation.principal },
            prevision: Number(b.prevision.valeur.replace(",", ".")),
            confiance: b.prevision.confiance,
          }
        : null;
    const vue = servir({ ...b, decisions }, "valider", fin);
    b = { ...b, decisions: [...vue.decisions], phase: "consequence", vue };
    rendre(`décision ${i + 1} · conséquence`, a, b);
    // Continuer.
    if (i === n - 1) {
      a = { ...a, ecran: "bilan", avant: null };
      b = { ...b, ecran: "bilan" };
    } else {
      a = { ...a, etape: i + 1, phase: "signal", choix: null, avant: null };
      b = { ...b, etape: i + 1, phase: "signal", choix: null };
    }
  }
  rendre("bilan", a, b);
  const partie: PartieJouee = {
    graine,
    chemin: a.decisions,
    consultes: a.consultes,
    jours: a.jours,
    diagnostic: a.diagnostic.principal!,
    reevaluation: { choix: a.reevaluation.choix!, principal: a.reevaluation.principal },
    prevision: Number(a.prevision.valeur.replace(",", ".")),
    confiance: a.prevision.confiance,
    niveau: script.niveau,
  };
  return { ecrans, partie };
}

/** Le premier endroit où deux pages divergent, avec ce qui l'entoure. */
function ecart(x: string, y: string): string {
  let k = 0;
  while (k < x.length && x[k] === y[k]) k += 1;
  return `ancien « …${x.slice(Math.max(0, k - 80), k + 80)}… »\n        nouveau « …${y.slice(Math.max(0, k - 80), k + 80)}… »`;
}

/** L'empreinte d'un écran pour le test d'or : sa page sans les classes, qui ne disent que le style. */
const empreinte = (html: string) =>
  createHash("sha256").update(html.replace(/ class="[^"]*"/g, "")).digest("hex").slice(0, 10);

describe("l'épisode servi rend chaque écran comme l'ancien calcul", () => {
  const or: Record<string, Record<string, string[]>> = {};
  for (const ep of EPISODES) {
    it(`${ep.numero} · ${ep.code}`, () => {
      const fautes: string[] = [];
      let precedente: PartieJouee | null = null;
      or[ep.code] = {};
      for (const script of SCRIPTS) {
        const { ecrans, partie } = jouer(ep, script, script.precedente ? precedente : null);
        precedente = partie;
        for (const e of ecrans) {
          if (e.ancien !== e.nouveau) fautes.push(`${script.nom} · ${e.nom}\n        ${ecart(e.ancien, e.nouveau)}`);
        }
        expect(ecrans.length).toBeGreaterThan(15);
        or[ep.code]![script.nom] = ecrans.map((e) => empreinte(e.ancien));
      }
      expect(fautes.slice(0, 3), `${fautes.length} écran(s) différent(s)`).toEqual([]);
    }, 120_000);
  }

  it.runIf(process.env.METTRE_A_JOUR_L_OR === "1")("écrit les empreintes du test d'or", () => {
    // Une ligne par partie : un changement se lit dans le diff, épisode par épisode.
    const lignes = Object.entries(or).map(
      ([code, parties]) =>
        `${JSON.stringify(code)}: {\n${Object.entries(parties)
          .map(([nom, empreintes]) => `  ${JSON.stringify(nom)}: ${JSON.stringify(empreintes)}`)
          .join(",\n")}\n}`,
    );
    writeFileSync(OR, `{\n${lignes.join(",\n")}\n}\n`);
  });
});
