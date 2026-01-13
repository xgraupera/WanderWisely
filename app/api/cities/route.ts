export const runtime = "nodejs";

import { NextResponse } from "next/server";


export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q");

  if (!query || query.length < 2) {
    return NextResponse.json({ data: [] });
  }

  try {
    // 🌍 Llamada a OpenStreetMap (Nominatim)
const res = await fetch(
  `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query
  )}&limit=5&addressdetails=1`,
  {
    headers: {
      "User-Agent": "Tripilot/1.0 (+https://tripilot.app)"
    }
  }
);

    if (!res.ok) {
      return NextResponse.json(
        { error: "Failed to fetch cities" },
        { status: 500 }
      );
    }

    const data = await res.json();

    // 🧭 Normalizamos la respuesta
    const formatted = data.map((city: any) => {
  const name =
    city.address?.city ||
    city.address?.town ||
    city.address?.village ||
    city.display_name.split(",")[0] ||
    query;

  const country =
    city.address?.country ||
    city.display_name.split(",").pop()?.trim() ||
    "";

  return {
    name: `${name}, ${country}`,
    country,
    latitude: parseFloat(city.lat),
    longitude: parseFloat(city.lon),
  };
});


    return NextResponse.json({ data: formatted });
  } catch (err) {
    console.error("City API error:", err);
    return NextResponse.json(
      { error: "City search failed" },
      { status: 500 }
    );
  }
}
