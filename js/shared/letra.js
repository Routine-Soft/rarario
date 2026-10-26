// Tamanho da letra (acessibilidade), igual ao do raraapp: aumentar, diminuir
// e tocar no "%" para voltar ao normal. Vale para o site todo e fica guardado
// no aparelho. Script normal (não módulo) no <head>, para não piscar o tamanho.
(function () {
    var CHAVE = 'rarario-letra';
    var ESCALAS = [0.85, 1, 1.15, 1.3, 1.5, 1.75];

    function lerEscala() {
        var salva;
        try { salva = parseFloat(localStorage.getItem(CHAVE)); } catch (e) { salva = NaN; }
        return ESCALAS.indexOf(salva) >= 0 ? salva : 1;
    }

    var escala = lerEscala();

    function aplicar() {
        // Os textos do site usam rem, então mudar a letra da raiz muda todos.
        document.documentElement.style.fontSize = escala === 1 ? '' : escala * 100 + '%';
    }

    function trocar(nova) {
        escala = nova;
        try { localStorage.setItem(CHAVE, String(nova)); } catch (e) { /* sem armazenamento */ }
        aplicar();
        atualizarBotoes();
    }

    var painel, menos, mais, porcento;

    function atualizarBotoes() {
        if (!painel) return;
        var i = ESCALAS.indexOf(escala);
        var pct = Math.round(escala * 100);
        menos.disabled = i <= 0;
        mais.disabled = i >= ESCALAS.length - 1;
        porcento.textContent = pct + '%';
        porcento.setAttribute('aria-label', 'Letra em ' + pct + ' por cento. Toque para voltar ao normal');
    }

    function passo(direcao) {
        var i = ESCALAS.indexOf(escala) + direcao;
        if (i >= 0 && i < ESCALAS.length) trocar(ESCALAS[i]);
    }

    function montar() {
        var caixa = document.createElement('div');
        caixa.className = 'letra';
        caixa.innerHTML =
            '<div class="letra-painel" id="letra-painel" role="group" aria-label="Tamanho da letra" hidden>' +
                '<button type="button" class="letra-btn" data-acao="menos" aria-label="Diminuir letra">A<small>−</small></button>' +
                '<button type="button" class="letra-pct" data-acao="normal"></button>' +
                '<button type="button" class="letra-btn letra-btn-grande" data-acao="mais" aria-label="Aumentar letra">A<small>+</small></button>' +
            '</div>' +
            '<button type="button" class="letra-abrir" aria-label="Tamanho da letra" aria-expanded="false" aria-controls="letra-painel">Aa</button>';
        document.body.appendChild(caixa);

        painel = caixa.querySelector('.letra-painel');
        menos = caixa.querySelector('[data-acao="menos"]');
        mais = caixa.querySelector('[data-acao="mais"]');
        porcento = caixa.querySelector('[data-acao="normal"]');
        var abrir = caixa.querySelector('.letra-abrir');

        function mostrar(aberto) {
            painel.hidden = !aberto;
            abrir.setAttribute('aria-expanded', String(aberto));
        }

        abrir.addEventListener('click', function () { mostrar(painel.hidden); });
        menos.addEventListener('click', function () { passo(-1); });
        mais.addEventListener('click', function () { passo(1); });
        porcento.addEventListener('click', function () { trocar(1); });
        document.addEventListener('click', function (e) {
            if (!caixa.contains(e.target)) mostrar(false);
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && !painel.hidden) { mostrar(false); abrir.focus(); }
        });

        atualizarBotoes();
    }

    aplicar();
    if (document.body) montar();
    else document.addEventListener('DOMContentLoaded', montar);
})();
