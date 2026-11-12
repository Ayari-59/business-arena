import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({ db: {} }));

import { ChapitreReserve } from "@/components/cours/chapitre-reserve";
import { CaseDeLiberation } from "@/components/case-de-liberation";
import { NouvelleClasseDuCours } from "@/components/nouvelle-classe-du-cours";
import { CE_QU_EST_UN_PARCOURS, parcoursRangesParDiplome } from "@/config/cours/parcours-de-formation";
import { CHAPITRES } from "@/config/cours/registre";
import { CONDITIONS_DE_VENTE, LE_COURS_PAR_OFFRE, QUESTIONS_TARIFS, OFFRES } from "@/config/tarifs";
import { chapitreDuParcoursDeLaClasse, parcoursDeLEssai, unParcoursParLicenceClasse } from "@/services/chapitres-de-la-classe";

/**
 * LA CLASSE AUTOUR DE SON DIPLÔME (décisions du propriétaire du 11 novembre 2026 ; audit UX du même
 * jour, P1-1 à P1-4, P2-6, P2-8, P2-9, P2-12 ; audit de l'offre, P1-1). Ce que cette garde tient,
 * sans base ni navigateur (le parcours entier : tests/e2e/cours.e2e.ts) :
 *  · « Ma classe » passe avant le titre de la vitrine, liste les chapitres ouverts à la classe, et
 *    « Commencer » vise le dernier libéré, à défaut le premier du parcours ;
 *  · le suivi de l'enseignant s'ouvre sur le dernier chapitre libéré, à défaut le premier du parcours,
 *    une ligne par élève en tête ; son tableau dit qu'il défile et s'atteint au clavier ; le code se
 *    projette ; la liste de libération n'a que le parcours et les chapitres libres, une case par chapitre ;
 *  · devant un chapitre fermé, l'élève lit « pas encore ouvert pour votre classe » ou « hors du programme » ;
 *  · le formulaire de classe : `noValidate`, les erreurs sous leurs champs, la saisie gardée ;
 *  · les textes de Classe disent la règle du code.
 */

const lire = (chemin: string) => readFileSync(join(process.cwd(), "src", chemin), "utf8");
const texte = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/[  ]/g, " ")
    .replace(/\s+/g, " ");

describe("« Ma classe » (/cours, après avoir rejoint)", () => {
  const page = lire("app/cours/page.tsx");

  it("passe avant le titre de la vitrine : elle porte le titre de la page, la vitrine vient dessous", () => {
    expect(page.indexOf('data-classe-du-cours=""')).toBeLessThan(page.indexOf("data-vitrine-du-cours"));
    expect(page).toMatch(/<h1 id="ma-classe"[\s\S]{0,200}Ma classe : « \{classe\.classe\} »/);
    // La vitrine d'un élève de classe est un h2 : la page n'a qu'un titre.
    expect(page).toMatch(/data-vitrine-du-cours=""[\s\S]{0,200}<h2/);
  });

  it("liste les chapitres ouverts à la classe, et « Commencer » vise le dernier libéré, à défaut le premier du parcours", () => {
    expect(page).toContain("<ChapitresDeMaClasse");
    expect(page).toMatch(/const aCommencer = \(parChapitre \? parLiberation\.find\(\(c\) => ouverts\.has\(c\.code\)\) : undefined\) \?\? duParcours\.find\(\(c\) => ouverts\.has\(c\.code\)\)/);
    expect(page).toContain("chapitresOuverts({ enseignant: null, eleve }, candidats)");
    expect(page).toContain("data-commencer-en-classe={aCommencer.code}");
  });

  it("la page de la classe ne dit plus « réservé » à l'élève : « pas encore ouvert », ou « hors programme »", () => {
    expect(page).toContain('data-cadenas="pas-encore-ouvert"');
    expect(page).toContain('data-cadenas="hors-programme"');
    expect(page).toContain("const eleveDeLaClasse = classe && !session ? { parcours: classe.parcours } : undefined;");
  });
});

describe("devant un chapitre fermé, l'élève d'une classe", () => {
  const props = {
    titre: "Les leviers du seuil",
    reserve: "Ce chapitre est réservé",
    essai: { href: "/cours/prix-cout-et-marge?diplome=bts-cg", titre: "Prix, coût et marge", sigle: "BTS CG" },
  };
  const rendu = (dansLeParcours?: boolean) =>
    renderToStaticMarkup(createElement(ChapitreReserve, { ...props, eleve: { classe: "BTS CG 1", ...(dansLeParcours === undefined ? {} : { dansLeParcours }) } }));

  it("lit « pas encore ouvert pour votre classe » pour un chapitre de son parcours, et que son enseignant peut l'ouvrir", () => {
    const html = rendu(true);
    expect(texte(html)).toContain("Ce chapitre n'est pas encore ouvert pour votre classe, « BTS CG 1 »");
    expect(texte(html)).toContain("votre enseignant : c'est lui qui peut l'ouvrir");
    expect(html).toContain('data-chapitre-ferme-a-l-eleve="pas-encore-ouvert"');
    expect(texte(rendu())).toContain("n'est pas encore ouvert pour votre classe");
  });

  it("lit « hors du programme de votre classe » sinon, sans promettre que son enseignant l'ouvrira", () => {
    const html = rendu(false);
    expect(texte(html)).toContain("Ce chapitre est hors du programme de votre classe, « BTS CG 1 »");
    expect(texte(html)).not.toMatch(/peut l'ouvrir|réservé/);
    expect(html).toContain('data-chapitre-ferme-a-l-eleve="hors-programme"');
    // Un cas pratique se nomme comme tel.
    const cas = renderToStaticMarkup(createElement(ChapitreReserve, { ...props, reserve: "Ce cas pratique est réservé", eleve: { classe: "X", dansLeParcours: false } }));
    expect(texte(cas)).toContain("Ce cas pratique est hors du programme de votre classe");
  });

  it("la règle : du parcours de la classe, prérequis annoncés compris", () => {
    const duParcours = CHAPITRES.find((c) => c.parcours === "controle-de-gestion" && !c.libre)!;
    expect(chapitreDuParcoursDeLaClasse("controle-de-gestion", duParcours)).toBe(true);
    expect(chapitreDuParcoursDeLaClasse("mco", duParcours)).toBe(false);
    expect(chapitreDuParcoursDeLaClasse(null, duParcours)).toBe(false);
    // Les quatre pages de contenu fermé passent la règle.
    for (const p of ["app/cours/[chapitre]/page.tsx", "app/cours/enquete/[code]/page.tsx", "app/cours/bureau/[code]/page.tsx", "app/cours/scenario/[code]/page.tsx"]) {
      expect(lire(p), p).toMatch(/dansLeParcours: \w+\.parcours === null \|\| chapitreDuParcoursDeLaClasse\(/);
    }
  });
});

describe("le suivi de l'enseignant (/teacher/cours/[id])", () => {
  const page = lire("app/teacher/cours/[id]/page.tsx");

  it("s'ouvre sur le dernier chapitre libéré, à défaut le premier du parcours, et non plus sur le premier du registre", () => {
    expect(page).toMatch(/const choisi = chapitreParCode\(demande \?\? ""\) \?\? dernierLibere \?\? duParcours\[0\] \?\? CHAPITRES\[0\]!;/);
    expect(page).toContain("const duParcours = chapitresDuParcoursDansLOrdre(classe.parcours);");
  });

  it("une ligne par élève en tête : chapitre en cours, étape, dernière activité", () => {
    expect(page.indexOf("data-eleves-de-la-classe")).toBeLessThan(page.indexOf("data-code-de-classe"));
    for (const t of ["Chapitre en cours", "Étape", "Dernière activité"]) expect(page).toContain(`>${t}</th>`);
    expect(page).toContain("momentDeLActivite(r.majLe)");
    expect(page).toMatch(/!e\.commence \? "pas commencé"/);
  });

  it("son tableau dit qu'il défile, et s'atteint au clavier", () => {
    expect(page).toMatch(/role="region"\s+aria-label=\{`\$\{chapitre\.titre\} : où en est chaque élève, tableau qui défile de côté`\}\s+tabIndex=\{0\}/);
    expect(page).toContain("Faites glisser le tableau de côté pour voir toutes ses colonnes.");
  });

  it("le code de la classe se projette, comme celui de la partie et de la cohorte", () => {
    expect(page).toMatch(/href=\{`\/teacher\/cours\/\$\{classe\.id\}\/code`\}[\s\S]{0,120}Projeter le code/);
    const projection = lire("app/teacher/cours/[id]/code/page.tsx");
    expect(projection).toContain("data-code-projete");
    expect(projection).toContain("<CodeQr");
    expect(projection).toContain("laClasseDeLEnseignant(session.userId, id)");
  });

  it("au mur, le code de la classe n'a pas la barre du site, comme les projections de la partie et de la cohorte", () => {
    const barre = lire("components/site-header.tsx");
    const regle = /const enProjection = \/(.+)\/\.test\(/.exec(barre);
    expect(regle, "la règle de la barre en projection a changé de forme").not.toBeNull();
    const enProjection = new RegExp(regle![1]!);
    const id = "0b6c5a0e-6f3b-4c1e-9d47-0a1b2c3d4e5f";
    for (const chemin of [`/teacher/games/${id}/projection`, `/teacher/cohortes/${id}/projection`, `/teacher/cours/${id}/code`])
      expect(enProjection.test(chemin), chemin).toBe(true);
    // La page de la classe garde la barre du site.
    expect(enProjection.test(`/teacher/cours/${id}`)).toBe(false);
  });

  it("la liste de libération : le parcours de la classe et les chapitres libres, « à libérer » ou « hors de votre offre », une case par chapitre", () => {
    expect(page).toContain("const montres = sansParcours ? CHAPITRES.filter(chapitrePropose) : duParcours;");
    expect(page).toContain('"a-liberer": "à libérer"');
    expect(page).toContain('"hors-offre": "hors de votre offre"');
    expect(page).toContain("<CaseDeLiberation");
    // La case : un bouton d'envoi qui se lit comme une case à cocher, son chapitre et le geste en valeur.
    const vide = renderToStaticMarkup(createElement(CaseDeLiberation, { coche: false, chapitre: "seuil", libelle: "Ouvert à vos élèves : « Le seuil »" }));
    expect(vide).toMatch(/<button[^>]*type="submit"/);
    expect(vide).toContain('role="checkbox"');
    expect(vide).toContain('aria-checked="false"');
    expect(vide).toContain('name="case"');
    expect(vide).toContain('value="seuil:1"');
    const cochee = renderToStaticMarkup(createElement(CaseDeLiberation, { coche: true, chapitre: "seuil", libelle: "x" }));
    expect(cochee).toContain('aria-checked="true"');
    expect(cochee).toContain('value="seuil:0"');
    expect(lire("app/teacher/cours/actions.ts")).toMatch(/export async function libererDepuisLaListeAction\(classeId: string, vu: string, formData: FormData\)/);
  });

  it("la page d'une cohorte renvoie à la fiche enseignant de chacun de ses épisodes", () => {
    expect(lire("app/teacher/cohortes/[id]/page.tsx")).toMatch(/href=\{`\/enseignants\/episodes\/\$\{ep\.code\}`\}[\s\S]{0,120}data-fiche-de-l-episode=\{ep\.code\}/);
  });
});

describe("le formulaire de création d'une classe", () => {
  const groupes = parcoursRangesParDiplome().map((g) => ({ cle: g.cle, libelle: g.libelle, parcours: g.parcours.map((p) => ({ code: p.code, libelle: p.libelle })) }));
  const base = { groupes, impose: null, aide: "Aide.", ceQuEstUnParcours: CE_QU_EST_UN_PARCOURS, entreprises: [{ code: "hotel", nom: "L'ESCALE", tagline: "Un hôtel" }], nomMax: 80 };

  it("ne laisse pas le navigateur valider : les messages sont ceux du site", () => {
    const html = renderToStaticMarkup(createElement(NouvelleClasseDuCours, base));
    expect(html).toMatch(/<form[^>]*noValidate=""|<form[^>]*novalidate=""/i);
    // Les parcours rangés par diplôme, et la phrase qui dit ce qu'est un parcours, liée au champ.
    expect([...html.matchAll(/<optgroup label="([^"]*)"/g)].map((m) => m[1])).toEqual(groupes.map((g) => g.libelle));
    expect(texte(html)).toContain(CE_QU_EST_UN_PARCOURS);
    expect(html).toMatch(/<select[^>]*aria-describedby="parcours-de-la-classe-aide ce-qu-est-un-parcours"/);
  });

  it("après un refus : chaque erreur sous son champ, et la saisie gardée", () => {
    const html = renderToStaticMarkup(
      createElement(NouvelleClasseDuCours, {
        ...base,
        initial: {
          erreurs: { nom: "Donnez un nom à la classe.", parcours: "Choisissez le parcours." },
          valeurs: { nom: "BTS CG 2", parcours: "bts-cg", entreprise: "hotel", liberation: "chapitre" },
        },
      }),
    );
    expect(html).toMatch(/<input[^>]*name="nom"[^>]*value="BTS CG 2"|<input[^>]*value="BTS CG 2"[^>]*name="nom"/);
    expect(html).toMatch(/<option value="bts-cg" selected=""/);
    expect(html).toMatch(/<option value="hotel" selected=""/);
    expect(html).toMatch(/<input [^>]*name="liberation" checked="" value="chapitre"/);
    expect(html).not.toMatch(/<input [^>]*name="liberation" checked="" value="tout"/);
    expect(html).toContain('data-erreur-du-champ="nom"');
    expect(html).toContain('data-erreur-du-champ="parcours"');
    expect(html).toMatch(/aria-invalid="true"[^>]*aria-describedby="erreur-nom"|aria-describedby="erreur-nom"[^>]*aria-invalid="true"/);
    // Le nom vient avant son erreur, l'erreur avant le champ suivant.
    expect(html.indexOf('name="nom"')).toBeLessThan(html.indexOf('data-erreur-du-champ="nom"'));
    expect(html.indexOf('data-erreur-du-champ="nom"')).toBeLessThan(html.indexOf('name="parcours"'));
  });

  it("l'action dit toutes les erreurs d'un coup et rend la saisie ; la page passe la liste rangée", () => {
    const action = lire("app/teacher/cours/actions.ts");
    expect(action).toMatch(/if \(!valeurs\.nom\.trim\(\)\) erreurs\.nom = /);
    expect(action).toMatch(/if \(!valeurs\.parcours\) erreurs\.parcours = /);
    expect(action).toContain("if (erreurs.nom || erreurs.parcours) return { erreurs, valeurs };");
    expect(lire("app/teacher/cours/page.tsx")).toContain("<NouvelleClasseDuCours");
  });

  it("dit dès l'essai qu'une classe créée sans offre ne fixe pas le parcours d'une offre Classe", () => {
    const offres = { classe: "Classe", programme: "Programme", campus: "Campus" };
    expect(parcoursDeLEssai(offres)).toMatch(/Une classe créée pendant l'essai ne fixe pas le parcours d'une offre Classe : il se fixe au devis, ou par votre première classe créée sous la licence\./);
    expect(unParcoursParLicenceClasse(offres, null)).toMatch(/Une classe créée pendant l'essai ne le fixe pas\./);
    expect(lire("app/teacher/cours/page.tsx")).toContain(": parcoursDeLEssai(offres);");
  });
});

describe("les textes de Classe disent la règle du code", () => {
  it("la carte : un parcours de la liste, le même pour toutes les classes, fixé au devis ou par la première classe créée sous la licence, autant de classes que voulu", () => {
    expect(LE_COURS_PAR_OFFRE.classe).toContain("un parcours de la liste (le cours d'un diplôme ou une matière)");
    expect(LE_COURS_PAR_OFFRE.classe).toContain("Le même parcours pour toutes vos classes, fixé au devis ou par votre première classe créée sous la licence");
    expect(LE_COURS_PAR_OFFRE.classe).toContain("autant de classes que vous voulez, de {elevesParClasse} élèves au plus");
    expect(LE_COURS_PAR_OFFRE.decouverte).toBe("Un chapitre libre par diplôme et son cas pratique, en libre accès.");
  });

  it("les CGV, « Comment commander ? » et les conditions de /tarifs le disent aussi", () => {
    const cgv = lire("app/cgv/page.tsx");
    expect(cgv).toContain("{remplir(LE_COURS_PAR_OFFRE.classe, variablesDuCatalogue())}");
    expect(cgv).not.toMatch(/un groupe de \{ELEVES_PAR_CLASSE\}/);
    expect(cgv).toMatch(/dans l&apos;arène, une partie à la fois, de\{" "\}\s*\{ELEVES_PAR_CLASSE\} élèves au plus/);
    const commander = QUESTIONS_TARIFS.find((q) => q.q === "Comment commander ?")!.r;
    expect(commander).toContain(`pour ${OFFRES.classe.nom}, l'entreprise, le niveau et le parcours du cours, le même pour toutes vos classes`);
    expect(CONDITIONS_DE_VENTE.some((c) => c.includes("et pour Classe le niveau et le parcours du cours, sont écrits sur le devis"))).toBe(true);
    expect(
      CONDITIONS_DE_VENTE.some((c) => /celui écrit au devis, sinon celui de sa première classe créée sous la licence\. Il crée autant de classes du cours qu'il le souhaite, de \d+ élèves au plus chacune\./.test(c)),
    ).toBe(true);
  });
});
