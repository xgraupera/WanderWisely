"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname, useParams } from "next/navigation";
import en from "@/i18n/en.json";
import es from "@/i18n/es.json";

interface FooterBarProps {
  tripId?: string;
}

export default function FooterBar({ tripId }: FooterBarProps) {
  const params = useParams();

  const pathname = usePathname();
  const router = useRouter();

  const [trips, setTrips] = useState<any[]>([]);
  const [openTripId, setOpenTripId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

    const segments = pathname?.split("/") || [];
  const locale = segments[1] === "es" ? "es" : "en";
  const t = locale === "es" ? es : en;

  function withLocale(path: string) {
    if (!path.startsWith("/")) path = "/" + path;
    return `/${locale}${path}`;
  }

  const currentLocale = locale;

  function changeLanguage(newLocale: "en" | "es") {
    const segments = pathname.split("/");
    segments[1] = newLocale;
    router.push(segments.join("/"));
  }

  useEffect(() => {
    fetchTrips();
  }, []);

  async function fetchTrips() {
    setLoading(true);
    try {
      const res = await fetch("/api/trips");
      if (res.ok) {
        setTrips(await res.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const tripSections = (id: number) => [
    { href: `/dashboard/trip/${id}/main`, label: t.main },
    { href: `/dashboard/trip/${id}/budget`, label: t.budget },
    
    { href: `/dashboard/trip/${id}/reservations`, label: t.reservations },
  
    { href: `/dashboard/trip/${id}/expenses`, label: t.expenses },
  ];
{/*
  { href: `/dashboard/trip/${id}/itinerary`, label: t.itinerary },
  { href: `/dashboard/trip/${id}/checklist`, label: t.checklist },
*/}
  return (
    <footer className="bg-[#001e42] text-white py-10 px-6 mt-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Branding */}
        <div>
          <p className="text-lg font-semibold">{t.hero.headline}</p>
          <p className="text-sm mt-2">{t.hero.subheadline}</p>
          <p className="text-xs text-gray-400 mt-2 max-w-xs">
            {t.hero.subheadline3}
          </p>
           <div className="mt-4 flex flex-col items-start gap-2">
  <label className="text-sm font-medium block w-full">{t.language}:</label>
  <select
    value={currentLocale}
    onChange={(e) => changeLanguage(e.target.value as "en" | "es")}
    className="bg-[#001e42] border border-gray-600 text-sm text-white rounded px-2 py-1 w-full max-w-[150px]"
  >
    <option value="en">English</option>
    <option value="es">Español</option>
  </select>
</div>
        </div>
        

        {/* Quick links */}
        <div>
          <h3 className="font-semibold text-lg mb-3">{t.about}</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href={withLocale("/about")}>{t.aboutUs}</Link></li>
            <li><Link href={withLocale("/contact")}>{t.contact}</Link></li>
            <li><Link href={withLocale("/privacy")}>{t.privacyPolicy}</Link></li>
            <li><Link href={withLocale("/terms")}>{t.termsConditions}</Link></li>
          </ul>
        </div>

        {/* Trips */}
        <div>
          <h3 className="font-semibold text-lg mb-3">{t.yourTrips}</h3>
          {loading ? (
            <p className="text-gray-300 text-sm">{t.loadingTrips}</p>
          ) : trips.length === 0 ? (
            <p className="text-gray-300 text-sm">{t.noTrips}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {trips.map((trip) => (
                <li key={trip.id}>
                  <button
                    onClick={() =>
                      setOpenTripId(openTripId === trip.id ? null : trip.id)
                    }
                    className="w-full text-left font-medium flex justify-between"
                  >
                    {trip.name}
                    <span>{openTripId === trip.id ? "▲" : "▼"}</span>
                  </button>

                  {openTripId === trip.id && (
                    <ul className="ml-4 mt-2 space-y-1 text-gray-300">
                      {tripSections(trip.id).map((link) => (
                        <li key={link.href}>
                          <Link
                            href={withLocale(link.href)}
                            className={pathname === withLocale(link.href) ? "text-[#DCC9A3]" : ""}
                          >
                            {link.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="mt-8 border-t border-gray-700 pt-4 text-center text-sm text-gray-400">
        <p>Version 1.2</p>
        © {new Date().getFullYear()} Tripilot Ltd
      </div>

      
    </footer>
  );
}
