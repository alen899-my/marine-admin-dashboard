// src/app/(admin)/jobs/apply/page.tsx
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import CrewApplicationForm from "@/components/Jobs/Application"; 
import ComponentCard from "@/components/common/ComponentCard";

export default async function NewApplicationPage() {
  const session = await auth();

  // Guard: Ensure user is logged in
  if (!session?.user) {
    redirect("/auth/signin");
  }

  const user = session.user;
  const companyId = user.company?.id;

  if (!companyId) {
    return (
      <div className="p-6 text-red-500 bg-red-50 rounded-lg">
        <p>
        Error: Your account is not linked to a company. You cannot create applications.
      </p>
      </div>
    );
  }

  return (
    <div className=" mx-auto py-">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          New Crew Application
        </h1>
        <p className="text-gray-500 text-sm">
          Fill in the details below to register a new crew member for {user.company?.name}.
        </p>
      </div>

  
        {/* Pass the companyId and adminId to your form 
           so the Server Action knows who is creating it 
        */}
        <CrewApplicationForm
          companyId={companyId} 
        
     
        />
     
    </div>
  );
}