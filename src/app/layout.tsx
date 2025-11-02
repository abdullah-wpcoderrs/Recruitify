import type { Metadata } from "next";
import { 
  Anek_Tamil, 
  Inter, 
  Roboto, 
  Open_Sans, 
  Lato, 
  Montserrat, 
  Poppins, 
  Rubik 
} from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "sonner";
import { ErrorBoundaryHandler } from "@/components/error-boundary";

const anekTamil = Anek_Tamil({
  variable: "--font-anek-tamil",
  subsets: ["latin", "tamil"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["300", "400", "700"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const rubik = Rubik({
  variable: "--font-rubik",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Recruitify - Form Creation Tool",
  description: "Create beautiful job application forms with analytics and Google Sheets integration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${anekTamil.variable} ${inter.variable} ${roboto.variable} ${openSans.variable} ${lato.variable} ${montserrat.variable} ${poppins.variable} ${rubik.variable} antialiased`}
      >
        <AuthProvider>
          <ErrorBoundaryHandler />
          {children}
          <Toaster 
            position="top-right" 
            richColors 
            closeButton
            toastOptions={{
              style: {
                borderRadius: '6px',
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
