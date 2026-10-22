import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { bouton } from "@/components/bouton";
import { ChapitreGuide } from "@/components/cours/chapitre-guide";
import { PiedDePage } from "@/components/pied-de-page";
import { casDeLEntreprise } from "@/config/cours/cas";
import { chapitreParCode } from "@/config/cours/registre";
import { getSession } from "@/lib/session";
import { getGuestUserId } from "@/lib/guest";
import { classeDeLEleve, classeSousLicence } from "@/services/cours.service";
import { unCompteSousLicence } from "@/services/acces.service";
import { ENTREPRISES } from "../entreprises";

export async function generateMetadata({ params }: { params: Promise<{ chapitre: string }> }): Promise<Metadata> {
  const { chapitre } = await params;
  const c = chapitreParCode(chapitre);
  if (!c) return { title: "Chapitre introuvable" };
  return {
    title: `${c.titre} · Le cours par la simulation`,
    description: c.accroche,
    alternates: { canonical: `/cours/${c.code}` },
  };
}

/**
 * UN CHAPITRE DU COURS, DANS L'ENTREPRISE CHOISIE (`?entreprise=`).
 *
 * Le cas se calcule ici, côté serveur : il fait jouer au moteur le premier
 * trimestre de l'entreprise, et la page n'envoie au navigateur que ses montants.
 * `?classe` ouvre le mode classe : l'enseignant qui projette peut montrer la
 * correction à tout moment.
 *
 * L'ACCÈS SE DÉCIDE ICI : un chapitre libre s'ouvre à tous ; les autres demandent
 * un compte d'enseignant rattaché à un établissement sous licence de l'arène.
 */
export default async function ChapitrePage({
  params,
  searchParams,
}: {
  params: Promise<{ chapitre: string }>;
  searchParams: Promise<{ entreprise?: string; classe?: string }>;
}) {
  const [{ chapitre: code }, { entreprise, classe }] = await Promise.all([params, searchParams]);
  const chapitre = chapitreParCode(code);
  if (!chapitre) notFound();
  // L'ÉLÈVE D'UNE CLASSE remonte sa progression à son enseignant ; une entreprise imposée
  // à la classe l'emporte sur celle de l'adresse.
  const userId = await getGuestUserId();
  const classeDeLEleveLue = userId ? await classeDeLEleve(userId) : null;
  const choisie =
    ENTREPRISES.find((e) => e.code === (classeDeLEleveLue?.entreprise ?? entreprise)) ?? ENTREPRISES[0]!;

  if (!chapitre.libre) {
    // L'enseignant par son compte, l'élève par sa classe : l'un ou l'autre sous licence.
    const [session, invite] = await Promise.all([getSession(), getGuestUserId()]);
    const ouvert =
      (session ? await unCompteSousLicence([session.userId]) : false) || (invite ? await classeSousLicence(invite) : false);
    if (!ouvert) {
      return (
        <>
          <main id="main" className="mx-auto grid max-w-2xl gap-4 px-6 py-16">
            <p className="surtitre">Le cours par la simulation</p>
            <h1 className="text-3xl font-bold text-slate-50">{chapitre.titre}</h1>
            <p className="text-base text-slate-300">
              Ce chapitre est réservé aux établissements sous licence : il s&apos;ouvre aux enseignants de
              l&apos;établissement, et à leurs élèves par leur classe. Le premier chapitre du cours, lui, est libre.
            </p>
            <p>
              <Link href="/cours" className={bouton({ taille: "m" })}>
                Voir le cours
              </Link>
            </p>
          </main>
          <PiedDePage />
        </>
      );
    }
  }

  const cas = casDeLEntreprise(choisie.code);
  return (
    <>
      <main id="main" data-metier={choisie.teinte} className="relative overflow-x-clip">
        <ChapitreGuide
          code={chapitre.code}
          cas={cas}
          entreprises={ENTREPRISES.map(({ code: c, nom }) => ({ code: c, nom }))}
          classe={classe !== undefined}
          enClasse={classeDeLEleveLue ? { classe: classeDeLEleveLue.classe, eleve: classeDeLEleveLue.eleve } : null}
        />
      </main>
      <PiedDePage />
    </>
  );
}
