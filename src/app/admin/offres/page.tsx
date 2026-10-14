import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getStaffContext } from "@/services/admin.service";
import { lireLEtatSansCache, lireLeJournal, listerLesCodesPromo } from "@/services/catalogue.service";
import { listerLicencesGratuites } from "@/services/licence.service";
import { ConfirmForm, GuardedForm } from "@/components/guarded-action";
import { SubmitButton } from "@/components/submit-button";
import { bouton, LIEN_A_L_ENCRE } from "@/components/bouton";
import { EditeurDOffre } from "@/components/editeur-d-offre";
import { EnTeteAdmin } from "@/components/en-tete-admin";
import { utcToParisLocalInput } from "@/lib/paris-time";
import {
  dateLongue,
  erreurDeMiseEnAvant,
  estUneOffreDeLaGrille,
  euros,
  libelleDeLaRemise,
  libelleDuTarif,
  LIBELLES_DES_PUBLICS,
  LIBELLES_DES_RUBRIQUES,
  MOTIFS_DE_GRATUITE,
  parametresAreneDe,
  promotionEnCours,
  texteDuBandeau,
  type CodePromo,
  type OffreDuCatalogue,
  type ParametresArene,
} from "@/config/catalogue";
import { DUREE_MAX_D_UN_ESSAI } from "@/config/decouverte";
import { NIVEAU_MAX } from "@/config/vitrine-solo";
import { NIVEAUX as NIVEAUX_DES_EPISODES } from "@/config/episodes/niveaux";
import { catalogueDesEpisodes } from "@/config/episodes/catalogue";
import { episodeParCode } from "@/pedagogy/episodes/registre";
import { ENTREPRISES, OFFRES, variablesDuCatalogue } from "@/config/tarifs";
import {
  enregistrerCodePromoAction,
  enregistrerAffichageAction,
  enregistrerDecouverteAction,
  enregistrerEssaiAction,
  enregistrerModuleAction,
  mettreEnAvantAction,
  supprimerOffreAction,
} from "./actions";

export const metadata: Metadata = {
  title: "Offres et tarifs",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * LE CATALOGUE COMMERCIAL, DEPUIS L'ADMINISTRATION GÉNÉRALE (migration 0041).
 *
 * Demande du propriétaire : « gérer l'offre depuis le panneau admin, les gratuités, la
 * composition de plusieurs modules, la gestion des remises, des promos ». Cinq rubriques :
 *  · LES OFFRES : la liste dans l'ordre de /tarifs, la mise en avant (le seul bouton plein,
 *    qui se déplace), l'éditeur d'une offre avec l'aperçu de sa carte ;
 *  · LES MODULES : les briques vendables ; l'arène, les épisodes et l'examen individuel ont
 *    un effet (le verrou de services/acces.service.ts), les autres sont descriptifs, et
 *    l'écran le dit ;
 *  · LES GRATUITÉS : la Découverte (niveaux ouverts en solo, démonstrations), l'essai
 *    d'établissement (désactivé), les licences offertes ;
 *  · LES CODES PROMO, et la promotion affichée sur /tarifs ;
 *  · L'HISTORIQUE : qui a changé quoi, quand, avant et après.
 * Réservé à l'administrateur de la plateforme : la page le vérifie, chaque action et chaque
 * service aussi.
 */

const FAITS: Record<string, string> = {
  offre: "Offre enregistrée : /tarifs et /devis la montrent déjà.",
  "en-avant": "Mise en avant déplacée : c'est désormais le seul bouton plein de /tarifs.",
  suppression: "Offre supprimée.",
  module: "Module enregistré.",
  decouverte: "Découverte enregistrée : la règle serveur l'applique dès maintenant.",
  essai: "Réglage de l'essai enregistré.",
  code: "Code promo enregistré.",
  affichage: "Affichage des prix enregistré : les pages publiques le suivent dès maintenant.",
};

const date = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Paris" });

/** Une offre vide, à compléter. */
const NOUVELLE_OFFRE: OffreDuCatalogue = {
  code: "",
  rubrique: "arene",
  public: "enseignement",
  nom: "",
  sousTitre: "",
  tarif: "devis",
  prixCents: null,
  libelleTarif: null,
  inclus: [],
  precisions: [],
  formules: [],
  modules: [],
  mention: null,
  ordre: 45,
  visible: false,
  miseEnAvant: false,
  bouton: { libelle: "Demander un devis", cible: "" },
  devisLibelle: null,
  formulaire: "etablissement",
};

/** Le paramétrage de l'arène en clair : « 1 entreprise au choix · 1 niveau · 1 enseignant · 1 partie à la fois ». */
function parametresEnClair(p: ParametresArene): string {
  return [
    p.entreprises === "une" ? "1 entreprise au choix" : "toutes les entreprises",
    p.niveaux === "un" ? "1 niveau au choix" : "tous niveaux",
    p.enseignants === null
      ? "enseignants sans limite"
      : p.enseignants === "devis"
        ? "enseignants au devis"
        : `${p.enseignants} enseignant${p.enseignants > 1 ? "s" : ""}`,
    p.partiesEnCours === null ? "parties sans plafond" : `${p.partiesEnCours} partie${p.partiesEnCours > 1 ? "s" : ""} à la fois`,
  ].join(" · ");
}

/** L'état d'un code promo, en un mot. */
function etatDuCode(c: CodePromo, maintenant: Date): string {
  if (!c.actif) return "inactif";
  if (c.debut && maintenant < c.debut) return `à partir du ${date(c.debut)}`;
  if (c.fin && maintenant >= c.fin) return "expiré";
  if (c.utilisationsMax !== null && c.utilisations >= c.utilisationsMax) return "épuisé";
  return "valable";
}

/** Le jour de fin d'un code (sa fin est exclusive : le lendemain à minuit). */
const dernierJour = (fin: Date | null) => (fin ? utcToParisLocalInput(new Date(fin.getTime() - 1)).slice(0, 10) : "");

export default async function AdminOffresPage({
  searchParams,
}: {
  searchParams: Promise<{ offre?: string; code?: string; fait?: string; erreur?: string; section?: string; cle?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const context = await getStaffContext(session.userId);
  if (!context?.isPlatformAdmin) redirect("/teacher");
  const { offre: offreVisee, code: codeVise, fait, erreur, section } = await searchParams;
  const [etat, codes, journal, gratuites] = await Promise.all([
    lireLEtatSansCache(),
    listerLesCodesPromo(),
    lireLeJournal(60),
    listerLicencesGratuites(),
  ]);
  const { catalogue, decouverte, essai, affichage } = etat;
  const maintenant = new Date();
  const variables = variablesDuCatalogue(decouverte);
  const offres = [...catalogue.offres].sort((a, b) => a.ordre - b.ordre || a.code.localeCompare(b.code));
  const enEdition =
    offreVisee === "nouvelle" ? NOUVELLE_OFFRE : (offres.find((o) => o.code === offreVisee) ?? null);
  const codeEnEdition = codes.find((c) => c.id === codeVise) ?? null;
  const promotion = codes.find((c) => c.affiche) ?? null;
  const nomDe = (code: string) => catalogue.offres.find((o) => o.code === code)?.nom ?? code;
  const alerteMiseEnAvant = erreurDeMiseEnAvant(catalogue);
  const entreprisesDesEpisodes = catalogueDesEpisodes();
  const erreurIci = (s: string) =>
    erreur && section === s ? (
      <p role="alert" className="mt-3 rounded-lg encadre-perte px-3 py-2 text-sm text-red-300" data-erreur-catalogue="">
        {erreur}
      </p>
    ) : null;

  return (
    <main id="main" className="mx-auto max-w-6xl space-y-8 px-4 py-6 sm:px-6" data-admin-offres="">
      <EnTeteAdmin
        titre="Offres et tarifs"
        actif="offres"
        sommaire={
          <nav aria-label="Rubriques" className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-400">
            <a href="#offres" className="hover:text-slate-300">Offres</a>
            <a href="#modules" className="hover:text-slate-300">Modules</a>
            <a href="#gratuites" className="hover:text-slate-300">Gratuités</a>
            <a href="#codes" className="hover:text-slate-300">Codes promo</a>
            <a href="#historique" className="hover:text-slate-300">Historique</a>
            <Link href="/tarifs" prefetch={false} className="hover:text-slate-300">
              Voir les offres
            </Link>
          </nav>
        }
      />

      {fait && FAITS[fait] ? (
        <p role="status" className="rounded-lg encadre-neutre px-3 py-2 text-sm text-slate-100" data-fait={fait}>
          {FAITS[fait]}
        </p>
      ) : null}

      {/* L'ÉDITEUR D'UNE OFFRE, avec l'aperçu de sa carte. */}
      {enEdition ? (
        <section aria-labelledby="edition" id="edition" className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="edition" className="text-xl font-semibold text-slate-50">
              {offreVisee === "nouvelle" ? "Nouvelle offre" : `Modifier l'offre ${enEdition.nom}`}
            </h2>
            <Link href="/admin/offres#offres" className={LIEN_A_L_ENCRE}>
              Fermer sans enregistrer
            </Link>
          </div>
          <EditeurDOffre
            key={enEdition.code || "nouvelle"}
            initiale={enEdition}
            mode={offreVisee === "nouvelle" ? "creation" : "modification"}
            catalogue={catalogue}
            variables={variables}
            prixPublics={affichage.prixPublics}
            nomFige={offreVisee !== "nouvelle" && Object.hasOwn(OFFRES, enEdition.code)}
          />
        </section>
      ) : null}

      {/* LES OFFRES, dans l'ordre de /tarifs. */}
      <section aria-labelledby="offres" className="carte p-4 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="offres" className="text-lg font-semibold text-slate-100">
            Les offres
          </h2>
          <Link
            href="/admin/offres?offre=nouvelle#edition"
            className={bouton({ variante: enEdition ? "secondaire" : "principal", taille: "s" })}
          >
            Nouvelle offre
          </Link>
        </div>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-400">
          Une offre compose des modules, pose des limites et un prix (ou « sur devis »), et dit ce
          que sa carte affiche. /tarifs et /devis la lisent ; une licence vendue garde une copie de ses
          conditions. Exactement une offre est mise en avant : le seul bouton plein de /tarifs.
        </p>
        {/* L'AFFICHAGE DES PRIX (décision d'octobre 2026 : offres sur mesure, sur devis). */}
        <GuardedForm
          action={enregistrerAffichageAction}
          label="affichage des prix"
          className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-white/10 p-3"
        >
          <label className="flex items-center gap-3 text-sm text-slate-200" data-reglage-affichage="">
            <input
              type="checkbox"
              name="prixPublics"
              defaultChecked={affichage.prixPublics}
              className="h-4 w-4 accent-amber-400"
            />
            Afficher les prix sur le site
          </label>
          <span className="text-sm text-slate-400" data-etat-affichage={affichage.prixPublics ? "oui" : "non"}>
            {affichage.prixPublics
              ? "Allumé : /tarifs, les bandes de prix et la confirmation du devis montrent les prix de référence."
              : "Éteint : aucune page publique ne montre de montant ; les prix ci-dessous sont internes (devis, licences)."}
          </span>
          <SubmitButton className={bouton({ variante: "secondaire", taille: "s" })}>Enregistrer</SubmitButton>
        </GuardedForm>
        {alerteMiseEnAvant ? (
          <p role="alert" className="mt-3 rounded-lg encadre-perte px-3 py-2 text-sm text-red-300">
            {alerteMiseEnAvant}
          </p>
        ) : null}
        {erreurIci("offres")}
        <ul className="mt-4 divide-y divide-white/10" data-liste-offres="">
          {offres.map((o) => {
            const p = parametresAreneDe(o);
            return (
              <li key={o.code} className="grid gap-2 py-3 sm:grid-cols-[1fr_auto] sm:items-start" data-ligne-offre={o.code}>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-slate-100">
                    {o.nom}
                    <span className="ml-2 text-sm font-normal text-slate-400">
                      {LIBELLES_DES_RUBRIQUES[o.rubrique]} · {LIBELLES_DES_PUBLICS[o.public]}
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-slate-300">
                    <span className="tabular-nums" data-tarif-offre="">
                      {o.tarif === "prix" && o.prixCents
                        ? `${euros(o.prixCents)} par an${affichage.prixPublics ? "" : " (référence interne)"}`
                        : libelleDuTarif(o)}
                    </span>
                    {" · "}
                    {o.visible ? "visible sur /tarifs" : "masquée"}
                    {o.miseEnAvant ? (
                      <strong className="ml-2 rounded-full border border-slate-400 px-2 py-0.5 text-xs font-semibold text-slate-100" data-mise-en-avant="">
                        mise en avant
                      </strong>
                    ) : null}
                  </p>
                  {o.modules.length > 0 ? (
                    <p className="mt-0.5 text-sm text-slate-400">
                      {o.modules
                        .map((m) => {
                          const mod = catalogue.modules.find((x) => x.code === m.module);
                          return `${mod?.nom ?? m.module}${mod?.effet ? "" : " (descriptif)"}`;
                        })
                        .join(" + ")}
                      {p ? ` : ${parametresEnClair(p)}` : ""}
                    </p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/offres?offre=${encodeURIComponent(o.code)}#edition`}
                    className={bouton({ variante: "secondaire", taille: "s" })}
                  >
                    Modifier
                  </Link>
                  {o.rubrique === "arene" && o.visible && !o.miseEnAvant ? (
                    <GuardedForm action={mettreEnAvantAction} label="mise en avant d'une offre">
                      <input type="hidden" name="code" value={o.code} />
                      <SubmitButton className={bouton({ variante: "secondaire", taille: "s" })}>Mettre en avant</SubmitButton>
                    </GuardedForm>
                  ) : null}
                  {!estUneOffreDeLaGrille(o.code) && !o.miseEnAvant ? (
                    <ConfirmForm
                      action={supprimerOffreAction}
                      label="suppression d'une offre"
                      trigger="Supprimer"
                      confirmPrompt={`Supprimer ${o.nom} de /tarifs ?`}
                      triggerClassName="rounded-lg border border-red-400 px-3 py-1.5 text-xs font-semibold text-red-300 hover:bg-white/5"
                    >
                      <input type="hidden" name="code" value={o.code} />
                    </ConfirmForm>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* LES MODULES : trois ont un effet, les autres sont descriptifs. */}
      <section aria-labelledby="modules" className="carte p-4 sm:p-6">
        <h2 id="modules" className="text-lg font-semibold text-slate-100">
          Les modules
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-400">
          Les briques qu&apos;une offre compose. <strong className="text-slate-200">L&apos;arène</strong>,{" "}
          <strong className="text-slate-200">{OFFRES.episodes.nom}</strong> et{" "}
          <strong className="text-slate-200">l&apos;examen individuel</strong> ont un effet dans le produit :
          la licence qui les porte ouvre les parties de classe, les concours, les épisodes et les examens,
          et le serveur le vérifie. <strong className="text-slate-200">Les autres sont descriptifs</strong> : affichés et
          vendus, ils n&apos;ouvrent ni ne ferment rien dans le produit.
        </p>
        {erreurIci("modules")}
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {catalogue.modules.map((m) => (
            <li key={m.code} className="rounded-xl border border-white/10 p-3" data-module-catalogue={m.code}>
              <GuardedForm action={enregistrerModuleAction} label="enregistrement d'un module" className="grid gap-2">
                <input type="hidden" name="mode" value="modification" />
                <input type="hidden" name="code" value={m.code} />
                <p className="text-sm text-slate-300">
                  <span className="font-mono text-slate-400">{m.code}</span> ·{" "}
                  <span data-effet-module={m.effet ?? "descriptif"}>
                    {m.effet ? "effet dans le produit (verrou)" : "descriptif (sans verrou)"}
                  </span>
                </p>
                <label className="block text-sm text-slate-300">
                  Nom
                  <input name="nom" defaultValue={m.nom} required maxLength={80} className="mt-1 block w-full champ px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm text-slate-300">
                  Description courte
                  <textarea
                    name="description"
                    defaultValue={m.description}
                    rows={2}
                    maxLength={300}
                    className="mt-1 block w-full champ px-3 py-2 text-sm"
                  />
                </label>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input type="checkbox" name="actif" defaultChecked={m.actif} disabled={m.effet !== null} className="h-4 w-4 accent-amber-400" />
                    Actif
                    {m.effet !== null ? <input type="hidden" name="actif" value="on" /> : null}
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    Ordre
                    <input name="ordre" type="number" defaultValue={m.ordre} className="w-20 champ px-2 py-1 text-sm" />
                  </label>
                  <SubmitButton className={bouton({ variante: "secondaire", taille: "s" })}>Enregistrer</SubmitButton>
                </div>
              </GuardedForm>
            </li>
          ))}
          <li className="rounded-xl border border-dashed border-white/15 p-3">
            <GuardedForm action={enregistrerModuleAction} label="création d'un module" className="grid gap-2">
              <input type="hidden" name="mode" value="creation" />
              <p className="text-sm font-semibold text-slate-200">Nouveau module (descriptif)</p>
              <label className="block text-sm text-slate-300">
                Code
                <input name="code" required pattern="[a-z][a-z0-9\-]{1,29}" placeholder="mobilite" className="mt-1 block w-full champ px-3 py-2 text-sm" />
              </label>
              <label className="block text-sm text-slate-300">
                Nom
                <input name="nom" required maxLength={80} className="mt-1 block w-full champ px-3 py-2 text-sm" />
              </label>
              <label className="block text-sm text-slate-300">
                Description courte
                <textarea name="description" rows={2} maxLength={300} className="mt-1 block w-full champ px-3 py-2 text-sm" />
              </label>
              <input type="hidden" name="actif" value="on" />
              <input type="hidden" name="ordre" value={String((catalogue.modules.at(-1)?.ordre ?? 0) + 10)} />
              <div>
                <SubmitButton className={bouton({ variante: "secondaire", taille: "s" })}>Ajouter le module</SubmitButton>
              </div>
            </GuardedForm>
          </li>
        </ul>
      </section>

      {/* LES GRATUITÉS : la Découverte, l'essai d'établissement, les licences offertes. */}
      <section aria-labelledby="gratuites" className="carte space-y-6 p-4 sm:p-6">
        <h2 id="gratuites" className="text-lg font-semibold text-slate-100">
          Les gratuités
        </h2>
        {erreurIci("gratuites")}
        <div data-reglage-decouverte="">
          <h3 className="text-base font-semibold text-slate-200">{OFFRES.decouverte.nom} : ce qui est ouvert sans licence</h3>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-400">
            La règle serveur lit ce réglage à chaque création de partie et à chaque ouverture d&apos;épisode.
            Il remplace l&apos;ancien réglage « niveaux ouverts sans licence » de /admin. La carte
            {` ${OFFRES.decouverte.nom}`} de /tarifs le dit d&apos;elle-même (variables{" "}
            <code className="font-mono">{"{niveauxDecouverte}"}</code>, <code className="font-mono">{"{demos}"}</code>).
          </p>
          <GuardedForm action={enregistrerDecouverteAction} label="réglage de la Découverte" className="mt-3 grid gap-4">
            <label className="flex items-center gap-3 text-sm text-slate-300">
              <input type="checkbox" name="soloActive" defaultChecked={decouverte.solo.active} className="h-4 w-4 accent-amber-400" />
              Fermer les niveaux au-delà du maximum à qui n&apos;a pas de licence de l&apos;arène en cours
            </label>
            <div className="grid gap-3 sm:grid-cols-3">
              <label className="block text-sm text-slate-300">
                Niveau maximum en solo sans licence
                <select name="niveauMax" defaultValue={String(decouverte.solo.niveauMaxAutres)} className="mt-1 block w-full champ px-3 py-2 text-sm">
                  {Array.from({ length: NIVEAU_MAX - 1 }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>
                      Niveaux 1 à {n}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-slate-300">
                Entreprise ouverte à tous les niveaux
                <select name="entrepriseOuverte" defaultValue={decouverte.solo.entrepriseOuverte} className="mt-1 block w-full champ px-3 py-2 text-sm">
                  <option value="">Aucune</option>
                  {ENTREPRISES.map((e) => (
                    <option key={e.code} value={e.code}>
                      {e.nom}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-slate-300">
                Niveau des démonstrations
                <select name="niveauDesDemos" defaultValue={decouverte.niveauDesDemos} className="mt-1 block w-full champ px-3 py-2 text-sm">
                  {NIVEAUX_DES_EPISODES.map((n) => (
                    <option key={n.code} value={n.code}>
                      {n.nom}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <fieldset className="rounded-xl border border-white/10 p-3" data-choix-des-demos="">
              <legend className="px-2 text-sm text-slate-300">
                Épisodes de démonstration ({decouverte.demos.length} cochés) : un par métier recommandé
              </legend>
              <div className="grid gap-x-6 gap-y-3 md:grid-cols-2">
                {entreprisesDesEpisodes.map((ent) => {
                  const coches = ent.familles.flatMap((f) => f.episodes).filter((c) => decouverte.demos.includes(c)).length;
                  return (
                    <details key={ent.secteur.code} className="rounded-lg border border-white/10 px-3 py-2" open={coches !== 1}>
                      <summary className="cursor-pointer text-sm text-slate-200">
                        {ent.secteur.nom} · {ent.secteur.entreprise}{" "}
                        <span className={coches === 1 ? "text-slate-400" : "font-semibold text-slate-100"}>
                          ({coches} démo{coches > 1 ? "s" : ""}
                          {coches === 1 ? "" : ", un par métier recommandé"})
                        </span>
                      </summary>
                      <ul className="mt-2 max-h-56 space-y-1 overflow-y-auto">
                        {ent.familles.flatMap((f) => f.episodes).map((code) => (
                          <li key={code}>
                            <label className="flex items-start gap-2 text-sm text-slate-300">
                              <input
                                type="checkbox"
                                name="demos"
                                value={code}
                                defaultChecked={decouverte.demos.includes(code)}
                                className="mt-0.5 h-4 w-4 accent-amber-400"
                              />
                              <span>
                                {episodeParCode(code)?.numero}. {episodeParCode(code)?.titre ?? code}
                              </span>
                            </label>
                          </li>
                        ))}
                      </ul>
                    </details>
                  );
                })}
              </div>
            </fieldset>
            <div>
              <SubmitButton pendingLabel="Enregistrement…" className={bouton({ variante: "secondaire", taille: "s" })}>
                Enregistrer la Découverte
              </SubmitButton>
            </div>
          </GuardedForm>
        </div>

        <div className="border-t border-white/10 pt-5" data-reglage-essai="">
          <h3 className="text-base font-semibold text-slate-200">Période d&apos;essai d&apos;établissement</h3>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-400">
            Désactivée par défaut : la grille dit « pas d&apos;essai en classe ». Activée, le formulaire de
            licence de /admin propose « Essai » : une licence datée, à 0 €, marquée comme telle, dans la
            durée maximale réglée ici.
          </p>
          <GuardedForm action={enregistrerEssaiAction} label="réglage de l'essai" className="mt-3 flex flex-wrap items-end gap-4">
            <label className="flex items-center gap-3 text-sm text-slate-300">
              <input type="checkbox" name="autorise" defaultChecked={essai.autorise} className="h-4 w-4 accent-amber-400" />
              Permettre l&apos;essai d&apos;établissement
            </label>
            <label className="block text-sm text-slate-300">
              Durée maximale (jours)
              <input
                name="dureeMaxJours"
                type="number"
                min={1}
                max={DUREE_MAX_D_UN_ESSAI}
                defaultValue={essai.dureeMaxJours}
                className="mt-1 block w-28 champ px-3 py-2 text-sm"
              />
            </label>
            <SubmitButton className={bouton({ variante: "secondaire", taille: "s" })}>Enregistrer l&apos;essai</SubmitButton>
          </GuardedForm>
        </div>

        <div className="border-t border-white/10 pt-5" data-licences-gratuites="">
          <h3 className="text-base font-semibold text-slate-200">Licences offertes et d&apos;essai</h3>
          <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-400">
            Elles s&apos;attribuent dans le formulaire de licence de chaque établissement (
            <Link href="/admin" className={LIEN_A_L_ENCRE}>
              /admin
            </Link>
            ) : à 0 €, avec un motif ({Object.values(MOTIFS_DE_GRATUITE).join(", ").toLowerCase()}) et une date
            de fin. L&apos;enseignant lit « offerte jusqu&apos;au … » dans sa ligne d&apos;état.
          </p>
          {gratuites.length === 0 ? (
            <p className="mt-2 text-sm text-slate-400">Aucune licence offerte ni d&apos;essai.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm text-slate-300">
              {gratuites.map((l) => (
                <li key={l.id} data-licence-gratuite={l.nature}>
                  <span className="font-semibold text-slate-100">{l.organisation}</span> · Offre{" "}
                  {l.nomDeLOffre ?? (l.arene ? OFFRES[l.arene].nom : OFFRES.episodes.nom)}{" "}
                  {l.nature === "offerte"
                    ? `offerte (${MOTIFS_DE_GRATUITE[l.motifGratuite as keyof typeof MOTIFS_DE_GRATUITE] ?? l.motifGratuite})`
                    : "à l'essai"}{" "}
                  jusqu&apos;au {dateLongue(l.endsAt)}
                  {l.endsAt < maintenant ? " · terminée" : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* LES CODES PROMO, et la promotion affichée. */}
      <section aria-labelledby="codes" className="carte p-4 sm:p-6">
        <h2 id="codes" className="text-lg font-semibold text-slate-100">
          Codes promo et promotion affichée
        </h2>
        <p className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-400">
          Le client saisit le code dans /devis ; le serveur le vérifie (actif, dates, offres, plafond,
          une utilisation par établissement) et le devis enregistré porte le prix catalogue, la remise et
          le prix remisé. Prix nets : une remise ne fait jamais apparaître de taxe. Une seule promotion
          s&apos;affiche sur /tarifs, en bandeau, jusqu&apos;à sa date de fin.
        </p>
        <p className="mt-2 text-sm text-slate-300" data-promotion-affichee="">
          {promotion && promotionEnCours(promotion, maintenant)
            ? `Bandeau en cours : « ${texteDuBandeau(promotion, nomDe, affichage.prixPublics)} ».`
            : promotion
              ? `Promotion ${promotion.code} marquée « affichée », hors de ses dates ou épuisée : aucun bandeau.`
              : "Aucun bandeau sur /tarifs."}
        </p>
        {erreurIci("codes")}
        {codes.length > 0 ? (
          <ul className="mt-4 divide-y divide-white/10">
            {codes.map((c) => (
              <li key={c.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2" data-code-promo={c.code}>
                <p className="text-sm text-slate-300">
                  <span className="font-mono font-semibold text-slate-100">{c.code}</span> ·{" "}
                  {libelleDeLaRemise({ type: c.typeRemise, valeur: c.valeur })} ·{" "}
                  {c.offres === null ? "toutes les offres" : c.offres.map(nomDe).join(", ")} ·{" "}
                  {c.debut ? `du ${date(c.debut)} ` : ""}
                  {c.fin ? `jusqu'au ${date(new Date(c.fin.getTime() - 1))}` : "sans fin"} · {c.utilisations}
                  {c.utilisationsMax !== null ? ` / ${c.utilisationsMax}` : ""} utilisation{c.utilisations > 1 ? "s" : ""}
                  {c.unParEtablissement ? " · une par établissement" : ""} ·{" "}
                  <span data-etat-code="">{etatDuCode(c, maintenant)}</span>
                  {c.affiche ? " · affichée sur /tarifs" : ""}
                </p>
                <Link href={`/admin/offres?code=${c.id}#codes`} className={LIEN_A_L_ENCRE}>
                  Modifier
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
        <GuardedForm
          key={codeEnEdition?.id ?? "nouveau"}
          action={enregistrerCodePromoAction}
          label="enregistrement d'un code promo"
          className="mt-4 grid gap-3 rounded-xl border border-white/10 p-3 sm:grid-cols-3"
        >
          <p className="text-sm font-semibold text-slate-200 sm:col-span-3">
            {codeEnEdition ? `Modifier le code ${codeEnEdition.code}` : "Nouveau code promo"}
          </p>
          {codeEnEdition ? <input type="hidden" name="id" value={codeEnEdition.id} /> : null}
          <label className="block text-sm text-slate-300">
            Code
            <input
              name="code"
              required
              defaultValue={codeEnEdition?.code ?? ""}
              placeholder="RENTREE"
              className="mt-1 block w-full champ px-3 py-2 font-mono text-sm"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Remise
            <span className="mt-1 flex gap-2">
              <select name="typeRemise" aria-label="Type de remise" defaultValue={codeEnEdition?.typeRemise ?? "pourcentage"} className="champ px-2 py-2 text-sm">
                <option value="pourcentage">%</option>
                <option value="montant">€</option>
              </select>
              <input
                name="valeur"
                aria-label="Valeur de la remise"
                required
                inputMode="decimal"
                defaultValue={
                  codeEnEdition ? (codeEnEdition.typeRemise === "montant" ? String(codeEnEdition.valeur / 100) : String(codeEnEdition.valeur)) : ""
                }
                placeholder="20"
                className="min-w-0 flex-1 champ px-3 py-2 text-sm"
              />
            </span>
          </label>
          <label className="block text-sm text-slate-300">
            Utilisations maximum (vide : sans limite)
            <input
              name="utilisationsMax"
              type="number"
              min={1}
              defaultValue={codeEnEdition?.utilisationsMax ?? ""}
              className="mt-1 block w-full champ px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Début (facultatif)
            <input
              name="debut"
              type="date"
              defaultValue={codeEnEdition?.debut ? utcToParisLocalInput(codeEnEdition.debut).slice(0, 10) : ""}
              className="mt-1 block w-full champ px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-sm text-slate-300">
            Dernier jour (facultatif)
            <input
              name="fin"
              type="date"
              defaultValue={dernierJour(codeEnEdition?.fin ?? null)}
              className="mt-1 block w-full champ px-3 py-2 text-sm"
            />
          </label>
          <div className="grid content-end gap-2 text-sm text-slate-300">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="unParEtablissement" defaultChecked={codeEnEdition?.unParEtablissement ?? true} className="h-4 w-4 accent-amber-400" />
              Une utilisation par établissement
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="actif" defaultChecked={codeEnEdition?.actif ?? true} className="h-4 w-4 accent-amber-400" />
              Actif
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="affiche" defaultChecked={codeEnEdition?.affiche ?? false} className="h-4 w-4 accent-amber-400" />
              Bandeau sur /tarifs (daté)
            </label>
          </div>
          <fieldset className="rounded-lg border border-white/10 p-3 sm:col-span-3">
            <legend className="px-2 text-sm text-slate-300">Offres concernées</legend>
            <label className="flex items-center gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                name="toutesLesOffres"
                defaultChecked={codeEnEdition ? codeEnEdition.offres === null : true}
                className="h-4 w-4 accent-amber-400"
              />
              Toutes les offres
            </label>
            <div className="mt-2 grid gap-x-4 gap-y-1 sm:grid-cols-3">
              {offres
                .filter((o) => o.rubrique !== "option" && o.tarif !== "gratuit")
                .map((o) => (
                  <label key={o.code} className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      name="offres"
                      value={o.code}
                      defaultChecked={codeEnEdition?.offres?.includes(o.code) ?? false}
                      className="h-4 w-4 accent-amber-400"
                    />
                    {o.nom}
                  </label>
                ))}
            </div>
            <p className="mt-2 text-xs text-slate-400">« Toutes les offres » l&apos;emporte sur la liste.</p>
          </fieldset>
          <div className="flex flex-wrap items-center gap-3 sm:col-span-3">
            <SubmitButton pendingLabel="Enregistrement…" className={bouton({ variante: "secondaire", taille: "s" })}>
              {codeEnEdition ? "Enregistrer le code" : "Créer le code"}
            </SubmitButton>
            {codeEnEdition ? (
              <Link href="/admin/offres#codes" className={LIEN_A_L_ENCRE}>
                Nouveau code plutôt
              </Link>
            ) : null}
          </div>
        </GuardedForm>
      </section>

      {/* L'HISTORIQUE : qui, quand, avant, après. */}
      <section aria-labelledby="historique" className="carte p-4 sm:p-6">
        <h2 id="historique" className="text-lg font-semibold text-slate-100">
          Historique
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Chaque modification du catalogue, d&apos;une gratuité ou d&apos;un code promo : qui, quand, avant et
          après.
        </p>
        {journal.length === 0 ? (
          <p className="mt-3 text-sm text-slate-400">Aucune modification depuis la migration du catalogue.</p>
        ) : (
          <ol className="mt-3 divide-y divide-white/10" data-historique="">
            {journal.map((j) => (
              <li key={j.id} className="py-2 text-sm" data-entree-journal={j.objet}>
                <details>
                  <summary className="cursor-pointer text-slate-300">
                    <span className="tabular-nums text-slate-400">
                      {j.quand.toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Europe/Paris" })}
                    </span>{" "}
                    · {j.auteur || "inconnu"} · {j.objet.replace("_", " ")} <span className="font-mono">{j.cle}</span> ·{" "}
                    {j.action.replace("_", " ")}
                    {resumeDuChangement(j.avant, j.apres)}
                  </summary>
                  <div className="mt-2 grid gap-2 md:grid-cols-2">
                    <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-2 text-xs text-slate-400">
                      Avant : {JSON.stringify(j.avant, null, 1)}
                    </pre>
                    <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-slate-950 p-2 text-xs text-slate-300">
                      Après : {JSON.stringify(j.apres, null, 1)}
                    </pre>
                  </div>
                </details>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}

/** Ce qui a changé, en quelques mots : « prix 990 € → 1 090 € », « nom », « inclus ». */
function resumeDuChangement(avant: unknown, apres: unknown): string {
  if (!avant || !apres || typeof avant !== "object" || typeof apres !== "object") return "";
  const a = avant as Record<string, unknown>;
  const b = apres as Record<string, unknown>;
  const cles = [...new Set([...Object.keys(a), ...Object.keys(b)])].filter(
    (k) => JSON.stringify(a[k]) !== JSON.stringify(b[k]),
  );
  if (cles.length === 0) return " · aucun changement";
  const prix = cles.includes("prixCents") && typeof a.prixCents === "number" && typeof b.prixCents === "number"
    ? ` · prix ${euros(a.prixCents)} → ${euros(b.prixCents)}`
    : "";
  return `${prix} · ${cles.filter((k) => k !== "prixCents").join(", ")}`.replace(/ · $/, "");
}
