import { avecTypographie } from "@/components/typographie";
import type { Metadata } from "next";
import { PageDesLycees } from "@/components/page-des-lycees";
import { offresPourLesLycees } from "@/config/lycees";
import { lireLeCatalogue } from "@/services/catalogue.service";
import { LES_OFFRES_DE_L_ARENE } from "@/config/tarifs";

/**
 * LES LYCÉES : LE BAC STMG ET LES BTS (décision du propriétaire, 11 novembre 2026 ; audit de l'offre du
 * même jour, P1-3). La page du proviseur, au menu sous « Lycées », juste après « Enseignants ». Elle lit
 * le catalogue (/admin/offres) pour dire ce que chaque offre ouvre comme le code l'applique
 * (config/lycees.ts), et le rendu vit dans components/page-des-lycees.tsx. Régénérée toutes les cinq
 * minutes, comme /tarifs et /entreprises/offre.
 */
export const revalidate = 300;

export const metadata: Metadata = {
  alternates: { canonical: "/lycees" },
  title: "Lycées : bac STMG et BTS",
  description: `Pour le proviseur : le cours et l'arène pour le bac STMG et les BTS, ${LES_OFFRES_DE_L_ARENE}, un chapitre libre par diplôme, le bon de commande, le mandat administratif et Chorus Pro, aucun compte élève.`,
};

async function LyceesPage() {
  return <PageDesLycees offres={offresPourLesLycees(await lireLeCatalogue())} />;
}

export default avecTypographie(LyceesPage);
