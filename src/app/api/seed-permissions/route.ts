import { dbConnect } from "@/lib/db";
import Permission from "@/models/Permission";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();

    const permissionsToSeed = [
      // --- DASHBOARD STATISTICS ---
      { slug: "stats.noon", name: "Noon Stats", description: "Show Noon Report Count", group: "Dashboard Statistics" },
      { slug: "stats.departure", name: "Departure Stats", description: "Show Departure Report Count", group: "Dashboard Statistics" },
      { slug: "stats.arrival", name: "Arrival Stats", description: "Show Arrival Report Count", group: "Dashboard Statistics" },
      { slug: "stats.nor", name: "NOR Stats", description: "Show NOR Report Count", group: "Dashboard Statistics" },
      { slug: "stats.cargo_stowage", name: "Stowage Stats", description: "Show Cargo Stowage Count", group: "Dashboard Statistics" },
      { slug: "stats.cargo_docs", name: "Cargo Docs Stats", description: "Show Cargo Docs Count", group: "Dashboard Statistics" },
      
      // --- DASHBOARD ---
      { slug: "dashboard.view", name: "View Dashboard", description: "View Dashboard Page", group: "Dashboard" },

      // --- 1. DAILY NOON REPORT ---
      { slug: "noon.view", name: "View Noon Reports", description: "View Noon Reports", group: "Daily Noon Report" },
      { slug: "noon.create", name: "Create Noon Report", description: "Create Noon Report", group: "Daily Noon Report" },
      { slug: "noon.edit", name: "Edit Noon Report", description: "Edit Noon Report", group: "Daily Noon Report" },
      { slug: "noon.delete", name: "Delete Noon Report", description: "Delete Noon Report", group: "Daily Noon Report" },

      // --- 2. DEPARTURE REPORT ---
      { slug: "departure.view", name: "View Departure Reports", description: "View Departure Reports", group: "Departure Report" },
      { slug: "departure.create", name: "Create Departure Report", description: "Create Departure Report", group: "Departure Report" },
      { slug: "departure.edit", name: "Edit Departure Report", description: "Edit Departure Report", group: "Departure Report" },
      { slug: "departure.delete", name: "Delete Departure Report", description: "Delete Departure Report", group: "Departure Report" },

      // --- 3. ARRIVAL REPORT ---
      { slug: "arrival.view", name: "View Arrival Reports", description: "View Arrival Reports", group: "Arrival Report" },
      { slug: "arrival.create", name: "Create Arrival Report", description: "Create Arrival Report", group: "Arrival Report" },
      { slug: "arrival.edit", name: "Edit Arrival Report", description: "Edit Arrival Report", group: "Arrival Report" },
      { slug: "arrival.delete", name: "Delete Arrival Report", description: "Delete Arrival Report", group: "Arrival Report" },

      // --- 4. NOR REPORT ---
      { slug: "nor.view", name: "View NOR Reports", description: "View NOR Reports", group: "NOR Report" },
      { slug: "nor.create", name: "Create NOR Report", description: "Create NOR Report", group: "NOR Report" },
      { slug: "nor.edit", name: "Edit NOR Report", description: "Edit NOR Report", group: "NOR Report" },
      { slug: "nor.delete", name: "Delete NOR Report", description: "Delete NOR Report", group: "NOR Report" },

      // --- 5. CARGO STOWAGE ---
      { slug: "cargo.view", name: "View Cargo Stowage", description: "View Cargo Reports", group: "Cargo Stowage" },
      { slug: "cargo.create", name: "Create Cargo Stowage", description: "Create Cargo Report", group: "Cargo Stowage" },
      { slug: "cargo.edit", name: "Edit Cargo Stowage", description: "Edit Cargo Report", group: "Cargo Stowage" },
      { slug: "cargo.delete", name: "Delete Cargo Stowage", description: "Delete Cargo Report", group: "Cargo Stowage" },
      
      // --- 6. USER MANAGEMENT ---
      { slug: "users.view", name: "View Users", description: "View Users", group: "User Management" },
      { slug: "users.create", name: "Create Users", description: "Create Users", group: "User Management" },
      { slug: "users.edit", name: "Edit Users", description: "Edit Users", group: "User Management" },
      { slug: "users.delete", name: "Delete Users", description: "Delete Users", group: "User Management" },

      // --- 7. ROLE MANAGEMENT ---
      { slug: "roles.view", name: "View Roles", description: "View Roles", group: "Role Management" },
      { slug: "roles.create", name: "Create Roles", description: "Create Roles", group: "Role Management" },
      { slug: "roles.edit", name: "Edit Roles", description: "Edit Roles", group: "Role Management" },
      { slug: "roles.delete", name: "Delete Roles", description: "Delete Roles", group: "Role Management" },

      // --- 8. VESSEL MANAGEMENT ---
      { slug: "vessels.view", name: "View Vessels", description: "View Vessels", group: "Vessel Management" },
      { slug: "vessels.create", name: "Create Vessels", description: "Create Vessels", group: "Vessel Management" },
      { slug: "vessels.edit", name: "Edit Vessels", description: "Edit Vessels", group: "Vessel Management" },
      { slug: "vessels.delete", name: "Delete Vessels", description: "Delete Vessels", group: "Vessel Management" },

      // --- 9. VOYAGE MANAGEMENT ---
      { slug: "voyage.view", name: "View Voyages", description: "View Voyages", group: "Voyage Management" },
      { slug: "voyage.create", name: "Create Voyages", description: "Create Voyages", group: "Voyage Management" },
      { slug: "voyage.edit", name: "Edit Voyages", description: "Edit Voyages", group: "Voyage Management" },
      { slug: "voyage.delete", name: "Delete Voyages", description: "Delete Voyages", group: "Voyage Management" },
    ];

    // Bulk Update
    const operations = permissionsToSeed.map((perm) => ({
      updateOne: {
        filter: { slug: perm.slug },
        update: { 
          $set: { 
            name: perm.name,           // Adds the new field
            group: perm.group, 
            description: perm.description 
          },
          $setOnInsert: { status: "active" } // Only sets active if creating new
        },
        upsert: true,
      },
    }));

    await Permission.bulkWrite(operations);

    return NextResponse.json({ success: true, message: "Permissions updated with names successfully!" });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}