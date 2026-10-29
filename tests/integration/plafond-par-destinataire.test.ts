import { describe, expect, it, vi } from "vitest";

/**
 * LES FORMULAIRES PUBLICS NE FONT PAS ÉCRIRE SANS FIN À UNE MÊME ADRESSE (audit, P2-4).
 *
 * Rendez-vous, devis, demande de simulation : chacun envoie un courriel à l'adresse saisie
 * (ou répond à elle). Ils n'étaient plafonnés que par adresse d'origine : en changeant
 * d'IP, un script faisait écrire à un tiers autant qu'il voulait (le devis et la
 * simulation n'avaient qu'un délai de dix minutes par adresse, soit 144 courriels par
 * jour). Chacun a maintenant un plafond par destinataire sur 24 heures, quelle que soit
 * l'adresse d'origine.
 */

vi.mock("@/db", async () => {
  const { createTestDb } = await import("./helpers/test-db");
  return { db: await createTestDb() };
});

const { PLAFOND_PAR_DESTINATAIRE_PAR_JOUR } = await import("@/config/plafonds-des-formulaires");
const { deposerDemandeOrientation, DELAI_MEME_EMAIL_MS } = await import("@/services/orientation-request.service");
const { deposerDemandeDeDevis } = await import("@/services/devis.service");
const { reserverRendezVous, creneauxProposes } = await import("@/services/rendez-vous.service");

const HEURE = 3_600_000;
const ip = (i: number) => `198.51.100.${10 + i}`;

describe("plafond par destinataire", () => {
  it("vaut trois envois par jour", () => {
    expect(PLAFOND_PAR_DESTINATAIRE_PAR_JOUR).toBe(3);
  });

  it("demande de simulation : au-delà du plafond, refusée même d'une autre adresse d'origine", async () => {
    const t0 = Date.now() + 10 * 24 * HEURE;
    const email = "victime-orientation@exemple.fr";
    const demande = (i: number) => ({
      name: "Mme Martin", school: "Lycée Pasteur", email, diplome: "cg1", semestre: "s1" as const,
      objectif: "tresorerie", message: "", ip: ip(i),
    });
    for (let i = 0; i < PLAFOND_PAR_DESTINATAIRE_PAR_JOUR; i++) {
      const r = await deposerDemandeOrientation(demande(i), t0 + i * (DELAI_MEME_EMAIL_MS + 1));
      expect("id" in r, `demande ${i}`).toBe(true);
    }
    const trop = await deposerDemandeOrientation(demande(9), t0 + 5 * HEURE);
    expect(trop).toMatchObject({ error: expect.stringContaining("cette adresse e-mail") });
    // Le lendemain, la porte se rouvre.
    const lendemain = await deposerDemandeOrientation(demande(8), t0 + 25 * HEURE);
    expect("id" in lendemain).toBe(true);
  });

  it("devis : même règle", async () => {
    const t0 = Date.now() + 20 * 24 * HEURE;
    const email = "Victime-Devis@exemple.fr";
    const demande = (i: number) => ({
      offre: "classe", libelles: {} as never, nom: "Mme Martin", fonction: "Professeure",
      organisation: "Lycée Pasteur", identifiant: "", effectif: null, email, message: "", ip: ip(i),
    });
    for (let i = 0; i < PLAFOND_PAR_DESTINATAIRE_PAR_JOUR; i++) {
      const r = await deposerDemandeDeDevis(demande(i), t0 + i * (DELAI_MEME_EMAIL_MS + 1));
      expect("id" in r, `demande ${i}`).toBe(true);
    }
    const trop = await deposerDemandeDeDevis(demande(9), t0 + 5 * HEURE);
    expect(trop).toMatchObject({ error: expect.stringContaining("cette adresse e-mail") });
  });

  it("rendez-vous téléphonique : même règle", async () => {
    const now = new Date("2026-09-16T10:00:00Z");
    const sansAgenda = { agenda: null };
    const { jours } = await creneauxProposes(now, sansAgenda);
    const libres = jours.flatMap((j) => j.creneaux).slice(0, PLAFOND_PAR_DESTINATAIRE_PAR_JOUR + 1);
    const demande = (i: number) => ({
      name: "Mme Martin", school: "Lycée Pasteur", email: "victime-rdv@exemple.fr", phone: "06 12 34 56 78",
      message: "", debut: new Date(libres[i]!.iso), ip: ip(i),
    });
    for (let i = 0; i < PLAFOND_PAR_DESTINATAIRE_PAR_JOUR; i++) {
      const r = await reserverRendezVous(demande(i), now, sansAgenda);
      expect("id" in r, `réservation ${i}`).toBe(true);
    }
    const trop = await reserverRendezVous(demande(PLAFOND_PAR_DESTINATAIRE_PAR_JOUR), now, sansAgenda);
    expect(trop).toMatchObject({ error: expect.stringContaining("cette adresse e-mail") });
  });
});
