import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type ActivityRecord = {
  type: string;
  minutes: number;
  points: number;
};

export default function Activities() {
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getJson<{ activities: ActivityRecord[] }>('/api/activities')
      .then((response) => {
        if (!isMounted) return;
        setActivities(response.activities ?? []);
        setError(null);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Unable to load activities');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <CapabilityCard title="Activities" description="Track student activity minutes and points." isLoading={isLoading} error={error} emptyText="No activities">
      {activities.length > 0 ? (
        <ul className="list-group list-group-flush">
          {activities.map((activity, index) => (
            <li key={`${activity.type}-${activity.minutes}-${index}`} className="list-group-item">
              <strong>{activity.type}</strong> · {activity.minutes} min · {activity.points} pts
            </li>
          ))}
        </ul>
      ) : null}
    </CapabilityCard>
  );
}
