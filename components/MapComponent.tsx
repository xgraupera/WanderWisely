"use client";

import { useEffect, useRef, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import "leaflet.markercluster";
import { useRouter, useParams } from "next/navigation";

/* 🟦 Icono personalizado */
const markerIcon = L.icon({
  iconUrl: "/icon_blue.png",
  iconSize: [30, 30],
  iconAnchor: [15, 30],
  popupAnchor: [0, -28],
});

export default function MapComponent({ trips }: { trips: any[] }) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const router = useRouter();
  const params = useParams();
  const locale = (params as any)?.locale || "en";

  const validTrips = useMemo(
    () => trips.filter(t => t.latitude != null && t.longitude != null),
    [trips]
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    /* 🗺️ Crear mapa */
    const map = L.map(containerRef.current, {
      center: [20, 0],
      zoom: 2,
      scrollWheelZoom: false,
    });

    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap",
    }).addTo(map);

    /* 🔗 Clusters */
    const cluster = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
    });

    /* 📍 Marcadores */
    validTrips.forEach(trip => {
      const marker = L.marker(
        [trip.latitude, trip.longitude],
        { icon: markerIcon }
      );

      const popupHtml = `
        <div style="min-width:200px">
          <h3
            id="trip-${trip.id}"
            style="
              font-weight:600;
              margin-bottom:4px;
              color:#001e42;
              cursor:pointer;
            "
          >
            ${trip.name}
          </h3 >
          <p  className="flex justify-between items-start text-sm text-gray-600 style="font-size:12px;color:#555">
            ${new Date(trip.startDate).toLocaleDateString()} →
            ${new Date(trip.endDate).toLocaleDateString()}
          </p>
          <p className="flex justify-between items-start text-sm text-gray-600 style="font-size:12px;color:#555">
  ${trip.durationDays} Days | Travelers: ${trip.travelers}
</p>
        </div>
        <style>
          .leaflet-popup-close-button {
            color: red !important;
          }
        </style>
      `;

      marker.bindPopup(popupHtml);

      marker.on("popupopen", () => {
        const title = document.getElementById(`trip-${trip.id}`);
        if (title) {
          title.onclick = () => {
            router.push(`/${locale}/dashboard/trip/${trip.id}/main`);
          };
        }
      });

      cluster.addLayer(marker);
    });

    map.addLayer(cluster);

   
    /* 🎯 Ajustar vista SOLO si hay 2 o más trips */
     {/*
    if (validTrips.length > 1) {
      const bounds = cluster.getBounds();
      map.fitBounds(bounds, { padding: [50, 50] });
    }
*/}

    /* 🔳 Fullscreen (estilo Leaflet, arriba derecha) */
    const fullscreenControl = L.Control.extend({
      options: { position: "topright" },
      onAdd: () => {
        const container = L.DomUtil.create(
          "div",
          "leaflet-bar leaflet-control"
        );

        const btn = L.DomUtil.create("a", "", container);
        btn.innerHTML = "⛶";
        btn.href = "#";
        btn.title = "Fullscreen";
        btn.style.fontSize = "18px";
        btn.style.textAlign = "center";

        L.DomEvent.on(btn, "click", e => {
          L.DomEvent.stop(e);
          containerRef.current?.requestFullscreen();
        });

        return container;
      },
    });

    map.addControl(new fullscreenControl());

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [validTrips, router, locale]);

  return <div ref={containerRef} className="w-full h-full" />;
}
