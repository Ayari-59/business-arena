import type { CSSProperties } from "react";
import { formatDecimal } from "@/lib/format";
import { Icone } from "@/components/icone";
import { PastilleDeRang, classeLigneDeRang } from "@/components/rang";
import { PodiumDesEquipes } from "@/components/podium";

/**
 * « LE MARCHÉ A RÉPONDU », DEVANT LA CLASSE.
 *
 * C'est le même rituel qu'en solo (`verdict-du-marche.tsx`, lot 3A) et la même
 * grammaire — trois temps, sur le marine, des chiffres très grands, un seul
 * aplat orange à l'écran —, mais le sujet change : en solo, LE chiffre est le
 * résultat du joueur ; en classe, c'est le CLASSEMENT, et on le dévoile de la
 * dernière équipe à la première, comme on remonte un palmarès.
 *
 *   1. « Tour 3 · le marché a répondu » ;
 *   2. les équipes, une par une, de la dernière à la première : son rang, son
 *      nom, son résultat net du tour signé en vert ou rouge francs, sa
 *      trésorerie ;
 *   3. le podium — or, argent, bronze, les mêmes marches qu'à la clôture d'une
 *      partie solo (`components/podium.tsx`) — avec l'IPG.
 *
 * LA LISTE SE REMPLIT DU BAS VERS LE HAUT, et son ordre dans le document reste
 * celui du classement : la dernière place s'écrit en bas, c'est elle qui
 * apparaît d'abord, et la place de chaque équipe est réservée dès le premier
 * instant — rien ne saute, rien ne pousse les lignes du dessous, ce qui serait
 * illisible sur un mur de huit mètres.
 *
 * TOUT EST LÀ À L'ÉTAT FINAL, SANS ANIMATION. Les temps ne font qu'apparaître
 * ce que le serveur a déjà rendu : un lecteur d'écran lit la liste entière
 * sans attendre, une capture la trouve complète, qui a demandé moins
 * d'animation voit l'écran d'un coup, et un onglet qui perd le focus ou une
 * page rechargée montrent l'état final (voir `vue-de-projection.tsx`).
 *
 * Aucun chiffre n'est calculé ici : ils arrivent formatés du serveur, qui les
 * tient des résultats réellement simulés du tour.
 */

/** Le premier temps commence après ce délai, en secondes. */
export const DEBUT_S = 0.4;
/** Le pas entre deux équipes, au plus. */
export const PAS_MAX_S = 0.5;
/** Ce que le dévoilement des équipes ne dépasse pas, hors podium. */
export const DEVOILEMENT_MAX_S = 2.8;
/** L'entrée d'un temps (ou d'une ligne) : la même partout. */
export const ENTREE_S = 0.4;
/**
 * LE RYTHME, BORNÉ PAR CONSTRUCTION. Quatre équipes se dévoilent à un demi-pas
 * chacune ; douze se dévoilent plus vite, pour que le dévoilement tienne dans
 * le même temps. La durée totale ne dépasse donc jamais
 * `DEBUT + DEVOILEMENT_MAX + PAS_MAX + ENTREE`.
 */
export function rythmeDeRevelation(equipes: number): {
  /** Le pas entre deux équipes, en secondes. */
  pas: number;
  /** Quand le podium entre, en secondes. */
  podium: number;
  /** La révélation entière, en secondes. */
  duree: number;
} {
  const n = Math.max(1, Math.round(equipes));
  const pas = n <= 1 ? PAS_MAX_S : Math.min(PAS_MAX_S, DEVOILEMENT_MAX_S / (n - 1));
  const podium = DEBUT_S + n * pas;
  return { pas, podium, duree: podium + ENTREE_S };
}

/** Une équipe au classement du tour, telle que le serveur l'a formatée. */
export interface LigneDeRevelation {
  rang: number;
  nom: string;
  /** Le résultat net du tour, signe compris : « +12 000 € », « −294 € ». */
  resultat: string | null;
  /** Gain ou perte : le vert ou le rouge francs ; null, on ne colore pas. */
  sens: "gain" | "perte" | null;
  /** La trésorerie de fin de tour, déjà formatée. */
  tresorerie: string | null;
  /** En découvert : la trésorerie passe au rouge (c'est une alerte). */
  decouvert: boolean;
  ipg: number | null;
  defaillant: boolean;
}

const TEINTE = { gain: "text-emerald-300", perte: "text-red-300" } as const;

/**
 * Le classement du tour, dévoilé. `animer` faux, tout est à sa place d'un
 * coup : c'est l'état final, celui qu'on recharge et qu'on capture.
 */
export function RevelationDuMarche({
  surtitre,
  titre,
  lignes,
  animer = false,
  mention = null,
}: {
  /** En petites capitales : « Verdict du marché ». */
  surtitre: string;
  /** Le premier temps : « Tour 3 · le marché a répondu ». */
  titre: string;
  /** Les équipes, dans l'ordre du classement (la première d'abord). */
  lignes: readonly LigneDeRevelation[];
  animer?: boolean;
  /** Ce que mesure la colonne de droite, sous le titre. */
  mention?: string | null;
}) {
  const n = lignes.length;
  const rythme = rythmeDeRevelation(n);
  const colonnes = lignes.some((l) => l.resultat !== null || l.tresorerie !== null);
  const style = {
    "--revelation-pas": `${rythme.pas}s`,
    "--revelation-fin": `${rythme.podium}s`,
  } as CSSProperties;

  return (
    <div
      data-revelation-du-marche=""
      data-anime={animer ? "" : undefined}
      style={style}
      className={`${animer ? "revelation" : ""} flex w-full max-w-6xl flex-col items-center gap-[clamp(0.35rem,1.05vh,1.5rem)]`}
    >
      {/* PREMIER TEMPS : ce qu'on révèle. */}
      <div data-temps="1">
        <p className="text-[clamp(0.8rem,1.6vw,1.4rem)] font-semibold uppercase tracking-annonce text-slate-400">
          {surtitre}
        </p>
        <h2 className="mt-1 text-[clamp(1.5rem,min(4vw,5.3vh),3.2rem)] font-semibold leading-tight text-slate-50">
          {titre}
        </h2>
        {mention ? (
          <p className="mt-1 text-[clamp(0.9rem,1.8vw,1.5rem)] text-slate-400">{mention}</p>
        ) : null}
      </div>

      {/* DEUXIÈME TEMPS : les équipes, de la dernière à la première. La liste
          est annoncée poliment : le lecteur d'écran n'est pas interrompu. */}
      <div data-temps="2" role="status" aria-live="polite" className="w-full">
        {/* CE QUE CHAQUE COLONNE DIT. Trois montants alignés sans en-tête
            seraient trois nombres : la classe doit savoir lequel est le
            résultat du tour et lequel est la caisse. */}
        {colonnes ? (
          <p className="mb-[clamp(0.2rem,0.6vh,0.5rem)] flex justify-end gap-[clamp(0.5rem,1.5vw,1.5rem)] pr-[clamp(0.8rem,2vw,2rem)] text-[clamp(0.8rem,1.4vw,1.25rem)] font-semibold uppercase tracking-surtitre text-slate-400">
            <span className="w-[clamp(6rem,14vw,13rem)] text-right">Résultat du tour</span>
            <span className="w-[clamp(5.5rem,12vw,11rem)] text-right">Trésorerie</span>
            {lignes.some((l) => l.ipg !== null) ? (
              <span className="w-[clamp(3.5rem,8vw,7rem)] text-right">IPG</span>
            ) : null}
          </p>
        ) : null}
        <ol className="flex w-full flex-col gap-[clamp(0.25rem,0.9vh,0.8rem)]">
          {lignes.map((l, i) => (
            <li
              key={l.nom}
              data-revelation-rang={l.rang}
              // L'ORDRE DU DOCUMENT EST CELUI DU CLASSEMENT ; l'ordre
              // d'APPARITION est l'inverse. `--i` compte depuis la dernière
              // place : c'est le bas de la liste qui s'allume d'abord.
              style={{ "--i": n - 1 - i } as CSSProperties}
              // LA TAILLE EST POSÉE SUR LA LIGNE, pas sur chaque cellule : la
              // pastille du rang se dimensionne en `em` (`pastille-rang-reduite`)
              // et se réduisait à douze pixels quand la ligne restait au corps
              // par défaut — une médaille d'or invisible à huit mètres.
              className={`flex items-center gap-[clamp(0.5rem,1.5vw,1.5rem)] rounded-xl border border-white/5 bg-slate-950 px-[clamp(0.8rem,2vw,2rem)] py-[clamp(0.2rem,0.6vh,0.9rem)] text-[clamp(1.1rem,min(2.6vw,3.6vh),2.2rem)] ${classeLigneDeRang(l.rang)}`}
            >
              <PastilleDeRang rang={l.rang} className="pastille-rang-reduite" />
              {/* Le nom à gauche, contre sa médaille : la vue de projection
                  centre tout son message, et un classement ne se lit pas
                  centré. */}
              <span className="min-w-0 flex-1 truncate text-left font-semibold text-slate-100">
                {l.nom}
              </span>
              {l.defaillant ? (
                <span
                  role="img"
                  aria-label="entreprise défaillante"
                  className="shrink-0 text-red-400"
                >
                  <Icone
                    nom="alerte"
                    className="h-[clamp(0.9rem,2vw,1.6rem)] w-[clamp(0.9rem,2vw,1.6rem)]"
                  />
                </span>
              ) : null}
              {colonnes ? (
                <>
                  {/* LE RÉSULTAT DU TOUR, SIGNÉ, VERT OU ROUGE FRANCS : c'est
                      un résultat, et c'est le chiffre que la classe cherche. */}
                  <span
                    className={`w-[clamp(6rem,14vw,13rem)] shrink-0 text-right font-display text-[clamp(1.1rem,min(2.8vw,3.9vh),2.4rem)] font-bold tabular-nums ${
                      l.sens ? TEINTE[l.sens] : "text-slate-200"
                    }`}
                  >
                    {l.resultat ?? "—"}
                  </span>
                  {/* La trésorerie est un NIVEAU : à l'encre claire, et au
                      rouge seulement en découvert. */}
                  <span
                    className={`w-[clamp(5.5rem,12vw,11rem)] shrink-0 text-right text-[clamp(1rem,min(2.2vw,3.1vh),1.9rem)] tabular-nums ${
                      l.decouvert ? "text-red-300" : "text-slate-300"
                    }`}
                  >
                    {l.tresorerie ?? "—"}
                  </span>
                </>
              ) : null}
              {l.ipg !== null ? (
                <span className="w-[clamp(3.5rem,8vw,7rem)] shrink-0 text-right text-[clamp(1rem,min(2.2vw,3.1vh),1.9rem)] font-bold tabular-nums text-slate-50">
                  {formatDecimal(l.ipg)}
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </div>

      {/* TROISIÈME TEMPS : le podium, en or, argent et bronze. */}
      <div data-temps="3" className="w-full max-w-3xl">
        <PodiumDesEquipes
          taille="projection"
          etiquette="Podium du classement"
          marches={lignes.map((l) => ({
            nom: l.nom,
            rang: l.rang,
            moi: false,
            ipg: l.ipg,
          }))}
        />
      </div>
    </div>
  );
}
