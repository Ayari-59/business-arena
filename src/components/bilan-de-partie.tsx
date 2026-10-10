import type { ReactNode } from "react";
import { formatEuro, ordinal } from "@/lib/format";
import { Icone } from "@/components/icone";
import type { Bilan } from "@/pedagogy/bilan-de-partie";
import { metalDuRang } from "@/components/rang";
import { euroSigne } from "@/components/tableau-de-bord";
import { PodiumDesEquipes, type MarcheDuPodium } from "@/components/podium";
import { ChiffreQuiArrive } from "@/components/chiffre-qui-arrive";
import type { NomDePlume } from "@/lib/plumes";
import type { Sector } from "@/config/scenarios/registry";
import { PhotoDuLieu } from "@/components/illustrations/scene-d-entreprise";
import { CourbeDesTours } from "@/components/courbe-des-tours";

/**
 * Une équipe du classement final, pour le podium. Les marches se dessinent
 * dans `components/podium.tsx` : la projection de classe montre les mêmes, à
 * l'échelle d'un mur.
 */
export type { MarcheDuPodium };

/**
 * LA CLÔTURE DE L'EXERCICE.
 *
 * L'écran de fin tenait en trois lignes, puis en une carte blanche : « Partie
 * terminée. » en 20 px, trois chiffres de 18 px, la place en fin de phrase, et
 * aucun classement visible avant 2 000 px. Six tours de travail, souvent deux
 * heures de classe, s'arrêtaient sans rien à regarder ensemble.
 *
 * C'est maintenant une ARDOISE DE CLÔTURE, en tête de la page, mise en
 * scène au lot P2 comme une cérémonie : le lieu de l'entreprise en fond, sous
 * un voile marine ; « Partie terminée. » ; le rang dit UNE fois, en très
 * grand et en or (« 2e sur 3 »), l'IPG en petit ; un vrai podium à trois
 * marches de hauteurs différentes ; le résultat cumulé, la trésorerie finale
 * et le chiffre d'affaires ; la courbe du résultat net, tour par tour ; le
 * tour décisif et le meilleur tour (en or, des distinctions), sauf si tous
 * les tours sont en perte : c'est alors « le tour le plus maîtrisé », sans or.
 * Le reste du bilan (réussites, record) suit sur le papier, puis « Rejouer ».
 *
 * Il ne calcule rien de neuf et ne stocke rien : voir `pedagogy/bilan-de-partie`
 * et le classement que la vue de la partie porte déjà.
 */
export function BilanDePartie({
  titre,
  victoire = false,
  bilan,
  reussites,
  place,
  motDeClassement,
  record = null,
  podium = null,
  lieu = null,
  children,
}: {
  /**
   * La phrase de tête, tirée de `titreDuBilan` (pedagogy/bilan-de-partie) :
   * « Victoire ! … » seulement pour une 1re place qui finit dans le vert,
   * sinon « En tête du classement, mais en perte. » ou « Partie terminée. ».
   */
  titre: string;
  /** La première place : la coupe d'or se dessine devant le titre. */
  victoire?: boolean;
  bilan: Bilan;
  /** Ce que l'équipe a réussi, et la dernière en date pour la nommer. */
  reussites: { acquises: number; total: number; derniere: string | null };
  /** La place finale, quand le classement est ouvert. */
  place: { rang: number; total: number } | null;
  /** Ce qu'on dit quand le classement n'est pas encore révélé. */
  motDeClassement: string | null;
  /**
   * L'IPG de cette partie et le meilleur des parties passées sur le même
   * métier, en solo. Absent en classe, où l'IPG appartient à l'enseignant.
   */
  record?: { monIpg: number; meilleur: number | null } | null;
  /** Le classement final, quand il est ouvert : le podium se dessine. */
  podium?: readonly MarcheDuPodium[] | null;
  /** Le lieu de l'entreprise, en fond de la clôture (lot P2). */
  lieu?: { scenario: string; secteur: Sector } | null;
  /** Les actions : rejouer, changer de métier. */
  children?: ReactNode;
}) {
  const metal = place ? metalDuRang(place.rang) : null;
  const moiHorsPodium = (podium ?? []).find((m) => m.moi && m.rang > 3) ?? null;
  const decisif = bilan.tourDecisif;
  const meilleur =
    bilan.meilleurTour && bilan.meilleurTour.round !== decisif?.tour.round
      ? bilan.meilleurTour
      : null;
  const moi = (podium ?? []).find((m) => m.moi) ?? null;
  const monIpg = moi?.ipg ?? record?.monIpg ?? null;
  return (
    <div className="space-y-4">
      <section
        aria-labelledby="cloture-titre"
        data-cloture-de-l-exercice=""
        className="ardoise relative isolate overflow-hidden rounded-xl bg-slate-950 px-4 py-6 text-slate-100 sm:px-8 sm:py-8"
      >
        {/* LA CLÔTURE EN CÉRÉMONIE (lot P2). L'audit : « c'est la fin de la
            partie, et c'est l'écran le moins mis en scène ». Le lieu de
            l'entreprise revient en fond, sous un voile marine qui fond dans
            l'ardoise (`.voile-de-cloture`) : les chiffres, plus bas, sont
            sur le marine plein. Décoratif, `aria-hidden`. */}
        {lieu ? (
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem] print:hidden">
            <PhotoDuLieu
              scenario={lieu.scenario}
              secteur={lieu.secteur}
              prioritaire
              sizes="(min-width: 1400px) 1352px, 100vw"
              className="entree-du-lieu h-full w-full"
            />
            <div className="voile-de-cloture absolute inset-0" />
          </div>
        ) : null}
        <div data-texte-sur-photo="">
        <p className="surtitre">
          Clôture de l&apos;exercice · {bilan.tours} tours
        </p>
        <h2
          id="cloture-titre"
          className="mt-2 flex items-center gap-3 text-3xl font-bold leading-[1.1] text-slate-50 sm:text-4xl"
        >
          {/* La victoire est une distinction : la coupe prend l'or, jamais
              l'orange de l'action. */}
          {victoire ? <Icone nom="trophee" className="texte-or h-8 w-8 shrink-0" /> : null}
          {titre}
        </h2>

        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:items-end">
          {/* LE RANG, DIT UNE SEULE FOIS, EN TRÈS GRAND (lot P2). Il était
              écrit quatre fois : la pastille « 2 », « 2e sur 3 », « 2e sur 3
              au classement final de l'IPG », la marche du podium. Reste la
              formulation la plus claire, « 2e sur 3 », en or (une
              distinction), et en petit ce qu'elle mesure : le classement
              final à l'IPG, et l'IPG de l'équipe. Le podium, à côté, montre
              les places sans les réécrire. */}
          <div>
            <p className="libelle">Votre place</p>
            {place ? (
              <>
                <p
                  data-rang-final=""
                  className="mt-1 flex items-baseline gap-3 font-display font-semibold leading-none tabular-nums"
                >
                  <span className="texte-or text-8xl sm:text-9xl">{ordinal(place.rang)}</span>
                  <span className="text-3xl font-medium text-slate-200">
                    sur {place.total}
                    <span className="sr-only">
                      {metal ? `, médaille ${metal === "or" ? "d'or" : `de ${metal}`}` : ""}
                    </span>
                  </span>
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  Classement final à l&apos;IPG
                  {monIpg !== null ? ` · IPG ${Math.round(monIpg)}` : ""}
                </p>
              </>
            ) : (
              <p className="mt-2 text-base leading-relaxed text-slate-300">{motDeClassement}</p>
            )}
          </div>

          {/* LE PODIUM : trois vraies marches, l'or au centre et plus haut,
              l'argent à gauche, le bronze à droite ; le nom et l'IPG de
              chaque équipe, « vous » écrit en toutes lettres. */}
          <PodiumDesEquipes marches={podium ?? []} etiquette="Podium du classement final" />
        </div>
        {moiHorsPodium ? (
          // Hors du podium : l'équipe est nommée sous les marches, son rang
          // reste celui qui est écrit en grand, à gauche.
          <p className="mt-3 text-sm text-slate-300 lg:text-right">
            Vous, {moiHorsPodium.nom} : hors du podium
            {moiHorsPodium.ipg !== null ? ` · IPG ${Math.round(moiHorsPodium.ipg)}` : ""}
          </p>
        ) : null}
        </div>

        {/*
          LES CHIFFRES DE TOUTE LA PARTIE, et non ceux du dernier tour : c'est
          la différence entre « comment ça s'est terminé » et « ce que vous avez
          fait ». La trésorerie, elle, est bien celle de la fin : un solde, pas
          un cumul.
        */}
        <dl className="mt-8 grid gap-x-6 gap-y-5 border-t border-white/10 pt-6 sm:grid-cols-3">
          <Chiffre
            titre="Résultat cumulé"
            note={
              bilan.beneficiaire
                ? "vous finissez dans le vert"
                : bilan.resultatCumule < 0
                  ? "la partie se termine en perte"
                  : "la partie finit à l'équilibre"
            }
            valeur={bilan.resultatCumule}
            plume="euro-signe"
            teinte={
              bilan.beneficiaire
                ? "text-emerald-300"
                : bilan.resultatCumule < 0
                  ? "text-red-300"
                  : "text-slate-50"
            }
          />
          <Chiffre
            titre="Trésorerie finale"
            note="ce qu'il reste en caisse"
            valeur={bilan.tresorerieFinale}
            plume="euro"
            teinte={bilan.tresorerieFinale < 0 ? "text-red-300" : "text-slate-50"}
          />
          <Chiffre
            titre="Chiffre d'affaires"
            note="sur toute la partie"
            valeur={bilan.caCumule}
            plume="euro"
            teinte="text-slate-50"
          />
        </dl>

        {/* LA COURBE DES TOURS (lot P2) : le résultat net, tour par tour, sur
            une seule échelle, la ligne du zéro, le dernier tour mis en avant. */}
        {bilan.parTour.length > 1 ? (
          <CourbeDesTours
            tours={bilan.parTour.map((t) => ({ libelle: t.libelle, round: t.round, valeur: t.resultat }))}
            className="mt-8 border-t border-white/10 pt-6"
          />
        ) : null}

        {/*
          LE TOUR DÉCISIF est la question que les équipes se posent en sortant :
          « c'est quand qu'on a redressé ? ». Elle n'a pas la même réponse que
          « quel tour a le plus rapporté », et les deux méritent d'être dites
          quand elles diffèrent. Ce sont des distinctions : l'or.
        */}
        {decisif || meilleur ? (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {decisif ? (
              <li className="filet-or rounded-lg border-l-2 bg-slate-900 px-4 py-3">
                <p className="libelle texte-or font-semibold">
                  Votre tour décisif
                </p>
                <p className="mt-1 text-base leading-relaxed text-slate-200">
                  <span className="font-semibold text-slate-50">{decisif.tour.libelle}</span>, où le
                  résultat a gagné{" "}
                  <span className="whitespace-nowrap tabular-nums">{formatEuro(decisif.gain)}</span>{" "}
                  sur le tour précédent.
                </p>
              </li>
            ) : null}
            {meilleur ? (
              // TOUS LES TOURS EN PERTE : le meilleur est le moins mauvais.
              // L'or est le verdict, pas la consolation : « le plus
              // maîtrisé », sur un filet neutre (lot P2).
              <li
                data-meilleur-tour={bilan.toutEnPerte ? "le-plus-maitrise" : "meilleur"}
                className={`rounded-lg border-l-2 bg-slate-900 px-4 py-3 ${
                  bilan.toutEnPerte ? "border-slate-400" : "filet-or"
                }`}
              >
                <p className={`libelle font-semibold ${bilan.toutEnPerte ? "" : "texte-or"}`}>
                  {bilan.toutEnPerte ? "Votre tour le plus maîtrisé" : "Votre meilleur tour"}
                </p>
                <p className="mt-1 text-base leading-relaxed text-slate-200">
                  <span className="font-semibold text-slate-50">{meilleur.libelle}</span>, avec{" "}
                  <span className="whitespace-nowrap tabular-nums">
                    {euroSigne(meilleur.resultat)}
                  </span>{" "}
                  de résultat{bilan.toutEnPerte ? ", la perte la plus contenue de la partie" : ""}.
                </p>
              </li>
            ) : null}
          </ul>
        ) : null}

      </section>

      {/*
        LE RESTE DU BILAN, SUR LE PAPIER (lot 6D). L'ouverture est un tableau
        des scores et reste du cockpit ; ce qui suit est de la PROSE (ce que
        l'équipe a réussi, ce que dit son record) et se lit comme un document :
        une feuille blanche (`papier`) posée sous l'ardoise de clôture, avec son
        en-tête, son filet et son ombre. Les deux sols se voient ensemble.
        Il portait `carte`, que le cockpit rend marine : le commentaire disait
        « papier », l'écran ne l'était pas.
      */}
      <section
        aria-label="Le reste du bilan"
        data-bilan-lecture=""
        className="papier rounded-xl px-4 py-5 sm:px-8 sm:py-6"
      >
        <header className="filet mb-3 border-b pb-3">
          <p className="surtitre tenue">
            Bilan de la partie
          </p>
          <h3 className="mt-1 text-xl font-semibold leading-tight">
            Ce que la partie vous laisse
          </h3>
        </header>
        <div className="max-w-3xl space-y-2">
          <p className="text-base leading-relaxed text-slate-300">
            <span className="font-semibold texte-or">Vos réussites : </span>
            {reussites.acquises} sur {reussites.total}
            {reussites.derniere ? `, la dernière étant « ${reussites.derniere} »` : null}.
          </p>
          {/*
          LE RECORD NE COMPARE QU'À SOI. C'est la seule comparaison continue que
          le dépôt s'autorise : le classement entre équipes reste la décision de
          l'enseignant.
        */}
          {record ? (
            <p className="text-base leading-relaxed text-slate-300">
              <span
                className={`font-semibold ${
                  record.meilleur !== null && record.monIpg > record.meilleur
                    ? "texte-or"
                    : "text-slate-100"
                }`}
              >
                {record.meilleur === null
                  ? "Votre première sur ce métier : "
                  : record.monIpg > record.meilleur
                    ? "Nouveau record : "
                    : "Votre record tient : "}
              </span>
              {record.meilleur === null ? (
                <>
                  IPG <span className="tabular-nums">{Math.round(record.monIpg)}</span>. C&apos;est
                  votre référence à battre au prochain essai.
                </>
              ) : record.monIpg > record.meilleur ? (
                <>
                  IPG <span className="tabular-nums">{Math.round(record.monIpg)}</span>, contre{" "}
                  <span className="tabular-nums">{Math.round(record.meilleur)}</span> à votre
                  meilleure partie précédente.
                </>
              ) : (
                <>
                  votre meilleure partie sur ce métier reste à IPG{" "}
                  <span className="tabular-nums">{Math.round(record.meilleur)}</span> ; celle-ci
                  finit à <span className="tabular-nums">{Math.round(record.monIpg)}</span>.
                </>
              )}
            </p>
          ) : null}
        </div>
      </section>

      {/* LES ACTIONS, APRÈS LA LECTURE (lot P2) : « Rejouer » est l'action de
          la clôture, le grand bouton plein ; changer de métier est l'autre
          chemin, en filet. Ils viennent après les enseignements : on relit,
          puis on repart. */}
      {children ? (
        <div data-actions-de-cloture="" className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          {children}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Un chiffre de la clôture : son intitulé, sa valeur en 40 px, et ce qu'elle
 * veut dire. Le RÉSULTAT CUMULÉ d'une partie n'est pas un chiffre qu'on
 * consulte, c'est le score final : il monte depuis zéro quand l'écran arrive,
 * et se pose d'un coup quand on revient le relire (voir
 * `components/chiffre-qui-arrive.tsx`).
 */
function Chiffre({
  titre,
  valeur,
  plume,
  note,
  teinte,
}: {
  titre: string;
  valeur: number;
  plume: NomDePlume;
  note: string;
  teinte: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="libelle">{titre}</dt>
      <dd
        className={`mt-1.5 whitespace-nowrap font-display text-[clamp(2rem,1.6rem_+_1.2vw,2.5rem)] font-semibold leading-none tabular-nums ${teinte}`}
      >
        <ChiffreQuiArrive valeur={valeur} plume={plume} depuis={0} memoire={`cloture:${titre}`} />
      </dd>
      <dd className="mt-1.5 text-sm leading-snug text-slate-400">{note}</dd>
    </div>
  );
}
