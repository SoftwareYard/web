import { PortalAuthProvider } from "@/lib/portal-auth";

export const metadata = {
  title: "Time Off Portal",
  robots: "noindex, nofollow",
};

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PortalAuthProvider>{children}</PortalAuthProvider>;
}
