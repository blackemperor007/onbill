import { SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({children} : { children : React.ReactNode}) {
    return (
        <SidebarProvider>
            {/**sidebar**/}
            {/* <DashboardSidebar/> */}
            <main className="w-full relative">
                {/* <DashboardHeader/> */}
                {/* <Suspense fallback={<p>Loading...</p>}> */}
                    {children}
                {/* </Suspense> */}
            </main>
        </SidebarProvider>
    )
}