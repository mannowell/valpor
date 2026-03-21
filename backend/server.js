const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000; // PORT configurável

// Middleware
app.use(cors());
app.use(express.json());

// Configurações de notificação (padrões podem ser sobrescritos via .env)
const ADMIN_CONTACTS = {
  email: process.env.ADMIN_EMAIL || 'wellison.nascimento@hotmail.com',
  phone_sms: process.env.ADMIN_PHONE_SMS || '+351965563654',
  phone_whatsapp: process.env.ADMIN_WHATSAPP || '+5598987566701'
};

// Transportador de email (criado somente se variáveis SMTP definidas)
let emailTransporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

// Cliente Twilio (criado só se variáveis estiverem presentes)
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

// ========== DADOS COMPLETOS - 7 SILOS ==========
let silos = [
  { 
    id: 1, 
    numero: 1, 
    capacidade_ton: 12, 
    capacidade_kg: 12000, 
    racao_atual_kg: 8500, 
    tipo_racao: 'inicial', 
    ativo: true,
    localizacao: 'Setor A',
    fornecedor: 'Fábrica Principal',
    ultima_recarga: '2024-01-10T08:00:00Z'
  },
  { 
    id: 2, 
    numero: 2, 
    capacidade_ton: 10, 
    capacidade_kg: 10000, 
    racao_atual_kg: 3200, 
    tipo_racao: 'crescimento1', 
    ativo: true,
    localizacao: 'Setor A',
    fornecedor: 'Fábrica Principal',
    ultima_recarga: '2024-01-12T14:30:00Z'
  },
  { 
    id: 3, 
    numero: 3, 
    capacidade_ton: 10, 
    capacidade_kg: 10000, 
    racao_atual_kg: 8000, 
    tipo_racao: 'crescimento2', 
    ativo: true,
    localizacao: 'Setor B',
    fornecedor: 'Fábrica Principal',
    ultima_recarga: '2024-01-11T10:00:00Z'
  },
  { 
    id: 4, 
    numero: 4, 
    capacidade_ton: 10, 
    capacidade_kg: 10000, 
    racao_atual_kg: 6000, 
    tipo_racao: 'finalizacao', 
    ativo: true,
    localizacao: 'Setor B',
    fornecedor: 'Fábrica Secundária',
    ultima_recarga: '2024-01-13T09:15:00Z'
  },
  { 
    id: 5, 
    numero: 5, 
    capacidade_ton: 12, 
    capacidade_kg: 12000, 
    racao_atual_kg: 11000, 
    tipo_racao: 'inicial', 
    ativo: true,
    localizacao: 'Setor C',
    fornecedor: 'Fábrica Principal',
    ultima_recarga: '2024-01-09T11:45:00Z'
  },
  { 
    id: 6, 
    numero: 6, 
    capacidade_ton: 12, 
    capacidade_kg: 12000, 
    racao_atual_kg: 9000, 
    tipo_racao: 'crescimento1', 
    ativo: true,
    localizacao: 'Setor C',
    fornecedor: 'Fábrica Principal',
    ultima_recarga: '2024-01-14T16:20:00Z'
  },
  { 
    id: 7, 
    numero: 7, 
    capacidade_ton: 10, 
    capacidade_kg: 10000, 
    racao_atual_kg: 4500, 
    tipo_racao: 'crescimento2', 
    ativo: true,
    localizacao: 'Setor D',
    fornecedor: 'Fábrica Secundária',
    ultima_recarga: '2024-01-08T13:10:00Z'
  }
];

let lotes = [
  { 
    id: 'LOTE-001', 
    silo_id: 1, 
    quantidade_inicial: 1000, 
    quantidade_atual: 980, 
    fase_crescimento: 'inicial', 
    data_entrada: '2024-01-01T00:00:00Z',
    peso_medio_kg: 8.5,
    mortalidade_acumulada: 20,
    temperatura: 28
  },
  { 
    id: 'LOTE-002', 
    silo_id: 2, 
    quantidade_inicial: 950, 
    quantidade_atual: 940, 
    fase_crescimento: 'crescimento1', 
    data_entrada: '2024-01-15T00:00:00Z',
    peso_medio_kg: 25.0,
    mortalidade_acumulada: 10,
    temperatura: 26
  },
  { 
    id: 'LOTE-003', 
    silo_id: 3, 
    quantidade_inicial: 900, 
    quantidade_atual: 890, 
    fase_crescimento: 'crescimento2', 
    data_entrada: '2024-02-01T00:00:00Z',
    peso_medio_kg: 45.0,
    mortalidade_acumulada: 10,
    temperatura: 24
  },
  // Anexo do pavilhão 3 (1/4 da capacidade)
  { 
    id: 'LOTE-003A', 
    silo_id: 3, 
    quantidade_inicial: 225, 
    quantidade_atual: 220, 
    fase_crescimento: 'crescimento2', 
    data_entrada: '2024-02-10T00:00:00Z',
    peso_medio_kg: 44.0,
    mortalidade_acumulada: 2,
    temperatura: 24,
    anexo: true,
    pavilhao: '3-Anexo'
  },
  { 
    id: 'LOTE-004', 
    silo_id: 4, 
    quantidade_inicial: 850, 
    quantidade_atual: 845, 
    fase_crescimento: 'finalizacao', 
    data_entrada: '2024-02-15T00:00:00Z',
    peso_medio_kg: 85.0,
    mortalidade_acumulada: 5,
    temperatura: 22
  },
  { 
    id: 'LOTE-005', 
    silo_id: 5, 
    quantidade_inicial: 1000, 
    quantidade_atual: 995, 
    fase_crescimento: 'inicial', 
    data_entrada: '2024-03-01T00:00:00Z',
    peso_medio_kg: 9.0,
    mortalidade_acumulada: 5,
    temperatura: 27
  },
  { 
    id: 'LOTE-006', 
    silo_id: 6, 
    quantidade_inicial: 950, 
    quantidade_atual: 945, 
    fase_crescimento: 'crescimento1', 
    data_entrada: '2024-03-15T00:00:00Z',
    peso_medio_kg: 26.0,
    mortalidade_acumulada: 5,
    temperatura: 25
  },
  // Anexo do pavilhão 6 (1/4 da capacidade)
  {
    id: 'LOTE-006A',
    silo_id: 6,
    quantidade_inicial: 238,
    quantidade_atual: 235,
    fase_crescimento: 'crescimento1',
    data_entrada: '2024-03-20T00:00:00Z',
    peso_medio_kg: 25.5,
    mortalidade_acumulada: 1,
    temperatura: 25,
    anexo: true,
    pavilhao: '6-Anexo'
  },
  { 
    id: 'LOTE-007', 
    silo_id: 7, 
    quantidade_inicial: 900, 
    quantidade_atual: 895, 
    fase_crescimento: 'crescimento2', 
    data_entrada: '2024-04-01T00:00:00Z',
    peso_medio_kg: 46.0,
    mortalidade_acumulada: 5,
    temperatura: 23
  }
];

// Histórico de mudanças para monitoramento
let historicoMudancas = [];

// Persistência simples em arquivo JSON (salva silos, lotes e histórico)
const DATA_FILE = path.join(__dirname, 'data', 'data.json');

function saveData() {
  try {
    const payload = { silos, lotes, historicoMudancas };
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2), 'utf8');
    console.log('✅ Dados salvos em', DATA_FILE);
  } catch (err) {
    console.error('❌ Erro ao salvar dados:', err);
  }
}

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const d = JSON.parse(raw);
      silos = d.silos || silos;
      lotes = d.lotes || lotes;
      historicoMudancas = d.historicoMudancas || historicoMudancas;
      console.log('✅ Dados carregados de', DATA_FILE);
    } else {
      // salva os dados iniciais para persistência
      saveData();
    }
  } catch (err) {
    console.error('❌ Erro ao carregar dados:', err);
  }
}

// Carregar dados ao iniciar
loadData();

// Garantir que os anexos dos pavilhões 3 e 6 existam (caso o data.json venha de uma versão antiga)
function ensureAnexoLotes() {
  let changed = false;

  if (!lotes.find(l => l.id === 'LOTE-003A')) {
    lotes.push({
      id: 'LOTE-003A',
      silo_id: 3,
      quantidade_inicial: 225,
      quantidade_atual: 220,
      fase_crescimento: 'crescimento2',
      data_entrada: '2024-02-10T00:00:00Z',
      peso_medio_kg: 44.0,
      mortalidade_acumulada: 2,
      temperatura: 24,
      anexo: true,
      pavilhao: '3-Anexo'
    });
    changed = true;
  }

  if (!lotes.find(l => l.id === 'LOTE-006A')) {
    lotes.push({
      id: 'LOTE-006A',
      silo_id: 6,
      quantidade_inicial: 238,
      quantidade_atual: 235,
      fase_crescimento: 'crescimento1',
      data_entrada: '2024-03-20T00:00:00Z',
      peso_medio_kg: 25.5,
      mortalidade_acumulada: 1,
      temperatura: 25,
      anexo: true,
      pavilhao: '6-Anexo'
    });
    changed = true;
  }

  if (changed) {
    saveData();
    console.log('✅ Anexos adicionados automaticamente e dados salvos');
  }
}

ensureAnexoLotes();


// ========== CONSTANTES DE CÁLCULO ==========
const CONSTANTES = {
  CONSUMO_POR_FASE: {
    inicial: 1.0,
    crescimento1: 1.5,
    crescimento2: 1.8,
    finalizacao: 2.0
  },
  MORTALIDADE_POR_FASE: {
    inicial: 0.003,
    crescimento1: 0.002,
    crescimento2: 0.001,
    finalizacao: 0.0005
  }
};

// ========== FUNÇÕES DE CÁLCULO ==========
function calcularConsumoDiario(lote, temperatura = null) {
  const consumoBase = CONSTANTES.CONSUMO_POR_FASE[lote.fase_crescimento];
  const temp = temperatura || lote.temperatura || 25;
  const fatorTemp = temp > 25 ? 1.1 : temp < 15 ? 0.9 : 1.0;
  return lote.quantidade_atual * consumoBase * fatorTemp;
}

function calcularDiasRestantes(silo, consumoDiario) {
  if (consumoDiario <= 0) return 999;
  return Math.floor(silo.racao_atual_kg / consumoDiario);
}

function determinarNivelAlerta(dias) {
  if (dias <= 1) return { nivel: 'CRITICO', cor: '#e74c3c', prioridade: 1 };
  if (dias <= 2) return { nivel: 'URGENTE', cor: '#e67e22', prioridade: 2 };
  if (dias <= 3) return { nivel: 'ALERTA', cor: '#f1c40f', prioridade: 3 };
  if (dias <= 5) return { nivel: 'ATENCAO', cor: '#2ecc71', prioridade: 4 };
  return { nivel: 'NORMAL', cor: '#3498db', prioridade: 5 };
}

// Envio de notificações (email / sms / whatsapp) — não envia sem configuração de provedor
async function sendEmail(to, subject, text) {
  if (!emailTransporter) {
    console.log('📧 SMTP não configurado - pulando envio de email para', to);
    return false;
  }
  try {
    await emailTransporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, text });
    console.log('📧 Email enviado para', to);
    return true;
  } catch (err) {
    console.error('❌ Falha ao enviar email:', err);
    return false;
  }
}

async function sendSMS(to, body) {
  if (!twilioClient) {
    console.log('📲 Twilio não configurado - pulando SMS para', to);
    return false;
  }
  try {
    await twilioClient.messages.create({ body, from: process.env.TWILIO_FROM_SMS, to });
    console.log('📲 SMS enviado para', to);
    return true;
  } catch (err) {
    console.error('❌ Falha ao enviar SMS:', err);
    return false;
  }
}

async function sendWhatsApp(to, body) {
  if (!twilioClient) {
    console.log('🟢 Twilio não configurado - pulando WhatsApp para', to);
    return false;
  }
  try {
    // to e from devem ter formato: whatsapp:+551199999999
    await twilioClient.messages.create({ body, from: process.env.TWILIO_FROM_WHATSAPP, to: `whatsapp:${to}` });
    console.log('🟢 WhatsApp enviado para', to);
    return true;
  } catch (err) {
    console.error('❌ Falha ao enviar WhatsApp:', err);
    return false;
  }
}

async function notifyAlert(silo, message) {
  // Apenas registra e tenta enviar se houver provider configurado
  console.log('🔔 Notificação de alerta:', silo.numero, message);
  if (process.env.NOTIFY_ON_ALERT === 'false') return;
  // Email
  if (ADMIN_CONTACTS.email) await sendEmail(ADMIN_CONTACTS.email, `Alerta Silo ${silo.numero}`, message);
  // SMS
  if (ADMIN_CONTACTS.phone_sms) await sendSMS(ADMIN_CONTACTS.phone_sms, message);
  // WhatsApp
  if (ADMIN_CONTACTS.phone_whatsapp) await sendWhatsApp(ADMIN_CONTACTS.phone_whatsapp, message);
}


function calcularQuantidadePedido(silo, consumoDiario) {
  const capacidadeKg = silo.capacidade_ton * 1000;
  const espacoDisponivel = capacidadeKg - silo.racao_atual_kg;
  const necessidade = consumoDiario * 2; // 2 dias de antecedência
  
  const pedidoKg = Math.min(espacoDisponivel, necessidade);
  const sacas = Math.ceil(pedidoKg / 50);
  
  return {
    quantidade_kg: sacas * 50,
    quantidade_sacas: sacas,
    espaco_apos_pedido: silo.racao_atual_kg + (sacas * 50)
  };
}

// ========== ROTAS DA API ==========

// 1. Health Check
app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    sistema: 'PigFeed Manager API',
    versao: '1.0.0',
    port: PORT,
    silos: silos.length,
    lotes: lotes.length,
    animais_total: lotes.reduce((sum, l) => sum + l.quantidade_atual, 0),
    timestamp: new Date().toISOString()
  });
});

// 2. Dashboard completo
app.get('/api/dashboard', (req, res) => {
  try {
    // Total de animais para cálculo de percentuais
    const total_animais = lotes.reduce((sum, l) => sum + l.quantidade_atual, 0);

    const dashboard = silos.map(silo => {
      const lotesSilo = lotes.filter(l => l.silo_id === silo.id);
      const consumoDiario = lotesSilo.reduce((total, lote) => 
        total + calcularConsumoDiario(lote), 0);
      const diasRestantes = calcularDiasRestantes(silo, consumoDiario);
      const nivelAlerta = determinarNivelAlerta(diasRestantes);
      const pedidoRecomendado = calcularQuantidadePedido(silo, consumoDiario);

      // Animais por silo
      const animais_atrelados = lotesSilo.reduce((sum, l) => sum + l.quantidade_atual, 0);
      const percentual_animais = total_animais > 0 ? ((animais_atrelados / total_animais) * 100).toFixed(1) : '0.0';
      
      // Informações detalhadas dos lotes do silo (para UI mostrar sub-cards)
      const lotes_info = lotesSilo.map(l => ({
        id: l.id,
        quantidade_inicial: l.quantidade_inicial,
        quantidade_atual: l.quantidade_atual,
        fase_crescimento: l.fase_crescimento,
        anexo: l.anexo || false,
        pavilhao: l.pavilhao || null
      }));

      return {
        ...silo,
        percentual_preenchido: ((silo.racao_atual_kg / silo.capacidade_kg) * 100).toFixed(1),
        consumo_diario_kg: Math.round(consumoDiario),
        dias_restantes: diasRestantes,
        nivel_alerta: nivelAlerta.nivel,
        cor_alerta: nivelAlerta.cor,
        quantidade_lotes: lotesSilo.length,
        lotes_ids: lotesSilo.map(l => l.id),
        lotes_info: lotes_info,
        animais_atrelados,
        percentual_animais,
        pedido_recomendado: pedidoRecomendado
      };
    });

    // Ordenar por prioridade de alerta
    dashboard.sort((a, b) => {
      const prioridadeA = determinarNivelAlerta(a.dias_restantes).prioridade;
      const prioridadeB = determinarNivelAlerta(b.dias_restantes).prioridade;
      return prioridadeA - prioridadeB;
    });

    res.json({
      status: 'success',
      data: {
        silos: dashboard,
        totais: {
          silos_total: silos.length,
          lotes_total: lotes.length,
          animais_total: total_animais,
          racao_total_kg: silos.reduce((sum, s) => sum + s.racao_atual_kg, 0),
          consumo_total_diario: dashboard.reduce((sum, s) => sum + s.consumo_diario_kg, 0),
          alertas_ativos: dashboard.filter(s => s.dias_restantes <= 3).length,
          capacidade_total_ton: silos.reduce((sum, s) => sum + s.capacidade_ton, 0),
          animais_por_silo: dashboard.map(s => ({ silo_id: s.id, numero: s.numero, animais: s.animais_atrelados, percentual: s.percentual_animais }))
        },
            // Alertas formatados com os campos esperados pelo frontend
        alertas: dashboard.filter(s => s.dias_restantes <= 5).map(s => ({
          id: s.id,
          silo_id: s.id,
          numero: s.numero,
          nivel_alerta: s.nivel_alerta,
          dias_restantes: s.dias_restantes,
          prioridade: determinarNivelAlerta(s.dias_restantes).prioridade
        })),
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Erro no dashboard:', error);
    res.status(500).json({ 
      error: 'Erro interno no servidor',
      detalhes: error.message 
    });
  }
});

// Endpoint para testar notificações (email/sms/whatsapp)
app.post('/api/notify/test', async (req, res) => {
  try {
    const { channel, to, message } = req.body;
    if (!channel || !['email','sms','whatsapp'].includes(channel)) {
      return res.status(400).json({ success: false, error: 'channel inválido: use email, sms ou whatsapp' });
    }

    const payload = message || `Teste de notificação: canal=${channel} - ${new Date().toISOString()}`;
    let result = false;
    let info = '';

    if (channel === 'email') {
      const destino = to || ADMIN_CONTACTS.email;
      result = await sendEmail(destino, 'Teste de Notificação - PigFeed Manager', payload);
      info = `email -> ${destino}`;
    } else if (channel === 'sms') {
      const destino = to || ADMIN_CONTACTS.phone_sms;
      result = await sendSMS(destino, payload);
      info = `sms -> ${destino}`;
    } else if (channel === 'whatsapp') {
      const destino = to || ADMIN_CONTACTS.phone_whatsapp;
      result = await sendWhatsApp(destino, payload);
      info = `whatsapp -> ${destino}`;
    }

    res.json({ success: result, channel, info, message: result ? 'Enviado' : 'Falha (ver logs / configs)' });
  } catch (error) {
    console.error('❌ Erro em /api/notify/test:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint simples: animais por silo
app.get('/api/silos/animais', (req, res) => {
  try {
    const total_animais = lotes.reduce((sum, l) => sum + l.quantidade_atual, 0);
    const lista = silos.map(silo => {
      const animais = lotes.filter(l => l.silo_id === silo.id).reduce((sum, l) => sum + l.quantidade_atual, 0);
      return { silo_id: silo.id, numero: silo.numero, animais, percentual: total_animais > 0 ? ((animais / total_animais) * 100).toFixed(1) : '0.0' };
    });
    res.json({ status: 'success', data: lista, totais: { animais_total: total_animais } });
  } catch (error) {
    console.error('❌ Erro ao buscar animais por silo:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

// 3. Registrar consumo
app.post('/api/consumo', (req, res) => {
  try {
    const { silo_id, quantidade_kg, mortes, temperatura } = req.body;
    
    console.log(`📉 Registrando consumo: Silo ${silo_id}, ${quantidade_kg}kg`);
    
    const silo = silos.find(s => s.id === silo_id);
    if (!silo) {
      return res.status(404).json({ 
        error: 'Silo não encontrado',
        silos_disponiveis: silos.map(s => ({ id: s.id, numero: s.numero }))
      });
    }

    // Validar quantidade
    if (quantidade_kg > silo.racao_atual_kg) {
      return res.status(400).json({
        error: 'Quantidade maior que ração disponível',
        racao_disponivel: silo.racao_atual_kg,
        quantidade_solicitada: quantidade_kg,
        diferenca: quantidade_kg - silo.racao_atual_kg
      });
    }

    const racaoAnterior = silo.racao_atual_kg;
    
    // Atualizar ração
    silo.racao_atual_kg -= quantidade_kg;
    if (silo.racao_atual_kg < 0) silo.racao_atual_kg = 0;
    
    // Atualizar mortes nos lotes
    let mortesTotais = 0;
    if (mortes > 0) {
      const lotesSilo = lotes.filter(l => l.silo_id === silo_id);
      const mortesPorLote = Math.max(1, Math.floor(mortes / lotesSilo.length));
      
      lotesSilo.forEach(lote => {
        const mortesAplicadas = Math.min(mortesPorLote, lote.quantidade_atual);
        lote.quantidade_atual -= mortesAplicadas;
        lote.mortalidade_acumulada += mortesAplicadas;
        mortesTotais += mortesAplicadas;
      });
    }

    // Registrar no histórico
    historicoMudancas.push({
      id: uuidv4(),
      tipo: 'consumo',
      silo_id: silo_id,
      quantidade_kg: quantidade_kg,
      mortes: mortesTotais,
      racao_anterior: racaoAnterior,
      racao_atual: silo.racao_atual_kg,
      timestamp: new Date().toISOString()
    });

    // Limitar histórico
    if (historicoMudancas.length > 100) {
      historicoMudancas = historicoMudancas.slice(-100);
    }

    // Salvar estado
    saveData();

    // Calcular novos valores
    const lotesSilo = lotes.filter(l => l.silo_id === silo_id);
    const consumoDiario = lotesSilo.reduce((total, lote) => 
      total + calcularConsumoDiario(lote, temperatura), 0);
    const diasRestantes = calcularDiasRestantes(silo, consumoDiario);
    const nivelAlerta = determinarNivelAlerta(diasRestantes);

    // Notificar se necessário
    if (['CRITICO','URGENTE','ALERTA'].includes(nivelAlerta.nivel)) {
      notifyAlert(silo, `Silo ${silo.numero} com nível ${nivelAlerta.nivel} - ${diasRestantes} dias restantes`);
    }

    res.json({ 
      success: true, 
      message: `Consumo de ${quantidade_kg}kg registrado no Silo ${silo.numero}${mortesTotais > 0 ? ` (${mortesTotais} mortes)` : ''}`,
      silo: { 
        id: silo.id,
        numero: silo.numero,
        racao_anterior: racaoAnterior,
        racao_restante: silo.racao_atual_kg,
        percentual: ((silo.racao_atual_kg / silo.capacidade_kg) * 100).toFixed(1),
        consumo_diario: Math.round(consumoDiario),
        dias_restantes: diasRestantes,
        nivel_alerta: nivelAlerta.nivel,
        cor_alerta: nivelAlerta.cor,
        lotes_afetados: lotesSilo.length,
        mortes_registradas: mortesTotais
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Erro no consumo:', error);
    res.status(500).json({ 
      error: 'Erro ao processar consumo',
      detalhes: error.message 
    });
  }
});

// 4. Registrar recarga - VERSÃO MELHORADA
app.post('/api/recarga', (req, res) => {
  try {
    const { silo_id, quantidade_kg, tipo_racao } = req.body;
    
    console.log(`📦 Recebendo recarga: Silo ${silo_id}, ${quantidade_kg}kg, Tipo: ${tipo_racao || 'mantém'}`);
    
    const silo = silos.find(s => s.id === silo_id);
    if (!silo) {
      return res.status(404).json({ 
        error: 'Silo não encontrado',
        silos_disponiveis: silos.map(s => ({ 
          id: s.id, 
          numero: s.numero, 
          tipo: s.tipo_racao,
          capacidade: `${s.capacidade_ton} ton`
        }))
      });
    }

    const capacidadeKg = silo.capacidade_ton * 1000;
    const espacoDisponivel = capacidadeKg - silo.racao_atual_kg;
    
    // Validar quantidade
    if (quantidade_kg > espacoDisponivel) {
      return res.status(400).json({ 
        error: 'Capacidade do silo excedida',
        capacidade_total: capacidadeKg,
        racao_atual: silo.racao_atual_kg,
        espaco_disponivel: espacoDisponivel,
        quantidade_solicitada: quantidade_kg,
        excedente: quantidade_kg - espacoDisponivel,
        recomendacao: `Quantidade máxima: ${espacoDisponivel}kg`
      });
    }

    // Validar tipo de ração
    const tiposValidos = ['inicial', 'crescimento1', 'crescimento2', 'finalizacao'];
    if (tipo_racao && !tiposValidos.includes(tipo_racao)) {
      return res.status(400).json({
        error: 'Tipo de ração inválido',
        tipos_validos: tiposValidos,
        tipo_recebido: tipo_racao,
        exemplo: 'Use: "inicial", "crescimento1", "crescimento2" ou "finalizacao"'
      });
    }

    const racaoAnterior = silo.racao_atual_kg;
    const tipoAnterior = silo.tipo_racao;
    
    // Atualizar silo
    silo.racao_atual_kg += quantidade_kg;
    if (tipo_racao) {
      silo.tipo_racao = tipo_racao;
    }
    silo.ultima_recarga = new Date().toISOString();
    
    // Atualizar lotes com novo tipo de ração **APENAS** se solicitado (flag aplicar_a_lotes)
    let lotesAtualizados = 0;
    if (tipo_racao && req.body.aplicar_a_lotes === true) {
      const lotesSilo = lotes.filter(l => l.silo_id === silo_id);
      lotesSilo.forEach(lote => {
        lote.fase_crescimento = tipo_racao;
        lotesAtualizados++;
      });
    }

    // Registrar no histórico
    historicoMudancas.push({
      id: uuidv4(),
      tipo: 'recarga',
      silo_id: silo_id,
      quantidade_kg: quantidade_kg,
      tipo_racao: tipo_racao || tipoAnterior,
      racao_anterior: racaoAnterior,
      racao_atual: silo.racao_atual_kg,
      lotes_atualizados: lotesAtualizados,
      timestamp: new Date().toISOString()
    });

    // Salvar estado
    saveData();

    // Limitar histórico
    if (historicoMudancas.length > 100) {
      historicoMudancas = historicoMudancas.slice(-100);
    }

    // Recalcular valores antes e depois para determinar se o alerta mudou
    const lotesSiloAntes = lotes.filter(l => l.silo_id === silo_id);
    const consumoAntes = lotesSiloAntes.reduce((total, lote) => total + calcularConsumoDiario(lote), 0);
    const diasAntes = calcularDiasRestantes(Object.assign({}, silo, { racao_atual_kg: racaoAnterior }), consumoAntes);
    const nivelAntes = determinarNivelAlerta(diasAntes).nivel;

    const lotesSilo = lotes.filter(l => l.silo_id === silo_id);
    const consumoDiario = lotesSilo.reduce((total, lote) => total + calcularConsumoDiario(lote), 0);
    const diasRestantes = calcularDiasRestantes(silo, consumoDiario);
    const nivelAlerta = determinarNivelAlerta(diasRestantes);
    const pedidoRecomendado = calcularQuantidadePedido(silo, consumoDiario);

    // Montar objeto de alerta para o frontend
    const alerta = {
      melhorou: false,
      nivel_anterior: nivelAntes,
      nivel_atual: nivelAlerta.nivel
    };

    if (nivelAntes !== nivelAlerta.nivel) {
      alerta.melhorou = ['CRITICO','URGENTE','ALERTA'].indexOf(nivelAlerta.nivel) < ['CRITICO','URGENTE','ALERTA'].indexOf(nivelAntes);
    }

    // Notificar se o nível é crítico/urgente/alerta
    if (['CRITICO','URGENTE','ALERTA'].includes(nivelAlerta.nivel)) {
      notifyAlert(silo, `Silo ${silo.numero} com nível ${nivelAlerta.nivel} - ${diasRestantes} dias restantes`);
    }

    res.json({ 
      success: true, 
      message: `✅ Recarga de ${quantidade_kg}kg registrada no Silo ${silo.numero}${tipo_racao ? ` (Tipo: ${tipo_racao})` : ''}`,
      silo: { 
        id: silo.id,
        numero: silo.numero,
        racao_anterior: racaoAnterior,
        racao_atual: silo.racao_atual_kg,
        diferenca: quantidade_kg,
        percentual: ((silo.racao_atual_kg / capacidadeKg) * 100).toFixed(1),
        tipo_racao: silo.tipo_racao,
        tipo_anterior: tipoAnterior,
        capacidade_total: capacidadeKg,
        espaco_restante: capacidadeKg - silo.racao_atual_kg,
        consumo_diario: Math.round(consumoDiario),
        dias_restantes: diasRestantes,
        nivel_alerta: nivelAlerta.nivel,
        cor_alerta: nivelAlerta.cor,
        ultima_recarga: silo.ultima_recarga,
        lotes_afetados: lotesSilo.length,
        lotes_atualizados: lotesAtualizados
      },
      alerta: {
        nivel_anterior: determinarNivelAlerta(calcularDiasRestantes(
          {...silo, racao_atual_kg: racaoAnterior}, 
          consumoDiario
        )).nivel,
        nivel_atual: nivelAlerta.nivel,
        melhorou: diasRestantes > calcularDiasRestantes(
          {...silo, racao_atual_kg: racaoAnterior}, 
          consumoDiario
        )
      },
      recomendacao: {
        proxima_recarga_estimada: diasRestantes > 0 ? `Em ${Math.max(0, diasRestantes - 2)} dias` : 'URGENTE',
        quantidade_sugerida: pedidoRecomendado.quantidade_kg,
        sacas_sugeridas: pedidoRecomendado.quantidade_sacas,
        alerta_proxima_recarga: diasRestantes <= 5 ? `⚠️ Fique atento!` : '✅ Estável'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Erro na recarga:', error);
    res.status(500).json({ 
      error: 'Erro interno ao processar recarga',
      detalhes: error.message,
      sugestao: 'Verifique os dados e tente novamente'
    });
  }
});

// 5. Simular passagem de 1 dia
app.post('/api/simular-dia', (req, res) => {
  try {
    const resultados = [];
    let consumoTotal = 0;
    let mortesTotal = 0;
    
    console.log('📅 Simulando passagem de 1 dia...');
    
    silos.forEach(silo => {
      const lotesSilo = lotes.filter(l => l.silo_id === silo.id);
      
      lotesSilo.forEach(lote => {
        // Mortes do dia
        const taxaMortalidade = CONSTANTES.MORTALIDADE_POR_FASE[lote.fase_crescimento];
        const mortesDia = Math.floor(lote.quantidade_atual * taxaMortalidade);
        mortesTotal += mortesDia;
        
        if (mortesDia > 0) {
          lote.quantidade_atual -= mortesDia;
          lote.mortalidade_acumulada += mortesDia;
        }
        
        // Consumo do dia
        const consumoDiario = calcularConsumoDiario(lote);
        consumoTotal += consumoDiario;
        
        // Aplicar consumo ao silo
        silo.racao_atual_kg -= consumoDiario;
        if (silo.racao_atual_kg < 0) silo.racao_atual_kg = 0;
        
        resultados.push({
          lote: lote.id,
          silo: silo.id,
          mortes_dia: mortesDia,
          consumo_dia: Math.round(consumoDiario),
          animais_restantes: lote.quantidade_atual,
          racao_restante: Math.round(silo.racao_atual_kg),
          fase: lote.fase_crescimento
        });
      });
    });

    // Registrar simulação no histórico
    historicoMudancas.push({
      id: uuidv4(),
      tipo: 'simulacao_dia',
      consumo_total: Math.round(consumoTotal),
      mortes_total: mortesTotal,
      silos_afetados: resultados.length,
      timestamp: new Date().toISOString()
    });

    // Verificar alertas após simulação
    const alertas = silos.map(silo => {
      const lotesSilo = lotes.filter(l => l.silo_id === silo.id);
      const consumoDiario = lotesSilo.reduce((total, lote) => 
        total + calcularConsumoDiario(lote), 0);
      const diasRestantes = calcularDiasRestantes(silo, consumoDiario);
      
      return {
        silo_id: silo.id,
        numero: silo.numero,
        dias_restantes: diasRestantes,
        nivel_alerta: determinarNivelAlerta(diasRestantes).nivel,
        precisa_atencao: diasRestantes <= 3
      };
    }).filter(a => a.precisa_atencao);

    // Salvar estado após simulação
    saveData();

    // Notificar alertas gerados
    alertas.forEach(a => notifyAlert({ numero: a.numero, id: a.silo_id }, `Silo ${a.numero} precisa de atenção: ${a.dias_restantes} dias restantes (${a.nivel_alerta})`));

    res.json({
      success: true,
      message: '✅ Dia simulado com sucesso!',
      resumo: {
        total_consumo: Math.round(consumoTotal),
        total_mortes: mortesTotal,
        simulacoes: resultados.length,
        alertas_gerados: alertas.length,
        data_simulacao: new Date().toISOString().split('T')[0]
      },
      resultados: resultados,
      alertas: alertas,
      recomendacao: alertas.length > 0 ? 
        `⚠️ ${alertas.length} silos necessitam de atenção` : 
        '✅ Todos os silos estão estáveis'
    });
  } catch (error) {
    console.error('❌ Erro na simulação:', error);
    res.status(500).json({ error: 'Erro ao simular dia' });
  }
});

// 6. Listar lotes
app.get('/api/lotes', (req, res) => {
  res.json({
    status: 'success',
    data: lotes.map(lote => ({
      ...lote,
      consumo_diario: Math.round(calcularConsumoDiario(lote)),
      dias_na_fase: Math.floor((Date.now() - new Date(lote.data_entrada).getTime()) / (1000 * 60 * 60 * 24)),
      necessidade_recarga: calcularConsumoDiario(lote) * 2 // 2 dias de consumo
    })),
    total: lotes.length
  });
});



// 8. Detalhes do silo
app.get('/api/silos/:id', (req, res) => {
  const siloId = parseInt(req.params.id);
  const silo = silos.find(s => s.id === siloId);
  
  if (!silo) {
    return res.status(404).json({ error: 'Silo não encontrado' });
  }
  
  const lotesSilo = lotes.filter(l => l.silo_id === siloId);
  const consumoDiario = lotesSilo.reduce((total, lote) => total + calcularConsumoDiario(lote), 0);
  const diasRestantes = calcularDiasRestantes(silo, consumoDiario);
  const nivelAlerta = determinarNivelAlerta(diasRestantes);
  
  res.json({
    status: 'success',
    data: {
      silo: {
        ...silo,
        percentual_preenchido: ((silo.racao_atual_kg / silo.capacidade_kg) * 100).toFixed(1),
        consumo_diario_kg: Math.round(consumoDiario),
        dias_restantes: diasRestantes,
        nivel_alerta: nivelAlerta.nivel,
        cor_alerta: nivelAlerta.cor,
        prioridade: nivelAlerta.prioridade
      },
      lotes: lotesSilo.map(l => ({
        id: l.id,
        quantidade_atual: l.quantidade_atual,
        fase_crescimento: l.fase_crescimento,
        consumo_estimado: Math.round(calcularConsumoDiario(l)),
        peso_medio: l.peso_medio_kg,
        dias_alimentacao: Math.floor((Date.now() - new Date(l.data_entrada).getTime()) / (1000 * 60 * 60 * 24))
      })),
      historico: historicoMudancas
        .filter(h => h.silo_id === siloId)
        .slice(-10)
        .reverse()
    }
  });
});

// 9. Histórico de mudanças
app.get('/api/historico', (req, res) => {
  const limite = parseInt(req.query.limite) || 20;
  const historicoFiltrado = historicoMudancas.slice(-limite).reverse();
  
  res.json({
    success: true,
    total: historicoMudancas.length,
    exibindo: historicoFiltrado.length,
    historico: historicoFiltrado,
    tipos: ['recarga', 'consumo', 'simulacao_dia'],
    periodo: {
      primeiro: historicoMudancas.length > 0 ? historicoMudancas[0].timestamp : null,
      ultimo: historicoMudancas.length > 0 ? historicoMudancas[historicoMudancas.length - 1].timestamp : null
    }
  });
});

// 10. Recalcular alertas
app.post('/api/recalcular-alertas', (req, res) => {
  try {
    const alertas = silos.map(silo => {
      const lotesSilo = lotes.filter(l => l.silo_id === silo.id);
      const consumoDiario = lotesSilo.reduce((total, lote) => 
        total + calcularConsumoDiario(lote), 0);
      const diasRestantes = calcularDiasRestantes(silo, consumoDiario);
      const nivelAlerta = determinarNivelAlerta(diasRestantes);
      
      return {
        silo_id: silo.id,
        numero: silo.numero,
        racao_atual: silo.racao_atual_kg,
        consumo_diario: Math.round(consumoDiario),
        dias_restantes: diasRestantes,
        nivel_alerta: nivelAlerta.nivel,
        cor_alerta: nivelAlerta.cor,
        prioridade: nivelAlerta.prioridade,
        precisa_atencao: diasRestantes <= 3
      };
    });
    
    // Ordenar por prioridade
    alertas.sort((a, b) => a.prioridade - b.prioridade);
    
    res.json({
      success: true,
      message: '✅ Alertas recalculados com sucesso!',
      total_silos: alertas.length,
      alertas_ativos: alertas.filter(a => a.precisa_atencao).length,
      alertas: alertas,
      criticos: alertas.filter(a => a.nivel_alerta === 'CRITICO').length,
      urgentes: alertas.filter(a => a.nivel_alerta === 'URGENTE').length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao recalcular alertas' });
  }
});

// 11. Status do sistema
app.get('/api/status', (req, res) => {
  const lotesSilo = lotes.reduce((acc, lote) => {
    if (!acc[lote.silo_id]) acc[lote.silo_id] = [];
    acc[lote.silo_id].push(lote);
    return acc;
  }, {});
  
  const consumoPorSilo = Object.entries(lotesSilo).map(([siloId, lotes]) => {
    const silo = silos.find(s => s.id == siloId);
    const consumo = lotes.reduce((sum, l) => sum + calcularConsumoDiario(l), 0);
    return {
      silo_id: siloId,
      consumo_diario: Math.round(consumo),
      dias_restantes: calcularDiasRestantes(silo, consumo)
    };
  });
  
  res.json({
    status: 'online',
    sistema: 'PigFeed Manager',
    versao: '1.0.0',
    ambiente: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoria: process.memoryUsage(),
    estatisticas: {
      silos: silos.length,
      lotes: lotes.length,
      animais_total: lotes.reduce((sum, l) => sum + l.quantidade_atual, 0),
      racao_total_kg: silos.reduce((sum, s) => sum + s.racao_atual_kg, 0),
      capacidade_total_ton: silos.reduce((sum, s) => sum + s.capacidade_ton, 0),
      consumo_total_diario: consumoPorSilo.reduce((sum, s) => sum + s.consumo_diario, 0),
      alertas_ativos: consumoPorSilo.filter(s => s.dias_restantes <= 3).length
    },
    consumo_por_silo: consumoPorSilo,
    historico_tamanho: historicoMudancas.length
  });
});

// ========== INICIAR SERVIDOR ==========
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`╔══════════════════════════════════════════╗`);
    console.log(`║     🐷 PIGFEED MANAGER API v1.0.0       ║`);
    console.log(`╠══════════════════════════════════════════╣`);
    console.log(`║ ✅ Porta: ${PORT}                          ║`);
    console.log(`║ 🌐 URL: http://localhost:${PORT}           ║`);
    console.log(`║ 📊 Dashboard: http://localhost:${PORT}/api/dashboard ║`);
    console.log(`╠══════════════════════════════════════════╣`);
    console.log(`║ 🏭 Silos monitorados: ${silos.length}          ║`);
    console.log(`║ 📦 Lotes ativos: ${lotes.length}              ║`);
    console.log(`║ 🐷 Total animais: ${lotes.reduce((s, l) => s + l.quantidade_atual, 0)} ║`);
    console.log(`║ 📊 Capacidade total: ${silos.reduce((s, silo) => s + silo.capacidade_ton, 0)} ton ║`);
    console.log(`╠══════════════════════════════════════════╣`);
    console.log(`║ 🔄 Para parar: CTRL + C                  ║`);
    console.log(`╚══════════════════════════════════════════╝`);
    console.log(`\n📋 Endpoints principais:`);
    console.log(`   GET  /api/dashboard          - Dashboard completo`);
    console.log(`   POST /api/recarga            - Registrar recarga`);
    console.log(`   POST /api/consumo            - Registrar consumo`);
    console.log(`   POST /api/simular-dia        - Simular 1 dia`);
  });
}

module.exports = app;

// Tratamento de erro na porta
app.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ ERRO: Porta ${PORT} já está em uso!`);
    console.log('🔧 Solução:');
    console.log('   1. Execute: netstat -ano | findstr :3000');
    console.log('   2. Para cada PID listado: taskkill /PID <NUMERO> /F');
    console.log('   3. Ou altere a porta em server.js (linha 9)');
    console.log('   4. Reinicie o servidor');
  }
});