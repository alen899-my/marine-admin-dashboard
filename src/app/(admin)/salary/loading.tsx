import TablePageSkeleton from "@/components/skeletons/TablePageSkeleton";

export default function Loading() {
  return (
    <TablePageSkeleton
      columnCount={11}
      rowCount={12}
      isComplex={true}
      hasFilter={true}
      hasExport={false}
      hasAdd={false}
    />
  );
}
