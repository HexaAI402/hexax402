export type WalletStatus = "DISCONNECTED" | "CONNECTED" | "UNAVAILABLE";

export function getSolProvider(): any | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  if (w?.solana?.isPhantom) return w.solana;
  if (w?.solflare) return w.solflare;
  if (w?.solana) return w.solana;
  return null;
}

export function shorten(addr: string) {
  if (!addr) return "";
  if (addr.length <= 10) return addr;
  return `${addr.slice(0, 4)}${addr.slice(-4)}`;
}