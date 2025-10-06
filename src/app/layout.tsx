import "./globals.css";
import Providers from "./providers";

export const metadata = {
  title: "co.mos",
  description: "Disfruta más, pide fácil desde tu mesa.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}