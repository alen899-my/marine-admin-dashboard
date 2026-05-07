export interface MetricsData {
  // Current totals
  dailyNoon: number;
  departure: number;
  arrival: number;
  nor: number;
  cargoStowage: number;
  cargoDocuments: number;
  vesselCount: number;
  voyageCount: number;
  userCount: number;
  companyCount: number;
  candidateCount: number;
  activeCrewCount: number;
  openPayrollCount: number;
  pendingLeaveCount: number;
  activeContractCount: number;

  // Trend percentages (vs last week)
  vesselTrend: number;
  crewTrend: number;
  candidateTrend: number;
  payrollTrend: number;
  pendingLeaveTrend: number;
  noonTrend: number;
  departureTrend: number;
  arrivalTrend: number;
  norTrend: number;
  stowageTrend: number;
  cargoDocTrend: number;
  voyageTrend: number;
  contractTrend: number;
  userTrend: number;
  companyTrend: number;

  // Sparkline data (8 weeks of history)
  vesselSparkline: number[];
  crewSparkline: number[];
  candidateSparkline: number[];
  payrollSparkline: number[];
  pendingLeaveSparkline: number[];
  noonSparkline: number[];
  departureSparkline: number[];
  arrivalSparkline: number[];
  norSparkline: number[];
  stowageSparkline: number[];
  cargoDocSparkline: number[];
  voyageSparkline: number[];
  contractSparkline: number[];
  userSparkline: number[];
  companySparkline: number[];
}
