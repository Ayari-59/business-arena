import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { origineDeLaRequete } from "@/lib/origine";
import { getStaffContext } from "@/services/admin.service";
import { organisationsPourLesCohortes } from "@/services/cohortes.service";
import { GuardedForm } from "@/components/guarded-action";
import { SubmitButton } from "@/components/submit-button";
import { bouton } from "@/components/bouton";
import { adressesDeLOutil } from "@/lti/constantes";
import { etatDesCles } from "@/lti/cles";
import {
  derniersRefus,
  DUREE_JETON_INSCRIPTION_JOURS,
  listerJetons,
  listerPlateformes,
  REFUS_D_INSCRIPTION,
  type RefusDInscription,
} from "@/lti/plateformes";
import {
  ajouterDeploiementAction,
  ajouterPlateformeAction,
  basculerPlateformeAction,
  creerJetonAction,
  revoquerJetonAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Plateformes LTI",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * LES PLATEFORMES D'ENSEIGNEMENT (LTI 1.3), DEPUIS L'ADMINISTRATION GÉNÉRALE.
 *
 * Trois choses : les adresses à donner à un établissement (inscription manuelle), les
 * jetons d'inscription dynamique (l'adresse unique à coller dans Moodle, pour une
 * organisation), et les plateformes inscrites, chacune désactivable d'un clic. En bas,
 * les derniers refus : un établissement qui « n'arrive pas à lancer » s'y lit.
 */

const FAITS: Record<string, string> = {
  jeton: "Jeton d'inscription créé : donnez l'adresse ci-dessous à l'établissement.",
  revoque: "Jeton révoqué : son adresse n'inscrit plus rien.",
  plateforme: "Plateforme enregistrée.",
  active: "Plateforme réactivée.",
  desactive: "Plateforme désactivée : ses lancements sont refusés.",
  deploiement: "Déploiement ajouté.",
};

/** Les champs de l'inscription manuelle, tels que l'action les lit. */
const CHAMPS_DE_PLATEFORME = [
  { name: "nom", libelle: "Nom (libre)", exemple: "Moodle du lycée" },
  { name: "issuer", libelle: "Émetteur (issuer)", exemple: "https://moodle.lycee.fr" },
  { name: "clientId", libelle: "client_id", exemple: "" },
  { name: "deploymentIds", libelle: "deployment_id (séparés par des virgules)", exemple: "1" },
  { name: "urlAuthentification", libelle: "Adresse d'authentification OIDC", exemple: "https://moodle.lycee.fr/mod/lti/auth.php" },
  { name: "urlJeton", libelle: "Adresse de jeton", exemple: "https://moodle.lycee.fr/mod/lti/token.php" },
  { name: "urlJwks", libelle: "Adresse des clés publiques (JWKS)", exemple: "https://moodle.lycee.fr/mod/lti/certs.php" },
] as const;

const date = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });

function Adresse({ libelle, valeur }: { libelle: string; valeur: string }) {
  return (
    <div className="grid gap-0.5 sm:grid-cols-[14rem_1fr] sm:gap-3">
      <dt className="text-sm text-slate-400">{libelle}</dt>
      <dd className="min-w-0 break-all font-mono text-sm text-slate-100">{valeur}</dd>
    </div>
  );
}

export default async function AdminLtiPage({
  searchParams,
}: {
  searchParams: Promise<{ fait?: string; refus?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const context = await getStaffContext(session.userId);
  if (!context?.isPlatformAdmin) redirect("/teacher");
  const { fait, refus } = await searchParams;
  const origine = await origineDeLaRequete();
  const a = adressesDeLOutil(origine);
  const [plateformes, jetons, organisations, refusRecents] = await Promise.all([
    listerPlateformes(),
    listerJetons(),
    organisationsPourLesCohortes(),
    derniersRefus(20),
  ]);
  const cles = etatDesCles();
  const maintenant = new Date();
  const choixOrganisation = (
    <select name="organisation" required defaultValue="" aria-label="Organisation" className="champ px-3 py-2 text-sm">
      <option value="" disabled>
        Choisir l&apos;organisation
      </option>
      {organisations.map((o) => (
        <option key={o.id} value={o.id}>
          {o.nom}
        </option>
      ))}
    </select>
  );

  return (
    <main id="main" className="mx-auto max-w-5xl space-y-8 p-6" data-admin-lti="">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-annonce text-slate-400">Administration générale</p>
          <h1 className="text-2xl font-bold">Plateformes d&apos;enseignement (LTI 1.3)</h1>
        </div>
        <nav className="flex flex-wrap gap-4 text-xs text-slate-400">
          <Link href="/admin" className="hover:text-slate-300">
            ← Plateforme
          </Link>
          <Link href="/integration" className="hover:text-slate-300">
            Guide de l&apos;établissement
          </Link>
        </nav>
      </header>

      {fait && FAITS[fait] ? (
        <p role="status" className="text-sm text-emerald-300">
          {FAITS[fait]}
        </p>
      ) : null}

      <section className="carte grid gap-3 p-5" data-cles-lti="">
        <h2 className="text-lg font-bold text-slate-50">Clé de l&apos;outil</h2>
        {cles.pret ? (
          <p className="text-sm text-slate-300">
            {cles.ephemere
              ? "Clé de développement, tirée au démarrage du serveur : posez LTI_PRIVATE_KEY avant la production."
              : `Clé en place (${cles.nombre} clé${cles.nombre > 1 ? "s" : ""} publiée${cles.nombre > 1 ? "s" : ""}).`}{" "}
            Identifiant : <code className="font-mono text-slate-100">{cles.kid}</code>
          </p>
        ) : (
          <p role="alert" className="text-sm text-red-300">
            LTI_PRIVATE_KEY manque : aucun lancement n&apos;aboutit tant qu&apos;elle n&apos;est pas posée (voir
            scripts/lti-cle.mts).
          </p>
        )}
      </section>

      <section className="carte grid gap-3 p-5" data-adresses-lti="">
        <h2 className="text-lg font-bold text-slate-50">Les adresses à donner à l&apos;établissement</h2>
        <p className="max-w-2xl text-sm text-slate-400">
          Pour une inscription manuelle : l&apos;établissement les recopie dans sa plateforme (Moodle : Administration
          du site, Plugins, Outils externes, Gérer les outils, « configurer un outil manuellement »), puis vous envoie
          en retour l&apos;émetteur, le client_id, le deployment_id et ses trois adresses, à saisir plus bas.
        </p>
        <dl className="grid gap-2">
          <Adresse libelle="Adresse de l'outil (lancement)" valeur={a.lancement} />
          <Adresse libelle="Connexion OIDC (login initiation)" valeur={a.connexion} />
          <Adresse libelle="Redirection (redirect URI)" valeur={a.redirection} />
          <Adresse libelle="Sélection de contenu (deep linking)" valeur={a.selection} />
          <Adresse libelle="Clés publiques (JWKS)" valeur={a.jwks} />
          <Adresse libelle="Type de clé" valeur="Adresse de jeu de clés (JWKS), RS256" />
          <Adresse libelle="Conteneur de lancement" valeur="Nouvelle fenêtre" />
        </dl>
      </section>

      <section id="jetons" className="carte grid gap-3 p-5" data-jetons-lti="">
        <h2 className="text-lg font-bold text-slate-50">Inscription dynamique</h2>
        <p className="max-w-2xl text-sm text-slate-400">
          La voie la plus simple : un jeton pour l&apos;organisation, et l&apos;établissement colle l&apos;adresse dans sa
          plateforme (Moodle 3.10 et suivants : « URL d&apos;inscription de l&apos;outil »). Le jeton ne sert qu&apos;une
          fois, pendant {DUREE_JETON_INSCRIPTION_JOURS} jours, et rattache la plateforme à l&apos;organisation choisie.
        </p>
        <GuardedForm action={creerJetonAction} label="création d'un jeton d'inscription LTI">
          <div className="flex flex-wrap items-end gap-3">
            {choixOrganisation}
            <SubmitButton pendingLabel="Création…" className={bouton({})}>
              Créer un jeton d&apos;inscription
            </SubmitButton>
          </div>
        </GuardedForm>
        {refus === "organisation" ? (
          <p role="alert" className="text-sm text-red-300">
            Choisissez l&apos;organisation.
          </p>
        ) : null}
        <ul className="grid gap-2">
          {jetons.map((j) => {
            const etat = j.utiliseLe
              ? `utilisé le ${date(j.utiliseLe)}`
              : j.expireLe <= maintenant
                ? "expiré ou révoqué"
                : `valable jusqu'au ${date(j.expireLe)}`;
            const utilisable = !j.utiliseLe && j.expireLe > maintenant;
            return (
              <li key={j.id} className="grid gap-1 rounded-lg border border-white/10 p-3" data-jeton-lti={utilisable ? "" : undefined}>
                <p className="text-sm text-slate-200">
                  <span className="font-semibold">{j.organisation}</span> · {etat}
                </p>
                {utilisable ? (
                  <>
                    <code className="break-all font-mono text-sm text-slate-100">
                      {a.inscription}?jeton={j.jeton}
                    </code>
                    <GuardedForm action={revoquerJetonAction.bind(null, j.id)} label="révocation d'un jeton LTI">
                      <SubmitButton pendingLabel="Révocation…" className="text-sm text-slate-300 underline hover:text-slate-100">
                        Révoquer
                      </SubmitButton>
                    </GuardedForm>
                  </>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section id="plateformes" className="grid gap-3" data-plateformes-lti="">
        <h2 className="text-lg font-bold text-slate-50">
          {plateformes.length} plateforme{plateformes.length > 1 ? "s" : ""} inscrite{plateformes.length > 1 ? "s" : ""}
        </h2>
        <ul className="grid gap-3">
          {plateformes.map((p) => (
            <li key={p.id} className="carte grid gap-2 p-4">
              <p className="flex flex-wrap items-baseline gap-x-3">
                <span className="font-semibold text-slate-50">{p.nom}</span>
                <span className={`text-sm ${p.actif ? "text-emerald-300" : "text-red-300"}`}>
                  {p.actif ? "active" : "désactivée"}
                </span>
                <span className="text-sm text-slate-400">
                  {p.organisation} · inscription {p.inscription} · {date(p.createdAt)}
                </span>
              </p>
              <dl className="grid gap-1">
                <Adresse libelle="Émetteur (issuer)" valeur={p.issuer} />
                <Adresse libelle="client_id" valeur={p.clientId} />
                <Adresse libelle="Déploiements" valeur={p.deploymentIds.join(", ") || "aucun : les lancements sont refusés"} />
                <Adresse libelle="Authentification" valeur={p.urlAuthentification} />
                <Adresse libelle="Jeton" valeur={p.urlJeton} />
                <Adresse libelle="JWKS" valeur={p.urlJwks} />
              </dl>
              <div className="flex flex-wrap items-end gap-4">
                <GuardedForm action={ajouterDeploiementAction.bind(null, p.id)} label="ajout d'un déploiement LTI">
                  <div className="flex flex-wrap items-end gap-2">
                    <input
                      name="deploymentId"
                      aria-label="deployment_id à ajouter"
                      placeholder="deployment_id"
                      className="champ px-3 py-1.5 text-sm"
                    />
                    <SubmitButton pendingLabel="Ajout…" className="text-sm text-slate-300 underline hover:text-slate-100">
                      Ajouter le déploiement
                    </SubmitButton>
                  </div>
                </GuardedForm>
                <GuardedForm action={basculerPlateformeAction.bind(null, p.id, !p.actif)} label="activation d'une plateforme LTI">
                  <SubmitButton pendingLabel="Enregistrement…" className="text-sm text-slate-300 underline hover:text-slate-100">
                    {p.actif ? "Désactiver" : "Réactiver"}
                  </SubmitButton>
                </GuardedForm>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section id="ajout" className="carte grid gap-3 p-5">
        <h2 className="text-lg font-bold text-slate-50">Ajouter une plateforme à la main</h2>
        {refus && refus in REFUS_D_INSCRIPTION ? (
          <p role="alert" className="text-sm text-red-300">
            {REFUS_D_INSCRIPTION[refus as RefusDInscription]}
          </p>
        ) : null}
        <GuardedForm action={ajouterPlateformeAction} label="inscription manuelle d'une plateforme LTI" className="grid gap-3 sm:grid-cols-2">
          {CHAMPS_DE_PLATEFORME.map(({ name, libelle, exemple }) => (
            <label key={name} className="grid gap-1">
              <span className="text-xs uppercase tracking-wide text-slate-400">{libelle}</span>
              <input name={name} required={name !== "nom"} placeholder={exemple} className="champ px-3 py-2 text-sm" />
            </label>
          ))}
          <label className="grid gap-1">
            <span className="text-xs uppercase tracking-wide text-slate-400">Organisation (sa licence s&apos;applique)</span>
            {choixOrganisation}
          </label>
          <div className="sm:col-span-2">
            <SubmitButton pendingLabel="Enregistrement…" className={bouton({ variante: "secondaire" })}>
              Enregistrer la plateforme
            </SubmitButton>
          </div>
        </GuardedForm>
      </section>

      <section className="grid gap-2" data-refus-lti="">
        <h2 className="text-lg font-bold text-slate-50">Derniers refus</h2>
        {refusRecents.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun refus enregistré.</p>
        ) : (
          <ul className="grid gap-1 text-sm text-slate-300">
            {refusRecents.map((r) => (
              <li key={r.id}>
                {r.createdAt.toLocaleString("fr-FR")} · {r.etape} · {r.motif}
                {r.issuer ? <span className="text-slate-400"> · {r.issuer}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
