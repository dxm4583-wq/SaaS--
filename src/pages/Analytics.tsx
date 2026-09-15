import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Download, TrendingUp } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { OutletContext } from "../components/AppShell";
import { Button, Card, GrowthSignal, PageHeader } from "../components/ui";

const trend=[["4月",42],["5月",51],["6月",49],["7月",68],["8月",73],["9月",86]].map(x=>({month:x[0],value:x[1]}));
const source=[{name:"客户转介绍",value:36},{name:"企微私域",value:28},{name:"线上活动",value:22},{name:"自然流量",value:14}];
const departments=[["华东一组",92],["华东二组",78],["华南组",68],["教育事业部",86]].map(x=>({name:x[0],value:x[1]}));
const colors=["#2563eb","#10b981","#f59e0b","#8b5cf6"];

export default function Analytics(){
  const {notify}=useOutletContext<OutletContext>(); const [period,setPeriod]=useState("月");
  return <div><PageHeader title="数据中心" description="关键增长指标与团队经营表现" actions={<><Button variant="secondary" onClick={()=>notify("CSV 报表已生成")}><Download size={14}/>CSV</Button><Button onClick={()=>notify("Excel 报表已导出")}><Download size={14}/>导出 Excel</Button></>}/>
    <GrowthSignal tone="green" title="客户转介绍贡献最高质量增量" detail="占新增客户 36%，转化率较其他渠道高 8.4 个百分点。" action="查看来源明细" onAction={()=>notify("已聚焦客户转介绍来源数据")}/>
    <div className="toolbar"><div className="segmented">{["日","周","月"].map(x=><button className={period===x?"active":""} onClick={()=>setPeriod(x)} key={x}>{x}</button>)}</div><select className="select" onChange={e=>notify(`已筛选部门：${e.target.value}`)}><option>全部部门</option><option>华东一组</option></select><select className="select" onChange={e=>notify(`已筛选销售：${e.target.value}`)}><option>全部销售</option><option>林晓曼</option></select><select className="select" onChange={e=>notify(`已筛选来源：${e.target.value}`)}><option>全部来源</option><option>客户转介绍</option></select><select className="select" onChange={e=>notify(`已筛选行业：${e.target.value}`)}><option>全部行业</option><option>教育培训</option></select><span className="spacer"/><span className="subtle">统计周期：2026-09-01 至 09-14</span></div>
    <div className="metrics six">{[["销售额","¥86.4万","+12.8%"],["新增客户","126","+8.2%"],["商机金额","¥286万","+18.6%"],["转化率","24.8%","+3.1%"],["回款率","73.8%","+5.4%"],["人均产出","¥12.3万","+9.7%"]].map((m,i)=><Card className="metric-card" key={m[0]}><div className={`metric-icon tone-${i===3?"green":"blue"}`}><TrendingUp size={17}/></div><div><span className="eyebrow">{m[0]}</span><strong style={{fontSize:19}}>{m[1]}</strong><small>{m[2]}</small></div></Card>)}</div>
    <div className="grid-equal">
      <Card><div className="panel-head"><div><h2>销售趋势</h2><p>近 6 个月回款口径</p></div></div><div className="panel-body chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={trend}><defs><linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2563eb" stopOpacity=".25"/><stop offset="1" stopColor="#2563eb" stopOpacity="0"/></linearGradient></defs><CartesianGrid vertical={false} stroke="rgb(var(--line))"/><XAxis dataKey="month" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip formatter={v=>[`¥${v}万`,"销售额"]}/><Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} fill="url(#salesFill)"/></AreaChart></ResponsiveContainer></div></Card>
      <Card><div className="panel-head"><div><h2>客户来源</h2><p>新增客户渠道分布</p></div></div><div className="panel-body chart-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={source} dataKey="value" nameKey="name" innerRadius={55} outerRadius={82} paddingAngle={2}>{source.map((_,i)=><Cell fill={colors[i]} key={i}/>)}</Pie><Tooltip formatter={v=>[`${v}%`,"占比"]}/></PieChart></ResponsiveContainer></div></Card>
      <Card><div className="panel-head"><h2>部门业绩完成率</h2></div><div className="panel-body chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={departments} layout="vertical"><CartesianGrid horizontal={false} stroke="rgb(var(--line))"/><XAxis type="number" tick={{fontSize:9}}/><YAxis type="category" dataKey="name" tick={{fontSize:10}} width={72}/><Tooltip formatter={v=>[`${v}%`,"完成率"]}/><Bar dataKey="value" fill="#2563eb" radius={[0,3,3,0]}/></BarChart></ResponsiveContainer></div></Card>
      <Card><div className="panel-head"><h2>销售业绩排行</h2><span className="subtle">本月</span></div><div className="panel-body">{[["林晓曼","¥ 186,400",100],["陈思远","¥ 158,200",85],["赵晨","¥ 132,800",71],["吴欣","¥ 98,600",53],["周彤","¥ 82,300",44]].map((r,i)=><div className="task-row" key={r[0]}><strong style={{width:20,color:i<3?"#2563eb":undefined}}>0{i+1}</strong><div className="task-main"><strong>{r[0]}</strong><div className="progress" style={{marginTop:7}}><span style={{width:`${r[2]}%`}}/></div></div><strong>{r[1]}</strong></div>)}</div></Card>
    </div>
  </div>;
}
