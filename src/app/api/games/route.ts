import { NextResponse, NextRequest } from "next/server";
import { games } from "./games";

export async function GET(request: NextRequest) {
    try {
        return NextResponse.json({message: "Games Retrieved", success: true, games})
    } catch (error : any) {
        return NextResponse.json({error: error.message}, {status: 400})
    }
}
