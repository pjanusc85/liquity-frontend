export function generateStaticParams() {
  return [
    { collateral: "eth" },
    { collateral: "reth" },
    { collateral: "wsteth" },
    { collateral: "cbbtc" },
  ];
}

export default function BorrowCollateralPage() {
  // see layout in parent folder
  return null;
}
