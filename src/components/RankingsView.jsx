import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

function RankingsView() {
  const [tablaPosiciones, setTablaPosiciones] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const obtenerRanking = async () => {
      try {
        setCargando(true);
        const querySnapshot = await getDocs(collection(db, "usuarios"));
        const listaUsuarios = [];

        querySnapshot.forEach((doc) => {
          const datos = doc.data();
          // Filtramos para mostrar solo los jugadores en el ranking
          if (datos.rol === 'player' || datos.rol === undefined) {
            listaUsuarios.push({
              id: doc.id,
              nombre: datos.nombre || "Jugador Anónimo",
              // Si el usuario no tiene puntos aún, por defecto lo seteamos en 0
              puntos: datos.puntos || 0,
              email: datos.email
            });
          }
        });

        // REGLA DE ORO: Ordenar de mayor a menor cantidad de puntos
        listaUsuarios.sort((a, b) => b.puntos - a.puntos);

        setTablaPosiciones(listaUsuarios);
      } catch (error) {
        console.error("Error al cargar el ranking: ", error);
      } finally {
        setCargando(false);
      }
    };

    obtenerRanking();
  }, []);

  // Función auxiliar para pintar las insignias de los tres primeros lugares
  const renderMedalla = (posicion) => {
    if (posicion === 1) return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full text-xs font-black animate-bounce">🥇 1er</span>;
    if (posicion === 2) return <span className="bg-slate-300/20 text-slate-300 border border-slate-300/30 px-2.5 py-1 rounded-full text-xs font-black">🥈 2do </span>;
    if (posicion === 3) return <span className="bg-amber-700/20 text-amber-600 border border-amber-700/30 px-2.5 py-1 rounded-full text-xs font-black">🥉 3er</span>;
    return <span className="text-slate-500 font-bold text-xs">#{posicion}</span>;
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      
      {/* HEADER */}
      <div className="border-b border-slate-800 pb-6 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-emerald-400 to-teal-500 bg-clip-text text-transparent">
            Tabla de Posiciones General
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Revisa quién va liderando la polla mundialista en tiempo real.
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-center">
          <span className="text-[10px] font-black text-slate-500 uppercase block tracking-wider">Total Participantes</span>
          <span className="text-xl font-black text-white">{tablaPosiciones.length}</span>
        </div>
      </div>

      {cargando ? (
        <div className="text-center py-12 text-emerald-500 font-medium animate-pulse">
          ⚽ Calculando puntajes y ordenando la tabla...
        </div>
      ) : tablaPosiciones.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl text-center text-slate-400">
          Aún no hay jugadores registrados con puntos en la plataforma.
        </div>
      ) : (
        
        /* TABLA CONTENEDORA */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
          
          {/* ENCABEZADOS DE LA TABLA */}
          <div className="grid grid-cols-12 bg-slate-950 px-6 py-4 border-b border-slate-800 text-[11px] font-black uppercase tracking-widest text-slate-400">
            <div className="col-span-2 md:col-span-1 text-center">Pos</div>
            <div className="col-span-7 md:col-span-8">Nombre del Participante</div>
            <div className="col-span-3 text-right pr-4">Puntos Totales</div>
          </div>

          {/* LISTA DE USUARIOS ORDENADA */}
          <div className="divide-y divide-slate-800/60">
            {tablaPosiciones.map((usuario, indice) => {
              const posicion = indice + 1;
              const esTop3 = posicion <= 3;

              return (
                <div 
                  key={usuario.id} 
                  className={`grid grid-cols-12 px-6 py-4 items-center transition ${
                    posicion === 1 ? 'bg-amber-500/[0.02] hover:bg-amber-500/[0.04]' : 'hover:bg-slate-950/40'
                  }`}
                >
                  {/* Posición / Medalla */}
                  <div className="col-span-2 md:col-span-1 flex justify-center">
                    {renderMedalla(posicion)}
                  </div>

                  {/* Nombre y Email */}
                  <div className="col-span-7 md:col-span-8 flex flex-col justify-center">
                    <span className={`font-extrabold text-sm ${esTop3 ? 'text-white' : 'text-slate-300'}`}>
                      {usuario.nombre}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium tracking-wide">
                      {usuario.email}
                    </span>
                  </div>

                  {/* Puntaje Destacado */}
                  <div className="col-span-3 text-right pr-4">
                    <span className={`text-lg font-black tracking-tight ${
                      posicion === 1 ? 'text-amber-400' : posicion === 2 ? 'text-slate-300' : posicion === 3 ? 'text-amber-600' : 'text-emerald-400'
                    }`}>
                      {usuario.puntos} <span className="text-[10px] text-slate-500 font-bold uppercase tracking-normal">Pts</span>
                    </span>
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

    </div>
  );
}

export default RankingsView;