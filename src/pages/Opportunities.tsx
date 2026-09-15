import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Filter, Plus, SlidersHorizontal } from "lucide-react";
import type { OutletContext } from "../components/AppShell";
import { Avatar, Badge, Button, Drawer, GrowthSignal, Modal, PageHeader } from "../components/ui";

type Deal={id:number;customer:string;title:string;amount:number;probability:number;owner:string;close:string;stage:string};
const stages=["线索","初步沟通","需求确认","报价","谈判"];
const seed:Deal[]=[
  {id:1,customer:"星瀚科技",title:"CRM 企业版采购",amount:328000,probability:70,owner:"陈思远",close:"09-28",stage:"报价"},
  {id:2,customer:"明途教育",title:"招生增长解决方案",amount:186000,probability:55,owner:"赵晨",close:"10-12",stage:"需求确认"},
  {id:3,customer:"启元智造",title:"销售数字化一期",amount:95000,probability:30,owner:"林晓曼",close:"10-30",stage:"初步沟通"},
  {id:4,customer:"云帆物流",title:"客户管理平台",amount:216000,probability:85,owner:"陈思远",close:"09-22",stage:"谈判"},
  {id:5,customer:"青禾餐饮",title:"连锁门店私域运营",amount:68000,probability:15,owner:"赵晨",close:"11-15",stage:"线索"},
  {id:6,customer:"森屿家居",title:"渠道商机协同",amount:142000,probability:45,owner:"吴欣",close:"10-18",stage:"需求确认"},
  {id:7,customer:"北辰医疗",title:"客户成功管理",amount:260000,probability:65,owner:"林晓曼",close:"10-08",stage:"报价"},
];
const allStages=[...stages,"成交/失败"];

export default function Opportunities(){
  const {notify}=useOutletContext<OutletContext>(); const [deals,setDeals]=useState(seed); const [filters,setFilters]=useState(false); const [createOpen,setCreateOpen]=useState(false); const [dragged,setDragged]=useState<number|null>(null);
  const move=(stage:string)=>{if(dragged===null)return;setDeals(deals.map(d=>d.id===dragged?{...d,stage}:d));notify(`商机已移动至「${stage}」阶段`);setDragged(null)};
  return <div>
    <PageHeader title="商机管理" description="按销售阶段推进机会，拖动卡片即可更新进度" actions={<><Button variant="secondary" onClick={()=>setFilters(true)}><Filter size={15}/>筛选</Button><Button onClick={()=>setCreateOpen(true)}><Plus size={15}/>新建商机</Button></>}/>
    <GrowthSignal tone="amber" title="报价阶段有 2 个商机停留超过 7 天" detail="合计 ¥58.8 万，推进后预计本月加权收入增加 ¥39.6 万。" action="查看高风险" onAction={()=>notify("已聚焦报价阶段高风险商机")}/>
    <div className="stage-strip">{allStages.map((stage,i)=>{const ds=deals.filter(d=>d.stage===stage);return <div className="stage-item" key={stage}><span className="eyebrow">{i+1}. {stage}</span><strong>{ds.length} 个</strong><small>¥ {Math.round(ds.reduce((s,d)=>s+d.amount,0)/10000)} 万</small></div>})}</div>
    <div className="kanban">{allStages.map(stage=><section className="kanban-col" key={stage} onDragOver={e=>e.preventDefault()} onDrop={()=>move(stage)}><div className="kanban-col-head"><span>{stage}</span><span>{deals.filter(d=>d.stage===stage).length}</span></div>{deals.filter(d=>d.stage===stage).map(d=><article className="opportunity-card" draggable onDragStart={()=>setDragged(d.id)} key={d.id}><strong>{d.customer}</strong><span className="subtle">{d.title}</span><div className="amount">¥ {d.amount.toLocaleString()}</div><div className="progress"><span style={{width:`${d.probability}%`}}/></div><div className="card-meta" style={{marginTop:10}}><span style={{display:"flex",alignItems:"center",gap:5}}><Avatar name={d.owner}/>{d.owner}</span><span>{d.probability}% · {d.close}</span></div></article>)}</section>)}</div>
    <Drawer open={filters} onClose={()=>setFilters(false)} title="筛选商机">
      <div className="stack"><div className="field"><label>商机金额范围</label><div style={{display:"flex",gap:8}}><input className="input" placeholder="最低金额"/><input className="input" placeholder="最高金额"/></div></div><div className="field"><label>负责人</label><select className="select"><option>全部销售</option><option>陈思远</option><option>林晓曼</option><option>赵晨</option></select></div><div className="field"><label>来源渠道</label><select className="select"><option>全部来源</option><option>客户转介绍</option><option>线上活动</option><option>企微私域</option></select></div><div className="field"><label>预计成交月份</label><input className="input" type="month" defaultValue="2026-09"/></div><Button onClick={()=>{setFilters(false);notify("商机筛选条件已应用")}}><SlidersHorizontal size={14}/>应用筛选</Button></div>
    </Drawer>
    <Modal open={createOpen} onClose={()=>setCreateOpen(false)} title="新建商机"><form onSubmit={e=>{e.preventDefault();setDeals([...deals,{id:Date.now(),customer:"新建客户",title:"增长解决方案",amount:120000,probability:20,owner:"林晓曼",close:"10-30",stage:"线索"}]);setCreateOpen(false);notify("商机已创建并进入线索阶段")}}><div className="form-grid"><div className="field"><label>客户名称</label><input className="input" required placeholder="选择或输入客户"/></div><div className="field"><label>商机金额</label><input className="input" required type="number" placeholder="120000"/></div><div className="field"><label>负责人</label><select className="select"><option>林晓曼</option><option>陈思远</option><option>赵晨</option></select></div><div className="field"><label>预计成交日期</label><input className="input" type="date" defaultValue="2026-10-30"/></div></div><div className="form-actions"><Button type="button" variant="secondary" onClick={()=>setCreateOpen(false)}>取消</Button><Button type="submit">创建商机</Button></div></form></Modal>
  </div>;
}
