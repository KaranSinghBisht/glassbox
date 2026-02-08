import { NextRequest, NextResponse } from "next/server";
import { exportRunAsYAML, exportRunAsJSON } from "@/lib/exportConfig";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const format = request.nextUrl.searchParams.get("format");

    if (format === "json") {
      const json = await exportRunAsJSON(id);
      return new NextResponse(json, {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="run-${id.slice(0, 8)}.json"`,
        },
      });
    }

    const yaml = await exportRunAsYAML(id);
    return new NextResponse(yaml, {
      status: 200,
      headers: {
        "Content-Type": "text/yaml",
        "Content-Disposition": `attachment; filename="run-${id.slice(0, 8)}.yaml"`,
      },
    });
  } catch (error) {
    console.error("[api/run/export] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
