import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { tousLesLiens } from "@/config/navigation";

vi.mock("next/navigation", () => ({ usePathname: () => "/tarifs" }));
// Le formulaire de devis tire son action, et l'action la base : on ne rend que l'écran.
vi.mock("@/db", () => ({ db: {} }));

import { PageDesTarifs } from "@/components/page-des-tarifs";
import {
  CATALOGUE_PAR_DEFAUT,
  CONDITIONS_DE_VENTE,
  descriptionDesTarifs,
  ligneDePrix,
  reponseCombien,
  FORMULE_EN_CLASSE,
  FORMULES_ENTREPRISES,
  MENTION_TVA,
  OFFRES_ENSEIGNEMENT,
  OPTIONS,
  PRIX,
  QUESTIONS_TARIFS,
  RESEAUX,
  SANS_LES_EPISODES,
  seuilCampusAvantageux,
  seuilProgrammeAvantageux,
  ARGUMENTS_POUR_LES_ECOLES,
  INTEGRATION_LMS,
  ENT_DU_SECONDAIRE,
  VARIABLES_PAR_DEFAUT,
  VARIABLES_DU_CATALOGUE,
} from "@/config/tarifs";
import { erreurDeMiseEnAvant, erreursDeLOffre, texteDuBandeau, vueDesTarifs } from "@/config/catalogue";
import { DevisForm } from "@/components/devis-form";
import { texteAccuseDevis } from "@/services/devis.service";
import { VENDEUR } from "@/config/editeur";
import GRILLE_FIGEE from "../fixtures/grille-d-octobre-2026.json";
import * as GRILLE from "@/config/tarifs";

/**
 * LA GRILLE TARIFAIRE A UNE SOURCE, ET LA PAGE LA LIT.
 *
 * Un prix écrit deux fois finit par en dire deux : c'est la leçon que le dépôt
 * a déjà payée sur le nombre de secteurs (`compte-des-secteurs.test.ts`).
 * Les prix vivent dans `config/tarifs.ts` ; la page `/tarifs` n'en écrit
 * aucun. La garde vérifie la grille validée par le propriétaire (Classe 290 €,
 * Programme 990 € et Campus 1 990 € par an, épisodes à part, tout sur devis), la
 * franchise de TVA (aucun « HT », « TTC » ni « TVA 20 % » ; la mention de l'art. 293 B
 * présente), qu'aucun texte ne parle d'un prix au mois ni d'un essai en classe, que
 * chaque offre mène à une demande de devis écrite, qu'il n'y a qu'un bouton plein,
 * celui de l'offre Programme, que les mentions comparatives se calculent sur les prix,
 * et que Moodle n'est pas annoncé comme disponible.
 *
 * DEPUIS LE CATALOGUE EN BASE (/admin/offres, migration 0041), la page lit le catalogue ;
 * sa valeur par défaut est la grille de config/tarifs.ts (`CATALOGUE_PAR_DEFAUT`), et la
 * garde la rend ici. Elle vérifie en plus que le catalogue par défaut tient ses règles
 * (une seule offre mise en avant, des prix positifs, aucune offre refusée par
 * `erreursDeLOffre`) et que son rendu est, texte pour texte, la grille figée avant la
 * migration (`tests/fixtures/grille-d-octobre-2026.json`) : /tarifs n'a pas bougé.
 */

const SRC = join(process.cwd(), "src");
const lire = (chemin: string) => readFileSync(join(SRC, chemin), "utf8");
/** Le code seul : les commentaires racontent la règle, et la citent. */
const code = (source: string) =>
  source
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");

function fichiers(racine: string): string[] {
  return readdirSync(racine).flatMap((e) => {
    const c = join(racine, e);
    return statSync(c).isDirectory() ? fichiers(c) : /\.tsx?$/.test(e) ? [c] : [];
  });
}

/**
 * DEUX RENDUS. La grille CHIFFRÉE (« Afficher les prix sur le site » allumé dans
 * /admin/offres) garde toutes les gardes d'avant : c'est le retour en arrière promis au
 * propriétaire, qui doit rester exact. La page PAR DÉFAUT (prix éteints, décision
 * d'octobre 2026 : « J'aimerais retirer les prix. Les offres se font sur mesure et
 * aboutissent à une demande de devis. ») ne montre AUCUN montant : voir plus bas.
 */
const HTML = renderToStaticMarkup(
  createElement(PageDesTarifs, {
    vue: vueDesTarifs(CATALOGUE_PAR_DEFAUT, VARIABLES_PAR_DEFAUT, { prix: true }),
    bandeau: null,
    prixPublics: true,
  }),
);
/** La description de /tarifs pour les moteurs, prix allumés. */
const metadata = { title: "Tarifs", description: descriptionDesTarifs(CATALOGUE_PAR_DEFAUT, true) };

/** La page par défaut : les prix éteints. */
const HTML_SANS_PRIX = renderToStaticMarkup(
  createElement(PageDesTarifs, {
    vue: vueDesTarifs(CATALOGUE_PAR_DEFAUT, VARIABLES_PAR_DEFAUT, { prix: false }),
    bandeau: "−20 % sur Programme jusqu'au 30 novembre avec le code RENTREE",
    prixPublics: false,
  }),
);
const TEXTE_SANS_PRIX = HTML_SANS_PRIX.replace(/<[^>]+>/g, " ")
  .replace(/&#x27;|&apos;/g, "'")
  .replace(/[\u00a0\u202f]/g, " ")
  .replace(/\s+/g, " ");
/** Un montant en euros, un prix annuel, ou l'un des prix de la grille. */
const UN_MONTANT = /\d[\d\s.,]*\s?(?:€|euros?\b)|€|par an\b|\b(?:290|490|990|1\s?990)\b/i;
/** Le texte rendu, balises retirées, espaces fines ramenées à l'espace. */
const TEXTE = HTML.replace(/<[^>]+>/g, " ")
  .replace(/&#x27;|&apos;/g, "'")
  .replace(/[  ]/g, " ")
  .replace(/\s+/g, " ");

describe("le catalogue par défaut", () => {
  it("rend, texte pour texte, la grille figée avant la migration du catalogue", () => {
    const figee = GRILLE_FIGEE as Record<string, unknown>;
    const lu = (k: string): unknown => {
      const v = (GRILLE as Record<string, unknown>)[k];
      if (k === "ceQuOuvrentLesEpisodes") return (v as (n: number) => string)(60);
      if (k === "messageNiveauxReserves") return (v as (x: unknown) => string)({ active: true, entrepriseOuverte: "", niveauMaxAutres: 3 });
      return v;
    };
    for (const k of Object.keys(figee)) expect(lu(k), k).toEqual(figee[k]);
  });

  it("une seule offre mise en avant, des prix positifs, aucune offre refusée par la règle", () => {
    expect(erreurDeMiseEnAvant(CATALOGUE_PAR_DEFAUT)).toBeNull();
    expect(CATALOGUE_PAR_DEFAUT.offres.filter((o) => o.miseEnAvant).map((o) => o.code)).toEqual(["programme"]);
    for (const o of CATALOGUE_PAR_DEFAUT.offres) {
      if (o.tarif === "prix") expect(o.prixCents, o.code).toBeGreaterThan(0);
      else expect(o.prixCents, o.code).toBeNull();
      expect(erreursDeLOffre(o, CATALOGUE_PAR_DEFAUT, VARIABLES_DU_CATALOGUE), o.code).toEqual([]);
    }
    // Deux mises en avant : la règle le voit.
    const deux = {
      ...CATALOGUE_PAR_DEFAUT,
      offres: CATALOGUE_PAR_DEFAUT.offres.map((o) => (o.code === "campus" ? { ...o, miseEnAvant: true } : o)),
    };
    expect(erreurDeMiseEnAvant(deux)).toMatch(/Une seule offre/);
  });

  it("aucun nombre tiré du produit n'est écrit dans un texte du catalogue : les variables le portent", () => {
    const textes = CATALOGUE_PAR_DEFAUT.offres.flatMap((o) => [
      o.nom,
      o.sousTitre,
      ...o.inclus,
      ...o.precisions,
      ...o.formules.flatMap((f) => [f.nom, ...f.inclus]),
    ]);
    // Le nombre d'entreprises, d'épisodes, d'ateliers, les niveaux du solo : jamais en dur.
    const nombres = [VARIABLES_PAR_DEFAUT.entreprises, VARIABLES_PAR_DEFAUT.episodes, VARIABLES_PAR_DEFAUT.ateliers];
    for (const t of textes) {
      for (const n of nombres) expect(t, t).not.toMatch(new RegExp(`(?<![\\d.])${n}(?![\\d.])`));
      expect(t, t).not.toMatch(/niveaux 1 à 3|1 à 6/);
    }
  });
});

describe("la grille tarifaire", () => {
  it("porte les prix validés : Classe 290 €, Programme 990 €, Campus 1 990 € par an, lus par les cartes", () => {
    expect(PRIX).toEqual({ classe: 290, programme: 990, campus: 1990 });
    const prix = Object.fromEntries(OFFRES_ENSEIGNEMENT.map((o) => [o.code, o.prix]));
    expect(prix).toEqual({ decouverte: undefined, ...PRIX });
    expect(OFFRES_ENSEIGNEMENT.map((o) => o.code)).toEqual(["decouverte", "classe", "programme", "campus"]);
  });

  it("les mentions comparatives se calculent sur les prix, strictement", () => {
    // Programme contre autant d'offres Classe (une par groupe).
    const n = seuilProgrammeAvantageux();
    expect(n).toBe(4);
    expect((n - 1) * PRIX.classe).toBeLessThanOrEqual(PRIX.programme);
    expect(n * PRIX.classe).toBeGreaterThan(PRIX.programme);
    expect(OFFRES_ENSEIGNEMENT.find((o) => o.code === "programme")!.mention).toBe(
      `Dès ${n} groupes, moins cher que ${n} offres Classe`,
    );
    // Campus contre autant d'offres Programme (une par entreprise) : deux Programmes
    // (1 980 €) coûtent encore moins qu'un Campus (1 990 €), d'où « dès 3 ».
    const m = seuilCampusAvantageux();
    expect(m).toBe(3);
    expect((m - 1) * PRIX.programme).toBeLessThanOrEqual(PRIX.campus);
    expect(m * PRIX.programme).toBeGreaterThan(PRIX.campus);
    expect(OFFRES_ENSEIGNEMENT.find((o) => o.code === "campus")!.mention).toBe(
      `Dès ${m} entreprises, moins cher que ${m} offres Programme`,
    );
  });

  it("la page affiche les prix par an et la mention de franchise de TVA, sans HT ni TTC", () => {
    for (const attendu of ["290 €", "990 €", "1 990 €", "par an", "Dès 4 groupes", "Dès 3 entreprises"]) {
      expect(TEXTE, attendu).toContain(attendu);
    }
    expect(MENTION_TVA).toBe("TVA non applicable, art. 293 B du CGI");
    expect(TEXTE).toContain(MENTION_TVA);
    expect(HTML).toContain("data-mention-tva");
    expect(CONDITIONS_DE_VENTE.some((c) => c.includes(MENTION_TVA))).toBe(true);
    expect(TEXTE).not.toMatch(/\bHT\b|\bTTC\b|TVA 20|588|1 188/);
    expect(TEXTE).not.toMatch(/le plus choisi/i);
    expect(metadata.title).toBe("Tarifs");
    const description = String(metadata.description).replace(/[\u202f\u00a0]/g, " ");
    expect(description).toContain("290 € par an");
    expect(description).toContain("1 990 € par an");
    expect(description).toContain(MENTION_TVA);
    expect(description).not.toMatch(/\bHT\b|\bTTC\b/);
  });

  it("aucun prix « HT » ou « TTC », ni « TVA 20 % » commerciale, dans src/", () => {
    // Le moteur et les contenus de jeu parlent de TVA, de créances TTC et de résultat HT :
    // c'est la comptabilité des entreprises simulées, pas un tarif. On cherche ici les
    // formes d'un PRIX : « 490 € HT », « HT / an », « HT par an », « € TTC », « TVA 20 % en sus ».
    const PRIX_TAXE = /€\s?(?:HT|TTC)\b|\bHT\s?\/\s?an\b|\bHT par an\b|TVA \$\{|TVA 20\s?% en sus|prixTTC|PRIX_HT/;
    // Les contenus de jeu (épisodes, scénarios, cours de comptabilité, moteur, pédagogie)
    // chiffrent les affaires des entreprises simulées, en HT comme dans la vraie vie : ils
    // sont hors du champ.
    const JEU = /^(?:config\/episodes|config\/scenarios|config\/cours|engine|pedagogy)\//;
    const fautifs = fichiers(SRC)
      .filter((f) => !JEU.test(f.slice(SRC.length + 1)))
      .filter((f) => PRIX_TAXE.test(code(readFileSync(f, "utf8"))))
      .map((f) => f.slice(SRC.length + 1));
    expect(fautifs, `prix taxés : ${fautifs.join(", ")}`).toEqual([]);
    // Et, dans les fichiers qui vendent, plus aucun « HT », « TTC » ni taux de TVA du tout.
    const QUI_VENDENT = [
      "config/tarifs.ts",
      "config/editeur.ts",
      "app/tarifs/page.tsx",
      "components/page-des-tarifs.tsx",
      "components/carte-d-offre.tsx",
      // config/catalogue.ts porte la règle qui REFUSE ces mots dans une offre
      // (`erreursDeLOffre`) : il les nomme, il est donc hors de cette liste.
      "services/catalogue.service.ts",
      "services/vente.service.ts",
      "components/formulaire-de-licence.tsx",
      "components/editeur-d-offre.tsx",
      "app/admin/offres/page.tsx",
      "app/devis/page.tsx",
      "app/devis/actions.ts",
      "components/devis-form.tsx",
      "services/devis.service.ts",
      "app/admin/page.tsx",
    ];
    for (const f of QUI_VENDENT) {
      expect(code(lire(f)), f).not.toMatch(/\bHT\b|\bTTC\b|TVA 20/);
    }
  });

  it("les prix n'ont qu'une source : ni la page ni aucun autre fichier ne les écrit", () => {
    const page = code(lire("app/tarifs/page.tsx"));
    // La page lit le catalogue (en base, en cache), et ne rend rien d'elle-même.
    expect(page).toContain('from "@/services/catalogue.service"');
    expect(page).toContain("lireLEtatDuCatalogue");
    for (const f of ["app/tarifs/page.tsx", "components/page-des-tarifs.tsx", "components/carte-d-offre.tsx"]) {
      const c = code(lire(f));
      expect(c, `un prix écrit dans ${f}`).not.toMatch(/\b(?:290|490|990|1\s?990)\b/);
      expect(c, `un symbole euro écrit dans ${f}`).not.toContain("€");
    }
    // Les pages et les composants : ce que lit un visiteur. (Les épisodes ont
    // leurs propres montants, qui n'ont rien d'un tarif.)
    const ailleurs = [...fichiers(join(SRC, "app")), ...fichiers(join(SRC, "components"))]
      .filter((f) => /\b(?:290|490|990)\s?(?:€|euros)/.test(code(readFileSync(f, "utf8"))))
      .map((f) => f.slice(SRC.length + 1));
    expect(ailleurs, `prix recopiés hors de config/tarifs.ts : ${ailleurs.join(", ")}`).toEqual([]);
  });

  it("aucune mention d'un prix au mois ni d'un essai en classe", () => {
    const textes = [
      TEXTE,
      String(metadata.description),
      RESEAUX.texte,
      ...OFFRES_ENSEIGNEMENT.flatMap((o) => [o.nom, o.pourQui, o.mention ?? "", ...o.inclus, ...o.precisions]),
      FORMULE_EN_CLASSE.nom,
      ...FORMULE_EN_CLASSE.inclus,
      ...FORMULES_ENTREPRISES.flatMap((f) => [f.nom, ...f.inclus]),
      ...OPTIONS.map((o) => o.nom),
      ...CONDITIONS_DE_VENTE,
      ...QUESTIONS_TARIFS.flatMap((x) => [x.q, x.r]),
    ];
    for (const t of textes) {
      expect(t, t).not.toMatch(/mensuel|par mois|\/\s?mois|essai en classe/i);
    }
  });

  it("les offres de l'arène disent qu'elles n'incluent pas les épisodes manager", () => {
    for (const code of ["classe", "programme", "campus"] as const) {
      const o = OFFRES_ENSEIGNEMENT.find((x) => x.code === code)!;
      expect(o.precisions, code).toContain(SANS_LES_EPISODES);
    }
    expect(TEXTE).toContain("Épisodes manager");
    expect(TEXTE).toContain("Sur devis");
  });

  it("chaque offre mène à une demande de devis écrite, l'offre pré-remplie ; un seul bouton plein, sur Programme", () => {
    expect(OFFRES_ENSEIGNEMENT.filter((o) => o.bouton.principal).map((o) => o.code)).toEqual(["programme"]);
    expect(HTML.match(/\bbouton-plein\b/g) ?? []).toHaveLength(1);
    const plein = HTML.match(/<a[^>]*class="[^"]*\bbouton-plein\b[^"]*"[^>]*>([^<]*)<\/a>/);
    expect(plein?.[1]).toBe("Demander un devis");
    expect(plein?.[0]).toContain('href="/devis?offre=programme"');
    expect(HTML.match(/\bbouton-filet\b/g)?.length).toBeGreaterThanOrEqual(4);
    const libelles = [...HTML.matchAll(/<(?:a|button)\b[^>]*>([\s\S]*?)<\/(?:a|button)>/g)].map((m) =>
      m[1]!.replace(/<[^>]+>/g, "").trim(),
    );
    expect(libelles.length).toBeGreaterThan(4);
    for (const l of libelles) {
      expect(l, "un bouton qui encaisse ou commande").not.toMatch(/pa(?:y|ie)|régler|acheter|commander/i);
    }
    const cibles = [...HTML.matchAll(/<a[^>]*href="([^"]+)"/g)].map((m) => m[1]!.replace(/&amp;/g, "&"));
    expect(new Set(cibles)).toEqual(
      new Set([
        "/jouer",
        "/devis?offre=classe",
        "/devis?offre=programme",
        "/devis?offre=campus",
        "/devis?offre=reseau",
        "/devis?offre=episodes",
        "/devis?offre=entreprise",
        "/rendez-vous",
        "/integration",
        "/orientation",
        // Le pied de page déroule tout le plan du site, sauf la page où l'on est.
        ...tousLesLiens().map((l) => l.href).filter((h) => h !== "/tarifs"),
      ]),
    );
    expect(TEXTE).toContain("Tester le simulateur");
    expect(TEXTE).not.toContain("Commander");
    expect(TEXTE).not.toMatch(/carte bancaire/i);
  });

  it("dit qui établit les devis et les factures, et l'adresse de contact en texte", () => {
    expect(TEXTE).toContain(VENDEUR.nom);
    expect(CONDITIONS_DE_VENTE.some((c) => c.includes(VENDEUR.nom))).toBe(true);
    expect(HTML).toMatch(new RegExp(`select-all[^>]*>${VENDEUR.contact.replace(/\./g, "\\.")}<`));
  });

  it("parle aux écoles comme aux lycées ; l'intégration LTI 1.3 incluse avec son lien, le GAR à l'étude", () => {
    expect(TEXTE).toContain("L'arène, pour l'enseignement : lycées, BTS, écoles de commerce, universités");
    expect(TEXTE).toContain("étudiant");
    expect(TEXTE).toContain("intervenants");
    for (const a of ARGUMENTS_POUR_LES_ECOLES) expect(TEXTE, a.titre).toContain(a.titre);
    expect(TEXTE).toContain("Intégration à Moodle, Canvas, Blackboard, Brightspace (LTI 1.3) : incluse");
    expect(TEXTE).toContain("ENT du secondaire (GAR) : à l'étude");
    expect(INTEGRATION_LMS.lien.href).toBe("/integration");
    expect(ENT_DU_SECONDAIRE.etat).toBe("À l'étude");
    expect(TEXTE).not.toMatch(/bientôt disponible/i);
    // Le relevé n'est pas « par compétence » : la page ne le prétend pas.
    expect(TEXTE).not.toMatch(/relevé par compétences?/i);
    // « Entre campus » seulement sur devis : les concours ne le font pas d'eux-mêmes.
    expect(TEXTE).toMatch(/Entre plusieurs écoles ou campus : sur devis/);
  });

  it("le lieu d'hébergement n'est pas écrit (il n'est pas confirmé)", () => {
    expect(TEXTE).not.toMatch(/héberg|Francfort|Union européenne/i);
  });
});

describe("les prix éteints (par défaut) : des offres sur mesure, aucun montant sur les pages publiques", () => {
  it("la page /tarifs rendue ne porte aucun montant, ni mention calculée sur les prix ; chaque offre mène au devis", () => {
    expect(TEXTE_SANS_PRIX, TEXTE_SANS_PRIX.match(UN_MONTANT)?.[0]).not.toMatch(UN_MONTANT);
    expect(TEXTE_SANS_PRIX).not.toMatch(/Dès \d+ (?:groupes|entreprises)|moins cher|plus avantageux/);
    expect(TEXTE_SANS_PRIX).toContain("Construisons votre offre");
    expect(TEXTE_SANS_PRIX).toContain("Sur devis");
    expect(TEXTE_SANS_PRIX).toContain("Gratuit");
    // Un seul bouton plein, celui de l'offre mise en avant ; un devis par offre.
    expect(HTML_SANS_PRIX.match(/\bbouton-plein\b/g) ?? []).toHaveLength(1);
    for (const code of ["classe", "programme", "campus", "reseau", "episodes", "entreprise"]) {
      expect(HTML_SANS_PRIX).toContain(`href="/devis?offre=${code}"`);
    }
    // Le bandeau garde un pourcentage, jamais un montant.
    expect(TEXTE_SANS_PRIX).toContain("−20 % sur Programme");
  });

  it("la vue publique ne reçoit aucun montant : prix, mention calculée, option, bande des épisodes", () => {
    const vue = vueDesTarifs(CATALOGUE_PAR_DEFAUT, VARIABLES_PAR_DEFAUT, { prix: false });
    expect(vue.cartes.map((c) => c.prixCents)).toEqual(vue.cartes.map(() => null));
    expect(vue.cartes.map((c) => c.mention)).toEqual(vue.cartes.map(() => null));
    expect(JSON.stringify(vue), JSON.stringify(vue).match(UN_MONTANT)?.[0]).not.toMatch(UN_MONTANT);
    // Et la grille chiffrée, elle, porte bien les prix (le retour en arrière reste exact).
    expect(vueDesTarifs(CATALOGUE_PAR_DEFAUT, VARIABLES_PAR_DEFAUT).cartes.map((c) => c.prixCents)).toEqual([
      null,
      PRIX.classe * 100,
      PRIX.programme * 100,
      PRIX.campus * 100,
    ]);
  });

  it("les phrases tirées de la grille (bandes, guide, métadonnées, bandeau en euros) n'ont aucun montant", () => {
    for (const t of [
      ligneDePrix(CATALOGUE_PAR_DEFAUT, false),
      reponseCombien(CATALOGUE_PAR_DEFAUT, false),
      descriptionDesTarifs(CATALOGUE_PAR_DEFAUT, false),
    ]) {
      expect(t, t).not.toMatch(UN_MONTANT);
      expect(t).toMatch(/sur mesure/);
    }
    const promo = {
      id: "x",
      code: "FIDELE",
      typeRemise: "montant" as const,
      valeur: 15000,
      offres: null,
      debut: null,
      fin: new Date("2026-12-01T00:00:00+01:00"),
      utilisationsMax: null,
      utilisations: 0,
      unParEtablissement: true,
      actif: true,
      affiche: true,
    };
    expect(texteDuBandeau(promo, (c) => c, false)).toBe("Une remise sur toutes les offres jusqu'au 30 novembre avec le code FIDELE");
    expect(texteDuBandeau(promo, (c) => c, true)).toMatch(/^−150\s€/);
  });

  it("la confirmation du devis et l'accusé au demandeur disent le code sans montant", () => {
    const html = renderToStaticMarkup(
      createElement(DevisForm, {
        offres: [{ code: "programme", offre: "Offre Programme", organisation: "École", exempleOrganisation: "", identifiant: "UAI" }],
        offreInitiale: "programme",
        entreprises: [],
        niveaux: [],
        vendeur: VENDEUR.nom,
        mentionTva: MENTION_TVA,
        contact: VENDEUR.contact,
        initial: {
          error: null,
          values: null,
          ok: {
            email: "a@b.test",
            offre: "programme",
            accuseEnvoye: true,
            promo: { code: "RENTREE", montants: false, prixCatalogueCents: null, remiseCents: null, remiseLibelle: "", prixRemiseCents: null },
          },
        },
      }),
    ).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
    expect(html).toContain("Code RENTREE pris en compte : la remise sera appliquée à votre devis.");
    expect(html.replace(MENTION_TVA, "")).not.toMatch(UN_MONTANT);
    const accuse = texteAccuseDevis(
      {
        offre: "programme",
        libelles: { offre: "Offre Programme", organisation: "École", exempleOrganisation: "", identifiant: "UAI" },
        nom: "Claire",
        fonction: "Directrice",
        organisation: "École",
        identifiant: "",
        effectif: null,
        email: "a@b.test",
        message: "",
        ip: null,
        promo: { id: "x", code: "RENTREE", cle: null, devis: { prixCatalogueCents: 99000, remiseCents: 19800, remiseLibelle: "−20 %", prixRemiseCents: 79200 } },
        montantsPublics: false,
      },
      VENDEUR.contact,
    ).texte;
    expect(accuse).toContain("Code promo RENTREE pris en compte");
    expect(accuse, accuse.match(UN_MONTANT)?.[0]).not.toMatch(UN_MONTANT);
  });
});
