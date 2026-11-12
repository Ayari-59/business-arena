import { avecTypographie } from "@/components/typographie";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { connexionPourLaPageDemandee } from "@/lib/connexion-requise";
import { getSession } from "@/lib/session";
import { getStaffContext } from "@/services/admin.service";
import { classeDeLEnseignant, laClasseDeLEnseignant, parcoursImposeALEnseignant, resumeDeLaClasse } from "@/services/cours.service";
import { casDeLEntreprise } from "@/config/cours/cas";
import { CHAPITRES, chapitreParCode } from "@/config/cours/registre";
import { chapitrePropose } from "@/config/formations-proposees";
import { essaiDuDiplome } from "@/config/cours/chapitres-libres";
import { formationDuParcours } from "@/config/cours/competences-affichees";
import { chapitresDuParcoursDansLOrdre } from "@/config/cours/par-diplome";
import { chapitreDuCas } from "@/pedagogy/cours/deroule";
import { vueDeLaClasse, type LigneDEleve } from "@/pedagogy/cours/suivi";
import { SITE_URL } from "@/config/site";
import { compter } from "@/lib/format";
import { momentDeLActivite } from "@/lib/moment-de-l-activite";
import { NavigationEnseignant, Rubrique } from "@/components/en-tete-enseignant";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { bouton, LIEN_A_L_ENCRE } from "@/components/bouton";
import { Icone } from "@/components/icone";
import { CaseDeLiberation } from "@/components/case-de-liberation";
import { chapitreOuvertALaClasse, classeSansOffre, libereALaClasse, offreDuCoursDeLEnseignant, parcoursAttribue } from "@/services/chapitres-de-la-classe";
import { chapitresLiberesDuPlusRecent, parcoursAttribues } from "@/services/attributions.service";
import { SubmitButton } from "@/components/submit-button";
import { ENTREPRISES } from "@/app/cours/entreprises";
import {
  CE_QU_EST_UN_PARCOURS,
  PARCOURS_PROPOSES_A_CHOISIR,
  ouvertAvecUnLibere,
  parcoursRangesParDiplome,
  titreDuParcours,
} from "@/config/cours/parcours-de-formation";
import { LIBELLE_DU_DEVIS, OFFRES } from "@/config/tarifs";
import { lienDuDevisDuCours } from "@/config/parametrage-du-devis";
import { activitesDeLaClasse } from "@/services/activites.service";
import type { Chapitre } from "@/config/cours/types";
import { ActivitesDeLaClasse } from "./activites";
import { calculatriceAction, cloreClasseAction, libererDepuisLaListeAction, liberationAction, parcoursAction } from "../actions";

export const metadata: Metadata = {
  title: "Une classe du cours",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/** Ce que dit la page après un geste de l'enseignant (`?fait=`). */
const MESSAGES_DU_GESTE: Record<string, string> = {
  close: "La classe est close : plus de nouvel élève.",
  rouverte: "La classe est rouverte.",
  calculatrice: "La calculatrice est rendue à vos élèves.",
  "sans-calculatrice": "La calculatrice est retirée à vos élèves.",
  parcours: "Le parcours de la classe est enregistré.",
  libere: "Le chapitre est libéré : vos élèves peuvent l'ouvrir, avec les prérequis qu'il annonce.",
  referme: "Le chapitre est refermé à vos élèves.",
  "tout-libere": "Tous les chapitres que votre offre permet sont ouverts à vos élèves.",
  "chapitre-par-chapitre": "Vous libérez maintenant les chapitres un par un.",
};

/** Une case de la frise d'un élève : l'état d'une étape, en couleur et en mots. */
const CASES: Record<LigneDEleve["cases"][number], { classe: string; libelle: string }> = {
  "premier-coup": { classe: "bg-emerald-500", libelle: "réussie du premier coup" },
  reussie: { classe: "bg-emerald-300", libelle: "réussie après une erreur" },
  aidee: { classe: "bg-slate-400", libelle: "réussie avec la correction" },
  "en-cours": { classe: "border-2 border-slate-300", libelle: "en cours" },
  "a-venir": { classe: "bg-white/10", libelle: "pas encore atteinte" },
};

/**
 * L'ÉTAT D'UN CHAPITRE DANS LA LISTE DE LIBÉRATION (audit UX du 11 novembre 2026, P1-3 : « à libérer »
 * et « hors offre » portaient le même cadenas) : libre pour tous, hors de l'offre, ouvert (la classe
 * ouvre tout), libéré, ouvert avec un chapitre libéré qui l'annonce en prérequis, ou à libérer.
 */
type EtatDansLaListe = "libre" | "hors-offre" | "ouvert" | "libere" | "avec" | "a-liberer";

/**
 * UNE CLASSE DU COURS, VUE PAR SON ENSEIGNANT.
 *
 * En tête, la classe élève par élève : le chapitre où chacun a travaillé en dernier, son étape, et
 * quand (audit UX du 11 novembre 2026, P1-2). Puis le code à projeter et le lien d'invitation ; les
 * chapitres du parcours de la classe, chacun avec sa case pour le libérer d'un clic (P1-3) ; et, pour
 * le chapitre suivi, où en est chaque élève (une case par étape) et, étape par étape, combien l'ont
 * réussie du premier coup et les remarques du correcteur qui reviennent le plus : ce qu'il faut
 * reprendre au tableau. Rien ne se calcule ici : `pedagogy/cours/suivi.ts` agrège. En bas, les
 * activités (bureaux, enquêtes, scénarios) de la classe, élève par élève (./activites.tsx).
 *
 * LE CHAPITRE SUIVI PAR DÉFAUT (P1-2 : c'était le premier du registre, pour toutes les classes) : le
 * dernier chapitre libéré, à défaut le premier du parcours de la classe, dans l'ordre d'apprentissage.
 */
async function ClasseDuCoursPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ chapitre?: string; creee?: string; fait?: string }>;
}) {
  const [{ id }, { chapitre: demande, creee, fait }] = await Promise.all([params, searchParams]);
  const session = await getSession();
  if (!session) redirect(await connexionPourLaPageDemandee());
  const classe = /^[0-9a-f-]{36}$/.test(id) ? await laClasseDeLEnseignant(session.userId, id) : null;
  if (!classe) notFound();
  const [staff, offre, attribues, impose, duPlusRecent] = await Promise.all([
    getStaffContext(session.userId),
    offreDuCoursDeLEnseignant(session.userId),
    parcoursAttribues(session.userId),
    // Sous l'offre Classe, le parcours de la licence, quand il est fixé (décision du 10 novembre 2026).
    parcoursImposeALEnseignant(session.userId),
    // LIBÉRER CHAPITRE PAR CHAPITRE (migration 0056) : les chapitres que l'enseignant a ouverts, le dernier d'abord.
    classe.liberation === "chapitre" ? chapitresLiberesDuPlusRecent(classe.id) : Promise.resolve([] as string[]),
  ]);
  const liberes = new Set(duPlusRecent);
  const duParcours = chapitresDuParcoursDansLOrdre(classe.parcours);
  const dernierLibere = duPlusRecent.map((c) => chapitreParCode(c)).find((c): c is Chapitre => Boolean(c));
  const choisi = chapitreParCode(demande ?? "") ?? dernierLibere ?? duParcours[0] ?? CHAPITRES[0]!;
  const [lu, resume, activitesLues] = await Promise.all([
    classeDeLEnseignant(session.userId, classe.id, choisi.code),
    resumeDeLaClasse(session.userId, classe.id),
    // LES ACTIVITÉS (migration 0057) : bureaux, enquêtes et scénarios, avec le même contrôle d'accès.
    activitesDeLaClasse(session.userId, classe.id),
  ]);
  if (!lu || !resume) notFound();
  const { progressions } = lu;
  const activites = activitesLues ?? [];
  // Une classe qui joue une seule entreprise voit le chapitre tel qu'il s'y joue : ses
  // étapes dans l'ordre et le nombre de cette entreprise (celle du chapitre, s'il ne vaut
  // pas pour l'entreprise imposée).
  const deLaClasse = classe.entreprise
    ? choisi.entreprises && !choisi.entreprises.codes.includes(classe.entreprise)
      ? choisi.entreprises.codes[0]!
      : classe.entreprise
    : null;
  const chapitre = deLaClasse ? chapitreDuCas(choisi, casDeLEntreprise(deLaClasse)) : choisi;
  const vue = vueDeLaClasse(chapitre, progressions);
  const isOrgAdmin = staff?.organizations.some((o) => o.role === "org_admin") ?? false;
  const lien = `${SITE_URL}/cours/rejoindre?code=${classe.code}`;
  const imposee = classe.entreprise ? ENTREPRISES.find((e) => e.code === classe.entreprise) : undefined;
  const nomDe = (code: string) => ENTREPRISES.find((e) => e.code === code)?.nom ?? "pas encore choisie";
  const close = classe.closeLe !== null;
  // CE QUE LA CLASSE OUVRE À SES ÉLÈVES (audit UX du 29 octobre 2026, P1-1) : la règle de l'élève
  // (services/chapitres-de-la-classe.ts). L'offre et les parcours attribués par l'admin d'abord, puis
  // la libération de la classe, prérequis compris.
  const permis = (c: Chapitre) => chapitreOuvertALaClasse(offre, classe, c, attribues);
  const ouvert = (c: Chapitre) => permis(c) && libereALaClasse(classe.liberation, liberes, c);
  const etatDe = (c: Chapitre): { etat: EtatDansLaListe; avec?: Chapitre } => {
    if (c.libre) return { etat: "libre" };
    if (!permis(c)) return { etat: "hors-offre" };
    if (classe.liberation === "tout") return { etat: "ouvert" };
    if (liberes.has(c.code)) return { etat: "libere" };
    const avec = ouvertAvecUnLibere(liberes, c.code);
    return avec ? { etat: "avec", avec: chapitreParCode(avec) } : { etat: "a-liberer" };
  };
  // LA LISTE NE MONTRE QUE LE PARCOURS DE LA CLASSE ET LES CHAPITRES LIBRES (P1-3 : elle montrait les
  // 235 chapitres proposés). Une classe héritée sans parcours garde tout ce qu'on propose. Les chapitres
  // d'un parcours retiré restent (config/formations-proposees.ts) : une classe garde ce qu'elle avait.
  const sansParcours = classe.parcours === null;
  const montres = sansParcours ? CHAPITRES.filter(chapitrePropose) : duParcours;
  const libresEnPlus = sansParcours ? [] : CHAPITRES.filter((c) => c.libre && chapitrePropose(c) && !duParcours.includes(c));
  const ouverts = [...montres, ...libresEnPlus].filter(ouvert).length;
  const liberesDuParcours = montres.filter((c) => !c.libre && liberes.has(c.code)).length;
  // Les chapitres libres s'ouvrent à tous, un par diplôme (config/cours/chapitres-libres.ts) : la page
  // nomme celui du diplôme de la classe, quand son parcours en suit un.
  const libreDeLaClasse = essaiDuDiplome(formationDuParcours(classe.parcours))?.chapitre ?? null;
  const etape = (n: number, etapes: number) => `${Math.min(n + 1, etapes)} sur ${etapes}`;
  const ligneDeLaListe = (c: Chapitre) => {
    const { etat, avec } = etatDe(c);
    const caseActive = etat === "libere" || etat === "a-liberer";
    const enClair: Record<EtatDansLaListe, string> = {
      libre: "libre, toujours ouvert",
      "hors-offre": "hors de votre offre",
      ouvert: "ouvert",
      libere: "libéré",
      avec: `ouvert avec « ${avec?.titre ?? ""} », qui l'annonce en prérequis`,
      "a-liberer": "à libérer",
    };
    return (
      <li
        key={c.code}
        data-chapitre-de-la-liste={c.code}
        data-etat={etat}
        data-liberer-le-chapitre={caseActive ? c.code : undefined}
        data-chapitre-ferme={ouvert(c) ? undefined : ""}
        className="flex items-center gap-2"
      >
        {caseActive ? (
          <CaseDeLiberation coche={etat === "libere"} chapitre={c.code} libelle={`Ouvert à vos élèves : « ${c.titre} »`} />
        ) : (
          <span aria-hidden className="grid min-h-11 min-w-11 shrink-0 place-items-center text-slate-400">
            {etat === "hors-offre" ? <Icone nom="verrou" className="h-4 w-4" /> : etat === "avec" || etat === "ouvert" || etat === "libre" ? "✓" : null}
          </span>
        )}
        <span className="grid min-w-0 flex-1">
          <Link
            href={`/teacher/cours/${classe.id}?chapitre=${c.code}`}
            aria-current={c.code === chapitre.code ? "page" : undefined}
            className={`underline-offset-4 hover:underline ${c.code === chapitre.code ? "font-semibold text-slate-50" : "text-slate-200"} ${
              etat === "hors-offre" ? "text-slate-400" : ""
            }`}
          >
            {c.titre}
          </Link>
          <span className="text-xs text-slate-400" data-etat-en-clair="">
            {etat === "hors-offre" ? <span className="sr-only">Fermé à vos élèves : </span> : null}
            {enClair[etat]}
          </span>
        </span>
      </li>
    );
  };

  return (
    <main id="main" className="pb-16">
      <EnTeteDePage surtitre="Mes classes du cours" titre={classe.nom}>
        <NavigationEnseignant
          className="mt-6"
          actif="cours"
          liens={{ etablissement: isOrgAdmin, administration: staff?.isPlatformAdmin ?? false }}
        />
      </EnTeteDePage>
      <div className={`${COLONNE_DE_PAGE} space-y-8`}>
        {creee || fait ? (
          <p role="status" className="rounded-lg encadre-gain px-4 py-2.5 text-sm">
            {creee
              ? "La classe est créée. Donnez son code à vos élèves."
              : (MESSAGES_DU_GESTE[fait ?? ""] ?? "La classe est rouverte.")}
          </p>
        ) : null}

        {!offre ? (
          <p data-classe-du-cours-sans-offre="" className="rounded-lg encadre-neutre px-4 py-2.5 text-sm text-slate-300">
            <Icone nom="verrou" className="mr-1.5 h-3.5 w-3.5" />
            {classeSansOffre(libreDeLaClasse?.titre)}{" "}
            <Link href={lienDuDevisDuCours(classe.parcours)} prefetch={false} className={LIEN_A_L_ENCRE}>
              {LIBELLE_DU_DEVIS}
            </Link>
          </p>
        ) : null}

        {/* UNE CLASSE D'AVANT LE PARCOURS (migration 0052) : elle garde l'accès d'avant, et la
            page demande à l'enseignant de lui choisir son parcours. */}
        {classe.heritee && !classe.parcours ? (
          <p role="status" className="rounded-lg encadre-distinction px-4 py-2.5 text-sm" data-bandeau-parcours="">
            Choisissez le parcours du cours de cette classe, plus bas. Jusque-là, elle garde l&apos;accès qu&apos;elle avait ; ensuite,
            avec l&apos;offre {OFFRES.classe.nom} ou {OFFRES.programme.nom}, elle ouvrira les chapitres de ce parcours.
          </p>
        ) : null}

        {/* LA CLASSE, ÉLÈVE PAR ÉLÈVE, EN TÊTE (audit UX du 11 novembre 2026, P1-2) : le chapitre où
            chacun a travaillé en dernier, son étape, et quand. Deux homonymes portent leur numéro. */}
        <section aria-labelledby="eleves-de-la-classe" className="grid gap-3" data-eleves-de-la-classe="">
          <h2 id="eleves-de-la-classe" className="text-base font-semibold text-slate-100">
            Vos élèves {resume.length > 0 ? <span className="font-normal text-slate-400">· {compter(resume.length, "élève")}</span> : null}
          </h2>
          {resume.length === 0 ? (
            <p className="rounded-lg border border-white/15 px-4 py-4 text-sm text-slate-400">
              Aucun élève n&apos;a encore rejoint la classe : donnez-leur le code ci-dessous.
            </p>
          ) : (
            <table className="w-full text-sm" data-resume-des-eleves="">
              <thead>
                <tr className="text-left text-xs uppercase tracking-etiquette text-slate-400">
                  <th className="py-2 pr-3 font-semibold">Élève</th>
                  <th className="py-2 pr-3 font-semibold">Chapitre en cours</th>
                  <th className="py-2 pr-3 font-semibold">Étape</th>
                  <th className="py-2 font-semibold">Dernière activité</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {resume.map((r) => {
                  const c = r.chapitre ? chapitreParCode(r.chapitre) : undefined;
                  const n = c?.etapes.length ?? 0;
                  return (
                    <tr key={r.eleve} data-resume-eleve={r.eleve} className="align-top">
                      <td className="py-2 pr-3 font-semibold text-slate-100">{r.eleve}</td>
                      <td className="py-2 pr-3 text-slate-300">
                        {c ? (
                          <Link href={`/teacher/cours/${classe.id}?chapitre=${c.code}`} className={LIEN_A_L_ENCRE}>
                            {c.titre}
                          </Link>
                        ) : (
                          (r.chapitre ?? "aucun chapitre ouvert")
                        )}
                      </td>
                      <td className="whitespace-nowrap py-2 pr-3 tabular-nums text-slate-300" data-etape-du-resume="">
                        {!c ? "pas commencé" : r.etape >= n ? "Fini" : etape(r.etape, n)}
                      </td>
                      <td className="py-2 text-slate-400">{r.majLe ? momentDeLActivite(r.majLe) : "pas encore"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

        <section className="carte grid gap-3 p-4 sm:p-6" aria-label="Inviter les élèves">
          <p className="text-sm text-slate-400">Code de la classe, à projeter ou à écrire au tableau</p>
          <p className="font-mono text-4xl font-bold tracking-wider text-slate-50" data-code-de-classe="">
            {classe.code}
          </p>
          {/* PROJETER LE CODE (audit UX du 11 novembre 2026, P2-9), comme la partie et la cohorte. */}
          <p>
            <Link href={`/teacher/cours/${classe.id}/code`} className={bouton({ variante: "lien" })} data-projeter-le-code="">
              <Icone nom="ecran" /> Projeter le code
            </Link>
          </p>
          <p className="text-sm text-slate-300">
            Les élèves le tapent sur <span className="font-semibold">{SITE_URL.replace("https://", "")}/cours/rejoindre</span>, ou
            ouvrent le lien : <span className="select-all break-all font-mono text-slate-200">{lien}</span>
          </p>
          <p className="text-sm text-slate-400">
            {imposee ? `Entreprise du cas, pour toute la classe : ${imposee.nom}.` : "Chaque élève choisit l'entreprise du cas."}
          </p>
          {/* LE PARCOURS DE LA CLASSE (migration 0052) : il ouvre ses chapitres sous l'offre Classe ou
              Programme ; choisi une fois, il ne change plus (services/cours.service.ts). */}
          {classe.parcours ? (
            <p className="text-sm text-slate-400" data-parcours-de-la-classe={classe.parcours}>
              Parcours du cours : {titreDuParcours(classe.parcours) ?? classe.parcours}.
            </p>
          ) : (
            <form action={parcoursAction.bind(null, classe.id)} className="grid gap-2" data-parcours-de-la-classe="">
              <label htmlFor="parcours-de-la-classe-heritee" className="text-sm font-semibold text-slate-200">
                Parcours du cours
              </label>
              <select
                id="parcours-de-la-classe-heritee"
                name="parcours"
                required
                defaultValue=""
                className="champ w-full px-3 py-2 text-base"
                aria-describedby="parcours-heritee-aide"
              >
                <option value="" disabled>
                  Choisir un parcours
                </option>
                {/* Rangés par diplôme, le cours du diplôme en premier (config/cours/parcours-a-choisir.ts). */}
                {parcoursRangesParDiplome(
                  PARCOURS_PROPOSES_A_CHOISIR.filter((p) => (impose ? p.code === impose : parcoursAttribue(attribues, p.code))).map((p) => p.code),
                ).map((g) => (
                  <optgroup key={g.cle} label={g.libelle}>
                    {g.parcours.map((p) => (
                      <option key={p.code} value={p.code}>
                        {p.libelle}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <span id="parcours-heritee-aide" className="text-sm text-slate-400">
                Avec l&apos;offre {OFFRES.classe.nom} ou {OFFRES.programme.nom}, la classe ouvre les chapitres de ce parcours ; choisi
                une fois, il ne change plus. Avec l&apos;offre {OFFRES.campus.nom}, tous les chapitres sont ouverts. {CE_QU_EST_UN_PARCOURS}
              </span>
              <div>
                <SubmitButton pendingLabel="Enregistrement…" className={bouton({ variante: "secondaire", taille: "s" })}>
                  Enregistrer le parcours
                </SubmitButton>
              </div>
            </form>
          )}
          <form action={cloreClasseAction.bind(null, classe.id, !close)}>
            <SubmitButton pendingLabel="Enregistrement…" className={bouton({ variante: "secondaire", taille: "s" })}>
              {close ? "Rouvrir la classe" : "Clore la classe (plus de nouvel élève)"}
            </SubmitButton>
          </form>
          {/* LA CALCULATRICE DU COURS, permise par défaut ; retirée, les élèves de la classe ne la voient plus. */}
          <p className="text-sm text-slate-400" data-calculatrice-de-la-classe={classe.sansCalculatrice ? "retiree" : "permise"}>
            {classe.sansCalculatrice
              ? "La calculatrice est retirée : vos élèves calculent sans elle."
              : "La calculatrice est permise : vos élèves l'ouvrent dans les chapitres et les cas pratiques."}
          </p>
          <form action={calculatriceAction.bind(null, classe.id, classe.sansCalculatrice)}>
            <SubmitButton pendingLabel="Enregistrement…" className={bouton({ variante: "secondaire", taille: "s" })}>
              {classe.sansCalculatrice ? "Rendre la calculatrice" : "Retirer la calculatrice (calcul mental)"}
            </SubmitButton>
          </form>
        </section>

        {/* LA LIBÉRATION DES CHAPITRES (décision du propriétaire, novembre 2026 ; migration 0056) : tout
            ouvrir, ou libérer chapitre par chapitre, d'un clic sur la case de chaque chapitre (audit UX
            du 11 novembre 2026, P1-3). La liste ne montre que le parcours de la classe et les chapitres
            libres ; chaque titre mène au suivi de son chapitre. */}
        <section id="liberation" className="carte scroll-mt-24 grid gap-3 p-4 sm:p-5" data-liberation={classe.liberation}>
          <h2 className="text-base font-semibold text-slate-100">Chapitres ouverts aux élèves</h2>
          <p className="text-sm text-slate-300">
            {classe.liberation === "tout"
              ? "Tout est ouvert : vos élèves voient tous les chapitres que votre offre permet."
              : `Vous libérez chapitre par chapitre, d'un clic sur sa case : ${compter(liberesDuParcours, "chapitre libéré", "chapitres libérés")}, en plus des chapitres libres. Un chapitre libéré ouvre aussi les prérequis qu'il annonce.`}
          </p>
          <form action={liberationAction.bind(null, classe.id, classe.liberation === "tout" ? "chapitre" : "tout")} data-mode-de-liberation="">
            <SubmitButton pendingLabel="Enregistrement…" className={bouton({ variante: "secondaire", taille: "s" })}>
              {classe.liberation === "tout" ? "Libérer chapitre par chapitre" : "Tout libérer"}
            </SubmitButton>
          </form>
          {/* Dépliée quand la classe libère chapitre par chapitre : une case, un clic (P1-3). Repliée
              quand tout est ouvert : elle ne sert alors qu'à choisir le chapitre suivi. */}
          <details className="group" data-chapitres-de-la-classe="" open={classe.liberation === "chapitre" || undefined}>
            <summary className="cursor-pointer text-sm text-slate-300 underline-offset-4 hover:underline">
              {sansParcours ? "Les chapitres du cours" : "Les chapitres du parcours"} ({compter(ouverts, "chapitre ouvert", "chapitres ouverts")} à vos
              élèves sur {montres.length + libresEnPlus.length})
            </summary>
            {/* Un seul formulaire : chaque case est un bouton qui envoie son chapitre et le geste. */}
            <form action={libererDepuisLaListeAction.bind(null, classe.id, chapitre.code)} className="mt-3 grid gap-4">
              <ol className="grid gap-0.5 text-sm" aria-label={sansParcours ? "Chapitres du cours" : "Chapitres du parcours de la classe"}>
                {montres.map(ligneDeLaListe)}
              </ol>
              {libresEnPlus.length > 0 ? (
                <div className="grid gap-1">
                  <h3 className="text-xs font-semibold uppercase tracking-etiquette text-slate-400">Chapitres libres, ouverts à tous</h3>
                  <ul className="grid gap-0.5 text-sm">{libresEnPlus.map(ligneDeLaListe)}</ul>
                </div>
              ) : null}
            </form>
          </details>
        </section>

        {activites.length > 0 ? (
          <p className="text-sm text-slate-300">
            <Link href="#activites" className={LIEN_A_L_ENCRE} data-lien-vers-les-activites="">
              Les activités de la classe
            </Link>{" "}
            : {compter(activites.length, "bureau, enquête ou scénario", "bureaux, enquêtes ou scénarios")}, élève par élève, plus bas.
          </p>
        ) : null}

        <Rubrique note={`${compter(progressions.length, "élève")} · ${compter(vue.finis, "chapitre fini", "chapitres finis")}`}>
          {chapitre.titre} · où en est chaque élève
        </Rubrique>
        {progressions.length === 0 ? (
          <p className="rounded-lg border border-white/15 px-4 py-5 text-center text-sm text-slate-400">
            Aucun élève n&apos;a encore rejoint la classe.
          </p>
        ) : (
          <div className="grid gap-3">
            <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400" aria-label="Légende">
              {Object.values(CASES).map((c) => (
                <li key={c.libelle} className="flex items-center gap-1.5">
                  <span aria-hidden className={`inline-block h-3 w-3 ${c.classe}`} />
                  {c.libelle}
                </li>
              ))}
            </ul>
            {/* LE TABLEAU QUI DÉFILE LE DIT, ET S'ATTEINT AU CLAVIER (audit UX du 11 novembre 2026, P2-9 et
                P2-11) : sur téléphone, il était coupé à droite sans indice, et sa zone hors de la tabulation. */}
            <p className="text-xs text-slate-400 sm:hidden" data-tableau-glisser="">
              Faites glisser le tableau de côté pour voir toutes ses colonnes.
            </p>
            <div
              className="overflow-x-auto rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2"
              role="region"
              aria-label={`${chapitre.titre} : où en est chaque élève, tableau qui défile de côté`}
              tabIndex={0}
              data-tableau-qui-defile=""
            >
              <table className="w-full min-w-[40rem] text-sm" data-eleves-du-cours="">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-etiquette text-slate-400">
                    <th className="py-2 pr-3 font-semibold">Élève</th>
                    <th className="py-2 pr-3 font-semibold">Entreprise</th>
                    <th className="py-2 pr-3 font-semibold">Étape</th>
                    <th className="py-2 pr-3 text-right font-semibold">Du premier coup</th>
                    <th className="py-2 pr-3 text-right font-semibold">Avec la correction</th>
                    <th className="py-2 font-semibold">Étapes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {vue.eleves.map((e) => (
                    <tr key={e.eleve} data-eleve={e.eleve}>
                      <td className="py-2 pr-3 font-semibold text-slate-100">{e.eleve}</td>
                      <td className="py-2 pr-3 text-slate-300">{e.commence ? nomDe(e.entreprise) : "·"}</td>
                      <td className="py-2 pr-3 tabular-nums text-slate-300" data-etape-de-l-eleve="">
                        {!e.commence ? "pas commencé" : e.fini ? "Fini" : etape(e.etape, chapitre.etapes.length)}
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums text-slate-300">{e.premierCoup}</td>
                      <td className="py-2 pr-3 text-right tabular-nums text-slate-300">{e.aidees}</td>
                      <td className="py-2">
                        <span className="flex gap-0.5">
                          {e.cases.map((k, i) => (
                            <span
                              key={i}
                              title={`${chapitre.etapes[i]!.titre} : ${CASES[k].libelle}`}
                              className={`inline-block h-3 w-2.5 ${CASES[k].classe}`}
                            />
                          ))}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {vue.objectifs.length > 0 && progressions.length > 0 && (
          <>
            <Rubrique note={compter(vue.finis, "élève a fini", "élèves ont fini")}>Objectif par objectif</Rubrique>
            <p className="-mt-4 text-sm text-slate-400">
              Parmi les élèves qui ont fini le chapitre. Acquis : toutes les étapes de l&apos;objectif réussies du premier coup. En cours :
              réussies, au moins une après une erreur. À revoir : au moins une étape réussie avec la correction, ou pas réussie.
            </p>
            <ul className="grid gap-2" data-objectifs-de-la-classe="">
              {vue.objectifs.map((o, k) => (
                <li key={o.objectif} className="carte grid gap-1 px-3 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-baseline sm:gap-4 sm:px-4" data-objectif={k}>
                  <span className="text-slate-100">{o.objectif}</span>
                  <span className="flex flex-wrap gap-x-3 text-sm tabular-nums text-slate-300">
                    <span data-acquis={o.acquis}>{o.acquis} acquis</span>
                    <span data-en-cours={o.enCours}>{o.enCours} en cours</span>
                    <span data-a-revoir={o.aRevoir}>{o.aRevoir} à revoir</span>
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}

        <Rubrique>Ce qui bloque, étape par étape</Rubrique>
        <p className="-mt-4 text-sm text-slate-400">
          Au vidéoprojecteur, une étape et les réponses de la classe, en direct et sans nom d&apos;élève :{" "}
          <Link href={`/teacher/cours/${classe.id}/projection?chapitre=${chapitre.code}`} className="text-slate-200 underline underline-offset-2">
            projeter le chapitre
          </Link>
          .
        </p>
        <ol className="grid gap-2" data-etapes-du-cours="">
          {vue.etapes
            .filter((e) => e.notee)
            .map((e) => (
              <li key={e.id} className="carte grid gap-1.5 px-3 py-3 sm:px-4" data-etape={e.id}>
                <p className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <span className="flex flex-wrap items-baseline gap-x-3">
                    <span className="font-semibold text-slate-100">{e.titre}</span>
                    <Link
                      href={`/teacher/cours/${classe.id}/projection?chapitre=${chapitre.code}&etape=${e.id}`}
                      className="text-sm text-slate-400 underline underline-offset-2 hover:text-slate-200"
                      aria-label={`Projeter l'étape « ${e.titre} »`}
                    >
                      Projeter
                    </Link>
                  </span>
                  <span className="text-sm tabular-nums text-slate-400">
                    {e.premierCoup} du premier coup · {e.aidees} avec la correction · {e.atteinte} l&apos;ont atteinte
                  </span>
                </p>
                {e.remarques.length > 0 ? (
                  <ul className="grid gap-1 text-sm text-slate-300">
                    {e.remarques.map((r) => (
                      <li key={r.texte} className="flex gap-2">
                        <span className="shrink-0 tabular-nums text-slate-400">{compter(r.eleves, "élève")}</span>
                        <span>{r.texte}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
        </ol>

        <ActivitesDeLaClasse activites={activites} eleves={progressions.length} />
      </div>
    </main>
  );
}

export default avecTypographie(ClasseDuCoursPage);
