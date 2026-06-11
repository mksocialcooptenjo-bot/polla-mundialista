import React, { useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';

function LoginView({ onLoginExitoso }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setCargando(true);
      setError('');
      const emailNormalizado = email.toLowerCase().trim();
      
      const userDoc = await getDoc(doc(db, "usuarios", emailNormalizado));

      if (userDoc.exists()) {
        const datosUsuario = userDoc.data();
        onLoginExitoso(datosUsuario);
      } else {
        setError('El correo ingresado no está registrado en la polla. Solicita acceso al administrador.');
      }
    } catch (e) {
      console.error(e);
      setError('Hubo un error al intentar conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl w-full max-w-md shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="text-center space-y-2">
          <span className="text-4xl">⚽</span>
          <h2 className="text-2xl font-black text-white tracking-tight">Polla Mundialista 2026</h2>
          <p className="text-slate-400 text-xs">Acceso directo sin contraseña. Digita tu correo registrado.</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold p-3.5 rounded-xl text-center">
            ⚠️ {error}
          </div>
        )}

        {/* CLAVE: Uso de autoComplete="off" para evitar que el navegador exija llaves guardadas */}
        <form onSubmit={handleLogin} className="space-y-4" autoComplete="off">
          <div>
            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2">Correo Electrónico Autorizado</label>
            <input
              type="email" 
              required 
              name="email_polla_access"
              autoComplete="email-new-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-white focus:border-emerald-500 focus:outline-none transition font-medium"
              placeholder="tu-correo@correo.com"
            />
          </div>

          <button
            type="submit" 
            disabled={cargando}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black py-3.5 rounded-xl text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/10"
          >
            {cargando ? "Validando Cuenta..." : "Ingresar a la Plataforma"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginView;