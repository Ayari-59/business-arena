import { createElement, type ComponentProps } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { casDeLEntreprise } from "@/config/cours/cas";
import { competencesAffichees } from "@/config/cours/competences-affichees";
import { ENTREPRISES_DU_COURS } from "@/config/cours/metiers";
import { CHAPITRES } from "@/config/cours/registre";
import { servirLeChapitre } from "@/pedagogy/cours/chapitre-servi";
import { accesDuSuivant, chapitreSuivant, navigationDuChapitre, parcoursDeReference } from "@/pedagogy/cours/navigation-de-l-eleve";
import { suitesDuChapitre } from "@/pedagogy/cours/suites";
import { FORMATIONS } from "@/config/formations";
import { chapitresDuParcoursDansLOrdre, coursDuDiplome } from "@/config/cours/par-diplome";
import { PARCOURS_PROPOSES_A_CHOISIR } from "@/config/cours/parcours-a-choisir";

// Le guide porte l'action qui remonte la progression d'une classe, laquelle traverse `@/db`, dont
// l'import jette sans DATABASE_URL : aucune requête n'est faite ici, on ne rend que du HTML.
vi.mock("@/db", () => ({ db: {} }));
vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));
const { FinDuChapitre } = await import("@/components/cours/chapitre-guide");

/**
 * GARDE : CHAQUE CHAPITRE A UN SUIVANT, OU DIT QUE LE PARCOURS EST FINI (audit du cours du 25 novembre
 * 2026, usage 1.3 : 190 chapitres sur 255 finissaient sans « chapitre suivant », et « Retour au cours »
 * ramenait à la vitrine).
 *
 * Les 255 chapitres sont servis comme la page les sert (`servirLeChapitre` dans la première entreprise où
 * ils se jouent, les compétences du diplôme du chapitre), puis leur écran de fin est rendu avec la
 * navigation que la page calcule pour un visiteur sans classe ni diplôme dans l'adresse. Chaque fin doit
 * porter un « Chapitre suivant » (un lien, ou le titre et la raison s'il est fermé) ou la phrase de fin de
 * parcours, et son « Retour » mener à une liste, pas à l'accueil du cours.
 */

const SUIVI_FINI = (n: number) => ({ index: n, etapes: {} });

function finServie(code: string): string {
  const source = CHAPITRES.find((c) => c.code === code)!;
  const entreprise = source.entreprises?.codes[0] ?? ENTREPRISES_DU_COURS[0]!;
  const cas = casDeLEntreprise(entreprise);
  const chapitre = servirLeChapitre(source, cas, competencesAffichees(source));
  const reference = parcoursDeReference(source);
  const suivant = chapitreSuivant(reference, code);
  const navigation = navigationDuChapitre(
    reference,
    code,
    suivant ? { chapitre: suivant, acces: accesDuSuivant({ ouvert: suivant.libre, eleve: null }) } : null,
    (c) => `/cours/${c.code}?entreprise=${entreprise}`,
  );
  const props = {
    chapitre,
    cas,
    suivi: SUIVI_FINI(chapitre.etapes.length),
    entreprises: [{ code: entreprise, nom: cas.entreprise }],
    recommencer: () => {},
    revoir: () => {},
    classe: false,
    mission: null,
    suites: suitesDuChapitre(code),
    garde: "",
    navigation,
  } as unknown as ComponentProps<typeof FinDuChapitre>;
  return renderToStaticMarkup(createElement(FinDuChapitre, props));
}

describe("garde : la fin de chaque chapitre mène au suivant de son parcours, ou dit la fin du parcours", () => {
  const fins = CHAPITRES.map((c) => ({ code: c.code, html: finServie(c.code) }));

  it("les 255 chapitres sont servis", () => {
    expect(fins.length).toBe(255);
  });

  it("chaque fin porte « Chapitre suivant » ou la fin du parcours", () => {
    const sansSuite = fins.filter(
      ({ html }) => !/data-chapitre-suivant-du-parcours="[^"]+"[^>]*>[\s\S]*?Chapitre suivant : /.test(html) && !/data-fin-du-parcours=""[^>]*>[\s\S]*?le parcours est fini/.test(html),
    );
    expect(sansSuite.map((f) => f.code), `${sansSuite.length} chapitres sur ${fins.length} sans suite`).toEqual([]);
  });

  it("le « Retour » de la fin mène à la liste d'où l'on vient, jamais à l'accueil du cours", () => {
    const versLAccueil = fins.filter(({ html }) => /href="\/cours"[^>]*>Retour/.test(html) || !/data-retour-du-chapitre=""/.test(html));
    expect(versLAccueil.map((f) => f.code)).toEqual([]);
  });

  it("depuis chaque diplôme et dans chaque parcours de classe : un suivant pour chaque chapitre, la fin pour le dernier seul", () => {
    const fautes: string[] = [];
    const verifier = (ou: string, codes: readonly string[], contexte: Parameters<typeof parcoursDeReference>[1]) => {
      codes.forEach((code, i) => {
        const reference = parcoursDeReference(CHAPITRES.find((c) => c.code === code)!, contexte);
        const suivant = chapitreSuivant(reference, code);
        const attendu = codes[i + 1] ?? null;
        if ((suivant?.code ?? null) !== attendu) fautes.push(`${ou} : ${code} → ${suivant?.code ?? "fin"}, attendu ${attendu ?? "fin"}`);
      });
    };
    for (const f of FORMATIONS) {
      const cours = coursDuDiplome(f.code);
      if (!cours) continue;
      const ordre = cours.blocs.flatMap((b) => b.chapitres).sort((a, b) => a.rang - b.rang).map((l) => l.chapitre.code);
      verifier(`diplôme ${f.code}`, ordre, { diplome: f.code });
    }
    for (const p of PARCOURS_PROPOSES_A_CHOISIR) {
      verifier(`classe ${p.code}`, chapitresDuParcoursDansLOrdre(p.code).map((c) => c.code), { classe: { parcours: p.code } });
    }
    expect(fautes).toEqual([]);
  });
});
