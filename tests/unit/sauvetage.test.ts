import { describe, expect, it } from "vitest";
import {
  bloqueLaValidation,
  messageSauvetage,
  resteApresLeviers,
  verdictAuMaximum,
  verdictSauvetage,
} from "@/services/sauvetage";
import { formatEuro } from "@/lib/format";

/**
 * LA RÈGLE DU FINANCEMENT DE SAUVETAGE, ÉCRITE UNE FOIS.
 *
 * L'écran s'en sert pour dire ce qui manque et bloquer le bouton, l'action
 * serveur pour refuser une décision qui n'y répond pas, le bandeau de crise
 * pour décider s'il ouvre la demande de subvention. Trois usages, une seule
 * règle : c'est ce qui évite qu'un écran autorise ce que le serveur refusera —
 * la pire des expériences, puisque l'élève ne comprend ni pourquoi il est
 * bloqué ni ce qu'il faut changer.
 */

const exigence = { manque: 46000, capaciteEmprunt: 70000, enveloppeApport: 50000 };
/** Le mur : même en allant au bout des deux leviers, le compte n'y est pas. */
const mur = { manque: 200000, capaciteEmprunt: 40000, enveloppeApport: 30000 };

describe("verdictSauvetage", () => {
  it("emprunt et apport se cumulent : c'est le total qui compte", () => {
    expect(verdictSauvetage(exigence, { emprunt: 46000, apport: 0 }).issue).toBe("suffisant");
    expect(verdictSauvetage(exigence, { emprunt: 0, apport: 46000 }).issue).toBe("suffisant");
    expect(verdictSauvetage(exigence, { emprunt: 30000, apport: 16000 }).issue).toBe("suffisant");
  });

  it("en dessous, il dit ce qu'il reste à trouver", () => {
    const v = verdictSauvetage(exigence, { emprunt: 20000, apport: 6000 });
    expect(v.issue).toBe("manque");
    if (v.issue !== "suffisant") expect(v.reste).toBe(20000);
    expect(bloqueLaValidation(v)).toBe(true);
  });

  it("à un euro près : les montants viennent de calculs flottants", () => {
    // Refuser une décision pour 40 centimes d'écart serait incompréhensible.
    expect(verdictSauvetage(exigence, { emprunt: 45999.6, apport: 0 }).issue).toBe("suffisant");
  });

  it("des montants négatifs ne créent pas de trésorerie", () => {
    // Le garde-fou du bricolage : saisir −50 000 dans un champ ne doit pas
    // compenser un emprunt insuffisant.
    expect(verdictSauvetage(exigence, { emprunt: 46000, apport: -10000 }).issue).toBe("suffisant");
    expect(verdictSauvetage(exigence, { emprunt: -10000, apport: 10000 }).issue).toBe("manque");
  });

  it("reconnaît le mur, et y renvoie vers la demande de subvention", () => {
    const v = verdictSauvetage(mur, { emprunt: 40000, apport: 30000 });
    expect(v.issue).toBe("leviers_epuises");
    expect(bloqueLaValidation(v)).toBe(true);
    expect(messageSauvetage(v, formatEuro)).toContain("subvention");
  });

  it("sans plafond déclaré, les leviers ne sont jamais épuisés", () => {
    // Un scénario sans capacité d'endettement ni enveloppe d'apport laisse
    // toujours une porte : on ne déclare pas une impasse qui n'existe pas.
    const libre = { manque: 900000, capaciteEmprunt: null, enveloppeApport: null };
    expect(verdictSauvetage(libre, { emprunt: 0, apport: 0 }).issue).toBe("manque");
  });
});

describe("la subvention, troisième levier", () => {
  it("une subvention accordée compte comme de la trésorerie réunie", () => {
    // Elle est encaissée à la clôture du tour : c'est de l'argent aussi sûr
    // qu'un emprunt signé, et l'ignorer redemanderait à l'équipe ce qu'elle a
    // déjà obtenu.
    const avec = { ...mur, subventionAccordee: 130000 };
    expect(verdictSauvetage(avec, { emprunt: 40000, apport: 30000 }).issue).toBe("suffisant");
  });

  it("une subvention partielle rapproche le compte sans le clore", () => {
    const avec = { ...mur, subventionAccordee: 50000, demandeDeposee: true };
    const v = verdictSauvetage(avec, { emprunt: 40000, apport: 30000 });
    expect(v.issue).toBe("demande_deposee");
    if (v.issue !== "suffisant") expect(v.reste).toBe(80000);
  });

  it("le dossier déposé lève le verrou, même sans réponse", () => {
    // LE POINT DE TOUTE LA CHAÎNE : une équipe qui a épuisé ses leviers ET
    // déposé sa demande a fait tout ce qui était en son pouvoir. La bloquer
    // encore serait une impasse : elle ne pourrait ni jouer ni renoncer.
    const v = verdictSauvetage({ ...mur, demandeDeposee: true }, { emprunt: 40000, apport: 30000 });
    expect(v.issue).toBe("demande_deposee");
    expect(bloqueLaValidation(v)).toBe(false);
    expect(messageSauvetage(v, formatEuro)).toBeNull();
  });

  it("en solo, il n'y a personne à solliciter : le verrou se lève de lui-même", () => {
    const v = verdictSauvetage({ ...mur, avecAnimateur: false }, { emprunt: 40000, apport: 30000 });
    expect(v.issue).toBe("sans_recours");
    expect(bloqueLaValidation(v)).toBe(false);
  });

  it("mais tant qu'un levier reste, le solo bloque comme les autres", () => {
    // « Pas d'animateur » n'est pas un laissez-passer : c'est la réponse au
    // mur, pas à la paresse.
    const v = verdictSauvetage({ ...exigence, avecAnimateur: false }, { emprunt: 0, apport: 0 });
    expect(v.issue).toBe("manque");
    expect(bloqueLaValidation(v)).toBe(true);
  });
});

describe("ce que la subvention aurait à couvrir", () => {
  it("c'est ce qui manque une fois les DEUX leviers utilisés à fond", () => {
    // Et non ce qui manque au moment de la saisie : un champ vide parce que
    // l'élève n'a encore rien tapé ne fait pas de lui un cas désespéré.
    expect(resteApresLeviers(mur)).toBe(130000);
    expect(verdictAuMaximum(mur).issue).toBe("leviers_epuises");
  });

  it("zéro quand l'équipe peut s'en sortir seule", () => {
    expect(resteApresLeviers(exigence)).toBe(0);
    expect(verdictAuMaximum(exigence).issue).toBe("suffisant");
  });

  it("une subvention déjà accordée réduit d'autant ce qui reste à demander", () => {
    expect(resteApresLeviers({ ...mur, subventionAccordee: 30000 })).toBe(100000);
  });

  it("sans plafond déclaré, il n'y a rien à demander", () => {
    // Capacité infinie : la banque suit, le mur n'existe pas.
    expect(
      resteApresLeviers({ manque: 900000, capaciteEmprunt: null, enveloppeApport: null }),
    ).toBe(0);
  });
});
