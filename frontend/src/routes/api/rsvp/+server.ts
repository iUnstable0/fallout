import { json } from "@sveltejs/kit";
import {
  AIRTABLE_API_KEY,
  AIRTABLE_BASE_ID,
  AIRTABLE_TABLE_ID,
} from "$env/static/private";
import type { RequestHandler } from "./$types.js";

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  if (!AIRTABLE_API_KEY || !AIRTABLE_BASE_ID || !AIRTABLE_TABLE_ID) {
    return json({ message: "Server configuration error" }, { status: 500 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    getClientAddress();

  const formData = await request.formData();
  const emailRaw = formData.get("Email");

  if (typeof emailRaw !== "string" || !emailRaw.trim()) {
    return json({ message: "Email is required" }, { status: 400 });
  }

  const email = emailRaw.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ message: "Invalid email" }, { status: 400 });
  }

  const fields = {
    Email: email,
    "IP Address": ip,
  };

  try {
    const response = await fetch(
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${encodeURIComponent(AIRTABLE_TABLE_ID)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AIRTABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fields }),
      },
    );

    if (!response.ok) {
      console.error("Airtable error:", response.status, await response.text());
      return json({ message: "Submission failed" }, { status: 502 });
    }

    const data = await response.json();
    return json({ success: true, id: data.id });
  } catch (e) {
    console.error("RSVP handler failed:", e);
    return json({ message: "Internal error" }, { status: 500 });
  }
};
