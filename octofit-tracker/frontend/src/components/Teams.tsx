import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type TeamRecord = {
  name: string;
  mascot?: string;
  members?: string[];
};

export default function Teams() {
  const [teams, setTeams] = useState<TeamRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getJson<{ teams: TeamRecord[] }>('/api/teams')
      .then((response) => {
        if (!isMounted) return;
        setTeams(response.teams ?? []);
        setError(null);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Unable to load teams');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <CapabilityCard title="Teams" description="Manage teams and members." isLoading={isLoading} error={error} emptyText="No teams">
      {teams.length > 0 ? (
        <ul className="list-group list-group-flush">
          {teams.map((team, index) => (
            <li key={`${team.name}-${index}`} className="list-group-item">
              <div><strong>{team.name}</strong> {team.mascot ? `(${team.mascot})` : ''}</div>
              <small>{(team.members ?? []).join(', ') || 'No members yet'}</small>
            </li>
          ))}
        </ul>
      ) : null}
    </CapabilityCard>
  );
}
