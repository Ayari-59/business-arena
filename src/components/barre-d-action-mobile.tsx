"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import { ACTION_PRINCIPALE, NAVIGATION } from "@/config/navigation";
import { bouton } from "@/components/bouton";

/**
 * LA BARRE D'ACTION DU BAS, SUR TÉLÉPHONE SEULEMENT.
 *
 * Sur une page longue, le bouton qu'on veut est en haut, à trois écrans. Cette
 * barre garde le geste de la page sous le pouce : jouer, ou côté enseignants,
 * choisir sa simulation. Elle s'efface dès que la page
 * montre déjà ce bouton (le héros, la bande finale : tout bloc marqué
 * `data-cta-principal`), pour ne jamais doubler un appel à l'action visible.
 *
 * DISCRÈTE. Une ligne de 60 px, un seul bouton, fermable pour la session, absente des écrans
 * où l'on joue, où l'on remplit un formulaire ou où l'on administre. Elle
 * respecte l'encoche du bas (`safe-area-inset-bottom`) et cède la place à
 * l'invitation d'installation, qui occupe le même bord. Un espace de même
 * hauteur est réservé en bas de page : rien n'est masqué derrière elle.
 *
 * Les adresses et les libellés viennent du plan du site (config/navigation) :
 * il n'y a qu'un seul endroit qui dit où mène « Choisir ma simulation ».
 */

/** Les pages publiques où la barre a un sens, et ce qu'elle propose à droite. */
const PAGES_GENERALES = ["/", "/entreprises", "/fonctionnalites", "/notions", "/guide"];
const PAGES_ENSEIGNANTS = ["/enseignants", "/animations", "/parcours"];

const CLE_FERMEE = "barre-action-fermee";

/** La fermeture vit dans sessionStorage ; ce petit abonnement la rend lisible sans état local. */
const ECOUTEURS = new Set<() => void>();
function lireFermee(): boolean {
  try {
    return sessionStorage.getItem(CLE_FERMEE) === "1";
  } catch {
    return false;
  }
}
function abonner(rappel: () => void) {
  ECOUTEURS.add(rappel);
  return () => {
    ECOUTEURS.delete(rappel);
  };
}

function variante(chemin: string | null): "general" | "enseignant" | null {
  if (!chemin) return null;
  if (PAGES_ENSEIGNANTS.some((p) => chemin === p || chemin.startsWith(`${p}/`))) {
    // Les documents imprimables d'un atelier n'ont pas à porter de barre.
    return /\/(dossier|formulaires|cockpit)(\/|$)/.test(chemin) ? null : "enseignant";
  }
  if (PAGES_GENERALES.some((p) => chemin === p)) return "general";
  return null;
}

export function BarreDActionMobile() {
  const chemin = usePathname();
  const quoi = variante(chemin);
  // Côté serveur et à l'hydratation, la barre est « ouverte » : on lit le
  // stockage ensuite, sans désaccord de rendu.
  const fermee = useSyncExternalStore(abonner, lireFermee, () => false);
  // Ce que l'observateur a vu, rattaché à la page où il l'a vu : un changement
  // de page repart de zéro sans qu'il faille remettre un état à la main.
  const [vu, setVu] = useState<{ chemin: string | null; visible: boolean }>({
    chemin: null,
    visible: false,
  });
  const boutonVisible = vu.chemin === chemin && vu.visible;

  // Tant qu'un appel à l'action principal est à l'écran, la barre se tait.
  useEffect(() => {
    if (!quoi) return;
    const cibles = document.querySelectorAll("[data-cta-principal]");
    if (cibles.length === 0) return;
    const vus = new Set<Element>();
    const observateur = new IntersectionObserver((entrees) => {
      for (const e of entrees) {
        if (e.isIntersecting) vus.add(e.target);
        else vus.delete(e.target);
      }
      setVu({ chemin, visible: vus.size > 0 });
    });
    cibles.forEach((c) => observateur.observe(c));
    return () => observateur.disconnect();
  }, [quoi, chemin]);

  if (!quoi) return null;

  const actif = !fermee && !boutonVisible;
  // L'appel de la page : jouer, sur les pages générales (c'est celui de leur
  // héros et de leur bande finale) ; choisir sa simulation, côté enseignants.
  const jouer = NAVIGATION.flatMap((g) => g.liens).find((l) => l.href === "/jouer");
  const appel = quoi === "enseignant" ? ACTION_PRINCIPALE : jouer;
  if (!appel) return null;

  const fermer = () => {
    try {
      sessionStorage.setItem(CLE_FERMEE, "1");
    } catch {
      // stockage indisponible : la barre ne se fermera pas, elle reste discrète
    }
    ECOUTEURS.forEach((rappel) => rappel());
  };

  return (
    <>
      {/* Un espace de la hauteur de la barre, en bas de page : le pied de page ne passe pas dessous. */}
      {!fermee ? (
        <div aria-hidden className="h-[calc(3.75rem+env(safe-area-inset-bottom))] sm:hidden" />
      ) : null}
      <div
        role="region"
        aria-label="Actions rapides"
        data-barre-action
        className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur transition-transform duration-200 motion-reduce:transition-none sm:hidden [:root[data-install-prompt]_&]:hidden ${
          actif ? "translate-y-0" : "pointer-events-none translate-y-full"
        }`}
        // Une barre repliée sous l'écran ne doit être ni lue ni atteinte au clavier.
        inert={!actif}
      >
        {/* UN SEUL BOUTON, DE 48 PX (audit P3-09). « Choisir ma simulation »
            et « Jouer » se doublaient, côte à côte, sur 60 px de haut : la
            barre redit maintenant l'appel principal de la page qu'on lit, et
            lui seul, avec de quoi la fermer. */}
        <div className="mx-auto flex max-w-md items-center gap-2 px-3 py-1.5">
          <Link
            href={appel.href}
            className={`${bouton({ variante: "principal", taille: "m" })} min-h-12 flex-1`}
          >
            {appel.libelle}
          </Link>
          <button
            type="button"
            onClick={fermer}
            aria-label="Fermer la barre d'actions"
            className="grid min-h-11 min-w-11 shrink-0 place-items-center rounded-lg text-lg text-slate-400 hover:text-slate-200"
          >
            <span aria-hidden>×</span>
          </button>
        </div>
      </div>
    </>
  );
}
