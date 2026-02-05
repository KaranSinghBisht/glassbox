import { NextRequest, NextResponse } from "next/server";
import { exportRunAsYAML } from "@/lib/exportConfig";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const yaml = await exportRunAsYAML(id);

    return new NextResponse(yaml, {
      status: 200,
      headers: {
        "Content-Type": "text/yaml",
        "Content-Disposition": `attachment; filename="run-${id.slice(0, 8)}.yaml"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
