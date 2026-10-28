import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  AVERTISSEMENT_AVANT_SUPPRESSION_JOURS,
  DEMANDES_JOURS,
  ENSEIGNANTS_INACTIFS_JOURS,
  EXAMENS_JOURS,
  INVITES_INACTIFS_JOURS,
  IP_DES_PARTIES_SOLO_JOURS,
  PARTIES_ET_RESULTATS_JOURS,
  TENTATIVES_DE_CONNEXION_HEURES,
} from "@/config/conservation";
import { appelDuCronAutorise } from "@/lib/secret-du-cron";
import { QUESTIONS_AU_TUTEUR_PAR_PARTIE } from "@/config/tuteur";

/**
 * LE RGPD, CE QUI SE VÉRIFIE SANS BASE : les durées décidées par le propriétaire, la
 * tâche de nuit et son secret, et ce que disent les mentions légales.
 *
 * Les mentions disaient « ni nom de famille » alors que l'examen enregistre nom et numéro
 * d'étudiant, taisaient l'IP des parties solo et les questions envoyées à Anthropic, et
 * promettaient des durées que rien n'appliquait. Ces gardes tombent si la page recommence
 * à dire autre chose que ce que fait le code.
 */

const lire = (f: string) => readFileSync(f, "utf8");

describe("les durées de conservation décidées", () => {
  it("sont celles d'octobre 2026", () => {
    expect(TENTATIVES_DE_CONNEXION_HEURES).toBe(24);
    expect(IP_DES_PARTIES_SOLO_JOURS).toBe(7);
    expect(INVITES_INACTIFS_JOURS).toBe(365);
    expect(PARTIES_ET_RESULTATS_JOURS).toBe(365);
    expect(EXAMENS_JOURS).toBe(365);
    expect(ENSEIGNANTS_INACTIFS_JOURS).toBe(3 * 365);
    expect(AVERTISSEMENT_AVANT_SUPPRESSION_JOURS).toBe(30);
    expect(DEMANDES_JOURS).toBe(3 * 365);
  });

  it("ne s'écrivent qu'à un seul endroit : la purge et les mentions les importent", () => {
    for (const f of ["src/services/purge.service.ts", "src/app/mentions-legales/page.tsx"]) {
      expect(lire(f), f).toContain('from "@/config/conservation"');
    }
    expect(lire("src/services/purge.service.ts")).not.toMatch(/365|24 \* 60/);
  });
});

describe("la tâche de nuit", () => {
  it("est planifiée une fois par nuit, en heure creuse en France", () => {
    const config = JSON.parse(lire("vercel.json")) as { crons?: { path: string; schedule: string }[] };
    const purge = config.crons?.find((c) => c.path === "/api/cron/purge");
    expect(purge, "tâche de purge absente de vercel.json").toBeDefined();
    const [minute, heure, jour, mois, semaine] = purge!.schedule.split(" ");
    expect(Number(minute)).toBeGreaterThanOrEqual(0);
    // Vercel compte en UTC : entre 1 h et 3 h UTC, c'est entre 2 h et 5 h à Paris.
    expect(Number(heure)).toBeGreaterThanOrEqual(1);
    expect(Number(heure)).toBeLessThanOrEqual(3);
    expect([jour, mois, semaine]).toEqual(["*", "*", "*"]);
  });

  it("refuse tout appel quand CRON_SECRET manque, ou quand l'en-tête ne correspond pas", () => {
    expect(appelDuCronAutorise("Bearer ", undefined)).toBe(false);
    expect(appelDuCronAutorise("Bearer undefined", undefined)).toBe(false);
    expect(appelDuCronAutorise("Bearer ", "")).toBe(false);
    expect(appelDuCronAutorise(null, "s3cret-de-test")).toBe(false);
    expect(appelDuCronAutorise("Bearer autre", "s3cret-de-test")).toBe(false);
    expect(appelDuCronAutorise("s3cret-de-test", "s3cret-de-test")).toBe(false);
    expect(appelDuCronAutorise("Bearer s3cret-de-test", "s3cret-de-test")).toBe(true);
  });

  it("la route vérifie le secret avant de purger", () => {
    const route = lire("src/app/api/cron/purge/route.ts");
    expect(route).toContain("process.env.CRON_SECRET");
    expect(route.indexOf("appelDuCronAutorise(")).toBeLessThan(route.indexOf("await purger("));
    expect(route).toContain("status: 401");
  });
});

describe("les mentions légales disent ce que fait le code", () => {
  const page = lire("src/app/mentions-legales/page.tsx");

  it("ne prétendent plus qu'aucun nom n'est demandé, et parlent des examens", () => {
    expect(page).not.toMatch(/ni nom de famille/);
    expect(page).toMatch(/nom et le numéro d&apos;étudiant/);
    expect(page).toContain("data-ligne-examens");
  });

  it("déclarent l'adresse IP des parties solo et sa durée", () => {
    expect(page).toContain("data-ligne-ip-solo");
    expect(page).toContain("DUREES.ipSolo");
  });

  it("déclarent ce qui part chez Anthropic, et les transferts hors de l'Union", () => {
    expect(page).toMatch(/questions que les élèves posent au tuteur/);
    expect(page).toMatch(/justifications écrites par les équipes/);
    for (const prestataire of ["Vercel", "Resend", "Google", "Anthropic"]) expect(page).toContain(prestataire);
    expect(page).toContain("clauses\n            contractuelles types de la Commission européenne");
    expect(page).toContain("cadre de protection des\n            données UE-États-Unis");
  });

  it("citent chaque durée depuis config/conservation.ts", () => {
    for (const d of ["tentatives", "ipSolo", "invites", "parties", "examens", "enseignants", "demandes"]) {
      expect(page, d).toContain(`{DUREES.${d}}`);
    }
    expect(page).not.toContain("3 ans après le dernier contact");
    expect(page).toContain("{QUESTIONS_AU_TUTEUR_PAR_PARTIE}");
    expect(QUESTIONS_AU_TUTEUR_PAR_PARTIE).toBeGreaterThan(0);
  });

  it("disent comment exercer ses droits, CNIL comprise, avec le contact de l'éditeur inchangé", () => {
    for (const droit of ["accès", "rectification", "effacement", "portabilité"]) expect(page).toContain(droit);
    expect(page).toContain("Exporter mes données");
    expect(page).toContain("Supprimer mon compte");
    expect(page).toContain("{EDITEUR.contact}");
    expect(page).toMatch(/réclamation à la CNIL/);
    expect(page).toContain("contact: VENDEUR.contact");
  });
});

describe("l'espace enseignant", () => {
  it("propose l'export et la suppression, confirmée dans la page, jamais par confirm()", () => {
    const compte = lire("src/app/teacher/compte/page.tsx");
    expect(compte).toContain('href="/teacher/compte/export"');
    expect(compte).toContain("<SuppressionConfirmee");
    for (const f of [
      "src/components/suppression-confirmee.tsx",
      "src/app/teacher/compte/page.tsx",
      "src/app/admin/effacements/page.tsx",
    ]) {
      expect(lire(f), f).not.toMatch(/\bconfirm\(/);
    }
  });
});
