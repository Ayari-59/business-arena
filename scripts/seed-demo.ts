/**
 * Seed du monde démo en ligne de commande (nécessite DATABASE_URL joignable).
 * En production, préférer le bouton « Générer le monde démo » de /admin.
 * Usage : npm run seed:demo
 */
import { seedDemoWorld } from "../src/services/demo.service";

const world = await seedDemoWorld();
if (world.created) {
  console.log("✓ Monde démo créé (mot de passe tiré au hasard, montré une seule fois)");
  console.log(`  Admin établissement : ${world.orgAdminEmail} / ${world.password}`);
  console.log(`  Enseignant          : ${world.teacherEmail} / ${world.password}`);
  console.log(`  Code partie classe  : ${world.gameJoinCode}`);
  console.log(`  Code concours       : ${world.competitionJoinCode}`);
} else {
  console.log("Monde démo déjà en place — rien à faire.");
  console.log(`  Comptes : ${world.orgAdminEmail} · ${world.teacherEmail}`);
  console.log("  Le mot de passe n'est montré qu'à la création ; /admin le renouvelle.");
}
