import Navbar from "@/components/Navbar";
import MatchDetailView from "@/components/MatchDetailView";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

export default async function MatchDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  const headers: Record<string, string> = token ? { Cookie: `auth_token=${token}` } : {};

  const res = await fetch(`${BACKEND_URL}/api/fixtures/${params.id}`, {
    headers,
    next: { revalidate: 30 },
  }).then((r) => (r.ok ? r.json() : null)).catch(() => null);

  const fixture = res?.fixture;
  if (!fixture) {
    notFound();
  }

  return (
    <div style={{ background: "#0a081d", minHeight: "100vh", color: "#ffffff" }}>
      <Navbar />
      <MatchDetailView fixture={fixture} />
    </div>
  );
}
