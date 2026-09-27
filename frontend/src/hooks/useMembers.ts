import { useCallback, useEffect, useState } from 'react';
import { api } from '../utils/api';
import { Member } from '../types/building';

/** Loads a building's members; `reload` refetches after an admin change. */
export function useMembers(idToken: string, buildingId: string) {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  useEffect(() => {
    let cancelled = false;
    api
      .listMembers(idToken, buildingId)
      .then((list) => {
        if (!cancelled) setMembers(list);
      })
      .catch(() => {
        if (!cancelled) setMembers([]);
      });
    return () => {
      cancelled = true;
    };
  }, [idToken, buildingId, reloadKey]);
  const reload = useCallback(() => setReloadKey((k) => k + 1), []);
  return { members, reload };
}
