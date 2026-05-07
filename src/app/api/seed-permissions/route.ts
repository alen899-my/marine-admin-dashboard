import { dbConnect } from "@/lib/db";
import Permission from "@/models/Permission";
import Resource from "@/models/Resource";
import Role from "@/models/Role";
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
      { slug: "stats.vessels", name: "Vessel Stats", description: "Show Vessel Count", group: "Dashboard Statistics" },
      { slug: "stats.voyages", name: "Voyage Stats", description: "Show Voyage Count", group: "Dashboard Statistics" },
      { slug: "stats.users", name: "User Stats", description: "Show User Count", group: "Dashboard Statistics" },
      { slug: "stats.companies", name: "Company Stats", description: "Show Company Count", group: "Dashboard Statistics" },
      { slug: "stats.active_crew", name: "Active Crew Stats", description: "Show Active Crew Count", group: "Dashboard Statistics" },
      { slug: "stats.candidates", name: "Candidate Stats", description: "Show Candidate Count", group: "Dashboard Statistics" },
      { slug: "stats.active_contracts", name: "Active Contract Stats", description: "Show Active Contract Count", group: "Dashboard Statistics" },
      { slug: "stats.open_payrolls", name: "Open Payroll Stats", description: "Show Open Payroll Count", group: "Dashboard Statistics" },
      { slug: "stats.pending_leaves", name: "Pending Leave Stats", description: "Show Pending Leave Approval Count", group: "Dashboard Statistics" },
      
      // --- DASHBOARD ---
      { slug: "dashboard.view", name: "View Dashboard", description: "View Dashboard Page", group: "Dashboard" },
      { slug: "dashboard.edit", name: "Edit Dashboard", description: "Allow editing dashboard layout", group: "Dashboard" },
      { slug: "dashboard.rearrange", name: "Rearrange Widgets", description: "Allow rearranging dashboard widgets", group: "Dashboard" },
      { slug: "dashboard.resize", name: "Resize Widgets", description: "Allow resizing dashboard widgets", group: "Dashboard" },

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

      // --- 10. SYSTEM MANAGEMENT ---
      { slug: "backup.manage", name: "Manage Backups", description: "Create, download and restore backups", group: "System Management" },

      // --- 11. CONTRACT MANAGEMENT ---
      { slug: "contracts.view", name: "View Contracts", description: "View Contracts", group: "Contract Management" },
      { slug: "contracts.create", name: "Create Contracts", description: "Create Contracts", group: "Contract Management" },
      { slug: "contracts.edit", name: "Edit Contracts", description: "Edit Contracts", group: "Contract Management" },
      { slug: "contracts.delete", name: "Delete Contracts", description: "Delete Contracts", group: "Contract Management" },
      { slug: "sea.document.generate", name: "Sea Template Generation", description: "Allow user to generate SEA for candidates", group: "Contract Management" },

      // --- 12. ONBOARDING MANAGEMENT ---
      { slug: "onboarding.view", name: "View Onboarding", description: "View Onboarding Module", group: "Onboarding Management" },
      { slug: "onboarding.create", name: "Create Onboarding", description: "Create Onboarding for candidates", group: "Onboarding Management" },
      { slug: "onboarding.edit", name: "Edit Onboarding", description: "Edit Onboarding details", group: "Onboarding Management" },
      { slug: "onboarding.delete", name: "Delete Onboarding", description: "Delete Onboarding details", group: "Onboarding Management" },
      { slug: "onboarding.confirm", name: "Confirm Onboard", description: "Confirm OnBoard and Set Crew Active", group: "Onboarding Management" },
      { slug: "onboarding.checklistadding", name: "Add Checklist", description: "Create onboarding checklist for candidates", group: "Onboarding Management" },

      // --- 13. CREW MANAGEMENT ---
      { slug: "crews.view", name: "View Crews", description: "View Active Crews Module", group: "Crew Management" },
      { slug: "crews.create", name: "Create Crews", description: "Create Crews", group: "Crew Management" },
      { slug: "crews.edit", name: "Edit Crews", description: "Edit Crews", group: "Crew Management" },
      { slug: "crews.delete", name: "Delete Crews", description: "Remove Crews From Active Crew List", group: "Crew Management" },

      // --- 14. PAYROLL MANAGEMENT ---
      { slug: "payroll.view", name: "View Payroll", description: "View Payroll Module and active crew list", group: "Payroll Management" },
      { slug: "payroll.create", name: "Create Payroll", description: "Process a new payroll record for a crew member", group: "Payroll Management" },
      { slug: "payroll.edit", name: "Edit Payroll", description: "Edit an existing payroll record", group: "Payroll Management" },
      { slug: "payroll.delete", name: "Delete Payroll", description: "Delete a payroll record", group: "Payroll Management" },
      { slug: "payroll.verify", name: "Verify Payroll", description: "Captain sign-off / verify a saved payroll record", group: "Payroll Management" },
      { slug: "payroll.approve", name: "Approve Payroll", description: "Finance approval of a captain-verified payroll record", group: "Payroll Management" },

      // --- 15. SALARY HEAD MANAGEMENT ---
      { slug: "salary.head.view", name: "View Salary Head", description: "Allow users to view salary head", group: "Salary Head" },
      { slug: "salary.head.create", name: "Create Salary Head", description: "Allow users to create salary head", group: "Salary Head" },
      { slug: "salary.head.edit", name: "Edit Salary Head", description: "Allow users to Edit salary head", group: "Salary Head" },
      { slug: "salary.head.delete", name: "Delete Salary Head", description: "Allow users to Delete salary head", group: "Salary Head" },

      // --- 16. ALLOWANCE & DEDUCTION MASTER ---
      { slug: "allowance.deduction.view", name: "View Allowance & Deduction", description: "Allow users to view allowance and deduction masters", group: "Allowance & Deduction" },
      { slug: "allowance.deduction.create", name: "Create Allowance & Deduction", description: "Allow users to create allowance and deduction masters", group: "Allowance & Deduction" },
      { slug: "allowance.deduction.edit", name: "Edit Allowance & Deduction", description: "Allow users to edit allowance and deduction masters", group: "Allowance & Deduction" },
      { slug: "allowance.deduction.delete", name: "Delete Allowance & Deduction", description: "Allow users to delete allowance and deduction masters", group: "Allowance & Deduction" },

      // --- 17. LEAVE TYPE MANAGEMENT ---
      { slug: "leavetype.view", name: "View Leave Type", description: "Allow users to view leave types", group: "Leave Type" },
      { slug: "leavetype.create", name: "Create Leave Type", description: "Allow users to create leave types", group: "Leave Type" },
      { slug: "leavetype.edit", name: "Edit Leave Type", description: "Allow users to Edit leave types", group: "Leave Type" },
      { slug: "leavetype.delete", name: "Delete Leave Type", description: "Allow users to Delete leave types", group: "Leave Type" },
    ];

    const resourceNames = [...new Set(permissionsToSeed.map((perm) => perm.group))];

    await Resource.bulkWrite(
      resourceNames.map((name) => ({
        updateOne: {
          filter: { name },
          update: {
            $set: {
              name,
              status: "active",
              deletedAt: null,
            },
          },
          upsert: true,
        },
      })),
    );

    const resources = await Resource.find({
      name: { $in: resourceNames },
      deletedAt: null,
    }).select("_id name");

    const resourceMap = new Map(
      resources.map((resource) => [resource.name, resource._id]),
    );

    const operations = permissionsToSeed.map((perm) => ({
      updateOne: {
        filter: { slug: perm.slug },
        update: { 
          $set: { 
            name: perm.name,           // Adds the new field
            description: perm.description,
            resourceId: resourceMap.get(perm.group),
            status: "active",
          },
        },
        upsert: true,
      },
    }));

    await Permission.bulkWrite(operations);

    await Role.findOneAndUpdate(
      { name: "super-admin" },
      {
        $addToSet: {
          permissions: { $each: permissionsToSeed.map((perm) => perm.slug) },
        },
      },
    );

    return NextResponse.json({ success: true, message: "Permissions updated with names successfully!" });
    
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to seed permissions" },
      { status: 500 },
    );
  }
}
