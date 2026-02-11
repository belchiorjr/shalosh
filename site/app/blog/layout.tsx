export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="py-10">
      <div className="internal-page max-w-4xl space-y-6">{children}</div>
    </section>
  );
}
