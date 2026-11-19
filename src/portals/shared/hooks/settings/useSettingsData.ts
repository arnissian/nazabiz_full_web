
import { useDevises } from '../devises/useDevises';
import { useLanguages } from '../languages/useLanguages';

export const useSettingsData = () => {
  const { devises, loading: devisesLoading } = useDevises(
    { per_page: 100, is_active: true },
    undefined,
    true,
    'tenant',
  );
  const { languages, loading: languagesLoading } = useLanguages({ per_page: 100, is_active: true });

  return {
    devises,
    languages,
    loading: devisesLoading || languagesLoading,
  };
};
