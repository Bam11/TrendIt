import { NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";
import { createClient } from "@/app/lib/supabase/server";

const apiKey = process.env.NEXT_PUBLIC_GETSTREAM_API_KEY!;
const secret = process.env.GETSTREAM_SECRET!;

export async function POST( request: Request) {
  const { full_name, username, image} = await request.json();
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = new StreamClient(apiKey, secret);

    const newUser = {
      id: user.id,
      custom: {
        fullname: full_name,
        username: username,
        image,
      },
      name: username,
      image,
    };
    await client.upsertUsers([newUser]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[get_stream_user_management] failed:", err);
    return NextResponse.json(
      { error: "Failed to manage Stream user" },
      { status: 500 },
    );
  }
}