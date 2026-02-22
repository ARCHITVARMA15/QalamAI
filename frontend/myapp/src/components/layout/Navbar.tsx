"use client"
import Link from "next/link";
import Button from "@/components/ui/Button";

function Navbar() {
  return (
    // <header className="sticky top-0 z-50 bg-white/80 backdrop-blur">
    <header className="sticky top-0 z-50 bg-[#f6f4ef]/80 backdrop-blur">

      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* <img src="/images/Logo.png" alt="KalamAI" style={{ height: "36px", objectFit: "contain" }} /> */}

        <Link href="/">
          <img
            src="/images/Logo.png"
            alt="KalamAI"
            style={{ height: "100px", width: "auto", objectFit: "contain" }}
          />
        </Link>

        <ul className="hidden gap-8 text-sm text-gray-600 md:flex">
          <li><Link href="/projects" className="cursor-pointer hover:text-black transition-colors">Projects</Link></li>
          <li><Link href="/dashboard" className="cursor-pointer hover:text-black transition-colors">Dashboard</Link></li>
        </ul>


        {/* <ul className="hidden md:flex gap-10 text-base font-medium text-gray-700">
          <li>
            <Link
              href="/projects"
              className="cursor-pointer transition-colors hover:text-gray-900"
            >
              Projects
            </Link>
          </li>

          <li>
            <Link
              href="/dashboard"
              className="cursor-pointer transition-colors hover:text-gray-900"
            >
              Dashboard
            </Link>
          </li>
        </ul> */}

        <Link href="/projects">
          <Button>Start writing free</Button>
        </Link>
      </nav>
    </header>
  );
}

export default Navbar;