"use client";

import { useEffect, useState } from "react";

/**
 * Pop-up d'installation, sur mobile uniquement.
 *
 * Le bouton discret du menu ne se voit pas : sur téléphone, on propose une
 * bannière basse, fermable, qui invite à installer l'app. Deux mondes :
 * - Android/Chrome émet `beforeinstallprompt` (capté dans le script inline du
 *   layout et rejoué via l'événement `bip-ready`) → bouton « Installer » natif ;
 * - iOS/Safari ne l'émet jamais → on guide vers Partager → « Sur l'écran
 *   d'accueil ».
 *
 * On ne harcèle pas : déjà installée (standalone) → rien ; fermée ou installée
 * → mémorisé dans localStorage et plus rien pendant DELAI_SILENCE. `sm:hidden`
 * la réserve au petit écran.
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const CLE = "install-prompt-ferme-le";
const DELAI_SILENCE = 14 * 24 * 60 * 60 * 1000; // 14 jours

function ferméRécemment(): boolean {
  try {
    const t = Number(localStorage.getItem(CLE) ?? "0");
    return Number.isFinite(t) && Date.now() - t < DELAI_SILENCE;
  } catch {
    return false;
  }
}

export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [canPrompt, setCanPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone || ferméRécemment()) return;

    const ua = navigator.userAgent;
    const iosLike =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const iosSafari = iosLike && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);

    if (window.__bip) {
      setCanPrompt(true);
      setVisible(true);
    } else if (iosSafari) {
      setIsIos(true);
      setVisible(true);
    }

    const onReady = () => {
      setCanPrompt(true);
      setVisible(true);
    };
    const onInstalled = () => {
      setVisible(false);
      window.__bip = undefined;
      try {
        localStorage.setItem(CLE, String(Date.now()));
      } catch {
        // stockage indisponible : rien à mémoriser
      }
    };
    window.addEventListener("bip-ready", onReady);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("bip-ready", onReady);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const fermer = () => {
    setVisible(false);
    try {
      localStorage.setItem(CLE, String(Date.now()));
    } catch {
      // stockage indisponible : fermé pour la session en cours seulement
    }
  };

  const installer = async () => {
    const e = window.__bip as BeforeInstallPromptEvent | undefined;
    if (!e) return;
    window.__bip = undefined;
    setCanPrompt(false);
    await e.prompt();
    const choix = await e.userChoice;
    if (choix.outcome === "accepted") setVisible(false);
    else fermer();
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Installer l'application"
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)] sm:hidden"
    >
      <div className="mx-auto max-w-md rounded-2xl border border-amber-400/25 bg-slate-900/95 p-4 shadow-2xl backdrop-blur">
        <div className="flex items-start gap-3">
          <span
            aria-hidden
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/10 text-xl ring-1 ring-inset ring-amber-400/25"
          >
            📲
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-100">
              Installer Business Arena
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-400">
              {isIos
                ? "Ajoutez l'app à votre écran d'accueil : elle s'ouvre en plein écran, sans barre de navigateur."
                : "Un accès direct depuis l'écran d'accueil, en plein écran, comme une vraie app."}
            </p>
          </div>
        </div>

        {isIos ? (
          <ol className="mt-3 space-y-1 text-xs leading-relaxed text-slate-300">
            <li>1. Touchez l&apos;icône Partager (carré avec une flèche ↑) dans Safari.</li>
            <li>2. Choisissez «&nbsp;Sur l&apos;écran d&apos;accueil&nbsp;».</li>
            <li>3. Confirmez avec «&nbsp;Ajouter&nbsp;».</li>
          </ol>
        ) : null}

        <div className="mt-3 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={fermer}
            className="rounded-lg px-3 py-2 text-xs font-medium text-slate-400 transition hover:text-slate-200"
          >
            {isIos ? "Compris" : "Plus tard"}
          </button>
          {canPrompt ? (
            <button
              type="button"
              onClick={installer}
              className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:bg-amber-400"
            >
              Installer l&apos;app
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
