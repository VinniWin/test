import { Admin, AuditLog, Listing } from "@/types";
import fs from "fs/promises";
import path from "path";
import { ulid } from "ulid";

const dataDir = path.join(process.cwd(), ".next","lib", "store");

async function readJSON(fileName: string) {
  try {
    const filePath = path.join(dataDir, fileName);
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (e) {
    if (e instanceof Error && (e as NodeJS.ErrnoException).code === "ENOENT") {
      await writeJSON(fileName, []);
      return [];
    }
    throw e;
  }
}

async function writeJSON(fileName: string, data: unknown) {
  const filePath = path.join(dataDir, fileName);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

export async function getAdmins(): Promise<Admin[]> {
  return readJSON("admins.json");
}

export async function getAdminById(id: string) {
  const admins = await getAdmins();
  return admins.find((a) => a.id === id);
}

export async function getAdminByEmail(email: string) {
  const admins = await getAdmins();
  return admins.find((a) => a.email === email);
}

export async function addAdmin(adminData: Omit<Admin, "id">) {
  const admins = await getAdmins();
  const newAdmin = {
    id: ulid(),
    ...adminData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  admins.push(newAdmin);
  await writeJSON("admins.json", admins);
  return newAdmin;
}

export async function getListings(): Promise<Listing[]> {
  return readJSON("listings.json");
}

export async function getListingById(id: string) {
  const listings = await getListings();
  return listings.find((l) => l.id === id);
}

export async function getPaginatedListings(
  adminId: string,
  perPage: number = 10,
  pageno: number = 1
): Promise<{
  listings: Listing[];
  pagination: {
    total: number;
    perPage: number;
    currentPage: number;
    totalPages: number;
  };
}> {
  const listings = await getListings();
  const adminListings = listings.filter(
    (listing) => listing.adminId === adminId
  );

  const totalListings = adminListings.length;
  const skip = (pageno - 1) * perPage;
  const paginatedListings = adminListings.slice(skip, skip + perPage);

  return {
    listings: paginatedListings,
    pagination: {
      total: totalListings,
      perPage,
      currentPage: pageno,
      totalPages: Math.ceil(totalListings / perPage),
    },
  };
}
export async function updateListing(id: string, updateData: Partial<Listing>) {
  const listings = await getListings();
  const index = listings.findIndex((l) => l.id === id);
  if (index === -1) return null;
  listings[index] = {
    ...listings[index],
    ...updateData,
    updatedAt: new Date().toISOString(),
  };
  await writeJSON("listings.json", listings);
  return listings[index];
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  return readJSON("auditLogs.json");
}

export async function addAuditLog(logData: Omit<AuditLog, "id" | "timestamp">) {
  const auditLogs = await getAuditLogs();
  const newLog = {
    id: ulid(),
    timestamp: new Date().toISOString(),
    ...logData,
  };
  auditLogs.push(newLog);
  await writeJSON("auditLogs.json", auditLogs);

  return newLog;
}
