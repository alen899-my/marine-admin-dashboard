import { dbConnect } from "@/lib/db";
import Permission from "@/models/Permission";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await dbConnect();

    const permissionsToSeed = [
      // --- DASHBOARD STATISTICS (New Group) ---
      // These control ONLY the visibility of the cards on the dashboard
      { slug: "stats.noon", description: "Show Noon Report Count", group: "Dashboard Statistics" },
      { slug: "stats.departure", description: "Show Departure Report Count", group: "Dashboard Statistics" },
      { slug: "stats.arrival", description: "Show Arrival Report Count", group: "Dashboard Statistics" },
      { slug: "stats.nor", description: "Show NOR Report Count", group: "Dashboard Statistics" },
      { slug: "stats.cargo_stowage", description: "Show Cargo Stowage Count", group: "Dashboard Statistics" },
      { slug: "stats.cargo_docs", description: "Show Cargo Docs Count", group: "Dashboard Statistics" },
      
      // --- GENERAL DASHBOARD ACCESS ---
      { slug: "dashboard.view", description: "View Dashboard Page", group: "Dashboard" },

      // --- 1. DAILY NOON REPORT ---
      { slug: "noon.view", description: "View Noon Reports", group: "Daily Noon Report" },
      { slug: "noon.create", description: "Create Noon Report", group: "Daily Noon Report" },
      { slug: "noon.edit", description: "Edit Noon Report", group: "Daily Noon Report" },
      { slug: "noon.delete", description: "Delete Noon Report", group: "Daily Noon Report" },

      // --- 2. DEPARTURE REPORT ---
      { slug: "departure.view", description: "View Departure Reports", group: "Departure Report" },
      { slug: "departure.create", description: "Create Departure Report", group: "Departure Report" },
      { slug: "departure.edit", description: "Edit Departure Report", group: "Departure Report" },
      { slug: "departure.delete", description: "Delete Departure Report", group: "Departure Report" },

      // --- 3. ARRIVAL REPORT ---
      { slug: "arrival.view", description: "View Arrival Reports", group: "Arrival Report" },
      { slug: "arrival.create", description: "Create Arrival Report", group: "Arrival Report" },
      { slug: "arrival.edit", description: "Edit Arrival Report", group: "Arrival Report" },
      { slug: "arrival.delete", description: "Delete Arrival Report", group: "Arrival Report" },

      // --- 4. NOR REPORT ---
      { slug: "nor.view", description: "View NOR Reports", group: "NOR Report" },
      { slug: "nor.create", description: "Create NOR Report", group: "NOR Report" },
      { slug: "nor.edit", description: "Edit NOR Report", group: "NOR Report" },
      { slug: "nor.delete", description: "Delete NOR Report", group: "NOR Report" },

      // --- 5. CARGO STOWAGE ---
      { slug: "cargo.view", description: "View Cargo Reports", group: "Cargo Stowage" },
      { slug: "cargo.create", description: "Create Cargo Report", group: "Cargo Stowage" },
      { slug: "cargo.edit", description: "Edit Cargo Report", group: "Cargo Stowage" },
      { slug: "cargo.delete", description: "Delete Cargo Report", group: "Cargo Stowage" },
      
      // --- 6. USER MANAGEMENT ---
      { slug: "users.view", description: "View Users", group: "User Management" },
      { slug: "users.create", description: "Create Users", group: "User Management" },
      { slug: "users.edit", description: "Edit Users", group: "User Management" },
      { slug: "users.delete", description: "Delete Users", group: "User Management" },

      // --- 7. ROLE MANAGEMENT ---
      { slug: "roles.view", description: "View Roles", group: "Role Management" },
      { slug: "roles.create", description: "Create Roles", group: "Role Management" },
      { slug: "roles.edit", description: "Edit Roles", group: "Role Management" },
      { slug: "roles.delete", description: "Delete Roles", group: "Role Management" },

      //---8. vessel management
      { slug: "vessels.view", description: "View Vessels", group: "Vessel Management" },
      { slug: "vessels.create", description: "Create Vessels", group: "Vessel Management" },
      { slug: "vessels.edit", description: "Edit Vessels", group: "Vessel Management" },
      { slug: "vessels.delete", description: "Delete Vessels", group: "Vessel Management" },

      //--9. voyage managment
      { slug: "voyage.view", description: "View Voyages", group: "Voyage Management" },
      { slug: "voyage.create", description: "Create Voyages", group: "Voyage Management" },
      { slug: "voyage.edit", description: "Edit Voyages", group: "Voyage Management" },
      { slug: "voyage.delete", description: "Delete Voyages", group: "Voyage Management" },
    ];

    // Upsert Permissions
    for (const perm of permissionsToSeed) {
      await Permission.findOneAndUpdate(
        { slug: perm.slug }, 
        { $set: { group: perm.group, description: perm.description } }, 
        { upsert: true, new: true }
      );
    }

    return NextResponse.json({ success: true, message: "Permissions seeded successfully!" });
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}