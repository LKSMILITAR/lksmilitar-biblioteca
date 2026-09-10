const AcervoService = (function () {
  const GAS_ENDPOINT_URL = "https://script.google.com/macros/s/AKfycbx095QJtr6fHebjX-KOpW-gVKnxj7IAGI4UDJnBJSectJfbmAxwVdLWL_bODL_wLKIb/exec";

  async function obterModulo(idPasta, forcarAtualizacao = false) {
    const chaveCache = `lks_cache_${idPasta}`;

    if (forcarAtualizacao) {
      sessionStorage.removeItem(chaveCache);
    } else {
      const cacheExistente = sessionStorage.getItem(chaveCache);
      if (cacheExistente) {
        try {
          return JSON.parse(cacheExistente);
        } catch (e) {
          sessionStorage.removeItem(chaveCache);
        }
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
        capaUrl: item.capaUrl,
        previewUrl: item.previewUrl,
        downloadUrl: item.downloadUrl
      }));

      sessionStorage.setItem(chaveCache, JSON.stringify(arquivosPDF));
      return arquivosPDF;
    } catch (erro) {
      throw new Error("Não foi possível conectar ao servidor. Verifique a conexão ou tente novamente.");
    }
  }

  return {
    obterModulo
  };
})();
