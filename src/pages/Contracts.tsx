import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { AlertCircle, Banknote, FileCheck2, Plus } from "lucide-react";
import type { OutletContext } from "../components/AppShell";
import { Badge, Button, Card, Drawer, GrowthSignal, Metric, Modal, PageHeader, Tabs } from "../components/ui";

const contracts=[
  ["XM-2026-0812","星瀚科技","¥ 328,000","2026-08-12","执行中"],
  ["XM-2026-0728","云杉咨询","¥ 156,000","2026-07-28","执行中"],
  ["XM-2026-0615","明途教育","¥ 186,000","2026-06-15","已完成"],
  ["XM-2026-0522","森屿家居","¥ 98,000","2026-05-22","逾期"],
  ["XM-2026-0418","启元智造","¥ 210,000","2026-04-18","已完成"],
];
const collections=[
  ["星瀚科技 · 第 1 期","2026-09-20","¥ 98,400","¥ 0","待回款"],
  ["云杉咨询 · 第 2 期","2026-09-10","¥ 48,000","¥ 0","已逾期"],
  ["明途教育 · 尾款","2026-09-05","¥ 55,800","¥ 55,800","已回款"],
  ["森屿家居 · 第 2 期","2026-08-28","¥ 29,400","¥ 0","已逾期"],
];

export default function Contracts(){
  const {notify}=useOutletContext<OutletContext>(); const [tab,setTab]=useState("合同列表"); const [createOpen,setCreateOpen]=useState(false); const [selected,setSelected]=useState<string[]|null>(null);
  return <div><PageHeader title="合同 & 回款" description="跟踪合同履约、应收计划与逾期风险" actions={<Button onClick={()=>setCreateOpen(true)}><Plus size={15}/>新建合同</Button>}/>
    <GrowthSignal tone="red" title="¥7.74 万逾期回款影响本月现金达成" detail="云杉咨询与森屿家居均已超过计划日，建议今天完成财务凭证核对。" action="查看回款计划" onAction={()=>setTab("回款计划")}/>
    <div className="metrics three"><Metric label="本月应收" value="¥ 42.8万" trend="共 8 笔计划" icon={<FileCheck2 size={18}/>}/><Metric label="已回款" value="¥ 31.6万" trend="回款率 73.8%" icon={<Banknote size={18}/>} tone="green"/><Metric label="逾期未回" value="¥ 7.74万" trend="2 笔需要处理" icon={<AlertCircle size={18}/>} tone="red"/></div>
    <Card className="table-panel"><Tabs items={["合同列表","回款计划"]} active={tab} onChange={setTab}/>
      {tab==="合同列表"?<table className="data-table"><thead><tr><th>合同编号</th><th>客户</th><th>合同金额</th><th>签约日期</th><th>合同状态</th><th>操作</th></tr></thead><tbody>{contracts.map(r=><tr key={r[0]}>{r.map((c,i)=><td key={c}>{i===4?<Badge tone={c==="已完成"?"green":c==="逾期"?"red":"blue"}>{c}</Badge>:i===0?<strong>{c}</strong>:c}</td>)}<td><button className="link" onClick={()=>setSelected(r)}>查看详情</button></td></tr>)}</tbody></table>
      :<table className="data-table"><thead><tr><th>回款计划</th><th>计划日期</th><th>应收金额</th><th>已收金额</th><th>状态</th><th>操作</th></tr></thead><tbody>{collections.map(r=><tr key={r[0]} style={{background:r[4]==="已逾期"?"rgba(254,226,226,.35)":undefined}}>{r.map((c,i)=><td key={c}>{i===4?<Badge tone={c==="已回款"?"green":c==="已逾期"?"red":"amber"}>{c}</Badge>:i===0?<strong>{c}</strong>:c}</td>)}<td><button className="link" onClick={()=>notify(r[4]==="已回款"?`${r[0]} 回款凭证已打开`:`${r[0]} 已登记回款并进入财务复核`)}>{r[4]==="已回款"?"查看凭证":"登记回款"}</button></td></tr>)}</tbody></table>}
      <div className="table-footer"><span>{tab==="合同列表"?"共 26 份合同，5 份显示中":"本月共 8 笔回款计划，4 笔显示中"}</span><Button variant="ghost" onClick={()=>notify("已加载更多记录")}>加载更多</Button></div>
    </Card>
    <Modal open={createOpen} onClose={()=>setCreateOpen(false)} title="新建合同"><form onSubmit={e=>{e.preventDefault();setCreateOpen(false);notify("合同草稿已创建，等待法务审核")}}><div className="form-grid"><div className="field"><label>客户</label><select className="select"><option>星瀚科技</option><option>明途教育</option></select></div><div className="field"><label>合同金额</label><input className="input" type="number" required placeholder="请输入金额"/></div><div className="field"><label>签约日期</label><input className="input" type="date" defaultValue="2026-09-14"/></div><div className="field"><label>回款方式</label><select className="select"><option>分两期</option><option>一次性回款</option></select></div></div><div className="form-actions"><Button type="button" variant="secondary" onClick={()=>setCreateOpen(false)}>取消</Button><Button type="submit">保存合同</Button></div></form></Modal>
    <Drawer open={!!selected} onClose={()=>setSelected(null)} title={`${selected?.[0] || ""} · 合同详情`}><div className="detail-grid">{[["客户",selected?.[1]||""],["合同金额",selected?.[2]||""],["签约日期",selected?.[3]||""],["履约状态",selected?.[4]||""],["负责人","林晓曼"],["下一回款日","2026-09-20"]].map(x=><div className="detail-item" key={x[0]}><span>{x[0]}</span><strong>{x[1]}</strong></div>)}</div><h3>审批与履约记录</h3><div className="timeline">{["合同完成电子签署","财务确认首期到账","法务完成条款审核"].map((x,i)=><div className="timeline-item" key={x}>{x}<small>2026-09-{12-i*2}</small></div>)}</div></Drawer>
  </div>;
}
