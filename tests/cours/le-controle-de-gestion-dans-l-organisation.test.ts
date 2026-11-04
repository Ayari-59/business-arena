import { describe, expect, it } from "vitest";
import {
  CRITERES_DU_LABORATOIRE,
  LE_CONTROLE_DE_GESTION_DANS_L_ORGANISATION,
  laboratoireDesCentres,
  organisationDuChapitre,
} from "../../src/config/cours/chapitres/le-controle-de-gestion-dans-l-organisation";
import {
  SERVICES_DE_NOVA,
  SERVICE_COMMERCIAL,
  chaineDeValeur,
  chargesDeLAtelierParNature,
  coutDeLAtelierDuMois,
  durabiliteDuSalaire,
  meilleurPrixPourNova,
  performanceDuMois,
  prixPlancher,
  prixQueChoisit,
  trimestreAuPrix,
  typeDuCentre,
} from "../../src/config/cours/monde/organisation-du-controle";
import { NOVA_GESTION } from "../../src/config/cours/monde/nova-gestion";
import { CHAPITRES, PROGRAMME } from "../../src/config/cours/registre";
import { THEMES } from "../../src/config/cours/themes";
import { CAS_PAR_CHAPITRE } from "../../src/config/cours/situations";
import { MOIS_DU_CAS, UN_MAUVAIS_MOIS_POUR_L_ATELIER, moisDeLAtelier } from "../../src/config/cours/situations/par-chapitre/un-mauvais-mois-pour-l-atelier";
import { missionDuChapitre } from "../../src/config/cours/jouez";
import { chapitreDuCas } from "../../src/pedagogy/cours/deroule";
import { NOVA, VIDE, attendus, etape, gardeDuCas, gardeDuCurseur, gardeDuProgramme, gardesDeTexte, juste, triDe } from "./gardes-de-nova";
import { gardeDuLaboratoire } from "./gardes-du-lycee";

/**
 * LE CONTRÔLE DE GESTION DANS L'ORGANISATION (NOVA, son dirigeant, ses centres) : chaque chiffre refait à
 * la main, à partir de la fiche (janvier : 1 590 enceintes à 59 €, 22 € de composants et 16 € d'autres
 * coûts variables, 19 700 € de loyer, 10 650 € de paie, 833 € d'usure ; les clés des centres d'analyse ;
 * la demande du trimestre, 16 755 − 203 × p, la ligne à 7 000 enceintes, 3 × 31 183 € de charges fixes ;
 * le marché du semestre) et de la fiche de capacité (1 875 € bruts, le marché à 1 950 € puis 2 000 €, le
 * seuil de 95 %, 42 % de cotisations patronales, 3 000 € par recrutement).
 */

const ch = LE_CONTROLE_DE_GESTION_DANS_L_ORGANISATION;
const c = (v: number) => Math.round(v * 100) / 100 + 0;

/** Le trimestre au prix p, écrit en clair. */
function trimestre(p: number) {
  const demande = Math.floor(16_755 - 203 * p + 1e-9);
  const ventes = Math.min(demande, 7_000);
  const marge = c(ventes * (p - 38));
  return { demande, ventes, chiffreDAffaires: c(ventes * p), marge, resultat: c(marge - 3 * 31_183) };
}

describe("le contrôle de gestion dans l'organisation : le chapitre", () => {
  it("passe les gardes de texte, de réponse unique et de notions, et se sert sans erreur", () => {
    gardesDeTexte(ch);
  });

  it("est au registre, au programme du contrôle de gestion (palier 4), au thème, et cite le DCG UE11 et le BUT GEA", () => {
    expect(CHAPITRES).toContain(ch);
    gardeDuProgramme(ch, PROGRAMME["controle-de-gestion"][4]!);
    expect(ch.parcours).toBe("controle-de-gestion");
    expect(ch.palier).toBe(4);
    expect(ch.blocs.map((b) => b.split(" · ")[0])).toEqual(["DCG UE11", "BUT GEA"]);
    expect(THEMES.find((t) => t.code === "controle-de-gestion")!.chapitres).toContain(ch.code);
    expect(ch.prerequis).toEqual(["seuil-de-rentabilite", "cout-complet"]);
    expect(ch.ensuite).toEqual(["piloter-un-centre", "la-demarche-budgetaire"]);
    for (const code of [...ch.prerequis!, ...ch.ensuite!]) expect(CHAPITRES.map((x) => x.code)).toContain(code);
    expect(ch.objectifs.length).toBeGreaterThanOrEqual(3);
    expect(ch.objectifs.length).toBeLessThanOrEqual(5);
    expect(ch.etapes.length).toBeLessThanOrEqual(20);
    for (const e of ch.etapes) if (e.type !== "lecture") expect(e.objectifs?.length, e.id).toBeGreaterThan(0);
    for (const i of ch.objectifs.keys()) expect(ch.etapes.some((e) => e.objectifs?.includes(i)), `objectif ${i}`).toBe(true);
    expect(missionDuChapitre(ch.code, NOVA)).not.toBeNull();
  });

  it("la bonne réponse n'est jamais la plus longue", () => {
    for (const e of chapitreDuCas(ch, NOVA).etapes) {
      if (e.type !== "choix") continue;
      const o = e.options(NOVA, VIDE);
      const bonne = o.find((k) => k.juste)!;
      expect(bonne.texte.length, e.id).toBeLessThan(Math.max(...o.filter((k) => !k.juste).map((k) => k.texte.length)));
    }
  });
});

describe("le monde : la chaîne de valeur, les centres, la contrôlabilité", () => {
  it("la chaîne de valeur : 1 600,80 € et 3 609,15 € de soutien, 25 973,05 € d'activités principales, 16,7 % des 31 183 €", () => {
    const k = chaineDeValeur(NOVA_GESTION);
    // L'entretien : 5 % du loyer et de la paie, 10 % de l'usure ; l'administration : 10 %, 15 % et 5 %.
    const entretien = c(0.05 * 19_700 + 0.05 * 10_650 + 0.1 * 833);
    const administration = c(0.1 * 19_700 + 0.15 * 10_650 + 0.05 * 833);
    expect([entretien, administration]).toEqual([1_600.8, 3_609.15]);
    expect(k.soutien).toBe(c(entretien + administration));
    expect(k.principales).toBe(c(31_183 - entretien - administration));
    expect(k.total).toBe(31_183);
    expect(Math.round(k.partDuSoutien * 1_000) / 10).toBe(16.7);
    expect(attendus(ch, "le-poids-du-soutien")).toEqual([5_209.95, 25_973.05, 16.7]);
    expect(triDe(ch, "la-chaine-de-valeur")).toEqual({
      "Approvisionnement : commander et recevoir les composants": "principale",
      "Production : monter et tester les enceintes": "principale",
      "Distribution : vendre et expédier": "principale",
      "Entretien de la ligne": "soutien",
      "Administration : comptabilité, paie, direction": "soutien",
    });
  });

  it("le type d'un centre se lit sur ce que son responsable maîtrise", () => {
    expect(SERVICES_DE_NOVA.map((s) => typeDuCentre(s.maitrise))).toEqual(["couts", "depenses-discretionnaires", "investissement"]);
    expect(typeDuCentre(SERVICE_COMMERCIAL["chiffre-d-affaires"])).toBe("chiffre-d-affaires");
    expect(typeDuCentre(SERVICE_COMMERCIAL.profit)).toBe("profit");
    expect(juste(ch, "le-type-de-l-administration")).toEqual(["Un centre de dépenses discrétionnaires"]);
  });

  it("l'atelier maîtrise 60 420 € de consommations sur 83 888,15 € ; ses 23 468,15 € de charges fixes se décident ailleurs", () => {
    const a = chargesDeLAtelierParNature(NOVA_GESTION);
    // L'approvisionnement et la production : 65 % du loyer, 60 % de la paie, 80 % de l'usure.
    expect(a.lignes.map((l) => l.montant)).toEqual([1_590 * 22, 1_590 * 16, 12_805, 6_390, 666.4, c(23_468.15 - 12_805 - 6_390 - 666.4)]);
    expect([a.maitrisables, a.nonMaitrisables, a.total]).toEqual([60_420, 23_468.15, 83_888.15]);
    expect(Object.values(triDe(ch, "les-charges-maitrisables"))).toEqual(["maitrisable", "maitrisable", "non-maitrisable", "non-maitrisable", "non-maitrisable", "non-maitrisable"]);
  });
});

describe("le critère du service commercial : le prix qu'il fait choisir", () => {
  it("le trimestre au prix p est celui de la droite de demande, la ligne plafonnée à 7 000", () => {
    for (const p of [40, 48, 49, 55, 59, 60, 66, 70]) expect(trimestreAuPrix(NOVA_GESTION, p)).toMatchObject(trimestre(p));
    expect(trimestre(59).resultat).toBe(6_789);
  });

  it("jugée sur son chiffre d'affaires, la responsable choisit 48 € (336 000 €, −23 549 €) ; sur sa marge, 60 € (7 101 €), le meilleur de NOVA", () => {
    expect(prixQueChoisit(NOVA_GESTION, "chiffre-d-affaires")).toBe(48);
    expect(trimestre(48)).toMatchObject({ ventes: 7_000, chiffreDAffaires: 336_000, resultat: -23_549 });
    expect(trimestre(49).chiffreDAffaires).toBeLessThan(336_000);
    expect(prixQueChoisit(NOVA_GESTION, "profit")).toBe(60);
    expect(meilleurPrixPourNova(NOVA_GESTION)).toBe(60);
    expect(trimestre(60).resultat).toBe(7_101);
    expect(trimestre(61).resultat).toBe(7_007);
    expect(juste(ch, "predire-le-prix")).toEqual(["Un prix plus bas"]);
  });

  it("le prix plancher : 55 € couvre les charges fixes (1 481 €), 54 € non (−861 €)", () => {
    expect(prixPlancher(NOVA_GESTION)).toBe(55);
    expect(trimestre(55).resultat).toBe(1_481);
    expect(trimestre(54).resultat).toBe(-861);
    gardeDuCurseur(ch, "le-prix-plancher", 55);
  });

  it("le laboratoire : seule la position centre de profit, 60 € relève le défi ; le départ (chiffre d'affaires, 59 €) ne le relève pas", () => {
    const e = gardeDuLaboratoire(ch, "le-laboratoire-des-centres");
    const d = e.defi(NOVA);
    const reussies: string[] = [];
    for (const k of CRITERES_DU_LABORATOIRE) for (let p = 40; p <= 70; p++) if (d.atteint({ critere: k.valeur, prix: p })) reussies.push(`${k.critere} ${p}`);
    expect(reussies).toEqual(["profit 60"]);
    expect(laboratoireDesCentres(NOVA_GESTION, { critere: 0, prix: 59 }).prixChoisi).toBe(48);
    expect(organisationDuChapitre(NOVA).depart).toEqual({ critere: 0, prix: 59 });
  });
});

describe("la performance : efficacité, efficience, durabilité", () => {
  it("janvier : 26,5 % de part de marché et 19,61 € de charges fixes par enceinte ; juin : 23,4 % et 14,50 €", () => {
    expect(performanceDuMois(NOVA_GESTION, 0)).toMatchObject({ partDeMarche: 1_590 / 6_000, objectifAtteint: true, chargesFixesParEnceinte: c(31_183 / 1_590), resultat: 2_207 });
    expect(performanceDuMois(NOVA_GESTION, 5)).toMatchObject({ partDeMarche: 2_151 / 9_200, objectifAtteint: false, chargesFixesParEnceinte: c(31_183 / 2_151), resultat: 13_988 });
    expect(attendus(ch, "efficacite-et-efficience")).toEqual([26.5, 23.4, 19.61, 14.5]);
  });

  it("le salaire : 96,15 % du marché en N, 93,75 % en N + 1 ; 1 900 € gardent le seuil, 142 € de plus par mois, 1 704 € par an, face à 3 000 € par recrutement", () => {
    const s = durabiliteDuSalaire();
    expect(s.salaireAuSeuil).toBe(2_000 * 0.95);
    expect(s.enPlusParMois).toBe(c((1_900 - 1_875) * 4 * 1.42));
    expect(s.enPlusParAn).toBe(1_704);
    expect(s.coutDUnRecrutement).toBeGreaterThan(s.enPlusParAn);
    expect(attendus(ch, "la-durabilite")).toEqual([96.15, 93.75, 1_900, 142]);
  });

  it("les bonnes réponses : le marché, le contrôle mensuel, des fonctions, son objectif, l'alerte, le social et l'environnement, voir tôt", () => {
    expect(juste(ch, "les-sources")).toEqual(["Les ventes de tout le marché"]);
    expect(juste(ch, "les-formes-de-controle")).toEqual(["Le résultat comparé au budget, chaque mois"]);
    expect(juste(ch, "la-structure")).toEqual(["Des fonctions, et un coût par produit"]);
    expect(juste(ch, "selon-l-organisation")).toEqual(["Son objectif, pas ses outils"]);
    expect(juste(ch, "le-role-du-controleur")).toEqual(["Il cherche la cause et alerte le dirigeant"]);
    expect(juste(ch, "la-performance-globale")).toEqual(["Pas encore : il manque le social et l'environnement"]);
    expect(juste(ch, "piloter-avec-le-tableau-de-bord")).toEqual(["À voir tôt ce qui dérive, pour agir"]);
  });
});

describe("le cas dédié : un mauvais mois pour l'atelier ?", () => {
  it("est le cas du chapitre, et passe les gardes du cas", () => {
    expect(CAS_PAR_CHAPITRE).toContain(UN_MAUVAIS_MOIS_POUR_L_ATELIER);
    gardeDuCas(UN_MAUVAIS_MOIS_POUR_L_ATELIER, ch);
  });

  it("février : 16,18 € de charges fixes par enceinte au lieu de 14,76 € ; le coût variable reste à 38 € ; toute la hausse, 1,42 €, vient du volume", () => {
    expect(MOIS_DU_CAS).toEqual({ avant: 0, apres: 1 });
    const n = moisDeLAtelier(NOVA);
    expect([n.a.quantite, n.b.quantite]).toEqual([1_590, 1_450]);
    expect(coutDeLAtelierDuMois(NOVA_GESTION, 1).reel).toBe(c((1_450 * 38 + 23_468.15) / 1_450));
    const montants = (id: string) => etape(chapitreDuCas(UN_MAUVAIS_MOIS_POUR_L_ATELIER, NOVA), id, "montants").champs(NOVA, VIDE).map((x) => x.attendu);
    expect(montants("les-charges-fixes")).toEqual([c(23_468.15 / 1_590), c(23_468.15 / 1_450), c(16.18 - 14.76)]);
    expect(montants("ce-que-l-atelier-maitrise")).toEqual([38, 0, c(54.18 - 52.76)]);
    expect(n.hausse).toBe(n.hausseDesFixes);
    const r = etape(UN_MAUVAIS_MOIS_POUR_L_ATELIER, "reponse", "choix").options(NOVA, VIDE);
    expect(r.filter((o) => o.juste).map((o) => o.texte)).toEqual(["Non : la hausse vient du volume"]);
  });
});
