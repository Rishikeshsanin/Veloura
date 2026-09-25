import type { ImgHTMLAttributes } from 'react'

const DEFAULT_WIDTHS = [240, 320, 480, 640, 768, 960, 1200, 1600]

function unsplashVariant(src: string, width: number) {
  try {
    const url = new URL(src)
    if (url.hostname !== 'images.unsplash.com') return src
    url.searchParams.set('w', String(width))
    url.searchParams.set('auto', 'format')
    return url.toString()
  } catch {
    return src
  }
}

export default function ResponsiveImage({
  src,
  sizes,
  widths = DEFAULT_WIDTHS,
  srcSet,
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & { src: string; widths?: number[] }) {
  const optimized = src.includes('images.unsplash.com/')
  if (!optimized) return <img {...props} src={src} srcSet={srcSet} sizes={sizes} />

  const uniqueWidths = Array.from(new Set(widths)).filter((width) => width > 0).sort((a, b) => a - b)
  const fallbackWidth = uniqueWidths.at(-1) ?? 1200

  return <img
    {...props}
    src={unsplashVariant(src, fallbackWidth)}
    srcSet={uniqueWidths.map((width) => `${unsplashVariant(src, width)} ${width}w`).join(', ')}
    sizes={sizes ?? '100vw'}
  />
}
