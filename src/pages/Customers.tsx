import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Download, Search, Settings2, UserPlus } from "lucide-react";
import type { OutletContext } from "../components/AppShell";
import { Avatar, Badge, Button, Card, Drawer, GrowthSignal, Modal, PageHeader, Tabs } from "../components/ui";

const customers=[
  {name:"星瀚科技",owner:"陈思远",grade:"A",tags:["重点客户","SaaS"],follow:"今天 10:24",amount:"¥ 328,000",status:"报价中"},
  {name:"明途教育",owner:"赵晨",grade:"A",tags:["教育培训","高意向"],follow:"昨天 16:40",amount:"¥ 186,000",status:"需求确认"},
  {name:"启元智造",owner:"林晓曼",grade:"B",tags:["制造业"],follow:"3 天前",amount:"¥ 95,000",status:"初步沟通"},
  {name:"云杉咨询",owner:"吴欣",grade:"B",tags:["老客户","转介绍"],follow:"5 天前",amount:"¥ 72,000",status:"成交"},
  {name:"青禾餐饮",owner:"赵晨",grade:"C",tags:["连锁零售"],follow:"12 天前",amount:"¥ 38,000",status:"待跟进"},
  {name:"云帆物流",owner:"陈思远",grade:"A",tags:["物流","重点客户"],follow:"4 天前",amount:"¥ 216,000",status:"谈判中"},
];

export default function Customers(){
  const {notify}=useOutletContext<OutletContext>();
  const [query,setQuery]=useState(""); const [grade,setGrade]=useState("全部"); const [tag,setTag]=useState("全部标签"); const [scope,setScope]=useState("私海");
  const [selected,setSelected]=useState<typeof customers[number]|null>(null); const [modal,setModal]=useState(false); const [tab,setTab]=useState("客户概览");
  const filtered=useMemo(()=>customers.filter(c=>(grade==="全部"||c.grade===grade)&&(tag==="全部标签"||c.tags.includes(tag))&&c.name.includes(query)),[query,grade,tag]);
  return <div>
    <PageHeader title="客户管理" description="统一管理客户资产、互动记录与商机关系" actions={<Button onClick={()=>setModal(true)}><UserPlus size={15}/>新建客户</Button>}/>
    <GrowthSignal tone="amber" title="3 个 A 级客户需要下一步动作" detail="星瀚科技报价停滞，明途教育待确认方案，云帆物流本周预计成交。" action="生成跟进队列" onAction={()=>notify("已按风险和成交概率生成跟进队列")}/>
    <div className="toolbar"><div className="segmented">{["私海","公海"].map(x=><button key={x} className={scope===x?"active":""} onClick={()=>setScope(x)}>{x}客户</button>)}</div><label style={{position:"relative"}}><Search size={14} style={{position:"absolute",left:10,top:11,color:"#94a3b8"}}/><input className="input" style={{paddingLeft:32}} value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索客户名称"/></label><select className="select" value={grade} onChange={e=>setGrade(e.target.value)}><option>全部</option><option>A</option><option>B</option><option>C</option></select><select className="select" value={tag} onChange={e=>setTag(e.target.value)}><option>全部标签</option><option>重点客户</option><option>高意向</option></select><span className="spacer"/><Button variant="secondary" onClick={()=>notify("字段布局已保存为当前视图")}><Settings2 size={14}/>字段设置</Button><Button variant="secondary" onClick={()=>notify(`已导出 ${filtered.length} 条客户数据到 Excel`)}><Download size={14}/>导出 Excel</Button></div>
    <Card className="table-panel"><table className="data-table"><thead><tr><th>客户名称</th><th>负责人</th><th>分级</th><th>标签</th><th>最近跟进</th><th>商机金额</th><th>状态</th></tr></thead><tbody>{filtered.map(c=><tr key={c.name} onClick={()=>setSelected(c)} style={{cursor:"pointer"}}><td><span className="table-title">{c.name}</span><div className="subtle">企业客户 · {scope}</div></td><td><span style={{display:"flex",alignItems:"center",gap:8}}><Avatar name={c.owner}/>{c.owner}</span></td><td><Badge tone={c.grade==="A"?"red":c.grade==="B"?"amber":"neutral"}>{c.grade} 级</Badge></td><td>{c.tags.map(t=><Badge tone="blue" key={t}>{t}</Badge>)}</td><td>{c.follow}</td><td><strong>{c.amount}</strong></td><td><Badge tone={c.status==="成交"?"green":"neutral"}>{c.status}</Badge></td></tr>)}</tbody></table><div className="table-footer"><span>显示 {filtered.length} 条，共 126 条客户记录</span><Button variant="ghost" onClick={()=>notify("已加载下一页客户")}>下一页 →</Button></div></Card>
    <Drawer open={!!selected} onClose={()=>setSelected(null)} title={`${selected?.name} · 客户 360°`}>
      <Tabs items={["客户概览","跟进动态","商机合同"]} active={tab} onChange={setTab}/>
      {tab==="客户概览"&&<><div className="detail-grid">{[["客户等级",`${selected?.grade} 级重点客户`],["负责人",selected?.owner||""],["所属行业","企业服务 / 软件"],["企业规模","200-500 人"],["联系电话","021-6888 1024"],["来源渠道","老客户转介绍"]].map(x=><div className="detail-item" key={x[0]}><span>{x[0]}</span><strong>{x[1]}</strong></div>)}</div><h3>关键联系人</h3><div className="task-row"><Avatar name="周彤"/><div className="task-main"><strong>周彤 · 销售副总裁</strong><small>决策人 · 138 **** 4268</small></div><Badge tone="green">高影响力</Badge></div></>}
      {tab==="跟进动态"&&<div className="timeline">{["发送《增长型 CRM 解决方案》","电话沟通，确认采购预算","客户参加产品线上演示","通过渠道活动首次建档"].map((x,i)=><div className="timeline-item" key={x}>{x}<small>2026-09-{14-i*3} · {selected?.owner}</small></div>)}</div>}
      {tab==="商机合同"&&<><div className="task-row"><div className="task-main"><strong>CRM 企业版年度采购</strong><small>预计成交 2026-09-28</small></div><strong>{selected?.amount}</strong></div><div className="task-row"><div className="task-main"><strong>XM-2026-0812 服务合同</strong><small>合同审批中 · 第一笔回款待确认</small></div><Badge tone="amber">执行中</Badge></div></>}
    </Drawer>
    <Modal open={modal} onClose={()=>setModal(false)} title="新建客户"><form onSubmit={e=>{e.preventDefault();setModal(false);notify("客户创建成功，已分配给林晓曼")}}><div className="form-grid"><div className="field"><label>客户名称</label><input className="input" required placeholder="请输入企业名称"/></div><div className="field"><label>客户等级</label><select className="select"><option>A 级</option><option>B 级</option><option>C 级</option></select></div><div className="field"><label>联系人</label><input className="input" required placeholder="姓名"/></div><div className="field"><label>联系电话</label><input className="input" placeholder="手机号"/></div></div><div className="field" style={{marginTop:14}}><label>客户备注</label><textarea placeholder="记录来源、需求与关键背景"/></div><div className="form-actions"><Button type="button" variant="secondary" onClick={()=>setModal(false)}>取消</Button><Button type="submit">创建客户</Button></div></form></Modal>
  </div>;
}
