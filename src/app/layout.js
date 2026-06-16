import './globals.css';

export const metadata = {
  title: 'PropCRM — Enterprise Real Estate CRM',
  description: 'Production-grade CRM platform for real estate brokers and agencies. Manage leads, properties, pipeline, and communications.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FAF8F5',
  colorScheme: 'light',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="light" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
