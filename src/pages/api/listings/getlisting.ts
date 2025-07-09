import { ResData } from "@/components/types/response";
import { is_User_auth } from "@/lib/auth";
import { getPaginatedListings } from "@/store";
import { Listing } from "@/types";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    ResData<{
      listings: Listing[];
      pagination?: {
        total: number;
        perPage: number;
        currentPage: number;
        totalPages: number;
      };
    }>
  >
) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const token = (req.headers.authorization as string) ?? "";

  if (!token) {
    return res.status(401).json({ error: "Unauthorized request." });
  }
  const is_auth = await is_User_auth(token);

  if (!is_auth) {
    return res.status(401).json({ error: "User is not authenticated." });
  }

  const query = req.query;
  const perPage = parseInt(query.perPage as string) || 10;
  const pageno = parseInt(query.pageno as string) || 1;
  try {
    const { listings, pagination } = await getPaginatedListings(
      is_auth.admin.id,
      perPage,
      pageno
    );
    return res.status(200).json({
      success: "Fetched successfully",
      data: {
        listings,
        pagination,
      },
    });
  } catch (error) {
    console.error("Error fetching listings:", error);
    return res
      .status(500)
      .json({ error: "Failed to fetch listings. Please try again later." });
  }
}
