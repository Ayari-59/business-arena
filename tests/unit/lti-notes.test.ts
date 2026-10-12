import { createPublicKey, generateKeyPairSync, verify } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";

// L'inscription lit la base pour d'autres choses ; ici, seule sa configuration compte.
vi.mock("@/db", () => ({ db: {} }));
import { jwkPublic, type ClesDeLOutil } from "@/lti/cles";
import { CLAIM_AGS, PORTEES_AGS, PORTEES_DEMANDEES } from "@/lti/ags/constantes";
import {
  adresseDesColonnes,
  adresseDesNotes,
  borneLaNote,
  choisirLaColonne,
  commentaireDeLExamen,
  issueDeLEnvoi,
  lireLaRevendication,
  natureVoulueDeLaPartie,
  natureVoulueDeLExamen,
  nomDeLaPlateforme,
  porteesDuJeton,
  scoreAgs,
} from "@/lti/ags/regles";
import { assertionClientCredentials, DUREE_ASSERTION_S, jetonDeService, MARGE_S, oublierLeJeton } from "@/lti/ags/jeton";
import { phraseDeLActivite, phrasesDuRetour, type EtatDuRetour } from "@/lti/ags/textes";
import { configurationDeLOutil } from "@/lti/inscription";

/**
 * LE RETOUR DES NOTES (LTI Advantage, AGS 1.3), SANS BASE NI RÉSEAU : la forme exacte
 * d'une note, l'assertion `client_credentials`, le cache du jeton, le choix de la colonne,
 * ce qui part et quand, et ce que l'enseignant en lit.
 */

const paire = generateKeyPairSync("rsa", { modulusLength: 2048 });
const courante = jwkPublic(paire.privateKey);
const CLES: ClesDeLOutil = { privee: paire.privateKey, kid: courante.kid, publiques: [courante] };
const MAINTENANT = new Date("2026-10-12T09:30:00.123Z");

const decoder = (jwt: string) => {
  const [e, c, s] = jwt.split(".") as [string, string, string];
  return {
    entete: JSON.parse(Buffer.from(e, "base64url").toString()) as Record<string, unknown>,
    charge: JSON.parse(Buffer.from(c, "base64url").toString()) as Record<string, unknown>,
    signe: `${e}.${c}`,
    signature: Buffer.from(s, "base64url"),
  };
};

describe("la note telle qu'elle part (score AGS)", () => {
  it("une note publiée : terminée, notée, sur 100, horodatage ISO, commentaire court", () => {
    const s = scoreAgs({ sub: "sub-42", nature: "note", note: 73.46, commentaire: "Business Arena · grille Business Arena 2026 v1", maintenant: MAINTENANT });
    expect(s).toEqual({
      userId: "sub-42",
      timestamp: "2026-10-12T09:30:00.123Z",
      activityProgress: "Completed",
      gradingProgress: "FullyGraded",
      scoreGiven: 73.5,
      scoreMaximum: 100,
      comment: "Business Arena · grille Business Arena 2026 v1",
    });
    expect(s.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it("le retrait : en attente, SANS note ni maximum", () => {
    const s = scoreAgs({ sub: "s", nature: "retrait", commentaire: "x", maintenant: MAINTENANT });
    expect(s.gradingProgress).toBe("Pending");
    expect(s.activityProgress).toBe("Completed");
    expect(s).not.toHaveProperty("scoreGiven");
    expect(s).not.toHaveProperty("scoreMaximum");
  });

  it("la progression d'une partie de classe : jamais de note", () => {
    const en = scoreAgs({ sub: "s", nature: "commencee", maintenant: MAINTENANT });
    const fin = scoreAgs({ sub: "s", nature: "terminee", maintenant: MAINTENANT });
    expect(en).toMatchObject({ activityProgress: "InProgress", gradingProgress: "NotReady" });
    expect(fin).toMatchObject({ activityProgress: "Completed", gradingProgress: "NotReady" });
    for (const s of [en, fin]) {
      expect(s).not.toHaveProperty("scoreGiven");
      expect(s).not.toHaveProperty("comment");
    }
  });

  it("les bornes : 0 à 100, une décimale ; une note illisible ou absente ne part pas", () => {
    expect(borneLaNote(100.04)).toBe(100);
    expect(borneLaNote(120)).toBe(100);
    expect(borneLaNote(-3)).toBe(0);
    expect(Object.is(borneLaNote(-0.01), 0)).toBe(true);
    expect(borneLaNote(59.95)).toBe(60);
    expect(() => borneLaNote(Number.NaN)).toThrow(RangeError);
    expect(() => borneLaNote(Number.POSITIVE_INFINITY)).toThrow(RangeError);
    expect(() => scoreAgs({ sub: "s", nature: "note", note: null, maintenant: MAINTENANT })).toThrow(RangeError);
    expect(() => scoreAgs({ sub: "", nature: "terminee", maintenant: MAINTENANT })).toThrow(RangeError);
  });

  it("le commentaire nomme la grille et sa version", () => {
    expect(commentaireDeLExamen({ nom: "Business Arena 2026", version: 1 })).toBe("Business Arena · grille Business Arena 2026 v1");
    expect(commentaireDeLExamen(null)).toBe("Business Arena · grille de l'examen");
  });
});

describe("ce qui part, et quand", () => {
  it("l'examen : la note à la publication seulement, pour une copie remise ET notée", () => {
    expect(natureVoulueDeLExamen({ publie: true, remise: true, note: 64, deja: null })).toBe("note");
    expect(natureVoulueDeLExamen({ publie: false, remise: true, note: 64, deja: null })).toBeNull();
    // Une copie remise sans note : rien.
    expect(natureVoulueDeLExamen({ publie: true, remise: true, note: null, deja: null })).toBeNull();
    // Une copie en cours : rien.
    expect(natureVoulueDeLExamen({ publie: true, remise: false, note: null, deja: null })).toBeNull();
  });

  it("le retrait de la publication : seule une note déjà partie se retire", () => {
    expect(natureVoulueDeLExamen({ publie: false, remise: true, note: 64, deja: "note" })).toBe("retrait");
    expect(natureVoulueDeLExamen({ publie: false, remise: true, note: 64, deja: "retrait" })).toBe("retrait");
    expect(natureVoulueDeLExamen({ publie: false, remise: true, note: 64, deja: null })).toBeNull();
    // Republier : la note repart.
    expect(natureVoulueDeLExamen({ publie: true, remise: true, note: 64, deja: "retrait" })).toBe("note");
  });

  it("la partie de classe : la progression d'un élève entré dans une équipe", () => {
    expect(natureVoulueDeLaPartie({ joueur: true, terminee: false })).toBe("commencee");
    expect(natureVoulueDeLaPartie({ joueur: true, terminee: true })).toBe("terminee");
    expect(natureVoulueDeLaPartie({ joueur: false, terminee: true })).toBeNull();
  });

  it("la partie de classe en tour d'essai : rien ne part, ni « commencée » ni « terminée »", () => {
    // config/tour-d-essai.ts : l'essai ne compte pas. Un élève entré pendant l'essai n'est
    // pas « commencé » ; le dernier tour d'essai clos n'est pas une fin de partie.
    expect(natureVoulueDeLaPartie({ joueur: true, terminee: false, essai: true })).toBeNull();
    expect(natureVoulueDeLaPartie({ joueur: true, terminee: true, essai: true })).toBeNull();
    expect(natureVoulueDeLaPartie({ joueur: true, terminee: false, essai: false })).toBe("commencee");
  });
});

describe("l'assertion client_credentials", () => {
  it("signée RS256 par la clé de l'outil (kid), iss = sub = client_id, aud = adresse de jeton, cinq minutes, jti", () => {
    const jwt = assertionClientCredentials({ clientId: "client-7", urlJeton: "https://moodle.test/mod/lti/token.php", maintenant: MAINTENANT, cles: CLES });
    const d = decoder(jwt);
    expect(d.entete).toEqual({ alg: "RS256", typ: "JWT", kid: CLES.kid });
    const iat = Math.floor(MAINTENANT.getTime() / 1000);
    expect(d.charge).toMatchObject({ iss: "client-7", sub: "client-7", aud: "https://moodle.test/mod/lti/token.php", iat, exp: iat + DUREE_ASSERTION_S });
    expect(DUREE_ASSERTION_S).toBe(300);
    expect(typeof d.charge.jti).toBe("string");
    expect((d.charge.jti as string).length).toBeGreaterThanOrEqual(16);
    const cle = createPublicKey({ key: CLES.publiques[0]!, format: "jwk" });
    expect(verify("RSA-SHA256", Buffer.from(d.signe), cle, d.signature)).toBe(true);
    // Deux assertions : deux jti.
    const autre = decoder(assertionClientCredentials({ clientId: "client-7", urlJeton: "https://moodle.test/mod/lti/token.php", cles: CLES }));
    expect(autre.charge.jti).not.toBe(d.charge.jti);
  });
});

describe("le jeton de service, en cache", () => {
  const plateforme = { id: "p-1", clientId: "client-7", urlJeton: "https://moodle.test/token" };
  let demandes: URLSearchParams[];
  const poster = async (_url: string, corps: URLSearchParams) => {
    demandes.push(corps);
    return { statut: 200, json: { access_token: `jeton-${demandes.length}`, token_type: "Bearer", expires_in: 3600 } };
  };
  beforeEach(() => {
    demandes = [];
    oublierLeJeton();
  });

  it("un jeton par plateforme et par jeu de portées, gardé jusqu'à une minute de son expiration", async () => {
    let t = MAINTENANT.getTime();
    const maintenant = () => t;
    const portees = [PORTEES_AGS.notes, PORTEES_AGS.colonnes];
    const a = await jetonDeService({ plateforme, portees, poster, cles: CLES, maintenant });
    const b = await jetonDeService({ plateforme, portees: [...portees].reverse(), poster, cles: CLES, maintenant });
    expect(a).toBe("jeton-1");
    expect(b).toBe("jeton-1");
    expect(demandes).toHaveLength(1);
    expect(demandes[0]!.get("grant_type")).toBe("client_credentials");
    expect(demandes[0]!.get("client_assertion_type")).toBe("urn:ietf:params:oauth:client-assertion-type:jwt-bearer");
    expect(demandes[0]!.get("scope")).toBe([...portees].sort().join(" "));
    // Un autre jeu de portées, une autre plateforme : un autre jeton.
    await jetonDeService({ plateforme, portees: [PORTEES_AGS.notes], poster, cles: CLES, maintenant });
    await jetonDeService({ plateforme: { ...plateforme, id: "p-2" }, portees, poster, cles: CLES, maintenant });
    expect(demandes).toHaveLength(3);
    // Juste avant la marge : le même ; dans la marge : un neuf.
    t += (3600 - MARGE_S - 1) * 1000;
    expect(await jetonDeService({ plateforme, portees, poster, cles: CLES, maintenant })).toBe("jeton-1");
    t += 2_000;
    expect(await jetonDeService({ plateforme, portees, poster, cles: CLES, maintenant })).toBe("jeton-4");
    // Un jeton refusé s'oublie : le suivant est neuf.
    oublierLeJeton("p-1", portees);
    expect(await jetonDeService({ plateforme, portees, poster, cles: CLES, maintenant })).toBe("jeton-5");
  });

  it("un refus de la plateforme n'est pas gardé", async () => {
    const refuse = async () => ({ statut: 401, json: { error: "invalid_client" } });
    await expect(jetonDeService({ plateforme, portees: [PORTEES_AGS.notes], poster: refuse, cles: CLES })).rejects.toMatchObject({ statut: 401 });
    await jetonDeService({ plateforme, portees: [PORTEES_AGS.notes], poster, cles: CLES });
    expect(demandes).toHaveLength(1);
  });
});

describe("la colonne : une seule par ressource", () => {
  const base = {
    colonneDeLaPlateforme: null,
    colonneCreee: { url: null, ressource: null },
    ressource: "examen:e1",
    resourceLinkId: "rl-1",
    existantes: null,
    colonnes: "https://moodle.test/lineitems?type_id=1",
    portees: [PORTEES_AGS.colonnes, PORTEES_AGS.notes],
    creerPermis: true,
  };

  it("celle de la plateforme d'abord (sélection de contenu, « accepter les notes »)", () => {
    expect(choisirLaColonne({ ...base, colonneDeLaPlateforme: "https://moodle.test/li/9" })).toEqual({ quoi: "plateforme", url: "https://moodle.test/li/9" });
  });

  it("puis celle que l'outil a créée pour CETTE ressource ; une autre ressource n'y va pas", () => {
    expect(choisirLaColonne({ ...base, colonneCreee: { url: "https://moodle.test/li/3", ressource: "examen:e1" } })).toEqual({ quoi: "connue", url: "https://moodle.test/li/3" });
    expect(choisirLaColonne({ ...base, colonneCreee: { url: "https://moodle.test/li/3", ressource: "examen:autre" } })).toEqual({ quoi: "lire" });
  });

  it("puis la lecture des colonnes du cours, avant d'en créer une", () => {
    expect(choisirLaColonne(base)).toEqual({ quoi: "lire" });
    expect(
      choisirLaColonne({ ...base, existantes: [{ id: "https://moodle.test/li/5", resourceId: "examen:e1", resourceLinkId: "rl-1" }] }),
    ).toEqual({ quoi: "trouvee", url: "https://moodle.test/li/5" });
    expect(choisirLaColonne({ ...base, existantes: [{ id: "https://moodle.test/li/5", resourceId: "examen:e2" }] })).toEqual({ quoi: "creer" });
    // Sans droit de lecture ni de création : aucune.
    expect(choisirLaColonne({ ...base, portees: [PORTEES_AGS.notes] })).toEqual({ quoi: "aucune", raison: "pas-de-colonne" });
    expect(choisirLaColonne({ ...base, portees: [PORTEES_AGS.notes, PORTEES_AGS.colonnesEnLecture], existantes: [] })).toEqual({ quoi: "aucune", raison: "pas-de-colonne" });
  });

  it("une partie de classe ne crée jamais de colonne : celle de la plateforme, ou rien", () => {
    expect(choisirLaColonne({ ...base, creerPermis: false })).toEqual({ quoi: "aucune", raison: "pas-de-colonne" });
    expect(choisirLaColonne({ ...base, creerPermis: false, colonneDeLaPlateforme: "https://m.test/li/1" })).toMatchObject({ quoi: "plateforme" });
  });

  it("les adresses gardent la requête de la plateforme (Moodle : ?type_id=…)", () => {
    expect(adresseDesNotes("https://moodle.test/mod/lti/services.php/2/lineitems/7/lineitem?type_id=1")).toBe(
      "https://moodle.test/mod/lti/services.php/2/lineitems/7/lineitem/scores?type_id=1",
    );
    expect(adresseDesNotes("https://canvas.test/api/lti/courses/1/line_items/4/")).toBe("https://canvas.test/api/lti/courses/1/line_items/4/scores");
    const u = new URL(adresseDesColonnes("https://moodle.test/lineitems?type_id=1", { resourceLinkId: "rl 1", resourceId: "examen:e1" }));
    expect(u.searchParams.get("type_id")).toBe("1");
    expect(u.searchParams.get("resource_link_id")).toBe("rl 1");
    expect(u.searchParams.get("resource_id")).toBe("examen:e1");
  });
});

describe("ce que la plateforme accorde", () => {
  it("la revendication du lancement, lue avec prudence", () => {
    const ok = lireLaRevendication(
      {
        scope: [PORTEES_AGS.notes, PORTEES_AGS.colonnes, "https://ailleurs.test/scope", 7, PORTEES_AGS.notes],
        lineitems: "https://moodle.test/lineitems?type_id=1",
        lineitem: "https://moodle.test/lineitems/2/lineitem?type_id=1",
      },
      { NODE_ENV: "production" } as NodeJS.ProcessEnv,
    );
    expect(ok).toEqual({
      portees: [PORTEES_AGS.colonnes, PORTEES_AGS.notes].sort(),
      colonnes: "https://moodle.test/lineitems?type_id=1",
      colonne: "https://moodle.test/lineitems/2/lineitem?type_id=1",
    });
    // HTTP en clair : refusé en production.
    const http = lireLaRevendication({ scope: [PORTEES_AGS.notes], lineitems: "http://moodle.test/li" }, { NODE_ENV: "production" } as NodeJS.ProcessEnv);
    expect(http).toEqual({ portees: [PORTEES_AGS.notes], colonnes: null, colonne: null });
    // Pas de service : null, l'activité marche comme avant.
    expect(lireLaRevendication(undefined)).toBeNull();
    expect(lireLaRevendication({})).toBeNull();
    expect(lireLaRevendication("n'importe quoi")).toBeNull();
  });

  it("les portées du jeton : celles qui servent, parmi celles accordées", () => {
    expect(porteesDuJeton([PORTEES_AGS.notes, PORTEES_AGS.colonnes, PORTEES_AGS.resultats])).toEqual([PORTEES_AGS.colonnes, PORTEES_AGS.notes].sort());
    expect(porteesDuJeton([PORTEES_AGS.notes, PORTEES_AGS.colonnesEnLecture])).toEqual([PORTEES_AGS.colonnesEnLecture, PORTEES_AGS.notes].sort());
  });

  it("l'inscription dynamique demande les trois portées", () => {
    const c = configurationDeLOutil("https://outil.test");
    expect(c.scope.split(" ").sort()).toEqual([...PORTEES_DEMANDEES].sort());
    expect(PORTEES_DEMANDEES).toEqual([
      "https://purl.imsglobal.org/spec/lti-ags/scope/lineitem",
      "https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly",
      "https://purl.imsglobal.org/spec/lti-ags/scope/score",
    ]);
    expect(CLAIM_AGS).toBe("https://purl.imsglobal.org/spec/lti-ags/claim/endpoint");
  });
});

describe("ce que l'enseignant lit", () => {
  const etat: EtatDuRetour = {
    plateforme: nomDeLaPlateforme("moodle · moodle.lycee.fr"),
    accorde: true,
    publie: true,
    attendues: 25,
    envoyees: 24,
    enCours: 0,
    erreurs: [{ message: issueDeLEnvoi(403, "Moodle").message!, n: 1, temporaire: false }],
    sansAdresse: 0,
    sansNote: 0,
  };

  it("« Notes envoyées à Moodle : 24/25 · 1 erreur : … »", () => {
    const p = phrasesDuRetour(etat);
    expect(p.titre).toBe("Le carnet de notes de Moodle");
    expect(`${p.resume.avant}${p.resume.chiffre}`).toBe("Notes envoyées à Moodle : 24/25");
    expect(p.details).toEqual([
      "1 erreur : Moodle a refusé l'accès au carnet de notes (erreur 403). Vérifiez que l'outil peut y renvoyer les notes.",
    ]);
    expect(p.renvoi).toBe(true);
  });

  it("avant la publication, sans service, après un retrait", () => {
    expect(phrasesDuRetour({ ...etat, publie: false, attendues: 0, envoyees: 0, erreurs: [] }).resume.avant).toMatch(/partiront à la publication des résultats/);
    const sans = phrasesDuRetour({ ...etat, accorde: false });
    expect(sans.resume.avant).toMatch(/n'a pas accordé le retour des notes/);
    expect(sans.renvoi).toBe(false);
    const retrait = phrasesDuRetour({ ...etat, publie: false, envoyees: 25, erreurs: [] });
    expect(`${retrait.resume.avant}${retrait.resume.chiffre}`).toBe("Notes retirées de Moodle : 25/25");
  });

  it("le nom de la plateforme, et la majuscule en tête de phrase", () => {
    expect(nomDeLaPlateforme("Canvas LMS")).toBe("Canvas");
    expect(nomDeLaPlateforme("desire2learn · d2l.ecole.fr")).toBe("Brightspace");
    expect(nomDeLaPlateforme("simulateur · 127.0.0.1")).toBe("la plateforme de cours");
    expect(issueDeLEnvoi(500, "la plateforme de cours").message).toBe("La plateforme de cours a rencontré une erreur (erreur 500).");
  });

  it("les réponses de la plateforme : temporaires ou non", () => {
    expect(issueDeLEnvoi(200, "Moodle")).toEqual({ ok: true, temporaire: false, message: null });
    expect(issueDeLEnvoi(204, "Moodle").ok).toBe(true);
    for (const s of ["reseau", 408, 429, 500, 503] as const) expect(issueDeLEnvoi(s, "Moodle").temporaire).toBe(true);
    for (const s of [400, 401, 403, 404, 422]) expect(issueDeLEnvoi(s, "Moodle").temporaire).toBe(false);
  });

  it("la page de l'activité dit si la plateforme a accordé le retour des notes", () => {
    expect(phraseDeLActivite({ plateforme: "Moodle", accorde: false, colonne: false })).toMatch(/^Moodle n'a pas accordé le retour des notes/);
    expect(phraseDeLActivite({ plateforme: "Moodle", accorde: true, colonne: true })).toMatch(/^Moodle accepte les notes de cette activité/);
  });
});
