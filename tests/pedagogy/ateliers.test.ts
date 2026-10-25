import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DIFFICULTES } from "../../src/config/ateliers/types";
import { ficheDeNotion } from "../../src/config/ateliers/notions";
import { ATELIERS, dureeTotaleHeures } from "../../src/config/ateliers";
import { THEMES_SECONDE_MG, THEMES_STMG } from "../../src/config/ateliers/stmg";
import {
  REFERENTIELS,
  REFERENTIELS_NON_VERIFIES,
  referentielDeCitation,
} from "../../src/config/ateliers/referentiels";
import {
  DEFAULT_SCENARIO_CODE,
  SCENARIOS,
  scenarioByCode,
  scenarioCodeForLevel,
} from "../../src/config/scenarios/registry";
import { DIFFICULTY_PRESETS, LEGACY_PRESET } from "../../src/config/difficulty";
import { formatDuTournoi, LIMITES_CONCOURS } from "../../src/config/concours";
import { TOURS_D_ESSAI } from "../../src/config/tour-d-essai";
import { NOMS_DES_MOIS, nomDuMois } from "../../src/config/scenarios/calendrier-mensuel";
import { tourDOuverture } from "../../src/config/scenarios/situation-kit";
import { FORMATIONS } from "../../src/config/formations";
import {
  chargeDesSeances,
  MARGE_CONSEILLEE,
} from "../../src/config/ateliers/duree-des-seances";

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
  it("chaque atelier joue la variante que son niveau appelle", () => {
    // NOVA et MAILLE & CO se jouent en un produit ou en gamme selon le
    // niveau : la partie créée pour un atelier suit cette règle, et le dossier
    // de l'élève doit décrire la même entreprise que celle qu'il dirigera.
    for (const a of ATELIERS) {
      expect(
        scenarioCodeForLevel(a.reglages.scenarioCode, a.reglages.niveau),
        `${a.code} : le niveau ${a.reglages.niveau} ne joue pas ${a.reglages.scenarioCode}`,
      ).toBe(a.reglages.scenarioCode);
    }
  });

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
    const page = readFileSync("src/app/animations/[code]/page.tsx", "utf-8")
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
      .replace(/^\s*\/\/.*$/gm, "");
    expect(page, "la fiche compte les séances pour annoncer des tours").not.toMatch(
      /partie de \{atelier\.seances\.length\} tours/,
    );
    expect(page, "la fiche n'annonce pas les tours du registre").toContain(
      "atelier.reglages.tours",
    );
  });

  it("aucune séance post-bac ne dépasse deux heures", () => {
    // Décision du propriétaire, 13 octobre 2026 : « Ok, passe tout à 2 h. »
    // Deux heures, c'est la séance de travaux dirigés d'une section de
    // technicien, d'un BUT, d'un DCG : la trame y tient, à charge pour qui
    // dispose de plus de temps d'étirer. Une séance plus longue obligeait
    // l'enseignant à couper lui-même, et il coupait le débriefing, qui est
    // justement ce qui fait l'atelier. Le lycée et le tournoi travaillent par
    // séances d'une heure trente ; ce sont les seules exceptions, nommées ici
    // une à une plutôt que déduites, pour qu'une nouvelle fiche ne s'y glisse
    // pas sans qu'on l'ait écrit. Toute autre séance fait EXACTEMENT deux
    // heures : une séance de 110 minutes serait un déroulé qu'on a raccourci
    // sans réécrire, et la garde du format (« N séances de 2 h ») ne la
    // verrait pas.
    const DEUX_HEURES = 120;
    const SEANCES_D_UNE_HEURE_TRENTE: Record<string, number> = {
      stmg: 90, // le lycée travaille par séances d'une heure trente
      campus: 90, // le tournoi inter-filières, sept séances courtes sur un campus
    };
    for (const a of ATELIERS) {
      const attendu = SEANCES_D_UNE_HEURE_TRENTE[a.code] ?? DEUX_HEURES;
      for (const s of a.seances) {
        expect(
          s.dureeMinutes,
          `${a.code}/séance ${s.numero} : ${s.dureeMinutes} minutes annoncées, ${attendu} attendues`,
        ).toBe(attendu);
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

  it("aucun atelier n'invente une entrée que son référentiel ne porte pas", () => {
    // Trois erreurs vivaient dans ces intitulés, et aucune ne se voyait sans
    // ouvrir l'arrêté. La pire portait sur un diplôme entier : le BTS Gestion
    // de la PME a des blocs de compétences, et le produit lui prêtait des
    // « activités », mot qui désigne dans son texte le découpage fin à
    // l'intérieur d'un bloc.
    //
    // Cette garde a d'abord exigé la formulation exacte du texte. C'était trop
    // serré : le mot qui découpe un métier est un choix d'affichage, une autre
    // filière viendra avec le sien, et un intitulé raccourci pour tenir dans
    // une fiche n'est pas une faute. Elle ne retient donc que ce qui a
    // réellement fait défaut : une entrée QUE LE TEXTE NE PORTE PAS, comme ce
    // thème de programme entièrement inventé.
    //
    // La comparaison se fait donc sur le fond : sans accents, sans casse, sans
    // le préfixe qui numérote, et une entrée citée est reconnue dès qu'elle se
    // retrouve dans une entrée officielle, ou l'inverse.
    //
    // Le préfixe retiré doit VRAIMENT numéroter : un mot court suivi d'un
    // chiffre, « P1 », « UE6 », « Bloc 2 », « Thème 1 ». La première version
    // retirait n'importe quel début de dix-huit caractères suivi d'un point
    // médian, et elle a dévoré un thème du programme entier : « Temps et
    // risque · Première, sciences de gestion et numérique » perdait son titre
    // et ne gardait que le nom du programme, si bien que la garde déclarait
    // inventé un thème parfaitement officiel. Un intitulé court n'est pas un
    // numéro.
    //
    // La comparaison se fait SEGMENT PAR SEGMENT, de part et d'autre du point
    // médian. Un intitulé n'est pas toujours précédé de son numéro : les
    // thèmes du lycée portent au contraire le nom de leur programme EN SUFFIXE,
    // « Le management stratégique · Première, management ». Comparer l'entrée
    // entière refusait alors tout raccourci, puisque le suffixe restait collé
    // au titre abrégé. Or un intitulé raccourci pour tenir dans une fiche
    // n'est pas une faute, c'est même la souplesse que cette garde doit
    // laisser.
    const segments = (entree: string) =>
      entree
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .split("·")
        .map((m) => m.replace(/[^a-z0-9]+/g, " ").trim())
        // Ce qui ne fait que numéroter ne compare rien : « p1 », « ue6 »,
        // « bloc 2 », « theme 1 ». Un segment trop court non plus, sans quoi
        // un mot commun suffirait à valider n'importe quel intitulé.
        .filter((m) => m.length >= 10 && !/^[a-z]{0,7} ?\d+$/.test(m));

    for (const [code, referentiel] of Object.entries(REFERENTIELS)) {
      const atelier = ATELIERS.find((a) => a.code === code);
      expect(atelier, `${code} : référentiel déclaré sans atelier`).toBeDefined();
      expect(referentiel.source.length, `${code} : provenance non écrite`).toBeGreaterThan(40);
      const officiels = referentiel.entrees.flatMap(segments);
      // Un atelier qui sert un second diplôme cite aussi les entrées de son
      // texte, préfixées de son sigle : la garde des fiches multi-diplômes les
      // confronte à ce texte-là, pas à celui-ci.
      const autreTexte = (p: string) => {
        const cite = referentielDeCitation(p);
        return cite !== null && cite.referentiel !== referentiel;
      };
      const inventees = [...new Set(atelier!.seances.flatMap((s) => s.processus))].filter((p) => {
        if (autreTexte(p)) return false;
        const cites = segments(p);
        return !cites.some((c) => officiels.some((o) => o.includes(c) || c.includes(o)));
      });
      expect(
        inventees,
        `${code} : entrées introuvables dans le texte du référentiel :\n${inventees.join("\n")}`,
      ).toEqual([]);
    }
    // Les diplômes dont le texte n'a pas été lu sont nommés plutôt que passés
    // sous silence, et un même code ne peut pas être des deux côtés.
    for (const code of REFERENTIELS_NON_VERIFIES) {
      expect(REFERENTIELS[code], `${code} : à la fois vérifié et déclaré non vérifié`).toBeUndefined();
    }
  });

  it("une fiche qui mobilise plusieurs diplômes est vérifiée intitulé par intitulé", () => {
    // Une immersion de campus cite quatre référentiels dans la même séance :
    // aucune clé unique ne peut la couvrir, et elle échappait donc à toute
    // vérification. Chaque intitulé y nomme son diplôme en préfixe, et c'est ce
    // préfixe qui rend la garde possible.
    const segments = (entree: string) =>
      entree
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .split("·")
        .map((m) => m.replace(/[^a-z0-9]+/g, " ").trim())
        .filter((m) => m.length >= 10 && !/^[a-z]{0,7} ?\d+$/.test(m));

    for (const a of ATELIERS) {
      // Une fiche qui a son propre référentiel passe aussi : ses intitulés sans
      // préfixe sont confrontés à son texte plus haut, et ceux qu'elle préfixe
      // pour un second diplôme le sont ici.
      const inventees: string[] = [];
      let prefixees = 0;
      for (const cite of new Set(a.seances.flatMap((s) => s.processus))) {
        const source = referentielDeCitation(cite);
        if (!source) continue;
        prefixees += 1;
        const officiels = source.referentiel.entrees.flatMap(segments);
        const cites = segments(cite);
        if (!cites.some((c) => officiels.some((o) => o.includes(c) || c.includes(o))))
          inventees.push(`${cite} (cherché dans ${source.code})`);
      }
      expect(
        inventees,
        `${a.code} : intitulés introuvables dans le texte du diplôme qu'ils nomment :\n${inventees.join("\n")}`,
      ).toEqual([]);
      // Une fiche multi-diplômes qui cesserait de préfixer ses intitulés
      // redeviendrait invérifiable sans que rien ne le signale.
      if (a.reglages.concours)
        expect(prefixees, `${a.code} : aucun intitulé ne nomme son diplôme`).toBeGreaterThan(0);
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
    const officiels = new Set<string>([
      ...Object.values(THEMES_STMG),
      ...Object.values(THEMES_SECONDE_MG),
    ]);
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
      // Le tour d'essai se demande à la création, parmi les longueurs que le
      // formulaire propose : une fiche qui en annoncerait trois enverrait
      // l'enseignant cocher une case qui n'existe pas.
      if (a.reglages.tourDEssai !== undefined) {
        expect(
          TOURS_D_ESSAI,
          `${a.code} : ${a.reglages.tourDEssai} tours d'essai, que la création ne propose pas`,
        ).toContain(a.reglages.tourDEssai);
      }
    }
  });

  it("une séance d'essai se déclare dans les réglages, vient avant tout tour réel et ne compte pas", () => {
    // Le tour d'essai (config/tour-d-essai) se joue dans la partie, puis tout
    // repart de zéro. Une fiche qui le fait jouer doit le demander à la
    // création, sans quoi la première séance attendrait un essai que la partie
    // n'a pas ; et une fiche qui le demande sans séance pour le jouer
    // laisserait l'essai se jouer hors de tout déroulé. L'essai précède la
    // vraie partie : une séance d'essai après un tour réel est impossible, et
    // elle ne joue aucun tour de la partie, puisque rien de ce qu'elle joue
    // ne compte.
    for (const a of ATELIERS) {
      const essais = a.seances.filter((s) => s.essai);
      if (a.reglages.tourDEssai === undefined) {
        expect(essais.map((s) => s.numero), `${a.code} : une séance d'essai sans tour d'essai demandé à la création`).toEqual([]);
        continue;
      }
      expect(essais.length, `${a.code} : un tour d'essai demandé à la création, qu'aucune séance ne joue`).toBeGreaterThan(0);
      const premierReel = a.seances.findIndex((s) => s.tourJoue !== null);
      for (const s of essais) {
        expect(s.tourJoue, `${a.code}/séance ${s.numero} : l'essai ne joue aucun tour de la partie`).toBeNull();
        expect(
          a.seances.indexOf(s),
          `${a.code}/séance ${s.numero} : l'essai vient après un tour réel`,
        ).toBeLessThan(premierReel);
      }
    }
  });

  it("un atelier joué en concours annonce ce que le concours impose", () => {
    // Un championnat ne se règle pas comme une partie de classe. Le produit y
    // impose le secteur par défaut, applique le préréglage de repli faute de
    // niveau transmis, joue tous les tours du scénario et ne crée aucun
    // concurrent simulé. Une fiche qui annoncerait autre chose enverrait
    // l'organisateur régler ce qui ne se règle pas, et il ne s'en apercevrait
    // qu'une fois son concours créé, devant les classes réunies.
    for (const a of ATELIERS.filter((x) => x.reglages.concours)) {
      expect(a.reglages.scenarioCode, `${a.code} : le concours impose le secteur par défaut`).toBe(
        DEFAULT_SCENARIO_CODE,
      );
      expect(a.reglages.niveau, `${a.code} : le concours applique le préréglage de repli`).toBe(
        LEGACY_PRESET.level,
      );
      expect(a.reglages.niveauNom, `${a.code} : le nom du niveau imposé`).toBe(LEGACY_PRESET.name);
      expect(a.reglages.bots, `${a.code} : un concours ne crée aucun concurrent simulé`).toBe(0);
      expect(
        a.reglages.tours,
        `${a.code} : un concours joue tous les tours du scénario, sans raccourci`,
      ).toBe(scenarioByCode(a.reglages.scenarioCode).scenario.roundsCount);
      expect(
        a.reglages.mondeVariable,
        `${a.code} : un concours ne passe pas le monde variable`,
      ).toBe(false);
    }
  });

  it("un tournoi annonce le format que son tirage produira", () => {
    // Le piège : le nombre de groupes est le QUOTIENT ENTIER du nombre
    // d'équipes par la taille visée, et la finale est plafonnée. Une fiche qui
    // écrit ses groupes et ses finalistes à la main se trompe devant tout un
    // campus. Elle déclare donc les trois nombres qui se règlent, et le reste
    // se calcule du tirage réel.
    for (const a of ATELIERS.filter((x) => x.reglages.concours)) {
      const t = a.reglages.tournoi;
      expect(t, `${a.code} : une fiche de concours sans configuration de tournoi`).toBeDefined();
      expect(
        t!.equipes,
        `${a.code} : en dessous de deux équipes, le produit refuse les qualifications`,
      ).toBeGreaterThanOrEqual(LIMITES_CONCOURS.equipesMin);
      expect(t!.tailleGroupe).toBeGreaterThanOrEqual(LIMITES_CONCOURS.tailleGroupe.min);
      expect(t!.tailleGroupe).toBeLessThanOrEqual(LIMITES_CONCOURS.tailleGroupe.max);
      expect(t!.qualifiesParGroupe).toBeGreaterThanOrEqual(
        LIMITES_CONCOURS.qualifiesParGroupe.min,
      );
      expect(t!.qualifiesParGroupe).toBeLessThanOrEqual(LIMITES_CONCOURS.qualifiesParGroupe.max);
      // Le déroulé décrit une partie de qualification : le nombre d'équipes
      // qu'il annonce est celui d'un groupe RÉEL, pas la taille visée.
      const format = formatDuTournoi(t!);
      expect(
        a.reglages.equipes,
        `${a.code} : ${a.reglages.equipes} équipes annoncées pour des groupes de ${format.equipesParGroupe.join(", ")}`,
      ).toBe(Math.max(...format.equipesParGroupe));
      expect(
        format.finalistes,
        `${a.code} : une finale doit réunir au moins deux équipes`,
      ).toBeGreaterThanOrEqual(2);
    }
  });

  it("une séance ne peut pas porter sur des décisions que le niveau ne donne pas", () => {
    // Une séance de plan de trésorerie suppose que la banque existe, une séance
    // de recrutement que le personnel soit ouvert, une séance d'investissement
    // que l'investissement le soit. Annoncer l'une sans l'autre enverrait
    // l'enseignant chercher devant sa classe un panneau qui n'existe pas.
    // Depuis octobre 2026, la trésorerie se pilote au niveau 3 par le poste
    // clients (escompte, affacturage, découvert) ; l'emprunt, la banque qui
    // prête et l'assurance viennent au niveau 4.
    const EXIGENCES = [
      { mots: /emprunt|financement|\bbanque\b|apport des associés/i, leviers: ["finance"] as const },
      { mots: /trésorerie|créances|poste clients|escompte|affacturage/i, leviers: ["creances", "finance"] as const },
      { mots: /recrut|embauch|personnel|effectif/i, leviers: ["hr"] as const },
      { mots: /investir|investissement/i, leviers: ["investment"] as const },
      { mots: /assurance|assurer contre/i, leviers: ["insurance"] as const },
      { mots: /placement|excédents? de trésorerie/i, leviers: ["placement"] as const },
    ];
    for (const a of ATELIERS) {
      // Un atelier de concours joue le préréglage de repli, pas le niveau nommé.
      const preset = a.reglages.concours
        ? LEGACY_PRESET
        : DIFFICULTY_PRESETS.find((p) => p.level === a.reglages.niveau)!;
      for (const s of a.seances) {
        const dit = `${s.titre} ${s.objectif}`;
        for (const { mots, leviers } of EXIGENCES) {
          if (!mots.test(dit)) continue;
          expect(
            leviers.some((l) => preset.decisions[l]),
            `${a.code}/séance ${s.numero} : porte sur « ${leviers.join(" ou ")} » au niveau ${preset.level}, qui ne l'ouvre pas`,
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
    // heures entières, ce qui convient aux créneaux de deux heures d'une
    // section de technicien et à rien d'autre : un lycée travaille par
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

  it("l'évaluation finale compte les livrables intermédiaires juste", () => {
    // Quatre fiches annonçaient « cinq livrables intermédiaires » pour quatre
    // séances jouées, puis comptaient le livrable de la dernière séance une
    // seconde fois à la ligne suivante : la note s'annonçait sur des
    // documents qui n'existaient pas. Le nombre écrit est le nombre de
    // séances qui jouent un tour, et rien d'autre.
    const NOMBRES: Record<string, number> = {
      deux: 2, trois: 3, quatre: 4, cinq: 5, six: 6, sept: 7, huit: 8,
    };
    for (const a of ATELIERS) {
      const joues = a.seances.filter((s) => s.tourJoue !== null).length;
      for (const ligne of a.evaluationFinale) {
        const m = ligne.match(/^Les (\w+) (?:livrables|notes|dossiers) intermédiaires/i);
        if (!m) continue;
        expect(
          NOMBRES[m[1]!.toLowerCase()],
          `${a.code} : « ${ligne} » pour ${joues} séances jouées`,
        ).toBe(joues);
      }
    }
  });

  it("aucune fiche ne promet ce que le produit ne fait pas", () => {
    // Trois promesses ont vécu dans les fiches sans qu'aucun réglage ne les
    // tienne. « La partie reste ouverte, les tours suivants se jouent en
    // prolongement » : le nombre de tours se fixe à la création et rien ne le
    // prolonge. « Sans aléa » : le monde variable ne coupe que la texture des
    // paramètres, les événements restent tirés à tous les niveaux. « Descendez
    // d'un niveau puis remontez » : le niveau ne change plus une fois la partie
    // créée. Une fiche qui les écrit envoie l'enseignant chercher un bouton qui
    // n'existe pas.
    const INTERDITS: { motif: RegExp; raison: string }[] = [
      { motif: /se jouent en prolongement/i, raison: "une partie ne se prolonge pas au delà de ses tours" },
      { motif: /partie reste ouverte\s*:/i, raison: "une partie ne se prolonge pas au delà de ses tours" },
      { motif: /sans aléa/i, raison: "le monde variable ne coupe pas les événements" },
      { motif: /remontez pour/i, raison: "le niveau ne change pas en cours de partie" },
    ];
    for (const a of ATELIERS) {
      const prose = [
        a.pitch, a.resume, a.pourquoi, a.reglages.notes,
        ...a.seances.flatMap((s) => [s.objectif, s.preparation, s.livrable, ...s.deroule.map((p) => p.detail)]),
        ...a.formats.flatMap((f) => [f.quand, f.comment]),
        ...a.evaluationFinale, ...a.prolongements,
        ...a.faq.flatMap((f) => [f.question, f.reponse]),
      ].join("\n");
      for (const { motif, raison } of INTERDITS) {
        expect(prose, `${a.code} : ${raison} (« ${prose.match(motif)?.[0] ?? ""} »)`).not.toMatch(motif);
      }
    }
  });

  it("chaque fiche lit l'exigence sur la même échelle", () => {
    // Le même chiffre portait des mots différents d'une fiche à l'autre : 1
    // était « Initiation » ici et « Découverte » là, 3 « Approfondissement »
    // ou « Pilotage ». Un enseignant qui compare deux fiches doit lire une
    // seule échelle.
    for (const a of ATELIERS) {
      expect(a.difficulteLabel, `${a.code} : exigence ${a.difficulte}`).toBe(DIFFICULTES[a.difficulte]);
    }
  });

  it("chaque trace est un acte, pas deux", () => {
    // Un passeport professionnel attend une ligne par acte : « J'ai calculé un
    // seuil ». Une trace « J'ai fait ceci, et j'ai fait cela » se coche à
    // moitié et ne se retrouve dans aucune compétence. Le complément reste
    // libre (« en pesant… », « puis analysé… ») ; un second « j'ai » non.
    for (const a of ATELIERS) {
      for (const s of a.seances) {
        expect(s.tracePasseport, `${a.code}/séance ${s.numero} : « ${s.tracePasseport} »`).not.toMatch(
          /(, | et )j['’](ai|en ai)\b|, je m['’]en\b/,
        );
      }
    }
  });

  it("chaque séance mobilise au moins une notion qui a sa fiche", () => {
    // Les notions s'affichaient en texte mort : l'élève qui butait sur l'une
    // d'elles n'avait aucune porte à pousser. Le lien se fait par le sens
    // (config/ateliers/notions) ; une séance dont aucune notion n'est couverte
    // est une séance que le site n'aide pas à préparer.
    for (const a of ATELIERS) {
      for (const s of a.seances) {
        const liees = s.notions.filter((n) => ficheDeNotion(n) !== null);
        expect(liees.length, `${a.code}/séance ${s.numero} : ${s.notions.join(", ")}`).toBeGreaterThan(0);
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
    for (const chemin of ["src/app/animations/page.tsx", "src/app/animations/[code]/page.tsx"]) {
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
    const fiche = readFileSync("src/app/animations/[code]/page.tsx", "utf-8");
    expect(fiche, "la fiche n'ouvre pas la nature de l'atelier").toContain("atelier.nature");
    expect(fiche, "la fiche n'ouvre pas le document de la trace").toContain("atelier.traceLabel");
  });

  it("le résumé des thèmes ne répète pas deux fois le même", () => {
    // La ligne « À retenir » ne montre que le premier segment de chaque
    // intitulé. Deux séances qui mobilisent le même thème l'écrivaient deux
    // fois, et une fiche dont les intitulés commencent tous par le niveau
    // affichait « Première, Première, Première ».
    const fiche = readFileSync("src/app/animations/[code]/page.tsx", "utf-8");
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

  it("les pages d'atelier n'écrivent aucun mot de référentiel ni aucun sigle en dur", () => {
    // Sans cette garde, une page peut retomber sur « processus » pour tous les
    // diplômes sans qu'aucune donnée ne change : le défaut d'origine.
    //
    // LE PÉRIMÈTRE S'EST ÉLARGI AUX SIGLES. La liste des ateliers écrivait
    // « processus en BTS CG, blocs de compétences en MCO, NDRC et GPME » dans
    // une phrase : un diplôme ajouté au registre, et la phrase mentait. Depuis
    // que les entreprises disent les formations qu'elles servent, quatre pages
    // nomment des formations, et chacune doit les lire dans le registre. On
    // cherche donc le sigle et le nom entier de chaque formation dans le code
    // seul, commentaires retirés, puisqu'un commentaire cite forcément ce
    // qu'il interdit.
    const PAGES = [
      "src/app/animations/page.tsx",
      "src/app/animations/[code]/page.tsx",
      "src/app/jouer/page.tsx",
      "src/app/parcours/page.tsx",
      "src/components/quick-config-form.tsx",
    ];
    for (const chemin of PAGES) {
      const source = readFileSync(chemin, "utf-8")
        .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
        .replace(/\/\*[\s\S]*?\*\//g, "")
        .replace(/^\s*\/\/.*$/gm, "");
      expect(source, `${chemin} écrit « Processus mobilisés » en dur`).not.toMatch(
        /Processus mobilisés/i,
      );
      for (const f of FORMATIONS) {
        expect(source, `${chemin} écrit le sigle « ${f.sigle} » en dur`).not.toContain(f.sigle);
        expect(source, `${chemin} écrit « ${f.nom} » en dur`).not.toContain(f.nom);
      }
    }
    const fiche = readFileSync("src/app/animations/[code]/page.tsx", "utf-8");
    expect(fiche, "la fiche n'ouvre pas le mot du référentiel").toContain(
      "atelier.referentielLabel",
    );
  });

  it("chaque séance laisse au tour joué au moins ce que le modèle de durée estime", () => {
    // Un déroulé promet un tour par séance et lui donne une phase sur six. Le
    // modèle de durée (config/duree-du-tour) sait ce que ce tour demande à une
    // équipe de cet atelier : le texte à lire, les champs que le niveau ouvre,
    // la situation du tour, la prise en main au premier. Deux séances donnaient
    // vingt minutes à un tour estimé à dix-neuf et vingt : juste, mais sans
    // rien pour la discussion à trois autour de l'écran.
    //
    // LA TOLÉRANCE EST NULLE, ET C'EST VOULU. Le modèle est déjà un plancher :
    // il ne compte ni les aides du formulaire ni le courrier du tour, et sa
    // lecture est lente à dessein. Une phase qui donne moins que ce plancher
    // est un déroulé faux, pas un déroulé serré. La marge conseillée d'un
    // quart (MARGE_CONSEILLEE) n'est pas exigée ici : elle est un objectif
    // d'écriture, que l'audit d'octobre 2026 a atteint sur les soixante et
    // onze séances jouées, et que la fiche montre à l'enseignant en écrivant
    // les deux chiffres. Un texte de situation qui s'allonge demain fera
    // rougir cette garde avant la classe, et c'est son rôle.
    expect(MARGE_CONSEILLEE).toBeGreaterThan(1);
    for (const a of ATELIERS) {
      for (const c of chargeDesSeances(a)) {
        expect(
          c.minutesDeJeu,
          `${a.code}/séance ${c.seance.numero} : aucune phase ne joue le tour ${c.seance.tourJoue}`,
        ).toBeGreaterThan(0);
        expect(
          c.verdict,
          `${a.code}/séance ${c.seance.numero} : le tour demande ≈ ${c.estimation.minutes} min, le déroulé lui en donne ${c.minutesDeJeu}`,
        ).not.toBe("impossible");
      }
    }
  });

  it("le niveau de jeu suit la formation et l'année", () => {
    // Le niveau d'une fiche se lisait seul, sans règle. Celle-ci est celle de
    // l'audit d'octobre 2026 : le lycée découvre (1), une première année de
    // section de technicien gère ou pilote (2 à 3), une seconde année et le BUT
    // pilotent ou arbitrent (3 à 4), le DCG arbitre ou fait de la stratégie
    // (4 à 5), l'approfondissement transversal fait de la stratégie (5). Un
    // concours impose son niveau, une découverte sans formation choisit le
    // sien.
    const attendu = (a: (typeof ATELIERS)[number]): number[] | null => {
      if (a.reglages.concours) return null;
      if (a.formations.length === 0) return /avancé/i.test(a.annee) ? [5] : null;
      // Le lycée découvre, en seconde comme en STMG.
      if (a.formations.every((f) => f === "stmg" || f.startsWith("seconde-"))) return [1];
      if (a.formations.includes("dcg")) return [4, 5];
      if (a.formations.some((f) => f.startsWith("but-"))) return [3, 4];
      if (/première/i.test(a.annee)) return [2, 3];
      return [3, 4];
    };
    for (const a of ATELIERS) {
      const niveaux = attendu(a);
      if (!niveaux) continue;
      expect(
        niveaux,
        `${a.code} (${a.formations.join(", ")}, ${a.annee}) : niveau ${a.reglages.niveau}`,
      ).toContain(a.reglages.niveau);
    }
  });

  it("une fiche au mois suit le calendrier de sa partie", () => {
    // Une partie au mois suit le calendrier (`config/scenarios/calendrier-mensuel.ts`) :
    // elle commence au mois de départ de la fiche, et ce que le scénario écrit pour un
    // trimestre s'ouvre au premier mois de ce trimestre. L'atelier MCO était écrit sur
    // l'ancien découpage, où chaque mois relisait la saison d'un trimestre entier et
    // ouvrait sa situation : ses mois et ses situations sont devenus faux sans que rien
    // ne le signale. Le titre d'une séance qui nomme un mois nomme celui que la partie
    // joue ; une séance qui annonce la situation du mois, ou son absence, dit ce que la
    // partie ouvrira à ce tour.
    for (const a of ATELIERS) {
      if (a.reglages.periodicite !== "month") continue;
      const depart = a.reglages.moisDeDepart ?? 1;
      const def = scenarioByCode(a.reglages.scenarioCode);
      for (const s of a.seances) {
        if (s.tourJoue === null) continue;
        const contexte = `${a.code}/séance ${s.numero} (tour ${s.tourJoue})`;
        const nomme = NOMS_DES_MOIS.find((m) => s.titre.toLowerCase().startsWith(m));
        if (nomme) expect(nomme, `${contexte} : « ${s.titre} »`).toBe(nomDuMois(s.tourJoue, depart));
        const ouvertes = def.situations
          .filter((x) => tourDOuverture(x.trigger, a.reglages.tours, def.scenario.roundsCount, depart) === s.tourJoue)
          .map((x) => x.code);
        if (/aucune situation ne s'ouvre à date fixe/i.test(s.preparation)) {
          expect(ouvertes, `${contexte} : annonce un mois sans situation`).toEqual([]);
        }
        if (/l'arène ouvre ce mois-ci la situation/i.test(s.preparation)) {
          expect(ouvertes.length, `${contexte} : annonce une situation que la partie n'ouvre pas`).toBeGreaterThan(0);
        }
      }
    }
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
