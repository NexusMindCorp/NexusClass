
export const getAssetPath = (path: string): string => {
  const basePath = __BASE_URL__
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${basePath}${cleanPath}`
}


