import { NextResponse, NextRequest } from "next/server";
import { showcaseItems } from "./showcase";

export async function GET(request: NextRequest) {
    try {
        return NextResponse.json({message: "Showcase Items Retrieved", success: true, showcaseItems})
    } catch (error : any) {
        return NextResponse.json({error: error.message}, {status: 400})
    }
}
