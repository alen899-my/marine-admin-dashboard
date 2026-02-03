import TablePageSkeleton from "@/components/skeletons/TablePageSkeleton";

export default function Loading() {
  return (
    <TablePageSkeleton 
      columnCount={3}   // Matches your 8 data columns
      rowCount={20}      // 6 rows look good on most screens
      isComplex={false}  // Renders double-lines for "Navigation/Fuel" feel
      hasFilter={true}
      hasExport={false}
      hasAdd={true}
    />
  );
}