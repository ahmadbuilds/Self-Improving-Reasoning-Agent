import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (!body || !body.question) {
      return NextResponse.json({ error: "Question is required" }, { status: 400 });
    }

    const backendUrl = process.env.BACKEND_URL;
    if (!backendUrl) {
      console.error("BACKEND_URL is not configured in .env.local");
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    const backendResponse = await fetch(`${backendUrl}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question: body.question }),
    });

    if (!backendResponse.ok) {
        const errorText = await backendResponse.text();
        console.error("Backend error:", errorText);
        let errorMsg = `Backend returned status ${backendResponse.status}`;
        try {
          const parsed = JSON.parse(errorText);
          errorMsg = parsed.detail || parsed.message || errorMsg;
        } catch (e) {
          // fallback to default
        }
        return NextResponse.json({ error: errorMsg }, { status: backendResponse.status });
    }

    const data = await backendResponse.json();
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("API proxy error:", error.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
