import type { Metadata } from "next";
import { ManuelImprimable } from "@/components/manuel-imprimable";

export const dynamic = "force-dynamic";

/**
 * LE MANUEL, OUVERT.
 *
 * Il était derrière la connexion : pour savoir comment l'application évalue,
 * il fallait d'abord créer un compte. C'est l'ordre inverse de celui qu'on
 * attend d'un outil pédagogique — on lit ce qu'il fait, puis on décide de
 * l'essayer. Un enseignant qui hésite, un corps d'inspection à qui on l'a
 * présenté, un collègue à qui on envoie un lien : aucun n'a de raison de
 * s'inscrire pour lire un document.
 *
 * Rien n'y est confidentiel : les listes, les poids de l'IPG, les barèmes
 * d'indices et les politiques de rattrapage sont lus des registres de
 * l'application, et ce sont précisément les règles que l'on doit pouvoir
 * examiner avant d'exposer une classe à l'outil.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/manuel" },
  title: "Manuel de l'enseignant",
  description:
    "Ce que fait Business Arena, comment il évalue et quoi faire quand une séance déraille : les six dimensions de l'indice IPG et leurs poids, les niveaux de difficulté et les leviers ouverts à chacun, les modes de questionnement, le barème des indices, la politique des situations manquées.",
};

export default async function ManuelPublicPage() {
  return <ManuelImprimable retour={{ href: "/enseignants", label: "Pour les enseignants" }} />;
}
