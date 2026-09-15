import type { AttendanceRecord, FinanceRecord, Student, StudentRole } from "./types";
import { overviewSeriesFor, scopeAttendance, scopeFinance, scopeStudents, type OverviewSeries } from "./permissions.ts";

export type AggregateDatum = { name: string; value: number };
export type OverviewChartKind = "source" | "class" | "lifecycle" | "attendance" | "finance";
export type OverviewTrendDatum = { name: string } & Partial<Record<OverviewSeries, number>>;

export type OverviewAggregate = {
  students: Student[];
  finance: FinanceRecord[];
  attendance: AttendanceRecord[];
  sourceData: AggregateDatum[];
  classData: AggregateDatum[];
  lifecycleData: AggregateDatum[];
  attendanceData: AggregateDatum[];
  financeData: AggregateDatum[];
  trendData: OverviewTrendDatum[];
  chartKinds: OverviewChartKind[];
};

export type FinanceKpi =
  | { key: "orders" | "students" | "unpaid" | "newOrders"; label: string; value: number; format: "count" }
  | { key: "orderAmount" | "received" | "refunded"; label: string; value: number; format: "money" }
  | { key: "pendingReview"; label: string; value: number; format: "count" };

const months = ["04", "05", "06", "07", "08", "09"];

const countBy = <T,>(rows: T[], valueFor: (row: T) => string, excluded = new Set<string>()) => {
  const counts = new Map<string, number>();
  rows.forEach((row) => {
    const value = valueFor(row);
    if (!excluded.has(value)) counts.set(value, (counts.get(value) ?? 0) + 1);
  });
  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name, "zh-CN"));
};

const average = (values: number[]) => values.length
  ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10
  : 0;

const chartKindsFor = (role: StudentRole): OverviewChartKind[] => {
  if (role === "超级管理员") return ["source", "class"];
  if (role === "教务管理员" || role === "普通教师") return ["class", "attendance"];
  if (role === "销售顾问") return ["source", "lifecycle"];
  return ["finance"];
};

export function buildOverviewAggregate(
  role: StudentRole,
  allStudents: Student[],
  allFinance: FinanceRecord[],
  allAttendance: AttendanceRecord[],
): OverviewAggregate {
  const active = allStudents.filter((student) => !student.deletedAt);
  const students = scopeStudents(role, active);
  const finance = scopeFinance(role, allFinance, active);
  const attendance = scopeAttendance(role, allAttendance, active);
  const allowedSeries = overviewSeriesFor(role);

  const trendData = months.map<OverviewTrendDatum>((month) => {
    const monthPrefix = `2026-${month}`;
    const monthStudents = students.filter((student) => student.signupTime.startsWith(monthPrefix));
    const monthFinance = finance.filter((record) => record.createdAt.startsWith(monthPrefix));
    const datum: OverviewTrendDatum = { name: `${Number(month)}月` };
    if (allowedSeries.includes("payment")) {
      datum.payment = Math.round(monthFinance.reduce((sum, record) => sum + record.paid, 0) / 10_000);
    }
    if (allowedSeries.includes("attendance")) {
      datum.attendance = average(monthStudents.map((student) => student.attendanceRate));
    }
    if (allowedSeries.includes("loss")) {
      datum.loss = monthStudents.length
        ? Math.round((monthStudents.filter((student) => student.status === "流失").length / monthStudents.length) * 1_000) / 10
        : 0;
    }
    if (allowedSeries.includes("renewal")) {
      datum.renewal = monthStudents.length
        ? Math.round((monthStudents.filter((student) => student.tags.includes("老生续报")).length / monthStudents.length) * 1_000) / 10
        : 0;
    }
    return datum;
  });

  return {
    students,
    finance,
    attendance,
    sourceData: countBy(students, (student) => student.channel),
    classData: countBy(students, (student) => student.className, new Set(["待分班"])),
    lifecycleData: countBy(students, (student) => student.status),
    attendanceData: countBy(attendance, (record) => record.status),
    financeData: countBy(finance, (record) => record.status),
    trendData,
    chartKinds: chartKindsFor(role),
  };
}

export function buildFinanceKpis(
  role: StudentRole,
  allFinance: FinanceRecord[],
  allStudents: Student[],
): FinanceKpi[] {
  const rows = scopeFinance(role, allFinance, allStudents.filter((student) => !student.deletedAt));
  if (role === "销售顾问") {
    return [
      { key: "orders", label: "本人报名订单", value: rows.length, format: "count" },
      { key: "students", label: "涉及学员", value: new Set(rows.map((row) => row.studentId)).size, format: "count" },
      { key: "unpaid", label: "待完善订单", value: rows.filter((row) => row.status === "待支付" || row.status === "待审核").length, format: "count" },
      { key: "newOrders", label: "本期新增订单", value: rows.filter((row) => row.createdAt.startsWith("2026-09")).length, format: "count" },
    ];
  }
  return [
    { key: "orderAmount", label: "订单总额", value: rows.reduce((sum, row) => sum + row.tuition - row.discount, 0), format: "money" },
    { key: "received", label: "实收金额", value: rows.reduce((sum, row) => sum + row.paid, 0), format: "money" },
    { key: "refunded", label: "本期退款", value: rows.filter((row) => row.status.includes("退款")).reduce((sum, row) => sum + row.tuition - row.discount - row.paid, 0), format: "money" },
    { key: "pendingReview", label: "待复核", value: rows.filter((row) => row.reviewStatus === "待复核").length, format: "count" },
  ];
}
