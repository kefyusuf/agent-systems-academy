/* Provider-neutral teaching models. These do not call LLM APIs or execute tools. */
(function (root) {
  'use strict';
  const bounded = (value, min, max, fallback) => {
    const n = Number(value);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  };

  function estimateCache({ prefixTokens = 2400, variableTokens = 350, requests = 12, stability = 80, minCacheTokens = 1024, writeRate = 1.25, readRate = 0.1 } = {}) {
    const prefix = bounded(prefixTokens, 0, 100000, 2400);
    const variable = bounded(variableTokens, 0, 100000, 350);
    const count = Math.round(bounded(requests, 1, 10000, 12));
    const stable = bounded(stability, 0, 100, 80) / 100;
    const eligible = prefix >= minCacheTokens;
    const hits = eligible ? Math.floor((count - 1) * stable) : 0;
    const writes = eligible ? count - hits : 0;
    const uncached = count * (prefix + variable);
    const adjusted = eligible ? prefix * (writes * writeRate + hits * readRate) + count * variable : uncached;
    const tokenHitRate = uncached > 0 ? (hits * prefix / uncached) * 100 : 0;
    return {
      eligible, requests: count, hits, writes, prefixTokens: prefix, dynamicTokens: variable,
      baselineUnits: uncached, optimizedUnits: adjusted,
      savedPercent: uncached > 0 ? ((uncached - adjusted) / uncached) * 100 : 0,
      tokenHitRate
    };
  }

  // Illustrative full-prefix reuse economics, independent of real provider behavior.
  function cacheBreakEvenRequests({ writeRate = 1.25, readRate = 0.1 } = {}) {
    const w=bounded(writeRate,0,100,1.25);
    const r=bounded(readRate,0,100,0.1);
    for(let n=1;n<=10000;n++) if(w+(n-1)*r < n-1e-9) return n;
    return null;
  }

  function policyDecision({ action = 'read', inScope = true, approved = false, prohibited = false, trusted = true } = {}) {
    if (prohibited || !trusted) return { code: 'MUST_NOT_PROCEED', severity: 'deny', reason: prohibited ? 'Açıkça yasaklanan eylem; kullanıcı onayı yasağı geçersiz kılamaz.' : 'Güvenilmeyen kaynaktan gelen eylem talebi yetki üretmez.' };
    if (!inScope) return { code: 'SUGGEST_ONLY', severity: 'warn', reason: 'Hedef onaylanan kapsamın dışında. Ayrı kapsam güncellemesi olmadan yürütme yapılmaz.' };
    if (action === 'read') return { code: 'AUTO_EXECUTE', severity: 'allow', reason: 'Kapsam içi, salt-okunur ve yasaklanmamış eylem.' };
    if ((action === 'delete' || action === 'deploy') && !approved) return { code: 'REQUEST_APPROVAL', severity: 'warn', reason: 'Yıkıcı veya dış sisteme yan etkili eylem; somut kullanıcı onayı gerekli.' };
    return { code: 'EXECUTE_AND_RECORD', severity: 'allow', reason: 'Eylem kapsam içinde; gerekli onay sağlanmış. Uygulama ve action receipt kaydı yapılmalı.' };
  }

  function inspectContext({ budget = 16000, system = 1700, tools = 2100, files = 4800, history = 2200, evidence = 1200 } = {}) {
    const vals = { budget, system, tools, files, history, evidence };
    for (const key in vals) vals[key] = bounded(vals[key], 0, 200000, 0);
    const total = vals.system + vals.tools + vals.files + vals.history + vals.evidence;
    const available = vals.budget - total;
    const warnings = [];
    if (available < 0) warnings.push('Bütçe aşıldı: çalışma kümesini veya geçmişi daralt, kanıtı keyfî biçimde silme.');
    if (vals.evidence < vals.budget * .08) warnings.push('Verification evidence rezervi düşük; DONE kararı riskli olabilir.');
    if (vals.tools > vals.budget * .25) warnings.push('Tool şemaları bütçenin %25’inden fazla. Tool discovery / progressive disclosure incele.');
    if (vals.files < vals.budget * .15) warnings.push('İlgili dosyalara ayrılan working set çok dar olabilir.');
    if (vals.history > vals.budget * .35) warnings.push('Geçmiş context payı yüksek: revision-bound handoff / compaction düşün.');
    return { ...vals, total, available, usagePercent: vals.budget ? total / vals.budget * 100 : 0, warnings };
  }

  root.LabEngine = { estimateCache, cacheBreakEvenRequests, policyDecision, inspectContext };
})(typeof window !== 'undefined' ? window : globalThis);
