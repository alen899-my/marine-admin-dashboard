import { Metadata } from "next";
import { auth } from "@/auth";
import UserGuideContent from "@/components/user-guide/UserGuideContent";
import { getActiveUserGuides } from "@/lib/services/userGuideService";

export const metadata: Metadata = {
  title: "User Guide | Parkora Falcon",
  description:
    "A comprehensive guide to using the Parkora Falcon Maritime Admin system.",
};

export default async function UserGuidePage() {
  const session = await auth();
  const role = session?.user?.role as string | undefined;
  const sections = await getActiveUserGuides(role);

  return <UserGuideContent sections={sections} />;
}
