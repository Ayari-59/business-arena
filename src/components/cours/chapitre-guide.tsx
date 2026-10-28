"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import { bouton } from "@/components/bouton";
import { sansMolette } from "@/components/sans-molette";
import { CONCEPTS } from "@/config/pedagogy/concepts";
import type { Cas } from "@/config/cours/cas";
import type { MissionAffichee } from "@/config/cours/jouez";
import type { Lien, SuitesDuChapitre } from "@/pedagogy/cours/suites";
import type { OptionDeChoix, Piece } from "@/config/cours/types";
import type {
  ChapitreServi,
  ChoixServi,
  ComparaisonServie,
  CurseurServi,
  EcritureServie,
  EtapeServie,
  LectureDuCurseur,
  LectureDuLaboratoire,
  LectureServie,
  MontantsServis,
  SimulationServie,
  TriServi,
} from "@/pedagogy/cours/chapitre-servi";
import { champJuste, changerDeSigne, corriger, enSaisie, montantEcrit, type Correction } from "@/pedagogy/cours/correcteur";
import { soldes, type Ecriture } from "@/pedagogy/cours/etats";
import { Journal, TableauDuCas, VueBilan, VueDEtape, VueResultat } from "./etats-du-cours";
import { Calculatrice } from "./calculatrice";
import { SaisieEcriture } from "./saisie-ecriture";
import { enregistrerProgressionAction } from "@/app/cours/actions";

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
 *
 * LE GUIDE NE PORTE AUCUN CHAPITRE (audit, P0). Il reçoit de la page le seul chapitre
 * ouvert, réduit à ses données après le contrôle de la licence
 * (pedagogy/cours/chapitre-servi.ts) ; le curseur et le laboratoire lisent chaque
 * position au serveur (/api/cours/lecture). Importer ici le registre du cours mettrait
 * tous les chapitres, réservés compris, dans les fichiers publics
 * (scripts/verifier-bundles.ts).
 */

/** Le journal avant l'étape `index` : la balance d'ouverture et les écritures déjà passées. */
const journalAvant = (chapitre: ChapitreServi, index: number): Ecriture[] => chapitre.journal.slice(0, chapitre.ecrituresAvant[index]);
const etatAvant = (chapitre: ChapitreServi, index: number) => ({ soldes: soldes(journalAvant(chapitre, index)) });

/** Ce que montre une simulation à une position, lu au serveur ; null si la lecture échoue. */
async function lireAuServeur<T>(corps: Record<string, unknown>, signal?: AbortSignal): Promise<T | null> {
  try {
    const r = await fetch("/api/cours/lecture", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(corps),
      signal,
    });
    return r.ok ? ((await r.json()) as T) : null;
  } catch {
    return null;
  }
}

/**
 * La lecture d'une position que la page ne connaît pas d'avance : demandée au serveur un
 * court instant après le dernier geste, la précédente restant affichée en attendant.
 * `demande` nul : rien à lire (la position est connue).
 */
function useLectureAuServeur<T>(demande: Record<string, unknown> | null): T | null {
  const [lue, setLue] = useState<T | null>(null);
  const cle = demande ? JSON.stringify(demande) : null;
  useEffect(() => {
    if (!cle) return;
    const arret = new AbortController();
    const minuterie = setTimeout(() => {
      void lireAuServeur<T>(JSON.parse(cle) as Record<string, unknown>, arret.signal).then((v) => {
        if (v) setLue(v);
      });
    }, 40);
    return () => {
      clearTimeout(minuterie);
      arret.abort();
    };
  }, [cle]);
  return lue;
}

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

/** Un montant affiché : le signe moins typographique, comme dans les textes du cours. */
const montantAffiche = (x: number) => montantEcrit(x).replace(/^-/, "−");

/** Une ligne du laboratoire : en euros, ou dans son unité quand elle en a une (kilos, heures). */
const valeurDeLigne = (x: number, unite?: string) =>
  unite ? `${x.toLocaleString("fr-FR", { maximumFractionDigits: 2 }).replace(/^-/, "−")} ${unite}` : montantAffiche(x);

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
                    {l.quantite} × {montantAffiche(l.prixUnitaire)} HT
                  </span>
                )}
              </td>
              <td className="py-1 text-right tabular-nums">{montantAffiche(l.montant)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          {p.totaux.map((t) => (
            <tr key={t.libelle} className={t.fort ? "border-t border-slate-300 font-semibold" : ""}>
              <td className="py-1 pr-2">{t.libelle}</td>
              <td className="py-1 text-right tabular-nums">{montantAffiche(t.montant)}</td>
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
  chapitre: ChapitreServi;
  index: number;
  suivi: SuiviDEtape | undefined;
  classe: boolean;
  /** Noter un essai ; `remarques` dit à l'enseignant ce qui n'allait pas (en classe). */
  noter: (m: Partial<SuiviDEtape> & { essai?: boolean; remarques?: string[] }) => void;
  suite: () => void;
}

function BoutonSuite({ suite, dernier, terminer }: { suite: () => void; dernier: boolean; terminer: string }) {
  return (
    <div>
      <button type="button" className={bouton({ taille: "l" })} onClick={suite}>
        {dernier ? terminer : "Étape suivante"}
      </button>
    </div>
  );
}

function Lecture({ etape, noter, suite, chapitre, index }: PropsDEtape<LectureServie>) {
  return (
    <>
      <Paragraphes textes={etape.texte} />
      {etape.tableau && <TableauDuCas tableau={etape.tableau} />}
      {etape.repere && <Repere texte={etape.repere} />}
      <BoutonSuite
        dernier={index === chapitre.etapes.length - 1}
        suite={() => {
          noter({ reussi: true });
          suite();
        }}
        terminer={chapitre.mots.terminer}
      />
    </>
  );
}

function EtapeDEcriture({ etape, chapitre, index, suivi, classe, noter, suite }: PropsDEtape<EcritureServie>) {
  const attendue = etape.attendue;
  const [correction, setCorrection] = useState<Correction | null>(null);
  const [indices, setIndices] = useState(0);
  const fait = suivi?.reussi ?? false;
  const essais = suivi?.essais ?? 0;
  const tousLesIndices = etape.indices;
  const peutMontrer = classe || essais >= ESSAIS_AVANT_LA_CORRECTION;
  const journal = journalAvant(chapitre, index + 1);
  const avant = etatAvant(chapitre, index);
  const apres = etatAvant(chapitre, index + 1);
  const piece = etape.piece;
  return (
    <>
      <p className="max-w-2xl text-base leading-relaxed">{etape.evenement}</p>
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
            noter({ essai: true, ...(c.juste ? { reussi: true } : { remarques: c.remarques }) });
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
          <Paragraphes textes={etape.explication} />
          {etape.vue && (
            <div className="papier rounded-xl p-4 sm:p-5">
              <VueDEtape vue={etape.vue} journal={journal} soldes={apres.soldes} avant={avant.soldes} />
            </div>
          )}
          <BoutonSuite suite={suite} dernier={index === chapitre.etapes.length - 1} terminer={chapitre.mots.terminer} />
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

function EtapeDeChoix({ etape, chapitre, index, suivi, classe, noter, suite }: PropsDEtape<ChoixServi>) {
  const avant = etatAvant(chapitre, index);
  // L'ordre écrit met souvent la bonne réponse en tête : le serveur l'a mélangé, de façon stable.
  const options = etape.options;
  const [choisie, setChoisie] = useState<number | null>(null);
  const fait = suivi?.reussi ?? false;
  return (
    <>
      {etape.tableau && <TableauDuCas tableau={etape.tableau} />}
      <p className="max-w-2xl text-lg font-semibold leading-snug">{etape.question}</p>
      <Options
        options={options}
        choisie={choisie}
        fait={fait}
        onChoisir={(i) => {
          setChoisie(i);
          noter({
            essai: true,
            ...(options[i]!.juste ? { reussi: true } : { remarques: [`A répondu : « ${options[i]!.texte} »`] }),
          });
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
              <VueDEtape vue={etape.vue} journal={journalAvant(chapitre, index)} soldes={avant.soldes} />
            </div>
          )}
          <BoutonSuite suite={suite} dernier={index === chapitre.etapes.length - 1} terminer={chapitre.mots.terminer} />
        </>
      )}
    </>
  );
}

function EtapeDeMontants({ etape, chapitre, index, suivi, classe, noter, suite }: PropsDEtape<MontantsServis>) {
  const avant = etatAvant(chapitre, index);
  const champs = etape.champs;
  const [valeurs, setValeurs] = useState<string[]>(() => champs.map(() => ""));
  const [verifie, setVerifie] = useState<boolean[] | null>(null);
  const racine = useId();
  const fait = suivi?.reussi ?? false;
  const essais = suivi?.essais ?? 0;
  const peutMontrer = classe || essais >= ESSAIS_AVANT_LA_CORRECTION;
  return (
    <>
      {etape.tableau && <TableauDuCas tableau={etape.tableau} />}
      <p className="max-w-2xl text-base leading-relaxed">{etape.question}</p>
      <form
        className="grid max-w-xl gap-3"
        onSubmit={(ev) => {
          ev.preventDefault();
          const v = champs.map((c, i) => champJuste(valeurs[i] ?? "", c));
          setVerifie(v);
          noter({
            essai: true,
            ...(v.every(Boolean)
              ? { reussi: true }
              : { remarques: champs.filter((_, i) => !v[i]).map((c) => `${c.libelle} : montant faux`) }),
          });
        }}
      >
        {champs.map((c, i) => (
          // Le bouton de signe reste hors du libellé : le nom du champ est son libellé, rien de plus.
          <div key={c.libelle} className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_15rem] sm:items-center sm:gap-3">
            <label htmlFor={`${racine}-${i}`} className="text-sm">
              {c.libelle}
            </label>
            <span className="flex items-center gap-2">
              <input
                id={`${racine}-${i}`}
                className="champ w-full min-w-0 px-2.5 py-2 text-right tabular-nums"
                inputMode="decimal"
                autoComplete="off"
                value={fait && !valeurs[i] ? String(c.attendu).replace(".", ",") : valeurs[i]}
                disabled={fait}
                onChange={(e) => setValeurs((vs) => vs.map((x, j) => (j === i ? e.target.value : x)))}
              />
              {/* Sur chaque champ, pour ne rien dire du signe attendu : un téléphone n'a pas de touche moins. */}
              <button
                type="button"
                className="champ shrink-0 px-2.5 py-2 text-sm tabular-nums pointer-coarse:min-h-11 pointer-coarse:min-w-11"
                aria-label={`Changer le signe : ${c.libelle}`}
                title="Changer le signe"
                disabled={fait}
                onClick={() => setValeurs((vs) => vs.map((x, j) => (j === i ? changerDeSigne(x) : x)))}
              >
                +/−
              </button>
              <span className="w-5 text-sm" aria-label={verifie ? (verifie[i] ? "juste" : "faux") : undefined}>
                {verifie ? (verifie[i] ? "✓" : "✗") : ""}
              </span>
            </span>
          </div>
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
          <Paragraphes textes={etape.explication} />
          {etape.vue && (
            <div className="papier rounded-xl p-4 sm:p-5">
              <VueDEtape vue={etape.vue} journal={journalAvant(chapitre, index)} soldes={avant.soldes} />
            </div>
          )}
          <BoutonSuite suite={suite} dernier={index === chapitre.etapes.length - 1} terminer={chapitre.mots.terminer} />
        </>
      )}
    </>
  );
}

function EtapeDeTri({ etape, chapitre, index, suivi, classe, noter, suite }: PropsDEtape<TriServi>) {
  const elements = etape.elements;
  const [choix, setChoix] = useState<(string | null)[]>(() => elements.map(() => null));
  const [verifie, setVerifie] = useState<boolean[] | null>(null);
  const fait = suivi?.reussi ?? false;
  const essais = suivi?.essais ?? 0;
  const peutMontrer = classe || essais >= ESSAIS_AVANT_LA_CORRECTION;
  const libelleDe = (code: string) => etape.categories.find((k) => k.code === code)?.libelle ?? code;
  return (
    <>
      {etape.tableau && <TableauDuCas tableau={etape.tableau} />}
      <p className="max-w-2xl text-base leading-relaxed">{etape.question}</p>
      <ul className="grid max-w-2xl gap-2" aria-label="Éléments à ranger">
        {elements.map((el, i) => {
          const valeur = fait ? el.categorie : choix[i];
          return (
            <li key={el.libelle} className="grid gap-1.5 rounded-lg border border-slate-600 px-3 py-2.5" data-element={el.libelle}>
              <p className="flex flex-wrap items-baseline justify-between gap-x-3">
                <span>{el.libelle}</span>
                <span className="whitespace-nowrap tabular-nums text-slate-300">{montantAffiche(el.montant)}</span>
              </p>
              <div className="flex flex-wrap items-center gap-2" role="radiogroup" aria-label={el.libelle}>
                {etape.categories.map((k) => (
                  <button
                    key={k.code}
                    type="button"
                    role="radio"
                    aria-checked={valeur === k.code}
                    disabled={fait}
                    onClick={() => setChoix((cs) => cs.map((x, j) => (j === i ? k.code : x)))}
                    className={`min-h-10 rounded-lg border px-3 text-sm ${valeur === k.code ? "border-amber-400 font-semibold" : "border-slate-600"}`}
                  >
                    {k.libelle}
                  </button>
                ))}
                {verifie && !fait && <span className="text-sm">{verifie[i] ? "✓" : "✗"}</span>}
              </div>
              {fait && <p className="text-sm text-slate-400">{el.pourquoi}</p>}
            </li>
          );
        })}
      </ul>
      {!fait && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className={bouton({ taille: "m" })}
            disabled={choix.some((x) => x === null)}
            onClick={() => {
              const v = elements.map((el, i) => choix[i] === el.categorie);
              setVerifie(v);
              noter({
                essai: true,
                ...(v.every(Boolean)
                  ? { reussi: true }
                  : {
                      remarques: elements.flatMap((el, i) =>
                        v[i] ? [] : [`Rangé en « ${libelleDe(choix[i] ?? "")} » à tort : ${el.libelle}`],
                      ),
                    }),
              });
            }}
          >
            Vérifier
          </button>
          {peutMontrer && (
            <button type="button" className={bouton({ variante: "secondaire", taille: "m" })} onClick={() => noter({ aide: true, reussi: true })}>
              Voir la correction
            </button>
          )}
        </div>
      )}
      {verifie && !fait && (
        <p className="encadre-perte max-w-2xl rounded-lg px-4 py-2.5 text-sm" role="alert">
          {verifie.filter((x) => !x).length === 1 ? "Un élément est mal rangé." : `${verifie.filter((x) => !x).length} éléments sont mal rangés.`} Demandez-vous : si les ventes doublaient, cette charge doublerait-elle ?
        </p>
      )}
      {fait && (
        <>
          <Paragraphes textes={etape.explication} />
          <BoutonSuite suite={suite} dernier={index === chapitre.etapes.length - 1} terminer={chapitre.mots.terminer} />
        </>
      )}
    </>
  );
}

/** Le graphique de la simulation : deux droites, leur croisement, et la position du curseur. */
function GraphiqueDuSeuil({
  min,
  max,
  produit,
  cout,
  ici,
  libelles,
  zones,
  position,
  axe,
}: {
  min: number;
  max: number;
  /** Les deux droites à leurs extrémités, et à la position du curseur (lue au serveur). */
  produit: readonly [number, number];
  cout: readonly [number, number];
  ici: { produit: number; cout: number };
  libelles: [string, string];
  zones: readonly [string, string];
  position: number;
  axe: string;
}) {
  const L = 560;
  const H = 260;
  const marge = { g: 8, d: 8, h: 12, b: 26 };
  // L'axe des montants va de zéro (ou du plus bas des deux droites, s'il est négatif) au plus haut.
  const valeurs = [...produit, ...cout];
  const hautMax = Math.max(...valeurs, 0) * 1.05 || 1;
  const basMin = Math.min(...valeurs, 0) * 1.05;
  const x = (q: number) => marge.g + ((q - min) / (max - min || 1)) * (L - marge.g - marge.d);
  const y = (v: number) => H - marge.b - ((v - basMin) / (hautMax - basMin)) * (H - marge.h - marge.b);
  const ligne = ([a, b]: readonly [number, number]) => `M ${x(min)} ${y(a)} L ${x(max)} ${y(b)}`;
  const couvre = ici.produit >= ici.cout;
  return (
    <figure className="grid gap-2">
      <svg viewBox={`0 0 ${L} ${H}`} className="h-auto w-full max-w-2xl" role="img" aria-label={`${libelles[0]} et ${libelles[1]} selon ${axe}`}>
        <line x1={x(min)} y1={y(0)} x2={x(max)} y2={y(0)} stroke="currentColor" strokeOpacity="0.4" />
        <path d={ligne(cout)} stroke="#b45309" strokeWidth="2.5" fill="none" />
        <path d={ligne(produit)} stroke="#0e7490" strokeWidth="2.5" fill="none" />
        <line x1={x(position)} y1={H - marge.b} x2={x(position)} y2={marge.h} stroke="currentColor" strokeDasharray="4 4" strokeOpacity="0.6" />
        <circle cx={x(position)} cy={y(ici.produit)} r="5" fill="#0e7490" />
        <circle cx={x(position)} cy={y(ici.cout)} r="5" fill="#b45309" />
        <text x={x(min)} y={H - 6} fontSize="12" fill="currentColor">
          {min.toLocaleString("fr-FR")}
        </text>
        <text x={x(max)} y={H - 6} fontSize="12" fill="currentColor" textAnchor="end">
          {max.toLocaleString("fr-FR")}
        </text>
      </svg>
      <figcaption className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-1 w-5" style={{ background: "#0e7490" }} /> {libelles[0]}
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="inline-block h-1 w-5" style={{ background: "#b45309" }} /> {libelles[1]}
        </span>
        <span className="font-semibold">{couvre ? zones[0] : zones[1]}</span>
      </figcaption>
    </figure>
  );
}

function EtapeDeCurseur({ etape, cas, chapitre, index, suivi, classe, noter, suite }: PropsDEtape<CurseurServi>) {
  const { attendu, max, min } = etape.cible;
  const { droites, grandeur, parDefaut, rates } = etape;
  const fait = suivi?.reussi ?? false;
  const essais = suivi?.essais ?? 0;
  const [valeur, setValeur] = useState(etape.depart);
  const [rate, setRate] = useState<string | null>(null);
  const position = fait ? attendu : valeur;
  // Le départ et la position attendue sont servis avec l'étape ; les autres se lisent au serveur.
  const connue = position === attendu ? etape.lectureAttendue : position === etape.depart ? etape.lectureDeDepart : null;
  const lue = useLectureAuServeur<LectureDuCurseur>(
    connue ? null : { chapitre: chapitre.code, entreprise: cas.code, etape: etape.id, quantite: position },
  );
  const lecture = connue ?? lue ?? etape.lectureDeDepart;
  const peutMontrer = classe || essais >= ESSAIS_AVANT_LA_CORRECTION;
  const borne = (n: number) => Math.min(max, Math.max(min, n));
  return (
    <>
      <p className="max-w-2xl text-base leading-relaxed">{etape.question}</p>
      <div className="papier grid gap-4 rounded-xl p-4 sm:p-5" data-simulation="">
        <label className="grid gap-2">
          <span className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
            <span>
              {grandeur.libelle} : <strong className="text-lg tabular-nums">{position.toLocaleString("fr-FR")}</strong> {grandeur.unite}
            </span>
          </span>
          <input
            type="range"
            onWheel={sansMolette}
            min={min}
            max={max}
            step={1}
            value={position}
            disabled={fait}
            aria-label={grandeur.libelle}
            onChange={(e) => {
              setValeur(Number(e.target.value));
              setRate(null);
            }}
            className="w-full accent-amber-400"
          />
          {!fait && (
            <span className="flex flex-wrap items-center gap-2 text-sm">
              <button
                type="button"
                className={bouton({ variante: "secondaire", taille: "s" })}
                onClick={() => setValeur((q) => borne(q - 1))}
                aria-label={parDefaut ? "Une vente de moins" : `${grandeur.libelle} : un de moins`}
              >
                −1
              </button>
              <button
                type="button"
                className={bouton({ variante: "secondaire", taille: "s" })}
                onClick={() => setValeur((q) => borne(q + 1))}
                aria-label={parDefaut ? "Une vente de plus" : `${grandeur.libelle} : un de plus`}
              >
                +1
              </button>
              <input
                className="champ w-28 px-2 py-1 text-right tabular-nums"
                inputMode="numeric"
                aria-label={`${grandeur.libelle}, au clavier`}
                value={valeur}
                onChange={(e) => {
                  const n = Number(e.target.value.replace(/\D/g, ""));
                  if (Number.isFinite(n)) setValeur(Math.min(max, n));
                }}
              />
            </span>
          )}
        </label>
        <GraphiqueDuSeuil
          min={min}
          max={max}
          produit={droites.produit}
          cout={droites.cout}
          ici={lecture}
          libelles={droites.libelles}
          zones={etape.zones}
          position={position}
          axe={grandeur.libelle.toLowerCase()}
        />
        <table className="w-full max-w-md text-sm">
          <tbody>
            {lecture.lignes.map((l) => (
              <tr key={l.libelle} className={l.fort ? "border-t border-slate-300 font-semibold" : ""}>
                <td className="py-1 pr-2">{l.libelle}</td>
                <td className="whitespace-nowrap py-1 text-right tabular-nums" data-lecture={l.libelle}>
                  {montantAffiche(l.montant)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!fait && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className={bouton({ taille: "m" })}
            onClick={() => {
              const juste = valeur === attendu;
              setRate(juste ? null : valeur < attendu ? rates.dessous : rates.dessus);
              noter({ essai: true, ...(juste ? { reussi: true } : { remarques: [`A placé le curseur à ${valeur.toLocaleString("fr-FR")} ${grandeur.unite}`] }) });
            }}
          >
            Valider cette position
          </button>
          {peutMontrer && (
            <button type="button" className={bouton({ variante: "secondaire", taille: "m" })} onClick={() => noter({ aide: true, reussi: true })}>
              {etape.montrer ?? "Montrer le seuil"}
            </button>
          )}
        </div>
      )}
      {rate && (
        <p className="encadre-perte max-w-2xl rounded-lg px-4 py-2.5 text-sm" role="alert">
          {rate}
        </p>
      )}
      {fait && (
        <>
          <Paragraphes textes={etape.explication} />
          <BoutonSuite suite={suite} dernier={index === chapitre.etapes.length - 1} terminer={chapitre.mots.terminer} />
        </>
      )}
    </>
  );
}

/** Une position des leviers, lue au clavier : la virgule française vaut le point. */
const lireLevier = (texte: string) => Number(texte.replace(/\s/g, "").replace(",", "."));
const ecrireLevier = (n: number) => n.toLocaleString("fr-FR", { maximumFractionDigits: 2, useGrouping: false });

/** La position ramenée dans les bornes du levier, sur son pas. */
function surLePas(l: { min: number; max: number; pas: number }, n: number) {
  const k = Math.round((Math.min(l.max, Math.max(l.min, n)) - l.min) / l.pas);
  return Math.round((l.min + k * l.pas) * 100) / 100;
}

/** Les couleurs des courbes du laboratoire, dans l'ordre : celles des deux droites du curseur, puis une troisième. */
const COULEURS_DES_COURBES = ["#0e7490", "#b45309", "#7c3aed"] as const;

/**
 * Le graphique du laboratoire : chaque courbe calculée point par point sur toute la course d'un
 * levier, les autres leviers à leur position du moment ; un trait marque la position de l'élève.
 */
function GraphiqueDuLaboratoire({
  graphique,
  points,
  levier,
  position,
}: {
  graphique: NonNullable<SimulationServie["graphique"]>;
  /** Les courbes calculées au serveur pour cette position (chapitre-servi.ts). */
  points: NonNullable<LectureDuLaboratoire["graphique"]>;
  levier: SimulationServie["leviers"][number];
  position: Readonly<Record<string, number>>;
}) {
  const L = 560;
  const H = 240;
  const marge = { g: 8, d: 8, h: 12, b: 26 };
  const { xs, series } = points;
  const courbes = graphique.libelles;
  const toutes = series.flat().filter(Number.isFinite);
  const plusHaut = Math.max(...toutes);
  const plusBas = Math.min(...toutes);
  // Des courbes loin de zéro (un CMPC entre 7 et 9 %) seraient écrasées par un axe qui part de
  // zéro : l'axe se resserre alors sur leurs valeurs, et ses bornes s'écrivent pour que l'échelle
  // reste lisible. Sinon, il garde zéro, et sa ligne.
  const loinDeZero = plusBas > 0 ? plusBas > plusHaut / 2 : plusHaut < 0 && plusHaut < plusBas / 2;
  const jeu = (plusHaut - plusBas) * 0.1 || Math.abs(plusHaut) * 0.05 || 1;
  const haut = loinDeZero ? plusHaut + jeu : Math.max(plusHaut, 0);
  const bas = loinDeZero ? plusBas - jeu : Math.min(plusBas, 0);
  const ecart = haut - bas || 1;
  const x = (v: number) => marge.g + ((v - levier.min) / (levier.max - levier.min || 1)) * (L - marge.g - marge.d);
  const y = (v: number) => H - marge.b - ((v - bas) / ecart) * (H - marge.h - marge.b);
  const ici = position[levier.code]!;
  const unite = graphique.unite ?? "€";
  return (
    <figure className="grid gap-2" data-graphique-du-laboratoire="">
      <svg viewBox={`0 0 ${L} ${H}`} className="h-auto w-full max-w-2xl" role="img" aria-label={`${courbes.join(", ")} selon ${levier.libelle.toLowerCase()}`}>
        {!loinDeZero && <line x1={x(levier.min)} y1={y(0)} x2={x(levier.max)} y2={y(0)} stroke="currentColor" strokeOpacity="0.4" />}
        {loinDeZero && (
          <>
            <text x={x(levier.min)} y={marge.h + 10} fontSize="11" fill="currentColor" opacity="0.7">
              {valeurDeLigne(haut, unite === "€" ? undefined : unite)}
            </text>
            <text x={x(levier.min)} y={H - marge.b - 4} fontSize="11" fill="currentColor" opacity="0.7">
              {valeurDeLigne(bas, unite === "€" ? undefined : unite)}
            </text>
          </>
        )}
        {series.map((pts, k) => (
          <polyline
            key={courbes[k]}
            points={pts.map((v, i) => `${x(xs[i]!)},${y(v)}`).join(" ")}
            fill="none"
            stroke={COULEURS_DES_COURBES[k % COULEURS_DES_COURBES.length]}
            strokeWidth="2.5"
          />
        ))}
        <line x1={x(ici)} y1={H - marge.b} x2={x(ici)} y2={marge.h} stroke="currentColor" strokeDasharray="4 4" strokeOpacity="0.6" />
        {courbes.map((c, k) => (
          <circle key={c} cx={x(ici)} cy={y(points.ici[k]!)} r="5" fill={COULEURS_DES_COURBES[k % COULEURS_DES_COURBES.length]} />
        ))}
        <text x={x(levier.min)} y={H - 6} fontSize="12" fill="currentColor">
          {levier.min.toLocaleString("fr-FR")} {levier.unite}
        </text>
        <text x={x(levier.max)} y={H - 6} fontSize="12" fill="currentColor" textAnchor="end">
          {levier.max.toLocaleString("fr-FR")} {levier.unite}
        </text>
      </svg>
      <figcaption className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {courbes.map((c, k) => (
          <span key={c} className="flex items-center gap-1.5">
            <span aria-hidden className="inline-block h-1 w-5" style={{ background: COULEURS_DES_COURBES[k % COULEURS_DES_COURBES.length] }} /> {c} :{" "}
            <strong className="tabular-nums">{valeurDeLigne(points.ici[k]!, unite === "€" ? undefined : unite)}</strong>
          </span>
        ))}
      </figcaption>
    </figure>
  );
}

/**
 * LE LABORATOIRE : chaque levier a son curseur, ses boutons d'un pas et sa saisie au clavier ;
 * le tableau suit en direct, avec la valeur de départ à côté et, sur les lignes d'effet, une
 * barre verte ou rouge à l'échelle des effets que les leviers peuvent produire. L'élève valide
 * quand il pense avoir relevé le défi ; ses essais restent écrits, pour qu'il compare.
 */
/** Deux positions des leviers égales. */
const memePosition = (a: Readonly<Record<string, number>>, b: Readonly<Record<string, number>>) =>
  Object.keys(a).length === Object.keys(b).length && Object.keys(a).every((k) => a[k] === b[k]);

function EtapeDeSimulation({ etape, cas, chapitre, index, suivi, classe, noter, suite }: PropsDEtape<SimulationServie>) {
  const { leviers } = etape;
  const defi = { consigne: etape.consigne, solution: etape.solution };
  const depart = useMemo(() => Object.fromEntries(leviers.map((l) => [l.code, l.depart])), [leviers]);
  const fait = suivi?.reussi ?? false;
  const essais = suivi?.essais ?? 0;
  const [position, setPosition] = useState<Record<string, number>>(depart);
  const [saisies, setSaisies] = useState<Record<string, string>>(() => Object.fromEntries(leviers.map((l) => [l.code, ecrireLevier(l.depart)])));
  const [indice, setIndice] = useState<string | null>(null);
  const [traces, setTraces] = useState<{ position: Record<string, number>; atteint: boolean }[]>([]);
  const [reussie, setReussie] = useState<{ position: Record<string, number>; lecture: LectureDuLaboratoire } | null>(null);
  const [verification, setVerification] = useState(false);
  const affichee = fait ? (reussie?.position ?? defi.solution) : position;
  // Le départ et la solution sont servis avec l'étape ; les autres positions se lisent au serveur.
  const connue = fait
    ? (reussie?.lecture ?? etape.lectureDeLaSolution)
    : memePosition(position, depart)
      ? etape.lectureDeDepart
      : memePosition(position, defi.solution)
        ? etape.lectureDeLaSolution
        : null;
  const demande = { chapitre: chapitre.code, entreprise: cas.code, etape: etape.id };
  const lue = useLectureAuServeur<LectureDuLaboratoire>(connue ? null : { ...demande, position });
  const lecture = connue ?? lue ?? etape.lectureDeDepart;
  const graphique = etape.graphique;
  const peutMontrer = classe || essais >= ESSAIS_AVANT_LA_CORRECTION;
  // L'échelle des barres : le plus grand effet au départ, à la solution ou à la position du moment.
  // Elle suit l'élève : une barre se compare toujours à ce qu'il a sous les yeux.
  const echelle = Math.max(1, etape.lectureDeDepart.plusGrandEffet, etape.lectureDeLaSolution.plusGrandEffet, lecture.plusGrandEffet);
  const placer = (code: string, n: number) => {
    const l = leviers.find((x) => x.code === code)!;
    const v = surLePas(l, n);
    setPosition((p) => ({ ...p, [code]: v }));
    setSaisies((s) => ({ ...s, [code]: ecrireLevier(v) }));
    setIndice(null);
  };
  return (
    <>
      <p className="max-w-2xl text-base leading-relaxed">{etape.question}</p>
      <p className="encadre-distinction max-w-2xl rounded-lg px-4 py-2.5 text-sm font-semibold" data-defi="">
        {defi.consigne}
      </p>
      <div className="papier grid gap-5 rounded-xl p-4 sm:p-5" data-laboratoire="">
        <div className="grid gap-4 sm:grid-cols-2">
          {leviers.map((l) =>
            l.choix ? (
              <fieldset key={l.code} className="grid min-w-0 gap-2" data-levier-a-choix={l.code}>
                <legend className="text-sm">
                  {l.libelle} : <strong className="text-lg">{l.choix.find((x) => x.valeur === affichee[l.code])?.libelle}</strong>
                </legend>
                <span className="flex flex-wrap gap-2">
                  {l.choix.map((x) => (
                    <label key={x.valeur} className={`${bouton({ variante: affichee[l.code] === x.valeur ? "principal" : "secondaire", taille: "s" })} cursor-pointer`}>
                      <input
                        type="radio"
                        className="sr-only"
                        name={`${etape.id}-${l.code}`}
                        checked={affichee[l.code] === x.valeur}
                        disabled={fait}
                        onChange={() => {
                          setPosition((p) => ({ ...p, [l.code]: x.valeur }));
                          setIndice(null);
                        }}
                      />
                      {x.libelle}
                    </label>
                  ))}
                </span>
              </fieldset>
            ) : (
              <label key={l.code} className="grid min-w-0 gap-2">
                <span className="text-sm">
                  {l.libelle} : <strong className="text-lg tabular-nums">{affichee[l.code]!.toLocaleString("fr-FR")}</strong> {l.unite}
                </span>
                <input
                  type="range"
                  onWheel={sansMolette}
                  min={l.min}
                  max={l.max}
                  step={l.pas}
                  value={affichee[l.code]}
                  disabled={fait}
                  aria-label={l.libelle}
                  onChange={(e) => placer(l.code, Number(e.target.value))}
                  className="w-full accent-amber-400"
                />
                {!fait && (
                  <span className="flex flex-wrap items-center gap-2 text-sm">
                    <button type="button" className={bouton({ variante: "secondaire", taille: "s" })} onClick={() => placer(l.code, affichee[l.code]! - l.pas)} aria-label={`${l.libelle} : un pas de moins`}>
                      −
                    </button>
                    <button type="button" className={bouton({ variante: "secondaire", taille: "s" })} onClick={() => placer(l.code, affichee[l.code]! + l.pas)} aria-label={`${l.libelle} : un pas de plus`}>
                      +
                    </button>
                    <input
                      className="champ w-28 px-2 py-1 text-right tabular-nums"
                      inputMode="decimal"
                      aria-label={`${l.libelle}, au clavier`}
                      value={saisies[l.code]}
                      onChange={(e) => {
                        const texte = e.target.value;
                        setSaisies((s) => ({ ...s, [l.code]: texte }));
                        const n = lireLevier(texte);
                        if (texte.trim() !== "" && Number.isFinite(n) && n >= l.min && n <= l.max) {
                          setPosition((p) => ({ ...p, [l.code]: surLePas(l, n) }));
                          setIndice(null);
                        }
                      }}
                    />
                  </span>
                )}
              </label>
            ),
          )}
        </div>
        {graphique && lecture.graphique && (
          <GraphiqueDuLaboratoire graphique={graphique} points={lecture.graphique} levier={leviers.find((l) => l.code === graphique.levier)!} position={affichee} />
        )}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[22rem] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-etiquette">
                <th className="py-1 pr-2 font-semibold">Ce que montre la simulation</th>
                <th className="py-1 pr-2 text-right font-semibold">Au départ</th>
                <th className="py-1 pr-2 text-right font-semibold">Maintenant</th>
                <th className="w-[30%] py-1" aria-hidden />
              </tr>
            </thead>
            <tbody>
              {lecture.lignes.map((x) => {
                const largeur = x.effet ? Math.min(50, (Math.abs(x.montant) / echelle) * 50) : 0;
                return (
                  <tr key={x.libelle} className={x.fort ? "border-t border-slate-300 font-semibold" : ""}>
                    <td className="py-1 pr-2">{x.libelle}</td>
                    <td className="whitespace-nowrap py-1 pr-2 text-right tabular-nums opacity-70">{x.reference === undefined ? "" : valeurDeLigne(x.reference, x.unite)}</td>
                    <td className="whitespace-nowrap py-1 pr-2 text-right tabular-nums" data-lecture={x.libelle}>
                      {valeurDeLigne(x.montant, x.unite)}
                    </td>
                    <td className="py-1" aria-hidden>
                      {x.effet && (
                        <span className="relative block h-3">
                          <span className="absolute left-1/2 top-0 h-3 w-px bg-current opacity-40" />
                          <span
                            className="absolute top-0.5 h-2 rounded-md"
                            style={{
                              width: `${largeur}%`,
                              left: x.montant >= 0 ? "50%" : `${50 - largeur}%`,
                              background: x.montant >= 0 ? "var(--color-emerald-400)" : "var(--color-red-400)",
                            }}
                          />
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {lecture.lignes.some((x) => x.effet) && <p className="text-xs opacity-80">Barre verte : favorable au résultat ; rouge : défavorable.</p>}
      </div>
      {!fait && (
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className={bouton({ taille: "m" })}
            disabled={verification}
            onClick={async () => {
              // La position se vérifie au serveur : le défi fait partie du chapitre.
              setVerification(true);
              const lu = memePosition(position, depart)
                ? etape.lectureDeDepart
                : await lireAuServeur<LectureDuLaboratoire>({ ...demande, position });
              setVerification(false);
              if (!lu) {
                setIndice("La simulation ne répond pas : vérifiez la connexion, puis validez de nouveau.");
                return;
              }
              const juste = lu.atteint;
              setTraces((t) => [...t, { position, atteint: juste }].slice(-5));
              setIndice(juste ? null : lu.indice);
              if (juste) setReussie({ position, lecture: lu });
              const ou = leviers.map((l) => `${l.libelle} ${position[l.code]!.toLocaleString("fr-FR")} ${l.unite}`).join(", ");
              noter({ essai: true, ...(juste ? { reussi: true } : { remarques: [`A essayé : ${ou}`] }) });
            }}
          >
            Valider cette position
          </button>
          <button
            type="button"
            className={bouton({ variante: "secondaire", taille: "m" })}
            onClick={() => {
              setPosition(depart);
              setSaisies(Object.fromEntries(leviers.map((l) => [l.code, ecrireLevier(l.depart)])));
              setIndice(null);
            }}
          >
            Revenir au départ
          </button>
          {peutMontrer && (
            <button type="button" className={bouton({ variante: "secondaire", taille: "m" })} onClick={() => noter({ aide: true, reussi: true })}>
              {etape.montrer ?? "Montrer une solution"}
            </button>
          )}
        </div>
      )}
      {indice && (
        <p className="encadre-perte max-w-2xl rounded-lg px-4 py-2.5 text-sm" role="alert">
          {indice}
        </p>
      )}
      {traces.length > 0 && !fait && (
        <details className="max-w-2xl text-sm" open>
          <summary className="cursor-pointer font-semibold">Vos essais</summary>
          <ol className="mt-2 grid gap-1">
            {traces.map((t, i) => (
              <li key={i} className="tabular-nums">
                {leviers.map((l) => `${l.libelle} ${t.position[l.code]!.toLocaleString("fr-FR")} ${l.unite}`).join(" · ")} : {t.atteint ? "défi relevé" : "pas encore"}
              </li>
            ))}
          </ol>
        </details>
      )}
      {fait && (
        <>
          <Paragraphes textes={lecture.explication ?? etape.lectureDeLaSolution.explication ?? []} />
          <BoutonSuite suite={suite} dernier={index === chapitre.etapes.length - 1} terminer={chapitre.mots.terminer} />
        </>
      )}
    </>
  );
}

function EtapeDeComparaison({ etape, chapitre, index, suivi, classe, noter, suite }: PropsDEtape<ComparaisonServie>) {
  const avant = etatAvant(chapitre, etape.avantLEtape);
  const apres = etatAvant(chapitre, index);
  const options = etape.options;
  const [choisie, setChoisie] = useState<number | null>(null);
  const fait = suivi?.reussi ?? false;
  return (
    <>
      <p className="max-w-2xl text-lg font-semibold leading-snug">{etape.question}</p>
      <Options
        options={options}
        choisie={choisie}
        fait={fait}
        onChoisir={(i) => {
          setChoisie(i);
          noter({
            essai: true,
            ...(options[i]!.juste ? { reussi: true } : { remarques: [`A répondu : « ${options[i]!.texte} »`] }),
          });
        }}
      />
      {!fait && classe && (
        <button type="button" className={bouton({ variante: "secondaire", taille: "s" })} onClick={() => noter({ aide: true, reussi: true })}>
          Montrer la réponse
        </button>
      )}
      {fait && (
        <>
          <Paragraphes textes={etape.explication} />
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
          <BoutonSuite suite={suite} dernier={index === chapitre.etapes.length - 1} terminer={chapitre.mots.terminer} />
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
  chapitre: ChapitreServi;
  courant: number;
  suivi: Suivi;
  aller: (i: number) => void;
}) {
  return (
    <nav aria-label={chapitre.mots.etapes}>
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

/**
 * LE CHAPITRE, REPRIS DANS L'ARÈNE. Le geste à faire, les écrans où lire ce qu'il produit,
 * la question à rapporter, et la partie qui s'ouvre sur la même entreprise, au bon niveau.
 */
function EtMaintenantJouezLe({ mission, cas }: { mission: MissionAffichee; cas: Cas }) {
  return (
    <section className="carte grid gap-3 p-4 sm:p-5" aria-labelledby="jouez-le" data-jouez-le="">
      <div className="grid gap-1">
        <p className="text-sm font-semibold uppercase tracking-etiquette text-amber-300">Dans l&apos;arène</p>
        <h3 id="jouez-le" className="text-xl font-bold text-slate-50">
          Et maintenant, jouez-le
        </h3>
      </div>
      <p className="max-w-2xl text-slate-200">{mission.faire}</p>
      <div className="grid gap-1">
        <p className="text-sm font-semibold text-slate-100">Où regarder</p>
        <ul className="grid gap-0.5 text-sm text-slate-300">
          {mission.ou.map((chemin) => (
            <li key={chemin}>{chemin}</li>
          ))}
        </ul>
      </div>
      <div className="grid gap-1">
        <p className="text-sm font-semibold text-slate-100">Ce que vous y cherchez</p>
        <p className="max-w-2xl text-slate-200">{mission.chercher}</p>
      </div>
      <p className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Link href={mission.adresse} className={bouton({ taille: "m" })}>
          Jouer {cas.entreprise} au niveau {mission.niveau}
        </Link>
        {mission.reservee && <span className="text-sm text-slate-400">{mission.reservee}</span>}
      </p>
    </section>
  );
}

/**
 * LE RAPPEL DE L'ÉNONCÉ, PLIÉ (demande du propriétaire, octobre 2026). Au moment
 * des calculs, l'élève remontait jusqu'à la première étape pour relire la demande
 * et ses chiffres. Le rappel la redonne sur chaque étape notée, fermé pour ne
 * pas allonger la page : un clic l'ouvre. Rien quand la première étape n'est pas
 * un énoncé chiffré (une lecture avec son tableau).
 */
function RappelDeLEnonce({ enonce }: { enonce: EtapeServie }) {
  if (enonce.type !== "lecture" || !enonce.tableau) return null;
  return (
    <details className="papier rounded-xl p-3" data-rappel-enonce="">
      <summary className="cursor-pointer text-sm font-semibold">Rappel de l&apos;énoncé : {enonce.titre}</summary>
      <div className="mt-3 grid gap-3">
        {enonce.texte.map((t) => (
          <p key={t} className="max-w-3xl text-sm leading-relaxed">
            {t}
          </p>
        ))}
        <TableauDuCas tableau={enonce.tableau} />
      </div>
    </details>
  );
}

/**
 * ET ENSUITE : LES PASSAGES VERS LES AUTRES BRIQUES. Un chapitre mène aux cas
 * pratiques qui reprennent ses calculs, un cas pratique rappelle les
 * chapitres où ils s'apprennent, et les deux proposent quelques épisodes du
 * thème. Tout est calculé par le serveur (pedagogy/cours/suites.ts) ; un bloc
 * vide ne s'affiche pas.
 */
function EtEnsuite({ suites, cas }: { suites: SuitesDuChapitre; cas: Cas }) {
  const { theme, situations, reprend, episodes, episodesDuTheme } = suites;
  if (situations.length === 0 && reprend.length === 0 && episodes.length === 0) return null;
  const lienDeCours = (l: Lien, attribut: string) => (
    <li key={l.code} {...{ [attribut]: l.code }}>
      <Link href={`/cours/${l.code}?entreprise=${cas.code}`} className="text-amber-300 underline-offset-4 hover:underline">
        {l.titre}
      </Link>
    </li>
  );
  return (
    <section className="carte grid gap-4 p-4 sm:p-5" aria-labelledby="et-ensuite" data-et-ensuite="">
      <h3 id="et-ensuite" className="text-xl font-bold text-slate-50">
        Et ensuite
      </h3>
      {reprend.length > 0 && (
        <div className="grid gap-1" data-reprend="">
          <p className="text-sm font-semibold text-slate-100">Les chapitres où ces calculs s&apos;apprennent</p>
          <ul className="grid gap-0.5 text-sm">{reprend.map((l) => lienDeCours(l, "data-chapitre-repris"))}</ul>
        </div>
      )}
      {situations.length > 0 && (
        <div className="grid gap-1" data-suites-situations="">
          <p className="text-sm font-semibold text-slate-100">S&apos;entraîner sans guide, dans un cas neuf</p>
          <ul className="grid gap-0.5 text-sm">{situations.map((l) => lienDeCours(l, "data-suite-situation"))}</ul>
        </div>
      )}
      {episodes.length > 0 && (
        <div className="grid gap-1" data-suites-episodes="">
          <p className="text-sm font-semibold text-slate-100">Agir en situation de manager</p>
          <ul className="grid gap-0.5 text-sm">
            {episodes.map((l) => (
              <li key={l.code} data-suite-episode={l.code}>
                <Link href={`/entreprises/episode/${l.code}`} className="text-amber-300 underline-offset-4 hover:underline">
                  {l.titre}
                </Link>
              </li>
            ))}
          </ul>
          {theme && episodesDuTheme > episodes.length && (
            <p className="text-sm text-slate-400">
              <Link href={`/cours#theme-${theme.code}`} className="underline underline-offset-4 hover:text-slate-200">
                Les {episodesDuTheme} épisodes du thème {theme.titre}
              </Link>
            </p>
          )}
        </div>
      )}
    </section>
  );
}

function FinDuChapitre({
  chapitre,
  cas,
  suivi,
  entreprises,
  recommencer,
  classe,
  mission,
  suites,
}: {
  chapitre: ChapitreServi;
  cas: Cas;
  suivi: Suivi;
  entreprises: { code: string; nom: string }[];
  recommencer: () => void;
  classe: boolean;
  mission: MissionAffichee | null;
  suites: SuitesDuChapitre | null;
}) {
  const notees = chapitre.etapes.filter((e) => e.type !== "lecture");
  const duPremierCoup = notees.filter((e) => {
    const s = suivi.etapes[e.id];
    return s?.reussi && s.essais === 1 && !s.aide;
  }).length;
  const notions = [...new Set(chapitre.etapes.flatMap((e) => e.notions ?? []))];
  const journal: Ecriture[] = chapitre.journal;
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <p className="text-sm font-semibold uppercase tracking-etiquette text-amber-300">{chapitre.mots.termine}</p>
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
      {mission && <EtMaintenantJouezLe mission={mission} cas={cas} />}
      {suites && <EtEnsuite suites={suites} cas={cas} />}
      <Notions codes={notions} />
      <details className="papier rounded-xl p-4">
        <summary className="cursor-pointer font-semibold">{chapitre.mots.journal}</summary>
        <div className="mt-3">
          <Journal journal={journal} />
        </div>
      </details>
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className={bouton({ taille: "m" })} onClick={recommencer}>
          {chapitre.mots.recommencer}
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
  chapitre,
  cas,
  entreprises,
  classe,
  mission = null,
  enClasse = null,
  suites = null,
  calculatrice = true,
}: {
  /** Le chapitre ouvert, réduit à ses données pour cette entreprise, après le contrôle de la licence. */
  chapitre: ChapitreServi;
  cas: Cas;
  entreprises: { code: string; nom: string }[];
  classe: boolean;
  /** Ce que le chapitre propose de rejouer dans l'arène, préparé par la page. */
  mission?: MissionAffichee | null;
  /** La classe de l'élève, s'il en suit une : sa progression remonte à l'enseignant. */
  enClasse?: { classe: string; eleve: string } | null;
  /** Ce qui vient après : les cas pratiques, les chapitres repris, les épisodes du thème. */
  suites?: SuitesDuChapitre | null;
  /** La calculatrice, permise sauf si l'enseignant l'a retirée à la classe de l'élève. */
  calculatrice?: boolean;
}) {
  // Le chapitre est servi dans l'ordre de cette entreprise : ses règlements suivent leurs dates.
  const { code } = chapitre;
  const [suivi, changer, lu] = useSuivi(`cours:${code}:${cas.code}`);
  const [vue, setVue] = useState<number | null>(null);
  const n = chapitre.etapes.length;
  const fini = suivi.index >= n;
  const courant = Math.min(vue ?? suivi.index, n - 1);
  const etape = chapitre.etapes[courant]!;

  // EN CLASSE, chaque geste remonte : la progression entière (elle est petite) et, pour un
  // essai manqué, les remarques du correcteur. Hors classe, rien ne quitte l'appareil.
  // Chaque geste est un envoi daté par son numéro ; l'erreur d'un essai manqué voyage avec lui.
  const [envoi, setEnvoi] = useState<{ n: number; erreur?: { etape: string; remarques: string[] } }>({ n: 0 });
  useEffect(() => {
    if (envoi.n === 0 || !enClasse) return;
    void enregistrerProgressionAction({
      chapitre: code,
      entreprise: cas.code,
      etape: suivi.index,
      etapes: suivi.etapes,
      erreur: envoi.erreur,
    });
    // Une remontée par geste : `envoi` seul la déclenche, la progression est lue à jour.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [envoi]);
  const geste = (erreur?: { etape: string; remarques: string[] }) => setEnvoi((e) => ({ n: e.n + 1, erreur }));

  const noter = (id: string) => (m: Partial<SuiviDEtape> & { essai?: boolean; remarques?: string[] }) => {
    geste(m.remarques?.length ? { etape: id, remarques: m.remarques } : undefined);
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
  };
  const suite = () => {
    setVue(null);
    geste();
    changer((s) => ({ ...s, index: Math.max(s.index, courant + 1) }));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const recommencer = () => {
    setVue(null);
    geste();
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
    // Avec la calculatrice, un peu plus de place en bas : son bouton flotte au-dessus du dernier bouton de l'étape.
    <div className={`mx-auto max-w-6xl px-4 pt-8 sm:px-6 sm:pt-10 ${calculatrice ? "pb-28" : "pb-16"}`}>
      <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-xs uppercase tracking-annonce text-slate-400">
          <Link href="/cours" className="hover:text-slate-300">
            Cours
          </Link>{" "}
          · {chapitre.parcours} · Palier {chapitre.palier}
        </p>
        <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs font-semibold text-slate-300">{cas.entreprise}</span>
        {classe && <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs text-slate-400">Mode classe</span>}
        {enClasse && (
          <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs text-slate-400" data-en-classe="">
            {enClasse.classe} · {enClasse.eleve}
          </span>
        )}
        <span className="ml-auto text-sm tabular-nums text-slate-400">
          {fini ? "Terminé" : `Étape ${courant + 1} sur ${n}`}
        </span>
      </div>
      {calculatrice && lu && !(fini && vue === null) && <Calculatrice />}
      {!lu ? null : fini && vue === null ? (
        <FinDuChapitre
          chapitre={chapitre}
          cas={cas}
          suivi={suivi}
          entreprises={entreprises}
          recommencer={recommencer}
          classe={classe}
          mission={mission}
          suites={suites}
        />
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section className="grid min-w-0 gap-5" aria-live="polite" key={etape.id}>
            <div>
              <p className="text-sm font-semibold uppercase tracking-etiquette text-amber-300">
                {chapitre.titre} · Étape {courant + 1}
              </p>
              <h1 className="mt-1 text-3xl font-bold leading-tight tracking-tight text-slate-50">{etape.titre}</h1>
            </div>
            {etape.type !== "lecture" && <RappelDeLEnonce enonce={chapitre.etapes[0]!} />}
            {etape.type === "lecture" && <Lecture etape={etape} {...props} />}
            {etape.type === "ecriture" && <EtapeDEcriture etape={etape} {...props} />}
            {etape.type === "choix" && <EtapeDeChoix etape={etape} {...props} />}
            {etape.type === "montants" && <EtapeDeMontants etape={etape} {...props} />}
            {etape.type === "comparaison" && <EtapeDeComparaison etape={etape} {...props} />}
            {etape.type === "tri" && <EtapeDeTri etape={etape} {...props} />}
            {etape.type === "curseur" && <EtapeDeCurseur etape={etape} {...props} />}
            {etape.type === "simulation" && <EtapeDeSimulation etape={etape} {...props} />}
            <Notions codes={etape.notions} />
          </section>
          <aside className="grid gap-5 lg:sticky lg:top-24">
            {/* Sur téléphone, le sommaire se replie : il passerait sous l'étape, plus long qu'elle. */}
            <div className="carte p-3 max-lg:hidden">
              <Sommaire chapitre={chapitre} courant={courant} suivi={suivi} aller={(i) => setVue(i)} />
            </div>
            <details className="carte p-3 lg:hidden">
              <summary className="cursor-pointer text-sm font-semibold">{chapitre.mots.etapes}</summary>
              <div className="mt-2">
                <Sommaire chapitre={chapitre} courant={courant} suivi={suivi} aller={(i) => setVue(i)} />
              </div>
            </details>
{/* Le journal, pour les chapitres qui en tiennent un : le contrôle de gestion n'en passe pas. */}
            {chapitre.etapes.some((e) => e.type === "ecriture") && (
                          <details className="papier rounded-xl p-4" open={classe}>
              <summary className="cursor-pointer text-sm font-semibold">Le journal ({ecritures(journalAvant(chapitre, courant).length)})</summary>
              <div className="mt-3">
                <Journal journal={journalAvant(chapitre, courant)} />
              </div>
            </details>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
