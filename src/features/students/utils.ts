import type { ColumnConfig, LifecycleStatus, Student, StudentFilters, Tone } from "./types";

export const maskPhone = (phone: string) => phone.replace(/^(\d{3})\d{4}(\d{4})$/, "$1****$2");
export const maskId = (id: string) => id.length >= 10 ? `${id.slice(0, 6)}********${id.slice(-4)}` : "******";
export const money = (value: number) => `¥${value.toLocaleString("zh-CN")}`;
export const nowTimestamp = () => {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth()+1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};
export const downloadBlob = (filename: string, content: string, type = "text/csv;charset=utf-8") => {
  const blob = new Blob(["\ufeff", content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
export const exportStudentsCsv = (students: Student[], fields?: Array<keyof Student>) => {
  const keys = fields ?? ["id","name","phone","enrolledCourse","className","teacher","owner","status","remainingHours","paymentState","signupTime"];
  const rows = students.map((student) => keys.map((key) => {
    const raw = key === "phone" ? maskPhone(student.phone) : student[key];
    const value = Array.isArray(raw) ? raw.join("|") : String(raw ?? "");
    return `"${value.replace(/"/g,'""')}"`;
  }).join(","));
  downloadBlob(`学员数据_${nowTimestamp().replace(/[-: ]/g,"")}.csv`, [keys.join(","), ...rows].join("\n"));
};

export const statusTone = (status: LifecycleStatus): Tone => {
  if (status === "在读" || status === "毕业" || status === "结业") return "green";
  if (status === "流失" || status === "黑名单") return "red";
  if (status === "休学" || status === "停课") return "neutral";
  if (status === "转班") return "violet";
  return "blue";
};
export const creditMeta = (score: number) => score >= 90
  ? { label: "优质", tone: "green" as Tone }
  : score >= 70 ? { label: "普通", tone: "blue" as Tone }
  : { label: "风险", tone: "red" as Tone };

export const defaultFilters: StudentFilters = {
  keyword:"", status:"", className:"", course:"", startDate:"", endDate:"", owner:"", tag:"", paymentState:"",
};
export const defaultColumns: ColumnConfig[] = [
  {key:"student",label:"学员",visible:true,width:148},
  {key:"phone",label:"手机",visible:true,width:116},
  {key:"course",label:"课程",visible:true,width:164},
  {key:"className",label:"班级",visible:true,width:136},
  {key:"teacher",label:"教师",visible:true,width:82},
  {key:"owner",label:"负责人",visible:true,width:88},
  {key:"status",label:"状态",visible:true,width:84},
  {key:"tags",label:"标签",visible:true,width:150},
  {key:"credit",label:"信用",visible:true,width:90},
  {key:"remainingHours",label:"剩余课时",visible:true,width:96},
  {key:"payment",label:"缴费",visible:true,width:90},
  {key:"signupTime",label:"报名时间",visible:true,width:166},
];

export const readStorage = <T,>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) as T : fallback;
  } catch {
    return fallback;
  }
};
export const writeStorage = (key: string, value: unknown) => localStorage.setItem(key, JSON.stringify(value));
