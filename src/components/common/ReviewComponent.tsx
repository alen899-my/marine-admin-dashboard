import React from "react";
import { 
  User, Ship, FileText, Globe, CreditCard, 
  CheckCircle2, AlertCircle, FileCheck 
} from "lucide-react";

// ─── UTILS: Format camelCase to Title Case (e.g. "firstName" -> "First Name")
const formatLabel = (key: string) => {
  const result = key.replace(/([A-Z])/g, " $1");
  return result.charAt(0).toUpperCase() + result.slice(1);
};

// ─── COMPONENT: A Single Data Point
const DataPoint = ({ label, value }: { label: string; value: any }) => {
  if (value === null || value === undefined || value === "") return null;
  
  // Format Date strings to be human-readable
  let displayValue = value;
  if (typeof value === "string" && value.includes("T") && !isNaN(Date.parse(value))) {
    displayValue = new Date(value).toLocaleDateString();
  }

  return (
    <div className="flex flex-col py-2 border-b border-gray-50 last:border-0 dark:border-gray-800/50">
      <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
        {formatLabel(label)}
      </span>
      <span className="text-sm font-medium text-gray-800 dark:text-gray-200 break-words">
        {typeof value === "object" ? "File Attached" : displayValue}
      </span>
    </div>
  );
};

// ─── COMPONENT: A Section Card
const ReviewSection = ({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) => (
  <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
    <div className="flex items-center gap-2 bg-gray-50/50 px-5 py-3 border-b border-gray-100 dark:bg-gray-800/30 dark:border-gray-800">
      <Icon size={16} className="text-brand-500" />
      <h3 className="text-xs font-bold uppercase tracking-tight text-gray-900 dark:text-white">{title}</h3>
    </div>
    <div className="p-5">{children}</div>
  </div>
);

// ─── MAIN REVIEW COMPONENT
export default function DynamicReview({ scalar, coc, coe, passports, seamans, visas, seaExp, extraDocs }: any) {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. SCALAR FIELDS (Personal Info) */}
      <ReviewSection title="Personal & Contact Information" icon={User}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8">
          {Object.entries(scalar).map(([key, val]) => (
            <DataPoint key={key} label={key} value={val} />
          ))}
        </div>
      </ReviewSection>

      {/* 2. ARRAY FIELDS (Mapped Dynamically) */}
      {[
        { data: coc.items, title: "Certificates of Competency", icon: CreditCard },
        { data: coe.items, title: "Certificates of Equivalent", icon: CreditCard },
        { data: passports.items, title: "Passports", icon: Globe },
        { data: seamans.items, title: "Seaman's Books", icon: Ship },
        { data: seaExp.items, title: "Sea Experience", icon: Ship },
      ].map((section, idx) => (
        section.data.length > 0 && (
          <ReviewSection key={idx} title={section.title} icon={section.icon}>
            <div className="space-y-6">
              {section.data.map((item: any, itemIdx: number) => (
                <div key={itemIdx} className="relative pl-4 border-l-2 border-brand-200 dark:border-brand-900">
                  <span className="absolute -left-[9px] top-0 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[8px] font-bold text-white">
                    {itemIdx + 1}
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6">
                    {Object.entries(item).map(([k, v]) => (
                      <DataPoint key={k} label={k} value={v} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ReviewSection>
        )
      ))}

      {/* 3. ATTACHMENTS CHECKLIST */}
      <ReviewSection title="Document Upload Status" icon={FileCheck}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FileStatus label="Profile Photo" file={scalar.profilePhoto} />
          <FileStatus label="Resume / CV" file={scalar.resume} />
          {extraDocs.items.map((doc: any, i: number) => (
            <FileStatus key={i} label={doc.name || `Extra Doc ${i+1}`} file={doc.file} />
          ))}
        </div>
      </ReviewSection>

      
    </div>
  );
}

const FileStatus = ({ label, file }: { label: string; file: any }) => (
  <div className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-gray-800">
    <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
    {file ? (
      <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 uppercase tracking-tighter">
        <CheckCircle2 size={14} /> Attached
      </span>
    ) : (
      <span className="flex items-center gap-1 text-xs font-bold text-red-500 uppercase tracking-tighter">
        <AlertCircle size={14} /> Missing
      </span>
    )}
  </div>
);