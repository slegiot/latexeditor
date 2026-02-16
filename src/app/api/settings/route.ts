import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { settings, name } = await request.json();

    // Update profile name if provided
    if (name !== undefined) {
        await supabase
            .from("profiles")
            .update({ full_name: name })
            .eq("id", user.id);
    }

    // Upsert settings
    if (settings) {
        await supabase.from("user_settings").upsert(
            {
                user_id: user.id,
                theme: settings.theme,
                font_size: settings.font_size,
                auto_save: settings.auto_save,
                auto_save_interval: settings.auto_save_interval,
                default_export: settings.default_export,
                vim_mode: settings.vim_mode,
                word_wrap: settings.word_wrap,
                minimap: settings.minimap,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
        );
    }

    return NextResponse.json({ success: true });
}
