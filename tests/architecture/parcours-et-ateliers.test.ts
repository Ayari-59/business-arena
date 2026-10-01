import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PARCOURS } from "@/config/parcours";
import { ATELIERS, atelierByCode } from "@/config/ateliers";
import { adosseAUnReferentiel } from "@/config/ateliers/referentiels";
import { FORMATIONS, publicDeLAtelier } from "@/config/formations";

/**
 * AUCUNE FILIÈRE SERVIE N'EST DITE ABSENTE.
 *
 * La page des parcours citait quatre diplômes, et sa bande finale invitait
 * « BUT GEA, DCG, bachelors » à nous écrire — alors que BUT GEA et DCG ont
 * chacun un atelier publié, avec son déroulé, ses livrables et son
 * évaluation. Un enseignant de DCG lisait donc, sur la page faite pour lui
 * répondre, que sa filière n'existait pas ici.
 *
 * Le défaut n'est pas qu'il manque des parcours : en écrire un demande de lire
 * un arrêté, et les inventer serait prêter à des diplômes des blocs qu'ils ne
 * portent pas. Le défaut est que la page IGNORAIT les ateliers, donc ne
 * pouvait pas savoir ce qu'elle servait déjà.
 *
 * LA GARDE : tout atelier publié est soit revendiqué par un parcours, soit
 * cité par la page. Un atelier ajouté demain apparaît sans qu'on y pense ; un
 * atelier oublié fait échouer ce test plutôt qu'une page.
 */

const SOURCE = readFileSync(
  join(process.cwd(), "src/app/parcours/page.tsx"),
  "utf8",
);
/**
 * LE CODE SEUL. La prose qui explique une règle cite forcément ce qu'elle
 * interdit : le commentaire qui raconte pourquoi le tournoi inter-filières est
 * rattaché à quatre formations les nomme, et une garde qui lit le fichier
 * entier y verrait un sigle écrit en dur.
 */
const PAGE = SOURCE.replace(/\/\*[\s\S]*?\*\//g, " ").replace(
  /^\s*\/\/.*$/gm,
  " ",
);

describe("les parcours et les ateliers", () => {
  it("chaque parcours revendique des ateliers qui existent", () => {
    for (const p of PARCOURS) {
      expect(
        p.ateliers.length,
        `le parcours ${p.code} ne revendique aucun atelier`,
      ).toBeGreaterThan(0);
      for (const code of p.ateliers) {
        expect(
          atelierByCode.get(code),
          `${p.code} revendique l'atelier inconnu « ${code} »`,
        ).toBeTruthy();
      }
    }
  });

  it("aucun atelier n'est revendiqué par deux parcours", () => {
    const vus = new Map<string, string>();
    const doubles: string[] = [];
    for (const p of PARCOURS) {
      for (const code of p.ateliers) {
        if (vus.has(code))
          doubles.push(`${code} : ${vus.get(code)} et ${p.code}`);
        vus.set(code, p.code);
      }
    }
    expect(
      doubles,
      `ateliers revendiqués deux fois :\n${doubles.join("\n")}`,
    ).toEqual([]);
  });

  it("la page a une section par diplôme, déduite du registre", () => {
    // LA RÈGLE A CHANGÉ DE FORCE. Elle demandait que les ateliers sans
    // parcours soient CITÉS quelque part ; ils l'étaient, au pied de la page,
    // sous un titre qui les rangeait parmi les absents. Elle demande
    // maintenant que chaque diplôme servi ait sa propre section, au même rang
    // que les quatre qui avaient un parcours écrit à la main.
    expect(PAGE).toContain("const FILIERES");
    expect(PAGE).toContain("a.formations.includes(formation.code)");
    expect(PAGE).toContain("FILIERES.map");
    // La liste se DÉDUIT : aucun code ni aucun nom de diplôme n'est recopié.
    for (const a of ATELIERS) {
      expect(
        PAGE,
        `l'atelier « ${a.code} » est recopié dans la page`,
      ).not.toContain(`"${a.code}"`);
      expect(
        PAGE,
        `le diplôme « ${publicDeLAtelier(a)} » est recopié dans la page`,
      ).not.toContain(publicDeLAtelier(a));
    }
  });

  it("chaque diplôme servi a une ancre, et celles des parcours ne bougent pas", () => {
    // Les ancres des quatre parcours sont liées ailleurs (page d'accueil,
    // pages d'atelier) : une section renommée les casserait en silence.
    const diplomes = new Set(ATELIERS.map((a) => publicDeLAtelier(a)));
    expect(diplomes.size, "un seul diplôme au registre").toBeGreaterThan(
      PARCOURS.length,
    );
    expect(PAGE).toContain("parcours?.code ??");
  });

  it("chaque diplôme est un tiroir, et le tiroir fermé dit encore ce qu'il cache", () => {
    // LA PAGE FAISAIT SEIZE MILLE NEUF CENTS PIXELS sur un téléphone. Douze
    // diplômes dépliés à la suite quand on vient en chercher un : le prix de
    // la complétude était que plus personne n'atteignait le sien.
    expect(PAGE).toContain("data-diplome");
    expect(PAGE).toContain("<details");
    // Le titre reste DANS le résumé : sorti de là, il ne serait plus cliquable
    // et le plan de la page disparaîtrait dès que tout est replié.
    const resume = PAGE.slice(
      PAGE.indexOf("<summary"),
      PAGE.indexOf("</summary>"),
    );
    expect(
      resume,
      "le nom du diplôme doit rester dans le résumé du tiroir",
    ).toContain("<h2");
    expect(resume).toContain("{f.diplome}");

    // LES TROIS SIGNAUX DU TIROIR MAISON (voir src/components/tiroir.tsx).
    // Un repli qu'on ne voit pas est un contenu perdu : personne ne cherche ce
    // qu'il ne soupçonne pas. La page ne reprend pas le composant — son
    // gabarit d'arène écraserait le nom du diplôme — donc elle doit au moins
    // en reprendre les signaux, sinon le site parle deux langues du repli.
    expect(resume, "le chevron qui pivote").toContain("group-open:rotate-90");
    expect(PAGE, "le trait pointillé tant que c'est fermé").toContain(
      "border-dashed",
    );
    expect(PAGE, "plein une fois ouvert").toContain("open:border-solid");

    // Le compte est LU de la donnée. Écrit à la main, il mentirait dès qu'une
    // séance est ajoutée, et c'est le seul contenu du tiroir fermé.
    expect(resume).toContain("{f.blocs}");
    expect(resume).toContain("{f.volume}");
    expect(PAGE).toContain(
      "couvertureDuDiplome(ateliers.map((a) => a.code)).length",
    );
  });

  it("n'expose que des diplômes", () => {
    // UN BLOC DE RÉFÉRENTIEL APPARTIENT À UN DIPLÔME. La page portait douze
    // sections dont trois n'en étaient pas : découverte, approfondissement,
    // tournoi inter-filières. Elles affichaient des « blocs de référentiel »
    // qui sont nos propres découpages — « Étape 1 · Lire une situation et
    // fixer un prix » — et ne figurent dans aucun arrêté. Posés au milieu de
    // blocs tirés d'un texte, sur la page où un enseignant vérifie son
    // programme, ils ôtaient leur valeur à tous les autres.
    const dehors = ATELIERS.filter((a) => !adosseAUnReferentiel(a.code));
    expect(
      dehors.length,
      "plus aucun déroulé hors référentiel : la règle ne garde rien",
    ).toBeGreaterThan(0);
    expect(PAGE).toContain("adosseAUnReferentiel");
    // Aucune trace d'eux sur cette page : leurs découpages ne doivent pas
    // côtoyer des blocs tirés d'un arrêté, fût-ce pour dire qu'ils n'en sont
    // pas. Ils vivent sur la page des ateliers, qui est faite pour eux.
    for (const a of dehors) {
      expect(
        PAGE,
        `« ${a.titre} » reparaît sur la page des parcours`,
      ).not.toContain(a.titre);
    }
  });

  it("la page parle du référentiel, et met le déroulé en preuve", () => {
    // CE QU'ELLE DISAIT AVANT. Chaque diplôme s'ouvrait sur le titre d'un
    // déroulé, son nombre de séances et son volume horaire, puis listait les
    // blocs sous lui. La page répondait « voici notre produit » à quelqu'un
    // venu demander « mon programme est-il couvert ». Le référentiel vient
    // donc en premier, et la mise en œuvre en pied de section.
    expect(PAGE).toContain("couvertureDuDiplome");
    expect(
      PAGE,
      "le référentiel ne doit plus se lister par déroulé",
    ).not.toContain("couvertureDeLAtelier");
    expect(PAGE).toContain("Mise en œuvre");
    const corps = PAGE.slice(PAGE.indexOf("<summary"));
    expect(
      corps.indexOf("couvertureDuDiplome"),
      "le déroulé est cité avant le référentiel",
    ).toBeLessThan(corps.indexOf("Mise en œuvre"));
  });

  it("aucun tiroir n'est ouvert d'avance, sinon la page repousse en silence", () => {
    // Un seul `open` posé là « pour montrer un exemple » et la page reprend
    // mille pixels par diplôme, sans qu'aucun test ne s'en aperçoive.
    const tiroirs = PAGE.slice(
      PAGE.indexOf("<details"),
      PAGE.indexOf("</details>"),
    );
    expect(tiroirs, "un tiroir ouvert d'avance").not.toMatch(/\sopen(\s|=|>)/);
  });

  it("chaque formation a un sigle, et chaque atelier dit à qui il s'adresse", () => {
    // L'index en haut de la page des parcours est une rangée de pastilles.
    // « BTS Négociation et digitalisation de la relation client » y tient sur
    // trois lignes : la page n'indexait donc que les quatre diplômes dont le
    // nom court était écrit quelque part. Une formation ajoutée demain sans
    // sigle ferait réapparaître le défaut, une pastille à la fois.
    for (const f of FORMATIONS) {
      expect(
        f.sigle.length,
        `le sigle de « ${f.nom} » est trop long`,
      ).toBeLessThanOrEqual(20);
      expect(f.sigle.length, `${f.nom} n'a pas de sigle`).toBeGreaterThan(2);
    }
    // Tout rattachement désigne une formation du registre ; tout atelier qui
    // n'en sert aucune dit à qui il s'adresse. Sans cela il s'afficherait sans
    // public nulle part, et personne ne verrait qu'il manque.
    const codes = new Set(FORMATIONS.map((f) => f.code));
    for (const a of ATELIERS) {
      for (const c of a.formations) {
        expect(
          codes,
          `${a.code} se rattache à la formation inconnue « ${c} »`,
        ).toContain(c);
      }
      expect(
        publicDeLAtelier(a).length,
        `${a.code} ne dit à qui il s'adresse`,
      ).toBeGreaterThan(2);
    }
  });

  it("n'invite plus à écrire les diplômes qui ont déjà un atelier", () => {
    // Le texte nommait BUT GEA et DCG comme absents. Les nommer quelque part
    // n'est pas interdit — les citer comme non servis l'est.
    const couverts = new Set(PARCOURS.flatMap((p) => p.ateliers));
    const servis = ATELIERS.filter((a) => !couverts.has(a.code)).map((a) =>
      publicDeLAtelier(a),
    );
    const bandeFinale = PAGE.slice(PAGE.indexOf("<BandeFinale"));
    for (const diplome of new Set(servis)) {
      const sigle = diplome.replace(/^BTS |^BUT /, "").split(/[ ·,]/)[0]!;
      if (sigle.length < 3) continue;
      expect(
        bandeFinale,
        `la bande finale nomme « ${sigle} » comme absent, alors qu'il a un atelier`,
      ).not.toContain(sigle);
    }
  });
});
