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

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

    const { data: settings } = await supabase
        .from("user_settings")
        .select("*")
        .eq("user_id", user.id)
        .single();

    const defaultSettings = {
        theme: "dark" as const,
        font_size: 14,
        auto_save: true,
        auto_save_interval: 30,
        default_export: "pdf" as const,
        vim_mode: false,
        word_wrap: true,
        minimap: true,
    };

    return (
        <div className="min-h-screen bg-surface-950">
            <Navbar
                user={{
                    email: user.email ?? "",
                    fullName: profile?.full_name ?? "",
                    avatarUrl: profile?.avatar_url ?? "",
                }}
            />
            <main className="max-w-3xl mx-auto px-6 py-10 animate-fade-in">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-white">Settings</h1>
                    <p className="text-surface-400 mt-1">Customise your LatexForge experience.</p>
                </div>

                <SettingsForm
                    initialSettings={settings || defaultSettings}
                    profile={{
                        fullName: profile?.full_name || "",
                        email: user.email || "",
                    }}
                />
            </main>
        </div>
    );
}
