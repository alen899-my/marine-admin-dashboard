import TablePageSkeleton from "@/components/skeletons/TablePageSkeleton";

export default function Loading() {
  return (
    <TablePageSkeleton
      columnCount={8}
      rowCount={20}
      isComplex={true}
      hasFilter={true}
      hasExport={false}
      hasAdd={false}
    />
  );
}
