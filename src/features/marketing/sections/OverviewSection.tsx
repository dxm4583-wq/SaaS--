import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, CircleDollarSign, Coins, MousePointerClick, Plus, Target, TrendingUp, UsersRound } from "lucide-react";
import { Badge, Button, Card } from "../../../components/ui";
import { examNodes, funnelData, trendData } from "../mockData";
import { useMarketing } from "../MarketingContext";
import { MarketingKpi, SectionCard } from "../components/MarketingShared";

const templates=[["早鸟价","考试报名前 30 天锁定意向"],["新课首发","新品发布与首批口碑沉淀"],["多科联报","提升客单与跨科转化"],["不过退费","高意向人群保障型转化"],["图书+课程","图书用户向课程迁移"],["考后再战","按成绩分层精准召回"]];

export default function OverviewSection(){
  const {campaigns,channels,notify}=useMarketing();
  const navigate=useNavigate();
  const [period,setPeriod]=useState("近 30 天");
  const [selectedNode,setSelectedNode]=useState(2);
  const active=campaigns.filter(item=>item.status==="进行中");
  return <div className="marketing-section">
    <div className="marketing-toolbar"><div className="segmented">{["今日","近 7 天","近 30 天","本季度"].map(item=><button className={period===item?"active":""} onClick={()=>setPeriod(item)} key={item}>{item}</button>)}</div><span>归因口径：首次触点 + 成交贡献</span><span className="spacer"/><Button variant="secondary" onClick={()=>notify("营销总览数据已刷新")}>刷新数据</Button><Button onClick={()=>navigate("/marketing/campaigns")}><Plus size={14}/>创建活动</Button></div>
    <div className="marketing-kpi-grid six">
      <MarketingKpi label="营销投入" value="¥ 1,284,600" trend="+8.6%" detail=" 较上期" icon={Coins}/>
      <MarketingKpi label="带来线索" value="28,640" trend="+16.2%" detail=" 同比" icon={UsersRound} tone="green"/>
      <MarketingKpi label="转化学员" value="3,186" trend="+12.8%" detail=" 环比" icon={Target}/>
      <MarketingKpi label="营销收入" value="¥ 6,842,000" trend="+19.4%" detail=" 同比" icon={CircleDollarSign} tone="green"/>
      <MarketingKpi label="整体 ROI" value="4.33" trend="+0.42" detail=" 较上期" icon={TrendingUp}/>
      <MarketingKpi label="获客成本" value="¥ 403" trend="-6.8%" detail=" 持续改善" icon={MousePointerClick} tone="amber"/>
    </div>
    <SectionCard title="考试营销作战日历" detail="2026 年关键考季节点 · 推荐动作与活动实时联动" actions={<><Badge tone="blue">当前：中级查分窗口</Badge><Button variant="secondary" onClick={()=>notify("已订阅全部考试节点提醒")}>订阅节点</Button></>}>
      <div className="exam-command">
        <div className="exam-timeline">{examNodes.map((node,index)=><button className={`${selectedNode===index?"selected":""} ${node.state==="当前节点"?"current":""}`} onClick={()=>setSelectedNode(index)} key={node.name}><span>{node.date}</span><i/><strong>{node.name}</strong><small>{node.state}</small></button>)}</div>
        <div className="exam-action-panel"><span className="tone-blue"><Target size={18}/></span><div><small>推荐动作</small><strong>{examNodes[selectedNode].action}</strong><p>关联活动：{examNodes[selectedNode].campaign} · 建议组合人群分层、权益与消息触达</p></div><Button onClick={()=>{notify(`已用「${examNodes[selectedNode].name}」模板创建活动草稿`);navigate("/marketing/campaigns")}}><Plus size={14}/>一键创建活动</Button></div>
      </div>
    </SectionCard>
    <div className="marketing-dashboard-grid">
      <SectionCard title="投入与收入趋势" detail={`${period} · 单位：万元`} actions={<span className="marketing-live">实时</span>}><div className="marketing-chart"><ResponsiveContainer><AreaChart data={trendData}><defs><linearGradient id="marketingRevenue" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2563eb" stopOpacity=".25"/><stop offset="1" stopColor="#2563eb" stopOpacity="0"/></linearGradient></defs><CartesianGrid vertical={false} stroke="rgb(var(--line))"/><XAxis dataKey="date" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip/><Area type="monotone" dataKey="revenue" name="营销收入" stroke="#2563eb" fill="url(#marketingRevenue)" strokeWidth={2}/><Area type="monotone" dataKey="spend" name="营销投入" stroke="#f59e0b" fill="transparent" strokeWidth={2}/></AreaChart></ResponsiveContainer></div></SectionCard>
      <SectionCard title="渠道 ROI 排名" detail="综合归因 · 实时预算消耗"><div className="channel-rank">{channels.slice().sort((a,b)=>b.roi-a.roi).map((item,index)=><div key={item.id}><b>{index+1}</b><span><strong>{item.name}</strong><small>{item.leads.toLocaleString()} 条线索 · LTV ¥{item.ltv.toLocaleString()}</small></span><em>{item.roi.toFixed(1)}</em><div className="progress"><span style={{width:`${Math.min(item.roi/7*100,100)}%`}}/></div></div>)}</div></SectionCard>
      <SectionCard title="全链路转化概览" detail="从曝光到续费的关键节点"><div className="marketing-chart"><ResponsiveContainer><BarChart data={funnelData.slice(0,6)} layout="vertical"><CartesianGrid horizontal={false} stroke="rgb(var(--line))"/><XAxis type="number" hide/><YAxis dataKey="name" type="category" width={38} tick={{fontSize:10}}/><Tooltip/><Bar dataKey="value" fill="#2563eb" radius={[0,3,3,0]}/></BarChart></ResponsiveContainer></div></SectionCard>
      <SectionCard title="活动健康度" detail={`${active.length} 个活动正在运行`}><div className="marketing-chart compact"><ResponsiveContainer><PieChart><Pie data={active.map(item=>({name:item.name,value:item.roi}))} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78}>{active.map((item,index)=><Cell key={item.id} fill={["#2563eb","#10b981","#8b5cf6"][index%3]}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="health-center"><strong>92</strong><small>健康分</small></div></div><div className="health-list">{active.map(item=><span key={item.id}><i className={item.roi>4?"green":"amber"}/>{item.name}<b>ROI {item.roi}</b></span>)}</div></SectionCard>
    </div>
    <div className="marketing-bottom-grid">
      <SectionCard title="会计特色快捷模板" detail="按考试场景快速复制活动框架"><div className="template-strip">{templates.map(([name,detail],index)=><button onClick={()=>{notify(`已复制「${name}」模板`);navigate("/marketing/campaigns")}} key={name}><span>{String(index+1).padStart(2,"0")}</span><strong>{name}</strong><small>{detail}</small></button>)}</div></SectionCard>
      <Card className="marketing-risk-card"><div><AlertTriangle size={17}/><strong>异常预警</strong><Badge tone="red">4</Badge></div>{["高校讲座渠道预算已超支 4%","7 天未学唤醒流程异常率 0.06%","CPA 联报券退券率环比上升","小红书渠道留资成本高于阈值"].map((item,index)=><button onClick={()=>navigate(index===1?"/marketing/automation":index===2?"/marketing/coupons":"/marketing/channels")} key={item}><span>{item}</span><small>查看处理</small></button>)}</Card>
    </div>
  </div>;
}
