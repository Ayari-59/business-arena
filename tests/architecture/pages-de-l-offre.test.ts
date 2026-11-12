import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement, type ComponentType } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/lycees",
  useRouter: () => ({ push: () => undefined, replace: () => undefined, refresh: () => undefined, prefetch: () => undefined }),
  useSearchParams: () => new URLSearchParams(),
}));
// Les formulaires tirent leur action, et l'action la base : on ne rend que l'écran.
vi.mock("@/db", () => ({ db: {} }));

import {
  CATALOGUE_PAR_DEFAUT,
  ELEVES_PAR_CLASSE,
  ENTREPRISES,
  EPISODE_FERME_POUR_L_ELEVE,
  LE_COURS_PAR_OFFRE,
  LES_OFFRES_DE_L_ARENE,
  MENTION_TVA,
  PARAMETRAGE_DES_OFFRES,
  QUESTIONS_TARIFS,
  VARIABLES_PAR_DEFAUT,
  libellesDuDevisDe,
  parametrageRequisAuDevis,
  questionsDesTarifs,
  variablesDuCatalogue,
} from "@/config/tarifs";
import { offresDuDevis, parametresAreneDe, remplir, vueDesTarifs } from "@/config/catalogue";
import { CHAPITRE_LIBRE_DU_DIPLOME, DIPLOMES_PROPOSES, essaiDuDiplome } from "@/config/cours/chapitres-libres";
import { chapitreOuvertALaClasse, libereALaClasse } from "@/services/chapitres-de-la-classe";
import { NAVIGATION, NAVIGATION_ENSEIGNANT } from "@/config/navigation";
import { SUR_MESURE } from "@/config/sur-mesure";
import { PUBLIC_DES_EPISODES } from "@/config/episodes/public-des-episodes";
import { VENDEUR } from "@/config/editeur";
import { PageDesTarifs } from "@/components/page-des-tarifs";
import { DevisForm } from "@/components/devis-form";
import { BandeOuverture } from "@/components/bande-ouverture";
import { texteAccuseDevis } from "@/services/devis.service";

/**
 * LES PAGES DE L'OFFRE (chantier 3 des corrections de l'audit du 11 novembre 2026 ; décisions du
 * propriétaire). Ce que la garde tient, point par point :
 *  1. l'essai avec un groupe : « oui pour le cours » quand l'essai de l'arène est éteint, et chaque
 *     mot vrai dans le code (le compte enseignant, la classe sans offre, le chapitre libre et son cas) ;
 *  2. la page Lycées (/lycees) : le bac STMG et les BTS, les offres comme le code les applique, le
 *     chapitre libre de chaque diplôme lu dans la liste, la commande publique, aucun compte élève, et
 *     aucun lien vers le devis des épisodes ; son entrée au menu, au plan du site, ses métadonnées ;
 *  3. la page des entreprises : le déroulé (le parcours de 8 semaines des écoles, lu au même endroit),
 *     l'espace des animateurs, ce qui distingue vraiment les formules, rien sur le financement ;
 *  4. après le devis : les délais, à l'écran de confirmation, dans l'accusé et dans les CGV ; la fiche
 *     fournisseur lue dans `VENDEUR`, sur la page du devis et dans les CGV ;
 *  5. les points secondaires : le devis du sur-mesure, l'examen sur /ecoles, le supérieur en tête des
 *     épisodes, « Offres » là où aucun prix ne s'affiche, la certification qu'on ne laisse plus croire,
 *     /etablissement ;
 *  6. les portes : /ecoles, /integration, l'épisode payant fermé, /entreprises ;
 *  7. les formulaires (l'inscription enseignant, la cohorte refusée : tests/integration/pages-de-l-offre.test.ts) ;
 *  8. la fin de la licence épisodes, pour l'enseignant et pour l'élève ;
 *  9. /join, qui parle de tous les codes.
 */

const lire = (chemin: string) => readFileSync(join(process.cwd(), chemin), "utf8");
/** Le code sans ses commentaires : une phrase qui cite la règle ne compte pas. */
const code = (chemin: string) =>
  lire(chemin)
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/^\s*\/\/.*$/gm, "");
/** Le texte tel qu'on le lit : apostrophes rendues, insécables ramenées à l'espace, blancs réduits. */
const plat = (s: string) =>
  s
    .replace(/&apos;|&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/[  ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
/** Le texte d'un rendu HTML. */
const texteDe = (html: string) => plat(html.replace(/<[^>]+>/g, " "));
/** Les adresses des liens d'un rendu HTML. */
const liensDe = (html: string) => [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1]!.replace(/&amp;/g, "&"));

/** Une page ou un composant sans état, rendu en HTML statique. */
const rendre = (c: ComponentType<Record<string, unknown>>, props: Record<string, unknown> = {}) =>
  renderToStaticMarkup(createElement(c, props));

/** Les diplômes du lycée : le bac STMG et les BTS (les options comptent pour leur diplôme). */
const DU_LYCEE = DIPLOMES_PROPOSES.filter((f) => f.code === "stmg" || f.code.startsWith("bts-"));

const reponseALEssai = (essai: { autorise: boolean; dureeMaxJours: number }, inscriptionLibre?: boolean) =>
  questionsDesTarifs(essai, inscriptionLibre).find((x) => /essayer avec un groupe/.test(x.q))!.r;

describe("1 · l'essai avec un groupe : oui pour le cours", () => {
  it("l'essai de l'arène éteint (le défaut), la réponse dit oui pour le cours, et ce qui s'y fait", () => {
    const r = plat(reponseALEssai({ autorise: false, dureeMaxJours: 30 }));
    expect(r).toMatch(/^Oui, pour le cours/);
    expect(r).toContain("créez votre compte enseignant, puis une classe");
    expect(r).toContain("vos élèves y suivent le chapitre libre de leur diplôme et son cas pratique, sans offre");
    expect(r).toContain(`Les parties de classe de l'arène commencent avec ${LES_OFFRES_DE_L_ARENE}.`);
    expect(r).not.toMatch(/^Non/);
    // La grille des questions par défaut dit la même chose que la page.
    expect(QUESTIONS_TARIFS.find((x) => /essayer avec un groupe/.test(x.q))!.r).toBe(
      reponseALEssai({ autorise: false, dureeMaxJours: 0 }),
    );
  });

  it("chaque mot est vrai dans le code : le chapitre libre de chaque diplôme et son cas s'ouvrent à une classe sans offre", () => {
    for (const f of DIPLOMES_PROPOSES) {
      const essai = essaiDuDiplome(f.code);
      expect(essai, `${f.code} n'a pas de chapitre libre`).not.toBeNull();
      for (const contenu of [essai!.chapitre, ...(essai!.cas ? [essai!.cas] : [])]) {
        // Sans offre, quel que soit le parcours de la classe, et même libérée chapitre par chapitre.
        expect(chapitreOuvertALaClasse(null, { parcours: null, heritee: false }, contenu), `${f.code} : ${contenu.code}`).toBe(true);
        expect(chapitreOuvertALaClasse(null, { parcours: "stmg-sig", heritee: false }, contenu), `${f.code} : ${contenu.code}`).toBe(true);
        expect(libereALaClasse("chapitre", new Set(), { ...contenu, code: contenu.code }), `${f.code} : ${contenu.code}`).toBe(true);
      }
      expect(essai!.cas, `${f.code} : le chapitre libre n'a pas de cas pratique`).not.toBeNull();
    }
  });

  it("chaque mot est vrai dans le code : le compte se crée seul, la classe sans offre, la partie avec une offre", () => {
    // L'inscription libre est ouverte par défaut ; fermée, la réponse ne promet plus le compte.
    expect(code("src/services/admin.service.ts")).toMatch(/allowSelfServiceTeachers: true/);
    expect(plat(reponseALEssai({ autorise: false, dureeMaxJours: 30 }, false))).toMatch(/^Non\./);
    // La création d'une classe du cours ne demande aucune offre ; celle d'une partie, si.
    const creer = code("src/services/cours.service.ts");
    const corps = creer.slice(creer.indexOf("export async function creerClasse("), creer.indexOf("export async function classesDeLEnseignant"));
    expect(corps).not.toMatch(/verifierLaClasse|assertCanCreateGame|licenceEnCours|getLicenceStatus/);
    expect(code("src/app/teacher/cours/actions.ts")).not.toMatch(/verifierLaClasse|assertCanCreateGame/);
    // /tarifs passe le réglage de l'inscription libre à la question.
    expect(code("src/app/tarifs/page.tsx")).toMatch(/allowSelfServiceTeachers/);
    expect(code("src/components/page-des-tarifs.tsx")).toMatch(/questionsDesTarifs\(essai, inscriptionLibre\)/);
  });

  it("l'essai de l'arène allumé dans /admin/offres : la réponse reste celle de l'essai de l'offre Classe", () => {
    const r = reponseALEssai({ autorise: true, dureeMaxJours: 21 });
    expect(r).toMatch(/^Oui, sur demande et sans paiement/);
    expect(r).toContain("21 jours au plus");
  });
});

describe("2 · la page Lycées, pour le proviseur", () => {
  const PAGE = "src/app/lycees/page.tsx";
  /** La page rendue avec le catalogue par défaut : la page lit le catalogue en base, et rend ce composant. */
  const pageRendue = async () => {
    const { PageDesLycees } = (await import("@/components/page-des-lycees")) as {
      PageDesLycees: ComponentType<Record<string, unknown>>;
    };
    const { offresPourLesLycees } = await import("@/config/lycees");
    expect(code(PAGE)).toMatch(/<PageDesLycees offres=\{offresPourLesLycees\(await lireLeCatalogue\(\)\)\} \/>/);
    return rendre(PageDesLycees, { offres: offresPourLesLycees(CATALOGUE_PAR_DEFAUT) });
  };

  it("existe, au menu juste après « Enseignants », au plan du site, avec ses métadonnées", async () => {
    expect(existsSync(join(process.cwd(), PAGE)), "pas de page /lycees").toBe(true);
    const offres = NAVIGATION.find((g) => g.code === "offres")!.liens;
    const i = offres.findIndex((l) => l.href === "/enseignants");
    expect(offres[i + 1]).toMatchObject({ href: "/lycees", libelle: "Lycées" });
    expect(lire("src/app/sitemap.ts")).toMatch(/"\/lycees"/);
    // Elle lit le catalogue : elle se régénère, comme /tarifs, à chaque enregistrement dans /admin/offres.
    expect(lire("src/app/admin/offres/actions.ts")).toMatch(/PAGES_DU_CATALOGUE = \[[^\]]*"\/lycees"/);
    const { metadata } = (await import("@/app/lycees/page")) as { metadata: { title: string; description: string; alternates: { canonical: string } } };
    expect(metadata.alternates.canonical).toBe("/lycees");
    expect(metadata.title).toMatch(/^Lycées/);
    expect(metadata.description).toMatch(/STMG/);
    expect(metadata.description).toMatch(/BTS/);
  });

  it("le bac STMG et les BTS, chacun avec son chapitre libre et son cas, lus dans la liste, rien de recopié", async () => {
    const html = await pageRendue();
    const t = texteDe(html);
    const liens = liensDe(html);
    expect(DU_LYCEE.map((f) => f.code)).toEqual(["stmg", "bts-cg", "bts-mco", "bts-ndrc", "bts-gpme", "bts-sam", "bts-mhr"]);
    for (const f of DU_LYCEE) {
      const essai = essaiDuDiplome(f.code)!;
      expect(essai.chapitre.code).toBe(CHAPITRE_LIBRE_DU_DIPLOME[f.code]);
      expect(t, f.sigle).toContain(plat(f.sigle));
      expect(t, `${f.sigle} : son chapitre libre`).toContain(plat(essai.chapitre.titre));
      expect(liens, `${f.sigle} : le lien de son chapitre libre`).toContain(`/cours/${essai.chapitre.code}?diplome=${f.code}`);
      if (essai.cas) expect(liens, `${f.sigle} : le lien de son cas`).toContain(`/cours/${essai.cas.code}?diplome=${f.code}`);
    }
    // Aucun titre de chapitre libre n'est écrit dans la page : elle lit la liste.
    const source = lire(PAGE) + lire("src/config/lycees.ts") + lire("src/components/page-des-lycees.tsx");
    for (const f of DU_LYCEE) expect(source, f.code).not.toContain(essaiDuDiplome(f.code)!.chapitre.titre);
    expect(lire("src/config/lycees.ts")).toMatch(/essaiDuDiplome|CHAPITRE_LIBRE_DU_DIPLOME/);
  });

  it("dit les offres Classe, Programme et Campus telles que le code les applique", async () => {
    const t = texteDe(await pageRendue());
    const v = variablesDuCatalogue();
    for (const offre of ["classe", "programme", "campus"] as const) {
      expect(t, offre).toContain(plat(remplir(LE_COURS_PAR_OFFRE[offre], v)));
    }
    expect(t).toContain(`une partie à la fois, de ${ELEVES_PAR_CLASSE} élèves au plus`);
    expect(t).toContain(`les ${ENTREPRISES.length} entreprises`);
    expect(t).toMatch(/l'examen individuel/i);
    // Les phrases se tirent du paramétrage de l'arène de chaque offre, celui que la licence vendue
    // reprend (par défaut, PARAMETRAGE_DES_OFFRES) : un autre paramétrage, une autre phrase.
    for (const o of ["classe", "programme", "campus"] as const) {
      expect(parametresAreneDe(CATALOGUE_PAR_DEFAUT.offres.find((x) => x.code === o)!)).toEqual(PARAMETRAGE_DES_OFFRES[o]);
    }
    const { offresPourLesLycees } = await import("@/config/lycees");
    const autre = structuredClone(CATALOGUE_PAR_DEFAUT);
    autre.offres.find((x) => x.code === "classe")!.modules = [
      { module: "arene", parametres: { ...PARAMETRAGE_DES_OFFRES.classe, partiesEnCours: 2 } },
    ];
    expect(offresPourLesLycees(autre).find((x) => x.code === "classe")!.lignes[0]).toContain("2 parties en même temps");
    expect(lire("src/config/lycees.ts")).toMatch(/parametresAreneDe/);
  });

  it("la commande publique : bon de commande, mandat administratif, Chorus Pro ; aucun compte élève", async () => {
    const t = texteDe(await pageRendue());
    expect(t).toMatch(/bon de commande/);
    expect(t).toMatch(/mandat administratif/);
    expect(t).toMatch(/Chorus Pro/);
    expect(t).toContain(VENDEUR.siret);
    expect(t).toMatch(/Aucun compte élève/);
    // Comme les CGV : le nom que la classe du cours garde, et celui de l'examen.
    expect(t).toMatch(/classe du cours garde le nom/);
  });

  it("mène au devis du cours ou de l'arène, jamais à celui des épisodes", async () => {
    const html = await pageRendue();
    // Les demandes de devis (la fiche fournisseur, une ancre de la page du devis, n'en est pas une).
    const devis = liensDe(html).filter((h) => h.startsWith("/devis?"));
    expect(devis.length).toBeGreaterThan(0);
    for (const h of devis) expect(h, h).toMatch(/^\/devis\?offre=(classe|programme|campus)(&|$)/);
    expect(devis).toContain("/devis?offre=campus");
    expect(devis).toContain("/devis?offre=classe&source=cours");
    // Les épisodes ne s'annoncent pas au lycée (config/episodes/public-des-episodes.ts) : le contenu de la
    // page n'en dit rien (le pied de page, commun au site, porte le mot de leur groupe).
    const contenu = html.slice(html.indexOf("<main"), html.indexOf("</main>"));
    expect(texteDe(contenu)).not.toMatch(/pisode/);
  });
});

describe("3 · la page des entreprises, /entreprises/offre", () => {
  const vue = vueDesTarifs(CATALOGUE_PAR_DEFAUT, VARIABLES_PAR_DEFAUT, { prix: false });
  const colonnes = vue.episodes!.colonnes.filter((c) => c.public === "entreprises");
  const rendue = async () => {
    const { OffreDesEntreprises } = (await import("@/components/offre-des-entreprises")) as {
      OffreDesEntreprises: ComponentType<Record<string, unknown>>;
    };
    return rendre(OffreDesEntreprises, { colonnes, tarif: vue.episodes!.tarif });
  };

  it("dit le déroulé : le parcours de 8 semaines des écoles, lu au même endroit", async () => {
    const { PARCOURS_EN_COHORTE, SEMAINES_DU_PARCOURS } = await import("@/config/episodes/parcours-en-cohorte");
    expect(SEMAINES_DU_PARCOURS).toBe(8);
    const t = texteDe(await rendue());
    expect(t).toContain(`${SEMAINES_DU_PARCOURS} semaines`);
    for (const e of PARCOURS_EN_COHORTE) {
      expect(t).toContain(plat(e.quand));
      expect(t).toContain(plat(e.quoi));
      expect(t).toContain(plat(e.texte));
    }
    // /ecoles lit le même parcours, et ne le recopie plus.
    expect(code("src/app/ecoles/page.tsx")).toContain("PARCOURS_EN_COHORTE");
    expect(code("src/app/ecoles/page.tsx")).not.toMatch(/quoi: "Le lancement"/);
    expect(code("src/app/entreprises/offre/page.tsx")).toContain("<OffreDesEntreprises");
  });

  it("dit que les animateurs travaillent dans l'espace enseignant, rubrique « Cohortes »", async () => {
    const html = await rendue();
    const t = texteDe(html);
    const rubrique = NAVIGATION_ENSEIGNANT.find((p) => p.code === "cohortes")!;
    expect(t).toMatch(/espace enseignant/);
    expect(t).toContain(`rubrique « ${rubrique.libelle} »`);
    expect(liensDe(html)).toContain("/teacher/login");
  });

  it("dit ce qui distingue les formules comme le code l'applique : une seule offre, une différence commerciale", async () => {
    const entreprise = CATALOGUE_PAR_DEFAUT.offres.find((o) => o.code === "entreprise")!;
    // Dans le code, les formules ne sont que du texte d'une même offre, qui ouvre le module des
    // épisodes sans plafond d'animateurs : rien ne les distingue à l'usage.
    expect(entreprise.formules.map((f) => f.nom)).toEqual(["Parcours manager", "Cohorte animée", "Organisme de formation"]);
    expect(entreprise.modules).toEqual([{ module: "episodes" }]);
    expect(CATALOGUE_PAR_DEFAUT.offres.filter((o) => o.formules.length > 0).map((o) => o.code)).toEqual(["entreprise"]);
    const t = texteDe(await rendue());
    expect(t).toMatch(/Les 3 formules ouvrent la même chose dans l'application/);
    expect(t).toMatch(/leur différence est seulement commerciale/);
  });

  it("ne dit rien du financement", async () => {
    expect(texteDe(await rendue())).not.toMatch(/financ|OPCO|CPF|Qualiopi|prise en charge/i);
    expect(code("src/app/entreprises/offre/page.tsx")).not.toMatch(/financ|OPCO|CPF|Qualiopi/i);
  });
});

describe("4 · après le devis : les délais et la fiche fournisseur", () => {
  const DELAIS = "Réponse sous 2 jours ouvrés ; licence ouverte sous 2 jours ouvrés après la commande.";

  it("les délais se lisent de la donnée (config/conditions-legales.ts)", async () => {
    const c = (await import("@/config/conditions-legales")) as Record<string, unknown>;
    expect(c.REPONSE_AU_DEVIS_JOURS_OUVRES).toBe(2);
    expect(c.OUVERTURE_DE_LA_LICENCE_JOURS_OUVRES).toBe(2);
    expect(c.DELAIS_APRES_LE_DEVIS).toBe(DELAIS);
  });

  it("l'écran de confirmation du devis les dit", () => {
    const html = rendre(DevisForm as ComponentType<Record<string, unknown>>, {
      offres: [{ code: "campus", offre: "Offre Campus", organisation: "École", exempleOrganisation: "", identifiant: "UAI" }],
      offreInitiale: "campus",
      entreprises: [],
      niveaux: [],
      vendeur: VENDEUR.nom,
      mentionTva: MENTION_TVA,
      contact: VENDEUR.contact,
      initial: { error: null, values: null, ok: { email: "a@b.test", offre: "campus", accuseEnvoye: false, promo: null } },
    });
    expect(texteDe(html)).toContain(DELAIS);
  });

  it("l'accusé de réception les dit", () => {
    const { texte } = texteAccuseDevis(
      {
        offre: "campus",
        libelles: { offre: "Offre Campus", organisation: "École", exempleOrganisation: "", identifiant: "UAI" },
        nom: "Claire",
        fonction: "Proviseure",
        organisation: "Lycée Pasteur",
        identifiant: "",
        effectif: null,
        email: "a@b.test",
        message: "",
        ip: null,
      },
      VENDEUR.contact,
    );
    expect(plat(texte)).toContain(DELAIS);
  });

  it("les CGV les disent, avec la fiche fournisseur lue dans VENDEUR", async () => {
    const cgv = (await import("@/app/cgv/page")).default as ComponentType<Record<string, unknown>>;
    const t = texteDe(rendre(cgv));
    expect(t).toContain(DELAIS);
    expect(t).toMatch(/Fiche fournisseur/);
    expect(t).toContain(`SIRET ${VENDEUR.siret}`);
    expect(t).toContain(`${VENDEUR.adresse.rue}, ${VENDEUR.adresse.codePostal} ${VENDEUR.adresse.ville}`);
    expect(t).toMatch(/Chorus Pro/);
    expect(t).toMatch(/RIB sur demande/);
    expect(code("src/app/cgv/page.tsx")).toContain("<FicheFournisseur");
  });

  it("la page du devis porte la fiche fournisseur, sans recopier le vendeur", async () => {
    expect(code("src/app/devis/page.tsx")).toContain("<FicheFournisseur");
    const { FicheFournisseur } = (await import("@/components/fiche-fournisseur")) as {
      FicheFournisseur: ComponentType<Record<string, unknown>>;
    };
    const t = texteDe(rendre(FicheFournisseur));
    expect(t).toContain(VENDEUR.siret);
    expect(t).toMatch(/Adresse de facturation/);
    expect(t).toMatch(/Chorus Pro/);
    expect(t).toMatch(/RIB sur demande/);
    expect(lire("src/components/fiche-fournisseur.tsx")).not.toContain(VENDEUR.siret);
    expect(lire("src/components/fiche-fournisseur.tsx")).not.toContain(VENDEUR.adresse.rue);
  });
});

describe("5 · les points secondaires de l'offre", () => {
  it("le « Demander un devis » du sur-mesure mène à un devis qui n'exige ni l'entreprise ni le niveau", () => {
    const adresse = new URL(SUR_MESURE.appel.devis.href, "https://exemple.test");
    expect(adresse.pathname).toBe("/devis");
    // Sans offre dans l'adresse, le devis préremplit la première de la liste.
    const code = adresse.searchParams.get("offre") ?? offresDuDevis(CATALOGUE_PAR_DEFAUT)[0]!.code;
    const offre = offresDuDevis(CATALOGUE_PAR_DEFAUT).find((o) => o.code === code)!;
    expect(offre, `l'offre ${code} n'est pas au devis`).toBeDefined();
    const l = libellesDuDevisDe(offre);
    expect(parametrageRequisAuDevis(l), `${code} exige l'entreprise et le niveau`).toBe(false);
  });

  it("/ecoles : la réponse sur les données dit ce que l'examen garde", () => {
    expect(plat(lire("src/app/ecoles/page.tsx"))).toContain(
      "L'examen individuel garde le nom et le numéro d'étudiant du candidat.",
    );
  });

  it("/tarifs : « Dans l'enseignement supérieur » en tête des épisodes", () => {
    const html = rendre(PageDesTarifs as ComponentType<Record<string, unknown>>, {
      vue: vueDesTarifs(CATALOGUE_PAR_DEFAUT, VARIABLES_PAR_DEFAUT, { prix: false }),
      bandeau: null,
      prixPublics: false,
    });
    const bande = html.slice(html.indexOf("data-bande-episodes"));
    const t = texteDe(bande);
    expect(PUBLIC_DES_EPISODES).toMatch(/^Dans l'enseignement supérieur/);
    expect(t).toContain(plat(PUBLIC_DES_EPISODES));
    // En tête : avant toute autre phrase de la bande.
    expect(t.indexOf(plat(PUBLIC_DES_EPISODES))).toBeLessThan(t.indexOf("Des trimestres joués"));
  });

  it("« Offres », pas « tarifs », là où aucun prix ne s'affiche", () => {
    for (const f of [
      "src/app/devis/page.tsx",
      "src/app/cgv/page.tsx",
      "src/app/ecoles/page.tsx",
      "src/app/jouer/page.tsx",
      "src/app/integration/page.tsx",
    ]) {
      expect(plat(code(f)), f).not.toMatch(/Offres et tarifs|les tarifs|et les tarifs|voyez les tarifs/);
    }
    expect(code("src/app/devis/page.tsx")).toMatch(/surtitre="Offres"/);
    expect(code("src/app/cgv/page.tsx")).toMatch(/surtitre="Offres"/);
  });

  it("/ecoles ne laisse plus croire à une certification qui n'existe pas", () => {
    expect(code("src/app/ecoles/page.tsx")).not.toMatch(/Qualiopi/);
    expect(code("src/app/ecoles/page.tsx")).not.toMatch(/>\s*AACSB, EQUIS/);
  });

  it("/etablissement ne répond plus 404 : il mène à l'entrée de l'espace établissement", () => {
    expect(lire("next.config.ts")).toMatch(/source: "\/etablissement", destination: "\/etablissement\/parties"/);
    expect(existsSync(join(process.cwd(), "src/app/etablissement/page.tsx"))).toBe(false);
    expect(lire("src/saml/aiguillage.ts")).toContain('PAGE_DE_L_ETUDIANT = "/etablissement/parties"');
  });
});

describe("6 · les portes", () => {
  /** Les actions de l'ouverture d'une page vitrine : ce qui est passé à `actions=`. */
  const actions = (source: string) => {
    const debut = source.indexOf("actions={");
    return source.slice(debut, source.indexOf("/>\n", debut));
  };

  it("/ecoles : un second bouton vers le devis Campus ou Programme, à côté de celui des épisodes", () => {
    const source = code("src/app/ecoles/page.tsx");
    const tete = actions(source);
    expect(tete).toContain('lienDuDevis("episodes")');
    expect(tete).toMatch(/lienDuDevis\("(campus|programme)"\)/);
    const finale = source.slice(source.indexOf("<BandeFinale"));
    expect(finale).toContain('lienDuDevis("episodes")');
    expect(finale).toMatch(/lienDuDevis\("(campus|programme)"\)/);
  });

  it("/integration : l'adresse d'inscription se demande par écrit, pas par un rendez-vous", () => {
    const source = code("src/app/integration/page.tsx");
    expect(source).not.toMatch(/href="\/rendez-vous"[^>]*>\s*Demander votre adresse/);
    expect(source).toContain("<DemandeDAdresseDInscription");
    expect(existsSync(join(process.cwd(), "src/app/integration/actions.ts"))).toBe(true);
    expect(lire("src/components/demande-d-adresse-d-inscription.tsx")).toMatch(/demanderLAdresseDInscriptionAction/);
  });

  it("un épisode payant fermé propose par défaut le devis « pour une entreprise », hors d'une cohorte", async () => {
    const { lienDuDevisDesEpisodes } = (await import("@/config/tarifs")) as unknown as {
      lienDuDevisDesEpisodes: (enseignant: boolean) => string;
    };
    expect(lienDuDevisDesEpisodes(false)).toBe("/devis?offre=entreprise");
    expect(lienDuDevisDesEpisodes(true)).toBe("/devis?offre=episodes");
    const page = code("src/app/entreprises/episode/[code]/page.tsx");
    expect(page).toContain("lienDuDevisDesEpisodes(");
    expect(page).not.toContain('lienDuDevis("episodes")');
  });

  it("/entreprises reçoit en tête un encart « Pour les entreprises » vers /entreprises/offre", () => {
    const source = code("src/app/entreprises/page.tsx");
    const annonce = source.slice(source.indexOf("annonce={"), source.indexOf("surtitre=", source.indexOf("annonce={")));
    expect(annonce).toContain("data-encart-entreprises");
    expect(annonce).toContain("Pour les entreprises");
    expect(annonce).toContain('href="/entreprises/offre"');
    // L'ouverture pose l'annonce avant son titre.
    const html = rendre(BandeOuverture as ComponentType<Record<string, unknown>>, {
      id: "entreprises.accroche",
      contraste: true,
      annonce: createElement("p", { "data-annonce": "" }, "Pour les entreprises"),
      surtitre: "Surtitre",
      titre: "Titre",
      chapeau: "Chapeau",
      preuve: { valeur: "9", libelle: "métiers" },
      actions: null,
    });
    expect(html.indexOf("data-annonce")).toBeGreaterThan(0);
    expect(html.indexOf("data-annonce")).toBeLessThan(html.indexOf("<h1"));
  });
});

describe("8 · la fin de la licence épisodes", () => {
  it("l'élève lit que l'épisode n'est plus ouvert pour son groupe, et qui prévenir", () => {
    expect(EPISODE_FERME_POUR_L_ELEVE).toBe("Cet épisode n'est plus ouvert pour votre groupe ; prévenez votre animateur.");
  });

  it("la page d'une cohorte prévient l'enseignant, sur la licence de l'organisation de la cohorte", async () => {
    const { LICENCE_SANS_LES_EPISODES } = (await import("@/config/cohortes")) as unknown as { LICENCE_SANS_LES_EPISODES: string };
    expect(LICENCE_SANS_LES_EPISODES).toBe("Votre licence n'inclut plus les épisodes : vos participants ne peuvent plus les ouvrir.");
    const page = code("src/app/teacher/cohortes/[id]/page.tsx");
    expect(page).toContain("LICENCE_SANS_LES_EPISODES");
    expect(page).toMatch(/uneOrganisationAvecEpisodes\(\[cohorte\.organisation\]\)/);
  });
});

describe("9 · /join parle de tous les codes", () => {
  it("« Votre code » et « Valider », plus « Code de la partie » ni « Rejoindre la partie »", () => {
    const f = code("src/components/join-form.tsx");
    expect(f).toContain("Votre code");
    expect(f).toMatch(/"Valider"/);
    expect(f).not.toContain("Code de la partie");
    expect(f).not.toContain("Rejoindre la partie");
    expect(plat(f)).not.toMatch(/En rejoignant la partie/);
  });

  it("une équipe n'est promise que pour une partie", async () => {
    const page = plat(code("src/app/join/page.tsx"));
    const phrases = page.split(/(?<=[.:"])\s/).filter((p) => /affecté automatiquement à une équipe/.test(p));
    expect(phrases.length).toBeGreaterThan(0);
    for (const p of phrases) expect(p, p).toMatch(/[Pp]our une partie/);
    // Le carton d'une table est celui d'une partie : lui seul nomme l'équipe sans condition.
    const { metadata } = (await import("@/app/join/page")) as { metadata: { description: string } };
    expect(metadata.description).not.toMatch(/équipe/);
    expect(metadata.description).toMatch(/classe/);
  });
});
