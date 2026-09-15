import type { AttendanceRecord, FinanceRecord, Lead, LifecycleStatus, OperationLog, Student } from "./types";

const surnames = ["陈","林","周","沈","顾","张","李","王","赵","徐","孙","吴","刘","黄","郑","何","许","朱","胡","郭"];
const given = ["沐阳","语桐","子昂","一诺","星辰","梓涵","奕辰","可欣","天佑","安然","嘉宁","若溪","思远","雨晴","俊熙","诗涵","明轩","悦然","浩宇","欣妍"];
export const courses = ["CPA会计全程班","中级会计精品班","初级会计冲刺班","税务师高端班","财经素养 L3","青少年创业营"];
export const classes = ["CPA-2609-A1","CPA-2609-A2","中会-2608-B1","初会-2610-C1","税务师-2607-D1","财经-L3-E1","青创-2609-F1","待分班"];
export const teachers = ["王嘉","许晴","叶琳","顾宁","陈思远"];
export const owners = ["林晓曼","赵晨","吴欣","刘涛","周睿","孙霞"];
export const channels = ["官网咨询","企微私域","线下活动","转介绍","抖音直播","图书课程"];
export const tags = ["VIP学员","高意向","退费风险","老生续报","转介绍学员"];
export const lifecycleStatuses: LifecycleStatus[] = ["潜在意向","已试听","已报名","在读","休学","停课","转班","结业","毕业","流失","黑名单"];
export const schools = ["上海财经大学","中央财经大学","对外经贸大学","复旦大学","浙江财经大学","社会学员"];

const pad = (value: number, size = 2) => String(value).padStart(size, "0");
const seeded = (index: number, salt: number) => ((index * 9301 + salt * 49297 + 233280) % 233280) / 233280;
const pick = <T,>(items: readonly T[], index: number, salt: number) => items[Math.floor(seeded(index, salt) * items.length) % items.length];

export function generateStudents(count = 10000): Student[] {
  return Array.from({ length: count }, (_, index) => {
    const id = `STU-${pad(index + 1, 6)}`;
    const status = pick(lifecycleStatuses, index, 1);
    const totalHours = [48, 64, 80, 96, 120][index % 5];
    const consumedHours = Math.min(totalHours, (index * 7) % (totalHours + 1));
    const refundAmount = status === "流失" && index % 3 === 0 ? 1200 + (index % 5) * 500 : 0;
    const tuitionAmount = 6800 + (index % 12) * 850;
    const paidAmount = Math.max(0, tuitionAmount - (index % 4 === 0 ? 2000 : 0) - refundAmount);
    const dayOffset = index % 360;
    const month = 1 + Math.floor(dayOffset / 30);
    const day = 1 + dayOffset % 28;
    const className = status === "潜在意向" || status === "已试听" ? "待分班" : pick(classes.slice(0, -1), index, 4);
    const phone = `1${[3,5,6,7,8,9][index % 6]}${pad((170000000 + index * 7919) % 1000000000, 9)}`;
    return {
      id,
      name: `${pick(surnames, index, 2)}${pick(given, index, 3)}`,
      gender: index % 2 ? "女" : "男",
      age: 16 + index % 31,
      phone,
      idCard: `${310101 + index % 80}19${70 + index % 30}${pad(1 + index % 12)}${pad(1 + index % 28)}${pad(index % 10000, 4)}`,
      emergencyContact: `${pick(surnames, index, 8)}女士`,
      emergencyPhone: `1${[3,8,9][index % 3]}${pad((210000000 + index * 3571) % 1000000000, 9)}`,
      parentName: `${pick(surnames, index, 9)}${index % 2 ? "女士" : "先生"}`,
      parentPhone: `1${[3,5,8][index % 3]}${pad((310000000 + index * 6361) % 1000000000, 9)}`,
      school: pick(schools, index, 10),
      channel: pick(channels, index, 11),
      intendedCourse: pick(courses, index, 12),
      enrolledCourse: pick(courses, index, 13),
      tags: index % 7 === 0 ? [pick(tags, index, 14), pick(tags, index, 15)] : index % 3 === 0 ? [pick(tags, index, 14)] : [],
      status,
      academicStatus: status === "休学" ? "休学" : status === "转班" ? "转班中" : ["结业","毕业"].includes(status) ? "已结业" : className === "待分班" ? "待分班" : "正常",
      className,
      teacher: pick(teachers, index, 16),
      owner: pick(owners, index, 17),
      signupTime: `2026-${pad(Math.min(month, 12))}-${pad(day)} ${pad(8 + index % 11)}:${pad(index % 60)}:${pad((index * 17) % 60)}`,
      paymentState: paidAmount === 0 ? "未支付" : refundAmount > 0 ? "已退款" : paidAmount < tuitionAmount ? "部分支付" : "已支付",
      contractStatus: index % 9 === 0 ? "待审核" : index % 13 === 0 ? "已完成" : "生效中",
      orderNo: `EDU2026${pad(index + 1, 8)}`,
      paidAmount,
      tuitionAmount,
      refundAmount,
      totalHours,
      consumedHours,
      remainingHours: Math.max(0, totalHours - consumedHours),
      expiredHours: index % 17 === 0 ? index % 8 : 0,
      attendanceRate: 62 + index % 39,
      assignmentCompletion: 55 + (index * 3) % 46,
      latestScore: 58 + (index * 7) % 43,
      creditScore: 55 + (index * 11) % 46,
      notes: index % 5 === 0 ? "关注续报节点，家长偏好晚间沟通。" : "学员档案信息完整。",
    };
  });
}

export function generateLeads(students: Student[]): Lead[] {
  return students.slice(0, 180).map((student, index) => ({
    id: `LEAD-${pad(index + 1, 5)}`,
    studentId: student.id,
    name: student.name,
    phone: student.phone,
    course: student.intendedCourse,
    channel: student.channel,
    owner: index % 4 === 0 ? "待分配" : student.owner,
    createdAt: student.signupTime,
    lastFollowAt: `2026-09-${pad(1 + index % 14)} ${pad(8 + index % 10)}:${pad(index % 60)}:00`,
    overdueHours: index % 6 === 0 ? 28 + index % 50 : index % 18,
    status: ["待分配","跟进中","已试听","已转化","已流失"][index % 5] as Lead["status"],
    followUps: index % 3 === 0 ? [{
      id: `FU-${index}`,
      time: `2026-09-${pad(10 + index % 5)} 10:30:00`,
      method: "电话",
      content: "沟通课程安排与近期学习目标。",
      demand: "希望周末上课并提供阶段测评。",
      nextPlan: "发送班型方案并确认试听。",
      nextDate: "2026-09-18",
      operator: student.owner,
    }] : [],
  }));
}

export function generateFinance(students: Student[]): FinanceRecord[] {
  return students.slice(300, 540).map((student, index) => ({
    id: `PAY-${pad(index + 1, 6)}`,
    studentId: student.id,
    studentName: student.name,
    orderNo: student.orderNo,
    course: student.enrolledCourse,
    hours: student.totalHours,
    tuition: student.tuitionAmount,
    discount: index % 4 === 0 ? 800 : 0,
    paid: student.paidAmount,
    refundable: Math.max(0, student.paidAmount - student.refundAmount),
    paymentMethod: ["微信","支付宝","银行卡","储值"][index % 4] as FinanceRecord["paymentMethod"],
    paymentType: ["全款","分期","储值"][index % 3] as FinanceRecord["paymentType"],
    status: index % 8 === 0 ? "待支付" : index % 11 === 0 ? "部分退款" : "已支付",
    reviewStatus: index % 7 === 0 ? "待复核" : "已通过",
    createdAt: student.signupTime,
    validity: "2027-09-30",
  }));
}

export function generateAttendance(students: Student[]): AttendanceRecord[] {
  return students.slice(0, 600).map((student, index) => ({
    id: `ATT-${pad(index + 1, 6)}`,
    studentId: student.id,
    studentName: student.name,
    className: student.className,
    teacher: student.teacher,
    date: `2026-09-${pad(1 + index % 15)} ${pad(8 + index % 11)}:00:00`,
    status: ["出勤","出勤","出勤","迟到","早退","请假","缺勤"][index % 7] as AttendanceRecord["status"],
    corrected: false,
    note: index % 7 === 6 ? "系统标记缺勤，待班主任复核。" : "",
  }));
}

export const initialLogs: OperationLog[] = [
  { id:"LOG-0001", operator:"林晓曼", timestamp:"2026-09-15 10:42:18", object:"陈沐阳", action:"更新", detail:"更新学员跟进备注", result:"成功" },
  { id:"LOG-0002", operator:"王嘉", timestamp:"2026-09-15 10:18:03", object:"CPA-2609-A1", action:"考勤", detail:"批量录入 28 位学员考勤", result:"成功" },
  { id:"LOG-0003", operator:"财务系统", timestamp:"2026-09-15 09:52:44", object:"PAY-000016", action:"支付复核", detail:"银行卡支付凭证复核通过", result:"成功" },
  { id:"LOG-0004", operator:"系统自动", timestamp:"2026-09-15 09:30:00", object:"数据备份", action:"备份", detail:"每日增量备份完成", result:"成功" },
];
