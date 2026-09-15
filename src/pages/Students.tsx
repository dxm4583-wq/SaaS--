import { useEffect, useMemo, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { StudentProvider, useStudents } from "../features/students/StudentContext";
import { StudentHeader } from "../features/students/components/StudentHeader";
import { canVisit, firstSectionFor } from "../features/students/permissions";
import type { StudentSection } from "../features/students/types";
import OverviewSection from "../features/students/sections/OverviewSection";
import RecordsSection, { RecycleSection } from "../features/students/sections/RecordsSection";
import LeadsSection from "../features/students/sections/LeadsSection";
import FinanceSection from "../features/students/sections/FinanceSection";
import { AttendanceSection, ClassesSection, LearningSection } from "../features/students/sections/AcademicSections";
import { OperationsSection, ReportsSection } from "../features/students/sections/ReportsOperationsSections";

const validSections: StudentSection[] = ["overview","records","leads","finance","classes","attendance","learning","reports","operations","recycle"];

export default function Students(){
  return <StudentProvider><StudentPortal/></StudentProvider>;
}

function StudentPortal(){
  const {role,notify}=useStudents();
  const location=useLocation();
  const navigate=useNavigate();
  const routeSection=location.pathname.split("/")[2] as StudentSection|undefined;
  const section=validSections.includes(routeSection as StudentSection)?routeSection as StudentSection:"overview";
  const [createSignal,setCreateSignal]=useState(0);
  const [importSignal,setImportSignal]=useState(0);
  const allowed=canVisit(role,section);
  useEffect(()=>{
    if(!allowed){
      const next=firstSectionFor(role);
      navigate(`/students/${next}`,{replace:true});
      notify("当前角色无权访问该模块，已切换至允许页面");
    }
  },[allowed,navigate,notify,role]);
  const content=useMemo(()=>{
    if(!allowed)return null;
    if(section==="overview")return <OverviewSection/>;
    if(section==="records")return <RecordsSection openCreateSignal={createSignal} openImportSignal={importSignal} onCreateSignalConsumed={()=>setCreateSignal(0)} onImportSignalConsumed={()=>setImportSignal(0)}/>;
    if(section==="leads")return <LeadsSection/>;
    if(section==="finance")return <FinanceSection/>;
    if(section==="classes")return <ClassesSection/>;
    if(section==="attendance")return <AttendanceSection/>;
    if(section==="learning")return <LearningSection/>;
    if(section==="reports")return <ReportsSection/>;
    if(section==="operations")return <OperationsSection/>;
    if(section==="recycle")return <RecycleSection/>;
    return <Navigate to="/students/overview" replace/>;
  },[allowed,createSignal,importSignal,section]);
  return <div className="students-page" data-section={section}><StudentHeader section={section} onCreate={()=>setCreateSignal((value)=>value+1)} onImport={()=>setImportSignal((value)=>value+1)}/>{content}</div>;
}
