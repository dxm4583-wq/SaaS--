export type BusinessUnitId =
  | "FIN-ACC"
  | "FIN-CERT"
  | "ECON"
  | "GAOKAO"
  | "POSTGRAD"
  | "VOCATION"
  | "EDU-TRAVEL"
  | "CAREER"
  | "INTERNATIONAL"
  | "GLOBAL-FIN"
  | "PUBLIC-SECTOR"
  | "LANGUAGE"
  | "EXEC-EDU";

export type BusinessUnit = {
  id: BusinessUnitId;
  code: BusinessUnitId;
  name: string;
  projects: string[];
  members: number;
  customers: number;
  administrator: string;
  tone: "blue" | "green" | "amber" | "violet";
  isolationState: "独立数据域";
  grantCount: number;
  salesMembers: number;
};

export type BusinessUnitContext = {
  currentBusinessUnit: BusinessUnit;
  switchBusinessUnit: (id: BusinessUnitId) => void;
};

export const BUSINESS_UNIT_STORAGE_KEY = "growth-business-unit";
export const GROUP_EMPLOYEE_COUNT = 3000;
export const GROUP_SALES_COUNT = 2000;

export const businessUnits: BusinessUnit[] = [
  { id: "FIN-ACC", code: "FIN-ACC", name: "财会资格事业部", projects: ["初级会计职称", "中级会计职称", "高级会计职称", "CPA", "CMA", "ACCA", "税务师", "财经实操"], members: 404, salesMembers: 270, customers: 128420, administrator: "林晓曼", tone: "blue", isolationState: "独立数据域", grantCount: 2 },
  { id: "FIN-CERT", code: "FIN-CERT", name: "金融资格事业部", projects: ["基金从业", "证券从业", "银行从业", "期货从业", "FRM", "CFA", "CQF", "ESG"], members: 302, salesMembers: 201, customers: 96840, administrator: "周睿", tone: "green", isolationState: "独立数据域", grantCount: 1 },
  { id: "ECON", code: "ECON", name: "经济师事业部", projects: ["中级经济师", "高级经济师"], members: 135, salesMembers: 90, customers: 45210, administrator: "许晴", tone: "amber", isolationState: "独立数据域", grantCount: 0 },
  { id: "GAOKAO", code: "GAOKAO", name: "高考志愿填报事业部", projects: ["高报"], members: 102, salesMembers: 68, customers: 31860, administrator: "陈越", tone: "violet", isolationState: "独立数据域", grantCount: 1 },
  { id: "POSTGRAD", code: "POSTGRAD", name: "大学生升学事业部", projects: ["保研", "考研", "学科辅导", "大学英语四六级", "统招专升本"], members: 350, salesMembers: 234, customers: 112560, administrator: "韩知远", tone: "blue", isolationState: "独立数据域", grantCount: 2 },
  { id: "VOCATION", code: "VOCATION", name: "热门职业资格事业部", projects: ["公共营养师", "心理咨询师", "健康管理师", "社会工作师", "国际薪税师", "AI 教育"], members: 248, salesMembers: 165, customers: 78430, administrator: "沈佳", tone: "green", isolationState: "独立数据域", grantCount: 1 },
  { id: "EDU-TRAVEL", code: "EDU-TRAVEL", name: "教育文旅及度假事业部", projects: ["海外研游学", "景点门票", "青少年独立营"], members: 119, salesMembers: 79, customers: 22460, administrator: "陆遥", tone: "amber", isolationState: "独立数据域", grantCount: 0 },
  { id: "CAREER", code: "CAREER", name: "大学生实习与就业事业部", projects: ["小马学长", "大学生陪跑", "线上实训"], members: 186, salesMembers: 124, customers: 53820, administrator: "马骁", tone: "violet", isolationState: "独立数据域", grantCount: 1 },
  { id: "INTERNATIONAL", code: "INTERNATIONAL", name: "国际课程事业部", projects: ["紫藤国际", "国际竞赛", "国际学校备考"], members: 167, salesMembers: 111, customers: 37690, administrator: "唐蕴", tone: "blue", isolationState: "独立数据域", grantCount: 1 },
  { id: "GLOBAL-FIN", code: "GLOBAL-FIN", name: "财经国际证书事业部", projects: ["CPA", "ACCA", "CFA", "税务师"], members: 231, salesMembers: 154, customers: 62150, administrator: "顾宁", tone: "green", isolationState: "独立数据域", grantCount: 2 },
  { id: "PUBLIC-SECTOR", code: "PUBLIC-SECTOR", name: "考公考编事业部", projects: ["公务员", "事业单位", "银行考试招聘", "国企招聘", "军队文职", "教师招聘"], members: 279, salesMembers: 186, customers: 88470, administrator: "宋然", tone: "amber", isolationState: "独立数据域", grantCount: 1 },
  { id: "LANGUAGE", code: "LANGUAGE", name: "留学语培事业部", projects: ["海外留学", "雅思", "托福", "GRE", "GMAT", "日语", "韩语", "法语", "德语", "实用英语"], members: 327, salesMembers: 218, customers: 104730, administrator: "叶琳", tone: "violet", isolationState: "独立数据域", grantCount: 2 },
  { id: "EXEC-EDU", code: "EXEC-EDU", name: "在职硕博事业部", projects: ["在职考研", "博士申请", "同等学力申硕"], members: 150, salesMembers: 100, customers: 41920, administrator: "梁卓", tone: "blue", isolationState: "独立数据域", grantCount: 0 },
];

export const defaultBusinessUnit = businessUnits[0];

export function getBusinessUnit(id: string | null): BusinessUnit {
  return businessUnits.find((unit) => unit.id === id) ?? defaultBusinessUnit;
}

export function formatCustomerCount(value: number): string {
  return value >= 10000 ? `${(value / 10000).toFixed(1)} 万` : value.toLocaleString("zh-CN");
}
