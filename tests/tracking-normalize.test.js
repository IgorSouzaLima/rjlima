import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildFallbackTrackingEvents,
  getTrackingStepState,
  normalizeTrackingRecord
} from '../src/tracking/normalize.js'

test('normalizes external API tracking payload into the public tracking shape', () => {
  const record = normalizeTrackingRecord({
    invoiceNumber: 'NF-123',
    fiscalKey: '1'.repeat(44),
    recipient: 'Cliente Teste',
    destination: { city: 'Varginha', state: 'MG' },
    status: 'Saiu para entrega',
    events: [
      {
        status: 'Coleta',
        date: '2026-07-01',
        city: 'Pouso Alegre',
        state: 'MG',
        description: 'Carga coletada'
      }
    ],
    proof: { url: 'https://example.com/proof.jpg', label: 'Comprovante' }
  })

  assert.equal(record.invoiceNumber, 'NF-123')
  assert.equal(record.destination.city, 'Varginha')
  assert.equal(record.events[0].status, 'Coleta')
  assert.equal(record.proof.url, 'https://example.com/proof.jpg')
})

test('normalizes external API payload wrapped in data property', () => {
  const record = normalizeTrackingRecord({
    data: {
      invoiceNumber: 'NF-456',
      fiscalKey: '2'.repeat(44),
      recipient: 'Cliente Wrapper',
      city: 'Campinas',
      state: 'SP',
      status: 'Em rota'
    }
  })

  assert.equal(record.invoiceNumber, 'NF-456')
  assert.equal(record.destination.city, 'Campinas')
  assert.equal(record.destination.state, 'SP')
})

test('builds four public timeline steps from an existing Supabase invoice', () => {
  const events = buildFallbackTrackingEvents({
    collection_date: '2026-07-01',
    delivery_date: '2026-07-03',
    city: 'Varginha',
    state: 'MG',
    status: 'Entregue'
  })

  assert.deepEqual(events.map((event) => event.status), [
    'Coleta',
    'Em rota',
    'Saiu para entrega',
    'Entregue'
  ])
  assert.equal(events[0].date, '2026-07-01')
  assert.equal(events[3].date, '2026-07-03')
})

test('marks timeline steps according to current status', () => {
  assert.equal(getTrackingStepState('Coleta', 'Em rota'), 'completed')
  assert.equal(getTrackingStepState('Em rota', 'Em rota'), 'current')
  assert.equal(getTrackingStepState('Entregue', 'Em rota'), 'pending')
})
