import { useAuthStore } from '../../features/auth/authStore';
import { translations } from './translations';
import type { Language } from './translations';

export const useTranslation = () => {
  const { user } = useAuthStore();
  const lang: Language = (user?.language as Language) || 'az';
  
  const t = (key: keyof typeof translations['az']): string => {
    return translations[lang][key] || translations['az'][key] || (key as string);
  };

  return { t, lang };
};
export default useTranslation;
