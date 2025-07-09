import { ResData } from "@/components/types/response";
import { is_User_auth } from "@/lib/auth";
import { addAuditLog, updateListing } from "@/store";
import { Listing, Status } from "@/types";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResData<Listing>>
) {
  if (req.method !== "PUT") {
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
  const { id } = req.query;
  if (typeof id !== "string") {
    return res.status(400).json({ error: "Invalid id format." });
  }

  const token = req.cookies.auth_token ?? "";

  if (!token) {
    return res.status(401).json({ error: "Unauthorized request." });
  }

  const is_auth = await is_User_auth(token);

  if (!is_auth) {
    return res.status(401).json({ error: "User is not authenticated." });
  }
  const { status } = req.body;
  const validStatuses = ["APPROVED", "REJECTED"];

  if (
    !status ||
    typeof status !== "string" ||
    !validStatuses.includes(status)
  ) {
    return res.status(400).json({ error: "Invalid or missing status." });
  }
  const adminId = is_auth.admin.id;

  try {
    const listing = await updateListing(id, {
      status: status as Status,
    });

    if (listing === null) {
      return res.status(404).json({ error: "Listing not found." });
    }

    await addAuditLog({
      listingId: id,
      adminId: adminId,
      details: `${
        status === "APPROVED" ? "Approved" : "Rejected"
      } the listing by: ${is_auth.admin.name}`,
      action: status == "APPROVED" ? "approve" : "reject",
    });

    return res
      .status(200)
      .json({ success: "Successfully updated.", data: listing });
  } catch (error) {
    console.error("[LISTING UPDATE ERROR]", error);
    return res.status(500).json({ error: "Failed to update listing." });
  }
}
