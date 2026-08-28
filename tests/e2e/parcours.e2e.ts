import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { aller, ouvrirNavigateur, texte, unique } from "./helpers/browser";

/**
 * Le parcours complet, dans un vrai navigateur, sur une vraie base.
 *
 * Un enseignant crée un compte, crée une partie de classe, un élève la rejoint
 * avec le code, joue son tour, l'enseignant clôture, et le carnet d'usage se
 * remplit. C'est la jointure où vivaient les douze écarts des deux recettes :
 * chaque pièce était juste, leur rencontre ne l'était pas.
 *
 * Le parcours passe volontairement par le secteur du conseil et non par NOVA.
 * Deux fautes graves de cette semaine ne se voyaient que là : un plafond de
 * prix à 500 € qui refusait la journée à 780 €, et des décisions par défaut
 * figées sur un fabricant d'enceintes. Un parcours qui ne jouerait que le
 * scénario historique serait aveugle aux six autres.
 */

let navigateur: Browser;
let prof: Page;
let eleve: Page;
let codeInvitation = "";
let urlPartie = "";

const EMAIL = unique("prof");
const MOTDEPASSE = "motdepasse-e2e!";

beforeAll(async () => {
  navigateur = await ouvrirNavigateur();
  prof = await navigateur.newPage();
  // l'élève est un autre contexte : deux sessions, comme en classe
  eleve = await (await navigateur.newContext()).newPage();
});

afterAll(async () => {
  await navigateur?.close();
});

describe("parcours enseignant et élève", () => {
  it("un enseignant crée son compte et arrive sur ses parties", async () => {
    await aller(prof, "/teacher/login");
    await prof.getByRole("button", { name: "Créer un compte" }).click();
    // Les champs sont désignés par leur `name` et non par leur libellé : le
    // parcours vérifie le fonctionnement, la formulation est gardée ailleurs.
    await prof.fill('input[name="displayName"]', "Mme E2E");
    await prof.fill('input[name="schoolName"]', "Lycée du Parcours");
    await prof.fill('input[name="email"]', EMAIL);
    await prof.fill('input[name="password"]', MOTDEPASSE);
    await prof.getByRole("button", { name: "Créer mon compte enseignant" }).click();

    await prof.waitForURL(/\/teacher$/, { timeout: 30_000 });
    expect(await texte(prof)).toContain("Mes parties");
  });

  it("il crée une partie de conseil, et la page de pilotage dit ses réglages", async () => {
    await prof.selectOption('select[name="scenarioCode"]', "conseil");
    await prof.selectOption('select[name="humanTeamsCount"]', "1");
    await prof.selectOption('select[name="botCount"]', "1");
    await prof.selectOption('select[name="level"]', "5");
    await prof.getByRole("button", { name: /Créer la partie/ }).click();

    await prof.waitForURL(/\/teacher\/games\//, { timeout: 30_000 });
    urlPartie = new URL(prof.url()).pathname;

    const vu = await texte(prof);
    // les réglages sont rappelés : le niveau n'était lisible que côté élève
    expect(vu).toContain("Niveau 5");
    expect(vu).toMatch(/Monde (figé|variable)/);

    // Le code se lit dans le DOM, pas au filtre sur le texte : l'alphabet des
    // codes est celui des majuscules, et « PARTIE » y ressemble à s'y méprendre.
    codeInvitation = (await prof.locator("h1 span.font-mono").innerText()).trim();
    expect(codeInvitation, "code d'invitation illisible").toMatch(/^[A-Z2-9]{6}$/);
  });

  it("un élève rejoint avec le code seul et voit son secteur, pas un autre", async () => {
    await aller(eleve, "/join");
    await eleve.fill('input[name="code"]', codeInvitation);
    await eleve.fill('input[name="pseudo"]', "Élève E2E");
    await eleve.getByRole("button", { name: "Rejoindre la partie" }).click();
    // On attend l'écran de décision plutôt que l'URL : la navigation se fait
    // côté client, sans nouvel événement de chargement.
    await eleve.waitForSelector('input[name="price"]', { timeout: 30_000 });
    expect(eleve.url()).toMatch(/\/arena\//);

    const vu = await texte(eleve);
    expect(vu).toContain("jour");
    // le vocabulaire du métier, et non celui de l'atelier historique
    expect(vu).not.toContain("enceinte");

    // le point de départ vient du secteur : la journée de conseil, pas 59 €
    const prix = await eleve.inputValue('input[name="price"]');
    expect(Number(prix), `prix par défaut ${prix}`).toBeGreaterThan(300);
  });

  it("les écrans de décision ne parlent ni anglais ni en millièmes d'euro", async () => {
    const vu = await texte(eleve);
    // les couvertures d'assurance sont en français (écart de la 1re recette)
    expect(vu).not.toMatch(/natural disaster|cold wave|machine breakdown/i);
    // aucun montant à trois décimales (écart de la 2e recette)
    expect(vu).not.toMatch(/\d+,\d{3}\s*€/);
  });

  it("il joue son tour au tarif de son métier, que la validation accepte", async () => {
    // 780 € la journée : refusé par l'ancien plafond à 500 €
    await eleve.fill('input[name="price"]', "780");
    await eleve.getByRole("button", { name: /Valider les décisions de l'équipe/ }).click();

    // On relit la page : ce qui compte est que le serveur ait ENREGISTRÉ le
    // tour, pas que le bouton ait changé d'étiquette.
    await eleve.waitForTimeout(2_000);
    await aller(eleve, new URL(eleve.url()).pathname);
    const vu = await texte(eleve);
    expect(vu).not.toMatch(/Session expirée|Décisions invalides/i);
    expect(vu).toContain("Décisions validées");
    expect(await eleve.inputValue('input[name="price"]')).toBe("780");
  });

  it("l'enseignant clôture le tour et la partie avance", async () => {
    await aller(prof, urlPartie);
    await prof.getByRole("button", { name: /Clore le tour 1 et simuler/ }).click();
    await prof.waitForSelector("text=/Clore le tour 2 et simuler/", { timeout: 60_000 });
    expect(await texte(prof)).toContain("Trimestre 2");
  });

  it("le relevé de notes est là, et son tableur se télécharge vraiment", async () => {
    await aller(prof, urlPartie);
    const vu = await texte(prof);
    expect(vu).toContain("Relevé de notes");
    // La note et la gestion restent deux colonnes distinctes. Sans tenir
    // compte de la casse : les en-têtes sont mis en capitales par la feuille
    // de style, et c'est le texte RENDU que lit le navigateur.
    expect(vu).toMatch(/note/i);
    expect(vu).toMatch(/gestion/i);

    // On CLIQUE, comme l'enseignant : c'est le seul moyen de vérifier que la
    // session voyage avec la requête et que le fichier arrive vraiment sur le
    // disque. Un export qui répondrait bien à un appel direct mais mal à un
    // clic ne servirait à personne.
    const lien = prof.getByRole("link", { name: /Tableur/ });
    expect(await lien.count()).toBe(1);
    const [telechargement] = await Promise.all([
      prof.waitForEvent("download", { timeout: 30_000 }),
      lien.click(),
    ]);
    expect(telechargement.suggestedFilename()).toMatch(/\.csv$/);

    const flux = await telechargement.createReadStream();
    const morceaux: Buffer[] = [];
    for await (const morceau of flux) morceaux.push(morceau as Buffer);
    const contenu = Buffer.concat(morceaux).toString("utf8");
    expect(contenu).toContain("Élève;Équipe");
    expect(contenu).toContain("Élève E2E");
  });

  it("le carnet d'usage compte ce qui vient de se passer", async () => {
    await aller(prof, "/teacher/usage");
    const vu = await texte(prof);
    expect(vu).toContain("Carnet d'usage");
    expect(vu).toContain("Parties créées");
    // une équipe, une partie : les compteurs ne gonflent pas des bots
    const equipes = vu.match(/(\d+)\s*\nÉquipes/);
    expect(equipes?.[1], `tuile Équipes : ${equipes?.[0]}`).toBe("1");
    expect(vu).toContain("Situations débriefées");
  });

  it("aucune page du parcours ne porte de tiret en milieu de phrase", async () => {
    // Contrainte de style tenue depuis le début, et qu'aucun test ne gardait.
    // Le tiret SEUL dans une case de tableau reste permis : il vaut « rien à
    // afficher », ce n'est pas une incise. On ne cherche donc que le tiret
    // encadré de mots, c'est à dire celui qui coupe une phrase.
    const inciseur = /[\wÀ-ÿ][ ]*[—–][ ]*[\wÀ-ÿ]/;
    for (const chemin of ["/", "/guide", "/parcours", "/concepts", "/teacher/usage"]) {
      await aller(prof, chemin);
      const vu = await texte(prof);
      const faute = vu.match(new RegExp(`.{0,40}${inciseur.source}.{0,40}`));
      expect(faute?.[0], `${chemin} coupe une phrase par un tiret`).toBeUndefined();
    }
  });
});
