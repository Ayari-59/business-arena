import Link from "next/link";
import type { Metadata } from "next";
import { PARCOURS } from "@/config/parcours";
import { ATELIERS, dureeTotaleHeures } from "@/config/ateliers";
import { REFERENTIELS_NON_VERIFIES } from "@/config/ateliers/referentiels";
import { bouton } from "@/components/bouton";
import { BandeFinale } from "@/components/bande-finale";
import { PiedDePage } from "@/components/pied-de-page";

export const metadata: Metadata = {
  alternates: { canonical: "/parcours" },
  title: "Parcours par diplôme",
  description:
    "La correspondance entre votre référentiel et ce que vos étudiants vivent dans l'arène : quatre parcours bloc par bloc, et un atelier prêt à animer pour les autres filières.",
};

/**
 * LES FILIÈRES QUI ONT UN ATELIER SANS AVOIR ENCORE DE PARCOURS.
 *
 * La page citait quatre diplômes, et sa bande finale invitait « BUT GEA, DCG,
 * bachelors » à nous écrire — alors que BUT GEA et DCG ont chacun un atelier
 * publié, avec son déroulé, ses livrables et son évaluation. Un enseignant de
 * DCG lisait donc, sur la page faite pour lui répondre, que sa filière
 * n'existait pas ici.
 *
 * CE QUI MANQUE VRAIMENT, ET CE QU'ON NE FABRIQUE PAS. Un parcours est une
 * correspondance BLOC PAR BLOC avec un référentiel officiel, écrite à la main
 * et assumant ce que le jeu ne couvre pas. En écrire cinq de plus demande de
 * lire cinq arrêtés ; les inventer serait prêter à des diplômes des blocs
 * qu'ils ne portent pas, ce que ce dépôt a déjà payé une fois. La page dit
 * donc ce qui existe — l'atelier — et ce qui n'existe pas encore — le
 * parcours.
 *
 * Les ateliers d'un parcours sont déclarés par lui : sans ce lien, aucune page
 * ne saurait dire quelle filière lui reste à citer.
 */
const AUTRES_FILIERES = (() => {
  const couverts = new Set(PARCOURS.flatMap((p) => p.ateliers));
  return ATELIERS.filter((a) => !couverts.has(a.code)).map((a) => ({
    code: a.code,
    diplome: a.diplome,
    annee: a.annee,
    titre: a.titre,
    seances: a.seances.length,
    heures: Math.round(dureeTotaleHeures(a)),
    // Ce que l'atelier cite de son référentiel, et d'où ça vient. Une liste
    // lue dans l'arrêté et une liste reconstituée de mémoire ne se corrigent
    // pas de la même façon : le lecteur doit savoir laquelle il a sous les yeux.
    referentiel: `${a.referentielLabel} ${a.referentielAccord}`,
    verifie: !(REFERENTIELS_NON_VERIFIES as readonly string[]).includes(a.code),
  }));
})();

/** Parcours par diplôme : page statique, pilotée par src/config/parcours.ts. */

const FIT_BADGE: Record<string, { label: string; className: string }> = {
  coeur: { label: "cœur du jeu", className: "border-emerald-400/40 text-emerald-300" },
  couvert: { label: "couvert", className: "border-sky-400/40 text-sky-300" },
  partiel: { label: "partiel", className: "border-slate-400/40 text-slate-400" },
};

/**
 * PLUS D'EMOJI SUR CETTE PAGE. Quatre diplômes en portaient un — 🎓 🛍️ 🤝 🧮 —
 * et la limite assumée une balance. Le système les dessine à sa façon : ils
 * changent d'un appareil à l'autre, en couleurs étrangères à la maison, et se
 * brouillent au vidéoprojecteur, qui est justement l'écran de cette page. Le
 * nom du diplôme se suffit ; il est d'ailleurs le seul repère qu'un enseignant
 * cherche ici.
 */
export default function ParcoursPage() {
  return (
    <>
      <main id="main" className="min-h-screen bg-slate-950 text-slate-100">
        {/*
          PAS DE DEUXIÈME BARRE DE NAVIGATION. Cette page portait la sienne, avec
          son logo et ses liens, sous l'en-tête du site : sur un téléphone, les
          deux logos se superposaient, « Parcours » se collait au second, et le
          bouton « Jouer » sortait de l'écran (débord mesuré de 79 px à 390, 149 à
          320). Les liens qu'elle portait sont tous dans le plan du site, que
          l'en-tête ouvre déjà.
        */}
        <header className="mx-auto max-w-4xl px-6 pb-4 pt-10">
          <p className="text-xs uppercase tracking-[0.3em] text-amber-400">Parcours par diplôme</p>
          <h1 className="mt-3 text-3xl font-bold leading-tight text-slate-50 sm:text-4xl">
            Votre référentiel, vécu dans l&apos;arène
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-slate-400">
            Business Arena a été construit par un enseignant pour faire le pont entre les notions du
            programme et la pratique. Chaque parcours ci-dessous donne les réglages de partie
            conseillés et une correspondance bloc par bloc honnête, y compris sur ce que le jeu
            ne couvre pas. Les filières qui n&apos;ont pas encore la leur ont un{" "}
            <a href="#autres-filieres" className="text-amber-300 underline-offset-4 hover:underline">
              atelier prêt à animer
            </a>
            .
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {PARCOURS.map((p) => (
              <a
                key={p.code}
                href={`#${p.code}`}
                className="rounded-full border border-white/10 bg-slate-900 px-3.5 py-1.5 text-xs text-slate-300 transition hover:border-amber-400/40 hover:text-amber-300"
              >
                {p.name}
              </a>
            ))}
          </div>
        </header>

        <div className="mx-auto max-w-4xl space-y-8 px-6 py-8">
          {PARCOURS.map((p) => (
            <section
              key={p.code}
              id={p.code}
              className="scroll-mt-24 rounded-2xl border border-white/10 bg-slate-900 p-6 sm:p-8"
            >
              <p className="text-xs uppercase tracking-[0.2em] text-amber-400">{p.fullName}</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-50">{p.name}</h2>
              <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-400">{p.pitch}</p>

              <div className="mt-5 rounded-xl border border-amber-400/20 bg-slate-950 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-400">
                  Réglages conseillés à la création
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Niveau {p.recommended.level} · {p.recommended.levelName} ·{" "}
                  {p.recommended.periodicityLabel} · TVA{" "}
                  {p.recommended.vat ? "activée (20 %)" : "désactivée"}
                </p>
                <p className="mt-1 text-base leading-relaxed text-slate-400">{p.recommended.notes}</p>
              </div>

              <div className="mt-5 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                      <th className="pb-2 pr-3 font-medium">Référentiel</th>
                      <th className="pb-2 pr-3 font-medium">Notions</th>
                      <th className="pb-2 pr-3 font-medium">Dans l&apos;arène</th>
                      <th className="pb-2 font-medium">Adéquation</th>
                    </tr>
                  </thead>
                  <tbody className="align-top text-slate-300">
                    {p.blocs.map((b) => (
                      <tr key={b.referentiel} className="border-t border-white/5">
                        <td className="py-3 pr-3 font-medium text-slate-200">{b.referentiel}</td>
                        <td className="py-3 pr-3 text-xs leading-relaxed text-slate-400">
                          {b.notions}
                        </td>
                        <td className="py-3 pr-3 text-xs leading-relaxed">{b.enJeu}</td>
                        <td className="py-3">
                          <span
                            className={`whitespace-nowrap rounded-full border px-2 py-0.5 text-xs uppercase tracking-wide ${FIT_BADGE[b.fit]!.className}`}
                          >
                            {FIT_BADGE[b.fit]!.label}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {p.limite ? (
                <p className="mt-4 rounded-lg border border-white/5 bg-slate-950 px-4 py-3 text-sm leading-relaxed text-slate-400">
                  Limite assumée : {p.limite}
                </p>
              ) : null}
            </section>
          ))}

        </div>

        <section
          aria-labelledby="autres-filieres"
          className="mx-auto max-w-4xl px-6 pb-12"
        >
          <h2 id="autres-filieres" className="text-2xl font-bold text-slate-50">
            Les autres filières ont leur atelier
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-400">
            La correspondance bloc par bloc ci-dessus demande de lire un arrêté, et elle n&apos;est
            écrite que pour {PARCOURS.length} diplômes. Les suivants n&apos;ont pas encore la leur,
            mais ils ont un déroulé prêt à animer, avec ses livrables et son évaluation.
          </p>
          <ul className="mt-8 space-y-px">
            {AUTRES_FILIERES.map((f) => (
              <li key={f.code} className="border-t border-white/10 py-4">
                <Link href={`/animations/${f.code}`} className="group block">
                  <p className="text-xs uppercase tracking-[0.2em] text-amber-400">
                    {f.diplome} · {f.annee}
                  </p>
                  <p className="mt-1.5 text-base font-semibold text-slate-100 transition-colors group-hover:text-amber-200">
                    {f.titre}
                    <span
                      aria-hidden
                      className="ml-1.5 inline-block transition-transform group-hover:translate-x-1"
                    >
                      →
                    </span>
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-400">
                    {f.seances} séances, {f.heures} heures · {f.referentiel}
                    {f.verifie ? "" : ", pas encore confrontés à leur texte officiel"}.
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* La bande sort de la colonne de lecture : une fin de page tient toute
            la largeur, sinon elle reste une carte de plus dans la pile. */}
        {/* Elle nommait « BUT GEA, DCG, bachelors » comme des diplômes absents.
            Les deux premiers ont un atelier publié et figurent maintenant
            au-dessus : il ne reste à inviter que ce qui manque vraiment. */}
        <BandeFinale
          titre="Votre diplôme n'est ni dans les parcours ni dans les ateliers ?"
          texte="Les mêmes mécaniques servent d'autres référentiels : écrivez-nous, et nous regardons ensemble ce que votre programme demande."
        >
          <Link href="/teacher/login" className={bouton({ taille: "l" })}>
            Créer ma première partie
          </Link>
          <Link
            href="/guide"
            className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-amber-400/40 hover:text-amber-300"
          >
            Guide de prise en main
          </Link>
        </BandeFinale>
      </main>
      <PiedDePage />
    </>
  );
}
