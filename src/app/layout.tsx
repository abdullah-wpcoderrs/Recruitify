import type { Metadata } from "next";
import { Anek_Tamil } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/auth-context";
import { Toaster } from "sonner";

const anekTamil = Anek_Tamil({
  variable: "--font-anek-tamil",
  subsets: ["latin", "tamil"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
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
        className={`${anekTamil.variable} antialiased`}
      >
        <AuthProvider>
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
