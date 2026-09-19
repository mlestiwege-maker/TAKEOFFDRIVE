import { useCallback, useEffect, useState } from "react";
import * as driverService from "../services/driverService";
import type { DriverProfile } from "../types/driver";

export function useDriver() {
  const [profile, setProfile] = useState<DriverProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await driverService.getMyProfile();
      setProfile(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { profile, isLoading, refetch };
}
