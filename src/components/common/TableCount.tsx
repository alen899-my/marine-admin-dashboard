interface TableCountProps {
  count: number;
  label?: string;
  loading?: boolean;
}

export default function TableCount({ count, label = "Items", loading }: TableCountProps) {
  if (loading) {
    return (
      <div className="h-5 w-20 bg-gray-100 dark:bg-white/5 animate-pulse rounded-md" />
    );
  }

  return (
    <div className="flex gap-1.5 p-1 px-2 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 w-fit text-center">
      <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
        {count.toLocaleString()}
      </span>
      <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}