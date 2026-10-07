window.lynxAviso = {
  // Pregunta antes de irse. Lo usa el guardia de navegacion de Cotizar para
  // que salir con cambios sin guardar no los pierda en silencio.
  confirmar: function (texto) {
    try { return window.confirm(texto); } catch (e) { return true; }
  },
  // Aviso del navegador al cerrar la pestana o recargar. Solo se arma cuando
  // hay cambios pendientes; el texto lo decide el navegador, no nosotros.
  vigilarSalida: function (activo) {
    try {
      if (!window.__lynxSalida) {
        window.__lynxSalida = function (e) { e.preventDefault(); e.returnValue = ""; };
      }
      window.removeEventListener("beforeunload", window.__lynxSalida);
      if (activo) window.addEventListener("beforeunload", window.__lynxSalida);
      return true;
    } catch (e) { return false; }
  },
  // Trae el aviso a la vista. El boton de guardar esta al final de una pantalla
  // muy larga y el aviso se pinta arriba del todo, asi que sin esto el mensaje
  // ("se creo la revision tal") aparece a dos pantallas de donde se hizo clic
  // y nadie lo lee.
  mirar: function (id) {
    try {
      var el = document.getElementById(id);
      if (!el) return false;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      return true;
    } catch (e) { return false; }
  }
};

window.supaFn = {
  invoke: async function (url, apikey, bearer, bodyJson) {
    try {
      const headers = { "Content-Type": "application/json" };
      if (apikey) headers["apikey"] = apikey;
      if (bearer) headers["Authorization"] = "Bearer " + bearer;
      const resp = await fetch(url, { method: "POST", headers, body: bodyJson });
      let text = "";
      try { text = await resp.text(); } catch (e) { }
      return JSON.stringify({ ok: resp.ok, status: resp.status, body: text });
    } catch (e) {
      return JSON.stringify({ ok: false, status: 0, body: "", err: String((e && e.message) || e) });
    }
  }
};
