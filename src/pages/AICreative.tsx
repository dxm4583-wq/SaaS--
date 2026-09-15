import { useEffect, useMemo, useRef, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Archive, Check, Clipboard, Copy, FilePenLine, Image, Library, Mail, Palette,
  Play, Plus, RefreshCw, Save, Search, Sparkles, Trash2, Video, WandSparkles,
} from "lucide-react";
import type { OutletContext } from "../components/AppShell";
import { Badge, Button, Card, Modal } from "../components/ui";

type CreativeTab = "智能创作" | "海报生成" | "视频脚本" | "内容优化" | "AI 素材库";
type AssetType = "文案" | "海报" | "视频脚本" | "优化稿";
type PosterConfig = {
  kind: "poster";
  theme: string;
  course: string;
  offer: string;
  date: string;
  teacher: string;
  qr: string;
  template: string;
  size: string;
  prompt: string;
};
type VideoConfig = {
  kind: "video";
  course: string;
  goal: string;
  scriptType: string;
  duration: string;
  platform: string;
  version: number;
};
type CopyConfig = {
  kind: "copy";
  product: string;
  sellingPoint: string;
  theme: string;
  audience: string;
  platform: string;
  tone: string;
  length: string;
};
type OptimizeConfig = { kind: "optimize"; original: string; optimization: string };
type AssetSourceConfig = PosterConfig | VideoConfig | CopyConfig | OptimizeConfig;
type Asset = {
  id: string;
  title: string;
  type: AssetType;
  platform: string;
  content: string;
  createdAt: string;
  uses: number;
  leads: number;
  conversions: number;
  tags: string[];
  creator: string;
  createdAtISO: string;
  sourceConfig?: AssetSourceConfig;
};
type PosterSize = "square_hd" | "landscape_16_9" | "portrait_4_3" | "portrait_16_9";

const ASSET_KEY = "growth-ai-creative-assets-v1";
const tabs: Array<{ label: CreativeTab; icon: typeof Sparkles }> = [
  { label: "智能创作", icon: WandSparkles },
  { label: "海报生成", icon: Image },
  { label: "视频脚本", icon: Video },
  { label: "内容优化", icon: FilePenLine },
  { label: "AI 素材库", icon: Library },
];
const platforms = ["公众号文章", "朋友圈", "短信", "邮件", "小红书笔记", "抖音脚本"];
const channels = ["公众号", "朋友圈", "小红书", "抖音"];
const initialAssets: Asset[] = [
  { id: "asset-1", title: "CPA 冲刺班最后 30 天", type: "文案", platform: "公众号", content: "最后 30 天，把会计、审计和财管的高频考点一次串联。", createdAt: "09-15 10:28", uses: 18, leads: 126, conversions: 21, tags: ["CPA", "冲刺"], creator: "林晓曼", createdAtISO: "2026-09-15T10:28:00" },
  {
    id: "asset-2", title: "初级会计早鸟海报", type: "海报", platform: "朋友圈", content: "2027 初级会计早鸟计划，双科联报立减 600 元。", createdAt: "09-14 16:42", uses: 31, leads: 208, conversions: 34, tags: ["初级会计", "早鸟"], creator: "赵晨", createdAtISO: "2026-09-14T16:42:00",
    sourceConfig: { kind: "poster", theme: "2027 初级会计早鸟计划", course: "初级会计双科畅学班", offer: "双科联报立减 600 元", date: "09.15 - 09.30", teacher: "晓曼名师团 · 12 年教研经验", qr: "扫码领取备考规划", template: "课程海报", size: "朋友圈", prompt: "Professional Chinese accounting education early bird course poster" },
  },
  {
    id: "asset-3", title: "中级三科联报口播", type: "视频脚本", platform: "抖音", content: "为什么中级会计三科一定要一起规划？", createdAt: "09-13 14:10", uses: 12, leads: 89, conversions: 13, tags: ["中级会计", "口播"], creator: "林晓曼", createdAtISO: "2026-09-13T14:10:00",
    sourceConfig: { kind: "video", course: "中级会计三科联报班", goal: "解释三科联报的备考效率，吸引在职考生领取试听课。", scriptType: "知识口播", duration: "60 秒", platform: "抖音", version: 1 },
  },
];
const copyVersions = [
  {
    title: "CPA 冲刺黄金 30 天：这一次，把失分点变成得分点",
    body: "距离 CPA 考试只剩最后冲刺期。晓曼财经 CPA 冲刺班聚焦会计、审计、财管高频考点，用「考点串讲 + 真题拆解 + 模考复盘」帮你压缩无效复习。\n\n现在报名，多科联报立减 800 元，并赠送 3 次一对一模考诊断。名额仅限 200 人，满额即止。",
  },
  {
    title: "别再盲目刷题，CPA 冲刺班带你抓住真正的得分点",
    body: "基础学完却不会做题？模考分数始终卡住？30 天冲刺方案按章节定位薄弱点，每周一次实战模考，班主任全程追踪完成率。\n\n本周报名享多科联报优惠，先试听，再决定。",
  },
  {
    title: "CPA 倒计时 30 天，冲刺计划今天开始",
    body: "30 天完成三轮：高频考点重构、经典题型突破、全真模考复盘。适合有基础但复习节奏混乱、需要短期提分的在职考生。\n\n今日锁定席位，领取专属备考诊断与冲刺资料包。",
  },
];
const posterSizeMap: Record<string, PosterSize> = {
  "朋友圈": "square_hd",
  "公众号头图": "landscape_16_9",
  "小红书竖图": "portrait_4_3",
  "抖音封面": "portrait_16_9",
};

function legacySourceConfig(asset: Asset): AssetSourceConfig | undefined {
  if (asset.type === "海报") {
    return {
      kind: "poster",
      theme: asset.title.replace(/海报$/, ""),
      course: asset.title.includes("初级") ? "初级会计双科畅学班" : "CPA 冲刺班",
      offer: asset.content || "限时报名立减 600 元",
      date: "09.15 - 09.30",
      teacher: "晓曼名师团 · 12 年教研经验",
      qr: "扫码领取备考规划",
      template: "课程海报",
      size: asset.platform === "公众号" ? "公众号头图" : "朋友圈",
      prompt: `Professional Chinese accounting education course poster, ${asset.title}, ${asset.content}`,
    };
  }
  if (asset.type === "视频脚本") {
    return {
      kind: "video",
      course: asset.title.replace(/口播|脚本/g, "") || "中级会计三科联报班",
      goal: asset.content || "讲解课程价值并引导领取试听课。",
      scriptType: asset.title.includes("口播") ? "知识口播" : "剧情",
      duration: "60 秒",
      platform: asset.platform || "抖音",
      version: 1,
    };
  }
  return undefined;
}

function loadAssets() {
  try {
    const stored = JSON.parse(localStorage.getItem(ASSET_KEY) ?? "[]") as Asset[];
    return Array.isArray(stored) && stored.length ? stored.map((asset) => ({
      ...asset,
      tags: asset.tags ?? [asset.type, asset.platform],
      creator: asset.creator ?? "林晓曼",
      createdAtISO: asset.createdAtISO ?? "2026-09-15T00:00:00",
      sourceConfig: asset.sourceConfig ?? legacySourceConfig(asset),
    })) : initialAssets;
  } catch {
    return initialAssets;
  }
}

function posterUrl(prompt: string, size: PosterSize) {
  return `https://copilot-cn.bytedance.net/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${size}`;
}

async function copyText(text: string, notify: (message: string) => void, label: string) {
  try {
    await navigator.clipboard.writeText(text);
    notify(`${label}已复制到剪贴板`);
  } catch {
    notify(`${label}复制失败，请检查浏览器剪贴板权限`);
  }
}

function GeneratedPoster({
  url,
  alt,
  index,
  config,
  onReady,
}: {
  url: string;
  alt: string;
  index: number;
  config: Pick<PosterConfig, "theme" | "course" | "offer" | "date" | "teacher" | "qr">;
  onReady: () => void;
}) {
  const [status, setStatus] = useState<"syncing" | "loaded" | "fallback">("syncing");
  const [run, setRun] = useState(0);
  const timerRef = useRef<number>();
  const readyRef = useRef(false);

  useEffect(() => {
    setStatus("syncing");
    setRun(0);
    readyRef.current = false;
    const readyTimer = window.setTimeout(() => {
      if (!readyRef.current) {
        setStatus("fallback");
        readyRef.current = true;
        onReady();
      }
    }, 2200);
    return () => {
      window.clearTimeout(readyTimer);
      window.clearTimeout(timerRef.current);
    };
  }, [url]);

  const markReady = (event: React.SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    const isTemporaryDefault = image.naturalWidth === 1832 && image.naturalHeight === 1832;
    setStatus(isTemporaryDefault ? "fallback" : "loaded");
    if (!readyRef.current) {
      readyRef.current = true;
      onReady();
    }
    if (isTemporaryDefault && run < 2) {
      timerRef.current = window.setTimeout(() => setRun((value) => value + 1), 4500);
    }
  };

  return <figure className={`poster-composite poster-${index ? "warm" : "blue"} ${status}`}>
    <img
      key={`${url}-${run}`}
      src={`${url}&preview_attempt=${run}`}
      alt={alt}
      onLoad={markReady}
      onError={() => {
        setStatus("fallback");
        if (!readyRef.current) {
          readyRef.current = true;
          onReady();
        }
        if (run < 2) timerRef.current = window.setTimeout(() => setRun((value) => value + 1), 3000);
      }}
    />
    <div className="poster-art" aria-label={`${alt}版式预览`}>
      <header><span>晓曼财经</span><small>{config.teacher}</small></header>
      <div className="poster-copy">
        <span className="poster-label">{index ? "限时招募" : "2027 备考计划"}</span>
        <h3>{config.theme}</h3>
        <p>{config.course}</p>
        <strong>{config.offer}</strong>
      </div>
      <footer>
        <div><span>{config.date}</span><small>{config.qr}</small></div>
        <i aria-hidden="true"><b/><b/><b/><b/><b/><b/><b/><b/><b/></i>
      </footer>
    </div>
    <figcaption><span className={`poster-sync-dot ${status}`}/>{status === "loaded" ? "AI 图像已载入" : status === "syncing" ? "版式已就绪 · AI 图像同步中" : "版式预览可用 · 后台继续同步"}</figcaption>
  </figure>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="creative-field"><span>{label}</span>{children}</label>;
}

export default function AICreative() {
  const { notify } = useOutletContext<OutletContext>();
  const [tab, setTab] = useState<CreativeTab>("智能创作");
  const [assets, setAssets] = useState<Asset[]>(loadAssets);
  const [platform, setPlatform] = useState("公众号文章");
  const [product, setProduct] = useState("CPA 冲刺班");
  const [sellingPoint, setSellingPoint] = useState("30 天高频考点串讲、真题拆解、模考复盘");
  const [theme, setTheme] = useState("多科联报限时立减 800 元");
  const [audience, setAudience] = useState("有基础、需要短期提分的在职考生");
  const [tone, setTone] = useState("专业");
  const [length, setLength] = useState("中");
  const [versionCount, setVersionCount] = useState("3");
  const [activeVersion, setActiveVersion] = useState(0);
  const [generated, setGenerated] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [channel, setChannel] = useState("公众号");
  const [appliedTitle, setAppliedTitle] = useState("");
  const [emailVariant, setEmailVariant] = useState<"A" | "B">("A");
  const [posterTemplate, setPosterTemplate] = useState("课程海报");
  const [posterSize, setPosterSize] = useState("朋友圈");
  const [posterTheme, setPosterTheme] = useState("2027 初级会计早鸟计划");
  const [posterCourse, setPosterCourse] = useState("初级会计双科畅学班");
  const [posterOffer, setPosterOffer] = useState("双科联报立减 600 元");
  const [posterDate, setPosterDate] = useState("09.15 - 09.30");
  const [posterTeacher, setPosterTeacher] = useState("晓曼名师团 · 12 年教研经验");
  const [posterQr, setPosterQr] = useState("扫码领取备考规划");
  const [posterBatch, setPosterBatch] = useState(1);
  const [readyPosters, setReadyPosters] = useState<number[]>([]);
  const [scriptType, setScriptType] = useState("知识口播");
  const [scriptVersion, setScriptVersion] = useState(1);
  const [scriptCourse, setScriptCourse] = useState("中级会计三科联报班");
  const [scriptGoal, setScriptGoal] = useState("解释三科联报的备考效率，吸引在职考生领取试听课。");
  const [scriptDuration, setScriptDuration] = useState("60 秒");
  const [scriptPlatform, setScriptPlatform] = useState("抖音");
  const [original, setOriginal] = useState("CPA 考试快到了，我们有一个冲刺班，老师会讲重点，还有模考。现在报名有优惠。");
  const [optimized, setOptimized] = useState("");
  const [optimization, setOptimization] = useState("转化率优化");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("全部类型");
  const [platformFilter, setPlatformFilter] = useState("全部平台");
  const [creatorFilter, setCreatorFilter] = useState("全部创建人");
  const [timeFilter, setTimeFilter] = useState("最近 30 天");
  const [tagFilter, setTagFilter] = useState("全部标签");
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [deleteAsset, setDeleteAsset] = useState<Asset | null>(null);

  const persistAssets = (next: Asset[]) => {
    setAssets(next);
    localStorage.setItem(ASSET_KEY, JSON.stringify(next));
  };
  const saveAsset = (type: AssetType, title: string, content: string, targetPlatform = platform, sourceConfig?: AssetSourceConfig) => {
    const next: Asset = {
      id: `asset-${Date.now()}`,
      title,
      type,
      platform: targetPlatform,
      content,
      createdAt: new Date().toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
      uses: 0,
      leads: 0,
      conversions: 0,
      tags: [type, targetPlatform, product.replace("班", "")],
      creator: "林晓曼",
      createdAtISO: new Date().toISOString(),
      sourceConfig,
    };
    persistAssets([next, ...assets]);
    notify(`已保存到 AI 素材库：${title}`);
  };
  const generateCopy = () => {
    setGenerating(true);
    window.setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
      setActiveVersion((activeVersion + 1) % copyVersions.length);
      notify("已生成 3 个渠道文案版本");
    }, 650);
  };
  const filteredAssets = useMemo(() => assets.filter((asset) => {
    const matchesSearch = `${asset.title}${asset.content}${asset.platform}${asset.tags.join("")}`.toLowerCase().includes(search.toLowerCase());
    const days = timeFilter === "最近 7 天" ? 7 : timeFilter === "最近 30 天" ? 30 : Number.POSITIVE_INFINITY;
    const age = (new Date("2026-09-15T23:59:59").getTime() - new Date(asset.createdAtISO).getTime()) / 86400000;
    return matchesSearch
      && (typeFilter === "全部类型" || asset.type === typeFilter)
      && (platformFilter === "全部平台" || asset.platform === platformFilter)
      && (creatorFilter === "全部创建人" || asset.creator === creatorFilter)
      && (tagFilter === "全部标签" || asset.tags.includes(tagFilter))
      && age <= days;
  }), [assets, creatorFilter, platformFilter, search, tagFilter, timeFilter, typeFilter]);
  const posterPrompts = useMemo(() => [
    `Realistic premium Chinese accounting education ${posterTemplate}, ${posterTheme}, course ${posterCourse}, offer ${posterOffer}, event date ${posterDate}, instructor ${posterTeacher}, QR caption ${posterQr}, navy and electric blue editorial layout, confident young Chinese finance professional studying, clear Chinese typography area, conversion focused commercial design, no watermark, batch ${posterBatch}`,
    `Realistic professional Chinese training ${posterTemplate}, ${posterTheme}, course ${posterCourse}, offer ${posterOffer}, event date ${posterDate}, instructor ${posterTeacher}, QR caption ${posterQr}, warm red and cream campaign layout, focused Chinese accounting student with books, premium commercial photography, clear typography area, no watermark, batch ${posterBatch}`,
  ], [posterBatch, posterCourse, posterDate, posterOffer, posterQr, posterTeacher, posterTemplate, posterTheme]);
  const activePosterSize = posterSizeMap[posterSize];
  const currentPosterConfig = (prompt: string): PosterConfig => ({
    kind: "poster",
    theme: posterTheme,
    course: posterCourse,
    offer: posterOffer,
    date: posterDate,
    teacher: posterTeacher,
    qr: posterQr,
    template: posterTemplate,
    size: posterSize,
    prompt,
  });
  const reuseAsset = (asset: Asset) => {
    persistAssets(assets.map((item) => item.id === asset.id ? { ...item, uses: item.uses + 1 } : item));
    const config = asset.sourceConfig;
    if (config?.kind === "poster") {
      setPosterTheme(config.theme);
      setPosterCourse(config.course);
      setPosterOffer(config.offer);
      setPosterDate(config.date);
      setPosterTeacher(config.teacher);
      setPosterQr(config.qr);
      setPosterTemplate(config.template);
      setPosterSize(config.size);
      setReadyPosters([]);
      setPosterBatch((value) => value + 1);
      setTab("海报生成");
    } else if (config?.kind === "video") {
      setScriptCourse(config.course);
      setScriptGoal(config.goal);
      setScriptType(config.scriptType);
      setScriptDuration(config.duration);
      setScriptPlatform(config.platform);
      setScriptVersion(config.version);
      setTab("视频脚本");
    } else if (config?.kind === "copy") {
      setProduct(config.product);
      setSellingPoint(config.sellingPoint);
      setTheme(config.theme);
      setAudience(config.audience);
      setPlatform(config.platform);
      setTone(config.tone);
      setLength(config.length);
      setAppliedTitle(asset.title);
      setTab("智能创作");
    } else if (config?.kind === "optimize") {
      setOriginal(config.original);
      setOptimization(config.optimization);
      setTab("内容优化");
    } else {
      setProduct(asset.title);
      setSellingPoint(asset.content);
      setOriginal(asset.content);
      setTab(asset.type === "视频脚本" ? "视频脚本" : asset.type === "海报" ? "海报生成" : asset.type === "优化稿" ? "内容优化" : "智能创作");
    }
    notify(`${asset.type}配置已完整载入，可继续编辑生成`);
  };
  const activeCopy = copyVersions[activeVersion];
  const titles = [
    "CPA 冲刺黄金 30 天：从会做题到拿到分",
    "在职考生最后一轮提分，关键不是刷更多题",
    "CPA 倒计时：这 6 类高频失分点必须补齐",
    "多科联报立减 800 元，200 个冲刺席位开放",
  ];

  return <div className="creative-page">
    <header className="suite-page-head">
      <div><span className="suite-kicker"><Sparkles size={13}/>AI CONTENT STUDIO</span><h1>AI 营销素材</h1><p>从课程卖点到多渠道内容、海报与视频脚本，一站生成并沉淀为可复用资产。</p></div>
      <div className="suite-head-meta"><Badge tone="violet">本月生成 268 次</Badge><Button variant="secondary" onClick={() => setTab("AI 素材库")}><Archive size={14}/>素材库 {assets.length}</Button></div>
    </header>
    <nav className="suite-subnav" aria-label="AI 营销素材功能">
      {tabs.map(({ label, icon: Icon }) => <button className={tab === label ? "active" : ""} onClick={() => setTab(label)} key={label}><Icon size={15}/>{label}</button>)}
    </nav>

    {tab === "智能创作" && <div className="creative-studio">
      <Card className="creative-input-panel">
        <div className="studio-section-head"><div><span>01</span><div><strong>创作简报</strong><small>结构化输入决定生成质量</small></div></div><Badge tone="green">已完整</Badge></div>
        <div className="creative-form">
          <Field label="课程 / 产品"><input className="input" value={product} onChange={(event) => setProduct(event.target.value)}/></Field>
          <Field label="核心卖点"><textarea value={sellingPoint} onChange={(event) => setSellingPoint(event.target.value)}/></Field>
          <Field label="活动主题"><input className="input" value={theme} onChange={(event) => setTheme(event.target.value)}/></Field>
          <Field label="目标人群"><textarea value={audience} onChange={(event) => setAudience(event.target.value)}/></Field>
          <div className="creative-field-grid">
            <Field label="平台"><select className="select" value={platform} onChange={(event) => setPlatform(event.target.value)}>{platforms.map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="风格"><select className="select" value={tone} onChange={(event) => setTone(event.target.value)}>{["专业", "活泼", "煽情", "紧迫感"].map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="长度"><select className="select" value={length} onChange={(event) => setLength(event.target.value)}>{["短", "中", "长"].map((item) => <option key={item}>{item}</option>)}</select></Field>
            <Field label="版本数"><select className="select" value={versionCount} onChange={(event) => setVersionCount(event.target.value)}>{["1", "2", "3"].map((item) => <option key={item}>{item}</option>)}</select></Field>
          </div>
          {platform === "邮件" && <section className="email-settings">
            <div><Mail size={14}/><strong>EDM 专属设置</strong></div>
            <Field label="主题行"><input className="input" defaultValue="{{姓名}}，CPA 冲刺提分计划已为你准备好"/></Field>
            <Field label="预览文本"><input className="input" defaultValue="30 天高频考点串讲，多科联报限时优惠"/></Field>
            <div className="creative-field-grid"><Field label="语言"><select className="select"><option>中文</option><option>英文</option></select></Field><Field label="版本"><select className="select"><option>A/B 双版本</option><option>单版本</option></select></Field></div>
            <small>可用变量：{"{{姓名}} · {{课程}} · {{到期时间}}"}</small>
          </section>}
          <Button className="creative-generate" onClick={generateCopy} disabled={generating}><Sparkles size={15}/>{generating ? "正在生成多渠道版本..." : "生成营销内容"}</Button>
        </div>
      </Card>

      <Card className="creative-result-panel">
        <div className="studio-section-head"><div><span>02</span><div><strong>即时生成结果</strong><small>{platform} · {tone} · {length}篇幅</small></div></div><Badge tone={generating ? "amber" : "violet"}>{generating ? "生成中" : "AI 已生成"}</Badge></div>
        <div className="channel-switch">{channels.map((item) => <button className={channel === item ? "active" : ""} onClick={() => setChannel(item)} key={item}>{item}</button>)}</div>
        {generating ? <div className="creative-skeleton" aria-live="polite"><i/><i/><i/><span>正在分析课程卖点与渠道规则...</span></div> : generated && <div className="generated-document">
          <div className="version-switch">{copyVersions.slice(0, Number(versionCount)).map((_, index) => <button className={activeVersion === index ? "active" : ""} onClick={() => setActiveVersion(index)} key={index}>版本 {index + 1}</button>)}</div>
          <article>
            <span className="document-label">{channel}发布稿</span>
            <h2>{appliedTitle || activeCopy.title}</h2>
            <p>{activeCopy.body}</p>
            <div className="document-tags"><span>#CPA考试</span><span>#会计培训</span><span>#备考冲刺</span></div>
          </article>
          {platform === "邮件" && <div className="email-preview">
            <div className="segmented"><button className={emailVariant === "A" ? "active" : ""} onClick={() => setEmailVariant("A")}>版本 A</button><button className={emailVariant === "B" ? "active" : ""} onClick={() => setEmailVariant("B")}>版本 B</button></div>
            <p><strong>主题：</strong>{emailVariant === "A" ? "林同学，CPA 冲刺提分计划已为你准备好" : "最后 30 天，别让失分点拖住 CPA 成绩"}</p>
            <p><strong>CTA：</strong><button>立即领取冲刺方案</button></p>
          </div>}
          <div className="creative-result-actions">
            <Button variant="secondary" onClick={() => void copyText(`${appliedTitle || activeCopy.title}\n\n${activeCopy.body}`, notify, "文案")}><Copy size={13}/>复制</Button>
            <Button variant="secondary" onClick={generateCopy}><RefreshCw size={13}/>重新生成</Button>
            <Button onClick={() => saveAsset("文案", appliedTitle || activeCopy.title, activeCopy.body, channel, {
              kind: "copy", product, sellingPoint, theme, audience, platform, tone, length,
            })}><Save size={13}/>保存素材</Button>
          </div>
        </div>}
      </Card>

      <Card className="creative-assist-panel">
        <div className="studio-section-head"><div><span>03</span><div><strong>标题与卖点助理</strong><small>点击即可应用到当前文案</small></div></div><Sparkles size={16}/></div>
        <div className="assist-section"><span className="eyebrow">推荐标题</span>{titles.map((title) => <button onClick={() => { setAppliedTitle(title); notify("标题已应用到当前文案"); }} key={title}><span>{title}</span><Plus size={13}/></button>)}</div>
        <div className="assist-section"><span className="eyebrow">核心卖点</span>{["名师拆解 6 类高频失分点", "每周全真模考 + 个性复盘", "在职考生专属 30 天计划"].map((item) => <button onClick={() => { setSellingPoint(item); notify("卖点已写入创作简报"); }} key={item}><span>{item}</span><Check size={13}/></button>)}</div>
        <div className="urgency-copy"><strong>紧迫感话术</strong><p>优惠将在 09 月 20 日 24:00 结束，剩余席位 47 个。</p><Button variant="secondary" onClick={() => void copyText("优惠将在 09 月 20 日 24:00 结束，剩余席位 47 个。", notify, "紧迫感话术")}><Clipboard size={13}/>复制</Button></div>
      </Card>
    </div>}

    {tab === "海报生成" && <div className="poster-workspace">
      <Card className="poster-controls">
        <div className="studio-section-head"><div><span>01</span><div><strong>海报配置</strong><small>批量适配多个营销尺寸</small></div></div></div>
        <div className="creative-form">
          <Field label="主题"><input className="input" value={posterTheme} onChange={(event) => setPosterTheme(event.target.value)}/></Field>
          <Field label="课程"><input className="input" value={posterCourse} onChange={(event) => setPosterCourse(event.target.value)}/></Field>
          <div className="creative-field-grid"><Field label="价格 / 优惠"><input className="input" value={posterOffer} onChange={(event) => setPosterOffer(event.target.value)}/></Field><Field label="活动日期"><input className="input" value={posterDate} onChange={(event) => setPosterDate(event.target.value)}/></Field></div>
          <Field label="讲师"><input className="input" value={posterTeacher} onChange={(event) => setPosterTeacher(event.target.value)}/></Field>
          <Field label="二维码文案"><input className="input" value={posterQr} onChange={(event) => setPosterQr(event.target.value)}/></Field>
          <Field label="模板"><div className="poster-template-list">{["课程海报", "活动海报", "喜报", "讲师介绍", "节日海报"].map((item) => <button className={posterTemplate === item ? "active" : ""} onClick={() => setPosterTemplate(item)} key={item}>{item}</button>)}</div></Field>
          <Field label="尺寸"><select className="select" value={posterSize} onChange={(event) => setPosterSize(event.target.value)}>{["朋友圈", "公众号头图", "小红书竖图", "抖音封面"].map((item) => <option key={item}>{item}</option>)}</select></Field>
          <Button onClick={() => { setReadyPosters([]); setPosterBatch((value) => value + 1); notify("已提交 2 张海报生成任务"); }}><Palette size={14}/>批量生成</Button>
        </div>
      </Card>
      <section className="poster-results">
        <div className="poster-result-head"><div><h2>生成预览</h2><p>{posterTemplate} · {posterSize} · 2 个视觉方案</p></div><Badge tone="violet">AI IMAGE</Badge></div>
        <div className="poster-preview-grid">
          {posterPrompts.map((prompt, index) => {
            const url = posterUrl(prompt, activePosterSize);
            return <Card className="poster-preview-card" key={url}>
              <GeneratedPoster
                url={url}
                alt={`${posterTemplate}方案 ${index + 1}`}
                index={index}
                config={currentPosterConfig(prompt)}
                onReady={() => setReadyPosters((current) => current.includes(index) ? current : [...current, index])}
              />
              <div><span><strong>方案 {index + 1}</strong><small>{index ? "暖色促销 · 强优惠" : "专业蓝 · 高信任"} · {activePosterSize}</small></span><Button variant="secondary" disabled={!readyPosters.includes(index)} onClick={() => saveAsset("海报", `${posterTheme}方案 ${index + 1}`, url, posterSize, currentPosterConfig(prompt))}><Save size={13}/>保存</Button></div>
            </Card>;
          })}
        </div>
      </section>
    </div>}

    {tab === "视频脚本" && <div className="script-workspace">
      <Card className="script-brief">
        <div className="studio-section-head"><div><span>01</span><div><strong>视频任务</strong><small>输入课程与转化目标</small></div></div></div>
        <div className="creative-form">
          <Field label="课程 / 活动"><input className="input" value={scriptCourse} onChange={(event) => setScriptCourse(event.target.value)}/></Field>
          <Field label="视频目标"><textarea value={scriptGoal} onChange={(event) => setScriptGoal(event.target.value)}/></Field>
          <Field label="脚本类型"><div className="poster-template-list">{["知识口播", "剧情", "测评", "访谈", "直播切片"].map((item) => <button className={scriptType === item ? "active" : ""} onClick={() => setScriptType(item)} key={item}>{item}</button>)}</div></Field>
          <div className="creative-field-grid"><Field label="时长"><select className="select" value={scriptDuration} onChange={(event) => setScriptDuration(event.target.value)}><option>60 秒</option><option>30 秒</option><option>90 秒</option></select></Field><Field label="平台"><select className="select" value={scriptPlatform} onChange={(event) => setScriptPlatform(event.target.value)}><option>抖音</option><option>视频号</option><option>小红书</option></select></Field></div>
          <Button onClick={() => { setScriptVersion(scriptVersion + 1); notify("已生成新版本视频脚本"); }}><Sparkles size={14}/>生成新版本</Button>
        </div>
      </Card>
      <Card className="script-result">
        <div className="panel-head"><div><h2>{scriptType}脚本 · V{scriptVersion}</h2><p>{scriptCourse} · {scriptDuration} · {scriptPlatform}</p></div><Badge tone="green">预计完播率 38%</Badge></div>
        <div className="table-panel"><table className="data-table script-table"><thead><tr><th>镜头</th><th>时长</th><th>画面</th><th>台词</th><th>字幕</th><th>BGM 建议</th></tr></thead><tbody>
          {[
            ["01", "0-5s", "讲师正面近景，桌面铺开三科教材", "中级三科，到底要不要一起报？", "三科联报 ≠ 三倍压力", "清晰鼓点开场"],
            ["02", "5-18s", "切换三科知识关联图", "经济法帮你理解规则，会计建立底层逻辑，财管训练计算。分开学，反而重复搭框架。", "知识点相互关联", "节奏逐步加快"],
            ["03", "18-38s", "学习计划与进度看板录屏", "我们的联报班用一张计划表拆分每周任务，班主任每天追踪，落下的进度当天补。", "每周任务 · 每日追踪", "轻科技感"],
            ["04", "38-52s", "学员模考成绩变化", "上期学员平均少走 46 小时弯路，模考提升 21 分。", "平均提分 21", "情绪抬升"],
            ["05", "52-60s", "讲师指向评论区与课程卡", "评论区打「规划」，领取你的三科备考时间表。", "评论「规划」免费领取", "收束提示音"],
          ].map((row) => <tr key={row[0]}>{row.map((cell) => <td key={cell}>{cell}</td>)}</tr>)}
        </tbody></table></div>
        <div className="creative-result-actions"><Button variant="secondary" onClick={() => void copyText(`${scriptCourse} ${scriptType}脚本 V${scriptVersion}\n01 讲师正面近景：中级三科，到底要不要一起报？\n02 三科知识关联图：经济法、会计与财管相互关联。\n03 学习计划看板：每周任务，每日追踪。\n04 学员成绩变化：上期学员模考平均提升 21 分。\n05 CTA：评论「规划」领取三科备考时间表。`, notify, "完整脚本")}><Copy size={13}/>复制脚本</Button><Button onClick={() => saveAsset("视频脚本", `${scriptCourse}${scriptType}`, `视频脚本 V${scriptVersion}：${scriptGoal}`, scriptPlatform, {
          kind: "video", course: scriptCourse, goal: scriptGoal, scriptType, duration: scriptDuration, platform: scriptPlatform, version: scriptVersion,
        })}><Save size={13}/>保存素材</Button></div>
      </Card>
    </div>}

    {tab === "内容优化" && <div className="optimize-workspace">
      <Card className="optimize-toolbar">
        <div><span className="suite-kicker"><WandSparkles size={13}/>AI EDITOR</span><h2>内容优化与合规检查</h2><p>保留原意，同时增强表达、搜索表现与转化效率。</p></div>
        <div className="optimization-actions">{["润色", "扩写", "缩写", "风格改写", "SEO", "错别字检查", "敏感词检测", "转化率优化"].map((item) => <button className={optimization === item ? "active" : ""} onClick={() => setOptimization(item)} key={item}>{item}</button>)}</div>
        <Button onClick={() => { setOptimized("CPA 冲刺进入关键期：高频考点串讲、真题拆解与全真模考三步联动，帮你快速定位失分点。现在报名 CPA 冲刺班，可享多科联报限时优惠，并获得专属模考复盘。立即领取你的 30 天提分计划。"); notify(`${optimization}已完成`); }}><Sparkles size={14}/>开始优化</Button>
      </Card>
      <div className="comparison-grid">
        <Card><div className="panel-head"><div><h2>原文</h2><p>{original.length} 字 · 输入内容</p></div></div><textarea className="comparison-editor" value={original} onChange={(event) => setOriginal(event.target.value)}/></Card>
        <Card><div className="panel-head"><div><h2>优化稿</h2><p>{optimized ? `${optimized.length} 字 · ${optimization}` : "等待生成"}</p></div><Badge tone={optimized ? "green" : "neutral"}>{optimized ? "已完成" : "未生成"}</Badge></div>{optimized ? <div className="optimized-copy"><p>{optimized}</p><div className="change-summary"><strong>变更摘要</strong><span>强化开场利益点</span><span>补充明确行动指令</span><span>降低模糊表达</span></div></div> : <div className="empty-state"><FilePenLine size={24}/><strong>选择操作并开始优化</strong><p>优化结果将在此处与原文并排展示。</p></div>}</Card>
      </div>
      <Card className="quality-strip">
        <div><span>SEO 分数</span><strong>{optimized ? "86" : "62"}<small>/100</small></strong><div className="progress"><span style={{ width: optimized ? "86%" : "62%" }}/></div></div>
        <div><span>敏感词</span><strong className="text-green">0</strong><small>未发现违规表述</small></div>
        <div><span>错别字</span><strong className="text-green">0</strong><small>语法检查通过</small></div>
        <div><span>转化潜力</span><strong>{optimized ? "高" : "中"}</strong><small>{optimized ? "CTA 清晰、利益明确" : "建议补充行动指令"}</small></div>
        <div className="quality-actions"><Button variant="secondary" disabled={!optimized} onClick={() => void copyText(optimized, notify, "优化稿")}><Copy size={13}/>复制</Button><Button disabled={!optimized} onClick={() => { setOriginal(optimized); notify("优化稿已应用"); }}><Check size={13}/>应用修改</Button><Button variant="secondary" disabled={!optimized} onClick={() => saveAsset("优化稿", "CPA 冲刺班转化优化稿", optimized, platform, {
          kind: "optimize", original, optimization,
        })}><Save size={13}/>保存</Button></div>
      </Card>
    </div>}

    {tab === "AI 素材库" && <div className="asset-workspace">
      <div className="asset-kpis">{[["素材总量", assets.length.toString(), "本月新增 46"], ["累计使用", "1,286", "较上月 +18.4%"], ["带来线索", "3,842", "归因于 AI 素材"], ["转化人数", "628", "综合转化率 16.3%"]].map(([label, value, detail]) => <Card key={label}><span>{label}</span><strong>{value}</strong><small>{detail}</small></Card>)}</div>
      <Card className="asset-library-panel">
        <div className="asset-toolbar">
          <label><Search size={14}/><input className="input" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索标题、平台或内容"/></label>
          <select className="select" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}><option>全部类型</option>{["文案", "海报", "视频脚本", "优化稿"].map((item) => <option key={item}>{item}</option>)}</select>
          <select className="select" value={platformFilter} onChange={(event) => setPlatformFilter(event.target.value)}><option>全部平台</option>{Array.from(new Set(assets.map((asset) => asset.platform))).map((item) => <option key={item}>{item}</option>)}</select>
          <select className="select" value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}><option>全部标签</option>{Array.from(new Set(assets.flatMap((asset) => asset.tags))).map((item) => <option key={item}>{item}</option>)}</select>
          <select className="select" value={creatorFilter} onChange={(event) => setCreatorFilter(event.target.value)}><option>全部创建人</option><option>林晓曼</option><option>赵晨</option></select>
          <select className="select" value={timeFilter} onChange={(event) => setTimeFilter(event.target.value)}><option>最近 30 天</option><option>最近 7 天</option><option>全部时间</option></select>
        </div>
        <div className="table-panel"><table className="data-table asset-table"><thead><tr><th>素材</th><th>类型</th><th>平台</th><th>创建时间</th><th>使用次数</th><th>带来线索</th><th>转化人数</th><th>转化率</th><th>操作</th></tr></thead><tbody>
          {filteredAssets.map((asset) => <tr key={asset.id}><td><strong>{asset.title}</strong><small>{asset.tags.map((tag) => `#${tag}`).join(" ")} · {asset.creator}</small></td><td><Badge tone={asset.type === "海报" ? "violet" : asset.type === "视频脚本" ? "red" : "blue"}>{asset.type}</Badge></td><td>{asset.platform}</td><td>{asset.createdAt}</td><td>{asset.uses}</td><td>{asset.leads}</td><td>{asset.conversions}</td><td>{asset.leads ? `${(asset.conversions / asset.leads * 100).toFixed(1)}%` : "-"}</td><td><div className="row-actions"><button onClick={() => setPreviewAsset(asset)}>预览</button><button onClick={() => void copyText(asset.content, notify, "素材内容")}>复制</button><button onClick={() => reuseAsset(asset)}>复用</button><button className="danger-link" onClick={() => setDeleteAsset(asset)}><Trash2 size={12}/>删除</button></div></td></tr>)}
        </tbody></table>{!filteredAssets.length && <div className="empty-state"><Library size={25}/><strong>未找到匹配素材</strong><p>调整筛选条件或先生成一份营销内容。</p></div>}</div>
      </Card>
    </div>}

    <Modal open={Boolean(deleteAsset)} onClose={() => setDeleteAsset(null)} title="删除 AI 素材">
      <div className="delete-confirm"><Trash2 size={20}/><div><strong>确认删除「{deleteAsset?.title}」？</strong><p>删除后将无法继续复用，历史转化数据仍保留在统计中。</p></div></div>
      <div className="form-actions"><Button variant="secondary" onClick={() => setDeleteAsset(null)}>取消</Button><Button variant="danger" onClick={() => { if (deleteAsset) persistAssets(assets.filter((asset) => asset.id !== deleteAsset.id)); setDeleteAsset(null); notify("素材已删除"); }}>确认删除</Button></div>
    </Modal>
    <Modal open={Boolean(previewAsset)} onClose={() => setPreviewAsset(null)} title={previewAsset?.title ?? "素材预览"}>
      {previewAsset?.type === "海报" && previewAsset.content.startsWith("http") && previewAsset.sourceConfig?.kind === "poster"
        ? <div className="asset-preview-poster"><GeneratedPoster url={previewAsset.content} alt={previewAsset.title} index={0} config={previewAsset.sourceConfig} onReady={() => undefined}/></div>
        : <div className="asset-preview-copy"><Badge tone="violet">{previewAsset?.type ?? "素材"}</Badge><p>{previewAsset?.content}</p></div>}
      <div className="asset-preview-meta"><span>平台：{previewAsset?.platform}</span><span>标签：{previewAsset?.tags.join("、")}</span><span>创建人：{previewAsset?.creator}</span></div>
      <div className="form-actions"><Button variant="secondary" onClick={() => setPreviewAsset(null)}>关闭</Button><Button onClick={() => void copyText(previewAsset?.content ?? "", notify, "素材内容")}><Copy size={13}/>复制内容</Button></div>
    </Modal>
  </div>;
}
