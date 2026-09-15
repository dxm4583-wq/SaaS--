import assert from "node:assert/strict";
import { generateAttendance, generateFinance, generateLeads, generateStudents } from "../src/features/students/mockData.ts";
import {
  can,
  canSeeField,
  canVisit,
  detailTabsFor,
  exportFieldsFor,
  overviewSeriesFor,
  reportTypesFor,
  scopeAttendance,
  scopeFinance,
  scopeLeads,
  scopeStudents,
} from "../src/features/students/permissions.ts";
import { buildFinanceKpis, buildOverviewAggregate } from "../src/features/students/analytics.ts";

const students = generateStudents();
const attendance = generateAttendance(students);
const finance = generateFinance(students);
const leads = generateLeads(students);

assert.equal(scopeStudents("超级管理员", students).length, 10_000);
assert.equal(scopeFinance("超级管理员", finance, students).length, 240);

const academic = scopeStudents("教务管理员", students);
assert.equal(academic.length, 10_000);
assert.equal(canSeeField("教务管理员", "sales"), false);
assert.equal(canSeeField("教务管理员", "finance"), false);
assert.equal(exportFieldsFor("教务管理员").includes("owner"), false);
assert.equal(exportFieldsFor("教务管理员").includes("paymentState"), false);
assert.equal(can("教务管理员", "graduate"), true);
assert.deepEqual(reportTypesFor("教务管理员"), ["班级学员","考勤","续报率"]);
assert.equal(overviewSeriesFor("教务管理员").includes("payment"), false);

const sales = scopeStudents("销售顾问", students);
assert.ok(sales.length > 0 && sales.every((student) => student.owner === "林晓曼"));
assert.ok(scopeFinance("销售顾问", finance, students).every((row) => sales.some((student) => student.id === row.studentId)));
assert.ok(scopeLeads("销售顾问", leads).every((lead) => lead.owner === "林晓曼" || lead.owner === "待分配"));
assert.equal(can("销售顾问", "payment"), false);
assert.equal(canVisit("销售顾问", "classes"), false);
assert.deepEqual(reportTypesFor("销售顾问"), ["学员来源","流失","续报率"]);
assert.equal(overviewSeriesFor("销售顾问").includes("payment"), false);

assert.deepEqual(exportFieldsFor("财务管理员"), ["id","name","phone","paymentState","signupTime"]);
assert.equal(can("财务管理员", "edit"), false);
assert.equal(canVisit("财务管理员", "attendance"), false);
assert.deepEqual(detailTabsFor("财务管理员"), ["基础档案","报名订单","缴费记录"]);
assert.deepEqual(reportTypesFor("财务管理员"), ["缴费"]);
assert.deepEqual(overviewSeriesFor("财务管理员"), ["payment"]);

const teacherStudents = scopeStudents("普通教师", students);
assert.ok(teacherStudents.length > 0);
assert.ok(teacherStudents.every((student) => student.teacher === "王嘉" && student.className !== "待分班"));
assert.ok(scopeAttendance("普通教师", attendance, students).every((row) => row.teacher === "王嘉" && teacherStudents.some((student) => student.id === row.studentId)));
assert.equal(can("普通教师", "graduate"), false);
assert.equal(detailTabsFor("普通教师").includes("结业档案"), false);
assert.equal(canVisit("普通教师", "finance"), false);
assert.equal(can("普通教师", "export"), false);
assert.equal(can("普通教师", "print"), false);
assert.deepEqual(reportTypesFor("普通教师"), []);
assert.deepEqual(overviewSeriesFor("普通教师"), ["attendance"]);
const teacherOverview = buildOverviewAggregate("普通教师", students, finance, attendance);
assert.equal(teacherOverview.students.length, teacherStudents.length);
assert.equal(teacherOverview.classData.reduce((sum, item) => sum + item.value, 0), teacherStudents.length);
assert.deepEqual(teacherOverview.chartKinds, ["class", "attendance"]);
assert.equal(teacherOverview.chartKinds.includes("source"), false);
assert.ok(teacherOverview.trendData.every((datum) =>
  Object.keys(datum).every((key) => key === "name" || key === "attendance")));
assert.notEqual(teacherOverview.sourceData.reduce((sum, item) => sum + item.value, 0), students.length);

const salesFinance = scopeFinance("销售顾问", finance, students);
const salesFinanceKpis = buildFinanceKpis("销售顾问", finance, students);
assert.deepEqual(salesFinanceKpis.map((item) => item.key), ["orders","students","unpaid","newOrders"]);
assert.ok(salesFinanceKpis.every((item) => item.format === "count"));
assert.equal(salesFinanceKpis.find((item) => item.key === "orders")?.value, salesFinance.length);
assert.equal(salesFinanceKpis.some((item) => ["orderAmount","received","refunded","pendingReview"].includes(item.key)), false);

const salesOverview = buildOverviewAggregate("销售顾问", students, finance, attendance);
assert.deepEqual(salesOverview.chartKinds, ["source","lifecycle"]);
assert.ok(salesOverview.sourceData.reduce((sum, item) => sum + item.value, 0) === sales.length);
assert.ok(salesOverview.trendData.every((datum) =>
  Object.keys(datum).every((key) => key === "name" || key === "loss" || key === "renewal")));

for (const role of ["超级管理员","教务管理员","销售顾问","财务管理员","普通教师"] as const) {
  const overview = buildOverviewAggregate(role, students, finance, attendance);
  const allowed = new Set(["name", ...overviewSeriesFor(role)]);
  assert.ok(overview.trendData.every((datum) => Object.keys(datum).every((key) => allowed.has(key))));
}

assert.deepEqual(reportTypesFor("超级管理员"), ["学员来源","班级学员","缴费","考勤","流失","续报率"]);
assert.deepEqual(overviewSeriesFor("超级管理员"), ["payment","attendance","loss","renewal"]);

console.log("Student permission policy checks passed for all five roles.");
