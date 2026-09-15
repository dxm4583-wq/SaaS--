import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useOutletContext } from "react-router-dom";
import type { OutletContext } from "../../components/AppShell";
import { initialMarketingState } from "./mockData";
import type { Campaign, CampaignStatus, ContentItem, MarketingState } from "./types";

type MarketingContextValue = MarketingState & {
  notify: (message: string) => void;
  addCampaign: (campaign: Campaign) => void;
  updateCampaignStatus: (id: string, status: CampaignStatus) => void;
  addCoupon: (name: string, type: string, value: string) => void;
  issueCoupon: (id: string, amount: number) => void;
  updateChannelBudget: (id: string, budget: number) => void;
  advanceContent: (id: string) => void;
  addMessage: (name: string, channel: "短信" | "邮件" | "微信" | "Push", audience: string) => void;
  approveReward: (id: string) => void;
  toggleFlow: (id: string) => void;
  updateFlowNodes: (id: string, nodes: string[]) => void;
  publishPage: (id: string) => void;
  updateTier: (id: string, threshold: number) => void;
  setPointsRate: (rate: number) => void;
};

const MarketingContext = createContext<MarketingContextValue | null>(null);
const storageKey = "growth-marketing-state-v1";

function loadState(): MarketingState {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? {...initialMarketingState, ...JSON.parse(stored) as MarketingState} : initialMarketingState;
  } catch {
    return initialMarketingState;
  }
}

export function MarketingProvider({children}:{children:ReactNode}) {
  const {notify} = useOutletContext<OutletContext>();
  const [state,setState] = useState<MarketingState>(loadState);
  useEffect(()=>localStorage.setItem(storageKey,JSON.stringify(state)),[state]);
  const value = useMemo<MarketingContextValue>(()=>({
    ...state, notify,
    addCampaign:(campaign)=>{setState(s=>({...s,campaigns:[campaign,...s.campaigns]}));notify("营销活动已创建并保存为草稿");},
    updateCampaignStatus:(id,status)=>{setState(s=>({...s,campaigns:s.campaigns.map(item=>item.id===id?{...item,status,approval:status==="待主管审批"?"待主管审批":status==="待财务审批"?"主管已通过":status==="进行中"?"审批已通过":item.approval}:item)}));notify(`活动状态已更新为「${status}」`);},
    addCoupon:(name,type,couponValue)=>{setState(s=>({...s,coupons:[{id:`CP-${Date.now().toString().slice(-4)}`,name,type,value:couponValue,issued:0,used:0,revenue:0,roi:0,status:"待发放"},...s.coupons]}));notify("优惠券已创建");},
    issueCoupon:(id,amount)=>{setState(s=>({...s,coupons:s.coupons.map(item=>item.id===id?{...item,issued:item.issued+amount,status:"发放中"}:item)}));notify(`已按人群发放 ${amount.toLocaleString("zh-CN")} 张优惠券`);},
    updateChannelBudget:(id,budget)=>{setState(s=>({...s,channels:s.channels.map(item=>item.id===id?{...item,budget}:item)}));notify("渠道预算已调整，预算监控同步更新");},
    advanceContent:(id)=>{const order:ContentItem["status"][]=["选题","撰写","审核","待发布","已发布"];setState(s=>({...s,content:s.content.map(item=>item.id===id?{...item,status:order[Math.min(order.indexOf(item.status)+1,order.length-1)]}:item)}));notify("内容排期状态已推进");},
    addMessage:(name,channel,audience)=>{setState(s=>({...s,messages:[{id:`MSG-${Date.now().toString().slice(-4)}`,name,channel,audience,schedule:"立即发送",sent:0,openRate:0,conversion:0,status:"待发送"},...s.messages]}));notify("触达任务已创建并加入发送列表");},
    approveReward:(id)=>{setState(s=>({...s,referrals:s.referrals.map(item=>item.id===id?{...item,status:"进行中"}:item)}));notify("奖励审核通过，发放任务已生成");},
    toggleFlow:(id)=>{setState(s=>({...s,flows:s.flows.map(item=>item.id===id?{...item,active:!item.active}:item)}));notify("自动化流程状态已更新");},
    updateFlowNodes:(id,nodes)=>{setState(s=>({...s,flows:s.flows.map(item=>item.id===id?{...item,nodes,version:`v${Number(item.version.slice(1))+0.1}`}:item)}));notify("流程节点已保存并生成新版本");},
    publishPage:(id)=>{setState(s=>({...s,pages:s.pages.map(item=>item.id===id?{...item,status:"已发布",updatedAt:"刚刚"}:item)}));notify("落地页已发布，访问链接已生效");},
    updateTier:(id,threshold)=>{setState(s=>({...s,tiers:s.tiers.map(item=>item.id===id?{...item,threshold}:item)}));notify("会员等级门槛已更新");},
    setPointsRate:(pointsRate)=>{setState(s=>({...s,pointsRate}));notify("积分获取规则已保存");},
  }),[state,notify]);
  return <MarketingContext.Provider value={value}>{children}</MarketingContext.Provider>;
}

export function useMarketing() {
  const value=useContext(MarketingContext);
  if(!value) throw new Error("useMarketing must be used inside MarketingProvider");
  return value;
}
