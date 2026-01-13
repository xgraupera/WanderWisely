"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const markerIcon = new L.Icon({
  iconUrl: "/icon_blue.png",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
});

interface Trip {
  id: number;
  latitude?: number;
  longitude?: number;
  name?: string;
  startDate?: string;
  endDate?: string;
  travelers?: number;
  durationDays?:number;
}

interface MapProps {
  trips: Trip[];
}

function SetMapCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: false });
  }, [center, map]);
  return null;
}

export default function MapComponent({ trips }: MapProps) {
  const router = useRouter();
  const defaultCenter: [number, number] = [20, 0];

  // 🔥 A partir de aquí ya puedes usar validTrips sin problema
  const validTrips = trips.filter(
    (t) => t.latitude != null && t.longitude != null
  );

  const center: [number, number] =
    validTrips.length > 0
      ? [
          validTrips.reduce((sum, t) => sum + (t.latitude || 0), 0) /
            validTrips.length,
          validTrips.reduce((sum, t) => sum + (t.longitude || 0), 0) /
            validTrips.length,
        ]
      : defaultCenter;

  return (
    <MapContainer
      center={center}
      zoom={2}
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={false}
    >
      <SetMapCenter center={center} />

      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {validTrips.map((trip) => (
        <Marker
          key={trip.id}
          position={[trip.latitude!, trip.longitude!]}
          icon={markerIcon}
        >
          <Popup>
            <div className="text-xs text-gray-700 leading-tight">
    {/* 🔗 Título clickable */}
    <button
      onClick={() => router.push(`/dashboard/trip/${trip.id}/main`)}
      className="font-semibold text-[#001e42] hover:underline block text-left mb-0.5"
    >
      {trip.name || "Unknown"}
    </button>

    {/* Fechas + viajeros */}
    <div className="flex justify-between items-start">
      <div>
        
        <p>
        {new Date(trip.startDate!).toLocaleDateString()} →{" "}
        {new Date(trip.endDate!).toLocaleDateString()}
      </p>
      <p>
        {trip.durationDays!} Days | Travelers: {trip.travelers}
      </p>
      </div>
    </div>
  </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
