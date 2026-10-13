import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getStaffContext } from "@/services/admin.service";
import { EnTeteAdmin } from "@/components/en-tete-admin";
import {
  etablissementsAuChoix,
  ficheDeLInscrit,
  LIBELLES_DES_GESTES,
  LIBELLES_DE_PROVENANCE,
  LIBELLES_DE_ROLE,
  libelleDOffre,
  lireLeJournal,
  REFUS_DE_GESTION,
  type RefusDeGestion,
} from "@/services/inscrits.service";
import { GuardedForm } from "@/components/guarded-action";
import { SubmitButton } from "@/components/submit-button";
import { bouton } from "@/components/bouton";
import { desactiverCompteAction, rattacherAction, reactiverCompteAction, retirerAction } from "../actions";

export const metadata: Metadata = {
  title: "Fiche d'un inscrit",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * LA FICHE D'UN INSCRIT : ce que dit sa ligne du tableau, et les gestes de l'administrateur
 * de la plateforme (« la gestion des inscriptions ») : désactiver ou réactiver le compte,
 * le rattacher à un établissement ou l'en retirer, ouvrir la fiche de l'établissement.
 * Les règles sont dans le service (services/inscrits.service.ts), qui relit le rôle.
 */

const FAITS: Record<string, string> = {
  desactive: "Compte désactivé : il ne se connecte plus, et sa session en cours est coupée. Ses parties restent.",
  reactive: "Compte réactivé : il peut de nouveau se connecter.",
  rattache: "Rattachement enregistré.",
  retire: "Le compte a été retiré de cet établissement.",
};

const jour = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });

function Ligne({ libelle, children }: { libelle: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[13rem_1fr] sm:gap-3">
      <dt className="text-sm text-slate-400">{libelle}</dt>
      <dd className="min-w-0 break-words text-sm text-slate-100">{children}</dd>
    </div>
  );
}

export default async function FicheInscritPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ fait?: string; refus?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const context = await getStaffContext(session.userId);
  if (!context?.isPlatformAdmin) redirect("/teacher");
  const [{ id }, { fait, refus }] = await Promise.all([params, searchParams]);
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [i, etablissements, journal] = await Promise.all([
    ficheDeLInscrit(session.userId, id),
    etablissementsAuChoix(session.userId),
    lireLeJournal(session.userId, { cible: id, n: 30 }),
  ]);
  if (!i) notFound();
  const c = i.consentement;
  const soiMeme = i.id === session.userId;
  const refusLu = refus && refus in REFUS_DE_GESTION ? REFUS_DE_GESTION[refus as RefusDeGestion] : null;

  return (
    <main id="main" className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6" data-fiche-inscrit={i.id}>
      <EnTeteAdmin surtitre="Enseignants inscrits" titre={i.nom} actif="inscrits" />

      {fait && FAITS[fait] ? (
        <p role="status" className="text-sm text-emerald-300">
          {FAITS[fait]}
        </p>
      ) : null}
      {refusLu ? (
        <p role="alert" className="text-sm text-red-300">
          {refusLu}
        </p>
      ) : null}

      <section className="carte grid gap-2 p-4 sm:p-5">
        <dl className="grid gap-2">
          <Ligne libelle="État">
            <span data-etat-du-compte={i.desactiveLe ? "desactive" : "actif"} data-etat={i.etat}>
              {i.desactiveLe ? <span className="text-red-300">désactivé le {jour(i.desactiveLe)}</span> : "actif"}
              {i.invitation ? (
                <span className="text-slate-300">
                  {" "}
                  · invité : inscrit par le code <code className="font-mono">{i.invitation.code}</code> ({i.invitation.etablissement})
                </span>
              ) : null}
            </span>
          </Ligne>
          <Ligne libelle="E-mail">
            {i.email ? (
              <a href={`mailto:${i.email}`} className="break-all underline-offset-4 hover:underline">
                {i.email}
              </a>
            ) : (
              "aucune adresse transmise"
            )}
          </Ligne>
          <Ligne libelle="Provenance">{LIBELLES_DE_PROVENANCE[i.provenance]}</Ligne>
          <Ligne libelle="Inscrit le">{jour(i.inscritLe)}</Ligne>
          <Ligne libelle="Dernière connexion">{i.derniereConnexionLe ? jour(i.derniereConnexionLe) : "—"}</Ligne>
          <Ligne libelle="Offre en cours">{libelleDOffre(i.offre)}</Ligne>
          <Ligne libelle="Parties de classe créées">{i.partiesDeClasse}</Ligne>
          <Ligne libelle="Cohortes créées">{i.cohortes}</Ligne>
          <Ligne libelle="Nouveautés">
            {c.consent && c.accordLe
              ? `oui, depuis le ${jour(c.accordLe)} (texte ${c.version ?? "?"})`
              : c.retraitLe
                ? `retiré le ${jour(c.retraitLe)}`
                : "non"}
          </Ligne>
        </dl>
      </section>

      <section className="carte grid gap-3 p-4 sm:p-5" data-etablissements-de-l-inscrit="">
        <h2 className="text-lg font-bold text-slate-50">Établissements</h2>
        {i.adminPlateforme ? <p className="text-sm text-slate-300">Administration de la plateforme.</p> : null}
        {i.etablissements.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun établissement.</p>
        ) : (
          <ul className="grid gap-2">
            {i.etablissements.map((e) => (
              <li key={e.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-white/10 px-3 py-2">
                <span className="min-w-0 flex-1 text-sm text-slate-100">
                  {e.nom} <span className="text-slate-400">· {LIBELLES_DE_ROLE[e.role]}</span>
                </span>
                <Link href={`/admin#etablissement-${e.id}`} className="text-sm text-slate-300 underline underline-offset-4 hover:text-slate-100">
                  Fiche de l&apos;établissement
                </Link>
                <Link
                  href={`/admin/inscrits?q=${encodeURIComponent(e.nom)}`}
                  className="text-sm text-slate-300 underline underline-offset-4 hover:text-slate-100"
                >
                  Ses inscrits
                </Link>
                <GuardedForm action={retirerAction.bind(null, i.id, e.id)} label="retrait d'un établissement">
                  <SubmitButton pendingLabel="Retrait…" className="text-sm text-slate-300 underline hover:text-slate-100">
                    Retirer de cet établissement
                  </SubmitButton>
                </GuardedForm>
              </li>
            ))}
          </ul>
        )}
        <GuardedForm action={rattacherAction.bind(null, i.id)} label="rattachement à un établissement" className="grid gap-2">
          <p className="libelle">Rattacher à un établissement (ou y changer son rôle)</p>
          <div className="flex flex-wrap items-end gap-3">
            <select name="organisation" required defaultValue="" aria-label="Établissement" className="champ min-w-0 max-w-full px-3 py-2 text-sm">
              <option value="" disabled>
                Choisir l&apos;établissement
              </option>
              {etablissements.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nom}
                </option>
              ))}
            </select>
            <select name="role" defaultValue="teacher" aria-label="Rôle" className="champ px-3 py-2 text-sm">
              <option value="teacher">{LIBELLES_DE_ROLE.teacher}</option>
              <option value="org_admin">{LIBELLES_DE_ROLE.org_admin}</option>
            </select>
            <SubmitButton pendingLabel="Rattachement…" className={bouton({ variante: "secondaire", taille: "s" })}>
              Rattacher
            </SubmitButton>
          </div>
          <p className="text-xs text-slate-400">
            Le plafond d&apos;enseignants de la licence de l&apos;établissement s&apos;applique, comme pour un code
            d&apos;invitation. Il n&apos;existe pas d&apos;invitation par e-mail à renvoyer : l&apos;établissement transmet son
            code, listé dans les réglages des inscriptions.
          </p>
        </GuardedForm>
      </section>

      <section className="carte grid gap-3 p-4 sm:p-5" data-activation-du-compte="">
        <h2 className="text-lg font-bold text-slate-50">Accès au compte</h2>
        {i.desactiveLe ? (
          <>
            <p className="text-sm text-slate-300">
              Désactivé le {jour(i.desactiveLe)} : la connexion est refusée. Ses parties et cohortes sont intactes.
            </p>
            <GuardedForm action={reactiverCompteAction.bind(null, i.id)} label="réactivation d'un compte">
              <SubmitButton pendingLabel="Réactivation…" className={bouton({ variante: "secondaire", taille: "s" })}>
                Réactiver le compte
              </SubmitButton>
            </GuardedForm>
          </>
        ) : soiMeme || i.adminPlateforme ? (
          <p className="text-sm text-slate-400">
            {soiMeme ? REFUS_DE_GESTION["soi-meme"] : REFUS_DE_GESTION.admin}
          </p>
        ) : (
          <>
            <p className="text-sm text-slate-300">
              Désactiver : le compte ne se connecte plus et sa session en cours est coupée. Ses parties, cohortes et
              rattachements restent ; la réactivation les lui rend.
            </p>
            <GuardedForm action={desactiverCompteAction.bind(null, i.id)} label="désactivation d'un compte">
              <SubmitButton pendingLabel="Désactivation…" className={bouton({ variante: "secondaire", taille: "s" })}>
                Désactiver le compte
              </SubmitButton>
            </GuardedForm>
          </>
        )}
      </section>

      <section className="carte grid gap-2 p-4 sm:p-5" data-journal-inscrit="">
        <h2 className="text-lg font-bold text-slate-50">Journal de ce compte</h2>
        {journal.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun geste enregistré sur ce compte.</p>
        ) : (
          <ul className="grid gap-1 text-sm">
            {journal.map((j) => (
              <li key={j.id} className="flex flex-wrap gap-x-2 border-t border-white/5 py-1 text-slate-300" data-geste={j.geste}>
                <span className="tabular-nums text-slate-400">
                  {j.le.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" })}
                </span>
                <span className="text-slate-100">{LIBELLES_DES_GESTES[j.geste] ?? j.geste}</span>
                {j.detail ? <span className="min-w-0 break-words text-slate-400">{j.detail}</span> : null}
                <span className="text-slate-400">· par {j.admin ?? "compte supprimé"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
