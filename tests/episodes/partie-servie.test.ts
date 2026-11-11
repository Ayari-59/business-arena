import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

// Le retour du bilan garde la partie par une action serveur, dans un effet : au rendu statique, rien ne part.
vi.mock("@/app/entreprises/episode/actions", () => ({ enregistrerPartieAction: vi.fn() }));

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
 * LE TEST D'OR DES ÉPISODES SERVIS (audit du 10 novembre 2026, P1-1).
 *
 * Le jeu se calculait dans le navigateur ; il se calcule désormais au serveur, geste par geste
 * (pedagogy/episodes/partie-servie.ts), et l'écran n'affiche que ce qu'il reçoit. Avant de retirer
 * l'ancien calcul, chaque écran de chaque épisode a été rendu par les deux chemins et comparé : les
 * pages étaient identiques, à une phrase près (l'introduction d'une démonstration ne dit plus que la
 * partie « se joue et se juge dans votre navigateur »). Les empreintes de ces pages, rendues par
 * l'ancien calcul, sont gardées dans tests/fixtures/episodes-servis-or.json.
 *
 * Ce test rejoue les mêmes parties par le nouveau chemin et compare chaque écran à son empreinte :
 * chaque épisode du registre, sous trois suites de décisions (la première option partout, la dernière
 * partout, une suite tirée), à trois niveaux, avec ou sans licence, vérifications, diagnostic,
 * réévaluation, prévision et partie précédente compris. Mêmes textes, mêmes chiffres, même courbe,
 * même tableau de bord, même bilan. L'empreinte d'une page ignore ses classes, qui ne disent que le
 * style.
 *
 * Un changement voulu d'un épisode (un texte, un chiffre) change ses empreintes : on les réécrit,
 * après avoir regardé ce qui change, par
 *   METTRE_A_JOUR_L_OR=1 npx vitest run tests/episodes/partie-servie.test.ts
 */

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

/** Une partie jouée de bout en bout, comme l'écran la joue : chaque geste au serveur, chaque écran rendu. */
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
  const ecrans: { nom: string; html: string }[] = [];

  const rendre = (nom: string, b: EtatDeLEpisode) => {
    const choisi = b.niveau && niveaux.includes(b.niveau) ? b.niveau : niveaux[0]!;
    const html = renderToStaticMarkup(
      createElement(EcranDeLEpisode, { intro, reglages, niveaux, offre, licence: script.licence, cours, s: b, choisi, gestes: GESTES }),
    );
    ecrans.push({ nom, html });
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
  let b: EtatDeLEpisode = { ...nouvelEtat(n), niveau: script.niveau };
  rendre("introduction", b);

  // Commencer.
  b = { ...nouvelEtat(n, graine, script.niveau, CLE), ecran: "jeu" };
  b = { ...b, vue: servir(b, "commencer") };

  const verifierCe = (i: number, phase: string) => {
    const proposees = sourcesProposees(niv, ep.etapes[i]!).map((s) => s.id);
    const budget = i === 0 ? budgetDEnquete(niv, ep, ep.etapes[i]!) : undefined;
    let voulues = script.combien(i, r);
    for (const id of script.verifier(proposees, r)) {
      if (voulues <= 0) break;
      const source = ep.etapes[i]!.sources.find((s) => s.id === id)!;
      const vues = b.consultes[i]!;
      if (vues.includes(id) || !verificationPossible(niv, i, vues.length)) continue;
      if (i === 0 && budget != null && source.cout > budget - b.jours + 1e-9) continue;
      voulues -= 1;
      const consultes = b.consultes.map((c, k) => (k === i ? [...c, id] : c));
      const jours = i === 0 ? b.jours + source.cout : b.jours;
      b = { ...b, consultes, jours };
      b = { ...b, vue: servir(b, "verifier") };
      rendre(`décision ${i + 1} · ${phase} · ${id}`, b);
    }
  };

  for (let i = 0; i < n; i += 1) {
    const etape = ep.etapes[i]!;
    for (const phase of phasesDe(i)) {
      b = { ...b, phase };
      rendre(`décision ${i + 1} · ${phase}`, b);
      if (phase === "enquete") verifierCe(i, phase);
      if (phase === "diagnostic") {
        const ids = ep.diagnostics.map((x) => x.id);
        const principal = script.diagnostic(ids, r);
        const second = r() < 0.5 ? "aucun" : (ids.find((x) => x !== principal) ?? "aucun");
        b = { ...b, diagnostic: { principal, second } };
        rendre(`décision ${i + 1} · diagnostic posé`, b);
      }
      if (phase === "reevaluation") {
        const corrige = script.corrige(r);
        const autre = ep.diagnostics.find((x) => x.id !== b.diagnostic.principal)!.id;
        const reevaluation = corrige
          ? { choix: "corrige" as const, principal: autre }
          : { choix: "maintient" as const, principal: null };
        b = { ...b, reevaluation };
        rendre(`décision ${i + 1} · réévaluation faite`, b);
      }
      if (phase === "decision") {
        if (i >= 2) verifierCe(i, phase);
        const choix = script.option(i, etape.options.length, r);
        const prevision = etape.prevision ? { valeur: script.prevision(ep.prevision, r), confiance: script.confiance } : b.prevision;
        b = { ...b, choix, prevision };
        rendre(`décision ${i + 1} · choix fait`, b);
      }
    }
    // Valider : la conséquence, et à la dernière décision le bilan.
    const decisions = [...b.decisions.slice(0, i), b.choix!];
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
    rendre(`décision ${i + 1} · conséquence`, b);
    // Continuer.
    b = i === n - 1 ? { ...b, ecran: "bilan" } : { ...b, etape: i + 1, phase: "signal", choix: null };
  }
  rendre("bilan", b);
  const partie: PartieJouee = {
    graine,
    chemin: b.decisions,
    consultes: b.consultes,
    jours: b.jours,
    diagnostic: b.diagnostic.principal!,
    reevaluation: { choix: b.reevaluation.choix!, principal: b.reevaluation.principal },
    prevision: Number(b.prevision.valeur.replace(",", ".")),
    confiance: b.prevision.confiance,
    niveau: script.niveau,
  };
  return { ecrans, partie };
}

/** L'empreinte d'un écran : sa page sans les classes, qui ne disent que le style. */
const empreinte = (html: string) =>
  createHash("sha256").update(html.replace(/ class="[^"]*"/g, "")).digest("hex").slice(0, 10);

const reecrire = process.env.METTRE_A_JOUR_L_OR === "1";
const or = JSON.parse(readFileSync(OR, "utf8")) as Record<string, Record<string, string[]>>;

describe("l'épisode servi rend chaque écran comme l'ancien calcul", () => {
  const nouvelOr: Record<string, Record<string, string[]>> = {};

  it("chaque épisode du registre a ses empreintes, et rien d'autre", () => {
    if (reecrire) return;
    expect(Object.keys(or).sort()).toEqual(EPISODES.map((e) => e.code).sort());
  });

  for (const ep of EPISODES) {
    it(`${ep.numero} · ${ep.code}`, () => {
      const fautes: string[] = [];
      let precedente: PartieJouee | null = null;
      nouvelOr[ep.code] = {};
      for (const script of SCRIPTS) {
        const { ecrans, partie } = jouer(ep, script, script.precedente ? precedente : null);
        precedente = partie;
        const empreintes = ecrans.map((e) => empreinte(e.html));
        nouvelOr[ep.code]![script.nom] = empreintes;
        expect(ecrans.length).toBeGreaterThan(15);
        // Ce que chaque partie montre, au moins : la conséquence de chaque décision, et le bilan.
        expect(ecrans.filter((e) => e.nom.endsWith("conséquence")).every((e) => e.html.includes("· le verdict"))).toBe(true);
        expect(ecrans.at(-1)!.html).toContain("Votre axe de travail");
        if (reecrire) continue;
        const attendues = or[ep.code]?.[script.nom] ?? [];
        if (attendues.length !== empreintes.length) fautes.push(`${script.nom} : ${empreintes.length} écrans, ${attendues.length} attendus`);
        ecrans.forEach((e, k) => {
          if (attendues[k] !== empreintes[k]) fautes.push(`${script.nom} · écran ${k + 1}, ${e.nom}`);
        });
      }
      expect(fautes.slice(0, 5), `${fautes.length} écran(s) différent(s)`).toEqual([]);
    }, 120_000);
  }

  it.runIf(reecrire)("réécrit les empreintes", () => {
    // Une ligne par partie : un changement se lit dans le diff, épisode par épisode.
    const lignes = Object.entries(nouvelOr).map(
      ([code, parties]) =>
        `${JSON.stringify(code)}: {\n${Object.entries(parties)
          .map(([nom, empreintes]) => `  ${JSON.stringify(nom)}: ${JSON.stringify(empreintes)}`)
          .join(",\n")}\n}`,
    );
    writeFileSync(OR, `{\n${lignes.join(",\n")}\n}\n`);
  });
});
