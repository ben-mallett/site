import { NextRequest, NextResponse } from "next/server";
import { blogposts } from "./posts";

export async function GET(request: NextRequest) {
    try {
        return NextResponse.json({message: "Blogposts Retrieved", success: true, blogposts})
    } catch (error : any) {
        return NextResponse.json({error: error.message}, {status: 400})
    }
}