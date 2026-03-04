import { useEffect, useRef } from "react";

import { useAuth } from "../contexts/AuthContext";
import { useTranslation } from "../contexts/LanguageContext";

export default function LanguageSync() {
  const { user } = useAuth();
  const { setLanguage } = useTranslation();
  const syncedUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (user && user.id) {
      if (syncedUserIdRef.current !== user.id) {
        syncedUserIdRef.current = user.id;
        if (user.language) {
          setLanguage(user.language, true);
        }
      }
    } else {
      syncedUserIdRef.current = null;
    }
  }, [user, setLanguage]);

  return null;
}
