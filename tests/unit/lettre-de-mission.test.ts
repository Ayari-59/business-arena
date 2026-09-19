import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({ db: {} }));
vi.mock("next/headers", () => ({ headers: vi.fn(), cookies: vi.fn() }));

import { CourrierRecommande } from "@/components/courrier";
import { MandatDeLEquipe } from "@/components/mandat-de-lequipe";
import { DIFFICULTY_PRESETS } from "@/config/difficulty";
import { LETTRES_DE_MISSION, lettreDeMission } from "@/config/courriers/mission";

/**
 * LA LETTRE DE MISSION : qui vous a demandé de décider.
 *
 * Les leviers du niveau sont tous ouverts dès le premier écran de décision, et
 * aucun n'avait été réclamé par personne. Une note des associés au premier
 * tour dit qui confie quoi. Elle ne change aucun compte : c'est un mandat, pas
 * un événement.
 */
const lettre = (code: string) =>
  renderToStaticMarkup(
    createElement(CourrierRecommande, { code, destinataire: "ÉQUIPE MARTIN" }),
  );

describe("un mandat par niveau", () => {
  it("il y en a exactement un pour chaque niveau de difficulté", () => {
    // Un niveau sans mandat retomberait sur celui du niveau 1 et promettrait
    // moins de leviers que l'élève n'en a : le silence vaudrait mieux.
    expect(LETTRES_DE_MISSION.length).toBe(DIFFICULTY_PRESETS.length);
    for (const preset of DIFFICULTY_PRESETS) {
      expect(lettreDeMission(preset.level).code).toBe(`mission_niveau_${preset.level}`);
    }
  });

  it("un niveau inconnu reçoit le mandat le plus étroit", () => {
    // Mieux vaut annoncer trop peu que promettre un levier fermé.
    expect(lettreDeMission(0).code).toBe("mission_niveau_1");
    expect(lettreDeMission(99).code).toBe("mission_niveau_1");
  });

  it("chaque mandat annonce les domaines que son niveau ouvre", () => {
    // Le texte nomme des DOMAINES, jamais des champs : un scénario sans flotte
    // n'a pas d'investissement en machines, et la lettre resterait vraie.
    const attendu: Record<number, string[]> = {
      1: ["prix", "volume"],
      2: ["qualité", "maintenance"],
      3: ["finance", "couvre"],
      4: ["investissements", "employons"],
      5: ["excédents", "placée"],
      6: ["distribué", "réserve"],
    };
    for (const [niveau, mots] of Object.entries(attendu)) {
      const c = lettreDeMission(Number(niveau));
      const texte = `${c.objet} ${c.corps} ${c.enJeu}`.toLowerCase();
      for (const mot of mots) {
        expect(texte, `le mandat du niveau ${niveau} ne parle pas de « ${mot} »`).toContain(mot);
      }
    }
  });
});

describe("un mandat n'est pas un événement", () => {
  it("il circule en interne, sans timbre", () => {
    // Un mandat vient de l'intérieur de la maison : il ne s'affranchit pas.
    for (const c of LETTRES_DE_MISSION) {
      expect(c.pli).toBe("interne");
      expect(c.scope).toBe("team");
    }
    expect(lettre("mission_niveau_4")).not.toContain("enveloppe-timbre");
  });

  it("il ne promet aucun effet : ni éclair, ni pastille de durée", () => {
    /*
     * La faute à empêcher : le traitement des courriers à effet. L'éclair et
     * les pastilles annoncent une conséquence mécanique sur les comptes. Un
     * mandat n'en a aucune, et les élèves la chercheraient.
     */
    const html = lettre("mission_niveau_4");
    expect(html).toContain("🗂️");
    expect(html).not.toContain("⚡");
    expect(html).toContain("Aucun effet sur les comptes");
  });

  it("son pied le nomme, il ne se fait pas passer pour un courrier de routine", () => {
    // Les deux piles vivent hors du registre, donc sans numéro de liasse. Le
    // pied disait « Courrier de routine » pour tout ce qui n'était pas numéroté.
    expect(lettre("mission_niveau_1")).toContain("Lettre de mission");
    expect(lettre("mission_niveau_1")).not.toContain("Courrier de routine");
  });
});

describe("un mandat se lit une fois et se range", () => {
  /*
   * Il arrive au premier tour, exactement là où l'élève a déjà le plus à lire :
   * le contexte de l'entreprise, les alertes, la situation. Quatre blocs de
   * texte empilés, et on ne lit plus le premier. Lu, il ne laisse qu'une ligne.
   */
  const mandat = (ouvert: boolean) =>
    renderToStaticMarkup(
      createElement(MandatDeLEquipe, {
        gameId: "partie-1",
        niveau: 3,
        equipe: "ÉQUIPE MARTIN",
        ouvert,
      }),
    );

  it("ouvert, il porte la lettre du niveau et de quoi en prendre note", () => {
    const html = mandat(true);
    expect(html).toContain("Votre mandat — direction, production et finances");
    expect(html).toContain("J&#x27;ai pris note");
  });

  it("à l'arrivée, il n'est qu'une ligne : le premier écran en porte déjà trois", () => {
    const html = mandat(false);
    expect(html).toContain("Lire");
    expect(html).toContain("Votre mandat — direction, production et finances");
    // L'objet porte déjà « Votre mandat » : le préfixer le répétait mot pour mot.
    expect(html).not.toContain("Votre mandat : Votre mandat");
    // « Lire » et non « Relire » : à l'arrivée, rien n'a encore été lu.
    expect(html).not.toContain("Relire");
    /*
     * ET SURTOUT PAS LA LETTRE. C'est tout l'objet de l'état plié : le premier
     * écran de la partie porte déjà la situation de l'entreprise et son
     * contexte. Un troisième texte déplié, et on n'en lit plus aucun.
     */
    expect(html).not.toContain("Nous vous confions la conduite de la maison");
    expect(html).not.toContain("J&#x27;ai pris note");
  });
});

describe("le mandat tient en deux phrases", () => {
  it("aucun ne dépasse deux phrases ni 260 caractères", () => {
    /*
     * Les premières versions faisaient cinq lignes chacune. Or ce mandat
     * s'ouvre sur l'écran le plus chargé de la partie : un texte long de plus,
     * et les trois se neutralisent. Un mandat se retient parce qu'il est court.
     */
    for (const c of LETTRES_DE_MISSION) {
      const phrases = c.corps.split(/[.!?]\s/).filter(Boolean);
      expect(phrases.length, `${c.code} fait ${phrases.length} phrases`).toBeLessThanOrEqual(2);
      expect(c.corps.length, `${c.code} fait ${c.corps.length} caractères`).toBeLessThanOrEqual(260);
    }
  });
});
