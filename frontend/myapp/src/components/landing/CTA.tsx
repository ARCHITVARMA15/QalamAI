import Button from "@/components/ui/Button";

 function CTA() {
  return (
    <section className="bg-emerald-900 py-32 text-center text-white">
      <h2 className="text-4xl font-serif font-semibold">
        Your best writing is still ahead of you.
      </h2>

      <p className="mx-auto mt-4 max-w-xl text-emerald-100">
        Join writers using KalamAI to write with confidence,
        clarity, and control.
      </p>

      <div className="mt-10 flex justify-center">
        <Button>Start writing free</Button>
      </div>
    </section>
  );
}

export default CTA;