export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="internal-page max-w-6xl space-y-6">{children}</div>
    </section>
  );
}
