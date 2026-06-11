import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, getDocs, updateDoc } from 'firebase/firestore';

function AdminPanel() {
  const [subPestaña, setSubPestaña] = useState('usuarios'); // 'usuarios' o 'partidos'
  const [cargando, setCargando] = useState(false);

  // --- ESTADOS DE USUARIOS ---
  const [usuarios, setUsuarios] = useState([]);
  const [nuevoUsuario, setNuevoUsuario] = useState({ email: "", nombre: "", rol: "player" });

  // --- ESTADOS DE PARTIDOS ---
  const [fechasCalendario, setFechasCalendario] = useState([]);
  const [partidoEditando, setPartidoEditando] = useState(null);
  const [golesEdit, setGolesEdit] = useState({ goles1: 0, goles2: 0, estado: "programado" });

  useEffect(() => {
    if (subPestaña === 'usuarios') cargarUsuarios();
    if (subPestaña === 'partidos') cargarPartidos();
  }, [subPestaña]);

  // ==========================================
  // LÓGICA: GESTIÓN DE USUARIOS
  // ==========================================
  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      const snap = await getDocs(collection(db, "usuarios"));
      const lista = [];
      snap.forEach(doc => lista.push({ id: doc.id, ...doc.data() }));
      setUsuarios(lista);
    } catch (e) {
      console.error(e);
    } finally { setCargando(false); }
  };

  const handleCrearUsuario = async (e) => {
    e.preventDefault();
    if (!nuevoUsuario.email || !nuevoUsuario.nombre) return;
    try {
      setCargando(true);
      const uid = nuevoUsuario.email.toLowerCase().trim();
      await setDoc(doc(db, "usuarios", uid), {
        nombre: nuevoUsuario.nombre,
        email: uid,
        rol: nuevoUsuario.rol,
        puntos: 0,
        fechaCreacion: new Date().toISOString()
      });
      setNuevoUsuario({ email: "", nombre: "", rol: "player" });
      alert("Usuario registrado correctamente en el sistema.");
      cargarUsuarios();
    } catch (e) {
      console.error(e);
    } finally { setCargando(false); }
  };

  const handleCambiarRol = async (id, nuevoRol) => {
    try {
      await updateDoc(doc(db, "usuarios", id), { rol: nuevoRol });
      alert("Permisos updated.");
      cargarUsuarios();
    } catch (e) {
      console.error(e);
    }
  };

  // ==========================================
  // LÓGICA: GESTIÓN DE PARTIDOS (MANUAL)
  // ==========================================
  const cargarPartidos = async () => {
    try {
      setCargando(true);
      const querySnapshot = await getDocs(collection(db, "partidos_config"));
      const datosFechas = [];
      querySnapshot.forEach((doc) => {
        if (doc.id.startsWith("fecha_")) {
          datosFechas.push({ docId: doc.id, orden: parseInt(doc.id.split("_")[1]), ...doc.data() });
        }
      });
      datosFechas.sort((a, b) => a.orden - b.orden);
      setFechasCalendario(datosFechas);
    } catch (e) {
      console.error(e);
    } finally { setCargando(false); }
  };

  const iniciarEdicionPartido = (partido, docId, fechaTexto) => {
    setPartidoEditando({ ...partido, docId, fechaTexto });
    setGolesEdit({
      goles1: partido.goles1 || 0,
      goles2: partido.goles2 || 0,
      estado: partido.estado || "programado"
    });
  };

  const guardarCambiosPartido = async () => {
    if (!partidoEditando) return;
    try {
      setCargando(true);
      const docFechaActual = fechasCalendario.find(f => f.docId === partidoEditando.docId);
      if (!docFechaActual) return;

      const partidosActualizados = docFechaActual.partidos.map(p => {
        if (p.id === partidoEditando.id) {
          return {
            ...p,
            goles1: parseInt(golesEdit.goles1, 10) || 0,
            goles2: parseInt(golesEdit.goles2, 10) || 0,
            estado: golesEdit.estado
          };
        }
        return p;
      });

      await setDoc(doc(db, "partidos_config", partidoEditando.docId), {
        fecha: partidoEditando.fechaTexto,
        partidos: partidosActualizados
      });

      alert("Partido y marcador oficial actualizados correctamente.");
      setPartidoEditando(null);
      cargarPartidos();
    } catch (e) {
      console.error(e);
      alert("Error al actualizar el partido.");
    } finally { setCargando(false); }
  };

  // =======================================================
  // LÓGICA: SINCRONIZACIÓN AUTOMÁTICA CON NETLIFY PROXY
  // =======================================================
  const actualizarResultadosConAPI = async () => {
    try {
      setCargando(true);

      // 1. Obtener la fecha de hoy en formato YYYY-MM-DD
      const hoyISO = new Date().toISOString().split('T')[0];
      
      // 2. Apuntar a la Serverless Function local o de producción en Netlify
      const urlEndpoint = `/.netlify/functions/obtener-partidos?date=${hoyISO}`;
      
      const apiRespuesta = await fetch(urlEndpoint);

      if (!apiRespuesta.ok) {
        throw new Error(`Error en el servidor proxy: ${apiRespuesta.status}`);
      }

      const datosAPI = await apiRespuesta.json();
      const partidosDelDiaAPI = datosAPI.matches || [];

      if (partidosDelDiaAPI.length === 0) {
        alert("La API no reporta partidos programados para la fecha de hoy.");
        setCargando(false);
        return;
      }

      // 3. Obtener el documento correspondiente a la fecha de hoy en Firestore
      const opcionesFecha = { weekday: 'long', day: 'numeric', month: 'long' };
      const hoyTexto = new Date().toLocaleDateString('es-ES', opcionesFecha);

      const querySnapshot = await getDocs(collection(db, "partidos_config"));
      let documentoFechaHoy = null;

      querySnapshot.forEach((doc) => {
        const datos = doc.data();
        if (datos.fecha && datos.fecha.toLowerCase().includes(hoyTexto.split(" ")[1])) {
          documentoFechaHoy = { docId: doc.id, ...datos };
        }
      });

      if (!documentoFechaHoy || !documentoFechaHoy.partidos) {
        alert(`No se encontraron partidos configurados en Firebase para hoy (${hoyTexto}).`);
        setCargando(false);
        return;
      }

      // 4. Mapear resultados reales de Football-Data sobre nuestra estructura de Firebase
      const partidosActualizados = documentoFechaHoy.partidos.map(partidoInterno => {
        // Si el admin ya cerró el partido manualmente como finalizado, respetamos sus datos
        if (partidoInterno.estado === "finalizado") return partidoInterno;

        // Buscar coincidencia en la API por el nombre de los equipos (comparación flexible)
        const partidoEncontrado = partidosDelDiaAPI.find(m => 
          m.homeTeam.name.toLowerCase().includes(partidoInterno.equipo1.toLowerCase().substring(0, 4)) || 
          partidoInterno.equipo1.toLowerCase().includes(m.homeTeam.name.toLowerCase().substring(0, 4))
        );

        if (partidoEncontrado) {
          let nuevoEstado = "programado";
          if (partidoEncontrado.status === "IN_PLAY" || partidoEncontrado.status === "PAUSED") {
            nuevoEstado = "en_vivo";
          } else if (partidoEncontrado.status === "FINISHED") {
            nuevoEstado = "finalizado";
          }

          return {
            ...partidoInterno,
            goles1: partidoEncontrado.score.fullTime.home ?? partidoInterno.goles1,
            goles2: partidoEncontrado.score.fullTime.away ?? partidoInterno.goles2,
            estado: nuevoEstado
          };
        }

        return partidoInterno;
      });

      // 5. Guardar los datos procesados en la base de datos
      await setDoc(doc(db, "partidos_config", documentoFechaHoy.docId), {
        fecha: documentoFechaHoy.fecha,
        partidos: partidosActualizados
      });

      alert("¡Marcadores actualizados e integrados con éxito vía Netlify Serverless!");
      cargarPartidos();

    } catch (e) {
      console.error("Error en la sincronización:", e);
      alert(`No se pudo completar la sincronización: ${e.message}`);
    } finally {
      setCargando(false);
    }
  };

  // ==========================================
  // LÓGICA: MOTOR DE CÁLCULO DE REGLAS DE PUNTOS
  // ==========================================
  const procesarYCalcularPuntajesGlobales = async () => {
    try {
      setCargando(true);
      const partidosConfigSnap = await getDocs(collection(db, "partidos_config"));
      const marcadoresOficiales = {};
      let campeonOficial = "";
      let goleadorOficial = "";
      let porteroOficial = "";

      partidosConfigSnap.forEach(doc => {
        if (doc.id.startsWith("fecha_")) {
          doc.data().partidos?.forEach(p => {
            marcadoresOficiales[p.id] = {
              goles1: p.goles1, goles2: p.goles2, estado: p.estado,
              anotadores1: p.anotadores1 || [], anotadores2: p.anotadores2 || []
            };
          });
        }
        if (doc.id === "cuadro_honor_oficial") {
          const datos = doc.data();
          campeonOficial = datos.campeonPais || "";
          goleadorOficial = datos.goleadorJugador || "";
          porteroOficial = datos.porteroJugador || "";
        }
      });

      const usuariosSnap = await getDocs(collection(db, "usuarios"));
      
      for (const usuarioDoc of usuariosSnap.docs) {
        const usuarioData = usuarioDoc.data();
        if (usuarioData.rol === 'admin') continue;

        let puntosDelUsuario = 0;
        const userId = usuarioDoc.id;

        // Puntos por Partidos y anotadores individuales
        const pronosticosSnap = await getDocs(collection(db, `usuarios/${userId}/pronosticos`));
        pronosticosSnap.forEach(pronoDoc => {
          const partidoId = pronoDoc.id;
          const prediccion = pronoDoc.data();
          const oficial = marcadoresOficiales[partidoId];

          if (oficial && oficial.estado === "finalizado") {
            if (parseInt(prediccion.goles1, 10) === oficial.goles1 && parseInt(prediccion.goles2, 10) === oficial.goles2) {
              puntosDelUsuario += 3;
            }
            if (prediccion.anotadores1 && oficial.anotadores1) {
              prediccion.anotadores1.forEach(j => { if (j && oficial.anotadores1.includes(j)) puntosDelUsuario += 1; });
            }
            if (prediccion.anotadores2 && oficial.anotadores2) {
              prediccion.anotadores2.forEach(j => { if (j && oficial.anotadores2.includes(j)) puntosDelUsuario += 1; });
            }
          }
        });

        // Puntos Especiales de Cuadro de Honor
        const especialesDoc = await getDocs(collection(db, `usuarios/${userId}/especiales`));
        especialesDoc.forEach(espDoc => {
          const pre = espDoc.data();
          if (campeonOficial && pre.campeonPais === campeonOficial) puntosDelUsuario += 10;
          if (goleadorOficial && pre.goleadorJugador === goleadorOficial) puntosDelUsuario += 5;
          if (porteroOficial && pre.porteroJugador === porteroOficial) puntosDelUsuario += 5;
        });

        await updateDoc(doc(db, "usuarios", userId), { puntos: puntosDelUsuario });
      }

      alert("¡Éxito! Todos los puntajes e incrementos del ranking han sido calculados.");
      cargarPartidos();
    } catch (e) {
      console.error(e);
      alert("Error en el cómputo masivo.");
    } finally { setCargando(false); }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* HEADER PANEL */}
      <div className="border-b border-slate-800 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            ⚙️ Panel de Control Administrador
          </h2>
          <p className="text-slate-400 text-sm mt-1">Alta de usuarios, automatización de marcadores vía API y cálculo de puntos por jornada.</p>
        </div>

        {/* SUBNAV DE OPERACIONES */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setSubPestaña('usuarios')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition ${subPestaña === 'usuarios' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            👥 Usuarios y Roles
          </button>
          <button
            onClick={() => setSubPestaña('partidos')}
            className={`px-4 py-2 text-xs font-black uppercase tracking-wider rounded-lg transition ${subPestaña === 'partidos' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            ⚽ Gestionar Partidos
          </button>
        </div>
      </div>

      {cargando && <div className="text-center py-2 text-indigo-400 animate-pulse font-bold text-xs uppercase tracking-widest">⚠️ Sincronizando datos con los servidores...</div>}

      {/* VISTA 1: CONTROL DE USUARIOS */}
      {subPestaña === 'usuarios' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl h-fit">
            <h3 className="text-base font-black text-white mb-4 uppercase tracking-wider text-indigo-400">Crear Nuevo Usuario</h3>
            <form onSubmit={handleCrearUsuario} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2">Nombre Completo</label>
                <input
                  type="text" name="block_name" autoComplete="new-field" required value={nuevoUsuario.nombre}
                  onChange={e => setNuevoUsuario(p => ({ ...p, nombre: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="Ej. Juan Pérez"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2">Correo Electrónico</label>
                <input
                  type="email" name="block_email" autoComplete="new-field" required value={nuevoUsuario.email}
                  onChange={e => setNuevoUsuario(p => ({ ...p, email: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                  placeholder="juan@correo.com"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2">Rol Asignado</label>
                <select
                  value={nuevoUsuario.rol}
                  onChange={e => setNuevoUsuario(p => ({ ...p, rol: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="player">Jugador (Acceso Estándar)</option>
                  <option value="admin">Administrador (Acceso Total)</option>
                </select>
              </div>
              <button type="submit" className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-black py-3 rounded-xl text-xs uppercase tracking-wider transition">
                + Dar de Alta
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 bg-slate-950 border-b border-slate-800">
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Lista de Miembros Registrados</h3>
            </div>
            <div className="divide-y divide-slate-800/60 max-h-[500px] overflow-y-auto">
              {usuarios.map(u => (
                <div key={u.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-950/40 transition">
                  <div>
                    <p className="font-extrabold text-slate-200 text-sm">{u.nombre}</p>
                    <p className="text-xs text-slate-500">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${u.rol === 'admin' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                      {u.rol}
                    </span>
                    <select
                      value={u.rol}
                      onChange={e => handleCambiarRol(u.id, e.target.value)}
                      className="bg-slate-950 border border-slate-800 text-xs rounded-lg p-1.5 focus:outline-none text-slate-400"
                    >
                      <option value="player">Hacer Jugador</option>
                      <option value="admin">Hacer Admin</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VISTA 2: EDICIÓN DE PARTIDOS / AUTOMATIZACIONES */}
      {subPestaña === 'partidos' && (
        <div className="space-y-6">
          
          {/* BANNER DE AUTOMATIZACIÓN (NETLIFY PROXY FUNCTION + PUNTOS) */}
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 shadow-xl">
            <div>
              <h4 className="text-sm font-black text-indigo-400 uppercase tracking-wider">⚡ Sincronización Oficial vía Netlify Proxy</h4>
              <p className="text-xs text-slate-400 mt-1">Trae los marcadores actualizados en vivo usando funciones Serverless para esquivar errores de CORS.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
              <button
                onClick={actualizarResultadosConAPI}
                className="flex-1 sm:flex-none bg-slate-950 border border-slate-800 hover:border-indigo-500/40 text-white font-black text-xs uppercase tracking-widest px-5 py-3.5 rounded-xl transition flex items-center justify-center gap-2"
              >
                ⚽ Sincronizar Hoy desde API
              </button>
              <button
                onClick={procesarYCalcularPuntajesGlobales}
                className="flex-1 sm:flex-none bg-indigo-500 hover:bg-indigo-600 text-white font-black text-xs uppercase tracking-widest px-5 py-3.5 rounded-xl transition shadow-lg"
              >
                🔄 Recalcular Puntos de Usuarios
              </button>
            </div>
          </div>

          {/* CUADRO INTERACTIVO DE EDICIÓN MANUAL */}
          {partidoEditando && (
            <div className="bg-slate-950 border-2 border-indigo-500/40 p-6 rounded-2xl space-y-4 animate-fadeIn">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h4 className="text-sm font-black uppercase text-indigo-400 tracking-wider">Modificar Marcador Oficial</h4>
                <button onClick={() => setPartidoEditando(null)} className="text-slate-500 hover:text-white text-xs">❌ Cancelar</button>
              </div>
              <div className="flex flex-col md:flex-row justify-around items-center gap-4 py-2">
                <span className="font-black text-white text-sm">{partidoEditando.equipo1}</span>
                <input
                  type="number" min="0" value={golesEdit.goles1}
                  onChange={e => setGolesEdit(p => ({ ...p, goles1: e.target.value }))}
                  className="w-16 h-12 bg-slate-900 border border-slate-700 text-center text-xl font-black text-white rounded-xl"
                />
                <span className="text-xs font-bold text-slate-600 uppercase">VS</span>
                <input
                  type="number" min="0" value={golesEdit.goles2}
                  onChange={e => setGolesEdit(p => ({ ...p, goles2: e.target.value }))}
                  className="w-16 h-12 bg-slate-900 border border-slate-700 text-center text-xl font-black text-white rounded-xl"
                />
                <span className="font-black text-white text-sm">{partidoEditando.equipo2}</span>

                <select
                  value={golesEdit.estado}
                  onChange={e => setGolesEdit(p => ({ ...p, estado: e.target.value }))}
                  className="bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-300 focus:outline-none"
                >
                  <option value="programado">📅 Programado</option>
                  <option value="en_vivo">🔴 En Vivo</option>
                  <option value="finalizado">🏁 Finalizado</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={guardarCambiosPartido} className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-5 py-2.5 rounded-xl transition">
                  💾 Guardar Resultado Oficial
                </button>
              </div>
            </div>
          )}

          {/* LISTA DE PARTIDOS POR FECHA */}
          <div className="space-y-6">
            {fechasCalendario.map((gFecha, idx) => (
              <div key={idx} className="space-y-3">
                <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">📅 {gFecha.fecha}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gFecha.partidos.map((p) => (
                    <div key={p.id} className="bg-slate-900 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                          <span>GRUPO {p.grupo}</span>
                          <span>•</span>
                          <span className={`uppercase font-black ${p.estado === 'en_vivo' ? 'text-red-400' : p.estado === 'finalizado' ? 'text-slate-400' : 'text-indigo-400'}`}>
                            {p.estado === 'en_vivo' ? '• En Vivo' : p.estado === 'finalizado' ? 'Finalizado' : 'Programado'}
                          </span>
                        </div>
                        <div className="text-sm font-extrabold text-slate-200 flex items-center gap-4">
                          <span>{p.equipo1} <span className="text-indigo-400">{p.estado !== 'programado' ? p.goles1 : ''}</span></span>
                          <span className="text-slate-600 text-xs">vs</span>
                          <span><span className="text-indigo-400">{p.estado !== 'programado' ? p.goles2 : ''}</span> {p.equipo2}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => iniciarEdicionPartido(p, gFecha.docId, gFecha.fecha)}
                        className="bg-slate-950 border border-slate-800 hover:border-slate-700 text-[11px] font-black text-slate-300 px-3 py-2 rounded-lg transition"
                      >
                        ✏️ Editar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPanel;