import { Navigate, useLocation } from "react-router-dom";
import { MarketingProvider } from "../features/marketing/MarketingContext";
import { MarketingHeader } from "../features/marketing/components/MarketingHeader";
import type { MarketingSection } from "../features/marketing/types";
import OverviewSection from "../features/marketing/sections/OverviewSection";
import { CampaignsSection, CouponsSection } from "../features/marketing/sections/CampaignCouponSections";
import { ChannelsSection, ContentSection, MessagesSection } from "../features/marketing/sections/ChannelContentMessageSections";
import { AutomationSection, ReferralsSection } from "../features/marketing/sections/ReferralAutomationSections";
import { LoyaltySection, MarketingAnalyticsSection, PagesSection } from "../features/marketing/sections/PageLoyaltyAnalyticsSections";

const sections:MarketingSection[]=["overview","campaigns","coupons","channels","content","messages","referrals","automation","pages","loyalty","analytics"];

export default function Marketing(){
  return <MarketingProvider><MarketingPortal/></MarketingProvider>;
}

function MarketingPortal(){
  const location=useLocation();
  const route=location.pathname.split("/")[2] as MarketingSection|undefined;
  const section=sections.includes(route as MarketingSection)?route as MarketingSection:"overview";
  const content=section==="overview"?<OverviewSection/>:
    section==="campaigns"?<CampaignsSection/>:
    section==="coupons"?<CouponsSection/>:
    section==="channels"?<ChannelsSection/>:
    section==="content"?<ContentSection/>:
    section==="messages"?<MessagesSection/>:
    section==="referrals"?<ReferralsSection/>:
    section==="automation"?<AutomationSection/>:
    section==="pages"?<PagesSection/>:
    section==="loyalty"?<LoyaltySection/>:
    section==="analytics"?<MarketingAnalyticsSection/>:<Navigate to="/marketing/overview" replace/>;
  return <div className="marketing-page" data-section={section}><MarketingHeader section={section}/>{content}</div>;
}
