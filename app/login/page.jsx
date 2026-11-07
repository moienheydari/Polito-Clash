"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" }); const [error, setError] = useState(""); const router = useRouter();
  async function submit(e) { e.preventDefault(); setError(""); const res = await fetch("/api/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) }); const data = await res.json(); if (!res.ok) return setError(data.error); router.push("/dashboard"); router.refresh(); }
  return <main className="flex min-h-screen items-center justify-center p-6"><form onSubmit={submit} className="card w-full max-w-md"><div className="mb-8 text-center"><div className="text-4xl font-black text-navy">Polito <span className="text-orange">Clash</span></div><p className="mt-2 text-slate-500">Think fast. Learn more.</p></div><label className="label">Email<input className="field" type="email" required value={form.email} onChange={e => setForm({...form,email:e.target.value})}/></label><label className="label mt-4">Password<input className="field" type="password" required value={form.password} onChange={e => setForm({...form,password:e.target.value})}/></label>{error && <p className="mt-4 text-sm text-red-600">{error}</p>}<button className="btn-primary mt-6 w-full">Log in</button><a className="mt-5 block text-center text-sm font-bold text-navy" href="/register">Create an account</a></form></main>;
}
