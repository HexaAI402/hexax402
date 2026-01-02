// app/layout.tsx
import "./globals.css";

export const metadata = {
  title: "HEXA // Infra Console",
  description: "Infra-grade console UI",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="fx">
        <div className="content-layer">{children}</div>
      </body>
    </html>
  );
}
