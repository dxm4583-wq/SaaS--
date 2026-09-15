import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useOutletContext } from "react-router-dom";
import type { OutletContext } from "../../components/AppShell";
import { generateAttendance, generateFinance, generateLeads, generateStudents, initialLogs } from "./mockData";
import { canAccessStudent, rolePolicies, scopeAttendance, scopeFinance, scopeLeads, scopeStudents } from "./permissions";
import type { AttendanceRecord, ColumnConfig, FinanceRecord, Lead, OperationLog, Student, StudentFilters, StudentRole } from "./types";
import { defaultColumns, defaultFilters, nowTimestamp, readStorage, writeStorage } from "./utils";

const sourceStudents = generateStudents();

type StudentContextValue = {
  role: StudentRole;
  setRole: (role: StudentRole) => void;
  students: Student[];
  activeStudents: Student[];
  deletedStudents: Student[];
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
  finance: FinanceRecord[];
  setFinance: React.Dispatch<React.SetStateAction<FinanceRecord[]>>;
  attendance: AttendanceRecord[];
  scopedAttendance: AttendanceRecord[];
  scopedFinance: FinanceRecord[];
  scopedLeads: Lead[];
  setAttendance: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  logs: OperationLog[];
  filters: StudentFilters;
  setFilters: React.Dispatch<React.SetStateAction<StudentFilters>>;
  columns: ColumnConfig[];
  setColumns: React.Dispatch<React.SetStateAction<ColumnConfig[]>>;
  notify: (message: string) => void;
  updateStudent: (id: string, changes: Partial<Student>, action?: string) => void;
  addStudent: (student: Student) => void;
  softDelete: (ids: string[]) => void;
  restore: (ids: string[]) => void;
  permanentDelete: (ids: string[]) => void;
  addLog: (action: string, object: string, detail: string, result?: "成功" | "失败") => void;
  loadError: boolean;
  setLoadError: React.Dispatch<React.SetStateAction<boolean>>;
  scopeLabel: string;
};

const StudentContext = createContext<StudentContextValue | null>(null);

export function StudentProvider({ children }: { children: ReactNode }) {
  const { notify } = useOutletContext<OutletContext>();
  const [role, setRoleState] = useState<StudentRole>(() => readStorage("student-role", "超级管理员"));
  const [overrides, setOverrides] = useState<Record<string, Partial<Student>>>({});
  const [created, setCreated] = useState<Student[]>([]);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => new Set(readStorage<string[]>("student-deleted", [])));
  const [permanentIds, setPermanentIds] = useState<Set<string>>(new Set());
  const [leads, setLeads] = useState(() => generateLeads(sourceStudents));
  const [finance, setFinance] = useState(() => generateFinance(sourceStudents));
  const [attendance, setAttendance] = useState(() => generateAttendance(sourceStudents));
  const [logs, setLogs] = useState(initialLogs);
  const [filters, setFiltersState] = useState<StudentFilters>(() => readStorage("student-filters", defaultFilters));
  const [columns, setColumnsState] = useState<ColumnConfig[]>(() => readStorage("student-columns", defaultColumns));
  const [loadError, setLoadError] = useState(false);

  const students = useMemo(() => [...created, ...sourceStudents]
    .filter((student) => !permanentIds.has(student.id))
    .map((student) => ({ ...student, ...overrides[student.id], deletedAt: deletedIds.has(student.id) ? (overrides[student.id]?.deletedAt ?? nowTimestamp()) : undefined })),
  [created, overrides, deletedIds, permanentIds]);
  const activeStudents = useMemo(() => scopeStudents(role, students.filter((student) => !student.deletedAt)), [role, students]);
  const scopedAttendanceRows = useMemo(() => scopeAttendance(role, attendance, students), [role, attendance, students]);
  const scopedFinanceRows = useMemo(() => scopeFinance(role, finance, students), [role, finance, students]);
  const scopedLeadRows = useMemo(() => scopeLeads(role, leads), [role, leads]);
  const deletedStudents = useMemo(() => students.filter((student) => Boolean(student.deletedAt)), [students]);

  const addLog = useCallback((action: string, object: string, detail: string, result: "成功" | "失败" = "成功") => {
    setLogs((items) => [{
      id: `LOG-${String(items.length + 1).padStart(4, "0")}`,
      operator: role === "普通教师" ? "王嘉" : role === "销售顾问" ? "林晓曼" : role,
      timestamp: nowTimestamp(), object, action, detail, result,
    }, ...items]);
  }, [role]);
  const setRole = (next: StudentRole) => {
    setRoleState(next);
    writeStorage("student-role", next);
    notify(`已切换为${next}，当前范围：${rolePolicies[next].scopeLabel}`);
  };
  const setFilters: React.Dispatch<React.SetStateAction<StudentFilters>> = (next) => {
    setFiltersState((current) => {
      const value = typeof next === "function" ? next(current) : next;
      writeStorage("student-filters", value);
      return value;
    });
  };
  const setColumns: React.Dispatch<React.SetStateAction<ColumnConfig[]>> = (next) => {
    setColumnsState((current) => {
      const value = typeof next === "function" ? next(current) : next;
      writeStorage("student-columns", value);
      return value;
    });
  };
  const updateStudent = (id: string, changes: Partial<Student>, action = "更新") => {
    const target = students.find((student) => student.id === id);
    if (!target || !canAccessStudent(role, target)) {
      addLog("权限拦截", id, `拒绝越权操作：${action}`, "失败");
      notify("当前角色无权修改该学员");
      return;
    }
    if (role === "普通教师" && ("status" in changes || "className" in changes || "owner" in changes || "paymentState" in changes)) {
      addLog("权限拦截", target.name, `教师禁止修改档案状态：${action}`, "失败");
      notify("普通教师仅可更新作业、成绩和评语");
      return;
    }
    if (role === "财务管理员" && !Object.keys(changes).every((key) => ["refundAmount","paidAmount","paymentState","remainingHours"].includes(key))) {
      addLog("权限拦截", target.name, `财务禁止修改学员档案：${action}`, "失败");
      notify("财务角色仅可同步财务相关状态");
      return;
    }
    setOverrides((current) => ({ ...current, [id]: { ...current[id], ...changes } }));
    const name = students.find((student) => student.id === id)?.name ?? id;
    addLog(action, name, Object.keys(changes).join("、"));
  };
  const addStudent = (student: Student) => {
    setCreated((items) => [student, ...items]);
    addLog("创建", student.name, "创建学员档案");
  };
  const softDelete = (ids: string[]) => {
    const next = new Set(deletedIds);
    ids.forEach((id) => {
      next.add(id);
      setOverrides((current) => ({ ...current, [id]: { ...current[id], deletedAt: nowTimestamp() } }));
    });
    setDeletedIds(next);
    writeStorage("student-deleted", [...next]);
    addLog("删除", `${ids.length} 位学员`, "移入回收站");
  };
  const restore = (ids: string[]) => {
    const next = new Set(deletedIds);
    ids.forEach((id) => next.delete(id));
    setDeletedIds(next);
    writeStorage("student-deleted", [...next]);
    addLog("恢复", `${ids.length} 位学员`, "从回收站恢复");
  };
  const permanentDelete = (ids: string[]) => {
    setPermanentIds((current) => new Set([...current, ...ids]));
    const next = new Set(deletedIds);
    ids.forEach((id) => next.delete(id));
    setDeletedIds(next);
    writeStorage("student-deleted", [...next]);
    addLog("永久删除", `${ids.length} 位学员`, "永久删除且不可恢复");
  };

  return <StudentContext.Provider value={{
    role, setRole, students, activeStudents, deletedStudents, leads, scopedLeads: scopedLeadRows, setLeads, finance, scopedFinance: scopedFinanceRows, setFinance,
    attendance, scopedAttendance: scopedAttendanceRows, setAttendance, logs, filters, setFilters, columns, setColumns, notify, updateStudent,
    addStudent, softDelete, restore, permanentDelete, addLog, loadError, setLoadError,
    scopeLabel: rolePolicies[role].scopeLabel,
  }}>{children}</StudentContext.Provider>;
}

export function useStudents() {
  const value = useContext(StudentContext);
  if (!value) throw new Error("useStudents must be used inside StudentProvider");
  return value;
}
