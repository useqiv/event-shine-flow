export type VoteDisplayMode = 'count' | 'progress_bar';

export function normalizeVoteDisplayMode(value: unknown): VoteDisplayMode {
  return value === 'progress_bar' ? 'progress_bar' : 'count';
}

export function getVoteProgressPercent(voteCount: number, maxVotes: number): number {
  const max = Math.max(maxVotes, 1);
  return Math.min(100, Math.max(0, (voteCount / max) * 100));
}
