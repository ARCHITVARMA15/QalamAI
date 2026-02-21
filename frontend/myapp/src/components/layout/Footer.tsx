 function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-400">
      <div className="mx-auto max-w-7xl px-6 py-16 grid gap-12 md:grid-cols-4">
        <div>
          <h3 className="text-white font-semibold">KalamAI</h3>
          <p className="mt-4 text-sm">
            AI-powered writing assistant built for clarity,
            consistency, and craft.
          </p>
        </div>

        <div>
          <h4 className="text-white text-sm mb-3">Product</h4>
          <ul className="space-y-2 text-sm">
            <li>Features</li>
            <li>How it works</li>
            <li>Pricing</li>
          </ul>
        </div>

        <div>
          <h4 className="text-white text-sm mb-3">Writers</h4>
          <ul className="space-y-2 text-sm">
            <li>Students</li>
            <li>Researchers</li>
            <li>Creators</li>
          </ul>
        </div>

        <div>
          <h4 className="text-white text-sm mb-3">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li>Privacy Policy</li>
            <li>Terms of Service</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-800 py-6 text-center text-xs">
        © 2026 KalamAI. All rights reserved.
      </div>
    </footer>
  );
}
export default Footer;