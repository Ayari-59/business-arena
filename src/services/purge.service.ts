import { and, eq, isNotNull, lt, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  demandesDeDevis,
  episodeParties,
  games,
  loginAttempts,
  orientationRequests,
  phoneAppointments,
  users,
} from "@/db/schema";
import {
  AVERTISSEMENT_AVANT_SUPPRESSION_JOURS,
  DEMANDES_JOURS,
  ENSEIGNANTS_INACTIFS_JOURS,
  EXAMENS_JOURS,
  INVITES_INACTIFS_JOURS,
  IP_DES_PARTIES_SOLO_JOURS,
  PARTIES_ET_RESULTATS_JOURS,
  TENTATIVES_DE_CONNEXION_HEURES,
  enAnnees,
  heures,
  jours,
} from "@/config/conservation";
import { SITE_URL } from "@/config/site";
import { envoyerCourriel } from "@/lib/courriel";
import {
  ADRESSE_D_INVITE,
  ADRESSE_DE_DEMO,
  supprimerCompteEnseignant,
  supprimerDesEleves,
  supprimerDesExamens,
  supprimerDesParties,
} from "@/services/effacement.service";
import { purgerLesJetonsExpires } from "@/services/mot-de-passe-oublie.service";

/**
 * LA PURGE DE CHAQUE NUIT : appliquer les durées de conservation (config/conservation.ts).
 *
 * Lancée par la tâche planifiée de Vercel (vercel.json → /api/cron/purge). Deux parties :
 *  · `seuilsDePurge`, PURE : à partir de l'heure courante, la date avant laquelle chaque
 *    donnée part. Rien d'autre ne fixe une durée ;
 *  · `purger`, qui applique ces seuils à la base, dans un ordre qui respecte les clés du
 *    schéma (les suppressions passent par services/effacement.service.ts, qui lève les
 *    quatre clés `restrict` dans le bon ordre).
 *
 * Chaque étape se suffit : une purge interrompue reprend la nuit suivante là où elle
 * s'était arrêtée, sans jamais rien supprimer de plus que ce que les durées autorisent.
 */

export interface SeuilsDePurge {
  /** Tentatives de connexion créées avant : supprimées. */
  tentatives: Date;
  /** Parties solo créées avant : leur adresse IP est effacée. */
  ipSolo: Date;
  /** Élèves sans compte sans activité depuis : supprimés. */
  invites: Date;
  /** Parties (et parties d'épisodes) sans activité depuis : supprimées. */
  parties: Date;
  /** Examens terminés avant : supprimés, avec les noms, numéros et notes. */
  examens: Date;
  /** Comptes enseignants sans connexion depuis : avertis par e-mail. */
  enseignantsAAvertir: Date;
  /** Comptes enseignants sans connexion depuis : supprimés, s'ils ont été avertis. */
  enseignantsASupprimer: Date;
  /** Un avertissement envoyé avant cette date a laissé un mois pour réagir. */
  avertisAvant: Date;
  /** Demandes dont le dernier contact est antérieur : supprimées. */
  demandes: Date;
}

/** Les seuils de la purge à l'instant `maintenant`. Fonction pure. */
export function seuilsDePurge(maintenant: Date): SeuilsDePurge {
  const t = maintenant.getTime();
  const avant = (ms: number) => new Date(t - ms);
  return {
    tentatives: avant(heures(TENTATIVES_DE_CONNEXION_HEURES)),
    ipSolo: avant(jours(IP_DES_PARTIES_SOLO_JOURS)),
    invites: avant(jours(INVITES_INACTIFS_JOURS)),
    parties: avant(jours(PARTIES_ET_RESULTATS_JOURS)),
    examens: avant(jours(EXAMENS_JOURS)),
    enseignantsAAvertir: avant(jours(ENSEIGNANTS_INACTIFS_JOURS - AVERTISSEMENT_AVANT_SUPPRESSION_JOURS)),
    enseignantsASupprimer: avant(jours(ENSEIGNANTS_INACTIFS_JOURS)),
    avertisAvant: avant(jours(AVERTISSEMENT_AVANT_SUPPRESSION_JOURS)),
    demandes: avant(jours(DEMANDES_JOURS)),
  };
}

/** Au plus autant d'e-mails d'avertissement par nuit : la suite part les nuits suivantes. */
export const AVERTISSEMENTS_PAR_NUIT = 100;

export interface BilanDePurge {
  tentatives: number;
  /** Jetons de « mot de passe oublié » expirés (services/mot-de-passe-oublie.service.ts). */
  jetonsDeReinitialisation: number;
  ipEffacees: number;
  demandes: number;
  examens: number;
  parties: number;
  partiesDEpisodes: number;
  invites: number;
  enseignantsAvertis: number;
  avertissementsNonEnvoyes: number;
  enseignantsSupprimes: number;
}

/** Les lignes renvoyées par `db.execute`, quel que soit le pilote (Neon, pg, PGlite). */
function lignes<T>(r: unknown): T[] {
  return ((r as { rows?: T[] }).rows ?? (r as T[])) as T[];
}

const ts = (d: Date) => sql`${d.toISOString()}::timestamptz`;

/**
 * LA DERNIÈRE ACTIVITÉ D'UNE PARTIE `g` : sa création, sa dernière mise à jour, sa
 * fenêtre de jeu, son dernier tour clos et sa dernière décision. C'est « la fin de la
 * partie » au sens de la durée de conservation : une partie close depuis un an, ou
 * abandonnée depuis un an, part.
 */
const activiteDeLaPartie = sql`greatest(
  g.created_at, g.updated_at, coalesce(g.closes_at, g.created_at),
  coalesce((select max(r.resolved_at) from rounds r where r.game_id = g.id), g.created_at),
  coalesce((select max(greatest(d.created_at, d.updated_at)) from decisions d join rounds r2 on r2.id = d.round_id where r2.game_id = g.id), g.created_at)
)`;

/** Le texte de l'e-mail d'avertissement avant suppression d'un compte enseignant. */
export function courrielDAvertissement(args: { nom: string; suppressionLe: Date }): { sujet: string; texte: string } {
  const date = args.suppressionLe.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Europe/Paris",
  });
  return {
    sujet: "Votre compte Business Arena sera supprimé faute de connexion",
    texte: [
      `Bonjour ${args.nom},`,
      "",
      `Votre compte enseignant Business Arena n'a pas servi depuis près de ${enAnnees(ENSEIGNANTS_INACTIFS_JOURS)} ans.`,
      `Comme l'annoncent nos mentions légales, il sera supprimé le ${date}, avec vos parties, vos classes, vos examens et les données des élèves qui y sont rattachées.`,
      "",
      "Pour le garder, il suffit de vous connecter avant cette date :",
      `${SITE_URL}/teacher/login`,
      "",
      `Vous pouvez aussi exporter vos données depuis votre espace (Mon compte) : ${SITE_URL}/teacher/compte`,
      "",
      "L'équipe Business Arena",
    ].join("\n"),
  };
}

export async function purger(
  options: { maintenant?: Date; envoyer?: typeof envoyerCourriel } = {},
): Promise<BilanDePurge> {
  const maintenant = options.maintenant ?? new Date();
  const envoyer = options.envoyer ?? envoyerCourriel;
  const s = seuilsDePurge(maintenant);

  // 1. Les tentatives de connexion (e-mail et adresse IP).
  const tentatives = (
    await db.delete(loginAttempts).where(lt(loginAttempts.createdAt, s.tentatives)).returning({ id: loginAttempts.id })
  ).length;

  // 1 bis. Les jetons de « mot de passe oublié » expirés : passé leur heure, ils ne servent plus.
  const jetonsDeReinitialisation = await purgerLesJetonsExpires(maintenant);

  // 2. L'adresse IP des parties solo : seule l'adresse part, la partie reste.
  const ipEffacees = (
    await db
      .update(games)
      .set({ creatorIp: null })
      .where(and(isNotNull(games.creatorIp), lt(games.createdAt, s.ipSolo)))
      .returning({ id: games.id })
  ).length;

  // 3. Les demandes de devis, de rendez-vous et d'orientation, 3 ans après le dernier contact.
  const devis = await db
    .delete(demandesDeDevis)
    .where(
      sql`greatest(${demandesDeDevis.createdAt}, ${demandesDeDevis.updatedAt}, coalesce(${demandesDeDevis.traiteeLe}, ${demandesDeDevis.createdAt})) < ${ts(s.demandes)}`,
    )
    .returning({ id: demandesDeDevis.id });
  const rdv = await db
    .delete(phoneAppointments)
    .where(
      sql`greatest(${phoneAppointments.createdAt}, ${phoneAppointments.updatedAt}, ${phoneAppointments.endsAt}, coalesce(${phoneAppointments.cancelledAt}, ${phoneAppointments.createdAt})) < ${ts(s.demandes)}`,
    )
    .returning({ id: phoneAppointments.id });
  const orientation = await db
    .delete(orientationRequests)
    .where(
      sql`greatest(${orientationRequests.createdAt}, ${orientationRequests.updatedAt}, coalesce(${orientationRequests.handledAt}, ${orientationRequests.createdAt})) < ${ts(s.demandes)}`,
    )
    .returning({ id: orientationRequests.id });

  // 4. Les examens, 1 an après l'examen (fermeture, clôture ou dernière copie remise).
  const examensPerimes = lignes<{ id: string }>(
    await db.execute(sql`
      select e.id from examens e
      where greatest(
        e.created_at, coalesce(e.fermeture, e.created_at), coalesce(e.clos_le, e.created_at),
        coalesce((select max(greatest(c.commence_le, coalesce(c.remis_le, c.commence_le))) from examen_candidats c where c.examen_id = e.id), e.created_at)
      ) < ${ts(s.examens)}`),
  ).map((r) => r.id);
  const examensFaits = await supprimerDesExamens(examensPerimes);

  // 5. Les parties et leurs résultats, 1 an après leur dernière activité. Les parties des
  //    comptes de démonstration restent ; une archive de tour d'essai part avec sa partie.
  const partiesPerimees = lignes<{ id: string }>(
    await db.execute(sql`
      select g.id from games g
      join users u on u.id = g.created_by
      where g.essai_de is null
        and u.email not like ${ADRESSE_DE_DEMO}
        and ${activiteDeLaPartie} < ${ts(s.parties)}`),
  ).map((r) => r.id);
  const parties = examensFaits.parties + (await supprimerDesParties(partiesPerimees));
  const partiesDEpisodes = (
    await db
      .delete(episodeParties)
      .where(lt(episodeParties.createdAt, s.parties))
      .returning({ id: episodeParties.id })
  ).length;

  // 6. Les élèves sans compte, après 12 mois sans aucune activité.
  const seuil = ts(s.invites);
  const invitesInactifs = lignes<{ id: string }>(
    await db.execute(sql`
      select u.id from users u
      where u.email like ${ADRESSE_D_INVITE}
        and u.password_hash is null and u.provenance is null and u.is_platform_admin = false
        and greatest(u.created_at, u.updated_at) < ${seuil}
        and not exists (select 1 from players p join teams t on t.id = p.team_id join games g on g.id = t.game_id
                        where p.user_id = u.id and greatest(p.created_at, p.updated_at, ${activiteDeLaPartie}) >= ${seuil})
        and not exists (select 1 from games g where g.created_by = u.id and ${activiteDeLaPartie} >= ${seuil})
        and not exists (select 1 from examen_candidats c where c.user_id = u.id and greatest(c.commence_le, coalesce(c.remis_le, c.commence_le)) >= ${seuil})
        and not exists (select 1 from episode_parties e where e.user_id = u.id and e.created_at >= ${seuil})
        and not exists (select 1 from episode_membres m where m.user_id = u.id and m.depuis >= ${seuil})
        and not exists (select 1 from cours_eleves ce where ce.user_id = u.id and ce.depuis >= ${seuil})
        and not exists (select 1 from cours_progressions cp where cp.user_id = u.id and cp.maj_le >= ${seuil})
        and not exists (select 1 from class_members cm where cm.user_id = u.id and cm.created_at >= ${seuil})
        and not exists (select 1 from competition_members k where k.user_id = u.id and greatest(k.created_at, k.updated_at) >= ${seuil})
        and not exists (select 1 from game_recoveries gr where gr.user_id = u.id and greatest(gr.created_at, gr.updated_at) >= ${seuil})
        and not exists (select 1 from learning_progress lp where lp.user_id = u.id and lp.last_event_at >= ${seuil})
        and not exists (select 1 from lti_comptes lc where lc.user_id = u.id and lc.dernier_lancement >= ${seuil})
        and not exists (select 1 from saml_comptes sc where sc.user_id = u.id and sc.derniere_venue >= ${seuil})`),
  ).map((r) => r.id);
  const invites = await supprimerDesEleves(invitesInactifs);

  // 7. Les comptes enseignants sans connexion depuis 3 ans : supprimés s'ils ont été
  //    avertis il y a au moins un mois et ne se sont pas connectés depuis…
  const derniereActivite = sql`greatest(${users.createdAt}, coalesce(${users.derniereConnexionLe}, ${users.createdAt}))`;
  const estUnEnseignant = sql`(${users.provenance} is not null or ${users.passwordHash} is not null)
    and ${users.isPlatformAdmin} = false
    and ${users.email} not like ${ADRESSE_DE_DEMO}
    and ${users.email} not like ${ADRESSE_D_INVITE}`;
  const aSupprimer = await db
    .select({ id: users.id })
    .from(users)
    .where(
      sql`${estUnEnseignant}
        and ${derniereActivite} < ${ts(s.enseignantsASupprimer)}
        and ${users.avertiInactiviteLe} is not null
        and ${users.avertiInactiviteLe} > ${derniereActivite}
        and ${users.avertiInactiviteLe} <= ${ts(s.avertisAvant)}`,
    );
  let enseignantsSupprimes = 0;
  let partiesDEnseignants = 0;
  let elevesDEnseignants = 0;
  for (const e of aSupprimer) {
    const r = await supprimerCompteEnseignant(e.id);
    if (r.ok) {
      enseignantsSupprimes += 1;
      partiesDEnseignants += r.parties;
      elevesDEnseignants += r.eleves;
    }
  }

  //    … et avertis un mois avant. Un compte sans adresse joignable (LTI, RENATER sans
  //    courriel) est noté averti : le délai d'un mois court quand même.
  const aAvertir = await db
    .select({
      id: users.id,
      email: users.email,
      nom: users.displayName,
      activite: sql<string>`${derniereActivite}`,
    })
    .from(users)
    .where(
      sql`${estUnEnseignant}
        and ${derniereActivite} < ${ts(s.enseignantsAAvertir)}
        and (${users.avertiInactiviteLe} is null or ${users.avertiInactiviteLe} <= ${derniereActivite})`,
    )
    .limit(AVERTISSEMENTS_PAR_NUIT);
  let enseignantsAvertis = 0;
  let avertissementsNonEnvoyes = 0;
  for (const e of aAvertir) {
    const finDuDelai = new Date(new Date(e.activite).getTime() + jours(ENSEIGNANTS_INACTIFS_JOURS));
    const auPlusTot = new Date(maintenant.getTime() + jours(AVERTISSEMENT_AVANT_SUPPRESSION_JOURS));
    const suppressionLe = finDuDelai > auPlusTot ? finDuDelai : auPlusTot;
    const injoignable = e.email.toLowerCase().endsWith(".business-arena.local");
    let averti = injoignable;
    if (!injoignable) {
      const c = courrielDAvertissement({ nom: e.nom, suppressionLe });
      const r = await envoyer({ a: e.email, sujet: c.sujet, texte: c.texte });
      averti = r.envoye;
    }
    if (averti) {
      await db.update(users).set({ avertiInactiviteLe: maintenant }).where(eq(users.id, e.id));
      enseignantsAvertis += 1;
    } else {
      // Sans e-mail parti, pas de compte à rebours : le compte sera averti une autre nuit.
      avertissementsNonEnvoyes += 1;
    }
  }

  return {
    tentatives,
    jetonsDeReinitialisation,
    ipEffacees,
    demandes: devis.length + rdv.length + orientation.length,
    examens: examensFaits.examens,
    parties: parties + invites.parties + partiesDEnseignants,
    partiesDEpisodes,
    invites: invites.eleves + elevesDEnseignants,
    enseignantsAvertis,
    avertissementsNonEnvoyes,
    enseignantsSupprimes,
  };
}
