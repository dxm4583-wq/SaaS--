import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Bell, Bot, BriefcaseBusiness, Building2, ChartNoAxesCombined, ChevronDown, ChevronLeft,
  ChevronRight, CircleDollarSign, ContactRound, GraduationCap, LayoutDashboard, ListTodo,
  Megaphone, Menu, Moon, Search, Settings, ShieldCheck, Sparkles, Sun, TicketCheck, TimerReset, UserRound, UserRoundSearch, UsersRound, WandSparkles, Workflow,
} from "lucide-react";
import { Avatar, Badge, Button, Drawer } from "./ui";
import {
  BUSINESS_UNIT_STORAGE_KEY,
  businessUnits,
  formatCustomerCount,
  GROUP_EMPLOYEE_COUNT,
  GROUP_SALES_COUNT,
  getBusinessUnit,
  type BusinessUnit,
  type BusinessUnitId,
} from "../data/organization";

const dashboardNavItem = { to: "/", label: "工作台", icon: LayoutDashboard };

const navGroups = [
  {
    label: "业务协同",
    items: [
      { to: "/leads", label: "线索管理", icon: UserRoundSearch },
      { to: "/customers", label: "客户管理", icon: ContactRound },
      { to: "/opportunities", label: "商机管理", icon: BriefcaseBusiness },
      { to: "/tasks", label: "任务中心", icon: ListTodo },
      { to: "/contracts", label: "合同与回款", icon: CircleDollarSign },
      { to: "/tickets", label: "工单中心", icon: TicketCheck },
    ],
  },
  {
    label: "增长与智能",
    items: [
      { to: "/marketing", label: "营销管理", icon: Megaphone },
      { to: "/analytics", label: "数据中心", icon: ChartNoAxesCombined },
      { to: "/scrm", label: "SCRM 私域", icon: UsersRound },
    ],
  },
  {
    label: "AI 智能",
    items: [
      { to: "/ai-creative", label: "AI 营销素材", icon: WandSparkles },
      { to: "/ai", label: "AI 助理", icon: Bot },
    ],
  },
  {
    label: "学员业务",
    items: [
      { to: "/students", label: "学员管理", icon: GraduationCap },
    ],
  },
  {
    label: "系统管理",
    items: [
      { to: "/tenants", label: "租户管理", icon: Building2 },
      { to: "/rbac", label: "权限中心", icon: ShieldCheck },
      { to: "/strategies", label: "策略中心", icon: Workflow },
    ],
  },
] as const;

const settingTabs = ["组织与业务空间", "角色权限", "业务流程", "策略中心", "消息中心", "操作日志", "自定义字段", "数据与 API"];

function SettingsContent({
  tab,
  notify,
  openRbac,
  openStrategies,
  openTenantManagement,
  currentBusinessUnit,
  switchBusinessUnit,
}: {
  tab: string;
  notify: (message: string) => void;
  openRbac: () => void;
  openStrategies: () => void;
  openTenantManagement: () => void;
  currentBusinessUnit: BusinessUnit;
  switchBusinessUnit: (id: BusinessUnitId) => void;
}) {
  const [spaceQuery, setSpaceQuery] = useState("");
  if (tab === "组织与业务空间") {
    const visibleUnits = businessUnits.filter((unit) =>
      `${unit.name}${unit.code}${unit.projects.join("")}`.toLowerCase().includes(spaceQuery.trim().toLowerCase()),
    );
    return (
      <div className="org-settings">
        <div className="org-group-head">
          <span className="settings-role-mark tone-blue"><Building2 size={16}/></span>
          <div><small>集团组织</small><h3>高顿教育集团</h3><p>员工 {GROUP_EMPLOYEE_COUNT.toLocaleString("zh-CN")} 人 · 销售 {GROUP_SALES_COUNT.toLocaleString("zh-CN")} 人 · 13 个独立业务空间</p></div>
        </div>
        <div className="isolation-banner"><ShieldCheck size={17}/><div><strong>当前处于独立数据域</strong><small>{currentBusinessUnit.name}（{currentBusinessUnit.code}）的数据访问受 tenant_id 强制约束</small></div><Badge tone="green">隔离正常</Badge></div>
        <div className="tenant-admin-entry"><div><strong>平台租户管理</strong><small>统一管理开通、配额、管理员与生命周期</small></div><Button onClick={openTenantManagement}>进入租户管理<ChevronRight size={14}/></Button></div>
        <label className="space-search"><Search size={14}/><input value={spaceQuery} onChange={(event)=>setSpaceQuery(event.target.value)} placeholder="搜索业务空间、代码或项目"/></label>
        <div className="business-space-list">
          {visibleUnits.map((unit) => {
            const current = unit.id === currentBusinessUnit.id;
            return <article className={current ? "current" : ""} key={unit.id}>
              <span className={`space-tone tone-${unit.tone}`}><Building2 size={15}/></span>
              <div className="space-copy"><strong>{unit.name}</strong><small>{unit.code} · {unit.projects.length} 个项目 · 管理员 {unit.administrator}</small><p>{unit.projects.slice(0,3).join("、")}{unit.projects.length > 3 ? " 等" : ""}</p></div>
              <div className="space-stats"><span><b>{unit.members}</b> 成员</span><span><b>{unit.salesMembers}</b> 销售</span><span><b>{formatCustomerCount(unit.customers)}</b> 客户</span></div>
              <Badge tone="green">{unit.isolationState}</Badge>
              {current ? <Badge tone="blue">当前</Badge> : <Button variant="secondary" onClick={()=>switchBusinessUnit(unit.id)}>切换</Button>}
            </article>;
          })}
          {!visibleUnits.length && <div className="empty-state"><strong>未找到业务空间</strong><p>请尝试按事业部名称、代码或项目搜索。</p></div>}
        </div>
      </div>
    );
  }
  if (tab === "角色权限") return (
    <div className="settings-rbac">
      <div className="settings-rbac-head"><div><h3>角色与数据权限</h3><p className="subtle">统一管理功能、数据范围与敏感字段。</p></div><Button onClick={openRbac}>进入权限配置<ChevronRight size={14}/></Button></div>
      <div className="settings-role-list">
        {[
          ["平台超级管理员","3 位成员","集团元数据","系统配置 · 敏感访问仍审计"],
          ["租户管理员",`${Math.max(2, Math.round(currentBusinessUnit.members * .03))} 位成员`,"当前租户","当前租户数据与配置全权管理"],
          ["租户部门主管",`${Math.round(currentBusinessUnit.members * .12)} 位成员`,"部门及子部门","当前租户部门、子团队与审批报表"],
          ["租户普通员工",`${Math.round(currentBusinessUnit.members * .78)} 位成员`,"本人记录","本人记录与日常业务操作"],
        ].map((role,index)=><div className="settings-role-row" key={role[0]}><span className={`settings-role-mark tone-${index===0?"blue":index===1?"amber":"green"}`}>{index===0?<Settings size={15}/>:<UsersRound size={15}/>}</span><div><strong>{role[0]}</strong><small>{role[1]} · {role[2]}</small></div><span>{role[3]}</span></div>)}
      </div>
      <div className="settings-rbac-foot"><span>当前空间：{currentBusinessUnit.name} · 策略 v3.6</span><button className="link" onClick={openRbac}>查看完整权限矩阵</button></div>
    </div>
  );
  if (tab === "业务流程") return (
    <div><h3>自动化工作流</h3>{["商机金额 > 10 万 → 主管审批","客户 7 天未跟进 → 提醒负责人","回款逾期 3 天 → 通知财务"].map((x,i)=><div className="task-row" key={x}><Badge tone={i===1?"amber":"blue"}>{i===1?"已暂停":"运行中"}</Badge><div className="task-main"><strong>{x}</strong><small>最近执行 {12-i*3} 次</small></div><Button variant="secondary" onClick={()=>notify(`已打开工作流：${x}`)}>编辑</Button></div>)}</div>
  );
  if (tab === "策略中心") return (
    <div className="settings-strategy">
      <div className="settings-rbac-head"><div><h3>策略配置中心</h3><p className="subtle">统一管理服务时效与线索自动分配。</p></div><Button onClick={openStrategies}>进入策略配置中心<ChevronRight size={14}/></Button></div>
      <div className="settings-strategy-grid">
        <div><span className="settings-role-mark tone-blue"><TimerReset size={15}/></span><div><small>SLA 规则</small><strong>6 条</strong><p><Badge tone="green">5 条启用</Badge></p></div></div>
        <div><span className="settings-role-mark tone-violet"><Workflow size={15}/></span><div><small>线索分发规则</small><strong>4 条</strong><p><Badge tone="green">4 条启用</Badge></p></div></div>
      </div>
      <div className="settings-strategy-health">
        <div><span><ShieldCheck size={14}/>今日 SLA 达标率</span><strong>94.7%</strong></div>
        <div className="progress"><span style={{width:"94.7%"}}/></div>
        <div><span><UsersRound size={14}/>今日已分配线索</span><strong>236 条</strong></div>
      </div>
      <p className="settings-strategy-foot">当前线上版本 v2.8 · 最近发布于 2026-09-14 09:30</p>
    </div>
  );
  if (tab === "消息中心") return (
    <div><h3>消息中心</h3>{["星瀚科技商机即将到期","华东渠道合同等待审批","3 位客户超过 10 天未跟进"].map((x,i)=><div className="task-row" key={x}><Badge tone={i===2?"red":"blue"}>{i===0?"预警":"待办"}</Badge><div className="task-main"><strong>{x}</strong><small>今天 {9+i}:30</small></div></div>)}</div>
  );
  if (tab === "操作日志") return (
    <div><h3>最近操作</h3><div className="timeline">{["林晓曼 更新了客户「星瀚科技」负责人","赵晨 导出了 2026 年 9 月销售数据","系统 自动创建回款逾期提醒","陈思远 修改了商机阶段"].map((x,i)=><div className="timeline-item" key={x}>{x}<small>09 月 {14-i} 日 · {10+i}:24</small></div>)}</div></div>
  );
  if (tab === "自定义字段") return (
    <div><h3>客户自定义字段</h3><table className="data-table"><thead><tr><th>字段名</th><th>类型</th><th>必填</th></tr></thead><tbody>{[["年度预算","金额","是"],["采购周期","单选","否"],["决策人偏好","文本","否"]].map(r=><tr key={r[0]}>{r.map(c=><td key={c}>{c}</td>)}</tr>)}</tbody></table></div>
  );
  return <div><h3>数据导出与 API</h3><p className="subtle">管理数据归档、开放接口和应用密钥。</p><div className="task-row"><div className="task-main"><strong>客户数据全量导出</strong><small>上次导出：2026-09-10 16:20</small></div><Button variant="secondary" onClick={()=>notify("全量导出申请已提交")}>申请导出</Button></div><div className="task-row"><div className="task-main"><strong>生产环境 API Key</strong><small>crm_live_••••••••42AF · 仅显示一次</small></div><Button variant="secondary" onClick={()=>notify("新的 API Key 已生成并复制")}>重新生成</Button></div></div>;
}

export default function AppShell() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("growth-theme") === "dark");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState(settingTabs[0]);
  const [toast, setToast] = useState("");
  const [currentBusinessUnit, setCurrentBusinessUnit] = useState(() =>
    getBusinessUnit(localStorage.getItem(BUSINESS_UNIT_STORAGE_KEY)),
  );
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("growth-theme", dark ? "dark" : "light");
  }, [dark]);
  useEffect(() => setMobileOpen(false), [location.pathname]);
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };
  const switchBusinessUnit = (id: BusinessUnitId) => {
    const nextUnit = getBusinessUnit(id);
    setCurrentBusinessUnit(nextUnit);
    localStorage.setItem(BUSINESS_UNIT_STORAGE_KEY, nextUnit.id);
    notify(`已切换至 ${nextUnit.name}，权限上下文已更新`);
  };
  const openAiAssistant = () => {
    if (location.pathname === "/ai") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      notify("已回到 AI 助手顶部");
      return;
    }
    navigate("/ai");
  };

  return (
    <div className="app-shell">
      {mobileOpen && <button className="mobile-scrim" aria-label="关闭导航" onClick={()=>setMobileOpen(false)}/>}
      <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
        <div className="brand"><div className="brand-mark"><ChartNoAxesCombined size={20}/></div><div className="brand-copy"><strong>高顿业务中台</strong><small>集团客户与增长平台</small></div></div>
        <button className="collapse-btn" onClick={()=>setCollapsed(!collapsed)} aria-label={collapsed?"展开侧边栏":"收起侧边栏"}>{collapsed?<ChevronRight size={13}/>:<ChevronLeft size={13}/>}</button>
        <nav className="nav" aria-label="主导航">
          <NavLink to={dashboardNavItem.to} end title={dashboardNavItem.label}>
            <dashboardNavItem.icon size={18}/><span>{dashboardNavItem.label}</span>
          </NavLink>
          {navGroups.map((group, groupIndex) => (
            <div className="nav-group-wrap" key={group.label}>
              {groupIndex > 0 && <div className="nav-divider" role="separator"/>}
              <section className="nav-group" aria-labelledby={`nav-group-${groupIndex}`}>
                <span className="nav-group-label" id={`nav-group-${groupIndex}`}>{group.label}</span>
                {group.items.map(({to,label,icon:Icon}) => (
                  <NavLink key={to} to={to} title={label}><Icon size={18}/><span>{label}</span></NavLink>
                ))}
              </section>
            </div>
          ))}
        </nav>
        <div className="sidebar-foot"><button className="tenant" onClick={()=>{setSettingsTab("组织与业务空间");setSettingsOpen(true)}}><Avatar name={currentBusinessUnit.name}/><span className="tenant-copy"><strong>{currentBusinessUnit.name}</strong><small>租户管理员 · 独立数据域</small></span><ChevronDown size={14}/></button></div>
      </aside>
      <div className={`workspace ${collapsed ? "collapsed" : ""}`}>
        <header className="topbar">
          <button className="icon-btn mobile-menu" aria-label="打开导航" onClick={()=>setMobileOpen(true)}><Menu size={19}/></button>
          <label className="global-search"><Search size={16}/><input placeholder="搜索客户、商机、合同或学员…" onKeyDown={e=>e.key==="Enter"&&notify(`正在全局搜索：${e.currentTarget.value || "全部"}`)}/></label>
          <div className="top-actions">
            <button className="business-context-btn" onClick={()=>{setSettingsTab("组织与业务空间");setSettingsOpen(true)}} title="切换业务空间"><Building2 size={15}/><span>{currentBusinessUnit.name}</span><Badge tone="green">独立</Badge><ChevronDown size={13}/></button>
            <button className="icon-btn notification" title="通知中心" onClick={()=>{setSettingsTab("消息中心");setSettingsOpen(true)}}><Bell size={18}/></button>
            <button className="icon-btn" title={dark?"切换亮色":"切换深色"} onClick={()=>setDark(!dark)}>{dark?<Sun size={18}/>:<Moon size={18}/>}</button>
            <button className="icon-btn" title="企业设置" onClick={()=>setSettingsOpen(true)}><Settings size={18}/></button>
          </div>
        </header>
        <main className="content"><Outlet context={{notify, currentBusinessUnit, switchBusinessUnit}} /></main>
      </div>
      <Drawer open={settingsOpen} onClose={()=>setSettingsOpen(false)} title="集团与系统设置" wide>
        <div className="settings-menu"><nav className="settings-nav">{settingTabs.map(tab=><button className={tab===settingsTab?"active":""} onClick={()=>setSettingsTab(tab)} key={tab}>{tab}</button>)}</nav><div className="settings-content"><SettingsContent tab={settingsTab} notify={notify} openRbac={()=>{setSettingsOpen(false);navigate("/rbac")}} openStrategies={()=>{setSettingsOpen(false);navigate("/strategies")}} openTenantManagement={()=>{setSettingsOpen(false);navigate("/tenants")}} currentBusinessUnit={currentBusinessUnit} switchBusinessUnit={switchBusinessUnit}/></div></div>
      </Drawer>
      <button
        className="ai-fab"
        type="button"
        aria-label="打开 AI 销售助手"
        onClick={openAiAssistant}
      >
        <span className="ai-fab-avatar" aria-hidden="true">
          <UserRound size={23} strokeWidth={2.1}/>
          <span className="ai-fab-status"><Sparkles size={9} strokeWidth={2.5}/></span>
        </span>
        <span className="ai-fab-label">AI 助手</span>
      </button>
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

export type OutletContext = {
  notify: (message: string) => void;
  currentBusinessUnit: BusinessUnit;
  switchBusinessUnit: (id: BusinessUnitId) => void;
};
