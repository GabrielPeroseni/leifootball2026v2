/* Se nenhuma CDN carregar, evita o erro "Peer is not defined" e deixa o resto do jogo abrir (sem online). */
if (typeof window.Peer === 'undefined') {
  window.Peer = function () {
    this.on = function (ev, cb) { if (ev === 'open') setTimeout(function () { var el = document.getElementById('host-id-display'); if (el) el.innerHTML = '<b style="color:#ef4444;">Modo online indisponível</b> (biblioteca PeerJS não carregou)'; }, 0); };
    this.connect = function () { alert('Modo online indisponível: a biblioteca PeerJS não carregou.'); return { on: function () {}, send: function () {} }; };
  };
}
