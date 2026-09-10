const AcervoService = (function () {
  const REPO_USUARIO = "LKSMILITAR";
  const REPO_NOME = "lksmilitar-biblioteca";

  function formatarTamanho(bytes) {
    if (!bytes || bytes === 0) return "Tamanho N/A";
    const k = 1024;
    const tamanhos = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + tamanhos[i];
  }

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

    const urlAPI = `https://api.github.com/repos/${REPO_USUARIO}/${REPO_NOME}/contents/acervo/${idPasta}`;

    try {
      const resposta = await fetch(urlAPI);

      if (resposta.status === 403) {
        throw new Error("Limite de requisições temporariamente excedido. Tente novamente em alguns minutos.");
      }

      if (!resposta.ok) {
        throw new Error("Módulo não encontrado ou sem documentos cadastrados.");
      }

      const dadosBrutos = await resposta.json();
      
      const arquivosPDF = dadosBrutos
        .filter(item => item.name.toLowerCase().endsWith('.pdf'))
        .map(item => ({
          id: item.sha || item.name,
          nome: item.name,
          tamanhoFormatado: formatarTamanho(item.size),
          downloadUrl: item.download_url
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
