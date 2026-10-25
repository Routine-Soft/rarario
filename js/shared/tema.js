// Tema dos painéis: escuro (padrão do site), claro, rosa ou "seguir o sistema".
// Script normal (não módulo) carregado no <head>, para não piscar a cor errada.
(function () {
    var CHAVE = 'rarario-tema';
    var media = window.matchMedia('(prefers-color-scheme: light)');

    function lerEscolha() {
        try { return localStorage.getItem(CHAVE) || 'escuro'; } catch (e) { return 'escuro'; }
    }

    function aplicar(escolha) {
        var tema = escolha === 'sistema' ? (media.matches ? 'claro' : 'escuro') : escolha;
        document.documentElement.setAttribute('data-tema', tema);
    }

    window.temaPainel = {
        escolha: lerEscolha,
        trocar: function (escolha) {
            try { localStorage.setItem(CHAVE, escolha); } catch (e) { /* sem armazenamento */ }
            aplicar(escolha);
        },
    };

    media.addEventListener('change', function () {
        if (lerEscolha() === 'sistema') aplicar('sistema');
    });

    aplicar(lerEscolha());
})();
