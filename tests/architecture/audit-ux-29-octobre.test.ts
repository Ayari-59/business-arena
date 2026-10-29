import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/db", () => ({ db: {} }));

import { ENTREPRISES, NIVEAUX_DE_L_ARENE, parametrageRequisAuDevis } from "@/config/tarifs";
import { NAVIGATION_ENSEIGNANT } from "@/config/navigation";
import { DevisForm } from "@/components/devis-form";
import { AccueilDeLaDecouverte } from "@/components/accueil-de-la-decouverte";
import { CompetitionCreateForm } from "@/components/competition-create-form";
import { ChapitreReserve } from "@/components/cours/chapitre-reserve";
import { NavigationEnseignant } from "@/components/en-tete-enseignant";
import { DureeDuTourAffichee } from "@/components/duree-du-tour";
import { NIVEAU_PAR_DEFAUT } from "@/components/quick-config-form";
import { chapitreOuvertALaClasse, classeSansOffre } from "@/services/chapitres-de-la-classe";
import { etapesARevoir, grandPasDuCurseur, montantInsecable, phraseDeReprise } from "@/pedagogy/cours/aides-du-guide";
import { distinguerLesHomonymes } from "@/lib/format";

/**
 * L'AUDIT UX DU 29 OCTOBRE 2026 (audit-ux/rapport.md), TENU : une garde par défaut corrigé.
 * Les actions des codes d'élève : tests/unit/audit-ux-29-octobre-codes.test.ts ; le devis et
 * la connexion côté serveur : tests/integration/audit-ux-29-octobre.test.ts.
 */

const lire = (chemin: string) => readFileSync(join(process.cwd(), "src", chemin), "utf8");
const texte = (html: string) =>
  html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ");
const rendu = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);

describe("P0-1 · l'enseignant sans offre sait d'emblée ce qu'il peut faire", () => {
  it("l'accueil de la Découverte dit le solo, la classe du cours, les démonstrations, et le devis", () => {
    const t = texte(rendu(createElement(AccueilDeLaDecouverte, { essai: { autorise: false, dureeMaxJours: 30 }, niveauMax: 3 })));
    expect(t).toContain("Votre compte est en Découverte");
    expect(t).toContain("aux niveaux 1 à 3");
    expect(t).toContain("Ouvrir une classe du cours");
    expect(t).toContain("épisodes de démonstration");
    expect(t).toContain("Demander un devis");
    expect(t).not.toContain("Demander l'essai");
  });

  it("l'essai de l'offre Classe est proposé quand le propriétaire l'a ouvert, avec sa durée", () => {
    const html = rendu(createElement(AccueilDeLaDecouverte, { essai: { autorise: true, dureeMaxJours: 21 }, niveauMax: 3 }));
    expect(texte(html)).toContain("Demander l'essai");
    expect(texte(html)).toContain("21 jours au plus");
    expect(html).toContain('href="/devis?offre=classe"');
  });

  it("le tableau de bord montre l'accueil sans offre, et grise le formulaire de partie avant la saisie", () => {
    const page = lire("app/teacher/page.tsx");
    expect(page).toMatch(/!licence \? \(\s*<AccueilDeLaDecouverte/);
    expect(page).toContain('<fieldset disabled={!licence || undefined} className="contents"');
    expect(page).toContain("<CompetitionCreateForm desactive={!licence} />");
    // Le formulaire ne s'ouvre plus de lui-même sans offre.
    expect(page).toContain("open={(licence && games.length === 0) || Boolean(echec) || undefined}");
  });

  it("le formulaire de concours grisé désactive tous ses champs et son bouton", () => {
    const html = rendu(createElement(CompetitionCreateForm, { desactive: true }));
    expect(html).toMatch(/<fieldset disabled="" class="contents"/);
    expect(rendu(createElement(CompetitionCreateForm))).not.toMatch(/<fieldset disabled/);
  });

  it("cohortes et examens : grisés sans l'offre qui les ouvre", () => {
    expect(lire("app/teacher/cohortes/page.tsx")).toContain("<fieldset disabled={!licence || undefined}");
    expect(lire("app/teacher/examens/page.tsx")).toContain("<fieldset disabled={!module || undefined}");
  });
});

describe("P1-1 · la classe du cours sans offre, et l'élève devant un chapitre fermé", () => {
  const libre = { libre: true, parcours: "comptabilite-generale" } as const;
  const autre = { libre: false, parcours: "mco" } as const;
  const duParcours = { libre: false, parcours: "comptabilite-generale" } as const;
  const classe = { parcours: "comptabilite-generale", heritee: false };

  it("la règle de la classe est celle de l'élève (coursOuvert)", () => {
    expect(chapitreOuvertALaClasse(null, classe, libre)).toBe(true);
    expect(chapitreOuvertALaClasse(null, classe, duParcours)).toBe(false);
    expect(chapitreOuvertALaClasse("classe", classe, duParcours)).toBe(true);
    expect(chapitreOuvertALaClasse("classe", classe, autre)).toBe(false);
    expect(chapitreOuvertALaClasse("programme", classe, autre)).toBe(false);
    expect(chapitreOuvertALaClasse("campus", classe, autre)).toBe(true);
    // Une classe héritée sans parcours garde tout, sous Classe ou Programme.
    expect(chapitreOuvertALaClasse("classe", { parcours: null, heritee: true }, autre)).toBe(true);
    expect(chapitreOuvertALaClasse("classe", { parcours: null, heritee: false }, autre)).toBe(false);
  });

  it("la création d'une classe sans offre le dit, et la page de la classe marque les chapitres fermés", () => {
    expect(classeSansOffre("Créer son entreprise")).toMatch(/n'ouvre à vos élèves que le chapitre libre, « Créer son entreprise »/);
    const creation = lire("app/teacher/cours/page.tsx");
    expect(creation).toMatch(/!offre && libre \? \(\s*<p data-classe-du-cours-sans-offre/);
    const page = lire("app/teacher/cours/[id]/page.tsx");
    expect(page).toContain("data-classe-du-cours-sans-offre");
    expect(page).toContain('data-chapitre-ferme={ouvert(c) ? undefined : ""}');
  });

  it("l'élève d'une classe ne voit ni « Voir les offres » ni « Demander un devis »", () => {
    const props = { titre: "Les flux", reserve: "Ce chapitre est réservé", chapitreLibre: "creation-premier-bilan" };
    const eleve = rendu(createElement(ChapitreReserve, { ...props, eleve: { classe: "BTS 1" } }));
    expect(texte(eleve)).toContain("n'est pas encore ouvert pour ta classe, « BTS 1 »");
    expect(texte(eleve)).toContain("ton enseignant");
    expect(texte(eleve)).not.toMatch(/Voir les offres|Demander un devis|licence/);
    expect(eleve).not.toContain("/devis");
    expect(eleve).not.toContain("/tarifs");
    // Le visiteur et l'enseignant gardent le chemin vers les offres.
    const visiteur = texte(rendu(createElement(ChapitreReserve, { ...props, eleve: null })));
    expect(visiteur).toContain("Voir les offres");
    expect(visiteur).toContain("Demander un devis");
    expect(lire("app/cours/[chapitre]/page.tsx")).toContain("classeDeLEleveLue && !(await getSession())");
  });
});

describe("P1-2 · l'élève qui rejoint une classe arrive sur « Ma classe »", () => {
  it("le nom de la classe, un gros bouton pour commencer, rien de destiné aux enseignants", () => {
    const page = lire("app/cours/page.tsx");
    expect(page).toContain("Ma classe : « {classe.classe} »");
    expect(page).toContain("data-commencer-en-classe");
    expect(page).toContain("{classe ? null : <ArticulationDuCours />}");
    expect(page).toMatch(/\{classe \? null : \(\s*<Link[\s\S]{0,400}Projeter en classe/);
  });
});

describe("P1-5 · la connexion garde l'e-mail ; le « mot de passe oublié » mène au vrai flux", () => {
  it("l'e-mail revient dans son champ après un refus", () => {
    const f = lire("components/teacher-auth-forms.tsx");
    expect(f).toContain('defaultValue={loginState.values?.email ?? ""}');
    // Le lien existe et mène à la page de demande (services/mot-de-passe-oublie.service.ts).
    expect(f).toMatch(/href="\/teacher\/mot-de-passe-oublie"/);
  });
});

describe("P1-6, P1-7 · le devis garde la saisie, dit l'erreur sous le champ, et n'exige le paramétrage que pour Classe", () => {
  const base = {
    organisation: "L'établissement",
    exempleOrganisation: "",
    identifiant: "UAI",
  };
  const props = {
    offres: [
      { code: "classe", offre: "Classe", ...base, entreprise: true as const, niveau: true as const },
      { code: "programme", offre: "Programme", ...base, entreprise: true as const, effectif: "Enseignants" },
      { code: "campus", offre: "Campus", ...base, effectif: "Enseignants" },
    ],
    offreInitiale: "classe",
    entreprises: ENTREPRISES.map((e) => ({ code: e.code, nom: e.nom })),
    niveaux: NIVEAUX_DE_L_ARENE,
    vendeur: "V",
    mentionTva: "TVA",
    contact: "c@x.test",
  };

  it("après un code promo refusé : entreprise et niveau gardés, l'erreur sous le champ du code", () => {
    const html = rendu(
      createElement(DevisForm, {
        ...props,
        initial: {
          error: "Ce code promo n'existe pas.",
          champ: "codePromo",
          ok: null,
          values: { offre: "classe", entreprise: ENTREPRISES[1]!.code, niveau: "4", codePromo: "FAUX", nom: "Claire" },
        },
      }),
    );
    expect(html).toMatch(new RegExp(`<option value="${ENTREPRISES[1]!.code}" selected`));
    expect(html).toMatch(/<option value="4" selected/);
    expect(html).toMatch(/<input[^>]*aria-invalid="true"[^>]*aria-describedby="erreur-codePromo"[^>]*name="codePromo"/);
    expect(html).toMatch(/<span id="erreur-codePromo" role="alert" data-erreur-du-champ="codePromo"[^>]*>Ce code promo n&#x27;existe pas\.<\/span>/);
    // Le message n'est pas répété en bas du formulaire.
    expect(html.match(/Ce code promo n&#x27;existe pas/g)).toHaveLength(1);
  });

  it("le formulaire est envoyé sans les bulles du navigateur (P2-9)", () => {
    expect(rendu(createElement(DevisForm, props))).toMatch(/<form[^>]*noValidate=""|<form[^>]*novalidate=""/i);
  });

  it("Classe exige entreprise et niveau ; Programme les laisse facultatifs", () => {
    expect(parametrageRequisAuDevis({ entreprise: true, niveau: true })).toBe(true);
    expect(parametrageRequisAuDevis({ entreprise: true })).toBe(false);
    expect(parametrageRequisAuDevis({})).toBe(false);
    const programme = rendu(createElement(DevisForm, { ...props, offreInitiale: "programme" }));
    expect(programme).not.toMatch(/<select[^>]*required[^>]*name="entreprise"|<select[^>]*name="entreprise"[^>]*required/);
    expect(texte(programme)).toContain("À choisir plus tard par l'équipe");
    const classe = rendu(createElement(DevisForm, props));
    expect(classe).toMatch(/<select[^>]*required[^>]*name="entreprise"|<select[^>]*name="entreprise"[^>]*required/);
  });
});

describe("P1-8 · /jouer présélectionne le niveau qu'elle conseille", () => {
  it("« commencez au niveau 1 », et le niveau 1 coché", () => {
    expect(lire("app/jouer/page.tsx")).toContain("Commencez au niveau 1.");
    expect(NIVEAU_PAR_DEFAUT).toBe(1);
  });
});

describe("P1-9 · le suivi de classe ne commence pas par cinquante chapitres", () => {
  it("la liste des chapitres est repliée", () => {
    expect(lire("app/teacher/cours/[id]/page.tsx")).toMatch(/<details className="group" data-chapitres-de-la-classe="">/);
  });
});

describe("P1-10 · un bilan de fin de chapitre honnête", () => {
  it("les étapes notées non réussies du premier coup sont à revoir, dans l'ordre", () => {
    const etapes = [
      { id: "a", titre: "Lire", type: "lecture" },
      { id: "b", titre: "Apport", type: "ecriture" },
      { id: "c", titre: "Paie", type: "montants" },
      { id: "d", titre: "TVA", type: "montants" },
    ];
    const suivi = {
      b: { essais: 1, reussi: true, aide: false },
      c: { essais: 2, reussi: true, aide: true },
      d: { essais: 2, reussi: true, aide: false },
    };
    expect(etapesARevoir(etapes, suivi)).toEqual([
      { id: "c", titre: "Paie", index: 2 },
      { id: "d", titre: "TVA", index: 3 },
    ]);
    const guide = lire("components/cours/chapitre-guide.tsx");
    expect(guide).toContain('aRevoir.length > 0 ? "Ce que le chapitre vous a fait travailler" : "Ce que vous savez faire"');
  });
});

describe("P2-2 · le message des montants faux ne renvoie plus au journal", () => {
  it("la paie (sans vue) renvoie à l'énoncé", () => {
    expect(phraseDeReprise(2, undefined)).toBe("Des montants ne conviennent pas encore. Reprenez-les à partir des données de l'énoncé.");
    expect(phraseDeReprise(1, "tva")).toMatch(/^Un montant ne convient pas encore\. .*comptes affichés/);
    expect(lire("components/cours/chapitre-guide.tsx")).not.toContain("à partir du journal");
  });
});

describe("P2-3, P2-4 · le curseur au clavier, les montants sur téléphone", () => {
  it("Page haut / Page bas avancent d'un grand pas", () => {
    expect(grandPasDuCurseur(0, 120_000)).toBe(1000);
    expect(grandPasDuCurseur(0, 200)).toBe(1);
    expect(grandPasDuCurseur(0, 50)).toBe(1);
    expect(lire("components/cours/chapitre-guide.tsx")).toContain('e.key === "PageUp"');
  });
  it("l'unité ne se sépare pas du nombre", () => {
    expect(montantInsecable("150 000 €")).toBe("150 000 €");
    expect(montantInsecable("-1 200 €")).toBe("−1 200 €");
  });
});

describe("P2-5 · la barre du bas ne double pas le bouton du héros au premier écran", () => {
  it("avant la première mesure, la barre attend", () => {
    expect(lire("components/barre-d-action-mobile.tsx")).toContain("const boutonVisible = vu.chemin === chemin ? vu.visible : true;");
  });
});

describe("P2-7 · l'exemple de code est sous le champ, pas dedans", () => {
  it("plus de placeholder qui ressemble à une saisie", () => {
    const f = lire("components/join-form.tsx");
    expect(f).not.toContain('placeholder="EX : K7M2PR"');
    expect(f).toContain("data-exemple-de-code");
  });
});

describe("P2-9 · les messages du site, en français, sous le champ", () => {
  it("l'inscription enseignant n'utilise plus les bulles du navigateur", () => {
    const f = lire("components/teacher-auth-forms.tsx");
    expect(f).toContain("<form action={avecLAncre(registerFormAction)} noValidate");
    expect(f).toContain('erreur={erreurDe(registerState, "password")}');
  });
});

describe("P2-10 · le pilotage distingue les homonymes et tait une durée à zéro", () => {
  it("deux Inès ont chacune leur numéro", () => {
    expect(distinguerLesHomonymes(["Inès (démo)", "Inès", "Léo"])).toEqual(["Inès (démo) n°1", "Inès n°2", "Léo"]);
    expect(distinguerLesHomonymes(["Léo", "Zoé"])).toEqual(["Léo", "Zoé"]);
  });
  it("« ≈ 0 min (mesuré) » laisse la place à l'estimation", () => {
    const estimation = { minutes: 18, lecture: 5, saisie: 8, analyse: 5, priseEnMain: 0 };
    const zero = texte(rendu(createElement(DureeDuTourAffichee, { estimation, mesure: 0, libelleTourMesure: null, compact: true })));
    expect(zero).toContain("≈ 18 min (estimé)");
    const douze = texte(rendu(createElement(DureeDuTourAffichee, { estimation, mesure: 12, libelleTourMesure: null, compact: true })));
    expect(douze).toContain("≈ 12 min (mesuré)");
  });
});

describe("P2-11 · une ligne sous chaque rubrique de l'espace enseignant", () => {
  it("partie, examen, cohorte, classe du cours : chacune dit ce qu'elle est", () => {
    for (const code of ["parties", "examens", "cohortes", "cours"]) {
      expect(NAVIGATION_ENSEIGNANT.find((p) => p.code === code)?.aide).toBeTruthy();
    }
    const html = rendu(createElement(NavigationEnseignant, { actif: "cours" }));
    expect(html).toContain('data-aide-de-la-rubrique="cours"');
    expect(texte(html)).toContain("Une classe du cours : vos élèves suivent les chapitres");
  });
});
