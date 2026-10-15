import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title: string;
  focus?: string;
  reason?: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getJson<{ suggestions: WorkoutSuggestion[] }>('/api/workouts/suggestions/mona@example.com')
      .then((response) => {
        if (!isMounted) return;
        setSuggestions(response.suggestions ?? []);
        setError(null);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Unable to load workout suggestions');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." isLoading={isLoading} error={error} emptyText="No workout suggestions">
      {suggestions.length > 0 ? (
        <ul className="list-group list-group-flush">
          {suggestions.map((suggestion, index) => (
            <li key={`${suggestion.title}-${index}`} className="list-group-item">
              <div><strong>{suggestion.title}</strong>{suggestion.focus ? ` · ${suggestion.focus}` : ''}</div>
              {suggestion.reason ? <small>{suggestion.reason}</small> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </CapabilityCard>
  );
}
