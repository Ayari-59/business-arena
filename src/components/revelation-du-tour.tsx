import type { ReactNode } from "react";
import { formatEuro } from "@/lib/format";
import { Signe } from "@/components/signe";
import { verdictDuTour } from "@/pedagogy/verdict-du-tour";
import type { IncomeStatement } from "@/engine/types";
import { PastilleDeRang } from "@/components/rang";

/**
 * LA RÉVÉLATION DU RÉSULTAT.
 *
 * Ce qui se passait. L'enseignant clôt le tour ; trente écrans se rafraîchissent
 * seuls, et chacun affiche… un accordéon de plus, déplié sur quatre cartes
 * d'indicateurs. Le moment le plus attendu de la séance — « alors, ça a
 * marché ? » — arrivait sans qu'aucun pixel ne le dise. L'élève devait lire
 * quatre cartes pour répondre à une question qui tient en un chiffre et une
 * phrase.
 *
 * Ce qu'on met à la place. Trois temps, dans cet ordre, et rien d'autre :
 * le tour qu'on révèle, le résultat en grand, puis OÙ il s'est joué. Les
 * tableaux restent où ils sont, en dessous : ils ne sont pas le verdict, ils en
 * sont la preuve.
 *
 * LA MISE EN SCÈNE EST RÉSERVÉE AU TOUR QU'ON VIENT D'OUVRIR. Sur un tour
 * ancien qu'on rouvre pour réviser, le même bloc s'affiche d'un coup : une
 * animation qui rejoue à chaque dépliement devient un tic. C'est `nouveau` qui
 * fait la différence, et le relais est en CSS — trois enfants, trois délais,
 * aucun script.
 *
 * QUI A DEMANDÉ MOINS D'ANIMATION VOIT LE BLOC ENTIER, IMMOBILE. L'animation ne
 * fait apparaître que ce qui est déjà dans la page : un lecteur d'écran lit les
 * trois temps sans attendre, et une capture d'écran les trouve tous.
 */
export function RevelationDuTour({
  periode,
  tour,
  precedent,
  nouveau,
  rang,
  ipg,
  explication = null,
}: {
  /**
   * CE QUI A FAIT LE RÉSULTAT (lot 6E) : la cascade du compte et les causes
   * chiffrées, sous la phrase du verdict. Fournie par l'appelant, qui a le
   * tour entier ; ce bloc ne lit que le compte de résultat.
   */
  explication?: ReactNode;
  /** Le tour révélé, nommé dans la langue du scénario (« Trimestre 3 »). */
  periode: string;
  tour: IncomeStatement;
  /** Le tour d'avant, pour dire d'où vient l'écart. Null au premier tour clos. */
  precedent: IncomeStatement | null;
  /** Vrai pour le tour le plus récent : lui seul se met en scène. */
  nouveau: boolean;
  /** La place de l'équipe, quand le classement est révélé. */
  rang?: { place: number; sur: number };
  /**
   * L'indice de performance globale, quand il est montré. Il vivait seul sur une ligne au-dessus
   * des onglets (« Tour 1 simulé · #1/3 · IPG 65 ») : une ligne de plus avant le premier chiffre,
   * qui redisait le classement d'ici. Il se lit maintenant avec lui.
   */
  ipg?: number | null;
}) {
  const v = verdictDuTour(tour, precedent);
  const positif = v.resultat >= 0;

  return (
    <section
      // « Le verdict de trimestre 3 » ne se dit pas : la virgule fait la liaison
      // à la voix mieux qu'un article qu'il faudrait accorder au scénario.
      aria-label={`Verdict, ${periode.toLowerCase()}`}
      className={`carte overflow-hidden px-4 py-3 sm:px-5 sm:py-4 ${
        // Le signe du tour en filet plein à gauche ; le reste du cadre reste
        // le filet gris des cartes (il était rose ou vert d'eau, dilué).
        positif ? "border-l-2 border-l-emerald-400" : "border-l-2 border-l-red-400"
      } ${nouveau ? "revelation" : ""}`}
    >
      {/* L'OR DIT LE VERDICT : ce que le marché a tranché (globals.css, « LE PODIUM »). */}
      <p className="texte-or text-xs font-semibold uppercase tracking-surtitre">
        {periode} · le verdict
      </p>

      {/*
        LE CHIFFRE, SEUL SUR SA LIGNE. Il est le seul de la page à cette taille :
        c'est ce qui fait qu'on le trouve sans le chercher. `tabular-nums` pour
        qu'il ne danse pas d'un tour à l'autre.
      */}
      <div className="mt-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p
          className={`font-display text-3xl leading-none tabular-nums ${
            positif ? "text-emerald-300" : "text-rose-300"
          }`}
        >
          {positif ? "+" : "−"}
          {formatEuro(Math.abs(v.resultat))}
        </p>
        <p className="text-sm text-slate-400">de {positif ? "bénéfice" : "perte"}</p>
        {/*
          L'ÉCART EST SON PROPRE ÉLÉMENT, sans séparateur. Collé à « de
          bénéfice » par un point médian, celui-ci restait pendu en fin de ligne
          dès que la ligne se repliait — ce qu'elle fait à 360 px. Seul le
          MONTANT est insécable : la phrase qui le suit peut se replier, lui
          jamais.
        */}
        {v.ecart !== null && Math.abs(v.ecart) >= 1 ? (
          <p className={`text-sm ${v.ecart > 0 ? "text-emerald-300" : "text-rose-300"}`}>
            <span className="whitespace-nowrap">
              <Signe sens={v.ecart > 0 ? "gain" : "cout"} className="mr-1 inline-block" />
              {formatEuro(Math.abs(v.ecart))}
            </span>{" "}
            par rapport au tour précédent
          </p>
        ) : null}
      </div>

      <p className="mt-2 max-w-prose text-sm leading-relaxed text-slate-200 sm:mt-3">
        {v.phrase}
      </p>

      {explication ? <div className="mt-3 sm:mt-4">{explication}</div> : null}

      {rang || (ipg !== null && ipg !== undefined) ? (
        <p className="mt-1.5 text-xs text-slate-400">
          {rang ? (
            <>
              <PastilleDeRang rang={rang.place} moi doublon className="mr-1.5 align-middle" />
              Au classement révélé : {rang.place}
              <sup>{rang.place === 1 ? "re" : "e"}</sup> sur {rang.sur} équipes
            </>
          ) : null}
          {rang && ipg !== null && ipg !== undefined ? " · " : null}
          {ipg !== null && ipg !== undefined ? <>IPG {ipg.toFixed(0)}</> : null}
          .
        </p>
      ) : null}
    </section>
  );
}
