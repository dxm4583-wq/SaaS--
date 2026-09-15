import { useState } from "react";
import { useLocation, useNavigate, useOutletContext } from "react-router-dom";
import {
  Activity, BarChart3, Bell, Bot, ChevronRight, CircleDollarSign, FilePenLine, Gift,
  LayoutDashboard, Megaphone, MessageSquareText, Network, Radio, Share2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { OutletContext } from "../../../components/AppShell";
import { Badge, Modal } from "../../../components/ui";
import type { MarketingSection } from "../types";

export const sectionMeta: Record<MarketingSection,{label:string;title:string;description:string;icon:LucideIcon}> = {
  overview:{label:"营销总览",title:"营销管理",description:"围绕考试节点统筹投入、获客、转化与收入",icon:LayoutDashboard},
  campaigns:{label:"营销活动",title:"营销活动",description:"从方案、审批到上线、监控与复盘的活动闭环",icon:Megaphone},
  coupons:{label:"优惠促销",title:"优惠券与促销",description:"优惠资产、发放策略、价格保护与投入产出管理",icon:Gift},
  channels:{label:"渠道管理",title:"渠道管理",description:"统一管理投放、归因、质量评级和结算",icon:Network},
  content:{label:"内容营销",title:"内容营销",description:"素材、选题、生产、排期和讲师 IP 效能",icon:FilePenLine},
  messages:{label:"消息营销",title:"消息营销",description:"跨渠道触达、频控、SOP 与效果追踪",icon:MessageSquareText},
  referrals:{label:"裂变转介绍",title:"裂变与转介绍",description:"推荐关系、双边奖励、分销佣金与反作弊",icon:Share2},
  automation:{label:"营销自动化",title:"营销自动化",description:"用可视化流程持续培育线索与学员",icon:Bot},
  pages:{label:"落地页表单",title:"落地页与表单",description:"从页面搭建、表单采集到转化优化",icon:Radio},
  loyalty:{label:"会员积分",title:"会员与积分",description:"等级权益、成长任务、积分商城与复购经营",icon:CircleDollarSign},
  analytics:{label:"数据分析",title:"营销数据分析",description:"全链路漏斗、归因分析、预测与订阅报表",icon:BarChart3},
};

const alerts = [
  ["高校讲座渠道预算超支 4%","渠道预算","channels"],
  ["7 天未学唤醒流程出现 6 次异常","流程异常","automation"],
  ["中级估分落地页等待审批","页面审批","pages"],
  ["CPA 联报券退款退券率环比 +3.2%","价格风险","coupons"],
] as const;

export function MarketingHeader({section}:{section:MarketingSection}) {
  const {currentBusinessUnit}=useOutletContext<OutletContext>();
  const location=useLocation();
  const navigate=useNavigate();
  const [alertsOpen,setAlertsOpen]=useState(false);
  const meta=sectionMeta[section];
  return <>
    <div className="marketing-breadcrumb"><span>增长与智能</span><ChevronRight size={11}/><strong>{meta.label}</strong></div>
    <header className="marketing-page-head">
      <div><h1>{meta.title}</h1><p>{meta.description}</p></div>
      <div className="marketing-head-actions">
        <span className="marketing-tenant"><i/>{currentBusinessUnit.name}</span>
        <span className="marketing-updated"><Activity size={13}/>数据更新于 14:36</span>
        <button className="marketing-alert-btn" onClick={()=>setAlertsOpen(true)} aria-label="查看营销预警"><Bell size={16}/><b>4</b></button>
      </div>
    </header>
    <nav className="marketing-subnav" aria-label="营销管理二级导航">
      {(Object.keys(sectionMeta) as MarketingSection[]).map(item=>{
        const itemMeta=sectionMeta[item]; const Icon=itemMeta.icon;
        const active=location.pathname===`/marketing/${item}`||(location.pathname==="/marketing"&&item==="overview");
        return <button className={active?"active":""} onClick={()=>navigate(`/marketing/${item}`)} key={item}><Icon size={14}/><span>{itemMeta.label}</span>{["channels","automation"].includes(item)&&<i/>}</button>;
      })}
    </nav>
    <Modal open={alertsOpen} onClose={()=>setAlertsOpen(false)} title="营销风险与待办">
      <div className="marketing-alert-list">{alerts.map(([detail,type,target])=><button key={detail} onClick={()=>{setAlertsOpen(false);navigate(`/marketing/${target}`)}}><span><Bell size={14}/></span><div><strong>{detail}</strong><small>{type} · 需要今日处理</small></div><Badge tone="red">待处理</Badge><ChevronRight size={14}/></button>)}</div>
    </Modal>
  </>;
}
