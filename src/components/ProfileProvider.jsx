import { useCallback, useContext, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { DataContext, ProfileContext } from '../context';
import { initialInput } from '../lib/profile';

/** Holds the profile entered in the calculator so the What-If Simulator and SHAP Explorer start from it.
 * `?example=parous|nulliparous` in the URL loads a worked example. */
export default function ProfileProvider({ children }) {
  const { schema } = useContext(DataContext);
  const [params] = useSearchParams();
  const example = params.get('example');
  const [state, setState] = useState(() => ({ example, profile: initialInput(schema, example) }));
  if (example && example !== state.example) setState({ example, profile: initialInput(schema, example) });
  const setProfile = useCallback(
    (update) => setState((s) => ({ ...s, profile: typeof update === 'function' ? update(s.profile) : update })),
    [],
  );
  const value = useMemo(() => ({ profile: state.profile, setProfile }), [state.profile, setProfile]);
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}
