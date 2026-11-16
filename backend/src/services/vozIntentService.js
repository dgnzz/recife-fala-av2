/**
 * Serviço de Interpretação de Intenções por Voz (NLU Simplificado)
 * Recebe a transcrição da Web Speech API e mapeia para o catálogo de serviços do Recife.
 */

function normalizarTexto(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function identificarIntencao(transcricao, servicosDisponiveis) {
  const textoLimpo = normalizarTexto(transcricao);

  if (!textoLimpo) {
    return {
      reconhecido: false,
      mensagem_tts: 'Não consegui ouvir o que você disse. Por favor, toque no microfone e fale novamente.'
    };
  }

  // Verifica pedido explícito de ajuda humana
  if (textoLimpo.includes('atendente') || textoLimpo.includes('humano') || textoLimpo.includes('ajuda')) {
    return {
      reconhecido: true,
      acao: 'TRANSBORDO_HUMANO',
      mensagem_tts: 'Tudo bem. Vou transferir seu atendimento para um atendente humano da Prefeitura do Recife. Aguarde um instante.'
    };
  }

  // Verifica consulta de protocolo
  if (textoLimpo.includes('protocolo') || textoLimpo.includes('acompanhar') || textoLimpo.includes('andamento')) {
    return {
      reconhecido: true,
      acao: 'CONSULTA_PROTOCOLO',
      mensagem_tts: 'Você quer consultar o andamento de um protocolo, certo? Diga Sim para continuar ou Não para escolher outro serviço.'
    };
  }

  // Busca correspondência nas palavras-chave cadastradas no banco
  let melhorServico = null;
  let maiorPontuacao = 0;

  for (const servico of servicosDisponiveis) {
    const palavrasChave = servico.palavras_chave_voz
      .split(',')
      .map((p) => normalizarTexto(p));

    let pontuacao = 0;
    for (const palavra of palavrasChave) {
      if (palavra && textoLimpo.includes(palavra)) {
        pontuacao += palavra.split(' ').length; // Dá peso maior a termos compostos como "segunda via"
      }
    }

    if (pontuacao > maiorPontuacao) {
      maiorPontuacao = pontuacao;
      melhorServico = servico;
    }
  }

  if (melhorServico) {
    return {
      reconhecido: true,
      acao: 'INICIAR_SERVICO',
      servico: {
        id_servico: melhorServico.id_servico,
        codigo_servico: melhorServico.codigo_servico,
        nome_servico: melhorServico.nome_servico,
        campos_obrigatorios: melhorServico.campos_obrigatorios
      },
      mensagem_tts: `Entendi! Você quer solicitar ${melhorServico.nome_servico}, certo? Toque em Sim ou diga Sim para confirmar.`
    };
  }

  return {
    reconhecido: false,
    mensagem_tts:
      'Desculpe, não identifiquei esse serviço. Você pode pedir: 2ª via do IPTU, Certidão Negativa, Agendamento de Consulta ou Manutenção Urbana.'
  };
}

module.exports = { identificarIntencao, normalizarTexto };
