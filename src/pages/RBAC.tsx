import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useOutletContext } from "react-router-dom";
import {
  AlertTriangle, ArrowRight, Building2, Check, CheckCircle2, Eye, EyeOff, FileClock,
  FileKey2, Fingerprint, KeyRound, LayoutDashboard, LockKeyhole, Plus, Search,
  ShieldCheck, UserCog, UsersRound, X,
} from "lucide-react";
import type { OutletContext } from "../components/AppShell";
import {
  businessUnits, formatCustomerCount, GROUP_EMPLOYEE_COUNT, GROUP_SALES_COUNT,
  type BusinessUnit, type BusinessUnitId,
} from "../data/organization";
import { Avatar, Badge, Button, Card, Drawer, Modal, PageHeader, Tabs } from "../components/ui";

type RoleId = "platform" | "unitAdmin" | "manager" | "specialist";
type FieldMode = "可见" | "脱敏" | "不可见";
type GrantStatus = "生效中" | "待审批" | "已撤销";
type Grant = { id: string; source: string; target: string; object: string; capability: string; expiry: string; approver: string; reason: string; status: GrantStatus };
type PreviewMember = { name: string; department: string; role: string; grant: string };
type UnitPreview = {
  customers: string[][];
  departments: string[];
  grants: Grant[];
  members: PreviewMember[];
  workedExample: string;
};
type PermissionMap = Record<string, Record<string, boolean>>;

const roles = [
  { id: "platform", name: "平台超级管理员", summary: "集团系统配置与元数据治理", scope: "13 个业务空间", ratio: .01, modules: 11 },
  { id: "unitAdmin", name: "租户管理员", summary: "当前租户数据与配置全权管理", scope: "当前租户全部数据", ratio: .03, modules: 11 },
  { id: "manager", name: "租户部门主管", summary: "当前租户部门、子团队与审批报表", scope: "本部门及子部门", ratio: .12, modules: 9 },
  { id: "specialist", name: "租户普通员工", summary: "本人记录与日常业务操作", scope: "仅本人", ratio: .78, modules: 7 },
] as const;
const tabs = ["权限总览", "组织与隔离", "功能权限", "数据权限", "字段权限", "成员与授权"];
const modules = ["线索", "客户", "商机", "任务", "合同回款", "数据分析", "工单", "SCRM", "学员", "AI", "系统设置"];
const actions = ["查看", "新建", "编辑", "删除", "导出", "审批"];
const dataScopes = ["仅本人", "本人及下属", "本部门", "本部门及子部门", "当前租户全部数据", "已授权业务空间", "集团全部数据"];
const visibleModules: Record<RoleId, string[]> = {
  platform: modules,
  unitAdmin: modules,
  manager: modules.filter((name) => !["系统设置", "SCRM"].includes(name)),
  specialist: ["线索", "客户", "商机", "任务", "工单", "学员", "AI"],
};
function makePermissions(role: RoleId): PermissionMap {
  return Object.fromEntries(modules.map((module) => [module, Object.fromEntries(actions.map((action) => {
    if (role === "platform" || role === "unitAdmin") return [action, true];
    if (role === "manager") return [action, visibleModules.manager.includes(module) && action !== "删除"];
    return [action, visibleModules.specialist.includes(module) && ["查看", "新建", "编辑"].includes(action)];
  }))]));
}
const initialFields: Record<RoleId, Record<string, FieldMode>> = {
  platform: { 学员手机号: "可见", 报读金额: "可见", 回款账户: "可见", 身份证号: "可见", "API Key": "可见" },
  unitAdmin: { 学员手机号: "可见", 报读金额: "可见", 回款账户: "脱敏", 身份证号: "脱敏", "API Key": "不可见" },
  manager: { 学员手机号: "脱敏", 报读金额: "可见", 回款账户: "不可见", 身份证号: "脱敏", "API Key": "不可见" },
  specialist: { 学员手机号: "脱敏", 报读金额: "可见", 回款账户: "不可见", 身份证号: "不可见", "API Key": "不可见" },
};
const previewNames = ["陈思远", "赵晨", "许晴", "韩知远", "沈佳", "陆遥", "马骁", "唐蕴", "宋然", "叶琳", "梁卓", "周睿", "顾宁"];
const customerPrefixes = ["上海恒知", "苏州启衡", "杭州明策", "南京远卓", "深圳知行", "成都新程", "武汉博远", "宁波汇学"];
const customerSuffixes = ["教育", "咨询", "科技", "人才服务", "企业管理"];

function projectDepartment(project: string): string {
  return `${project.replace(/\s+/g, "")}项目部`;
}

function createUnitPreview(unit: BusinessUnit): UnitPreview {
  const unitIndex = businessUnits.findIndex((item) => item.id === unit.id);
  const departments = Array.from(new Set(unit.projects.slice(0, 4).map(projectDepartment)));
  while (departments.length < 4) departments.push(["客户运营部", "渠道发展部", "教学服务部", "市场增长部"][departments.length]);
  const names = [
    unit.administrator,
    previewNames[(unitIndex + 1) % previewNames.length],
    previewNames[(unitIndex + 4) % previewNames.length],
    previewNames[(unitIndex + 7) % previewNames.length],
  ];
  const targetA = businessUnits[(unitIndex + 1) % businessUnits.length];
  const targetB = businessUnits[(unitIndex + 5) % businessUnits.length];
  const customers = [0, 1, 2].map((offset) => [
    `${customerPrefixes[(unitIndex + offset) % customerPrefixes.length]}${customerSuffixes[(unitIndex + offset * 2) % customerSuffixes.length]}`,
    names[offset],
    departments[offset],
    `${[138, 186, 139][offset]} ${String(2100 + unitIndex * 137 + offset * 913).slice(-4)} ${String(4096 + unitIndex * 211 + offset * 587).slice(-4)}`,
    `¥ ${(18600 + unitIndex * 1700 + offset * 6200).toLocaleString("zh-CN")}`,
  ]);
  const grants: Grant[] = [
    {
      id: `XG-202609-${String(101 + unitIndex * 2).padStart(3, "0")}`,
      source: unit.name,
      target: targetA.name,
      object: `${unit.projects[0]}学员档案`,
      capability: "只读",
      expiry: "2026-09-30",
      approver: targetA.administrator,
      reason: `${unit.projects[0]}与${targetA.projects[0]}协作服务`,
      status: "生效中",
    },
    {
      id: `XG-202609-${String(102 + unitIndex * 2).padStart(3, "0")}`,
      source: unit.name,
      target: targetB.name,
      object: "客户与商机",
      capability: "读取、导出",
      expiry: "2026-09-22",
      approver: targetB.administrator,
      reason: `${unit.projects[Math.min(1, unit.projects.length - 1)]}客户转介核验`,
      status: "待审批",
    },
  ];
  const members: PreviewMember[] = [
    { name: names[0], department: departments[0], role: "租户管理员", grant: "无临时授权" },
    { name: names[1], department: departments[1], role: "租户部门主管", grant: `${targetA.code} · 只读` },
    { name: names[2], department: departments[2], role: "租户普通员工", grant: "无临时授权" },
    { name: names[3], department: departments[3], role: "租户部门主管", grant: "无临时授权" },
  ];
  return {
    customers,
    departments,
    grants,
    members,
    workedExample: `${names[1]}访问${departments[1]}客户：租户 ${unit.code} 一致 → 部门树命中 → 下属记录 → 手机号脱敏 → 允许查看。`,
  };
}

const initialPreviews = Object.fromEntries(
  businessUnits.map((unit) => [unit.id, createUnitPreview(unit)]),
) as Record<BusinessUnitId, UnitPreview>;

export default function RBAC() {
  const { notify, currentBusinessUnit } = useOutletContext<OutletContext>();
  const [roleId, setRoleId] = useState<RoleId>("unitAdmin");
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [dirty, setDirty] = useState(false);
  const [previewing, setPreviewing] = useState(true);
  const [auditOpen, setAuditOpen] = useState(false);
  const [grantOpen, setGrantOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);
  const [grantsByUnit, setGrantsByUnit] = useState<Record<BusinessUnitId, Grant[]>>(() =>
    Object.fromEntries(businessUnits.map((unit) => [unit.id, initialPreviews[unit.id].grants])) as Record<BusinessUnitId, Grant[]>,
  );
  const [permissions, setPermissions] = useState<Record<RoleId, PermissionMap>>({
    platform: makePermissions("platform"), unitAdmin: makePermissions("unitAdmin"),
    manager: makePermissions("manager"), specialist: makePermissions("specialist"),
  });
  const [scopes, setScopes] = useState<Record<RoleId, string>>({
    platform: "集团全部数据", unitAdmin: "当前租户全部数据", manager: "本部门及子部门", specialist: "仅本人",
  });
  const [fields, setFields] = useState(initialFields);
  const [membersByUnit, setMembersByUnit] = useState<Record<BusinessUnitId, PreviewMember[]>>(() =>
    Object.fromEntries(businessUnits.map((unit) => [unit.id, initialPreviews[unit.id].members])) as Record<BusinessUnitId, PreviewMember[]>,
  );
  const [departmentsByUnit, setDepartmentsByUnit] = useState<Record<BusinessUnitId, string>>(() =>
    Object.fromEntries(businessUnits.map((unit) => [unit.id, "全部部门"])) as Record<BusinessUnitId, string>,
  );
  const unitPreview = initialPreviews[currentBusinessUnit.id];
  const grants = grantsByUnit[currentBusinessUnit.id];
  const members = membersByUnit[currentBusinessUnit.id];
  const department = departmentsByUnit[currentBusinessUnit.id];
  const setGrants: Dispatch<SetStateAction<Grant[]>> = (next) => {
    setGrantsByUnit((current) => ({
      ...current,
      [currentBusinessUnit.id]: typeof next === "function" ? next(current[currentBusinessUnit.id]) : next,
    }));
  };
  const setMembers: Dispatch<SetStateAction<PreviewMember[]>> = (next) => {
    setMembersByUnit((current) => ({
      ...current,
      [currentBusinessUnit.id]: typeof next === "function" ? next(current[currentBusinessUnit.id]) : next,
    }));
  };
  const setDepartment = (value: string) => {
    setDepartmentsByUnit((current) => ({ ...current, [currentBusinessUnit.id]: value }));
  };
  const role = roles.find((item) => item.id === roleId) ?? roles[1];
  const visibleCustomers = useMemo(
    () => roleId === "specialist" ? unitPreview.customers.slice(0, 1) : roleId === "manager" ? unitPreview.customers.slice(0, 2) : unitPreview.customers,
    [roleId, unitPreview],
  );
  const locked = roleId === "platform";
  const markDirty = () => setDirty(true);
  const togglePermission = (module: string, action: string) => {
    if (locked) return notify("平台超级管理员为锁定系统角色");
    setPermissions((current) => ({ ...current, [roleId]: { ...current[roleId], [module]: { ...current[roleId][module], [action]: !current[roleId][module][action] } } }));
    markDirty();
  };

  return (
    <div className="rbac-page enterprise-rbac">
      <div className="rbac-breadcrumb"><Building2 size={12}/>系统管理<ArrowRight size={11}/>权限与数据隔离</div>
      <PageHeader title="企业权限与数据隔离中心" description="按业务空间、组织、角色与字段统一控制数据边界" actions={<>
        <span className="space-context-chip"><Building2 size={14}/><b>{currentBusinessUnit.code}</b><span>{currentBusinessUnit.name}</span><i/>独立数据域</span>
        {dirty && <span className="unsaved-dot"><span/>有未发布变更</span>}
        <Button variant="secondary" onClick={()=>setAuditOpen(true)}><FileClock size={14}/>审计记录</Button>
        <Button onClick={()=>{setDirty(false);notify(`${currentBusinessUnit.name} · ${role.name}策略已发布`);}}><ShieldCheck size={14}/>发布策略</Button>
      </>}/>
      <div className="rbac-metrics enterprise-metrics">
        <Card><span className="metric-symbol tone-blue"><UsersRound size={17}/></span><div><small>集团员工</small><strong>{GROUP_EMPLOYEE_COUNT.toLocaleString("zh-CN")}</strong><span>13 个业务空间</span></div></Card>
        <Card><span className="metric-symbol tone-green"><UserCog size={17}/></span><div><small>销售人员</small><strong>{GROUP_SALES_COUNT.toLocaleString("zh-CN")}</strong><span>占比 66.7%</span></div></Card>
        <Card><span className="metric-symbol tone-amber"><Building2 size={17}/></span><div><small>当前租户成员</small><strong>{currentBusinessUnit.members}</strong><span>{currentBusinessUnit.salesMembers} 名销售</span></div></Card>
        <Card><span className="metric-symbol tone-green"><ShieldCheck size={17}/></span><div><small>隔离违规</small><strong>0</strong><span>近 30 天</span></div></Card>
      </div>
      <section className="role-lens enterprise-role-lens">
        <div className="role-lens-label"><Eye size={14}/><span>角色视角</span><small>同步计算功能、数据与字段权限</small></div>
        <div className="role-cards four">{roles.map((item)=><button className={`role-card ${roleId === item.id ? "active" : ""}`} onClick={()=>{setRoleId(item.id);setPreviewing(true);}} key={item.id}>
          <span className="role-card-icon">{item.id === "platform" ? <ShieldCheck size={17}/> : item.id === "unitAdmin" ? <Building2 size={17}/> : item.id === "manager" ? <UserCog size={17}/> : <UsersRound size={17}/>}</span>
          <span className="role-card-copy"><strong>{item.name}</strong><small>{item.summary}</small></span>
          <span className="role-card-meta"><b>{item.id === "platform" ? 3 : Math.max(1,Math.round(currentBusinessUnit.members * item.ratio))}</b> 位<small>{item.scope}</small></span>
          {roleId === item.id && <CheckCircle2 className="role-selected" size={16}/>}
        </button>)}</div>
      </section>
      <Card className="rbac-workspace">
        <Tabs items={tabs} active={activeTab} onChange={setActiveTab}/>
        {activeTab === "权限总览" && <OverviewTab roleId={roleId} role={role} currentCode={currentBusinessUnit.id} customers={visibleCustomers} workedExample={unitPreview.workedExample} previewing={previewing} setPreviewing={setPreviewing}/>}
        {activeTab === "组织与隔离" && <IsolationTab current={currentBusinessUnit} roleId={roleId} grants={grants} setGrants={setGrants} openGrant={()=>setGrantOpen(true)} notify={notify}/>}
        {activeTab === "功能权限" && <FunctionTab roleName={role.name} roleId={roleId} permissions={permissions} toggle={togglePermission}/>}
        {activeTab === "数据权限" && <DataTab roleId={roleId} currentCode={currentBusinessUnit.id} scopes={scopes} setScopes={setScopes} markDirty={markDirty}/>}
        {activeTab === "字段权限" && <FieldTab roleId={roleId} roleName={role.name} fields={fields} setFields={setFields} markDirty={markDirty}/>}
        {activeTab === "成员与授权" && <MembersTab unitName={currentBusinessUnit.name} total={currentBusinessUnit.members} departments={unitPreview.departments} members={members} setMembers={setMembers} department={department} setDepartment={setDepartment} openMember={()=>setMemberOpen(true)} markDirty={markDirty}/>}
      </Card>
      <Drawer open={auditOpen} onClose={()=>setAuditOpen(false)} title="权限与隔离审计" wide>
        <div className="audit-summary"><ShieldCheck size={18}/><div><strong>审计日志不可篡改</strong><small>租户切换、授权与撤销、角色及字段策略变更保留 365 天</small></div></div>
        <div className="audit-list">{[
          [currentBusinessUnit.administrator, "切换业务空间", `集团门户 → ${currentBusinessUnit.code}`, "2026-09-14 10:36"],
          [currentBusinessUnit.administrator, "发布字段策略", "身份证号：可见 → 脱敏", "2026-09-14 10:24"],
          [grants[0]?.approver ?? "系统", "批准跨部门授权", `${grants[0]?.id ?? "当前空间"} · ${grants[0]?.object ?? "学员档案"}只读`, "2026-09-13 16:18"],
          ["系统", "拒绝跨租户查询", `tenant_id 不匹配 · current ${currentBusinessUnit.code}`, "2026-09-13 14:02"],
        ].map((row)=><article key={`${row[0]}-${row[3]}`}><span className="audit-dot"/><div className="audit-main"><strong>{row[0]} · {row[1]}</strong><p>{row[2]}</p><small>{row[3]} · 已写入 WORM 审计存储</small></div></article>)}</div>
      </Drawer>
      <Modal open={grantOpen} onClose={()=>setGrantOpen(false)} title="申请跨部门协作授权">
        <form className="drawer-form" onSubmit={(event)=>{
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const targetId = form.get("target") as BusinessUnitId;
          const target = businessUnits.find((unit)=>unit.id === targetId);
          const unitIndex = businessUnits.findIndex((unit)=>unit.id === currentBusinessUnit.id);
          const id = `XG-202609-${String(301 + unitIndex * 10 + grants.length).padStart(3,"0")}`;
          setGrants((current)=>[...current,{id,source:currentBusinessUnit.name,target:target?.name ?? targetId,object:String(form.get("object")),capability:String(form.get("capability")),expiry:String(form.get("expiry")),approver:target?.administrator ?? "待分配",reason:String(form.get("reason")),status:"待审批"}]);
          setGrantOpen(false); notify(`授权申请 ${id} 已提交审批`);
        }}>
          <p className="modal-intro">授权仅在指定对象和有效期内生效，目标事业部审批后方可访问。</p>
          <div className="form-grid">
            <div className="field"><label htmlFor="grant-target">目标业务空间</label><select id="grant-target" className="select" name="target" required defaultValue=""><option value="" disabled>请选择</option>{businessUnits.filter((unit)=>unit.id !== currentBusinessUnit.id).map((unit)=><option value={unit.id} key={unit.id}>{unit.name} · {unit.code}</option>)}</select></div>
            <div className="field"><label htmlFor="grant-object">业务对象</label><select id="grant-object" className="select" name="object"><option>客户与商机</option><option>学员档案</option><option>合同回款</option><option>数据报表</option></select></div>
            <div className="field"><label htmlFor="grant-capability">授权能力</label><select id="grant-capability" className="select" name="capability"><option>只读</option><option>读取、导出</option><option>读取、编辑</option></select></div>
            <div className="field"><label htmlFor="grant-expiry">到期日</label><input id="grant-expiry" className="input" name="expiry" type="date" min="2026-09-15" defaultValue="2026-09-30" required/></div>
            <div className="field form-span-2"><label htmlFor="grant-reason">申请原因</label><textarea id="grant-reason" name="reason" required placeholder="说明协作项目、数据用途与最小必要范围"/></div>
          </div>
          <div className="member-risk-note"><AlertTriangle size={15}/><span>所有访问、导出与编辑都会记录 tenant_id，不得以临时授权替代长期角色。</span></div>
          <div className="form-actions"><Button type="button" variant="secondary" onClick={()=>setGrantOpen(false)}>取消</Button><Button type="submit">提交审批</Button></div>
        </form>
      </Modal>
      <Modal open={memberOpen} onClose={()=>setMemberOpen(false)} title={`添加成员至${currentBusinessUnit.name}`}>
        <form onSubmit={(event)=>{event.preventDefault();setMemberOpen(false);notify("成员已添加，空间边界与角色策略将在发布后生效");}}>
          <div className="field"><label htmlFor="member-user">集团成员</label><select id="member-user" className="select" required defaultValue=""><option value="" disabled>请选择集团成员</option><option>许晴 · 高顿教育集团</option><option>叶琳 · 高顿教育集团</option><option>宋然 · 高顿教育集团</option></select></div>
          <div className="field member-form-field"><label htmlFor="member-role">空间角色</label><select id="member-role" className="select"><option>租户普通员工</option><option>租户部门主管</option><option>租户管理员</option></select></div>
          <div className="member-risk-note"><AlertTriangle size={15}/><span>成员只会加入 {currentBusinessUnit.name}（{currentBusinessUnit.code}），不会自动获得其他业务空间权限。</span></div>
          <div className="form-actions"><Button type="button" variant="secondary" onClick={()=>setMemberOpen(false)}>取消</Button><Button type="submit">确认添加</Button></div>
        </form>
      </Modal>
    </div>
  );
}

type Role = typeof roles[number];
function OverviewTab({roleId,role,currentCode,customers: rows,workedExample,previewing,setPreviewing}:{roleId:RoleId;role:Role;currentCode:string;customers:string[][];workedExample:string;previewing:boolean;setPreviewing:(value:boolean)=>void}) {
  return <div className="rbac-tab-body">
    <div className="preview-banner"><span className="preview-icon"><Eye size={16}/></span><div><strong>{role.name}视角 · {role.scope}</strong><small>角色计算始终以 tenant_id = {currentCode} 为首要边界</small></div><Badge tone={previewing?"blue":"neutral"}>{previewing?"预览生效中":"预览已暂停"}</Badge><Button variant="secondary" onClick={()=>setPreviewing(!previewing)}>{previewing?<EyeOff size={13}/>:<Eye size={13}/>}切换预览</Button></div>
    <div className="overview-stats"><span><small>客户可见范围</small><strong>{roleId==="specialist"?"6%":roleId==="manager"?"34%":"100%"}</strong></span><span><small>可访问模块</small><strong>{role.modules} / 11</strong></span><span><small>数据边界</small><strong>{role.scope}</strong></span><span><small>隔离策略</small><strong>v3.6</strong></span></div>
    <div className="rbac-overview-grid">
      <section className="rbac-section"><div className="rbac-section-head"><div><h2>客户可见性预览</h2><p>组织范围与字段策略的组合结果</p></div><Badge tone="blue">{rows.length} 条样例</Badge></div><div className="table-panel" role="region" tabIndex={0} aria-label="客户可见性表格"><table className="data-table rbac-customer-table"><thead><tr><th>客户</th><th>负责人</th><th>所属部门</th><th>学员手机号</th><th>报读金额</th><th>权限结果</th></tr></thead><tbody>{rows.map((row,index)=><tr key={row[0]}><td><strong>{row[0]}</strong></td><td>{row[1]}</td><td>{row[2]}</td><td>{roleId==="unitAdmin"||index===0?row[3]:row[3].replace(/\d{4}(?=\s\d{4})/,"****")}</td><td>{row[4]}</td><td><Badge tone={index===0?"blue":"green"}>{roleId==="specialist"?"owner_id 命中":roleId==="manager"?"组织树命中":"空间内可见"}</Badge></td></tr>)}</tbody></table></div></section>
      <section className="rbac-section"><div className="rbac-section-head"><div><h2>功能可见性</h2><p>导航与操作入口同步执行</p></div><Badge tone="green">{visibleModules[roleId].length} 项</Badge></div><div className="feature-access-list">{modules.map((module)=>{const allowed=visibleModules[roleId].includes(module);return <div className={allowed?"allowed":"restricted"} key={module}><span><LayoutDashboard size={14}/></span><strong>{module}</strong>{allowed?<Check size={13}/>:<LockKeyhole size={12}/>}<small>{allowed?"允许访问":"入口隐藏"}</small></div>;})}</div></section>
    </div>
    <section className="policy-chain" tabIndex={0} aria-label="权限计算链"><div><h2>权限计算链</h2><p>任一层不通过即拒绝</p></div>{["业务空间边界","组织范围","记录归属","字段策略","最终结果"].map((step,index)=><span key={step}><i>{index+1}</i><strong>{step}</strong><small>{index===0?`tenant_id = ${currentCode}`:index===4?"允许 · 部分脱敏":"策略命中"}</small>{index<4&&<ArrowRight size={14}/>}</span>)}<aside><Fingerprint size={16}/><div><strong>计算示例</strong><p>{workedExample}</p></div></aside></section>
  </div>;
}

function IsolationTab({current,roleId,grants,setGrants,openGrant,notify}:{current:OutletContext["currentBusinessUnit"];roleId:RoleId;grants:Grant[];setGrants:React.Dispatch<React.SetStateAction<Grant[]>>;openGrant:()=>void;notify:(message:string)=>void}) {
  return <div className="rbac-tab-body isolation-tab">
    <section className="isolation-model"><div className="isolation-model-head"><div><h2>四层强制隔离模型</h2><p>策略版本 v3.6 · 计算顺序不可绕过</p></div><Badge tone="green">执行正常</Badge></div>
      <div className="isolation-flow">{[["tenant_id",`= ${current.id}`,"业务空间硬边界"],["department_id","∈ 当前组织树","部门与子团队"],["owner_id","= 当前用户 / 下属","记录级归属"],["field_policy","= 角色字段模板","敏感字段策略"]].map((step,index)=><div key={step[0]}><span>{index+1}</span><code>{step[0]}</code><strong>{step[1]}</strong><small>{step[2]}</small>{index<3&&<ArrowRight size={15}/>}</div>)}</div>
      <div className="isolation-result"><ShieldCheck size={20}/><div><small>允许记录估算</small><strong>{formatCustomerCount(Math.round(current.customers * (roleId==="specialist"?.06:roleId==="manager"?.34:1)))}</strong></div><div><small>跨空间拒绝</small><strong className="text-red">{12 + businessUnits.findIndex((unit)=>unit.id===current.id) * 3} 次</strong></div><div><small>策略版本</small><strong>v3.6</strong></div></div>
    </section>
    <section className="rbac-section"><div className="rbac-section-head"><div><h2>业务空间隔离清单</h2><p>13 个事业部均以 tenant_id 建立硬边界</p></div><Badge tone="blue">当前：{current.code}</Badge></div><div className="table-panel" role="region" tabIndex={0} aria-label="业务空间隔离清单"><table className="data-table isolation-table"><thead><tr><th>业务空间</th><th>代码</th><th>项目</th><th>成员</th><th>客户量</th><th>数据边界</th><th>授权</th><th>状态</th></tr></thead><tbody>{businessUnits.map((unit)=><tr className={unit.id===current.id?"current-space-row":""} key={unit.id}><td><strong>{unit.name}</strong>{unit.id===current.id&&<Badge tone="blue">当前</Badge>}</td><td><code>{unit.code}</code></td><td>{unit.projects.length}</td><td>{unit.members}</td><td>{formatCustomerCount(unit.customers)}</td><td><span className="boundary-cell"><LockKeyhole size={12}/>tenant_id = {unit.id}</span></td><td>{unit.grantCount}</td><td><Badge tone="green">隔离正常</Badge></td></tr>)}</tbody></table></div></section>
    <section className="rbac-section grant-section"><div className="rbac-section-head"><div><h2>跨部门协作授权</h2><p>临时、对象级、能力级授权，不形成永久角色</p></div><Button onClick={openGrant}><Plus size={14}/>申请跨部门授权</Button></div><div className="table-panel"><table className="data-table grant-table"><thead><tr><th>授权编号</th><th>申请方</th><th>目标空间</th><th>对象</th><th>能力</th><th>到期日</th><th>审批人</th><th>状态</th><th>操作</th></tr></thead><tbody>{grants.map((grant)=><tr key={grant.id}><td><code>{grant.id}</code></td><td>{grant.source}</td><td>{grant.target}</td><td>{grant.object}</td><td>{grant.capability}</td><td>{grant.expiry}</td><td>{grant.approver}</td><td><Badge tone={grant.status==="生效中"?"green":grant.status==="待审批"?"amber":"neutral"}>{grant.status}</Badge></td><td><button className="link danger-link" disabled={grant.status==="已撤销"} onClick={()=>{setGrants((items)=>items.map((item)=>item.id===grant.id?{...item,status:"已撤销"}:item));notify(`授权 ${grant.id} 已撤销并写入审计日志`);}}>撤销</button></td></tr>)}</tbody></table></div></section>
  </div>;
}

function FunctionTab({roleName,roleId,permissions,toggle}:{roleName:string;roleId:RoleId;permissions:Record<RoleId,PermissionMap>;toggle:(module:string,action:string)=>void}) {
  const locked=roleId==="platform";
  return <div className="rbac-tab-body"><div className="tab-intro"><div><h2>{roleName} · 功能权限矩阵</h2><p>覆盖全部业务模块与敏感操作，发布后立即生效。</p></div><Badge tone={locked?"blue":"amber"}>{locked?"系统锁定角色":"可编辑策略"}</Badge></div><div className="table-panel permission-matrix-wrap" role="region" tabIndex={0} aria-label={`${roleName}功能权限矩阵，可横向滚动`}><table className="data-table permission-matrix"><thead><tr><th>业务模块</th>{actions.map((action)=><th key={action}>{action}</th>)}</tr></thead><tbody>{modules.map((module)=><tr key={module}><td><span className="module-name"><span><LayoutDashboard size={14}/></span><strong>{module}</strong></span></td>{actions.map((action)=>{const checked=permissions[roleId][module][action];return <td key={action}><label className={`permission-check ${locked?"locked":""}`}><input type="checkbox" aria-label={`${roleName} - ${module} - ${action}`} checked={checked} disabled={locked} onChange={()=>toggle(module,action)}/><span>{checked?<Check size={12}/>:<X size={11}/>}</span></label></td>;})}</tr>)}</tbody></table></div><div className="permission-note"><LockKeyhole size={14}/>删除、导出、审批均为敏感动作；平台超级管理员角色不可编辑。</div></div>;
}

function DataTab({roleId,currentCode,scopes,setScopes,markDirty}:{roleId:RoleId;currentCode:string;scopes:Record<RoleId,string>;setScopes:React.Dispatch<React.SetStateAction<Record<RoleId,string>>>;markDirty:()=>void}) {
  return <div className="rbac-tab-body data-permission-layout">
    <section className="rbac-section"><div className="rbac-section-head"><div><h2>默认数据范围</h2><p>在业务空间硬边界内继续收敛记录范围</p></div><Badge tone="blue">{scopes[roleId]}</Badge></div><div className="scope-options">{dataScopes.map((scope)=>{const disabled=roleId==="platform"?scope!=="集团全部数据":scope==="集团全部数据";return <label className={`${scopes[roleId]===scope?"active":""} ${disabled?"disabled":""}`} key={scope}><input type="radio" name="scope" disabled={disabled} checked={scopes[roleId]===scope} onChange={()=>{setScopes((current)=>({...current,[roleId]:scope}));markDirty();}}/><span><strong>{scope}</strong><small>{scope==="已授权业务空间"?"仅访问审批通过且未到期的对象":scope==="集团全部数据"?"仅平台超级管理员可选":"组织变更后自动重新计算"}</small></span></label>;})}</div></section>
    <section className="rbac-section rule-builder"><div className="rbac-section-head"><div><h2>规则构建器</h2><p>系统按 AND 顺序计算所有条件</p></div><Badge tone="green">默认拒绝</Badge></div>{roleId!=="platform"&&<div className="immutable-rule"><LockKeyhole size={15}/><span><small>不可变首要条件</small><code>tenant_id = "{currentCode}"</code></span><Badge tone="blue">强制</Badge></div>}<div className="rule-row"><span>2</span><code>department_id IN current_department_tree</code><Badge tone="green">组织条件</Badge></div><div className="rule-row"><span>3</span><code>{roleId==="specialist"?"owner_id = current_user.id":"owner_id IN current_user_and_reports"}</code><Badge tone="amber">记录条件</Badge></div>{scopes[roleId]==="已授权业务空间"&&<div className="rule-row"><span>4</span><code>grant.status = active AND grant.expiry &gt; now()</code><Badge tone="amber">临时授权</Badge></div>}<div className="scope-result"><ShieldCheck size={17}/><div><strong>规则可编译，未发现越权路径</strong><small>tenant_id 条件不会被筛选器、导出或 API 参数覆盖</small></div></div></section>
  </div>;
}

function FieldTab({roleId,roleName,fields,setFields,markDirty}:{roleId:RoleId;roleName:string;fields:Record<RoleId,Record<string,FieldMode>>;setFields:React.Dispatch<React.SetStateAction<Record<RoleId,Record<string,FieldMode>>>>;markDirty:()=>void}) {
  return <div className="rbac-tab-body"><div className="tab-intro"><div><h2>{roleName} · 敏感字段策略</h2><p>策略统一应用于列表、详情、导出与 API 响应。</p></div><Badge tone="red">5 个敏感字段</Badge></div><div className="table-panel"><table className="data-table field-table"><thead><tr><th>对象 / 字段</th><th>敏感级别</th><th>可见性</th><th>脱敏示例</th><th>应用范围</th></tr></thead><tbody>{Object.entries(fields[roleId]).map(([field,mode],index)=>{const labelId=`field-policy-${roleId}-${index}`;return <tr key={field}><td><span className="field-name"><span>{field==="API Key"?<KeyRound size={14}/>:<FileKey2 size={14}/>}</span><strong id={labelId}>{field}</strong></span></td><td><Badge tone={["身份证号","API Key","回款账户"].includes(field)?"red":"amber"}>{["身份证号","API Key","回款账户"].includes(field)?"高敏":"敏感"}</Badge></td><td><select className="select compact-select" aria-labelledby={labelId} disabled={roleId==="platform"} value={mode} onChange={(event)=>{setFields((current)=>({...current,[roleId]:{...current[roleId],[field]:event.target.value as FieldMode}}));markDirty();}}><option>可见</option><option>脱敏</option><option>不可见</option></select></td><td>{mode==="可见"?"原值":mode==="脱敏"?(field==="身份证号"?"310***********42":"138****4096"):"字段不返回"}</td><td><span className="policy-surfaces">列表 · 详情 · 导出 · API</span></td></tr>;})}</tbody></table></div></div>;
}

function MembersTab({unitName,total,departments,members,setMembers,department,setDepartment,openMember,markDirty}:{unitName:string;total:number;departments:string[];members:PreviewMember[];setMembers:Dispatch<SetStateAction<PreviewMember[]>>;department:string;setDepartment:(value:string)=>void;openMember:()=>void;markDirty:()=>void}) {
  return <div className="rbac-tab-body"><div className="member-toolbar"><label><Search size={14}/><input className="input" aria-label="搜索成员姓名" placeholder="搜索成员姓名"/></label><select className="select" aria-label="按部门筛选成员" value={department} onChange={(event)=>setDepartment(event.target.value)}><option>全部部门</option>{departments.map((item)=><option key={item}>{item}</option>)}</select><span className="spacer"/><span className="subtle">{unitName} · {total} 位成员</span><Button onClick={openMember}><Plus size={14}/>添加成员</Button></div><div className="table-panel" role="region" tabIndex={0} aria-label="租户成员与角色表格，可横向滚动"><table className="data-table member-table enterprise-member-table"><thead><tr><th>成员</th><th>所属部门</th><th>角色</th><th>空间访问</th><th>临时授权</th><th>状态</th></tr></thead><tbody>{members.filter((member)=>department==="全部部门"||member.department===department).map((member)=><tr key={member.name}><td><span className="member-cell"><Avatar name={member.name}/><strong>{member.name}</strong><small>{member.name.toLowerCase()}@gaodun.com</small></span></td><td>{member.department}</td><td><select className="select compact-select" aria-label={`${member.name}的空间角色`} value={member.role} onChange={(event)=>{setMembers((current)=>current.map((item)=>item.name===member.name?{...item,role:event.target.value}:item));markDirty();}}><option>租户管理员</option><option>租户部门主管</option><option>租户普通员工</option></select></td><td><Badge tone="blue">当前空间</Badge></td><td><Badge tone={member.grant==="无临时授权"?"neutral":"amber"}>{member.grant}</Badge></td><td><Badge tone="green">正常</Badge></td></tr>)}</tbody></table></div><div className="collaboration-note"><AlertTriangle size={15}/><div><strong>跨部门协作授权不是角色</strong><p>必须指定目标空间、对象、能力、到期日、审批人与原因，到期自动失效。</p></div></div></div>;
}
