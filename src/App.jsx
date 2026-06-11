import React, { useState, useEffect } from 'react';
import PartidosView from './components/PartidosView';
import CampeonesView from './components/CampeonesView';
import AdminPanel from './components/AdminPanel';
import RankingsView from './components/RankingsView';
import LoginView from './components/LoginView'; 
import HomeView from './components/HomeView';

function App() {
  const [pestañaActual, setPestañaActual] = useState('home');
  
  // ESTADO CRÍTICO: Controla el usuario logueado en la sesión
  const [usuarioLogueado, setUsuarioLogueado] = useState(null);

  // Cargar sesión del almacenamiento local para no perder el login al refrescar la página
  useEffect(() => {
    const sesionGuardada = localStorage.getItem('usuario_polla');
    if (sesionGuardada) {
      setUsuarioLogueado(JSON.parse(sesionGuardada));
    }
  }, []);

  const handleLoginExitoso = (datosUsuario) => {
    setUsuarioLogueado(datosUsuario);
    localStorage.setItem('usuario_polla', JSON.stringify(datosUsuario));
    // Por seguridad, si entra un jugador estándar, lo mandamos directo a home
    setPestañaActual('home');
  };

  const handleCerrarSesion = () => {
    setUsuarioLogueado(null);
    localStorage.removeItem('usuario_polla');
    setPestañaActual('partidos');
  };

  // CASO 1: Si no hay un usuario logueado en el sistema, mostramos la pantalla de login de forma exclusiva
  if (!usuarioLogueado) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex items-center justify-center">
        <LoginView onLoginExitoso={handleLoginExitoso} />
      </div>
    );
  }

  // CASO 2: Usuario autenticado correctamente. Se renderiza toda la estructura de la aplicación
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col">
      
      {/* NAVBAR GLOBAL DE LA PLATAFORMA */}
      <header className="bg-slate-900/60 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 px-4 md:px-8 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
        
        {/* LOGO E IDENTIFICACIÓN DEL USUARIO */}
        <div className="flex items-center gap-3">
          <span className="text-xl">🏆</span>
          <div>
            <h1 className="text-base font-black tracking-tight text-white">Polla Pro 2026</h1>
            <p className="text-[10px] font-bold text-slate-400">
              Hola, <span className="text-emerald-400">{usuarioLogueado.nombre}</span> ({usuarioLogueado.rol})
            </p>
          </div>
        </div>

        {/* MENÚ DE PESTAÑAS DINÁMICO */}
        <nav className="flex items-center gap-5 text-xs font-black uppercase tracking-wider text-slate-400">

          <span 
            onClick={() => setPestañaActual('home')}
            className={`cursor-pointer pb-1 transition ${pestañaActual === 'home' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'hover:text-slate-200'}`}
          >
            Inicio
          </span>

          <span 
            onClick={() => setPestañaActual('partidos')}
            className={`cursor-pointer pb-1 transition ${pestañaActual === 'partidos' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'hover:text-slate-200'}`}
          >
            Partidos
          </span>
          <span 
            onClick={() => setPestañaActual('campeones')}
            className={`cursor-pointer pb-1 transition ${pestañaActual === 'campeones' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'hover:text-slate-200'}`}
          >
            Campeones
          </span>
          <span 
            onClick={() => setPestañaActual('rankings')}
            className={`cursor-pointer pb-1 transition ${pestañaActual === 'rankings' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'hover:text-slate-200'}`}
          >
            Rankings
          </span>

          {/* 🔐 FILTRO ADMIN: Solo se dibuja el botón si el rol del usuario es exactamente 'admin' */}
          {usuarioLogueado.rol === 'admin' && (
            <span 
              onClick={() => setPestañaActual('admin')}
              className={`cursor-pointer pb-1 transition ${pestañaActual === 'admin' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-amber-500 hover:text-amber-300'}`}
            >
              ⚙️ Admin
            </span>
          )}

          {/* SALIR */}
          <button 
            onClick={handleCerrarSesion}
            className="text-[10px] bg-slate-950 border border-slate-800 hover:bg-red-950/20 hover:text-red-400 px-3 py-1.5 rounded-lg transition font-bold"
          >
            Salir
          </button>
        </nav>

      </header>

      {/* CONTENEDOR CENTRAL CON RENDERIZADO CONDICIONAL DE VISTAS */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
        
        {/* CORRECCIÓN: Inyectamos el usuario autenticado a la vista de partidos */}
        {pestañaActual === 'partidos' && <PartidosView usuarioGlobal={usuarioLogueado} />}
        
        {pestañaActual === 'campeones' && <CampeonesView usuarioGlobal={usuarioLogueado} />}
        
        {pestañaActual === 'rankings' && <RankingsView />}

        {/* DOBLE CANDADO DE SEGURIDAD PARA LA VISTA DE ADMINISTRACIÓN */}
        {pestañaActual === 'admin' && usuarioLogueado.rol === 'admin' && <AdminPanel />}

        {pestañaActual === 'home' && <HomeView usuarioLogueado={usuarioLogueado} setPestañaActual={setPestañaActual} />}

      </main>

    </div>
  );
}

export default App;