import { AuthProvider } from "@/lib/auth";

export const metadata = {
  title: "CMS",
  robots: "noindex, nofollow",
};

export default function CtrlLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
