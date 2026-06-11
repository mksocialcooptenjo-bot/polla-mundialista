import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, doc, setDoc, getDocs } from 'firebase/firestore';

// IMPORTACIÓN AUTOMÁTICA DE TU ARCHIVO COMPLETO
import datosPartidosJSON from '../data/partidos.json';

const codigosBanderas = {
  // Grupo A
  "México": "MX", 
  "Sudáfrica": "ZA", 
  "Corea del Sur": "KR", 
  "Chequia": "CZ",

  // Grupo B
  "Canadá": "CA", 
  "Bosnia-Herzegovina": "BA", 
  "Catar": "QA", 
  "Suiza": "CH",

  // Grupo C
  "Brasil": "BR", 
  "Marruecos": "MA", 
  "Haití": "HT", 
  "Escocia": "GB-SCT",

  // Grupo D
  "Estados Unidos": "US", 
  "Paraguay": "PY", 
  "Australia": "AU", 
  "Turquía": "TR",

  // Grupo E
  "Alemania": "DE", 
  "Curazao": "CW", 
  "Costa de Marfil": "CI", 
  "Ecuador": "EC",

  // Grupo F
  "Países Bajos": "NL", 
  "Japón": "JP", 
  "Suecia": "SE", 
  "Túnez": "TN",

  // Otros países comunes que podrían estar en tu partidos.json completo
  "Colombia": "CO",
  "Argentina": "AR",
  "Francia": "FR",
  "España": "ES",
  "Inglaterra": "GB-ENG",
  "Portugal": "PT",
  "Italia": "IT",
  "Uruguay": "UY",
  "Bélgica": "BE",
  "Croacia": "HR",
  "Dinamarca": "DK",
  "Chile": "CL",
  "Perú": "PE",
  "Panamá": "PA",
  "Costa Rica": "CR",
  "Cabo Verde": "CV",
  "Irán": "IR",
  "Nueva Zelanda": "NZ",
  "Senegal": "SN",
  "Irak": "IQ",
  "Noruega": "NO",
  "Argelia": "DZ",
  "Austria": "AT",
  "Jordania": "JO",
  "República Democrática del Congo": "CD",
  "Arabia Saudita": "SA",
  "Ghana": "GH",
  "Egipto": "EG",
  "Uzbekistán": "UZ",
  "Por Clasificar": "DEFAULT" // Para partidos de fases finales vacíos
};

function PartidosView() {
  const [fechasCalendario, setFechasCalendario] = useState([]);
  const [jugadoresCargados, setJugadoresCargados] = useState({});
  const [pronosticos, setPronosticos] = useState({});
  const [cargando, setCargando] = useState(true);

  const obtenerBanderaUrl = (pais) => {
    const codigo = codigosBanderas[pais];
    if (!codigo) return "https://flagsapi.com/US/flat/64.png";
    if (codigo === "GB-SCT") return "https://flagcdn.com/64x48/gb-sct.png";
    if (codigo === "GB-ENG") return "https://flagcdn.com/64x48/gb-eng.png";
    return `https://flagsapi.com/${codigo}/flat/64.png`;
  };

  const cargarPartidosDesdeFirebase = async () => {
    try {
      setCargando(true);
      const querySnapshot = await getDocs(collection(db, "partidos_config"));
      
      if (querySnapshot.empty) {
        setFechasCalendario([]);
        setCargando(false);
        return;
      }

      const datosFechas = [];
      querySnapshot.forEach((doc) => {
        if (doc.id.startsWith("fecha_")) {
          datosFechas.push({ orden: parseInt(doc.id.split("_")[1]), ...doc.data() });
        }
      });

      datosFechas.sort((a, b) => a.orden - b.orden);
      setFechasCalendario(datosFechas);
    } catch (error) {
      console.error("Error al cargar de Firebase: ", error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPartidosDesdeFirebase();
  }, []);

  // ESTA FUNCIÓN AHORA LEE TODO TU ARCHIVO PARTIDOS.JSON AUTOMÁTICAMENTE
  const sincronizarConFirebase = async () => {
    if (!datosPartidosJSON || !datosPartidosJSON.fase_grupos) {
      alert("No se pudo leer la estructura del archivo partidos.json");
      return;
    }

    try {
      setCargando(true);
      
      let contadorFecha = 0;
      for (const grupo of datosPartidosJSON.fase_grupos) {
        const docId = `fecha_${contadorFecha}`;
        
        const partidosProcesados = grupo.partidos.map((partido, index) => ({
          id: `${partido.equipo1}_vs_${partido.equipo2}_${contadorFecha}_${index}`.replace(/\s+/g, '_'),
          hora: partido.hora,
          equipo1: partido.equipo1,
          equipo2: partido.equipo2,
          grupo: partido.grupo,
          estadio: partido.estadio,
          estado: "programado"
        }));

        await setDoc(doc(db, "partidos_config", docId), {
          fecha: grupo.fecha,
          partidos: partidosProcesados
        });

        contadorFecha++;
      }

      alert(`¡Éxito! Se han importado correctamente las ${contadorFecha} fechas de tu partidos.json hacia Firebase.`);
      cargarPartidosDesdeFirebase();
    } catch (error) {
      console.error("Error al sincronizar: ", error);
      alert("Hubo un error al guardar en la base de datos.");
    } finally {
      setCargando(false);
    }
  };

  const cargarJugadoresDeSeleccion = async (pais) => {
    if (jugadoresCargados[pais]) return;
    try {
      const datosPais = await import(`../data/${pais}.json`);
      setJugadoresCargados(prev => ({
        ...prev,
        [pais]: datosPais.jugadores || datosPais.default?.jugadores || []
      }));
    } catch (e) {
      console.warn(`No se encontró archivo JSON para: ${pais}.`);
      setJugadoresCargados(prev => ({ ...prev, [pais]: [] }));
    }
  };

  const handleGolesChange = (partidoId, equipo, valor, paisLocal, paisVisitante) => {
    const numGoles = parseInt(valor) || 0;
    
    if (numGoles > 0) {
      cargarJugadoresDeSeleccion(equipo === 'equipo1' ? paisLocal : paisVisitante);
    }

    setPronosticos(prev => {
      const partidoActual = prev[partidoId] || { goles1: 0, goles2: 0, anotadores1: [], anotadores2: [] };
      let nuevosAnotadores = equipo === 'equipo1' ? [...partidoActual.anotadores1] : [...partidoActual.anotadores2];
      
      if (nuevosAnotadores.length < numGoles) {
        while (nuevosAnotadores.length < numGoles) nuevosAnotadores.push("");
      } else {
        nuevosAnotadores = nuevosAnotadores.slice(0, numGoles);
      }

      return {
        ...prev,
        [partidoId]: {
          ...partidoActual,
          [equipo === 'equipo1' ? 'goles1' : 'goles2']: numGoles,
          [equipo === 'equipo1' ? 'anotadores1' : 'anotadores2']: nuevosAnotadores
        }
      };
    });
  };

  const handleAnotadorChange = (partidoId, equipo, index, jugador) => {
    setPronosticos(prev => {
      const partidoActual = prev[partidoId];
      const nuevosAnotadores = equipo === 'equipo1' ? [...partidoActual.anotadores1] : [...partidoActual.anotadores2];
      nuevosAnotadores[index] = jugador;
      return {
        ...prev,
        [partidoId]: {
          ...partidoActual,
          [equipo === 'equipo1' ? 'anotadores1' : 'anotadores2']: nuevosAnotadores
        }
      };
    });
  };

  return (
    <div className="space-y-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Calendario y Pronósticos 2026
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Los partidos aparecen exactamente en el orden cronológico del fixture oficial.
          </p>
        </div>
        <button 
          onClick={sincronizarConFirebase}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/10 transition"
        >
          🔄 Importar Todo partidos.json
        </button>
      </div>

      {cargando ? (
        <div className="text-center py-12 text-slate-400 font-medium animate-pulse">
          ⚽ Cargando fixture en orden cronológico...
        </div>
      ) : fechasCalendario.length === 0 ? (
        <div className="bg-slate-900/50 border border-slate-800 p-8 rounded-2xl text-center text-slate-400">
          Presiona el botón de arriba para leer todo el archivo <strong>partidos.json</strong>.
        </div>
      ) : (
        fechasCalendario.map((grupoFecha, idx) => (
          <div key={idx} className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="h-px bg-slate-800 flex-1"></span>
              <h3 className="text-sm font-black uppercase tracking-widest text-emerald-400 bg-slate-900/80 px-4 py-1 rounded-full border border-slate-800">
                📅 {grupoFecha.fecha}
              </h3>
              <span className="h-px bg-slate-800 flex-1"></span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {grupoFecha.partidos.map((partido) => {
                const prono = pronosticos[partido.id] || { goles1: 0, goles2: 0, anotadores1: [], anotadores2: [] };
                const jugadoresLocal = jugadoresCargados[partido.equipo1] || [];
                const jugadoresVisitante = jugadoresCargados[partido.equipo2] || [];

                return (
                  <div key={partido.id} className="bg-slate-900 border border-slate-800/60 rounded-2xl p-6 shadow-xl hover:border-slate-700/80 transition duration-300 flex flex-col justify-between">
                    
                    <div className="flex justify-between items-center text-xs text-slate-400 mb-4 bg-slate-950/40 p-2 rounded-xl border border-slate-800/40">
                      <span className="font-bold tracking-wider text-slate-300">GRUPO {partido.grupo}</span>
                      <span>🕒 {partido.hora} | 📍 {partido.estadio}</span>
                    </div>

                    <div className="grid grid-cols-3 items-center gap-2 my-2">
                      {/* Local */}
                      <div className="flex flex-col items-center text-center space-y-3">
                        <img src={obtenerBanderaUrl(partido.equipo1)} alt={partido.equipo1} className="w-14 h-10 object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)]" />
                        <span className="font-extrabold text-sm md:text-base tracking-wide text-white">{partido.equipo1}</span>
                        <input 
                          type="number" min="0"
                          value={prono.goles1}
                          onChange={(e) => handleGolesChange(partido.id, 'equipo1', e.target.value, partido.equipo1, partido.equipo2)}
                          className="w-16 h-12 bg-slate-950 border border-slate-700 text-center font-black text-xl rounded-xl focus:border-emerald-500 focus:outline-none transition text-white"
                        />
                      </div>

                      <div className="text-center font-black text-slate-700 text-lg tracking-widest">VS</div>

                      {/* Visitante */}
                      <div className="flex flex-col items-center text-center space-y-3">
                        <img src={obtenerBanderaUrl(partido.equipo2)} alt={partido.equipo2} className="w-14 h-10 object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.4)]" />
                        <span className="font-extrabold text-sm md:text-base tracking-wide text-white">{partido.equipo2}</span>
                        <input 
                          type="number" min="0"
                          value={prono.goles2}
                          onChange={(e) => handleGolesChange(partido.id, 'equipo2', e.target.value, partido.equipo1, partido.equipo2)}
                          className="w-16 h-12 bg-slate-950 border border-slate-700 text-center font-black text-xl rounded-xl focus:border-emerald-500 focus:outline-none transition text-white"
                        />
                      </div>
                    </div>

                    {/* SELECTS GOLEADORES */}
                    {(prono.goles1 > 0 || prono.goles2 > 0) && (
                      <div className="mt-5 pt-4 border-t border-slate-800/80 bg-slate-950/60 p-3 rounded-xl space-y-3">
                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">⚽ Autores de los Goles:</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-2">
                            {prono.anotadores1.map((j, i) => (
                              <select
                                key={i} value={j}
                                onChange={(e) => handleAnotadorChange(partido.id, 'equipo1', i, e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 text-[11px] font-medium rounded-lg p-2 focus:border-emerald-500 focus:outline-none text-slate-300"
                              >
                                <option value="">Gol {i + 1} ({partido.equipo1})</option>
                                {jugadoresLocal.map((jug, k) => (
                                  <option key={k} value={jug.nombre}>{jug.nombre} ({jug.posicion})</option>
                                ))}
                              </select>
                            ))}
                          </div>
                          <div className="space-y-2">
                            {prono.anotadores2.map((j, i) => (
                              <select
                                key={i} value={j}
                                onChange={(e) => handleAnotadorChange(partido.id, 'equipo2', i, e.target.value)}
                                className="w-full bg-slate-900 border border-slate-700 text-[11px] font-medium rounded-lg p-2 focus:border-emerald-500 focus:outline-none text-slate-300"
                              >
                                <option value="">Gol {i + 1} ({partido.equipo2})</option>
                                {jugadoresVisitante.map((jug, k) => (
                                  <option key={k} value={jug.nombre}>{jug.nombre} ({jug.posicion})</option>
                                ))}
                              </select>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-4 pt-2 flex justify-end">
                      <button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black px-4 py-2 rounded-xl transition shadow-md">
                        Guardar Voto
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default PartidosView;