import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  AlertTriangle, Clock3, FileUp, Filter, Headphones, LayoutGrid, List, MessageSquarePlus,
  Plus, Star, TicketCheck, TimerReset, UserRoundCheck,
} from "lucide-react";
import type { OutletContext } from "../components/AppShell";
import { Avatar, Badge, Button, Card, Drawer, Metric, Modal, PageHeader } from "../components/ui";

type Priority = "P0" | "P1" | "P2" | "P3";
type Status = "待处理" | "处理中" | "待客户确认" | "已解决" | "已关闭";
type Ticket = {
  id: string; type: string; customer: string; title: string; priority: Priority;
  owner: string; status: Status; sla: string; slaTone: "red" | "amber" | "green" | "neutral";
};

const initialTickets: Ticket[] = [
  { id: "TK-20260914-018", type: "系统故障", customer: "星瀚科技", title: "企微客户同步连续失败", priority: "P0", owner: "赵晨", status: "处理中", sla: "已超时 42 分钟", slaTone: "red" },
  { id: "TK-20260914-017", type: "合同咨询", customer: "明途教育", title: "续费合同中席位数需调整", priority: "P2", owner: "林晓曼", status: "待客户确认", sla: "剩余 3 小时 18 分", slaTone: "amber" },
  { id: "TK-20260914-016", type: "数据问题", customer: "云帆物流", title: "销售漏斗报表金额不一致", priority: "P1", owner: "陈思远", status: "待处理", sla: "剩余 48 分钟", slaTone: "amber" },
  { id: "TK-20260914-013", type: "使用咨询", customer: "海岳资本", title: "批量导入联系人字段映射", priority: "P3", owner: "周宁", status: "已解决", sla: "按时解决", slaTone: "green" },
  { id: "TK-20260913-042", type: "权限申请", customer: "北辰零售", title: "新增华南区域管理员权限", priority: "P2", owner: "赵晨", status: "已关闭", sla: "已关闭", slaTone: "neutral" },
];

const priorityTone = (priority: Priority) => priority === "P0" ? "red" : priority === "P1" ? "amber" : priority === "P2" ? "blue" : "neutral";
const statusTone = (status: Status) => status === "已解决" || status === "已关闭" ? "green" : status === "处理中" ? "blue" : status === "待客户确认" ? "violet" : "amber";
const boardColumns: Status[] = ["待处理", "处理中", "已解决", "已关闭"];

export default function Tickets() {
  const { notify } = useOutletContext<OutletContext>();
  const [tickets, setTickets] = useState(initialTickets);
  const [view, setView] = useState<"list" | "board">("list");
  const [filterOpen, setFilterOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [priorityFilter, setPriorityFilter] = useState("全部");
  const [statusFilter, setStatusFilter] = useState("全部");
  const [ownerFilter, setOwnerFilter] = useState("全部");
  const [draftPriority, setDraftPriority] = useState("全部");
  const [draftStatus, setDraftStatus] = useState("全部");
  const [draftOwner, setDraftOwner] = useState("全部");
  const [note, setNote] = useState("");
  const [notes, setNotes] = useState<string[]>([]);
  const [rating, setRating] = useState(4);
  const [form, setForm] = useState({ title: "", source: "企业微信", type: "使用咨询", priority: "P2" as Priority, customer: "星瀚科技", contract: "CRM 企业版 2026", description: "" });

  const filtered = useMemo(() => tickets.filter(ticket =>
    (priorityFilter === "全部" || ticket.priority === priorityFilter) &&
    (statusFilter === "全部" || ticket.status === statusFilter) &&
    (ownerFilter === "全部" || ticket.owner === ownerFilter)
  ), [tickets, priorityFilter, statusFilter, ownerFilter]);

  const moveTicket = (id: string, status: Status) => {
    setTickets(items => items.map(item => item.id === id ? { ...item, status } : item));
    setSelected(current => current?.id === id ? { ...current, status } : current);
    notify(`工单 ${id} 已更新为${status}`);
  };

  const createTicket = () => {
    if (!form.title.trim()) { notify("请填写工单标题"); return; }
    const next: Ticket = {
      id: `TK-20260914-${String(tickets.length + 19).padStart(3, "0")}`,
      type: form.type, customer: form.customer, title: form.title, priority: form.priority,
      owner: "林晓曼", status: "待处理", sla: "剩余 4 小时", slaTone: "green",
    };
    setTickets(items => [next, ...items]);
    setCreateOpen(false);
    setForm(current => ({ ...current, title: "", description: "" }));
    notify(`工单 ${next.id} 创建成功`);
  };

  return <div className="tickets-page">
    <PageHeader title="工单中心" description="集中处理客户问题，跟踪响应进度与 SLA 履约情况。" actions={<><Button variant="secondary" onClick={() => setFilterOpen(true)}><Filter size={14}/>筛选</Button><Button onClick={() => setCreateOpen(true)}><Plus size={14}/>创建工单</Button></>}/>
    <div className="metrics">
      <Metric label="今日新增" value="18" trend="较昨日 +12.5%" icon={<TicketCheck size={17}/>} tone="blue"/>
      <Metric label="待处理" value="12" trend="其中 3 个高优先级" icon={<Headphones size={17}/>} tone="amber"/>
      <Metric label="超时工单" value="3" trend="较昨日减少 1 个" icon={<AlertTriangle size={17}/>} tone="red"/>
      <Metric label="平均响应时长" value="26m" trend="目标内提升 8 分钟" icon={<TimerReset size={17}/>} tone="green"/>
    </div>
    <div className="toolbar">
      <div className="segmented" aria-label="视图切换">
        <button className={view === "list" ? "active" : ""} onClick={() => setView("list")}><List size={13}/>列表视图</button>
        <button className={view === "board" ? "active" : ""} onClick={() => setView("board")}><LayoutGrid size={13}/>看板视图</button>
      </div>
      <span className="subtle">共 {filtered.length} 个工单 · SLA 按优先级自动计算</span>
      <span className="spacer"/>
      {(priorityFilter !== "全部" || statusFilter !== "全部" || ownerFilter !== "全部") && <Badge tone="blue">筛选已生效</Badge>}
    </div>

    {view === "list" ? <Card className="table-panel">
      <table className="data-table ticket-table"><thead><tr><th>编号</th><th>类型 / 客户</th><th>工单标题</th><th>优先级</th><th>负责人</th><th>状态</th><th>SLA</th></tr></thead>
        <tbody>{filtered.map(ticket => <tr key={ticket.id} tabIndex={0} onClick={() => setSelected(ticket)} onKeyDown={event => event.key === "Enter" && setSelected(ticket)}>
          <td><span className="table-title">{ticket.id}</span></td>
          <td><span>{ticket.type}</span><small className="table-subline">{ticket.customer}</small></td>
          <td className="table-title">{ticket.title}</td>
          <td><Badge tone={priorityTone(ticket.priority)}>{ticket.priority}</Badge></td>
          <td><span className="assignee"><Avatar name={ticket.owner}/>{ticket.owner}</span></td>
          <td><Badge tone={statusTone(ticket.status)}>{ticket.status}</Badge></td>
          <td><span className={`sla-text sla-${ticket.slaTone}`}><Clock3 size={12}/>{ticket.sla}</span></td>
        </tr>)}</tbody>
      </table>
      {!filtered.length && <div className="empty-state"><strong>没有符合条件的工单</strong><p>重置筛选后可查看全部工单。</p></div>}
    </Card> : <div className="ticket-board">
      {boardColumns.map(status => <section className="ticket-column" key={status} onDragOver={event => event.preventDefault()} onDrop={event => moveTicket(event.dataTransfer.getData("ticket"), status)}>
        <div className="kanban-col-head"><span>{status}</span><Badge>{filtered.filter(ticket => ticket.status === status).length}</Badge></div>
        {filtered.filter(ticket => ticket.status === status).map(ticket => <button className="ticket-card" key={ticket.id} draggable onDragStart={event => event.dataTransfer.setData("ticket", ticket.id)} onClick={() => setSelected(ticket)}>
          <span className="ticket-card-top"><small>{ticket.id}</small><Badge tone={priorityTone(ticket.priority)}>{ticket.priority}</Badge></span>
          <strong>{ticket.title}</strong><span className="subtle">{ticket.customer} · {ticket.type}</span>
          <span className="ticket-card-foot"><span className="assignee"><Avatar name={ticket.owner}/>{ticket.owner}</span><span className={`sla-text sla-${ticket.slaTone}`}>{ticket.sla}</span></span>
        </button>)}
      </section>)}
    </div>}

    <Drawer open={filterOpen} onClose={() => setFilterOpen(false)} title="筛选工单">
      <div className="drawer-form">
        <label className="field"><span>优先级</span><select className="select" value={draftPriority} onChange={e => setDraftPriority(e.target.value)}>{["全部","P0","P1","P2","P3"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="field"><span>负责人</span><select className="select" value={draftOwner} onChange={e => setDraftOwner(e.target.value)}>{["全部","林晓曼","赵晨","陈思远","周宁"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="field"><span>状态</span><select className="select" value={draftStatus} onChange={e => setDraftStatus(e.target.value)}>{["全部",...boardColumns,"待客户确认"].map(x=><option key={x}>{x}</option>)}</select></label>
      </div>
      <div className="form-actions"><Button variant="secondary" onClick={() => { setDraftPriority("全部"); setDraftOwner("全部"); setDraftStatus("全部"); setPriorityFilter("全部"); setOwnerFilter("全部"); setStatusFilter("全部"); notify("筛选条件已重置"); }}>重置</Button><Button onClick={() => { setPriorityFilter(draftPriority); setOwnerFilter(draftOwner); setStatusFilter(draftStatus); setFilterOpen(false); notify("筛选条件已应用"); }}>应用筛选</Button></div>
    </Drawer>

    <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="创建工单">
      <div className="form-grid">
        <label className="field form-span-2"><span>工单标题</span><input className="input" value={form.title} onChange={e => setForm({...form,title:e.target.value})} placeholder="简要描述客户问题"/></label>
        <label className="field"><span>来源渠道</span><select className="select" value={form.source} onChange={e => setForm({...form,source:e.target.value})}>{["电话","企业微信","邮件","在线客服","客户门户"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="field"><span>工单类型</span><select className="select" value={form.type} onChange={e => setForm({...form,type:e.target.value})}>{["系统故障","数据问题","合同咨询","使用咨询","权限申请"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="field"><span>优先级</span><select className="select" value={form.priority} onChange={e => setForm({...form,priority:e.target.value as Priority})}>{["P0","P1","P2","P3"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="field"><span>关联客户</span><select className="select" value={form.customer} onChange={e => setForm({...form,customer:e.target.value})}>{["星瀚科技","明途教育","云帆物流"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="field form-span-2"><span>关联合同</span><select className="select" value={form.contract} onChange={e => setForm({...form,contract:e.target.value})}><option>CRM 企业版 2026</option><option>招生增长服务合同</option><option>暂无关联合同</option></select></label>
        <label className="field form-span-2"><span>问题描述</span><textarea value={form.description} onChange={e => setForm({...form,description:e.target.value})} placeholder="补充复现过程、影响范围和期望结果"/></label>
      </div>
      <button className="upload-zone compact-upload" onClick={() => notify("已选择示例附件 error-log.txt")}><FileUp size={18}/>上传附件或拖拽至此</button>
      <div className="form-actions"><Button variant="secondary" onClick={() => setCreateOpen(false)}>取消</Button><Button onClick={createTicket}>提交工单</Button></div>
    </Modal>

    <Drawer open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.id || "工单详情"} wide>
      {selected && <div className="stack">
        <div className="ticket-detail-lead"><div><div className="ticket-detail-badges"><Badge tone={priorityTone(selected.priority)}>{selected.priority}</Badge><Badge tone={statusTone(selected.status)}>{selected.status}</Badge></div><h3>{selected.title}</h3><p>{selected.customer} · {selected.type}</p></div><span className={`sla-callout sla-${selected.slaTone}`}><Clock3 size={15}/>{selected.sla}</span></div>
        <div className="detail-grid">{[["负责人",selected.owner],["来源","企业微信"],["关联合同","CRM 企业版 2026"],["创建时间","2026-09-14 09:18"]].map(([label,value])=><div className="detail-item" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
        <section><h3 className="section-title">处理时间线</h3><div className="timeline"><div className="timeline-item">客户反馈同步任务连续失败<small>09:18 · 在线客服转入</small></div><div className="timeline-item">系统自动标记为高优先级并通知负责人<small>09:19 · SLA 规则</small></div><div className="timeline-item">已定位为接口凭证过期，正在重新授权<small>09:42 · {selected.owner}</small></div>{notes.map((item,index)=><div className="timeline-item" key={`${item}-${index}`}>{item}<small>刚刚 · 内部备注</small></div>)}</div></section>
        <section><h3 className="section-title">内部备注</h3><div className="inline-composer"><input className="input" value={note} onChange={e => setNote(e.target.value)} placeholder="仅内部成员可见"/><Button onClick={() => { if (!note.trim()) return; setNotes(items => [...items,note]); setNote(""); notify("内部备注已添加"); }}><MessageSquarePlus size={14}/>添加</Button></div></section>
        <section className="solution-box"><span className="eyebrow">解决方案</span><strong>重新签发企微应用凭证，并执行近 24 小时增量数据补偿任务。</strong><p>预计 30 分钟内恢复同步，完成后由客户成功经理核对客户总数。</p><Button variant="secondary" onClick={() => notify("解决方案已进入编辑状态")}>编辑方案</Button></section>
        <section><h3 className="section-title">客户满意度</h3><div className="rating-row">{[1,2,3,4,5].map(value=><button aria-label={`${value} 星`} className={value <= rating ? "active" : ""} onClick={() => {setRating(value);notify(`满意度已更新为 ${value} 星`)}} key={value}><Star size={19}/></button>)}<span className="subtle">客户反馈：响应及时，处理过程清晰</span></div></section>
        <div className="form-actions ticket-actions"><Button variant="secondary" onClick={() => notify("工单已指派给技术支持组")}><UserRoundCheck size={14}/>指派</Button><Button variant="secondary" onClick={() => moveTicket(selected.id,"处理中")}>转为处理中</Button><Button onClick={() => moveTicket(selected.id,"已关闭")}>关闭工单</Button></div>
      </div>}
    </Drawer>
  </div>;
}
