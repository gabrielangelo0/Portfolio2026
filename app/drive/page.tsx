import type { Metadata } from "next";
import { Scene } from "@/components/Scene";
import { profile } from "@/lib/data";

export const metadata: Metadata = {
  title: `${profile.name} — Interactive 3D portfolio`,
  description: `Drive through a valley and read the work along the way: ${profile.name}'s portfolio as a small driving game.`,
};

export default function DrivePage() {
  return <Scene />;
}
