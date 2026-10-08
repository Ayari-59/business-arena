import type { ReactNode } from "react";
import { formatEuro, ordinal } from "@/lib/format";
import { Icone } from "@/components/icone";
import type { Bilan } from "@/pedagogy/bilan-de-partie";
import { PastilleDeRang, metalDuRang } from "@/components/rang";
import { euroSigne } from "@/components/tableau-de-bord";
import { PodiumDesEquipes, type MarcheDuPodium } from "@/components/podium";

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
 * C'est maintenant une ARDOISE DE CLÔTURE, en tête de la page : « Clôture de
 * l'exercice · 6 tours », le podium des équipes (or, argent, bronze ; l'équipe
 * du joueur marquée du filet orange), le rang du joueur en très grand, le
 * résultat cumulé et la trésorerie finale en 40 px, le tour décisif et le
 * meilleur tour en or (des distinctions), puis « Rejouer » en grand. Le reste
 * du bilan (réussites, record, courbes, lettre, détail des tours) vient
 * ensuite, sur le papier.
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
  children,
}: {
  /** « Victoire ! … » ou « Partie terminée » : la phrase de tête. */
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
  return (
    <div className="space-y-4">
      <section
        aria-labelledby="cloture-titre"
        data-cloture-de-l-exercice=""
        className="ardoise rounded-xl bg-slate-950 px-4 py-6 text-slate-100 sm:px-8 sm:py-8"
      >
        <p className="text-xs font-semibold uppercase tracking-annonce text-slate-400">
          Clôture de l&apos;exercice · {bilan.tours} tours
        </p>
        <h2
          id="cloture-titre"
          className="mt-2 flex items-center gap-3 font-display text-3xl font-semibold leading-tight text-slate-50 sm:text-4xl"
        >
          {/* La victoire est une distinction : la coupe prend l'or, jamais
              l'orange de l'action. */}
          {victoire ? <Icone nom="trophee" className="texte-or h-8 w-8 shrink-0" /> : null}
          {titre}
        </h2>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] lg:items-end">
          {/* LE RANG DU JOUEUR, EN TRÈS GRAND. */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-surtitre text-slate-400">
              Votre place
            </p>
            {place ? (
              <p className="mt-2 flex items-center gap-4 font-display font-semibold leading-none tabular-nums">
                <PastilleDeRang rang={place.rang} moi doublon className="text-5xl" />
                <span className="texte-or text-7xl sm:text-8xl">{ordinal(place.rang)}</span>
                <span className="text-2xl font-medium text-slate-300">
                  sur {place.total}
                  <span className="sr-only">
                    {metal ? `, médaille ${metal === "or" ? "d'or" : `de ${metal}`}` : ""}
                  </span>
                </span>
              </p>
            ) : (
              <p className="mt-2 text-base leading-relaxed text-slate-300">{motDeClassement}</p>
            )}
            {/* Le rang écrit en toutes lettres, comme partout dans l'arène. */}
            {place ? (
              <p className="mt-2 text-sm text-slate-400">
                {ordinal(place.rang)} sur {place.total} au classement final de l&apos;IPG.
              </p>
            ) : null}
          </div>

          {/* LE PODIUM DES ÉQUIPES : l'or au centre, l'argent à gauche, le bronze
              à droite ; l'équipe du joueur porte le filet orange. Les mêmes
              marches qu'au mur de la classe, à l'échelle d'une carte. */}
          <PodiumDesEquipes marches={podium ?? []} etiquette="Podium du classement final" />
        </div>
        {moiHorsPodium ? (
          <p className="mt-3 text-sm text-slate-300">
            Votre équipe, {moiHorsPodium.nom}, finit {ordinal(moiHorsPodium.rang)}.
          </p>
        ) : null}

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
              bilan.beneficiaire ? "vous finissez dans le vert" : "la partie se termine en perte"
            }
            valeur={euroSigne(bilan.resultatCumule)}
            teinte={bilan.beneficiaire ? "text-emerald-300" : "text-red-300"}
          />
          <Chiffre
            titre="Trésorerie finale"
            note="ce qu'il reste en caisse"
            valeur={formatEuro(bilan.tresorerieFinale)}
            teinte={bilan.tresorerieFinale < 0 ? "text-red-300" : "text-slate-50"}
          />
          <Chiffre
            titre="Chiffre d'affaires"
            note="sur toute la partie"
            valeur={formatEuro(bilan.caCumule)}
            teinte="text-slate-50"
          />
        </dl>

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
                <p className="texte-or text-xs font-semibold uppercase tracking-surtitre">
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
              <li className="filet-or rounded-lg border-l-2 bg-slate-900 px-4 py-3">
                <p className="texte-or text-xs font-semibold uppercase tracking-surtitre">
                  Votre meilleur tour
                </p>
                <p className="mt-1 text-base leading-relaxed text-slate-200">
                  <span className="font-semibold text-slate-50">{meilleur.libelle}</span>, avec{" "}
                  <span className="whitespace-nowrap tabular-nums">
                    {euroSigne(meilleur.resultat)}
                  </span>{" "}
                  de résultat.
                </p>
              </li>
            ) : null}
          </ul>
        ) : null}

        {children ? (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">{children}</div>
        ) : null}
      </section>

      {/* LE RESTE DU BILAN, SUR LE PAPIER. */}
      <section aria-label="Le reste du bilan" className="carte space-y-2 px-4 py-4 sm:px-6">
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
                <span className="tabular-nums">{Math.round(record.meilleur)}</span> ; celle-ci finit
                à <span className="tabular-nums">{Math.round(record.monIpg)}</span>.
              </>
            )}
          </p>
        ) : null}
      </section>
    </div>
  );
}

/** Un chiffre de la clôture : son intitulé, sa valeur en 40 px, et ce qu'elle veut dire. */
function Chiffre({
  titre,
  valeur,
  note,
  teinte,
}: {
  titre: string;
  valeur: string;
  note: string;
  teinte: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-semibold uppercase tracking-etiquette text-slate-400">{titre}</dt>
      <dd
        className={`mt-1.5 whitespace-nowrap font-display text-[clamp(2rem,1.6rem_+_1.2vw,2.5rem)] font-semibold leading-none tabular-nums ${teinte}`}
      >
        {valeur}
      </dd>
      <dd className="mt-1.5 text-sm leading-snug text-slate-400">{note}</dd>
    </div>
  );
}
