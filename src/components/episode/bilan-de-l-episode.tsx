"use client";

import { avecTypographie } from "@/components/typographie";
import Link from "next/link";
import type { Cas } from "@/pedagogy/episodes/bilan";
import type { PartieJouee } from "@/config/episodes/types";
import type { BilanServi, ComparaisonServie, NiveauAffiche } from "@/pedagogy/episodes/partie-servie";
import { bouton } from "@/components/bouton";
import { CourbeDesSemaines } from "./courbe-des-semaines";
import { RetourDeLEpisode } from "./retour-de-l-episode";
import type { CoursDeLEpisode } from "@/pedagogy/cours/suites";

/**
 * LE BILAN DE L'ÉPISODE.
 *
 * Il s'ouvre sur le résultat, parce que c'est ce que le joueur attend, mais il
 * le remet aussitôt à sa place : la moyenne de ses choix sur trente tirages,
 * et ce que le hasard lui a apporté ou coûté. Le reste de la page sert à
 * séparer les deux, décision par décision.
 *
 * Le bilan se calcule au serveur, une fois la dernière décision prise
 * (pedagogy/episodes/partie-servie.ts, `bilanServi`) : l'écran n'en reçoit que
 * les textes et les chiffres, déjà écrits.
 */

// La matrice se lit au filet plein, pas à une dragée : le mérité porte le
// filet vert, la leçon le filet rouge, les deux cases du hasard restent
// neutres. Toutes sur le même voile.
const FOND_DES_CAS: Record<Cas, string> = {
  "bonne-fav": "encadre-gain",
  "bonne-defav": "encadre-neutre",
  "faible-fav": "encadre-neutre",
  "faible-defav": "encadre-perte",
};

function Jeton({ d, titre }: { d: number; titre?: string }) {
  return (
    <span
      title={titre}
      className="inline-grid h-6 min-w-8 place-items-center rounded-md bg-slate-700 px-1.5 text-xs font-semibold tabular-nums text-slate-50"
    >
      D{d + 1}
    </span>
  );
}

/**
 * DEUX PARTIES CÔTE À CÔTE.
 *
 * Rejouer n'apprend quelque chose que si l'on voit ce qui a changé. Sous le
 * même hasard, l'écart de résultat est entièrement celui des décisions ; sous
 * un autre, seul l'écart de moyenne sur trente tirages se compare.
 */
function Comparaison({ c }: { c: ComparaisonServie }) {
  return (
    <section className="carte grid gap-4 p-5">
      <h2 className="text-lg font-bold text-slate-50">Votre partie précédente, et celle-ci</h2>
      <p className="max-w-2xl text-sm leading-relaxed text-slate-300">
        {c.memeHasard
          ? "Mêmes aléas pour les deux parties : l'écart de résultat vient entièrement de vos décisions."
          : `Les deux parties n'ont pas eu les mêmes aléas : comparez plutôt la moyenne sur ${c.tirages} tirages, qui ne dépend que de vos décisions.`}
        {c.niveaux &&
          ` Niveau ${c.niveaux.avant} pour la précédente, ${c.niveaux.apres} pour celle-ci : le niveau change ce que vous saviez, pas le jugement des décisions.`}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
              <th className="pb-2 pr-3 font-medium">Décision</th>
              <th className="pb-2 pr-3 font-medium">Partie précédente</th>
              <th className="pb-2 font-medium">Cette partie</th>
            </tr>
          </thead>
          <tbody>
            {c.lignes.map((l, d) => {
              const change = l.change;
              return (
                <tr key={d} className="border-t border-white/5 align-top">
                  <td className="py-2.5 pr-3">
                    <Jeton d={d} />
                  </td>
                  <td className="py-2.5 pr-3 text-slate-300">{l.avant}</td>
                  <td
                    className={`py-2.5 ${change ? "font-semibold text-slate-50" : "text-slate-300"}`}
                  >
                    {change && <span className="sr-only">Changé : </span>}
                    {l.apres}
                    {change && (
                      <span
                        aria-hidden="true"
                        className="ml-2 text-xs font-semibold text-slate-400"
                      >
                        changé
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            <tr className="border-t border-white/10">
              <td className="py-2.5 pr-3 font-semibold text-slate-200">Résultat</td>
              <td className="py-2.5 pr-3 tabular-nums text-slate-200">
                {c.resultat.avant} <span className="text-slate-400">· tirage n° {c.resultat.graine}</span>
              </td>
              <td className="py-2.5 tabular-nums text-slate-50">
                {c.resultat.apres}{" "}
                <span className="font-semibold">({c.resultat.ecart})</span>
              </td>
            </tr>
            <tr className="border-t border-white/5">
              <td className="py-2.5 pr-3 font-semibold text-slate-200">Moyenne sur 30 tirages</td>
              <td className="py-2.5 pr-3 tabular-nums text-slate-200">{c.attendu.avant}</td>
              <td className="py-2.5 tabular-nums text-slate-50">
                {c.attendu.apres}{" "}
                <span className="font-semibold">({c.attendu.ecart})</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

/** Le nombre de décisions, en toutes lettres. */
/**
 * Quand les décisions, jugées une à une, cachent l'écart à la méthode : on
 * montre ce que reprendre la méthode à chaque étape aurait rapporté.
 */
function LEnchainement({ e }: { e: NonNullable<BilanServi["enchainement"]> }) {
  return (
    <div className="encadre-neutre rounded-lg p-4">
      <h3 className="font-semibold text-slate-50">Vos décisions s&apos;enchaînent</h3>
      <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-300">
        Chaque décision est jugée dans la situation que les précédentes ont créée, et plusieurs des
        vôtres y répondaient bien. Mais la méthode « {e.methode} » fait {e.ecart} de plus en
        moyenne{e.explique}
        . Le reste tient à l&apos;enchaînement : c&apos;est en amont qu&apos;il fallait choisir
        autrement.
      </p>
      <ul className="mt-3 grid gap-1 text-sm text-slate-300">
        {e.reprises.map((r) => (
          <li key={r.d}>
            Reprendre la méthode à partir de la décision {r.d + 1} :{" "}
            <span className="font-semibold tabular-nums text-slate-100">{r.gain}</span> en
            moyenne
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * LE SOMMAIRE DU BILAN. Le bilan empile huit blocs, dont deux longues listes en
 * prose, et rien ne disait où était quoi : on le lisait en faisant défiler. Le
 * sommaire nomme les blocs dans leur ordre et y mène ; il se tient sur une
 * ligne, en petits liens, pour ne pas peser plus que le titre qu'il suit.
 */
function Sommaire({ nombre }: { nombre: number }) {
  const liens = [
    ["#hasard-titre", "Les aléas"],
    ["#manieres-titre", "D'autres manières de décider"],
    ["#decisions-titre", `Vos ${nombre} décisions`],
    ["#comportements-titre", "Comportements et axe de travail"],
    ["#robustesse-titre", "Vos choix tenaient-ils ?"],
    ["#observe-titre", "Ce que l'épisode a observé"],
    ["#ensuite-titre", "Ensuite"],
  ] as const;
  return (
    <nav aria-label="Sommaire du bilan" className="text-sm">
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-slate-400">
        {liens.map(([href, nom]) => (
          <li key={href}>
            <a
              href={href}
              className="text-amber-300 underline decoration-1 underline-offset-4 hover:decoration-2"
            >
              {nom}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function BilanDeLEpisodeBrut({
  bilan,
  code,
  partie,
  cle,
  niveaux,
  onAutreHasard,
  onMemeHasard,
  cours = null,
  attente = false,
}: {
  /** Le bilan calculé au serveur à la dernière décision. */
  bilan: BilanServi;
  code: string;
  /** Les faits de la partie, que le retour garde pour le profil. */
  partie: PartieJouee;
  /** La clé de la partie, pour la garder une seule fois ; `null` : on ne la garde pas. */
  cle: string | null;
  /** Les noms des niveaux, pour le niveau conseillé. */
  niveaux: readonly NiveauAffiche[];
  onAutreHasard: () => void;
  onMemeHasard: () => void;
  /** Les chapitres et cas pratiques du thème de l'épisode, préparés par la page. */
  cours?: CoursDeLEpisode | null;
  /** La partie suivante se prépare au serveur : les deux boutons attendent sa réponse. */
  attente?: boolean;
}) {
  const a = bilan;
  const constats = bilan.constats;
  const axe = bilan.axe;
  const hasard = bilan.hasard;
  const CAS = bilan.cas;

  const barres = bilan.barres;
  const max = Math.max(...barres.map((b) => b.valeur));
  const min = Math.min(...barres.map((b) => b.valeur));
  // L'échelle part un peu sous la plus petite valeur : les écarts se voient,
  // et une barre reste visible même pour une valeur négative.
  const plancher = min - 0.03 * Math.max(Math.abs(min), max - min, 1);
  const largeur = (v: number) => 20 + (80 * (v - plancher)) / Math.max(1, max - plancher);
  const tuiles = bilan.tuiles;

  return (
    <div className="grid gap-5">
      <header>
        <p className="text-sm font-semibold uppercase tracking-etiquette text-amber-300">
          Bilan de l&apos;épisode · niveau {bilan.niveau} · tirage n°{" "}
          {bilan.graine}
        </p>
        <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight text-slate-50 tabular-nums sm:text-4xl">
          {bilan.titre}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-slate-300">
          Avec vos choix, la moyenne sur {bilan.tirages} tirages au hasard est de {bilan.attendu}. Ce
          trimestre-ci, le hasard vous a {bilan.chance.apporte ? "apporté" : "coûté"} {bilan.chance.montant}.
          C&apos;est la qualité de vos décisions qui compte, pas ce hasard.
        </p>
      </header>

      <Sommaire nombre={bilan.nombreDeDecisions} />

      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tuiles.map((u) => (
          <li
            key={u.nom}
            className={`carte border-t-2 p-3.5 ${u.tenu ? "border-t-emerald-400" : "border-t-rose-400"}`}
          >
            <p className="text-sm text-slate-400">{u.nom}</p>
            <p className="font-display text-xl font-semibold tabular-nums text-slate-50">
              {u.valeur}
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
              <span
                className={`rounded-full px-2 font-semibold text-slate-200 ${
                  u.tenu ? "pastille-gain" : "pastille-perte"
                }`}
              >
                {u.tenu ? "tenu" : "manqué"}
              </span>
              {u.aide}
            </p>
          </li>
        ))}
      </ul>

      {bilan.comparaison && <Comparaison c={bilan.comparaison} />}

      <CourbeDesSemaines courbe={bilan.courbe} />
      <section aria-labelledby="hasard-titre" className="grid scroll-mt-24 gap-2">
        <h2
          id="hasard-titre"
          className="text-xs font-semibold uppercase tracking-etiquette text-slate-400"
        >
          Ce que les aléas vous ont réservé
        </h2>
        <ul className="grid gap-1.5 text-sm text-slate-300">
          {hasard.map((h) => (
            <li key={h.titre}>
              <span className="font-semibold text-slate-100">{h.titre} :</span> {h.texte}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="manieres-titre" className="carte grid scroll-mt-24 gap-4 p-5">
        <h2 id="manieres-titre" className="text-lg font-bold text-slate-50">
          Le même trimestre, les mêmes aléas, d&apos;autres manières de décider
        </h2>
        <ul className="grid gap-2.5">
          {barres.map((b) => (
            <li
              key={b.nom}
              // LA LIGNE DU JOUEUR : le repère d'appartenance (la teinte du
              // métier, voir `.ligne-moi` dans globals.css, bloc « LOT 5A »)
              // et le voile neutre de la charte ; sa barre prend la même
              // teinte, les manières de décider auxquelles on la compare
              // restant au neutre de référence. L'orange plein de la barre
              // était l'action, et le bleu donnée ne disait pas « vous ».
              className={`grid grid-cols-[7rem_minmax(0,1fr)_4rem] items-center gap-3 sm:grid-cols-[10rem_minmax(0,1fr)_4.5rem] ${
                "vous" in b ? "ligne-moi -mx-2 rounded-md px-2 py-1" : ""
              }`}
            >
              <span
                className={`text-sm ${"vous" in b ? "font-semibold text-slate-50" : "text-slate-300"}`}
              >
                {b.nom}
              </span>
              <span className="h-3.5 overflow-hidden rounded-md bg-slate-800">
                <span
                  className={`block h-full rounded-md ${"vous" in b ? "bg-[color:var(--metier,var(--donnee))]" : "bg-[var(--donnee-2)]"}`}
                  style={{ width: `${largeur(b.valeur)}%` }}
                />
              </span>
              <span className="text-right text-sm font-semibold tabular-nums text-slate-100">
                {b.texte}
              </span>
            </li>
          ))}
        </ul>
        <p className="max-w-2xl text-sm text-slate-400">{bilan.noteDesBarres}</p>
      </section>

      <section aria-labelledby="decisions-titre" className="carte grid scroll-mt-24 gap-4 p-5">
        <h2 id="decisions-titre" className="text-lg font-bold text-slate-50">
          Vos {bilan.nombreDeDecisions} décisions : ce qui relevait du choix, ce qui relevait
          du hasard
        </h2>
        <div
          role="table"
          aria-label="Qualité de décision et résultat"
          className="grid grid-cols-[5.5rem_repeat(2,minmax(0,1fr))] gap-1.5 sm:grid-cols-[8.5rem_repeat(2,minmax(0,1fr))]"
        >
          <div role="row" className="contents">
            <div role="presentation" />
            <div role="columnheader" className="self-end text-sm font-semibold text-slate-400">
              Le trimestre lui donne raison
            </div>
            <div role="columnheader" className="self-end text-sm font-semibold text-slate-400">
              Le trimestre lui donne tort
            </div>
          </div>
          {(["bonne", "faible"] as const).map((q) => (
            <div role="row" key={q} className="contents">
              <div role="rowheader" className="self-center text-sm font-semibold text-slate-400">
                {q === "bonne" ? "Bonne décision" : "Décision faible"}
              </div>
              {(["fav", "defav"] as const).map((f) => {
                const cle = `${q}-${f}` as Cas;
                const ici = a.decisions.filter((x) => x.cas === cle);
                return (
                  <div
                    role="cell"
                    key={cle}
                    className={`grid min-h-24 content-start gap-0.5 rounded-lg border p-3 ${FOND_DES_CAS[cle]}`}
                  >
                    <span className="font-semibold text-slate-50">{CAS[cle].nom}</span>
                    <span className="text-xs text-slate-400">{CAS[cle].aide}</span>
                    <span className="mt-1.5 flex flex-wrap gap-1.5">
                      {ici.map((x) => (
                        <Jeton key={x.d} d={x.d} titre={x.choix} />
                      ))}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {a.enchainement && <LEnchainement e={a.enchainement} />}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 pr-3 font-medium">Décision</th>
                <th className="pb-2 pr-3 font-medium">Votre choix</th>
                <th className="pb-2 pr-3 font-medium">Rang</th>
                <th className="pb-2 pr-3 font-medium">Meilleure option, en moyenne</th>
                <th className="pb-2 pr-3 text-right font-medium">Écart attendu</th>
                <th className="pb-2 text-right font-medium">Pire cas, écart au plus sûr</th>
              </tr>
            </thead>
            <tbody>
              {a.decisions.map((x) => (
                <tr key={x.d} className="border-t border-white/5 align-top">
                  <td className="py-2.5 pr-3 text-slate-300">
                    <span className="flex items-center gap-2">
                      <Jeton d={x.d} />
                      {x.moment}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-slate-200">{x.choix}</td>
                  <td className="whitespace-nowrap py-2.5 pr-3 tabular-nums text-slate-300">
                    {x.rang} sur {x.n}
                  </td>
                  <td className="py-2.5 pr-3 text-slate-300">
                    {x.meilleure}
                  </td>
                  <td className="whitespace-nowrap py-2.5 pr-3 text-right tabular-nums text-slate-200">
                    {x.ecart}
                  </td>
                  <td className="whitespace-nowrap py-2.5 text-right tabular-nums text-slate-200">
                    {x.pireCas}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="max-w-2xl text-sm text-slate-400">
          Chaque décision est rejouée sous {bilan.tirages} tirages au hasard, vos autres choix inchangés. «
          Pire cas » : le résultat du trimestre dans les 10 % de tirages les moins favorables,
          comparé à l&apos;option qui protège le mieux.
        </p>
      </section>

      <section aria-labelledby="comportements-titre" className="carte grid scroll-mt-24 gap-3 p-5">
        <h2 id="comportements-titre" className="text-lg font-bold text-slate-50">
          Comportements observés
        </h2>
        <ul className="grid gap-2">
          {constats.map((c) => (
            <li
              key={c.texte}
              className={`max-w-3xl rounded-r-lg border-l-2 bg-slate-950 py-2.5 pl-3.5 pr-3 text-sm leading-relaxed text-slate-200 ${
                c.score >= 1 ? "border-emerald-400" : c.score > 0 ? "filet-or" : "border-rose-400"
              }`}
            >
              <span className="sr-only">
                {c.score >= 1 ? "Acquis : " : c.score > 0 ? "En partie : " : "À travailler : "}
              </span>
              {c.texte}
            </li>
          ))}
        </ul>
        {/* L'ENSEIGNEMENT DU BILAN, EN OR : un filet et un surtitre dorés, sans
            fond pâle. L'or dit ce qu'on retient ; l'orange reste à l'action. */}
        <div className="filet-or rounded-r-lg border-l-4 bg-slate-950 p-4">
          <p className="texte-or text-xs font-semibold uppercase tracking-etiquette">
            Votre axe de travail
          </p>
          <p className="mt-1 font-display text-lg font-semibold text-slate-50">{axe.titre}</p>
          <p className="mt-1 text-sm leading-relaxed text-slate-300">{axe.texte}</p>
        </div>
      </section>

      <RetourDeLEpisode retour={bilan.retour} code={code} partie={partie} cle={cle} niveaux={niveaux} />

      {cours && <LeCoursDuTheme cours={cours} />}

      <p className="max-w-2xl text-sm text-slate-400">
        Dans la version pour les entreprises, ce bilan n&apos;est visible que par la personne qui
        joue. Le responsable formation ne voit que les résultats de la cohorte, à partir de cinq
        personnes.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onAutreHasard}
          disabled={attente}
          aria-busy={attente || undefined}
          className={bouton({ taille: "l" })}
        >
          Rejouer avec d&apos;autres aléas
        </button>
        <button
          type="button"
          onClick={onMemeHasard}
          disabled={attente}
          aria-busy={attente || undefined}
          className={bouton({ variante: "secondaire", taille: "l" })}
        >
          Recommencer avec les mêmes aléas
        </button>
      </div>
    </div>
  );
}

/**
 * LE COURS DU THÈME, SOUS LE BILAN. L'épisode fait juger une situation où le
 * chiffre ne décide pas seul ; les calculs qu'il suppose s'apprennent dans les
 * chapitres de son thème, et se vérifient sans guide dans ses mises en
 * situation. Le bloc n'existe que si le thème a des chapitres.
 */
function LeCoursDuTheme({ cours }: { cours: CoursDeLEpisode }) {
  const pastille =
    "inline-block rounded-full border border-white/10 bg-slate-900 px-3 py-1 text-xs text-slate-300 transition hover:border-amber-400/40 hover:text-amber-300";
  return (
    <section aria-labelledby="cours-du-theme" className="carte grid gap-3 p-5" data-cours-du-theme={cours.theme.code}>
      <h2 id="cours-du-theme" className="text-lg font-bold text-slate-50">
        Les calculs derrière l&apos;épisode
      </h2>
      <p className="max-w-3xl text-sm leading-relaxed text-slate-300">
        Le thème {cours.theme.titre} s&apos;apprend aussi dans le cours, pas à pas, sur les chiffres d&apos;une
        entreprise.
      </p>
      <ul className="flex flex-wrap gap-2">
        {cours.chapitres.map((c) => (
          <li key={c.code} data-chapitre-du-theme={c.code}>
            <Link href={`/cours/${c.code}`} className={pastille}>
              {c.titre}
            </Link>
          </li>
        ))}
      </ul>
      {cours.situations.length > 0 && (
        <p className="text-sm text-slate-400">
          Pour s&apos;entraîner sans guide :{" "}
          {cours.situations.map((s, i) => (
            <span key={s.code}>
              {i > 0 ? ", " : ""}
              <Link href={`/cours/${s.code}`} data-situation-du-theme={s.code} className="text-amber-300 underline underline-offset-4">
                {s.titre}
              </Link>
            </span>
          ))}
          .
        </p>
      )}
      <p className="text-sm">
        <Link href={`/cours#theme-${cours.theme.code}`} className="text-amber-300 underline underline-offset-4">
          Le thème dans le catalogue du cours
        </Link>
      </p>
    </section>
  );
}

export const BilanDeLEpisode = avecTypographie(BilanDeLEpisodeBrut);
