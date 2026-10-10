"use client";

import { bouton } from "@/components/bouton";
import { useParcours } from "@/components/parcours-mobile";
import { useSyncExternalStore } from "react";
import {
  CourrierRecommande,
  Enveloppe,
  EnveloppeOuverte,
  grilleDeCourriers,
} from "@/components/courrier";
import { courrierParCode } from "@/config/courriers/registre";
import { courrierDeRoutine } from "@/config/courriers/routine";
import { creerMemoireDeLecture } from "@/components/memoire-de-lecture";
import { Icone } from "@/components/icone";

/**
 * LE COURRIER DU TRIMESTRE, VÉCU.
 *
 * Le moteur tire les événements d'un tour à sa clôture ; en solo, le joueur
 * les découvrait dans ses résultats, après avoir décidé. Le tirage étant
 * déterministe (voir `peekEventDraw`), on le lui présente ENTRE L'ANALYSE ET
 * LA DÉCISION : la situation lue, les situations analysées, le courrier
 * attend, cacheté, à l'entrée de « Décider » — un geste pour l'ouvrir, et ce
 * qui pèsera sur le trimestre tombe sur une décision déjà réfléchie, qu'il
 * faut reprendre. C'est ce qui fait d'un aléa subi un événement joué.
 *
 * UNE ENVELOPPE N'EST JAMAIS VIDE. Quand rien de notable ne tombe, le facteur
 * passe quand même : un courrier de routine, sans effet sur les comptes,
 * remplace le « aucune carte ce tour » d'autrefois. Le trimestre calme se lit,
 * lui aussi.
 *
 * Une fois lu, on en prend note et le courrier SE CLASSE : il a dit ce qu'il
 * avait à dire, la décision reprend toute la place. Il en reste une ligne, et
 * de quoi le relire. L'appareil retient où en est le joueur (ouvert, classé) :
 * revenir sur la page ne rejoue pas la scène.
 */
export interface PliDuTour {
  code: string;
  /** null = toute la classe ; sinon l'entreprise destinataire. */
  teamId: string | null;
  isMyTeam: boolean;
}

function cleMemoire(gameId: string, round: number): string {
  return `courrier:${gameId}:${round}`;
}

/**
 * La mémoire de l'ouverture : "" jamais ouvert · "1" ouvert · "2" classé.
 * Elle survit à un stockage refusé (voir `memoire-de-lecture`), sans quoi les
 * deux boutons de cette scène ne feraient rien du tout sur un appareil en
 * navigation privée.
 */
const memoire = creerMemoireDeLecture(["1", "2"] as const);

export function CourrierDuTour({
  gameId,
  round,
  periodeLabel,
  plis,
  ouvert: ouvertInitial = false,
  classe: classeInitial = false,
}: {
  gameId: string;
  /** « Trimestre 3 » : le nom du tour tel que la partie le dit. */
  round: number;
  periodeLabel: string;
  /** Les courriers qui tomberont sur cette équipe : marché et adressés à elle. */
  plis: readonly PliDuTour[];
  /** Enveloppe déjà ouverte d'emblée (tests, aperçus). */
  ouvert?: boolean;
  /** Déjà classé et replié d'emblée (tests, aperçus). */
  classe?: boolean;
}) {
  const cle = cleMemoire(gameId, round);
  const retenu = useSyncExternalStore(
    memoire.subscribe,
    () => memoire.lire(cle),
    () => "" as const,
  );
  // Dans le parcours du téléphone, la lettre a son titre : celui du tour, au-dessus, ne dit plus
  // rien une fois le pli ouvert, et il repoussait la lettre sous le pli de l'écran.
  const enParcours = useParcours() !== null;
  const classe = classeInitial || retenu === "2";
  const ouvert = ouvertInitial || classe || retenu === "1";
  const ouvrir = () => memoire.retenir(cle, "1");
  const prendreNote = () => memoire.retenir(cle, "2");
  const relire = () => memoire.retenir(cle, "1");

  // Le courrier de routine : ce que le facteur apporte un trimestre calme.
  const routine = courrierDeRoutine(gameId, round);
  const vide = plis.length === 0;

  // Classé : une ligne, et de quoi relire. Le courrier a dit ce qu'il avait à dire.
  if (classe) {
    return (
      <section
        aria-label={`Le courrier du ${periodeLabel}`}
        className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-slate-400"
      >
        <span>
          <Icone nom="courrier" className="mr-1.5 h-3.5 w-3.5 text-[color:var(--metier,var(--color-slate-300))]" />
          Courrier du {periodeLabel} :{" "}
          <span className="text-slate-300">
            {vide
              ? routine.objet
              : plis.map((p) => courrierParCode.get(p.code)?.objet ?? p.code).join(" · ")}
          </span>
        </span>
        <button
          type="button"
          onClick={relire}
          className="text-slate-100 underline decoration-1 underline-offset-4 hover:decoration-2"
        >
          Relire
        </button>
      </section>
    );
  }

  // UN PLI SEUL se pose à côté de son enveloppe ouverte ; plusieurs plis se
  // posent côte à côte, deux par rangée.
  const seul = vide || plis.length === 1;
  const premier = vide ? routine.code : plis[0]!.code;
  const destinatairePremier = vide
    ? "L'entreprise"
    : plis[0]!.teamId
      ? "Votre entreprise"
      : "Tout le marché";

  return (
    // LOT P3 : LE COURRIER EST POSÉ SUR LE BUREAU, PAS DANS UN PANNEAU. La
    // lettre faisait 440 px au milieu d'un panneau marine de 1 230 px vide : on
    // aurait dit une fenêtre surgissante. Le panneau disparaît ; la lettre,
    // plus large (40 rem), se pose sur le sol du cockpit avec son ombre et une
    // très légère rotation (globals.css, « LE COURRIER POSÉ »), l'enveloppe
    // ouverte à côté sur ordinateur, et « J'ai pris note » à son pied.
    <section aria-label={`Le courrier du ${periodeLabel}`} data-courrier-du-tour="">
      {ouvert && enParcours ? null : (
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        {/* LOT 6E : un titre n'est pas une action. Il était à l'orange, à côté
            du bouton orange qu'il annonce : il prend la teinte du métier. */}
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-[color:var(--metier,var(--color-slate-300))]">
          <Icone nom="courrier" className="h-4 w-4" />
          Le courrier du {periodeLabel}
        </h2>
        <p className="text-xs text-slate-400">
          {ouvert
            ? vide
              ? "Rien qui engage ce trimestre : le courrier se classe, et la décision reprend la main."
              : `${plis.length > 1 ? `${plis.length} courriers pèsent` : "Un courrier pèse"} sur ce tour : décidez en le sachant.`
            : "Le facteur est passé. Ouvrez le courrier avant de décider."}
        </p>
      </div>
      )}

      {!ouvert ? (
        <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          {/* la pile de plis, cachetés, posée en éventail. Décor pur : sur téléphone
              elle prenait 176 px au-dessus du seul bouton qui compte, et elle
              disparaît. */}
          <div className="relative h-40 w-60 shrink-0 max-sm:hidden" aria-hidden>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="absolute inset-0"
                style={{ transform: `rotate(${(i - 1) * 3}deg) translateY(${i * -4}px)` }}
              >
                <Enveloppe className="h-full" destinataire="L'entreprise" liasse={null} />
              </span>
            ))}
          </div>
          <button
            type="button"
            onClick={ouvrir}
            // L'action de l'étape : tant qu'elle est là, le bouton qui fait
            // avancer passe en filet (un seul aplat orange par écran).
            data-action-de-l-etape=""
            className={bouton({ taille: "l" })}
          >
            Ouvrir le courrier
          </button>
        </div>
      ) : (
        <div
          aria-live="polite"
          className={`${enParcours ? "" : "mt-5"} ${
            seul && !enParcours
              ? "lg:grid lg:grid-cols-[13rem_minmax(0,40rem)] lg:items-start lg:justify-center lg:gap-12"
              : ""
          }`}
        >
          {/* L'ENVELOPPE OUVERTE, à côté de la lettre, sur ordinateur et pour
              un pli seul : deux plis côte à côte prennent déjà la largeur. */}
          {seul && !enParcours ? (
            <EnveloppeOuverte
              code={premier}
              destinataire={destinatairePremier}
              className="max-lg:hidden"
            />
          ) : null}
          <div className={seul ? "mx-auto w-full sm:max-w-[40rem]" : ""}>
            {/*
              Le courrier de routine s'ouvre comme les autres : c'est le geste
              qui compte, et il doit être le même que le trimestre soit calme
              ou non.
            */}
            <div className={grilleDeCourriers(vide ? 1 : plis.length, "posee")}>
              {vide ? (
                <CourrierRecommande code={routine.code} destinataire="L'entreprise" />
              ) : (
                plis.map((p, i) => (
                  <CourrierRecommande
                    key={`${p.code}-${p.teamId ?? "market"}`}
                    code={p.code}
                    delayMs={i * 500}
                    destinataire={p.teamId ? "Votre entreprise" : "Tout le marché"}
                    surligne={p.isMyTeam}
                  />
                ))
              )}
            </div>
            {/* AU PIED DE LA LETTRE, comme un geste de lecture : lu, le
                courrier se classe et la décision reprend la place. Un bouton
                secondaire : l'orange de l'écran reste à l'action qui engage. */}
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={prendreNote}
                className={`${bouton({ variante: "secondaire", taille: "m" })} pointer-coarse:min-h-11 max-sm:w-full`}
              >
                J&apos;ai pris note
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
