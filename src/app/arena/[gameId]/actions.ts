"use server";

import { revalidatePath } from "next/cache";
import { getGuestUserId } from "@/lib/guest";
import { roundDecisionsSchema } from "@/services/decision-schema";
import {
  getGameKind,
  getGameVocabulary,
  nommerEquipe,
  resolveCurrentRound,
  submitTeamDecisions,
} from "@/services/game.service";
import { submitDiagnosis, submitQuiz, unlockHint } from "@/services/pedagogy.service";
import { manques, messageIncomplet } from "@/config/situation-rendu";

export interface PlayRoundState {
  error: string | null;
}

/** Valide les décisions du joueur et résout le tour courant (mode solo, ADR-04). */
export async function playRoundAction(
  gameId: string,
  _previous: PlayRoundState,
  formData: FormData,
): Promise<PlayRoundState> {
  const userId = await getGuestUserId();
  if (!userId) return { error: "Session expirée : relancez une partie depuis l'accueil." };

  // Le volume est un pivot : vide ou nul, ce n'est pas une décision, c'est une
  // absence. Le schéma acceptait 0 sans un mot ; on le refuse ici, dans la
  // langue du secteur.
  const volumeBrut = String(formData.get("productionPlan") ?? "").trim().replace(",", ".");
  const volume = volumeBrut === "" ? NaN : Number(volumeBrut);
  if (!Number.isFinite(volume) || volume < 1) {
    const v = await getGameVocabulary(gameId);
    return { error: `${v.productionPlanLabel} : le volume doit être ≥ 1 (en ${v.units}).` };
  }

  const parsed = roundDecisionsSchema.safeParse({
    price: formData.get("price"),
    productionPlan: formData.get("productionPlan"),
    marketingBudget: formData.get("marketingBudget"),
    qualityBudget: formData.get("qualityBudget"),
    maintenanceBudget: formData.get("maintenanceBudget"),
    insurance: (() => {
      const raw = formData.get("insurance");
      if (raw === "on" || raw === "true") return true;
      if (typeof raw === "string" && raw.length > 0) return raw;
      return false;
    })(),
    supplierChoice: formData.get("supplierChoice") || undefined,
    acceptOrder: formData.get("acceptOrder") === "on",
    studies: (() => {
      const picked = {
        market: formData.get("studyMarket") === "on",
        price: formData.get("studyPrice") === "on",
        finance: formData.get("studyFinance") === "on",
        project: formData.get("studyProject") === "on",
      };
      return Object.values(picked).some(Boolean) ? picked : undefined;
    })(),
    hr: formData.has("salaryPercent")
      ? {
          hire: formData.get("hire") || 0,
          fire: formData.get("fire") || 0,
          trainingBudget: formData.get("trainingBudget") || 0,
          salaryIndex: Number(formData.get("salaryPercent") || 100) / 100,
        }
      : undefined,
    investment: (() => {
      const hasMachine = formData.has("machineCapacityUnits");
      const buyRaw = formData.get("equipmentBuyJson");
      const sellRaw = formData.get("equipmentSellJson");
      const equipBuy = buyRaw ? JSON.parse(String(buyRaw)) : undefined;
      const equipSell = sellRaw ? JSON.parse(String(sellRaw)) : undefined;
      const hasEquip = (equipBuy && equipBuy.length > 0) || (equipSell && equipSell.length > 0);
      if (!hasMachine && !hasEquip) return undefined;
      return {
        machineCapacityUnits: hasMachine ? (formData.get("machineCapacityUnits") || 0) : undefined,
        equipmentBuy: equipBuy && equipBuy.length > 0 ? equipBuy : undefined,
        equipmentSell: equipSell && equipSell.length > 0 ? equipSell : undefined,
      };
    })(),
    finance: {
      newLoan: formData.get("newLoan") || 0,
      loanRepayment: formData.get("loanRepayment") || 0,
      capitalIncrease: formData.get("capitalIncrease") || 0,
      // Le dividende n'est ouvert qu'au niveau 6 : son champ peut être absent.
      dividend: formData.get("dividend") || 0,
    },
    // Prévisions : facultatives, et sans effet sur le calcul du tour. Deux
    // champs vides ne doivent pas devenir deux zéros prévus.
    forecast: (() => {
      const num = (name: string) => {
        const raw = String(formData.get(name) ?? "").trim().replace(",", ".");
        if (raw === "") return undefined;
        const n = Number(raw);
        return Number.isFinite(n) ? n : undefined;
      };
      const expectedUnits = num("expectedUnits");
      const expectedCash = num("expectedCash");
      return expectedUnits === undefined && expectedCash === undefined
        ? undefined
        : { expectedUnits, expectedCash };
    })(),
    treasury: formData.has("discount")
      ? {
          discount: formData.get("discount") || 0,
          factoring: formData.get("factoring") || 0,
          // Le placement n'est servi qu'aux niveaux qui l'ouvrent : son champ
          // peut donc être absent du formulaire.
          placement: formData.get("placement") || 0,
        }
      : undefined,
  });
  if (!parsed.success) {
    return { error: "Décisions invalides : vérifiez les montants saisis." };
  }

  try {
    const justification = String(formData.get("justification") ?? "").trim() || undefined;
    const kind = await getGameKind(gameId);
    if (kind === "solo") {
      await resolveCurrentRound({ gameId, userId, playerDecisions: parsed.data, justification });
    } else {
      await submitTeamDecisions({ gameId, userId, payload: parsed.data, justification });
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Erreur lors de la simulation." };
  }
  revalidatePath(`/arena/${gameId}`);
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
  const m = manques({ options, questions, reponses });
  if (m.length > 0) return { error: messageIncomplet(m) };
  try {
    await submitDiagnosis({ instanceId, userId, selectedOptionIds: options, freeText });
    if (questions.length > 0) await submitQuiz({ instanceId, userId, answers: reponses });
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
    await nommerEquipe({ gameId, userId, nom: String(formData.get("nom") ?? "") });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Le nom n'a pas pu être enregistré." };
  }
  revalidatePath(`/arena/${gameId}`);
  return { error: null };
}
