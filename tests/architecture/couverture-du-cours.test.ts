import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  blocOfficiel,
  REFERENTIELS,
  REFERENTIELS_DES_FORMATIONS,
  referentielDeCitation,
} from "@/config/ateliers/referentiels";
import { ATELIERS } from "@/config/ateliers";
import { BLOCS_DES_EPISODES } from "@/config/episodes/blocs";
import { HORS_DU_CHAMP } from "@/config/hors-du-champ";
import { episodeParCode } from "@/pedagogy/episodes/registre";
import {
  blocsDeLEpisode,
  blocsDuChapitre,
  couvertureDeLaFormation,
  coursDeLaFormation,
  formationsAvecUnePage,
  referentielDeLaFormation,
  tableauDeCouverture,
} from "@/config/couverture";
import { CHAPITRES, PARCOURS } from "@/config/cours/registre";
import { FORMATIONS, formationParCode } from "@/config/formations";

/**
 * Ce test parcourt tout le catalogue, dans chaque entreprise : sa durée croît avec chaque
 * chapitre et chaque cas pratique. Les cinq secondes par défaut de vitest ne suffisent plus
 * quand la suite entière tourne en parallèle.
 */
const PARCOURT_TOUT_LE_CATALOGUE = 30_000;

/**
 * LE COURS ENTRE DANS LA COUVERTURE, ET CE QU'IL CITE EXISTE.
 *
 * Les chapitres déclarent les blocs qu'ils font travailler, préfixés du
 * diplôme dont ils viennent. Trois dangers, et une garde pour chacun.
 *
 * Le premier : un bloc cité qui ne désigne rien. Un préfixe mal écrit, un
 * intitulé de mémoire, et le chapitre disparaît du tableau sans erreur nulle
 * part, ce qui est exactement le silence que la dérivation devait supprimer.
 *
 * Le deuxième : un chapitre qui ne paraît chez aucun diplôme. Il existerait
 * sur la carte du cours et nulle part où un enseignant vérifie son programme.
 *
 * Le troisième : un tableau qui ne reprend pas le texte entier. Une entrée que
 * rien ne travaille doit se lire comme telle, pas manquer.
 */

const PAGE = readFileSync(
  join(process.cwd(), "src/app/parcours/[formation]/page.tsx"),
  "utf8",
);

describe("la couverture par le cours", () => {
  it("chaque bloc cité par un chapitre porte le préfixe d'un diplôme et désigne une entrée du texte", () => {
    const cites = CHAPITRES.flatMap((c) => c.blocs);
    expect(cites.length, "aucun chapitre ne cite de bloc").toBeGreaterThan(40);
    for (const c of CHAPITRES) {
      for (const bloc of c.blocs) {
        const cite = referentielDeCitation(bloc);
        expect(cite, `${c.code} : « ${bloc} » ne porte le préfixe d'aucun diplôme`).not.toBeNull();
        expect(
          blocOfficiel(bloc, cite!.code),
          `${c.code} : « ${bloc} » ne désigne aucune entrée du texte, ou en désigne deux`,
        ).not.toBeNull();
      }
      expect(new Set(c.blocs).size, `${c.code} : un bloc cité deux fois`).toBe(c.blocs.length);
    }
  });

  it("un chapitre sans bloc appartient au parcours d'une formation, qui le présente", () => {
    // Un chapitre de discipline ne paraît chez un diplôme que par ses blocs :
    // sans eux, il n'apparaîtrait nulle part.
    const sansBloc = CHAPITRES.filter((c) => c.blocs.length === 0);
    for (const c of sansBloc) {
      const parcours = PARCOURS.find((p) => p.code === c.parcours)!;
      expect(parcours.formation, `${c.code} ne cite aucun bloc et son parcours ne suit aucune formation`).toBeDefined();
    }
  });

  it("tout chapitre paraît sur la page d'au moins un diplôme", () => {
    const pages = formationsAvecUnePage().map((f) => f.code);
    for (const c of CHAPITRES) {
      const chez = pages.filter((f) =>
        coursDeLaFormation(f).some((g) => g.chapitres.some((x) => x.code === c.code)),
      );
      expect(chez.length, `${c.code} ne paraît chez aucun diplôme`).toBeGreaterThan(0);
    }
  }, PARCOURT_TOUT_LE_CATALOGUE);

  it("la formation qu'un parcours du cours suit existe, et a sa page", () => {
    const suivies = PARCOURS.filter((p) => p.formation);
    expect(suivies.length, "aucun parcours ne suit de formation").toBeGreaterThan(2);
    const pages = new Set(formationsAvecUnePage().map((f) => f.code));
    for (const p of suivies) {
      expect(formationParCode(p.formation!), `${p.code} suit « ${p.formation} », qui n'existe pas`).toBeDefined();
      expect(pages, `${p.formation} n'a pas de page`).toContain(p.formation);
    }
  });

  it("chaque chapitre paraît sur la ligne des blocs qu'il cite, et seulement là", () => {
    for (const f of formationsAvecUnePage()) {
      const blocs = couvertureDeLaFormation(f.code);
      for (const c of CHAPITRES) {
        const attendus = new Set(blocsDuChapitre(c, f.code));
        const lignes = new Set(
          blocs.filter((b) => b.chapitres.some((x) => x.code === c.code)).map((b) => b.officiel),
        );
        expect(lignes, `${f.code} / ${c.code}`).toEqual(attendus);
      }
    }
  });

  it("le cours et les épisodes seuls ne font jamais d'un bloc le cœur du jeu", () => {
    // Seul le moteur rejoue un bloc à chaque tour ; un chapitre se fait une
    // fois, un épisode se joue sur un trimestre.
    let seuls = 0;
    let parUnEpisode = 0;
    for (const f of formationsAvecUnePage()) {
      for (const b of couvertureDeLaFormation(f.code)) {
        if (b.presences.length > 0) continue;
        seuls++;
        const n = b.chapitres.length + b.situations.length;
        if (b.situations.length > 0) parUnEpisode++;
        expect(n, `${f.code} / ${b.referentiel} : ligne vide`).toBeGreaterThan(0);
        expect(b.adequation, `${f.code} / ${b.referentiel}`).not.toBe("coeur");
        expect(b.adequation, `${f.code} / ${b.referentiel}`).toBe(n >= 2 ? "couvert" : "partiel");
      }
    }
    expect(seuls, "aucun bloc travaillé par le seul cours : la règle ne garde rien").toBeGreaterThan(0);
    expect(parUnEpisode, "aucun bloc travaillé par un épisode : la règle ne garde rien").toBeGreaterThan(0);
  });

  it("chaque épisode cité existe, et chaque bloc qu'il cite désigne une entrée du texte", () => {
    const codes = Object.keys(BLOCS_DES_EPISODES);
    expect(codes.length, "aucun épisode ne cite de bloc").toBeGreaterThan(10);
    for (const code of codes) {
      expect(episodeParCode(code), `« ${code} » n'est pas un épisode`).toBeDefined();
      const blocs = BLOCS_DES_EPISODES[code]!;
      expect(blocs.length, `${code} : aucun bloc`).toBeGreaterThan(0);
      expect(new Set(blocs).size, `${code} : un bloc cité deux fois`).toBe(blocs.length);
      for (const bloc of blocs) {
        const cite = referentielDeCitation(bloc);
        expect(cite, `${code} : « ${bloc} » ne porte le préfixe d'aucun diplôme`).not.toBeNull();
        expect(
          blocOfficiel(bloc, cite!.code),
          `${code} : « ${bloc} » ne désigne aucune entrée du texte, ou en désigne deux`,
        ).not.toBeNull();
      }
    }
  });

  it("chaque épisode paraît sur la ligne des blocs qu'il cite, et seulement là", () => {
    for (const f of formationsAvecUnePage()) {
      const blocs = couvertureDeLaFormation(f.code);
      for (const code of Object.keys(BLOCS_DES_EPISODES)) {
        const attendus = new Set(blocsDeLEpisode(code, f.code));
        const lignes = new Set(
          blocs.filter((b) => b.situations.some((s) => s.code === code)).map((b) => b.officiel),
        );
        expect(lignes, `${f.code} / ${code}`).toEqual(attendus);
      }
    }
  });

  it("le tableau d'un diplôme dont le texte a été lu reprend chaque entrée, une fois, dans l'ordre", () => {
    let lus = 0;
    for (const f of formationsAvecUnePage()) {
      const referentiel = referentielDeLaFormation(f.code);
      const { lignes } = tableauDeCouverture(f.code);
      if (!referentiel) {
        // Sans texte, le tableau reprend ce que les ateliers citent, et rien d'autre.
        expect(lignes.every((l) => l.couverture), `${f.code} : une ligne vide sans texte`).toBe(true);
        continue;
      }
      lus++;
      expect(
        lignes.map((l) => l.bloc),
        `${f.code} : le tableau ne suit pas le texte`,
      ).toEqual([...referentiel.entrees]);
      // Ce qui ne figure pas au tableau ne figure pas non plus dans la couverture.
      const couverts = lignes.filter((l) => l.couverture).length;
      expect(couverts, `${f.code}`).toBe(couvertureDeLaFormation(f.code).length);
    }
    expect(lus, "aucun diplôme au texte lu").toBeGreaterThan(4);
  });

  it("les parties d'un référentiel comptent toutes ses entrées", () => {
    for (const [code, r] of Object.entries(REFERENTIELS)) {
      if (!r.parties) continue;
      expect(
        r.parties.reduce((n, p) => n + p.entrees, 0),
        `${code} : les parties ne comptent pas toutes les entrées`,
      ).toBe(r.entrees.length);
    }
    // Le lycée numérote ses thèmes programme par programme : la partie dit lequel.
    const { lignes } = tableauDeCouverture("stmg");
    expect(new Set(lignes.map((l) => l.partie)).size).toBe(REFERENTIELS.stmg!.parties!.length);
  });

  it("un intitulé contenu dans un autre se résout vers celui qu'il écrit mot pour mot", () => {
    // « Comptabilité » est dans « Comptabilité approfondie » : l'UE9 du DCG
    // désignait les deux et ne se résolvait jamais.
    expect(blocOfficiel("DCG UE9 · Comptabilité", "dcg")).toBe("UE9 · Comptabilité");
    expect(blocOfficiel("DCG UE10 · Comptabilité approfondie", "dcg")).toBe(
      "UE10 · Comptabilité approfondie",
    );
  });

  it("le registre des référentiels est tenu par code de formation, et chaque texte lu donne sa page", () => {
    // UN DIPLÔME SANS ATELIER A SON TEXTE AU REGISTRE. Une clé qui ne serait
    // pas une formation ne paraîtrait nulle part ; une formation dont le texte
    // est lu sans avoir de page serait lue pour rien.
    const codes = new Set(FORMATIONS.map((f) => f.code));
    const pages = new Set(formationsAvecUnePage().map((f) => f.code));
    const cles = Object.keys(REFERENTIELS_DES_FORMATIONS);
    expect(cles.length, "le registre par formation est vide").toBeGreaterThan(10);
    for (const cle of cles) {
      expect(codes, `« ${cle} » n'est le code d'aucune formation`).toContain(cle);
      expect(pages, `${cle} a son texte au registre mais pas de page`).toContain(cle);
      expect(referentielDeLaFormation(cle)).toBe(REFERENTIELS_DES_FORMATIONS[cle]);
    }
    // Des diplômes sans atelier sont bien au registre : sinon la règle ne garde rien.
    const sansAtelier = cles.filter((cle) => !ATELIERS.some((a) => a.formations.includes(cle)));
    expect(sansAtelier.length, "aucun diplôme sans atelier au registre").toBeGreaterThan(5);
  });

  it("le préfixe d'une citation désigne la formation dont il porte le sigle", () => {
    // « Bac pro MCV Bloc 4A » doit ouvrir le texte du bac pro MCV, pas un autre :
    // la citation se résout par son préfixe, et le préfixe nomme une formation.
    for (const c of CHAPITRES) {
      for (const bloc of c.blocs) {
        const cite = referentielDeCitation(bloc)!;
        expect(formationParCode(cite.code), `${c.code} : « ${bloc} »`).toBeDefined();
        expect(cite.referentiel).toBe(REFERENTIELS_DES_FORMATIONS[cite.code]);
      }
    }
  });

  it("un atelier qui sert deux diplômes compte chez chacun, sous le texte de chacun", () => {
    // L'atelier STMG sert aussi la seconde option MG. Ses thèmes STMG, sans
    // préfixe, restent chez STMG ; ceux de la seconde, préfixés, vont chez elle.
    // Un calcul qui exigerait un préfixe partout viderait la ligne STMG.
    const stmg = couvertureDeLaFormation("stmg");
    const seconde = couvertureDeLaFormation("seconde-mg");
    const atelierSur = (blocs: typeof stmg, entree: string) =>
      blocs.find((b) => b.officiel === entree)?.presences.some((p) => p.code === "stmg") ?? false;
    expect(atelierSur(stmg, "Thème 3 · Création de valeur et performance")).toBe(true);
    expect(atelierSur(seconde, "Organiser et décider, des objectifs à la réalisation")).toBe(true);
    // Et rien ne passe d'un texte à l'autre.
    for (const b of seconde) expect(b.officiel, b.referentiel).not.toBeNull();
    expect(stmg.some((b) => b.referentiel.startsWith("2de MG"))).toBe(false);
  });

  it("une entrée hors du champ existe dans le texte, n'est pas travaillée, et dit pourquoi", () => {
    // Déclarer hors du champ une entrée que l'arène travaille, ou une entrée
    // qui n'existe pas, ferait mentir le tableau dans un sens ou dans l'autre.
    const declarees = Object.entries(HORS_DU_CHAMP);
    expect(declarees.length, "aucune entrée hors du champ : la règle ne garde rien").toBeGreaterThan(0);
    for (const [formation, entrees] of declarees) {
      const texte = referentielDeLaFormation(formation);
      expect(texte, `${formation} : pas de texte lu`).not.toBeNull();
      const { lignes } = tableauDeCouverture(formation);
      for (const [entree, raison] of Object.entries(entrees)) {
        expect(texte!.entrees, `${formation} : « ${entree} » n'est pas une entrée du texte`).toContain(entree);
        const ligne = lignes.find((l) => l.bloc === entree)!;
        expect(ligne.couverture, `${formation} / ${entree} : travaillée et déclarée hors du champ`).toBeNull();
        expect(ligne.horsDuChamp).toBe(raison);
        expect(raison.length, `${formation} / ${entree} : raison trop courte`).toBeGreaterThan(40);
      }
    }
  });

  it("la page d'un diplôme sans atelier le dit, et propose l'atelier sur mesure", () => {
    expect(PAGE).toContain("ateliers.length === 0");
    expect(PAGE).toContain("data-sans-atelier");
    expect(PAGE).toContain("<ParagrapheSurMesure");
  });

  it("la page d'un diplôme se rend pour chaque formation servie, et lit le tableau", () => {
    expect(PAGE).toContain("formationsAvecUnePage().map((f) => ({ formation: f.code }))");
    expect(PAGE).toContain("tableauDeCouverture(code)");
    expect(PAGE).toContain("notFound()");
    // Ce que rien ne travaille se dit sur la ligne même, pas par omission.
    expect(PAGE).toContain("non travaillé");
  });
});

describe("le DCG et le DSCG ne prétendent pas couvrir ce qu'ils ne travaillent pas (audit pédagogique, P1-3)", () => {
  it.each(["dcg", "dscg"])("%s : chaque unité non travaillée est hors du champ, sauf l'UE10 du DCG, à venir", (code) => {
    const restent = tableauDeCouverture(code)
      .lignes.filter((l) => !l.couverture && !l.horsDuChamp)
      .map((l) => l.bloc);
    expect(restent).toEqual(code === "dcg" ? ["UE10 · Comptabilité approfondie"] : []);
  });
});
