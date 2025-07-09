import { ResData } from "@/components/types/response";
import { signToken } from "@/lib/auth";
import { loginSchema } from "@/schema/loginSchema";
import { getAdmins } from "@/store";
import { Admin } from "@/types";
import { serialize } from "cookie";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<
    ResData<{ user?: Omit<Admin, "password" | "id">; token?: string }>
  >
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    const errorMessages = parsed.error.errors
      .map((err) => err.message)
      .join(", ");
    return res.status(400).json({ error: errorMessages });
  }
  const { email, password } = parsed.data;

  try {
    const admins = await getAdmins();

    const user = admins.find(
      (admin) => admin.email === email && admin.password === password
    );

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, id: __, ...userData } = user;

    const token = await signToken(userData);

    res.setHeader(
      "Set-Cookie",
      serialize("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 60 * 24,
        path: "/",
      })
    );

    return res
      .status(200)
      .json({
        success: "Logged in successfully",
        data: { user: userData, token },
      });
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
