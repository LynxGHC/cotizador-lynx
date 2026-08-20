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
