import type { Metadata } from "next";
import { Inter, Outfit, Frank_Ruhl_Libre, Cinzel } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import { CartProvider } from "@/contexts/CartContext";

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

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://chb-creations.com'),
  title: {
    default: "CHB Créations - Accessoires Personnalisés, Henné & Décoration d'Événements à Marseille",
    template: '%s | CHB Créations',
  },
  description: "Découvrez nos accessoires personnalisés, services de henné et location de décoration pour vos événements à Marseille.",
  openGraph: {
    siteName: 'CHB Créations',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${inter.variable} ${outfit.variable} ${frankRuhlLibre.variable} ${cinzel.variable} font-inter antialiased`}
      >
        <CartProvider>
          {children}
          <Footer />
        </CartProvider>
      </body>
    </html>
  );
}
