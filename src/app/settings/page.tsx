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
        <div className="min-h-dvh flex flex-col">
            <Navbar
                user={{
                    email: user.email ?? "",
                    fullName: profile?.full_name ?? "",
                    avatarUrl: profile?.avatar_url ?? "",
                }}
            />
            <main className="flex-1 pt-24 pb-12 px-4 sm:px-6">
                <div className="max-w-2xl mx-auto">
                    <h1 className="text-3xl font-bold mb-2">Settings</h1>
                    <p className="text-[var(--color-surface-600)] mb-8">
                        Customise your LatexForge experience.
                    </p>

                    <SettingsForm
                        initialSettings={settings || defaultSettings}
                        profile={{
                            fullName: profile?.full_name || "",
                            email: user.email || "",
                        }}
                    />
                </div>
            </main>
        </div>
    );
}
