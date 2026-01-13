"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { useParams } from "next/navigation";

interface NavBarProps {
  tripId?: string;
}

export default function NavBar({ tripId }: NavBarProps) {
  const pathname = usePathname();
  const params = useParams();
  const locale = params?.locale || "en";
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  function withLocale(path: string) {
    if (!path.startsWith("/")) path = "/" + path;
    return `/${locale}${path}`;
  }

  const tripLinks = tripId
    ? [
        { href: withLocale(`/dashboard/trip/${tripId}/main`), label: "Main" },
        { href: withLocale(`/dashboard/trip/${tripId}/budget`), label: "Budget" },
        { href: withLocale(`/dashboard/trip/${tripId}/itinerary`), label: "Itinerary" },
        { href: withLocale(`/dashboard/trip/${tripId}/reservations`), label: "Reservations" },
        { href: withLocale(`/dashboard/trip/${tripId}/checklist`), label: "Checklist" },
        { href: withLocale(`/dashboard/trip/${tripId}/expenses`), label: "Expenses" },
      ]
    : [];

  const dropdownItems = [
    ...tripLinks,
    ...(tripLinks.length > 0 ? [{ divider: true }] : []),
    { href: withLocale("/profile"), label: "Profile" },
    { action: () => signOut({ callbackUrl: "/" }), label: "Logout" },
  ];

  const DropdownItem = ({ item }: any) => {
    if (item.divider)
      return <div className="border-t border-gray-200 my-1"></div>;

    if (item.href)
      return (
        <Link
          href={item.href}
          onClick={() => {
            setProfileOpen(false);
            setMenuOpen(false);
          }}
          className="px-4 py-2 hover:bg-[#DCC9A3] hover:text-[#001e42] rounded transition"
        >
          {item.label}
        </Link>
      );

    if (item.action)
      return (
        <button
          onClick={() => {
            item.action();
            setProfileOpen(false);
            setMenuOpen(false);
          }}
          className="px-4 py-2 text-left hover:bg-[#DCC9A3] hover:text-[#001e42] rounded transition"
        >
          {item.label}
        </button>
      );

    return null;
  };

  return (
    <nav className="bg-[#001e42] text-white px-6 py-3 flex justify-between items-center fixed top-0 left-0 w-full z-50 shadow">
      {/* Logo */}
      <Link
        href={withLocale("/dashboard")}
        className="flex items-center gap-2 text-lg font-bold hover:text-[#DCC9A3] transition"
      >
        <img src="/icon.png" alt="Tripilot logo" className="w-6 h-6" />
        <span>Tripilot</span>
      </Link>

      {/* Desktop */}
      <div className="hidden md:flex items-center gap-4 ml-auto relative">
        {tripLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`hover:text-[#DCC9A3] transition ${
              pathname === link.href ? "font-bold underline" : ""
            }`}
          >
            {link.label}
          </Link>
        ))}

        {session?.user?.email && (
          <div className="relative">
            <button
              className="w-8 h-8 rounded-full bg-[#DCC9A3] text-[#001e42] font-bold flex items-center justify-center hover:brightness-90 transition"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              {session.user.email[0].toUpperCase()}
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-[#001e42] text-white rounded-lg shadow-lg flex flex-col z-50">
                {dropdownItems.map((item, idx) => (
                  <DropdownItem key={idx} item={item} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Mobile */}
      <div className="md:hidden ml-auto flex items-center gap-2 relative">
        {session?.user?.email && (
          <div className="relative">
            <button
              className="w-8 h-8 rounded-full bg-[#DCC9A3] text-[#001e42] font-bold flex items-center justify-center hover:brightness-90 transition"
              onClick={() => setProfileOpen(!profileOpen)}
            >
              {session.user.email[0].toUpperCase()}
            </button>

            {profileOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-[#001e42] text-white rounded-lg shadow-lg flex flex-col z-50">
                {dropdownItems.map((item, idx) => (
                  <DropdownItem key={idx} item={item} />
                ))}
              </div>
            )}
          </div>
        )}

        <button onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {menuOpen && tripLinks.length > 0 && (
        <div className="absolute top-14 left-0 w-full bg-[#001e42] text-white p-4 flex flex-col gap-2 md:hidden z-50">
          {tripLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className={`block py-2 px-3 rounded hover:bg-[#DCC9A3] transition ${
                pathname === link.href ? "font-bold underline" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
