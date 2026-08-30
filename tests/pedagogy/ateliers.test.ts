import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ATELIERS, dureeTotaleHeures } from "../../src/config/ateliers";
import { THEMES_STMG } from "../../src/config/ateliers/stmg";
import { SCENARIOS, scenarioByCode } from "../../src/config/scenarios/registry";
import { DIFFICULTY_PRESETS } from "../../src/config/difficulty";

/**
 * Garde-fous des ateliers professionnels.
 *
 * Un déroulé pédagogique se lit comme un contrat : l'enseignant y prend des
 * engagements de temps devant sa classe. Une séance annoncée quatre heures dont
 * le minutage en fait cinq lui explose au visage en salle, et il ne reviendra
 * pas. Ces règles-là ne se vérifient pas à la relecture, elles se vérifient
 * ici.
 */
describe("ateliers professionnels", () => {
  it("les codes d'atelier sont uniques", () => {
    const codes = ATELIERS.map((a) => a.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("le minutage de chaque séance fait exactement sa durée annoncée", () => {
    // C'est la règle qui compte : un déroulé qui déborde est un déroulé faux.
    for (const a of ATELIERS) {
      for (const s of a.seances) {
        const somme = s.deroule.reduce((t, p) => t + p.minutes, 0);
        expect(somme, `${a.code}/séance ${s.numero} : minutage ≠ durée annoncée`).toBe(
          s.dureeMinutes,
        );
      }
    }
  });

  it("la partie dure exactement le nombre de tours que l'atelier joue", () => {
    // Le nombre de tours d'une partie venait du secteur et de lui seul, et une
    // fiche l'annonçait en comptant ses séances. Trois nombres différents
    // cohabitaient donc sur la fiche du DCG : cinq séances, quatre tours joués,
    // six tours de partie. L'enseignant créait une partie qui ne se terminerait
    // jamais, sans classement final ni relevé complet.
    for (const a of ATELIERS) {
      const joues = a.seances.filter((s) => s.tourJoue !== null);
      expect(
        a.reglages.tours,
        `${a.code} : ${a.reglages.tours} tours annoncés pour ${joues.length} séances qui en jouent un`,
      ).toBe(joues.length);
      // Le dernier tour joué doit être le dernier de la partie, sans trou.
      expect(
        joues.map((s) => s.tourJoue),
        `${a.code} : les tours joués ne couvrent pas la partie`,
      ).toEqual(Array.from({ length: joues.length }, (_, i) => i + 1));
      const scenario = scenarioByCode(a.reglages.scenarioCode);
      expect(
        a.reglages.tours,
        `${a.code} : plus de tours que le secteur n'en porte`,
      ).toBeLessThanOrEqual(scenario.scenario.roundsCount);
    }
  });

  it("la fiche ne déduit pas le nombre de tours du nombre de séances", () => {
    // La confusion d'origine, en une ligne de page : « une partie de {séances}
    // tours ». Elle était fausse sur quatre fiches sur cinq.
    const page = readFileSync("src/app/ateliers/[code]/page.tsx", "utf-8")
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    expect(page, "la fiche compte les séances pour annoncer des tours").not.toMatch(
      /partie de \{atelier\.seances\.length\} tours/,
    );
    expect(page, "la fiche n'annonce pas les tours du registre").toContain(
      "atelier.reglages.tours",
    );
  });

  it("aucune séance ne dépasse trois heures", () => {
    // Une séance de quatre heures ne rentre pas dans un emploi du temps ordinaire :
    // l'enseignant qui n'a que trois heures devant lui doit couper lui-même, et il
    // coupe le débriefing, qui est justement ce qui fait l'atelier. La trame tient
    // donc en trois heures, à charge pour qui dispose de plus de temps d'étirer.
    for (const a of ATELIERS) {
      for (const s of a.seances) {
        expect(
          s.dureeMinutes,
          `${a.code}/séance ${s.numero} : ${s.dureeMinutes} minutes annoncées`,
        ).toBeLessThanOrEqual(180);
      }
    }
  });

  it("le temps de parole annoncé tient dans la phase qui l'accueille", () => {
    // Le piège du déroulé : « huit minutes de présentation et quatre minutes de
    // questions » multiplié par le nombre d'équipes déborde la phase qui doit les
    // contenir. Personne ne s'en aperçoit à la relecture, tout le monde s'en
    // aperçoit à la troisième équipe qui passe. Trois ateliers publiés étaient
    // dans ce cas.
    //
    // Les temps se lisent sur toute la séance et pas seulement sur la phase : ils
    // sont presque toujours annoncés dans les consignes, une phase plus tôt. Une
    // première version de cette garde ne lisait que la phase, et ne voyait donc
    // qu'un cas sur trois.
    const CHIFFRES: Record<string, number> = {
      deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8,
      neuf: 9, dix: 10, onze: 11, douze: 12, quinze: 15, vingt: 20,
    };
    const valeur = (brut: string) =>
      /^\d+$/.test(brut) ? Number(brut) : (CHIFFRES[brut.toLowerCase()] ?? 0);

    for (const a of ATELIERS) {
      for (const s of a.seances) {
        // Une phrase à la fois : deux phrases qui répètent le même horaire ne
        // doivent pas s'additionner.
        const phrases = [s.preparation, ...s.deroule.map((p) => p.detail)].join(" ").split(/[.;]/);
        let parEquipe = 0;
        for (const phrase of phrases) {
          let somme = 0;
          for (const m of phrase.matchAll(/(\d+|[A-Za-zéèê]+)\s+minutes?\s+par\s+équipe/gi)) {
            somme += valeur(m[1]!);
          }
          for (const m of phrase.matchAll(
            /(\d+|[A-Za-zéèê]+)\s+minutes?\s+de\s+(présentation|questions|soutenance)/gi,
          )) {
            somme += valeur(m[1]!);
          }
          parEquipe = Math.max(parEquipe, somme);
        }
        if (parEquipe === 0) continue;
        const phase = s.deroule.find(
          (p) => /soutenances|présentations|passage/i.test(p.titre) && !/préparation|consignes/i.test(p.titre),
        );
        expect(phase, `${a.code}/séance ${s.numero} : temps de parole annoncé sans phase pour le tenir`).toBeDefined();
        expect(
          a.reglages.equipes * parEquipe,
          `${a.code}/séance ${s.numero} : ${a.reglages.equipes} équipes × ${parEquipe} min ne tiennent pas dans « ${phase!.titre} » (${phase!.minutes} min)`,
        ).toBeLessThanOrEqual(phase!.minutes);
      }
    }
  });

  it("les séances se suivent sans trou et jouent les tours dans l'ordre", () => {
    for (const a of ATELIERS) {
      expect(a.seances.map((s) => s.numero), a.code).toEqual(a.seances.map((_, i) => i + 1));
      const tours = a.seances.map((s) => s.tourJoue).filter((t): t is number => t !== null);
      expect([...tours].sort((x, y) => x - y), `${a.code} : tours dans le désordre`).toEqual(tours);
    }
  });

  it("l'atelier ne demande jamais plus de tours que la partie n'en compte", () => {
    // Une séance 7 dans une partie de six tours n'a rien à jouer.
    for (const a of ATELIERS) {
      const scenario = scenarioByCode(a.reglages.scenarioCode);
      for (const s of a.seances) {
        if (s.tourJoue === null) continue;
        expect(
          s.tourJoue,
          `${a.code}/séance ${s.numero} : tour ${s.tourJoue} hors de la partie`,
        ).toBeLessThanOrEqual(scenario.scenario.roundsCount);
      }
    }
  });

  it("l'animation de lycée ne cite que des thèmes qui existent au programme", () => {
    // Deux thèmes étaient inventés : un « Évaluation et performance » qui
    // n'appartient à aucun des trois programmes, cité par deux séances, et un
    // intitulé de management tronqué. C'est l'erreur que repère du premier
    // coup d'œil le seul lecteur qui connaît son programme par cœur.
    //
    // Les intitulés vivent maintenant dans une liste fermée, que le
    // compilateur fait respecter. Cette garde ferme la porte restante : une
    // séance qui écrirait de nouveau un thème à la main serait rouge.
    const officiels = new Set<string>(Object.values(THEMES_STMG));
    const stmg = ATELIERS.find((a) => a.code === "stmg")!;
    const inventes = [...new Set(stmg.seances.flatMap((s) => s.processus))].filter(
      (t) => !officiels.has(t),
    );
    expect(inventes, `thèmes hors programme : ${inventes.join(" · ")}`).toEqual([]);
    // Et la liste elle même reste utile : chaque thème déclaré sert au moins
    // une fois, sans quoi elle se remplirait de thèmes que rien ne travaille.
    const cites = new Set(stmg.seances.flatMap((s) => s.processus));
    const dormants = [...officiels].filter((t) => !cites.has(t));
    expect(
      dormants.length,
      `${dormants.length} thèmes déclarés que l'animation ne travaille jamais : ${dormants.join(" · ")}`,
    ).toBeLessThanOrEqual(2);
  });

  it("aucun atelier ne ferme avant le pic de son secteur", () => {
    // Le défaut que cette garde attrape a été trouvé par un enseignant, pas par
    // la suite : l'animation de découverte jouait trois trimestres sur NOVA, un
    // secteur dont le marché vaut 18 000 unités au premier tour et 49 680 au
    // quatrième, parce qu'un compte-clé qui pèse plus du tiers de la demande
    // n'entre en scène qu'au troisième. La partie se jouait donc entièrement
    // dans le creux et s'arrêtait le trimestre AVANT ce pour quoi le scénario
    // est écrit.
    //
    // Rien ne le signalait : le nombre de tours était cohérent avec le nombre
    // de séances, le secteur existait, la partie se créait. Le déroulé était
    // juste et le monde qu'il faisait jouer, amputé.
    for (const a of ATELIERS) {
      const scenario = scenarioByCode(a.reglages.scenarioCode).scenario;
      const demandeParTour = Array.from({ length: scenario.roundsCount }, (_, r) =>
        scenario.market.segments.reduce(
          (t, seg) => t + seg.size * (seg.seasonality?.[r] ?? 1),
          0,
        ) * (scenario.market.seasonality?.[r] ?? 1),
      );
      const pic = demandeParTour.indexOf(Math.max(...demandeParTour)) + 1;
      const ampleur = Math.max(...demandeParTour) / Math.min(...demandeParTour);
      expect(
        a.reglages.tours,
        `${a.code} : ${a.reglages.tours} tours sur « ${a.reglages.scenarioCode} », dont le marché culmine au tour ${pic} en valant ${ampleur.toFixed(1)} fois son creux`,
      ).toBeGreaterThanOrEqual(pic);
    }
  });

  it("les réglages annoncés existent vraiment dans le produit", () => {
    // Le pire défaut possible : un atelier qui décrit une partie qu'on ne peut
    // pas créer. L'enseignant le découvrirait devant sa classe.
    for (const a of ATELIERS) {
      expect(
        SCENARIOS.some((s) => s.code === a.reglages.scenarioCode),
        `${a.code} : secteur inconnu « ${a.reglages.scenarioCode} »`,
      ).toBe(true);
      const preset = DIFFICULTY_PRESETS.find((p) => p.level === a.reglages.niveau);
      expect(preset, `${a.code} : niveau ${a.reglages.niveau} inexistant`).toBeDefined();
      expect(preset!.name, `${a.code} : le nom du niveau ne correspond plus`).toBe(
        a.reglages.niveauNom,
      );
      expect(["month", "quarter", "year"], a.code).toContain(a.reglages.periodicite);
      expect(a.reglages.equipes, a.code).toBeGreaterThanOrEqual(1);
      expect(
        a.reglages.equipes,
        `${a.code} : plus d'équipes que la création n'en accepte`,
      ).toBeLessThanOrEqual(8);
      expect(a.reglages.bots, a.code).toBeGreaterThanOrEqual(0);
      expect(a.reglages.bots, a.code).toBeLessThanOrEqual(4);
    }
  });

  it("une séance ne peut pas porter sur des décisions que le niveau ne donne pas", () => {
    // Une séance de plan de trésorerie suppose que la banque existe, une séance
    // de recrutement que le personnel soit ouvert, une séance d'investissement
    // que l'investissement le soit. Annoncer l'une sans l'autre enverrait
    // l'enseignant chercher devant sa classe un panneau qui n'existe pas.
    const EXIGENCES = [
      { mots: /trésorerie|emprunt|financement|banque/i, levier: "finance" as const },
      { mots: /recrut|embauch|personnel|effectif/i, levier: "hr" as const },
      { mots: /investir|investissement/i, levier: "investment" as const },
      { mots: /placement|excédents? de trésorerie/i, levier: "placement" as const },
    ];
    for (const a of ATELIERS) {
      const preset = DIFFICULTY_PRESETS.find((p) => p.level === a.reglages.niveau)!;
      for (const s of a.seances) {
        const dit = `${s.titre} ${s.objectif}`;
        for (const { mots, levier } of EXIGENCES) {
          if (!mots.test(dit)) continue;
          expect(
            preset.decisions[levier],
            `${a.code}/séance ${s.numero} : porte sur « ${levier} » au niveau ${preset.level}, qui ne l'ouvre pas`,
          ).toBe(true);
        }
      }
    }
  });

  it("chaque séance produit une trace et dit ce qui est évalué", () => {
    // La règle qui fait la différence entre un atelier et une partie de jeu :
    // rien ne se joue sans laisser d'écrit.
    for (const a of ATELIERS) {
      for (const s of a.seances) {
        expect(s.livrable.length, `${a.code}/séance ${s.numero} : pas de livrable`).toBeGreaterThan(
          40,
        );
        expect(
          s.tracePasseport.length,
          `${a.code}/séance ${s.numero} : pas de trace de passeport`,
        ).toBeGreaterThan(40);
        // Une trace de passeport se rédige à la première personne : c'est
        // l'élève qui atteste, pas le professeur qui décrit.
        expect(
          /^J[e']/.test(s.tracePasseport),
          `${a.code}/séance ${s.numero} : la trace n'est pas à la première personne`,
        ).toBe(true);
        expect(s.evaluation.length, `${a.code}/séance ${s.numero}`).toBeGreaterThanOrEqual(3);
        expect(s.competences.length, `${a.code}/séance ${s.numero}`).toBeGreaterThanOrEqual(3);
        for (const c of s.competences) {
          expect(
            /^J[e']/.test(c),
            `${a.code}/séance ${s.numero} : « ${c.slice(0, 40)}… » n'est pas un acte`,
          ).toBe(true);
        }
        expect(s.processus.length, `${a.code}/séance ${s.numero}`).toBeGreaterThanOrEqual(1);
        expect(s.notions.length, `${a.code}/séance ${s.numero}`).toBeGreaterThanOrEqual(3);
        expect(s.preparation.length, `${a.code}/séance ${s.numero}`).toBeGreaterThan(60);
      }
    }
  });

  it("le format annoncé dit le vrai nombre d'heures", () => {
    // « 6 séances de 4 h » se confronte au minutage réel : la promesse de la
    // carte doit tomber juste, sinon elle ment sur la vitrine.
    //
    // La demi-heure est lue elle aussi. Le registre ne savait écrire que des
    // heures entières, ce qui convient aux créneaux de deux ou trois heures
    // d'une section de technicien et à rien d'autre : un lycée travaille par
    // séances d'une heure trente, et l'animation de découverte s'est cognée à
    // cette limite le jour où il a fallu lui donner quatre séances sans
    // allonger son volume.
    for (const a of ATELIERS) {
      const heures = dureeTotaleHeures(a);
      const m = /(\d+)\s*séances?\s*de\s*(\d+)\s*h(?:\s*(\d+))?/i.exec(a.format);
      expect(m, `${a.code} : format « ${a.format} » illisible`).not.toBeNull();
      expect(Number(m![1]), `${a.code} : nombre de séances annoncé`).toBe(a.seances.length);
      const parSeance = Number(m![2]) + (m![3] === undefined ? 0 : Number(m![3]) / 60);
      expect(Number(m![1]) * parSeance, `${a.code} : volume annoncé ≠ minutage`).toBe(heures);
    }
  });

  it("un atelier s'annonce, se note et se prolonge", () => {
    for (const a of ATELIERS) {
      expect(a.titre.length, a.code).toBeGreaterThan(10);
      expect(a.resume.length, a.code).toBeGreaterThan(40);
      expect(a.pitch.length, a.code).toBeGreaterThan(80);
      expect(a.pourquoi.length, `${a.code} : le pourquoi tient du slogan`).toBeGreaterThan(200);
      expect(
        a.seances.length,
        `${a.code} : un atelier d'une séance n'est pas un atelier`,
      ).toBeGreaterThanOrEqual(3);
      expect(a.formats.length, `${a.code} : un seul tempo proposé`).toBeGreaterThanOrEqual(2);
      expect(a.evaluationFinale.length, a.code).toBeGreaterThanOrEqual(3);
      expect(a.prolongements.length, a.code).toBeGreaterThanOrEqual(2);
      expect(a.faq.length, a.code).toBeGreaterThanOrEqual(4);
      for (const f of a.faq) {
        expect(f.question.trim().endsWith("?"), `${a.code} : « ${f.question} »`).toBe(true);
        expect(f.reponse.length, `${a.code}/${f.question}`).toBeGreaterThan(80);
      }
    }
  });

  it("chaque atelier emploie le mot par lequel son référentiel découpe le métier", () => {
    // Le BTS CG a des processus, le BTS MCO des blocs de compétences, le BTS
    // GPME des activités, le DCG des unités d'enseignement. Écrire « processus »
    // sur la fiche d'un diplôme qui n'en a pas se voit du premier coup d'œil,
    // et par le seul lecteur qui connaît son référentiel par cœur.
    for (const a of ATELIERS) {
      expect(a.referentielLabel.length, `${a.code} : mot du référentiel absent`).toBeGreaterThan(5);
      expect(a.referentielLabel[0], `${a.code} : le mot ne commence pas par une majuscule`).toBe(
        a.referentielLabel[0]!.toUpperCase(),
      );
      expect(["mobilisés", "mobilisées"], `${a.code} : accord inattendu`).toContain(
        a.referentielAccord,
      );
    }
  });

  it("chaque fiche dit ce qu'elle est et quel document sa trace nourrit", () => {
    // Même défaut que le mot du référentiel, un cran plus haut : la page
    // annonçait « Atelier professionnel » et « passeport professionnel » pour
    // toutes les fiches. Le passeport professionnel est une pièce du BTS
    // Comptabilité et Gestion ; le promettre à un lycée, c'est promettre un
    // objet qui n'existe pas chez lui, et « atelier professionnel » ne désigne
    // pas la même chose en seconde cycle général et technologique.
    for (const a of ATELIERS) {
      expect(a.nature.length, `${a.code} : nature absente`).toBeGreaterThan(8);
      expect(a.nature[0], `${a.code} : la nature ne commence pas par une majuscule`).toBe(
        a.nature[0]!.toUpperCase(),
      );
      expect(a.traceLabel.length, `${a.code} : document de la trace absent`).toBeGreaterThan(8);
      // L'effectif d'équipe s'écrit après « équipes de » : il ne porte donc ni
      // majuscule ni nombre en chiffres.
      expect(
        a.reglages.effectifParEquipe,
        `${a.code} : effectif d'équipe manquant ou en chiffres`,
      ).toMatch(/^[a-zà-ÿ][^0-9]*élèves?$/);
      // La page écrit « son {traceLabel} » et « le {traceLabel} » : un nom
      // féminin y ferait deux fautes d'accord.
      expect(
        a.traceLabel[0],
        `${a.code} : le document de la trace commence par une majuscule, il s'écrit après un article`,
      ).toBe(a.traceLabel[0]!.toLowerCase());
    }
  });

  it("les pages d'atelier n'écrivent ni la nature ni le document de la trace en dur", () => {
    // Sans cette garde, une page peut retomber sur « atelier professionnel »
    // pour toutes les fiches sans qu'aucune donnée ne change : le défaut
    // d'origine, découvert le jour où une animation de découverte pour le
    // lycée est entrée au registre.
    for (const chemin of ["src/app/ateliers/page.tsx", "src/app/ateliers/[code]/page.tsx"]) {
      const source = readFileSync(chemin, "utf-8")
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      expect(source, `${chemin} écrit « atelier professionnel » en dur`).not.toMatch(
        /Atelier professionnel/i,
      );
      expect(source, `${chemin} écrit « passeport professionnel » en dur`).not.toMatch(
        /passeport professionnel/i,
      );
    }
    const fiche = readFileSync("src/app/ateliers/[code]/page.tsx", "utf-8");
    expect(fiche, "la fiche n'ouvre pas la nature de l'atelier").toContain("atelier.nature");
    expect(fiche, "la fiche n'ouvre pas le document de la trace").toContain("atelier.traceLabel");
  });

  it("le résumé des thèmes ne répète pas deux fois le même", () => {
    // La ligne « À retenir » ne montre que le premier segment de chaque
    // intitulé. Deux séances qui mobilisent le même thème l'écrivaient deux
    // fois, et une fiche dont les intitulés commencent tous par le niveau
    // affichait « Première, Première, Première ».
    const fiche = readFileSync("src/app/ateliers/[code]/page.tsx", "utf-8");
    expect(fiche, "le résumé des thèmes ne dédoublonne pas ce qu'il affiche").toMatch(
      /new Set\(processus\.map/,
    );
    // Le vrai risque n'est pas la répétition, c'est la CONFUSION : deux thèmes
    // différents qui se réduisent au même mot deviennent indiscernables dans
    // le résumé, et l'enseignant y lit un seul thème là où sa classe en
    // travaille deux.
    for (const a of ATELIERS) {
      const parCourt = new Map<string, Set<string>>();
      for (const complet of new Set(a.seances.flatMap((s) => s.processus))) {
        const court = complet.split("·")[0]!.trim();
        expect(court.length, `${a.code} : intitulé vide avant le point médian`).toBeGreaterThan(1);
        if (!parCourt.has(court)) parCourt.set(court, new Set());
        parCourt.get(court)!.add(complet);
      }
      const confondus = [...parCourt].filter(([, complets]) => complets.size > 1);
      expect(
        confondus.map(([court, complets]) => `${court} (${complets.size} thèmes)`),
        `${a.code} : le résumé réduit plusieurs thèmes au même mot`,
      ).toEqual([]);
    }
  });

  it("les pages d'atelier n'écrivent aucun mot de référentiel en dur", () => {
    // Sans cette garde, une page peut retomber sur « processus » pour tous les
    // diplômes sans qu'aucune donnée ne change : le défaut d'origine.
    for (const chemin of ["src/app/ateliers/page.tsx", "src/app/ateliers/[code]/page.tsx"]) {
      const source = readFileSync(chemin, "utf-8")
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      expect(source, `${chemin} écrit « Processus mobilisés » en dur`).not.toMatch(
        /Processus mobilisés/i,
      );
    }
    const fiche = readFileSync("src/app/ateliers/[code]/page.tsx", "utf-8");
    expect(fiche, "la fiche n'ouvre pas le mot du référentiel").toContain(
      "atelier.referentielLabel",
    );
  });

  it("aucune prose d'atelier ne coupe une phrase par un tiret", () => {
    // Contrainte de style tenue partout ailleurs. Le tiret des mots composés
    // reste permis : on ne cherche que celui encadré d'espaces.
    const inciseur = /[\wÀ-ÿ][ ]+[—–][ ]+[\wÀ-ÿ]/;
    for (const a of ATELIERS) {
      const proses = [
        a.titre,
        a.resume,
        a.pitch,
        a.pourquoi,
        a.reglages.notes,
        ...a.formats.flatMap((f) => [f.nom, f.quand, f.comment]),
        ...a.evaluationFinale,
        ...a.prolongements,
        ...a.faq.flatMap((f) => [f.question, f.reponse]),
        ...a.seances.flatMap((s) => [
          s.titre,
          s.objectif,
          s.preparation,
          s.livrable,
          s.tracePasseport,
          ...s.competences,
          ...s.evaluation,
          ...s.deroule.flatMap((p) => [p.titre, p.detail]),
        ]),
      ];
      for (const prose of proses) {
        expect(prose, `${a.code} : « ${prose.slice(0, 50)}… »`).not.toMatch(inciseur);
      }
    }
  });
});
