import { useEffect } from 'react';
import { useDemoStore } from '../store/useDemoStore';
import { migrationStageAt } from '../lib/evaluation/engine';
import { ALL_SCENARIOS } from '../data/scenarios';

/** Advances simulated migrations for any scenario based on elapsed time, so refresh never loses progress. */
export function useMigrationTicker() {
  useEffect(() => {
    const t = setInterval(() => {
      const st = useDemoStore.getState();
      for (const id of ALL_SCENARIOS) {
        const s = st.scenarios[id];
        if (s.migration.stage !== 'not_requested' && s.migration.stage !== 'ready' && migrationStageAt(s, Date.now()) === 'ready') st.completeMigration(id);
      }
    }, 500);
    return () => clearInterval(t);
  }, []);
}
