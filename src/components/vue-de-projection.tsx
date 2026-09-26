"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { echeanceDuTour, dateLisible, type Echeance } from "@/config/echeance";

/**
 * CE QUE LA CLASSE VOIT AU MUR.
 *
 * L'enseignant projette. Toutes les pages existantes sont faites pour un écran
 * à cinquante centimètres : `text-sm`, `text-xs`, des tableaux denses. Au fond
 * d'une salle, rien de tout cela ne se lit, et la séance se déroulait donc en
 * annonçant les choses à la voix — « il reste dix minutes », « il manque deux
 * équipes » —, ce qu'il faut répéter à chaque question.
 *
 * Trois moments, trois panneaux, et un seul à la fois : c'est ce qui permet
 * d'écrire grand. Le code d'invitation quand la classe se connecte, l'état des
 * validations pendant le tour, le classement après la clôture. Le panneau
 * d'ouverture est choisi par le serveur d'après l'état réel de la partie ;
 * l'enseignant en change d'un clic.
 *
 * Les tailles sont en `clamp()` sur la largeur : le même écran sert un
 * vidéoprojecteur de salle et un écran de portable en table ronde.
 */

export type Panneau = "code" | "tour" | "classement";

export interface EquipeProjetee {
  nom: string;
  aValide: boolean;
}

export interface LigneClassement {
  rang: number;
  nom: string;
  ipg: number;
  defaillant: boolean;
}

const ONGLETS: { cle: Panneau; libelle: string; icone: string }[] = [
  { cle: "code", libelle: "Code d'entrée", icone: "🎟️" },
  { cle: "tour", libelle: "Ce tour", icone: "⏱️" },
  { cle: "classement", libelle: "Classement", icone: "🏆" },
];

/** Le titre d'un panneau : petit par rapport au reste, il nomme sans occuper. */
function Surtitre({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[clamp(0.8rem,1.6vw,1.4rem)] font-semibold uppercase tracking-[0.3em] text-slate-400">
      {children}
    </p>
  );
}

/**
 * Le temps restant, en grand.
 *
 * L'heure de fermeture est rendue par le SERVEUR — c'est elle que la classe
 * doit voir dès la première image, et elle ne bouge pas. Le temps restant la
 * remplace après le montage : calculé au rendu serveur, il serait déjà faux à
 * l'affichage et ferait diverger l'hydratation. C'est le panneau qu'un
 * enseignant laisse vingt minutes au mur : sans rien avant l'hydratation, la
 * page s'ouvrait sur un trou.
 */
function Decompte({ closesAt }: { closesAt: string }) {
  const quand = new Date(closesAt);
  const [etat, setEtat] = useState<Echeance | null>(null);

  useEffect(() => {
    const rafraichir = () => setEtat(echeanceDuTour(quand, new Date()));
    rafraichir();
    const minuteur = setInterval(rafraichir, 30_000);
    return () => clearInterval(minuteur);
  }, [closesAt]); // eslint-disable-line react-hooks/exhaustive-deps

  if (Number.isNaN(quand.getTime()) || etat?.depassee) return null;
  return (
    <p
      className={`text-[clamp(1.6rem,4.5vw,3.5rem)] font-bold tabular-nums ${
        etat?.urgence ? "text-amber-300" : "text-slate-300"
      }`}
    >
      Ferme {etat?.restant ?? dateLisible(quand)}
    </p>
  );
}

export function VueDeProjection({
  defaut,
  joinCode,
  qr,
  adresse,
  elevesConnectes,
  equipes,
  libelleTour,
  echeance,
  classement,
  classementRevele,
  libelleTourClos,
  finished,
  retour,
}: {
  /** Le panneau d'ouverture, choisi d'après l'état de la partie. */
  defaut: Panneau;
  joinCode: string | null;
  /**
   * Le QR de la partie, déjà dessiné. Il arrive tout fait parce qu'il se
   * calcule sur le serveur : cette vue est un composant client, y appeler le
   * dessin enverrait la bibliothèque dans le navigateur pour rien.
   */
  qr: ReactNode;
  /** L'adresse à recopier au tableau, en toutes lettres. */
  adresse: string;
  elevesConnectes: number;
  equipes: EquipeProjetee[];
  libelleTour: string;
  /** Échéance du tour courant (ISO) ; null sans planning. */
  echeance: string | null;
  classement: LigneClassement[];
  /** Le classement du dernier tour clos est-il révélé aux élèves ? */
  classementRevele: boolean;
  libelleTourClos: string | null;
  finished: boolean;
  /** Retour vers le pilotage de la partie. */
  retour: string;
}) {
  const [panneau, setPanneau] = useState<Panneau>(defaut);
  const valides = equipes.filter((e) => e.aValide).length;

  return (
    <div className="flex min-h-screen flex-col px-4 py-4 sm:px-8">
      {/* La barre de commande : tout ce qui n'est pas le message. Elle reste
          petite — la classe n'a pas à la lire — mais reste cliquable. */}
      <nav className="flex flex-wrap items-center gap-2" aria-label="Panneau projeté">
        {ONGLETS.map((o) => {
          const actif = o.cle === panneau;
          return (
            <button
              key={o.cle}
              type="button"
              onClick={() => setPanneau(o.cle)}
              aria-pressed={actif}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                actif
                  ? "border-amber-400/60 bg-amber-400/10 text-amber-200"
                  : "border-white/10 text-slate-400 hover:text-slate-200"
              }`}
            >
              <span aria-hidden>{o.icone}</span> {o.libelle}
            </button>
          );
        })}
        <Link
          href={retour}
          className="ml-auto rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-400 transition hover:text-slate-200"
        >
          ← Pilotage
        </Link>
      </nav>

      {/* Le message. Il prend toute la place qui reste et se centre : c'est la
          seule chose que la classe regarde. */}
      <div className="flex flex-1 flex-col items-center justify-center gap-[clamp(0.5rem,2vh,2rem)] py-[clamp(1rem,4vh,4rem)] text-center">
        {panneau === "code" ? (
          <>
            <Surtitre>Rejoindre la partie</Surtitre>
            {joinCode ? (
              /* DEUX CHEMINS, CÔTE À CÔTE ET DE MÊME RANG. À gauche le code,
                 pour qui tape ; à droite le QR, pour qui vise avec son
                 téléphone et n'a plus qu'à écrire son prénom. Aucun des deux
                 n'est un repli de l'autre : c'est l'appareil de l'élève qui
                 décide, et il décide sans qu'on lui explique. */
              <div className="flex flex-col items-center gap-[clamp(0.75rem,3vw,3rem)] sm:flex-row sm:justify-center">
                <p className="font-mono text-[clamp(3rem,13vw,9rem)] font-bold leading-none tracking-[0.12em] text-amber-300">
                  {joinCode}
                </p>
                {qr ? (
                  <span className="flex shrink-0 flex-col items-center gap-[clamp(0.25rem,1vh,0.75rem)]">
                    {qr}
                    <span className="text-[clamp(0.8rem,1.4vw,1.2rem)] uppercase tracking-[0.2em] text-slate-400">
                      ou scannez
                    </span>
                  </span>
                ) : null}
              </div>
            ) : (
              <p className="text-[clamp(1.5rem,4vw,3rem)] text-slate-400">
                Cette partie n&apos;a pas de code d&apos;invitation.
              </p>
            )}
            <p className="text-[clamp(1.1rem,3.4vw,2.6rem)] font-semibold text-slate-200">
              {adresse}
            </p>
            <p className="text-[clamp(1rem,2.4vw,1.8rem)] text-slate-400">
              {elevesConnectes === 0
                ? "Personne n'a encore rejoint."
                : `${elevesConnectes} ${elevesConnectes > 1 ? "élèves connectés" : "élève connecté"} · ${equipes.length} ${equipes.length > 1 ? "équipes" : "équipe"}`}
            </p>
          </>
        ) : null}

        {panneau === "tour" ? (
          <>
            <Surtitre>{finished ? "Partie terminée" : libelleTour}</Surtitre>
            {finished ? (
              <p className="text-[clamp(2rem,7vw,5rem)] font-bold leading-tight text-slate-100">
                Tous les tours sont joués.
              </p>
            ) : (
              <>
                <p className="text-[clamp(2.5rem,9vw,7rem)] font-bold leading-none tabular-nums text-slate-50">
                  {valides} / {equipes.length}
                </p>
                <p className="text-[clamp(1.1rem,2.8vw,2rem)] text-slate-400">
                  {equipes.length > 1 ? "équipes ont validé" : "équipe a validé"}
                </p>
                {echeance ? <Decompte closesAt={echeance} /> : null}
                {/* Les noms, pour que chaque équipe se cherche du regard et se
                    trouve : « il manque deux équipes » ne dit pas lesquelles. */}
                <ul className="mt-[clamp(0.5rem,2vh,2rem)] flex flex-wrap justify-center gap-[clamp(0.4rem,1vw,1rem)]">
                  {equipes.map((e) => (
                    <li
                      key={e.nom}
                      className={`rounded-xl border px-[clamp(0.6rem,1.6vw,1.6rem)] py-[clamp(0.3rem,0.9vw,0.9rem)] text-[clamp(1rem,2.4vw,2rem)] font-semibold ${
                        e.aValide
                          ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
                          : "border-amber-400/40 text-amber-200"
                      }`}
                    >
                      <span aria-hidden>{e.aValide ? "✓" : "…"}</span> {e.nom}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        ) : null}

        {panneau === "classement" ? (
          <>
            <Surtitre>
              {libelleTourClos ? `Classement · ${libelleTourClos}` : "Classement"}
            </Surtitre>
            {/* Ce que le nombre mesure. Sans cette ligne, la colonne de droite
                est une suite de décimales sans unité : le sigle IPG n'apparaît
                nulle part ailleurs sur le mur. */}
            {classement.length > 0 && classementRevele ? (
              <p className="text-[clamp(0.9rem,1.8vw,1.5rem)] text-slate-400">
                Indice de performance globale (IPG)
              </p>
            ) : null}
            {classement.length === 0 ? (
              <p className="text-[clamp(1.3rem,3.5vw,2.6rem)] text-slate-400">
                Disponible après le premier tour clos.
              </p>
            ) : !classementRevele ? (
              // LE RIDEAU. Les élèves ne voient pas encore ce classement :
              // le projeter par mégarde le révélerait à leur place, et l'écran
              // de pilotage perdrait le seul geste qui fait de la révélation un
              // moment.
              <>
                <p className="text-[clamp(1.6rem,4.5vw,3.2rem)] font-bold text-slate-100">
                  Classement sous embargo
                </p>
                <p className="max-w-3xl text-[clamp(1rem,2.2vw,1.6rem)] leading-relaxed text-slate-400">
                  Les élèves ne l&apos;ont pas encore vu. Révélez-le depuis le pilotage de la
                  partie, puis revenez ici.
                </p>
              </>
            ) : (
              <ol className="w-full max-w-5xl space-y-[clamp(0.3rem,1vh,0.9rem)]">
                {classement.map((row) => (
                  <li
                    key={row.nom}
                    className="flex items-center justify-between gap-4 rounded-xl border border-white/5 bg-slate-950 px-[clamp(0.8rem,2vw,2rem)] py-[clamp(0.4rem,1.2vh,1rem)]"
                  >
                    <span className="flex min-w-0 items-baseline gap-[clamp(0.5rem,1.5vw,1.5rem)] text-[clamp(1.2rem,3.4vw,2.8rem)] font-semibold text-slate-100">
                      <span className="shrink-0 tabular-nums text-slate-400">#{row.rang}</span>
                      <span className="truncate">{row.nom}</span>
                      {row.defaillant ? (
                        <span
                          aria-label="entreprise défaillante"
                          className="shrink-0 text-[clamp(0.9rem,2vw,1.6rem)] text-red-400"
                        >
                          ⚠️
                        </span>
                      ) : null}
                    </span>
                    <span className="shrink-0 text-[clamp(1.2rem,3.4vw,2.8rem)] font-bold tabular-nums text-amber-300">
                      {row.ipg.toFixed(1)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
