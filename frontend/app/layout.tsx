import "./globals.css";
import type { Metadata } from "next";

import AppProviders from "./AppProviders";

export const metadata: Metadata = {
  title: "Nova",
    description: "Nova AI Assistant",
    };

    export default function RootLayout({
      children,
      }: {
        children: React.ReactNode;
        }) {
          return (
            <html lang="en">
              <body>
                <AppProviders>
                  {children}
                </AppProviders>
              </body>
            </html>
          );
        }