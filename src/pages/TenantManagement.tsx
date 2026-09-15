import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  AlertTriangle, ArrowRight, Building2, CheckCircle2, ClipboardCheck, Database,
  Download, Gauge, HardDrive, KeyRound, LockKeyhole, Plus, Search, Settings2,
  ShieldCheck, UserRoundCheck, UsersRound, Workflow,
} from "lucide-react";
import type { OutletContext } from "../components/AppShell";
import { Avatar, Badge, Button, Card, Drawer, Modal, PageHeader, Tabs } from "../components/ui";
import {
  businessUnits, formatCustomerCount, GROUP_EMPLOYEE_COUNT, GROUP_SALES_COUNT,
  type BusinessUnitId,
} from "../data/organization";

type TenantStatus = "正常" | "已停用" | "初始化中";
type RequestStatus = "待审批" | "初始化中" | "已完成" | "已驳回";
type TenantRecord = {
  id: string;
  sourceId?: BusinessUnitId;
  name: string;
  code: string;
  projects: string[];
  administrator: string;
  members: number;
  salesMembers: number;
  customers: number;
  isolation: "独立数据域" | "共享数据域";
  quota: number;
  status: TenantStatus;
  changedAt: string;
  createdAt: string;
  region: string;
};
type OnboardingRequest = {
  id: string;
  name: string;
  code: string;
  requester: string;
  submittedAt: string;
  modules: string[];
  region: string;
  review: string;
  progress: number;
  status: RequestStatus;
};

const tabs = ["租户列表", "开通申请", "配额与策略", "生命周期"];
const provisioningSteps = ["基础信息", "数据域创建", "管理员绑定", "权限模板", "开通完成"];
const seededTenants: TenantRecord[] = businessUnits.map((unit, index) => ({
  id: unit.id,
  sourceId: unit.id,
  name: unit.name,
  code: unit.code,
  projects: unit.projects,
  administrator: unit.administrator,
  members: unit.members,
  salesMembers: unit.salesMembers,
  customers: unit.customers,
  isolation: unit.isolationState,
  quota: 42 + (index * 7) % 49,
  status: "正常",
  changedAt: `2026-09-${String(14 - (index % 6)).padStart(2, "0")} ${String(9 + (index % 7)).padStart(2, "0")}:20`,
  createdAt: `2024-${String((index % 9) + 1).padStart(2, "0")}-15`,
  region: ["华东", "华北", "华南"][index % 3],
}));
const initialRequests: OnboardingRequest[] = [
  { id: "TR-202609-021", name: "企业服务创新中心", code: "B2B-INNO", requester: "王珂", submittedAt: "2026-09-14 09:18", modules: ["客户", "商机", "合同"], region: "华东", review: "待安全审核", progress: 1, status: "待审批" },
  { id: "TR-202609-020", name: "数字产品孵化中心", code: "DIGITAL-LAB", requester: "许晴", submittedAt: "2026-09-13 16:42", modules: ["线索", "客户", "AI"], region: "华北", review: "已通过", progress: 3, status: "初始化中" },
];
const lifecycleEvents = [
  ["留学语培事业部", "更新敏感字段脱敏模板", "叶琳", "2026-09-14 10:42", "成功"],
  ["财经国际证书事业部", "扩容 API 月调用配额", "顾宁", "2026-09-14 09:16", "成功"],
  ["数字产品孵化中心", "绑定初始租户管理员", "平台自动化", "2026-09-13 17:08", "成功"],
  ["企业服务创新中心", "提交租户开通申请", "王珂", "2026-09-14 09:18", "待审核"],
];

const statusTone = (status: TenantStatus | RequestStatus) =>
  status === "正常" || status === "已完成" ? "green" : status === "已停用" || status === "已驳回" ? "red" : "amber";

export default function TenantManagement() {
  const { notify, currentBusinessUnit, switchBusinessUnit } = useOutletContext<OutletContext>();
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [tenants, setTenants] = useState(seededTenants);
  const [requests, setRequests] = useState(initialRequests);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("全部");
  const [isolation, setIsolation] = useState("全部");
  const [createOpen, setCreateOpen] = useState(false);
  const [detail, setDetail] = useState<TenantRecord | null>(null);
  const [stopTarget, setStopTarget] = useState<TenantRecord | null>(null);
  const [checklist, setChecklist] = useState<OnboardingRequest | null>(null);
  const [policyDirty, setPolicyDirty] = useState(false);
  const [policy, setPolicy] = useState({
    members: 500, storage: 200, api: 100, automation: 5000, retention: 365,
    hardBoundary: true, crossTenantDeny: true, watermark: true, masking: true,
  });

  const visibleTenants = useMemo(() => tenants.filter((tenant) => {
    const matchQuery = `${tenant.name}${tenant.code}${tenant.projects.join("")}`.toLowerCase().includes(query.trim().toLowerCase());
    return matchQuery && (status === "全部" || tenant.status === status) && (isolation === "全部" || tenant.isolation === isolation);
  }), [tenants, query, status, isolation]);

  const updateTenantStatus = (target: TenantRecord) => {
    const nextStatus: TenantStatus = target.status === "已停用" ? "正常" : "已停用";
    setTenants((items) => items.map((item) => item.id === target.id ? { ...item, status: nextStatus, changedAt: "2026-09-14 11:26" } : item));
    setDetail((current) => current?.id === target.id ? { ...current, status: nextStatus, changedAt: "2026-09-14 11:26" } : current);
    setStopTarget(null);
    notify(`${target.name}已${nextStatus === "正常" ? "启用" : "停用"}，操作已写入审计日志`);
  };

  const setPolicyValue = <K extends keyof typeof policy>(key: K, value: (typeof policy)[K]) => {
    setPolicy((current) => ({ ...current, [key]: value }));
    setPolicyDirty(true);
  };

  return (
    <div className="tenant-page">
      <div className="tenant-breadcrumb"><Building2 size={12}/>系统管理<ArrowRight size={11}/>租户管理</div>
      <PageHeader title="租户管理" description="统一管理业务租户的开通、隔离、配额、管理员与生命周期" actions={
        <span className="security-access-badge"><ShieldCheck size={14}/>仅平台超级管理员</span>
      }/>
      <div className="tenant-metrics">
        <Card><span className="metric-symbol tone-blue"><UsersRound size={17}/></span><div><small>集团员工</small><strong>{GROUP_EMPLOYEE_COUNT.toLocaleString("zh-CN")}</strong><span>13 个业务租户</span></div></Card>
        <Card><span className="metric-symbol tone-green"><UserRoundCheck size={17}/></span><div><small>销售人员</small><strong>{GROUP_SALES_COUNT.toLocaleString("zh-CN")}</strong><span>占集团员工 66.7%</span></div></Card>
        <Card><span className="metric-symbol tone-amber"><Building2 size={17}/></span><div><small>业务租户</small><strong>{tenants.length}</strong><span>{tenants.filter((item)=>item.status === "正常").length} 个正常运行</span></div></Card>
        <Card><span className="metric-symbol tone-green"><ShieldCheck size={17}/></span><div><small>隔离异常</small><strong>0</strong><span>近 30 天</span></div></Card>
      </div>
      <Card className="tenant-workspace">
        <Tabs items={tabs} active={activeTab} onChange={setActiveTab}/>
        {activeTab === "租户列表" && <div className="tenant-tab-body">
          <div className="tenant-toolbar">
            <label className="tenant-search"><Search size={14}/><input className="input" aria-label="搜索租户" placeholder="搜索租户、编码或项目" value={query} onChange={(event)=>setQuery(event.target.value)}/></label>
            <select className="select" aria-label="按租户状态筛选" value={status} onChange={(event)=>setStatus(event.target.value)}><option>全部</option><option>正常</option><option>已停用</option><option>初始化中</option></select>
            <select className="select" aria-label="按数据隔离类型筛选" value={isolation} onChange={(event)=>setIsolation(event.target.value)}><option>全部</option><option>独立数据域</option><option>共享数据域</option></select>
            <span className="spacer"/>
            <Button variant="secondary" onClick={()=>notify(`已导出 ${visibleTenants.length} 个租户的清单`)}><Download size={14}/>导出租户清单</Button>
            <Button onClick={()=>setCreateOpen(true)}><Plus size={14}/>新建租户</Button>
          </div>
          <div className="table-scroll-shell">
            <div className="table-panel tenant-table-wrap sticky-edge-table" role="region" tabIndex={0} aria-label="租户列表，可横向滚动，租户与操作列保持可见">
              <table className="data-table tenant-table"><thead><tr><th>租户 / 业务单元</th><th>租户编码</th><th>业务项目</th><th>租户管理员</th><th>成员</th><th>销售</th><th>客户量</th><th>数据隔离</th><th>配额使用率</th><th>状态</th><th>最近变更</th><th>操作</th></tr></thead>
                <tbody>{visibleTenants.map((tenant)=><tr className={tenant.sourceId === currentBusinessUnit.id ? "current-tenant-row" : ""} key={tenant.id}>
                  <td><button className="tenant-name" onClick={()=>setDetail(tenant)}>{tenant.name}</button>{tenant.sourceId === currentBusinessUnit.id && <Badge tone="blue">当前</Badge>}</td>
                  <td><code>{tenant.code}</code></td><td><span className="project-summary">{tenant.projects.slice(0,2).join("、")}<small>{tenant.projects.length > 2 ? ` 等 ${tenant.projects.length} 项` : `${tenant.projects.length} 项`}</small></span></td>
                  <td><span className="tenant-admin"><Avatar name={tenant.administrator}/>{tenant.administrator}</span></td><td>{tenant.members}</td><td>{tenant.salesMembers}</td><td>{formatCustomerCount(tenant.customers)}</td>
                  <td><span className="boundary-cell"><LockKeyhole size={12}/>{tenant.isolation}</span></td><td><span className="quota-cell"><span><i style={{width:`${tenant.quota}%`}}/></span><b>{tenant.quota}%</b></span></td>
                  <td><Badge tone={statusTone(tenant.status)}>{tenant.status}</Badge></td><td>{tenant.changedAt}</td>
                  <td><span className="row-actions"><button onClick={()=>setDetail(tenant)}>查看</button>{tenant.status !== "初始化中" && <button className={tenant.status === "正常" ? "danger" : ""} onClick={()=>tenant.status === "正常" ? setStopTarget(tenant) : updateTenantStatus(tenant)}>{tenant.status === "正常" ? "停用" : "启用"}</button>}</span></td>
                </tr>)}</tbody>
              </table>
              {!visibleTenants.length && <div className="empty-state"><strong>未找到租户</strong><p>调整搜索词或筛选条件后重试。</p></div>}
            </div>
            <span className="table-scroll-cue" aria-hidden="true">横向滑动查看详情 <ArrowRight size={12}/></span>
          </div>
          <div className="tenant-table-foot">显示 {visibleTenants.length} / {tenants.length} 个租户 · 所有查询均受平台审计</div>
        </div>}
        {activeTab === "开通申请" && <OnboardingTab requests={requests} setRequests={setRequests} notify={notify} openChecklist={setChecklist}/>}
        {activeTab === "配额与策略" && <PolicyTab policy={policy} setPolicyValue={setPolicyValue} dirty={policyDirty} save={()=>{setPolicyDirty(false);notify("租户默认配额与隔离策略已发布");}}/>}
        {activeTab === "生命周期" && <LifecycleTab tenants={tenants}/>}
      </Card>

      <Modal open={createOpen} onClose={()=>setCreateOpen(false)} title="新建租户">
        <form className="drawer-form" onSubmit={(event)=>{
          event.preventDefault();
          const form = new FormData(event.currentTarget);
          const code = String(form.get("code")).trim().toUpperCase();
          const name = String(form.get("name")).trim();
          const administrator = String(form.get("administrator")).trim();
          const region = String(form.get("region"));
          const members = Number(form.get("members"));
          const salesMembers = Number(form.get("salesMembers"));
          if (tenants.some((item)=>item.code === code)) return notify(`租户编码 ${code} 已存在`);
          if (salesMembers > members) return notify("预计销售人数不能超过预计成员数");
          const id = `pending-${code}`;
          const nextTenant: TenantRecord = { id, name, code, administrator, region, projects:[String(form.get("category"))], members, salesMembers, customers:0, isolation:String(form.get("isolation")) as TenantRecord["isolation"], quota:0, status:"初始化中", changedAt:"2026-09-15 11:26", createdAt:"2026-09-15" };
          const request: OnboardingRequest = { id:`TR-202609-${String(21 + requests.length).padStart(3,"0")}`, name, code, requester:administrator, submittedAt:"2026-09-14 11:26", modules:["客户","商机","权限"], region, review:"待安全审核", progress:1, status:"初始化中" };
          setTenants((items)=>[nextTenant,...items]); setRequests((items)=>[request,...items]); setCreateOpen(false);
          notify(`${name}已提交初始化，完成开通后可切换`);
        }}>
          <p className="modal-intro">提交后系统将创建独立数据域并绑定管理员。初始化完成前不会加入全局租户切换目录。</p>
          <div className="form-grid">
            <div className="field"><label htmlFor="tenant-name-input">租户名称</label><input id="tenant-name-input" className="input" name="name" required placeholder="例如：企业服务事业部"/></div>
            <div className="field"><label htmlFor="tenant-code-input">租户编码</label><input id="tenant-code-input" className="input" name="code" required pattern="[A-Za-z0-9-]{3,20}" placeholder="例如：B2B-SERVICE"/></div>
            <div className="field"><label htmlFor="tenant-category">所属业务线 / category</label><select id="tenant-category" className="select" name="category"><option>财经教育</option><option>职业教育</option><option>升学教育</option><option>企业服务</option></select></div>
            <div className="field"><label htmlFor="tenant-admin-input">初始租户管理员</label><input id="tenant-admin-input" className="input" name="administrator" required placeholder="姓名"/></div>
            <div className="field"><label htmlFor="tenant-members-input">预计成员数</label><input id="tenant-members-input" className="input" name="members" type="number" min="1" max="5000" defaultValue="100" required/></div>
            <div className="field"><label htmlFor="tenant-sales-input">预计销售人数</label><input id="tenant-sales-input" className="input" name="salesMembers" type="number" min="0" max="5000" defaultValue="60" required/></div>
            <div className="field"><label htmlFor="tenant-isolation-input">数据域类型</label><select id="tenant-isolation-input" className="select" name="isolation" defaultValue="独立数据域"><option>独立数据域</option><option>共享数据域</option></select></div>
            <div className="field"><label htmlFor="tenant-region-input">数据存储区域</label><select id="tenant-region-input" className="select" name="region"><option>华东</option><option>华北</option><option>华南</option></select></div>
            <div className="field form-span-2"><label htmlFor="tenant-notes-input">备注</label><textarea id="tenant-notes-input" name="notes" placeholder="补充业务用途、数据合规或开通时限"/></div>
          </div>
          <div className="form-actions"><Button type="button" variant="secondary" onClick={()=>setCreateOpen(false)}>取消</Button><Button type="submit">提交并初始化</Button></div>
        </form>
      </Modal>

      <Modal open={Boolean(stopTarget)} onClose={()=>setStopTarget(null)} title="确认停用租户">
        {stopTarget && <div><div className="stop-warning"><AlertTriangle size={20}/><div><strong>停用 {stopTarget.name}？</strong><p>停用后成员无法进入该租户，写入与导出立即关闭；数据继续保留，所有操作写入审计日志。</p></div></div><div className="form-actions"><Button variant="secondary" onClick={()=>setStopTarget(null)}>取消</Button><Button variant="danger" onClick={()=>updateTenantStatus(stopTarget)}>确认停用</Button></div></div>}
      </Modal>

      <Drawer open={Boolean(detail)} onClose={()=>setDetail(null)} title={detail?.name ?? "租户详情"} wide>
        {detail && <TenantDetail tenant={detail} canSwitch={detail.status === "正常" && Boolean(detail.sourceId)} switchTenant={()=>{if(detail.sourceId){switchBusinessUnit(detail.sourceId);setDetail(null);}}} manageAdmins={()=>notify(`已打开 ${detail.name} 的管理员配置`)} adjustQuota={()=>{setDetail(null);setActiveTab("配额与策略");notify(`已定位 ${detail.name} 的配额配置`);}}/>}
      </Drawer>
      <Drawer open={Boolean(checklist)} onClose={()=>setChecklist(null)} title="租户开通检查清单">
        {checklist && <ProvisioningChecklist request={checklist}/>}
      </Drawer>
    </div>
  );
}

function OnboardingTab({requests,setRequests,notify,openChecklist}:{requests:OnboardingRequest[];setRequests:React.Dispatch<React.SetStateAction<OnboardingRequest[]>>;notify:(message:string)=>void;openChecklist:(request:OnboardingRequest)=>void}) {
  const update = (request: OnboardingRequest) => {
    if (request.status === "待审批") {
      setRequests((items)=>items.map((item)=>item.id===request.id?{...item,status:"初始化中",review:"已通过",progress:2}:item));
      notify(`${request.id} 已批准，开始创建独立数据域`);
      return;
    }
    const progress = Math.min(5, request.progress + 1);
    setRequests((items)=>items.map((item)=>item.id===request.id?{...item,progress,status:progress===5?"已完成":"初始化中"}:item));
    notify(progress === 5 ? `${request.name} 已完成开通` : `${request.name} 已推进至「${provisioningSteps[progress-1]}」`);
  };
  return <div className="tenant-tab-body"><div className="tenant-section-head"><div><h2>租户开通申请</h2><p>安全审核通过后按标准流水线创建数据域、角色与管理员。</p></div><Badge tone="amber">{requests.filter((item)=>item.status !== "已完成").length} 项处理中</Badge></div>
    <div className="provisioning-flow" role="region" tabIndex={0} aria-label="租户开通流程">{provisioningSteps.map((step,index)=><span key={step}><i>{index+1}</i><strong>{step}</strong>{index<provisioningSteps.length-1&&<ArrowRight size={14}/>}</span>)}</div>
    <div className="table-scroll-shell">
      <div className="table-panel tenant-request-wrap sticky-edge-table" role="region" tabIndex={0} aria-label="租户开通申请表格，可横向滚动，租户与操作列保持可见"><table className="data-table tenant-request-table"><thead><tr><th>申请编号</th><th>租户</th><th>申请人</th><th>提交时间</th><th>所需模块</th><th>数据区域</th><th>安全审核</th><th>开通进度</th><th>状态</th><th>操作</th></tr></thead><tbody>{requests.map((request)=><tr key={request.id}><td><code>{request.id}</code></td><td><strong>{request.name}</strong><small className="table-subline">{request.code}<span className="request-id-mobile"> · {request.id}</span></small></td><td>{request.requester}</td><td>{request.submittedAt}</td><td>{request.modules.join("、")}</td><td>{request.region}</td><td><Badge tone={request.review==="已通过"?"green":"amber"}>{request.review}</Badge></td><td><span className="request-progress"><span><i style={{width:`${request.progress*20}%`}}/></span><b>{request.progress}/5</b></span></td><td><Badge tone={statusTone(request.status)}>{request.status}</Badge></td><td><span className="row-actions"><button onClick={()=>openChecklist(request)}>检查清单</button>{request.status==="待审批"&&<button onClick={()=>update(request)}>批准</button>}{request.status==="初始化中"&&<button onClick={()=>update(request)}>推进</button>}</span></td></tr>)}</tbody></table></div>
      <span className="table-scroll-cue" aria-hidden="true">横向滑动查看详情 <ArrowRight size={12}/></span>
    </div>
  </div>;
}

function PolicyTab({policy,setPolicyValue,dirty,save}:{policy:{members:number;storage:number;api:number;automation:number;retention:number;hardBoundary:boolean;crossTenantDeny:boolean;watermark:boolean;masking:boolean};setPolicyValue:<K extends keyof typeof policy>(key:K,value:(typeof policy)[K])=>void;dirty:boolean;save:()=>void}) {
  const numericFields = [
    ["members","最大成员数","人"],["storage","存储空间","GB"],["api","API 调用 / 月","万次"],["automation","自动化运行 / 日","次"],["retention","审计保留","天"],
  ] as const;
  const switches = [
    ["hardBoundary","tenant_id 硬边界","任何查询均不可绕过租户条件"],
    ["crossTenantDeny","跨租户默认拒绝","仅显式审批授权可临时访问"],
    ["watermark","导出水印","导出文件包含租户与操作者标识"],
    ["masking","敏感字段脱敏","默认应用平台敏感字段模板"],
  ] as const;
  return <div className="tenant-tab-body policy-layout">
    <section className="tenant-section"><div className="tenant-section-head"><div><h2>集团级默认配额</h2><p>新租户初始化时继承，租户级覆盖不会反向修改默认值。</p></div>{dirty&&<span className="unsaved-dot"><span/>有未发布变更</span>}</div><div className="quota-form">{numericFields.map(([key,label,unit])=><label key={key}><span>{label}</span><span><input className="input" aria-label={label} type="number" min="1" value={policy[key]} onChange={(event)=>setPolicyValue(key,Number(event.target.value))}/><b>{unit}</b></span></label>)}</div><div className="policy-save"><Button disabled={!dirty} onClick={save}>保存默认策略</Button></div></section>
    <section className="tenant-section"><div className="tenant-section-head"><div><h2>默认隔离策略</h2><p>关键安全边界建议始终保持启用。</p></div><Badge tone="green">基线合规</Badge></div><div className="isolation-switches">{switches.map(([key,label,detail])=><label key={key}><span><ShieldCheck size={15}/><span><strong>{label}</strong><small>{detail}</small></span></span><span className="switch"><input type="checkbox" aria-label={label} checked={policy[key]} onChange={(event)=>setPolicyValue(key,event.target.checked)}/><span/></span></label>)}</div></section>
    <section className="tenant-section policy-overrides"><div className="tenant-section-head"><div><h2>租户级配额覆盖</h2><p>仅列出偏离集团默认值的租户。</p></div><Badge tone="blue">3 项覆盖</Badge></div><div className="table-panel" role="region" tabIndex={0} aria-label="租户配额覆盖表格，可横向滚动"><table className="data-table"><thead><tr><th>租户</th><th>成员上限</th><th>存储</th><th>API / 月</th><th>自动化 / 日</th><th>最近调整</th></tr></thead><tbody>{businessUnits.slice(0,3).map((unit,index)=><tr key={unit.id}><td><strong>{unit.name}</strong></td><td>{600+index*200}</td><td>{300+index*100} GB</td><td>{150+index*50} 万次</td><td>{7000+index*1000} 次</td><td>2026-09-{12-index}</td></tr>)}</tbody></table></div></section>
  </div>;
}

function LifecycleTab({tenants}:{tenants:TenantRecord[]}) {
  const stages = ["申请", "安全审核", "创建数据域", "初始化角色", "绑定管理员", "运行", "冻结 / 归档"];
  return <div className="tenant-tab-body lifecycle-layout">
    <div className="lifecycle-counts"><span><small>运行中</small><strong>{tenants.filter((item)=>item.status==="正常").length}</strong></span><span><small>初始化中</small><strong>{tenants.filter((item)=>item.status==="初始化中").length}</strong></span><span><small>已冻结</small><strong>{tenants.filter((item)=>item.status==="已停用").length}</strong></span><span><small>待归档</small><strong>0</strong></span></div>
    <section className="tenant-section lifecycle-workflow"><div className="tenant-section-head"><div><h2>租户生命周期工作流</h2><p>所有状态迁移均要求明确操作者并写入不可篡改审计。</p></div><Badge tone="blue">标准流程 v2.4</Badge></div><div className="lifecycle-flow">{stages.map((stage,index)=><span key={stage}><i>{index+1}</i><strong>{stage}</strong>{index<stages.length-1&&<ArrowRight size={14}/>}</span>)}</div></section>
    <div className="guardrail"><LockKeyhole size={18}/><div><strong>冻结与退役保护规则</strong><p>冻结后导出禁用、写入禁用；归档前按审计保留策略保存数据。每次状态变更、数据访问与恢复操作均完整审计。</p></div></div>
    <section className="tenant-section"><div className="tenant-section-head"><div><h2>最近生命周期事件</h2><p>状态、策略和资源变更统一留痕。</p></div></div><div className="table-panel" role="region" tabIndex={0} aria-label="租户生命周期事件表格，可横向滚动"><table className="data-table lifecycle-table"><thead><tr><th>租户</th><th>事件</th><th>操作者</th><th>时间</th><th>结果</th></tr></thead><tbody>{lifecycleEvents.map((row)=><tr key={`${row[0]}-${row[3]}`}>{row.slice(0,4).map((cell)=><td key={cell}>{cell}</td>)}<td><Badge tone={row[4]==="成功"?"green":"amber"}>{row[4]}</Badge></td></tr>)}</tbody></table></div></section>
  </div>;
}

function TenantDetail({tenant,canSwitch,switchTenant,manageAdmins,adjustQuota}:{tenant:TenantRecord;canSwitch:boolean;switchTenant:()=>void;manageAdmins:()=>void;adjustQuota:()=>void}) {
  const resources = [
    ["成员",tenant.members,Math.max(500,Math.ceil(tenant.members/100)*200),"人"],
    ["销售席位",tenant.salesMembers,Math.max(300,Math.ceil(tenant.salesMembers/100)*100),"人"],
    ["存储",48+tenant.quota,200,"GB"],
    ["API 调用",32+tenant.quota,150,"万次"],
    ["自动化运行",1700+tenant.quota*20,5000,"次/日"],
  ] as const;
  return <div className="tenant-detail">
    <div className="tenant-detail-identity"><span className="metric-symbol tone-blue"><Building2 size={18}/></span><div><small>{tenant.code}</small><h3>{tenant.name}</h3><p>{tenant.administrator} · {tenant.region}数据区域 · 创建于 {tenant.createdAt}</p></div><Badge tone={statusTone(tenant.status)}>{tenant.status}</Badge></div>
    <section><h3>业务项目</h3><div className="detail-badges">{tenant.projects.map((project)=><Badge tone="blue" key={project}>{project}</Badge>)}</div></section>
    <section><h3>资源使用</h3><div className="resource-list">{resources.map(([label,used,total,unit])=>{const value=Math.min(100,Math.round(Number(used)/Number(total)*100));return <div key={label}><span><strong>{label}</strong><small>{used} / {total} {unit}</small></span><span className="progress"><span style={{width:`${value}%`}}/></span><b>{value}%</b></div>;})}</div></section>
    <section><h3>隔离策略</h3><div className="detail-policy-grid">{[["tenant_id 硬边界",`tenant_id = ${tenant.code}`],["跨租户默认拒绝","已启用"],["字段脱敏模板","教育业务标准 v3.6"],["审计保留","365 天"]].map(([label,value])=><div key={label}><ShieldCheck size={14}/><span><small>{label}</small><strong>{value}</strong></span></div>)}</div></section>
    <section><h3>租户管理员</h3><div className="tenant-admin-list">{[tenant.administrator,"周睿"].map((name,index)=><span key={name}><Avatar name={name}/><span><strong>{name}</strong><small>{index===0?"主租户管理员":"安全管理员"}</small></span><Badge tone="green">正常</Badge></span>)}</div></section>
    <section><h3>集成连接</h3><div className="integration-list">{[["企业微信",true],["邮件",true],["SSO",tenant.quota>55],["API",true]].map(([name,connected])=><span key={String(name)}><KeyRound size={14}/><strong>{name}</strong><Badge tone={connected?"green":"neutral"}>{connected?"已连接":"未配置"}</Badge></span>)}</div></section>
    <section><h3>最近生命周期</h3><div className="timeline"><div className="timeline-item">更新配额策略<small>{tenant.changedAt} · {tenant.administrator}</small></div><div className="timeline-item">隔离策略巡检通过<small>2026-09-12 02:00 · 平台自动化</small></div><div className="timeline-item">租户进入运行状态<small>{tenant.createdAt} · 平台超级管理员</small></div></div></section>
    <div className="detail-actions">{canSwitch&&<Button onClick={switchTenant}>切换到该租户</Button>}<Button variant="secondary" onClick={manageAdmins}><UsersRound size={14}/>管理管理员</Button><Button variant="secondary" onClick={adjustQuota}><Gauge size={14}/>调整配额</Button></div>
    {!canSwitch&&<p className="switch-hint">该租户尚未完成开通或当前已停用，暂不可切换。</p>}
  </div>;
}

function ProvisioningChecklist({request}:{request:OnboardingRequest}) {
  return <div className="provisioning-checklist"><div className="checklist-summary"><Workflow size={18}/><div><strong>{request.name}</strong><small>{request.id} · {request.region} · {request.status}</small></div></div>{provisioningSteps.map((step,index)=>{const done=index<request.progress;const current=index===request.progress&&request.progress<5;return <article className={done?"done":current?"current":""} key={step}><span>{done?<CheckCircle2 size={15}/>:index+1}</span><div><strong>{step}</strong><small>{done?"检查完成":current?"等待平台自动化执行":"等待前置步骤"}</small></div><Badge tone={done?"green":current?"amber":"neutral"}>{done?"完成":current?"进行中":"未开始"}</Badge></article>})}<div className="checklist-security"><Database size={16}/><span><strong>安全基线</strong><small>独立数据域、默认拒绝、管理员 MFA 与 365 天审计保留将在开通前强制校验。</small></span></div></div>;
}
