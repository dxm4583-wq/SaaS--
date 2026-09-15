import { useEffect, useState, type CSSProperties, type FormEvent } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  AlertTriangle, ArrowRight, CalendarCheck, Check, CircleDollarSign, ContactRound, Crown,
  Flame, Gem, Headphones, Medal, Phone, Settings2, Sparkles, Tablet, Trophy, Video,
} from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { OutletContext } from "../components/AppShell";
import { Badge, Button, Card, GrowthSignal, Metric, Modal, PageHeader } from "../components/ui";

const CURRENT_SALES = 864320;
const CAMPAIGN_END = new Date("2026-09-30T23:59:59+08:00").getTime();
const sales = Array.from({length: 30},(_,i)=>({day:`${i+1}日`, value: 7 + ((i*13)%17) + Math.round(i*.75)}));
const initialTasks = [
  {type:"电话",time:"09:30",title:"回访星瀚科技采购负责人",customer:"星瀚科技 · 关键决策确认",tone:"blue"},
  {type:"演示",time:"11:00",title:"远程演示企业培训方案",customer:"明途教育 · 商机 ¥128,000",tone:"violet"},
  {type:"合同",time:"14:30",title:"确认年度服务合同条款",customer:"启元智造 · 法务会签",tone:"amber"},
  {type:"回款",time:"16:00",title:"跟进第二期项目回款",customer:"云杉咨询 · 应收 ¥48,000",tone:"red"},
];
const tickerEvents = [
  "华东一组 · 王珂刚刚签约 ¥32,800",
  "CPA 项目部 · 陈思远新增回款 ¥18,600",
  "金融资格事业部 · 周睿连开 2 单",
];
const leaderboard = [
  {rank:1,name:"周睿",department:"金融资格事业部",sales:286800,orders:18,trend:"↑ 2",prize:"iPad Air"},
  {rank:2,name:"陈思远",department:"CPA 项目部",sales:258600,orders:16,trend:"—",prize:"大牌香水"},
  {rank:3,name:"赵晨",department:"华东一组",sales:231900,orders:14,trend:"↑ 1",prize:"降噪耳机"},
  {rank:4,name:"林晓曼",department:"华东一组",sales:213800,orders:13,trend:"↑ 3",prize:"冲榜中"},
  {rank:5,name:"王珂",department:"华东一组",sales:198600,orders:12,trend:"↓ 1",prize:"冲榜中"},
  {rank:6,name:"许宁",department:"企业培训事业部",sales:176500,orders:11,trend:"↑ 1",prize:"冲榜中"},
  {rank:7,name:"叶琳",department:"CFA 项目部",sales:158200,orders:9,trend:"↓ 2",prize:"冲榜中"},
  {rank:8,name:"顾远",department:"新业务中心",sales:142800,orders:8,trend:"—",prize:"冲榜中"},
];

type Targets = { basic: number; stretch: number; challenge: number };
type Countdown = { days: number; hours: number; minutes: number; seconds: number };

const currency = (value:number) => `¥${new Intl.NumberFormat("zh-CN").format(value)}`;
const compactWan = (value:number) => `¥${Number((value / 10000).toFixed(1))} 万`;
const percent = (value:number, target:number) => Number(((value / target) * 100).toFixed(1));
const countdownToCampaignEnd = ():Countdown => {
  const remaining = Math.max(0, CAMPAIGN_END - Date.now());
  return {
    days: Math.floor(remaining / 86400000),
    hours: Math.floor((remaining / 3600000) % 24),
    minutes: Math.floor((remaining / 60000) % 60),
    seconds: Math.floor((remaining / 1000) % 60),
  };
};

export default function Dashboard() {
  const {notify}=useOutletContext<OutletContext>();
  const [done,setDone]=useState<number[]>([]);
  const [quickOpen,setQuickOpen]=useState(false);
  const [goalOpen,setGoalOpen]=useState(false);
  const [leaderboardOpen,setLeaderboardOpen]=useState(false);
  const [targets,setTargets]=useState<Targets>({basic:800000,stretch:1000000,challenge:1200000});
  const [draftTargets,setDraftTargets]=useState<Targets>(targets);
  const [goalError,setGoalError]=useState("");
  const [countdown,setCountdown]=useState<Countdown>(countdownToCampaignEnd);
  const [tickerIndex,setTickerIndex]=useState(0);
  const navigate=useNavigate();

  useEffect(()=>{
    const countdownTimer=window.setInterval(()=>setCountdown(countdownToCampaignEnd()),1000);
    const tickerTimer=window.setInterval(()=>setTickerIndex(index=>(index+1)%tickerEvents.length),3600);
    return ()=>{window.clearInterval(countdownTimer);window.clearInterval(tickerTimer);};
  },[]);

  useEffect(()=>{
    if (!goalOpen && !leaderboardOpen && !quickOpen) return;
    const closeOnEscape=(event:KeyboardEvent)=>{
      if(event.key!=="Escape") return;
      setGoalOpen(false);
      setLeaderboardOpen(false);
      setQuickOpen(false);
    };
    window.addEventListener("keydown",closeOnEscape);
    return ()=>window.removeEventListener("keydown",closeOnEscape);
  },[goalOpen,leaderboardOpen,quickOpen]);

  const openGoalAdjustment=()=>{
    setDraftTargets(targets);
    setGoalError("");
    setGoalOpen(true);
  };
  const saveTargets=(event:FormEvent)=>{
    event.preventDefault();
    if (!Number.isFinite(draftTargets.basic) || !Number.isFinite(draftTargets.stretch) || !Number.isFinite(draftTargets.challenge) || draftTargets.basic <= 0) {
      setGoalError("请输入有效的正数目标金额。");
      return;
    }
    if (!(draftTargets.basic < draftTargets.stretch && draftTargets.stretch < draftTargets.challenge)) {
      setGoalError("目标金额必须满足：基础目标 < 冲刺目标 < 挑战目标。");
      return;
    }
    setTargets(draftTargets);
    setGoalOpen(false);
    notify("9 月销售目标已更新");
  };
  const goToOpportunities=()=>{
    notify("已进入商机管理，立即推进开单");
    navigate("/opportunities");
  };

  return <div>
    <PageHeader title="下午好，林晓曼" description="2026 年 9 月 15 日，星期二 · 今天有 7 项工作等待推进" actions={<><Button variant="secondary" onClick={()=>navigate("/tasks")}><CalendarCheck size={15}/>查看日程</Button><Button onClick={()=>setQuickOpen(true)}>+ 快速新建</Button></>}/>
    <GrowthSignal tone="red" title="星瀚科技进入 48 小时成交窗口" detail="报价已查看 2 次且 15 天未联系，建议今天 16:30 前触达决策人。" action="创建跟进" onAction={()=>notify("已为星瀚科技创建 16:30 跟进任务")}/>
    <div className="metrics">
      <Metric label="今日待办" value="7" trend="已完成 3 项" icon={<CalendarCheck size={18}/>} />
      <Metric label="待跟进客户" value="18" trend="较昨日 +4" icon={<ContactRound size={18}/>} tone="green"/>
      <Metric label="商机预警" value="5" trend="2 项高风险" icon={<AlertTriangle size={18}/>} tone="amber"/>
      <Metric label="本月销售额" value="¥ 86.4万" trend="同比增长 12.8%" icon={<CircleDollarSign size={18}/>} tone="violet"/>
    </div>

    <div className="dashboard-performance-grid">
      <GoalManagement targets={targets} onAdjust={openGoalAdjustment}/>
      <CampaignPanel
        countdown={countdown}
        tickerIndex={tickerIndex}
        onOpenLeaderboard={()=>setLeaderboardOpen(true)}
        onCreateOrder={goToOpportunities}
      />
    </div>

    <div className="grid-2">
      <Card>
        <div className="panel-head"><div><h2>今日任务</h2><p>{done.length}/4 已完成 · 按截止时间排序</p></div><Button variant="ghost" onClick={()=>navigate("/tasks")}>查看全部</Button></div>
        <div className="panel-body">{initialTasks.map((task,i)=><div className="task-row" key={task.title}>
          <input className="task-check" aria-label={`标记任务“${task.title}”为已完成`} type="checkbox" checked={done.includes(i)} onChange={()=>setDone(done.includes(i)?done.filter(x=>x!==i):[...done,i])}/>
          <Badge tone={task.tone as "blue"}>{task.type}</Badge><div className="task-main"><strong style={{textDecoration:done.includes(i)?"line-through":undefined}}>{task.title}</strong><small>{task.customer}</small></div><span className="task-time">{task.time}</span>
        </div>)}</div>
      </Card>
      <div className="stack">
        <Card><div className="panel-head"><div><h2>近 30 天销售走势</h2><p>累计 ¥864,320</p></div><Badge tone="green">+12.8%</Badge></div><div className="panel-body chart-wrap"><ResponsiveContainer width="100%" height="100%"><LineChart data={sales}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgb(var(--line))"/><XAxis dataKey="day" tick={{fontSize:9}} interval={5}/><YAxis tick={{fontSize:9}} width={28}/><Tooltip formatter={(v)=>[`¥${Number(v)}k`,"销售额"]}/><Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2.5} dot={false}/></LineChart></ResponsiveContainer></div></Card>
        <Card><div className="panel-head"><h2>商机漏斗</h2><span className="subtle">总计 ¥286万</span></div><div className="panel-body"><div className="funnel">{[["线索","42"],["沟通","28"],["报价","16"],["成交","9"]].map((x,i)=><div className="funnel-step" style={{opacity:1-i*.15}} key={x[0]}><strong>{x[1]}</strong><span>{x[0]}</span></div>)}</div></div></Card>
      </div>
    </div>
    <Card style={{marginTop:16}}><div className="panel-head"><div><h2>重点跟进提醒</h2><p>基于互动频率和商机阶段自动识别</p></div></div><div className="panel-body">
      {[["星瀚科技","15 天未联系","报价后沉默，高价值商机","red"],["明途教育","7 天未联系","试听方案待确认","amber"],["云帆物流","4 天未联系","决策人已阅读方案","blue"]].map((r,i)=><div className="reminder-row" key={r[0]}><AvatarBlock name={r[0]}/><div className="task-main"><strong>{r[0]} <Badge tone={r[3] as "red"}>{r[1]}</Badge></strong><small>{r[2]}</small></div><Button variant="secondary" onClick={()=>notify(`已创建 ${r[0]} 的跟进任务`)}>{i===0?<Phone size={14}/>:<Video size={14}/>}立即跟进</Button></div>)}
    </div></Card>

    <Modal open={goalOpen} onClose={()=>setGoalOpen(false)} title="调整 9 月销售目标">
      <form onSubmit={saveTargets} className="goal-adjust-form">
        <p className="modal-intro">设置个人月度阶梯目标，保存后将立即重新计算各阶段达成率。</p>
        {([
          ["basic","基础目标"],
          ["stretch","冲刺目标"],
          ["challenge","挑战目标"],
        ] as const).map(([key,label])=><div className="field" key={key}>
          <label htmlFor={`goal-${key}`}>{label}（元）</label>
          <input id={`goal-${key}`} className="input" type="number" min="10000" step="10000" required value={draftTargets[key]} onChange={event=>{setGoalError("");setDraftTargets({...draftTargets,[key]:Number(event.target.value)})}}/>
        </div>)}
        {goalError&&<div className="goal-form-error" role="alert"><AlertTriangle size={14}/>{goalError}</div>}
        <div className="form-actions"><Button type="button" variant="secondary" onClick={()=>setGoalOpen(false)}>取消</Button><Button type="submit">保存目标</Button></div>
      </form>
    </Modal>

    <Modal open={leaderboardOpen} onClose={()=>setLeaderboardOpen(false)} title="中秋开单冲刺赛 · 完整榜单">
      <div className="leaderboard-modal-copy"><span>数据更新于刚刚</span><Badge tone="red">火热进行中</Badge></div>
      <div className="table-panel leaderboard-table-region" role="region" aria-label="中秋开单冲刺赛前八名排行榜" tabIndex={0}>
        <table className="data-table campaign-table">
          <thead><tr><th>排名</th><th>销售</th><th>部门</th><th>销售额</th><th>订单</th><th>趋势</th><th>奖品 / 状态</th></tr></thead>
          <tbody>{leaderboard.map(person=><tr className={person.name==="林晓曼"?"current-user-row":""} key={person.rank}>
            <td><strong>#{person.rank}</strong></td><td><strong>{person.name}</strong>{person.name==="林晓曼"&&<small>我</small>}</td><td>{person.department}</td><td><strong>{currency(person.sales)}</strong></td><td>{person.orders} 单</td><td className={person.trend.startsWith("↑")?"rank-up":person.trend.startsWith("↓")?"rank-down":""}>{person.trend}</td><td><Badge tone={person.rank<=3?"amber":person.name==="林晓曼"?"blue":"neutral"}>{person.prize}</Badge></td>
          </tr>)}</tbody>
        </table>
      </div>
      <div className="form-actions"><Button variant="secondary" onClick={()=>setLeaderboardOpen(false)}>关闭</Button><Button onClick={goToOpportunities}>立即开单<ArrowRight size={14}/></Button></div>
    </Modal>

    <Modal open={quickOpen} onClose={()=>setQuickOpen(false)} title="快速新建">
      <div className="grid-equal">
        {[["客户","录入企业与联系人","/customers"],["商机","创建销售机会","/opportunities"],["任务","安排跟进日程","/tasks"],["合同","登记合同与回款","/contracts"]].map(item=><button className="quick-create" key={item[0]} onClick={()=>{setQuickOpen(false);navigate(item[2])}}><strong>{item[0]}</strong><small>{item[1]}</small></button>)}
      </div>
    </Modal>
  </div>;
}

function GoalManagement({targets,onAdjust}:{targets:Targets;onAdjust:()=>void}) {
  const tiers = [
    {key:"basic",label:"基础目标",target:targets.basic,state:"已达成",tone:"complete",icon:<Check size={13}/>},
    {key:"stretch",label:"冲刺目标",target:targets.stretch,state:"冲刺中",tone:"active",icon:<Flame size={13}/>},
    {key:"challenge",label:"挑战目标",target:targets.challenge,state:"待挑战",tone:"upcoming",icon:<Crown size={13}/>},
  ];
  const trackProgress=Math.min(100,(CURRENT_SALES/targets.challenge)*100);
  const stretchGap=Math.max(0,targets.stretch-CURRENT_SALES);
  return <Card className="goal-card">
    <div className="performance-head">
      <div><div className="performance-title-line"><h2>9 月目标管理</h2><Badge tone="blue">目标执行中</Badge></div><p>个人销售目标 · 第 3 周</p></div>
      <Button variant="secondary" onClick={onAdjust}><Settings2 size={14}/>调整目标</Button>
    </div>
    <div className="goal-main">
      <div className="goal-amount-block">
        <span>当前已完成</span>
        <strong>{currency(CURRENT_SALES)}</strong>
        <small>较上月同期 <b>+12.8%</b></small>
      </div>
      <div className="goal-forecast">
        <span>{stretchGap>0?`距离冲刺目标还差 ${currency(stretchGap)}`:"冲刺目标已达成"}</span>
        <strong>预计完成 ¥108 万</strong>
      </div>
    </div>
    <div className="goal-track-wrap">
      <div className="goal-track" aria-label={`挑战目标总体进度 ${trackProgress.toFixed(1)}%`} role="progressbar" aria-valuemin={0} aria-valuemax={targets.challenge} aria-valuenow={CURRENT_SALES}>
        <span className="goal-track-fill" style={{"--goal-progress":`${trackProgress}%`} as CSSProperties}/>
      </div>
      <div className="goal-tier-grid">
        {tiers.map((tier,index)=>{
          const achieved=percent(CURRENT_SALES,tier.target);
          return <article className={`goal-tier goal-tier-${tier.tone}`} key={tier.key}>
            <span className="goal-milestone">{tier.icon}</span>
            <div className="goal-tier-step" aria-hidden="true" style={{"--tier-step":`${(index+1)*8}px`} as CSSProperties}/>
            <span className="goal-tier-state">{tier.state}</span>
            <strong>{tier.label}</strong>
            <b>{compactWan(tier.target)}</b>
            <small>{achieved}%</small>
          </article>;
        })}
      </div>
    </div>
    <div className="goal-support">
      <div><span>日均开单</span><strong>¥57,621</strong></div>
      <div><span>剩余工作日</span><strong>11 天</strong></div>
      <div><span>预计达成率</span><strong>108%</strong></div>
    </div>
  </Card>;
}

function CampaignPanel({countdown,tickerIndex,onOpenLeaderboard,onCreateOrder}:{
  countdown:Countdown;
  tickerIndex:number;
  onOpenLeaderboard:()=>void;
  onCreateOrder:()=>void;
}) {
  const topThree=leaderboard.slice(0,3);
  const prizeIcons=[<Tablet size={15}/>,<Gem size={15}/>,<Headphones size={15}/>];
  const rankIcons=[<Crown size={15}/>,<Trophy size={15}/>,<Medal size={15}/>];
  return <Card className="campaign-card">
    <div className="campaign-accent"/>
    <div className="campaign-head">
      <div className="campaign-heading">
        <span className="campaign-icon"><Flame size={18}/></span>
        <div><h2>中秋开单冲刺赛</h2><p>9 月 1 日 - 9 月 30 日</p></div>
      </div>
      <span className="campaign-live"><i/>火热进行中</span>
    </div>
    <div className="campaign-countdown" role="timer" aria-label={`活动倒计时 ${countdown.days} 天 ${countdown.hours} 小时 ${countdown.minutes} 分 ${countdown.seconds} 秒`}>
      {([["天",countdown.days],["时",countdown.hours],["分",countdown.minutes],["秒",countdown.seconds]] as const).map(([label,value])=><div key={label}><strong>{String(value).padStart(2,"0")}</strong><span>{label}</span></div>)}
    </div>
    <div className="campaign-section-label"><span>TOP 3 实时排名</span><small>按销售额排序</small></div>
    <div className="campaign-ranking">
      {topThree.map((person,index)=><article className={`campaign-rank rank-${person.rank}`} key={person.rank}>
        <span className="rank-symbol" role="img" aria-label={`第 ${person.rank} 名`}>{rankIcons[index]}</span>
        <div className="rank-person"><strong>{person.name}</strong><small>{person.orders} 单</small></div>
        <div className="rank-performance">
          <div><strong>{currency(person.sales)}</strong><span className="rank-prize">{prizeIcons[index]}{person.prize}</span></div>
          <div className="rank-bar" role="progressbar" aria-label={`${person.name}相对榜首销售额`} aria-valuemin={0} aria-valuemax={leaderboard[0].sales} aria-valuenow={person.sales}><span style={{"--rank-width":`${(person.sales/leaderboard[0].sales)*100}%`} as CSSProperties}/></div>
        </div>
      </article>)}
    </div>
    <div className="current-rank-strip">
      <div className="current-rank-top"><span><b>4</b><strong>林晓曼</strong></span><strong>{currency(213800)}</strong></div>
      <div className="current-rank-progress"><span/></div>
      <div className="current-rank-copy"><span>距 TOP 3 还差 <strong>¥18,100</strong></span><b>再开 1 单，冲进前三</b></div>
    </div>
    <div className="sales-ticker" aria-live="polite">
      <span className="live-label"><i/>LIVE</span>
      <p key={tickerIndex}>{tickerEvents[tickerIndex]}</p>
    </div>
    <div className="campaign-actions"><Button onClick={onCreateOrder}>立即开单<ArrowRight size={14}/></Button><Button variant="secondary" onClick={onOpenLeaderboard}><Sparkles size={14}/>完整榜单</Button></div>
  </Card>;
}

function AvatarBlock({name}:{name:string}) { return <div className="metric-icon tone-blue"><span style={{fontSize:11,fontWeight:700}}>{name.slice(0,2)}</span></div>; }
