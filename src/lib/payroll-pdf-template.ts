import { formatCurrency } from "./formatCurrency";
import { MonetaryEntry } from "./monetaryEntries";
import { PayrollLeaveTypeOption, PayrollRow } from "./payroll";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function generatePayrollHtml(
  row: PayrollRow,
  leaveTypes: PayrollLeaveTypeOption[],
  currencyCode: string = "INR",
  currencySettings?: {
    currencyPosition: "left" | "right";
    currencyFormatType: "symbol" | "code";
    currencySpace: boolean;
  },
) {
  const formatValue = (value: number) =>
    formatCurrency(value, currencyCode, { currencySettings });

  const formatEntryValue = (value: number, type = "amount") =>
    type === "percent" ? `${value}%` : formatValue(value);

  const formatDate = (value: string) => {
    if (!value) return "—";
    return new Date(`${value}T00:00:00`).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const formatDateTime = (value: string | Date | undefined) => {
    if (!value) return "—";
    const parsed = new Date(value as string);
    if (Number.isNaN(parsed.getTime())) return "—";
    return parsed.toLocaleString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getProratedSum = (
    entries: MonetaryEntry[],
    otherAmount: PayrollRow["contractOtherAllowance"] | null = null,
  ) => {
    let sum = 0;
    if (otherAmount) {
      const isObj = typeof otherAmount === "object" && otherAmount !== null;
      const val = isObj ? otherAmount.value : otherAmount;
      const type = isObj ? otherAmount.type : "amount";
      const numericVal = Number(val) || 0;
      if (type === "percent") sum += (numericVal / 100) * row.basic;
      else sum += numericVal;
    }
    for (const entry of entries) {
      if (entry.type === "percent") sum += (entry.value / 100) * row.basic;
      else sum += Number(entry.value) || 0;
    }
    return formatValue(sum * row.prorationFactor);
  };

  const getNonProratedSum = (entries: MonetaryEntry[]) => {
    let sum = 0;
    for (const entry of entries) {
      if (entry.type === "percent") sum += (entry.value / 100) * row.basic;
      else sum += Number(entry.value) || 0;
    }
    return formatValue(sum);
  };

  const earningGroups = [
    {
      label: "Total Contract Allowance",
      total: getProratedSum(row.contractAllowances, row.contractOtherAllowance),
      items: [
        ...(() => {
          const other = row.contractOtherAllowance;
          const isObj = typeof other === "object" && other !== null;
          const val = isObj ? other.value : other;
          const type = isObj ? other.type : "amount";
          const numericVal = Number(val) || 0;
          if (numericVal <= 0) return [];
          return [
            {
              label: "Other Allowance",
              value: formatEntryValue(numericVal, type),
            },
          ];
        })(),
        ...row.contractAllowances.map((entry) => ({
          label: entry.label,
          value: formatEntryValue(entry.value, entry.type),
        })),
      ],
    },
    {
      label: "Total Salary Head Allowance",
      total: getProratedSum(row.salaryHeadAllowances),
      items: row.salaryHeadAllowances.map((entry) => ({
        label: entry.label,
        value: formatEntryValue(entry.value, entry.type),
      })),
    },
    {
      label: "Total Crew Allowance",
      total: getNonProratedSum(row.crewAllowances),
      items: row.crewAllowances.map((entry) => ({
        label: entry.label,
        value: formatEntryValue(entry.value, entry.type),
      })),
    },
  ].filter((group) => group.items.length > 0);

  const deductionGroups = [
    {
      label: "Total Salary Head Deduction",
      total: getProratedSum(row.salaryHeadDeductions),
      items: row.salaryHeadDeductions.map((entry) => ({
        label: entry.label,
        value: formatEntryValue(entry.value, entry.type),
      })),
    },
    {
      label: "Total Crew Deduction",
      total: getNonProratedSum(row.crewDeductions),
      items: row.crewDeductions.map((entry) => ({
        label: entry.label,
        value: formatEntryValue(entry.value, entry.type),
      })),
    },
  ].filter((group) => group.items.length > 0);

  const leaveRows = leaveTypes.map((leaveType) => {
    const entry = row.leaveEntries.find(
      (item) => item.leaveTypeId === leaveType.id,
    );
    const leaveDays = entry?.days || 0;
    const maxPolicyLeave = entry?.leaveTypeMaxDays ?? leaveType.maxDays;
    const approvedPaidDays = Math.min(
      leaveDays,
      entry?.approvedDays ?? entry?.leaveTypeMaxDays ?? leaveType.maxDays,
    );
    const deductedDays = Math.max(0, leaveDays - approvedPaidDays);

    return {
      label: leaveType.name,
      maxPolicyLeave,
      leaveDays,
      approvedPaidDays,
      deductedDays,
    };
  });

  const renderGroupRows = (
    groups: Array<{
      label: string;
      total: string;
      items: { label: string; value: string }[];
    }>,
    isDeduction = false,
  ) =>
    groups
      .map(
        (group) => `
          <tr class="group-row">
            <td>${escapeHtml(group.label)}</td>
            <td class="amount ${isDeduction ? "deduction-text" : "earnings-text"}">${escapeHtml(group.total)}</td>
          </tr>
          ${group.items
            .map(
              (item) => `
                <tr class="sub-row">
                  <td class="sub-item">${escapeHtml(item.label)}</td>
                  <td class="amount sub-amount ${isDeduction ? "deduction-text" : ""}">${escapeHtml(item.value)}</td>
                </tr>
              `,
            )
            .join("")}
        `,
      )
      .join("");

  const remarksSection = row.remarks
    ? `
      <div class="remarks-block">
        <div class="remarks-label">Remarks</div>
        <div class="remarks-value">${escapeHtml(row.remarks)}</div>
      </div>
    `
    : "";

  const approvalSection = `
    <div class="section">
      <div class="section-title">Approval Details</div>
      <div class="approval-grid-pdf">
        <div class="approval-card">
          <div class="approval-copy">
            <div class="info-label">Captain Verification</div>
            <div class="info-value">${escapeHtml(
              row.verifiedByName || "Pending Verification",
            )}</div>
            ${
              row.verifiedByName
                ? `<div class="info-sub">${escapeHtml(formatDateTime(row.verifiedAt))}</div>`
                : ""
            }
          </div>
        </div>
        <div class="approval-card">
          <div class="approval-copy">
            <div class="info-label">Finance Approval</div>
            <div class="info-value">${escapeHtml(
              row.approvedByName || "Pending Approval",
            )}</div>
            ${
              row.approvedByName
                ? `<div class="info-sub">${escapeHtml(formatDateTime(row.approvedAt))}</div>`
                : ""
            }
          </div>
        </div>
      </div>
    </div>
  `;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <style>
    @page {
      size: A4;
      margin: 12mm 12mm 12mm 12mm;
    }

    :root {
      --font-heading: Outfit, "Segoe UI", Arial, sans-serif;
      --font-body:    Outfit, "Segoe UI", Arial, sans-serif;

      /* Project brand — teal */
      --accent:        #006F7D;
      --accent-mid:    #008A9B;
      --accent-bright: #00A6B8;
      --accent-light:  #E6F9FB;
      --accent-border: #C0F0F4;

      /* Project gray scale (matches globals.css exactly) */
      --gray-25:  #fcfcfd;
      --gray-50:  #f9fafb;
      --gray-100: #f2f4f7;
      --gray-200: #e4e7ec;
      --gray-300: #d0d5dd;
      --gray-400: #98a2b3;
      --gray-500: #667085;
      --gray-600: #475467;
      --gray-700: #344054;
      --gray-800: #1d2939;
      --gray-900: #101828;

      /* Semantic */
      --green: #027a48;
      --red:   #b42318;

      /* Legacy aliases — keeps every existing var(--color-*) working */
      --color-brand-25:    #F0FCFD;
      --color-brand-50:    var(--accent-light);
      --color-brand-100:   var(--accent-border);
      --color-brand-500:   var(--accent-bright);
      --color-brand-600:   var(--accent-mid);
      --color-brand-700:   var(--accent);
      --color-gray-25:     var(--gray-25);
      --color-gray-50:     var(--gray-50);
      --color-gray-100:    var(--gray-100);
      --color-gray-200:    var(--gray-200);
      --color-gray-300:    var(--gray-300);
      --color-gray-400:    var(--gray-400);
      --color-gray-500:    var(--gray-500);
      --color-gray-600:    var(--gray-600);
      --color-gray-700:    var(--gray-700);
      --color-gray-800:    var(--gray-800);
      --color-gray-900:    var(--gray-900);
      --color-success-50:  #ecfdf3;
      --color-success-500: #12b76a;
      --color-success-600: #039855;
      --color-success-700: var(--green);
      --color-error-600:   #d92d20;
      --color-error-700:   var(--red);
      --shadow-theme-sm:
        0px 1px 3px 0px rgba(16, 24, 40, 0.1),
        0px 1px 2px 0px rgba(16, 24, 40, 0.06);
    }

    @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&display=swap');

    html {
      box-sizing: border-box;
    }

    *, *:before, *:after {
      box-sizing: inherit;
    }

    body {
      margin: 0;
      padding-left: 2px;
      padding-right: 8px; /* Extra breathing room on the right */
      overflow-x: hidden;
      font-family: var(--font-body);
      font-size: 9px;
      line-height: 1.45;
      color: var(--gray-700);
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    /* ── HEADER ─────────────────────────────────────────── */
    .doc-header {
      display: grid;
      grid-template-columns: 160px 1fr;
      align-items: center;
      gap: 16px;
      padding: 0 0 10px;
      margin-bottom: 10px;
      border-bottom: 2px solid var(--accent);
    }

    .doc-header-left {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      min-width: 0;
      min-height: 72px;
    }

    .company-logo {
      width: 130px;
      height: 68px;
      max-width: 130px;
      max-height: 68px;
      object-fit: contain;
      object-position: left center;
      display: block;
    }

    .company-meta {
      min-width: 0;
      text-align: right;
      align-self: flex-end;
      padding-bottom: 2px;
    }

    .doc-title {
      margin: 0;
      font-family: var(--font-heading);
      font-size: 17px;
      font-weight: 700;
      line-height: 1;
      color: var(--gray-900);
      letter-spacing: -0.025em;
    }

    .doc-subtitle {
      margin-top: 4px;
      font-size: 7.2px;
      font-weight: 600;
      letter-spacing: 0.16em;
      text-transform: uppercase;
      color: var(--accent-mid);
    }

    .company-name {
      margin: 6px 0 0;
      font-size: 8px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--gray-500);
    }

    .doc-meta-line {
      margin-top: 4px;
      font-size: 8px;
      color: var(--gray-500);
    }

    /* ── SECTION ─────────────────────────────────────────── */
    .section {
      margin-bottom: 10px;
      page-break-inside: avoid;
    }

    .section-title {
      margin: 0 0 6px;
      padding-bottom: 3px;
      font-family: var(--font-heading);
      font-size: 7.5px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      color: var(--accent);
      border-bottom: 1px solid var(--accent-border);
    }

    /* ── INFO GRIDS ──────────────────────────────────────── */
    .info-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px 14px;
    }

    .info-grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px 14px;
    }

    .info-label {
      margin-bottom: 2px;
      font-size: 7px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.13em;
      color: var(--gray-400);
    }

    .info-value {
      font-size: 9px;
      font-weight: 600;
      color: var(--gray-800);
      word-break: break-word;
    }

    .info-sub {
      margin-top: 2px;
      font-size: 7.5px;
      color: var(--gray-400);
    }

    /* ── APPROVAL CARDS ──────────────────────────────────── */
    .approval-grid-pdf {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      width: 100%;
    }

    .approval-card {
      display: block;
      min-height: 64px;
      padding: 8px 10px;
      border: 1px solid var(--gray-200);
      border-radius: 4px;
      background: var(--gray-25);
    }

    .approval-copy { min-width: 0; }

    /* ── EARNINGS & DEDUCTIONS WRAPPER ─────────────────── */
    .earnings-deductions-wrap {
      width: calc(100% - 2px);
      margin: 1px;
      border: 1px solid var(--gray-200);
      border-radius: 6px;
      overflow: hidden;
      background: #ffffff;
    }

    /* ── SPLIT EARNINGS / DEDUCTIONS TABLE ───────────────── */
    .split-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    .split-table td.panel-left,
    .split-table td.panel-right {
      width: 50%;
      vertical-align: top;
    }

    .split-table td.panel-left {
      border-right: 1px solid var(--gray-200);
    }

    .panel-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      padding: 5px 10px;
      background: var(--accent-light);
      border-bottom: 1px solid var(--accent-border);
    }

    .panel-head-label {
      font-size: 7.2px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: var(--accent);
    }

    .panel-body {
      padding: 6px 10px;
      background: #fff;
    }

    .line-table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    .line-table td {
      padding: 2.5px 0;
      vertical-align: middle;
      font-size: 9px;
      border-bottom: 0.5px solid var(--gray-100);
      color: var(--gray-600);
      word-break: break-word;
    }

    .line-table td.amount {
      width: 35%; /* Fixed width for amount column to ensure it doesn't push the table */
    }

    .line-table tr:last-child td { border-bottom: none; }

    .amount {
      text-align: right;
      font-weight: 600;
      white-space: nowrap;
      font-variant-numeric: tabular-nums;
    }

    .group-row td {
      padding-top: 6px;
      font-weight: 700;
      font-size: 9px;
      color: var(--gray-800);
      border-bottom: 0.5px solid var(--gray-200);
    }

    .group-row:first-child td { padding-top: 2px; }

    .sub-row td {
      color: var(--gray-500);
      font-size: 8.5px;
    }

    .sub-item { padding-left: 14px; }
    .sub-amount { font-weight: 500; color: var(--gray-600); }

    .earnings-text  { color: var(--green); }
    .deduction-text { color: var(--red);   }

    .muted-empty {
      padding: 12px 0;
      font-size: 8.5px;
      font-style: italic;
      text-align: center;
      color: var(--gray-400);
    }

    .panel-subtotal {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      padding: 4px 10px;
      font-size: 8.8px;
      background: var(--accent-light);
      border-top: 1px solid var(--accent-border);
      color: var(--accent);
    }

    .panel-total {
      display: flex;
      justify-content: space-between;
      gap: 8px;
      padding: 5px 10px;
      font-size: 9.2px;
      font-weight: 700;
      background: var(--gray-100);
      border-top: 1px solid var(--gray-200);
      color: var(--gray-800);
    }

    .panel-total .gross-text   { color: var(--green); }
    .panel-total .deduction-text { color: var(--red); }

    /* ── NET PAY STRIP ───────────────────────────────────── */
    .net-strip {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 14px;
      padding: 10px 14px;
      width: 100%;
      background: var(--color-success-50);
      border-top: 1px solid var(--gray-200);
    }

    .net-label {
      font-family: var(--font-heading);
      font-size: 8.5px;
      font-weight: 700;
      color: var(--color-success-700);
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .net-value {
      font-family: var(--font-heading);
      font-size: 19px;
      font-weight: 800;
      color: var(--color-success-700);
      letter-spacing: -0.015em;
    }

    /* ── LEAVE TABLE ─────────────────────────────────────── */
    .leave-wrap {
      width: calc(100% - 2px);
      margin: 1px;
      border: 1px solid var(--gray-200);
      border-radius: 4px;
      overflow: hidden;
    }

    table.leave-table {
      width: 100%;
      border-collapse: collapse;
      background: #ffffff;
      table-layout: fixed;
    }

    .leave-table th {
      padding: 5px 8px;
      font-size: 7.2px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: var(--accent);
      background: var(--accent-light);
      border-bottom: 1px solid var(--accent-border);
    }

    .leave-table th:not(:first-child),
    .leave-table td:not(:first-child) { text-align: center; }

    .leave-table td {
      padding: 4px 8px;
      font-size: 8.8px;
      color: var(--gray-600);
      border-bottom: 0.5px solid var(--gray-100);
    }

    .leave-table tr:last-child td { border-bottom: none; }

    .leave-name {
      font-weight: 600;
      color: var(--gray-800);
    }

    .success-text {
      color: var(--green);
      font-weight: 600;
    }

    /* ── LEAVE SUMMARY STRIP ─────────────────────────────── */
    .leave-summary {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 6px 12px;
      padding: 7px 8px;
      background: var(--gray-50);
      border-top: 1px solid var(--gray-200);
    }

    /* ── REMARKS ─────────────────────────────────────────── */
    .remarks-block {
      padding: 6px 8px 7px;
      background: var(--gray-25);
      border-top: 1px solid var(--gray-100);
    }

    .remarks-label {
      margin-bottom: 3px;
      font-size: 7px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.13em;
      color: var(--gray-400);
    }

    .remarks-value {
      font-size: 8.8px;
      line-height: 1.45;
      color: var(--gray-600);
      white-space: pre-wrap;
    }

    /* ── FOOTER ──────────────────────────────────────────── */
    .footer {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      margin-top: 8px;
      padding-top: 5px;
      border-top: 0.5px solid var(--gray-200);
      font-size: 7px;
      color: var(--gray-400);
      letter-spacing: 0.04em;
    }
  </style>
</head>
<body>
  <div class="doc-header">
    <div class="doc-header-left">
      ${
        row.companyLogo
          ? `<img src="${escapeHtml(row.companyLogo)}" alt="${escapeHtml(
              row.companyName || "Company Logo",
            )}" class="company-logo" />`
          : ""
      }
    </div>
    <div class="company-meta">
      <div class="doc-title">Salary Statement</div>
      <div class="doc-subtitle">Crew Payroll Record</div>
      ${
        row.companyName
          ? `<div class="company-name">${escapeHtml(row.companyName)}</div>`
          : ""
      }
      <div class="doc-meta-line">
        Period: <strong>${escapeHtml(formatDate(row.periodFrom))}</strong>
        &ndash;
        <strong>${escapeHtml(formatDate(row.periodTo))}</strong>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Employee Details</div>
    <div class="info-grid">
      <div>
        <div class="info-label">Employee Name</div>
        <div class="info-value">${escapeHtml(row.crewName || "—")}</div>
      </div>
      <div>
        <div class="info-label">Rank</div>
        <div class="info-value">${escapeHtml(row.rank || "—")}</div>
      </div>
      <div>
        <div class="info-label">Vessel</div>
        <div class="info-value">${escapeHtml(row.vesselName || "—")}</div>
      </div>
      <div>
        <div class="info-label">Email</div>
        <div class="info-value">${escapeHtml(row.crewEmail || "—")}</div>
      </div>
      <div>
        <div class="info-label">Salary Head</div>
        <div class="info-value">${escapeHtml(row.salaryHeadTitle || "—")}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Earnings &amp; Deductions</div>
    <div class="earnings-deductions-wrap">
      <table class="split-table">
        <tr>
          <td class="panel-left">
            <div class="panel-head">
              <span class="panel-head-label">Earnings</span>
              <span class="panel-head-label">Amount</span>
            </div>
            <div class="panel-body">
              <table class="line-table">
                <tbody>
                  <tr>
                    <td><strong>Basic Wages</strong></td>
                    <td class="amount">${escapeHtml(
                      formatValue(row.payableBasic),
                    )}</td>
                  </tr>
                  ${renderGroupRows(earningGroups)}
                </tbody>
              </table>
            </div>
            <div class="panel-subtotal">
              <span><strong>Total Allowances</strong></span>
              <strong>${escapeHtml(formatValue(row.totalAllowance))}</strong>
            </div>
            <div class="panel-total">
              <span>Gross Earnings</span>
              <span class="gross-text">${escapeHtml(
                formatValue(row.grossWages),
              )}</span>
            </div>
          </td>

          <td class="panel-right">
            <div class="panel-head">
              <span class="panel-head-label">Deductions</span>
              <span class="panel-head-label">Amount</span>
            </div>
            <div class="panel-body">
              ${
                deductionGroups.length > 0 || row.leaveDeduction > 0
                  ? `<table class="line-table">
                      <tbody>
                        ${renderGroupRows(deductionGroups, true)}
                        ${
                          row.leaveDeduction > 0
                            ? `<tr class="group-row">
                                <td>Leave Deduction</td>
                                <td class="amount deduction-text">${escapeHtml(
                                  formatValue(row.leaveDeduction),
                                )}</td>
                              </tr>`
                            : ""
                        }
                      </tbody>
                    </table>`
                  : `<div class="muted-empty">No deductions for this period</div>`
              }
            </div>
            <div class="panel-total" style="margin-top:auto;">
              <span>Total Deductions</span>
              <span class="deduction-text">${escapeHtml(
                formatValue(row.totalDeductions),
              )}</span>
            </div>
          </td>
        </tr>
      </table>
      <div class="net-strip">
        <div class="net-label">Net Payable Information</div>
        <div class="net-value">${escapeHtml(formatValue(row.netPayable))}</div>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Leave Register &amp; Summary</div>
    <div class="leave-wrap">
      <table class="leave-table">
        <thead>
          <tr>
            <th style="text-align:left;">Leave Type</th>
            <th>Max Policy Leave</th>
            <th>Leave Taken</th>
            <th>Approved Days</th>
            <th>Deducted Days</th>
          </tr>
        </thead>
        <tbody>
          ${leaveRows
            .map(
              (leaveRow) => `
                <tr>
                  <td class="leave-name">${escapeHtml(leaveRow.label)}</td>
                  <td>${leaveRow.maxPolicyLeave}</td>
                  <td>${leaveRow.leaveDays}</td>
                  <td>${leaveRow.approvedPaidDays}</td>
                  <td class="${
                    leaveRow.deductedDays > 0 ? "deduction-text" : "success-text"
                  }">${leaveRow.deductedDays}</td>
                </tr>`,
            )
            .join("")}
        </tbody>
      </table>
      <div class="leave-summary">
        <div>
          <div class="info-label">Total Leave Days</div>
          <div class="info-value">${row.leaveDays}</div>
        </div>
        <div>
          <div class="info-label">Deductible Leave Days</div>
          <div class="info-value deduction-text">${row.deductibleLeaveDays}</div>
        </div>
        <div>
          <div class="info-label">Payable Days</div>
          <div class="info-value">${row.payableDays}</div>
        </div>
        <div>
          <div class="info-label">Total Month Days</div>
          <div class="info-value">${row.payrollMonthDays}</div>
        </div>
        <div>
          <div class="info-label">Per Day Rate</div>
          <div class="info-value">${escapeHtml(formatValue(row.perDayRate))}</div>
        </div>
        <div>
          <div class="info-label">Leave Deduction</div>
          <div class="info-value deduction-text">${escapeHtml(
            formatValue(row.leaveDeduction),
          )}</div>
        </div>
      </div>
      ${remarksSection}
    </div>
  </div>

  ${approvalSection}

  <div class="footer">
    <span>This is a system-generated document. All figures are in ${escapeHtml(
      currencyCode,
    )}.</span>
    <span>Generated on ${escapeHtml(new Date().toLocaleString("en-IN"))}</span>
  </div>
</body>
</html>`;
}
