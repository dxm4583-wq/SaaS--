import { useDeferredValue, useEffect, useMemo, useState } from "react";
import {
  ArrowDown, ArrowUp, Check, ChevronLeft, ChevronRight, Columns3, Download, FileSpreadsheet,
  Pencil, Plus, RotateCcw, Search, Settings2, Trash2, Upload, UserRound, X,
} from "lucide-react";
import { Badge, Button, Card, Drawer, EmptyState, Modal, Tabs } from "../../../components/ui";
import { classes, courses, lifecycleStatuses, owners, tags, teachers } from "../mockData";
import { can, canSeeField, detailTabsFor } from "../permissions";
import type { ColumnConfig, ColumnKey, LifecycleStatus, Student, StudentFilters } from "../types";
import { useStudents } from "../StudentContext";
import { creditMeta, defaultColumns, defaultFilters, exportStudentsCsv, maskId, maskPhone, nowTimestamp, readStorage, statusTone, writeStorage } from "../utils";

type SortState = { key: ColumnKey; direction: "asc" | "desc" };
type BatchAction = "标签" | "状态" | "班级" | "负责人" | "删除" | "";
const specialStatuses: LifecycleStatus[] = ["休学","停课","转班","结业","毕业","流失","黑名单"];

export default function RecordsSection({ openCreateSignal = 0, openImportSignal = 0, onCreateSignalConsumed, onImportSignalConsumed }:{openCreateSignal?:number;openImportSignal?:number;onCreateSignalConsumed?:()=>void;onImportSignalConsumed?:()=>void}) {
  const context = useStudents();
  const { role, activeStudents, filters, setFilters, columns, setColumns, notify, updateStudent, addStudent, softDelete } = context;
  const [draft,setDraft] = useState(filters);
  const deferredFilters = useDeferredValue(filters);
  const [sort,setSort] = useState<SortState>(()=>readStorage("student-sort",{key:"signupTime",direction:"desc"}));
  const [page,setPage] = useState(1);
  const [pageSize,setPageSize] = useState(20);
  const [selected,setSelected] = useState<Set<string>>(new Set());
  const [detail,setDetail] = useState<Student|null>(null);
  const [detailTab,setDetailTab] = useState("基础档案");
  const [detailLoading,setDetailLoading] = useState(false);
  const [createOpen,setCreateOpen] = useState(false);
  const [importOpen,setImportOpen] = useState(false);
  const [editTarget,setEditTarget] = useState<Student|null>(null);
  const [confirmEdit,setConfirmEdit] = useState<Partial<Student>|null>(null);
  const [columnsOpen,setColumnsOpen] = useState(false);
  const [batchAction,setBatchAction] = useState<BatchAction>("");
  const [deleteConfirm,setDeleteConfirm] = useState<string[]|null>(null);
  const [statusReason,setStatusReason] = useState<{student:Student;status:LifecycleStatus}|null>(null);
  const [batchStatusReason,setBatchStatusReason] = useState<{status:LifecycleStatus;ids:string[]}|null>(null);
  const [importFile,setImportFile] = useState<File|null>(null);
  const [conflict,setConflict] = useState<Student|null>(null);
  useEffect(()=>{if(openCreateSignal>0){setCreateOpen(true);onCreateSignalConsumed?.()}},[openCreateSignal,onCreateSignalConsumed]);
  useEffect(()=>{if(openImportSignal>0){setImportOpen(true);onImportSignalConsumed?.()}},[openImportSignal,onImportSignalConsumed]);
  const detailTabs = detailTabsFor(role);
  useEffect(()=>{if(!detailTabs.includes(detailTab))setDetailTab(detailTabs[0])},[detailTabs,detailTab]);

  const filtered = useMemo(() => activeStudents.filter((student) => {
    const keyword = deferredFilters.keyword.trim().toLowerCase();
    return (!keyword || `${student.name}${student.phone}${student.id}`.toLowerCase().includes(keyword))
      && (!deferredFilters.status || student.status===deferredFilters.status)
      && (!deferredFilters.className || student.className===deferredFilters.className)
      && (!deferredFilters.course || student.enrolledCourse===deferredFilters.course)
      && (!deferredFilters.owner || student.owner===deferredFilters.owner)
      && (!deferredFilters.tag || student.tags.includes(deferredFilters.tag))
      && (!deferredFilters.paymentState || student.paymentState===deferredFilters.paymentState)
      && (!deferredFilters.startDate || student.signupTime.slice(0,10)>=deferredFilters.startDate)
      && (!deferredFilters.endDate || student.signupTime.slice(0,10)<=deferredFilters.endDate);
  }).sort((a,b)=>{
    const key = sort.key === "student" ? "name" : sort.key === "course" ? "enrolledCourse" : sort.key === "credit" ? "creditScore" : sort.key === "payment" ? "paymentState" : sort.key;
    const first = a[key as keyof Student]; const second = b[key as keyof Student];
    const result = typeof first === "number" && typeof second === "number"
      ? first - second
      : String(first) < String(second) ? -1 : String(first) > String(second) ? 1 : 0;
    return result * (sort.direction==="asc"?1:-1);
  }),[activeStudents,deferredFilters,sort]);
  const pageCount = Math.max(1,Math.ceil(filtered.length/pageSize));
  const rows = filtered.slice((page-1)*pageSize,page*pageSize);
  const visibleColumns = columns.filter((column)=>{
    if(!column.visible)return false;
    if(role==="财务管理员")return ["student","phone","payment","signupTime"].includes(column.key);
    return (column.key!=="owner" || canSeeField(role,"sales")) && (column.key!=="payment" || canSeeField(role,"finance"));
  });
  const applyFilters = () => {setFilters(draft);setPage(1);notify("筛选条件已应用并保存");};
  const toggleSort = (key:ColumnKey) => setSort((current)=>{const next={key,direction:current.key===key&&current.direction==="asc"?"desc":"asc"} as SortState;writeStorage("student-sort",next);return next});
  const togglePage = (checked:boolean) => {
    const ids = new Set(rows.map((row)=>row.id));
    setSelected((current)=>{const next=new Set(current);ids.forEach((id)=>checked?next.add(id):next.delete(id));return next;});
  };
  const openDetailTab = (tab:string) => {setDetailLoading(true);setDetailTab(tab);window.setTimeout(()=>setDetailLoading(false),180);};
  const createStudent = (form:HTMLFormElement) => {
    const data=new FormData(form); const phone=String(data.get("phone")); const idCard=String(data.get("idCard"));
    const duplicate=context.students.find((student)=>student.phone===phone||student.idCard===idCard);
    if(duplicate){setConflict(duplicate);return;}
    const name=String(data.get("name"));
    const student:Student={...activeStudents[0],id:`STU-NEW-${Date.now()}`,name,gender:String(data.get("gender")) as Student["gender"],age:Number(data.get("age")),phone,idCard,emergencyContact:String(data.get("emergencyContact")),emergencyPhone:String(data.get("emergencyPhone")),parentName:String(data.get("parentName")),parentPhone:String(data.get("parentPhone")),school:String(data.get("school")),channel:String(data.get("channel")),intendedCourse:String(data.get("intendedCourse")),enrolledCourse:String(data.get("intendedCourse")),tags:data.getAll("tags").map(String),status:String(data.get("status")) as LifecycleStatus,academicStatus:"待分班",className:"待分班",teacher:"待分配",owner:role==="销售顾问"?"林晓曼":owners[0],signupTime:nowTimestamp(),paymentState:"未支付",contractStatus:"草稿",orderNo:`EDU${Date.now()}`,paidAmount:0,tuitionAmount:0,refundAmount:0,totalHours:0,consumedHours:0,remainingHours:0,expiredHours:0,attendanceRate:0,assignmentCompletion:0,latestScore:0,creditScore:80,notes:String(data.get("notes"))};
    addStudent(student);setCreateOpen(false);notify(`${name} 的学员档案已创建`);
  };
  const submitEdit = (form:HTMLFormElement) => {
    if(!editTarget)return; const data=new FormData(form);
    const changes:Partial<Student>={name:String(data.get("name")),phone:String(data.get("phone")),className:String(data.get("className")),notes:String(data.get("notes"))};
    if(canSeeField(role,"sales"))changes.owner=String(data.get("owner"));
    setConfirmEdit(changes);
  };
  const applyBatch = (value:string) => {
    const ids=[...selected];
    if(batchAction==="删除"){setBatchAction("");setDeleteConfirm(ids);return;}
    if(batchAction==="状态"&&specialStatuses.includes(value as LifecycleStatus)){setBatchAction("");setBatchStatusReason({status:value as LifecycleStatus,ids});return;}
    ids.forEach((id)=>updateStudent(id,batchAction==="标签"?{tags:[value]}:batchAction==="状态"?{status:value as LifecycleStatus}:batchAction==="班级"?{className:value}:{owner:value},`批量${batchAction}`));
    setBatchAction("");setSelected(new Set());notify(`已批量更新 ${ids.length} 位学员`);
  };

  return <div className="student-section-body">
    <Card className="student-filter-card">
      <div className="student-filter-grid">
        <label className="student-search"><Search size={14}/><input value={draft.keyword} onChange={(e)=>setDraft({...draft,keyword:e.target.value})} onKeyDown={(e)=>e.key==="Enter"&&applyFilters()} placeholder="姓名 / 手机号 / 学员编号"/></label>
        <FilterSelect label="状态" value={draft.status} items={lifecycleStatuses} onChange={(value)=>setDraft({...draft,status:value})}/>
        <FilterSelect label="班级" value={draft.className} items={classes} onChange={(value)=>setDraft({...draft,className:value})}/>
        <FilterSelect label="课程" value={draft.course} items={courses} onChange={(value)=>setDraft({...draft,course:value})}/>
        {canSeeField(role,"sales")&&<FilterSelect label="负责人" value={draft.owner} items={owners} onChange={(value)=>setDraft({...draft,owner:value})}/>}
        <FilterSelect label="标签" value={draft.tag} items={tags} onChange={(value)=>setDraft({...draft,tag:value})}/>
        {canSeeField(role,"finance")&&<FilterSelect label="缴费" value={draft.paymentState} items={["未支付","部分支付","已支付","已退款"]} onChange={(value)=>setDraft({...draft,paymentState:value})}/>}
        <label><span>报名日期起</span><input type="date" value={draft.startDate} onChange={(e)=>setDraft({...draft,startDate:e.target.value})}/></label>
        <label><span>报名日期止</span><input type="date" value={draft.endDate} onChange={(e)=>setDraft({...draft,endDate:e.target.value})}/></label>
      </div>
      <div className="student-filter-actions"><span>共匹配 <strong>{filtered.length.toLocaleString("zh-CN")}</strong> 位学员</span><Button variant="ghost" onClick={()=>{setDraft(defaultFilters);setFilters(defaultFilters);setPage(1)}}><RotateCcw size={13}/>重置</Button><Button onClick={applyFilters}>查询</Button></div>
    </Card>
    <div className="student-list-actions">
      <div>{selected.size>0&&<><strong>已选 {selected.size} 项</strong>{can(role,"edit")&&<Button variant="secondary" onClick={()=>setBatchAction("标签")}>批量标签</Button>}{can(role,"classManage")&&<Button variant="secondary" onClick={()=>setBatchAction("班级")}>批量分班</Button>}{can(role,"assign")&&<Button variant="secondary" onClick={()=>setBatchAction("负责人")}>批量负责人</Button>}{can(role,"edit")&&<Button variant="secondary" onClick={()=>setBatchAction("状态")}>批量状态</Button>}{can(role,"export")&&<Button variant="secondary" onClick={()=>exportStudentsCsv(filtered.filter((item)=>selected.has(item.id)))}><Download size={13}/>导出</Button>}{can(role,"delete")&&<Button variant="danger" onClick={()=>setDeleteConfirm([...selected])}><Trash2 size={13}/>删除</Button>}</>}</div>
      <Button variant="secondary" onClick={()=>setColumnsOpen(true)}><Columns3 size={14}/>列设置</Button>
    </div>
    <Card className="student-record-card">
      <div className="student-table-scroll" role="region" tabIndex={0} aria-label="学员档案表格，可横向滚动">
        <table className="data-table student-record-table"><thead><tr><th className="student-check-col"><input aria-label="选择当前页" type="checkbox" checked={rows.length>0&&rows.every((row)=>selected.has(row.id))} onChange={(e)=>togglePage(e.target.checked)}/></th>{visibleColumns.map((column)=><th style={{width:column.width,minWidth:column.width}} key={column.key}><button onClick={()=>toggleSort(column.key)}>{column.label}{sort.key===column.key&&(sort.direction==="asc"?<ArrowUp size={11}/>:<ArrowDown size={11}/>)}</button></th>)}<th className="student-action-col">操作</th></tr></thead><tbody>{rows.map((student)=><tr className={selected.has(student.id)?"selected":""} key={student.id}><td><input aria-label={`选择${student.name}`} type="checkbox" checked={selected.has(student.id)} onChange={()=>setSelected((current)=>{const next=new Set(current);next.has(student.id)?next.delete(student.id):next.add(student.id);return next;})}/></td>{visibleColumns.map((column)=><td key={column.key}>{renderCell(column.key,student,()=>setDetail(student))}</td>)}<td><div className="row-actions"><button onClick={()=>setDetail(student)}>详情</button>{can(role,"edit")&&<button onClick={()=>setEditTarget(student)}>编辑</button>}{can(role,"delete")&&<button className="danger" onClick={()=>setDeleteConfirm([student.id])}>删除</button>}</div></td></tr>)}</tbody></table>
        {!rows.length&&<EmptyState title="无匹配学员" detail="请调整筛选条件或清除筛选后重试。"/>}
      </div>
      <Pagination page={page} pageCount={pageCount} total={filtered.length} pageSize={pageSize} setPage={setPage} setPageSize={(size)=>{setPageSize(size);setPage(1)}}/>
    </Card>

    <Drawer open={Boolean(detail)} onClose={()=>setDetail(null)} title={detail?`${detail.name} · ${detail.id}`:"学员详情"} wide>
      {detail&&<div className="student-detail"><div className="student-detail-hero"><span className="student-avatar"><UserRound size={21}/></span><div><div><Badge tone={statusTone(detail.status)}>{detail.status}</Badge>{role!=="财务管理员"&&detail.tags.map((tag)=><Badge tone="blue" key={tag}>{tag}</Badge>)}</div><h3>{detail.name}</h3><p>{maskPhone(detail.phone)}{role!=="财务管理员"&&<> · {maskId(detail.idCard)} · {detail.enrolledCourse}</>}</p></div>{can(role,"edit")&&<label>生命周期<select value={detail.status} onChange={(e)=>{const status=e.target.value as LifecycleStatus;if(specialStatuses.includes(status))setStatusReason({student:detail,status});else{updateStudent(detail.id,{status},"状态变更");setDetail({...detail,status});}}}>{lifecycleStatuses.map((status)=><option key={status}>{status}</option>)}</select></label>}</div>
        <Tabs items={detailTabs} active={detailTab} onChange={openDetailTab}/>
        {detailLoading?<div className="student-detail-skeleton"><i/><i/><i/><i/></div>:<DetailContent tab={detailTab} student={detail} role={role} onUpdate={(changes)=>{updateStudent(detail.id,changes);setDetail({...detail,...changes})}}/>}
      </div>}
    </Drawer>
    <StudentFormModal open={createOpen} title="新建学员档案" onClose={()=>setCreateOpen(false)} onSubmit={createStudent}/>
    <Modal open={Boolean(editTarget)} onClose={()=>setEditTarget(null)} title={`编辑学员 · ${editTarget?.name??""}`}>{editTarget&&<form onSubmit={(e)=>{e.preventDefault();submitEdit(e.currentTarget)}}><div className="form-grid"><Input name="name" label="姓名" value={editTarget.name}/><Input name="phone" label="手机号" value={editTarget.phone}/><Select name="className" label="班级" value={editTarget.className} items={classes}/>{canSeeField(role,"sales")&&<Select name="owner" label="负责人" value={editTarget.owner} items={owners}/>}<label className="field form-span-2"><span>备注</span><textarea name="notes" defaultValue={editTarget.notes}/></label></div><div className="form-actions"><Button type="button" variant="secondary" onClick={()=>setEditTarget(null)}>取消</Button><Button type="submit">继续</Button></div></form>}</Modal>
    <Modal open={Boolean(confirmEdit)} onClose={()=>setConfirmEdit(null)} title="确认核心字段变更"><p className="modal-intro">姓名、手机号、班级或负责人变更将写入操作日志。确认提交本次修改？</p><div className="form-actions"><Button variant="secondary" onClick={()=>setConfirmEdit(null)}>返回检查</Button><Button onClick={()=>{if(editTarget&&confirmEdit){updateStudent(editTarget.id,confirmEdit);notify("学员档案已更新并写入日志");}setConfirmEdit(null);setEditTarget(null)}}>确认修改</Button></div></Modal>
    <ImportModal open={importOpen} file={importFile} setFile={setImportFile} onClose={()=>{setImportOpen(false);setImportFile(null)}} onImport={()=>{const template=activeStudents[0]??context.students[0];["陈晓","林语","周然"].forEach((name,index)=>addStudent({...template,id:`STU-IMP-${Date.now()}-${index}`,name,phone:`1399000000${index}`,idCard:`3101011990010100${index}`,enrolledCourse:[courses[0],courses[1],courses[2]][index],intendedCourse:[courses[0],courses[1],courses[2]][index],owner:role==="销售顾问"?"林晓曼":template.owner,signupTime:nowTimestamp(),deletedAt:undefined}));setImportOpen(false);setImportFile(null);notify("已导入 3 条有效学员记录，2 条错误未导入")}}/>
    <ColumnModal open={columnsOpen} columns={columns} setColumns={setColumns} onClose={()=>setColumnsOpen(false)}/>
    <BatchModal action={batchAction} close={()=>setBatchAction("")} count={selected.size} apply={applyBatch}/>
    <Modal open={Boolean(deleteConfirm)} onClose={()=>setDeleteConfirm(null)} title="高风险操作确认"><div className="student-danger-copy"><Trash2 size={21}/><div><strong>将 {deleteConfirm?.length??0} 位学员移入回收站？</strong><p>相关订单、考勤与学习记录不会删除，超级管理员可在回收站恢复。</p></div></div><div className="form-actions"><Button variant="secondary" onClick={()=>setDeleteConfirm(null)}>取消</Button><Button variant="danger" onClick={()=>{if(deleteConfirm){softDelete(deleteConfirm);notify(`已将 ${deleteConfirm.length} 位学员移入回收站`);}setDeleteConfirm(null);setSelected(new Set())}}>确认删除</Button></div></Modal>
    <Modal open={Boolean(statusReason)} onClose={()=>setStatusReason(null)} title={`变更为${statusReason?.status??""}`}><label className="field"><span>变更原因（必填）</span><textarea id="status-reason" placeholder="说明特殊状态变更原因"/></label><div className="form-actions"><Button variant="secondary" onClick={()=>setStatusReason(null)}>取消</Button><Button onClick={()=>{const reason=(document.getElementById("status-reason") as HTMLTextAreaElement)?.value.trim();if(!reason)return notify("请填写状态变更原因");if(statusReason){updateStudent(statusReason.student.id,{status:statusReason.status},`状态变更：${reason}`);setDetail({...statusReason.student,status:statusReason.status});}setStatusReason(null);notify("状态已更新并写入日志")}}>确认变更</Button></div></Modal>
    <Modal open={Boolean(batchStatusReason)} onClose={()=>setBatchStatusReason(null)} title={`批量变更为${batchStatusReason?.status??""}`}><label className="field"><span>变更原因（必填）</span><textarea id="batch-status-reason" placeholder="说明批量特殊状态变更原因"/></label><div className="form-actions"><Button variant="secondary" onClick={()=>setBatchStatusReason(null)}>取消</Button><Button onClick={()=>{const reason=(document.getElementById("batch-status-reason") as HTMLTextAreaElement)?.value.trim();if(!reason)return notify("请填写状态变更原因");batchStatusReason?.ids.forEach((id)=>updateStudent(id,{status:batchStatusReason.status},`批量状态变更：${reason}`));setSelected(new Set());setBatchStatusReason(null);notify("批量状态已更新并写入原因")}}>确认变更</Button></div></Modal>
    <Modal open={Boolean(conflict)} onClose={()=>setConflict(null)} title="重复档案冲突"><div className="student-danger-copy"><X size={21}/><div><strong>无法创建：手机号或证件号重复</strong><p>冲突学员：{conflict?.name} · {conflict&&maskPhone(conflict.phone)} · {conflict&&maskId(conflict.idCard)}</p></div></div><div className="form-actions"><Button onClick={()=>setConflict(null)}>返回修改</Button></div></Modal>
  </div>;
}

export function RecycleSection() {
  const {deletedStudents,restore,permanentDelete,notify}=useStudents();
  const [selected,setSelected]=useState<Set<string>>(new Set());
  const [danger,setDanger]=useState<string[]|null>(null);
  const rows=deletedStudents.slice(0,100);
  return <div className="student-section-body"><div className="student-list-actions"><div><strong>回收站共 {deletedStudents.length} 条</strong><span>软删除记录保留 30 天</span></div><div>{selected.size>0&&<><Button variant="secondary" onClick={()=>{restore([...selected]);setSelected(new Set());notify("所选学员已恢复")}}>批量恢复</Button><Button variant="danger" onClick={()=>setDanger([...selected])}>永久删除</Button></>}</div></div><Card><div className="student-table-scroll"><table className="data-table"><thead><tr><th>选择</th><th>学员</th><th>手机号</th><th>课程</th><th>负责人</th><th>删除时间</th><th>操作</th></tr></thead><tbody>{rows.map((student)=><tr key={student.id}><td><input type="checkbox" checked={selected.has(student.id)} onChange={()=>setSelected((current)=>{const next=new Set(current);next.has(student.id)?next.delete(student.id):next.add(student.id);return next;})}/></td><td><strong>{student.name}</strong><small className="table-subline">{student.id}</small></td><td>{maskPhone(student.phone)}</td><td>{student.enrolledCourse}</td><td>{student.owner}</td><td>{student.deletedAt}</td><td><div className="row-actions"><button onClick={()=>{restore([student.id]);notify(`${student.name} 已恢复`)}}>恢复</button><button className="danger" onClick={()=>setDanger([student.id])}>永久删除</button></div></td></tr>)}</tbody></table>{!rows.length&&<EmptyState title="回收站为空" detail="删除的学员档案会暂存在这里。"/>}</div></Card><Modal open={Boolean(danger)} onClose={()=>setDanger(null)} title="永久删除确认"><div className="student-danger-copy"><Trash2 size={21}/><div><strong>永久删除 {danger?.length??0} 条档案？</strong><p>此操作不可撤销，关联展示数据也将从当前演示会话移除。</p></div></div><div className="form-actions"><Button variant="secondary" onClick={()=>setDanger(null)}>取消</Button><Button variant="danger" onClick={()=>{if(danger)permanentDelete(danger);setDanger(null);setSelected(new Set());notify("档案已永久删除")}}>永久删除</Button></div></Modal></div>;
}

function renderCell(key:ColumnKey,student:Student,open:()=>void){
  if(key==="student")return <button className="student-name-btn" onClick={open}><strong>{student.name}</strong><small>{student.id}</small></button>;
  if(key==="phone")return maskPhone(student.phone);
  if(key==="course")return student.enrolledCourse;
  if(key==="className")return student.className;
  if(key==="teacher")return student.teacher;
  if(key==="owner")return student.owner;
  if(key==="status")return <Badge tone={statusTone(student.status)}>{student.status}</Badge>;
  if(key==="tags")return <span className="student-tag-cell">{student.tags.length?student.tags.slice(0,2).map((tag)=><Badge tone="blue" key={tag}>{tag}</Badge>):"无"}</span>;
  if(key==="credit"){const meta=creditMeta(student.creditScore);return <span>{student.creditScore} <Badge tone={meta.tone}>{meta.label}</Badge></span>;}
  if(key==="remainingHours")return <strong className={student.remainingHours<10?"text-red":""}>{student.remainingHours}</strong>;
  if(key==="payment")return <Badge tone={student.paymentState==="已支付"?"green":student.paymentState==="未支付"?"red":"amber"}>{student.paymentState}</Badge>;
  return student.signupTime;
}
function FilterSelect({label,value,items,onChange}:{label:string;value:string;items:readonly string[];onChange:(value:string)=>void}){return <label><span>{label}</span><select value={value} onChange={(e)=>onChange(e.target.value)}><option value="">全部</option>{items.map((item)=><option key={item}>{item}</option>)}</select></label>}
function Pagination({page,pageCount,total,pageSize,setPage,setPageSize}:{page:number;pageCount:number;total:number;pageSize:number;setPage:(p:number)=>void;setPageSize:(s:number)=>void}){return <div className="student-pagination"><span>共 {total.toLocaleString("zh-CN")} 条 · 第 {page}/{pageCount} 页</span><label>每页<select aria-label="每页显示数量" value={pageSize} onChange={(e)=>setPageSize(Number(e.target.value))}>{[20,50,100].map((size)=><option key={size}>{size}</option>)}</select></label><div><button aria-label="上一页" disabled={page<=1} onClick={()=>setPage(page-1)}><ChevronLeft size={14}/></button>{Array.from({length:Math.min(5,pageCount)},(_,index)=>Math.max(1,Math.min(pageCount-4,page-2))+index).map((item)=><button aria-label={`第 ${item} 页`} aria-current={item===page?"page":undefined} className={item===page?"active":""} onClick={()=>setPage(item)} key={item}>{item}</button>)}<button aria-label="下一页" disabled={page>=pageCount} onClick={()=>setPage(page+1)}><ChevronRight size={14}/></button></div></div>}
function Input({name,label,value,type="text",required=true}:{name:string;label:string;value?:string;type?:string;required?:boolean}){return <label className="field"><span>{label}</span><input className="input" name={name} type={type} defaultValue={value} required={required}/></label>}
function Select({name,label,value,items}:{name:string;label:string;value?:string;items:readonly string[]}){return <label className="field"><span>{label}</span><select className="select" name={name} defaultValue={value}>{items.map((item)=><option key={item}>{item}</option>)}</select></label>}
function StudentFormModal({open,title,onClose,onSubmit}:{open:boolean;title:string;onClose:()=>void;onSubmit:(form:HTMLFormElement)=>void}){return <Modal open={open} onClose={onClose} title={title}><form onSubmit={(e)=>{e.preventDefault();onSubmit(e.currentTarget)}}><div className="form-grid"><Input name="name" label="姓名"/><Select name="gender" label="性别" items={["男","女"]}/><Input name="age" label="年龄" type="number"/><Input name="phone" label="手机号"/><Input name="idCard" label="身份证号"/><Input name="emergencyContact" label="紧急联系人"/><Input name="emergencyPhone" label="紧急联系电话"/><Input name="parentName" label="家长姓名"/><Input name="parentPhone" label="家长手机号"/><Input name="school" label="学校"/><Select name="channel" label="来源渠道" items={["官网咨询","企微私域","线下活动","转介绍","抖音直播","图书课程"]}/><Select name="intendedCourse" label="意向课程" items={courses}/><Select name="status" label="生命周期" items={lifecycleStatuses}/><fieldset className="student-tag-picker form-span-2"><legend>标签</legend>{tags.map((tag)=><label key={tag}><input type="checkbox" name="tags" value={tag}/>{tag}</label>)}</fieldset><label className="field form-span-2"><span>备注</span><textarea name="notes" placeholder="记录学习目标、沟通偏好或风险信息"/></label></div><div className="form-actions"><Button type="button" variant="secondary" onClick={onClose}>取消</Button><Button type="submit"><Plus size={14}/>创建档案</Button></div></form></Modal>}
function ImportModal({open,file,setFile,onClose,onImport}:{open:boolean;file:File|null;setFile:(file:File|null)=>void;onClose:()=>void;onImport:()=>void}){const preview=[["陈晓","13800138001","CPA会计全程班","有效"],["林语","13800138002","中级会计精品班","有效"],["周然","13800138003","初级会计冲刺班","有效"],["","13800138004","税务师高端班","姓名为空"],["顾宁","13800138001","CPA会计全程班","手机号重复"]];return <Modal open={open} onClose={onClose} title="Excel 批量导入"><label className="student-dropzone"><FileSpreadsheet size={26}/><strong>{file?file.name:"拖放 Excel 文件至此，或点击选择"}</strong><small>{file?`${(file.size/1024).toFixed(1)} KB · 待校验`:"支持 .xlsx / .xls / .csv，单次最多 5,000 条"}</small><input type="file" accept=".xlsx,.xls,.csv" onChange={(e)=>setFile(e.target.files?.[0]??null)}/></label>{file&&<><div className="student-import-summary"><span><b>3</b>有效</span><span><b>2</b>错误</span><span><b>1</b>重复</span></div><div className="student-table-scroll student-import-preview" role="region" aria-label="导入校验预览，可横向滚动" tabIndex={0}><table className="data-table"><thead><tr><th>姓名</th><th>手机号</th><th>课程</th><th>校验</th></tr></thead><tbody>{preview.map((row,index)=><tr className={index>2?"error":""} key={index}>{row.map((cell,i)=><td key={i}>{i===1?maskPhone(cell):i===3?<Badge tone={index>2?"red":"green"}>{cell}</Badge>:cell||"无"}</td>)}</tr>)}</tbody></table></div></>}<div className="form-actions"><Button variant="ghost" onClick={()=>downloadTemplate("学员导入模板.csv","姓名,手机号,身份证号,课程,来源\n")}>下载模板</Button>{file&&<Button variant="secondary" onClick={()=>downloadTemplate("导入错误清单.csv","行号,原因\n4,姓名为空\n5,手机号重复")}>下载错误清单</Button>}<Button variant="secondary" onClick={onClose}>取消</Button><Button disabled={!file} onClick={onImport}><Upload size={14}/>导入有效行</Button></div></Modal>}
function downloadTemplate(name:string,content:string){const blob=new Blob(["\ufeff",content],{type:"text/csv"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=name;a.click();URL.revokeObjectURL(url)}
function ColumnModal({open,columns,setColumns,onClose}:{open:boolean;columns:ColumnConfig[];setColumns:React.Dispatch<React.SetStateAction<ColumnConfig[]>>;onClose:()=>void}){const move=(index:number,direction:-1|1)=>{const target=index+direction;if(target<0||target>=columns.length)return;setColumns((items)=>{const next=[...items];[next[index],next[target]]=[next[target],next[index]];return next})};return <Modal open={open} onClose={onClose} title="列显示与顺序"><div className="student-column-list">{columns.map((column,index)=><div draggable onDragStart={(e)=>e.dataTransfer.setData("text/plain",String(index))} onDragOver={(e)=>e.preventDefault()} onDrop={(e)=>{const from=Number(e.dataTransfer.getData("text/plain"));if(from===index)return;setColumns((items)=>{const next=[...items];const [item]=next.splice(from,1);next.splice(index,0,item);return next})}} key={column.key}><Settings2 size={14}/><label><input type="checkbox" checked={column.visible} onChange={()=>setColumns((items)=>items.map((item)=>item.key===column.key?{...item,visible:!item.visible}:item))}/>{column.label}</label><input aria-label={`${column.label}宽度`} type="range" min="70" max="260" value={column.width} onChange={(e)=>setColumns((items)=>items.map((item)=>item.key===column.key?{...item,width:Number(e.target.value)}:item))}/><b>{column.width}px</b><button aria-label={`${column.label}上移`} disabled={index===0} onClick={()=>move(index,-1)}><ArrowUp size={13}/></button><button aria-label={`${column.label}下移`} disabled={index===columns.length-1} onClick={()=>move(index,1)}><ArrowDown size={13}/></button></div>)}</div><div className="form-actions"><Button variant="ghost" onClick={()=>setColumns(defaultColumns)}>恢复默认</Button><Button onClick={onClose}><Check size={14}/>保存布局</Button></div></Modal>}
function BatchModal({action,close,count,apply}:{action:BatchAction;close:()=>void;count:number;apply:(value:string)=>void}){const items=action==="标签"?tags:action==="状态"?lifecycleStatuses:action==="班级"?classes:owners;return <Modal open={Boolean(action)} onClose={close} title={`批量${action}`}><p className="modal-intro">将对已选的 {count} 位学员执行批量{action}操作。</p>{action!=="删除"&&<label className="field"><span>选择{action}</span><select id="batch-value" className="select">{items.map((item)=><option key={item}>{item}</option>)}</select></label>}<div className="form-actions"><Button variant="secondary" onClick={close}>取消</Button><Button onClick={()=>apply((document.getElementById("batch-value") as HTMLSelectElement)?.value??"")}>确认应用</Button></div></Modal>}
function DetailContent({tab,student,role,onUpdate}:{tab:string;student:Student;role:import("../types").StudentRole;onUpdate:(changes:Partial<Student>)=>void}){if(tab==="基础档案"){const items=role==="财务管理员"?[["手机号",maskPhone(student.phone)],["报名时间",student.signupTime]]:[["手机号",maskPhone(student.phone)],["身份证",maskId(student.idCard)],["学校",student.school],["家长",`${student.parentName} · ${maskPhone(student.parentPhone)}`],["紧急联系人",`${student.emergencyContact} · ${maskPhone(student.emergencyPhone)}`],["来源",student.channel],["信用",`${student.creditScore} · ${creditMeta(student.creditScore).label}`],["报名时间",student.signupTime]];return <><div className="detail-grid">{items.map(([label,value])=><div className="detail-item" key={label}><span>{label}</span><strong>{value||"无"}</strong></div>)}</div>{can(role,"edit")&&<div className="student-inline-tags">{student.tags.map((tag)=><button title="移除标签" onClick={()=>onUpdate({tags:student.tags.filter((item)=>item!==tag)})} key={tag}>{tag}<X size={11}/></button>)}<select aria-label="添加标签" onChange={(e)=>{if(e.target.value&&!student.tags.includes(e.target.value))onUpdate({tags:[...student.tags,e.target.value]});e.target.value=""}}><option value="">+ 添加标签</option>{tags.map((tag)=><option key={tag}>{tag}</option>)}</select></div>}</>;}const content:Record<string,string[]>= {"报名订单":[`${student.orderNo} · ${student.enrolledCourse}`,`合同状态：${student.contractStatus}`],"缴费记录":[`已缴 ¥${student.paidAmount.toLocaleString()}`,`退费 ¥${student.refundAmount.toLocaleString()}`],"班级排班":[`${student.className} · 教师 ${student.teacher}`,"周二 / 周四 19:00"],"考勤记录":[`当前出勤率 ${student.attendanceRate}%`,"最近 10 次：8 出勤 / 1 请假 / 1 缺勤"],"作业成绩":[`作业完成率 ${student.assignmentCompletion}%`,`最新测评 ${student.latestScore} 分`],"跟进记录":[student.notes,"2026-09-14 16:20:00 · 电话沟通"],"奖惩记录":["课堂积极发言 +2 分","本期无处罚记录"],"结业档案":[student.status==="毕业"?"证书已签发":"暂未生成结业证书","预计结业：2026-12-20"]};return <div className="student-detail-list">{(content[tab]??["无"]).map((item,index)=><article key={item}><span>{index+1}</span><div><strong>{item}</strong><small>{index===0?"主要记录":"最近更新：2026-09-15 10:00:00"}</small></div></article>)}</div>}
