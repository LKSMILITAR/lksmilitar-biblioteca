const AcervoService = (function () {
  // Subdomínio público do seu bucket lksmilitar-acervo no Cloudflare R2
  const R2_PUBLIC_BASE_URL = "https://pub-5e6c30c074f64afb9a8459ab168a58d4.r2.dev";

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

    // Monta a URL para buscar o manifesto da pasta (ex: .../termodinamica/index.json)
    const urlIndice = `${R2_PUBLIC_BASE_URL}/${encodeURIComponent(idPasta)}/index.json`;

    try {
      const resposta = await fetch(urlIndice);

      if (!resposta.ok) {
        throw new Error(`O módulo "${idPasta}" ainda não possui um arquivo index.json publicado.`);
      }

      const listaDocumentos = await resposta.json();

      // Mapeia a lista para o formato aceito pela interface do index.html
      const arquivosPDF = listaDocumentos.map(item => {
        const urlArquivo = `${R2_PUBLIC_BASE_URL}/${encodeURIComponent(idPasta)}/${encodeURIComponent(item.arquivo)}`;
        return {
          id: item.arquivo,
          nome: item.titulo,
          tamanhoFormatado: item.tamanho || "PDF",
          capaUrl: item.capaUrl || "assets/pdf-placeholder.png",
          previewUrl: urlArquivo,
          downloadUrl: urlArquivo
        };
      });

      sessionStorage.setItem(chaveCache, JSON.stringify(arquivosPDF));
      return arquivosPDF;
    } catch (erro) {
      console.error("Erro ao carregar acervo do R2:", erro);
      throw new Error("Não foi possível conectar ao acervo digital. Verifique se o arquivo index.json e as regras de CORS estão ativos no R2.");
    }
  }

  return {
    obterModulo
  };
})();
