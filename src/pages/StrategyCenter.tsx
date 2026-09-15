import { useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Activity, AlertTriangle, ArrowDown, ArrowRight, ArrowUp, BellRing, Building2,
  CheckCircle2, ChevronRight, CircleGauge, Clock3, FileClock, GitBranch, History,
  ListChecks, Play, Plus, Save, Send, ShieldCheck, TimerReset, UsersRound, Workflow, Zap,
} from "lucide-react";
import type { OutletContext } from "../components/AppShell";
import { Avatar, Badge, Button, Card, Drawer, Modal, PageHeader, Tabs } from "../components/ui";

type Tone = "neutral" | "blue" | "green" | "amber" | "red" | "violet";
type SlaRule = {
  id: number;
  scenario: string;
  targetValue: number;
  targetUnit: string;
  target: string;
  start: string;
  calendar: string;
  alert: string;
  escalation: string;
  compliance: number;
  enabled: boolean;
  channels: string[];
  pauses: string[];
};
type DistributionRule = {
  id: number;
  priority: number;
  name: string;
  method: string;
  team: string;
  assigned: number;
  enabled: boolean;
  source: string;
  campaign: string;
  region: string;
  industry: string;
  grade: string;
  threshold: number;
  capacity: number;
  duplicate: string;
  fallback: string;
};
type SimulatorLead = {
  source: string;
  campaign: string;
  region: string;
  industry: string;
  amount: number;
  grade: string;
};
type SimulationResult = {
  rule: string;
  reason: string;
  assignee: string;
  team: string;
  time: string;
  fallback: string;
  assigned: boolean;
};

const slaSeed: SlaRule[] = [
  { id: 1, scenario: "新客户线索", targetValue: 10, targetUnit: "分钟", target: "10 分钟内分配销售", start: "记录创建", calendar: "24×7", alert: "提前 2 分钟", escalation: "销售主管", compliance: 98.6, enabled: true, channels: ["站内信", "企业微信"], pauses: [] },
  { id: 2, scenario: "客户咨询", targetValue: 2, targetUnit: "小时", target: "2 小时内首次响应", start: "咨询接收", calendar: "工作日 9:00-18:00", alert: "提前 30 分钟", escalation: "负责人 + 主管", compliance: 96.2, enabled: true, channels: ["站内信", "企业微信"], pauses: ["等待客户"] },
  { id: 3, scenario: "商机跟进", targetValue: 3, targetUnit: "天", target: "3 天内必须跟进一次", start: "上次跟进", calendar: "24×7", alert: "提前 12 小时", escalation: "销售主管", compliance: 91.8, enabled: true, channels: ["站内信"], pauses: ["节假日"] },
  { id: 4, scenario: "客户投诉", targetValue: 24, targetUnit: "小时", target: "24 小时内处理", start: "投诉创建", calendar: "24×7", alert: "提前 4 小时", escalation: "客户成功负责人", compliance: 94.5, enabled: true, channels: ["站内信", "企业微信", "邮件"], pauses: ["等待客户"] },
  { id: 5, scenario: "工单", targetValue: 48, targetUnit: "小时", target: "48 小时内解决", start: "受理 / 创建", calendar: "24×7", alert: "提前 8 小时", escalation: "服务负责人", compliance: 88.9, enabled: false, channels: ["站内信", "企业微信"], pauses: ["等待客户", "节假日"] },
  { id: 6, scenario: "合同审批", targetValue: 2, targetUnit: "工作日", target: "2 个工作日内完成", start: "提交审批", calendar: "工作日 9:00-18:00", alert: "提前 4 工作小时", escalation: "审批人上级", compliance: 97.1, enabled: true, channels: ["站内信", "邮件"], pauses: ["审批补充"] },
];

const distributionSeed: DistributionRule[] = [
  { id: 1, priority: 1, name: "华东高价值线索", method: "最低负载", team: "华东大客户组", assigned: 42, enabled: true, source: "全部", campaign: "全部", region: "华东", industry: "全部", grade: "全部", threshold: 300000, capacity: 18, duplicate: "合并至原负责人", fallback: "转入华东公海池" },
  { id: 2, priority: 2, name: "教育行业专项", method: "加权分配", team: "教育行业组", assigned: 31, enabled: true, source: "全部", campaign: "全部", region: "全部", industry: "教育", grade: "A/B", threshold: 0, capacity: 22, duplicate: "合并至原负责人", fallback: "转入行业公海池" },
  { id: 3, priority: 3, name: "企业微信私域线索", method: "按区域/辖区", team: "私域增长组", assigned: 67, enabled: true, source: "企业微信", campaign: "私域", region: "全部", industry: "全部", grade: "全部", threshold: 0, capacity: 25, duplicate: "保留最新互动", fallback: "轮询至销售一部" },
  { id: 4, priority: 4, name: "默认轮询分配", method: "轮询", team: "销售公共队列", assigned: 86, enabled: true, source: "全部", campaign: "全部", region: "全部", industry: "全部", grade: "全部", threshold: 0, capacity: 20, duplicate: "合并至原负责人", fallback: "进入公海池" },
];

const capacitySeed = [
  { id: 1, name: "陈思远", team: "华东大客户组", region: "华东", active: 12, capacity: 18, weight: 35, available: true, today: 9 },
  { id: 2, name: "赵晨", team: "华东大客户组", region: "华东", active: 16, capacity: 20, weight: 30, available: true, today: 11 },
  { id: 3, name: "周妍", team: "教育行业组", region: "全国", active: 8, capacity: 22, weight: 25, available: true, today: 7 },
  { id: 4, name: "顾宁", team: "私域增长组", region: "华北", active: 15, capacity: 16, weight: 10, available: false, today: 10 },
  { id: 5, name: "林晓曼", team: "销售公共队列", region: "全国", active: 9, capacity: 20, weight: 20, available: true, today: 8 },
];

const executionSeed = [
  { id: "EX-0914-1028", time: "10:28:14", type: "线索分发", strategy: "华东高价值线索", object: "星瀚科技 · LD-2841", result: "分配给陈思远", duration: "0.8s", source: "线索创建", status: "成功", trace: ["读取线索属性：华东 / 企业服务 / ¥520,000", "命中优先级 #1：华东高价值线索", "陈思远当前负载 12/18，满足接收条件", "完成负责人写入并发送企业微信通知"] },
  { id: "EX-0914-1019", time: "10:19:42", type: "SLA", strategy: "客户咨询", object: "明途教育 · CS-817", result: "提前预警已发送", duration: "0.2s", source: "定时扫描", status: "预警", trace: ["咨询接收时间：08:50", "工作日历累计已用 1 小时 30 分钟", "距离 SLA 截止剩余 30 分钟", "已通知负责人周妍及其主管"] },
  { id: "EX-0914-1007", time: "10:07:03", type: "线索分发", strategy: "企业微信私域线索", object: "云帆物流 · LD-2839", result: "转入销售一部", duration: "1.1s", source: "企微同步", status: "回退", trace: ["命中企业微信私域线索", "私域增长组可用成员容量不足", "执行回退策略：轮询至销售一部", "分配给赵晨并记录容量占用"] },
  { id: "EX-0914-0942", time: "09:42:31", type: "SLA", strategy: "工单", object: "北辰零售 · TK-018", result: "已升级服务负责人", duration: "0.4s", source: "超时事件", status: "失败", trace: ["工单 SLA 截止时间：09:42", "当前状态：处理中", "规则当前已停用，但存量计时继续执行", "升级通知发送至服务负责人"] },
  { id: "EX-0914-0926", time: "09:26:18", type: "线索分发", strategy: "默认轮询分配", object: "启明咨询 · LD-2836", result: "分配给林晓曼", duration: "0.6s", source: "官网表单", status: "成功", trace: ["前三条规则均未匹配", "进入默认轮询队列", "林晓曼为队列下一顺位", "完成分配"] },
];

const changeLog = [
  { who: "林晓曼", what: "华东高价值线索 · 金额阈值", before: "¥200,000", after: "¥300,000", time: "2026-09-14 09:18", version: "v2.8 已发布" },
  { who: "陈思远", what: "客户咨询 · 预警时间", before: "提前 15 分钟", after: "提前 30 分钟", time: "2026-09-13 16:42", version: "v2.7 已发布" },
  { who: "系统", what: "工单 · 状态", before: "启用", after: "停用", time: "2026-09-12 11:06", version: "v2.6 已发布" },
  { who: "林晓曼", what: "销售容量 · 顾宁", before: "20 条/日", after: "16 条/日", time: "2026-09-11 15:28", version: "v2.5 已发布" },
];

const toneForCompliance = (value: number): Tone => value >= 95 ? "green" : value >= 90 ? "amber" : "red";
const toneForStatus = (status: string): Tone => status === "成功" ? "green" : status === "预警" || status === "回退" ? "amber" : "red";
const normalizePriorities = (rules: DistributionRule[]) => rules.map((rule, index) => ({ ...rule, priority: index + 1 }));
const gradeMatches = (configured: string, actual: string) => configured === "全部" || configured.split("/").includes(actual);
const ruleMatchesLead = (rule: DistributionRule, lead: SimulatorLead) =>
  (rule.source === "全部" || rule.source === lead.source) &&
  (rule.campaign === "全部" || rule.campaign === lead.campaign) &&
  (rule.region === "全部" || rule.region === lead.region) &&
  (rule.industry === "全部" || rule.industry === lead.industry) &&
  gradeMatches(rule.grade, lead.grade) &&
  lead.amount >= rule.threshold;
const describeCondition = (rule: DistributionRule) => {
  const conditions = [
    rule.source !== "全部" && `来源 = ${rule.source}`,
    rule.campaign !== "全部" && `活动渠道 = ${rule.campaign}`,
    rule.region !== "全部" && `区域 = ${rule.region}`,
    rule.industry !== "全部" && `行业 = ${rule.industry}`,
    rule.grade !== "全部" && `客户等级 ∈ ${rule.grade}`,
    rule.threshold > 0 && `预估金额 ≥ ¥${rule.threshold.toLocaleString()}`,
  ].filter(Boolean);
  return conditions.length ? conditions.join(" 且 ") : "未匹配更高优先级规则的全部线索";
};

export default function StrategyCenter() {
  const { notify } = useOutletContext<OutletContext>();
  const [activeTab, setActiveTab] = useState("SLA 规则");
  const [dirty, setDirty] = useState(false);
  const [slaRules, setSlaRules] = useState(slaSeed);
  const [selectedSlaId, setSelectedSlaId] = useState(1);
  const [slaEditing, setSlaEditing] = useState<SlaRule | null>(null);
  const [slaCreating, setSlaCreating] = useState(false);
  const [distributionRules, setDistributionRules] = useState(distributionSeed);
  const [ruleEditing, setRuleEditing] = useState<DistributionRule | null>(null);
  const [capacities, setCapacities] = useState(capacitySeed);
  const [changeOpen, setChangeOpen] = useState(false);
  const [executionType, setExecutionType] = useState("全部类型");
  const [executionStatus, setExecutionStatus] = useState("全部状态");
  const [selectedExecution, setSelectedExecution] = useState<(typeof executionSeed)[number] | null>(null);
  const [duplicateProtection, setDuplicateProtection] = useState(true);
  const [reclaimMinutes, setReclaimMinutes] = useState(30);
  const [publicPool, setPublicPool] = useState(true);
  const [simulator, setSimulator] = useState<SimulatorLead>({ source: "官网表单", campaign: "品牌官网", region: "华东", industry: "企业服务", amount: 520000, grade: "A" });
  const [simulation, setSimulation] = useState<SimulationResult | null>(null);

  const selectedSla = slaRules.find((rule) => rule.id === selectedSlaId) ?? slaRules[0];
  const filteredExecutions = useMemo(() => executionSeed.filter((item) =>
    (executionType === "全部类型" || item.type === executionType) &&
    (executionStatus === "全部状态" || item.status === executionStatus)
  ), [executionStatus, executionType]);

  const markDirty = (message?: string) => {
    setDirty(true);
    if (message) notify(message);
  };

  const publish = () => {
    setDirty(false);
    notify("策略 v2.9 已发布，变更将在 1 分钟内生效");
  };

  const saveSla = () => {
    if (!slaEditing) return;
    const next = {
      ...slaEditing,
      target: slaEditing.targetUnit === "工作日"
        ? `${slaEditing.targetValue} 个工作日内完成`
        : `${slaEditing.targetValue} ${slaEditing.targetUnit}内${slaEditing.scenario === "新客户线索" ? "分配销售" : slaEditing.scenario === "客户咨询" ? "首次响应" : slaEditing.scenario === "商机跟进" ? "必须跟进一次" : slaEditing.scenario === "工单" ? "解决" : "处理"}`,
    };
    setSlaRules((current) => slaCreating ? [...current, next] : current.map((rule) => rule.id === next.id ? next : rule));
    setSelectedSlaId(next.id);
    setSlaEditing(null);
    setSlaCreating(false);
    markDirty(`${next.scenario} SLA 规则已保存，等待发布`);
  };

  const openNewSla = () => {
    setSlaCreating(true);
    setSlaEditing({
      id: Math.max(...slaRules.map((rule) => rule.id)) + 1,
      scenario: "新建业务场景", targetValue: 4, targetUnit: "小时", target: "4 小时内处理",
      start: "记录创建", calendar: "工作日 9:00-18:00", alert: "提前 1 小时", escalation: "业务主管",
      compliance: 100, enabled: true, channels: ["站内信"], pauses: [],
    });
  };

  const moveRule = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= distributionRules.length) return;
    setDistributionRules((current) => {
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return normalizePriorities(next);
    });
    markDirty("规则优先级已调整，等待发布");
  };

  const saveDistributionRule = () => {
    if (!ruleEditing) return;
    const existingPriority = distributionRules.find((rule) => rule.id === ruleEditing.id)?.priority;
    const maxPriority = distributionRules.length + (existingPriority ? 0 : 1);
    const parsedPriority = Number.isFinite(ruleEditing.priority) ? Math.round(ruleEditing.priority) : maxPriority;
    const requestedPriority = Math.max(1, Math.min(maxPriority, parsedPriority));
    setDistributionRules((current) => {
      const withoutEditing = current.filter((rule) => rule.id !== ruleEditing.id);
      withoutEditing.splice(Math.min(requestedPriority - 1, withoutEditing.length), 0, { ...ruleEditing, priority: requestedPriority });
      return normalizePriorities(withoutEditing);
    });
    setRuleEditing(null);
    markDirty(existingPriority && existingPriority !== requestedPriority
      ? `${ruleEditing.name}已保存并调整至优先级 #${requestedPriority}`
      : `${ruleEditing.name}已保存，等待发布`);
  };

  const runSimulation = () => {
    const orderedRules = [...distributionRules].sort((a, b) => a.priority - b.priority);
    const skippedDisabled = orderedRules.filter((rule) => !rule.enabled && ruleMatchesLead(rule, simulator));
    const matchedRule = orderedRules.find((rule) => rule.enabled && ruleMatchesLead(rule, simulator));
    if (!matchedRule) {
      setSimulation({
        rule: "无可用匹配规则",
        reason: skippedDisabled.length
          ? `已跳过停用规则：${skippedDisabled.map((rule) => rule.name).join("、")}；其余启用规则均不匹配`
          : "当前启用规则均不匹配这条样例线索",
        assignee: "等待人工处理",
        team: "未进入销售队列",
        time: "不会自动分配",
        fallback: publicPool ? "建议进入公海池等待认领" : "公海池回退已关闭，请人工指定负责人",
        assigned: false,
      });
      notify("模拟完成：未找到可执行规则");
      return;
    }

    const teamMembers = capacities.filter((person) =>
      matchedRule.method !== "手动认领/公海池" &&
      person.team === matchedRule.team &&
      person.available &&
      person.active < Math.min(person.capacity, matchedRule.capacity) &&
      (matchedRule.method !== "按区域/辖区" || person.region === "全国" || person.region === simulator.region)
    );
    let selected = teamMembers[0];
    if (matchedRule.method === "最低负载") {
      selected = [...teamMembers].sort((a, b) => (a.active / a.capacity) - (b.active / b.capacity) || b.weight - a.weight)[0];
    } else if (matchedRule.method === "加权分配") {
      selected = [...teamMembers].sort((a, b) => b.weight - a.weight || a.active - b.active)[0];
    } else if (matchedRule.method === "轮询" && teamMembers.length) {
      selected = teamMembers[matchedRule.assigned % teamMembers.length];
    }

    const skippedNote = skippedDisabled.length ? `已跳过停用规则 ${skippedDisabled.map((rule) => `#${rule.priority} ${rule.name}`).join("、")}；` : "";
    const matchReason = `${skippedNote}命中 #${matchedRule.priority} ${matchedRule.name}：${describeCondition(matchedRule)}`;
    setSimulation({
      rule: matchedRule.name,
      reason: selected
        ? `${matchReason}。${selected.name} 当前负载 ${selected.active}/${Math.min(selected.capacity, matchedRule.capacity)}，可接收`
        : `${matchReason}。目标团队当前没有满足可用状态、区域与容量限制的销售`,
      assignee: selected?.name ?? "执行回退策略",
      team: selected?.team ?? matchedRule.team,
      time: selected ? "预计 1 秒内完成" : "等待回退处理",
      fallback: selected
        ? `容量不可用时：${matchedRule.fallback}`
        : `${matchedRule.fallback}${publicPool ? `；${reclaimMinutes} 分钟后重新尝试` : ""}`,
      assigned: Boolean(selected),
    });
    notify("模拟完成，未写入真实线索数据");
  };

  return (
    <div className="strategy-page">
      <div className="strategy-breadcrumb"><Building2 size={12} />企业设置<ChevronRight size={12} />策略配置中心</div>
      <PageHeader
        title="策略配置中心"
        description="统一配置服务时效、线索路由与自动化执行策略"
        actions={<>
          {dirty && <span className="unsaved-dot"><span />有未发布变更</span>}
          <Button variant="secondary" onClick={() => setChangeOpen(true)}><History size={14} />变更记录</Button>
          <Button onClick={publish} disabled={!dirty}><Send size={14} />发布策略</Button>
        </>}
      />

      <div className="strategy-metrics">
        <Card><span className="metric-symbol tone-blue"><Workflow size={17} /></span><div><small>启用策略</small><strong>{slaRules.filter((rule) => rule.enabled).length + distributionRules.filter((rule) => rule.enabled).length}</strong><span>/ {slaRules.length + distributionRules.length} 条</span></div></Card>
        <Card><span className="metric-symbol tone-green"><Zap size={17} /></span><div><small>今日触发</small><strong>1,286</strong><span>较昨日 +8.4%</span></div></Card>
        <Card><span className="metric-symbol tone-green"><CircleGauge size={17} /></span><div><small>SLA 达标率</small><strong>94.7%</strong><span>目标 95%</span></div></Card>
        <Card><span className="metric-symbol tone-amber"><UsersRound size={17} /></span><div><small>待分配线索</small><strong>12</strong><span>4 条接近回收</span></div></Card>
      </div>

      <Card className="strategy-workspace">
        <Tabs items={["SLA 规则", "线索分发", "执行记录"]} active={activeTab} onChange={setActiveTab} />

        {activeTab === "SLA 规则" && (
          <div className="strategy-tab-body">
            <div className="strategy-toolbar">
              <div><h2>SLA 服务时效规则</h2><p>按业务场景统一计时、预警与升级动作</p></div>
              <div className="strategy-toolbar-meta"><Badge tone="green">{slaRules.filter((rule) => rule.enabled).length} 条启用</Badge><span>今日平均达标率 94.5%</span><Button onClick={openNewSla}><Plus size={14} />新建 SLA 规则</Button></div>
            </div>
            <div className="table-panel strategy-table-wrap">
              <table className="data-table strategy-table sla-table">
                <thead><tr><th>场景</th><th>SLA 目标</th><th>计时起点</th><th>服务日历</th><th>预警时间</th><th>超时升级</th><th>今日达标率</th><th>状态</th><th>操作</th></tr></thead>
                <tbody>{slaRules.map((rule) => (
                  <tr className={selectedSlaId === rule.id ? "selected" : ""} key={rule.id} onClick={() => setSelectedSlaId(rule.id)}>
                    <td><span className="strategy-name"><span className={`strategy-status-dot ${rule.enabled ? "active" : ""}`} /><strong>{rule.scenario}</strong></span></td>
                    <td><strong>{rule.target}</strong></td><td>{rule.start}</td><td>{rule.calendar}</td><td>{rule.alert}</td><td>{rule.escalation}</td>
                    <td><span className="compliance-cell"><Badge tone={toneForCompliance(rule.compliance)}>{rule.compliance}%</Badge><span><i style={{ width: `${rule.compliance}%` }} /></span></span></td>
                    <td><label className="switch" onClick={(event) => event.stopPropagation()}><input aria-label={`${rule.enabled ? "停用" : "启用"}${rule.scenario} SLA 规则`} type="checkbox" checked={rule.enabled} onChange={() => { setSlaRules((current) => current.map((item) => item.id === rule.id ? { ...item, enabled: !item.enabled } : item)); markDirty(`${rule.scenario}已${rule.enabled ? "停用" : "启用"}`); }} /><span /></label></td>
                    <td><button className="link" onClick={(event) => { event.stopPropagation(); setSlaCreating(false); setSlaEditing({ ...rule }); }}>编辑</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>

            <div className="sla-detail-grid">
              <section className="strategy-section">
                <div className="strategy-section-head"><div><h3>{selectedSla.scenario} · 执行流程</h3><p>基于今日 10:20 的示例触发时间</p></div><Badge tone={selectedSla.enabled ? "green" : "neutral"}>{selectedSla.enabled ? "规则运行中" : "规则已停用"}</Badge></div>
                <div className="sla-flow">
                  {[
                    ["触发事件", selectedSla.start, "10:20"],
                    ["SLA 计时", selectedSla.target, "开始计时"],
                    ["提前预警", selectedSla.alert, selectedSla.scenario === "新客户线索" ? "10:28" : "截止前触发"],
                    ["超时升级", selectedSla.escalation, selectedSla.scenario === "新客户线索" ? "10:30" : "逾期立即执行"],
                  ].map(([title, detail, time], index) => <div className="sla-flow-step" key={title}><span>{index + 1}</span><div><strong>{title}</strong><p>{detail}</p><small>{time}</small></div>{index < 3 && <ArrowRight size={14} />}</div>)}
                </div>
                <div className="sla-policy-line"><Clock3 size={14} /><span>服务日历：{selectedSla.calendar}</span><BellRing size={14} /><span>通知：{selectedSla.channels.join("、")}</span><TimerReset size={14} /><span>暂停：{selectedSla.pauses.length ? selectedSla.pauses.join("、") : "不暂停"}</span></div>
              </section>
              <section className="strategy-section">
                <div className="strategy-section-head"><div><h3>今日 SLA 健康度</h3><p>按场景统计已完成事项</p></div><Badge tone="amber">1 项低于目标</Badge></div>
                <div className="sla-health">{slaRules.map((rule) => <div key={rule.id}><span>{rule.scenario}</span><div><i className={`health-${toneForCompliance(rule.compliance)}`} style={{ width: `${rule.compliance}%` }} /></div><strong>{rule.compliance}%</strong></div>)}</div>
              </section>
            </div>
          </div>
        )}

        {activeTab === "线索分发" && (
          <div className="strategy-tab-body">
            <div className="distribution-metrics">
              {[["今日新线索", "248", "+12.6%", "blue"], ["自动分配率", "95.2%", "236 条自动完成", "green"], ["平均分配耗时", "1.4s", "较昨日 -0.3s", "green"], ["待认领", "12", "4 条将在 10 分钟内回收", "amber"]].map(([label, value, detail, tone]) => <div key={label}><span>{label}</span><strong className={`text-${tone}`}>{value}</strong><small>{detail}</small></div>)}
            </div>
            <div className="distribution-layout">
              <section className="strategy-section rule-priority">
                <div className="strategy-section-head"><div><h3>分发规则优先级</h3><p>线索按从上至下顺序匹配，命中后停止</p></div><Button onClick={() => setRuleEditing({ id: Math.max(...distributionRules.map((rule) => rule.id)) + 1, priority: distributionRules.length + 1, name: "新建分发规则", method: "轮询", team: "销售公共队列", assigned: 0, enabled: true, source: "官网表单", campaign: "全部", region: "全部", industry: "全部", grade: "全部", threshold: 0, capacity: 20, duplicate: "合并至原负责人", fallback: "进入公海池" })}><Plus size={14} />新建规则</Button></div>
                <div className="priority-list">{distributionRules.map((rule, index) => (
                  <article className={!rule.enabled ? "disabled" : ""} key={rule.id}>
                    <span className="priority-number">{rule.priority}</span>
                    <div className="priority-copy"><strong>{rule.name}</strong><p title={describeCondition(rule)}>{describeCondition(rule)}</p><small><GitBranch size={11} />{rule.method}<span />{rule.team}</small></div>
                    <div className="priority-count"><strong>{rule.assigned}</strong><small>今日分配</small></div>
                    <label className="switch"><input aria-label={`${rule.enabled ? "停用" : "启用"}${rule.name}`} type="checkbox" checked={rule.enabled} onChange={() => { setDistributionRules((current) => current.map((item) => item.id === rule.id ? { ...item, enabled: !item.enabled } : item)); markDirty(`${rule.name}已${rule.enabled ? "停用" : "启用"}`); }} /><span /></label>
                    <div className="priority-actions"><button disabled={index === 0} aria-label={`上移${rule.name}`} onClick={() => moveRule(index, -1)}><ArrowUp size={13} /></button><button disabled={index === distributionRules.length - 1} aria-label={`下移${rule.name}`} onClick={() => moveRule(index, 1)}><ArrowDown size={13} /></button><button className="link" onClick={() => setRuleEditing({ ...rule })}>编辑</button></div>
                  </article>
                ))}</div>
              </section>

              <section className="strategy-section simulator-panel">
                <div className="strategy-section-head"><div><span className="simulator-kicker"><Play size={11} />LIVE SIMULATOR</span><h3>实时分发模拟器</h3><p>输入样例线索，验证匹配结果与回退路径</p></div><Badge tone="blue">不写入数据</Badge></div>
                <div className="simulator-form">
                  <label><span>线索来源</span><select className="select" value={simulator.source} onChange={(event) => setSimulator({ ...simulator, source: event.target.value })}>{["官网表单", "企业微信", "广告投放", "线下活动"].map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label><span>活动渠道</span><select className="select" value={simulator.campaign} onChange={(event) => setSimulator({ ...simulator, campaign: event.target.value })}>{["品牌官网", "私域", "搜索广告", "线下峰会"].map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label><span>区域</span><select className="select" value={simulator.region} onChange={(event) => setSimulator({ ...simulator, region: event.target.value })}>{["华东", "华北", "华南", "西南"].map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label><span>行业</span><select className="select" value={simulator.industry} onChange={(event) => setSimulator({ ...simulator, industry: event.target.value })}>{["企业服务", "教育", "零售", "金融"].map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label><span>预估金额</span><input className="input" type="number" value={simulator.amount} onChange={(event) => setSimulator({ ...simulator, amount: Number(event.target.value) })} /></label>
                  <label><span>客户等级</span><select className="select" value={simulator.grade} onChange={(event) => setSimulator({ ...simulator, grade: event.target.value })}>{["A", "B", "C", "D"].map((item) => <option key={item}>{item}</option>)}</select></label>
                  <Button onClick={runSimulation}><Play size={14} />模拟分发</Button>
                </div>
                {simulation ? <div className="simulation-result">
                  <div className="simulation-result-head"><span><CheckCircle2 size={16} /></span><div><small>{simulation.assigned ? "命中规则" : "模拟结果"}</small><strong>{simulation.rule}</strong></div><Badge tone={simulation.assigned ? "green" : "amber"}>{simulation.assigned ? "匹配成功" : "执行回退"}</Badge></div>
                  <p>{simulation.reason}</p>
                  <div className="simulation-assignee"><Avatar name={simulation.assignee} /><div><small>建议分配给</small><strong>{simulation.assignee} · {simulation.team}</strong></div><span>{simulation.time}</span></div>
                  <div className="fallback-line"><GitBranch size={13} /><span>{simulation.fallback}</span></div>
                </div> : <div className="simulation-empty"><CircleGauge size={24} /><strong>等待模拟</strong><p>修改任意线索属性后运行，查看逐级匹配结果。</p></div>}
              </section>
            </div>

            <section className="strategy-section capacity-section">
              <div className="strategy-section-head"><div><h3>销售容量与分配权重</h3><p>容量达到上限或不可用的成员将自动跳过</p></div><span className="subtle">权重合计 {capacities.reduce((sum, item) => sum + item.weight, 0)}%</span></div>
              <div className="table-panel">
                <table className="data-table capacity-table"><thead><tr><th>销售</th><th>团队 / 区域</th><th>当前活跃线索</th><th>每日容量</th><th>分配权重</th><th>可用状态</th><th>今日分配</th></tr></thead>
                  <tbody>{capacities.map((person) => <tr key={person.id}>
                    <td><span className="assignee"><Avatar name={person.name} /><strong>{person.name}</strong></span></td><td>{person.team}<small className="table-subline">{person.region}</small></td>
                    <td><span className={person.active / person.capacity > .85 ? "capacity-warning" : ""}>{person.active} / {person.capacity}</span></td>
                    <td><input aria-label={`${person.name}每日容量`} className="capacity-input" type="number" min="1" value={person.capacity} onChange={(event) => { setCapacities((current) => current.map((item) => item.id === person.id ? { ...item, capacity: Number(event.target.value) } : item)); markDirty(); }} /></td>
                    <td><div className="weight-control"><input aria-label={`${person.name}分配权重`} type="range" min="0" max="100" value={person.weight} onChange={(event) => { setCapacities((current) => current.map((item) => item.id === person.id ? { ...item, weight: Number(event.target.value) } : item)); markDirty(); }} /><span>{person.weight}%</span></div></td>
                    <td><label className="switch"><input aria-label={`${person.available ? "停用" : "启用"}${person.name}`} type="checkbox" checked={person.available} onChange={() => { setCapacities((current) => current.map((item) => item.id === person.id ? { ...item, available: !item.available } : item)); markDirty(`${person.name}可用状态已更新`); }} /><span /></label></td><td><strong>{person.today}</strong> 条</td>
                  </tr>)}</tbody>
                </table>
              </div>
            </section>

            <section className="distribution-config">
              <label><span><ShieldCheck size={15} /><strong>重复线索保护</strong><small>手机号或企微 UnionID 重复时合并记录</small></span><span className="switch"><input aria-label="重复线索保护" type="checkbox" checked={duplicateProtection} onChange={() => { setDuplicateProtection(!duplicateProtection); markDirty("重复线索保护已更新"); }} /><span /></span></label>
              <label><span><TimerReset size={15} /><strong>超时自动回收</strong><small>销售未接受后重新进入分配队列</small></span><span className="config-inline"><input aria-label="超时自动回收分钟数" className="capacity-input" type="number" min="1" value={reclaimMinutes} onChange={(event) => { setReclaimMinutes(Number(event.target.value)); markDirty(); }} />分钟</span></label>
              <label><span><UsersRound size={15} /><strong>公海池回退</strong><small>全部成员满载时保留线索并等待认领</small></span><span className="switch"><input aria-label="公海池回退" type="checkbox" checked={publicPool} onChange={() => { setPublicPool(!publicPool); markDirty("公海池回退已更新"); }} /><span /></span></label>
            </section>
          </div>
        )}

        {activeTab === "执行记录" && (
          <div className="strategy-tab-body">
            <div className="strategy-toolbar execution-toolbar">
              <div><h2>自动化执行记录</h2><p>追踪规则匹配、执行结果与完整链路</p></div>
              <div><select className="select" value={executionType} onChange={(event) => setExecutionType(event.target.value)}><option>全部类型</option><option>SLA</option><option>线索分发</option></select><select className="select" value={executionStatus} onChange={(event) => setExecutionStatus(event.target.value)}><option>全部状态</option><option>成功</option><option>预警</option><option>回退</option><option>失败</option></select></div>
            </div>
            <div className="execution-summary">
              <span><CheckCircle2 size={14} />今日成功 <strong>1,247</strong></span><span><AlertTriangle size={14} />预警 / 回退 <strong>35</strong></span><span><Activity size={14} />执行成功率 <strong>99.7%</strong></span>
            </div>
            <div className="table-panel strategy-table-wrap">
              <table className="data-table strategy-table execution-table"><thead><tr><th>时间</th><th>类型</th><th>策略 / 规则</th><th>执行对象</th><th>执行结果</th><th>耗时</th><th>触发来源</th><th>状态</th><th>详情</th></tr></thead>
                <tbody>{filteredExecutions.map((item) => <tr key={item.id}><td><strong>{item.time}</strong><small className="table-subline">{item.id}</small></td><td><Badge tone={item.type === "SLA" ? "violet" : "blue"}>{item.type}</Badge></td><td><strong>{item.strategy}</strong></td><td>{item.object}</td><td>{item.result}</td><td>{item.duration}</td><td>{item.source}</td><td><Badge tone={toneForStatus(item.status)}>{item.status}</Badge></td><td><button className="link" onClick={() => setSelectedExecution(item)}>查看链路</button></td></tr>)}</tbody>
              </table>
              {!filteredExecutions.length && <div className="empty-state"><strong>暂无匹配记录</strong><p>请调整类型或状态筛选条件。</p></div>}
            </div>
          </div>
        )}
      </Card>

      <Modal open={Boolean(slaEditing)} onClose={() => { setSlaEditing(null); setSlaCreating(false); }} title={slaCreating ? "新建 SLA 规则" : `编辑 SLA · ${slaEditing?.scenario ?? ""}`}>
        {slaEditing && <div className="form-grid strategy-form">
          <label className="field form-span-2"><span>场景名称</span><input className="input" value={slaEditing.scenario} onChange={(event) => setSlaEditing({ ...slaEditing, scenario: event.target.value })} /></label>
          <label className="field"><span>目标时长</span><input className="input" type="number" min="1" value={slaEditing.targetValue} onChange={(event) => setSlaEditing({ ...slaEditing, targetValue: Number(event.target.value) })} /></label>
          <label className="field"><span>单位</span><select className="select" value={slaEditing.targetUnit} onChange={(event) => setSlaEditing({ ...slaEditing, targetUnit: event.target.value })}>{["分钟", "小时", "天", "工作日"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="field"><span>计时起点</span><select className="select" value={slaEditing.start} onChange={(event) => setSlaEditing({ ...slaEditing, start: event.target.value })}>{["记录创建", "咨询接收", "上次跟进", "投诉创建", "受理 / 创建", "提交审批"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="field"><span>服务日历</span><select className="select" value={slaEditing.calendar} onChange={(event) => setSlaEditing({ ...slaEditing, calendar: event.target.value })}><option>24×7</option><option>工作日 9:00-18:00</option></select></label>
          <label className="field"><span>预警时间</span><input className="input" value={slaEditing.alert} onChange={(event) => setSlaEditing({ ...slaEditing, alert: event.target.value })} /></label>
          <label className="field"><span>超时升级对象</span><input className="input" value={slaEditing.escalation} onChange={(event) => setSlaEditing({ ...slaEditing, escalation: event.target.value })} /></label>
          <fieldset className="strategy-fieldset form-span-2"><legend>通知渠道</legend>{["站内信", "企业微信", "邮件"].map((channel) => <label key={channel}><input type="checkbox" checked={slaEditing.channels.includes(channel)} onChange={() => setSlaEditing({ ...slaEditing, channels: slaEditing.channels.includes(channel) ? slaEditing.channels.filter((item) => item !== channel) : [...slaEditing.channels, channel] })} />{channel}</label>)}</fieldset>
          <fieldset className="strategy-fieldset form-span-2"><legend>暂停条件</legend>{["等待客户", "节假日", "审批补充"].map((pause) => <label key={pause}><input type="checkbox" checked={slaEditing.pauses.includes(pause)} onChange={() => setSlaEditing({ ...slaEditing, pauses: slaEditing.pauses.includes(pause) ? slaEditing.pauses.filter((item) => item !== pause) : [...slaEditing.pauses, pause] })} />{pause}</label>)}</fieldset>
          <label className="strategy-enable form-span-2"><span><strong>启用规则</strong><small>保存后需发布才会影响新触发事件</small></span><span className="switch"><input type="checkbox" checked={slaEditing.enabled} onChange={() => setSlaEditing({ ...slaEditing, enabled: !slaEditing.enabled })} /><span /></span></label>
          <div className="form-actions form-span-2"><Button variant="secondary" onClick={() => { setSlaEditing(null); setSlaCreating(false); }}>取消</Button><Button onClick={saveSla}><Save size={14} />保存规则</Button></div>
        </div>}
      </Modal>

      <Drawer open={Boolean(ruleEditing)} onClose={() => setRuleEditing(null)} title={distributionRules.some((rule) => rule.id === ruleEditing?.id) ? "编辑分发规则" : "新建分发规则"}>
        {ruleEditing && <div className="drawer-form strategy-form">
          <div className="form-grid">
            <label className="field"><span>规则名称</span><input className="input" value={ruleEditing.name} onChange={(event) => setRuleEditing({ ...ruleEditing, name: event.target.value })} /></label>
            <label className="field"><span>优先级</span><input className="input" type="number" min="1" max={distributionRules.length + (distributionRules.some((rule) => rule.id === ruleEditing.id) ? 0 : 1)} value={ruleEditing.priority} onChange={(event) => setRuleEditing({ ...ruleEditing, priority: Number(event.target.value) })} /><small className="field-hint">与现有优先级冲突时，规则将插入该位置并顺延后续规则。</small></label>
            <label className="field"><span>线索来源</span><select className="select" value={ruleEditing.source} onChange={(event) => setRuleEditing({ ...ruleEditing, source: event.target.value })}>{["全部", "官网表单", "企业微信", "广告投放", "线下活动"].map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="field"><span>活动 / 渠道</span><select className="select" value={ruleEditing.campaign} onChange={(event) => setRuleEditing({ ...ruleEditing, campaign: event.target.value })}>{["全部", "品牌官网", "私域", "搜索广告", "线下峰会"].map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="field"><span>区域</span><select className="select" value={ruleEditing.region} onChange={(event) => setRuleEditing({ ...ruleEditing, region: event.target.value })}>{["全部", "华东", "华北", "华南", "西南"].map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="field"><span>行业</span><select className="select" value={ruleEditing.industry} onChange={(event) => setRuleEditing({ ...ruleEditing, industry: event.target.value })}>{["全部", "企业服务", "教育", "零售", "金融"].map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="field"><span>客户等级</span><select className="select" value={ruleEditing.grade} onChange={(event) => setRuleEditing({ ...ruleEditing, grade: event.target.value })}>{["全部", "A", "A/B", "B", "C"].map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="field"><span>金额门槛</span><input className="input" type="number" value={ruleEditing.threshold} onChange={(event) => setRuleEditing({ ...ruleEditing, threshold: Number(event.target.value) })} /></label>
            <label className="field"><span>分配方式</span><select className="select" value={ruleEditing.method} onChange={(event) => setRuleEditing({ ...ruleEditing, method: event.target.value })}>{["轮询", "加权分配", "按区域/辖区", "最低负载", "手动认领/公海池"].map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="field form-span-2"><span>目标部门 / 团队</span><select className="select" value={ruleEditing.team} onChange={(event) => setRuleEditing({ ...ruleEditing, team: event.target.value })}>{["华东大客户组", "教育行业组", "私域增长组", "销售公共队列"].map((item) => <option key={item}>{item}</option>)}</select></label>
            <label className="field"><span>单销售每日容量</span><input className="input" type="number" min="1" value={ruleEditing.capacity} onChange={(event) => setRuleEditing({ ...ruleEditing, capacity: Number(event.target.value) })} /></label>
            <label className="field"><span>重复线索处理</span><select className="select" value={ruleEditing.duplicate} onChange={(event) => setRuleEditing({ ...ruleEditing, duplicate: event.target.value })}><option>合并至原负责人</option><option>保留最新互动</option><option>阻止创建</option></select></label>
            <label className="field form-span-2"><span>无人可用时回退</span><select className="select" value={ruleEditing.fallback} onChange={(event) => setRuleEditing({ ...ruleEditing, fallback: event.target.value })}><option>进入公海池</option><option>转入华东公海池</option><option>转入行业公海池</option><option>轮询至销售一部</option></select></label>
          </div>
          <label className="strategy-enable"><span><strong>启用规则</strong><small>停用后将跳过该优先级</small></span><span className="switch"><input aria-label="启用分发规则" type="checkbox" checked={ruleEditing.enabled} onChange={() => setRuleEditing({ ...ruleEditing, enabled: !ruleEditing.enabled })} /><span /></span></label>
          <div className="form-actions"><Button variant="secondary" onClick={() => setRuleEditing(null)}>取消</Button><Button onClick={saveDistributionRule}><Save size={14} />保存规则</Button></div>
        </div>}
      </Drawer>

      <Drawer open={changeOpen} onClose={() => setChangeOpen(false)} title="策略变更记录" wide>
        <div className="audit-summary"><FileClock size={18} /><div><strong>当前线上版本 v2.8</strong><small>所有配置变更均记录操作人、差异与发布版本</small></div></div>
        <div className="audit-list">{changeLog.map((row) => <article key={`${row.time}-${row.what}`}><span className="audit-dot" /><div className="audit-main"><strong>{row.who} 修改了 {row.what}</strong><p><span className="audit-before">{row.before}</span><ChevronRight size={12} /><span className="audit-after">{row.after}</span></p><small>{row.time} · {row.version}</small></div></article>)}</div>
      </Drawer>

      <Drawer open={Boolean(selectedExecution)} onClose={() => setSelectedExecution(null)} title="执行链路详情">
        {selectedExecution && <div className="execution-detail">
          <div className="execution-detail-head"><span className={`metric-symbol tone-${toneForStatus(selectedExecution.status)}`}><ListChecks size={17} /></span><div><Badge tone={toneForStatus(selectedExecution.status)}>{selectedExecution.status}</Badge><h3>{selectedExecution.strategy}</h3><p>{selectedExecution.object} · {selectedExecution.id}</p></div></div>
          <div className="detail-grid">{[["触发时间", selectedExecution.time], ["执行耗时", selectedExecution.duration], ["触发来源", selectedExecution.source], ["执行结果", selectedExecution.result]].map(([label, value]) => <div className="detail-item" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
          <h3 className="section-title">执行轨迹</h3>
          <div className="execution-trace">{selectedExecution.trace.map((step, index) => <div key={step}><span>{index + 1}</span><div><strong>{step}</strong><small>+{(index * .2).toFixed(1)}s</small></div></div>)}</div>
        </div>}
      </Drawer>
    </div>
  );
}
