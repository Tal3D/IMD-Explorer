
import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { TopNavigationBar } from '@/components/layout/top-navigation-bar';

export const metadata: Metadata = {
  title: 'IMD Explorer',
  description: 'Information about Inherited Metabolic Disorders and their associated recruitment plans.',
  icons: {
    icon: '/dna.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`antialiased bg-background text-foreground`}>
        <TopNavigationBar />
        {children}
        <footer className="py-6 text-center text-sm text-muted-foreground border-t mt-12">
          <p>IMD Explorer</p>
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
