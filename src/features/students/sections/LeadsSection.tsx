import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, Paperclip, PhoneCall, Sparkles, UserRoundCheck, UsersRound } from "lucide-react";
import { Badge, Button, Card, EmptyState, Modal, Tabs } from "../../../components/ui";
import { owners } from "../mockData";
import { useStudents } from "../StudentContext";
import { maskPhone, nowTimestamp } from "../utils";
import type { FollowUp, Lead } from "../types";

const views = ["待分配","我的线索","超时预警","跟进记录"];

export default function LeadsSection() {
  const {leads,scopedLeads,setLeads,role,notify,addLog}=useStudents();
  const [view,setView]=useState(views[0]);
  const [selected,setSelected]=useState<Set<string>>(new Set());
  const [assignOpen,setAssignOpen]=useState(false);
  const [followTarget,setFollowTarget]=useState<Lead|null>(null);
  const [smartRunning,setSmartRunning]=useState(false);
  const [historyPage,setHistoryPage]=useState(1);
  const visible = useMemo(()=>scopedLeads.filter((lead)=>view==="待分配"?lead.owner==="待分配":view==="我的线索"?lead.owner==="林晓曼":view==="超时预警"?lead.overdueHours>24:true),[scopedLeads,view]);
  const rows=visible.slice((historyPage-1)*15,historyPage*15);
  const assign = (owner:string) => {
    setLeads((items)=>items.map((lead)=>selected.has(lead.id)?{...lead,owner,status:"跟进中"}:lead));
    addLog("线索分配",`${selected.size} 条线索`,`分配给 ${owner}`);
    notify(`已将 ${selected.size} 条线索分配给 ${owner}`);setSelected(new Set());setAssignOpen(false);
  };
  const smartAssign = () => {
    setSmartRunning(true);
    window.setTimeout(()=>{
      const waiting=leads.filter((lead)=>lead.owner==="待分配").slice(0,12);
      setLeads((items)=>items.map((lead)=>{const index=waiting.findIndex((item)=>item.id===lead.id);return index>=0?{...lead,owner:owners[index%owners.length],status:"跟进中"}:lead}));
      setSmartRunning(false);notify("智能分配完成：12 条线索已按负载与课程专长分配");
    },900);
  };
  const saveFollowUp=(form:HTMLFormElement)=>{
    if(!followTarget)return;const data=new FormData(form);
    const follow:FollowUp={id:`FU-${Date.now()}`,time:String(data.get("time")).replace("T"," ")+":00",method:String(data.get("method")) as FollowUp["method"],content:String(data.get("content")),demand:String(data.get("demand")),nextPlan:String(data.get("nextPlan")),nextDate:String(data.get("nextDate")),attachment:String(data.get("attachment")||""),operator:role==="销售顾问"?"林晓曼":role};
    setLeads((items)=>items.map((lead)=>lead.id===followTarget.id?{...lead,lastFollowAt:follow.time,overdueHours:0,followUps:[follow,...lead.followUps]}:lead));
    addLog("跟进",followTarget.name,follow.content);setFollowTarget(null);notify("跟进记录已保存，下一步计划已创建");
  };
  const histories=scopedLeads.flatMap((lead)=>lead.followUps.map((follow)=>({...follow,leadName:lead.name,phone:lead.phone})));
  return <div className="student-section-body">
    <div className="student-kpi-grid five"><Kpi icon={<UsersRound/>} label="销售线索量" value={leads.length}/><Kpi icon={<PhoneCall/>} label="今日跟进量" value={84}/><Kpi icon={<CheckCircle2/>} label="试听量" value={leads.filter((lead)=>lead.status==="已试听").length}/><Kpi icon={<Sparkles/>} label="转化率" value="38.6%"/><Kpi icon={<AlertTriangle/>} label="流失率" value="5.2%" danger/></div>
    <Card className="student-workspace-card"><div className="student-card-head"><Tabs items={views} active={view} onChange={(item)=>{setView(item);setHistoryPage(1)}}/><div><Button variant="secondary" disabled={smartRunning} onClick={smartAssign}><Sparkles size={14}/>{smartRunning?"智能计算中...":"智能分配"}</Button><Button disabled={!selected.size} onClick={()=>setAssignOpen(true)}><UserRoundCheck size={14}/>分配选中</Button></div></div>
      {view!=="跟进记录"?<div className="student-table-scroll"><table className="data-table student-lead-table"><thead><tr><th>选择</th><th>潜客</th><th>意向课程</th><th>来源</th><th>负责人</th><th>最近跟进</th><th>SLA</th><th>状态</th><th>操作</th></tr></thead><tbody>{rows.map((lead)=><tr className={lead.overdueHours>24?"student-overdue-row":""} key={lead.id}><td><input type="checkbox" checked={selected.has(lead.id)} onChange={()=>setSelected((current)=>{const next=new Set(current);next.has(lead.id)?next.delete(lead.id):next.add(lead.id);return next;})}/></td><td><strong>{lead.name}</strong><small className="table-subline">{maskPhone(lead.phone)} · {lead.id}</small></td><td>{lead.course}</td><td>{lead.channel}</td><td>{lead.owner}</td><td>{lead.lastFollowAt}</td><td><span className={lead.overdueHours>24?"text-red":""}><Clock3 size={12}/>{lead.overdueHours}h</span></td><td><Badge tone={lead.status==="已转化"?"green":lead.status==="已流失"?"red":lead.status==="待分配"?"amber":"blue"}>{lead.status}</Badge></td><td><div className="row-actions">{lead.owner==="待分配"&&<button onClick={()=>{setSelected(new Set([lead.id]));setAssignOpen(true)}}>分配</button>}<button onClick={()=>setFollowTarget(lead)}>跟进</button></div></td></tr>)}</tbody></table>{!rows.length&&<EmptyState title="当前视图无数据" detail="调整视图或等待新的线索进入。"/>}</div>:<div className="student-table-scroll"><table className="data-table"><thead><tr><th>潜客</th><th>沟通时间</th><th>方式</th><th>沟通内容</th><th>需求</th><th>下一步计划</th><th>操作人</th></tr></thead><tbody>{histories.slice((historyPage-1)*15,historyPage*15).map((item)=><tr key={item.id}><td><strong>{item.leadName}</strong><small className="table-subline">{maskPhone(item.phone)}</small></td><td>{item.time}</td><td>{item.method}</td><td>{item.content}</td><td>{item.demand}</td><td>{item.nextPlan} · {item.nextDate}</td><td>{item.operator}</td></tr>)}</tbody></table></div>}
      <div className="student-pagination"><span>共 {view==="跟进记录"?histories.length:visible.length} 条</span><div><button disabled={historyPage===1} onClick={()=>setHistoryPage(historyPage-1)}>上一页</button><button className="active">{historyPage}</button><button disabled={historyPage*15>=(view==="跟进记录"?histories.length:visible.length)} onClick={()=>setHistoryPage(historyPage+1)}>下一页</button></div></div>
    </Card>
    <Modal open={assignOpen} onClose={()=>setAssignOpen(false)} title="线索分配"><p className="modal-intro">已选择 {selected.size} 条线索。设置销售顾问与首次跟进 SLA。</p><div className="form-grid"><label className="field"><span>销售顾问</span><select id="lead-owner" className="select">{owners.map((owner)=><option key={owner}>{owner}</option>)}</select></label><label className="field"><span>首次跟进 SLA</span><select className="select"><option>10 分钟</option><option>30 分钟</option><option>2 小时</option></select></label></div><div className="form-actions"><Button variant="secondary" onClick={()=>setAssignOpen(false)}>取消</Button><Button onClick={()=>assign((document.getElementById("lead-owner") as HTMLSelectElement).value)}>确认分配</Button></div></Modal>
    <Modal open={Boolean(followTarget)} onClose={()=>setFollowTarget(null)} title={`新增跟进 · ${followTarget?.name??""}`}><form onSubmit={(event)=>{event.preventDefault();saveFollowUp(event.currentTarget)}}><div className="form-grid"><label className="field"><span>沟通时间</span><input className="input" name="time" type="datetime-local" defaultValue={nowTimestamp().slice(0,16)} required/></label><label className="field"><span>沟通方式</span><select className="select" name="method"><option>电话</option><option>微信</option><option>面谈</option><option>短信</option></select></label><label className="field form-span-2"><span>沟通内容</span><textarea name="content" required placeholder="记录本次沟通重点"/></label><label className="field form-span-2"><span>客户需求</span><textarea name="demand" required placeholder="课程、时间、预算等需求"/></label><label className="field"><span>下一步计划</span><input className="input" name="nextPlan" required/></label><label className="field"><span>下次跟进日期</span><input className="input" name="nextDate" type="date" required/></label><label className="field form-span-2"><span>附件</span><span className="student-file-input"><Paperclip size={14}/><input name="attachment" type="file"/></span></label></div><div className="form-actions"><Button type="button" variant="secondary" onClick={()=>setFollowTarget(null)}>取消</Button><Button type="submit">保存跟进</Button></div></form></Modal>
  </div>;
}
function Kpi({icon,label,value,danger=false}:{icon:React.ReactNode;label:string;value:string|number;danger?:boolean}){return <Card className="student-kpi"><span className={danger?"tone-red":"tone-blue"}>{icon}</span><div><small>{label}</small><strong>{typeof value==="number"?value.toLocaleString("zh-CN"):value}</strong><p>较上期保持稳定</p></div></Card>}
