import fs from "fs/promises";
import path from "path";
import { faker } from "@faker-js/faker";
import { ulid } from "ulid";

const dataDir =
  process.env.NODE_ENV === "production"
    ? path.join("/tmp", "store") // ✅ Writable in serverless env
    : path.join(process.cwd(), "public", "store"); // ✅ Works locally

async function writeJSONIfNotExists(fileName: string, data: unknown) {
  await fs.mkdir(dataDir, { recursive: true });

  const filePath = path.join(dataDir, fileName);

  try {
    await fs.access(filePath); // check if file exists
    console.log(`${fileName} already exists. Skipping...`);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
    console.log(`${fileName} created.`);
  }
}
export async function seed() {
  console.log("Seeding start...");

  const admin1 = {
    id: ulid(),
    email: "admin1@example.com",
    password: "adminpass1",
    name: faker.person.fullName(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const admin2 = {
    id: ulid(),
    email: "admin2@example.com",
    password: "adminpass2",
    name: faker.person.fullName(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const admins = [admin1, admin2];
  await writeJSONIfNotExists("admins.json", admins);

  const listingStatuses = ["PENDING"];

  const listings = Array.from({ length: 50 }).map(() => ({
    id: ulid(),
    title: `${faker.vehicle.manufacturer()} ${faker.vehicle.model()}`,
    description: faker.lorem.sentences(2),
    pricePerDay: parseFloat(faker.commerce.price({ min: 30, max: 150 })),
    status: faker.helpers.arrayElement(listingStatuses),
    submittedBy: faker.internet.email(),
    submittedAt: faker.date.past().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    adminId: faker.helpers.arrayElement(admins).id,
  }));

  await writeJSONIfNotExists("listings.json", listings);

  await writeJSONIfNotExists("auditLogs.json", []);

  console.log("Seed complete.");
}

seed().catch(console.error);
