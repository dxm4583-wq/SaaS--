import type { MarketingState } from "./types";

export const initialMarketingState: MarketingState = {
  campaigns: [
    {id:"CAM-260901",name:"CPA 全科联报冲刺季",type:"多科联报",period:"09-01 至 09-30",audience:"CPA 意向学员",course:"CPA 六科联报",budget:280000,participants:4862,revenue:1864000,roi:5.66,status:"进行中",approval:"财务已通过"},
    {id:"CAM-260902",name:"中级会计考后再战计划",type:"考后再战",period:"09-10 至 10-15",audience:"中级未通过学员",course:"中级会计 2027",budget:160000,participants:2715,revenue:782000,roi:3.89,status:"进行中",approval:"财务已通过"},
    {id:"CAM-260903",name:"税务师准考证提醒专场",type:"节点营销",period:"09-18 至 10-20",audience:"税务师报考用户",course:"税务师冲刺班",budget:85000,participants:0,revenue:0,roi:0,status:"待财务审批",approval:"主管已通过"},
    {id:"CAM-260904",name:"新学期财经证书早鸟价",type:"早鸟价",period:"10-01 至 10-31",audience:"高校财经专业",course:"初级+CPA 先修",budget:120000,participants:0,revenue:0,roi:0,status:"待主管审批",approval:"待主管审批"},
    {id:"CAM-260905",name:"图书 + 课程秋季组合包",type:"组合套餐",period:"08-15 至 09-15",audience:"图书购买用户",course:"中级精品班",budget:68000,participants:1426,revenue:416000,roi:5.12,status:"已结束",approval:"已归档"},
    {id:"CAM-260906",name:"不过退费保障计划",type:"不过退费",period:"09-20 至 11-30",audience:"高意向在职学员",course:"CPA 协议班",budget:320000,participants:0,revenue:0,roi:0,status:"草稿",approval:"未提交"},
  ],
  coupons: [
    {id:"CP-001",name:"CPA 全科联报立减 2000",type:"满减券",value:"满 12,800 减 2,000",issued:3200,used:1186,revenue:968000,roi:4.8,status:"发放中"},
    {id:"CP-002",name:"老学员续报 85 折",type:"折扣券",value:"最高抵扣 1,500",issued:1860,used:742,revenue:628000,roi:6.2,status:"发放中"},
    {id:"CP-003",name:"税务师试听抵扣券",type:"代金券",value:"立减 300",issued:5000,used:1680,revenue:504000,roi:3.4,status:"发放中"},
    {id:"CP-004",name:"高校讲座专属兑换码",type:"兑换券",value:"资料包 + 试听课",issued:2400,used:988,revenue:184000,roi:7.1,status:"待发放"},
  ],
  channels: [
    {id:"CH-01",name:"高顿财经公众号",owner:"周宁",contact:"微信生态直营",model:"CPA",budget:260000,spent:184000,leads:5280,paid:486,roi:6.8,ltv:12400,quality:"S"},
    {id:"CH-02",name:"抖音财经课堂",owner:"陈嘉",contact:"douyin_finance",model:"CPS",budget:320000,spent:298000,leads:6810,paid:522,roi:4.9,ltv:10800,quality:"A"},
    {id:"CH-03",name:"小红书考证笔记",owner:"李冉",contact:"RED-ACCT-09",model:"CPM",budget:180000,spent:166000,leads:2960,paid:218,roi:3.7,ltv:9600,quality:"A"},
    {id:"CH-04",name:"财经高校巡回讲座",owner:"王悦",contact:"021-5558-2031",model:"固定费用",budget:120000,spent:124800,leads:1830,paid:196,roi:5.4,ltv:13200,quality:"S"},
    {id:"CH-05",name:"会计论坛社群",owner:"许扬",contact:"forum-group-7",model:"资源置换",budget:60000,spent:43000,leads:1260,paid:72,roi:2.8,ltv:8700,quality:"B"},
    {id:"CH-06",name:"财经图书腰封",owner:"孙黎",contact:"ISBN 联合渠道",model:"CPS",budget:90000,spent:67000,leads:2140,paid:168,roi:5.1,ltv:11600,quality:"A"},
  ],
  content: [
    {id:"CT-01",title:"2026 CPA 成绩查询与复盘指南",type:"文章",channel:"公众号",owner:"蒋琳",date:"09-16",status:"待发布",views:0,leads:0},
    {id:"CT-02",title:"税务师冲刺 60 天学习路径",type:"短视频",channel:"抖音",owner:"陈嘉",date:"09-17",status:"审核",views:0,leads:0},
    {id:"CT-03",title:"中级会计考后职业规划直播",type:"直播",channel:"视频号",owner:"韩老师",date:"09-18",status:"撰写",views:0,leads:0},
    {id:"CT-04",title:"CPA 高频审计程序清单",type:"免费资料",channel:"小红书",owner:"李冉",date:"09-14",status:"已发布",views:48600,leads:1230},
    {id:"CT-05",title:"零基础财管试听课",type:"试听课",channel:"官网",owner:"赵老师",date:"09-13",status:"已发布",views:21800,leads:816},
  ],
  messages: [
    {id:"MSG-01",name:"税务师准考证开放提醒",channel:"短信",audience:"税务师已报名 18,620 人",schedule:"09-18 10:00",sent:0,openRate:0,conversion:0,status:"待发送"},
    {id:"MSG-02",name:"CPA 考后再战个性化建议",channel:"微信",audience:"CPA 查分用户 8,420 人",schedule:"09-15 14:00",sent:8260,openRate:68.4,conversion:12.8,status:"已完成"},
    {id:"MSG-03",name:"7 天未学习唤醒",channel:"Push",audience:"沉睡学员 3,281 人",schedule:"实时触发",sent:2980,openRate:36.2,conversion:8.4,status:"发送中"},
    {id:"MSG-04",name:"老学员续费权益月报",channel:"邮件",audience:"金卡及以上 5,120 人",schedule:"09-20 09:00",sent:0,openRate:0,conversion:0,status:"草稿"},
  ],
  referrals: [
    {id:"RF-01",name:"CPA 学友同行双边奖励",type:"推荐有礼",reward:"双方各得 500 积分",participants:4380,conversions:862,kFactor:1.38,roi:6.4,status:"进行中"},
    {id:"RF-02",name:"中级精品班 3 人拼团",type:"拼团",reward:"每人立减 600 元",participants:2180,conversions:604,kFactor:1.62,roi:5.8,status:"进行中"},
    {id:"RF-03",name:"税务师资料包助力",type:"助力",reward:"5 人助力解锁",participants:6820,conversions:1180,kFactor:2.14,roi:8.1,status:"进行中"},
    {id:"RF-04",name:"讲师合伙人分销计划",type:"分销",reward:"成交佣金 8%",participants:326,conversions:148,kFactor:.86,roi:4.2,status:"待审核"},
  ],
  flows: [
    {id:"AF-01",name:"浏览课程未购买召回",trigger:"浏览详情 2 次且 24h 未购",nodes:["触发","条件：高意向","等待 2h","微信提醒","分支：已购买"],executions:12860,conversion:11.6,version:"v3.2",active:true,errors:2},
    {id:"AF-02",name:"课程到期续费培育",trigger:"课程到期前 30 天",nodes:["触发","会员等级判断","权益短信","等待 3 天","顾问任务"],executions:6840,conversion:18.4,version:"v2.6",active:true,errors:0},
    {id:"AF-03",name:"7 天未学唤醒",trigger:"连续 7 天无学习",nodes:["触发","学习进度条件","Push","等待 24h","优惠券"],executions:9320,conversion:9.7,version:"v4.1",active:true,errors:6},
    {id:"AF-04",name:"CPA 考后再战",trigger:"查分后未通过",nodes:["触发","成绩区间","推荐课程","A/B 消息","顾问跟进"],executions:4260,conversion:22.1,version:"v1.8",active:false,errors:0},
  ],
  pages: [
    {id:"LP-01",name:"CPA 全科联报秋季专题",template:"课程转化型",owner:"徐晨",updatedAt:"09-15 13:42",pv:128600,uv:84600,leads:6860,status:"已发布"},
    {id:"LP-02",name:"税务师 60 天冲刺营",template:"资料领取型",owner:"蒋琳",updatedAt:"09-15 11:08",pv:58200,uv:41600,leads:4920,status:"已发布"},
    {id:"LP-03",name:"中级考后估分与复盘",template:"工具表单型",owner:"刘硕",updatedAt:"09-14 19:20",pv:96000,uv:73200,leads:8160,status:"待审批"},
    {id:"LP-04",name:"高校财经证书早鸟季",template:"活动报名型",owner:"李冉",updatedAt:"09-14 16:36",pv:0,uv:0,leads:0,status:"草稿"},
  ],
  tiers: [
    {id:"LV-1",name:"普通会员",threshold:0,members:48260,discount:"无",benefits:["学习报告","积分签到"],protectionDays:0},
    {id:"LV-2",name:"银卡会员",threshold:3000,members:18620,discount:"98 折",benefits:["资料优先领","专属客服"],protectionDays:30},
    {id:"LV-3",name:"金卡会员",threshold:10000,members:6840,discount:"95 折",benefits:["课程延保","直播回放"],protectionDays:60},
    {id:"LV-4",name:"钻石会员",threshold:30000,members:1260,discount:"9 折",benefits:["一对一规划","线下活动"],protectionDays:90},
    {id:"LV-5",name:"VIP",threshold:80000,members:286,discount:"85 折",benefits:["讲师答疑","终身档案"],protectionDays:180},
  ],
  pointsRate: 10,
};

export const trendData = [
  {date:"09-01",spend:28,revenue:136,leads:1820,paid:156},{date:"09-03",spend:32,revenue:158,leads:2160,paid:184},
  {date:"09-05",spend:35,revenue:172,leads:2380,paid:201},{date:"09-07",spend:39,revenue:196,leads:2640,paid:226},
  {date:"09-09",spend:44,revenue:218,leads:2980,paid:258},{date:"09-11",spend:48,revenue:246,leads:3260,paid:286},
  {date:"09-13",spend:52,revenue:284,leads:3580,paid:318},{date:"09-15",spend:56,revenue:326,leads:3920,paid:352},
];

export const funnelData = [
  {name:"曝光",value:2860000},{name:"点击",value:386000},{name:"访问",value:312000},{name:"留资",value:28640},
  {name:"分配",value:27280},{name:"跟进",value:21860},{name:"体验",value:9840},{name:"报名",value:4260},{name:"付费",value:3186},{name:"续费",value:1268},
];

export const examNodes = [
  {date:"09.01",name:"CPA 报名复盘",state:"已完成",action:"高意向人群再营销",campaign:"全科联报冲刺季"},
  {date:"09.15",name:"中级会计查分",state:"当前节点",action:"考后再战 + 成绩分层",campaign:"中级再战计划"},
  {date:"09.18",name:"税务师准考证",state:"7 天后",action:"提醒 + 冲刺资料包",campaign:"待创建"},
  {date:"10.10",name:"初级会计预报名",state:"25 天后",action:"早鸟价 + 学习规划",campaign:"待创建"},
  {date:"11.08",name:"税务师考试",state:"54 天后",action:"考前关怀 + 高频考点",campaign:"待创建"},
  {date:"12.05",name:"CPA 成绩查询",state:"81 天后",action:"查分工具 + 再战推荐",campaign:"待创建"},
  {date:"12.20",name:"证书领取",state:"96 天后",action:"晒证裂变 + 进阶课程",campaign:"待创建"},
];
