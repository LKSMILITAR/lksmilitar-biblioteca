const AcervoService = (function () {
  const GAS_ENDPOINT_URL = "https://script.google.com/macros/s/AKfycbyyir_RkIgKWsheGHPmSaxPPDTAXfTDbn-UpjqzvlOjdzkD4aRHTZQsMxYQH2rSL9o9/exec";

  async function obterModulo(idPasta) {
    const chaveCache = `lks_cache_${idPasta}`;
    const cacheExistente = sessionStorage.getItem(chaveCache);

    if (cacheExistente) {
      try {
        return JSON.parse(cacheExistente);
      } catch (e) {
        sessionStorage.removeItem(chaveCache);
      }
    }

    const urlComParametro = `${GAS_ENDPOINT_URL}?modulo=${encodeURIComponent(idPasta)}`;

    try {
      const resposta = await fetch(urlComParametro);

      if (!resposta.ok) {
        throw new Error("Erro de comunicação com o servidor de armazenamento.");
      }

      const resultado = await resposta.json();

      if (!resultado.sucesso) {
        throw new Error(resultado.erro || "Falha ao carregar os documentos da nuvem.");
      }

      const arquivosPDF = resultado.dados.map(item => ({
        id: item.id,
        nome: item.nome,
        tamanhoFormatado: item.tamanhoFormatado,
        downloadUrl: item.downloadUrl
      }));

      sessionStorage.setItem(chaveCache, JSON.stringify(arquivosPDF));
      return arquivosPDF;
    } catch (erro) {
      throw erro;
    }
  }

  return {
    obterModulo
  };
})();
