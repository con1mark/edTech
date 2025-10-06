"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Mail, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";


type ProfileForm = {
  personal: { fullName: string; phone?: string; dob?: string; address?: string };
  education: { highestDegree?: string; institution?: string; yearOfPassing?: string; skills?: string };
  professional: { currentCompany?: string; currentRole?: string; experienceYears?: number | ""; linkedin?: string };
};

const TAB_ORDER: Array<{ id: keyof ProfileForm; label: string }> = [
  { id: "personal", label: "Personal" },
  { id: "education", label: "Education" },
  { id: "professional", label: "Professional" },
];

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);

  const [activeTab, setActiveTab] = useState<keyof ProfileForm>("personal");
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({ personal: false, education: true, professional: true });

  const [form, setForm] = useState<ProfileForm>({
    personal: { fullName: "", phone: "", dob: "", address: "" },
    education: { highestDegree: "", institution: "", yearOfPassing: "", skills: "" },
    professional: { currentCompany: "", currentRole: "", experienceYears: "", linkedin: "" },
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/student/me", { credentials: "include", headers: { accept: "application/json" } });
        if (!mounted) return;
        if (res.status === 401) {
          router.replace("/auth/signin");
          return;
        }
        if (!res.ok) {
          setMsg("Failed to load profile.");
          return;
        }
        const data = await res.json();
        const meta = (data as any).meta || {};
        const profile = meta.profile || {};
        setForm({
          personal: {
            fullName: profile.fullName || data.name || "",
            phone: profile.phone || "",
            dob: profile.dob || "",
            address: profile.address || "",
          },
          education: {
            highestDegree: profile.highestDegree || "",
            institution: profile.institution || "",
            yearOfPassing: profile.yearOfPassing || "",
            skills: profile.skills || "",
          },
          professional: {
            currentCompany: profile.currentCompany || "",
            currentRole: profile.currentRole || "",
            experienceYears: profile.experienceYears ?? "",
            linkedin: profile.linkedin || "",
          },
        });
        setEmailVerified(Boolean(meta?.emailVerification?.verified || data?.emailVerified));
      } catch (err) {
        console.error(err);
        setMsg("Error loading profile.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [router]);

  function updateSection<K extends keyof ProfileForm>(section: K, value: ProfileForm[K]) {
    setForm((s) => ({ ...s, [section]: value }));
  }

  async function handleSave(section?: keyof ProfileForm) {
    setSaving(true);
    setMsg(null);
    try {
      const res = await fetch("/api/student/profile", {
        method: "POST",
        credentials: "include",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profile: form }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Save failed");
      setMsg("Profile saved successfully.");
      if (section) setCollapsed((c) => ({ ...c, [section]: true }));
    } catch (err: any) {
      console.error(err);
      setMsg(err?.message || "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function sendVerification() {
    setMsg(null);
    try {
      const res = await fetch("/api/auth/send-verification", { method: "POST", credentials: "include" });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.error || "Failed to send verification");
      setMsg("Verification email sent — check your inbox.");
    } catch (err: any) {
      console.error(err);
      setMsg(err?.message || "Failed to send verification email.");
    }
  }

  const cardHeaderBtn = "text-sm font-medium px-3 py-1 rounded-md transition";
  const primaryBtn = "inline-flex items-center gap-2 px-4 py-2 rounded-md bg-orange-500 text-white hover:bg-orange-600";

  return (
    <div className="main-with-sidebar min-h-screen bg-white text-black">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Profile</h1>
            <p className="text-sm text-gray-600 mt-1">Update your personal, education and professional details.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-md border border-gray-100">
              {emailVerified ? (
                <span className="flex items-center gap-2 text-green-600"><CheckCircle2 size={18} /> Verified</span>
              ) : (
                <button onClick={sendVerification} className="flex items-center gap-2 text-orange-600 hover:underline">
                  <Mail size={18} /> Verify email
                </button>
              )}
            </div>

            <button onClick={() => handleSave()} className={primaryBtn} disabled={saving}>
              {saving ? <Loader2 className="animate-spin h-4 w-4" /> : "Save all"}
            </button>
          </div>
        </div>

        {/* horizontal tabs */}
        <div className="bg-white border-b border-gray-100 sticky top-16 z-20">
          <div className="max-w-5xl mx-auto px-1">
            <nav className="flex gap-2 overflow-x-auto py-3">
              {TAB_ORDER.map((t) => {
                const active = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveTab(t.id);
                      setCollapsed((c) => ({ ...c, [t.id]: false }));
                      const el = document.getElementById(`card-${t.id}`);
                      el?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className={`whitespace-nowrap ${active ? "bg-orange-500 text-white" : "bg-white text-gray-800"} ${active ? "shadow" : "border"} px-4 py-2 rounded-lg`}
                    aria-pressed={active}
                  >
                    {t.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* message */}
        {msg && (
          <div className="mt-4">
            <div className="rounded-md bg-orange-50 border border-orange-100 text-orange-700 px-4 py-2 text-sm">{msg}</div>
          </div>
        )}

        {/* cards */}
        <div className="mt-6 space-y-5">
          {/* Personal */}
          <section id="card-personal" className="bg-white rounded-2xl shadow-sm border">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <div className="text-lg font-semibold">Personal Information</div>
                <div className="text-xs text-gray-500">Name, phone, date of birth and address</div>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setCollapsed((c) => ({ ...c, personal: !c.personal }));
                    setActiveTab("personal");
                  }}
                  className={`${cardHeaderBtn} ${collapsed.personal ? "bg-gray-100" : "bg-orange-50 text-orange-600 border border-orange-100"}`}
                >
                  {collapsed.personal ? "Expand" : "Collapse"}
                </button>
                <button onClick={() => { setActiveTab("personal"); handleSave("personal"); }} className={primaryBtn}>
                  Save
                </button>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {!collapsed.personal && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }} className="px-6 py-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className="block">
                      <div className="text-xs text-gray-600 mb-1">Full name</div>
                      <input value={form.personal.fullName} onChange={(e) => updateSection("personal", { ...form.personal, fullName: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300" />
                    </label>

                    <label>
                      <div className="text-xs text-gray-600 mb-1">Phone</div>
                      <input value={form.personal.phone} onChange={(e) => updateSection("personal", { ...form.personal, phone: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300" />
                    </label>

                    <label>
                      <div className="text-xs text-gray-600 mb-1">Date of birth</div>
                      <input type="date" value={form.personal.dob} onChange={(e) => updateSection("personal", { ...form.personal, dob: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300" />
                    </label>

                    <label className="md:col-span-2">
                      <div className="text-xs text-gray-600 mb-1">Address</div>
                      <textarea value={form.personal.address} onChange={(e) => updateSection("personal", { ...form.personal, address: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 h-28 focus:outline-none focus:ring-2 focus:ring-orange-300" />
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Education */}
          <section id="card-education" className="bg-white rounded-2xl shadow-sm border">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <div className="text-lg font-semibold">Education</div>
                <div className="text-xs text-gray-500">Highest degree, institution, year and skills</div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setCollapsed((c) => ({ ...c, education: !c.education }))} className={`${cardHeaderBtn} ${collapsed.education ? "bg-gray-100" : "bg-orange-50 text-orange-600 border border-orange-100"}`}>
                  {collapsed.education ? "Expand" : "Collapse"}
                </button>
                <button onClick={() => { setActiveTab("education"); handleSave("education"); }} className={primaryBtn}>
                  Save
                </button>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {!collapsed.education && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }} className="px-6 py-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label>
                      <div className="text-xs text-gray-600 mb-1">Highest degree</div>
                      <input value={form.education.highestDegree} onChange={(e) => updateSection("education", { ...form.education, highestDegree: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300" />
                    </label>

                    <label>
                      <div className="text-xs text-gray-600 mb-1">Institution</div>
                      <input value={form.education.institution} onChange={(e) => updateSection("education", { ...form.education, institution: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300" />
                    </label>

                    <label>
                      <div className="text-xs text-gray-600 mb-1">Year of passing</div>
                      <input value={form.education.yearOfPassing} onChange={(e) => updateSection("education", { ...form.education, yearOfPassing: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300" />
                    </label>

                    <label>
                      <div className="text-xs text-gray-600 mb-1">Skills (comma separated)</div>
                      <input value={form.education.skills} onChange={(e) => updateSection("education", { ...form.education, skills: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300" />
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Professional */}
          <section id="card-professional" className="bg-white rounded-2xl shadow-sm border">
            <div className="flex items-center justify-between px-5 py-4 border-b">
              <div>
                <div className="text-lg font-semibold">Professional</div>
                <div className="text-xs text-gray-500">Current role, company, experience and LinkedIn</div>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setCollapsed((c) => ({ ...c, professional: !c.professional }))} className={`${cardHeaderBtn} ${collapsed.professional ? "bg-gray-100" : "bg-orange-50 text-orange-600 border border-orange-100"}`}>
                  {collapsed.professional ? "Expand" : "Collapse"}
                </button>
                <button onClick={() => { setActiveTab("professional"); handleSave("professional"); }} className={primaryBtn}>
                  Save
                </button>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {!collapsed.professional && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }} className="px-6 py-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label>
                      <div className="text-xs text-gray-600 mb-1">Current company</div>
                      <input value={form.professional.currentCompany} onChange={(e) => updateSection("professional", { ...form.professional, currentCompany: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300" />
                    </label>

                    <label>
                      <div className="text-xs text-gray-600 mb-1">Current role</div>
                      <input value={form.professional.currentRole} onChange={(e) => updateSection("professional", { ...form.professional, currentRole: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300" />
                    </label>

                    <label>
                      <div className="text-xs text-gray-600 mb-1">Years of experience</div>
                      <input type="number" value={String(form.professional.experienceYears || "")} onChange={(e) => updateSection("professional", { ...form.professional, experienceYears: e.target.value === "" ? "" : Number(e.target.value) })} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300" />
                    </label>

                    <label>
                      <div className="text-xs text-gray-600 mb-1">LinkedIn</div>
                      <input value={form.professional.linkedin} onChange={(e) => updateSection("professional", { ...form.professional, linkedin: e.target.value })} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-300" />
                    </label>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* helper actions */}
          <div className="flex justify-end gap-3 pt-1">
            <button onClick={() => setCollapsed({ personal: false, education: false, professional: false })} className="px-4 py-2 rounded-md border">Expand all</button>
            <button onClick={() => setCollapsed({ personal: true, education: true, professional: true })} className="px-4 py-2 rounded-md border">Collapse all</button>
            <button onClick={() => handleSave()} className={primaryBtn} disabled={saving}>{saving ? <Loader2 className="animate-spin h-4 w-4" /> : "Save all"}</button>
          </div>
        </div>
      </div>
    </div>
  );
}
