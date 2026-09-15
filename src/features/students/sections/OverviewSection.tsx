import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, CircleDollarSign, Clock3, Download, GraduationCap, TrendingUp, UserMinus, UsersRound } from "lucide-react";
import { Button, Card } from "../../../components/ui";
import { useStudents } from "../StudentContext";
import { exportStudentsCsv, money } from "../utils";
import { can, exportFieldsFor, overviewSeriesFor } from "../permissions";
import type { LucideIcon } from "lucide-react";
import { buildOverviewAggregate, type AggregateDatum, type OverviewChartKind } from "../analytics";

const chartColors = ["#2563eb","#06b6d4","#8b5cf6","#f59e0b","#10b981","#ef4444","#64748b"];

export default function OverviewSection() {
  const { students, finance, attendance, activeStudents, role, notify, setLoadError, loadError } = useStudents();
  const [period,setPeriod] = useState("月");
  const visibleSeries = overviewSeriesFor(role);
  const aggregate = useMemo(() => buildOverviewAggregate(role, students, finance, attendance), [role, students, finance, attendance]);
  const metrics = useMemo<Array<[string,string,string,LucideIcon]>>(() => {
    const scopedStudents = aggregate.students;
    const studying = scopedStudents.filter((student)=>student.status==="在读").length;
    const lost = scopedStudents.filter((student)=>student.status==="流失").length;
    const newStudents = scopedStudents.filter((student)=>student.signupTime.startsWith("2026-09")).length;
    const converted = scopedStudents.filter((student)=>!["潜在意向","已试听","流失"].includes(student.status)).length;
    const consumed = scopedStudents.reduce((sum,student)=>sum+student.consumedHours,0);
    const averageAttendance = scopedStudents.length ? scopedStudents.reduce((sum,student)=>sum+student.attendanceRate,0)/scopedStudents.length : 0;
    const averageAssignment = scopedStudents.length ? scopedStudents.reduce((sum,student)=>sum+student.assignmentCompletion,0)/scopedStudents.length : 0;
    const paid = aggregate.finance.reduce((sum,item)=>sum+item.paid,0);
    const refunded = aggregate.finance.filter((item)=>item.status.includes("退款")).reduce((sum,item)=>sum+item.tuition-item.discount-item.paid,0);
    const conversionRate = scopedStudents.length ? converted/scopedStudents.length*100 : 0;
    const lossRate = scopedStudents.length ? lost/scopedStudents.length*100 : 0;
    const base: Array<[string,string,string,LucideIcon]> = [
      ["学员总数",scopedStudents.length.toLocaleString("zh-CN"),"当前权限范围",UsersRound],
      ["本期新增",String(newStudents),"当前范围新增",TrendingUp],
      ["在读",studying.toLocaleString("zh-CN"),"正常履约",GraduationCap],
      ["流失",lost.toLocaleString("zh-CN"),`流失率 ${lossRate.toFixed(1)}%`,UserMinus],
      ["转化率",`${conversionRate.toFixed(1)}%`,"当前范围转化",Activity],
      ["课时消耗",consumed.toLocaleString("zh-CN"),"本期累计",Clock3],
      ["缴费总额",money(paid),"含部分支付",CircleDollarSign],
    ];
    if (role==="普通教师") return [base[0],base[2],base[5],["平均出勤",`${averageAttendance.toFixed(1)}%`,"王嘉任课班级",Activity],["作业完成",`${averageAssignment.toFixed(1)}%`,"当前班级平均",TrendingUp]];
    if (role==="财务管理员") return [["关联学员",new Set(aggregate.finance.map((item)=>item.studentId)).size.toLocaleString("zh-CN"),"财务权限范围",UsersRound],base[6],["待复核",`${aggregate.finance.filter((item)=>item.reviewStatus==="待复核").length} 笔`,"当前范围订单",Clock3],["本期退款",money(refunded),"当前范围退款",UserMinus]];
    if (role==="销售顾问") return [base[0],base[1],base[4],["已报名",scopedStudents.filter((student)=>["已报名","在读","结业","毕业"].includes(student.status)).length.toLocaleString("zh-CN"),"本人负责学员",GraduationCap],base[3]];
    if (role==="教务管理员") return [base[0],base[1],base[2],base[3],base[5],["平均出勤",`${averageAttendance.toFixed(1)}%`,"当前租户教务范围",Activity]];
    return base;
  },[aggregate,role]);
  if (loadError) return <Card className="student-error-state"><AlertPanel retry={()=>{setLoadError(false);notify("学员数据已重新加载")}}/></Card>;
  return <div className="student-section-body">
    <div className="student-section-toolbar"><div className="segmented">{["日","周","月","年"].map((item)=><button className={period===item?"active":""} onClick={()=>setPeriod(item)} key={item}>{item}</button>)}</div><span>统计周期：2026-09-01 至 2026-09-15</span><span className="spacer"/>{can(role,"export")&&<Button variant="secondary" onClick={()=>exportStudentsCsv(activeStudents,exportFieldsFor(role))}><Download size={14}/>导出 CSV</Button>}{can(role,"print")&&<Button variant="secondary" onClick={()=>window.print()}>PDF 预览 / 打印</Button>}<Button variant="ghost" onClick={()=>setLoadError(true)}>模拟加载失败</Button></div>
    <div className="student-kpi-grid">{metrics.map(([label,value,detail,Icon],index)=><Card className="student-kpi" key={label}><span className={`tone-${index%4===3?"amber":index%3===1?"green":"blue"}`}><Icon size={17}/></span><div><small>{label}</small><strong>{value}</strong><p>{detail}</p></div></Card>)}</div>
    <div className="student-dashboard-grid">
      {aggregate.chartKinds.map((kind)=><AggregateChart kind={kind} aggregate={aggregate} key={kind}/>)}
      <Card className="student-chart-card student-chart-wide"><ChartHead title="履约与经营趋势" detail={visibleSeries.map((item)=>({payment:"缴费",attendance:"出勤",loss:"流失",renewal:"续报率"})[item]).join("、")}/><div className="student-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={aggregate.trendData}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" tick={{fontSize:10}}/>{visibleSeries.includes("payment")&&<YAxis yAxisId="left" tick={{fontSize:10}}/>}<YAxis yAxisId="right" orientation="right" tick={{fontSize:10}}/><Tooltip/>{visibleSeries.includes("payment")&&<Line yAxisId="left" type="monotone" dataKey="payment" name="缴费(万元)" stroke="#2563eb" strokeWidth={2}/>} {visibleSeries.includes("attendance")&&<Line yAxisId="right" type="monotone" dataKey="attendance" name="出勤率" stroke="#10b981" strokeWidth={2}/>} {visibleSeries.includes("renewal")&&<Line yAxisId="right" type="monotone" dataKey="renewal" name="续报率" stroke="#8b5cf6" strokeWidth={2}/>} {visibleSeries.includes("loss")&&<Line yAxisId="right" type="monotone" dataKey="loss" name="流失率" stroke="#ef4444" strokeWidth={2}/>}</LineChart></ResponsiveContainer></div></Card>
    </div>
  </div>;
}

function AggregateChart({kind,aggregate}:{kind:OverviewChartKind;aggregate:ReturnType<typeof buildOverviewAggregate>}) {
  const config: Record<OverviewChartKind,{title:string;detail:string;data:AggregateDatum[];pie?:boolean}> = {
    source:{title:"学员来源",detail:"当前权限范围渠道结构",data:aggregate.sourceData,pie:true},
    class:{title:"班级学员分布",detail:"当前权限范围班级容量",data:aggregate.classData},
    lifecycle:{title:"招生转化阶段",detail:"本人负责学员生命周期",data:aggregate.lifecycleData},
    attendance:{title:"考勤状态构成",detail:"当前班级考勤记录",data:aggregate.attendanceData,pie:true},
    finance:{title:"订单状态构成",detail:"当前财务权限范围",data:aggregate.financeData,pie:true},
  };
  const {title,detail,data,pie}=config[kind];
  return <Card className="student-chart-card"><ChartHead title={title} detail={detail}/><div className="student-chart">{pie?<><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} innerRadius={54} outerRadius={82} dataKey="value" paddingAngle={2}>{data.map((item,index)=><Cell aria-label={`${item.name} ${item.value}`} fill={chartColors[index%chartColors.length]} key={item.name}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="chart-legend">{data.map((item,index)=><span key={item.name}><i style={{background:chartColors[index%chartColors.length]}}/>{item.name} {item.value}</span>)}</div></>:<ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="name" tick={{fontSize:10}}/><YAxis tick={{fontSize:10}}/><Tooltip/><Bar dataKey="value" fill="#2563eb" radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>}</div></Card>;
}

function ChartHead({title,detail}:{title:string;detail:string}) {
  return <div className="student-card-head"><div><h2>{title}</h2><p>{detail}</p></div><span className="student-live-dot">实时</span></div>;
}
function AlertPanel({retry}:{retry:()=>void}) {
  return <div><AlertTriangleIcon/><strong>学员数据加载失败</strong><p>这是受控错误状态，用于验证网络异常下的恢复体验。</p><Button onClick={retry}>重新加载</Button></div>;
}
function AlertTriangleIcon(){return <span className="tone-red"><UserMinus size={22}/></span>}
