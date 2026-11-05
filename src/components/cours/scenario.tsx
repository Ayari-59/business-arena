"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { bouton } from "@/components/bouton";
import { corrigerAuScenarioAction } from "@/app/cours/scenario/actions";
import type { ChiffreDuScenario, ConsequenceDuScenario, SuiteResumee } from "@/config/cours/scenarios/types";
import type { EnvoiAuBureau, RetourDuBureau } from "@/pedagogy/cours/bureau-servi";
import type { BilanServi, EnvoiAuScenario, RetourDuScenario, ScenarioServi, SituationServie } from "@/pedagogy/cours/scenario-servi";
import { Alerte, EtapeDeReponse, Explication, Paragraphes, VIERGE, type SuiviDEtape } from "./bureau";
import { Calculatrice } from "./calculatrice";
import { PieceDeLaPile } from "./piece-du-bureau";

/**
 * LE SCÉNARIO À EMBRANCHEMENTS, À L'ÉCRAN (config/cours/scenarios, pedagogy/cours/scenario-servi.ts).
 *
 * La page sert la première décision. Chaque choix part à l'action serveur avec la suite des choix faits ;
 * le serveur rend la conséquence, puis la décision suivante ou le bilan. Le composant ne connaît donc
 * jamais une branche avant de l'avoir prise ; il garde ce que le serveur lui a dit (dans le navigateur de
 * l'élève, pour reprendre où il en était) et l'affiche. Les questions de la fin reprennent celles du
 * bureau (bureau.tsx), corrigées au serveur de la même façon.
 *
 * Sur téléphone, tout s'empile en une colonne : la décision, puis ses pièces.
 */

/** Une décision prise ou à prendre : la situation servie, le choix fait et ce qu'il a donné. */
interface Pas {
  situation: SituationServie;
  choix?: string;
  consequence?: ConsequenceDuScenario;
}

interface Suivi {
  pas: Pas[];
  /** La décision affichée ; `pas.length` affiche le bilan. */
  vu: number;
  bilan?: BilanServi;
  questions: SuiviDEtape;
}

const neuf = (s: ScenarioServi): Suivi => ({ pas: [{ situation: s.premiere }], vu: 0, questions: VIERGE });

/** Le suivi, gardé dans ce navigateur : l'élève reprend où il en était. */
function useSuivi(s: ScenarioServi): [Suivi, (f: (x: Suivi) => Suivi) => void, boolean] {
  const cle = `scenario:${s.code}`;
  const [suivi, setSuivi] = useState<Suivi>(() => neuf(s));
  const [lu, setLu] = useState(false);
  useEffect(() => {
    // Le suivi ne se lit qu'au navigateur : le rendu serveur part d'un scénario neuf.
    try {
      const brut = window.localStorage.getItem(cle);
      const x = brut ? (JSON.parse(brut) as Suivi) : null;
      const valide = x && Array.isArray(x.pas) && x.pas.length > 0 && typeof x.vu === "number" && x.questions;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuivi(valide ? x : neuf(s));
    } catch {
      // Un stockage illisible ou interdit : on repart de zéro.
      setSuivi(neuf(s));
    }
    setLu(true);
    // Le scénario servi ne change pas sans rechargement : la clé suffit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle]);
  const changer = (f: (x: Suivi) => Suivi) =>
    setSuivi((x) => {
      const n = f(x);
      try {
        window.localStorage.setItem(cle, JSON.stringify(n));
      } catch {
        // Sans stockage, le scénario marche quand même ; il ne se reprend pas.
      }
      return n;
    });
  return [suivi, changer, lu];
}

const PANNE = "Le calcul n'a pas répondu : vérifiez votre connexion, puis réessayez.";
const REFUS: Record<string, string> = {
  licence: "Ce cas pratique n'est plus ouvert pour vous : rechargez la page.",
  scenario: "Ce scénario n'existe plus : rechargez la page.",
  envoi: "Votre choix n'a pas pu être lu : réessayez.",
  etape: "Cette étape n'existe plus : rechargez la page.",
};

const TONS = { alerte: "text-red-300", bon: "text-emerald-300" } as const;

function Chiffres({ chiffres }: { chiffres: readonly ChiffreDuScenario[] }) {
  if (!chiffres.length) return null;
  return (
    <dl className="carte grid max-w-2xl gap-2 p-4 text-sm" data-chiffres="">
      {chiffres.map((c) => (
        <div key={c.libelle} className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3" data-chiffre={c.libelle}>
          <dt className="min-w-0 text-slate-300">{c.libelle}</dt>
          <dd className={`text-right font-semibold tabular-nums ${c.ton ? TONS[c.ton] : "text-slate-100"}`}>
            {c.avant !== undefined && <span className="mr-2 font-normal text-slate-400 line-through decoration-slate-500">{c.avant}</span>}
            {c.valeur}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Consequence({ c }: { c: ConsequenceDuScenario }) {
  return (
    <section className="encadre-neutre grid max-w-2xl gap-3 rounded-lg px-4 py-3" aria-label={`Conséquence : ${c.titre}`} data-consequence="">
      <p className="text-xs font-semibold uppercase tracking-etiquette text-slate-400">Ce que votre choix donne</p>
      <div className="grid gap-2 text-sm leading-relaxed">
        {c.paragraphes.map((t) => (
          <p key={t}>{t}</p>
        ))}
      </div>
      <Chiffres chiffres={c.chiffres} />
    </section>
  );
}

/** Une décision : la situation, ses pièces, les options ; puis la conséquence du choix. */
function Decision({
  pas,
  total,
  envoyer,
  suivante,
  dernier,
  titre,
}: {
  pas: Pas;
  total: number;
  envoyer: (code: string) => Promise<void>;
  suivante: () => void;
  dernier: boolean;
  titre: React.RefObject<HTMLHeadingElement | null>;
}) {
  const s = pas.situation;
  const [choisi, setChoisi] = useState<string | null>(pas.choix ?? null);
  const [envoi, setEnvoi] = useState(false);
  const fait = Boolean(pas.consequence);
  const decider = async () => {
    if (!choisi) return;
    setEnvoi(true);
    await envoyer(choisi);
    setEnvoi(false);
  };
  return (
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]" data-decision={s.index}>
      <section className="grid min-w-0 gap-5">
        <p className="text-sm tabular-nums text-slate-400">
          Décision {s.index + 1} sur {total}
        </p>
        <h2 ref={titre} tabIndex={-1} className="text-2xl font-semibold text-slate-50 outline-none">
          {s.titre}
        </h2>
        <Paragraphes textes={s.paragraphes} />
        <Chiffres chiffres={s.chiffres} />
        <fieldset className="grid max-w-2xl gap-2">
          <legend className="mb-2 text-lg font-semibold leading-snug">{s.consigne}</legend>
          <div className="grid gap-2" role="radiogroup" aria-label={s.consigne}>
            {s.options.map((o) => (
              <button
                key={o.code}
                type="button"
                role="radio"
                aria-checked={choisi === o.code}
                disabled={fait || envoi}
                data-option={o.code}
                onClick={() => setChoisi(o.code)}
                className={`min-h-12 rounded-lg border px-4 py-3 text-left transition ${choisi === o.code ? "border-amber-400 text-slate-50" : "border-slate-600 text-slate-200 enabled:hover:border-slate-400"}`}
              >
                {o.texte}
              </button>
            ))}
          </div>
        </fieldset>
        {!fait && (
          <div>
            <button type="button" className={bouton({ taille: "m" })} disabled={!choisi || envoi} onClick={() => void decider()}>
              Décider
            </button>
          </div>
        )}
        {pas.consequence && <Consequence c={pas.consequence} />}
        {fait && (
          <div>
            <button type="button" className={bouton({ taille: "l" })} onClick={suivante}>
              {dernier ? "Voir le bilan" : "Décision suivante"}
            </button>
          </div>
        )}
      </section>
      <aside className="grid min-w-0 content-start gap-3" aria-label="Les pièces" data-pieces="">
        {s.pieces.map((p) => (
          <PieceDeLaPile key={p.code} piece={p} />
        ))}
      </aside>
    </div>
  );
}

function Suite({ titre, suite, attribut }: { titre: string; suite: SuiteResumee; attribut: string }) {
  return (
    <section className="carte grid min-w-0 content-start gap-3 p-4" aria-label={titre} {...{ [attribut]: "" }}>
      <h3 className="text-lg font-semibold text-slate-50">{titre}</h3>
      <ol className="grid gap-2 text-sm">
        {suite.choix.map((c) => (
          <li key={c.decision} className="grid gap-0.5">
            <span className="text-xs uppercase tracking-etiquette text-slate-400">{c.decision}</span>
            <span>{c.option}</span>
          </li>
        ))}
      </ol>
      <Chiffres chiffres={suite.chiffres} />
    </section>
  );
}

function Bilan({
  scenario,
  bilan,
  questions,
  noter,
  envoyer,
  recommencer,
  titre,
}: {
  scenario: ScenarioServi;
  bilan: BilanServi;
  questions: SuiviDEtape;
  noter: (m: Partial<SuiviDEtape> & { essai?: boolean }) => void;
  envoyer: (envoi: EnvoiAuBureau) => Promise<RetourDuBureau | null>;
  recommencer: () => void;
  titre: React.RefObject<HTMLHeadingElement | null>;
}) {
  return (
    <section className="grid gap-6" data-bilan="" data-fin={bilan.fin.code} data-meilleure={bilan.meilleure ? "oui" : "non"}>
      <div className="grid max-w-2xl gap-3">
        <p className="text-xs font-semibold uppercase tracking-etiquette text-slate-400">Le bilan</p>
        <h2 ref={titre} tabIndex={-1} className="text-2xl font-semibold text-slate-50 outline-none">
          {bilan.fin.titre}
        </h2>
        <Paragraphes textes={bilan.fin.paragraphes} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Suite titre="Votre suite" suite={bilan.eleve} attribut="data-suite-de-l-eleve" />
        <Suite titre="La meilleure suite" suite={bilan.reference} attribut="data-meilleure-suite" />
      </div>
      <Explication textes={bilan.comparaison} />
      <section className="grid gap-5" aria-label={bilan.questions.titre} data-questions="">
        <h3 className="text-xl font-semibold text-slate-50">{bilan.questions.titre}</h3>
        <p className="max-w-2xl text-base">{bilan.questions.consigne}</p>
        <EtapeDeReponse etape={bilan.questions} suivi={questions} noter={noter} envoyer={envoyer} />
      </section>
      <p className="flex flex-wrap gap-3">
        {scenario.chapitres.map((c) => (
          <Link key={c.code} href={`/cours/${c.code}`} className={bouton({ variante: "secondaire", taille: "m" })}>
            Revoir le chapitre
          </Link>
        ))}
        <button type="button" className={bouton({ variante: "lien", taille: "m" })} onClick={recommencer}>
          Recommencer le scénario
        </button>
      </p>
    </section>
  );
}

export function ScenarioAEmbranchements({ scenario }: { scenario: ScenarioServi }) {
  const [suivi, changer, lu] = useSuivi(scenario);
  const [panne, setPanne] = useState<string | null>(null);
  const total = scenario.decisions.length;
  const auBilan = suivi.vu >= suivi.pas.length && Boolean(suivi.bilan);
  const courant = Math.min(suivi.vu, suivi.pas.length - 1);
  const pas = suivi.pas[courant]!;

  const titre = useRef<HTMLHeadingElement>(null);
  const monte = useRef<number | null>(null);
  const vue = auBilan ? -1 : courant;
  useEffect(() => {
    if (monte.current !== null && monte.current !== vue) titre.current?.focus();
    monte.current = vue;
  }, [vue]);

  const appeler = async (envoi: EnvoiAuScenario): Promise<RetourDuScenario | null> => {
    setPanne(null);
    try {
      const r = await corrigerAuScenarioAction(scenario.code, envoi);
      if ("refus" in r) {
        setPanne(REFUS[r.refus] ?? PANNE);
        return null;
      }
      return r;
    } catch {
      setPanne(PANNE);
      return null;
    }
  };

  const choisir = async (code: string) => {
    const suite = [...suivi.pas.slice(0, courant).map((p) => p.choix!), code];
    const r = await appeler({ geste: "choisir", suite });
    if (!r || !("geste" in r) || r.geste !== "choisir") return;
    changer((x) => {
      const pas = x.pas.slice(0, courant + 1).map((p, i) => (i === courant ? { ...p, choix: code, consequence: r.consequence } : p));
      return { ...x, pas: r.suivante ? [...pas, { situation: r.suivante }] : pas, ...(r.bilan ? { bilan: r.bilan } : {}) };
    });
  };

  const suivante = () => {
    changer((x) => ({ ...x, vu: courant + 1 }));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Les questions de la fin : le geste du bureau, envoyé à l'action du scénario.
  const envoyerAuxQuestions = async (envoi: EnvoiAuBureau): Promise<RetourDuBureau | null> => {
    if (envoi.geste !== "repondre" && envoi.geste !== "montrer") return null;
    const r = await appeler(envoi);
    return r && "geste" in r && (r.geste === "repondre" || r.geste === "montrer") ? r : null;
  };
  const noterLesQuestions = (m: Partial<SuiviDEtape> & { essai?: boolean }) =>
    changer((x) => {
      if (x.questions.reussi) return x;
      const { essai, ...reste } = m;
      return { ...x, questions: { ...x.questions, ...reste, essais: x.questions.essais + (essai ? 1 : 0) } };
    });

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 sm:pt-10" data-scenario={scenario.code}>
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-xs uppercase tracking-annonce text-slate-400">
          <Link href="/cours" className="hover:text-slate-300">
            Cours
          </Link>{" "}
          · {scenario.parcours} · Palier {scenario.palier}
        </p>
        <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs font-semibold text-slate-300">{scenario.entreprise}</span>
        <ol className="ml-auto flex flex-wrap gap-1.5 text-xs" aria-label="Les décisions">
          {scenario.decisions.map((d, i) => (
            <li key={d.id} className={`rounded-full border px-2 py-0.5 ${!auBilan && i === courant ? "border-amber-400 text-slate-100" : "border-white/15 text-slate-400"}`}>
              {d.titre}
            </li>
          ))}
        </ol>
      </div>
      <h1 className="mb-2 text-3xl font-bold text-slate-50">{scenario.titre}</h1>
      {lu && <Calculatrice />}
      {!lu ? null : (
        <div className="grid gap-6">
          {!auBilan && courant === 0 && <Paragraphes textes={scenario.accueil} />}
          {!auBilan && suivi.pas.slice(0, courant).length > 0 && (
            <details className="carte max-w-2xl p-3 text-sm" data-decisions-prises="">
              <summary className="cursor-pointer font-semibold text-slate-200">Vos décisions précédentes</summary>
              <ol className="mt-3 grid gap-3">
                {suivi.pas.slice(0, courant).map((p) => (
                  <li key={p.situation.index} className="grid gap-1">
                    <span className="text-xs uppercase tracking-etiquette text-slate-400">{p.situation.titre}</span>
                    <span>{p.situation.options.find((o) => o.code === p.choix)?.texte}</span>
                  </li>
                ))}
              </ol>
            </details>
          )}
          {auBilan && suivi.bilan ? (
            <Bilan
              scenario={scenario}
              bilan={suivi.bilan}
              questions={suivi.questions}
              noter={noterLesQuestions}
              envoyer={envoyerAuxQuestions}
              recommencer={() => changer(() => neuf(scenario))}
              titre={titre}
            />
          ) : (
            <Decision key={pas.situation.index} pas={pas} total={total} envoyer={choisir} suivante={suivante} dernier={pas.situation.index === total - 1} titre={titre} />
          )}
          <Alerte texte={panne} />
        </div>
      )}
    </div>
  );
}
