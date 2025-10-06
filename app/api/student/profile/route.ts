// app/api/student/profile/route.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { dbConnect } from "@/lib/db";
import User from "@/models/User";
import { getCurrentUser } from "@/lib/auth"; // helper (below)

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid body" }, { status: 400 });

    // find current user (implement getUserFromRequest to get user id from cookie/session)
    const currentUser = await getCurrentUser(req);
    if (!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await dbConnect();

    const { profile } = body as any;
    if (!profile) return NextResponse.json({ error: "Missing profile payload" }, { status: 400 });

    // whitelist subfields we accept
    const safeProfile = {
      personal: {
        fullName: String(profile.personal?.fullName || "").trim(),
        phone: String(profile.personal?.phone || "").trim(),
        dob: profile.personal?.dob || "",
        address: String(profile.personal?.address || "").trim(),
      },
      education: {
        highestDegree: String(profile.education?.highestDegree || "").trim(),
        institution: String(profile.education?.institution || "").trim(),
        yearOfPassing: String(profile.education?.yearOfPassing || "").trim(),
        skills: String(profile.education?.skills || "").trim(),
      },
      professional: {
        currentCompany: String(profile.professional?.currentCompany || "").trim(),
        currentRole: String(profile.professional?.currentRole || "").trim(),
        experienceYears: profile.professional?.experienceYears || 0,
        linkedin: String(profile.professional?.linkedin || "").trim(),
      },
    };

    // Save into meta.profile to avoid schema changes; you can change to top-level fields if you want.
    const update = {
      $set: {
        "meta.profile": safeProfile,
        // update name if changed
        name: safeProfile.personal.fullName || currentUser.name,
      },
    };

    await User.updateOne({ _id: currentUser.id }, update).exec();

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Save profile error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
