import { useEffect, useRef, useState } from "react";
import { useNavigate, useOutletContext, useSearchParams } from "react-router-dom";
import {
  AlertTriangle, ArrowRight, BarChart3, BookOpen, Bot, BrainCircuit, Check,
  CheckCircle2, ChevronRight, ClipboardCheck, Clock3, Copy, Database, FileAudio,
  FileText, GraduationCap, Headphones, ListPlus, MessageSquareText, PhoneForwarded,
  Play, RotateCcw, Search, Send, Sparkles, Star, Target, TrendingUp, Upload,
  UserRoundCog, UsersRound,
} from "lucide-react";
import type { OutletContext } from "../components/AppShell";
import { Badge, Button, Card, Modal } from "../components/ui";
import DailyReports from "./DailyReports";

type AssistantView = "chat" | "sales" | "reports" | "service" | "training";
type ChatKind = "greeting" | "performance" | "students" | "knowledge" | "general";
type ChatMessage = { id: string; role: "assistant" | "user"; kind: ChatKind; text: string; time: string };
type KnowledgeItem = { id: string; title: string; category: string; content: string; hitRate: number; updatedAt: string; status: "已发布" | "草稿" };
type TrainingRound = { customer: string; answer: string; score: number };

const CHAT_STORAGE_KEY = "growth-ai-chat-v1";
const VIEW_STORAGE_KEY = "growth-ai-assistant-view-v1";
const TASK_STORAGE_KEY = "growth-ai-follow-up-tasks-v1";
const CRM_STORAGE_KEY = "growth-ai-crm-records-v1";
const KNOWLEDGE_STORAGE_KEY = "growth-ai-knowledge-v1";
const QUEUE_STORAGE_KEY = "growth-ai-service-queue-v1";
const TRAINING_STORAGE_KEY = "growth-ai-training-v1";
const WECOM_STORAGE_KEY = "growth-ai-wecom-sent-v1";
const initialKnowledge: KnowledgeItem[] = [
  { id: "kb-1", title: "CPA 课程班型与大纲", category: "课程", content: "覆盖会计、审计、财管等重点科目，按基础、强化、冲刺三阶段组织。", hitRate: 92, updatedAt: "2026-09-12", status: "已发布" },
  { id: "kb-2", title: "多科联报价格与优惠", category: "价格优惠", content: "CPA 多科联报享组合优惠，具体金额以当期活动规则为准。", hitRate: 88, updatedAt: "2026-09-15", status: "已发布" },
  { id: "kb-3", title: "报名及开课流程", category: "报名流程", content: "完成合同确认与缴费后，由班主任在一个工作日内开通课程。", hitRate: 84, updatedAt: "2026-09-08", status: "已发布" },
  { id: "kb-4", title: "APP 学习进度同步", category: "学习问题", content: "课程学习进度通常在五分钟内同步，可在学习中心手动刷新。", hitRate: 81, updatedAt: "2026-09-10", status: "已发布" },
  { id: "kb-5", title: "退费规则与申请材料", category: "退费规则", content: "开课 7 日内且学习进度低于 10% 可提交退费申请。", hitRate: 95, updatedAt: "2026-09-14", status: "已发布" },
  { id: "kb-6", title: "课程分期政策", category: "分期政策", content: "CPA 多科联报支持 3、6、12 期分期，6 期及以内免息。", hitRate: 91, updatedAt: "2026-09-13", status: "已发布" },
];
const viewItems: Array<{ id: AssistantView; label: string; icon: typeof Bot }> = [
  { id: "chat", label: "智能对话", icon: MessageSquareText },
  { id: "sales", label: "销售助理", icon: TrendingUp },
  { id: "reports", label: "日报与复盘", icon: FileText },
  { id: "service", label: "客服知识库", icon: BookOpen },
  { id: "training", label: "销售训练", icon: GraduationCap },
];
const quickQuestions = ["查询今日业绩", "查看学员动向", "CPA 会计班课程大纲", "退费规则", "分期付款"];
const getTime = () => new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
const createMessage = (role: ChatMessage["role"], kind: ChatKind, text: string): ChatMessage => ({ id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, role, kind, text, time: getTime() });
const loadStored = <T,>(key: string, fallback: T): T => {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "null") as T | null;
    return value ?? fallback;
  } catch {
    return fallback;
  }
};
const persist = <T,>(key: string, value: T) => localStorage.setItem(key, JSON.stringify(value));
const copyText = async (text: string, notify: (message: string) => void, label: string) => {
  try {
    await navigator.clipboard.writeText(text);
    notify(`${label}已复制到剪贴板`);
  } catch {
    notify(`${label}复制失败，请检查浏览器剪贴板权限`);
  }
};
const greeting = () => createMessage("assistant", "greeting", "您好，我是晓曼 AI 助理。可以查询今日业绩、查看学员动向，也可以检索课程与服务政策。");
const loadMessages = () => {
  try {
    const messages = JSON.parse(localStorage.getItem(CHAT_STORAGE_KEY) ?? "[]") as ChatMessage[];
    return Array.isArray(messages) && messages.length ? messages : [greeting()];
  } catch {
    return [greeting()];
  }
};
const getReply = (question: string): { kind: Exclude<ChatKind, "greeting">; text: string } => {
  if (/业绩|销售|回款|目标|订单|成交/.test(question)) return { kind: "performance", text: "今日经营数据已汇总。销售额较昨日增长 8.6%，当前目标完成率 82.6%，仍有 3 笔高意向待回款订单需要在 16:00 前推进。" };
  if (/学员|续费|试听|学习|考勤|报名|课时/.test(question)) return { kind: "students", text: "今日新增报名 86 人、试听转化 34 人、续费 52 人。42 位学员连续 7 天未学习，建议优先安排班主任回访。" };
  if (/大纲|退费|分期|课程|政策/.test(question)) return { kind: "knowledge", text: /退费/.test(question) ? "符合「开课 7 日内且学习进度低于 10%」条件可申请退费；资料包与已使用服务将按协议扣除。" : /分期/.test(question) ? "CPA 多科联报支持 3、6、12 期分期。6 期及以内可享免息，提交后由课程顾问完成资格确认。" : "CPA 会计班覆盖长期股权投资、合并财务报表、收入、金融工具等 24 个重点专题，包含基础、强化、冲刺三阶段。" };
  return { kind: "general", text: "我已收到问题。当前信息可能涉及个案判断，建议补充课程、学员或订单信息；如需人工确认，也可以直接转交客服队列。" };
};

function SectionHeader({ kicker, title, detail, actions }: { kicker: string; title: string; detail: string; actions?: React.ReactNode }) {
  return <header className="assistant-section-head"><div><span className="suite-kicker"><Sparkles size={12}/>{kicker}</span><h2>{title}</h2><p>{detail}</p></div>{actions}</header>;
}

function ChatView({ notify }: { notify: (message: string) => void }) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [handoff, setHandoff] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number>();
  useEffect(() => localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages)), [messages]);
  useEffect(() => {
    const node = listRef.current;
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  }, [messages, loading]);
  useEffect(() => () => window.clearTimeout(timerRef.current), []);
  const ask = (question: string) => {
    const value = question.trim();
    if (!value || loading) return;
    const reply = getReply(value);
    setMessages((current) => [...current, createMessage("user", reply.kind, value)]);
    setInput("");
    setLoading(true);
    timerRef.current = window.setTimeout(() => {
      setMessages((current) => [...current, createMessage("assistant", reply.kind, reply.text)]);
      setLoading(false);
    }, 520);
  };
  return <div className="assistant-view">
    <SectionHeader kicker="BUSINESS COPILOT" title="智能对话" detail="聚合经营、学员与知识库数据，返回可执行答案和可追溯来源。" actions={<Button variant="secondary" onClick={() => setConfirm(true)}><RotateCcw size={13}/>新对话</Button>}/>
    <Card className="assistant-chat-shell">
      <section className="assistant-conversation">
        <div className="assistant-message-list" ref={listRef} role="log" aria-live="polite">
          {messages.map((message) => <article className={`assistant-message ${message.role}`} key={message.id}>
            <span className="assistant-message-avatar">{message.role === "assistant" ? <Sparkles size={14}/> : "我"}</span>
            <div><header><strong>{message.role === "assistant" ? "晓曼 AI" : "我"}</strong><time>{message.time}</time></header><section className="assistant-bubble"><p>{message.text}</p>
              {message.kind === "greeting" && <div className="chat-quick-grid">{quickQuestions.slice(0, 3).map((item) => <button onClick={() => ask(item)} key={item}>{item}<ArrowRight size={12}/></button>)}</div>}
              {message.role === "assistant" && message.kind === "performance" && <div className="chat-data-block">
                <div className="chat-metrics">{[["今日销售额", "¥1,286,400"], ["目标完成率", "82.6%"], ["新增订单", "126"], ["确认回款", "¥842,600"]].map(([label, value]) => <span key={label}><small>{label}</small><strong>{value}</strong></span>)}</div>
                <p className="chat-warning"><AlertTriangle size={13}/>距离日目标仍差 ¥271,600，星瀚、明途、北辰 3 笔订单优先跟进。</p>
                <button className="link" onClick={() => navigate("/ai?view=reports")}>查看完整日报 <ArrowRight size={12}/></button>
              </div>}
              {message.role === "assistant" && message.kind === "students" && <div className="chat-data-block"><div className="chat-metrics">{[["新增报名", "86"], ["试听转化", "34"], ["续费", "52"], ["风险学员", "42"]].map(([label, value]) => <span key={label}><small>{label}</small><strong>{value}</strong></span>)}</div><Button variant="secondary" onClick={() => navigate("/students/overview")}>查看学员列表<ArrowRight size={12}/></Button></div>}
              {message.role === "assistant" && message.kind === "knowledge" && <div className="knowledge-citation"><BookOpen size={13}/><span><strong>引用：学员服务政策 / CPA 课程产品手册</strong><small>知识库更新时间：2026-09-12 18:30</small></span></div>}
              {message.role === "assistant" && message.kind === "general" && <Button variant="secondary" onClick={() => { setHandoff(true); notify("问题已流转人工客服队列"); }}><PhoneForwarded size={13}/>{handoff ? "已转人工 · 排队中" : "转人工客服"}</Button>}
            </section></div>
          </article>)}
          {loading && <article className="assistant-message"><span className="assistant-message-avatar"><Sparkles size={14}/></span><div><header><strong>晓曼 AI</strong><time>正在分析</time></header><section className="assistant-typing"><i/><i/><i/>正在聚合最新业务数据...</section></div></article>}
        </div>
        <div className="assistant-composer"><label htmlFor="assistant-input">向晓曼 AI 提问</label><div><textarea id="assistant-input" value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); ask(input); } }} placeholder="例如：CPA 课程支持分期付款吗？"/><Button onClick={() => ask(input)} disabled={!input.trim() || loading}><Send size={14}/>发送</Button></div><small>Enter 发送 · Shift + Enter 换行</small></div>
      </section>
      <aside className="assistant-chat-aside">
        <span className="eyebrow">快捷查询</span>{quickQuestions.map((item, index) => <button onClick={() => ask(item)} key={item}><span className={`tone-${index < 2 ? "blue" : "violet"}`}>{index === 0 ? <BarChart3 size={15}/> : index === 1 ? <GraduationCap size={15}/> : <BookOpen size={15}/>}</span><strong>{item}</strong><ChevronRight size={13}/></button>)}
        <div className="data-scope"><strong><Database size={13}/>实时数据范围</strong><span>订单与合同回款</span><span>学员、考勤与学习</span><span>课程与服务知识库</span><small>更新于 10 分钟前</small></div>
      </aside>
    </Card>
    <Modal open={confirm} onClose={() => setConfirm(false)} title="开始新对话"><p className="subtle">当前对话将从本机历史记录中清除。</p><div className="form-actions"><Button variant="secondary" onClick={() => setConfirm(false)}>取消</Button><Button onClick={() => { setMessages([greeting()]); setConfirm(false); notify("已开始新对话"); }}>清空并开始新对话</Button></div></Modal>
  </div>;
}

function SalesView({ notify }: { notify: (message: string) => void }) {
  const [customer, setCustomer] = useState("星瀚科技 · 周明远");
  const [objection, setObjection] = useState("太贵了");
  const [scriptMode, setScriptMode] = useState("价值对比");
  const [scriptRevision, setScriptRevision] = useState(1);
  const [summaryReady, setSummaryReady] = useState(true);
  const [taskIds, setTaskIds] = useState<string[]>(() => loadStored(TASK_STORAGE_KEY, []));
  const [crmWritten, setCrmWritten] = useState(() => loadStored<string[]>(CRM_STORAGE_KEY, []).includes(customer));
  const [materialsSent, setMaterialsSent] = useState(() => loadStored<string[]>(WECOM_STORAGE_KEY, []).includes(customer));
  const objections = ["太贵了", "考虑考虑", "没时间", "基础差", "怕考不过", "竞品对比"];
  const reminders = [
    ["lead-1", "周明远连续 2 次浏览 CPA 多科联报价格页", "3 分钟前", "高意向"],
    ["lead-2", "陈静 3 天未回复课程顾问消息", "12 分钟前", "需唤醒"],
    ["lead-3", "李悦下载中级会计考试大纲", "28 分钟前", "内容互动"],
  ];
  const scriptText = objection === "太贵了"
    ? scriptRevision % 2
      ? "理解您对投入的关注。把课程拆到 6 期免息后，每月约 680 元。相比重新备考一年的时间成本，这套方案会由班主任按周追踪，确保每一笔投入都落到学习进度上。"
      : "预算确实需要认真评估。我们可以先按每月 680 元的 6 期免息方案测算，同时对比重考一年的资料、时间与机会成本，再决定是否值得投入。"
    : `针对「${objection}」，建议先确认顾虑背后的真实原因，再用课程计划、同类学员案例和可逆承诺降低决策压力。`;
  const createTask = (id: string) => {
    const next = [...new Set([...taskIds, id])];
    setTaskIds(next);
    persist(TASK_STORAGE_KEY, next);
    notify("跟进任务已创建，提醒时间为 30 分钟后");
  };
  const writeCrm = () => {
    const records = loadStored<string[]>(CRM_STORAGE_KEY, []);
    persist(CRM_STORAGE_KEY, [...new Set([...records, customer])]);
    setCrmWritten(true);
    notify("对话总结已写入 CRM 跟进记录");
  };
  return <div className="assistant-view">
    <SectionHeader kicker="SALES COPILOT" title="销售助理" detail="围绕一个客户统一完成画像判断、线索响应、异议处理与对话沉淀。" actions={<select className="select" value={customer} onChange={(event) => { const nextCustomer = event.target.value; setCustomer(nextCustomer); setCrmWritten(loadStored<string[]>(CRM_STORAGE_KEY, []).includes(nextCustomer)); setMaterialsSent(loadStored<string[]>(WECOM_STORAGE_KEY, []).includes(nextCustomer)); }}><option>星瀚科技 · 周明远</option><option>明途教育 · 陈静</option><option>云帆物流 · 李悦</option></select>}/>
    <div className="sales-top-grid">
      <Card className="customer-intel">
        <div className="panel-head"><div><h2>客户画像结论</h2><p>{customer} · 数据更新于 10 分钟前</p></div><Badge tone="violet">AI 置信度 86%</Badge></div>
        <div className="customer-grade"><div><span>价值等级</span><strong>A</strong><small>高价值客户</small></div><div><span>成交概率</span><strong>78%</strong><small>较上周 +9%</small></div><div><span>LTV 预估</span><strong>¥86k</strong><small>多科联报潜力</small></div><div><span>当前风险</span><strong className="text-amber">15 天</strong><small>未有效跟进</small></div></div>
        <div className="evidence-line"><BrainCircuit size={15}/><div><strong>判断证据</strong><p>2 次查看价格页 · 询问分期政策 · CPA 模考 61 分 · 距优惠到期 5 天</p></div></div>
      </Card>
      <Card className="lead-reminders">
        <div className="panel-head"><div><h2>实时线索提醒</h2><p>按意向与响应时效排序</p></div><Badge tone="red">3 条待处理</Badge></div>
        <div className="reminder-list">{reminders.map(([id, title, time, tag]) => <article key={id}><span className="tone-blue"><TrendingUp size={14}/></span><div><strong>{title}</strong><small>{time} · {tag}</small></div><Button variant="secondary" disabled={taskIds.includes(id)} onClick={() => createTask(id)}>{taskIds.includes(id) ? <Check size={13}/> : <ListPlus size={13}/>} {taskIds.includes(id) ? "已创建" : "创建任务"}</Button></article>)}</div>
      </Card>
    </div>
    <div className="sales-work-grid">
      <Card className="objection-panel">
        <div className="panel-head"><div><h2>异议处理与话术推荐</h2><p>选择学员异议，生成多角度回复</p></div><Sparkles size={16}/></div>
        <div className="objection-chips">{objections.map((item) => <button className={objection === item ? "active" : ""} onClick={() => setObjection(item)} key={item}>{item}</button>)}</div>
        <div className="script-modes">{["价值对比", "分期方案", "限时优惠", "学员案例"].map((item) => <button className={scriptMode === item ? "active" : ""} onClick={() => setScriptMode(item)} key={item}>{item}</button>)}</div>
        <div className="sales-script"><span className="suite-kicker"><Sparkles size={11}/>{scriptMode} · V{scriptRevision}</span><p>{scriptText}</p><div><Button variant="secondary" onClick={() => void copyText(scriptText, notify, "推荐话术")}><Copy size={13}/>复制</Button><Button onClick={() => { setScriptRevision((value) => value + 1); notify("已生成另一版异议处理话术"); }}><Sparkles size={13}/>换一版</Button></div></div>
      </Card>
      <Card className="conversation-summary">
        <div className="panel-head"><div><h2>对话总结</h2><p>电话、企微与会议纪要统一沉淀</p></div><Badge tone="green">识别完成</Badge></div>
        <button className="summary-upload" onClick={() => { setSummaryReady(false); window.setTimeout(() => { setSummaryReady(true); notify("对话记录解析完成"); }, 500); }}><Upload size={17}/><span><strong>上传或模拟对话记录</strong><small>支持音频、文本与企微聊天记录</small></span></button>
        {summaryReady && <div className="summary-grid">{[
          ["核心需求", "在职备考，希望三科联报但担心跟不上进度"],
          ["主要异议", "价格偏高；每周可学习时间不足 12 小时"],
          ["意向度", "高 · 78 分"],
          ["下一步", "今天 16:30 发送 6 期免息方案与试听课"],
          ["关键信息", "预算 4,000 元左右，考试目标为 2027 年"],
        ].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>}
        <Button onClick={writeCrm} disabled={!summaryReady || crmWritten}>{crmWritten ? <Check size={14}/> : <ClipboardCheck size={14}/>}{crmWritten ? "已写入 CRM" : "写入 CRM 跟进记录"}</Button>
      </Card>
      <Card className="wecom-preview">
        <div className="panel-head"><div><h2>企微 SCRM 助手预览</h2><p>销售会话侧边栏实时辅助</p></div><Badge tone="blue">企业微信</Badge></div>
        <div className="wecom-layout"><aside><div className="wecom-profile"><span>周</span><div><strong>周明远</strong><small>CPA 冲刺意向 · A 级</small></div></div>{["客户画像", "历史记录", "快捷话术", "产品资料"].map((item, index) => <button className={index === 0 ? "active" : ""} key={item}>{item}<ChevronRight size={12}/></button>)}</aside><section><strong>会话辅助建议</strong><p>客户刚查看分期政策，建议先发送 6 期免息月供明细，再补充在职学员每周学习计划。</p><div className="wecom-products"><span>CPA 多科联报方案.pdf</span><span>在职考生时间表.xlsx</span></div><Button variant="secondary" disabled={materialsSent} onClick={() => { const next = [...new Set([...loadStored<string[]>(WECOM_STORAGE_KEY, []), customer])]; persist(WECOM_STORAGE_KEY, next); setMaterialsSent(true); notify("资料已发送到企微会话"); }}>{materialsSent ? <Check size={13}/> : null}{materialsSent ? "已发送" : "发送到会话"}</Button></section></div>
      </Card>
    </div>
  </div>;
}

function ServiceView({ notify }: { notify: (message: string) => void }) {
  const [queue, setQueue] = useState<string[]>(() => loadStored(QUEUE_STORAGE_KEY, ["待处理", "机器人处理中", "待处理", "已解决"]));
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("全部分类");
  const [items, setItems] = useState<KnowledgeItem[]>(() => loadStored(KNOWLEDGE_STORAGE_KEY, initialKnowledge));
  const [editing, setEditing] = useState<KnowledgeItem | null>(null);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [editor, setEditor] = useState<KnowledgeItem>({ id: "", title: "", category: "课程", content: "", hitRate: 80, updatedAt: "", status: "已发布" });
  const knowledge = items.filter((item) => `${item.title}${item.category}${item.content}`.toLowerCase().includes(search.toLowerCase()) && (category === "全部分类" || item.category === category));
  const openEditor = (item?: KnowledgeItem) => {
    const value = item ?? { id: "", title: "", category: "课程", content: "", hitRate: 80, updatedAt: "", status: "已发布" };
    setEditor(value);
    setEditing(value);
  };
  const saveKnowledge = () => {
    if (!editor.title.trim() || !editor.content.trim()) {
      notify("请填写知识标题和内容");
      return;
    }
    const saved = { ...editor, id: editor.id || `kb-${Date.now()}`, updatedAt: "2026-09-15" };
    const next = editor.id ? items.map((item) => item.id === editor.id ? saved : item) : [saved, ...items];
    setItems(next);
    persist(KNOWLEDGE_STORAGE_KEY, next);
    setEditing(null);
    notify("知识条目已保存并重新索引");
  };
  return <div className="assistant-view">
    <SectionHeader kicker="SERVICE INTELLIGENCE" title="客服知识库" detail="统一查看会话队列、机器人解决效果与知识命中情况。" actions={<Button onClick={() => openEditor()}><PlusIcon/>新增知识条目</Button>}/>
    <div className="service-kpis">{[["今日会话", "1,286", "+12.4%", MessageSquareText], ["机器人解决率", "83.6%", "目标 80%+", Bot], ["转人工", "126", "占比 9.8%", Headphones], ["平均响应", "1.8s", "较昨日 -0.3s", Clock3]].map(([label, value, detail, Icon]) => <Card key={String(label)}><span className="tone-violet"><Icon size={16}/></span><div><small>{label as string}</small><strong>{value as string}</strong><em>{detail as string}</em></div></Card>)}</div>
    <div className="service-grid">
      <Card className="conversation-queue">
        <div className="panel-head"><div><h2>实时会话队列</h2><p>按情绪风险与等待时间排序</p></div><Badge tone="red">3 条需关注</Badge></div>
        <div className="table-panel"><table className="data-table"><thead><tr><th>学员</th><th>意图</th><th>渠道</th><th>情绪</th><th>状态</th><th>操作</th></tr></thead><tbody>{[
          ["陈静", "退费进度", "在线客服", "焦虑"],
          ["王涛", "CPA 分期", "企业微信", "积极"],
          ["李悦", "课程打不开", "APP", "不满"],
          ["周敏", "考试大纲", "公众号", "中性"],
        ].map((row, index) => <tr key={row[0]}><td><strong>{row[0]}</strong><small>等待 {index * 2 + 1} 分钟</small></td><td>{row[1]}</td><td>{row[2]}</td><td><Badge tone={row[3] === "不满" ? "red" : row[3] === "焦虑" ? "amber" : "green"}>{row[3]}</Badge></td><td>{queue[index]}</td><td><div className="row-actions"><button onClick={() => setActiveConversation(row[0])}>查看对话</button>{queue[index] !== "已解决" && <button onClick={() => { const next = [...queue]; next[index] = "已转人工"; setQueue(next); persist(QUEUE_STORAGE_KEY, next); notify("会话已转人工客服"); }}>转人工</button>}</div></td></tr>)}</tbody></table></div>
      </Card>
      <Card className="knowledge-panel">
        <div className="knowledge-toolbar"><label><Search size={14}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索知识标题或分类"/></label><select className="select" value={category} onChange={(event) => setCategory(event.target.value)}><option>全部分类</option>{Array.from(new Set(items.map((item) => item.category))).map((item) => <option key={item}>{item}</option>)}</select></div>
        <div className="table-panel"><table className="data-table"><thead><tr><th>知识条目</th><th>分类</th><th>命中率</th><th>更新时间</th><th>操作</th></tr></thead><tbody>{knowledge.map((item) => <tr key={item.id}><td><strong>{item.title}</strong><small>{item.status}</small></td><td><Badge tone="blue">{item.category}</Badge></td><td><span className="hit-rate"><i style={{ width: `${item.hitRate}%` }}/><b>{item.hitRate}%</b></span></td><td>{item.updatedAt}</td><td><button className="link" onClick={() => openEditor(item)}>编辑</button></td></tr>)}</tbody></table></div>
      </Card>
    </div>
    <Modal open={Boolean(editing)} onClose={() => setEditing(null)} title={editor.id ? "编辑知识条目" : "新增知识条目"}><div className="form-grid"><label className="field form-span-2"><span>标题</span><input className="input" value={editor.title} onChange={(event) => setEditor({ ...editor, title: event.target.value })}/></label><label className="field"><span>分类</span><select className="select" value={editor.category} onChange={(event) => setEditor({ ...editor, category: event.target.value })}>{["课程", "价格优惠", "报名流程", "学习问题", "技术问题", "退费规则", "分期政策"].map((item) => <option key={item}>{item}</option>)}</select></label><label className="field"><span>状态</span><select className="select" value={editor.status} onChange={(event) => setEditor({ ...editor, status: event.target.value as KnowledgeItem["status"] })}><option>已发布</option><option>草稿</option></select></label><label className="field form-span-2"><span>知识内容</span><textarea value={editor.content} onChange={(event) => setEditor({ ...editor, content: event.target.value })}/></label></div><div className="form-actions"><Button variant="secondary" onClick={() => setEditing(null)}>取消</Button><Button onClick={saveKnowledge}>保存并发布</Button></div></Modal>
    <Modal open={Boolean(activeConversation)} onClose={() => setActiveConversation(null)} title={`${activeConversation ?? "学员"}的会话`}>
      <div className="service-conversation-preview"><p><strong>{activeConversation}：</strong>我想确认一下课程分期和开课时间，今天报名可以什么时候开始学习？</p><p><strong>晓曼 AI：</strong>支持 3、6、12 期分期。完成合同与缴费后，班主任会在一个工作日内开通课程。</p><div className="knowledge-citation"><BookOpen size={13}/><span><strong>引用：课程分期政策 / 报名及开课流程</strong><small>知识库更新时间：2026-09-15</small></span></div></div>
      <div className="form-actions"><Button variant="secondary" onClick={() => setActiveConversation(null)}>关闭</Button></div>
    </Modal>
  </div>;
}

function PlusIcon() { return <span aria-hidden="true">+</span>; }

function TrainingView({ notify }: { notify: (message: string) => void }) {
  const [scene, setScene] = useState("价格异议");
  const [difficulty, setDifficulty] = useState("进阶");
  const [started, setStarted] = useState(false);
  const [answer, setAnswer] = useState("");
  const [rounds, setRounds] = useState<TrainingRound[]>(() => loadStored(TRAINING_STORAGE_KEY, []));
  const submit = () => {
    if (!answer.trim()) return;
    const next = [...rounds, { customer: rounds.length ? "我还是担心自己坚持不下来，你能保证效果吗？" : "课程听起来不错，但 4,080 元还是超出我的预算。", answer, score: 84 + Math.min(rounds.length * 3, 9) }];
    setRounds(next);
    persist(TRAINING_STORAGE_KEY, next);
    setAnswer("");
    notify("本轮回复已评分");
  };
  return <div className="assistant-view">
    <SectionHeader kicker="AI SALES COACH" title="销售训练" detail="选择真实异议场景，与 AI 模拟客户对练并获得逐轮评分。"/>
    <div className="training-layout">
      <Card className="training-setup">
        <div className="panel-head"><div><h2>训练场景</h2><p>先配置客户角色和难度</p></div><GraduationCap size={17}/></div>
        <div className="training-scene-grid">{["价格异议", "考虑考虑", "基础差", "怕考不过", "竞品对比"].map((item, index) => <button className={scene === item ? "active" : ""} onClick={() => setScene(item)} key={item}><span className={`tone-${index < 2 ? "blue" : "violet"}`}><Target size={15}/></span><strong>{item}</strong><small>{index === 0 ? "高意向，预算敏感" : "模拟真实学员追问"}</small></button>)}</div>
        <label className="field"><span>难度</span><select className="select" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option>入门</option><option>进阶</option><option>专家</option></select></label>
        <Button onClick={() => { setStarted(true); setRounds([]); persist(TRAINING_STORAGE_KEY, []); notify(`${scene}模拟训练已开始`); }}><Play size={14}/>开始模拟对话</Button>
        <div className="training-history"><strong>本周训练排行</strong>{[["赵晨", "92", "8 次"], ["林晓曼", "89", "6 次"], ["陈思远", "86", "7 次"]].map((row, index) => <div key={row[0]}><b>{index + 1}</b><span>{row[0]}</span><strong>{row[1]} 分</strong><small>{row[2]}</small></div>)}</div>
      </Card>
      <Card className="training-chat">
        <div className="panel-head"><div><h2>AI 模拟客户 · {scene}</h2><p>{difficulty}难度 · 角色：在职备考学员</p></div><Badge tone={started ? "green" : "neutral"}>{started ? "训练中" : "待开始"}</Badge></div>
        {!started ? <div className="training-empty"><BrainCircuit size={32}/><strong>准备好开始一次真实异议对练</strong><p>AI 会根据你的回答追问，并实时更新四项能力评分。</p></div> : <div className="training-conversation">
          <article className="training-customer"><span>客</span><p>我看了 CPA 多科联报课程，内容是不错，但价格比另一家贵不少。你们贵在哪里？</p></article>
          {rounds.map((round, index) => <div key={`${round.answer}-${index}`}><article className="training-agent"><span>我</span><p>{round.answer}</p></article><article className="training-customer"><span>客</span><p>{round.customer}</p></article><div className="round-feedback"><Star size={13}/><strong>本轮 {round.score} 分</strong><span>价值表达清晰；可进一步先确认预算区间，再给出分期方案。</span></div></div>)}
        </div>}
        <div className="training-composer"><textarea value={answer} onChange={(event) => setAnswer(event.target.value)} disabled={!started} placeholder="输入你的销售回复..."/><Button onClick={submit} disabled={!started || !answer.trim()}><Send size={14}/>发送</Button></div>
      </Card>
      <Card className="training-score">
        <div className="panel-head"><div><h2>实时评分</h2><p>基于当前对话动态计算</p></div><strong className="total-score">{rounds.length ? 86 + Math.min(rounds.length * 2, 8) : "--"}</strong></div>
        <div className="score-list">{[["需求洞察", rounds.length ? 88 : 0], ["价值表达", rounds.length ? 91 : 0], ["异议处理", rounds.length ? 84 : 0], ["促单时机", rounds.length ? 79 : 0]].map(([label, score]) => <div key={String(label)}><span><strong>{label}</strong><b>{score || "--"}</b></span><div><i style={{ width: `${score}%` }}/></div></div>)}</div>
        <div className="coach-advice"><BrainCircuit size={15}/><div><strong>教练建议</strong><p>{rounds.length ? "先复述客户对预算的顾虑，再用月度成本、服务差异和结果案例建立价值锚点。不要过早给折扣。" : "完成首轮回复后，这里将展示针对性改进建议。"}</p></div></div>
      </Card>
    </div>
  </div>;
}

export default function AIWorkspace() {
  const { notify } = useOutletContext<OutletContext>();
  const [params, setParams] = useSearchParams();
  const requested = params.get("view") as AssistantView | null;
  const valid = viewItems.some((item) => item.id === requested);
  const fallback = localStorage.getItem(VIEW_STORAGE_KEY) as AssistantView | null;
  const [view, setView] = useState<AssistantView>(valid ? requested! : viewItems.some((item) => item.id === fallback) ? fallback! : "chat");
  useEffect(() => {
    if (valid && requested !== view) setView(requested!);
  }, [requested, valid, view]);
  const changeView = (next: AssistantView) => {
    setView(next);
    setParams({ view: next });
    localStorage.setItem(VIEW_STORAGE_KEY, next);
  };
  return <div className="assistant-page">
    <header className="suite-page-head assistant-page-head"><div><span className="suite-kicker"><Bot size={13}/>XIAOMAN AI COPILOT</span><h1>AI 助理</h1><p>将智能问答、销售跟进、经营复盘、客服知识与销售训练统一到一个工作区。</p></div><div className="suite-head-meta"><span className="assistant-online"><i/>在线 · 数据更新于 10 分钟前</span><Badge tone="violet">企业知识已连接</Badge></div></header>
    <nav className="suite-subnav assistant-subnav" aria-label="AI 助理功能">{viewItems.map(({ id, label, icon: Icon }) => <button className={view === id ? "active" : ""} onClick={() => changeView(id)} key={id}><Icon size={15}/>{label}</button>)}</nav>
    {view === "chat" && <ChatView notify={notify}/>}
    {view === "sales" && <SalesView notify={notify}/>}
    {view === "reports" && <div className="assistant-view"><SectionHeader kicker="DAILY REVIEW" title="日报与复盘" detail="自动聚合个人与团队操作，沉淀风险、建议和周报。"/><DailyReports embedded/></div>}
    {view === "service" && <ServiceView notify={notify}/>}
    {view === "training" && <TrainingView notify={notify}/>}
  </div>;
}
