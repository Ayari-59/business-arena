import Link from "next/link";
import { LIEN_A_L_ENCRE } from "@/components/bouton";
import type { EtatDeLOffre } from "@/services/acces.service";
import {
  lienDuDevis,
  LIBELLE_DU_DEVIS,
  nomDOffre,
  OFFRES,
  parametrageEnClair,
} from "@/config/tarifs";

/** « 31 août 2027 », au fuseau de Paris. */
const date = (d: Date) =>
  d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });

/**
 * L'ÉTAT DE L'OFFRE, EN TÊTE DE L'ESPACE ENSEIGNANT (audit PAR-13).
 *
 * L'enseignant ne voyait ni sa licence ni ce qu'elle ouvre, et l'échéance arrivait sans
 * prévenir (PAR-02). Une ligne le dit : l'offre de l'arène, son paramétrage et sa date de
 * fin (« [offre] Classe · NOVA · niveau 3 Pilotage · jusqu'au … » ; « [offre] Programme ·
 * L'ESCALE · tous niveaux · 4 enseignants sur 5 » ; « [offre] Campus · <établissement> »),
 * « + Épisodes manager » si la licence les inclut, ou la
 * Découverte gratuite et le chemin vers un devis. Un mois avant la fin, la ligne le dit
 * et propose le devis de renouvellement ; une fois la fin passée, elle dit ce qui est
 * fermé et ce qui continue. Les noms viennent de config/tarifs.ts, ou de la copie des
 * conditions de l'offre vendue (/admin, migration 0041). Une licence OFFERTE ou D'ESSAI le
 * dit, avec sa fin : « [offre] Campus offerte jusqu'au 31 août 2027 ».
 */
export function LigneDEtatDeLOffre({
  etat,
  niveauMaxGratuit,
}: {
  etat: EtatDeLOffre;
  /** Le dernier niveau ouvert sans licence (réglage de /admin). */
  niveauMaxGratuit: number;
}) {
  const { arene, episodes, etablissement } = etat;
  const plusEpisodes = episodes?.licence ? (
    <span data-etat-episodes="">
      {" "}
      · + {OFFRES.episodes.nom}
      {episodes.licence.nature === "offerte" ? " offerts" : episodes.licence.nature === "essai" ? " à l'essai" : ""}{" "}
      jusqu&apos;au {date(episodes.licence.endsAt)}
    </span>
  ) : null;
  const devis = (offre: Parameters<typeof lienDuDevis>[0], libelle = LIBELLE_DU_DEVIS) => (
    <Link href={lienDuDevis(offre)} prefetch={false} className={LIEN_A_L_ENCRE}>
      {libelle}
    </Link>
  );

  // Le nom de l'offre VENDUE (copié sur la licence au moment de la vente), sinon celui du palier.
  const nomVendu = arene?.licence?.nomDeLOffre ? `Offre ${arene.licence.nomDeLOffre}` : arene ? nomDOffre(arene.offre) : "";
  // Une licence offerte ou d'essai le dit, avec sa date de fin : « [offre] Campus offerte jusqu'au … ».
  const nature = arene?.licence?.nature ?? "vendue";
  const gratuite =
    arene?.licence && nature !== "vendue" ? (
      <span data-etat-nature={nature}>
        {" "}
        {nature === "offerte" ? "offerte" : "à l'essai"} jusqu&apos;au {date(arene.licence.endsAt)}
      </span>
    ) : null;

  let contenu: React.ReactNode;
  let etatCode: string;
  if (arene && (arene.state === "active" || arene.state === "bientot_expiree")) {
    etatCode = arene.state;
    const enClair = parametrageEnClair(arene.parametrage);
    const plafond = arene.parametrage.maxEnseignants;
    contenu = (
      <>
        <strong className="font-semibold text-slate-100">{nomVendu}</strong>
        {gratuite}
        {arene.offre === "campus" && etablissement ? ` · ${etablissement}` : ""}
        {enClair ? <span data-etat-parametrage=""> · {enClair}</span> : null}
        {plafond !== null && plafond > 1 ? (
          <span data-etat-enseignants="">
            {" "}
            · {arene.teachers} enseignant{arene.teachers > 1 ? "s" : ""} sur {plafond}
          </span>
        ) : null}
        {gratuite ? null : <> · jusqu&apos;au {date(arene.licence!.endsAt)}</>}
        {plusEpisodes}
        {arene.state === "bientot_expiree" && arene.daysLeft !== null ? (
          <>
            {" "}
            · se termine dans {arene.daysLeft} jour{arene.daysLeft > 1 ? "s" : ""} : sans
            renouvellement, la création de parties de classe et de concours fermera.{" "}
            {devis(arene.offre, "Demander un devis de renouvellement")}
          </>
        ) : null}
        {arene.blocking ? <> · {arene.blocking}</> : null}
      </>
    );
  } else if (arene && arene.state === "a_venir") {
    etatCode = "a_venir";
    contenu = (
      <>
        <strong className="font-semibold text-slate-100">{nomVendu}</strong>
        {gratuite} · à partir du {date(arene.licence!.startsAt)}. D&apos;ici là, l&apos;arène se joue en solo,
        niveaux 1 à {niveauMaxGratuit}.{plusEpisodes}
      </>
    );
  } else if (arene && arene.state === "expiree") {
    etatCode = "expiree";
    contenu = (
      <>
        <strong className="font-semibold text-slate-100">{nomVendu}</strong>
        {nature === "offerte" ? " offerte" : nature === "essai" ? " à l'essai" : ""} · terminée le {date(arene.licence!.endsAt)}. La création de parties de classe et de
        concours est fermée ; les parties en cours se poursuivent.{plusEpisodes}{" "}
        {devis(arene.offre, "Demander un devis de renouvellement")}
      </>
    );
  } else {
    etatCode = "decouverte";
    contenu = (
      <>
        <strong className="font-semibold text-slate-100">{OFFRES.decouverte.nom}</strong> : solo,
        niveaux 1 à {niveauMaxGratuit}
        {plusEpisodes} · {devis("classe")}
      </>
    );
  }
  return (
    <p
      data-etat-offre={etatCode}
      className="rounded-lg encadre-neutre px-3 py-2.5 text-sm leading-relaxed text-slate-300 sm:px-4"
    >
      {contenu}
    </p>
  );
}
