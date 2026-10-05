/**
 * CRÉER UNE COHORTE D'ÉPISODES MANAGER.
 *
 *   npm run cohorte:creer -- "ACME · managers de proximité · automne 2026" https://business-arena.fr
 *
 * Affiche le code de la cohorte, le lien d'invitation à envoyer aux managers,
 * et le lien de l'animateur. Ce dernier ouvre les agrégats de la cohorte à qui
 * le détient : il se transmet à l'animateur seul, jamais au groupe.
 */
import { creerCohorte } from "../src/services/cohortes.service";

const [nom, site = "http://localhost:3030"] = process.argv.slice(2);
if (!nom) {
  console.error('Usage : npm run cohorte:creer -- "Nom de la cohorte" [https://adresse-du-site]');
  process.exit(1);
}
async function main() {
  const base = site.replace(/\/$/, "");
  const c = await creerCohorte(nom);
  console.log(`Cohorte « ${c.nom} » créée, code ${c.code}.`);
  console.log(
    `\nLien d'invitation, pour les managers :\n  ${base}/entreprises/episode/rejoindre?code=${c.code}`,
  );
  console.log(
    `\nLien de l'animateur, à ne pas diffuser :\n  ${base}/entreprises/episode/animation/${c.cleAnimateur}`,
  );
}

main().then(
  () => process.exit(0),
  (e) => {
    console.error(e);
    process.exit(1);
  },
);
