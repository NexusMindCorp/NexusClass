/**
 * Helper para construir caminhos de assets considerando o base path do Vite
 * Usado para GitHub Pages onde a aplicação fica em /ProjetoPilotoShadcn/
 */
export const getAssetPath = (path: string): string => {
  const basePath = __BASE_URL__
  // Remove leading slash se houver para evitar duplicação
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${basePath}${cleanPath}`
}

/**
 * Exemplos de uso:
 * getAssetPath('Logos/Logo.png') => '/ProjetoPilotoShadcn/Logos/Logo.png'
 * getAssetPath('sons/tigreso.mp3') => '/ProjetoPilotoShadcn/sons/tigreso.mp3'
 * getAssetPath('/images/foto.jpg') => '/ProjetoPilotoShadcn/images/foto.jpg'
 */
