#!/usr/bin/env node
/**
 * AUTORISER LA PLATEFORME À LIRE ET ÉCRIRE VOTRE AGENDA GOOGLE — une fois.
 *
 * CHEMIN SECONDAIRE. Le chemin simple est le bouton « Connecter mon agenda
 * Google » de l'administration (/admin), qui ne demande que l'ID et le secret
 * du client dans l'hébergement. Ce script sert si l'on préfère poser le jeton
 * soi-même dans l'environnement (GOOGLE_REFRESH_TOKEN), qui l'emporte alors.
 *
 * La page /rendez-vous propose les créneaux que votre agenda laisse libres et
 * y pose les rendez-vous pris. Pour cela, l'hébergement a besoin de trois
 * valeurs : l'identifiant et le secret d'un client OAuth (créés dans la
 * console Google Cloud), et un JETON DE RAFRAÎCHISSEMENT propre à votre
 * compte, que ce script obtient en vous faisant consentir dans votre
 * navigateur. Il tourne sur VOTRE poste, n'envoie rien ailleurs que chez
 * Google, et affiche le jeton pour que vous le colliez dans les variables
 * d'environnement de l'hébergement (Vercel → Settings → Environment
 * Variables). Le jeton ne se partage pas et ne se commite jamais.
 *
 * Préparation (cinq minutes, console.cloud.google.com) :
 *   1. Un projet ; « API et services » → activer « Google Calendar API ».
 *   2. « Écran de consentement OAuth » : type Externe, votre adresse en
 *      contact, puis « PUBLIER L'APPLICATION » (statut « En production »).
 *      Sans cela, le jeton expire au bout de sept jours.
 *   3. « Identifiants » → « Créer des identifiants » → « ID client OAuth »,
 *      type « Application de bureau ». Notez l'ID client et le secret.
 *
 * Usage :
 *   GOOGLE_CLIENT_ID=… GOOGLE_CLIENT_SECRET=… node scripts/google-agenda-autorisation.mjs
 * (ou sans variables : le script vous les demande).
 */
import { createServer } from "node:http";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

const PORT = 8765;
const REDIRECT = `http://127.0.0.1:${PORT}/`;
const SCOPES = [
  "https://www.googleapis.com/auth/calendar.readonly",
  "https://www.googleapis.com/auth/calendar.events",
].join(" ");

async function demander(question, valeur) {
  if (valeur) return valeur;
  const rl = createInterface({ input: stdin, output: stdout });
  const r = (await rl.question(question)).trim();
  rl.close();
  return r;
}

const clientId = await demander("ID client OAuth : ", process.env.GOOGLE_CLIENT_ID);
const clientSecret = await demander("Secret client : ", process.env.GOOGLE_CLIENT_SECRET);
if (!clientId || !clientSecret) {
  console.error("Il faut l'ID client et le secret.");
  process.exit(1);
}

const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
url.search = new URLSearchParams({
  client_id: clientId,
  redirect_uri: REDIRECT,
  response_type: "code",
  scope: SCOPES,
  access_type: "offline",
  prompt: "consent",
}).toString();

const code = await new Promise((resolve, reject) => {
  const serveur = createServer((req, res) => {
    const u = new URL(req.url ?? "/", REDIRECT);
    const c = u.searchParams.get("code");
    const erreur = u.searchParams.get("error");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    if (c) {
      res.end("<p>Autorisation reçue. Vous pouvez fermer cet onglet et revenir au terminal.</p>");
      serveur.close();
      resolve(c);
    } else {
      res.end(`<p>Aucun code reçu${erreur ? ` (${erreur})` : ""}.</p>`);
      if (erreur) {
        serveur.close();
        reject(new Error(erreur));
      }
    }
  });
  serveur.listen(PORT, "127.0.0.1", () => {
    console.log("\nOuvrez cette adresse dans votre navigateur, avec le compte Google de l'agenda :\n");
    console.log(url.toString());
    console.log("\nEn attente de l'autorisation…");
  });
});

const reponse = await fetch("https://oauth2.googleapis.com/token", {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: REDIRECT,
    grant_type: "authorization_code",
  }).toString(),
});
const jetons = await reponse.json();
if (!reponse.ok || !jetons.refresh_token) {
  console.error("\nÉchec de l'échange :", JSON.stringify(jetons));
  console.error("Si « refresh_token » manque : révoquez l'accès sur myaccount.google.com/permissions et relancez.");
  process.exit(1);
}

console.log("\nÀ coller dans les variables d'environnement de l'hébergement :\n");
console.log(`GOOGLE_CLIENT_ID=${clientId}`);
console.log(`GOOGLE_CLIENT_SECRET=${clientSecret}`);
console.log(`GOOGLE_REFRESH_TOKEN=${jetons.refresh_token}`);
console.log(`GOOGLE_CALENDAR_ID=primary`);
console.log("\nPuis redéployez. La page /rendez-vous lira l'agenda dès le déploiement suivant.");
