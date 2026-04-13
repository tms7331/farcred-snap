/** Resolve FID → Farcaster username via the fnames registry. */

const cache = new Map<number, string>();

export async function getUsername(fid: number): Promise<string> {
  const cached = cache.get(fid);
  if (cached) return cached;

  try {
    const res = await fetch(`https://fnames.farcaster.xyz/transfers?fid=${fid}`);
    if (!res.ok) return `fid:${fid}`;
    const data = (await res.json()) as { transfers: Array<{ username: string }> };
    const last = data.transfers[data.transfers.length - 1];
    if (last?.username) {
      cache.set(fid, last.username);
      return last.username;
    }
  } catch {
    // fall through
  }
  return `fid:${fid}`;
}
