import React, {useState, useEffect} from 'react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';

function App(){
  const [user, setUser] = useState(null);
  const [view, setView] = useState('login'); // login | register

  useEffect(()=> {
    fetch(API + '/api/me', { credentials: 'include' })
    .then(r=> r.json())
    .then(data => {
      if (!data.error) setUser(data.user);
    }).catch(()=>{});
  },[]);

  return (
    <div style={{padding:20}}>
      <h1>Video Editor App</h1>
      {user ? (
        <div>
          <p>Benvenuto, {user.name || user.email}</p>
          <button onClick={async ()=> {
            await fetch(API + '/api/auth/logout', { method: 'POST', credentials: 'include' });
            setUser(null);
          }}>Logout</button>
        </div>
      ) : (
        <div>
          <div style={{marginBottom:10}}>
            <button onClick={()=> window.location.href = API + '/api/auth/google'}>Login with Google</button>
          </div>
          {view === 'login' ? <LoginForm onSuccess={(u)=> setUser(u)} switchToRegister={()=> setView('register')} /> : <RegisterForm onSuccess={(u)=> setUser(u)} switchToLogin={()=> setView('login')} /> }
        </div>
      )}
    </div>
  )
}

function LoginForm({onSuccess, switchToRegister}){
  const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  async function submit(e){
    e.preventDefault();
    const res = await fetch(API + '/api/auth/login', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email, password }), credentials: 'include' });
    const data = await res.json();
    if (!data.error){
      const me = await (await fetch(API + '/api/me', { credentials: 'include' })).json();
      onSuccess(me.user);
    } else {
      alert(data.error);
    }
  }
  return (<form onSubmit={submit}>
    <h3>Login</h3>
    <input placeholder="Email" value={email} onChange={e=> setEmail(e.target.value)} /><br/>
    <input type="password" placeholder="Password" value={password} onChange={e=> setPassword(e.target.value)} /><br/>
    <button>Login</button>
    <p>Non hai un account? <a href="#" onClick={(e)=>{e.preventDefault(); switchToRegister()}}>Registrati</a></p>
  </form>);
}

function RegisterForm({onSuccess, switchToLogin}){
  const API = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  async function submit(e){
    e.preventDefault();
    const res = await fetch(API + '/api/auth/register', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email, password, name }), credentials: 'include' });
    const data = await res.json();
    if (!data.error){
      const me = await (await fetch(API + '/api/me', { credentials: 'include' })).json();
      onSuccess(me.user);
    } else {
      alert(data.error);
    }
  }
  return (<form onSubmit={submit}>
    <h3>Register</h3>
    <input placeholder="Name" value={name} onChange={e=> setName(e.target.value)} /><br/>
    <input placeholder="Email" value={email} onChange={e=> setEmail(e.target.value)} /><br/>
    <input type="password" placeholder="Password" value={password} onChange={e=> setPassword(e.target.value)} /><br/>
    <button>Register</button>
    <p>Hai già un account? <a href="#" onClick={(e)=>{e.preventDefault(); switchToLogin()}}>Login</a></p>
  </form>);
}

export default App;
