import { SidebarProvider } from "@/components/ui/sidebar";
import { Suspense } from "react";
import DashboardHeader from "./_components/NavBar";
import DashboardSideBar from "./_components/AppSideBar";

export default function DashboardLayout({children} : { children : React.ReactNode}) {
    return (
        <SidebarProvider>
            {/**sidebar**/}
            <DashboardSideBar/>
            <main className="w-full relative">
                <DashboardHeader/>
                <Suspense fallback={<p>Loading...</p>}>
                    {children}
                </Suspense>
            </main>
        </SidebarProvider>
    )
}