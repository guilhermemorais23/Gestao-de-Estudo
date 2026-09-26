// Gera o código PIX "copia e cola" (BR Code, padrão EMV do Banco Central) com valor e identificador.

function campo(id, valor) {
  return `${id}${String(valor.length).padStart(2, '0')}${valor}`
}

// CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF), exigido no fim do código
function crc16(texto) {
  let crc = 0xffff
  for (const byte of new TextEncoder().encode(texto)) {
    crc ^= byte << 8
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

// O padrão só aceita letras sem acento em nome e cidade
function limpar(texto, max) {
  return (texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9 ]/g, '').trim().slice(0, max)
}

export function codigoPix({ chave, nome, cidade, valor, txid }) {
  const conta = campo('00', 'br.gov.bcb.pix') + campo('01', chave.trim())
  const corpo =
    campo('00', '01') +
    campo('26', conta) +
    campo('52', '0000') +
    campo('53', '986') +
    (valor ? campo('54', Number(valor).toFixed(2)) : '') +
    campo('58', 'BR') +
    campo('59', limpar(nome, 25) || 'RECEBEDOR') +
    campo('60', limpar(cidade, 15) || 'BRASIL') +
    campo('62', campo('05', (txid || '***').replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***')) +
    '6304'
  return corpo + crc16(corpo)
}
