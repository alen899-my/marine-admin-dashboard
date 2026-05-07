import TablePageSkeleton from "@/components/skeletons/TablePageSkeleton";

export default function Loading() {
  return (
    <TablePageSkeleton
      columnCount={8}
      rowCount={10}
      isComplex={true}
      hasFilter={false}
      hasExport={false}
      hasAdd={false}
    />
  );
}
