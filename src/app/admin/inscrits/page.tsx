import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getStaffContext } from "@/services/admin.service";
import {
  adresseDExport,
  etablissementsAuChoix,
  filtresEnAdresse,
  FILTRES_D_OFFRE,
  JOURS_DES_NOUVEAUX,
  LIBELLES_DES_GESTES,
  LIBELLES_DE_PROVENANCE,
  LIBELLES_DE_ROLE,
  libelleDOffre,
  lireLesFiltres,
  listerCodesDInvitation,
  listerInscrits,
  lireLeJournal,
  REFUS_DE_GESTION,
  reglagesDesInscriptions,
  TAILLE_DE_PAGE,
  type FiltreDOffre,
  type Inscrit,
  type RefusDeGestion,
} from "@/services/inscrits.service";
import { OFFRES } from "@/config/tarifs";
import { VERSION_DU_TEXTE } from "@/config/nouveautes";
import { bouton } from "@/components/bouton";
import { GuardedForm } from "@/components/guarded-action";
import { SubmitButton } from "@/components/submit-button";
import { creerCodeAction, desactiverCodeAction, reglerInscriptionsAction } from "./actions";

export const metadata: Metadata = {
  title: "Enseignants inscrits",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * LES ENSEIGNANTS INSCRITS, DEPUIS L'ADMINISTRATION GÉNÉRALE.
 *
 * Demande du propriétaire : « Comment voir qui est inscrit sur le site ? Les professeurs,
 * comment les contacter ? ». Une ligne par compte du personnel (jamais un élève : voir
 * services/inscrits.service.ts), ce qu'il fait de la plateforme, et s'il a accepté les
 * nouveautés. Les compteurs en tête portent sur tous les inscrits ; la recherche, les
 * filtres et le tri ne changent que le tableau et l'export.
 *
 * Réservé à l'administrateur de la plateforme : la page renvoie les autres vers leur espace,
 * et le service relit lui-même le rôle (`requirePlatformAdmin`).
 *
 * L'adresse e-mail sert aux messages de service (licence, incident). Un envoi de nouveautés
 * part des seuls consentants (« Exporter les consentants »), avec le lien de désinscription
 * de chacun.
 */

const NOMS_DES_FILTRES: Record<FiltreDOffre, string> = {
  classe: OFFRES.classe.nom,
  programme: OFFRES.programme.nom,
  campus: OFFRES.campus.nom,
  decouverte: `${OFFRES.decouverte.nom} (sans licence de l'arène)`,
  episodes: OFFRES.episodes.nom,
};

const FAITS: Record<string, string> = {
  reglages: "Réglages des inscriptions enregistrés.",
  code: "Code d'invitation révoqué : il n'inscrit plus personne. Les comptes déjà inscrits restent.",
  "code-cree": "Code d'invitation créé.",
};

const jour = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Paris" });

function Nouveautes({ i }: { i: Inscrit }) {
  const c = i.consentement;
  if (c.consent && c.accordLe) {
    return (
      <span className="text-emerald-300" title={`Texte accepté : version ${c.version ?? "inconnue"}`}>
        oui, le {jour(c.accordLe)}
      </span>
    );
  }
  if (c.retraitLe) return <span className="text-slate-400">retiré le {jour(c.retraitLe)}</span>;
  return <span className="text-slate-400">non</span>;
}

export default async function AdminInscritsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const context = await getStaffContext(session.userId);
  if (!context?.isPlatformAdmin) redirect("/teacher");

  const parametres = await searchParams;
  const filtres = lireLesFiltres(parametres);
  const [liste, reglages, codes, etablissements, journal] = await Promise.all([
    listerInscrits(session.userId, filtres),
    reglagesDesInscriptions(session.userId),
    listerCodesDInvitation(session.userId),
    etablissementsAuChoix(session.userId),
    lireLeJournal(session.userId, { n: 15 }),
  ]);
  const { compteurs } = liste;
  const fait = typeof parametres.fait === "string" ? FAITS[parametres.fait] : undefined;
  const ignores = typeof parametres.ignores === "string" ? parametres.ignores : "";
  const codeCree = typeof parametres.code === "string" && /^[A-Z0-9]{4,16}$/.test(parametres.code) ? parametres.code : null;
  const refus =
    typeof parametres.refus === "string" && parametres.refus in REFUS_DE_GESTION
      ? REFUS_DE_GESTION[parametres.refus as RefusDeGestion]
      : null;
  const codesActifs = codes.filter((c) => c.actif);
  const filtresActifs = Boolean(filtres.q || filtres.offre || filtres.consentement || filtres.etat || filtres.nouveaux);
  const dont = [
    compteurs.invites > 0 ? `${compteurs.invites} invité${compteurs.invites > 1 ? "s" : ""}` : null,
    compteurs.desactives > 0 ? `${compteurs.desactives} désactivé${compteurs.desactives > 1 ? "s" : ""}` : null,
  ].filter((x): x is string => x !== null);
  const noteDesEnseignants = dont.length ? `dont ${dont.join(", ")} ; aucun élève` : "comptes du personnel, sans aucun élève";
  const exportFiltre = adresseDExport(filtres);
  const exportConsentants = adresseDExport(filtres, true);

  return (
    <main id="main" className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6" data-admin-inscrits="">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="surtitre">Administration générale</p>
          <h1 className="text-2xl font-bold">Enseignants inscrits</h1>
        </div>
        <nav className="flex flex-wrap gap-4 text-xs text-slate-400">
          <Link href="/admin" className="hover:text-slate-300">
            ← Plateforme
          </Link>
          <Link href="/mentions-legales" className="hover:text-slate-300">
            Mentions légales
          </Link>
        </nav>
      </header>

      {fait ? (
        <p role="status" className="text-sm text-emerald-300">
          {fait}
          {ignores ? ` Saisies ignorées (ce ne sont pas des domaines) : ${ignores}.` : ""}
          {codeCree ? (
            <>
              {" "}
              À transmettre à l&apos;établissement :{" "}
              <code className="font-mono text-slate-50" data-code-cree={codeCree}>
                {codeCree}
              </code>
            </>
          ) : null}
        </p>
      ) : null}
      {refus ? (
        <p role="alert" className="text-sm text-red-300">
          {refus}
        </p>
      ) : null}

      {/*
        LES RÉGLAGES DES INSCRIPTIONS, regroupés en tête (« la gestion des inscriptions ») :
        l'inscription libre (le réglage de la plateforme, déplacé ici depuis /admin), les
        domaines d'e-mail autorisés ou bloqués, les codes d'invitation des établissements.
        Repliés derrière leur résumé : on vient ici d'abord pour la liste.
      */}
      <details id="reglages" className="carte group p-4" data-reglages-inscriptions="" open={fait !== undefined || refus !== null || undefined}>
        <summary className="flex cursor-pointer list-none flex-wrap items-baseline gap-x-3 gap-y-1 [&::-webkit-details-marker]:hidden">
          <span className="text-base font-bold text-slate-50">Réglages des inscriptions</span>
          <span className="text-sm text-slate-400">
            Inscription libre : {reglages.inscriptionLibre ? "ouverte" : "fermée"} ·{" "}
            {reglages.domainesAutorises.length === 0
              ? "tous les domaines"
              : `${reglages.domainesAutorises.length} domaine${reglages.domainesAutorises.length > 1 ? "s" : ""} autorisé${reglages.domainesAutorises.length > 1 ? "s" : ""}`}{" "}
            · {reglages.domainesBloques.length} bloqué{reglages.domainesBloques.length > 1 ? "s" : ""} · {codesActifs.length} code
            {codesActifs.length > 1 ? "s" : ""} d&apos;invitation actif{codesActifs.length > 1 ? "s" : ""}
          </span>
          <span className="text-sm text-slate-300 underline underline-offset-4 group-open:hidden">Ouvrir</span>
          <span className="hidden text-sm text-slate-300 underline underline-offset-4 group-open:inline">Replier</span>
        </summary>
        <div className="mt-4 grid gap-6 lg:grid-cols-2">
          <GuardedForm action={reglerInscriptionsAction} label="réglage des inscriptions" className="grid content-start gap-3">
            <fieldset className="grid gap-2">
              <legend className="libelle mb-1">Inscription des enseignants par le formulaire</legend>
              <label className="flex items-start gap-2 text-sm text-slate-300">
                <input
                  type="radio"
                  name="inscriptionLibre"
                  value="oui"
                  defaultChecked={reglages.inscriptionLibre}
                  className="mt-0.5 h-4 w-4 accent-amber-400"
                />
                Libre : sans code, l&apos;enseignant crée son établissement
              </label>
              <label className="flex items-start gap-2 text-sm text-slate-300">
                <input
                  type="radio"
                  name="inscriptionLibre"
                  value="non"
                  defaultChecked={!reglages.inscriptionLibre}
                  className="mt-0.5 h-4 w-4 accent-amber-400"
                />
                Sur code d&apos;invitation d&apos;un établissement seulement
              </label>
            </fieldset>
            <label className="grid gap-1">
              <span className="libelle">Domaines d&apos;e-mail autorisés (vide : tous), un par ligne</span>
              <textarea
                name="domainesAutorises"
                rows={3}
                defaultValue={reglages.domainesAutorises.join("\n")}
                placeholder={"ac-lille.fr\nuniv-lille.fr"}
                className="champ px-3 py-2 font-mono text-sm"
              />
            </label>
            <label className="grid gap-1">
              <span className="libelle">Domaines d&apos;e-mail bloqués (prioritaires), un par ligne</span>
              <textarea
                name="domainesBloques"
                rows={3}
                defaultValue={reglages.domainesBloques.join("\n")}
                placeholder="yopmail.com"
                className="champ px-3 py-2 font-mono text-sm"
              />
            </label>
            <p className="text-xs text-slate-400">
              Un domaine couvre ses sous-domaines. Les domaines bloqués s&apos;appliquent à toute inscription par le
              formulaire ; les domaines autorisés, à l&apos;inscription libre seulement : un code d&apos;invitation valide passe
              outre. Un compte venu d&apos;une plateforme LTI ou de RENATER est authentifié par son établissement.
            </p>
            <div>
              <SubmitButton pendingLabel="Enregistrement…" className={bouton({ variante: "secondaire", taille: "s" })}>
                Enregistrer les réglages
              </SubmitButton>
            </div>
          </GuardedForm>

          <section id="codes" className="grid content-start gap-2" data-codes-invitation="">
            <h2 className="libelle">Codes d&apos;invitation des établissements</h2>
            <p className="text-xs text-slate-400">
              Un code inscrit un enseignant dans son établissement même quand l&apos;inscription libre est fermée.
            </p>
            {/* GuardedForm ne transmet pas les attributs data-* : le repère est sur l'enveloppe. */}
            <div data-creer-code="">
              <GuardedForm action={creerCodeAction} label="création d'un code d'invitation" className="flex flex-wrap items-end gap-2">
                <select
                  name="organisation"
                  required
                  defaultValue=""
                  aria-label="Établissement du code"
                  className="champ min-w-0 max-w-full flex-[1_1_12rem] px-3 py-2 text-sm"
                >
                  <option value="" disabled>
                    Choisir l&apos;établissement
                  </option>
                  {etablissements.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.nom}
                    </option>
                  ))}
                </select>
                <select name="role" defaultValue="teacher" aria-label="Rôle donné par le code" className="champ px-3 py-2 text-sm">
                  <option value="teacher">{LIBELLES_DE_ROLE.teacher}</option>
                  <option value="org_admin">{LIBELLES_DE_ROLE.org_admin}</option>
                </select>
                <SubmitButton pendingLabel="Création…" className={bouton({ variante: "secondaire", taille: "s" })}>
                  Créer un code
                </SubmitButton>
              </GuardedForm>
            </div>
            {codes.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun code pour l&apos;instant.</p>
            ) : (
              <ul className="grid max-h-80 gap-1 overflow-y-auto pr-1 text-sm">
                {codes.map((c) => (
                  <li
                    key={c.id}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/5 py-1.5"
                    data-code-invitation={c.code}
                  >
                    <code className={`font-mono ${c.actif ? "text-slate-100" : "text-slate-400 line-through"}`}>{c.code}</code>
                    <span className="min-w-0 flex-1 text-slate-300">
                      {c.etablissement} <span className="text-slate-400">· {LIBELLES_DE_ROLE[c.role]}</span>
                    </span>
                    {/* L'usage : les comptes inscrits par ce code (depuis la migration 0040). */}
                    {c.utilisations > 0 ? (
                      <Link
                        href={`/admin/inscrits?q=${c.code}`}
                        className="text-slate-300 underline underline-offset-4 hover:text-slate-100"
                        data-usage-code={c.utilisations}
                        title={c.derniereUtilisationLe ? `Dernière inscription le ${jour(c.derniereUtilisationLe)}` : undefined}
                      >
                        {c.utilisations} inscrit{c.utilisations > 1 ? "s" : ""}
                      </Link>
                    ) : (
                      <span className="text-slate-400" data-usage-code="0">
                        aucun inscrit
                      </span>
                    )}
                    {c.actif ? (
                      <GuardedForm action={desactiverCodeAction.bind(null, c.id)} label="révocation d'un code d'invitation">
                        <SubmitButton pendingLabel="…" className="text-sm text-slate-300 underline hover:text-slate-100">
                          Révoquer
                        </SubmitButton>
                      </GuardedForm>
                    ) : (
                      <span className="text-slate-400">révoqué</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-slate-400">
              Il n&apos;existe pas d&apos;invitation par e-mail : un établissement transmet son code à ses enseignants, qui le
              saisissent à l&apos;inscription.
            </p>
          </section>
        </div>
      </details>

      {/* Les compteurs : sur TOUS les inscrits, quels que soient les filtres. */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-5" data-compteurs-inscrits="">
        {(
          [
            [
              "Enseignants",
              compteurs.enseignants,
              noteDesEnseignants,
            ],
            ["Établissements", compteurs.etablissements, "où enseigne au moins un inscrit"],
            ["Sous licence", compteurs.etablissementsSousLicence, "établissements, licence en cours"],
            ["Consentants", compteurs.consentants, "acceptent les nouveautés"],
            [`Nouveaux (${JOURS_DES_NOUVEAUX} j)`, compteurs.nouveaux, `inscrits depuis ${JOURS_DES_NOUVEAUX} jours`],
          ] as const
        ).map(([label, valeur, note]) => (
          <div key={label} className="carte p-4" data-compteur={label}>
            <p className="libelle">{label}</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-50">{valeur}</p>
            <p className="mt-1 text-xs text-slate-400">{note}</p>
          </div>
        ))}
      </section>

      {/* Recherche et filtres : un formulaire GET, l'adresse garde l'état (et se partage). */}
      <form method="get" className="carte grid gap-3 p-4" data-filtres-inscrits="" role="search">
        <div className="flex flex-wrap items-end gap-3">
          <label className="grid min-w-0 flex-[1_1_16rem] gap-1">
            <span className="libelle">Rechercher</span>
            <input
              type="search"
              name="q"
              defaultValue={filtres.q}
              placeholder="Nom, e-mail ou établissement"
              className="champ w-full px-3 py-2 text-sm"
            />
          </label>
          <label className="grid gap-1">
            <span className="libelle">Offre</span>
            <select name="offre" defaultValue={filtres.offre ?? ""} className="champ px-3 py-2 text-sm">
              <option value="">Toutes</option>
              {FILTRES_D_OFFRE.map((o) => (
                <option key={o} value={o}>
                  {NOMS_DES_FILTRES[o]}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1">
            <span className="libelle">Nouveautés</span>
            <select name="consentement" defaultValue={filtres.consentement ?? ""} className="champ px-3 py-2 text-sm">
              <option value="">Tous</option>
              <option value="oui">Consentants</option>
              <option value="non">Non consentants</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className="libelle">État</span>
            <select name="etat" defaultValue={filtres.etat ?? ""} className="champ px-3 py-2 text-sm">
              <option value="">Tous</option>
              <option value="actif">Actifs (invités compris)</option>
              <option value="invite">Invités (inscrits par un code)</option>
              <option value="desactive">Désactivés</option>
            </select>
          </label>
          <label className="grid gap-1">
            <span className="libelle">Tri</span>
            <select name="tri" defaultValue={filtres.tri} className="champ px-3 py-2 text-sm">
              <option value="recents">Inscription : plus récents</option>
              <option value="anciens">Inscription : plus anciens</option>
            </select>
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          <label className="flex items-center gap-2 text-sm text-slate-300">
            <input
              type="checkbox"
              name="nouveaux"
              value="1"
              defaultChecked={filtres.nouveaux}
              className="h-4 w-4 accent-amber-400"
            />
            Inscrits depuis {JOURS_DES_NOUVEAUX} jours
          </label>
          {/* Un formulaire GET : le navigateur montre lui-même le chargement de la page. */}
          <button className={bouton({ variante: "secondaire", taille: "s" })}>Filtrer</button>
          {filtresActifs ? (
            <Link href="/admin/inscrits" className="text-sm text-slate-300 underline underline-offset-4 hover:text-slate-100">
              Effacer les filtres
            </Link>
          ) : null}
        </div>
      </form>

      <section className="grid gap-3" aria-labelledby="titre-liste">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="titre-liste" className="text-lg font-bold text-slate-50" data-total-inscrits={liste.total}>
            {liste.total} inscrit{liste.total > 1 ? "s" : ""}
            {filtresActifs ? " pour ces filtres" : ""}
          </h2>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {/* Des liens, pas des boutons : un téléchargement ne change rien sur le serveur. */}
            <a href={exportFiltre} className="text-slate-200 underline underline-offset-4 hover:text-slate-50" data-export-inscrits="">
              Exporter en CSV{filtresActifs ? " (ces filtres)" : ""}
            </a>
            <a
              href={exportConsentants}
              className="text-slate-200 underline underline-offset-4 hover:text-slate-50"
              data-export-consentants=""
            >
              Exporter les consentants (envoi de nouveautés)
            </a>
          </div>
        </div>

        {liste.lignes.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun inscrit ne répond à ces critères.</p>
        ) : (
          // LE TABLEAU DÉFILE DANS SON CONTENEUR : à 390 px, la page ne déborde pas.
          <div
            className="overflow-x-auto rounded-lg border border-white/10"
            data-tableau-inscrits=""
            role="region"
            aria-labelledby="titre-liste"
            tabIndex={0}
          >
            <table className="w-full min-w-[1080px] text-sm">
              <thead>
                <tr className="text-left libelle">
                  <th scope="col" className="px-3 py-2 font-medium">Enseignant</th>
                  <th scope="col" className="px-3 py-2 font-medium">Établissement et rôle</th>
                  <th scope="col" className="px-3 py-2 font-medium">Offre en cours</th>
                  <th scope="col" className="px-3 py-2 font-medium">Inscrit le</th>
                  <th scope="col" className="px-3 py-2 font-medium">Dernière connexion</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Parties</th>
                  <th scope="col" className="px-3 py-2 text-right font-medium">Cohortes</th>
                  <th scope="col" className="px-3 py-2 font-medium">Provenance</th>
                  <th scope="col" className="px-3 py-2 font-medium">État</th>
                  <th scope="col" className="px-3 py-2 font-medium">Nouveautés</th>
                </tr>
              </thead>
              <tbody className="align-top text-slate-300">
                {liste.lignes.map((i) => (
                  <tr key={i.id} className="border-t border-white/5" data-inscrit={i.id}>
                    <td className="px-3 py-2">
                      {/* Le nom ouvre la fiche : désactiver, rattacher, retirer. */}
                      <Link
                        href={`/admin/inscrits/${i.id}`}
                        className="block font-medium text-slate-100 underline-offset-4 hover:underline"
                        data-nom-inscrit=""
                      >
                        {i.nom}
                      </Link>
                      {i.email ? (
                        <a href={`mailto:${i.email}`} className="break-all text-slate-300 underline-offset-4 hover:underline">
                          {i.email}
                        </a>
                      ) : (
                        <span className="text-slate-400">aucune adresse transmise</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <ul className="grid gap-0.5">
                        {i.etablissements.map((e) => (
                          <li key={e.id}>
                            {e.nom} <span className="text-slate-400">· {LIBELLES_DE_ROLE[e.role]}</span>
                          </li>
                        ))}
                        {i.adminPlateforme ? <li className="text-slate-400">Administration de la plateforme</li> : null}
                      </ul>
                    </td>
                    <td className="px-3 py-2">{libelleDOffre(i.offre)}</td>
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums">{jour(i.inscritLe)}</td>
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                      {i.derniereConnexionLe ? jour(i.derniereConnexionLe) : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{i.partiesDeClasse}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{i.cohortes}</td>
                    <td className="px-3 py-2">{LIBELLES_DE_PROVENANCE[i.provenance]}</td>
                    <td className="whitespace-nowrap px-3 py-2" data-etat={i.etat}>
                      {i.etat === "desactive" ? (
                        <span className="text-red-300">désactivé</span>
                      ) : i.etat === "invite" ? (
                        <span title={`Inscrit par le code ${i.invitation?.code} (${i.invitation?.etablissement})`}>
                          invité <span className="font-mono text-xs text-slate-400">{i.invitation?.code}</span>
                        </span>
                      ) : (
                        "actif"
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <Nouveautes i={i} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {liste.pages > 1 ? (
          <nav aria-label="Pages" className="flex flex-wrap items-center gap-4 text-sm text-slate-300" data-pagination="">
            {liste.page > 1 ? (
              <Link href={`/admin/inscrits${filtresEnAdresse(filtres, { page: liste.page - 1 })}`} className="underline underline-offset-4">
                ← Précédents
              </Link>
            ) : null}
            <span>
              Page {liste.page} sur {liste.pages} · {TAILLE_DE_PAGE} par page
            </span>
            {liste.page < liste.pages ? (
              <Link href={`/admin/inscrits${filtresEnAdresse(filtres, { page: liste.page + 1 })}`} className="underline underline-offset-4">
                Suivants →
              </Link>
            ) : null}
          </nav>
        ) : null}
      </section>

      {/* LE JOURNAL : chaque geste de gestion (désactivation, rattachement, réglages, codes). */}
      <section className="carte grid gap-2 p-4" data-journal-inscrits="" aria-labelledby="titre-journal">
        <h2 id="titre-journal" className="text-sm font-semibold text-slate-200">
          Journal des gestes
        </h2>
        {journal.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun geste enregistré.</p>
        ) : (
          <ul className="grid gap-1 text-sm">
            {journal.map((j) => (
              <li key={j.id} className="flex flex-wrap gap-x-2 border-t border-white/5 py-1 text-slate-300" data-geste={j.geste}>
                <span className="tabular-nums text-slate-400">
                  {j.le.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" })}
                </span>
                <span className="text-slate-100">{LIBELLES_DES_GESTES[j.geste] ?? j.geste}</span>
                {j.cible ? (
                  <Link href={`/admin/inscrits/${j.cible.id}`} className="underline underline-offset-4 hover:text-slate-100">
                    {j.cible.nom}
                  </Link>
                ) : null}
                {j.detail ? <span className="min-w-0 break-words text-slate-400">{j.detail}</span> : null}
                <span className="text-slate-400">· par {j.admin ?? "compte supprimé"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-2 text-sm text-slate-400" data-regles-inscrits="">
        <h2 className="text-sm font-semibold text-slate-200">Ce que dit chaque colonne</h2>
        <ul className="grid list-disc gap-1 pl-5">
          <li>
            Seuls les comptes du personnel figurent ici (enseignants, administrateurs d&apos;établissement, administration
            de la plateforme) : aucun élève, aucune donnée d&apos;élève, ni à l&apos;écran ni dans l&apos;export.
          </li>
          <li>
            Offre en cours : la plus grande licence en cours parmi les établissements de l&apos;enseignant ;{" "}
            {OFFRES.decouverte.nom} sans licence de l&apos;arène.
          </li>
          <li>
            Dernière connexion : enregistrée à chaque connexion (mot de passe, plateforme LTI ou établissement RENATER)
            depuis la migration 0040 ;
            « — » pour un compte qui ne s&apos;est pas reconnecté depuis.
          </li>
          <li>
            État : « invité » pour un compte actif inscrit par un code d&apos;invitation (noté depuis la migration 0040) ; un
            compte désactivé (depuis sa fiche) ne se connecte plus et sa session est coupée ; ses parties et cohortes
            restent, et la réactivation les lui rend.
          </li>
          <li>Parties : parties de classe créées (ni solo, ni concours). Cohortes : cohortes d&apos;épisodes créées.</li>
          <li>
            Nouveautés : accord donné à la case « Recevoir les nouveautés » (texte {VERSION_DU_TEXTE}), à l&apos;inscription
            ou dans l&apos;espace enseignant, et révocable d&apos;un clic. Les messages de service (licence, incident) ne
            demandent pas d&apos;accord ; un envoi de nouveautés part du seul export des consentants, qui donne le lien de
            désinscription de chacun.
          </li>
        </ul>
      </section>
    </main>
  );
}
