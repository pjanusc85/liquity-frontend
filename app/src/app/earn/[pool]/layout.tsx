import { EarnPoolScreen } from "@/src/screens/EarnPoolScreen/EarnPoolScreen";
import { SboldPoolScreen } from "@/src/screens/EarnPoolScreen/SboldPoolScreen";

export function generateStaticParams() {
  return [
    { pool: "eth" },
    { pool: "reth" },
    { pool: "wsteth" },
    { pool: "cbbtc" },
    { pool: "sbold" },
  ];
}

export default async function Layout({
  params,
}: {
  params: Promise<{
    pool: "eth" | "reth" | "wsteth" | "cbbtc" | "sbold";
  }>;
}) {
  const { pool } = await params;
  return pool === "sbold"
    ? <SboldPoolScreen />
    : <EarnPoolScreen />;
}
