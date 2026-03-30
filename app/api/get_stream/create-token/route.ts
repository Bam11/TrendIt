import { NextResponse } from "next/server";
import { StreamClient } from "@stream-io/node-sdk";
import { createClient } from "@/app/lib/supabase/server";

const apiKey = process.env.NEXT_PUBLIC_GETSTREAM_API_KEY!;
const secret = process.env.GETSTREAM_SECRET!;

export async function GET() {
  try {
    const supabase = await createClient();

    const { data } = await supabase.auth.getClaims();
    const user = data?.claims;
    console.log("user", user);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = new StreamClient(apiKey, secret);

    const token = client.generateUserToken({
      user_id: user.id,
    });

    await supabase.auth.updateUser({
      data: {
        get_stream_token: token,
      },
    });

    return NextResponse.json({ token, userId: user.id });
  } catch (err) {
    console.error("[get_stream] token generation failed:", err);
    return NextResponse.json(
      { error: "Failed to generate Stream token" },
      { status: 500 }
    );
  }
}