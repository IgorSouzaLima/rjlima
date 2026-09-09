export const normalize = (value = '') => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export function filterCities(cities, query = '', state = '') {
  const q = normalize(query);
  return cities.filter(c => (!state || c.state === state) && normalize(`${c.city} ${c.state}`).includes(q));
}
export function validateQuote(q, step) {
  const errors = {};
  if (step === 1) {
    if (!q.origin?.trim()) errors.origin = 'Informe a cidade de coleta.';
    if (!q.destination?.trim()) errors.destination = 'Informe a cidade de entrega.';
    if (!q.cargo?.trim()) errors.cargo = 'Conte o que você precisa transportar.';
    if (q.weight && !(Number(String(q.weight).replace(',', '.')) > 0)) errors.weight = 'Informe um peso maior que zero ou deixe em branco.';
  } else {
    if (!q.name?.trim()) errors.name = 'Informe seu nome.';
    if (!q.company?.trim()) errors.company = 'Informe o nome da empresa.';
    if (!/^[1-9]{2}\d{8,9}$/.test(String(q.phone || '').replace(/\D/g,''))) errors.phone = 'Use um telefone com DDD, por exemplo (35) 99958-1894.';
  }
  return errors;
}
export function quoteMessage(q) {
  return `Olá! Gostaria de solicitar uma cotação com a RJ Lima.\n\nOrigem: ${q.origin}\nDestino: ${q.destination}\nServiço: ${q.service || 'A definir com a equipe'}\nCarga: ${q.cargo}\nPeso: ${q.weight ? q.weight + ' kg' : 'A confirmar'}\nVolumes: ${q.volumes || 'A confirmar'}\nValor da NF: ${q.invoice || 'A confirmar'}\n\nNome: ${q.name}\nEmpresa: ${q.company}\nTelefone: ${q.phone}\nObservações: ${q.notes || 'Sem observações adicionais'}`;
}
