import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import IntegrationPage from "@/app/integration/page";
import { ConnexionEtablissement } from "@/components/connexion-etablissement";
import { BOUTON_DE_L_ETABLISSEMENT, connexionEtablissementDite } from "@/config/connexion-etablissement";
import { GUIDES, guideResolu } from "@/config/guides";
import { valeursDesJetons } from "@/config/guides/jetons";
import { comptesSansMotDePasse } from "@/config/mot-de-passe-oublie";
import { CATALOGUE_PAR_DEFAUT } from "@/config/tarifs";
import { empreinteSha256 } from "@/saml/certificat";
import { connexionEtablissementProposee } from "@/saml/configuration";
import { paireDeTest } from "../helpers/simulateur-saml";

/**
 * LA CONNEXION PAR L'ÉTABLISSEMENT (RENATER), DITE COMME ELLE EST (chantier « petits points de
 * novembre », 11 novembre 2026).
 *
 * Le bouton « Se connecter avec mon établissement » ne paraît que sur la fédération de production
 * (saml/configuration.ts, `connexionEtablissementProposee`). La page /integration et le guide du
 * référent le décrivaient comme présent ; la page du mot de passe oublié y renvoyait. Ils lisent
 * maintenant l'état : la connexion est prévue tant que le bouton ne paraît pas, et l'on dit comment
 * on entre aujourd'hui ; sur la fédération de production, ils disent le bouton, sans autre changement.
 * La garde le lit sur la page rendue, dans les trois états : sans configuration, configurée sur la
 * fédération de test (l'état de la production aujourd'hui), configurée sur celle de production.
 */

const ENV = ["SAML_SP_PRIVATE_KEY", "SAML_SP_CERT", "SAML_FEDERATION_CERT_SHA256", "SAML_FEDERATION"] as const;
const sauvegarde: Record<string, string | undefined> = {};
let configuree: Record<(typeof ENV)[number], string | undefined>;

function poser(env: Partial<Record<(typeof ENV)[number], string | undefined>>) {
  for (const k of ENV) {
    if (env[k] === undefined) delete process.env[k];
    else process.env[k] = env[k];
  }
}

beforeAll(() => {
  for (const k of ENV) sauvegarde[k] = process.env[k];
  const sp = paireDeTest("www.business-arena.fr");
  configuree = {
    SAML_SP_PRIVATE_KEY: sp.cle,
    SAML_SP_CERT: sp.certificat,
    SAML_FEDERATION_CERT_SHA256: empreinteSha256(paireDeTest("federation.test").certificat),
    SAML_FEDERATION: undefined,
  };
});
afterAll(() => poser(sauvegarde));

const texte = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[  ]/g, " ")
    .replace(/\s+/g, " ");
/** La section RENATER de /integration, rendue. */
function sectionRenater(): string {
  const t = texte(renderToStaticMarkup(createElement(IntegrationPage)));
  const debut = t.indexOf("Se connecter avec l'établissement (RENATER)");
  expect(debut).toBeGreaterThan(0);
  return t.slice(debut, t.indexOf("Ce que la connexion ouvre", debut));
}
/** L'étape RENATER du guide du référent, résolue comme la page la résout. */
function etapeDuGuide(): string {
  const g = guideResolu(GUIDES.find((x) => x.public === "etablissement")!, valeursDesJetons(CATALOGUE_PAR_DEFAUT, connexionEtablissementProposee()));
  return texte(g.etapes.find((e) => e.id === "renater")!.faire.join(" "));
}

const LE_BOUTON_MENE = `un bouton « ${BOUTON_DE_L_ETABLISSEMENT} » mène au service de découverte de RENATER`;
const PREVUE = "s'ouvrira une fois l'inscription de Business Arena à la fédération faite";
const AUJOURD_HUI = "Aujourd'hui, on entre par le code donné par l'enseignant, ou par son compte enseignant.";

describe("la connexion par l'établissement, tant que le bouton ne paraît pas", () => {
  for (const [etat, env] of [
    ["sans configuration", () => ({})],
    ["configurée sur la fédération de test", () => configuree],
  ] as const) {
    it(`${etat} : /integration et le guide la disent prévue, et disent comment on entre aujourd'hui`, () => {
      poser(env());
      expect(connexionEtablissementProposee()).toBe(false);
      expect(renderToStaticMarkup(createElement(ConnexionEtablissement, { retour: "/join" }))).toBe("");

      const section = sectionRenater();
      expect(section).toContain("Prévue pour les établissements de la Fédération Éducation-Recherche");
      expect(section).toContain(PREVUE);
      expect(section).toContain(AUJOURD_HUI);
      expect(section).toContain("Une fois la connexion ouverte :");
      expect(section).not.toContain(LE_BOUTON_MENE);
      expect(section).not.toMatch(/Disponible pour/);
      // Ce qui reste vrai : les données reçues et les adresses du fournisseur de services.
      expect(section).toContain("pairwise-id");
      expect(section).toContain("entityID");

      const guide = etapeDuGuide();
      expect(guide).toContain("La connexion est prévue");
      expect(guide).toContain(PREVUE);
      expect(guide).toContain(AUJOURD_HUI);
      expect(guide).not.toMatch(/mène au service de découverte/);

      const mdp = comptesSansMotDePasse(connexionEtablissementProposee());
      expect(mdp).not.toMatch(/RENATER|connexion par l'établissement/);
      expect(mdp).toContain("plateforme de cours");
    });
  }
});

describe("la connexion par l'établissement, sur la fédération de production", () => {
  it("les mêmes pages disent le bouton, et ce qu'il fait, sans autre changement", () => {
    poser({ ...configuree, SAML_FEDERATION: "production" });
    expect(connexionEtablissementProposee()).toBe(true);
    // Le libellé que les pages citent est celui du bouton.
    expect(texte(renderToStaticMarkup(createElement(ConnexionEtablissement, { retour: "/join" })))).toContain(BOUTON_DE_L_ETABLISSEMENT);

    const section = sectionRenater();
    expect(section).toContain("Disponible pour les établissements de la Fédération Éducation-Recherche");
    expect(section).toContain(LE_BOUTON_MENE);
    expect(section).not.toContain(PREVUE);
    expect(section).not.toContain("Aujourd'hui, on entre");
    expect(section).not.toContain("Une fois la connexion ouverte");

    const guide = etapeDuGuide();
    expect(guide).toContain(`le bouton « ${BOUTON_DE_L_ETABLISSEMENT} » mène au service de découverte de RENATER`);
    expect(guide).not.toContain("prévue");

    expect(comptesSansMotDePasse(connexionEtablissementProposee())).toContain("Utilisez la connexion par l'établissement");
  });
});

describe("chaque page lit l'état, aucune ne l'écrit", () => {
  const lire = (p: string) => readFileSync(join(process.cwd(), "src", p), "utf8");
  it("/integration, les guides et le mot de passe oublié passent `connexionEtablissementProposee()`", () => {
    expect(lire("app/integration/page.tsx")).toContain("connexionEtablissementDite(connexionEtablissementProposee())");
    expect(lire("app/integration/page.tsx")).not.toContain("Se connecter avec mon établissement");
    expect(lire("app/guides/[public]/page.tsx")).toContain("valeursDesJetons(await lireLeCatalogue(), connexionEtablissementProposee())");
    expect(lire("app/guides/page.tsx")).toContain("valeursDesJetons(await lireLeCatalogue(), connexionEtablissementProposee())");
    expect(lire("app/teacher/mot-de-passe-oublie/page.tsx")).toContain("comptesSansMotDePasse(connexionEtablissementProposee())");
    expect(lire("config/guides/etablissement.ts")).toContain('"{{connexionEtablissement}}"');
    expect(lire("config/guides/etablissement.ts")).not.toMatch(/« Se connecter avec mon établissement » mène/);
  });

  it("les deux versions de chaque phrase, sans tiret au milieu d'une phrase", () => {
    for (const p of [true, false]) {
      const d = connexionEtablissementDite(p);
      for (const t of [d.integration, d.guide, d.avantLaListe ?? "", comptesSansMotDePasse(p)]) expect(t).not.toMatch(/\s[—–-]\s/);
    }
  });
});
