import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const mainJs = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8')

test('quote form collects freight operation details', () => {
  const requiredFields = [
    'name="origem"',
    'name="destino"',
    'name="tipo_carga"',
    'name="peso"',
    'name="volumes"',
    'name="valor_nf"',
    'name="nome"',
    'name="telefone"'
  ]

  requiredFields.forEach((field) => {
    assert.match(indexHtml, new RegExp(field))
  })
})

test('quote submission sends freight details through EmailJS payload', () => {
  ;[
    'tipo_carga',
    'peso',
    'volumes',
    'valor_nf'
  ].forEach((field) => {
    assert.match(mainJs, new RegExp(field))
  })

  assert.match(mainJs, /Tipo de carga:/)
  assert.match(mainJs, /Peso aproximado:/)
  assert.match(mainJs, /Volumes:/)
  assert.match(mainJs, /Valor da NF:/)
})

test('quote form can send filled freight details to WhatsApp', () => {
  assert.match(indexHtml, /id="quoteWhatsapp"/)
  assert.match(mainJs, /buildQuoteWhatsappUrl/)
  assert.match(mainJs, /encodeURIComponent\(message\)/)
  assert.match(mainJs, /quoteForm\.addEventListener\('input', updateQuoteWhatsappLink\)/)
})
