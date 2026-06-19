import './globals.css'

export const metadata = {
  title: 'Analizador de Apuestas',
  description: 'App para analizar y extraer datos de apuestas deportivas',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <body className="bg-white text-black dark:bg-gray-900 dark:text-white">
        {children}
      </body>
    </html>
  )
}