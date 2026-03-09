import { Metadata } from "next";
import UserGuideContent from "@/components/user-guide/UserGuideContent";

export const metadata: Metadata = {
  title: "User Guide | Parkora Falcon",
  description:
    "A comprehensive guide to using the Parkora Falcon Maritime Admin system.",
};

export default function UserGuidePage() {
  return <UserGuideContent />;
}
