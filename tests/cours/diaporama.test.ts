import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DOMParser } from "@xmldom/xmldom";
import JSZip from "jszip";
import { beforeAll, describe, expect, it } from "vitest";
import { casDeLEntreprise } from "@/config/cours/cas";
import { FOURNISSEURS_ET_BANQUE } from "@/config/cours/chapitres/fournisseurs-et-banque";
import { CHAPITRES_AU_DIAPORAMA, aSonDiaporama, fichierDuDiaporama } from "@/config/cours/diaporamas";
import { MAILLE_ET_CO } from "@/config/cours/monde/maille-et-co";
import { echeancier, echelleDInterets, fraisDeLArrete, pointageDuFaconnier, rapprochement } from "@/config/cours/monde/fournisseurs-et-banque-de-la-boutique";
import { CHAPITRES } from "@/config/cours/registre";
import { casDuChapitre } from "@/config/cours/situations";
import { bureauxDuChapitre } from "@/config/cours/bureaux";
import { ENTREPRISES_DU_COURS } from "@/config/cours/metiers";
import { espacesOrdinaires } from "@/lib/typographie";
import { montantEcrit } from "@/pedagogy/cours/correcteur";
import { servirLeChapitre } from "@/pedagogy/cours/chapitre-servi";
import { COULEURS, MOTS_DU_DIAPORAMA, diaporamaDuChapitre, planDuDiaporama, type Diapositive } from "@/pedagogy/cours/diaporama";

/**
 * LE DIAPORAMA DE L'ENSEIGNANT (pedagogy/cours/diaporama.ts) : le fichier produit pour « Fournisseurs et
 * banque », ouvert comme PowerPoint l'ouvre (un zip de XML). Chaque question est suivie de sa correction,
 * la question ne marque pas la bonne réponse, les tableaux sont de vrais tableaux, chaque diapositive a
 * ses notes, et les chiffres sont ceux du monde du cours. Le plan, lui, vaut pour tous les chapitres.
 */

const cas = casDeLEntreprise("boutique");
const plan = planDuDiaporama(FOURNISSEURS_ET_BANQUE, cas);
const servi = servirLeChapitre(FOURNISSEURS_ET_BANQUE, cas);
const f = MAILLE_ET_CO;
const net = (t: string) => espacesOrdinaires(t).replace(/ /g, " ");
const eur = (x: number) => net(montantEcrit(x).replace(/^-/, "−"));

interface DiapositiveLue {
  xml: string;
  titre: string;
  texte: string;
  notes: string;
}

let zip: JSZip;
let diapositives: DiapositiveLue[];
const textes = (xml: string) => net([...xml.matchAll(/<a:t>([^<]*)<\/a:t>/g)].map((m) => m[1]!).join(" ").replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&"));

beforeAll(async () => {
  zip = await JSZip.loadAsync(await diaporamaDuChapitre(FOURNISSEURS_ET_BANQUE, cas));
  const nombre = Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n)).length;
  diapositives = await Promise.all(
    Array.from({ length: nombre }, async (_, i) => {
      const xml = await zip.file(`ppt/slides/slide${i + 1}.xml`)!.async("string");
      const rels = await zip.file(`ppt/slides/_rels/slide${i + 1}.xml.rels`)!.async("string");
      const cible = /notesSlides\/(notesSlide\d+\.xml)/.exec(rels)?.[1];
      const notes = cible ? textes(await zip.file(`ppt/notesSlides/${cible}`)!.async("string")) : "";
      const titre = textes(/<p:sp>(?:(?!<\/p:sp>).)*?<p:ph\s[^>]*type="title"(?:(?!<\/p:sp>).)*<\/p:sp>/s.exec(xml)?.[0] ?? "");
      return { xml, titre, texte: textes(xml), notes };
    }),
  );
}, 60_000);

describe("le diaporama de « Fournisseurs et banque »", () => {
  it("a autant de diapositives que son plan : un titre, les objectifs, chaque étape, la fin", () => {
    expect(diapositives.length).toBe(plan.length);
    expect(diapositives.length).toBeGreaterThan(servi.etapes.length * 2);
    expect(diapositives[0]!.titre).toBe(net(FOURNISSEURS_ET_BANQUE.titre));
    expect(diapositives[0]!.texte).toContain(cas.entreprise);
    expect(diapositives[0]!.texte).toContain(net(servi.parcours));
    expect(diapositives.at(-1)!.titre).toBe(MOTS_DU_DIAPORAMA.fin);
  });

  it("chaque partie du XML est bien formée (une esperluette non échappée casserait le fichier)", async () => {
    for (const [nom, entree] of Object.entries(zip.files)) {
      if (!/\.(xml|rels)$/.test(nom)) continue;
      const erreurs: string[] = [];
      new DOMParser({ errorHandler: { error: (m: string) => erreurs.push(m), fatalError: (m: string) => erreurs.push(m) } }).parseFromString(await entree.async("string"), "text/xml");
      expect(erreurs, nom).toEqual([]);
    }
    expect(await zip.file("docProps/app.xml")!.async("string")).toContain("MAILLE &amp; CO");
  });

  it("chaque étape paraît dans l'ordre du chapitre, et chaque question est suivie de sa correction juste après", () => {
    let depuis = 0;
    for (const e of servi.etapes) {
      const titre = net(e.titre);
      const premiere = diapositives.findIndex((d, i) => i >= depuis && d.titre.includes(titre));
      expect(premiere, e.id).toBeGreaterThanOrEqual(depuis);
      depuis = premiere;
      if (e.type === "lecture") continue;
      const questions = diapositives.flatMap((d, i) => (d.titre.startsWith(`${MOTS_DU_DIAPORAMA.question} · ${titre}`) ? [i] : []));
      expect(questions.length, e.id).toBeGreaterThan(0);
      const derniere = questions.at(-1)!;
      expect(diapositives[derniere + 1]!.titre, e.id).toBe(`${MOTS_DU_DIAPORAMA.correction} · ${titre}`);
    }
  });

  it("la diapositive « question » donne l'énoncé et les propositions, sans marquer la bonne", () => {
    for (const e of servi.etapes) {
      if (e.type !== "choix") continue;
      const titre = net(e.titre);
      const question = diapositives.find((d) => d.titre === `${MOTS_DU_DIAPORAMA.question} · ${titre}`)!;
      const correction = diapositives.find((d) => d.titre === `${MOTS_DU_DIAPORAMA.correction} · ${titre}`)!;
      const bonne = e.options.find((o) => o.juste)!;
      for (const o of e.options) expect(question.texte, e.id).toContain(net(o.texte));
      expect(question.texte).not.toContain(MOTS_DU_DIAPORAMA.bonneReponse);
      expect(question.texte).not.toContain(net(bonne.retour).slice(0, 40));
      // Les propositions s'écrivent toutes pareil : aucune en gras.
      expect(question.xml).not.toMatch(/b="1"[^>]*>(?:(?!<\/a:r>).)*?<a:t>[A-J]\. /s);
      expect(correction.texte).toContain(`${MOTS_DU_DIAPORAMA.bonneReponse} :`);
      expect(correction.texte).toContain(net(bonne.texte));
      expect(correction.texte).toContain(net(bonne.retour).slice(0, 40));
    }
    // Aucune question, de quelque type, ne porte le mot de la correction.
    for (const d of diapositives.filter((x) => x.titre.startsWith(MOTS_DU_DIAPORAMA.question))) expect(d.texte).not.toContain(MOTS_DU_DIAPORAMA.bonneReponse);
  });

  it("les tableaux sont de vrais tableaux PowerPoint, pas des images", () => {
    expect(Object.values(zip.files).some((e) => !e.dir && e.name.startsWith("ppt/media/"))).toBe(false);
    const avecTableau = plan.flatMap((d, i) => (d.blocs.some((b) => b.type === "tableau") ? [i] : []));
    expect(avecTableau.length).toBeGreaterThan(10);
    for (const i of avecTableau) expect(diapositives[i]!.xml, plan[i]!.titre).toContain("<a:tbl>");
    // L'état de rapprochement : à compléter dans la question, rempli dans la correction.
    const etat = servi.etapes.find((e) => e.id === "l-etat-de-rapprochement")!;
    const r = rapprochement(f);
    const question = diapositives.filter((d) => d.titre.startsWith(`${MOTS_DU_DIAPORAMA.question} · ${net(etat.titre)}`)).map((d) => d.texte).join(" ");
    const correction = diapositives.find((d) => d.titre === `${MOTS_DU_DIAPORAMA.correction} · ${net(etat.titre)}`)!;
    expect(question).not.toContain(eur(r.compteRectifie));
    expect(correction.xml).toContain("<a:tbl>");
    expect(correction.texte).toContain(eur(r.compteRectifie));
  });

  it("chaque diapositive a ses notes, et la correction porte l'explication, le piège et la suite", () => {
    for (const d of diapositives) expect(d.notes.length, d.titre).toBeGreaterThan(20);
    const pratique = casDuChapitre(FOURNISSEURS_ET_BANQUE.code)!;
    const [bureau] = bureauxDuChapitre(FOURNISSEURS_ET_BANQUE.code);
    for (const d of diapositives.filter((x) => x.titre.startsWith(MOTS_DU_DIAPORAMA.correction))) {
      expect(d.notes).toContain(net(pratique.titre));
      expect(d.notes).toContain(net(bureau!.titre));
    }
    const critique = servi.etapes.find((e) => e.id === "critique-du-delai")!;
    if (critique.type !== "choix") throw new Error("critique-du-delai est une question à choix");
    const notes = diapositives.find((d) => d.titre === `${MOTS_DU_DIAPORAMA.correction} · ${net(critique.titre)}`)!.notes;
    for (const o of critique.options.filter((x) => !x.juste)) expect(notes).toContain(net(o.retour).slice(0, 40));
    // La fin : le cas pratique et le bureau, à faire ensuite.
    expect(diapositives.at(-1)!.texte).toContain(net(pratique.titre));
    expect(diapositives.at(-1)!.texte).toContain(net(bureau!.titre));
  });

  it("les chiffres sont ceux du monde du cours", () => {
    const tout = diapositives.map((d) => d.texte).join(" ");
    const p = pointageDuFaconnier(f);
    const e = echeancier(f);
    const echelle = echelleDInterets(f);
    const fr = fraisDeLArrete(f);
    const r = rapprochement(f);
    for (const x of [p.chezLaBoutique, p.chezLeFaconnier, p.ecart, e.fevrier, e.mars, fr.interets, fr.total, r.compte, r.releve, r.compteRectifie, r.releveRectifie, echelle.plusFortDecouvert]) {
      expect(tout, String(x)).toContain(eur(x));
    }
  });

  it("se lit au vidéoprojecteur : 16:9, Calibri, rien sous 18 points, les couleurs en hexadécimal à six chiffres", async () => {
    const presentation = await zip.file("ppt/presentation.xml")!.async("string");
    expect(presentation).toMatch(/<p:sldSz cx="12192000" cy="6858000"/);
    const parties = await Promise.all(
      Object.keys(zip.files)
        .filter((n) => /^ppt\/(slides|slideLayouts)\/[^/]+\.xml$/.test(n))
        .map((n) => zip.file(n)!.async("string")),
    );
    for (const xml of parties) {
      for (const m of xml.matchAll(/<a:rPr[^>]*\ssz="(\d+)"/g)) expect(Number(m[1])).toBeGreaterThanOrEqual(1800);
      for (const m of xml.matchAll(/<a:srgbClr val="([^"]*)"/g)) expect(m[1]).toMatch(/^[0-9A-F]{6}$/);
      for (const m of xml.matchAll(/typeface="([^"]*)"/g)) expect(["Calibri", "Arial", "+mj-lt", "+mn-lt"]).toContain(m[1]);
    }
    const titres = parties.join("").match(/<a:rPr[^>]*\ssz="(\d+)"[^>]*\sb="1"/g) ?? [];
    expect(titres.length).toBeGreaterThan(0);
  });

  it("ses couleurs sont celles du site (src/app/globals.css)", () => {
    const css = readFileSync(join(process.cwd(), "src/app/globals.css"), "utf8").toLowerCase();
    for (const [jeton, couleur] of [
      ["--marine", COULEURS.marine],
      ["--marine-releve", COULEURS.marineReleve],
      ["--accent-plein", COULEURS.accent],
      ["--argent", COULEURS.argent],
      ["--argent-filet", COULEURS.argentFilet],
    ] as const) {
      expect(css, jeton).toContain(`${jeton}: #${couleur.toLowerCase()};`);
    }
  });
});

describe("la liste blanche des diaporamas", () => {
  it("un seul chapitre pour le prototype : « Fournisseurs et banque », réservé", () => {
    expect(CHAPITRES_AU_DIAPORAMA).toEqual(["fournisseurs-et-banque"]);
    for (const code of CHAPITRES_AU_DIAPORAMA) expect(CHAPITRES.find((c) => c.code === code)?.libre, code).toBe(false);
    expect(aSonDiaporama("fournisseurs-et-banque")).toBe(true);
    expect(aSonDiaporama(CHAPITRES.find((c) => c.code !== "fournisseurs-et-banque")!.code)).toBe(false);
    expect(fichierDuDiaporama("fournisseurs-et-banque")).toBe("diaporama-fournisseurs-et-banque.pptx");
  });
});

describe("le générateur est générique", () => {
  const suivies = (d: readonly Diapositive[]) =>
    d.flatMap((x, i) => (x.role === "question" && d[i + 1]?.role !== "question" ? [d[i + 1]?.role === "correction" && d[i + 1]?.etape === x.etape ? null : `${x.etape}`] : [])).filter(Boolean);

  it("chaque chapitre du cours donne un plan où toute question est suivie de sa correction", () => {
    const fautes: string[] = [];
    for (const chapitre of CHAPITRES) {
      const entreprise = chapitre.entreprises?.codes[0] ?? ENTREPRISES_DU_COURS[0]!;
      const p = planDuDiaporama(chapitre, casDeLEntreprise(entreprise));
      const evaluees = servirLeChapitre(chapitre, casDeLEntreprise(entreprise)).etapes.filter((e) => e.type !== "lecture").length;
      if (p.filter((x) => x.role === "correction" && !x.titre.endsWith("(suite)")).length !== evaluees) fautes.push(`${chapitre.code} : ${evaluees} questions`);
      fautes.push(...suivies(p).map((e) => `${chapitre.code} : ${e}`));
    }
    expect(fautes).toEqual([]);
  }, 120_000);
});
