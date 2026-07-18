import type { Metadata } from "next";
import ApartmentExample from "../apartment/page";

export const metadata: Metadata = {
  title: "Mid-century Modern living room",
  alternates: { canonical: "/examples/apartment" },
  robots: { index: false, follow: true },
};

export default ApartmentExample;
