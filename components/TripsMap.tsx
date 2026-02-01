"use client";

import { useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";

/* ---------- GOOGLE MAPS LOADER SINGLETON ---------- */
let googleMapsPromise: Promise<void> | null = null;

function loadGoogleMaps() {
  if (!googleMapsPromise) {
    googleMapsPromise = new Promise((resolve) => {
      if (typeof window !== "undefined" && (window as any).google?.maps) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}`;
      script.async = true;
      script.onload = () => resolve();
      document.head.appendChild(script);
    });
  }
  return googleMapsPromise;
}

/* ---------- COMPONENT ---------- */
export default function TripsMap({ trips }: { trips: any[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  const router = useRouter();
  const params = useParams();
  const locale = (params as any)?.locale ?? "en";

  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

 useEffect(() => {
  const handler = (e: MouseEvent) => {
    if (!mapRef.current?.contains(e.target as Node)) {
      infoWindowRef.current?.close();
    }
  };

  document.addEventListener("click", handler);
  return () => document.removeEventListener("click", handler);
}, []);


  /* 1️⃣ Init map once */
  useEffect(() => {
    
    if (!mapRef.current || mapInstance.current) return;

    loadGoogleMaps().then(() => {
      const mapStyles: google.maps.MapTypeStyle[] = [
        { elementType: "geometry", stylers: [{ color: "#e6d6b3" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#001e42" }] },
        { elementType: "labels.text.stroke", stylers: [{ visibility: "off" }] },
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "road", stylers: [{ color: "#DCC9A3" }] },
        { featureType: "water", stylers: [{ color: "#a0c4ff" }] },
      ];

      mapInstance.current = new google.maps.Map(mapRef.current!, {
        center: { lat: 20, lng: 0 },
        zoom: 2,
        disableDefaultUI: true,
        styles: mapStyles,
      });
    });
  }, []);

  /* 2️⃣ Render markers when trips change */
  useEffect(() => {
    if (!mapInstance.current || !trips?.length) return;

    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const infoWindow = new google.maps.InfoWindow({
  maxWidth: 180,
});

infoWindowRef.current = infoWindow;

    google.maps.event.addListener(mapInstance.current!, "click", () => {
  infoWindow.close();
});

    const bounds = new google.maps.LatLngBounds();

    trips
      .filter(t => t.latitude && t.longitude)
      .forEach(trip => {
        const lat = Number(trip.latitude);
        const lng = Number(trip.longitude);
        if (isNaN(lat) || isNaN(lng)) return;

        bounds.extend({ lat, lng });

        const marker = new google.maps.Marker({
          position: { lat, lng },
          map: mapInstance.current!,
          title: trip.name,
          icon: {
            url: "/icon_blue.png",
            scaledSize: new google.maps.Size(32, 32),
            anchor: new google.maps.Point(16, 32),
          },
        });

        marker.addListener("click", (e: any) => {
  e?.domEvent?.stopPropagation?.();
          const popupHtml = `
<div style="
  font-family:Inter,sans-serif;
  line-height:1.2;
  padding:12px 14px; /* 👈 AQUÍ */
  background:white;
  border-radius:14px;
  min-width:180px;
">

  <h3 id="trip-${trip.id}" style="
    font-weight:600;
    margin:0 0 3px 0;
    color:#001e42;
    cursor:pointer;
    font-size:14px;
  ">
    ${trip.name}
  </h3>

  <div style="font-size:12px;color:#555;margin:0">
    ${new Date(trip.startDate).toLocaleDateString()} →
    ${new Date(trip.endDate).toLocaleDateString()}
  </div>

  <div style="font-size:12px;color:#555;margin:0">
    ${trip.durationDays} Days | Travelers: ${trip.travelers}
  </div>
</div>
`;



          infoWindow.setContent(popupHtml);
          infoWindow.open(mapInstance.current!, marker);

          google.maps.event.addListenerOnce(infoWindow, "domready", () => {
            const title = document.getElementById(`trip-${trip.id}`);
            if (title) {
              title.onclick = () =>
                router.push(`/${locale}/dashboard/trip/${trip.id}/main`);
            }
          });
        });

        markersRef.current.push(marker);
      });

    // Auto zoom if multiple trips
    if (trips.length > 1) {
  mapInstance.current.fitBounds(bounds);
  mapInstance.current.setZoom(Math.min(mapInstance.current.getZoom()!, 4));
}
  }, [trips, router, locale]);

  return (
    <div className="relative w-full h-[400px] rounded-xl shadow overflow-hidden">
      {/* Map */}
      <div ref={mapRef} className="w-full h-full" />

      {/* Google Maps popup style fixes (INLINE, no global.css) */}
      <style>{`









/* InfoWindow outer container */
.gm-style .gm-style-iw {
  padding: 0 !important;
  margin: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}



/* Content wrapper (THIS causes top spacing) */
.gm-style .gm-style-iw-d {
  overflow: visible !important;
  padding: 0 !important;
}

/* Remove weird Google blur overlay */
.gm-style .gm-style-iw-c::after {
  display: none !important;
}


.gm-ui-hover-effect {
  display: none !important;
}




`}</style>

    </div>
  );
}
