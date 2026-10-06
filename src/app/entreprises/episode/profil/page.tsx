import type { Metadata } from "next";
import Link from "next/link";
import { GuardedForm } from "@/components/guarded-action";
import { HaloDePage } from "@/components/halo-de-page";
import { PiedDePage } from "@/components/pied-de-page";
import { SubmitButton } from "@/components/submit-button";
import { niveauParCode } from "@/config/episodes/niveaux";
import { getGuestUserId } from "@/lib/guest";
import { episodeParCode } from "@/pedagogy/episodes/registre";
import {
  CONFIANCES,
  MENTION,
  OBJECTIFS_POSSIBLES,
  construireProfil,
  type Comparaison,
  type LigneDeCompetence,
  type NiveauDeConfiance,
} from "@/pedagogy/profil/profil";
import type { Observation } from "@/pedagogy/profil/observations";
import { partiesDe } from "@/services/episode-parties.service";
import { formaterCodeDeReprise } from "@/config/reprise";
import { codeDeRepriseDuProfil, cohorteDe } from "@/services/cohortes.service";
import { objectifDe } from "@/services/episode-objectifs.service";
import { competenceParCode } from "@/config/episodes/competences";
import { bouton } from "@/components/bouton";
import {
  choisirObjectifAction,
  effacerMesPartiesAction,
  obtenirCodeDeRepriseAction,
  quitterCohorteAction,
} from "../actions";

export const metadata: Metadata = {
  alternates: { canonical: "/entreprises/episode/profil" },
  title: "Mon profil décisionnel",
  description:
    "Ce que vos parties d'épisodes manager disent de vos décisions, compétence par compétence, avec la confiance que leur nombre autorise.",
  robots: { index: false, follow: false },
};

/** Le profil se lit dans les parties gardées de la personne : jamais en cache. */
export const dynamic = "force-dynamic";

/**
 * MON PROFIL DÉCISIONNEL.
 *
 * Il se recalcule à chaque affichage à partir des parties gardées : une
 * correction de calcul s'applique à tout l'historique. Ce qu'on sait le mieux
 * vient d'abord ; aucun score n'est montré sans son niveau de confiance ni sans
 * la preuve qui le fonde, et un clic ouvre les décisions elles-mêmes. Le
 * profil appartient à la personne : elle seule le voit, et l'efface quand
 * elle veut.
 */

const TEINTES: Record<NiveauDeConfiance, string> = {
  solide: "bg-emerald-400/10 text-emerald-300 border-emerald-400/30",
  etabli: "bg-sky-400/10 text-sky-300 border-sky-400/30",
  indicatif: "bg-slate-700/40 text-slate-300 border-slate-500/40",
  aucun: "bg-slate-900 text-slate-400 border-white/10",
};

const SOURCES: Record<Observation["source"], string> = {
  principale: "décision, au premier plan",
  secondaire: "décision, en second plan",
  information: "informations consultées",
  diagnostic: "diagnostic de la semaine 1",
  revision: "réévaluation du diagnostic",
  reflexe: "réponse réflexe offerte",
  prevision: "prévision chiffrée",
};

const pct = (v: number) => `${Math.round(v * 100)} %`;

function Ligne({ l }: { l: LigneDeCompetence }) {
  const ref = (o: Observation) => {
    const ep = episodeParCode(o.code);
    return `${o.numero}${o.decision != null ? `-D${o.decision + 1}` : ""} · ${ep?.titre ?? o.code}`;
  };
  return (
    <li className="carte grid gap-2 p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h3 className="font-display text-lg font-semibold text-slate-50">{l.competence.nom}</h3>
        <span
          className={`font-display text-xl font-semibold tabular-nums ${
            l.confiance === "indicatif" ? "text-slate-400" : "text-slate-50"
          }`}
        >
          {l.score != null ? `${l.score}/100` : "—"}
          {l.intervalle && (
            <span className="ml-1.5 text-sm font-normal text-slate-400">
              (entre {l.intervalle[0]} et {l.intervalle[1]})
            </span>
          )}
        </span>
        <span
          className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TEINTES[l.confiance]}`}
        >
          {l.competence.score ? CONFIANCES[l.confiance].nom : "Pas encore noté"}
        </span>
      </div>
      <p className="text-xs text-slate-400">
        {l.episodes} épisode{l.episodes > 1 ? "s" : ""} · {l.familles} famille
        {l.familles > 1 ? "s" : ""} · {l.observations.length} observation
        {l.observations.length > 1 ? "s" : ""}
        {l.confiance === "indicatif" && " · à confirmer"}
      </p>
      <p className="max-w-3xl text-sm leading-relaxed text-slate-300">{l.preuve}</p>
      {l.ouLObserver.length > 0 && (
        <p className="text-sm text-slate-400">
          Ces épisodes l&apos;observent :{" "}
          {l.ouLObserver.map((code, i) => {
            const ep = episodeParCode(code)!;
            return (
              <span key={code}>
                {i > 0 && ", "}
                <Link href={`/entreprises/episode/${code}`} className="text-amber-300 underline">
                  {ep.numero} · {ep.titre}
                </Link>
              </span>
            );
          })}
          .
        </p>
      )}
      {l.observations.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-slate-300 hover:text-slate-50">
            Les {l.observations.length} observations qui fondent cette ligne
          </summary>
          <div className="mt-2 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-slate-400">
                  <th className="pb-2 pr-3 font-medium">Où</th>
                  <th className="pb-2 pr-3 font-medium">Quoi</th>
                  <th className="pb-2 pr-3 font-medium">Votre choix</th>
                  <th className="pb-2 pr-3 font-medium">Meilleure option, en moyenne</th>
                  <th className="pb-2 text-right font-medium">Valeur</th>
                </tr>
              </thead>
              <tbody>
                {l.observations.map((o, i) => (
                  <tr key={i} className="border-t border-white/5 align-top">
                    <td className="py-2 pr-3 text-slate-300">{ref(o)}</td>
                    <td className="py-2 pr-3 text-slate-400">{SOURCES[o.source]}</td>
                    <td className="py-2 pr-3 text-slate-200">
                      {o.choix?.prise ??
                        (o.sources ? `${o.sources.vues} sur ${o.sources.sur} consultées` : "—")}
                    </td>
                    <td className="py-2 pr-3 text-slate-300">
                      {o.choix?.meilleure
                        ? o.choix.ecartBrut < 1000
                          ? "votre choix, ou à égalité"
                          : `${o.choix.meilleure} (${o.choix.ecart} de plus)`
                        : "—"}
                    </td>
                    <td className="whitespace-nowrap py-2 text-right tabular-nums text-slate-200">
                      {pct(o.valeur)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      )}
    </li>
  );
}

function phraseDeComparaison(quoi: string, c: Comparaison, n: number): string {
  if (c.verdict === "insuffisant") {
    return `${quoi} : la progression se lit à partir de quatre épisodes ; vous en avez ${n}.`;
  }
  const chiffres = `${pct(c.debut)} sur vos premiers épisodes, ${pct(c.fin)} sur les derniers`;
  return c.verdict === "progres"
    ? `${quoi} : ${chiffres}. Les deux groupes ne se recouvrent plus : c'est un progrès.`
    : c.verdict === "recul"
      ? `${quoi} : ${chiffres}. Les deux groupes ne se recouvrent plus : c'est un recul.`
      : `${quoi} : ${chiffres}. L'écart reste dans le bruit des épisodes : pas de progression à conclure.`;
}

export default async function ProfilPage({
  searchParams,
}: {
  searchParams: Promise<{
    efface?: string;
    bienvenue?: string;
    repris?: string;
    objectif?: string;
  }>;
}) {
  const { efface, bienvenue, repris, objectif: objectifModifie } = await searchParams;
  const userId = await getGuestUserId();
  const [cohorte, codeDeReprise, objectif] = userId
    ? await Promise.all([cohorteDe(userId), codeDeRepriseDuProfil(userId), objectifDe(userId)])
    : [null, null, null];
  const parties = userId ? await partiesDe(userId) : [];
  const profil = construireProfil(parties, undefined, { objectif });
  const n = profil.comptees.length;
  const nomDe = (code: string) => {
    const ep = episodeParCode(code);
    return ep ? `${ep.numero} · ${ep.titre}` : code;
  };

  return (
    <>
      <main id="main" className="relative overflow-x-clip">
        <HaloDePage />
        <div className="mx-auto grid max-w-4xl gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
          <header>
            <p className="text-xs uppercase tracking-annonce text-slate-400">
              <Link href="/entreprises" className="hover:text-slate-300">
                Entreprises
              </Link>{" "}
              /{" "}
              <Link href="/entreprises/episode" className="hover:text-slate-300">
                Épisodes manager
              </Link>{" "}
              / Mon profil
            </p>
            <h1 className="mt-4 text-4xl font-bold leading-tight tracking-tight text-slate-50 sm:text-5xl">
              Mon profil décisionnel
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-300">
              {n === 0
                ? "Aucun épisode ne compte encore dans votre profil. Il se construit à partir de vos premières parties, jouées en Standard ou en Expert."
                : `Établi sur ${n} épisode${n > 1 ? "s" : ""} joué${n > 1 ? "s" : ""} en Standard ou en Expert, ${profil.competences.reduce((s, l) => s + l.observations.length, 0)} observations au total.`}
            </p>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-400">{MENTION}</p>
            {bienvenue != null && cohorte && (
              <p role="status" className="mt-4 text-sm text-amber-200">
                Vous avez rejoint la cohorte « {cohorte.nom} ». Notez votre code de reprise, plus
                bas : il vous rend ce profil depuis un autre appareil.
              </p>
            )}
            {repris != null && (
              <p role="status" className="mt-4 text-sm text-amber-200">
                Votre profil est de retour sur cet appareil.
              </p>
            )}
            {efface != null && (
              <p role="status" className="mt-4 text-sm text-amber-200">
                {Number(efface) > 0
                  ? `${efface} partie${Number(efface) > 1 ? "s" : ""} effacée${Number(efface) > 1 ? "s" : ""}. Votre profil repart de zéro.`
                  : "Aucune partie à effacer."}
              </p>
            )}
          </header>

          <section aria-labelledby="competences-titre" className="grid gap-4">
            <h2
              id="competences-titre"
              className="font-display text-2xl font-semibold tracking-tight text-slate-50"
            >
              Dix compétences de décision
            </h2>
            <p className="max-w-2xl text-sm text-slate-400">
              Ce qu&apos;on sait le mieux vient d&apos;abord. Un score indicatif est à confirmer par
              d&apos;autres épisodes ; sans assez d&apos;observations, on montre les observations,
              pas un score.
            </p>
            <ul className="grid gap-3">
              {profil.competences.map((l) => (
                <Ligne key={l.competence.code} l={l} />
              ))}
            </ul>
          </section>

          <section aria-labelledby="hasard-titre" className="grid gap-3">
            <h2
              id="hasard-titre"
              className="font-display text-2xl font-semibold tracking-tight text-slate-50"
            >
              Face au hasard
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-300">
              <span className="font-semibold text-slate-100">Robustesse de vos choix</span>
              {profil.robustesse.moyenne != null && ` (${pct(profil.robustesse.moyenne)})`} :{" "}
              {profil.robustesse.phrase}
            </p>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-300">
              <span className="font-semibold text-slate-100">Attitude face au risque</span> :{" "}
              {profil.risque.phrase} C&apos;est une indication sur vos choix, pas une note.
            </p>
          </section>

          <section aria-labelledby="progression-titre" className="grid gap-3">
            <h2
              id="progression-titre"
              className="font-display text-2xl font-semibold tracking-tight text-slate-50"
            >
              Progression
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-300">
              {phraseDeComparaison(
                "Qualité moyenne de vos décisions",
                profil.progression.qualite,
                n,
              )}
            </p>
            {profil.progression.competences
              .filter(
                (c) => c.comparaison.verdict === "progres" || c.comparaison.verdict === "recul",
              )
              .map((c) => (
                <p key={c.code} className="max-w-3xl text-sm leading-relaxed text-slate-300">
                  {phraseDeComparaison(
                    profil.competences.find((l) => l.competence.code === c.code)!.competence.nom,
                    c.comparaison,
                    n,
                  )}
                </p>
              ))}
            {profil.progression.points.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-left text-sm">
                  <caption className="sr-only">
                    Vos épisodes, dans l&apos;ordre où vous les avez joués
                  </caption>
                  <thead>
                    <tr className="text-xs uppercase tracking-wide text-slate-400">
                      <th className="pb-2 pr-3 font-medium">Épisode</th>
                      <th className="pb-2 pr-3 font-medium">Niveau</th>
                      <th className="pb-2 pr-3 text-right font-medium">Qualité</th>
                      <th className="pb-2 pr-3 text-right font-medium">Robustesse</th>
                      <th className="pb-2 text-right font-medium">Réflexes pris</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profil.progression.points.map((p) => (
                      <tr key={p.code} className="border-t border-white/5">
                        <td className="py-2 pr-3 text-slate-200">{nomDe(p.code)}</td>
                        <td className="py-2 pr-3 text-slate-400">{niveauParCode(p.niveau).nom}</td>
                        <td className="py-2 pr-3 text-right tabular-nums text-slate-200">
                          {pct(p.qualite)}
                        </td>
                        <td className="py-2 pr-3 text-right tabular-nums text-slate-200">
                          {pct(p.robustesse)}
                        </td>
                        <td className="py-2 text-right tabular-nums text-slate-200">
                          {p.reflexes == null ? "—" : pct(p.reflexes)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section aria-labelledby="suite-titre" id="suite" className="grid scroll-mt-6 gap-3">
            <h2
              id="suite-titre"
              className="font-display text-2xl font-semibold tracking-tight text-slate-50"
            >
              Prochain épisode
            </h2>
            <GuardedForm action={choisirObjectifAction} label="choix de la compétence à travailler">
              <div className="flex flex-wrap items-end gap-3">
                <label className="grid min-w-64 flex-1 gap-1">
                  <span className="text-xs uppercase tracking-wide text-slate-400">
                    La compétence que je travaille
                  </span>
                  <select
                    // La page revient sur elle-même après un choix ou un effacement :
                    // la clé recrée le champ, sans quoi il garderait l'ancienne valeur.
                    key={objectif ?? "aucun"}
                    name="objectif"
                    defaultValue={objectif ?? ""}
                    className="champ px-3 py-2"
                  >
                    <option value="">Laisser mon profil choisir</option>
                    {OBJECTIFS_POSSIBLES.map((c) => (
                      <option key={c} value={c}>
                        {competenceParCode(c).nom}
                      </option>
                    ))}
                  </select>
                </label>
                <SubmitButton pendingLabel="Enregistrement…" className={bouton({})}>
                  Choisir
                </SubmitButton>
              </div>
            </GuardedForm>
            {objectifModifie != null && (
              <p role="status" className="text-sm text-amber-200">
                {objectif
                  ? `C'est noté : les épisodes proposés travaillent maintenant « ${competenceParCode(objectif).nom} ».`
                  : "C'est noté : votre profil choisit de nouveau la compétence à travailler."}
              </p>
            )}
            {profil.cible && (
              <p className="max-w-3xl text-sm leading-relaxed text-slate-300">
                {profil.cible.pourquoi}
              </p>
            )}
            <p className="max-w-3xl text-sm leading-relaxed text-slate-300">
              <span className="font-semibold text-slate-100">
                Niveau conseillé : {niveauParCode(profil.conseil.niveau).nom}.
              </span>{" "}
              {profil.conseil.pourquoi}
            </p>
            <ul className="grid gap-2.5">
              {profil.recommandations.map((r) => (
                <li key={r.code} className="carte max-w-3xl p-4">
                  <Link
                    href={`/entreprises/episode/${r.code}?niveau=${profil.conseil.niveau}`}
                    className="font-semibold text-amber-300 underline-offset-2 hover:underline"
                  >
                    {r.numero} · {r.titre}
                  </Link>
                  <p className="mt-1 text-sm leading-relaxed text-slate-300">{r.raison}</p>
                </li>
              ))}
            </ul>
          </section>

          {parties.length > 0 && (
            <section aria-labelledby="parties-titre" className="grid gap-3">
              <h2
                id="parties-titre"
                className="font-display text-2xl font-semibold tracking-tight text-slate-50"
              >
                Vos parties
              </h2>
              <ul className="grid gap-1.5 text-sm text-slate-300">
                {profil.comptees.map((p) => (
                  <li key={p.enregistree.id}>
                    {nomDe(p.ep.code)} · {niveauParCode(p.enregistree.partie.niveau).nom} · compte
                    dans le profil
                    {p.ancienneVersion &&
                      " · jouée avant une correction du modèle de l'épisode, relue sous le modèle actuel"}
                  </li>
                ))}
                {profil.ignorees.map((p) => (
                  <li key={p.enregistree.id} className="text-slate-400">
                    {nomDe(p.enregistree.code)} ·{" "}
                    {p.raison === "rejouee"
                      ? "rejouée : seule la première partie compte"
                      : p.raison === "decouverte"
                        ? "en Découverte : ne compte pas"
                        : "épisode retiré"}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="reprise-titre" id="reprise" className="grid gap-3">
            <h2
              id="reprise-titre"
              className="font-display text-2xl font-semibold tracking-tight text-slate-50"
            >
              Cohorte et code de reprise
            </h2>
            {cohorte ? (
              <div className="grid gap-2 text-sm leading-relaxed text-slate-300">
                <p>
                  Vous suivez la cohorte{" "}
                  <span className="font-semibold text-slate-100">« {cohorte.nom} »</span>. Son
                  animateur voit des totaux et des moyennes du groupe, jamais votre profil.
                </p>
                <GuardedForm action={quitterCohorteAction} label="sortie de la cohorte">
                  <SubmitButton
                    pendingLabel="Sortie…"
                    className="text-sm text-slate-400 underline hover:text-slate-200"
                  >
                    Quitter la cohorte
                  </SubmitButton>
                </GuardedForm>
              </div>
            ) : (
              <p className="max-w-3xl text-sm leading-relaxed text-slate-400">
                Vous ne suivez aucune cohorte. On en rejoint une par le lien d&apos;invitation reçu
                de son animateur.
              </p>
            )}
            {codeDeReprise ? (
              <p className="max-w-3xl text-sm leading-relaxed text-slate-300">
                Votre code de reprise :{" "}
                <span className="font-mono text-lg tracking-surtitre text-amber-300">
                  {formaterCodeDeReprise(codeDeReprise)}
                </span>
                . Notez-le : il vous rend ce profil sur{" "}
                <Link href="/entreprises/episode/reprendre" className="text-amber-300 underline">
                  un autre appareil
                </Link>
                . Ne le confiez à personne.
              </p>
            ) : (
              parties.length > 0 && (
                <GuardedForm action={obtenirCodeDeRepriseAction} label="code de reprise du profil">
                  <SubmitButton
                    pendingLabel="Création…"
                    className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 hover:border-amber-400/50 hover:text-slate-50"
                  >
                    Obtenir mon code de reprise
                  </SubmitButton>
                </GuardedForm>
              )
            )}
            <p className="text-sm text-slate-400">
              Vous avez déjà un code ?{" "}
              <Link href="/entreprises/episode/reprendre" className="text-amber-300 underline">
                Reprendre mon profil sur cet appareil
              </Link>
            </p>
          </section>

          <section aria-labelledby="donnees-titre" className="grid gap-3">
            <h2
              id="donnees-titre"
              className="font-display text-2xl font-semibold tracking-tight text-slate-50"
            >
              Vos données
            </h2>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-400">
              Ce profil est attaché à cet appareil. Il garde vos choix, les informations ouvertes,
              votre diagnostic et votre prévision ; ni votre nom, ni un texte que vous auriez écrit.
              Il n&apos;est visible que par vous. L&apos;effacer supprime toutes vos parties
              d&apos;épisodes.
            </p>
            {parties.length > 0 && (
              <GuardedForm
                action={effacerMesPartiesAction}
                label="effacement du profil décisionnel"
              >
                <SubmitButton
                  pendingLabel="Effacement…"
                  className="rounded-lg border border-white/15 px-4 py-2 text-sm font-medium text-slate-200 hover:border-amber-400/50 hover:text-slate-50"
                >
                  Effacer mes {parties.length} partie{parties.length > 1 ? "s" : ""}
                </SubmitButton>
              </GuardedForm>
            )}
          </section>
        </div>
      </main>
      <PiedDePage />
    </>
  );
}
