export type MarketingSection =
  | "overview" | "campaigns" | "coupons" | "channels" | "content" | "messages"
  | "referrals" | "automation" | "pages" | "loyalty" | "analytics";

export type Tone = "neutral" | "blue" | "green" | "amber" | "red" | "violet";
export type CampaignStatus = "草稿" | "待主管审批" | "待财务审批" | "进行中" | "已结束" | "已下线";

export type Campaign = {
  id: string; name: string; type: string; period: string; audience: string; course: string;
  budget: number; participants: number; revenue: number; roi: number; status: CampaignStatus; approval: string;
};

export type Coupon = {
  id: string; name: string; type: string; value: string; issued: number; used: number;
  revenue: number; roi: number; status: "发放中" | "待发放" | "已结束";
};

export type Channel = {
  id: string; name: string; owner: string; contact: string; model: string; budget: number;
  spent: number; leads: number; paid: number; roi: number; ltv: number; quality: "S" | "A" | "B";
};

export type ContentItem = {
  id: string; title: string; type: string; channel: string; owner: string; date: string;
  status: "选题" | "撰写" | "审核" | "待发布" | "已发布"; views: number; leads: number;
};

export type MessageTask = {
  id: string; name: string; channel: "短信" | "邮件" | "微信" | "Push"; audience: string;
  schedule: string; sent: number; openRate: number; conversion: number; status: "草稿" | "待发送" | "发送中" | "已完成";
};

export type Referral = {
  id: string; name: string; type: string; reward: string; participants: number;
  conversions: number; kFactor: number; roi: number; status: "进行中" | "待审核" | "已结束";
};

export type AutomationFlow = {
  id: string; name: string; trigger: string; nodes: string[]; executions: number;
  conversion: number; version: string; active: boolean; errors: number;
};

export type LandingPage = {
  id: string; name: string; template: string; owner: string; updatedAt: string;
  pv: number; uv: number; leads: number; status: "草稿" | "待审批" | "已发布" | "已下线";
};

export type LoyaltyTier = {
  id: string; name: string; threshold: number; members: number; discount: string; benefits: string[]; protectionDays: number;
};

export type MarketingState = {
  campaigns: Campaign[];
  coupons: Coupon[];
  channels: Channel[];
  content: ContentItem[];
  messages: MessageTask[];
  referrals: Referral[];
  flows: AutomationFlow[];
  pages: LandingPage[];
  tiers: LoyaltyTier[];
  pointsRate: number;
};
