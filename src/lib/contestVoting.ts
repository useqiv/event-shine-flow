export type ContestVotingWindow = {
  start_date?: string | null;
  end_date?: string | null;
};

export type ContestVotingStatus = {
  hasNotStarted: boolean;
  isEnded: boolean;
  isVotingLocked: boolean;
  voteButtonLabel: string;
  shortVoteButtonLabel: string;
};

export function getContestVotingStatus(
  contest: ContestVotingWindow | null | undefined,
  now: Date = new Date()
): ContestVotingStatus {
  if (!contest) {
    return {
      hasNotStarted: false,
      isEnded: false,
      isVotingLocked: true,
      voteButtonLabel: 'Vote Now',
      shortVoteButtonLabel: 'Vote Now',
    };
  }

  const isEnded = contest.end_date ? new Date(contest.end_date) < now : false;
  const hasNotStarted = contest.start_date ? new Date(contest.start_date) > now : false;
  const isVotingLocked = isEnded || hasNotStarted;

  return {
    hasNotStarted,
    isEnded,
    isVotingLocked,
    voteButtonLabel: isEnded
      ? 'Voting Ended'
      : hasNotStarted
        ? 'Voting Not Open Yet'
        : 'Vote Now',
    shortVoteButtonLabel: isEnded ? 'Ended' : hasNotStarted ? 'Not Open' : 'Vote Now',
  };
}

export function getVotingNotOpenMessage(startDate: string): string {
  return `Voting opens on ${new Date(startDate).toLocaleString()}.`;
}
