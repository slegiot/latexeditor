import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch user profile
    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    // Fetch GitHub connection status
    const { data: githubConnection } = await supabase
        .from("github_connections")
        .select("*")
        .eq("user_id", user.id)
        .single();

    return (
        <div className="min-h-screen bg-[var(--bg-primary)]">
            <Navbar showNavLinks={false} />

            <main className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-3xl mx-auto">
                    <div className="mb-8">
                        <h1 className="text-2xl font-bold mb-2">Settings</h1>
                        <p className="text-[var(--text-secondary)]">
                            Manage your account and preferences
                        </p>
                    </div>

                    <SettingsForm
                        user={{ id: user.id, email: user.email || "" }}
                        profile={profile}
                        githubConnected={!!githubConnection}
                    />
                </div>
            </main>
        </div>
    );
}
