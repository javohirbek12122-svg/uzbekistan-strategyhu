import Image from 'next/image';
import { publicEnv } from '@/lib/env';

function allowedHosts(): string[] {
  const hosts = ['images.unsplash.com'];
  try {
    if (publicEnv.supabaseUrl) hosts.push(new URL(publicEnv.supabaseUrl).hostname);
  } catch {
    // Malformed URL: fall back to the static allow-list.
  }
  return hosts;
}

function isOptimizable(src: string): boolean {
  try {
    const url = new URL(src);
    return url.protocol === 'https:' && allowedHosts().includes(url.hostname);
  } catch {
    return false;
  }
}

/**
 * Image whose URL is entered by the owner in the console. Hosts outside
 * `next.config.ts#remotePatterns` would make `next/image` throw and take the
 * page down, so they are rendered unoptimized instead.
 */
export function RemoteImage({
  src,
  alt,
  fill,
  sizes,
  className,
  priority,
  width,
  height,
}: {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  className?: string;
  priority?: boolean;
  width?: number;
  height?: number;
}) {
  if (isOptimizable(src)) {
    return fill ? (
      <Image src={src} alt={alt} fill sizes={sizes} className={className} priority={priority} />
    ) : (
      <Image
        src={src}
        alt={alt}
        width={width ?? 200}
        height={height ?? 200}
        sizes={sizes}
        className={className}
        priority={priority}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      className={fill ? `absolute inset-0 h-full w-full ${className ?? ''}` : className}
    />
  );
}
