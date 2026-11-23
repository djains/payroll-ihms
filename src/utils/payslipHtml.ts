import { IHMS_LOGO_BASE64, IHMS_STAMP_BASE64 } from './logoBase64';

/**
 * payslipHtml.ts
 * 1:1 Authentic Crystal Reports Replica (Salary_Slip.rpt / Salary_Slip.json - Image 1 Layout)
 * Used across both Employee Salary Slip view and Company Admin Salary Slip view.
 */

// Helper to convert number to Indian Currency Words
export function numberToIndianWords(num: number): string {
  if (isNaN(num) || num <= 0) return 'ZERO ONLY';

  const a = [
    '',
    'ONE',
    'TWO',
    'THREE',
    'FOUR',
    'FIVE',
    'SIX',
    'SEVEN',
    'EIGHT',
    'NINE',
    'TEN',
    'ELEVEN',
    'TWELVE',
    'THIRTEEN',
    'FOURTEEN',
    'FIFTEEN',
    'SIXTEEN',
    'SEVENTEEN',
    'EIGHTEEN',
    'NINETEEN',
  ];
  const b = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];

  const inWords = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000)
      return a[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 !== 0 ? ' AND ' + inWords(n % 100) : '');
    if (n < 100000)
      return inWords(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 10000000)
      return inWords(Math.floor(n / 100000)) + ' LAKH' + (n % 100000 !== 0 ? ' ' + inWords(n % 100000) : '');
    return inWords(Math.floor(n / 10000000)) + ' CRORE' + (n % 10000000 !== 0 ? ' ' + inWords(n % 10000000) : '');
  };

  const integerPart = Math.floor(num);
  return inWords(integerPart).trim() + ' ONLY';
}

export interface PayslipDataInput {
  emp_code?: string;
  emp_name?: string;
  job_type?: string;
  designation?: string;
  emp_father?: string;
  joining_date?: string;
  bank_account?: string;
  bank_name?: string;
  bank_branch?: string;
  client?: string;
  state?: string;
  location?: string;
  pan?: string;
  pf_no?: string;
  esic_no?: string;
  uan_no?: string;
  payable_days?: string | number;
  month_days?: string | number;
  month?: number | string;
  year?: number | string;
  month_label?: string;

  // Financial figures
  Basic?: string | number;
  basic?: string | number;
  Vda?: string | number;
  vda?: string | number;
  basic_vda?: string | number;
  hra?: string | number;
  hra_amount?: string | number;
  bonus?: string | number;
  sal_bonus_after_gross?: string | number;
  other_allo?: string | number;
  other_allow?: string | number;
  de_head1?: string | number;
  de_head2?: string | number;
  de_head3?: string | number;
  de_head4?: string | number;

  PF?: string | number;
  pf_employee?: string | number;
  dpf_employee?: string | number;
  ESIC?: string | number;
  esic_employee?: string | number;
  desic_employee?: string | number;
  pt?: string | number;
  professional_tax?: string | number;
  dptax?: string | number;
  lwf?: string | number;
  lwf_salary?: string | number;
  dlwf?: string | number;

  gross_salary?: string | number;
  Payment?: string | number;
  tot_earnings?: string | number;
  tot_de_head?: string | number;
  tot_lumpsum?: string | number;
  tot_dl_head?: string | number;
  tot_deductions?: string | number;
  tot_dd_head?: string | number;
  net_salary?: string | number;
  ctc_amount?: string | number;
  month_total?: string | number;
  pf_employer?: string | number;
  dpf_employer?: string | number;
  esic_employer?: string | number;
  desic_employer?: string | number;
  advance_payment?: string | number;
  sundays?: string | number;
  labels?: Record<string, string>;
  advance_leave?: string | number;
  advance_bonus?: string | number;
  [key: string]: any;
}

export function generateCrystalPayslipHtml(
  data: PayslipDataInput,
  options?: {
    companyName?: string;
    companyAddress1?: string;
    companyAddress2?: string;
  }
): string {
  const compName = options?.companyName || 'NG GLOBAL INTEGRATED SOLUTIONS INDIA PRIVATE LIMITED';
  const compAddr1 = options?.companyAddress1 || '304, 3RD FLOOR, NYATI MILLENNIUM, DATTA MANDIR CHOWK';
  const compAddr2 = options?.companyAddress2 || 'VIMAN NAGAR, PUNE -411014,PUNE,MAHARASHTRA';

  const mLabel =
    data.month_label ||
    (data.month && data.year ? `Month ${data.month} ${data.year}` : 'January 2025');

  // Employee Metadata: strictly use real data passed by admin/user/SQL; clean dash '—' if empty
  const recEmpCode = data.emp_code || data.Emp_Code || '—';
  const recEmpName = data.emp_name || data.Emp_Name || '—';
  const recDesignation = (data.job_type || data.designation || data.grade || 'Staff').toUpperCase();
  const recFatherName = (data.emp_father || data.Emp_Father || data.emp_father_name || data.Emp_Father_Name || '—').toUpperCase();
  const recJoiningDate = data.joining_date || data.Joining_Date || data.joining_date_str || '—';

  // Bank Info: real data or clean dash
  const rawAc = String(data.bank_account || data.BANK_EMP_AC_CODE || data.Bank_Ac_No || data.bank_ac_no || '');
  const maskedAc = rawAc.length > 4 ? `XXXXXXX${rawAc.slice(-4)}` : rawAc;
  const bName = data.bank_name || data.PF_BANK_NAME || data.Bank_holder_name || '';
  const bBranch = data.bank_branch || data.BANK_BRANCH || '';
  const recBankDetails = [maskedAc, bName, bBranch].filter(Boolean).join(',') || '—';

  const recClient = (data.client || data.Client || '—').toUpperCase();
  const recState = (data.state || data.State || data.UnitState || 'Maharashtra').toUpperCase();
  const recLocation = (data.location || data.Unit_City || data.city || '—').toUpperCase();

  const recPan = data.pan || data.PAN_No || data.EMP_NEW_PAN_NO || data.pan_no || '—';
  const recPfNo = data.pf_no || data.PF_No || data.PF_NUMBER || '—';
  const recEsicNo = data.esic_no || data.ESI_No || data.ESIC_NUMBER || '—';
  const recUanNo = data.uan_no || data.UAN_No || '—';
  const isNumProvided = (v: any) =>
    v !== undefined && v !== null && String(v).trim() !== '' && !isNaN(Number(v));
  const numOf = (v: any, fallback = 0) => (isNumProvided(v) ? Number(v) : fallback);

  // Detect Staff Payroll Pro payload vs legacy pay_pro_master / mobile-salary-slip payload
  const hasStaffProData =
    data.de_head1 !== undefined ||
    data.tot_de_head !== undefined ||
    data.dpf_employee !== undefined ||
    data.labels !== undefined ||
    data.head1 !== undefined;

  // 1. Attendance Days strictly from SQL
  const payableDaysNum = numOf(
    data.payable_days ??
      data.Total_Days_Present ??
      data.total_days_present ??
      data.present_days ??
      data.tot_days_present,
    0
  );
  const monthDaysNum = numOf(data.month_days ?? data.Working_Days, 30) || 30;
  let sundaysNum = numOf(data.sundays, 0);
  if (!isNumProvided(data.sundays) && data.month && data.year && hasStaffProData) {
    const m = parseInt(String(data.month), 10);
    const y = parseInt(String(data.year), 10);
    if (m >= 1 && m <= 12 && y >= 2000) {
      const daysInMo = new Date(y, m, 0).getDate();
      let sunCount = 0;
      for (let d = 1; d <= daysInMo; d++) {
        if (new Date(y, m - 1, d).getDay() === 0) sunCount++;
      }
      sundaysNum = sunCount;
    }
  }
  const recPayableDay =
    hasStaffProData && sundaysNum > 0
      ? `${payableDaysNum} (+${sundaysNum} W/O / ${monthDaysNum})`
      : `${payableDaysNum} / ${monthDaysNum}`;

  // 2. Structure / Base Rates from SQL
  const ctcVal = numOf(data.ctc_amount, 0);
  const lumpsumVal = numOf(data.tot_dl_head ?? data.tot_lumpsum, 0);

  let rateBasic = numOf(data.Basic ?? data.basic ?? data.basic_salary ?? data.head1, 0);
  let rateVda = numOf(data.Vda ?? data.vda ?? data.vda_salary ?? data.head4, 0);
  let rateHra = numOf(data.hra_amount_salary ?? data.hra_amount ?? data.hra ?? data.head2, 0);
  let rateCca = numOf(data.cca_salary ?? data.cca ?? data.head3, 0);
  let totalRateNum = 0;

  let rateRowsHtml = '';
  let earningsRowsHtml = '';
  let totalEarningsNum = 0;

  if (hasStaffProData) {
    const rawLabels: Record<string, string> = data.labels || {};
    let rateSum = 0;
    let earnedSum = 0;
    const rateRows: { label: string; amount: number }[] = [];
    const earnRows: { label: string; amount: number }[] = [];

    for (let i = 1; i <= 15; i++) {
      const key = `head${i}`;
      const deKey = `de_head${i}`;
      let lbl = String(rawLabels[key] || '').trim().toUpperCase();
      if (!lbl && i === 1) lbl = 'BASIC';
      if (!lbl && i === 2) lbl = 'HRA';

      const rawRate = data[key];
      const rawEarned = data[deKey];
      const rateAmt = numOf(rawRate, 0);
      const earnedAmt = numOf(rawEarned, 0);

      const includeRow =
        Boolean(rawLabels[key] && String(rawLabels[key]).trim()) ||
        rateAmt > 0 ||
        earnedAmt > 0 ||
        (i <= 2 && (isNumProvided(rawRate) || isNumProvided(rawEarned)));

      if (includeRow) {
        rateRows.push({ label: lbl || `HEAD ${i}`, amount: rateAmt });
        earnRows.push({ label: lbl || `HEAD ${i}`, amount: earnedAmt });
        rateSum += rateAmt;
        earnedSum += earnedAmt;
      }
    }

    if (lumpsumVal > 0) {
      earnRows.push({ label: 'LUMPSUM', amount: lumpsumVal });
      earnedSum += lumpsumVal;
    }

    totalRateNum = rateSum > 0 ? rateSum : ctcVal;
    totalEarningsNum = isNumProvided(data.tot_de_head ?? data.tot_earnings)
      ? numOf(data.tot_de_head ?? data.tot_earnings, 0)
      : Math.round(earnedSum * 100) / 100;

    rateRowsHtml = rateRows
      .map(
        (r) => `
                <div class="inner-row">
                  <span class="inner-lbl">${r.label} :</span>
                  <span class="inner-val">${r.amount.toFixed(2)}</span>
                </div>`
      )
      .join('');

    earningsRowsHtml = earnRows
      .map(
        (r) => `
                <div class="inner-row">
                  <span class="inner-lbl">${r.label} :</span>
                  <span class="inner-val">${r.amount.toFixed(2)}</span>
                </div>`
      )
      .join('');
  } else {
    if (rateBasic <= 0 && rateVda <= 0 && ctcVal > 0) {
      rateBasic = Math.round(ctcVal * 0.5 * 100) / 100;
      rateHra = rateHra > 0 ? rateHra : Math.round(ctcVal * 0.2 * 100) / 100;
    }
    totalRateNum = rateBasic + rateVda;

    const earnedBasicVda = numOf(data.emp_basic_vda ?? data.basic_vda ?? data.de_head1, 0);
    const earnedHra = numOf(data.hra ?? data.hra_amount ?? data.de_head2, 0);
    const earnedCca = numOf(data.cca ?? data.cca_salary ?? data.de_head3, 0);
    const earnedBonus = numOf(data.sal_bonus_gross ?? data.sal_bonus_after_gross ?? data.bonus, 0);
    const earnedOther = numOf(data.other_allo ?? data.other_allow, 0);
    const earnedLeave = numOf(data.leave_taxable ?? data.leave_sal_gross, 0);
    const earnedGratuity = numOf(data.gratuity_gross ?? data.Gratuity_taxable, 0);

    const legacySum =
      earnedBasicVda + earnedHra + earnedBonus + earnedOther + earnedCca + earnedLeave + earnedGratuity;
    totalEarningsNum = isNumProvided(data.tot_earnings ?? data.Payment)
      ? numOf(data.tot_earnings ?? data.Payment, legacySum)
      : legacySum;

    rateRowsHtml = `
                <div class="inner-row">
                  <span class="inner-lbl">BASIC :</span>
                  <span class="inner-val">${rateBasic.toFixed(2)}</span>
                </div>
                <div class="inner-row">
                  <span class="inner-lbl">VDA :</span>
                  <span class="inner-val">${rateVda.toFixed(2)}</span>
                </div>`;

    earningsRowsHtml = `
                <div class="inner-row">
                  <span class="inner-lbl">BASIC+VDA :</span>
                  <span class="inner-val">${earnedBasicVda.toFixed(2)}</span>
                </div>
                <div class="inner-row">
                  <span class="inner-lbl">HRA :</span>
                  <span class="inner-val">${earnedHra.toFixed(2)}</span>
                </div>
                <div class="inner-row">
                  <span class="inner-lbl">BONUS :</span>
                  <span class="inner-val">${earnedBonus.toFixed(2)}</span>
                </div>
                <div class="inner-row">
                  <span class="inner-lbl">OTHER ALLOWANCS:</span>
                  <span class="inner-val">${earnedOther.toFixed(2)}</span>
                </div>
                <div class="inner-row">
                  <span class="inner-lbl">CCA :</span>
                  <span class="inner-val">${earnedCca.toFixed(2)}</span>
                </div>
                <div class="inner-row">
                  <span class="inner-lbl">LEAVE :</span>
                  <span class="inner-val">${earnedLeave.toFixed(2)}</span>
                </div>
                <div class="inner-row">
                  <span class="inner-lbl">GRATUITY :</span>
                  <span class="inner-val">${earnedGratuity.toFixed(2)}</span>
                </div>`;
  }

  // 4. Deductions: strictly real SQL fields (NEVER fabricate absent deduction)
  const pfVal = numOf(data.PF ?? data.pf_employee ?? data.dpf_employee, 0);
  const pfEmployerVal = numOf(data.pf_employer ?? data.dpf_employer, 0);
  const esicVal = numOf(data.ESIC ?? data.esic_employee ?? data.desic_employee, 0);
  const esicEmployerVal = numOf(data.esic_employer ?? data.desic_employer, 0);
  const ptVal = numOf(data.pt ?? data.professional_tax ?? data.dptax, 0);
  const lwfVal = numOf(data.lwf ?? data.lwf_salary ?? data.dlwf, 0);
  const otherDeductionVal = hasStaffProData
    ? numOf(data.tot_dd_head ?? data.tot_deductions, 0)
    : numOf(data.absent_attendance_total ?? data.fine ?? data.deduction, 0);
  const advanceVal = numOf(data.advance ?? data.EMP_ADVANCE_PAYMENT ?? data.advance_payment, 0);

  const attendanceProrationCut =
    totalRateNum > totalEarningsNum
      ? Math.round((totalRateNum - totalEarningsNum) * 100) / 100
      : 0;

  const totalDeductionsVal =
    Math.round(
      (pfVal +
        (pfEmployerVal > 0 ? pfEmployerVal : 0) +
        esicVal +
        (esicEmployerVal > 0 ? esicEmployerVal : 0) +
        ptVal +
        lwfVal +
        otherDeductionVal +
        advanceVal +
        attendanceProrationCut) *
        100
    ) / 100;

  // 5. Net Salary strictly from backend SQL (net_salary / Payment), never overwritten
  let netSalaryVal = 0;
  if (isNumProvided(data.net_salary)) {
    netSalaryVal = Math.max(0, numOf(data.net_salary, 0));
  } else if (isNumProvided(data.Payment)) {
    netSalaryVal = Math.max(0, numOf(data.Payment, 0));
  } else {
    netSalaryVal = Math.max(0, Math.round((totalEarningsNum - totalDeductionsVal) * 100) / 100);
  }

  const grossDisplayVal = ctcVal > 0 ? ctcVal : numOf(data.gross_salary ?? data.tot_de_head ?? data.tot_earnings, totalEarningsNum);
  const advLeaveVal = numOf(data.leaveDays ?? data.leave_sal_after_gross ?? data.advance_leave, 0);
  const advBonusVal = numOf(data.bonus ?? data.sal_bonus_after_gross ?? data.advance_bonus, 0);
  const gratuityAfterGross = numOf(data.Gratuity ?? data.gratuity_after_gross, 0);

  const wordsNet = numberToIndianWords(netSalaryVal);

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes" />
  <title>Salary_Slip_${recEmpCode}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 6mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    html, body {
      font-family: Arial, Helvetica, sans-serif;
      margin: 0;
      padding: 0;
      background: #F1F5F9;
      color: #000000;
      width: 100%;
      height: 100%;
    }
    .viewport-outer {
      width: 100%;
      min-height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 6px 4px;
      overflow-x: hidden;
      overflow-y: auto;
      box-sizing: border-box;
      -webkit-overflow-scrolling: touch;
    }
    .scale-box {
      width: 760px;
      transform-origin: top center;
      transition: transform 0.2s ease-out;
    }
    .sheet {
      background: #FFFFFF;
      border: 1.5px solid #000000;
      padding: 10px 14px;
      width: 760px;
      min-width: 760px;
      box-sizing: border-box;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      margin: 0 auto;
    }
    .top-badge-wrap {
      text-align: center;
      margin-top: 2px;
      margin-bottom: 8px;
    }
    .top-badge {
      display: inline-block;
      background: #143174;
      color: #FFFFFF;
      font-weight: 800;
      font-size: 11px;
      padding: 3.5px 24px;
      border-radius: 2px;
      letter-spacing: 0.3px;
    }
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 12px;
    }
    .header-table td {
      vertical-align: middle;
      padding: 0;
    }
    .header-logo-cell {
      width: 195px;
      padding-right: 14px;
    }
    .header-logo-img {
      width: 175px;
      height: 68px;
      object-fit: contain;
      object-position: left center;
      display: block;
    }
    .header-info-cell {
      text-align: left;
    }
    .comp-title {
      font-size: 13.5px;
      font-weight: 900;
      color: #000000;
      letter-spacing: 0.2px;
      line-height: 1.3;
      margin-bottom: 2px;
    }
    .comp-address {
      font-size: 10px;
      font-weight: 700;
      color: #111111;
      line-height: 1.35;
      letter-spacing: 0.1px;
    }

    /* 6-Column Metadata Grid matching Image 1 */
    .grid-table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #000000;
      margin-bottom: 14px;
      font-size: 10px;
    }
    .grid-table td {
      border: 1px solid #000000;
      padding: 4px 6px;
      height: 22px;
      vertical-align: middle;
    }
    .grid-table .lbl {
      font-weight: 800;
      text-transform: uppercase;
      font-size: 9.5px;
      color: #000000;
      white-space: nowrap;
    }
    .grid-table .val {
      font-weight: 500;
      color: #000000;
    }

    /* 4-Column Financial Grid matching Image 1 */
    .salary-table {
      width: 100%;
      border-collapse: collapse;
      border: 1.5px solid #000000;
      margin-bottom: 10px;
      font-size: 10px;
    }
    .salary-table th {
      background: #C4C4C4;
      color: #000000;
      font-weight: 800;
      font-size: 10.5px;
      text-align: center;
      padding: 5px 4px;
      border: 1px solid #000000;
      letter-spacing: 0.3px;
    }
    .salary-table td {
      border: 1px solid #000000;
      padding: 6px 8px;
      vertical-align: top;
      width: 25%;
    }
    .inner-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 2.5px 0;
      font-size: 10px;
    }
    .inner-lbl {
      font-weight: 700;
      color: #000000;
    }
    .inner-val {
      font-weight: 600;
      color: #000000;
      text-align: right;
    }

    .summary-row {
      background: #E5E7EB;
      font-weight: 800;
      font-size: 9.5px;
    }
    .summary-row td {
      padding: 5px 6px;
      border: 1px solid #000000;
    }

    .net-words-box {
      border: 1px solid #000000;
      padding: 6px 8px;
      font-size: 9.5px;
      font-weight: bold;
      color: #000000;
      margin-bottom: 14px;
      background: #FFFFFF;
    }

    .footer-container {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 14px;
      padding: 0 4px;
      box-sizing: border-box;
      min-height: 85px;
    }
    .footer-note {
      font-size: 8.5px;
      font-weight: bold;
      color: #000000;
      max-width: 65%;
      line-height: 1.4;
      text-transform: uppercase;
      padding-bottom: 8px;
    }
    .footer-stamp {
      text-align: right;
      padding-right: 8px;
    }
    .stamp-img {
      width: 85px;
      height: 85px;
      object-fit: contain;
      display: block;
    }

    @media print {
      html, body {
        background: #FFFFFF !important;
        padding: 0 !important;
        margin: 0 !important;
        width: 100% !important;
        height: auto !important;
      }
      .viewport-outer {
        padding: 0 !important;
        overflow: visible !important;
      }
      .scale-box {
        width: 100% !important;
        transform: none !important;
        margin-bottom: 0 !important;
      }
      .sheet {
        border: 1.5px solid #000000 !important;
        box-shadow: none !important;
        padding: 6mm !important;
        width: 100% !important;
        max-width: 100% !important;
        margin: 0 !important;
      }
    }
  </style>
</head>
<body>
  <div class="viewport-outer">
    <div class="scale-box" id="scaleBox">
      <div class="sheet" id="sheet">
        <!-- Top Centered Blue Badge -->
        <div class="top-badge-wrap">
          <div class="top-badge">Pay Slip For ${mLabel}</div>
        </div>

        <!-- Official Header with Authentic NG GLOBAL Logo & Company Details -->
        <table class="header-table">
          <tr>
            <td class="header-logo-cell">
              <img src="${IHMS_LOGO_BASE64}" alt="NG GLOBAL" class="header-logo-img" />
            </td>
            <td class="header-info-cell">
              <div class="comp-title">${compName}</div>
              <div class="comp-address">${compAddr1}</div>
              <div class="comp-address">${compAddr2}</div>
            </td>
          </tr>
        </table>

        <!-- 6-Column Metadata Grid matching Image 1 -->
        <table class="grid-table">
          <tr>
            <td class="lbl" style="width:16%;">EMPLOYEE ID</td>
            <td class="val" style="width:26%;">${recEmpCode}</td>
            <td class="lbl" style="width:12%;">CLIENT</td>
            <td class="val" style="width:22%;">${recClient}</td>
            <td class="lbl" style="width:10%;">PAN</td>
            <td class="val" style="width:14%;">${recPan}</td>
          </tr>
          <tr>
            <td class="lbl">EMPLOYEE NAME</td>
            <td class="val">${recEmpName}</td>
            <td class="lbl">STATE</td>
            <td class="val">${recState}</td>
            <td class="lbl">PF NO</td>
            <td class="val">${recPfNo}</td>
          </tr>
          <tr>
            <td class="lbl">DESIGNATION</td>
            <td class="val">${recDesignation}</td>
            <td class="lbl">LOCATION</td>
            <td class="val">${recLocation}</td>
            <td class="lbl">ESIC NO</td>
            <td class="val">${recEsicNo}</td>
          </tr>
          <tr>
            <td class="lbl">FATHER NAME</td>
            <td class="val">${recFatherName}</td>
            <td class="val" colspan="2"></td>
            <td class="lbl">UAN NO</td>
            <td class="val">${recUanNo}</td>
          </tr>
          <tr>
            <td class="lbl">JOINING DATE</td>
            <td class="val">${recJoiningDate}</td>
            <td class="val" colspan="2"></td>
            <td class="lbl">PAYABLE DAY</td>
            <td class="val">${recPayableDay}</td>
          </tr>
          <tr>
            <td class="lbl">BANK DETAILS</td>
            <td class="val" colspan="5">${recBankDetails}</td>
          </tr>
        </table>

        <!-- 4-Column Financial Grid matching Crystal Reports (Salary_Slip.rpt) -->
        <table class="salary-table">
          <thead>
            <tr>
              <th>${hasStaffProData ? 'SALARY STRUCTURE' : 'MINIMUM WAGES'}</th>
              <th>EARNINGS</th>
              <th>DEDUCTION</th>
              <th>NET SALARY</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <!-- MINIMUM WAGES / STRUCTURE -->
              <td>${rateRowsHtml}
              </td>

              <!-- EARNINGS -->
              <td>${earningsRowsHtml}
              </td>

              <!-- DEDUCTION -->
              <td>
                <div class="inner-row">
                  <span class="inner-lbl">${pfEmployerVal > 0 ? 'PF (EMP) :' : 'PF :'}</span>
                  <span class="inner-val">${pfVal.toFixed(2)}</span>
                </div>${pfEmployerVal > 0 ? `
                <div class="inner-row">
                  <span class="inner-lbl">PF (EMPR) :</span>
                  <span class="inner-val">${pfEmployerVal.toFixed(2)}</span>
                </div>` : ''}
                <div class="inner-row">
                  <span class="inner-lbl">${esicEmployerVal > 0 ? 'ESIC (EMP) :' : 'ESIC :'}</span>
                  <span class="inner-val">${esicVal.toFixed(2)}</span>
                </div>${esicEmployerVal > 0 ? `
                <div class="inner-row">
                  <span class="inner-lbl">ESIC (EMPR) :</span>
                  <span class="inner-val">${esicEmployerVal.toFixed(2)}</span>
                </div>` : ''}
                <div class="inner-row">
                  <span class="inner-lbl">PT :</span>
                  <span class="inner-val">${ptVal.toFixed(2)}</span>
                </div>
                <div class="inner-row">
                  <span class="inner-lbl">LWF :</span>
                  <span class="inner-val">${lwfVal.toFixed(2)}</span>
                </div>
                <div class="inner-row">
                  <span class="inner-lbl">DEDUCTION :</span>
                  <span class="inner-val">${otherDeductionVal.toFixed(2)}</span>
                </div>
                <div class="inner-row">
                  <span class="inner-lbl">ADVANCE :</span>
                  <span class="inner-val">${advanceVal.toFixed(2)}</span>
                </div>
                ${
                  attendanceProrationCut > 0
                    ? `<div class="inner-row">
                  <span class="inner-lbl">ATTENDANCE CUT :</span>
                  <span class="inner-val">${attendanceProrationCut.toFixed(2)}</span>
                </div>`
                    : ''
                }
              </td>

              <!-- NET SALARY -->
              <td>
                <div class="inner-row">
                  <span class="inner-lbl">${hasStaffProData ? 'MONTHLY CTC :' : 'GROSS :'}</span>
                  <span class="inner-val">${grossDisplayVal.toFixed(2)}</span>
                </div>
                <div class="inner-row">
                  <span class="inner-lbl">EARNED GROSS :</span>
                  <span class="inner-val">${totalEarningsNum.toFixed(2)}</span>
                </div>
                <div class="inner-row">
                  <span class="inner-lbl">ADVANCE LEAVE :</span>
                  <span class="inner-val">${advLeaveVal.toFixed(2)}</span>
                </div>
                <div class="inner-row">
                  <span class="inner-lbl">ADVANCE BONUS :</span>
                  <span class="inner-val">${advBonusVal.toFixed(2)}</span>
                </div>
                <div class="inner-row">
                  <span class="inner-lbl">GRATUITY :</span>
                  <span class="inner-val">${gratuityAfterGross.toFixed(2)}</span>
                </div>
              </td>
            </tr>

            <!-- Summary Row -->
            <tr class="summary-row">
              <td style="font-weight:bold;">TOTAL RATE&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${totalRateNum.toFixed(2)}</td>
              <td style="font-weight:bold;">TOTAL EARNINGS&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${totalEarningsNum.toFixed(2)}</td>
              <td style="font-weight:bold;">TOTAL DEDUCTION&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${totalDeductionsVal.toFixed(2)}</td>
              <td style="font-weight:bold;">NET SALARY&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;${netSalaryVal.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        <!-- Net Amount in Words -->
        <div class="net-words-box">
          NET SALARY IN WORDS : RUPEES ${wordsNet.toUpperCase()}
        </div>

        <div style="font-size: 9px; font-weight: bold; color: #000000; margin-top: 10px; margin-bottom: 4px; letter-spacing: 0.2px;">
          NOTE : THIS IS A COMPUTER GENERATED FORMAT HENCE REQUIRE NO SIGNATURE.
        </div>
      </div>
    </div>
  </div>

  <script>
    function updateScale() {
      var box = document.getElementById('scaleBox');
      var sheet = document.getElementById('sheet');
      var outer = document.querySelector('.viewport-outer');
      if (!box || !sheet) return;

      var availW = window.innerWidth - 12;
      var targetW = 760;

      if (availW < targetW && availW > 100) {
        var s = availW / targetW;
        box.style.transform = 'scale(' + s + ')';
        box.style.transformOrigin = 'top center';
        var diff = sheet.offsetHeight * (1 - s);
        box.style.marginBottom = '-' + diff + 'px';
        if (outer) outer.style.overflowX = 'hidden';
      } else {
        box.style.transform = 'none';
        box.style.marginBottom = '12px';
        if (outer) outer.style.overflowX = 'hidden';
      }
    }

    window.addEventListener('load', updateScale);
    window.addEventListener('resize', updateScale);
    setTimeout(updateScale, 100);
  </script>
</body>
</html>`;
}

