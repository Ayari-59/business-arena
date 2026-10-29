import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CATALOGUE_PAR_DEFAUT, questionsDesTarifs } from "@/config/tarifs";
import { NAVIGATION } from "@/config/navigation";

/**
 * L'OFFRE APRÈS L'AUDIT D'OCTOBRE 2026 (rapport audit-offre) :
 *  · l'accès au cours suit l'offre : Classe, le parcours de la classe ; Programme, les
 *    parcours de ses classes ; Campus, tout ; la Découverte, le chapitre libre. Les cartes
 *    le disent, en code comme en base (drizzle/0053) ;
 *  · « Le cours seul » ne se demande plus au devis : le cours vient avec une offre de l'arène ;
 *  · des conditions générales de vente complètes (/cgv), liées depuis /tarifs, /devis et le
 *    pied de page, sans rien inventer (« [à compléter] ») ;
 *  · une page commerciale pour les entreprises et les organismes de formation, sans
 *    affirmer Qualiopi ni un financement OPCO ;
 *  · un essai de classe, limité, sans paiement, à la place du « Non ».
 */

const racine = process.cwd();
const lire = (chemin: string) => readFileSync(join(racine, chemin), "utf8");
const inclus = (code: string) => CATALOGUE_PAR_DEFAUT.offres.find((o) => o.code === code)!.inclus.join(" ");

describe("l'accès au cours, dit par les offres", () => {
  it("chaque carte dit ce que son offre ouvre du cours", () => {
    expect(inclus("classe")).toMatch(/Le cours : les chapitres du parcours de la classe/);
    expect(inclus("programme")).toMatch(/Le cours : les chapitres des parcours de vos classes/);
    expect(inclus("campus")).toMatch(/Le cours : tous les chapitres de tous les parcours/);
    expect(inclus("decouverte")).toMatch(/Le premier chapitre du cours et son cas pratique, en libre accès/);
  });

  it("le catalogue en base reçoit les mêmes textes (drizzle/0053)", () => {
    const sql = lire("drizzle/0053_cours_selon_l_offre.sql");
    expect(sql).toMatch(/Le cours : les chapitres du parcours de la classe/);
    expect(sql).toMatch(/Le cours : tous les chapitres de tous les parcours/);
    expect(lire("drizzle/meta/_journal.json")).toMatch(/0053_cours_selon_l_offre/);
  });

  it("« Le cours seul » ne se demande plus au devis", () => {
    expect(lire("src/components/devis-form.tsx")).not.toMatch(/Le cours seul/);
    expect(lire("src/app/cours/[chapitre]/page.tsx")).not.toMatch(/interet=cours/);
    expect(lire("src/components/orientation-form.tsx")).not.toMatch(/interet=cours/);
  });
});

describe("les conditions générales de vente", () => {
  const page = "src/app/cgv/page.tsx";
  it("existent, complètes, sans rien inventer", () => {
    expect(existsSync(join(racine, page))).toBe(true);
    const t = lire(page);
    for (const titre of [
      "Objet",
      "Les offres",
      "La commande",
      "Prix et TVA",
      "Paiement et pénalités de retard",
      "Durée et résiliation",
      "Données personnelles",
      "Hébergement",
      "Responsabilité",
      "Propriété intellectuelle",
      "Droit applicable",
    ]) {
      expect(t, titre).toContain(`title="${titre}"`);
    }
    expect(t).toMatch(/Chorus Pro/);
    expect(t).toMatch(/mandat administratif/);
    expect(t).toMatch(/40 €/);
    expect(t).toMatch(/\[à compléter\]/);
    expect(t).toMatch(/\/mentions-legales/);
  });

  it("se lisent depuis /tarifs, /devis et le pied de page", () => {
    expect(lire("src/components/page-des-tarifs.tsx")).toMatch(/href="\/cgv"/);
    expect(lire("src/app/devis/page.tsx")).toMatch(/href="\/cgv"/);
    expect(NAVIGATION.find((g) => g.code === "offres")!.liens.map((l) => l.href)).toContain("/cgv");
    expect(lire("src/app/sitemap.ts")).toMatch(/"\/cgv"/);
  });
});

describe("la page commerciale des entreprises", () => {
  const page = "src/app/entreprises/offre/page.tsx";
  it("existe, dit ce qui est inclus, mène au devis, sans affirmer Qualiopi ni OPCO", () => {
    expect(existsSync(join(racine, page))).toBe(true);
    const t = lire(page);
    expect(t).toMatch(/\/devis\?offre=entreprise/);
    expect(t).not.toMatch(/Qualiopi|OPCO/);
    expect(NAVIGATION.find((g) => g.code === "entreprises")!.liens.map((l) => l.href)).toContain("/entreprises/offre");
    expect(lire("src/app/sitemap.ts")).toMatch(/"\/entreprises\/offre"/);
  });
});

describe("l'essai avec un groupe", () => {
  const reponse = (essai: { autorise: boolean; dureeMaxJours: number }) =>
    questionsDesTarifs(essai).find((x) => /essayer avec un groupe/.test(x.q))!.r;
  it("l'essai d'établissement activé dans /admin/offres : la réponse dit oui, sans paiement, et sa durée", () => {
    const r = reponse({ autorise: true, dureeMaxJours: 21 });
    expect(r).not.toMatch(/^Non/);
    expect(r).toMatch(/sans paiement/);
    expect(r).toContain("21 jours au plus");
  });
  it("éteint (le défaut), elle reste « Non » : rien n'est promis que /admin ne puisse ouvrir", () => {
    expect(reponse({ autorise: false, dureeMaxJours: 30 })).toMatch(/^Non/);
  });
  it("/tarifs passe le réglage de l'essai à la page", () => {
    expect(lire("src/app/tarifs/page.tsx")).toMatch(/essai=\{essai\}/);
  });
});
