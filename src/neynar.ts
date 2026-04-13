/** Check Neynar user score for spam gating. */

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY ?? "";
const MIN_SCORE = 0.9;

export async function hasMinNeynarScore(fid: number): Promise<boolean> {
  if (!NEYNAR_API_KEY) return true; // skip gate if no key configured

  try {
    const res = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk?fids=${fid}`,
      {
        headers: {
          "x-api-key": NEYNAR_API_KEY,
          "x-neynar-experimental": "true",
        },
      },
    );
    if (!res.ok) return true; // fail open if API errors

    const data = (await res.json()) as {
      users: Array<{
        experimental?: { neynar_user_score?: number };
      }>;
    };

    const user = data.users[0];
    const score = user?.experimental?.neynar_user_score ?? 0;
    return score >= MIN_SCORE;
  } catch {
    return true; // fail open
  }
}
