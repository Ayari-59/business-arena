"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { echeanceDuTour, dateLisible, type Echeance } from "@/config/echeance";
import { Icone, type NomDIcone } from "@/components/icone";
import {
  RevelationDuMarche,
  rythmeDeRevelation,
  type LigneDeRevelation,
} from "@/components/revelation-du-marche";

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
 * ET LE CLASSEMENT SE DÉVOILE (lot 4B). Le tour clos et son classement
 * révélé, le mur ne se contente pas d'afficher le tableau : il joue le rituel
 * « le marché a répondu », le même qu'en solo à la fin d'un tour, de la
 * dernière équipe à la première, podium en or à la fin
 * (`components/revelation-du-marche.tsx`). C'est le moment de la séance où
 * toute la classe regarde l'écran ensemble.
 *
 * L'ENSEIGNANT GARDE LA MAIN, ET LE MUR NE RESTE JAMAIS COINCÉ. La révélation
 * se passe (touche Échap ou bouton de la barre de commande) et se rejoue ; elle
 * s'arrête d'elle-même au bout de son temps ; l'onglet qui perd le focus la
 * termine ; une page rechargée montre l'état FINAL, complet, sans la rejouer —
 * le tour déjà dévoilé est noté dans ce navigateur. Et le classement reste
 * lisible sans aucune animation : elle ne fait qu'apparaître ce qui est là.
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
  /**
   * CE QUE LE TOUR A DONNÉ À CETTE ÉQUIPE, déjà formaté par le serveur, qui le
   * tient des résultats réellement simulés : le résultat net signé
   * (« +12 000 € », « −294 € ») et la trésorerie de fin de tour. Absents tant
   * qu'aucun tour n'est clos — le classement se projette alors sans eux.
   */
  resultat?: string | null;
  /** Gain ou perte : le vert ou le rouge francs. */
  sens?: "gain" | "perte" | null;
  tresorerie?: string | null;
  /** Trésorerie en découvert : une alerte, donc le rouge. */
  decouvert?: boolean;
}

const ONGLETS: { cle: Panneau; libelle: string; icone: NomDIcone }[] = [
  { cle: "code", libelle: "Code d'entrée", icone: "cle" },
  { cle: "tour", libelle: "Ce tour", icone: "duree" },
  { cle: "classement", libelle: "Classement", icone: "trophee" },
];

/** Le titre d'un panneau : petit par rapport au reste, il nomme sans occuper. */
function Surtitre({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[clamp(0.8rem,1.6vw,1.4rem)] font-semibold uppercase tracking-annonce text-slate-400">
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
  gameId,
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
  tourRevele,
  finished,
  retour,
}: {
  /** Le panneau d'ouverture, choisi d'après l'état de la partie. */
  defaut: Panneau;
  /** La partie : de quoi retenir, dans CE navigateur, le tour déjà dévoilé. */
  gameId: string;
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
  /**
   * L'index du dernier tour clos dont le classement est révélé, ou null. C'est
   * lui qui déclenche la révélation : un tour plus récent que celui que ce
   * navigateur a déjà dévoilé, et le mur le joue.
   */
  tourRevele: number | null;
  finished: boolean;
  /** Retour vers le pilotage de la partie. */
  retour: string;
}) {
  const [panneau, setPanneau] = useState<Panneau>(defaut);
  const valides = equipes.filter((e) => e.aValide).length;
  const classementProjetable = classementRevele && classement.length > 0;

  // LA RÉVÉLATION : JOUÉE UNE FOIS, ET JAMAIS BLOQUANTE.
  // `cle` remonte la pendule des animations (un remontage les rejoue) ;
  // `enCours` dit si elles sont posées. À faux, l'écran est à son état FINAL :
  // c'est ce que montrent une page rechargée, un onglet revenu au premier plan
  // et une capture.
  const [cle, setCle] = useState(0);
  const [enCours, setEnCours] = useState(false);
  const duree = rythmeDeRevelation(classement.length).duree;

  // LE PANNEAU SUIT LA FENÊTRE, PAS LA SESSION. Recharger la projection — un
  // vidéoprojecteur rebranché, un écran qui s'est mis en veille, une touche
  // F5 — ramenait au panneau que le serveur choisit, et la classe perdait le
  // classement qu'elle regardait. Cet onglet se souvient du sien ; un nouvel
  // onglet, lui, ouvre bien sur le moment de la partie.
  const montrer = (p: Panneau) => {
    setPanneau(p);
    try {
      window.sessionStorage.setItem(`ba-panneau:${gameId}`, p);
    } catch {
      /* stockage refusé : le panneau ne survit pas au rechargement, rien de plus */
    }
  };

  const jouer = () => {
    montrer("classement");
    setCle((k) => k + 1);
    setEnCours(true);
  };

  useEffect(() => {
    try {
      const garde = window.sessionStorage.getItem(`ba-panneau:${gameId}`);
      if (garde && ONGLETS.some((o) => o.cle === garde)) setPanneau(garde as Panneau);
    } catch {
      /* rien à faire */
    }
  }, [gameId]);

  // AU PREMIER REGARD SUR UN TOUR NON ENCORE DÉVOILÉ, on le joue — et on le
  // note tout de suite : rechargée en pleine révélation, la page revient à
  // l'état final au lieu de repartir du début.
  useEffect(() => {
    if (tourRevele === null) return;
    const memoire = `ba-revelation:${gameId}`;
    let dejaVu = 0;
    try {
      dejaVu = Number(window.localStorage.getItem(memoire) ?? "0") || 0;
    } catch {
      // Navigation privée, stockage refusé : on ne rejouera pas en boucle,
      // parce que l'effet ne se relance qu'au changement de tour.
    }
    if (tourRevele <= dejaVu) return;
    try {
      window.localStorage.setItem(memoire, String(tourRevele));
    } catch {
      /* rien à faire */
    }
    jouer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, tourRevele]);

  // TROIS FAÇONS D'EN SORTIR, toutes vers l'état final : le temps qui passe,
  // la touche d'échappement, et l'onglet qu'on quitte (une animation en
  // arrière-plan est suspendue par le navigateur : au retour, le mur
  // resterait figé sur une liste à moitié écrite).
  useEffect(() => {
    if (!enCours) return;
    const fin = setTimeout(() => setEnCours(false), Math.ceil(duree * 1000) + 120);
    const auClavier = (e: KeyboardEvent) => {
      if (e.key === "Escape") setEnCours(false);
    };
    const auMasquage = () => {
      if (document.hidden) setEnCours(false);
    };
    window.addEventListener("keydown", auClavier);
    document.addEventListener("visibilitychange", auMasquage);
    return () => {
      clearTimeout(fin);
      window.removeEventListener("keydown", auClavier);
      document.removeEventListener("visibilitychange", auMasquage);
    };
  }, [enCours, duree]);

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
              onClick={() => montrer(o.cle)}
              aria-pressed={actif}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
                actif
                  ? "border-amber-400/60 bg-amber-400/10 text-amber-200"
                  : "border-white/10 text-slate-400 hover:text-slate-200"
              }`}
            >
              <Icone nom={o.icone} className="mr-1.5 h-4 w-4" />
              {o.libelle}
            </button>
          );
        })}
        {/* LA MAIN DE L'ENSEIGNANT SUR LA RÉVÉLATION. Discrète, dans la barre
            de commande et non au milieu du message : passer (ou Échap, qui
            fait la même chose depuis le fond de la salle, télécommande en
            main) et rejouer. Un filet, jamais un aplat : le mur n'a pas de
            geste orange. */}
        {classementProjetable && panneau === "classement" ? (
          <button
            type="button"
            onClick={() => (enCours ? setEnCours(false) : jouer())}
            className="ml-auto rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-slate-400 transition hover:text-slate-200"
          >
            {enCours ? null : <Icone nom="recommencer" className="mr-1.5 h-4 w-4" />}
            {enCours ? "Passer la révélation (Échap)" : "Rejouer la révélation"}
          </button>
        ) : null}
        <Link
          href={retour}
          className={`rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-400 transition hover:text-slate-200 ${
            classementProjetable && panneau === "classement" ? "" : "ml-auto"
          }`}
        >
          ← Pilotage
        </Link>
      </nav>

      {/* Le message. Il prend toute la place qui reste et se centre : c'est la
          seule chose que la classe regarde. Sa respiration suit la HAUTEUR de
          l'écran : sur un portable de 800 px, la révélation entière — titre,
          six équipes, podium — doit tenir sans qu'on fasse défiler un mur. */}
      <div className="flex flex-1 flex-col items-center justify-center gap-[clamp(0.4rem,1.2vh,2rem)] py-[clamp(0.6rem,1.8vh,4rem)] text-center">
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
                <p className="font-mono text-[clamp(3rem,13vw,9rem)] font-bold leading-none tracking-etiquette text-slate-100">
                  {joinCode}
                </p>
                {qr ? (
                  <span className="flex shrink-0 flex-col items-center gap-[clamp(0.25rem,1vh,0.75rem)]">
                    {qr}
                    <span className="text-[clamp(0.8rem,1.4vw,1.2rem)] uppercase tracking-surtitre text-slate-400">
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
                      // UN ÉTAT, PAS UN RÉSULTAT NI UNE ACTION. Valider n'est
                      // pas gagner, attendre n'est pas un bouton : le blanc
                      // cassé pour toutes, une pastille PLEINE pour celles qui
                      // ont validé, un simple cercle pour celles qu'on attend.
                      className={`inline-flex items-center gap-[0.5em] rounded-xl border px-[clamp(0.6rem,1.6vw,1.6rem)] py-[clamp(0.3rem,0.9vw,0.9rem)] text-[clamp(1rem,2.4vw,2rem)] font-semibold ${
                        e.aValide
                          ? "border-white/25 text-slate-50"
                          : "border-white/10 text-slate-300"
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`inline-block h-[0.55em] w-[0.55em] shrink-0 rounded-full ${
                          e.aValide ? "bg-slate-50" : "border-2 border-slate-400"
                        }`}
                      />
                      <span className="sr-only">{e.aValide ? "a validé : " : "en attente : "}</span>
                      {e.nom}
                    </li>
                  ))}
                </ul>
              </>
            )}
          </>
        ) : null}

        {panneau === "classement" ? (
          classement.length === 0 ? (
            <>
              <Surtitre>Classement</Surtitre>
              <p className="text-[clamp(1.3rem,3.5vw,2.6rem)] text-slate-400">
                Disponible après le premier tour clos.
              </p>
            </>
          ) : !classementRevele ? (
            // LE RIDEAU. Les élèves ne voient pas encore ce classement : le
            // projeter par mégarde le révélerait à leur place, et l'écran de
            // pilotage perdrait le seul geste qui fait de la révélation un
            // moment. Rien ne fuit, pas même un rang.
            <>
              <Surtitre>
                {libelleTourClos ? `Classement · ${libelleTourClos}` : "Classement"}
              </Surtitre>
              <p className="text-[clamp(1.6rem,4.5vw,3.2rem)] font-bold text-slate-100">
                Classement sous embargo
              </p>
              <p className="max-w-3xl text-[clamp(1rem,2.2vw,1.6rem)] leading-relaxed text-slate-400">
                Les élèves ne l&apos;ont pas encore vu. Révélez-le depuis le pilotage de la partie,
                puis revenez ici.
              </p>
            </>
          ) : (
            // LE MARCHÉ A RÉPONDU. Le même rituel qu'en solo, à l'échelle du
            // mur : le tour, les équipes de la dernière à la première, le
            // podium. `cle` le rejoue, `animer` dit s'il se joue — à faux,
            // c'est le tableau final, complet et capturable.
            <RevelationDuMarche
              key={cle}
              animer={enCours}
              // Le même surtitre qu'en solo : c'est le même rituel.
              surtitre="Verdict du marché"
              titre={
                libelleTourClos ? `${libelleTourClos} · le marché a répondu` : "Le marché a répondu"
              }
              // Ce que le nombre mesure. Sans cette ligne, la colonne de
              // droite est une suite de décimales sans unité : le sigle IPG
              // n'apparaît nulle part ailleurs sur le mur.
              mention="Indice de performance globale (IPG)"
              lignes={classement.map(
                (row): LigneDeRevelation => ({
                  rang: row.rang,
                  nom: row.nom,
                  ipg: row.ipg,
                  defaillant: row.defaillant,
                  resultat: row.resultat ?? null,
                  sens: row.sens ?? null,
                  tresorerie: row.tresorerie ?? null,
                  decouvert: row.decouvert ?? false,
                }),
              )}
            />
          )
        ) : null}
      </div>
    </div>
  );
}
