import { useEffect, useMemo, useState } from "react";
import { CircleDollarSign, FileCheck2, Link2, Plus, ReceiptText, RefreshCw, RotateCcw, Upload } from "lucide-react";
import { Badge, Button, Card, Drawer, Modal, Tabs } from "../../../components/ui";
import { courses } from "../mockData";
import { useStudents } from "../StudentContext";
import { maskPhone, money, nowTimestamp } from "../utils";
import type { FinanceRecord } from "../types";
import { can, canSeeField } from "../permissions";
import { useLocation, useNavigate } from "react-router-dom";
import { buildFinanceKpis, type FinanceKpi } from "../analytics";

const views=["报名订单","缴费流水","退费管理","财务对账"];

export default function FinanceSection(){
  const location=useLocation();
  const navigate=useNavigate();
  const {students,finance,scopedFinance,setFinance,activeStudents,role,notify,addLog,updateStudent}=useStudents();
  const [view,setView]=useState(views[0]);
  const [createOpen,setCreateOpen]=useState(false);
  const [refundTarget,setRefundTarget]=useState<FinanceRecord|null>(null);
  const [refundConfirm,setRefundConfirm]=useState<{target:FinanceRecord;amount:number;reason:string}|null>(null);
  const [voucher,setVoucher]=useState<FinanceRecord|null>(null);
  const [detail,setDetail]=useState<{record:FinanceRecord;kind:"student"|"order"}|null>(null);
  const [paymentTarget,setPaymentTarget]=useState<FinanceRecord|null>(null);
  const [refundFile,setRefundFile]=useState<File|null>(null);
  const [selected,setSelected]=useState<Set<string>>(new Set());
  const [batch,setBatch]=useState("");
  const [batchConfirm,setBatchConfirm]=useState("");
  const [page,setPage]=useState(1);
  const pageSize=50;
  const allowedViews=role==="销售顾问"?["报名订单"]:views;
  const effectiveView=allowedViews.includes(view)?view:allowedViews[0];
  const visible=useMemo(()=>scopedFinance.filter((item)=>effectiveView==="退费管理"?item.status==="部分退款"||item.refundable>0:effectiveView==="财务对账"?item.reviewStatus!=="已通过":true),[effectiveView,scopedFinance]);
  const kpis=useMemo(()=>buildFinanceKpis(role,finance,students),[role,finance,students]);
  const pageCount=Math.max(1,Math.ceil(visible.length/pageSize));
  const pageRows=visible.slice((page-1)*pageSize,page*pageSize);
  useEffect(()=>setPage(1),[effectiveView,role]);
  useEffect(()=>{
    const query=new URLSearchParams(location.search);
    const orderId=query.get("order");
    const studentId=query.get("student");
    const record=scopedFinance.find((item)=>item.id===orderId||item.studentId===studentId);
    setDetail(record?{record,kind:orderId?"order":"student"}:null);
  },[location.search,scopedFinance]);
  const openDetail=(record:FinanceRecord,kind:"student"|"order")=>{
    navigate(`/students/finance?${kind}=${encodeURIComponent(kind==="order"?record.id:record.studentId)}`);
  };
  const closeDetail=()=>navigate("/students/finance",{replace:true});
  const createOrder=(form:HTMLFormElement)=>{
    const data=new FormData(form);const student=activeStudents.find((item)=>item.id===String(data.get("studentId")))??activeStudents[0];
    const tuition=Number(data.get("tuition"));const discount=Number(data.get("discount"));
    const record:FinanceRecord={id:`PAY-${Date.now()}`,studentId:student.id,studentName:student.name,orderNo:`EDU${nowTimestamp().replace(/\D/g,"")}`,course:String(data.get("course")),hours:Number(data.get("hours")),tuition,discount,paid:Math.max(0,tuition-discount),refundable:Math.max(0,tuition-discount),paymentMethod:String(data.get("method")) as FinanceRecord["paymentMethod"],paymentType:String(data.get("type")) as FinanceRecord["paymentType"],status:"待支付",reviewStatus:"待复核",createdAt:nowTimestamp(),validity:String(data.get("validity"))};
    setFinance((items)=>[record,...items]);addLog("创建订单",record.orderNo,`${student.name} · ${record.course}`);setCreateOpen(false);notify(`订单 ${record.orderNo} 已生成`);
  };
  const submitRefund=(form:HTMLFormElement)=>{
    if(!refundTarget)return;const data=new FormData(form);const amount=Number(data.get("amount"));
    if(amount<=0||amount>refundTarget.refundable){notify(`退费金额不可超过可退余额 ${money(refundTarget.refundable)}`);return;}
    setRefundConfirm({target:refundTarget,amount,reason:String(data.get("reason"))});
  };
  const confirmRefund=()=>{
    if(!refundConfirm)return;const {target,amount,reason}=refundConfirm;
    setFinance((items)=>items.map((item)=>item.id===target.id?{...item,paid:item.paid-amount,refundable:item.refundable-amount,status:amount===target.refundable?"已退款":"部分退款"}:item));
    const student=activeStudents.find((item)=>item.id===target.studentId);if(student)updateStudent(student.id,{refundAmount:student.refundAmount+amount,paidAmount:Math.max(0,student.paidAmount-amount),remainingHours:Math.max(0,student.remainingHours-Math.round(amount/(target.tuition/target.hours))) },"退费");
    addLog("退费",target.orderNo,`${money(amount)} · ${reason}`);setRefundConfirm(null);setRefundTarget(null);notify("退费已提交，金额与剩余课时已同步更新");
  };
  const submitPayment=(form:HTMLFormElement)=>{if(!paymentTarget)return;const data=new FormData(form);const amount=Number(data.get("amount"));if(amount<=0){notify("请输入有效收款金额");return;}setFinance((items)=>items.map((item)=>item.id===paymentTarget.id?{...item,paid:item.paid+amount,refundable:item.refundable+amount,status:"待审核",reviewStatus:"待复核",paymentMethod:String(data.get("method")) as FinanceRecord["paymentMethod"]}:item));addLog("收款",paymentTarget.orderNo,`${money(amount)} · 待复核`);setPaymentTarget(null);notify("收款已登记并进入复核队列")};
  const reviewPayment=(record:FinanceRecord,result:"已通过"|"已驳回")=>{setFinance((items)=>items.map((item)=>item.id===record.id?{...item,reviewStatus:result,status:result==="已通过"?"已支付":"待审核"}:item));addLog("支付复核",record.orderNo,result);notify(`支付复核${result}`)};
  const applyBatch=()=>{notify(`已对 ${selected.size} 笔订单执行「${batchConfirm}」`);addLog(batchConfirm,`${selected.size} 笔订单`,"批量财务操作已确认");setBatch("");setBatchConfirm("");setSelected(new Set())};
  return <div className="student-section-body">
    <div className="student-kpi-grid">{kpis.map((item)=><Kpi icon={financeKpiIcon(item)} label={item.label} value={item.format==="money"?money(item.value):`${item.value.toLocaleString("zh-CN")} ${item.key==="students"?"位":"笔"}`} key={item.key}/>)}</div>
    <Card className="student-workspace-card"><div className="student-card-head"><Tabs items={allowedViews} active={effectiveView} onChange={setView}/><div>{selected.size>0&&(role==="超级管理员"||role==="销售顾问")&&<><select className="select" value={batch} onChange={(e)=>setBatch(e.target.value)}><option value="">批量操作</option><option>生成订单</option><option>批量续报</option><option>停课</option></select><Button disabled={!batch} onClick={()=>setBatchConfirm(batch)}>继续</Button></>}{can(role,"createOrder")&&<Button onClick={()=>setCreateOpen(true)}><Plus size={14}/>创建订单</Button>}</div></div>
      <div className="student-table-scroll"><table className="data-table student-finance-table"><thead><tr><th>选择</th><th>订单 / 学员</th><th>课程</th><th>课时</th>{canSeeField(role,"finance")&&<><th>应收</th><th>实收</th><th>支付方式</th></>}<th>状态</th>{canSeeField(role,"finance")&&<th>复核</th>}<th>创建时间</th><th>操作</th></tr></thead><tbody>{pageRows.map((item)=><tr key={item.id}><td><input aria-label={`选择订单${item.orderNo}`} type="checkbox" checked={selected.has(item.id)} onChange={()=>setSelected((current)=>{const next=new Set(current);next.has(item.id)?next.delete(item.id):next.add(item.id);return next;})}/></td><td><button className="student-name-btn" onClick={()=>openDetail(item,"order")}><strong>{item.orderNo}</strong></button><button className="student-linked-id" onClick={()=>openDetail(item,"student")}>{item.studentName} · {item.studentId}</button></td><td>{item.course}</td><td>{item.hours}</td>{canSeeField(role,"finance")&&<><td>{money(item.tuition-item.discount)}</td><td><strong>{money(item.paid)}</strong></td><td>{item.paymentType} · {item.paymentMethod}</td></>}<td><Badge tone={item.status==="已支付"?"green":item.status.includes("退款")?"red":"amber"}>{item.status}</Badge></td>{canSeeField(role,"finance")&&<td><Badge tone={item.reviewStatus==="已通过"?"green":item.reviewStatus==="已驳回"?"red":"amber"}>{item.reviewStatus}</Badge></td>}<td>{item.createdAt}</td><td><div className="row-actions">{canSeeField(role,"finance")&&<button onClick={()=>setVoucher(item)}>凭证</button>}{can(role,"payment")&&item.status==="待支付"&&<button onClick={()=>setPaymentTarget(item)}>收款</button>}{can(role,"payment")&&item.reviewStatus==="待复核"&&<><button onClick={()=>reviewPayment(item,"已通过")}>通过</button><button className="danger" onClick={()=>reviewPayment(item,"已驳回")}>驳回</button></>}{effectiveView==="退费管理"&&can(role,"refund")&&<button className="danger" onClick={()=>setRefundTarget(item)}>退费</button>}</div></td></tr>)}</tbody></table></div><div className="student-pagination"><span>共 {visible.length} 笔 · 第 {page}/{pageCount} 页</span><div><button aria-label="上一页" disabled={page===1} onClick={()=>setPage(page-1)}>上一页</button>{Array.from({length:Math.min(5,pageCount)},(_,index)=>index+1).map((item)=><button className={page===item?"active":""} onClick={()=>setPage(item)} key={item}>{item}</button>)}<button aria-label="下一页" disabled={page===pageCount} onClick={()=>setPage(page+1)}>下一页</button></div></div>
    </Card>
    <Modal open={createOpen} onClose={()=>setCreateOpen(false)} title="创建报名订单"><form onSubmit={(e)=>{e.preventDefault();createOrder(e.currentTarget)}}><div className="form-grid"><label className="field"><span>学员</span><select className="select" name="studentId">{activeStudents.slice(0,50).map((student)=><option value={student.id} key={student.id}>{student.name} · {maskPhone(student.phone)}</option>)}</select></label><label className="field"><span>课程 / 套餐</span><select className="select" name="course">{courses.map((item)=><option key={item}>{item}</option>)}</select></label><Field name="hours" label="课时" defaultValue="80"/><Field name="tuition" label="学费" defaultValue="12800"/><Field name="discount" label="优惠金额" defaultValue="800"/><label className="field"><span>支付类型</span><select className="select" name="type"><option>全款</option><option>分期</option><option>储值</option></select></label><label className="field"><span>支付方式</span><select className="select" name="method"><option>微信</option><option>支付宝</option><option>银行卡</option><option>储值</option></select></label><label className="field"><span>有效期</span><input className="input" type="date" name="validity" defaultValue="2027-09-30"/></label></div><div className="student-calc-line">实付金额自动计算：学费 - 优惠</div><div className="form-actions"><Button type="button" variant="secondary" onClick={()=>setCreateOpen(false)}>取消</Button><Button type="submit">生成订单</Button></div></form></Modal>
    <Modal open={Boolean(paymentTarget)} onClose={()=>setPaymentTarget(null)} title={`登记收款 · ${paymentTarget?.studentName??""}`}><form onSubmit={(e)=>{e.preventDefault();submitPayment(e.currentTarget)}}><div className="form-grid"><Field name="amount" label="本次收款"/><label className="field"><span>支付方式</span><select className="select" name="method"><option>微信</option><option>支付宝</option><option>银行卡</option><option>储值</option></select></label></div><div className="form-actions"><Button type="button" variant="secondary" onClick={()=>setPaymentTarget(null)}>取消</Button><Button type="submit">登记并提交复核</Button></div></form></Modal>
    <Modal open={Boolean(refundTarget)} onClose={()=>{setRefundTarget(null);setRefundFile(null)}} title={`申请退费 · ${refundTarget?.studentName??""}`}><form onSubmit={(e)=>{e.preventDefault();submitRefund(e.currentTarget)}}><div className="student-balance-box"><span>可退余额</span><strong>{money(refundTarget?.refundable??0)}</strong><small>订单 {refundTarget?.orderNo}</small></div><div className="form-grid"><Field name="amount" label="退费金额"/><label className="field"><span>退费类型</span><select className="select"><option>部分退费</option><option>全额退费</option></select></label><label className="field form-span-2"><span>退费原因</span><textarea name="reason" required/></label><label className="field form-span-2"><span>凭证</span><span className="student-file-input"><Upload size={14}/><input type="file" accept="image/*,.pdf" onChange={(e)=>setRefundFile(e.target.files?.[0]??null)}/><strong>{refundFile?`${refundFile.name} · ${(refundFile.size/1024).toFixed(1)} KB`:"请选择图片或 PDF"}</strong></span></label></div><div className="form-actions"><Button type="button" variant="secondary" onClick={()=>setRefundTarget(null)}>取消</Button><Button type="submit" variant="danger">提交审核</Button></div></form></Modal>
    <Modal open={Boolean(refundConfirm)} onClose={()=>setRefundConfirm(null)} title="确认退费影响"><p className="modal-intro">确认退费 {money(refundConfirm?.amount??0)}？提交后将同步扣减实收金额和按比例折算的剩余课时。</p><div className="form-actions"><Button variant="secondary" onClick={()=>setRefundConfirm(null)}>返回</Button><Button variant="danger" onClick={confirmRefund}>确认提交</Button></div></Modal>
    <Modal open={Boolean(batchConfirm)} onClose={()=>setBatchConfirm("")} title={`确认${batchConfirm}`}><p className="modal-intro">将对已选 {selected.size} 笔订单执行“{batchConfirm}”。该操作会写入审计日志。</p><div className="form-actions"><Button variant="secondary" onClick={()=>setBatchConfirm("")}>取消</Button><Button onClick={applyBatch}>确认执行</Button></div></Modal>
    <Drawer open={Boolean(detail)} onClose={closeDetail} title={detail?.kind==="student"?"学员最小身份信息":"订单详情"}>{detail&&<div className="detail-grid">{(detail.kind==="student"?[["学员编号",detail.record.studentId],["姓名",detail.record.studentName]]:[["订单号",detail.record.orderNo],["学员",detail.record.studentName],["课程",detail.record.course],["课时",String(detail.record.hours)],["状态",detail.record.status],["创建时间",detail.record.createdAt]]).map(([label,value])=><div className="detail-item" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>}</Drawer>
    <Drawer open={Boolean(voucher)} onClose={()=>setVoucher(null)} title="缴费凭证预览">{voucher&&<div className="student-voucher"><span>PAYMENT VOUCHER</span><h2>{money(voucher.paid)}</h2><p>{voucher.studentName} · {voucher.course}</p><div>{[["订单号",voucher.orderNo],["流水号",voucher.id],["支付方式",`${voucher.paymentType} · ${voucher.paymentMethod}`],["支付时间",voucher.createdAt],["复核状态",voucher.reviewStatus]].map(([a,b])=><p key={a}><span>{a}</span><strong>{b}</strong></p>)}</div><small><Link2 size={12}/>电子凭证仅供内部核对</small></div>}</Drawer>
  </div>;
}
function Kpi({icon,label,value}:{icon:React.ReactNode;label:string;value:string}){return <Card className="student-kpi"><span className="tone-blue">{icon}</span><div><small>{label}</small><strong>{value}</strong><p>2026 年 9 月</p></div></Card>}
function financeKpiIcon(item:FinanceKpi){
  if(item.key==="orderAmount"||item.key==="orders"||item.key==="newOrders")return <ReceiptText/>;
  if(item.key==="received"||item.key==="students")return <CircleDollarSign/>;
  if(item.key==="refunded"||item.key==="unpaid")return <RotateCcw/>;
  return <FileCheck2/>;
}
function Field({name,label,defaultValue}:{name:string;label:string;defaultValue?:string}){return <label className="field"><span>{label}</span><input className="input" name={name} type="number" min="0" defaultValue={defaultValue} required/></label>}
