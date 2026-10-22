"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { bouton } from "@/components/bouton";
import { CONCEPTS } from "@/config/pedagogy/concepts";
import { PALIERS, PARCOURS, chapitreParCode } from "@/config/cours/registre";
import type { Cas } from "@/config/cours/cas";
import type {
  Chapitre,
  EtapeChoix,
  EtapeComparaison,
  EtapeEcriture,
  EtapeLecture,
  EtapeMontants,
  EtatDuCours,
  OptionDeChoix,
  Piece,
} from "@/config/cours/types";
import { corriger, enSaisie, lireMontant, montantEcrit, type Correction } from "@/pedagogy/cours/correcteur";
import { etatAvant, indexDeLEtape, journalAvant } from "@/pedagogy/cours/deroule";
import type { Ecriture } from "@/pedagogy/cours/etats";
import { Journal, VueBilan, VueDEtape, VueResultat } from "./etats-du-cours";
import { SaisieEcriture } from "./saisie-ecriture";

/**
 * UN CHAPITRE DU COURS, JOUÉ PAS À PAS.
 *
 * L'élève avance étape par étape : il lit, passe une écriture, répond, calcule.
 * Une étape réussie montre ce qu'elle a changé dans les comptes (la simulation),
 * puis l'explication avec les chiffres de son entreprise. Le journal tenu jusque-là
 * reste à côté, et le plan de comptes du cours est toujours ouvert dans la saisie.
 *
 * L'ERREUR EST UNE ÉTAPE DU COURS. Une écriture fausse est corrigée point par point
 * sans que la réponse soit donnée ; après une erreur, un indice ; après deux, la
 * correction peut se montrer, et l'étape compte alors comme aidée. En classe
 * (`?classe`), l'enseignant qui projette peut montrer la correction à tout moment.
 *
 * La progression se garde sur l'appareil, par chapitre et par entreprise : on
 * reprend où on s'était arrêté. Rien ne part au serveur.
 */

interface SuiviDEtape {
  essais: number;
  reussi: boolean;
  aide: boolean;
}

interface Suivi {
  index: number;
  etapes: Record<string, SuiviDEtape>;
}

const NEUF: Suivi = { index: 0, etapes: {} };
const ESSAIS_AVANT_LA_CORRECTION = 2;

function useSuivi(cle: string): [Suivi, (f: (s: Suivi) => Suivi) => void, boolean] {
  const [suivi, setSuivi] = useState<Suivi>(NEUF);
  const [lu, setLu] = useState(false);
  useEffect(() => {
    // La progression ne se lit qu'au navigateur : le rendu serveur part d'un chapitre neuf.
    try {
      const brut = window.localStorage.getItem(cle);
      const s = brut ? (JSON.parse(brut) as Suivi) : null;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuivi(s && typeof s.index === "number" && s.etapes ? s : NEUF);
    } catch {
      setSuivi(NEUF);
    }
    setLu(true);
  }, [cle]);
  const changer = (f: (s: Suivi) => Suivi) =>
    setSuivi((s) => {
      const n = f(s);
      try {
        window.localStorage.setItem(cle, JSON.stringify(n));
      } catch {
        // Stockage refusé (navigation privée) : la progression vit le temps de la page.
      }
      return n;
    });
  return [suivi, changer, lu];
}

/** « 0 écriture », « 1 écriture », « 2 écritures » : zéro s'accorde au singulier. */
const ecritures = (n: number) => `${n} écriture${n > 1 ? "s" : ""}`;

const NOTIONS = new Map(CONCEPTS.map((c) => [c.code, c.name]));

function Notions({ codes }: { codes?: readonly string[] }) {
  if (!codes?.length) return null;
  return (
    <p className="flex flex-wrap items-center gap-2 text-sm">
      <span className="text-slate-400">Fiches notions :</span>
      {codes.map((c) => (
        <Link key={c} href={`/notions#${c}`} className="underline underline-offset-4 hover:text-slate-50">
          {NOTIONS.get(c) ?? c}
        </Link>
      ))}
    </p>
  );
}

function Paragraphes({ textes }: { textes: string[] }) {
  return (
    <div className="grid max-w-2xl gap-3 text-base leading-relaxed">
      {textes.map((t, i) => (
        <p key={i}>{t}</p>
      ))}
    </div>
  );
}

function Repere({ texte }: { texte: string }) {
  return (
    <p className="encadre-neutre max-w-2xl rounded-lg px-4 py-3 text-sm leading-relaxed">
      <strong className="font-semibold">À retenir · </strong>
      {texte}
    </p>
  );
}

function PieceComptable({ p }: { p: Piece }) {
  return (
    <article className="papier max-w-xl rounded-lg p-4 text-sm" aria-label={p.nature}>
      <header className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-300 pb-2">
        <p className="font-semibold uppercase tracking-etiquette">{p.nature}</p>
        <p className="text-slate-400">{p.date}</p>
      </header>
      <p className="mb-3 grid gap-0.5">
        <span>
          <span className="text-slate-400">De : </span>
          {p.de}
        </span>
        <span>
          <span className="text-slate-400">À : </span>
          {p.a}
        </span>
      </p>
      <table className="w-full">
        <tbody>
          {p.lignes.map((l, i) => (
            <tr key={i}>
              <td className="py-1 pr-2">
                {l.libelle}
                {l.quantite && l.prixUnitaire !== undefined && (
                  <span className="block text-xs text-slate-400">
                    {l.quantite} × {montantEcrit(l.prixUnitaire)} HT
                  </span>
                )}
              </td>
              <td className="py-1 text-right tabular-nums">{montantEcrit(l.montant)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          {p.totaux.map((t) => (
            <tr key={t.libelle} className={t.fort ? "border-t border-slate-300 font-semibold" : ""}>
              <td className="py-1 pr-2">{t.libelle}</td>
              <td className="py-1 text-right tabular-nums">{montantEcrit(t.montant)}</td>
            </tr>
          ))}
        </tfoot>
      </table>
      {p.mention && <p className="mt-3 text-xs text-slate-400">{p.mention}</p>}
    </article>
  );
}

function RetourDeCorrection({ c }: { c: Correction }) {
  if (c.juste) {
    return (
      <div className="encadre-gain max-w-2xl rounded-lg px-4 py-3 text-sm" role="status">
        <p className="font-semibold">Écriture juste.</p>
        {c.notes.map((n) => (
          <p key={n} className="mt-1">
            {n}
          </p>
        ))}
      </div>
    );
  }
  return (
    <div className="encadre-perte max-w-2xl rounded-lg px-4 py-3 text-sm" role="alert">
      <p className="font-semibold">Pas encore. Ce qui ne va pas :</p>
      <ul className="mt-1 grid list-disc gap-1 pl-5">
        {c.remarques.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </div>
  );
}

interface PropsDEtape<E> {
  etape: E;
  cas: Cas;
  chapitre: Chapitre;
  index: number;
  suivi: SuiviDEtape | undefined;
  classe: boolean;
  noter: (m: Partial<SuiviDEtape> & { essai?: boolean }) => void;
  suite: () => void;
}

function BoutonSuite({ suite, dernier }: { suite: () => void; dernier: boolean }) {
  return (
    <div>
      <button type="button" className={bouton({ taille: "l" })} onClick={suite}>
        {dernier ? "Terminer le chapitre" : "Étape suivante"}
      </button>
    </div>
  );
}

function Lecture({ etape, cas, noter, suite, chapitre, index }: PropsDEtape<EtapeLecture>) {
  return (
    <>
      <Paragraphes textes={etape.texte(cas)} />
      {etape.repere && <Repere texte={etape.repere(cas)} />}
      <BoutonSuite
        dernier={index === chapitre.etapes.length - 1}
        suite={() => {
          noter({ reussi: true });
          suite();
        }}
      />
    </>
  );
}

function EtapeDEcriture({ etape, cas, chapitre, index, suivi, classe, noter, suite }: PropsDEtape<EtapeEcriture>) {
  const attendue = etape.ecriture(cas);
  const [correction, setCorrection] = useState<Correction | null>(null);
  const [indices, setIndices] = useState(0);
  const fait = suivi?.reussi ?? false;
  const essais = suivi?.essais ?? 0;
  const tousLesIndices = etape.indices(cas);
  const peutMontrer = classe || essais >= ESSAIS_AVANT_LA_CORRECTION;
  const journal = journalAvant(chapitre, cas, index + 1);
  const avant = etatAvant(chapitre, cas, index);
  const apres = etatAvant(chapitre, cas, index + 1);
  const piece = etape.piece?.(cas);
  return (
    <>
      <p className="max-w-2xl text-base leading-relaxed">{etape.evenement(cas)}</p>
      {piece && <PieceComptable p={piece} />}
      <section className="grid gap-3" aria-label="Le journal">
        <p className="text-sm font-semibold">
          Passez l&apos;écriture du {attendue.date} : « {attendue.libelle} »
        </p>
        <SaisieEcriture
          key={fait ? "faite" : "a-faire"}
          nombreDeLignes={attendue.lignes.length}
          depart={fait ? enSaisie(attendue) : undefined}
          verrouillee={fait}
          onValider={(saisie) => {
            const c = corriger(saisie, attendue);
            setCorrection(c);
            noter({ essai: true, ...(c.juste ? { reussi: true } : {}) });
          }}
        />
      </section>
      {correction && <RetourDeCorrection c={correction} />}
      {!fait && (indices > 0 || essais > 0 || classe) && (
        <div className="grid max-w-2xl gap-2">
          {tousLesIndices.slice(0, indices).map((t) => (
            <p key={t} className="encadre-neutre rounded-lg px-4 py-2.5 text-sm">
              <strong className="font-semibold">Indice · </strong>
              {t}
            </p>
          ))}
          <div className="flex flex-wrap gap-3">
            {indices < tousLesIndices.length && (
              <button type="button" className={bouton({ variante: "secondaire", taille: "s" })} onClick={() => setIndices((n) => n + 1)}>
                {indices === 0 ? "Un indice" : "Un autre indice"}
              </button>
            )}
            {peutMontrer && (
              <button
                type="button"
                className={bouton({ variante: "secondaire", taille: "s" })}
                onClick={() => {
                  setCorrection(null);
                  noter({ aide: true, reussi: true });
                }}
              >
                Voir la correction
              </button>
            )}
          </div>
        </div>
      )}
      {fait && (
        <>
          <Paragraphes textes={etape.explication(cas, apres)} />
          {etape.vue && (
            <div className="papier rounded-xl p-4 sm:p-5">
              <VueDEtape vue={etape.vue} journal={journal} soldes={apres.soldes} avant={avant.soldes} />
            </div>
          )}
          <BoutonSuite suite={suite} dernier={index === chapitre.etapes.length - 1} />
        </>
      )}
    </>
  );
}

function Options({
  options,
  choisie,
  fait,
  onChoisir,
}: {
  options: OptionDeChoix[];
  choisie: number | null;
  fait: boolean;
  onChoisir: (i: number) => void;
}) {
  return (
    <div className="grid max-w-2xl gap-2" role="radiogroup">
      {options.map((o, i) => {
        const montree = choisie === i || (fait && o.juste);
        return (
          <div key={o.texte} className="grid gap-1">
            <button
              type="button"
              role="radio"
              aria-checked={choisie === i}
              disabled={fait}
              onClick={() => onChoisir(i)}
              className={`min-h-12 rounded-lg border px-4 py-3 text-left transition ${
                choisie === i ? "border-amber-400" : "border-slate-600 enabled:hover:border-slate-400"
              }`}
            >
              {o.texte}
            </button>
            {montree && (
              <p className={`${o.juste ? "encadre-gain" : "encadre-perte"} rounded-lg px-4 py-2 text-sm`}>
                <strong className="font-semibold">{o.juste ? "Juste · " : "Non · "}</strong>
                {o.retour}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

function EtapeDeChoix({ etape, cas, chapitre, index, suivi, classe, noter, suite }: PropsDEtape<EtapeChoix>) {
  const avant = etatAvant(chapitre, cas, index);
  const options = etape.options(cas, avant);
  const [choisie, setChoisie] = useState<number | null>(null);
  const fait = suivi?.reussi ?? false;
  return (
    <>
      <p className="max-w-2xl text-lg font-semibold leading-snug">{etape.question(cas, avant)}</p>
      <Options
        options={options}
        choisie={choisie}
        fait={fait}
        onChoisir={(i) => {
          setChoisie(i);
          noter({ essai: true, ...(options[i]!.juste ? { reussi: true } : {}) });
        }}
      />
      {!fait && classe && (
        <button type="button" className={bouton({ variante: "secondaire", taille: "s" })} onClick={() => noter({ aide: true, reussi: true })}>
          Montrer la réponse
        </button>
      )}
      {fait && (
        <>
          {etape.vue && (
            <div className="papier rounded-xl p-4 sm:p-5">
              <VueDEtape vue={etape.vue} journal={journalAvant(chapitre, cas, index)} soldes={avant.soldes} />
            </div>
          )}
          <BoutonSuite suite={suite} dernier={index === chapitre.etapes.length - 1} />
        </>
      )}
    </>
  );
}

function EtapeDeMontants({ etape, cas, chapitre, index, suivi, classe, noter, suite }: PropsDEtape<EtapeMontants>) {
  const avant: EtatDuCours = etatAvant(chapitre, cas, index);
  const champs = etape.champs(cas, avant);
  const [valeurs, setValeurs] = useState<string[]>(() => champs.map(() => ""));
  const [verifie, setVerifie] = useState<boolean[] | null>(null);
  const fait = suivi?.reussi ?? false;
  const essais = suivi?.essais ?? 0;
  const peutMontrer = classe || essais >= ESSAIS_AVANT_LA_CORRECTION;
  return (
    <>
      <p className="max-w-2xl text-base leading-relaxed">{etape.question(cas, avant)}</p>
      <form
        className="grid max-w-xl gap-3"
        onSubmit={(ev) => {
          ev.preventDefault();
          const v = champs.map((c, i) => {
            const x = lireMontant(valeurs[i] ?? "");
            return x !== null && !Number.isNaN(x) && Math.abs(x - c.attendu) < 0.01;
          });
          setVerifie(v);
          noter({ essai: true, ...(v.every(Boolean) ? { reussi: true } : {}) });
        }}
      >
        {champs.map((c, i) => (
          <label key={c.libelle} className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_12rem] sm:items-center sm:gap-3">
            <span className="text-sm">{c.libelle}</span>
            <span className="flex items-center gap-2">
              <input
                className="champ w-full px-2.5 py-2 text-right tabular-nums"
                inputMode="decimal"
                autoComplete="off"
                value={fait && !valeurs[i] ? String(c.attendu).replace(".", ",") : valeurs[i]}
                disabled={fait}
                onChange={(e) => setValeurs((vs) => vs.map((x, j) => (j === i ? e.target.value : x)))}
              />
              <span className="w-5 text-sm" aria-label={verifie ? (verifie[i] ? "juste" : "faux") : undefined}>
                {verifie ? (verifie[i] ? "✓" : "✗") : ""}
              </span>
            </span>
          </label>
        ))}
        {!fait && (
          <div className="flex flex-wrap gap-3">
            <button type="submit" className={bouton({ taille: "m" })}>
              Vérifier
            </button>
            {peutMontrer && (
              <button type="button" className={bouton({ variante: "secondaire", taille: "m" })} onClick={() => noter({ aide: true, reussi: true })}>
                Voir les calculs
              </button>
            )}
          </div>
        )}
      </form>
      {verifie && !fait && (
        <p className="encadre-perte max-w-2xl rounded-lg px-4 py-2.5 text-sm" role="alert">
          {verifie.filter((v) => !v).length === 1 ? "Un montant ne convient pas encore." : "Des montants ne conviennent pas encore."} Reprenez-les à partir du journal.
        </p>
      )}
      {fait && (
        <>
          <ul className="encadre-neutre grid max-w-2xl gap-1 rounded-lg px-4 py-3 text-sm">
            {champs.map((c) => (
              <li key={c.libelle}>
                <strong className="font-semibold">{c.libelle} : </strong>
                {c.calcul}
              </li>
            ))}
          </ul>
          <Paragraphes textes={etape.explication(cas, avant)} />
          {etape.vue && (
            <div className="papier rounded-xl p-4 sm:p-5">
              <VueDEtape vue={etape.vue} journal={journalAvant(chapitre, cas, index)} soldes={avant.soldes} />
            </div>
          )}
          <BoutonSuite suite={suite} dernier={index === chapitre.etapes.length - 1} />
        </>
      )}
    </>
  );
}

function EtapeDeComparaison({ etape, cas, chapitre, index, suivi, classe, noter, suite }: PropsDEtape<EtapeComparaison>) {
  const k = indexDeLEtape(chapitre, etape.avantLEtape);
  const avant = etatAvant(chapitre, cas, k);
  const apres = etatAvant(chapitre, cas, index);
  const options = etape.options(cas, avant, apres);
  const [choisie, setChoisie] = useState<number | null>(null);
  const fait = suivi?.reussi ?? false;
  return (
    <>
      <p className="max-w-2xl text-lg font-semibold leading-snug">{etape.question(cas)}</p>
      <Options
        options={options}
        choisie={choisie}
        fait={fait}
        onChoisir={(i) => {
          setChoisie(i);
          noter({ essai: true, ...(options[i]!.juste ? { reussi: true } : {}) });
        }}
      />
      {!fait && classe && (
        <button type="button" className={bouton({ variante: "secondaire", taille: "s" })} onClick={() => noter({ aide: true, reussi: true })}>
          Montrer la réponse
        </button>
      )}
      {fait && (
        <>
          <Paragraphes textes={etape.explication(cas, avant, apres)} />
          <div className="grid gap-4">
            {[
              { titre: etape.libelles.avant, s: avant.soldes, a: undefined },
              { titre: etape.libelles.apres, s: apres.soldes, a: avant.soldes },
            ].map((v) => (
              <div key={v.titre} className="papier grid gap-5 rounded-xl p-4">
                <p className="font-semibold">{v.titre}</p>
                <VueResultat soldes={v.s} avant={v.a} />
                <VueBilan soldes={v.s} avant={v.a} />
              </div>
            ))}
          </div>
          <BoutonSuite suite={suite} dernier={index === chapitre.etapes.length - 1} />
        </>
      )}
    </>
  );
}

function Sommaire({
  chapitre,
  courant,
  suivi,
  aller,
}: {
  chapitre: Chapitre;
  courant: number;
  suivi: Suivi;
  aller: (i: number) => void;
}) {
  return (
    <nav aria-label="Étapes du chapitre">
      <ol className="grid gap-0.5 text-sm">
        {chapitre.etapes.map((e, i) => {
          const s = suivi.etapes[e.id];
          const ouverte = i <= suivi.index;
          return (
            <li key={e.id}>
              <button
                type="button"
                disabled={!ouverte}
                onClick={() => aller(i)}
                aria-current={i === courant ? "step" : undefined}
                className={`flex min-h-9 w-full items-center gap-2 rounded-lg px-2 text-left ${
                  i === courant ? "bg-white/10 font-semibold text-slate-50" : ouverte ? "text-slate-300 hover:bg-white/5" : "text-slate-400"
                }`}
              >
                <span className="w-4 text-center tabular-nums text-xs">{s?.reussi ? "✓" : i + 1}</span>
                <span className="truncate">{e.titre}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function FinDuChapitre({
  chapitre,
  cas,
  suivi,
  entreprises,
  recommencer,
  classe,
}: {
  chapitre: Chapitre;
  cas: Cas;
  suivi: Suivi;
  entreprises: { code: string; nom: string }[];
  recommencer: () => void;
  classe: boolean;
}) {
  const notees = chapitre.etapes.filter((e) => e.type !== "lecture");
  const duPremierCoup = notees.filter((e) => {
    const s = suivi.etapes[e.id];
    return s?.reussi && s.essais === 1 && !s.aide;
  }).length;
  const notions = [...new Set(chapitre.etapes.flatMap((e) => e.notions ?? []))];
  const journal: Ecriture[] = journalAvant(chapitre, cas, chapitre.etapes.length);
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <p className="text-sm font-semibold uppercase tracking-etiquette text-amber-300">Chapitre terminé</p>
        <h2 className="text-3xl font-bold leading-tight text-slate-50">{chapitre.titre}</h2>
        <p className="text-lg text-slate-200">
          {duPremierCoup} étape{duPremierCoup > 1 ? "s" : ""} réussie{duPremierCoup > 1 ? "s" : ""} du premier coup sur {notees.length}, chez {cas.entreprise}.
        </p>
      </div>
      <section className="grid gap-2">
        <h3 className="font-semibold text-slate-100">Ce que vous savez faire</h3>
        <ul className="grid list-disc gap-1 pl-5 text-slate-200">
          {chapitre.objectifs.map((o) => (
            <li key={o}>{o}</li>
          ))}
        </ul>
      </section>
      <Notions codes={notions} />
      <details className="papier rounded-xl p-4">
        <summary className="cursor-pointer font-semibold">Le journal complet du chapitre</summary>
        <div className="mt-3">
          <Journal journal={journal} />
        </div>
      </details>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={bouton({ taille: "m" })} onClick={recommencer}>
          Recommencer le chapitre
        </button>
        <Link href="/cours" className={bouton({ variante: "secondaire", taille: "m" })}>
          Retour au cours
        </Link>
      </div>
      <section className="grid gap-2">
        <h3 className="font-semibold text-slate-100">Le même chapitre, dans une autre entreprise</h3>
        <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
          {entreprises
            .filter((e) => e.code !== cas.code)
            .map((e) => (
              <Link
                key={e.code}
                href={`/cours/${chapitre.code}?entreprise=${e.code}${classe ? "&classe" : ""}`}
                className="underline underline-offset-4 hover:text-slate-50"
              >
                {e.nom}
              </Link>
            ))}
        </p>
      </section>
    </div>
  );
}

export function ChapitreGuide({
  code,
  cas,
  entreprises,
  classe,
}: {
  code: string;
  cas: Cas;
  entreprises: { code: string; nom: string }[];
  classe: boolean;
}) {
  const chapitre = useMemo(() => chapitreParCode(code)!, [code]);
  const [suivi, changer, lu] = useSuivi(`cours:${code}:${cas.code}`);
  const [vue, setVue] = useState<number | null>(null);
  const n = chapitre.etapes.length;
  const fini = suivi.index >= n;
  const courant = Math.min(vue ?? suivi.index, n - 1);
  const etape = chapitre.etapes[courant]!;
  const parcours = PARCOURS.find((p) => p.code === chapitre.parcours)!;
  const palier = PALIERS.find((p) => p.palier === chapitre.palier)!;

  const noter = (id: string) => (m: Partial<SuiviDEtape> & { essai?: boolean }) =>
    changer((s) => {
      const avant = s.etapes[id] ?? { essais: 0, reussi: false, aide: false };
      // Une étape réussie le reste : revenir la relire ne la rejoue pas.
      if (avant.reussi) return s;
      return {
        ...s,
        etapes: {
          ...s.etapes,
          [id]: {
            essais: avant.essais + (m.essai ? 1 : 0),
            reussi: m.reussi ?? avant.reussi,
            aide: m.aide ?? avant.aide,
          },
        },
      };
    });
  const suite = () => {
    setVue(null);
    changer((s) => ({ ...s, index: Math.max(s.index, courant + 1) }));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const recommencer = () => {
    setVue(null);
    changer(() => NEUF);
  };

  const props = {
    cas,
    chapitre,
    index: courant,
    suivi: suivi.etapes[etape.id],
    classe,
    noter: noter(etape.id),
    suite,
  };

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-8 sm:px-6 sm:pt-10">
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-xs uppercase tracking-annonce text-slate-400">
          <Link href="/cours" className="hover:text-slate-300">
            Cours
          </Link>{" "}
          · {parcours.titre} · Palier {palier.palier}
        </p>
        <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs font-semibold text-slate-300">{cas.entreprise}</span>
        {classe && <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs text-slate-400">Mode classe</span>}
        <span className="ml-auto text-sm tabular-nums text-slate-400">
          {fini ? "Terminé" : `Étape ${courant + 1} sur ${n}`}
        </span>
      </div>
      {!lu ? null : fini && vue === null ? (
        <FinDuChapitre chapitre={chapitre} cas={cas} suivi={suivi} entreprises={entreprises} recommencer={recommencer} classe={classe} />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="grid min-w-0 gap-5" aria-live="polite" key={etape.id}>
            <div>
              <p className="text-sm font-semibold uppercase tracking-etiquette text-amber-300">
                {chapitre.titre} · Étape {courant + 1}
              </p>
              <h1 className="mt-1 text-3xl font-bold leading-tight tracking-tight text-slate-50">{etape.titre}</h1>
            </div>
            {etape.type === "lecture" && <Lecture etape={etape} {...props} />}
            {etape.type === "ecriture" && <EtapeDEcriture etape={etape} {...props} />}
            {etape.type === "choix" && <EtapeDeChoix etape={etape} {...props} />}
            {etape.type === "montants" && <EtapeDeMontants etape={etape} {...props} />}
            {etape.type === "comparaison" && <EtapeDeComparaison etape={etape} {...props} />}
            <Notions codes={etape.notions} />
          </section>
          <aside className="grid gap-5 lg:sticky lg:top-24">
            {/* Sur téléphone, le sommaire se replie : il passerait sous l'étape, plus long qu'elle. */}
            <div className="carte p-3 max-lg:hidden">
              <Sommaire chapitre={chapitre} courant={courant} suivi={suivi} aller={(i) => setVue(i)} />
            </div>
            <details className="carte p-3 lg:hidden">
              <summary className="cursor-pointer text-sm font-semibold">Les étapes du chapitre</summary>
              <div className="mt-2">
                <Sommaire chapitre={chapitre} courant={courant} suivi={suivi} aller={(i) => setVue(i)} />
              </div>
            </details>
            <details className="papier rounded-xl p-4" open={classe}>
              <summary className="cursor-pointer text-sm font-semibold">Le journal ({ecritures(journalAvant(chapitre, cas, courant).length)})</summary>
              <div className="mt-3">
                <Journal journal={journalAvant(chapitre, cas, courant)} />
              </div>
            </details>
          </aside>
        </div>
      )}
    </div>
  );
}
