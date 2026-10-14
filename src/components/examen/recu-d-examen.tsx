import Link from "next/link";
import { phraseDuRecu } from "@/config/examen/textes";
import { COLONNE_DE_PAGE, EnTeteDePage } from "@/components/en-tete-de-page";
import { bouton } from "@/components/bouton";
import type { CopieDuCandidat } from "@/services/examen.service";

/**
 * LE REÇU D'UNE COPIE D'EXAMEN, à la fin de la partie (l'arène le montre à la place du
 * bilan) : « Examen remis le … à … ». Pas de note, pas de classement, pas de « mérite ou
 * chance » tant que l'enseignant n'a pas publié ; ensuite, le lien vers la note et le
 * relevé, et le bilan de la partie redevient lisible.
 */
export function RecuDExamen({ copie, gameId }: { copie: CopieDuCandidat; gameId: string }) {
  const remis = copie.candidat.remisLe ?? new Date();
  return (
    <main id="main" className="pb-16" data-recu-d-examen="">
      <EnTeteDePage
        surtitre={copie.examen.nom}
        titre={phraseDuRecu(remis)}
        chapeau={
          copie.publie
            ? "Les résultats sont publiés : votre note et votre relevé par compétence vous attendent."
            : `Votre copie est enregistrée au nom de ${copie.candidat.nom}. Votre note paraîtra quand votre enseignant publiera les résultats.`
        }
      />
      <div className={`${COLONNE_DE_PAGE} flex flex-wrap gap-3`}>
        <Link href={`/examen/${copie.examen.code}/resultat`} className={bouton({ taille: "l" })}>
          {copie.publie ? "Voir ma note et mon relevé" : "Garder mon reçu"}
        </Link>
        {copie.publie ? (
          <Link href={`/arena/${gameId}?bilan=1`} className={bouton({ variante: "secondaire", taille: "l" })}>
            Revoir le bilan de la partie
          </Link>
        ) : null}
        {copie.autreTentative ? (
          <Link href={`/examen/${copie.examen.code}`} className={bouton({ variante: "secondaire", taille: "l" })}>
            Une nouvelle tentative
          </Link>
        ) : null}
      </div>
    </main>
  );
}
