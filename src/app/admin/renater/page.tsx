import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getStaffContext } from "@/services/admin.service";
import { organisationsPourLesCohortes } from "@/services/cohortes.service";
import { GuardedForm } from "@/components/guarded-action";
import { SubmitButton } from "@/components/submit-button";
import { bouton } from "@/components/bouton";
import { etatDeConfiguration } from "@/saml/configuration";
import { CERTIFICAT_DE_SIGNATURE_RENATER } from "@/saml/constantes";
import { etatDeLaFederation, listerIdps } from "@/saml/federation";
import { idpsRattaches, listerRattachements } from "@/saml/etablissements";
import { derniersRefus } from "@/saml/journal";
import { rattacherAction, relireAgregatAction, retirerRattachementAction } from "./actions";

export const metadata: Metadata = {
  title: "Connexion RENATER",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * LA CONNEXION PAR L'ÉTABLISSEMENT (RENATER), DEPUIS L'ADMINISTRATION GÉNÉRALE.
 *
 * L'état de la configuration et de l'agrégat de la fédération ; la liste des IdP connus
 * (recherche) ; le rattachement d'un établissement à son organisation sous licence ;
 * les rattachements en place ; les derniers refus (« mes étudiants n'arrivent pas à se
 * connecter » s'y lit).
 */

const FAITS: Record<string, string> = {
  agregat: "Agrégat relu et vérifié.",
  rattache: "Établissement rattaché : ses enseignants entrent dans l'organisation choisie.",
  retire: "Rattachement retiré.",
};
const REFUS: Record<string, string> = {
  configuration: "La connexion n'est pas configurée : voir les variables manquantes.",
  agregat: "La relecture de l'agrégat a échoué : voir l'erreur ci-dessous.",
  organisation: "Choisissez l'organisation.",
};

const PAR_PAGE = 40;
const quand = (d: Date | null | undefined) => (d ? d.toLocaleString("fr-FR", { timeZone: "Europe/Paris" }) : "jamais");

function Ligne({ libelle, valeur }: { libelle: string; valeur: React.ReactNode }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[14rem_1fr] sm:gap-3">
      <dt className="text-sm text-slate-400">{libelle}</dt>
      <dd className="min-w-0 break-all font-mono text-sm text-slate-100">{valeur}</dd>
    </div>
  );
}

export default async function AdminRenaterPage({
  searchParams,
}: {
  searchParams: Promise<{ fait?: string; refus?: string; message?: string; q?: string; idp?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const context = await getStaffContext(session.userId);
  if (!context?.isPlatformAdmin) redirect("/teacher");
  const { fait, refus, message, q = "", idp: idpChoisi = "" } = await searchParams;

  const etat = etatDeConfiguration();
  const c = etat.pret ? etat.configuration : null;
  const federation = c?.federation ?? "test";
  const [lecture, idps, rattachements, organisations, refusRecents] = await Promise.all([
    etatDeLaFederation(federation),
    listerIdps(federation, q),
    listerRattachements(),
    organisationsPourLesCohortes(),
    derniersRefus(20),
  ]);
  const affiches = idps.slice(0, PAR_PAGE);
  const rattaches = await idpsRattaches(affiches.map((i) => i.entityId));
  const choisi = idpChoisi ? (await listerIdps(federation, idpChoisi)).find((i) => i.entityId === idpChoisi) : undefined;

  return (
    <main id="main" className="mx-auto max-w-5xl space-y-8 p-6" data-admin-renater="">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-annonce text-slate-400">Administration générale</p>
          <h1 className="text-2xl font-bold">Connexion par l&apos;établissement (RENATER)</h1>
        </div>
        <nav className="flex flex-wrap gap-4 text-xs text-slate-400">
          <Link href="/admin" className="hover:text-slate-300">
            ← Plateforme
          </Link>
          <Link href="/integration#renater" className="hover:text-slate-300">
            Guide de l&apos;établissement
          </Link>
        </nav>
      </header>

      {fait && FAITS[fait] ? (
        <p role="status" className="text-sm text-emerald-300">
          {FAITS[fait]}
        </p>
      ) : null}
      {refus && (REFUS[refus] || message) ? (
        <p role="alert" className="text-sm text-red-300">
          {refus === "rattachement" && message ? message.slice(0, 200) : REFUS[refus]}
        </p>
      ) : null}

      <section id="etat" className="carte grid gap-3 p-5" data-etat-renater="">
        <h2 className="text-lg font-bold text-slate-50">Fournisseur de services</h2>
        {c ? (
          <dl className="grid gap-2">
            <Ligne libelle="Fédération" valeur={c.federation === "production" ? "production" : "test (mise au point)"} />
            <Ligne libelle="entityID" valeur={c.entityId} />
            <Ligne libelle="Métadonnées à déclarer" valeur={c.metadonnees} />
            <Ligne libelle="ACS (HTTP-POST)" valeur={c.acs} />
            <Ligne libelle="Service de découverte" valeur={c.urlWayf} />
            <Ligne libelle="Agrégat des IdP" valeur={c.urlAgregat} />
            <Ligne libelle="Empreinte épinglée (SHA-256)" valeur={c.empreinteFederation} />
          </dl>
        ) : (
          <div role="alert" className="grid gap-1 text-sm text-red-300">
            <p>La connexion n&apos;est pas configurée : le bouton n&apos;apparaît nulle part et les routes répondent 503.</p>
            <p>Manque : {etat.pret ? "" : etat.manque.join(", ")}.</p>
            <p className="text-slate-400">
              Clés du SP : scripts/saml-cle.mts. Empreinte du certificat de RENATER : celui publié à{" "}
              <span className="break-all font-mono">{CERTIFICAT_DE_SIGNATURE_RENATER}</span>, vérifiée sur la
              documentation de la fédération.
            </p>
          </div>
        )}
        <h3 className="pt-2 font-semibold text-slate-100">Agrégat de la fédération</h3>
        <dl className="grid gap-2">
          <Ligne libelle="Dernière lecture vérifiée" valeur={quand(lecture?.luLe)} />
          <Ligne libelle="IdP retenus" valeur={lecture?.nombre ?? 0} />
          <Ligne libelle="Valable jusqu'au" valeur={quand(lecture?.valideJusquA)} />
          <Ligne libelle="Dernière tentative" valeur={quand(lecture?.derniereTentative)} />
          {lecture?.derniereErreur ? <Ligne libelle="Erreur" valeur={lecture.derniereErreur} /> : null}
        </dl>
        {c ? (
          <GuardedForm action={relireAgregatAction} label="relecture de l'agrégat RENATER">
            <SubmitButton pendingLabel="Lecture…" className={bouton({ variante: "secondaire" })}>
              Relire l&apos;agrégat maintenant
            </SubmitButton>
          </GuardedForm>
        ) : null}
      </section>

      <section id="rattacher" className="carte grid gap-4 p-5" data-rattacher-renater="">
        <h2 className="text-lg font-bold text-slate-50">Rattacher un établissement</h2>
        <p className="max-w-3xl text-sm text-slate-400">
          Les enseignants et les personnels d&apos;un établissement rattaché entrent dans l&apos;organisation choisie,
          dont la licence s&apos;applique. Un IdP seul suffit en général ; ajoutez le domaine (schacHomeOrganization)
          pour un IdP mutualisé qui sert plusieurs établissements, ou le domaine seul pour tout IdP qui l&apos;affirme
          dans ses portées.
        </p>
        <form method="get" className="flex flex-wrap items-end gap-3" data-recherche-idp="">
          <label className="grid gap-1">
            <span className="text-xs uppercase tracking-wide text-slate-400">Chercher un IdP de l&apos;agrégat</span>
            <input name="q" defaultValue={q} placeholder="université, domaine, entityID" className="champ w-72 max-w-full px-3 py-2 text-sm" />
          </label>
          <SubmitButton pendingLabel="Recherche…" className={bouton({ variante: "secondaire" })}>
            Chercher
          </SubmitButton>
        </form>
        <p className="text-sm text-slate-400">
          {idps.length} IdP {q ? `pour « ${q} »` : "connus"}
          {idps.length > PAR_PAGE ? `, ${PAR_PAGE} affichés : précisez la recherche` : ""}.
        </p>
        <ul className="grid max-h-96 gap-1 overflow-y-auto rounded-lg border border-white/10 p-2" data-idps-connus="">
          {affiches.map((i) => (
            <li key={i.entityId} className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 px-2 py-1.5" data-idp={i.entityId}>
              <span className="min-w-0">
                <span className="text-sm font-semibold text-slate-100">{i.nom}</span>{" "}
                <span className="break-all font-mono text-xs text-slate-400">{i.entityId}</span>
                {i.portees.length ? <span className="text-xs text-slate-400"> · {i.portees.join(", ")}</span> : null}
                {!i.present ? <span className="text-xs text-red-300"> · retiré de l&apos;agrégat</span> : null}
                {rattaches.has(i.entityId) ? <span className="text-xs text-emerald-300"> · rattaché</span> : null}
              </span>
              <Link
                href={`/admin/renater?q=${encodeURIComponent(q)}&idp=${encodeURIComponent(i.entityId)}#rattacher`}
                className="text-sm text-slate-300 underline hover:text-slate-100"
              >
                Choisir
              </Link>
            </li>
          ))}
        </ul>
        <GuardedForm action={rattacherAction} label="rattachement d'un établissement RENATER" className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 sm:col-span-2">
            <span className="text-xs uppercase tracking-wide text-slate-400">IdP (entityID)</span>
            <input name="idp" defaultValue={choisi?.entityId ?? idpChoisi} placeholder="https://idp.univ-exemple.fr/idp/shibboleth" className="champ px-3 py-2 font-mono text-sm" />
          </label>
          <label className="grid gap-1">
            <span className="text-xs uppercase tracking-wide text-slate-400">
              Domaine (schacHomeOrganization), facultatif{choisi?.portees.length ? ` : ${choisi.portees.join(", ")}` : ""}
            </span>
            <input name="schac" placeholder="univ-exemple.fr" className="champ px-3 py-2 font-mono text-sm" />
          </label>
          <label className="grid gap-1">
            <span className="text-xs uppercase tracking-wide text-slate-400">Nom affiché</span>
            <input name="nom" defaultValue={choisi?.nom ?? ""} placeholder="Université d'exemple" className="champ px-3 py-2 text-sm" />
          </label>
          <label className="grid gap-1 sm:col-span-2">
            <span className="text-xs uppercase tracking-wide text-slate-400">Organisation (sa licence s&apos;applique)</span>
            <select name="organisation" required defaultValue="" className="champ px-3 py-2 text-sm">
              <option value="" disabled>
                Choisir l&apos;organisation
              </option>
              {organisations.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nom}
                </option>
              ))}
            </select>
          </label>
          <div className="sm:col-span-2">
            <SubmitButton pendingLabel="Rattachement…" className={bouton()}>
              Rattacher l&apos;établissement
            </SubmitButton>
          </div>
        </GuardedForm>
      </section>

      <section id="rattachements" className="grid gap-3" data-rattachements-renater="">
        <h2 className="text-lg font-bold text-slate-50">
          {rattachements.length} établissement{rattachements.length > 1 ? "s" : ""} rattaché{rattachements.length > 1 ? "s" : ""}
        </h2>
        <ul className="grid gap-2">
          {rattachements.map((r) => (
            <li key={r.id} className="carte flex flex-wrap items-center justify-between gap-3 p-4" data-rattachement="">
              <span className="min-w-0 text-sm text-slate-300">
                <span className="font-semibold text-slate-50">{r.nom}</span> → {r.organisation}
                <span className="block break-all font-mono text-xs text-slate-400">
                  {r.idpEntityId ?? "tout IdP"}
                  {r.schac ? ` · ${r.schac}` : ""}
                </span>
              </span>
              <GuardedForm action={retirerRattachementAction.bind(null, r.id)} label="retrait d'un rattachement RENATER">
                <SubmitButton pendingLabel="Retrait…" className="text-sm text-slate-300 underline hover:text-slate-100">
                  Retirer
                </SubmitButton>
              </GuardedForm>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-2" data-refus-renater="">
        <h2 className="text-lg font-bold text-slate-50">Derniers refus</h2>
        {refusRecents.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun refus enregistré.</p>
        ) : (
          <ul className="grid gap-1 text-sm text-slate-300">
            {refusRecents.map((r) => (
              <li key={r.id}>
                {quand(r.createdAt)} · {r.etape} · {r.motif}
                {r.idpEntityId ? <span className="break-all text-slate-400"> · {r.idpEntityId}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
