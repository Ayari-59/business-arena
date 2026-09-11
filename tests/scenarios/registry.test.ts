import { describe, expect, it } from "vitest";
import { SCENARIOS, scenarioByCode, ALL_SITUATIONS, familyOf } from "../../src/config/scenarios/registry";
import { offerProductIndex, toGamme } from "../../src/engine/gamme";
import { balanceGap } from "../../src/engine/finance/statements";
import { CONCEPTS } from "../../src/config/pedagogy/concepts";
import { DECISION_MODELS } from "../../src/config/pedagogy/models";

/**
 * Garde-fous du registre : ce qu'un scénario doit respecter pour être
 * jouable, quel que soit son secteur. Ajouter une entrée au registre sans
 * respecter ces règles fait tomber ce fichier — c'est le but.
 */
describe("registre des scénarios", () => {
  it("les codes de scénario sont uniques", () => {
    const codes = SCENARIOS.map((d) => d.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("un code inconnu retombe sur NOVA plutôt que de casser une partie", () => {
    expect(scenarioByCode("secteur-inexistant").code).toBe("nova");
    expect(scenarioByCode(undefined).code).toBe("nova");
    expect(scenarioByCode(null).code).toBe("nova");
  });

  it("le texte d'accueil parle à un élève qui ne connaît pas encore les mots", () => {
    // Ce texte est la PREMIÈRE chose que lit l'élève, avant toute situation.
    // Il doit poser le métier en phrases complètes, pas énumérer les notions
    // du programme : à ce moment-là, ces mots-là ne veulent encore rien dire.
    const PAS_ENCORE_APPRIS = [
      "BFR",
      "FRNG",
      "seuil de rentabilité",
      "coefficient multiplicateur",
      "yield management",
      "taux d'occupation",
      "ratio matières",
      "attrition",
      "coût d'acquisition",
      "valeur vie client",
      "panier moyen",
    ];
    for (const d of SCENARIOS) {
      expect(d.briefing.length, d.code).toBeGreaterThan(120);
      expect(d.briefing.trim().endsWith("."), d.code).toBe(true);
      // au moins deux phrases : une seule ne pose pas un métier
      expect(d.briefing.split(". ").length, d.code).toBeGreaterThanOrEqual(2);
      for (const mot of PAS_ENCORE_APPRIS) {
        expect(d.briefing.toLowerCase(), `${d.code} / ${mot}`).not.toContain(mot.toLowerCase());
      }
    }
  });

  it("le contexte et l'arbitrage du tour 1 ne citent jamais un chiffre", () => {
    // Les montants, les tailles de marché et le nombre de concurrents sont des
    // paramètres de la PARTIE : la périodicité les redimensionne et
    // l'enseignant peut les changer à la création. Un chiffre écrit dans la
    // prose deviendrait faux sans prévenir. Il n'y en a qu'un seul endroit
    // juste : le panneau, qui les lit dans le snapshot joué.
    for (const d of SCENARIOS) {
      const proses = [
        d.context,
        d.dilemma.question,
        ...d.dilemma.routes.flatMap((r) => [r.label, r.gain, r.risque]),
      ];
      for (const prose of proses) {
        expect(prose, `${d.code} : « ${prose.slice(0, 50)}… »`).not.toMatch(/\d/);
      }
    }
  });

  it("chaque arbitrage du tour 1 oppose deux routes, chacune avec son prix à payer", () => {
    for (const d of SCENARIOS) {
      expect(d.context.length, d.code).toBeGreaterThan(120);
      expect(d.dilemma.question.trim().endsWith("?"), d.code).toBe(true);
      // Deux routes : une « décision » à une seule issue n'en est pas une.
      expect(d.dilemma.routes.length, d.code).toBe(2);
      for (const route of d.dilemma.routes) {
        expect(route.label.length, d.code).toBeGreaterThan(5);
        // Un choix sans contrepartie chiffrable n'apprend rien : les deux
        // faces sont obligatoires.
        expect(route.gain.length, `${d.code} / ${route.label}`).toBeGreaterThan(60);
        expect(route.risque.length, `${d.code} / ${route.label}`).toBeGreaterThan(60);
      }
      // Les deux routes doivent être distinctes, pas une reformulation.
      const [a, b] = d.dilemma.routes;
      expect(a!.label, d.code).not.toBe(b!.label);
    }
  });

  it("chaque scénario s'annonce : titre, signature, vocabulaire", () => {
    for (const d of SCENARIOS) {
      expect(d.title.length, d.code).toBeGreaterThan(5);
      expect(d.tagline.length, d.code).toBeGreaterThan(10);
      expect(d.playerTeamName.length, d.code).toBeGreaterThan(1);
      // on ne vend pas des « unités » dans un hôtel
      expect(d.vocabulary.unit.length, d.code).toBeGreaterThan(2);
      expect(d.vocabulary.units.length, d.code).toBeGreaterThan(2);
      expect(d.vocabulary.priceLabel.length, d.code).toBeGreaterThan(3);
    }
  });

  it("les codes de situation sont uniques TOUS scénarios confondus", () => {
    // Les situations sont semées dans une table à clé unique : une collision
    // entre deux secteurs ferait jouer la situation d'un autre métier.
    const codes = ALL_SITUATIONS.map((s) => s.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("chaque scénario a ses propres situations, jamais celles d'un autre", () => {
    for (const d of SCENARIOS) {
      const own = new Set(d.situations.map((s) => s.code));
      for (const other of SCENARIOS) {
        if (other.code === d.code) continue;
        for (const s of other.situations) {
          expect(own.has(s.code), `${s.code} partagée entre ${d.code} et ${other.code}`).toBe(
            false,
          );
        }
      }
    }
  });

  it("le bilan d'ouverture de chaque entreprise est équilibré", () => {
    for (const d of SCENARIOS) {
      const opening = [
        d.company("player", d.playerTeamName, "human"),
        ...d.bots.map((b) => d.company(b.id, b.name, "bot", b.profile)),
      ];
      for (const c of opening) {
        expect(
          Math.abs(balanceGap(c.finance)),
          `bilan d'ouverture déséquilibré pour ${d.code}/${c.id}`,
        ).toBeLessThan(0.01);
      }
    }
  });

  it("la valeur du stock d'ouverture correspond aux quantités en réserve", () => {
    for (const d of SCENARIOS) {
      const c = d.company("player", d.playerTeamName, "human");
      const stockValue = c.finishedGoods.quantity * c.finishedGoods.unitCost;
      expect(c.finance.inventoryValue, `stock incohérent pour ${d.code}`).toBeCloseTo(
        stockValue,
        6,
      );
    }
  });

  it("une activité périssable n'ouvre jamais avec du stock", () => {
    for (const d of SCENARIOS) {
      if (!d.scenario.perishable) continue;
      const c = d.company("player", d.playerTeamName, "human");
      expect(c.finishedGoods.quantity, `${d.code} ouvre avec du stock périssable`).toBe(0);
      expect(c.finance.inventoryValue, d.code).toBe(0);
    }
  });

  it("chaque scénario propose assez de concurrents pour une classe", () => {
    for (const d of SCENARIOS) {
      expect(d.bots.length, d.code).toBeGreaterThanOrEqual(7);
      const ids = d.bots.map((b) => b.id);
      expect(new Set(ids).size, `identifiants de bots dupliqués dans ${d.code}`).toBe(ids.length);
      const names = d.bots.map((b) => b.name);
      expect(new Set(names).size, `noms de bots dupliqués dans ${d.code}`).toBe(names.length);
    }
  });

  it("l'échéancier d'emprunt d'ouverture est cohérent avec la dette", () => {
    for (const d of SCENARIOS) {
      const c = d.company("player", d.playerTeamName, "human");
      const scheduled = (c.loans ?? []).reduce((sum, l) => sum + l.remaining, 0);
      expect(scheduled, `${d.code} : échéancier ≠ dette financière`).toBeCloseTo(
        c.finance.financialDebt,
        6,
      );
    }
  });

  it("les offres de commande d'un scénario ont des codes uniques", () => {
    for (const d of SCENARIOS) {
      const codes = (d.scenario.orderOffers ?? []).map((o) => o.code);
      expect(new Set(codes).size, d.code).toBe(codes.length);
    }
  });

  it("le récit d'une offre de commande ne cite jamais un chiffre", () => {
    // Même règle que le contexte du tour 1, et pour la même raison :
    // `applyPeriodicity` multiplie `units` par la durée du tour. Un volume
    // écrit dans la prose reste figé pendant que le chiffre affiché juste en
    // dessous, lui, est redimensionné. Dans une partie au mois, le récit
    // annonçait « 260 couverts » quand le panneau en proposait 87. Le prix et
    // le délai de règlement sont sur cette même ligne : les répéter, c'est
    // deux endroits à tenir d'accord au lieu d'un.
    for (const d of SCENARIOS) {
      for (const o of d.scenario.orderOffers ?? []) {
        expect(o.narrative, `${d.code}/${o.code}`).not.toMatch(/\d/);
        expect(o.title, `${d.code}/${o.code}`).not.toMatch(/\d/);
        expect(o.narrative.length, `${d.code}/${o.code} : récit trop court`).toBeGreaterThan(80);
      }
    }
  });

  it("aucune offre ne dépasse ce que l'entreprise peut produire en un tour", () => {
    // Une commande plus grosse que la capacité d'un tour entier ne pourrait
    // jamais être honorée, même en cessant de servir le marché : ce serait un
    // piège, pas un arbitrage. C'est la question posée sur le mariage du
    // bistrot, qui privatisait la salle pour plusieurs services d'affilée.
    for (const d of SCENARIOS) {
      const c = d.company("player", d.playerTeamName, "human");
      const gamme = toGamme(d.scenario);
      for (const o of d.scenario.orderOffers ?? []) {
        // En gamme, la commande se produit avec les heures de SA référence.
        const p = gamme[offerProductIndex(gamme, o)]!;
        const capacite = Math.min(c.machineCapacity, (c.headcount * c.hoursPerEmployee) / p.hoursPerUnit);
        expect(
          o.units,
          `${d.code}/${o.code} : ${o.units} pour ${Math.round(capacite)} de capacité`,
        ).toBeLessThanOrEqual(capacite);
      }
    }
  });

  it("chaque tour joué porte une situation scriptée, dans tous les secteurs", () => {
    // L'écart trouvé au bilan : NOVA portait six situations pour six tours, les
    // six autres secteurs quatre. Il restait donc deux tours sans rien, sauf à
    // ce qu'une situation DÉTECTÉE se déclenche, ce qui suppose que la partie
    // tourne mal. Un élève en hôtellerie recevait moins qu'un élève à
    // l'atelier, sans que rien ne le laisse deviner.
    for (const d of SCENARIOS) {
      const tours = d.situations
        .map((s) => ("round" in s.trigger ? s.trigger.round : null))
        .filter((r): r is number => r !== null)
        .sort((a, b) => a - b);
      const attendus = Array.from({ length: d.scenario.roundsCount }, (_, i) => i + 1);
      expect(tours, `${d.code} : un tour joué sans situation scriptée`).toEqual(attendus);
    }
  });

  it("chaque secteur pose la question du placement quand la trésorerie dort", () => {
    // Le déclencheur `idle_cash` est commun aux sept scénarios : sans situation
    // en face, il se déclencherait dans le vide et le placement resterait un
    // bouton que personne ne presse. Un nouveau secteur ne doit pas l'oublier.
    for (const d of SCENARIOS) {
      const idle = d.situations.filter(
        (s) => "detect" in s.trigger && s.trigger.detect === "idle_cash",
      );
      expect(idle.length, `${d.code} n'a pas de situation « argent qui dort »`).toBe(1);
      // et elle doit parler du métier, pas répéter le même texte partout
      expect(idle[0]!.narrative.length, d.code).toBeGreaterThan(180);
    }

    // Les narrations sont bien distinctes d'un secteur à l'autre.
    const narrations = SCENARIOS.map(
      (d) =>
        d.situations.find((s) => "detect" in s.trigger && s.trigger.detect === "idle_cash")!
          .narrative,
    );
    expect(new Set(narrations).size).toBe(SCENARIOS.length);
  });

  it("chaque secteur mobilise au moins cinq modèles d'analyse différents", () => {
    // Un secteur qui ne ferait travailler que le seuil de rentabilité
    // n'enseignerait qu'un outil, quel que soit le nombre de ses situations.
    for (const d of SCENARIOS) {
      const optimaux = new Set(
        d.situations.flatMap((s) =>
          Object.entries(s.modelRelevance)
            .filter(([, r]) => r === "optimal")
            .map(([code]) => code),
        ),
      );
      expect(optimaux.size, `${d.code} ne mobilise que ${[...optimaux].join(", ")}`)
        .toBeGreaterThanOrEqual(5);
    }
  });

  it("chaque scénario ouvre une situation dès le tour 1", () => {
    for (const d of SCENARIOS) {
      const first = d.situations.filter((s) => "round" in s.trigger && s.trigger.round === 1);
      expect(first.length, `${d.code} : aucune situation au tour 1`).toBeGreaterThanOrEqual(1);
    }
  });

  it("les situations scriptées tombent dans les tours joués", () => {
    for (const d of SCENARIOS) {
      for (const s of d.situations) {
        if (!("round" in s.trigger)) continue;
        expect(s.trigger.round, `${s.code} hors des tours joués`).toBeLessThanOrEqual(
          d.scenario.roundsCount,
        );
        expect(s.trigger.round, s.code).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it("chaque situation est complète : diagnostic, QCM, indices, concepts", () => {
    for (const d of SCENARIOS) {
      for (const s of d.situations) {
        // un diagnostic a des bonnes ET des mauvaises réponses, sinon il ne discrimine rien
        expect(s.diagnosticOptions.length, s.code).toBeGreaterThanOrEqual(3);
        expect(s.diagnosticOptions.some((o) => o.correct), `${s.code} : aucune bonne réponse`).toBe(
          true,
        );
        expect(
          s.diagnosticOptions.some((o) => !o.correct),
          `${s.code} : aucun distracteur`,
        ).toBe(true);
        // 5 niveaux d'indices, du plus vague au plus explicite
        expect(s.hints.length, `${s.code} : indices incomplets`).toBe(5);
        expect(s.hints.map((h) => h.level)).toEqual([1, 2, 3, 4, 5]);
        // le QCM porte les questions de connaissances + la question du modèle
        expect(s.quiz.length, `${s.code} : QCM trop court`).toBeGreaterThanOrEqual(3);
        expect(s.quiz.some((q) => q.id === "model_choice"), `${s.code}`).toBe(true);
        expect(s.conceptCodes.length, `${s.code} : aucun concept rattaché`).toBeGreaterThanOrEqual(
          2,
        );
        expect(s.narrative.length, `${s.code} : récit trop court`).toBeGreaterThan(60);
      }
    }
  });

  it("chaque question de QCM a une bonne réponse existante et une correction", () => {
    for (const d of SCENARIOS) {
      for (const s of d.situations) {
        for (const q of s.quiz) {
          const ids = q.options.map((o) => o.id);
          expect(new Set(ids).size, `${s.code}/${q.id} : options dupliquées`).toBe(ids.length);
          expect(ids, `${s.code}/${q.id} : bonne réponse introuvable`).toContain(
            q.correctOptionId,
          );
          expect(q.options.length, `${s.code}/${q.id}`).toBeGreaterThanOrEqual(2);
          expect(q.explain.length, `${s.code}/${q.id} : correction manquante`).toBeGreaterThan(30);
        }
      }
    }
  });

  it("les concepts et modèles cités existent au référentiel", () => {
    const conceptCodes = new Set(CONCEPTS.map((c) => c.code));
    const modelCodes = new Set(DECISION_MODELS.map((m) => m.code));
    for (const d of SCENARIOS) {
      for (const s of d.situations) {
        for (const code of s.conceptCodes) {
          expect(conceptCodes.has(code), `${s.code} : concept inconnu « ${code} »`).toBe(true);
        }
        for (const code of Object.keys(s.modelRelevance)) {
          expect(modelCodes.has(code), `${s.code} : modèle inconnu « ${code} »`).toBe(true);
        }
      }
    }
  });

  it("une situation reste jouable : elle ne devient pas un devoir", () => {
    // LE JEU PRIME. Une situation s'intercale dans un tour de vingt minutes,
    // entre des décisions à prendre : ce n'est pas un exercice à faire, c'est
    // une question qui traverse une partie.
    //
    // Cette règle a été écrite après avoir mesuré ma propre dérive. Parti
    // adapter un secteur aux attendus d'un référentiel, j'avais ajouté une
    // question à trois situations : elles étaient devenues les trois plus
    // lourdes du produit, les seules à quatre questions, la moitié plus
    // longues que la médiane. Rien ne l'avait signalé, chacune étant
    // défendable prise à part.
    //
    // Le référentiel sert à VÉRIFIER ce que le jeu enseigne, pas à dresser une
    // liste à cocher. Une notion de plus qui alourdit la partie coûte plus
    // qu'elle ne rapporte.
    const PLAFOND_MOTS = 340;
    const mots = (t: string) => t.trim().split(/\s+/).length;
    const lourdes: string[] = [];
    for (const d of SCENARIOS) {
      for (const s of d.situations) {
        // Trois questions : deux de connaissances et celle du modèle, qui est
        // générée. C'est le format de tout le produit depuis l'origine.
        expect(
          s.quiz.length,
          `${d.code}/${s.code} : ${s.quiz.length} questions, le format en tient trois`,
        ).toBeLessThanOrEqual(3);
        const charge =
          mots(s.narrative) +
          mots(s.problem) +
          s.diagnosticOptions.reduce((t, o) => t + mots(o.label), 0) +
          s.quiz.reduce(
            (t, q) => t + mots(q.prompt) + q.options.reduce((u, o) => u + mots(o.label), 0),
            0,
          );
        if (charge > PLAFOND_MOTS) lourdes.push(`${d.code}/${s.code} : ${charge} mots`);
      }
    }
    expect(
      lourdes,
      `situations trop longues à lire en pleine partie :\n${lourdes.join("\n")}`,
    ).toEqual([]);
  });

  it("une situation qui enseigne une notion la déclare", () => {
    // Les situations nomment des notions sans les rattacher : la fiche de
    // MAILLE & CO faisait calculer un coefficient multiplicateur depuis
    // toujours, sans jamais le déclarer. La notion n'entrait donc pas au
    // profil de l'élève, la fiche du référentiel ne renvoyait pas vers elle,
    // et l'enseignant qui cherchait « où travaille-t-on le coefficient ? » ne
    // trouvait rien.
    //
    // On ne retient que des termes qui ne s'emploient jamais en passant. Le
    // « seuil de rentabilité » est cité partout comme repère sans être le
    // sujet, et l'exiger produirait du bruit plutôt qu'une règle.
    const SIGNES: [string, RegExp][] = [
      ["markup_coefficient", /coefficient multiplicateur/i],
      ["markdown", /démarque/i],
      ["stock_rotation", /rotation des stocks|rotation du stock|durée de stockage/i],
      ["average_basket", /panier moyen|indice de vente/i],
      ["conversion_rate", /taux de transformation/i],
      ["assortment", /assortiment/i],
      ["sales_per_sqm", /mètre de linéaire|rendement du linéaire/i],
    ];
    const manquantes: string[] = [];
    for (const d of SCENARIOS) {
      for (const s of d.situations) {
        // La question « quel modèle d'analyse ? » est GÉNÉRÉE et liste les
        // intitulés des modèles, dont « Analyse du seuil de rentabilité » et
        // « Prix psychologique ». La lire ici ferait croire que chaque
        // situation enseigne tout ce que ses modèles nomment : une première
        // version de cette garde signalait ainsi vingt-cinq faux cas.
        const prose = [
          s.narrative,
          s.problem,
          ...s.diagnosticOptions.map((o) => o.label),
          ...s.quiz
            .filter((q) => q.id !== "model_choice")
            .flatMap((q) => [q.prompt, q.explain, ...q.options.map((o) => o.label)]),
          ...s.hints.map((h) => h.text),
        ].join(" ");
        for (const [code, motif] of SIGNES) {
          if (motif.test(prose) && !s.conceptCodes.includes(code)) {
            manquantes.push(`${d.code}/${s.code} : enseigne « ${code} » sans le déclarer`);
          }
        }
      }
    }
    expect(manquantes, `notions enseignées sans être rattachées :\n${manquantes.join("\n")}`).toEqual(
      [],
    );
  });

  it("le vocabulaire de chaque secteur est complet et lui est propre", () => {
    // C'est ce vocabulaire qui parle à l'élève : un hôtel n'a pas de
    // « machines », un cabinet ne vend pas des « unités ».
    const seen = new Map<string, string>();
    for (const d of SCENARIOS) {
      const v = d.vocabulary;
      for (const [key, value] of Object.entries(v)) {
        if (key === "unitsGender") continue; // une lettre, vérifiée juste après
        expect(value.length, `${d.code}/${key} vide`).toBeGreaterThan(1);
      }
      // Le genre de l'unité vendue : sans lui, toute phrase qui accorde un
      // participe avec elle est fausse dans les secteurs de l'autre genre.
      expect(["m", "f"], `${d.code}/unitsGender`).toContain(v.unitsGender);
      // Le libellé de l'invendu est un NOM, pas un endroit : les phrases le
      // reprennent tel quel (« Ce stock en réserve, vous le videz ? »). Le
      // faire suivre d'une préposition donnait « immobilisés en stock en
      // réserve ». Il doit donc rester une tête de groupe nominal, sans
      // préposition qui le prolonge.
      expect(v.leftoverLabel, `${d.code}/leftoverLabel`).not.toMatch(/^(en|au|dans|sur) /i);
      // Les mots du panneau de capacité doivent être des phrases utiles
      expect(v.capacityBottleneckHint.length, d.code).toBeGreaterThan(40);
      expect(v.laborBottleneckHint.length, d.code).toBeGreaterThan(40);
      // et le suffixe par tour doit nommer l'unité du secteur
      expect(v.perRoundLabel, d.code).toContain("/tour");
      // aucun secteur ne réutilise le mot d'un autre pour son goulot physique
      // (les deux variantes d'une même famille, en un produit ou en gamme,
      // partagent le même métier et donc le même mot).
      const prior = seen.get(v.capacityBottleneckLabel);
      const memeFamille = prior !== undefined && familyOf(prior) !== undefined && familyOf(prior) === familyOf(d.code);
      expect(
        memeFamille ? undefined : prior,
        `« ${v.capacityBottleneckLabel} » partagé entre ${prior} et ${d.code}`,
      ).toBeUndefined();
      seen.set(v.capacityBottleneckLabel, d.code);
    }
  });

  it("aucun secteur ne parle d'« unités » génériques", () => {
    for (const d of SCENARIOS) {
      expect(d.vocabulary.unit, d.code).not.toBe("unité");
      expect(d.vocabulary.units, d.code).not.toBe("unités");
    }
  });

  it("la saisonnalité couvre tous les tours de la partie", () => {
    for (const d of SCENARIOS) {
      const s = d.scenario;
      expect(s.market.seasonality.length, `${d.code} : saisonnalité globale`).toBeGreaterThanOrEqual(
        s.roundsCount,
      );
      for (const segment of s.market.segments) {
        if (!segment.seasonality) continue;
        expect(
          segment.seasonality.length,
          `${d.code}/${segment.code} : saisonnalité du segment`,
        ).toBeGreaterThanOrEqual(s.roundsCount);
      }
      // Gamme : chaque produit porte son marché, et c'est lui que le moteur
      // simule ; sa saisonnalité et celles de ses segments couvrent la partie.
      for (const p of s.products ?? []) {
        if (p.market.seasonality) {
          expect(
            p.market.seasonality.length,
            `${d.code}/${p.code} : saisonnalité du produit`,
          ).toBeGreaterThanOrEqual(s.roundsCount);
        }
        for (const segment of p.market.segments) {
          if (!segment.seasonality) continue;
          expect(
            segment.seasonality.length,
            `${d.code}/${p.code}/${segment.code} : saisonnalité du segment`,
          ).toBeGreaterThanOrEqual(s.roundsCount);
        }
      }
    }
  });
});

describe("le pictogramme et le nom court d'un scénario", () => {
  it("deux scénarios du même secteur ne se ressemblent pas", () => {
    // Le choix de l'entreprise se fait sur une tuile : un pictogramme et un
    // nom court. NOVA se joue en un produit ou en gamme ; deux tuiles
    // « 🏭 Industrie » ne disaient pas laquelle est laquelle.
    for (const d of SCENARIOS) {
      expect(d.icon.length, d.code).toBeGreaterThan(0);
      expect(d.shortName.length, d.code).toBeGreaterThan(0);
      expect(d.title.toUpperCase().startsWith(d.shortName.split(" · ")[0]!.toUpperCase()), `${d.code} : le nom court n'est pas la tête du titre`).toBe(true);
    }
    const parSecteur = new Map<string, typeof SCENARIOS[number][]>();
    for (const d of SCENARIOS) parSecteur.set(d.sector, [...(parSecteur.get(d.sector) ?? []), d]);
    for (const [secteur, defs] of parSecteur) {
      expect(new Set(defs.map((d) => d.icon)).size, `${secteur} : deux scénarios avec le même pictogramme`).toBe(defs.length);
      expect(new Set(defs.map((d) => d.shortName)).size, `${secteur} : deux scénarios avec le même nom court`).toBe(defs.length);
    }
    expect(scenarioByCode("nova").icon).not.toBe(scenarioByCode("nova-gamme").icon);
    expect(scenarioByCode("nova-gamme").shortName).toContain("gamme");
  });
});

describe("les familles de scénarios : un produit ou la gamme, selon le niveau", () => {
  it("NOVA et MAILLE & CO se présentent en une seule tuile, et le niveau choisit la variante", async () => {
    const { SCENARIO_CHOICES, SCENARIO_FAMILIES, scenarioCodeForLevel } = await import("../../src/config/scenarios/registry");
    const codes = SCENARIO_CHOICES.map((d) => d.code);
    expect(codes).toContain("nova");
    expect(codes).toContain("boutique");
    expect(codes).not.toContain("nova-gamme");
    expect(codes).not.toContain("boutique-mono");
    // Chaque famille : sa tête est proposée, ses deux variantes existent au registre.
    for (const f of SCENARIO_FAMILIES) {
      expect(codes).toContain(f.head);
      expect(scenarioByCode(f.mono).code).toBe(f.mono);
      expect(scenarioByCode(f.gamme).code).toBe(f.gamme);
      expect(scenarioByCode(f.mono).scenario.products).toBeUndefined();
      expect(scenarioByCode(f.gamme).scenario.products?.length ?? 0).toBeGreaterThan(1);
      expect(scenarioByCode(f.mono).sector).toBe(scenarioByCode(f.gamme).sector);
    }
    // NOVA : une enceinte jusqu'au niveau 3, la gamme à partir du 4 (la R&D s'ouvre).
    expect(scenarioCodeForLevel("nova", 1)).toBe("nova");
    expect(scenarioCodeForLevel("nova", 3)).toBe("nova");
    expect(scenarioCodeForLevel("nova", 4)).toBe("nova-gamme");
    expect(scenarioCodeForLevel("nova", 6)).toBe("nova-gamme");
    // Le code d'une variante répond à la même règle : demander la gamme à un niveau bas donne le mono.
    expect(scenarioCodeForLevel("nova-gamme", 2)).toBe("nova");
    // MAILLE & CO : un article jusqu'au niveau 2, la gamme à partir du 3.
    expect(scenarioCodeForLevel("boutique", 1)).toBe("boutique-mono");
    expect(scenarioCodeForLevel("boutique", 2)).toBe("boutique-mono");
    expect(scenarioCodeForLevel("boutique", 3)).toBe("boutique");
    expect(scenarioCodeForLevel("boutique-mono", 5)).toBe("boutique");
    // L'ESCALE : une nuitée à prix moyen jusqu'au niveau 3, les trois chambres à partir du 4.
    expect(scenarioCodeForLevel("hotel", 3)).toBe("hotel");
    expect(scenarioCodeForLevel("hotel", 4)).toBe("hotel-gamme");
    expect(codes).not.toContain("hotel-gamme");
    // ATLAS CONSEIL : une journée à taux moyen jusqu'au niveau 3, les trois offres à partir du 4.
    expect(scenarioCodeForLevel("conseil", 3)).toBe("conseil");
    expect(scenarioCodeForLevel("conseil", 4)).toBe("conseil-gamme");
    expect(scenarioCodeForLevel("conseil-gamme", 2)).toBe("conseil");
    expect(codes).not.toContain("conseil-gamme");
    // LA TABLE D'AUGUSTIN : un seul ticket moyen jusqu'au niveau 3, les quatre offres à partir du 4.
    expect(scenarioCodeForLevel("bistrot", 3)).toBe("bistrot");
    expect(scenarioCodeForLevel("bistrot", 4)).toBe("bistrot-gamme");
    expect(codes).not.toContain("bistrot-gamme");
    // PIXEL & CO : une commande à panier moyen jusqu'au niveau 3, les quatre rayons à partir du 4.
    expect(scenarioCodeForLevel("ecommerce", 3)).toBe("ecommerce");
    expect(scenarioCodeForLevel("ecommerce", 4)).toBe("ecommerce-gamme");
    expect(codes).not.toContain("ecommerce-gamme");
    // Sans niveau : le plus simple. Hors famille : le code tel quel.
    expect(scenarioCodeForLevel("nova", undefined)).toBe("nova");
    expect(scenarioCodeForLevel("fitness", 6)).toBe("fitness");
    expect(scenarioCodeForLevel("scenario-enseignant-inconnu", 6)).toBe("scenario-enseignant-inconnu");
    // Une famille ne peut ouvrir la gamme qu'à un niveau qui existe.
    for (const f of SCENARIO_FAMILIES) {
      expect(f.gammeFromLevel).toBeGreaterThan(1);
      expect(f.gammeFromLevel).toBeLessThanOrEqual(6);
    }
  });
});

describe("les coûts d'une unité vendue restent plausibles", () => {
  it("le coût variable reste sous le prix usuel, et aucun fournisseur ne le fait tomber sous un plancher", async () => {
    // ATLAS CONSEIL affichait « Réseau de freelances · achat 48,40 € » pour
    // une journée de consultant : le mécanisme fournisseur multipliait les
    // frais de mission, et le dossier appelait « achat » ce qui n'en est pas
    // un. Un fournisseur qui divise par deux ou triple un coût d'achat ne
    // décrit plus une entreprise.
    const { toGamme, suppliersOf } = await import("../../src/engine/gamme");
    for (const d of SCENARIOS) {
      for (const p of toGamme(d.scenario)) {
        const dominant = [...p.market.segments].sort((a, b) => b.size - a.size)[0]!;
        const variable = p.materialCostPerUnit + p.otherVariableCostPerUnit;
        expect(variable, `${d.code}/${p.code} : coût variable ${variable} ≥ prix usuel ${dominant.refPrice}`).toBeLessThan(dominant.refPrice);
        for (const s of suppliersOf(p, d.scenario) ?? []) {
          expect(s.costMultiplier, `${d.code}/${p.code}/${s.code} : ×${s.costMultiplier}`).toBeGreaterThanOrEqual(0.5);
          expect(s.costMultiplier, `${d.code}/${p.code}/${s.code} : ×${s.costMultiplier}`).toBeLessThanOrEqual(2);
          expect(p.materialCostPerUnit * s.costMultiplier + p.otherVariableCostPerUnit, `${d.code}/${p.code}/${s.code}`).toBeLessThan(dominant.refPrice);
        }
      }
      // L'unité de temps de travail, quand elle est déclarée, est l'une des deux connues.
      if (d.vocabulary.laborTimeUnit !== undefined) expect(["heure", "jour"]).toContain(d.vocabulary.laborTimeUnit);
    }
    // Le conseil compte des jours, et ses « fournisseurs » sont des politiques de mission, pas des journées à 50 €.
    const conseil = scenarioByCode("conseil");
    expect(conseil.vocabulary.laborTimeUnit).toBe("jour");
    for (const s of conseil.scenario.suppliers ?? []) {
      expect(s.name).not.toMatch(/freelance|expert/i);
    }
  });
});
