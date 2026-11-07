import { db, type Db } from "@/db";

/** Une requête Drizzle qu'on peut mettre dans un lot (ce qu'accepte `db.batch`). */
type RequeteDuLot = Parameters<Db["batch"]>[0][number];

/**
 * ÉCRIRE PLUSIEURS REQUÊTES QUI RÉUSSISSENT OU ÉCHOUENT ENSEMBLE.
 *
 * Le pilote HTTP de Neon (la production) refuse `db.transaction` : il lève « No transactions
 * support in neon-http driver ». Il offre en revanche `db.batch`, qui envoie le lot dans une
 * seule transaction côté serveur. node-postgres et PGlite (tests, local) n'ont pas de lot mais
 * acceptent la transaction. `construire` reçoit le client à employer et rend les requêtes, dans
 * l'ordre : avec un pilote qui sait faire un lot, elles partent en un lot ; sinon elles
 * s'exécutent dans une transaction. Une garde (tests/architecture/pas-de-transaction-sous-neon.test.ts)
 * interdit `transaction` partout ailleurs.
 */
export async function ecrireEnUnBloc(construire: (client: Db) => RequeteDuLot[]): Promise<void> {
  const client = db as unknown as {
    batch?: Db["batch"];
    transaction: (f: (tx: Db) => Promise<void>) => Promise<void>;
  };
  if (typeof client.batch === "function") {
    const requetes = construire(db);
    if (requetes.length === 0) return;
    await db.batch(requetes as [RequeteDuLot, ...RequeteDuLot[]]);
    return;
  }
  await client.transaction(async (tx) => {
    for (const requete of construire(tx)) await requete;
  });
}
