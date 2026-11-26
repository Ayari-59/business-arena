import { describe, expect, it, vi } from "vitest";
import { chapitresDuParcoursDansLOrdre, coursDuDiplome } from "@/config/cours/par-diplome";
import { CHAPITRES, chapitreParCode } from "@/config/cours/registre";
import { themeDuChapitre } from "@/config/cours/themes";
import {
  MOT_DE_L_ACCES,
  accesDuSuivant,
  blocOuvert,
  chapitreDuBouton,
  chapitreSuivant,
  etatDuBloc,
  etatDuBlocEnClair,
  etatDuChapitre,
  etatEnClair,
  gesteDuChapitre,
  navigationDuChapitre,
  parcoursDeReference,
} from "@/pedagogy/cours/navigation-de-l-eleve";

// La règle de libération vit à côté de l'offre, qui lit la base : aucune requête ici, la règle est pure.
vi.mock("@/db", () => ({ db: {} }));
const { libereALaClasse } = await import("@/services/chapitres-de-la-classe");

/**
 * L'ÉLÈVE SAIT OÙ IL EN EST ET OÙ ALLER ENSUITE (audit du cours du 25 novembre 2026, usage 1.2 à 1.5) :
 * l'état d'un chapitre lu sur la progression enregistrée, le chapitre du bouton de « Ma classe », le
 * parcours de référence d'un chapitre et son suivant, l'accès du suivant (licence, libération chapitre par
 * chapitre) et la fin du parcours.
 */

const ordreBtsCg = coursDuDiplome("bts-cg")!.blocs.flatMap((b) => b.chapitres).sort((a, b) => a.rang - b.rang).map((l) => l.chapitre);

describe("l'état d'un chapitre, sur la progression enregistrée", () => {
  it("sans ligne : à faire ; au bout : fait ; sinon en cours, à l'étape qui attend l'élève", () => {
    expect(etatDuChapitre(null, 9)).toEqual({ etat: "a-faire" });
    expect(etatDuChapitre(undefined, 9)).toEqual({ etat: "a-faire" });
    // Une ligne à l'étape 0 : l'élève a agi sur la première étape (une erreur) : il l'a commencé.
    expect(etatDuChapitre({ etape: 0 }, 9)).toEqual({ etat: "en-cours", etape: 1, etapes: 9 });
    expect(etatDuChapitre({ etape: 3 }, 9)).toEqual({ etat: "en-cours", etape: 4, etapes: 9 });
    expect(etatDuChapitre({ etape: 9 }, 9)).toEqual({ etat: "fait" });
    // L'enregistrement borne l'étape au nombre d'étapes ; au-delà, c'est encore fait.
    expect(etatDuChapitre({ etape: 12 }, 9)).toEqual({ etat: "fait" });
  });

  it("se dit en clair et donne le geste du bouton", () => {
    expect(etatEnClair({ etat: "en-cours", etape: 4, etapes: 9 })).toBe("en cours, étape 4 sur 9");
    expect(etatEnClair({ etat: "fait" })).toBe("fait");
    expect(etatEnClair({ etat: "a-faire" })).toBe("à faire");
    expect(gesteDuChapitre({ etat: "en-cours", etape: 4, etapes: 9 })).toBe("Reprendre, étape 4 sur 9");
    expect(gesteDuChapitre({ etat: "a-faire" })).toBe("Commencer");
    expect(gesteDuChapitre({ etat: "fait" })).toBe("Revoir");
  });
});

describe("le chapitre du bouton de « Ma classe »", () => {
  const t = (jour: number) => new Date(Date.UTC(2026, 10, jour));
  const enCours = (code: string, etape: number, jour: number) => ({ code, etat: { etat: "en-cours" as const, etape, etapes: 9 }, majLe: t(jour) });
  const fait = (code: string, jour: number) => ({ code, etat: { etat: "fait" as const }, majLe: t(jour) });
  const aFaire = (code: string) => ({ code, etat: { etat: "a-faire" as const } });

  it("le chapitre en cours le plus récemment touché, même si la classe en propose un autre", () => {
    const lignes = [fait("a", 2), enCours("b", 3, 4), enCours("c", 2, 6), aFaire("d")];
    expect(chapitreDuBouton(lignes, "d")?.code).toBe("c");
  });

  it("rien en cours : celui que la classe propose, sauf s'il est fait ; alors le premier à faire", () => {
    expect(chapitreDuBouton([aFaire("a"), aFaire("b")], "b")?.code).toBe("b");
    expect(chapitreDuBouton([aFaire("a"), fait("b", 3), aFaire("c")], "b")?.code).toBe("a");
  });

  it("tout est fait : le plus récent, à revoir ; une liste vide : rien", () => {
    const b = chapitreDuBouton([fait("a", 2), fait("b", 5), fait("c", 3)], "a")!;
    expect(b.code).toBe("b");
    expect(gesteDuChapitre(b.etat)).toBe("Revoir");
    expect(chapitreDuBouton([], null)).toBeNull();
  });
});

describe("l'état d'un bloc et le bloc ouvert de la liste pliée", () => {
  it("fait, à faire, ou en cours avec le compte des faits", () => {
    expect(etatDuBloc([])).toBeNull();
    expect(etatDuBloc([{ etat: "fait" }, { etat: "fait" }])).toEqual({ etat: "fait" });
    expect(etatDuBloc([{ etat: "a-faire" }, { etat: "a-faire" }])).toEqual({ etat: "a-faire" });
    const e = etatDuBloc([{ etat: "fait" }, { etat: "en-cours", etape: 2, etapes: 9 }, { etat: "a-faire" }])!;
    expect(e).toEqual({ etat: "en-cours", faits: 1, sur: 3 });
    expect(etatDuBlocEnClair(e)).toBe("en cours, 1 fait sur 3");
    expect(etatDuBlocEnClair({ etat: "en-cours", faits: 0, sur: 3 })).toBe("en cours, 0 fait sur 3");
  });

  it("le bloc du chapitre en cours le plus récent ; sinon le premier qui a un chapitre pas fait ; un visiteur : le premier qui a des chapitres", () => {
    const af = (code: string) => ({ code, etat: { etat: "a-faire" as const } });
    const ok = (code: string) => ({ code, etat: { etat: "fait" as const } });
    const ec = (code: string, jour: number) => ({ code, etat: { etat: "en-cours" as const, etape: 1, etapes: 4 }, majLe: new Date(Date.UTC(2026, 10, jour)) });
    expect(blocOuvert([[], [af("a")], [af("b")]])).toBe(1);
    expect(blocOuvert([[ok("a")], [ok("b"), af("c")], [af("d")]])).toBe(1);
    expect(blocOuvert([[ec("a", 2)], [af("b")], [ec("c", 5)]])).toBe(2);
    expect(blocOuvert([[ok("a")], [ok("b")]])).toBe(0);
    expect(blocOuvert([[], []])).toBe(-1);
  });
});

describe("le parcours de référence d'un chapitre, et son suivant", () => {
  const premier = ordreBtsCg[0]!;
  const second = ordreBtsCg[1]!;

  it("depuis le diplôme de l'adresse : l'ordre de sa page, le fil Cours › diplôme › bloc, le retour à sa place dans la liste", () => {
    const r = parcoursDeReference(premier, { diplome: "bts-cg" });
    expect(r.genre).toBe("diplome");
    expect(r.chapitres.map((c) => c.code)).toEqual(ordreBtsCg.map((c) => c.code));
    expect(chapitreSuivant(r, premier.code)?.code).toBe(second.code);
    expect(r.fil.map((p) => p.libelle).slice(0, 2)).toEqual(["Cours", "BTS CG"]);
    expect(r.fil[1]!.href).toBe("/cours?diplome=bts-cg#programme");
    const rang = coursDuDiplome("bts-cg")!.blocs.findIndex((b) => b.chapitres.some((l) => l.chapitre.code === premier.code));
    expect(r.fil[2]).toEqual({ libelle: coursDuDiplome("bts-cg")!.blocs[rang]!.bloc, href: `/cours?diplome=bts-cg#bloc-${rang + 1}` });
    expect(r.retour).toEqual({ href: `/cours?diplome=bts-cg#chapitre-${premier.code}`, libelle: "Retour à la liste des chapitres" });
  });

  it("l'élève d'une classe : le parcours de sa classe l'emporte sur l'adresse, et mène à « Ma classe »", () => {
    const parcours = chapitresDuParcoursDansLOrdre("comptabilite-generale");
    const c = parcours[2]!;
    const r = parcoursDeReference(c, { classe: { parcours: "comptabilite-generale" }, diplome: "dcg" });
    expect(r.genre).toBe("classe");
    expect(chapitreSuivant(r, c.code)?.code).toBe(parcours[3]!.code);
    expect(r.fil).toEqual([{ libelle: "Ma classe", href: "/cours#ma-classe" }]);
    expect(r.retour).toEqual({ href: "/cours#ma-classe", libelle: "Retour à ma classe" });
  });

  it("un chapitre hors du parcours de la classe suit le diplôme d'où l'élève vient", () => {
    const ailleurs = ordreBtsCg.find((c) => !chapitresDuParcoursDansLOrdre("stmg").includes(c))!;
    expect(parcoursDeReference(ailleurs, { classe: { parcours: "stmg" }, diplome: "bts-cg" }).genre).toBe("diplome");
  });

  it("sans adresse : le diplôme du chapitre ; hors de tout diplôme : son parcours du registre, rangé sous son thème", () => {
    const c = chapitreParCode("les-operations-en-devises")!;
    expect(parcoursDeReference(c).diplome).toBe("dcg");
    const seconde = CHAPITRES.find((x) => x.parcours === "seconde-mg")!;
    const r = parcoursDeReference(seconde);
    expect(r.genre).toBe("parcours");
    expect(r.chapitres.every((x) => x.parcours === "seconde-mg")).toBe(true);
    const theme = themeDuChapitre(seconde.code);
    expect(r.retour.href).toBe(theme ? `/cours#theme-${theme.code}` : "/cours");
  });

  it("le dernier chapitre d'un parcours n'a pas de suivant : la fin le dit", () => {
    const dernier = ordreBtsCg.at(-1)!;
    const r = parcoursDeReference(dernier, { diplome: "bts-cg" });
    expect(chapitreSuivant(r, dernier.code)).toBeNull();
    const nav = navigationDuChapitre(r, dernier.code, null, (c) => `/cours/${c.code}?entreprise=nova`);
    expect(nav.suite).toEqual({ genre: "fin", phrase: "C'est le dernier chapitre du parcours BTS CG : le parcours est fini." });
    const classe = parcoursDeReference(chapitresDuParcoursDansLOrdre("stmg").at(-1)!, { classe: { parcours: "stmg" } });
    expect(navigationDuChapitre(classe, classe.chapitres.at(-1)!.code, null, () => "").suite).toEqual({
      genre: "fin",
      phrase: "C'est le dernier chapitre du parcours de votre classe : le parcours est fini.",
    });
  });

  it("le lien du suivant porte le diplôme d'un parcours de diplôme ; un chapitre hors du parcours (un cas pratique) n'a pas de suite", () => {
    const r = parcoursDeReference(premier, { diplome: "bts-cg" });
    const nav = navigationDuChapitre(r, premier.code, { chapitre: second, acces: "ouvert" }, (c) => `/cours/${c.code}?entreprise=nova`);
    expect(nav.suite).toEqual({ genre: "suivant", code: second.code, titre: second.titre, href: `/cours/${second.code}?entreprise=nova&diplome=bts-cg`, acces: "ouvert" });
    expect(navigationDuChapitre(r, "un-cas-pratique", null, () => "").suite).toBeNull();
  });
});

describe("l'accès du chapitre suivant : la licence et la libération de l'enseignant décident", () => {
  it("ouvert : un lien ; un visiteur sans licence : réservé", () => {
    expect(accesDuSuivant({ ouvert: true, eleve: null })).toBe("ouvert");
    expect(accesDuSuivant({ ouvert: false, eleve: null })).toBe("reserve");
    expect(MOT_DE_L_ACCES.reserve).toBe("réservé aux établissements sous licence");
  });

  it("libération chapitre par chapitre : le suivant pas encore libéré se dit « pas encore ouvert par votre enseignant »", () => {
    const [c1, c2, c3] = chapitresDuParcoursDansLOrdre("controle-de-gestion").filter((c) => !c.libre && !(c.prerequis?.length));
    const liberes = new Set([c1!.code, c3!.code]);
    // La règle de la classe (services/chapitres-de-la-classe.ts) : c2 n'est pas libéré, c3 l'est.
    expect(libereALaClasse("chapitre", liberes, c2!)).toBe(false);
    expect(libereALaClasse("chapitre", liberes, c3!)).toBe(true);
    const acces = accesDuSuivant({ ouvert: libereALaClasse("chapitre", liberes, c2!), eleve: { ouvertSansLiberation: true, dansLeParcours: true } });
    expect(acces).toBe("a-liberer");
    expect(MOT_DE_L_ACCES[acces as "a-liberer"]).toBe("pas encore ouvert par votre enseignant");
    // En « tout », la libération n'ouvre rien de plus que l'offre : le chapitre suit la licence.
    expect(accesDuSuivant({ ouvert: libereALaClasse("tout", new Set(), c2!), eleve: { ouvertSansLiberation: true, dansLeParcours: true } })).toBe("ouvert");
  });

  it("fermé par l'offre de la classe : « pas encore ouvert pour votre classe » dans son parcours, « hors du programme » sinon", () => {
    expect(accesDuSuivant({ ouvert: false, eleve: { ouvertSansLiberation: false, dansLeParcours: true } })).toBe("ferme-a-la-classe");
    expect(accesDuSuivant({ ouvert: false, eleve: { ouvertSansLiberation: false, dansLeParcours: false } })).toBe("hors-programme");
    expect(MOT_DE_L_ACCES["hors-programme"]).toBe("hors du programme de votre classe");
  });
});
