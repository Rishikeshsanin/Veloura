import { ArrowLeft, Cloud, KeyRound, LockKeyhole, Mail, UserRound } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'

type Mode = 'signin' | 'signup' | 'reset'

export default function AuthPage() {
  const { user, signIn, signUp, sendPasswordReset, recoveryMode, updatePassword } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [mode,setMode] = useState<Mode>('signin')
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [name,setName] = useState('')
  const [busy,setBusy] = useState(false)
  const [message,setMessage] = useState('')
  const [error,setError] = useState('')
  const recovery = recoveryMode || searchParams.get('recovery')==='1'

  if (user && !recovery) return <div className="auth-page container"><section className="auth-card auth-already"><Cloud/><span className="eyebrow">MY VELOURA</span><h1>You’re signed in.</h1><p>{user.email}</p><button className="button primary" onClick={()=>navigate('/account')}>Open My Veloura</button></section></div>

  const submit=async(event:FormEvent)=>{
    event.preventDefault()
    setBusy(true);setError('');setMessage('')
    const result = recovery
      ? await updatePassword(password)
      : mode==='signin'
        ? await signIn(email,password)
        : mode==='signup'
          ? await signUp(email,password,name)
          : await sendPasswordReset(email)
    setBusy(false)
    if(!result.ok){setError(result.message);return}
    setMessage(result.message || '')
    if(recovery&&result.ok){navigate('/account');return}
    if(mode==='signin') navigate('/account')
    if(mode==='signup' && !result.message?.toLowerCase().includes('check your email')) navigate('/account')
  }

  return <div className="auth-page container">
    <Link className="auth-back" to="/account"><ArrowLeft size={15}/> My Veloura</Link>
    <div className="auth-layout">
      <section className="auth-editorial">
        <span className="eyebrow">YOUR VELOURA, EVERYWHERE</span>
        <h1>Keep the pieces you love with you.</h1>
        <p>Sign in to sync your wishlist, bag, saved items, delivery addresses, style signals and sandbox order history across devices.</p>
        <div><span><Cloud/><b>Cross-device sync</b><small>Private account-scoped commerce data.</small></span><span><LockKeyhole/><b>RLS protected</b><small>Your account can only access its own Veloura records.</small></span></div>
      </section>

      <section className="auth-card">
        <div className="auth-tabs">
          <button className={mode==='signin'?'active':''} onClick={()=>{setMode('signin');setError('');setMessage('')}}>Sign in</button>
          <button className={mode==='signup'?'active':''} onClick={()=>{setMode('signup');setError('');setMessage('')}}>Create account</button>
        </div>

        {recovery ? <><span className="eyebrow">SET NEW PASSWORD</span><h2>Choose a new password.</h2><p>Your recovery link is verified. Set a new password for this Veloura account.</p></> : mode==='reset' ? <><span className="eyebrow">PASSWORD RESET</span><h2>Find your way back.</h2><p>Enter the email attached to your Veloura account.</p></> :
          <><span className="eyebrow">{mode==='signin'?'WELCOME BACK':'NEW TO VELOURA'}</span><h2>{mode==='signin'?'Sign in to your edit.':'Create your Veloura.'}</h2><p>{mode==='signin'?'Your cloud-saved shopping space will merge with anything already on this device.':'Your current bag and wishlist stay intact and sync after you sign in.'}</p></>}

        <form onSubmit={submit}>
          {!recovery&&mode==='signup'&&<label>Display name<div><UserRound size={16}/><input value={name} onChange={(e)=>setName(e.target.value)} required minLength={2} autoComplete="name"/></div></label>}
          {!recovery&&<label>Email<div><Mail size={16}/><input value={email} onChange={(e)=>setEmail(e.target.value)} type="email" required autoComplete="email"/></div></label>}
          {(recovery||mode!=='reset')&&<label>{recovery?'New password':'Password'}<div><KeyRound size={16}/><input value={password} onChange={(e)=>setPassword(e.target.value)} type="password" required minLength={8} autoComplete={mode==='signin'?'current-password':'new-password'}/></div></label>}
          {error&&<p className="auth-error">{error}</p>}
          {message&&<p className="auth-message">{message}</p>}
          <button className="button primary full" disabled={busy}>{busy?'Working…':recovery?'Update password':mode==='signin'?'Sign in':mode==='signup'?'Create account':'Send reset email'}</button>
        </form>

        {!recovery&&mode==='signin'&&<button className="auth-reset" onClick={()=>{setMode('reset');setError('');setMessage('')}}>Forgot password?</button>}
        {!recovery&&mode==='reset'&&<button className="auth-reset" onClick={()=>{setMode('signin');setError('');setMessage('')}}>Back to sign in</button>}
        <small className="auth-legal">Veloura uses the Project Hub authentication service. Shopping data is isolated to the Veloura schema by row-level security.</small>
      </section>
    </div>
  </div>
}
