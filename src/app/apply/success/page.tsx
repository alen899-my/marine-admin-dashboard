import { Metadata } from "next";
import { CheckCircle2, ArrowLeft, Copy } from "lucide-react";

export const metadata: Metadata = {
    title: "Application Submitted",
    description: "Your crew application has been submitted successfully.",
};

interface PageProps {
    searchParams: Promise<{ token?: string }>;
}

export default async function SuccessPage({ searchParams }: PageProps) {
    const { token } = await searchParams;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-lg mx-auto text-center space-y-6">
                {/* Success icon */}
                <div className="flex justify-center">
                    <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                        <CheckCircle2 className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                    </div>
                </div>

                {/* Heading */}
                <div className="space-y-2">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                        Application Submitted!
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base max-w-md mx-auto">
                        Thank you for submitting your crew application. Our team will review
                        your details and get back to you shortly.
                    </p>
                </div>

                {/* Tracking token */}
                {token && (
                    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4 space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                            Submission Reference
                        </p>
                        <p className="text-sm font-mono text-gray-700 dark:text-gray-300 break-all select-all">
                            {token}
                        </p>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500">
                            Save this reference for your records.
                        </p>
                    </div>
                )}

                {/* What's next */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-5 text-left space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        What happens next?
                    </p>
                    <ol className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <li className="flex items-start gap-2">
                            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-500/20 text-[10px] font-bold text-brand-600 dark:text-brand-400 mt-0.5">
                                1
                            </span>
                            <span>Our recruitment team will review your application.</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-500/20 text-[10px] font-bold text-brand-600 dark:text-brand-400 mt-0.5">
                                2
                            </span>
                            <span>
                                If your profile matches our requirements, you will be contacted.
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-500/20 text-[10px] font-bold text-brand-600 dark:text-brand-400 mt-0.5">
                                3
                            </span>
                            <span>
                                You may be asked to provide additional documents or attend an
                                interview.
                            </span>
                        </li>
                    </ol>
                </div>

                {/* Back link */}
                <div className="pt-2">
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        You may now close this page.
                    </p>
                </div>
            </div>
        </div>
    );
}
