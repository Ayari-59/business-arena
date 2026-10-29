import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({ db: {} }));

import { CHAPITRES } from "@/config/cours/registre";
import { SITUATIONS } from "@/config/cours/situations";
import { FORMATIONS } from "@/config/formations";
import { formationsAvecUnePage } from "@/config/couverture";
import { ATELIERS } from "@/config/ateliers";
import { DIFFICULTY_PRESETS } from "@/config/difficulty";
import { DIFFICULTES } from "@/config/ateliers/types";
import { NIVEAUX as NIVEAUX_DES_EPISODES } from "@/config/episodes/niveaux";
import { ENTREPRISES, NIVEAUX_DE_L_ARENE, OFFRES } from "@/config/tarifs";
import { leCoursEnChiffres } from "@/config/articulation";
import { ateliersDeLaClasse, ateliersParCombinaison } from "@/config/ateliers-de-la-classe";
import { LeCoursEnBref } from "@/components/le-cours-en-bref";
import { DevisForm } from "@/components/devis-form";

/**
 * LES DÉFAUTS « PRODUIT » DE L'AUDIT DU 28 OCTOBRE 2026 (produit.md), TENUS.
 *
 *  1. le cours se présente sur /enseignants, /ecoles, /fonctionnalites, nombres comptés ;
 *     (le titre, la description et l'image de partage : tests/unit/seo-metadata.test.ts) ;
 *  2. les portes de l'accueil : l'enseignant vers sa page, l'élève vers la saisie du code ;
 *  3. l'orientation mène au devis et à l'essai ; plus de devis « cours seul » (décision du propriétaire) ; avant, il ne demandait ni
 *     entreprise ni niveau (la validation serveur : tests/integration/trois-offres.test.ts) ;
 *  4. un mot par sens : « formation » pour les entrées du registre, et « Découverte » à ses
 *     seuls quatre sens recensés, aucun cinquième ;
 *  5. l'offre Classe dit, au choix, les ateliers qu'ouvre la combinaison, ou qu'il n'y en a pas ;
 *  6. le laboratoire : focus visible des leviers à choix, focus au titre de chaque étape,
 *     région vivante limitée aux résultats ;
 *  7. les jetons de contraste : texte slate-600 à 4,5 pour 1, filets interactifs à 3 pour 1.
 */

const SRC = join(process.cwd(), "src");
const lire = (chemin: string) => readFileSync(join(SRC, chemin), "utf8");
const texte = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/\s+/g, " ");

describe("1. le cours sur les pages des publics", () => {
  it("les nombres du cours viennent des registres", () => {
    const n = leCoursEnChiffres();
    expect(n.chapitres).toBe(CHAPITRES.length);
    expect(n.casPratiques).toBe(SITUATIONS.length);
    expect(n.avecLaboratoire).toBe(CHAPITRES.filter((c) => c.etapes.some((e) => e.type === "simulation")).length);
    expect(n.formations).toBeGreaterThan(0);
    expect(n.formations).toBeLessThanOrEqual(FORMATIONS.length);
    expect(n.libre.href).toBe(`/cours/${CHAPITRES.find((c) => c.libre)!.code}`);
  });

  it("l'encart dit ces nombres, mène au catalogue et au chapitre libre", () => {
    const n = leCoursEnChiffres();
    const html = renderToStaticMarkup(createElement(LeCoursEnBref));
    const t = texte(html);
    expect(t).toContain(`${n.chapitres} chapitres`);
    expect(t).toContain(`${n.casPratiques} cas pratiques`);
    expect(t).toContain(`${n.formations} formations`);
    // « chacun avec son laboratoire » seulement quand tous l'ont.
    if (n.avecLaboratoire === n.chapitres) expect(t).toContain("chacun avec son laboratoire");
    else expect(t).toContain(`dont ${n.avecLaboratoire} avec leur laboratoire`);
    expect(html).toContain('href="/cours"');
    expect(html).toContain(`href="${n.libre.href}"`);
  });

  it.each(["app/enseignants/page.tsx", "app/ecoles/page.tsx", "app/fonctionnalites/page.tsx"])(
    "%s présente le cours",
    (page) => {
      expect(lire(page)).toMatch(/<LeCoursEnBref\b/);
    },
  );
});

describe("2. les portes de l'accueil", () => {
  const accueil = lire("app/page.tsx");
  it("« Je suis enseignant » mène à la page des enseignants, pas à la connexion", () => {
    const lien = accueil.match(/<Link href="([^"]+)"[^>]*>\s*Je suis enseignant/);
    expect(lien?.[1]).toBe("/enseignants");
  });
  it("l'élève a sa porte : la saisie du code, qui renvoie chaque code à sa page", () => {
    expect(accueil).toMatch(/<Link href="\/join"[^>]*>\s*J&apos;ai un code/);
    // /join oriente un code qui n'est pas une partie (classe du cours, cohorte, concours, examen).
    expect(lire("app/join/actions.ts")).toMatch(/ouRejoindre\(code\)/);
  });
  it("le concours entre classes, décrit pour l'enseignant, mène à sa présentation", () => {
    expect(accueil).toMatch(/title: "Concours entre classes",[\s\S]{0,200}href: "\/guide#concours"/);
  });
});

describe("3. l'orientation mène au devis et à l'essai ; le cours vient avec l'offre", () => {
  const orientation = lire("components/orientation-form.tsx");
  it("trois sorties : le devis du réglage, l'essai solo, le devis du cours (« le cours seul » n'est plus un choix)", () => {
    expect(orientation).toMatch(/\/devis\?offre=classe&entreprise=\$\{encodeURIComponent\(reco\.scenarioCode\)\}&niveau=\$\{reco\.niveau\}/);
    expect(orientation).toMatch(/href="\/jouer"/);
    expect(orientation).toMatch(/href="\/devis\?offre=classe"/);
  });
  it("le chapitre réservé ouvre le devis de l'offre Classe", () => {
    expect(lire("components/cours/chapitre-reserve.tsx")).toContain('href="/devis?offre=classe"');
  });

  const props = {
    offres: [
      {
        code: "classe",
        offre: "Classe",
        organisation: "L'établissement",
        exempleOrganisation: "",
        identifiant: "UAI",
        entreprise: true as const,
        niveau: true as const,
      },
    ],
    offreInitiale: "classe",
    entreprises: ENTREPRISES.map((e) => ({ code: e.code, nom: e.nom })),
    niveaux: NIVEAUX_DE_L_ARENE,
    vendeur: "V",
    mentionTva: "TVA",
    contact: "c@x.test",
  };
  it("plus de « cours seul » : l'entreprise et le niveau sont requis", () => {
    const arene = renderToStaticMarkup(createElement(DevisForm, props));
    expect(arene).toMatch(/<select[^>]*required[^>]*name="entreprise"|<select[^>]*name="entreprise"[^>]*required/);
    expect(arene).not.toMatch(/name="interet"/);
    expect(texte(arene)).not.toContain("Le cours seul");
  });
  it("le réglage choisi ailleurs est repris", () => {
    const html = renderToStaticMarkup(
      createElement(DevisForm, { ...props, entrepriseInitiale: ENTREPRISES[0]!.code, niveauInitial: "2" }),
    );
    expect(html).toMatch(new RegExp(`<option value="${ENTREPRISES[0]!.code}" selected`));
    expect(html).toMatch(/<option value="2" selected/);
  });
});

describe("4. un mot par sens", () => {
  it("les formations : /enseignants compte les formations servies, pas « 9 diplômes visés »", () => {
    const ens = lire("app/enseignants/page.tsx");
    expect(ens).not.toMatch(/label: "diplômes visés"/);
    expect(ens).toMatch(/formationsAvecUnePage\(\)/);
    expect(ens).toMatch(/label: "formations servies"/);
    // « Du CAP au DSCG » : les deux bouts existent dans le registre des pages.
    const sigles = formationsAvecUnePage().map((f) => f.sigle);
    expect(sigles.some((s) => s.startsWith("CAP"))).toBe(true);
    expect(sigles).toContain("DSCG");
    expect(lire("app/cours/page.tsx")).not.toMatch(/du lycée au DCG/);
    expect(lire("config/navigation.ts")).not.toMatch(/pour chaque diplôme qui a un atelier/);
  });

  it("/parcours porte le nom du menu, « Référentiels par diplôme »", () => {
    expect(lire("app/parcours/page.tsx")).not.toMatch(/"Parcours par diplôme"/);
    expect(lire("app/parcours/[formation]/page.tsx")).not.toMatch(/Parcours par diplôme/);
  });

  it("« Découverte » : ses quatre sens recensés, chacun dans son registre, et aucun cinquième", () => {
    // 1) l'offre gratuite ; 2) le niveau 1 de l'arène ; 3) l'exigence 1 d'un atelier ;
    // 4) le niveau des épisodes de démonstration. Les renommer touche la grille figée et le
    // catalogue en base : c'est une décision du propriétaire (voir le rapport). D'ici là,
    // aucun texte neuf ne lui donne un cinquième sens : l'image de partage ne l'emploie plus.
    expect(OFFRES.decouverte.nom).toBe("Découverte");
    expect(DIFFICULTY_PRESETS[0]!.name).toBe("Découverte");
    expect(DIFFICULTES[1]).toBe("Découverte");
    expect(NIVEAUX_DES_EPISODES.find((n) => n.code === "decouverte")?.nom).toBe("Découverte");
    expect(lire("app/opengraph-image.tsx")).not.toMatch(/Découverte/);
    expect(lire("components/le-cours-en-bref.tsx")).not.toMatch(/Découverte/);
  });
});

describe("5. l'offre Classe dit ce qu'ouvre chaque combinaison", () => {
  it("les combinaisons couvrent toutes les entreprises et tous les niveaux", () => {
    const t = ateliersParCombinaison();
    expect(Object.keys(t)).toHaveLength(ENTREPRISES.length * NIVEAUX_DE_L_ARENE.length);
    // Exacts : niveau écrit ; adaptables : un niveau d'écart ; jamais un concours.
    for (const [cle, { exacts, adaptables }] of Object.entries(t)) {
      const niveau = Number(cle.split(":")[1]);
      for (const a of exacts) expect(a.niveau).toBe(niveau);
      for (const a of adaptables) expect(Math.abs(a.niveau - niveau)).toBe(1);
      for (const a of [...exacts, ...adaptables])
        expect(ATELIERS.find((x) => x.code === a.code)?.reglages.concours).toBeUndefined();
    }
  });

  it("le devis dit l'atelier du choix, ou qu'il n'y en a aucun et ce qui reste inclus", () => {
    const t = ateliersParCombinaison();
    const [avec] = Object.entries(t).find(([, v]) => v.exacts.length > 0)!;
    const [sans] = Object.entries(t).find(([, v]) => v.exacts.length + v.adaptables.length === 0)!;
    const rendu = (cle: string) => {
      const [entreprise, niveau] = cle.split(":") as [string, string];
      return texte(
        renderToStaticMarkup(
          createElement(DevisForm, {
            offres: [
              {
                code: "classe",
                offre: "Classe",
                organisation: "Établissement",
                exempleOrganisation: "",
                identifiant: "UAI",
                entreprise: true as const,
                niveau: true as const,
              },
            ],
            offreInitiale: "classe",
            entreprises: ENTREPRISES.map((e) => ({ code: e.code, nom: e.nom })),
            niveaux: NIVEAUX_DE_L_ARENE,
            vendeur: "V",
            mentionTva: "TVA",
            contact: "c@x.test",
            entrepriseInitiale: entreprise,
            niveauInitial: niveau,
            ateliers: t,
          }),
        ),
      );
    };
    const [e, n] = avec.split(":") as [string, string];
    expect(rendu(avec)).toContain(ateliersDeLaClasse(e, Number(n)).exacts[0]!.titre);
    expect(rendu(sans)).toContain("Aucun atelier clé en main n'est écrit pour cette entreprise à ce niveau");
    expect(rendu(sans)).toContain("le cours entier et les parties de l'arène");
    expect(lire("app/devis/page.tsx")).toMatch(/ateliers=\{ateliersParCombinaison\(\)\}/);
  });
});

describe("6. le laboratoire du cours, au clavier et au lecteur d'écran", () => {
  const guide = lire("components/cours/chapitre-guide.tsx");
  it("le levier à choix montre son focus sur le libellé", () => {
    const levier = guide.slice(guide.indexOf("data-levier-a-choix"), guide.indexOf('className="sr-only"'));
    expect(levier).toMatch(/has-\[:focus-visible\]:ring-2/);
  });
  it("le focus va au titre de chaque nouvelle étape", () => {
    expect(guide).toMatch(/ref=\{titreDeLEtape\}\s*tabIndex=\{-1\}/);
    expect(guide).toMatch(/titreDeLEtape\.current\?\.focus\(\)/);
  });
  it("aucune région vivante sur l'étape entière ; le résultat du laboratoire parle", () => {
    expect(guide).not.toMatch(/<section[^>]*aria-live/);
    expect(guide).toMatch(/role="status" data-resultat-du-laboratoire/);
  });
});

describe("7. les contrastes des jetons", () => {
  const luminance = (hex: string) => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
    const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * f(r!) + 0.7152 * f(g!) + 0.0722 * f(b!);
  };
  const contraste = (a: string, b: string) => {
    const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
    return (x! + 0.05) / (y! + 0.05);
  };
  const clair = lire("app/theme-clair.css");
  const papier = clair.slice(0, clair.indexOf('[data-theme="clair"] .contre-jour'));
  const nuit = clair.slice(clair.indexOf('[data-theme="clair"] .contre-jour'), clair.indexOf("@media print"));
  const jeton = (bloc: string, nom: string) => bloc.match(new RegExp(`${nom}:\\s*(#[0-9a-f]{6})`))![1]!;
  const FONDS_CLAIRS = ["#f5f7fb", "#ffffff", "#edf1f7", "#f0f2f4"];
  const FONDS_SOMBRES = ["#0b2545", "#13355f", "#1b416f"];

  it("slate-600 se lit à 4,5 pour 1 sur la page, la carte et le champ", () => {
    for (const f of FONDS_CLAIRS.slice(0, 3)) expect(contraste(jeton(papier, "--color-slate-600"), f), f).toBeGreaterThanOrEqual(4.5);
  });
  it("le filet interactif tient 3 pour 1, sur le papier et à contre-jour", () => {
    for (const f of FONDS_CLAIRS) expect(contraste(jeton(papier, "--filet-interactif"), f), f).toBeGreaterThanOrEqual(3);
    for (const f of FONDS_SOMBRES) expect(contraste(jeton(nuit, "--filet-interactif"), f), f).toBeGreaterThanOrEqual(3);
  });
  it("le bouton secondaire et le champ du laboratoire prennent ce filet", () => {
    const css = lire("app/globals.css");
    expect(css).toMatch(/\.bouton-filet:not\(:disabled\) \{\s*border-color: var\(--filet-interactif/);
    expect(css).toMatch(/\.papier \.champ \{[^}]*border-color: var\(--filet-interactif/);
    expect(css).not.toMatch(/border-color: #c3ccdb/);
  });
});
