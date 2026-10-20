import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getStaffContext } from "@/services/admin.service";
import { consentementDuCompte } from "@/services/nouveautes.service";
import { MESSAGES_DE_SERVICE, TEXTE_DU_CONSENTEMENT } from "@/config/nouveautes";
import { NavigationEnseignant, Rubrique } from "@/components/en-tete-enseignant";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { GuardedForm } from "@/components/guarded-action";
import { SubmitButton } from "@/components/submit-button";
import { bouton, LIEN_A_L_ENCRE } from "@/components/bouton";
import { logoutAction } from "../actions";
import { reglerNouveautesAction, renvoyerLeLienAction } from "./actions";
import { DUREE_DU_LIEN_DITE, etatDeLAdresse } from "@/services/confirmation-email.service";

export const metadata: Metadata = {
  title: "Mon compte",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * MON COMPTE : ce que Business Arena sait de l'enseignant, et le réglage des nouveautés.
 *
 * La case est celle de l'inscription, avec le même texte (config/nouveautes.ts) : cochée,
 * elle enregistre l'accord, sa date et la version du texte ; décochée, elle le retire. Le
 * lien de chaque e-mail de nouveautés fait la même chose sans connexion
 * (/nouveautes/desinscription).
 */

const FAITS: Record<string, string> = {
  oui: "C'est noté : vous recevrez les nouveautés, au plus une fois par mois.",
  non: "C'est noté : vous ne recevrez plus les nouveautés.",
};

/** Ce que dit la page après « Renvoyer le lien » (`renvoyerLeLienAction`). */
const LIENS: Record<string, (minutes?: string) => { texte: string; ok: boolean }> = {
  envoye: () => ({
    texte: `C'est parti : ouvrez le lien reçu dans votre messagerie. Il reste valable ${DUREE_DU_LIEN_DITE}.`,
    ok: true,
  }),
  deja_confirme: () => ({ texte: "Votre adresse est déjà confirmée.", ok: true }),
  trop_tot: (minutes) => ({
    texte: `Un lien vient de partir. Attendez ${minutes ?? "quelques"} minute${minutes === "1" ? "" : "s"} avant d'en demander un autre, et pensez aux courriers indésirables.`,
    ok: false,
  }),
  non_envoye: () => ({
    texte: "Le lien n'a pas pu partir. Réessayez dans un moment ; si cela dure, écrivez à l'adresse de contact des mentions légales.",
    ok: false,
  }),
};

const ROLES: Record<string, string> = { org_admin: "administrateur", teacher: "enseignant", student: "élève" };

const jour = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });

export default async function MonComptePage({
  searchParams,
}: {
  searchParams: Promise<{ fait?: string; lien?: string; minutes?: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/teacher/login");
  const [{ fait, lien, minutes }, staff, consentement, etatAdresse] = await Promise.all([
    searchParams,
    getStaffContext(session.userId),
    consentementDuCompte(session.userId),
    etatDeLAdresse(session.userId),
  ]);
  const retourDuLien = lien && LIENS[lien] ? LIENS[lien](minutes) : null;
  if (!staff || !consentement) redirect("/teacher/login");
  const isOrgAdmin = staff.organizations.some((o) => o.role === "org_admin");
  const { etat, adresse } = consentement;

  return (
    <main id="main" className="pb-16">
      <EnTeteDePage
        surtitre="Espace enseignant"
        titre="Mon compte"
        chapeau="Ce que Business Arena garde de votre compte, et ce que vous acceptez de recevoir."
      >
        <NavigationEnseignant
          className="mt-6"
          liens={{ etablissement: isOrgAdmin, administration: staff.isPlatformAdmin }}
          compte={
            <form action={logoutAction}>
              <button className="text-sm text-slate-400 underline-offset-4 hover:text-slate-300 hover:underline">
                Se déconnecter
              </button>
            </form>
          }
        />
      </EnTeteDePage>
      <div className={`${COLONNE_DE_PAGE} space-y-8`}>
        <Rubrique>Votre compte</Rubrique>
        <dl className="grid gap-2 text-sm" data-mon-compte="">
          <div className="grid gap-0.5 sm:grid-cols-[12rem_1fr] sm:gap-3">
            <dt className="text-slate-400">Nom affiché</dt>
            <dd className="text-slate-100">{staff.displayName}</dd>
          </div>
          <div className="grid gap-0.5 sm:grid-cols-[12rem_1fr] sm:gap-3">
            <dt className="text-slate-400">Adresse e-mail</dt>
            <dd className="break-all text-slate-100">{adresse ?? "aucune (votre plateforme de cours ou votre établissement ne l'a pas transmise)"}</dd>
          </div>
          {etatAdresse?.confirmeLe ? (
            <div className="grid gap-0.5 sm:grid-cols-[12rem_1fr] sm:gap-3">
              <dt className="text-slate-400">Adresse confirmée</dt>
              <dd className="text-slate-100" data-adresse-confirmee="">le {jour(etatAdresse.confirmeLe)}</dd>
            </div>
          ) : null}
          <div className="grid gap-0.5 sm:grid-cols-[12rem_1fr] sm:gap-3">
            <dt className="text-slate-400">Établissement</dt>
            <dd className="text-slate-100">
              {staff.organizations.length === 0
                ? "aucun"
                : staff.organizations.map((o) => `${o.name} (${ROLES[o.role] ?? o.role})`).join(" · ")}
            </dd>
          </div>
        </dl>

        {etatAdresse && !etatAdresse.etablie ? (
          <section
            id="adresse"
            aria-label="Confirmer votre adresse"
            className="carte grid gap-3 p-4 sm:p-6"
            data-adresse-a-confirmer=""
          >
            <p className="text-sm text-slate-200">
              Votre adresse n&apos;est pas encore confirmée. Vous pouvez jouer sans attendre ; il faut seulement
              une adresse confirmée pour que votre établissement reçoive une licence.
            </p>
            {retourDuLien ? (
              <p role="status" className={`text-sm ${retourDuLien.ok ? "text-emerald-300" : "text-amber-200"}`}>
                {retourDuLien.texte}
              </p>
            ) : null}
            <GuardedForm action={renvoyerLeLienAction} label="envoi du lien de confirmation">
              <SubmitButton pendingLabel="Envoi…" className={bouton({ variante: "secondaire" })}>
                Renvoyer le lien de confirmation
              </SubmitButton>
            </GuardedForm>
          </section>
        ) : null}

        <Rubrique>Nouveautés de Business Arena</Rubrique>
        <section id="nouveautes" aria-label="Nouveautés de Business Arena" className="carte grid gap-4 p-4 sm:p-6" data-reglage-nouveautes="">
          {fait && FAITS[fait] ? (
            <p role="status" className="text-sm text-emerald-300">
              {FAITS[fait]}
            </p>
          ) : null}
          <p className="text-sm text-slate-300" data-etat-nouveautes={etat.consent ? "oui" : "non"}>
            {etat.consent && etat.accordLe
              ? `Vous recevez les nouveautés depuis le ${jour(etat.accordLe)}.`
              : etat.retraitLe
                ? `Vous ne recevez plus les nouveautés depuis le ${jour(etat.retraitLe)}.`
                : "Vous ne recevez pas les nouveautés."}
          </p>
          {adresse ? (
            <GuardedForm action={reglerNouveautesAction} label="réglage des nouveautés" className="grid gap-4">
              <label className="flex items-start gap-2.5 text-sm leading-snug text-slate-200">
                <input
                  type="checkbox"
                  name="nouveautes"
                  value="oui"
                  defaultChecked={etat.consent}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-amber-400"
                />
                <span>{TEXTE_DU_CONSENTEMENT}</span>
              </label>
              <div>
                <SubmitButton pendingLabel="Enregistrement…" className={bouton({ variante: "secondaire" })}>
                  Enregistrer mon choix
                </SubmitButton>
              </div>
            </GuardedForm>
          ) : (
            <p className="text-sm text-slate-400">
              Votre plateforme de cours ou votre établissement ne nous a transmis aucune adresse : rien ne peut vous
              être envoyé.
            </p>
          )}
          <p className="text-sm text-slate-400">
            {MESSAGES_DE_SERVICE} Le détail est dans les{" "}
            <Link href="/mentions-legales" prefetch={false} className={LIEN_A_L_ENCRE}>
              mentions légales
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
