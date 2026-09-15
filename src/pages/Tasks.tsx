import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { AlertOctagon, Plus } from "lucide-react";
import type { OutletContext } from "../components/AppShell";
import { Badge, Button, Card, GrowthSignal, Modal, PageHeader, Tabs } from "../components/ui";

const teamTasks=[
  ["联系星瀚科技确认报价","星瀚科技","今天 17:00","高","进行中"],
  ["准备明途教育演示材料","明途教育","明天 10:00","中","待开始"],
  ["跟进云杉咨询回款凭证","云杉咨询","09-16 14:00","高","待开始"],
  ["整理八月销售复盘","内部任务","09-18 18:00","低","进行中"],
  ["邀约启元智造决策人","启元智造","09-20 11:30","中","待开始"],
];

export default function Tasks(){
  const {notify}=useOutletContext<OutletContext>(); const [tab,setTab]=useState("我的任务"); const [overdue,setOverdue]=useState(false); const [createOpen,setCreateOpen]=useState(false); const [week,setWeek]=useState(0); const [tasks,setTasks]=useState(teamTasks); const [done,setDone]=useState<number[]>([]);
  return <div>
    <PageHeader title="任务中心" description="在日程和清单之间统一安排销售动作" actions={<Button onClick={()=>setCreateOpen(true)}><Plus size={15}/>新建任务</Button>}/>
    <GrowthSignal tone="red" title="上午任务完成率低于团队基线 18%" detail="3 项逾期任务均与高价值客户相关，建议先处理星瀚科技报价确认。" action="智能排程" onAction={()=>notify("已将逾期任务置顶并重新安排今日时段")}/>
    <div className="overdue-banner"><AlertOctagon size={17}/><strong>有 3 项任务已逾期</strong><span>最早逾期 2 天，请尽快处理</span><span className="spacer"/><Button variant="danger" onClick={()=>setOverdue(!overdue)}>{overdue?"查看全部":"立即查看"}</Button></div>
    <div className="grid-2">
      <Card className="calendar"><div className="panel-head"><div><h2>{week===0?"本周":week<0?"上周":"下周"}日程</h2><p>{week===0?"9 月 14 日 - 9 月 18 日":week<0?"9 月 7 日 - 9 月 11 日":"9 月 21 日 - 9 月 25 日"}</p></div><div><Button variant="ghost" aria-label="上一周" onClick={()=>setWeek(-1)}>‹</Button><Button variant="ghost" onClick={()=>setWeek(0)}>本周</Button><Button variant="ghost" aria-label="下一周" onClick={()=>setWeek(1)}>›</Button></div></div><div className="calendar-grid">
        <div className="calendar-cell header"/>{["周一 14","周二 15","周三 16","周四 17","周五 18"].map(x=><div className="calendar-cell header" key={x}>{x}</div>)}
        {["09:00","11:00","14:00","16:00"].flatMap((time,row)=>[<div className="calendar-cell time" key={time}>{time}</div>,...Array.from({length:5},(_,col)=><div className="calendar-cell" key={`${row}-${col}`}>{(row+col)%3===0&&<div className={`event ${row===2?"green":row===3?"amber":""}`}>{["客户回访","方案演示","合同会签","团队周会"][(row+col)%4]}<br/>{time}</div>}</div>)])}
      </div></Card>
      <Card><Tabs items={["我的任务","团队任务"]} active={tab} onChange={setTab}/><div className="panel-body">{tasks.filter((_,i)=>tab==="团队任务"||i<4).filter((_,i)=>!overdue||i<3).map((t,i)=><div className="task-row" key={t[0]}><input type="checkbox" className="task-check" checked={done.includes(i)} onChange={()=>setDone(done.includes(i)?done.filter(x=>x!==i):[...done,i])}/><div className="task-main"><strong style={{textDecoration:done.includes(i)?"line-through":undefined}}>{t[0]}</strong><small>{t[1]} · {t[2]}</small></div><Badge tone={t[3]==="高"?"red":t[3]==="中"?"amber":"neutral"}>{t[3]}优先级</Badge><Badge tone={done.includes(i)?"green":i===0?"blue":"neutral"}>{done.includes(i)?"已完成":t[4]}</Badge></div>)}</div></Card>
    </div>
    <Modal open={createOpen} onClose={()=>setCreateOpen(false)} title="新建任务"><form onSubmit={e=>{e.preventDefault();setTasks([["跟进新客户需求","待关联客户","今天 18:00","中","待开始"],...tasks]);setCreateOpen(false);notify("任务已加入今日日程")}}><div className="field"><label>任务标题</label><input className="input" required placeholder="例如：确认客户采购计划"/></div><div className="form-grid" style={{marginTop:14}}><div className="field"><label>关联客户</label><select className="select"><option>星瀚科技</option><option>明途教育</option><option>云帆物流</option></select></div><div className="field"><label>截止时间</label><input className="input" type="datetime-local" defaultValue="2026-09-14T18:00"/></div></div><div className="form-actions"><Button type="button" variant="secondary" onClick={()=>setCreateOpen(false)}>取消</Button><Button type="submit">创建任务</Button></div></form></Modal>
  </div>;
}
