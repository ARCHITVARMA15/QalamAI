"use client"
import Button from "@/components/ui/Button";

 function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <div className="text-lg font-semibold">KalamAI</div>

        <ul className="hidden gap-8 text-sm text-gray-600 md:flex">
          <li className="cursor-pointer hover:text-black">Features</li>
          <li className="cursor-pointer hover:text-black">How it works</li>
          <li className="cursor-pointer hover:text-black">Testimonials</li>
          <li className="cursor-pointer hover:text-black">Pricing</li>
        </ul>

        <Button>Start writing free</Button>
      </nav>
    </header>
  );
}

export default Navbar;