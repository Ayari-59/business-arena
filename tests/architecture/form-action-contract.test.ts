import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Contrat entre un formulaire et son action serveur.
 *
 * Ce test existe à cause d'une panne réelle. Un commit a remplacé tout le
 * formulaire de création de partie par un seul composant, et six champs ont
 * disparu sans bruit : équipes, bots, périodicité, niveau, monde variable, et
 * la case des QCM. L'action serveur, elle, continuait de les lire. Comme le
 * schéma zod donne une valeur de repli à chacun, RIEN n'a échoué : toutes les
 * parties de classe ont simplement été créées avec les QCM désactivés, pendant
 * que 296 tests restaient au vert.
 *
 * Aucun test unitaire ne pouvait le voir : le formulaire était correct de son
 * côté, l'action aussi. C'est leur ACCORD qui avait rompu. On le vérifie donc
 * ici, sur la source : tout champ lu par l'action doit exister dans le
 * formulaire, et réciproquement.
 *
 * Volontairement statique, sans rendu ni navigateur : un test qui lit le code
 * n'attrape pas tout, mais il attrape exactement cette faute-là, et il coûte
 * quelques millisecondes.
 */

interface FormContract {
  nom: string;
  /** Fichier de l'action serveur et nom de la fonction exportée. */
  action: { file: string; fn: string };
  /** Les fichiers qui composent le formulaire, composants inclus. */
  sources: string[];
  /**
   * Champs lus par l'action mais fournis autrement que par un `name=` littéral
   * (bouton de soumission nommé, champ caché construit ailleurs…).
   */
  tolerated?: string[];
  /**
   * Modules de LECTURE PARTAGÉE que l'action délègue : leurs `formData.get`
   * comptent comme les siens.
   *
   * La feuille de décision est lue par la même fonction côté serveur et côté
   * navigateur (`config/decisions-saisies`), pour que l'encart « Résultat
   * estimé » et le moteur ne puissent pas lire deux choses différentes. Sans
   * cette ligne, sortir la lecture du corps de l'action aurait VIDÉ ce
   * contrat : l'action ne lisant plus rien en propre, aucun champ n'aurait
   * plus été vérifié, et la panne d'août serait redevenue possible.
   */
  lecteurs?: string[];
}

const CONTRACTS: FormContract[] = [
  {
    nom: "demande de simulation (/orientation)",
    action: { file: "src/app/orientation/actions.ts", fn: "envoyerDemandeOrientationAction" },
    sources: ["src/components/orientation-form.tsx"],
  },
  {
    nom: "rendez-vous téléphonique (/rendez-vous)",
    action: { file: "src/app/rendez-vous/actions.ts", fn: "reserverRendezVousAction" },
    sources: ["src/components/rendez-vous-form.tsx"],
  },
  {
    nom: "création d'une partie de classe",
    action: { file: "src/app/teacher/actions.ts", fn: "createClassGameAction" },
    sources: ["src/app/teacher/page.tsx", "src/components/economic-params.tsx"],
  },
  {
    nom: "création d'un concours",
    action: { file: "src/app/teacher/actions.ts", fn: "createCompetitionAction" },
    sources: ["src/components/competition-create-form.tsx"],
  },
  {
    nom: "décisions du tour",
    action: { file: "src/app/arena/[gameId]/actions.ts", fn: "playRoundAction" },
    sources: [
      "src/components/decision-form.tsx",
      "src/components/resultat-estime.tsx",
    ],
    lecteurs: ["src/config/decisions-saisies.ts", "src/config/ventes-estimees.ts"],
    // LE PLAN DE TRÉSORERIE N'EST PLUS DEMANDÉ PAR L'ARÈNE (voir
    // forecast-field.test.ts) : la lecture partagée sait encore l'accueillir,
    // pour un écran d'atelier qui le rouvrirait, mais la feuille de décision
    // ne pose pas ces deux champs — et c'est l'ESTIMATION qui donnerait alors
    // les ventes annoncées, jamais une seconde saisie.
    tolerated: ["expectedUnits", "expectedCash"],
  },
  {
    nom: "réglage des questions en cours de partie",
    action: { file: "src/app/teacher/actions.ts", fn: "setQuizModeAction" },
    sources: ["src/app/teacher/games/[gameId]/page.tsx"],
  },
  {
    nom: "distribution d'un courrier",
    action: { file: "src/app/teacher/actions.ts", fn: "distribuerCourrierAction" },
    sources: ["src/components/distribution-courrier.tsx"],
  },
  {
    nom: "affectation d'un élève à une équipe (enseignant)",
    action: { file: "src/app/teacher/actions.ts", fn: "affecterEleveAction" },
    sources: ["src/components/composition-equipes.tsx"],
  },
  {
    nom: "changement d'équipe (élève)",
    action: { file: "src/app/arena/[gameId]/actions.ts", fn: "choisirMonEquipeAction" },
    sources: ["src/components/choix-equipe.tsx"],
  },
  {
    nom: "lancement d'une partie publique",
    action: { file: "src/app/actions.ts", fn: "startGameAction" },
    // Les champs vivent dans le composant client de config rapide, qui les
    // envoie via des <input type="hidden"> ; la page /jouer ne fait que l'accueillir.
    sources: ["src/app/jouer/page.tsx", "src/components/quick-config-form.tsx"],
  },
];

/** Corps d'une fonction exportée : jusqu'à la prochaine déclaration exportée. */
function actionBody(file: string, fn: string): string {
  const source = readFileSync(file, "utf8");
  const start = source.indexOf(`export async function ${fn}`);
  if (start === -1) throw new Error(`${fn} introuvable dans ${file}`);
  const next = source.indexOf("\nexport ", start + 1);
  return source.slice(start, next === -1 ? undefined : next);
}

/**
 * Champs lus : `formData.get("x")` / `.has("x")`, et le même accès passé par un
 * petit lecteur nommé — `nombre(formData, "newLoan")`, `montant(data, "hire")`.
 * Une lecture partagée range ses champs ainsi ; les ignorer rendrait le contrat
 * aveugle à tout ce qu'elle lit.
 */
function fieldsRead(body: string): Set<string> {
  const noms = new Set<string>();
  for (const m of body.matchAll(/\b(?:formData|data)\.(?:get|has)\(\s*"([^"]+)"\s*\)/g)) {
    noms.add(m[1]!);
  }
  for (const m of body.matchAll(/\(\s*(?:formData|data)\s*,\s*"([^"]+)"\s*\)/g)) {
    noms.add(m[1]!);
  }
  return noms;
}

/** Champs offerts par le formulaire : attributs name= littéraux. */
function fieldsOffered(sources: string[]): Set<string> {
  const names = new Set<string>();
  for (const file of sources) {
    const source = readFileSync(file, "utf8");
    for (const m of source.matchAll(/\bname=(?:"([^"]+)"|\{"([^"]+)"\})/g)) {
      names.add((m[1] ?? m[2])!);
    }
    // Champs engendrés par une boucle sur une liste de définitions :
    // { name: "taxRate", label: … } dans le panneau économique.
    for (const m of source.matchAll(/\{\s*name:\s*"([^"]+)"/g)) names.add(m[1]!);
    // Champs dont le NOM est construit par un helper partagé : une décision par
    // référence (`product.<code>.price`) et les ventes estimées
    // (`ventesEstimees.<code>`). Le préfixe suffit : le lecteur ne lit pas ces
    // champs un à un, il balaie le préfixe.
    for (const m of source.matchAll(/\b(productFieldName|champDesVentesEstimees)\s*\(/g)) {
      names.add(m[1] === "productFieldName" ? "product." : "ventesEstimees.");
    }
  }
  return names;
}

describe("accord entre les formulaires et leurs actions serveur", () => {
  for (const contract of CONTRACTS) {
    it(`${contract.nom} : l'action ne lit aucun champ absent du formulaire`, () => {
      const read = fieldsRead(
        [
          actionBody(contract.action.file, contract.action.fn),
          ...(contract.lecteurs ?? []).map((f) => readFileSync(f, "utf8")),
        ].join("\n"),
      );
      const offered = fieldsOffered(contract.sources);
      const tolerated = new Set(contract.tolerated ?? []);

      expect(read.size, `${contract.action.fn} ne lit aucun champ`).toBeGreaterThan(0);

      const manquants = [...read].filter((f) => !offered.has(f) && !tolerated.has(f));
      expect(
        manquants,
        `${contract.nom} : l'action lit ${manquants.join(", ")}, que le formulaire n'envoie pas. ` +
          `Le schéma zod le remplacera silencieusement par sa valeur de repli.`,
      ).toEqual([]);
    });
  }

  it("le formulaire de création envoie bien les six champs perdus en août", () => {
    // Garde nommée sur la régression elle-même : ces six-là sont revenus, et
    // un test générique ne dirait pas lesquels manquent si cela recommençait.
    const offered = fieldsOffered([
      "src/app/teacher/page.tsx",
      "src/components/economic-params.tsx",
    ]);
    for (const champ of [
      "humanTeamsCount",
      "botCount",
      "periodicity",
      "level",
      "variableWorld",
      "quizMode",
    ]) {
      expect(offered.has(champ), `champ « ${champ} » absent du formulaire enseignant`).toBe(true);
    }
  });
});
