import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";

/**
 * LE CATALOGUE EN BASE (migration 0041, /admin/offres), VÉRIFIÉ CÔTÉ SERVEUR.
 *
 * Demande du propriétaire : « gérer l'offre depuis le panneau admin, les gratuités, la
 * composition de plusieurs modules, les remises, les promos ». Les gardes du brief :
 *  · le catalogue migré EST la grille de config/tarifs.ts ;
 *  · une modification d'offre change /tarifs et /devis, pas les licences déjà vendues ;
 *  · une seule offre mise en avant (refus sinon, et l'index unique en garde) ;
 *  · code promo : valide, expiré, à venir, épuisé, hors offre, déjà utilisé par
 *    l'établissement ;
 *  · la remise s'applique au montant de la licence ;
 *  · la licence offerte exige son motif (et des dates), coûte 0 € et se lit comme telle ;
 *    l'essai n'existe que s'il est activé ;
 *  · le réglage de la Découverte est appliqué par services/acces.service.ts (niveaux
 *    ouverts, démonstrations) ;
 *  · tout est refusé sans administrateur de la plateforme ;
 *  · chaque modification est journalisée (qui, quand, avant, après).
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});
// Une adresse d'origine différente à chaque demande : le plafond par adresse ne s'en mêle pas.
let ip = 0;
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "x-real-ip": `198.51.100.${(ip = (ip % 250) + 1)}` }),
}));
vi.mock("@/lib/courriel", () => ({ envoyerCourriel: vi.fn(async () => ({ envoye: false, raison: "test" })) }));

import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { catalogueOffres, codesPromo, demandesDeDevis, orgLicences, users } from "@/db/schema";
import {
  CatalogueRefuse,
  enregistrerCodePromo,
  enregistrerLaDecouverte,
  enregistrerLAffichage,
  enregistrerLEssai,
  enregistrerModule,
  enregistrerOffre,
  lireLeCatalogue,
  lireLeJournal,
  lireLEtatSansCache,
  mettreEnAvant,
  type SaisieDeCodePromo,
} from "@/services/catalogue.service";
import { attribuerUneLicence, type SaisieDeLicence } from "@/services/vente.service";
import { accesAuxEpisodes, etatDeLOffre, NiveauReserveError, verifierLeNiveau } from "@/services/acces.service";
import { getLicenceStatus } from "@/services/licence.service";
import { getPlatformConfig } from "@/services/admin.service";
import { getTeacherOrgId, registerTeacher } from "@/services/auth.service";
import { envoyerDemandeDeDevisAction, type DevisFormState } from "@/app/devis/actions";
import { CATALOGUE_PAR_DEFAUT, libellesDuDevisDe, variablesDuCatalogue } from "@/config/tarifs";
import { offresDuDevis, vueDesTarifs, type OffreDuCatalogue } from "@/config/catalogue";
import { DECOUVERTE_PAR_DEFAUT } from "@/config/decouverte";
import { episodeOuvert, EPISODES_DE_DEMO } from "@/config/episodes/demos";
import { EPISODES } from "@/pedagogy/episodes/registre";

const JOUR = 24 * 60 * 60 * 1000;
/** Les espaces insécables du formateur, ramenées à l'espace. */
const espaces = (t: string | undefined) => t?.replace(/[\u00a0\u202f]/g, " ");
const ETAT: DevisFormState = { error: null, ok: null, values: null };

let n = 0;
async function enseignant(admin = false): Promise<{ userId: string; orgId: string }> {
  n += 1;
  const r = await registerTeacher({
    email: `catalogue-${n}-${randomUUID()}@lycee.test`,
    password: "motdepasse!",
    displayName: `Prof ${n}`,
    schoolName: `Lycée du catalogue ${n}`,
  });
  if ("error" in r) throw new Error(r.error);
  // L'adresse confirmée : sans elle, l'établissement ne reçoit pas de licence (migration 0046).
  await db.update(users).set({ emailConfirmeLe: new Date() }).where(eq(users.id, r.userId));
  if (admin) await db.update(users).set({ isPlatformAdmin: true }).where(eq(users.id, r.userId));
  return { userId: r.userId, orgId: (await getTeacherOrgId(r.userId))! };
}

const offre = async (code: string): Promise<OffreDuCatalogue> =>
  (await lireLeCatalogue()).offres.find((o) => o.code === code)!;

function formulaire(champs: Record<string, string>): FormData {
  const f = new FormData();
  for (const [k, v] of Object.entries(champs)) f.set(k, v);
  return f;
}

/** Une demande de devis pour Programme, avec ou sans code, au nom d'un établissement. */
const devis = (code: string, organisation = "Lycée Pasteur", identifiant = "", offreCode = "programme") =>
  envoyerDemandeDeDevisAction(
    ETAT,
    formulaire({
      offre: offreCode,
      nom: "Claire Martin",
      fonction: "Directrice des études",
      organisation,
      identifiant,
      effectif: "4",
      entreprise: "nova",
      niveau: "3",
      email: `claire-${randomUUID()}@ecole.test`,
      message: "",
      codePromo: code,
      site: "",
    }),
  );

const codePromo = (patch: Partial<SaisieDeCodePromo> & { code: string }): SaisieDeCodePromo => ({
  typeRemise: "pourcentage",
  valeur: 20,
  offres: null,
  debut: null,
  fin: null,
  utilisationsMax: null,
  unParEtablissement: true,
  actif: true,
  affiche: false,
  ...patch,
});

const vente = (patch: Partial<SaisieDeLicence> & { offre: string }): SaisieDeLicence => ({
  episodes: false,
  entreprise: null,
  niveau: null,
  maxEnseignants: null,
  label: "Année 2026-2027",
  startsAt: new Date(Date.now() - JOUR),
  endsAt: new Date(Date.now() + 300 * JOUR),
  reference: null,
  nature: "vendue",
  prixCatalogueCents: null,
  remise: null,
  motifGratuite: null,
  ...patch,
});

describe("le catalogue migré", () => {
  it("est, offre pour offre et module pour module, la grille de config/tarifs.ts", async () => {
    const lignes = await db.select({ n: sql<number>`count(*)::int` }).from(catalogueOffres);
    expect(lignes[0]!.n).toBe(CATALOGUE_PAR_DEFAUT.offres.length);
    const etat = await lireLEtatSansCache();
    const parCode = <T extends { code: string }>(l: readonly T[]) => [...l].sort((a, b) => a.code.localeCompare(b.code));
    expect(parCode(etat.catalogue.offres)).toEqual(parCode(CATALOGUE_PAR_DEFAUT.offres));
    expect(parCode(etat.catalogue.modules)).toEqual(parCode(CATALOGUE_PAR_DEFAUT.modules));
    expect(etat.decouverte).toEqual(DECOUVERTE_PAR_DEFAUT);
    expect(etat.essai).toEqual({ autorise: false, dureeMaxJours: 30 });
    // Décision d'octobre 2026 : les prix ne s'affichent pas sur le site, par défaut.
    expect(etat.affichage).toEqual({ prixPublics: false });
    expect(etat.promotion).toBeNull();
    // Et ce que /tarifs en rend est la grille par défaut.
    expect(vueDesTarifs(etat.catalogue, variablesDuCatalogue(etat.decouverte))).toEqual(
      vueDesTarifs(CATALOGUE_PAR_DEFAUT, variablesDuCatalogue()),
    );
  });
});

describe("tout est refusé sans administrateur de la plateforme", () => {
  it("offres, mise en avant, modules, gratuités, codes promo, licences", async () => {
    const e = await enseignant(false);
    const programme = await offre("programme");
    const refus = /Réservé à l'administrateur de la plateforme/;
    await expect(enregistrerOffre(e.userId, { ...programme, prixCents: 100 }, "modification")).rejects.toThrow(refus);
    await expect(mettreEnAvant(e.userId, "campus")).rejects.toThrow(refus);
    await expect(
      enregistrerModule(e.userId, { code: "mobilite", nom: "Mobilité", description: "", actif: true, ordre: 70 }, "creation"),
    ).rejects.toThrow(refus);
    await expect(enregistrerLaDecouverte(e.userId, { ...DECOUVERTE_PAR_DEFAUT, demos: [] })).rejects.toThrow(refus);
    await expect(enregistrerLEssai(e.userId, { autorise: true, dureeMaxJours: 30 })).rejects.toThrow(refus);
    await expect(enregistrerLAffichage(e.userId, { prixPublics: true })).rejects.toThrow(refus);
    await expect(enregistrerCodePromo(e.userId, codePromo({ code: "PIRATE" }), null)).rejects.toThrow(refus);
    await expect(attribuerUneLicence(e.userId, e.orgId, vente({ offre: "campus" }))).rejects.toThrow(refus);
    // Rien n'a bougé.
    expect((await offre("programme")).prixCents).toBe(99000);
    expect((await db.select().from(codesPromo).where(eq(codesPromo.code, "PIRATE"))).length).toBe(0);
  });
});

describe("une modification d'offre", () => {
  it("change /tarifs et /devis, pas une licence déjà vendue, et se journalise", async () => {
    const admin = await enseignant(true);
    const client = await enseignant(false);
    // Une licence Programme vendue AVANT la modification, avec une remise de 10 %.
    await attribuerUneLicence(
      admin.userId,
      client.orgId,
      vente({ offre: "programme", entreprise: "nova", maxEnseignants: 4, remise: { type: "pourcentage", valeur: 10, motif: "volume" } }),
    );
    const [avant] = await db.select().from(orgLicences).where(eq(orgLicences.organizationId, client.orgId));
    expect(avant).toMatchObject({ offreCode: "programme", prixCatalogueCents: 99000, amountCents: 89100, arene: "programme" });
    expect(avant!.remise).toEqual({ type: "pourcentage", valeur: 10, motif: "volume", montantCents: 9900 });
    expect((avant!.conditions as { nom: string; prixCents: number; inclus: string[] }).prixCents).toBe(99000);

    const programme = await offre("programme");
    await enregistrerOffre(
      admin.userId,
      { ...programme, prixCents: 109000, inclus: [...programme.inclus, "Une ligne ajoutée pour le test."] },
      "modification",
    );
    const apres = await lireLeCatalogue();
    const carte = vueDesTarifs(apres, variablesDuCatalogue()).cartes.find((c) => c.code === "programme")!;
    expect(carte.prixCents).toBe(109000);
    expect(carte.inclus.at(-1)).toBe("Une ligne ajoutée pour le test.");
    // La mention de Campus se recalcule sur le nouveau prix : 1 990 / 1 090, dès 2 entreprises.
    expect(vueDesTarifs(apres, variablesDuCatalogue()).cartes.find((c) => c.code === "campus")!.mention).toBe(
      "Dès 2 entreprises, moins cher que 2 offres Programme",
    );
    expect(offresDuDevis(apres).map((o) => o.code)).toContain("programme");

    // La licence vendue avant n'a pas bougé.
    const [toujours] = await db.select().from(orgLicences).where(eq(orgLicences.id, avant!.id));
    expect(toujours).toMatchObject({ prixCatalogueCents: 99000, amountCents: 89100 });
    expect((toujours!.conditions as { prixCents: number; inclus: string[] }).prixCents).toBe(99000);
    expect((toujours!.conditions as { inclus: string[] }).inclus).not.toContain("Une ligne ajoutée pour le test.");

    // Le journal : qui, quand, avant, après.
    const [entree] = (await lireLeJournal()).filter((j) => j.objet === "offre" && j.cle === "programme");
    expect(entree!.auteurId).toBe(admin.userId);
    expect(entree!.auteur).toContain("@lycee.test");
    expect((entree!.avant as { prixCents: number }).prixCents).toBe(99000);
    expect((entree!.apres as { prixCents: number }).prixCents).toBe(109000);

    // On remet la grille (les autres tests lisent ses prix).
    await enregistrerOffre(admin.userId, programme, "modification");
    expect((await offre("programme")).prixCents).toBe(99000);
  });

  it("refuse ce que la règle refuse : prix nul, variable inconnue, HT, nom figé", async () => {
    const admin = await enseignant(true);
    const classe = await offre("classe");
    const refus = async (o: OffreDuCatalogue) => {
      const e = await enregistrerOffre(admin.userId, o, "modification").catch((x: unknown) => x);
      expect(e).toBeInstanceOf(CatalogueRefuse);
      return (e as CatalogueRefuse).erreurs.join(" ");
    };
    expect(await refus({ ...classe, prixCents: 0 })).toMatch(/prix de référence positif/);
    expect(await refus({ ...classe, inclus: ["Les {inconnue} choses."] })).toMatch(/Variables inconnues : \{inconnue\}/);
    expect(await refus({ ...classe, precisions: ["290 € HT par an."] })).toMatch(/franchise de TVA/);
    expect(await refus({ ...classe, nom: "Groupe" })).toMatch(/figé/);
    expect((await offre("classe")).prixCents).toBe(29000);
  });

  it("une nouvelle offre composée (Campus + Épisodes) s'enregistre, se demande par devis, s'attribue", async () => {
    const admin = await enseignant(true);
    const client = await enseignant(false);
    const campus = await offre("campus");
    const nouvelle: OffreDuCatalogue = {
      ...campus,
      code: "campus-episodes",
      nom: "Campus et épisodes",
      sousTitre: "Toute l'école, l'arène et les épisodes manager.",
      tarif: "devis",
      prixCents: null,
      mention: null,
      modules: [...campus.modules, { module: "episodes" }],
      precisions: [],
      ordre: 45,
      visible: true,
      miseEnAvant: false,
      bouton: { libelle: "Demander un devis", cible: "/devis?offre=campus-episodes" },
    };
    await enregistrerOffre(admin.userId, nouvelle, "creation");
    const c = await lireLeCatalogue();
    expect(vueDesTarifs(c, variablesDuCatalogue()).cartes.map((x) => x.code)).toContain("campus-episodes");
    const libelles = libellesDuDevisDe(c.offres.find((o) => o.code === "campus-episodes")!);
    expect(libelles.offre).toBe("Offre Campus et épisodes");
    // Une licence de cette offre ouvre l'arène (Campus) ET les épisodes.
    await attribuerUneLicence(admin.userId, client.orgId, vente({ offre: "campus-episodes", prixCatalogueCents: 250000 }));
    const [l] = await db.select().from(orgLicences).where(eq(orgLicences.organizationId, client.orgId));
    expect(l).toMatchObject({ arene: "campus", episodes: true, offreCode: "campus-episodes", amountCents: 250000 });
    await db.delete(catalogueOffres).where(eq(catalogueOffres.code, "campus-episodes"));
  });
});

describe("une seule offre mise en avant", () => {
  it("refuse une deuxième, refuse de retirer la seule, déplace par « mettre en avant » ; l'index unique en garde", async () => {
    const admin = await enseignant(true);
    const campus = await offre("campus");
    await expect(enregistrerOffre(admin.userId, { ...campus, miseEnAvant: true }, "modification")).rejects.toThrow(
      /déjà mise en avant/,
    );
    const programme = await offre("programme");
    await expect(enregistrerOffre(admin.userId, { ...programme, miseEnAvant: false }, "modification")).rejects.toThrow(
      /seul bouton plein/,
    );
    await mettreEnAvant(admin.userId, "campus");
    let c = await lireLeCatalogue();
    expect(c.offres.filter((o) => o.miseEnAvant).map((o) => o.code)).toEqual(["campus"]);
    const pleins = vueDesTarifs(c, variablesDuCatalogue()).cartes.filter((x) => x.bouton.principal);
    expect(pleins.map((x) => x.code)).toEqual(["campus"]);
    // Une option ou une offre masquée ne se met pas en avant.
    await expect(mettreEnAvant(admin.userId, "integration-lms")).rejects.toThrow(/carte de l'arène visible/);
    // La base elle-même refuse deux mises en avant.
    await expect(
      db.update(catalogueOffres).set({ miseEnAvant: true }).where(eq(catalogueOffres.code, "classe")),
    ).rejects.toThrow();
    await mettreEnAvant(admin.userId, "programme");
    c = await lireLeCatalogue();
    expect(c.offres.filter((o) => o.miseEnAvant).map((o) => o.code)).toEqual(["programme"]);
  });
});

describe("les codes promo, dans /devis", () => {
  it("un code valide : le devis enregistré porte le prix catalogue, la remise et le prix remisé ; l'écran, prix éteints, le code seul", async () => {
    const admin = await enseignant(true);
    await enregistrerCodePromo(admin.userId, codePromo({ code: "rentree", offres: ["programme"], fin: new Date(Date.now() + 30 * JOUR) }), null);
    const r = await devis("Rentree", "École Supérieure du Nord", "0590099Z");
    expect(r.error).toBeNull();
    expect(r.ok?.promo).toMatchObject({ code: "RENTREE", montants: false, prixCatalogueCents: null, prixRemiseCents: null });
    const [d] = await db.select().from(demandesDeDevis).where(eq(demandesDeDevis.codePromo, "RENTREE"));
    expect(d).toMatchObject({ offre: "programme", prixCatalogueCents: 99000, remiseCents: 19800, prixRemiseCents: 79200, promoCle: "id:0590099Z" });
    expect(espaces(d!.remiseLibelle ?? "")).toBe("−20 %");
    const [ligne] = await db.select().from(codesPromo).where(eq(codesPromo.code, "RENTREE"));
    expect(ligne!.utilisations).toBe(1);
  });

  it("refuse, avec une phrase claire et sans rien enregistrer : inconnu, expiré, à venir, épuisé, hors offre, déjà utilisé", async () => {
    const admin = await enseignant(true);
    const passe = new Date(Date.now() - JOUR);
    await enregistrerCodePromo(admin.userId, codePromo({ code: "FINI", debut: new Date(Date.now() - 10 * JOUR), fin: passe }), null);
    await enregistrerCodePromo(admin.userId, codePromo({ code: "BIENTOT", debut: new Date(Date.now() + 5 * JOUR) }), null);
    await enregistrerCodePromo(admin.userId, codePromo({ code: "UNSEUL", utilisationsMax: 1, unParEtablissement: false }), null);
    await enregistrerCodePromo(admin.userId, codePromo({ code: "CAMPUSSEUL", offres: ["campus"] }), null);
    await enregistrerCodePromo(admin.userId, codePromo({ code: "UNEFOIS", typeRemise: "montant", valeur: 15000 }), null);
    const avant = (await db.select().from(demandesDeDevis)).length;

    expect((await devis("NIMPORTE")).error).toMatch(/n'existe pas/);
    expect((await devis("fini")).error).toMatch(/Le code FINI a expiré le/);
    expect((await devis("BIENTOT")).error).toMatch(/n'est valable qu'à partir du/);
    expect((await devis("CAMPUSSEUL")).error).toMatch(/ne s'applique pas à : Offre Programme/);
    expect((await db.select().from(demandesDeDevis)).length).toBe(avant);

    // Épuisé : une utilisation, puis plus.
    expect((await devis("UNSEUL", "Lycée A")).error).toBeNull();
    expect((await devis("UNSEUL", "Lycée B")).error).toMatch(/déjà servi le nombre de fois prévu/);

    // Une utilisation par établissement : le même UAI (ou, sans UAI, le même nom) est refusé.
    const ok = await devis("UNEFOIS", "Lycée Jean Monnet", "0591234B");
    expect(ok.error).toBeNull();
    const [unefois] = await db.select().from(demandesDeDevis).where(eq(demandesDeDevis.promoCle, "id:0591234B"));
    expect(unefois).toMatchObject({ remiseCents: 15000, prixRemiseCents: 84000 });
    expect(espaces(unefois!.remiseLibelle ?? "")).toBe("−150 €");
    expect((await devis("UNEFOIS", "Lycée J. Monnet (autre service)", "0591234 b")).error).toMatch(
      /déjà été utilisé pour cet établissement/,
    );
    expect((await devis("UNEFOIS", "Lycée Victor-Hugo")).error).toBeNull();
    expect((await devis("UNEFOIS", "lycée victor hugo")).error).toMatch(/déjà été utilisé pour cet établissement/);
    const [ligne] = await db.select().from(codesPromo).where(eq(codesPromo.code, "UNEFOIS"));
    expect(ligne!.utilisations).toBe(2);
  });

  it("une promotion affichée : une seule à la fois, datée", async () => {
    const admin = await enseignant(true);
    const fin = new Date(Date.now() + 20 * JOUR);
    await enregistrerCodePromo(admin.userId, codePromo({ code: "BANDEAU1", affiche: true, fin }), null);
    await enregistrerCodePromo(admin.userId, codePromo({ code: "BANDEAU2", affiche: true, fin, offres: ["programme"] }), null);
    const affichees = await db.select().from(codesPromo).where(eq(codesPromo.affiche, true));
    expect(affichees.map((c) => c.code)).toEqual(["BANDEAU2"]);
    expect((await lireLEtatSansCache()).promotion?.code).toBe("BANDEAU2");
    await expect(enregistrerCodePromo(admin.userId, codePromo({ code: "SANSFIN", affiche: true }), null)).rejects.toThrow(
      /datée/,
    );
    await db.update(codesPromo).set({ affiche: false });
  });
});

describe("la licence attribuée depuis une offre", () => {
  it("applique la remise au montant ; offerte : motif exigé, 0 €, lue comme telle par l'enseignant", async () => {
    const admin = await enseignant(true);
    const client = await enseignant(false);
    await attribuerUneLicence(admin.userId, client.orgId, vente({ offre: "classe", entreprise: "nova", niveau: 3, remise: { type: "montant", valeur: 4000, motif: "fidelite" } }));
    const [classe] = await db.select().from(orgLicences).where(eq(orgLicences.organizationId, client.orgId));
    expect(classe).toMatchObject({ arene: "classe", entreprises: ["nova"], niveaux: [3], prixCatalogueCents: 29000, amountCents: 25000, nature: "vendue" });
    await expect(
      attribuerUneLicence(admin.userId, client.orgId, vente({ offre: "classe", entreprise: "nova", niveau: 3, remise: { type: "pourcentage", valeur: 10, motif: "" } })),
    ).rejects.toThrow(/porte son motif/);

    const autre = await enseignant(false);
    await expect(attribuerUneLicence(admin.userId, autre.orgId, vente({ offre: "campus", nature: "offerte" }))).rejects.toThrow(
      /Une licence offerte porte son motif/,
    );
    await expect(
      attribuerUneLicence(admin.userId, autre.orgId, vente({ offre: "campus", nature: "offerte", motifGratuite: "pilote", endsAt: new Date("") })),
    ).rejects.toThrow(/Dates de licence invalides/);
    const fin = new Date("2027-08-31T12:00:00Z");
    await attribuerUneLicence(
      admin.userId,
      autre.orgId,
      vente({ offre: "campus", nature: "offerte", motifGratuite: "pilote", endsAt: fin, remise: { type: "pourcentage", valeur: 50, motif: "volume" } }),
    );
    const [offerte] = await db.select().from(orgLicences).where(eq(orgLicences.organizationId, autre.orgId));
    expect(offerte).toMatchObject({ nature: "offerte", motifGratuite: "pilote", amountCents: 0, remise: null, arene: "campus" });
    const etat = await etatDeLOffre(autre.userId);
    expect(etat.arene?.licence?.nature).toBe("offerte");
    expect(etat.arene?.licence?.nomDeLOffre).toBe("Campus");
    // La base refuse une licence offerte facturée.
    await expect(db.update(orgLicences).set({ amountCents: 100 }).where(eq(orgLicences.id, offerte!.id))).rejects.toThrow();
  });

  it("l'essai n'existe que s'il est activé, et dans sa durée maximale", async () => {
    const admin = await enseignant(true);
    const client = await enseignant(false);
    const essai = (jours: number) =>
      attribuerUneLicence(admin.userId, client.orgId, vente({ offre: "campus", nature: "essai", endsAt: new Date(Date.now() + jours * JOUR) }));
    await expect(essai(14)).rejects.toThrow(/essai d'établissement est désactivé/);
    await enregistrerLEssai(admin.userId, { autorise: true, dureeMaxJours: 30 });
    await expect(essai(60)).rejects.toThrow(/30 jours au plus/);
    await essai(14);
    const statut = await getLicenceStatus(client.orgId, new Date(), "arene");
    expect(statut.licence).toMatchObject({ nature: "essai", amountCents: 0 });
    await enregistrerLEssai(admin.userId, { autorise: false, dureeMaxJours: 30 });
  });
});

describe("la Découverte, appliquée par services/acces.service.ts", () => {
  it("les niveaux ouverts en solo et les démonstrations suivent le réglage", async () => {
    const admin = await enseignant(true);
    const sansLicence = async () => false;
    // Par défaut : niveaux 1 à 3.
    await expect(verifierLeNiveau({ niveau: 3, scenarioCode: "nova", licence: sansLicence })).resolves.toBeUndefined();
    await expect(verifierLeNiveau({ niveau: 4, scenarioCode: "nova", licence: sansLicence })).rejects.toBeInstanceOf(NiveauReserveError);

    const NON_DEMO = EPISODES.find((e) => !(EPISODES_DE_DEMO as readonly string[]).includes(e.code))!.code;
    const ANCIENNE = EPISODES_DE_DEMO[0];
    await enregistrerLaDecouverte(admin.userId, {
      solo: { active: true, entrepriseOuverte: "", niveauMaxAutres: 2 },
      demos: [NON_DEMO, ...EPISODES_DE_DEMO.slice(1)],
      niveauDesDemos: "decouverte",
    });
    expect((await getPlatformConfig()).vitrineSolo.niveauMaxAutres).toBe(2);
    await expect(verifierLeNiveau({ niveau: 3, scenarioCode: "nova", licence: sansLicence })).rejects.toThrow(
      /Les niveaux 3 à 6 sont inclus/,
    );
    const acces = await accesAuxEpisodes({ userId: null });
    expect(acces.licence).toBe(false);
    expect(episodeOuvert(acces, NON_DEMO, "decouverte")).toBe(true);
    expect(episodeOuvert(acces, NON_DEMO, "standard")).toBe(false);
    expect(episodeOuvert(acces, ANCIENNE)).toBe(false);
    // Le texte de la carte Découverte suit (variables).
    const decouverte = vueDesTarifs(await lireLeCatalogue(), variablesDuCatalogue((await lireLEtatSansCache()).decouverte)).cartes[0]!;
    expect(decouverte.inclus[0]).toContain("niveaux 1 à 2 (Découverte et Gestion)");

    // Un épisode inconnu est refusé ; le journal garde avant et après.
    await expect(enregistrerLaDecouverte(admin.userId, { ...DECOUVERTE_PAR_DEFAUT, demos: ["n-existe-pas"] })).rejects.toThrow(
      /Épisodes inconnus/,
    );
    const [entree] = (await lireLeJournal()).filter((j) => j.objet === "decouverte");
    expect((entree!.avant as { solo: { niveauMaxAutres: number } }).solo.niveauMaxAutres).toBe(3);
    expect((entree!.apres as { solo: { niveauMaxAutres: number } }).solo.niveauMaxAutres).toBe(2);

    await enregistrerLaDecouverte(admin.userId, DECOUVERTE_PAR_DEFAUT);
    expect((await getPlatformConfig()).vitrineSolo.niveauMaxAutres).toBe(3);
  });
});

describe("les modules", () => {
  it("un module descriptif s'ajoute ; un module à effet reste actif ; un module composé ne se désactive pas", async () => {
    const admin = await enseignant(true);
    await enregistrerModule(admin.userId, { code: "mobilite", nom: "Mobilité internationale", description: "Descriptif.", actif: true, ordre: 70 }, "creation");
    const c = await lireLeCatalogue();
    expect(c.modules.find((m) => m.code === "mobilite")).toMatchObject({ effet: null, actif: true });
    await expect(
      enregistrerModule(admin.userId, { code: "arene", nom: "L'arène", description: "", actif: false, ordre: 10 }, "modification"),
    ).rejects.toThrow(/reste actif/);
    await expect(
      enregistrerModule(admin.userId, { code: "lti", nom: "Intégration LMS", description: "", actif: false, ordre: 30 }, "modification"),
    ).rejects.toThrow(/Des offres le composent/);
  });
});

describe("l'affichage des prix sur le site", () => {
  it("éteint par défaut : /devis ne montre aucun montant, la demande garde le devis chiffré ; allumé, l'écran le montre", async () => {
    const admin = await enseignant(true);
    await enregistrerCodePromo(admin.userId, codePromo({ code: "SURMESURE", offres: ["programme"] }), null);
    const cache = await devis("SURMESURE", "Lycée Sur Mesure");
    expect(cache.error).toBeNull();
    expect(cache.ok?.promo).toEqual({
      code: "SURMESURE",
      montants: false,
      prixCatalogueCents: null,
      remiseCents: null,
      remiseLibelle: "",
      prixRemiseCents: null,
    });
    const [d] = await db.select().from(demandesDeDevis).where(eq(demandesDeDevis.organisation, "Lycée Sur Mesure"));
    expect(d).toMatchObject({ codePromo: "SURMESURE", prixCatalogueCents: 99000, remiseCents: 19800, prixRemiseCents: 79200 });

    await enregistrerLAffichage(admin.userId, { prixPublics: true });
    expect((await lireLEtatSansCache()).affichage).toEqual({ prixPublics: true });
    const montre = await devis("SURMESURE", "Lycée Chiffré");
    expect(montre.ok?.promo).toMatchObject({ montants: true, prixCatalogueCents: 99000, prixRemiseCents: 79200 });
    const [j] = (await lireLeJournal()).filter((x) => x.objet === "affichage");
    expect(j).toMatchObject({ avant: { prixPublics: false }, apres: { prixPublics: true } });
    await enregistrerLAffichage(admin.userId, { prixPublics: false });
  });
});

