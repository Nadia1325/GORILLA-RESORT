import { FormEvent, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../api";

function EyeIcon({ slash = false }: { slash?: boolean }) {
  return slash ? (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 3l18 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83M9.88 4.24A10.94 10.94 0 0 1 12 4c5 0 8.5 5 8.5 5a15.5 15.5 0 0 1-3.02 3.42M6.61 6.62C4.62 8.08 3.5 10 3.5 10S7 15 12 15c.73 0 1.43-.1 2.09-.27" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ) : (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8"/>
    </svg>
  );
}

export default function ManagerResetPasswordPage(){
  const [params]=useSearchParams(); const navigate=useNavigate(); const token=params.get("token")||"";
  const [password,setPassword]=useState(""); const [confirm,setConfirm]=useState(""); const [showPassword,setShowPassword]=useState(false); const [showConfirm,setShowConfirm]=useState(false);
  const [status,setStatus]=useState(""); const [busy,setBusy]=useState(false);
  const submit=async(e:FormEvent)=>{e.preventDefault(); if(password!==confirm){setStatus("Passwords do not match.");return;} setBusy(true); try{const r=await api.resetPassword(token,password);setStatus(r.message);}catch(err){setStatus(err instanceof Error?err.message:"Could not reset password.");}finally{setBusy(false);}};
  return <main className="min-h-screen bg-sand-50 px-4 pb-20 pt-28 dark:bg-tide-950 sm:px-6"><div className="mx-auto max-w-md"><Link to="/manager" className="text-sm font-semibold text-tide-700 dark:text-gold-300">← Manager login</Link><div className="card-surface mt-8 rounded-3xl p-7 shadow-card sm:p-10"><span className="eyebrow">Account recovery</span><h1 className="mt-3 font-display text-4xl text-tide-900 dark:text-sand-50">Reset manager password</h1><form onSubmit={submit} className="mt-7 space-y-4">
    <div className="relative"><input required minLength={10} type={showPassword?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="New password (10+ characters)" className="w-full rounded-xl border p-3 pr-12 dark:bg-tide-950" autoComplete="new-password"/><button type="button" onClick={()=>setShowPassword(v=>!v)} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-gold-500 transition hover:text-gold-300" aria-label={showPassword?"Hide new password":"Show new password"} title={showPassword?"Hide new password":"Show new password"}><EyeIcon slash={showPassword}/></button></div>
    <div className="relative"><input required minLength={10} type={showConfirm?"text":"password"} value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Confirm new password" className="w-full rounded-xl border p-3 pr-12 dark:bg-tide-950" autoComplete="new-password"/><button type="button" onClick={()=>setShowConfirm(v=>!v)} className="absolute inset-y-0 right-0 grid w-12 place-items-center text-gold-500 transition hover:text-gold-300" aria-label={showConfirm?"Hide confirmed password":"Show confirmed password"} title={showConfirm?"Hide confirmed password":"Show confirmed password"}><EyeIcon slash={showConfirm}/></button></div>
    <button disabled={busy} className="btn-primary w-full">{busy?"Resetting…":"Reset password"}</button>{status&&<div className="rounded-xl bg-sand-100 p-4 text-sm dark:bg-tide-900">{status}</div>}</form>{status.includes("successfully")&&<button onClick={()=>navigate("/manager")} className="mt-4 btn-outline w-full">Return to login</button>}</div></div></main>
}
