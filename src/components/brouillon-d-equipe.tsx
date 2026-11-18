"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { enregistrerLeBrouillonAction, lireLeBrouillonAction } from "@/app/arena/[gameId]/actions";
import {
  DELAI_D_ENREGISTREMENT_MS,
  bandeauDuBrouillon,
  mentionDuBrouillon,
  type BrouillonServi,
  type EtatDuBrouillon,
  type SaisieDuBrouillon,
} from "@/config/brouillon-d-equipe";
import { EVENEMENT_DU_SONDAGE } from "@/lib/cadence-du-sondage";
import { ecrireBrouillon, ecrireEtatLocal, lireEtatLocal } from "@/lib/brouillon-decisions";
import { bouton } from "@/components/bouton";

/**
 * LE BROUILLON D'ÉQUIPE, DANS LA FEUILLE (`config/brouillon-d-equipe.ts`).
 *
 * La feuille garde toujours son brouillon local (`lib/brouillon-decisions.ts`) ;
 * en partie de classe, elle l'enregistre aussi sur le serveur, pour l'équipe :
 *  - REGROUPÉ : `DELAI_D_ENREGISTREMENT_MS` après la dernière frappe, et tout de
 *    suite à la sortie d'une étape ou quand l'onglet passe en arrière-plan ;
 *  - un refus ou une panne ne perd rien : la saisie reste sur l'appareil, et part
 *    au prochain enregistrement ;
 *  - À L'OUVERTURE, le serveur fait foi s'il est plus récent : le brouillon local
 *    ne l'emporte que s'il porte une saisie partie de la version du serveur et
 *    pas encore reçue (`lireEtatLocal`), sans comparer d'horloges ;
 *  - UN COÉQUIPIER ENREGISTRE pendant que la feuille est ouverte : le sondage de
 *    l'arène le dit (toutes les 12 s en séance), et un bandeau le montre, avec
 *    « Recharger ». Rien n'est écrasé sous les doigts ; tant que l'élève n'a pas
 *    choisi, sa saisie reste sur l'appareil sans partir au serveur.
 */

interface Options {
  gameId: string;
  /** La clé du brouillon local (partie et tour). */
  cle: string;
  /** Partie de classe, tour jouable, rien de validé : le brouillon d'équipe sert. */
  actif: boolean;
  /** Le brouillon de l'équipe, tel que la page l'a lu. */
  initial: BrouillonServi | null;
  /** La saisie de la feuille, telle qu'un envoi la porterait. */
  lireLaSaisie: () => SaisieDuBrouillon | null;
  /** Remettre une saisie dans la feuille (le chemin de la restauration). */
  appliquer: (saisie: SaisieDuBrouillon) => void;
}

export function useBrouillonDEquipe({ gameId, cle, actif, initial, lireLaSaisie, appliquer }: Options) {
  const [dernier, setDernier] = useState<EtatDuBrouillon | null>(actif ? initial : null);
  const [bandeau, setBandeau] = useState<EtatDuBrouillon | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enCours = useRef(false);
  const encore = useRef(false);
  const enPause = useRef(false);
  const actifRef = useRef(actif);
  const baseRef = useRef<string | null>(null);
  // Une saisie que le serveur n'a pas encore reçue. Gardée en mémoire ET sur l'appareil :
  // sans stockage (navigation privée), l'enregistrement pour l'équipe part quand même.
  const enAttente = useRef(false);
  const marquer = useCallback(
    (attente: boolean) => {
      enAttente.current = attente;
      ecrireEtatLocal(cle, { base: baseRef.current, enAttente: attente });
    },
    [cle],
  );
  const lire = useRef(lireLaSaisie);
  useEffect(() => {
    actifRef.current = actif;
    lire.current = lireLaSaisie;
  });

  // Ce qui a changé pendant un envoi repart au tour suivant, par le même chemin.
  const relancer = useRef<() => void>(() => undefined);
  const enregistrer = useCallback(async () => {
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = null;
    if (!actifRef.current || enPause.current) return;
    if (enCours.current) {
      encore.current = true;
      return;
    }
    if (!enAttente.current) return;
    const saisie = lire.current();
    if (!saisie) return;
    enCours.current = true;
    encore.current = false;
    try {
      const r = await enregistrerLeBrouillonAction(gameId, saisie);
      if (r.ok) {
        baseRef.current = r.etat.quand;
        marquer(encore.current);
        setDernier(r.etat);
        setErreur(null);
      } else {
        setErreur(r.error);
      }
    } catch {
      setErreur("Le serveur n'a pas répondu.");
    } finally {
      enCours.current = false;
    }
    if (encore.current) minuteur.current = setTimeout(() => relancer.current(), DELAI_D_ENREGISTREMENT_MS);
  }, [gameId, marquer]);
  useEffect(() => {
    relancer.current = () => void enregistrer();
  }, [enregistrer]);

  /** Une frappe : le brouillon local est déjà écrit ; le serveur suivra, regroupé. */
  const noterUnChangement = useCallback(() => {
    if (!actifRef.current) return;
    marquer(true);
    if (enCours.current) {
      encore.current = true;
      return;
    }
    if (enPause.current) return;
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => void enregistrer(), DELAI_D_ENREGISTREMENT_MS);
  }, [enregistrer, marquer]);

  /**
   * À L'OUVERTURE : quelle saisie remettre dans la feuille, du brouillon local ou
   * de celui de l'équipe. Appelée une fois, après le montage.
   */
  const choisirAuMontage = useCallback(
    (local: SaisieDuBrouillon | null): SaisieDuBrouillon | null => {
      if (!actif) return local;
      const etat = lireEtatLocal(cle);
      const localPlusRecent = local !== null && etat.enAttente && (initial === null || etat.base === initial.quand);
      if (initial && !localPlusRecent) {
        baseRef.current = initial.quand;
        ecrireBrouillon(cle, initial.saisie);
        marquer(false);
        return initial.saisie;
      }
      baseRef.current = initial?.quand ?? etat.base;
      // Une saisie restée sur l'appareil (le serveur ne l'a pas reçue) part tout de suite.
      if (local && (etat.enAttente || !initial)) {
        marquer(true);
        minuteur.current = setTimeout(() => void enregistrer(), 0);
      }
      return local;
    },
    [actif, cle, initial, enregistrer, marquer],
  );

  // LE SONDAGE DE L'ARÈNE : un enregistrement plus récent que celui que la feuille
  // connaît, fait ailleurs, pendant qu'elle est ouverte.
  useEffect(() => {
    if (!actif) return;
    const ecouter = (e: Event) => {
      const etat = (e as CustomEvent<EtatDuBrouillon | null>).detail;
      if (!etat || enCours.current) return;
      if (baseRef.current !== null && etat.quand <= baseRef.current) return;
      enPause.current = true;
      if (minuteur.current) clearTimeout(minuteur.current);
      minuteur.current = null;
      setBandeau(etat);
    };
    window.addEventListener(EVENEMENT_DU_SONDAGE, ecouter);
    return () => window.removeEventListener(EVENEMENT_DU_SONDAGE, ecouter);
  }, [actif]);

  // L'onglet passe en arrière-plan, ou la page se ferme : ce qui attend part.
  useEffect(() => {
    if (!actif) return;
    const partir = () => {
      if (document.visibilityState === "hidden") void enregistrer();
    };
    document.addEventListener("visibilitychange", partir);
    return () => document.removeEventListener("visibilitychange", partir);
  }, [actif, enregistrer]);

  // La feuille s'en va, ou le brouillon ne sert plus (l'équipe a validé) : rien ne part plus.
  useEffect(() => {
    if (actif) return;
    if (minuteur.current) clearTimeout(minuteur.current);
    minuteur.current = null;
  }, [actif]);
  useEffect(
    () => () => {
      if (minuteur.current) clearTimeout(minuteur.current);
    },
    [],
  );

  const recharger = async () => {
    const lu = await lireLeBrouillonAction(gameId).catch(() => null);
    enPause.current = false;
    setBandeau(null);
    if (!lu) {
      // Plus de brouillon : l'équipe a validé, ou le tour a changé. La page le dira.
      window.location.reload();
      return;
    }
    baseRef.current = lu.quand;
    ecrireBrouillon(cle, lu.saisie);
    marquer(false);
    appliquer(lu.saisie);
    setDernier(lu);
    setErreur(null);
  };

  const garderMaSaisie = () => {
    enPause.current = false;
    setBandeau(null);
    // Le dernier enregistrement gagne : celui-ci.
    marquer(true);
    void enregistrer();
  };

  const rendu: ReactNode = !actif ? null : bandeau ? (
    <div
      role="status"
      data-bandeau-du-brouillon=""
      className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-lg border border-sky-400/50 bg-sky-400/10 px-3 py-2.5 text-sm text-slate-100"
    >
      <p className="min-w-0 flex-1 basis-full sm:basis-auto">
        <span className="font-semibold">{bandeauDuBrouillon(bandeau.par, new Date(bandeau.quand))}</span>{" "}
        <span className="text-slate-300">
          Votre saisie reste sur cet appareil tant que vous n&apos;avez pas choisi.
        </span>
      </p>
      <span className="flex flex-wrap gap-2">
        <button type="button" onClick={() => void recharger()} className={bouton({ variante: "principal", taille: "s" })}>
          Recharger
        </button>
        <button type="button" onClick={garderMaSaisie} className={bouton({ variante: "secondaire", taille: "s" })}>
          Garder ma saisie
        </button>
      </span>
    </div>
  ) : dernier || erreur ? (
    <p data-brouillon-d-equipe="" className="text-xs text-slate-400" aria-live="polite">
      {dernier ? (
        <>
          <span className="font-semibold text-slate-300">Brouillon de l&apos;équipe</span>
          {" · "}
          {mentionDuBrouillon(dernier.par, new Date(dernier.quand), dernier.parVous)}
        </>
      ) : null}
      {erreur ? (
        <span className="block text-slate-300">Brouillon gardé sur cet appareil : {erreur}</span>
      ) : null}
    </p>
  ) : null;

  return { noterUnChangement, enregistrerMaintenant: enregistrer, choisirAuMontage, rendu };
}
