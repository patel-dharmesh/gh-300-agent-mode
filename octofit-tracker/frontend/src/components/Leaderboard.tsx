import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName: string;
  totalPoints: number;
  rank: number;
};

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getJson<{ leaderboard: LeaderboardEntry[] }>('/api/leaderboard')
      .then((response) => {
        if (!isMounted) return;
        setEntries(response.leaderboard ?? []);
        setError(null);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Unable to load leaderboard');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals." isLoading={isLoading} error={error} emptyText="No leaderboard">
      {entries.length > 0 ? (
        <ol className="mb-0 ps-3">
          {entries.map((entry) => (
            <li key={`${entry.teamName}-${entry.rank}`}>
              {entry.teamName} — {entry.totalPoints} pts (#{entry.rank})
            </li>
          ))}
        </ol>
      ) : null}
    </CapabilityCard>
  );
}
