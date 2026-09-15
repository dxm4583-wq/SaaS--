import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card } from "../../../components/ui";
import type { Tone } from "../types";

export function MarketingKpi({label,value,detail,trend,icon:Icon,tone="blue"}:{label:string;value:string;detail:string;trend?:string;icon:LucideIcon;tone?:Tone}) {
  return <Card className="marketing-kpi"><span className={`tone-${tone}`}><Icon size={16}/></span><div><small>{label}</small><strong>{value}</strong><p className={trend?.startsWith("-")?"down":""}>{trend&&<b>{trend}</b>}{detail}</p></div></Card>;
}

export function SectionCard({title,detail,actions,children,className=""}:{title:string;detail?:string;actions?:ReactNode;children:ReactNode;className?:string}) {
  return <Card className={`marketing-card ${className}`}><div className="marketing-card-head"><div><h2>{title}</h2>{detail&&<p>{detail}</p>}</div>{actions&&<div>{actions}</div>}</div>{children}</Card>;
}

export function MiniStat({label,value,detail}:{label:string;value:string;detail?:string}) {
  return <span className="marketing-mini-stat"><small>{label}</small><strong>{value}</strong>{detail&&<em>{detail}</em>}</span>;
}

export function ConfirmDialog({open,title,detail,confirmLabel,onClose,onConfirm,danger=false}:{open:boolean;title:string;detail:string;confirmLabel:string;onClose:()=>void;onConfirm:()=>void;danger?:boolean}) {
  if(!open)return null;
  return <div className="overlay modal-overlay" onMouseDown={onClose}><section className="modal marketing-confirm" role="dialog" aria-modal="true" onMouseDown={event=>event.stopPropagation()}><div className="drawer-head"><h2>{title}</h2></div><div className="drawer-body"><p>{detail}</p><div className="form-actions"><button className="btn btn-secondary" onClick={onClose}>取消</button><button className={`btn ${danger?"btn-danger":"btn-primary"}`} onClick={()=>{onConfirm();onClose();}}>{confirmLabel}</button></div></div></section></div>;
}
