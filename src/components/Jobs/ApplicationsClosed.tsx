import Image from "next/image";

interface Props {
  logo?: string;
  name: string;
  message: string;
}

export default function ApplicationsClosed({ logo, name, message }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-6">
      <div className="text-center max-w-md">
        {logo && (
          <Image
            src={logo}
            alt={name}
            width={80}
            height={80}
            className="mx-auto mb-4 rounded-lg object-contain"
          />
        )}
        <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-2">
          Applications Closed
        </h1>
        <p className="text-gray-500 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}