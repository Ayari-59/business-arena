import type { ReactNode } from "react";
import { Bande } from "@/components/bande";
import { HaloDePage } from "@/components/halo-de-page";

/**
 * L'OUVERTURE MARINE D'UNE PAGE VITRINE (proposition forte 5, audit P2-21).
 *
 * L'accueil s'ouvrait sur le marine, et les trois pages qui parlent à un
 * public précis (enseignants, écoles, entreprises) sur un héros clair centré :
 * le visiteur qui cliquait « Pour les enseignants » quittait la maison pour
 * une page d'un autre site. Elles prennent désormais la même ouverture que
 * l'accueil : le surtitre en étiquette penchée, un grand titre à l'encre du
 * marine, le chapeau, les deux portes, et l'anneau qui sort du coin.
 *
 * LE CHIFFRE-PREUVE. Chacune porte un chiffre, en très grand, et ce chiffre
 * est LU dans un registre (ateliers, épisodes, métiers) : jamais écrit à la
 * main, il ne devient pas faux le jour où le registre change. C'est une
 * information, pas une action ni un verdict : il est à l'encre du marine, ni
 * orange ni or.
 *
 * C'EST UNE BANDE DU REGISTRE (config/bandes.ts), qui porte le titre de la
 * page : l'administrateur peut la remettre au clair, et tout s'y relit
 * puisque aucune couleur n'est écrite ici, seulement les paliers de l'échelle
 * que le contre-jour retourne.
 */
export function BandeOuverture({
  id,
  contraste,
  surtitre,
  titre,
  chapeau,
  preuve,
  actions,
  children,
}: {
  /** L'identifiant de la bande au registre : « enseignants.accroche ». */
  id: string;
  contraste: boolean;
  surtitre: ReactNode;
  titre: ReactNode;
  chapeau: ReactNode;
  /** Le chiffre-preuve, lu dans un registre, et ce qu'il compte. */
  preuve: { valeur: string; libelle: string };
  /** Les boutons : un plein, un à filet. */
  actions: ReactNode;
  /** Ce qui suit les boutons, sous les deux colonnes. */
  children?: ReactNode;
}) {
  const cadre = "relative mx-auto max-w-6xl px-6 pb-12 pt-10 sm:pt-14 lg:pb-16";
  return (
    <Bande
      id={id}
      contraste={contraste}
      exterieur="relative overflow-hidden text-slate-100"
      interieur={cadre}
      interieurContraste={cadre}
      avant={<HaloDePage />}
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_15rem] lg:items-end lg:gap-14">
        <div className="min-w-0">
          <p>
            <span className="surtitre-arene">{surtitre}</span>
          </p>
          <h1 className="mt-6 max-w-4xl text-[clamp(2rem,4.2vw,3.25rem)] font-bold leading-[1.06] text-slate-50">
            {titre}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-300">{chapeau}</p>
          <div data-cta-principal className="mt-8 flex flex-wrap items-center gap-4">
            {actions}
          </div>
        </div>
        {/* Le chiffre-preuve : sous le texte sur téléphone, à droite au-delà. */}
        <p
          data-chiffre-preuve
          className="border-t-2 border-white/15 pt-4 lg:border-l-2 lg:border-t-0 lg:pb-2 lg:pl-8 lg:pt-0"
        >
          <span className="chiffre-preuve block text-7xl text-slate-50 sm:text-8xl">
            {preuve.valeur}
          </span>
          <span className="mt-2 block text-base font-semibold leading-snug text-slate-200">
            {preuve.libelle}
          </span>
        </p>
      </div>
      {/* Ce qui suit les boutons passe sous les deux colonnes : le chiffre
          reste en face du titre, au lieu de descendre avec une liste. */}
      {children}
    </Bande>
  );
}

/** Le bouton à filet d'une ouverture : l'autre porte, sans aplat. */
export const PORTE_SECONDAIRE =
  "inline-flex items-center justify-center rounded-md border-2 border-white/40 px-5 py-2.5 text-base font-semibold text-slate-50 transition hover:border-white/70 hover:bg-white/5";
