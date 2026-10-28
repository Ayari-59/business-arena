import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ficheParCode, hasardDeLaClasse } from "../../src/config/episodes/fiches";
import { TRACES } from "../../src/config/episodes/traces";
import type { Episode, Resultat } from "../../src/config/episodes/types";
import { GRAINES_DU_BILAN } from "../../src/engine/episodes/commun";
import { EPISODES } from "../../src/pedagogy/episodes/registre";

/**
 * LES DÉFAUTS MÉCANIQUES DES ÉPISODES, BALAYÉS SUR TOUT LE REGISTRE.
 *
 * L'audit d'octobre 2026 a relevé, épisode par épisode, des défauts qu'aucun test ne voyait :
 * un en-tête qui annonçait l'épisode 96 pour le numéro 100, des constantes de personnages
 * restées au nom d'avant (`PASCALE` pour Murielle Andrieu), le mandat de l'épisode 64 qui
 * affichait les 264 k€ que la prévision demande, un objectif de litiges que la meilleure
 * méthode ne tenait sous aucun tirage (épisode 50), et des corrigés de prévision tirés d'un
 * tirage extrême, que les sources ne permettaient pas de retrouver. Chaque garde ci-dessous
 * balaie les 113 épisodes ; ses exceptions sont nommées, et une exception qui n'en est plus
 * une fait échouer le test, pour que la liste ne grossisse pas en silence.
 */

const racine = process.cwd();
const fichiersDe = (code: string) =>
  [
    `src/config/episodes/${code}.ts`,
    `src/config/episodes/fiches/${code}.ts`,
    `src/pedagogy/episodes/${code}.ts`,
    `src/engine/episodes/${code}.ts`,
  ].filter((f) => existsSync(join(racine, f)));

const NOMBRE = /\d{1,3}(?:[  ]\d{3})+(?:,\d+)?|\d+(?:,\d+)?/g;
const valeur = (s: string) => Number(s.replace(/[  ]/g, "").replace(",", "."));
const nombres = (texte: string) => (texte.match(NOMBRE) ?? []).map(valeur);

/** Les simulations de chaque référence sous les trente tirages du bilan, calculées une fois. */
const memo = new Map<string, Resultat[][]>();
function simulations(ep: Episode): Resultat[][] {
  let s = memo.get(ep.code);
  if (!s) {
    s = ep.references.map((r) =>
      GRAINES_DU_BILAN.map((g) => ep.simuler(r.chemin, g, ep.enquete.joursSansPerte)),
    );
    memo.set(ep.code, s);
  }
  return s;
}

describe("les en-têtes", () => {
  for (const ep of EPISODES) {
    it(`${ep.numero} ${ep.code} : aucun fichier n'annonce un autre numéro`, () => {
      for (const f of fichiersDe(ep.code)) {
        const entete = readFileSync(join(racine, f), "utf8").match(/^\s*\/\*\*[\s\S]*?\*\//)?.[0] ?? "";
        for (const m of entete.matchAll(/ÉPISODE\s+(\d+)/gi)) expect(Number(m[1]), f).toBe(ep.numero);
      }
    });
  }
});

/**
 * Une constante de personnage porte son prénom ou son nom ; sinon, un rôle ou une institution
 * de cette liste. `PASCALE = { de: "Murielle Andrieu" }` est le reste d'un personnage renommé.
 */
const ROLES = new Set([
  "ACHATS", "AGENCE", "AGENCE_WEB", "ALPINE", "ALTAIR", "ANALYSTE", "ARS", "ASSUREUR", "ATELIER",
  "AVOCATE", "BANQUE", "BREVENT", "CABINET", "CADRE", "CELTIS", "CHEF", "CIMIER", "CLAIRVAL",
  "CONTROLEUR", "CSE", "DELEGUES", "DEPARTEMENT", "DG", "DIRECTION", "EDITEUR", "EQUIPE_SI",
  "FAMILLE", "FERLANE", "GESTION", "GREFFE", "HALDEN", "IDEC", "INTERIM", "JURISTE", "MANDATAIRE",
  "METROPOLE", "MONTBARD_DIR", "NORVIA", "ORMEA", "PLACOVA", "PRESIDENT", "PRESTATAIRE", "RELAIS",
  "RH", "SERVICE", "SIEGE", "TABLEAU", "TECHNICIEN", "VALCOURT", "VANTREL",
]);
const identifiant = (s: string) =>
  s
    .replace(/ł/g, "l")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/['’]/g, "")
    .replace(/[\s-]+/g, "_");

describe("les noms des personnages", () => {
  for (const ep of EPISODES) {
    it(`${ep.numero} ${ep.code} : chaque constante porte le nom de la personne qu'elle désigne`, () => {
      for (const f of fichiersDe(ep.code)) {
        const source = readFileSync(join(racine, f), "utf8");
        for (const m of source.matchAll(/const ([A-Z_]+) = \{\s*de: "([^"]+)"/g)) {
          const [, constante, nom] = m as unknown as [string, string, string];
          const complet = identifiant(nom);
          const morceaux = complet.split("_");
          const porteSonNom =
            morceaux.includes(constante) || complet.endsWith(constante) || complet.startsWith(constante);
          expect(porteSonNom || ROLES.has(constante), `${f} : ${constante} = « ${nom} »`).toBe(true);
        }
      }
    });
  }
});

/**
 * Le mandat ne donne pas la réponse de la prévision. Ces épisodes ont un objectif ou un
 * paramètre du mandat qui tombe, par construction, près du chiffre demandé : ce n'est pas le
 * chiffre prévu, et l'élève doit encore le construire.
 */
const MANDATS_QUI_COINCIDENT: Readonly<Record<string, string>> = {
  "prix-qui-ne-passe-plus": "28 % de taux de marge visé : l'objectif, que la bonne hausse atteint presque",
  "depot-qui-deborde": "85 % d'occupation au plus : un objectif d'occupation, la prévision porte sur le taux de service",
  "panne-qui-paralyse": "65 % d'activité et 65 sur 100 de confiance : des seuils, la prévision porte sur l'activité réelle",
  "tournees-qui-debordent": "8 % de retards au plus : l'objectif, que la bonne méthode frôle",
  "projet-qui-glisse": "200 k€ de budget : le budget, la prévision porte sur le coût à terminaison",
  "nouveau-service": "12 agences selon la direction : une hypothèse à corriger, pas la demande",
  "bureau-qui-s-echauffe": "60 factures en attente au plus : une semaine de factures, que le repère de la prévision donne volontairement (seconde professionnelle)",
  "chambres-bradees": "17 % de commission : un paramètre du contrat",
  "diplome-qui-compte": "12 départs au plus : l'objectif de la saison",
  "generaliste-ou-specialiste": "1 050 € le jour : le prix du marché santé, la prévision porte sur le prix tenu",
  "dossier-de-soins": "70 % des transmissions : l'objectif de juin",
};

describe("la prévision ne se lit ni dans le mandat ni dans l'exemple de saisie", () => {
  for (const ep of EPISODES) {
    it(`${ep.numero} ${ep.code}`, () => {
      const reponse = ficheParCode(ep.code)!.calcul.reponse;
      const { juste } = TRACES[ep.code]!.prevision;
      const pres = (x: number) => Math.abs(x - reponse) < juste;

      // L'exemple de saisie reprend un chiffre que la semaine 1 montre (arrondi), jamais la réponse
      // elle-même : « Le client qui s'en va » proposait 910, son corrigé, pour 920 artisans actifs.
      const graine = hasardDeLaClasse(ep.code);
      const lecture = ep.lire([], graine, ep.enquete.joursSansPerte, 0);
      const ctx = ep.contexte(lecture, []);
      const montres = [
        ...Object.values(lecture).flatMap((v) => (typeof v === "number" ? [v, v * 100] : [])),
        ...ep.etapes[0]!.messages(ctx).flatMap((m) => nombres(m.texte)),
        ...ep.mandat.flatMap((m) => nombres(`${m.fort} ${m.texte}`)),
      ];
      for (const x of nombres(ep.prevision.placeholder)) {
        if (pres(x)) {
          expect(
            montres.some((v) => Math.abs(v - x) < 1e-6 || Math.round(v) === x),
            `exemple de saisie ${x}, réponse ${reponse}`,
          ).toBe(true);
        }
      }

      const fuites = ep.mandat
        .flatMap((m) => nombres(`${m.fort} ${m.texte}`).map((x) => [x, `${m.fort} ${m.texte}`] as const))
        .filter(([x]) => pres(x));
      if (MANDATS_QUI_COINCIDENT[ep.code]) expect(fuites.length, "exception devenue inutile").toBeGreaterThan(0);
      else expect(fuites.map(([, t]) => t), `réponse ${reponse} à ${juste} près`).toEqual([]);
    });
  }
});

/**
 * Un objectif annoncé au bilan (« objectif », « plafond », « au plus », « au moins ») est tenu
 * au moins une fois par l'une des trois manières de décider, sous les trente tirages. La liste
 * des exceptions est vide : les objectifs des épisodes 10, 18, 49, 63 et 104 ont été ramenés à ce
 * que la meilleure méthode tient (décision du propriétaire, octobre 2026).
 */
const OBJECTIFS_A_ARBITRER: Readonly<Record<string, readonly string[]>> = {};

describe("un objectif annoncé est atteignable", () => {
  for (const ep of EPISODES) {
    it(
      `${ep.numero} ${ep.code}`,
      () => {
        const tenus = new Map<string, number>();
        for (const parReference of simulations(ep)) {
          for (const t of parReference) {
            for (const tuile of ep.bilan.tuiles(t)) {
              if (!/objectif|plafond|au plus|au moins/i.test(tuile.aide)) continue;
              tenus.set(tuile.nom, (tenus.get(tuile.nom) ?? 0) + (tuile.tenu ? 1 : 0));
            }
          }
        }
        const jamais = [...tenus].filter(([, n]) => n === 0).map(([nom]) => nom);
        expect(jamais).toEqual(OBJECTIFS_A_ARBITRER[ep.code] ?? []);
      },
      60_000,
    );
  }
});

/**
 * Le corrigé de la prévision se calcule avec les sources : il tombe, à la marge du « juste »
 * près, sur la valeur médiane des trente tirages pour la meilleure méthode. Un corrigé tiré d'un
 * tirage extrême ne se retrouve pas, et l'élève qui calcule bien est jugé « proche ». L'épisode 1
 * a changé de tirage de la classe pour cela (n° 28 au lieu du n° 19) : plus d'exception.
 */
const PREVISIONS_A_ARBITRER: Readonly<Record<string, string>> = {};

describe("le corrigé de la prévision se calcule avec les sources", () => {
  for (const ep of EPISODES) {
    it(
      `${ep.numero} ${ep.code}`,
      () => {
        const valeurs = simulations(ep)[0]!.map((t) => ep.prevision.reel(t)).sort((a, b) => a - b);
        const mediane = (valeurs[14]! + valeurs[15]!) / 2;
        const reponse = ficheParCode(ep.code)!.calcul.reponse;
        const { juste } = TRACES[ep.code]!.prevision;
        const calculable = Math.abs(reponse - mediane) < juste;
        expect(calculable, `corrigé ${reponse}, médiane ${mediane.toFixed(2)}, juste à ${juste}`).toBe(
          !PREVISIONS_A_ARBITRER[ep.code],
        );
      },
      60_000,
    );
  }
});
