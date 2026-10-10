"use client";

import { usePathname } from "next/navigation";
import { bouton } from "@/components/bouton";
import { useEffect, useState } from "react";
import { estEcranDeJeu } from "@/config/ecrans-de-jeu";
import { Icone } from "@/components/icone";

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
 *
 * UNE LIGNE, ET JAMAIS EN JEU. Elle prenait quarante pour cent de l'écran, par-dessus
 * la partie, avec trois étapes de texte : la première chose qu'un
 * téléphone montrait d'une « application » était une publicité pour elle. Elle
 * tient maintenant sur une barre d'une ligne, et se tait sur les écrans de jeu
 * (voir src/config/ecrans-de-jeu.ts), où l'élève décide et n'a pas à être
 * sollicité.
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
  const enJeu = estEcranDeJeu(usePathname());

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;
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

  // La barre d'action du bas (BarreDActionMobile) cède la place tant que cette
  // invitation est affichée : elles occupent le même bord de l'écran.
  const affichee = visible && !enJeu;
  useEffect(() => {
    document.documentElement.toggleAttribute("data-install-prompt", affichee);
    return () => document.documentElement.removeAttribute("data-install-prompt");
  }, [affichee]);

  if (!visible || enJeu) return null;

  // Sur iOS il n'y a pas de bouton à offrir : l'installation passe par le menu
  // Partager de Safari. On le dit en une ligne, on n'en fait pas un tutoriel.
  return (
    <div
      role="dialog"
      aria-label="Installer l'application"
      className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] sm:hidden"
    >
      <div className="mx-auto flex max-w-md items-center gap-2 rounded-xl border border-white/15 bg-slate-900/95 py-1.5 pl-3 pr-1.5 shadow-2xl backdrop-blur">
        <Icone nom="telephone" className="h-5 w-5 text-slate-300" />
        <p className="min-w-0 flex-1 text-sm leading-snug text-slate-200">
          {isIos ? (
            <>Partager, puis «&nbsp;Sur l&apos;écran d&apos;accueil&nbsp;».</>
          ) : (
            <>Installer Business Arena</>
          )}
        </p>
        {canPrompt ? (
          <button
            type="button"
            onClick={installer}
            className={`${bouton({ taille: "m" })} min-h-11 shrink-0`}
          >
            Installer
          </button>
        ) : null}
        <button
          type="button"
          onClick={fermer}
          aria-label="Fermer"
          className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-xl text-lg text-slate-400 transition hover:text-slate-200"
        >
          <span aria-hidden>×</span>
        </button>
      </div>
    </div>
  );
}
