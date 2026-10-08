// Gerado por scripts/gera-dados.mjs a partir de .pagina/movimento/ritmo.json. Não editar.
export const ritmo = {
  "escala": {
    "duracoes_ms": [
      {
        "nome": "troca",
        "valor": 650,
        "origem": {
          "tipo": "ficha",
          "ref": "R02#6",
          "motivo": "a troca lateral entre orçamentos e a abertura dos aparelhos em leque pedem tempo para o olho seguir o aparelho que sai e o que entra; R02 mede 600–667 ms na mesma troca de produto"
        }
      },
      {
        "nome": "painel",
        "valor": 567,
        "origem": {
          "tipo": "ficha",
          "ref": "R05#8",
          "motivo": "a ficha técnica sobe do lugar como o card lateral de R05; um pouco mais curta que a troca porque é resposta direta ao toque. R16#25 mede 50 ms, abrupto demais para a transição de modal que a Thaís pediu"
        }
      },
      {
        "nome": "logo",
        "valor": 2000,
        "origem": {
          "tipo": "ficha",
          "ref": "R05#13",
          "motivo": "a Thaís pediu troca de cor 'bem sutil'; R05 faz a passagem contínua de cor em 1,5 s, e o valor foi esticado para a mudança passar quase despercebida"
        }
      },
      {
        "nome": "flutua",
        "valor": 1583,
        "origem": {
          "tipo": "ficha",
          "ref": "R16#6",
          "motivo": "meio ciclo do balanço dos aparelhos (subida ou descida), em ida e volta contínuas; R16 mede flutuação de 1583 ms ease-in-out em imagens soltas sobre fundo escuro, lenta o bastante para não disputar com a leitura do preço"
        }
      }
    ],
    "delays_ms": [
      {
        "nome": "nenhum",
        "valor": 0,
        "origem": {
          "tipo": "ficha",
          "ref": "R02#6",
          "motivo": "saída e entrada se sobrepõem desde o início, sem tela vazia"
        }
      },
      {
        "nome": "aparelho",
        "valor": 250,
        "origem": {
          "tipo": "curso",
          "ref": "A13",
          "motivo": "três aparelhos se abrem um após o outro, do centro para as bordas, com intervalo suficiente para serem lidos como sequência e sem atrasar a leitura do preço"
        }
      }
    ],
    "easings": [
      {
        "nome": "troca",
        "valor": "ease-in-out",
        "origem": {
          "tipo": "ficha",
          "ref": "R02#6",
          "motivo": "pico no meio e assentamento suave na troca de aparelhos e no painel, como na referência principal"
        }
      },
      {
        "nome": "cor",
        "valor": "linear",
        "origem": {
          "tipo": "ficha",
          "ref": "R05#13",
          "motivo": "passagem de cor contínua, sem aceleração perceptível, deixa a troca da logo sutil"
        }
      }
    ]
  },
  "pausas": [
    {
      "id": "logo-segura",
      "secao": "S1",
      "entre": [
        "logo-para-e-escuro",
        "logo-para-colorida"
      ],
      "ms": 4000,
      "origem": {
        "tipo": "padrao",
        "ref": "P-HOLD-RITMO",
        "motivo": "cada versão da logo fica parada bem mais que a faixa medida (400–1700 ms) para o ciclo não chamar atenção do preço; sutil é o pedido dela"
      }
    },
    {
      "id": "aparelhos-assentam",
      "secao": "S2",
      "entre": [
        "aparelhos-leque",
        "aparelhos-balanco"
      ],
      "ms": 650,
      "origem": {
        "tipo": "padrao",
        "ref": "P-HOLD-RITMO",
        "motivo": "quietude depois do leque, antes do balanço leve, para o preço ser lido com os aparelhos parados"
      }
    }
  ],
  "stagger": [
    {
      "id": "aparelhos-leque",
      "secao": "S2",
      "unidade": "item",
      "intervalo_ms": 250,
      "origem": {
        "tipo": "curso",
        "ref": "A13",
        "motivo": "os aparelhos abrem um por vez na ordem de leitura, do centro para as bordas"
      }
    },
    {
      "id": "aparelhos-balanco",
      "secao": "S2",
      "unidade": "item",
      "intervalo_ms": 250,
      "origem": {
        "tipo": "curso",
        "ref": "A13",
        "motivo": "defasagem entre os três aparelhos para o balanço não andar em bloco; mesmo intervalo do leque, para o site ter um só passo"
      }
    }
  ],
  "cursor": null,
  "rolagem": null
};
