import type { AttendanceRecord, FieldGroup, FinanceRecord, Lead, Student, StudentAction, StudentRole, StudentSection } from "./types";

type RolePolicy = {
  sections: StudentSection[];
  actions: StudentAction[];
  fields: FieldGroup[];
  scopeLabel: string;
  predicate: (student: Student) => boolean;
};

export type StudentReportType = "学员来源" | "班级学员" | "缴费" | "考勤" | "流失" | "续报率";
export type OverviewSeries = "payment" | "attendance" | "loss" | "renewal";

const allSections: StudentSection[] = ["overview","records","leads","finance","classes","attendance","learning","reports","operations","recycle"];
const allActions: StudentAction[] = ["create","import","edit","delete","restore","permanentDelete","export","print","assign","followUp","createOrder","payment","refund","reconcile","classManage","hoursAdjust","attendance","learningEdit","graduate","backup"];

export const rolePolicies: Record<StudentRole, RolePolicy> = {
  "超级管理员": {
    sections: allSections,
    actions: allActions,
    fields: ["identity","academic","sales","finance"],
    scopeLabel: "集团全量学员",
    predicate: () => true,
  },
  "教务管理员": {
    sections: ["overview","records","classes","attendance","learning","reports"],
    actions: ["edit","assign","classManage","hoursAdjust","attendance","learningEdit","graduate","export","print"],
    fields: ["identity","academic"],
    scopeLabel: "当前租户教务数据",
    predicate: () => true,
  },
  "销售顾问": {
    sections: ["overview","records","leads","finance","reports"],
    actions: ["create","edit","followUp","assign","createOrder","export","print"],
    fields: ["identity","sales"],
    scopeLabel: "本人负责学员 · 林晓曼",
    predicate: (student) => student.owner === "林晓曼",
  },
  "财务管理员": {
    sections: ["overview","records","finance","reports"],
    actions: ["payment","refund","reconcile","export","print"],
    fields: ["identity","finance"],
    scopeLabel: "财务相关学员最小信息",
    predicate: (student) => student.contractStatus !== "已取消",
  },
  "普通教师": {
    sections: ["overview","records","attendance","learning"],
    actions: ["attendance","learningEdit"],
    fields: ["identity","academic"],
    scopeLabel: "王嘉任课班级",
    predicate: (student) => student.teacher === "王嘉" && student.className !== "待分班",
  },
};

const roleDetailTabs: Record<StudentRole, string[]> = {
  "超级管理员": ["基础档案","报名订单","缴费记录","班级排班","考勤记录","作业成绩","跟进记录","奖惩记录","结业档案"],
  "教务管理员": ["基础档案","班级排班","考勤记录","作业成绩","奖惩记录","结业档案"],
  "销售顾问": ["基础档案","报名订单","跟进记录"],
  "财务管理员": ["基础档案","报名订单","缴费记录"],
  "普通教师": ["基础档案","班级排班","考勤记录","作业成绩","奖惩记录"],
};

const roleExportFields: Record<StudentRole, Array<keyof Student>> = {
  "超级管理员": ["id","name","phone","enrolledCourse","className","teacher","owner","status","remainingHours","paymentState","signupTime"],
  "教务管理员": ["id","name","phone","enrolledCourse","className","teacher","status","remainingHours","signupTime"],
  "销售顾问": ["id","name","phone","enrolledCourse","owner","status","signupTime"],
  "财务管理员": ["id","name","phone","paymentState","signupTime"],
  "普通教师": ["id","name","enrolledCourse","className","teacher","status","remainingHours"],
};

const roleReportTypes: Record<StudentRole, StudentReportType[]> = {
  "超级管理员": ["学员来源","班级学员","缴费","考勤","流失","续报率"],
  "教务管理员": ["班级学员","考勤","续报率"],
  "销售顾问": ["学员来源","流失","续报率"],
  "财务管理员": ["缴费"],
  "普通教师": [],
};

const roleOverviewSeries: Record<StudentRole, OverviewSeries[]> = {
  "超级管理员": ["payment","attendance","loss","renewal"],
  "教务管理员": ["attendance","loss","renewal"],
  "销售顾问": ["loss","renewal"],
  "财务管理员": ["payment"],
  "普通教师": ["attendance"],
};

export const roles = Object.keys(rolePolicies) as StudentRole[];
export const can = (role: StudentRole, action: StudentAction) => rolePolicies[role].actions.includes(action);
export const canSeeField = (role: StudentRole, field: FieldGroup) => rolePolicies[role].fields.includes(field);
export const canVisit = (role: StudentRole, section: StudentSection) => rolePolicies[role].sections.includes(section);
export const firstSectionFor = (role: StudentRole) => rolePolicies[role].sections[0];
export const scopeStudents = (role: StudentRole, students: Student[]) => students.filter(rolePolicies[role].predicate);
export const canAccessStudent = (role: StudentRole, student: Student) => rolePolicies[role].predicate(student);
export const detailTabsFor = (role: StudentRole) => roleDetailTabs[role];
export const exportFieldsFor = (role: StudentRole) => roleExportFields[role];
export const reportTypesFor = (role: StudentRole) => roleReportTypes[role];
export const overviewSeriesFor = (role: StudentRole) => roleOverviewSeries[role];
export const scopeAttendance = (role: StudentRole, rows: AttendanceRecord[], students: Student[]) => {
  const ids = new Set(scopeStudents(role, students).map((student) => student.id));
  return rows.filter((row) => ids.has(row.studentId) && (role !== "普通教师" || row.teacher === "王嘉"));
};
export const scopeFinance = (role: StudentRole, rows: FinanceRecord[], students: Student[]) => {
  if (role === "超级管理员" || role === "财务管理员") return rows;
  const ids = new Set(scopeStudents(role, students).map((student) => student.id));
  return rows.filter((row) => ids.has(row.studentId));
};
export const scopeLeads = (role: StudentRole, rows: Lead[]) => role === "销售顾问"
  ? rows.filter((lead) => lead.owner === "林晓曼" || lead.owner === "待分配")
  : rows;
