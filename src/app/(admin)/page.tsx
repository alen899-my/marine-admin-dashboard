import { Metrics } from "@/components/dashboard/Metrics";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Parkora Falcon",
};

export default function Ecommerce() {
  return (
      <div >
        <Metrics />
      </div>
  );
}
