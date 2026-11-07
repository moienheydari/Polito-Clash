"use client";
import { useRouter } from "next/navigation";
export default function Nav(){const router=useRouter();return <header className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4"><a href="/dashboard" className="text-xl font-black text-navy">StudyDuel <span className="text-orange">AI</span></a><button className="text-sm font-bold text-slate-500" onClick={async()=>{await fetch("/api/auth/logout",{method:"POST"});router.push("/login");router.refresh();}}>Log out</button></header>}
