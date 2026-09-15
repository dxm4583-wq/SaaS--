import { useMemo, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  AlertTriangle, ArrowDown, ArrowUp, BellRing, CheckCircle2, ChevronLeft,
  ChevronRight, CircleGauge, Clock3, Download, Inbox, ListChecks, Plus, RefreshCw,
  RotateCcw, Save, Scale, Search, SlidersHorizontal, Sparkles, Trash2, UserCheck,
  UsersRound, Workflow, Zap,
} from "lucide-react";
import type { OutletContext } from "../components/AppShell";
import { Avatar, Badge, Button, Card, Drawer, EmptyState, Metric, Modal, PageHeader, Tabs } from "../components/ui";

type Intent = "高" | "中" | "低";
type Lead = {
  id: string; name: string; phone: string; source: string; course: string; intent: Intent;
  region: string; createTime: string; waitHours: number; selected: boolean;
};
type PublicLead = {
  id: string; name: string; phone: string; course: string; reason: string; fromSales: string;
  recycleTime: string; inPublicHours: number; selected: boolean;
};
type RecordItem = {
  id: string; leadName: string; phone: string; type: "手动分配" | "自动分配" | "回收" | "重新分配";
  toSales: string; fromSales: string; operator: string; time: string; remark: string;
};
type Sales = {
  id: number; name: string; dept: string; role: string; pending: number; following: number;
  converted: number; conversionRate: number; todayAssigned: number; status: "在岗" | "休假";
  weight: number; capacity: number;
};
type DistributionRule = { id: number; name: string; desc: string; enabled: boolean };
type AssignmentMode = "single" | "round" | "load";
type AssignmentContext = "pool" | "public" | null;
type Tone = "neutral" | "blue" | "green" | "amber" | "red" | "violet";

const views = ["待分配线索池", "分配记录", "公海池", "自动分配规则", "回收规则配置", "销售负载看板"];
const sources = ["门户网站", "图书课程", "公众号", "线下活动"];
const courses = ["CPA会计", "中级会计", "初级会计", "税务师"];

const poolSeed: Lead[] = [
  ["P0001","王芳","138****2041","门户网站","CPA会计","高","北京","09-14 08:12",28],
  ["P0002","李敏","138****5873","公众号","中级会计","中","上海","09-14 09:06",19],
  ["P0003","张磊","139****1168","图书课程","初级会计","低","杭州","09-13 17:42",41],
  ["P0004","陈静","136****9352","线下活动","税务师","高","广州","09-14 10:18",8],
  ["P0005","刘涛","137****4609","门户网站","中级会计","高","深圳","09-13 14:33",52],
  ["P0006","赵丽","158****2274","公众号","CPA会计","中","成都","09-14 11:02",5],
  ["P0007","周明","159****6821","图书课程","税务师","低","武汉","09-13 22:16",32],
  ["P0008","吴娜","135****7405","线下活动","初级会计","中","西安","09-14 07:38",25],
  ["P0009","徐杰","188****3916","门户网站","CPA会计","高","南京","09-14 12:07",4],
  ["P0010","孙霞","186****8530","公众号","中级会计","低","苏州","09-14 06:26",29],
  ["P0011","马超","133****6094","图书课程","初级会计","中","重庆","09-14 10:47",9],
  ["P0012","朱平","189****1457","门户网站","税务师","高","天津","09-12 16:20",68],
  ["P0013","胡军","181****7742","线下活动","CPA会计","中","青岛","09-14 08:54",22],
  ["P0014","郭艳","177****3208","公众号","中级会计","高","长沙","09-13 11:39",55],
  ["P0015","何伟","132****9185","图书课程","税务师","低","郑州","09-14 11:31",7],
  ["P0016","高娟","166****4053","门户网站","初级会计","中","合肥","09-13 19:03",37],
  ["P0017","林勇","134****5629","线下活动","CPA会计","高","厦门","09-14 09:45",14],
  ["P0018","罗秀英","187****8316","公众号","税务师","中","济南","09-13 08:11",61],
].map(([id,name,phone,source,course,intent,region,createTime,waitHours]) => ({
  id: String(id), name: String(name), phone: String(phone), source: String(source), course: String(course),
  intent: intent as Intent, region: String(region), createTime: String(createTime), waitHours: Number(waitHours), selected: false,
}));

const publicSeed: PublicLead[] = [
  ["G0001","蒋欣","138****7701","CPA会计","超时未跟进","李销售","09-10 12:20",98],
  ["G0002","沈浩","139****4826","中级会计","多次未联系","王销售","09-08 09:14",148],
  ["G0003","韩梅","136****1935","初级会计","销售主动释放","刘销售","09-13 16:05",44],
  ["G0004","唐宇","158****6241","税务师","离职交接","顾宁","09-04 11:22",242],
  ["G0005","冯璐","137****3098","CPA会计","超时未跟进","黄销售","09-12 08:45",76],
  ["G0006","彭凯","188****5180","税务师","多次未联系","陈销售","09-11 14:08",91],
  ["G0007","董倩","135****8064","初级会计","销售主动释放","张销售","09-14 07:52",27],
  ["G0008","萧然","186****2457","中级会计","超时未跟进","赵销售","09-06 18:30",184],
  ["G0009","程峰","133****9710","CPA会计","多次未联系","李销售","09-09 10:17",123],
  ["G0010","曹雪","189****3502","税务师","离职交接","杨销售","09-03 15:46",264],
  ["G0011","袁博","181****4429","初级会计","超时未跟进","王销售","09-13 08:08",52],
  ["G0012","邓琳","177****6143","中级会计","销售主动释放","刘销售","09-12 19:21",66],
].map(([id,name,phone,course,reason,fromSales,recycleTime,inPublicHours]) => ({
  id: String(id), name: String(name), phone: String(phone), course: String(course), reason: String(reason),
  fromSales: String(fromSales), recycleTime: String(recycleTime), inPublicHours: Number(inPublicHours), selected: false,
}));

const salesSeed: Sales[] = [
  { id:1,name:"李销售",dept:"销售一组",role:"高级销售",pending:45,following:32,converted:18,conversionRate:22.5,todayAssigned:8,status:"在岗",weight:30,capacity:80 },
  { id:2,name:"王销售",dept:"销售一组",role:"资深销售",pending:62,following:28,converted:25,conversionRate:28.3,todayAssigned:12,status:"在岗",weight:20,capacity:80 },
  { id:3,name:"张销售",dept:"销售二组",role:"销售",pending:18,following:15,converted:8,conversionRate:15.2,todayAssigned:3,status:"在岗",weight:35,capacity:80 },
  { id:4,name:"刘销售",dept:"销售二组",role:"高级销售",pending:35,following:22,converted:15,conversionRate:20.8,todayAssigned:6,status:"在岗",weight:30,capacity:80 },
  { id:5,name:"陈销售",dept:"销售三组",role:"销售",pending:88,following:35,converted:12,conversionRate:12.5,todayAssigned:15,status:"在岗",weight:5,capacity:90 },
  { id:6,name:"杨销售",dept:"销售三组",role:"资深销售",pending:28,following:20,converted:20,conversionRate:25.6,todayAssigned:5,status:"休假",weight:0,capacity:80 },
  { id:7,name:"赵销售",dept:"销售一组",role:"销售",pending:12,following:10,converted:5,conversionRate:10.5,todayAssigned:2,status:"在岗",weight:40,capacity:70 },
  { id:8,name:"黄销售",dept:"销售二组",role:"高级销售",pending:55,following:30,converted:22,conversionRate:24.2,todayAssigned:10,status:"在岗",weight:20,capacity:85 },
];

const recordSeed: RecordItem[] = [
  {id:"R09140018",leadName:"许晴",phone:"138****1420",type:"自动分配",toSales:"李销售",fromSales:"-",operator:"系统自动",time:"2026-09-14 11:32",remark:"高意向优先"},
  {id:"R09140017",leadName:"邵峰",phone:"139****7831",type:"手动分配",toSales:"刘销售",fromSales:"-",operator:"林晓曼",time:"2026-09-14 10:18",remark:"课程专家"},
  {id:"R09130016",leadName:"田静",phone:"136****3096",type:"重新分配",toSales:"赵销售",fromSales:"王销售",operator:"林晓曼",time:"2026-09-13 16:44",remark:"公海池重新激活"},
  {id:"R09130015",leadName:"孔明",phone:"158****6827",type:"回收",toSales:"公海池",fromSales:"陈销售",operator:"系统自动",time:"2026-09-13 14:05",remark:"48 小时未跟进"},
  {id:"R09120014",leadName:"白露",phone:"137****2453",type:"自动分配",toSales:"黄销售",fromSales:"-",operator:"系统自动",time:"2026-09-12 09:36",remark:"按地区匹配"},
  {id:"R09110013",leadName:"江涛",phone:"188****9014",type:"手动分配",toSales:"张销售",fromSales:"-",operator:"林晓曼",time:"2026-09-11 17:20",remark:"负载较低"},
];

const ruleSeed: DistributionRule[] = [
  {id:1,name:"高意向线索优先分配",desc:"高意向线索优先分配给绩效排名前 30% 的在岗销售",enabled:true},
  {id:2,name:"按课程类型分配",desc:"根据意向课程匹配对应课程专家与销售团队",enabled:true},
  {id:3,name:"按地区分配",desc:"根据线索所在地区匹配对应区域销售",enabled:false},
  {id:4,name:"负载均衡分配",desc:"优先分配给当前待跟进线索最少的销售",enabled:true},
];

const typeTone = (value: string): Tone => value === "自动分配" ? "green" : value === "手动分配" ? "blue" : value === "回收" ? "red" : "amber";
const intentTone = (value: Intent): Tone => value === "高" ? "red" : value === "中" ? "amber" : "neutral";
const sourceTone = (value: string): Tone => value === "门户网站" ? "blue" : value === "图书课程" ? "green" : value === "公众号" ? "violet" : "amber";
const reasonTone = (value: string): Tone => value === "超时未跟进" ? "red" : value === "多次未联系" ? "amber" : value === "销售主动释放" ? "blue" : "violet";
const loadMeta = (pending: number) => pending > 80
  ? { label:"高负载", tone:"red" as Tone, color:"#ef4444" }
  : pending > 50 ? { label:"较高负载", tone:"amber" as Tone, color:"#f59e0b" }
  : pending >= 20 ? { label:"正常负载", tone:"blue" as Tone, color:"#2563eb" }
  : { label:"低负载", tone:"green" as Tone, color:"#10b981" };

function Pagination({ page, total, size, onChange }: { page:number; total:number; size:number; onChange:(page:number)=>void }) {
  const pages = Math.max(1, Math.ceil(total / size));
  return <div className="lead-pagination">
    <span>共 {total} 条，第 {Math.min(page, pages)} / {pages} 页</span>
    <div>
      <button aria-label="上一页" disabled={page <= 1} onClick={() => onChange(page - 1)}><ChevronLeft size={14}/></button>
      {Array.from({length:pages},(_,index)=>index+1).slice(0,5).map(item=><button className={item===page?"active":""} onClick={()=>onChange(item)} key={item}>{item}</button>)}
      <button aria-label="下一页" disabled={page >= pages} onClick={() => onChange(page + 1)}><ChevronRight size={14}/></button>
    </div>
  </div>;
}

function Toggle({ checked, label, onChange }: { checked:boolean; label:string; onChange:()=>void }) {
  return <label className="switch"><input aria-label={label} type="checkbox" checked={checked} onChange={onChange}/><span/></label>;
}

export default function Leads() {
  const { notify } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const [activeView,setActiveView] = useState(views[0]);
  const [pool,setPool] = useState(poolSeed);
  const [publicLeads,setPublicLeads] = useState(publicSeed);
  const [records,setRecords] = useState(recordSeed);
  const [sales,setSales] = useState(salesSeed);
  const [poolFilters,setPoolFilters] = useState({search:"",source:"",course:"",intent:""});
  const [publicFilters,setPublicFilters] = useState({search:"",reason:"",course:""});
  const [recordFilters,setRecordFilters] = useState({search:"",type:"",sales:"",date:""});
  const [poolPage,setPoolPage] = useState(1);
  const [publicPage,setPublicPage] = useState(1);
  const [recordPage,setRecordPage] = useState(1);
  const [detailLead,setDetailLead] = useState<Lead | null>(null);
  const [moveLead,setMoveLead] = useState<Lead | null>(null);
  const [assignOpen,setAssignOpen] = useState(false);
  const [assignContext,setAssignContext] = useState<AssignmentContext>(null);
  const [assignMode,setAssignMode] = useState<AssignmentMode>("single");
  const [singleSales,setSingleSales] = useState<number | null>(null);
  const [multiSales,setMultiSales] = useState<number[]>([]);
  const [remark,setRemark] = useState("");
  const [autoOpen,setAutoOpen] = useState(false);
  const [autoRange,setAutoRange] = useState("all");
  const [rules,setRules] = useState(ruleSeed);
  const [autoEnabled,setAutoEnabled] = useState(true);
  const [autoDirty,setAutoDirty] = useState(false);
  const [limits,setLimits] = useState({pending:50,daily:20,preference:"绩效排名前 30% 的销售",notice:"系统通知 + 短信"});
  const [recycleDirty,setRecycleDirty] = useState(false);
  const [recycle,setRecycle] = useState({
    timeoutEnabled:true,timeoutHours:48,warnHours:24,highIntentTimeout:24,cooldown:72,
    contactEnabled:true,maxAttempts:3,interval:4,period:7,
    releaseEnabled:true,dailyRelease:5,approval:"不需要，直接释放",reasonRequired:"是，必须选择原因",
    resignEnabled:true,handling:"全部回收到公海池",handoverDays:3,
  });
  const [loadSort,setLoadSort] = useState("load");
  const [balanceOpen,setBalanceOpen] = useState(false);

  const filteredPool = useMemo(() => pool.filter(item =>
    (!poolFilters.search || item.name.includes(poolFilters.search) || item.phone.includes(poolFilters.search)) &&
    (!poolFilters.source || item.source === poolFilters.source) &&
    (!poolFilters.course || item.course === poolFilters.course) &&
    (!poolFilters.intent || item.intent === poolFilters.intent)
  ),[pool,poolFilters]);
  const filteredPublic = useMemo(() => publicLeads.filter(item =>
    (!publicFilters.search || item.name.includes(publicFilters.search) || item.phone.includes(publicFilters.search)) &&
    (!publicFilters.reason || item.reason === publicFilters.reason) &&
    (!publicFilters.course || item.course === publicFilters.course)
  ),[publicLeads,publicFilters]);
  const filteredRecords = useMemo(() => records.filter(item =>
    (!recordFilters.search || item.leadName.includes(recordFilters.search) || item.toSales.includes(recordFilters.search)) &&
    (!recordFilters.type || item.type === recordFilters.type) &&
    (!recordFilters.sales || item.toSales === recordFilters.sales) &&
    (!recordFilters.date || item.time.startsWith(recordFilters.date))
  ),[records,recordFilters]);
  const sortedSales = useMemo(() => [...sales].sort((a,b) =>
    loadSort === "conversion" ? b.conversionRate-a.conversionRate :
    loadSort === "name" ? a.name.localeCompare(b.name,"zh-CN") : b.pending-a.pending
  ),[sales,loadSort]);

  const poolPageRows = filteredPool.slice((poolPage-1)*8,poolPage*8);
  const publicPageRows = filteredPublic.slice((publicPage-1)*8,publicPage*8);
  const recordPageRows = filteredRecords.slice((recordPage-1)*8,recordPage*8);
  const selectedPool = pool.filter(item=>item.selected);
  const selectedPublic = publicLeads.filter(item=>item.selected);
  const nowText = () => "2026-09-14 14:30";
  const newRecordId = (offset=0) => `R0914${String(records.length+19+offset).padStart(4,"0")}`;

  const togglePoolPage = (checked:boolean) => {
    const ids = new Set(poolPageRows.map(item=>item.id));
    setPool(current=>current.map(item=>ids.has(item.id)?{...item,selected:checked}:item));
  };
  const togglePublicPage = (checked:boolean) => {
    const ids = new Set(publicPageRows.map(item=>item.id));
    setPublicLeads(current=>current.map(item=>ids.has(item.id)?{...item,selected:checked}:item));
  };
  const openAssignment = (context:AssignmentContext, leadId?:string) => {
    if (context === "pool" && leadId) setPool(current=>current.map(item=>({...item,selected:item.id===leadId})));
    if (context === "public" && leadId) setPublicLeads(current=>current.map(item=>({...item,selected:item.id===leadId})));
    const count = leadId ? 1 : context === "pool" ? selectedPool.length : selectedPublic.length;
    if (!count) { notify("请先选择要分配的线索"); return; }
    setAssignContext(context); setAssignMode("single"); setSingleSales(null); setMultiSales([]); setRemark(""); setAssignOpen(true);
  };
  const resolveAssignees = (count:number) => {
    const available = sales.filter(item=>item.status==="在岗");
    if (assignMode === "single") return Array(count).fill(available.find(item=>item.id===singleSales));
    if (assignMode === "round") {
      const chosen = available.filter(item=>multiSales.includes(item.id));
      return Array.from({length:count},(_,index)=>chosen[index%chosen.length]);
    }
    const projected = available.map(item=>({...item}));
    return Array.from({length:count},()=>{
      projected.sort((a,b)=>a.pending-b.pending || b.conversionRate-a.conversionRate);
      projected[0].pending += 1;
      return projected[0];
    });
  };
  const confirmAssignment = () => {
    const leads = assignContext === "pool" ? selectedPool : selectedPublic;
    if (assignMode === "single" && !singleSales) { notify("请选择一位销售"); return; }
    if (assignMode === "round" && !multiSales.length) { notify("请至少选择一位参与销售"); return; }
    const assignees = resolveAssignees(leads.length);
    const ids = new Set(leads.map(item=>item.id));
    if (assignContext === "pool") setPool(current=>current.filter(item=>!ids.has(item.id)).map(item=>({...item,selected:false})));
    else setPublicLeads(current=>current.filter(item=>!ids.has(item.id)).map(item=>({...item,selected:false})));
    setRecords(current=>[
      ...leads.map((lead,index):RecordItem=>({
        id:newRecordId(index),leadName:lead.name,phone:lead.phone,
        type:assignContext==="public"?"重新分配":assignMode==="load"?"自动分配":"手动分配",
        toSales:assignees[index].name,fromSales:"fromSales" in lead?lead.fromSales:"-",
        operator:assignMode==="load"?"系统自动":"林晓曼",time:nowText(),remark:remark || (assignMode==="round"?"多人平均分配":assignMode==="load"?"按当前负载智能分配":"指定销售"),
      })),
      ...current,
    ]);
    setSales(current=>current.map(person=>{
      const added = assignees.filter(item=>item.id===person.id).length;
      return added?{...person,pending:person.pending+added,todayAssigned:person.todayAssigned+added}:person;
    }));
    setAssignOpen(false);
    notify(`已完成 ${leads.length} 条线索分配`);
  };
  const runAutoAssignment = () => {
    const candidates = pool.filter(item=>autoRange==="all" || (autoRange==="overdue"?item.waitHours>24:item.intent==="高"));
    if (!candidates.length) { notify("当前没有符合范围的待分配线索"); return; }
    const available = sales.filter(item=>item.status==="在岗").map(item=>({...item}));
    const generated = candidates.map((lead,index):RecordItem=>{
      const preferred = lead.intent==="高"
        ? [...available].sort((a,b)=>b.conversionRate-a.conversionRate || a.pending-b.pending)[0]
        : [...available].sort((a,b)=>a.pending-b.pending || a.todayAssigned-b.todayAssigned)[0];
      preferred.pending += 1; preferred.todayAssigned += 1;
      return {id:newRecordId(index),leadName:lead.name,phone:lead.phone,type:"自动分配",toSales:preferred.name,fromSales:"-",operator:"系统自动",time:nowText(),remark:lead.intent==="高"?"命中高意向优先规则":"命中负载均衡规则"};
    });
    setSales(current=>current.map(person=>{
      const projected = available.find(item=>item.id===person.id);
      return projected?{...person,pending:projected.pending,todayAssigned:projected.todayAssigned}:person;
    }));
    const ids = new Set(candidates.map(item=>item.id));
    setPool(current=>current.filter(item=>!ids.has(item.id)));
    setRecords(current=>[...generated,...current]);
    setAutoOpen(false);
    notify(`自动分配完成，共处理 ${candidates.length} 条线索`);
  };
  const confirmMoveToPublic = () => {
    if (!moveLead) return;
    setPool(current=>current.filter(item=>item.id!==moveLead.id));
    setPublicLeads(current=>[{
      id:`G${String(publicLeads.length+1).padStart(4,"0")}`,name:moveLead.name,phone:moveLead.phone,course:moveLead.course,
      reason:"销售主动释放",fromSales:"-",recycleTime:"09-14 14:30",inPublicHours:0,selected:false,
    },...current]);
    setRecords(current=>[{id:newRecordId(),leadName:moveLead.name,phone:moveLead.phone,type:"回收",toSales:"公海池",fromSales:"-",operator:"林晓曼",time:nowText(),remark:"管理员移入公海"},...current]);
    setMoveLead(null); notify("线索已移入公海池");
  };
  const claimPublic = (id:string) => {
    const lead = publicLeads.find(item=>item.id===id);
    if (!lead) return;
    setPublicLeads(current=>current.filter(item=>item.id!==id));
    setRecords(current=>[{id:newRecordId(),leadName:lead.name,phone:lead.phone,type:"重新分配",toSales:"林晓曼",fromSales:lead.fromSales,operator:"林晓曼",time:nowText(),remark:"从公海池领取"},...current]);
    notify(`已领取 ${lead.name} 的线索`);
  };
  const moveRule = (index:number,direction:-1|1) => {
    const target=index+direction;
    if(target<0||target>=rules.length)return;
    setRules(current=>{const next=[...current];[next[index],next[target]]=[next[target],next[index]];return next;});
    setAutoDirty(true);
  };
  const updateRecycle = <K extends keyof typeof recycle>(key:K,value:(typeof recycle)[K]) => {
    setRecycle(current=>({...current,[key]:value})); setRecycleDirty(true);
  };
  const adjustLoad = (id:number,change:number) => {
    setSales(current=>current.map(item=>item.id===id?{...item,weight:Math.max(0,Math.min(100,item.weight+change)),capacity:Math.max(10,item.capacity+change)}:item));
    notify(change>0?"已提高该销售的分配权重与容量":"已降低该销售的分配权重与容量");
  };

  return <div className="leads-page">
    <PageHeader title="线索管理" description="统一处理线索分配、公海回收与销售负载，确保每条线索及时流转"
      actions={<><Button variant="secondary" onClick={()=>setActiveView("分配记录")}><ListChecks size={14}/>查看分配记录</Button><Button onClick={()=>setAutoOpen(true)} disabled={!pool.length}><Zap size={14}/>自动分配</Button></>}/>
    <Card className="lead-workspace">
      <Tabs items={views} active={activeView} onChange={item=>setActiveView(item)}/>

      {activeView==="待分配线索池"&&<div className="lead-view">
        <div className="lead-metrics">
          <Metric label="待分配线索" value={String(pool.length)} trend="需及时处理" icon={<Inbox size={17}/>} tone="blue"/>
          <Metric label="今日已分配" value={String(sales.reduce((sum,item)=>sum+item.todayAssigned,0))} trend="较昨日 +12%" icon={<UserCheck size={17}/>} tone="green"/>
          <Metric label="超 24h 未分配" value={String(pool.filter(item=>item.waitHours>24).length)} trend="优先处理高意向" icon={<AlertTriangle size={17}/>} tone="red"/>
          <Metric label="自动分配状态" value={autoEnabled?"运行中":"已暂停"} trend={rules.filter(item=>item.enabled).length+" 条规则生效"} icon={<Workflow size={17}/>} tone={autoEnabled?"green":"amber"}/>
        </div>
        <section className="lead-section">
          <div className="lead-section-head"><div><h2>待分配线索列表</h2><p>已选择 {selectedPool.length} 条 · 超时线索以红色标记</p></div><div><Button variant="secondary" onClick={()=>setAutoOpen(true)}><Zap size={14}/>自动分配</Button><Button onClick={()=>openAssignment("pool")} disabled={!selectedPool.length}><UsersRound size={14}/>手动分配选中</Button></div></div>
          <div className="lead-filter">
            <label><Search size={14}/><input className="input" value={poolFilters.search} placeholder="搜索姓名 / 手机号" onChange={event=>{setPoolFilters({...poolFilters,search:event.target.value});setPoolPage(1)}}/></label>
            <select className="select" value={poolFilters.source} onChange={event=>{setPoolFilters({...poolFilters,source:event.target.value});setPoolPage(1)}}><option value="">全部来源</option>{sources.map(item=><option key={item}>{item}</option>)}</select>
            <select className="select" value={poolFilters.course} onChange={event=>{setPoolFilters({...poolFilters,course:event.target.value});setPoolPage(1)}}><option value="">全部课程</option>{courses.map(item=><option key={item}>{item}</option>)}</select>
            <select className="select" value={poolFilters.intent} onChange={event=>{setPoolFilters({...poolFilters,intent:event.target.value});setPoolPage(1)}}><option value="">全部意向度</option><option>高</option><option>中</option><option>低</option></select>
            <Button variant="ghost" onClick={()=>{setPoolFilters({search:"",source:"",course:"",intent:""});setPoolPage(1)}}><RotateCcw size={14}/>重置</Button>
          </div>
          <div className="table-panel">
            <table className="data-table lead-table"><thead><tr><th><input aria-label="选择当前页" type="checkbox" checked={poolPageRows.length>0&&poolPageRows.every(item=>item.selected)} onChange={event=>togglePoolPage(event.target.checked)}/></th><th>姓名</th><th>手机号</th><th>来源</th><th>意向课程</th><th>意向度</th><th>地区</th><th>留资时间</th><th>等待时长</th><th>操作</th></tr></thead>
              <tbody>{poolPageRows.map(lead=><tr className={lead.selected?"selected":""} key={lead.id}>
                <td><input aria-label={`选择${lead.name}`} type="checkbox" checked={lead.selected} onChange={()=>setPool(current=>current.map(item=>item.id===lead.id?{...item,selected:!item.selected}:item))}/></td>
                <td><button className="lead-name" onClick={()=>setDetailLead(lead)}>{lead.name}</button><small className="table-subline">{lead.id}</small></td><td>{lead.phone}</td><td><Badge tone={sourceTone(lead.source)}>{lead.source}</Badge></td><td>{lead.course}</td><td><Badge tone={intentTone(lead.intent)}>{lead.intent}意向</Badge></td><td>{lead.region}</td><td>{lead.createTime}</td>
                <td><span className={lead.waitHours>24?"lead-overdue":""}><Clock3 size={12}/>{lead.waitHours}h</span></td><td><div className="row-actions"><button onClick={()=>openAssignment("pool",lead.id)}>分配</button><button className="danger" onClick={()=>setMoveLead(lead)}>移入公海</button></div></td>
              </tr>)}</tbody>
            </table>
            {!poolPageRows.length&&<EmptyState title="暂无待分配线索" detail="当前筛选条件下没有需要处理的线索。"/>}
          </div>
          <Pagination page={poolPage} total={filteredPool.length} size={8} onChange={setPoolPage}/>
        </section>
      </div>}

      {activeView==="分配记录"&&<div className="lead-view">
        <section className="lead-section">
          <div className="lead-section-head"><div><h2>分配记录</h2><p>当前会话产生的分配与回收记录会置顶显示</p></div><Button variant="secondary" onClick={()=>notify(`已导出 ${filteredRecords.length} 条分配记录`)}><Download size={14}/>导出记录</Button></div>
          <div className="lead-filter">
            <label><Search size={14}/><input className="input" value={recordFilters.search} placeholder="搜索线索 / 销售" onChange={event=>{setRecordFilters({...recordFilters,search:event.target.value});setRecordPage(1)}}/></label>
            <select className="select" value={recordFilters.type} onChange={event=>{setRecordFilters({...recordFilters,type:event.target.value});setRecordPage(1)}}><option value="">全部类型</option>{["手动分配","自动分配","回收","重新分配"].map(item=><option key={item}>{item}</option>)}</select>
            <select className="select" value={recordFilters.sales} onChange={event=>{setRecordFilters({...recordFilters,sales:event.target.value});setRecordPage(1)}}><option value="">全部销售</option>{sales.map(item=><option key={item.id}>{item.name}</option>)}</select>
            <input aria-label="筛选日期" type="date" className="input lead-date" value={recordFilters.date} onChange={event=>{setRecordFilters({...recordFilters,date:event.target.value});setRecordPage(1)}}/>
          </div>
          <div className="table-panel"><table className="data-table record-table"><thead><tr><th>记录 ID</th><th>线索</th><th>手机号</th><th>类型</th><th>分配给</th><th>原负责人</th><th>操作人</th><th>时间</th><th>备注</th></tr></thead><tbody>
            {recordPageRows.map(item=><tr key={item.id}><td>{item.id}</td><td><strong>{item.leadName}</strong></td><td>{item.phone}</td><td><Badge tone={typeTone(item.type)}>{item.type}</Badge></td><td>{item.toSales}</td><td>{item.fromSales}</td><td>{item.operator}</td><td>{item.time}</td><td>{item.remark||"-"}</td></tr>)}
          </tbody></table>{!recordPageRows.length&&<EmptyState title="暂无匹配记录" detail="请调整搜索或筛选条件。"/>}</div>
          <Pagination page={recordPage} total={filteredRecords.length} size={8} onChange={setRecordPage}/>
        </section>
      </div>}

      {activeView==="公海池"&&<div className="lead-view">
        <div className="lead-metrics">
          <Metric label="公海池线索" value={String(publicLeads.length)} trend="可重新分配" icon={<Inbox size={17}/>} tone="blue"/>
          <Metric label="超时回收" value={String(publicLeads.filter(item=>item.reason==="超时未跟进").length)} trend="按 48h 规则回收" icon={<Clock3 size={17}/>} tone="red"/>
          <Metric label="未联系回收" value={String(publicLeads.filter(item=>item.reason==="多次未联系").length)} trend="需更换触达方式" icon={<RefreshCw size={17}/>} tone="amber"/>
          <Metric label="本月重新激活" value="26" trend="转化率 8.4%" icon={<Sparkles size={17}/>} tone="green"/>
        </div>
        <section className="lead-section">
          <div className="lead-section-head"><div><h2>公海池线索</h2><p>已选择 {selectedPublic.length} 条</p></div><Button onClick={()=>openAssignment("public")} disabled={!selectedPublic.length}><RefreshCw size={14}/>批量重新分配</Button></div>
          <div className="lead-filter">
            <label><Search size={14}/><input className="input" value={publicFilters.search} placeholder="搜索姓名 / 手机号" onChange={event=>{setPublicFilters({...publicFilters,search:event.target.value});setPublicPage(1)}}/></label>
            <select className="select" value={publicFilters.reason} onChange={event=>{setPublicFilters({...publicFilters,reason:event.target.value});setPublicPage(1)}}><option value="">全部回收原因</option>{["超时未跟进","多次未联系","销售主动释放","离职交接"].map(item=><option key={item}>{item}</option>)}</select>
            <select className="select" value={publicFilters.course} onChange={event=>{setPublicFilters({...publicFilters,course:event.target.value});setPublicPage(1)}}><option value="">全部课程</option>{courses.map(item=><option key={item}>{item}</option>)}</select>
          </div>
          <div className="table-panel"><table className="data-table public-table"><thead><tr><th><input aria-label="选择当前页" type="checkbox" checked={publicPageRows.length>0&&publicPageRows.every(item=>item.selected)} onChange={event=>togglePublicPage(event.target.checked)}/></th><th>姓名</th><th>手机号</th><th>意向课程</th><th>回收原因</th><th>原负责人</th><th>回收时间</th><th>公海时长</th><th>操作</th></tr></thead><tbody>
            {publicPageRows.map(lead=><tr className={lead.selected?"selected":""} key={lead.id}><td><input aria-label={`选择${lead.name}`} type="checkbox" checked={lead.selected} onChange={()=>setPublicLeads(current=>current.map(item=>item.id===lead.id?{...item,selected:!item.selected}:item))}/></td><td><strong>{lead.name}</strong><small className="table-subline">{lead.id}</small></td><td>{lead.phone}</td><td>{lead.course}</td><td><Badge tone={reasonTone(lead.reason)}>{lead.reason}</Badge></td><td>{lead.fromSales}</td><td>{lead.recycleTime}</td><td><Badge tone={lead.inPublicHours>168?"red":"neutral"}>{lead.inPublicHours>=24?`${Math.floor(lead.inPublicHours/24)}天`:`${lead.inPublicHours}小时`}</Badge></td><td><div className="row-actions"><button onClick={()=>openAssignment("public",lead.id)}>重新分配</button><button onClick={()=>claimPublic(lead.id)}>领取</button></div></td></tr>)}
          </tbody></table>{!publicPageRows.length&&<EmptyState title="公海池暂无线索" detail="当前筛选条件下没有可领取线索。"/>}</div>
          <Pagination page={publicPage} total={filteredPublic.length} size={8} onChange={setPublicPage}/>
        </section>
      </div>}

      {activeView==="自动分配规则"&&<div className="lead-view lead-config-view">
        <section className="lead-switch-banner"><span className="metric-symbol tone-blue"><Zap size={17}/></span><div><strong>自动分配总开关</strong><p>开启后，新线索按下方规则依次匹配；关闭后统一进入待分配池。</p></div><Toggle checked={autoEnabled} label="自动分配总开关" onChange={()=>{setAutoEnabled(!autoEnabled);setAutoDirty(true)}}/></section>
        <div className="lead-rule-layout">
          <section className="lead-section">
            <div className="lead-section-head"><div><h2>分配策略优先级</h2><p>从上至下匹配，命中后停止</p></div><Button variant="secondary" onClick={()=>{setRules(current=>[...current,{id:Math.max(...current.map(item=>item.id))+1,name:"新分配规则",desc:"配置新的线索匹配条件与目标销售团队",enabled:true}]);setAutoDirty(true)}}><Plus size={14}/>添加规则</Button></div>
            <div className="lead-rule-list">{rules.map((rule,index)=><article className={!rule.enabled?"disabled":""} key={rule.id}><span>{index+1}</span><div><strong>{rule.name}</strong><p>{rule.desc}</p></div><Toggle checked={rule.enabled} label={`${rule.name}开关`} onChange={()=>{setRules(current=>current.map(item=>item.id===rule.id?{...item,enabled:!item.enabled}:item));setAutoDirty(true)}}/><div className="rule-buttons"><button disabled={index===0} onClick={()=>moveRule(index,-1)}><ArrowUp size={13}/></button><button disabled={index===rules.length-1} onClick={()=>moveRule(index,1)}><ArrowDown size={13}/></button><button disabled={rules.length<=1} className="danger" onClick={()=>{setRules(current=>current.filter(item=>item.id!==rule.id));setAutoDirty(true)}}><Trash2 size={13}/></button></div></article>)}</div>
          </section>
          <section className="lead-section">
            <div className="lead-section-head"><div><h2>兜底轮询策略</h2><p>规则均未命中时，按可用成员顺序轮询</p></div><Badge tone="green">始终启用</Badge></div>
            <div className="fallback-sales">{sales.filter(item=>item.status==="在岗").map(item=><span key={item.id}><Avatar name={item.name}/><strong>{item.name}</strong><small>{item.dept}</small></span>)}</div>
            <div className="strategy-link"><Workflow size={16}/><div><strong>需要高级路由与模拟？</strong><p>课程、区域、容量及回退链路可在策略中心统一配置。</p></div><Button variant="secondary" onClick={()=>navigate("/strategies")}>打开策略配置中心<ChevronRight size={14}/></Button></div>
          </section>
        </div>
        <section className="lead-section lead-limit-section">
          <div className="lead-section-head"><div><h2>分配限制设置</h2><p>控制成员容量、优先策略与通知渠道</p></div>{autoDirty&&<span className="unsaved-dot"><span/>有未保存变更</span>}</div>
          <div className="lead-form-grid">
            <label className="field"><span>单人最大待跟进线索数</span><input className="input" type="number" value={limits.pending} onChange={event=>{setLimits({...limits,pending:Number(event.target.value)});setAutoDirty(true)}}/></label>
            <label className="field"><span>单人每日最大分配数</span><input className="input" type="number" value={limits.daily} onChange={event=>{setLimits({...limits,daily:Number(event.target.value)});setAutoDirty(true)}}/></label>
            <label className="field"><span>高意向优先分配给</span><select className="select" value={limits.preference} onChange={event=>{setLimits({...limits,preference:event.target.value});setAutoDirty(true)}}><option>绩效排名前 30% 的销售</option><option>负载最轻的销售</option><option>正常轮询</option></select></label>
            <label className="field"><span>分配通知方式</span><select className="select" value={limits.notice} onChange={event=>{setLimits({...limits,notice:event.target.value});setAutoDirty(true)}}><option>系统通知 + 短信</option><option>仅系统通知</option><option>仅短信</option><option>不通知</option></select></label>
          </div>
          <div className="lead-save-row"><Button onClick={()=>{setAutoDirty(false);notify("自动分配规则已保存")}} disabled={!autoDirty}><Save size={14}/>保存配置</Button></div>
        </section>
      </div>}

      {activeView==="回收规则配置"&&<div className="lead-view lead-config-view">
        <div className="recycle-grid">
          <section className="lead-section recycle-card"><div className="lead-section-head"><div><h2>超时未跟进回收</h2><p>超过指定时长未跟进时自动进入公海池</p></div><Toggle checked={recycle.timeoutEnabled} label="超时回收" onChange={()=>updateRecycle("timeoutEnabled",!recycle.timeoutEnabled)}/></div><div className="lead-form-grid">
            <label className="field"><span>超时时间（小时）</span><input className="input" type="number" value={recycle.timeoutHours} onChange={e=>updateRecycle("timeoutHours",Number(e.target.value))}/></label><label className="field"><span>预警时间（小时）</span><input className="input" type="number" value={recycle.warnHours} onChange={e=>updateRecycle("warnHours",Number(e.target.value))}/></label><label className="field"><span>高意向超时（小时）</span><input className="input" type="number" value={recycle.highIntentTimeout} onChange={e=>updateRecycle("highIntentTimeout",Number(e.target.value))}/></label><label className="field"><span>回收冷却（小时）</span><input className="input" type="number" value={recycle.cooldown} onChange={e=>updateRecycle("cooldown",Number(e.target.value))}/></label>
          </div></section>
          <section className="lead-section recycle-card"><div className="lead-section-head"><div><h2>多次未联系回收</h2><p>在统计周期内多次联系失败时自动回收</p></div><Toggle checked={recycle.contactEnabled} label="未联系回收" onChange={()=>updateRecycle("contactEnabled",!recycle.contactEnabled)}/></div><div className="lead-form-grid">
            <label className="field"><span>最大未联系次数</span><input className="input" type="number" value={recycle.maxAttempts} onChange={e=>updateRecycle("maxAttempts",Number(e.target.value))}/></label><label className="field"><span>联系间隔（小时）</span><input className="input" type="number" value={recycle.interval} onChange={e=>updateRecycle("interval",Number(e.target.value))}/></label><label className="field"><span>统计周期（天）</span><input className="input" type="number" value={recycle.period} onChange={e=>updateRecycle("period",Number(e.target.value))}/></label>
          </div></section>
          <section className="lead-section recycle-card"><div className="lead-section-head"><div><h2>销售主动释放</h2><p>允许销售将不匹配的线索释放至公海</p></div><Toggle checked={recycle.releaseEnabled} label="主动释放" onChange={()=>updateRecycle("releaseEnabled",!recycle.releaseEnabled)}/></div><div className="lead-form-grid">
            <label className="field"><span>每日最大释放数</span><input className="input" type="number" value={recycle.dailyRelease} onChange={e=>updateRecycle("dailyRelease",Number(e.target.value))}/></label><label className="field"><span>审批要求</span><select className="select" value={recycle.approval} onChange={e=>updateRecycle("approval",e.target.value)}><option>不需要，直接释放</option><option>需要主管审批</option><option>仅高意向需要审批</option></select></label><label className="field"><span>释放原因</span><select className="select" value={recycle.reasonRequired} onChange={e=>updateRecycle("reasonRequired",e.target.value)}><option>是，必须选择原因</option><option>否，可选填</option></select></label>
          </div></section>
          <section className="lead-section recycle-card"><div className="lead-section-head"><div><h2>离职交接回收</h2><p>离职后按指定方式回收或转移名下线索</p></div><Toggle checked={recycle.resignEnabled} label="离职回收" onChange={()=>updateRecycle("resignEnabled",!recycle.resignEnabled)}/></div><div className="lead-form-grid">
            <label className="field"><span>线索处理方式</span><select className="select" value={recycle.handling} onChange={e=>updateRecycle("handling",e.target.value)}><option>全部回收到公海池</option><option>批量转移给指定销售</option><option>高意向转移，其余回收</option></select></label><label className="field"><span>交接缓冲期（天）</span><input className="input" type="number" value={recycle.handoverDays} onChange={e=>updateRecycle("handoverDays",Number(e.target.value))}/></label>
          </div></section>
        </div>
        <div className="lead-save-row">{recycleDirty&&<span className="unsaved-dot"><span/>有未保存变更</span>}<Button onClick={()=>{setRecycleDirty(false);notify("回收规则已保存")}} disabled={!recycleDirty}><Save size={14}/>保存回收规则</Button></div>
      </div>}

      {activeView==="销售负载看板"&&<div className="lead-view">
        <div className="lead-metrics">
          <Metric label="销售总人数" value={String(sales.length)} trend={`${sales.filter(item=>item.status==="在岗").length} 人在岗`} icon={<UsersRound size={17}/>} tone="blue"/>
          <Metric label="平均负载" value={String(Math.round(sales.reduce((sum,item)=>sum+item.pending,0)/sales.length))} trend="条 / 人" icon={<CircleGauge size={17}/>} tone="blue"/>
          <Metric label="高负载销售" value={String(sales.filter(item=>item.pending>50).length)} trend="超过 50 条" icon={<AlertTriangle size={17}/>} tone="red"/>
          <Metric label="低负载销售" value={String(sales.filter(item=>item.pending<20).length)} trend="可优先分配" icon={<CheckCircle2 size={17}/>} tone="green"/>
        </div>
        <section className="lead-section">
          <div className="lead-section-head"><div><h2>销售负载详情</h2><p>调整动作会同步成员容量与分配权重</p></div><div><select className="select" value={loadSort} onChange={event=>setLoadSort(event.target.value)}><option value="load">按负载排序</option><option value="conversion">按转化率排序</option><option value="name">按姓名排序</option></select><Button variant="secondary" onClick={()=>setBalanceOpen(true)}><Scale size={14}/>负载均衡调整</Button></div></div>
          <div className="load-grid">{sortedSales.map(person=>{const meta=loadMeta(person.pending);const percent=Math.min(100,Math.round(person.pending/person.capacity*100));return <article className="load-card" key={person.id}>
            <div className="load-card-head"><Avatar name={person.name}/><div><strong>{person.name}</strong><p>{person.dept} · {person.role}</p></div><Badge tone={person.status==="休假"?"neutral":meta.tone}>{person.status==="休假"?"休假":meta.label}</Badge></div>
            <div className="load-stat-grid"><div><strong style={{color:meta.color}}>{person.pending}</strong><span>待跟进</span></div><div><strong>{person.following}</strong><span>跟进中</span></div><div><strong>{person.converted}</strong><span>已转化</span></div></div>
            <div className="load-progress-head"><span>负载进度</span><span>{person.pending}/{person.capacity} · 转化率 {person.conversionRate}%</span></div><div className="load-progress"><span style={{width:`${percent}%`,background:meta.color}}/></div>
            <div className="load-card-foot"><span>权重 {person.weight}% · 今日 {person.todayAssigned} 条</span><div><button onClick={()=>adjustLoad(person.id,-5)}>减少分配</button><button onClick={()=>adjustLoad(person.id,5)}>增加分配</button></div></div>
          </article>})}</div>
          <div className="load-legend">{[["#10b981","低负载 <20"],["#2563eb","正常 20-50"],["#f59e0b","较高 50-80"],["#ef4444","高负载 >80"]].map(([color,label])=><span key={label}><i style={{background:color}}/>{label}</span>)}</div>
        </section>
      </div>}
    </Card>

    <Drawer open={Boolean(detailLead)} onClose={()=>setDetailLead(null)} title="线索详情">
      {detailLead&&<div className="lead-detail"><div className="lead-detail-hero"><Avatar name={detailLead.name}/><div><Badge tone={intentTone(detailLead.intent)}>{detailLead.intent}意向</Badge><h3>{detailLead.name}</h3><p>{detailLead.phone} · {detailLead.region}</p></div></div><div className="detail-grid">{[["线索来源",detailLead.source],["意向课程",detailLead.course],["留资时间",detailLead.createTime],["等待时长",`${detailLead.waitHours} 小时`],["重复状态","无重复线索"],["最近活动","浏览课程详情 3 次"]].map(([label,value])=><div className="detail-item" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><h3 className="section-title">活动轨迹</h3><div className="timeline"><div className="timeline-item">提交课程咨询表单<small>{detailLead.createTime}</small></div><div className="timeline-item">查看课程价格与班型<small>留资前 8 分钟</small></div><div className="timeline-item">首次访问来自 {detailLead.source}<small>留资前 21 分钟</small></div></div><Button onClick={()=>{setDetailLead(null);openAssignment("pool",detailLead.id)}}>立即分配</Button></div>}
    </Drawer>

    <Modal open={Boolean(moveLead)} onClose={()=>setMoveLead(null)} title="移入公海池">
      <div className="confirm-dialog"><span className="metric-symbol tone-amber"><AlertTriangle size={18}/></span><div><strong>确认将 {moveLead?.name} 移入公海池？</strong><p>该线索将从待分配池移除，并生成一条回收记录。</p></div></div><div className="form-actions"><Button variant="secondary" onClick={()=>setMoveLead(null)}>取消</Button><Button variant="danger" onClick={confirmMoveToPublic}>确认移入</Button></div>
    </Modal>

    <Modal open={assignOpen} onClose={()=>setAssignOpen(false)} title="手动分配线索">
      <div className="assignment-summary">已选择 <strong>{assignContext==="pool"?selectedPool.length:selectedPublic.length}</strong> 条线索</div>
      <div className="assignment-modes">{[["single","指定销售"],["round","平均分配给多人"],["load","按负载智能分配"]].map(([mode,label])=><button className={assignMode===mode?"active":""} onClick={()=>setAssignMode(mode as AssignmentMode)} key={mode}>{label}</button>)}</div>
      {assignMode==="load"?<div className="smart-assignment"><Sparkles size={18}/><div><strong>智能负载分配</strong><p>系统将按待跟进数量升序分配，同负载时优先选择转化率更高的销售。</p></div></div>:<div className="sales-picker">{sales.map(person=><label className={`${person.status==="休假"?"disabled":""} ${(assignMode==="single"?singleSales===person.id:multiSales.includes(person.id))?"selected":""}`} key={person.id}>
        <input type={assignMode==="single"?"radio":"checkbox"} disabled={person.status==="休假"} checked={assignMode==="single"?singleSales===person.id:multiSales.includes(person.id)} onChange={()=>assignMode==="single"?setSingleSales(person.id):setMultiSales(current=>current.includes(person.id)?current.filter(id=>id!==person.id):[...current,person.id])}/>
        <Avatar name={person.name}/><div><strong>{person.name}<Badge tone={person.status==="休假"?"neutral":loadMeta(person.pending).tone}>{person.status}</Badge></strong><small>{person.dept} · 待跟进 {person.pending} · 转化率 {person.conversionRate}%</small></div><span style={{background:loadMeta(person.pending).color}}/>
      </label>)}</div>}
      <label className="field assignment-note"><span>分配备注</span><textarea value={remark} placeholder="可选，填写分配原因或说明" onChange={event=>setRemark(event.target.value)}/></label>
      <div className="form-actions"><Button variant="secondary" onClick={()=>setAssignOpen(false)}>取消</Button><Button onClick={confirmAssignment}>确认分配</Button></div>
    </Modal>

    <Modal open={autoOpen} onClose={()=>setAutoOpen(false)} title="自动分配">
      <p className="modal-intro">按照当前启用规则，将指定范围内的待分配线索自动分配给在岗销售。</p>
      <label className="field"><span>分配范围</span><select className="select" value={autoRange} onChange={event=>setAutoRange(event.target.value)}><option value="all">全部待分配线索（{pool.length} 条）</option><option value="overdue">仅超 24h 未分配（{pool.filter(item=>item.waitHours>24).length} 条）</option><option value="high">仅高意向线索（{pool.filter(item=>item.intent==="高").length} 条）</option></select></label>
      <div className="auto-rule-preview"><strong>当前规则顺序</strong>{rules.filter(item=>item.enabled).map((rule,index)=><div key={rule.id}><span>{index+1}</span>{rule.name}</div>)}</div>
      <div className="warning-note"><AlertTriangle size={14}/>自动分配会立即更新线索池、分配记录和销售负载。</div>
      <div className="form-actions"><Button variant="secondary" onClick={()=>setAutoOpen(false)}>取消</Button><Button onClick={runAutoAssignment} disabled={!autoEnabled}>开始自动分配</Button></div>
    </Modal>

    <Drawer open={balanceOpen} onClose={()=>setBalanceOpen(false)} title="负载均衡建议">
      <div className="balance-summary"><Scale size={18}/><div><strong>建议转移 24 条待跟进线索</strong><small>预计团队负载离散度下降 38%</small></div></div>
      <div className="balance-list">{sales.filter(item=>item.pending>50).map(source=>{const target=[...sales].filter(item=>item.status==="在岗").sort((a,b)=>a.pending-b.pending)[0];const count=Math.min(12,Math.floor((source.pending-target.pending)/2));return <article key={source.id}><div><Avatar name={source.name}/><span><strong>{source.name}</strong><small>{source.pending} 条 · {loadMeta(source.pending).label}</small></span></div><ChevronRight size={15}/><div><Avatar name={target.name}/><span><strong>{target.name}</strong><small>建议转入 {Math.max(1,count)} 条</small></span></div></article>})}</div>
      <div className="warning-note"><BellRing size={14}/>建议仅调整后续分配权重，不会直接转移存量线索。</div>
      <div className="form-actions"><Button variant="secondary" onClick={()=>setBalanceOpen(false)}>关闭</Button><Button onClick={()=>{setSales(current=>current.map(item=>item.pending>50?{...item,weight:Math.max(5,item.weight-10)}:item.pending<20?{...item,weight:Math.min(100,item.weight+15)}:item));setBalanceOpen(false);notify("负载均衡建议已应用到分配权重")}}><SlidersHorizontal size={14}/>应用权重建议</Button></div>
    </Drawer>
  </div>;
}
