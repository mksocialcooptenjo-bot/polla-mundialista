import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

// Diccionario de códigos de país ISO para renderizar las banderas automáticamente
const codigosBanderas = {
  "México": "mx", "Sudáfrica": "za", "Corea del Sur": "kr", "Chequia": "cz",
  "Canadá": "ca", "Bosnia-Herzegovina": "ba", "Catar": "qa", "Suiza": "ch",
  "Brasil": "br", "Marruecos": "ma", "Haití": "ht", "Escocia": "gb-sct",
  "Estados Unidos": "us", "Paraguay": "py", "Australia": "au", "Turquía": "tr",
  "Alemania": "de", "Curazao": "cw", "Costa de Marfil": "ci", "Ecuador": "ec",
  "Países Bajos": "nl", "Japón": "jp", "Suecia": "se", "Túnez": "tn",
  "Argentina": "ar", "Francia": "fr", "España": "es", "Inglaterra": "gb-eng",
  "Portugal": "pt", "Italia": "it", "Colombia": "co", "Uruguay": "uy"
};

function HomeView({ usuarioLogueado, setPestañaActual }) {
  const [metricas, setMetricas] = useState({
    totalParticipantes: 0,
    liderNombre: "Calculando...",
    liderPuntos: 0,
    proximoPartido: null
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatosHome = async () => {
      try {
        setCargando(true);

        // 1. OBTENER PARTICIPANTES Y LÍDER
        const usuariosSnap = await getDocs(collection(db, "usuarios"));
        let count = 0;
        let maxPuntos = -1;
        let nombreLider = "Por ahora ninguno";

        usuariosSnap.forEach((doc) => {
          const datos = doc.data();
          if (datos.role === 'player' || datos.rol === 'player' || datos.rol === undefined) {
            count++;
            const pts = datos.puntos || 0;
            if (pts > maxPuntos) {
              maxPuntos = pts;
              nombreLider = datos.nombre || "Jugador Anónimo";
            }
          }
        });

        // 2. OBTENER PRÓXIMO PARTIDO PROGRAMADO
        const partidosSnap = await getDocs(collection(db, "partidos_config"));
        const todasLasFechas = [];
        
        partidosSnap.forEach((doc) => {
          if (doc.id.startsWith("fecha_")) {
            todasLasFechas.push({ docId: doc.id, ...doc.data() });
          }
        });

        todasLasFechas.sort((a, b) => parseInt(a.docId.split("_")[1]) - parseInt(b.docId.split("_")[1]));

        let proximo = null;
        for (const grupoFecha of todasLasFechas) {
          const partidoEncontrado = grupoFecha.partidos.find(p => p.estado === "programado" || p.estado === "en_vivo");
          if (partidoEncontrado) {
            proximo = {
              ...partidoEncontrado,
              fechaTexto: grupoFecha.fecha
            };
            break;
          }
        }

        setMetricas({
          totalParticipantes: count,
          liderNombre: nombreLider,
          liderPuntos: maxPuntos === -1 ? 0 : maxPuntos,
          proximoPartido: proximo
        });

      } catch (error) {
        console.error("Error al sincronizar el Home:", error);
      } finally {
        setCargando(false);
      }
    };

    cargarDatosHome();
  }, []);

  // Función auxiliar para traer la URL de la bandera de forma segura
  const obtenerUrlBandera = (equipo) => {
    const codigo = codigosBanderas[equipo];
    if (!codigo) return "https://flagcdn.com/256x192/un.png"; // Bandera por defecto (ONU)
    return `https://flagcdn.com/256x192/${codigo}.png`;
  };

  return (
    <div className="space-y-10 max-w-6xl mx-auto px-2">
      
      {/* ─── 1. BANNER CINEMATOGRÁFICO ULTRA LLAMATIVO ─── */}
      <div className="relative rounded-3xl p-8 md:p-14 overflow-hidden border border-emerald-500/20 bg-slate-900 shadow-2xl shadow-emerald-950/20 group">
        
        {/* Efecto de Fondo Abstracto con Luces de Estadio */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-950 to-slate-950 z-0" />
        <div className="absolute -right-10 -top-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-[100px] animate-pulse duration-[6000ms]" />
        <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-teal-500/10 rounded-full blur-[120px] animate-pulse duration-[8000ms]" />
        
        {/* Líneas Deportivas de Fondo Dinámicas */}
        <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] z-0" />

        {/* Contenido del Banner */}
        <div className="relative z-10 max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3.5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Fase de Grupos en Vivo • Mundial 2026
          </div>
          
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none">
            ¿TIENES EL INSTINTO DE UN <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 bg-clip-text text-transparent">CAMPEÓN?</span>
          </h2>
          
          <p className="text-slate-300 text-sm md:text-base font-medium leading-relaxed max-w-xl">
            No te quedes fuera de la competencia de la oficina. Pronostica marcadores exactos, adivina quién anota los goles y escala posiciones para llevarte el premio mayor.
          </p>
          
          <div className="pt-4 flex flex-wrap gap-4">
            <button 
              onClick={() => setPestañaActual('partidos')}
              className="relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs uppercase tracking-widest px-8 py-4 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl hover:shadow-emerald-500/20 active:translate-y-0"
            >
              🔥 Registrar Mis Pronósticos
            </button>
            
            <button 
              onClick={() => setPestañaActual('rankings')}
              className="bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 hover:text-white font-black text-xs uppercase tracking-widest px-6 py-4 rounded-xl transition-all"
            >
              📊 Ver Tabla de Líderes
            </button>
          </div>
        </div>

        {/* Trofeo Flotante Decorativo en 3D/Emoji */}
        <div className="absolute right-12 bottom-6 md:bottom-12 text-[100px] md:text-[180px] select-none pointer-events-none opacity-20 group-hover:opacity-30 group-hover:scale-105 transition-all duration-700 animate-bounce [animation-duration:4s]">
          🏆
        </div>
      </div>

      {cargando ? (
        <div className="text-center py-16 text-emerald-400 font-black text-xs uppercase tracking-widest animate-pulse flex items-center justify-center gap-3">
          <span className="text-2xl animate-spin">⚽</span> Sincronizando Marcadores y Estadísticas Globales...
        </div>
      ) : (
        /* ─── GRID DE VISTAS TÁCTICAS ─── */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ─── TARJETA 2: PRÓXIMO ENCUENTRO (CON BANDERAS ANIMADAS) ─── */}
          <div className="lg:col-span-2 bg-gradient-to-b from-slate-900 to-slate-900/40 border border-slate-800/80 p-6 md:p-8 rounded-3xl flex flex-col justify-between relative overflow-hidden shadow-xl group">
            
            <div>
              <div className="flex items-center justify-between border-b border-slate-800/60 pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${metricas.proximoPartido?.estado === 'en_vivo' ? 'bg-red-500 animate-ping' : 'bg-amber-500'}`} />
                  <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    {metricas.proximoPartido?.estado === 'en_vivo' ? "🚨 Partido en Curso" : "⏳ Siguiente Enfrentamiento"}
                  </span>
                </div>
                {metricas.proximoPartido && (
                  <span className="text-[10px] font-black bg-slate-950 text-slate-500 border border-slate-800 px-3 py-1 rounded-full uppercase tracking-wider">
                    Grupo {metricas.proximoPartido.grupo}
                  </span>
                )}
              </div>

              {metricas.proximoPartido ? (
                <div className="space-y-6">
                  {/* Cronología */}
                  <div className="text-center md:text-left">
                    <p className="text-xs font-black text-emerald-400 uppercase tracking-wider bg-emerald-500/5 border border-emerald-500/10 px-3 py-1.5 rounded-xl inline-block">
                      🗓️ {metricas.proximoPartido.fechaTexto} — 🕒 {metricas.proximoPartido.hora}
                    </p>
                  </div>

                  {/* Bloque Arena: Banderas Cara a Cara */}
                  <div className="grid grid-cols-3 items-center justify-items-center bg-slate-950/60 border border-slate-800/60 p-6 rounded-2xl relative shadow-inner">
                    
                    {/* Equipo 1 */}
                    <div className="text-center space-y-3 w-full">
                      <div className="relative inline-block group-hover:scale-105 transition-transform duration-500">
                        <img 
                          src={obtenerUrlBandera(metricas.proximoPartido.equipo1)} 
                          alt={metricas.proximoPartido.equipo1}
                          className="w-16 h-12 md:w-24 md:h-16 object-cover rounded-xl shadow-lg border-2 border-slate-700/60 transition-all duration-300 group-hover:border-emerald-500"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                      </div>
                      <span className="block font-black text-white text-sm md:text-base tracking-tight truncate">
                        {metricas.proximoPartido.equipo1}
                      </span>
                    </div>

                    {/* Divisor VS */}
                    <div className="text-center">
                      <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-900 rounded-full border-2 border-slate-800 flex items-center justify-center shadow-lg">
                        <span className="text-xs font-black text-slate-500 tracking-wider">VS</span>
                      </div>
                    </div>

                    {/* Equipo 2 */}
                    <div className="text-center space-y-3 w-full">
                      <div className="relative inline-block group-hover:scale-105 transition-transform duration-500">
                        <img 
                          src={obtenerUrlBandera(metricas.proximoPartido.equipo2)} 
                          alt={metricas.proximoPartido.equipo2}
                          className="w-16 h-12 md:w-24 md:h-16 object-cover rounded-xl shadow-lg border-2 border-slate-700/60 transition-all duration-300 group-hover:border-emerald-500"
                        />
                        <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                      </div>
                      <span className="block font-black text-white text-sm md:text-base tracking-tight truncate">
                        {metricas.proximoPartido.equipo2}
                      </span>
                    </div>

                  </div>

                  <p className="text-[11px] text-slate-500 font-bold text-center md:text-left tracking-wide">
                    📍 Sede del Torneo: <span className="text-slate-400 uppercase font-black">{metricas.proximoPartido.estadio}</span>
                  </p>
                </div>
              ) : (
                <div className="text-center py-10 text-slate-500 font-bold text-xs uppercase tracking-wider bg-slate-950/40 border border-slate-800/40 rounded-2xl">
                  📭 Fixture finalizado por completo. ¡Atento a los resultados definitivos!
                </div>
              )}
            </div>

            {metricas.proximoPartido && (
              <div className="mt-6 pt-4 border-t border-slate-800/40 flex justify-end">
                <button 
                  onClick={() => setPestañaActual('partidos')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-black flex items-center gap-1 transition group"
                >
                  Ir al Fixture Completo <span className="transform group-hover:translate-x-1 transition-transform">→</span>
                </button>
              </div>
            )}
          </div>

          {/* ─── COLUMNA DERECHA: SECCIÓN METRICAS LIVE ─── */}
          <div className="flex flex-col gap-4">
            
            {/* TARJETA 3: CONTADOR DE COMPETIDORES */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center gap-5 shadow-xl hover:border-blue-500/30 transition-all duration-300 hover:scale-[1.02]">
              <div className="w-14 h-14 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center text-2xl font-bold border border-blue-500/10 shadow-lg shadow-blue-950/20">
                👥
              </div>
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Rivales Registrados</span>
                <span className="text-3xl font-black text-white tracking-tight block mt-0.5">
                  {metricas.totalParticipantes}
                </span>
                <span className="text-[11px] text-blue-400 font-extrabold block mt-0.5">
                  Votando en vivo
                </span>
              </div>
            </div>

            {/* TARJETA 4: EL REY DE LA OFICINA (LÍDER) */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-3xl flex items-center gap-5 shadow-xl relative overflow-hidden hover:border-amber-500/30 transition-all duration-300 hover:scale-[1.02] group/lider">
              
              {/* Resplandor decorativo interno */}
              <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/[0.03] rounded-full blur-2xl pointer-events-none group-hover/lider:bg-amber-500/[0.08] transition-all" />
              
              <div className="w-14 h-14 bg-amber-500/10 text-amber-400 rounded-2xl flex items-center justify-center text-2xl font-bold border border-amber-500/10 shadow-lg shadow-amber-950/20">
                👑
              </div>
              
              <div className="flex-1 min-w-0">
                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">Líder Provisional</span>
                <span className="text-lg font-black text-white tracking-tight block truncate mt-0.5">
                  {metricas.liderNombre}
                </span>
                
                <div className="inline-flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-xs font-black text-emerald-400">
                    {metricas.liderPuntos} <span className="text-[10px] text-emerald-500/80 font-bold uppercase">Pts</span>
                  </span>
                </div>
              </div>

            </div>

            {/* SECCIÓN TIP DE JUEGO */}
            <div className="bg-slate-950 border border-slate-900 p-4 rounded-2xl flex items-start gap-3">
              <span className="text-base">💡</span>
              <p className="text-[11px] text-slate-500 font-medium leading-normal">
                <span className="text-slate-300 font-bold block mb-0.5">Tip Pro:</span>
                Recuerda que acertar el marcador exacto te otorga <span className="text-emerald-400 font-extrabold">3 puntos</span> completos, mientras que los goleadores individuales sumados te dan <span className="text-emerald-400 font-extrabold">1 punto</span> cada uno. ¡Configura bien tu estrategia antes del pitazo inicial!
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}

export default HomeView;