import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { Activity, MessageCircleMore, Send, UserRoundCheck, UsersRound } from "lucide-react";
import type { OutletContext } from "../components/AppShell";
import { Badge, Button, Card, GrowthSignal, Metric, PageHeader, Tabs } from "../components/ui";

const tabs=["客户微信","社群管理","客户旅程","触达中心","流失预警","会话洞察"];

export default function SCRM(){
  const {notify}=useOutletContext<OutletContext>(); const [tab,setTab]=useState("客户微信");
  return <div><PageHeader title="SCRM 系统" description="连接企业微信，持续经营客户关系与私域转化" actions={<Button onClick={()=>notify("企微同步任务已启动")}><Activity size={14}/>同步企微数据</Button>}/>
    <GrowthSignal tone="red" title="3 位高价值客户出现流失信号" detail="近 18-32 天无有效互动，系统已结合历史偏好准备唤醒话术。" action="进入挽回队列" onAction={()=>setTab("流失预警")}/>
    <div className="metrics three"><Metric label="企微好友数" value="12,680" trend="今日新增 86" icon={<UserRoundCheck size={18}/>}/><Metric label="社群活跃数" value="48" trend="7 日活跃率 72%" icon={<UsersRound size={18}/>} tone="green"/><Metric label="今日触达转化" value="18.6%" trend="高于均值 3.2%" icon={<Send size={18}/>} tone="violet"/></div>
    <Card><Tabs items={tabs} active={tab} onChange={setTab}/><div className="scrm-summary">
      <div>{tab==="客户微信"&&<><h3>企业微信连接</h3><div className="task-row"><div className="metric-icon tone-green"><MessageCircleMore size={17}/></div><div className="task-main"><strong>晓曼财经 · 企业微信</strong><small>已连接 28 位员工 · 最近同步 10:32</small></div><Badge tone="green">连接正常</Badge></div><h3>最近客户互动</h3>{[["星瀚科技","查看了朋友圈「销售管理的 5 个误区」","10:24"],["明途教育","回复：想了解招生转化模块","09:48"],["森屿家居","点击了产品案例链接","昨天"]].map(x=><div className="task-row" key={x[0]}><div className="task-main"><strong>{x[0]}</strong><small>{x[1]}</small></div><span className="task-time">{x[2]}</span></div>)}</>}
        {tab==="社群管理"&&<><h3>重点客户群</h3>{[["增长管理者闭门群","386","82%","赵晨"],["教育机构增长营","248","68%","林晓曼"],["企业数字化实践群","192","74%","陈思远"]].map(x=><div className="task-row" key={x[0]}><div className="task-main"><strong>{x[0]}</strong><small>{x[1]} 人 · 群主 {x[3]}</small></div><Badge tone="green">活跃度 {x[2]}</Badge></div>)}<Button onClick={()=>notify("群发预览已生成")}>创建群发任务</Button></>}
        {tab==="客户旅程"&&<><h3>星瀚科技 · 周彤</h3><div className="journey">{["添加企微","首次互动","加入社群","参与直播","创建商机"].map((x,i)=><div className="journey-step" key={x}><i>{i+1}</i>{x}</div>)}</div><div className="timeline">{["创建 CRM 企业版商机，金额 ¥328,000","参加「销售预测」线上直播","加入增长管理者闭门群","通过渠道活动添加企业微信"].map((x,i)=><div className="timeline-item" key={x}>{x}<small>{14-i*8} 天前</small></div>)}</div></>}
        {tab==="触达中心"&&<><h3>自动化 SOP</h3>{[["新客户培育 SOP","加微后第 3 天自动推送","运行中"],["报价后跟进 SOP","报价后 2 天提醒销售","运行中"],["沉默客户唤醒","30 天无互动发送案例","草稿"]].map(x=><div className="task-row" key={x[0]}><div className="task-main"><strong>{x[0]}</strong><small>{x[1]}</small></div><Badge tone={x[2]==="运行中"?"green":"neutral"}>{x[2]}</Badge></div>)}<Button onClick={()=>notify("已打开触达任务编辑器")}>新建触达任务</Button></>}
        {tab==="流失预警"&&<><h3>高风险沉默客户</h3>{[["北辰医疗","32 天未互动","A"],["青禾餐饮","25 天未互动","B"],["森屿家居","18 天未互动","A"]].map(x=><div className="task-row" key={x[0]}><Badge tone="red">{x[1]}</Badge><div className="task-main"><strong>{x[0]}</strong><small>{x[2]} 级客户 · 最近触达未回复</small></div><Button variant="secondary" onClick={()=>notify(`已为 ${x[0]} 生成挽回话术`)}>一键挽回</Button></div>)}</>}
        {tab==="会话洞察"&&<><h3>本周客户关注关键词</h3><div className="keyword-cloud"><strong style={{fontSize:24}}>价格</strong><span style={{fontSize:18}}>实施周期</span><strong style={{fontSize:20}}>数据权限</strong><span>企微连接</span><span style={{fontSize:16}}>审批流程</span><span>客户案例</span></div></>}
      </div>
      <div><h3>{tab==="社群管理"?"入群渠道":"运营概览"}</h3><Card style={{padding:16,boxShadow:"none"}}>{[["企微活码","42%"],["内容资料","28%"],["直播活动","19%"],["销售邀请","11%"]].map(x=><div key={x[0]} style={{marginBottom:16}}><div style={{display:"flex",justifyContent:"space-between",fontSize:11,marginBottom:7}}><span>{x[0]}</span><strong>{x[1]}</strong></div><div className="progress"><span style={{width:x[1]}}/></div></div>)}</Card><h3>群发消息预览</h3><div className="generated-copy" style={{borderColor:"#2563eb"}}>你好，上周直播中提到的《销售团队增长诊断表》已经整理好，点击即可领取。需要我结合贵司情况做一份解读吗？</div></div>
    </div></Card>
  </div>;
}
