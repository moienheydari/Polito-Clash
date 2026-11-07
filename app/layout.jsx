import "./globals.css";

export const metadata = { title: "StudyDuel AI", description: "Live, AI-powered study competitions" };

export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
