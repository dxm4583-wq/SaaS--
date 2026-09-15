import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  AlertCircle, ArrowUpRight, Bot, CalendarDays, CheckCircle2, CircleDollarSign, Clock3,
  FileText, MessageSquareText, RefreshCw, Sparkles, Target, TrendingUp, UsersRound,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { OutletContext } from "../components/AppShell";
import { Badge, Button, Card, Modal, Tabs } from "../components/ui";

const dates = [
  { day: "今天", date: "09/14", count: 38 },
  { day: "周六", date: "09/13", count: 21 },
  { day: "周五", date: "09/12", count: 46 },
  { day: "周四", date: "09/11", count: 34 },
  { day: "周三", date: "09/10", count: 29 },
];
const operations = [
  ["09:12","客户跟进","完成星瀚科技第 4 次需求确认","客户"],
  ["10:26","商机更新","将明途教育商机推进至方案确认","商机"],
  ["11:40","合同回款","确认云帆物流首期回款 ¥86,000","合同"],
  ["14:15","任务完成","提交华东区域重点客户复盘","任务"],
  ["16:08","工单处理","解决 TK-20260914-013 数据导入问题","工单"],
];
const recommendations = [
  ["高","今日 16:30 联系星瀚科技决策人","商机已 15 天未跟进，报价查看行为在上升"],
  ["中","补充明途教育实施排期","客户进入方案确认阶段，仍缺少上线里程碑"],
  ["中","确认北辰零售逾期回款计划","¥42,000 已逾期 5 天，建议同步财务负责人"],
];
const teamData = [
  { name: "林晓曼", operation: 38, follow: 9 },
  { name: "赵晨", operation: 31, follow: 12 },
  { name: "陈思远", operation: 27, follow: 8 },
  { name: "周宁", operation: 22, follow: 6 },
  { name: "王岚", operation: 18, follow: 5 },
];
const weekData = [
  { day: "周一", activity: 126, follow: 38 },
  { day: "周二", activity: 148, follow: 42 },
  { day: "周三", activity: 139, follow: 36 },
  { day: "周四", activity: 166, follow: 51 },
  { day: "周五", activity: 184, follow: 57 },
];
const REPORT_NOTE_KEY = "growth-ai-report-note-v1";
const REPORT_TASKS_KEY = "growth-ai-report-tasks-v1";
const REPORT_COMMENTS_KEY = "growth-ai-report-comments-v1";

function loadStored<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) ?? "null") as T ?? fallback;
  } catch {
    return fallback;
  }
}

function downloadWeeklyPdf() {
  const stream = [
    "BT",
    "/F1 18 Tf",
    "72 760 Td",
    "(Xiaoman Finance - Weekly Growth Report) Tj",
    "/F1 11 Tf",
    "0 -28 Td",
    "(2026.09.08 - 2026.09.14) Tj",
    "0 -28 Td",
    "(Opportunity growth: CNY 1.28M, weekly change +18.6%) Tj",
    "0 -18 Td",
    "(Confirmed payment: CNY 436K, target completion 92%) Tj",
    "0 -18 Td",
    "(Priority: overdue payments and education lead conversion.) Tj",
    "ET",
  ].join("\n");
  const objects = [
    "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n",
    "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n",
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n",
    `4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
    "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object) => {
    offsets.push(pdf.length);
    pdf += object;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n \n`).join("");
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "晓曼财经-第37周业务周报.pdf";
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function DailyReports({ embedded = false }: { embedded?: boolean }) {
  const { notify } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const [tab, setTab] = useState("我的日报");
  const [date, setDate] = useState(dates[0]);
  const [note, setNote] = useState(() => loadStored(REPORT_NOTE_KEY, ""));
  const [noteSaved, setNoteSaved] = useState(() => Boolean(localStorage.getItem(REPORT_NOTE_KEY)));
  const [createdTasks, setCreatedTasks] = useState<string[]>(() => loadStored(REPORT_TASKS_KEY, []));
  const [comments, setComments] = useState<Record<string, string>>(() => loadStored(REPORT_COMMENTS_KEY, {}));
  const [commenting, setCommenting] = useState("");
  const [comment, setComment] = useState("");
  const [preview, setPreview] = useState(false);
  const [generatedAt, setGeneratedAt] = useState("17:42");
  const createTask = (title: string) => {
    const next = [...new Set([...createdTasks, title])];
    setCreatedTasks(next);
    localStorage.setItem(REPORT_TASKS_KEY, JSON.stringify(next));
    notify(`已创建任务：${title}`);
  };
  const saveComment = () => {
    if (!comment.trim()) {
      notify("请输入主管点评");
      return;
    }
    const next = { ...comments, [commenting]: comment.trim() };
    setComments(next);
    localStorage.setItem(REPORT_COMMENTS_KEY, JSON.stringify(next));
    setCommenting("");
    notify("主管点评已发送并保存");
  };
  const openSource = (module: string) => {
    const routes: Record<string, string> = { "客户": "/customers", "商机": "/opportunities", "合同": "/contracts", "任务": "/tasks", "工单": "/tickets" };
    navigate(routes[module] ?? "/");
  };

  return <div className={`report-page ${embedded ? "report-page-embedded" : ""}`}>
    {!embedded && <section className="report-banner">
      <div className="report-banner-icon"><Bot size={23}/></div>
      <div><span className="ai-kicker">AI DAILY DIGEST</span><h1>AI 已基于今日系统操作自动生成日报</h1><p>已汇总 <strong>38</strong> 次操作，覆盖客户、商机、合同、任务、工单与 SCRM 共 <strong>6</strong> 个模块。</p></div>
      <div className="report-generation"><small>最近生成：今天 {generatedAt}</small><Button variant="secondary" onClick={() => {setGeneratedAt("刚刚");notify("日报已根据最新操作重新生成")}}><RefreshCw size={13}/>重新生成</Button></div>
    </section>}
    {embedded && <section className="ai-report-status">
      <div><Sparkles size={16}/><span><strong>AI 日报已就绪</strong><small>已汇总 38 次操作，覆盖 6 个业务模块 · 最近生成 {generatedAt}</small></span></div>
      <Button variant="secondary" onClick={() => {setGeneratedAt("刚刚");notify("日报已根据最新操作重新生成")}}><RefreshCw size={13}/>重新生成</Button>
    </section>}

    <Card className="report-tabs"><Tabs items={["我的日报","团队日报","周报汇总"]} active={tab} onChange={setTab}/></Card>

    {tab === "我的日报" && <div className="stack report-view">
      <div className="date-strip">{dates.map(item => <button className={date.date === item.date ? "active" : ""} key={item.date} onClick={() => setDate(item)}><span>{item.day}</span><strong>{item.date}</strong><small>{item.count} 次操作</small></button>)}</div>
      <div className="report-summary-line"><CalendarDays size={15}/><strong>{date.day === "今天" ? "今日" : `9 月 ${date.date.split("/")[1]} 日`}工作摘要</strong><span>AI 从 {date.count} 次有效操作中提炼了 {date.day === "今天" ? 5 : 4} 项关键成果</span></div>
      <div className="report-main-grid">
        <Card>
          <div className="panel-head"><div><h2>今日完成</h2><p>按系统操作时间自动整理</p></div><Badge tone="violet"><Sparkles size={11}/>AI 提炼</Badge></div>
          <div className="panel-body operation-list">{operations.map(([time,title,detail,module]) => <div className="operation-row" key={time}><time>{time}</time><span className="operation-dot"/><div><strong>{title}</strong><p>{detail}</p></div><Badge tone={module === "工单" ? "amber" : module === "合同" ? "green" : "blue"}>{module}</Badge><button className="link" onClick={() => openSource(module)}>查看来源 <ArrowUpRight size={11}/></button></div>)}</div>
        </Card>
        <div className="stack">
          <Card><div className="panel-head"><div><h2>数据统计</h2><p>相比昨日净变化</p></div></div><div className="report-stats">{[["新增客户","6","+2"],["客户跟进","17","+5"],["商机金额","+¥128k","+8.6%"],["确认回款","¥86k","1 笔"]].map(([label,value,delta])=><div key={label}><span>{label}</span><strong>{value}</strong><small>{delta}</small></div>)}</div></Card>
          <Card className="risk-card"><div className="panel-head"><div><h2>风险提示</h2><p>需要在今日下班前关注</p></div><AlertCircle size={17}/></div><div className="panel-body"><div className="risk-row"><strong>2 位客户跟进超期</strong><span>星瀚科技 15 天 · 海岳资本 9 天</span></div><div className="risk-row"><strong>1 笔回款已逾期</strong><span>北辰零售 · ¥42,000 · 逾期 5 天</span></div></div></Card>
        </div>
      </div>
      <Card><div className="panel-head"><div><h2>明日建议</h2><p>结合未完成任务、商机阶段与风险自动生成</p></div><Badge tone="violet">3 项建议</Badge></div><div className="recommendation-list">{recommendations.map(([priority,title,reason])=><article key={title}><Badge tone={priority === "高" ? "red" : "amber"}>{priority}优先级</Badge><div><strong>{title}</strong><p>{reason}</p></div><Button variant="secondary" disabled={createdTasks.includes(title)} onClick={() => createTask(title)}>{createdTasks.includes(title) ? "已创建" : "创建任务"}</Button></article>)}</div></Card>
      <Card className="source-note">
        <div><span className="eyebrow">日报数据来源</span><strong>来自客户跟进 / 商机 / 合同 / 任务 / 工单 / SCRM</strong><p>日报由系统自动生成，补充说明为可选项，不影响日报生成。</p></div>
        <div className="note-composer"><textarea value={note} onChange={e => {setNote(e.target.value);setNoteSaved(false)}} placeholder="可选：补充系统无法识别的线下工作或背景说明"/><Button variant="secondary" onClick={() => {localStorage.setItem(REPORT_NOTE_KEY, JSON.stringify(note));setNoteSaved(true);notify("补充说明已保存")}}>{noteSaved ? <CheckCircle2 size={14}/> : <FileText size={14}/>} {noteSaved ? "已保存" : "保存补充"}</Button></div>
      </Card>
    </div>}

    {tab === "团队日报" && <div className="stack report-view">
      <div className="team-summary"><div><span>今日团队操作</span><strong>136</strong><small>较昨日 +11.4%</small></div><div><span>有效客户跟进</span><strong>40</strong><small>目标完成 108%</small></div><div className="team-highlight"><Badge tone="green">今日突出</Badge><strong>赵晨</strong><small>跟进 12 次，推进 3 个商机</small></div><div className="team-highlight risk"><Badge tone="red">需关注</Badge><strong>王岚</strong><small>2 个重点客户超过 7 天未跟进</small></div></div>
      <div className="grid-2 report-team-grid">
        <Card><div className="panel-head"><div><h2>成员活跃度对比</h2><p>系统操作数与有效跟进数</p></div><UsersRound size={17}/></div><div className="panel-body"><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={teamData} barGap={3}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip/><Legend wrapperStyle={{fontSize:10}}/><Bar dataKey="operation" name="操作数" fill="#6366f1" radius={[3,3,0,0]}/><Bar dataKey="follow" name="跟进数" fill="#38bdf8" radius={[3,3,0,0]}/></BarChart></ResponsiveContainer></div></div></Card>
        <Card><div className="panel-head"><div><h2>成员结果与风险</h2><p>AI 按贡献与风险排序</p></div></div><div className="panel-body">{teamData.map((member,index)=><div className="member-row" key={member.name}><span className="member-rank">{index+1}</span><div className="task-main"><strong>{member.name}</strong><small>{comments[member.name] ? `主管点评：${comments[member.name]}` : index === 0 ? "新增商机 ¥180k · 成交推进 3 项" : index === 4 ? "本周跟进完成率 62% · 2 项风险" : `完成 ${member.follow} 次跟进 · 无新增高风险`}</small></div>{index === 4 ? <Badge tone="red">需关注</Badge> : <Badge tone="green">正常</Badge>}<Button variant="ghost" onClick={() => {setCommenting(member.name);setComment(comments[member.name] ?? "")}}>主管点评</Button></div>)}</div></Card>
      </div>
    </div>}

    {tab === "周报汇总" && <div className="stack report-view">
      <section className="weekly-intro"><div><Badge tone="violet"><Sparkles size={11}/>自动聚合</Badge><h2>第 37 周业务周报</h2><p>由 5 个工作日的团队日报自动生成，无需重复填写。</p></div><Button onClick={() => setPreview(true)}><FileText size={14}/>生成 / 预览周报</Button></section>
      <div className="metrics three">
        <Card className="weekly-kpi"><Target size={18}/><span>新增商机金额</span><strong>¥1.28M</strong><small>周环比 +18.6%</small></Card>
        <Card className="weekly-kpi"><CircleDollarSign size={18}/><span>本周确认回款</span><strong>¥436k</strong><small>目标完成 92%</small></Card>
        <Card className="weekly-kpi"><TrendingUp size={18}/><span>重点商机推进</span><strong>17 个</strong><small>其中 4 个进入签约</small></Card>
      </div>
      <Card><div className="panel-head"><div><h2>本周业务趋势</h2><p>每日操作与有效跟进变化</p></div></div><div className="panel-body"><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><LineChart data={weekData}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="day" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip/><Legend wrapperStyle={{fontSize:10}}/><Line type="monotone" dataKey="activity" name="业务操作" stroke="#6366f1" strokeWidth={2}/><Line type="monotone" dataKey="follow" name="有效跟进" stroke="#0ea5e9" strokeWidth={2}/></LineChart></ResponsiveContainer></div></div></Card>
      <div className="grid-equal weekly-details"><Card><div className="panel-head"><h2>关键成果</h2></div><div className="panel-body"><ul><li>星瀚科技 CRM 企业版进入商务谈判，预计金额 ¥320k</li><li>华东区域新增 18 家目标客户，有效线索率 61%</li><li>完成云帆物流首期交付并确认回款 ¥86k</li></ul></div></Card><Card><div className="panel-head"><h2>下周计划与风险</h2></div><div className="panel-body"><ul><li>推进 4 个签约阶段商机，重点确认法务审批进度</li><li>修复北辰零售逾期回款，明确付款时间</li><li>关注教育行业线索转化下降 6.2% 的趋势</li></ul></div></Card></div>
    </div>}

    <Modal open={Boolean(commenting)} onClose={() => setCommenting("")} title={`点评 ${commenting} 的日报`}>
      <p className="subtle">点评将同步给成员，并保留在今日团队日报中。</p><label className="field"><span>主管点评</span><textarea value={comment} onChange={e => setComment(e.target.value)} placeholder="肯定成果，并给出下一步建议"/></label><div className="form-actions"><Button variant="secondary" onClick={() => setCommenting("")}>取消</Button><Button onClick={saveComment}><MessageSquareText size={14}/>发送点评</Button></div>
    </Modal>
    <Modal open={preview} onClose={() => setPreview(false)} title="第 37 周业务周报预览">
      <div className="report-preview"><span className="ai-kicker">GROWTH CRM · WEEKLY</span><h2>销售增长周报</h2><p>2026.09.08 - 2026.09.14</p><div><strong>AI 摘要</strong><p>本周商机增长明显，重点客户推进质量提升；回款完成率接近目标，但逾期账款与教育行业线索转化需要下周优先处理。</p></div><small><Clock3 size={12}/>基于 5 份团队日报 · 684 次系统操作</small></div><div className="form-actions"><Button variant="secondary" onClick={() => setPreview(false)}>关闭</Button><Button onClick={() => { downloadWeeklyPdf(); notify("周报 PDF 已生成并开始下载"); }}>下载 PDF</Button></div>
    </Modal>
  </div>;
}
