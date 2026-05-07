import TablePageSkeleton from "@/components/skeletons/TablePageSkeleton";

export default function Loading() {
  return (
    <TablePageSkeleton
      columnCount={4}
      rowCount={12}
      isComplex={false}
      hasFilter={true}
      hasExport={false}
      hasAdd={true}
    />
  );
}
