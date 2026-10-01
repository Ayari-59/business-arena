import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ATELIERS } from "@/config/ateliers";
import { adosseAUnReferentiel } from "@/config/ateliers/referentiels";
import { GESTES } from "@/config/competences";
import {
  ECARTES,
  blocsAtteints,
  blocsDuDiplome,
  correspondanceDuDiplome,
  diplomesAdosses,
  gestesDeLAtelier,
} from "@/config/correspondance";
import {
  DESTINATION,
  rapportDeCorrespondance,
} from "../../scripts/correspondance-referentiels";

/**
 * LA TABLE NE DÉSIGNE QUE DES CHOSES QUI EXISTENT.
 *
 * Elle se déduit, donc elle ne peut pas inventer un lien : c'est sa qualité.
 * Mais elle peut en désigner un MORT, et c'est silencieux. Un geste renommé
 * dans le socle, un bloc de référentiel réécrit après lecture de l'arrêté, et
 * la déduction continue de tourner sur l'ancien nom sans que rien n'échoue —
 * la table rétrécit toute seule, et la couverture annoncée d'un diplôme avec
 * elle.
 *
 * Le danger symétrique est l'exclusion morte. Un lien écarté à la main que la
 * déduction ne produit plus laisse croire qu'une relecture a eu lieu là où
 * elle n'a plus d'objet, et masque le vrai lien quand il réapparaît sous un
 * autre nom.
 */

const DIPLOMES = diplomesAdosses();
const CODES_DE_GESTE = new Set(GESTES.map((g) => g.code));
const SEANCES = new Set(
  ATELIERS.flatMap((a) => a.seances.map((s) => `${a.code}:${s.numero}`)),
);

describe("la correspondance geste ↔ référentiel", () => {
  it("couvre les diplômes adossés à un référentiel, et eux seuls", () => {
    expect(DIPLOMES.size, "aucun diplôme adossé").toBeGreaterThan(5);
    for (const [diplome, codes] of DIPLOMES) {
      for (const code of codes) {
        expect(
          adosseAUnReferentiel(code),
          `${diplome} : ${code} n'a pas de référentiel`,
        ).toBe(true);
      }
      expect(
        correspondanceDuDiplome(diplome).length,
        `${diplome} : aucun lien`,
      ).toBeGreaterThan(0);
    }
  });

  it("chaque lien désigne un geste réel, un bloc réel, et une séance réelle", () => {
    for (const [diplome] of DIPLOMES) {
      const blocs = new Set(blocsDuDiplome(diplome));
      for (const lien of correspondanceDuDiplome(diplome)) {
        expect(
          CODES_DE_GESTE,
          `${diplome} : le geste « ${lien.geste} » n'existe pas`,
        ).toContain(lien.geste);
        expect(
          blocs,
          `${diplome} : le bloc « ${lien.referentiel} » ne lui appartient pas`,
        ).toContain(lien.referentiel);
        expect(
          lien.temoins.length,
          `${diplome} / ${lien.geste} : lien sans témoin`,
        ).toBeGreaterThan(0);
        for (const t of lien.temoins) {
          expect(
            SEANCES,
            `${diplome} : la séance témoin « ${t} » n'existe pas`,
          ).toContain(t);
        }
        // L'ambiguïté d'un lien, c'est le nombre de blocs que nommait sa
        // meilleure séance : jamais nul, jamais plus que ce qu'elle nomme.
        expect(
          lien.blocsDeLaSeance,
          `${diplome} / ${lien.geste}`,
        ).toBeGreaterThan(0);
      }
    }
  });

  it("aucun geste travaillé par un diplôme ne reste sans bloc", () => {
    // Un geste qu'une séance fait travailler sans qu'aucun bloc ne lui soit
    // lié serait une compétence que le référentiel ignore : c'est possible,
    // mais cela se saurait. Ici, toute séance nomme au moins un bloc, donc
    // tout geste qu'elle travaille en reçoit un.
    for (const [diplome, codes] of DIPLOMES) {
      const lies = new Set(
        correspondanceDuDiplome(diplome).map((l) => l.geste),
      );
      for (const code of codes) {
        for (const geste of gestesDeLAtelier(code)) {
          expect(
            lies,
            `${diplome} : « ${geste} » n'est lié à aucun bloc`,
          ).toContain(geste);
        }
      }
    }
  });

  it("toute exclusion écrite à la main porte sur un lien qui existerait", () => {
    for (const e of ECARTES) {
      expect(
        DIPLOMES.has(e.diplome),
        `exclusion pour le diplôme inconnu « ${e.diplome} »`,
      ).toBe(true);
      expect(
        CODES_DE_GESTE,
        `exclusion sur le geste inconnu « ${e.geste} »`,
      ).toContain(e.geste);
      expect(
        new Set(blocsDuDiplome(e.diplome)),
        `exclusion sur un bloc étranger à ${e.diplome}`,
      ).toContain(e.referentiel);
      expect(
        e.raison.length,
        `l'exclusion ${e.geste} → ${e.referentiel} ne dit pas pourquoi`,
      ).toBeGreaterThan(40);
    }
  });

  it("atteindre se mesure, et un atelier atteint au moins son propre diplôme", () => {
    for (const [diplome, codes] of DIPLOMES) {
      const total = blocsDuDiplome(diplome).length;
      for (const code of codes) {
        const atteints = blocsAtteints(gestesDeLAtelier(code), diplome).length;
        expect(
          atteints,
          `${code} n'atteint rien de son propre diplôme`,
        ).toBeGreaterThan(0);
        expect(
          atteints,
          `${code} atteint plus de blocs que ${diplome} n'en a`,
        ).toBeLessThanOrEqual(total);
      }
    }
  });

  it("le rapport de docs/ n'a pas vieilli", () => {
    const ecrit = readFileSync(join(process.cwd(), DESTINATION), "utf8");
    expect(
      ecrit.trim(),
      `${DESTINATION} a vieilli : npx tsx scripts/correspondance-referentiels.ts --ecrire`,
    ).toBe(rapportDeCorrespondance().trim());
  });
});
