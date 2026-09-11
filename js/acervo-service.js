"use strict";

const AcervoService = (() => {
  const R2_PUBLIC_BASE_URL =
    "https://pub-5e6c30c074f64afb9a8459ab168a58d4.r2.dev"
      .replace(/\/$/, "");

  const CACHE_TTL = 5 * 60 * 1000;

  function codificarCaminho(caminho) {
    return String(caminho)
      .split("/")
      .filter(Boolean)
      .map(encodeURIComponent)
      .join("/");
  }

  function criarUrl(pasta, arquivo) {
    return (
      R2_PUBLIC_BASE_URL +
      "/" +
      codificarCaminho(pasta) +
      "/" +
      codificarCaminho(arquivo)
    );
  }

  function lerCache(chave) {
    try {
      const valor = sessionStorage.getItem(chave);

      if (!valor) {
        return null;
      }

      const cache = JSON.parse(valor);

      if (
        !cache.criadoEm ||
        Date.now() - cache.criadoEm > CACHE_TTL
      ) {
        sessionStorage.removeItem(chave);
        return null;
      }

      return Array.isArray(cache.dados)
        ? cache.dados
        : null;
    } catch (erro) {
      sessionStorage.removeItem(chave);
      return null;
    }
  }

  function salvarCache(chave, dados) {
    try {
      sessionStorage.setItem(
        chave,
        JSON.stringify({
          criadoEm: Date.now(),
          dados: dados
        })
      );
    } catch (erro) {
      console.warn("Não foi possível salvar o cache.", erro);
    }
  }

  function normalizarDocumento(item, pasta, indice) {
    if (!item || typeof item !== "object") {
      throw new Error(
        `O item ${indice + 1} do index.json é inválido.`
      );
    }

    const arquivo = String(item.arquivo || "").trim();
    const titulo = String(item.titulo || "").trim();
    const capa = String(
      item.capa || item.capaUrl || ""
    ).trim();

    if (!arquivo || !titulo) {
      throw new Error(
        `O item ${indice + 1} precisa dos campos "arquivo" e "titulo".`
      );
    }

    const urlArquivo = criarUrl(pasta, arquivo);

    let urlCapa = "";

    if (capa) {
      if (
        capa.startsWith("https://") ||
        capa.startsWith("http://")
      ) {
        urlCapa = capa;
      } else {
        urlCapa = criarUrl(pasta, capa);
      }
    }

    return {
      id: `${pasta}/${arquivo}`,
      nome: titulo,
      tamanhoFormatado: String(item.tamanho || "PDF"),
      capaUrl: urlCapa,
      previewUrl: urlArquivo,
      downloadUrl: urlArquivo
    };
  }

  async function obterModulo(
    idPasta,
    forcarAtualizacao = false
  ) {
    const pasta = String(idPasta || "").trim();

    if (!pasta) {
      throw new Error("A pasta informada é inválida.");
    }

    const chaveCache = `lks_acervo_v2_${pasta}`;

    if (forcarAtualizacao) {
      sessionStorage.removeItem(chaveCache);
    }

    if (!forcarAtualizacao) {
      const cache = lerCache(chaveCache);

      if (cache) {
        return cache;
      }
    }

    const urlIndice = criarUrl(
      pasta,
      "index.json"
    );

    let resposta;

    try {
      resposta = await fetch(urlIndice, {
        method: "GET",
        mode: "cors",
        cache: "no-store"
      });
    } catch (erro) {
      console.error("Erro de rede ou CORS:", erro);

      throw new Error(
        "Não foi possível acessar o Cloudflare R2. " +
        "Ative o acesso público e confira o CORS do bucket."
      );
    }

    if (resposta.status === 404) {
      throw new Error(
        `A pasta "${pasta}" ainda não possui o arquivo index.json.`
      );
    }

    if (!resposta.ok) {
      throw new Error(
        `O Cloudflare R2 retornou o erro HTTP ${resposta.status}.`
      );
    }

    let listaDocumentos;

    try {
      listaDocumentos = await resposta.json();
    } catch (erro) {
      throw new Error(
        `O arquivo ${pasta}/index.json não contém um JSON válido.`
      );
    }

    if (!Array.isArray(listaDocumentos)) {
      throw new Error(
        `O arquivo ${pasta}/index.json precisa conter uma lista JSON.`
      );
    }

    const documentos = listaDocumentos.map(
      (item, indice) =>
        normalizarDocumento(
          item,
          pasta,
          indice
        )
    );

    salvarCache(chaveCache, documentos);

    return documentos;
  }

  return {
    obterModulo,
    criarUrl
  };
})();
