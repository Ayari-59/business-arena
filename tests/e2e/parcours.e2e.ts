import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { Browser, Page } from "playwright-core";
import { aller, ouvrirNavigateur, texte, unique } from "./helpers/browser";
import { ATELIERS, dureeTotaleHeures } from "../../src/config/ateliers";

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

  it("l'analyse des coûts nomme ce que le métier achète", async () => {
    // Le moteur ne connaît qu'un coût d'achat par unité vendue, et l'interface
    // l'appelait « matières premières » dans les neuf secteurs. Un cabinet de
    // conseil n'achète pas de matières : il paie des frais de mission.
    await aller(eleve, new URL(eleve.url()).pathname);
    await eleve.evaluate(() => {
      // les comptes sont dépliables : leur contenu ne compte pas dans le texte
      // visible tant qu'ils sont fermés.
      document.querySelectorAll("details").forEach((d) => d.setAttribute("open", ""));
    });
    const vu = (await texte(eleve)).toLowerCase();
    expect(vu).toContain("frais de mission");
    expect(vu, "l'étiquette figée est revenue").not.toContain("matières premières");
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

  it("le niveau 6 ouvre l'affectation du résultat, et le dit à l'élève", async () => {
    // Le sixième niveau se contentait de retirer les indices. Il porte
    // maintenant une décision à lui, et ce qui compte est qu'elle ARRIVE
    // jusqu'à l'écran : un champ ouvert côté service mais absent du formulaire
    // n'existe pas.
    await aller(prof, "/teacher");
    await prof.selectOption('select[name="scenarioCode"]', "nova");
    await prof.selectOption('select[name="humanTeamsCount"]', "1");
    await prof.selectOption('select[name="botCount"]', "1");
    await prof.selectOption('select[name="level"]', "6");
    await prof.getByRole("button", { name: /Créer la partie/ }).click();
    await prof.waitForURL(/\/teacher\/games\//, { timeout: 30_000 });
    expect(await texte(prof)).toContain("Niveau 6");
    const code = (await prof.locator("h1 span.font-mono").innerText()).trim();

    const executive = await (await navigateur.newContext()).newPage();
    await aller(executive, "/join");
    await executive.fill('input[name="code"]', code);
    await executive.fill('input[name="pseudo"]', "Élève Executive");
    await executive.getByRole("button", { name: "Rejoindre la partie" }).click();
    await executive.waitForSelector('input[name="dividend"]', { timeout: 30_000 });

    const vu = await texte(executive);
    // sans tenir compte de la casse : les libellés de champ sont mis en
    // capitales par la feuille de style
    expect(vu).toMatch(/dividende versé aux associés/i);
    // au premier tour il n'y a rien à distribuer, et la page l'explique
    expect(vu).toContain("Rien à distribuer");
    // et aucun indice à ce niveau
    expect(vu).not.toMatch(/Débloquer l'indice/);
  });

  it("une licence expirée ferme la création, et l'enseignant lit pourquoi", async () => {
    // Le seul chemin qui compte pour ce modèle économique : le refus doit
    // arriver A L'ECRAN. Le service peut avoir raison, l'action peut lever
    // proprement, si la page reste muette l'enseignant conclut que le produit
    // est cassé. On pose donc une licence échue directement en base, comme le
    // ferait le temps qui passe, et on regarde la page.
    const { Client } = await import("pg");
    // Pas de repli silencieux : un test qui se contente de passer quand il n'a
    // pas de base ne garde rien du tout.
    expect(
      process.env.DATABASE_URL,
      "DATABASE_URL manquante : ce test écrit une licence échue en base",
    ).toBeTruthy();
    const base = new Client({ connectionString: process.env.DATABASE_URL });
    await base.connect();
    try {
      const { rows } = await base.query(
        `select m.organization_id as org from organization_members m
           join users u on u.id = m.user_id
          where u.email = $1 limit 1`,
        [EMAIL],
      );
      expect(rows.length, "établissement de l'enseignant introuvable").toBe(1);
      await base.query(
        `insert into org_licences (organization_id, label, starts_at, ends_at)
         values ($1, 'Licence échue', now() - interval '400 days', now() - interval '5 days')`,
        [rows[0].org],
      );

      await aller(prof, "/teacher");
      await prof.selectOption('select[name="scenarioCode"]', "nova");
      await prof.getByRole("button", { name: /Créer la partie/ }).click();
      // On attend le BANDEAU, pas l'URL : la page était déjà /teacher avant le
      // clic, si bien qu'attendre cette adresse revenait à ne rien attendre du
      // tout et à lire la page avant sa mise à jour.
      await prof.waitForSelector("text=/La partie n'a pas été créée/", { timeout: 30_000 });

      const vu = await texte(prof);
      expect(vu).toContain("La partie n'a pas été créée");
      expect(vu).toContain("Licence échue");
      expect(vu).toContain("expiré");
    } finally {
      await base.end();
    }
  });

  it("la vitrine présente les sept entreprises, et son bouton choisit le métier", async () => {
    // Une page vitrine se vérifie dans un navigateur ou pas du tout : elle
    // n'est faite que de rendu et de liens. Et son bouton doit VRAIMENT
    // amener sur le formulaire avec le bon secteur : c'est la jointure, donc
    // l'endroit où ça casse.
    // L'accueil porte les mêmes sept entreprises en vignettes, et chaque
    // vignette mène à sa fiche. C'est la jointure entre les deux pages.
    await aller(prof, "/");
    const accueil = await texte(prof);
    for (const nom of ["NOVA", "MAILLE & CO", "L'ESCALE", "VOLT FITNESS"]) {
      expect(accueil, `${nom} absente des vignettes de l'accueil`).toContain(nom);
    }
    await prof.locator('a[href="/entreprises#bistrot"]').first().click();
    await prof.waitForURL(/\/entreprises#bistrot$/, { timeout: 30_000 });

    await aller(prof, "/entreprises");
    const vitrine = await texte(prof);
    for (const nom of [
      "NOVA",
      "MAILLE & CO",
      "L'ESCALE",
      "LA TABLE D'AUGUSTIN",
      "ATLAS CONSEIL",
      "PIXEL & CO",
      "VOLT FITNESS",
    ]) {
      expect(vitrine, `${nom} absente de la vitrine`).toContain(nom);
    }
    // le tableau comparatif oppose bien le périssable au stockable
    expect(vitrine).toContain("rien ne se stocke");
    expect(vitrine).toContain("déjà payé");

    await prof.getByRole("link", { name: "Diriger LA TABLE D'AUGUSTIN" }).click();
    await prof.waitForURL(/secteur=bistrot/, { timeout: 30_000 });
    expect(await prof.locator('select[name="scenarioCode"]').inputValue()).toBe("bistrot");
  });

  it("l'atelier professionnel s'affiche en entier et tient ses comptes", async () => {
    // Une fiche d'atelier est un contrat de temps. Les totaux affichés sont
    // calculés à partir du déroulé : ce test vérifie qu'ils arrivent bien
    // jusqu'à la page, et que les six séances y sont toutes.
    await aller(prof, "/ateliers");
    expect(await texte(prof)).toContain("BTS Comptabilité et Gestion");

    await prof.getByRole("link", { name: "Voir le déroulé →" }).first().click();
    await prof.waitForURL(/\/ateliers\/cg1$/, { timeout: 30_000 });
    // Comparaison insensible à la casse : plusieurs intitulés sont mis en
    // CAPITALES par le CSS, si bien que le texte visible ne correspond pas à
    // celui du code. Le piège avait déjà coûté un faux échec sur « Note ».
    const fiche = (await texte(prof)).toLowerCase();
    // Le volume et le format viennent du registre : les écrire ici les figerait,
    // et c'est exactement ce qui a rendu ce test rouge le jour où les séances
    // sont passées de quatre heures à trois.
    const cg1 = ATELIERS.find((a) => a.code === "cg1")!;
    for (const attendu of [
      "séance 1",
      `${dureeTotaleHeures(cg1)} heures`,
      cg1.format.toLowerCase(),
      "trace pour le passeport professionnel",
      "livrables attendus",
      "questions d'enseignants",
    ]) {
      expect(fiche, `« ${attendu} » absent de la fiche`).toContain(attendu);
    }
    // toutes les séances de l'atelier, pas une de moins
    expect((fiche.match(/livrable de la séance/g) ?? []).length).toBe(cg1.seances.length);
  });

  it("aucune page du parcours ne porte de tiret en milieu de phrase", async () => {
    // Contrainte de style tenue depuis le début, et qu'aucun test ne gardait.
    // Le tiret SEUL dans une case de tableau reste permis : il vaut « rien à
    // afficher », ce n'est pas une incise. On ne cherche donc que le tiret
    // encadré de mots, c'est à dire celui qui coupe une phrase.
    const inciseur = /[\wÀ-ÿ][ ]*[—–][ ]*[\wÀ-ÿ]/;
    for (const chemin of [
      "/",
      "/entreprises",
      "/ateliers",
      "/ateliers/cg1",
      "/guide",
      "/parcours",
      "/concepts",
      "/teacher/usage",
    ]) {
      await aller(prof, chemin);
      const vu = await texte(prof);
      const faute = vu.match(new RegExp(`.{0,40}${inciseur.source}.{0,40}`));
      expect(faute?.[0], `${chemin} coupe une phrase par un tiret`).toBeUndefined();
    }
  });
});
