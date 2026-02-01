"use client";
import { useEffect, useState } from "react";

export function useForecastAccess(tripId: number) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (!tripId) return;

    fetch(`/api/trip-access?tripId=${tripId}`)
      .then((r) => r.json())
      .then((d) => {
        setAllowed(d.premium || d.tripPaid);
      });
  }, [tripId]);

  return allowed;
}
