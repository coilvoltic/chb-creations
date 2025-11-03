import type { Metadata } from "next";
import { Inter, Outfit, Frank_Ruhl_Libre } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const frankRuhlLibre = Frank_Ruhl_Libre({
  variable: "--font-frank-ruhl-libre",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "CHB Créations - Accessoires Personnalisés, Henné & Décoration d'Événements",
  description: "Découvrez nos accessoires personnalisés, services de henné et location de décoration pour vos événements à Marseille",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${inter.variable} ${outfit.variable} ${frankRuhlLibre.variable} font-inter antialiased`}
      >
        {children}
        <Footer />
      </body>
    </html>
  );
}
