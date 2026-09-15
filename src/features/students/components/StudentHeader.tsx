import { useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import {
  Activity, AlertTriangle, ArchiveRestore, BarChart3, Bell, BookOpenCheck, CalendarCheck,
  ChevronRight, CircleDollarSign, ClipboardList, Database, GraduationCap, LayoutDashboard,
  Plus, Upload, UsersRound,
} from "lucide-react";
import type { OutletContext } from "../../../components/AppShell";
import { Badge, Button, Modal } from "../../../components/ui";
import { can, canVisit, firstSectionFor, roles } from "../permissions";
import type { StudentRole, StudentSection } from "../types";
import { useStudents } from "../StudentContext";

export const sectionMeta: Record<StudentSection, { label: string; title: string; description: string; icon: typeof LayoutDashboard }> = {
  overview:{label:"业务总览",title:"学员业务总览",description:"覆盖招生成交、教务履约与学员成长的全周期经营视图",icon:LayoutDashboard},
  records:{label:"学员档案",title:"学员档案",description:"统一维护学员身份、报名、课程与服务关系",icon:UsersRound},
  leads:{label:"潜客跟进",title:"潜客跟进",description:"线索分配、跟进 SLA 与试听转化管理",icon:Activity},
  finance:{label:"订单财务",title:"订单与财务",description:"报名订单、缴费、退费和对账闭环",icon:CircleDollarSign},
  classes:{label:"班级学籍",title:"班级与学籍",description:"分班排课、异动与课时台账",icon:GraduationCap},
  attendance:{label:"考勤管理",title:"考勤管理",description:"课堂出勤、异常修正与趋势监测",icon:CalendarCheck},
  learning:{label:"学习成长",title:"学习与成长",description:"作业成绩、成长反馈、奖惩与结业档案",icon:BookOpenCheck},
  reports:{label:"经营报表",title:"学员经营报表",description:"来源、班级、缴费、考勤、流失与续报分析",icon:BarChart3},
  operations:{label:"运营审计",title:"运营与审计",description:"操作日志、数据备份与恢复演练",icon:Database},
  recycle:{label:"回收站",title:"学员回收站",description:"恢复误删档案或执行受控永久删除",icon:ArchiveRestore},
};

const warningItems = [
  ["课时不足","128 位学员剩余课时低于 10","records"],
  ["缺勤超时","34 条缺勤记录超过 24 小时未复核","attendance"],
  ["线索超时","26 条线索超过 SLA","leads"],
  ["结业临期","18 位学员将在 30 天内结业","learning"],
  ["退费风险","12 笔订单触发退费风险","finance"],
] as const;

export function StudentHeader({ section, onCreate, onImport }: { section: StudentSection; onCreate?: () => void; onImport?: () => void }) {
  const { role, setRole, scopeLabel } = useStudents();
  const { currentBusinessUnit } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const location = useLocation();
  const [alertsOpen, setAlertsOpen] = useState(false);
  const meta = sectionMeta[section];
  const allowedSections = (Object.keys(sectionMeta) as StudentSection[]).filter((item) => canVisit(role, item));
  const changeRole = (next: StudentRole) => {
    setRole(next);
    if (!canVisit(next, section)) navigate(`/students/${firstSectionFor(next)}`);
  };
  return <>
    <div className="student-breadcrumb"><span>学员业务</span><ChevronRight size={11}/><strong>{meta.label}</strong></div>
    <header className="student-page-head">
      <div><h1>{meta.title}</h1><p>{meta.description}</p></div>
      <div className="student-head-actions">
        <span className="student-tenant"><i/>{currentBusinessUnit.name}</span>
        <label className="student-role-select"><span>演示角色</span><select aria-label="演示角色" value={role} onChange={(event) => changeRole(event.target.value as StudentRole)}>{roles.map((item)=><option key={item}>{item}</option>)}</select></label>
        <button className="student-alert-btn" onClick={()=>setAlertsOpen(true)} aria-label="查看 5 类业务预警"><Bell size={16}/><b>5</b></button>
        {section === "records" && can(role,"import") && <Button variant="secondary" onClick={onImport}><Upload size={14}/>导入</Button>}
        {section === "records" && can(role,"create") && <Button onClick={onCreate}><Plus size={14}/>新建学员</Button>}
      </div>
    </header>
    <div className="student-scope-line"><span>当前数据范围</span><strong>{scopeLabel}</strong><small>权限变更即时生效，敏感字段始终脱敏</small></div>
    <nav className="student-subnav" aria-label="学员业务二级导航">
      {allowedSections.map((item) => {
        const itemMeta = sectionMeta[item];
        const Icon = itemMeta.icon;
        const active = location.pathname === `/students/${item}` || (location.pathname === "/students" && item === "overview");
        return <button className={active ? "active" : ""} onClick={()=>navigate(`/students/${item}`)} key={item}><Icon size={14}/><span>{itemMeta.label}</span>{["leads","finance","attendance"].includes(item)&&<i/>}</button>;
      })}
    </nav>
    <Modal open={alertsOpen} onClose={()=>setAlertsOpen(false)} title="学员业务预警">
      <div className="student-alert-list">{warningItems.filter((item)=>canVisit(role,item[2])).map(([title,detail,target])=><button key={title} onClick={()=>{setAlertsOpen(false);navigate(`/students/${target}`)}}><span className="tone-red"><AlertTriangle size={15}/></span><span><strong>{title}</strong><small>{detail}</small></span><Badge tone="red">待处理</Badge><ChevronRight size={14}/></button>)}</div>
    </Modal>
  </>;
}
