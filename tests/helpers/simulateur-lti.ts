import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { generateKeyPairSync, randomUUID, sign, type KeyObject } from "node:crypto";
import type { AddressInfo } from "node:net";

/**
 * UNE PLATEFORME D'ENSEIGNEMENT POUR LES TESTS, ET POUR EUX SEULS.
 *
 * Elle fait ce que fait Moodle, en petit : sa propre paire de clés RSA, un JWKS publié
 * sur un serveur local (127.0.0.1, port libre), une configuration OpenID et un point
 * d'inscription (inscription dynamique), une authentification OIDC qui répond par un
 * formulaire auto-soumis portant l'`id_token` signé, et un point de retour pour la
 * sélection de contenu. Le navigateur des parcours e2e passe par elle exactement comme
 * il passerait par Moodle.
 *
 * Elle vit dans tests/ : rien de tout cela n'est servi en production.
 */

export const CLAIMS = {
  version: "https://purl.imsglobal.org/spec/lti/claim/version",
  type: "https://purl.imsglobal.org/spec/lti/claim/message_type",
  deployment: "https://purl.imsglobal.org/spec/lti/claim/deployment_id",
  roles: "https://purl.imsglobal.org/spec/lti/claim/roles",
  ressource: "https://purl.imsglobal.org/spec/lti/claim/resource_link",
  contexte: "https://purl.imsglobal.org/spec/lti/claim/context",
  cible: "https://purl.imsglobal.org/spec/lti/claim/target_link_uri",
  custom: "https://purl.imsglobal.org/spec/lti/claim/custom",
  presentation: "https://purl.imsglobal.org/spec/lti/claim/launch_presentation",
  dl: "https://purl.imsglobal.org/spec/lti-dl/claim/deep_linking_settings",
} as const;

export const ROLE = {
  enseignant: "http://purl.imsglobal.org/vocab/lis/v2/membership#Instructor",
  admin: "http://purl.imsglobal.org/vocab/lis/v2/institution/person#Administrator",
  eleve: "http://purl.imsglobal.org/vocab/lis/v2/membership#Learner",
} as const;

export interface Personne {
  sub: string;
  role: "enseignant" | "eleve";
  prenom?: string;
  nom?: string;
  courriel?: string;
  /** L'activité (resource link) ; absente pour une sélection de contenu. */
  ressource?: string;
  titre?: string;
  cours?: string;
  custom?: Record<string, string>;
  selection?: boolean;
  affichage?: string;
  /** Des revendications de plus (le service de notes, tests/helpers/carnet-de-notes.ts). */
  revendications?: Record<string, unknown>;
}

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o), "utf8").toString("base64url");

export function signerRS256(charge: Record<string, unknown>, cle: KeyObject, kid: string, alg = "RS256"): string {
  const e = b64({ alg, typ: "JWT", kid });
  const c = b64(charge);
  const s = sign("RSA-SHA256", Buffer.from(`${e}.${c}`), cle).toString("base64url");
  return `${e}.${c}.${s}`;
}

/** Un jeton sans signature, `alg: none`. */
export function jetonNone(charge: Record<string, unknown>): string {
  return `${b64({ alg: "none", typ: "JWT" })}.${b64(charge)}.`;
}

const echapper = (v: string) => v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");

function formulaireAuto(action: string, champs: Record<string, string>): string {
  const entrees = Object.entries(champs)
    .map(([k, v]) => `<input type="hidden" name="${echapper(k)}" value="${echapper(v)}">`)
    .join("");
  return `<!doctype html><html><body><form id="f" method="post" action="${echapper(action)}">${entrees}<button>Continuer</button></form><script>document.getElementById('f').submit()</script></body></html>`;
}

async function corps(req: IncomingMessage): Promise<string> {
  const morceaux: Buffer[] = [];
  for await (const m of req) morceaux.push(m as Buffer);
  return Buffer.concat(morceaux).toString("utf8");
}

export class SimulateurLti {
  readonly privee: KeyObject;
  readonly kid = `sim-${randomUUID().slice(0, 8)}`;
  readonly clientId = `client-${randomUUID().slice(0, 8)}`;
  readonly deploymentId = `dep-${randomUUID().slice(0, 6)}`;
  base = "";
  private serveur: Server | null = null;
  /** Les lancements préparés, par login_hint. */
  private readonly attentes = new Map<string, Personne>();
  /** Ce que la plateforme a reçu : inscriptions, réponses de sélection. */
  readonly inscriptions: { autorisation: string | undefined; corps: Record<string, unknown> }[] = [];
  readonly reponsesDeSelection: string[] = [];
  /** L'outil, côté plateforme : là où la plateforme envoie ses demandes. */
  outil = "";

  constructor() {
    this.privee = generateKeyPairSync("rsa", { modulusLength: 2048 }).privateKey;
  }

  get issuer(): string {
    return this.base;
  }

  jwkPublic(): Record<string, unknown> {
    const jwk = this.privee.export({ format: "jwk" }) as Record<string, unknown>;
    return { kty: "RSA", n: jwk.n, e: jwk.e, alg: "RS256", use: "sig", kid: this.kid };
  }

  /** Les champs de la plateforme pour `inscrirePlateforme`. */
  description() {
    return {
      issuer: this.issuer,
      clientId: this.clientId,
      deploymentIds: [this.deploymentId],
      urlAuthentification: `${this.base}/auth`,
      urlJeton: `${this.base}/token`,
      urlJwks: `${this.base}/jwks`,
    };
  }

  async demarrer(outil = ""): Promise<this> {
    this.outil = outil;
    this.serveur = createServer((req, res) => void this.repondre(req, res));
    await new Promise<void>((ok) => this.serveur!.listen(0, "127.0.0.1", ok));
    this.base = `http://127.0.0.1:${(this.serveur.address() as AddressInfo).port}`;
    return this;
  }

  async arreter(): Promise<void> {
    await new Promise<void>((ok) => (this.serveur ? this.serveur.close(() => ok()) : ok()));
  }

  /** Les revendications d'un id_token pour cette personne. */
  charge(p: Personne, nonce: string, autres: Record<string, unknown> = {}): Record<string, unknown> {
    const maintenant = Math.floor(Date.now() / 1000);
    const c: Record<string, unknown> = {
      iss: this.issuer,
      aud: this.clientId,
      sub: p.sub,
      iat: maintenant,
      exp: maintenant + 300,
      nonce,
      [CLAIMS.version]: "1.3.0",
      [CLAIMS.type]: p.selection ? "LtiDeepLinkingRequest" : "LtiResourceLinkRequest",
      [CLAIMS.deployment]: this.deploymentId,
      [CLAIMS.roles]: [p.role === "enseignant" ? ROLE.enseignant : ROLE.eleve],
      [CLAIMS.cible]: `${this.outil}/api/lti/lancement`,
      [CLAIMS.contexte]: { id: "cours-1", title: p.cours ?? "Gestion BTS MCO 1" },
    };
    if (p.prenom) c.given_name = p.prenom;
    if (p.nom) c.name = p.nom;
    if (p.courriel) c.email = p.courriel;
    if (p.ressource) c[CLAIMS.ressource] = { id: p.ressource, title: p.titre ?? "Business Arena" };
    if (p.custom) c[CLAIMS.custom] = p.custom;
    if (p.affichage) c[CLAIMS.presentation] = { document_target: p.affichage };
    if (p.selection) {
      c[CLAIMS.dl] = {
        deep_link_return_url: `${this.base}/retour-selection`,
        accept_types: ["ltiResourceLink"],
        accept_presentation_document_targets: ["window"],
        data: "donnees-opaques",
      };
    }
    return { ...c, ...(p.revendications ?? {}), ...autres };
  }

  idToken(p: Personne, nonce: string, autres: Record<string, unknown> = {}): string {
    return signerRS256(this.charge(p, nonce, autres), this.privee, this.kid);
  }

  /** Prépare un lancement : l'adresse à ouvrir dans le navigateur pour le jouer. */
  preparer(p: Personne): string {
    const hint = randomUUID();
    this.attentes.set(hint, p);
    return `${this.base}/lancer?hint=${hint}`;
  }

  private async repondre(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? "/", this.base);
    const html = (h: string) => {
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(h);
    };
    const json = (statut: number, o: unknown) => {
      res.writeHead(statut, { "content-type": "application/json" });
      res.end(JSON.stringify(o));
    };
    switch (url.pathname) {
      case "/jwks":
        return json(200, { keys: [this.jwkPublic()] });
      case "/.well-known/openid-configuration":
        return json(200, {
          issuer: this.issuer,
          authorization_endpoint: `${this.base}/auth`,
          token_endpoint: `${this.base}/token`,
          jwks_uri: `${this.base}/jwks`,
          registration_endpoint: `${this.base}/registration`,
          "https://purl.imsglobal.org/spec/lti-platform-configuration": { product_family_code: "simulateur" },
        });
      case "/registration": {
        const recu = JSON.parse((await corps(req)) || "{}") as Record<string, unknown>;
        this.inscriptions.push({ autorisation: req.headers.authorization, corps: recu });
        return json(200, {
          client_id: this.clientId,
          ...recu,
          "https://purl.imsglobal.org/spec/lti-tool-configuration": {
            ...(recu["https://purl.imsglobal.org/spec/lti-tool-configuration"] as object),
            deployment_id: this.deploymentId,
          },
        });
      }
      case "/lancer": {
        // Premier temps : la plateforme poste la connexion OIDC à l'outil.
        const hint = url.searchParams.get("hint") ?? "";
        return html(
          formulaireAuto(`${this.outil}/api/lti/connexion`, {
            iss: this.issuer,
            login_hint: hint,
            target_link_uri: `${this.outil}/api/lti/lancement`,
            client_id: this.clientId,
            lti_deployment_id: this.deploymentId,
            lti_message_hint: "message",
          }),
        );
      }
      case "/auth": {
        // Deuxième temps : l'authentification répond par un formulaire auto-soumis.
        const q = url.searchParams;
        const p = this.attentes.get(q.get("login_hint") ?? "");
        if (!p || q.get("client_id") !== this.clientId || q.get("response_mode") !== "form_post") {
          res.writeHead(400);
          return void res.end("demande d'authentification invalide");
        }
        return html(
          formulaireAuto(q.get("redirect_uri")!, {
            id_token: this.idToken(p, q.get("nonce")!),
            state: q.get("state")!,
          }),
        );
      }
      case "/retour-selection": {
        const recu = new URLSearchParams(await corps(req));
        this.reponsesDeSelection.push(recu.get("JWT") ?? "");
        return html("<!doctype html><html><body><h1>Contenu reçu par la plateforme</h1></body></html>");
      }
      default:
        res.writeHead(404);
        res.end();
    }
  }
}
