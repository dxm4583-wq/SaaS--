export type StudentRole = "超级管理员" | "教务管理员" | "销售顾问" | "财务管理员" | "普通教师";
export type StudentSection = "overview" | "records" | "leads" | "finance" | "classes" | "attendance" | "learning" | "reports" | "operations" | "recycle";
export type StudentAction =
  | "create" | "import" | "edit" | "delete" | "restore" | "permanentDelete"
  | "export" | "print" | "assign" | "followUp" | "createOrder" | "payment"
  | "refund" | "reconcile" | "classManage" | "hoursAdjust" | "attendance"
  | "learningEdit" | "graduate" | "backup";
export type FieldGroup = "identity" | "academic" | "sales" | "finance";
export type LifecycleStatus =
  | "潜在意向" | "已试听" | "已报名" | "在读" | "休学" | "停课"
  | "转班" | "结业" | "毕业" | "流失" | "黑名单";
export type AcademicStatus = "待分班" | "正常" | "休学" | "转班中" | "已结业";
export type PaymentState = "未支付" | "部分支付" | "已支付" | "已退款";
export type AttendanceStatus = "出勤" | "迟到" | "早退" | "请假" | "缺勤";
export type Tone = "neutral" | "blue" | "green" | "amber" | "red" | "violet";

export type Student = {
  id: string;
  name: string;
  gender: "男" | "女";
  age: number;
  phone: string;
  idCard: string;
  emergencyContact: string;
  emergencyPhone: string;
  parentName: string;
  parentPhone: string;
  school: string;
  channel: string;
  intendedCourse: string;
  enrolledCourse: string;
  tags: string[];
  status: LifecycleStatus;
  academicStatus: AcademicStatus;
  className: string;
  teacher: string;
  owner: string;
  signupTime: string;
  paymentState: PaymentState;
  contractStatus: "草稿" | "待审核" | "生效中" | "已完成" | "已取消";
  orderNo: string;
  paidAmount: number;
  tuitionAmount: number;
  refundAmount: number;
  totalHours: number;
  consumedHours: number;
  remainingHours: number;
  expiredHours: number;
  attendanceRate: number;
  assignmentCompletion: number;
  latestScore: number;
  creditScore: number;
  notes: string;
  deletedAt?: string;
};

export type Lead = {
  id: string;
  studentId: string;
  name: string;
  phone: string;
  course: string;
  channel: string;
  owner: string;
  createdAt: string;
  lastFollowAt: string;
  overdueHours: number;
  status: "待分配" | "跟进中" | "已试听" | "已转化" | "已流失";
  followUps: FollowUp[];
};

export type FollowUp = {
  id: string;
  time: string;
  method: "电话" | "微信" | "面谈" | "短信";
  content: string;
  demand: string;
  nextPlan: string;
  nextDate: string;
  attachment?: string;
  operator: string;
};

export type FinanceRecord = {
  id: string;
  studentId: string;
  studentName: string;
  orderNo: string;
  course: string;
  hours: number;
  tuition: number;
  discount: number;
  paid: number;
  refundable: number;
  paymentMethod: "微信" | "支付宝" | "银行卡" | "储值";
  paymentType: "全款" | "分期" | "储值";
  status: "待支付" | "待审核" | "已支付" | "部分退款" | "已退款";
  reviewStatus: "待复核" | "已通过" | "已驳回";
  createdAt: string;
  validity: string;
};

export type AttendanceRecord = {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  teacher: string;
  date: string;
  status: AttendanceStatus;
  corrected: boolean;
  note: string;
};

export type OperationLog = {
  id: string;
  operator: string;
  timestamp: string;
  object: string;
  action: string;
  detail: string;
  result: "成功" | "失败";
};

export type StudentFilters = {
  keyword: string;
  status: string;
  className: string;
  course: string;
  startDate: string;
  endDate: string;
  owner: string;
  tag: string;
  paymentState: string;
};

export type ColumnKey =
  | "student" | "phone" | "course" | "className" | "teacher" | "owner"
  | "status" | "tags" | "credit" | "remainingHours" | "payment" | "signupTime";

export type ColumnConfig = {
  key: ColumnKey;
  label: string;
  visible: boolean;
  width: number;
};
