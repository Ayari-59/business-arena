import { describe, expect, it } from "vitest";
import type { RoundDecisions } from "@/engine/types";
import {
  COURRIERS_EN_RETOUR,
  MAX_REPONSES,
  reponsesAuxDecisions,
} from "@/config/courriers/reponses";

/**
 * UNE DÉCISION EST ADRESSÉE À QUELQU'UN.
 *
 * Le courrier ne descendait que dans un sens : le monde écrivait, l'entreprise
 * répondait par des chiffres, et personne ne lui répondait jamais. On
 * licenciait sans qu'aucun avocat n'écrive. Ces règles ferment la boucle.
 *
 * Elles sont pures — deux jeux de décisions entrent, des lettres sortent —,
 * donc éprouvables une par une, ce qui est tout l'intérêt de les avoir sorties
 * de l'écran.
 */

/** Un tour de décisions au repos : rien qui mérite une réponse. */
function tour(patch: Partial<RoundDecisions> = {}): RoundDecisions {
  return {
    price: 100,
    productionPlan: 1000,
    marketingBudget: 5000,
    qualityBudget: 3000,
    maintenanceBudget: 2000,
    ...patch,
  };
}

const codes = (...args: Parameters<typeof reponsesAuxDecisions>) =>
  reponsesAuxDecisions(...args).map((c) => c.code);

describe("ce qui appelle une réponse", () => {
  it("un tour sans rien de notable n'en appelle aucune", () => {
    expect(codes(tour(), tour())).toEqual([]);
  });

  it("licencier fait écrire un avocat", () => {
    expect(codes(tour({ hr: { fire: 2 } }), tour())).toContain("retour_licenciement");
  });

  it("embaucher fait répondre l'encadrement", () => {
    expect(codes(tour({ hr: { hire: 3 } }), tour())).toContain("retour_embauche");
  });

  it("emprunter fait répondre la banque, et elle parle de l'échéancier", () => {
    const lettres = reponsesAuxDecisions(tour({ finance: { newLoan: 50000 } }), tour());
    const banque = lettres.find((c) => c.code === "retour_emprunt")!;
    expect(banque.corps).toContain("échéances");
  });

  it("distribuer fait répondre les associés", () => {
    expect(codes(tour({ finance: { dividend: 10000 } }), tour())).toContain("retour_dividende");
  });

  it("s'engager en RSE fait répondre un client", () => {
    expect(codes(tour({ rse: { budget: 8000 } }), tour())).toContain("retour_rse");
  });
});

describe("les coupes se lisent par rapport au tour d'avant", () => {
  it("couper l'entretien fait écrire la maintenance", () => {
    expect(codes(tour({ maintenanceBudget: 0 }), tour({ maintenanceBudget: 2000 }))).toContain(
      "retour_maintenance_coupee",
    );
  });

  it("un budget à zéro depuis toujours ne dit rien", () => {
    /*
     * C'est la faute à empêcher : aux premiers niveaux, l'entretien et la
     * qualité ne sont même pas exposés, donc restent à zéro. Les traiter comme
     * une coupe aurait fait gronder l'atelier à chaque tour d'une partie de
     * niveau Découverte, pour une décision que l'élève n'a pas pu prendre.
     */
    const zero = tour({ maintenanceBudget: 0, qualityBudget: 0 });
    expect(codes(zero, zero)).toEqual([]);
  });

  it("couper la qualité fait remonter les réclamations", () => {
    expect(codes(tour({ qualityBudget: 0 }), tour({ qualityBudget: 3000 }))).toContain(
      "retour_qualite_coupee",
    );
  });

  it("sans tour précédent, aucune coupe n'est détectable", () => {
    // Au premier tour il n'y a rien à comparer : on ne reproche pas à une
    // équipe un budget qu'elle n'a jamais eu l'occasion de doter.
    expect(codes(tour({ maintenanceBudget: 0, qualityBudget: 0 }), null)).toEqual([]);
  });
});

describe("le prix, et la gamme", () => {
  it("une hausse marquée fait écrire les clients, une baisse fait écrire le commercial", () => {
    expect(codes(tour({ price: 115 }), tour({ price: 100 }))).toContain("retour_hausse_prix");
    expect(codes(tour({ price: 85 }), tour({ price: 100 }))).toContain("retour_baisse_prix");
  });

  it("un ajustement modéré ne fait écrire personne", () => {
    // Le seuil existe pour ça : un prix qui bouge de trois pour cent est un
    // réglage, pas un évènement commercial.
    expect(codes(tour({ price: 103 }), tour({ price: 100 }))).toEqual([]);
    expect(codes(tour({ price: 97 }), tour({ price: 100 }))).toEqual([]);
  });

  it("en gamme, c'est la moyenne des références qui parle", () => {
    /*
     * En gamme le prix scalaire n'est plus saisi : comparer deux scalaires
     * jamais renseignés aurait fait taire le client à chaque changement de
     * tarif d'un catalogue entier.
     */
    const gamme = (p: number) =>
      tour({ products: { a: { price: p, productionPlan: 10 }, b: { price: p + 20, productionPlan: 10 } } });
    expect(codes(gamme(130), gamme(100))).toContain("retour_hausse_prix");
    expect(codes(gamme(102), gamme(100))).toEqual([]);
  });
});

describe("on n'en envoie pas plus de trois", () => {
  it("un tour chargé garde les trois premières, du plus engageant au plus anodin", () => {
    // Quatre lettres, et l'élève n'en lit aucune.
    const chargé = tour({
      price: 130,
      maintenanceBudget: 0,
      hr: { fire: 1, hire: 2 },
      finance: { newLoan: 10000, dividend: 5000 },
      rse: { budget: 4000 },
    });
    const sortie = codes(chargé, tour());
    expect(sortie.length).toBe(MAX_REPONSES);
    expect(sortie[0]).toBe("retour_licenciement");
    expect(sortie).not.toContain("retour_rse");
  });
});

describe("une réponse n'est pas un événement", () => {
  it("aucune ne touche aux comptes", () => {
    // La conséquence chiffrée appartient au moteur, qui l'a déjà calculée. Ces
    // lettres la nomment et disent qui la subit ; les faire peser aussi aurait
    // demandé de recalibrer les neuf secteurs.
    for (const c of COURRIERS_EN_RETOUR) {
      expect(c.effet, `${c.code} promet un effet`).toBe("Aucun effet sur les comptes");
      expect(c.scope).toBe("team");
    }
  });

  it("aucune ne nomme un métier : elles servent les neuf secteurs", () => {
    // « Vos clients », « vos équipes », « votre matériel » : un texte qui
    // parlerait de chambres ou de couverts mentirait huit fois sur neuf.
    const METIERS = ["chambre", "couvert", "chantier", "camion", "adhérent", "pull", "enceinte"];
    for (const c of COURRIERS_EN_RETOUR) {
      const texte = `${c.objet} ${c.corps}`.toLowerCase();
      for (const mot of METIERS) {
        expect(texte, `${c.code} parle de « ${mot} »`).not.toContain(mot);
      }
    }
  });
});
