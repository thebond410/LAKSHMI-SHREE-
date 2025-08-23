import Header from '@/components/layout/header';
import SupabaseProvider from '@/components/providers/supabase-provider';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SupabaseProvider>
      <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-1 container max-w-full p-1 m-0 overflow-x-hidden">{children}</main>
      </div>
    </SupabaseProvider>
  );
}
