"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { getGuestUserId } from "@/lib/guest";
import { refusDuPlafondDInvestissement, roundDecisionsSchema } from "@/services/decision-schema";
import { decisionsSaisies } from "@/config/decisions-saisies";
import { estimationAConserver, estimerLeTour } from "@/engine/estimation";
import type { RoundDecisions } from "@/engine/types";
import { ventesEstimeesSaisies } from "@/config/ventes-estimees";
import { formatEuro } from "@/lib/format";
import {
  bloqueLaValidation,
  messageSauvetage,
  resteApresLeviers,
  verdictAuMaximum,
  verdictSauvetage,
} from "@/services/sauvetage";
import { choisirSonEquipe } from "@/services/affectation.service";
import { deposerDemande } from "@/services/subvention.service";
import { getGameView } from "@/services/game-view.service";
import { meriteDeLaPartie } from "@/services/merite.service";
import { apresLeTour, noterLaCopieDeLaPartie } from "@/services/examen.service";
import {
  getGameKind,
  getGameVocabulary,
  nommerEquipe,
  resolveCurrentRound,
  submitTeamDecisions,
} from "@/services/game.service";
import { submitDiagnosis, submitQuiz, unlockHint } from "@/services/pedagogy.service";
import {
  answerFormatOfInstance,
  resolveOpenAnswers,
  retakeSituation,
} from "@/services/debrief.service";
import { manques, messageIncomplet } from "@/config/situation-rendu";
import {
  erreursDuSchema,
  messageDuRefusServeur,
  refusDuVolume,
  resumeDesRefus,
  type ContexteDesLibelles,
  type ErreurDeChamp,
} from "@/config/refus-de-decision";
import { productFieldName } from "@/config/decision-source";

export interface PlayRoundState {
  /** Le refus en une phrase (ou `null`). */
  error: string | null;
  /**
   * LES REFUS, CHAMP PAR CHAMP : le nom du champ du formulaire visé (ou `null`
   * quand la règle n'en vise aucun), et le message dans la langue du joueur.
   * L'écran marque le champ, l'ouvre et y pose le focus
   * (`config/refus-de-decision.ts`).
   */
  erreurs?: ErreurDeChamp[];
}

/** Un refus d'une phrase, sans champ : la session, le tour, la partie. */
function refusSansChamp(message: string): PlayRoundState {
  return { error: message, erreurs: [{ champ: null, message }] };
}

/** Un ou plusieurs refus rattachés à leurs champs. */
function refusDesChamps(erreurs: ErreurDeChamp[]): PlayRoundState {
  return { error: resumeDesRefus(erreurs), erreurs };
}

/** Valide les décisions du joueur et résout le tour courant (mode solo, ADR-04). */
export async function playRoundAction(
  gameId: string,
  _previous: PlayRoundState,
  formData: FormData,
): Promise<PlayRoundState> {
  const userId = await getGuestUserId();
  if (!userId) return refusSansChamp("Session expirée : relancez une partie depuis l'accueil.");

  // LE FORMULAIRE EST LU UNE SEULE FOIS, PAR LA MÊME FONCTION QUE LE
  // NAVIGATEUR (`config/decisions-saisies`). L'encart « Résultat estimé »
  // estime à la frappe avec cette lecture ; l'action résout le tour avec
  // elle. Deux lectures écrites séparément auraient fini par diverger, et
  // l'élève aurait vu annoncer autre chose que ce que le moteur applique.
  const saisie = decisionsSaisies(formData);

  // Le volume est un pivot : vide ou nul, ce n'est pas une décision, c'est une
  // absence. Le schéma acceptait 0 sans un mot ; on le refuse ici, dans la
  // langue du secteur.
  //
  // Le refus vise le champ du volume : en gamme, le plan de la première
  // référence (le volume est leur somme).
  if (!Number.isFinite(saisie.volume) || saisie.volume < 1) {
    const v = await getGameVocabulary(gameId);
    const premiere = saisie.products ? Object.keys(saisie.products)[0] : undefined;
    const champ = premiere ? productFieldName(premiere, "productionPlan") : "productionPlan";
    return refusDesChamps([refusDuVolume(champ, { vocabulaire: v })]);
  }

  // LES VENTES ESTIMÉES PAR L'ÉQUIPE, et le résultat estimé qu'elles donnaient.
  // Le moteur ne les lit pas ; la fin de tour les confronte au réel.
  const estimation = ventesEstimeesSaisies(formData);

  const entree = {
    ...saisie.decisions,
    ...(estimation ? { salesEstimate: estimation } : {}),
    // LE PLAN DE TRÉSORERIE N'EST PLUS DEMANDÉ DEUX FOIS. L'arène ne le
    // réclame plus (voir `tests/architecture/forecast-field.test.ts`) ; si un
    // écran le rouvre un jour, c'est l'ESTIMATION qui donne les ventes
    // annoncées — jamais une seconde saisie de la même chose.
    ...(estimation && saisie.decisions.forecast?.expectedCash !== undefined
      ? {
          forecast: { ...saisie.decisions.forecast, expectedUnits: estimation.units },
        }
      : {}),
  };
  const parsed = roundDecisionsSchema.safeParse(entree);
  if (!parsed.success) {
    // CHAQUE REFUS DU SCHÉMA NOMME SON CHAMP, dans la langue du secteur (le
    // vocabulaire, et le nom des références d'une gamme). « Décisions
    // invalides : vérifiez les montants saisis » ne disait pas lequel.
    const ctx: ContexteDesLibelles = {
      vocabulaire: await getGameVocabulary(gameId),
      references: await (async () => {
        if (!saisie.products) return null;
        const vue = await getGameView(gameId, userId).catch(() => null);
        return vue?.gamme?.map((p) => ({ code: p.code, name: p.name })) ?? null;
      })(),
    };
    return refusDesChamps(erreursDuSchema(parsed.error.issues, entree, ctx));
  }

  // LE FINANCEMENT DE SAUVETAGE, VÉRIFIÉ CÔTÉ SERVEUR. L'écran grise déjà le
  // bouton, mais un formulaire périmé — l'élève avait la page ouverte avant la
  // clôture qui l'a mis en crise — ou forgé passerait outre. La règle est la
  // même des deux côtés (`verdictSauvetage`), pour que l'écran n'autorise
  // jamais ce que le serveur refuse.
  const vue = await getGameView(gameId, userId);
  if (vue?.exigenceSauvetage) {
    const verdict = verdictSauvetage(vue.exigenceSauvetage, {
      emprunt: parsed.data.finance?.newLoan ?? 0,
      apport: parsed.data.finance?.capitalIncrease ?? 0,
    });
    if (bloqueLaValidation(verdict)) {
      // Le refus vise le nouvel emprunt : c'est le premier des deux leviers
      // (l'apport des associés est juste à côté, dans la même famille).
      return refusDesChamps([
        {
          champ: "newLoan",
          message: `Financement de sauvetage exigé : ${
            messageSauvetage(verdict, formatEuro) ?? "empruntez ou faites appel aux associés avant de valider."
          }`,
        },
      ]);
    }
  }

  // LE PLAFOND D'INVESTISSEMENT, VÉRIFIÉ CÔTÉ SERVEUR. Aux niveaux sans
  // embauches, on n'achète pas plus de capacité que l'équipe ne fait tourner
  // (`engine/investment/plafond`). La feuille le dit avant l'envoi ; un
  // formulaire périmé ou forgé est refusé ici, avec le même message, sur la
  // case de la machine achetée.
  if (vue) {
    const refusDuPlafond = refusDuPlafondDInvestissement(parsed.data, vue.plafondInvestissement, vue.vocabulary);
    if (refusDuPlafond) return refusDesChamps([refusDuPlafond]);
  }

  // LE RÉSULTAT ESTIMÉ, CALCULÉ PAR LE SERVEUR. L'encart l'a déjà affiché dans
  // le navigateur, mais ce qui est CONSERVÉ avec les décisions est recalculé
  // ici, du même moteur, sur l'état d'ouverture : un chiffre venu de la page
  // serait un chiffre qu'on n'a pas vérifié. Si le calcul échoue, l'estimation
  // de ventes reste déposée sans son compte : jamais un tour perdu pour ça.
  const payload: RoundDecisions = (() => {
    const ventes = parsed.data.salesEstimate?.byProduct;
    if (!ventes || !vue?.estimation) return parsed.data;
    try {
      const estime = estimerLeTour(vue.estimation, parsed.data, ventes);
      return { ...parsed.data, salesEstimate: estimationAConserver(ventes, estime) };
    } catch {
      return parsed.data;
    }
  })();

  // LA NOTE D'AVANT EST FACULTATIVE : enregistrée quand elle est écrite, jamais exigée.
  const note = String(formData.get("justification") ?? "").trim();

  let kind: Awaited<ReturnType<typeof getGameKind>>;
  try {
    const justification = note || undefined;
    kind = await getGameKind(gameId);
    if (kind === "solo") {
      const { finished } = await resolveCurrentRound({
        gameId,
        userId,
        playerDecisions: payload,
        justification,
      });
      // L'EXAMEN INDIVIDUEL : le tour suivant reçoit son échéance, ou la copie
      // est remise (services/examen.service.ts). Rien pour une partie solo ordinaire.
      const remise = await apresLeTour(gameId).catch(() => false);
      // MÉRITE OU CHANCE : la partie est finie, son verdict se calcule tout de
      // suite, après la réponse (le joueur ne l'attend pas), pour être prêt
      // quand il lit son bilan. Une panne ici ne touche pas la partie.
      if (finished) after(() => meriteDeLaPartie(gameId).catch(() => undefined));
      // Une copie d'examen remise est notée dans la foulée, par ce même verdict
      // (mémoïsé : il ne se calcule qu'une fois).
      if (remise) {
        after(async () => {
          await noterLaCopieDeLaPartie(gameId).catch(() => undefined);
        });
      }
    } else {
      await submitTeamDecisions({ gameId, userId, payload, justification });
    }
  } catch (error) {
    // Le refus d'un service (tour clos, partie terminée, verrou de planning…)
    // dans la langue du joueur ; une panne du moteur ne montre pas son intérieur.
    return refusSansChamp(messageDuRefusServeur(error));
  }
  revalidatePath(`/arena/${gameId}`);
  // En solo, valider a résolu le tour tout de suite. Plutôt que de jeter le
  // joueur directement sur les résultats, on l'amène sur un écran intermédiaire
  // « Tour simulé » (paramètre ?simule) qui marque l'étape et propose deux
  // suites explicites : voir les résultats, ou passer au tour suivant — sans
  // enchaîner sur un bouton « simuler » d'allure identique.
  // En classe, on ne redirige pas : les résultats n'arriveront qu'à la clôture
  // par l'enseignant. redirect() est hors du try (il lève NEXT_REDIRECT).
  if (kind === "solo") {
    redirect(`/arena/${gameId}?simule=1`);
  }
  return { error: null };
}

export interface PedagogyState {
  error: string | null;
}

/** Débloque le prochain indice d'une situation (séquentiel, tracé — doc 03 §4). */
export async function unlockHintAction(
  gameId: string,
  instanceId: string,
  _prev: PedagogyState,
  _formData: FormData,
): Promise<PedagogyState> {
  const userId = await getGuestUserId();
  if (!userId) return { error: "Session expirée." };
  try {
    await unlockHint({ instanceId, userId });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erreur." };
  }
  revalidatePath(`/arena/${gameId}`);
  return { error: null };
}

/** Les réponses écrites d'un formulaire en questions ouvertes : `open_<question>` → texte. */
function textesOuverts(formData: FormData): Record<string, string> {
  const textes: Record<string, string> = {};
  for (const [cle, valeur] of formData.entries()) {
    if (cle.startsWith("open_") && typeof valeur === "string") {
      textes[cle.slice("open_".length)] = valeur;
    }
  }
  return textes;
}

/**
 * Rend la situation d'un coup : diagnostic ET modèle, ou rien (vague 1, P6).
 * Le formulaire grise son bouton tant qu'une moitié manque ; ici on refuse
 * une soumission incomplète avec le même message, pour qu'un formulaire
 * forgé ou une page périmée ne rende pas une demi-copie.
 *
 * `questions` (champ caché) liste les questions encore à répondre : vide
 * quand le modèle n'est pas demandé, ou déjà validé avant cette version.
 */
export async function submitSituationAction(
  gameId: string,
  instanceId: string,
  _prev: PedagogyState,
  formData: FormData,
): Promise<PedagogyState> {
  const userId = await getGuestUserId();
  if (!userId) return { error: "Session expirée." };
  const options = formData.getAll("options").map(String).filter(Boolean);
  const freeText = String(formData.get("freeText") ?? "");
  const questions = String(formData.get("questions") ?? "")
    .split(",")
    .map((q) => q.trim())
    .filter(Boolean);
  const reponses: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("quiz_") && typeof value === "string" && value) {
      reponses[key.slice("quiz_".length)] = value;
    }
  }
  try {
    // QUESTIONS OUVERTES : le format se lit sur la partie, pas sur le formulaire. Les textes
    // sont ramenés aux options de la situation, puis tout suit le chemin du QCM.
    if ((await answerFormatOfInstance(instanceId, userId)) === "open") {
      const ouvert = await resolveOpenAnswers({
        instanceId,
        userId,
        freeText,
        texts: textesOuverts(formData),
      });
      if (ouvert.manques.length > 0) return { error: messageIncomplet(ouvert.manques) };
      await submitDiagnosis({ instanceId, userId, selectedOptionIds: ouvert.options, freeText });
      if (ouvert.questions.length > 0)
        await submitQuiz({
          instanceId,
          userId,
          answers: ouvert.answers,
          texts: ouvert.texts,
        });
      revalidatePath(`/arena/${gameId}`);
      return { error: null };
    }
    const m = manques({ options, questions, reponses });
    if (m.length > 0) return { error: messageIncomplet(m) };
    await submitDiagnosis({ instanceId, userId, selectedOptionIds: options, freeText });
    if (questions.length > 0) await submitQuiz({ instanceId, userId, answers: reponses });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erreur." };
  }
  revalidatePath(`/arena/${gameId}`);
  return { error: null };
}

/**
 * Rattrapage d'une situation manquée (V1-6, politique retake50). Même forme que
 * le rendu unique ; le service note à 50 % et refuse hors de la fenêtre.
 */
export async function retakeSituationAction(
  gameId: string,
  instanceId: string,
  _prev: PedagogyState,
  formData: FormData,
): Promise<PedagogyState> {
  const userId = await getGuestUserId();
  if (!userId) return { error: "Session expirée." };
  const options = formData.getAll("options").map(String).filter(Boolean);
  const freeText = String(formData.get("freeText") ?? "");
  const questions = String(formData.get("questions") ?? "")
    .split(",")
    .map((q) => q.trim())
    .filter(Boolean);
  const reponses: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("quiz_") && typeof value === "string" && value) {
      reponses[key.slice("quiz_".length)] = value;
    }
  }
  try {
    if ((await answerFormatOfInstance(instanceId, userId)) === "open") {
      const ouvert = await resolveOpenAnswers({
        instanceId,
        userId,
        freeText,
        texts: textesOuverts(formData),
      });
      if (ouvert.manques.length > 0) return { error: messageIncomplet(ouvert.manques) };
      await retakeSituation({
        instanceId,
        userId,
        selectedOptionIds: ouvert.options,
        freeText,
        answers: ouvert.answers,
        texts: ouvert.texts,
      });
      revalidatePath(`/arena/${gameId}`);
      return { error: null };
    }
    const m = manques({ options, questions, reponses });
    if (m.length > 0) return { error: messageIncomplet(m) };
    await retakeSituation({ instanceId, userId, selectedOptionIds: options, freeText, answers: reponses });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erreur." };
  }
  revalidatePath(`/arena/${gameId}`);
  return { error: null };
}

export interface NomEquipeState {
  error: string | null;
}

/** L'équipe se donne un nom, au premier tour et une seule fois. */
export async function nommerEquipeAction(
  gameId: string,
  _previous: NomEquipeState,
  formData: FormData,
): Promise<NomEquipeState> {
  const userId = await getGuestUserId();
  if (!userId) return { error: "Session expirée : rejoignez la partie à nouveau." };
  try {
    // `embleme` absent du formulaire (ancien écran, envoi partiel) : on ne
    // touche pas à celui de l'équipe. Chaîne vide : elle n'en veut aucun.
    const brut = formData.get("embleme");
    await nommerEquipe({
      gameId,
      userId,
      nom: String(formData.get("nom") ?? ""),
      ...(brut === null ? {} : { embleme: String(brut) || null }),
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Le nom n'a pas pu être enregistré." };
  }
  revalidatePath(`/arena/${gameId}`);
  return { error: null };
}

export interface DemandeSubventionState {
  error: string | null;
}

/**
 * L'équipe dépose sa demande de subvention exceptionnelle.
 *
 * La garde qui compte est ici : on ne dépose un dossier QUE si le mur est
 * réel — en crise, financement de sauvetage exigé, et emprunt et apport
 * insuffisants même utilisés jusqu'au bout. Sans cela, ce serait un bouton
 * « demander de l'argent » ouvert à toute équipe qui trouve son tour difficile,
 * et l'animateur croulerait sous des dossiers sans objet.
 */
export async function demanderSubventionAction(
  gameId: string,
  _previous: DemandeSubventionState,
  formData: FormData,
): Promise<DemandeSubventionState> {
  const userId = await getGuestUserId();
  if (!userId) return { error: "Session expirée : rejoignez la partie à nouveau." };

  const vue = await getGameView(gameId, userId);
  const exigence = vue?.exigenceSauvetage;
  if (!vue || !exigence) {
    return { error: "Aucun financement de sauvetage n'est exigé de votre équipe." };
  }
  if (exigence.avecAnimateur === false) {
    return { error: "En partie solo, il n'y a pas d'animateur à solliciter." };
  }
  if (verdictAuMaximum(exigence).issue !== "leviers_epuises") {
    return {
      error:
        "Votre emprunt et l'apport de vos associés peuvent encore couvrir ce qui manque : " +
        "utilisez-les avant de demander une aide.",
    };
  }

  const plafond = resteApresLeviers(exigence);
  const montant = Number(String(formData.get("montant") ?? "").replace(",", "."));
  if (!Number.isFinite(montant) || montant <= 0) {
    return { error: "Indiquez le montant que vous demandez." };
  }
  // On ne demande pas plus que ce qui manque : le dossier porte sur un trou
  // précis, pas sur un confort de trésorerie.
  if (montant > plafond + 1) {
    return { error: `Vous ne pouvez pas demander plus que ce qui manque (${formatEuro(plafond)}).` };
  }

  try {
    await deposerDemande({
      gameId,
      teamId: vue.playerTeamId,
      roundIndex: vue.currentRound,
      montant,
      motif: String(formData.get("motif") ?? ""),
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "La demande n'a pas pu être déposée." };
  }
  revalidatePath(`/arena/${gameId}`);
  return { error: null };
}

export interface ChoixEquipeState {
  error: string | null;
}

/**
 * L'élève rejoint l'équipe de ses camarades, au premier tour.
 *
 * Le code d'invitation range dans l'équipe la moins remplie : correct pour
 * ouvrir la séance, faux dès que la classe a ses propres groupes.
 */
export async function choisirMonEquipeAction(
  gameId: string,
  _previous: ChoixEquipeState,
  formData: FormData,
): Promise<ChoixEquipeState> {
  const userId = await getGuestUserId();
  if (!userId) return { error: "Session expirée : rejoignez la partie à nouveau." };
  const teamId = String(formData.get("teamId") ?? "");
  if (!teamId) return { error: "Choisissez une équipe." };
  try {
    await choisirSonEquipe({ gameId, userId, teamId });
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Le changement d'équipe a échoué.",
    };
  }
  revalidatePath(`/arena/${gameId}`);
  return { error: null };
}
