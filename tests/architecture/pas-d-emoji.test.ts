import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * UN SEUL JEU DE PICTOGRAMMES, ET PAS D'EMOJI.
 *
 * Relevé avant d'écrire cette garde : 502 emoji hors commentaires dans
 * l'application, sa configuration et ses composants — 🏦 💶 📊 dans le
 * formulaire de décision, un emoji par courrier sur le timbre des enveloppes,
 * un par scénario sur la tuile de l'enseignant. Un emoji n'est pas une icône :
 * c'est un caractère, que le système DESSINE. Il change donc de forme et de
 * couleur d'un appareil à l'autre (la même partie, jouée sur des téléphones
 * Android et projetée depuis un Mac, montrait trois banques différentes),
 * arrive en couleurs étrangères à la charte, ignore l'encre de la ligne qui le
 * porte, et se brouille au vidéoprojecteur — ce qui arrive à ces écrans à
 * chaque séance.
 *
 * Le site a ses pictogrammes : `Icone` (components/icone.tsx) et, pour les
 * neuf métiers, `PictoSecteur`. Un seul trait, la couleur du texte, un dessin
 * par SENS. Cette garde empêche l'emoji de revenir par un copier-coller, dans
 * un libellé, une donnée de configuration ou une chaîne composée.
 *
 * CE QUI RESTE PERMIS : les signes typographiques, qui sont du texte et
 * prennent la police et l'encre du texte — ✓ ✗ ✕ ★ → ↺ ▸ ▲ ▼ ● ·. Et les
 * commentaires, qui citent souvent l'emoji qu'un dessin a remplacé : c'est la
 * mémoire du choix, pas un affichage.
 *
 * L'EXPRESSION. Les blocs U+1F300–U+1FAFF (pictogrammes, visages, objets) ;
 * les symboles U+2600–U+27BF suivis du sélecteur de variante U+FE0F, qui les
 * fait passer en emoji (⚠️ ⚖️ ✍️ ✉️ ✏️) ; et, plus largement, tout caractère
 * que l'Unicode affiche en emoji par défaut (`Emoji_Presentation` : ✅ ⏳ ⭐
 * ⚡ 🆘) ou qu'on y force par U+FE0F (↩️ ⏱️). Les deux premières lignes sont
 * celles du relevé ; les deux suivantes rattrapent ce qu'elles laissaient
 * passer — 🆘 et ✅ vivaient hors des deux plages.
 */
const EMOJI =
  /[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]\u{FE0F}|\p{Emoji_Presentation}|\p{Extended_Pictographic}\u{FE0F}/gu;

const RACINE = process.cwd();
const DOSSIERS = ["src/app", "src/components", "src/config"];

/**
 * LES EXCEPTIONS EN COURS, NOMMÉES ET COMPTÉES. Il n'y en a plus. Le jour où
 * il faudrait en tolérer une, elle s'écrit ici avec son nombre : c'est un
 * PLAFOND, pas un passe-droit — un emoji de plus fait échouer la garde, un de
 * moins aussi, pour qu'on retire la ligne.
 */
const EN_ATTENTE: Record<string, number> = {};

function fichiers(dossier: string): string[] {
  const trouves: string[] = [];
  for (const entree of readdirSync(dossier)) {
    const chemin = join(dossier, entree);
    if (statSync(chemin).isDirectory()) trouves.push(...fichiers(chemin));
    else if (/\.(ts|tsx|mts)$/.test(entree)) trouves.push(chemin);
  }
  return trouves;
}

/**
 * Le source sans ses commentaires, les chaînes intactes et les lignes à leur
 * place (pour que le numéro de ligne d'un fautif reste juste).
 *
 * Un lecteur de jetons sommaire, pas un analyseur : il reconnaît les chaînes
 * entre guillemets, apostrophes et accents graves, et les deux formes de
 * commentaire. Une apostrophe dans un texte JSX (« l'équipe ») ouvre pour lui
 * une chaîne jusqu'au bout de la ligne : il garde alors ce qu'il aurait pu
 * effacer, jamais l'inverse. L'erreur possible est un faux fautif, qu'on voit,
 * et non un emoji qui passerait.
 */
function sansCommentaires(source: string): string {
  let sortie = "";
  let i = 0;
  const n = source.length;
  const blanchir = (morceau: string) => morceau.replace(/[^\n]/g, " ");
  while (i < n) {
    const c = source[i]!;
    const suivant = source[i + 1];
    if (c === "/" && suivant === "*") {
      const fin = source.indexOf("*/", i + 2);
      const bout = fin < 0 ? n : fin + 2;
      sortie += blanchir(source.slice(i, bout));
      i = bout;
      continue;
    }
    // `://` est une adresse, pas un commentaire.
    if (c === "/" && suivant === "/" && source[i - 1] !== ":") {
      const fin = source.indexOf("\n", i);
      const bout = fin < 0 ? n : fin;
      sortie += blanchir(source.slice(i, bout));
      i = bout;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < n && source[j] !== c) {
        if (source[j] === "\\") j++;
        else if (c !== "`" && source[j] === "\n") break;
        j++;
      }
      sortie += source.slice(i, j + 1);
      i = j + 1;
      continue;
    }
    sortie += c;
    i++;
  }
  return sortie;
}

function relevé(): Map<string, string[]> {
  const parFichier = new Map<string, string[]>();
  for (const dossier of DOSSIERS) {
    for (const chemin of fichiers(join(RACINE, dossier))) {
      const lignes = sansCommentaires(readFileSync(chemin, "utf8")).split("\n");
      const fautes: string[] = [];
      lignes.forEach((ligne, k) => {
        const trouves = ligne.match(EMOJI);
        if (trouves) fautes.push(`${k + 1}: ${trouves.join(" ")}  ${ligne.trim().slice(0, 90)}`);
      });
      if (fautes.length > 0) parFichier.set(relative(RACINE, chemin).split(sep).join("/"), fautes);
    }
  }
  return parFichier;
}

describe("pas d'emoji dans l'interface", () => {
  it("aucun emoji hors commentaires dans src/app, src/components et src/config", () => {
    const fautifs: string[] = [];
    for (const [fichier, fautes] of relevé()) {
      const toleres = EN_ATTENTE[fichier] ?? 0;
      if (fautes.length !== toleres) {
        fautifs.push(
          `${fichier} (${fautes.length}, toléré ${toleres})\n    ${fautes.join("\n    ")}`,
        );
      }
    }
    // Un fichier en attente qui n'a plus d'emoji doit sortir de la liste.
    for (const [fichier, toleres] of Object.entries(EN_ATTENTE)) {
      if (!relevé().has(fichier) && toleres > 0) {
        fautifs.push(`${fichier} : plus d'emoji, retirez-le de EN_ATTENTE`);
      }
    }
    expect(
      fautifs,
      `Dessinez-les avec <Icone nom="…" /> (components/icone.tsx) :\n${fautifs.join("\n")}`,
    ).toEqual([]);
  });

  it("l'expression attrape les emoji et laisse passer les signes typographiques", () => {
    const attrape = (s: string) => (s.match(EMOJI) ?? []).length > 0;
    for (const emoji of ["📊", "🏦", "⚠️", "⚖️", "✍️", "✉️", "✏️", "⚡", "✅", "⏳", "🆘", "↩️"]) {
      expect(attrape(emoji), emoji).toBe(true);
    }
    for (const signe of ["✓", "✗", "✕", "★", "→", "↺", "▸", "▲", "▼", "●", "·", "€", "«"]) {
      expect(attrape(signe), signe).toBe(false);
    }
  });

  it("le lecteur ignore les commentaires et garde les chaînes", () => {
    const source = [
      "// 📊 ici, c'est un commentaire",
      "/* 🏦 et ici aussi */",
      "{/* 🎯 un commentaire JSX */}",
      'const titre = "📬 Le courrier";',
      "const lien = 'https://exemple.fr'; // 🔒 commentaire après une adresse",
    ].join("\n");
    const lu = sansCommentaires(source);
    expect(lu.split("\n")).toHaveLength(5);
    expect(lu.match(EMOJI)).toEqual(["📬"]);
    expect(lu).toContain("https://exemple.fr");
  });
});

describe("le jeu de pictogrammes", () => {
  const source = readFileSync(join(RACINE, "src/components/icone.tsx"), "utf8");
  const bloc = source.slice(source.indexOf("const TRACES = {"), source.indexOf("} as const;"));

  it("chaque pictogramme dit ce qu'il dessine, en une ligne", () => {
    // Le nom dit le SENS (« banque », « alerte ») ; le commentaire dit le
    // DESSIN (« le fronton à colonnes »). Sans lui, le suivant qui cherche un
    // pictogramme ne sait pas ce qu'il va trouver, et en dessine un second.
    const cles = [...bloc.matchAll(/^ {2}([a-z]+): \(/gm)].map((m) => m[1]!);
    expect(cles.length).toBeGreaterThan(20);
    for (const cle of cles) {
      expect(bloc, cle).toMatch(new RegExp(`/\\*\\*[^*]+\\*/\\n {2}${cle}: \\(`));
    }
  });

  it("se dessine au trait, à l'encre du texte, sans aucune teinte écrite", () => {
    expect(bloc).not.toMatch(/fill="(?!none)/);
    expect(bloc).not.toMatch(/#[0-9a-f]{3,6}\b/i);
  });
});
