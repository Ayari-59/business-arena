import { createHmac, randomUUID } from "node:crypto";
import { Client } from "pg";
import type { BrowserContext } from "playwright-core";
import { BASE } from "./browser";

/**
 * JOUER SOUS LICENCE, DANS UN VRAI NAVIGATEUR.
 *
 * Sans licence en cours, les niveaux 4 à 6 ne se créent plus et seuls les épisodes de
 * démonstration se lancent (services/acces.service.ts). Les parcours qui vérifient autre
 * chose à ces niveaux, ou dans les autres épisodes, jouent donc sous licence, posée en
 * base comme le ferait l'administrateur : la règle reste en vigueur, eux sont couverts.
 *
 * LE PÉRIMÈTRE (migrations 0036 et 0038, config/tarifs.ts) : une licence ouvre l'arène
 * (offre Classe, Programme ou Campus, avec son paramétrage) et/ou les épisodes manager,
 * vendus à part. Une Classe porte une entreprise et un niveau (NOVA, niveau 3 par
 * défaut ici), un enseignant et un groupe à la fois ; un Programme, une entreprise
 * (NOVA par défaut) et un plafond d'enseignants. Par défaut, ces aides
 * posent une licence de l'ARÈNE seule (Campus), comme celles qu'on vend ; un parcours qui
 * ouvre des épisodes non démo le demande (`{ episodes: true }`). Une cohorte existe pour
 * jouer des épisodes : son organisation reçoit une licence qui les inclut.
 *
 * Deux façons d'être couvert, celles du produit :
 *  · un compte enseignant rattaché à un établissement sous licence, connecté sur ce
 *    navigateur (`enseignantSousLicence`) ;
 *  · la cohorte d'une organisation sous licence, rejointe par son code
 *    (`cohorteSousLicence`).
 */

async function base<T>(f: (c: Client) => Promise<T>): Promise<T> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquante : ce test pose une licence en base");
  const c = new Client({ connectionString: url });
  await c.connect();
  try {
    return await f(c);
  } finally {
    await c.end();
  }
}

export interface PerimetreE2E {
  /** L'offre de l'arène ; null : la licence n'ouvre pas l'arène. Défaut : Campus. */
  arene?: "classe" | "programme" | "campus" | null;
  /** La licence ouvre-t-elle les épisodes manager ? Défaut : non. */
  episodes?: boolean;
  /** Les entreprises ouvertes. Défaut : NOVA pour Classe et Programme, toutes pour Campus. */
  entreprises?: string[] | null;
  /** Les niveaux ouverts. Défaut : le 3 pour Classe, tous sinon. */
  niveaux?: number[] | null;
  /** Le plafond d'enseignants. Défaut : 1 pour Classe, 5 pour Programme, aucun pour Campus. */
  maxTeachers?: number | null;
  /**
   * L'examen individuel (migration 0042). Défaut : inclus dans Programme et Campus, pas
   * dans Classe, comme la composition du catalogue par défaut.
   */
  examen?: boolean;
}

/** Une organisation, et une licence en cours si on la demande. */
async function organisation(
  c: Client,
  nom: string,
  licence: boolean,
  perimetre: PerimetreE2E = {},
): Promise<string> {
  const { rows } = await c.query(
    "insert into organizations (name, slug, kind) values ($1, $2, 'school') returning id",
    [nom, `e2e-${randomUUID()}`],
  );
  const orgId = rows[0].id as string;
  if (licence) await poser(c, orgId, perimetre);
  return orgId;
}

/** Poser une licence en cours, avec son périmètre, comme le ferait l'administrateur. */
async function poser(c: Client, orgId: string, perimetre: PerimetreE2E): Promise<void> {
  const arene = perimetre.arene === undefined ? "campus" : perimetre.arene;
  const restreinte = arene === "classe" || arene === "programme";
  await c.query(
    `insert into org_licences (organization_id, label, starts_at, ends_at, arene, episodes, max_teachers,
       entreprises, niveaux, max_parties_en_cours, examen)
     values ($1, 'Licence e2e', now() - interval '10 days', now() + interval '300 days', $2, $3, $4, $5, $6, $7, $8)`,
    [
      orgId,
      arene,
      perimetre.episodes ?? false,
      perimetre.maxTeachers !== undefined
        ? perimetre.maxTeachers
        : arene === "classe"
          ? 1
          : arene === "programme"
            ? 5
            : null,
      perimetre.entreprises !== undefined ? perimetre.entreprises : restreinte ? ["nova"] : null,
      perimetre.niveaux !== undefined ? perimetre.niveaux : arene === "classe" ? [3] : null,
      arene === "classe" ? 1 : null,
      perimetre.examen ?? (arene === "programme" || arene === "campus"),
    ],
  );
}

/** Le jeton de session enseignant, signé comme le fait `lib/session.ts`. */
function jetonDeSession(userId: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET manquant : il signe la session de l'enseignant");
  const now = Date.now();
  const corps = Buffer.from(
    JSON.stringify({ id: userId, role: "teacher", v: 1, iat: now, exp: now + 24 * 3600 * 1000 }),
    "utf8",
  ).toString("base64url");
  const signature = createHmac("sha256", secret).update(corps).digest("hex").slice(0, 32);
  return `${corps}.${signature}`;
}

/**
 * Un enseignant connecté dans ce contexte de navigateur, rattaché à un établissement
 * sous licence (ou sans, avec `{ licence: false }`).
 */
export async function enseignantSousLicence(
  contexte: BrowserContext,
  options: { licence?: boolean } & PerimetreE2E = {},
): Promise<{ userId: string; orgId: string }> {
  const licence = options.licence ?? true;
  const { userId, orgId } = await base(async (c) => {
    const orgId = await organisation(
      c,
      licence ? "Lycée sous licence" : "Lycée sans licence",
      licence,
      options,
    );
    const { rows } = await c.query(
      "insert into users (email, display_name) values ($1, $2) returning id",
      [`prof-${randomUUID()}@e2e.test`, "Prof E2E"],
    );
    const userId = rows[0].id as string;
    await c.query(
      "insert into organization_members (user_id, organization_id, role) values ($1, $2, 'teacher')",
      [userId, orgId],
    );
    return { userId, orgId };
  });
  await contexte.addCookies([{ name: "ba_session", value: jetonDeSession(userId), url: BASE }]);
  return { userId, orgId };
}

/** Une cohorte d'épisodes dont l'organisation a une licence épisodes ; renvoie son code. */
export async function cohorteSousLicence(nom: string): Promise<string> {
  return base(async (c) => {
    const orgId = await organisation(c, `Entreprise ${nom}`, true, { arene: null, episodes: true });
    const code = `E2E-${randomUUID().slice(0, 4).toUpperCase()}`;
    await c.query(
      `insert into episode_cohortes (code, nom, cle_animateur, organization_id)
       values ($1, $2, $3, $4)`,
      [code, nom, randomUUID().replace(/-/g, ""), orgId],
    );
    return code;
  });
}

/** Une organisation sous licence, pour la rattacher à ce qu'on crée ensuite. */
export async function organisationSousLicence(nom: string, perimetre: PerimetreE2E = {}): Promise<string> {
  return base((c) => organisation(c, nom, true, perimetre));
}

/**
 * Poser une licence en cours sur l'établissement d'un enseignant inscrit par l'écran (son
 * e-mail), ou retirer celles qu'on lui a posées ainsi.
 */
export async function licenceDeLEnseignant(
  email: string,
  geste: "pose" | "retire",
  perimetre: PerimetreE2E = {},
): Promise<void> {
  await base(async (c) => {
    const { rows } = await c.query(
      `select m.organization_id as org from organization_members m
         join users u on u.id = m.user_id
        where u.email = $1 limit 1`,
      [email],
    );
    if (rows.length !== 1) throw new Error(`établissement de ${email} introuvable`);
    if (geste === "pose") {
      await poser(c, rows[0].org, perimetre);
    } else {
      await c.query("delete from org_licences where organization_id = $1 and label = 'Licence e2e'", [
        rows[0].org,
      ]);
    }
  });
}
