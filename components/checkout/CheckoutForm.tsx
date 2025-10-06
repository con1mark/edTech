// app/components/checkout/CheckoutForm.tsx (or wherever you keep it)
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

type CourseType = "skillpath" | "careerpath" | "course" | "hackathon";

function normalizeType(t: CourseType): CourseType {
  // If you ever pass "hackathons" from elsewhere, normalize here:
  // return (t === "hackathons" ? "hackathon" : t) as CourseType;
  return t;
}

function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency.toUpperCase(),
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    // Fallback
    return `${currency.toUpperCase()} ${amount}`;
  }
}

export default function CheckoutForm({
  courseType,
  slug,
  price = 4999,
  currency = "INR",
}: {
  courseType: CourseType;
  slug: string;
  price?: number;
  currency?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const type = normalizeType(courseType);
  const isHackathon = type === "hackathon";
  const verb = isHackathon ? "registration" : "enrollment";

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErr("Please enter your email");
      return;
    }
    // Lightweight email check (server should still validate)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setErr("Please enter a valid email address");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          userEmail: trimmedEmail,
          courseType: type,     // "skillpath" | "careerpath" | "course" | "hackathon"
          courseSlug: slug,     // server should validate slug exists
          status: "pending",
          amount: Number(price),
          currency: String(currency).toUpperCase(),
        }),
      });

      // Try to parse JSON; fall back to text for better error messages
      let json: any = null;
      try {
        json = await res.json();
      } catch {
        // ignore
      }
      if (!res.ok) {
        const msg =
          (json && (json.error || json.message)) ||
          `Checkout failed (${res.status})`;
        throw new Error(msg);
      }

      // Success → redirect to success page with encoded params
      const qs = new URLSearchParams({
        course: type,
        slug: slug,
      });
      router.push(`/checkout/success?${qs.toString()}`);
    } catch (e: any) {
      setErr(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3" aria-live="polite">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          className="mt-1 w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500 disabled:opacity-60 dark:border-gray-700 dark:bg-black/30 dark:text-white"
          placeholder="you@example.com"
          aria-invalid={!!err}
        />
      </div>

      <div className="text-sm text-gray-600 dark:text-gray-300">
        Amount: <strong>{formatMoney(price, currency)}</strong>
      </div>

      {err && <p className="text-sm text-red-600">{err}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-white font-medium hover:bg-blue-700 disabled:opacity-60"
        aria-busy={loading}
      >
        {loading ? "Processing…" : isHackathon ? "Confirm registration" : "Confirm enrollment"}
      </button>
    </form>
  );
}
