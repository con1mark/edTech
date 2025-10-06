import "./globals.css";

export const metadata = {
  title: "Coderszonee",
  description: "EdTech platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 antialiased">
        {children}
      </body>
    </html>
  );
}
