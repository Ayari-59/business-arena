"use client";

import { bouton } from "@/components/bouton";
import { useEffect, useRef, useState } from "react";
import {
  retakeSituationAction,
  submitSituationAction,
  unlockHintAction,
  type PedagogyState,
} from "@/app/arena/[gameId]/actions";
import { GuardError, useGuardedAction } from "@/components/guarded-action";
import {
  CONSIGNE_DIAGNOSTIC_OUVERT,
  CONSIGNE_MODELE_OUVERT,
  estRendue,
  manques,
  messageIncomplet,
} from "@/config/situation-rendu";
import { estUneReponse } from "@/pedagogy/reponse-ouverte";
import type { SituationView } from "@/services/pedagogy.service";
import type { SituationCategory } from "@/config/scenarios/situation-kit";
import { PREFIXE_QUESTION_LEVIER } from "@/config/analyse-par-niveau";
import { Tiroir } from "@/components/tiroir";
import { useParcours } from "@/components/parcours-mobile";
import { vibrer, VIBRATION_DE_REUSSITE } from "@/lib/glisser";

const CATEGORY_LABELS: Record<SituationCategory, string> = {
  prise_de_poste: "Prise de poste",
  contexte_marche: "Contexte de marché",
  decision_strategique: "Décision stratégique",
  alerte_comptable: "Alerte comptable",
  alerte_operationnelle: "Alerte opérationnelle",
  tresorerie_dormante: "Trésorerie dormante",
  reussite: "Ce qui a marché",
};

const initial: PedagogyState = { error: null };

/**
 * L'enseignant peut ne garder que la question du modèle : annoncer alors des
 * « connaissances » serait faux. Le titre suit ce qui est réellement posé.
 */
function quizHeading(questions: { id: string }[]): string {
  const sansLevier = questions.filter((q) => !q.id.startsWith(PREFIXE_QUESTION_LEVIER));
  const onlyModel = sansLevier.every((q) => q.id === "model_choice");
  const avecLevier = sansLevier.length < questions.length;
  if (!onlyModel) return "Connaissances et modèle d'analyse";
  // Niveaux 1-2 : le modèle ET le sens de la décision (« augmenter ou diminuer ? »).
  return avecLevier ? "Modèle d'analyse et sens de la décision" : "Modèle d'analyse";
}

function ErrorBox({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p
      role="alert"
      aria-live="assertive"
      className="rounded-lg encadre-perte px-3 py-2 text-xs text-red-300"
    >
      {error}
    </p>
  );
}

/** Clé du brouillon dans le navigateur : survit à un rechargement, pas au rendu. */
function cleBrouillon(instanceId: string): string {
  return `ba:situation:${instanceId}`;
}

interface BrouillonLocal {
  options: string[];
  freeText: string;
  reponses: Record<string, string>;
  /** Questions ouvertes : ce qu'on a déjà écrit, question par question. */
  textes: Record<string, string>;
}

/**
 * Une situation active : diagnostic + modèle d'analyse rendus d'un seul
 * geste, indices à la demande. Le brouillon vit dans l'état du composant
 * (React le rétablit après la remise à zéro du formulaire) et, en plus, dans
 * le stockage local du navigateur pour survivre à un rechargement.
 */
export function SituationCard({
  gameId,
  situation,
  dansTiroir = false,
}: {
  gameId: string;
  situation: SituationView;
  /** Posée dans un tiroir de l'accordéon d'analyse (téléphone) : le tiroir porte déjà le titre et le cadre. */
  dansTiroir?: boolean;
}) {
  const hint = useGuardedAction(
    unlockHintAction.bind(null, gameId, situation.instanceId),
    initial,
    {
      label: "indice",
    },
  );
  const rendu = useGuardedAction(
    submitSituationAction.bind(null, gameId, situation.instanceId),
    initial,
    { label: "rendu de situation" },
  );
  const {
    state: hintState,
    formAction: hintAction,
    pending: hintPending,
  } = hint;
  const {
    state: renduState,
    formAction: renduAction,
    pending: renduPending,
  } = rendu;

  const diagnosisDone = situation.diagnosis !== null;
  const quizDone = situation.quizAnswers !== null;
  const rendue = estRendue(situation);
  // Questions encore à répondre : toutes, sauf si le modèle a déjà été validé
  // (rendu en deux temps d'une version antérieure) — on ne le redemande pas.
  const questionsARendre = quizDone ? [] : situation.quizQuestions;

  const [options, setOptions] = useState<string[]>(
    situation.diagnosis?.selected ?? [],
  );
  const [freeText, setFreeText] = useState(situation.diagnosis?.freeText ?? "");
  const [reponses, setReponses] = useState<Record<string, string>>(
    situation.quizAnswers ?? {},
  );
  // QUESTIONS OUVERTES : l'enseignant a choisi que l'élève écrive au lieu de cocher.
  const ouvert = situation.answerFormat === "open";
  const [textes, setTextes] = useState<Record<string, string>>(situation.quizTexts ?? {});

  useEffect(() => {
    if (rendue) return;
    try {
      const brut = window.localStorage.getItem(
        cleBrouillon(situation.instanceId),
      );
      if (!brut) return;
      const b = JSON.parse(brut) as Partial<BrouillonLocal>;
      if (!diagnosisDone && Array.isArray(b.options))
        setOptions(b.options.map(String));
      if (!diagnosisDone && typeof b.freeText === "string")
        setFreeText(b.freeText);
      if (!quizDone && b.reponses && typeof b.reponses === "object")
        setReponses(b.reponses);
      if (!quizDone && b.textes && typeof b.textes === "object") setTextes(b.textes);
    } catch {
      // stockage indisponible : le brouillon reste en mémoire
    }
  }, [situation.instanceId, rendue, diagnosisDone, quizDone]);

  useEffect(() => {
    if (rendue) return;
    try {
      const b: BrouillonLocal = { options, freeText, reponses, textes };
      window.localStorage.setItem(
        cleBrouillon(situation.instanceId),
        JSON.stringify(b),
      );
    } catch {
      // idem
    }
  }, [situation.instanceId, rendue, options, freeText, reponses, textes]);

  // En questions ouvertes, « répondu » veut dire « a écrit une vraie phrase » : le serveur dit
  // la même chose (voir `resolveOpenAnswers`), pour que le bouton grisé et le refus concordent.
  const manquants = ouvert
    ? manques({
        options: estUneReponse(freeText) ? ["texte"] : [],
        questions: questionsARendre.map((q) => q.id),
        reponses: Object.fromEntries(
          questionsARendre.map((q) => [q.id, estUneReponse(textes[q.id] ?? "") ? "texte" : ""]),
        ),
      })
    : manques({
        options,
        questions: questionsARendre.map((q) => q.id),
        reponses,
      });
  const complet = manquants.length === 0;

  const basculerOption = (id: string, coche: boolean) =>
    setOptions((prec) =>
      coche ? [...new Set([...prec, id])] : prec.filter((o) => o !== id),
    );

  const indices = (
    <section className="rounded-lg bg-slate-950 p-3 sm:p-5">
      <h4 className="text-sm font-semibold text-slate-100">
        Besoin d&apos;aide ? Indices progressifs
      </h4>
      {situation.unlockedHints.length > 0 ? (
        <ol className="mt-2 space-y-1.5">
          {situation.unlockedHints.map((h) => (
            <li
              key={h.level}
              className="rounded-lg border border-white/5 bg-slate-900 px-3 py-2 text-sm text-slate-300"
            >
              <span className="mr-2 text-xs font-semibold text-slate-200">
                Indice {h.level}
              </span>
              {h.text}
            </li>
          ))}
        </ol>
      ) : null}
      {situation.nextHint ? (
        <form ref={hint.formRef} action={hintAction} className="mt-2">
          <ErrorBox error={hintState.error} />
          <GuardError message={hint.guardError} />
          <button
            type="submit"
            disabled={hintPending}
            className="rounded-lg bouton-filet border border-white/15 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5"
          >
            {hintPending
              ? "Déblocage…"
              : `Débloquer l'indice ${situation.nextHint.level} (−${Math.round(situation.nextHint.costRatio * 100)} % du score de la situation)`}
          </button>
        </form>
      ) : situation.hintLimit ? (
        <p className="mt-2 text-xs text-slate-400">
          {situation.hintLimit}. À vous de trancher avec ce que vous avez.
        </p>
      ) : situation.unlockedHints.length === 5 ? (
        <p className="mt-2 text-xs text-slate-400">
          Tous les indices sont débloqués.
        </p>
      ) : null}
    </section>
  );

  // DANS LE TIROIR, UNE FOIS RENDUE, la situation ne redonne pas son énoncé : on l'a lu, on a
  // répondu. Elle confirme, et dit ce qui vient — le corrigé n'arrive qu'après la simulation.
  if (rendue && dansTiroir) {
    return (
      <article className="encadre-neutre rounded-lg p-4">
        <p className="text-base font-semibold text-slate-100">✓ Analyse rendue</p>
        <p className="mt-1 text-sm text-slate-300">
          Votre correction vous attend au débriefing, une fois le tour simulé.
        </p>
      </article>
    );
  }

  return (
    // LOT 6A : la situation du tour est un DOCUMENT de lecture — une feuille
    // blanche (`papier`) posée sur le bureau marine du cockpit, en-tête et
    // ombre compris, et non une tuile d'ardoise.
    <article className={dansTiroir ? "" : "papier rounded-xl p-4 sm:p-6"}>
      <header className="mb-3">
        <div className="flex items-center gap-2">
          <p className="surtitre">
            {CATEGORY_LABELS[situation.category]}
          </p>
          {situation.aboveGameLevel ? (
            <span
              className="pastille-etat rounded-full px-2 py-0.5 text-xs font-semibold text-slate-200"
              title="Cette situation mobilise des notions au-dessus du niveau choisi pour la partie."
            >
              Au-dessus du niveau
            </span>
          ) : null}
        </div>
        {dansTiroir ? null : (
          <h3 className="mt-1 text-lg font-semibold text-slate-100">
            {situation.title}
          </h3>
        )}
        <p className="mt-2 text-sm leading-relaxed text-slate-300">
          {situation.narrative}
        </p>
        <p className="mt-2 text-sm font-semibold text-slate-100">
          {situation.problem}
        </p>
      </header>

      {situation.triggerFacts && situation.triggerFacts.length > 0 ? (
        <div className="mb-4">
          {/*
          Ouvert d'office quand la situation a été DÉTECTÉE : les chiffres
          sont la raison même de la carte — la demande qui s'adressait à
          l'équipe et celle qui est repartie. Repliés, l'élève lisait « une
          part importante de la demande » sans jamais voir combien.
        */}
          <Tiroir
            titre="Pourquoi cette situation ?"
            // LOT 6D : les faits qui ont déclenché la situation font partie du
            // document. Un tiroir de cockpit encastré dans la feuille posait un
            // gris d'encre sur un aplat marine (1,7 pour 1 mesuré) : c'est une
            // section creusée de la feuille, comme le diagnostic.
            surface="papier"
            quoi={`${situation.triggerFacts.length} fait${situation.triggerFacts.length > 1 ? "s" : ""}`}
            ouvert={situation.origin === "detected"}
          >
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              {situation.triggerFacts.map((fact, i) => (
                <div
                  key={i}
                  className="col-span-2 flex items-baseline justify-between gap-3"
                >
                  <dt className="text-xs text-slate-400">{fact.label}</dt>
                  <dd
                    className={`text-sm font-medium ${
                      fact.direction === "positive"
                        ? "text-emerald-400"
                        : fact.direction === "negative"
                          ? "text-red-400"
                          : "text-slate-300"
                    }`}
                  >
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>
          </Tiroir>
        </div>
      ) : null}

      {/* Pas d'étiquette de statut ici : le bouton de rendu grisé (et son
          infobulle) disent déjà ce qui manque, et une fois l'analyse rendue le
          fil d'étapes passe aux décisions — inutile d'afficher « rendue ». */}
      <div className="space-y-4">
        {rendue ? (
          <section className="rounded-lg bg-slate-950 p-3 sm:p-5">
            <p className="text-sm text-emerald-300">
              ✓ Analyse rendue — correction au débriefing.
            </p>
          </section>
        ) : (
          <form ref={rendu.formRef} action={renduAction} className="space-y-4">
            <input
              type="hidden"
              name="questions"
              value={questionsARendre.map((q) => q.id).join(",")}
            />

            {/* 1. Diagnostic */}
            <section className="rounded-lg bg-slate-950 p-3 sm:p-5">
              <h4 className="text-sm font-semibold text-slate-100">
                Votre diagnostic
              </h4>
              {/* Les cases forment un groupe : fieldset + legend le disent au
                  lecteur d'écran, qui annonce alors « Quel est le problème
                  principal ? » avant d'égrener les options. */}
              {ouvert ? (
                // QUESTION OUVERTE : un texte, à la place des cases. Le serveur le ramène aux
                // options de la situation par ses mots ; l'enseignant le relit tel quel.
                <label className="mt-1 block">
                  <span className="block text-xs text-slate-400">
                    Quel est le problème principal ? Écrivez-le avec vos mots.
                  </span>
                  <textarea
                    name="freeText"
                    rows={4}
                    value={freeText}
                    onChange={(e) => setFreeText(e.target.value)}
                    placeholder={CONSIGNE_DIAGNOSTIC_OUVERT}
                    className="mt-2 w-full champ px-3 py-2 text-sm text-slate-100 outline-none"
                  />
                </label>
              ) : (
                <>
              <fieldset className="mt-1 min-w-0 border-0 p-0">
                <legend className="text-xs text-slate-400">
                  Quel est le problème principal ?
                  {situation.diagnosticUnique ? " Choisissez-en un." : ""}
                </legend>
                <div className="mt-2 space-y-2">
                  {situation.diagnosticOptions.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-start gap-3 py-1.5 text-sm text-slate-200 pointer-coarse:min-h-11"
                    >
                      {/* Niveaux 1-2 : un choix entre deux, une seule réponse (bouton radio). */}
                      <input
                        type={situation.diagnosticUnique ? "radio" : "checkbox"}
                        name="options"
                        value={option.id}
                        checked={options.includes(option.id)}
                        onChange={(e) =>
                          situation.diagnosticUnique
                            ? setOptions([option.id])
                            : basculerOption(option.id, e.target.checked)
                        }
                        className="mt-0.5 h-5 w-5 shrink-0 accent-amber-400"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <textarea
                name="freeText"
                rows={2}
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                aria-label="Votre analyse écrite du problème"
                placeholder="Votre analyse du problème en quelques mots…"
                className="mt-2 w-full champ px-3 py-2 text-sm text-slate-100 outline-none"
              />
                </>
              )}
            </section>

            {/* 2. Questions : connaissances et/ou modèle d'analyse */}
            {situation.quizQuestions.length > 0 ? (
              <section className="rounded-lg bg-slate-950 p-3 sm:p-5">
                <h4 className="text-sm font-semibold text-slate-100">
                  {quizHeading(situation.quizQuestions)}
                </h4>
                <p className="mt-1 text-xs text-slate-400">
                  Comment analyser ce problème ?
                </p>
                {quizDone ? (
                  <p className="mt-2 text-sm text-emerald-300">
                    ✓ Réponse validée — correction au débriefing.
                  </p>
                ) : (
                  <div className="mt-2 space-y-4">
                    {situation.quizQuestions.map((question) =>
                      ouvert ? (
                        // QUESTION OUVERTE : la même question, sans les propositions. Les
                        // options servent au serveur à reconnaître ce qui est écrit, pas à
                        // être montrées.
                        <label key={question.id} className="block">
                          <span className="text-sm font-medium text-slate-200">
                            {question.prompt}
                          </span>
                          <textarea
                            name={`open_${question.id}`}
                            rows={3}
                            value={textes[question.id] ?? ""}
                            onChange={(e) =>
                              setTextes((prec) => ({ ...prec, [question.id]: e.target.value }))
                            }
                            placeholder={CONSIGNE_MODELE_OUVERT}
                            className="mt-1.5 w-full champ px-3 py-2 text-sm text-slate-100 outline-none"
                          />
                        </label>
                      ) : (
                        <fieldset key={question.id}>
                          <legend className="text-sm font-medium text-slate-200">
                            {question.prompt}
                          </legend>
                          <div className="mt-1.5 space-y-1.5">
                            {question.options.map((option) => (
                              <label
                                key={option.id}
                                className="flex items-start gap-3 py-1.5 text-sm text-slate-300 pointer-coarse:min-h-11"
                              >
                                <input
                                  type="radio"
                                  name={`quiz_${question.id}`}
                                  value={option.id}
                                  checked={reponses[question.id] === option.id}
                                  onChange={() =>
                                    setReponses((prec) => ({
                                      ...prec,
                                      [question.id]: option.id,
                                    }))
                                  }
                                  className="mt-0.5 h-5 w-5 shrink-0 accent-amber-400"
                                />
                                <span>
                                  {option.label}
                                  {/* Niveau Découverte : le modèle dit à quoi il sert. */}
                                  {option.aide ? (
                                    <span className="mt-0.5 block text-sm leading-snug text-slate-400">
                                      {option.aide}
                                    </span>
                                  ) : null}
                                </span>
                              </label>
                            ))}
                          </div>
                        </fieldset>
                      ),
                    )}
                  </div>
                )}
              </section>
            ) : null}

            {/* 3. Le rendu, en une fois */}
            <div className="space-y-2">
              <ErrorBox error={renduState.error} />
              <GuardError message={rendu.guardError} />
              <button
                type="submit"
                disabled={!complet || renduPending}
                aria-disabled={!complet || renduPending}
                title={complet ? undefined : messageIncomplet(manquants)}
                // L'action de l'étape : le bouton « suivant » de l'arène passe en
                // filet tant qu'elle est là (un seul aplat orange par écran).
                data-action-de-l-etape=""
                className={`${bouton()} pointer-coarse:min-h-11`}
              >
                {renduPending ? "Envoi…" : "Valider mon analyse"}
              </button>
            </div>
          </form>
        )}

        {indices}
      </div>
    </article>
  );
}

/**
 * LES ANALYSES DU TOUR, EN ACCORDÉON (téléphone).
 *
 * Quand un tour pose deux ou trois situations, une file d'écrans par situation
 * faisait une succession interminable de QCM. Elles tiennent ensemble sur UN écran :
 * chacune est un tiroir dont le résumé dit son titre et où elle en est (« à analyser »,
 * « rendue »), une seule est ouverte à la fois, et rendre l'une referme sur la suivante
 * restée à faire. Toutes restent dans la page : un tiroir fermé est masqué, pas retiré.
 */
export function AnalyseDuTour({
  gameId,
  situations,
}: {
  gameId: string;
  situations: SituationView[];
}) {
  const premiereARendre = situations.find((x) => !estRendue(x));
  const [ouverte, setOuverte] = useState<string | null>(
    (premiereARendre ?? situations[0])?.instanceId ?? null,
  );
  const rendues = situations.filter((x) => estRendue(x)).length;
  // Une analyse qui vient d'être rendue ouvre la suivante à faire ; la dernière reste ouverte, sur sa confirmation.
  const dejaRendues = useRef(new Set(situations.filter((x) => estRendue(x)).map((x) => x.instanceId)));
  useEffect(() => {
    const nouvelle = situations.find((x) => estRendue(x) && !dejaRendues.current.has(x.instanceId));
    if (!nouvelle) return;
    dejaRendues.current.add(nouvelle.instanceId);
    const suivante = situations.find((x) => !estRendue(x));
    // Ouvrir la suivante est une réaction à l'arrivée du rendu côté serveur. Sans suivante,
    // la situation rendue reste ouverte : c'est sa confirmation qu'on vient chercher.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOuverte(suivante ? suivante.instanceId : nouvelle.instanceId);
    // Une analyse rendue se sent dans la main : c'est le geste du jeu qui compte.
    vibrer(VIBRATION_DE_REUSSITE);
  }, [situations]);

  // L'en-tête de l'écran est celui de la barre du haut : on lui dit où en sont les analyses.
  const parcours = useParcours();
  const definirEntete = parcours?.definirEntete;
  const titreDeLEcran = situations.length > 1 ? "Vos situations à analyser" : "Votre situation à analyser";
  const amorce = `Analyse · ${rendues}/${situations.length} rendue${situations.length > 1 ? "s" : ""}`;
  useEffect(() => {
    definirEntete?.({ titre: titreDeLEcran, amorce });
    return () => definirEntete?.(null);
  }, [definirEntete, titreDeLEcran, amorce]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {situations.map((x) => {
          const faite = estRendue(x);
          const estOuverte = ouverte === x.instanceId;
          return (
            <Tiroir
              key={x.instanceId}
              titre={x.title}
              phrase
              // LOT 6D : sur téléphone, la situation à analyser est le même
              // DOCUMENT que sur grand écran : sa feuille vient du tiroir.
              surface="papier"
              groupe={`analyses-${gameId}`}
              ouvert={estOuverte}
              ferme={!estOuverte}
              // Ouvrir l'un referme l'autre (même `groupe`) : les deux évènements arrivent dans
              // un ordre quelconque, d'où la forme fonctionnelle — « fermé » ne retire que
              // ce qui est encore ouvert, jamais l'ouverture qui vient d'arriver.
              onBasculer={(ouvert) =>
                setOuverte((courante) =>
                  ouvert ? x.instanceId : courante === x.instanceId ? null : courante,
                )
              }
              valeur={
                <span
                  className={`block text-sm font-normal ${faite ? "text-emerald-300" : "text-slate-400"}`}
                >
                  {faite ? "✓ rendue" : "à analyser"}
                </span>
              }
            >
              <SituationCard gameId={gameId} situation={x} dansTiroir />
            </Tiroir>
          );
        })}
      </div>
    </div>
  );
}

/** Débriefing d'une situation résolue : correction du diagnostic et du QCM + notions. */
export function SituationDebrief({
  situation,
  gameId,
  retakeable = false,
}: {
  situation: SituationView;
  /** Requis pour proposer un rattrapage (V1-6). */
  gameId?: string;
  /** La situation manquée est encore rattrapable (politique retake50, dernier tour clos). */
  retakeable?: boolean;
}) {
  const debrief = situation.debrief;
  if (!debrief) return null;
  const selected = new Set(situation.diagnosis?.selected ?? []);
  const answers = situation.quizAnswers ?? {};
  const scoreSur100 = Math.round(debrief.finalScore * 100);
  return (
    // LOT 6A : le débrief est un texte d'enseignement — un document papier.
    <article className="papier rounded-xl p-4 sm:p-6">
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="surtitre">
            Débriefing
          </p>
          <h3 className="mt-1 text-base font-semibold text-slate-100">
            {situation.title}
          </h3>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs ${
            situation.missed
              ? "pastille-perte text-slate-200"
              : situation.retaken
                ? "border-white/10 text-sky-300"
                : "border-white/10 text-slate-300"
          }`}
        >
          {situation.missed
            ? "Non rendue · 0 / 100"
            : situation.retaken
              ? `Rattrapée · ${scoreSur100} / 100`
              : `Score : ${scoreSur100} / 100`}
        </span>
      </header>
      {situation.missed ? (
        <p className="encadre-perte mb-3 rounded-lg px-3 py-2 text-sm text-slate-300">
          <span className="font-medium text-slate-100">
            Situation non rendue.
          </span>{" "}
          {situation.narrative} {situation.problem} Modèle et correction
          ci-dessous.
        </p>
      ) : null}
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-sm font-semibold text-slate-100">
            Diagnostic
          </p>
          {/* QUESTIONS OUVERTES : le texte de l'équipe, tel quel, avant la correction. Celle-ci
              le ramène aux propositions par ses mots : approximative, et dite telle. */}
          {situation.answerFormat === "open" && situation.diagnosis?.freeText ? (
            <>
              <p className="mt-1 whitespace-pre-wrap rounded-lg border border-white/5 bg-slate-950 px-3 py-2 text-slate-200">
                {situation.diagnosis.freeText}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                Correction automatique par mots-clés, donc approximative : ce que votre texte a dit
                est marqué ci-dessous. Votre enseignant lit votre texte lui-même.
              </p>
            </>
          ) : null}
          <ul className="mt-1 space-y-1">
            {situation.diagnosticOptions.map((option) => {
              const correct = debrief.correctOptionIds.includes(option.id);
              const chosen = selected.has(option.id);
              return (
                <li
                  key={option.id}
                  className={
                    correct
                      ? "text-emerald-300"
                      : chosen
                        ? "text-red-400"
                        : "text-slate-400"
                  }
                >
                  {correct ? "✓" : chosen ? "✗" : "·"} {option.label}
                  {chosen && !correct ? " (coché à tort)" : ""}
                  {correct && !chosen ? " (manqué)" : ""}
                </li>
              );
            })}
          </ul>
          {/* Aux premiers niveaux, la situation ne propose qu'une partie des bonnes causes :
              le reste se lit ici, pour que la leçon soit entière — sans être comptée « manquée ». */}
          {debrief.autresCauses.length > 0 ? (
            <div className="encadre-neutre mt-2 rounded-lg px-3 py-2">
              <p className="text-sm font-semibold text-slate-100">
                {debrief.autresCauses.length > 1
                  ? "À retenir aussi : d'autres bonnes causes, non proposées à votre niveau"
                  : "À retenir aussi : une autre bonne cause, non proposée à votre niveau"}
              </p>
              <ul className="mt-1 space-y-1 text-slate-200">
                {debrief.autresCauses.map((c) => (
                  <li key={c.id}>✓ {c.label}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
        {situation.quizQuestions.length > 0 ? (
          <div>
            <p className="text-sm font-semibold text-slate-100">
              {quizHeading(situation.quizQuestions)}
              {debrief.quizScore !== null
                ? ` · ${Math.round(debrief.quizScore * 100)} %`
                : " · non traité"}
            </p>
            <ul className="mt-1 space-y-2">
              {situation.quizQuestions.map((question) => {
                const correction = debrief.quizCorrection.find(
                  (c) => c.id === question.id,
                );
                if (!correction) return null;
                const answered = answers[question.id];
                const credit = answered
                  ? (correction.credits[answered] ?? 0)
                  : 0;
                const correctLabel = question.options.find(
                  (o) => o.id === correction.correctOptionId,
                )?.label;
                return (
                  <li
                    key={question.id}
                    className="rounded-lg border border-white/5 bg-slate-950 px-3 py-2"
                  >
                    <p className="text-slate-300">{question.prompt}</p>
                    {situation.answerFormat === "open" && situation.quizTexts?.[question.id] ? (
                      <p className="mt-1 whitespace-pre-wrap text-slate-200">
                        {situation.quizTexts[question.id]}
                      </p>
                    ) : null}
                    <p
                      className={`mt-1 ${
                        credit >= 1
                          ? "text-emerald-300"
                          : credit > 0
                            ? "texte-or"
                            : "text-red-400"
                      }`}
                    >
                      {credit >= 1
                        ? "✓ Bonne réponse"
                        : credit > 0
                          ? `≈ Réponse partielle (${Math.round(credit * 100)} %)`
                          : answered
                            ? "✗ Mauvaise réponse"
                            : "· Sans réponse"}
                      {credit < 1 && correctLabel ? (
                        <span className="text-emerald-300">
                          {" "}
                          · le plus juste : {correctLabel}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-slate-400">
                      {correction.explain}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
        {debrief.modelInsight ? (
          <div>
            <p className="text-sm font-semibold text-slate-100">
              Le bon outil ici
            </p>
            <div className="mt-1 rounded-lg border border-white/5 bg-slate-950 px-3 py-2">
              <p className="text-slate-300">{debrief.modelInsight.prompt}</p>
              <p className="mt-1 text-emerald-300">
                {debrief.modelInsight.answer}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-400">
                {debrief.modelInsight.explain}
              </p>
            </div>
          </div>
        ) : null}
        {debrief.consequenceFacts && debrief.consequenceFacts.length > 0 ? (
          <div>
            <p className="text-sm font-semibold text-slate-100">
              Qu&apos;est-ce qui a évolué ?
            </p>
            <div className="mt-1 space-y-1.5">
              {debrief.consequenceFacts.map((fact, i) => (
                <div
                  key={i}
                  className="flex items-baseline justify-between gap-3 rounded-lg border border-white/5 bg-slate-950 px-3 py-2"
                >
                  <span className="text-xs text-slate-400">{fact.label}</span>
                  <span className="flex items-baseline gap-2 text-sm">
                    <span className="text-slate-400">{fact.before}</span>
                    <span className="text-slate-400">→</span>
                    <span className="text-slate-200">{fact.after}</span>
                    <span
                      className={`text-xs font-medium ${
                        fact.direction === "positive"
                          ? "text-emerald-400"
                          : fact.direction === "negative"
                            ? "text-red-400"
                            : "text-slate-400"
                      }`}
                    >
                      {fact.delta}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {debrief.interpretation ? (
          <div>
            <p className="text-sm font-semibold text-slate-100">
              Comment interpréter cette évolution ?
            </p>
            <div className="mt-1 space-y-2 rounded-lg border border-white/5 bg-slate-950 px-3 py-2">
              <p className="text-sm font-medium text-slate-200">
                {debrief.interpretation.mechanism}
              </p>
              <p className="text-sm text-slate-300">
                {debrief.interpretation.explanation}
              </p>
              <p className="text-sm italic text-slate-200">
                {debrief.interpretation.takeaway}
              </p>
            </div>
          </div>
        ) : null}
        {debrief.concepts.length > 0 ? (
          <div>
            <p className="text-sm font-semibold text-slate-100">
              Notions mobilisées
            </p>
            <p className="mt-1 flex flex-wrap gap-2">
              {debrief.concepts.map((c) => (
                <a
                  key={c.code}
                  href={`/notions#${c.code}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-xs text-slate-100 hover:border-white/40"
                >
                  <span className="libelle text-xs">
                    {c.domain}
                  </span>
                  {c.name}
                </a>
              ))}
            </p>
          </div>
        ) : null}
      </div>
      {situation.missed && !situation.retaken && retakeable && gameId ? (
        <SituationRetake gameId={gameId} situation={situation} />
      ) : null}
    </article>
  );
}

/**
 * Rattrapage d'une situation manquée (V1-6, politique retake50) : un seul rendu,
 * noté à 50 %, avant la clôture suivante. Même forme que le rendu normal.
 */
function SituationRetake({
  gameId,
  situation,
}: {
  gameId: string;
  situation: SituationView;
}) {
  const rendu = useGuardedAction(
    retakeSituationAction.bind(null, gameId, situation.instanceId),
    initial,
    { label: "rattrapage de situation" },
  );
  const { state, formAction, pending } = rendu;
  const questions = situation.quizQuestions;
  const [options, setOptions] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [reponses, setReponses] = useState<Record<string, string>>({});
  const ouvert = situation.answerFormat === "open";
  const [textes, setTextes] = useState<Record<string, string>>({});
  const manquants = ouvert
    ? manques({
        options: estUneReponse(freeText) ? ["texte"] : [],
        questions: questions.map((q) => q.id),
        reponses: Object.fromEntries(
          questions.map((q) => [q.id, estUneReponse(textes[q.id] ?? "") ? "texte" : ""]),
        ),
      })
    : manques({
        options,
        questions: questions.map((q) => q.id),
        reponses,
      });
  const complet = manquants.length === 0;

  return (
    <form
      ref={rendu.formRef}
      action={formAction}
      className="encadre-neutre mt-4 space-y-3 rounded-lg p-3 sm:p-5"
    >
      <p className="text-sm font-semibold text-slate-100">
        Rattrapage · score compté pour moitié
      </p>
      <input
        type="hidden"
        name="questions"
        value={questions.map((q) => q.id).join(",")}
      />
      {ouvert ? (
        <label className="block">
          <span className="block text-xs text-slate-400">
            Votre diagnostic : quel est le problème principal ? Écrivez-le avec vos mots.
          </span>
          <textarea
            name="freeText"
            rows={4}
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder={CONSIGNE_DIAGNOSTIC_OUVERT}
            className="mt-1 w-full champ px-3 py-2 text-sm text-slate-100 outline-none [--focus-champ:var(--color-sky-400)]"
          />
        </label>
      ) : (
      <div className="space-y-1.5">
        <fieldset className="min-w-0 space-y-1.5 border-0 p-0">
          <legend className="text-xs text-slate-400">Votre diagnostic</legend>
          {situation.diagnosticOptions.map((option) => (
            <label
              key={option.id}
              className="flex items-start gap-3 py-1.5 text-sm text-slate-200 pointer-coarse:min-h-11"
            >
              <input
                type={situation.diagnosticUnique ? "radio" : "checkbox"}
                name="options"
                value={option.id}
                checked={options.includes(option.id)}
                onChange={(e) =>
                  setOptions((prec) =>
                    situation.diagnosticUnique
                      ? [option.id]
                      : e.target.checked
                        ? [...new Set([...prec, option.id])]
                        : prec.filter((o) => o !== option.id),
                  )
                }
                className="mt-1 accent-sky-400"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </fieldset>
        <textarea
          name="freeText"
          rows={2}
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          aria-label="Votre analyse écrite du problème"
          placeholder="Votre analyse du problème en quelques mots…"
          className="mt-1 w-full champ px-3 py-2 text-sm text-slate-100 outline-none [--focus-champ:var(--color-sky-400)]"
        />
      </div>
      )}
      {questions.map((question) =>
        ouvert ? (
          <label key={question.id} className="block">
            <span className="text-sm font-medium text-slate-200">{question.prompt}</span>
            <textarea
              name={`open_${question.id}`}
              rows={3}
              value={textes[question.id] ?? ""}
              onChange={(e) =>
                setTextes((prec) => ({ ...prec, [question.id]: e.target.value }))
              }
              placeholder={CONSIGNE_MODELE_OUVERT}
              className="mt-1.5 w-full champ px-3 py-2 text-sm text-slate-100 outline-none [--focus-champ:var(--color-sky-400)]"
            />
          </label>
        ) : (
        <fieldset key={question.id}>
          <legend className="text-sm font-medium text-slate-200">
            {question.prompt}
          </legend>
          <div className="mt-1.5 space-y-1.5">
            {question.options.map((option) => (
              <label
                key={option.id}
                className="flex items-start gap-3 py-1.5 text-sm text-slate-300 pointer-coarse:min-h-11"
              >
                <input
                  type="radio"
                  name={`quiz_${question.id}`}
                  value={option.id}
                  checked={reponses[question.id] === option.id}
                  onChange={() =>
                    setReponses((prec) => ({
                      ...prec,
                      [question.id]: option.id,
                    }))
                  }
                  className="mt-1 accent-sky-400"
                />
                <span>
                  {option.label}
                  {option.aide ? (
                    <span className="mt-0.5 block text-sm leading-snug text-slate-400">{option.aide}</span>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
        </fieldset>
      ),
      )}
      <ErrorBox error={state.error} />
      <GuardError message={rendu.guardError} />
      <button
        type="submit"
        disabled={!complet || pending}
        aria-disabled={!complet || pending}
        title={complet ? undefined : messageIncomplet(manquants)}
        className={bouton()}
      >
        {pending ? "Envoi…" : "Rattraper cette situation"}
      </button>
    </form>
  );
}
