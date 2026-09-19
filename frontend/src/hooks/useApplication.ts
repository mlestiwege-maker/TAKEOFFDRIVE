import { useCallback, useEffect, useState } from "react";
import * as applicationService from "../services/applicationService";
import type { ApplicationDetail } from "../types/application";

export function useApplication() {
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await applicationService.getMyApplication();
      setApplication(data);
    } catch {
      setError("Failed to load application.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { application, isLoading, error, refetch };
}
