import { ResData } from "@/components/types/response";
import { is_User_auth } from "@/lib/auth";
import { listingSchema } from "@/schema/table.schema";
import { addAuditLog, updateListing } from "@/store";
import { Listing } from "@/types";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResData<Listing>>
) {
  if (req.method !== "PUT") {
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { id } = req.query;
  const token = req.cookies.auth_token ?? "";

  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid id format." });
  }
  if (!token) {
    return res.status(401).json({ error: "Unauthorized request." });
  }

  const is_auth = await is_User_auth(token);

  if (!is_auth) {
    return res.status(401).json({ error: "User is not authenticated." });
  }

  try {
    const body = req.body;
    const result = listingSchema.safeParse(body);
    const adminId = is_auth.admin.id;

    if (!result.success) {
      return res.status(400).json({ error: result.error.message });
    }
    const updateData = result.data;

    const listing = await updateListing(id, {
      title: updateData.title,
      description: updateData.description,
      status: updateData.status,
      pricePerDay: updateData.pricePerDay,
      submittedBy: adminId,
    });

    if (listing === null) {
      return res.status(404).json({ error: "Listing not found." });
    }

    await addAuditLog({
      action: "edit",
      listingId: id,
      adminId: adminId,
      details: JSON.stringify({
        title: updateData.title,
        description: updateData.description,
        status: updateData.status,
        pricePerDay: updateData.pricePerDay,
        updatedBy: is_auth.admin?.email,
      }),
    });

    return res.status(200).json({ data: listing });
  } catch (error) {
    console.error("PUT listing error:", error);
    return res.status(500).json({ error: "Failed to update listing." });
  }
}
