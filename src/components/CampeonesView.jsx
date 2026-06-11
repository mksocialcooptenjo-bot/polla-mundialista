import React, { useState } from 'react';

// Diccionario de banderas para los países seleccionados
const codigosBanderas = {
  "México": "MX", "Sudáfrica": "ZA", "Corea del Sur": "KR", "Chequia": "CZ",
  "Canadá": "CA", "Bosnia-Herzegovina": "BA", "Catar": "QA", "Suiza": "CH",
  "Brasil": "BR", "Marruecos": "MA", "Haití": "HT", "Escocia": "GB-SCT",
  "Estados Unidos": "US", "Paraguay": "PY", "Australia": "AU", "Turquía": "TR",
  "Alemania": "DE", "Curazao": "CW", "Costa de Marfil": "CI", "Ecuador": "EC",
  "Países Bajos": "NL", "Japón": "JP", "Suecia": "SE", "Túnez": "TN",
  "Colombia": "CO", "Argentina": "AR", "Francia": "FR", "España": "ES", 
  "Inglaterra": "GB-ENG", "Portugal": "PT", "Italia": "IT", "Uruguay": "UY"
};

// Lista de países disponibles en el mundial para el select
const listaPaises = Object.keys(codigosBanderas).filter(p => p !== "Por Clasificar");

function CampeonesView() {
  const [predicciones, setPredicciones] = useState({
    goleadorPais: "", goleadorJugador: "",
    porteroPais: "", porteroJugador: "",
    campeonPais: ""
  });

  const [jugadoresGoleador, setJugadoresGoleador] = useState([]);
  const [jugadoresPortero, setJugadoresPortero] = useState([]);
  const [guardando, setGuardando] = useState(false);

  const obtenerBanderaUrl = (pais) => {
    const codigo = codigosBanderas[pais];
    if (!codigo || codigo === "DEFAULT") return null;
    if (codigo === "GB-SCT") return "https://flagcdn.com/64x48/gb-sct.png";
    if (codigo === "GB-ENG") return "https://flagcdn.com/64x48/gb-eng.png";
    return `https://flagsapi.com/${codigo}/flat/64.png`;
  };

  // Carga dinámica de jugadores al elegir un país
  const handlePaisChange = async (categoria, pais) => {
    setPredicciones(prev => ({
      ...prev,
      [categoria === 'goleador' ? 'goleadorPais' : 'porteroPais']: pais,
      [categoria === 'goleador' ? 'goleadorJugador' : 'porteroJugador']: "" // Resetear jugador
    }));

    if (!pais) {
      if (categoria === 'goleador') setJugadoresGoleador([]);
      else setJugadoresPortero([]);
      return;
    }

    try {
      // Importación dinámica del JSON de la selección elegida
      const datosPais = await import(`../data/${pais}.json`);
      const lista = datosPais.jugadores || datosPais.default?.jugadores || [];
      
      if (categoria === 'goleador') {
        setJugadoresGoleador(lista);
      } else {
        // Para el portero, podemos filtrar opcionalmente para mostrar solo los que tengan posición "Portero"
        const porteros = lista.filter(j => j.posicion === "Portero" || j.posicion === "Arquero");
        setJugadoresPortero(porteros.length > 0 ? porteros : lista); 
      }
    } catch (e) {
      console.warn(`No se encontró el archivo de jugadores para: ${pais}`);
      if (categoria === 'goleador') setJugadoresGoleador([]);
      else setJugadoresPortero([]);
    }
  };

  const guardarPrediccionesEspeciales = () => {
    setGuardando(true);
    // Aquí simulamos el guardado. Próximamente lo conectaremos a la colección 'predicciones_usuarios' en Firebase
    setTimeout(() => {
      setGuardando(false);
      alert("¡Tus predicciones de Campeones y Premios Especiales se han guardado con éxito!");
    }, 805);
  };

  return (
    <div className="space-y-10 max-w-5xl mx-auto">
      
      {/* HEADER */}
      <div className="border-b border-slate-800 pb-6">
        <h2 className="text-3xl font-black tracking-tight bg-gradient-to-r from-amber-400 via-yellow-200 to-white bg-clip-text text-transparent">
          Cuadro de Honor 2026
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Elige con sabiduría a los Reyes del Mundial. Estas predicciones suelen otorgar el doble de puntos.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* TARJETA: GOLEADOR DEL MUNDIAL */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">⚽</span>
              <h3 className="text-lg font-black tracking-wide text-white">Bota de Oro (Goleador)</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Selección Nacional</label>
                <select
                  value={predicciones.goleadorPais}
                  onChange={(e) => handlePaisChange('goleador', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-sm rounded-xl p-3 focus:border-emerald-500 focus:outline-none text-white font-medium"
                >
                  <option value="">Selecciona un país...</option>
                  {listaPaises.map((pais, idx) => <option key={idx} value={pais}>{pais}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Jugador Nominado</label>
                <select
                  disabled={!predicciones.goleadorPais}
                  value={predicciones.goleadorJugador}
                  onChange={(e) => setPredicciones(prev => ({ ...prev, goleadorJugador: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 text-sm rounded-xl p-3 focus:border-emerald-500 focus:outline-none text-white font-medium disabled:opacity-40"
                >
                  <option value="">{predicciones.goleadorPais ? "Selecciona al goleador..." : "Primero elige un país"}</option>
                  {jugadoresGoleador.map((jug, idx) => (
                    <option key={idx} value={jug.nombre}>{jug.nombre} ({jug.posicion})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Visualización de Bandera Elegida */}
          <div className="mt-6 flex justify-center items-center h-16 bg-slate-950/40 rounded-xl border border-slate-800/50">
            {predicciones.goleadorPais ? (
              <div className="flex items-center gap-3 animate-fadeIn">
                <img src={obtenerBanderaUrl(predicciones.goleadorPais)} alt="" className="w-10 h-7 object-contain drop-shadow-md" />
                <span className="text-sm font-bold text-slate-200">{predicciones.goleadorJugador || "Cualquier jugador"}</span>
              </div>
            ) : (
              <span className="text-xs text-slate-600 italic">Ningún jugador seleccionado</span>
            )}
          </div>
        </div>

        {/* TARJETA: PORTERO DEL MUNDIAL */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🧤</span>
              <h3 className="text-lg font-black tracking-wide text-white">Guante de Oro (Mejor Portero)</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Selección Nacional</label>
                <select
                  value={predicciones.porteroPais}
                  onChange={(e) => handlePaisChange('portero', e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-sm rounded-xl p-3 focus:border-teal-500 focus:outline-none text-white font-medium"
                >
                  <option value="">Selecciona un país...</option>
                  {listaPaises.map((pais, idx) => <option key={idx} value={pais}>{pais}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Portero Nominado</label>
                <select
                  disabled={!predicciones.porteroPais}
                  value={predicciones.porteroJugador}
                  onChange={(e) => setPredicciones(prev => ({ ...prev, porteroJugador: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 text-sm rounded-xl p-3 focus:border-teal-500 focus:outline-none text-white font-medium disabled:opacity-40"
                >
                  <option value="">{predicciones.porteroPais ? "Selecciona al guardameta..." : "Primero elige un país"}</option>
                  {jugadoresPortero.map((jug, idx) => (
                    <option key={idx} value={jug.nombre}>{jug.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Visualización de Bandera Elegida */}
          <div className="mt-6 flex justify-center items-center h-16 bg-slate-950/40 rounded-xl border border-slate-800/50">
            {predicciones.porteroPais ? (
              <div className="flex items-center gap-3 animate-fadeIn">
                <img src={obtenerBanderaUrl(predicciones.porteroPais)} alt="" className="w-10 h-7 object-contain drop-shadow-md" />
                <span className="text-sm font-bold text-slate-200">{predicciones.porteroJugador || "Cualquier guardameta"}</span>
              </div>
            ) : (
              <span className="text-xs text-slate-600 italic">Ningún portero seleccionado</span>
            )}
          </div>
        </div>

      </div>

      {/* SECCIÓN EXPANDIDA: CAMPEÓN DEL MUNDO 2026 */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-amber-950/20 border-2 border-amber-500/20 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 text-9xl opacity-10 pointer-events-none">🏆</div>
        
        <div className="max-w-md space-y-6">
          <div className="flex items-center gap-3">
            <span className="text-3xl">🏆</span>
            <div>
              <h3 className="text-xl font-black text-amber-400 tracking-wide">Campeón de la Copa del Mundo</h3>
              <p className="text-slate-400 text-xs">Predice qué país levantará el trofeo el 19 de julio.</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Selecciona la Selección Campeona</label>
            <select
              value={predicciones.campeonPais}
              onChange={(e) => setPredicciones(prev => ({ ...prev, campeonPais: e.target.value }))}
              className="w-full bg-slate-950 border border-slate-800 text-sm rounded-xl p-3 focus:border-amber-500 focus:outline-none text-white font-bold"
            >
              <option value="">¿Quién ganará el Mundial? ...</option>
              {listaPaises.map((pais, idx) => <option key={idx} value={pais}>{pais}</option>)}
            </select>
          </div>

          {predicciones.campeonPais && (
            <div className="flex items-center gap-4 bg-slate-950/60 p-4 rounded-xl border border-amber-500/10 animate-fadeIn">
              <img src={obtenerBanderaUrl(predicciones.campeonPais)} alt="" className="w-16 h-11 object-contain drop-shadow-lg" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">Tu Candidato Oficial</p>
                <p className="text-lg font-black text-white">{predicciones.campeonPais}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* BOTÓN DE ACCIÓN GLOBAL */}
      <div className="flex justify-end pt-4">
        <button
          onClick={guardarPrediccionesEspeciales}
          disabled={guardando}
          className="w-full md:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black px-8 py-3.5 rounded-xl text-sm uppercase tracking-wider transition shadow-xl shadow-amber-500/10"
        >
          {guardando ? "Guardando..." : "🔒 Guardar Cuadro de Honor"}
        </button>
      </div>

    </div>
  );
}

export default CampeonesView;