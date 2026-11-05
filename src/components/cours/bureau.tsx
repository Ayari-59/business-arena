"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { bouton } from "@/components/bouton";
import { corrigerAuBureauAction } from "@/app/cours/bureau/actions";
import type { Correction } from "@/pedagogy/cours/correcteur";
import type { BureauServi, ClassementServi, EcritureMontree, EnvoiAuBureau, EtatServi, JournalServi, ReponseServie, RetourDuBureau } from "@/pedagogy/cours/bureau-servi";
import type { CorrectionDuTableau, TableauACompleter } from "@/pedagogy/cours/tableau-a-completer";
import { montantInsecable } from "@/pedagogy/cours/aides-du-guide";
import { montantEcrit } from "@/pedagogy/cours/correcteur";
import { Calculatrice } from "./calculatrice";
import { PieceDeLaPile } from "./piece-du-bureau";
import { SaisieEcriture } from "./saisie-ecriture";
import { CalculsDuTableau, GrilleACompleter } from "./tableau-a-completer";

/**
 * LE BUREAU DU COMPTABLE, À L'ÉCRAN (config/cours/bureaux, pedagogy/cours/bureau-servi.ts).
 *
 * La page sert la pile et les consignes, sans aucune réponse : chaque geste (un classement, un état, une
 * écriture, une réponse) part à l'action serveur, qui renvoie la correction de ce seul geste. Le composant
 * ne sait donc jamais ce qui est juste avant de l'avoir demandé ; il garde ce que le serveur lui a dit
 * (dans le navigateur de l'élève, pour reprendre où il en était) et l'affiche.
 *
 * LA PILE reste sous les yeux : les pièces de l'étape, ouvertes, puis toute la pile, repliée. Sur
 * téléphone, tout s'empile en une colonne ; aucune pièce n'a plus de deux colonnes (piece-du-bureau.tsx).
 */

const ESSAIS_AVANT_LA_CORRECTION = 2;
const montant = (x: number) => montantInsecable(montantEcrit(x)).replace(/^-/, "−");

/** Ce que l'élève a obtenu à une étape, tel que le serveur l'a dit. */
interface SuiviDEtape {
  /** Les essais manqués : la correction se propose après deux. */
  essais: number;
  reussi: boolean;
  aide: boolean;
  explication?: readonly string[];
  /** Le classement : ses choix, et pourquoi chaque élément va où il va. */
  choix?: Record<string, string>;
  pourquoi?: Record<string, string>;
  /** L'état : ses saisies et la grille entière, calculs compris, une fois l'état juste. */
  saisies?: Record<string, string>;
  grille?: TableauACompleter;
  /** Le journal : les écritures passées. */
  passees?: EcritureMontree[];
  /** Les réponses : la dernière option choisie à chaque question, et ce que le serveur en a dit. */
  reponses?: Record<string, { texte: string; juste: boolean; retour: string }>;
}

interface Suivi {
  index: number;
  etapes: Record<string, SuiviDEtape>;
}

const NEUF: Suivi = { index: 0, etapes: {} };
const VIERGE: SuiviDEtape = { essais: 0, reussi: false, aide: false };

/** Le suivi, gardé dans ce navigateur : l'élève reprend où il en était. */
function useSuivi(cle: string): [Suivi, (f: (s: Suivi) => Suivi) => void, boolean] {
  const [suivi, setSuivi] = useState<Suivi>(NEUF);
  const [lu, setLu] = useState(false);
  useEffect(() => {
    // Le suivi ne se lit qu'au navigateur : le rendu serveur part d'un bureau neuf.
    try {
      const brut = window.localStorage.getItem(cle);
      const s = brut ? (JSON.parse(brut) as Suivi) : null;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuivi(s && typeof s.index === "number" && s.etapes ? s : NEUF);
    } catch {
      // Un stockage illisible ou interdit : on repart de zéro.
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
        // Sans stockage, le bureau marche quand même ; il ne se reprend pas.
      }
      return n;
    });
  return [suivi, changer, lu];
}

/** Le message d'une correction qui n'a pas répondu, ou d'un accès refusé. */
const PANNE = "La correction n'a pas répondu : vérifiez votre connexion, puis réessayez.";
const REFUS: Record<string, string> = {
  licence: "Ce cas pratique n'est plus ouvert pour vous : rechargez la page.",
  bureau: "Ce bureau n'existe plus : rechargez la page.",
  envoi: "Votre réponse n'a pas pu être lue : réessayez.",
  etape: "Cette étape n'existe plus : rechargez la page.",
};

interface PropsDEtape<E> {
  etape: E;
  suivi: SuiviDEtape;
  noter: (m: Partial<SuiviDEtape> & { essai?: boolean }) => void;
  envoyer: (envoi: EnvoiAuBureau) => Promise<RetourDuBureau | null>;
}

function Paragraphes({ textes }: { textes: readonly string[] }) {
  return (
    <div className="grid max-w-2xl gap-3 text-base leading-relaxed">
      {textes.map((t) => (
        <p key={t}>{t}</p>
      ))}
    </div>
  );
}

function Explication({ textes }: { textes?: readonly string[] }) {
  if (!textes?.length) return null;
  return (
    <div className="encadre-neutre grid max-w-2xl gap-2 rounded-lg px-4 py-3 text-sm leading-relaxed" data-explication-du-bureau="">
      {textes.map((t) => (
        <p key={t}>{t}</p>
      ))}
    </div>
  );
}

function Alerte({ texte }: { texte: string | null }) {
  if (!texte) return null;
  return (
    <p className="encadre-perte max-w-2xl rounded-lg px-4 py-3 text-sm" role="alert">
      {texte}
    </p>
  );
}

/** Le bouton de la correction, après deux essais manqués. */
function BoutonDeCorrection({ suivi, montrer }: { suivi: SuiviDEtape; montrer: () => void }) {
  if (suivi.reussi || suivi.essais < ESSAIS_AVANT_LA_CORRECTION) return null;
  return (
    <button type="button" className={bouton({ variante: "secondaire", taille: "s" })} onClick={montrer}>
      Voir la correction
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CLASSER : LA PILE, LE POINTAGE
// ─────────────────────────────────────────────────────────────────────────────

function EtapeDeClassement({ etape, suivi, noter, envoyer, pile }: PropsDEtape<ClassementServi> & { pile: BureauServi["pile"] }) {
  const [choix, setChoix] = useState<Record<string, string>>(suivi.choix ?? {});
  const [fausses, setFausses] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const fait = suivi.reussi;
  const choisis = (fait ? suivi.choix : choix) ?? {};
  const verifier = async () => {
    setMessage(null);
    const r = await envoyer({ etape: etape.id, geste: "classer", choix });
    if (!r || !("geste" in r) || r.geste !== "classer") return;
    if (r.juste) {
      setFausses(new Set());
      noter({ reussi: true, choix, pourquoi: r.pourquoi, explication: r.explication });
    } else {
      setFausses(new Set(r.fausses));
      const vides = r.fausses.filter((x) => !choix[x]).length;
      setMessage(
        r.fausses.length === 1
          ? "Une ligne n'est pas encore à sa place."
          : `${r.fausses.length} lignes ne sont pas encore à leur place${vides ? `, dont ${vides} sans réponse` : ""}.`,
      );
      noter({ essai: true });
    }
  };
  const montrer = async () => {
    const r = await envoyer({ etape: etape.id, geste: "montrer" });
    if (r && "geste" in r && r.geste === "montrer" && r.choix) noter({ reussi: true, aide: true, choix: r.choix, pourquoi: r.pourquoi, explication: r.explication });
  };
  return (
    <>
      <ul className="grid gap-3">
        {etape.elements.map((x) => {
          const piece = x.piece ? pile.find((p) => p.code === x.piece) : undefined;
          const faux = !fait && fausses.has(x.code);
          return (
            <li key={x.code} className={`carte grid min-w-0 gap-2 p-3 ${faux ? "border-red-400" : ""}`} data-element={x.code}>
              <p className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <span className="min-w-0 font-medium text-slate-100">{x.libelle}</span>
                {x.montant !== undefined && <span className="whitespace-nowrap tabular-nums text-slate-200">{montant(x.montant)}</span>}
              </p>
              {piece && (
                <details className="group" data-ouvrir-la-piece={piece.code}>
                  <summary className="cursor-pointer text-sm text-amber-300 underline-offset-4 hover:underline">Ouvrir la pièce</summary>
                  <div className="mt-2">
                    <PieceDeLaPile piece={piece} />
                  </div>
                </details>
              )}
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={x.libelle}>
                {etape.categories.map((k) => (
                  <button
                    key={k.code}
                    type="button"
                    role="radio"
                    aria-checked={choisis[x.code] === k.code}
                    disabled={fait}
                    onClick={() => setChoix((c) => ({ ...c, [x.code]: k.code }))}
                    className={`min-h-10 rounded-lg border px-3 py-1.5 text-sm transition ${choisis[x.code] === k.code ? "border-amber-400 text-slate-50" : "border-slate-600 text-slate-300 enabled:hover:border-slate-400"}`}
                  >
                    {k.libelle}
                  </button>
                ))}
              </div>
              {faux && <p className="text-sm text-red-300">Pas encore : regardez la pièce de plus près.</p>}
              {fait && suivi.pourquoi?.[x.code] && <p className="encadre-gain rounded-lg px-3 py-2 text-sm">{suivi.pourquoi[x.code]}</p>}
            </li>
          );
        })}
      </ul>
      <Alerte texte={message} />
      {!fait && (
        <div className="flex flex-wrap gap-3">
          <button type="button" className={bouton({ taille: "m" })} onClick={() => void verifier()}>
            Vérifier
          </button>
          <BoutonDeCorrection suivi={suivi} montrer={() => void montrer()} />
        </div>
      )}
      {fait && <Explication textes={suivi.explication} />}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// L'ÉTAT DE RAPPROCHEMENT
// ─────────────────────────────────────────────────────────────────────────────

function EtapeDEtat({ etape, suivi, noter, envoyer }: PropsDEtape<EtatServi>) {
  const [saisies, setSaisies] = useState<Record<string, string>>(suivi.saisies ?? {});
  const [correction, setCorrection] = useState<CorrectionDuTableau | null>(null);
  const fait = suivi.reussi;
  const verifier = async () => {
    const r = await envoyer({ etape: etape.id, geste: "etat", saisies });
    if (!r || !("geste" in r) || r.geste !== "etat") return;
    setCorrection(r.correction);
    noter(r.juste ? { reussi: true, saisies, grille: r.grille, explication: r.explication } : { essai: true });
  };
  const montrer = async () => {
    const r = await envoyer({ etape: etape.id, geste: "montrer" });
    if (r && "geste" in r && r.geste === "montrer" && r.grille) noter({ reussi: true, aide: true, saisies: r.saisies, grille: r.grille, explication: r.explication });
  };
  return (
    <>
      <GrilleACompleter
        grille={fait && suivi.grille ? suivi.grille : etape.grille}
        saisies={fait ? (suivi.saisies ?? {}) : saisies}
        onSaisie={(cle, valeur) => setSaisies((s) => ({ ...s, [cle]: valeur }))}
        correction={fait ? null : correction}
        fait={fait}
      />
      {!fait && (
        <div className="flex flex-wrap gap-3">
          <button type="button" className={bouton({ taille: "m" })} onClick={() => void verifier()}>
            Vérifier
          </button>
          <BoutonDeCorrection suivi={suivi} montrer={() => void montrer()} />
        </div>
      )}
      {fait && <p className="encadre-gain max-w-2xl rounded-lg px-4 py-3 text-sm font-semibold" role="status" data-etat-juste="">Les deux soldes rectifiés sont égaux.</p>}
      {fait && suivi.grille && <CalculsDuTableau grille={suivi.grille} />}
      {fait && <Explication textes={suivi.explication} />}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LE JOURNAL
// ─────────────────────────────────────────────────────────────────────────────

function RetourDEcriture({ c }: { c: Correction }) {
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

function EcrituresPassees({ ecritures }: { ecritures: readonly EcritureMontree[] }) {
  if (ecritures.length === 0) return null;
  return (
    <section className="papier grid max-w-2xl gap-3 rounded-lg p-4 text-sm" aria-label="Les écritures passées" data-ecritures-passees="">
      <p className="font-semibold">Au journal</p>
      {ecritures.map((e) => (
        <div key={e.id} className="grid gap-1 border-t border-slate-200 pt-2 first:border-0 first:pt-0" data-ecriture-passee={e.id}>
          <p>
            <span className="text-slate-400">{e.date} · </span>
            {e.libelle}
          </p>
          <ul className="grid gap-0.5">
            {e.lignes.map((l, i) => (
              <li key={i} className="grid grid-cols-[4rem_minmax(0,1fr)_minmax(0,1fr)] gap-x-2 tabular-nums">
                <span>{l.compte}</span>
                <span className="text-right">{l.debit ? `${l.debit} €` : ""}</span>
                <span className="text-right">{l.credit ? `${l.credit} €` : ""}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function EtapeDuJournal({ etape, suivi, noter, envoyer }: PropsDEtape<JournalServi>) {
  const [correction, setCorrection] = useState<Correction | null>(null);
  const passees = suivi.passees ?? [];
  const fait = suivi.reussi;
  const valider = async (saisie: Parameters<Parameters<typeof SaisieEcriture>[0]["onValider"]>[0]) => {
    const r = await envoyer({ etape: etape.id, geste: "ecriture", saisie, faites: passees.map((e) => e.id) });
    if (!r || !("geste" in r) || r.geste !== "ecriture") return;
    setCorrection(r.correction);
    if (r.juste && r.passee) noter({ passees: [...passees, r.passee], ...(r.fini ? { reussi: true, explication: r.explication } : {}) });
    else noter({ essai: true });
  };
  const montrer = async () => {
    const r = await envoyer({ etape: etape.id, geste: "montrer" });
    if (r && "geste" in r && r.geste === "montrer" && r.ecritures) {
      setCorrection(null);
      noter({ reussi: true, aide: true, passees: r.ecritures, explication: r.explication });
    }
  };
  return (
    <>
      <EcrituresPassees ecritures={passees} />
      {!fait && (
        <section className="grid gap-3" aria-label="Le journal">
          <p className="text-sm font-semibold">Une écriture à passer</p>
          <SaisieEcriture key={passees.length} nombreDeLignes={3} verrouillee={false} onValider={(s) => void valider(s)} />
        </section>
      )}
      {correction && <RetourDEcriture c={correction} />}
      {!fait && (
        <div className="flex flex-wrap gap-3">
          <BoutonDeCorrection suivi={suivi} montrer={() => void montrer()} />
        </div>
      )}
      {fait && <Explication textes={suivi.explication} />}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LA RÉPONSE
// ─────────────────────────────────────────────────────────────────────────────

function EtapeDeReponse({ etape, suivi, noter, envoyer }: PropsDEtape<ReponseServie>) {
  const reponses = suivi.reponses ?? {};
  const fait = suivi.reussi;
  const choisir = async (question: string, texte: string) => {
    const justes = Object.entries(reponses)
      .filter(([, r]) => r.juste)
      .map(([q]) => q);
    const r = await envoyer({ etape: etape.id, geste: "repondre", question, option: texte, justes });
    if (!r || !("geste" in r) || r.geste !== "repondre") return;
    noter({
      essai: !r.juste,
      reponses: { ...reponses, [question]: { texte, juste: r.juste, retour: r.retour } },
      ...(r.fini ? { reussi: true, explication: r.explication } : {}),
    });
  };
  const montrer = async () => {
    const r = await envoyer({ etape: etape.id, geste: "montrer" });
    if (r && "geste" in r && r.geste === "montrer" && r.reponses) {
      noter({ reussi: true, aide: true, reponses: Object.fromEntries(r.reponses.map((x) => [x.question, { texte: x.texte, juste: true, retour: x.retour }])), explication: r.explication });
    }
  };
  return (
    <>
      <div className="grid gap-6">
        {etape.questions.map((q) => {
          const r = reponses[q.id];
          const close = r?.juste ?? false;
          return (
            <fieldset key={q.id} className="grid max-w-2xl gap-2" data-question={q.id}>
              <legend className="mb-2 text-lg font-semibold leading-snug">{q.question}</legend>
              <div className="grid gap-2" role="radiogroup" aria-label={q.question}>
                {q.options.map((o) => (
                  <div key={o.texte} className="grid gap-1">
                    <button
                      type="button"
                      role="radio"
                      aria-checked={r?.texte === o.texte}
                      disabled={close || fait}
                      onClick={() => void choisir(q.id, o.texte)}
                      className={`min-h-12 rounded-lg border px-4 py-3 text-left transition ${r?.texte === o.texte ? "border-amber-400" : "border-slate-600 enabled:hover:border-slate-400"}`}
                    >
                      {o.texte}
                    </button>
                    {r?.texte === o.texte && (
                      <p className={`${r.juste ? "encadre-gain" : "encadre-perte"} rounded-lg px-4 py-2 text-sm`}>
                        <strong className="font-semibold">{r.juste ? "Juste · " : "Non · "}</strong>
                        {r.retour}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </fieldset>
          );
        })}
      </div>
      {!fait && (
        <div className="flex flex-wrap gap-3">
          <BoutonDeCorrection suivi={suivi} montrer={() => void montrer()} />
        </div>
      )}
      {fait && <Explication textes={suivi.explication} />}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LE BUREAU
// ─────────────────────────────────────────────────────────────────────────────

/** Les pièces de l'étape, ouvertes ; puis le reste de la pile, replié. */
function LaPile({ pile, ouvertes }: { pile: BureauServi["pile"]; ouvertes: readonly string[] }) {
  const sousLesYeux = pile.filter((p) => ouvertes.includes(p.code));
  const reste = pile.filter((p) => !ouvertes.includes(p.code));
  return (
    <aside className="grid min-w-0 content-start gap-3" aria-label="La pile" data-pile="">
      {sousLesYeux.map((p) => (
        <PieceDeLaPile key={p.code} piece={p} />
      ))}
      <details className="carte p-3" data-toute-la-pile="">
        <summary className="cursor-pointer text-sm font-semibold text-slate-200">Toute la pile ({pile.length} pièces)</summary>
        <ul className="mt-3 grid gap-2">
          {reste.map((p) => (
            <li key={p.code}>
              <details>
                <summary className="cursor-pointer text-sm text-slate-300 underline-offset-4 hover:underline">{p.titre}</summary>
                <div className="mt-2">
                  <PieceDeLaPile piece={p} />
                </div>
              </details>
            </li>
          ))}
        </ul>
      </details>
    </aside>
  );
}

export function BureauDuComptable({ bureau }: { bureau: BureauServi }) {
  const [suivi, changer, lu] = useSuivi(`bureau:${bureau.code}`);
  const [panne, setPanne] = useState<string | null>(null);
  const n = bureau.etapes.length;
  const fini = suivi.index >= n;
  const courant = Math.min(suivi.index, n - 1);
  const etape = bureau.etapes[courant]!;
  const etat = suivi.etapes[etape.id] ?? VIERGE;

  const titre = useRef<HTMLHeadingElement>(null);
  const montee = useRef<string | null>(null);
  useEffect(() => {
    if (montee.current !== null && montee.current !== etape.id) titre.current?.focus();
    montee.current = etape.id;
  }, [etape.id]);

  const noter = (id: string) => (m: Partial<SuiviDEtape> & { essai?: boolean }) =>
    changer((s) => {
      const avant = s.etapes[id] ?? VIERGE;
      if (avant.reussi) return s;
      const { essai, ...reste } = m;
      return { ...s, etapes: { ...s.etapes, [id]: { ...avant, ...reste, essais: avant.essais + (essai ? 1 : 0) } } };
    });

  const envoyer = async (envoi: EnvoiAuBureau): Promise<RetourDuBureau | null> => {
    setPanne(null);
    try {
      const r = await corrigerAuBureauAction(bureau.code, envoi);
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

  const suite = () => {
    changer((s) => ({ ...s, index: Math.max(s.index, courant + 1) }));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const props = { suivi: etat, noter: noter(etape.id), envoyer };
  const premierCoup = bureau.etapes.filter((e) => {
    const x = suivi.etapes[e.id];
    return x?.reussi && !x.aide && x.essais === 0;
  }).length;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 sm:pt-10" data-bureau={bureau.code}>
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-xs uppercase tracking-annonce text-slate-400">
          <Link href="/cours" className="hover:text-slate-300">
            Cours
          </Link>{" "}
          · {bureau.parcours} · Palier {bureau.palier}
        </p>
        <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-xs font-semibold text-slate-300">{bureau.entreprise}</span>
        <span className="ml-auto text-sm tabular-nums text-slate-400">{fini ? "Travail rendu" : `Étape ${courant + 1} sur ${n}`}</span>
      </div>
      <h1 className="mb-2 text-3xl font-bold text-slate-50">{bureau.titre}</h1>
      {lu && <Calculatrice />}
      {!lu ? null : fini ? (
        <section className="grid max-w-2xl gap-4" data-travail-rendu="">
          <h2 ref={titre} tabIndex={-1} className="text-2xl font-semibold text-slate-50 outline-none">
            Travail rendu
          </h2>
          <p className="text-base">
            {premierCoup} étape{premierCoup > 1 ? "s" : ""} réussie{premierCoup > 1 ? "s" : ""} du premier coup sur {n}.
          </p>
          <Explication textes={suivi.etapes[bureau.etapes[n - 1]!.id]?.explication} />
          <p className="flex flex-wrap gap-3">
            {bureau.chapitres.map((c) => (
              <Link key={c.code} href={`/cours/${c.code}`} className={bouton({ variante: "secondaire", taille: "m" })}>
                Revoir le chapitre
              </Link>
            ))}
            <button type="button" className={bouton({ variante: "lien", taille: "m" })} onClick={() => changer(() => NEUF)}>
              Recommencer le bureau
            </button>
          </p>
        </section>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
          <section className="grid min-w-0 gap-5" key={etape.id}>
            {courant === 0 && <Paragraphes textes={bureau.accueil} />}
            <h2 ref={titre} tabIndex={-1} className="text-2xl font-semibold text-slate-50 outline-none">
              {etape.titre}
            </h2>
            <p className="max-w-2xl text-base leading-relaxed">{etape.consigne}</p>
            {etape.type === "classement" && <EtapeDeClassement {...props} etape={etape} pile={bureau.pile} />}
            {etape.type === "etat" && <EtapeDEtat {...props} etape={etape} />}
            {etape.type === "journal" && <EtapeDuJournal {...props} etape={etape} />}
            {etape.type === "reponse" && <EtapeDeReponse {...props} etape={etape} />}
            <Alerte texte={panne} />
            {etat.reussi && (
              <div>
                <button type="button" className={bouton({ taille: "l" })} onClick={suite}>
                  {courant === n - 1 ? "Rendre le travail" : "Étape suivante"}
                </button>
              </div>
            )}
          </section>
          <LaPile pile={bureau.pile} ouvertes={etape.pieces} />
        </div>
      )}
    </div>
  );
}
