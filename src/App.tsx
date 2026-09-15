import { lazy, Suspense } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";

const AICreative = lazy(() => import("./pages/AICreative"));
const AIWorkspace = lazy(() => import("./pages/AIWorkspace"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Contracts = lazy(() => import("./pages/Contracts"));
const Customers = lazy(() => import("./pages/Customers"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Leads = lazy(() => import("./pages/Leads"));
const Marketing = lazy(() => import("./pages/Marketing"));
const Opportunities = lazy(() => import("./pages/Opportunities"));
const RBAC = lazy(() => import("./pages/RBAC"));
const SCRM = lazy(() => import("./pages/SCRM"));
const Students = lazy(() => import("./pages/Students"));
const StrategyCenter = lazy(() => import("./pages/StrategyCenter"));
const TenantManagement = lazy(() => import("./pages/TenantManagement"));
const Tasks = lazy(() => import("./pages/Tasks"));
const Tickets = lazy(() => import("./pages/Tickets"));

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<div className="route-loading">正在加载工作区...</div>}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Dashboard />} />
            <Route path="leads" element={<Leads />} />
            <Route path="marketing/*" element={<Marketing />} />
            <Route path="customers" element={<Customers />} />
            <Route path="opportunities" element={<Opportunities />} />
            <Route path="rbac" element={<RBAC />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="contracts" element={<Contracts />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="scrm" element={<SCRM />} />
            <Route path="students/*" element={<Students />} />
            <Route path="tenants" element={<TenantManagement />} />
            <Route path="strategies" element={<StrategyCenter />} />
            <Route path="ai-creative" element={<AICreative />} />
            <Route path="ai" element={<AIWorkspace />} />
            <Route path="tickets" element={<Tickets />} />
            <Route path="daily-reports" element={<Navigate to="/ai?view=reports" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
