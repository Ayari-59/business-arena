import { describe, expect, it } from "vitest";
import { casDeLEntreprise, type Cas } from "../../src/config/cours/cas";
import { ENTREPRISES_DU_COURS } from "../../src/config/cours/metiers";
import { CHAPITRES, chapitreParCode } from "../../src/config/cours/registre";
import { CAS_DE_SYNTHESE, CAS_PAR_CHAPITRE, SITUATIONS, casDuChapitre } from "../../src/config/cours/situations";
import { COMMERCES } from "../../src/config/cours/chapitres/taux-de-marque";
import { NEGOCIATIONS } from "../../src/config/cours/chapitres/negocier-le-prix";
import { prixRejoues } from "../../src/config/cours/decision";
import { commandePourLaPromotion } from "../../src/config/cours/situations/commander-pour-la-promotion";
import { embaucheDeSaison } from "../../src/config/cours/situations/embaucher-pour-la-saison";
import { COMMANDES_PROMISES, remiseDuGrandCompte } from "../../src/config/cours/situations/la-remise-du-grand-compte";
import { prixDeLaSaison } from "../../src/config/cours/situations/quel-prix-pour-la-saison";
import { factureContestee } from "../../src/config/cours/situations/la-facture-contestee";
import { dossierDeLaBanque } from "../../src/config/cours/situations/le-rendez-vous-a-la-banque";
import { baisseDuConcurrent } from "../../src/config/cours/situations/suivre-la-baisse";
import { auCentime } from "../../src/pedagogy/cours/etats";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import type { Etape } from "../../src/config/cours/types";

/**
 * Ce test parcourt tout le catalogue, dans chaque entreprise : sa durée croît avec chaque
 * chapitre et chaque cas pratique. Les cinq secondes par défaut de vitest ne suffisent plus
 * quand la suite entière tourne en parallèle.
 */
const PARCOURT_TOUT_LE_CATALOGUE = 30_000;

/**
 * LES CAS PRATIQUES SONT DES SITUATIONS, ET LEURS CALCULS TIENNENT.
 *
 * Un cas pratique reprend des calculs déjà vus, sans cours : sa première
 * étape pose la question du commanditaire, aucune autre n'enseigne, et la
 * dernière est la réponse qu'on lui rend. Ses chiffres se calculent dans les neuf
 * entreprises du cours sans « NaN » ni « undefined », et la bonne réponse ne se
 * devine pas à sa longueur, le défaut relevé dans les épisodes.
 */
const etat = { soldes: {} };

function textesDe(e: Etape, cas: Cas): string[] {
  switch (e.type) {
    case "lecture":
      return [...e.texte(cas), e.repere?.(cas) ?? ""];
    case "choix":
      return [e.question(cas, etat), ...e.options(cas, etat).flatMap((o) => [o.texte, o.retour])];
    case "montants":
      return [
        e.question(cas, etat),
        ...e.champs(cas, etat).flatMap((c) => [c.libelle, c.calcul, String(c.attendu)]),
        ...e.explication(cas, etat),
      ];
    default:
      return [];
  }
}

describe("les cas pratiques", () => {
  it("chaque chapitre a son cas dédié, et un seul, à son palier et dans son parcours", () => {
    // Décision du propriétaire (octobre 2026) : au moins un cas pratique par chapitre.
    for (const c of CHAPITRES) {
      const dedies = CAS_PAR_CHAPITRE.filter((s) => s.reprend[0] === c.code);
      expect(dedies.length, c.code).toBe(1);
      expect(casDuChapitre(c.code), c.code).toBe(dedies[0]);
      expect(dedies[0]!.palier, c.code).toBe(c.palier);
      expect(dedies[0]!.parcours, c.code).toBe(c.parcours);
      expect(dedies[0]!.entreprises?.codes, c.code).toEqual(c.entreprises?.codes);
    }
    expect(CAS_PAR_CHAPITRE.length).toBe(CHAPITRES.length);
    for (const s of CAS_PAR_CHAPITRE) expect(s.reprend.length, s.code).toBe(1);
    // Un cas de synthèse en enchaîne plusieurs : sinon c'est un cas dédié.
    for (const s of CAS_DE_SYNTHESE) expect(s.reprend.length, s.code).toBeGreaterThan(1);
    expect(new Set(SITUATIONS.map((s) => s.code)).size).toBe(SITUATIONS.length);
  });

  it("chacune reprend des chapitres qui existent, et s'ouvre par son code comme un chapitre", () => {
    expect(SITUATIONS.length).toBeGreaterThan(0);
    for (const s of SITUATIONS) {
      expect(s.reprend.length, s.code).toBeGreaterThan(0);
      for (const c of s.reprend) expect(CHAPITRES.some((x) => x.code === c), `${s.code} reprend « ${c} »`).toBe(true);
      expect(CHAPITRES.some((x) => x.code === s.code), `${s.code} porte le code d'un chapitre`).toBe(false);
      expect(chapitreParCode(s.code)).toBe(s);
      expect(s.commanditaire.length, s.code).toBeGreaterThan(3);
      // Une situation remobilise ce qui est déjà appris : jamais un chapitre d'un palier
      // plus avancé que le sien.
      for (const c of s.reprend) {
        const repris = CHAPITRES.find((x) => x.code === c)!;
        expect(repris.palier, `${s.code} (palier ${s.palier}) reprend ${c}, de palier ${repris.palier}`).toBeLessThanOrEqual(s.palier);
      }
    }
  });

  it("sans cours : la question d'abord, aucune autre étape de lecture, et la réponse pour finir", () => {
    for (const s of SITUATIONS) {
      expect(s.etapes[0]!.type, s.code).toBe("lecture");
      expect(s.etapes.slice(1).filter((e) => e.type === "lecture").length, `${s.code} : une étape enseigne`).toBe(0);
      expect(s.etapes.at(-1)!.type, `${s.code} : pas de réponse à rendre`).toBe("choix");
      const codes = new Set(CONCEPTS.map((c) => c.code));
      for (const e of s.etapes) for (const n of e.notions ?? []) expect(codes, `${s.code} : notion « ${n} »`).toContain(n);
    }
  });

  it("dans chaque entreprise, des chiffres finis, une seule bonne réponse, et une réponse qui ne se devine pas à sa longueur", () => {
    for (const s of SITUATIONS) {
      // Comme son chapitre, un cas réservé à certaines entreprises ne se joue que chez elles.
      for (const code of ENTREPRISES_DU_COURS.filter((x) => !s.entreprises || s.entreprises.codes.includes(x))) {
        const cas = casDeLEntreprise(code);
        for (const e of s.etapes) {
          if (e.si && !e.si(cas)) continue;
          for (const t of textesDe(e, cas)) {
            expect(t, `${s.code} / ${code} / ${e.id}`).not.toMatch(/NaN|undefined|Infinity/);
          }
          if (e.type === "montants") {
            for (const c of e.champs(cas, etat)) expect(Number.isFinite(c.attendu), `${s.code} / ${code} / ${c.libelle}`).toBe(true);
          }
          if (e.type === "choix") {
            const options = e.options(cas, etat);
            expect(options.filter((o) => o.juste).length, `${s.code} / ${code} / ${e.id}`).toBe(1);
            const juste = options.find((o) => o.juste)!;
            const plusLongue = Math.max(...options.filter((o) => !o.juste).map((o) => o.texte.length));
            expect(juste.texte.length, `${s.code} / ${code} : la bonne réponse est la plus longue`).toBeLessThanOrEqual(plusLongue);
          }
        }
      }
    }
  }, PARCOURT_TOUT_LE_CATALOGUE);
});

describe("suivre la baisse du concurrent", () => {
  it("garder la même marge demande plus de ventes que la baisse du prix, et le seuil monte", () => {
    for (const code of ENTREPRISES_DU_COURS) {
      const m = baisseDuConcurrent(casDeLEntreprise(code));
      if (m.quantiteNecessaire === null) continue;
      // La marge perd plus, en proportion, que le prix : c'est la leçon de la situation.
      expect(m.baisseDeLaMarge, code).toBeGreaterThan(10);
      expect(m.hausse!, code).toBeGreaterThan(10);
      // La quantité trouvée garde la marge, et une de moins ne la garde pas.
      expect(m.quantiteNecessaire * m.margeBaissee, code).toBeGreaterThanOrEqual(m.margeDuMois - 0.01);
      expect((m.quantiteNecessaire - 1) * m.margeBaissee, code).toBeLessThan(m.margeDuMois);
      expect(m.seuilApres!, code).toBeGreaterThan(Math.floor(m.chargesFixes / m.marge));
    }
  });
});

describe("la facture contestée", () => {
  it("l'avoir s'équilibre, et la facture envoyée moins l'avoir redonne la facture juste", () => {
    for (const code of ENTREPRISES_DU_COURS) {
      const { juste, envoyee, avoir } = factureContestee(casDeLEntreprise(code));
      // L'écriture de l'avoir : 709 et 44571 au débit, 665 et 411 au crédit.
      expect(auCentime(avoir.ventes + avoir.tva), code).toBe(auCentime(avoir.escompte + avoir.ttc));
      expect(auCentime(envoyee.ttc - avoir.ttc), code).toBe(juste.ttc);
      // La vente en moins est la remise oubliée, et l'avoir n'est pas de ce montant :
      // l'erreur classique que la réponse propose reste une erreur.
      expect(avoir.ventes, code).toBe(auCentime(juste.brut - juste.netCommercial));
      expect(avoir.ttc, code).not.toBe(avoir.ventes);
      expect(avoir.ttc, code).toBeGreaterThan(0);
    }
  });
});

describe("le rendez-vous à la banque", () => {
  it("les chiffres du dossier se recoupent, et les trois réponses se rencontrent dans le cours", () => {
    const choix = new Set<string>();
    for (const code of ENTREPRISES_DU_COURS) {
      const { v, r, k, f } = dossierDeLaBanque(casDeLEntreprise(code));
      // Un seul résultat net, un seul bilan : les chapitres repris parlent des mêmes chiffres.
      expect(r.resultatNet, code).toBe(f.resultatNet);
      expect(r.capitauxPropres, code).toBe(f.capitauxPropres);
      expect(k.f.capitauxPropres, code).toBe(f.capitauxPropres);
      expect(k.f.emprunts, code).toBe(f.emprunts);
      // L'explication dit que fonds de roulement moins besoin donne la trésorerie.
      expect(Math.abs(k.frng - k.bfr - k.tn), code).toBeLessThanOrEqual(0.02);
      // L'explication dit que l'activité crée de la richesse.
      expect(v.va, code).toBeGreaterThan(0);
      choix.add(f.choix);
    }
    // Dans l'année du bon gestionnaire, la capacité d'autofinancement couvre l'équipement partout
    // sauf à l'hôtel, dont l'emprunt dépasserait les capitaux propres : la réponse « emprunt » ne se
    // rencontre plus (financer-l-entreprise.ts). Si elle revient, cette garde le dira.
    expect([...choix].sort()).toEqual(["apport", "autofinancement"]);
  });
});

describe("commander pour la promotion", () => {
  it("le volume garde la marge, la commande sert la demande, et la remise retire plus que son taux", () => {
    for (const code of COMMERCES) {
      const r = commandePourLaPromotion(casDeLEntreprise(code));
      expect(r.baisseDeLaMarge, code).toBeGreaterThan(r.remise);
      expect(r.volumeNecessaire * r.mcvPromo, code).toBeGreaterThanOrEqual(r.margeNormale - 0.5);
      expect((r.volumeNecessaire - 1) * r.mcvPromo, code).toBeLessThan(r.margeNormale);
      // La réponse « elle paiera » et la comparaison au volume nécessaire disent la même chose.
      expect(r.paie, code).toBe(r.demande >= r.volumeNecessaire);
      if (r.stock) {
        expect(r.stock.enReserve + r.stock.aCommander, code).toBeGreaterThanOrEqual(r.demande);
        // L'explication dit que le stock tient moins longtemps en promotion.
        if (r.stock.aCommander > 0) expect(r.stock.couverture, code).toBeLessThan(r.stock.couvertureAvant);
      }
    }
    // Le bistrot ne garde pas de stock : l'étape de la commande ne s'y joue pas.
    expect(commandePourLaPromotion(casDeLEntreprise("bistrot")).stock).toBeNull();
  });
});

describe("quel prix pour la saison", () => {
  it("la marge, pas la demande ni le chiffre d'affaires, désigne le prix, et chacun des trois gagne quelque part", () => {
    const gagnants = new Set<string>();
    let caEtMargeDivergent = false;
    for (const code of ENTREPRISES_DU_COURS) {
      const r = prixDeLaSaison(casDeLEntreprise(code));
      // La capacité est la même aux trois prix rejoués : une seule ligne au tableau.
      expect(new Set(prixRejoues(code).map((v) => v.capacite)).size, code).toBe(1);
      for (const p of r.prix) {
        expect(p.ventes, code).toBeLessThanOrEqual(r.capacite);
        expect(r.meilleur.marge, code).toBeGreaterThanOrEqual(p.marge);
      }
      // L'erreur « la demande ne dépend pas du prix » reste fausse partout.
      expect(r.d.elasticite, code).toBeLessThan(0);
      gagnants.add(r.meilleur.nom);
      if (r.plusGrosCa.prix !== r.meilleur.prix) caEtMargeDivergent = true;
    }
    expect([...gagnants].sort()).toEqual(["le prix actuel", "le prix bas", "le prix haut"]);
    expect(caEtMargeDivergent).toBe(true);
  });
});

describe("la remise du grand compte", () => {
  it("la remise se prend sur la marge, le délai sur le résultat, et le client vaut huit affaires", () => {
    for (const code of NEGOCIATIONS) {
      const { a, n, valeurDuClient, remiseSurLaDuree, verdict } = remiseDuGrandCompte(casDeLEntreprise(code));
      // Le délai que le client exige ne dépasse jamais le délai maximal convenu entre professionnels.
      expect(a.delai, code).toBe(Math.min(casDeLEntreprise(code).venteCredit.delai, 60));
      expect(auCentime(a.margeSansRemise - a.marge), code).toBe(a.remise);
      expect(auCentime(a.marge - a.coutDuCredit), code).toBe(a.resultatDeLAffaire);
      expect(valeurDuClient, code).toBe(auCentime(a.resultatDeLAffaire * COMMANDES_PROMISES));
      expect(remiseSurLaDuree, code).toBe(auCentime(a.remise * COMMANDES_PROMISES));
      expect(verdict === "couvre", code).toBe(a.prixRemise >= n.coutComplet);
      expect(n.coutVariable, code).toBeLessThan(n.coutComplet);
    }
  });
});

describe("embaucher pour la saison", () => {
  it("les ventes trouvées paient le contrat, et les trois erreurs classiques donnent d'autres nombres", () => {
    for (const code of ENTREPRISES_DU_COURS) {
      const r = embaucheDeSaison(casDeLEntreprise(code));
      expect(r.margeDUneUnite, code).toBeGreaterThan(0);
      expect(r.ventesNecessaires * r.margeDUneUnite, code).toBeGreaterThanOrEqual(r.coutDeLaSaison);
      expect((r.ventesNecessaires - 1) * r.margeDUneUnite, code).toBeLessThan(r.coutDeLaSaison);
      expect(r.avecLeBrut, code).toBeLessThan(r.ventesNecessaires);
      expect(r.avecLePrix, code).toBeLessThan(r.ventesNecessaires);
      expect(r.surLAnnee, code).toBeGreaterThan(r.ventesNecessaires);
      expect(new Set([r.ventesNecessaires, r.avecLeBrut, r.avecLePrix, r.surLAnnee]).size, code).toBe(4);
      // La paie du cas et le coût que l'arène donne au personnel disent le même coût, à 1 % près.
      expect(Math.abs(r.coutDeLaSaison - r.m.coutTrimestriel) / r.m.coutTrimestriel, code).toBeLessThan(0.01);
      expect(r.tauxAvec, code).toBeGreaterThan(r.m.tauxDeFraisDePersonnel);
    }
  });
});

describe("l'accès aux cas pratiques", () => {
  it("le cas dédié du chapitre libre est libre, et lui seul (décision d'octobre 2026 : « cas pratique inclus »)", () => {
    const pilote = CHAPITRES.find((c) => c.libre)!;
    expect(SITUATIONS.filter((s) => s.libre).map((s) => s.code)).toEqual([casDuChapitre(pilote.code)!.code]);
  });
});
