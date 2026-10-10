import { ThemeProvider } from "@/components/theme-provider";
import { AdminForceDark } from "@/components/AdminForceDark";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      forcedTheme="dark"
      enableSystem={false}
      disableTransitionOnChange
    >
      <AdminForceDark />
      {children}
    </ThemeProvider>
  );
}
