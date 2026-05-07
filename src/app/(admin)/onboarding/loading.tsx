import TablePageSkeleton from "@/components/skeletons/TablePageSkeleton";

export default function Loading() {
  return (
    <TablePageSkeleton
      columnCount={5}
      rowCount={20}
      isComplex={true}
      hasFilter={true}
      hasExport={false}
      hasAdd={false}
    />
  );
}
