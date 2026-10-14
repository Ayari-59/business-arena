import { randomBytes } from "node:crypto";

/**
 * LES PAGES QUE SERVENT DIRECTEMENT LES ROUTES LTI.
 *
 * Quatre écrans ne passent pas par une page Next : le refus d'un lancement, la
 * sélection de contenu, l'inscription dynamique et le renvoi vers la plateforme. Ils
 * s'affichent souvent DANS la plateforme (une iframe de Moodle) et doivent donc porter
 * leur propre politique de sécurité : être intégrables par l'origine de LA plateforme et
 * d'elle seule (`frame-ancestors`), et pouvoir poster vers elle (`form-action`). Le
 * reste du site garde `X-Frame-Options: DENY` et `frame-ancestors 'none'` ; ici, la
 * CSP de la réponse remplace celle du site, et `frame-ancestors` l'emporte sur
 * `X-Frame-Options` dans les navigateurs qui la lisent.
 *
 * TOUT texte inséré passe par `echapper` : un titre de cours, un nom d'émetteur, un
 * message d'erreur. Rien de ce qu'envoie une plateforme n'entre tel quel dans le HTML.
 */

export function echapper(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** L'origine d'une adresse (schéma, hôte, port), ou null. */
export function origineDe(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return u.protocol === "https:" || u.protocol === "http:" ? u.origin : null;
  } catch {
    return null;
  }
}

const STYLE = `
:root{color-scheme:dark}
*{box-sizing:border-box}
body{margin:0;background:#0b1220;color:#e2e8f0;font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:44rem;margin:0 auto;padding:2rem 1rem 3rem}
.surtitre{font-size:.75rem;letter-spacing:.14em;text-transform:uppercase;color:#94a3b8;margin:0}
h1{font-size:1.75rem;line-height:1.2;margin:.5rem 0 1rem;color:#f8fafc}
h2{font-size:1.1rem;margin:1.5rem 0 .5rem;color:#f1f5f9}
p{margin:.5rem 0;color:#cbd5e1}
.carte{border:1px solid rgba(255,255,255,.12);border-radius:.75rem;padding:1rem;margin:.75rem 0;background:#111a2e}
label.choix{display:flex;gap:.75rem;align-items:flex-start;padding:.6rem 0;border-top:1px solid rgba(255,255,255,.08)}
label.choix:first-of-type{border-top:0}
.note{font-size:.875rem;color:#94a3b8}
.bouton{display:inline-block;margin-top:1rem;border:0;border-radius:.6rem;padding:.7rem 1.2rem;background:#fbbf24;color:#0b1220;font-weight:700;font-size:1rem;cursor:pointer;text-decoration:none}
.bouton:focus-visible{outline:3px solid #fde68a;outline-offset:2px}
code{font-family:ui-monospace,Menlo,monospace;font-size:.85em;word-break:break-all;color:#f1f5f9}
input[type=radio]{accent-color:#fbbf24;margin-top:.3rem}
`;

export interface OptionsDePage {
  titre: string;
  surtitre?: string;
  /** Le corps, DÉJÀ échappé par l'appelant. */
  corps: string;
  statut?: number;
  /** Les origines autorisées à intégrer la page ; aucune : personne. */
  integrablePar?: (string | null)[];
  /** Les origines vers lesquelles un formulaire peut poster, en plus de l'outil. */
  postVers?: (string | null)[];
  /** Un script en ligne (sans balise) : il reçoit un nonce. */
  script?: string;
}

export function pageLti(o: OptionsDePage): Response {
  const nonce = randomBytes(16).toString("base64");
  const integrable = [...new Set((o.integrablePar ?? []).filter((x): x is string => !!x))];
  const post = [...new Set((o.postVers ?? []).filter((x): x is string => !!x))];
  const csp = [
    "default-src 'none'",
    "style-src 'unsafe-inline'",
    "img-src 'self' data:",
    o.script ? `script-src 'nonce-${nonce}'` : "script-src 'none'",
    `form-action 'self'${post.length ? ` ${post.join(" ")}` : ""}`,
    `frame-ancestors ${integrable.length ? integrable.join(" ") : "'none'"}`,
    "base-uri 'none'",
  ].join("; ");
  const html = `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>${echapper(o.titre)} · Business Arena</title>
<style>${STYLE}</style></head>
<body><main id="main">
<p class="surtitre">${echapper(o.surtitre ?? "Business Arena")}</p>
<h1>${echapper(o.titre)}</h1>
${o.corps}
</main>${o.script ? `<script nonce="${nonce}">${o.script}</script>` : ""}</body></html>`;
  return new Response(html, {
    status: o.statut ?? 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "content-security-policy": csp,
      "referrer-policy": "no-referrer",
    },
  });
}

/**
 * Le refus générique d'un lancement : jamais le motif technique, qui reste au journal.
 * Intégrable partout : la plateforme qui l'affiche n'est pas forcément connue (c'est
 * souvent la raison du refus), et la page n'a ni bouton ni donnée.
 */
export function pageDeRefus(statut = 400): Response {
  return pageLti({
    titre: "Ce lancement n'a pas pu être vérifié",
    statut,
    integrablePar: ["*"],
    corps: `<p>Business Arena n'a pas pu confirmer l'identité transmise par votre plateforme de cours. Relancez l'activité depuis votre cours. Si cela se reproduit, prévenez l'administrateur de la plateforme : le refus est noté de notre côté.</p>`,
  });
}
