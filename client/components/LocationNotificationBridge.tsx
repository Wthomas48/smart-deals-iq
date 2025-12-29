import { useEffect } from "react";
import { useLocation } from "@/lib/location-context";
import { useData } from "@/lib/data-context";

export function LocationNotificationBridge() {
  const { registerOnLocationUpdate } = useLocation();
  const { checkNearbyVendorsForNotifications } = useData();

  useEffect(() => {
    registerOnLocationUpdate((lat, lon) => {
      checkNearbyVendorsForNotifications(lat, lon, 0.5);
    });
  }, [registerOnLocationUpdate, checkNearbyVendorsForNotifications]);

  return null;
}
