import "server-only";

/**
 * Freio do redirect público — item 6.8, segunda metade.
 *
 * Serve a dois problemas diferentes. O primeiro é a métrica: sem freio, um
 * laço de `curl` transforma "1.200 leituras" num número sem sentido, e o
 * limite de scans do item 5.4 vira algo que qualquer um esgota. O segundo é
 * a senha do item 5.5: sem freio, tentar todas as senhas de quatro dígitos
 * é questão de segundos.
 *
 * **Limitação assumida:** o contador vive na memória do processo. Numa
 * hospedagem com várias instâncias, cada uma tem o seu — o teto real é
 * `limite × instâncias`. Para conter um laço distraído e um ataque de
 * dicionário, basta; para conter um ataque coordenado, o lugar certo é a
 * borda (WAF), não este arquivo. Trocar por Redis depois é mexer só aqui.
 */

interface Janela {
  contagem: number;
  /** Quando a janela zera, em ms de época. */
  expiraEm: number;
}

const janelas = new Map<string, Janela>();

/**
 * Sem esta poda, um pico de tráfego deixaria uma entrada por IP na memória
 * para sempre. Roda junto com a leitura, amortizada: nada de `setInterval`,
 * que manteria o processo acordado à toa em serverless.
 */
const PODA_A_CADA = 500;
let desdeUltimaPoda = 0;

function podar(agora: number) {
  if (++desdeUltimaPoda < PODA_A_CADA) return;
  desdeUltimaPoda = 0;
  for (const [chave, janela] of janelas) {
    if (janela.expiraEm <= agora) janelas.delete(chave);
  }
}

export interface Veredito {
  permitido: boolean;
  /** Segundos até a janela abrir de novo — vira `Retry-After`. */
  esperarS: number;
}

/**
 * @param chave  quem está batendo (IP com hash + o que ele quer fazer)
 * @param limite quantas vezes pode, dentro da janela
 * @param janelaS tamanho da janela em segundos
 */
export function consumir(chave: string, limite: number, janelaS: number): Veredito {
  const agora = Date.now();
  podar(agora);

  const atual = janelas.get(chave);

  if (!atual || atual.expiraEm <= agora) {
    janelas.set(chave, { contagem: 1, expiraEm: agora + janelaS * 1000 });
    return { permitido: true, esperarS: 0 };
  }

  atual.contagem += 1;
  if (atual.contagem > limite) {
    return {
      permitido: false,
      esperarS: Math.max(1, Math.ceil((atual.expiraEm - agora) / 1000)),
    };
  }

  return { permitido: true, esperarS: 0 };
}

/**
 * Teto do redirect: 30 leituras do mesmo IP no mesmo código por minuto.
 * Alto o bastante para a fila de um evento passando o celular de mão em mão
 * atrás do mesmo NAT, baixo o bastante para um laço automático bater na
 * parede em dois segundos.
 */
export function freioDeLeitura(ipHash: string, slug: string): Veredito {
  return consumir(`scan:${slug}:${ipHash}`, 30, 60);
}

/**
 * Teto da senha: 8 tentativas por IP a cada 5 minutos, contadas por código.
 * Quem digitou errado duas vezes não sente; quem está varrendo o dicionário
 * para em oito.
 */
export function freioDeSenha(ipHash: string, slug: string): Veredito {
  return consumir(`senha:${slug}:${ipHash}`, 8, 300);
}
