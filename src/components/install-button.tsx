"use client";

import { useEffect, useState } from "react";

/**
 * Bouton d'installation explicite : Chrome n'affiche sa bannière qu'après
 * un seuil d'engagement opaque, donc on capte `beforeinstallprompt` (dans
 * le script inline du layout, avant même l'hydratation) et on déclenche
 * l'invite à la demande. Safari iOS n'émet jamais l'événement : on y guide
 * l'utilisateur vers le menu Partager.
 */

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

declare global {
  interface Window {
    __bip?: BeforeInstallPromptEvent;
  }
}

const BTN =
  "rounded-lg border border-amber-400/40 px-3 py-1.5 text-xs font-semibold text-amber-300 transition hover:border-amber-400 hover:bg-amber-400/10";

export function InstallButton() {
  const [canPrompt, setCanPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);

  useEffect(() => {
    // Déjà installée : rien à proposer.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;

    if (window.__bip) setCanPrompt(true);

    const onReady = () => setCanPrompt(true);
    const onInstalled = () => {
      setCanPrompt(false);
      setShowIosHelp(false);
      window.__bip = undefined;
    };
    window.addEventListener("bip-ready", onReady);
    window.addEventListener("appinstalled", onInstalled);

    const ua = navigator.userAgent;
    // iOS/iPadOS hors navigateurs tiers (qui ne savent pas installer non plus,
    // mais dont les instructions diffèrent) — et iPadOS 13+ se déclare "Mac".
    const iosLike =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (iosLike && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua)) setIsIos(true);

    return () => {
      window.removeEventListener("bip-ready", onReady);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = async () => {
    const e = window.__bip;
    if (!e) return;
    // L'invite ne se consomme qu'une fois : le bouton disparaît ensuite,
    // Chrome ré-émettra l'événement à une prochaine visite si l'on a refusé.
    window.__bip = undefined;
    setCanPrompt(false);
    await e.prompt();
    await e.userChoice;
  };

  if (canPrompt) {
    return (
      <button type="button" onClick={install} className={BTN}>
        Installer l&apos;app
      </button>
    );
  }

  if (isIos) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowIosHelp((v) => !v)}
          className={BTN}
          aria-expanded={showIosHelp}
        >
          Installer l&apos;app
        </button>
        {showIosHelp ? (
          <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-white/10 bg-slate-900 p-4 text-left shadow-2xl">
            <p className="text-xs font-semibold text-slate-100">
              Ajouter à l&apos;écran d&apos;accueil
            </p>
            <ol className="mt-2 space-y-1.5 text-xs leading-relaxed text-slate-400">
              <li>1. Touchez l&apos;icône Partager (carré avec une flèche) en bas de Safari.</li>
              <li>
                2. Faites défiler et choisissez «&nbsp;Sur l&apos;écran d&apos;accueil&nbsp;».
              </li>
              <li>3. Confirmez avec «&nbsp;Ajouter&nbsp;».</li>
            </ol>
            <button
              type="button"
              onClick={() => setShowIosHelp(false)}
              className="mt-3 text-xs text-slate-500 underline-offset-4 hover:text-slate-300 hover:underline"
            >
              Fermer
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return null;
}
