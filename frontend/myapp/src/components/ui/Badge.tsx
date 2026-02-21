 function Badge({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-100 px-4 py-1 text-xs font-medium text-emerald-700">
      {text}
    </span>
  );
}

export default Badge;