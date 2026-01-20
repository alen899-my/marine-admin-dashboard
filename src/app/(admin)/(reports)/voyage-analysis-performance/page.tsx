// "use client";

// import ComponentCard from "@/components/common/ComponentCard";
// import Button from "@/components/ui/button/Button";
// import { useAuthorization } from "@/hooks/useAuthorization";
// import {
//   Activity,
//   FileJson,
//   Fuel,
//   Navigation,
//   Plus,
//   Timer,
//   Trash2,
// } from "lucide-react";
// import React, { useMemo, useState } from "react";

// // --- Types ---
// interface NoonReportRow {
//   noonDt: string;
//   noonNm: number | "";
//   noonHrs: number | "";
//   noonNote: string;
// }

// // --- Utilities ---
// const formatNum = (n: number, d = 2) => {
//   if (!isFinite(n) || isNaN(n)) return "—";
//   return Number(n).toFixed(d);
// };

// const humanLegTime = (ms: number) => {
//   if (!isFinite(ms) || ms <= 0) return "—";
//   const totalMin = Math.round(ms / 60000);
//   const d = Math.floor(totalMin / (60 * 24));
//   const h = Math.floor((totalMin - d * 60 * 24) / 60);
//   const m = totalMin - d * 60 * 24 - h * 60;
//   return `${d}d ${h}h ${m}m`;
// };

// export default function VoyageAnalysisPage() {
//   const { isReady, can } = useAuthorization();

//   // --- Form State ---
//   const [vessel, setVessel] = useState("Sree Test");
//   const [legId, setLegId] = useState("");
//   const [depDt, setDepDt] = useState("");
//   const [arrDt, setArrDt] = useState("");
//   const [rfaDt, setRfaDt] = useState("");
//   const [plannedNm, setPlannedNm] = useState<number | "">("");

//   const [depVlsfo, setDepVlsfo] = useState<number | "">("");
//   const [arrVlsfo, setArrVlsfo] = useState<number | "">("");
//   const [depLsmgo, setDepLsmgo] = useState<number | "">("");
//   const [arrLsmgo, setArrLsmgo] = useState<number | "">("");

//   const [noonReports, setNoonReports] = useState<NoonReportRow[]>([
//     { noonDt: "", noonNm: "", noonHrs: "", noonNote: "" },
//     { noonDt: "", noonNm: "", noonHrs: "", noonNote: "" },
//   ]);

//   // --- Live Calculations ---
//   const kpis = useMemo(() => {
//     const depMs = depDt ? new Date(depDt).getTime() : NaN;
//     const arrMs = arrDt ? new Date(arrDt).getTime() : NaN;
//     const legMs = isFinite(depMs) && isFinite(arrMs) ? arrMs - depMs : NaN;
//     const legDays = legMs / (1000 * 60 * 60 * 24);

//     const totalNm = noonReports.reduce(
//       (acc, curr) => acc + (Number(curr.noonNm) || 0),
//       0
//     );
//     const totalSteamHrs = noonReports.reduce(
//       (acc, curr) => acc + (Number(curr.noonHrs) || 0),
//       0
//     );
//     const avgSpeed = totalSteamHrs > 0 ? totalNm / totalSteamHrs : NaN;

//     const vlsfoUsed =
//       Number(depVlsfo) && Number(arrVlsfo)
//         ? Number(depVlsfo) - Number(arrVlsfo)
//         : NaN;
//     const lsmgoUsed =
//       Number(depLsmgo) && Number(arrLsmgo)
//         ? Number(depLsmgo) - Number(arrLsmgo)
//         : NaN;

//     return {
//       legMs,
//       legDays,
//       totalNm,
//       totalSteamHrs,
//       avgSpeed,
//       vlsfoUsed,
//       lsmgoUsed,
//       vlsfoDay: vlsfoUsed / legDays,
//       lsmgoDay: lsmgoUsed / legDays,
//     };
//   }, [depDt, arrDt, depVlsfo, arrVlsfo, depLsmgo, arrLsmgo, noonReports]);

//   // --- Handlers ---
//   const handleAddRow = () => {
//     setNoonReports([
//       ...noonReports,
//       { noonDt: "", noonNm: "", noonHrs: "", noonNote: "" },
//     ]);
//   };

//   const handleRemoveRow = () => {
//     if (noonReports.length > 1) {
//       setNoonReports(noonReports.slice(0, -1));
//     }
//   };

//   const updateNoonRow = (
//     index: number,
//     field: keyof NoonReportRow,
//     value: any
//   ) => {
//     const updated = [...noonReports];
//     updated[index] = { ...updated[index], [field]: value };
//     setNoonReports(updated);
//   };

//   const fillDemoData = () => {
//     const now = new Date();
//     const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
//     const formatDate = (d: Date) => d.toISOString().slice(0, 16);

//     setVessel("Sree Test");
//     setLegId("KF-LEG-001");
//     setDepDt(formatDate(fourDaysAgo));
//     setArrDt(formatDate(now));
//     setPlannedNm(690);
//     setDepVlsfo(450);
//     setArrVlsfo(410);
//     setDepLsmgo(45);
//     setArrLsmgo(38.5);
//     setNoonReports([
//       {
//         noonDt: formatDate(new Date(fourDaysAgo.getTime() + 1 * 86400000)),
//         noonNm: 240,
//         noonHrs: 23.5,
//         noonNote: "Good weather",
//       },
//       {
//         noonDt: formatDate(new Date(fourDaysAgo.getTime() + 2 * 86400000)),
//         noonNm: 255,
//         noonHrs: 24.0,
//         noonNote: "Normal",
//       },
//     ]);
//   };

//   // if (!isReady) return null;
//   // if (!can("voyage_analysis.view")) return <div className="p-10 text-center dark:text-gray-500">Unauthorized</div>;

//   return (
//     <div className="space-y-6 pb-10">
//       {/* Header */}
//       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
//         <div>
//           <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
//             Voyage Analysis / Performance Report
//           </h1>
//           <p className="text-sm text-gray-500">
//             Combines Departure + Daily Noon + Arrival to auto-calculate: total
//             time, total distance, speed made good, total fuel consumed
//             (VLSFO/LSMGO), and average daily consumption.
//           </p>
//         </div>
//         <div className="flex gap-2">
//           <Button 
//     variant="primary" 
//     startIcon={<FileJson size={25} />}
//     // Add your export logic here
//   >
//     Export JSON
//   </Button>
//         </div>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
//         {/* Left Column: Forms */}
//         <div className="lg:col-span-8 space-y-6">
//           <ComponentCard title="Leg Setup (Departure → Arrival)">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="space-y-1">
//                 <label className="text-xs font-medium text-gray-500 uppercase">
//                   Vessel
//                 </label>
//                 <select
//                   className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
//                   value={vessel}
//                   onChange={(e) => setVessel(e.target.value)}
//                 >
//                   <option value="Sree Test">Sree Test</option>
//                   <option value="Vessel A">Vessel A</option>
//                 </select>
//               </div>
//               <div className="space-y-1">
//                 <label className="text-xs font-medium text-gray-500 uppercase">
//                   Voyage Leg ID
//                 </label>
//                 <input
//                   type="text"
//                   className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
//                   placeholder="e.g. KF-LEG-001"
//                   value={legId}
//                   onChange={(e) => setLegId(e.target.value)}
//                 />
//               </div>
//               <div className="space-y-1">
//                 <label className="text-xs font-medium text-gray-500 uppercase">
//                   Departure Date
//                 </label>
//                 <input
//                   type="datetime-local"
//                   className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
//                   value={depDt}
//                   onChange={(e) => setDepDt(e.target.value)}
//                 />
//               </div>
//               <div className="space-y-1">
//                 <label className="text-xs font-medium text-gray-500 uppercase">
//                   Arrival Date
//                 </label>
//                 <input
//                   type="datetime-local"
//                   className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
//                   value={arrDt}
//                   onChange={(e) => setArrDt(e.target.value)}
//                 />
//               </div>

//               <hr className="md:col-span-2 border-gray-100 dark:border-gray-800" />

//               <div className="space-y-1">
//                 <label className="text-xs font-medium text-gray-500 uppercase">
//                   Dep ROB VLSFO (MT)
//                 </label>
//                 <input
//                   type="number"
//                   className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
//                   value={depVlsfo}
//                   onChange={(e) => setDepVlsfo(e.target.valueAsNumber || "")}
//                 />
//               </div>
//               <div className="space-y-1">
//                 <label className="text-xs font-medium text-gray-500 uppercase">
//                   Arr ROB VLSFO (MT)
//                 </label>
//                 <input
//                   type="number"
//                   className="w-full p-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
//                   value={arrVlsfo}
//                   onChange={(e) => setArrVlsfo(e.target.valueAsNumber || "")}
//                 />
//               </div>
//             </div>
//           </ComponentCard>

//           <ComponentCard
//             title={
//               <div className="flex items-center justify-between w-full">
//                 <h3 className="font-semibold">Daily Noon Reports</h3>
//                 <div className="flex gap-2">
//                   <button onClick={handleAddRow} className="...">
//                     <Plus size={14} /> Add
//                   </button>
//                   <button onClick={handleRemoveRow} className="...">
//                     <Trash2 size={14} /> Remove
//                   </button>
//                 </div>
//               </div>
//             }
//             headerClassName="flex justify-between items-center"
//           >
//             <div className="overflow-x-auto">
//               <table className="w-full text-left border-collapse">
//                 <thead>
//                   <tr className="border-b dark:border-gray-800">
//                     <th className="py-2 text-xs text-gray-400 uppercase">
//                       Date & Time
//                     </th>
//                     <th className="py-2 text-xs text-gray-400 uppercase">
//                       Distance (NM)
//                     </th>
//                     <th className="py-2 text-xs text-gray-400 uppercase">
//                       Steam (Hrs)
//                     </th>
//                     <th className="py-2 text-xs text-gray-400 uppercase">
//                       Notes
//                     </th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {noonReports.map((row, idx) => (
//                     <tr
//                       key={idx}
//                       className="border-b dark:border-gray-800 last:border-0"
//                     >
//                       <td className="py-2 pr-2">
//                         <input
//                           type="datetime-local"
//                           className="bg-transparent text-sm w-full"
//                           value={row.noonDt}
//                           onChange={(e) =>
//                             updateNoonRow(idx, "noonDt", e.target.value)
//                           }
//                         />
//                       </td>
//                       <td className="py-2 pr-2">
//                         <input
//                           type="number"
//                           className="bg-transparent text-sm w-24"
//                           placeholder="0.0"
//                           value={row.noonNm}
//                           onChange={(e) =>
//                             updateNoonRow(idx, "noonNm", e.target.valueAsNumber)
//                           }
//                         />
//                       </td>
//                       <td className="py-2 pr-2">
//                         <input
//                           type="number"
//                           className="bg-transparent text-sm w-24"
//                           placeholder="24.0"
//                           value={row.noonHrs}
//                           onChange={(e) =>
//                             updateNoonRow(
//                               idx,
//                               "noonHrs",
//                               e.target.valueAsNumber
//                             )
//                           }
//                         />
//                       </td>
//                       <td className="py-2">
//                         <input
//                           type="text"
//                           className="bg-transparent text-sm w-full"
//                           placeholder="..."
//                           value={row.noonNote}
//                           onChange={(e) =>
//                             updateNoonRow(idx, "noonNote", e.target.value)
//                           }
//                         />
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </ComponentCard>
//         </div>

//         {/* Right Column: KPIs */}
//         <div className="lg:col-span-4 space-y-6">
//           <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl p-6 shadow-sm sticky top-6">
//             <div className="flex items-center justify-between mb-6">
//               <h3 className="font-bold text-lg">Live KPI Summary</h3>
//               <span
//                 className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
//                   kpis.legMs > 0
//                     ? "bg-green-100 text-green-700"
//                     : "bg-yellow-100 text-yellow-700"
//                 }`}
//               >
//                 {kpis.legMs > 0 ? "Ready" : "Pending Dates"}
//               </span>
//             </div>

//             <div className="space-y-6">
//               <KPIRow
//                 icon={<Timer className="text-blue-500" />}
//                 label="Total Leg Time"
//                 value={humanLegTime(kpis.legMs)}
//                 subValue={
//                   kpis.legDays > 0 ? `${formatNum(kpis.legDays)} Days` : ""
//                 }
//               />
//               <KPIRow
//                 icon={<Navigation className="text-teal-500" />}
//                 label="Distance Made Good"
//                 value={`${formatNum(kpis.totalNm, 1)} NM`}
//                 subValue="Total from Noon Reports"
//               />
//               <KPIRow
//                 icon={<Activity className="text-orange-500" />}
//                 label="Avg Speed Made Good"
//                 value={`${formatNum(kpis.avgSpeed)} Knots`}
//                 subValue={`${formatNum(kpis.totalNm, 1)} NM / ${formatNum(
//                   kpis.totalSteamHrs,
//                   1
//                 )} Hrs`}
//               />
//               <KPIRow
//                 icon={<Fuel className="text-purple-500" />}
//                 label="Fuel Consumed (VLSFO)"
//                 value={`${formatNum(kpis.vlsfoUsed)} MT`}
//                 subValue={
//                   kpis.vlsfoDay > 0
//                     ? `${formatNum(kpis.vlsfoDay)} MT / Day`
//                     : ""
//                 }
//               />
//             </div>

//             <div className="mt-8 pt-6 border-t dark:border-gray-800 text-[11px] text-gray-400 leading-relaxed">
//               * Calculations are updated in real-time. Performance is based on
//               actual steaming hours reported at sea.
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// // --- Sub-components ---
// function KPIRow({
//   icon,
//   label,
//   value,
//   subValue,
// }: {
//   icon: React.ReactNode;
//   label: string;
//   value: string;
//   subValue: string;
// }) {
//   return (
//     <div className="flex gap-4">
//       <div className="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
//         {icon}
//       </div>
//       <div>
//         <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
//           {label}
//         </p>
//         <p className="text-xl font-black dark:text-white">{value}</p>
//         <p className="text-xs text-gray-500">{subValue}</p>
//       </div>
//     </div>
//   );
// }
