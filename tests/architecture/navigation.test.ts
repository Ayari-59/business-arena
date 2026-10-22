import { existsSync, readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  ACTION_PRINCIPALE,
  LIBELLE_QUITTER_LA_PARTIE,
  LIEN_ADMINISTRATION,
  LIEN_ESPACE_ENSEIGNANT,
  LIEN_ETABLISSEMENT,
  LIEN_REGLES,
  NAVIGATION,
  NAVIGATION_ADMIN,
  NAVIGATION_ARENE,
  NAVIGATION_ENSEIGNANT,
  NAVIGATION_ETUDIANT,
  liensDAcces,
  liensDeTete,
  tousLesLiens,
  type Pastille,
} from "../../src/config/navigation";

/**
 * LE PLAN DU SITE NE SE RECOPIE PAS, ET IL PARLE D'UNE SEULE VOIX.
 *
 * Deux défauts d'une même origine : le menu masquait ses huit liens en dessous
 * de la barre des petits écrans sans rien mettre à la place, et le pied de page
 * d'accueil tenait sa propre liste, où la page qui aide à choisir sa simulation
 * n'était jamais entrée. Puis trois menus ont poussé (le site, l'espace
 * enseignant, l'arène), chacun avec ses mots : « Guide » et « Guides » côte à
 * côte, « Championship » dans un plan français, quatre pages publiques que rien
 * ne menait (/integration, /reprendre, /examen, /profile).
 *
 * Une liste écrite deux fois diverge toujours. Ces gardes vérifient donc que le
 * registre ne mène nulle part de faux, que chaque page y a un seul nom, que la
 * barre et le menu portent les mêmes titres, que tout le sitemap est à portée,
 * et que la barre, le menu, le pied de page, l'espace enseignant,
 * l'administration et l'arène LISENT le plan au lieu de le redire.
 */

const lire = (chemin: string) => readFileSync(chemin, "utf8");

/**
 * Les pages publiques du sitemap, lues dans sa source : le module lui-même
 * ouvre la base (les concours publiés), ce qu'une garde d'architecture n'a
 * pas à faire.
 */
const PAGES_PUBLIQUES: string[] = (() => {
  const bloc = lire("src/app/sitemap.ts").match(/export const PAGES_PUBLIQUES = \[([\s\S]*?)\] as const;/);
  if (!bloc) throw new Error("sitemap.ts : PAGES_PUBLIQUES introuvable");
  return [...bloc[1]!.matchAll(/"([^"]+)"/g)].map((m) => m[1]!);
})();

/**
 * L'adresse d'un lien, ramenée au fichier de route qui doit exister. Une ancre
 * (/ecoles#evaluer) mène à la même page : le fichier de route est celui du
 * chemin, sans le fragment. Un segment peut être pris par une route dynamique
 * (/guides/etudiant est servi par /guides/[public]).
 */
function routeDe(href: string): string {
  const chemin = href.split("#")[0]!;
  let dossier = "src/app";
  for (const segment of chemin.split("/").filter(Boolean)) {
    const exact = `${dossier}/${segment}`;
    if (existsSync(exact)) {
      dossier = exact;
      continue;
    }
    const dynamique = existsSync(dossier) ? readdirSync(dossier).find((d) => /^\[.+\]$/.test(d)) : undefined;
    dossier = `${dossier}/${dynamique ?? segment}`;
  }
  return `${dossier}/page.tsx`;
}

/** Tous les liens des espaces sous compte et de l'arène, avec leur source. */
const PASTILLES: [string, readonly Pastille[]][] = [
  ["l'espace enseignant", NAVIGATION_ENSEIGNANT],
  ["l'administration", NAVIGATION_ADMIN],
  ["l'étudiant connecté par son établissement", NAVIGATION_ETUDIANT],
  ["les sorties des espaces", [LIEN_ETABLISSEMENT, LIEN_ADMINISTRATION, LIEN_ESPACE_ENSEIGNANT]],
];

/**
 * Des mots d'une autre langue, ou du jargon, qu'un plan français ne porte pas.
 * « manager » et « RENATER » sont les mots du métier et d'un service, pas de
 * l'anglais de menu.
 */
const ANGLAIS = /\b(?:Championship|Landing|Dashboard|Login|Logout|Home|Teacher|Student|Settings|Help|Pricing|Features|Sign ?in|Deploy|Déploiement)\b/i;

describe("plan du site", () => {
  it("chaque lien mène à une page qui existe, ancre comprise", () => {
    // Le défaut le plus bête et le plus visible : une entrée de menu qui rend
    // une erreur. Elle ne se voit qu'en cliquant, donc jamais en développant.
    const liens = [
      ...tousLesLiens(),
      ...NAVIGATION_ARENE,
      ...PASTILLES.flatMap(([, p]) => p),
    ];
    const morts = liens.map((l) => ({ ...l, route: routeDe(l.href) })).filter((l) => !existsSync(l.route));
    expect(morts, `liens sans page :\n${morts.map((l) => `${l.href} → ${l.route}`).join("\n")}`).toEqual([]);
    // Une ancre vise une section qui existe dans la page, sous cet identifiant.
    for (const l of liens.filter((l) => l.href.includes("#"))) {
      const ancre = l.href.split("#")[1]!;
      expect(lire(routeDe(l.href)), `${l.href} : la page n'a pas de section #${ancre}`).toMatch(
        new RegExp(`id="${ancre}"`),
      );
    }
  });

  it("aucune adresse n'est portée deux fois, et une page n'a qu'un seul nom", () => {
    const adresses = tousLesLiens().map((l) => l.href);
    expect(adresses.length, "plan vide").toBeGreaterThan(5);
    expect([...new Set(adresses)].sort()).toEqual([...adresses].sort());
    // Les mêmes mots partout : la page des fiches s'appelle « Fiches notions »
    // dans le menu, dans le pied de page et dans l'arène, jamais autrement.
    // Une ancre est une section, qui a son propre nom (« Examen individuel »
    // vise /ecoles#evaluer, « Présentation » la page entière).
    const noms = new Map<string, Set<string>>();
    for (const l of [...tousLesLiens(), ...NAVIGATION_ARENE, ...NAVIGATION_ETUDIANT]) {
      noms.set(l.href, (noms.get(l.href) ?? new Set()).add(l.libelle));
    }
    const doubles = [...noms].filter(([, n]) => n.size > 1).map(([p, n]) => `${p} : ${[...n].join(" / ")}`);
    expect(doubles, `une page, plusieurs noms :\n${doubles.join("\n")}`).toEqual([]);
  });

  it("chaque entrée dit ce qu'on y trouve", () => {
    // « Parcours », « Guide » et « Notions » ne se distinguent pas pour qui
    // découvre le site : sans la phrase d'aide, on ouvre les trois.
    for (const lien of tousLesLiens()) {
      expect(lien.libelle.trim().length, `${lien.href} : libellé vide`).toBeGreaterThan(2);
      expect(lien.aide.trim().length, `${lien.href} : aide trop courte`).toBeGreaterThan(40);
    }
    for (const groupe of NAVIGATION) {
      expect(groupe.liens.length, `groupe « ${groupe.titre} » vide`).toBeGreaterThan(0);
    }
  });

  it("parle français : un mot par public, pas d'anglais ni de jargon", () => {
    const mots = [
      ...NAVIGATION.flatMap((g) => [g.titre, g.precision ?? "", ...g.liens.map((l) => l.libelle)]),
      ...NAVIGATION_ARENE.map((l) => l.libelle),
      ...PASTILLES.flatMap(([, p]) => p.map((x) => x.libelle)),
      LIBELLE_QUITTER_LA_PARTIE,
    ];
    const fautes = mots.filter((m) => ANGLAIS.test(m));
    expect(fautes, `des mots d'une autre langue dans le plan : ${fautes.join(", ")}`).toEqual([]);
    // Un mot par public, dans le titre des groupes : la précision va à côté.
    for (const g of NAVIGATION) expect(g.titre.split(/\s+/), `« ${g.titre} » n'est pas un mot`).toHaveLength(1);
    // « Guide » au singulier ne désigne plus que les règles du jeu, sous leur nom.
    expect(mots).not.toContain("Guide");
    expect(LIEN_REGLES).toMatchObject({ href: "/guide", libelle: "Règles du jeu" });
    expect(lire("src/app/guide/page.tsx")).toMatch(/title: "Règles du jeu"/);
  });

  it("la barre et le menu portent les mêmes titres", () => {
    // Un visiteur qui lit « Enseignants » dans la barre ouvre, dans le menu, le
    // groupe « Enseignants » : la rangée à plat est la liste des groupes qui ont
    // une entrée, sous leur titre, dans leur ordre.
    const groupesDEntree = NAVIGATION.filter((g) => g.entree);
    expect(liensDeTete().map((l) => l.libelle)).toEqual(groupesDEntree.map((g) => g.titre));
    expect(liensDeTete().map((l) => l.href)).toEqual(groupesDEntree.map((g) => g.entree));
    // L'entrée d'un groupe est une page DU groupe (sa présentation).
    for (const g of groupesDEntree) {
      expect(g.liens.map((l) => l.href), `« ${g.titre} » : l'entrée ${g.entree} n'est pas dans le groupe`).toContain(g.entree);
    }
    // Tous les groupes sauf « Jouer » sont dans la barre : ses portes sont les boutons.
    expect(NAVIGATION.filter((g) => !g.entree).map((g) => g.code)).toEqual(["jouer"]);
  });

  it("la barre ne remet pas tout le plan à plat", () => {
    // C'est l'encombrement d'origine : une rangée qui affiche tout n'affiche
    // plus rien. Les ancres hors du menu restent une minorité, et l'entrée
    // principale n'en fait pas partie puisqu'elle est tenue à part.
    const total = NAVIGATION.flatMap((g) => g.liens).length;
    expect(liensDeTete().length).toBeGreaterThan(0);
    expect(liensDeTete().length + liensDAcces().length).toBeLessThan(total / 2 + 1);
    expect(liensDeTete().some((l) => l.href === ACTION_PRINCIPALE.href)).toBe(false);
    // Une porte d'entrée par public, et un lien n'est pas à la fois à plat et
    // en bouton.
    expect(liensDAcces().map((l) => l.acces).sort()).toEqual(["eleve", "enseignant"]);
    expect(liensDAcces().some((l) => liensDeTete().some((t) => t.href === l.href))).toBe(false);
  });

  it("toute page publique du sitemap est dans le plan, à deux clics au plus", () => {
    // Le sitemap dit ce que le site montre aux moteurs ; le plan, ce qu'il
    // montre aux visiteurs. Une page dans l'un et pas dans l'autre est une page
    // qu'on trouve par Google et jamais depuis le site : c'était le cas de
    // /integration, /reprendre, /examen et /profile.
    //
    // Deux exceptions, et pourquoi : l'accueil (le logo de la barre y mène, sur
    // toutes les pages) et le devis (/devis), qui est l'action de la page des
    // offres et non une page à lire. Les pages par code (ateliers, guides,
    // concours) sont les enfants d'une page du plan : un clic de plus.
    const EXCEPTIONS: Record<string, string> = {
      "/": "le logo de la barre",
      "/devis": "l'action de la page des offres (/tarifs)",
    };
    const pages = tousLesLiens().map((l) => l.href.split("#")[0]!);
    const absentes = PAGES_PUBLIQUES.filter((p) => !pages.includes(p) && !(p in EXCEPTIONS));
    expect(absentes, `pages du sitemap introuvables depuis le plan : ${absentes.join(", ")}`).toEqual([]);
    for (const p of Object.keys(EXCEPTIONS)) expect(PAGES_PUBLIQUES).toContain(p);
  });

  it("le menu, le pied de page, les espaces et l'arène lisent le registre au lieu de l'écrire", () => {
    // La garde qui empêche le défaut de revenir : tant que les adresses ne
    // sont pas écrites dans ces blocs, elles ne peuvent pas s'y désaccorder.
    // Les pages gardent le droit de renvoyer vers une page depuis leur CORPS,
    // ce qui est un lien éditorial et non une copie du plan.
    const BLOCS: [string, string, string][] = [
      ["le menu", "src/components/site-header.tsx", "@/config/navigation"],
      ["le pied de page", "src/components/pied-de-page.tsx", "@/config/navigation"],
      ["l'en-tête enseignant", "src/components/en-tete-enseignant.tsx", "NAVIGATION_ENSEIGNANT"],
      ["l'en-tête de l'administration", "src/components/en-tete-admin.tsx", "NAVIGATION_ADMIN"],
      ["le menu de l'arène", "src/components/menu-de-l-arene.tsx", "NAVIGATION_ARENE"],
    ];
    const liens = [...tousLesLiens(), ...NAVIGATION_ARENE, ...PASTILLES.flatMap(([, p]) => p)];
    for (const [nom, fichier, lecture] of BLOCS) {
      const bloc = lire(fichier);
      expect(bloc, `${nom} n'importe pas le plan`).toContain(lecture);
      for (const lien of liens) {
        expect(bloc, `${nom} recopie l'adresse « ${lien.href} »`).not.toContain(`href="${lien.href}"`);
        expect(bloc, `${nom} recopie le libellé « ${lien.libelle} »`).not.toContain(`>${lien.libelle}<`);
      }
    }
    // Les trois espaces et l'arène passent par le composant partagé des pastilles,
    // ou par le menu de l'arène : pas de rangée de liens écrite dans la page.
    for (const fichier of [
      "src/components/en-tete-enseignant.tsx",
      "src/components/en-tete-admin.tsx",
      "src/app/org/page.tsx",
      "src/app/etablissement/parties/page.tsx",
    ]) {
      expect(lire(fichier), `${fichier} ne pose pas les pastilles partagées`).toContain("<PastillesDeNavigation");
    }
    for (const fichier of ["src/components/barre-de-jeu.tsx", "src/app/arena/[gameId]/page.tsx"]) {
      expect(lire(fichier), `${fichier} ne pose pas le menu de l'arène`).toContain("<MenuDeLArene");
    }
    for (const fichier of [
      "src/app/admin/page.tsx",
      "src/app/admin/inscrits/page.tsx",
      "src/app/admin/offres/page.tsx",
      "src/app/admin/cohortes/page.tsx",
      "src/app/admin/lti/page.tsx",
      "src/app/admin/renater/page.tsx",
      "src/app/admin/theme/page.tsx",
    ]) {
      expect(lire(fichier), `${fichier} n'a pas l'en-tête de l'administration`).toContain("<EnTeteAdmin");
      expect(lire(fichier), `${fichier} garde un « ← Plateforme »`).not.toContain("← Plateforme");
    }
  });

  it("les pastilles des espaces sont dans l'ordre d'usage, et la page courante se marque", () => {
    expect(NAVIGATION_ENSEIGNANT.map((p) => p.libelle)).toEqual([
      "Mes parties",
      "Mes examens",
      "Mes cohortes",
      "Mes classes du cours",
      "Mes scénarios",
      "Carnet d'usage",
      "Aide",
    ]);
    expect(NAVIGATION_ENSEIGNANT.find((p) => p.code === "aide")?.href).toBe("/guides/enseignant");
    expect(NAVIGATION_ADMIN.map((p) => p.libelle)).toEqual([
      "Plateforme",
      "Inscrits",
      "Offres",
      "Cohortes",
      "Moodle",
      "RENATER",
      "Thème",
    ]);
    // Un code par pastille, dans chaque rangée : c'est lui que `aria-current` compare.
    for (const [nom, p] of PASTILLES) {
      expect(new Set(p.map((x) => x.code)).size, `${nom} : deux pastilles de même code`).toBe(p.length);
    }
    const pastilles = lire("src/components/pastilles-de-navigation.tsx");
    expect(pastilles).toContain('aria-current={p.code === actif ? "page" : undefined}');
    expect(pastilles, "44 px au doigt").toContain("pointer-coarse:min-h-11");
    expect(pastilles, "une position se dit en gris, jamais en orange").not.toMatch(/amber/);
  });

  it("l'arène cite les pages publiques sous leur nom du plan, et ferme sur « Quitter la partie »", () => {
    expect(NAVIGATION_ARENE.map((l) => l.libelle)).toEqual(["Guide de l'étudiant", "Fiches notions", "Mon profil"]);
    const menu = lire("src/components/menu-de-l-arene.tsx");
    expect(menu).toContain("LIBELLE_QUITTER_LA_PARTIE");
    expect(menu, "le lien vers le guide de l'étudiant garde sa prise (tests/e2e/guides.e2e.ts)").toContain(
      "data-lien-guide-etudiant",
    );
  });
});
