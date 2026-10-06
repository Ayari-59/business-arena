import type { ReactNode } from "react";
import { formatEuro } from "@/lib/format";
import { Icone } from "@/components/icone";
import type { Bilan } from "@/pedagogy/bilan-de-partie";

/**
 * LA FIN DE LA PARTIE, ENFIN RACONTÉE.
 *
 * L'écran de fin tenait en trois lignes : un titre, le résultat cumulé, deux
 * boutons pour rejouer. Six tours de travail, souvent deux heures de classe,
 * s'arrêtaient sans rien à regarder ensemble. Tout ce qu'il fallait était
 * pourtant déjà calculé et déjà à l'écran, mais éparpillé : la trajectoire dans
 * les tuiles, les tours dans l'accordéon, les réussites dans le profil.
 *
 * Ce que le bilan dit, dans cet ordre : ce que l'entreprise a fait (trois
 * chiffres de toute la partie), QUAND elle l'a fait (le tour décisif), ce que
 * l'équipe a réussi, et où elle finit. C'est la page qu'un enseignant projette
 * pour clore la séance, et celle qu'une équipe relit avant de rejouer.
 *
 * Il ne calcule rien de neuf et ne stocke rien : voir `pedagogy/bilan-de-partie`.
 */
export function BilanDePartie({
  titre,
  victoire = false,
  bilan,
  reussites,
  place,
  motDeClassement,
  record = null,
  children,
}: {
  /** « Victoire ! … » ou « Partie terminée » : la phrase de tête. */
  titre: string;
  /**
   * La première place : la coupe se dessine au-dessus du titre. Elle était un
   * emoji collé à la phrase, que chaque téléphone peignait à sa façon.
   */
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
   * métier, en solo. Rejouer ne se comparait à rien : le bouton « Rejouer »
   * existait, mais la deuxième partie ne savait pas qu'il y en avait eu une
   * première. Absent en classe, où l'IPG appartient à l'enseignant.
   */
  record?: { monIpg: number; meilleur: number | null } | null;
  /** Les actions : rejouer, changer de métier. */
  children?: ReactNode;
}) {
  return (
    <section className="carte border-amber-400/30 p-4 sm:p-6">
      {victoire ? (
        <Icone nom="trophee" className="mx-auto mb-2 block h-8 w-8 text-amber-300" />
      ) : null}
      <h2 className="text-center text-xl font-bold text-amber-300">{titre}</h2>
      <p className="mt-1 text-center text-sm text-slate-400">
        {bilan.tours} tours joués, de l&apos;ouverture à la clôture.
      </p>

      {/*
        LES TROIS CHIFFRES DE TOUTE LA PARTIE, et non ceux du dernier tour :
        c'est la différence entre « comment ça s'est terminé » et « ce que vous
        avez fait ». La trésorerie, elle, est bien celle de la fin : c'est un
        solde, pas un cumul, et l'additionner n'aurait aucun sens.
      */}
      <dl className="mx-auto mt-4 grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-3">
        <Chiffre titre="Chiffre d'affaires" note="sur toute la partie" valeur={formatEuro(bilan.caCumule)} />
        <Chiffre
          titre="Résultat cumulé"
          note={bilan.beneficiaire ? "vous finissez dans le vert" : "la partie se termine en perte"}
          valeur={formatEuro(bilan.resultatCumule)}
          teinte={bilan.beneficiaire ? "text-emerald-300" : "text-rose-300"}
        />
        <Chiffre
          titre="Trésorerie finale"
          note="ce qu'il reste en caisse"
          valeur={formatEuro(bilan.tresorerieFinale)}
          teinte={bilan.tresorerieFinale < 0 ? "text-rose-300" : undefined}
        />
      </dl>

      <div className="mx-auto mt-4 max-w-2xl space-y-2 border-t border-white/10 pt-4">
        {/*
          LE TOUR DÉCISIF est la question que les équipes se posent en sortant :
          « c'est quand qu'on a redressé ? ». Elle n'a pas la même réponse que
          « quel tour a le plus rapporté », et les deux méritent d'être dites
          quand elles diffèrent.
        */}
        {bilan.tourDecisif ? (
          <p className="text-base leading-relaxed text-slate-300">
            <span className="font-semibold text-amber-300">Votre tour décisif : </span>
            {bilan.tourDecisif.tour.libelle}, où le résultat a gagné{" "}
            <span className="tabular-nums">{formatEuro(bilan.tourDecisif.gain)}</span> sur le tour
            précédent.
          </p>
        ) : null}
        {bilan.meilleurTour &&
        bilan.meilleurTour.round !== bilan.tourDecisif?.tour.round ? (
          <p className="text-base leading-relaxed text-slate-300">
            <span className="font-semibold text-amber-300">Votre meilleur tour : </span>
            {bilan.meilleurTour.libelle}, avec{" "}
            <span className="tabular-nums">{formatEuro(bilan.meilleurTour.resultat)}</span> de
            résultat.
          </p>
        ) : null}
        <p className="text-base leading-relaxed text-slate-300">
          <span className="font-semibold text-amber-300">Vos réussites : </span>
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
            <span className="font-semibold text-amber-300">
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
        {place ? (
          <p className="text-base leading-relaxed text-slate-300">
            <span className="font-semibold text-amber-300">Votre place : </span>
            {place.rang}
            {place.rang === 1 ? "re" : "e"} sur {place.total}.
          </p>
        ) : motDeClassement ? (
          <p className="text-base leading-relaxed text-slate-400">{motDeClassement}</p>
        ) : null}
      </div>

      {children ? (
        <div className="mt-5 flex flex-wrap justify-center gap-3">{children}</div>
      ) : null}
    </section>
  );
}

/** Un chiffre du bilan : son intitulé, sa valeur, et ce qu'elle veut dire. */
function Chiffre({
  titre,
  valeur,
  note,
  teinte = "text-slate-100",
}: {
  titre: string;
  valeur: string;
  note: string;
  teinte?: string;
}) {
  return (
    <div className="rounded-lg border border-white/5 bg-slate-950/60 px-3 py-2.5 text-center">
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">{titre}</dt>
      <dd className={`mt-1 text-lg font-semibold tabular-nums ${teinte}`}>{valeur}</dd>
      <dd className="mt-0.5 text-sm leading-snug text-slate-400">{note}</dd>
    </div>
  );
}
