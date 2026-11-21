import { RESOURCES } from "@/safety/resources";
import { SafeContent } from "@/components/safe";

export const dynamic = "force-static";
export const metadata = { title: "Help now" };

/** Public, no sign-in, cached offline by the service worker. The resource list is rendered into the HTML itself. */
export default function SafePage() {
  const res = RESOURCES.map(({ verified: _v, scope: _s, ...r }) => r);
  return (
    <main className="mx-auto max-w-lg p-5 safe-t">
      <a href="/talk" className="mb-4 inline-block text-sm text-brown-soft">← Back</a>
      <SafeContent resources={res} initial />
    </main>
  );
}
