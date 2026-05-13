import React from "react";

export function Avatar({ src, alt, size = 32 }: { src?: string; alt?: string; size?: number }) {
  const fallback = "/resource/anonymous-user.svg";
  return (
    <img
      src={src || fallback}
      alt={alt || "Avatar"}
      width={size}
      height={size}
      className="rounded-full object-cover border border-token"
      style={{ width: size, height: size }}
      onError={e => { (e.target as HTMLImageElement).src = fallback; }}
    />
  );
}
