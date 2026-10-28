"use client";

import { useActionState } from "react";
import { bouton } from "@/components/bouton";
import {
  fermerLesComptesDeDemoAction,
  renouvelerLeMotDePasseDeDemoAction,
  seedDemoAction,
  type EtatDeLaDemo,
} from "@/app/admin/actions";

const VIDE: EtatDeLaDemo = { error: null, motDePasse: null, message: null };

/**
 * Les gestes de l'admin sur le monde démo. Le mot de passe est tiré au hasard
 * par le serveur et montré ICI une seule fois : il n'est écrit nulle part dans
 * le code, et la base n'en garde que l'empreinte.
 */
export function MondeDeDemonstration({
  enPlace,
  autorisee,
  comptes,
  refus,
}: {
  enPlace: boolean;
  autorisee: boolean;
  comptes: { direction: string; enseignant: string };
  /** Le message dit quand la démonstration est refusée (production sans drapeau). */
  refus: string;
}) {
  const [creation, creer, creationEnCours] = useActionState(seedDemoAction, VIDE);
  const [renouveau, renouveler, renouveauEnCours] = useActionState(
    renouvelerLeMotDePasseDeDemoAction,
    VIDE,
  );
  const [fermeture, fermer, fermetureEnCours] = useActionState(fermerLesComptesDeDemoAction, VIDE);
  const etat = [creation, renouveau, fermeture].find((e) => e.error || e.message || e.motDePasse) ?? VIDE;

  return (
    <div className="mt-3 space-y-3 text-sm text-slate-300">
      {enPlace ? (
        <div className="rounded-lg bg-slate-950 p-4">
          <p className="text-emerald-400">Monde démo en place</p>
          <ul className="mt-2 space-y-1 font-mono text-xs">
            <li>Admin établissement : {comptes.direction}</li>
            <li>Enseignant : {comptes.enseignant}</li>
          </ul>
          <p className="mt-2 text-xs text-slate-400">
            Le mot de passe n&apos;est montré qu&apos;une fois, à sa création. Perdu, il se
            renouvelle.
          </p>
        </div>
      ) : null}

      {!autorisee ? <p className="text-xs text-slate-400">{refus}</p> : null}

      <div className="flex flex-wrap gap-2">
        {autorisee && !enPlace ? (
          <form action={creer}>
            <button className={bouton()} disabled={creationEnCours}>
              Générer le monde démo
            </button>
          </form>
        ) : null}
        {autorisee && enPlace ? (
          <form action={renouveler}>
            <button className={bouton({ variante: "secondaire", taille: "s" })} disabled={renouveauEnCours}>
              Nouveau mot de passe
            </button>
          </form>
        ) : null}
        {enPlace ? (
          <form action={fermer}>
            <button className={bouton({ variante: "secondaire", taille: "s" })} disabled={fermetureEnCours}>
              Fermer les comptes de démo
            </button>
          </form>
        ) : null}
      </div>

      {etat.error ? <p className="text-xs text-rose-300">{etat.error}</p> : null}
      {etat.message ? <p className="text-xs text-slate-300">{etat.message}</p> : null}
      {etat.motDePasse ? (
        <p className="rounded-lg bg-slate-950 p-3 text-xs">
          Mot de passe des deux comptes, à noter maintenant :{" "}
          <code className="font-mono text-slate-100">{etat.motDePasse}</code>
        </p>
      ) : null}
    </div>
  );
}
