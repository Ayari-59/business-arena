import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { createPublicKey, randomBytes, verify, type JsonWebKey } from "node:crypto";
import type { AddressInfo } from "node:net";

/**
 * LE CARNET DE NOTES D'UNE PLATEFORME, POUR LES TESTS ET POUR EUX SEULS.
 *
 * Il fait ce que fait Moodle quand l'outil y renvoie des notes (LTI Advantage, AGS 1.3),
 * en petit, sur un serveur local (127.0.0.1, port libre) :
 *   · `/token` : le jeton OAuth 2 `client_credentials`. L'assertion de l'outil est
 *     VÉRIFIÉE : signature RS256 par la clé publique de l'outil (son JWKS), émetteur et
 *     sujet = client_id, audience = cette adresse, dates, jti jamais rejoué ; les portées
 *     rendues sont celles demandées ET accordées ;
 *   · `/lineitems?type_id=1` : les colonnes du cours, à lire (filtrées par
 *     `resource_id` et `resource_link_id`) ou à créer ;
 *   · `/lineitems/<n>/lineitem/scores?type_id=1` : la note d'un élève, reçue et gardée.
 * Chaque demande exige le jeton (Bearer) et la portée de ce qu'elle fait ; la requête
 * `?type_id=1` (celle des adresses de Moodle) doit être conservée par l'outil.
 *
 * On peut lui faire répondre une erreur aux prochaines notes (`echecs`), pour vérifier les
 * nouveaux essais.
 */

const PORTEE = "https://purl.imsglobal.org/spec/lti-ags/scope";
export const PORTEES = {
  colonnes: `${PORTEE}/lineitem`,
  colonnesEnLecture: `${PORTEE}/lineitem.readonly`,
  resultats: `${PORTEE}/result.readonly`,
  notes: `${PORTEE}/score`,
} as const;
export const CLAIM_AGS = "https://purl.imsglobal.org/spec/lti-ags/claim/endpoint";

export interface ColonneDuCarnet {
  id: string;
  label: string;
  scoreMaximum: number;
  resourceId?: string;
  resourceLinkId?: string;
  tag?: string;
}

export interface NoteRecue {
  colonne: string;
  score: Record<string, unknown>;
  type: string | undefined;
}

async function corps(req: IncomingMessage): Promise<string> {
  const morceaux: Buffer[] = [];
  for await (const m of req) morceaux.push(m as Buffer);
  return Buffer.concat(morceaux).toString("utf8");
}

const decoder = (partie: string) => JSON.parse(Buffer.from(partie, "base64url").toString("utf8")) as Record<string, unknown>;

export class CarnetDeNotes {
  base = "";
  private serveur: Server | null = null;
  /** Les portées que la plateforme accorde à l'outil. */
  accordees: string[] = [PORTEES.colonnes, PORTEES.resultats, PORTEES.notes];
  private readonly jetons = new Map<string, string[]>();
  private readonly jtiVus = new Set<string>();
  readonly demandesDeJeton: { scope: string; claims: Record<string, unknown>; kid: unknown }[] = [];
  readonly refusDeJeton: string[] = [];
  readonly colonnes: ColonneDuCarnet[] = [];
  readonly notes: NoteRecue[] = [];
  /** Les réponses imposées aux prochaines notes (500, 403…), consommées dans l'ordre. */
  readonly echecs: number[] = [];
  /** Toutes les réponses aux notes, dans l'ordre. */
  readonly reponsesAuxNotes: number[] = [];

  constructor(
    readonly clientId: () => string,
    private readonly clesDeLOutil: () => Promise<JsonWebKey[]>,
  ) {}

  get urlJeton(): string {
    return `${this.base}/token`;
  }

  get urlColonnes(): string {
    return `${this.base}/lineitems?type_id=1`;
  }

  /** La revendication du lancement : le service accordé, avec ou sans colonne de la plateforme. */
  revendication(options: { colonne?: string | null; portees?: string[] } = {}): Record<string, unknown> {
    return {
      [CLAIM_AGS]: {
        scope: options.portees ?? this.accordees,
        lineitems: this.urlColonnes,
        ...(options.colonne ? { lineitem: options.colonne } : {}),
      },
    };
  }

  /** Une colonne créée par la plateforme elle-même (sélection de contenu, « accepter les notes »). */
  creerUneColonne(c: Omit<ColonneDuCarnet, "id">): string {
    const id = `${this.base}/lineitems/${this.colonnes.length + 1}/lineitem?type_id=1`;
    this.colonnes.push({ id, ...c });
    return id;
  }

  notesDe(sub: string): Record<string, unknown>[] {
    return this.notes.filter((n) => n.score.userId === sub).map((n) => n.score);
  }

  async demarrer(): Promise<this> {
    this.serveur = createServer((req, res) => void this.repondre(req, res));
    await new Promise<void>((ok) => this.serveur!.listen(0, "127.0.0.1", ok));
    this.base = `http://127.0.0.1:${(this.serveur.address() as AddressInfo).port}`;
    return this;
  }

  async arreter(): Promise<void> {
    await new Promise<void>((ok) => (this.serveur ? this.serveur.close(() => ok()) : ok()));
  }

  private async verifierLAssertion(assertion: string): Promise<Record<string, unknown> | string> {
    const [e, c, s] = assertion.split(".");
    if (!e || !c || !s) return "assertion mal formée";
    const entete = decoder(e);
    const claims = decoder(c);
    if (entete.alg !== "RS256") return "algorithme refusé";
    const cles = await this.clesDeLOutil();
    const jwk = cles.find((k) => (k as { kid?: unknown }).kid === entete.kid);
    if (!jwk) return "clé inconnue";
    const cle = createPublicKey({ key: jwk, format: "jwk" });
    if (!verify("RSA-SHA256", Buffer.from(`${e}.${c}`), cle, Buffer.from(s, "base64url"))) return "signature invalide";
    const maintenant = Math.floor(Date.now() / 1000);
    if (claims.iss !== this.clientId() || claims.sub !== this.clientId()) return "émetteur ou sujet";
    if (claims.aud !== this.urlJeton && !(Array.isArray(claims.aud) && claims.aud.includes(this.urlJeton))) return "audience";
    if (typeof claims.exp !== "number" || claims.exp < maintenant) return "expirée";
    if (typeof claims.iat !== "number" || claims.iat > maintenant + 60) return "émise dans le futur";
    if (typeof claims.jti !== "string" || this.jtiVus.has(claims.jti)) return "jti absent ou rejoué";
    this.jtiVus.add(claims.jti);
    return { ...claims, __kid: entete.kid };
  }

  private autorise(req: IncomingMessage, besoin: string[]): boolean {
    const m = /^Bearer (.+)$/.exec(req.headers.authorization ?? "");
    const portees = m ? this.jetons.get(m[1]!) : undefined;
    return !!portees && besoin.some((b) => portees.includes(b));
  }

  private async repondre(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url ?? "/", this.base);
    const json = (statut: number, o: unknown, type = "application/json") => {
      res.writeHead(statut, { "content-type": type });
      res.end(o === undefined ? "" : JSON.stringify(o));
    };
    if (url.pathname === "/token" && req.method === "POST") {
      const f = new URLSearchParams(await corps(req));
      if (f.get("grant_type") !== "client_credentials") return json(400, { error: "unsupported_grant_type" });
      if (f.get("client_assertion_type") !== "urn:ietf:params:oauth:client-assertion-type:jwt-bearer") {
        return json(400, { error: "invalid_request" });
      }
      const v = await this.verifierLAssertion(f.get("client_assertion") ?? "");
      if (typeof v === "string") {
        this.refusDeJeton.push(v);
        return json(401, { error: "invalid_client", error_description: v });
      }
      const demandees = (f.get("scope") ?? "").split(" ").filter(Boolean);
      const rendues = demandees.filter((p) => this.accordees.includes(p));
      if (rendues.length === 0) return json(400, { error: "invalid_scope" });
      const { __kid: kid, ...claims } = v;
      this.demandesDeJeton.push({ scope: f.get("scope") ?? "", claims, kid });
      const jeton = randomBytes(16).toString("hex");
      this.jetons.set(jeton, rendues);
      return json(200, { access_token: jeton, token_type: "Bearer", expires_in: 3600, scope: rendues.join(" ") });
    }
    if (url.pathname === "/lineitems" && url.searchParams.get("type_id") === "1") {
      if (req.method === "GET") {
        if (!this.autorise(req, [PORTEES.colonnes, PORTEES.colonnesEnLecture])) return json(403, { error: "scope" });
        const rid = url.searchParams.get("resource_id");
        const rlid = url.searchParams.get("resource_link_id");
        return json(
          200,
          this.colonnes.filter((c) => (!rid || c.resourceId === rid) && (!rlid || c.resourceLinkId === rlid)),
          "application/vnd.ims.lis.v2.lineitemcontainer+json",
        );
      }
      if (req.method === "POST") {
        if (!this.autorise(req, [PORTEES.colonnes])) return json(403, { error: "scope" });
        if (req.headers["content-type"] !== "application/vnd.ims.lis.v2.lineitem+json") return json(415, { error: "type" });
        const c = JSON.parse(await corps(req)) as Omit<ColonneDuCarnet, "id">;
        if (typeof c.label !== "string" || !(c.scoreMaximum > 0)) return json(400, { error: "colonne" });
        const id = this.creerUneColonne(c);
        return json(201, { id, ...c }, "application/vnd.ims.lis.v2.lineitem+json");
      }
    }
    const scores = /^\/lineitems\/(\d+)\/lineitem\/scores$/.exec(url.pathname);
    if (scores && req.method === "POST") {
      if (url.searchParams.get("type_id") !== "1") return json(404, { error: "type_id perdu" });
      if (!this.autorise(req, [PORTEES.notes])) return json(403, { error: "scope" });
      const colonne = this.colonnes[Number(scores[1]) - 1];
      if (!colonne) return json(404, { error: "colonne" });
      const score = JSON.parse(await corps(req)) as Record<string, unknown>;
      const impose = this.echecs.shift();
      if (impose) {
        this.reponsesAuxNotes.push(impose);
        return json(impose, { error: "imposé par le test" });
      }
      this.notes.push({ colonne: colonne.id, score, type: req.headers["content-type"] });
      this.reponsesAuxNotes.push(200);
      return json(200, {});
    }
    res.writeHead(404);
    res.end();
  }
}
